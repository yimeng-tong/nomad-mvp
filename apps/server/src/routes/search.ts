import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';
import { AmapSearchUnavailableError, searchAmapPoi } from '../integrations/amap.js';
import { SearchPoiQuery } from '../schemas.js';

export default fp(async (app) => {
  app.get('/search/poi', { preHandler: authGuard }, async (req: any, reply: any) => {
    const parsed = SearchPoiQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.sendError('SEARCH_POI_INVALID', 'invalid poi search query', 400, false, { issues: parsed.error.issues });
    }

    const { city, q, topk = 5 } = parsed.data;
    try {
      return { items: await searchAmapPoi(city, q, topk) };
    } catch (error) {
      if (error instanceof AmapSearchUnavailableError) {
        req.log?.warn({ error_code: 'AMAP_SEARCH_UNAVAILABLE' }, 'AMap POI search unavailable');
        return reply.sendError('SEARCH_POI_UNAVAILABLE', '酒店匹配暂时不可用，请稍后重试', 503, true);
      }
      throw error;
    }
  });
});
