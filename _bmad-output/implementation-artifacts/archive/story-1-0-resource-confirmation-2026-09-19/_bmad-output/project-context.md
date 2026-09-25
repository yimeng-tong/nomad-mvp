---
project_name: nomad-mvp
user_name: yimeng-tong
generated: 2026-06-17
updated: 2026-09-17
source: bmad-generate-project-context-plus-approved-correct-course
sections_completed:
  - discovery
  - implementation-rules
  - validation
  - correct-course-sync
  - requirement-trace-audit
  - sprint-planning
---

# nomad-mvp Project Context

## Mission

Nomad turns a travel idea or imported Xiaohongshu inspiration into an executable itinerary:
import and verify POIs, confirm time/accommodation, express place intent and pace, generate one
complete initial plan, edit/validate, enrich details and citations, then export/use the trip.

## Current Baseline

- Work only in WSL Ubuntu at `/home/tong123/work/nomad-mvp`; never use Windows-native Node/pnpm or
  copy from the retired E-drive image.
- BMAD 6.8 is authoritative through `_bmad/`, `_bmad-output/` and `.agents/skills/`.
- The repo is a pnpm monorepo with React/Vite mobile, Fastify/TypeScript ESM server, Prisma and
  OpenAPI-generated types.
- `CURRENT.md` is the single recovery entry after this file.
- Correct Course was approved, then a conversation/annotation trace audit corrected planning sources
  on 2026-08-12. `bmad-create-epics-and-stories` Step 4 revalidation passed and the user confirmed
  workflow completion on 2026-09-14. IR resolutions passed targeted revalidation and are ready for SP; Epics 2-3 are approved/confirmed and
  Epic 4 Stories 4.1-4.7 are approved and Epic 4 is completion-confirmed. Epic 5 Stories 5.1-5.5 are
  approved in `epics.md`; they cover revision-bound detail enrichment, ResultSheet trust, protected
  user wording, city export generation, tested whole-trip composition, numbered city-boundary parts
  and capability-gated Web/PWA sharing. Epic 5 is completion-confirmed; Epic 6 Stories 6.1-6.5
  planned MealSlots, foreground location recall/degradation and owner BusinessArea food hints are
  approved in `epics.md`, including separate checklist CRUD and confirmed AI record entry.
  Story 6.5 is approved as lightweight shopping text/label shortcuts. Advanced shopping and
  checklist-to-schedule conversion are explicitly deferred. The user confirmed Epic 6 planning
  completion and entry into Epic 7 on 2026-09-06, then approved its six-story split and Story 7.1.
  Story 7.1 is appended in `epics.md`. The user then explicitly deferred 7.2 out of MVP; its manual
  boards/schema are historical and AR16 is not a current gate. Story 7.3's 14 GWT scenarios and
  Account Actions R2 are approved/appended: account and available actions only, no quota/usage UI.
  Story 7.4's 20 GWT, current-data JSON-in-ZIP and Account Export Core/Recovery R1 are approved
  and appended, with source contracts synchronized. Story 7.5's 22 GWT and Account Delete
  Core/Recovery R1 are also approved/appended; no real data deletion is authorized by planning.
  Story 7.6's 20 GWT and Feedback Entry R1/Recovery R2 are approved/appended on 2026-09-07.
  Source contracts and mirrors preserve disabled upload/no busy bottom actions, removable selected
  images, bounded checks and post-timeout recovery. Epic 7 coverage is complete: five approved
  stories, 98 GWT and nine approved boards. The user then explicitly confirmed whole-Epic planning
  completion and entry into Epic 8 on 2026-09-07.
  `epic-8-story-breakdown-proposal-2026-09-07.md` records the subsequently approved six MVP stories
  and two Post-MVP slots. Story 8.1's 20 GWT, isolated tracing direction and Walkthrough R1 are
  approved/appended; source contracts and mirrors are synchronized. Story 8.2's revised 24-GWT
  contract, Langfuse adoption/addendum and Human Workspace R2 were approved and appended on
  2026-09-08. Story 8.3's 24 GWT, native configuration selection and two R1 boards were also approved
  and appended on 2026-09-08; source contracts/mirrors are synchronized. Story 8.4's revised
  26 GWT, Node/PG adoption, desktop Web/amount-source clarification and two R1 base boards were
  approved on 2026-09-13, appended and synchronized. Story 8.5 adoption, 24 GWT and two desktop R1 boards
  were also approved and appended on 2026-09-13. Story 8.6 research, 20 GWT/Chinese prose and two
  desktop R1 boards were approved and appended on 2026-09-13. All six Epic 8 stories total 138 GWT
  and 10 approved boards. Whole-Epic planning completion was confirmed on 2026-09-14;
  no new business implementation is complete.
  Initial IR completed on 2026-09-14 with NEEDS WORK; the user-approved resolutions passed
  targeted revalidation on 2026-09-15. Current target: 60 Stories/1018 GWT/65 FR/24 NFR; READY
  means Sprint Planning may start. SP completed on 2026-09-15; the resulting queue and migration
  records are under implementation-artifacts. Neither planning milestone marks production ready.
