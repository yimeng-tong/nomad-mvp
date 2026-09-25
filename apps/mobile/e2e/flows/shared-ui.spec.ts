import { test, expect } from '../fixtures/browser-test';
import { expectPrivateHidden, recheckIdentity } from '../fixtures/privacy';

test('B23 pagehide removes actual private portals and pageshow restores only confirmed same-owner content', async ({ page, api }) => {
  api.identity = 'A'; await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill('A的界面草稿');
  await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await page.getByRole('button', { name: '定位 A的合成灵感', exact: true }).click();
  await expect(page.getByRole('button', { name: 'A的合成候选 合成地址，仅用于界面测试', exact: true })).toBeVisible();
  expect(await page.locator('[role="dialog"]').evaluate((node) => !!node.closest('[data-private-portal-host]')?.closest('.auth-private'))).toBe(true);
  api.hold('/api/me');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expectPrivateHidden(page, ['A的合成', 'A的界面草稿']);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(page.getByText('正在恢复登录状态', { exact: true })).toBeVisible();
  api.release('/api/me');
  await expect(page.getByRole('dialog', { name: '定位候选', exact: true })).toBeVisible();
  await expect(input).toHaveCount(0); // The open modal masks background controls from the accessibility tree.
  await expect(page.locator('textarea[aria-label="统一输入"]')).toHaveValue('A的界面草稿');
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '定位 A的合成灵感', exact: true })).toBeFocused();
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B24 Escape closes only current logout modal and preserves legacy background confirmation', async ({ page, api }) => {
  api.identity = 'A'; await page.goto('/');
  await page.getByRole('button', { name: '菜单', exact: true }).click();
  await page.getByRole('button', { name: '导出数据', exact: true }).click();
  await page.getByRole('button', { name: '删除账号', exact: true }).click();
  await page.getByRole('button', { name: '退出当前登录', exact: true }).click();
  const modal = page.getByRole('dialog', { name: '退出当前登录', exact: true });
  await expect(modal).toBeVisible();
  await expect(page.getByRole('button', { name: '确认导出数据', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '确认导出数据', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '确认删除账号', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '退出当前登录', exact: true })).toBeFocused();
  expect(api.records.filter((record) => record.method === 'POST')).toHaveLength(0);
});

test('B25 same-owner activity change rejects old candidate response and exposes an honest read retry', async ({ page, api }) => {
  api.identity = 'A'; const path = '/api/library/inspirations/fixture-A/candidates'; api.hold(path);
  await page.goto('/'); await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await page.getByRole('button', { name: '定位 A的合成灵感', exact: true }).click();
  await expect.poll(() => api.count('GET', path)).toBe(1);
  await expect(page.getByText('正在读取定位候选', { exact: true })).toBeVisible();
  await recheckIdentity(page);
  await expect(page.getByRole('button', { name: '重新获取候选', exact: true })).toBeVisible();
  await api.releaseAndWait(path);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.getByRole('button', { name: 'A的合成候选 合成地址，仅用于界面测试', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '重新获取候选', exact: true }).click();
  await expect(page.getByRole('button', { name: 'A的合成候选 合成地址，仅用于界面测试', exact: true })).toBeVisible();
  expect(api.count('GET', path)).toBe(2); expect(api.records.filter((record) => record.method === 'POST')).toHaveLength(0);
});

test('B26 composing Enter does not submit Login and an ordinary explicit Enter still logs in once', async ({ page, api }) => {
  await page.goto('/');
  const phone = page.getByLabel('手机号', { exact: true }), otp = page.getByLabel('验证码', { exact: true });
  await phone.fill('13800138000'); await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await expect(page.getByText('验证码已发送', { exact: true })).toBeVisible(); await otp.fill('123456');
  await otp.dispatchEvent('compositionstart');
  await otp.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
  await otp.dispatchEvent('compositionend');
  await otp.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229 });
  expect(api.count('POST', '/api/auth/otp/verify')).toBe(0);
  await otp.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: '统一输入', exact: true })).toBeVisible();
  expect(api.count('POST', '/api/auth/otp/verify')).toBe(1); expect(api.count('POST', '/api/auth/otp/start')).toBe(1);
});

test('B27 declared old-browser bootstrap displays upgrade guidance without starting auth', async ({ page, api }) => {
  // This verifies the fallback policy only; the engine is still the current CI engine.
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Version/16.3 Mobile/15E148 Safari/604.1' }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '请更新浏览器后打开 Nomad', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '重新打开', exact: true })).toHaveAttribute('href', './');
  await expect(page.getByLabel('手机号', { exact: true })).toHaveCount(0);
  expect(api.count('GET', '/api/me')).toBe(0);
});

test.describe('static startup surface', () => {
  test.use({ javaScriptEnabled: false });
  test('B28 startup guidance remains readable without the modern application module', async ({ page, api }) => {
    await page.goto('/');
    await expect(page.getByText('请启用 JavaScript 后重新打开。', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '重新打开', exact: true })).toBeVisible();
    expect(api.count('GET', '/api/me')).toBe(0);
  });
});
