---
project: nomad-mvp
story_id: '9.5'
story_key: 9-5-browser-flow-and-visual-regression-gates
source_story_id: '9.5'
source_contract_sha256: 54dc15b7f578eeb46e8b93566b2fb6a26deffc99aa8a88ed9c8cfd5692f44ad6
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: complete
preparation_authorization: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
implementation_started: true
execution_dispatch_authorized: true
baseline_commit: a950ea00d8064c86fd26cbf092308291d124d2ce
context_branch: codex/story-9-5-browser-gates
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- CODE-QUALITY-01
- UI-BROWSER-01
delivery_requirements:
- FR1
- FR18
- FR52
- NFR3
- NFR8
- NFR25
source_obligations:
- ui-quality-tooling
dependencies:
- 9-4-component-workbench-and-enforced-code-quality
execution_plan: _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md
research_records:
- _bmad-output/implementation-artifacts/research/story-9-5-browser-tooling-research-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-5-repository-context-2026-09-25.md
validated: '2026-09-25'
preparation_validation: _bmad-output/implementation-artifacts/9-5-browser-flow-and-visual-regression-gates-validation.md
independent_reviews:
- _bmad-output/implementation-artifacts/research/story-9-5-contract-review-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-5-plan-review-2026-09-25.md
---

# Story 9.5: 在固定浏览器环境保护关键入口与组件迁移

Status: in-progress

当前CS与两项fresh-context独立VS已通过，ready-for-dev；下一进入已授权开发。9.4已done，完整CI36129441895及下载产物可复用；9.3未开始，3.1保持暂停。

## Story

As a 维护 Nomad 交付质量的开发者和审阅者,
I want 在一致浏览器环境重现关键流程和视觉差异,
So that 组件迁移前后可以核对实际行为并防止未经审阅的变化进入交付.

**Requirements:**FR1、FR18、FR52；NFR3、NFR8、NFR25；AR1、AR5、AR12、AR15、AR17–AR20、AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**使用9.4已定义的合成场景与隔离配置；先保护现有界面，不依赖9.3完成。9.3以后每个迁移消费点必须运行本Story交付的门禁并提交自身证据。

## Acceptance Criteria

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

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

## Tasks / Subtasks

- [x] T0 冻结本Story执行与旧页面基线（AC1–6；FR1、FR18、FR52；NFR3、NFR8、NFR25；CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling）
  - [x] 读取CURRENT/Sprint/9.4的ui-delivery与完整CI，确认当前唯一writer、实际HEAD/dirty内容/lock/config摘要。保留9.4原证据；本Story两条件从not-started独立推进。
  - [x] 固定Playwright1.63.0及对应三引擎revision、Linux/amd64镜像digest、Node22.22.1/pnpm11.7.0；记录实际版本/路径/OS和中文字体文件、fontconfig摘要。镜像默认Node24必须覆盖，不能仅写配置即算验证。
  - [x] 拍摄和检查前区分当前可用界面与已批准目标：不把旧BYOK等历史入口截图升级为新产品合同；不修改原型/源GWT，不使用远期归档草稿为ready合同。

- [ ] T1 接入隔离三引擎runner与类型检查（AC1/5/6；CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling）
  - [ ] 复用现有playwright/test；新增playwright.config.ts、e2e目录和tsconfig.e2e.json，三个项目明确Chromium/Firefox/WebKit。实际运行全部必需项目，缺浏览器/库直接失败；不得skip/零用例通过。
  - [ ] 产品仍使用实际main.tsx→HostBootstrap→App与当前transport/controller；现有Vitest明确排除e2e，ESLint给Node配置/测试与browser helper正确TSProgram和globals。所有新改TS受9.4同门禁覆盖，不增加豁免或重建冻结cohort。
  - [ ] 测试产物/cache/trace/profile独立且Git忽略，版本化基线/摘要另有明确路径；不加载本地env/真实身份，不改原native/API生产入口，不把test runner打包到Web或原生资源。
  - [ ] 扩展9.4既有check-workbench-isolation及其反例，覆盖新e2e/fixtures、playwright/test runner、浏览器注入helper和可识别的生成资源；同时检查实际产品模块图/输出bytes与Android/iOS完整复制清单，不另建重复checker。

