import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest { traceId?: string }
}

export default fp(async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    const value = req.headers['x-trace-id'];
    const incoming = !app.authAuthority && typeof value === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(value)
      ? value : randomUUID();
    req.traceId = incoming;
    reply.header('X-Trace-Id', incoming);
  });
});


