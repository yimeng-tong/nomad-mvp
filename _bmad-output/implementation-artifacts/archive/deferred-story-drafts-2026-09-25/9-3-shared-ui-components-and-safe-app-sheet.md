---
project: nomad-mvp
story_id: '9.3'
story_key: 9-3-shared-ui-components-and-safe-app-sheet
source_story_id: '9.3'
source_contract_sha256: 1068161ce8180a56148f85f34f668ba8d5451ff2d4dd6c818fad26bbbf68e323
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
- FR1
- FR18
- FR52
- NFR3
- NFR7
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies:
- 9-4-component-workbench-and-enforced-code-quality
- 9-5-browser-flow-and-visual-regression-gates
preparation_validation: _bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 9.3: 在现有入口使用统一且安全的 Nomad 组件

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 在网页或手机使用 Nomad 的旅行者,
I want 登录、输入和临时弹层具有一致的视觉与系统交互,
So that 我能保持上下文完成操作，并在身份变化时不会看到旧的私有内容.

**Requirements:**FR1、FR18、FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR5、AR12、AR15、AR17–AR20、AR23–AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**9.4工作台/代码检查和9.5现有流程基线已可用；复用9.1已实现的host接口。采用已获批的网页矩阵。交付现有登录控件与一个Home临时层的实际适配，以及当前退出确认的共享基础；相同修改的领域验收由1.0/1.6记录，不要求其整张done形成循环。完整7.3或未实现页面不属于本Story。

#### 9.3-AC1 — 品牌与可复现组件来源

**Given** 现有批准视觉及精确依赖/生成来源已记录
**When** 构建并打开新的基础组件及现有登录代表性页面
**Then** 展示的是Nomad现行颜色、字号、间距、圆角与触控规则，并能追溯CLI、registry、组件源码和lockfile
**And** 业务页面没有散落第二套交互基础或未经批准的新主题，旧页面无全局reset导致的布局变化

#### 9.3-AC2 — 字段、按钮与诚实状态

**Given** 代表性表单具有正常、loading、disabled、错误及中文输入组合状态
**When** 用户输入、确认或使用键盘与读屏
**Then** label/description/error关联、焦点和44pt目标正确，输入保留，只有明确提交触发一次既有业务动作
**And** loading/empty/error/reconnect/partial/unverified保持不同，不虚构成功或自动读剪贴板

#### 9.3-AC3 — 受控模态的焦点与滚动

**Given** 页面有可触发AppSheet的现有控件与可滚动内容
**When** 打开、正常关闭、卸载或经历StrictMode重挂载
**Then** 焦点进入并被包含，背景不可交互，滚动锁定和监听完整释放，恢复到同身份有效触发器或安全标题
**And** 无残余遮罩/锁定、双重focus trap或跳到旧owner内容

#### 9.3-AC4 — 返回、键盘和草稿

**Given** 临时层中有中文键盘、busy动作或未提交草稿
**When** 用户返回、Escape、外侧点击或点击关闭
**Then** 同一受控关闭策略决定结果，Android键盘/顶层Sheet/页面历史按优先级一次只消费一层
**And** 不自动保存、重交operation、退出整个App或丢失原合同需保留的草稿

#### 9.3-AC5 — 身份变化与Portal遮蔽

**Given** 私有Sheet或Toast打开且旧身份可能有未完成异步回调
**When** 身份进入checking/unavailable、退出、撤权或切换owner/session
**Then** 页面与所有私有portal同步遮蔽或卸载，旧回调不得重开/写入，重新核实后只恢复当前身份可确认内容
**And** 公开协议仍按公开边界可读，焦点不返回已无权的私有控件

#### 9.3-AC6 — 最低平台与可访问布局

**Given** 已批准的最低平台和代表性Android/iPhone设备，以及读屏/200%字号/reduced-motion设置
**When** 操作输入、Tabs、Sheet和主要CTA并开关键盘
**Then** 操作可达、safe-area不重复叠加、无横向溢出或底部遮挡，辅助技术能表达选中、错误和禁用原因
**And** 构建、浏览器和真实设备结果分别记录；缺最低iOS或设备实证时本条保持未验收

#### 9.3-AC7 — 组合状态不改业务权威

**Given** Home存在运行任务、FIFO结果、断线或未知写入回执
**When** 新组件展示状态、打开关闭弹层或恢复前台
**Then** 现有controller/journal/cursor决定业务事实，模态可见性正确影响原显示窗口，导航/提示不新建任务
**And** 不把部分/未知转为成功，不改变幂等身份、ACK时机或原输入归因

#### 9.3-AC8 — 升级与迁移证据

**Given** 本次基础组件和实际消费点准备关闭
**When** 运行工作台、类型lint、组件/浏览器回归、构建及适用native验收
**Then** 证据绑定当前源码/依赖/设备，兼容旧组件清单和后续Story责任明确，可逐适配回退且不清业务数据
**And** 1.0/1.6/9.1的整Story状态不会因共享组件通过被自动关闭

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 冻结组件来源、tokens和CSS层次（源场景 1、8）
  - [ ] 锁shadcn CLI/registry来源摘要、Base UI/Tailwind4与插件精确版本；每个生成文件记录人工diff、公共API和许可证，只选实际需要组件；业务不得直接分散import Base UI。
  - [ ] 在src/ui/primitives、components、styles建立Nomad层，tokens沿用front-end-spec；禁默认全局Preflight，审计旧未分层button/input和地图样式的cascade，先对照9.5现有截图再逐适配。

