/** First-use dictionary. Runtime delivery still requires a consent-gated, verified host sink. */
export const telemetrySchemaVersion = 'nomad.telemetry.v1' as const;
type Value = string | number | boolean;
type Rule = (value: unknown) => value is Value;
type Definition = Readonly<{ stage: 'S0' | 'S1' | 'S2' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | null; emitter: 'client'; boundary: string; fields: Readonly<Record<string, Rule>>; required: readonly string[] }>;
const oneOf = (...values: readonly string[]): Rule => (value): value is string => typeof value === 'string' && values.includes(value);
const count: Rule = (value): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 10000;
const positive: Rule = (value): value is number => count(value) && typeof value === 'number' && value > 0;
const operation = oneOf('replace', 'move_day', 'retime', 'delete');
const boolean: Rule = (value): value is boolean => typeof value === 'boolean';
const method = oneOf('phone', 'apple', 'wechat');
const source = oneOf('home_input', 'home_card', 'library', 'uploaded_inspiration', 'user_selected');
const reason = oneOf('AUTH_REQUIRED', 'AUTH_PARAMS_INVALID', 'AUTH_REGION_UNSUPPORTED', 'AUTH_CAPTCHA_FAILED', 'AUTH_CAPTCHA_UNAVAILABLE', 'AUTH_CAPTCHA_REPLAY',
  'AUTH_PROVIDER_RATE_LIMITED', 'AUTH_PROVIDER_UNAVAILABLE', 'AUTH_SEND_REJECTED', 'AUTH_SEND_RESULT_UNKNOWN', 'AUTH_SEND_IN_PROGRESS', 'AUTH_RATE_LIMITED',
  'AUTH_OTP_ATTEMPTS_EXCEEDED', 'AUTH_OTP_EXPIRED', 'AUTH_OTP_INVALID', 'AUTH_OTP_RETRY_LATER', 'AUTH_OTP_VERIFICATION_IN_PROGRESS', 'AUTH_CONTEXT_CHANGED',
  'AUTH_ACCOUNT_UNAVAILABLE', 'AUTH_AUTHORITY_UNAVAILABLE', 'AUTH_IDEMPOTENCY_CONFLICT', 'AUTH_LOGIN_INTENT_EXPIRED', 'AUTH_SESSION_EXPIRED', 'AUTH_CONFIGURATION_INVALID');
const define = (stage: Definition['stage'], boundary: string, fields: Record<string, Rule>, required: string[] = []): Definition =>
  Object.freeze({ stage, emitter: 'client', boundary, fields: Object.freeze(fields), required: Object.freeze(required) });
