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