- [ ] T2 交付可访问字段、按钮、Tabs和状态组合（源场景 2、6）
  - [ ] 为Button/Field/Input/Tabs/Toast/Skeleton及AsyncState建立必要基础及实际消费示例；label/description/error关联、44pt、非颜色状态和disabled原因明确，保留中文composition和用户输入。
  - [ ] loading/empty/error/reconnect/partial/unverified与busy各有语义；一次明确submit只调用现有handler，不自动粘贴、不让组件承接业务operation。保留原布局和动效，200%字号/reduced-motion可达。

- [ ] T3 建立统一受控AppSheet与私有Portal（源场景 3、4、5）
  - [ ] 基于Base UI Dialog的受控open/onOpenChange、Portal容器及focus API；Nomad所有私有Portal随auth遮蔽/卸载，公开协议分开。单一focus trap/scroll lock，正常关闭仅恢复同身份仍连接trigger，否则安全标题。
  - [ ] 外点/Escape/关闭按钮/host back使用同一requestClose理由与busy/draft策略；身份失效优先立即遮蔽，不等待业务关闭确认。StrictMode/remount/异常/卸载释放监听与滚动锁，避免嵌套残留。
  - [ ] 通过现有typed host注册最顶层返回；键盘→Sheet→页面只消费一层，移除迁移消费点旧重复handler而保留其他页面。键盘/visualViewport与safe-area每边由单一层负责，不在Base UI之外叠加第二套模态管理。

- [ ] T4 迁移实际入口并保护认证和导入权威（源场景 1、2、5、7、8）
  - [ ] 在LoginScreen真实字段/按钮、HomeSheet代表性输入/结果层和Settings当前退出确认消费共享层，留下逐组件兼容清单与1.0/1.6/7.3后续责任；不在9.3重做账号或Dock控制器。
  - [ ] 维持App guarded/epoch/原生acknowledgeView、logout未知回执及HomeImportDock active可见窗口；状态/Portal变化不得重建operation、提前ACK或因重挂载重播输入和归因。
  - [ ] 私有Toast与迟到async同owner/session/activity代际检查；checking/unavailable背景和Portal都不可读，不恢复旧owner trigger；保留公开协议可读性。

- [ ] T5 验证组件迁移和最低平台切片（源场景 3、4、5、6、7、8）
  - [ ] 补9.4 interaction/a11y场景并过9.5三个引擎基线；覆盖长中文、200%、IME、滚动/focus、identity late callback、StrictMode、退出未知与FIFO可见时间，故意破坏至少一项应失败。
  - [ ] 独立记录shared-ui-local-regression-passed的源码/lockfile/实际消费点与检查结果供9.6/9.7使用，不用它关闭9.3全部原生门槛。
  - [ ] Android与iPhone最低iOS16.4和批准当前版真机验证返回/键盘/safe-area/VoiceOver/TalkBack，结果分层；缺资源留未验收，可回退单个适配层但不清IDB/账号数据。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
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

实施前9.4/9.5真实可用，9.1已存在host接口可消费；1.0/1.6整张done不是前置，避免循环。交付现有登录控件、一个Home临时层和当前退出确认的共享基础；完整7.3及未来页面归原业务 Story。最低平台支持已获批，品牌布局保持。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、8 | T1 冻结组件来源、tokens和CSS层次 |
| 2、6 | T2 交付可访问字段、按钮、Tabs和状态组合 |
| 3、4、5 | T3 建立统一受控AppSheet与私有Portal |
| 1、2、5、7、8 | T4 迁移实际入口并保护认证和导入权威 |
| 3、4、5、6、7、8 | T5 验证组件迁移和最低平台切片 |

### 当前代码、改动位置与保留行为

UPDATE：HomeSheet.tsx 当前25行手写focus/Tab/Escape/恢复，无Portal/滚动锁/hostback；HomeScreen.tsx 另外有background inert、result/candidate token、priority20返回，迁移时整合而非叠加。App.tsx 的auth-private hidden并不自动遮蔽body Portal，需要容器绑定同身份边界。

UPDATE：LoginScreen及Settings当前退出确认只改组件消费；Settings仍含历史BYOK/导出/删除/mailto，完整页面按7.3–7.6准备合同另交付。styles.css/现有host样式的reset和safe-area需在实施前按实际版本完整复读，更新限定tokens与受影响规则。

NEW：apps/mobile/src/ui/{primitives,components,styles} 和组件来源/兼容清单；不新建packages/ui或独立前端。9.4工作台与9.5基线由上游交付，复用其真实接口。

### 验证策略与资源门槛

必须同时有单元/组件、工作台、浏览器、native配置与真实设备四种范围明确的证据。组件测试不替代1.0供应商/会话或1.7真实恢复；原账号owner、operation journal、durable cursor/lease测试保持。仅本Story实际迁移消费点记录UI三条件，其他Story不自动verified。

### 既有实现与版本调查

Base UI官方Dialog提供受控modal/Portal与关闭确认，手势不是Dialog本身能力；本范围未批准新增手势库，不额外安装Drawer/Radix形成第二交互基础。9.3安装时按当前已批准精确候选/registry记录锁定，审阅生成差异，不说Radix停止维护。

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

- _bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet.md
- _bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet-validation.md
