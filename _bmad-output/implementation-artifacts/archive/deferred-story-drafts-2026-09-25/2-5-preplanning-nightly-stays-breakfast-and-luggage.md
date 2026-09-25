---
project: nomad-mvp
story_id: '2.5'
story_key: 2-5-preplanning-nightly-stays-breakfast-and-luggage
source_story_id: '2.5'
source_contract_sha256: c838289fd9877b9b5386917d24bb2a53986995395c8e9d1da31df2544103e6b0
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: drafting
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- OPS-01
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR27.1
- FR36
- FR41
- FR44-lite
- FR49
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
implementation_prerequisite_story_ids:
- '2.3'
- '1.11'
- 9.3-local-ui
- '9.4'
- '9.5'
- '9.6'
- '9.7'
preparation_validation: _bmad-output/implementation-artifacts/2-5-preplanning-nightly-stays-breakfast-and-luggage-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
---

# Story 2.5: 规划前逐晚住宿与行李确认

Status: draft

> 本轮仅准备合同。源GWT按出现顺序记为AC1–AC15，下方Tasks据此逐项映射；源叙事、条款及补充保留原文。准备不解除1.7开发停止或3.1暂停。

## Story

As a 旅行者,
I want 在规划前按住宿晚确认酒店、早餐和行李,
So that AI 可以使用已知约束，同时允许我暂时留空或未决定.

**Requirements:** FR14, FR27.1 (accommodation), FR36 (hotel), FR41,
FR44-lite; NFR1, NFR8, NFR21; AR2-AR5, AR10-AR15, AR17, AR20,
AR21; UX-DR2, UX-DR3, UX-DR9, UX-DR10, UX-DR32-UX-DR34
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

## Acceptance Criteria

**Acceptance Criteria:**

**Given** owner 已完成单城 S2 时间确认
**When** 进入 S3 `住宿安排`
**Then** 按住宿晚而不是按自然日生成 `旅行天数 - 1` 个可编辑行，并显示目的地、整体日期与住宿晚数
**And** 一日游明确显示零住宿晚，但仍提供末日离开前的行李确认，不意外创建额外酒店晚

**Given** S3 展示一个住宿晚
**When** 用户检查该晚内容
**Then** 同一 `StayNightEditor` 规则组依次提供酒店、早餐和行李三个子项，每个住宿晚均可独立设置
**And** 早餐不成为计划级单独问题，行李不再使用一个 plan-global 字符串

**Given** 用户在酒店字段输入酒店、民宿或地址
**When** 执行文本快速搜索
**Then** 使用 AMap 返回最多 5 个 CanonicalPOI 候选并显示标准名称与地址，不在本流程增加地图
**And** AMap 超时、配额或无结果时保留输入，允许重试、手工录入为待定位或明确选择 `留空/稍后决定`；当前搜索区域将真实无匹配写为 `未找到，可手动填写`，请求失败写为 `搜索暂不可用 · 重试`，详细原因按需展开，不把无结果与失败混为一类或增加全页警告

**Given** 用户主动选择某晚酒店留空
**When** 保存该住宿晚
**Then** 创建 `leaveBlank=true` 的明确 StayRevision，早餐和行李仍可分别确认
**And** 该晚后续不启用 near_hotel、酒店区域聚类或晚间活动半径偏好，也不得从灵感或热门地点静默代选酒店

**Given** 用户编辑某晚早餐
**When** 选择 `包含`、`不包含` 或 `未知`
**Then** 保存 tri-state breakfast 事实并保持其与该晚 StayRevision 关联
**And** `未知` 是显式有效确认，不被展示为包含早餐或 Provider 已验证事实

**Given** 用户从第二个住宿晚起点击独立的 `同上` 按钮
**When** 上一晚存在已确认的酒店或留空选择及早餐状态
**Then** 命令把上一晚住宿与早餐复制到该晚的新 StayRevision，并允许用户继续修改任一子项
**And** 不提供 `应用到剩余住宿晚`，不把 `same_as_previous` 持久化为最终事实，也不复制上一段 LuggageTransition

