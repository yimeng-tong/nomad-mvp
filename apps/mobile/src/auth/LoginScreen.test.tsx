import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';
import type { AuthApiClient, AuthConfigResponse } from './api';
import type { Analytics } from './analytics';

function createApiClient(overrides: Partial<AuthApiClient> = {}): AuthApiClient {
  const config: AuthConfigResponse = {
    privacy_url: '/legal/privacy',
    user_agreement_url: '/legal/terms',
    enabled_methods: [
      { id: 'phone', label: 'Phone', type: 'phone', enabled: true },
      { id: 'apple', label: 'Apple', type: 'third_party', provider: 'apple', enabled: true },
      { id: 'wechat', label: 'WeChat', type: 'third_party', provider: 'wechat', enabled: true },
    ],
    ios_equal_weight_order: ['apple', 'phone', 'wechat'],
    captcha: { provider: 'tencent', mode: 'risk' },
  };

  return {
    getConfig: vi.fn(async () => config),
    startOtp: vi.fn(async () => ({ sent: true, retry_after_sec: 60, captcha_required: false })),
    verifyOtp: vi.fn(async () => ({
      user_id: 'u_123',
      user: { id: 'u_123', phone: null },
      session: { id: 'sess_123', device_id: 'test-device', expires_at: new Date(Date.now() + 60000).toISOString() },
    })),
    getCurrentUser: vi.fn(async () => ({
      user_id: 'u_123',
      user: { id: 'u_123', phone: null },
      session: { id: 'sess_123', device_id: 'test-device', expires_at: new Date(Date.now() + 60000).toISOString() },
    })),
    ...overrides,
  };
}

function createAnalytics(): Analytics {
  return { track: vi.fn() };
}