- [ ] T2 建立有状态且拒绝漏拦截的产品API场景（AC1/2/5；NFR3、ui-quality-tooling）
  - [ ] 复用9.4的生成DTO/合成fixture和隔离原则，补匿名→登录、owner A/B、Settings、inspirations/candidates、operation receipt、job/result/retry、recovery/SSE等实际所需合同；不把9.4永远authenticated的/me当作登录流程。
  - [ ] 在真实HTTP边界控制响应，覆盖App/Login/Home/Settings各自创建的client；使用独立loopback端口/上下文，ServiceWorker/任意外网默认拒绝。静态资产来自受控实际产品输出；programmatic fetch不能借静态资源例外放行。
  - [ ] 记录有限请求/operation/owner与受控迟到响应，未声明、外网、被业务catch或场景结束后到达的请求使用例失败；日志只留合成数据/脱敏字段。场景cleanup必须等待取消并检查账本，不向后续场景借身份或handler。
  - [ ] 需要“断线/超时/未知回执”时真正切断/延迟相应HTTP/SSE边界并记录已受理与未知状态；不以返回empty/成功替代。替身不替代PG、lease、原生bridge或真实PNVS。

- [ ] T3 在三个引擎保护既有入口与Sheet（AC1/2/5；FR1、FR18、FR52；UI-BROWSER-01）
  - [ ] 实际执行匿名登录→Home→Settings→返回，验证当前可见surface和导航事实；现有App使用view state，不能要求尚未交付Router的pathname/history合同。确认同身份Dock草稿保留，导航不新建写入。
  - [ ] 操作实际Home输入类型/候选/已保存结果中的代表性Sheet：首焦点、Tab/Shift+Tab、Escape/关闭、同身份有效触发器、原滚动位置/输入和调用层inert、Sheet期间Dock可见窗口暂停。Settings当前内联退出确认另测，不能伪称其已具有AppDialog trap。
  - [ ] 区分正常动效与reduced-motion；busy/未提交规则按当前领域合同处理，不在工具Story发明新关闭规则。软键盘/宿主返回若用替身必须标注，真实App仍由9.1/9.3/业务Story验收。

- [ ] T4 在三个引擎验证错误、恢复与身份边界（AC2/5/6；NFR3、NFR8；UI-BROWSER-01）
  - [ ] login字段错误保留输入；Home loading/empty/partial/error/reconnect各自有实际场景。已知部分保存仍可读取，未知写入先查原operation回执，明确恢复沿同一operation，不新增自动POST。
  - [ ] 使用真实browser IDB/current controller演练reload/恢复与双tab身份通知的适用切片；断言请求数、operation ID及事实状态，不能只断言文字可见。reload与真实进程SIGKILL分别标注，后者原探针职责保留。
  - [ ] 私有层打开时触发checking/unavailable/撤权/owner或session变化，检查整个document的旧owner可见内容、可交互节点及可访问树；checking期间可保留严格隐藏/不可交互的同身份树以恢复草稿，切owner/session后必须清旧树；迟到/me、候选/结果响应不能写入/重开新身份。保护公开协议可读，身份失效不回旧私有焦点。
  - [ ] 当前HomeSheet没有Portal；全document私有内容oracle及测试专用漏显反例用于证明门禁能捕获Portal泄漏。实际AppSheet Portal及通用身份焦点/滚动锁仍归9.3，不能把测试造出的Portal算产品迁移或以其替代真实App流程。

- [ ] T5 建立固定环境的可审阅视觉基线（AC3/5/6；NFR8、NFR25；UI-BROWSER-01）
  - [ ] canonical截图生成与比较均用固定noble/amd64镜像；锁定zh-CN、Asia/Shanghai、viewport、DPR、colorScheme、headless、数据、字体、时钟与动画。三个引擎分别保存基线；Firefox不用不支持的isMobile，WSL/macOS截图不能覆盖canonical基线。
  - [ ] 覆盖正常、长中文、200%实际字号、键盘焦点/模态代表态；等待实际字体就绪并验证CJK fallback/文件hash。对固定px字段也测computed字号，检查横向溢出、主要按钮可见可操作；viewport缩小不算真实软键盘。
  - [ ] 日常CI显式updateSnapshots:none。初始基线/更新仅走独立显式候选入口，输出待审阅图片与manifest；审阅actual/expected/diff及Git变化后人工/授权执行者纳入版本库，不能因缺基线自动写入即通过。
  - [ ] 从严格差异阈值开始，只可按记录的局部原因调整；不mask主要控件或用宽容差隐藏位移。截图稳定化与真实行为断言分开，不能因禁动画触发transitionend就宣称正常生命周期通过。
  - [ ] Date与timer策略按场景分开：视觉静态时间可固定，FIFO/超时需安装并显式推进相同受控时钟；冻结Date而timer继续流动不能充当10秒/恢复实证。

