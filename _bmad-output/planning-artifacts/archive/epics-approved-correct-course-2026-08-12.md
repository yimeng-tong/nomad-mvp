---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux.md
  - _bmad-output/planning-artifacts/supporting-tech-specs.md
lastUpdated: 2026-08-12
changeAuthority: approved-correct-course-2026-08-12
---

# nomad-mvp - Epic Breakdown

## Overview

本文档是 2026-08-12 获批 Correct Course 后的权威 Epic/Story 队列。它以
S0-S11 为用户流程，将“部分骨架 + Quick/HQ 双版本 + 后置 AI 排空槽”替换为
“一次可见 AI 完整初始规划 + 编辑后增量校验 + 后续仅完善执行细节”。

已完成的 Story 1.1-1.5、2.0、2.1 保留为历史交付基线，不通过改写历史宣称
新需求已经实现。新语义由 1.6-1.8、2.2 修正以及 2.3-2.13 承接。待
Implementation Readiness 通过后，Sprint Planning 必须用本队列重建
`sprint-status.yaml`；在此之前旧 sprint 文件仍是历史执行状态，不是新范围证明。

## Requirements Inventory

### Functional Requirement Groups

- **账号、合规与平台 AI：** FR1、FR12-FR16、FR25、FR38、FR45。
- **首页、输入、导入与灵感库：** FR2-FR6、FR17-FR20、FR18.1。
- **规划入口、时间、住宿、节奏与选点：** FR26-FR31、FR36、FR36.1、FR41、FR44-lite、FR49。
- **完整初始规划与联程：** FR7、FR28.1、FR32-FR35（含 FR32.1-FR32.3）。
- **时间轴编辑、校验与调整：** FR8、FR9、FR21、FR22；FR42/FR43 保留为 Post-MVP。
- **餐饮、商圈、定位与清单：** FR36.2、FR46-FR48。
- **行程细节、结果页与导出：** FR10、FR11、FR23、FR24、FR37、FR39、FR40。
- **对话式调整、负荷与天气：** FR50、FR51。

完整 FR 文本以 `_bmad-output/planning-artifacts/prd.md` 为准，本文件不复制出
第二套需求措辞。

### Non-Functional Requirements

- NFR1-NFR3：国内依赖降级、SSE、平台密钥/成本/隐私安全。
- NFR4-NFR6：各阶段 P50/P95、规划质量指标、S0-S11 漏斗与可观测性。
- NFR7-NFR8：合规、移动端单列、44pt 触控和 120-200ms 动效。
- NFR9-NFR12：细节完善不可重排、初始规划安全、联程一致性、引用可追溯。
- NFR13-NFR17：采集稳定性/许可、反馈 WebView、Provider 可替换与降级。
- NFR18-NFR23：定位隐私、Picker 状态一致、导入所有权、证据诚实、Trip 原子发布、路线与动态事实新鲜度。

### Architecture and UX Requirements

- OpenAPI 是 API SSOT；生成类型只能通过 generator 更新。
- `Trip -> ordered TripSegment -> single-city Plan` 保留 `Plan -> City` 单值关系。
- Planner 负责完整地点/时间编排；Validator 负责初始及变更后可行性；Filler 仅
  负责 `做什么 / 准备 / 注意`、why 和引用。
- Quick、HQ、seed、AnchorPool 可以是内部实现或降级词汇，不得成为两套用户流程。
- Picker 的 `required / along_route / unselected` 必须由同一状态源派生，并映射到
  L3、L2 汇总、地图与全城总数。
- BusinessArea 是独立规范实体，不能用行政区或 L2 静默替代。
- 规划、编辑、修复、联程发布均使用 ownership、idempotency、revision、审计与
  attempt fencing。

## FR Coverage Map