- Story 2.0/2.1 and 1.1–1.5 retain historical done. Legacy 2.2 maps only to current 3.1, which
  inherits in-progress work but remains paused for upstream contracts and new Story preparation.
  The user approved starting 1.0 on 2026-09-17. Its create-story contract is now ready-for-dev;
  no business implementation or real-service operation was performed by this preparation.

## Implementation Rules for AI Agents

- Use WSL `pnpm`. Contract/build checks include type generation, focused tests and `pnpm -r build`.
- FR14 was amended on 2026-09-14: use existing Node/Fastify application-code workers and necessary
  queues for orchestration. No n8n/low-code prerequisite; durable truth, idempotency, bounded retry,
  DLQ and SSE/restart recovery remain required.
- `docs/api/openapi.yaml` is API SSOT. Regenerate `packages/types/src/api-types.ts`; never hand-edit it.
- Server imports use ESM/NodeNext `.js` specifiers. Keep exported signatures strict and typed.
- Extend existing Fastify plugins/routes/services; do not introduce a duplicate framework stack.
- Validate requests at route boundaries and preserve the standard error envelope.
- Protected SSE streams keep auth, trace, heartbeat, durable sequence/cursor and reconnect behavior.
- AI provider secrets, tokens, raw source URLs, exact private input and location trails never enter
  frontend payloads, logs, analytics, Sentry or unredacted Langfuse data.
- Prisma changes are story-scoped and require migration plus real PostgreSQL verification.
- Every durable write/job uses owner guard, idempotency and expected revision/attempt fencing.
- External XHS/AMap/flight-rail/route/weather/Provider/COS facts remain nullable with source,
  observed/freshness state and typed timeout/degradation. AMap is not a flight/rail schedule source.
- Do not commit `.env`, build outputs, logs or ignored backup material.

## Planning Sources

- `epic-7-story-breakdown-proposal-2026-09-06.md` records the amended split: 7.1 recent trips,
  deferred 7.2, then 7.3 Settings/account/actions, 7.4 account export, 7.5 deletion and 7.6 feedback.
  `check-in-scope-decision-2026-09-06.md` is the approved deferral and future FR40.1 photo/media
  direction. AR16 is not a current readiness gate. Story 7.1 remains approved/appended;
  `story-7-2-review-2026-09-06.md` is historical manual-design exploration, not current review.
- `settings-account-actions-scope-2026-09-06.md` records the confirmed no-user-quota decision.
  `story-7-3-review-2026-09-06.md` and Account Actions R2 are approved/appended; old usage R1
  and its archived draft must not guide implementation.
- `story-7-4-review-2026-09-06.md` is approved/appended: current structured
  account data in JSON-in-ZIP, consistent capture, durable generation and protected download.
  This account archive does not change Epic 5's no-ZIP image-export decision.
- `story-7-5-review-2026-09-06.md` is approved/appended: irreversible account access stop,
  durable full owned-data cleanup, restricted progress recovery and truthful retained-backup scope.
  Production identity/lifecycle safety is required; header/OTP stubs and fixed phone identities
  cannot satisfy it. Actual retention/identity verification remains an implementation gate.
- `story-7-6-review-2026-09-06.md` is approved/appended: configured Tencent opening plus
  a minimal first-party text/optional-screenshot form, opt-in diagnostics and actual stored receipts.
  Web/PWA is not native WebView; no Nomad identity transfer does not guarantee guest mode in every
  host. Formal GWT/source promotion is complete. Story 7.6 adds its own entities to the existing
  7.4 export and 7.5 deletion registries when implemented; earlier stories need not await its tables.
- `epic-7-coverage-review-2026-09-07.md` records confirmed whole-Epic planning completion and the
  authorized Epic 8 transition, not completed implementation, final CE validation or readiness approval.
  Story 7.6 Recovery R1 is superseded by R2; full approval followed its visual corrections.
- `epic-8-story-breakdown-proposal-2026-09-07.md` records the approved split:
  observability, evaluation, Provider routes, budget governance, terminal Telegram alerts and a thin
  operations overview. Isolated XHS acquisition and gap-driven AnchorPool fill remain Post-MVP.
  All six MVP story/visual approvals are complete; deferred stories require their own later review.
- `story-8-1-review-2026-09-07.md` is approved/appended, with
  `research/story-8-1-mature-implementations-2026-09-07.md` and its two supporting agent reports.
  Approved selection: retain Sentry/Langfuse, one global provider plus isolated AI tracing, safe
  business correlation and independently bounded sampling; do not assume shared trace parentage.
  Real hosting, paid governance, exact SDK/runtime compatibility and cleanup remain unverified gates.