describe('LoginScreen', () => {
  it('renders iOS login methods with equal weight and configured order', async () => {
    const apiClient = createApiClient();
    const analytics = createAnalytics();
    render(<LoginScreen apiClient={apiClient} analytics={analytics} platform="ios" />);

    const methods = await screen.findAllByTestId('login-method');
    expect(methods.map((method) => method.getAttribute('data-method'))).toEqual(['apple', 'phone', 'wechat']);
    expect(new Set(methods.map((method) => method.className))).toHaveLength(1);
    expect(methods.every((method) => method.className.includes('equal-weight'))).toBe(true);

    fireEvent.click(methods[0]);
    expect(apiClient.getConfig).toHaveBeenCalledTimes(1);
    expect(vi.mocked(analytics.track).mock.calls.filter(([event]) => event === 'auth_view')).toHaveLength(1);
  });

  it('opens legal links without clearing phone input', async () => {
    const openExternal = vi.fn();
    render(<LoginScreen apiClient={createApiClient()} analytics={createAnalytics()} platform="ios" openExternal={openExternal} />);

    const phone = await screen.findByLabelText('手机号');
    fireEvent.change(phone, { target: { value: '+8613800138000' } });
    fireEvent.click(screen.getByRole('button', { name: '隐私政策' }));
    fireEvent.click(screen.getByRole('button', { name: '用户协议' }));

    expect(openExternal).toHaveBeenNthCalledWith(1, '/legal/privacy');
    expect(openExternal).toHaveBeenNthCalledWith(2, '/legal/terms');
    expect(phone).toHaveValue('+8613800138000');
  });

  it('starts OTP, respects cooldown, verifies with otp, and emits privacy-safe analytics', async () => {
    const apiClient = createApiClient();
    const analytics = createAnalytics();
    const onAuthenticated = vi.fn();
    render(<LoginScreen apiClient={apiClient} analytics={analytics} platform="ios" onAuthenticated={onAuthenticated} />);

    fireEvent.change(await screen.findByLabelText('手机号'), { target: { value: '+8613800138000' } });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));

    await waitFor(() => expect(apiClient.startOtp).toHaveBeenCalledWith({ phone: '+8613800138000', region: 'CN' }));
    expect(screen.getByRole('button', { name: /秒后重发/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('验证码'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(apiClient.verifyOtp).toHaveBeenCalledWith({
      phone: '+8613800138000',
      otp: '000000',
      device_fingerprint: expect.any(String),
    });

    const trackedPayloads = vi.mocked(analytics.track).mock.calls.map(([, props]) => JSON.stringify(props ?? {}));
    expect(trackedPayloads.join(' ')).not.toContain('+8613800138000');
    expect(trackedPayloads.join(' ')).not.toContain('000000');
  });

  it('handles captcha-required start and retries with the local stub token', async () => {
    const startOtp = vi
      .fn()
      .mockResolvedValueOnce({ sent: false, retry_after_sec: 0, captcha_required: true, captcha_provider: 'tencent' })
      .mockResolvedValueOnce({ sent: true, retry_after_sec: 60, captcha_required: false });
    const apiClient = createApiClient({ startOtp });
    const getCaptchaToken = vi.fn(async () => 'captcha-from-provider');

    render(<LoginScreen apiClient={apiClient} analytics={createAnalytics()} platform="ios" getCaptchaToken={getCaptchaToken} />);

    fireEvent.change(await screen.findByLabelText('手机号'), { target: { value: '+8613800138000' } });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));

    expect(await screen.findByText('需要完成行为验证后再发送验证码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '获取验证码' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '已完成验证，重新发送' }));

    await waitFor(() => expect(getCaptchaToken).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(startOtp).toHaveBeenLastCalledWith({ phone: '+8613800138000', region: 'CN', captcha_token: 'captcha-from-provider' }),
    );
  });

  it('clears stale OTP state when phone changes', async () => {
    const apiClient = createApiClient();
    render(<LoginScreen apiClient={apiClient} analytics={createAnalytics()} platform="ios" />);

    fireEvent.change(await screen.findByLabelText('手机号'), { target: { value: '+8613800138000' } });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));
    await waitFor(() => expect(apiClient.startOtp).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('验证码'), { target: { value: '000000' } });
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '+8613900139000' } });

    expect(screen.getByLabelText('验证码')).toHaveValue('');
    expect(screen.getByRole('button', { name: '获取验证码' })).not.toBeDisabled();
  });

  it('reports missing or unsafe legal links without opening them', async () => {
    const openExternal = vi.fn();
    const config: AuthConfigResponse = {
      privacy_url: 'javascript:alert(1)',
      user_agreement_url: '',
      enabled_methods: [{ id: 'phone', label: '手机号', type: 'phone', enabled: true }],
      ios_equal_weight_order: ['phone'],
      captcha: { provider: 'tencent', mode: 'off' },
    };
    const apiClient = createApiClient({
      getConfig: vi.fn(async () => config),
    });
    render(<LoginScreen apiClient={apiClient} analytics={createAnalytics()} platform="ios" openExternal={openExternal} />);

    await screen.findByRole('button', { name: '手机号' });
    fireEvent.click(screen.getByRole('button', { name: '隐私政策' }));
    expect(await screen.findByText('合规链接配置异常，请稍后再试')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '用户协议' }));
    expect(await screen.findByText('合规链接加载中，请稍后再试')).toBeInTheDocument();
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('keeps the user on login when session verification expires after OTP success', async () => {
    const apiClient = createApiClient({
      getCurrentUser: vi.fn(async () => {
        const error = new Error('unauthorized') as Error & { status: number; code: string };
        error.status = 401;
        error.code = 'AUTH_REQUIRED';
        throw error;
      }),
    });
    const onAuthenticated = vi.fn();

    render(<LoginScreen apiClient={apiClient} analytics={createAnalytics()} platform="ios" onAuthenticated={onAuthenticated} />);

    fireEvent.change(await screen.findByLabelText('手机号'), { target: { value: '+8613800138000' } });
    fireEvent.change(screen.getByLabelText('验证码'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('登录状态已失效，请重新获取验证码')).toBeInTheDocument();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
