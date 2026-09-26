import { AuthFault, authAuthority } from '../auth/errors.js';
import { dbOwnerId, fixtureAuth, lockQualifiedOwner } from '../auth/owner.js';
import { getPrisma } from '../db/prisma.js';
import { getMediaBytes } from './object-store.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const missing = () => new AuthFault('LIBRARY_ASSET_NOT_FOUND', 404);

/** The DB row, rather than an object key, is the media read authority. */
export async function readOwnerAsset(userId: string, assetId: string) {
  const ownerId = dbOwnerId(userId), db = getPrisma();
  if (!uuidPattern.test(assetId)) throw missing();
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    throw missing();
  }
  return authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    const asset = await tx.asset.findFirst({ where: { id: assetId,
      inspiration: { is: { userId: ownerId, deletedAt: null } } },
    select: { cosKey: true } });
    if (!asset) throw missing();
    return getMediaBytes(asset.cosKey);
  }, { maxWait: 5_000, timeout: 45_000 }));
}