- `story-8-2-review-2026-09-07.md` is approved/appended on 2026-09-08, with
  `evaluation-operator-scope-decision-2026-09-07.md` and
  `research/story-8-2-langfuse-operator-addendum-2026-09-07.md` plus two new agent reports.
  Approved: promptfoo execution/complete-result checks, versioned per-rule score/warn/human-review
  policies, and Langfuse's real human scoring/experiment workspace. Authorized production samples
  use direct-identifier filtering without removing indirect-inference travel context. This dedicated
  evaluation intake does not expand 8.1 production telemetry. Deterministic CI stays independently
  usable, but a missing human-review path cannot satisfy the whole Story. Report R1 and the original
  blanket-veto/summary-only selection are superseded; Human Workspace R2 is approved but synthetic.
  Production model/config publication remains separate from 8.2 experiments.
- `story-8-3-review-2026-09-08.md` is approved/appended on 2026-09-08, with
  `research/story-8-3-mature-implementations-2026-09-08.md` and the Unleash/config plus gateway
  agent reports. Approved: existing Node adapters, one PG-backed route policy authority, small
  protected operator UI and no required new gateway service. Unleash retains ordinary flags only.
  Accepted/queued jobs retain exact snapshots; independent pause prevents future calls, not
  guaranteed upstream cancellation; rollback creates a new release without touching user plans.
  Its 24 GWT and Route Config Release/Recovery Rollback R1 are approved, not implemented.
  Keep 8.4 centralized accounting separate from route publication and preserve the preceding
  first-use protection baseline.
- `story-8-4-review-2026-09-13.md` is approved/appended on 2026-09-13 with 26 revised GWT and
  Budget Policy Usage / Budget Recovery R1 base boards. The research synthesis and amount-source
  addendum are approved: existing Node/PG authority, atomic sufficient reservation/settlement,
  logical product counts, actual attempt costs, conservative unknown holds and current safety
  checks preserve frozen routes. All operator management is desktop Web, with no mobile adaptation.
  Internal limits, usage-priced estimates, matched bills and supplier balances remain separate;
  unsupported APIs stay unavailable. Price/source-detail states are text-approved but not drawn
  in R1; real desktop screenshots and source/capacity/failure evidence remain implementation gates.
  User approved source promotion and entry into 8.5; no new gateway/billing service or paid calls.
- `story-8-5-review-2026-09-13.md` is approved/appended on 2026-09-13: 24 GWT, two delegated
  reports/synthesis and Telegram Lifecycle / Operator Delivery Recovery R1. Node/PG incident/outbox
  is the one notification authority with a thin sendMessage adapter and desktop Web controls.
  Recoverable failures do not notify; no-data/tool resolution is not business recovery. Unknown
  sends may duplicate, cannot use an invented Telegram idempotency API and do not prove read state.
  No real target configuration, message or deployment was performed. Its approved review remains authoritative.
- `story-8-6-review-2026-09-13.md` is approved/appended on 2026-09-13: 20 GWT and matching
  Chinese review prose, two delegated reports/synthesis and Overview / Source States R1. The
  existing Node/React thin read-only desktop overview preserves task facts, sealed 8.2 reports,
  8.4 ledger and 8.5 incidents as their respective authorities. Source windows/permissions,
  samples/extrapolation, stale/partial data, bounded queries and protected native links remain
  explicit. No new Grafana/iframe or general query builder is required; real integration is unverified.
- `epic-8-coverage-review-2026-09-13.md` records confirmed whole-Epic planning completion: six approved/appended MVP
  stories, 138 GWT and 10 approved current boards. No unassigned Epic 8 MVP slice was found in
  this bounded review; 8.7/8.8 remain Post-MVP and old 8.2 Report R1 is excluded. Whole-Epic
  completion/Continue was explicitly confirmed on 2026-09-14. CE Step 4 final cross-Epic validation
  passed revalidation and the user confirmed CE workflow completion on 2026-09-14. IR completed
  with NEEDS WORK as a snapshot; the 2026-09-15 targeted revalidation now passes. Do not repeat 8.6, Epic 8 or CE approval requests. Business work
  and historical Sprint remain paused/preserved; actual source/permission/failure/desktop gates remain.
- `epics-final-validation-2026-09-14.md` records passed CE Step 4 revalidation. The user approved
  CE-01/02/03 and changed ordinary download copy to `已开始下载，请确认`. Two GWT added to 1.11
  close desktop rule maintenance/publication; 4.6 confines S8 addition to host date/child without
  changing 4.7 date moves; 5.5 distinguishes confirmed file writes from browser handoff/unknown,
  with explicit duplicate-aware retries. Other 56 Story GWT remain unchanged; totals are now
  59 stories / 995 GWT and 64 FR (60 MVP, 4 deferred). All source mirrors and scoped checks passed.
  Prior question cards are answered. Do not ask the contract choices again. The user selected
  [C] Complete Workflow on 2026-09-14; CE is complete and bmad-help has routed to IR.
  No actual browser-save/provider/runtime test or implementation was performed by this revalidation.
