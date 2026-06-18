export type AuthEventName =
  | 'auth_view'
  | 'auth_method_tap'
  | 'auth_otp_start'
  | 'auth_otp_verify_success'
  | 'auth_otp_verify_fail'
  | 'auth_privacy_open'
  | 'auth_terms_open';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export type Analytics = {
  track: (event: AuthEventName, props?: AnalyticsProps) => void;
};

const blockedKeys = new Set([
  'apikey',
  'authcode',
  'authorization',
  'authheader',
  'byok',
  'captchatoken',
  'code',
  'cookie',
  'key',
  'otp',
  'password',
  'phone',
  'phonenumber',
  'secret',
  'session',
  'sessionid',
  'sid',
  'smsotp',
  'token',
]);

function normalizeAnalyticsKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function sanitizeAnalyticsProps(props: AnalyticsProps = {}) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !blockedKeys.has(normalizeAnalyticsKey(key)))) as AnalyticsProps;
}

export function createNoopAnalytics(): Analytics {
  return {
    track: () => undefined,
  };
}
