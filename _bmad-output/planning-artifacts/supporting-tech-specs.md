# Nomad MVP Supporting Technical Specs

Generated: 2026-08-20
Status: Approved Epic 2 boundary and current Epic 3 planning target

This packet supplements `epics.md`; it does not create work-item identity for Sprint Planning.

---

Capacitor amendment approved 2026-09-19; source packet regenerated from current source files.

## Source: `docs/tech-spec-epic-2.md`

# Epic 2 Technical Specification: Initial Single-City Planning v0.6

Date: 2026-08-20
Validated source sync: 2026-09-14
Epic ID: 2
Status: Story definitions approved through Story 2.15
Authority: PRD v0.6, `docs/architecture/index.md`, current UX sources and BMAD `epics.md`

## 1. Overview

Epic 2 collects single-city travel boundaries, per-night accommodation, place intent, pace and
optional constraints, then creates one complete initial plan in one stable timeline shell. It also
supplies trustworthy route facts, non-blocking candidate completion, versioned AnchorPool inputs,
explainable daily load and a post-plan search path that saves candidates without mutating the plan.

Stories 2.0 and 2.1 are historical delivery baselines. Their visible 2h/4h partial skeleton,
Quick/HQ adoption and `selected_required`-only UI do not define the current product. The in-progress
legacy Story 2.2 belongs to Epic 3 migration. Linked trips, editing/repair, detail/export,
meal/checklist and platform operations belong to Epics 3-8.

Scope clarification (2026-09-06): initial planning remains a MVP focus and does not depend on
visit/check-in or album data. Story 7.2 is excluded; FR40.1 photo-based marks and photo/video outputs
are future design, not an input requirement or additional planning pipeline in this specification.

## 2. Approved Story Boundaries

| Story | Technical outcome | Explicit exclusion |
| --- | --- | --- |
| 2.3 | Single-city dates, daily start and exact/window/AI boundary modes | Provider lookup implementation |
| 2.4 | Unified flight/rail recognition, lookup, manual fallback and honest facts | Ticketing or booking |
| 2.5 | Optional per-night hotel, breakfast and contextual luggage draft | Post-plan stay editing |
| 2.6 | Required pace plus optional additional constraints and inferred interests | Second play-style questionnaire |
| 2.7 | Full-city/L3 Picker with required/along-route/unselected intent | Cross-city Trip creation |
| 2.8 | Reusable factual POI Sheet and reservation evidence | Booking state or public quality enums |
| 2.9 | One durable PlanningJob, fenced attempts, reconnect and one visible completion | Quick/HQ adoption UI |
| 2.10 | Nullable server RouteFact and timeline commute summary | Flight/rail timetable facts |
| 2.11 | Complete constraint-first initial single-city schedule | Post-edit mutation or linked trip |
| 2.12 | AMap nearby completion, non-blocking candidates and honest free time | XHS keyword search/session flow |
| 2.13 | Versioned shared AnchorPool buckets and safe snapshot admission | User-session search acquisition |
| 2.14 | Revision-bound DayLoadEstimate and per-day explanations | Cross-day validation (Story 3.4), precise step prediction or auto-replan |
| 2.15 | Post-plan Top-5 search and exact/proxy/unresolved candidate save | Timeline placement or validation |

No Story depends on a later Story. Persistence and shared entities are added only in the first
vertical slice that uses them.

## 3. Aggregate and Module Boundaries

- `PlanningDraft` owns S2-S5 input revisions before a Plan exists.
- `Plan` remains associated with one `City` and owns immutable `PlanRevision` snapshots.
- `PlanningJob` is the one user-visible async unit; internal `PlanningAttempt` values are fenced.
- `Planner` creates the complete initial schedule. Epic 3 `SlotEditor`/`Validator` own post-plan
  mutation and repair. Epic 5 `Filler` may enrich details only without changing schedule fields.
- `CanonicalPOI`, source attribution and verified external facts are shared inputs, not copies inside
  prompt-only JSON.
- OpenAPI is the API source of truth. Contract changes precede implementation and regenerate
  `packages/types`; generated files are never hand-edited.

Every protected draft write, job start and candidate save is owner-scoped, idempotent and guarded
by expected revision or attempt generation. Current pointers and immutable rows publish
transactionally.

## 4. Detailed Design

