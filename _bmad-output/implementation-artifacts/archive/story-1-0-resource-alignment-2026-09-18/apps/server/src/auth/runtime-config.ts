import { isIP } from 'node:net';

export type AuthRuntimeMode = 'local' | 'test' | 'staging' | 'production';
export type AuthLoginMethod = 'apple' | 'phone' | 'wechat';
export type AuthEnvironment = Readonly<Record<string, string | undefined>>;
export type AuthConfigurationIssue = Readonly<{
  field: string;
  reason: 'required' | 'invalid' | 'forbidden';
}>;

export class AuthConfigurationError extends Error {
  readonly code = 'AUTH_CONFIGURATION_INVALID';
  readonly issues: readonly AuthConfigurationIssue[];

  constructor(issues: readonly AuthConfigurationIssue[]) {
    // Configuration errors may be logged at startup. Never attach source values or URL parser errors.
    const unique = [...new Map(issues.map((issue) => [`${issue.field}:${issue.reason}`, issue])).values()];
    super(`Authentication configuration is invalid: ${unique.map((issue) => issue.field).join(', ')}`);
    this.name = 'AuthConfigurationError';
    this.issues = unique;
  }
}

type IdentityProviderConfiguration =
  | { kind: 'fixture' }
  | { kind: 'authing'; issuer: string; appId: string; appSecret: string }
  | { kind: 'jiguang'; appKey: string; masterSecret: string };

type CaptchaMode = 'off' | 'risk' | 'always';
type CaptchaConfiguration =
  | { kind: 'fixture'; mode: CaptchaMode }
  | {
    kind: 'tencent'; mode: 'risk' | 'always'; appId: string; appSecret: string;
    cloudSecretId: string; cloudSecretKey: string;
  };

export type AuthRuntimeConfig = Readonly<{
  mode: AuthRuntimeMode;
  provider: IdentityProviderConfiguration;
  databaseUrl?: string;
  publicOrigin: string;
  apiOrigin: string;
  allowedOrigins: string[];
  loginMethods: AuthLoginMethod[];
  cookie: { httpOnly: true; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; path: '/' };
  sessionTtlSec: number;
  trustProxy: false | string[];
  captcha: CaptchaConfiguration;
  oidc?: {
    issuer: string; clientId: string; clientSecret: string; redirectUri: string;
    connections: Partial<Record<'apple' | 'wechat', string>>;
  };
}>;

