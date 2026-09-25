import { describe, expect, it, vi } from 'vitest';
import { sanitizeAnalyticsEvent, telemetryDictionary } from './dictionary';
import { trackAnalytics } from '../auth/analytics';

describe('versioned telemetry value boundary', () => {
  it('validates fields within the event, including private strings hidden under allowed keys', () => {
    expect(sanitizeAnalyticsEvent('auth_otp_verify_fail', { method: 'phone', reason_code: 'AUTH_OTP_INVALID', phone: 'private' })?.props).toEqual({ method: 'phone', reason_code: 'AUTH_OTP_INVALID' });
    expect(sanitizeAnalyticsEvent('auth_otp_verify_fail', { method: 'phone', reason_code: 'https://private.example/?token=private' })?.props).toEqual({ method: 'phone' });
    expect(sanitizeAnalyticsEvent('auth_method_tap', { method: '13800138000' })).toBeNull();
  });
  it('rejects unknown events, prototype names, nested data, getters and invalid counts without invoking user code', () => {
    for (const name of ['constructor', '__proto__', 'private-event']) expect(sanitizeAnalyticsEvent(name, {})).toBeNull();
    const getter = vi.fn(() => 'phone'); const props = Object.defineProperty({}, 'method', { get: getter });
    expect(sanitizeAnalyticsEvent('auth_method_tap', props)).toBeNull(); expect(getter).not.toHaveBeenCalled();
    expect(sanitizeAnalyticsEvent('library_candidate_open', { candidate_count: { private: 'payload' } })?.props).toEqual({});
    for (const count of [-1, 1.5, Infinity, 13800138000, '5']) expect(sanitizeAnalyticsEvent('library_candidate_open', { candidate_count: count })?.props).toEqual({});
    expect(sanitizeAnalyticsEvent('library_candidate_open', { candidate_count: 0, item_id: 'private' })?.props).toEqual({ candidate_count: 0 });
  });
  it('does not emit obsolete or unobserved success metrics and does not double-map names', () => {
    for (const event of ['settings_byok_save_success', 'plan_hq_adopt', 'plan_seed_reset', 'feedback_submit_success', 'home_ingest_start']) expect(sanitizeAnalyticsEvent(event, {})).toBeNull();
    const sink = { track: vi.fn() }; trackAnalytics(sink, 'home_view', { source_page: 'home', url: 'private' });
    expect(sink.track).toHaveBeenCalledExactlyOnceWith('home_view', { source_page: 'home' });
    expect(telemetryDictionary.home_view.stage).toBe('S0');
  });
  it('contains sink exceptions and refuses exotic or oversized property objects', () => {
    const sink = { track: vi.fn(() => { throw new Error('sink outage'); }) };
    expect(() => trackAnalytics(sink, 'home_view', { source_page: 'home' })).not.toThrow();
    expect(sanitizeAnalyticsEvent('home_view', Object.assign(Object.create({ source_page: 'home' }), {}))).toBeNull();
    expect(sanitizeAnalyticsEvent('home_view', Object.fromEntries(Array.from({ length: 40 }, (_, n) => [String(n), 'private'])))).toBeNull();
  });
});

it('uses actual domain enums for login, Library, undo and account task status', () => {
  for (const [name, props] of [
    ['auth_method_tap', { method: 'apple', type: 'third_party' }],
    ['library_select', { locate_status: 'resolved', selected: true }],
    ['undo_apply', { source: 'recent', kind: 'move_day', result: 'success' }],
    ['account_export_start', { task_status: 'in_progress' }],
  ] as const) expect(sanitizeAnalyticsEvent(name, props)?.props).toEqual(props);
});
