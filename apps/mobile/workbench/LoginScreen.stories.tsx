import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { LoginScreen } from '../src/auth/LoginScreen';
import { createNoopAnalytics } from '../src/auth/analytics';
import { activeScenario, scenarioClient } from './scenario';
import { TextScale } from './TextScale';

function LoginExample({ largeText = false }: { largeText?: boolean }) {
  const client = useMemo(() => scenarioClient(activeScenario()), []);
  return <TextScale enabled={largeText}><LoginScreen apiClient={client} platform="web" analytics={createNoopAnalytics()}
    getCaptchaToken={() => 'workbench-captcha'} openExternal={() => true} /></TextScale>;
}

const meta = { title: 'Existing/LoginScreen', component: LoginExample } satisfies Meta<typeof LoginExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: '正常 · 真实字段和合成登录',
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByRole('textbox', { name: '手机号' }), '13800000000');
    await userEvent.click(canvas.getByRole('button', { name: '获取验证码' }));
    await expect(await canvas.findByText('验证码已发送')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /秒后重发/ })).toBeDisabled();
    await userEvent.type(canvas.getByRole('textbox', { name: '验证码' }), '000000');
    await userEvent.click(canvas.getByRole('button', { name: '登录' }));
    await expect(await canvas.findByText('登录成功')).toBeVisible();
  },
};
export const Empty: Story = { name: '空 · 无可用方式', parameters: { workbenchScenario: 'empty' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('手机号登录暂不可用')).toBeVisible();
  await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
} };
export const Loading: Story = { name: '加载中', parameters: { workbenchScenario: 'loading' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('正在加载登录方式')).toBeVisible();
  await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
} };
export const Forbidden: Story = { name: '403 · 文字错误', parameters: { workbenchScenario: 'forbidden' }, play: async ({ canvas, userEvent }) => {
  await userEvent.type(await canvas.findByRole('textbox', { name: '手机号' }), '13800000000');
  await userEvent.click(canvas.getByRole('button', { name: '获取验证码' }));
  await expect(await canvas.findByText('当前登录方式暂不可用')).toBeVisible();
  await expect(canvas.getByRole('textbox', { name: '手机号' })).toHaveAccessibleDescription('当前登录方式暂不可用');
  await expect(canvas.getByRole('textbox', { name: '验证码' })).toHaveAccessibleDescription('当前登录方式暂不可用');
} };
export const Timeout: Story = { name: '超时 · 可重试', parameters: { workbenchScenario: 'timeout' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('登录配置加载失败，请检查网络后重试')).toBeVisible();
  await expect(canvas.getByRole('button', { name: '重试' })).toBeEnabled();
  await expect(activeScenario().timeouts).toBe(1);
} };
export const Reconnect: Story = { name: '重连 · 明确重试', parameters: { workbenchScenario: 'reconnect' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(await canvas.findByRole('button', { name: '重试' }));
  await expect(await canvas.findByRole('textbox', { name: '手机号' })).toBeVisible();
  await expect(canvas.queryByText('登录配置加载失败，请检查网络后重试')).not.toBeInTheDocument();
} };
export const Captcha: Story = { name: '禁用原因 · 合成验证', parameters: { workbenchScenario: 'captcha' }, play: async ({ canvas, userEvent }) => {
  await userEvent.type(await canvas.findByRole('textbox', { name: '手机号' }), '13800000000');
  await userEvent.click(canvas.getByRole('button', { name: '获取验证码' }));
  await expect(await canvas.findByText('需要完成行为验证后再发送验证码')).toBeVisible();
  await expect(canvas.getByRole('button', { name: '获取验证码' })).toBeDisabled();
  await expect(canvas.getByRole('button', { name: '获取验证码' })).toHaveAccessibleDescription('需要完成行为验证后再发送验证码');
  await userEvent.click(canvas.getByRole('button', { name: '已完成验证，重新发送' }));
  await expect(await canvas.findByText('验证码已发送')).toBeVisible();
} };
export const LongChinese: Story = { name: '长中文', parameters: { workbenchScenario: 'long' }, play: async ({ canvas }) => {
  await expect(await canvas.findByRole('button', { name: /合成的超长中文说明/ })).toBeVisible();
} };
export const LargeText: Story = { name: '200% · 实际字段字号', args: { largeText: true }, play: async ({ canvas, userEvent }) => {
  const phone = await canvas.findByRole('textbox', { name: '手机号' });
  await waitFor(() => expect(parseFloat(getComputedStyle(phone).fontSize)).toBe(Number(phone.dataset.workbenchFontBase) * 2));
  await userEvent.type(phone, '13800000000');
  await userEvent.click(canvas.getByRole('button', { name: '获取验证码' }));
  await expect(await canvas.findByText('验证码已发送')).toBeVisible();
} };
