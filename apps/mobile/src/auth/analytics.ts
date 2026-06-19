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
  | 'planner_handoff'
  | 'settings_view'
  | 'settings_byok_save_success'
  | 'settings_byok_save_fail'
  | 'settings_byok_delete'
  | 'account_export_start'
  | 'account_delete_start'
  | 'feedback_open'
  | 'feedback_submit_success'
  | 'feedback_submit_fail';

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
  'content',
  'cookie',
  'feedback',
  'feedbackbody',
  'feedbacktext',
  'key',
  'message',
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
      return !blockedKeys.has(normalized) && !/(apikey|byok|confidence|distance|duration|feedback|score|rank|rating|secret|token|url)/i.test(normalized);
    }),
  ) as AnalyticsProps;
}

export function createNoopAnalytics(): Analytics {
  return {
    track: () => undefined,
  };
}
