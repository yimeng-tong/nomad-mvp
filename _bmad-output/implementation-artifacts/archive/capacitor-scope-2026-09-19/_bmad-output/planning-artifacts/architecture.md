# Nomad MVP Architecture Input Package

Generated: 2026-09-06
Status: Approved Correct Course target architecture

OpenAPI and Prisma remain implementation SSOTs. Deprecated root/v0.3/autoplace-v1 documents are intentionally excluded.

---

## Source: `docs/architecture/index.md`

# Nomad MVP Architecture (v0.6)

Updated: 2026-09-14
Status: Approved Correct Course target architecture

本目录是实现规划的架构权威来源。它描述获批目标合同；未进入对应 story 前，
OpenAPI、Prisma 和代码仍可能只实现 v0.4 基线，不能因本文更新而被视为已交付。

## Current Decisions

- Story 1.0在真实用户/运营写入前补齐生产认证、多设备持久会话与最小服务端授权；历史1.1–1.5保持原交付记录。
- IR-03额外运营工具只保留手工纠错地点（FR4.2/1.11）：名称、地址、同城坐标的人工覆盖独立于Provider原始事实，版本化发布不回写用户历史行程。

- 用户只看到一个 PlanningJob 和一份完成计划；Quick/HQ/seed 只允许作为内部策略。
- Planner 编排完整地点与时间，Validator 校验及产生类型化修复，Filler 只完善执行细节。
- `Trip -> ordered TripSegment -> single-city Plan` 连接无固定数量上限的有序城市段；每个 Plan 仍只属于一个 City。
- 主 TripSegment 的一个本地日期可挂一个 `DayExcursion -> single-city Plan`，以去返两条
  TransferLeg 完成同日返回，不创建第二个同名宿主 segment。
- TripRevision 原子绑定主/一日游 PlanRevision、TransferLeg、Stay、LuggageTransition 和 DayExcursionRevision。
- Picker 使用 `required / along_route / unselected`，所有视图从同一状态源派生。
- BusinessArea 独立于行政区和 L1/L2；owner-scoped 导入美食查询需要可靠 membership。
- Story 1.3 是入库适配器基线；真实图文理解、视频抽帧/VAD/ASR和完整AMap事实分别由Story 1.9、1.10、1.11交付；1.8负责owner导入记录与去重。
- 航班/铁路班次、AMap terminal/route 与天气是分离的 provider-neutral facts，均需来源和新鲜度。
- 旅中定位允许App打开/回到前台有适用餐饮上下文时，凭仍有效的历史或本次授权单次刷新；
  同轮事件去重，不因系统撤权仍沿用旧许可。拒绝/陈旧时按计划上下文降级，不持续监听、
  后台刷新或保存轨迹，也不因候选更新修改行程。
- 行程后文本搜索先保存候选；无准确结果时可用同城已验证附近地标作显式近似路线
  代理，但目标与地标身份/事实必须隔离，时间轴落位由后续版本化命令负责。
- Provider secrets 服务端托管；BYOK 不属于 MVP 用户路径。
- Story 7.1 最近行程按 owner 聚合真实草稿/任务和当前 Plan/Trip；恢复位置独立于行程版本，
  `已生成` 不代表旅行结束。真实未完成修改与终止失败分开，重开不启动新规划。
- Story 7.2 打卡已于 2026-09-06 移出 MVP，AR16 不作为当前门槛。照片驱动标记和
  相册视频/九宫格/AI 美化仅为 FR40.1 后续方向，不新增本期相册或位置存储能力。
- Epic 7 的 7.3 账号/可用操作、7.4 结构化数据副本、7.5 停用/清理与受限恢复、
  7.6 真实反馈回执均已获批；额度不对用户展示，账号副本 ZIP 不改变行程图片规则。
  Feedback 自身交付时扩展导出/删除注册，不增加前向依赖；旧 WebView/邮件打开即成功
  语义不再有效。这里只确认目标合同，Epic 7 整体确认与后续实施门槛仍分开处理。

## Approved Epic 8 Budget Target

Story 8.4 was approved on 2026-09-13: one Node/PG budget authority, desktop Web operations,
atomic per-attempt reservations, distinct product counts/costs and conservative unknown holds.
Budget limits, tariff estimates, matched bills and independent supplier balances have different
sources. The backend/data/UX/ops shards describe the target; deployment/provider evidence remains
unverified. Story 8.5 terminal incident/outbox and desktop delivery controls were also approved on
2026-09-13; Telegram receipts are not read proof, and no-data is not service recovery. Story 8.6
overview adoption, 20 GWT and two desktop R1 boards were approved on the same date. The six
Epic 8 MVP stories and whole-Epic planning completion are confirmed (2026-09-14); final CE
workflow is complete. The 2026-09-14 IR snapshot found gaps; the user approved scoped resolutions
on 2026-09-15, tracked by the current revalidation in CURRENT.md. Historical reports remain
snapshots; business implementation and historical Sprint stay paused until the revised SP handoff.

## Document Index

- `tech-stack.md` - runtime, frameworks and infrastructure
- `source-tree.md` - actual workspace boundaries
- `frontend-architecture.md` - S0-S11 state and component boundaries
- `backend-architecture.md` - services, jobs and module ownership
- `data-models.md` - current/target aggregate and entity contracts
- `planner-orchestration-v2.md` - single-run planning, validation and enrichment
- `rest-api-spec.md` - target high-level API changes; OpenAPI remains SSOT
- `observability.md` - correlation, metrics and privacy
- `testing-strategy.md` - unit/integration/E2E/real-service gates
- `mvp-implementation-checklist.md` - Correct Course implementation gates
- `compatibility.md` - migration from v0.4 to v0.6
- `coding-standards.md` - code rules

## Authority and History

- API SSOT: `docs/api/openapi.yaml`; generated types are never hand-edited.
- DB implementation SSOT: `packages/prisma/schema.prisma` and migrations.
- UX source: `docs/front-end-spec.md` and `docs/ux/mobile-ia.md`.
- `architecture.md`, `v0.3/`, `planner-autoplace-v1.md` and UX delta files are historical.
- Where old text conflicts with v0.6, this index and its current shards win.

## Delivery Rule

Each target capability must be introduced by its assigned story with OpenAPI-first changes,
generated types, migration, ownership/idempotency/revision checks, focused tests, full build,
and real PostgreSQL/integration verification where persistence or external providers change.

---

## Source: `docs/architecture/tech-stack.md`

# Tech Stack

## Runtime and Workspaces

- Node.js 22 in WSL Ubuntu; pnpm workspace; TypeScript ESM.
- Mobile client: React 19 + Vite in `apps/mobile` (mobile-first web/PWA surface today).
- Backend: Fastify 5 in `apps/server`; modular services rather than a separate Nest runtime.
- Contract package: OpenAPI-generated TypeScript in `packages/types`.
- Persistence: Prisma 5 + PostgreSQL; PostGIS/pgvector remain target capabilities where enabled.

## Jobs, Storage and Integrations

- Application-code orchestration on existing Node/Fastify workers with BullMQ/Redis where a queue is needed; durable state, bounded retries and DLQ remain required. No n8n/low-code prerequisite or replacement framework is introduced.
- Tencent COS/CDN for re-hosted media and signed URLs.
- AMap Web API/SDK for POI, geocoding, reverse geocoding and route duration.
- External XHS downloader plus production multimodal adapter for media metadata, configurable frame
  sampling, VAD/ASR and evidence extraction; deterministic stubs are test doubles only.
- Provider-neutral `TransportScheduleLookup` for flight/rail service facts. AMap matches terminals
  and routes but is not a flight/rail schedule source. Story 2.4 must select and staging-verify a
  China-capable provider; manual exact/window/AI-decision paths remain mandatory fallback.
- Provider-neutral weather adapter with reliable-horizon metadata and seasonal fallback. The owning
  Epic 3 validation Story must select and staging-verify a source before weather-aware acceptance can close.
- OpenAI-compatible Provider abstraction with server-managed secrets, remote routing,
  quotas, timeout, retry, cost guard and circuit breaker.
  Approved 8.3 retains existing Node adapters and uses PostgreSQL as the sole route-release
  authority, with a narrow Fastify/React operator surface. Unleash retains ordinary feature flags;
  no independent LiteLLM/Bifrost service or paid configuration platform is required this release.
- Langfuse, Sentry and promptfoo for tracing, errors and offline regression.
  Approved 8.1 keeps one Sentry global OTel provider and explicitly isolated Langfuse tracing,
  with safe job/attempt correlation and independently bounded sampling. Use mature operator UIs,
  not a new Nomad dashboard. Exact SDK/hosting/paid capabilities remain implementation gates.
  Approved 8.2 uses promptfoo execution plus a minimal result/version bridge to existing Langfuse
  evaluation and human-review UI. Dedicated direct-identifier-filtered evaluation datasets are
  distinct from production traces; prompt/model trials do not publish production routing.

## Architectural Constraints

- OpenAPI first; generated files are outputs.
- No Windows-native Node/pnpm for this repository.
- External calls use adapters, timeouts, typed failure and deterministic test doubles.
- Job attempts and plan mutations carry ownership, idempotency and revision/fencing tokens.
- User-facing progress is factual state, never estimated percentage unless the provider supplies
  a durable denominator and completed count.

## Performance Targets

- UI interaction 120-200ms and stable layout through async state changes.
- Establish P50/P95 separately for import, initial planning, validation, enrichment and export.
- Provider fallback must not create a second user completion path.
- Real targets are established by the owning Epic 8 observability Story from staging traces rather
  than inherited v0.4 guesses.
- METRICS-01 starts comparable workload/version/stage/failure measurement with each first capability;
  8.1 aggregates and METRICS-02 fixes evidence-backed targets before that capability's production
  release. 8.2/METRICS-03 retains per-rule evaluation and real human review. See the dated
  implementation-prerequisites planning record; no invented runtime thresholds are introduced.

---

## Source: `docs/architecture/source-tree.md`

# Source Tree and Workspaces

```text
apps/
  mobile/           # React/Vite mobile-first client
  server/           # Fastify routes, services, SSE and jobs
packages/
  prisma/           # Prisma schema/client and persistence package
  types/            # OpenAPI-generated TypeScript contracts
docs/
  api/              # OpenAPI SSOT
  architecture/     # current architecture shards
  ops/              # limits, errors and runbooks
_bmad-output/
  planning-artifacts/
  implementation-artifacts/
scripts/            # probes and handoff checks
ops/                # deployment/staging assets
```

## Ownership Boundaries

- `apps/mobile`: presentation state and API client only; no Provider secrets or invented facts.
- `apps/server`: authentication, domain commands, orchestration, integrations and SSE.
- `packages/prisma`: persistence schema; migration required for durable contract changes.
- `packages/types`: generated from `docs/api/openapi.yaml`; do not hand-edit.
- `_bmad-output/implementation-artifacts`: story and sprint execution authority after planning.

Use `pnpm -F nomad-types run generate`, focused package tests, then `pnpm -r build` for
contract changes. The actual repository structure wins over older proposed RN/Flutter trees.

---

## Source: `docs/architecture/coding-standards.md`

# Coding Standards (TypeScript/Node)

## Language & Types
- Enable strict TypeScript. Avoid `any`; prefer precise types.
- Use explicit function signatures for exported APIs.
- Prefer discriminated unions over enums when modeling variants.

## Modules & Imports
- ES modules only; no CommonJS.
- One default export per file: avoid; prefer named exports.
- Stable public surfaces via `index.ts` barrels where helpful.

## Errors & Logging
- Fail fast with early returns; avoid deep nesting.
- Never swallow errors; include error codes aligned with docs/ops/error-codes.md.
- Structure logs; include `trace_id`/`span_id` when available.

## Async Boundaries
- Do not block event loop with CPU-heavy work; offload to jobs.
- Timeouts and retries at integration boundaries (LLM/HTTP/DB).

## Testing
- Unit: pure logic and adapters. Integration: module interactions & DB/Geo/Provider. E2E: key user journeys.
- Keep tests deterministic; snapshot only for stable payloads.

## API Contracts
- OpenAPI is SSOT. Update `docs/api/openapi.yaml` first; sync other docs.
- Validate inputs with schemas (zod/joi) near boundaries.

## Security & Privacy
- No PII in logs. Provider secrets stay server-side and never appear in frontend payloads, analytics, traces, or generated exports.
- Apply least-privilege to tokens and storage.

## Style & Formatting
- Respect existing formatting. Prettier + ESLint recommended.
- Descriptive names; avoid magic numbers; extract constants.
- Comments for non-obvious rationale only.

---

## Source: `docs/architecture/frontend-architecture.md`

# Frontend Architecture (Mobile-first)

## Operator Surface Boundary (Approved 2026-09-13)

Operator management is desktop Web only; mobile adaptation/phone screenshots are not required
for these internal pages. Reuse existing React/Fastify authorization and UI patterns, separate
from traveler Settings. Story 8.4 supplies its own budget/tariff/usage/source and receipt-recovery
path before the 8.6 overview. Operator-set limits, computed estimates, matched bills and supplier
balances remain distinct. Existing traveler mobile contracts and no-user-quota behavior still apply.

Story 1.0 supplies the real identity/session and minimal permission baseline for the first operator
write. Story 1.11 adds a focused manual place-correction page beside its existing brand-rule tool:
select an existing POI, compare provider/manual fields, edit name/address/same-city coordinates,
enter a reason, check the diff and publish/clear an override with a real receipt. Save-draft is not
publication; conflicts retain input, unknown outcomes recover the same operation. No generic
POI-merge/alias/neighbor/blacklist/bulk-rerun navigation is added. New effective facts and already
published user snapshots are distinct; public source details do not expose operator audit notes.

## Route and Stage Model

The client uses S0-S11 from the PRD. Route names may differ internally, but analytics and
user-facing transitions must preserve these boundaries:

- Home/Library: S0/S1.
- Planning input stack: S2 Time, S3 Accommodation, S4 Picker, S5 Review.
- One plan route: S6 planning state and S7 hydrated timeline; S8 is modal/loop state.
- Detail/result/export: S9-S11.

Story 5.1 delivers the minimum existing S10 route/read view and its S7 plan-level entry before the
full 5.2 enhancement: read the exact base itinerary, enter S9, inspect minimal authenticated source
details in S9, and return to the same valid date/scope/scroll/focus. Direct S9 recovery establishes a
safe S10 parent context without depending on later recent-trip metadata. 5.2 extends the same
route/query with full two-row checks, slot reading and CitationSheet; do not duplicate ResultSheet,
ValidationRun or citation authority. Navigation neither starts work nor mutates the itinerary.

Historical `/planner/pick` deep links pass through an input guard that collects missing S2/S3
data. Only S5 dispatches the PlanningJob.

## State Ownership

- **Server state:** authenticated query layer keyed by job/Trip/Plan and revision.
- **Input draft:** one planning draft containing city chain, boundaries, stays, intents, pace,
  optional additional constraints and evidence-derived interest signals.
- **Picker intent store:** normalized `poiId -> required|along_route|unselected`; overview,
  L3 rows, map markers, summaries and payload are selectors over the same store.
- **Planning state:** one `planningJobId`, durable last event and reconnect cursor; never parallel
  user-selected versions.
- **Timeline state:** server current revision plus optimistic command state; stale responses are
  rejected by revision rather than merged.
- **Presentation queues:** Home ingest processing state is separate from ten-second FIFO result
  presentation state.
- **Recent/resume state (7.1):** owner-keyed aggregate list and minimal versioned view metadata,
  not a new Plan state machine. Resolve draft/Plan/Trip aliases to current root before opening;
  restore allowed S2-S5, original job, S7/S10 context or existing S9/S11 recovery. An actual
  pending change is subordinate to the published plan, never inferred from page departure.

Do not encode server truth in component-local booleans when it affects multiple screens.

## Component Boundaries

- Home: `HomeImportDock`, queue status, recognition state, import records, `RecentTripCard`,
  `RecentTripsScreen` and shared current-root resume resolver (7.1).
- Time: `TripDateRange`, `DailyStartPicker`, `TripBoundaryRow/Sheet`.
- Accommodation: `StayNightList`, `HotelPoiField`, `BreakfastRow`, `LuggageSheet`.
- Picker: `PickerOverview`, `L2IntentSummary`, `PickerL3View`, `MapViewport`, `PoiInfoSheet`,
  `IntentTotals`; L2 status is derived and non-interactive.
- Review: `PaceSelector`, collapsed `AdditionalConstraints`, intent summary and sole start command.
- Plan: `PlanningTimelineShell`, `DayTabs`, `TimelineRow`, `HotelFooter`,
  `DayLoadSummary`, `CandidateDrawer`, `PlanGlobalHistoryControl`, `TimelineEditSheet`, `FixSheet`,
  `AiAdjustmentLauncher`.
- Linked trip: `CrossCityChoiceSheet`, `DayExcursionEditor`, `RoundTripBoundaryRows`,
  `ExcursionTimelineSection` and `DayExcursionActionSheet`. Timeline context carries an explicit
  active host/child Plan id; repeated city labels never select command scope.
