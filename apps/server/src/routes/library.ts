import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';
import { listLibraryCandidatesForUser, listLibraryCitiesForUser, listLibraryInspirationsForUser } from '../ingest/store.js';
import { getPrisma } from '../db/prisma.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidLocateStatus(value: string | undefined): value is 'resolved' | 'pending' | undefined {
  return value === undefined || value === 'resolved' || value === 'pending';
}

export default fp(async (app) => {
  app.get('/library/cities', { preHandler: authGuard }, async (req: any) => {
    return listLibraryCitiesForUser(req.user!.id);
  });

  app.get('/library/inspirations', { preHandler: authGuard }, async (req: any, reply: any) => {
    const query = (req.query ?? {}) as { city_id?: string; locate_status?: string };
    if (!isValidLocateStatus(query.locate_status)) {
      return reply.sendError('LIBRARY_FILTER_INVALID', 'invalid locate_status', 400, false);
    }
    if (query.city_id && getPrisma() && !uuidPattern.test(query.city_id)) {
      return reply.sendError('LIBRARY_FILTER_INVALID', 'invalid city_id', 400, false);
    }
    const items = await listLibraryInspirationsForUser(req.user!.id, {
      cityId: query.city_id,
      locateStatus: query.locate_status,
    });
    return { items };
  });

  app.get('/library/inspirations/:inspirationId/candidates', { preHandler: authGuard }, async (req: any, reply: any) => {
    const candidates = await listLibraryCandidatesForUser(req.user!.id, req.params.inspirationId);
    if (!candidates) {
      return reply.sendError('LIBRARY_INSPIRATION_NOT_FOUND', 'inspiration not found', 404, false);
    }
    return { candidates };
  });
});