- [ ] T6 证明流程和视觉门禁会发现缺陷（AC2/3/5；CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling）
  - [ ] 对实际产品测试入口注入可回滚/内存缺陷：明显CTA位移、旧owner私有层残留、迟到结果越过身份围栏、未知回执恢复重复POST、未知请求漏拦截。每个须目标断言失败和非零退出，启动失败/缺资源/零用例不是成功反例。
  - [ ] 前后正常控制实际执行非零用例。失败保留对应trace与视觉actual/expected/diff；使用retain-on-failure等保证首次失败即有trace，不靠未启用的retry。
  - [ ] 对误删除必需引擎/场景、缺基线、自动更新基线、环境指纹不匹配提供门禁反例；不能靠配置声明项目数或旧报告通过。
  - [ ] 注入误导入新E2E fixture、向Web/native复制浏览器helper资源的污染负例，证明扩展后的既有隔离检查会失败；移除污染后通过，不能以旧workbench/MSW命名黑名单充当新工具覆盖。

- [ ] T7 保留旧探针职责并接入实际CI（AC4/5；CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling）
  - [ ] 按research矩阵逐项记录7个旧浏览器探针、server PG/worker/replay/socket/restore和measurements：原报告/源码、当前CI入口、替代对应、仍独立的资源与运行责任。旧报告的Chrome127/源码漂移必须明确。
  - [ ] 本Story默认不退役旧探针；若确有重复项需要退役，先取得当前版本同场景等价执行证据与单独决定，真实IDB/WebCrypto/跨进程/SIGKILL/PG/SSE/ACK不得降级成截图或MSW。对实际受影响旧责任运行针对性原探针，未重跑项不计本次通过。
  - [ ] CI保留9.4及全部原type/build/handoff/mobile/auth/ingest/PG/legacy/helper链；新增三引擎流程、canonical视觉、反例与结果完整性检查，源/lock/config或恢复实现变化会触发，缺必需资源明确失败。
  - [ ] 显式让codex/story-9-5-browser-gates的push及实际PR目标分支触发完整门禁（默认父分支codex/story-9-4-workbench-quality，保留原main/1.0入口）；核验当前HEAD的真实run。候选基线入口必须能从明确当前ref实际触发，不能只写一个在仓库不可调度的workflow配置；触发方式/参数/候选身份留证。
  - [ ] 独立候选基线入口与常规比较分离；CI下载检查实际包含trace、actual/expected/diff、各引擎结果/版本/字体及source manifest。hidden输出目录必须明确上传，并验证实际artifact成员，不能只有index。

- [ ] T8 限定审阅、逐条件闭环与交接（AC1–6；CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling）
  - [ ] 按6组AC保存正反例命令/退出码、真实运行环境/版本、源码/lock/config/资源摘要、截图审阅决定；列出mock/未测项，不据此更新其他Story原生/服务条件。
  - [ ] 独立bmad-code-review、修补并复核已确认问题；新改源文件真实typed lint。创建当前checker的ui_delivery_evidence：kind=ui-verification、story_id='9.5'、同源hash、source_revision/recorded_at、两个checks的passed/environment/summary和现存repo-relative证据。UI-BROWSER-01作为首交付必须verified，不能not-applicable。
  - [ ] 更新完整File List、Dev Agent Record、CURRENT/Sprint/monitor/当前branch与next-preparation；ci:handoff通过，若改guard才补guard回归。9.5自身done以后才临近准备9.3；3.1暂停/历史done/真实资源门槛不变。

## Dev Notes

### 已核验的实现上下文

