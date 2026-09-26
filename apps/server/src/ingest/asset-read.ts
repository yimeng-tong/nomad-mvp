import { AuthFault, authAuthority } from '../auth/errors.js';
import { dbOwnerId, fixtureAuth, lockQualifiedOwner } from '../auth/owner.js';
import { getPrisma } from '../db/prisma.js';
import { getMediaBytes } from './object-store.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const missing = () => new AuthFault('LIBRARY_ASSET_NOT_FOUND', 404);

/** The DB row, rather than an object key, is the media read authority. */
export async function readOwnerAsset(userId: string, assetId: string,
  fetchMedia: typeof getMediaBytes = getMediaBytes) {
  const ownerId = dbOwnerId(userId), db = getPrisma();
  if (!uuidPattern.test(assetId)) throw missing();
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    throw missing();
  }
  const asset = await authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    const found = await tx.asset.findFirst({ where: { id: assetId,
      inspiration: { is: { userId: ownerId, deletedAt: null } } },
    select: { cosKey: true } });
    if (!found) throw missing();
    return found;
  }));
  // S3 I/O never holds an owner or Inspiration database lock. Deletion may
  // commit during the download, so qualify the same key again before release.
  const media = await fetchMedia(asset.cosKey);
  await authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT a.id FROM "Asset" AS a
      JOIN "Inspiration" AS i ON i.id = a."inspirationId"
      WHERE a.id = ${assetId}::uuid AND a.cos_key = ${asset.cosKey}
        AND i."userId" = ${ownerId}::uuid AND i.deleted_at IS NULL
      FOR SHARE OF i`;
    if (!rows[0]) throw missing();
  }));
  return media;
}
