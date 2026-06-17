import fp from 'fastify-plugin';
import { z } from 'zod';
import {
  createSession,
  getOtpRetryAfterSec,
  getSessionTtlSec,
  issueOtpChallenge,
  listSessions,
  revokeSession,
  verifyOtpChallenge,
  type AuthSession,
} from '../auth/session-store.js';
import { authGuard } from '../plugins/auth.js';

const PhoneSchema = z.string().trim().min(6).max(32).regex(/^\+?[0-9][0-9 -]{4,30}[0-9]$/);
const RegionSchema = z.string().trim().min(2).max(8).regex(/^[A-Z]{2,8}$/);
const OtpStartBody = z.object({
  phone: PhoneSchema,
  region: RegionSchema.default('CN'),
  captcha_token: z.string().trim().min(1).max(2048).optional().nullable(),
});
const OtpVerifyBody = z.object({
  phone: PhoneSchema,
  otp: z.string().trim().min(4).max(12).optional(),
  code: z.string().trim().min(4).max(12).optional(),
  device_fingerprint: z.string().trim().min(1).max(128).optional(),
  device_id: z.string().trim().min(1).max(128).optional(),
}).superRefine((body, ctx) => {
  if (!body.otp && !body.code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'otp or code is required', path: ['otp'] });
  }
  if (body.otp && body.code && body.otp !== body.code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'otp and code must match when both are provided', path: ['code'] });
  }
});

type CaptchaMode = 'off' | 'risk' | 'always';
type LoginMethodId = 'phone' | 'apple' | 'wechat';

const LOGIN_METHODS: Record<LoginMethodId, { label: string; type: 'phone' | 'third_party'; provider?: string }> = {
  phone: { label: 'Phone', type: 'phone' },
  apple: { label: 'Apple', type: 'third_party', provider: 'apple' },
  wechat: { label: 'WeChat', type: 'third_party', provider: 'wechat' },
};
const IOS_EQUAL_WEIGHT_ORDER: LoginMethodId[] = ['apple', 'phone', 'wechat'];

