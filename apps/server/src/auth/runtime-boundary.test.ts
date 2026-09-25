import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import authPlugin from '../plugins/auth.js';
import authRoutes from '../routes/auth.js';
import errorEnvelope from '../plugins/error-envelope.js';
import { issueOtpChallenge } from './session-store.js';

test('legacy authentication refuses registration without an explicit isolated fixture profile', async () => {
  const app = Fastify();
  await app.register(cookie);
  await app.register(errorEnvelope);
  await assert.rejects(async () => { await app.register(authPlugin).ready(); }, /AUTH_FIXTURE_FORBIDDEN/);
  await app.close();
});

test('legacy routes cannot bypass the fixture boundary by being registered on their own', async () => {
  const app = Fastify();
  await assert.rejects(async () => { await app.register(authRoutes).ready(); }, /AUTH_FIXTURE_FORBIDDEN/);
  await app.close();
});

test('direct fixed-OTP helpers are unavailable without explicit fixture authorization', () => {
  assert.throws(() => issueOtpChallenge('13800000000', 'CN'), /AUTH_FIXTURE_FORBIDDEN/);
});

async function rejectedStartup(overrides: Record<string, string>, expected: string) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: new URL('../../', import.meta.url),
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'test', PORT: '0', ...overrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    const result = await new Promise<{ code: number | null; signal: string | null }>((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code, signal) => resolve({ code, signal }));
    });
    assert.equal(result.signal, null, 'invalid startup must exit itself before opening infrastructure');
    assert.equal(result.code, 1);
    assert.ok(output.includes(expected), `Expected safe startup code ${expected}`);
    assert.ok(!output.includes('Server listening'));
    assert.ok(!output.includes('sentinel-private'));
    assert.ok(!output.includes('ECONNREFUSED'), 'configuration rejection precedes DB/Redis startup');
  } finally { clearTimeout(timer); child.kill(); }
}

test('actual entrypoint rejects unspecified mode before starting services', async () => {
  await rejectedStartup({}, 'AUTH_CONFIGURATION_INVALID');
});

test('actual production entrypoint rejects fixture authentication', async () => {
  await rejectedStartup({
    NODE_ENV: 'production', AUTH_RUNTIME_MODE: 'production', AUTH_PROVIDER: 'fixture',
    AUTH_TEST_ADAPTER_ENABLED: 'true', AUTH_PUBLIC_ORIGIN: 'https://nomad.example',
    DATABASE_URL: 'postgresql://user:sentinel-private@127.0.0.1:1/invalid',
  }, 'AUTH_CONFIGURATION_INVALID');
});

test('valid real-provider configuration never falls back to memory when the authoritative database is unavailable', async () => {
  await rejectedStartup({
    AUTH_RUNTIME_MODE: 'staging', AUTH_PROVIDER: 'aliyun-pnvs', AUTH_PUBLIC_ORIGIN: 'https://nomad.example',
    DATABASE_URL: 'postgresql://user:sentinel-private@127.0.0.1:1/invalid',
    ALIBABA_CLOUD_ACCESS_KEY_ID: 'synthetic-id', ALIBABA_CLOUD_ACCESS_KEY_SECRET: 'sentinel-private',
    ALIYUN_PNVS_SIGN_NAME: 'synthetic-sign', ALIYUN_PNVS_TEMPLATE_CODE: '100001',
    ALIYUN_PNVS_TEMPLATE_PARAM: '{"code":"##code##","min":"5"}',
    ALIYUN_PNVS_CAPTCHA_PLATFORM: 'h5', ALIYUN_PNVS_CAPTCHA_APP_ID: 'synthetic-id',
    ALIYUN_PNVS_CAPTCHA_APP_KEY: 'sentinel-private',
  }, 'AUTH_AUTHORITY_UNAVAILABLE');
});
