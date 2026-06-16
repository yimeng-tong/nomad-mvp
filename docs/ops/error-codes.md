# Error Codes Catalog (v1.0)

Unified envelope:
```
{ "error_code": "PLAN_EDIT_CONFLICT", "error_message": "...", "retriable": false, "details": {..} }
```

## Namespaces
- AUTH_* (OTP, captcha, session)
- SESSION_* (revocation/expiry)
- INGEST_* (source, parse, timeout)
- PLAN_* (params, conflicts)
- FILL_* (validation, quota)
- EXPORT_* (render, fallback)
- RATE_* (rate limits)

## Canonical List
- AUTH_OTP_INVALID (400)
- AUTH_OTP_EXPIRED (400)
- AUTH_RATE_LIMITED (429)
- AUTH_CAPTCHA_REQUIRED (400)
- AUTH_SESSION_EXPIRED (401)
- AUTH_SESSION_REVOKED (401)
- AUTH_DEVICE_MISMATCH (401)
- INGEST_SOURCE_UNAVAILABLE (502)
- INGEST_PARSE_FAILED (502)
- INGEST_TIMEOUT (504)
- PLAN_PARAMS_INVALID (400)
- PLAN_CONFLICT_HARD (409)
- PLAN_EDIT_CONFLICT (409)
- FILL_VALIDATION_TOO_LONG (400)
- FILL_VALIDATION_MISSING_DO (400)
- FILL_QUOTA_EXCEEDED (429)
- EXPORT_RENDER_FAILED (500)
- EXPORT_FALLBACK_TO_JPEG (200)
- RATE_LIMITED (429)

## SSE Mapping
- `event:error` with same envelope; include `trace_id`, `ts` (ms).