- Trip adjuncts: `MealChoiceSheet`, `AreaFoodHint`, `ChecklistRail/Page/AddSheet`.
- Detail/export: `DetailPreview`, `ResultSheet`, `CitationSheet`, `ExportPreview`.
- Account copy (7.4): reuse Settings navigation with bounded request/scope, durable job status
  and protected file download. Separate generation failure, expiry, read error and download retry;
  preserve same-task resume/valid old artifact and do not infer browser save success or expose quota.
- Account deletion (7.5): scope and optional export, final confirmation and limited receipt-driven
  status. Clear/fence private state after acceptance; read failures cannot become delete failures.
  Separate online cleanup/retention, no account restore/undo, no normal account APIs via a receipt.
- Settings (7.3): reuse `SettingsScreen`, read-only account facts, typed available destination
  resolver and current-session logout Sheet. A destination independently authorizes its workflow;
  no quota dashboard, BYOK initialization or profile editor. Data/feedback workflows stay separate.
- Feedback (7.6): shared source-preserving entry, runtime-specific external launcher, minimal
  text/one-image form, opt-in diagnostics and durable receipt. Disabled upload has no failure banner
  or special text-only CTA; an unresolved image is explicitly removed through X before ordinary
  text submission. Busy upload/submit/receipt checks have no bottom actions; bounded timeout exits
  busy before recovery. Unknown external outcomes never hydrate a fake submission success.

Removed current-product components: `SmartPlanSwitch`, `HQStatusBar`, `SwitchAdoptBar`,
visible seed badges and a separate initial-completion page.

## API and Reconnect Rules

- API types come from `nomad-types`; runtime responses are validated at trust boundaries.
- SSE reconnect sends last event id/cursor and rehydrates durable job state before accepting
  transient events.
- Retry uses the same idempotency key where semantics are retry, and a new key for explicit new work.
- Planning attempt output only hydrates when its fenced current revision matches.
- Location can refresh once on app open/foreground resume when a current on-trip meal context
  exists and previous permission is still valid or permission is newly granted. Meal entry/manual
  refresh remains supported; coalesce same-activation events and respect current OS permission.
  No permission dialog on app open for ungranted users; keep plan-context candidates and offer
  contextual opt-in. Bind requests to owner, foreground session, revision, MealSlot, date and scope.
  Raw fixes are cleared after use; only short-lived scope-bound candidates/coarse basis remain.
  App-open results never navigate or replace an active Sheet draft. Sheet requests require the
  matching open Sheet; close cancels only its requests. Background/logout/revocation/scope change
  invalidates related requests and cached context, including late callbacks. No watch/timed tracking.
- Weather and route facts are rendered only with server-provided status/freshness. Unknown or
  seasonal fallback is explicit; the client never derives live claims.

## Timeline Commands

All insert/replace/move/retime/delete/fix/AI-adjust commands include expected revision and an
idempotency key. Optimistic UI may show pending state but must restore server state on conflict.
User time strings accept every valid minute; generated placement may remain 15-minute aligned.
Adjacent commute data is nullable server output.

## Performance and Accessibility

The 18-group prompt-presentation contract is approved (2026-09-15) in front-end-spec. Derive
presentation from existing typed facts: soft-only issues use one accessible low-emphasis
`有 N 项建议核对 · 查看` entry; hard/mixed issues retain visible repair access and original gates.
Place search/partial/duplicate/read failures in the affected module, preserve draft/owner/revision
and distinguish empty, failed, unknown and not-saved. Contextual detail expansion is not an extra
acknowledgment step. Counts refer to the current module/version, not an invented global checklist.
Location fallback keeps the actual planned basis visible while reasons expand on demand; stale
completed images remain usable with a neutral update notice. Necessary facts still travel with
exported files. Do not mutate validation/business state when a prompt is collapsed or dismissed.

- Approved 8.1 adds actual browser error capture, release-matched private source maps and safe
  event/correlation propagation, not a monitoring or quota page. Disable Replay/form/full request
  capture, minimize breadcrumbs/URL/error values, and never expose admin/upload credentials.
  SDK outage leaves existing user navigation/recovery intact; no new visual flow is authorized.

- Settings exposes account and available actions only. Remove BYOK initialization/form and
  all quota/usage/reset-time displays; actual job stages stay in their existing working screens.
  Unknown destination capability cannot default to available, and no read starts billable work.

- Recent trips retain same-owner cached summaries only as unverified stale summaries on refresh
  failure; no network-validated current plan means no promise of offline mutations. Auth changes
  clear private cache and outstanding responses. Restoring a missing date/anchor goes to a valid
  parent, never to a same-name guess; transient Sheets and expired undo tokens are not replayed.
- Recent loading, empty, failed and paginating states preserve Dock/list dimensions. A saved
  unfinished change uses neutral copy; only the relevant terminal task failure uses error styling.

- Virtualize long lists/timelines; preserve per-day scroll positions.
- Lazy-load map and media; core Picker remains operable in list fallback.
- Stable row dimensions prevent async badges, travel values or images from shifting controls.
- Icon-only intent/history/checklist actions require labels, selected state and disabled reason.
- Do not store Provider secrets, original cross-user source URLs or continuous location history.

---

## Source: `docs/architecture/backend-architecture.md`

# Backend Architecture

## Module Ownership

- `Auth/Account`: Story 1.0 owns production identity mapping, durable multi-device sessions,
  qualification/revocation and minimal server-side operator grants before real-user/first operator
  access. Existing pages/routes are reused; dev identity/OTP/captcha fallbacks cannot authorize
  production, and store outages fail truthfully. 7.3/7.5 consume this baseline rather than create it.
- `AccountExport` (7.4): explicit owner-scoped current-product-data capture, JSON-in-ZIP worker,
  durable task/retry and protected artifact delivery; separate from itinerary image Export.
- `AccountDeletion` (7.5): verified confirmation, atomic lifecycle/session stop and durable dispatch,
  owner inventory/step cleanup, limited progress receipts and safe retries. It cannot depend on
  feedback delivery or a future operator dashboard; ordinary logout remains a separate command.
- `HomeInputRouter`: classify natural language versus one or more supported links.
- `RecentTrips` (7.1): owner-scoped root aggregation/current-revision resolution and independent
  minimal resume metadata. It reuses PlanningInputs/TripCoordinator/job state, never owns planning
  publication or infers failure from a client leaving the page.
- `Ingestor`: one durable job per URL, normalization version, media sampling/VAD/ASR/multimodal/COS
  pipeline, evidence signals and durable SSE event log.
- `ImportRecords`: owner list/detail, source title and protected original URL.
- `GeoResolver`: AMap canonical POI, branch disambiguation, L1/L2 and BusinessArea membership.
- `PoiCorrection` (1.11): restricted desktop read/draft/check/publish/clear-override operations for
  the same existing POI's name/address/same-city coordinates. Preserve original provider snapshots,
  manual provenance, expected-version/idempotent receipts and audit. Derive one effective fact
  version for new consumers; do not merge/reidentify POIs or mutate already published user plans.
- `CandidateCatalog`: owner-scoped post-plan search/manual candidates, exact/proxy/unresolved
  location state and landmark-proxy route endpoint resolution; it never mutates the timeline.
- `PlanningInputs`: Trip date chain, boundaries, per-night stays, breakfast, luggage, pace,
  optional additional constraints and evidence-derived InterestProfile.
- `TransportFacts`: provider-neutral flight/rail lookup plus AMap terminal matching, route matrix,
  freshness and manual/unknown fallback. AMap is not a schedule provider.
- `TripCoordinator`: main Trip/segment ordering, DayExcursion lifecycle, main/round-trip
  TransferLeg boundaries and atomic TripRevision publish.
- `Planner`: complete initial place/time orchestration for one Plan or coordinated segments.
- `SlotEditor`: structural command validation, revisioned mutations and undo journal.
- `Validator`: initial and mutation-triggered derived feasibility, typed fix proposals.
- `LocationContext`: ephemeral single-fix normalization for authorized app-open/foreground-resume
  or meal-entry/manual refresh; owner/revision/meal/scope-bound read-only recall and plan fallback.
  Raw coordinates are discarded after processing; no persistent location history or app-open plan mutation.
- `WeatherContext`: reliable-horizon forecast/seasonal fallback cache with source and freshness.
- `Meals`: MealSlot pools, local revalidation and owner commercial-area recall.
- `Checklist`: TripChecklistItem commands and confirmed AI suggestions.
- `Filler`: do/prepare/notice, why, citation and quality enrichment only.
- `Export`: current-revision ResultSheet image preview/rendering, WebP/JPEG artifacts and storage cleanup.
- `ProviderGateway`: routing, attempts, quotas, timeout/retry/circuit breaker and Langfuse.
  Approved 8.3 keeps this in the existing Node adapter layer, not a required external gateway.
  PostgreSQL owns route revisions, active pointers and operation receipts; Unleash remains ordinary
  feature flags, not a second writable routing authority. A narrow protected operator surface is in scope.
- `Observability` (8.1): early API/worker bootstrap, validated safe correlation, allowlisted events,
  isolated AI tracing and independently filtered exporters. Operators query mature tools directly;
  telemetry failure cannot change domain/ledger/attempt state or wait for an operations dashboard.
- `Feedback` (7.6): validated configured destination/capabilities, minimal private first-party
  text/attachment submission, idempotent receipt lookup and authorized maintainer retrieval.
  It registers its own data with prior export/deletion handlers; no automatic third-party forward,
  ticket engine, SSO or operator-dashboard prerequisite.

## Boundary Rules

- Planner never owns account/UI state; Filler never changes schedule; Validator never bypasses
  command ownership/revision checks.
- SlotEditor rejects malformed, unauthorized, outside-trip and immutable reservation/ticket
  commands. Derived opening/travel/load issues are persisted as validation state after mutation.
- External evidence is stored with source/time/quality and inferred/confirmed/rejected/expired state.
  Inferred reservation/ticket evidence is not an immutable lock or proof of booking.
- Administrative district and L2 are not substitutes for BusinessArea.
- A nearby landmark may act only as an explicitly approximate route endpoint for a manual target.
  CandidateCatalog keeps both identities and prevents target facts from inheriting landmark facts.
- Raw source URL is returned only through owner-authorized import detail.
- Dedicated content-moderation service integration is deferred by the 2026-09-15 scope decision;
  keep file/schema/size/decoder/source/owner and untrusted-input protections. Do not claim an
  unperformed review passed or add support for new upstream platforms from this deferral.
- Feedback may receive only explicit text/selected screenshots and opt-in allowlisted diagnostics.
  Opening a URL or an email client is not receipt proof. Committed text plus verified attachment
  is first-party receipt truth; a deleting owner cannot upload, finalize or recreate a report.
  Temporary-object cleanup preserves valid accepted attachments and clears abandoned ones.

## Brand Rule Governance (Approved CE-01, Story 1.11)

Ship the minimal desktop operator view/edit/draft/check/publish path with the first brand-rule
consumer. Reuse existing auth and Node/PG patterns, granting minimal server-verified permissions
without relying on 8.3/8.6. Validate bounded rule fields; no arbitrary scripts or outbound URLs.
Persist immutable rule version, active pointer and audit receipt atomically with expected version
and operation idempotency. Each ingest/geo attempt pins its first-used version for filtering and
retries. Verify actual hot loading/use; missing required versions wait/fail boundedly, never mix
rules or reprocess completed records automatically. Failure/conflict preserves the prior policy.

## Provider Route Publication

Approved Story 8.3 (2026-09-08), not an implemented control plane:

- Use a finite registry of implemented task/adapter/connection/model capabilities. Validate every
  primary/backup against modality, tools, output schema, context and bounded parameters. Store only
  approved secret/endpoint references; no arbitrary URL, headers, executable config or secret values.
- Save versioned drafts separately. Static checks incur no model calls; real capability probes
  require separate authorization and bounds. Evaluation references follow 8.2's per-rule policy;
  neither scores nor Langfuse labels automatically promote a production release.
- Publish the exact checked content with expected-current-version and operation idempotency in
  one PostgreSQL transaction with audit receipt. Preserve unchanged tasks. Unknown outcomes are
  reconciled through that operation; concurrent edits cannot overwrite a newer publication.
- Bind the authoritative route/prompt/model/adapter snapshot at task acceptance, including queued
  work. New acceptance cannot silently use stale cache when the current pointer is unknown.
  Workers/retries resume the exact accepted snapshot, retaining referenced versions until safe
  cleanup. A floating gateway alias is not a snapshot; missing content cannot select another version.
- Distinguish stored publication, instance loading and actual attempt use. Missing/disconnected
  instances and no new traffic remain unknown/pending, not evidence of global activation.
- Ordinary releases affect only later accepted tasks. Separate durable pause controls, checked
  before future primary/retry/backup requests, have bounded freshness and measured propagation.
  Expired safety authority stops new outbound calls; already-sent responses follow the original
  business/fencing contract. Pause does not promise cancellation, undo charges or restart jobs.
- Explicit resume rechecks current permissions/capabilities/budgets and does not clear a real breaker
  without recovery evidence. Rollback creates a new monotonic release from compatible retained
  content; it never clears pause restrictions or changes Plan/Trip/accepted-task snapshots.
- Existing budget/concurrency/deadline/fencing protections apply to each actual attempt; one retry
  owner prevents SDK/worker/optional-gateway multiplication. Do not concatenate partial outputs,
  repeat committed tool actions or use alternate models to bypass input/permission/safety rejection.
- LKG must be validated for source/environment/content and safety freshness. No trusted baseline
  means the affected capability cannot call out. Earlier first-use safeguards remain mandatory;
  centralized budget accounting, Telegram and overview are separate later stories.

## Budget Publication and Accounting (Approved Story 8.4)

Approved 2026-09-13: use the existing Node adapters and one PG-backed budget authority with
minimal desktop Web policy/tariff/usage/source operations. This is a target, not running code.

- Budget/tariff revisions, active pointers and expected-version operation receipts are independent
  of 8.3 frozen routes. Logical product grants attach atomically to Job acceptance; each real paid
  attempt separately reserves sufficient bounded cost in all applicable scopes/windows.
- Use existing short PG/Prisma transactions, unique attempt/operation identities and consistent
  locking. Persist fenced send intent and expiring dispatch permission; no network calls inside
  retried DB transactions. Recheck current pause/budget/eligibility at each actual dispatch.
- Unsent, in-flight/unknown, estimated and confirmed amounts cannot double-count exposure. Known
  facts settle idempotently; late attempts cannot publish through stale fences but still cost money.
  Release only proven-unsent exposure; expiry/abort cannot prove upstream cancellation.
- Tightening may leave genuine overage and stop new calls while sent work settles; rollback creates
  a new policy, not ledger undo. Window rotation preserves history/unknown risk and revalidates
  unsent work. Job and actual-call concurrency are separate; queues do not hold outbound slots.
- Actual-seller tariff evidence defines unit/currency/model/tier/effective version. Usage times
  tariff is estimated. Per-call cost receipts, aggregate bills and independent account balances
  each expose their actual capability/coverage/time; no common supplier billing API is assumed.
- The Web surface shows source-aware amounts and unavailable/stale/unknown states. No operator
  mobile adaptation, new gateway, billing product or 8.6 dependency. Unknown bounds/authority stop
  new paid dispatch; existing safe manual/read paths follow their original contracts. Implement
  OpenAPI-first, minimal entities, real PG/provider failure tests and 7.5 cleanup when developed.

## Terminal Alerts and Notification Delivery (Approved Story 8.5)

Approved 2026-09-13: eligible durable AI/AMap facts -> PG incident/episode and unique outbox ->
fenced worker -> thin Node Telegram sendMessage adapter. Reuse 8.1 diagnosis and 8.3/8.4 safety
facts; no additional gateway, Alertmanager, full Bot service or webhook/getUpdates prerequisite.

Source event IDs/cursors and authoritative sequence support replay. Incident transitions and
outbox creation are atomic; send HTTP remains outside DB retries. Notification policy drafts,
expected-version publication/receipts, target aliases and bounded mute live behind real desktop
operator permissions. Before each send, validate target/episode/sequence/mute/deadline and fence.

Success records Message identity, not recipient read state. Unknown external outcomes/failed
receipt writes retain possible duplicate delivery; one persistent retry scheduler owns rate,
retry_after and exhaustion. Deterministic auth/target failures require controlled repair. Recovery
uses same-scope business evidence; absent data/tool closure cannot resolve an incident. New
fault episodes reject old recovery, and stale unsent messages are canceled/merged appropriately.

No alert operation changes committed Job/Plan, ledger or retry/breaker truth. Minimal Web status,
source/attempt evidence and separately authorized TEST actions work before 8.6. Safe text/links
and token-path redaction apply before every exporter. Real PG, target permission, send/unknown
fault and desktop verification accompany this Story's future API/DB implementation.

## Read-only Operations Summary (Approved Story 8.6)

Approved 2026-09-13: expose a small authenticated desktop summary using fixed source/metric
registrations, permitted fields and bounded parameters. Read existing task aggregates, sealed
8.2 reports, 8.4 budget results, 8.5 incidents and 8.3-8.5 configuration evidence; no new writable
metric/ledger/incident authority or general SQL/URL proxy.

