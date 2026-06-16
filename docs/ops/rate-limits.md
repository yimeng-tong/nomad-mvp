# Rate Limits, Security, and Degrade Switches (v1.0)

## Principles
- Protect core flows from abuse while keeping ACK/TTFU fast.
- Layered limits: by user, IP, device; plus global concurrency guards.
- Idempotency on write endpoints to reduce duplicates and retries.

## Endpoint Limits (defaults)

| Endpoint         | Dimension         | Limit        | Notes |
|------------------|-------------------|-------------:|------|
| /auth/otp        | phone+ip          | 5/hour, 10/day | Captcha gate on threshold |
| /ingest/start    | user              | 30/day       | Idempotent via source_hash |
| /plan/generate   | user              | 60/day       | Concurrency 1 per user |
| /plan/ai-fill    | user              | 10/hour      | Concurrency 1 per user |
| AI jobs (all)    | user              | 1 concurrent | Queue excess |
| /search/poi      | user              | 60/hour      | Text-only Top-5 search |
| /plans/{id}/candidates | user       | 30/day       | Manual add candidate |
| /plan/days/{day}/hotel | user       | 30/day       | Set hotel display slot |
| /plan/slots/{slot}/overrides | user | 120/hour     | Light edit text |

## Free Quotas & BYOK (v0.3)
- Export: first 10 exports free per user.
- Ingest bonus: each successful `/ingest/start` (+parse OK) adds +1 free export.
- Education gates: when free_exports ≤ 3, show ingest education; when free_exports == 0, show BYOK setup.
- Default billing path: platform quota first; BYOK optional for heavy users.

Burst protection (additional):
- IP: ingest 10/min; generate 10/min; otp 3/min.
- Device fingerprint: mirror IP limits.

## SSE
- Server idle timeout: 30s.
- Keep-alive: send `ping` ≤10s (contains seq, heartbeat_ms).
- Client retry backoff: 1s → 2s → 4s (±20%), max 3.

## Idempotency & TTL
- /ingest/start → `source_hash` unique, TTL ≥ 24h.
- /plan/generate → hash(user_id, city, start_date, days, sorted(selected_items)) TTL 10m; `force=true` to bypass.

## Degrade Switches (Unleash/OpenFeature)
- map.overlays: disable reachability rings / heat circles.
- candidates.topk: 10 → 5.
- ai.concurrent: 3 → 1.
- picker.weakened: list-only mode when map unstable.

## Security Notes
- BYOK: KMS CMK + Envelope; never log key material; redact in Sentry/Langfuse.
- Rate-limit responses: 429 with `Retry-After` and error envelope.
- Abuse signals: IP reputation, device mismatch, OTP failures → captcha pre-gate.

## Env (example)
## Captcha Gating (Login/OTP)
- Triggers: IP/设备指纹失败计数、OTP 频率超阈、可疑号段/黑名单
- Behavior: 返回 429 + `Retry-After` 或 `captcha_required=true`（在 `/auth/otp/start` 响应体）
- Flags:
  - `captcha.enabled` (default on)
  - `captcha.ip_failures_threshold` (e.g., 3/min)
  - `captcha.otp_daily_threshold` (e.g., 10/day)
  - `captcha.device_failures_threshold`
  - `captcha.burst_window_ms`
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_INGEST_PER_USER_PER_DAY=30
RATE_LIMIT_GENERATE_PER_USER_PER_DAY=60
RATE_LIMIT_FILL_PER_USER_PER_HOUR=10
AI_USER_CONCURRENCY=1
SSE_IDLE_TIMEOUT_MS=30000
SSE_HEARTBEAT_MS=10000
```
