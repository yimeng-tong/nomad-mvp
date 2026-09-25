# Planning Inputs, Pace, and Linked Multi-City Decision Record

Date: 2026-08-08
Updated: 2026-08-20
Status: Approved decision record; synchronized through `bmad-correct-course`
on 2026-08-12
Scope: Approved product/UX/architecture decision; business implementation remains gated by
Implementation Readiness, Sprint Planning and story-level approval.

Post-approval trace note: `requirement-trace-audit-2026-08-12.md` closes omitted
Story ownership and technical contracts. Where this record uses an unversioned
example entity or omits a later annotation, the audit and current PRD/Epics/UX/
architecture sources win.

## 2026-08-20 Approved Addendum: Same-Day Day Excursion

This addendum supersedes only the statements below that defer every A-B-A shape. The ordered main
TripSegment chain remains non-repeating, but one host segment date may own a same-day,
same-timezone `DayExcursion -> single-city Plan` bounded by independently confirmed outbound and
return TransferLegs. It does not create `A1 -> B -> A2` peer segments, a destination Stay or a
luggage move; the host Plan remains responsible before outbound and after return.

The cross-city confirmation now branches explicitly among `安排{目标城市}一日游`,
`增加{目标城市}行程` and `暂不加入`. Missing/provisional return facts preserve a recoverable draft
but block planning and atomic publication. The published UI keeps one host Dn/tab and uses
`已回到{宿主城市}` after the return. AI adjustment is scoped by host/child Plan identity and cannot
change either transfer or the counterpart Plan. Cross-timezone/overnight repeated main chains,
nested or multi-destination excursions, same-day A-B-C-A and arbitrary chain reorder remain deferred.

Current authority is FR35/FR35.1, NFR22, UX-DR24/UX-DR25 and the architecture input package. The
approved prototype references are `story-4-5-day-excursion-entry-transport-concept-r1.png` and
`story-4-6-day-excursion-timeline-concept-r1.png`.

This revision supersedes four earlier draft decisions: removing a
user-facing pace choice, applying one hotel choice to all remaining nights,
rejecting cross-city L3 selection before linked trips exist, and limiting the
Picker to one `selected_required` signal with no `along_route` intent.

## 1. Why This Draft Exists

The Story 2.0 prototype review and Xiaohongshu research exposed six related
changes that should be reconciled together:

1. Time and accommodation inputs must work as a short mobile task flow rather
   than a desktop-style Confirm form.
2. Accommodation is defined by nights, with hotel, breakfast, and luggage
   confirmed together for every accommodation night.
3. Planning review needs a simple three-option pace choice for first
   alignment, while generated timelines still explain load with concrete
   consequences.
4. Cross-city L3 selection must explicitly expand the trip with another
   single-city Plan and transfer boundary instead of silently mixing cities or
   rejecting the user's intent.
5. Food and shopping use different planning units. Food may occupy independent
   meal slots; shopping primarily uses targets, areas, and return checkpoints.
6. Location-aware food recall needs a normalized commercial-area contract.
   The architecture mentions `business_area`, but the current Prisma model,
   OpenAPI contract, Planner types, and AMap mapper do not expose one.

This draft captures the decisions before PRD, architecture, OpenAPI, stories,
and code are synchronized through BMAD Correct Course.

## 2. End-to-End Mobile Flow

Use the following stage ids and user-facing names in product discussion,
analytics, prototypes, and future stories:

| Id | User-facing stage | Boundary |
| --- | --- | --- |
| S0 | `输入旅行想法` | Enter a destination/natural-language request or paste one or more inspiration links on Home. |
| S1 | `导入灵感` | Xiaohongshu-only branch: `获取内容 -> 理解图文 -> 验证地点 -> 保存灵感`. Natural-language input skips this stage. |
| S2 | `旅行时间` | Confirm overall/city dates, daily departure time, and optional arrival/departure boundaries. |
| S3 | `住宿安排` | Confirm optional accommodation, breakfast, and luggage for every accommodation night. |
| S4 | `选择想去地点` | Browse L1/L2 and mark L3 places as `必去` or `顺路`. The page CTA is `下一步`, because planning has not started yet. |
| S5 | `规划前确认` | Review `必去 / 顺路` signals and choose `悠闲 / 从容 / 充实`. This is the only stage whose primary CTA is `开始规划`. |
| S6 | `AI 规划中` | Show factual planning progress and honest fallback/reconnect states. |
| S7 | `行程计划` | First usable timeline, hotel footer, unplaced candidates, and concrete daily load. |
| S8 | `调整与校验` | Loop for direct edits, AI adjustment, validation, repair, and undo. It is not a one-way wizard step. |
| S9 | `完善行程细节` | AI fills `做什么 / 准备 / 注意` without changing confirmed time or order. |
| S10 | `行程单` | Result Sheet with citations, source attribution, quality state, and light text overrides. |
| S11 | `导出与旅中使用` | Export/share and later check-in/continue-trip behavior. |

