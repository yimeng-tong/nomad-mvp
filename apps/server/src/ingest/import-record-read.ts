import { Prisma } from '@prisma/client';
import { AuthFault, authAuthority } from '../auth/errors.js';
import { dbOwnerId, fixtureAuth, lockQualifiedOwner } from '../auth/owner.js';
import { getPrisma } from '../db/prisma.js';
import { loadImportUrlKeyring, openImportOriginalUrl, type ProtectedImportUrl } from './import-url-protection.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const cursorPattern = /^[A-Za-z0-9_-]{1,256}$/u;
const recordSelect = {
  id: true, jobId: true, status: true, sourceTitle: true, createdAt: true, updatedAt: true,
  inspirations: { where: { deletedAt: null }, take: 1, select: { id: true, locateStatus: true,
    poi: { select: { name: true, address: true } }, _count: { select: { assets: true } } } },
} as const;
type RecordRow = Prisma.ImportRecordGetPayload<{ select: typeof recordSelect }>;

type PageCursor = { v: 1; t: string; id: string };
function decodeCursor(encoded: string): PageCursor {
  if (!cursorPattern.test(encoded)) throw new AuthFault('LIBRARY_CURSOR_INVALID', 400);
  try {
    const bytes = Buffer.from(encoded, 'base64url');
    if (bytes.toString('base64url') !== encoded || bytes.length > 160) throw new Error('cursor');
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('cursor');
    const cursor = value as Partial<PageCursor>;
    if (cursor.v !== 1 || typeof cursor.t !== 'string' || typeof cursor.id !== 'string'
      || !uuidPattern.test(cursor.id) || !Number.isFinite(Date.parse(cursor.t))
      || new Date(cursor.t).toISOString() !== cursor.t) throw new Error('cursor');
    return cursor as PageCursor;
  } catch { throw new AuthFault('LIBRARY_CURSOR_INVALID', 400); }
}
function encodeCursor(row: RecordRow): string {
  return Buffer.from(JSON.stringify({ v: 1, t: row.createdAt.toISOString(), id: row.id } satisfies PageCursor)).toString('base64url');
}
function publicRecord(row: RecordRow) {
  const inspiration = row.inspirations[0];
  return {
    id: row.id,
    ingest_id: `ing_${row.jobId}`,
    status: row.status,
    title: row.sourceTitle,
    inspiration_id: inspiration?.id ?? null,
    locate_status: inspiration ? inspiration.locateStatus === 'resolved' ? 'resolved' as const : 'pending' as const : null,
    poi_name: inspiration?.poi?.name ?? null,
    poi_address: inspiration?.poi?.address ?? null,
    asset_count: inspiration?._count.assets ?? 0,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/** Reading a record never creates a job, command, checkpoint or event. */
export async function listImportRecords(userId: string, input: { limit?: string; cursor?: string } = {}) {
  const ownerId = dbOwnerId(userId), db = getPrisma();
  const limit = input.limit === undefined ? 20 : Number(input.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || input.limit !== undefined && String(limit) !== input.limit)
    throw new AuthFault('LIBRARY_FILTER_INVALID', 400);
  const cursor = input.cursor === undefined ? undefined : decodeCursor(input.cursor);
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    return { items: [], next_cursor: null };
  }
  const rows = await authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    return tx.importRecord.findMany({ where: { userId: ownerId, deletedAt: null,
      ...(cursor ? { OR: [{ createdAt: { lt: new Date(cursor.t) } },
        { createdAt: new Date(cursor.t), id: { lt: cursor.id } }] } : {}) },
    select: recordSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit + 1 });
  }));
  const page = rows.slice(0, limit);
  return { items: page.map(publicRecord), next_cursor: rows.length > limit ? encodeCursor(page[page.length - 1]!) : null };
}

/** The original URL is decrypted only after the current owner has been qualified and the record has been selected by owner. */
export async function getImportRecordDetail(userId: string, recordId: string) {
  const ownerId = dbOwnerId(userId), db = getPrisma();
  if (!uuidPattern.test(recordId)) throw new AuthFault('LIBRARY_IMPORT_RECORD_NOT_FOUND', 404);
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    throw new AuthFault('LIBRARY_IMPORT_RECORD_NOT_FOUND', 404);
  }
  return authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    const row = await tx.importRecord.findFirst({ where: { id: recordId, userId: ownerId, deletedAt: null },
      select: { ...recordSelect, originalUrlProtected: true } });
    if (!row) throw new AuthFault('LIBRARY_IMPORT_RECORD_NOT_FOUND', 404);
    let originalUrl: string;
    try { originalUrl = openImportOriginalUrl(row.originalUrlProtected as unknown as ProtectedImportUrl,
      { ownerId, recordId: row.id }, loadImportUrlKeyring(process.env)); }
    catch { throw new AuthFault('INGEST_URL_PROTECTION_UNAVAILABLE', 503, true); }
    return { ...publicRecord(row), original_url: originalUrl };
  }));
}
