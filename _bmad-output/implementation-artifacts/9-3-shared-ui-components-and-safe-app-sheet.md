---
project: nomad-mvp
story_id: '9.3'
story_key: 9-3-shared-ui-components-and-safe-app-sheet
source_story_id: '9.3'
source_contract_sha256: 1068161ce8180a56148f85f34f668ba8d5451ff2d4dd6c818fad26bbbf68e323
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-26'
updated: '2026-09-26'
workflow: bmad-create-story
preparation_status: passed
preparation_authorization: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
implementation_started: true
execution_dispatch_authorized: true
baseline_commit: 775b132f64bf0d6831150d95a6f9192e814f39ce
context_branch: codex/story-9-3-shared-ui
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
execution_plan: _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md
local_slice_gate: shared-ui-local-regression-passed
ui_delivery_evidence: _bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ui-delivery.yaml
research_records:
- _bmad-output/implementation-artifacts/research/story-9-3-tooling-research-2026-09-26.md
- _bmad-output/implementation-artifacts/research/story-9-3-integration-audit-2026-09-26.md
---

# Story 9.3: 在现有入口使用统一且安全的 Nomad 组件

Status: in-progress

当前源合同和两份独立VS均已通过；823fd85准备基线已提交推送，现按持续授权进入DS。准备结果不计实现或原生验收。旧数值顺序与归档草稿不作为合同。

## Story

As a 在网页或手机使用 Nomad 的旅行者,
I want 登录、输入和临时弹层具有一致的视觉与系统交互,
So that 我能保持上下文完成操作，并在身份变化时不会看到旧的私有内容.

## Requirements and Scope

**Requirements:**FR1、FR18、FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR5、AR12、AR15、AR17–AR20、AR23–AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**9.4工作台/代码检查和9.5现有流程基线已可用；复用9.1已实现的host接口。采用已获批的网页矩阵。交付现有登录控件与一个Home临时层的实际适配，以及当前退出确认的共享基础；相同修改的领域验收由1.0/1.6记录，不要求其整张done形成循环。完整7.3或未实现页面不属于本Story。

五项工程条件和shared-ui-adoption进入下列实际Tasks；9.4/9.5已done，9.1已实现host接口可复用。原生资源只阻断对应验收切片，APP-HOST-01/AC6未取得真实设备证据时不能关闭整张9.3。

## Acceptance Criteria

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

- [x] T0 固定当前来源、执行基线与资源矩阵（AC1–8；FR1/FR18/FR52、NFR3/7/8/25；CODE-QUALITY-01、UI-COMPONENT-01、APP-HOST-01；shared-ui-adoption）
  - [x] 核对本合同source hash、CURRENT/Sprint、当前catalog/delivery、9.4/9.5交付证据和775b132干净Git基线；本任务唯一writer。保持3.1暂停/迁移审计、历史done与原1.0/1.6/1.7/9.1真实条件。
  - [x] 冻结Node22.22.1、pnpm11.7.0、React19.2.7、Vite8.0.16和现有Capacitor/验证工具；初选shadcn4.21.0、@base-ui/react1.8.0、tailwindcss与@tailwindcss/vite4.3.3，再确认实际peer/install/build。真实secret仍在VM104受限配置，不读入UI或Git。
  - [x] 核验Web与原生资源状态：真实最低iOS16.4/代表性iPhone、Android10+/WebView111+、Mac/Xcode/签名、合法HTTPS后端等；已问资源不重复索取。缺资源记录到APP-HOST-01切片，继续独立组件工作；不下调矩阵。

- [x] T1 引入可追溯的Nomad组件与样式基础（AC1/8；NFR7/8/25；UI-COMPONENT-01、CODE-QUALITY-01；shared-ui-adoption）
  - [x] 新增src/ui/{primitives,components,styles}；精确锁生成CLI及显式Base UI基础，逐个获取/审阅选中registry源码，记录URL/版本/响应hash/生成文件/人工调整。CLI锁版本不代表远端registry已冻结；不使用浮动latest或批量覆盖源码。
  - [x] Tailwind4/Vite插件接产品与工作台，保留原build proof、JS/CSS targets与env隔离；显式theme/utilities/layer顺序、不引入全局Preflight。核对原未分层button/input及第三方样式的优先级，仅迁移实际消费点。
  - [x] 按UX-DR37建立深绿/近白等语义tokens、rem字体/4px间距阶梯/受控层级/标准与Sheet动效。逐项实测正文4.5:1和适用控件/焦点3:1，保留品牌；登记Dock/composer/Sheet的12/14/22px历史例外，卡片不扩到大圆角。不引入暗色主题、另一Drawer/Toast库或packages/ui。

