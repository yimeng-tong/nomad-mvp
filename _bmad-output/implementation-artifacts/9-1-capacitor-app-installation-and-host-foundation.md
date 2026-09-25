---
story_id: '9.1'
story_key: 9-1-capacitor-app-installation-and-host-foundation
source_story_id: '9.1'
source_contract_sha256: b3b1a64ed359c2d2ecd20820b787f803232fe10b4322c7f69b21e9a269e5202b
source_epics: _bmad-output/planning-artifacts/epics.md
created: '2026-09-19'
updated: '2026-09-20'
workflow: bmad-create-story
preparation_status: complete
readiness_scope: local-implementation-with-explicit-native-resource-gates
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
engineering_conditions:
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-BUILD-01
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR52
- NFR3
- NFR7
- NFR8
- NFR25
source_obligations:
- app-build-delivery
- shared-ui-adoption
scope_revision: ui-foundation-2026-09-20
context_branch: codex/story-1-0-production-auth
implementation_started: true
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
---

# Story 9.1: 安装 Nomad App 并使用现有入口

Status: in-progress

当前合同准备完成并已获持续开发授权；正式8组GWT完整承接。缺少签名/真机/macOS不伪造关闭，继续可独立实现。

## Story and Acceptance Criteria

As a 获准的 Nomad 测试者,
I want 在 Android 或 iPhone 安装 App，打开既有登录和协议入口，并正确使用系统交互,
So that 我能从手机应用开始使用 Nomad，而不用等待后续功能才知道宿主是否可用.

**Requirements:** FR52；NFR1、NFR3、NFR7、NFR8、NFR25；AR1–AR3、AR14、AR18–AR20、AR23–AR24；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36。

**Engineering conditions:** APP-BUILD-01、APP-HOST-01；启动/恢复测量按 METRICS-01/02 记录实际适用范围；无数据库变化时 DB-CHANGE-01 给出不适用依据，不执行无关迁移。`app-build-delivery` 来源义务进入 Tasks 和关闭清单。

**Dependencies:**复用历史 1.1/1.2 首屏和当前代码；不依赖 1.0 整张完成。构建/安装要求是真实证据，未具备 macOS/设备时相应项未完成；其他平台的通过不代替它。

**原型与证据：**复用 [mobile-ia 的登录与全局组件](../../docs/ux/mobile-ia.md)及[现有视觉登记](../../docs/ux/prototype-coverage.md)。只补宿主返回、键盘、安全区、外链和恢复状态；真实设备截图/安装记录在实施时提供，不能从草图推导已通过。

#### 9.1-AC1 — 可重复构建与实际安装

**Given** 已确认真实包名/Bundle ID、工具链及可用构建/签名资源，源代码与依赖锁可对应
**When** 从受控工作区构建 Web assets、同步两个原生工程并安装开发测试候选
**Then** Android 与 iPhone 的实际设备都能安装并启动同一输入版本的 App，记录构建输入、设备/OS、产物标识和结果
**And** Web 构建仍独立可用；工程目录、模拟器运行、编译成功或未签名产物不能替代双端实际安装证据，开发候选也不冒充最终 TestFlight 交付

#### 9.1-AC2 — 既有首屏形成可用结果

**Given** 测试者启动新安装的 App，当前登录能力来自既有后端实际配置
**When** 查看登录首屏、协议链接和可用/不可用状态
**Then** 使用现有 React 页面、入口顺序和可访问文案，协议真实可读，配置不可用时有明确恢复路径
**And** 不为完成宿主验收打开测试认证、不把按钮或 AppKey 当成登录成功；真实身份/会话由 1.0 另行验收

#### 9.1-AC3 — 本地资源与断网启动

**Given** App 安装包内已包含冻结的 Web 资源，测试设备断网或 API 不可达
**When** 冷启动或重新打开 App
**Then** 本地应用壳可打开并给出实际网络/恢复状态，必要公开说明可读，恢复网络后允许安全重试
**And** 不要求开发机 live-reload 服务才能启动，不把空白屏当作加载，不伪造后端成功、完整离线行程或自动重放未知写入

#### 9.1-AC4 — 系统返回

