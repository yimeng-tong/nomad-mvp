import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createHostRuntime } from '../platform/host-runtime';
import type { SettingsApiClient } from './api';
import { commitIdentity } from '../auth/session-context';
import { PrivateUiBoundary } from '../ui';
import { SettingsScreen } from './SettingsScreen';

const bridge = vi.hoisted(() => ({
  runtime: null as ReturnType<typeof createHostRuntime> | null,
  keyboard: null as ((shown: boolean) => void) | null,
  hide: vi.fn(async () => {}), minimize: vi.fn(async () => {}),
}));
vi.mock('../platform/host', async () => {
  const { createHostRuntime: createRuntime } = await import('../platform/host-runtime');
  const handle = async () => ({ remove: async () => {} });
  const runtime = createRuntime({ platform: 'android', onState: handle, onBack: handle, onUrlOpen: handle,
    onKeyboard: (callback) => { bridge.keyboard = callback; return handle(); },
    getState: async () => true, getAppId: async () => 'dev.nomad.mvp', getLaunchUrl: async () => undefined,
    hideKeyboard: bridge.hide, minimize: bridge.minimize, openExternal: async () => true });
  bridge.runtime = runtime;
  return { getHostPlatform: () => 'web', registerHostBackHandler: runtime.registerBackHandler };
});

const user = { user_id: 'host-test-owner', user: { id: 'host-test-owner' }, session: { id: 'host-test-session', device_id: 'synthetic-device', expires_at: '2027-01-01T00:00:00Z' } };
let stop: (() => void) | undefined;
beforeEach(async () => {
  bridge.hide.mockClear(); bridge.minimize.mockClear();
  commitIdentity({ ownerId: user.user_id, sessionId: user.session.id });
  const lease = bridge.runtime!.start(); stop = lease.stop; await lease.ready;
});
afterEach(() => { cleanup(); stop?.(); commitIdentity(null); });

describe('shared logout modal with the actual host coordinator and a synthetic native driver', () => {
  it.each(['saving', 'export', 'delete', 'feedback'] as const)('consumes keyboard then top modal before legacy %s or page back', async (background) => {
    let finishValidation: ((value: { valid: boolean; provider: null }) => void) | undefined;
    const api: SettingsApiClient = {
      getByokStatus: async () => ({ configured: false, provider: null, key_ref: null }),
      validateByok: () => new Promise((resolve) => { finishValidation = resolve; }),
      saveByok: async () => ({ configured: true, provider: 'openai', key_ref: 'synthetic-reference' }),
      deleteByok: async () => {}, requestDataExport: async () => ({ task_id: 'export', status: 'queued' }),
      requestAccountDeletion: async () => ({ task_id: 'delete', status: 'queued' }),
      getFeedbackLink: async () => { throw new Error('synthetic feedback unavailable'); },
    };
    const pageBack = vi.fn(() => true), logout = vi.fn();
    const removePage = bridge.runtime!.registerBackHandler(pageBack, 0);
    try {
      render(<PrivateUiBoundary><SettingsScreen currentUser={user} apiClient={api} onBack={pageBack} onLogout={logout} /></PrivateUiBoundary>);
      if (background === 'saving') {
        fireEvent.change(await screen.findByLabelText('OpenAI Key'), { target: { value: 'synthetic-value' } });
        fireEvent.click(screen.getByRole('button', { name: '保存密钥' }));
        await waitFor(() => expect(screen.getByRole('button', { name: '保存密钥' })).toBeDisabled());
      } else {
        fireEvent.click(await screen.findByRole('button', { name: background === 'export' ? '导出数据' : background === 'delete' ? '删除账号' : '反馈与建议' }));
        if (background === 'feedback') await screen.findByLabelText('反馈内容');
      }
      fireEvent.click(screen.getByRole('button', { name: '退出当前登录' }));
      await screen.findByRole('dialog', { name: '退出当前登录' });
      bridge.keyboard?.(true);
      await act(async () => { await bridge.runtime!.handleBack(); });
      expect(bridge.hide).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('dialog', { name: '退出当前登录' })).toBeVisible();
      await act(async () => { await bridge.runtime!.handleBack(); });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(pageBack).not.toHaveBeenCalled(); expect(logout).not.toHaveBeenCalled(); expect(bridge.minimize).not.toHaveBeenCalled();
      if (background === 'saving') expect(screen.getByRole('button', { name: '保存密钥' })).toBeDisabled();
      else if (background === 'feedback') expect(screen.getByLabelText('反馈内容')).toBeVisible();
      else expect(screen.getByRole('button', { name: background === 'export' ? '确认导出数据' : '确认删除账号' })).toBeVisible();
    } finally {
      if (finishValidation) await act(async () => { finishValidation?.({ valid: false, provider: null }); await Promise.resolve(); });
      removePage();
    }
  });
});