- [x] T2 完成基础控件与诚实状态组合（AC1/2/6/8；FR1/FR18、NFR8；UI-COMPONENT-01、UI-WORKBENCH-01、CODE-QUALITY-01）
  - [x] Button、Input、Textarea、Field/FormField、Tabs、Skeleton/AsyncState与非关键Toast形成Nomad公共API，业务不散落Base UI imports。采用Base UI render/ref/DOM props组合方式，不套用Radix asChild。
  - [x] Button默认type=button，只有显式submit提交；loading/disabled有真实原因，icon-only有label和44pt区域。表单保留name、inputMode、autocomplete、maxLength、手机号/challenge绑定；IME组合中Enter不误提交，正常明确提交仍一次。
  - [x] label/description/error ID关联、字段错误/失败保留输入；loading/empty/error/reconnect/partial/stale/unverified区别来自领域事实。Toast只放非关键短消息、去重且不抢焦点，未知写入/字段错误/恢复与hard conflict保持页面内；Skeleton只代表真实读取占位。

- [x] T3 建立身份边界内的受控Portal与模态生命周期（AC3/4/5；NFR3/7/8；UI-COMPONENT-01、UI-BROWSER-01；shared-ui-adoption）
  - [x] 私有Portal host位于实际.auth-private DOM内并在inert背景外；先拿到已连接容器再开放Root/Portal。container只能是已解析HTMLElement或literal null；不得用current=null的ref对象触发body fallback，也不得以public模式兜底私有内容。
  - [x] AppDialog/AppSheet使用唯一Base UI modal=true焦点/滚动管理；Root受控open和onOpenChange，移除旧同层trap/Escape/back/锁。默认keepMounted=false；若保留DOM必须作用域[hidden]规则及真实浏览器证明，display:flex不能覆盖安全隐藏。
  - [x] Root交互生命周期在checking/unavailable/退出/撤权时立即停用或卸载，不能只给仍open的Root加display:none留下锁/焦点/aria masking。页面/Sheet/Toast同步从视觉、交互和可访问树隔离；保留公开协议独立可读边界。
  - [x] 关闭决定、Toast和延迟focus/callback绑定owner/session/nativeGeneration、epoch、activity及layer instance/取消信号；身份变化优先安全处理，不等待busy/dirty异步决定。owner/session变化清旧UI；同owner复核保留合法草稿/已确认内容，不按activity重建整个Home/Dock。
  - [x] 首焦点进入标题或合适字段，双向Tab包含；正常关闭恢复实际激活的同身份有效trigger，disabled/删除目标回可编辑输入或当前安全标题。安全标题可程序聚焦；身份失效finalFocus明确false而非null，并覆盖其微任务期间身份变化。
  - [x] 仅支持原流程所需的一层上级确认；最上层独占输入。StrictMode、卸载、异常、离页、撤权与过期close promise都完整释放listener/inert/scroll lock，不制造新的业务流程。

- [x] T4 接现有host关闭、键盘与真实遮挡时间（AC3/4/6/7；FR18/FR52、NFR25；APP-HOST-01、UI-COMPONENT-01、UI-BROWSER-01）
  - [x] 使用registerHostBackHandler既有协调器，保留keyboard优先、auth priority1000和page priority0；shared modal明确高于保留的legacy priority20且低于1000（例如100加受控层级），不依赖同级effect注册先后；只消费当前top layer。覆盖Settings背景saving/export/delete/fallback状态与共享确认并存时的单次返回。复用host-runtime的异步合并、AbortSignal/backRevision与root minimize，不新增原生back listener。
  - [x] 外侧点击、Escape、host返回/适用手势和关闭按钮进入同一受控策略。异步策略先同步cancel库默认关闭，再按当前scope提交决定；disablePointerDismissal不能当统一busy策略。保留现有未知输入B08：加密准备中仍可关闭，原明确确认仅发一次POST。
  - [x] 明确safe-area各边单一owner及KeyboardResize.Native、contentInset=never、SystemBars CSS变量、visualViewport分工；不重复键盘抬升/边距。Sheet 240–300ms且reduced-motion可操作，不在此另装拖动/snap-point框架；Home Dock已有拖动保持。
  - [x] 以实际遮挡生命周期暂停Dock可见窗口：退出动画虽logical open=false仍遮挡时继续暂停，退出完成/卸载才释放。保持layout确认后的acknowledgePresentation、10秒累计、真实11秒遮挡+剩余窗口正控与reload不重播，不能改controller/journal/cursor。