Each source independently returns its scope/window, coverage, data/fetch time and state. Cache
keys include effective permissions/environment/filters/definition; coalesce identical requests,
limit concurrency/rows/windows and honor source quotas. Source failure is partial, stale data
is labeled, and late results cannot cross filter/account changes or revoked access. Read work
has bounded connection/resource use and does not compete without limit with budget transactions.

Protected native-tool links preserve supported filters and target authentication. Data API keys
stay server-side; browser view roles are not source credentials. No query invokes model runs,
evaluation, test messages, ledger correction, route publication or incident recovery. Implement
only required read contracts/OpenAPI/generated types and cache definitions; real source version,
permissions, API availability and fault/desktop verification are mandatory at delivery.

## Jobs and Attempts

- `IngestJob`: one URL, multiple jobs allowed, durable stage and reconnectable title/counts;
  ordered IngestEventRecord rows survive process restart and back the SSE cursor.
- `PlanningJob`: one user-visible job per start command.
- `PlanningAttempt`: internal provider/deterministic attempts fenced by job generation and target
  revision. Only one attempt can publish the current result.
- `FillJob` and `ExportJob`: bind exact Trip/Plan revision; retry cannot silently switch input.
  ExportJob also binds include-details, width, export-unit policy, theme and output-policy versions;
  reconnect resumes the same fenced job, while a newer current revision makes an ungenerated preview
  stale. Export units are derived from revision scope, never accepted as client-authored day slices.
  Story 5.5 deterministically composes a cached whole-trip delivery set from the same successful
  snapshot/manifest. A tested, versioned `TripLongLayoutPolicy` normally yields one part and, only
  when adding the next complete main-city section would exceed a safe limit, closes the current part
  and starts the next city in a numbered part. Each section already embeds DayExcursions at their host
  dates. Composition preserves chronology, makes no AI/planning call and consumes no second export
  allowance. ZIP and city-internal splitting are forbidden.

`AccountExportTask` seals a consistent dataset snapshot before bounded packaging. Technical retries
retain that snapshot and schema/scope versions; pre-seal recapture honestly updates snapshotAt.
Only verified complete ZIP/manifest publication makes the task ready. One active owner task and
idempotent receipts prevent repeated-click jobs. Reopening reads existing task state; old valid
artifacts survive a failed explicit regeneration. No new AI/AMap/XHS call fills missing data.
Normal logout does not cancel an accepted export; account eligibility gates capture/publish/download.

Account deletion accepts only after the owner lifecycle, session revocation, task and dispatch
intent commit together. A deleting owner cannot issue normal sessions, read protected data or
publish late job output; each entry/worker commit checks persistent eligibility across restarts.
Inventory object/trace refs before cascades, clear full owned history and credentials, and use
reference-safe shared GC. Persist every required store disposition and retry remaining work only.
Online cleanup completion never silently means backup erasure; retention policy and restore replay
must be verified. Status receipts are not general auth and retry needs a separate scoped grant.

Queue/DLQ jobs use idempotency keys, capped exponential backoff and explicit terminal state.
Application-code workers orchestrate external steps with the existing framework and necessary queues.
Worker memory, callbacks and queues cannot become domain truth; durable state, attempt fencing,
idempotency, bounded retries/DLQ and restart recovery remain independent of the execution mechanism.
No n8n or other low-code platform is required.

## SSE Contracts

For 1.11 manual POI correction, worker/route reads pin `PoiFactVersion`; caches of routes and derived
facts include endpoint versions. In-flight work keeps its pinned version and old published snapshots
are never rewritten on correction publication. Provider and operator races require fresh validation
against the expected base; unknown publish outcomes recover the original operation, not blind replay.

- Ingest: `created -> fetching -> parsing -> geo -> storing -> done|failed` plus factual counts;
  parsing diagnostics use media_prep/speech_detect/frame_extract/asr/multimodal, with legacy
  text/ocr/vision accepted only for compatibility.
- Planning: `accepted -> context -> constraints -> candidates -> arranging -> validating ->
  persisting -> done|failed`, with generic `fallback` when internal route changes.
- Events contain sequence/cursor, job id, trace id and durable state version. UI stage labels are a
  mapping; no invented percentage.

## Security, Privacy and Cost

- Provider secrets remain server-side and are redacted from logs, traces, exports and errors.
- Every owner resource query is scoped before lookup; UUID opacity is not authorization.
- Rate limits and budgets apply by user/device/workspace and task class, with operator kill switch.
- Foreground location is minimized and not written as a continuous trajectory.
- COS uses private objects and expiring signed URLs; deletion and retention are auditable.

---

## Source: `docs/architecture/data-models.md`

# Data Models (v0.6 Target)

This shard defines target domain contracts. `packages/prisma/schema.prisma` describes what exists
today; every missing target entity requires its assigned story, migration and tests.

## Production Identity (Story 1.0)

Story 1.0 introduces only the stable internal owner/verified identity binding, shared durable
session/qualification and minimal server-controlled operator grants needed for real login and
protected reads. Verified identities are unique; display names or unverified phone/email equality
cannot merge accounts. Old owner migration preserves proven ownership and isolates ambiguous data.
Multiple sessions coexist; current logout revokes one, a durable account-ineligible state blocks
all ordinary sessions. Story 7.5 later supplies actual deletion acceptance/cleanup, not this
authentication prerequisite. No account merge, self-unlink or device-management UI is created.

## Inspiration and Geography

- `IngestJob(id, userId, normalizedUrl, normalizationVersion, sourceTitle?, status, stageVersion,
  lastEventSeq, counts, error, ...)`.
- `IngestEventRecord(ingestJobId, seq, stage, substage?, payload, occurredAt)`; ordered durable cursor.
- `ImportRecord(id, userId, ingestJobId, normalizedUrl, normalizationVersion,
  originalUrlProtected, sourceTitle, ...)`;
  unique MVP privacy boundary: `(userId, normalizedUrl)`.
- `CanonicalPOI(id, provider, providerId, cityId, standardName, address, geog, hours?, rating?,
  averageCost?, phone?, categories, providerObservedAt, quality, providerSnapshotRef?)`.
- `L1Area`, `L2Group`, `PoiL2Membership` retain regional/route grouping.
- `BusinessArea(id, cityId, providerRef?, name, geog?)`.
- `PoiBusinessAreaMembership(poiId, businessAreaId, source, confidence, reliabilityState,
  policyVersion, observedAt, expiresAt?)`; zero-to-many.
- `Inspiration(userId, importRecordId, canonicalPoiId?, evidence, sourceAttribution, quality, ...)`.
- `EvidenceSignal(id, inspirationId, poiId?, kind, value, sourceRef, observedAt, quality,
  confidence, state=inferred|user_confirmed|rejected|expired)`; kinds include reservation/ticket,
  hard-time, no-queue and interest signals. Only `user_confirmed` or independently verified
  booking/ticket facts may create an immutable planning lock.

BusinessArea is normalized data, not a free-text field on POI. Owner-scoped food recall joins
Inspiration ownership to verified CanonicalPOI and membership accepted by a versioned reliability
policy. The policy defines source precedence, confidence, expiry, conflicts/multi-membership and
food-category evidence; unknown membership is never silently promoted.

## Brand Rule Versions (Approved CE-01, Story 1.11 Target)

Create only the minimal brand-rule draft/revision, active reference and publication receipt needed
by 1.11. Keep allowed rule fields, actor/scope, expected base, version/hash, operation identity,
result and usage evidence; each ingest/geo attempt retains its first-used rule reference. This is
not a generic configuration platform or an 8.3/8.4 policy table created early. Historical POI/import
results are not rewritten on publication. Real permission, concurrency and hot-update tests apply.

## Manual POI Corrections (FR4.2, Story 1.11)

Keep the provider snapshot immutable and store a minimal `PoiCorrectionDraft/Revision` containing
the existing CanonicalPOI identity, expected base provider/effective version, allowed field mask
(display name/address/same-city coordinate), proposed values, reason/evidence references, actor,
time, operation identity and audit receipt. Publication atomically advances the correction pointer.
An effective immutable `PoiFactVersion` binds the provider snapshot and applied correction version;
manual fields retain manual provenance, others preserve nullable provider facts/freshness. Publishing
or clearing an override creates a new version; later provider refresh never silently overwrites it.

Coordinate edits retain `inputCoordinateSystem`, the original point/source, normalized coordinate
system/value and `transformPolicyVersion`. The existing geographic adapter owns the allowed-system
list and versioned normalization; unknown/unsupported systems are rejected, never guessed. Validate
range and same-city/identity after normalization, and use normalized versioned endpoints for routes.
The chosen map/input surface must supply its real coordinate provenance; a numeric pair alone is
insufficient to publish. Applicable schema and transform fixtures are part of 1.11 implementation.

Do not change provider id/city/branch identity, merge/delete POIs or infer hours/rating/phone/prices
from a location correction. Consumers pin the effective fact version at first use; route caches
include both endpoint versions. Old import/job/Plan/Trip/Stay/Export snapshots stay bound to their
original facts. A corrected global record is not a user-authorized plan mutation. Public detail can
show field source/time, never internal notes or operator identity; private audit registers with the
existing account-data/retention/deletion boundaries without treating global POI facts as private
operator-owned travel data. No generic admin or correction batch platform is introduced.

## Planning Inputs and Intent

- `PlanningDraft(id, userId, orderedCityIds, overallRange, dailyStart, pace,
  additionalConstraintText?, parsedConstraints, interestSignals, revision)`.
- `TripBoundary(direction, inputMode, mode, serviceCode?, exactAt?, windowStart?, windowEnd?,
  terminalPoiId?, source, provider?, observedAt?, validUntil?, confidence?, status)`;
  `inputMode=exact|window_2h|ai_decide`. Provider facts, user-entered facts and AI-provisional
  boundaries use distinct source/status values; stale schedule facts never become confirmed by omission.
- `StayRevision(id, tripOrDraftId, logicalStayId, revision, checkInDate, checkOutDate,
  accommodationPoiId?, accommodationName?, leaveBlank,
  breakfast=included|not_included|unknown, source, createdAt)`; immutable snapshot row.
- `PlaceIntent(planOrDraftId, poiId, intent=required|along_route|unselected, source, revision)`.
- `PlanCandidate(id, userId, planId, displayName, source=user_search|user_manual|planner,
  canonicalPoiId?, locationMode=canonical|landmark_proxy|unresolved, landmarkPoiId?,
  landmarkAddressSnapshot?, proxyGeog?, provenance, revision, createdAt)`.
- `InterestSignal(tag=classic|food|nature|photography|heritage|niche|shopping|exhibition,
  sourceRef, confidence, observedAt)`; soft and never a substitute for user intent.

`same_as_previous` is a UI command, not persisted final truth. It copies accommodation/breakfast
into a new StayRevision and recomputes the contextual luggage default.

For `landmark_proxy`, `displayName` remains the user's target and `landmarkPoiId` must reference a
same-city verified CanonicalPOI. The landmark supplies only a route endpoint snapshot. It never
becomes `canonicalPoiId`, and none of its exact address, hours, rating, price, phone or reservation
evidence may be copied onto the target. `unresolved` candidates have no route endpoint.

## Trip and Plan Aggregates

- `Trip(id, userId, title, timezone, currentTripRevisionId, state)`.
- `TripSegment(id, tripId, ordinal, cityId, planId, startDate, endDate)`.
- `DayExcursion(id, tripId, hostSegmentId, localDate, destinationCityId, planId, state)`; its Plan is
  single-city but is not a peer in the main TripSegment order.
- `DayExcursionRevision(id, logicalExcursionId, tripId, parentId?, hostSegmentId, localDate,
  excursionPlanRevisionId, outboundTransferRevisionId, returnTransferRevisionId, status)`.
- `Plan(id, userId, cityId, currentRevisionId, state)` remains single-city.
- `PlanRevision(id, planId, parentRevisionId?, status, createdBy, validationState, ...)`.
- `DayPlanSlot(id, planRevisionId, dayIndex, kind, startAt, endAt, poiId?, candidateId?, origin,
  lockState, ...)`; a proxy-located candidate remains distinct from its landmark after placement.
- `TransferLegRevision(id, logicalTransferId, tripId, revision, contextKind, fromPlanId, toPlanId,
  fromSegmentId?, toSegmentId?, dayExcursionId?, mode,
  serviceCode?, status, departPoiId?, arrivePoiId?, scheduledDepartureAt?, scheduledArrivalAt?,
  accessMinutes, waitMinutes, travelMinutes?, arrivalBufferMinutes, egressMinutes,
  handoffStartAt, handoffEndAt, source, confidence, observedAt)`.
- `LuggageTransitionRevision(id, logicalTransitionId, tripId, revision, date, fromStayRevisionId?,
  toStayRevisionId?, mode, storagePoiId?, dropOffAt?, pickUpAt?, status, source)`.
- `TripRevision(id, tripId, parentId?, segmentPlanRevisionRefs, dayExcursionRevisionRefs,
  transferRevisionRefs, stayRevisionRefs, luggageRevisionRefs, status)`.

A Trip owns an ordered collection of TripSegments without a domain-level city-count ceiling. Each
segment points to one single-city Plan, each adjacent pair has at most one active logical transfer,
and a city may not reappear as a later main segment after the chain has left it in the MVP. The same
append/insert input contract applies no matter how many segments already exist; implementations must
not encode fixed second-city or third-city fields.

A DayExcursion belongs to exactly one host segment and one host local date. It references a distinct
destination-city Plan plus exactly two transfer revisions: `day_excursion_outbound` from host Plan
to child Plan and `day_excursion_return` from child Plan to host Plan. Both legs and all child slots
must fall on the same local date/timezone. The host Plan owns only the usable interval before outbound
and after return; the child Plan owns only the interval between them. A host day has at most one
DayExcursion and cannot also contain a main-chain handoff. The destination has no Stay, and host Stay,
breakfast and luggage references remain unchanged. Domain identity and commands use Trip/segment/
excursion/Plan/date ids, never city-name strings, so the repeated host name is only display text.

A published TripRevision references a complete, immutable set. Draft/failed transfers prevent
joint publication. A DayExcursion publishes only when its child PlanRevision and both confirmed
TransferLegRevisions are present in the same successor TripRevision. Cross-timezone or overnight
return, repeated-city main chains, nested excursions, same-day A-B-C-A and arbitrary segment reorder
are outside the MVP invariant.

Primary luggage labels map to typed modes: `keep_at_previous_stay`, `take_to_next_stay`,
`store_at_transport_hub`, with secondary `carry`, `courier`, `private_vehicle`, `other`,
`no_large_luggage` and `undecided`. The first night cannot use `keep_at_previous_stay`; storage
requires drop-off/pickup; a one-way departure cannot leave luggage behind without an explicit
return pickup.

## Recent Trips and Resume (Story 7.1)

- `RecentTripEntry` is an owner-scoped read model, not another itinerary authority. It resolves
  existing saved PlanningDraft/Job/Plan/Trip identity into one user-visible root with current
  published refs, actual input/job state, known city/date summary and optional actionable change.
  A published draft or a standalone Plan incorporated into a Trip must not produce duplicate rows;
  child Plan/DayExcursion ids resolve to the owning aggregate only after authorization.
- `RecentTripResume(ownerId, targetKind=planning_draft|plan|trip, targetId, view,
  activePlanId?, hostSegmentId?, dayExcursionId?, localDate?, scrollAnchorRef?, revisionHint?,
  resumeVersion, browserSessionId?, clientSequence?, lastOpenedAt)` is minimal durable view state.
  Exact storage layout may reuse existing metadata, with an owner/root unique key and necessary
  query indexes. Allowed view/scope/anchor values are validated against the current aggregate;
  arbitrary URLs, source contents, private prompts and location trails are not stored here.
- User-successful-save activity comes from existing input/mutation truth; opening is a separate
  metadata write. Recency uses server time plus stable id, never worker/SSE/export heartbeats.
  Cursor pagination binds a stable listing snapshot; writes use expected resume version and
  session sequence fencing so delayed positions cannot overwrite newer accepted positions.
- Published state and pending change are orthogonal. A change entry requires an actual owned,
  still-actionable draft/task tied to its input revision. Half-filled input is unfinished, queued/
  running uses actual progress, and failure requires the relevant current terminal task/attempt.
  Discarded/published changes disappear; older failures cannot override a newer draft.
- Browsing metadata never creates PlanRevision/TripRevision or check-in. Current Trip lookup reads
  one atomic revision set, not each child's independent current pointer. Invalidated anchors fall
  back to valid parents; auth failure is not interpreted as empty or unchecked data.

Story 7.2 check-in is excluded from MVP by the 2026-09-06 scope decision. AR16 is deferred, not
a current readiness gate. No VisitOccurrence/VisitState/binding migration or `checked` flag is
required by recent trips, meal recall or replanning. FR40.1 photo-driven recognition and media
outputs require a future design; its schema is not defined by the retired manual proposal.

