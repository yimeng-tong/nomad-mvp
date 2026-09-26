import { sanitizeAnalyticsEvent, type TelemetryEventName } from '../telemetry/dictionary';
export type AuthEventName = TelemetryEventName
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
  | 'confirm_open'
  | 'confirm_continue'
  | 'picker_open'
  | 'picker_add_inspiration'
  | 'picker_remove_inspiration'
  | 'picker_generate_skeleton'
  | 'plan_start'
  | 'plan_quick_ready'
  | 'plan_hq_state'
  | 'plan_hq_adopt'
  | 'plan_hq_failure'
  | 'plan_seed_undo'
  | 'plan_seed_reset'
  | 'skeleton_slot_edit'
  | 'undo_toast_show'
  | 'undo_apply'
  | 'seed_block_edit'
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
  /** Stable producer identity. Presence does not certify an SDK or query connection. */
  trackWithId?: (event: AuthEventName, props: unknown, eventId: string) => void;
};

/** Event-aware validation also applies to explicitly injected component sinks. */
export function trackAnalytics(analytics: Analytics, event: AuthEventName, props: unknown = {}) {
  const safe = sanitizeAnalyticsEvent(event, props); if (!safe) return;
  try { analytics.track(safe.name, safe.props); } catch { /* Telemetry never changes domain work. */ }
}

export function createNoopAnalytics(): Analytics {
  return {
    track: () => undefined,
  };
}
