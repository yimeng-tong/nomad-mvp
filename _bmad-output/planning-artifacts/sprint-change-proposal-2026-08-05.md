# Sprint Change Proposal: Planning-First Flow, Timeline Editing, and Import Queue

Date: 2026-08-05
Last revised: 2026-08-12
Project: nomad-mvp
BMAD workflow: bmad-correct-course
Mode: Batch
Status: Approved; planning sync and requirement-trace correction complete; implementation readiness pending
Approval: Stakeholder explicitly approved the consolidated Correct Course
proposal on 2026-08-12.

## 1. Issue Summary

High-fidelity review of Story 2.2, the accepted Story 1.4 Home direction, and
the pending Story 2.3 exposed three product changes that exceed a visual-only
revision:

1. Timeline editing must use a plan-global history/undo control, arbitrary
   minute precision for user edits, and a non-adjacent-day move path. The
   implemented Story 2.2 contract currently enforces D+/-1, 15-minute values,
   visible 30/60-minute snapping, and an active-day recent-action section.
2. Home must accept multiple pasted links as a queue while retaining one
   integrated input/import dock. Completed import summaries are presented in
   FIFO order for ten seconds each, and Library needs an owned import-record
   view with parsed POIs and access to the original link.
3. Current planning semantics underuse the now-capable planning Agent. The
   user should select required L3 POIs and let AI orchestrate the complete
   initial itinerary. Feasibility repair should primarily respond to conflicts
   introduced by later user edits, while Epic 3 enriches an already arranged
   plan with actionable content and citations.

The trigger is stakeholder review of these visual artifacts and annotated
screenshots:

- `_bmad-output/implementation-artifacts/visual/story-2-2-timeline-editing-direction-a.png`
- `_bmad-output/implementation-artifacts/visual/story-1-4-home-hybrid-r3.png`
- `_bmad-output/implementation-artifacts/visual/story-1-4-home-library-states-direction-a.png`
- `_bmad-output/implementation-artifacts/visual/story-2-3-feasibility-fixsheet-direction-a.png`
- User-provided Story 2.2 edit, Home composer, and ingest-progress references
  reviewed on 2026-08-05.

Revised proposal visuals:

- `_bmad-output/implementation-artifacts/visual/story-2-2-timeline-editing-direction-b.png`
- `_bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png`
- `_bmad-output/implementation-artifacts/visual/story-1-4-library-import-records-r1.png`
- `_bmad-output/implementation-artifacts/visual/story-2-3-post-edit-feasibility-r2.png`
- `_bmad-output/implementation-artifacts/visual/story-2-0-planning-entry-flow-r5.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-ai-planning-transition-r1.png`
- `_bmad-output/implementation-artifacts/visual/story-2-0-picker-overview-l3-r2.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-meal-slot-alternatives-r3.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-meal-flex-recall-r2.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-area-food-suggestions-r1.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-shopping-checklist-r2.png`
- `_bmad-output/implementation-artifacts/visual/story-2-1-shopping-add-record-r1.png`

## 2. Impact Analysis

### Epic Impact

- **Epic 1:** Story 1.4 remains historically done and is not rewritten. Add a
  follow-up Story 1.6 for batch-paste queue, integrated import states, source
  titles, and import records. Epic 1 temporarily returns to `in-progress` when
  Story 1.6 starts; the completed retrospective remains a historical snapshot.
- **Epic 2:** The epic goal remains valid. Story 2.0 receives a UX correction
  that removes the optional smart-planning switch. Story 2.1 becomes one
  user-visible AI-planning run that enters the timeline shell immediately;
  internal Quick fallback does not create a second version/adoption screen.
  Story 2.2 must be corrected before review/merge. Story 2.3 changes from a
  permanent pre-AI-fill gate to post-orchestration incremental validation and
  repair after user mutations. Story 2.4 keeps export, with unresolved hard
  conflicts still blocking export.
- **Epic 3:** Story 3.1 no longer arranges remaining slots. It enriches an
  already orchestrated itinerary with do/prepare/notice, why, and citations,
  without changing time or order. Stories 3.2 and 3.3 retain their scope.
- No new epic is required and no completed implementation needs rollback.

### Story 2.2 Impact

- Remove the Nomad badge, `我的计划`, and revision label from the user-facing
  header. Keep only back, `{city} · {days}天`, and the global state control.