**Given** 当前住宿晚与前后晚关系已知
**When** 系统建议行李默认值
**Then** 首晚不得出现 `留在原酒店`，连住默认 `留在原酒店`，换住默认 `带到新酒店`
**And** 默认值只是待用户确认的建议；用户可选择随身、寄送、私家车、其他寄存、无大件或 `未决定`

**Given** 用户选择 `放在车站/机场` 或其他需要取回的寄存方式
**When** 保存 LuggageTransitionRevision
**Then** 必须关联可用 storage POI 或明确待定位状态，并记录需要安排的放下与取回约束
**And** 缺少取回路径、地点不可用或单向离开后无法返回时不能伪装成完整可执行安排

**Given** 行程进入最后离开日且不再产生新住宿晚
**When** 用户确认 checkout 后的行李去向
**Then** 可以选择随身、前往交通枢纽寄存、寄送、私家车、无大件或未决定
**And** 不允许把行李留在最后酒店，除非存在显式且可执行的返程取回约束

**Given** 用户修改 S2 旅行日期后返回 S3
**When** 系统 reconciliation 住宿晚
**Then** 按日期和 logical stay identity 保留仍有效的已确认 revision，新增晚进入待处理状态
**And** 移除或改变已填写住宿晚前显示明确影响，不能静默丢弃酒店、早餐、行李或把它们移到错误日期

**Given** 某晚酒店、早餐或行李仍是 untouched 初始态
**When** 用户尝试进入 S4
**Then** 下一步保持禁用并将焦点移到第一个未处理子项
**And** 明确的酒店 `留空`、早餐 `未知`、行李 `未决定` 或合法 `同上` 都满足对应字段确认，不要求用户伪造确定性

**Given** owner 保存某晚住宿或行李变化
**When** 服务端处理命令
**Then** 使用 owner scope、idempotency key、expected revision 创建不可变 StayRevision 或 LuggageTransitionRevision，并原子更新 draft 当前引用
**And** stale revision、越权或重复命令不覆盖旧版本，日志和分析不记录完整私人酒店备注、行李说明或 Provider secret

**Given** `StayNightEditor` 在 S3 中实现
**When** 组件和领域校验被组织
**Then** 酒店、早餐、行李字段状态及命令不依赖 S3 页面导航或多晚容器的局部布尔值
**And** 该可复用边界允许 Epic 3 在单晚 Sheet 中复用相同规则，但本 Story 不提前实现规划后入口或影响确认

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 S3
**When** 搜索酒店、留空、切换早餐、选择行李、点击同上或修正错误
**Then** 所有控件具备至少 44pt 目标、标签/角色、非纯颜色状态、焦点管理和键盘安全 CTA
**And** 多晚滚动、长酒店名、AMap 失败、零住宿晚及确认错误不造成嵌套卡片、闪烁或布局跳动

**Given** Story 2.5 准备关闭
**When** 使用零晚、单晚、连住、多次换住、空酒店、早餐三态、同上、车站/机场寄存、最后离开、日期增减、AMap 失败和 stale revision fixture，并运行 OpenAPI/生成类型、Prisma migration、owner/幂等/不可变 revision、真实 PostgreSQL、AMap staging、移动与桌面浏览器检查、完整构建和 diff 检查
**Then** S3 可以独立形成完整且诚实的逐晚住宿输入，未决定项不会阻止开始规划或被伪装为已确认事实
**And** 规划后的酒店 footer、单晚 Sheet、`管理全部住宿`、AccommodationChangeImpactSheet、增量校验、FixSheet、全局撤销、自动重排和 linked-trip 住宿不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 核对逐晚输入迁移与搜索能力（AC: AC1, AC3, AC10, AC15）
  - [ ] 核对2.3日期reconciliation/receipt实际合同，列出旧hotels按days及breakfast boolean/全局luggage到新模型的保留映射；旧未确认值不得自动映射成显式unknown/leaveBlank。
  - [ ] 沿1.11验证facade检查AMap hotel/address搜索的结果身份/城市/时间与实际staging资源，保留pending/manual路径；不在S3加入地图或自动选酒店。

