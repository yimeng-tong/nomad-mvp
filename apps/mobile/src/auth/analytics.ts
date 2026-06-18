export type AuthEventName =
  | 'auth_view'
  | 'auth_method_tap'
  | 'auth_otp_start'
  | 'auth_otp_verify_success'
  | 'auth_otp_verify_fail'
  | 'auth_privacy_open'
  | 'auth_terms_open'
  | 'home_view'
  | 'home_segment_tap'
  | 'home_input_submit'
  | 'home_input_classified'
  | 'home_ingest_start'
  | 'library_city_tap'
  | 'library_select'
  | 'library_candidate_open'
  | 'planner_handoff';

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
  'confidence',
  'distance',
  'duration',
  'rawurl',
  'rank',
  'rating',
  'score',
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
  'url',
  'xhsurl',
]);

function normalizeAnalyticsKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function sanitizeAnalyticsProps(props: AnalyticsProps = {}) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => {
      const normalized = normalizeAnalyticsKey(key);
      return !blockedKeys.has(normalized) && !/(confidence|distance|duration|score|rank|rating)/i.test(normalized);
    }),
  ) as AnalyticsProps;
}

export function createNoopAnalytics(): Analytics {
  return {
    track: () => undefined,
  };
}
