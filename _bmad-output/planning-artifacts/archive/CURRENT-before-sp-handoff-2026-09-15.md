---
project: nomad-mvp
updated: 2026-09-15
current_epic: 8
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 2-2-timeline-editing-undo-and-history
current_story_status: implementation-paused-for-replanning
planning_status: bmad-implementation-readiness-ready-for-sprint-planning
next_bmad_action: bmad-sprint-planning
next_bmad_checkpoint: start-sprint-planning
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-revalidation-2026-09-15.md
input_refinement_status: approved-ir-resolutions-applied-and-revalidated
input_refinement_report: _bmad-output/planning-artifacts/ir-resolution-decisions-2026-09-15.md
prompt_strength_proposals: awaiting-separate-review
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
working_branch: codex/story-2-2-timeline-editing
---

# Current Development Handoff

This is the single recovery entry point. The 2026-08-12 Correct Course is approved; a second
conversation/annotation trace audit corrected its PRD, Epics, UX, architecture and supporting
technical specs. Business implementation
is intentionally paused until Implementation Readiness and Sprint Planning accept the new queue.

## Resume Order

1. Read `AGENTS.md` and `_bmad-output/project-context.md`.
2. Read `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-05.md`.
3. Read `_bmad-output/planning-artifacts/requirement-trace-audit-2026-08-12.md`, this file and
   `_bmad-output/planning-artifacts/epics.md`.
4. Read `_bmad-output/implementation-artifacts/sprint-status.yaml` as historical execution state.
5. Run `git status --short --branch`.
6. CE completed on 2026-09-14; its report remains a historical snapshot. The initial six-step IR
   reported NEEDS WORK; the user then approved the detailed nine-item resolutions on 2026-09-15
   with two explicit choices: dedicated content-review service deferred; among extra admin tools,
   only manual place correction retained. Existing brand-rule and 8.3–8.6 capabilities remain.
   Read `_bmad-output/planning-artifacts/ir-resolution-decisions-2026-09-15.md` and the current
   `_bmad-output/planning-artifacts/implementation-readiness-revalidation-2026-09-15.md`.
   All nine planning findings are closed after three independent reviews and scoped source checks;
   READY applies to Sprint Planning only, not production or implemented features.
   Current totals: 60 Stories (7 historical / 53 targets), 1018 GWT, 65 FR (61 MVP / 4 deferred), 24 NFR.
   New 1.0 has 14 GWT and front-loads production identity/multi-device sessions/operator auth;
   1.11 has 22 GWT including FR4.2 manual name/address/same-city coordinate correction with
   provenance, coordinate-system normalization, atomic versioned publication and unchanged old
   plan/job snapshots. 5.1 has 24 GWT including minimum S10/S9/source/return; 5.2 remains 23 and
   enhances the same route. Other 56 existing Story bodies are unchanged.
   Account merge/self-unlink/device center, dedicated moderation, extra generic POI tools and
   reachability/photo-heat layers are deferred. Framework-code orchestration, valid-permission
   App-open single fix and inline `建议核对` remain approved. The separate 18-group prompt-strength
   proposal is still NOT approved; “其余认可” applied to the nine IR recommendations only.
   SP must carry `implementation-prerequisites-2026-09-15.md` (OPS-01/02, DB-CHANGE-01,
   DATA-VECTOR-01, METRICS-01/02/03), place 1.0 before real-user/first operator use, and migrate
   old 2.2 to one 3.1 execution identity with legacy id, baseline commit and Git history intact.
   Do not repeat CE/Epic8/file-set/IR-resolution approval. Actual resources, paid calls, deployment,
   private data actions and Story visual/runtime evidence remain for their authorized implementation.
   Business code, old Sprint, implementation Stories and PNGs are unchanged by this planning update.
   Story 8.5 was approved on 2026-09-13: 24 exact GWT, Node/PG incident/outbox and thin Telegram
   sendMessage adoption, plus both desktop R1 boards. Formal epics and source contracts are promoted.
   User also confirmed the presentation rule in `story-review-presentation-decision-2026-09-13.md`:
   keep BMAD GWT in files, but present Story/Requirements/prototypes and numbered Chinese acceptance
   prose directly in chat. Do not replace that prose with a GWT count/link. Old 7.6/8.2 examples
   illustrate format only; they do not restore superseded feedback/evaluation decisions.
   Story 8.4 was approved on 2026-09-13 and its revised 26 GWT were appended verbatim. The approved
   adoption is existing Node/PG budget authority with desktop Web operations and source-aware
   amounts: operator limits, tariff estimates, matched supplier charges and separate balances.
   Read `story-8-4-review-2026-09-13.md`, its research/amount-source addendum and the Epic 8 split
   under `_bmad-output/planning-artifacts/` for the budget/alert boundary. Two R1 base boards are
   approved; missing price/source-detail states remain explicit implementation evidence gates.
   The approved 8.5 adoption is existing Node/PG
   incident/outbox plus thin sendMessage adapter; terminal eligibility, durable grouping/cooldown,
   evidence-based recovery and unknown delivery stay distinct from user Job/Plan and budget truth.
   Operations pages do not require mobile adaptation; no 8.6 overview dependency or production test
   sending is introduced. Keep the single retry/accounting authority and first-use safety boundary.
   The user approved 8.3's 24 GWT, native configuration adoption and both R1 boards on 2026-09-08.
   Existing Node adapters plus one PG-backed route authority and a narrow operator surface are
   approved; Unleash remains ordinary flags. Accepted/queued jobs stay pinned, pause blocks future
   calls, rollback creates a new release. Formal GWT and source mirrors are synchronized, not implemented.
   The user explicitly confirmed Epic 7 planning completion and entry into Epic 8 on 2026-09-07.
   Its five approved stories/98 GWT/nine approved boards remain intact; do not ask for closure again.
   The user also approved the six MVP stories plus two Post-MVP cold-start slots, and required
   delegated GitHub/official-source mature-implementation research for corresponding stories.
   Story 8.1's 20 GWT, isolated Sentry/Langfuse direction and Walkthrough R1 are approved/appended;
   PRD/observability/analytics/UX and source mirrors are synchronized. Actual hosting remains unverified.
   Two additional agents reviewed Langfuse human evaluation/configuration after three user annotations.
   The user approved 8.2's 24 GWT, Human Workspace R2 and revised adoption on 2026-09-08:
   direct-identifier-filtered production samples, per-rule policy, promptfoo execution plus real
   Langfuse human scoring/experiments. Its formal GWT and source contracts are synchronized.
   Old Report R1 and summary-only/blanket-veto selection are superseded. No paid
   evaluation or deployment has run. Keep internal quotas hidden, first-use safety in earlier
   stories, XHS search out of MVP and source/prototype approval separate from real deployment.
   Also retain the approved
   `_bmad-output/planning-artifacts/check-in-scope-decision-2026-09-06.md`: the user explicitly
   excluded 7.2 from MVP. Do not reopen its review, append its manual GWT or treat AR16 as a gate.
   Story 7.1's 22 approved GWT scenarios remain intact. Keep 7.2 as a deferred number and leave
   7.3-7.6 numbering unchanged. Photo-based marks/media require later-version design (FR40.1).