| Requirement | Story coverage |
| --- | --- |
| FR1, FR15, FR16 | 1.1, 1.2 |
| FR2, FR3, FR17 | 1.4, 1.6 |
| FR4, FR4.1, FR19 | 1.3 historical baseline; 1.6, 1.7, 1.8 target |
| FR5, FR6, FR18.1, FR20 | 1.4, 1.6 |
| FR7, FR28.1, FR32, FR32.1, FR32.2, FR32.3, FR33, FR34 | 1.8, 2.5 |
| FR8, FR21 | 2.2 |
| FR9, FR22 | 2.11 |
| FR10, FR23, FR37, FR39 | 3.1 |
| FR11, FR24 | 2.13 |
| FR12, FR25, FR38, FR45 | 1.5, 3.3 |
| FR13 | 3.2 |
| FR14 | 1.1, 1.3, 1.7, 1.8, 2.4, 2.5, 3.2 |
| FR18 | 1.6 |
| FR26, FR27, FR27.1, FR28 | 2.3 |
| FR29, FR30, FR31, FR44-lite | 2.4 |
| FR35 | 2.6, 2.7 |
| FR36, FR36.1, FR41 | 2.3, 2.5 |
| FR36.2 | 1.7, 2.8, 2.9 |
| FR40 | 3.4 |
| FR42, FR43 | Post-MVP backlog; excluded from MVP acceptance |
| FR46 | 2.10 |
| FR47 | 1.7, 2.9 |
| FR48 | 2.8, 2.9 |
| FR49 | 2.3, 2.4, 2.5, 2.7, 3.1, 2.13 |
| FR50 | 2.12 |
| FR51 | 2.5, 2.11, 2.12 |

## Epic List

### Epic 1: Foundation, Ingest, Home, and Account Entry

用户可以安全登录，从同一个首页输入旅行想法或批量导入灵感，并在隔离的灵感库
中查看来源、解析地点和导入记录。

### Epic 2: Planning and Editing

用户可以确认时间/住宿/节奏，表达地点意图，获得完整初始计划，编辑并修复冲突，
处理受限联程、餐饮与清单，最后导出可执行日程。

### Epic 3: Itinerary Detail and Operations

用户可以在不改变计划顺序的前提下完善执行细节与引用；运营侧具备评测、成本、
隐私和旅中状态能力。

## Epic 1: Foundation, Ingest, Home, and Account Entry

### Historical Delivery Note

Story 1.1-1.5 已完成，其验收以对应 implementation story 和合并记录为准。
Correct Course 不改写历史完成范围；新增能力通过 1.6-1.8 交付，届时 Epic 1 在
sprint 状态中暂时回到 `in-progress`，既有 retrospective 保留为历史快照。

### Story 1.1: Login Session and Compliance Contract (historical baseline)

As a user, I want a secure session and compliant account contract, so that my
private travel data is protected across devices and APIs.

Acceptance Criteria:

1. 手机号会话、刷新、登出、owner 访问和账号边界有统一契约。
2. 隐私政策、用户协议、账号删除和数据导出具备服务端路径。
3. 安全日志不记录 token、手机号、原始链接或 Provider secret。

### Story 1.2: Mobile Login First Screen (historical baseline)

As a user, I want equal and understandable login choices, so that I can enter
the app without compliance surprises.

Acceptance Criteria:

1. iOS 登录入口按 Apple、手机号、微信等权展示；短信风控按策略触发。
2. 触控、错误、加载和协议入口符合移动端可用性要求。
3. 登录完成保留深链或待继续动作。

### Story 1.3: Single XHS Ingest with SSE Progress (historical baseline)

As a user, I want one Xiaohongshu source processed asynchronously, so that its
media and POIs become durable inspiration with honest progress.

Acceptance Criteria:

1. 已交付单 job 单链接、异步状态、适配器缝隙、COS/AMap 降级和可恢复的存储基线。
2. SSE 状态可重连；错误、重试、DLQ 和幂等具备服务端基础。
3. evidence、source attribution、质量状态和待定位降级被保留。
4. 真实 VAD/ASR、按时长抽帧、生产多模态抽取和完整 AMap 事实不属于本历史完成声明，由 Story 1.8 交付。

### Story 1.4: Home, Unified Input, and Inspiration Library (historical baseline)

As a user, I want one Home entry and a city-organized inspiration library, so
that I can begin from either an idea or saved content.

Acceptance Criteria:

1. 首页包含计划/灵感导航、目的地卡和统一输入分流。
2. 灵感按城市展示，待定位可选择 AMap Top-5。
3. 自然语言输入可产生规划参数并进入后续流程。

### Story 1.5: Settings, Feedback, and Account Entry Points (historical baseline)

As a user, I want usage, account, and feedback controls, so that I can manage
my data and get help.

Acceptance Criteria:

1. 设置展示账号、AI 用量/额度、数据导出、删除账号与反馈入口。
2. 兔小巢 WebView 失败时可回退浏览器或内置最小表单。
3. BYOK 不作为 MVP 用户路径。

