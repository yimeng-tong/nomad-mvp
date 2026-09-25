---
project: nomad-mvp
story_id: '2.4'
story_key: 2-4-unified-flight-and-rail-service-lookup
source_story_id: '2.4'
source_contract_sha256: dba3820da64fa52fa659fd6e4a9b74b3fb0fdbd120139023ef07a63a0b063a28
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
- FR14
- FR27.1
- NFR1
- NFR8
- NFR23
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
preparation_validation: _bmad-output/implementation-artifacts/2-4-unified-flight-and-rail-service-lookup-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
---

# Story 2.4: 统一班次识别与航班/铁路查询

Status: draft

> 本轮仅准备合同。源GWT按出现顺序记为AC1–AC14，下方Tasks据此逐项映射；源叙事、条款及补充保留原文。准备不解除1.7开发停止或3.1暂停。

## Story

As a 旅行者,
I want 在同一个输入框填写航班号或车次并获得可核查的班次信息,
So that 我不必先理解交通分类，查询失败时也仍能完成首末日时间确认.

**Requirements:** FR14, FR27.1 (exact flight/rail lookup); NFR1, NFR3,
NFR12, NFR17, NFR23; AR2-AR5, AR11, AR13-AR15, AR20; UX-DR3,
UX-DR7, UX-DR8, UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

## Acceptance Criteria

**Acceptance Criteria:**

**Given** 用户在 S2 的 `具体时间` 模式打开班次输入
**When** 输入航班号或铁路车次
**Then** 使用同一个输入框接收并规范化大小写、空格以及可安全移除的 `航班`/`次` 文案
**And** UI 不要求用户先选择飞机或火车，但允许在结果歧义或识别错误时明确改选交通类型

**Given** 规范化后的班次字符串准备分类
**When** 版本化 classifier 计算候选类型
**Then** 铁路候选使用可维护的客运车次规则与 Provider 能力，不把规则硬编码为只有 G/D/Z/T，也覆盖 C、K、S、Y、纯数字及配置中支持的其他类型
**And** 航班候选使用有版本和新鲜度的航司 designator registry，支持字母+字母、字母+数字或数字+字母二字码以及后续 3-4 位航班数字和 Provider 支持的可选 suffix

**Given** 字符串结构只明确支持一种交通类型
**When** classifier 返回单一候选
**Then** 服务端只调用对应的 flight 或 rail `TransportScheduleLookup` 适配器
**And** regex、首字母或客户端猜测只用于请求路由，最终类型和事实必须由 Provider 结果验证

**Given** 输入同时符合铁路规则与当前航司代码表，或者两类结构证据都不足以排除另一类
**When** classifier 返回 ambiguous
**Then** 服务端在同一有界查询上下文中并行调用 flight 与 rail 适配器，并分别应用超时、配额和熔断
**And** 不对所有输入无条件双查；两个 Provider 都返回可信结果时按 `飞机` 与 `火车` 分组展示，由用户选择而不是静默采用

**Given** 输入不符合任何当前支持的班次结构
**When** 用户提交查询
**Then** 不发起无边界的 Provider 猜测，并提供选择交通类型后重试或进入 Story 2.3 手工填写的路径
**And** 保留用户原输入和日期，不因分类失败清空另一边界或整个 S2 draft

**Given** flight Provider 返回一个或多个可信航段
**When** 服务端规范化结果
**Then** 每项包含营销/执行航班标识、航空公司、计划起降时间、机场、可用航站楼、source、observed_at、valid_until、quality 和 status
**And** 代码共享航班保留营销与实际承运关系并去除同一实际航段的重复展示，不把票价、余票、购票、登机口或延误承诺作为班次查询结果

**Given** rail Provider 返回一个或多个可信车次
**When** 服务端规范化结果
**Then** 每项包含车次、列车类型、计划到发时间、车站、source、observed_at、valid_until、quality 和 status
**And** 同车次跨日期、经停站组合或运行区间保持可区分，不推断余票、席别库存、检票口、停运或晚点实时状态

