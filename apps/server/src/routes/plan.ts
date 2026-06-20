import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';
import { authGuard } from '../plugins/auth.js';
import { PlanGenerateBody } from '../schemas.js';
import type { components } from '../../../../packages/types/src/api-types.js';

type PlanGenerateRequest = components['schemas']['PlanGenerateRequest'];
type PlanGenerateResponse = components['schemas']['PlanGenerateResponse'];

export default fp(async (app) => {
  const sseHeartbeatMs = Number(process.env.SSE_HEARTBEAT_MS || 10000);

  app.post<{ Body: PlanGenerateRequest; Reply: PlanGenerateResponse | any }>(
    '/plan/generate',
    {
      preHandler: authGuard,
      config: { rateLimit: { max: 60, timeWindow: 24 * 60 * 60 * 1000 } },
    },
    async (req, reply) => {
      const traceId = req.traceId || randomUUID();
      const parsed = PlanGenerateBody.safeParse((req as any).body ?? {});
      if (!parsed.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan body', 400, false, { issues: parsed.error.issues });
      }

      const userId = req.user?.id;
      const cached = await app.checkIdempotency('/plan/generate', req.body, 10 * 60 * 1000, userId);
      if (cached) return reply.header('X-Trace-Id', traceId).code(202).send(cached);

      const planId = `pl_${randomUUID()}`;
      const planJobId = `pj_${randomUUID()}`;
      const response: PlanGenerateResponse = { plan_id: planId, plan_job_id: planJobId, sse_url: `/sse/plan/${planJobId}` };
      await app.storeIdempotency('/plan/generate', req.body, 10 * 60 * 1000, response, userId);
      return reply.header('X-Trace-Id', traceId).code(202).send(response);
    },
  );

  app.get('/sse/plan/:jobId', { preHandler: authGuard }, async (req, reply) => {
    const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Connection', 'keep-alive');
    const jobId = (req.params as any).jobId as string;
    const phases = ['started', 'anchor', 'cluster', 'validate', 'persist', 'done'] as const;
    let idx = 0;
    const tick = () => {
      const phase = phases[idx];
      const now = Date.now();
      reply.sse({ event: 'plan', data: JSON.stringify({ trace_id: traceId, plan_job_id: jobId, phase, unplaced_count: 0, ts: now }) });
      idx += 1;
      if (idx >= phases.length) return;
      setTimeout(tick, 1500);
    };
    tick();
    const ping = setInterval(
      () => reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: Date.now(), heartbeat_ms: sseHeartbeatMs, ts: Date.now() }) }),
      sseHeartbeatMs,
    );
    req.raw.on('close', () => clearInterval(ping));
  });

  app.patch('/plan/slots/:slotId', async (_req, reply) => {
    const undo = `u_${randomUUID()}`;
    reply.send({ undo_token: undo, plan_rev: 2 });
  });
});