### Story 1.6: Home Import Queue and Import Records

As a user, I want pasted links processed as an understandable queue and stored
as my import records, so that I can keep adding inspiration without losing a
source or another user's privacy.

Acceptance Criteria:

1. 一次粘贴识别所有有效小红书链接，每条调用单链接 ingest API，并独立持有 job。
2. Home 保持一个长输入框和一个 `+ / 发送` 强调按钮，不创建第二层输入组件。
3. 前景队列显示来源标题、安全截断、事实动作和 `N/X`，不显示百分比或假进度条。
4. 每个完成项独占完整 10 秒展示窗口；后续完成项 FIFO 等待，不抢占当前结果。
5. 队列支持并发 job 的重连、失败、重试和单项继续；无效片段不丢弃有效链接。
6. 灵感库展示当前 owner 的导入记录、状态、解析 POI 和来源标题。
7. 原始链接仅在 owner 鉴权后的详情响应中返回，并提供紧凑复制操作。
8. MVP 以 `user_id + normalized_url` 去重并持久化 normalization 规则版本；短链、追踪参数和 canonical 变化有回归样例。
9. 输入占位符固定为 `粘贴分享链接或输入想去的地点，如：厦门 3天`；有内容时 `+` 以 120-180ms 过渡为发送图标，reduced-motion 直接替换。
10. 展开态使用向下 chevron/下滑收起，紧凑态向上展开；识别摘要使用 `识别 厦门 3天 7月14日出发` 且不提前展示 pace。
11. 事件以单调 cursor 持久化；进程重启和客户端重连可恢复最后 durable 阶段。跨用户计算/媒体复用不能成为记录读取路径。

### Story 1.7: Commercial Area Normalization and Imported Food Query

As a user, I want imported food places associated with reliable commercial
areas, so that later suggestions can be relevant without inventing geography.

Acceptance Criteria:

1. 新增规范化 BusinessArea 与 POI membership，membership 保存来源、置信度和更新时间。
2. 一个 POI 可属于零个或多个商圈；行政区、L1/L2 不自动等同商圈。
3. AMap 验证流程可写入或更新 membership，并保留 provider evidence。
4. owner-scoped 查询只返回该用户已导入、AMap 已验证且属于目标商圈的美食 POI。
5. 无可靠 membership 时返回空结果并让 UI 隐藏提示，不做近似伪装。
6. 提供版本化可靠性策略：来源优先级、质量阈值、过期、冲突/多归属和美食分类来源均可执行并有测试；未知不得提升为可靠。
7. 数据迁移、索引、OpenAPI、生成类型、仓储和真实数据库测试全部覆盖。

### Story 1.8: Evidence-Aware Multimodal Ingest Upgrade

As a traveler, I want imported media understood with cost-aware, traceable
multimodal processing, so that planning uses real places and constraints instead of stubs.

Acceptance Criteria:

1. 生产提取器消费真实下载服务的图文/视频元数据；ASR 前执行语音检测，静音或仅 BGM 片段跳过 ASR，并记录跳过原因和成本。
2. 小于等于 30 秒的视频使用可配置高频抽帧，长视频使用较低频率；采样策略、帧数、失败和缓存均可观测且受额度/熔断控制。
3. 多模态输出保留标题/正文/图片/帧/ASR 证据引用、source attribution、质量等级、置信度和 observed_at；旧 text/OCR/VLM 阶梯不作为主流程。
4. AMap 标准化持久化 provider id、标准名、地址、坐标、营业时间、评分、人均、电话、分类和事实新鲜度；缺失字段保持 null，低置信进入待定位。
5. 抽取预约/票务、dawn/sunset/night/night-market 和玩法兴趣时只产生带证据的 inferred signal；不得宣称已预约或把推断变成用户硬约束。
6. 导入自然语言和证据可产生带来源/置信度的 InterestProfile，供 2.5 使用；无可靠信号不伪造偏好。
7. OpenAPI、Prisma、生成类型、真实下载/提取/AMap adapter staging、厦门 fixture、成本与降级测试通过；CI stub 明确标记且不能充当生产验收。

## Epic 2: Planning and Editing

### Historical Delivery Note

Story 2.0/2.1 已完成但代表旧基线。它们的可复用代码可保留，产品语义由后续
故事替换；不得把下列 corrected target 回写成“过去已经完成”。Story 2.2 是当前
在制故事，Correct Course 仅修正它的编辑合同，不混入 Picker、餐饮或联程。