7. Read the passed 2026-09-15 targeted IR revalidation and approved implementation prerequisites;
   retain its production/visual evidence conditions when generating the Sprint plan.
8. Run `[SP] bmad-sprint-planning` to publish the revised story order.
9. Only then correct/validate the active Story 2.2 file and resume `bmad-dev-story`.

## Current State

- Epic 1 Stories 1.1-1.5 and retrospective are historical done baselines; replacement planning
  Stories 1.6-1.11 are approved in `epics.md` but are not implementation-complete.
- Story 1.3 delivered single-link/SSE/adapter seams and test stubs, not the newly required production
  VAD/ASR/frame-sampling/full-AMap pipeline. New Stories 1.9-1.11 own that delivery gap.
- Story 2.0 and Story 2.1 are historical done baselines. Their Quick/HQ/partial-skeleton UI is
  implemented but no longer the current product target.
- Story 2.2 has substantial code and tests on `codex/story-2-2-timeline-editing`, but its story file
  and implementation still encode old D+/-1, 15-minute/snap and day-scoped recent-action behavior.
- Do not discard the safe ownership, idempotency, immutable revision, EditEvent and undo work.
  Correct the contract and implementation in place after planning gates; do not recreate the story.
- The old sprint status has not been edited by hand. Sprint Planning must preserve completed history
  and use the final validated queue produced by the active Epics workflow.
- Epic 2 planning is approved through Story 2.15 and its completion was confirmed on 2026-08-20.
  Epic 3 planning is approved through Story 3.5; its first Story must migrate legacy Story 2.2 in
  place and preserve the approved ownership/idempotency/revision/undo work while replacing obsolete
  interaction semantics. Epics 6-7 planning are completion-confirmed; Story 8.4 is approved; Story 8.5 is approved; Story 8.6 is approved; whole-Epic 8 completion is confirmed; CE and initial IR are complete; approved resolutions passed targeted IR revalidation and are ready for Sprint Planning.
- Epic 3 Story 3.1 `分钟级时间轴编辑与全计划撤销` is approved in `epics.md`; it is the
  brownfield migration target for legacy Story 2.2 and includes mutation-triggered validation status,
  but not typed FixSheet repair.