**Given** 查询用于到达或离开当前目的地的边界
**When** 结果按日期与城市上下文排序
**Then** 到达边界优先显示终点/经停到达当前城市的结果，离开边界优先显示从当前城市出发的结果
**And** 日期、城市和 terminal/station 相关性只能排序和解释候选，不能在多个可信结果之间替用户自动确认

**Given** 用户选择一个航班或铁路结果
**When** 服务端写入 planning draft
**Then** 到达边界使用该结果抵达目的地的计划时间与地点，离开边界使用从目的地出发的计划时间与地点，并以 expected revision 和幂等命令保存
**And** 保存 Provider/source、观测与有效期、原始类型和规范化班次身份；后台刷新不得静默覆盖用户已确认的 draft revision

**Given** 班次结果中的机场、航站楼或车站需要地点身份
**When** 服务端解析 terminal/station
**Then** AMap 只负责匹配 CanonicalPOI、坐标和路线地点，并保留歧义/不可用状态
**And** AMap 不得成为航班或铁路时刻、运行状态、票务和库存的数据来源

**Given** Provider 返回 no-match、ambiguous、cancelled、stale、超时、配额耗尽或 breaker-open
**When** 用户仍需确认边界
**Then** 结果不能保持 `confirmed`，界面保留已输入班次号与日期，并提供刷新、切换类型、手工填写、2 小时窗口或 `交给 AI 安排`
**And** 真实 no-match 在当前搜索区域显示 `未找到，可手动填写`，请求失败显示 `搜索暂不可用 · 重试`，详细原因与来源按需查看且不叠加弹窗；歧义、取消或过期结果仍须在采用前明确处理，任一 Provider 失败不抹去另一 Provider 的可信结果，也不阻塞用户使用 Story 2.3 的非查询路径

**Given** 班次查询在生产环境运行
**When** 读取航司代码表、缓存或外部 Provider
**Then** registry 与 classifier 均有版本，缓存键包含规范化班次、日期、类型、Provider 与策略版本，并执行 TTL、调用配额、并发、超时、重试预算和熔断
**And** 日志、Sentry、Langfuse 和分析只记录脱敏类型、结果数、状态、耗时和缓存命中，不记录完整私人行程、精确班次组合、token、手机号或 Provider secret

**Given** 用户通过触控、键盘或读屏使用统一输入与混合结果列表
**When** 输入、查询、切换类型、选择结果或回退
**Then** 加载、无结果、双类型、过期、失败和 disabled 状态具有标签、焦点管理、44pt 目标与非纯颜色表达
**And** 长航班/车次、长站名、跨午夜日期和 reduced-motion 模式均不溢出或改变布局

**Given** Story 2.4 准备关闭
**When** 使用包含 G/D/C/Z/T/K/S/Y、纯数字、字母数字航司码、代码共享、结构歧义、跨午夜、同号跨日、无结果、过期、取消、Provider 部分失败和 stale revision 的 fixture，并运行 OpenAPI/生成类型、classifier/adapter/缓存/隐私测试、真实 flight 与 rail Provider staging、AMap terminal/station staging、浏览器检查、完整构建和 diff 检查
**Then** 单输入框可以可靠路由、必要时双查并诚实保存航班或铁路边界，手工与 AI 降级保持可用
**And** 票务/余票/实时晚点、跨城市联程、逐晚住宿和路线矩阵不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 限定Provider与registry选择研究（AC: AC2, AC6, AC7, AC12, AC14）
  - [ ] 先形成中国flight/rail来源能力表：城市/日期/经停/代码共享/计划时间、更新与缓存许可、状态含义、配额/费用/超时、隐私与测试数据；记录所选候选和不支持项，实际资源与授权齐后才接staging。当前没有已选schedule Provider，不猜产品、不调用真实API。
  - [ ] 确定航司designator registry的合法来源、版本/hash/更新周期和过期行为；IATA查询页不等于可复制完整数据库。铁路规则由版本化客运规则+已选Provider能力维护；fixture不把不存在的生产能力报成功。

- [ ] T1 定义统一识别、候选与结果合同（AC: AC1, AC2, AC3, AC4, AC5）
  - [ ] 在TransportScheduleLookup中定义normalized code/date/context、flight|rail|ambiguous|unsupported分类及显式类型改选；安全规范化字母大小写/空白/航班/次，不删有意义suffix/前导字符。
  - [ ] 分类单一只调一个adapter，ambiguous在同一query deadline有界并行；两路独立错误保留另一可信结果。unsupported不发外部猜测，保留原输入日期并回2.3手工/window/AI。

