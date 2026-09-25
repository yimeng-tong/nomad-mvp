import { test, expect } from '../fixtures/browser-test';

test('B01 anonymous login uses actual clients before owner reads', async ({ page, api }) => {
  await page.goto('/');
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  await page.getByLabel('手机号', { exact: true }).fill('13800138000');
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await expect(page.getByText('验证码已发送', { exact: true })).toBeVisible();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '统一输入', exact: true })).toBeVisible();
  expect(api.count('POST', '/api/auth/otp/start')).toBe(1);
  expect(api.count('POST', '/api/auth/otp/verify')).toBe(1);
  expect(api.identity).toBe('A');
});
