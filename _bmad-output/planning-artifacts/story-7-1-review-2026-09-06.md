---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.1'
status: approved-and-appended
splitApproved: true
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-06
---

# Story 7.1 Review: 最近行程与继续使用

The user approved this planning contract and its visual references on 2026-09-06, including the
unfinished-change annotation. The 22 GWT scenarios are appended to `epics.md`; this review record
is not a ready-for-dev implementation story. Business implementation and sprint history stay paused.

## Story

As a 旅行者,
I want 从首页找到已有行程，并继续上次的填写、规划或查看,
So that 关闭页面或中断后仍能接着使用，不用重复输入或重新生成计划。

**Requirements:** FR40 (recent trips only), FR49 (existing navigation reuse),
FR37 (existing ResultSheet consumption); NFR2, NFR3, NFR8, NFR20;
AR1-AR6, AR9, AR12, AR14-AR15, AR17-AR20;
UX-DR1-UX-DR4, UX-DR18, UX-DR29-UX-DR30, UX-DR32-UX-DR33.

Scope amendment (2026-09-06): Story 7.2 is explicitly deferred out of MVP, so AR16 is not a
current readiness gate. This story neither consumes check-in nor invents its persistence schema;
its approved 22 acceptance scenarios remain unchanged.

## Approved Semantic Resolution

- `已生成` means a currently published, readable itinerary exists. It does not mean the actual
  journey ended, every POI was visited, details are complete or validation is clean.
- With no published itinerary, display the actual saved-input/job state: `草稿`, `规划中`, or
  `生成失败`. These are presentation states derived from existing domain facts, not a replacement
  PlanningJob state machine. An input still in its debounced local composer is not a saved trip.
- A published itinerary and a real persisted change draft/job can coexist for changes that enter
  an existing replan flow, such as adding a city or changing intercity dates/transport in Story 4.4.
  Keep the current itinerary usable. Only expose a subordinate recovery entry if an owner-scoped,
  still-actionable saved change draft or task actually exists; do not infer one from a page visit,
  a closed transient Sheet, a failed ordinary edit request or the fact that a trip was edited.
- A saved half-filled change is `有未完成的修改` with `继续填写`, not failure. A real current
  queued/running replan task uses `修改规划中` with `查看进度`. Only a durable terminal failure of
  the relevant current task uses `本次修改生成失败` with `查看原因`. Client disconnection, user
  departure, task cancellation or an older superseded failed attempt are not evidence of failure
  of the current change. These labels describe a subordinate change, not the published trip state.
- `最近` orders by the latest owner-initiated open or successfully saved user change; creation is
  the fallback for an unopened item. Worker heartbeat, SSE polling, detail generation and export
  completion do not continuously reorder the list. Use server-authoritative time and stable
  identity as the tie-breaker; pagination must not duplicate entries within a browsing snapshot.
- A standalone Plan or a linked Trip is one list item. A draft that becomes a published plan, or a
  Plan that becomes part of a Trip, must resolve to its stable user-visible aggregate instead of
  multiplying entries. Other independently created trips to the same city remain separate.

The former PRD paragraph said `到达 result_sheet ... 已完成`, whereas FR37 limited what
ResultSheet availability proves. Approval resolves that conflict in active source docs and BMAD
mirrors; dated changelog/reports remain historical, not current lifecycle rules.

### Confirmed Annotation: Persisted Changes and Failure (2026-09-06)

The user clarified this specific boundary during Story 7.1 review: adding cities or changing
intercity dates/transport may require a saved draft and replan while the current itinerary stays
usable. A subordinate entry requires a real saved draft/task. Leaving halfway through input must
say `有未完成的修改`, never `失败`. This clarification is confirmed input to this draft, not
approval of the entire Story 7.1 at that earlier checkpoint. The subsequent explicit Story 7.1
confirmation now approves the combined contract.

## Approved Acceptance Criteria

### 1. Home entry and existing input

**Given** 用户已登录并进入首页
**When** 首页读取最近行程
**Then** 展示最近一趟行程的简要入口，并通过 `全部` 和现有菜单进入同一最近行程列表
**And** 保留原有 `计划 | 灵感`、HomeImportDock 长输入框和 `+ / send`；读取失败不阻塞输入