- [ ] T2 规范化flight/rail事实并处理terminal（AC: AC6, AC7, AC8, AC10, AC11）
  - [ ] flight保留营销/执行航班与同一实际航段去重；rail按服务日期/区间/经停站形成稳定身份，跨午夜有timezone与service date。均保留source/observedAt/validUntil/quality/status；无ticket/seat/gate/delay承诺。
  - [ ] 使用当前城市和arrival/departure只排序而不自动确认；AMap CanonicalPOI解析terminal/station并保留多解/待定位，时刻表仅由schedule source决定。Provider返回cancelled/stale不能展示confirmed。

- [ ] T3 缓存、预算、隐私与迟到结果（AC: AC3, AC4, AC11, AC12）
  - [ ] cache键覆盖code、date、type、provider、registry/classifier/policy version及必要区间；TTL尊重validUntil。每适配器合并并发、限并行、deadline、有限retry/breaker，terminal能力失败不引发跨type重试风暴。
  - [ ] query generation绑定owner/session/draftRevision/direction/date/type；取消或修改后迟到响应不可写入字段。telemetry仅类型/数量/状态/耗时/cache，原班次组合/私人行程/Provider URL secret不入日志。

- [ ] T4 通过显式选择写入S2当前revision（AC: AC8, AC9, AC10, AC11）
  - [ ] 只在用户选择结果后调用2.3命令：server重新验证结果身份/有效期/城市方向，arrival取到达当前城，departure取离开当前城，expectedRevision+同operation事务保存事实快照。后台refresh只提示新事实，不覆盖已确认revision。
  - [ ] 返回no-match、ambiguous、cancelled、stale、timeout、quota、breaker-open各自typed状态；空结果显示“未找到，可手动填写”，请求失败显示“搜索暂不可用 · 重试”，在局部结果区保留输入并提供刷新/换类型/三种降级。

- [ ] T5 交付单输入混合列表与无障碍（AC: AC1, AC4, AC5, AC8, AC11, AC13）
  - [ ] 在BoundarySheet exact分支加入一个班次框、日期与查询；两种可信结果按飞机/火车分组，长站名/跨日清楚标示；用户改类型不丢另一边界。成功、empty、partial、stale、failed布局稳定，busy只禁相关提交。
  - [ ] 选中/重试/回退复用共享控件和AppSheet，44pt、label、首项焦点与关闭返回，详细来源按需展开不堆弹窗；不增加票务入口。

- [ ] T6 完成分类/双Provider/保存的证据矩阵（AC: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14）
  - [ ] 封存G/D/C/Z/T/K/S/Y/纯数字、字母数字航司、suffix、registry过期、代码共享、跨午夜、同号跨日、多经停、两边部分失败/全失败/无匹配、刷新后原选择、CAS冲突测试。
  - [ ] 合同与适配器fixture通过后，在获准staging分别证明真实flight/rail和AMap terminal/station请求及字段语义；文档、Key、mock或一种Provider成功不能替另一分支关闭。

- [ ] T7 持久化、恢复和数据保留证据（AC14；OPS-01、DB-CHANGE-01）
  - [ ] 针对选中ScheduleFact快照/查询策略元数据和既有PlanningDraft引用形成migration ID/源码摘要、前向应用、失败恢复和旧数据兼容方案；隔离真实PG验证owner/引用/幂等/不可变历史，按既有资格锁次序处理，不在事务中等待Provider。无schema变更也以实际diff给出限定依据。
  - [ ] 将本Story新增选中ScheduleFact快照/查询策略元数据和既有PlanningDraft引用纳入新实例恢复fixture并检验当前指针、回执和旧引用；实际每日全量/15分钟增量或PITR、最新删除抑制、异机目标和实测RPO仍是生产开放门槛，不以本地dump或1.7隔离证据全局关闭。

