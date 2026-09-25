import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthConfigurationError, readAuthRuntimeConfig, summarizeAuthConfiguration } from './runtime-config.js';

const real = (overrides: Record<string, string | undefined> = {}) => ({
  AUTH_RUNTIME_MODE: 'production',
  AUTH_PROVIDER: 'authing',
  AUTH_PUBLIC_ORIGIN: 'https://nomad.example',
  DATABASE_URL: 'postgresql://synthetic:synthetic-db-secret@127.0.0.1:5432/test',
  AUTHING_ISSUER: 'https://tenant.authing.cn/oidc',
  AUTHING_APP_ID: 'synthetic-app',
  AUTHING_APP_SECRET: 'synthetic-authing-secret',
  TENCENT_CAPTCHA_APP_ID: 'synthetic-captcha',
  TENCENT_CAPTCHA_APP_SECRET: 'synthetic-captcha-secret',
  TENCENTCLOUD_SECRET_ID: 'synthetic-cloud-id',
  TENCENTCLOUD_SECRET_KEY: 'synthetic-cloud-secret',
  ...overrides,
});
const fixture = (overrides: Record<string, string | undefined> = {}) => ({
  AUTH_RUNTIME_MODE: 'test', AUTH_PROVIDER: 'fixture', AUTH_TEST_ADAPTER_ENABLED: 'true',
  AUTH_PUBLIC_ORIGIN: 'http://localhost:5173', ...overrides,
});
const invalid = (env: Record<string, string | undefined>, field: string) => {
  assert.throws(() => readAuthRuntimeConfig(env), (error: unknown) => {
    assert.ok(error instanceof AuthConfigurationError);
    assert.equal(error.code, 'AUTH_CONFIGURATION_INVALID');
    assert.ok(error.issues.some((issue) => issue.field === field), `${field} must be reported without its value`);
    return true;
  });
};

