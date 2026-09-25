---
project: nomad-mvp
story_id: '9.4'
date: '2026-09-25'
kind: independent-execution-readiness-review
workflow: bmad-create-story/checklist.md
status: ready-for-authorized-development
reviewed_story: _bmad-output/implementation-artifacts/9-4-component-workbench-and-enforced-code-quality.md
initial_reviewed_story_sha256: c6197a64e507b1c9587f895f637633d8abce374034aa4ef6edacecc434357fd0
reviewed_story_sha256: 11172d21546d4dd19d8fd7430941c495d26a1a17bc26f5f1c2f4caef3616ccc9
source_contract_sha256: a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27
reviewed_lock_sha256: a0e3e64ebba0437bb4c00da9f384d728a3db5edd2138e0ab2933364b06165ea6
scope_revision: ui-foundation-2026-09-20
execution_authorization: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
execution_authorization_verified: true
tasks_unchanged_after_authorization_sync: true
source_story_and_ac_unchanged_after_authorization_sync: true
technical_blockers: []
required_contract_corrections: []
static_contract_checks:
  passed: 18
  failed: 0
implementation_performed: false
business_tests_run: false
dependency_install_performed: false
---

# Story 9.4 执行前定向独立复验

结论：**当前9.4合同足以直接进入已授权的T0/T1开发；未发现新的技术阻断或必须先修订的合同遗漏。** 现有任务已经覆盖工作台真实消费、固定依赖、MSW隔离、真实typed lint、interaction/a11y、产品资源隔离和CI失败传播。无需等待9.5、9.3、1.0/1.7/9.1整张完成，也无需以正式账号、短信、Mac签名或真机作为这张工具Story的开发前置。

本结论是准备质量与执行可行性的定向VS，不是工具运行通过。最终已重读主任务新建的 `sprint-execution-resume-2026-09-25.md`：记录用户解除旧停止边界、仅为即将实施Story滚动准备并新启任务开发/审阅的明确方向。CURRENT现指9.4 ready-for-dev，CURRENT/Sprint的stop_after_story均为null，当前合同execution_dispatch_authorized=true且引用该恢复记录；3.1暂停与真实资源门槛保持。普通9.4开发已有授权，无需再次确认。本审阅不修改这些共享文件，也不据自身报告派发其他Story。

## 独立性、输入与方法

本审阅者未参与9.4原始准备或两份原独立review。按 `.agents/skills/bmad-create-story/checklist.md` 检查防重复实现、当前文件位置、版本/API、回归、安全边界和验收证据，完整读取当前9.4合同、同名validation及当日tooling/repository/contract-review/plan-review四份研究；复查正式9.4源、当前catalog/delivery和批准UI ADR/实施条件。原review只作为追溯输入，下面关键结论均再次与当前文件或固定官方制品核对。

实际只读核验范围：

- 根/mobile package、完整CI workflow、pnpm-workspace、lock的importers/packages、旧ESLint配置、mobile Vite/TS配置和setupTests、gitignore。
- HomeSheet、LoginScreen及PNVS直接分支、auth transport、产品main/HostBootstrap、native资源校验脚本；保护auth/journal/ACK的责任通过真实入口与合同保留项核对，不修改或运行业务恢复探针。
- `node --version`、`pnpm --version`、可执行路径和安装TypeScript版本；14个固定工具版本的npm官方registry记录，2个固定发布tarball的接口/实现片段；不执行制品代码或安装脚本。
- 只读Python/YAML/hash脚本做18项合同静态检查，退出码0；未运行lint、Storybook、业务单元测试、build、native sync、远端CI或真实API。

## 当前实际基线

| 项目 | 本轮重新查到的事实 | 对立即开发的意义 |
| --- | --- | --- |
| WSL runtime | `/usr/bin/node` v22.22.1；`/usr/local/bin/pnpm` 11.7.0；TypeScript5.9.3 | 与准备稿一致，可固定此Node patch开始T0 |
| 产品框架 | React/DOM19.2.7、Vite8.0.16、Vitest4.1.9、Capacitor8.5.2 | 不需要升产品主版本来接工具 |
| lock | lockfile9；`autoInstallPeers: true`；未含Storybook/MSW/ESLint/typescript-eslint/Playwright候选 | 依赖尚未落地；实际解析/脚本/安全审计和build必须在实施中完成 |
| lint/工作台 | `ci:lint`仍为echo占位；旧.eslintrc无typed parser；flat config、Storybook main和独立Vitest配置均不存在 | 正是本Story的交付工作，不是准备失败或已完成证据 |
| CI | Node22浮动patch、默认浅checkout，未调用lint或工作台；原PG/Redis/auth/ingest/mobile/合同/备份helper/synthetic/SSE步骤仍在 | T6已经明确固定Node、取得base和接新增gate，保留旧检查责任 |
| 测试边界 | 默认mobile test仍是jsdom Vitest＋Node native-config测试；TS include仅src与vite.config | 独立workbench目录/tsconfig/config是合理隔离，不把旧测试迁到浏览器 |
| 产品入口 | main→HostBootstrap→App；HostBootstrap启动host与input inbox | 工作台直接挂真实组件，不挂产品入口是必要且可执行的边界 |

