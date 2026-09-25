---
project: nomad-mvp
date: '2026-09-19'
status: proposed-contract-appendix
change_id: ui-foundation-2026-09-19
proposal: sprint-change-proposal-ui-foundation-2026-09-19.md
formal_story_source: epics.md
applied: false
core_new_story_ids: ['9.3', '9.4', '9.5']
optional_new_story_ids: ['9.6', '9.7']
existing_story_additions: ['1.0', '1.6', '9.1', '9.2']
core_new_gwt: 20
core_existing_additional_gwt: 4
optional_additional_gwt: 13
---

# UI Correct Course：具体修改稿与合同附录

本文件是集中审阅用草案。批准后才将选中的条款同步到唯一正式源 `epics.md`，再生成实际 Story；不能直接从本附录派发开发。以下新增 GWT 均为增量，保留当前业务 GWT、已批准 Capacitor 条款、历史 done、3.1 pause 和延期范围。新的网页支持表仍待 D-UI-01 决策。

## A. PRD、架构与 UX 的 OLD → NEW

### P01 — PRD 平台与 NFR

**位置：**`docs/prd.md` 的 Capacitor 首期交付、Target Device and Platforms、NFR8、NFR25；同步 planning-artifacts/prd.md。

**OLD：**首期支持 Android 10+ / iOS 16+ 手机竖屏；NFR8要求系统返回、中文键盘、安全区、大字号/读屏与前后台恢复；NFR25要求可追溯构建、双端安装与升级。网页未另有精确产品支持表，当前代码仍包含Firefox114/Safari16目标。

**NEW：**App 支持 Android10+ / iOS16.4+，Android WebView111+；Web建议 Chromium/Edge111+、Firefox128+、Safari16.4+（此网页表获批后生效）。NFR8追加：相同语义的控件、输入、模态和状态采用共享交互合同，身份未确认时同步遮蔽页面与Portal中的私有内容，保持焦点、滚动、草稿和业务恢复；有受影响页面的浏览器/读屏/大字号回归证据。NFR25追加：平台下限与Web CSS/JS、App deployment target、依赖锁及实际验收矩阵一致，组件或依赖升级后旧构建目标和旧包证据不能直接沿用。

**理由：**更新支持和质量要求，不把具体组件/缓存库名称塞入业务 FR。FR52的安装、共用身份、原生能力与最终分发责任保留，仅补共享UI交付的Epic9责任指引。

### A01 — 技术栈、分层与升级

**位置：**tech-stack.md、frontend-architecture.md、app-host.md、新ui-foundation.md；architecture/index.md、source-tree.md及规划architecture镜像。

**OLD：**React19/Vite + typed platform；页面级组件边界存在，但没有Nomad共享基础/组合组件层和生成源码治理。

**NEW：**基础由Base UI交互与Tailwind4样式构成，shadcn固定CLI/registry生成源码经审阅后由Nomad维护；`src/ui/primitives`只供Nomad组合层和受控简单消费，页面不得自行复制焦点/scroll lock/host back逻辑。AppSheet通过已有host接口，不接管业务状态、认证、operation journal或持久cursor。初始scope位于当前唯一前端workspace，不为此新增UI发布服务。

**新增拟议 AR25：**共享UI组件必须以明确tokens、公共接口和来源版本复用现有业务页面；视觉方向、领域状态权威、原生桥和隐私边界不由组件库默认行为决定。

**新增拟议 AR26：**共享组件/页面变更以可运行状态用例、真实类型lint、受影响浏览器交互/截图与分层原生证据验证；开发网络替身和工作台不得进入产品运行路径。

**修改 AR3：**保留现有Node/Fastify/React/Vite；允许本CC批准的UI/测试基础，但不添加重复领域状态栈。Query/Router只有分别批准后才成为受限的读取/导航层。

**修改 AR15：**在原type/build/contract/browser门槛上加入真实lint、组件interaction/a11y与受影响截图检查，保留真实DB/服务/设备门槛。

**理由：**单一职责及来源清晰；不能把所有技术库当成同一张重构任务。Query的AR27、Router的AR28仅在候选获批后加入正式源。

### U01 — 视觉系统与共享交互

**位置：**front-end-spec.md的Visual System、Component Contracts、States、Accessibility、UX-DR36宿主章节；mobile-ia公共规则、prototype-coverage与ux镜像。

**OLD：**已有44pt、深绿/近白、<=8px卡片、120–200ms普通动效、240–300ms Sheet、18组提示及S0–S11规范，尚无统一AppSheet/Portal实现合同。

