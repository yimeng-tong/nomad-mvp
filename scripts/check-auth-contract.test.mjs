import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import yaml from 'js-yaml';

const requireServer = createRequire(new URL('../apps/server/package.json', import.meta.url));
const Ajv = requireServer('ajv');
const api = yaml.load(readFileSync(new URL('../docs/api/openapi.yaml', import.meta.url), 'utf8'));
const schemas = api.components.schemas;

test('OTP compatibility accepts either field and matching dual fields structurally', () => {
  const ajv = new Ajv({ strict: false, formats: { uuid: true } });
  const validate = ajv.compile(schemas.OtpVerifyRequest);
  const phone = '+8613800000000';
  const base = { phone, challenge_id: '12345678-1234-4234-8234-123456789abc' };
  for (const value of [{ ...base, otp: '123456' }, { ...base, code: '123456' }, { ...base, otp: '123456', code: '123456' }]) {
    assert.equal(validate(value), true, JSON.stringify(validate.errors));
  }
  assert.equal(validate(base), false);
  assert.match(schemas.OtpVerifyRequest.description, /match/);
});

test('PNVS graphic proof and public app configuration never contain server keys', () => {
  assert.ok(schemas.AuthCaptchaConfig.properties.provider.enum.includes('aliyun-pnvs'));
  assert.deepEqual(schemas.PnvsCaptchaProof.required.sort(), ['lot_number', 'captcha_output', 'pass_token', 'gen_time'].sort());
  for (const key of ['app_key', 'access_key_secret', 'sign_token']) {
    assert.equal(schemas.AuthCaptchaConfig.properties[key], undefined);
    assert.equal(schemas.PnvsCaptchaProof.properties[key], undefined);
  }
  assert.equal(schemas.PnvsCaptchaProof.additionalProperties, false);
});

test('all private operations declare session authentication and qualification errors', () => {
  const publicPaths = new Set(['/health', '/auth/config', '/auth/otp/start', '/auth/otp/verify', '/auth/native/otp/start', '/auth/native/otp/verify', '/logout']);
  for (const [path, methods] of Object.entries(api.paths)) {
    if (publicPaths.has(path)) continue;
    for (const [verb, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(verb)) continue;
      assert.ok(operation.security?.some((security) => 'SessionAuth' in security), `${verb} ${path}`);
      assert.ok(operation.responses['401'], `${verb} ${path} needs 401`);
      assert.ok(operation.responses['503'], `${verb} ${path} needs 503`);
    }
  }
});

test('private writes carry expected browser identity to reject stale cross-account requests', () => {
  const operation = api.paths['/account'].delete;
  const refs = (operation.parameters ?? []).map((p) => p.$ref);
  assert.ok(refs.includes('#/components/parameters/ExpectedUser'));
  assert.ok(refs.includes('#/components/parameters/ExpectedSession'));
  assert.equal(api.components.parameters.ExpectedUser.name, 'X-Auth-User-Id');
  assert.equal(api.components.parameters.ExpectedSession.name, 'X-Auth-Session-Id');
});

test('logout promises durable current-session revocation and allows reporting unknown results', () => {
  const logout = api.paths['/logout'].post;
  assert.match(logout.description, /durable/);
  assert.ok(logout.responses['503']);
  assert.match(schemas.Session.properties.id.description, /not.*credential/);
});


test('native credentials are limited to the dedicated native verification response', () => {
  const native = api.paths['/auth/native/otp/verify'].post;
  assert.equal(native.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/NativeOtpVerifyResponse');
  assert.ok(native.parameters.some((param) => param.$ref === '#/components/parameters/NativeBinding'));
  assert.equal(schemas.OtpVerifyResponse.properties?.native_session_credential, undefined);
  assert.equal(api.components.securitySchemes.BearerAuth.bearerFormat, 'opaque');
});
