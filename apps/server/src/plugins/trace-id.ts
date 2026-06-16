import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest { traceId?: string }
}

export default fp(async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    const incoming = (req.headers['x-trace-id'] as string) || randomUUID();
    req.traceId = incoming;
    reply.header('X-Trace-Id', incoming);
  });
});


