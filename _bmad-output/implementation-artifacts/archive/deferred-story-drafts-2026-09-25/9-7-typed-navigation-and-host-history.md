---
project: nomad-mvp
story_id: '9.7'
story_key: 9-7-typed-navigation-and-host-history
source_story_id: '9.7'
source_contract_sha256: 01f153d0a0ed7e04c3ee65f29d5771d0b062470df5504a1cc63c594adc27185f
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
- FR18
- FR49
- FR52
- NFR3
- NFR8
- NFR20
- NFR25
source_obligations:
- shared-ui-adoption
- typed-navigation-adoption
dependencies:
- 9-4-component-workbench-and-enforced-code-quality
- 9-5-browser-flow-and-visual-regression-gates
preparation_validation: _bmad-output/implementation-artifacts/9-7-typed-navigation-and-host-history-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
local_slice_dependency:
  story_key: 9-3-shared-ui-components-and-safe-app-sheet
  evidence_gate: shared-ui-local-regression-passed
---

# Story 9.7: 通过统一导航打开和返回现有页面

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 在网页与App间访问Nomad的旅行者,
I want 刷新、直达、返回与经过验证的深链都能进入正确页面,
So that 我能保留合法上下文且导航不会重复提交业务动作.

**Requirements:**FR18、FR49、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、AR23、AR28；UX-DR1、UX-DR3、UX-DR32、UX-DR36。

**范围：**现有Home、Settings、Planner/DayPlan与S0–S11类型约定；不创建未来假页面。可通过当前读取adapter实施，不强制等待9.6；与Query分开改动和验收。

#### 9.7-AC1

**Given** 用户拥有可访问的现有页面或计划引用
**When** Web刷新、直达或浏览器前进/后退
**Then** 部署fallback及typed参数解析恢复正确页面或可理解错误，日期/scope/id不能按名称猜测
**And** 未实现页面不可被路由表伪装为已经交付

#### 9.7-AC2

**Given** 导航参数可能包含不可信输入或私密业务内容
**When** 生成、解析、记录URL或访问历史
**Then** 只接受允许的public reference和有限状态，不写token、私人原文、受保护URL或完整草稿
**And** 日志/遥测遵循原字段和值级脱敏

#### 9.7-AC3

**Given** Android存在键盘、顶层Sheet和页面历史
**When** 用户返回一次
**Then** 唯一协调入口按层级消费一次，根层遵循平台行为，原未提交保护可生效
**And** 旧App/页面handler不会同时后退、提交或退出

#### 9.7-AC4

**Given** 原生冷暖启动收到外部链接或认证回调
**When** 现有校验链确认可用typed intent
**Then** router只处理获准导航，未知/重复/过期/跨owner输入按原合同拒绝或恢复
**And** 原始appUrlOpen不直接作为内部路由或登录证明

#### 9.7-AC5

**Given** 当前页面有草稿、滚动位置或暂时弹层
**When** 离开、返回或恢复无效的日期/资源引用
**Then** 保留原有可确认草稿及合法scroll/focus，无效上下文回到安全parent
**And** 不把表单dirty当持久保存、不重播过期Sheet或undo令牌

#### 9.7-AC6

**Given** 身份尚未确认或在loader期间变化
**When** 访问私有路由、预取或异步读取返回
**Then** guard与portal共同遮蔽，私有自动prefetch关闭或明确受控，原transport仍执行权限与代际校验
**And** navigation/loader不启动planning、重交mutation或改变operation身份

#### 9.7-AC7

**Given** 现有入口完成导航迁移
**When** 在网页、Android和iOS验证刷新/深链/返回/身份/草稿组合
**Then** 结果绑定当前源码与实际平台，旧路由兼容或拒绝规则明确，回退不会丢弃业务数据
**And** 缺原生资源时只报告已验证切片，不用浏览器history模拟完整App验收

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 建立受限typed route和部署history合同（源场景 1、2）
  - [ ] 锁TanStack Router1精确版本，使用最小代码式路由树匹配现有页面；把允许public reference、日期/scope/source的schema和无效parent回退列成表，未知/越权保持安全错误，不按城市名称猜ID。
  - [ ] Web验证真实部署fallback、刷新/直达/back/forward；原生history独立于外部URL输入。URL/search/history/log只含允许字段，无token、输入原文、私有URL、完整draft；禁止把handoff对象整个序列化。

- [ ] T2 迁移App现有导航并保留页面业务状态（源场景 1、5、6）
  - [ ] 替换App view/plannerHandoff的导航责任，保留auth recheck、epoch、logout回执与Dock生命周期；Planner/DayPlan只以合法已存在start/plan上下文渲染，不让loader自动POST /plan/create。
  - [ ] scroll/focus以合法route+owner隔离恢复，transientSheet和undo令牌不写history；读取失效date/resource回安全parent。原draft仍由领域持久化机制决定，表单dirty只触发离开保护，不能称已保存。

