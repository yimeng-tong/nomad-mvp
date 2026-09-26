import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';
import { listLibraryCandidatesForUser, listLibraryCitiesForUser, listLibraryInspirationsForUser } from '../ingest/store.js';
import { getImportRecordDetail, listImportRecords } from '../ingest/import-record-read.js';
import { deleteImportRecord } from '../ingest/import-record-delete.js';
import { readOwnerAsset } from '../ingest/asset-read.js';
import { getPrisma } from '../db/prisma.js';
import { AuthFault } from '../auth/errors.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidLocateStatus(value: string | undefined): value is 'resolved' | 'pending' | undefined {
  return value === undefined || value === 'resolved' || value === 'pending';
}

async function safeRead(reply: FastifyReply, work: () => Promise<unknown>) {
  try { return await work(); }
  catch (error) {
    const fault = error instanceof AuthFault ? error : new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    return reply.sendError(fault.code, fault.code, fault.status, fault.retriable);
  }
}

export default fp(async (app) => {
  app.get('/library/cities', { preHandler: authGuard }, async (req: FastifyRequest) => {
    return listLibraryCitiesForUser(req.user!.id);
  });

  app.get('/library/inspirations', { preHandler: authGuard }, async (req: FastifyRequest, reply: FastifyReply) => {
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

  app.get<{ Params: { inspirationId: string } }>('/library/inspirations/:inspirationId/candidates', { preHandler: authGuard }, async (req, reply) => {
    const candidates = await listLibraryCandidatesForUser(req.user!.id, req.params.inspirationId);
    if (!candidates) {
      return reply.sendError('LIBRARY_INSPIRATION_NOT_FOUND', 'inspiration not found', 404, false);
    }
    return { candidates };
  });

  app.get<{ Params: { assetId: string } }>('/library/assets/:assetId/content', { preHandler: authGuard }, async (req, reply) => safeRead(reply, async () => {
    reply.header('Cache-Control', 'private, no-store');
    const media = await readOwnerAsset(req.user!.id, req.params.assetId);
    return reply.type(media.contentType).header('Content-Length', media.bytes.length).send(media.bytes);
  }));

  app.get<{ Querystring: { limit?: unknown; cursor?: unknown } }>('/library/import-records', { preHandler: authGuard }, async (req, reply) => safeRead(reply, async () => {
    reply.header('Cache-Control', 'no-store');
    const { limit, cursor } = req.query;
    if (limit !== undefined && typeof limit !== 'string' || cursor !== undefined && typeof cursor !== 'string')
      throw new AuthFault('LIBRARY_FILTER_INVALID', 400);
    return listImportRecords(req.user!.id, { limit, cursor });
  }));

  app.get<{ Params: { recordId: string } }>('/library/import-records/:recordId', { preHandler: authGuard }, async (req, reply) => safeRead(reply, async () => {
    reply.header('Cache-Control', 'no-store');
    return getImportRecordDetail(req.user!.id, req.params.recordId);
  }));

  app.delete<{ Params: { recordId: string } }>('/library/import-records/:recordId', { preHandler: authGuard }, async (req, reply) => safeRead(reply, async () => {
    reply.header('Cache-Control', 'no-store');
    await deleteImportRecord(req.user!.id, req.params.recordId);
    return reply.code(204).send();
  }));
});
