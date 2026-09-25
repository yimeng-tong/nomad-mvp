import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaAuthRepository } from '../src/auth/prisma-repository.js';
import { browserBindingHash, credentialHash, newCredential } from '../src/auth/credentials.js';
import { AuthFault } from '../src/auth/errors.js';
import { applyTrustedLegacyClaim, auditLegacyClaim } from '../src/auth/legacy-owner.js';
import { legacyOwnerId, lockQualifiedOwner, retainedSourceHashes, actorContext } from '../src/auth/owner.js';
import { createOrGetIngestJob, sourceHashFor } from '../src/ingest/store.js';
import { getPrisma } from '../src/db/prisma.js';

const configured = process.env.DATABASE_URL;
assert.ok(configured && process.env.AUTH_TEST_DATABASE_ACK === 'isolated-synthetic-only', 'Explicit isolated database required');
assert.match(new URL(configured).pathname, /^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE = 'staging';
process.env.AUTH_PROVIDER = 'aliyun-pnvs';
const a = new PrismaClient(); const b = new PrismaClient();
const first = new PrismaAuthRepository(a); const second = new PrismaAuthRepository(b);
const binding = browserBindingHash(newCredential());
const bindingB = browserBindingHash(newCredential());
const initial = credentialHash('no-session');
const phone = '+86138' + String(Date.now()).slice(-8);
const input = () => ({ requestId: randomUUID(), browserBindingHash: binding, initialSessionHash: initial, phone });
const fault = (code: string) => (error: unknown) => error instanceof AuthFault && error.code === code;
const releaseCooldown = (id: string) => a.$executeRaw(Prisma.sql`UPDATE "AuthLoginTransaction" SET next_allowed_at=now()-interval '1 second' WHERE id=${id}::uuid`);
async function readyLogin(repo: PrismaAuthRepository, browser = binding) {
  const result = await repo.reserveLogin({ ...input(), browserBindingHash: browser }, []);
  assert.equal(result.shouldSend, true);
  await repo.markDelivery(result.transaction.id, 'sent');
  return result.transaction;
}
try {
  await first.ready(); await second.ready();
  const sameRequest = input();
  const concurrent = await Promise.all([first.reserveLogin(sameRequest, []), second.reserveLogin(sameRequest, [])]);
  assert.equal(concurrent.filter((r) => r.shouldSend).length, 1, 'one sender across instances');
  assert.equal(concurrent[0].transaction.id, concurrent[1].transaction.id);
  const transaction = concurrent[0].transaction;
  await first.markDelivery(transaction.id, 'sent');
  await assert.rejects(second.reserveLogin(input(), []), fault('AUTH_OTP_RETRY_LATER'));
  await assert.rejects(second.claimVerification(transaction.id, phone, browserBindingHash(newCredential()), initial), fault('AUTH_OTP_INVALID'));
  const claim = await first.claimVerification(transaction.id, phone, binding, initial);
  await assert.rejects(second.claimVerification(transaction.id, phone, binding, initial), fault('AUTH_OTP_VERIFICATION_IN_PROGRESS'));
  const secretA = newCredential();
  const sessionA = await first.completePhoneLogin(claim.id, claim.verification_generation, credentialHash(secretA), 'device-a', 3600);
  assert.notEqual(sessionA.id, secretA);
  assert.equal((await second.authenticate(credentialHash(secretA)))?.user_id, sessionA.user_id);
  await assert.rejects(second.completePhoneLogin(claim.id, claim.verification_generation, credentialHash(newCredential()), 'replay', 3600), fault('AUTH_OTP_INVALID'));

  await releaseCooldown(transaction.id);
  const next = await readyLogin(second, bindingB);
  const claimB = await second.claimVerification(next.id, phone, bindingB, initial);
  const secretB = newCredential();
  const sessionB = await second.completePhoneLogin(next.id, claimB.verification_generation, credentialHash(secretB), 'device-b', 3600);
  assert.equal(sessionB.user_id, sessionA.user_id, 'verified phone maps to the same stable owner');
  assert.equal((await first.listSessions(sessionA.user_id)).length, 2);
  assert.equal(await first.revokeSession(sessionA.id, randomUUID()), false, 'cross-owner revocation denied');
  assert.equal(await first.revokeSession(sessionA.id, sessionA.user_id), true);
  assert.equal(await second.authenticate(credentialHash(secretA)), null);
  assert.equal((await second.authenticate(credentialHash(secretB)))?.id, sessionB.id);
  assert.equal(await first.revokeSession(sessionA.id, sessionA.user_id), true, 'revocation is idempotent');
  await assert.rejects(actorContext.run({ ownerId: sessionA.user_id, authVersion: sessionA.auth_version, sessionId: sessionA.id },
    () => first.revokeSession(sessionB.id, sessionB.user_id)), fault('AUTH_SESSION_EXPIRED'));
  assert.equal((await second.authenticate(credentialHash(secretB)))?.id, sessionB.id, 'a caller revoked after admission cannot revoke another device');

  const orphan = await first.reserveLogin({ ...input(), phone: '+86137'+String(Date.now()).slice(-8), browserBindingHash: browserBindingHash(newCredential()) }, []);
  await assert.rejects(first.claimVerification(orphan.transaction.id, orphan.transaction.phone, orphan.transaction.browser_binding_hash, initial), fault('AUTH_SEND_IN_PROGRESS'));
  await a.$executeRaw`UPDATE "AuthLoginTransaction" SET created_at=now()-interval '31 seconds' WHERE id=${orphan.transaction.id}::uuid`;
  const recovered = await second.claimVerification(orphan.transaction.id, orphan.transaction.phone, orphan.transaction.browser_binding_hash, initial);
  assert.equal(recovered.delivery_state, 'unknown', 'a crashed sender can be verified without sending again');
  const budgetKey = randomUUID();
  await first.consumeVerificationBudget([{ key: budgetKey, limit: 1, seconds: 60 }]);
  await assert.rejects(second.consumeVerificationBudget([{ key: budgetKey, limit: 1, seconds: 60 }]), fault('AUTH_RATE_LIMITED'));


  await releaseCooldown(next.id);
  const pending = await readyLogin(first);
  const claimPending = await first.claimVerification(pending.id, phone, binding, initial);
  await second.deactivateOwner(sessionA.user_id, 'disabled', 'synthetic-probe');
  assert.equal(await first.authenticate(credentialHash(secretB)), null, 'all sessions lose account qualification');
  await assert.rejects(first.completePhoneLogin(pending.id, claimPending.verification_generation, credentialHash(newCredential()), 'late', 3600), fault('AUTH_ACCOUNT_UNAVAILABLE'));
  const [{ count }] = await a.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT count(*) FROM "OAuthIdentity" WHERE provider='aliyun-pnvs' AND subject=${phone}`);
  assert.equal(Number(count), 1, 'disabled identity is not recreated as a new account');

  const oldPhone = '+8613800000000';
  const legacyInput = { ...input(), phone: oldPhone };
  const legacyFlow = await first.reserveLogin(legacyInput, []);
  await first.markDelivery(legacyFlow.transaction.id, 'sent');
  const legacyClaim = await first.claimVerification(legacyFlow.transaction.id, oldPhone, binding, initial);
  const separate = await first.completePhoneLogin(legacyClaim.id, legacyClaim.verification_generation, credentialHash(newCredential()), 'new', 3600);
  assert.notEqual(separate.user_id, '10000000-0000-4000-8000-000000000001', 'phone match cannot claim legacy owner');
  const legacyActor = `u_trusted_${randomUUID()}`;
  const retainedOwner = legacyOwnerId(legacyActor);
  const retainedJob = randomUUID();
  const url = `https://example.invalid/retained/${randomUUID()}`;
  const oldSourceHash = sourceHashFor(legacyActor, url);
  await a.$executeRaw`INSERT INTO "User" (id) VALUES (${retainedOwner}::uuid)`;
  await a.$executeRaw`INSERT INTO "IngestJob" (id,"userId",source_type,source_hash,source_url,status)
    VALUES (${retainedJob}::uuid,${retainedOwner}::uuid,'xhs',${oldSourceHash},${url},'done'::"IngestStatus")`;
  const claimLegacy = { legacyActor, ownerId: retainedOwner, verifiedPhone: '+86139'+String(Date.now()).slice(-8),
    approvedBy: 'isolated-fixture', evidenceReference: 'synthetic-fixture:trusted-ownership-audit' };
  assert.equal((await auditLegacyClaim(a, claimLegacy)).changesApplied, false);
  await assert.rejects(a.$transaction((tx) => lockQualifiedOwner(tx, retainedOwner)), fault('AUTH_ACCOUNT_UNAVAILABLE'));
  assert.equal((await applyTrustedLegacyClaim(a, claimLegacy)).applied, true);
  assert.equal((await applyTrustedLegacyClaim(b, claimLegacy)).applied, false, 'trusted binding apply is idempotent');
  assert.ok((await retainedSourceHashes(a, retainedOwner, url)).includes(oldSourceHash));
  const retained = await createOrGetIngestJob({ userId: retainedOwner, sourceUrl: url, traceId: randomUUID() });
  assert.equal(retained.dbId, retainedJob, 'legacy deduplication recovers the retained job');
  assert.equal(retained.dbUserId, retainedOwner, 'canonical UUID is not hashed twice');
  await assert.rejects(createOrGetIngestJob({ userId: randomUUID(), sourceUrl: url, traceId: randomUUID() }), fault('AUTH_ACCOUNT_UNAVAILABLE'));
  await assert.rejects(actorContext.run({ ownerId: retainedOwner, authVersion: 0 },
    () => a.$transaction((tx) => lockQualifiedOwner(tx, retainedOwner))), fault('AUTH_CONTEXT_CHANGED'));
  console.log('auth persistence probe passed: independent clients, concurrent send, binding, replay, owner isolation, multi-device, logout and account barrier');
  console.log('legacy owner probe passed: quarantine, explicit binding, unchanged owner/source hash, no business-user auto-creation and stale qualification rejection');
} finally { await a.$disconnect(); await b.$disconnect(); await getPrisma()?.$disconnect(); }