### 4.1 Travel time and boundary facts (Stories 2.3-2.4)

`TripBoundary` is a discriminated union:

```ts
type TripBoundary =
  | { inputMode: 'exact'; direction: 'arrival' | 'departure'; mode: TransportMode;
      scheduledAt: string; terminalPoiId?: string; terminalText?: string; serviceCode?: string;
      source: BoundarySource; provider?: string; observedAt?: string;
      validUntil?: string; status: 'confirmed' | 'provisional' | 'stale' }
  | { inputMode: 'window_2h'; direction: 'arrival' | 'departure'; mode?: TransportMode;
      windowStartAt: string; windowEndAt: string; terminalPoiId?: string;
      source: 'user_window' }
  | { inputMode: 'ai_decide'; direction: 'arrival' | 'departure';
      source: 'ai_provisional' };
```

- The two-hour window is one continuous 120-minute local-time interval.
- AI-decide may choose provisional usable time but cannot invent a service, ticket, terminal or
  booking.
- One input accepts flight or rail identifiers. Format is only a routing hint: ambiguous values may
  query both adapters and are resolved by provider facts plus user selection, never regex alone.
- Exact lookup covers no match, multiple matches, stale/unavailable provider and manual date/time/
  terminal fallback. Facts retain source, observed/valid time and status.
- Arrival and departure each require an explicit mode confirmation, as approved in Story 2.3.
  A user can mix exact, window and AI-decide modes; untouched empty boundaries cannot continue.
  Exact manual terminal text may remain unresolved, with no invented canonical identity or route.

### 4.2 Per-night stay, luggage and pace (Stories 2.5-2.6)

- Accommodation is stored per stay night and may be explicitly blank. Hotel text is matched to an
  AMap `CanonicalPOI` when possible; unresolved text remains honest and does not enable near-hotel
  routing.
- Breakfast and luggage are child fields on every night. Breakfast is tri-state. Luggage includes
  contextual first-night, continuing stay, hotel change, hub storage and final-departure choices,
  including `undecided`.
- `Same as previous` is a per-night command. It copies stay/breakfast into a new draft revision but
  recomputes luggage; it never silently copies an invalid transition.
- Pace is required and uses `leisurely | balanced | full` with the approved user-facing consequences.
- One default-collapsed optional field accepts companion, mobility, diet and unacceptable-condition
  constraints. Parsed constraints retain the raw input and can be corrected.
- Play style is inferred as source/confidence-bearing trip-scoped `InterestSignal` data from natural
  language, imports and L3 intent; it is not a second questionnaire or a permanent user label.

### 4.3 Full-city Picker and POI information (Stories 2.7-2.8)

```ts
type PlaceIntent = 'required' | 'along_route' | 'unselected';
```

- S4 starts at a non-expandable full-city L1/L2 overview. L2 is navigation/context only.
- Only L3/CanonicalPOI receives intent. Check-circle means required; Route means along-route;
  active re-click clears. The controls are mutually exclusive.
- One intent store derives row, marker, thumbnail, L2 split counts, global counts and submit payload,
  including the along-route state after returning to the overview.
- The L3 screen alone exposes nearby/full-city map modes and has a list fallback. Zero selection is
  valid.
- Cross-city L3 selection creates an explicit pending add-city decision for Epic 4; it cannot enter
  the current single-city payload silently.
- The reusable POI Sheet shows standard name, address, opening facts, rating, suggested stay, source
  and optional reservation evidence. Freshness/quality remain internal; inferred evidence is not a
  confirmed reservation or booking.

### 4.4 One PlanningJob and trustworthy routes (Stories 2.9-2.10)

- Input is an immutable snapshot of boundaries, stays/luggage, intents, pace, constraints, interests
  and evidence.
- Factual stages are `accepted`, `context`, `constraints`, `candidates`, `arranging`, `validating`,
  `persisting`, `done` or `failed`. Durable cursor/sequence supports reconnect and restart recovery.
- Internal Provider or deterministic attempts may fall back, but only the fenced current attempt may
  publish one visible result. A late attempt cannot overwrite a newer input or first user edit.
- S6 and S7 share one stable shell; there is no separate completion interstitial or adoption choice.
- Adjacent commute is a server-owned nullable `RouteFact` with endpoint, mode, duration/distance,
  source, observed/valid time and known/stale/unavailable status. The client never fabricates it.
