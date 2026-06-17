import fp from 'fastify-plugin';
import { z } from 'zod';
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
}).refine((body) => Boolean(body.otp || body.code), {
  message: 'otp or code is required',
  path: ['otp'],
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
  return 'off';
}

function getRetryAfterSec() {
  const value = Number(process.env.AUTH_OTP_RETRY_AFTER_SEC || 60);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 60;
}

function getSessionTtlSec() {
  const value = Number(process.env.AUTH_SESSION_TTL_SEC || 30 * 24 * 60 * 60);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 30 * 24 * 60 * 60;
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
  const uniqueIds = Array.from(new Set<LoginMethodId>(selectedIds));
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
  if (captchaToken) return false;
  const mode = getCaptchaMode();
  if (mode === 'off') return false;
  if (mode === 'always') return true;
  const risk = (req as any).risk as { ip: string; device: string } | undefined;
  const riskyDevices = new Set(getEnvList('AUTH_CAPTCHA_RISK_DEVICES'));
  const headerRisk = String(req.headers['x-auth-risk'] || '').toLowerCase() === 'captcha';
  return headerRisk || (risk?.device ? riskyDevices.has(risk.device) : false);
}

function deriveUserId(phone: string) {
  return `u_${Buffer.from(phone).toString('hex').slice(0, 12)}`;
}

function buildSession(userId: string, deviceId = 'current') {
  const created = new Date();
  const expires = new Date(created.getTime() + getSessionTtlSec() * 1000);
  return {
    id: userId,
    device_id: deviceId,
    created_at: created.toISOString(),
    expires_at: expires.toISOString(),
  };
}

function currentSession(req: any) {
  const risk = (req as any).risk as { ip: string; device: string } | undefined;
  return buildSession(req.user!.id, risk?.device || 'current');
}

export default fp(async (app) => {
  app.get('/auth/config', async () => getAuthConfig());

  app.post('/auth/otp/start', async (req: any, reply) => {
    const parsed = OtpStartBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    const captchaRequired = shouldRequireCaptcha(req, parsed.data.captcha_token);
    return reply.send({
      sent: !captchaRequired,
      retry_after_sec: getRetryAfterSec(),
      captcha_required: captchaRequired,
      captcha_provider: captchaRequired ? 'tencent' : undefined,
    });
  });

  app.post('/auth/otp/verify', async (req: any, reply) => {
    const parsed = OtpVerifyBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('AUTH_PARAMS_INVALID', 'invalid body', 400, false, { issues: parsed.error.issues });
    const sid = deriveUserId(parsed.data.phone);
    const deviceId = parsed.data.device_fingerprint || parsed.data.device_id || (req.headers['x-device-id'] as string | undefined) || 'current';
    const session = buildSession(sid, deviceId);
    reply.setCookie('sid', sid, getCookieOptions());
    return reply.send({
      user_id: sid,
      user: { id: sid, phone: null },
      session,
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
    return { sessions: [currentSession(req)] };
  });

  app.delete('/sessions/:id', { preHandler: authGuard }, async (req: any, reply) => {
    if (req.params.id !== req.user!.id) {
      return reply.sendError('AUTH_SESSION_NOT_FOUND', 'session not found', 404, false);
    }
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });

  app.post('/logout', { preHandler: authGuard }, async (req: any, reply) => {
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });
});
