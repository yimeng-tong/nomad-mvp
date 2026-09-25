---
project: nomad-mvp
story_id: '9.6'
story_key: 9-6-identity-scoped-server-read-queries
source_story_id: '9.6'
source_contract_sha256: 489871535ac1504f9947c67a81b224886d2a1d9254882169f6bc5af7d93ed65c
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: draft-pending-independent-validation
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR2
- FR3
- FR18
- FR52
- NFR3
- NFR8
- NFR20
- NFR25
source_obligations:
- shared-ui-adoption
- identity-scoped-read-adoption
dependencies:
- 9-4-component-workbench-and-enforced-code-quality
- 9-5-browser-flow-and-visual-regression-gates
preparation_validation: _bmad-output/implementation-artifacts/9-6-identity-scoped-server-read-queries-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
local_slice_dependency:
  story_key: 9-3-shared-ui-components-and-safe-app-sheet
  evidence_gate: shared-ui-local-regression-passed
---

# Story 9.6: 以身份隔离的共享读取层展示城市与灵感

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 使用Home与Planner的旅行者,
I want 读取和刷新城市及我的灵感时获得一致可靠的状态,
So that 页面切换不会重复请求或显示其他身份的旧内容.

**Requirements:**FR2、FR3、FR18、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、AR27；UX-DR5、UX-DR13、UX-DR32、UX-DR36。

**范围：**只迁移现有Home/Planner普通读取，未来已发布行程由所属Story扩展；不替代auth、mutation、journal或durable SSE。先前UI质量门禁可用即可，无须Router完成。

#### 9.6-AC1

**Given** 当前身份已确认且两个现有消费点请求同一城市或owner灵感资源
**When** 使用统一Query adapter读取和刷新
**Then** transport与类型合同保持，共享读取可去重，公共/私有命名空间及筛选/版本key正确
**And** 只读不会启动新的收费能力或业务写入

#### 9.6-AC2

**Given** 私有缓存存在，随后身份未知、撤权或owner/session变化
**When** 页面重渲染或旧请求迟到
**Then** 未确认时不显示私有cache/placeholder，取消旧请求并清理旧上下文，迟到结果不得进入新身份视图
**And** 不把query key或路由参数当服务端授权证明

#### 9.6-AC3

**Given** 宿主恢复、网络恢复或页面重新聚焦
**When** Query可能触发刷新
**Then** 先由现有身份恢复协调器核实，再按显式资源策略读取，默认自动retry/focus/reconnect策略已受控
**And** 不与原控制器重复恢复或隐藏叠加重试

#### 9.6-AC4

**Given** 列表为空、失败、仍有合法旧数据或分页进行中
**When** 用户查看或手动重试
**Then** 显示准确状态、保留可合法读取的内容并防止页面覆盖新筛选结果
**And** 权限失效立即移除旧数据，不把读取失败当empty或服务端任务失败

#### 9.6-AC5

**Given** 同一应用存在导入operation journal、durable cursor和未完成mutation
**When** 安装Query adapter并切换页面
**Then** 这些责任仍由原控制器处理，Query首批不持久化私有cache也不排队重放mutation
**And** 断网/重启不产生新的operation或重复写入

#### 9.6-AC6

**Given** Home/Planner试点准备关闭
**When** 运行取消/去重/跨owner/刷新/状态回归与当前平台验收
**Then** 证据证明两个真实消费点使用同一读取层，旧读取adapter可独立回退且不清数据库或operation日志
**And** 未迁移资源清单明确，不宣称整个应用缓存已统一

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 定义真实资源分区和Query adapter（源场景 1、5）
  - [ ] 建立类型化query key工厂、统一QueryClient和现有bound transport adapter，精确锁TanStack Query5及peer；key含owner、必要session/epoch、资源/筛选/版本，不包含凭据/私人原文。
  - [ ] 当前GET /library/cities是owner私有灵感汇总，必须与/inspirations一起隔离；未来2.7公共城市目录才用公共命名空间，不能按cities名字猜公共。请求只读、不启动AI/规划，不添加持久化private cache或mutation重放插件。

- [ ] T2 按身份及活动代际取消和清除私有读取（源场景 2、3、5）
  - [ ] 未知/检查中/不可用身份enabled=false且页面不读取旧cache/placeholder；epoch/owner/session变化先遮蔽、取消旧请求与清理旧context，再启新client读取。consume AbortSignal，native取消桥保持。
  - [ ] queryFn继续用createBoundJsonRequest的owner/session/activity fence，网络最终成功也不得把旧结果写进新身份；捕获auth错误由原协调器recheck，不在Query另建登录恢复。

- [ ] T3 显式刷新、重试与状态展示（源场景 3、4）
  - [ ] 默认关闭自动retry、focus/reconnect refetch；staleTime/gcTime与手动刷新按资源显式声明，host resume先认证确认再单次读取，不让focusManager叠加原App foreground恢复。
  - [ ] 区分empty、首次error、合法旧数据+refresh error、分页partial；过滤/分页key变化禁止迟到覆盖，401/资格失效立刻清私有数据。为并发读取去重与取消制定可测计数。

