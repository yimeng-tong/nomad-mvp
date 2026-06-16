import fp from 'fastify-plugin';
import { createClient } from 'redis';

export default fp(async (app) => {
  const url = process.env.REDIS_URL;
  if (!url) return; // fallback to memory plugin
  const client = createClient({ url });
  await client.connect();
  app.decorate('checkIdempotency', async (path: string, body: any, ttlMs: number, userId?: string) => {
    const key = `${userId ?? 'anon'}:${path}:${JSON.stringify(body ?? {})}`;
    const v = await client.get(key);
    return v ? JSON.parse(v) : null;
  });
  app.decorate('storeIdempotency', async (path: string, body: any, ttlMs: number, response: any, userId?: string) => {
    const key = `${userId ?? 'anon'}:${path}:${JSON.stringify(body ?? {})}`;
    await client.setEx(key, Math.ceil(ttlMs / 1000), JSON.stringify(response));
  });
});