- Epic 3 Story 3.2 `候选地点受控落位与自由时间填充` is approved in `epics.md`; candidate
  intent groups and row-level provenance remain orthogonal, and all placement paths require preview,
  confirmation, revision-bound validation and plan-global undo.
- Epic 3 Story 3.3 `规划后单晚住宿、早餐与行李修改` is approved in `epics.md`; it reuses
  Story 2.5 field rules in a single-night Sheet, conditionally previews material impacts, publishes
  immutable Stay/Luggage revisions, validates and supports plan-global undo without silent replanning.
- Epic 3 Story 3.4 `增量校验与类型化冲突修复` is approved in `epics.md`; it separates
  pre-publication structural rejection from revision-bound derived validation, provides explicit
  FixSheet diffs, truthful degraded/no-safe-fix paths, downstream hard gates and global undo.
- Epic 3 Story 3.5 `受控对话式局部调整` is approved in `epics.md`. AI interpretation returns
  a typed intent or one revision-bound `AdjustmentAsk` for scope clarification/material risk before
  directions and diff; its visual set covers normal, ask, no-safe, stale and applied states.
- Epic 3 planning is complete through Story 3.5. Epics 4 and 5 are approved and
  completion-confirmed; Epics 6-7 are also completion-confirmed and Story 8.4 is approved and Story 8.5 is approved; Story 8.6 is approved; whole-Epic 8 completion is confirmed; CE and initial IR are complete; approved resolutions passed targeted IR revalidation and are ready for Sprint Planning.
- Epic 4 Story 4.1 `多城跨城意图确认与联程输入草稿` is approved in `epics.md`. The
  Trip is an ordered collection with no product-defined city-count ceiling; every city remains an
  independent single-city Plan and every added city reuses the same confirmation plus S2/S3 flow.
  Repeated cities remain disallowed in the main segment chain; cross-timezone, overnight intercity
  and arbitrary whole-chain reorder remain deferred. AI adjustment is limited to the active city Plan.
- Epic 4 Story 4.2 `相邻城市交通确认与交接日切分` is approved in `epics.md`. It derives
  N-1 TransferLegs for N ordered city Plans, distinguishes preference/provisional/confirmed facts,
  computes continuous handoff and per-city usable intervals, and keeps invalid legs as explicit
  linked-draft blockers without publishing a TripRevision.
- Epic 4 Story 4.3 `多城独立编排与原子联程发布` is approved in `epics.md`. One visible
  TripPlanningJob plans each city through the existing single-city Planner, validates local and
  cross-segment boundaries, and atomically publishes the complete revision set. Linked Plan
  mutations without an atomic successor TripRevision are explicitly rejected until Story 4.4.
- Epic 4 Story 4.4 `已发布联程的当前城市安全编辑与版本重绑定` is approved in
  `epics.md`. It wraps all existing Story 3 mutation types in one active-segment Trip transaction,
  atomically advances Plan/Trip revisions, validates adjacent handoff impact and provides Trip-level
  undo. City/date/transfer changes clone the current Trip into the 4.1-4.3 draft/republish loop.
- Epic 4 Story 4.5 `跨城一日游意图与往返交通草稿` is approved in `epics.md`. It extends the
  cross-city Sheet with explicit day-excursion/add-city/cancel choices, binds one valid host date,
  independently confirms outbound/return facts and persists a recoverable ready child-Plan input
  without creating a duplicate host segment, destination Stay, PlanningJob or published revision.
- Epic 4 Story 4.6 `跨城一日游独立编排与原子时间轴发布` is approved in `epics.md`. It reuses
  the fenced TripPlanningJob and single-city Planner for host/child intervals, validates both Plans
  plus round-trip boundaries, atomically publishes DayExcursion/Plan/Trip revisions, renders one
  host-day timeline and gives S8 addition a preview plus Trip-level undo without duplicate city tabs.
- Epic 4 Story 4.7 `已发布跨城一日游的安全编辑与范围约束` is approved in `epics.md`. It
  extends Story 3/4 mutations to explicit host/child scope, routes date/transport/delete through the
  4.5/4.6 draft/replan path, atomically rebinds all affected revisions, validates and uses one
  Trip-scoped history/undo without allowing cross-plan AI commands.
- Epic 4 planning is complete through Story 4.7 and was completion-confirmed on 2026-08-20.
  Epic 5 subsequently split detail enrichment, ResultSheet trust, overrides and export into approved
  vertical slices without making basic export depend on future detail generation.