- [ ] T8 建立本能力指标与质量对照（AC14；METRICS-01、METRICS-02、METRICS-03、CODE-QUALITY-01）
  - [ ] 以`WL-EPIC2-4`封存版本、环境、样本、单路/双路请求量、真实匹配率、过期/部分失败/全失败、budget/cache与用户采用以及失败/unknown/重复分母；P50/P95使用同一阶段边界与nearest-rank，有效N和缺测分列、未知费用为null。真实staging基线、yimeng-tong版本化目标和同口径发布候选比较未齐前保持相应门槛开放。
  - [ ] 保存每个业务AC的正常/错误/竞态fixture与规则结果；涉及模型的变更另记录版本/变体/重复及真实人评，不能用模拟评价代替yimeng-tong。新改TS/React文件进入9.4真实typed lint，保留Promise/Hook/label负例与只减不增的旧例外；运行受影响领域/路由/mobile测试、typegen、全workspace build、diff检查，不用占位ci:lint结果报通过。

- [ ] T9 本Story共享UI和真实宿主关闭矩阵（AC14；APP-HOST-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01、shared-ui-adoption）
  - [ ] 将统一班次输入、飞机/火车分组列表和局部降级状态接Nomad `src/ui`的Field/Button/Tabs/AppSheet/AsyncState，依9.3唯一Portal、焦点/滚动/关闭管理和9.7返回协调；业务controller继续拥有dirty、回执、cursor与revision。9.6只管普通读取，显式禁用自动retry/focus/reconnect刷新，认证确认后按scope刷新；未知身份隐藏页面与Portal并拒绝迟到响应。
  - [ ] 9.4工作台保留本Story正常、loading、empty、partial/stale、失败/重连、disabled原因、长中文/200%字号、键盘、reduced-motion、身份未知/切换场景；MSW未声明请求失败且产品构建无mock。9.5 Chromium/Firefox/WebKit按固定字体/时区/viewport/版本留actual/expected/diff与trace，对照旧探针，不自动接受截图差异。
  - [ ] Android10+/WebView111+、iOS/Safari16.4+及Firefox128+分别记录跨午夜结果选择、后台回前台旧查询隔离、关闭Sheet不自动确认与重建恢复S2，核验44pt、读屏、键盘/安全区、背景遮蔽、恢复同一owner和未知写入不重交；WSL运行Node/pnpm，iOS原生构建使用获准macOS资源。native:sync/verify、APK编译和Web截图不等于真机/TestFlight；缺Mac/签名/设备保留该切片未验收。

## Dev Notes

### 实施入口、前序与边界

依赖2.3持久exact/manual输入及1.11有效CanonicalPOI规则，扩充其查询而不替换输入权威。查询本身为有界只读；用户确认才是draft mutation。班次能力未选的资源阻断仅作用于实际provider联调，手工/window/AI保持2.3路径。

所有前序交付需在实施时核对真实源码/证据；同批合同只说明未来输入，当前未实现能力不能伪装成已可调用。catalog的显式dependencies保持原值；`implementation_prerequisite_story_ids`补充源GWT的语义前提，不改变准备顺序或把后续Story当成前置。9.3的本地可验证共享组件切片、9.4/9.5质量工具及9.6/9.7实际adapter由各自Story交付，既有真实auth/原生门槛独立；普通准备不部署或外发。

### 当前文件与具体修改计划

| 类型 / 文件 | 当前实查与本Story改动 | 必须保留 |
| --- | --- | --- |
| UPDATE `apps/server/src/integrations/amap.ts` | 目前仅v3/place/text基本POI；作为地点匹配接缝或接1.11后续facade | 不从AMap生成航班/铁路时刻 |
| UPDATE `apps/server/src/application.ts` | 装配新transport查询路由 | 先鉴权/统一错误/关闭生命周期 |
| UPDATE `apps/mobile/src/planner/api.ts` | 尚无schedule查询；增加有AbortSignal的类型化请求 | 身份fence；保存仍由PlanningInputs命令 |
| UPDATE `apps/server/src/routes/search.ts` | 现有失败文案是酒店；按领域facade复用地点查询而非复制schedule实现 | 失败与真实空结果区分 |
| UPDATE `docs/api/openapi.yaml`；生成 `packages/types/src/api-types.ts` | 当前是旧PlanGenerate/DayPlan/Quick-HQ等合同；新增TransportScheduleLookup、分类结果、provider-neutral航段/铁路运行区间及typed降级。实现前OpenAPI先行并运行生成器；类型产物禁止手改 | 既有auth/header/error envelope及旧数据兼容读取 |
| UPDATE `packages/prisma/schema.prisma`及新增迁移目录 | 当前缺本Story目标选中ScheduleFact快照/查询策略元数据和既有PlanningDraft引用；按首用最小增量建立/扩展，实施时复核前序已加入的同名模型 | User/Session/CanonicalPOI/Inspiration/PlanVersion/EditEvent及旧Jobs数据与外键 |