- `implementation-readiness-report-2026-09-14.md` preserves the completed initial IR/NEEDS WORK
  snapshot. `ir-findings-explained-2026-09-15.md` supplied concrete requirement/gap/decision details.
  The user then approved the nine IR recommendations with dedicated moderation deferred and
  only manual place correction retained among extra admin tools. Other recommendations were accepted.
- `ir-resolution-decisions-2026-09-15.md` is the approved scope/ownership record;
  `implementation-readiness-revalidation-2026-09-15.md` is the current passed assessment for SP.
  It closes all nine planning findings after independent review; actual runtime evidence remains.
  New1.0 (14 GWT) supplies production identity/sessions/operator authorization before real users;
  FR4.2/1.11 adds seven manual correction GWT (22 total) with provider/manual provenance and old
  snapshot protection. 5.1 adds minimum S10 host and S9 source/return (24), 5.2 remains23 on the same
  route. Total60 Stories/1018 GWT, including7 historical and53 targets; 65FR/24NFR.
- `implementation-prerequisites-2026-09-15.md` assigns seven scoped operational/measurement
  conditions to SP tasks: OPS-01/02, DB-CHANGE-01, DATA-VECTOR-01 and METRICS-01/02/03. Preserve
  backup/recovery and180-day media tiering targets without claiming execution; vector work triggers
  only when needed, and early measurement does not wait for the whole8.x operator UI.
- Account merge/self-unlink/device center, dedicated moderation, extra POI merge/alias/neighbor/
  generic blacklist/bulk rerun tools and reachability/photo-heat layers are deferred. Existing
  brand rules,8.3–8.6 and controlled retries remain. The18-group prompt-strength proposal was separately approved in the latest 2026-09-15 message
  and is now applied; do not repeat that approval.
- `ux-prompt-strength-audit-2026-09-14.md` records later FR14/FR48/FR39 refinements: framework-code
  orchestration, valid-permission single fix on App open/foreground resume, inline `建议核对`.
  Direct changes are applied to sources/mirrors and Stories 2.9/5.1/5.2/6.2; 59 Stories/995 GWT
  remain. The separate 18 groups were subsequently approved and applied; the initial IR had found
  broader scope/baseline gaps at that time. Those gaps are now resolved at planning level by the
  2026-09-15 decision/revalidation; neither document approval establishes runtime verification.
- `story-review-presentation-decision-2026-09-13.md` is user-confirmed: files retain BMAD GWT;
  chat reviews show research/adoption, Story As a/I want/So that, Requirements, prototype links and
  a numbered Chinese prose acceptance list. Links/counts alone do not satisfy this format. The
  supplied old 7.6/8.2 examples are style-only, not reinstatement of superseded behavior.
- User-confirmed research rule: at corresponding 8.x story reviews delegate bounded mature-solution
  research including GitHub and official sources. Record feasibility/effectiveness, pros/cons,
  migration, license/paid features, resources, privacy/deletion and observed versions/dates; main
  agent verifies important evidence. Research does not authorize deployment, installation or accounts.

- `shopping-intent-scope-review-2026-09-06.md` records the approved light-input Story 6.5 and
  explicitly deferred shopping/sales-evidence/location-trigger/automatic-apply design.
  `epic-6-coverage-review-2026-09-06.md` records the resolved return-buffer deferral and current
  scope coverage. Ordinary return records and necessary transport/stay/luggage buffers remain;
  do not treat planning closure as implementation of the old store/schedule proposal.

- Product: `docs/prd.md` and BMAD PRD mirror.
- Epics: `_bmad-output/planning-artifacts/epics.md`.
- Architecture: `docs/architecture/index.md` v0.6 shards and BMAD architecture packet.
- UX: `docs/front-end-spec.md`, `docs/ux/mobile-ia.md`, Home Dock and prototype coverage.
- Technical specs: `docs/tech-spec-epic-2.md`, `docs/tech-spec-epic-3.md`.
- Approved change: `sprint-change-proposal-2026-08-05.md` and linked decision record.
- Trace audit: `requirement-trace-audit-2026-08-12.md` records direct requirements, corrections,
  superseded ideas and unresolved provider selections.
- Execution after SP: sprint status and implementation story files.

Deprecated architecture root/v0.3, Planner Autoplace v1, old UX deltas, dated readiness reports and
retrospectives are historical unless `CURRENT.md` explicitly points to them.

## Current Product Semantics