| UPDATE位置 | 当前事实与本Story允许的调整 | 必须保留 |
| --- | --- | --- |
| root/mobile package.json、pnpm-lock.yaml | Playwright1.63.0已安装且test CLI/exports实测可用；只增加命令，必要依赖才另行精确审计 | Node22.22.1/pnpm11.7.0、React19.2.7/Vite8.0.16、MSW2.15.0/Vitest4.1.11和原native工具 |
| apps/mobile/vite.config.ts | 当前仅排除workbench；增加e2e排除，测试独立配置/cache | 产品build targets、productBuildProof、无本地env的隔离候选开关 |
| eslint.config.mjs / 新tsconfig.e2e.json | 为Node runner与browser helper配置实际TSProgram和globals | 9.4固定cohort、no-floating/misused/unsafe/Hooks/a11y及零增长豁免 |
| apps/mobile/scripts/check-workbench-isolation.mjs及其test | 原黑名单只覆盖工作台/MSW/Vitest，扩展新E2E/runner/helper模块与资源的污染检查 | 实际图谱/源码hash/输出bytes和双端完整inventory，不删除旧5组负例 |
| .github/workflows/ci.yml | 在旧完整链外新增固定镜像三引擎任务和显式候选入口 | fetch-depth0/base+head、Prisma先生成、旧PG15/Redis7、fixture worker与完整hidden artifacts |
| .gitignore、docs/ops/ui-validation.md及architecture镜像段 | 加隔离输出路径、当前命令/责任矩阵和基线协议 | 版本化基线不被忽略、旧失败记录与实际资源边界；源文档修改须同步镜像 |
| App/Login/Home/Settings/transport/controller/journal | 原则只消费当前实际入口；若测试发现真实回归，仅做有失败依据的最小修补并列File List | auth epoch/activity、owner/session、operation/receipt、durable cursor/lease/ACK；不批量格式化或引入第二状态源 |

建议新增：apps/mobile/playwright.config.ts、tsconfig.e2e.json、e2e/{fixtures,flows,visual}、独立浏览器/视觉反例与环境检查脚本。测试配置、注入helper及fixtures不进入src产品图谱；生产构建/native资源继续跑9.4隔离证明。新源码/测试按9.4实际lint覆盖，不靠改冻结基线跳过。

### 关键现状，不能假定为已交付

- App是view state导航；同身份Settings往返保留controller输入，但Home库筛选是组件局部state。9.7才交付Router，不要求当前测试凭空产生URL/history语义。
- Home调用层已有inert、priority20 back handler和Dock active=false；HomeSheet自身做焦点循环/Escape/connected trigger恢复，没有Portal/通用scroll lock/outside-click或身份安全焦点回退。Settings退出为内联role=dialog。9.3承担共享基础；本Story建立真实基线与能发现未来漏显的门禁。
- 9.4 handlers的/me永远authenticated且scope前缀只适用Storybook，不能直接冒充完整登录。App的authClient prop不覆盖所有子页面client，测试应控制真实HTTP。
- unknown receipt恢复由当前journal/controller决定：先查旧operation，不自动重POST；域内提交仍由原幂等保护约束。所有身份和迟到响应断言必须覆盖全document，不只auth-private容器。
- 3.1仍paused；完整7.3、9.3/9.6/9.7和真实供应商/原生能力不在本Story顺带实施。

### 版本、运行环境与资源边界

Playwright1.63.0内置test runner已实际CLI/import核验，优先直接import `playwright/test`，不新增同版本别名包。当前元数据：Chromium153.0.8010.12 rev1243，Firefox155.0 rev1543，WebKit26.6 rev2359（macOS14 override2251）；元数据不是本Story运行结果。

Canonical镜像：`mcr.microsoft.com/playwright:v1.63.0-noble@sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7`，linux/amd64；index digest `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`。MCR匿名manifest已由研究者与主任务复核，尚未拉取运行。镜像默认Node24，必须在CI选择并断言22.22.1，pnpm11.7.0。镜像内依赖源码含WenQuanYi Zen Hei中文字体；实际fontconfig/fc-match/字体文件hash在首个容器run记录，不能预填。

当前WSL执行环境Ubuntu26.04受Playwright支持，但无docker/podman命令；可做本机三引擎功能检查，canonical像素生成/比较在同一CI镜像执行。Docker CLI缺失不授权改用跨OS截图，也不阻断可独立推进的功能检查。Mac通过Git接手同版本/单writer，不使用Windows Node/pnpm。Browser WebKit不是Safari16.4/iPhone；FF155不是FF128支持实证。

### 原型与来源