## Platform Budget Accounting (Approved Story 8.4 Target)

Approved 2026-09-13; conceptual responsibilities, not already-existing Prisma tables:

- Budget/tariff revisions and active pointers: scoped limits/windows, actual seller price evidence,
  immutable versions and audit operation receipts; policy revision never creates a fresh empty ledger.
- Product usage grant: one owner/logical Job or export identity, acceptance rule/window and
  at-most-once finalization/refund. Physical attempts do not multiply product counts.
- Budget buckets/reservations: exact units/currency, stable scope/window, atomic multi-scope
  reservation for a unique physical attempt, with route/tariff version and bounded upper cost.
- Dispatch permits: attempt/fence, control version and validity plus durable send intent. Task and
  external concurrency are distinct, and expiry cannot erase possible upstream costs.
- Settlement/adjustment: mutually exclusive unsent/in-flight/unknown/estimated/confirmed exposure,
  original window and evidence, with idempotent corrections and truthful overage.
- Supplier evidence: safe account/capability reference, receipt/bill coverage and independent
  balance snapshot state/time. Aggregate bills do not fabricate individual charges.

Use precise amounts and bounded retention, never store private prompts/locations/URLs/secrets.
Register personal links with 7.5 cleanup while preserving necessary non-identifying platform totals.
Create actual tables only when implementing this Story; no subscriptions/payments or future alerts.

## Terminal Incident Records (Approved Story 8.5 Target)

Approved 2026-09-13; create these responsibilities only when implementing the Story:

- Eligible source fact/cursor: stable event identity, safe registered scope, authority sequence and
  observed/event times; replay cannot count one failure twice and sampling is not the source ledger.
- Incident episode: stable fingerprint, distinct lifecycle ID, current/source version, exact first/
  last times/counts and recovery evidence. A new episode cannot be closed by an old recovery.
- Notification policy/target revision and mute: approved alias/secret/topic references, bounded
  intervals/expiry, CAS operation and audit receipt. Mute does not change business availability.
- Notification/outbox: unique episode/sequence/type/target, safe content snapshot, next-send/expiry
  and fenced lease. Delivery attempt: send intent, definitive refusal, unknown or validated
  Message ID/receipt time. Do not store raw Telegram chat objects or token-bearing URLs.

Incident/outbox changes are atomic; HTTP is not. Preserve unknown and late evidence, bounded
retention and source replay. Telegram copies have their own lifecycle; deleting a local record
cannot claim external withdrawal. No people/on-call/phone escalation or user-facing quota tables.

## Operations Summary Read Models (Approved Story 8.6 Target)

The overview derives read summaries from prior authoritative entities and reports. A source/metric
registration may describe definition version, allowed environment/project/fields, units, supported
filters, actual history/API limits and trusted link destinations. It does not create a second
budget, evaluation or incident model. No general analytics warehouse is introduced.

A bounded result/cache carries effective visibility, requested/covered window, source/fetch times,
nullable coverage and sampled/extrapolated/estimated/actual/unknown state. Invalidate on permission,
source or definition changes. Do not store raw user content or client-visible source credentials;
only create persistence actually required by the chosen implementation, not future platform tables.

## Jobs, Editing and Undo

- `PlanningJob(id, tripId?, planId?, inputRevision, status, currentAttempt, resultRevision?, ...)`.
- `PlanningAttempt(id, planningJobId, generation, provider, strategy, status, outputRef?, ...)`.
- `PlanCommand(idempotencyKey, ownerId, expectedRevision, type, payload, resultRevision, ...)`.
- `UndoEntry(scopeId, commandId, inverseCommand, expiresAt, eligibility, consumedAt?)`.
- `ValidationRun(inputRevision, status, hardCount, softCount, conflicts, suggestions)`.
- `RouteFact(fromRef, toRef, mode, durationMinutes?, distanceMeters?, source,
  observedAt, validUntil?, status=known|unknown|stale,
  endpointResolution=exact|landmark_proxy)`; endpoint refs may resolve a CanonicalPOI or a
  PlanCandidate proxy snapshot without changing candidate identity.
- `WeatherContext(areaId, localDate, kind=forecast|seasonal, condition, source,
  observedAt, validUntil?, quality)`; cached context, never a booked/user fact.
- `DayLoadEstimate(planRevisionId, dayIndex, level, coreItemCount, activeMinutes,
  commuteMinutes, walkingStepsLow?, walkingStepsHigh?, earliestStart?, latestEnd?,
  freeMinutes, reasons, confidence)`.
- `ExportJob(id, ownerId, targetKind=plan|trip, targetRevisionId, includeDetails, widthPx,
  exportUnitPolicyVersion, themeVersion, outputPolicyVersion, status, currentAttempt, lastEventSeq,
  artifactRefs, outputFormat=webp|jpeg, fallbackReason?, generatedAt, expiresAt, ...)`.
- `ExportArtifactRef(ordinal, scopeKind=standalone_plan|main_segment|day_excursion, scopeId, cityId,
  startDate, endDate, objectRef, format, bytes, checksum)`; the ordered set is derived from the exact
  revision. One ref represents one complete city-unit long image, and different scope identities are
  never merged by city name. Every object is private and owner-authorized. Internal PNG/strip renders
  may exist transiently but are not public output states.
- `TripLongSection(mainSegmentOrdinal, mainPlanRevisionId, cityId, chronologicalBlocks,
  embeddedDayExcursionRefs)`; derived from the immutable export snapshot. One section contains one
  complete main-city segment and every DayExcursion at its real host date, so delivery splitting
  cannot detach an excursion from the host chronology.
- `TripLongLayoutPolicy(version, widthPx, format, maxRasterHeightPx, maxDecodedPixels,
  maxMemoryBytes, maxEncodedBytes, testedBrowserEncoderMatrixRef, status)`; limits are published only
  after supported browser/device and WebP/JPEG staging tests, not guessed from city count.
- `ExportDeliveryArtifactRef(kind=trip_long_part, partOrdinal, partCount, startSectionOrdinal,
  endSectionOrdinal, sourceManifestChecksum, layoutPolicyVersion, objectRef, format, bytes, checksum)`;
  the ordered set is deterministically derived from the same immutable export snapshot, unit policy
  and theme. A normal Trip has one `1/1` part. If adding the next complete city section would cross
  the policy, the current part closes and that city starts the next part; every part displays `N/总数`.
  A standalone Plan may reuse its sole `ExportArtifactRef`. ZIP, city-internal/date splitting and
  hidden part boundaries are not delivery states.

Only the current fenced attempt may publish. Undo history in MVP exposes the live eight-second
entry plus one latest additional eligible entry, not arbitrary snapshot browsing.
Export retry/reconnect keeps the original revision and settings; it cannot adopt a newer current
revision. A stale preview must start a new idempotent request against the newer revision.
Whole-trip delivery composition reuses the successful ExportJob snapshot and does not invoke AI,
replan, create a PlanRevision or consume a second export allowance. One user command owns the whole
ordered delivery batch. Directory-capable clients may write all parts after one permission grant;
other clients use controlled multiple-download permission and keep an honest blocked/retry state.
If one indivisible city unit still exceeds the versioned WebP/JPEG budget, that part fails explicitly
without cutting through the city, while already generated city artifacts remain readable/shareable.

## Client Download Evidence (Approved CE-03)

ExportJob/manifest completion describes available server artifacts, not local device saving.
Per-part client results distinguish confirmed write completion, known failure, not started and
save-unknown. Normal browser handoff renders `已开始下载，请确认` and keeps save-unknown; a user
reminder is not a device write receipt. Retry uses the same manifest: only confirmed incomplete
parts can be selected automatically, and unknown parts need an explicit retry with duplicate risk.
No new account-billing, server save-success or per-file human-confirmation subsystem is introduced.

## Account Data Copy (Approved Story 7.4 Target)

- `AccountExportTask(id, ownerId, idempotencyKey, scopeVersion, schemaVersion, status,
  stage, currentAttempt, snapshotRef?, artifactRef?, lastEventSeq?, safeError?, createdAt)`;
  distinct from image ExportJob and account deletion. One active task per owner; queue is not truth.
- `AccountExportSnapshot(id, ownerId, snapshotAt, schemaVersion, scopeVersion, sealedAt,
  exactRevisionRefs, datasetRef)` binds a consistent capture of allowlisted mutable product fields
  and complete immutable Plan/Trip/DayExcursion/Transfer/Stay/Luggage refs. Capture cutoff is not
  queued time; once sealed, technical retries use the same snapshot, not live current pointers.
- `AccountExportArtifact(id, taskId, ownerId, snapshotRef, objectRef, filename, bytes, checksum,
  generatedAt, expiresAt, state)` describes private JSON-in-ZIP with a versioned manifest and guide.
  Actual object integrity and category completeness precede atomic ready publication.

Include current safe account/preferences, saved drafts/itineraries, owner import/inspiration index
and annotations, checklist and composed itinerary text. Exclude old revisions, raw media, rendered
image exports, internal prompts/evidence/logs, device trails, secrets, protected source/signed URLs
and other owners' data. A failed category is not an empty category; missing content cannot produce
a falsely complete package. New generation captures fresh data; download retry reuses valid bytes.
Retention/expiry removes export snapshots/artifacts, not source records. Eligibility is checked on
capture, publication and download; ordinary logout does not cancel the task. The full account-delete
lifecycle remains Story 7.5, not an extra prerequisite for this vertical slice.

## Account Deletion (Approved Story 7.5 Target)

- Durable owner lifecycle/deletion epoch fences ordinary sessions, new session issue, reads/writes,
  SSE/artifact access and final worker publication. Test headers/in-memory session loss are not
  production revocation; a fixed phone-derived id cannot reactivate a deleted account.
- `AccountDeletionTask(id, ownerRef, lifecycleVersion, confirmationRef, idempotencyKey,
  policyVersion, status, currentAttempt, checkpoints, createdAt, onlineCleanupCompletedAt?)` and
  minimal `DeletionCleanupStep(taskId, storeClass, opaqueHandles, disposition, evidenceRef?,
  safeFailure?, retryState)` persist acceptance, inventory and incomplete work before owner cascades.
- Prepare a narrowly scoped status receipt before destructive commit; store only protected proof
  hashes and bounded metadata. Receipt reads do not authorize cleanup writes or ordinary account
  access. Retry grants require separate limited verification. Recovery must survive loss of the
  acceptance response and normal-session revocation without issuing a new active account.
- A transaction binds lifecycle stop, session revocation, task and durable dispatch intent;
  retryable outbox publication prevents queue failure from losing cleanup. Workers quiesce/fence
  old jobs and record late temporary objects before bounded, idempotent cleanup of all owned history.
- Shared ACL/ref removal plus reference-safe GC protects other owners, including concurrent imports.
  No remaining private annotation/evidence may be promoted to a public pool because of deletion.
- Versioned retention dispositions distinguish verified online erasure/anonymization from isolated
  backups/minimal justified records; unknown cleanup is not complete. Receipts/tombstones themselves
  have explicit minimal retention and restricted access. Restore replays deletion state before
  opening service; later explicit registration uses a fresh owner identity with no former content.

## Feedback (Approved Story 7.6 Target)

- `FeedbackSubmission(id, ownerId, idempotencyKey, payloadHash, text, attachmentRef?,
  optedInDiagnostics?, schemaVersion, policyVersion, receivedAt)` is a private first-party record.
  Same owner/key/payload resolves to one receipt; changed payload cannot overwrite accepted data.
  Text plus ready attachment reference commit atomically before received status is returned.
- A purpose/owner/draft-bound upload ticket and temporary-object record bind allowed raster type,
  byte/pixel policy, expiry and final verification. Remove EXIF/location metadata, reject foreign
  object ids/remote URLs and fence final binding against account deletion. Receipt identity is not
  authorization. Normal accounts read only their own; maintainer retrieval needs server role checks.
- Local draft/request recovery is owner-bound and TTL-limited, with no auth tokens. Unavailable
  selected file bytes require reselection; unresolved selected attachments cannot be silently omitted.
  Receipt verification has bounded waits and is not a new submit command.
- 7.6 registers report text and safe attachment indexes with 7.4 export, excluding screenshot bytes,
  and registers reports/temporary/final objects with 7.5 deletion. Before 7.6 exists, those stories
  remain independently complete; they do not require a future feedback table. No claim is made to
  capture or delete Tencent-only posts from opening its website.

## Meals, Checklist and Detail

- `MealSlot(id, planRevisionId, dayIndex, mealType, mode=fixed_anchor|choice_pool|undecided,
  startAt?, primaryPoiId?, evidenceState)`.
- `MealOption(mealSlotId, poiId, ordinal, source, evidence, validatedAt)`; primary plus up to two backups.
- `TripChecklist(id, userId, targetKind=standalone_plan|trip, targetId, revision)`;
  one stable owner/target binding shared across its dates and linked city Plans.
- `TripChecklistItem(id, checklistId, localDate?, planScopeId?,
  category=must_buy|along_route|return_task|note, text, state=open|done|deleted,
  source=user|ai|evidence, provenance?, revision)`; edits and completion use independent checklist
  versions, not PlanRevision/TripRevision or schedule undo. Invalidated date/scope references retain
  the user's text for explicit reassignment rather than following a changed day index.
- Checklist AI suggestions bind input and plan/checklist context versions before confirmation.
  Generated candidates are not saved checklist items; user-confirmed selection creates items with
  provenance, and duplicates cannot silently overwrite existing text or completion.
- Story 6.5 reuses the existing checklist text and revision contract for free-form shopping notes
  with client-side label insertion. Placeholder text is not data and optional labels do not create
  `targetAttributes` or infer values. Structured product attributes, `linkedPoiIds`/multi-store
  relations and shopping scheduling are deferred. Checklist return-task schedule links/conversion
  are also explicitly deferred; return records remain independent checklist items. Existing
  transport/stay/luggage constraints and revisions continue under their prior contracts.
- `SlotDetail(slotId, fillRunId, generatedLines, citations, qualityAudit, promptVersion, revision)`.
- `SlotOverride(slotId, ownerId, baseDetailRevision, lineOperations, explicitEmptyFields,
  suppressedLineRefs, revision)`; each operation targets one `do|prepare|notice` line and records
  add/replace/delete plus the source line reference when applicable. User text and suppression are
  versioned separately from PlanRevision, never inherit AI citations and have precedence during
  later fill composition. There is no restore-AI state transition.

Location context is short-lived request data, not a required durable entity. If debugging storage
is approved later, it must be coarse, expiring and privacy-reviewed.

## Index and Integrity Requirements

- GiST for canonical POI/business-area geography when PostGIS is enabled.
- Unique owner URL key, ordered segment uniqueness, membership composite keys and command
  idempotency keys.
- Candidate writes are owner-scoped and revisioned; a landmark proxy must resolve to the candidate
  Plan city. Clearing the proxy returns the candidate to `unresolved` and invalidates route facts.
- Foreign keys prevent cross-owner Trip/Plan attachment; service guards remain mandatory.
- Revision publication and current-pointer update occur in one database transaction.

---

## Source: `docs/architecture/planner-orchestration-v2.md`

# Planner Orchestration v2

Status: v0.6 target; supersedes `planner-autoplace-v1.md` as product architecture.

## Single Visible Planning Run

S5 creates one PlanningJob from an immutable input snapshot containing time boundaries, stays,
luggage, place intents, pace, optional additional constraints, evidence-derived interest signals
and any linked-trip transfer constraints. The client enters one timeline shell and follows that job
to a current result or explicit failure.

Internal attempts may use a high-quality provider, deterministic heuristics, AnchorPool or a
lower-cost provider. They are implementation strategies, not user-selectable plan versions.

## Pipeline

1. **Snapshot:** authorize owner and freeze input revision.
2. **Context:** load verified POIs, evidence, hours, authoritative route facts, reliable-horizon
   weather or seasonal fallback, city data and source/confidence-bearing interest signals.
3. **Constraints:** freeze exact/window boundaries, stays, transfer handoffs, reservations and
   evidence-derived dawn/sunset/night windows. Inferred reservation/ticket evidence remains a
   warning or acquisition requirement; only confirmed facts become immutable locks.
4. **Candidates:** required first; along_route second; unselected imported and AnchorPool/Top-50
   candidates last. Keep source and explanation.
5. **Arrange:** produce a complete schedule over every usable day, respecting city segment bounds.
6. **Validate:** run structural and derived feasibility. Unsafe required items become explicit
   unresolved items rather than silently disappearing.
7. **Persist:** transactionally create PlanRevision(s), validation state and optional TripRevision.
8. **Publish:** fence by PlanningJob generation and current input revision, then emit done.

AI placement may align to 15-minute boundaries, but persisted/user-edited time supports minutes.
L2 is context and clustering, not a fixed 2h/4h user slot.

