import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

type IngestEvent = { state: string; sub_stage?: string };
const complete: IngestEvent[] = [
  { state: 'created' }, { state: 'fetching' },
  { state: 'parsing', sub_stage: 'multimodal' },
  { state: 'parsing', sub_stage: 'multimodal' },
  { state: 'geo' }, { state: 'storing' }, { state: 'done' },
];

async function runProbe(ingest: IngestEvent[]) {
  const server = createServer((req, res) => {
    const path = req.url ?? '';
    if (req.method === 'POST') {
      req.resume();
      const kind = path === '/ingest/xhs' ? 'ingest' : path === '/plan/generate' ? 'plan' : 'fill';
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ plan_id: 'synthetic-plan', sse_url: `/sse/${kind}` }));
      return;
    }
    const kind = path.slice('/sse/'.length);
    const events = kind === 'ingest' ? ingest : kind === 'plan'
      ? ['started', 'freeze', 'selected_anchor', 'quota', 'candidates', 'place', 'validate', 'persist', 'done'].map((phase) => ({ phase }))
      : [{ phase: 'started' }, { phase: 'done' }];
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end(events.map((event) => `event: ${kind}\ndata: ${JSON.stringify(event)}\n\n`).join(''));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    return await promisify(execFile)(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./sse-assert.ts', import.meta.url))], {
      env: { ...process.env, API_BASE: `http://127.0.0.1:${address.port}` }, timeout: 5000,
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

await test('actual SSE gate accepts repeated durable parsing updates and rejects missing or invalid stages', async () => {
  const positive = await runProbe(complete);
  assert.match(positive.stdout, /SSE gates ok/);
  for (const events of [
    complete.map(({ state }) => ({ state })),
    complete.map((event) => event.sub_stage ? { ...event, sub_stage: 'unexpected-stage' } : event),
  ]) await assert.rejects(runProbe(events), /ingest parsing sub-stages mismatch/);
  await assert.rejects(runProbe(complete.filter((event) => event.state !== 'geo')), /ingest missing stages: geo/);
});