- Approved 8.1 observes actual outcomes through mature tools, not a new user/admin screen.
  Sentry owns the one global provider; isolated Langfuse tracing uses safe business correlation
  rather than shared trace parentage, with bounded independent sampling. All sinks filter before
  export, unknown usage stays unknown, and telemetry failure cannot change domain state. No Replay/
  full input capture; actual access/retention/deletion and compatibility require real evidence.

- Settings exposes account and actual available operations only. No AI usage summary, balance,
  count limit, reset time, quota tier or global-job dashboard is shown to users. Internal quotas,
  budgets and metrics remain enforced; only factual job progress and safe recovery actions are
  user-facing in the existing work screens. Story 7.3 does not implement a user usage API.

- Account data export (7.4) explicitly captures current owner product data into a sealed snapshot
  and generates JSON-in-ZIP with a manifest/guide. It excludes history/raw media/secret/private
  source/internal-call data, preserves exact linked refs and retries the same sealed snapshot.
  File expiry is configured; protected download rechecks owner/eligibility. Logout does not cancel
  accepted export, but account ineligibility blocks publication/download. No image-export ZIP,
  restore-import, quota UI or external enrichment is added by this scope.

- Account deletion (7.5) is irreversible only after verified final acceptance and stops all ordinary
  account access before resumable full owned-data cleanup. Limited status receipts are not normal
  auth or write authority; known cleanup failure never reactivates the account. Shared refs remain
  safe, online erasure and disclosed isolated retention are distinct, and backup/identity reuse
  cannot resurrect deleted data. Planning approval never authorizes deleting real accounts.

- No manual or automatic POI check-in in MVP. Focus remains initial planning and on-trip controlled
  adjustment/replanning within existing city scope, explicit confirmation and revision/validation/
  undo safeguards. Photo/geolocation-based marks, album videos, nine-grid and AI beautification
  are deferred FR40.1 directions needing fresh permission/evidence/storage/output design.

- Story 7.1 recent trips aggregate each standalone Plan or whole Trip once and restore current
  server revision plus valid input/job/S7/S10 context through independent durable view metadata.
  `已生成` is not travel completion. Saved half-filled changes use `有未完成的修改`; subordinate
  entries require real persisted change drafts/tasks, and failure copy requires the current relevant
  task's terminal failure, not departure/disconnection or an old result. Reopening never replans.

- Use S0-S11. S1 import is optional; S8 adjustment/validation is a loop.
- S2 Time supports exact boundary, two-hour window or AI-decide. S3 Accommodation is per night,
  optional, and includes breakfast plus transition-aware luggage. S5 owns pace, optional collapsed
  additional constraints and the sole `开始规划` action; play style is evidence-derived, not another form.
- Only L3 receives mutually exclusive `required / along_route / unselected`; L1/L2 are context.
  Both selected states must map to L3 thumbnails, split L2 summaries and full-city totals.
- The user sees one PlanningJob and one completed plan. Quick/HQ/seed are internal compatibility,
  not alternate plans, switches or adoption UI.
- Planner creates the full schedule. Validator handles initial and mutation-triggered feasibility.
  Filler only enriches do/prepare/notice, why and citations and cannot alter schedule.
- S7/S8 owns schedule editing and automatic conflict banners, not detail completeness. S10 always
  shows the current base itinerary and separates the same revision's ValidationRun from detail
  completeness; no hard conflict allows S10 -> S9 -> same-context S10.
- ResultSheet content edits are line-level protected user wording. Later fill preserves add/replace,
  delete suppression and explicit-empty optional fields, filters same/near-duplicate AI suggestions,
  never assigns AI citations to user text and exposes no restore-AI action.
- FR39 and Stories 5.1/5.2 now use secondary inline `建议核对` beside source-less safe generic content,
  with details/sources available later. No warning modal/repeated toast/per-item confirmation;
  truthful citations, unavailable safe content and schedule/export gates remain unchanged.
- S11 exports the exact current revision as `导出图片`: base itinerary is always available, current
  details are optional, WebP is default and JPEG is the compatibility/size fallback. The user chooses
  1080/1242 only; the revision derives one long image for a standalone Plan, each main TripSegment and
  each DayExcursion child Plan. One job generates the ordered city-unit manifest with a versioned
  abstract-route/city-art theme and no public per-day slicing. Preview/job/artifacts share one revision
  and existing ValidationRun gate; reconnect resumes the same job and a newer revision makes the old
  preview stale. Story 5.4 provides authenticated city files. Story 5.5 normally derives one
  whole-trip image; after a supported-browser/encoder matrix establishes a versioned safety limit,
  overlong trips split only at complete main-city boundaries into visible `N/总数` parts delivered by
  one logical batch action. It never uses ZIP, detaches a DayExcursion from its host section or
  promises direct photo-library write; system sharing remains capability-gated and city-image ordered.
