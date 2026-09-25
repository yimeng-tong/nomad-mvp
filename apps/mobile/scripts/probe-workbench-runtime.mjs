import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
async function serve(directory, product = false) {
  const requests = [];
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (product && path.startsWith('/api/')) {
      requests.push({ method: request.method, route: ['/api/auth/config', '/api/me'].includes(path) ? path : '[unexpected]' });
      response.setHeader('Content-Type', 'application/json');
      if (path === '/api/auth/config') {
        response.end(JSON.stringify({ availability: 'unavailable', enabled_methods: [], ios_equal_weight_order: [], privacy_url: '', user_agreement_url: '', captcha: { provider: 'aliyun-pnvs', mode: 'always' } }));
      } else {
        response.statusCode = 401;
        response.end(JSON.stringify({ error_code: 'AUTH_SESSION_EXPIRED', error_message: 'Unavailable in isolated product probe', retriable: false }));
      }
      return;
    }
    const file = resolve(directory, `.${path === '/' ? '/index.html' : path}`);
    if (!file.startsWith(directory + sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(readFileSync(file));
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { origin: `http://127.0.0.1:${address.port}`, requests, close: () => new Promise((done) => { server.closeAllConnections(); server.close(done); }) };
}

const product = await serve(resolve(mobile, 'dist'), true);
const workbench = await serve(resolve(mobile, 'storybook-static'));
const browser = await chromium.launch();
const output = resolve(mobile, '.workbench-results');
mkdirSync(output, { recursive: true });
const violations = [];
const errors = [];
try {
  const productContext = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
  await productContext.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== product.origin) { violations.push('PRODUCT_EXTERNAL_REQUEST_BLOCKED'); await route.abort(); }
    else await route.continue();
  });
  const productPage = await productContext.newPage();
  productPage.on('request', (request) => { if (new URL(request.url()).origin !== product.origin) violations.push('PRODUCT_EXTERNAL_REQUEST'); });
  productPage.on('pageerror', () => errors.push('PRODUCT_PAGE_ERROR'));
  await productPage.goto(product.origin);
  await productPage.getByText('手机号登录暂不可用').waitFor();
  const productWorkers = await productPage.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => new URL(r.scope).pathname));
  assert.deepEqual(productWorkers, []);
  assert.ok(product.requests.some((r) => r.method === 'GET' && r.route === '/api/auth/config'));
  assert.ok(product.requests.every((r) => r.method === 'GET' && r.route !== '[unexpected]'));
  await productPage.screenshot({ path: resolve(output, 'product-unavailable.png'), fullPage: true });
  await productContext.close();

  const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== workbench.origin) { violations.push('WORKBENCH_EXTERNAL_REQUEST_BLOCKED'); await route.abort(); }
    else await route.continue();
  });
  const page = await context.newPage();
  page.on('request', (request) => { if (new URL(request.url()).origin !== workbench.origin) violations.push('WORKBENCH_EXTERNAL_REQUEST'); });
  page.on('pageerror', () => errors.push('WORKBENCH_PAGE_ERROR'));
  const captures = [];
  for (const [id, name, ready] of [
    ['existing-homesheet--partial', 'sheet-partial', '部分内容已保存：1项；其余内容未完成'],
    ['existing-loginscreen--large-text', 'login-large-text', '验证码已发送'],
  ]) {
    await page.goto(`${workbench.origin}/iframe.html?id=${id}&viewMode=story`);
    await page.getByText(ready).waitFor();
    assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), `${name}: horizontal overflow at mobile width`);
    for (const button of await page.getByRole('button').all()) {
      if (!await button.isVisible()) continue;
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= 391 && box.height > 0, `${name}: clipped action`);
    }
    const fonts = await page.locator('[data-workbench-font-base]').evaluateAll((nodes) => nodes.map((node) => ({ base: Number(node.dataset.workbenchFontBase), actual: parseFloat(globalThis.getComputedStyle(node).fontSize) })));
    if (name === 'login-large-text') assert.ok(fonts.length > 0 && fonts.every((f) => f.actual === f.base * 2));
    await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
    captures.push({ name, actualFonts: fonts });
  }
  const workbenchWorkers = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => new URL(r.active.scriptURL).pathname));
  assert.deepEqual(workbenchWorkers, ['/mockServiceWorker.js']);
  await context.close();
  assert.deepEqual(violations, []);
  assert.deepEqual(errors, []);
  const report = { kind: 'isolated-browser-runtime', browserVersion: browser.version(), productRequests: product.requests, productWorkers, workbenchWorkers, violations, errors, captures,
    evidenceBoundary: 'Real browser on built product/workbench, synthetic unavailable API only; no native/provider/device acceptance.' };
  writeFileSync(resolve(output, 'runtime.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await product.close();
  await workbench.close();
}