/** Validates trusted server configuration only; it never contacts or certifies a provider. */
export function readAuthRuntimeConfig(env: AuthEnvironment): AuthRuntimeConfig {
  const issues: AuthConfigurationIssue[] = [];
  const issue = (field: string, reason: AuthConfigurationIssue['reason'] = 'invalid') => {
    issues.push({ field, reason });
  };
  const value = (field: string) => env[field]?.trim() ?? '';
  const required = (field: string) => {
    const result = value(field);
    if (!result) issue(field, 'required');
    return result;
  };
  const boolean = (field: string, fallback: boolean) => {
    const raw = value(field);
    if (!raw) return fallback;
    if (raw !== 'true' && raw !== 'false') issue(field);
    return raw === 'true';
  };
  const rawMode = value('AUTH_RUNTIME_MODE');
  const mode = (['local', 'test', 'staging', 'production'] as const).find((item) => item === rawMode);
  if (!mode) issue('AUTH_RUNTIME_MODE', rawMode ? 'invalid' : 'required');
  const realDeployment = mode === 'staging' || mode === 'production';
  if (value('NODE_ENV') === 'production' && !realDeployment) issue('AUTH_RUNTIME_MODE', 'forbidden');
  const testAdapter = boolean('AUTH_TEST_ADAPTER_ENABLED', false);
  if (realDeployment) {
    for (const field of ['AUTH_OTP_STUB_CODE', 'AUTH_OTP_STUB_SECRET', 'AUTH_CAPTCHA_STUB_TOKEN']) {
      if (value(field)) issue(field, 'forbidden');
    }
    if (testAdapter) issue('AUTH_TEST_ADAPTER_ENABLED', 'forbidden');
  }

  const url = (raw: string, field: string, originOnly: boolean, httpsOnly: boolean): URL | undefined => {
    try {
      const parsed = new URL(raw);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.hostname.includes('*')
        || parsed.username || parsed.password || parsed.search || parsed.hash
        || (httpsOnly && parsed.protocol !== 'https:') || (originOnly && parsed.pathname !== '/')) {
        issue(field);
        return undefined;
      }
      return parsed;
    } catch {
      issue(field, raw ? 'invalid' : 'required');
      return undefined;
    }
  };
  const publicOrigin = url(value('AUTH_PUBLIC_ORIGIN'), 'AUTH_PUBLIC_ORIGIN', true, realDeployment)?.origin ?? '';
  const apiOrigin = value('AUTH_API_ORIGIN')
    ? url(value('AUTH_API_ORIGIN'), 'AUTH_API_ORIGIN', true, realDeployment)?.origin ?? ''
    : publicOrigin;
  const originValues = value('AUTH_TRUSTED_ORIGINS') ? value('AUTH_TRUSTED_ORIGINS').split(',') : [publicOrigin];
  const allowedOrigins = [...new Set(originValues.map((origin) => url(origin.trim(), 'AUTH_TRUSTED_ORIGINS', true, realDeployment)?.origin).filter((origin): origin is string => !!origin))];
  if (publicOrigin && !allowedOrigins.includes(publicOrigin)) issue('AUTH_TRUSTED_ORIGINS');

  const databaseUrl = value('DATABASE_URL') || undefined;
  if (realDeployment && !databaseUrl) issue('DATABASE_URL', 'required');
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname) issue('DATABASE_URL');
    } catch {
      issue('DATABASE_URL');
    }
  }

  const rawProvider = value('AUTH_PROVIDER');
  let provider: IdentityProviderConfiguration | undefined;
  if (rawProvider === 'fixture') {
    if (realDeployment) issue('AUTH_PROVIDER', 'forbidden');
    if (!testAdapter) issue('AUTH_TEST_ADAPTER_ENABLED', 'required');
    provider = { kind: 'fixture' };
  } else if (rawProvider === 'authing') {
    provider = {
      kind: 'authing', issuer: url(value('AUTHING_ISSUER'), 'AUTHING_ISSUER', false, true) ? value('AUTHING_ISSUER') : '',
      appId: required('AUTHING_APP_ID'), appSecret: required('AUTHING_APP_SECRET'),
    };
  } else if (rawProvider === 'jiguang') {
    provider = { kind: 'jiguang', appKey: required('JIGUANG_APP_KEY'), masterSecret: required('JIGUANG_MASTER_SECRET') };
  } else {
    issue('AUTH_PROVIDER', rawProvider ? 'invalid' : 'required');
  }
  if (testAdapter && rawProvider !== 'fixture') issue('AUTH_TEST_ADAPTER_ENABLED', 'forbidden');

  const rawMethods = value('AUTH_LOGIN_METHODS') || 'phone';
  const methods = rawMethods.split(',').map((method) => method.trim());
  if (!methods.includes('phone') || methods.some((method) => !['apple', 'phone', 'wechat'].includes(method))) issue('AUTH_LOGIN_METHODS');
  const loginMethods = (['apple', 'phone', 'wechat'] as const).filter((method) => methods.includes(method));
  let oidc: AuthRuntimeConfig['oidc'];
  if (loginMethods.some((method) => method !== 'phone')) {
    // An OIDC issuer is an identity namespace, not a URL to silently normalize.
    const issuer = url(value('AUTH_OIDC_ISSUER'), 'AUTH_OIDC_ISSUER', false, true) ? value('AUTH_OIDC_ISSUER') : '';
    const redirect = url(value('AUTH_OIDC_REDIRECT_URI'), 'AUTH_OIDC_REDIRECT_URI', false, realDeployment);
    if (redirect && redirect.origin !== apiOrigin) issue('AUTH_OIDC_REDIRECT_URI');
    const connections: Partial<Record<'apple' | 'wechat', string>> = {};
    if (loginMethods.includes('apple')) connections.apple = required('AUTH_APPLE_CONNECTION');
    if (loginMethods.includes('wechat')) connections.wechat = required('AUTH_WECHAT_CONNECTION');
    oidc = { issuer, clientId: required('AUTH_OIDC_CLIENT_ID'), clientSecret: required('AUTH_OIDC_CLIENT_SECRET'), redirectUri: redirect ? value('AUTH_OIDC_REDIRECT_URI') : '', connections };
  }

  const secure = boolean('AUTH_COOKIE_SECURE', realDeployment);
  if (realDeployment && !secure) issue('AUTH_COOKIE_SECURE', 'forbidden');
  const rawSameSite = value('AUTH_COOKIE_SAMESITE') || 'lax';
  const sameSite = (['lax', 'strict', 'none'] as const).find((item) => item === rawSameSite);
  if (!sameSite) issue('AUTH_COOKIE_SAMESITE');
  if (sameSite === 'none' && !secure) issue('AUTH_COOKIE_SECURE', 'required');
  const rawTtl = value('AUTH_SESSION_TTL_SEC') || String(30 * 24 * 60 * 60);
  const sessionTtlSec = Number(rawTtl);
  if (!/^\d+$/.test(rawTtl) || !Number.isSafeInteger(sessionTtlSec) || sessionTtlSec <= 0 || sessionTtlSec > 365 * 24 * 60 * 60) issue('AUTH_SESSION_TTL_SEC');

  const proxyValues = value('AUTH_TRUSTED_PROXY_CIDRS') ? value('AUTH_TRUSTED_PROXY_CIDRS').split(',').map((item) => item.trim()) : [];
  for (const item of proxyValues) {
    const parts = item.split('/');
    const family = isIP(parts[0]);
    const bits = family === 4 ? 32 : 128;
    if (!family || parts.length > 2 || (parts.length === 2 && (!/^\d+$/.test(parts[1]) || Number(parts[1]) <= 0 || Number(parts[1]) > bits))) issue('AUTH_TRUSTED_PROXY_CIDRS');
  }
  const trustProxy = proxyValues.length ? [...new Set(proxyValues)] : false;

  const rawCaptchaMode = value('AUTH_CAPTCHA_MODE') || (rawProvider === 'fixture' ? 'off' : 'risk');
  const captchaMode = (['off', 'risk', 'always'] as const).find((item) => item === rawCaptchaMode);
  if (!captchaMode || (rawProvider !== 'fixture' && captchaMode === 'off')) issue('AUTH_CAPTCHA_MODE');
  const captcha: CaptchaConfiguration = rawProvider === 'fixture'
    ? { kind: 'fixture', mode: captchaMode ?? 'off' }
    : {
      kind: 'tencent', mode: captchaMode === 'always' ? 'always' : 'risk',
      appId: required('TENCENT_CAPTCHA_APP_ID'), appSecret: required('TENCENT_CAPTCHA_APP_SECRET'),
      cloudSecretId: required('TENCENTCLOUD_SECRET_ID'), cloudSecretKey: required('TENCENTCLOUD_SECRET_KEY'),
    };

  if (issues.length || !mode || !provider || !sameSite) throw new AuthConfigurationError(issues);
  return {
    mode, provider, databaseUrl, publicOrigin, apiOrigin, allowedOrigins, loginMethods,
    cookie: { httpOnly: true, secure, sameSite, path: '/' }, sessionTtlSec, trustProxy, captcha, oidc,
  };
}

/** Suitable for a preflight report. The full runtime configuration contains server-only secrets. */
export function summarizeAuthConfiguration(config: AuthRuntimeConfig) {
  return {
    runtimeMode: config.mode, provider: config.provider.kind, loginMethods: config.loginMethods,
    configuredDatabase: !!config.databaseUrl, configuredOrigins: config.allowedOrigins.length,
    explicitProxyRanges: config.trustProxy ? config.trustProxy.length : 0,
    cookieSecure: config.cookie.secure, cookieSameSite: config.cookie.sameSite,
    captchaMode: config.captcha.mode, oidcConfigured: !!config.oidc,
    configurationValidated: true, realServicesVerified: false,
  };
}
