---
story: 9-4-component-workbench-and-enforced-code-quality
date: 2026-09-25
kind: read-only-repository-research
status: preparation-input
implementation_performed: false
---

# Story 9.4 仓库上下文与实施护栏

本报告只记录当前工作树核验及建议。未安装依赖、运行真实服务、修改业务源码或变更 Sprint；没有把工具方案当成已实现。来源为当前仓库，不依赖旧聊天中的测试数量。当前 HEAD 为 `7250a8a131a370698bff53538a4405c2ddb94c1c`，已有大量未提交工作，不能以 HEAD 文件覆盖工作树。WSL 实际 Node 为 `v22.22.1`、pnpm 为 `11.7.0`。

## 1. 范围与立即可用的入口

正式源 `epics.md:7226–7278` 有 6 组 GWT：当前组件样例、隔离 MSW、真实 typed lint、不可增长的历史问题、交互/a11y 缺陷检测、产品隔离。9.4 不依赖未来 9.3；9.5 的跨浏览器关键流程/截图与 9.3 的共享组件迁移分别验收。需求绑定为 FR52、NFR3/7/8/25，工程条件只为 CODE-QUALITY-01、UI-WORKBENCH-01。本轮准备不解除 1.7 停止边界、不恢复 3.1。

适合首个样例的是**直接导入现有 HomeSheet**，再使用一个仅工作台的有状态 wrapper 放置标题、现有 `.field` 字段、关闭按钮与合成状态。这样组件本体现在就存在，不需要先建立 AppSheet。真实字段消费可补现有 LoginScreen 的工作台场景，使用其既有依赖注入与 MSW，不新造一个生产 FormField。

| 现有文件 | 当前行为与可复用点 | 9.4 必须保留的边界 |
| --- | --- | --- |
| `apps/mobile/src/home/HomeSheet.tsx:1–25` | `label/onClose/children` 受控 API；打开记录焦点并聚焦第一个可聚焦项；Tab/Shift+Tab 环绕、Escape 回调；卸载恢复仍连接的触发器；自身无 API 请求 | 使用真实组件开展打开/关闭/键盘/焦点恢复，不把示例内复制的 Dialog 当复用证据 |
| `apps/mobile/src/auth/LoginScreen.tsx:16–23,80–110,124–156,344–403` | 可注入 apiClient、analytics、platform、外链与 captcha；既有真实字段、加载、重试、禁用与状态文字；有 interval、订阅和取消 | 若作为样例，完全合成响应、独立 origin、清理状态；不要改变手机号意图、challenge、发送不确定性、迟到回包隔离 |
| `apps/mobile/src/home/HomeScreen.test.tsx:8–12,95–123,250–312,356–392` | 注入 HomeApiClient、ImportDockController 与内存 journal；已有未知输入、候选、迟到结果、单弹层等确定性用例 | 可借场景设计，不能把 `vi.fn` 工厂直接当 MSW 或浏览器测试；不为工作台重写 HomeScreen |
| `apps/mobile/src/home/journal.test-support.ts:1–16,44–46` | 明确 unit-test-only 的内存 OperationJournal；durable commit 故意报不可用 | 不得将其包装成真实 IDB/跨进程持久性证据；不把它导入产品 |
| `apps/mobile/scripts/import-measurement-harness.tsx:1–17,19–30,54–96,106–108,134–168` | 独立入口；复用实际 HomeImportDock/controller；合成 API、唯一 journal、最终释放 root/controller/timer；有 partial/failure/reconnect 矩阵 | 可复用隔离与清理模式；其延时测量和业务写入替身不是 9.4 必须移植的第二套状态机 |
| `apps/mobile/src/home/HomeImportDock.tsx:31–54,93–105,129–139` | 真实状态/部分结果/重连/禁用/输入呈现；依赖 controller、auth、inputInbox，并执行可见性/展示 ACK | 不是纯展示组件。若扩展工作台到 Dock，必须显式生命周期和合成 scope；不要直接挂载后误写默认 journal |

