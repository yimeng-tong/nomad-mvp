import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { HomeSheet } from '../src/home/HomeSheet';
import { PrivateUiBoundary, ModalClose } from '../src/ui';
import { PrivateUiFixture } from './PrivateUiFixture';
import type { components } from 'nomad-types/src/api-types';
import { TextScale } from './TextScale';
import { activeScenario, sceneFetch } from './scenario';

function SheetExample({ largeText = false, state = 'normal' }: { largeText?: boolean; state?: 'normal' | 'empty' | 'partial' | 'unknown' | 'long' }) {
  const [open, setOpen] = useState(false);
  const [partial, setPartial] = useState<components['schemas']['IngestSnapshot'] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (state !== 'partial') return;
    const signal = activeScenario().controller.signal;
    sceneFetch(activeScenario(), '/ingest/workbench-job', { signal })
      .then(async (response) => { if (!response.ok) throw new Error('WORKBENCH_PARTIAL_FAILED'); return await response.json() as components['schemas']['IngestSnapshot']; })
      .then((snapshot) => { if (!signal.aborted) setPartial(snapshot); }, () => { if (!signal.aborted) setError(true); });
  }, [state]);
  const content = <main className="workbench-stage">
    <h1 tabIndex={-1} data-ui-safe-focus>HomeSheet · 共享适配</h1>
    <p>合成组件场景；不代表 BMAD Story 或原生验收状态。</p>
    <button type="button" disabled={state === 'unknown'} aria-describedby={state === 'unknown' ? 'workbench-identity' : undefined} onClick={() => setOpen(true)}>打开灵感说明</button>
    {state === 'unknown' ? <p id="workbench-identity" role="status">合成身份尚未确认，暂不展示私有内容。本例只验证展示状态。</p> : null}
    {open ? <HomeSheet label="灵感说明" onClose={() => setOpen(false)}>
      <p>{state === 'empty' ? '暂无合成灵感' : state === 'long' ? '这是一段用于窄屏与放大文字检查的长中文说明，描述一段跨越清晨与傍晚的旅行安排，并保留足够内容验证关闭按钮仍然可达。'.repeat(4) : '用于验证现有弹层的键盘与关闭行为。'}</p>
      {state === 'partial' ? <p role="status">{error ? '合成状态读取失败' : partial?.partial && partial.result ? `部分内容已保存：${partial.stored_count ?? 0}项；其余内容未完成` : '正在读取合成状态'}</p> : null}
      <ModalClose>返回</ModalClose>
      <ModalClose>完成</ModalClose>
    </HomeSheet> : null}
  </main>;
  return <TextScale enabled={largeText}>{state === 'unknown' ? content : <PrivateUiFixture>{content}</PrivateUiFixture>}</TextScale>;
}

const meta = { title: 'Existing/HomeSheet', component: SheetExample } satisfies Meta<typeof SheetExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const KeyboardAndFocus: Story = {
  name: '正常 · 键盘循环与关闭焦点',
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: '打开灵感说明' });
    await userEvent.click(trigger);
    const sheet = within(await canvas.findByRole('dialog', { name: '灵感说明' }));
    await waitFor(() => expect(sheet.getByRole('heading', { name: '灵感说明' })).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(sheet.getByRole('button', { name: '关闭' })).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(sheet.getByRole('button', { name: '返回' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
export const Empty: Story = { name: '空', args: { state: 'empty' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开灵感说明' }));
  await expect(canvas.getByText('暂无合成灵感')).toBeVisible();
} };
export const Partial: Story = { name: 'partial · 当前DTO', args: { state: 'partial' }, parameters: { workbenchScenario: 'partial' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开灵感说明' }));
  await expect(await canvas.findByText('部分内容已保存：1项；其余内容未完成')).toBeVisible();
} };
export const UnconfirmedIdentity: Story = { name: '身份未确认 · 仅展示', args: { state: 'unknown' }, play: async ({ canvas }) => {
  await expect(canvas.getByRole('button', { name: '打开灵感说明' })).toBeDisabled();
  await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
} };
export const LongChinese: Story = { name: '长中文', args: { state: 'long' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开灵感说明' }));
  await expect(canvas.getByRole('dialog')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '完成' }));
  await waitFor(() => expect(canvas.getByRole('button', { name: '打开灵感说明' })).toHaveFocus());
} };
export const LargeText: Story = { name: '200% · 实际文字', args: { largeText: true }, play: async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole('button', { name: '打开灵感说明' });
  await expect(parseFloat(getComputedStyle(trigger).fontSize)).toBe(Number(trigger.dataset.workbenchFontBase) * 2);
  await userEvent.click(trigger);
  await waitFor(() => expect(canvas.getByRole('heading', { name: '灵感说明' })).toHaveFocus());
} };
export const ReducedMotion: Story = { name: 'reduced-motion · 键盘关闭', play: async ({ canvas, userEvent }) => {
  await expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  await userEvent.click(canvas.getByRole('button', { name: '打开灵感说明' }));
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.getByRole('button', { name: '打开灵感说明' })).toHaveFocus());
} };
export const Unmount: Story = { name: '卸载 · 有效触发器焦点恢复', play: async ({ canvas, canvasElement }) => {
  const trigger = canvas.getByRole('button', { name: '打开灵感说明' });
  trigger.focus();
  const container = document.createElement('div');
  canvasElement.append(container);
  const root = createRoot(container);
  try {
    root.render(<PrivateUiBoundary><HomeSheet label="卸载测试" onClose={() => root.unmount()} restoreFocusTo={trigger}><button type="button">临时操作</button></HomeSheet></PrivateUiBoundary>);
    await waitFor(() => expect(canvas.getByRole('heading', { name: '卸载测试' })).toHaveFocus());
    root.unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
  } finally { root.unmount(); container.remove(); }
} };
