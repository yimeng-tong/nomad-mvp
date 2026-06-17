import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

export type AuthSession = {
  id: string;
  user_id: string;
  device_id: string;
  created_at: string;
  expires_at: string;
};

type OtpChallenge = {
  phone: string;
  region: string;
  code_hash: string;
  expires_at_ms: number;
  next_allowed_at_ms: number;
};

const otpChallenges = new Map<string, OtpChallenge>();
const sessions = new Map<string, AuthSession>();

function boundedEnvInt(name: string, fallback: number, max: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}

export function getOtpRetryAfterSec() {
  return boundedEnvInt('AUTH_OTP_RETRY_AFTER_SEC', 60, 15 * 60);
}

export function getOtpTtlSec() {
  return boundedEnvInt('AUTH_OTP_TTL_SEC', 5 * 60, 30 * 60);
}

export function getSessionTtlSec() {
  return boundedEnvInt('AUTH_SESSION_TTL_SEC', 30 * 24 * 60 * 60, 365 * 24 * 60 * 60);
}

export function normalizePhone(phone: string) {
  return phone.replace(/[ -]/g, '');
}

export function deriveUserId(phone: string) {
  return `u_${createHash('sha256').update(normalizePhone(phone)).digest('hex').slice(0, 24)}`;
}

function hashOtp(phone: string, code: string) {
  const secret = process.env.AUTH_OTP_STUB_SECRET || 'nomad-local-otp-stub';
  return createHash('sha256').update(`${secret}:${normalizePhone(phone)}:${code}`).digest('hex');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function issueOtpChallenge(phone: string, region: string) {
  const normalizedPhone = normalizePhone(phone);
  const now = Date.now();
  const existing = otpChallenges.get(normalizedPhone);
  if (existing && existing.next_allowed_at_ms > now) {
    return {
      ok: false as const,
      retry_after_sec: Math.max(1, Math.ceil((existing.next_allowed_at_ms - now) / 1000)),
    };
  }

  const retryAfterSec = getOtpRetryAfterSec();
  const code = process.env.AUTH_OTP_STUB_CODE || '000000';
  otpChallenges.set(normalizedPhone, {
    phone: normalizedPhone,
    region,
    code_hash: hashOtp(normalizedPhone, code),
    expires_at_ms: now + getOtpTtlSec() * 1000,
    next_allowed_at_ms: now + retryAfterSec * 1000,
  });

  return { ok: true as const, retry_after_sec: retryAfterSec };
}

export function verifyOtpChallenge(phone: string, code: string) {
  const normalizedPhone = normalizePhone(phone);
  const challenge = otpChallenges.get(normalizedPhone);
  if (!challenge) {
    return { ok: false as const, error_code: 'AUTH_OTP_INVALID', message: 'invalid otp', status: 401 };
  }
  if (challenge.expires_at_ms <= Date.now()) {
    otpChallenges.delete(normalizedPhone);
    return { ok: false as const, error_code: 'AUTH_OTP_EXPIRED', message: 'otp expired', status: 401 };
  }
  if (!safeEqual(challenge.code_hash, hashOtp(normalizedPhone, code))) {
    return { ok: false as const, error_code: 'AUTH_OTP_INVALID', message: 'invalid otp', status: 401 };
  }

  otpChallenges.delete(normalizedPhone);
  return { ok: true as const, user_id: deriveUserId(normalizedPhone) };
}

export function createSession(userId: string, deviceId: string) {
  const created = new Date();
  const expires = new Date(created.getTime() + getSessionTtlSec() * 1000);
  const session: AuthSession = {
    id: `sess_${randomUUID()}`,
    user_id: userId,
    device_id: deviceId,
    created_at: created.toISOString(),
    expires_at: expires.toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  if (Date.parse(session.expires_at) <= Date.now()) {
    sessions.delete(sessionId);
    return undefined;
  }
  return session;
}

export function listSessions(userId: string) {
  return Array.from(sessions.values()).filter((session) => getSession(session.id)?.user_id === userId);
}

export function revokeSession(sessionId: string, userId?: string) {
  const session = getSession(sessionId);
  if (!session) return false;
  if (userId && session.user_id !== userId) return false;
  return sessions.delete(sessionId);
}

export function clearAuthStateForTests() {
  otpChallenges.clear();
  sessions.clear();
}
