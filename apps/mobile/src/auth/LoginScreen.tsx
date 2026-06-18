import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Analytics } from './analytics';
import { createNoopAnalytics, sanitizeAnalyticsProps } from './analytics';
import type { AuthApiClient, AuthConfigResponse, CurrentUserResponse, LoginMethod } from './api';
import { createAuthApiClient } from './api';
import { getDeviceFingerprint } from './device';

type Platform = 'ios' | 'android' | 'web';
type CaptchaTokenProvider = () => string | null | Promise<string | null>;

export type LoginScreenProps = {
  apiClient?: AuthApiClient;
  analytics?: Analytics;
  platform?: Platform;
  getCaptchaToken?: CaptchaTokenProvider;
  openExternal?: (url: string) => void;
  onAuthenticated?: (response: CurrentUserResponse) => void;
};

const methodLabels: Record<LoginMethod['id'], string> = {
  apple: 'Apple',
  phone: '手机号',
  wechat: '微信',
};

function detectPlatform(): Platform {
  if (/iPad|iPhone|iPod/.test(globalThis.navigator?.userAgent || '')) return 'ios';
  if (/Android/.test(globalThis.navigator?.userAgent || '')) return 'android';
  return 'web';
}

function getErrorMessage(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 401) return '登录状态已失效，请重新获取验证码';
  if (status === 429) return '请求过于频繁，请稍后再试';
  if (status === 403) return '当前登录方式暂不可用';
  return '网络暂时不可用，请稍后重试';
}

function getErrorStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : undefined;
}

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'NETWORK_ERROR';
}

function getRetryAfter(error: unknown) {
  return typeof error === 'object' && error !== null && 'retryAfterSec' in error ? Number(error.retryAfterSec) : undefined;
}

function getMethodLabel(method: LoginMethod) {
  return method.label || methodLabels[method.id] || method.id;
}

function isSafeLegalUrl(url: string) {
  return /^https?:\/\//.test(url) || (url.startsWith('/') && !url.startsWith('//'));
}

function defaultCaptchaTokenProvider() {
  return import.meta.env.DEV ? 'captcha-ok' : null;
}

