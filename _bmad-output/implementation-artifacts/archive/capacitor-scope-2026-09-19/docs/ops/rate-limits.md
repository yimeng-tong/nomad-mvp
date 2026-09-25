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