Cross-city selection in S4 or S8 confirms the target city, loops back to S2
and S3 for city ranges, transfer, and accommodation, then resumes planning.
The import sub-stages in S1 are not extra planning pages.

The Time and Accommodation pages do not ask the user to confirm pace, play
style, tickets, reservations, or special time periods. Pace is confirmed once,
after L3 selection, when the user can relate it to the places being planned.
S5 also offers a default-collapsed optional field for companion, mobility,
walking, diet and other constraints. Play style is inferred as source-bearing
soft evidence rather than added as another required question.

## 3. Time Page

### 3.1 Information hierarchy

- Navigation title: one destination or an ordered destination chain, for
  example `厦门` or `厦门-泉州-福州`.
- Date row: the overall range and computed duration, for example
  `7月14日-19日 · 共6天`.
- Daily start uses the exact user-facing question `每天几点出门`. It does not
  show an additional estimated-departure sentence.
- A linked trip adds an editable date range and daily departure time for every
  city. The later city starts on the previous city's departure date.
- Boundary travel is expressed as arrival, ordered intercity transitions, and
  final departure, for example `到达厦门`, `前往泉州`, `前往福州`,
  `离开福州`.
- Do not repeat destination, date, and duration in a second summary strip.

### 3.2 Flight and train input

The arrival/departure sheet uses one recognition field for flights and trains:

```text
输入航班号或火车车次，我们会补全时间和到达地点
例如：MF8107 / G1654
```

The system already knows the travel date and whether the user is entering an
arrival or departure. A service number may start lookup, but it is not enough
to become a planning constraint by itself:

- Flight numbers require a travel date and may have codeshares or terminal
  changes.
- Train numbers require boarding and alighting stations because one train has
  many stops.
- Bus, ferry, self-drive, and unknown services need a manual path.
- Lookup failure must preserve manual time and place entry.

The manual path asks for transport mode, date, local time, and a canonical
arrival/departure POI. The service code remains optional. Airport and station
names are matched through AMap before becoming planning constraints.

An exact confirmed local datetime and terminal/location is the strongest
boundary. The service number is provenance and display metadata. Exact input
is optional; the two degradation levels below are first-class choices rather
than validation failures.

Suggested internal contract:

```ts
TripBoundary {
  direction: 'arrival' | 'departure'
  inputMode: 'exact' | 'window_2h' | 'ai_decide'
  mode: 'flight' | 'rail' | 'bus' | 'ferry' | 'drive' | 'other' | 'unknown'
  serviceCode?: string
  scheduledAt?: string
  windowStartAt?: string
  windowEndAt?: string
  terminalPoiId?: string
  terminalName?: string
  source: 'lookup' | 'manual' | 'import' | 'transfer_leg' | 'ai'
  status: 'confirmed' | 'provisional' | 'unverified'
}
```

Boundaries adjacent to another city are derived from `TransferLeg` and must not
be edited independently in both city plans.

### 3.3 Optional boundary and two degradation levels

`到达` and `离开` are independently optional. Each row supports three modes:

1. `具体时间`: recognized service or manually entered exact local time and
   terminal. This is a hard planning boundary.
2. `大概时段（2小时）`: the user chooses one exact 120-minute window, for
   example `10:00-12:00`. Terminal may still be supplied but is optional. For
   arrival, the Planner conservatively starts activities after the window and
   egress buffer; for departure, it ends activities before the window and
   access buffer.
3. `交给 AI 安排`: the user supplies no outer boundary. The Agent chooses the
   usable first/last-day range from pace, accommodation, selected places, and
   verified city context. The result is visibly `AI 暂定` and remains editable.