### 2. Complete owner list

**Given** 当前 owner 有已保存的规划输入、独立 Plan 或联程 Trip
**When** 获取首页摘要或分页列表
**Then** 仅返回该 owner 的真实记录，并按上述稳定规则排序，支持继续加载
**And** 列表展示城市或城市链、已知日期/天数、真实状态和对应动作；未知日期不伪造
**And** 未提交的输入框内容和单纯导入记录不自动变成行程；图片缺失使用稳定占位，不阻止打开

### 3. Aggregate identity

**Given** 一趟行程包含多个城市或宿主日的一日游 child Plan
**When** 列出或恢复该行程
**Then** 整趟联程只占一项，城市子 Plan 和一日游不重复生成独立卡片
**And** 城市链支持长名称及多城市，打开后可读取完整顺序；按稳定 id 而不是城市名定位
**And** 原独立计划并入联程后的旧入口需鉴权并解析到所属当前联程，不打开脱离 Trip 的旧子版本

### 4. Readable is not completed travel

**Given** 服务端已有当前可阅读的 PlanRevision 或完整 TripRevision
**When** 列表显示该行程
**Then** 使用 `已生成`，不因进入行程单、导出或日期过去而标记旅行 `已完成`
**And** 细节未完善或已有校验冲突不移除该入口；具体状态仍由现有 S7/S10 负责

### 5. Resume saved input

**Given** 行程尚未发布且已保存 S2-S5 输入
**When** 用户选择 `继续填写`
**Then** 回到最近有效的填写阶段，并恢复已保存的时间、住宿、行李、地点意图与节奏数据
**And** 缺失前置条件时回到首个需处理阶段，不跳过既有确认规则；酒店允许留空

### 6. Resume running planning

**Given** 该行程的当前 PlanningJob 或 TripPlanningJob 仍在运行
**When** 用户选择 `查看进度` 或重启后恢复
**Then** 打开原有 S6/S7 shell 并重连同一持久任务的真实阶段和 cursor
**And** 打开页面不新建任务、不重复扣费，也不把未原子发布的城市结果当成完整联程

### 7. Recover first-generation failure

**Given** 首次规划终止失败且不存在已发布行程
**When** 用户选择 `查看原因`
**Then** 进入既有失败恢复界面，保留输入并显示该错误实际支持的重试、修改输入或恢复动作
**And** 仅用户明确选择重试才调用已有幂等/fenced 重试流程；不伪造可阅读行程
**And** 原型的 `重试生成` 仅代表可重试暂时失败，不为额度、鉴权或结构错误统一提供盲重试

### 8a. Only real saved changes expose recovery

**Given** 已有可用行程，用户新增城市、修改跨城日期或交通等进入既有重新编排流程
**When** 渲染最近行程入口
**Then** 主入口继续打开已发布行程，只有该 owner 确实存在关联本行程、尚待处理的持久变更草稿或任务时，才在同一项内提供继续处理入口
**And** 不覆盖当前行程、不重复生成卡片，也不静默应用草稿；仅打开页面、关闭未保存弹窗或普通编辑请求失败不产生此入口

### 8b. Leaving input unfinished is not failure

**Given** 已有行程的变更草稿已保存，但用户填写到一半离开，尚未提交当前草稿的重新编排任务
**When** 再次查看最近行程
**Then** 同一行程项显示中性的 `有未完成的修改` 和 `继续填写`，恢复真实保存的输入阶段
**And** 不显示失败、错误图标或重试生成；原行程仍可独立打开，离开页面不会自动启动编排

### 8c. A running change uses actual job progress

**Given** 当前已保存的变更已提交，关联的持久重新编排任务处于排队或运行中
**When** 显示或打开附属入口
**Then** 显示 `修改规划中` 和 `查看进度`，复用真实任务状态与重连流程
**And** 用户关闭页面、断线或进度读取暂时失败不等于任务失败；无法确认新状态时提示连接/刷新问题，不猜测终态

### 8d. Failure requires the current task's terminal result

**Given** 当前变更版本关联的有效任务已真实进入终止失败状态
**When** 显示最近行程的附属入口
**Then** 才显示 `本次修改生成失败` 和 `查看原因`，提供实际错误允许的恢复动作
**And** 主入口仍打开原行程；失败需匹配当前 draft/input revision 与有效 job/attempt，历史或被新草稿取代的失败不覆盖当前状态