- [ ] T1 建立不可变Stay与LuggageTransition命令（AC: AC1, AC2, AC5, AC12, AC13）
  - [ ] 按tripDays-1创建logicalStayId与checkIn/checkOut date的住宿晚，早餐tri-state独立；LuggageTransition绑定前后stay或末日departure，零晚也有离开日行李输入。
  - [ ] owner、expected draft/stay/transition revision、operationId/requestHash先校验；新StayRevision/LuggageTransitionRevision与draft引用/回执原子写入，重复命令原结果，跨owner与stale不覆盖。字段规则模块独立于页面，供后续3.3复用。

- [ ] T2 酒店搜索、明确留空与早餐（AC: AC2, AC3, AC4, AC5）
  - [ ] HotelPoiField最多5个名称/地址文本结果；搜索失败/空结果分开，保持原输入，唯一已验证匹配才canonical。手工名保持待定位；leaveBlank显式事实不挂hotel reference，不启用near_hotel。
  - [ ] 早餐included/not_included/unknown与该晚revision绑定；酒店留空不能禁早餐或强迫unknown，未触碰与用户选择unknown不同。禁止沿用旧schema“blank不允许breakfast”的约束。

- [ ] T3 同上与上下文行李建议（AC: AC6, AC7, AC8, AC9）
  - [ ] 从第二晚起仅“同上”按钮复制前晚确认酒店/leaveBlank与早餐为新revision；不持久same_as_previous，不提供应用余下所有晚，不复制LuggageTransition。
  - [ ] 首晚禁止留旧酒店，连住/换住仅给待确认默认；完整支持carry/courier/private_vehicle/other/no_large_luggage/undecided。hub/其他寄存保留storage POI或待定位及drop-off/pickup约束，末日仅显式可执行返回取回才能留酒店。

- [ ] T4 日期reconciliation与完整性门禁（AC: AC1, AC10, AC11, AC12）
  - [ ] 日期增减使用2.3确认的差异，按日期+logicalStayId保留仍有效引用，新晚待处理；已填被移除/错位项显示影响并留历史，不按数组index把酒店平移。并发日期变更使旧晚命令typed冲突。
  - [ ] S3→S4对每晚hotel/breakfast/luggage及末日行李检查主动确认；leaveBlank/unknown/undecided均合法，untouched定位首子项。恢复不从组件bool猜已完成。

- [ ] T5 可复用StayNightEditor与移动交互（AC: AC2, AC6, AC11, AC13, AC14）
  - [ ] 抽StayNightEditor负责单晚规则与命令，StayNightList仅组合晚序；首晚/换住/末日分别呈现，零晚不能多出酒店卡，搜索往返保留输入及原晚焦点。
  - [ ] 使用共享Field/Radio/AppSheet、44pt与错误关联；长酒店/多晚滚动、IME键盘和busy关闭保持稳定。不添加规划后footer点击、管理全部住宿或影响确认Sheet。

- [ ] T6 验证住宿与行李的状态矩阵（AC: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14, AC15）
  - [ ] 真实PG验证零/1/多晚、连住换住、三态早餐、酒店blank+早餐确认、同上不复制行李、未决定合法、hub未知/无取回、末日无返回、日期减晚/改起日、跨tab与unknown receipt。
  - [ ] 保留旧PlanHotelConstraint/PlanHotelSlot读取，源AC15的后置编辑/undo/linked-trip均不提前实现；真实AMap搜索和双端交互各留证据。

- [ ] T7 持久化、恢复和数据保留证据（AC15；OPS-01、DB-CHANGE-01）
  - [ ] 针对StayRevision、LuggageTransitionRevision、logical stay与draft当前引用形成migration ID/源码摘要、前向应用、失败恢复和旧数据兼容方案；隔离真实PG验证owner/引用/幂等/不可变历史，按既有资格锁次序处理，不在事务中等待Provider。无schema变更也以实际diff给出限定依据。
  - [ ] 将本Story新增StayRevision、LuggageTransitionRevision、logical stay与draft当前引用纳入新实例恢复fixture并检验当前指针、回执和旧引用；实际每日全量/15分钟增量或PITR、最新删除抑制、异机目标和实测RPO仍是生产开放门槛，不以本地dump或1.7隔离证据全局关闭。

