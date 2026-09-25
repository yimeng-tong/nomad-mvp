---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.2'
status: deferred-out-of-mvp
storyApproved: false
visualApproved: false
architectureApproved: false
appendedToEpics: false
deferralApproved: true
deferredDate: 2026-09-06
decisionRecord: check-in-scope-decision-2026-09-06.md
---

# Story 7.2 Review: 行程打卡与取消打卡

**DEFERRED OUT OF MVP (user-confirmed 2026-09-06).** The user rejected per-item maintenance for
this release. Do not implement or append the manual check-in story, its 21 GWT scenarios, visit
schema or controls. Both boards are historical exploration, not current visual authority. AR16
is no longer a current-MVP gate; this is scope exclusion, not implementation completion.

Future direction is photo/geolocation-based automatic marking plus album video/nine-grid/AI
beautification output, under FR40.1 and `check-in-scope-decision-2026-09-06.md`. It needs a new
design and does not automatically adopt this manual proposal. The rest of this file is retained
unchanged as historical review evidence. The next current Epic 7 story to define is 7.3.

## Story

As a 旅行者,
I want 在行程单标记某次安排已经去过，并能取消误操作,
So that 旅行中可以接着查看未到访的安排，同时不会把另一天或另一个地点错误标成已完成。

**Requirements:** FR40 (check-in), FR37 (ResultSheet status overlay), FR49 (navigation reuse),
FR36.2 (optional matching completed-visit facts only); NFR3, NFR8, NFR18, NFR20;
AR1-AR5, AR9, AR12, AR14-AR20; UX-DR2-UX-DR3, UX-DR29-UX-DR30, UX-DR32-UX-DR33.

## Product Decisions for This Review

1. S10 compact POI rows gain a separate right-side check control, while the row body still opens
   its content page. The content page exposes the same status beside the visit date/time. The
   existing editor keeps its editing actions; no second status bar is added to S7.
2. Use `打卡` and `已打卡`; selecting `已打卡` directly cancels this mark. No confirmation modal,
   full-screen celebration, global undo or automatic itinerary completion is needed.
3. Eligible items are concrete planned activity/nightlife POIs and a MealSlot's chosen primary
   restaurant, including an explicitly placed manual target with a landmark proxy. The proxy is
   not the visit target. Free time, transport, hotel/footer, undecided meals without a primary,
   candidates and area-food hints do not expose check-in. FR40's older "every slot" wording must
   be narrowed explicitly on approval, not silently interpreted during implementation.
4. A check marks this visit occurrence, not its CanonicalPOI globally, required/along-route intent,
   a checklist item or a real-world hotel check-in. No location permission or reservation proof is
   required; this is the user's assertion, not GPS verification. The marking time is not an inferred
   actual arrival time. Planned dates in the past/future are not used to auto-check/uncheck.
5. State belongs to a stable visit, independent of immutable schedule revisions. Retaining state
   follows the proposed matrix below; ordinary retiming must not erase it and newly arranged visits
   must not inherit it by matching a name or coordinates.

| Change to the current itinerary | Proposed check-in outcome |
| --- | --- |
| Same visit, target, Plan scope and local calendar date; retime or reorder | Keep the same visit identity and current mark |
| Only a displayed D index changes, actual local date unchanged | Keep the mark; D index is not identity |
| Move to another local date | New occurrence, unchecked; original record is not falsely applied to the new date |
| Replace a POI or a meal's primary restaurant | New occurrence, unchecked, even if the old target was checked |
| Manually replace back to a former POI | Still a new occurrence; only an explicit valid undo may restore old identity |
| Delete an arrangement | Hide its check-in control with the removed binding; keep the record for legitimate undo/retention |
| Undo restores the exact original visit | Resolve its current independent visit state, not a copied stale boolean from the edit snapshot |
| Same POI twice in one day, on different days, or in different Plans/Trips | Separate visit identities and marks |
| Replan creates a new visit without verified continuity | Unchecked; never inherit by matching place name/POI id alone |
| Replan explicitly preserves an existing visit with unchanged target/date/Plan scope | Keep only server-verified lineage; unrelated unchanged linked Plans also retain state |

Deletion of an arrangement must not erase the visit record prematurely. The recorded state remains
subject to account deletion/retention policy and is not a user-facing historic-visit library. A moved
or replaced visit can recover its original identity only through the existing valid undo command.

## AR16 Architecture Proposal

### Current Evidence and Migration Boundary

- OpenAPI has a placeholder `PATCH /plan/slots/{slot_id}/status` whose body does not require
  `checked`, and a response containing only slot_id/checked. It cannot by itself prove idempotent
  owner/revision-safe check-in. Searches found no corresponding status route or mobile workflow.