- [ ] T3 统一host返回与离页保护（源场景 3、5）
  - [ ] 单一协调入口按keyboard/topSheet/page/root消费，每次back只走一层；当前App0、Planner10、Home20、DayPlan30、SlotEdit40和identity1000返回责任逐一对照迁移，取消重复handler。
  - [ ] 对busy/未确认写入/dirty状态复用原领域关闭策略；Router useBlocker withResolver的proceed/reset与beforeunload行为独立测试，Android系统返回与浏览器history不互相重复触发。

- [ ] T4 只接受已验证深链与身份安全loader（源场景 2、4、6）
  - [ ] 原生appUrlOpen先经input-v1/认证callback验证、过期/一次性/owner检查，输出typed intent才交router；冷启动未登录暂存不执行，登录后只恢复同一已批准动作。
  - [ ] 私有prefetch关闭，loader只读且使用现有认证transport/activity fence；checking/unavailable先遮蔽页面与Portal；旧loader迟到不得写新owner或导航，地址栏不能提供权限。

- [ ] T5 验证网页、native和迁移回退（源场景 1、2、3、4、5、6、7）
  - [ ] 覆盖Web刷新/直接URL/缺失参数/前后退、权限切换与迟到loader、草稿离开/取消、滚动焦点及最顶Sheet；断言导航没有新增收费调用或重交原operation。
  - [ ] 真实Android/iPhone验证冷暖深链/认证回调/键盘Sheet页面返回和根层行为，记录最低平台/当前构建；浏览器history模拟不能关闭native场景。
  - [ ] 旧route兼容或明确拒绝策略与逐消费点回退记录，不为回退清业务库/IDB；Query改造不同commit/证据，方便定位两层回归。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] APP-HOST-01：在本 Story 实际 Android/iOS 页面与能力上核验返回键、键盘、安全区、权限、前后台/进程重建和 owner 隔离；iOS16.4+及批准Android矩阵、Web Safari16.4+/Firefox128+分别记录。无页面/权限分支须给具体不适用理由，构建与浏览器不能代替真机。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-COMPONENT-01：本 Story 的明确页面消费 Nomad 基础/组合组件，沿用批准品牌与布局；Portal跟随身份遮蔽，焦点/滚动/受控关闭/状态不破坏原领域合同，旧兼容组件记录退出责任。
  - [ ] UI-WORKBENCH-01：本 Story 新增或修改的组件补正常、空、loading、error、partial/reconnect、长中文、200%字号、身份未确认等适用场景及交互/a11y；复用9.4隔离MSW，未声明网络必须失败，开发入口不入产品。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；关闭证据：当前源码组件/浏览器/适用原生证据，逐Story关闭
  - [ ] typed-navigation-adoption：typed route、Web刷新/直达、已验证深链、唯一host返回与草稿/身份保护；关闭证据：现有页面Web/原生证据，导航不写业务，缺失页面不假可达

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

在9.4/9.5和9.3已验证local UI切片之后，串行独立实施Router；可使用现有读取adapter，不依赖9.6整张完成。只让已存在Home/Settings/Planner/DayPlan可达，S0–S11建立typed约定，不为未来页面创建假入口。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2 | T1 建立受限typed route和部署history合同 |
| 1、5、6 | T2 迁移App现有导航并保留页面业务状态 |
| 3、5 | T3 统一host返回与离页保护 |
| 2、4、6 | T4 只接受已验证深链与身份安全loader |
| 1、2、3、4、5、6、7 | T5 验证网页、native和迁移回退 |

### 当前代码、改动位置与保留行为

UPDATE：App.tsx 当前view home/settings与plannerHandoff决定页面，accept身份变化清导航，priority0页面返回及priority1000安全遮蔽；迁移需保留它的认证/会话序列和未知logout协调。HomeScreen.tsx routeForCard/Selection含城市名称，只能作为旧hint不可成为新稳定身份，onPlannerHandoff不负责新规划写入。

UPDATE：PlannerScreen.tsx 的confirm/picker/L2/planStart局部状态和priority10 handler只按现有真实页面迁移，DayPlan旧start依赖与SSE行为需明确不在loader重建业务任务。platform/host及input-v1验证链为复用接口，实施前完整重读对应当前版本，不新增原始URL直达绕过。

NEW：apps/mobile/src/navigation/route-contract.ts、router.tsx、host-history.ts及导航测试；部署fallback配置按实际homelab/生产环境定位后改，不能假定已配置或创建未实现S0–S11页面。

### 验证策略与资源门槛

单元校验route schema/安全parent/拒绝私有参数，三个浏览器关键入口及history真实刷新，统计planning/import POST保持0；native真实返回与外链独立。blocker取消后输入完整，身份失效优先遮蔽；URL、trace、页面历史不泄漏秘密。无native资源只关闭已验证local切片。

### 既有实现与版本调查

官方Router navigation-blocking文档核验useBlocker、withResolver、proceed/reset和enableBeforeUnload；浏览器unload不保证应用保存，应沿用领域journal。受控路由是导航层不是权限或mutation层；精确包版本与升级证据见本批研究。

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

- _bmad-output/implementation-artifacts/9-7-typed-navigation-and-host-history.md
- _bmad-output/implementation-artifacts/9-7-typed-navigation-and-host-history-validation.md