- Epic 5 Story 5.1 `版本绑定的 AI 行程细节完善` is approved in `epics.md`. It migrates the
  placeholder FillRun/FillItem baseline into an owner-scoped, exact-revision, durable and fenced S9
  vertical slice with per-slot validation, citations, truthful partial degradation, no-schedule-change
  invariants and first-use quota controls. S7/S8 contains no detail-completeness card; S9 is entered
  from S10 and returns to the same ResultSheet context.
- Epic 5 Story 5.2 `可核查的行程单与引用查看` is approved in `epics.md`. S10 always renders
  the current revision's compact base itinerary, drills into Story 5.1 details and protected
  citations when available, keeps partial/no-detail states honest and treats stale pages as
  single-owner revision recovery rather than collaboration. Its `整体核查` separates the existing
  ValidationRun from detail completeness; hard conflicts remain readable but gate S9 and export.
- Epic 5 Story 5.3 `逐条行程细节修改与 AI 保留` is approved in `epics.md`. User add/replace/delete
  and explicit-empty semantics create revisioned line operations, mark only concrete lines as
  `我的修改`, never inherit AI citations and survive later fill. Exact/near-duplicate AI suggestions
  are filtered and there is no restore-AI action or plan-global undo for content edits.
- Epic 5 Story 5.4 `版本绑定的导出生成与预览` is approved in `epics.md`. It migrates the legacy
  Plan-oriented `/export/png` and ExportJob baseline into an owner-scoped, exact-revision, durable
  WebP/JPEG image-export slice with optional current details and 1080/1242 width. The exact revision
  derives one long artifact for a standalone Plan, each main TripSegment and each DayExcursion child
  Plan; one job publishes the ordered city-unit manifest with a versioned abstract-route/city-art
  theme and no public per-day slicing. Existing ValidationRun gates, factual unit progress/reconnect,
  stale-preview protection and authenticated city-file download remain in scope.
- Epic 5 Story 5.5 `整趟长图下载与系统分享` is approved and appended in `epics.md`. It
  normally composes one whole-trip image from the same immutable export snapshot. A versioned
  `TripLongLayoutPolicy` must first be established through supported browser/device and WebP/JPEG
  encoder tests; overlong trips split only at complete main-city section boundaries into visible
  numbered parts, with DayExcursions retained at their host dates and one logical batch action.
  System share remains capability-gated and uses ordered city images; ZIP and native album write are
  excluded. Current visual authorities are
  `story-5-5-city-long-image-transition-regenerate-r5.png` and
  `story-5-5-trip-long-download-share-r5.png`; older native photo-permission, ZIP/image-bundle and
  overlong-hard-failure candidates are superseded and must not guide implementation.
- Epic 5 completion was confirmed on 2026-08-20. Epic 6 now owns planned MealSlot behavior,
  foreground-authorized recall with plan-context degradation, normalized BusinessArea food hints,
  and the Trip shopping/return checklist. Recent trips remain Epic 7; check-in was later deferred.
- Epic 6 has five approved sequential stories: 6.1 planned MealSlots and one-primary/two-backup
  pools; 6.2 foreground-location recall/degradation; 6.3 normalized BusinessArea/owner food hints;
  6.4 checklist CRUD and confirmed direct/AI record entry; 6.5 lightweight shopping text and label
  shortcuts. The original combined shopping/store/return-buffer split was narrowed by the user.
  Return records remain in 6.4; checklist-to-schedule conversion is explicitly deferred. Current
  scope coverage is complete; the user confirmed the Epic 7 transition on 2026-09-06.
- Story 6.2 approval was confirmed on 2026-09-05. Recall uses a single foreground location fix,
  truthful basis/permission degradation and read-only candidates before the existing meal mutation.
  Without completed-visit records it uses the preceding planned POI, labeled as planned, so it does
  not depend on Epic 7 check-in. The approved visual is `story-6-2-meal-location-recall-fallback-r1.png`.
- Story 6.3 and `story-6-3-area-food-context-r2.png` are approved and appended: normalized
  multi-membership, historical-import enrichment, POI-attached owner food hints, protected source
  drill-in, hidden hints without reliable membership/results and cleared inaccessible results.
  Area Food Suggestions R1 is superseded. Story 6.4 defines approved checklist CRUD and direct/AI entry;
  advanced store matching and checklist-to-schedule conversion are deferred.
- Story 6.4 and `story-6-4-checklist-record-workflow-r1.png` are approved and appended,
  supplementing Shopping Checklist R2 and Shopping Add Record R1 with direct entry, AI waiting,
  selective confirmation/failure, general notes, record CRUD/completion and separate checklist
  versions. Story 6.5 is approved as lightweight text capture rather than structured shopping
  attributes/store associations or return-task schedule buffers.
