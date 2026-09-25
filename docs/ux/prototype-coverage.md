# Prototype Coverage

Updated: 2026-09-20

This inventory separates visual coverage, behavior decisions, and
implementation status. A text specification or passing implementation does
not count as a high-fidelity prototype. Generated images are advisory when
they conflict with the latest behavior decision or active story.

## Canonical Planning Stages

These ids and names match the approved Correct Course contract.

| Id | User-facing name | Current visual coverage | Assessment |
| --- | --- | --- | --- |
| S0 | 输入旅行想法 | [`Home Hybrid R3`](../../_bmad-output/implementation-artifacts/visual/story-1-4-home-hybrid-r3.png), [`Import Queue R4`](../../_bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png), [`Recent Trips Resume R1`](../../_bmad-output/implementation-artifacts/visual/story-7-1-recent-trips-resume-r1.png), [`Recent Trips Recovery R1`](../../_bmad-output/implementation-artifacts/visual/story-7-1-recent-trips-recovery-r1.png) | Story 7.1 recent/resume coverage is approved; import coverage remains partial: default, natural-language, link queue, and completion are shown; unknown input and failures are not. |
| S1 | 导入灵感 | [`Import Queue R4`](../../_bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png), [`Library Import Records R1`](../../_bmad-output/implementation-artifacts/visual/story-1-4-library-import-records-r1.png) | Partial: happy-path queue and records exist; retry, terminal failure, reconnect, and dedup behavior are missing. |
| S2 | 旅行时间 | [`Time + Transport R3`](../../_bmad-output/implementation-artifacts/visual/story-2-0-time-transport-r3.png), [`Manual Entry R1`](../../_bmad-output/implementation-artifacts/visual/story-2-0-transport-manual-entry-r1.png), [`Multi-city Time R1`](../../_bmad-output/implementation-artifacts/visual/story-2-0-multicity-time-r1.png) | Partial: exact lookup/manual and an illustrative three-city summary exist; 2-hour windows, `交给 AI 安排`, long unbounded city-chain navigation and repeated add-city states do not. |
| S3 | 住宿安排 | [`Accommodation Per Night R3`](../../_bmad-output/implementation-artifacts/visual/story-2-0-accommodation-per-night-r3.png) | Partial: nightly hotel/breakfast/luggage summaries exist; their choice sheets, AMap failures, and blank-stay consequences do not. |
| S4 | 选择想去地点 | [`Picker Overview/L3 R2`](../../_bmad-output/implementation-artifacts/visual/story-2-0-picker-overview-l3-r2.png), [`Cross-city Triggers R2`](../../_bmad-output/implementation-artifacts/visual/story-2-0-cross-city-triggers-r2.png), [`Day-excursion Entry/Transport R1`](../../_bmad-output/implementation-artifacts/visual/story-4-5-day-excursion-entry-transport-concept-r1.png) | Current candidates cover `全城检查 -> 选择 L3`, icon-only `必去 / 顺路`, generic POI information, reservation evidence, `下一步`, and the approved branch between a same-day excursion and a new stay city. Requirement additionally mandates that both intent states map back to L3 thumbnails, split L2 summaries, and global totals in `全城检查`; the current Picker image does not fully visualize that mapping. |
| S5 | 规划前确认 | [`Pace + AI Adjust R4`](../../_bmad-output/implementation-artifacts/visual/story-2-0-pace-ai-adjust-r4.png), left screen | Partial: three-pace choice is current; the default-collapsed optional constraints row and inferred-interest/no-questionnaire state are not shown. |
| S6 | AI 规划中 | [`Planning Transition R1`](../../_bmad-output/implementation-artifacts/visual/story-2-1-ai-planning-transition-r1.png) | Happy path only: timeout, generic internal fallback, reconnect, and partial failure are missing. No degraded state may expose Quick/HQ as user choices. |
| S7 | 行程计划 | [`Planning Transition R1`](../../_bmad-output/implementation-artifacts/visual/story-2-1-ai-planning-transition-r1.png), [`Day-excursion Timeline R1`](../../_bmad-output/implementation-artifacts/visual/story-4-6-day-excursion-timeline-concept-r1.png), [`Post-plan Search R2`](../../_bmad-output/implementation-artifacts/visual/post-plan-add-place-entry-search-r2.png), [`Landmark Fallback R1`](../../_bmad-output/implementation-artifacts/visual/post-plan-add-place-landmark-fallback-r1.png), [`Meal Alternatives R3`](../../_bmad-output/implementation-artifacts/visual/story-2-1-meal-slot-alternatives-r3.png), [`Meal Recall R2`](../../_bmad-output/implementation-artifacts/visual/story-2-1-meal-flex-recall-r2.png), [`Meal Location/Fallback R1`](../../_bmad-output/implementation-artifacts/visual/story-6-2-meal-location-recall-fallback-r1.png), [`Area Food Context R2`](../../_bmad-output/implementation-artifacts/visual/story-6-3-area-food-context-r2.png), [`Shopping Checklist R2`](../../_bmad-output/implementation-artifacts/visual/story-2-1-shopping-checklist-r2.png), [`Shopping Add Record R1`](../../_bmad-output/implementation-artifacts/visual/story-2-1-shopping-add-record-r1.png), [`Checklist Record Workflow R1`](../../_bmad-output/implementation-artifacts/visual/story-6-4-checklist-record-workflow-r1.png), [`Shopping Text + Shortcuts R2`](../../_bmad-output/implementation-artifacts/visual/story-6-5-shopping-text-shortcuts-r2.png) | Partial: the approved one-day excursion board now covers a single Dn timeline across host, outbound, child plan, return and host hotel without duplicate city tabs. Text search, no-exact-result and nearby-landmark candidate fallback also have a visual contract; load-details and dense candidate states remain incomplete. Story 6.2 now covers first location permission, live/stale/no-fix or denied location, plan-context fallback and first-shortage add; an unavailable previous/next basis uses the saved pool/manual-add contract. |
| S8 | 调整与校验 | [`Timeline Editing B`](../../_bmad-output/implementation-artifacts/visual/story-2-2-timeline-editing-direction-b.png), [`Day-excursion Timeline R1`](../../_bmad-output/implementation-artifacts/visual/story-4-6-day-excursion-timeline-concept-r1.png), [`Candidate Placement Core R3`](../../_bmad-output/implementation-artifacts/visual/story-3-2-candidate-placement-core-r3.png), [`Candidate Location Modes R2`](../../_bmad-output/implementation-artifacts/visual/story-3-2-candidate-location-modes-r2.png), [`Candidate Placement Outcomes R2`](../../_bmad-output/implementation-artifacts/visual/story-3-2-candidate-placement-outcomes-r2.png), [`Post-edit Feasibility R2`](../../_bmad-output/implementation-artifacts/visual/story-2-3-post-edit-feasibility-r2.png), [`AI Adjust R4`](../../_bmad-output/implementation-artifacts/visual/story-2-0-pace-ai-adjust-r4.png), [`AI Scope/Clarification R1`](../../_bmad-output/implementation-artifacts/visual/story-3-5-ai-adjust-scope-clarification-r1.png), [`AI No-safe/Stale R1`](../../_bmad-output/implementation-artifacts/visual/story-3-5-ai-adjust-no-safe-stale-r1.png), [`Applied Explanation R1`](../../_bmad-output/implementation-artifacts/visual/story-2-0-ai-adjust-applied-r1.png) | Partial: candidate boards cover intent/provenance, location modes and placement outcomes; AI-adjust boards cover input/directions, scope selection, ambiguity clarification, no-safe-plan, stale-plan and applied-result states. The day-excursion board additionally fixes the child-plan operation menu and current-scope AI guard. Detailed replacement/free-time pickers, the no-heading edit hierarchy, latest-eligible history Sheet, multiple validation conflicts and weather degradation remain incomplete. AI quota degradation intentionally has no dedicated prototype; the text contract is authoritative. |
| S9 | 完善行程细节 | Entry is shown in [`ResultSheet Overall Check R1`](../../_bmad-output/implementation-artifacts/visual/story-5-2-result-sheet-overall-check-r1.png) | Partial: the approved entry now starts from S10 rather than the editable timeline. Story 5.1 owns minimum S10 entry/host, S9 source expansion and same-context return; those connected states plus running/reconnect/partial/failed/stale need its focused checkpoint. |
| S10 | 行程单 | [`ResultSheet Overall Check R1`](../../_bmad-output/implementation-artifacts/visual/story-5-2-result-sheet-overall-check-r1.png), [`ResultSheet + Citations R3`](../../_bmad-output/implementation-artifacts/visual/story-5-2-result-sheet-citations-r3.png), [`ResultSheet States R2`](../../_bmad-output/implementation-artifacts/visual/story-5-2-result-sheet-states-r2.png), [`Line Edit + AI Preserve R2`](../../_bmad-output/implementation-artifacts/visual/story-5-3-line-edit-ai-preserve-r2.png) | Current contract: one compact base itinerary, revision-bound schedule/detail checks, hard-conflict gate, POI-only overview, slot drill-in, protected citations, truthful no/partial detail and stale recovery, plus line-level user wording that survives later enrichment. There is no restore-AI action. |
| S11 | 导出与旅中使用 | [`City-level Export R2`](../../_bmad-output/implementation-artifacts/visual/story-5-4-city-level-export-r2.png), [`City Background Directions R1`](../../_bmad-output/implementation-artifacts/visual/story-5-4-city-background-directions-r1.png), [`Export Job States R1`](../../_bmad-output/implementation-artifacts/visual/story-5-4-export-job-states-r1.png), [`Export Gates R1`](../../_bmad-output/implementation-artifacts/visual/story-5-4-export-gates-r1.png), [`Story 5.5 Transition R5`](../../_bmad-output/implementation-artifacts/visual/story-5-5-city-long-image-transition-regenerate-r5.png), [`Trip-long Download + Share R5`](../../_bmad-output/implementation-artifacts/visual/story-5-5-trip-long-download-share-r5.png), plus Home recent-trip entry | Story 5.4 covers city export generation. The approved Story 5.5 contract adds city-tab viewing, a normal one-file whole-trip download, a versioned tested safety limit, automatic numbered parts split only at complete city boundaries, one logical batch action, capability-gated ordered city-image sharing and stale regeneration. Old per-day, native-photo, ZIP and overlong-hard-failure directions are superseded. Recent-trip recovery has approved Story 7.1 references below; Story 7.2 check-in boards are deferred out of MVP; photo-based marks/media belong to future FR40.1. Quota degradation intentionally has no dedicated prototype. |

