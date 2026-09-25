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

## Native Host State (Approved 2026-09-19)

App 不新增同义 User/Session 权威。必要原生元数据不成为身份或所有权证明；升级/重新安装/安全存储残留不得复活撤销凭据或停用账号。设备本地短时草稿/文件和服务端持久事实分开，账号清理覆盖 App 缓存但不承诺远程擦除外部副本。
