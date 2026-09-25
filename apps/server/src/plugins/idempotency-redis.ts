import fp from 'fastify-plugin';
import { createClient } from 'redis';

export default fp(async (app) => {
  const url = process.env.REDIS_URL;
  if (!url) return; // fallback to memory plugin
  const client = createClient({ url });
  await client.connect();
  app.addHook('onClose', async () => {
    if (!client.isOpen) return;
    // Fastify has drained requests; local teardown must not wait for Redis to reply.
    await client.disconnect();
  });
  app.decorate('checkIdempotency', async (path: string, body: unknown, _ttlMs: number, userId?: string) => {
    const key = `${userId ?? 'anon'}:${path}:${JSON.stringify(body ?? {})}`;
    const v = await client.get(key);
    return v ? JSON.parse(v) as unknown : null;
  });
  app.decorate('storeIdempotency', async (path: string, body: unknown, ttlMs: number, response: unknown, userId?: string) => {
    const key = `${userId ?? 'anon'}:${path}:${JSON.stringify(body ?? {})}`;
    await client.setEx(key, Math.ceil(ttlMs / 1000), JSON.stringify(response));
  });
});