NEW计划（当前尚不存在，除前序之后可能交付的同名模块外，实施前再检查并合并，禁止复制第二权威）：

- `apps/server/src/transport/{schedule-contract,classifier,registry,schedule-service,schedule-cache}.ts`、flight/rail adapter接缝与契约fixture；具体Provider实现文件在T0选定后命名。
- `apps/server/src/routes/transport-schedules.ts`、`apps/mobile/src/planning-inputs/ServiceLookupField.tsx`及mixed-results tests；2.3 BoundarySheet为未来UPDATE输入，当前尚未存在。

### 关键实现与验收注意

保留用户原字符串供当次修改但禁止发送到遥测；server-only key。AMap公共地点缓存与owner查询上下文分层，不用公开cache列出私人的完整班次组合。机场城市代码、服务日期/本地实际到达日、codeshare关联需要真实Provider证明，分类regex不授予事实可信度。不能把2.4不支持的某铁路类型静默描述成该车次不存在。

### 原型、资料与当前证据边界

- UX/原型同2.3：`docs/ux/mobile-ia.md` S2；`_bmad-output/implementation-artifacts/visual/story-2-0-time-transport-r3.png`与`story-2-0-transport-manual-entry-r1.png`（同目录）。混合/部分失败列表需按源AC补工作台。
- 源条款：`_bmad-output/planning-artifacts/epics.md` 的 Story 2.4；工程责任：本文件frontmatter指定的当前catalog/delivery；附加绑定 FR14, FR27.1, NFR1, NFR8, NFR23, NFR25。
- 领域架构：`docs/architecture/data-models.md`、`backend-architecture.md`、`planner-orchestration-v2.md`、`rest-api-spec.md`（后三者同在`docs/architecture/`）；`docs/tech-spec-epic-2.md`。完整事实/错误/安全边界依源Story，本Story未覆盖的跨城/编辑/天气不能因概括性架构被提前实现。
- 共享UI/Query/Router：`docs/architecture/ui-foundation.md`、`docs/architecture/frontend-data-navigation.md`、`docs/ops/ui-validation.md`。当前实际React19.2.7/Vite8.0.16/Fastify5.12.1/Prisma5/Capacitor8.5.2；不为采用工具自动升大版本。
- 本轮源码与官方资料依据：`_bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md`；适用研究：IATA代码治理、AMap只承担地点、PG CAS与缓存隔离。公开文档/静态检查是准备证据，真实外部能力按T0与源关闭AC单独核验。
- 既有Git历史7250a8a/534581c保留Story2.2编辑证据，10f940c保留PG修复；历史2.0/2.1只可借其有效owner/幂等/测试接缝，不复活Quick/HQ产品语义。当前未提交实现比HEAD更新，不从旧提交覆盖工作树。

## Dev Agent Record

### Agent Model Used

Codex；本记录为bmad-create-story准备，非dev-story执行。

### Debug Log References

_bmad-output/implementation-artifacts/2-4-unified-flight-and-rail-service-lookup-validation.md

### Completion Notes List

- 已准备源合同、具体实施任务和静态自查，所有实现Tasks未勾选；未执行代码、迁移、浏览器或真实服务验收。
- 准备状态由root独立审阅后推进；所有condition_progress继续以Sprint真实实施证据为准。

### File List

- _bmad-output/implementation-artifacts/2-4-unified-flight-and-rail-service-lookup.md
- _bmad-output/implementation-artifacts/2-4-unified-flight-and-rail-service-lookup-validation.md
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