- AMap route/distance is separate from flight/rail schedules. Timeout, quota and unavailable states
  preserve the plan with an honest unknown summary.

### 4.5 Complete planning, candidates, anchors and load (Stories 2.11-2.14)

The initial scheduler applies this order:

1. exact boundary, reservation and strong-time constraints;
2. feasible required L3 items;
3. stay/luggage, check-in/out and near-hotel preferences when a verified hotel exists;
4. along-route items only when route fit is positive;
5. owner imported unselected candidates, then approved shared candidates.

It accounts for opening hours, stay duration, route time, meal/free-time needs, luggage and
dawn/sunset/night/night-market constraints. An infeasible required item becomes
`unresolved_required` with a reason; it is not forced or silently discarded.

Candidate completion is:

1. owner imported and verified inspiration;
2. immutable versioned AnchorPool/city Top-50 snapshot;
3. bounded AMap nearby search around city/L2/scheduled POI/verified hotel/free-time context;
4. non-blocking candidate or explicit free time when confidence remains insufficient.

Candidate presentation keeps three independent fields: `intent`, `origin` and `locationMode`.
The UI groups first by intent (`未安排的必去 / 顺路候选 / 其他候选`) and renders provenance on
each row (`来自灵感 / 城市热门 / 附近推荐 / 我添加的`). One candidate appears once; generic
`AI` is not persisted or displayed as a source.

No PlanningJob pauses for XHS keyword search or candidate confirmation. XHS search, login/Cookie,
captcha and result selection are Post-MVP Epic 8 operator cold-start work, isolated from user
sessions.

AnchorPool admission requires AMap-verified CanonicalPOI, dedupe, city/season/time/category bucket,
source policy and immutable snapshot version. A shared cache cannot expose another owner's import,
plan, hotel or selection.

`DayLoadEstimate` binds one PlanRevision and reports ranges for primary items, walking, commute,
start/end and free time with reasons/confidence. It emits consecutive early/high-load and recovery
findings, never false precision. Initial load may inform validation but never silently changes the
published schedule.

### 4.6 Post-plan search and manual candidate fallback (Story 2.15)

- S7 search is city-scoped text-only AMap Top-5. Exact save creates an owner candidate with
  `locationMode=canonical`; it does not mutate the timeline.
- If no accurate result exists, manual add requires a target name and optionally accepts one
  same-city verified nearby landmark.
- Landmark use creates `locationMode=landmark_proxy`. Route/distance resolves to the landmark and
  must show `附近估算`, landmark identity and possible error.
- The target never inherits the landmark's canonical identity, address, coordinates as exact target
  facts, opening hours, rating, price, phone or reservation evidence.
- Without a landmark, `locationMode=unresolved`; route facts are invalidated and placement is blocked.
- Create/update is owner-scoped, idempotent and revision-checked. It does not restart PlanningJob,
  alter Picker intent or publish a PlanRevision.
- Epic 3 owns later explicit target placement, diff confirmation, validation, publication and undo.

## 5. API Capability Map

Final paths are set story-by-story in OpenAPI. Epic 2 requires:

- PlanningDraft read/write for dates, daily start, boundary, stay/breakfast/luggage, pace and
  constraints;
- unified flight/rail lookup plus manual/AI-decision fallback;
- Picker catalog, intent update/summary and reusable POI information;
- PlanningJob start/detail/SSE/reconnect and current Plan hydration;
- server RouteFact and typed unavailable states;
- candidate-stage provenance, unresolved-required/candidate/free-time outcomes;
- AnchorPool snapshot lookup/admission policy and DayLoadEstimate;
- post-plan candidate search/save with `canonical | landmark_proxy | unresolved`.

Compatibility HQ/adopt and `smart_planning` inputs may remain read-only during migration, but the
current client must not invoke them.

## 6. Non-Functional and Test Gates

- **Consistency:** transactional revision publication, fenced attempts and no mixed input snapshot.
- **Security:** owner guard before lookup; redacted sources, exact private location and secrets.
- **Reliability:** durable SSE cursor, capped retry/DLQ, typed degradation and no fake success.
- **Performance:** stage P50/P95, bounded candidate counts, route/AMap cache and indexed owner/geo
  queries.
