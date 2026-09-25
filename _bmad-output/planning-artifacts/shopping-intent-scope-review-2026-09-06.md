---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
subject: story-6-5-shopping-scope
status: approved-light-input-with-deferred-advanced-design
source: user-correction-to-shopping-target-stores-r1
---

# Shopping Intent Scope Review

## Decision Boundary

The user reviewed Story 6.5 Shopping Target/Stores R1 panel A and requested non-blocking text
input with optional attribute-label insertion. The user explicitly deferred shopping search,
store matching, automatic scheduling and opportunistic shopping hints to a later iteration and
initially asked to clarify requirements first. The subsequent user confirmation approves the
lightweight Story 6.5 and explicitly leaves the three advanced design boundaries for a later
iteration. Story 6.5 is now appended in epics.md, with a supporting text-input prototype. Story 6.4
remains approved. This is planning approval, not business implementation or release completion.

Confirmed directions below come from the user's correction. Proposed defaults and unresolved
questions are distinguished explicitly. The executable planning contract is Story 6.5 in epics.md;
this decision record preserves future design context without changing current scheduling rules.

## Confirmed Input Direction

- Replace the shopping-specific style, quantity and budget form rows with one multiline text input.
- Users can simply write what they want. Attribute completeness must not block saving/continuing.
- Show example placeholder lines such as `款式：`, `数量：`, `预算：`; these are hints, not data
  supplied by the user and not mandatory fields.
- Place optional attribute shortcuts such as `款式 / 数量 / 预算` below the input. Selecting one
  inserts the corresponding label on a new line in that same input while retaining all existing text.
- Retain manual entry. Do not force the user to choose a purchase date or link stores in order
  to express a shopping goal.
- Style/name, quantity, budget, brand, model and size remain optional expressions. The shortcut
  set can be refined later without converting this surface back into a structured questionnaire.

Proposed interaction defaults: append at the end and focus after the new colon; when a label
already exists, focus that line rather than silently duplicate or overwrite it. Keep a compact
horizontally scrollable shortcut row when the keyboard is open. Empty template labels are not
treated as completed attributes. Optional extraction can interpret the text later, but it must
preserve the user's words and must not invent unspecified quantities, budgets or variants.

## Confirmed Later-Version Flow

1. Capture the desired purchase in natural language, with optional label-assisted details.
2. Search for relevant stores automatically when the search capability is available; when necessary,
   invite the user to search and provide results. Always preserve manual store entry.
3. Present the discovered store suggestions and retain their relationship to the purchase goal.
4. For a goal the user wants arranged, let the system choose a suitable store from that set based
   on available capacity around the corresponding L2 and add a shopping arrangement to the trip.
5. When the user prefers not to choose/commit, keep the goal available and attach a contextual
   hint when the itinerary passes a relevant commercial street or buying area.

The intended benefit is to avoid making users manually stitch together a goal, date, stores and
schedule. Finding stores should produce an actionable candidate set, not another mandatory form.

## Proposed Planning Semantics

- Interpret "增加为一个行程" as adding a shopping activity to the existing city Plan, not creating
  another city Plan or scheduling every store in the candidate set.
- Distinguish a request to arrange shopping from merely recording a wish. This distinction may
  come from existing intent or natural language; do not introduce another mandatory mode wizard.
- For automatic scheduling, evaluate available time, route detour, store hours, shopping duration,
  existing required/frozen arrangements, transfer boundaries and any explicit purchase deadline.
  An L2 with fewer POIs is not necessarily the most feasible choice.
- Prefer one suitable store/visit per goal. If an existing shopping visit can satisfy multiple
  goals, propose reusing that visit rather than duplicating its time or travel cost.
- If no candidate fits, preserve the purchase goal and explain that it remains unarranged;
  do not displace confirmed transport, hotels or required places to force it into the timeline.
- A contextual hint can read `这里可顺路买：冰箱贴` beneath a relevant street/area POI. It need
  not occupy a new time slot or imply a purchase has occurred.
- L2 planning groups and normalized BusinessArea memberships remain distinct. Grouping a store
  into an L2 is not evidence that every place in that L2 sells the target or is walkably nearby.

## Evidence and Manual Fallback

A verified store POI establishes the place's identity/address, not that a particular style,
model, size or quantity is currently in stock. Later search must preserve the source and scope
of sales evidence, distinguish suggested stores from supported product matches, and avoid
turning a note or generic business category into a real-time inventory promise.

User-supplied store names/links and manual place entry remain valid acquisition paths. Where an
exact branch cannot be located, existing manual-location semantics may help preserve the lead,
but a nearby landmark is only a route proxy and cannot supply that store's product/stock facts.
Search failure leaves the goal and user text intact rather than requiring a store to be chosen.

## Deferred Design Boundaries (Confirmed)

The user confirmed the sales/stock-evidence boundary, planned passage versus actual arrival,
and automatic-application authorization/explanation/undo are all left for later design. The
following questions preserve that work without resolving it through the light-input approval.

- Search providers, sales-evidence sources and which product matches qualify for automatic use.
- Whether the user's request to arrange authorizes automatic application after planning, and
  how to present the addition, undo it and handle conflicts. Current MVP preview/confirmation
  requirements remain unchanged until a later scope decision explicitly revises them.
- Whether "经过" refers only to a planned route entry or to actual on-trip presence. A planned
  contextual hint is the lighter default; live arrival triggers and background notifications are
  not implied or authorized by this discussion.
- Handling no store, only uncertain stores, no feasible capacity, partial purchase/multiple goals,
  shopping duration and heavy/bulky goods where they affect luggage and transfers.

## BMAD Follow-up

- Keep the advanced shopping flow in Deferred Work rather than approving the old Story 6.5 store
  association form. The old R1 remains historical/proposed and must not guide new implementation
  unchanged.
- Story 6.5 now delivers the approved minimal light-input change with synchronized PRD/Epics/UX.
  It does not remove generic record date support already approved in 6.4.
- Story 6.5 originally combined shopping associations with confirmed return-task buffers. The user
  subsequently agreed to defer checklist-to-schedule conversion as a separate later capability;
  ordinary return records remain in 6.4 and the earlier hotel/luggage/transport buffers remain in
  force. Do not create Story 6.6 for this deferral or duplicate confirmed luggage/transport work.
- FR46 coverage is now disposed of for the current MVP scope, recorded in
  `epic-6-coverage-review-2026-09-06.md`. Deferred capabilities remain unimplemented, and the
  historical sprint state is not changed by this planning closure.
