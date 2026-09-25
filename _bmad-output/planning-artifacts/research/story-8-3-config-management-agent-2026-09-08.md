---
project: nomad-mvp
story: '8.3'
date: 2026-09-08
research_scope: existing-unleash-sdk-and-configuration-release-management
status: research-input-for-main-agent-review
storyApproved: false
deploymentAuthorized: false
implementationPerformed: false
---

# Story 8.3 Configuration Management Research

## 1. Decision Summary

**Retain Unleash as the leading reuse candidate for configuration distribution and operator access. Do not treat its Boolean wrapper, JSON variants, approval UI, or SDK backup as an already implemented safe Provider router.** Unleash can distribute structured selections without putting its server on every Provider request. Nomad must still own validated route snapshots, release identity, adoption receipts, business last-known-good (LKG), and in-flight enforcement.

There are two bounded adoption paths:

| Path | Feasibility and benefit | Cost or limitation | Recommendation |
| --- | --- | --- | --- |
| Unleash Enterprise UI/change requests plus a narrow Nomad validation/publication adapter | Mature draft/review/apply workflow, permission separation and richer audit presentation; least operator-workflow construction | Paid entitlement; native approval does not validate Nomad's provider capabilities, secret references or job semantics | Preferred when paid native governance is acceptable; purchasing is not authorized |
| Unleash OSS distribution plus protected Git configuration releases | Reuses SDK, Admin UI for inspection and existing Git/CI concepts for diff, review and immutable release evidence | OSS has no native change-request approvals or fine-grained project roles; sole-writer publishing and protection against direct edits require explicit design | Credible lower-service-footprint alternative, conditional on verified repository protections and operator acceptance |