- [x] T5 迁移三个现有实际消费面与兼容清单（AC1/2/5/7/8；FR1/FR18；UI-COMPONENT-01、CODE-QUALITY-01；shared-ui-adoption）
  - [x] LoginScreen迁移Button/Field/Input与就近状态，保留配置排序、iOS等权、generation/abort、PNVS原intent/challenge、公开法律安全打开与48px当前页fallback；不增加供应商调用或新登录方式。
  - [x] HomeSheet变AppSheet兼容适配，至少一个现有Home临时层实际使用，覆盖共享该适配的分类/候选/已保存结果；保留data-home-sheet-trigger的精确来源、clearParsed不清草稿、请求symbol/epoch/activity和领域选中/回执。移除旧对应priority20/焦点管理；现有Home“计划/灵感”接共享Tabs作为真实消费点，只改变呈现与键盘/选中语义，保留switchSegment、埋点及领域状态；输入如迁移也只改呈现。
  - [x] Settings当前退出确认接AppDialog并移除该确认重复back分支；onLogout仍交给App原single-flight/pending operation，未知退出仍由auth shield恢复。BYOK/配额/账号/反馈等旧区域只列兼容与责任，不顺带实现完整7.3–7.6。
  - [x] 记录每个保留legacy组件的负责人、后续Story和退出条件；Planner/SlotEditSheet/DayPlan等不纳入本次批量改造，S10 ResultSheet保持页面。单适配层可回退且不清业务数据。
  - [x] 按app-host ADR落实旧浏览器轻量升级提示，应用bundle无法运行时仍可读；保留viewport-fit=cover、中文与安全公开入口。能力/UA判断只负责诚实退出，不当最低平台实证。

- [x] T6 扩工作台、lint和缺陷反例（AC2–5/8；UI-WORKBENCH-01、CODE-QUALITY-01、UI-COMPONENT-01）
  - [x] 复用93项/18现有工作台和网络隔离；给新共享组件补适用正常/loading/disabled原因/error/reconnect/empty/partial/stale/unverified、长中文/200%/reduced-motion与嵌套、拒绝/异步关闭、身份及卸载场景。Portal在canvas/TextScale边界内，或明确更新真实provider/字号目标，不能漏放大Portal。
  - [x] 迁移workbench-mutations.ts内HomeSheet focus/keyboard/axe、Login aria-describedby等失效锚点到真实新实现；每个故障须非零用例、目标断言失败，ANCHOR_MISSING/编译错误/启动失败不计成功。前后正常控制与原网络反例保留。
  - [x] 所有新改TS/TSX进入9.4原typed lint，保留冻结cohort/零增长例外、Hooks/a11y/no-floating/unsafe门禁。对新增关键UI策略作有意义的纯逻辑/组件测试，其余由真实交互验证，不写同义空测试。

- [x] T7 三引擎实际Portal、视觉候选与受影响原探针（AC1–8；UI-BROWSER-01、UI-COMPONENT-01、CODE-QUALITY-01）
  - [x] 保留B00–B22/V01–V08业务职责，新增真正产品Portal、scroll lock/背景pointer与读屏、top-only关闭、同owner恢复、A→B/同owner换session、pagehide/pageshow/跨tab退出、迟到candidate/result/close/Toast/focus。只在语义改变时调旧结构断言，不删引擎/场景/skip；新ID登记run-contract。
  - [x] 保留B05/B07/B08/B11/B12与实际IDB/crypto、原operation/请求数/cursor/FIFO；normal motion与reduced-motion分别验证，实际200%字号、长中文、44pt/对比度/CTA可达；最小320px窄屏和代表性桌面宽度需实际检查/截图。新增视觉viewport在policy/run-contract中登记并校验实际viewport/DPR，不能只看project配置。浏览器viewport变化不算真实软键盘。
  - [x] 显式让codex/story-9-3-shared-ui push及实际PR base codex/story-9-5-browser-gates触发完整CI，保留原入口；候选workflow与capture.ts两处ref门同步支持明确9.3候选。独立unapproved候选→canonical CI→下载manifest/原尺寸审阅→记录hash/理由→提交baseline→当前最终提交重跑，普通CI不更新、不mask/放宽。
  - [x] 保留v2当前源码/HTML/public/native-auth/lock/图谱/实际bytes/逐PNG/环境/run ID完整性与反例；隔离检查继续覆盖产品Web及双端assets。下载实际trace、actual/expected/diff等完整产物再作结论。
  - [x] 从9.5原职责矩阵选择受影响原auth/Home/PG-SSE-IDB/FIFO/进程探针重跑，保留失败和旧报告；输出重定位不覆盖历史。真实PG/SIGKILL/压力/恢复/测量职责不由组件fixture替代，未重跑项目明确未计通过。