test('an unspecified runtime never silently enables test authentication', () => {
  invalid({}, 'AUTH_RUNTIME_MODE');
});
test('NODE_ENV production cannot be overridden into fixture mode', () => {
  invalid(fixture({ NODE_ENV: 'production' }), 'AUTH_RUNTIME_MODE');
});
test('real deployments require a real provider, database and captcha verification configuration', () => {
  for (const name of ['AUTH_PROVIDER', 'DATABASE_URL', 'AUTHING_APP_SECRET', 'TENCENT_CAPTCHA_APP_SECRET', 'TENCENTCLOUD_SECRET_KEY']) {
    invalid(real({ [name]: undefined }), name);
  }
});
test('both staging and production reject test adapters and leftover stub credentials', () => {
  for (const mode of ['staging', 'production']) {
    for (const name of ['AUTH_OTP_STUB_CODE', 'AUTH_OTP_STUB_SECRET', 'AUTH_CAPTCHA_STUB_TOKEN', 'AUTH_TEST_ADAPTER_ENABLED']) {
      invalid(real({ AUTH_RUNTIME_MODE: mode, [name]: 'true' }), name);
    }
    invalid(real({ AUTH_RUNTIME_MODE: mode, AUTH_PROVIDER: 'fixture' }), 'AUTH_PROVIDER');
  }
});
test('fixtures require explicit isolated mode and explicit injection configuration', () => {
  invalid(fixture({ AUTH_TEST_ADAPTER_ENABLED: undefined }), 'AUTH_TEST_ADAPTER_ENABLED');
  const config = readAuthRuntimeConfig(fixture());
  assert.equal(config.mode, 'test');
  assert.equal(config.provider.kind, 'fixture');
  assert.equal(config.databaseUrl, undefined);
  assert.equal(config.cookie.secure, false);
});
test('valid Authing configuration records intent without claiming live service verification', () => {
  const config = readAuthRuntimeConfig(real());
  assert.equal(config.provider.kind, 'authing');
  assert.deepEqual(config.loginMethods, ['phone']);
  assert.equal(config.cookie.httpOnly, true);
  assert.equal(config.cookie.secure, true);
  assert.equal(config.captcha.mode, 'risk');
  assert.equal(config.trustProxy, false);
  assert.equal(summarizeAuthConfiguration(config).realServicesVerified, false);
});
test('Jiguang phone proof has its own required server credentials and does not imply social login', () => {
  const env = real({ AUTH_PROVIDER: 'jiguang', JIGUANG_APP_KEY: 'synthetic-jg-app', JIGUANG_MASTER_SECRET: 'synthetic-jg-secret' });
  const config = readAuthRuntimeConfig(env);
  assert.equal(config.provider.kind, 'jiguang');
  assert.deepEqual(config.loginMethods, ['phone']);
  invalid({ ...env, JIGUANG_MASTER_SECRET: undefined }, 'JIGUANG_MASTER_SECRET');
});
test('social methods need an explicit OIDC path and matching connection names', () => {
  invalid(real({ AUTH_LOGIN_METHODS: 'phone,apple,wechat' }), 'AUTH_OIDC_ISSUER');
  const config = readAuthRuntimeConfig(real({
    AUTH_LOGIN_METHODS: 'wechat,phone,apple', AUTH_API_ORIGIN: 'https://api.nomad.example',
    AUTH_OIDC_ISSUER: 'https://tenant.authing.cn/oidc', AUTH_OIDC_CLIENT_ID: 'synthetic-client',
    AUTH_OIDC_CLIENT_SECRET: 'synthetic-oidc-secret', AUTH_OIDC_REDIRECT_URI: 'https://api.nomad.example/auth/callback',
    AUTH_APPLE_CONNECTION: 'apple-web', AUTH_WECHAT_CONNECTION: 'wechat-web',
  }));
  assert.deepEqual(config.loginMethods, ['apple', 'phone', 'wechat']);
  assert.equal(config.oidc?.redirectUri, 'https://api.nomad.example/auth/callback');
});
test('issuer identifiers retain the exact configured trailing slash for identity comparisons', () => {
  const issuer = 'https://tenant.authing.cn/oidc/';
  const config = readAuthRuntimeConfig(real({
    AUTHING_ISSUER: issuer, AUTH_LOGIN_METHODS: 'phone,apple',
    AUTH_OIDC_ISSUER: issuer, AUTH_OIDC_CLIENT_ID: 'client', AUTH_OIDC_CLIENT_SECRET: 'secret',
    AUTH_OIDC_REDIRECT_URI: 'https://nomad.example/auth/callback', AUTH_APPLE_CONNECTION: 'apple-web',
  }));
  assert.equal(config.provider.kind, 'authing');
  if (config.provider.kind === 'authing') assert.equal(config.provider.issuer, issuer);
  assert.equal(config.oidc?.issuer, issuer);
});
test('unsupported methods and a missing required phone path are rejected', () => {
  invalid(real({ AUTH_LOGIN_METHODS: 'phone,email' }), 'AUTH_LOGIN_METHODS');
  invalid(real({ AUTH_LOGIN_METHODS: 'apple' }), 'AUTH_LOGIN_METHODS');
});
test('real origins require HTTPS and never accept credentials, wildcards, paths or opaque origins', () => {
  for (const origin of ['http://nomad.example', 'https://user:secret@nomad.example', '*', 'null', 'https://nomad.example/private', 'https://nomad.example?token=secret']) {
    invalid(real({ AUTH_PUBLIC_ORIGIN: origin }), 'AUTH_PUBLIC_ORIGIN');
  }
});
test('CORS allowlists are exact origins with duplicates removed', () => {
  invalid(real({ AUTH_TRUSTED_ORIGINS: 'https://nomad.example,*' }), 'AUTH_TRUSTED_ORIGINS');
  const config = readAuthRuntimeConfig(real({ AUTH_TRUSTED_ORIGINS: 'https://nomad.example,https://ops.nomad.example,https://nomad.example' }));
  assert.deepEqual(config.allowedOrigins, ['https://nomad.example', 'https://ops.nomad.example']);
});
test('callbacks cannot escape the configured API origin', () => {
  invalid(real({
    AUTH_LOGIN_METHODS: 'phone,apple', AUTH_OIDC_ISSUER: 'https://tenant.authing.cn/oidc',
    AUTH_OIDC_CLIENT_ID: 'client', AUTH_OIDC_CLIENT_SECRET: 'secret', AUTH_APPLE_CONNECTION: 'apple-web',
    AUTH_OIDC_REDIRECT_URI: 'https://attacker.invalid/auth/callback',
  }), 'AUTH_OIDC_REDIRECT_URI');
});
test('real cookies cannot disable Secure and SameSite None always requires Secure', () => {
  invalid(real({ AUTH_COOKIE_SECURE: 'false' }), 'AUTH_COOKIE_SECURE');
  invalid(fixture({ AUTH_COOKIE_SAMESITE: 'none', AUTH_COOKIE_SECURE: 'false' }), 'AUTH_COOKIE_SECURE');
  invalid(real({ AUTH_COOKIE_SAMESITE: 'anything' }), 'AUTH_COOKIE_SAMESITE');
});
test('real captcha cannot be disabled or changed to an unrecognized mode', () => {
  invalid(real({ AUTH_CAPTCHA_MODE: 'off' }), 'AUTH_CAPTCHA_MODE');
  invalid(real({ AUTH_CAPTCHA_MODE: 'anything' }), 'AUTH_CAPTCHA_MODE');
  invalid(real({ AUTH_RUNTIME_MODE: 'local', AUTH_CAPTCHA_MODE: 'off' }), 'AUTH_CAPTCHA_MODE');
});
test('proxy trust accepts explicit addresses/networks, never numeric hops or all-address trust', () => {
  for (const value of ['1', 'true', '*', '0.0.0.0/0', '::/0', 'proxy.example', '10.0.0.0/99']) {
    invalid(real({ AUTH_TRUSTED_PROXY_CIDRS: value }), 'AUTH_TRUSTED_PROXY_CIDRS');
  }
  const config = readAuthRuntimeConfig(real({ AUTH_TRUSTED_PROXY_CIDRS: '127.0.0.1,10.8.0.0/24,::1' }));
  assert.deepEqual(config.trustProxy, ['127.0.0.1', '10.8.0.0/24', '::1']);
});
test('session duration uses bounded explicit seconds', () => {
  for (const value of ['0', '-1', 'NaN', '1e100', '31536001']) invalid(real({ AUTH_SESSION_TTL_SEC: value }), 'AUTH_SESSION_TTL_SEC');
  assert.equal(readAuthRuntimeConfig(real({ AUTH_SESSION_TTL_SEC: '3600' })).sessionTtlSec, 3600);
});
test('configuration errors and safe summaries cannot disclose secrets or connection strings', () => {
  const safe = JSON.stringify(summarizeAuthConfiguration(readAuthRuntimeConfig(real())));
  for (const secret of ['synthetic-db-secret', 'synthetic-authing-secret', 'synthetic-captcha-secret', 'synthetic-cloud-secret', 'postgresql://']) assert.ok(!safe.includes(secret));
  try {
    readAuthRuntimeConfig(real({ AUTHING_ISSUER: 'https://user:sentinel-private-value@tenant.authing.cn/oidc' }));
    assert.fail('invalid issuer should fail');
  } catch (error) {
    assert.ok(error instanceof AuthConfigurationError);
    assert.ok(!JSON.stringify(error).includes('sentinel-private-value'));
    assert.ok(!String(error).includes('sentinel-private-value'));
  }
});