`交给 AI 安排` must never invent a booked flight, train, terminal, or service
number. It decides usable planning time, not a factual ticket. For an internal
cross-city boundary, AI may propose the transport and time, but an explicit
provisional `TransferLeg` still occupies the handoff interval; the transfer
cannot disappear merely because the user omitted details.

## 4. Accommodation and Luggage

### 4.1 Accommodation is per night

`7月14日-16日 · 共3天` produces two accommodation nights:

- `7月14日晚`
- `7月15日晚`

The last itinerary day must not silently create another hotel night. If the
number of nights looks wrong, the bottom action is:

```text
住宿晚数不对？修改旅行日期
```

Accommodation remains optional. A blank night does not block planning and
must not trigger silent hotel selection.

### 4.2 Same as previous and continuous stays

- The first night accepts hotel, homestay, another address, or blank.
- Every later night has its own hotel input and a separate `同上` action button.
- `同上` is never placeholder text inside the hotel input.
- Do not provide `应用到剩余住宿晚`. The user entered this flow to confirm
  accommodation changes, so every night remains explicitly reviewable.
- A read-only summary may collapse confirmed continuous nights, but the input
  flow keeps each night visible.
- `同上` is a UI shortcut. Persistence copies accommodation/breakfast into a
  new versioned stay snapshot and recomputes the contextual luggage default;
  `same_as_previous` is not stored as final truth or blindly copied transition.
- Breakfast is a visible child row of every stay/night. It inherits with
  `同上`, but can be overridden for a different booking package.

Suggested normalized model:

```ts
Stay {
  checkInDate: string
  checkOutDate: string
  accommodationPoiId?: string
  accommodationName?: string
  leaveBlank: boolean
  breakfast: 'included' | 'not_included' | 'unknown'
}
```

The current boolean `breakfast_included` cannot distinguish not included from
unknown and should be revised.

### 4.3 Luggage is shown for every accommodation night

Every nightly block shows a luggage child row beside breakfast. The Planner
still derives transition events by day, but the user never has to infer luggage
behavior from a hidden stay rule.

The three primary user-facing choices are:

1. `留在原酒店`
2. `带到新酒店`
3. `放在火车站/机场`

Defaults remain contextual and editable:

- same accommodation: `留在原酒店`;
- changed accommodation: `带到新酒店`;
- linked-city transfer: the choice belongs to the transfer and destination
  stay boundary, not to both city plans;
- blank accommodation or a final late departure requires explicit review.

An `其他方式` path covers no large luggage, carry with traveler, courier,
private vehicle, another storage location, and undecided. These cases should
not expand the primary nightly UI.

Station/airport storage creates both drop-off and pickup actions and consumes
time. Dropping at the next stay requires early-storage availability. Leaving
luggage at a previous stay is invalid for a one-way transfer unless the plan
contains an explicit return pickup.

The current plan-global `luggage_plan` cannot express this. Replace or augment
it with transition events keyed by date and stay boundary.

## 5. Three Pace Choices Plus Concrete Load

### 5.1 Product decision

Planning review provides one required, easy-to-change first alignment. `从容`
is selected by default unless the user or imported context already expressed a
clear preference:

1. `悠闲`: `每天 1-3 个主要安排，较晚出发，保留较多自由时间。`
2. `从容`: `每天 2-4 个主要安排，兼顾游览与休息。`
3. `充实`: `优先覆盖更多地点，接受早出晚归、较多步行和换乘。`

This choice is a soft preset, not a promise to force every day into a fixed
slot size. Planning review shows the `必去 / 顺路` L3 summary and the pace
choices; it does not repeat arrival, departure, accommodation, breakfast, or
luggage facts already confirmed on previous pages.

After generation, concrete daily load remains authoritative. It lets users
see when a nominally `从容` trip becomes heavy because of required L3 places,
opening hours, or transfers.

### 5.2 Planner inputs

Map the pace preset to explicit constraints and soft preferences rather than
directly mapping it to a 2-hour or 4-hour slot:

```ts
LoadPreference {
  earliestStartTime?: string
  latestReturnTime?: string
  minFreeMinutesPerDay?: number
  walkingSoftLimitSteps?: number
  maxSingleTransferMinutes?: number
  maxConsecutiveEarlyDays?: number
  middayRestPreference?: boolean
  coverageBias?: 'more_buffer' | 'recommended' | 'more_coverage'
}
```

