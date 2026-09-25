import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthApiError, type AuthApiClient, type CurrentUserResponse } from './api';
import { commitIdentity, getAuthSnapshot, markChecking } from './session-context';

const logoutMock = vi.hoisted(() => vi.fn());
vi.mock('./api', async (original) => ({ ...await original<typeof import('./api')>(), logoutCurrentSession: logoutMock }));
vi.mock('../home/HomeScreen', () => ({ HomeScreen: ({ onOpenSettings }: { onOpenSettings: () => void }) => <section><p>私人主页</p><input aria-label="未提交草稿" defaultValue="" /><button onClick={onOpenSettings}>设置</button></section> }));
vi.mock('../settings/SettingsScreen', () => ({ SettingsScreen: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>确认退出</button> }));
vi.mock('../planner/PlannerScreen', () => ({ PlannerScreen: () => <div>私人规划</div> }));
const user = (id: string): CurrentUserResponse => ({ user_id: id, user: { id, phone: null }, session: { id: `session-${id}`, device_id: 'device', expires_at: '2030-01-01T00:00:00.000Z' } });
const client = (getCurrentUser: AuthApiClient['getCurrentUser']) => ({ getCurrentUser, getConfig: vi.fn(), startOtp: vi.fn(), verifyOtp: vi.fn() } as AuthApiClient);
beforeEach(() => { commitIdentity(null); logoutMock.mockReset(); });

it('authority unavailable is distinct from confirmed logout and hides retained private views', async () => {
  const getCurrentUser = vi.fn().mockResolvedValueOnce(user('a')).mockRejectedValueOnce(new AuthApiError('unavailable', { status: 503, code: 'AUTH_AUTHORITY_UNAVAILABLE' })).mockResolvedValue(user('a'));
  render(<App authClient={client(getCurrentUser)} />);
  const draft = await screen.findByLabelText('未提交草稿');
  fireEvent.change(draft, { target: { value: '保留同账号草稿' } });
  fireEvent.focus(window);
  await screen.findByText('暂时无法确认登录状态');
  expect(draft).not.toBeVisible(); expect(draft).toHaveValue('保留同账号草稿');
  fireEvent.click(screen.getByRole('button', { name: '重试确认' }));
  await waitFor(() => expect(draft).toBeVisible()); expect(draft).toHaveValue('保留同账号草稿');
});

it('a lost cross-tab notification is recovered on foreground and clears the old owner draft', async () => {
  const getCurrentUser = vi.fn().mockResolvedValueOnce(user('a')).mockResolvedValue(user('b'));
  render(<App authClient={client(getCurrentUser)} />);
  const draft = await screen.findByLabelText('未提交草稿'); fireEvent.change(draft, { target: { value: 'A-private' } });
  fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));
  await waitFor(() => expect(getAuthSnapshot().identity?.ownerId).toBe('b'));
  expect(screen.getByLabelText('未提交草稿')).toHaveValue('');
});

it('cross-tab payloads never establish identity', async () => {
  const getCurrentUser = vi.fn().mockResolvedValue(user('a'));
  render(<App authClient={client(getCurrentUser)} />); await screen.findByText('私人主页');
  fireEvent(window, new StorageEvent('storage', { key: 'nomad-auth-changed-v1', newValue: '{"user_id":"attacker","role":"admin"}' }));
  await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(getAuthSnapshot().phase).toBe('authenticated'));
  expect(getAuthSnapshot().identity?.ownerId).toBe('a');
});


it('foreground retries an uncertain logout with its original operation instead of blocking recovery', async () => {
  logoutMock.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ ok: true });
  const getCurrentUser = vi.fn().mockResolvedValueOnce(user('a')).mockRejectedValue(new AuthApiError('expired', { status: 401, code: 'AUTH_SESSION_EXPIRED' }));
  render(<App authClient={client(getCurrentUser)} />);
  fireEvent.click(await screen.findByRole('button', { name: '设置' }));
  fireEvent.click(screen.getByRole('button', { name: '确认退出' }));
  await screen.findByText('退出结果尚未确认');
  fireEvent(window, new PageTransitionEvent('pagehide'));
  fireEvent(window, new PageTransitionEvent('pageshow'));
  await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(2));
  expect(logoutMock.mock.calls[0][0]).toBe(logoutMock.mock.calls[1][0]);
  await waitFor(() => expect(getAuthSnapshot().phase).toBe('anonymous'));
});

it('a changed current identity stops an old logout retry without claiming that old logout succeeded', async () => {
  logoutMock.mockRejectedValue(new AuthApiError('changed', { status: 409, code: 'AUTH_CONTEXT_CHANGED' }));
  const getCurrentUser = vi.fn().mockResolvedValueOnce(user('a')).mockResolvedValue(user('b'));
  render(<App authClient={client(getCurrentUser)} />);
  fireEvent.click(await screen.findByRole('button', { name: '设置' }));
  fireEvent.click(screen.getByRole('button', { name: '确认退出' }));
  await screen.findByText('当前登录已变化，已停止原会话的退出重试');
  expect(getAuthSnapshot().identity?.ownerId).toBe('b'); expect(logoutMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('私人主页')).toBeVisible();
});


it('a late identity-conflict probe cannot unlock a stale owner after another invalidation', async () => {
  logoutMock.mockRejectedValue(new AuthApiError('changed', { status: 409, code: 'AUTH_CONTEXT_CHANGED' }));
  let resolve!: (value: CurrentUserResponse) => void;
  const getCurrentUser = vi.fn().mockResolvedValueOnce(user('a')).mockImplementation(() => new Promise<CurrentUserResponse>((done) => { resolve = done; }));
  render(<App authClient={client(getCurrentUser)} />);
  fireEvent.click(await screen.findByRole('button', { name: '设置' })); fireEvent.click(screen.getByRole('button', { name: '确认退出' }));
  await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(2));
  markChecking(false); resolve(user('b'));
  await screen.findByText('退出结果尚未确认');
  expect(getAuthSnapshot().identity?.ownerId).toBe('a'); expect(getAuthSnapshot().phase).toBe('unavailable');
});
