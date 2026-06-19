import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Analytics } from '../auth/analytics';
import type { CurrentUserResponse } from '../auth/api';
import { SettingsScreen } from './SettingsScreen';
import type { SettingsApiClient } from './api';

const currentUser: CurrentUserResponse = {
  user_id: 'u_123',
  user: { id: 'u_123', phone: null },
  session: { id: 'sess_123', device_id: 'test-device', expires_at: new Date(Date.now() + 60_000).toISOString() },
};

function createApiClient(overrides: Partial<SettingsApiClient> = {}): SettingsApiClient {
  return {
    getByokStatus: vi.fn(async () => ({ configured: false, provider: null, key_ref: null })),
    validateByok: vi.fn(async () => ({ valid: true, provider: 'openai' })),
    saveByok: vi.fn(async () => ({ configured: true, provider: 'openai', key_ref: 'byok_ref' })),
    deleteByok: vi.fn(async () => undefined),
    requestDataExport: vi.fn(async () => ({ task_id: 'exp_123', status: 'queued' as const })),
    requestAccountDeletion: vi.fn(async () => ({ task_id: 'del_123', status: 'queued' as const })),
    getFeedbackLink: vi.fn(async () => ({ url: 'https://support.qq.com/product/12345?source=settings' })),
    ...overrides,
  };
}

function createAnalytics(): Analytics {
  return { track: vi.fn() };
}

describe('SettingsScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login state, platform quota copy, account actions, and feedback entry', async () => {
    render(<SettingsScreen currentUser={currentUser} apiClient={createApiClient()} analytics={createAnalytics()} onBack={vi.fn()} />);

    expect(await screen.findByText('账号与登录')).toBeInTheDocument();
    expect(screen.getByText('u_123')).toBeInTheDocument();
    expect(screen.getByText('平台额度可继续使用')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出数据' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除账号' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '反馈与建议' })).toBeInTheDocument();
  });

  it('validates and saves BYOK without exposing key material in analytics', async () => {
    const apiClient = createApiClient();
    const analytics = createAnalytics();
    render(<SettingsScreen currentUser={currentUser} apiClient={apiClient} analytics={analytics} onBack={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('OpenAI Key'), { target: { value: 'sk-test-secret-value' } });
    fireEvent.click(screen.getByRole('button', { name: '保存密钥' }));

    await waitFor(() => expect(apiClient.validateByok).toHaveBeenCalledWith({ key: 'sk-test-secret-value' }));
    await waitFor(() => expect(apiClient.saveByok).toHaveBeenCalledWith({ key: 'sk-test-secret-value' }));
    expect(await screen.findByText('已保存')).toBeInTheDocument();

    const payloads = vi.mocked(analytics.track).mock.calls.map(([, props]) => JSON.stringify(props ?? {}));
    expect(payloads.join(' ')).not.toContain('sk-test-secret-value');
    expect(payloads.join(' ')).not.toContain('support.qq.com');
  });

  it('shows validation failure and platform fallback copy for invalid BYOK', async () => {
    const apiClient = createApiClient({
      validateByok: vi.fn(async () => ({ valid: false, provider: null })),
    });
    render(<SettingsScreen currentUser={currentUser} apiClient={apiClient} analytics={createAnalytics()} onBack={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('OpenAI Key'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: '保存密钥' }));

    expect(await screen.findByText('密钥无效，请检查')).toBeInTheDocument();
    expect(screen.getByText('已回退到平台额度')).toBeInTheDocument();
    expect(apiClient.saveByok).not.toHaveBeenCalled();
  });

  it('requests account export and deletion only after confirmation', async () => {
    const apiClient = createApiClient({
      requestDataExport: vi.fn(async () => ({ task_id: 'exp_123', status: 'in_progress' as const })),
      requestAccountDeletion: vi.fn(async () => ({ task_id: 'del_123', status: 'done' as const })),
    });
    render(<SettingsScreen currentUser={currentUser} apiClient={apiClient} analytics={createAnalytics()} onBack={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: '导出数据' }));
    expect(apiClient.requestDataExport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '确认导出数据' }));
    expect(await screen.findByText('数据导出：处理中')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '删除账号' }));
    expect(apiClient.requestAccountDeletion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '确认删除账号' }));
    expect(await screen.findByText('账号删除：已完成')).toBeInTheDocument();
  });

  it('falls back when feedback cannot open and submits the fallback form', async () => {
    const apiClient = createApiClient();
    const analytics = createAnalytics();
    const openExternal = vi.fn((url: string) => url.startsWith('mailto:'));
    render(
      <SettingsScreen currentUser={currentUser} apiClient={apiClient} analytics={analytics} onBack={vi.fn()} openExternal={openExternal} />,
    );

    fireEvent.click(await screen.findByRole('button', { name: '反馈与建议' }));

    await waitFor(() => expect(apiClient.getFeedbackLink).toHaveBeenCalledWith({ source: 'settings' }));
    expect(openExternal).toHaveBeenCalledWith('https://support.qq.com/product/12345?source=settings');
    expect(await screen.findByText('页面无法内嵌，请使用内置表单提交')).toBeInTheDocument();
    expect(screen.getByText('内置表单已启用，可提交文本与截图')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('反馈内容'), { target: { value: '这里有一个问题' } });
    fireEvent.click(screen.getByRole('button', { name: '提交反馈' }));
    expect(await screen.findByText('反馈已提交到系统邮件')).toBeInTheDocument();
    expect(openExternal).toHaveBeenCalledWith(expect.stringContaining('mailto:support@nomad-mvp.local'));

    const payloads = vi.mocked(analytics.track).mock.calls.map(([, props]) => JSON.stringify(props ?? {}));
    expect(payloads.join(' ')).not.toContain('这里有一个问题');
    expect(payloads.join(' ')).not.toContain('support.qq.com');
  });
});
