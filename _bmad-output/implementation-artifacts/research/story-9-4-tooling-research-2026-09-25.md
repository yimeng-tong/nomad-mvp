---
project: nomad-mvp
story_id: '9.4'
date: '2026-09-25'
status: preparation-research-only
scope_revision: ui-foundation-2026-09-20
implementation_performed: false
---

# Story 9.4 工具兼容性与独立验证研究

本记录服务于准备 `9-4-component-workbench-and-enforced-code-quality`。依据现行 `epics.md` 六组验收、`docs/ops/ui-validation.md` 和 `docs/architecture/ui-foundation.md`，9.4 应独立交付已有组件的工作台、MSW、interaction/a11y 与真实 lint；无需等 9.3 组件迁移或 9.5 浏览器流程。只读核验日期为 2026-09-25；本次未安装工具、修改业务代码、修改 Sprint、构建或运行新工具测试。

## 已核验的本地基线

| 项目 | 当前事实 | 准备时的含义 |
| --- | --- | --- |
| 运行环境 | WSL `/usr/bin/node` **22.22.1**，`/usr/local/bin/pnpm` **11.7.0** | 使用这些精确版本复现；不用 Windows 工具链 |
| 移动端 manifest | React / React DOM **19.2.7**，Vite **8.0.16**，Vitest **4.1.9**，React Vite plugin **6.0.2** | 本 Story 不顺便升级产品框架 |
| TypeScript | 当前安装 **5.9.3**；根 manifest 声明 `^5.9.3` | lockfile 实际解析和声明分开记录 |
| 移动端 module / tests | `type: module`；现有 Vite config 带 jsdom 与 `src/setupTests.ts` | 工作台用独立测试配置，不将原单元测试改到浏览器 |
| 根 lint | `ci:lint` 仍为打印占位 | 需要新增真正的规则执行和失败出口 |
| 现有 CI | pnpm 固定 11.7.0，Node 仍为浮动 `22`；未调用 `ci:lint` | 实施时固定 Node patch 并实际接入 lint/工作台检查 |
| 产品边界 | 新 UI Story 尚未开发；1.7 停止边界和 3.1 暂停保留 | 准备 9.4 不等于启动开发，也不关闭真实 App 条件 |

来源：本次读取 `CURRENT.md`、project-context、Sprint、当前 1.7 合同、现行源 9.4、根/移动端 package.json、pnpm-workspace.yaml、移动端 vite.config.ts/tsconfig.json 和 `.github/workflows/ci.yml`；执行 `node --version`、`pnpm --version` 及已安装 TypeScript 版本读取。

## 建议冻结的候选与声明兼容性

以下精确版本均已从 npm 官方 registry 对应版本记录核验存在。这里只证明 engines/peer 的声明相容；完整依赖解析、安装脚本、构建及浏览器运行仍是实施门槛。不得通过 `--force` 或关闭 peer 检查制造通过。

