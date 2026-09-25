import { test, expect } from '../fixtures/browser-test';
import { expectPrivateHidden, recheckIdentity } from '../fixtures/privacy';

const privateA = ['A的合成', 'A的未提交私有草稿'];

test('B13 checking and unavailable hide the whole private document and same owner can recover', async ({ page, api }) => {
  api.identity = 'A';
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill(privateA[1]);
  await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await page.getByRole('button', { name: '定位 A的合成灵感', exact: true }).click();
  await expect(page.getByRole('button', { name: 'A的合成候选 合成地址，仅用于界面测试', exact: true })).toBeVisible();
  api.hold('/api/me');
  await recheckIdentity(page);
  await expect(page.getByText('正在恢复登录状态', { exact: true })).toBeVisible();
  await expectPrivateHidden(page, privateA);
  api.release('/api/me');
  await expect(page.getByRole('dialog', { name: '定位候选', exact: true })).toBeVisible();
  await expect(input).toHaveCount(0); // The open modal masks background controls from the accessibility tree.
  await expect(page.locator('textarea[aria-label="统一输入"]')).toHaveValue(privateA[1]);
  api.authorityUnavailable = true;
  await recheckIdentity(page);
  await expect(page.getByText('暂时无法确认登录状态', { exact: true })).toBeVisible();
  await expectPrivateHidden(page, privateA);
  api.authorityUnavailable = false;
  await page.getByRole('button', { name: '重试确认', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '定位候选', exact: true })).toBeVisible();
  api.identity = null;
  await recheckIdentity(page);
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await expectPrivateHidden(page, privateA, true);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B14 owner change fences delayed candidates and removes the old private input', async ({ page, api }) => {
  api.identity = 'A';
  const path = '/api/library/inspirations/fixture-A/candidates';
  api.hold(path);
  await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill(privateA[1]);
  await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await page.getByRole('button', { name: '定位 A的合成灵感', exact: true }).click();
  await expect.poll(() => api.count('GET', path)).toBe(1);
  await expect(page.getByRole('dialog', { name: '定位候选', exact: true })).toBeVisible();
  api.identity = 'B'; await recheckIdentity(page);
  await expect(page.getByRole('button', { name: 'B的合成城市 1 个想去', exact: true })).toBeVisible();
  await api.releaseAndWait(path);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expectPrivateHidden(page, privateA, true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: '统一输入', exact: true })).toHaveValue('');
});

test('B15 delayed saved result cannot reopen after identity changes', async ({ page, api }) => {
  api.identity = 'A'; api.nextImport = 'done';
  await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill('https://xhslink.com/late');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.locator('.dock-completion')).toBeVisible();
  const job = [...api.jobs.values()][0];
  const path = `/api/ingest/${job.id}/result`; api.hold(path);
  await page.getByRole('button', { name: '查看已保存内容', exact: true }).click();
  await expect(page.getByText('正在读取已保存内容', { exact: true })).toBeVisible();
  await expect.poll(() => api.count('GET', path)).toBe(1);
  api.identity = 'B'; await recheckIdentity(page);
  await expect(page.getByRole('button', { name: 'B的合成城市 1 个想去', exact: true })).toBeVisible();
  await api.releaseAndWait(path);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expectPrivateHidden(page, privateA, true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(1);
});

test('B17 a new session for the same owner clears old dialogs and unsubmitted values', async ({ page, api }) => {
  api.identity = 'A';
  await page.goto('/');
  const input = page.getByRole('textbox', { name: '统一输入', exact: true });
  await input.fill(privateA[1]);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '选择输入类型', exact: true })).toBeVisible();
  api.sessionRevision = 1; await recheckIdentity(page);
  await expect(input).toHaveValue('');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expectPrivateHidden(page, [privateA[1]], true);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B18 superseded me response cannot restore an old owner', async ({ page, api }) => {
  api.identity = 'A';
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: '统一输入', exact: true })).toBeVisible();
  const before = api.count('GET', '/api/me');
  api.hold('/api/me'); await recheckIdentity(page);
  await expect.poll(() => api.count('GET', '/api/me')).toBeGreaterThan(before);
  api.identity = 'B';
  // Settle B first, then force the old A response to arrive last.
  await recheckIdentity(page);
  await expect.poll(() => api.count('GET', '/api/me')).toBeGreaterThan(before + 1);
  api.releaseNewest('/api/me');
  await expect(page.getByRole('button', { name: 'B的合成城市 1 个想去', exact: true })).toBeVisible();
  await api.releaseAndWait('/api/me');
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.getByRole('button', { name: 'B的合成城市 1 个想去', exact: true })).toBeVisible();
  await expectPrivateHidden(page, privateA, true);
});

test('B16 real second-tab logout notification invalidates an open private Sheet', async ({ page, api, context }) => {
  api.identity = 'A';
  await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill(privateA[1]);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '选择输入类型', exact: true })).toBeVisible();
  const second = await context.newPage(); await second.goto('/');
  await second.getByRole('button', { name: '菜单', exact: true }).click();
  await second.getByRole('button', { name: '退出当前登录', exact: true }).click();
  const dialog = second.getByRole('dialog', { name: '退出当前登录', exact: true });
  await dialog.getByRole('button', { name: '确认退出', exact: true }).click();
  await expect(second.getByLabel('手机号', { exact: true })).toBeVisible();
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await expectPrivateHidden(page, privateA, true);
  expect(api.count('POST', '/api/logout')).toBe(1);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});