When no reliable candidate resolves a needed intent, MVP candidate expansion is ordered and
observable: owner's already-imported verified inspirations, AnchorPool/versioned city Top-50, then
AMap nearby search. High-confidence candidates that pass constraints may be arranged; uncertain
results remain in the S7 candidate area and do not pause PlanningJob. If the pool remains
insufficient, publish explicit free time. Users may add concrete Xiaohongshu URLs through the
existing import entry. Keyword search is Post-MVP and requires a separately designed search
provider, login/Cookie/captcha ownership, compliance, result selection and URL-to-ingest handoff.

## Post-plan Search and Manual Candidate Location

Post-plan text search is separate from PlanningJob execution. An exact AMap result may be saved as a
CanonicalPOI-backed candidate. If search has no accurate result, the user may save the target name
with a same-city verified nearby landmark as `landmark_proxy`. Route/distance previews resolve the
landmark address and coordinates as the endpoint and must report the estimate as approximate.

The target and landmark identities remain separate. The target cannot inherit the landmark's exact
address, hours, rating, price, phone, booking state or other provider facts. Without a usable
landmark the candidate remains `unresolved` and no route estimate is emitted. Epic 2 candidate save
does not restart planning or mutate the current revision; Epic 3 owns explicit placement,
validation, revision publication and undo.

Post-MVP platform cold-start acquisition is separate from this request path. An Epic 8 worker may
observe persistently missing, stale or insufficient AnchorPool buckets, generate bounded contextual
queries, and use an isolated operator-managed XHS search provider. Selected material still passes
through detail/media acquisition, multimodal extraction, AMap verification, CanonicalPOI dedupe and
the shared-admission policy before an atomic AnchorPool snapshot is published. Browser sessions,
cookies and challenges never use an end-user session; acquisition failure cannot pause or fail a
user PlanningJob.

## Priority and Constraints

1. ownership/trip/date integrity;
2. frozen ticket/reservation and exact transfer boundaries;
3. opening hours and evidence-derived hard time windows;
4. required intent subject to feasibility;
5. stays, luggage and near-hotel soft preferences;
6. along_route when it improves route fit;
7. diversity, load, popularity and Agent completion candidates.

Interest signals are soft ranking evidence only. User additional constraints, required intent,
confirmed boundaries and pace have precedence. Route facts with unknown/stale status remain nullable;
the client and LLM cannot manufacture duration. Weather affects planning only inside a reliable
forecast horizon; seasonal context cannot be phrased as a day-specific forecast.

No candidate may cross a TransferLeg handoff into another segment's available interval. A linked
trip is published only when all transfer and segment revisions form one valid TripRevision.
For a DayExcursion, the host Planner may use only time before the outbound handoff and after the
return handoff; the child single-city Planner may use only the closed interval between those legs.
Both transfer facts, the child PlanRevision and the unchanged host Stay/luggage references must
join the same TripRevision. Missing or provisional return facts block planning/publication rather
than being inferred from distance.

## Attempt Fencing and Fallback

- Every attempt has `(planningJobId, generation, inputRevision)`.
- Late output cannot publish after a newer attempt, user mutation or job cancellation.
- Internal fallback emits a generic factual event and continues the same job.
- If no safe complete result exists, persist honest unresolved items or fail with a retry/change-input
  action; never manufacture POIs, travel times, tickets or opening facts.

## S8 Day-Excursion Addition Scope (Approved CE-02)

Adding a DayExcursion to an already-published itinerary may replan only the affected host date
and the child Plan. Reuse all other host dates/cities and unaffected confirmed slots exactly.
Displaced non-frozen activities that do not fit stay as explained unresolved/candidates with
required/user-edit/provenance intact. Do not move them to another date; frozen conflicts block
publication. All allowed changes remain previewed and explicitly confirmed. Story 4.7's explicit
date-change operation retains its separately approved old/new-host-date scope; it is not an
implicit scope expansion of the 4.6 addition command.

## Validation and Editing

Initial publish requires validation. Later user/AI commands create a new revision, then Validator
runs incrementally. Structural invalidity is rejected before write; derived feasibility may create
a conflict-marked revision with typed repair suggestions. Applying repair is another command and is
undoable under the MVP global history policy.

Validation also computes DayLoadEstimate and Trip-level consecutive-early/high-load/recovery
findings, plus stay/luggage, transfer-buffer, companion/mobility and evidence-backed weather risks.
Walking is a soft range that may be exceeded only with an explanation.
DayExcursion validation additionally rejects overlapping host/child slots, non-same-day or
non-same-timezone legs, a main-chain handoff on the same date, missing return, destination Stay,
nested/multiple excursions and insufficient access/egress buffers.

## Filler Boundary

Filler receives an exact Plan/Trip revision and may only write do/prepare/notice, why, citations,
quality and generated detail metadata. It cannot alter slot date, start, end, order, POI, Stay or
TransferLeg. Before a later fill, Filler receives the minimum protected user lines, explicit-empty
fields and suppression references for that exact slot/detail revision. Server-side composition keeps
user wording first, drops exact or policy-defined near-duplicate AI suggestions and only fills
remaining line capacity; Provider instructions alone are never the preservation boundary. User text
does not inherit generated citations, and no restore-AI command exists.

AI adjustment scope is resolved by active Plan identity. Inside an excursion section it may mutate
only the DayExcursion child Plan; before outbound or after return it may mutate only the host Plan.
Neither scope may alter the two transfer legs or the other Plan through a free-text command.

## Metrics

Track stage P50/P95, first-feasible-plan rate, required placement/unresolved rate, along_route
adoption, fallback, attempt discard, validation conflicts, cost per successful plan and source/quality
coverage, route/weather freshness, load-estimate coverage, VAD/ASR skip savings and candidate-stage
conversion. Do not optimize seed acceptance or HQ adoption as product success metrics.

---

## Source: `docs/architecture/rest-api-spec.md`

# REST API Spec (v0.6 Target Overview)

> `docs/api/openapi.yaml` is the implementation SSOT. Paths below are target capability groups,
> not proof they exist. Each story chooses final paths, updates OpenAPI first and regenerates types.

## Home, Ingest and Imports

Story 1.0 first hardens the existing login/session/owner surface for real identities, durable
multi-device sessions and server-controlled operator grants. Keep current logout separate from
account-ineligible/all-session invalidation. No self account merge/unlink/device center is added;
production never accepts development identity headers or mock OTP/captcha as proof.

- `POST /ingest/xhs { url }` remains one-link-per-job.
- `GET /ingest/{job_id}/events` supports durable monotonic SSE cursor and factual stages/counts/title;
  persisted events survive server restart.
- Owner import list/detail returns source title and parsed POIs; only detail may return original URL.
- Import records expose normalization version; production extraction output carries media sampling,
  VAD/ASR decisions, evidence signals and complete nullable AMap fact fields with observed time.
- Home multi-paste is client fan-out over single-link calls, not a bulk scraping endpoint.

## Manual Place Correction (Story 1.11)

- Restricted desktop operations read a selected existing POI/provider snapshot/current override,
  save a reasoned field-limited draft, check/preview, publish or clear selected override fields.
- Read/write checks use current server identity/capability/scope; publish uses expected effective
  base version and operation id with atomic revision/pointer/audit receipt. Unknown outcome queries
  the same receipt. No arbitrary payload, provider/city/branch reidentification or POI merge.
- Allowed edits are display name/address/same-city coordinates. Return manual/provider provenance
  separately with safe timestamps, not operator private notes or other owner evidence.
- Coordinate input requires its actual coordinate-system/source discriminator. The existing geo
  adapter validates an allowed system, preserves original input and applies versioned normalization;
  the result records input/normalized systems and transform policy. Unknown/unsupported systems
  fail before publication; same-city/branch checks and route endpoints use the normalized version.
- New consumer reads bind the effective fact version; route endpoints/cache keys retain it.
  Existing imports, in-flight work and published plan/export snapshots are not auto-updated.
  Existing user mutations remain the only way to change an already confirmed itinerary.

## Recent Trips and Resume (Story 7.1)

- Owner-scoped recent list/Home summary aggregates existing saved drafts, jobs and Plan/Trip roots
  with bounded pagination, stable recency cursor and no duplicate child/day-excursion entries.
  Main lifecycle and optional pending-change summary are separate response fields derived from
  current persisted facts; lists never synthesize a failed task from client disconnection.
- An authenticated resolve/open capability returns the canonical root, exact current revision,
  approved view/scope fallback and existing draft/job recovery target. Never accept an arbitrary
  redirect URL or resolve identity from city names. A linked root uses one complete TripRevision.
- Minimal resume metadata read/write accepts expected metadata version and ordered session
  sequence plus valid view/scope/date/anchor hints. It is independent of schedule revisions;
  failure does not block opening a plan. Auth and idempotency checks apply to metadata writes.
- The same-owner published plan stays accessible when city/date/transport changes need replanning.
  Only real actionable draft/task refs yield the subordinate entry. Unfinished, queued/running
  and terminal failure are distinct; superseded failure refs cannot contaminate a newer input.
- Unavailable/non-owned targets have the same non-disclosing response. Expired auth requires
  reauthentication; restart/deep links reuse existing tasks without a new billable operation.
  Final endpoint naming belongs to OpenAPI-first implementation, not this capability overview.

## Planning Inputs

- Draft contract stores ordered city chain, overall/city dates, daily start, TripBoundary modes,
  per-night Stay/breakfast/luggage, place intents, pace, optional additional constraints and
  evidence-derived interest signals.
- Boundary discriminated union: `exact | window_2h | ai_decide`; exact provider results include
  provider/source, observed-at, valid-until, confidence and confirmed/provisional/stale status.
- Place intent discriminated union: `required | along_route | unselected`.
- AMap search supports hotel/terminal/POI matching with typed unavailable/ambiguous results.
- Flight/rail lookup is a separate provider-neutral capability and returns source/status/freshness;
  no-match preserves manual entry. `ai_decide` returns usable time only, never fabricated service data.

## Planning Jobs and Plans

- Start creates one PlanningJob from an expected input revision and idempotency key.
- Job detail/SSE returns factual stage, reconnect cursor, generic fallback, result revision or typed failure.
- Plan/Trip result includes unresolved required items, candidates, nullable adjacent commute and
  validation state, DayLoadEstimate and authoritative RouteFact status. Candidate responses retain
  intent/source/expansion stage. No public HQ start/status/adopt workflow is used by the MVP client.
- Post-plan AMap keyword search is city-scoped and text-only Top-5. Saving an exact result creates a
  candidate linked to its CanonicalPOI; it does not mutate PlaceIntent or a PlanRevision.
- Manual candidate input is a discriminated location contract: `landmark_proxy` accepts the target
  display name plus a same-city verified landmark POI id, while `unresolved` accepts only the target
  name. The server resolves and snapshots landmark address/coordinates; raw client coordinates do
  not silently become verified facts.
- Candidate responses expose `canonical | landmark_proxy | unresolved`; proxy responses include the
  landmark display/address and an approximate route state. They never return landmark business
  facts as target facts. Candidate create/update uses owner guard, expected revision and idempotency.

## Editing, Validation and Undo

- Slot commands support replace, move to any valid trip day, minute-precise retime and delete.
- Every command carries expected revision/idempotency; typed unavailable target is not a 500.
- Plan-global undo operates on command token; recent eligible undo is not day-scoped.
- Validation reads exact revision; fix preview returns typed operations and apply creates a revision.
- Structural errors reject command; derived conflicts may return a conflict-marked new revision.
- Candidate placement/replacement is an explicit Epic 3 command. A `landmark_proxy` endpoint remains
  visibly approximate through preview, validation and undo; an unresolved candidate cannot be placed.
- AI adjustment preview accepts explicit/inferred scope and usually returns two safe directions
  before a typed diff; one safe direction remains one, and none uses the approved no-safe recovery.
  Apply never accepts free-form persistence JSON or fabricates a second direction.

## Minimum Result Host and Detail Return (IR-09)

Story 5.1 owns authenticated exact-revision base itinerary/available check/run reads for the minimum
S10 host plus S9 source identity/attribution/safe-summary reads and source-unavailable states.
S7-to-S10 entry, S9 return and deep-link parent resolution are read-only and use current owner/
aggregate/revision/date/scope/anchor validation. 5.2 extends the same reads for full checks and
CitationSheet. Do not require future 5.2 endpoints merely to enter/return/read a source in 5.1, and
do not create a second ValidationRun or business state from navigation. Final paths remain OpenAPI-first.

## Linked Trip

- Trip aggregate APIs manage ordered segments, full TransferLegRevision facts, StayRevision and
  LuggageTransitionRevision; provisional AI transfers require confirmation before publication.
- Publication binds explicit segment Plan revisions and transfer/stay/luggage revisions atomically.
- Cross-city intent first creates a pending expansion; it does not mutate the current Plan timeline.
- The cross-city decision command accepts an explicit `add_segment | day_excursion | cancel` choice;
  it never infers an overnight city from a round-trip route or vice versa.
- DayExcursion draft commands bind `hostSegmentId + localDate + destinationCityId + intent`, then
  store outbound and return transport inputs independently. Draft responses expose completeness and
  typed blocking reasons; a missing/provisional return cannot be represented as confirmed.
- DayExcursion plan/publish binds expected TripRevision, child PlanRevision and both transfer
  revisions in one idempotent transaction. Read models merge host-before, outbound, child, return
  and host-after items into one day while preserving their Plan/transfer identities.
- Date/transport/delete operations clone a recoverable Trip draft or create an atomic successor
  TripRevision as required; ordinary child Plan commands cannot mutate either transfer or host Plan.

## Meals, Location and Checklist

- MealSlot detail/change supports fixed, choice pool and undecided modes with up to two alternatives.
- Recall accepts ephemeral foreground location context/freshness and returns provenance/degradation.
- App-open/foreground-resume recall follows the same contract as meal-entry/manual refresh: current
  permission and meal scope are required, same-activation requests are coalesced, and responses are
  bound to owner/session/request/revision/MealSlot/date/scope. No open-Sheet prerequisite for an
  app-open read, but no automatic navigation, draft overwrite or plan mutation. Revocation,
  background and scope changes invalidate client consumption; raw fixes remain request-local.
- Story 6.2 recall is read-only and bound to owner, current revision, MealSlot, date and active
  host/child Plan. It accepts one foreground fix with observed time, accuracy and coordinate source;
  invalid/no fix uses same-scope previous/next planned POIs. MVP has no check-in/completed-visit
  subsystem after the 7.2 deferral; do not query one or infer visits from elapsed time. With no anchors,
  return the saved pool/manual-add path. A selected result enters the existing meal preview/confirm
  command, and raw user coordinates never enter persisted revisions or history.
- Commercial-area food query is owner-scoped and returns only imported verified POIs.
- Story 6.3 binds that read to the current host slot/Plan city and valid shared BusinessArea
  membership on both POIs. It deduplicates by canonical branch identity, counts only accessible
  owner records and invalidates private results on import ACL/membership changes. Empty/hidden and
  failed/retry are distinct; source drill-in reauthorizes access. It does not acquire live location
  or mutate Plan/MealSlot, and preserves canonical area data separately from private evidence.
- Checklist list/command supports categories, direct user text and confirmed AI suggestion
  provenance. Product attributes/multi-store matching are deferred; optional labels in shopping
  text do not add new API fields or a store/search contract.
- Story 6.4 first delivers owner-scoped list/create/edit/delete/complete/reopen for a stable
  standalone Plan or Trip checklist, including general `note` records and optional local date/scope.
  Writes require expected checklist/item version and idempotency; they do not advance schedule
  revisions. Empty direct-add opens an editor without a write; only valid user text can be saved.
  AI suggestions bind their input and minimal owner plan/checklist context, remain editable drafts
  until explicit selection/confirmation, and cannot overwrite existing records. Related context
  changes require recheck. Story 6.5 reuses this text contract for lightweight shopping capture and
  local label insertion without requiring shopping dates/stores. Store association, shopping search
  and automatic placement are deferred. Checklist return-task-to-schedule conversion is also
  deferred: no reserve-time endpoint or schedule mutation is introduced by checklist commands.
  Existing transport/stay/luggage planning and validation still own their necessary buffers.
- Weather context returns forecast/seasonal kind, source, observed/valid time and quality; stale or
  missing context is a typed degraded state, not an empty successful forecast.

## Detail and Export

- Detail enrichment binds exact current revision and cannot return schedule mutations.
- ResultSheet always returns the exact current base itinerary plus revision-bound validation and
  detail-completeness summaries. Hard conflicts remain readable but gate detail fill and export.
- Slot content returns composed `do|prepare|notice` lines with generated/user provenance and
  citations attached only to the generated facts they support. Internal quality/freshness audit
  fields are not exposed as ordinary UI status labels.
- Slot-detail edit commands carry owner, idempotency key, expected detail/content revision and
  per-line add/replace/delete or optional-field explicit-empty operations. They create a new content
  revision without mutating PlanRevision or entering plan-global undo. No DELETE/reset endpoint
  restores AI content; later fill must honor protected user lines and suppression state.