Most fields are inferred or defaulted. They are not shown as a required
questionnaire.

### 5.3 Planner outputs

Every generated day exposes an estimate, always with concrete metrics:

```ts
DayLoadEstimate {
  level: 'light' | 'balanced' | 'full' | 'overloaded'
  coreItemCount: number
  activeMinutes: number
  commuteMinutes: number
  walkingStepsLow?: number
  walkingStepsHigh?: number
  earliestStart?: string
  latestEnd?: string
  freeMinutes: number
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
}
```

Step counts must be ranges, not fake precision. They combine route walking
distance with conservative POI-inside estimates. Walking is a soft preference
that selected-required anchors may exceed only with a visible explanation.

Trip-level load also detects consecutive early starts and consecutive
high-load days.

### 5.4 User interaction after generation

The timeline shows concise load summaries such as:

```text
D2 较满 · 3个主要安排 · 约1.2-1.5万步 · 通勤1小时20分
```

Opening the summary explains why. Users adjust concrete consequences instead
of re-answering a pace question.

Generating two full `轻松版 / 紧凑版` plans is explicitly deferred to the next
version. This draft does not add parallel initial plan versions.

## 6. AI Local Replanning

### 6.1 Entry and intent

The timeline may expose one functional floating `AI调整` icon button. It opens
a bottom sheet with natural-language input and contextual quick actions:

- 晚点出门
- 今天少安排一点
- 只保留已选地点
- 悠闲一些
- 减少走路
- 加一段午休
- 不要连续早起
- 换成雨天方案
- 增加附近备选
- 餐厅全部改成顺路
- 只重新安排这一天

### 6.2 Safe five-step flow

1. Infer scope: slot, segment, day, later days, or whole trip.
2. Translate the request into typed constraints and permitted operations.
3. Show `选择一个调整方向` with two short solution labels. For `少走一些`,
   the direct option may be `改为打车+公共交通`, while an alternative is
   `减少步行景点`. Do not explain detailed changes in this choice state.
4. Apply the selected typed operation sequence only after server validation and
   create a new immutable version.
5. Show a post-apply sheet titled `做了以下调整`, list the actual changes and
   deltas, and expose the global 8-second undo action.

Example post-apply explanation:

```text
我会保留博物馆，把餐厅换到沿路；咖啡店改为候选。
预计减少50分钟通勤，步行减少约3000步。其他日期不变。
```

The LLM never edits timeline JSON or database rows directly. It proposes
server-owned operations. Proposal tokens bind to `plan_rev`, expire, and are
revalidated on apply.

Suggested endpoints:

```text
POST /plan/{plan_id}/adjustments/preview
POST /plan/{plan_id}/adjustments/{proposal_id}/apply
```

Story 2.3 Validator and typed edit/fix operations are prerequisites. This
feature should be a separate follow-up story rather than silently expanding
the active Story 2.2.

## 7. Validation and Context Additions

### 7.1 Validation gaps

Add trip-level or transition-aware findings beyond the existing slot checks:

- daily walking above preference;
- consecutive early starts;
- consecutive high-load days;
- insufficient recovery/free time;
- unresolved luggage transition;
- check-in/check-out or early-storage conflict;
- intercity access, departure, arrival, or egress buffer too short;
- weather mismatch or safety risk;
- meal detour that violates an explicit along-route constraint.

Hard and soft severity depends on evidence and user constraints. Uncertain
information remains marked `待核实`.

### 7.2 Weather

- Use forecast data only inside the provider's reliable forecast horizon.
- For distant dates, show seasonal/climate guidance rather than invented daily
  weather.
- Refresh near departure and during the trip.
- Do not silently rewrite a confirmed itinerary. Offer a weather-aware preview
  and preserve the prior version.

### 7.3 Picker drill-down, intent signals, and POI information

- `全城检查` is the S4 entry state. Its `厦门全城` header is fixed, has no
  disclosure chevron, and cannot expand. The map and L2 rows summarize the
  whole destination; tapping an L2 row opens its L3 selection state.
- The design-board label for the drill-down is `选择 L3`. Only this state
  exposes the mutually exclusive `附近 | 全城` map selector, expanded by
  default with `附近` selected. `附近` focuses the current L2 and adjacent L3;
  `全城` zooms the map to the current L1.
