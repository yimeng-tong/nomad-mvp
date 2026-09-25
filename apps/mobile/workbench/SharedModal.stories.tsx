import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AppDialog, AppSheet, Button, ModalClose, useModalCovered, useUiToast } from '../src/ui';
import { PrivateUiFixture } from './PrivateUiFixture';
import { commitIdentity, markChecking, markUnavailable } from '../src/auth/session-context';

async function expectSelectedBrowser() {
  const configured: unknown = import.meta.env.NOMAD_WORKBENCH_PUBLIC_BROWSER;
  if (typeof configured !== 'string' || !configured) return;
  const ua = navigator.userAgent;
  const observed = /Firefox\//.test(ua) ? 'firefox' : /(?:Chrome|Chromium)\//.test(ua) ? 'chromium' : /AppleWebKit\//.test(ua) ? 'webkit' : 'unknown';
  await expect(observed, 'NOMAD_SHARED_UI_ENGINE').toBe(configured);
}

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
export const DeniedClose: Story = { args: { policy: 'deny' }, play: async ({ canvas, canvasElement, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: '打开共享临时层' }));
  const backdrop = canvasElement.querySelector<HTMLElement>('.nomad-modal-backdrop');
  await expect(backdrop).not.toBeNull();
  await userEvent.click(backdrop!);
  await expect(canvas.getByRole('dialog', { name: '共享临时层' })).toBeVisible();
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

function ImplicitFocusDemo() {
  const [open, setOpen] = useState(false);
  return <main className="workbench-stage"><h1 tabIndex={-1} data-ui-safe-focus>隐式触发器示例</h1>
    <Button onClick={() => setOpen(true)}>打开未传ref的确认</Button>
    <AppDialog open={open} onOpenChange={() => setOpen(false)} title="保持实际触发器"><ModalClose>关闭确认</ModalClose></AppDialog>
  </main>;
}
export const ImplicitFocusRecovery: Story = {
  name: '身份恢复 · 隐式触发器',
  render: () => <PrivateUiFixture><ImplicitFocusDemo /></PrivateUiFixture>,
  play: async ({ canvas, userEvent }) => {
    await expectSelectedBrowser();
    const trigger = canvas.getByRole('button', { name: '打开未传ref的确认' });
    await userEvent.click(trigger);
    await expect(await canvas.findByRole('dialog', { name: '保持实际触发器' })).toBeVisible();
    markChecking(false);
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
    commitIdentity({ ownerId: 'workbench-ui-owner', sessionId: 'workbench-ui-session' });
    await expect(await canvas.findByRole('dialog', { name: '保持实际触发器' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '关闭确认' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

function ToastLifecycleDemo() {
  const notify = useUiToast();
  const release = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState(false), [outcome, setOutcome] = useState('');
  return <main className="workbench-stage"><h1>私有提示生命周期</h1>
    <Button onClick={() => notify({ key: 'private-note', message: '已核实身份的私有提示' })}>显示私有提示</Button>
    <Button onClick={() => {
      const captured = notify; setPending(true);
      new Promise<void>((resolve) => { release.current = resolve; }).then(() => {
        const accepted = captured({ key: 'late-note', message: '旧身份周期的迟到提示' });
        setOutcome(accepted ? '错误接收迟到提示' : '迟到提示已拒绝'); setPending(false);
      }).catch(() => { setOutcome('合成等待失败'); setPending(false); });
    }}>保留迟到回调</Button>
    {pending ? <Button onClick={() => release.current?.()}>释放旧回调</Button> : null}
    <p role="status">{outcome}</p>
  </main>;
}
export const PrivateToastLifecycle: Story = {
  name: '身份恢复 · 私有提示与迟到回调',
  render: () => <PrivateUiFixture><ToastLifecycleDemo /></PrivateUiFixture>,
  play: async ({ canvas, userEvent }) => {
    await expectSelectedBrowser();
    await userEvent.click(canvas.getByRole('button', { name: '显示私有提示' }));
    await expect(await canvas.findByText('已核实身份的私有提示')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '保留迟到回调' }));
    markChecking(false);
    await waitFor(() => expect(document.body.innerText).not.toContain('已核实身份的私有提示'));
    await expect(canvas.queryByText('已核实身份的私有提示')).not.toBeInTheDocument();
    markUnavailable();
    await expect(canvas.queryByText('已核实身份的私有提示')).not.toBeInTheDocument();
    commitIdentity({ ownerId: 'workbench-ui-owner', sessionId: 'workbench-ui-session' });
    await userEvent.click(await canvas.findByRole('button', { name: '释放旧回调' }));
    await expect(await canvas.findByText('迟到提示已拒绝')).toBeVisible();
    await expect(canvas.queryByText('旧身份周期的迟到提示')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '显示私有提示' }));
    await expect(await canvas.findByText('已核实身份的私有提示')).toBeVisible();
    commitIdentity({ ownerId: 'workbench-ui-owner', sessionId: 'workbench-ui-session-new' });
    await waitFor(() => expect(canvas.queryByText('已核实身份的私有提示')).not.toBeInTheDocument());
    await userEvent.click(await canvas.findByRole('button', { name: '显示私有提示' }));
    await expect(await canvas.findByText('已核实身份的私有提示')).toBeVisible();
    commitIdentity({ ownerId: 'workbench-ui-other-owner', sessionId: 'workbench-ui-other-session' });
    await waitFor(() => expect(canvas.queryByText('已核实身份的私有提示')).not.toBeInTheDocument());
  },
};
