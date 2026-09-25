# Requirement Trace Audit: Correct Course Closure

Date: 2026-08-12
Status: Planning corrections applied; Implementation Readiness pending
Scope: Stakeholder replies, image annotations, Xiamen methodology, pace research,
food/shopping research, approved decision record, PRD, Epics, UX and architecture

## Audit Method

The audit traced each conversational rule into one of four dispositions:

1. current MVP requirement with FR and Story ownership;
2. UX behavior/state with a text authority and prototype status;
3. target architecture/test contract intentionally awaiting its Story;
4. explicitly superseded or Post-MVP work.

Later stakeholder corrections win over older mockups. A generated image is not
evidence of delivery and cannot override current text.

## Closed Omissions

| Requirement source | Corrected authority and ownership |
| --- | --- |
| Xiamen VAD before ASR, short-video frame policy, multimodal evidence, complete AMap facts | PRD FR4/FR19; new Story 1.8; ingest/data/observability/test architecture. Historical Story 1.3 is only the adapter/stub baseline. |
| Imported play style instead of another questionnaire | FR28.1; Story 1.8 extracts source/confidence signals and Story 2.5 consumes them as soft preference. |
| Default-collapsed companion/mobility/diet/other-constraint input | FR28; Story 2.3; S5 UX. It does not return to S2/S3 or repeat confirmed facts. |
| User-aligned pace and concrete load | FR28/FR51; Stories 2.3/2.5/2.11; DayLoadEstimate and Trip-level recovery findings. |
| Candidate completion path | FR32.3; current Epic Story 2.12; owner imported/verified inspirations -> AnchorPool/versioned city Top-50 -> bounded AMap nearby search -> uncertain candidates or explicit free time. It does not pause PlanningJob for confirmation. XHS keyword search is Post-MVP platform cold-start work. |
| Picker annotation details | FR29-FR31; Story 2.4; L2 derived non-interactive status dot, current-L2 title, three map levels and required/along_route overview propagation. |
| Story 2.2 annotated hierarchy | Story 2.2 AC and current UX: no Nomad/version, no `编辑安排`, commute before actions, minute clock, segment-valid move targets and global undo. |
| Per-night luggage execution | Story 2.3/2.6; first-night, continuous stay, change, storage, one-way departure and versioned transition rules. |
| Cross-city discovery/order/intent | FR35; Stories 2.4/2.7; nearby cross-city content, pending intent, target-segment binding, two-city reverse action and cancel preservation. |
| Meals are selective, not four mandatory daily slots | FR36.2; Story 2.9; fixed/choice/undecided, one primary/two alternatives and area-food rules. |
| Shopping targets differ from places | FR46; Story 2.10; target attributes, zero-to-many verified stores, optional shopping/return time blocks and no live stock. |
| Conversational local replanning | FR50; Story 2.12; accessible launcher, smallest inferred scope, two directions, typed diff, confirmation, applied explanation and undo. |
| Weather and consecutive-load checks | FR51; Stories 2.5/2.11/2.12; reliable forecast horizon, seasonal fallback and no silent rewrite. |
| Evidence versus confirmed booking/lock | Story 1.8/2.4/2.11 target model; inferred evidence cannot display `已预约` or create an immutable lock. |
| Import privacy/reconnect | Story 1.6; owner URL normalization version, durable monotonic SSE cursor and protected source detail. |

## Complete Reply and Annotation Trace

The following matrix is intentionally more granular than the change summary. It is the
acceptance checklist for requirements that first appeared in replies, red-box annotations or
research notes rather than in the original PRD.

