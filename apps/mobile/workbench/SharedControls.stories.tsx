import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AsyncState, Button, FormField, Input, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, type ReadState } from '../src/ui';
import { TextScale } from './TextScale';

function Controls({ state = 'normal', largeText = false }: { state?: 'normal' | 'loading' | 'disabled' | 'error'; largeText?: boolean }) {
  const [value, setValue] = useState('杭州三日旅行'), [count, setCount] = useState(0), [tab, setTab] = useState('plan');
  return <TextScale enabled={largeText}><main className="workbench-stage">
    <h1>Nomad 共享控件</h1>
    <p>合成组件输入，仅验证交互和可访问状态。</p>
    <form onSubmit={(event) => { event.preventDefault(); if (state !== 'loading' && state !== 'disabled') setCount((number) => number + 1); }}>
      <FormField label="旅行输入" description="确认后才提交本次输入" error={state === 'error' ? '暂时无法确认，请保留输入重试' : undefined}>
        {(field) => <Input {...field} name="travel-input" value={value} onValueChange={setValue} autoComplete="off" />}
      </FormField>
      <FormField label="补充说明" description="可以换行，不会自动提交">{(field) => <Textarea {...field} defaultValue="早晨步行，下午休息。" />}</FormField>
      <div className="shared-workbench-actions">
        <Button>普通操作</Button>
        <Button type="submit" variant="primary" loading={state === 'loading'} disabled={state === 'disabled'}
          disabledReason={state === 'loading' ? '正在确认原操作，请稍候' : state === 'disabled' ? '当前条件尚未确认' : undefined}>明确提交</Button>
      </div>
    </form>
    <p role="status">明确提交次数：{count}</p>
    <Tabs value={tab} onValueChange={(next) => { if (typeof next === 'string') setTab(next); }}>
      <TabsList aria-label="示例模式"><TabsTrigger value="plan">计划</TabsTrigger><TabsTrigger value="library">灵感</TabsTrigger></TabsList>
      <TabsContent value="plan"><p>计划示例内容</p></TabsContent>
      <TabsContent value="library"><p>灵感示例内容</p></TabsContent>
    </Tabs>
  </main></TextScale>;
}
const meta = { title: 'Shared/Controls', component: Controls } satisfies Meta<typeof Controls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '普通操作' }));
  await expect(canvas.getByText('明确提交次数：0')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '明确提交' }));
  await expect(canvas.getByText('明确提交次数：1')).toBeVisible();
  await expect(canvas.getByLabelText('旅行输入')).toHaveValue('杭州三日旅行');
} };
export const Loading: Story = { args: { state: 'loading' }, play: async ({ canvas }) => {
  const button = canvas.getByRole('button', { name: '明确提交' });
  await expect(button).toBeDisabled(); await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toHaveAccessibleDescription('正在确认原操作，请稍候');
} };
export const Disabled: Story = { args: { state: 'disabled' }, play: async ({ canvas }) => {
  const button = canvas.getByRole('button', { name: '明确提交' });
  await expect(button).toBeDisabled(); await expect(button).toHaveAccessibleDescription('当前条件尚未确认');
} };
export const Error: Story = { args: { state: 'error' }, play: async ({ canvas }) => {
  const input = canvas.getByLabelText('旅行输入');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription('确认后才提交本次输入 暂时无法确认，请保留输入重试');
  await expect(input).toHaveValue('杭州三日旅行');
} };
export const KeyboardTabs: Story = { play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('tab', { name: '计划' }));
  await userEvent.keyboard('{ArrowRight}{Enter}');
  await expect(canvas.getByRole('tab', { name: '灵感' })).toHaveAttribute('aria-selected', 'true');
  await expect(canvas.getByRole('tabpanel', { name: '灵感' })).toBeVisible();
  await expect(canvas.getByText('明确提交次数：0')).toBeVisible();
} };
export const LargeText: Story = { args: { largeText: true, state: 'error' }, play: async ({ canvas }) => {
  const input = canvas.getByLabelText('旅行输入');
  await expect(parseFloat(getComputedStyle(input).fontSize)).toBe(Number(input.dataset.workbenchFontBase) * 2);
  await expect(canvas.getByText('暂时无法确认，请保留输入重试')).toBeVisible();
} };

const states: [ReadState, string][] = [
  ['loading', '正在读取记录'], ['empty', '尚无记录'], ['error', '读取失败，可重试'],
  ['reconnect', '正在重新连接，保留已确认内容'], ['partial', '部分内容已保存'],
  ['stale', '这是先前确认的内容，尚未更新'], ['unverified', '结果尚未确认，请核对'],
];
export const HonestReadStates: Story = {
  render: () => <main className="workbench-stage"><h1>独立读取状态</h1>{states.map(([state, message]) => <section key={state}>
    <AsyncState state={state} message={message}>{state === 'loading' ? <Skeleton style={{ width: 160 }} /> : null}</AsyncState>
  </section>)}</main>,
  play: async ({ canvas }) => { for (const [, message] of states) await expect(canvas.getByText(message)).toBeVisible(); },
};