- Legacy Story 2.2 migration target: any valid trip day, one-minute user retime, nullable authoritative commute and a
  plan-global history/`撤销 8` control; no branding/version, `编辑安排` heading or bottom/day-scoped recent row.
- Linked multi-city uses `Trip -> an unbounded ordered collection of main TripSegment -> single-city Plan`
  with TransferLeg, per-night Stay, luggage and atomic TripRevision. Product scope has no city-count
  ceiling and the main chain cannot repeat a city. A host segment date may additionally own one
  same-day, same-timezone `DayExcursion -> single-city Plan`, bounded by independently confirmed
  outbound/return TransferLegs; it creates no destination Stay or duplicate host segment.
- AI adjustment is always scoped to the active single-city Plan, whether independent, a main linked
  segment or a DayExcursion child. It cannot mutate the host/child counterpart, another TripSegment,
  the city chain or a TransferLeg. Cross-timezone/overnight repeated main chains, nested/multi-city
  excursions and arbitrary whole-chain reorder are deferred.
- Meals use fixed/choice/undecided MealSlots and owner BusinessArea recall. Shopping/return tasks
  use TripChecklistItem; no automatic 48-hour reminder.
- Meal recall also permits one fix on App open/foreground resume with applicable current on-trip
  meal context and still-valid historical/new permission (2026-09-14 amendment). Coalesce same-open
  events; no permission prompt on unauthorized opening, no revoked-permission reuse, no navigation
  or overwrite of an active Sheet draft. Raw fixes are cleared after use; late results are fenced by
  owner/session/request/revision/meal/date/scope. It never tracks continuously. Invalid/no fix falls back to same-scope previous/next planned POIs or static
  pool/manual add. MVP does not query a completed-visit subsystem or label planned POIs completed.
  Only an explicit Story 6.1 confirmation mutates the meal/plan revision.
- Story 6.3 area-food hints require reliable shared BusinessArea membership and the owner's verified
  imports. Membership has source, policy version and validity; absent relations/results hide the
  hint. Browsing sources neither requests live location nor creates a meal/plan mutation. Current
  visual authority is `story-6-3-area-food-context-r2.png`.
- Story 6.4 checklists bind a stable standalone Plan or Trip, support ordinary `note` records and
  independent item versions, and never advance schedule revisions for record edits or completion.
  Direct entry preserves wording and rejects blank saves; AI suggestions are editable proposals
  until explicit confirmation. Duplicate/stale suggestions cannot overwrite existing records.
  Current supplement is `story-6-4-checklist-record-workflow-r1.png`.
- MVP candidate expansion is owner imported/verified inspirations -> AnchorPool/Top-50 -> AMap
  nearby; uncertain results remain candidates and shortages become free time without pausing the
  PlanningJob. XHS keyword search/session ownership is Post-MVP Epic 8 platform cold-start work,
  isolated from end-user sessions and split into search acquisition plus AnchorPool fill;
  daily/cross-day load and reliable-horizon weather are typed planning/validation context.
- Candidate UI groups by intent (`未安排的必去 / 顺路候选 / 其他候选`) and shows provenance per
  row (`来自灵感 / 城市热门 / 附近推荐 / 我添加的`). Intent, provenance and location mode are
  separate fields; a candidate appears once and generic `AI` is not a source label.
- Post-plan place search saves candidates before any timeline command. If AMap has no accurate
  target, a same-city verified nearby landmark may supply an explicitly `landmark_proxy` route
  endpoint. Keep target and landmark identities/facts separate, show `附近估算`, and leave candidates
  without a proxy unresolved. Epic 3 owns placement, validation, revision publication and undo.
- BYOK is Post-MVP/internal compatibility. Platform quota, cost controls and honest degradation are MVP.
- Conversational adjustment may return one structured `AdjustmentAsk` at a time to clarify scope or
  warn about a material risk. An ask never mutates the Plan, never exposes chain-of-thought and must
  remain bound to the exact input revision before directions/diff are generated.
- AI/AMap terminal quota/auth/billing/all-route failures notify configured operators only after
  retries and fallbacks are exhausted. Telegram delivery is server-side, redacted, deduplicated,
  cooled down and failure-isolated from user Job/Plan state; ordinary restrictions yield safe
  in-app recovery actions without exposing quota.

## Known Code Shape and Gaps

- `apps/server/src/index.ts` wires Fastify, auth, rate limiting, queues, routes and observability.
- `apps/server/src/planner/` contains delivered Quick/HQ/slot-edit foundations; current code is not
  evidence that v0.6 semantics are implemented.
- Prisma currently lacks most Trip/DayExcursion aggregate, BusinessArea, MealSlot and checklist target entities.
- Story 1.3 delivered ingest seams/stubs, not production VAD/ASR/frame sampling or complete AMap
  facts. Stories 1.9-1.11 own that gap; do not mark it complete through historical Story 1.3 wording.