**NEW：**保留原规则，增加语义tokens、Button/Field/Dialog/Tabs/Toast/Skeleton规范、身份边界内Portal、唯一顶层模态、焦点恢复/滚动锁/键盘与safe-area所有权、关闭策略和状态呈现表。页面级ResultSheet保持页面，不因命名改模态。新增拟议 **UX-DR37：共享组件与宿主一致性**，完整行为以主提案第5节为准。

**原型变化：**只对共享组件状态、登录/退出/Home代表性迁移补对照；批准布局不重绘。用现有已接受原型和迁移前实现作为回归依据，交付可运行工作台及浏览器/真机证据。

### E01 — Epic9与准备顺序

**OLD：**Epic9「在手机安装并持续使用Nomad」；9.1宿主前置，9.2最终APK/TestFlight交付。

**NEW建议标题：**Epic9「通过统一的网页与手机应用使用Nomad」。保留9.1/9.2，追加9.3共享UI、9.4组件工作台与质量检查、9.5浏览器保护；9.6/9.7为可选择的独立架构切片。每张新增Story当期交付可运行体验或开发验证工具，不只有依赖安装/目录。

**顺序：**已准备9.1/1.0/1.6/1.7保持；遵守1.7完成后停止。获准恢复后准备9.4→9.5→9.3，再消费到当前1.0/1.6；原1.8及后续队列相对顺序保持，9.2末尾。可选9.6/9.7串行放在UI试点后、2.3前；是否进入本期由D-UI-02明确决定。

## B. 核心新增 Story 草案（20 GWT）

### Story 9.3 — 在现有入口使用统一且安全的 Nomad 组件

拟议键：`9-3-shared-ui-components-and-safe-app-sheet`。

As a 在网页或手机使用 Nomad 的旅行者,
I want 登录、输入和临时弹层具有一致的视觉与系统交互,
So that 我能保持上下文完成操作，并在身份变化时不会看到旧的私有内容.

**Requirements：**FR1、FR18、FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR5、AR12、AR15、AR17–AR20、AR23–AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

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

### Story 9.4 — 用可运行状态工作台与真实检查维护组件

拟议键：`9-4-component-workbench-and-enforced-code-quality`。

As a 维护 Nomad 界面的开发者和审阅者,
I want 独立查看现有组件状态并让代码错误在CI中失败,
So that 我无需真实账号或外部请求就能审阅改动并及时发现回归.

**Requirements：**FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR4、AR12、AR15、AR17–AR20、AR26；UX-DR3、UX-DR33、UX-DR37。

**范围：**现有HomeSheet/字段至少形成一个可运行样例；Storybook React/Vite、MSW、a11y、真实lint是本工具切片。无须等9.3，后者负责为新增组件补例。

#### 9.4-AC1 — 工作台立即可用

**Given** 干净受控工作区按锁文件安装，未配置真实业务账号/密钥
**When** 启动或静态构建Storybook
**Then** 已有代表性组件可交互，并有正常、空、长中文、大字号、loading、禁用、错误及重连的适用展示用例
**And** BMAD Story状态与展示用例清楚区分，工作台不依赖未来页面才有可用结果

#### 9.4-AC2 — 复用且隔离的网络替身

**Given** 场景声明了与当前API合同对应的合成MSW handlers
**When** 运行成功、403、超时、partial或重连用例，或出现未声明网络请求
**Then** 预期状态可重现，未处理请求使测试失败，静态资源例外有明确清单
**And** 不使用真实用户内容/密钥，不以网络替身替代原生bridge或真实PG证明

#### 9.4-AC3 — 真正执行的类型lint

**Given** 新共享层及迁移涉及源文件处于配置的lint覆盖范围
**When** CI或本地运行ci:lint，并插入未处理Promise、非法Hook或缺少字段label的负向样例
**Then** 实际规则返回失败且日志定位源文件，移除缺陷后通过
**And** 不能以打印占位、忽略退出码、关闭整目录规则或重复类型编译冒充lint

#### 9.4-AC4 — 受控历史问题与依赖

**Given** 当前代码已有历史lint问题且插件peer支持范围已核验
**When** 引入规则或升级工具链
**Then** 精确版本无需强制peer绕过，历史例外具有范围/原因/迁移责任且不能增长，新问题阻止CI
**And** 不批量格式化或顺手重写认证、恢复与持久化逻辑

#### 9.4-AC5 — 交互与无障碍能发现缺陷

**Given** 工作台已声明核心组件的interaction与a11y场景
**When** 破坏焦点返回、键盘操作、错误关联或非颜色状态表达
**Then** 相应自动化或明确人工检查失败，结果可关联组件和当前源码
**And** 自动a11y通过不被说成VoiceOver/TalkBack或真机验收完成