`导入灵感` is a Xiaohongshu branch, not a required page in every planning
session. `调整与校验` is a loop around `行程计划`, not a one-way wizard step.
Cross-city selection branches from S4 or S8: a new stay city loops to S2/S3, while a same-day
excursion enters its date/round-trip setup before the same planning path.

## Cross-city Day Excursion Current Contract

Day-excursion Entry/Transport R1 and Timeline R1 are the approved visual contract for limited
same-day A-B-A:

1. The cross-city Sheet distinguishes `安排{城市}一日游` from `增加{城市}行程`; neither action
   silently converts into the other.
2. A day excursion binds one host date and requires separate outbound and return transport facts.
   A missing return remains a recoverable draft and disables confirmation.
3. The destination uses a child single-city Plan between the two transfer boundaries. Host hotel
   and luggage remain attached to the host Plan and no destination Stay is created.
4. The timeline keeps one Dn tab and one host city identity. It marks `已回到{宿主城市}` instead
   of creating a second same-name city tab.
5. The operation Sheet edits the child plan, transport or date explicitly. AI adjustment is scoped
   to the active host or child Plan and never changes the two transfers or the other Plan.

The boards do not authorize cross-timezone or overnight return, nested excursions, A-B-C-A,
multiple excursions on one host day, or an excursion on a main-chain handoff day.

## Food and Shopping Current Candidates


Food is now explicitly an independent timed slot when planned. The current
prototype set covers:

1. Fixed reservation/required restaurant as an immutable meal anchor, styled
   like a normal POI with only a compact evidence badge.
2. A meal choice pool with one primary and a target of two alternatives.
3. Switching the primary with local route validation and global undo.
4. `暂不决定` without a visible fixed-duration promise, including ordered
   location-aware recall and a first-missing-slot `+ 添加更多` state.
5. Imported-note food attached to a mall/market/food-street POI as a clickable
   child hint with no separate time or timeline node.

Shopping uses a different model. Shopping Checklist R2 fixes a compact icon
rail to the right of scrollable date tabs and opens a full checklist with
must-buy targets, along-route stores, and return checkpoints. Shopping Add
Record R1 covers empty-input and typed-input emphasis for
`AI 提示 | 直接添加`. The previous 48-hour reminder concept is removed.

These are visual candidates only. The PRD, Epics, and UX sources now carry the
approved intent, meal, commercial-area, and checklist contracts. OpenAPI,
Prisma, implementation stories, and code remain intentionally unchanged until
Implementation Readiness and Sprint Planning publish the implementation order.

## Approved Story 6.2 Recall

Meal Location/Fallback R1 (`story-6-2-meal-location-recall-fallback-r1.png`) was approved with
Story 6.2 on 2026-09-05 and supplements Meal Recall R2. The 2026-09-14 text amendment additionally
allows one fix on app open/foreground resume with an applicable on-trip meal context and still-valid
historical or newly granted permission; meal entry/manual refresh remains supported. Same-activation
events coalesce, unauthorized opening does not prompt, and app-open results cannot overwrite a Sheet
draft. The old boards do not establish this new lifecycle path. Denied, invalid or stale location
uses labeled same-scope plan context. Story 7.2 is deferred;
MVP uses previous/next planned POIs and does not query visit-completion or photo-derived records.
No plan anchors falls back to the saved pool/manual-add. Recall does not mutate a MealSlot; selection
uses Story 6.1 preview/confirm. Permission restoration depends on real browser capability, and note
based no-queue evidence must not be presented as a real-time guarantee.

## Approved Story 6.3 Area Food

[`Area Food Context R2`](../../_bmad-output/implementation-artifacts/visual/story-6-3-area-food-context-r2.png)
was approved with Story 6.3 and replaces Area Food Suggestions R1. It preserves the POI-attached
hint and owner-import list, removes the obsolete visible verification/quality badge, and adds
no-reliable-membership and results-removed states. The GWT contract in epics.md is authoritative.
Source/meal fixtures in the board are illustrative and are not verified provider facts.
The generation brief is `story-6-3-area-food-context-r2.prompt.md` beside the image.

Panel A attaches one hint to a mall/market/food-street POI without a timestamp or extra slot.
Panel B drills into the owner's imported canonical food POIs and protected source records.
Panel C hides the hint for absent/rejected membership or no eligible owner imports; it adds no
technical error badge to the timeline. Panel D clears items that become inaccessible after opening.
A request failure retains retry and must not be reported as a successful empty query.

## Approved Story 6.4 Checklist Records