- Every L3 row exposes two mutually exclusive icon-only controls at the right:
  a check-in-circle for `必去` and a Route symbol (two endpoints connected by a
  bent path) for `顺路`. Text labels do not repeat inside rows.
- The sticky summary uses the same icons with explicit counts:
  `已选必去 X` and `顺路去 Y`. The drill-down CTA is `返回全览`; the full-city
  CTA is `下一步`. Planning begins only from S5.
- Intent state is one shared Picker state, not local screen state. Returning
  from `选择 L3` must map both `必去` and `顺路` back into `全城检查`: every L3
  thumbnail keeps its selected icon, each L2 row reports the corresponding
  split counts/state, and the global sticky totals update immediately.
  `along_route` must never be rendered as unselected merely because the user
  returned to the overview.
- `需预约` remains evidence metadata, not an intent. Tapping any POI opens one
  generic information sheet with address, hours, rating, suggested stay,
  source attribution, and original-source access. Reservation evidence and
  `待确认` appear as an optional subsection of that sheet rather than a
  restaurant-only or reservation-only surface.

### 7.4 Restaurants

- Food is an independent timeline slot when it is planned. Meal types are
  breakfast, lunch, dinner, and snack, but the Planner does not create every
  meal mechanically. Hotel breakfast and spontaneous snacks may remain outside
  the timeline.
- Picker intent has three internal states: `required`, `along_route`, and
  `unselected`. The UI exposes two mutually exclusive icon actions: `必去` and
  `顺路`; tapping the active action again clears it.
- `required` is the new user-facing form of the existing
  `selected_required` behavior. `along_route` is a new positive candidate
  signal and must not be treated as required.
- Reservation, limited seating, fixed service, cancellation cost, and similar
  facts are evidence constraints inferred from imported content. Badges such
  as `需预约` are not a third intent choice and never imply that Nomad made a
  reservation.

Planned meal slots use the same timeline row hierarchy and neutral visual
surface as every other POI. A meal row may add a compact swap icon beside the
standard overflow control. Only evidence states such as `需预约` receive a
small badge; meals do not own a separate background color.

Planned meal slots use one of two modes:

1. `fixed_anchor`: an exact restaurant/time, normally from `required` intent or
   verified reservation evidence. It is not silently replaced.
2. `choice_pool`: an independent meal position with one primary and a target
   of two route-compatible alternatives. The stored pool may contain fewer
   than two alternatives when evidence is insufficient; the first missing row
   is rendered as `+ 添加更多`. `暂不决定` keeps the meal intent but removes the
   current primary. The UI does not expose a fixed `保留 90 分钟` promise.

Switching an alternative to primary preserves the meal window, reruns local
opening-hours/travel validation, creates a normal immutable edit version, and
uses the global undo path. Closed or unverifiable alternatives remain disabled
or marked `待核实`; the UI must not invent live queue time.

For an undecided meal, candidates refresh against the user's available trip
location in this order:

1. nearest to the current location;
2. highest rated within five kilometres;
3. supported by reliable `免排队` evidence from imported content;
4. when a result duplicates an earlier candidate, the nearest candidate to
   the next scheduled POI.

The system deduplicates POIs before filling the ordered pool. It must not claim
live queue state when it only has imported evidence. Before location permission
or a usable fix exists, it falls back to the last completed/next scheduled POI
and labels the basis honestly; foreground location refresh requires a dedicated
trip-time story rather than incidental Story 2.2 work.

`unselected` food can appear only as an explicit contextual suggestion. For a
mall, market, food street, or commercial-area POI, `附近吃什么` is attached as
a clickable child hint after that place row. It has no time, timeline node, or
duration. Its results are restricted to AMap-verified food POIs from the
current user's imported notes that share a normalized commercial-area
membership. Small snacks, coffee, and late-night food do not occupy the
timeline unless the user explicitly adds one.

The current code cannot implement that query reliably. `CanonicalPOI` has no
commercial-area field, `ResolvedPoi` exposes only L1/L2, and the AMap mapper
drops commercial-area data. `providerSnapshot` is not an indexed product
contract. Add normalized entities rather than treating administrative
`district` or an L2 route cluster as equivalent to a commercial area:

```ts
BusinessArea {
  id: string
  cityId: string
  name: string
  provider?: 'amap' | 'derived' | 'manual'
  providerAreaId?: string
}
PoiBusinessAreaMembership {
  poiId: string
  businessAreaId: string
  source: 'amap' | 'cluster' | 'manual'
  confidence: number
}
```

