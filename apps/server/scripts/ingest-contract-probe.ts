import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import fastifySSE from 'fastify-sse-v2';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import traceIdPlugin from '../src/plugins/trace-id.js';
import ingestRoutes from '../src/routes/ingest.js';
import { parseXhsInput } from '../src/ingest/link-parser.js';
import { selectBranchCandidates } from '../src/ingest/branch-rules.js';
import { runIngestPipeline } from '../src/ingest/pipeline.js';
import { clearIngestStateForTests, createOrGetIngestJob, getJob } from '../src/ingest/store.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJson(response: { body: string }) {
  return JSON.parse(response.body) as Record<string, any>;
}

async function buildIngestApp() {
  const app = Fastify({ logger: false });
  await app.register(fastifySSE as any);
  await app.register(cookie);
  await app.register(traceIdPlugin);
  await app.register(errorEnvelope);
  await app.register(authPlugin);
  await app.register(ingestRoutes);
  await app.ready();
  return app;
}

async function main() {
  delete process.env.DATABASE_URL;
  clearIngestStateForTests();

  const parsed = parseXhsInput({
    share_text: '先看 https://www.xiaohongshu.com/explore/one 再看 https://xhslink.com/two',
  });
  assert(parsed.url === 'https://www.xiaohongshu.com/explore/one', 'should use the first XHS link');
  assert(parsed.extraUrls.length === 1, 'should report extra XHS links');
  assert(parsed.warning?.code === 'INGEST_SINGLE_LINK_ONLY', 'multi-link input should produce a warning code');

  const invalid = parseXhsInput({ share_text: '杭州 11/2 起 3天' });
  assert(!invalid.url, 'non-XHS text should not parse as ingest URL');
  assert(invalid.error?.code === 'INGEST_XHS_URL_REQUIRED', 'invalid text should produce URL-required error');

  const branches = [
    {
      name: '星巴克 西湖店',
      address: '连锁地址',
      lat: 30.001,
      lon: 120.001,
      distanceMeters: 20,
      confidence: 0.99,
    },
    ...Array.from({ length: 25 }, (_, index) => ({
      name: `分店 ${index}`,
      address: `地址 ${index}`,
      lat: 30 + index * 0.001,
      lon: 120 + index * 0.001,
      distanceMeters: index * 120,
      confidence: 0.9 - index * 0.01,
    })),
  ];
  const selected = selectBranchCandidates(branches, { lat: 30, lon: 120 });
  assert(selected.length === 5, 'branch candidates should store only Top-5');
  assert(selected.every((candidate) => !candidate.name.includes('星巴克')), 'chain suppression should remove configured chains');
  assert(selected.every((candidate) => candidate.distanceMeters <= 2000), 'branch candidates should be cropped to 2km');
  assert(selected[0].rank === 1 && selected[4].rank === 5, 'branch candidates should be ranked');

  const firstJob = await createOrGetIngestJob({
    userId: 'user-a',
    sourceUrl: 'https://www.xiaohongshu.com/explore/one',
    traceId: 'trace-pipeline',
  });
  const duplicateJob = await createOrGetIngestJob({
    userId: 'user-a',
    sourceUrl: 'https://www.xiaohongshu.com/explore/one',
    traceId: 'trace-pipeline-duplicate',
  });
  const otherUserJob = await createOrGetIngestJob({
    userId: 'user-b',
    sourceUrl: 'https://www.xiaohongshu.com/explore/one',
    traceId: 'trace-pipeline-other',
  });
  assert(firstJob.id === duplicateJob.id, 'same user and URL should reuse ingest job');
  assert(firstJob.id !== otherUserJob.id, 'different users should not collide on source hash');

  await runIngestPipeline(firstJob.id);
  const completedJob = getJob(firstJob.id);
  assert(completedJob?.status === 'done', 'pipeline should finish as done with stub adapters');
  const states = completedJob.events.map((event) => event.state);
  for (const expected of ['created', 'fetching', 'parsing', 'geo', 'storing', 'done']) {
    assert(states.includes(expected), `pipeline should emit ${expected}`);
  }
  const parsingSubStages = completedJob.events.filter((event) => event.state === 'parsing').map((event) => event.sub_stage).join(',');
  assert(parsingSubStages === 'text,ocr,vision', 'pipeline should emit parsing diagnostic sub-stages');

  process.env.INGEST_STUB_FAIL_STAGE = 'fetch,extract,geo,rehost';
  const degradedJob = await createOrGetIngestJob({
    userId: 'user-a',
    sourceUrl: 'https://www.xiaohongshu.com/explore/degraded',
    traceId: 'trace-pipeline-degraded',
  });
  await runIngestPipeline(degradedJob.id);
  delete process.env.INGEST_STUB_FAIL_STAGE;
  const degraded = getJob(degradedJob.id);
  assert(degraded?.status === 'done', 'degraded adapter failures should still finish as done');
  const failedCodes = degraded.events.filter((event) => event.state === 'failed').map((event) => event.error_code);
  for (const expected of ['INGEST_XHS_FETCH_DEGRADED', 'INGEST_EXTRACTION_DEGRADED', 'INGEST_GEO_DEGRADED', 'INGEST_REHOST_DEGRADED']) {
    assert(failedCodes.includes(expected), `degraded pipeline should record ${expected}`);
  }

  const app = await buildIngestApp();
  try {
    const unauth = await app.inject({
      method: 'GET',
      url: '/ingest/ing_missing/events',
      headers: { 'x-trace-id': 'trace-ingest-probe' },
    });
    assert(unauth.statusCode === 401, 'ingest SSE should require auth');
    assert(parseJson(unauth).error_code === 'AUTH_SESSION_EXPIRED', 'unauth SSE should use auth error envelope');

    const invalidStart = await app.inject({
      method: 'POST',
      url: '/ingest/xhs',
      headers: {
        'x-trace-id': 'trace-ingest-probe',
        'x-user-id': '00000000-0000-4000-8000-000000000001',
        'x-device-id': 'ingest-probe',
      },
      payload: { url: 'https://example.com/not-xhs' },
    });
    assert(invalidStart.statusCode === 400, 'non-XHS URL should be rejected');
    assert(parseJson(invalidStart).error_code === 'INGEST_XHS_URL_REQUIRED', 'invalid ingest should use ingest error code');

    const start = await app.inject({
      method: 'POST',
      url: '/ingest/xhs',
      headers: {
        'x-trace-id': 'trace-ingest-probe',
        'x-user-id': '00000000-0000-4000-8000-000000000001',
        'x-device-id': 'ingest-probe',
      },
      payload: {
        share_text: 'https://xhslink.com/first https://www.xiaohongshu.com/explore/second',
      },
    });
    assert(start.statusCode === 202, 'canonical ingest start should return 202');
    const body = parseJson(start);
    assert(body.ingest_id?.startsWith('ing_'), 'ingest response should include ingest_id');
    assert(body.sse_url === `/ingest/${body.ingest_id}/events`, 'canonical response should use canonical SSE URL');
    assert(body.warning?.code === 'INGEST_SINGLE_LINK_ONLY', 'multi-link response should include warning copy');

    const legacy = await app.inject({
      method: 'POST',
      url: '/ingest/start',
      headers: {
        'x-trace-id': 'trace-ingest-probe',
        'x-user-id': '00000000-0000-4000-8000-000000000001',
        'x-device-id': 'ingest-probe',
      },
      payload: { source: 'xhs', url: 'https://www.xiaohongshu.com/explore/legacy' },
    });
    assert(legacy.statusCode === 202, 'deprecated ingest start should remain compatible');
    assert(parseJson(legacy).sse_url.startsWith('/sse/ingest/'), 'deprecated ingest start should keep legacy SSE URL');
  } finally {
    await app.close();
  }

  console.log('ingest contract probe ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