**HomeSheet 已存在的不足属于 9.3 迁移清单：**没有 Portal、背景 inert/滚动锁、原生返回注册、身份感知的焦点回退或完整嵌套层管理；`aria-modal=true` 本身不提供这些行为。可聚焦选择器也不是成熟焦点管理器。9.4 应测试现有 Tab/Escape/恢复约定，记录不适用/待 9.3 的能力，不能偷偷实现新的 AppSheet 管理器或宣称完整原生模态验收。若负例揭示必须修的现有窄缺陷，限定修改、保留业务接口并补对应回归。

## 2. 依赖与配置现状（UPDATE 文件均已全文读取）

完整读取并解析 `pnpm-lock.yaml` 的 importers/packages/snapshots；其中没有 Storybook、MSW、ESLint、typescript-eslint、Playwright、Tailwind、Base UI 或 shadcn。声明的批准候选仍是目标，不是当前已安装能力。

| 文件与行号 | 当前内容 | 对应修改与必须保留的内容 |
| --- | --- | --- |
| `package.json:8–30` | `ci:lint` 仅 echo；已有 types/build/mobile/handoff/合同/测量脚本；typescript 实际锁 5.9.3 | 替换占位为真实 gate；新增工作台构建/interaction/a11y/反例命令。既有脚本全部保留，不能让新脚本只调用 tsc 或吞退出码 |
| `apps/mobile/package.json:6–38` | build 为 tsc + Vite；test 为 Vitest + Node native-config-proof；现有 typecheck/native:sync/preflight/verify | 新增独立工作台脚本与精确 devDependencies；不改生产入口，保留 Node 配置测试与 native 三脚本 |
| `pnpm-lock.yaml:1–99,2005,2536–2544,2904–2909,2966,3009` | lockfile9；autoInstallPeers=true；React/DOM19.2.7、Vite8.0.16、Vitest4.1.9、jsdom29.1.1、tsx4.20.6、TS5.9.3 | 准备阶段仅冻结候选；实施时在 WSL 按本 Story 精确版本生成锁并核验 peer，不 `--force`。保持现有 React/Vite/Capacitor 版本 |
| `pnpm-workspace.yaml:1–21` | apps/*、packages/*；显式 allowBuilds/onlyBuiltDependencies（Prisma/esbuild/msgpackr/Puppeteer 等） | 默认无需修改。只有已核验新增制品确需 build hook 时才增最小项；不改成允许所有 scripts，也不新增 packages/ui |
| `apps/mobile/tsconfig.json:2–20` | strict ES2022、Bundler；types 包含 Vite/Vitest；include 仅 src、vite.config.ts | 让新工作台 TS/TSX 与配置实际进入专用 typecheck/typed lint 的 TS project；优先新增工具 tsconfig，保持产品配置语义，避免用 allowDefaultProject 通配整个仓库 |
| `apps/mobile/vite.config.ts:1–14` | React 插件、从 native-build-config 读取 JS/CSS 目标；Vitest jsdom/setupTests；排除 Node mjs 测试 | 若加入 Storybook Vitest project，隔离 browser 与 jsdom 项目并继续执行原单元测试；不要全局替换 test environment 或重复 React 插件；保留 WEB_BUILD_TARGETS/CSS_BUILD_TARGETS |
| `apps/mobile/src/setupTests.ts:1` | 仅 jest-dom/vitest | 可为专用新网络测试增加 MSW lifecycle；不无条件将全部旧 Vitest 改成同一个全局 MSW server，以免篡改原 fetch/bridge 测试。用独立 workbench setup 更易保持边界 |
| `.eslintrc.json:1–10` | 无 TS parser/插件的旧 eslint:recommended 配置；并无安装/CI 执行 | flat config 成为唯一执行入口；清楚退役旧入口，不能并行保留两个声称生效的规则系统。只删除该配置不涉及业务逻辑 |
| `.github/workflows/ci.yml:33–128` | 已有真实类型生成、handoff、build、鉴权/导入/PG/移动/旧合同/synthetic/SSE；未调用 ci:lint；Node22 浮动 patch | 加真正失败即阻断的 lint、工具负例与工作台检查，固定工具需要的 Node patch；保存既有步骤与隔离服务。9.5 的全面 Playwright 流程/截图另交付 |
| `.gitignore:11–38` | 忽略 dist/native builds/秘密/本地 SDK；未覆盖 storybook-static 和工具报告 | 增加本 Story 的工作台临时产物和测试运行目录；可审阅的证据摘要/源码基线不能误忽略 |
| `docs/ops/ui-validation.md:1–28` | 批准目标，明确工具尚未实施、MSW不入产品、冻结 lint 历史例外、CI 层次 | 实施后加入可执行命令、确切样例/作用域/退出码、覆盖清单和产物路径；只更新实际完成部分，不冒称 9.5 已交付 |

`styles.css` 全部 1546 行与 `platform/app-host.css` 全部 43 行已读：前者存在未分层的全局 reset/button/input 字体规则（1–36）、字段（170–206）、Home backdrop（292–295）、bottom-sheet（584–599）、多处固定 px 与 reduced-motion（1520–1534）、私有内容遮蔽（1537–1538）。后者只对 native dataset 应用 safe-area。工作台应引入这些现有 CSS 与合成宿主样式变量，**默认不修改它们、不接 Tailwind Preflight**。200% 验证不能仅把 wrapper font-size 放大却让固定 px 字体不变；要记录实际浏览器缩放/字号测试方法。

现行目标由 `native-build-config.ts:5–8` 统一给出：Android WebView111、iOS16.4、Chrome/Edge111、Firefox128、Safari16.4。独立工作台采用现代开发运行环境并不改变产品最低支持合同；9.4 构建隔离检查需保留现有 native:sync/verify 的双端 JS/CSS/工程目标校验。

## 3. 建议的 NEW / UPDATE / REUSE 文件计划

以下是 9.4 实施清单，不表示文件已存在；最终命名可以按已核验 Storybook API 调整，责任不能丢失。

| 类型 | 文件/区域 | 职责 |
| --- | --- | --- |
| NEW | `apps/mobile/.storybook/main.ts`、`preview.tsx`、专用 `vitest.setup.ts` | 仅本地/静态工作台入口、现有 CSS、状态装饰器、MSW/a11y/interaction、合成身份清理；关闭工具遥测与非必要远程资源 |
| NEW | `apps/mobile/.storybook/public/mockServiceWorker.js` | 仅工作台 staticDirs 提供的固定 MSW worker；**不能放产品 public/**，因为 Vite 会复制 public 到产品 dist |
| NEW | `apps/mobile/src/workbench/HomeSheet.stories.tsx`、`LoginScreen.stories.tsx` 与必要 scenario wrapper | 直接消费实际 HomeSheet/现有字段状态；显式长中文、200%、loading/empty/disabled/error/reconnect，核心 keyboard/focus/reduced-motion/身份未确认 |
| NEW | `apps/mobile/src/workbench/mocks/{handlers,fixtures,server,browser}.ts` 与测试 | generated API 类型合成数据、场景级 handlers、浏览器/Node复用、未声明请求失败与静态资源白名单；不要生成第二份业务 schema |
| NEW | `apps/mobile/tsconfig.workbench.json` 与必要独立测试配置 | 确保工作台配置、stories、handlers 全部真正 typecheck/typed lint；与现有 jsdom、Node native tests 分开 |
| NEW | `eslint.config.mjs`、`scripts/check-code-quality.mjs` 与 gate 回归测试 | 真正调用固定 ESLint/TS/Hooks/a11y，核验覆盖、冻结债务和非零退出码；保存解析错误与未覆盖文件为失败 |
| NEW | 版本化 lint scope/debt manifest + 临时负例模板 | 固定初始 cohort、历史例外摘要/原因/责任/退出条件；负例不混入生产或正常 tsc sources |
| NEW | `apps/mobile/scripts/check-workbench-isolation.mjs` 与隔离回归 | 入口/模块图/构建资源/运行网络与 worker 检查；产品 dist 及 native synced assets 无开发工具 |
| UPDATE | 上节 package/lock/必要 tsconfig/Vite/CI/.gitignore/验证文档 | 只实现本 Story 的命令、依赖、检查与证据；不迁移领域代码 |
| REUSE | `HomeSheet.tsx`、`LoginScreen.tsx`、`styles.css`、`app-host.css` | 原组件/样式作为样例来源；只有真实发现的窄缺陷才 UPDATE，并记录原行为、变化原因及回归 |
| REUSE / PROTECTED | App、auth transport、controller/journal/checkpoint、host runtime、生成 API、PG/native probes | 不为工作台修改业务事实或认证。9.4 不接 Query/Router、共享 AppSheet、Playwright 截图基线或重构服务端 |

工作台 worker 放 `.storybook/public` 的建议依赖实际 staticDirs/base path 核验；测试必须覆盖运行时能找到 worker，不能为了“产品无 worker”把工作台本身做坏。构建检查既要拒绝产品目录中的 worker，也要证明正常产品仍走既有 transport。

## 4. Typed lint 的明确初始 cohort 与历史问题约束

建议首轮固定以下集合，并在 manifest 中逐一枚举实际解析出的文件，避免泛称“lint 已覆盖整个项目”：

1. 全部新建 `src/workbench/**/*.{ts,tsx}`、`.storybook/**/*.{ts,tsx}`、专用工具/测试配置和 gate 脚本。
2. `apps/mobile/src/home/HomeSheet.tsx` 与 `apps/mobile/src/auth/LoginScreen.tsx`，作为本 Story 实际展示组件。直接复用不意味必须改业务实现；旧问题可按下述规则冻结。
3. 本 Story 修改到的所有 TS/TSX/JS/MJS 文件及相应测试；后续所有 `src/ui/**/*.{ts,tsx}` 自动纳入，页面迁移涉及源文件必须加入覆盖，不能只 lint 新共享目录却漏掉消费者。
4. 未改的历史 auth/journal/服务端等不为 9.4 大规模清理；明确列为未纳入首轮全量 typed-lint 证明的区域。独立 typecheck/原测试照常保留。

**首个强制作用域不能只用 `git diff HEAD` 推断。**本仓库 HEAD 早于大量现有未提交实现，diff 会把此前 1.0/1.6/1.7 工作错误当成 9.4 新增。实施前冻结当前文件清单和内容摘要作为本 Story baseline，记录基准 HEAD 与工作树差异；CI 可用明确 PR base 的 diff 做后续补充，并包含新增/重命名文件。缺 base、零文件、模式漏匹配或被 ESLint ignore 的受管文件都应失败而非绿色空跑。

历史 lint 债务不能只限制“总条数不能增长”：修掉 A 后新增 B 仍可能总数不变。每个例外至少绑定 repo-relative path、ruleId、诊断/AST 节点片段摘要、原文件摘要、数量，以及原因、责任 Story、退出条件。执行每次实际 lint，仅匹配这些既有诊断；不匹配的新诊断、重复数量增长或 config/parser 错误均失败。已消失的诊断应从清单删去，不能自动再生成放宽清单。改动文件不得通过刷新文件 hash 自动获得新豁免；范围/例外扩展必须作为可审阅的明确合同调整，不能由 CI 修复脚本静默批准。

为降低无关变更，可保留未改文件的冻结诊断；被修改文件的旧诊断如何仍匹配必须精确到原节点，变更节点/新行无豁免。若实现采用更严格的整文件摘要使任何修改都撤销该文件豁免，也应明文记录并安排其原责任 Story，不能为过门禁顺手重写鉴权/恢复。全目录 `eslint-disable`、宽泛 ignore、`|| true`、max-warnings 放行和以 tsc 代替 lint 均不满足 AC3/4。

类型规则至少真正启用 no-floating-promises、no-misused-promises 及约定 unsafe 规则；Hooks/a11y 选择所锁版本支持的规则。三类必需缺陷要调用**与 ci:lint 相同入口和配置**验证：未处理 Promise、条件调用 Hook、label/控件关联遗漏。不要只直接调用单个 RuleTester 后宣称 CI gate 会拦截；也不能只测试 `<label>` 缺控件却漏掉实际输入可访问名称问题。

建议 gate 负例：新文件漏覆盖、改扩展名/重命名后漏覆盖、一个旧诊断移除后新增同 rule 诊断、移动/复制被豁免节点、新增/扩张债务行、把规则关闭、吞退出码、parser project 漏配置、lint0文件、旧清单不能自动增长、负例修复后真实退出0。临时副本运行测试，不能往现行业务文件里注入缺陷。

## 5. MSW、状态和产品隔离的具体边界

- 现有 `auth/api.ts:37–42` 在 dev 默认请求 `http://localhost:3000`，生产默认 `/api`；不可直接挂默认 LoginScreen 后假定请求一定被拦。使用工作台 origin 下的显式合成 baseUrl，并通过 `createAuthApiClient`/既有 transport 执行真实 Web 客户端路径，MSW 只替代响应。
- `auth/transport.ts:17–71` 在每次请求校验 epoch/activity、清理 Authorization/Cookie/X-User-Id、自带 credentials/include、取消和原生分流。不得新写一个“story transport”复制这些安全行为；MSW也无法证明 `NomadNativeAuth.request` 的桥接结果。
- handlers 对齐 `home/api.ts:9–23`、`auth/api.ts:6–12` 的生成类型及安全错误 envelope；对 partial/reconnect 采用明确已有 Snapshot/协议语义，不能给不支持 partial 的普通响应凭空加业务字段。
- 默认未声明网络失败；静态白名单限工作台同 origin 的明确资源路径与工具必需请求，不能“所有同 origin 通过”放走 `/api`，也不能所有外链通过。启动须等待 MSW 就绪；失败/worker404/路径不匹配不能降级访问真实接口。Node setup 也要同样 fail closed。
- 场景切换与卸载须 resetHandlers，abort未完成请求，清理 timer、订阅、合成 auth snapshot 和 dataset；需要 IDB 时使用唯一工作台数据库名且不接触 `nomad-*` 产品持久库。`session-context.ts:16–30` 会改变全局 dataset 与订阅，不能让一个场景的 checking 污染下一个场景。
- 产品入口现为 `main.tsx:1–10` → HostBootstrap → App；HostBootstrap:7–11 启动真实 host/inbox。工作台不直接复用该启动入口；App 的私有身份边界见 `App.tsx:137–153` 和 CSS1537–1538，不能声称仅 HomeSheet wrapper 测试就覆盖了完整 App 边界。
- 工作台 / 测试代码与 worker 不可经产品 imports、Vite publicDir、插件副作用或 native sync 混入。验证 dist/native assets 的资源清单及打包模块来源，补产品页面运行网络与 ServiceWorker registrations 检查；只搜索压缩 bundle 中几个字符串不构成完整证明。采用干净独立浏览器 origin/profile，避免残留工作台 worker 控制产品测试。
- 9.4 a11y/interaction 证明需带组件/场景/源码摘要；axe通过不是 VoiceOver/TalkBack/真机。错误关联、状态不仅依赖颜色等有不足时保留明确人工检查步骤与结果，不能把“需人工检查”填成通过。

