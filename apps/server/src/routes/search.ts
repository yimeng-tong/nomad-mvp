import fp from 'fastify-plugin';
import { createHash } from 'node:crypto';
import { authGuard } from '../plugins/auth.js';
import { SearchPoiQuery } from '../schemas.js';
import type { components } from '../../../../packages/types/src/api-types.js';

type SearchPoiItem = components['schemas']['SearchPoiItem'];

function stablePoiId(city: string, query: string, index: number) {
  return `amap_${createHash('sha1').update(`${city}:${query}:${index}`).digest('hex').slice(0, 12)}`;
}

function searchPoiStub(city: string, query: string, topk: number): SearchPoiItem[] {
  const normalized = query.trim();
  return Array.from({ length: topk }, (_, index) => ({
    poi_id: stablePoiId(city, normalized, index),
    name: index === 0 ? normalized : `${normalized} ${index + 1}`,
    address: `${city}${index === 0 ? '' : `候选${index + 1}`} · 待用户确认地址`,
    distance_m: index === 0 ? null : index * 180,
  }));
}

export default fp(async (app) => {
  app.get('/search/poi', { preHandler: authGuard }, async (req: any, reply: any) => {
    const parsed = SearchPoiQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.sendError('SEARCH_POI_INVALID', 'invalid poi search query', 400, false, { issues: parsed.error.issues });
    }

    const { city, q, topk = 5 } = parsed.data;
    return { items: searchPoiStub(city, q, topk) };
  });
});
