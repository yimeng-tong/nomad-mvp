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