#### 9.4-AC6 — 产品构建隔离

**Given** 生成Web和Capacitor产品候选
**When** 检查入口、资源、网络和依赖打包结果
**Then** 产品无MSW worker自动注册、工作台入口、fixture认证或真实秘密，原生产transport仍生效
**And** 工作台/测试的本地成功不改变任何真实服务或APP-HOST条件状态

### Story 9.5 — 在固定浏览器环境保护关键入口与组件迁移

拟议键：`9-5-browser-flow-and-visual-regression-gates`。

As a 维护 Nomad 交付质量的开发者和审阅者,
I want 在一致浏览器环境重现关键流程和视觉差异,
So that 组件迁移前后可以核对实际行为并防止未经审阅的变化进入交付.

**Requirements：**FR1、FR18、FR52；NFR3、NFR8、NFR25；AR1、AR5、AR12、AR15、AR17–AR20、AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**使用9.4已定义的合成场景与隔离配置；先保护现有界面，不依赖9.3完成。9.3以后每个迁移消费点必须运行本Story交付的门禁并提交自身证据。

#### 9.5-AC1 — 关键入口跨浏览器

**Given** 固定Playwright、浏览器版本和受控合成身份/API场景
**When** Chromium、Firefox、WebKit执行登录→Home→Settings→返回及Sheet打开关闭
**Then** 页面路径、焦点、滚动和输入上下文符合原合同，失败给出可定位trace
**And** 所测引擎版本明确，不把bundled WebKit当作最低iOS真机证明

#### 9.5-AC2 — 错误、恢复与身份安全

**Given** 测试包含loading/empty/partial/error/reconnect及打开的私有弹层
**When** 网络失败、未知回执恢复或身份变更
**Then** 原输入/operation/事实状态按合同保留或隔离，portal同时遮蔽，恢复不重复写入
**And** 测试能捕获旧owner内容、迟到回调和重复请求，不只检查页面可见

#### 9.5-AC3 — 可审阅截图差异

**Given** 字体、容器镜像、浏览器、数据、locale/timezone、viewport/DPR与动画策略均固定
**When** 比较迁移前后的正常/长中文/200%字号/键盘和模态代表性状态
**Then** 实际/基准/diff产物可审阅，布局、主要操作与批准品牌保持
**And** CI不自动更新基准或通过过宽容差遮蔽明显位移，故意布局破坏会使门禁失败

#### 9.5-AC4 — 原探针不丢覆盖

**Given** 已存在认证、Dock、IDB journal、遥测和PG/重启/SSE探针
**When** 新测试框架接入CI或替换重复浏览器脚本
**Then** 清单逐场景指明原证据、CI现状、替代对应和真实资源要求，只有等价覆盖证明后才退役重复项
**And** 真实PG、SIGKILL、跨进程IDB/回执测试不会因采用MSW或页面截图而被删除

#### 9.5-AC5 — 日常CI有真实门禁

**Given** 提交包含受影响UI、类型、合同或恢复实现
**When** 执行每次改动及合并前检查
**Then** 相关类型/lint/单元组件/构建/handoff/浏览器及适用PG检查真实执行并保留结果
**And** 缺少必要运行资源明确阻断相应检查，不以skip或旧日志算通过

#### 9.5-AC6 — 证据与发行责任分开

**Given** 浏览器套件全部通过，准备提供测试结论
**When** 汇总支持平台、mock范围、源码/资源摘要和未测项目
**Then** 结论限定为实际运行环境，9.1/业务Story/9.2仍负责最低平台设备、真实能力和发行验收
**And** 旧截图、旧APK或fixture结果不能覆盖新依赖下尚未完成的真机门槛

## C. 现有 Story 增量（4 GWT）

### UI01 — 1.0：登录与退出的共享组件回归

**OLD：**18组现行GWT，包含C01–C04原生会话/回调/PNVS/统计；尚无共享UI迁移验收。

**NEW：**全部保留，追加第19组：

**Given** 登录字段、协议入口或当前会话退出确认迁移到Nomad共享组件
**When** 使用网页和支持App执行错误输入、身份重新确认、未知退出结果、键盘/读屏及返回
**Then** 等权入口、真实协议、会话/operation/撤权结果保持，私有页面与portal同步遮蔽，焦点与草稿按原合同恢复
**And** 组件关闭或默认事件不触发重复登录/退出，不把旧浏览器或旧16.0证据当成新依赖验收