- Replace the bottom undo toast and active-day recent-action row with one
  top-right plan-global control. Its default state is a history icon; after a
  mutation it becomes `撤销 8` and counts down to the history state.
- Keep MVP history deliberately narrow: the history state exposes only the
  one latest additional eligible undo. FR43's arbitrary timeline remains
  Post-MVP.
- Edit-sheet hierarchy becomes POI and day first, then travel time from the
  previous and to the next POI. Travel values must be server-derived and
  nullable; the UI must not invent them.
- Move controls become previous day, `移至其他`, and next day. Previous is
  disabled on D1, next is disabled on Dn, and `移至其他` is disabled when no
  non-adjacent trip day exists (for example D2 in a three-day trip).
- AI-generated placement may remain 15-minute aligned, but user retiming
  accepts every valid `HH:mm` minute. A clock/alarm-style picker shows start
  and end day labels; overnight is represented by those labels rather than a
  separate explanatory warning. Visible snap controls are removed.
- Structurally impossible edits still fail. Derived feasibility issues such as
  travel time or opening hours are handled by Story 2.3 after mutation; truly
  locked reservation/ticket evidence remains protected.

### Home and Library Impact

- The bottom surface is always one long input and one emphasis button. Empty
  state uses `+`; non-empty state animates to a paper-plane send icon.
- Exact placeholder:
  `粘贴分享链接或输入想去的地点，如：厦门 3天`.
- Multiple detected links become owned ingest jobs. `POST /ingest/xhs` remains
  single-link; the client starts and observes each job and maintains the
  foreground `N/X` presentation queue.
- Active import shows the source title with safe truncation, the current
  factual action, and no fake percentage or orange progress line. The collapse
  chevron points down in expanded state.
- Every completed item owns a full ten-second compact presentation window.
  Later completions wait in a FIFO presentation queue rather than replacing
  the currently visible result.
- Recognized-trip copy becomes `识别 厦门 3天 7月14日出发`; pace is selected
  later and is not shown in this recognition result.
- Library adds owned import records. Detail lists parsed POIs and exposes the
  original source URL only to the authenticated owner through a compact copy
  control.
- Current deduplication is per user (`user_id + normalized_url`). This remains
  the privacy boundary. A future global content fingerprint may reuse compute
  or media blobs, but must never expose one user's import record or annotations
  to another user.

### Planning Entry and Completion Impact

- Natural-language recognition remains an inline Home state. Sending a
  recognized trip enters Confirm directly; there is no recognition result page.
- Time and Accommodation retain city, dates, daily start,
  arrival/departure, per-night optional hotels, breakfast child fields, and
  luggage handling. Pace moves to the S5 planning review. Remove the
  `智能规划` switch because AI planning is now the required main path.
- Picker remains the place for `必去 / 顺路` L3 intent. L2 is never selectable;
  the full-city overview drills into L3 nearby/full-city map views and returns
  to overview before `下一步`.
- Tapping `开始规划` on S5 enters the timeline shell as soon as the job is
  accepted.
  Stable timeline placeholders and factual planning stages replace a separate
  full-screen completion or marketing loader.
- On completion, the same shell resolves into the editable timeline. The strip
  `计划已完成，可直接调整` remains until the first real insert, replace, move,
  retime, or delete. Scrolling, changing D tabs, and browsing do not dismiss it.
- There is no separate `AI 已完成编排` page and no bottom
  `完善行程细节` action on this initial timeline. Story 3.1 must design its entry
  in its own context without reintroducing a completion interstitial.

### Story 2.3 and 3.1 Impact

- Original flow: partial skeleton -> manual placement/edit -> feasibility gate
  -> AI Fill arranges remaining controllable blocks.
- New flow: select required L3 POIs -> one visible AI planning run creates a
  complete initial plan -> the same screen becomes editable -> user edits ->
  incremental validation -> repair only when needed -> enrich itinerary details
  and citations later.
- Story 2.1's planner must treat full initial orchestration as the target. The
  existing Quick implementation may remain as an internal timeout/failure
  fallback, but the MVP path does not expose Quick/HQ labels, two completed
  versions, or a switch/adopt page. The delivered result must be initially
  valid or preserve honest unresolved items.
- Story 2.3 runs after plan generation/adoption and after each relevant user
  mutation. A clean plan has no permanent validation card. A newly introduced
  conflict opens concise reorder/replace/shorten/move-day proposals.
- Hard conflicts block detail enrichment and export until fixed; soft warnings
  can continue with a visible explanation.
