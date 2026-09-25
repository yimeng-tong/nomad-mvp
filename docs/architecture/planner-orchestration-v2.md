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
