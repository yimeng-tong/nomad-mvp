import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { actorContext, lockQualifiedOwner } from './owner.js';
import { AuthFault, authAuthority } from './errors.js';

export const operatorCapabilities = ['places.correct', 'brand.rules', 'ops.workbench', 'ops.prompts', 'ops.rollout', 'ops.usage'] as const;
export type OperatorCapability = typeof operatorCapabilities[number];
export function validOperatorScope(value: string) { return value.length > 0 && value.length <= 128 && !/[\s\p{Cc}*]/u.test(value); }
function validate(capability: string, scope: string) {
  if (!(operatorCapabilities as readonly string[]).includes(capability) || !validOperatorScope(scope)) throw new AuthFault('AUTH_OPERATOR_SCOPE_INVALID', 400);
}
/** Use inside the protected write transaction. Exact capability/scope and current grant are always required. */
export async function lockOperatorAuthority(tx: Prisma.TransactionClient, ownerId: string, capability: string, scope: string, expectedVersion: number) {
  validate(capability, scope);
  await lockQualifiedOwner(tx, ownerId);
  const [grant] = await tx.$queryRaw<Array<{ id: string; version: number }>>`SELECT id,version FROM "AuthOperatorGrant"
    WHERE user_id=${ownerId}::uuid AND capability=${capability} AND scope=${scope} AND revoked_at IS NULL FOR SHARE`;
  if (!grant) throw new AuthFault('AUTH_OPERATOR_FORBIDDEN', 403);
  if (grant.version !== expectedVersion) throw new AuthFault('AUTH_OPERATOR_GRANT_CHANGED', 409);
  return grant;
}

/** Offline maintenance only. An HTTP actor can never grant/revoke its own capabilities through this entry. */
export async function changeOperatorGrant(db: PrismaClient, input: {
  ownerId: string; capability: OperatorCapability; scope: string; expectedVersion: number; enabled: boolean; approvedBy: string; evidence: string;
}) {
  if (actorContext.getStore()) throw new AuthFault('AUTH_OPERATOR_MAINTENANCE_ONLY', 403);
  validate(input.capability, input.scope);
  if (!input.approvedBy.trim() || !input.evidence.trim() || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) throw new AuthFault('AUTH_ADMIN_EVIDENCE_REQUIRED', 400);
  return authAuthority(() => db.$transaction(async (tx) => {
    const [owner] = await tx.$queryRaw<Array<{ auth_state: string }>>`SELECT auth_state FROM "User" WHERE id=${input.ownerId}::uuid FOR SHARE`;
    if (!owner || input.enabled && owner.auth_state !== 'active') throw new AuthFault('AUTH_ACCOUNT_UNAVAILABLE', 403);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`operator:${input.ownerId}:${input.capability}:${input.scope}`},0))`;
    const [current] = await tx.$queryRaw<Array<{ id: string; version: number }>>`SELECT id,version FROM "AuthOperatorGrant"
      WHERE user_id=${input.ownerId}::uuid AND capability=${input.capability} AND scope=${input.scope} FOR UPDATE`;
    if ((current?.version ?? 0) !== input.expectedVersion) throw new AuthFault('AUTH_OPERATOR_GRANT_CHANGED', 409);
    if (!current && !input.enabled) throw new AuthFault('AUTH_OPERATOR_FORBIDDEN', 403);
    const id = current?.id ?? randomUUID(), version = (current?.version ?? 0) + 1;
    await tx.$executeRaw`INSERT INTO "AuthOperatorGrant" (id,user_id,capability,scope,version,revoked_at,granted_by,evidence_reference)
      VALUES (${id}::uuid,${input.ownerId}::uuid,${input.capability},${input.scope},${version},${input.enabled ? null : new Date()},${input.approvedBy},${input.evidence})
      ON CONFLICT (user_id,capability,scope) DO UPDATE SET version=EXCLUDED.version,revoked_at=EXCLUDED.revoked_at,granted_by=EXCLUDED.granted_by,evidence_reference=EXCLUDED.evidence_reference`;
    await tx.$executeRaw`INSERT INTO "AuthAuditEvent" (id,user_id,action,target_id,evidence_reference)
      VALUES (${randomUUID()}::uuid,${input.ownerId}::uuid,${input.enabled ? 'operator-grant' : 'operator-revoke'},${id},${input.evidence})`;
    return { id, version, enabled: input.enabled };
  }));
}