- Story 3.1 is renamed to `AI Itinerary Detail Enrichment, Result Sheet, and
  Citations`; it never changes slot time, date, or order.

### Artifact and Technical Conflicts

- **PRD:** FR4, FR7-FR10, FR18-FR22, FR32-FR33, FR37, NFR9-NFR10, workflow,
  MVP scope, and microcopy conflict with the new flow.
- **Epics:** Story 1.4 completion semantics, Story 2.0 smart-planning control,
  Story 2.1 output/transition target, Story 2.2 controls, Story 2.3 gate, and
  Story 3.1 arrangement ownership need edits.
- **UX:** HomeImportDock, Mobile IA timeline, component specs, FixSheet flow,
  `SmartPlanSwitch`, `HQStatusBar`, accepted visual references, and prototype
  coverage require synchronization.
- **Architecture/Tech Spec:** Planner/Validator/Filler boundaries, ingest event
  title persistence, import-record ownership, and validation timing change.
- **OpenAPI/code:** `SlotEditRequest` currently enforces 15-minute values;
  domain code limits moves to adjacent days; recent-action UI requests by day;
  `IngestEvent` lacks a source title; Library lacks import-record responses;
  `DayPlanSlot` lacks honest adjacent travel-time fields.

## 3. Recommended Approach

Recommended path: **Direct Adjustment with moderate backlog reorganization**.

1. Approve and synchronize planning artifacts before further Story 2.2 code.
2. Correct the active Story 2.2 contract and implementation on its existing
   branch; retain all safe immutable-version, ownership, idempotency, and undo
   work already completed.
3. Add Story 1.6 instead of retroactively reopening Story 1.4. Schedule it
   after Story 2.2 unless product priority explicitly moves import queue first.
4. Rewrite and create Story 2.3 from the new post-edit validation boundary.
5. Rewrite Story 3.1 before Epic 3 begins.

Rollback is not recommended: the current persistence, ownership, revision,
undo, internal planner fallback, and ingest foundations remain useful. The effort is **medium**
and risk is **medium** because contracts and tests change, but no data rollback
or fundamental architecture replacement is required.

## 4. Detailed Change Proposals

### PRD

**FR18**

OLD: only the first pasted link is queued and remaining links are rejected.

NEW: parse all valid pasted Xiaohongshu links, start one owned single-link job
per URL, show `N/X`, and serialize ten-second completion summaries in FIFO
order. Invalid fragments are reported without dropping valid links.

**FR8 / FR21**

OLD: move only D+/-1; user retiming is 15-minute stepped with visible 30/60
minute snapping; undo uses a bottom toast plus current-day recent action.

NEW: offer previous, non-adjacent other-day, and next-day move paths with
boundary disabling; user retiming has one-minute precision while Agent output
may remain 15-minute aligned; one plan-global top-right control transitions
from history to an eight-second undo countdown and back.

**FR7 / FR10 / FR22 / FR32**

OLD: generate a partially filled skeleton, let the user place/edit blocks, then
gate AI Fill, which arranges remaining controllable blocks.

NEW: one user-visible AI planning run generates the complete initial plan from
required L3 anchors and available context. The UI enters the timeline shell
while planning, resolves in place on completion, and retains a completion hint
until the first mutation. Internal deterministic fallback is allowed but does
not create a second user-visible version or adoption flow. Validation guarantees
honest initial output and reruns after manual changes. Detail enrichment adds
execution content and citations only.

**FR5 / FR19**

ADD: authenticated import records show source title, status, parsed POIs, and
the owner's original URL. Active progress may expose a persisted source title
and factual counts/actions but never a fabricated percentage.

### Epics and Stories

**Story 1.6: Home Import Queue and Import Records**

ADD acceptance for batch detection, per-link jobs, integrated composer states,
`N/X`, source-title truncation, ten-second FIFO completion presentation,
recognized-trip copy, reconnect, failure/retry, owned import records, parsed
POIs, and protected original URLs.

**Story 2.0 UX correction**

OLD: Confirm exposes a default-on `智能规划` switch and describes HQ as an
optional enhancement.

NEW: remove the switch. Time and Accommodation gather constraints, Picker
gathers `required / along_route / unselected` L3 intent and continues with
`下一步`, and S5 pace review owns the sole `开始规划` action. Full-city overview
and L3 nearby/full-city positions remain views within the same Picker.

