import fp from 'fastify-plugin';

type Cache = Map<string, { until: number, response: any }>
const cache: Cache = new Map();

function keyFrom(path: string, body: any, userId?: string) {
  const stable = JSON.stringify(body ?? {});
  return `${userId ?? 'anon'}:${path}:${stable}`;
}

export default fp(async (app) => {
  app.decorate('checkIdempotency', (path: string, body: any, ttlMs: number, userId?: string) => {
    const k = keyFrom(path, body, userId);
    const now = Date.now();
    const hit = cache.get(k);
    if (hit && hit.until > now) return hit.response;
    return null;
  });
  app.decorate('storeIdempotency', (path: string, body: any, ttlMs: number, response: any, userId?: string) => {
    const k = keyFrom(path, body, userId);
    cache.set(k, { until: Date.now() + ttlMs, response });
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    checkIdempotency: (path: string, body: any, ttlMs: number, userId?: string) => any | null
    storeIdempotency: (path: string, body: any, ttlMs: number, response: any, userId?: string) => void
  }
}


