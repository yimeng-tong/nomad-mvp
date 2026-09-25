import { test, expect } from '../fixtures/browser-test';

test('B05 actual Home Sheet contains keyboard focus and returns input and scroll context', async ({ page, api }) => {
  api.identity = 'A'; api.pendingInspirationCount = 16;
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await expect(input).toBeVisible();
  await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await expect(page.locator('.inspiration-row')).toHaveCount(17);
  await input.fill('需要明确分类的合成旅行文字');
  await page.evaluate(() => window.scrollTo(0, 220));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  const trigger = page.getByRole('button', { name: '发送', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: '选择输入类型', exact: true });
  await expect(sheet).toBeVisible();
  await expect.poll(() => page.locator('.home-body').evaluate((node) => !!node.closest('[inert], [aria-hidden="true"]'))).toBe(true);
  expect(await sheet.evaluate((node) => !!node.closest('[data-private-portal-host]'))).toBe(true);
  const first = sheet.getByRole('button', { name: '作为链接入库', exact: true });
  const second = sheet.getByRole('button', { name: '作为旅行规划', exact: true });
  const last = sheet.getByRole('button', { name: '关闭', exact: true });
  await expect(sheet.getByRole('heading', { name: '选择输入类型', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  for (const [key, target] of [['Tab', second], ['Tab', last], ['Tab', first], ['Shift+Tab', last], ['Shift+Tab', second], ['Shift+Tab', first]] as const) {
    await page.keyboard.press(key);
    await expect(target).toBeFocused();
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.locator('.home-body').evaluate((node) => !!node.closest('[inert], [aria-hidden="true"]'))).toBe(false);
  await expect(trigger).toBeFocused();
  await expect(input).toHaveValue('需要明确分类的合成旅行文字');
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(before);
  api.hold('/api/home/input/parse');
  // Reproduce browsers where pointer activation does not focus buttons.
  await input.focus();
  await trigger.evaluate((node) => node.addEventListener('mousedown', (event) => event.preventDefault(), { once: true }));
  await trigger.click();
  await expect(trigger).toBeDisabled();
  await page.getByRole('tab', { name: '灵感', exact: true }).focus();
  api.release('/api/home/input/parse');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B06 normal and reduced motion preserve editable input without submitting', async ({ page, api }) => {
  api.identity = 'A';
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill('中文输入与动效切换');
  const glyph = page.locator('.dock-send-glyph');
  expect(await glyph.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0.15s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => glyph.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
  expect(await glyph.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  await expect(input).toHaveValue('中文输入与动效切换');
  expect(api.count('POST', '/api/home/input/parse')).toBe(0);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B07 an open saved-result Sheet pauses the actual durable completion window', async ({ page, api }) => {
  test.setTimeout(45_000);
  api.identity = 'A'; api.nextImport = 'done';
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill('https://xhslink.com/completion');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.locator('.dock-completion')).toBeVisible();
  const open = page.getByRole('button', { name: '查看已保存内容', exact: true });
  await open.focus(); await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: '已保存的灵感', exact: true });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('A的合成私有内容', { exact: true })).toBeVisible();
  // Deliberately longer than the actual ten-second acknowledgement window.
  await page.waitForTimeout(11_000);
  await sheet.getByRole('button', { name: '关闭', exact: true }).click();
  const closing = page.locator('.nomad-modal[data-closing="true"]');
  await expect(closing).toHaveCount(1);
  await expect(page.locator('.home-import-dock')).toHaveAttribute('data-presentation-visible', 'false');
  await expect(closing).toHaveCount(0);
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('.dock-completion')).toBeVisible();
  await expect(page.locator('.dock-completion')).toHaveCount(0, { timeout: 12_000 });
  await page.reload();
  await expect(page.locator('.dock-item-facts').getByText('灵感已保存', { exact: true })).toBeVisible();
  await expect(page.locator('.dock-completion')).toHaveCount(0);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(1);
});

test('B08 closing during real journal preparation returns focus to editable input', async ({ page, api }) => {
  api.identity = 'A';
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill('等待本机加密的合成内容');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '选择输入类型', exact: true });
  await expect(sheet).toBeVisible();
  // Delay only the browser crypto boundary; release still executes real encryption/IDB.
  await page.evaluate(() => {
    const encrypt = crypto.subtle.encrypt.bind(crypto.subtle);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    crypto.subtle.encrypt = async (...args: Parameters<SubtleCrypto['encrypt']>) => { await gate; return encrypt(...args); };
    (window as unknown as { releaseJournal: () => void }).releaseJournal = () => { crypto.subtle.encrypt = encrypt; release(); };
  });
  await sheet.getByRole('button', { name: '作为链接入库', exact: true }).click();
  await expect(page.locator('.dock-send')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(input).toBeFocused();
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
  await page.evaluate(() => (window as unknown as { releaseJournal: () => void }).releaseJournal());
  await expect.poll(() => api.count('POST', '/api/ingest/xhs')).toBe(1);
});