### Story 2.0: Confirm and Planner Picker (historical baseline)

As a planner, I want to enter planning constraints and choose inspirations, so
that the existing planner has structured inputs.

Historical Acceptance Criteria:

1. 已交付 Confirm、Picker、地图/列表联动、零选择与计划生成入口的旧基线。
2. 旧 `selected_required`、参数 Sheet 和 CTA 行为仅作为兼容历史。
3. 当前 Time/Accommodation/S5 和三态 Picker 由 2.3/2.4 实现。

### Story 2.1: Generate Day Skeleton with Quick and HQ Planning (historical baseline)

As a planner, I want an initial day plan, so that I can see the existing
planning engine produce editable schedule data.

Historical Acceptance Criteria:

1. 已交付 Quick/L2、候选、hotel slot 和 Planner 基础合同。
2. Quick/HQ 双版本、部分骨架、seed UI 和“切换-采用”不再是当前产品目标。
3. 单一可见完整规划与同路由转场由 2.5 实现。

### Story 2.2: Timeline Editing, Undo, and History (active correction)

As a planner, I want precise timeline edits and a predictable undo control, so
that I can refine the plan without losing ownership or context.

Acceptance Criteria:

1. 支持替换、前一天、后一天、其他有效日期、删除和任意合法 `HH:mm` 分钟级调时。
2. D1 置灰前一天，Dn 置灰后一天；没有非相邻日期时置灰“移至其他”。
3. 时间弹窗分别显示开始/结束所属日期，跨日由日期标签表达，不展示吸附说明。
4. 右上全计划控件默认历史图标；mutation 后显示 `撤销 8`，结束后只开放最近一条额外 eligible undo。
5. 页面不显示底部 undo toast 或单日“最近操作”；酒店始终位于当日瀑布底部。
6. Header 不显示 Nomad badge、`我的计划` 或版本号；编辑 Sheet 不使用泛化的 `编辑安排` 标题，而以 POI 名称/日期开头。
7. 编辑 Sheet 在任何操作之前显示上一个和下一个 POI 的 nullable 服务端通勤时间；前端不得编造，跨 segment 的无效移动目标不得出现。
8. 调时使用时钟/闹钟式控件；快速滚动只改变灵敏度，reduced-motion 与读屏路径仍可精确到分钟。
9. mutation 保留 ownership、idempotency、revision、审计和冻结预约/票务保护；派生冲突交给 2.11。
10. 本 Story 不实现 Picker 三态、餐饮、BusinessArea、linked trip 或清单。

### Story 2.3: Planning Time, Accommodation, and Pace Review

As a planner, I want to confirm only time, accommodation, and pace in a short
mobile flow, so that AI receives the constraints that materially shape my trip.

Acceptance Criteria:

1. S2 显示目的地、整体日期/天数、`每天几点出门`，不重复摘要或桌面表单字段。
2. 到达与离开彼此可选，分别支持精确航班/车次、恰好 2 小时时段和 `交给 AI 安排`；2 小时窗口按接驳缓冲保守计算。
3. `交给 AI 安排` 只产生可编辑的 `AI 暂定` 首末日可用时间，不得编造班次、票务状态、机场、车站或航站楼。
4. 精确输入支持航班和火车 provider 查询；失败保留交通方式、日期、时间与 AMap terminal 的手动路径。AMap 只匹配地点，不伪装成班次数据源。
5. S3 按住宿晚展示可留空酒店、AMap POI 匹配、早餐和行李；最后一天不自动产生额外住宿晚。
6. 后续住宿晚的 `同上` 是独立按钮：复制酒店/早餐并重新计算当晚行李默认，不盲目复制上一段行李；不提供“应用到剩余住宿晚”。
7. 首晚、连住、换住、跨城和末日离开分别推导行李：连住默认留原酒店，换住默认带到新酒店；首晚不得显示不存在的“原酒店”。
8. 车站/机场寄存生成放下和取回动作并占用时间；单向离开不得把行李留在旧酒店，除非存在返程取回。其他方式覆盖随身、寄送、私家车、其他寄存、无大件和未决定。
9. S5 要求选择悠闲/从容/充实并使用 PRD 的完整说明；默认从容但可由明确证据预选，用户可改。S5 不重复 S2/S3，只提供默认折叠的可选“其他要求”输入。
10. 只有 S5 CTA 叫 `开始规划`。预约、门票和特殊时段由证据/Agent 推导，不在 S2/S3 设独立开关；不显示智能规划开关。
11. Provider 班次结果保留 provider/source、observed_at、valid_until、confidence 与状态；过期、歧义或无结果不能显示成已确认班次，手填和 AI 暂定使用不同来源状态。
12. S2/S3 只有在日期/每天出门时间、每个边界和每个住宿晚均被主动处理后才能继续；显式 `交给 AI`、`留空`、`未知/未决定` 与 `同上` 是有效确认，untouched 初始态不是。