**Story 2.1 planning transition**

OLD: Quick appears first and HQ later offers preview/switch/adopt.

NEW: expose one planning run. After the job is accepted, navigate to the stable
timeline shell; render factual planning stages there; resolve the same shell to
the editable plan. Preserve Quick only as an internal failure fallback. Show
`计划已完成，可直接调整` until the first timeline mutation, with no separate
completion page and no bottom detail-enrichment CTA.

**Story 2.2 Acceptance Criteria 1, 3, and 6**

OLD: D+/-1 only; 15-minute input; snap choices; bottom toast and day-scoped
recent action.

NEW: previous/other/next destination controls; minute-precise user time picker;
start/end day labels; top-right plan-global history/undo state control; no
bottom recent-action block. Add nullable previous/next travel-time context.

**Story 2.3: Post-Edit Feasibility Validation and One-Click Fixes**

OLD: a permanent gate before AI Fill.

NEW: initial AI plan is already orchestrated and validated. Relevant manual
edits trigger validation; only detected conflicts surface a banner/FixSheet;
fix application creates a new version and reruns validation. Hard conflicts
block detail enrichment/export, while soft warnings may continue.

**Story 3.1**

OLD: arrange remaining controllable blocks and fill all block content.

NEW: preserve the completed schedule exactly and enrich all eligible blocks
with do/prepare/notice, why, and citations. Retain the no-time/no-order-change
hard constraint. Story 3.1 owns the eventual entry-point design; it must not add
a completion interstitial to Story 2.1's initial timeline.

### Architecture and API

- Keep `/ingest/xhs` single-link and add multi-link classification plus a
  client presentation queue; do not introduce an unnecessary bulk pipeline.
- Persist nullable ingest `source_title` for reconnectable progress.
- Add authenticated Library import-list/detail contracts; return raw source URL
  only from the owned detail response.
- Relax edit-time regex to every valid `HH:mm`; preserve 15-minute alignment in
  Agent generation logic rather than the user mutation contract.
- Permit any in-trip target day at the API/domain layer, with exact-position or
  typed unavailable-target handling.
- Make recent action plan-global by omitting `day_index` in the mobile request;
  keep one additional eligible undo, not FR43 history browsing.
- Add nullable `commute_from_previous_minutes` and
  `commute_to_next_minutes` from an authoritative matrix/cache source.
- Reassign derived conflict detection from SlotEditor rejection to Validator;
  keep ownership, malformed time, trip-boundary, and immutable reservation
  protections at the mutation boundary.
- Update Planner/Filler boundaries so the primary Planner owns full schedule
  orchestration, Quick can serve only as an internal failure fallback, and
  Filler owns execution-detail enrichment only.
- Remove `smart_planning` as a user-controlled branch or retain it only as a
  deprecated compatibility input ignored by the main UX. Do not expose
  Quick/HQ version selection in the MVP client.
- Keep planning progress in the timeline route/shell and use the existing SSE
  stages as factual status, followed by in-place plan hydration.

### UX

- Adopt the six revised proposal visuals listed in Section 1 only after this
  change proposal is approved.
- Update `docs/ux/home-import-dock.md`, `docs/ux/mobile-ia.md`,
  `docs/front-end-spec.md`, `docs/ux/prototype-coverage.md`, and the synchronized
  BMAD UX packet.
- Keep labels user-facing: `计划`, `开始规划`, `导入记录`; do not expose
  skeleton, AI Fill, Quick, HQ, must_go, or a separate must-go badge.
- Treat `计划已完成，可直接调整` as state within the timeline, not a page.
  Dismiss it only after the first insert/replace/move/retime/delete mutation.

## 5. Implementation Handoff

Scope classification: **Moderate**.

- **Product Owner / Developer:** synchronize PRD, Epics, sprint status, Story
  2.2, new Story 1.6, and Story 2.3/3.1 boundaries.
- **Architect / Developer:** update Planner/Validator/Filler and ingest-record
  contracts, OpenAPI, generated types, data model, and migration plan.
- **UX Designer / Developer:** adopt revised visual states and update component,
  empty/error/loading/reconnect, accessibility, and motion specifications.
- **Developer / QA:** implement Story 2.2 corrections first; regenerate types;
  extend pure, repository, route, mobile, browser, and real-database tests.

Success criteria:

- Story 2.2 exposes minute-precise edits, correct day destinations, honest
  commute context, and one global history/undo control with no bottom recent row.