- Story 6.5 uses `story-6-5-shopping-text-shortcuts-r2.png` to visualize its approved single-input,
  placeholder and label-shortcut contract. Shopping Target/Stores R1 is superseded;
  `story-6-5-return-task-time-preview-r1.png` is retained as deferred exploration, not MVP authority.
- Latest 2026-09-06 confirmation: automatic/user-assisted store search, L2-aware shopping placement
  and contextual buying hints remain deferred. Sales/stock evidence, planned-versus-actual passage,
  and automatic-application authorization/undo are explicitly left for later design. Scope record:
  `shopping-intent-scope-review-2026-09-06.md`; current coverage: `epic-6-coverage-review-2026-09-06.md`.
- Final Epic 6 scope disposition (2026-09-06): the user agreed to defer checklist-to-schedule
  conversion, retain plain return records and preserve all prior transport/stay/luggage buffers.
  No Story 6.6 is added. All five current stories have coverage; this is planning closure only.
- Epic 7 entry/split are approved with a subsequent scope deferral (2026-09-06): 7.1 recent
  trips/reopen; 7.2 excluded from MVP; 7.3 Settings/account/actions; 7.4 account-data export;
  7.5 account deletion; 7.6 reliable feedback. AR16 is deferred, not an active MVP gate.
  See `epic-7-story-breakdown-proposal-2026-09-06.md` and the check-in scope decision.
- Story 7.1 `最近行程与继续使用` was approved on 2026-09-06 and appended with 22 GWT cases.
  PRD, UX, minimal owner recent/resume architecture and mirrors are synchronized; Recent Trips
  Resume/Recovery R1 are approved references. This is planning approval, not implementation done.
- Story 7.1's approved annotation requires a real saved replan draft/job (new city, intercity
  dates/transport) before showing change recovery. Half-filled saved input is `有未完成的修改`,
  never failure; only the relevant current durable task's terminal failure permits failure copy.
  Recovery R1 D must not be reused as an unfinished-input state.
- Story 7.2 is deferred out of MVP by explicit user confirmation, not done. Its manual review,
  Check-in Core R1 and Recovery/Identity R1 boards are retained as non-MVP history; do not implement
  their controls, schema or inheritance rules. Future FR40.1 covers photo/location-based marks and
  album videos/nine-grid/AI beautification with fresh design, not automatic adoption of old 7.2.
- No OpenAPI, Prisma or business-code changes were authorized by the planning sync itself.
- Story 7.3 is approved and appended with 14 GWT scenarios and Account Actions R2. The user rejected
  its original usage/limits/reset-time page; old R1 and the archived draft are superseded. FR12,
  FR25, FR38 and UX-DR31 now hide quota while preserving backend guards and real job progress.
- Story 7.4 is approved and appended with 20 GWT scenarios and Account Export Core/Recovery R1.
  Its structured current-product-data JSON-in-ZIP is separate from itinerary image exports;
  source PRD/UX/architecture and packet are synchronized. This is not implementation completion.
- Story 7.5 is approved/appended with 22 GWT and Account Delete Core/Recovery R1. The source
  contracts cover irreversible acceptance, all-device stop, durable cleanup and limited recovery.
  Actual retention/identity/cleanup verification remains an implementation gate; no real data is deleted.
- Story 7.6 is approved/appended with 20 GWT and Feedback Entry R1/Recovery R2. Actual
  Web/PWA opening is separate from native WebView; no blanket anonymous-web or external-submit
  success promise. The current mailto fallback is not delivery evidence. Form/privacy extensions
  are synchronized in source docs and mirrors; approval is not proof of a deployed feedback service.
- The 2026-09-07 user corrections are applied to 7.6 AC 8/12/19/20 and Recovery R2: no attachment
  error banner/special text-only CTA, disable upload and retain preview X; no bottom actions during
  upload/submit/receipt checks. Real bounded timeout exits busy before recovery; no silent image loss.
- Epic 7 coverage review is complete: five approved stories, 98 GWT and nine approved boards;
  7.2 remains deferred, not done. `epic-7-coverage-review-2026-09-07.md` records dependencies and
  remaining implementation gates. The user confirmed whole-Epic planning completion and entry into
  Epic 8 on 2026-09-07; this does not mark any newly defined story implemented.
- Epic 8 split is approved in `epic-8-story-breakdown-proposal-2026-09-07.md`: 8.1 observability,
  8.2 reproducible evaluation, 8.3 Provider route changes, 8.4 platform budgets, 8.5 terminal
  AI/AMap Telegram alerts and 8.6 operations overview. Reserved 8.7/8.8 stay Post-MVP platform
  acquisition/gap-fill only. Stories 8.1-8.6 GWT are appended; no new implementation story has been created.