The existing Shopping Checklist R2 and Shopping Add Record R1 remain references for the fixed
date-rail icon, full checklist and empty/typed composer emphasis. The approved supplement
`story-6-4-checklist-record-workflow-r1.png` covers direct record entry, AI loading, editable/selectable
suggestions before confirmation, and failure with original input preserved. It was approved with
Story 6.4; its GWT contract governs the implementation. The matching `.prompt.md` records
generation and the correction removing inherited schedule-undo buttons.

General notes use `其他记录` only when needed, alongside the three existing shopping/return
groups. Empty direct-add enters an editor without saving a blank item. Checklist edits use their
own versioning; the old backgrounds' `撤销 8` is not a checklist undo contract. Old example rows
showing stores, airport tasks or 45/60-minute timeline buffers do not authorize Story 6.4 to add
those schedule elements: store matching and checklist-to-schedule conversion are explicitly
deferred; existing transport/stay/luggage planning retains its required buffers. Approved Story 6.5 only adds lightweight shopping text capture.
Counts are computed from the real checklist, not copied from prototype sample numbers.

## Approved Story 6.5 Lightweight Shopping Input

The user approved Story 6.5 as one free-text shopping record with optional newline-label shortcuts.
[`Shopping Text + Shortcuts R2`](../../_bmad-output/implementation-artifacts/visual/story-6-5-shopping-text-shortcuts-r2.png)
was generated to visualize that approved text contract: A empty placeholders, B label insertion
preserving text, and C one saved checklist record. It is supporting design evidence, not evidence
of implemented behavior. Its matching `.prompt.md` retains the built-in ImageGen brief.

Labels are optional insertion commands, not tabs or required attribute selections; any momentary
highlight in panel B indicates the last action only. Empty placeholder examples are not stored.
A meaningful shopping description can be saved with missing attributes, and the shopping path
does not require a date or store. Generic Story 6.4 record date support remains independently valid.

Shopping Target/Stores R1 (`story-6-5-shopping-target-stores-r1.png`) is superseded. Store matching,
multi-store relations, L2-aware shopping scheduling and contextual buying hints are later-version
work. Sales/stock evidence, actual passage/location triggers and automatic-apply authorization/
explanation/undo were explicitly left for later design.

`story-6-5-return-task-time-preview-r1.png` is deferred exploration, not an MVP implementation
reference. The user confirmed that checklist return tasks remain records without a `预留时间`
action. Existing luggage/transport buffers must not be duplicated or withdrawn. Current Epic 6
scope coverage is resolved in `epic-6-coverage-review-2026-09-06.md` in planning artifacts.

## Post-plan Search and Manual Fallback

Post-plan Search R2 and Landmark Fallback R1 define the current Epic 2 candidate slice:

1. AMap keyword search returns a text-only Top-5 list in the existing mobile Sheet.
2. No accurate result exposes `手动添加`, which keeps the user's target name separate from location.
3. The user selects a same-city, AMap-verified nearby landmark; its address/coordinates are only a
   route and distance proxy for the target.
4. Confirmation and later candidate views show `附近估算`, the selected landmark and an explicit
   possible-error message. The target cannot inherit the landmark's canonical identity, exact
   address, opening hours, rating, price, phone or reservation evidence.
5. Without a usable landmark, the candidate remains `待定位` and has no route estimate.
6. `保存到候选` adds the item to `其他候选`, labels the row `我添加的`, and does not change Picker intent or the published timeline.
   Candidate Placement Core/Location Modes/Outcomes R2 define the later Epic 3 explicit command,
   validation and global-undo flow; they do not authorize silent placement in Epic 2.

## Export Current Contract

The Story 5.4 prototype set is the current visual contract for export generation:

1. S10 opens export settings for the exact current revision; unfinished details do not block a
   base-itinerary export.
2. Base itinerary is required. Current available details are optional and width is 1080 or 1242.
   The revision derives an ordered city-unit manifest: one image for a standalone Plan, one for each
   main TripSegment and one for each DayExcursion child Plan. Every unit contains all of its dates.
3. The public output contract is `导出图片`: WebP by default and JPEG only as compatibility
   fallback. A PNG intermediate is not a user-facing promise.
4. The same current ValidationRun gates preview. Hard conflicts and incomplete atomic Trip facts
   disable it; soft warnings remain visible but allow continuation.
5. Preview and generation bind one exact PlanRevision/TripRevision. A newer current revision makes
   the preview stale and requires refresh.
6. ExportJob progress uses processed city units and real stages, never a fabricated percentage. Reconnect
   resumes the same job; failure preserves settings and supports a safe retry.
7. Story 5.4 ends with owner-authorized generated city files/download. Story 5.5 adds a normal
   one-file whole-trip download; when a tested versioned limit is exceeded, one user action starts
   an ordered batch of `N/总数` images split only at complete city boundaries. System sharing remains
   capability-gated and city-image ordered; neither path uses ZIP or direct photo-library write.
8. Quota degradation is governed by the text contract and intentionally has no dedicated visual.

## Epic 7 Visual Review



The six-story Epic 7 split and Story 7.1 were approved on 2026-09-06. The following 7.1 boards are
approved references, subordinate to its confirmed annotation and GWT. Story 7.2 was subsequently
excluded from MVP; its boards below are retained only as historical exploration.

| Approved Story 7.1 asset | Coverage | Text boundary |
| --- | --- | --- |
| [Recent Trips Resume R1](../../_bmad-output/implementation-artifacts/visual/story-7-1-recent-trips-resume-r1.png) | Home entry/full list; standalone and linked identities; draft/running/failed actions; restoration of one S10 day | One S10 example does not require every reopen to go to ResultSheet. Valid S7 editing context also resumes. `已生成` replaces travel `已完成` per approved 7.1. |
| [Recent Trips Recovery R1](../../_bmad-output/implementation-artifacts/visual/story-7-1-recent-trips-recovery-r1.png) | Empty Home, no-cache list failure, first-generation retriable failure and existing itinerary with failed update | Current published plan remains readable; a pending/failed change never replaces it. Retry only uses actions permitted by the actual failure. |

Approved review record: [Story 7.1](../../_bmad-output/planning-artifacts/story-7-1-review-2026-09-06.md).
Exact labels follow its text, including `草稿 · 住宿安排` and `规划中 · 正在校验`; hotel is
optional. Loading, pagination, unavailable/auth targets, long city chains and restored linked scopes
still require implementation screenshots. Check-in is not part of either board or current MVP.

Confirmed Story 7.1 annotation (2026-09-06): a subordinate change entry requires a real saved
change draft/task from an existing replan flow, such as adding a city or changing intercity dates
or transport. Half-filled saved input uses neutral `有未完成的修改 / 继续填写`; a current
queued/running job uses `修改规划中 / 查看进度`. Recovery R1 D is only the genuine terminal
failure example, with exact copy `本次修改生成失败 / 查看原因`; it must not represent simply
leaving a form or losing connection. The bitmap is unchanged; unfinished/running subordinate-row
variants are text-defined, not separate high-fidelity frames. Old failed tasks must not override
new saved input, and published/abandoned changes must not leave phantom recovery entries.

### Story 7.2 Deferred Manual Exploration

| Historical non-MVP asset | Former review coverage | Unapproved, deferred decision |
| --- | --- | --- |
| [Check-in Core R1](../../_bmad-output/implementation-artifacts/visual/story-7-2-check-in-core-r1.png) | Independent ResultSheet row action, same status in slot content, successful checked/cancel entry | Concrete planned POIs/primary restaurants only; no hotel/transport/free-time check. No schedule undo or GPS gate. |
| [Check-in Recovery and Identity R1](../../_bmad-output/implementation-artifacts/visual/story-7-2-check-in-recovery-identity-r1.png) | Saving, known rejection/retry, replacement does not inherit and another day's visit stays unchecked | Same-date retime/order retains status; replacement/new date/new occurrence does not. Unknown outcome queries the receipt rather than showing the depicted definite-failure state. |