| 直接依赖候选 | 关键声明与处理 | 官方版本记录 |
| --- | --- | --- |
| `storybook` **10.6.0** | 同组固定 10.6.0；Prettier、vite-plus、React types peer 为 optional，不因此安装第二构建器/格式工具 | [registry](https://registry.npmjs.org/storybook/10.6.0) |
| `@storybook/react-vite` **10.6.0** | React/DOM peer 含 `^19.0.0`；Vite 含 `^8.0.0`；storybook `^10.6.0`；可选 TS `>=4.9.x` | [registry](https://registry.npmjs.org/@storybook%2freact-vite/10.6.0) |
| `@storybook/addon-a11y` **10.6.0** | storybook `^10.6.0`；依赖 axe-core | [registry](https://registry.npmjs.org/@storybook%2faddon-a11y/10.6.0) |
| `@storybook/addon-vitest` **10.6.0** | storybook `^10.6.0`；vitest/runner/browser `^3.0.0 \|\| ^4.0.0`，browser-playwright `^4.0.0`；这些 Vitest peer 标为 optional，但选用本测试路径就必须满足 | [registry](https://registry.npmjs.org/@storybook%2faddon-vitest/10.6.0) |
| `@vitest/browser-playwright` **4.1.9** | vitest peer **精确 4.1.9**；playwright `*` 且不是 optional；内部 browser/mocker 同为 4.1.9 | [registry](https://registry.npmjs.org/@vitest%2fbrowser-playwright/4.1.9) |
| `playwright` **1.63.0** | Node `>=20`；playwright-core 精确 1.63.0；9.4 仅用 Chromium 组件运行时 | [registry](https://registry.npmjs.org/playwright/1.63.0) |
| `msw` **2.15.0** | Node `>=18`；可选 TS `>=4.8.x`；使用 v2 的 `http` / `HttpResponse`、`msw/browser` / `msw/node` | [registry](https://registry.npmjs.org/msw/2.15.0) |
| `msw-storybook-addon` **3.0.3** | MSW `>=2`；storybook `^9.0.0 \|\| ^10.0.0 \|\| ^11.0.0-0`；API 已改变，见下一节 | [registry](https://registry.npmjs.org/msw-storybook-addon/3.0.3) |
| `eslint` **9.39.5** | Node `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0`；本组保留 9.x | [registry](https://registry.npmjs.org/eslint/9.39.5) |
| `@eslint/js` **9.39.5** | 已单独核验此 patch 存在，engine 同上；配置直接 import 时列直接开发依赖 | [registry](https://registry.npmjs.org/@eslint%2fjs/9.39.5) |
| `typescript-eslint` **8.70.0** | ESLint `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`；TS `>=4.8.4 <6.1.0` | [registry](https://registry.npmjs.org/typescript-eslint/8.70.0) |
| `eslint-plugin-react-hooks` **7.1.1** | Node `>=18`；ESLint peer 包含 9；不需要启用 React Compiler 才能使用规则 | [registry](https://registry.npmjs.org/eslint-plugin-react-hooks/7.1.1) |
| `eslint-plugin-jsx-a11y` **6.10.2** | ESLint peer 到 `^9`，不含 10，因此此组合不选 ESLint 10 | [registry](https://registry.npmjs.org/eslint-plugin-jsx-a11y/6.10.2) |
| `globals` **17.12.0** | Node `>=18`，无 peer；分别提供 browser/node globals，不混到所有文件 | [registry](https://registry.npmjs.org/globals/17.12.0) |

已安装 Vitest 4.1.9 的 Vite peer 包含 8；Vite 8.0.16 需要 Node `^20.19.0 || >=22.12.0`。Storybook 10 官方要求有效 ESM 配置和 Node 20.19+ / 22.12+；本地 22.22.1 满足。根 `engines: >=20` 不能单独证明可运行，应在实施时与精确 CI/runtime 约束一起修正。[Vitest registry](https://registry.npmjs.org/vitest/4.1.9)、[Vite registry](https://registry.npmjs.org/vite/8.0.16)、[Storybook 10 迁移说明](https://storybook.js.org/docs/releases/migration-guide)

## 9.4 的独立组件测试路径

采用 `apps/mobile/.storybook/main.ts` / `preview.ts(x)` 和独立 `apps/mobile/vitest.storybook.config.ts`。Storybook config 为 ESM；保留 CSF3 的 `Meta` / `StoryObj`，类型从 `@storybook/react-vite` 导入。它是稳定、当前仍支持的格式；不为接入 addon 顺便采用 CSF Next 实验格式。[React Vite 配置](https://storybook.js.org/docs/get-started/frameworks/react-vite)

独立测试配置使用 `storybookTest`（`@storybook/addon-vitest/vitest-plugin`）、`playwright`（`@vitest/browser-playwright`），设 `browser.enabled: true`、headless 与单一 Chromium instance。新增明确的工作台测试脚本；原 `nomad-mobile test` 的 jsdom 和 Node 配置测试继续按原命令运行。共享必要 aliases/目标配置时避免无意继承 jsdom 的 environment/setupFiles。CI 在干净环境安装所锁 Playwright 对应 Chromium revision 并执行这个新入口；没有浏览器二进制时应失败，不能自动降回 jsdom。[Vitest addon 官方配置](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)

这是 9.4 AC5 所需的最小浏览器组件执行器。9.5 仍独立负责 Chromium/Firefox/WebKit 产品流程、截图差异/trace、基线审批和旧 Puppeteer 探针对应。仅安装 Playwright 或通过 Chromium 组件测试不关闭 UI-BROWSER-01，也不证明最低 Safari/iOS 或真机通过。

`play` 中使用 `storybook/test` 的 `expect` / `fn` 等与 context 的 `canvas` / `userEvent`，异步交互和断言应 await。焦点恢复、Tab/Shift+Tab、Escape、错误关联和文字状态必须有明确断言；Portal 内容按实际容器查询并纳入扫描，不能只扫背景 canvas。[interaction API](https://storybook.js.org/docs/writing-tests/interaction-testing)

全局 `parameters.a11y.test: 'error'` 使 CLI/CI 的违规真正失败；`todo` 只显示工作台提示，不可作为通过证据。错误关联/焦点/非颜色表达并非全部由 axe 自动覆盖，应通过交互断言或有操作步骤、预期和结果的人工检查补齐。VoiceOver/TalkBack、200% 真机字号和原生返回仍保持原责任。[a11y 测试行为](https://storybook.js.org/docs/writing-tests/accessibility-testing)

**已核验发布包的差异：** `@storybook/addon-vitest@10.6.0` 的 `dist/vitest-plugin/index.js` 表明自 10.3 起自动提供 preview annotations；检测到旧 `setProjectAnnotations` setup 会跳过自动提供。新配置不复制旧教程的重复调用；仅在确有自定义测试隔离逻辑时保留自有 setup file。此为读取发布 tarball 的静态证据，不是运行证明。[版本制品](https://registry.npmjs.org/@storybook/addon-vitest/-/addon-vitest-10.6.0.tgz)

## MSW 3 addon 接口、严格失败与产品隔离

本次同时读取了 `msw-storybook-addon@3.0.3` 的发布 README、exports 和 `build/csf3.d.mts`。CSF3 使用 `mswLoader` **从 `msw-storybook-addon/csf3` 导入并调用**；main 注册 addon，preview 使用 `loaders: [mswLoader(customSetup)]`。不要沿用 v2 的 `initialize` 或 root named `mswLoader`。官方 README 将 CSF3 loader 标 deprecated，但该版本类型明确仍支持 CSF3；将未来升级责任记录在 9.4，不把弃用误写为当前不可用。[官方 addon README](https://github.com/mswjs/msw-storybook-addon)、[固定 3.0.3 制品](https://registry.npmjs.org/msw-storybook-addon/-/msw-storybook-addon-3.0.3.tgz)

建议的项目约束：

- `customSetup` 创建 `setupWorker` 并 await `worker.start`，返回 worker。handler 用合成 DTO 并绑定当前生成 API 类型；成功、403、明确超时、partial、重连均有固定输入。静态演示也应显示真实组件，不另造一个只长得相似的演示组件。
- 浏览器和 Node 共享纯 handlers；Node 使用 `setupServer` 的单独测试生命周期。Vitest Browser Mode 内是 `setupWorker`；Vitest 自带 worker 不能当作业务 handler 实例直接复用。每例重置 handlers、timer、fixture store、失败账本；卸载终止连接，避免迟到请求污染下一例。[Browser Mode 指引](https://mswjs.io/docs/recipes/vitest-browser-mode/)、[Node listen](https://mswjs.io/docs/api/setup-server/listen/)
- worker 生成到 **`.storybook/public/mockServiceWorker.js`** 等专用目录，仅通过工作台 staticDirs / 组件测试 publicDir 提供；产品 `apps/mobile/public`、main.tsx、HostBootstrap 和真实 native transport 不导入/注册 MSW。工作台使用与产品不同 origin/port；真实浏览器验收使用新 context。不要通过注销所有 worker 或清空用户 IDB 解决隔离。
- MSW 默认会放行并警告未处理请求，addon 默认还忽略常见静态/internal 请求。自定义 `onUnhandledRequest`：只允许**同一受控工作台 origin、GET/HEAD、显式列明的 Vite/Storybook 静态路径**；其他请求先记入场景失败账本再执行 error 策略。禁用宽泛 hostname/扩展名匹配、全 `/api` passthrough、全局 `bypass`。worker URL/scope 必须覆盖工作台页面，等待 ready 后才 render。[worker start 与未处理策略](https://mswjs.io/docs/api/setup-worker/start/)
- **MSW error 造成请求失败不等于测试一定失败。** 业务组件可能 catch 后显示错误，故每例收尾还必须断言未声明请求账本为空；故意发一个被业务 catch 的未声明请求仍应让测试命令非零退出。只记录方法和安全规范路径，不存请求 body/token/原始私人输入。该账本是本项目为 AC2 设计的额外保证，尚未实施。
- CI 应检查产品 Web dist、双端同步资源和入口依赖：没有工作台入口、worker 文件、MSW 注册、fixture 身份或真实秘密。开发依赖分类和 tree-shaking 推断均不能代替产物检查。工作台不默认公开发布；明确关闭非必要外发/工具遥测并以实际网络清单验证。

## 类型 lint 与可证明的负例

采用根 `eslint.config.mjs`，避免为执行配置再引入 TS loader。JS 配置使用 `@eslint/js`；TS 源与配置使用 `typescript-eslint` 类型规则和合适的 TSConfig/projectService。当前 mobile tsconfig 不包含 `.storybook`、新独立 config 和独立测试支持目录，因此必须明确这些文件的类型归属，不能靠 `allowDefaultProject` 的全目录通配绕过。browser/node globals 按文件用途分别设置。[typed linting](https://typescript-eslint.io/getting-started/typed-linting/)

最小实际规则包括 `no-floating-promises`、`no-misused-promises`、选定的 unsafe 类型规则、Hooks `rules-of-hooks` / `exhaustive-deps` 和 JSX a11y。Hooks 7 的推荐组还含 compiler 诊断；实施前看清实际展开规则，不为清它们顺手改写 auth/journal/cursor。新代码按选定规则阻止回归，旧问题逐文件/规则记录原因、责任 Story、退出条件并冻结。[React Hooks 官方规则](https://react.dev/reference/eslint-plugin-react-hooks)

**字段负例不能只依赖推荐 preset。** 在已核验 `eslint-plugin-jsx-a11y@6.10.2` 中，`control-has-associated-label` 在 recommended 和 strict 均默认关闭；`label-has-associated-control` 检查已存在的 label 与关联，不能据此推断裸 input 一定失败。需要显式选择 control-label 规则/组件映射，避免照抄官方示例中的 `ignoreElements: ['input', 'textarea', ...]` 漏掉目标字段；再用实际缺少可访问名称的字段负例证明失败。静态 AST 无法证明任意动态 label/ID 关系，组件运行时 axe/交互检查应补上。[control label 规则](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/v6.10.2/docs/rules/control-has-associated-label.md)、[label/control 规则](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/v6.10.2/docs/rules/label-has-associated-control.md)

实施验收至少保留三组独立负例：未处理 Promise、条件分支 Hook、无可访问名称字段。分别验证规则 ID、文件和非零退出；修正后再通过。负例应临时置入与真实源文件相同的 lint 范围/TSProgram，不能因文件被忽略或仅 parse error 而错误宣称规则有效。不要用格式化、重复 tsc、`|| true` 或整目录 disable 代替该证据。

历史问题的冻结记录应识别具体诊断/源码位置与责任，新增问题不能拿删去另一条旧问题抵销；范围外的新建或迁移文件必须进入覆盖。9.4 创建共享层的覆盖规则，9.3/原业务 Story 的新文件自动适用；不提前搬迁全站业务。

## 实施门槛与目前结论

**没有发现阻止准备 9.4 的版本声明或真实账号资源硬阻断。** 所需工具均有相容声明；账户、正式协议、Mac、签名、真机不应成为这个纯合成工作台的前置条件。当前用户仅授权准备，后续实施仍按当前执行边界处理。

以下事项必须在实施中实际完成，本报告没有宣称完成：

1. 审阅精确安装方案和 lockfile，验证无 peer 强制绕过，检查 resolved engines、安装脚本和当时安全公告/审计结果；依赖有 SRI 不等于没有漏洞。本次没有跑安装后的依赖审计。
2. 固定 CI Node patch、Playwright/Chromium revision 和缓存键，在无真实 secrets 的干净安装后证明 dev/static build/独立组件测试都能运行。
3. 把真实 lint、负例证明和工作台 interaction/a11y 接入实际 CI，保留原单元、Node、PG、Puppeteer 与 handoff 检查，不以新工具存在抵销旧证据。
4. 未声明请求负例、MSW 生命周期/跨场景隔离和 Web/Capacitor 产品产物隔离实际通过。
5. 代表性已有 HomeSheet/字段覆盖当前 AC1 的适用状态和 AC5 的行为反例；`200%`、长中文、reduced-motion、身份未确认等需对应场景及检查。不能等 9.3/9.5 才给出第一个可运行结果。

兼容性研究、mock 和本地构建均不改变 APP-HOST-01、真实 PG/供应商、3.1 暂停或历史 done；五张新增 UI Story 继续各自承担其合同。