- Home accepts multiple links without creating a second input hierarchy, and
  every completion receives an uninterrupted ten-second FIFO display.
- Import records and original links remain authenticated and user-isolated.
- Home recognition enters Time inline; there is no optional AI-planning
  switch; Picker continues to S5 with `下一步`, and S5 owns the one
  `开始规划` action into the timeline shell.
- Planning progress and completion use one timeline route. Completion creates
  no extra page or bottom CTA, and its hint persists until the first mutation.
- Story 2.3 appears after user-created conflicts, not as a planning prerequisite.
- Story 3.1 cannot modify schedule time, date, or order.
- OpenAPI generation, focused tests, full build, browser screenshots, and real
  PostgreSQL/SSE regression checks pass before each affected story closes.

## 6. Checklist Completion

- [x] 1.1 Trigger stories identified: active Story 2.2, completed Story 1.4
  follow-up, and pending Story 2.3.
- [x] 1.2 Core problem classified as stakeholder requirements correction and
  planning-capability product pivot.
- [x] 1.3 Evidence collected from annotated prototypes, current contracts, code,
  and BMAD artifacts.
- [x] 2.1 Current Epic 2 remains viable with modifications.
- [x] 2.2 Epic 2 scope changes defined.
- [x] 2.3 Epic 1 and Epic 3 impacts reviewed.
- [x] 2.4 No new epic required; Story 1.6 is the needed follow-up.
- [x] 2.5 Sequence proposed: planning sync -> Story 2.2 correction -> Story 1.6
  scheduling -> Story 2.3 -> Story 3.1.
- [x] 3.1 PRD conflicts identified.
- [x] 3.2 Architecture/API/data conflicts identified.
- [x] 3.3 UX and accessibility conflicts identified.
- [x] 3.4 Tests, sprint status, generated types, and staging impacts identified.
- [x] 4.1 Direct adjustment is viable; effort/risk medium.
- [x] 4.2 Rollback evaluated and rejected.
- [x] 4.3 MVP remains achievable without scope reduction.
- [x] 4.4 Direct adjustment with moderate backlog reorganization selected.
- [x] 5.1-5.5 Proposal, MVP impact, handoff, and success criteria completed.
- [x] 6.1 Checklist reviewed; no analysis blocker remains.
- [x] 6.2 Proposal checked against current code and planning artifacts.
- [x] 6.3 Stakeholder explicitly approved the consolidated proposal on
  2026-08-12.
- [x] 6.4 PRD, Epics, UX, Architecture, supporting tech specs, BMAD mirrors and
  recovery entry synchronized on 2026-08-12. Next run implementation readiness
  and sprint planning.
- [x] 6.5 Moderate-scope handoff accepted: PM/UX/Architect artifacts are routed
  for synchronization while active Story 2.2 remains isolated.

## 7. Addendum: Picker, Meals, Commercial Areas, and Checklist

Date: 2026-08-11

Stakeholder review of the S4 Picker and food/shopping research adds four
moderate contract changes. This addendum supersedes proposal text that treats
Picker selection as only one required signal or depicts a permanent trailing
text tab and automatic 48-hour reminder.

### UX decision

- S4 enters at `全城检查`. The fixed city header has no disclosure control;
  tapping an L2 opens `选择 L3`, where `附近 | 全城` is visible and defaults to
  nearby.
- L3 rows use icon-only, mutually exclusive `必去` and `顺路` actions. `必去`
  uses a check-in-circle; `顺路` uses a Route path with two endpoints. Sticky
  totals read `已选必去 X` and `顺路去 Y`. The drill-down returns to overview;
  overview continues to S5 with `下一步`.
- Returning to `全城检查` preserves and displays both intent types on the L3
  thumbnails, L2 summaries, and global totals. `顺路` is never collapsed into
  an unselected state at the overview level.
- POI details are one reusable information sheet. `需预约` and its imported
  evidence are optional metadata, never a third Picker intent.
- Meal rows retain ordinary POI styling. A compact swap action opens one
  primary plus up to two alternatives; missing evidence produces one
  `+ 添加更多` row. `暂不决定` exposes no fixed 90-minute promise.
- Undecided meal recall ranks nearest current location, highest rated within
  5 km, reliable no-queue evidence, then nearest to the next POI for duplicate
  replacement. No-queue must be evidence-backed rather than a live claim.