### Story 2.4: Picker Intent and POI Information

As a planner, I want to mark places as required or along-route while retaining
city context, so that AI can distinguish strong intent from useful options.

Acceptance Criteria:

1. S4 从不可展开的 `全城检查` 进入，展示 L1 地图与 L2 汇总；`选择 L3` 只是设计状态名，点击 L2 后应用内标题显示当前 L2。
2. L2 使用由子 L3 派生的非交互状态点和分项计数，不显示 checkbox；未选、仅 required、仅 along_route 和混合态可区分且不只靠颜色。
3. 仅 L3 视图默认展示互斥 `附近 | 全城`；选择/点击 L3 聚焦该 POI 与附近地点，split 显示当前及相邻 L2，Map-Full 显示完整 L1。
4. L3 右侧用 icon-only 互斥动作：check-circle=`required`，Route=`along_route`，再次点击清除。
5. L3 页汇总为 `已选必去 X` 与 `顺路去 Y`，CTA=`返回全览`；全城 CTA=`下一步`。
6. 返回全城后，两类状态都映射到 L3 缩略图、L2 分项计数/状态和全局总数；along_route 不得显示成未选。
7. 列表、Marker、地图、Sheet 和提交 payload 共享 `required/along_route/unselected` 单一状态源。
8. 通用 POI 信息 Sheet 以 POI 名称为标题，不显示“详情栏”等泛化标题；内容展示地址、营业、评分、建议停留、来源和质量。`需预约` 只是 evidence，只有用户/可信票务确认才显示 `已预约` 或形成 lock。
9. 零选择可继续；附近视图可发现跨城 L1/L2/L3，跨城意图进入 2.7 的显式确认，不能静默混入当前城市时间段。

### Story 2.5: Single-Run AI Planning and Day Load

As a planner, I want one AI planning run to produce a complete and honest
initial itinerary, so that I can start adjusting instead of manually placing a skeleton.

Acceptance Criteria:

1. S5 提交后只创建一个用户可见 PlanningJob，并立即进入稳定的时间轴 shell。
2. 同一 shell 展示事实阶段、重连、fallback 和失败动作，完成后原地 hydrate 为可编辑计划。
3. Planner 优先处理 required、强时段证据、住宿/行李和 transfer 边界，再处理 along_route 与 Agent 候选。
4. 初始结果覆盖全部可用日期；无法安全落位的 required 和未采用候选进入明确未解决/候选区。
5. Quick/L2/低成本路径仅是同一 job 内部 fallback；UI 不出现 Quick、HQ、双结果或切换采用。
6. 内部尝试使用 attempt fencing 和版本来源，用户首次 mutation 后不得被后台结果静默覆盖。
7. 每天展示主要安排数、步数区间、通勤和负荷标签；负荷来自结果，不替代 S5 的 pace 输入。
8. `计划已完成，可直接调整` 只在首次真实 mutation 后消失；浏览、滚动和切换日期不消失。
9. Planning snapshot 包含来源/置信度明确的 InterestProfile 和 S5 其他要求；推断偏好不得覆盖 required、用户硬约束或 pace。
10. 路线/距离矩阵由服务端提供 mode、duration、source、observed_at/freshness；超时或配额失败为 unknown，客户端不估算。
11. 模糊候选严格按 owner 已有笔记、小红书补搜、AMap 附近、用户确认逐级执行并记录来源/成本；低置信不得静默落位。
12. 候选区区分 unresolved required、未采用 along_route、导入候选和 Agent 候选；不使用空白 `待安排` 让用户先摆满。
13. DayLoadEstimate 至少含主要安排数、步数范围、通勤、开始/结束、留白、原因和置信度，并检测连续早起/连续高负荷；不显示虚假精度。

### Story 2.6: Linked Trip Aggregate and Transfer Contracts

