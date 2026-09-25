---
project: nomad-mvp
story_id: '7.3'
story_key: 7-3-settings-account-and-available-actions
source_story_id: '7.3'
source_contract_sha256: 00ebace7faeb29282e7d41d872c101acf6e6cf44b098df26ce22ecde5387198c
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
- FR12
- FR25
- FR52
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/7-3-settings-account-and-available-actions-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 7.3: 设置页账号与可用操作

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 在设置中确认当前账号，找到实际可用的账户操作，并能安全退出登录,
So that 我能管理和继续使用自己的行程，而不必了解模型密钥或平台内部额度。

**Requirements:** FR12 (Settings/account entry), FR25 (available-action/recovery boundary),
FR38 (preserve internal enforcement, no quota UI), FR49 (existing navigation);
NFR3, NFR7 (entry only), NFR8, NFR20;
AR1-AR5, AR12-AR15, AR17-AR20, AR22 (operator boundary);
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 用户确认账号与可用操作范围；不展示额度。
**Visual reference:** `story-7-3-account-actions-r2.png`；R1 用量方案已被取代。
数据/反馈入口按实际部署开放，本 Story 不交付 7.4-7.6 的完整业务流程。

**Acceptance Criteria:**

**Given** 用户从 Home/Library 的既有菜单进入设置
**When** 浏览或返回
**Then** 仅呈现账号和已部署的可用操作，返回恢复来源页状态
**And** 不提供 AI 用量/使用情况/全局生成状态面板，也不引入打卡、相册或营销页

**Given** 会话有效且可能缺少可展示账号信息
**When** 渲染账号区域
**Then** 使用已有安全信息，缺失时显示 `已登录 / 当前账号`
**And** 不展示原始 user/device/session id、不编造手机号昵称、不增加账号行跳转箭头或资料编辑

**Given** 读取设置可用动作或操作受到后台额度保护
**When** 返回和呈现用户信息
**Then** 不返回用于用户展示的账户用量、余额、上限、百分比、重置时间、token 或预算，不提供相应页面
**And** 不用低额度/额度已用完等分级暴露额度；服务端计量、限流、预算和熔断仍生效

**Given** 用户打开设置或刷新
**When** 初始化客户端请求和 UI
**Then** 不调用用户侧 key 查询/验证/保存/删除，不出现 Key 引导或内部 Provider 名称
**And** 不因移除 UI 自动删除历史密钥或重写兼容端点策略

**Given** 某数据、隐私或反馈能力未部署、已可用或暂时失败
**When** 构造操作入口
**Then** 只开放真实可用的目标；未部署能力不伪装可执行，已部署但暂时失败的能力保留诚实恢复路径
**And** 目标再次鉴权/校验，不能靠客户端旗标或直接深链绕过；账号/隐私操作不被 AI 额度面板额外阻断

**Given** 设置包含数据导出、删除账号、隐私政策及反馈的可用入口
**When** 用户选择目标
**Then** 进入该目标自己的确认和处理流程，不在 Settings 打开时直接发起导出/删除或声称反馈已送达
**And** 7.4/7.5/7.6 仍负责完整流程；7.3 可独立交付，后续按真实能力开放而非依赖其先实现

**Given** 某操作当前不可执行或已有任务可恢复
**When** 显示可用动作
**Then** 仅提供真实的稍后重试、查看原任务进度或返回手动编辑路径，不暴露额度数字/原因
**And** 不伪造已排队/服务故障，不自动重试 AI；真实任务阶段、处理数量和导出图片份数继续在原页面显示

**Given** 用户选择退出当前账号
**When** 确认且服务端成功撤销当前会话
**Then** 清除私有客户端缓存/挂起响应与当前 cookie，返回登录页；取消确认不改会话
**And** 不删除账号/已保存行程、不撤销其他设备、不取消已受理任务

**Given** 存在未保存输入、会话失效，或退出失败/结果不明
**When** 处理离开
**Then** 复用既有保存/离开保护与重新登录流程，只承诺已保存内容可恢复
**And** 不假报服务端撤销成功，提供重试/核实，避免旧账号数据暴露给后续账号

**Given** 设置读取中、失败、部分能力未知或账号发生切换
**When** 更新内容
**Then** 使用稳定加载/局部重试状态，未知不视为可用，不用旧账号的身份/动作结果填充
**And** 请求有界且只读，关闭或切换账号后丢弃迟到响应，不后台轮询或调用 AI/高德探测可用性