- The user requires agent-led GitHub/official research at corresponding story reviews; save
  evidence, reuse feasibility/effectiveness, licensing/paid limits, resource/privacy tradeoffs and
  uncertainties before selection. This is not authorization for installs, accounts or deployment.
- Story 8.1's 20 GWT and Walkthrough R1 are approved/appended. Both supporting reports and the
  adopted direction are recorded. The approved default is one Sentry global provider plus explicitly
  isolated Langfuse tracing, with safe correlation/job/attempt lookup and independent bounded sampling.
- Story 8.2's 24 revised GWT, Langfuse adoption/addendum and Workspace R2 were approved and
  appended on 2026-09-08. Source contracts and mirrors reflect the approved evaluation boundary.
  Local deterministic checks must not claim a changed model ran; true A/B requires explicit trusted
  authorization and bounds. Quality uses rule-specific score/warn/review policies, not a blanket
  hard-rule veto. Execution completeness and runtime security remain separate. Human evaluation is
  required, not optional summary upload; production samples may retain indirect-inference context
  after direct-identifier filtering in a separate evaluation intake. 8.1 production telemetry stays safe.
  Existing fixtures/CI are historical baselines, not proof the current evaluation contract passes.
- Story 8.3's 24 GWT, native configuration selection and two R1 boards were approved and appended
  on 2026-09-08. Source PRD/architecture/UX/ops and mirrors are synchronized. No code changed and
  no Provider/model/production configuration has been tested or modified.
- Story 8.4's adoption, revised 26 GWT, desktop Web/amount-source clarification and two R1 base
  boards were approved on 2026-09-13. GWT are appended and source PRD/architecture/UX/ops plus
  mirrors synchronized. Logical task counts and actual attempt costs are separate, reservations
  atomic, unknown exposure conservative, and supplier amounts conditional on real evidence.
  Missing price/source-detail visuals remain explicit implementation gates, not a reopened approval.
  Story 8.5 was subsequently approved and appended: 24 GWT, Node/PG notification authority and
  both desktop R1 boards. No-data is not recovery, and a send receipt is not read proof. No real
  supplier/Telegram call or deployment has occurred. Story 8.6 is now approved; whole-Epic 8 completion is confirmed; CE and initial IR are complete; approved resolutions passed targeted IR revalidation and are ready for Sprint Planning.

## Approved Product Decisions

- MVP emphasis is itinerary planning and on-trip controlled adjustment/replanning. No manual or
  automatic POI check-in this release; existing city-scoped AI, explicit confirmation, revision/
  validation/undo and cross-city draft/republish boundaries are unchanged.
- Future FR40.1 direction: authorized album photos plus available stored geographic evidence may
  support automatic photo-evidenced visit marks and album-video/nine-grid/AI-beautified exports.
  Permissions, matching/correction, processing/storage, cost and format require later design;
  this does not authorize present travel-media album reading/uploads or continuous location storage.
  FR45 independently permits one user-selected feedback screenshot, never album scanning/check-in.

- Canonical stages are S0-S11: input, optional import, time, accommodation, Picker, pace review,
  one AI planning run, editable plan, adjustment/validation loop, detail, ResultSheet and export/use.
- S2/S3 only collect time and accommodation. Arrival/departure support exact, two-hour window or
  AI-decide. Accommodation is per night, optional, with breakfast and luggage child fields.
- S4 enters at `全城检查`; only L3 receives mutually exclusive `required / along_route / unselected`.
  Both selected states map back to L3 thumbnails, split L2 summaries and global totals.
- S5 selects `悠闲 / 从容 / 充实` and owns the only `开始规划` CTA.
- S5 also has an optional collapsed companion/mobility/diet constraint input. Play style is inferred
  from source-bearing natural-language/import/selection evidence and is not another questionnaire.
- The user sees one PlanningJob and one completed plan. Quick/HQ/seed may remain internal but there
  is no switch/adopt workflow or smart-planning toggle.
- Planner creates the complete initial schedule; Validator handles initial and mutation-triggered
  feasibility; Filler only adds do/prepare/notice, why and citations without schedule changes.
- S10 is the overall review surface: it always shows the base itinerary, mirrors the current
  ValidationRun separately from detail completeness and opens S9 only when no hard conflict exists.
  S7/S8 remains the schedule editor and never hosts detail-completion status.
- S11 calls the public artifact `导出图片`: WebP is default and JPEG is the compatibility fallback;
  PNG/strip tiles may exist only as internal transient renders. Story 5.4 binds settings, versioned
  theme, revision-derived city units, preview, job and download to one exact revision; unfinished
  details do not block base export. Story 5.5 adds a normal one-file Web/PWA whole-trip download;
  after a tested/versioned safety limit is exceeded, one logical action delivers visible numbered
  parts split only at complete main-city boundaries. Capability-gated system share uses ordered city
  images; ZIP, city-internal splitting and direct photo-library write are not MVP behavior.