- The historical `docs/architecture/architecture.md` lists a slot boolean/toggle, but the v0.6
  index explicitly makes that file historical. The current `data-models.md` does not yet define
  VisitOccurrence/VisitState; check-in must not be inferred from that old boolean.
- This is one vertical user-value slice: necessary identity, persistence, API, migration and UI
  ship together. Do not add a database-only prerequisite, redesign all slot editing, or wait for
  Settings/account stories. Shared publication hooks own the binding rule across existing editors.

### Proposed Persistence

- `VisitOccurrence(id, ownerId, planId, targetKind=canonical_poi|manual_candidate,
  targetId, kind, localDate, createdAt)` identifies one intended visit. `id` is stable across
  allowed same-date changes, not the transient revision-row id. It is never just a unique POI/date
  pair, because one POI may be visited twice in the same day. Local date is a real calendar date,
  not a Dn index, and target identity never substitutes a landmark for a manual destination.
- `SlotVisitBinding(slotRevisionId, visitOccurrenceId)` attaches an immutable current slot or meal
  primary to the visit. This may be a field on the existing revision row instead of a new table.
  Each eligible current slot binds exactly one visit; a single visit cannot bind two distinct
  current occurrences. Historical revisions may reference the same stable visit.
- `VisitState(ownerId, visitOccurrenceId, checked, stateVersion, checkedAt?, updatedAt)` is mutable
  independently from PlanRevision/TripRevision. Unique owner+visit; a successful authorized read
  with no record means unchecked/version zero. A failed read means unavailable, never unchecked.
  `checkedAt` is server time of the user's successful mark, not inferred physical arrival.
- An idempotent command receipt binds owner+operation id, requested checked value, expected visit
  state/context versions, payload hash and result. Reuse existing command infrastructure only if
  it does not publish schedule versions or enter plan-global undo. State and receipt commit in
  one transaction; same operation/payload returns its result, different payload is rejected.
- Initial migration binds applicable currently published slots as unchecked unless an existing
  authenticated persisted visit record can actually be proven. Never infer marks from dates,
  prior exports, a POI's popularity or legacy mock values. Historical snapshots remain immutable.

### Proposed API and Concurrency

The final endpoint naming is decided through OpenAPI-first implementation, preserving compatibility
where useful, but the functional contract is explicit:

- Authorized current ResultSheet/visit-state reads include eligibility, stable visit id, actual
  checked value and state version for relevant current bindings. Support an aggregate/date batch
  read for a standalone Plan or a complete current Trip; check each host/child Plan membership.
- Writes require explicit `checked: true|false`, `operation_id`, visit id, expected state version,
  expected PlanRevision and expected TripRevision when linked. An omitted value must not mean
  blind toggle. Scope, target and lineage come from current server membership, not caller labels.
- Lock/recheck the relevant current Plan/Trip pointer and visit state atomically against concurrent
  edit/publication. A replaced/deleted/moved target or stale state returns typed conflict with a
  safe refresh path. Never mark a new POI through a recycled or guessed old slot id.
- Exact idempotent replay resolves the authenticated prior receipt without applying it again;
  a refreshed UI still verifies that result's visit remains bound to the current target before
  painting success. A conflicting new action requires an explicit fresh user request.
- Only visit-state/receipt metadata changes. No PlanRevision, TripRevision, EditEvent, UndoEntry,
  Planner/Filler run, changed export snapshot, quota deduction or validation-state reset occurs.
- Network timeout after submission is ambiguous: query the operation/current state first. Show
  `正在确认` while unresolved; do not claim success or definite failure, and never reverse-toggle
  blindly. Explicit retry of the same intent reuses the operation id/payload.
- Offline read/write limitations remain truthful; no background offline-write queue is introduced.
  Authentication and unavailable-target responses do not disclose another owner's data.

### Linked Trips, Meals and Privacy

- A Trip's check-in state is an overlay on its exact published binding set. Main-segment and
  DayExcursion visits remain independently owned by their concrete single-city Plans; same city
  labels do not merge them. A failed/provisional change draft has no published visit controls.
- Story 6.2 may read matching, explicitly checked visits for its existing same-scope/date fallback.
  Do not replace foreground positioning with a check-in, infer a current location, call AMap just
  because a mark changed or learn hidden preferences. Without a valid matching mark, the existing
  preceding-planned-POI fallback still works. Unchecking/replacing invalidates that optional basis.
- Logs/analytics may record redacted operation type and outcome, not private POI paths, protected
  sources, location trails or arbitrary visit history. Account export/deletion later must include/
  clean the owned visit records under their separate approved scope; no public history is added.

## Proposed Acceptance Criteria

### 1. Compact entry and shared detail status

