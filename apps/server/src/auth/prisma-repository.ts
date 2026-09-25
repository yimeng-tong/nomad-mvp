import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { AuthFault, authAuthority } from './errors.js';
import { actorContext, lockQualifiedOwner } from './owner.js';
import { lockOperatorAuthority } from './operator.js';

export type PersistentSession = {
  transport: 'web' | 'native'; audience: string;
  id: string; user_id: string; device_id: string; auth_version: number;
  browser_binding_hash: string; browser_generation: number;
  created_at: Date; expires_at: Date;
};
export type LoginTransaction = {
  transport: 'web' | 'native'; audience: string;
  id: string; request_id: string; browser_binding_hash: string; initial_session_hash: string;
  browser_generation: number;
  phone: string; delivery_state: 'reserved' | 'sent' | 'unknown' | 'failed';
  attempts: number; verification_generation: number; verification_lease_until: Date | null;
  created_at: Date; expires_at: Date; next_allowed_at: Date; consumed_at: Date | null;
};
export type LoginIntent = { transport?: 'web' | 'native'; audience?: string; requestId: string; browserBindingHash: string; initialSessionHash: string; phone: string };
export type RateBucket = { key: string; limit: number; seconds: number };
type Tx = Prisma.TransactionClient;

/** One database authority shared by every API instance. All secrets arrive already hashed. */
export class PrismaAuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async ready() {
    return authAuthority(async () => {
      await this.db.$queryRaw`SELECT u.auth_state, u.auth_version, s.credential_hash, s.revoked_at, s.transport, s.audience
        FROM "User" u LEFT JOIN "Session" s ON s."userId"=u.id LIMIT 0`;
      await this.db.$queryRaw`SELECT browser_binding_hash, verification_generation FROM "AuthLoginTransaction" LIMIT 0`;
      await this.db.$queryRaw`SELECT binding_hash,login_generation,session_generation FROM "AuthBrowser" LIMIT 0`;
      const [row] = await this.db.$queryRaw<Array<{ count: number }>>`SELECT count(*)::integer AS count
        FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname=current_schema() AND i.indisunique AND i.indisvalid
          AND c.relname IN ('Session_credential_hash_key','OAuthIdentity_trusted_namespace_key','AuthLoginTransaction_request_key')`;
      if (row?.count !== 3) throw new AuthFault('AUTH_SCHEMA_NOT_READY', 503, true);
    });
  }

  async authenticate(hash: string): Promise<PersistentSession | null> {
    return authAuthority(async () => {
      const rows = await this.db.$queryRaw<PersistentSession[]>`SELECT s.id, s."userId" AS user_id,
          coalesce(s.device_fingerprint,'current') AS device_id, s.created_at, s.expires_at, s.auth_version,
          s.browser_binding_hash,s.browser_generation,s.transport,s.audience
        FROM "Session" s JOIN "User" u ON u.id=s."userId"
        JOIN "AuthBrowser" browser ON browser.binding_hash=s.browser_binding_hash AND browser.session_generation=s.browser_generation
        WHERE s.credential_hash=${hash} AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP
          AND u.auth_state='active' AND u.auth_version=s.auth_version`;
      return rows[0] ?? null;
    });
  }

  async reserveLogin(input: LoginIntent, buckets: RateBucket[]) {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      // Serialize both new intents and retries for one normalized phone across processes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-phone:${input.phone}`},0))`;
      const old = await tx.$queryRaw<LoginTransaction[]>`SELECT * FROM "AuthLoginTransaction"
        WHERE browser_binding_hash=${input.browserBindingHash} AND request_id=${input.requestId}::uuid FOR UPDATE`;
      if (old[0]) {
        if (old[0].phone !== input.phone || old[0].initial_session_hash !== input.initialSessionHash || old[0].transport !== (input.transport ?? 'web') || old[0].audience !== (input.audience ?? 'web')) {
          throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
        }
        if (old[0].consumed_at || old[0].expires_at.getTime() <= Date.now()) throw new AuthFault('AUTH_LOGIN_INTENT_EXPIRED', 409);
        return { transaction: old[0], shouldSend: false };
      }
      const cooldown = await tx.$queryRaw<Array<{ retry: number }>>`SELECT
          greatest(1,ceil(extract(epoch FROM (next_allowed_at-CURRENT_TIMESTAMP))))::integer AS retry
        FROM "AuthLoginTransaction" WHERE phone=${input.phone} AND next_allowed_at>CURRENT_TIMESTAMP
        ORDER BY next_allowed_at DESC LIMIT 1`;
      if (cooldown[0]) throw new AuthFault('AUTH_OTP_RETRY_LATER', 429, true, { retry_after_sec: cooldown[0].retry });
      await this.consumeBuckets(tx, buckets);
      const [browser] = await tx.$queryRaw<Array<{ login_generation: number }>>`INSERT INTO "AuthBrowser" (binding_hash,login_generation)
        VALUES (${input.browserBindingHash},1) ON CONFLICT (binding_hash) DO UPDATE
          SET login_generation="AuthBrowser".login_generation+1,updated_at=CURRENT_TIMESTAMP RETURNING login_generation`;
      const [transaction] = await tx.$queryRaw<LoginTransaction[]>`INSERT INTO "AuthLoginTransaction"
        (transport,audience,id,request_id,browser_binding_hash,browser_generation,initial_session_hash,phone,expires_at,next_allowed_at)
        VALUES (${input.transport ?? 'web'},${input.audience ?? 'web'},${randomUUID()}::uuid,${input.requestId}::uuid,${input.browserBindingHash},${browser.login_generation},${input.initialSessionHash},${input.phone},
          CURRENT_TIMESTAMP+interval '300 seconds',CURRENT_TIMESTAMP+interval '60 seconds') RETURNING *`;
      return { transaction, shouldSend: true };
    }));
  }

  async consumeVerificationBudget(buckets: RateBucket[]) {
    return authAuthority(() => this.db.$transaction((tx) => this.consumeBuckets(tx, buckets)));
  }

  private async consumeBuckets(tx: Tx, buckets: RateBucket[]) {
      for (const bucket of [...buckets].sort((a, b) => a.key.localeCompare(b.key))) {
        if (!Number.isSafeInteger(bucket.limit) || bucket.limit < 1 || !Number.isSafeInteger(bucket.seconds) || bucket.seconds < 1) {
          throw new AuthFault('AUTH_POLICY_INVALID', 503);
        }
        const [count] = await tx.$queryRaw<Array<{ count: number }>>`INSERT INTO "AuthRateLimit" (bucket,window_start,count,expires_at)
          VALUES (${bucket.key},to_timestamp(floor(extract(epoch FROM CURRENT_TIMESTAMP)/${bucket.seconds})*${bucket.seconds}),1,
            CURRENT_TIMESTAMP+make_interval(secs=>${bucket.seconds}*2))
          ON CONFLICT (bucket) DO UPDATE SET
            count=CASE WHEN "AuthRateLimit".window_start=EXCLUDED.window_start THEN "AuthRateLimit".count+1 ELSE 1 END,
            window_start=EXCLUDED.window_start,expires_at=EXCLUDED.expires_at RETURNING count`;
        if (count.count > bucket.limit) throw new AuthFault('AUTH_RATE_LIMITED', 429, true, { retry_after_sec: bucket.seconds });
      }
  }

  async findLogin(input: LoginIntent): Promise<LoginTransaction | null> {
    return authAuthority(async () => {
      const [row] = await this.db.$queryRaw<LoginTransaction[]>`SELECT * FROM "AuthLoginTransaction"
        WHERE request_id=${input.requestId}::uuid AND browser_binding_hash=${input.browserBindingHash}`;
      if (row && (row.phone !== input.phone || row.initial_session_hash !== input.initialSessionHash || row.transport !== (input.transport ?? 'web') || row.audience !== (input.audience ?? 'web'))) {
        throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
      }
      return row ?? null;
    });
  }

  async recentPhoneActivity(phone: string): Promise<boolean> {
    return authAuthority(async () => {
      const rows = await this.db.$queryRaw<Array<{ id: string }>>`SELECT id FROM "AuthLoginTransaction"
        WHERE phone=${phone} AND created_at>CURRENT_TIMESTAMP-interval '1 day' LIMIT 1`;
      return rows.length > 0;
    });
  }

  async phoneCooldown(phone: string): Promise<number> {
    return authAuthority(async () => {
      const [row] = await this.db.$queryRaw<Array<{ retry: number }>>`SELECT
        greatest(1,ceil(extract(epoch FROM (next_allowed_at-CURRENT_TIMESTAMP))))::integer AS retry
        FROM "AuthLoginTransaction" WHERE phone=${phone} AND next_allowed_at>CURRENT_TIMESTAMP
        ORDER BY next_allowed_at DESC LIMIT 1`;
      return row?.retry ?? 0;
    });
  }

  async markDelivery(id: string, state: 'sent' | 'unknown' | 'failed') {
    return authAuthority(async () => {
      const count = await this.db.$executeRaw`UPDATE "AuthLoginTransaction" SET delivery_state=${state}
        WHERE id=${id}::uuid AND delivery_state IN ('reserved','unknown') AND consumed_at IS NULL`;
      if (count !== 1) throw new AuthFault('AUTH_SEND_RESULT_UNKNOWN', 503, false, { challenge_id: id });
    });
  }

  async claimCaptcha(hash: string, requestId: string) {
    return authAuthority(async () => {
      const count = await this.db.$executeRaw`INSERT INTO "AuthCaptchaUse" (proof_hash,request_id,expires_at)
        VALUES (${hash},${requestId}::uuid,CURRENT_TIMESTAMP+interval '1 hour') ON CONFLICT DO NOTHING`;
      if (count !== 1) throw new AuthFault('AUTH_CAPTCHA_REPLAY', 400);
    });
  }

  async claimVerification(id: string, phone: string, bindingHash: string, contextHash: string): Promise<LoginTransaction> {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<LoginTransaction[]>`SELECT * FROM "AuthLoginTransaction"
        WHERE id=${id}::uuid AND phone=${phone} AND browser_binding_hash=${bindingHash} FOR UPDATE`;
      if (!row || row.consumed_at) throw new AuthFault('AUTH_OTP_INVALID');
      if (row.delivery_state === 'reserved') {
        // An abandoned send is never repeated. The provider's independent verification is still required.
        if (row.created_at.getTime() > Date.now() - 30000) throw new AuthFault('AUTH_SEND_IN_PROGRESS', 409, true, { retry_after_sec: 30 });
        await tx.$executeRaw`UPDATE "AuthLoginTransaction" SET delivery_state='unknown' WHERE id=${id}::uuid`;
        row.delivery_state = 'unknown';
      }
      if (!['sent', 'unknown'].includes(row.delivery_state)) throw new AuthFault('AUTH_OTP_INVALID');
      if (row.initial_session_hash !== contextHash) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
      const browsers = await tx.$queryRaw<Array<{ binding_hash: string }>>`SELECT binding_hash FROM "AuthBrowser"
        WHERE binding_hash=${bindingHash} AND login_generation=${row.browser_generation}`;
      if (!browsers[0]) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
      if (row.expires_at.getTime() <= Date.now()) throw new AuthFault('AUTH_OTP_EXPIRED');
      if (row.attempts >= 5) throw new AuthFault('AUTH_OTP_ATTEMPTS_EXCEEDED', 429);
      if (row.verification_lease_until && row.verification_lease_until.getTime() > Date.now()) {
        throw new AuthFault('AUTH_OTP_VERIFICATION_IN_PROGRESS', 409, true, { retry_after_sec: 1 });
      }
      const [claimed] = await tx.$queryRaw<LoginTransaction[]>`UPDATE "AuthLoginTransaction"
        SET attempts=attempts+1,verification_generation=verification_generation+1,
          verification_lease_until=CURRENT_TIMESTAMP+interval '20 seconds'
        WHERE id=${id}::uuid RETURNING *`;
      return claimed;
    }));
  }

  async releaseVerification(id: string, generation: number) {
    return authAuthority(() => this.db.$executeRaw`UPDATE "AuthLoginTransaction" SET verification_lease_until=NULL
      WHERE id=${id}::uuid AND verification_generation=${generation} AND consumed_at IS NULL`);
  }

  /** Internal only: called after the proof adapter returns a verified phone for this claimed transaction. */
  async completePhoneLogin(id: string, generation: number, hash: string, deviceId: string, ttl: number): Promise<PersistentSession> {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      const [challenge] = await tx.$queryRaw<LoginTransaction[]>`SELECT * FROM "AuthLoginTransaction"
        WHERE id=${id}::uuid AND verification_generation=${generation} AND consumed_at IS NULL
          AND expires_at>CURRENT_TIMESTAMP AND verification_lease_until>CURRENT_TIMESTAMP FOR UPDATE`;
      if (!challenge) throw new AuthFault('AUTH_OTP_INVALID');
      const [browser] = await tx.$queryRaw<Array<{ login_generation: number; session_generation: number }>>`SELECT login_generation,session_generation
        FROM "AuthBrowser" WHERE binding_hash=${challenge.browser_binding_hash} FOR UPDATE`;
      if (!browser || browser.login_generation !== challenge.browser_generation) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-identity:pnvs:${challenge.phone}`},0))`;
      const identities = await tx.$queryRaw<Array<{ user_id: string; verified_at: Date | null }>>`SELECT "userId" AS user_id,verified_at
        FROM "OAuthIdentity" WHERE provider='aliyun-pnvs' AND issuer='https://dypnsapi.aliyuncs.com'
          AND tenant='nomad' AND client_id='phone-login-v1' AND subject=${challenge.phone}`;
      let userId: string;
      if (identities[0]) {
        if (!identities[0].verified_at) throw new AuthFault('AUTH_IDENTITY_UNVERIFIED', 403);
        userId = identities[0].user_id;
      } else {
        userId = randomUUID();
        // Deliberately never look up or claim User.phone, legacy hashes or matching email.
        await tx.$executeRaw`INSERT INTO "User" (id,auth_state) VALUES (${userId}::uuid,'active')`;
        await tx.$executeRaw`INSERT INTO "OAuthIdentity" (id,"userId",provider,issuer,tenant,client_id,subject,verified_at)
          VALUES (${randomUUID()}::uuid,${userId}::uuid,'aliyun-pnvs','https://dypnsapi.aliyuncs.com','nomad','phone-login-v1',${challenge.phone},CURRENT_TIMESTAMP)`;
      }
      const [owner] = await tx.$queryRaw<Array<{ auth_state: string; auth_version: number }>>`SELECT auth_state,auth_version
        FROM "User" WHERE id=${userId}::uuid FOR UPDATE`;
      if (owner?.auth_state !== 'active') throw new AuthFault('AUTH_ACCOUNT_UNAVAILABLE', 403);
      const [session] = await tx.$queryRaw<PersistentSession[]>`INSERT INTO "Session"
        (transport,audience,id,"userId",device_fingerprint,credential_hash,auth_version,browser_binding_hash,browser_generation,expires_at)
        VALUES (${challenge.transport},${challenge.audience},${randomUUID()}::uuid,${userId}::uuid,${deviceId},${hash},${owner.auth_version},${challenge.browser_binding_hash},${browser.session_generation + 1},CURRENT_TIMESTAMP+make_interval(secs=>${ttl}))
        RETURNING id,"userId" AS user_id,device_fingerprint AS device_id,created_at,expires_at,auth_version,browser_binding_hash,browser_generation,transport,audience`;
      await tx.$executeRaw`UPDATE "AuthBrowser" SET session_generation=session_generation+1,updated_at=CURRENT_TIMESTAMP
        WHERE binding_hash=${challenge.browser_binding_hash}`;
      // Replace only the session carried by this browser when the intent began, never other devices.
      await tx.$executeRaw`UPDATE "Session" SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP)
        WHERE credential_hash=${challenge.initial_session_hash}`;
      await tx.$executeRaw`UPDATE "AuthLoginTransaction" SET consumed_at=CURRENT_TIMESTAMP,verification_lease_until=NULL WHERE id=${id}::uuid`;
      await this.audit(tx, userId, 'login', session.id);
      return session;
    }));
  }

  async listSessions(ownerId: string) {
    return authAuthority(() => this.db.$queryRaw<PersistentSession[]>`SELECT s.id,s."userId" AS user_id,
        coalesce(s.device_fingerprint,'current') AS device_id,s.created_at,s.expires_at,s.auth_version,s.browser_binding_hash,s.browser_generation,s.transport,s.audience
      FROM "Session" s JOIN "User" u ON u.id=s."userId"
      JOIN "AuthBrowser" browser ON browser.binding_hash=s.browser_binding_hash AND browser.session_generation=s.browser_generation
      WHERE s."userId"=${ownerId}::uuid AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP
        AND u.auth_state='active' AND u.auth_version=s.auth_version ORDER BY s.created_at,s.id`);
  }

  async revokeSession(id: string, ownerId: string): Promise<boolean> {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      const [target] = await tx.$queryRaw<Array<{ browser_binding_hash: string | null; browser_generation: number | null }>>`SELECT browser_binding_hash,browser_generation
        FROM "Session" WHERE id=${id}::uuid AND "userId"=${ownerId}::uuid`;
      if (!target) return false;
      const actor = actorContext.getStore();
      // Two devices can revoke each other. Acquire all browser locks in a stable order before owner/session locks.
      const caller = actor?.sessionId ? await tx.$queryRaw<Array<{ browser_binding_hash: string | null }>>`
        SELECT browser_binding_hash FROM "Session" WHERE id=${actor.sessionId}::uuid` : [];
      for (const hash of [...new Set([target.browser_binding_hash, caller[0]?.browser_binding_hash].filter((value): value is string => Boolean(value)))].sort()) {
        await tx.$queryRaw`SELECT binding_hash FROM "AuthBrowser" WHERE binding_hash=${hash} FOR UPDATE`;
      }
      await lockQualifiedOwner(tx, ownerId);
      if (target.browser_binding_hash) await this.invalidateBrowser(tx, target.browser_binding_hash, target.browser_generation);
      const rows = await tx.$queryRaw<Array<{ id: string }>>`UPDATE "Session" SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP)
        WHERE id=${id}::uuid AND "userId"=${ownerId}::uuid RETURNING id`;
      if (!rows[0]) return false;
      await this.audit(tx, ownerId, 'session-revoked', id);
      return true;
    }));
  }

  async revokeCredential(hash: string) {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      const [target] = await tx.$queryRaw<Array<{ browser_binding_hash: string | null; browser_generation: number | null }>>`SELECT browser_binding_hash,browser_generation
        FROM "Session" WHERE credential_hash=${hash}`;
      if (target?.browser_binding_hash) await this.invalidateBrowser(tx, target.browser_binding_hash, target.browser_generation);
      const rows = await tx.$queryRaw<Array<{ id: string; user_id: string }>>`UPDATE "Session"
        SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP) WHERE credential_hash=${hash}
        RETURNING id,"userId" AS user_id`;
      if (rows[0]) await this.audit(tx, rows[0].user_id, 'logout', rows[0].id);
    }));
  }

  /** A high-entropy operation ID confirms a lost logout response without granting authentication. */
  async logout(hash: string | undefined, operationId: string, ownerId: string, sessionId: string) {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-logout:${operationId}`},0))`;
      const receipts = await tx.$queryRaw<Array<{ user_id: string | null; target_id: string | null; action: string }>>`SELECT user_id,target_id,action
        FROM "AuthAuditEvent" WHERE id=${operationId}::uuid`;
      if (receipts[0]) {
        if (receipts[0].action !== 'logout' || receipts[0].user_id !== ownerId || receipts[0].target_id !== sessionId) {
          throw new AuthFault('AUTH_IDEMPOTENCY_CONFLICT', 409);
        }
        // A receipt for A must never clear a newer B cookie during a delayed retry.
        const current = hash ? await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "Session"
          WHERE credential_hash=${hash} AND id=${sessionId}::uuid AND "userId"=${ownerId}::uuid` : [];
        return { clearCookie: current.length > 0 };
      }
      if (!hash) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
      const [target] = await tx.$queryRaw<Array<{ id: string; user_id: string; browser_binding_hash: string | null; browser_generation: number | null }>>`
        SELECT id,"userId" AS user_id,browser_binding_hash,browser_generation FROM "Session" WHERE credential_hash=${hash}`;
      if (!target) throw new AuthFault('AUTH_SESSION_EXPIRED', 401);
      if (target.id !== sessionId || target.user_id !== ownerId) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
      if (target.browser_binding_hash) await this.invalidateBrowser(tx, target.browser_binding_hash, target.browser_generation);
      await tx.$executeRaw`UPDATE "Session" SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP) WHERE id=${sessionId}::uuid`;
      await tx.$executeRaw`INSERT INTO "AuthAuditEvent" (id,user_id,action,target_id)
        VALUES (${operationId}::uuid,${ownerId}::uuid,'logout',${sessionId})`;
      return { clearCookie: true };
    }));
  }

  /** Controlled maintenance entry, never bound to an ordinary caller's role/claims/body. */
  async deactivateOwner(ownerId: string, state: 'disabled' | 'deleting' | 'deleted', evidence: string) {
    if (!evidence.trim()) throw new AuthFault('AUTH_ADMIN_EVIDENCE_REQUIRED', 400);
    return authAuthority(() => this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`UPDATE "User" SET auth_state=${state},auth_version=auth_version+1
        WHERE id=${ownerId}::uuid RETURNING id`;
      if (!rows[0]) throw new AuthFault('AUTH_OWNER_NOT_FOUND', 404);
      await tx.$executeRaw`UPDATE "Session" SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP) WHERE "userId"=${ownerId}::uuid`;
      await this.audit(tx, ownerId, 'account-deactivated', ownerId, evidence);
    }));
  }

  async capabilities(ownerId: string) {
    return authAuthority(() => this.db.$queryRaw<Array<{ capability: string; scope: string; version: number }>>`SELECT g.capability,g.scope,g.version
      FROM "AuthOperatorGrant" g JOIN "User" u ON u.id=g.user_id
      WHERE g.user_id=${ownerId}::uuid AND g.revoked_at IS NULL AND u.auth_state='active'`);
  }

  async checkOperatorAccess(ownerId: string, capability: string, scope: string, version: number, operationId: string) {
    return authAuthority(() => this.db.$transaction(async (tx) => {
      await lockOperatorAuthority(tx, ownerId, capability, scope, version);
      const target = `${capability}:${scope}:${version}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`operator-check:${operationId}`},0))`;
      const [old] = await tx.$queryRaw<Array<{ user_id: string; action: string; target_id: string; created_at: Date }>>`SELECT user_id,action,target_id,created_at
        FROM "AuthAuditEvent" WHERE id=${operationId}::uuid`;
      if (old) {
        if (old.user_id !== ownerId || old.action !== 'operator-access-check' || old.target_id !== target) throw new AuthFault('AUTH_IDEMPOTENCY_CONFLICT', 409);
        return { receipt_id: operationId, verified_at: old.created_at.toISOString() };
      }
      const [receipt] = await tx.$queryRaw<Array<{ created_at: Date }>>`INSERT INTO "AuthAuditEvent" (id,user_id,action,target_id)
        VALUES (${operationId}::uuid,${ownerId}::uuid,'operator-access-check',${target}) RETURNING created_at`;
      return { receipt_id: operationId, verified_at: receipt.created_at.toISOString() };
    }));
  }

  private async audit(tx: Tx, ownerId: string, action: string, targetId: string, evidence?: string) {
    await tx.$executeRaw`INSERT INTO "AuthAuditEvent" (id,user_id,action,target_id,evidence_reference)
      VALUES (${randomUUID()}::uuid,${ownerId}::uuid,${action},${targetId},${evidence ?? null})`;
  }

  private async invalidateBrowser(tx: Tx, hash: string, sessionGeneration: number | null) {
    await tx.$executeRaw`UPDATE "AuthBrowser" SET login_generation=login_generation+1,session_generation=session_generation+1,updated_at=CURRENT_TIMESTAMP
      WHERE binding_hash=${hash} AND session_generation=${sessionGeneration}`;
  }
}
