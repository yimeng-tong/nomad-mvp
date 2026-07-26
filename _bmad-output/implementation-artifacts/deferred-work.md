# Deferred Work

## Deferred from: code review of 2-0-confirm-and-planner-picker (2026-07-26)

- Add `authGuard` and ownership checks to the legacy `PATCH /plan/slots/:slotId` placeholder before it performs real mutations. This endpoint was already unauthenticated at the Story 2.0 baseline.
- Make `/plan/generate` idempotency reservation atomic so concurrent identical requests cannot both create jobs. The check/store race predates Story 2.0.
- Retain and cancel the recursive plan-SSE phase timeout after connection close. The timer lifecycle issue predates Story 2.0.

Story 2.1 owns these three plan-route items because it replaces the placeholders with real persistent behavior.

## Deferred ingest/storage design gap (confirmed 2026-07-26)

- Cross-user duplicate Xiaohongshu uploads are not currently deduplicated. The existing source hash includes `userId`, so it provides same-user URL idempotency rather than shared-content reuse.
- Media `sha256` is not yet documented and implemented as a privacy-safe, object-level cross-user storage deduplication contract.
- Create a dedicated ingest/storage story before claiming cross-user content or media deduplication. Story 2.1 only deduplicates planning candidates by canonical AMap POI.
