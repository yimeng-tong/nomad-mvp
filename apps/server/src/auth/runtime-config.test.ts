import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthConfigurationError, readAuthRuntimeConfig, summarizeAuthConfiguration, summarizeAuthResourceInputs } from './runtime-config.js';

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
const pnvs = (overrides: Record<string, string | undefined> = {}) => ({
  AUTH_RUNTIME_MODE: 'staging', AUTH_PROVIDER: 'aliyun-pnvs',
  AUTH_PUBLIC_ORIGIN: 'https://nomad.example',
  DATABASE_URL: 'postgresql://synthetic:synthetic-db-secret@127.0.0.1:5432/test',
  ALIBABA_CLOUD_ACCESS_KEY_ID: 'synthetic-ak-id',
  ALIBABA_CLOUD_ACCESS_KEY_SECRET: 'synthetic-ak-secret',
  ALIYUN_PNVS_SIGN_NAME: 'synthetic-system-sign', ALIYUN_PNVS_TEMPLATE_CODE: '100001',
  ALIYUN_PNVS_TEMPLATE_PARAM: '{"code":"##code##","min":"5"}',
  ALIYUN_PNVS_CAPTCHA_PLATFORM: 'h5',
  ALIYUN_PNVS_CAPTCHA_APP_ID: 'synthetic-h5-app',
  ALIYUN_PNVS_CAPTCHA_APP_KEY: 'synthetic-h5-secret',
  ...overrides,
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

test('selected PNVS phone and H5 graphic services use independent credentials without legacy suppliers', () => {
  const config = readAuthRuntimeConfig(pnvs());
  assert.equal(config.provider.kind, 'aliyun-pnvs');
  assert.equal(config.captcha.kind, 'aliyun-pnvs');
  assert.deepEqual(config.loginMethods, ['phone']);
  if (config.provider.kind !== 'aliyun-pnvs') assert.fail('PNVS provider expected');
  assert.equal(config.provider.schemeName, undefined);
  assert.equal(config.provider.templateParam.code, '##code##');
  assert.equal(config.provider.validTimeSec, 300);
  assert.equal(config.provider.returnVerifyCode, false);
  assert.equal(config.provider.duplicatePolicy, 1);
  assert.equal(config.provider.codeLength, 6);
  assert.equal(config.provider.autoRetry, 0);
  assert.equal(summarizeAuthConfiguration(config).realServicesVerified, false);
});

test('cloud AK and U-App identifiers cannot stand in for PNVS scheme and graphic credentials', () => {
  for (const field of ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET',
    'ALIYUN_PNVS_SIGN_NAME', 'ALIYUN_PNVS_TEMPLATE_CODE', 'ALIYUN_PNVS_TEMPLATE_PARAM',
    'ALIYUN_PNVS_CAPTCHA_APP_ID', 'ALIYUN_PNVS_CAPTCHA_APP_KEY']) {
    invalid(pnvs({ [field]: undefined, UAPP_APP_KEY: 'synthetic-uapp-key' }), field);
  }
});

test('PNVS requires server-generated codes and a matching five-minute login template', () => {
  for (const params of ['not-json', 'null', '[]', '{}', '{"code":"000000","min":"5"}',
    '{"code":"##code##","min":"30"}', '{"code":"##code##","min":"5","extra":"secret"}']) {
    invalid(pnvs({ ALIYUN_PNVS_TEMPLATE_PARAM: params }), 'ALIYUN_PNVS_TEMPLATE_PARAM');
  }
  invalid(pnvs({ ALIYUN_PNVS_TEMPLATE_CODE: 'SMS_12345' }), 'ALIYUN_PNVS_TEMPLATE_CODE');
});

test('PNVS preserves the optional scheme and STS token only in private configuration', () => {
  const config = readAuthRuntimeConfig(pnvs({
    ALIYUN_PNVS_SCHEME_NAME: 'nomad-login', ALIBABA_CLOUD_SECURITY_TOKEN: 'synthetic-sts-token',
  }));
  if (config.provider.kind !== 'aliyun-pnvs') assert.fail('PNVS provider expected');
  assert.equal(config.provider.schemeName, 'nomad-login');
  assert.equal(config.provider.securityToken, 'synthetic-sts-token');
  const safe = JSON.stringify(summarizeAuthConfiguration(config));
  for (const secret of ['synthetic-ak-id', 'synthetic-ak-secret', 'synthetic-sts-token',
    'synthetic-h5-secret', 'nomad-login', 'synthetic-system-sign']) assert.ok(!safe.includes(secret));
  invalid(pnvs({ ALIYUN_PNVS_SCHEME_NAME: 'x'.repeat(21) }), 'ALIYUN_PNVS_SCHEME_NAME');
});

test('real provider configuration refuses disabled TLS verification even on a local host', () => {
  invalid(pnvs({ NODE_TLS_REJECT_UNAUTHORIZED: '0' }), 'NODE_TLS_REJECT_UNAUTHORIZED');
  invalid(pnvs({ AUTH_RUNTIME_MODE: 'local', NODE_TLS_REJECT_UNAUTHORIZED: '0' }), 'NODE_TLS_REJECT_UNAUTHORIZED');
  invalid(real({ NODE_TLS_REJECT_UNAUTHORIZED: '0' }), 'NODE_TLS_REJECT_UNAUTHORIZED');
  assert.equal(readAuthRuntimeConfig(pnvs({ NODE_TLS_REJECT_UNAUTHORIZED: '1' })).provider.kind, 'aliyun-pnvs');
});

test('resource inventory separates a supplied U-App key from a verified SDK host or attribution', () => {
  const report = summarizeAuthResourceInputs(pnvs({ UAPP_APP_KEY: 'synthetic-uapp-private' }));
  assert.equal(report.attribution.uAppKeyPresent, true);
  assert.equal(report.attribution.registeredPlatform, 'unspecified');
  assert.equal(report.attribution.integrationVerified, false);
  assert.equal(report.realServicesVerified, false);
  const mobile = summarizeAuthResourceInputs(pnvs({ UAPP_PLATFORM: 'android' }));
  assert.equal(mobile.attribution.registeredPlatform, 'android');
  assert.equal(mobile.attribution.integrationVerified, false);
  const serialized = JSON.stringify(report);
  for (const secret of ['synthetic-uapp-private', 'synthetic-ak-secret', 'synthetic-h5-secret', 'synthetic-db-secret']) {
    assert.ok(!serialized.includes(secret));
  }
});

test('partial cloud credentials never count as a complete configured key pair', () => {
  const report = summarizeAuthResourceInputs(pnvs({ ALIBABA_CLOUD_ACCESS_KEY_SECRET: '' }));
  assert.equal(report.pnvsSms.accessKeyPairPresent, false);
  assert.equal(report.pnvsGraphic.appIdPresent, true);
  assert.equal(report.pnvsGraphic.appKeyPresent, true);
});

test('the current browser runtime requires an explicit H5 graphic scheme instead of a native scheme', () => {
  for (const platform of [undefined, '', 'android', 'ios', 'unknown']) {
    invalid(pnvs({ ALIYUN_PNVS_CAPTCHA_PLATFORM: platform }), 'ALIYUN_PNVS_CAPTCHA_PLATFORM');
  }
  const config = readAuthRuntimeConfig(pnvs());
  if (config.captcha.kind !== 'aliyun-pnvs') assert.fail('PNVS graphic configuration expected');
  assert.equal(config.captcha.platform, 'h5');
});

test('two U-App platform keys are inventoried independently without implying a browser integration', () => {
  const env = pnvs({ UAPP_ANDROID_APP_KEY: 'private-android-key', UAPP_IOS_APP_KEY: 'private-ios-key',
    UAPP_ANDROID_ACCOUNT_STATISTICS_STATUS: 'unverified', UAPP_ANDROID_ACCOUNT_STATISTICS_CONTROL_LABEL: '暂停使用' });
  const report = summarizeAuthResourceInputs(env);
  assert.deepEqual(report.attribution.configuredPlatformKeys, { android: true, ios: true });
  assert.equal(report.attribution.currentRuntimeHost, 'web-pwa');
  assert.equal(report.attribution.integrationVerified, false);
  assert.equal(report.pnvsGraphic.selectedPlatform, 'h5');
  assert.ok(!JSON.stringify(report).includes('private-android-key'));
  assert.ok(!JSON.stringify(report).includes('private-ios-key'));
  assert.ok(!JSON.stringify(report).includes('暂停使用'));
});


test('missing legal documents are reported honestly and unsafe URLs cannot be published', () => {
  assert.equal(readAuthRuntimeConfig(pnvs()).legal, undefined);
  invalid(pnvs({ AUTH_PRIVACY_URL: 'javascript:alert(1)' }), 'AUTH_PRIVACY_URL');
  invalid(pnvs({ AUTH_PRIVACY_URL: 'http://nomad.example/privacy' }), 'AUTH_PRIVACY_URL');
  const config = readAuthRuntimeConfig(pnvs({ AUTH_PRIVACY_URL: 'https://nomad.example/privacy', AUTH_TERMS_URL: 'https://nomad.example/terms' }));
  assert.equal(config.legal?.privacyUrl, 'https://nomad.example/privacy');
  assert.equal(summarizeAuthConfiguration(config).legalDocumentsConfigured, true);
});