- [ ] T8 建立本能力指标与质量对照（AC15；METRICS-01、METRICS-02、METRICS-03、CODE-QUALITY-01）
  - [ ] 以`WL-EPIC2-5`封存版本、环境、样本、逐晚确认/搜索空失败、同上/日期reconciliation、回执恢复与untouched门禁以及失败/unknown/重复分母；P50/P95使用同一阶段边界与nearest-rank，有效N和缺测分列、未知费用为null。真实staging基线、yimeng-tong版本化目标和同口径发布候选比较未齐前保持相应门槛开放。
  - [ ] 保存每个业务AC的正常/错误/竞态fixture与规则结果；涉及模型的变更另记录版本/变体/重复及真实人评，不能用模拟评价代替yimeng-tong。新改TS/React文件进入9.4真实typed lint，保留Promise/Hook/label负例与只减不增的旧例外；运行受影响领域/路由/mobile测试、typegen、全workspace build、diff检查，不用占位ci:lint结果报通过。

- [ ] T9 本Story共享UI和真实宿主关闭矩阵（AC15；APP-HOST-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01、shared-ui-adoption）
  - [ ] 将S3多晚StayNightEditor、酒店Top-5与LuggageSheet接Nomad `src/ui`的Field/Button/Tabs/AppSheet/AsyncState，依9.3唯一Portal、焦点/滚动/关闭管理和9.7返回协调；业务controller继续拥有dirty、回执、cursor与revision。9.6只管普通读取，显式禁用自动retry/focus/reconnect刷新，认证确认后按scope刷新；未知身份隐藏页面与Portal并拒绝迟到响应。
  - [ ] 9.4工作台保留本Story正常、loading、empty、partial/stale、失败/重连、disabled原因、长中文/200%字号、键盘、reduced-motion、身份未知/切换场景；MSW未声明请求失败且产品构建无mock。9.5 Chromium/Firefox/WebKit按固定字体/时区/viewport/版本留actual/expected/diff与trace，对照旧探针，不自动接受截图差异。
  - [ ] Android10+/WebView111+、iOS/Safari16.4+及Firefox128+分别记录多晚IME搜索、返回保留当前晚、零晚末日行李、日期变化及进程重建回执，核验44pt、读屏、键盘/安全区、背景遮蔽、恢复同一owner和未知写入不重交；WSL运行Node/pnpm，iOS原生构建使用获准macOS资源。native:sync/verify、APK编译和Web截图不等于真机/TestFlight；缺Mac/签名/设备保留该切片未验收。

## Dev Notes

### 实施入口、前序与边界

S3依赖2.3已经可消费的日期/边界draft；无需等待2.4 Provider查询。StayNightEditor首用领域实体现在建立，3.3和Epic4随后消费同一规则而不能反向阻塞本Story。后续Planner读取明确的blank/unknown/undecided，不能把它们降成“缺必填”。

所有前序交付需在实施时核对真实源码/证据；同批合同只说明未来输入，当前未实现能力不能伪装成已可调用。catalog的显式dependencies保持原值；`implementation_prerequisite_story_ids`补充源GWT的语义前提，不改变准备顺序或把后续Story当成前置。9.3的本地可验证共享组件切片、9.4/9.5质量工具及9.6/9.7实际adapter由各自Story交付，既有真实auth/原生门槛独立；普通准备不部署或外发。

### 当前文件与具体修改计划

| 类型 / 文件 | 当前实查与本Story改动 | 必须保留 |
| --- | --- | --- |
| UPDATE `apps/mobile/src/planner/PlannerScreen.tsx` | 旧hotelRows按days、checkbox breakfast和全局luggage；移出并由S3单晚容器消费 | 保留合法旧输入和handoff，显式迁移而不重置 |
| UPDATE `apps/mobile/src/planner/api.ts` | 旧searchPoi可复用但错误/typed数据需按2.3新draft命令扩展 | 认证transport与不自动重发命令 |
| UPDATE `apps/server/src/schemas.ts` | 旧blank禁止breakfast且换酒店必须非undecided；新逐晚schema独立取代新流程规则 | 旧API字段兼容和历史数据 |
| UPDATE `apps/server/src/planner/types.ts` | ResolvedHotel早餐boolean及ResolvedLuggagePlan全局；增加新snapshot消费类型或显式compat mapping | 旧PlanVersion payload可读取 |
| UPDATE `apps/server/src/application.ts` | 复用2.3已装配PlanningInputs并注册必要新路由/服务 | 统一auth和安全日志 |
| UPDATE `docs/api/openapi.yaml`；生成 `packages/types/src/api-types.ts` | 当前是旧PlanGenerate/DayPlan/Quick-HQ等合同；新增StayNight、breakfast三态、LuggageTransition及same-as-previous/reconciliation命令。实现前OpenAPI先行并运行生成器；类型产物禁止手改 | 既有auth/header/error envelope及旧数据兼容读取 |
| UPDATE `packages/prisma/schema.prisma`及新增迁移目录 | 当前缺本Story目标StayRevision、LuggageTransitionRevision、logical stay与draft当前引用；按首用最小增量建立/扩展，实施时复核前序已加入的同名模型 | User/Session/CanonicalPOI/Inspiration/PlanVersion/EditEvent及旧Jobs数据与外键 |