## 6. 当前 CI 实际接线与独立探针清单

这里的“已接入”只表示 workflow 中确实调用，**不表示本次重新运行通过**。只读核验未执行这些探针。

| 检查族 | 当前 CI 情况 | 9.4 / 后续责任 |
| --- | --- | --- |
| OpenAPI类型生成、handoff、handoff回归、workspace build | 已接：CI51–61 | 保留；生成后是否 drift 失败需实际确认，不能把运行 generate 等同于 drift gate |
| 鉴权单元/API合同、ingest测试/命令合同 | 已接：CI66–70 的 Node --test 通配与两个 contract checkers | 保留；不同于所有 package脚本都已调用 |
| 隔离PG迁移、auth-persistence/auth-http/auth-ingest | 已接：CI63–85；`AUTH_TEST_DATABASE_ACK=isolated-synthetic-only` | 真PG/HTTP且显式 provider substitutes；不改成MSW，非真实服务验收 |
| benchmark-stream负例、PG备份Python单元、bounded_process | 已接：CI72–76 | 保留；并非实际PITR/生产RPO |
| Mobile Vitest + native-config Node测试 | 已接：CI87–88 经 package test | 防止Storybook browser project覆盖掉原jsdom或丢弃Node config proof |
| Home/Library、Planner、Settings合同探针 | 已接：CI90–97 | 保留；`test:planner-domain` 未在现行workflow独立调用 |
| Puppeteer Chrome安装、fixture server、synthetic ACK、SSE断言 | 已接：CI99–123，服务启动明确test/fixture模式 | 并没有因此执行所有 mobile browser probes；9.5 才负责正式浏览器流程矩阵/截图 |
| `ci:lint` | 命令仅占位且未在workflow调用 | 9.4必须替换命令并实际接入CI，覆盖/退出码有负例 |
| `ci:import-measurements`、measure:import-dock/report | package有命令但workflow未调用 | 记录为独立；测量仅在对应证据责任下接线，不凭增加Storybook改写测量 |
| auth-browser、home-dock、operation-journal、telemetry browser probes | `apps/mobile/scripts/*browser-probe.mjs` 已存在，workflow未调用 | 9.5建立等价覆盖/保留清单前全部保留；journal真实IDB/WebCrypto/跨进程不可被MSW替代 |
| ingest-checkpoint、durable-dock-pg、durable-dock-pressure browser probes | workflow未调用；前者真实IDB/进程，后两者真实PG/Auth/SSE/IDB且显式隔离数据库声明 | 9.5/1.7责任保留；要隔离资源与有界执行，不在普通组件用例中悄然启动 |
| auth-ingest-events/lease/replay/worker/sse/restore probes，recovery benchmark | scripts存在，workflow未逐项调用 | 保留1.7真实事务、SIGKILL、socket、restore证据；不能把CI已有auth-ingest-probe误认为包含全部新恢复探针 |
| native:sync/preflight/verify、Android编译、iOS/真机/TestFlight | 现行CI未配置这些步骤 | 9.4做受影响产品构建隔离与必要sync验证，不能宣称CI或组件扫描证明全部APP-HOST |

