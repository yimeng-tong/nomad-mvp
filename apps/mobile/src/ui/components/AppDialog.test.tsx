import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commitIdentity, markChecking, markUnavailable } from '../../auth/session-context';
import { AppDialog, ModalClose } from './AppDialog';
import { PrivateUiBoundary, useUiToast } from './PrivateUiBoundary';

const identity = { ownerId: 'ui-test-owner', sessionId: 'ui-test-session' };
beforeEach(() => commitIdentity(identity));
afterEach(() => { cleanup(); commitIdentity(null); });

function Harness({ canClose, closed }: { canClose?: () => Promise<boolean>; closed?: () => void }) {
  const [open, setOpen] = useState(true);
  return <>
    <h1 tabIndex={-1} data-ui-safe-focus>当前页面</h1>
    <button type="button">背景操作</button>
    <AppDialog open={open} title="私有确认" canClose={canClose} onOpenChange={() => { setOpen(false); closed?.(); }}>
      <p>当前会话的私有内容</p><ModalClose>关闭</ModalClose>
    </AppDialog>
  </>;
}

describe('AppDialog private boundary', () => {
  it('does not mount private content without a real boundary container', () => {
    render(<Harness />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.queryByText('当前会话的私有内容')).toBeNull();
  });

  it('portals inside the private DOM and releases dialog/background masking on close', async () => {
    render(<PrivateUiBoundary><Harness /></PrivateUiBoundary>);
    const dialog = await screen.findByRole('dialog', { name: '私有确认' });
    expect(dialog.closest('[data-private-portal-host]')).not.toBeNull();
    expect(dialog.closest('.auth-private')).not.toBeNull();
    await waitFor(() => expect(screen.queryByRole('button', { name: '背景操作' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(screen.getByRole('button', { name: '背景操作' })).toBeVisible();
  });

  it('removes an open modal during checking/unavailable, then rejects an old async close after the same owner returns', async () => {
    let release!: (allowed: boolean) => void; const closed = vi.fn();
    const decide = vi.fn(() => new Promise<boolean>((resolve) => { release = resolve; }));
    render(<PrivateUiBoundary><Harness canClose={decide} closed={closed} /></PrivateUiBoundary>);
    await screen.findByRole('dialog', { name: '私有确认' });
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => expect(decide).toHaveBeenCalledTimes(1));
    act(() => markChecking(false));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => markUnavailable()); expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => commitIdentity(identity));
    await screen.findByRole('dialog', { name: '私有确认' });
    await act(async () => { release(true); await Promise.resolve(); });
    expect(closed).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '私有确认' })).toBeVisible();
  });

  it('keeps a parent modal when the necessary nested confirmation closes', async () => {
    function Nested() {
      const [child, setChild] = useState(true);
      return <AppDialog open title="原临时层" onOpenChange={() => {}}>
        <ModalClose>关闭原层</ModalClose>
        <AppDialog open={child} title="上级确认" onOpenChange={() => setChild(false)}><ModalClose>返回原层</ModalClose></AppDialog>
      </AppDialog>;
    }
    render(<PrivateUiBoundary><Nested /></PrivateUiBoundary>);
    await screen.findByRole('dialog', { name: '上级确认' });
    fireEvent.click(screen.getByRole('button', { name: '返回原层' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '上级确认' })).toBeNull());
    expect(screen.getByRole('dialog', { name: '原临时层' })).toBeVisible();
  });

  it('deduplicates a noncritical toast, removes it during recheck and refuses an old captured notifier', async () => {
    let notify: ReturnType<typeof useUiToast> | undefined;
    function Source() { notify = useUiToast(); return <p>当前页面</p>; }
    render(<PrivateUiBoundary><Source /></PrivateUiBoundary>);
    await waitFor(() => expect(notify).toBeDefined());
    const captured = notify!;
    act(() => { expect(captured({ key: 'tip', message: '提示已更新' })).toBe(true); expect(captured({ key: 'tip', message: '提示已更新' })).toBe(false); });
    expect(await screen.findByText('提示已更新')).toBeVisible();
    act(() => markChecking(false)); expect(screen.queryByText('提示已更新')).toBeNull();
    act(() => commitIdentity(identity));
    act(() => expect(captured({ key: 'late', message: '旧提示' })).toBe(false));
    expect(screen.queryByText('旧提示')).toBeNull();
  });
});
