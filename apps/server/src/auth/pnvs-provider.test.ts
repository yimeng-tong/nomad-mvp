import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { PnvsProofProvider, type SmsTransport, type GraphicProof } from './pnvs-provider.js';
import { AuthFault } from './errors.js';

const phone = '+8613800000000';
const config = {
  kind: 'aliyun-pnvs' as const, accessKeyId: 'synthetic-id', accessKeySecret: 'sentinel-secret',
  signName: 'synthetic-sign', templateCode: '100001', templateParam: { code: '##code##' as const, min: '5' as const },
  validTimeSec: 300 as const, codeLength: 6 as const, codeType: 1 as const, intervalSec: 60 as const,
  duplicatePolicy: 1 as const, returnVerifyCode: false as const, autoRetry: 0 as const,
  schemeName: 'synthetic-scheme',
};
const graphic = { kind: 'aliyun-pnvs' as const, platform: 'h5' as const, mode: 'risk' as const, appId: 'synthetic-captcha', appKey: 'sentinel-graphic-secret' };
const proof: GraphicProof = { lot_number: 'synthetic-lot', captcha_output: 'output', pass_token: 'pass', gen_time: '1700000000' };
const transport: SmsTransport = { send: async () => ({ code: 'OK', success: true, model: { bizId: 'synthetic-biz' } }), check: async () => ({ code: 'OK', success: true, model: { verifyResult: 'PASS' } }) };
const rejects = (code: string) => (e: unknown) => e instanceof AuthFault && e.code === code && !String(e).includes('sentinel-secret');

test('the pinned SDK constructs through its actual CommonJS exports without a provider request', () => {
  assert.doesNotThrow(() => new PnvsProofProvider(config, graphic));
});

test('SMS uses the same PNVS scheme and binds the send/check to one server transaction', async () => {
  const seen: Record<string, unknown>[] = [];
  const provider = new PnvsProofProvider(config, graphic, {
    sms: { send: async (input) => { seen.push(input); return transport.send(input); }, check: async (input) => { seen.push(input); return transport.check(input); } },
  });
  await provider.send(phone, 'intent');
  assert.equal(await provider.verify(phone, '123456', 'intent'), true);
  assert.equal(seen[0].phoneNumber, '13800000000');
  assert.equal(seen[0].countryCode, '86');
  assert.equal(seen[0].outId, seen[1].outId);
  assert.equal(seen[0].schemeName, seen[1].schemeName);
  assert.equal(seen[0].returnVerifyCode, false);
  assert.equal(seen[0].autoRetry, 0);
  assert.equal(JSON.parse(String(seen[0].templateParam)).code, '##code##');
});

test('HTTP/API success without PASS does not authenticate a phone', async () => {
  const provider = new PnvsProofProvider(config, graphic, { sms: { ...transport, check: async () => ({ code: 'OK', success: true, model: { verifyResult: 'UNKNOWN' } }) } });
  assert.equal(await provider.verify(phone, '123456', 'intent'), false);
  const mismatched = new PnvsProofProvider(config, graphic, { sms: { ...transport, check: async () => ({ code: 'OK', success: true, model: { verifyResult: 'PASS', outId: 'other-intent' } }) } });
  await assert.rejects(mismatched.verify(phone, '123456', 'intent'), rejects('AUTH_PROVIDER_UNAVAILABLE'));
});

test('uncertain send failures never retry and never disclose the SDK exception', async () => {
  let calls = 0;
  const provider = new PnvsProofProvider(config, graphic, { sms: { ...transport, send: async () => { calls++; throw new Error('sentinel-secret'); } } });
  await assert.rejects(provider.send(phone, 'intent'), rejects('AUTH_SEND_RESULT_UNKNOWN'));
  assert.equal(calls, 1);
});

test('a send deadline remains an unknown result even if the transport ignores cancellation', async () => {
  let calls = 0;
  const provider = new PnvsProofProvider(config, graphic, { timeoutMs: 15, sms: { ...transport, send: async () => { calls++; return new Promise(() => {}); } } });
  await assert.rejects(provider.send(phone, 'intent'), rejects('AUTH_SEND_RESULT_UNKNOWN'));
  assert.equal(calls, 1);
});

test('graphic verification uses the configured app, form encoding and HMAC without sending the key', async () => {
  const provider = new PnvsProofProvider(config, graphic, { sms: transport, fetch: async (url, init) => {
    assert.equal(new URL(String(url)).origin, 'https://captcha.alicaptcha.com');
    assert.equal(new URL(String(url)).searchParams.get('captcha_id'), graphic.appId);
    const body = new URLSearchParams(String(init?.body));
    assert.equal(body.get('sign_token'), createHmac('sha256', graphic.appKey).update(proof.lot_number).digest('hex'));
    assert.ok(!String(init?.body).includes(graphic.appKey));
    assert.equal(body.get('pass_token'), proof.pass_token);
    return new Response(JSON.stringify({ status: 'success', result: 'success', captcha_args: { lot_number: proof.lot_number } }));
  } });
  await provider.verifyGraphic(proof);
});

test('graphic timeout, invalid JSON, error status and mismatched proof all fail closed', async () => {
  const cases = [
    async () => { throw new Error('sentinel-secret'); },
    async () => new Response('invalid'),
    async () => new Response(JSON.stringify({ status: 'error', result: 'success' })),
    async () => new Response(JSON.stringify({ status: 'success', result: 'success', captcha_args: { lot_number: 'another-lot' } })),
    async () => new Response('x'.repeat(70000)),
    async () => new Response('{}', { status: 500 }),
  ];
  for (const fetch of cases) {
    const provider = new PnvsProofProvider(config, graphic, { sms: transport, fetch });
    await assert.rejects(provider.verifyGraphic(proof), rejects('AUTH_CAPTCHA_UNAVAILABLE'));
  }
});

test('a vendor-declared wrong captcha is distinct from an unavailable verifier', async () => {
  const provider = new PnvsProofProvider(config, graphic, { sms: transport, fetch: async () => new Response(JSON.stringify({ status: 'success', result: 'fail' })) });
  await assert.rejects(provider.verifyGraphic(proof), rejects('AUTH_CAPTCHA_FAILED'));
});


test('documented explicit rejection is not an unknown send and never exposes vendor text', async () => {
  for (const code of ['BUSINESS_LIMIT_CONTROL', 'FREQUENCY_FAIL', 'MOBILE_NUMBER_ILLEGAL', 'INVALID_PARAMETERS', 'FUNCTION_NOT_OPENED']) {
    for (const throws of [false, true]) {
      const provider = new PnvsProofProvider(config, graphic, { sms: { ...transport, send: async () => {
        if (throws) throw { code, message: 'sentinel-secret' };
        return { code, success: false, message: 'sentinel-secret' };
      } } });
      await assert.rejects(provider.send(phone, 'intent'), rejects(['BUSINESS_LIMIT_CONTROL', 'FREQUENCY_FAIL'].includes(code) ? 'AUTH_PROVIDER_RATE_LIMITED' : 'AUTH_SEND_REJECTED'));
    }
  }
});
