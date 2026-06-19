# Observability, Tracing, and Acceptance (v1.0)

## Correlation
- Frontend generates `X-Trace-Id` per request; include in HTTP headers and SSE frames.
- SSE uses `id:` and supports `Last-Event-ID` for resume.
- Backend forwards trace_id into logs, Sentry, Langfuse.

## Core User-Perceived Metrics
- ACK (HTTP accept): p95 targets per flow.
- TTFU (first SSE event): p95 ≤ 1.0s.
- Keep-alive (max gap between events): ≤ 10s; else show UI hint, auto-reconnect at 20s.

## Dashboards (by flow)
- Ingest / Generate / Fill:
  - ACK p50/p95; TTFU p50/p95; Keep-alive violations rate.
  - End-to-end p50/p95 (board-only); failure codes top-5.
  - Auto-retry rate and success lift.
- SSE health: reconnect counts, idle timeout triggers, ping loss.
- Export: render latency histograms; slice hit-rate; WebP→JPEG fallback rate.
 - Account: deletion/export queue depth; success/error counts; retry/backoff rates.
 - AI quota: quota warning/degrade events; provider fallback; cost guard trips.

## Synthetic Probes (5-min cadence)
- Script runs: ingest → generate → fill → export.
- Assert SLO windows and record trace links.
 - Account probes: export job completion (mock); delete job enqueue success.
 - Auth/AI quota: otp-start/verify round-trip, quota/degrade smoke.

## Acceptance (P0)
1) Ingest: ≤1s see created/fetching; ≤10s heartbeat; finish done.
2) Generate: ≤1s see started; ≤10s heartbeat; >60s show "仍在生成" not blocking.
3) Fill: only remaining controllable slots; text length rules enforced.
4) Export: 3-day plan returns multiple files; per-slice ≤1.5s.

## Logging & Sampling
- Structured JSON logs with trace_id, user_id (if available), endpoint, status, dur_ms.
- Sampling tuned to capture p95+/errors; include SSE stream lifecycle logs.