As a planner, I want multiple single-city plans connected by a versioned trip
aggregate, so that intercity handoffs are consistent without weakening Plan ownership.

Acceptance Criteria:

1. 引入 `Trip -> ordered TripSegment -> Plan`，每个 Plan 仍只关联一个 City。
2. TransferLeg 归 Trip 所有，绑定相邻 segment、交通方式、地点、状态和连续交接区间。
3. TransferLeg 保存 service code、计划发到时间、起终 terminal、进站/等待/行驶/到达/出站缓冲、source、confidence、status 和 revision；总 handoff 由这些事实派生。
4. StayRevision、LuggageTransitionRevision 与 TripRevision 可表达逐晚住宿、交接日行李和不可变联合版本；不以可变 Stay 行冒充 revision reference。
5. TripRevision 固定引用 PlanRevision、TransferLegRevision、StayRevision 与 LuggageTransitionRevision，防止混合快照。
6. 只允许 2-3 个同一时区城市、白天直达、每个中间城市至少一晚、每日最多一次跨城。
7. 草稿/未确认 provisional/失败 transfer 阻止联合发布；各单城 Plan 可独立保存但不能伪装成完整联程。
8. OpenAPI、Prisma migration、索引、ownership、幂等和真实数据库故障注入/原子性测试通过。

### Story 2.7: Linked Multi-City Planning Flow

As a planner, I want a cross-city place to expand my trip explicitly, so that
Nomad can connect city plans without putting them in each other's time windows.

Acceptance Criteria:

1. S4/S8 对附近跨城 L3 选择 required/along_route 时使用同一确认 Sheet，提示地点所在城市、当前城市链与 `增加{城市}行程 / 暂不加入`。
2. 确认后返回 S2/S3，标题显示有序城市链；整体日期/天数由各城市日期自动计算。
3. 后续城市开始日跟随前一城市离开日；边界显示到达首城、逐段前往、离开末城。
4. 可查询航班/火车或手填交通，也可让 AI 提议 provisional transfer；不得编造票务事实。
5. transfer 连续占用进站/候车/行驶/到达/出站区间，并切割交接日上下游可用时间。
6. 每段复用逐晚住宿与行李合同，时间轴显示明确跨城分割提示和目标城市酒店。
7. AI 或手动在 S8 新增跨城 POI 走同一确认，不绕过 Trip 约束。
8. 接受后保留原 required/along_route 并绑定新增目标 segment；取消不修改 Trip。两城可在确认中用独立反转按钮改变顺序，三城在 S2 选择插入位置。
9. UI 使用 `厦门 → 泉州` 加独立反转图标，不用容易误解为往返的 `⇄` 文案。
10. 跨时区、夜间跨日、A-B-A、第四城市、无住宿中间城和任意复杂重排明确拒绝或延期。

### Story 2.8: Trip-Time Location Context

As a traveler, I want location-aware suggestions only when I permit them, so
that nearby choices stay useful without background tracking.

Acceptance Criteria:

1. 仅旅中前台需要时请求定位，并展示用途；拒绝后主行程仍可用。
2. location context 包含时间、新鲜度和精度，不把陈旧 fix 当成实时位置。
3. 无权限/陈旧/失败时，按最近完成 POI、当前计划 POI、下一 POI 降级并标注来源。
4. 服务端只接收召回所需最小上下文；日志和分析不保存连续轨迹或精确历史。
5. 权限变化、后台切前台、弱网和模拟定位测试覆盖。

### Story 2.9: Meal Slots and Contextual Food Recall

As a traveler, I want important meals anchored and flexible meals refreshed in
context, so that eating supports rather than over-specifies my itinerary.

Acceptance Criteria:

1. 餐饮是独立 MealSlot，但时间轴视觉与普通 POI 一致，仅对可靠预约证据加 badge。
2. fixed_anchor 可冻结已预约/专程餐厅；choice_pool 包含一主和最多两备，右侧更换打开候选。
3. 候选不足时第一个空位显示 `+ 添加更多`，不伪造三家完整结果。
4. `暂不决定` 不承诺固定 90 分钟，旅中根据 location context 刷新候选。
5. 去重召回顺序为当前位置最近、5km 内评分最高、可靠免排队、饭后下一 POI 最近；免排队必须有证据。
6. 换店后重新校验营业、距离、后续路线与预约；失败保留原选择并说明原因。
7. 小吃街/商场/市场可附加 `附近吃什么`，它不是时间轴节点，只查 owner 导入且同 BusinessArea 的已验证美食。
8. 无定位、无商圈 membership 或候选不足时诚实降级，不展示空壳提示。
9. Planner 不机械建立四个每日餐次；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不创建 MealSlot，用户明确添加时才进入时间轴。