- **Accessibility:** 44pt actions, labels/roles, non-color intent, list fallback, focus return,
  keyboard-safe Sheets and reduced motion.
- **Evidence:** opening, reservation, route, transport and attribution retain source/time/status;
  inference stays distinct from user-confirmed constraints.

Every Story runs focused tests, `pnpm -r build`, `git diff --check` and OpenAPI generation when the
contract changes. Persistence changes require migration plus real PostgreSQL probes. Flight/rail,
AMap, route and Provider changes require redacted real-service staging checks in addition to
deterministic doubles. Mobile work requires loading, empty, failure, reconnect, disabled,
accessibility and supported-width screenshots.

The Xiamen methodology, `skeleton_final.json` and `output/行程单_final.md` are regression inputs;
they do not authorize copying private source data into telemetry.

## 7. Completion and Handoff

Epic 2 is complete at planning level when Stories 2.3-2.15 cover every listed requirement with GWT
acceptance criteria and no forward dependency. It hands Epic 3 one readable, feasible current
single-city PlanRevision plus candidate, RouteFact and DayLoad contracts. It does not claim that
those approved stories are implementation-complete until Sprint Planning and their individual dev
workflows say so.

## Capacitor Host Acceptance (Approved 2026-09-19)

复用当前业务设计与所有 owner/revision/幂等/校验/撤销规则；旅行者UI在适用 Android/iOS 宿主消费 APP-HOST-01/UX-DR36。返回/键盘/安全区不隐式提交，前台/杀进程恢复先核验身份再读取当前 job/revision/scope，不创建新规划或重放未知写入。2.9拥有App单任务恢复，3.1的暂停及旧2.2唯一迁移条件不变。依据 `docs/architecture/app-host.md`，浏览器截图不能替代原生证据。

---

## Source: `docs/tech-spec-epic-3.md`

# Epic 3 Technical Specification: Safe Itinerary Editing and Adjustment v0.6

Date: 2026-08-20
Validated source sync: 2026-09-14
Epic ID: 3
Status: Stories 3.1-3.5 approved; legacy Story 2.2 implementation remains paused until planning gates

## 1. Overview

Epic 3 starts from one feasible, published single-city `PlanRevision` produced by Epic 2. It lets
the owner edit that plan at minute precision, place an explicit candidate, revise one night's stay
or luggage, undo recent changes at plan scope, repair typed conflicts and request a bounded AI
adjustment without losing the current version.

This Epic owns S7/S8 mutation behavior. It does not create linked-city aggregates or transfer legs
(Epic 4), enrich `do / prepare / notice` or export a ResultSheet (Epic 5), add meal/checklist/location
features (Epic 6), or implement account and platform operations (Epics 7-8).

Scope clarification (2026-09-06): on-trip controlled editing/replanning remains a MVP focus.
Story 7.2 check-in is excluded, so no visit/photo evidence is needed to edit or request adjustment.
Current-city AI scope, explicit preview/confirmation, revisions, validation and undo stay intact;
linked city/date/transport changes still use Epic 4's draft/republish flow. FR40.1 album/location
recognition, album video, nine-grid and AI beautification require later design and do not authorize
background tracking or a broader automatic/cross-city replanner.

## 2. Brownfield Migration Boundary

The existing implementation branch and story file named Story 2.2 remain the migration source.
The first Epic 3 execution story must carry `legacy_story_id: 2-2-timeline-editing-undo-and-history`
and preserve its Git history.

### Keep

- Owner-scoped plan routes and authorization.
- Immutable `PlanVersion`/`PlanRevision` lineage, `EditEvent`, expected-revision checks and
  idempotency keys.
- Auditable command records, hard-constraint rejection and compensating undo.
- Existing focused unit, repository, route and mobile tests that still assert approved behavior.

### Change

- Replace old D-1/D+1 movement with previous/other/next and every valid same-segment date.
- Replace the 15-minute user control and 30/60-minute snap language with one-minute user precision.
- Replace day-scoped recent actions with one plan-level history/`Undo 8` control.
- Replace bottom recent-operation UI, brand/version labels and `编辑安排` hierarchy with the
  approved full-screen waterfall timeline.
- Treat deletion as explicit free time plus candidate restoration when eligible, not as a user-owned
  `待安排` task that blocks an otherwise complete AI plan.

