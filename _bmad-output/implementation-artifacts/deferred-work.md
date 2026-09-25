# Deferred Work

## IR scope decisions (user-confirmed 2026-09-15)

- Self account merge/unlink and a new device-management center are deferred; existing login methods
  remain, with same-owner multi-device coexistence and current-session logout. New Story 1.0 owns
  the production identity/session prerequisite, without rewriting historical 1.1–1.5 completion.
- Dedicated content-moderation service integration, including mandatory Tencent review, is deferred
  by the user's source-platform scope decision. No new platform support or fabricated review result
  follows; existing file/media/schema/owner/source/untrusted-input safeguards remain.
- Additional POI merge, manual neighbor/alias/generic blacklist tools and arbitrary admin bulk job
  reruns are deferred. Only manual place correction is retained under FR4.2/1.11; existing brand
  rules and approved 8.3–8.6 operator capabilities remain. Approved controlled retry/recovery remains.
- Travel-time reachability and photo-heat map layers are deferred; current map/card interaction and
  explicit candidate placement are retained. Do not restore old main-flow Hero/two-column drafts.
- Source: `_bmad-output/planning-artifacts/ir-resolution-decisions-2026-09-15.md`.

## Deferred check-in and future photo-based travel memories (confirmed 2026-09-06)

- Story 7.2 manual per-POI check/uncheck is excluded from MVP by explicit user decision. Keep its
  number as deferred, not done; do not implement its controls, visit schema or status API. AR16 is
  deferred with this scope, not an unresolved current-MVP gate or a completed implementation.
- The user wants later photo-based recognition using authorized album photos and available stored
  geolocation, automatically showing checked-in marks for photo-evidenced places. Later outputs may
  include album videos, nine-grid collages and AI image beautification. This is PRD FR40.1, a future
  direction requiring a new design review, not automatic approval of the old manual story.
- Permissions/photo selection, geographic evidence and missing metadata, repeated visits and false
  matches, correction, processing/storage/deletion boundaries, costs and formats remain undecided.
  No present album access, photo upload, background location or external-model transmission for
  travel-media/check-in processing is authorized. This does not exclude FR45's one explicitly
  selected feedback screenshot; that route cannot scan albums or create visit marks. Absence of
  a photo cannot by itself prove a place was not visited.
- MVP remains focused on itinerary planning and user-confirmed on-trip adjustment/replanning.
  Recent-trip recovery and existing city/trip long-image exports remain. Meal recall uses one
  foreground fix or explicit planned-POI/static-pool fallback, with no check-in dependency.
- Decision: `_bmad-output/planning-artifacts/check-in-scope-decision-2026-09-06.md`.
  Old Story 7.2 draft and both boards are retained as non-MVP exploration, not visual authority.

## Deferred feedback enhancements (confirmed Story 7.6, 2026-09-07)

- External SSO/custom login, upstream custom metadata, WeChat reply notifications, Webhooks,
  third-party feedback pulls, feedback history/conversations and SLA need later design.
- Current delivery is private first-party persistence, a real receipt and authorized maintainer
  retrieval. None requires an external forwarder or a new customer-service dashboard.
- No feedback-to-email/Telegram notifier is added. The separate Epic 8 AI/AMap irrecoverable-error
  operator alert remains in MVP scope and is not deferred by this feedback boundary.

## Deferred from: code review of 2-0-confirm-and-planner-picker (2026-07-26)

- Add `authGuard` and ownership checks to the legacy `PATCH /plan/slots/:slotId` placeholder before it performs real mutations. This endpoint was already unauthenticated at the Story 2.0 baseline.
- Make `/plan/generate` idempotency reservation atomic so concurrent identical requests cannot both create jobs. The check/store race predates Story 2.0.
- Retain and cancel the recursive plan-SSE phase timeout after connection close. The timer lifecycle issue predates Story 2.0.

Story 2.1 owns these three plan-route items because it replaces the placeholders with real persistent behavior.

## Deferred ingest/storage design gap (confirmed 2026-07-26)

- Cross-user duplicate Xiaohongshu uploads are not currently deduplicated. The existing source hash includes `userId`, so it provides same-user URL idempotency rather than shared-content reuse.
- Media `sha256` is not yet documented and implemented as a privacy-safe, object-level cross-user storage deduplication contract.
- Correct Course keeps `user_id + normalized_url` as the MVP record/privacy boundary in Story 1.6. Create a later dedicated storage story before claiming cross-user compute/media reuse; shared fingerprints must never expose another user's record or annotations.

## Accepted Home import UX follow-up (updated 2026-08-12)

- `story-1-4-home-import-queue-r4.png` is the current queue direction; `story-1-4-home-hybrid-r3.png` remains the earlier Home baseline. `docs/ux/home-import-dock.md` is the behavior contract.
- Current `HomeScreen` starts ingest and shows a notice, but does not yet render the SSE-driven integrated Dock, running-stage collapse/expand states, or completed summary.
- Implement this as Story 1.6 after refreshed Sprint Planning. Do not add it to Story 2.2 timeline-editing acceptance criteria.
- Keep `POST /ingest/xhs` one-link-per-job; Story 1.6 fans out multiple links, reconnects each job, serializes ten-second completion presentation, and adds owner import records.
- It must not invent cancel or percentage progress. Error/reconnect/duplicate/mixed-input states still need test or focused visual coverage before Story 1.6 closes.

