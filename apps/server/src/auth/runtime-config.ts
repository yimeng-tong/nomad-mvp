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
  | { kind: 'jiguang'; appKey: string; masterSecret: string }
  | {
    kind: 'aliyun-pnvs'; accessKeyId: string; accessKeySecret: string; securityToken?: string;
    signName: string; templateCode: string; templateParam: { code: '##code##'; min: '5' };
    schemeName?: string; validTimeSec: 300; codeLength: 6; codeType: 1; intervalSec: 60;
    duplicatePolicy: 1; returnVerifyCode: false; autoRetry: 0;
  };

type CaptchaMode = 'off' | 'risk' | 'always';
type CaptchaConfiguration =
  | { kind: 'fixture'; mode: CaptchaMode }
  | { kind: 'aliyun-pnvs'; platform: 'h5'; mode: 'risk' | 'always'; appId: string; appKey: string }
  | {
    kind: 'tencent'; mode: 'risk' | 'always'; appId: string; appSecret: string;
    cloudSecretId: string; cloudSecretKey: string;
  };

export type AuthRuntimeConfig = Readonly<{
  mode: AuthRuntimeMode;
  provider: IdentityProviderConfiguration;
  databaseUrl?: string;
  publicOrigin: string;
  legal?: { privacyUrl: string; agreementUrl: string };
  apiOrigin: string;
  allowedOrigins: string[];
  loginMethods: AuthLoginMethod[];
  cookie: { httpOnly: true; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; path: '/' };
  sessionTtlSec: number;
  nativeEnabled: boolean;
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
  const nativeEnabled = boolean('AUTH_NATIVE_ENABLED', false);
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
  const privacyUrl = value('AUTH_PRIVACY_URL') ? url(value('AUTH_PRIVACY_URL'), 'AUTH_PRIVACY_URL', false, true)?.href : undefined;
  const agreementField = value('AUTH_USER_AGREEMENT_URL') ? 'AUTH_USER_AGREEMENT_URL' : 'AUTH_TERMS_URL';
  const agreementUrl = value(agreementField) ? url(value(agreementField), agreementField, false, true)?.href : undefined;
  const legal = privacyUrl && agreementUrl ? { privacyUrl, agreementUrl } : undefined;
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
  if (rawProvider !== 'fixture' && value('NODE_TLS_REJECT_UNAUTHORIZED') === '0') {
    issue('NODE_TLS_REJECT_UNAUTHORIZED', 'forbidden');
  }
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
  } else if (rawProvider === 'aliyun-pnvs') {
    const templateCode = required('ALIYUN_PNVS_TEMPLATE_CODE');
    // This profile is scoped to the system login/register template, not Dysms custom templates.
    if (templateCode && templateCode !== '100001') issue('ALIYUN_PNVS_TEMPLATE_CODE');
    const templateParam = required('ALIYUN_PNVS_TEMPLATE_PARAM');
    if (templateParam) {
      try {
        const parsed: unknown = JSON.parse(templateParam);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
          || Object.keys(parsed).length !== 2 || !('code' in parsed) || parsed.code !== '##code##'
          || !('min' in parsed) || parsed.min !== '5') issue('ALIYUN_PNVS_TEMPLATE_PARAM');
      } catch {
        // JSON parser diagnostics can contain private configuration. Only report the field name.
        issue('ALIYUN_PNVS_TEMPLATE_PARAM');
      }
    }
    const schemeName = value('ALIYUN_PNVS_SCHEME_NAME') || undefined;
    if (schemeName && [...schemeName].length > 20) issue('ALIYUN_PNVS_SCHEME_NAME');
    provider = {
      kind: 'aliyun-pnvs', accessKeyId: required('ALIBABA_CLOUD_ACCESS_KEY_ID'),
      accessKeySecret: required('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
      securityToken: value('ALIBABA_CLOUD_SECURITY_TOKEN') || undefined,
      signName: required('ALIYUN_PNVS_SIGN_NAME'), templateCode,
      templateParam: { code: '##code##', min: '5' }, schemeName,
      // The application never asks the cloud to echo OTPs or retry sends automatically.
      validTimeSec: 300, codeLength: 6, codeType: 1, intervalSec: 60,
      duplicatePolicy: 1, returnVerifyCode: false, autoRetry: 0,
    };
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
  if (rawProvider === 'aliyun-pnvs') {
    const platform = required('ALIYUN_PNVS_CAPTCHA_PLATFORM');
    if (platform && platform !== 'h5') issue('ALIYUN_PNVS_CAPTCHA_PLATFORM');
  }
  const captchaMode = (['off', 'risk', 'always'] as const).find((item) => item === rawCaptchaMode);
  if (!captchaMode || (rawProvider !== 'fixture' && captchaMode === 'off')) issue('AUTH_CAPTCHA_MODE');
  const captcha: CaptchaConfiguration = rawProvider === 'fixture'
    ? { kind: 'fixture', mode: captchaMode ?? 'off' }
    : rawProvider === 'aliyun-pnvs'
    ? {
      kind: 'aliyun-pnvs', platform: 'h5', mode: captchaMode === 'always' ? 'always' : 'risk',
      appId: required('ALIYUN_PNVS_CAPTCHA_APP_ID'), appKey: required('ALIYUN_PNVS_CAPTCHA_APP_KEY'),
    }
    : {
      kind: 'tencent', mode: captchaMode === 'always' ? 'always' : 'risk',
      appId: required('TENCENT_CAPTCHA_APP_ID'), appSecret: required('TENCENT_CAPTCHA_APP_SECRET'),
      cloudSecretId: required('TENCENTCLOUD_SECRET_ID'), cloudSecretKey: required('TENCENTCLOUD_SECRET_KEY'),
    };

  if (issues.length || !mode || !provider || !sameSite) throw new AuthConfigurationError(issues);
  return {
    mode, provider, databaseUrl, publicOrigin, apiOrigin, allowedOrigins, loginMethods, legal,
    cookie: { httpOnly: true, secure, sameSite, path: '/' }, sessionTtlSec, trustProxy, captcha, oidc, nativeEnabled,
  };
}