Historical draft: [Story 7.2](../../_bmad-output/planning-artifacts/story-7-2-review-2026-09-06.md).
The user explicitly excluded this manual flow from MVP. Do not implement its controls/schema or
treat its missing edge states as current UI/readiness gaps. S10 keeps Story 5.2's compact POI view.
FR40.1 photo/location-based marks and album-video/nine-grid/AI-beautified outputs need a new future
design, not completion of these manual boards. See the
[approved scope decision](../../_bmad-output/planning-artifacts/check-in-scope-decision-2026-09-06.md).

### Story 7.3 Approved Account and Actions

[Account Actions R2](../../_bmad-output/implementation-artifacts/visual/story-7-3-account-actions-r2.png)
shows Settings and current-session logout, subject to
[Story 7.3 review](../../_bmad-output/planning-artifacts/story-7-3-review-2026-09-06.md).
The user confirmed the full revised story and R2 on 2026-09-06, with no user-facing quota/usage.
Only read-only account and available operations remain. Data/privacy/feedback rows assume their
actual destination capabilities are deployed, not that 7.3 implements the later workflows.
Undeployed actions are not executable; deployed actions with temporary failure keep safe recovery.

The former [Usage R1](../../_bmad-output/implementation-artifacts/visual/story-7-3-settings-usage-logout-r1.png)
and its archived proposal are superseded. Do not implement its usage page, counts, limits, windows,
AI availability panel or quota reset information. Internal protection remains; real task progress
belongs to the existing operation screens. Loading, capability-read failure, auth expiry, unsaved
input and logout failure require implementation screenshots/tests. No quota-degradation board.

### Story 7.4 Approved Account Data Export

The following boards accompany the approved
[Story 7.4 review](../../_bmad-output/planning-artifacts/story-7-4-review-2026-09-06.md).
Current structured-data scope, exclusions, JSON-in-ZIP and both boards were approved on 2026-09-06;
this is planning approval, not implementation or a change to Epic 5's no-ZIP image export.

| Approved asset | Coverage | Text boundary |
| --- | --- | --- |
| [Account Export Core R1](../../_bmad-output/implementation-artifacts/visual/story-7-4-account-export-core-r1.png) | Request/scope, running with real stage, ready file with cutoff/expiry and download/regenerate | No request on entry; personal data only for authenticated owner. No original media/history or restore-import proposal. Dates/size are examples, not a fixed retention policy. |
| [Account Export Recovery R1](../../_bmad-output/implementation-artifacts/visual/story-7-4-account-export-recovery-r1.png) | Actual generation failure, expired file and detectable download-request failure | Generation retry retains a sealed snapshot; pre-seal capture retry follows the text. Expiry requires explicit new generation; download retry uses the same valid file. A read error/departure is not job failure. |

Queued, loading/read-error, auth-expired, empty-account, valid-old-file during regeneration and
large-font/long-name states require implementation screenshots/tests. Recovery C must retain
actual expiry metadata in implementation. Browser download launch is not proof of device save.
No quota-degradation state, public archive link, album permission, automatic email or push.

### Story 7.5 Approved Account Deletion

The following boards accompany the approved
[Story 7.5 review](../../_bmad-output/planning-artifacts/story-7-5-review-2026-09-06.md).
Irreversible acceptance, restricted post-disable recovery and retention disclosure were confirmed
on 2026-09-06. This is planning approval, not implementation completion or real-data deletion.

| Approved asset | Coverage | Text boundary |
| --- | --- | --- |
| [Account Delete Core R1](../../_bmad-output/implementation-artifacts/visual/story-7-5-account-delete-core-r1.png) | Scope/optional prior export, final confirmation, accepted/cleaning | Only final authenticated acceptance disables access. Export optional, no undo/restore; queue acceptance is not completed erasure. |
| [Account Delete Recovery R1](../../_bmad-output/implementation-artifacts/visual/story-7-5-account-delete-recovery-r1.png) | Verified online cleanup with disclosed isolated backup, known unfinished cleanup and read-unavailable | Retained-backup example requires an actual policy and separate scope disclosure. Retry needs scoped authorization, resumes same task and never reactivates account. Read-only receipt cannot authorize deletion or ordinary access. |

Existing-method step-up, submitting/unknown commit, receipt expiry/loss, cross-device verification,
actual detailed retention disclosure and large-font variants need implementation screenshots/tests.
No fixed backup duration is approved. Unverified active-store cleanup must stay incomplete; an
offline device/external downloaded copy cannot be promised instant remote erasure.

### Story 7.6 Approved Feedback Delivery

The following boards were approved on 2026-09-07 with the
[Story 7.6 review](../../_bmad-output/planning-artifacts/story-7-6-review-2026-09-06.md).
Runtime-aware opening, first-party text/one optional screenshot, opt-in diagnostics and durable
receipts follow the approved text contract. Do not treat the bitmap as proof of a configured Tencent product.

| Approved asset | Coverage | Text boundary |
| --- | --- | --- |
| [Feedback Entry and Submit R1](../../_bmad-output/implementation-artifacts/visual/story-7-6-feedback-entry-submit-r1.png) | Web/PWA external/first-party choice, minimal form and real first-party receipt | External page is owned by Tencent, not recreated here; opening is not submission. Diagnostics OFF by default; example id/time are fictional. |
| [Feedback Recovery R2](../../_bmad-output/implementation-artifacts/visual/story-7-6-feedback-recovery-r2.png) | Unchanged external failure, quiet disabled upload, active upload/submit without bottom actions | User correction 2026-09-07: no attachment failure line/retry row/special text-only button; X removes a pending attachment before normal text submission. No busy bottom retry/return; same-request checks are bounded. |

Recovery R1 is superseded by the user's two annotations, not silently deleted. Full Story 7.6 and
visual approval followed on 2026-09-07. In R2 B, unresolved selected attachment keeps ordinary submit disabled
until explicitly removed or upload recovers; no silent loss. During upload/submit/result checks,
R2 C has no bottom actions; top navigation retains context. Only true save failure or exhausted
wait leaves busy and exposes appropriate recovery, never an endless spinner. Stage labels stay factual.

Native loading/actual external page, config missing, known save rejection, auth expiry, screenshot
preview/validation, discard and large-font variants require implementation checks. Readable raw
feedback belongs only in authorized product/maintainer views, not logs or telemetry. Core B's
submit action needs clear enabled/pending/disabled affordance. No new ticket-history/SSO/reply UI.

## Story 8.1 Approved Operator Walkthrough

[Observability Walkthrough R1](../../_bmad-output/implementation-artifacts/visual/story-8-1-observability-walkthrough-r1.png)
was approved with `story-8-1-review-2026-09-07.md` on 2026-09-07, not as a new Nomad interface.
It illustrates looking up an error, correlating a safe task/attempt reference to AI observations,
and keeping travel work independent of monitoring outages. It is not an actual Sentry/Langfuse
screenshot or a request to build their UI in Nomad; no credentials or production data were used.

The selected error is attempt 1, followed by a successful attempt 2. The shared reference is a
safe business correlation, not a promise of identical OTel trace IDs or one shared parent tree.
All times, counts, IDs and codes are illustrative. The approved target uses one global
Sentry provider and explicitly isolated Langfuse tracing with separate bounded sampling; no Replay
or complete input/output capture. Actual vendor lookup, symbolication, access, retention/deletion,
missing data and outage behavior require implementation evidence; approval is not deployment completion.