| Conversation-derived decision | Current authority | Delivery owner / disposition |
| --- | --- | --- |
| Home uses one long composer plus `+`; text changes it to send with reduced-motion fallback | FR19; Home import dock UX | Story 1.6 |
| Link import expands above the same composer, uses source title/action, safe truncation and `N/X`; no orange/fake progress | FR19; Home import dock UX | Story 1.6 |
| Multiple completed links each retain a full ten-second FIFO window | FR19 | Story 1.6 |
| Recognition copy is `识别 厦门 3天 7月14日出发`; pace is not shown before S5 | Story 1.6 AC; Home import dock UX | Story 1.6 |
| Library import records expose parsed POIs and an owner-only original-link copy action | FR18.1 | Story 1.6 |
| VAD precedes ASR; silent/BGM video skips ASR; short video uses higher-frequency frames | FR4/FR19 | Story 1.8 |
| AMap-verified standard name/address/coordinates/hours/rating/cost/phone and evidence quality are durable facts | FR4; data model | Story 1.8 |
| Upload storage is owner-isolated; MVP dedupe is owner + normalized URL; cross-owner media/compute reuse has ACL/reference/deletion prerequisites | FR18.1/NFR20 | Story 1.6; global dedupe deferred |
| Timeline has no Nomad badge, `我的计划 vN`, bottom recent-operation row or bottom undo toast | Story 2.2 AC; mobile IA | Story 2.2 |
| Global top-right history becomes `撤销 8`, then exposes only one latest eligible undo | FR21 | Story 2.2 |
| Edit sheet starts with POI/date, then previous/next commute, then actions; no generic `编辑安排` heading | Story 2.2 AC | Story 2.2 |
| Move menu includes previous/next/other with D1/Dn/no-nonadjacent disabling and segment boundaries | FR8; Story 2.2 AC | Story 2.2 |
| User time editing is one-minute clock precision; fast scroll changes sensitivity; cross-day uses separate date labels | FR8/FR21 | Story 2.2 |
| S2/S3 ask only time and accommodation; S5 later asks pace and optional collapsed extra constraints | FR27.1/FR28 | Story 2.3 |
| Arrival/departure independently support exact flight/rail, exact two-hour window, or an explicit AI decision without transport details | FR27.1 | Story 2.3 |
| S2/S3 completion distinguishes explicit AI/blank/unknown/undecided/same-as confirmation from untouched ambiguity | FR27.1 | Story 2.3 |
| AI boundary fallback never invents service, ticket, terminal or boarding facts; manual transport entry remains available | FR27.1/NFR23 | Story 2.3 |
| Accommodation is optional per night, matched through AMap; breakfast and luggage are per-night children | FR27.1/FR36 | Story 2.3 |
| `同上` is a deliberate per-night button, not field text or apply-to-rest; it copies hotel/breakfast and recomputes luggage | FR27.1; data model | Story 2.3/2.6 |
| First night has no old-hotel option; continuous stay, hotel change, hub storage and one-way departure have distinct luggage rules | Story 2.3 AC; data model | Story 2.3/2.6 |
| Pace labels and exact descriptions are 悠闲/从容/充实; default 从容 remains editable | FR28 | Story 2.3 |
| Play style is inferred from imports/language/selection with provenance; no duplicate questionnaire | FR28.1 | Story 1.8/2.5 |
| Tickets, reservations and special time periods are evidence/Agent-derived, not S2/S3 toggles | FR27.1/NFR21 | Story 1.8/2.4/2.5 |
| Picker opens on non-expandable global overview; L2 opens a current-L2 screen whose design annotation is `选择 L3` | FR29 | Story 2.4 |
| L2 is never required; its noninteractive status dot/count derives from child L3 intents and distinguishes mixed state accessibly | FR29/NFR19 | Story 2.4 |
| L3 has icon-only mutually exclusive required/check and along-route/Route actions on the right | FR30 | Story 2.4 |
| Both required and along-route propagate back to L3 thumbnails, L2 summaries and global totals | FR31/NFR19 | Story 2.4 |
| Only L3 exposes `附近 | 全城`; POI selection/focus drives nearby, split-L2 and full-L1 map extents | FR29 | Story 2.4 |
| Generic POI sheet is titled with the POI name, never “详情栏”; it includes reservation evidence but evidence alone never means booked | FR29/FR31/NFR21 | Story 2.4 |
| Selecting nothing is valid; selected required is strong intent subject to feasibility; unused items enter candidates | FR7/FR30/FR32.3 | Story 2.4/2.5 |
| AI produces one complete plan and enters the timeline directly; no skeleton/adoption/intermediate-detail CTA | FR7/FR32 | Story 2.5 |
| `计划已完成，可直接调整` remains until the first real mutation, not mere browsing | Story 2.5 AC | Story 2.5 |
| MVP fuzzy completion is owner imported/verified inspirations -> AnchorPool/versioned city Top-50 -> bounded AMap nearby; uncertain results enter candidates and shortages remain free time without pausing PlanningJob. XHS keyword search is Post-MVP. | FR32.3 | Current Epic Story 2.12 |
| Daily load explains item count, steps range, commute, start/end and free time; trip checks consecutive early/high-load days | FR51 | Story 2.5/2.11 |
| Cross-city POI selection explicitly adds a city, preserves required/along-route intent and returns to time/accommodation | FR35 | Story 2.4/2.7 |
| Linked trip preserves one City per Plan and joins ordered plans with versioned transfer/stay/luggage boundaries | FR35/NFR22 | Story 2.6/2.7 |
| Two cities can reverse order; three cities choose insertion; UI uses `→`, not a round-trip-looking glyph | Story 2.7 AC | Story 2.7 |
| Same cross-city confirmation applies during Picker, manual plan edits and AI requests; cancel leaves Trip unchanged | FR35 | Story 2.7 |
| Meal is an independent slot only when fixed, choice-pool or explicitly added; four daily meal slots are not automatic | FR36.2 | Story 2.9 |
| Meal rows look like normal POIs; reliable reservation gets a small badge; swap opens one-primary/two-backup choices | FR36/FR36.2 | Story 2.9 |
| Undecided meal has no fixed 90-minute promise; recall uses nearest, high-rated within 5 km, reliable no-queue, then next-POI proximity | FR36.2 | Story 2.8/2.9 |
| `附近吃什么` attaches to area POIs without a timeline node and only uses owner-imported verified BusinessArea members | FR36.2/FR47/FR48 | Story 1.7/2.8/2.9 |
| Checklist is a narrow fixed icon beside scrollable date tabs; expanded page ends only with `+ 添加记录` | FR46 | Story 2.10 |
| Add Record switches emphasis from direct-add to AI-prompt only after text input; AI result still requires confirmation | FR46 | Story 2.10 |
| Must-buy targets can bind zero or multiple verified stores and preserve product attributes; no live inventory claim or automatic 48h reminder | FR46/NFR23 | Story 2.10; automation deferred |
| Feasibility UI appears only after initial validation or relevant mutation creates a conflict; clean plans have no permanent card | FR22 | Story 2.11 |
| AI local adjustment starts from an accessible icon, infers the smallest scope, offers two directions, previews typed diff and then explains applied changes | FR50 | Story 2.12 |
| Reliable near-term weather may inform a proposed adjustment; stale/far-future data degrades to seasonal/unknown and never silently rewrites | FR51/NFR23 | Story 2.11/2.12 |
| BYOK is absent from the MVP path; platform quota, cost, queue and graceful degradation are visible instead | PRD scope/NFR8; UX platform-usage states | Epic 3 operations |

