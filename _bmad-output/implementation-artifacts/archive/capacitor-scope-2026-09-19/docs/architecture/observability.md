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