独立探针的源码证据：`auth-browser-probe.mjs:1–32` 明确Chromium与HTTP/captcha替身；`home-dock-browser-probe.mjs:1–20` 包含实际HomeSheet/CSS等文件摘要；`operation-journal-browser-probe.mjs:1–25` 明确真实IDB/WebCrypto与合成owner；`ingest-checkpoint-browser-probe.mjs:1–32` 包含真实数据库/加密与SIGKILL；两份durable-dock探针:1–30包含真实PG/HTTP入口与隔离声明；`telemetry-browser-probe.mjs:9–30` 固定隔离origin和外发拒绝。均不能在9.4无覆盖比较地删除。

CI当前PG服务使用 `postgres:15`（CI14），工具测试 Node22 未固定patch（CI45）。这些是当前配置事实；本报告未检查远端CI执行状态。9.4只处理所需工具精确版本与新增gate，不能顺带升级数据库或把受控staging历史PG证据替换成CI镜像声明。

## 7. 准备合同应保留的交付证据

6组AC分别绑定：可启动/静态工作台与具体场景索引；共享handlers的Node/浏览器正负例；真实ci:lint三类缺陷与修复后的退出码；依赖peer/冻结债务/覆盖负例；interaction/a11y缺陷与人工项；产品入口/模块图/资源/网络/worker与native同步资源隔离。每份记录带当前source与lock/config摘要、命令、退出码、工具版本、适用环境和剩余限制。

完成9.4只能逐项关闭 CODE-QUALITY-01 与 UI-WORKBENCH-01 的本Story使用；不能关闭9.3/9.5/1.0/1.7/9.1的条件。无需为本准备阶段跑业务测试或安装工具来制造“已验证”数字。