If no reliable membership exists, omit the attached hint instead of silently
substituting an administrative district or whole L2.

Suggested contract shape:

```ts
PlaceIntent = 'required' | 'along_route' | 'unselected'
MealSlot {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  decisionMode: 'fixed_anchor' | 'choice_pool'
  primaryPoiId?: string
  alternativePoiIds: string[] // zero to two; target is two
  decisionStatus: 'decided' | 'undecided'
}
```

### 7.5 Shopping and trip checklist

Shopping does not reuse meal slots. Its planning units are:

- `must_buy`: a product/target checklist item. It may bind to one or more
  verified stores but is not automatically a timed POI.
- `shopping_area`: a district, mall, outlet, or market that occupies a timed
  block only when the visit itself is a travel objective.
- `along_route_store`: a store candidate surfaced when its area already fits
  the route; it does not reserve time by itself.
- `return_checkpoint`: final purchase check, tax refund, pickup, baggage, or
  airport-duty-free buffer.

The itinerary pins a narrow checklist rail to the right of the horizontally
scrollable date tabs. Its collapsed state shows only a `ListChecks` icon and
count; dates may scroll and clip beneath that fixed rail. Tapping it opens the
full `行程清单`, which combines `必买目标`, `顺路门店`, and `返程前` sections.
Every entry records whether it came from an AI/evidence suggestion or a manual
note. A high-cost shopping objective or a verified airport/tax-refund
requirement may also create a normal fixed timeline block.

The full checklist ends with only `+ 添加记录`. Its sheet contains one input
and the actions `AI 提示 | 直接添加`. With empty input, `AI 提示` is disabled
and `直接添加` is emphasized. After the user enters text, `AI 提示` becomes
the primary action while direct add remains available to store the text
without interpretation. AI output must be confirmed before it joins the
checklist.

Product targets are not always POIs. Add a checklist entity rather than
forcing model/size/color/quantity into a place title:

```ts
TripChecklistItem {
  kind: 'must_buy' | 'manual_note' | 'return_checkpoint'
  title: string
  linkedPoiIds?: string[]
  source: 'evidence' | 'ai' | 'user'
  status: 'open' | 'done'
  constraint?: 'limited_stock' | 'tax_refund' | 'pickup' | 'baggage' | 'other'
}
```

### 7.6 MVP and later trip-management boundary

MVP follow-up scope may include:

- Picker `必去 / 顺路` intent signals and evidence badges;
- fixed and choice-pool meal slots with one primary plus two alternatives;
- a static itinerary checklist with AI/manual provenance;
- normalized commercial-area membership for imported, verified food POIs;
- explicit shopping-area and return-checkpoint timeline blocks;
- manual completion and the existing undo/version behavior.

These changes require dedicated Correct Course stories and must not be added to
the active Story 2.2 as incidental UI work.

Foreground location refresh, location permission/denial states, live queue or
stock signals, notification delivery, cross-device completion state, and
luggage-capacity monitoring require dedicated trip-management stories. The
automatic `返程前 48 小时` prompt is not part of the current plan and is not
represented in the accepted prototype set; reconsider it only through a
future trip-management discovery.

## 8. Linked Multi-City Trips

### 8.1 Architectural decision

Keep `Plan -> City` single-valued. Add a higher-level aggregate named `Trip`.
Do not call it `Journey`, which is already used in analytics documentation.

```text
Trip
  -> ordered TripSegment -> one single-city Plan
  -> TransferLeg between adjacent segments
  -> Stay ranges
  -> LuggageTransition at stay/transfer boundaries
  -> TripRevision binding exact Plan and Transfer versions
```

This is less invasive than making one Plan multi-city, but it is not merely UI
stitching. The aggregate owns chronology, consistency, transport, export, and
cross-segment recalculation.

### 8.2 Transfer-day ownership

Use half-open intervals:

```text
City A:    [day start, transfer.occupiedFrom)
Transfer:  [occupiedFrom, occupiedUntil)
City B:    [occupiedUntil, day end)
```

`occupiedFrom` includes access to the terminal and pre-departure buffer.
`occupiedUntil` includes arrival, luggage collection, and terminal egress.
The transport interval is owned by `Trip`, never duplicated as editable slots
inside both city Plans.