**Given** 用户从设置返回已有计划
**When** 浏览、手动编辑或恢复原任务
**Then** 原有版本、scope、冲突校验、确认和撤销规则不变，不因隐藏额度而放松服务端保护
**And** 设置读取/导航不增加 PlanningJob、PlanRevision、TripRevision、产品用量或 Telegram 通知

**Given** 动态字体、长账号提示、键盘、读屏或 reduced-motion
**When** 使用列表和退出 Sheet
**Then** 至少 44pt 目标、图标有名称、状态不只靠颜色，文字不盖住操作，焦点约束和返回明确
**And** 只读账号不伪装按钮，未部署项不出现误导性可执行箭头，列表不嵌套装饰卡片

**Given** 实现本 Story
**When** 修改现有 Settings、认证客户端和必要的安全动作投影
**Then** 遵守 OpenAPI SSOT、生成类型并复用现有 auth/logout，正常状态连接真实可用目标而非全 mock
**And** 不实现账户用量汇总、配额引擎、运营后台、设备管理或后续数据/反馈业务链

**Given** 本 Story 准备验收
**When** 测试只读身份/缺资料、能力开关/暂时失败、退出成功/失败/取消、账号切换、BYOK 残留和长文案
**Then** 通过契约/route/mobile、必要真实会话撤销核验、手机与桌面截图、workspace build
**And** 证明无用户额度字段/UI、无 key 请求、无自动生成/计量副作用，已有任务真实进度和行程保护不受影响

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C15 — App：原生退出与账号切换

**Given** App 已有当前会话、私人缓存及可能迟到的原生插件/网络响应
**When** 用户确认退出当前会话并随后登录另一账号
**Then** 复用 1.0 持久退出结论，清理适用原生凭据/缓存并拒收旧 owner 的迟到结果，其他设备仍按原规则可用
**And** 不以删除本地凭据代替服务端撤销，也不扩大为账号删除或取消已受理业务任务

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 移除延期用户路径并投影安全账号信息（源场景 1、2、3、4）
  - [ ] Settings取消BYOK查询/验证/保存/删除和内部Provider/额度展示；不因移除UI自动删历史secret或改变兼容端点策略。账号只显示已有安全信息，缺项为已登录/当前账号，去raw user/device/session id与假资料跳转。
  - [ ] 只读安全动作projection不含用量/余额/限额/重置时间/token字段；后台预算限流仍执行，用户界面不分级泄漏额度。

- [ ] T2 按真实部署构造可用入口与恢复动作（源场景 5、6、7、10）
  - [ ] 未部署能力不假可点击；已部署暂不可用保留真实重试/原任务进度/返回路径，unknown不当available；目标接口再次鉴权，不能靠front flag深链绕过。
  - [ ] Settings只导航到所属完整流程，mount/refetch不发导出/删除/反馈/AI/AMap；无后台探测式收费调用或无界poll。部分读取错误限模块、late旧owner忽略。

- [ ] T3 复用真实当前退出和未保存保护（源场景 8、9、11、15）
  - [ ] 用App/1.0已有logoutCurrentSession稳定operation及未知回执核对；确认成功后清适用private/native缓存，其他设备和已受理任务继续，取消不改变会话。
  - [ ] 原未保存输入离开保护、auth unavailable与重新登录沿用；不以localclear称服务器退出成功，不新建账号删除/撤全设备。返回来源页保留合法plan/scope/revision及原冲突/undo。