/** Suitable for a preflight report. The full runtime configuration contains server-only secrets. */
export function summarizeAuthConfiguration(config: AuthRuntimeConfig) {
  return {
    runtimeMode: config.mode, provider: config.provider.kind, loginMethods: config.loginMethods,
    configuredDatabase: !!config.databaseUrl, configuredOrigins: config.allowedOrigins.length,
    explicitProxyRanges: config.trustProxy ? config.trustProxy.length : 0,
    cookieSecure: config.cookie.secure, cookieSameSite: config.cookie.sameSite,
    captchaProvider: config.captcha.kind, captchaMode: config.captcha.mode, oidcConfigured: !!config.oidc,
    configurationValidated: true, legalDocumentsConfigured: !!config.legal, realServicesVerified: false,
  };
}

/** Presence only: no account lookup, credential values, service entitlement or host claims. */
export function summarizeAuthResourceInputs(env: AuthEnvironment) {
  const present = (field: string) => !!env[field]?.trim();
  const platform = env.UAPP_PLATFORM?.trim();
  const graphicPlatform = env.ALIYUN_PNVS_CAPTCHA_PLATFORM?.trim();
  return {
    pnvsSms: {
      accessKeyPairPresent: present('ALIBABA_CLOUD_ACCESS_KEY_ID') && present('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
      signNamePresent: present('ALIYUN_PNVS_SIGN_NAME'),
      templateCodePresent: present('ALIYUN_PNVS_TEMPLATE_CODE'),
      templateParamPresent: present('ALIYUN_PNVS_TEMPLATE_PARAM'),
    },
    pnvsGraphic: {
      appIdPresent: present('ALIYUN_PNVS_CAPTCHA_APP_ID'), appKeyPresent: present('ALIYUN_PNVS_CAPTCHA_APP_KEY'),
      selectedPlatform: ['h5', 'android', 'ios'].includes(graphicPlatform ?? '') ? graphicPlatform : 'unspecified',
    },
    attribution: {
      uAppKeyPresent: present('UAPP_APP_KEY'),
      registeredPlatform: platform === 'android' || platform === 'ios' ? platform : 'unspecified',
      configuredPlatformKeys: {
        android: present('UAPP_ANDROID_APP_KEY') || (platform === 'android' && present('UAPP_APP_KEY')),
        ios: present('UAPP_IOS_APP_KEY') || (platform === 'ios' && present('UAPP_APP_KEY')),
      },
      currentRuntimeHost: 'web-pwa',
      integrationVerified: false,
    },
    realServicesVerified: false,
  };
}