### 8.3 MVP cross-city confirmation and expansion

Canonical city mismatch remains a geographic guard, but its user-facing action
is now explicit trip expansion rather than rejection:

- The Picker may show nearby cross-city L1/L2/L3 content.
- Applying either `必去` or `顺路` to a cross-city L3, or adding one after
  planning through a manual action or AI instruction, opens the same
  confirmation contract. `顺路` is not meaningful in a city absent from the
  trip, so the city must be added before that intent can enter its candidate
  pool.
- Example title: `西街在泉州`.
- Example body: `当前是厦门行程，如选择西街将为您自动增加目标城市泉州，并设计跨城行程`.
- The route row shows `厦门 -> 泉州` and a swap action. For two segments the
  swap action reverses their order; with more segments, placement is confirmed
  on the Time page.
- The primary CTA is dynamic and follows the newly added target city, for
  example `增加泉州行程`; the secondary action is `暂不加入`.
- Accepting the confirmation creates or extends the higher-level `Trip`, binds
  the L3 to the target city segment, and returns to Time for city dates and
  transport confirmation.
- The server must still reject any request that silently attaches the L3 to
  the original city's Plan. Intercity transport is never represented as a
  `free` or ordinary POI slot.

### 8.4 Limited MVP scope

- two or three ordered city segments;
- same timezone;
- at most one direct daytime intercity transfer per day;
- every intermediate city has at least one stay night;
- service, time, and endpoints are user-confirmed before joint publication;
  AI may propose an explicit provisional transfer that remains a draft until confirmed;
- a later city starts on the previous city's departure date;
- the Time page computes one overall date range and duration, then shows each
  city range independently;
- transfer-day access, terminal buffer, transport, arrival, and egress reserve
  the occupied interval before either city Planner uses its remaining time;
- accommodation and luggage rules are reused across city boundaries, with a
  visible cross-city divider in the resulting timeline;
- system assists terminal matching, local access/egress, and buffers;
- a draft, failed, or expired transfer blocks publishing the combined trip.

Post-MVP remains responsible for A-B-A reuse behavior, overnight transport,
zero-night transit cities, more than one transfer per day, multi-leg services,
cross-timezone handling, live delays, missed connections, and automatic
rebooking.

### 8.5 Minimum entities

```ts
Trip { id, userId, title, timezone, status, tripRev, currentRevisionId }
TripSegment {
  id, tripId, sequence, planId, cityId, ownedFrom, ownedUntil,
  boundPlanRev, boundPlanVersionId
}
TransferLeg {
  id, tripId, sequence, fromSegmentId, toSegmentId,
  mode, serviceCode?, departureEndpoint, arrivalEndpoint,
  scheduledDepartureAt, scheduledArrivalAt,
  accessMinutes, preDepartureBufferMinutes,
  postArrivalBufferMinutes, egressMinutes,
  occupiedFrom, occupiedUntil, source, confidence, status, revision
}
LuggageTransition {
  id, tripId, transferLegId?, fromStayId?, toStayId?, action,
  storageEndpoint?, dropOffAt?, pickUpAt?, status
}
TripRevision {
  id, tripId, revision, segmentVersionBindings[], transferVersionBindings[]
}
```

Each cross-city `required` or `along_route` intent must bind to `segment_id`,
not only city, because a future A-B-A itinerary contains two independent A
segments.

## 9. BMAD Impact and Recommended Story Boundaries

This is a significant product correction. Update the pending 2026-08-05
`bmad-correct-course` proposal before changing implementation.

- Active Story 2.2 remains timeline editing, history, and undo. Do not absorb
  planning inputs or conversational replanning into it.
- Add a Story 2.0 follow-up for Time, accommodation nights, transport-boundary
  lookup/manual input, nightly breakfast/luggage, and the three-option pace
  review.
- Add an Epic 1 follow-up after historical Story 1.3 for production VAD/ASR,
  frame sampling, multimodal evidence, complete AMap facts and InterestProfile;
  adapter stubs are not production delivery.
- Add a planner contract migration to map the pace preset into typed soft
  constraints rather than fixed 2-hour/4-hour slots, and emit load estimates.
- Add a Picker/planner intent story for the `全城检查 -> 选择 L3` drill-down,
  `required / along_route / unselected`, the shared Route icon/count summary,
  and the generic POI information sheet with evidence-derived reservation or
  scarcity badges.