**实际任务增量：**`UI-MIGRATION-1.0`包含迁移点清单、共享控件接入、provider不可用/身份未知/退出回执回归、当前三端证据；保留既有T0–T11及未关闭真实项。

### UI02 — 1.6：Home组件迁移不改变导入与恢复语义

**OLD：**11组现行GWT，C05/C06涵盖深链与主动粘贴；已有controller/journal/FIFO实现和独立证据。

**NEW：**全部保留，追加第12组：

**Given** HomeSheet、composer控件或队列状态迁移到共享组件且存在运行/恢复中的原任务
**When** 打开关闭Sheet、输入中文、后台恢复、切换身份或读取持久operation回执
**Then** 原单一输入、受理计数、FIFO完整可见窗口、operation身份、owner隔离及持久恢复结果保持
**And** 不自动重交未知写入、不重置ACK/已展示标记、不自动读取剪贴板，状态和焦点证据绑定本次组件源码

**实际任务增量：**`UI-MIGRATION-1.6`关联HomeSheet/按钮字段/状态回归；先保留原journal/controller测试。1.7只在必要时新增`UI-REGRESSION-1.7`任务验证实际render与durable ACK/恢复不变，**不新增其源业务GWT，也不解除完成后停止**。

### UI03 — 9.1：新的平台下限与宿主一致性

**OLD：**8组现行GWT；支持iOS16+，配置/脚本验证16.0，已有调试构建证据。

**NEW：**原8组保留，将当前支持表按批准决定改为iOS16.4及网页矩阵，追加第9组：

**Given** 新共享UI依赖和获批支持矩阵已写入实际Web及原生构建配置
**When** 检查所有deployment/JS/CSS/脚本目标并在最低支持iPhone与代表性Android执行输入/Sheet/恢复
**Then** 最低iOS16.4声明与当前资源、原生工程、系统交互和实际设备结果一致，网页保留获批范围
**And** 任何旧16.0配置勾选、相邻OS或仅WebKit结果只能作为历史证据，不能关闭缺失的最低设备验收

**实际任务增量：**`UI-PLATFORM-9.1`覆盖所有四处Xcode配置、App SPM、WebBuild/cssTarget、native verifier/反例、矩阵与真实安装；新证据追加，不改写既有APK历史摘要。

### UI04 — 9.2：最终候选包含当前组件与支持证据

**OLD：**6组现行GWT，候选追溯、双端安装/升级、TestFlight、完整流程/故障/恢复。

**NEW：**全部保留，追加第7组：

**Given** 本期页面已按各自责任完成共享UI迁移和新的平台支持验收，准备最终候选
**When** 核对组件/生成源码版本、lockfile、Web资源和APK/TestFlight实际安装/升级证据
**Then** 相同候选涵盖受影响页面的浏览器与原生交互结果，未迁移兼容项有批准的明确责任，产品无开发工作台/MSW入口
**And** 不用迁移前视觉基线或旧包为当前候选背书，缺任何必需真实平台/业务证据仍不能关闭分发

**实际任务增量：**`UI-RELEASE-9.2`收集完整migration manifest、UI质量与支持矩阵；不是重新执行所有UI业务实现。

## D. 独立候选合同（13 GWT；未默认纳入核心）

### Story 9.6 — 以身份隔离的共享读取层展示城市与灵感

拟议键：`9-6-identity-scoped-server-read-queries`。

As a 使用Home与Planner的旅行者,
I want 读取和刷新城市及我的灵感时获得一致可靠的状态,
So that 页面切换不会重复请求或显示其他身份的旧内容.

**Requirements：**FR2、FR3、FR18、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、拟议AR27；UX-DR5、UX-DR13、UX-DR32、UX-DR36。

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

### Story 9.7 — 通过统一导航打开和返回现有页面

拟议键：`9-7-typed-navigation-and-host-history`。

As a 在网页与App间访问Nomad的旅行者,
I want 刷新、直达、返回与经过验证的深链都能进入正确页面,
So that 我能保留合法上下文且导航不会重复提交业务动作.

**Requirements：**FR18、FR49、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、AR23、拟议AR28；UX-DR1、UX-DR3、UX-DR32、UX-DR36。

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

## E. 来源义务、工程条件与实际任务转移

拟议新增条件存于独立 `ui-implementation-prerequisites-2026-09-19.md`（批准后创建）。不是向旧实施前置文件追加然后重算历史批准摘要。

