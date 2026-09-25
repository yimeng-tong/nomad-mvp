import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { AuthFault, authAuthority } from './errors.js';
import { legacyOwnerId } from './owner.js';
import { normalizeCnPhone } from './credentials.js';

export type TrustedLegacyClaim = {
  legacyActor: string; ownerId: string; verifiedPhone: string;
  evidenceReference: string; approvedBy: string;
};

function validateClaim(claim: TrustedLegacyClaim) {
  if (!claim.evidenceReference.trim() || !claim.approvedBy.trim()
    || legacyOwnerId(claim.legacyActor) !== claim.ownerId) throw new AuthFault('AUTH_MIGRATION_CLAIM_INVALID', 400);
  return normalizeCnPhone(claim.verifiedPhone);
}

/** Read-only planning. No phone match, legacy cookie or header establishes ownership. */
export async function auditLegacyClaim(db: PrismaClient, claim: TrustedLegacyClaim) {
  const phone = validateClaim(claim);
  return authAuthority(async () => {
    const [owner] = await db.$queryRaw<Array<{ id: string; auth_state: string }>>`SELECT id,auth_state FROM "User" WHERE id=${claim.ownerId}::uuid`;
    const identities = await db.$queryRaw<Array<{ user_id: string; subject: string; verified_at: Date | null }>>`SELECT "userId" AS user_id,subject,verified_at FROM "OAuthIdentity"
      WHERE provider='aliyun-pnvs' AND issuer='https://dypnsapi.aliyuncs.com' AND tenant='nomad' AND client_id='phone-login-v1'
        AND (subject=${phone} OR "userId"=${claim.ownerId}::uuid)`;
    const conflicts = [];
    if (!owner) conflicts.push('owner-missing');
    else if (!['legacy-unverified', 'active'].includes(owner.auth_state)) conflicts.push('owner-not-eligible');
    if (identities.some((row) => row.user_id !== claim.ownerId || row.subject !== phone || !row.verified_at)) conflicts.push('identity-conflict');
    return { ownerId: claim.ownerId, ready: conflicts.length === 0, conflicts, changesApplied: false };
  });
}

/** Offline trusted maintenance only. Caller must hold actual approval for the retained data scope. */
export async function applyTrustedLegacyClaim(db: PrismaClient, claim: TrustedLegacyClaim) {
  const phone = validateClaim(claim);
  return authAuthority(() => db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-identity:pnvs:${phone}`},0))`;
    const [owner] = await tx.$queryRaw<Array<{ auth_state: string; auth_version: number }>>`SELECT auth_state,auth_version
      FROM "User" WHERE id=${claim.ownerId}::uuid FOR UPDATE`;
    if (!owner || !['legacy-unverified', 'active'].includes(owner.auth_state)) throw new AuthFault('AUTH_MIGRATION_CONFLICT', 409);
    const identities = await tx.$queryRaw<Array<{ user_id: string; subject: string; verified_at: Date | null }>>`SELECT "userId" AS user_id,subject,verified_at FROM "OAuthIdentity"
      WHERE provider='aliyun-pnvs' AND issuer='https://dypnsapi.aliyuncs.com' AND tenant='nomad' AND client_id='phone-login-v1'
        AND (subject=${phone} OR "userId"=${claim.ownerId}::uuid)`;
    if (identities.some((row) => row.user_id !== claim.ownerId || row.subject !== phone || !row.verified_at)) {
      throw new AuthFault('AUTH_MIGRATION_CONFLICT', 409);
    }
    const bindings = await tx.$queryRaw<Array<{ user_id: string }>>`SELECT user_id FROM "AuthLegacyOwnerBinding" WHERE legacy_actor=${claim.legacyActor}`;
    if (bindings[0] && bindings[0].user_id !== claim.ownerId) throw new AuthFault('AUTH_MIGRATION_CONFLICT', 409);
    if (bindings[0] && identities.length && owner.auth_state === 'active') return { ownerId: claim.ownerId, applied: false };
    if (!identities.length) {
      await tx.$executeRaw`INSERT INTO "OAuthIdentity" (id,"userId",provider,issuer,tenant,client_id,subject,verified_at)
        VALUES (${randomUUID()}::uuid,${claim.ownerId}::uuid,'aliyun-pnvs','https://dypnsapi.aliyuncs.com','nomad','phone-login-v1',${phone},CURRENT_TIMESTAMP)`;
    }
    await tx.$executeRaw`INSERT INTO "AuthLegacyOwnerBinding" (legacy_actor,user_id,evidence_reference,approved_by)
      VALUES (${claim.legacyActor},${claim.ownerId}::uuid,${claim.evidenceReference},${claim.approvedBy}) ON CONFLICT DO NOTHING`;
    const [qualified] = await tx.$queryRaw<Array<{ auth_version: number }>>`UPDATE "User" SET auth_state='active',auth_version=auth_version+1
      WHERE id=${claim.ownerId}::uuid RETURNING auth_version`;
    for (const table of ['IngestJob', 'PlanJob', 'HqJob']) {
      await tx.$executeRaw(Prisma.sql`UPDATE ${Prisma.raw(`"${table}"`)} SET auth_version=${qualified.auth_version}
        WHERE "userId"=${claim.ownerId}::uuid AND auth_version IS NULL`);
    }
    // Existing session credentials are never imported or upgraded to trusted production sessions.
    await tx.$executeRaw`UPDATE "Session" SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP) WHERE "userId"=${claim.ownerId}::uuid`;
    await tx.$executeRaw`INSERT INTO "AuthAuditEvent" (id,user_id,action,evidence_reference)
      VALUES (${randomUUID()}::uuid,${claim.ownerId}::uuid,'trusted-legacy-owner-binding',${claim.evidenceReference})`;
    return { ownerId: claim.ownerId, applied: true };
  }));
}