- Story 2.2 target is minute precision, previous/other/next moves, nullable server commute and one
  plan-global history/`撤销 8` control. No brand/version, `编辑安排` heading or bottom recent row.
- Linked trip is `Trip -> an unbounded ordered collection of main TripSegment -> single-city Plan`,
  with atomic transfer, Stay and luggage boundaries. A main segment date may own one
  `DayExcursion -> single-city Plan` bounded by confirmed outbound/return legs; the UI keeps one host
  day/tab and labels return instead of creating a duplicate host segment. Cross-timezone/overnight
  repeated main-city chains, nested/multi-destination excursions and arbitrary whole-chain reorder
  are deferred; AI adjustment never crosses the active host/child Plan or changes excursion legs.
- Meals use fixed/choice/undecided MealSlots and owner BusinessArea recall. Shopping/return items use
  a Trip checklist, not automatic timeline slots or a 48-hour reminder.
- MVP candidate completion is owner imported/verified inspirations -> AnchorPool/Top-50 -> AMap
  nearby; uncertain results remain candidates and shortages become free time without pausing the
  PlanningJob. XHS keyword search/session ownership is Post-MVP Epic 8 platform cold-start work,
  isolated from end-user sessions and split into search acquisition plus AnchorPool fill. DayLoadEstimate,
  cross-day recovery and reliable-horizon weather remain explicit target contracts.
- Post-plan AMap search first saves to `其他候选` with row-level provenance `我添加的`; it does not mutate the timeline. When no exact
  place is found, the user may keep the target name and select a same-city verified nearby landmark
  as an explicitly approximate route/distance proxy. Target facts never inherit landmark facts;
  unresolved candidates have no route. Epic 3 owns explicit placement, validation and undo.
- BYOK is Post-MVP/internal compatibility; platform quotas, cost guards and degradation are MVP.
- Story 7.4 account export is an explicit, owner-authenticated current structured-data copy in
  JSON-in-ZIP, not the Epic 5 itinerary image workflow or full database/restore backup. It excludes
  historical/media/secret/internal evidence data, seals a consistent snapshot and separates file
  expiry/download retry from fresh generation. Logout does not cancel it; account ineligibility
  blocks capture/publication/download. No user-visible quota or new external enrichment call.
- AI adjustment may construct one revision-bound `AdjustmentAsk` to clarify scope or warn about a
  material risk; an ask never mutates the Plan and directions/diff start only after it is answered.
- Approved 7.5 stops ordinary account access atomically with durable deletion acceptance; failures
  cannot reactivate it. Full owned history and private references are cleaned with shared-object
  safety. Restricted receipts only read progress; retries need separate limited authority.
  Verified online cleanup is distinct from policy-disclosed backup retention, and restored backups
  or later explicit registration cannot resurrect the old owner. No cooling-off/undo or forced export.
- User-visible recovery actions remain in-app without exposing quota. Epic 8 owns a separate AI/AMap terminal-incident Story:
  after retries/fallbacks are exhausted, redacted deduplicated Telegram Bot alerts notify configured
  operators without changing user Job/Plan state.

## Revised Story Queue

- Epic 1 planning: 1.6 Home multi-link queue; 1.7 durable import progress; 1.8 import records and
  versioned dedupe; 1.9 production image/text understanding; 1.10 adaptive video sampling; 1.11 AMap
  verification and branch disambiguation.
- Active implementation correction remains legacy Story 2.2 Timeline Editing, Undo, and History;
  implementation stays paused until the new planning gates complete.
- Epic 2 planning approved so far: 2.3 travel time; 2.4 unified flight/rail lookup; 2.5 per-night
  accommodation/luggage; 2.6 pace/constraints; 2.7 full-city Picker/L3 intents; 2.8 POI Sheet;
  2.9 one PlanningJob; 2.10 RouteFact; 2.11 complete initial planning; 2.12 AMap candidate completion;
  2.13 versioned AnchorPool snapshots; 2.14 revision-bound explainable daily load; 2.15 post-plan
  Top-5/manual candidate save with canonical/landmark-proxy/unresolved location.
- Epic 3 planning approved so far: 3.1 minute timeline editing, plan-global undo and
  mutation-triggered validation status; 3.2 explicit candidate placement, free-time filling,
  revision-bound validation and exact candidate-state undo; 3.3 post-plan single-night stay,
  breakfast and luggage editing with conditional impact preview; 3.4 revision-bound incremental
  validation and typed FixSheet repair; 3.5 revision-bound `AdjustmentAsk`, controlled directions,
  typed diff, validation and undo.
