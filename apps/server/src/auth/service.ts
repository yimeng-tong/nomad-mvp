import { createHash } from 'node:crypto';
import type { components } from '../../../../packages/types/src/api-types.js';
import { AuthFault } from './errors.js';
import { browserBindingHash, credentialHash, nativeBindingHash, nativeCredentialHash, newCredential, normalizeCnPhone, proofHash, validCredential } from './credentials.js';
import type { PhoneProofProvider, GraphicProof } from './pnvs-provider.js';
import type { LoginIntent, LoginTransaction, PersistentSession, PrismaAuthRepository } from './prisma-repository.js';
import type { AuthRuntimeConfig } from './runtime-config.js';

export type AuthRequestContext = { sessionSecret?: string; bindingSecret?: string; ip: string; native?: boolean };
export type AuthCookieSink = { binding(secret: string): void; session(secret: string, publicId: string): void; clearSession(publicId: string): void };
type PublicSession = components['schemas']['Session'];
type CurrentUser = components['schemas']['CurrentUserResponse'];
type StartResponse = components['schemas']['OtpStartResponse'];

export function publicSession(session: PersistentSession): PublicSession {
  return { id: session.id, device_id: session.device_id, created_at: session.created_at.toISOString(), expires_at: session.expires_at.toISOString() };
}
export function publicUser(session: PersistentSession): CurrentUser {
  return { user_id: session.user_id, user: { id: session.user_id, phone: null }, session: publicSession(session) };
}

/** HTTP-free core. Callers supply server-derived context and cookie sinks, never client claims. */
export class PersistentAuthService {
  readonly cookieNames: { session: string; binding: string };
  constructor(readonly config: AuthRuntimeConfig, readonly repository: PrismaAuthRepository, private readonly proof: PhoneProofProvider) {
    if (config.provider.kind !== 'aliyun-pnvs' || config.captcha.kind !== 'aliyun-pnvs' || config.loginMethods.some((method) => method !== 'phone')) {
      throw new AuthFault('AUTH_IMPLEMENTATION_UNAVAILABLE', 503);
    }
    this.cookieNames = config.cookie.secure
      ? { session: '__Host-nomad-sid', binding: '__Host-nomad-login' }
      : { session: 'nomad-local-sid', binding: 'nomad-local-login' };
  }

  publicConfig(): components['schemas']['AuthConfigResponse'] {
    if (this.config.captcha.kind !== 'aliyun-pnvs') throw new AuthFault('AUTH_IMPLEMENTATION_UNAVAILABLE', 503);
    return {
      availability: this.config.legal ? 'ready' : 'unavailable', privacy_url: this.config.legal?.privacyUrl ?? '', user_agreement_url: this.config.legal?.agreementUrl ?? '',
      enabled_methods: [{ id: 'phone', label: '手机号', type: 'phone', enabled: !!this.config.legal }], ios_equal_weight_order: ['phone'],
      captcha: { provider: 'aliyun-pnvs', mode: this.config.captcha.mode, app_id: this.config.captcha.appId, sdk_url: '/vendor/pnvs/ct4.js' },
    };
  }

  async authenticate(secret?: string, native = false) {
    if (native && !this.config.nativeEnabled) throw new AuthFault('AUTH_NATIVE_UNAVAILABLE', 503);
    const session = secret && validCredential(secret) ? await this.repository.authenticate(this.sessionHash(secret, native)) : null;
    if (session && (session.transport !== (native ? 'native' : 'web') || session.audience !== (native ? this.config.apiOrigin : 'web'))) return null;
    return session;
  }

  private sessionHash(secret: string, native = false) { return native ? nativeCredentialHash(secret, this.config.apiOrigin) : credentialHash(secret); }
  private bindingHash(secret: string, native = false) { return native ? nativeBindingHash(secret, this.config.apiOrigin) : browserBindingHash(secret); }


  sessionCookieName(publicId: string) { return `${this.cookieNames.session}-${publicId}`; }

  async authenticateCookies(cookies: Record<string, string | undefined> = {}) {
    const prefix = `${this.cookieNames.session}-`;
    const candidates = Object.entries(cookies).filter(([name, secret]) => name.startsWith(prefix) && secret && validCredential(secret));
    if (candidates.length > 16) throw new AuthFault('AUTH_COOKIE_LIMIT', 400);
    const matches = [];
    for (const [name, secret] of candidates) {
      const session = await this.authenticate(secret);
      if (session && name === this.sessionCookieName(session.id)) matches.push({ session, secret });
    }
    // Old responses can add only their own stale cookie; they cannot overwrite the newer session cookie.
    if (matches.length > 1) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
    return matches[0] ?? null;
  }

  private initialContext(context: AuthRequestContext) {
    return this.sessionHash(context.sessionSecret && validCredential(context.sessionSecret) ? context.sessionSecret : 'no-session', context.native);
  }

  private startResponse(transaction: LoginTransaction): StartResponse {
    if (transaction.consumed_at || transaction.expires_at.getTime() <= Date.now()) throw new AuthFault('AUTH_LOGIN_INTENT_EXPIRED', 409);
    if (transaction.delivery_state === 'failed') throw new AuthFault('AUTH_SEND_REJECTED', 503);
    return {
      sent: transaction.delivery_state === 'sent', delivery_state: transaction.delivery_state === 'sent' ? 'sent' : 'unknown',
      captcha_required: false, challenge_id: transaction.id,
      retry_after_sec: Math.max(1, Math.ceil((transaction.next_allowed_at.getTime() - Date.now()) / 1000)),
    };
  }