### 8e. Clear obsolete change entries

**Given** 当前变更已发布、明确放弃，或失败后用户继续修改并保存了新的输入版本
**When** 刷新最近行程
**Then** 发布后主入口指向当前新行程；放弃且无其他待处理草稿/任务时移除附属入口；新输入未重新提交时显示 `有未完成的修改`
**And** 取消任务不自动称为失败；若取消后仍保留可继续的草稿则恢复未完成修改入口，否则不展示待处理入口

### 9. Restore the current view

**Given** 用户上次在有效的 S7 编辑页或 S10 行程单离开
**When** 选择对应 `继续编辑` 或 `继续查看`
**Then** 恢复该视图、所在城市或一日游 scope、日期和可用滚动锚点
**And** 无有效偏好时回到现有 S7 默认视图；不强制所有行程进入同一种新页面
**And** 不恢复瞬时弹窗、未确认的 AI 建议或过期的撤销倒计时为已生效状态

### 10. Existing detail/export recovery

**Given** 用户在 S9 或 S11 的既有持久任务中离开
**When** 从最近行程恢复
**Then** 复用原任务入口和现有版本/过期检查，或安全返回其 S10 父视图
**And** 不重新设计 fill/export 状态机，不自动重新完善或重新导出

### 11. Authoritative current revision

**Given** 本地保存的视图或 revision 提示已旧
**When** 打开行程
**Then** 先按 owner 与稳定 aggregate id 查询服务端当前版本，并以该版本恢复安全位置
**And** 联程读取一个原子 TripRevision 的完整成员集合，不拼接各子 Plan 的不同 current 版本
**And** 原日期、地点或 scope 已消失时回到有效父 scope/日期；不能按同名地点猜测身份

### 12. Durable minimal resume context

**Given** 用户离开已成功打开的行程页面
**When** 保存浏览位置并关闭/重启客户端
**Then** 最小恢复信息按 owner 与稳定行程标识持久化，和 Plan/TripRevision 分开保存
**And** 保存允许的 view、scope、日期、稳定滚动锚点与版本提示，不保存任意跳转 URL、原始输入、来源链接或定位轨迹
**And** 同一浏览会话的迟到写入不可覆盖较新的位置；位置保存失败不阻塞查看或修改行程

### 13. Authentication and inaccessible targets

**Given** 会话失效、owner 切换、目标删除或目标不可访问
**When** 加载列表、继续入口、深链或恢复位置
**Then** 重新鉴权并只恢复同 owner 的有效目标；不存在与越权使用不泄露对方信息的统一不可用结果
**And** 退出/切换账号清除当前账号的私有缓存、缩略图与挂起响应；无效入口提供返回列表或首页

### 14. Empty, loading and network failure

**Given** 列表正在加载、真实为空或请求失败
**When** 展示对应状态
**Then** 分别展示稳定占位、无行程空态或可重试错误，不把加载失败当作空列表
**And** 同 owner 已有可用的列表摘要可保留并提示刷新失败，但不把缓存当成已验证当前内容
**And** 无法联网校验时不承诺离线编辑/后台提交；重试和返回入口保持可用

### 15. Safe navigation side effects

**Given** 用户浏览列表或重新打开行程
**When** recent/resume metadata 被更新
**Then** 只更新浏览元数据，不创建 PlanRevision/TripRevision、打卡、用户偏好学习或新的 AI 操作
**And** 原有冲突、酒店/行李修改规则和导出门禁继续由对应前序 Story 决定

### 16. Accessible mobile behavior

**Given** 长城市名、多城市、动态字体、键盘或 reduced-motion 场景
**When** 浏览首页/列表并返回
**Then** 文本和动作不重叠，图标有名称，状态不只靠颜色，触控目标至少 44pt
**And** 记录列表滚动位置并正确返回焦点；弱网占位及短转场不导致 Dock 或列表跳动

### 17. Brownfield vertical delivery

**Given** 现有 Home、规划输入/任务、Plan/Trip 与 ResultSheet 已具备各自能力
**When** 实现本 Story
**Then** 仅补聚合查询、导航恢复及必要的 owner-scoped 浏览元数据/API/迁移
**And** 使用 OpenAPI SSOT 生成类型，不依赖 7.2 打卡、7.3 设置重做或另一个数据库前置 Story

