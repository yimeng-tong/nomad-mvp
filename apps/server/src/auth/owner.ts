import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthEnvironment } from './runtime-config.js';
import { AuthFault } from './errors.js';

export type QualifiedActor = { ownerId: string; authVersion: number; sessionId?: string };
export const actorContext = new AsyncLocalStorage<QualifiedActor | undefined>();
export function fixtureAuth(env: AuthEnvironment = process.env) {
  return ['local', 'test'].includes(env.AUTH_RUNTIME_MODE ?? '') && env.AUTH_PROVIDER === 'fixture'
    && env.AUTH_TEST_ADAPTER_ENABLED === 'true' && env.NODE_ENV !== 'production';
}
export function legacyOwnerId(actor: string) {
  const hex = createHash('sha256').update(actor).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export function dbOwnerId(actor: string, env: AuthEnvironment = process.env) {
  if (fixtureAuth(env)) return legacyOwnerId(actor);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actor)) {
    throw new AuthFault('AUTH_OWNER_INVALID', 401);
  }
  return actor.toLowerCase();
}
export function sourceOwnerHashes(owner: string, url: string, aliases: string[]) {
  return [...new Set([owner, ...aliases])].map((actor) => createHash('sha256').update(`${actor}:${url}`).digest('hex'));
}

type Reader = Pick<PrismaClient, '$queryRaw'>;
/** Must be called inside the SAME transaction as the protected write to retain row locks. */
export async function lockQualifiedOwner(tx: Reader, ownerId: string, expectedVersion?: number) {
  if (fixtureAuth()) return 0;
  const actor = actorContext.getStore();
  if (actor?.ownerId && actor.ownerId !== ownerId) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
  // Follow login/logout's browser -> owner -> session lock order.
  if (actor?.sessionId) {
    const [session] = await tx.$queryRaw<Array<{ browser_binding_hash: string | null; browser_generation: number | null }>>(Prisma.sql`
      SELECT browser_binding_hash,browser_generation FROM "Session" WHERE id=${actor.sessionId}::uuid AND "userId"=${ownerId}::uuid`);
    if (!session?.browser_binding_hash) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
    const browsers = await tx.$queryRaw<Array<{ binding_hash: string }>>(Prisma.sql`SELECT binding_hash FROM "AuthBrowser"
      WHERE binding_hash=${session.browser_binding_hash} AND session_generation=${session.browser_generation} FOR SHARE`);
    if (!browsers[0]) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
  }
  const [owner] = await tx.$queryRaw<Array<{ auth_state: string; auth_version: number }>>(Prisma.sql`
    SELECT auth_state,auth_version FROM "User" WHERE id=${ownerId}::uuid FOR SHARE`);
  if (owner?.auth_state !== 'active') throw new AuthFault('AUTH_ACCOUNT_UNAVAILABLE', 403);
  if (actor && (actor.ownerId !== ownerId || actor.authVersion !== owner.auth_version)) {
    throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
  }
  if (expectedVersion !== undefined && expectedVersion !== owner.auth_version) throw new AuthFault('AUTH_ACCOUNT_UNAVAILABLE', 403);
  if (actor?.sessionId) {
    const sessions = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "Session"
      WHERE id=${actor.sessionId}::uuid AND "userId"=${ownerId}::uuid AND auth_version=${owner.auth_version}
        AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP FOR SHARE`);
    if (!sessions[0]) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
  }
  return owner.auth_version;
}

export async function retainedSourceHashes(db: Reader, ownerId: string, url: string) {
  const aliases = await db.$queryRaw<Array<{ legacy_actor: string }>>(Prisma.sql`
    SELECT legacy_actor FROM "AuthLegacyOwnerBinding" WHERE user_id=${ownerId}::uuid`);
  return sourceOwnerHashes(ownerId, url, aliases.map((row) => row.legacy_actor));
}

export async function lockJobOwner(tx: Reader, table: 'PlanJob' | 'HqJob' | 'IngestJob', jobId: string) {
  if (fixtureAuth()) return;
  if (!['PlanJob', 'HqJob', 'IngestJob'].includes(table)) throw new AuthFault('AUTH_OWNER_INVALID', 401);
  const [job] = await tx.$queryRaw<Array<{ owner_id: string; auth_version: number | null }>>(Prisma.sql`
    SELECT "userId" AS owner_id,auth_version FROM ${Prisma.raw(`"${table}"`)} WHERE id=${jobId}::uuid`);
  if (!job || job.auth_version === null) throw new AuthFault('AUTH_LEGACY_OWNER_UNVERIFIED', 403);
  await lockQualifiedOwner(tx, job.owner_id, job.auth_version);
}

/** Accepted work retains account qualification, but is independent of the initiating browser session. */
export function runAsAcceptedJob<T>(actor: QualifiedActor, work: () => T): T {
  return actorContext.run({ ownerId: actor.ownerId, authVersion: actor.authVersion }, work);
}
