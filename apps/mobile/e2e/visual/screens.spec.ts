import { test, expect } from '../fixtures/browser-test';
import { doubleText, expectLayout, expectHomeCardText } from '../fixtures/layout';
import { capture } from './capture';
import policy from './policy.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  // These scenes contain no ingestion or timeout claims; B07 uses an independent real clock.
  await page.clock.setFixedTime(new Date(policy.fixedDate));
});

test('V01 login normal', async ({ page }, info) => {
  await page.goto('/'); await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await expectLayout(page, page.getByRole('button', { name: '登录', exact: true }));
  await capture(page, info, 'V01-login');
});
test('V02 Home normal', async ({ page, api }, info) => {
  api.identity = 'A'; await page.goto('/');
  await expect(page.getByRole('button', { name: 'A的合成城市 1 个想去', exact: true })).toBeVisible();
  await expectLayout(page, page.getByRole('button', { name: '添加', exact: true }));
  await capture(page, info, 'V02-home');
});
test('V03 Home long Chinese', async ({ page, api }, info) => {
  api.identity = 'A'; api.library = 'long'; await page.goto('/');
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await expectLayout(page, page.getByRole('button', { name: '添加', exact: true }));
  await expectHomeCardText(page);
  await capture(page, info, 'V03-long-home');
});
test('V04 login actual 200 percent text', async ({ page }, info) => {
  await page.goto('/'); await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await doubleText(page);
  await expectLayout(page, page.getByRole('button', { name: '登录', exact: true }));
  await capture(page, info, 'V04-large-login');
});
test('V05 Home actual 200 percent text', async ({ page, api }, info) => {
  api.identity = 'A'; await page.goto('/');
  await expect(page.locator('.destination-card')).toHaveCount(1); await doubleText(page);
  await expectLayout(page, page.getByRole('button', { name: '添加', exact: true }));
  await capture(page, info, 'V05-large-home');
});
test('V06 actual Sheet keyboard focus', async ({ page, api }, info) => {
  api.identity = 'A'; await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill('周末去哪里走走');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  const first = page.getByRole('button', { name: '作为链接入库', exact: true });
  await expect(page.getByRole('heading', { name: '选择输入类型', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(first).toBeFocused(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  await capture(page, info, 'V06-keyboard-sheet');
});
test('V07 long Sheet actual 200 percent text', async ({ page, api }, info) => {
  api.identity = 'A'; await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill('沿着海岸步道慢慢散步，午后寻找一间安静的咖啡馆，傍晚观看落日。'.repeat(8));
  await page.getByRole('button', { name: '发送', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '选择输入类型', exact: true });
  await expect(sheet).toBeVisible(); await doubleText(page);
  const close = sheet.getByRole('button', { name: '关闭', exact: true });
  await expectLayout(page, close); await close.focus();
  await capture(page, info, 'V07-large-long-sheet');
});
test('V08 current logout confirmation only', async ({ page, api }, info) => {
  api.identity = 'A'; await page.goto('/');
  await page.getByRole('button', { name: '菜单', exact: true }).click();
  await page.getByRole('button', { name: '退出当前登录', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '退出当前登录', exact: true });
  await expectLayout(page, dialog.getByRole('button', { name: '取消', exact: true }));
  // Crop to the actual current confirmation; the legacy Settings page is not a new 7.3 design approval.
  await capture(page, info, 'V08-logout-confirmation', dialog);
});

test('V09 minimum 320px Login keeps labels and primary action reachable', async ({ page }, info) => {
  await page.setViewportSize(policy.sceneViewports['V09-narrow-login']); await page.goto('/');
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await expectLayout(page, page.getByRole('button', { name: '登录', exact: true }));
  await capture(page, info, 'V09-narrow-login');
});
test('V10 representative desktop Home retains current layout and input', async ({ page, api }, info) => {
  api.identity = 'A'; await page.setViewportSize(policy.sceneViewports['V10-desktop-home']); await page.goto('/');
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await expectLayout(page, page.getByRole('button', { name: '添加', exact: true }));
  await capture(page, info, 'V10-desktop-home');
});
test('V11 minimum 320px shared Sheet scrolls long content to its actions', async ({ page, api }, info) => {
  api.identity = 'A'; await page.setViewportSize(policy.sceneViewports['V11-narrow-sheet']); await page.goto('/');
  await page.getByRole('textbox', { name: '统一输入', exact: true }).fill('沿着湖边走走，保留午后的休息时间与傍晚观景。'.repeat(8));
  await page.getByRole('button', { name: '发送', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '选择输入类型', exact: true });
  await expectLayout(page, sheet.getByRole('button', { name: '关闭', exact: true }));
  await capture(page, info, 'V11-narrow-sheet');
});
