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

## Native Host Boundary (Approved 2026-09-19)

遵守 `app-host.md`：薄平台接口承接 App/返回/键盘/安全区/受限外链；业务插件在首次责任 Story 进入。前台恢复先核实身份，再恢复 job/revision；不承诺后台 SSE 或自动重交未知写入。系统返回尊重草稿和 Sheet，权限/外链返回不自动提交。


## Approved shared UI, read and navigation layers (2026-09-20)

采用ui-foundation.md的Nomad基础/组合/业务三层及UX-DR37；受保护Portal与页面共享身份遮蔽边界，AppSheet唯一拥有焦点/滚动/关闭适配。Query9.6与Router9.7的权威边界、默认重试/刷新限制和回退详见frontend-data-navigation.md。9.3先实际迁移现有入口，后续页面归原业务Story。业务controller/journal/cursor/session不被通用组件、cache或router替换。