**Given** 当前存在键盘、临时 Sheet、子页面或根页面
**When** 用户使用 Android 返回键/手势或 iOS 适用的返回交互
**Then** 按既定层级关闭键盘/临时层、返回页面，根层遵守平台行为，保持未提交修改的既有保护规则
**And** 一次返回只处理一次，不触发提交、删除或新任务，不在关闭一个 Sheet 时退出整个 App

#### 9.1-AC5 — 键盘、安全区与可访问性

**Given** 支持设备有刘海/底部手势区，用户启用中文输入法、大字号、读屏或 reduced-motion
**When** 在登录/代表性输入页面输入、切换焦点、打开 Sheet 或读取失败状态
**Then** 输入、主要动作和顶部返回可达，安全区不重复叠加，焦点/读屏/44pt 目标符合既有合同
**And** 实测最小支持宽度、键盘打开/关闭和系统栏变化，截图只对应实际使用的构建与设备

#### 9.1-AC6 — 外链和桥接边界

**Given** 用户打开协议或其他已批准外链，或宿主收到未知 URL/scheme
**When** 宿主判断导航目的地
**Then** 仅已允许的站内路由留在业务宿主，外部 HTTPS 页面通过受控系统浏览能力打开；未知/不安全目的地拒绝并保留返回路径
**And** 外部页面不能获得 Nomad 原生桥接、认证头或私人存储；登录回调由 1.0 的专用验证链消费，不把普通 Browser 打开当成完成认证

#### 9.1-AC7 — 生命周期通知

**Given** App 经后台挂起、系统界面返回或进程重建后恢复
**When** 宿主产生前后台/启动事件并交给现有界面
**Then** 同一轮恢复只通知一次且 listener 正确释放，保留能确认的页面状态并进入真实恢复流程
**And** 宿主不会自行登录、重新启动业务任务、请求位置/剪贴板权限或声称未持久化草稿已保存；身份和业务对账由责任 Story 消费该事件

#### 9.1-AC8 — 关闭证据与配置隔离

**Given** 9.1 准备关闭
**When** 检查双端构建/安装、Web 回归、配置差异、打包内容、原生权限及代表性交互证据
**Then** 支持矩阵与可重复构建说明可执行，测试环境可辨认，发布配置没有开发 URL、服务端密钥或测试身份后门
**And** 保留原型和实现差异、未实测项及原因；真实认证、未来插件与最终 APK/TestFlight 分发不被虚列为本 Story 完成



### UI03 — 新的平台下限与宿主一致性

**Given** 新共享UI依赖和获批支持矩阵已写入实际Web及原生构建配置
**When** 检查所有deployment/JS/CSS/脚本目标并在最低支持iPhone与代表性Android执行输入/Sheet/恢复
**Then** 最低iOS16.4声明与当前资源、原生工程、系统交互和实际设备结果一致，网页保留获批范围
**And** 任何旧16.0配置勾选、相邻OS或仅WebKit结果只能作为历史证据，不能关闭缺失的最低设备验收

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [x] T0 核对资源、写入责任与工具链（AC1/8；APP-BUILD-01、app-build-delivery）
  - [x] 记录现有Linux工具与可用构建/设备/标识，明确未知而非索取已提供的登录Key；记录开发标识与正式签名/平台注册的不同用途。
  - [x] 历史2026-09-19配置证据：固定同一React/Vite及Capacitor官方版本、当时iOS16构建目标和实际WebView下限；记录必要自主决定。
  - [x] 确认1.0任务维护App/Settings/auth/API及packages/native-auth，本任务维护platform/main/独立CSS/native工程，依赖安装窗口互斥。

- [x] T1 配置/构建边界与最小依赖（AC1/3/8；NFR3/NFR25）
  - [x] 精确锁定core/cli/android/ios8.5.2、app8.1.1、keyboard8.0.5、browser8.0.4，使用现有store；SystemBars来自core。
  - [x] 区分development与staging/release配置；候选要求明确应用标识/HTTPS API，发布无server.url或宽泛allowNavigation、无服务端秘密/测试认证。
  - [x] 历史2026-09-19配置证据：为无效/误用配置写负面测试；保留Web build和现有Vitest配置，当时显式iOS16/Safari16及Android内核目标。