function orderMethods(config: AuthConfigResponse, platform: Platform) {
  const enabled = config.enabled_methods.filter((method) => method.enabled);
  if (platform !== 'ios') return enabled;
  const order = config.ios_equal_weight_order.length > 0 ? config.ios_equal_weight_order : ['apple', 'phone', 'wechat'];
  const rank = (method: LoginMethod) => {
    const index = order.indexOf(method.id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...enabled].sort((a, b) => rank(a) - rank(b));
}

export function LoginScreen({
  apiClient,
  analytics,
  platform = detectPlatform(),
  getCaptchaToken = defaultCaptchaTokenProvider,
  openExternal,
  onAuthenticated,
}: LoginScreenProps) {
  const client = useMemo(() => apiClient ?? createAuthApiClient(), [apiClient]);
  const tracker = useMemo(() => analytics ?? createNoopAnalytics(), [analytics]);
  const [config, setConfig] = useState<AuthConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<LoginMethod['id']>('phone');
  const [phone, setPhone] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const track = useCallback(
    (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
      try {
        tracker.track(event, sanitizeAnalyticsProps(props));
      } catch {
        // Analytics must never block auth.
      }
    },
    [tracker],
  );

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    setConfigError(null);
    try {
      const nextConfig = await client.getConfig();
      if (!Array.isArray(nextConfig.enabled_methods) || !Array.isArray(nextConfig.ios_equal_weight_order)) {
        throw new Error('invalid auth config');
      }
      setConfig(nextConfig);
      setSelectedMethod((current) =>
        nextConfig.enabled_methods.some((method) => method.id === current && method.enabled)
          ? current
          : nextConfig.enabled_methods.find((method) => method.enabled)?.id ?? 'phone',
      );
    } catch {
      setConfigError('登录配置加载失败，请检查网络后重试');
    } finally {
      setLoadingConfig(false);
    }
  }, [client]);

  useEffect(() => {
    track('auth_view', { source_page: 'login' });
    void loadConfig();
  }, [loadConfig, track]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = globalThis.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [cooldown]);

  const methods = useMemo(() => (config ? orderMethods(config, platform) : []), [config, platform]);
  const phoneEnabled = methods.some((method) => method.id === 'phone');

  const openLegalLink = (kind: 'privacy' | 'terms') => {
    const url = kind === 'privacy' ? config?.privacy_url : config?.user_agreement_url;
    if (!url) {
      setNotice('合规链接加载中，请稍后再试');
      return;
    }
    if (!isSafeLegalUrl(url)) {
      setNotice('合规链接配置异常，请稍后再试');
      return;
    }
    track(kind === 'privacy' ? 'auth_privacy_open' : 'auth_terms_open', { source_page: 'login' });
    if (openExternal) {
      openExternal(url);
      return;
    }
    globalThis.open?.(url, '_blank', 'noopener,noreferrer');
  };

  const chooseMethod = (method: LoginMethod) => {
    setSelectedMethod(method.id);
    track('auth_method_tap', { method: method.id, type: method.type });
    if (method.type === 'third_party') {
      setNotice(`${getMethodLabel(method)}登录暂未开放，请先使用手机号登录`);
    } else {
      setNotice(null);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setOtp('');
    setOtpPhone('');
    setCaptchaRequired(false);
    setCooldown(0);
    setNotice(null);
  };

  const startOtp = async (captchaToken?: string) => {
    if (!phone.trim()) {
      setNotice('请输入手机号');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setNotice('请先完成行为验证');
      return;
    }
    setSubmittingOtp(true);
    setNotice(null);
    try {
      const phoneForOtp = phone.trim();
      const request = captchaToken ? { phone: phoneForOtp, region: 'CN', captcha_token: captchaToken } : { phone: phoneForOtp, region: 'CN' };
      const result = await client.startOtp(request);
      if (result.captcha_required) {
        setCaptchaRequired(true);
        setCooldown(result.retry_after_sec);
        setNotice(null);
        track('auth_otp_start', { result: 'captcha_required', provider: result.captcha_provider ?? 'tencent' });
        return;
      }
      setCaptchaRequired(false);
      setOtp('');
      setOtpPhone(phoneForOtp);
      setCooldown(result.retry_after_sec);
      setNotice('验证码已发送');
      track('auth_otp_start', { result: result.sent ? 'sent' : 'accepted' });
    } catch (error) {
      const retryAfter = getRetryAfter(error);
      if (retryAfter) setCooldown(retryAfter);
      setNotice(getErrorMessage(error));
      track('auth_otp_start', { result: 'fail', reason_code: getErrorCode(error) });
    } finally {
      setSubmittingOtp(false);
    }
  };

  const completeCaptchaAndRetry = async () => {
    if (cooldown > 0) return;
    const token = await getCaptchaToken();
    if (!token) {
      setNotice('请先完成行为验证');
      return;
    }
    await startOtp(token);
  };

  const verifyOtp = async () => {
    if (!phone.trim() || !otp.trim()) {
      setNotice('请输入手机号和验证码');
      return;
    }
    if (otpPhone && phone.trim() !== otpPhone) {
      setNotice('手机号已变更，请重新获取验证码');
      return;
    }
    setVerifying(true);
    setNotice(null);
    let currentUser: CurrentUserResponse | undefined;
    try {
      await client.verifyOtp({
        phone: phone.trim(),
        otp,
        device_fingerprint: getDeviceFingerprint(),
      });
      currentUser = await client.getCurrentUser();
      setNotice('登录成功');
      track('auth_otp_verify_success', { method: 'phone' });
    } catch (error) {
      setNotice(getErrorMessage(error));
      track('auth_otp_verify_fail', { method: 'phone', reason_code: getErrorCode(error) });
    } finally {
      setVerifying(false);
    }
    if (currentUser) onAuthenticated?.(currentUser);
  };

  return (
    <main className="login-shell" aria-labelledby="login-title">
      <section className="login-stage">
        <div className="brand-lockup">
          <div className="route-visual" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="brand-kicker">Nomad</p>
            <h1 id="login-title">把灵感变成可执行行程</h1>
          </div>
        </div>

        {loadingConfig ? <p className="status-text">正在加载登录方式</p> : null}

        {configError ? (
          <div className="inline-state" role="status">
            <p>{configError}</p>
            <button type="button" onClick={() => void loadConfig()}>
              重试
            </button>
          </div>
        ) : null}

        {methods.length > 0 ? (
          <div className="method-row" aria-label="登录方式">
            {methods.map((method) => (
              <button
                className="login-method equal-weight"
                data-method={method.id}
                data-testid="login-method"
                key={method.id}
                type="button"
                aria-pressed={selectedMethod === method.id}
                onClick={() => chooseMethod(method)}
              >
                {getMethodLabel(method)}
              </button>
            ))}
          </div>
        ) : null}

        {phoneEnabled ? (
          <form
            className="phone-form"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyOtp();
            }}
          >
            <label className="field">
              <span>手机号</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                name="phone"
                onChange={(event) => handlePhoneChange(event.target.value)}
                placeholder="+86 138 0013 8000"
                value={phone}
              />
            </label>

            <label className="field">
              <span>验证码</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={12}
                name="otp"
                onChange={(event) => setOtp(event.target.value)}
                placeholder="000000"
                value={otp}
              />
            </label>

            <div className="action-grid">
              <button type="button" disabled={cooldown > 0 || submittingOtp || captchaRequired} onClick={() => void startOtp()}>
                {cooldown > 0 ? `${cooldown}秒后重发` : '获取验证码'}
              </button>
              <button type="submit" disabled={verifying}>
                {verifying ? '登录中' : '登录'}
              </button>
            </div>
          </form>
        ) : (
          !loadingConfig && <p className="status-text">手机号登录暂不可用</p>
        )}

        {captchaRequired ? (
          <div className="inline-state" role="status">
            <p>需要完成行为验证后再发送验证码</p>
            <button type="button" disabled={submittingOtp || cooldown > 0} onClick={() => void completeCaptchaAndRetry()}>
              已完成验证，重新发送
            </button>
          </div>
        ) : null}

        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}

        <nav className="legal-links" aria-label="合规链接">
          <button type="button" onClick={() => openLegalLink('privacy')}>
            隐私政策
          </button>
          <button type="button" onClick={() => openLegalLink('terms')}>
            用户协议
          </button>
        </nav>
      </section>
    </main>
  );
}