- [x] T8 独立审阅与可消费的本地UI gate（AC1–5/7/8；四项UI条件；shared-ui-adoption）
  - [x] 三层独立CR、修补/复核确认问题，核对源GWT、品牌/provenance、真实消费与回退；形成current source/lock/config/构建/实际CI证据，不沿用9.4/9.5的verified作为本Story结论。
  - [x] 本地/浏览器适用项全部通过后，按实际范围更新CODE-QUALITY-01/UI-COMPONENT-01/UI-WORKBENCH-01/UI-BROWSER-01的summary/evidence；UI-COMPONENT-01首次交付必须verified，不能not-applicable。
  - [x] 仅达到实际本地切片时写local-ui-regression YAML：kind、story_id='9.3'、同source_contract_sha256、source_revision、recorded_at、result=passed、非空且全passed的checks、现存repo-relative evidence；登记scope_local_slice_progress[本Story].shared-ui-local-regression-passed。该证据只解锁后续9.6/9.7的本地依赖，不关闭本Story原生AC6或提前派发后续队列。
  - [x] 写入同一迁移对1.0/1.6/1.7/9.1的实际受影响证据/责任引用，保留其状态与真实关闭门槛。更新File List/Dev record/CURRENT/Sprint/monitor，ci:handoff通过；只有修改guard时才补其回归。

- [ ] T9 完成本Story真实宿主与整Story关闭（AC6/8；FR52/NFR25、AR23/24、UX-DR36；APP-HOST-01）
  - [ ] 在真实最低iOS16.4、代表性当前iPhone与Android10+/WebView111+运行输入、中文键盘、safe-area/系统栏、Tabs/Sheet/返回/焦点、VoiceOver/TalkBack、200%/reduced-motion与身份变化组合；记录实际源/lock/assets/设备OS/构建和结果。
  - [ ] 在本Story受影响登录/Home/退出/私有Portal验证真实冷暖启动、后台挂起、系统界面返回及进程重建；恢复先核对当前owner/session再由原controller/journal对账，旧回调/旧Portal不恢复，未知写入不自动重POST。权限拒绝/撤回覆盖实际受影响消费；未新增/未触发的权限路径给出具体源码范围和N/A理由，保留原宿主/权限责任。
  - [ ] 保存Web当前三引擎与最低版本/真机范围差异；配置、模拟器、浏览器WebKit、Android编译或IPA不能替代本条。资源未补齐时T9/APP-HOST-01及整张Story保持未完成，继续允许的独立工作，不重问已问资源。
  - [ ] 只有全部适用AC/Tasks与真实APP-HOST-01满足后才review/done。生成本Storyui_delivery_evidence及适用真实app证据，更新五条件/状态和handoff；不得因本地gate就标9.3或其他Story done，不替代9.2 TestFlight分发。

### Review Findings

- [x] [Review][Patch] CR1：关闭动画被checking打断后，同owner恢复必须完成已批准的关闭，释放Dock且允许再次打开。[apps/mobile/src/ui/components/AppDialog.tsx:113；apps/mobile/src/home/HomeSheet.tsx:7]
- [x] [Review][Patch] CR2：关闭决定取消后立即释放pending，后续关闭不依赖不响应AbortSignal的旧Promise；旧finally不能清掉新决定。[apps/mobile/src/ui/components/modal-policy.ts:25]
- [x] [Review][Patch] CR3：登录IME产品回归使用composition期间的真实Enter，并验证229事件被preventDefault；新增缺失防护会失败的反例。[apps/mobile/e2e/flows/shared-ui.spec.ts:61]
- [x] [Review][Patch] CR4：未显式传restoreFocusTo的共享API，在同身份暂停恢复后仍保留有效隐式触发器。[apps/mobile/src/ui/components/AppDialog.tsx:112]
- [x] [Review][Patch] CI1：320px Chromium长Sheet关闭按钮完整可达，修复实际布局，不降低ratio1/像素门槛。[apps/mobile/src/ui/styles/modal.css:3]