## Deferred from pace, food and shopping research (confirmed 2026-08-12)

- Do not generate parallel `轻松版 / 紧凑版` initial plans in MVP. One editable plan plus typed
  local adjustment remains the current contract.
- Cross-trip preference memory, automatic learning from completed travel, companion profiles and
  post-trip pace defaults require a separate privacy/product discovery. Current InterestProfile is
  trip-scoped evidence only.
- Live queue, stock, price, delay, missed-connection and automatic rebooking claims are not MVP.
  Evidence imported from a note must retain its timestamp and cannot be presented as live state.
- Automatic `返程前 48 小时` notification and luggage-capacity monitoring remain deferred. The
  current checklist is static/manual plus confirmed AI suggestions.
- The earlier static target-to-store selection proposal (historically labeled Story 2.10, later
  Story 6.5) is superseded by the 2026-09-06 shopping scope discussion below. Real inventory,
  reservation, purchase and tax-refund automation remain deferred.

## Deferred shopping search, scheduling and contextual hints (user-directed 2026-09-06)

Story 6.5 lightweight text capture is approved. It reuses checklist text with optional label
shortcuts; it does not deliver the advanced shopping flow below.

- The user requested a later iteration for natural-language shopping goals -> automatic or
  user-assisted store search -> manually extensible candidate set -> suitable-store scheduling
  using the existing route/L2 capacity, or a contextual hint when passing a relevant buying area.
- The shopping input direction is one multiline text field with example labels and optional
  shortcuts such as `款式 / 数量 / 预算`; a shortcut inserts a newline label without blocking
  free typing. Shopping-specific date/store selection must not be a prerequisite for recording.
- This is not approval to implement a new shopping scheduler in MVP, guarantee product stock,
  request background location or replace current post-plan mutation confirmation rules.
- The user explicitly confirmed these three boundaries remain for later design: store/sales/stock
  evidence; planned-route passage versus actual arrival/location triggers; and authorization,
  explanation and undo for automatically applying a shopping addition. Their detailed policies
  are not settled by the lightweight-input approval.
- Detailed confirmed directions, proposed defaults and open questions are in
  `_bmad-output/planning-artifacts/shopping-intent-scope-review-2026-09-06.md`.
- The return-task-buffer part of the old Story 6.5 is also explicitly deferred, as recorded below;
  existing hotel/luggage/transport safety buffers are unaffected.

## Deferred checklist-to-schedule conversion (confirmed 2026-09-06)

- MVP return tasks remain Story 6.4 checklist records: create, edit, delete, complete and reopen.
  There is no checklist `预留时间` action or automatic/manual conversion command that turns a
  record into a new schedule slot. This additional workflow is deferred rather than assigned 6.6.
- Existing station/airport travel, boarding/handoff, stay changes, storage drop-off and pickup
  constraints remain in the earlier planning/validation stories. A confirmed luggage retrieval
  must not require duplicate entry through the checklist.
- A later dedicated story may define record-to-slot links, explicit placement/time preview,
  current transport/luggage deduplication, conflict handling, unlink/edit and versioned undo.
  Current generic edit APIs are not evidence that this complete workflow has been implemented.
- `story-6-5-return-task-time-preview-r1.png` is retained as deferred exploration only. It must
  not guide MVP UI or reintroduce this scope into Story 6.5.

## Deferred chain-brand presentation (confirmed 2026-08-14)

- Story 1.11 must identify the correct AMap branch and may inspect at most 20 branches when the
  source cannot determine one, but MVP does not solve how chains such as McDonald's should be
  grouped and named across Library, Picker, candidate lists, map markers and timeline cards.
- A later UX iteration should define brand-name plus branch-name formatting, same-brand grouping
  or collapsing, repeated-marker behavior, location context and the state where no exact branch is
  known. This presentation layer must preserve each branch's independent CanonicalPOI Provider ID
  and must not change planning bindings, deduplication or owner evidence semantics.

## Deferred platform Xiaohongshu search and AnchorPool cold start (confirmed 2026-08-19)

- MVP accepts and processes concrete Xiaohongshu links supplied by the user. The current adapter's
  `{ url }` download contract is not a keyword-search capability and must not be represented as one.
- The accepted placement is Post-MVP Epic 8, split into two stories: an isolated, rate-limited,
  operator-account XHS search Provider/material staging worker; then an AnchorPool gap detector and
  fill orchestrator that runs selected material through detail/media, multimodal extraction, AMap
  verification, CanonicalPOI dedupe, shared admission and atomic snapshot publication.
- `autoclaw-cc/xiaohongshu-skills` is a candidate/reference adapter, not an in-process product
  dependency: it uses a real Chrome profile, extension bridge and account session. Pin and audit any
  adopted version; cookies/challenges remain outside Nomad API, user sessions, logs and analytics.
- Search must not block initial PlanningJob completion. MVP uses owner imported/verified
  inspirations, AnchorPool/versioned city Top-50 and AMap nearby; uncertain results remain in S7
  candidates and remaining capacity becomes explicit free time.


## Deferred from: code review of story-1-6 (2026-09-19)

- 现有ingest服务进程退出的已受理任务领取/租约恢复、durable事件cursor按正式1.7承接，不重新延期产品范围；1.6只解决当前事实快照、命令回执和正常进程内的派发/重试一致性。真实部署不能把1.6回执当已完成1.7的恢复证据。