**Given** owner 打开已发布行程的 S10 总览或某个适用槽位的内容页
**When** 当前到访状态读取成功
**Then** 总览在对应 POI 行右侧提供独立打卡控件，正文仍进入内容页；内容页使用同一状态源
**And** 不展开原本折叠的细节，不增加编辑页状态栏，不让点击打卡冒泡成打开地点

### 2. Eligible visit types

**Given** 当前行程包含景点、已选主餐厅、自由时间、交通、酒店、未决定餐饮及候选
**When** 生成控件
**Then** 仅具体已排 POI 和主餐厅可打卡，手动代理地点标记用户的目标而非代理地标
**And** 无主餐厅/自由时间/交通/酒店/候选/商圈附加美食提示不出现该控件，也不暗示预订或入住已完成

### 3. Mark and unmark

**Given** 用户正在查看一项已授权、可操作的到访
**When** 点击 `打卡` 或再次点击 `已打卡`
**Then** 分别显式提交 checked=true 或 false，成功后两处入口一致显示状态
**And** 取消不需要确认弹窗，不进入全计划 `撤销 8`，不划掉或隐藏地点内容

### 4. Truthful saving and failure

**Given** 打卡或取消请求正在保存、已明确拒绝或最终结果不明
**When** UI 更新
**Then** 仅当前控件显示保存/确认中的状态并防止重复提交，其他查看操作保持可用
**And** 明确未提交失败保留最后确认状态和重试；结果不明先查操作结果，不猜成功、不盲目反转

### 5. Missing versus unavailable state

**Given** 当前 visit 没有记录或状态读取失败
**When** 打开控件
**Then** 只有成功鉴权的查询确认无记录时才视为未打卡；读取失败显示不可用/重试
**And** 不把错误、跨 owner 缺失、过期缓存或正在加载伪装为 unchecked 并允许盲写

### 6. Durable restart and idempotency

**Given** 相同打卡命令重复送达或客户端/服务在响应前重启
**When** 恢复并查询或重试同一操作
**Then** 以 owner+operation id 与 payload hash 返回同一已提交结果，状态不被重复翻转
**And** 完成后的读取在真实数据库重启后仍一致；新一次用户取消是不同操作，不复用旧 payload

### 7. Concurrent edit and stale state

**Given** 另一有效操作已改变到访状态、当前地点、日期或版本绑定
**When** 旧页面提交打卡
**Then** 原子版本/成员校验拒绝过期写入并提供刷新路径，不覆盖新状态或标记替换后的地点
**And** 同一用户多个页面也受此约束；旧响应不能污染当前页面的新 visit

### 8. Keep the same visit through same-day edits

**Given** 同一 Plan scope、同一真实日期和同一地点的原到访仍被明确保留
**When** 只修改开始/结束时间、同日顺序或显示 Dn 序号
**Then** 保留其稳定 visit id 和当前打卡状态
**And** 判定真实日期而非标签或新 revision-row UUID；不把普通调时误认为新到访

### 9. Moving to another date

**Given** 一项到访被移到另一真实日期
**When** 新安排发布
**Then** 建立新的未打卡到访；不把原日期的标记当作新日期已经去过
**And** 原记录保留以支持合法撤销和数据保留规则，不依赖全局 POI 打卡位

### 10. Replacing place or meal primary

**Given** 已打卡的地点或主餐厅被替换
**When** 新版本发布
**Then** 新目标从未打卡开始，候选主备切换也遵守同一规则
**And** 手动换回原 POI 仍是新到访；不可仅凭 POI id、名字或相同代理地标恢复旧标记

### 11. Delete and legitimate undo

**Given** 某到访被删除，之后合法的排期撤销恢复了原始到访身份
**When** 当前行程重新绑定该 visit
**Then** 恢复其当前独立 VisitState，而不是将编辑快照里的旧 checked 值覆盖回来
**And** 删除期间不展示它；状态记录不被提前清除，撤销自身不额外改变打卡记录

### 12. Repeated POIs and scopes

**Given** 同一景点在同日出现两次、不同日期、其他独立计划或一日游 child Plan 中出现
**When** 用户标记其中一次
**Then** 其他到访不联动；按具体 Plan/visit 身份读取，联程与一日游仍展示在现有宿主时间轴中
**And** 不因重复城市名、相同坐标或 CanonicalPOI id 把多个到访合并

### 13. Replanning and atomic publication

**Given** 用户通过既有流程重新编排或发布联程
**When** 系统建立新版本的到访绑定
**Then** 只有服务器可验证原样保留的同目标/日期/scope 到访及未受影响 Plan 继承状态，其余新到访未打卡
**And** 不能依赖模型声明或模糊同名匹配继承；发布失败不改变当前绑定与状态展示

### 14. No schedule or workflow mutation