- Image export accepts include-details, width and an exact Trip/Plan revision. The server derives an
  ordered city-unit manifest: one standalone Plan image, or one image per main TripSegment and
  DayExcursion child Plan. Clients cannot submit day slices, merge scope identities or reorder units.
  Preview and generation reuse that revision's current ValidationRun; hard conflict, invalid transfer
  or incomplete DayExcursion/Trip references return a typed gate response, while soft warnings remain
  visible and allow continuation. The durable response resolves to private WebP artifacts by default
  and JPEG only as compatibility/size fallback. Legacy `/export/png` naming and `slice_by_day` may be
  accepted only as migration inputs and must not imply a PNG or per-day public output contract.
- The Web/PWA whole-trip download command returns one owner-authorized logical delivery batch. A
  standalone Plan may reuse its city artifact; a linked Trip creates or reuses ordered
  `trip_long_part` artifacts bound to the same ExportJob manifest checksum, revision, theme and
  `TripLongLayoutPolicy`. Normal output is one `1/1` file. When the tested limit would be crossed,
  the server closes the current part at the previous main-city boundary and starts the next complete
  city section in `2/N`, `3/N`, etc. Each section embeds its DayExcursions at their host dates. The
  server renders sections and transfer boundaries in true chronology rather than concatenating scope
  files. ZIP and city/day-internal splitting are
  forbidden; if one indivisible city still exceeds both WebP/JPEG limits, return a typed failure while
  preserving city-file access.
- A batch-download response exposes ordered part metadata before the user acts. Directory-capable
  clients verify per-part write/close completion after one grant. Other browsers use controlled
  download requests and display `已开始下载，请确认` once handed off without a known rejection;
  device-save results stay unknown. Report observable cancel/block/failure and confirmed partial
  outcomes separately. Unknown parts retry only on explicit user action with duplicate risk. Reuse
  the same artifact set, without rerendering or new product charges; HTTP success is not a save receipt.
- System share requests expose the ordered city artifacts only after capability/ownership checks;
  signed object URLs are never passed directly to the operating-system Share Sheet.

## Compatibility and Security

- Approved 7.6 extends feedback link discovery with actual safe destination/capability, private
  owner-bound upload preparation/finalization, immutable idempotent submission and protected receipt
  lookup. Missing configuration never yields a fake executable product id. No Nomad identity/token
  or undocumented custom parameters are sent upstream. First-party success requires real stored
  text and validated attachment reference; mailto/window-open/iframe events cannot satisfy it.
  Changed payload with a reused key is a conflict, and unknown outcomes only query the original
  request before permitted retry. Maintainer access uses least-privilege server authorization,
  not a client role header; deletion eligibility is rechecked at upload/final save.
  First-party report/attachment handlers join prior export/deletion registries in 7.6 itself;
  this does not add a forward dependency to 7.4/7.5 or silently expose third-party-only reports.

- Approved 7.5 requires real identity/recent authentication, owner/action-bound expiring confirmation,
  idempotency, expected lifecycle version and CSRF/origin checks on destructive cookie-auth writes.
  Prepare a restricted status receipt before final acceptance; after all ordinary sessions are
  revoked it may read only this request's safe progress/retention disposition. No task id/header
  fallback/query token authorization. A write retry needs independently verified limited scope.
  Accepted is distinct from verified cleanup and read-unknown; loss of response recovers the same
  request. Re-auth while deleting cannot create ordinary sessions or implicitly register a new user.
  Source contracts do not authorize actual deletion during planning; update OpenAPI only in the
  owning implementation story and verify the real destructive path before enabling it.

- Approved 7.4 extends the existing account export entry into explicit idempotent request,
  owner-scoped durable task/status recovery, technical retry/new-generation distinction and
  authenticated ZIP download. It does not reuse the image ExportJob wire contract. Return actual
  snapshotAt/generatedAt/expiresAt, file size and safe errors, not public/signed storage URLs.
  Every download rechecks session/owner/account eligibility/ready/expiry through protected delivery;
  knowing a task id or link never grants access. Use no-store responses and safe filenames.
  Account-copy JSON is an explicit allowlist, not Prisma serialization or credential/source dump.
  Status-read errors never overwrite durable task truth; submit/queue acceptance is not completion.

- User-directed Settings scope (7.3): expose only safe account information and actual available
  destinations/recovery actions, not user quota counters, limits, balances, reset windows or a
  usage-summary endpoint. Internal guard/accounting/telemetry remains intact. Actual job progress
  is served by existing job APIs, not a Settings dashboard; destination auth is always rechecked.
- Approved 7.3 reuses authenticated account facts and current-session logout/revocation. Logout
  clears the current cookie but is not account deletion, all-session revocation or job cancellation.
  Opening Settings never triggers account export/delete. Failed/unknown capability reads cannot
  default to executable, and historical key data is not deleted by removing BYOK UI.

- Story 7.2 check-in is out of MVP. Legacy `/plan/slots/{slot_id}/status` schema presence is not
  authorization or proof of a working visit service; no new status API, visit migration or owner
  photo access is introduced by this scope decision. Future FR40.1 requires separate contracts.

- Existing BYOK and HQ compatibility routes may remain temporarily but are absent from MVP UX.
- Owner guards apply before resource fetch; original source URLs and exact location are minimized.
- Error schema carries stable code, retriable flag, correlation id and safe user message.

---

## Source: `docs/architecture/observability.md`

# Observability and Analytics

Approved Story 8.1 target (2026-09-07), not deployment evidence. Reuse Sentry for application
errors and selected application spans, Langfuse for explicit safe AI observations, and bounded
structured logs. Evaluations, central routing/budgets, Telegram and overview belong to 8.2-8.6.

## Instrumentation Ownership

- Sentry owns the one global OTel provider; Langfuse uses an explicitly isolated provider, not
  a second global registration. Bootstrap API/worker ESM entry points once, before instrumented imports.
- Correlate tools by trusted opaque correlation/job/attempt references. Their OTel IDs and parent
  trees need not match; independent bounded sampling must not be presented as complete retention.
- Assign one instrumentor per HTTP/framework/AI boundary. Only reviewed AI observations go to
  Langfuse, with independently checked Sentry/OTLP export payloads; no blanket export-all setting.
- Keep browser error capture and private release-matched source maps; no Replay, profiles, form,
  request/response/SQL values, full prompts, attachments or raw console capture in this scope.
- Pin and test actual SDK/backend/Node/Fastify/React versions. SDK presence, no-op initialization
  or the conceptual Walkthrough R1 cannot prove configured tools or successful querying.

## Correlation Model

- `session_id`, pseudonymous `user_id`, `event_id`, `prev_event_id`, `seq`, timestamp.
- `ingest_job_id`, `planning_job_id`, `attempt_id`, `fill_job_id`, `export_job_id` as applicable.
- `trip_id`, `trip_revision_id`, `plan_id`, `plan_revision_id` as applicable.
- `trace_id`, `span_id`, deployment/version and feature configuration snapshot id.

`journey_id` may remain as a compatibility correlation id, but S0-S11 stage and Trip/Plan revisions
are the current product semantics. `hq_job_id` is historical and not a funnel dimension.

These are permitted correlation concepts, not unrestricted payload fields. Use pseudonymous
session references, never authentication session IDs. Validate untrusted trace headers/lengths;
only service-authoritative job/owner relationships attach to them. IDs do not authorize reads,
force sampling or become metric labels. Keep outbound propagation destination-allowlisted.
Async attempts and SSE reconnects use links/opaque references, not an indefinitely open span.

## Event Envelope

```json
{
  "event_id": "uuid",
  "seq": 123,
  "timestamp_ms": 1786464000000,
  "session_id": "opaque",
  "stage": "S6",
  "trip_id": "opaque?",
  "plan_id": "opaque?",
  "revision_id": "opaque?",
  "job_id": "opaque?",
  "trace_id": "opaque"
}
```

## Product Funnels

1. Home classified/imported -> Time -> Accommodation -> Picker -> Review -> Planning accepted ->
   plan hydrated -> first useful interaction -> detail -> ResultSheet -> export.
2. Import job created -> durable stages -> record stored -> result presented -> record opened.
3. Timeline mutation -> validation -> conflict shown -> fix preview -> fix applied/abandoned -> undo.
4. Cross-city confirm -> time/stay completion -> transfer proposal/confirm -> Trip publish.

## Metrics

IR-08 ownership is explicit in `implementation-prerequisites-2026-09-15.md`: METRICS-01 provides
early per-capability workload/versions, stage start/end, failure/coverage denominators and local
baseline reports; METRICS-02 is the 8.1 aggregation and evidence-backed production-target decision;
METRICS-03 is 8.2's per-rule complete-result/human-review contract. Publishing early capabilities
requires their applicable target decision, not waiting for the entire operator UI to exist.
Do not average P95 or omit failed/unfinished requests; motion duration is not AI completion latency.

- Stage/job P50/P95 and retry/failure/reconnect rates.
- Ingest frame counts/sampling policy, VAD speech/BGM/silence outcome, ASR skip/cost savings,
  multimodal evidence coverage and AMap nullable-field freshness.
- First feasible plan, required placed/unresolved, along_route adoption and candidate explanation.
- Candidate expansion stage conversion, InterestProfile evidence coverage, DayLoadEstimate coverage,
  consecutive-load findings and route/weather unknown/stale rates.
- Post-plan search exact/no-result conversion, canonical/landmark-proxy/unresolved candidate counts,
  proxy route availability and rejection reason; never record raw query or manual target text.
- Attempt fallback/discard/fencing, provider cost and cost per successful plan.
- Validation conflicts/fix success/undo; stale revision and ownership rejection.
- Meal pool quality, recall degradation, BusinessArea match and checklist usage.
- Citation coverage/quality/degradation, override retention and export success by derived city-unit type/theme.
- Feedback (7.6): separate open attempts/observable open results from first-party submit/receipt
  outcomes, using only categorical source_page, actual mode and safe error codes. External submit
  outcomes remain unobserved without a verified integration; opener/iframe events cannot increment
  received counters. No body/screenshot/raw URL/identity credentials in telemetry. Optional attached
  diagnostics are distinct from baseline entry-event counting. No new Telegram feedback notifier.

Do not use HQ adoption, seed acceptance or visible Quick completion as current success metrics.

## Logs and Traces

- Structured errors use stable codes and correlation ids.
- Langfuse receives prompt version, provider attempt and explicitly constructed safe summaries.
- Sentry receives stack/context but no Provider secret, token, raw source URL, exact user text,
  unredacted evidence or continuous location history.
- Complete provider input/output capture is excluded from 8.1. Filter both names and nested
  values/events/resources/links, including URLs, error strings and encoded media, before every
  log/SDK/export sink. SDK flags or a single masking callback alone are not proof of redaction.
- Unknown usage, cost, missing spans and dropped telemetry remain unknown/coverage gaps, not zero.
  Attempt outcomes, durable task outcomes and HTTP acceptance are separate. Sampled traces are
  neither the billing ledger nor domain state; do not generate extra work to fill telemetry gaps.

## Access, Retention and Availability

- Operator tools require actual least-privilege project/environment access. No public trace
  links or browser admin credentials; verify required free/paid governance features before deployment.
- Minimize owner-linkable telemetry. Extend the 7.5 inventory with restricted cleanup references,
  actual TTL and verified deletion/anonymization or approved isolation. A hash is not automatically
  anonymous; access expiry/202 is not erasure. Late writers cannot resurrect deleted data.
- Do not include internal traces in the 7.4 account copy. Keep deletion-required references until
  cleanup is proven, without creating an unbounded new private telemetry archive.
- Sampling, event size, queue length, retry, flush and local logging have measured bounds. Drop
  unsafe/excess telemetry with safe loss counters; no unapproved raw-data disk spool.
- Exporter failure never changes Job/Plan, quota accounting, retry decisions or SSE truth. Normal
  shutdown flush is bounded; abrupt exit may lose telemetry. Do not recursively report exporter
  failures through themselves or promise exactly-once delivery.
- Hosting/region/paid plan, resources, retention and connectivity still need explicit implementation
  verification. First-use business safeguards never wait for this operations integration.

## Alerts

Evaluation rule findings are not production incidents and do not automatically trigger Telegram.
The separate evaluation workspace below does not widen any production observability sink.

- Job terminal failure/DLQ growth, SSE reconnect loops, provider breaker open, cost guard trips.
- Plan publication atomicity failure, stale attempt publish attempt, cross-owner access denial spike.
- AMap/BusinessArea/transport/weather degradation, durable ingest-event gaps, initial feasibility
  regression and export failure regression.
- AI/AMap ordinary rate limits and recoverable fallback remain product/metric states. Only terminal
  quota, authentication, billing, all-route-unavailable or sustained-breaker conditions that need
  operator action enter the Telegram notification policy after retry/fallback exhaustion.
- Telegram alerts use durable environment+provider+capability+error fingerprints, aggregation,
  cooldown and recovery notices. Payloads contain only redacted operational fields and correlation
  ids; delivery failure is retried/observed independently and never changes user domain state.

## Terminal Incident Notifications (Approved Story 8.5)

Approved 2026-09-13: Node/PG consumes durable eligible AI/AMap terminal/recovery facts and owns
incident episodes, deduplicated counts, cooldowns and one notification outbox. Sentry/Langfuse
remain safe diagnosis tools; sampled traces, a closed issue, expired heartbeat or missing data do
not establish terminal eligibility or recovery. No required Alertmanager or Bot inbound service.

A thin Node sendMessage adapter has one persistent attempt/retry authority. A successful Telegram
Message receipt is not read/handled proof; response loss preserves unknown delivery and retries
may duplicate. 429 schedules retry_after; permanent auth/target errors need repair. Mute affects
notifications only and continues incident evaluation. Late recovery cannot close a new episode.

Short allowlisted text/links exclude owner/travel content and credentials. Redact Bot token paths
before HTTP instrumentation/log export, not just at the JSON body. Target aliases/secret references,
message IDs and safe receipts are separate from raw response chat objects. Notification errors
never modify committed Job/Plan, cost or retry truth and do not recursively notify via broken
Telegram. Desktop Web supplies its own status/recovery path before 8.6. Real test sends require
explicit target/content confirmation and actual staging receipts, not planning approval.

## Read-only Operations Overview (Approved Story 8.6)

Approved 2026-09-13: a thin existing Node/React desktop Web view combines bounded summaries and
protected native-tool links. Keep authoritative task/degradation facts, sealed 8.2 evaluation,
8.4 ledger, 8.5 incident/delivery and configuration evidence separate from sampled observations.

Each result declares source/definition, authorized environment/capability, requested and covered
window, source as-of/fetch time, sample/extrapolation and truncation/retention state. No common
atomic snapshot is implied. Missing data is not zero or health; estimates are not actual bills,
observations are not logical Jobs, and averaging p95 values is invalid. Native-tool links carry
only supported filters and preserve independent login/permissions.

Fixed read queries use per-source timeouts, limits, request coalescing, permission-scoped caches
and quota-aware refresh. A failed source does not erase usable peers; old results keep their time
and cannot update a new filter/account context. Do not pull private input/output to compute a
summary or use service keys to expand visible scope. No new Grafana/iframe/public snapshots,
widget editor or write/repair authority. Real source/plan/version/access/retention/query tests
and desktop evidence remain implementation gates; approved mockups are not monitoring results.

## Evaluation Workspace

Approved Story 8.2 target (2026-09-08), not implemented evaluation or deployment evidence:

- Keep promptfoo for deterministic CI and the approved full Nomad experiment runner. Use existing
  Langfuse datasets/experiment comparison, manual numeric/categorical/boolean scores, comments,
  review queues, prompt versions and Playground. Do not build a duplicate evaluation/admin platform.
- Production samples may enter a dedicated restricted evaluation intake after removing direct
  personal identifiers. Do not remove hotel POIs, dates, route/time or preferences merely because
  they could indirectly identify someone. Credentials/private access signatures remain excluded;
  private/public business contacts and person/POI names require distinct filtering behavior.
- This evaluation copy is separate from 8.1 production traces. Apply checks before dataset/result
  upload, not only through tracing masks; UI comments and Dataset API paths need their own controls.
  Keep provenance/egress scopes and 7.5 cleanup references, not raw owner IDs in external sample keys.
- Freeze dataset items/schema, prompt content/config, code, rubric and rule-policy hashes in a
  manifest. Labels and Score Config IDs are not immutable definitions. Exact case/variant/repeat
  accounting and full-result pagination, not a vendor page aggregate, determine report coverage.
- Rules explicitly define applicability, tolerance/weight and score/warn/human-review behavior;
  there is no uniform hard-rule quality veto. Any individual blocking policy needs agreement.
  Runtime Planner/Validator and ordinary authorization/version/code tests remain unchanged.
- Separate execution completeness, automatic findings, human progress/verdict and sync state.
  Map a single execution to dataset/run/item/observation/score with idempotent receipts; upload or
  human-score recovery does not rerun inference. New reviews form new sealed evaluation snapshots,
  retaining previous captured human and automatic evidence without overwriting old reports.
- Deterministic CI runs with no model credentials/network and no dependency on Langfuse uptime.
  Authorized live comparisons use bounded experiments and isolated credentials; Playground is
  single-prompt exploration, not full Planner coverage. Full regression uses private CI fixed tasks,
  not a new public webhook. Human review must actually work for Story completion.