## Story 8.2 Approved Human Evaluation Workspace

[Human Workspace R2](../../_bmad-output/implementation-artifacts/visual/story-8-2-evaluation-human-workspace-r2.png)
was approved with Story 8.2 on 2026-09-08 after the user annotations. A compares two versions on 24 synthetic samples
(48 executions); B shows human numeric/categorical scores and a comment; C shows experimental
prompt/model settings and the distinction between one-prompt trial and private CI full regression.
Counts/rubric/policy examples are illustrative, not model evidence or product limits. Automatic
scoring and pending human review are distinct; per-rule reminders/review replace a blanket veto.

The existing Langfuse UI should be reused, not reproduced from this conceptual board. A convenient
full-regression link can be separate from vendor navigation. Production Provider/budget changes
belong to 8.3/8.4, with thin aggregation in 8.6; evaluation does not automatically publish models.
Access denial, empty data, unsynchronized results and unavailable models must use truthful existing
tool states and be verified in implementation. Dataset intake/redaction and every vendor dialog are
not all pictured; required operator use must actually work, not merely publish a summary.

[Report R1](../../_bmad-output/implementation-artifacts/visual/story-8-2-evaluation-report-r1.png) is
retained but superseded for its blanket hard-gate/summary-only direction. The current requirements
allow direct-identifier-filtered production samples while keeping 8.1 production telemetry separate.
Story 8.2 and R2 are approved; no deployment, data upload or live evaluation is implied.

## Story 8.3 Approved Route Configuration

[Route Config Release R1](../../_bmad-output/implementation-artifacts/visual/story-8-3-route-config-release-r1.png)
shows a small operator route table/draft, production diff confirmation and a published r13 with
no new task yet using it. Existing queued/running jobs remain on r12. Sample connection/model IDs,
20-second timeout and two attempts are illustrative, not product limits or actual test evidence.

[Recovery Rollback R1](../../_bmad-output/implementation-artifacts/visual/story-8-3-route-recovery-rollback-r1.png)
covers incompatible image-task backup, unknown publish result after disconnection, copying r12
settings into a new r14 rollback release and a separate pause-future-calls confirmation. These
four examples are independent. Pause does not promise upstream cancellation, undo charges or
restart jobs; normal publish/rollback does not clear a pause. Controls need real permission checks.

Both boards were approved with Story 8.3 on 2026-09-08 as narrow Nomad configuration views,
not faithful vendor screenshots or a general operations platform. The approved adoption uses Node/Fastify/PG/React
and leaves Unleash as ordinary flags, with no mandatory new AI gateway. No production data/secrets
were used; authentication, version-conflict, no-data/denied/resume and propagation states remain
contract-defined and need real browser evidence. Story/visual approval is not deployment; 8.1/8.2 unchanged.

## Story 8.4 Approved Budget Controls

[Budget Policy Usage R1](../../_bmad-output/implementation-artifacts/visual/story-8-4-budget-policy-usage-r1.png)
shows a persisted budget draft, production impact confirmation and separate confirmed, estimated,
unsent-reserved and in-flight/unknown amounts. The synthetic example totals USD 13 against a new
USD 15 limit, leaving USD 2 for new reservations; all amounts/counts/windows are examples.

[Budget Recovery R1](../../_bmad-output/implementation-artifacts/visual/story-8-4-budget-recovery-r1.png)
shows four independent cases: a timed-out attempt retaining an unknown-cost hold, a tightened limit
below existing exposure, a publish result awaiting an explicit receipt check, and stale ledger data
that cannot authorize new dispatch. Unknown is never shown as free; no reset-balance action exists.

These two base boards, the revised 26-GWT contract and Node/PG adoption were approved on
2026-09-13 with desktop Web and amount-source clarification. They do not prove implementation
or complete visual coverage. No user quota UI, gateway, billing subscriptions, Telegram or 8.6
overview is added by 8.4; the user authorized entry into Story 8.5.
Permission denial, empty data, long tables/pagination, policy rollback, window migration and actual
reconciliation submission remain in the text contract and require implementation browser evidence.
Prompts are saved beside the images; no production data or credentials were used.

User clarification (2026-09-13): operator management is desktop Web only; operator mobile
adaptation and phone screenshots are not required. The USD 15 is an operator-set Nomad limit,
and USD 2 is computed remaining internal budget, not an upstream account balance. The confirmed
cost example assumes matching supplier evidence; absent a bill source, show unavailable/unreconciled
coverage rather than zero or a fabricated confirmed amount. Price registration, source detail and
no-billing-source states were text-defined in the amount-source addendum and are not drawn in R1.

## Story 8.5 Approved Telegram and Delivery Controls

[Telegram Lifecycle R1](../../_bmad-output/implementation-artifacts/visual/story-8-5-telegram-lifecycle-r1.png)
shows desktop conversation excerpts for a qualifying terminal alert, a later aggregated update and
evidence-based recovery of the same incident. Counts are unique terminal events, not users or API
retries; intervals/IDs/aliases are synthetic. Panel B's gray aggregation line is a review annotation,
not a Telegram system message or an extra outgoing notification. Styling is conceptual, not a vendor
screenshot; ordinary bounded text and the safe payload contract govern actual delivery.

[Operator Delivery Recovery R1](../../_bmad-output/implementation-artifacts/visual/story-8-5-operator-delivery-recovery-r1.png)
shows four independent desktop Web states: policy draft, time-limited notification mute, unknown
delivery with possible duplicate retry, and deterministic target permission refusal. Static checks
do not send messages; mute/channel repair do not mean the service has recovered.

The 24 GWT and Node/PG plus thin Telegram sendMessage adoption were approved on 2026-09-13
with both base boards. This is planning approval, not actual delivery or complete visual coverage.
No real messages, production recipients or credentials were used. No operator mobile adaptation is
required. No-target, full publish/conflict/permission, explicit TEST confirmation, source outage,
recovery-before-send, reordered episodes and topic/migration variants remain in the text contract
and need implementation desktop evidence. Prompts are stored beside both images.

## Story 8.6 Approved Read-only Overview

[Overview R1](../../_bmad-output/implementation-artifacts/visual/story-8-6-operations-overview-r1.png)
shows one proposed desktop Web overview: task outcomes/degradation, sampled latency, a sealed
evaluation report, authoritative budget components, current incident/delivery state and configuration
version evidence. The 6 degraded/fallback completions are included in the 112 completed tasks,
not additional tasks. Report time, business window and budget/incident timestamps remain distinct.
All numbers and connection/version labels are synthetic, not real health or provider billing.

[Source States R1](../../_bmad-output/implementation-artifacts/visual/story-8-6-overview-source-states-r1.png)
shows an unavailable observation source with explicitly old values while PG summaries remain usable,
a verified empty business window with no invented 100% success, and denied access after changing
environment with old production data removed. An empty task window does not erase the sealed report.

The thin Node/React page, 20 GWT/Chinese review items and both R1 boards were approved on
2026-09-13. Planning approval does not prove actual data integration or full visual coverage.
No operator mobile adaptation, new Grafana deployment, iframe/public snapshot or raw user-content
drill-in is proposed. Source-specific query limits/auth/freshness still need real implementation.
Pagination, full-source denial, cache-revocation races and tool-login/expired-link variants are text
specified but not all drawn; real desktop evidence remains required. Prompts are beside both images.

## Approved IR Scope and Delivery Amendments (2026-09-15)

