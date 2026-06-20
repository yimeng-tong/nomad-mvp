import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import fastifyPlugin from 'fastify-plugin';
import fastifySSE from 'fastify-sse-v2';
import { randomUUID } from 'node:crypto';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import authPlugin, { authGuard } from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import ingestRoutes from './routes/ingest.js';
import homeRoutes from './routes/home.js';
import libraryRoutes from './routes/library.js';
import searchRoutes from './routes/search.js';
import planRoutes from './routes/plan.js';
import byokRoutes from './routes/byok.js';
import accountRoutes from './routes/account.js';
import feedbackRoutes from './routes/feedback.js';
import queuesPlugin from './plugins/queues.js';
import traceIdPlugin from './plugins/trace-id.js';
import errorEnvelope from './plugins/error-envelope.js';
import idempotency from './plugins/idempotency.js';
import idempotencyRedis from './plugins/idempotency-redis.js';
import { sentryInit, trackFillRun } from './integrations/telemetry.js';
import { initFlags, isEnabled } from './integrations/flags.js';
import { z } from 'zod';
import { AiFillBody, ExportBody } from './schemas.js';
import type { components } from '../../../packages/types/src/api-types.js';
type AiFillRequest = components['schemas']['AiFillRequest'];
type AiFillResponse = components['schemas']['AiFillResponse'];
type ExportPngRequest = components['schemas']['ExportPngRequest'];
type ExportPngResponse = components['schemas']['ExportPngResponse'];
import { renderPlanToImages } from './export/renderer.js';
import { validateFillOutput } from './fill/validator.js';
import { persistFillOutput, validateOrThrow } from './fill/service.js';

sentryInit();
const app = Fastify({ logger: true });
await initFlags();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const SSE_HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS || 10000);
const SSE_IDLE_TIMEOUT_MS = Number(process.env.SSE_IDLE_TIMEOUT_MS || 30000);

await app.register(rateLimit, {
  max: 1000,
  timeWindow: RATE_LIMIT_WINDOW_MS,
  keyGenerator: (req) => `${req.headers['x-device-id'] ?? 'nodev'}:${req.ip}`
});

await app.register((fastifySSE as any));
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, { origin: true, credentials: true });
await app.register(cookie);
await app.register(traceIdPlugin);
await app.register(errorEnvelope);
await app.register(process.env.REDIS_URL ? idempotencyRedis : idempotency);
await app.register(authPlugin);
await app.register(queuesPlugin);
await app.register(authRoutes);
await app.register(ingestRoutes);
await app.register(homeRoutes);
await app.register(libraryRoutes);
await app.register(searchRoutes);
await app.register(planRoutes);
await app.register(byokRoutes);
await app.register(accountRoutes);
await app.register(feedbackRoutes);

// SSE helper plugin: standard ping and headers
await app.register(fastifyPlugin(async (f) => {
  f.decorate('ssePing', (reply: any, traceId: string, seq: number) => {
    reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq, heartbeat_ms: 10000, ts: Date.now() }) });
  });
  f.decorate('sendError', (reply: any, code: string, message: string, retriable = false, details?: Record<string, unknown>) => {
    reply.code(400).send({ error_code: code, error_message: message, retriable, details });
  });
}));

// Health
app.get('/health', async () => ({ status: 'ok' }));

// AI Fill → 202 and SSE
app.post<{ Body: AiFillRequest, Reply: AiFillResponse | any }>('/plan/ai-fill', { config: { rateLimit: { max: 10, timeWindow: 60 * 60 * 1000 } } }, async (req, reply) => {
  const traceId = req.traceId || randomUUID();
  const parsed = AiFillBody.safeParse((req as any).body ?? {});
  if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid fill body', 400, false, { issues: parsed.error.issues });
  const fillRunId = `fr_${randomUUID()}`;
  const res: AiFillResponse = { fill_run_id: fillRunId, sse_url: `/sse/fill/${fillRunId}` };
  reply.header('X-Trace-Id', traceId).code(202).send(res);
});

app.get('/sse/fill/:runId', { preHandler: authGuard }, async (req, reply) => {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Connection', 'keep-alive');
  const runId = (req.params as any).runId as string;
  reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'started', ts: Date.now() }) });
  let done = 0; const total = 4;
  const step = setInterval(async () => {
    done += 1;
    if (done < total) {
      reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'progress', batch_done: done, batch_total: total, ok: done, invalid: 0, ts: Date.now() }) });
    } else {
      // simulate validation hook (placeholder payload)
      const simulated = { items: [{ slot_id: 's1', do: ['步行到西湖', '拍照'], prepare: ['充电'], notice: ['避开人流'] }] };
      try {
        validateOrThrow(simulated);
        await persistFillOutput(runId, simulated);
      } catch (e: any) {
        reply.sse({ event: 'error', data: JSON.stringify({ error_code: 'FILL_VALIDATION_FAILED', error_message: 'schema validation failed', retriable: true, details: e?.details, ts: Date.now() }) });
      }
      // Langfuse tracking stub
      trackFillRun({ prompt_ver: '2025-10-26', model_ver: 'gpt-4o-mini', latency_ms: 1500 * total, trace_id: traceId });
      reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'done', ts: Date.now() }) });
      clearInterval(step);
    }
  }, 1500);
  const ping = setInterval(() => reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: Date.now(), heartbeat_ms: SSE_HEARTBEAT_MS, ts: Date.now() }) }), SSE_HEARTBEAT_MS);
  req.raw.on('close', () => { clearInterval(step); clearInterval(ping); });
});

// Export PNG/WebP (mock)
app.post<{ Body: ExportPngRequest, Reply: ExportPngResponse | any }>('/export/png', async (req, reply) => {
  const parsed = ExportBody.safeParse((req as any).body ?? {});
  if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid export body', 400, false, { issues: parsed.error.issues });
  const body = parsed.data;
  const width = body.width_px ?? 1080;
  const slice = body.slice_by_day ?? true;
  const out = await renderPlanToImages(body.plan_id, width, slice);
  reply.send(out satisfies ExportPngResponse);
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`server listening on ${port}`);
});