- A trusted operator can use the existing workspace now; 8.3 production routes and 8.4 budgets have
  separate controlled operations, and 8.6 later aggregates their entry points. Experiment scores or
  prompt-label edits cannot silently publish production models or change a user's itinerary.
- Verify actual access, including broad Member permissions, unavailable models, sync failures,
  data retention/deletion and real manual score round trips. Exact SDK/hosting/paid choices and live
  calls still require implementation-time authorization; synthetic Workspace R2 is not test proof.

See `docs/ops/analytics.md`, `docs/architecture/testing-strategy.md`, error-code docs and rate-limit
policy for operational implementation. Story 8.2's source contract is in the formal planning epics.

---

## Source: `docs/architecture/testing-strategy.md`

# Testing Strategy

## Test Levels

- **Pure/unit:** URL normalization versions, intent reducers, exact 120-minute windows, stay/luggage
  normalization, move targets, candidate expansion/ranking, exact/proxy/unresolved candidate
  location, BusinessArea reliability, load/weather classification, typed fixes, fencing and privacy redaction.
- **Repository/real DB:** owner isolation, idempotency, revision transactions, Trip publication,
  membership query/indexes, undo eligibility and migration rollback/forward.
- **Route/contract:** OpenAPI validation, auth, error schemas, persisted SSE resume/order across
  restart and generated client types.
- **Integration:** XHS/VAD/ASR/frame extraction, AMap, flight/rail lookup, route matrix, weather,
  Provider/COS/queue adapters with deterministic fixtures, timeout, ambiguity and degradation.
- **Mobile component:** all states, icon accessibility, disabled targets, keyboard and state preservation.
- **Browser E2E:** S0-S11 happy path plus focused failure/reconnect/undo/cross-city/meal/export paths.
- **Prompt regression:** promptfoo against Xiamen and adversarial constraint/citation fixtures.

## Story Gates

SP must carry the seven scoped conditions from
`_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md` into the owning work:
OPS-01/02, DB-CHANGE-01, DATA-VECTOR-01 and METRICS-01/02/03. These assign responsibility and
test evidence, not extra product Stories or claims of already-run infrastructure checks.

1. OpenAPI generation and package typecheck.
2. Focused domain/repository/route/mobile tests for the story.
3. `pnpm -r build`.
4. Browser screenshots at mobile and desktop inspection widths for changed UI; no overlap/blank state.
5. Real PostgreSQL migration/integration check for persistence changes.
6. Real external-service staging check when XHS extractor, AMap, flight/rail, route, weather,
   Provider or COS semantics change, with secrets redacted.

## Priority Scenarios

- CE-01 (approved 2026-09-14): actual 1.11 desktop rule CRUD/draft/check/publication, denied roles,
  conflicting bases, unknown receipt recovery, hot-load evidence and stable per-attempt rule use.
- CE-02: adding an excursion changes only its host date/child; other dates compare equal, displaced
  non-frozen required items remain explained candidates and frozen overlaps cannot publish. Check
  4.7 explicit date moves separately so old/new-host-date behavior is not accidentally removed.
- CE-03: test confirmed directory writes separately from ordinary download handoff. Assert exact
  `已开始下载，请确认`, internal unknown-save state, truthful errors and explicit duplicate-aware
  unknown retries; never infer device save from an anchor click or server transfer completion.


- P0: owner isolation, revision/fencing, minute/cross-day editing, immutable Stay/Transfer/Luggage
  Trip atomicity with failure injection, DayExcursion child Plan plus both transfer references,
  initial feasibility, hard-conflict export gate and Filler no-reorder invariant.
- P0: same-day A-B-A renders one host date and no duplicate host segment; missing/stale return,
  overlapping host/child slots, excursion-plus-main-handoff, nested/multiple excursion and
  cross-timezone/overnight inputs remain recoverable drafts or typed rejections without partial publish.
- P0: Picker required/along_route state survives every view and round-trip.
- P1: URL variants/cross-user dedupe, import multi-job/FIFO foreground/background timing and restart
  reconnect, VAD skip/frame policy, partial AMap facts, evidence inferred→confirmed lock transition,
  BusinessArea multi-membership/expiry, location denial/stale fallback, meal shortage/swap and
  checklist multi-store/AI confirmation.
- P1: Provider timeout/fallback remains one user flow and late attempt cannot overwrite edits.
- P1: post-plan Top-5 exact result, no-result manual add, same-city landmark proxy, fact
  non-inheritance, unresolved/no-route, stale candidate revision and cross-owner/cross-city rejection.
- P1: flight/rail no-match/manual fallback and stale/expired schedule facts, AI no-ticket fabrication, route unknown/freshness,
  asymmetric day-excursion transport modes, active host/child AI scope, consecutive-load detection
  and stale forecast/seasonal weather degradation.
- P2: motion, optional content, analytics completeness and secondary settings visuals.
- P1 (7.3): safe account/no-display-identity fallback, deployed/absent/temporarily failing actions,
  no quota or BYOK payload/UI requests, current-session logout success/cancel/failure, rejected
  post-logout reuse, account-switch cache isolation and accepted-job continuity. Viewing Settings
  must never create export/delete/planning work or expose another user's data.
- P1 (7.4): unpack real JSON-in-ZIP to verify owner allowlist, current draft/user-text coverage,
  exact linked revision set, source/credential exclusions and schema/counts/checksums. Exercise
  concurrent edits, repeated submit, pre-seal retry/post-seal restart, old valid artifact, expiry,
  current-session logout versus account ineligibility, download-only retry and no-source-deletion.
  Verify real PostgreSQL/queue/storage lifecycle, auth/no-store delivery, mobile failure/resume and
  absence of new AI/AMap/XHS calls; queue acceptance and mock files do not prove completion.
- P1 (7.5): real identity/confirmation/CSRF, all-device stop across restart, atomic outbox acceptance,
  unknown-submit recovery and restricted receipt/retry scope. Verify full historical inventory,
  shared-reference races, active export/worker late writes, cache/credential/object/trace cleanup,
  online versus retained-backup truth, restore suppression and fresh-owner re-registration.
  Retention/receipt policies and actual deployed-store evidence are completion gates, not fixed
  mockup values; queue acceptance or a single database delete is insufficient.
- P1 (7.6): real configured external destination/runtime versus direct-form fallback; no opener/
  mailto/iframe false success. Verify text/private attachment receipt, metadata stripping, operator
  authorization/retrieval, idempotent duplicate/unknown outcome, account switching/deletion races,
  opt-in diagnostics and export/deletion registry integration. Disabled upload/X removal/ordinary
  submit and no busy bottom actions need screenshots; bounded timeout must stop waiting before
  recovery. Real configured product and PostgreSQL/COS checks cannot be replaced by mocks.
- MVP scope regression (7.2 deferred): no check-in button/service prerequisite or photo access;
  FR48 no-fix recall uses previous/next planned POIs or a static pool without a visit table/query.
  Planning/replanning, current-revision recovery and existing itinerary-image export remain usable.
- P1 (6.2, 2026-09-14 amendment): app-open/foreground-resume with valid historical/new permission,
  revoked/unknown permission, absent meal context, same-activation event dedupe, no unauthorized
  prompt loop, no background/watch/timed fix, Sheet/app-open request separation, late response and
  draft protection. Keep read-only candidates, precise fix cleanup and same-scope plan fallback.
- P1 (5.1/5.2, 2026-09-14 amendment): source-less safe generic content uses an accessible inline
  `建议核对` beside detail text, with no modal/repeated toast/per-item acknowledgment. Source links
  remain truthful; unavailable safe content stays unavailable and schedule/export hard gates remain.
- P1 (7.1): owner recent-list pagination/alias dedupe; independent same-city trips; complete Trip
  revision lookup; S2-S5/S6/S7/S10 restoration across restart; stale/missing scopes; no new AI call,
  charge or schedule version from reopening; durable late resume-write fencing; account switch.
- P1 (7.1): real saved change vs no draft, half-filled input vs actual terminal failure, queued/
  disconnected jobs, old failure superseded by new input, cancelled/discarded/published entry cleanup,
  available original plan during a failed replan, loading vs empty vs error and nonblocking Dock.

- P1 (8.1): actual Sentry/Langfuse query and error/source-map evidence; unique global registration,
  explicitly isolated AI tracing, concurrent scope safety and bounded independent sampling.
  Probe invalid/hostile headers and every SDK/network export with nested private values/URLs/media,
  normal/fallback/terminal tasks, reconnect/worker restart, missing usage, exporter outage/overflow/
  shutdown and owner deletion races. Compare overhead against telemetry-disabled baseline;
  declared SDK versions/no-op/local screenshots alone do not prove deployed integration.

- P1 (8.2, approved 2026-09-08): execute actual deterministic runner and full expected-result
  accounting; exercise score/warn/review policies without a blanket hard-rule veto, partial runs,
  NaN/duplicate/missing cells, altered rubric/schema/cache, untrusted PR config and unknown costs.
  Probe direct-ID filtering and POI/contact false positives while retaining indirect travel context.
  Verify the approved restricted Langfuse sample/result/manual-score/review-snapshot chain,
  paginated full-result comparison, denied access, interrupted upload and idempotent retry without
  repeated inference. Verify eval-copy/score/comment cleanup and no production telemetry expansion.
  Deterministic offline success alone cannot satisfy human-review or authorized live-lane evidence.

- P1 (8.3, approved 2026-09-08): exact route/connection capability validation, no secret/URL
  overrides, draft/check invalidation, expected-version publication plus audit atomicity, duplicate
  and unknown operations, accepted/queued/restarted task snapshots and exact instance-use evidence.
  Exercise control-source loss, stale safety lease, no LKG, pause/resume and compatible new-version
  rollback without clearing restrictions. Count all SDK/worker/backup retries and costs; reject partial
  streams/tool duplication and safety-bypass fallback. Verify real PostgreSQL, authorized small
  Provider probes, role/environment isolation and operator browser states, not only static/mock checks.

## Test Data and Privacy

- Approved 18-group presentation regression: keep logical outcomes, typed errors, revisions and
  required confirmations unchanged while testing short module-local states and on-demand detail.
  Exercise soft-only vs hard/mixed, known failure vs unknown receipt vs empty results, baseline
  location vs actual location, partial details, completed stale images vs stale generation previews,
  and counters tied to exact module/version. Verify accessible labels/contrast, retained context,
  no repeated toast/automatic modal/per-item acknowledgment, and necessary source/risk information
  inside exported files. Critical write/delete/production/real-send controls remain enforceable.

- Story 1.0: verify actual login/identity mapping, explicit test-channel isolation, persistent
  qualification and sessions across restart/instances, two-device coexistence, current-only logout,
  all-session ineligibility, cookie/callback protections and first operator grants before real-user use.
- Story 1.11 manual correction: authorized desktop draft/check/publish/clear, permitted-field and
  same-identity checks, provider-refresh/version races, unknown receipt recovery, provenance,
  endpoint-version cache isolation and unchanged old import/in-flight/published plan snapshots.
  Coordinate fixtures include supported-system normalization/version, missing/unknown system,
  out-of-range values and normalized same-city checks; a bare numeric pair cannot publish.
- Story 5.1: with full 5.2 absent, actually traverse S7→minimum S10→S9→same S10 and read a protected
  source summary. Cover no details, hard/soft/unknown checks, partial/failure/stale/deep-link parents,
  invalid anchors and source denial. Navigation creates no new run/revision; 5.2 must preserve this baseline.

- Use synthetic users and owner-crossing probes for every protected resource.
- Xiamen final itinerary is a potential QA input, not blanket authorization to transfer its media or
  private content. Production evaluation samples are also allowed through the dedicated intake below.
- Evaluation intake filters direct identifiers (person names, identity documents, personal contact
  and account identifiers), not indirect-inference combinations. Preserve hotel POIs, dates, routes,
  time and preferences; distinguish person names/contacts from public POI names/business contacts.
- Credentials, tokens and private access signatures remain excluded independently of identity
  filtering. Restricted evaluation copies need provenance, access/egress scope and deletion tracking;
  do not publish them in Git/CI or enable complete production trace capture under Story 8.1.
- Rule-specific evaluation policies replace a blanket hard-rule veto: use explicit applicability,
  tolerances, weights and score/warn/human-review treatment. Any individual blocking rule needs
  separate agreement. Ordinary security/code tests and runtime Planner/Validator contracts remain.
- Separate execution completeness from quality and human-review progress. Human scores/comments
  and experiment annotations are required; freeze rubric definitions and evaluated version snapshots.
  Langfuse adoption and the 24-GWT contract were approved on 2026-09-08, not deployed functionality.
- Time tests pin timezone/clock and cover DST even though MVP linked trips are same-timezone.

---

## Source: `docs/architecture/mvp-implementation-checklist.md`

# MVP Correct Course Implementation Checklist

This checklist describes delivery gates, not current completion. Sprint Planning assigns every
item to the story map in `epics.md`.

## Contracts and Data

- [ ] Story 1.0 provides production login, stable owner migration, persistent multi-device sessions and minimal operator authorization before real-user/first-operator access.
- [ ] FR4.2/1.11 manual POI corrections preserve provider snapshots, field provenance, publication receipts and old plan/job facts.

- [ ] OpenAPI models three-state Picker intent, boundary modes and minute edits.
- [ ] Owner import records/source title, normalization version, protected original URL and durable event cursor exist.
- [ ] Production ingest has VAD/ASR, frame policy, evidence state and complete nullable AMap facts.
- [ ] BusinessArea membership has migration, versioned reliability policy and owner-scoped food query.
- [ ] PlanningDraft/StayRevision/breakfast/luggage contracts support S2/S3/S5 optional constraints.
- [ ] InterestSignal, RouteFact, DayLoadEstimate and WeatherContext have source/freshness contracts.
- [ ] PlanCandidate models canonical, landmark-proxy and unresolved location without merging target and landmark facts.
- [ ] PlanningJob/attempt fencing and complete Plan result are versioned.
- [ ] Trip/Segment/DayExcursion/TransferRevision/StayRevision/LuggageRevision/TripRevision aggregate publishes atomically.
- [ ] MealSlot/options, checklist and detail/override contracts are versioned.
- [ ] Generated types are refreshed; no manual edits to generated files.

## Backend

- [ ] Ingest remains single-link per job while multi-job reconnect works.
- [ ] XHS/media/VAD/ASR/AMap adapters pass real staging and stubs are not treated as production proof.
- [ ] Flight/rail lookup, AMap terminal matching, route matrix and manual/unknown fallback are separated.
- [ ] Planner owns full schedule; internal fallback cannot create a public alternate version.
- [ ] CandidateCatalog saves owner-scoped Top-5/manual candidates; landmark route proxies are visibly approximate and do not mutate plans.
- [ ] SlotEditor separates structural rejection from derived validation.
- [ ] Validator returns typed preview/apply fixes and reruns after mutation.
- [ ] Validator covers consecutive load, stay/luggage/transfer, companion and fresh/seasonal weather states.
- [ ] Filler cannot alter schedule fields and preserves user overrides.
- [ ] Location context is foreground/minimized and has explicit fallback.
- [ ] Export binds current revisions and enforces hard-conflict/transfer gates.

## Frontend

- [ ] HomeImportDock queue, `N/X`, title, FIFO ten-second results and records.
- [ ] S2/S3 mobile flows and three boundary modes.
- [ ] Picker overview/L3 intent mapping including along_route in overview.
- [ ] S5 pace, collapsed optional constraints and sole start CTA; S6/S7 one timeline shell.
- [ ] Story 2.2 minute editing, day destinations, nullable commute and global undo.
- [ ] Linked-trip confirm/input/transfer divider/hotel-luggage handoff.
- [ ] Day-excursion choice, date/round-trip draft, one-day merged timeline, child-plan actions and active-plan AI scope.
- [ ] Meal pool/undecided/area-food and checklist rail/add Sheet.
- [ ] Incremental conflict/FixSheet, detail/result and export states.
- [ ] Candidate provenance/four-stage completion, load detail and AI-adjust scope/directions are testable.
- [ ] Post-plan search covers exact, no-result, nearby-landmark and unresolved states; Epic 2 saves candidates only.

## Quality and Operations

- [ ] SP assigns OPS-01/OPS-02, DB-CHANGE-01/DATA-VECTOR-01 and METRICS-01/02/03 from the 2026-09-15 prerequisites to actual execution tasks; corresponding production checks have real evidence before release.
- [ ] 5.1 works without full 5.2: S7 plan entry→minimum S10→S9 with readable sources→original S10 context, no duplicate generation/validation.

- [ ] Owner/idempotency/revision/fencing and real DB tests pass.
- [ ] Landmark-proxy tests cover same-city validation, fact non-inheritance, route invalidation and later placement gating.
- [ ] Day-excursion tests cover both confirmed legs, missing return, host/child interval isolation,
  one-host-tab rendering, atomic publish, owner/revision fencing and global undo.