- [ ] T4 迁移两个现有真实消费点（源场景 1、4、6）
  - [ ] HomeScreen当前refresh Promise.all(setLoading/notice)替换为query读模型并保留选择、候选/结果请求token、Dock/FIFO显示；PlannerScreen的Promise.allSettled与cancelled flag替换共享query，同时保留合法selectedIds及handoff，不在缓存层修订领域数据。
  - [ ] getCities/getInspirations类型和transport扩展AbortSignal，保持现有依赖注入测试入口；共享同一owner+filter并发不重复请求，未迁移candidate/getIngestResult/未来Trip读取登记清单。

- [ ] T5 验证读取隔离与独立回退（源场景 1、2、3、4、5、6）
  - [ ] 浏览器/单元覆盖两消费点并发去重、A→B→A、同owner新session、迟到结果、403/断网、筛选倒序、恢复重复focus、原journal/cursor未改变；原PG鉴权证据仍独立。
  - [ ] 锁文件/源码/运行环境与真实host恢复结果存证，Query适配层可退回旧读取而不清数据库/操作日志；不得将本试点宣称全应用缓存统一或整native闭环完成。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] APP-HOST-01：在本 Story 实际 Android/iOS 页面与能力上核验返回键、键盘、安全区、权限、前后台/进程重建和 owner 隔离；iOS16.4+及批准Android矩阵、Web Safari16.4+/Firefox128+分别记录。无页面/权限分支须给具体不适用理由，构建与浏览器不能代替真机。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-COMPONENT-01：本 Story 的明确页面消费 Nomad 基础/组合组件，沿用批准品牌与布局；Portal跟随身份遮蔽，焦点/滚动/受控关闭/状态不破坏原领域合同，旧兼容组件记录退出责任。
  - [ ] UI-WORKBENCH-01：本 Story 新增或修改的组件补正常、空、loading、error、partial/reconnect、长中文、200%字号、身份未确认等适用场景及交互/a11y；复用9.4隔离MSW，未声明网络必须失败，开发入口不入产品。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；关闭证据：当前源码组件/浏览器/适用原生证据，逐Story关闭
  - [ ] identity-scoped-read-adoption：Home/Planner读取迁移，owner隔离/取消/刷新重试受控；保留auth/journal权威；关闭证据：真实消费点与跨owner/恢复反例及独立回退

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

9.4/9.5真实可用且9.3的shared-ui-local-regression-passed切片已验证后实施，不要求9.3整张原生closure或9.7完成。只迁移Home/Planner普通城市与owner灵感读取；读取以外的auth、journal、mutation、SSE/ACK、任务恢复维持原职责。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、5 | T1 定义真实资源分区和Query adapter |
| 2、3、5 | T2 按身份及活动代际取消和清除私有读取 |
| 3、4 | T3 显式刷新、重试与状态展示 |
| 1、4、6 | T4 迁移两个现有真实消费点 |
| 1、2、3、4、5、6 | T5 验证读取隔离与独立回退 |

### 当前代码、改动位置与保留行为

UPDATE：HomeScreen.tsx 用Promise.all读取cities/inspirations，filter改变会重新refresh，错误notice与loading本地管理；保留selectedItems、candidate/result请求token、Dock active。PlannerScreen.tsx 当前Promise.allSettled只取消setState，未传AbortSignal；selectedIds初始化于handoff，读取失败仍保留手动选择，视图以local state切换。

UPDATE：apps/mobile/src/home/api.ts的getCities/getInspirations与planner/api.ts若复用其接口需传signal；auth/transport.ts已有scope epoch、activity及native取消，保持权威，不用query key代替服务端认证。App.tsx按epoch建立实例且统一recheck负责前台恢复，Query provider接入同一生命周期。

NEW：apps/mobile/src/data/query-client.ts、keys.ts、library-queries.ts及隔离测试（建议）；城市公共directory尚未由2.7交付，不发明现成公共endpoint。

### 验证策略与资源门槛

测相同private key两消费者一次HTTP，不同owner绝不共享；信号确实取消Web/native请求，不只忽略setState。取消且迟到成功不可缓存/重开Portal，placeholder跨身份不可见；手动重试不启动写入。使用9.4 MSW状态加真实现有鉴权transport/host恢复范围，fixture不能证明真实供应商或原生已验收。

### 既有实现与版本调查

AR27优先于Query默认值，显式关闭自动重试与focus/reconnect。官方重要默认行为页本轮访问超时，不能凭最新文档推断改变；以已批准ADR和安装时所锁5.x API核验，实施前核对cancelQueries/removeQueries及AbortSignal行为。精确候选来自本批registry记录，不自动升级React或持久化插件。

### 引用

- CURRENT.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
- docs/architecture/ui-foundation.md
- docs/architecture/frontend-data-navigation.md
- docs/architecture/app-host.md
- docs/front-end-spec.md
- docs/ops/ui-validation.md
- _bmad-output/implementation-artifacts/research/story-9-4-repository-context-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-4-tooling-research-2026-09-25.md
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 本批准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 准备验证和独立审阅记录在同名 validation；所有开发任务保持未勾选。

### File List

- _bmad-output/implementation-artifacts/9-6-identity-scoped-server-read-queries.md
- _bmad-output/implementation-artifacts/9-6-identity-scoped-server-read-queries-validation.md