### Remove or defer

- Public Quick/HQ adoption, seed reset and a second visible completion version.
- Arbitrary history browsing or rollback beyond the latest eligible extra undo (FR43 remains
  Post-MVP).
- Cross-segment/cross-city movement, automatic hotel-triggered replanning and direct LLM JSON
  mutation.

## 3. Capability Slices

Story numbering is assigned only as each story is approved in the BMAD workflow. The implementation
order must preserve these dependency boundaries.

### 3.1 Timeline commands and plan-global undo

- Support replace, move, retime and delete through typed server commands.
- The edit Sheet leads with POI and date, then previous/next commute, followed by actions.
- Move targets include every valid date in the same city segment. Previous/next are disabled on the
  first/last day; `other` is disabled when no non-adjacent day exists.
- User retiming accepts every valid minute. Fast scrolling changes control sensitivity only. For a
  cross-day interval, start and end show their respective day/date; no snap copy is shown.
- Adjacent commute is a nullable server `RouteFact`; the client never fabricates time or mode.
- The plan-level top-right control is a history icon by default, becomes `Undo 8` after a successful
  mutation and, after the countdown, exposes only one latest additional eligible undo.
- A rejected, stale or failed mutation leaves the current revision and undo stack unchanged.

### 3.2 Explicit candidate placement

- Epic 2 search saves exact, `landmark_proxy` or `unresolved` candidates to `其他候选` with row-level provenance `我添加的`, without
  changing the timeline. Epic 3 owns the separate placement command.
- Placement requires an explicit candidate and target date/time or free-time region, previews the
  typed change, publishes a revision only after confirmation and then invokes validation.
- `landmark_proxy` placement remains visibly approximate and routes only to the verified same-city
  landmark. The target cannot inherit the landmark's address, hours, rating, phone, source or
  canonical identity.
- `unresolved` candidates cannot be placed or routed until resolved.
- Replacement or placement never silently changes Picker intent or removes source attribution.

### 3.3 Post-plan accommodation and luggage editing

- Tapping a day's hotel footer opens a single-night Sheet reusing the S3 hotel, breakfast and luggage
  field rules; luggage is independently editable and does not require changing the hotel.
- `Manage all accommodation` opens the multi-night flow focused on the selected night with a static
  highlight, then restores the prior day and scroll position on return.
- The final departure day edits checkout and luggage destination without creating a new stay night.
- Only a material hotel/luggage change opens a conditional impact preview. It names potentially
  affected evening/next-morning radius, check-in/out buffer and luggage handling without claiming a
  conflict before validation.
- Confirmed changes create immutable `StayRevision` and/or `LuggageTransitionRevision`, run
  incremental validation and enter plan-global undo. They never silently move POIs or invoke FR42
  automatic replanning.

### 3.4 Incremental validation and typed repair

- A structurally invalid command is rejected before publication. A valid edit that creates a derived
  route, hours, weather, stay or load problem publishes a new revision with a typed validation result.
- A clean plan has no permanent validation card. A conflict banner opens a `FixSheet` with one or
  more safe alternatives and a field-level diff preview.
- Applying a fix creates another immutable revision, reports only the changes actually made and is
  eligible for global undo.
- Stale revision, provider timeout, no-safe-fix and apply failure preserve the current plan and expose
  a truthful retry or manual path.
- Hard conflicts block detail/export gates; soft warnings remain visible but do not fabricate a block.
- Cross-day recovery and `DayLoadEstimate` are recomputed against the edited revision. Weather may
  participate only within a reliable forecast horizon and never silently changes the plan.

### 3.5 Controlled conversational adjustment

- A labeled AI-adjust control accepts natural-language intent and infers the smallest valid scope:
  slot, segment, day, later days or the current single-city plan.
- The interpreter returns either a safe typed intent or one structured `AdjustmentAsk` with
  `kind=scope_clarification|risk_warning`, bounded choices and the exact input revision. Only one ask
  is shown at a time; answering it reparses the request without mutating the plan or exposing
  chain-of-thought.
- Before a detailed diff, the system usually offers two concise safe directions: one directly
  answers the request and one offers a different route. If only one safe direction exists, show
  one; if none exists, use the no-safe state. Do not fabricate an option to reach a count of two.