These are alternative release-management workflows, not two simultaneous sources of production truth. No additional feature-flag/configuration product is recommended or surveyed. No AI gateway, provider benchmark or invocation-engine research is included. Capability facts are grounded in the [official OSS comparison](https://docs.getunleash.io/support/oss-comparison), [change-request documentation](https://docs.getunleash.io/concepts/change-requests), and pinned SDK/server sources below. The adoption judgment is an engineering inference, not an installation result.

## 2. Scope and Authority

Read-only local inputs, in recovery order, included:

- [CURRENT.md](/home/tong123/work/nomad-mvp/CURRENT.md), [project context](/home/tong123/work/nomad-mvp/_bmad-output/project-context.md), and [historical sprint status](/home/tong123/work/nomad-mvp/_bmad-output/implementation-artifacts/sprint-status.yaml).
- [Legacy current implementation story](/home/tong123/work/nomad-mvp/_bmad-output/implementation-artifacts/2-2-timeline-editing-undo-and-history.md), inspected as paused historical execution context, not the 8.3 contract.
- [Approved Epic 8 breakdown](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/epic-8-story-breakdown-proposal-2026-09-07.md) and [approved evaluation/operator decision](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/evaluation-operator-scope-decision-2026-09-07.md).

The report preserves these boundaries:

1. Story 8.2 may configure experiments and produce evaluation evidence. Its Langfuse labels, experiments and results cannot publish production routes, implicitly or automatically.
2. Story 8.3 owns task-level Provider/model/fallback configuration, validation, publication, effect checking, LKG and audit/rollback. It must be operable before 8.6 exists.
3. Story 8.4 owns centralized budget/concurrency/usage-policy editing and accounting. This report does not create that system or make 8.3 depend on it.
4. Earlier business stories already own first-use limits, timeout, retry, fallback, circuit breaking and redaction. Route changes consume those protections, not replace or defer them.
5. No change can bypass owner checks, attempt fencing, immutable Plan/Trip publication, current-city AI scope or frozen facts. Configuration rollback is not itinerary rollback.
6. Implementation remains paused. Recommendations and acceptance topics here are not approved GWT, a deployment decision or a runtime verification result.

**Research execution:** this is the bounded configuration-management research input requested for the main agent. No callable subagent tool was exposed in this execution, and no additional agent/model was launched. Main-agent cross-verification and any delegation provenance remain for the coordinating task to record; this file does not claim those gates have passed. Only public documentation/GitHub reads and narrowly scoped local source reads were used. No secrets, production systems, models, installations or memory writes were used.

## 3. Corrected Local Baseline

The user's correction was verified locally; the main agent still owns the overall baseline audit.

| Observed evidence | Implication |
| --- | --- |
| [Server package](/home/tong123/work/nomad-mvp/apps/server/package.json:37) declares `unleash-client: ^6.7.0`; [lockfile](/home/tong123/work/nomad-mvp/pnpm-lock.yaml:118) resolves `6.7.0` | Use SDK 6.7.0 semantics for the current baseline. Earlier mentions of `^6.2.0` are superseded |
| [flags.ts](/home/tong123/work/nomad-mvp/apps/server/src/integrations/flags.ts:5) conditionally creates a client using `initialize` | This proves integration code exists, not that a real Unleash service/token is configured or reachable |
| [Wrapper](/home/tong123/work/nomad-mvp/apps/server/src/integrations/flags.ts:10) exports `isEnabled(flag, fallback = false)`, not `getFlag` | No structured route-read API is exposed here |
| The wrapper returns `fallback` only when `client` is absent; otherwise it calls `client.isEnabled(flag)` without forwarding that fallback | Do not assume callers receive their supplied fallback after client creation but before readiness, or for a missing flag |
| `await initialize(...)` is present | SDK 6.7.0 `initialize` synchronously returns an `Unleash` object. Awaiting that object does not await configuration readiness |

The last point is source-confirmed by [SDK 6.7.0 initialization](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/index.ts). No code correction was performed.

## 4. Versioned Evidence

All remote sources were retrieved on **2026-09-08**. Public documentation/pricing describes the currently advertised product and can change. GitHub implementation claims below use fixed commits, not moving `main` links. Annotated tag targets were resolved using public `git ls-remote`; no repository was cloned.

| Component | Fixed evidence | Interpretation |
| --- | --- | --- |
| Current Nomad SDK baseline | `v6.7.0` -> `2c01030a97c24af4d0f642f3543946c1103871fe`; [release](https://github.com/Unleash/unleash-node-sdk/releases/tag/v6.7.0), [package](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/package.json) | Apache-2.0; package declares Node `>=16`. This is a package constraint, not a recommendation to run unsupported Node versions |
| Newer SDK observed | `v6.12.1` -> `3c04a7a2b3c284c5fa347f4f75b5640b2abf625c`; [release](https://github.com/Unleash/unleash-node-sdk/releases/tag/v6.12.1), [package](https://github.com/Unleash/unleash-node-sdk/blob/3c04a7a2b3c284c5fa347f4f75b5640b2abf625c/package.json) | The release list showed this as latest; package declares Node `>=20`. Maintenance evidence only, not an upgrade approval |
| Server research baseline | `v8.1.0` -> `9445b1e570e9fe1e41083c6787929cfef58a7cc3`; [release](https://github.com/Unleash/unleash/releases/tag/v8.1.0), [official dated release note](https://docs.getunleash.io/release-notes/2026/8/5) | Released 2026-08-05 and shown as latest in the inspected release list. No deployed Nomad server version was determined |
| Server packaging | [Pinned package](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/package.json), [license](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/LICENSE) | Node `>=22`; repository/npm license is `AGPL-3.0-or-later`; official Docker licensing differs, discussed below |

**Version caution:** the live [Node documentation](https://docs.getunleash.io/sdks/node) lists Node 22.13+, unlike the two pinned package engine ranges. Use the exact selected package, its transitive requirements and a tested runtime matrix; do not retrofit current documentation onto 6.7.0. SDK and server have independent release series. Their connection, authentication and needed variant features must be tested together. GitHub has continuing releases and implementation tests, but neither release activity nor repository popularity proves Nomad compatibility.

Public GitHub REST requests returned 403 in this environment. Public release pages, raw files and Git tag reads supplied the evidence instead. Some guessed source paths returned 404 and were not used as evidence. No deployment, compatibility suite, resource benchmark or paid workflow was executed.

## 5. Structured Configuration

### Verified vendor capability

Unleash strategy variants carry a name, weight and optional typed payload. The [official variant guide](https://docs.getunleash.io/concepts/strategy-variants) describes JSON, string, number and CSV payloads. Strategy variants require server 5.4+ and compatible SDK support. A single 100% variant avoids cohort assignment for an ordinary production configuration release. Multiple variants without a stable context can select differently between evaluations; this must not silently reroute an ongoing job.

At the wire level, `payload.value` is a **string**, including for JSON. The [pinned server variant schema](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/src/lib/openapi/spec/variant-schema.ts) defines the envelope, not Nomad's routing schema. Its API weight scale is 0-1000, whereas UI percentages are 0-100. The [SDK payload/selection implementation](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/variant.ts) returns the payload; it does not turn it into a validated provider configuration.

The [Client Features response `version`](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/src/lib/openapi/spec/client-features-schema.ts) identifies the **response format**, not an immutable business release. A flag name, variant name, event ID or ETag alone is also insufficient as a complete approved Nomad route revision.

### Recommended Nomad contract, not an implemented schema

Use a small, versioned routing document for the finite task-capability registry from earlier stories. Start with one validated document carried by one production route flag/variant, rather than separately mutable flags for provider, model and each fallback. This reduces mixed-field configurations. A future move to referenced immutable bundles is optional and must not add an unbounded runtime fetch dependency.

| Proposed field or invariant | Reason |
| --- | --- |
| `schemaVersion`, environment, content revision/hash | Reject unknown schema, wrong environment, corrupt or substituted content |
| Distinct monotonic publication identity and reusable content identity | Rollback can republish old known-good content as a new authorized publication without replaying an old publish command |
| Task/capability -> ordered route candidates | Records primary and bounded fallback order; this is not an Unleash weighted-variant fallback list |
| Registered provider/model identifiers and allowlisted secret references | No credentials, arbitrary base URLs, script bodies or executable templates in remote config |
| Capability/schema compatibility checks | Prevent text-only routes receiving image/audio work, unsupported structured outputs, or missing model/adapter capability; the gateway agent owns detailed provider implementation research |
| Existing safety-policy references | Reuse earlier timeout/retry/concurrency/budget enforcement. Do not add 8.4 budget editing here |
| Base publication, change reason, actor and validation evidence references | Make stale edits, approvals and rollback intentions traceable |

Validation must occur both **before publication** and **before adoption**. Check bounded size/depth, required fields, unknown fields, duplicate task definitions, unknown IDs, empty/duplicate fallback entries, incompatible capabilities and prohibited addresses/scripts/secrets. A syntactically valid JSON payload can still be an invalid route. Version-to-hash mappings must be immutable; a hash is an integrity check, not proof that the publisher was authorized.

The exact allowed task IDs, document limits, approval policy and content-hash canonicalization are Story-definition decisions. This report intentionally does not invent the complete production routing registry or formally impose a new two-person gate without approval.

## 6. Environments and Release Governance

| Area | OSS | Enterprise / paid distinction | Nomad requirement |
| --- | --- | --- | --- |
| Environment isolation | Two environments and one project | Additional projects/environments and environment management | Scope production and non-production credentials separately; verify actual installed edition/version |
| UI and API | Core Admin UI, SDKs and APIs | Additional governance surfaces | Operable inspection, validation, publish and rollback entry before 8.6 |
| Drafts and approvals | No native change-request workflow | Native change requests, grouped changes, approval/apply roles and scheduling | Choose one authorized writer and tie validation/approval to the exact proposed content |
| Permissions | Basic root Admin/Editor/Viewer | Project/custom roles, groups, SSO and service accounts | Evaluation operators cannot gain production write authority implicitly |
| History and audit | Basic event log | Advanced event information, event timeline and advertised extended retention | Keep actual before/after/reason and publication/adoption evidence; no assumed immutable WORM log |
| Release templates/automatic progression | Not an OSS baseline | Paid capabilities | Not needed for MVP task-route changes; defer automatic promotion |

Edition distinctions above are verified against the [official comparison](https://docs.getunleash.io/support/oss-comparison). Its description of OSS being suited to 1-4 server instances is guidance, not a demonstrated hard four-instance enforcement limit.

**Environment selection:** the backend API token determines which environment's flag configuration is fetched. The legacy SDK `environment` context property is not an environment-access boundary. Development cannot be made safe by merely changing an app label while reusing a production token. [Official environment semantics](https://docs.getunleash.io/concepts/environments).

**Enterprise workflow facts:** editing a submitted change request revokes prior approvals. Approval, apply and skip capabilities are separate permissions; skip applies to environment-specific changes. Admins can approve/apply their own changes, so enabling change requests is not an unconditional separation-of-duties guarantee. A scheduled change is not canceled merely by disabling change requests afterward. For MVP, avoid scheduled publication unless specifically needed. [Official change-request flow and exceptions](https://docs.getunleash.io/concepts/change-requests).

**Proposed controlled Enterprise use:** let mature UI handle drafts, diffs and review, but permit ordinary production application only through a narrowly authorized publisher that validates the entire final payload and expected base revision immediately before applying it. Verify API permission interactions and exact-version behavior during implementation. Neither an unchecked manual UI apply nor an unverified webhook constitutes that gate. Retain a separately authorized, audited break-glass path rather than giving all editors skip/Admin rights.

**History is not a release ledger:** events can contain actor/time/environment plus `data` and `preData`, but these fields vary by event type. Event Log and the paid Event Timeline are different surfaces. A control-plane event records a configuration operation, not proof that every worker adopted it. [Official events](https://docs.getunleash.io/concepts/events).

**Rollback:** retain each validated content artifact and publish a new release selecting a previous one, rechecking current adapter/schema and secret-reference validity. Serialize publishers and reject stale base versions; record `rollbackOf`/target/reason, then verify adoption. Do not use a whole-database restore as a routine route rollback, assume generic one-click immutable-version restoration, or undo user itineraries.

Import/export is useful for configuration migration and backup assistance, not a complete restore guarantee: exports omit actual segment/custom-strategy definitions and release plans. Current import documentation describes validation and a draft change request when applicable. Rehearse exact target-version behavior rather than using bulk import as an emergency bypass. [Official import/export](https://docs.getunleash.io/concepts/import-export).

## 7. SDK Readiness, Cache and Outage

These findings apply to **pinned SDK 6.7.0**, not every SDK or future version.

| State or event | Verified behavior | Safe interpretation for 8.3 |
| --- | --- | --- |
| `initialize` | Returns the singleton object synchronously | Client object exists; no remote readiness conclusion |
| SDK `ready` | The repository can become ready after loading usable backup/bootstrap or API data | A local evaluation may be possible; freshness and business validation are separate |
| SDK `synchronized` / `isSynchronized()` | Set on the first repository `changed`; bootstrap calls the same save path | Not proof of a fresh server round trip if bootstrap is configured |
| `startUnleash` | Waits for `synchronized` using `events.once` if needed | More meaningful than `await initialize`, but no Nomad business-readiness guarantee or built-in overall application startup deadline |
| Later `changed` / `unchanged` | Configuration updates and HTTP 304 can be observed | Track successful contact separately from content changes; one initial event cannot measure continuing health |
| Boolean/variant check before readiness | Fallback handling is used | Explicitly define no-config behavior; do not silently pick an arbitrary provider |

Evidence: [initialization functions](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/index.ts), [Unleash lifecycle and evaluation](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/unleash.ts), and [repository backup/bootstrap/save paths](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/repository/index.ts). The repository loads backup, bootstrap and network concurrently; do not invent a guaranteed sequential initialization order from documentation shorthand.

### Cache is not business LKG

The default storage is a JSON file in a temporary-directory-backed path. Its key derives from `appName`; `FileStorageProvider` directly writes the serialized payload and reads/parses it back. It does not itself provide a durable, environment-bound, versioned atomic LKG protocol. Ephemeral containers, shared paths or interrupted writes matter. Separate environment/instance cache namespaces and durable storage requirements must be verified. [Pinned file storage](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/repository/storage-provider-file.ts).

The repository performs limited feature-envelope checks and stores received definitions; it cannot validate Nomad's JSON business fields. Accordingly, an invalid new routing payload must not replace the **last business-validated snapshot**, even if it is already in the SDK's newest cache. Retain the accepted content hash, environment, validation/schema version and acceptance time independently using existing persistence where suitable. This is a small 8.3 responsibility, not a new general configuration service.

### Outage and recovery

The 6.7.0 default is full polling every 15 seconds; metrics default to 60 seconds. Evaluation uses local state. A control-plane outage can leave previously fetched flags usable but unable to receive a new disable/release. No hard maximum staleness or universal kill deadline follows from this design. [Pinned defaults](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/unleash.ts).

Important exact-version behavior: polling backs off for 404/429 and selected 5xx responses; 401/403 take the configuration-error path, emit an error and schedule no next timed poll. Do not promise automatic recovery after credentials are fixed or rotated without an explicit tested refresh/reinitialization path. Network failures and HTTP statuses also do not all use identical backoff logic. [Pinned polling implementation](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/repository/polling-fetcher.ts).

Proposed states for Nomad are `no-validated-config`, `validated-bootstrap`, `live`, `stale-LKG`, `candidate-rejected`, `auth-failed` and `adoption-pending/partial`. These are not existing SDK enum values. Use bounded startup waiting, an approved safe baseline where valid, and typed refusal/degradation for affected tasks if none is admissible. Keep unrelated application functions available. Define acceptable stale-use duration by task and emergency policy; do not declare it unlimited or zero without alignment.

Record source provenance and freshness truthfully. `changed` alone cannot distinguish bootstrap from remote contact in this version. A successful 304 proves contact but does not make an invalid candidate valid. Any required provenance instrumentation must be implemented and tested, not guessed from `await initialize`.

## 8. Safe Switching and Kill Semantics

Everything in this section is a **proposed Nomad contract**. Unleash supplies configuration evaluation, not cancellation of Provider HTTP requests or fencing of domain commits.

| Situation | Recommended semantics to align in detailed GWT |
| --- | --- |
| Ordinary release before a new job | Bind the accepted route publication/content snapshot when admitting the relevant task/job |
| Ordinary release while a job runs | Keep its chosen snapshot and bounded fallback ordering; no silent restart, rerandomization or replay of already completed stages |
| Provider failure inside a job | Earlier retry/fallback rules operate on admissible registered candidates; configuration does not create extra budgets or infinite fallback loops |
| Emergency provider/task disable | Recheck a separately defined admission/revocation policy before each new external attempt, including retries and fallback calls |
| Disable while an external request is already executing | Cancellation is best-effort only where the adapter/transport supports it. Specify whether late results may be accepted or are fenced off; never claim already spent provider usage is undone |
| Disable during control-plane disconnection | An instance cannot observe a new flag it has not fetched. Report stale enforcement visibility; a hard deadline needs an independently designed/tested local or admission mechanism |
| Re-enable or rollback | Must not clear an unrelated emergency revocation or resurrect a killed route by loading old LKG; recovery is explicit and authorized |
| Reconnect, worker restart or job retry | Recover durable snapshot/attempt identity and latest applicable revocation state; no duplicate publication or unbounded fresh attempt |

The Unleash flag type named `Kill switch` is a classification; it does not add a cancellation hook to Nomad's job engine. [Official feature-flag types](https://docs.getunleash.io/concepts/feature-flags). Streaming reduces propagation latency only when the deployment and entitlement support it; it still is not provider-call cancellation. The pinned SDK's default is polling, not a promised instant push channel.

Do not conflate deliberate disable with a missing/invalid routing document. Blindly falling back to an older enabled configuration after an explicit disable can defeat the stop. A route release and emergency admission policy need distinct identities and precedence. Their coordination must avoid transient re-enablement when separate updates arrive in different orders.

Likewise, expose separate evidence for **requested**, **written to Unleash**, **validated/adopted by an instance**, and **observed on a task/attempt**. Under polling, release adoption is eventually consistent across workers. A control-plane 200 response or aggregate flag metrics cannot prove complete adoption. Include instance cohort, last-seen time and coverage; stale or missing workers remain unknown. Story 8.3 needs a minimal protected readback/report of this evidence without waiting for 8.6.

## 9. UI/API Authentication and Privacy

### Authority boundaries

- Keep production route configuration backend-only. Mobile/browser clients receive neither backend tokens nor route payloads/secret references. Do not create a frontend token for the routing namespace.
- Backend tokens read flag configuration, register SDK applications and submit usage metrics; they are scoped to projects and one environment, not authorized to publish configuration. Use a distinct publication credential. [Official token types](https://docs.getunleash.io/concepts/api-tokens-and-client-keys).
- Current documentation deprecates Admin tokens, recommends PATs for OSS and service accounts for Enterprise, and says PAT authority follows its user. An OSS PAT is not a fine-grained service account. Bind publisher ownership/rotation explicitly and keep its blast radius visible. [PAT and Admin token guidance](https://docs.getunleash.io/concepts/api-tokens-and-client-keys#personal-access-tokens).
- OSS has basic root roles; custom/project roles and SSO are paid capabilities. Inspect actual UI and API authorization, not only hidden buttons. Ordinary evaluation access must not carry production apply/skip/Admin permissions. [Official RBAC](https://docs.getunleash.io/concepts/rbac), [service accounts](https://docs.getunleash.io/concepts/service-accounts).
- Any narrow Nomad validation/publish/readback endpoint needs real operator authentication, authorization, expected-version/idempotency checks and CSRF protection when cookie-authenticated. Reuse existing approved authentication; do not add an unauthenticated admin facade or header stub.
- Default/demo credentials and the upstream quick-start Compose are not production authorization. Require protected network/TLS access, unique identities, secure sessions and a tested break-glass procedure. No actual credentials were read or changed.

### Data and retention

Route payloads should contain only approved identifiers and bounded configuration. Unleash is not a secret store. Keep provider keys, private URLs, raw prompts, itinerary context, user identifiers and evaluation samples out of payloads, comments, audit attachments and error logs. Secret references must resolve through an allowlisted server-side registry, not arbitrary resource names selected by an operator.

Backend evaluation keeps targeting context local, but application code can still leak it through impression listeners or logging; metrics, registration, operator accounts and audit events are separate data surfaces. Avoid user-based targeting for this task-routing use case. Use a stable non-personal task/job correlation only if rollout selection genuinely needs it, and keep 8.1 redaction rules at every export boundary. [SDK architecture and local evaluation](https://docs.getunleash.io/sdks), [SDK event handling](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/unleash.ts).

Choose and document retention for active and historical route documents, Unleash events, Git/CI artifacts, SDK cache files, local LKG, operator identity records and database backups. History may preserve previous payloads and operator identity after a flag is deleted. Do not promise erasure by deleting a flag or a CI run. No specific OSS retention duration or actual paid tenant retention was verified; advertised paid retention is not evidence of configured deletion. Cleanup and restore procedures require separate approval, and restored state must not silently republish superseded routes or clear emergency restrictions.

## 10. Licensing, Paid Limits and Footprint

### Licensing and commercial facts

| Item | Evidence-backed status as retrieved on 2026-09-08 |
| --- | --- |
| SDK 6.7.0 | Apache-2.0, verified in [pinned SDK package/license](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/LICENSE) |
| Unleash server v8 source/npm | AGPLv3 from v8.0.0; v8.1.0 package identifies `AGPL-3.0-or-later` |
| Official prebuilt OSS Docker images | Vendor explicitly says Apache-2.0, unlike v8 repository/npm source; verify the chosen image artifact and notices before deployment |
| OSS commercial limits | Free self-hosted, unlimited seats; currently advertised one project, two environments and 5,000 flags |
| Enterprise Pay-As-You-Go | Advertised USD 75/seat/month; pricing table notes five-seat minimum for self-hosted. Cloud includes 53M API requests/month and USD 5 per extra million |
| Paid governance | Native approvals, fine-grained roles/SSO, service accounts and richer audit capabilities cannot be budgeted as OSS features |
| Enterprise license expiry | Self-hosted license documentation says the instance becomes read-only while connected applications continue receiving existing flags; this can prevent an operator changing routes during an incident |

Sources: [official availability/licensing](https://docs.getunleash.io/support/availability), [v8 upgrade guide](https://docs.getunleash.io/deploy/upgrading-unleash), [pricing](https://www.getunleash.io/pricing), and [license enforcement](https://docs.getunleash.io/deploy/license-keys). The price is an observed offer, not a quotation or purchasing approval. This is a technical license inventory, not legal advice; assess obligations for the exact artifact and any proposed modification/distribution. Do not label all current Unleash artifacts simply Apache-2.0 or assume the SDK inherits server AGPL licensing.

### Resource and operational cost

The [official sizing guidance](https://docs.getunleash.io/deploy/configuring-unleash#resource-recommendations) gives a starting point of 0.5-1 vCPU and 512 MiB-1 GiB RAM for the server, plus at least 1 vCPU, 1 GiB RAM and 5 GiB SSD for PostgreSQL. These are vendor starting points, not Nomad measurements or HA sizing. Server v8 officially tests/supports PostgreSQL 15+. The [pinned Compose](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/docker-compose.yml) confirms an application plus PostgreSQL topology and explicitly warns against production use of that example.

Reuse a suitable existing PostgreSQL deployment only after checking isolation, supported version, capacity, backup and recovery. Do not assume a working Unleash service exists merely because its SDK is installed. Hosted Enterprise removes database/server operations from Nomad's host but adds subscription, external control-plane connectivity, vendor data-location and availability considerations.

The Node SDK adds no standalone daemon. It does add memory, polling, metrics and backup I/O inside each worker. At the default 15-second interval, 30 days of uninterrupted flag polling is approximately 172,800 requests per instance, excluding metrics/registration/retries; this arithmetic is a sizing aid, not a billing forecast. Failure backoff can lengthen propagation. Measure expected instance count, payload size, restart behavior and adoption latency in a later authorized test.

Do not add Edge merely to promise an instant kill. Current streaming is an Enterprise/Edge capability requiring deployment/entitlement checks. The vendor announced OSS Edge long-term maintenance from 2025-12-12 and end-of-life on 2026-12-31; introducing it now adds lifecycle risk. [Official Edge lifecycle announcement](https://docs.getunleash.io/release-notes/2025/12/12), [Enterprise Edge requirements](https://docs.getunleash.io/unleash-edge).

## 11. One Lighter Release-Management Alternative

**Protected Git-reviewed JSON releases, with Unleash OSS retained as the distributor**, is the only lighter alternative considered. It adds no new configuration server or vendor UI. GitHub's PR diff/history, required checks and branch rules are mature building blocks; the Nomad-specific validator/publisher and adoption receipts remain work, not off-the-shelf guarantees.

Proposed flow: edit a bounded configuration document in a private repository -> deterministic validation -> review of exact content/base/environment -> serialize authorized publication of that approved artifact to Unleash -> read back payload identity -> collect instance adoption evidence. Rollback is a new reviewed publication selecting retained content. No Provider/model call is required to validate schema or exercise deterministic fixtures; any live verification is separately authorized.

Required safeguards: production write credentials only in the protected publisher, no secrets in untrusted PR execution, checks and reviews invalidated on relevant edits, protections covering workflow/validator files as well as config, no routine direct flag editing, explicit auditable emergency authority, and reconciliation that cannot overwrite a newer emergency decision. Plain `workflow_dispatch`, a manual merge or an unprotected branch is not an approval mechanism by itself.

Important paid distinction: GitHub's private-repository branch protection/rulesets and environment deployment approvals are not the same entitlement. Rulesets are documented for private repositories on Pro/Team/Enterprise Cloud, but deployment environment required reviewers on Free/Pro/Team are public-repository-only. Do not assume a private project's existing plan includes a native production deployment approval button. Verify actual ownership, plan, required checks/reviews and bypass roles before selecting this option. [GitHub rulesets](https://docs.github.com/en/enterprise-cloud%40latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), [reviewing deployments and availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments).

Pros: no extra always-on service, familiar review/history, independently retained exact config artifacts and no mandatory model execution. Cons: a less convenient operator experience than native change requests, credential ownership tied to OSS PAT capabilities, maintenance of a small publisher, and drift/bypass risk. GitHub SaaS has no locally pinned server commit; its public capability documentation is date-stamped evidence, not a fabricated product version. If its protections or the operator workflow are unsuitable, return to the Enterprise path rather than grow a home-built admin platform.

## 12. Migration and Acceptance Topics

This is a proposed sequence for later implementation, not actions performed now:

1. Main agent confirms the then-current adapters, task registry, safety policy and real Unleash deployment/edition. Keep the corrected 6.7.0 wrapper baseline distinct from upcoming business-story implementations.
2. Decide Enterprise native governance versus OSS/Git release workflow and document actual operator roles. 8.2 experiment identities have no production publication permission.
3. Add only the needed typed configuration/validation and durable accepted-snapshot support around the existing SDK. Preserve unrelated Boolean flags. Select SDK/server/runtime versions explicitly; no automatic dependency upgrade is implied.
4. Provide an independent operator workflow with exact diff, validation result, desired/current release, adoption coverage, stale/auth-error state and rollback action. Prefer mature UI/CI plus a minimal protected readback; a new Nomad screen requires separate visual approval.
5. Test offline/bootstrap/invalid-payload/auth/restart and switching behavior with synthetic config and stubbed providers. Publish to a real non-production service only after separately authorized access; model calls are not a default prerequisite.
6. Only after gates and approval, stage real deployment with retained prior release, recovery evidence and observed adoption. A successful config publish is not completed 8.3 acceptance.

Suggested focused acceptance topics for the main agent to turn into detailed GWT:

| Topic | Evidence needed, not currently obtained |
| --- | --- |
| Validation | Unknown schema/task/provider/model, mismatched capability, prohibited secret/URL/script, invalid fallback and oversized payload rejected before publication and before adoption |
| Authorization | Evaluation-only user, Viewer, wrong-environment token and unauthorized direct UI/API attempt cannot publish; break-glass is scoped and audited |
| Concurrent publication | Duplicate request is idempotent; stale base cannot overwrite a newer release; changing approved bytes requires renewed validation/approval |
| Readiness | `await initialize` alone does not pass; backup/bootstrap and remote contact are distinguishable; no valid baseline yields truthful task unavailability |
| LKG | Invalid remote candidate leaves business LKG intact; restart restores the correct environment/version; corrupt or absent disk state does not silently enable a route |
| Control-plane failures | Network loss, 429/5xx, 401/403, credential rotation and recovery have bounded, truthful states; token recovery is tested for the selected SDK version |
| Effect checking | Written vs adopted vs observed states are distinct across multiple workers; stale/missing instances are not counted as successful adoption |
| Job stability | Ordinary release does not reroute/restart in-flight work; retry/fallback preserves existing budget and fencing |
| Emergency stop | New attempts obey revocation; late in-flight responses follow explicit cancellation/result-publication policy; outage limits are visible |
| Rollback | Republish retained compatible content under a new publication identity; preserve emergency restrictions and user Plan/Trip state |
| Privacy and retention | No private content/credentials in UI, payloads, cache diagnostics or audit exports; retained artifacts and backup recovery have approved handling |

**Remaining decisions:** edition/hosting and entitlement; approved reviewer/break-glass policy; exact task schema and snapshot granularity; LKG retention/staleness limits; emergency in-flight result treatment; and the minimum operator readback surface. These are narrow 8.3 questions. They must not reopen approved 8.2 scope, implement 8.4 accounting, wait for 8.6, or transfer first-use runtime protections out of earlier stories.

## 13. Main-Agent Cross-Check Priorities

Before using this research to recommend a detailed Story, independently recheck these high-impact sources:

1. [Pinned SDK initialization](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/index.ts), [bootstrap/repository](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/repository/index.ts), and [polling 401/403 behavior](https://github.com/Unleash/unleash-node-sdk/blob/2c01030a97c24af4d0f642f3543946c1103871fe/src/repository/polling-fetcher.ts).
2. [Current OSS/Enterprise capability matrix](https://docs.getunleash.io/support/oss-comparison), [approval exceptions](https://docs.getunleash.io/concepts/change-requests), and [environment-token boundary](https://docs.getunleash.io/concepts/environments).
3. [v8 artifact-specific license change](https://docs.getunleash.io/deploy/upgrading-unleash), [pinned server package](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/package.json), and [current pricing](https://www.getunleash.io/pricing).
4. [Wire schema version meaning](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/src/lib/openapi/spec/client-features-schema.ts) and [variant payload shape](https://github.com/Unleash/unleash/blob/9445b1e570e9fe1e41083c6787929cfef58a7cc3/src/lib/openapi/spec/variant-schema.ts).

No code tests were run because this deliverable changes only research prose. No measured availability, propagation SLO, paid feature access, actual operator permissions or safe-cancellation behavior is claimed.