export const telemetryDictionary = Object.freeze({
  auth_view: define(null, 'login-surface-visible', { source_page: oneOf('login') }, ['source_page']),
  auth_method_tap: define(null, 'explicit-method-selection', { method, type: oneOf('phone', 'third_party') }, ['method']),
  auth_otp_start: define(null, 'otp-send-receipt-or-error', { result: oneOf('captcha_required', 'sent', 'unknown', 'fail'), provider: oneOf('aliyun-pnvs', 'tencent'), reason_code: reason }, ['result']),
  auth_otp_verify_success: define(null, 'verified-authentication-receipt', { method }, ['method']),
  auth_otp_verify_fail: define(null, 'observed-verification-error', { method, reason_code: reason }, ['method']),
  auth_privacy_open: define(null, 'legal-link-open-request', { source_page: oneOf('login') }, ['source_page']),
  auth_terms_open: define(null, 'legal-link-open-request', { source_page: oneOf('login') }, ['source_page']),
  home_view: define('S0', 'home-surface-visible', { source_page: oneOf('home') }, ['source_page']),
  home_segment_tap: define('S0', 'explicit-segment-selection', { segment: oneOf('plan', 'library') }, ['segment']),
  home_input_submit: define('S0', 'explicit-input-confirmation', {}),
  home_input_classified: define('S0', 'classification-receipt', { classification: oneOf('xhs_link', 'trip_request', 'unknown'), link_count: count, unrecognized_count: count }, ['classification']),
  ingest_job_created: define('S1', 'created-command-receipt-not-terminal', { disposition: oneOf('created'), attempt: positive }, ['disposition', 'attempt']),
  ingest_presented: define('S1', 'actual-completion-render-not-background-terminal', { attempt: positive, stored_count: positive }, ['attempt', 'stored_count']),
  import_record_opened: define('S1', 'actual-result-view-not-download-or-save', { partial: boolean }),
  library_city_tap: define('S0', 'explicit-library-filter', { count }),
  library_select: define('S0', 'explicit-library-selection', { locate_status: oneOf('resolved', 'pending'), selected: boolean }),
  library_candidate_open: define('S0', 'candidate-open-request', { candidate_count: count }),
  planner_handoff: define('S0', 'local-planning-handoff-not-job-creation', { source, selected_count: count }),
  confirm_open: define('S2', 'legacy-confirm-view', { source, selected_count: count }),
  confirm_continue: define('S2', 'explicit-legacy-confirm-continue', { source, selected_count: count }),
  picker_open: define('S4', 'picker-view', { source, selected_count: count }),
  picker_add_inspiration: define('S4', 'explicit-picker-selection', { source }),
  picker_remove_inspiration: define('S4', 'explicit-picker-removal', { source }),
  picker_generate_skeleton: define('S5', 'explicit-legacy-planning-request-not-acceptance', { selected_count: count, candidate_count: count, hard_time_hint_count: count }),
  plan_start: define('S6', 'legacy-planning-acceptance-not-completion', {}),
  plan_quick_ready: define('S6', 'legacy-quick-terminal-not-current-mvp-completion', { placed_count: count, remaining_count: count }),
  skeleton_slot_edit: define('S8', 'legacy-edit-receipt-not-current-revision-validation', { operation_kind: operation, result: oneOf('success', 'failure') }, ['operation_kind', 'result']),
  undo_toast_show: define('S7', 'undo-affordance-visible-not-undone', { kind: operation }),
  undo_apply: define('S8', 'legacy-undo-receipt', { kind: operation, source: oneOf('toast', 'recent'), result: oneOf('success', 'failure') }),
  settings_view: define(null, 'settings-surface-visible', { source_page: oneOf('settings') }, ['source_page']),
  account_export_start: define(null, 'export-task-acceptance-not-file-delivery', { task_status: oneOf('queued', 'in_progress', 'done', 'failed') }),
  account_delete_start: define(null, 'delete-task-acceptance-not-erasure', { task_status: oneOf('queued', 'in_progress', 'done', 'failed') }),
  feedback_open: define(null, 'feedback-host-open-request-not-submission', { source_page: oneOf('settings'), mode: oneOf('webview', 'fallback_form') }),
  feedback_submit_fail: define(null, 'feedback-host-or-form-error', { source_page: oneOf('settings'), mode: oneOf('webview', 'fallback_form'), error_code: oneOf('OPEN_FAILED', 'LINK_FAILED', 'EMPTY', 'SUBMIT_OPEN_FAILED') }),
});
export type TelemetryEventName = keyof typeof telemetryDictionary;
export type SafeTelemetryEvent = { name: TelemetryEventName; stage: Definition['stage']; props: Record<string, Value> };
// Historical emitters remain source-compatible while these metrics are explicitly disabled.
export const disabledTelemetryEvents = Object.freeze(['home_ingest_start', 'settings_byok_save_success', 'settings_byok_save_fail', 'settings_byok_delete',
  'plan_hq_state', 'plan_hq_adopt', 'plan_hq_failure', 'plan_seed_undo', 'plan_seed_reset', 'seed_block_edit',
  'feedback_submit_success'] as const);

export function sanitizeAnalyticsEvent(name: unknown, props: unknown = {}): SafeTelemetryEvent | null {
  try {
    if (typeof name !== 'string' || !Object.hasOwn(telemetryDictionary, name) || !props || typeof props !== 'object' || Array.isArray(props)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(props)) || Reflect.ownKeys(props).length > 32) return null;
    const definition = telemetryDictionary[name as TelemetryEventName], safe: Record<string, Value> = {};
    for (const [key, rule] of Object.entries(definition.fields)) {
      const descriptor = Object.getOwnPropertyDescriptor(props, key);
      if (descriptor && Object.hasOwn(descriptor, 'value') && rule(descriptor.value)) safe[key] = descriptor.value;
    }
    if (!definition.required.every((key) => Object.hasOwn(safe, key))) return null;
    return { name: name as TelemetryEventName, stage: definition.stage, props: safe };
  } catch { return null; }
}