Any future correction must update this matrix or explicitly supersede a row; silently changing only
a mockup is not sufficient.

## Already Correct Before This Audit

- BYOK is not an MVP path; platform quota, cost, queue and degradation are MVP.
- S0-S11 names and transitions, including S4/S8 linked-trip loops, are current.
- S4 required/along_route propagation to L3, L2 and global totals is required.
- S6/S7 share one timeline shell; Quick/HQ are internal and no completion
  interstitial or initial `完善行程细节` CTA exists.
- Validation is initial plus mutation-triggered; a clean plan has no permanent
  conflict card. Filler cannot change date, time, POI or order.
- Import queue uses the integrated composer, `N/X`, factual title/action, no fake
  progress and uninterrupted ten-second FIFO completion windows.
- Food recall, BusinessArea isolation, foreground location privacy, checklist
  add behavior and removal of the automatic 48-hour reminder are current.

## Explicitly Superseded

- Partial skeleton/manual-first placement, seed badges/reset, Quick/HQ switch or adoption.
- Picker `开始规划`, L2 checkbox/must-go, one-state `selected_required` UI, or
  cross-city rejection/silent mixing.
- Wake-time wording, fixed 15-minute user edits, 30/60-minute snap controls,
  bottom undo toast and per-day recent-operation rows.
- Global accommodation-change card, apply-to-all-remaining nights, non-optional
  hotels and first-night `留在原酒店`.
- Meal-specific background, fixed 90-minute undecided promise, automatic 48-hour
  shopping reminder and unverified live queue/stock claims.
- Detailed `我理解为` explanation before choosing an adjustment direction.

## Explicitly Deferred

- Cross-timezone, overnight transfer, A-B-A, fourth city and arbitrary multi-city reorder.
- Parallel initial light/full plan versions and arbitrary history timeline.
- Cross-trip preference memory, post-trip automatic learning and companion profiles.
- Background location, live queue/stock/delay, automatic booking/purchase/rebooking,
  automatic 48-hour notifications and luggage-capacity monitoring.
- Cross-user compute/media dedupe until shared-object ACL, reference counting,
  retention and account-deletion semantics are designed. Owner records are never shared.

## Known Implementation Decisions, Not Missing Requirements

1. A China-capable flight/rail schedule provider must be selected and staging-
   verified in Story 2.3. AMap remains terminal/route data only; manual entry is mandatory fallback.
2. A weather provider and reliable forecast horizon must be selected and staging-
   verified in Story 2.11. Seasonal/unknown fallback remains usable.
3. BusinessArea reliability policy values and URL normalization rules are
   versioned implementation configuration owned by Stories 1.7 and 1.6.

These decisions should be evaluated by Implementation Readiness and then made
story-level tasks. They do not justify inventing a provider or weakening the
degradation contract in planning documents.

## Gate

Regenerate the BMAD mirrors, verify source/mirror equality and link/FR coverage,
then run `bmad-check-implementation-readiness`. Do not edit sprint status or
resume Story 2.2 business code until IR and refreshed Sprint Planning complete.
