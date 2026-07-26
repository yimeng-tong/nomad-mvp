# Story Validation Report: Story 2.1

Generated: 2026-07-26
Workflow: BMAD 6.8 create-story checklist

## Result

PASS - ready-for-dev

## Scope And Traceability

- The story implements Epic 2 Story 2.1 only: durable Quick planning, optional HQ background planning, plan presentation, candidates, hard-time/hotel constraints, and seed controls.
- Story 2.2 editing, Story 2.3 fix workflows, Story 2.4 export, multi-city transport, hotel auto-replanning/history, cross-user ingest deduplication, and BYOK are explicitly excluded.
- Acceptance criteria trace to the synchronized PRD FR7, FR27.1, FR30-FR36.1, FR41, FR44-lite; Epic 2; UX; architecture; and Epic 2 tech spec.

## Context Quality Checks

- Current code reality is named: `/plan/generate` and plan SSE are placeholders, HQ endpoints are OpenAPI-only, and Prisma lacks job/version/origin/hotel/unresolved concepts.
- Story 2.0 review fixes are a required baseline and their L2/L3, hotel, hard-time, weak-network, validation, and AMap lessons are carried forward.
- Reuse targets and likely file areas are explicit, preventing a duplicate Fastify app, frontend shell, planner data source, generated type source, or persistence stack.
- OpenAPI SSOT, NodeNext imports, generated types, Prisma migration expectations, auth/ownership, atomic idempotency, durable job state, SSE cleanup, privacy, and honest provider failure are mandatory guardrails.
- Selected L3 semantics are unambiguous: selected means `selected_required`; unplaceable required anchors become typed unresolved items; L2 is never selectable.
- Canonical Planner geography is server-owned: the story requires persisted coordinates, verification/provenance, and L1/L2 membership instead of trusting client display grouping.
- Client item/POI/hotel references are explicitly untrusted and must be re-resolved with user ownership and server-side provider verification; pending-location items remain typed unresolved/location-required entries rather than failing the whole plan.
- Reservation/ticket and special-time behavior uses an evidence-backed constraint contract rather than overloading the coarse `time_hint`.
- Hotel behavior is unambiguous: per-date, optional, breakfast as child data, no silent hotel choice, and no Post-MVP auto-replanning.
- The server is the sole automatic HQ starter and exposes `hq_job_id`; the explicit start endpoint is limited to manual start/retry.
- Empty-slot writing is limited to revision-checked candidate fill and free activity; general slot mutations remain Story 2.2.
- SSE success and failure have distinct, mutually exclusive terminal contracts.
- User-facing copy restrictions are explicit and separate from internal compatibility terminology.

## Testability Checks

- Every AC has corresponding unit, integration, mobile, contract, build, or visual verification.
- Concurrency, reconnect, disconnect cleanup, ownership, deterministic output, hard constraints, candidate deduplication, fallback honesty, HQ failure/adoption, and version preservation have explicit tests.
- Migration validation is required without falsely claiming a live database application when PostgreSQL is unavailable.
- Required completion commands are included and use the existing pnpm workspace scripts.

## Non-Blocking Implementation Notes

- The exact production job runner may use the existing BullMQ/Redis direction or a repository-consistent durable alternative, but the HTTP/SSE contract and durable terminal state are mandatory.
- A deterministic in-memory repository/HQ adapter is acceptable only for tests.
- Full Xiaohongshu supplemental search may be unavailable in the baseline; the resolution pipeline must expose provider absence honestly and continue to AMap or `requires_user_input`.
- The `ready-for-dev` publication gate is this delivery PR merging to `main` with Story 2.0 review fixes and the 45-test baseline intact.