- [x] [Review][Patch] CI2：共享Sheet内保留业务按钮的焦点环使用批准深绿，实际渲染对比至少3；原1.49476失败已复现，绿色修補通过，弱化样式故障必须被新反例拒绝。[apps/mobile/src/ui/styles/modal.css]

## Dev Notes

### 当前架构与最小更新面

本地research两份报告包含逐文件current/change/preserve表。首批目录为src/ui，不创建第二workspace；保持当前App view state导航、现有API client/transport/controller/journal和host-runtime。App的.auth-private用hidden及同步CSS保护，epoch改变重挂；activity每次核验变化，两个维度不可合并或忽略。Portal必须在此DOM边界内、inert背景外；React context ancestry不能自动遮蔽body节点。

HomeSheet现有32行focus/Escape逻辑和HomeScreen的priority20在适配后只能保留一套管理；Settings还有未迁移的legacy返回分支，不能整段删除。精确trigger由真实点击捕获，提交会先disabled，挂载时再读activeElement已太晚。HomeImportDock active与layout ACK是唯一领域接点：logical close到动画结束期间仍须视为遮挡。

UPDATE主文件：App.tsx、LoginScreen.tsx、HomeSheet.tsx、HomeScreen.tsx、SettingsScreen.tsx、styles.css、按需app-host.css/index.html、mobile package/Vite/Storybook、现有页面测试、workbench故事/作用域provider/必要TextScale、mutations/negative runner、E2E场景/visual capture/run-contract、两个CI workflow。HostBootstrap/host-runtime/native-build-config优先复用；没有必要不修改，若实际改变必须补原host回归。HomeImportDock也优先只接active；迁移其控件时保留ref/ResizeObserver/所有字段与域内方法。

### 版本、生成来源与可维护API

已核验候选shadcn4.21.0（--base base）、Base UI1.8.0、Tailwind及Vite插件4.3.3，与批准ADR一致。具体engines/peers及官方链接见tooling research；候选不是安装/build/device证明。可用Dialog/Button/Input/Field/Tabs/Toast等按实际需要锁来源，textarea可保留原生元素包装；辅助class/icon依赖仅在选中源码需要时审计，不引入RHF/Zod/Query/Router或升级后端Zod。

Base UI Root受控；onOpenChange的details.cancel须同步，finalFocus返回false才禁止默认恢复，null会回退旧trigger。Portal literal null与空ref对象不同；keepMounted+无Preflight+display类必须检查hidden优先级。modal='trap-focus'不锁滚动/外侧交互，不能当真正AppSheet。官方Sheet来自Dialog，没有拖动/snap points；保留现有host返回和HomeDock拖动，不引进另一框架补未经定义的手势。

Tailwind的layer utilities可能被未分层旧规则覆盖；在实际组件边界选择可审阅的scoped样式适配，不全局!important或重排所有legacy CSS。原非标准圆角按UX-DR37清单逐项解释。Sheet240–300ms不能沿用registry示例150/200ms直接算符合；normal/reduced-motion及退出计时分开测试。

### 品牌、原型与兼容责任

源：docs/front-end-spec.md Visual System/UX-DR37、docs/ux/mobile-ia.md Global Components/共享行为、docs/ux/prototype-coverage.md共享增量。已查看visual/story-1-4-home-hybrid-r3.png、story-1-4-home-import-queue-r4.png和story-7-3-account-actions-r2.png（均implementation-artifacts下）；当前9.5的24张审阅基线是实施对照。旧图冲突文字按18组提示与现行GWT，Account R2只消费当前退出相关部分。不得把未来最近行程/完整Settings或旧图中示例事实补成假数据。

9.4/9.5工具已实际交付；旧ADR/跨设备说明中“工具尚未实施”及“1.7后停止”的9月20/25早期文字为历史，现时执行以CURRENT/Sprint和sprint-execution-resume-2026-09-25.md为准。前一实际交付为9.5而非按编号选9.2；9.2始终末尾发行。

### 工程条件、资源与回退