function getEnvList(name: string, fallback = '') {
  return (process.env[name] || fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function getCaptchaMode(): CaptchaMode {
  const mode = (process.env.AUTH_CAPTCHA_MODE || process.env.AUTH_OTP_CAPTCHA_MODE || 'off').toLowerCase();
  if (mode === 'risk' || mode === 'always') return mode;
  return mode === 'off' ? 'off' : 'always';
}

function getCookieSameSite() {
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  if (sameSite === 'strict' || sameSite === 'none') return sameSite;
  return 'lax';
}

function getCookieOptions() {
  const sameSite = getCookieSameSite();
  const secure = process.env.AUTH_COOKIE_SECURE === 'true' || sameSite === 'none';
  return {
    httpOnly: true,
    sameSite,
    path: '/',
    secure,
    maxAge: getSessionTtlSec(),
  } as const;
}

function getEnabledMethods() {
  const configured = getEnvList('AUTH_LOGIN_METHODS', 'phone') as LoginMethodId[];
  const ids = configured.filter((id): id is LoginMethodId => id in LOGIN_METHODS);
  const selectedIds: LoginMethodId[] = ids.length > 0 ? ids : ['phone'];
  const hasThirdParty = selectedIds.some((id) => id === 'apple' || id === 'wechat');
  const compliantIds = hasThirdParty ? IOS_EQUAL_WEIGHT_ORDER : selectedIds;
  const uniqueIds = Array.from(new Set<LoginMethodId>(compliantIds));
  return uniqueIds.map((id) => ({ id, ...LOGIN_METHODS[id], enabled: true }));
}

function getAuthConfig() {
  const enabledMethods = getEnabledMethods();
  const enabledIds = new Set(enabledMethods.map((method) => method.id));
  return {
    privacy_url: process.env.AUTH_PRIVACY_URL || '/legal/privacy',
    user_agreement_url: process.env.AUTH_USER_AGREEMENT_URL || process.env.AUTH_TERMS_URL || '/legal/terms',
    enabled_methods: enabledMethods,
    ios_equal_weight_order: IOS_EQUAL_WEIGHT_ORDER.filter((id) => enabledIds.has(id)),
    captcha: {
      provider: 'tencent',
      mode: getCaptchaMode(),
    },
  };
}

function shouldRequireCaptcha(req: any, captchaToken?: string | null) {
  const mode = getCaptchaMode();
  if (mode === 'off') return false;
  if (captchaToken && captchaToken === (process.env.AUTH_CAPTCHA_STUB_TOKEN || 'captcha-ok')) return false;
  if (mode === 'always') return true;
  const risk = (req as any).risk as { ip: string; device: string } | undefined;
  const riskyDevices = new Set(getEnvList('AUTH_CAPTCHA_RISK_DEVICES'));
  const headerRisk = String(req.headers['x-auth-risk'] || '').toLowerCase() === 'captcha';
  return headerRisk || (risk?.device ? riskyDevices.has(risk.device) : false);
}

function isPhoneLoginEnabled() {
  return getEnabledMethods().some((method) => method.id === 'phone');
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? undefined : value;
}

function sessionForResponse(session: AuthSession) {
  const { id, device_id, created_at, expires_at } = session;
  return { id, device_id, created_at, expires_at };
}

function fallbackSession(userId: string, deviceId = 'current') {
  const created = new Date();
  const expires = new Date(created.getTime() + getSessionTtlSec() * 1000);
  return {
    id: `header_${userId}`,
    device_id: deviceId,
    created_at: created.toISOString(),
    expires_at: expires.toISOString(),
  };
}

function currentSession(req: any) {
  const risk = (req as any).risk as { ip: string; device: string } | undefined;
  return req.authSession ? sessionForResponse(req.authSession) : fallbackSession(req.user!.id, risk?.device || 'current');
}

export default fp(async (app) => {
  app.get('/auth/config', async () => getAuthConfig());

  app.post('/auth/otp/start', async (req: any, reply) => {
    const parsed = OtpStartBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    if (!isPhoneLoginEnabled()) return reply.sendError('AUTH_METHOD_DISABLED', 'phone login disabled', 403, false);
    const captchaRequired = shouldRequireCaptcha(req, parsed.data.captcha_token);
    if (!captchaRequired) {
      const issued = issueOtpChallenge(parsed.data.phone, parsed.data.region);
      if (!issued.ok) {
        return reply.header('Retry-After', issued.retry_after_sec).sendError('AUTH_OTP_RETRY_LATER', 'retry later', 429, true, {
          retry_after_sec: issued.retry_after_sec,
        });
      }
    }
    return reply.send({
      sent: !captchaRequired,
      retry_after_sec: getOtpRetryAfterSec(),
      captcha_required: captchaRequired,
      captcha_provider: captchaRequired ? 'tencent' : undefined,
    });
  });

  app.post('/auth/otp/verify', async (req: any, reply) => {
    const parsed = OtpVerifyBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    if (!isPhoneLoginEnabled()) return reply.sendError('AUTH_METHOD_DISABLED', 'phone login disabled', 403, false);
    const verified = verifyOtpChallenge(parsed.data.phone, parsed.data.otp || parsed.data.code!);
    if (!verified.ok) return reply.sendError(verified.error_code, verified.message, verified.status, false);
    const deviceId = parsed.data.device_fingerprint || parsed.data.device_id || headerValue(req.headers['x-device-id']) || 'current';
    const session = createSession(verified.user_id, deviceId);
    reply.header('X-Device-Id', deviceId);
    reply.setCookie('sid', session.id, getCookieOptions());
    return reply.send({
      user_id: verified.user_id,
      user: { id: verified.user_id, phone: null },
      session: sessionForResponse(session),
    });
  });

  app.get('/me', { preHandler: authGuard }, async (req: any) => {
    return {
      user_id: req.user!.id,
      user: { id: req.user!.id, phone: null },
      session: currentSession(req),
    };
  });

  app.get('/sessions/me', { preHandler: authGuard }, async (req: any) => {
    return {
      user: { id: req.user!.id, phone: null },
      session: currentSession(req),
    };
  });

  app.get('/sessions', { preHandler: authGuard }, async (req: any) => {
    const sessions = req.authSession ? listSessions(req.user!.id).map(sessionForResponse) : [currentSession(req)];
    return { sessions };
  });

  app.delete('/sessions/:id', { preHandler: authGuard }, async (req: any, reply) => {
    if (!revokeSession(req.params.id, req.user!.id)) {
      return reply.sendError('AUTH_SESSION_NOT_FOUND', 'session not found', 404, false);
    }
    if (req.authSession?.id === req.params.id) reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });

  app.post('/logout', async (req: any, reply) => {
    const sid = (req.cookies as any)?.sid as string | undefined;
    if (sid) revokeSession(sid);
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });
});