- `附近吃什么` is a clickable child of a mall/market/food-street POI. It has no
  timeline node and queries only the current user's imported, verified food
  POIs in the same normalized commercial area.
- The checklist is a fixed compact icon rail to the right of scrolling date
  tabs. Its full page ends with `+ 添加记录`; the add sheet shifts emphasis from
  disabled `AI 提示` to AI-primary after text entry while preserving direct
  add. The automatic 48-hour reminder surface is removed.

### Technical impact

The architecture shard names `business_area`, but implementation does not:

- `CanonicalPOI` has no normalized commercial-area field or relation;
- `ResolvedPoi` and OpenAPI expose only L1/L2 context;
- the AMap search mapper retains id/name/address/distance/coordinates only;
- provider snapshots cannot serve as an indexed, stable query contract.

Create `BusinessArea` plus source/confidence-bearing POI memberships. Populate
memberships during POI verification and expose an owner-scoped query joining
`Inspiration -> CanonicalPOI -> BusinessArea`. Do not substitute an
administrative district or L2 route cluster when membership is absent; omit
the hint. Foreground location use also requires explicit permission, stale/no
fix fallback, privacy-safe analytics, and test fixtures.

### Backlog adjustment

1. Keep active Story 2.2 limited to timeline editing/history/undo.
2. Add a Story 2.0 Picker follow-up for overview/drill-down navigation,
   `required / along_route / unselected`, counts, and generic POI information.
3. Add a commercial-area model/ingestion/query story before area-attached food
   suggestions.
4. Add a meal-choice story for neutral rows, alternatives, shortage, local
   revalidation, and undecided recall; split foreground trip-location behavior
   into its own story if permission lifecycle cannot remain story-sized.
5. Add a checklist story for the fixed rail, full list, direct add, confirmed
   AI suggestions, and provenance. Do not schedule a 48-hour notification.

This addendum keeps the proposal classification **Moderate**. The consolidated
proposal is approved. Business implementation remains gated until the affected
PRD/Epics/architecture/UX contracts are synchronized, implementation readiness
passes, and sprint planning publishes the revised story order.

## 8. Approval and Handoff Log

- 2026-08-12: stakeholder approved the full Correct Course proposal after the
  final requirement that `顺路` L3 state map back into `全城检查` L3 thumbnails,
  split L2 summaries, and global totals.
- 2026-08-12: canonical docs and BMAD planning packets synchronized; no
  OpenAPI, Prisma or business implementation was changed in this phase.
- Classification: **Moderate** backlog reorganization.
- Planning handoff: update canonical `docs/` sources first, mirror the BMAD
  planning packet, then run `[IR]` implementation readiness and `[SP]` sprint
  planning.
- Implementation guardrail: finish active Story 2.2 through its existing
  review/merge path; create the newly approved follow-up stories only after the
  refreshed sprint plan establishes their order.

## 9. Addendum: Conversation and Annotation Trace Audit

Date: 2026-08-12

A second reverse trace from stakeholder replies, image annotations, the Xiamen
methodology and food/shopping/pace research found requirements that the first
sync had described but not assigned to implementable stories or data contracts.
The corrections are recorded in
`requirement-trace-audit-2026-08-12.md` and synchronized into current sources.

Material corrections:

1. Story 1.3 remains a historical adapter/stub baseline. New Story 1.8 owns
   production frame sampling, VAD/ASR, multimodal evidence, complete nullable
   AMap facts and real adapter/fixture validation.
2. S5 regains the approved collapsed optional constraints input; imported and
   natural-language play-style signals are evidence-based soft preferences, not
   a second form.
3. Candidate completion, DayLoadEstimate, cross-day recovery, route freshness
   and reliable-horizon weather now have Story 2.5/2.11/2.12 ownership.
4. Picker L2 status dots/map levels, Story 2.2 no-heading hierarchy, first-night
   and transition-aware luggage, cross-city intent inheritance/order reversal,
   non-mechanical meals and checklist multi-store semantics are explicit ACs.
5. Durable ingest cursors, evidence-to-confirmed-lock state, versioned
   Stay/Transfer/Luggage snapshots, transport facts and BusinessArea reliability
   are explicit target architecture rather than implied prose.

The Correct Course remains **Moderate**, but Implementation Readiness must use
the corrected packets. Flight/rail schedule and weather provider selection are
known implementation decisions; their stories require real staging evidence and
must retain manual/seasonal degradation.