Subsequent approval on 2026-09-15 adopts all 18 groups in the prompt-strength audit. Current text
and GWT take precedence for softer copy and placement: soft-only issues have one low-emphasis
entry; location fallback leads with the actual planned basis; completed old images use
`行程已有更新，可重新生成`; parts use `将下载 N 张长图`. Hard/mixed issues, typed failures,
unknown saves, identity and irreversible/production confirmations retain their existing gates.
The existing PNGs are unchanged; wording/weight in older images is not authority where it conflicts
with the approved presentation table. Verify updated states during the owning UI implementation,
not by claiming this text adoption re-rendered or tested every image. The 5.1 minimum host/source/
return and 1.11 desktop correction checkpoints remain.

Story 1.0 adds the production identity/multi-device prerequisite while reusing the existing login
screen. Production callbacks, unavailable providers, session/revocation and operator authorization
need real implementation evidence; this text does not turn old synthetic images into login proof.

FR4.2/Story 1.11 retains only manual place correction among additional admin tools: existing POI
name/address/same-city coordinate drafts, provenance, check/diff/publish/clear-override, permission,
conflict/unknown receipt and unchanged old plan/job snapshots. Existing brand-rule and POI boards
are partial references; the new form/publication/recovery states require desktop evidence during
1.11 UI work. No operator mobile layout or new generic admin suite is required.

Story 5.1 now owns the minimum S10 base host/S7 plan entry, S9 minimal authenticated source
expansion and same-context return even before full 5.2 ships. Its existing pre-UI checkpoint must
cover that connected path plus run/reconnect/partial/failed/stale/source-unavailable states.
5.2 enhances the same route with full checks/slot reading/CitationSheet; its R1/R3/R2 references
remain final-layout guidance. Do not duplicate the result page or falsely claim new images were
created in this amendment. The old detail-entry states image remains superseded.

Account merge/self-unlink/device center, dedicated moderation integration, extra admin tools and
reachability/photo-heat layers are deferred. Current mobile traveler layouts, desktop operations,
FR48 App-open refresh and FR39 inline `建议核对` remain. The separate 18-group proposal was initially
outside the IR decision, then explicitly approved in the subsequent 2026-09-15 message; its adopted
presentation contract now applies.

## Approved CE Contract Amendments (2026-09-14)

Later PRD refinement (after CE completion, before IR analysis): FR39 and Stories 5.1/5.2 now use
accessible secondary inline `建议核对` for source-less safe generic advice, beside the content in S9
and inside S10 slot details. No modal, repeated toast or per-item acknowledgment is required.
Real citations, unavailable-content truth and schedule gates remain. Existing PNGs are not updated
by this text change; S9's existing visual checkpoint and implementation evidence still apply.
The broader prompt-strength audit is a separate proposal in
`_bmad-output/planning-artifacts/ux-prompt-strength-audit-2026-09-14.md`, not blanket visual approval.

CE-01 amendment approved on 2026-09-14: Story 1.11 includes minimal desktop Web brand-rule
maintenance, draft/check/publication, access checks, audit and stable per-attempt version use.
Its two added GWT are text-approved. Existing POI/branch-disambiguation boards do not cover this
new operator surface; implementation must supply the corresponding desktop visual evidence.

CE-02 amendment approved on 2026-09-14: adding a day excursion to an existing S8 itinerary only
changes the affected host date and child Plan. Displaced non-frozen activities remain explained
unresolved/candidates; other host dates stay unchanged. Story 4.7 explicit date moves retain their
separate old/new-host-date contract. Existing excursion boards are layout/scope references; the
approved text takes precedence for spillover and failure details that are not drawn.

CE-03 amendment approved on 2026-09-14: normal browser download handoff uses the exact copy
`已开始下载，请确认` and keeps device-save status unknown. Only verifiable write/close results may
claim saved files; retrying unknown files requires explicit action and duplicate-risk disclosure.
The 5.5 R5 layout/numbered parts remain approved, but do not establish completion receipts for
ordinary browser downloads. The revised copy/unknown branch must have implementation browser
evidence; existing PNGs are retained unchanged and are not claimed to display this new copy.

## Highest-Ambiguity Missing Prototypes

| Priority | Missing surface/state | Why it is ambiguous |
| --- | --- | --- |
| P0 | Arrival/departure mode sheet: exact, 2-hour window, AI decides | These modes create different Planner constraints and need distinct summaries and edit paths. |
| P1 | Candidate replacement and free-time details | Story 3.2 R3/R2 covers grouping, provenance, location modes, command choice, confirmation and major outcomes; the full replacement-target chooser and dense/overlapping free-time edge states remain behavior-defined rather than fully visualized. |
| P0 | Main-chain linked-city transfer editing | Day-excursion entry, missing-return and same-day timeline are now covered. Main-chain inserting/reordering, AI-proposed handoff, transfer failure and hotel/luggage handoff remain incomplete. |
| P0 | AI Fill and Result Sheet | S10 overall check, read-only detail/citations, recovery and user-line editing now have current references. S9 running/reconnect/partial/failure/stale screens remain unprototyped; restore-AI is intentionally removed. |
| P1 | Accommodation child sheets | Breakfast/luggage summaries exist, but exact choices, blank hotel, POI mismatch, storage feasibility, and repeated changes are not visualized. |
| P1 | Post-plan single-night accommodation editing | The single-night hotel/breakfast/luggage Sheet, `管理全部住宿` return context, final-departure state, conditional impact preview and precheck-unavailable path are behavior-defined but do not yet have a current prototype. |
| P1 | S5 optional constraints and inferred-interest state | The approved collapsed companion/mobility/diet input and the no-extra-play-style-question rule are text-only. |
| P1 | AI-planning degraded states | Current prototype shows only success, so timeout, generic internal fallback, queue, and reconnect copy can drift. |
| P1 | Validation edge states | Multiple conflicts, no safe fix, user-choice-required alternatives, and fix failure/retry are missing. |
| P1 | Home unknown/error/network states | Queue R4 covers batching and the HomeImportDock contract is synchronized, but unknown input, retry, reconnect, duplicate and mixed-input states remain unprototyped. |
| Deferred | Advanced shopping target/store flow | The old association form is superseded. Story 6.5 covers light text/shortcuts; sales evidence, store discovery, automatic placement and contextual buying hints await later-version design. |
| P2 | Meal recall remaining edge visuals | Approved Meal Location/Fallback R1 covers permission/live/stale/denied/no-fix. No-anchor, late response and zero-result behavior is specified in Story 6.2; browser-specific permission restoration uses actual platform capability. |
| P2 | Login, Settings, privacy, Feedback | Story 7.3-7.6 boards approved; no quota UI. Story 7.6 Entry R1/Recovery R2 include the 2026-09-07 quiet controls. Remaining native/external/auth/timeout/receipt/retention variants need implementation screenshots. |
| P2 | Recent trips | Story 7.1 Resume/Recovery R1 are approved; remaining loading/auth/long-list states follow its implementation screenshot gate. |
| Deferred | Check-in and photo-based travel media | Manual Story 7.2 is excluded. FR40.1 photo/location marks, album videos, nine-grid and AI beautification await later design; not current MVP visual gaps. |

## Existing Prototype Conflicts

- `story-7-6-feedback-recovery-r1.png` is superseded by Recovery R2. Its attachment-failure prompt,
  dedicated retry/text-only buttons and busy-state bottom actions must not guide implementation.

- `story-7-3-settings-usage-logout-r1.png` is superseded by approved Account Actions R2 after
  the user's no-quota decision. Its usage table, counters, windows and AI overview must not reappear.

- `story-7-2-check-in-core-r1.png` and `story-7-2-check-in-recovery-identity-r1.png` are
  user-deferred manual exploration, not MVP authority. Their row check controls must not leak into
  current S10, and their visit inheritance rules do not pre-approve future photo recognition.

