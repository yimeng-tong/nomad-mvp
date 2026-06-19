# Analytics & Telemetry (MVP v0.3-light)

## Event Naming
- Namespace: APP_* (front), API_* (server). Use snake_case for properties.

## Core Events (front-end)
- APP_SEARCH_POI
  - props: { city, q, result_count, topk, latency_ms, success }
- APP_CANDIDATE_ADD
  - props: { plan_id, source: search|manual, poi_id, success }
- APP_SLOT_OVERRIDES_SET
  - props: { plan_id, slot_id, fields: [do|prepare|notice], chars_total }
- APP_SLOT_OVERRIDES_CLEAR
  - props: { plan_id, slot_id }
- APP_HOTEL_SET
  - props: { plan_id, day, hotel_poi_id }
- APP_RESULT_EXPORT
  - props: { plan_id, files_count, format, total_ms }
- APP_CHECKED_TOGGLE
  - props: { plan_id, slot_id, checked }

### Navigation & UI
- APP_TOP_SWITCH_CLICK
  - props: { tab: plan|library }
- APP_DRAWER_OPEN / APP_DRAWER_CLOSE
  - props: { source_page }
- APP_DRAWER_NAV_CLICK
  - props: { to_page }
- APP_RECENT_PLAN_OPEN
  - props: { plan_id, status: done|draft }

### Input & Disambiguation
- APP_INPUT_DISAMBIG_VIEW
  - props: { from: home_input, options: xhs|nl }
- APP_INPUT_DISAMBIG_SELECT
  - props: { choice: xhs|nl }

### Skeleton SSE UI
- APP_SKELETON_SSE_UI
  - props: { mode: breadcrumb|toast }
- APP_SSE_RECONNECT
  - props: { stream: ingest|plan|fill, attempts, success }

### AI Fill Citations
- APP_AI_CITATION_OPEN
  - props: { plan_id, slot_id, source: amap|official|ugc }
- APP_AI_CITATION_MISSING
  - props: { plan_id, slot_id }

### AI Quota & Exports
- APP_AI_QUOTA_WARNING_SHOW
  - props: { from_page: resultsheet|settings|aifill, reason: low|exhausted|queued|degraded }
- APP_AI_QUOTA_RETRY_CLICK
  - props: { from_page, reason }
- APP_AI_QUOTA_DEGRADE_ACCEPT
  - props: { from_page, mode: low_cost|no_ai }

### Search & Manual Add
- APP_SEARCH_POI_MANUAL_ADD
  - props: { plan_id, has_address, geocode_success }

### Hotel
- APP_HOTEL_AUTOSET
  - props: { plan_id, day, reason: single_candidate, undo: true|false }

- APP_FEEDBACK_OPEN
  - props: { source_page, method: webview|browser|fallback_form, product_id, login_enabled, network, ua }
- APP_FEEDBACK_SUBMIT
  - props: { method, length_chars, has_screenshot, product_id }
- APP_FEEDBACK_SUCCESS
  - props: { method, product_id, latency_ms }
- APP_FEEDBACK_FAIL
  - props: { method, product_id, error_code, http_status, latency_ms }

## Server Metrics (API)
- API_SEARCH_POI_COUNT, API_SEARCH_POI_LATENCY_MS
- API_OVERRIDES_PATCH_COUNT, API_OVERRIDES_PATCH_LATENCY_MS
- API_RESULT_SHEET_READ_COUNT
- API_EXPORT_COUNT, API_EXPORT_LATENCY_MS
 - API_FEEDBACK_LINK_COUNT, API_FEEDBACK_LINK_LATENCY_MS, API_FEEDBACK_LINK_ERROR_COUNT

## SSE Monitoring
- anchors_ready: count, delay_ms since plan started
- result_sheet_updated: count, source (ai|override)
 - reconnects: stream (ingest|plan|fill), attempts, success

## Correlation & Tracing
- Include X-Trace-Id across API + SSE + export; log user_id, plan_id, slot_id where applicable. For feedback events, include source_page and method.

## Dashboards
- Funnel: search → add candidate → skeleton edit → ai fill → result sheet → export
- Quality: conflict_rate, seed_accept_rate, override_adoption_rate
- Performance: plan_ttfu_ms, fill_ttfu_ms, export_ms
 - Feedback: open → submit → success/fail (split by method webview|browser|fallback_form)