五条件从本Story各自not-started推进。四项UI条件可凭对应实际本地/浏览器证据限定验证；APP-HOST-01/AC6独立要求设备，不可由其他Story本地证明或配置验收关闭。既有资源问题已发送，当前不索取秘密；Mac/Xcode、设备、真实HTTPS/正式法律资源未核验时记录缺口，server-only配置遵循docs/ops/cross-device-development.md。WSL/Mac用Git和同版本工具、一文件一writer；不要复制Windows迁移镜像。

优先回退本次组件适配和样式/生成来源版本，保留data、备份、操作日志、cursor与既有父组件领域状态。私有Portal缺边界时fail closed；SDK/组件失败不能让业务发第二次操作。维持9.3 in-progress并记录local gate是允许的真实阶段，不能通过改checker把资源缺项转成done。

### 本Story验收资料格式

- 来源/版本：精确包/registry/源码/人工调整、lock与所有JS/CSS/native目标。
- 组件与产品：当前源文件摘要、实际工作台/三引擎/negative/CI及下载产物；图片更新逐张决策。
- 原生：独立设备/OS/build/assets/操作及结果，缺项明确。
- 局部gate：local-ui-regression且checks全部实测passed，只代表标明范围。
- 整体UI proof：kind=ui-verification、story_id/source hash/revision/recorded_at与各checks；真实App另有kind=real-runtime，按现存checker/9.1格式。

## Dev Agent Record

### Agent Model Used
Codex当前任务，两个独立只读研究者和两个fresh-context VS；合同与修补由主任务唯一writer完成，独立复核已通过。

### Debug Log References
当前本地验收：story-9-3-acceptance-2026-09-26.md，evidence/story-9-3-ui-2026-09-26/{ci-verification-final,downloaded-artifacts-final}.json及ui-delivery.yaml/local-ui-regression.yaml。aeadc1e完整CI通过，129产品/33视觉、6三引擎组件、32工作台、88 typed lint、265移动+5配置。T9及整張Story未完成；原首跑失败按progress保留。
9.5源码85eedb6完整CI36157432347，关闭提交775b132再次CI36160339430通过。此为准备阶段历史基线；9.3当前实现及验收进度见上方开发记录。

### Completion Notes List
CS/VS完成，8组源GWT与source hash保真。T1–T8仅在合同本地范围完成：四项UI条件verified，三层CR修补/CI缺陷复验与原探针完成，源码/lock/构建/完整CI与下载产物可追溯。T4的host驱动证明不是真实键盘，AC4原生分支/AC6/AC8原生仍由T9承担；APP-HOST-01和整张9.3保持in-progress。影响引用已写入1.0/1.6/1.7/9.1进度，不关闭这些Story。

