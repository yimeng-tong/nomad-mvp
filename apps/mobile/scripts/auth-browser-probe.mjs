/** Actual Chromium UI exercise with explicit in-process HTTP/captcha substitutes. No provider requests. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
const requireServer = createRequire(new URL('../../server/package.json', import.meta.url));
const puppeteer = requireServer('puppeteer');
const root = resolve(import.meta.dirname, '../../..');
const output = resolve(root, '_bmad-output/implementation-artifacts/evidence/story-1-0-browser-2026-09-19');
await mkdir(output, { recursive: true });
const origin = 'http://127.0.0.1:5187';
const browserErrors = [];
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187', '--strictPort'], {
  cwd: resolve(root, 'apps/mobile'), env: { ...process.env, VITE_API_BASE_URL: `${origin}/api` }, stdio: 'ignore',
});
let browser;
const user = (id) => ({ user_id: id, user: { id, phone: null }, session: { id: `session-${id}`, device_id: 'synthetic-browser', expires_at: '2030-01-01T00:00:00Z' } });
let identity = null, authorityUnavailable = false, logoutUnknown = true, operator = false;
const logouts = [], calls = [];
const json = (request, body, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
async function instrument(page) {
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) return request.abort();
    if (!url.pathname.startsWith('/api/')) return request.continue();
    const path = url.pathname.slice(4), body = request.postData() ? JSON.parse(request.postData()) : {};
    calls.push({ method: request.method(), path });
    if (path === '/auth/config') return json(request, {
      availability: 'ready', privacy_url: `${origin}/fixture/privacy`, user_agreement_url: `${origin}/fixture/terms`,
      enabled_methods: [{ id: 'phone', label: '手机号', type: 'phone', enabled: true }], ios_equal_weight_order: ['phone'],
      captcha: { provider: 'aliyun-pnvs', mode: 'always', app_id: 'synthetic-public-id', sdk_url: '/vendor/pnvs/ct4.js' },
    });
    if (path === '/me') return authorityUnavailable ? json(request, { error_code: 'AUTH_AUTHORITY_UNAVAILABLE' }, 503)
      : identity ? json(request, identity) : json(request, { error_code: 'AUTH_SESSION_EXPIRED' }, 401);
    if (path === '/auth/otp/start') {
      assert.ok(body.request_id);
      return body.captcha ? json(request, { sent: false, delivery_state: 'unknown', challenge_id: 'synthetic-challenge', captcha_required: false, retry_after_sec: 60 })
        : json(request, { sent: false, captcha_required: true, retry_after_sec: 0 });
    }
    if (path === '/auth/otp/verify') { assert.equal(body.challenge_id, 'synthetic-challenge'); identity = user('synthetic-a'); return json(request, identity); }
    if (path === '/logout') {
      logouts.push(body.operation_id);
      if (logoutUnknown) { logoutUnknown = false; return json(request, { error_code: 'AUTH_AUTHORITY_UNAVAILABLE' }, 503); }
      identity = null; return json(request, { ok: true });
    }
    if (!identity) return json(request, { error_code: 'AUTH_SESSION_EXPIRED' }, 401);
    if (request.headers()['x-auth-user-id'] !== identity.user_id) return json(request, { error_code: 'AUTH_CONTEXT_CHANGED' }, 409);
    if (path === '/library/cities') return json(request, { cities: [], unlocated_count: 0 });
    if (path === '/library/inspirations') return json(request, { items: [] });
    if (path === '/user-key') return json(request, { configured: false, provider: null, key_ref: null });
    if (path === '/ops/me') return operator ? json(request, { user_id: identity.user_id, grants: [{ capability: 'places.correct', scope: 'workspace:synthetic', version: 1 }] }) : json(request, { error_code: 'AUTH_OPERATOR_FORBIDDEN' }, 403);
    if (path === '/ops/access-check') return json(request, { receipt_id: body.operation_id, verified_at: '2026-09-19T00:00:00Z' });
    return json(request, { error_code: 'FEATURE_NOT_AVAILABLE' }, 503);
  });
  await page.evaluateOnNewDocument(() => {
    window.initAlicom4 = (_options, ready) => {
      let success;
      const widget = { onNextReady(fn) { queueMicrotask(fn); return this; }, onSuccess(fn) { success = fn; return this; }, onError() { return this; }, onClose() { return this; },
        showCaptcha() { queueMicrotask(() => success()); }, getValidate() { return { lot_number: 'synthetic-lot', captcha_output: 'synthetic', pass_token: 'synthetic', gen_time: '1' }; }, destroy() {} };
      ready(widget);
    };
  });
}
const text = async (page, phrase) => { try { await page.waitForFunction((value) => document.body.innerText.includes(value), { polling: 100, timeout: 10000 }, phrase); } catch { throw new Error(JSON.stringify({ missing: phrase, body: await page.evaluate(() => document.body.innerText.slice(0, 800)), browserErrors, calls: calls.slice(-12) })); } };
async function click(page, label) { await page.evaluate((value) => { const button = [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === value); if (!button) throw new Error('Button missing: '+value); button.click(); }, label); }
try {
  for (let attempt = 0; attempt < 50; attempt++) { try { if ((await fetch(origin)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await instrument(page);
  await page.goto(origin); await text(page, '获取验证码');
  await page.type('input[name="phone"]', '13800138000'); await click(page, '获取验证码'); await text(page, '开始行为验证'); await click(page, '开始行为验证');
  await text(page, '发送结果尚未确认；如已收到验证码，可继续登录');
  await page.screenshot({ path: resolve(output, 'mobile-unknown-send.png'), fullPage: true });
  await page.type('input[name="otp"]', '123456'); await click(page, '登录'); await page.waitForSelector('.home-shell');
  const input = await page.$('.home-shell textarea, .home-shell input'); assert.ok(input); await input.type('A的未提交私人草稿');
  authorityUnavailable = true; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await text(page, '暂时无法确认登录状态');
  assert.equal(await page.$eval('.auth-private', (node) => getComputedStyle(node).display), 'none');
  await page.screenshot({ path: resolve(output, 'mobile-authority-unavailable.png'), fullPage: true });
  authorityUnavailable = false; await click(page, '重试确认'); await page.waitForFunction(() => !document.querySelector('.auth-private')?.hidden);
  assert.equal(await input.evaluate((node) => node.value), 'A的未提交私人草稿');
  const other = await browser.newPage(); await instrument(other); await other.goto(origin); await other.waitForSelector('.home-shell');
  identity = user('synthetic-b'); await other.evaluate((nonce) => localStorage.setItem('nomad-auth-changed-v1', JSON.stringify({ nonce, user_id: 'forged' })), randomUUID());
  await page.bringToFront();
  await page.waitForFunction(() => (document.querySelector('.home-shell textarea, .home-shell input')?.value ?? '') === '', { polling: 100 });
  await page.click('button[aria-label="菜单"]'); await text(page, '退出当前登录'); await click(page, '退出当前登录'); await click(page, '确认退出');
  await text(page, '退出结果尚未确认'); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow'))); await text(page, '获取验证码');
  assert.equal(logouts.length, 2); assert.equal(logouts[0], logouts[1]);
  identity = user('synthetic-b'); await page.setViewport({ width: 1280, height: 900 }); await page.goto(`${origin}/ops`); await text(page, '当前账号没有可用的运营授权');
  assert.equal(await page.$('table'), null);
  operator = true; await click(page, '重新读取授权'); await text(page, '验证地点纠错授权');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await click(page, '验证地点纠错授权'); await text(page, '授权校验已写入审计记录');
  await page.screenshot({ path: resolve(output, 'desktop-operator-authority.png'), fullPage: true });
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ result: 'passed', browser: await browser.version(), actualBrowser: true,
    realProviderCalls: 0, explicitHttpAndCaptchaSubstitutes: true, realAuthenticationVerified: false,
    checks: ['unknown-send-copy', 'same-owner-draft-retained', 'authority-unavailable-private-hidden', 'cross-tab-owner-change-clears-draft', 'unknown-logout-foreground-same-operation', 'desktop-operator-denial-and-audit'], calls }, null, 2));
  console.log(JSON.stringify({ result: 'browser-probe-passed', output, realProviderCalls: 0, authenticationIsSubstituted: true }));
} finally { await browser?.close(); child.kill('SIGTERM'); }
