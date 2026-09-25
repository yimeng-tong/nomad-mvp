import { expect, it } from 'vitest';
import { requestPnvsCaptcha } from './pnvs-captcha';

it('uses the H5 app and HTTPS even inside a custom-scheme native WebView', async () => {
  let complete!: () => void;
  const instance = {
    onNextReady(fn: () => void) { queueMicrotask(fn); return this; },
    onSuccess(fn: () => void) { complete = fn; return this; },
    onError() { return this; }, onClose() { return this; },
    showCaptcha() { complete(); }, destroy() {},
    getValidate: () => ({ lot_number: 'lot', captcha_output: 'output', pass_token: 'pass', gen_time: '1700000000', captcha_id: 'h5-public-id' }),
  };
  window.initAlicom4 = (options, callback) => {
    expect(options.captchaId).toBe('h5-public-id'); expect(options.https).toBe(true);
    expect('appKey' in options).toBe(false); callback(instance);
  };
  const proof = await requestPnvsCaptcha({ provider: 'aliyun-pnvs', mode: 'risk', app_id: 'h5-public-id', sdk_url: '/vendor/pnvs/ct4.js' });
  expect(proof.lot_number).toBe('lot'); expect('captcha_id' in proof).toBe(false);
});
it('rejects SDK success flags that have no complete proof', async () => {
  window.initAlicom4 = (_options, callback) => {
    let success!: () => void;
    callback({ onNextReady(fn) { queueMicrotask(fn); return this; }, onSuccess(fn) { success = fn; return this; },
      onError() { return this; }, onClose() { return this; }, showCaptcha() { success(); }, destroy() {}, getValidate: () => ({ ret: 0 }) });
  };
  await expect(requestPnvsCaptcha({ provider: 'aliyun-pnvs', mode: 'risk', app_id: 'h5-public-id', sdk_url: '/vendor/pnvs/ct4.js' })).rejects.toMatchObject({ code: 'AUTH_CAPTCHA_INVALID' });
});
it('cancels an old widget when the account or phone context is abandoned', async () => {
  let destroyed = false;
  window.initAlicom4 = (_options, callback) => callback({
    onNextReady(fn) { queueMicrotask(fn); return this; }, onSuccess() { return this; }, onError() { return this; }, onClose() { return this; },
    showCaptcha() {}, destroy() { destroyed = true; }, getValidate: () => false,
  });
  const controller = new AbortController();
  const pending = requestPnvsCaptcha({ provider: 'aliyun-pnvs', mode: 'risk', app_id: 'h5-public-id', sdk_url: '/vendor/pnvs/ct4.js' }, controller.signal);
  await Promise.resolve(); await Promise.resolve(); controller.abort();
  await expect(pending).rejects.toMatchObject({ code: 'AUTH_CAPTCHA_CANCELLED' }); expect(destroyed).toBe(true);
});
