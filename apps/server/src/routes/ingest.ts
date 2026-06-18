import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';
import { authGuard } from '../plugins/auth.js';
import { IngestStartBody, IngestXhsBody } from '../schemas.js';
import { parseXhsInput } from '../ingest/link-parser.js';
import { createOrGetIngestJob, dbUserIdFor, getOrHydrateJob, subscribeToIngest } from '../ingest/store.js';
import { startIngestPipeline } from '../ingest/pipeline.js';
import type { IngestEvent, IngestStartResult } from '../ingest/types.js';

function traceIdFor(req: any) {
  return req.traceId || (req.headers['x-trace-id'] as string | undefined) || randomUUID();
}

async function startIngest(req: any, reply: any, input: { url?: string | null; share_text?: string | null }, options: { legacySseUrl: boolean }) {
  const parsed = parseXhsInput(input);
  if (!parsed.url) {
    return reply.sendError(parsed.error!.code, parsed.error!.message, 400, false);
  }

  const traceId = traceIdFor(req);
  const job = await createOrGetIngestJob({
    userId: req.user!.id,
    sourceUrl: parsed.url,
    traceId,
    warning: parsed.warning,
  });
  startIngestPipeline(job.id);

  const body: IngestStartResult = {
    ingest_id: job.id,
    state: 'created',
    sse_url: options.legacySseUrl ? `/sse/ingest/${job.id}` : `/ingest/${job.id}/events`,
    warning: parsed.warning,
  };
  return reply.header('X-Trace-Id', traceId).code(202).send(body);
}

function sendIngestEvent(reply: any, event: IngestEvent) {
  reply.sse({ event: 'ingest', data: JSON.stringify(event) });
}

async function streamIngestEvents(req: any, reply: any, jobId: string) {
  const job = await getOrHydrateJob(jobId);
  if (!job) {
    return reply.sendError('INGEST_JOB_NOT_FOUND', 'ingest job not found', 404, false);
  }
  if (job.dbUserId !== dbUserIdFor(req.user!.id)) {
    return reply.sendError('INGEST_JOB_NOT_FOUND', 'ingest job not found', 404, false);
  }

  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Trace-Id', job.traceId);

  for (const event of job.events) sendIngestEvent(reply, event);
  const unsubscribe = subscribeToIngest(job.id, (event) => sendIngestEvent(reply, event));
  const heartbeatMs = Number(process.env.SSE_HEARTBEAT_MS || 10000);
  const idleTimeoutMs = Number(process.env.SSE_IDLE_TIMEOUT_MS || 30000);
  let lastEventAt = Date.now();
  const markEvent = subscribeToIngest(job.id, () => {
    lastEventAt = Date.now();
  });
  const ping = setInterval(() => {
    const now = Date.now();
    if (now - lastEventAt > idleTimeoutMs) {
      reply.sse({
        event: 'error',
        data: JSON.stringify({
          trace_id: job.traceId,
          ingest_id: job.id,
          state: 'failed',
          error_code: 'SSE_IDLE_TIMEOUT',
          error_message: 'idle timeout',
          retriable: true,
          ts: now,
        }),
      });
      clearInterval(ping);
      try { reply.raw.end(); } catch {}
      return;
    }
    reply.sse({
      event: 'ping',
      data: JSON.stringify({ trace_id: job.traceId, ingest_id: job.id, seq: now, heartbeat_ms: heartbeatMs, ts: now }),
    });
  }, heartbeatMs);

  req.raw.on('close', () => {
    clearInterval(ping);
    unsubscribe();
    markEvent();
  });
}

export default fp(async (app) => {
  app.post('/ingest/xhs', { preHandler: authGuard, config: { rateLimit: { max: 30, timeWindow: 24 * 60 * 60 * 1000 } } }, async (req: any, reply: any) => {
    const parsed = IngestXhsBody.safeParse(req.body ?? {});
    if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid ingest body', 400, false, { issues: parsed.error.issues });
    return startIngest(req, reply, parsed.data, { legacySseUrl: false });
  });

  app.post('/ingest/start', { preHandler: authGuard, config: { rateLimit: { max: 30, timeWindow: 24 * 60 * 60 * 1000 } } }, async (req: any, reply: any) => {
    const parsed = IngestStartBody.safeParse(req.body ?? {});
    if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid ingest body', 400, false, { issues: parsed.error.issues });
    return startIngest(req, reply, parsed.data, { legacySseUrl: true });
  });

  app.get('/ingest/:jobId/events', { preHandler: authGuard }, async (req: any, reply: any) => {
    return streamIngestEvents(req, reply, req.params.jobId);
  });

  app.get('/sse/ingest/:id', { preHandler: authGuard }, async (req: any, reply: any) => {
    return streamIngestEvents(req, reply, req.params.id);
  });
});