### File List
- `.github/workflows/browser-visual-candidate.yml`
- `.github/workflows/ci.yml`
- `CURRENT.md`
- `_bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet-validation.md`
- `_bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet.md`
- `_bmad-output/implementation-artifacts/capacitor-task-monitor-state.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-preparation-2026-09-26/input-manifest.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-preparation-2026-09-26/preparation-checks.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/baseline-review.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/candidate1-rejection.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/candidate2-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/candidate2-visual-review.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/candidate3-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/browser-product-graph.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/downloaded-suite-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/environment.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/flow-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/lint-result.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/network-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/shared-ui-matrix/chromium.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/shared-ui-matrix/firefox.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/shared-ui-matrix/verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/shared-ui-matrix/webkit.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/source-manifest.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/suite-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/validation-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/visual-counterexample/actual.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/visual-counterexample/diff.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/visual-counterexample/expected.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/workbench-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/workbench-index.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/workbench-product-isolation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-final/workbench-runtime.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-verification-final.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/browser-product-graph.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/downloaded-suite-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/environment.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/flow-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/lint-result.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/network-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/source-manifest.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/suite-verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/validation-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/visual-counterexample/actual.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/visual-counterexample/diff.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/visual-counterexample/expected.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/workbench-counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/workbench-index.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/workbench-product-isolation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ci/workbench-runtime.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/dependency-and-foundation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/downloaded-artifacts-final.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/downloaded-artifacts.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/legacy/auth-report.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/legacy/pg-browser.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/legacy/verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local-ui-regression.yaml`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local-validation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local/chromium-source-manifest.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local/flow-counterexamples-after-cr.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local/product-isolation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local/runtime.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/local/workbench-counterexamples-before-page-mask.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/previous-baseline-approval.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/review-fix-validation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/shared-ui-matrix-preflight.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/token-contrast.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-3-ui-2026-09-26/ui-delivery.yaml`
- `_bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md`
- `_bmad-output/implementation-artifacts/research/story-9-3-contract-review-2026-09-26.md`
- `_bmad-output/implementation-artifacts/research/story-9-3-integration-audit-2026-09-26.md`
- `_bmad-output/implementation-artifacts/research/story-9-3-plan-review-2026-09-26.md`
- `_bmad-output/implementation-artifacts/research/story-9-3-tooling-research-2026-09-26.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/story-1-0-dev-progress-2026-09-19.md`
- `_bmad-output/implementation-artifacts/story-1-6-dev-progress-2026-09-19.md`
- `_bmad-output/implementation-artifacts/story-1-7-dev-progress-2026-09-19.md`
- `_bmad-output/implementation-artifacts/story-9-1-dev-progress-2026-09-19.md`
- `_bmad-output/implementation-artifacts/story-9-3-acceptance-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-code-review-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-dev-progress-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-execution-decisions-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-integration-impact-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-native-gates-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-9-3-preparation-decisions-2026-09-26.md`
- `_bmad-output/implementation-artifacts/ui-foundation-dev-progress-2026-09-20.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/project-context.md`
- `apps/mobile/.storybook/vite.config.ts`
- `apps/mobile/e2e/fixtures/browser-test.ts`
- `apps/mobile/e2e/fixtures/faults.ts`
- `apps/mobile/e2e/flows/home-sheet.spec.ts`
- `apps/mobile/e2e/flows/identity.spec.ts`
- `apps/mobile/e2e/flows/layout.spec.ts`
- `apps/mobile/e2e/flows/recovery.spec.ts`
- `apps/mobile/e2e/flows/shared-ui.spec.ts`
- `apps/mobile/e2e/run-contract.json`
- `apps/mobile/e2e/visual/approval.json`
- `apps/mobile/e2e/visual/baselines/chromium/V01-login.png`
- `apps/mobile/e2e/visual/baselines/chromium/V02-home.png`
- `apps/mobile/e2e/visual/baselines/chromium/V03-long-home.png`
- `apps/mobile/e2e/visual/baselines/chromium/V04-large-login.png`
- `apps/mobile/e2e/visual/baselines/chromium/V05-large-home.png`
- `apps/mobile/e2e/visual/baselines/chromium/V06-keyboard-sheet.png`
- `apps/mobile/e2e/visual/baselines/chromium/V07-large-long-sheet.png`
- `apps/mobile/e2e/visual/baselines/chromium/V08-logout-confirmation.png`
- `apps/mobile/e2e/visual/baselines/chromium/V09-narrow-login.png`
- `apps/mobile/e2e/visual/baselines/chromium/V10-desktop-home.png`
- `apps/mobile/e2e/visual/baselines/chromium/V11-narrow-sheet.png`
- `apps/mobile/e2e/visual/baselines/firefox/V01-login.png`
- `apps/mobile/e2e/visual/baselines/firefox/V02-home.png`
- `apps/mobile/e2e/visual/baselines/firefox/V03-long-home.png`
- `apps/mobile/e2e/visual/baselines/firefox/V04-large-login.png`
- `apps/mobile/e2e/visual/baselines/firefox/V05-large-home.png`
- `apps/mobile/e2e/visual/baselines/firefox/V06-keyboard-sheet.png`
- `apps/mobile/e2e/visual/baselines/firefox/V07-large-long-sheet.png`
- `apps/mobile/e2e/visual/baselines/firefox/V08-logout-confirmation.png`
- `apps/mobile/e2e/visual/baselines/firefox/V09-narrow-login.png`
- `apps/mobile/e2e/visual/baselines/firefox/V10-desktop-home.png`
- `apps/mobile/e2e/visual/baselines/firefox/V11-narrow-sheet.png`
- `apps/mobile/e2e/visual/baselines/webkit/V01-login.png`
- `apps/mobile/e2e/visual/baselines/webkit/V02-home.png`
- `apps/mobile/e2e/visual/baselines/webkit/V03-long-home.png`
- `apps/mobile/e2e/visual/baselines/webkit/V04-large-login.png`
- `apps/mobile/e2e/visual/baselines/webkit/V05-large-home.png`
- `apps/mobile/e2e/visual/baselines/webkit/V06-keyboard-sheet.png`
- `apps/mobile/e2e/visual/baselines/webkit/V07-large-long-sheet.png`
- `apps/mobile/e2e/visual/baselines/webkit/V08-logout-confirmation.png`
- `apps/mobile/e2e/visual/baselines/webkit/V09-narrow-login.png`
- `apps/mobile/e2e/visual/baselines/webkit/V10-desktop-home.png`
- `apps/mobile/e2e/visual/baselines/webkit/V11-narrow-sheet.png`
- `apps/mobile/e2e/visual/capture.ts`
- `apps/mobile/e2e/visual/policy.json`
- `apps/mobile/e2e/visual/screens.spec.ts`
- `apps/mobile/index.html`
- `apps/mobile/package.json`
- `apps/mobile/scripts/check-browser-flow-guards.mjs`
- `apps/mobile/scripts/check-browser-results.mjs`
- `apps/mobile/scripts/check-browser-validation-guards.mjs`
- `apps/mobile/scripts/check-shared-ui-matrix.mjs`
- `apps/mobile/scripts/check-workbench-counterexamples.mjs`
- `apps/mobile/scripts/workbench-mutations.ts`
- `apps/mobile/src/App.test.tsx`
- `apps/mobile/src/App.tsx`
- `apps/mobile/src/auth/LoginScreen.tsx`
- `apps/mobile/src/home/HomeImportDock.tsx`
- `apps/mobile/src/home/HomeScreen.test.tsx`
- `apps/mobile/src/home/HomeScreen.tsx`
- `apps/mobile/src/home/HomeSheet.tsx`
- `apps/mobile/src/main.tsx`
- `apps/mobile/src/settings/SettingsModalHost.test.tsx`
- `apps/mobile/src/settings/SettingsScreen.tsx`
- `apps/mobile/src/styles.css`
- `apps/mobile/src/ui/components/AppDialog.test.tsx`
- `apps/mobile/src/ui/components/AppDialog.tsx`
- `apps/mobile/src/ui/components/AsyncState.tsx`
- `apps/mobile/src/ui/components/FormField.tsx`
- `apps/mobile/src/ui/components/PrivateUiBoundary.tsx`
- `apps/mobile/src/ui/components/modal-policy.test.ts`
- `apps/mobile/src/ui/components/modal-policy.ts`
- `apps/mobile/src/ui/index.ts`
- `apps/mobile/src/ui/primitives/Button.tsx`
- `apps/mobile/src/ui/primitives/Input.tsx`
- `apps/mobile/src/ui/primitives/Skeleton.tsx`
- `apps/mobile/src/ui/primitives/Tabs.tsx`
- `apps/mobile/src/ui/primitives/Textarea.tsx`
- `apps/mobile/src/ui/primitives/controls.test.tsx`
- `apps/mobile/src/ui/styles/controls.css`
- `apps/mobile/src/ui/styles/index.css`
- `apps/mobile/src/ui/styles/modal.css`
- `apps/mobile/src/ui/styles/tokens.css`
- `apps/mobile/vite.config.ts`
- `apps/mobile/vitest.storybook.config.ts`
- `apps/mobile/workbench/HomeSheet.stories.tsx`
- `apps/mobile/workbench/PrivateUiFixture.tsx`
- `apps/mobile/workbench/SharedControls.stories.tsx`
- `apps/mobile/workbench/SharedModal.stories.tsx`
- `apps/mobile/workbench/workbench.css`
- `docs/ops/ui-validation.md`
- `docs/ui/shared-components.md`
- `docs/ui/upstream/story-9-3/BASE_UI_LICENSE`
- `docs/ui/upstream/story-9-3/THIRD_PARTY_NOTICES.md`
- `docs/ui/upstream/story-9-3/button.json`
- `docs/ui/upstream/story-9-3/dialog.json`
- `docs/ui/upstream/story-9-3/field.json`
- `docs/ui/upstream/story-9-3/input.json`
- `docs/ui/upstream/story-9-3/provenance.json`
- `docs/ui/upstream/story-9-3/sheet.json`
- `docs/ui/upstream/story-9-3/skeleton.json`
- `docs/ui/upstream/story-9-3/tabs.json`
- `docs/ui/upstream/story-9-3/textarea.json`
- `pnpm-lock.yaml`

### Change Log
2026-09-26：准备基线823fd85后开始9.3；实现共享组件、私有模态边界与三个实际消费面，T6/T7/CR/真实原生验收继续。

- 2026-09-26：aeadc1e完整CI36184294356与970下载文件核验通过；登记9.3四项UI条件/local gate，T1–T8本地完成，T9及整张Story保持in-progress；同步在制影响与下一执行入口。