- OpenAPI/mobile still need story-scoped required/along_route, minute edit, import record, planning
  input/job, linked trip, location/meal/checklist and export changes.
- SP tracks all60 formal stories with stable keys. Story1.0 now has its current implementation
  contract; the other52 current targets, including migrated3.1, still require later authorized
  preparation. Each contract carries its source fingerprint and bound engineering conditions.

## Development Guardrails

- Keep changes story-sized and dependency ordered. The first Epic 3 Story must migrate legacy
  Story 2.2 in place; do not combine linked trips, meals, checklist or detail/export into it.
- Reuse existing domain/repository/route patterns and immutable revision work.
- UI work must include empty/loading/error/reconnect/disabled/accessibility states and browser images.
- Real-service staging is required when a story changes AMap, Provider, COS, PostgreSQL or SSE behavior.
- Planning docs authorize future scope, not implementation completion.

## Validation Baseline

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

Run only checks relevant to a docs-only planning change; run the full baseline for implementation
stories. The last pre-Correct-Course code baseline passed on 2026-07-27 but does not satisfy the new scope.


## Sprint Planning Completed (2026-09-15)

`implementation-artifacts/sprint-status.yaml` is the current execution status. Its companion
`sprint-migration-2026-09-15.yaml` fixes all 60 IDs/slugs, old-to-new mappings, the historical
retrospective scope, preparation order and seven assigned engineering conditions; the same-name
Markdown explains decisions and records actual validation. These paths are under `_bmad-output/`.

There are 7 historical done stories, 1 inherited in-progress story paused under new3.1, and 52
backlog stories. Epic1/2/3 are in-progress; Epic1's old done covered only1.1–1.5. Its retrospective
done is retained for that exact scope, with the expanded-scope review still required. All8 Epics,
8 retrospectives and60 Stories are tracked; 1018GWT/65FR/24NFR remain unchanged.

The next preparation is1.0 production login/multi-device sessions; it remains backlog without
an implementation file.3.1 keeps legacy_story_id, baseline_commit and the existing Git branch,
but must satisfy1.0/2.7/2.9/2.10/2.11 contracts and a current keep/change/remove audit before
resuming.3.1 itself supplies mutation-triggered ValidationRun;3.2/3.4 are not forward gates.
The old2.2 document is marked historical-source-only and is never dispatched separately.

OPS-01 is assigned through1.0; OPS-02 through1.9 and each later object type; DB-CHANGE-01 applies
per actual change.2.13 owns conditional DATA-VECTOR-01 without requiring vectors in advance.
METRICS-01 starts with1.0/1.6/1.7, no later than1.9's first real capability acceptance;8.1/8.2
aggregate METRICS-02/03 without blocking early basic evidence on their full UI. Codex is the named
engineering executor and verifies in separate evidence steps; yimeng-tong owns product decisions
and actual human evaluation. All implementation conditions remain unexecuted.

The old Sprint/CURRENT/checker and exact scope were archived before migration under
`implementation-artifacts/archive/sprint-planning-2026-09-15/`. The READY-for-SP report remains
a dated input snapshot, not an instruction to rerun CE/IR or create another conversation. All18
prompt groups,1.11 manual correction and5.1's minimum S10/S9 source/return are preserved.
7.2/8.7/8.8 and old draft/visual explorations stay outside executable status.

The user's authorization ended at SP and necessary tracking/handoff updates. Do not automatically
run create-story/dev, deploy, call real providers/Telegram, buy resources or operate real data.
`CURRENT.md` now points to the next preparation and the explicit pause instead of the old queue.

## SP Delivery Revalidation (2026-09-17)

The user requested another SP-to-Epics/PRD check and permitted reading the referenced main task.
Its latest approved decisions agree with the current source contracts. The new delivery contract
and review are `implementation-artifacts/sprint-delivery-contract-2026-09-17.yaml` and
`implementation-artifacts/sp-revalidation-2026-09-17.md` under `_bmad-output/`.

All65 FR and24 NFR now have explicit delivery/deferred dispositions and reverse Story bindings;
historical done is never the sole evidence for current production scope. FR14's existing
U-Link/U-App/attribution obligations must be carried into1.0/1.6 first-use tasks and8.1 consolidation.
Actual Web/PWA or existing-host feasibility, permission/privacy and service evidence remain to be
verified in those Stories; this does not add a native application or silently defer the requirement.
NFR7 map-level copyright belongs to the first shared map container in2.7; ordinary cards keep
their approved presentation.2.7's existing GWT delivers NFR19 and2.11 supplies initial FR9 checks.