  async start(input: { phone: string; region?: string; requestId: string; captcha?: GraphicProof }, context: AuthRequestContext, cookies: AuthCookieSink): Promise<StartResponse> {
    if (!this.config.legal) throw new AuthFault('AUTH_LEGAL_UNAVAILABLE', 503);
    const phone = normalizeCnPhone(input.phone, input.region);
    const binding = context.bindingSecret && validCredential(context.bindingSecret) ? context.bindingSecret : newCredential();
    if (binding !== context.bindingSecret) cookies.binding(binding);
    const intent: LoginIntent = { phone, requestId: input.requestId, transport: context.native ? 'native' : 'web', audience: context.native ? this.config.apiOrigin : 'web', browserBindingHash: this.bindingHash(binding, context.native), initialSessionHash: this.initialContext(context) };
    const current = await this.authenticate(context.sessionSecret, context.native);
    if (current && current.browser_binding_hash !== intent.browserBindingHash) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
    const previous = await this.repository.findLogin(intent);
    if (previous) return this.startResponse(previous); // A retry never repeats an uncertain external send.
    const cooldown = await this.repository.phoneCooldown(phone);
    if (cooldown) throw new AuthFault('AUTH_OTP_RETRY_LATER', 429, true, { retry_after_sec: cooldown });

    // Anonymous browsers and repeat phone attempts are risk triggers. A device/header never bypasses them.
    const needsCaptcha = this.config.captcha.mode === 'always' || !current || await this.repository.recentPhoneActivity(phone);
    if (needsCaptcha && !input.captcha) {
      return { sent: false, delivery_state: 'captcha_required', captcha_required: true, captcha_provider: 'aliyun-pnvs', retry_after_sec: 1 };
    }
    const bucket = (kind: string, value: string, limit: number, seconds: number) => ({
      key: createHash('sha256').update(`nomad-auth-v1\0${kind}\0${value}`).digest('hex'), limit, seconds,
    });
    if (input.captcha) {
      await this.repository.consumeVerificationBudget([
        bucket('graphic-ip-minute', context.ip, 30, 60), bucket('graphic-service-minute', 'global', 100, 60),
        bucket('graphic-service-day', 'global', 1000, 86400),
      ]);
      await this.repository.claimCaptcha(proofHash(input.captcha.lot_number), input.requestId);
      await this.proof.verifyGraphic(input.captcha);
    }
    const reservation = await this.repository.reserveLogin(intent, [
      bucket('phone-day', phone, 5, 86400), bucket('ip-hour', context.ip, 20, 3600),
      bucket('service-minute', 'global', 20, 60), bucket('service-day', 'global', 200, 86400),
    ]);
    if (!reservation.shouldSend) return this.startResponse(reservation.transaction);
    try {
      await this.proof.send(phone, reservation.transaction.id);
    } catch (error) {
      if (error instanceof AuthFault && ['AUTH_SEND_REJECTED', 'AUTH_PROVIDER_RATE_LIMITED'].includes(error.code)) {
        await this.repository.markDelivery(reservation.transaction.id, 'failed');
        throw error;
      }
      await this.repository.markDelivery(reservation.transaction.id, 'unknown');
      return this.startResponse({ ...reservation.transaction, delivery_state: 'unknown' });
    }
    await this.repository.markDelivery(reservation.transaction.id, 'sent');
    return this.startResponse({ ...reservation.transaction, delivery_state: 'sent' });
  }

  async verify(input: { phone: string; challengeId: string; code: string; deviceId: string }, context: AuthRequestContext, cookies: AuthCookieSink): Promise<CurrentUser> {
    if (!this.config.legal) throw new AuthFault('AUTH_LEGAL_UNAVAILABLE', 503);
    const phone = normalizeCnPhone(input.phone);
    if (!/^\d{6}$/.test(input.code)) throw new AuthFault('AUTH_OTP_INVALID', 401);
    if (!context.bindingSecret || !validCredential(context.bindingSecret)) throw new AuthFault('AUTH_OTP_INVALID', 401);
    const claim = await this.repository.claimVerification(input.challengeId, phone, this.bindingHash(context.bindingSecret, context.native), this.initialContext(context));
    try {
      if (!await this.proof.verify(phone, input.code, claim.id)) throw new AuthFault('AUTH_OTP_INVALID', 401);
      const secret = newCredential();
      const session = await this.repository.completePhoneLogin(claim.id, claim.verification_generation, this.sessionHash(secret, context.native), input.deviceId, this.config.sessionTtlSec);
      cookies.binding(context.bindingSecret); // Renew with the same lifetime as the new session.
      cookies.session(secret, session.id); // Only after durable commit; the public result contains no credential.
      return publicUser(session);
    } catch (error) {
      await this.repository.releaseVerification(claim.id, claim.verification_generation);
      throw error;
    }
  }

  assertExpected(session: PersistentSession, owner: string | undefined, publicId: string | undefined) {
    if (!owner || !publicId) throw new AuthFault('AUTH_CONTEXT_REQUIRED', 400);
    if (session.user_id !== owner || session.id !== publicId) throw new AuthFault('AUTH_CONTEXT_CHANGED', 409);
  }

  async logout(operationId: string, ownerId: string, sessionId: string, context: AuthRequestContext, cookies: AuthCookieSink) {
    const hash = context.sessionSecret && validCredential(context.sessionSecret) ? this.sessionHash(context.sessionSecret, context.native) : undefined;
    const result = await this.repository.logout(hash, operationId, ownerId, sessionId);
    if (result.clearCookie) cookies.clearSession(sessionId);
    return { ok: true };
  }
}