- `story-6-5-shopping-target-stores-r1.png` is superseded by Shopping Text + Shortcuts R2.
  The separate return-buffer board is deferred exploration and is not part of MVP.
- `story-5-5-city-long-image-transition-regenerate-r4.png`,
  `story-5-5-web-download-share-states-r3.png` and Trip-long Download + Share R4 are superseded by
  Story 5.5 Transition R5 and Trip-long Download + Share R5. The current direction keeps city images
  for viewing/sharing, normally downloads one whole-trip image, and only after a tested limit is
  exceeded creates numbered parts at complete city boundaries. ZIP, city-internal splitting and
  direct photo-library permission are not authorized.
- `story-5-2-result-sheet-citations-r1.png` and `story-5-2-result-sheet-citations-r2.png` are
  superseded by Citations R3. R3 keeps the overview POI-only and removes visible source
  quality/freshness judgments. `story-5-2-result-sheet-states-r1.png` is superseded by States R2,
  which preserves the base itinerary when detail is absent and treats stale recovery as
  single-owner revision safety rather than collaboration.
- `story-5-1-detail-entry-states-r1.png` is superseded by ResultSheet Overall Check R1. Detail
  completeness belongs to S10 and must not consume vertical space in the editable S7/S8 timeline;
  the editor continues to surface revision-bound conflict banners from Story 3.4.
- `story-5-3-slot-override-edit-restore-r1.png` and
  `story-5-3-override-regenerate-recovery-r1.png` are superseded by Line Edit + AI Preserve R2.
  Current behavior marks only concrete user lines, preserves user wording during later enrichment,
  filters same/near-duplicate AI suggestions and exposes no restore-AI action.
- `post-plan-add-place-entry-search-r1.png` is superseded by Post-plan Search R2. R2 separates
  search/candidate creation from the later placement command and keeps manual fallback available.
- `post-plan-add-place-placement-r1.png` and `post-plan-add-place-outcomes-r1.png` are superseded by
  Candidate Placement Core/Location Modes/Outcomes R2. The current sequence starts from an already
  saved candidate, selects a typed command, previews the current revision and writes only after
  confirmation. Landmark Fallback R1 remains authoritative for Epic 2 candidate creation.
- `story-3-2-candidate-placement-core-r2.png` is superseded by Core R3. R3 groups by intent and
  moves `来自灵感 / 城市热门 / 附近推荐 / 我添加的` to row-level provenance; it removes the
  invalid peer grouping of `导入 / AI / 我的补充`.
- `story-2-0-planning-entry-flow-r5.png` is superseded: it combines Time and
  Accommodation into one old Confirm form and lets Picker start planning
  before the new S5 review.
- `story-2-0-picker-intent-signals-r1.png` is superseded by Picker Overview/L3
  R2. R2 makes full-city overview the entry state, confines `附近 | 全城` to the
  L3 drill-down, uses icon-only row signals, and replaces the reservation-only
  sheet with generic POI information.
- `story-2-1-meal-slot-alternatives-r2.png` is superseded by R3, which removes
  meal-specific row colors and adds a compact swap action beside overflow.
- `story-2-1-area-food-suggestions-r1.png` is superseded by approved Area Food Context R2;
  its old verification badge and implied user-location walking times do not guide implementation.
- `story-2-1-meal-flex-spontaneous-r1.png` is superseded by Meal Recall R2 and
  Area Food Context R2. The replacement removes the 90-minute promise,
  specifies ranked/shortage recall, and moves `附近吃什么` under an area POI
  without a timeline node.
- `story-2-1-shopping-checklist-r1.png` is superseded by Shopping Checklist R2
  and Shopping Add Record R1. The replacement fixes a compact icon rail,
  removes the AI/manual legend, and removes the 48-hour reminder screen.
- `story-2-0-time-boundary-input-r2.png` is superseded by Time + Transport R3.
- `story-2-0-accommodation-nights-r2.png` is superseded by Accommodation Per
  Night R3.
- Accommodation Per Night R3 remains behavior-partial: its first-night luggage
  and older global accommodation-change/CTA treatment do not override the current
  per-night luggage and S4 transition text contract.
- `story-2-0-pace-ai-adjust-r3.png` is an intermediate image; R4 is current.
- Story 3.5 Scope/Clarification R1 and No-safe/Stale R1 supplement AI Adjust R4 and Applied
  Explanation R1. Together they are authoritative for scope selection, one-question clarification,
  no-safe-plan recovery and stale-plan retry. AI quota degradation intentionally remains text-only.
- `linked-trip-cross-city-guard-r1.png` is superseded by Cross-city Triggers R2;
  the old image rejects linkage instead of extending the trip.
- Cross-city Triggers R2 remains the main-chain add-city reference, while Day-excursion
  Entry/Transport R1 supersedes its single-path assumption whenever same-day return is eligible.
- Timeline Editing B and the synchronized planning documents support
  minute-level user time adjustment, but the active legacy implementation story and
  code still enforce the old 15-minute/snap contract. It must be migrated into the first
  Epic 3 execution Story before implementation resumes.
- Timeline Editing B still contains visual leftovers where present: the app must
  not show `编辑安排`, branding/version labels or commute facts after the action
  list. `docs/ux/mobile-ia.md` is authoritative for the corrected hierarchy.
- Planning Transition R1 is behavior-partial: any frame that starts planning
  directly from Picker or shows a user-filled `待安排` hole is superseded by S5
  and the candidate/unresolved contract.
- The implemented Picker still treats selection as only `selected_required`;
  Picker Overview/L3 R2 and the current planning documents add `along_route`.
  This is a Story 2.7 contract change, not a cosmetic icon update.
- `docs/architecture/data-models.md` mentions `business_area`, but the current
  Prisma/OpenAPI/Planner/AMap implementation has no normalized or queryable
  commercial-area contract. Administrative district and L2 route clusters
  must not be silently used as equivalents.

## Recommended Next Mockup Set

1. Arrival/departure three-mode flow, including the compact row summaries and
   an AI-provisional first/last day.
2. Meal recall no-anchor and zero-result refinements, after the approved Story 6.2
   permission/live/stale/denied fallback board.
3. Detailed replacement-target selection and dense/overlapping free-time capacity edge states.
4. Linked-city transfer editor and the resulting transfer-day timeline.
5. Remaining recent-trip states and in-scope Epic 7 account surfaces; check-in/photo memories,
   checklist-to-schedule and advanced shopping/store prototypes wait for the later iteration.
6. S9 running/reconnect/partial/failure/stale states as the remaining ResultSheet trust-flow gap.

This sequence closes behavior that changes data contracts before polishing
Login, Settings, or other supporting surfaces.

## Visual Asset Registry Rule

Only assets named in the stage table or conflict list may guide implementation.
Unlisted visual files are `historical exploration` by default. In particular,
Home Direction A/B/C, Home Hybrid R1/R2, Time Mobile R1, Accommodation Flow R1,
Preplanning Confirm R1, Timeline Editing A, Feasibility Direction A, older meal
R1/R2 and old linked-trip guard images are not current contracts. A story may
promote one only by updating this inventory and the corresponding text source in
the same change.

## Capacitor App Increment (Approved 2026-09-19)

复用所有未受影响的当前已批准页面；新增四组原生差异证据由9.1及消费Story维护：登录/回调/恢复，返回/键盘/安全区，权限拒绝/设置返回，保存/分享/文件结果。当前无新App图片已被实际真机验收；在对应UI实现前完成这些增量状态设计，并将实际截图/差异写入Story证据。旧 `story-5-5-native-save-share-r1.png` 仍是废弃探索，不因Capacitor纳入而重启旧per-day/ZIP等语义。

