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
