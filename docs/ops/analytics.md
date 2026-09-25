# Analytics & Telemetry (v0.6 Approved Target)

Updated: 2026-09-07. Story 8.1 replaces the v0.3-light event dictionary; this is a planning
contract, not proof that current SDKs or emitters implement it. See
`../architecture/observability.md` and the approved Story 8.1 for instrumentation and retention.

## Versioned Event Contract

- Use canonical S0-S11 stages and event names from `../front-end-spec.md`. Each enabled event
  declares schema version, emitter, allowed properties, value/size limits, outcome and identity.
- Frontend interactions and server-confirmed facts are distinct events. HTTP acceptance, opening
  SSE, reconnecting or external navigation cannot count as completed work.
- Repeated deliveries preserve an event identity; attempts and jobs have separate identities.
  Do not double-count a compatibility event and its new equivalent.
- Only emit implemented capabilities; missing telemetry remains missing, not a synthetic success.
- Historical HQ/seed-adoption, BYOK, check-in and user-quota-warning events are not active MVP
  metrics. This does not change retained historical reports or add replacement user screens.

## Approved Event Families

| Family | Safe categorical facts | Outcome boundary |
| --- | --- | --- |
| Login/input/import | entry category, classification, stage, actual counts, stable error | No phone, URL or natural-language input; parsed/presented/opened are different |
| Time/stay/Picker | mode, explicit-confirmation result, intent counts, scope category | No hotel/POI names, precise dates/routes, evidence or inferred confirmation |
| Planning/attempt | stage, fallback category, actual outcome, opaque job/attempt references | One visible job; an attempt failure need not be a job failure |
| Mutation/validation/undo | command category, confirmed outcome, conflict category | No payload/diff content; preview is not applied, validation is revision-bound |
| Meals/checklist/search | recall basis category, result count, location mode, explicit action | No position, search text, record text, store/POI identity or implicit arrival |
| Detail/citations/export | completion category, safe counts, source category, derived unit type | No generated text, raw citations, signed URLs or image bytes; no save inference |
| Recent/account/privacy | navigation category, durable task phase, actual result | Half-filled input is not failure; queue acceptance is not export/deletion completion |
| Feedback | source_page category, actual host mode, safe error/result | Open and first-party stored receipt are separate; third-party submit remains unobserved |

This table constrains the event dictionary, not a new API schema. The implementation maps the
actual typed domain contract to these facts without inventing new service operations.

## Allowed Correlation and Measurements

- Schema/deployment versions, timestamp, safe event/correlation/job/attempt/revision references.
- Optional pseudonymous session/owner link only where necessary for diagnosis/cleanup, never
  raw authentication identifiers. Store the minimal restricted lookup separately if needed.
- Approved low-cardinality stage/capability/provider/outcome/error labels; no owner/job/POI IDs
  as metric labels.
- Actual latency and counts. Usage/cost is nullable; estimates carry method/version and are not
  a billing ledger. Sampling, drop counts and coverage windows remain visible to operators.
- Validate untrusted headers and values before association; correlation never grants access or
  lets the caller force recording. Two tools may use different trace IDs and shared safe job refs.

## Before-Send Privacy

Apply allowlists and value-level limits at every logger/SDK/export boundary, including nested
objects, error strings, span names/resources/events, breadcrumbs and encoded values. Drop unsafe
telemetry rather than failing business work. A SDK PII flag, key blacklist or server-side scrubber
alone does not satisfy this contract.

No raw search/manual text, user itinerary, exact location trail, POI/hotel/route, full prompt/output,
SQL values, feedback content, media/base64, source or signed URLs, cookies/tokens/keys or other
owner data. Disable Replay/profiling and broad automatic form/request/console capture. Browser
credentials are limited to explicitly public SDK configuration; source-map upload secrets stay in CI.

## Operator Query and Delivery

- Reuse Sentry and explicitly isolated Langfuse tracing with independent bounded sampling; no
  new public Nomad dashboard. Keep safe structured local logs with tested bounds.
- SDK/exporter outage, full queue or flush timeout changes telemetry coverage only, not domain
  truth, user retries, budgets or published plans. No recursive error reporting or raw disk spool.
- Protect operator/project/environment access. Define actual TTL and verify owner-linked cleanup
  through 7.5; pseudonymization and access expiry are not proof of erasure. Internal traces are
  excluded from the 7.4 account copy.
- Distinguish application acceptance, async terminal result, telemetry export and query availability.
  No-op/dev mode does not count as a real integration pass.

## Separate Epic 8 Responsibilities

8.1 enables actual safe query/diagnosis. 8.2 owns reproducible evaluation, 8.3 route changes,
8.4 centralized budgets, 8.5 operator Telegram and 8.6 aggregate overview. Their later delivery
cannot delay safeguards required at a business capability's first use.

## Verification

Capture test network envelopes for every sink with synthetic sentinel secrets and private values.
Cover concurrent identities, bad headers, retry/reconnect, sampled and unsampled parents, missing
usage, event storms, disabled SDK/exporter failure, bounded shutdown and cleanup races. Verify a
real authorized error-to-AI-attempt lookup and symbolicated production build. Record overhead and
loss against the telemetry-disabled baseline; screenshots, SDK installation and HTTP 202 are not
complete delivery evidence.
