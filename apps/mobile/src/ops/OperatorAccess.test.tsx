import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OperatorAccess } from './OperatorAccess';
import { commitIdentity } from '../auth/session-context';
const grant = { capability: 'places.correct', scope: 'workspace:nomad-test', version: 1 };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
beforeEach(() => commitIdentity({ ownerId: 'owner-a', sessionId: 'session-a' }));
afterEach(() => { vi.unstubAllGlobals(); commitIdentity(null); });
it('ordinary accounts get no operational action and a revoked grant removes an old action', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(json({ user_id: 'owner-a', grants: [grant] })).mockResolvedValue(json({ error_code: 'AUTH_OPERATOR_FORBIDDEN' }, 403));
  vi.stubGlobal('fetch', fetch); render(<OperatorAccess onLogout={vi.fn()} />);
  await screen.findByRole('button', { name: '验证地点纠错授权' });
  fireEvent.click(screen.getByRole('button', { name: '重新读取授权' }));
  await screen.findByText('当前账号没有可用的运营授权');
  expect(screen.queryByRole('button', { name: '验证地点纠错授权' })).toBeNull();
});
it('an uncertain audit write recovers with the same operation and exact grant version', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(json({ user_id: 'owner-a', grants: [grant] })).mockResolvedValueOnce(json({ error_code: 'AUTH_OPERATOR_UNAVAILABLE' }, 503))
    .mockResolvedValue(json({ receipt_id: 'receipt', verified_at: '2026-09-19T00:00:00Z' }));
  vi.stubGlobal('fetch', fetch); render(<OperatorAccess onLogout={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: '验证地点纠错授权' }));
  await screen.findByText('校验结果尚未确认，可重试同一次校验');
  fireEvent.click(screen.getByRole('button', { name: '验证地点纠错授权' }));
  await screen.findByText('授权校验已写入审计记录');
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  const first = JSON.parse(fetch.mock.calls[1][1].body), second = JSON.parse(fetch.mock.calls[2][1].body);
  expect(first.operation_id).toBe(second.operation_id); expect(first.expected_grant_version).toBe(1);
  expect(first.scope).toBe('workspace:nomad-test');
});