The checker now distinguishes the original SP snapshot from authorized subsequent execution.
See AGENTS.md Sprint Delivery Handoff for prepared-contract metadata, condition evidence and
current pointers. The next-preparation selector includes inherited3.1 even though it is already
in-progress; its new contract remains separate from pause/resume and no old2.2 dispatch is allowed.
Normal authorized preparation/development/review/completion and expanded Epic closure have
dedicated temporary-fixture regressions. These fixtures are not implementation or production evidence.

At the SP revalidation checkpoint,1.0 remained backlog and3.1 paused; that recheck itself did
not authorize create-story/dev, real services, deployment or data operations.


## Story 1.0 Prepared (latest user direction, 2026-09-17)

The user then said “同意开始1.0”, advancing the waiting create-story step. The current contract is
`implementation-artifacts/1-0-production-login-and-multi-device-sessions.md`, with its same-name
`-validation.md` and three research/review records, under `_bmad-output/`. The14 approved GWT
remain exact; source Story ID/hash, all5 bound engineering conditions and login-attribution are carried.
Current state is ready-for-dev; the next workflow is dev-story for1.0. The next unprepared contract
pointer advances to1.6, but this preparation does not dispatch1.6 or resume3.1.

Backend inspection confirmed existing User/OAuthIdentity/Session tables must be extended, legacy
external actor→DB owner hashing and Job/HQ restoration must migrate together, public Session IDs
must be separate from secrets, and active SSE/all existing private routes need qualification checks.
Browser state covers shared-cookie tabs, bfcache/foreground recovery and cross-owner late requests;
client expected identity is only a consistency check after real authentication.

Official provider research records actual Web/native/callback distinctions, Tencent server-side
verification, Apple prerequisite resources and still-unverified pure-PWA U-Link/U-App delivery.
The selected real tenant/host/rights, real service/PG/recovery/browser/measurement evidence remain
implementation preflights/closure gates, not facts established by public documentation. Do not add
native apps or silently substitute products. Engineering conditions remain not-started.

Preparation uses the inherited working tree and preserves history. No business code, OpenAPI,
Prisma, source PRD/Epics/GWT or prototype was changed. The scoped handoff regression fixtures now
start from the preserved SP checkpoint and separately verify the actual workspace as it advances.


## Story 1.0 Development Started (2026-09-17)

The user said “继续下一条”, authorizing the next1.0 dev-story step. A new local branch
`codex/story-1-0-production-auth` preserves the old editing branch and all uncommitted inputs.
Story1.0 is in-progress with baseline7250a8a131a370698bff53538a4405c2ddb94c1c;3.1 stays paused.

T0 now has a standalone runtime configuration validator,18 focused tests, a read-only preflight
CLI and blank configuration template. These are not wired into the existing server/auth routes;
existing placeholder authentication has not been represented as production-safe. Required real
identity/captcha/attribution resources and host/configuration details are still missing locally;
only DB/Redis key presence was observed, without connecting or exposing values. The user was
asked for existing resource names and configuration locations. T0 remains incomplete and no later
Story task is marked done. See implementation-artifacts/story-1-0-runtime-preflight-2026-09-17.md.

The implementation authorization remains valid. Resume the same1.0 after the missing resource
information is available; do not restart planning, dispatch1.6, provision/pay/send SMS or operate
existing data on the strength of the configuration template.

## Story 1.0 Resource Selection Updated (2026-09-18)

The user supplied the implementation scheme and chose homelab first, with frp when public access
is needed. This supersedes the same-day side record's ECS-first hosting direction. The current
resource record is `implementation-artifacts/research/story-1-0-resource-alignment-2026-09-18.md`.
Use Alibaba PNVS SMS authentication and PNVS graphic H5 for the current T0/T4 provider path;
the earlier Authing/Jiguang/Tencent research is historical. Keep the frozen Story/GWT source
fingerprints and all identity/session/owner/attribution obligations; use the dated decision to
interpret vendor names. Do not silently expand this into OSS/video/native-App implementation.

Cloud AK key-pair presence was verified in the ignored 0600 root admin env. The supplied U-App
identifier and preflight selections are in a separate ignored 0600 `.env.story-1-0.local`;
neither file is automatically loaded by the application. Do not log values or deploy admin keys.
Read-only PNVS preflight now reports exactly three missing fields: ALIYUN_PNVS_SIGN_NAME,
ALIYUN_PNVS_CAPTCHA_APP_ID and ALIYUN_PNVS_CAPTCHA_APP_KEY. U-App registered platform and the
homelab target are still unspecified. The planned test domain is not verified live infrastructure.

The standalone validator/template/preflight supports PNVS and has25 passing focused tests.
It is not wired to the authentication routes yet. No cloud API, SMS, host/DB connection, DNS/frp
change, deployment or purchase occurred. T0 and Story1.0 remain incomplete; continue from these
specific missing inputs without re-asking provider choice or treating configuration as live proof.