NEW计划（当前尚不存在，除前序之后可能交付的同名模块外，实施前再检查并合并，禁止复制第二权威）：

- `apps/server/src/planning-inputs/{stays,luggage,stay-repository}.ts`、增量迁移及日期/CAS/寄存回归。2.3目录是前序未来输入，实施时先读再扩。
- `apps/mobile/src/planning-inputs/{AccommodationScreen,StayNightEditor,HotelPoiField,LuggageSheet}.tsx`及独立字段/容器测试。

### 关键实现与验收注意

酒店名称/行李原文属于私有输入，仅owner快照存储，不进公共搜索cache值或遥测。AMap失败必须保留typed不可用，不能沿source.ts catch返回[]后显示未找到。并发日期变化与同上必须在同一base revision核对前后晚；新来源POI facts要绑有效版本，不能静默更新历史StayRevision。

### 原型、资料与当前证据边界

- UX：`docs/ux/mobile-ia.md` S3；`_bmad-output/implementation-artifacts/visual/story-2-0-accommodation-per-night-r3.png`。choice sheets/blank后果/AMap失败尚需状态覆盖。
- 源条款：`_bmad-output/planning-artifacts/epics.md` 的 Story 2.5；工程责任：本文件frontmatter指定的当前catalog/delivery；附加绑定 FR27.1, FR36, FR41, FR44-lite, FR49, NFR8, NFR25。
- 领域架构：`docs/architecture/data-models.md`、`backend-architecture.md`、`planner-orchestration-v2.md`、`rest-api-spec.md`（后三者同在`docs/architecture/`）；`docs/tech-spec-epic-2.md`。完整事实/错误/安全边界依源Story，本Story未覆盖的跨城/编辑/天气不能因概括性架构被提前实现。
- 共享UI/Query/Router：`docs/architecture/ui-foundation.md`、`docs/architecture/frontend-data-navigation.md`、`docs/ops/ui-validation.md`。当前实际React19.2.7/Vite8.0.16/Fastify5.12.1/Prisma5/Capacitor8.5.2；不为采用工具自动升大版本。
- 本轮源码与官方资料依据：`_bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md`；适用研究：AMap文本搜索、RHF dirty与PG短事务、共享AppSheet/host。公开文档/静态检查是准备证据，真实外部能力按T0与源关闭AC单独核验。
- 既有Git历史7250a8a/534581c保留Story2.2编辑证据，10f940c保留PG修复；历史2.0/2.1只可借其有效owner/幂等/测试接缝，不复活Quick/HQ产品语义。当前未提交实现比HEAD更新，不从旧提交覆盖工作树。

## Dev Agent Record

### Agent Model Used

Codex；本记录为bmad-create-story准备，非dev-story执行。

### Debug Log References

_bmad-output/implementation-artifacts/2-5-preplanning-nightly-stays-breakfast-and-luggage-validation.md

### Completion Notes List

- 已准备源合同、具体实施任务和静态自查，所有实现Tasks未勾选；未执行代码、迁移、浏览器或真实服务验收。
- 准备状态由root独立审阅后推进；所有condition_progress继续以Sprint真实实施证据为准。

### File List

- _bmad-output/implementation-artifacts/2-5-preplanning-nightly-stays-breakfast-and-luggage.md
- _bmad-output/implementation-artifacts/2-5-preplanning-nightly-stays-breakfast-and-luggage-validation.md
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
