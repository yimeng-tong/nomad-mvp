import { test, expect } from '../fixtures/browser-test';
import { doubleText, expectLayout } from '../fixtures/layout';

test('B19 actual login fields at 200 percent keep the primary action reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await doubleText(page);
  await expectLayout(page, page.getByRole('button', { name: '登录', exact: true }));
});

test('B20 long Chinese Home and Sheet at 200 percent retain input and usable close', async ({ page, api }) => {
  api.identity = 'A'; api.library = 'long';
  await page.goto('/');
  const text = '这是用于窄屏阅读检查的长中文旅行描述，包含清晨的公园、午后的博物馆与傍晚的海边步道。'.repeat(6);
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill(text);
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await doubleText(page);
  await expectLayout(page, page.getByRole('button', { name: '发送', exact: true }));
  await page.getByRole('button', { name: '发送', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '选择输入类型', exact: true });
  await expect(sheet).toBeVisible();
  // A new dialog is a new subtree. Scale it from its actual unscaled computed sizes.
  await sheet.evaluate((node) => {
    const sizes = [...node.querySelectorAll<HTMLElement>('p,button')].map((element) => [element, parseFloat(getComputedStyle(element).fontSize)] as const);
    for (const [element, size] of sizes) { element.dataset.nomadE2eFontBase = String(size); element.style.setProperty('font-size', `${size * 2}px`, 'important'); }
  });
  expect(await sheet.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  expect(await sheet.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  const close = sheet.getByRole('button', { name: '关闭', exact: true });
  await expectLayout(page, close);
  await close.click();
  await expect(input).toHaveValue(text);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B21 200 percent Add glyph stays inside its actual action button', async ({ page, api }) => {
  api.identity = 'A'; await page.goto('/');
  const add = page.getByRole('button', { name: '添加', exact: true });
  await expect(add).toBeVisible(); await doubleText(page);
  const bounds = await add.evaluate((node) => {
    const button = node.getBoundingClientRect(), range = document.createRange();
    range.selectNodeContents(node.querySelector('.dock-send-glyph')!);
    const glyph = range.getBoundingClientRect();
    return { button: { top: button.top, bottom: button.bottom, left: button.left, right: button.right },
      glyph: { top: glyph.top, bottom: glyph.bottom, left: glyph.left, right: glyph.right } };
  });
  expect(bounds.glyph.top, 'NOMAD_E2E_GLYPH_CLIPPED').toBeGreaterThanOrEqual(bounds.button.top);
  expect(bounds.glyph.bottom, 'NOMAD_E2E_GLYPH_CLIPPED').toBeLessThanOrEqual(bounds.button.bottom);
  expect(bounds.glyph.left, 'NOMAD_E2E_GLYPH_CLIPPED').toBeGreaterThanOrEqual(bounds.button.left);
  expect(bounds.glyph.right, 'NOMAD_E2E_GLYPH_CLIPPED').toBeLessThanOrEqual(bounds.button.right);
  await expectLayout(page, add);
});