UX-DR36 与 APP-HOST-01 适用于旅行者移动UI；布局/安全区/权限遵循 `docs/front-end-spec.md` 新宿主合同。本文未要求重新审阅所有页面，也不把浏览器截图登记成Android/iOS实证。

## 共享 UI 增量 / UX-DR37（Approved 2026-09-20）

[2026-09-20批准记录](../../_bmad-output/planning-artifacts/ui-foundation-scope-decision-2026-09-20.md)采纳shadcn/ui + Base UI + Tailwind4、Nomad共享组件，并确认iOS16.4+、网页Safari16.4+/Firefox128+和独立Query9.6/Router9.7。本节登记受影响状态及证据责任；当前没有新增原型被批准、组件截图通过或真机验收完成。原S0–S11图片、18组提示与未受影响布局保持其当前权威。

可视身份和交互主合同仍为[front-end-spec](../front-end-spec.md)及[mobile-ia](mobile-ia.md)。本次沿既有文档增量维护，不创建竞争的DESIGN/EXPERIENCE来源，不重绘已批准页面或套用生成器默认主题。旧截图可用于迁移前对照，不能为新依赖下的实现或新平台下限背书。

### 本次增量状态与实施归属

| 使用面/新增交付 | 当前视觉依据 | 新增状态或需补证内容 | 验收责任与当前状态 |
| --- | --- | --- | --- |
| 共享tokens、Button/Field/Tabs/Toast/Skeleton、AppDialog/AppSheet | 现有Visual System及实际CSS；深绿/近白、44pt、卡片≤8px、原动效 | 正常/loading/disabled原因/error/reconnect/empty/partial/stale/unverified，长中文/200%字号/reduced-motion；焦点、背景不可交互/读出、关闭与释放 | 9.3；新共享实现和证据待开发。现有CSS圆角12/14/22px等须按Dock/composer/Sheet或卡片逐项核对，不当成通用视觉扩权。 |
| Login、验证码/协议、当前退出确认 | 现有已接受登录与账号规则、Account Actions R2的适用部分及迁移前实现 | 错误输入、provider不可用、身份checking/unavailable、未知退出结果；所有私有Portal同步遮蔽；按钮/IME不重复提交 | 9.3提供共享基础，1.0补UI01及当前认证/退出回归；未来完整Settings仍归7.3。历史1.1/1.2/1.5不重开。 |
| HomeSheet、HomeImportDock、输入分类/结果 | Home Hybrid R3、Import Queue R4、现行Home Dock合同与迁移前实现 | FIFO真实可见窗口、Sheet遮挡、身份变化、中文输入、未知回执、partial/reconnect；不自动剪贴板、不重置ACK/operation | 9.3共享适配、1.6补UI02；1.7仅受影响ACK/恢复回归。证据待补，不改变1.7停止边界。 |
| 可运行组件工作台及检查 | 上述现有组件可先展示，无需9.3全完成 | 合成成功/403/超时/partial/重连、未声明网络失败、interaction/a11y负例、无真实凭据、产品无MSW/工作台入口 | 9.4；Storybook展示用例不等于BMAD业务Story，当前未交付工作台/真实lint证据。 |
| 浏览器与截图回归 | 迁移前实际页面基线及原批准图，按引擎分别对照 | 登录→Home→Settings→返回、打开关闭/焦点/滚动、身份遮蔽、长中文/200%字号；固定字体/viewport/DPR/locale/timezone/时钟/数据/动画 | 9.5；先建立旧流程基线，迁移Story各交自身结果。actual/expected/diff及trace待生成，不自动接受新基线，不删除原PG/IDB/SSE探针。 |
| Home/Planner城市及owner灵感读取 | 现有Home/Planner布局与提示组15 | 取消/去重/分页/手动刷新、错误≠empty、合法stale、筛选竞争、身份未知/切换及迟到响应；不回放mutation | 9.6已批准独立实施；不宣称所有资源缓存已统一，不产生新页面。 |
| 现有Home、Settings、Planner/DayPlan导航 | 本文件S0–S11及mobile-ia返回路径 | Web直达/刷新/前后退、有效typed intent、非法/过期/跨owner参数、草稿/scroll/focus、键盘→Sheet→历史、loader期间身份改变 | 9.7已批准独立实施；未实现阶段只有类型约定，没有假可达页面；导航不提交。 |
| 新平台下限和发行 | UX-DR36/APP-HOST既有责任 | 最低iOS16.4、当前iPhone、Android10+/WebView111+；网页Chromium/Edge111+、Firefox128+、Safari16.4+；读屏/键盘/安全区、兼容提示 | 9.1补UI03，9.2补UI04；新的实际平台证据待交付。旧16.0目标、旧APK摘要、模拟WebKit均只证明其原有范围。 |

### 后续页面按原业务 Story 消费

| 页面范围 | 共享实现的消费与证据责任 |
| --- | --- |
| owner导入记录、运营地点纠错 | 1.8/1.11负责列表、Field/Dialog、空错状态；1.9/1.10服务端媒体合同保持。 |
| 时间/班次/住宿/约束、Picker/POI、规划shell、候选/负荷/搜索 | 2.3–2.10、2.12、2.14、2.15采用字段/Tabs/AppSheet/AsyncState；2.11/2.13服务端权威不迁入UI。RHF/Zod先随2.3多字段表单需要采用，不重构简单输入或自动升级后端Zod。 |
| SlotEditSheet、DayPlan编辑/修复/AI调整 | 3.1–3.5保持revision/undo并补共享模态交互；3.1仍paused，旧2.2不成为新执行身份。 |
| 跨城与一日游 | 4.1–4.7使用组合组件和边界提示，不改变Trip原子发布。 |
| 细节/来源/行程单/导出分享 | 5.1–5.5保持S10页面级阅读与临时层区分、真实进度及保存语义。 |
| 餐饮/定位降级/清单/购物记录 | 6.1–6.5选择控件、Sheet、空错/权限状态随所属Story补证。 |
| 最近行程/完整设置/副本/删除/反馈 | 7.1、7.3–7.6采用列表/表单/受控确认和回执；7.2及其图片仍延期。 |
| 自有桌面运营 | 1.11、8.3–8.6可共用组件，保持desktop-only、权限及实际来源；8.1/8.2不重绘Sentry/Langfuse成熟UI。 |

### 证据登记规则

- 9.4/9.5先为现有组件/流程提供独立可用的工具与基线；9.3再交付现有代表性入口适配；9.6/9.7在UI试点后分别实施。具体开发派发仍由CURRENT/Sprint及用户停止边界控制，批准范围本身不构成执行恢复。
- 每个迁移项记录原组件/页面、当前共享组件、所属Story、旧组件保留理由、退出条件及当前源码/依赖摘要。一个弹层只能有一套focus/scroll lock/back管理；不能无期限留下第二套实现。
- 共享组件与代表性登录/Home状态使用可运行工作台及实现截图作为本次新增证据，沿用已接受页面布局，不需要重新批准全套图片。其余业务未绘状态仍按上方既有缺口及责任Story定向补充，本次不一并宣布覆盖。
- 浏览器检查分明实际引擎版本、fixture范围与未测项；最低指定版本、VoiceOver/TalkBack、真机返回/键盘及发行仍需对应实际证据。未获得设备/账号/Mac等资源时，仅记录阻断切片，不能用mock完成APP-HOST。
- 最终发行绑定当前组件源码/registry来源/锁文件/Web资源和同候选APK/TestFlight安装升级结果；历史done、旧图/旧包留存，验收状态不因本文更新而变化。