## 版本、peer与固定API复核

本轮重新访问官方registry的14个精确记录均成功，版本存在且关键直接peer未发现冲突：

| 组合 | 重新核验结果 |
| --- | --- |
| Storybook/react-vite/a11y/vitest 10.6.0同组 | react-vite接受React19与Vite8；addon-vitest接受Vitest4与browser-playwright4；无需安装optional vite-plus/Prettier |
| @vitest/browser-playwright4.1.9＋Vitest4.1.9＋Playwright1.63.0 | browser provider要求Vitest精确4.1.9；Playwright是必需peer，当前计划包含它；Chromium二进制仍需按锁版本取得 |
| MSW2.15.0＋msw-storybook-addon3.0.3 | addon接受MSW>=2与Storybook10；CSF3入口与setup回调计划匹配固定制品 |
| ESLint/@eslint/js9.39.5＋typescript-eslint8.70.0 | 后者接受ESLint9与当前TS5.9.3；无须升ESLint10 |
| react-hooks7.1.1＋jsx-a11y6.10.2＋globals17.12.0 | 当前Node及ESLint9处于声明范围；jsx-a11y peer不含ESLint10，保留9.x正确 |

可追溯来源：[Storybook React-Vite固定记录](https://registry.npmjs.org/@storybook%2freact-vite/10.6.0)、[Vitest addon固定记录](https://registry.npmjs.org/@storybook%2faddon-vitest/10.6.0)、[browser-playwright固定记录](https://registry.npmjs.org/@vitest%2fbrowser-playwright/4.1.9)、[MSW addon固定记录](https://registry.npmjs.org/msw-storybook-addon/3.0.3)、[typescript-eslint固定记录](https://registry.npmjs.org/typescript-eslint/8.70.0)、[jsx-a11y固定记录](https://registry.npmjs.org/eslint-plugin-jsx-a11y/6.10.2)。其余固定URL与完整候选表保留于同目录tooling-research。

直接读取 `msw-storybook-addon@3.0.3` 发布包确认 `./csf3` export、`mswLoader(setup?: SetupFunction)` 及实际loader实现。类型注释说明CSF3是支持路径，针对CSF Next才指向新的preview annotations；当前合同没有要求自动迁移CSF Next。[固定制品](https://registry.npmjs.org/msw-storybook-addon/-/msw-storybook-addon-3.0.3.tgz)

直接读取 `@storybook/addon-vitest@10.6.0` 发布包确认自10.3自动提供preview annotations，旧setup含setProjectAnnotations会关闭自动提供；合同避免重复初始化的指导正确。[固定制品](https://registry.npmjs.org/@storybook/addon-vitest/-/addon-vitest-10.6.0.tgz)

本轮官方文档再次确认Browser Mode用自己的setupWorker且不能直接取得Vitest内建worker；Storybook addon将stories转为浏览器测试，a11y参数须设error才使CI失败。合同的独立配置、worker ready和a11y.test=error可以沿用。[MSW Browser Mode](https://mswjs.io/docs/recipes/vitest-browser-mode/)、[Storybook Vitest](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)、[Storybook a11y](https://storybook.js.org/docs/writing-tests/accessibility-testing)

这些只确认直接声明/API，不是完整传递依赖解析、安全审计、Chromium运行或兼容矩阵；T0已经保留相应执行检查，不应因这次重查删除。

## 逐项执行准备度

| 关注面 | 当前合同的具体落实 | 复验判断 |
| --- | --- | --- |
| 立即可运行样例 | T1直接消费HomeSheet/LoginScreen和现有CSS，独立wrapper与注入；不等待未来AppSheet/Tailwind | 可直接开始，组件与注入接缝确实存在 |
| MSW严格隔离 | T2 fixture captcha、交互前拒绝真实provider、worker就绪、静态allowlist、失败账本与业务catch反例、哨兵日志检查、场景清理 | 已覆盖原风险，无新增合同缺口 |
| PNVS误调用 | LoginScreen的aliyun-pnvs分支仍直接requestPnvsCaptcha，后者会加载vendor脚本；T2/Dev Notes明确fixture与误配/worker失败负例 | 事实与指导一致，不能只注入getCaptchaToken |
| 真正typed lint | T3唯一flat config、实际TSProgram、显式control-label、零覆盖/ignore/config失败、同CI负例与诊断级基线 | 充分；普通tsc/安装插件不能替代 |
| 旧债务与大工作树 | T0固定当前文件/规则/cohort；T3节点摘要/数量/责任及同数量替换、移动复制反例；T6新建/修改/重命名纳入 | 保留历史实现同时约束新增问题，避免从旧HEAD误判 |
| a11y与焦点 | T4真实HomeSheet键盘/返回与反例、字段label/error、a11y error、真实字号与明确人工结果 | 任务可执行；axe无法证明的部分没有被说成通过 |
| auth/journal保护 | 不挂HostBootstrap，不替换bound transport，不写产品IDB、不注销用户worker；不得借lint重构controller/cursor；误配/迟到负例 | 保护责任明确；真实PG/IDB/SIGKILL/SSE原证据继续独立 |
| 产品与native产物 | T5入口/模块/完整资源/网络/SW，双端复制目录全集与native-only污染负例 | 现native:verify只逐个比对Web文件，补充全集检查确有必要且已写入任务 |
| 实际CI | T6获取PR base/push before、缺基准失败、首次push全cohort、固定版本、真实执行与退出码/产物；保留原检查 | 可实施；远端是否跑过必须另记，当前未运行 |
| 关闭证据 | T7与Dev Notes要求两项本Story条件真实verified、ui-verification/source/hash/环境/现存路径 | 对齐当前checker，不会以not-applicable或别的Story证据关闭 |

18项静态检查涵盖源段SHA/catalog/Story指纹、Given/When/Then/And各6行逐字、三行叙事、Requirements、范围、Code quality补充、工程绑定、交付绑定、来源义务、实际Tasks包含义务、未勾选实现项与无前向Story依赖，全部通过。不是沿用旧validation的通过数字。

授权同步后再次完整读取9.4合同，与本复验初读版本逐字比较 `## Tasks / Subtasks` 至 `## Dev Notes` 的整个Tasks块，结果相等；`## Story` 至Tasks之前的叙事/Requirements/全部AC块也逐字相等。新文件SHA为 `11172d21546d4dd19d8fd7430941c495d26a1a17bc26f5f1c2f4caef3616ccc9`，本报告最终结论绑定此版本。变化限执行frontmatter、开头说明及末尾授权增量，没有重开源AC或任务设计。

## 不新增阻断，实施时必须完成的原有任务

1. T0先记录当前工作树与cohort，核对实际pnpm store，再按固定候选解析锁文件与传递依赖；检查实际脚本和安全审计结果。仅registry/SRI不能认定安装无风险或可运行，也不因此扩大安装脚本白名单。
2. T2优先证明无真实SDK/外发：worker未就绪或失败、误配PNVS、未声明请求被业务catch，以及迟到请求在账本清理前被计入。只有MSW handler定义或页面显示错误不构成通过。
3. T3/T6让同一个真实lint入口及TSProgram捕获三类缺陷，再验证修正后通过；初始cohort、修改/新建/重命名和浅clone基准不得绿色空跑。旧债务不是新代码或变更节点的豁免。
4. T4若在现有组件发现字段错误关联等窄缺陷，可按合同限定修复和回归；不能把失败一律标todo，也不能为过lint/a11y改写登录意图、unknown发送回执、跨owner fence或持久journal。HomeSheet尚缺的Portal/inert/native管理仍归9.3。
5. T5/T6分别提供Web、双端复制资源、干净origin网络/SW与远端CI实际证据；单Chromium工作台不关闭9.5 UI-BROWSER、9.3 UI-COMPONENT或App真机/TestFlight条件。

上述是已有Tasks的实施落点，不是要求重新规划、追加全量Story或再索取普通授权。建议直接以9.4 T0基线/精确依赖与T1最小HomeSheet工作台开始，按已有T2–T7收口；9.5/9.3由主任务按用户新的滚动顺序准备。

本次唯一写入为本报告。没有修改Story、CURRENT、Sprint、正式源、catalog/delivery、依赖、业务代码或CI，也没有运行安装/业务测试/真实服务。
