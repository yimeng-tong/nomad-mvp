import { AuthFault, authAuthority } from '../auth/errors.js';
import { dbOwnerId, fixtureAuth, lockQualifiedOwner } from '../auth/owner.js';
import { getPrisma } from '../db/prisma.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const missing = () => new AuthFault('LIBRARY_IMPORT_RECORD_NOT_FOUND', 404);

/** Tombstone one owner reference and fence its job before any later worker commit. */
export async function deleteImportRecord(userId: string, recordId: string): Promise<void> {
  const ownerId = dbOwnerId(userId), db = getPrisma();
  if (!uuidPattern.test(recordId)) throw missing();
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
    throw missing();
  }
  await authAuthority(() => db.$transaction(async (tx) => {
    await lockQualifiedOwner(tx, ownerId);
    const initial = await tx.importRecord.findFirst({ where: { id: recordId, userId: ownerId, deletedAt: null },
      select: { jobId: true, normalizedUrl: true } });
    if (!initial) throw missing();
    // Admission takes this lock before inspecting the active record. The final
    // read below is therefore ordered with every same-owner reimport.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`import-record:${ownerId}:${initial.normalizedUrl}`},0))`;
    await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${initial.jobId}::uuid AND "userId"=${ownerId}::uuid FOR UPDATE`;
    const record = await tx.importRecord.findFirst({ where: { id: recordId, userId: ownerId,
      jobId: initial.jobId, deletedAt: null, activeNormalizedUrl: initial.normalizedUrl }, select: { id: true } });
    const job = await tx.ingestJob.findFirst({ where: { id: initial.jobId, userId: ownerId, deletedAt: null }, select: { id: true } });
    if (!record || !job) throw missing();
    const deletedAt = new Date();
    const fenced = await tx.ingestJob.updateMany({ where: { id: job.id, userId: ownerId, deletedAt: null },
      data: { deletedAt, executionPending: false, leaseOwner: null, leaseExpiresAt: null,
        nextExecutionAt: null, leaseFence: { increment: 1 } } });
    if (fenced.count !== 1) throw new AuthFault('INGEST_STATE_CHANGED', 409);
    const revoked = await tx.importRecord.updateMany({ where: { id: recordId, userId: ownerId, deletedAt: null },
      data: { deletedAt, activeNormalizedUrl: null } });
    if (revoked.count !== 1) throw new AuthFault('INGEST_STATE_CHANGED', 409);
    await tx.inspiration.updateMany({ where: { userId: ownerId, deletedAt: null,
      OR: [{ importRecordId: recordId }, { jobId: job.id }] }, data: { deletedAt } });
  }));
}