沿用docs/front-end-spec.md Visual System、UX-DR37、States/Accessibility与docs/ux/mobile-ia.md登录/S0/Bottom Sheets。视觉登记docs/ux/prototype-coverage.md的UI迁移表明确9.5使用迁移前真实页面和各引擎新截图，无须重批整套图片。适用原图包括visual/story-1-4-home-hybrid-r3.png、story-1-4-home-import-queue-r4.png、story-7-3-account-actions-r2.png（都在implementation-artifacts下）；Settings仅当前会话退出适用部分，不把未来7.3全页当已实现。

源权威：docs/prd.md→当前epics.md/catalog/delivery→本Story。AR26/UI验证合同、ui-foundation ADR、frontend-data-navigation ADR及source_obligation ui-quality-tooling已进入T0–T8。9.4完整交付与失败经验见story-9-4-acceptance-2026-09-25.md、story-9-4-code-review-2026-09-25.md和evidence/story-9-4-workbench-2026-09-25/ui-delivery.yaml；先生成类型、串联退出码、缓存隔离、活动worker判定、未知请求ledger和实际artifact下载经验保持。

### 关闭证据与下一步

本Story只关闭自身CODE-QUALITY-01/UI-BROWSER-01。截图更新记录必须对应具体候选manifest与审阅图片，不允许隐式接受所有差异。原报告与新报告分开，未执行项目/最低平台/真实服务明确未测。只有全部适用AC/Tasks、独立CR、真实CI和两条件证据齐全才review/done。9.3的实际组件/原生门槛、1.0/1.6/1.7/9.1及9.2发行门槛继续由各自负责。

## Dev Agent Record

### Agent Model Used
Codex当前会话；两项独立只读研究，随后fresh-context合同VS。

### Debug Log References
研究/当前代码核验不等于三引擎套件、镜像运行或截图通过。本准备阶段没有新增工具依赖或执行9.5测试。

### Completion Notes List
当前源六组GWT保真，CS/独立VS全部完成。两项计划补充已复核闭环；状态ready-for-dev，尚未运行9.5实现验证。

### File List
本Story、两份research、preparation-decisions和后续validation；准备阶段只改规划状态/证据，不改产品或测试源码。

### 2026-09-25 DS开始

按已授权连续执行从准备提交fcffc1157837a39c7c563288fcb1cafa9d4f5383接手，唯一writer不变；frontmatter.baseline_commit保留a950ea0代码基线。先T0真实固定容器/三引擎环境预检，再产品场景与截图门禁。三引擎metadata/CLI帮助仍不计功能验收。

### 当前实施File List（T0）

- apps/mobile/scripts/browser-environment.mjs
- .github/workflows/ci.yml
- .gitignore
- CURRENT.md、_bmad-output/project-context.md、sprint-status.yaml、capacitor-task-monitor-state.json（implementation-artifacts下的同名文件）
- story-9-5-execution-decisions-2026-09-25.md、story-9-5-dev-progress-2026-09-25.md与evidence/story-9-5-browser-2026-09-25/development-baseline.json（implementation-artifacts下）

### T0实际结果

固定noble/amd64镜像在CI36134210825的环境job108068273744实际通过：Node22.22.1/pnpm11.7.0、Chromium153.0.8010.12/Firefox155.0/WebKit26.6及字体/配置hash已下载封存。只有环境预检，尚无产品流程/截图门禁；API返回的默认executable路径与Chromium默认headless-shell差别在t0-ci-verification.json明确记录，T1将显式指定一致launcher。

### T1当前新增与修改

- `.github/workflows/ci.yml`
- `apps/mobile/playwright.config.ts`
- `apps/mobile/tsconfig.e2e.json`
- `apps/mobile/e2e/flows/bootstrap.spec.ts`
- `apps/mobile/scripts/serve-browser-product.mjs`
- `apps/mobile/scripts/browser-environment.mjs`
- `apps/mobile/scripts/check-workbench-isolation.mjs`
- `apps/mobile/scripts/check-workbench-isolation.test.mjs`
- `apps/mobile/package.json`
- `apps/mobile/vite.config.ts`
- `eslint.config.mjs`
- `pnpm-lock.yaml`

产品不可用首屏仅本地两引擎通过，等待canonical三引擎；隔离红/绿和类型/构建证据见evidence/story-9-5-browser-2026-09-25/t1-local-validation.json。