- [ ] T4 统一Settings共享组件与验证（源场景 12、13、14、15）
  - [ ] 使用Nomad列表/字段/受控退出Dialog，44pt、图标名、大字号长提示、focus restore及Android层级返回；只读账号无箭头、不套装饰卡片。
  - [ ] 真实会话验证退出成功/失败/取消/未知、身份切换，网络计数证明无BYOK/额度/规划副作用；契约/路由/手机桌面截图及App原生凭据/迟到插件路径分别存证。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] DB-CHANGE-01：仅为本 Story 实际 schema/索引/回填变化制定绑定 migration 与源码的恢复方案，真实匹配版本隔离 PG 验证；选择可逆、前向修复或 PITR，不清旧库解决问题。若没有数据库变更，关闭时给出可检查的不适用依据。
  - [ ] METRICS-01：在本 Story 首次消费处复核版本化事件/分母/时间窗/归因、隐私选择与脱敏，记录失败/取消/部分/未知；不等8.1才接线，不复制原始输入/位置/私有链接/凭据。
  - [ ] METRICS-02：分别记录本 Story 实际延迟/成功率/成本的样本、环境、并发与失败；真实基线及正式目标未确认时保留未验收，不用 fixture 或原型数字填通过。
  - [ ] METRICS-03：为本 Story 领域规则保留封存样本、版本和逐规则fixture，完整记录case/variant/repeat及失败/缺失；计分、提醒和需人评分别列出，不设置统一质量硬否决。早期规则测试不等待8.2；8.2真实yimeng-tong评分/评语和封存报告另为人评门槛，不能用合成证据关闭。
  - [ ] APP-HOST-01：在本 Story 实际 Android/iOS 页面与能力上核验返回键、键盘、安全区、权限、前后台/进程重建和 owner 隔离；iOS16.4+及批准Android矩阵、Web Safari16.4+/Firefox128+分别记录。无页面/权限分支须给具体不适用理由，构建与浏览器不能代替真机。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-COMPONENT-01：本 Story 的明确页面消费 Nomad 基础/组合组件，沿用批准品牌与布局；Portal跟随身份遮蔽，焦点/滚动/受控关闭/状态不破坏原领域合同，旧兼容组件记录退出责任。
  - [ ] UI-WORKBENCH-01：本 Story 新增或修改的组件补正常、空、loading、error、partial/reconnect、长中文、200%字号、身份未确认等适用场景及交互/a11y；复用9.4隔离MSW，未声明网络必须失败，开发入口不入产品。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；关闭证据：当前源码组件/浏览器/适用原生证据，逐Story关闭

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

独立交付账号安全信息和实际可用动作；7.4/7.5/7.6完成自己的数据/反馈闭环后通过真实能力开放入口，不成为7.3前置。已批准R2取代用量R1，不增加用户额度、Key管理或设备后台。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、4 | T1 移除延期用户路径并投影安全账号信息 |
| 5、6、7、10 | T2 按真实部署构造可用入口与恢复动作 |
| 8、9、11、15 | T3 复用真实当前退出和未保存保护 |
| 12、13、14、15 | T4 统一Settings共享组件与验证 |

### 当前代码、改动位置与保留行为

UPDATE：SettingsScreen.tsx当前mount调用getByokStatus，展示raw currentUser.user.id/session.device_id，内含Key、导出/删除单按钮及mailto反馈；按本范围移除用户BYOK和伪可用入口，不实现7.4–7.6。settings/api.ts中历史方法可按调用范围隔离，后端兼容端点不随UI删除。

UPDATE：App.tsx已有pendingLogout/sequence/probe、AUTH_CONTEXT_CHANGED核对和auth shield，是退出真实权威；只适配sharedDialog/导航消费。server安全动作read model若缺则NEW，不用AI/高德实时探测来判断可用。

NEW：必要actions projection/schema/tests；source原型story-7-3-account-actions-r2.png，旧settings-usage-logout-r1.png仅历史，不复制用量卡。

### 验证策略与资源门槛

证明Settings GET响应无秘密与额度字段，mount没有任何user Key请求；真实两个设备一个退出另一个有效。mock测error/late/aria，真实PG/session/native存储分别验证，不能全mock开放数据入口。

### 既有实现与版本调查

历史1.5done保留，只当前7.3补目标合同。现有Settings的taskStatusLabel把非queued/in_progress/done统归失败，后续7.4/7.5未知读取不能沿用此函数假终态；本Story仅把导航交给各业务流程。

### 引用

- CURRENT.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
- docs/prd.md
- docs/architecture/data-models.md
- docs/architecture/backend-architecture.md
- docs/architecture/frontend-architecture.md
- docs/architecture/frontend-data-navigation.md
- docs/architecture/app-host.md
- docs/front-end-spec.md
- docs/architecture/testing-strategy.md
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 本批准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 准备验证和独立审阅记录在同名 validation；所有开发任务保持未勾选。

### File List

- _bmad-output/implementation-artifacts/7-3-settings-account-and-available-actions.md
- _bmad-output/implementation-artifacts/7-3-settings-account-and-available-actions-validation.md