- [ ] Export tests cover base-without-details, exact Plan/Trip revision, existing ValidationRun gate,
  1080/1242, standalone/main-segment/DayExcursion city-unit manifests, one long artifact per unit,
  theme fallback, WebP/JPEG policy, stale preview, reconnect/fencing, private artifact download,
  one-file normal whole-trip composition with host-date DayExcursions, measured/versioned browser and
  encoder limits, numbered city-boundary parts, one logical batch action, directory/multiple-download
  permission paths, no ZIP/city-internal split, indivisible-city failure, capability-gated sharing and
  no schedule/detail mutation.
- [ ] S0-S11 E2E, reconnect, failure, weak-map and accessibility states pass.
- [ ] Xiamen prompt/export fixtures pass without schedule mutation in Filler.
- [ ] Xiamen ingest fixture verifies VAD/ASR skip, short-video frames, evidence/AMap fields and cost telemetry.
- [ ] Langfuse/Sentry/analytics redaction and stage metrics verified.
- [ ] Rate limit, quota, cost guard, provider fallback and DLQ runbooks verified.
- [ ] `pnpm -F nomad-types run generate` and `pnpm -r build` pass.

## Explicitly Disabled for MVP

- [ ] No BYOK user path, Quick/HQ selection, smart-planning switch or alternate-version adoption.
- [ ] No arbitrary history timeline or automatic 48-hour reminder.
- [ ] No cross-timezone/overnight repeated-city main chain, nested/multi-destination excursion,
  same-day A-B-C-A, arbitrary whole-chain reorder or background location tracking.

---

## Source: `docs/architecture/compatibility.md`

# Compatibility (v0.4 to v0.6)

| Concern | v0.4 baseline | v0.6 target | Migration owner |
| --- | --- | --- | --- |
| Production auth | dev identity/OTP and in-memory session baseline | verified identity, stable owner migration, durable multi-device sessions and scoped operator grants | New 1.0 before real-user/first-operator use; historical 1.1–1.5 unchanged |
| User planning flow | Confirm -> Picker -> partial Skeleton -> AI Fill | S2/S3/S4/S5 -> one full PlanningJob -> editable timeline -> detail enrichment | Epic 2, Epic 3, Epic 5 |
| Planner versions | Quick first, HQ switch/adopt | One current PlanningJob; internal attempts fenced and never silently overwrite edits | Story 2.9 |
| Time | fixed 2h/4h visible slots | AI may align 15m; user edits any valid minute | Story 2.3 and Epic 3 editing |
| Picker intent | `selected_required` only | `required / along_route / unselected`, overview mapping | Story 2.7 |
| Validation | permanent pre-Fill gate | initial validation plus mutation-triggered incremental validation | Story 2.11 and Epic 3 repair |
| Filler | arranges remaining blocks and enriches | enriches only; cannot change date/time/order | Epic 5 detail story |
| Import UI | one foreground link | multiple single-link jobs + independent FIFO presentation queue | Story 1.6 |
| Import ownership | job/inspiration foundation | owner import records and protected original URL | Story 1.8 |
| Import processing | stub multimodal seam and text/ocr/vision diagnostics | real media sampling, VAD/ASR, evidence signals, complete nullable AMap facts | Stories 1.9-1.11 |
| Import resume | in-memory event stream plus job final state | persisted monotonic event cursor across process restart | Story 1.7 |
| Geography | L1/L2/L3 and scalar `business_area` hint | provider POI facts and versioned manual corrections; BusinessArea membership separately normalized | 1.11 POI/correction; 6.3 BusinessArea |
| Multi-city | post-MVP or mixed Plan assumptions | Trip aggregate links single-city Plans with atomic TransferLeg handoff | Epic 4 |
| Accommodation | plan-global luggage / display hotel | per-night Stay, breakfast tri-state and LuggageTransition | Story 2.5, Epic 3 and Epic 4 |
| Preferences/load | wake/start fields and coarse pace | optional constraints, evidence-derived interests, pace soft constraints and DayLoadEstimate | Stories 1.9-1.10, 2.6 and 2.14 |
| Meals | ordinary candidate or fixed block | MealSlot fixed/choice/undecided + owner area recall | Epic 6 |
| Shopping | POI or notes | revisioned checklist text with optional label shortcuts; structured attributes/stores and checklist-to-schedule conversion deferred | Stories 6.4-6.5; existing travel buffers remain in Epics 2-4 |
| Location | generic map usage | foreground permission, freshness, fallback and no tracking | Epic 6 |
| Weather | no current contract | reliable forecast/seasonal context, typed validation and preview-only adjustment | Epic 3 |
| Export | `/export/png` and Plan-oriented rendering | current-revision image export, WebP/JPEG output policy, durable job and hard-conflict gate | Story 5.4 |

Compatibility inputs may be accepted temporarily at API boundaries, but the mobile client must
not expose deprecated Quick/HQ adoption, smart-planning toggle, fixed 2h/4h user edits or BYOK.
Removal requires telemetry and a separately reviewed migration; deprecated input must not select
a different user-visible workflow.

---

## Source: `docs/ops/rate-limits.md`

# Rate Limits, Platform Quotas, and Degrade Switches (v1.1)

Updated: 2026-09-13

## Principles

- Platform-managed AI is the MVP path; BYOK does not bypass limits.
- Protect by user, device, IP and workspace, with task-specific global concurrency/cost guards.
- Queue honest excess work; never create a second user-visible planning version.
- Every write/job is idempotent. Retry budget is separate from user product quota where failure is ours.
- Exact thresholds are remotely configurable and validated in staging before production rollout.
- Quotas/usage/balance/reset windows are internal only. The user-approved 7.3 scope exposes
  account and available actions, not a usage dashboard; hiding them never disables enforcement.

## Default Policy Bands

| Capability | Primary dimensions | Default starting policy | Degradation |
| --- | --- | --- | --- |
| OTP | phone + IP + device | 5/hour, 10/day | captcha/cooldown |
| XHS ingest | user + device + workspace | 30 jobs/day, small concurrent job cap | queue, retry later, media-only fallback where safe |
| AMap search/resolve | user + provider quota | 60 searches/hour plus cache | cached result, honest unavailable |
| Initial PlanningJob | user + Trip/workspace | 1 active per user/Trip, 60 starts/day | same-job queue/internal lower-cost fallback |
| Validation/fix | user + Plan | burst-protected, higher non-AI allowance | delayed validation with visible pending state |
| Conversational adjust | user + workspace | 10/hour | direct editing remains available |
| Detail enrichment | user + workspace | 10/hour, 1 active per Trip | partial/retry later; schedule remains usable |
| Meal/location recall | user + foreground session + current meal scope | coalesce same app-open/resume event, short burst cap and AMap cache; no timed/background polling | plan-context fallback/no hint |
| Export | user + workspace | configurable daily job and storage budget | queue/lower-cost encoding/later retry |
| Account export/delete | user + account | low frequency, one active | resumable job |

The import UI may present many single-link jobs, but processing concurrency remains bounded. Its
ten-second FIFO presentation queue is a client UX policy and does not keep compute slots occupied.

## Cost Controls

- Per-task model routing and token/media ceilings.
- Daily user/device/workspace cost bands and global provider spend cap.
- Retry budgets, provider-fallback budget and abnormal-spend circuit breaker.
- User UI exposes only actual available/recovery actions and factual job stages, never remaining
  bands, limits, used counts, reset times, token cost or currency. Do not claim a request is queued
  unless it was actually accepted into a queue. Operator metrics remain internal.
- Operator controls include task kill switch, model route, concurrency, queue depth, max attempts,
  timeout and budget; all changes are audited.

## Idempotency and Concurrency

- Ingest key: owner + normalized URL; duplicate returns the owner's durable record/job result.
- Planning start key: owner + planning draft revision + explicit start nonce.
- Mutation/fix/undo key: owner + expected revision + command idempotency key.
- Fill/export key: exact Trip/Plan revision + scope/options.
- Only one current fenced PlanningAttempt may publish. Queue/retry never overwrites a newer revision.

## SSE and Queue Behavior

- Heartbeat <=10s, idle timeout 30s and resumable last-event cursor.
- Client reconnect backoff starts 1s, then 2s/4s with jitter and a capped background retry policy.
- Queue status, stage and failure are factual. No percentage without durable numerator/denominator.
- 429/503 include safe error code, `Retry-After`, retriable flag and correlation id.

## Degrade Switches

Story 8.3's route publication/pause boundary was approved on 2026-09-08. Route settings below are
logical policy concepts, not multiple writable Unleash flags. PostgreSQL owns one versioned route
release; ordinary flags may only narrow their approved capabilities, not select another model or
override a pause. Accepted/queued jobs keep their snapshot. Every later external attempt still
checks current valid pause/budget authority and shares the existing total retry/deadline envelope.
Control-source failure disallows publication and unverified new-task acceptance; trusted existing
snapshots are usable only while safety authority remains valid. Pause does not revoke a request
already sent. Resume is explicit; rollback creates a new release and clears neither pause nor
breaker state. Actual propagation/freshness limits require tests, not an instant-global-stop claim.
Centralized reservation/settlement and policy editing are approved Story 8.4 targets below;
planning approval does not prove them implemented.

- `maps.list_only`, `maps.optional_overlays`.
- `ingest.max_concurrency`, `ingest.disable_asr`, `ingest.media_only_fallback`.
- `planning.provider_route`, `planning.internal_fallback`, `planning.max_attempts`.
- `meal.location_recall`, `meal.area_food_hint`.
- `detail.provider_route`, `export.queue_only`.

No flag enables public Quick/HQ adoption, smart-planning toggle, BYOK MVP, background location or
cross-timezone linked trips.

## Central Budget Governance (Approved Story 8.4)

Approved 2026-09-13 with 26 GWT, desktop Web operations and the amount-source clarification.
Extend the existing Node/Fastify/Prisma/PG stack with one budget authority; no new gateway or
billing platform, subscriptions or user quota UI. Operator mobile adaptation is not required.

- Draft/check/publish and tariff-registration operations use real environment-scoped authorization,
  immutable versions, expected-current-version and durable audit receipts. Budget and route
  versions are separate; publication/rollback cannot clear usage, 8.3 pause or real breakers.
- Product counts reserve once with logical Job acceptance or the immutable export identity.
  Internal attempts, reconnects, download/share do not consume new product counts; policy-defined
  refunds happen at most once, without deleting actual provider requests or cost.
- Every actual paid attempt obtains sufficient bounded cost reservation atomically across all
  applicable scope/window buckets. Unique identities, short PG transactions and fixed locking
  handle competition and empty-window creation; external HTTP stays outside DB transaction retries.
- Persist dispatch intent and validate current eligibility/fencing/pause/budget plus bounded permit
  freshness before sending. Tightening can stop old unsent reservations; sent requests still settle.
  Requests, active Job concurrency and upstream in-flight concurrency have separate limits. Queueing
  does not occupy an outbound slot, and worker expiry is not proof the upstream stopped.
- Confirmed costs, conservative estimates, unsent reservations and in-flight/unknown holds are
  mutually exclusive. Known facts settle idempotently; only proven-unsent exposure can be released.
  Late responses still settle after business fencing is lost. Real overage is recorded in full.
- Register actual-seller tariffs with currency/unit/model/tier, evidence and effective version.
  Reported usage times price is estimated money; supplier receipts/bills confirm only matching
  coverage. Aggregate bills cannot invent per-call actual amounts. Account balance is independent;
  unsupported price/billing/balance APIs remain unavailable, not zero or simulated.
- Operator budgets are internal limits, not supplier wallet funds. Preview has a data timestamp;
  after publishing, read the current authority and subtract confirmed/estimated/reserved/unknown
  exposure. Do not reuse preview values as current facts or reprice old confirmed charges.
- Late settlements retain original windows; unsent cross-window reservations revalidate atomically.
  Publishing/timezone changes do not create empty free budgets; unresolved risk has cross-window
  protection. Unknown price bounds or budget authority prevent new paid dispatch.
- Minimal protected desktop Web provides policy/tariff/source/usage/reconciliation operations.
  No arbitrary URL fetches or formula scripts. 7.5 cleanup covers new personal links, with necessary
  non-identifying totals separated from personal retention. Telegram/overview remain 8.5/8.6.

Actual provider tariffs/limits, refund rules, thresholds, permit freshness and concurrent/failure
behavior remain implementation gates. Guarantees cover registered traffic and validated upper
bounds, not every charge in a shared supplier account. Existing trip/manual/account/feedback
operations retain their original availability contracts when the AI budget is exhausted.

## Operator Quota and Provider Alerts

- Internal low/quota/degraded states map to honest available/recovery actions without exposing
  quota to users, and do not page an operator. Ordinary 429s, first-attempt timeouts and failures
  with a viable cache/retry/fallback path remain recoverable and must not send Telegram messages.
- The alert evaluator runs only after adapter retry/fallback accounting. Initial terminal classes are
  AI or AMap authentication/billing failure, quota exhaustion that requires administrator action,
  all configured routes unavailable, a sustained open circuit, and repeated terminal job failure
  above a configurable windowed threshold.
- Fingerprint alerts by environment + provider + capability + stable error code. Aggregate counts,
  enforce a configurable cooldown, update first/last seen timestamps and send one recovery notice
  after the condition clears. Process restarts must not reset dedupe/cooldown state.
- Telegram is a server-side notification adapter. Bot token and chat id come only from secret-backed
  configuration; they never enter mobile payloads, source control, analytics or ordinary traces.
- Payloads may include environment, provider/capability, severity, stable code, aggregate count,
  first/last seen and correlation id. They must not include user text, POI/hotel/route details,
  protected URLs, exact owner identifiers, request/response bodies, tokens or Provider secrets.
- Telegram timeout/failure never changes a user Job, Plan, retry budget or circuit decision. Record a
  durable delivery attempt with bounded retry and a visible internal failure metric/alert path.
- Policy thresholds, routing, mute windows and test-message actions are audited. Production rollout
  requires a redacted staging test for trigger, dedupe, cooldown, recovery and Telegram failure.

## Terminal Delivery Operations (Approved Story 8.5)

The 24 GWT and two desktop R1 boards were approved on 2026-09-13. This section is a target,
not evidence of a configured Bot, reachable destination or successful message delivery.

- Consume durable eligible facts after retry/cache/fallback accounting. Ordinary recoverable
  failures, per-user limits, evaluation findings and unknown cost alone do not page operators.
- Stable environment/service-account/capability/error/rule fingerprints have separate episodes;
  event IDs dedupe counts, notification sequence and actual send attempts remain distinct.
- Persist incident transitions with unique outbox records, source cursor/sequence, first/last times,
  policy/target versions and next-send time. A fenced worker rechecks current state before sending.
- One bounded retry controller respects Bot/target rate limits and retry_after across restarts.
  No hidden SDK retry loop or paid broadcasts. Success stores a validated Message receipt,
  not read proof; ambiguous network/receipt-persistence failures keep unknown status and duplicate risk.
- Auth/permission/topic errors stop futile sends. Migration needs controlled target confirmation;
  never drop a topic or switch to an unregistered chat. Repairing delivery does not prove service health.
- Time-limited mute preserves incidents and recovery evaluation; expiry evaluates current state,
  not the historic backlog. Recovery needs current same-scope evidence. Unsent stale alerts are
  canceled, known delivered alerts get one recovery, unknown sends retain that uncertainty in recovery.
- Protected desktop Web exposes policy drafts/check/publication, event and delivery evidence,
  mute/repair/retry, and separately confirmed synthetic TEST sends. Static checks never send.
  No 8.6 dependency, mobile adaptation, inbound Bot commands or remote repair actions.
- Allow only bounded operational fields and protected read-only links. Token-bearing URL paths,
  raw chat IDs/objects, request payloads and private content stay out of all telemetry/log exits.
  Local retention cleanup is distinct from Telegram copies. Independent status reveals delivery
  failure without recursive Telegram or newly added email/SMS channels.

Actual limits, timing, delivery permissions, ordering races, persistence failures, token-sentinel
checks and real staging Message/desktop evidence remain implementation gates. Notification
failure cannot undo business transactions, alter platform cost or consume service retry budgets.

## Overview Query Limits (Approved Story 8.6)

The desktop read-only overview honors each actual source's API/version/plan/history boundaries.
Fixed queries have per-source deadlines, row/window/concurrency bounds and permission-scoped
coalescing/cache. Do not multiply a shared organization API budget by every browser or panel,
rotate keys to bypass rate limits or mark cached results as freshly observed data.

Partial failures/429/stale results are visible without clearing other authorized sources. Bounded
read work must not starve 8.4 budget transactions or 8.5 workers. Refresh does not initiate AI/AMap
business calls, evaluation, ledger repair, incident recovery or test sends. Native tool access is
independent; unavailable capabilities are not silently bought/upgraded or simulated as delivery.

## Privacy and Abuse

- Provider secrets, prompts, raw source URLs and exact location are redacted from limit logs.
- Cross-user content fingerprint reuse cannot merge quotas, ownership or records.
- OTP abuse can trigger captcha. Ingest/planning abuse can reduce queue priority or require cooldown.
- Operators see pseudonymous identifiers, policy decision and cost band, not unnecessary content.