- [x] T2 薄宿主运行时与安全接口（AC4/6/7；APP-HOST-01、NFR7/NFR8）
  - [x] 返回注册支持明确优先级，一次只处理一层；键盘先消费，根Android后台化；异步回调/StrictMode卸载后无泄漏。
  - [x] 原生前后台单一状态源去重，订阅可卸载；冷/暖URL事件与身份/输入业务验证责任分离。
  - [x] 受限HTTPS外链拒绝未知scheme/userinfo和不获准目的地，不传认证或把外页载进业务WebView；返回opened布尔结果供既有界面使用。
  - [x] 真正Web路径可独立工作；插件缺失/失败有typed状态，不伪造native成功。

- [x] T3 生成双端工程并建立构建说明（AC1/3/8；APP-BUILD-01）
  - [x] 历史2026-09-19生成证据：使用官方Android/SPM iOS模板，保留UIScene/SceneDelegate；当时minSdk29和deployment16.0（不证明新16.4下限）。开发候选标识与正式资源登记分开，未知正式条件不写成完成。
  - [x] 本地冻结assets、精确API origin、插件配置和最小权限（NomadNativeAuth.apiOrigin为无path/query的HTTPS origin，apiBasePath独立默认/api，JS不可覆盖；拒绝origin包含/api或秘密查询）；在实际packages/native-auth清单就绪后由本任务sync注册，不实现其认证业务。
  - [x] 原生源码/wrapper/必要锁纳入Git，构建/SDK缓存/个人配置/签名秘密排除；提供Android与macOS命令和可重复输入记录。

- [ ] T4 共用界面宿主接入（AC2–7；APP-HOST-01、UX-DR36）
  - [x] main保留StrictMode并安全启动/清理宿主；提供稳定接口给1.0维护的App/Settings/Login接入返回、resume、外链；由该写入者同时在既有Home未知输入/候选Sheet、Planner、DayPlan与SlotEditSheet注册高优先级handler，覆盖busy消费不关闭、未提交草稿及嵌套返回，不激活暂停3.1的新业务。
  - [x] 用独立CSS定义SystemBars inset→env fallback，逐边有唯一消费，键盘/dynamic viewport不遮挡原操作；不重复创建页面。
  - [ ] 处理离线/配置不可用的可读首屏、重试和真实公开说明；未核验的隐私/协议文案不得伪造为已批准政策。

- [ ] T5 自动验证与实际可用构建（AC1/3–8；APP-BUILD-01/APP-HOST-01）
  - [x] 运行配置/运行时负面与竞态测试、现有mobile回归、typecheck与Web build；生成原生assets/插件清单检查。
  - [x] 若Linux JDK/SDK可受控取得，实际编译Android开发APK并记录结果；构建脚本/CI文件存在不能代替运行。
  - [ ] macOS/Xcode真正构建iOS；已知缺少资源时保留此项，执行其余可做工作。

- [ ] T6 真机与关闭证据（AC1–8；APP-HOST-01、app-build-delivery）
  - [ ] 双端真实安装/冷启动/升级、键盘/系统返回/safe-area/无网/外链/恢复；记录设备/OS/WebView/构建与截图，Web回归独立保留。
  - [ ] iOS16.4与最低/当前支持设备、低内存/无GMS分支有可验证结果；未覆盖则不声明已支持。
  - [ ] 形成app_delivery_evidence真实记录，APP-BUILD-01/APP-HOST-01分别verified后再review；缺项不得以mock/生成截图/TestFlight目标替代。

- [ ] T7 工程条件与交接（AC8；DB-CHANGE-01、METRICS-01、METRICS-02、METRICS-03、APP-BUILD-01、APP-HOST-01）
  - [ ] METRICS-01记录构建/启动/恢复的版本和实际测量范围，METRICS-02真实用户开放前定版对应目标；未测不编数字。
  - [ ] METRICS-03消费配置/权限/恢复反例；本Story无LLM人评或数据库变化时，DB-CHANGE-01及模型分支给出适用性依据，不关闭其他Story条件。
  - [x] 更新File List、progress、CURRENT/Sprint工作流与下一准备指针；运行handoff和guard回归，向既有1.0任务交接接口/限制。

