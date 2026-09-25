# UI组件、浏览器与CI验证合同

Updated: 2026-09-20
Status: 9.4 implementation under verification; 9.5 pending

交付一个可运行的组件状态工作台，先覆盖已有 HomeSheet/字段，再由 9.3 补共享组件示例。每个核心组件至少有正常、加载、禁用/原因、错误/重连、长中文、200% 字号、键盘、reduced-motion 与身份未确认场景；复杂组合补 empty/partial/stale。Storybook 展示用例不是 BMAD Story 状态。

MSW handlers 对齐生成 API 类型及现有安全错误，浏览器/Node 测试复用；未处理请求默认失败，静态资源允许清单明确。独立入口/构建产物中才启用，正式 Web/Capacitor build 无 mock worker/自动注册及相关启动分支；不让 MSW 改写真实 native transport 或替代 PG/设备验证。组件工作台不加载真实生产密钥，不上传用户数据，也不默认公开发布。

用 ESLint flat config + typescript-eslint 类型规则 + Hooks + JSX a11y 替换占位 `ci:lint`，CI 实际调用且失败阻止通过。初始覆盖新共享层、工具配置和迁移涉及的实际源文件；既有问题按文件/规则/原因形成冻结清单，只减不增，不能整目录关闭规则或用 `|| true` 掩盖结果。选择 no-floating-promises/no-misused-promises、必要 unsafe 类型、Hooks 与 label/交互语义规则；不要因修 lint 改写业务状态机。负向样例必须证明未处理 Promise、错误 Hooks 和缺失 label 会失败。[类型检查规则](https://typescript-eslint.io/getting-started/)

## Playwright与日常CI

保留 Puppeteer 旧探针，先建场景对应表，证明等价覆盖后才退役重复脚本。首批：登录→Home→Settings→返回；Sheet 打开关闭/焦点/滚动；输入错误、loading/empty/partial/reconnect；身份变更遮蔽 portal；Home FIFO/操作回执不重发；长中文和大字号。现有 operation journal 的真实 IDB/双 tab/跨进程、1.7 的 PG/真实 SIGKILL/SSE 探针按原责任保留。

固定 Linux 镜像、Playwright/browser revision、字体、locale、timezone、viewport、DPR、时钟、数据及动画策略；截图按引擎独立基线。CI 输出 actual/expected/diff 和 trace，基线更新是显式审阅动作，不自动接受 diff。Chromium/Firefox/WebKit 流程至少都有身份与弹层覆盖；浏览器自动化不代替真机、最低特定浏览器或供应商实证。

| 层次 | 必须保留/加入的检查 | 不得替代的证据 |
| --- | --- | --- |
| 每次改动 | 生成类型及漂移、实际 typecheck/lint、handoff、单元/组件、受影响 Storybook interaction/a11y、构建 | 真实接口/原生能力 |
| 合并前 | 上述检查 + 关键浏览器与截图、受影响 PG 事务/迁移/恢复/真实 socket 探针 | 供应商与真机 |
| 发布前 | 明确候选源码/资源摘要 + 最低/当前平台真机、真实服务、签名/升级/APK/TestFlight | mock、模拟器、仅构建或上传受理 |

CI 清单逐一标注现有认证/ingest probes、home-dock/auth/journal/telemetry browser probes、measurements、1.7 event/lease/worker/replay/SSE/ACK。哪些已在 CI、哪些仍独立、哪些需隔离资源，都写入交付证据。不要把提案里的目标清单说成现在已执行。

## 当前证据边界

9.4已接入独立工作台、共享MSW2 handlers、真实typed lint与单Chromium交互/a11y。Storybook10.6.0、MSW2.15.0、addon3.0.3、Playwright1.63.0/Chromium1243精确锁定。T0审计发现Vitest4.1.9已披露browser/mocker漏洞，实施采用同组4.1.11；ESLint9.39.5受jsx-a11y6.10.2 peer约束，停止支持提示与既有依赖告警保留，不声称全仓audit清零。具体决定与审计见story-9-4-execution-decisions-2026-09-25.md及其evidence目录。

工作台只直接消费HomeSheet、LoginScreen和既有样式。HomeSheet的Portal/inert/滚动锁/身份焦点及native返回仍归9.3；合成身份例只验证展示。9.5仍负责跨浏览器产品流程和截图基线，当前截图只记录本轮组件/隔离运行。真实auth、PG、IDB、SIGKILL、SSE、原生设备及最低版本证明不被替代。

### 实际命令

两端使用Node22.22.1、pnpm11.7.0。首次运行 `pnpm install --frozen-lockfile --strict-peer-dependencies`，再用 `pnpm -F nomad-mobile exec playwright install --with-deps chromium` 安装锁定浏览器及宿主库。组件中文视觉检查需要Noto CJK或记录的等价字体。WSL已有store时可加 `pnpm_config_store_dir=/tmp/nomad-sp-pnpm-store`；pnpm11使用pnpm_config前缀，不能用npm_config代替。Mac使用本机store，不提交机器路径。

| 命令 | 实际范围 |
| --- | --- |
| `pnpm -F nomad-mobile storybook` | 127.0.0.1:6006开发工作台，不自动公开发布；遥测关闭 |
| `pnpm -F nomad-mobile build:storybook` | 独立storybook-static，专属MSW worker |
| `pnpm run ci:lint` | 先生成OpenAPI/Prisma客户端类型；实际ESLint/TSProgram，列出cohort与未改历史文件，零保留豁免 |
| `pnpm run ci:lint:negative` | 同门禁Promise/void/Hook/label及修正、新增/重命名、浅克隆/基准、ignore/parse/规则、基线/豁免反例 |
| `pnpm run ci:workbench` | 专用typecheck、Node共享handlers、静态build、Chromium play/axe error |
| `pnpm run ci:workbench:negative` | 只在Vite内存转换缺陷，不改源码；焦点/键盘/字段/文字/axe、未声明/迟到请求、worker丢失/404、真实provider配置反例及修正控制 |
| `NOMAD_RECORD_PRODUCT_GRAPH=1 pnpm -r build` | 产品实际入口与模块来源；关闭本地env加载，图谱保存在工具结果目录 |
| `NOMAD_NATIVE_ENV=development pnpm -F nomad-mobile native:sync` / `native:verify` | 开发候选双端资源/插件/16.4等目标；不是APK构建或iOS实机证明 |
| `pnpm run ci:workbench:isolation` | 产品模块/资源及两端完整目录，污染反例，干净origin的公开不可用路径及工作台实际运行 |

普通ci:lint默认比较9.4开发基线abac3df；CI必须给CODE_QUALITY_BASE/CODE_QUALITY_HEAD。PR基准是event base SHA与实际checkout merge SHA，push是before SHA；全零首次push执行完整初始cohort与自基线新增/修改源文件，非零缺失基准失败。首轮固定HomeSheet/LoginScreen，全部新工具与workbench以及后续src/ui自动进入；任何已变源文件也进入。原始coverage manifest摘要固定，例外只允许消减，新诊断不能靠移动/等量替换/ignore/void过关。

### 当前CI与独立证明对照

`.github/workflows/ci.yml`保留原检查，并增加精确Node、完整Git历史、lint/负例、工作台、锁定Chromium、native资源/污染和实际运行检查；Ubuntu24.04 runner。9.4开发分支push及到其已推送父分支的PR也运行，便于提交实际CI证据。CI产物保存.workbench-results和工作台索引；本地通过与远端run结论分别记录，未执行的远端job不计通过。

| 已存在责任 | CI实际入口/位置 | 本Story处理 |
| --- | --- | --- |
| API类型/build/handoff | ci:types、ci:build、ci:handoff与check-handoff.test.mjs | 保留并执行 |
| auth/ingest单元和合同 | auth/*.test.ts、ingest/*.test.ts、check-auth-contract、check-ingest-dock-contract | 保留 |
| 实际PG认证 | CI隔离PG15 migrate/seed，auth-persistence/http/ingest probes | 保留；不得由MSW替代 |
| mobile/jsdom/native配置 | ci:mobile：src内Vitest及native-config-proof.test.mjs | 保留独立配置，工作台不混入 |
| 老Home/Planner/Settings/synthetic/SSE | ci:home-library/planner/settings/probe/sse＋显式fixture server | 保留，不在9.4退役 |
| 备份与进程工具 | benchmark-stream.test、ops/postgres unittest、bounded_process | 保留 |
| 原浏览器auth/home-dock/journal/telemetry与IDB/双tab | 各独立scripts/probe，原Story证据目录 | 未全部纳入日常CI；9.5建立等价覆盖表，真实IDB职责保留 |
| 1.7 event/lease/worker/replay/socket/SIGKILL/ACK/PITR | 各隔离PG/进程/设备脚本及封存报告 | 仍独立资源证明，不重复或虚称由工作台覆盖 |
| 正式基线/费用/人评、原生真实设备 | 1.0/1.6/1.7/9.1及后续Story | 保留真实资源与逐Story关闭门槛 |

### 场景与限制

18个当前组件场景（含场景清理并发）覆盖HomeSheet键盘/焦点/卸载、empty/partial/长中文/200%实际字号/reduced-motion/合成身份未知，Login正常/空/loading/403/超时/重连/验证码禁用原因/长中文/200%字段。200%对实际computed font逐项加倍，固定px字段也被检查；不等于系统字号/VoiceOver/TalkBack验收。验证reduced-motion场景时系统/浏览器需启用减少动效；CI provider显式启用。HomeSheet只负责弹层边界，网络content是类型化合成子内容，不冒充HomeImportDock恢复。

工作台配置/场景和测试各有独立cacheDir（browser用post config hook防addon覆盖），避免与产品jsdom或反例互相污染。MSW worker字节与锁包一致；只在.storybook/public并等到激活。未知/外部请求在fetch守卫或MSW兜底失败，收尾账本使业务catch仍失败；迟到的旧client同时污染当前账本并失败。场景只清自己的timer、请求、合成身份和工作台origin的device标识，不访问产品IDB或注销其他origin的worker。

本次实际证据入口：`_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/`。真实CI与独立CR完成前9.4继续in-progress。

审阅修补：API仅在工作台使用随机场景前缀，原/auth等生成合同路径保留；plain fetch不能借用下一场景，静态资源旁路不适用于programmatic fetch。finish Promise复用、切换串行化；worker.stop与异步lookup用epoch围栏。loading保持等待至取消，timeout通过受控abort模拟并核对取消计数，不宣称产品新增超时策略。Node使用同一finish强制校验ledger，预期违例为普通断言；MSW Accept旁路被记录/清除，Node无静态passthrough。产物绑定writeBundle实际bytes；390px运行与截图探针验证横向溢出和动作可达。

CI的Prisma client生成位于typed lint之前：服务器脚本进入覆盖后不能靠本机旧生成物提供类型。该顺序有干净副本中缺生成物失败、生成后通过的实际反例。它不是数据库迁移；DB迁移与PG探针仍按原独立步骤执行。

旧fixture服务器仅在隔离CI步骤显式开启持久ingest worker（INGEST_WORKER_MODE=enabled、INGEST_RECOVERY_ISOLATED=false）；生产默认关闭不变。synthetic/SSE继续走实际PG，子阶段允许持久快照重复但不允许缺失或错误阶段，scripts/sse-assert.test.mts以实际HTTP/原探针执行正反例。Redis自然退出探针在专用CI实例执行正常/暂停回复验证，禁止指向共享服务。
