import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AppDialog, AppSheet, Button, ModalClose, useModalCovered, useUiToast } from '../src/ui';
import { PrivateUiFixture } from './PrivateUiFixture';

function ModalDemo({ policy = 'allow' }: { policy?: 'allow' | 'deny' | 'async' }) {
  const [open, setOpen] = useState(false), [child, setChild] = useState(false), [deciding, setDeciding] = useState(false);
  const trigger = useRef<HTMLElement | null>(null), release = useRef<((allowed: boolean) => void) | null>(null);
  const covered = useModalCovered(), notify = useUiToast();
  return <main className="workbench-stage">
    <h1 tabIndex={-1} data-ui-safe-focus>共享模态示例</h1>
    <Button onClick={(event) => { trigger.current = event.currentTarget; setOpen(true); }}>打开共享临时层</Button>
    <Button onClick={() => notify({ key: 'example-tip', message: '示例提示已更新' })}>显示非关键提示</Button>
    <p data-testid="modal-coverage">{covered ? '暂时遮挡内容' : '内容可见'}</p>
    <AppSheet open={open} onOpenChange={() => setOpen(false)} title="共享临时层" restoreFocusTo={trigger.current}
      canClose={() => {
        if (policy === 'deny') return false;
        if (policy === 'async') { setDeciding(true); return new Promise<boolean>((resolve) => { release.current = resolve; }); }
        return true;
      }}>
      <p>关闭不保存或重交任务。</p>
      {policy === 'deny' ? <p role="status">当前操作未确认，暂时保留此窗口。</p> : null}
      {deciding ? <><p role="status">正在核对关闭条件</p><Button onClick={() => { release.current?.(true); setDeciding(false); }}>允许关闭</Button></> : null}
      <Button onClick={() => setChild(true)}>查看上级确认</Button>
      <ModalClose>关闭临时层</ModalClose>
      <AppDialog open={child} title="上级确认" onOpenChange={() => setChild(false)}>
        <p>只关闭这一层。</p><ModalClose>返回临时层</ModalClose>
      </AppDialog>
    </AppSheet>
  </main>;
}
function Example(props: { policy?: 'allow' | 'deny' | 'async' }) { return <PrivateUiFixture><ModalDemo {...props} /></PrivateUiFixture>; }
const meta = { title: 'Shared/Modal', component: Example } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PrivatePortal: Story = { play: async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole('button', { name: '打开共享临时层' });
  await userEvent.click(trigger);
  const modal = await canvas.findByRole('dialog', { name: '共享临时层' });
  await expect(modal.closest('[data-private-portal-host]')).not.toBeNull();
  await expect(canvas.queryByRole('button', { name: '显示非关键提示' })).not.toBeInTheDocument();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
  await expect(canvas.getByTestId('modal-coverage')).toHaveTextContent('内容可见');
} };
export const DeniedClose: Story = { args: { policy: 'deny' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开共享临时层' }));
  await userEvent.keyboard('{Escape}');
  await expect(canvas.getByRole('dialog', { name: '共享临时层' })).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '关闭临时层' }));
  await expect(canvas.getByText('当前操作未确认，暂时保留此窗口。')).toBeVisible();
} };
export const AsyncClose: Story = { args: { policy: 'async' }, play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开共享临时层' }));
  await userEvent.keyboard('{Escape}');
  await expect(await canvas.findByText('正在核对关闭条件')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '允许关闭' }));
  await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
} };
export const NestedConfirmation: Story = { play: async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开共享临时层' }));
  await userEvent.click(canvas.getByRole('button', { name: '查看上级确认' }));
  await expect(canvas.getByRole('dialog', { name: '上级确认' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('dialog', { name: '上级确认' })).not.toBeInTheDocument());
  await expect(canvas.getByRole('dialog', { name: '共享临时层' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
} };
export const QuietToast: Story = { play: async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole('button', { name: '显示非关键提示' });
  await userEvent.click(trigger); await userEvent.click(trigger);
  await expect(await canvas.findAllByText('示例提示已更新')).toHaveLength(1);
  await expect(trigger).toHaveFocus();
  await userEvent.click(canvas.getByRole('button', { name: '关闭通知' }));
  await waitFor(() => expect(canvas.queryByText('示例提示已更新')).not.toBeInTheDocument());
} };