- Epic 4 planning approved so far: 4.1 repeated cross-city intent acceptance plus a complete,
  recoverable unbounded ordered-city input draft with active-city AI adjustment guard; 4.2 confirms
  every adjacent TransferLeg and derives handoff-day availability without partial publication; 4.3
  independently plans every city and atomically publishes one complete linked timeline; 4.4 safely
  rebinds current-city mutations and Trip-scoped undo through successor TripRevisions; 4.5 creates a
  ready, recoverable same-day DayExcursion input with two independently confirmed transport legs;
  4.6 independently plans host/child intervals and atomically publishes one merged host-day timeline;
  4.7 safely edits child slots/date/transport/deletion with active-plan AI scope and Trip-level undo.
- Epic 5 planning approved so far: 5.1 revision-bound AI detail enrichment with citations, durable
  progress, truthful partial degradation and a strict no-schedule-mutation invariant; 5.2 compact
  current-revision ResultSheet with separate validation/detail checks, optional details, protected
  citations and stale recovery; 5.3 line-level user edits with protected wording, deletion/empty
  semantics and duplicate-filtered later fill without restore-AI; 5.4 exact-revision width/settings,
  revision-derived city-unit manifest, versioned background, gates, preview, durable generation/
  recovery and authenticated WebP/JPEG download; 5.5 tested whole-trip composition, normal one-file
  delivery, numbered city-boundary parts for overlong trips, one logical download batch, stale
  regeneration and capability-gated ordered city-image sharing.
- Epic 6 approved stories: 6.1 MealSlots/choice pools; 6.2 foreground recall/degradation;
  6.3 BusinessArea food hints; 6.4 checklist records; 6.5 lightweight shopping text/label insertion.
  Advanced shopping and checklist return-task-to-schedule conversion are explicitly deferred.
- Epic 7 approved Story 7.1: owner recent aggregation, current-revision recovery, independent
  view metadata and real unfinished-change versus failed-task semantics, with no new AI call.
- Story 7.2 is deferred and its AR16 gate removed from current MVP; Story 6.2 uses foreground
  location or previous/next planned-POI/static-pool fallback with no visit-state dependency.
- Stories 7.3-7.6 scope/GWT/visuals and Epic 7 overall planning completion are approved.
  Next planning action: Sprint Planning from the passed IR revalidation; CE and Epic 8 completion are confirmed;
  no current 7.2 review or implementation remains. Quota stays internal, not a user UI feature.
  Post-MVP platform XHS search acquisition/AnchorPool gap-fill and terminal AI/AMap Telegram
  operator alerts remain mapped to Epic 8 under FR34.1/FR38.1.
- Epics 6-7 planning are completion-confirmed. Epic 8 entry/split and all six stories 8.1-8.6 are approved.
  Epic 8 coverage review is complete: 138 GWT, 10 current approved boards, no unassigned MVP slice
  found within this bounded review. Whole-Epic completion was confirmed on 2026-09-14;
  final CE revalidation passed and the user confirmed CE workflow completion on 2026-09-14.
  No individual Story/Epic 8/CE/file-set or IR-resolution approval needs repeating. All nine IR
  planning findings are closed by the 2026-09-15 revalidation; SP has not started and business implementation remains paused.

## Sources of Truth

1. Product: `docs/prd.md` mirrored to `_bmad-output/planning-artifacts/prd.md`.
2. UX: `docs/front-end-spec.md`, `docs/ux/mobile-ia.md`, Home Dock and prototype coverage; mirrored
   to `_bmad-output/planning-artifacts/ux.md`.
3. Architecture: `docs/architecture/index.md` current v0.6 shards; mirrored to planning artifacts.
4. Technical scope: `docs/tech-spec-epic-2.md`, `docs/tech-spec-epic-3.md` and `epics.md`.
5. Requirement trace: `_bmad-output/planning-artifacts/requirement-trace-audit-2026-08-12.md`.
6. API/DB implementation: `docs/api/openapi.yaml`, generated types and Prisma schema.
7. Execution after SP: sprint status and the active implementation story.

Deprecated root architecture, v0.3 shards, Autoplace v1, old UX deltas, dated readiness reports and
retrospectives are historical unless this file explicitly points to them.

## Validation Baseline

After a code/contract story changes implementation, run:

```bash
pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-server run test:planner-domain
pnpm -F nomad-server run test:planner
pnpm -F nomad-server run test:ingest
pnpm -F nomad-mobile test
pnpm -r build
git diff --check
```

The last pre-Correct-Course code baseline passed these checks on 2026-07-27. It does not prove the
new contracts are implemented. Project commands run only in WSL Ubuntu from
`/home/tong123/work/nomad-mvp`.