- Add a dedicated meal-slot story for fixed anchors, choice pools, one primary
  plus up to two alternatives, ordered candidate shortage behavior, local
  revalidation, and `暂不决定`.
- Add a commercial-area data story before area-attached food recall:
  normalize `BusinessArea` and POI memberships, retain source/confidence,
  populate them during AMap verification, and expose an indexed owner-scoped
  imported-food query. Add a separate trip-time location story for foreground
  permission, refresh, fallback, and privacy behavior.
- Add a separate itinerary-checklist story for must-buy targets, along-route
  stores, return checkpoints, the fixed icon rail, and confirmed AI/direct-add
  provenance. Do not include an automatic 48-hour reminder.
- Keep Story 2.3 focused on post-edit validation and typed fixes, extended with
  cross-day load and stay/luggage findings.
- Add a separate Epic 2 follow-up story for conversational local replanning and
  direction/apply/explanation behavior.
- Add dedicated Epic 2 stories for the `Trip` aggregate, ordered single-city
  segments, transfer boundaries, cross-city confirmation, and multi-city Time
  editing. This is MVP scope but must not be hidden inside the active Story 2.2.
- Keep dual initial pace versions, overnight transport, and cross-timezone
  planning deferred.

## 10. Prototype Set Required

1. Time page with one overall date row, `每天几点出门`, and flight/train
   recognition.
2. Manual transport fallback with optional service code and AMap terminal
   matching.
3. Accommodation page showing a separate `同上` button plus breakfast and
   luggage under every accommodation night.
4. Planning review with the three pace options, followed by AI adjustment
   direction selection and a separate post-apply explanation.
5. Cross-city confirmation from both Picker and post-plan editing contexts.
6. Multi-city Time page for `厦门-泉州-福州`, with shared handoff dates and
   ordered arrival/transfer/departure rows.
7. `全城检查 -> 选择 L3`, icon-only `必去 / 顺路`, shared counts, and the
   generic POI information sheet with reservation evidence.
8. Independent meal-slot states: neutral timeline rows, fixed anchor,
   one-primary-up-to-two-alternatives, location-aware undecided recall,
   candidate shortage, commercial-area child suggestions, switch, validation,
   and undo.
9. Shopping checklist with a fixed compact rail, full checklist, must-buy
   targets, along-route stores, return checkpoints, and the two-state
   `AI 提示 | 直接添加` sheet. No 48-hour reminder surface.

Generated visual references:

- [`story-2-0-time-transport-r3.png`](../implementation-artifacts/visual/story-2-0-time-transport-r3.png)
- [`story-2-0-transport-manual-entry-r1.png`](../implementation-artifacts/visual/story-2-0-transport-manual-entry-r1.png)
- [`story-2-0-accommodation-per-night-r3.png`](../implementation-artifacts/visual/story-2-0-accommodation-per-night-r3.png)
- [`story-2-0-pace-ai-adjust-r4.png`](../implementation-artifacts/visual/story-2-0-pace-ai-adjust-r4.png)
- [`story-2-0-ai-adjust-applied-r1.png`](../implementation-artifacts/visual/story-2-0-ai-adjust-applied-r1.png)
- [`story-2-0-cross-city-triggers-r2.png`](../implementation-artifacts/visual/story-2-0-cross-city-triggers-r2.png)
- [`story-2-0-multicity-time-r1.png`](../implementation-artifacts/visual/story-2-0-multicity-time-r1.png)
- [`story-2-0-picker-overview-l3-r2.png`](../implementation-artifacts/visual/story-2-0-picker-overview-l3-r2.png)
- [`story-2-1-meal-slot-alternatives-r3.png`](../implementation-artifacts/visual/story-2-1-meal-slot-alternatives-r3.png)
- [`story-2-1-meal-flex-recall-r2.png`](../implementation-artifacts/visual/story-2-1-meal-flex-recall-r2.png)
- [`story-2-1-area-food-suggestions-r1.png`](../implementation-artifacts/visual/story-2-1-area-food-suggestions-r1.png)
- [`story-2-1-shopping-checklist-r2.png`](../implementation-artifacts/visual/story-2-1-shopping-checklist-r2.png)
- [`story-2-1-shopping-add-record-r1.png`](../implementation-artifacts/visual/story-2-1-shopping-add-record-r1.png)