### Story 2.10: Trip Checklist and Shopping Signals

As a traveler, I want a compact trip checklist for must-buy, along-route, and
return tasks, so that shopping and reminders do not pollute the timeline.

Acceptance Criteria:

1. 日期 Tabs 可横向滚动，右侧固定窄 ListChecks 图标和未完成计数；日期可在其下被截断。
2. 展开页按必买目标、顺路门店和返程事项呈现状态、来源与完成动作。
3. 页面底部仅有 `+ 添加记录`，不显示额外 AI 提示或手动记录按钮。
4. Add Sheet 空输入时直接添加为强调态、AI 提示禁用；输入后 AI 提示可用并成为强调态。
5. AI 建议必须预览确认才写入并保留 provenance；直接添加保存用户原文。
6. MVP 不自动发送返程前 48 小时提醒，也不把清单项自动变成时间轴槽。
7. must_buy 可无地点或关联多个已验证门店；商品型号/尺寸/颜色/数量保留为目标属性，不塞进 POI 标题。
8. shopping_area 只有本身是旅行目标时才成为普通时间块；退税、提货、机场或行李事项经确认可生成 return buffer，但不承诺实时库存。

### Story 2.11: Post-Edit Feasibility and Typed Fixes

As a planner, I want validation after meaningful edits and actionable fixes
only when needed, so that the app protects feasibility without blocking clean work.

Acceptance Criteria:

1. 初始计划在发布前校验；insert/replace/move/retime/delete、酒店或 transfer 变更后增量校验。
2. 干净计划不显示永久校验卡；检测到冲突才显示简短 banner 和 FixSheet。
3. 越权、格式、trip 边界和冻结预约/票务等结构问题在 mutation 边界拒绝。
4. 营业、通勤、停留、酒店/行李等派生问题可先产生新 revision，再立即标记校验状态。
5. 修复方案使用 replace/reorder/shorten/move-day 等类型化操作，预览差异后才应用。
6. 应用修复创建新版本、重跑校验并可通过 2.2 全局 undo 撤销。
7. 硬冲突阻止 3.1 和 2.13；软警告可继续但明确风险。
8. 派生检查覆盖步数软上限、连续早起/高负荷、留白与恢复、同行人/体力、酒店入住退房/寄存、行李、城际接驳缓冲及餐饮绕路；不确定事实标记待核实。
9. 临近日期只使用带 provider、observed_at、valid_until 和质量状态的可靠天气；远期使用季节性上下文。天气建议不静默重排，陈旧/缺失时降级。
10. 路线事实保存 mode、duration、source 和 freshness；矩阵失败产生 unknown，而不是客户端估算或伪造可行。

### Story 2.12: Conversational Local Replanning

As a planner, I want to ask for a local adjustment and choose an approach, so
that AI can help without directly mutating opaque schedule JSON.

Acceptance Criteria:

1. S7/S8 右下角提供可访问的 `AI 调整` 图标按钮；快捷表达只填充/提交意图，不直接执行不可逆重排。
2. 系统从当前日期/地点上下文识别 slot、segment、day、later-days 或 whole-trip 范围；未明确时优先最小范围，不静默扩大。
3. 输入自然语言后先显示 `选择一个调整方向`，方案 A 直接回应，方案 B 提供另一可行解。
4. 方案只说明调整方向，不在选择前堆叠内部推理或详细改动。
5. 选择后生成类型化 diff，预览营业、交通、冻结项、负荷和可用天气证据影响。
6. 用户确认才应用；完成 Sheet 显示 `做了以下调整`、实际范围和可验证事实。
7. `换成雨天方案` 仅在 2.11 的天气新鲜度合同满足时可用；否则说明季节性/无数据降级。
8. LLM 不直接写持久化 JSON，服务端命令层执行 ownership/revision/idempotency 校验。
9. 应用后触发 2.11 并接入 2.2 undo；失败不覆盖当前计划。

### Story 2.13: Export Itinerary PNG

As a planner, I want a clear export of single-city or linked itineraries, so
that I can use and share the plan offline.

Acceptance Criteria:

1. 从当前 Trip/Plan revision 与已应用 detail overrides 生成预览和 PNG。
2. 固定宽度 1080px，可选 1242px；超长按天切片，优先 WebP、降级 JPEG。
3. 单城与联程均显示日期、城市、transfer、酒店、行李和来源状态，不混合版本。
4. 未解决硬冲突或无效 transfer 阻止导出；软警告可导出但明确显示。
5. 导出具备 owner 鉴权、幂等、额度/失败重试和资源清理。
6. 厦门 final itinerary fixture、单城、联程、跨日和长图视觉回归通过。

## Epic 3: Itinerary Detail and Operations

### Story 3.1: AI Itinerary Detail Enrichment, Result Sheet, and Citations

As a planner, I want AI to enrich an already arranged itinerary without
changing its schedule, so that the plan becomes executable and traceable.

Acceptance Criteria:

1. S9 只为已排槽位生成 `做什么 / 准备 / 注意`、why_short、引用和质量状态。
2. 不新增、删除、移动、改时或改顺序；需要重排必须回到 2.11/2.12。
3. 输出遵守每段行数/字数限制，缺少必填内容时按槽位失败并诚实降级。
4. 引用关联来源、时间戳、摘要和 attribution；无可靠事实时标注需要核查。
5. S10 支持 slot-level override、重新生成不覆盖、单槽恢复 AI 内容。
6. 入口不得重新引入 Story 2.1 完成中间页或把“完善细节”放成初始规划的阻塞 CTA。
7. 硬冲突阻止完善；软警告允许继续并保留说明。

### Story 3.2: Observability, Evaluation, and Provider Routing

As an operator, I want traceable AI and product metrics, so that quality,
latency, cost, and regressions are measurable.

Acceptance Criteria:

1. Langfuse 记录 prompt/version、脱敏 tool I/O、provider attempt 和 revision correlation。
2. promptfoo 覆盖厦门 fixture、required/along_route、linked trip、meal 和 citation 回归。
3. Sentry 覆盖前后端并脱敏；错误关联 job/trace/revision，不记录原始 secret 或定位轨迹。
4. 仪表盘覆盖 S0-S11 漏斗、P50/P95、fallback、首次可行率、冲突率、引用和成本。
5. Provider 路由、超时、熔断与 fallback 可远程配置，仍只产生一个用户完成流程。

### Story 3.3: Account Privacy, Quota, and Compliance Controls

As a user, I want transparent AI usage and data controls, so that I can trust
the platform-managed service.

Acceptance Criteria:

1. Provider secrets 仅服务端保存；BYOK 不在 MVP UI 或必需合同中。
2. 按用户/设备/workspace 配置请求、并发、导出和成本上限，异常可熔断。
3. 接近/达到额度时提供排队、稍后继续、低成本或无 AI 的诚实降级。
4. 删除账号、导出数据、COS 清理、观测 PII 清理和审计闭环。
5. 高德、COS、反馈与国内依赖的许可、版权、最小数据和替代路径有验证记录。

### Story 3.4: Recent Trips and Check-In State

As a traveler, I want to reopen recent trips and mark completed activities, so
that Nomad remains useful during the trip without changing the planning model.

Acceptance Criteria:

1. 首页显示 owner 的最近行程，ResultSheet 完成后进入已完成/旅中列表。
2. 槽位支持打卡/取消打卡，状态与计划 revision 分离且幂等。
3. linked trip 按整体 Trip 展示，同时保留城市段定位。
4. 该状态不自动触发记忆日志、推荐回流或 48 小时提醒。

## Sequencing and Readiness Notes

1. 完成规划文档同步后先运行 `[IR]`；有阻塞项时不得更新 sprint 队列。
2. `[SP]` 需保留已完成历史状态，并将 1.6-1.8 与 2.3-2.13 加入新队列。
3. 当前 Story 2.2 先按修正合同完成 review/merge；不要在其分支混入后续故事。
4. 推荐实现顺序：2.2 -> 1.6 -> 1.7 -> 1.8 -> 2.3 -> 2.4 -> 2.5 -> 2.6 ->
   2.7 -> 2.8 -> 2.9 -> 2.10 -> 2.11 -> 2.12 -> 2.13 -> Epic 3。
5. 每张故事在进入开发前单独运行 `create-story` 与 validation；规划文档不能替代
   story-level API、migration、测试与视觉验收细节。