### 18. Verification

**Given** 本 Story 实现准备验收
**When** 执行自动化和浏览器核验
**Then** 覆盖单城/多城/一日游聚合、草稿发布不重复、相同城市不同旅行、分页、任务重连、首次失败、已有行程变更草稿/任务真实失败、过期 scope、账号隔离与真实空/失败状态
**And** 专项覆盖新增城市/跨城日期或交通改动后半途离开、无持久草稿不展示入口、排队/断线不误报失败、旧失败不覆盖新输入、取消/放弃和成功发布后的入口清理；普通编辑错误不能制造变更草稿
**And** 验证重开不增加规划调用/扣费/行程版本，位置持久化经服务和浏览器重启仍可恢复
**And** 通过契约生成、相关单元/route/repository/mobile 测试、真实 PostgreSQL、桌面/移动截图与 workspace build；原型不算实现证据

## Visual Review

- `../implementation-artifacts/visual/story-7-1-recent-trips-resume-r1.png`:
  A 首页继续，B 单城/联程/草稿/运行/失败列表，C 恢复上次 S10 的 D2。
- `../implementation-artifacts/visual/story-7-1-recent-trips-recovery-r1.png`:
  A 无行程不阻塞输入，B 无缓存的加载失败，C 首次可重试失败，D 已有行程的更新失败。
- Recovery R1 的 D 只表示真实持久变更任务已失败，不能复用于半途离开输入的场景。
  半途离开在同一附属行使用中性的 `有未完成的修改 / 继续填写`；运行中使用
  `修改规划中 / 查看进度`；真实失败的精确文案以 `本次修改生成失败 / 查看原因` 为准。
  R1 位图未重绘，这两种非失败变体目前由文字合同定义，不能声称已有独立高保真帧。
- Both images are approved references, subordinate to this text. Generated Chinese glyphs are illustrative; exact labels
  follow this text (`草稿 · 住宿安排`, `规划中 · 正在校验`). C on the main board is one S10
  example, not a rule to always redirect to S10 or to hide the S7 editing route.
- Existing component references remain authoritative for screens not redrawn: Home Import Queue
  R4, S2-S5 inputs, Planning Transition R1 (behavior-partial), and ResultSheet Overall Check R1.
  Loading skeletons, long-list pagination, auth/unavailable-target screens, linked active-scope
  restoration and same-owner stale-list refresh must receive implementation screenshot coverage;
  this review does not claim every edge state has a dedicated high-fidelity frame.
- Prompts are stored beside each image; both boards use the built-in image generation tool.

## Approval Record

- Story, lifecycle language, annotation and referenced visuals approved on 2026-09-06.
- Active PRD/UX and minimal recent/resume architecture synchronized; 22 GWT scenarios appended
  to `epics.md`, with no historical execution-status change.
- Subsequent scope decision: 7.2 deferred; next is Story 7.3 definition. See
  `check-in-scope-decision-2026-09-06.md`; the approved recent/resume contract is unchanged.
- Implementation Readiness/Sprint Planning remain after all epics and final validation.

## Out of Scope

Check-in/uncheck, automatic travel completion, trip archive/rename/delete controls, background
location, reminder delivery, automatic memories/preferences, 48-hour shopping prompts, offline
mutation queues, arbitrary-version browsing and rebuilding any earlier job/revision subsystem.

## Evidence

- `docs/prd.md`: FR37, FR40, FR49 and the older recent-trip completion paragraph.
- `docs/front-end-spec.md` / `docs/ux/mobile-ia.md`: Home menu/recent entry, S0-S11 navigation.
- `docs/ux/prototype-coverage.md`: existing recent-trip gap and the proposed boards.
- `epic-7-story-breakdown-proposal-2026-09-06.md`: approved six-story scope and architecture gates.
- `epics.md`: earlier input, job, Trip, edit, ResultSheet and export contracts reused here.
- `apps/mobile/src/home/HomeScreen.tsx`, `apps/server/src/routes/home.ts` and Prisma:
  existing foundations are not proof of a complete owner recent-trip/resume implementation.