### Review Findings（2026-09-19 限定宿主/guard审阅）

详见[三层审阅与修补证据](story-9-1-scoped-code-review-2026-09-19.md)。用户已授权直接修复明确问题；此处通过不提升整体Story状态。

- [x] [Review][Patch] R1 拒绝fragment/hash-router中的认证参数外链。
- [x] [Review][Patch] R2 新弹层注册取消旧的异步返回遍历。
- [x] [Review][Patch] R3 卸载handler取消未完成返回等待，避免永久busy。
- [x] [Review][Patch] R4 用键盘epoch拒绝旧hide回执覆盖新didShow。
- [x] [Review][Patch] R5 全部APP-HOST绑定Story按实际条件关闭，不能靠无Cxx段跳过。
- [x] [Review][Patch] R6 批准快照摘要固定，不能通过刷新派生哈希改写批准内容。
- [x] [Review][Patch] R7 generated native config与全部当前安全/兼容配置深比对。



### UI范围增量任务（2026-09-20）

- [ ] UI-SCOPE-9.1：落实2026-09-20新增条件/义务，保留原已完成实现与真实资源门槛。
  - [ ] CODE-QUALITY-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-COMPONENT-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-WORKBENCH-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-BROWSER-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；证据：当前源码组件/浏览器/适用原生证据，逐Story关闭。
  - [x] UI-CONFIG-9.1：已同步所有Xcode/App SPM/Web JS/CSS目标为iOS16.4、Safari16.4、Firefox128；19项配置测试、5项Node校验、mobile build、双端sync与资源核对通过，记录见ui-foundation-local-validation-2026-09-20.json。
  - [ ] UI-PLATFORM-9.1：实际最低iOS16.4和Android设备回归/安装证据仍需补齐；不复用旧16.0或仅配置结果关闭。

## Dev Notes

### 架构与职责

复用已有React19.2.7/Vite8.0.16/Fastify/Prisma，不引入Ionic UI、新router或身份数据库。实际App.tsx以React state导航，不能用window.history.back代替页面/Sheet返回；由1.0写入者注册返回handler。SSE/原生Bearer安全存储/登录证明/账号资格属于1.0的本地插件与wire ADR；9.1仅宿主。

UPDATE文件已读取：main.tsx（StrictMode入口）、vite.config.ts（React+Vitest/jsdom）、package.json/lockfile（现有依赖）、index.html（已有viewport-fit=cover）、.gitignore（env/dist/log规则）。保留原行为及1.0并行依赖；只对main/vite/package/独立CSS/native目录按责任操作，App/Settings/auth及OpenAPI/生成types不由本任务覆盖。现有styles.css的env inset经独立覆盖统一token；先核对实际class，不向html与页壳重复加padding。

原生认证配置以 `packages/native-auth/ADR.md` 和definitions为准：注册名NomadNativeAuth，固定apiOrigin + apiBasePath；由1.0实现插件，9.1配置/sync。App、Home、Planner、DayPlan、SlotEditSheet内部状态的返回handler由既有UI写入者维护，根级无权猜测子层状态。

### 版本与研究

依据[官方版本及资源研究](research/story-9-1-capacitor-host-research-2026-09-19.md)：官方8.5.2主体与app8.1.1/keyboard8.0.5/browser8.0.4；JDK21/AGP8.13/Gradle8.14.3/SDK36，产品minSdk29；研究时iOS16与Xcode26+、SPM、UIScene；现行产品下限由2026-09-20批准改为iOS16.4，旧研究仅为历史工具链依据。WSL生成/同步需实际运行确认，Mac编译/签名不能替代。Vite默认iOS16.4，显式target修正仍需Web API/CSS真机核验。

开发构建可以使用明确标记的本地候选命名空间验证工程，不能将未核验ID用于真实供应商/签名/发布或计入AC1完成；正式applicationId/Bundle ID和签名连续性仍按实际登记核实。用户允许合理决定先落盘；这不是可以伪造注册/权限证据。

### 状态与证据格式