**Given** 打卡或取消成功
**When** 记录副作用
**Then** 只更新到访状态和命令回执，不改 Plan/TripRevision、时间/路线、Picker 意图、清单完成或冲突状态
**And** 不触发 AI、扣费、重新导出、图像过期提示、全局撤销或自动旅行完成

### 15. User assertion without tracking

**Given** 用户未授权定位，或计划日期在过去/未来
**When** 主动标记适用到访
**Then** 允许保存其明确声明且不请求 GPS，不把点击时刻等同实际到达时间
**And** 不根据时钟自动打卡/取消，不启动后台定位、轨迹记录、记忆学习或 48 小时提醒

### 16. Optional meal-recall reuse

**Given** Story 6.2 正在执行已有的餐饮召回且需要计划上下文兜底
**When** 读取同 owner、当前 scope/date 且仍有效的打卡记录
**Then** 可消费明确打卡的到访，但不等同实时位置；没有匹配记录仍用既有计划地点兜底
**And** 取消、替换或移日使不再匹配的依据失效；打卡本身不请求定位、高德或自动餐厅推荐

### 17. Ownership and account changes

**Given** 写入、读取、操作回执或深链来自失效会话、另一 owner 或不属于当前 aggregate 的 visit
**When** 服务端校验
**Then** 拒绝且不泄露他人内容；账号切换清除私有缓存和挂起响应，重新鉴权后只恢复同 owner
**And** 只读旧快照不能借槽位 ID 绕过当前成员与版本检查，日志不记录精确位置/私有来源历史

### 18. Existing itinerary access stays available

**Given** 行程存在细节不完整、硬冲突或打卡服务暂时不可用
**When** 查看行程单
**Then** 基础行程仍可读，打卡不改变原 Validator/导出门禁；不可用控件不阻塞其余页面
**And** 不新增离线写入队列；网络恢复后先读真实状态，不能把未送达操作报告成功

### 19. Migration and contracts

**Given** 开始实现 Story 7.2
**When** 补充现有 OpenAPI/Prisma/共享发布流程与 mobile UI
**Then** 显式 checked 必填，加入 owner/idempotency/state/context 版本和 typed stale/unavailable 合同，生成类型而非手改
**And** 迁移仅为当前适用到访建立必要绑定，不从历史模拟值/过去日期推断已打卡；此纵向切片独立可用

### 20. Accessibility and state consistency

**Given** 触控、键盘、读屏、动态字体或 reduced-motion 场景
**When** 操作总览行和内容页打卡
**Then** 至少 44pt 独立目标，明确动作/已选状态/取消名称，状态不只靠颜色，避免误触行导航
**And** 保存/失败不覆盖相邻文案；返回恢复日期和滚动位置，已打卡内容保持正常可读

### 21. Verification gate

**Given** 本 Story 准备验收
**When** 执行契约、纯逻辑、真实 PostgreSQL/repository/route/mobile 和浏览器测试
**Then** 覆盖打卡/取消/重放/断线后查询、双页面冲突、同日调时/移日/替换/删除撤销、重复到访、多城一日游、replan 保留与重建、权限与迁移
**And** 证明无 AI/扣费/排期版本/撤销副作用，标记不会重置校验或改变导出快照；验证错误/不可用/长文字/触控和手机桌面截图，并通过 workspace build

## Visual Review

- `../implementation-artifacts/visual/story-7-2-check-in-core-r1.png`: A 总览独立入口，
  B 地点内容页未打卡，C 已保存并可再次点击取消。控件以文字/图标同时表达状态。
- `../implementation-artifacts/visual/story-7-2-check-in-recovery-identity-r1.png`: A 保存中，
  B 明确未提交的失败与重试，C 替换地点后未打卡，D 另一日期同一地点未打卡。
- B 的失败画面不代表响应超时后的未知提交结果；未知状态先查回执并使用 `正在确认`。
  确认中、读取失败、取消请求失败与关联成员变化需在实现截图中进一步覆盖。
- Existing S10 overall-check/detail controls remain governed by Story 5.2 even where the mockup
  reduces them to compact labels. No new booking/check-in semantics are added to the hotel/footer.
  S10 row checks do not replace its independent validation check icons or erase sources/details.
- Both boards are proposed and use built-in image generation. Prompts are beside the images.
  The same-day/new-date/replacement rule is a product decision for this review, not pre-approved.

## Historical Next Gate (Superseded by Deferral)

The previous proposal would have promoted an approved manual check-in contract into source docs
and epics. The user instead deferred it. Do not run that promotion: no 7.2 execution contract or
AR16 implementation is required for MVP, and no old OpenAPI/code is changed by this decision.

## Out of Scope

GPS verified presence, photo proof, automatic check-in, hotel arrival/booking confirmation,
checklist completion, public footprints, progress-based trip completion, offline background writes,
automatic memory/preferences, reminders, sharing check-ins and changing an existing export image.
