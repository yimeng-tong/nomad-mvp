import { test, expect } from '../fixtures/browser-test';
import { expectPrivateHidden, recheckIdentity } from '../fixtures/privacy';

const ownerARecord = '10000000-0000-4000-8000-000000000081';
const ownerAOriginal = 'https://xhslink.com/synthetic-A#copied';

test('B32 import record list withholds original URL until owner detail opens in a private sheet', async ({ page, api }) => {
  api.identity = 'A'; api.importRecords = 'sample';
  await page.goto('/');
  await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await expect(page.getByRole('heading', { name: '导入记录' })).toBeVisible();
  await expect(page.getByText('A的合成来源')).toBeVisible();
  await expect(page.getByText('导入未完成')).toBeVisible();
  await expect(page.getByText(ownerAOriginal)).toHaveCount(0);
  expect(api.count('GET', `/api/library/import-records/${ownerARecord}`)).toBe(0);
  const trigger = page.getByRole('button', { name: '查看A的合成来源的导入记录' });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: '导入记录详情' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(ownerAOriginal)).toBeVisible();
  expect(await sheet.evaluate((node) => !!node.closest('[data-private-portal-host]')?.closest('.auth-private'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});

test('B33 a delayed original URL response cannot cross an owner change', async ({ page, api }) => {
  api.identity = 'A'; api.importRecords = 'sample';
  const path = `/api/library/import-records/${ownerARecord}`; api.hold(path);
  await page.goto('/'); await page.getByRole('tab', { name: '灵感', exact: true }).click();
  await page.getByRole('button', { name: '查看A的合成来源的导入记录' }).click();
  await expect(page.getByText('正在读取记录详情')).toBeVisible();
  await expect.poll(() => api.count('GET', path)).toBe(1);
  api.identity = 'B'; await recheckIdentity(page);
  await expect(page.getByRole('button', { name: 'B的合成城市 1 个想去', exact: true })).toBeVisible();
  await api.releaseAndWait(path);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expectPrivateHidden(page, ['A的合成来源', ownerAOriginal], true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(api.count('POST', '/api/ingest/xhs')).toBe(0);
});