- A selected direction produces typed commands and a deterministic diff; an LLM cannot write the
  stored plan JSON or bypass command validation.
- Only explicit confirmation publishes the fenced revision. Completion reports `做了以下调整`
  without exposing chain-of-thought and enters validation plus global undo.
- Failure, cancellation or stale input leaves the current revision untouched.

## 4. Data and API Contracts

OpenAPI remains the contract source of truth and is updated before server/client implementation.
Generated files are never edited by hand.

- `PlanCommand(commandId, planId, expectedRevision, type, payload, idempotencyKey, actorId)`.
- `EditEvent(commandId, beforeRevision, afterRevision?, status, reasonCode, createdAt)`.
- `UndoEntry(sourceCommandId, expectedRevision, expiresAt, extraEligible, inverseCommand)`.
- `ValidationRun(inputRevision, scope, status, issues[], alternatives[], factRefs[])`.
- `AdjustmentAsk(inputRevision, kind, prompt, choices[], currentScope?, riskCodes[])`; it is an
  ephemeral/recoverable interpretation artifact, never a Plan mutation or persistence shortcut.
- `RouteFact(fromPoiId, toPoiId, mode?, duration?, distance?, source, observedAt, status)`.
- `CandidateLocation(kind=canonical|landmark_proxy|unresolved, targetName, canonicalPoiId?,
  proxyLandmarkPoiId?, approximationDisclosure?)`.
- `StayRevision` and `LuggageTransitionRevision` retain immutable before/after lineage.

Every protected write requires owner scope, idempotency, expected-revision fencing and a typed
stale/conflict response. Provider callbacks and retries cannot publish over a newer revision.

## 5. Invariants and Failure Handling

1. The currently published revision remains readable while any edit, validation or AI adjustment is
   pending or fails.
2. No client-only timeline mutation becomes domain truth.
3. No command crosses a linked-trip segment boundary; Epic 4 owns transfer-boundary edits.
4. Undo is a new compensating revision, never destructive history deletion.
5. An approximate landmark route is never presented as the target's verified location or facts.
6. Validation and AI suggestions may propose changes but cannot apply them without explicit user
   confirmation.
7. Route, weather and external-fact unavailability is a typed degraded state, not invented data.
8. Logs, traces, analytics and error reports exclude protected source URLs, exact private location,
   secrets and unredacted prompts/evidence.

## 6. Tests and Acceptance Gates

- Unit: minute/cross-day time math, move-target boundaries, inverse commands, candidate-location
  rules, impact gating, issue classification and typed diff generation.
- Repository/API: owner isolation, idempotent replay, stale revision, immutable lineage, concurrent
  mutation fencing, undo compensation and late-provider attempt rejection.
- Integration: nullable routing, weather horizon/degradation, AMap proxy facts, stay/luggage changes
  and validation/fix application.
- Mobile: waterfall timeline hierarchy, disabled move targets, one-minute time control, default/history/
  countdown undo states, candidate placement, accommodation impact, FixSheet and AI-adjust states.
- Accessibility: 44pt targets, labels/roles for icons, non-color state, focus containment/return,
  keyboard-safe Sheets, reduced motion and concise live-region updates.
- Visual regression: supported mobile widths plus desktop preview for loading, empty, failure, stale,
  disabled, cross-day and recovery states; no overlapping text or bottom recent-action row.
- Required commands: OpenAPI generation when contracts change, focused tests, `pnpm -r build`,
  `git diff --check` and real-service staging checks for changed AMap/route/weather/Provider behavior.

Epic 3 is complete only when all published mutations are versioned, reversible within the approved
undo policy, validated against current facts and incapable of silently replacing the user's current
plan.

## Capacitor Host Acceptance (Approved 2026-09-19)

复用当前业务设计与所有 owner/revision/幂等/校验/撤销规则；旅行者UI在适用 Android/iOS 宿主消费 APP-HOST-01/UX-DR36。返回/键盘/安全区不隐式提交，前台/杀进程恢复先核验身份再读取当前 job/revision/scope，不创建新规划或重放未知写入。2.9拥有App单任务恢复，3.1的暂停及旧2.2唯一迁移条件不变。依据 `docs/architecture/app-host.md`，浏览器截图不能替代原生证据。

---