review/done时frontmatter的app_delivery_evidence指向仓库内YAML：kind=real-runtime、source_revision、recorded_at，以及platforms.android/ios各自build_id、device、os、device_install_verified=true、existing evidence路径数组。CI校验记录完整性，真实验收仍需核对原始证据。9.1必须有逐Story APP-BUILD-01/APP-HOST-01 verified；9.2另需真实分发字段。工作树未提交时记录内容摘要，不能只引用旧HEAD。

### 参考

- [当前App架构](../../docs/architecture/app-host.md)与[UX](../../docs/front-end-spec.md)；原型/文字状态登记见源Story。
- [批准与持续授权](../planning-artifacts/capacitor-scope-decision-2026-09-19.md)。
- [定向就绪](../planning-artifacts/implementation-readiness-capacitor-2026-09-19.md)。
- [工程条件](../planning-artifacts/app-implementation-prerequisites-2026-09-19.md)。
- [执行决定](capacitor-execution-decisions-2026-09-19.md)；原1.0实际进度见story-1-0-dev-progress-2026-09-19.md。

## Dev Agent Record

### Preparation

2026-09-19按当前9.1源合同准备，技术研究与共享写入边界已确认。8组GWT、FR52/NFR25、来源义务和工程条件已进入任务。资源/真机门槛仍开放；ready-for-dev只表示本地实施合同可用。

### Implementation

2026-09-19进入dev-story；依赖安装完成，平台配置/运行时按红绿测试推进。原生构建/签名/真实安装尚未验证。

## File List

- _bmad-output/implementation-artifacts/9-1-capacitor-app-installation-and-host-foundation.md
- research/story-9-1-capacitor-host-research-2026-09-19.md
- apps/mobile/src/platform/（全部宿主实现/回归）
- apps/mobile/src/main.tsx
- apps/mobile/vite.config.ts
- apps/mobile/capacitor.config.ts
- apps/mobile/package.json
- apps/mobile/scripts/native-preflight.mjs
- apps/mobile/scripts/verify-native-project.mjs
- apps/mobile/scripts/native-config-proof.mjs
- apps/mobile/scripts/native-config-proof.test.mjs
- apps/mobile/NATIVE.md
- apps/mobile/public/webview-unavailable.html
- apps/mobile/android/（原生源码/配置/官方模板资源；排除build/assets输出）
- apps/mobile/ios/（原生源码/SPM配置/官方模板资源；排除构建/个人配置）
- pnpm-lock.yaml
- .gitignore
- scripts/check-capacitor-scope.mjs
- scripts/check-handoff.mjs
- scripts/check-sprint-delivery.mjs
- scripts/check-handoff.test.mjs

逐文件源码摘要和独立验证范围见story-9-1-local-validation-2026-09-19.json；1.0并行认证源码只引用，不冒称本任务实现。

## Change Log

- 2026-09-19：完成create-story合同准备，待按已授权dev-story执行。

### 当前实施证据入口

[开发进度](story-9-1-dev-progress-2026-09-19.md)、[本地验证清单](story-9-1-local-validation-2026-09-19.json)、[限定代码审阅](story-9-1-scoped-code-review-2026-09-19.md)。本地实现任务完成不意味着其关联AC的所有设备证据已满足；T4正式协议、T5 iOS、T6真机及发布相关关闭仍保留。

- 2026-09-19：完成本地宿主、双端工程同步、限定审阅7项修补、完整mobile/workspace/guard验证及最新Android调试APK构建/签名/内置assets核验。实际设备、iOS构建、正式资源与协议门槛仍开放，保持in-progress。


## 2026-09-20 UI平台同步与限定审阅记录

配置和源码记录见ui-foundation-dev-progress-2026-09-20.md、ui-foundation-local-validation-2026-09-20.json。native sync wrapper、platform proof和构建目标已同步，19+5配置检查及mobile build/sync/verify通过。限定CR见ui-foundation-scoped-code-review-2026-09-20.md，10项已修复复核；本Story其余真实验收及新增UI消费任务保持未完成。

新增/调整File List：apps/mobile/scripts/sync-native-project.mjs、native-config-proof.mjs及其test、verify-native-project.mjs、src/platform/native-build-config.ts、vite.config.ts、package.json、iOS项目/SPM和NATIVE.md；各完整源码摘要见local-validation，旧记录继续为其当时版本证据。
