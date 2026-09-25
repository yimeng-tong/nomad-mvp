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

## App Authentication Boundary (Approved 2026-09-19)

1.0 复用现有持久 User/OAuthIdentity/Session，为原生会话传输/登录回调提供同等认证、资格、owner、一次性和撤权边界；普通 App 字段或本地 origin 不授予身份。API/SSE/下载必须一致验证；接口变更由 OpenAPI 先行。详见 `app-host.md`。