| 条件 | 首次交付 | 绑定与关闭规则 |
| --- | --- | --- |
| UI-COMPONENT-01 | 9.3 | 绑定主提案迁移表的UI Story；实际消费共享层、身份/宿主/状态回归，按该Story平台留证，不由9.3一次证明全局完成 |
| UI-WORKBENCH-01 | 9.4 | 9.4交付工具，9.3及页面Story交付自身适用状态/interaction/a11y示例；无新可展示UI给具体不适用理由 |
| CODE-QUALITY-01 | 9.4 | 正式启用后新增/修改TS与React代码都进入真实类型lint；包括后续非UIStory，例外不增长，工具安装不是verified |
| UI-BROWSER-01 | 9.5 | 9.5交付基线及CI，受影响页面Story补当前源码浏览器/截图结果；不继承其他Story的全局verified |

保留OPS、DB-CHANGE、METRICS、APP-BUILD/HOST/DISTRIBUTE原绑定。APP-HOST依然逐Story要求真实设备；9.4/9.5是开发验证工具，不因为在Epic9就假设需要独立TestFlight发布，其产品包隔离验证在对应条款执行。

新增来源义务建议 `shared-ui-adoption`：以主提案迁移表为消费集合，将组件/品牌/Portal安全、三端交互、状态、证据和兼容退出责任写进每张实际Story的Tasks/关闭清单。`ui-quality-tooling`绑定9.4/9.5，要求真实CI失败路径与产品隔离。未准备Story于CS生成时携带；已准备1.0/1.6/1.7/9.1逐项差异更新，保持原Status及已完成事实。历史1.1–1.5/2.0–2.1文件不重写，当前回归由新责任Story承担。

业务数据读取和导航候选分别增加独立AR与来源义务，只有批准进入正式源后才写入catalog；未批准候选不能被`next_story_to_prepare`选中。RHF试点是2.3的实施任务/字段校验验收，当前未预增其业务GWT或修改后端Zod合同。

## F. 版本链、同步步骤与数量校验

1. 切换前再读CURRENT/Sprint/当前Story和活跃工作流；若主任务有新提交/任务，补充本提案差异，不能从本文旧快照覆盖其状态。保留1.7后停止与3.1暂停。
2. 为本次批准形成独立scope decision和精确前状态快照，引用已批准Capacitor决策/源块；旧9月15/17/19批准与catalog保持不可变。
3. 按选中条款更新源文档、镜像、epics及Requirements/AR/UX义务。新版本文件名带ui-foundation，避免同日覆盖；源显示顺序稳定追加新ID，preparation order按实际依赖单独维护。
4. 生成新catalog的全epics hash及每Story hash、GWT数，新delivery的PRD/每FR/NFR摘要、story_requirement_bindings与source_obligations；未修改的源块摘要应保持相同。
5. 同步所有已准备合同的source_story_id/source_contract_sha256、源叙事/Requirements/GWT、实际Tasks、原型及证据、delivery路径和工程条件。原已验证证据保留为历史，针对变更范围追加；不能批量清空历史任务也不能把旧证据套入新依赖。
6. 新scope链checker既验证旧批准和快照，也只允许本次批准的明确增量。新增条件的owner/source映射扩展为显式表，不用条件前缀猜责任、不删除3.1/历史done/native guard。补schema/链、counts、遗漏Tasks/义务、伪造审批/旧hash、stop_after_story的反例。
7. 定向IR记录通过与真实资源门槛；运行`pnpm run ci:handoff`。守卫变化运行`node --test scripts/check-handoff.test.mjs`，并补当前新范围的对应测试。只在真实完成后推进Story状态，不因准备目录变化关闭业务。

| 版本选择 | Epic | Story | GWT | FR | NFR |
| --- | ---: | ---: | ---: | ---: | ---: |
| 当前生效 | 9 | 62 | 1052 | 66 | 25 |
| 核心9.3/9.4/9.5 + UI01–UI04 | 9 | 65 | 1076 | 66 | 25 |
| 核心 + Query9.6 | 9 | 66 | 1082 | 66 | 25 |
| 核心 + Router9.7 | 9 | 66 | 1083 | 66 | 25 |
| 核心 + 两候选 | 9 | 67 | 1089 | 66 | 25 |

数量依据：9.3八组、9.4六组、9.5六组；现有四Story各增一组；9.6六组、9.7七组。仅改平台文字、Requirements、source obligations或Tasks不算新增GWT。AR/UX条款数量按选择更新，不能和FR/NFR混计。本附录未加入任何新业务FR、未删除原业务GWT，也未恢复延期Story。

拟议文件和条款的批准状态均为待审阅；实施派发只接受更新后的正式源、实际合同与现时用户边界。
