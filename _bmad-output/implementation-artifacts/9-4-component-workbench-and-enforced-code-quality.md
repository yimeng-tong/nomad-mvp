---
project: nomad-mvp
story_id: '9.4'
story_key: 9-4-component-workbench-and-enforced-code-quality
source_story_id: '9.4'
source_contract_sha256: a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: complete
preparation_authorization: _bmad-output/implementation-artifacts/story-9-4-preparation-decisions-2026-09-25.md
implementation_started: true
execution_dispatch_authorized: true
execution_stop_boundary: null
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-9-4-workbench-quality
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- CODE-QUALITY-01
- UI-WORKBENCH-01
delivery_requirements:
- FR52
- NFR3
- NFR7
- NFR8
- NFR25
source_obligations:
- ui-quality-tooling
dependencies: []
validated: '2026-09-25'
preparation_validation: _bmad-output/implementation-artifacts/9-4-component-workbench-and-enforced-code-quality-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/story-9-4-tooling-research-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-4-repository-context-2026-09-25.md
independent_reviews:
- _bmad-output/implementation-artifacts/research/story-9-4-contract-review-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-4-plan-review-2026-09-25.md
execution_authorization: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
execution_plan: _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md
---

# Story 9.4: 用可运行状态工作台与真实检查维护组件

Status: in-progress

> 2026-09-25用户已明确恢复开发并安排本Story先行；六组源GWT和工程条件保持，3.1自身暂停及真实资源门槛不变。本Story仍ready-for-dev，实际开发进展由接手任务记录。

## Story

As a 维护 Nomad 界面的开发者和审阅者,
I want 独立查看现有组件状态并让代码错误在CI中失败,
So that 我无需真实账号或外部请求就能审阅改动并及时发现回归.

**Requirements:**FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR4、AR12、AR15、AR17–AR20、AR26；UX-DR3、UX-DR33、UX-DR37。

**范围：**现有HomeSheet/字段至少形成一个可运行样例；Storybook React/Vite、MSW、a11y、真实lint是本工具切片。无须等9.3，后者负责为新增组件补例。

## Acceptance Criteria

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

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

## Tasks / Subtasks

- [ ] T0 固定实施基线、覆盖与工具组合（AC1/4/6；CODE-QUALITY-01、ui-quality-tooling）
  - [ ] 从当前工作树保留受影响文件/锁文件摘要、Node/pnpm版本和已有测试入口；不得用旧HEAD覆盖大量未提交实现。实施前再读CURRENT/Sprint，核实实际开发窗口。
  - [ ] 采用下述精确候选，核验resolved engines/peer、安装脚本和当时安全审计；不使用force、浮动latest或允许所有install scripts。React/Vite/Vitest/Capacitor基线保持。
  - [ ] 固定首轮lint cohort、逐文件执行清单和历史诊断基线；无已运行lint就没有已核验债务清单。现有相关组件/配置、所有新工具代码和后续共享UI自动覆盖。

- [ ] T1 交付独立且可启动的组件工作台（AC1/4；UI-WORKBENCH-01）
  - [ ] 在apps/mobile新增ESM Storybook main/preview、独立workbench tsconfig和vitest.storybook.config.ts；保留默认mobile jsdom、setupTests和Node native-config测试。
  - [ ] 直接导入现有HomeSheet和LoginScreen真实字段，通过仅工作台wrapper/既有依赖注入构建场景；不复制同外观的假组件，不等待9.3/AppSheet，不引入Tailwind/新主题。
  - [ ] 导入现有styles.css及适用app-host样式；正常、空、长中文、200%字号、loading、disabled/原因、error、reconnect、partial、reduced-motion、身份未确认场景有名称、预期和检查方法。场景不适用要写具体理由。
  - [ ] 开发启动与静态构建在无真实业务账号/秘密的受控环境中实际可用；关闭工具遥测和非必要远程字体/资源，工作台不默认公开发布。

- [ ] T2 共享MSW场景与严格网络失败（AC2/6；UI-WORKBENCH-01、ui-quality-tooling）
  - [ ] fixtures使用当前nomad-types生成DTO和既有错误envelope；按真实Web客户端的路径/方法/状态构造成功、403、超时、partial与重连，不新增业务schema或伪造不支持的partial字段。
  - [ ] LoginScreen演示的MSW /auth/config固定captcha.provider=fixture，并注入合成getCaptchaToken；aliyun-pnvs分支会直接调用requestPnvsCaptcha，不能假定token注入会替换它。场景构造/启动校验应在交互前拒绝非fixture provider；误配真实provider、worker未就绪或失效时不得加载真实SDK/外发，保留对应反例；产品与后端guard不变。
  - [ ] 使用MSW2的http/HttpResponse和浏览器setupWorker、Node setupServer；按所锁addon3的CSF3接口接线并等待worker ready后渲染。worker404/启动失败应阻止用例，不回退真实API。
  - [ ] worker仅位于.storybook/public，明确工作台origin、staticDirs/publicDir和scope；不放产品public、不导入main/HostBootstrap、不替换真实native bridge。
  - [ ] 仅允许同工作台origin、GET/HEAD、明确工具静态路径；未声明API/外部请求进入按场景隔离的失败账本并通过固定脱敏错误使请求失败。MSW内置print.error/warn会输出完整URL/query/body，不作为项目失败出口；关闭handled请求的非必要日志。用例收尾断言账本为空，业务catch不能使违规请求变绿；Node测试同样失败关闭。
  - [ ] 以合成query/body哨兵核对项目捕获的stdout/stderr、浏览器日志与证据没有原文；仅保存方法、规范路由/安全错误码，不能用默认MSW打印后再宣称脱敏。
  - [ ] 每例清理handlers、请求/流、timer、订阅、合成auth scope/dataset和失败账本；如确需IDB使用专属工作台库，不清除产品库/用户worker。保存跨场景迟到请求和重放负例。

- [ ] T3 将占位lint换为真实类型/React/a11y检查（AC3/4；CODE-QUALITY-01）
  - [ ] 根eslint.config.mjs成为唯一执行配置，退役无实际类型规则的.eslintrc.json；typed项目覆盖真实TS/TSX和工作台配置，Node/browser globals按用途分开，工具MJS也执行适用规则。
  - [ ] 启用no-floating-promises、no-misused-promises、经确认的unsafe规则、rules-of-hooks/exhaustive-deps和字段/控件a11y规则；control-has-associated-label等需显式配置并核验，不能只安装preset。
  - [ ] 根ci:lint真实执行同一gate；输出受管文件、规则/诊断、基线匹配和退出状态。零文件、遗漏/被ignore文件、parser/config错误、基准不可得均失败。
  - [ ] 用与ci:lint相同配置及TSProgram的临时副本证明：未处理Promise、条件Hook、无可访问名称字段分别命中预期ruleId并非零退出，修正后通过。不得仅靠parse error或单独RuleTester宣称CI有效。
  - [ ] 历史例外按路径/ruleId/诊断与节点源码摘要/数量/原因/责任/退出条件冻结；只能消减。新增同数量问题、移动/复制例外节点、扩张忽略或自动重建baseline不得绕过；不全库格式化或机械补void吞异常。

- [ ] T4 组件interaction与a11y能发现缺陷（AC1/5；UI-WORKBENCH-01）
  - [ ] 独立Vitest browser配置使用Storybook addon和锁定的单Chromium provider；浏览器缺失时明确失败，不降成jsdom。组件play中的异步操作与断言await。
  - [ ] 验证HomeSheet打开/Tab/Shift+Tab/Escape/卸载后的焦点返回，以及真实字段的label/error关联、文字状态与禁用原因；破坏行为的反例使相应测试失败。
  - [ ] a11y.test设error，扫描实际组件容器；对axe不能证明的200%实际字号、非颜色表达等保留明确操作/预期/结果。不能将todo、跳过或“需人工”计为通过。
  - [ ] 明确HomeSheet当前没有Portal、inert/滚动锁、宿主返回和身份感知焦点恢复；这些仍归9.3。合成身份场景只证明工作台呈现，不能替代App的真实鉴权遮蔽。

- [ ] T5 证实产品入口、资源和网络隔离（AC6；NFR3/7/25、ui-quality-tooling）
  - [ ] 产品Web构建成功；核对入口与打包模块来源、输出文件清单，拒绝工作台入口、mock worker/注册、fixture身份通道、工具遥测和秘密。不能仅凭devDependency分类或几个字符串断言。
  - [ ] 在独立干净origin/profile运行产品公开/配置不可用路径，核对请求及ServiceWorker注册仍来自既有生产入口；工作台和产品端口/存储隔离。不得为了验证登录调用真实SMS或供应商。
  - [ ] 通过既有native:sync与native:verify检查Android/iOS复制资源、插件配置和16.4/128目标；使用受控公开开发配置，检查候选中没有工具资源。缺生产资源时不猜正式ID/域名或读取服务端秘密。
  - [ ] 隔离checker独立遍历dist及两端复制目录的完整文件清单并比较，拒绝只残留在native目录的额外worker/mock资源；现有native:verify核对预期资源一致性，不能单独证明额外文件不存在。
  - [ ] 保存人为污染产品public/入口/native目标目录或worker路径错误的负例，证明隔离检查能失败。产品Web资源/生成工程验证与APK/iPhone/TestFlight实证分别报告。

- [ ] T6 接入实际CI并保留原验证责任（AC3–6；CODE-QUALITY-01、UI-WORKBENCH-01）
  - [ ] CI显式取得比较基准：PR使用event base SHA与实际checkout提交，push使用有效before SHA；核验commit可解析并通过受控fetch补足历史（可用fetch-depth0）。缺少预期非零基准应失败，首次push/全零before用已记录的全cohort策略，不绿色空跑；补浅克隆/丢失基准反例。
  - [ ] CI固定兼容Node patch/包版本/Chromium revision；干净frozen-lockfile安装后实际运行lint与其负例、工作台typecheck/build、interaction/a11y、MSW和产品隔离检查；失败传播且保留可审阅产物。
  - [ ] 保留现有types、handoff/回归、workspace build、auth/ingest/PG、mobile/Node、旧合同、synthetic/SSE及备份helper检查，不升级数据库或将PG证明替换为MSW。
  - [ ] 更新CI/独立探针对照：列出调用命令与范围、未接入项和所属Story。9.4仅交付工作台相关检查；9.5仍负责跨引擎产品流程/截图及等价覆盖后的旧浏览器脚本整合。
  - [ ] 工作台输出/cache/report进入.gitignore，保留版本化场景/基线/证据摘要；不加入公开托管或付费截图服务。

- [ ] T7 关闭记录、限定审阅与交接（AC1–6；两项工程条件）
  - [ ] 对应每组AC保留实际命令/退出码、工具/环境、源码/lock/config摘要及正反例；标清mock与未运行范围。修补已确认问题，限定CR后复核。
  - [ ] ui_delivery_evidence满足当前checker格式，CODE-QUALITY-01与UI-WORKBENCH-01均由本Story实际verified，不能以not-applicable关闭自身首交付；其他Story条件不变。
  - [ ] 更新File List、开发进度、实际CI证据和CURRENT/Sprint的获准窗口内状态，运行pnpm run ci:handoff；如改守卫再跑对应回归。准备完成不计作工具实现或Story done。

## Dev Notes

### 开始前应知道的事实与范围

- 当前只有准备授权。Status ready-for-dev表示合同可消费；既有stop_after_story1.7仍有效，开始实现须先核对后来用户明确方向及相应执行记录。本Story没有完整1.0/1.7/9.1完成或9.3/9.5的前置依赖。
- 9.4交付开发者可用的工作台和检查，9.5交付产品关键流程/多引擎截图，9.3交付共享UI迁移。Playwright在本Story仅作为Storybook的单Chromium组件运行时，不把9.5标完成，不关闭UI-BROWSER-01。
- 首批直接消费HomeSheet与LoginScreen现有字段/依赖注入。工作台不挂载生产main.tsx→HostBootstrap→App，避免启动真实host/inbox、默认auth请求或产品持久化。
- Host/App/private portal、operation journal、durable ACK、真实PG/SIGKILL与原生桥保持各自权威。这里的mock、a11y与Chromium通过不证明真实身份、最低Safari/iOS、TalkBack/VoiceOver或TestFlight。

### 精确候选与已核验API

2026-09-25只读核验的基线：WSL Node22.22.1、pnpm11.7.0、React/DOM19.2.7、Vite8.0.16、Vitest4.1.9、TypeScript5.9.3。候选声明相容不等于已经安装或审计通过；实施T0再核对解析结果并精确锁定。优先手工接入已有workspace，不运行浮动或无人值守init覆盖现有Vite/测试配置。

| 用途 | 精确候选 |
| --- | --- |
| 工作台 | storybook、@storybook/react-vite、@storybook/addon-a11y、@storybook/addon-vitest：10.6.0同组 |
| 单Chromium组件执行 | @vitest/browser-playwright4.1.9＋playwright1.63.0；现有Vitest4.1.9保留 |
| 网络场景 | msw2.15.0＋msw-storybook-addon3.0.3 |
| typed lint | eslint9.39.5、@eslint/js9.39.5、typescript-eslint8.70.0 |
| React/a11y/globals | eslint-plugin-react-hooks7.1.1、eslint-plugin-jsx-a11y6.10.2、globals17.12.0 |

ESLint10不在jsx-a11y6.10.2 peer范围内；不要force。Storybook/Vite要求的Node20/22最低patch高于根engines当前笼统的>=20，应在本次工具接线中明确可用范围及CI精确patch。optional peer不代表要安装全部可选工具；不安装vite-plus、额外格式器或本期9.3/9.6/9.7才消费的库。

- CSF3仍受支持，使用Meta/StoryObj；MSW addon3从msw-storybook-addon/csf3导入并调用mswLoader(customSetup)，不要照搬旧initialize/root loader。customSetup负责setupWorker并await start后返回worker。
- Storybook10.6的addon-vitest自动注入preview annotations，不复制旧setProjectAnnotations初始化。独立配置使用storybookTest与@vitest/browser-playwright；play使用storybook/test和当前canvas/userEvent API。
- addon默认静态请求忽略与MSW默认warn都不足以证明AC2。项目必须明确allowlist、失败账本、收尾断言和业务catch仍失败的负例。MSW的print.error/warn带原始请求细节，采用项目自有的脱敏记录和固定错误抛出，quiet处理正常mock日志，并用query/body哨兵检查所有项目捕获输出。
- jsx-a11y推荐/strict preset默认没有启用control-has-associated-label；显式配置目标字段规则/选项/组件映射并用裸输入负例验证。动态ID/label关系仍需runtime检查。
- 详情与官方链接：research/story-9-4-tooling-research-2026-09-25.md。安装脚本、安全公告/审计、实际构建和浏览器兼容仍是实施工作，不把研究表作为执行证据。

### 工作台组织与产品隔离

建议工作台场景/fixtures放在apps/mobile/workbench/，而非生产src目录，避免当前产品tsconfig的src全量include吞入开发场景。独立tsconfig.workbench.json覆盖workbench、.storybook与vitest.storybook.config.ts；未来9.3为新组件在此增例。受控来源保持工作台→实际组件的单向import，产品入口不得反向引用工作台。

MSW worker生成在apps/mobile/.storybook/public，仅由工作台staticDirs和组件测试publicDir提供；两者需要实测能找到worker。工作台使用独立端口/origin；产品apps/mobile/public是Vite直接复制资源，不能放worker。产品侧不要新增根据env切换fixture的注册分支。

LoginScreen在dev默认base指向localhost:3000；场景必须注入指向工作台origin的明确Web API client，并显式替换captcha、analytics、platform/外链等可能产生真实副作用的依赖。特别地，getCaptchaToken只替代非aliyun-pnvs分支；MSW配置必须明确captcha.provider=fixture，不能只注入token却让组件直接加载requestPnvsCaptcha。OpenAPI当前允许该fixture枚举，但只能留在工作台替身，不能写入产品配置。保持既有auth client/transport，不重写安全请求行为。handlers沿实际/auth、/library等路径及生成DTO，基准前缀明确；超时和重连由有限的模拟响应/连接描述，不复制durable服务实现。日志只记录安全方法/规范路由，不保留请求body、token或私人输入。

独立browser配置复用必要alias和产品目标，但不误继承jsdom的environment/setupFiles或重复React插件。Storybook只需要明确的场景globs，不将全部App/业务测试扫描成展示用例。

### Lint覆盖与历史债务

首轮cohort必须写成可机器核对的清单：全部新workbench/.storybook/工具配置/检测脚本；实际展示的HomeSheet.tsx与LoginScreen.tsx及其相关改动；本Story修改的所有TS/TSX/JS/MJS；未来src/ui新文件与实际页面迁移文件自动纳入。其余未改auth/journal/服务端不宣称已完成全量typed lint，原typecheck/测试继续保留。

本工作树HEAD早于大量现有实现，不能只用git diff HEAD界定9.4新增问题。T0记录当前文件摘要与规则配置作为初始baseline；CI按明确base加上新增/重命名文件补充覆盖，并在checkout阶段获取真实比较commit；当前workflow默认浅克隆不能直接满足该前提。对于这个尚未提交的大工作树，初始清单需覆盖既有代码路径和内容指纹：仅未变且明确不在首轮cohort的旧文件可报告为未覆盖；首轮cohort始终执行。旧文件内容变化/新增/重命名必须进入gate，不能因其早已出现在bootstrap清单而永久豁免。ESLint ignore、路径漏匹配、空cohort或类型项目未命中都必须失败。退役旧.eslintrc.json，只保留一个真实flat-config入口。

可采用显式parserOptions.project与tsconfigRootDir覆盖mobile和专用workbench tsconfig；若采用projectService，必须证明这些非默认include文件真正命中项目，禁止用宽泛allowDefaultProject或关typed规则消除错误。

每条历史豁免至少包含路径、ruleId、message/AST节点片段摘要、原文件摘要/出现次数、原因、责任及退出条件。只允许匹配未变化的旧诊断；删除A后新增B、移动/复制被豁免节点不能靠总数相同通过，CI不自动重建放宽基线。配置/parse失败与真实新增诊断分开报错，异常退出不能当普通lint债务。新增代码不得靠机械void或空catch规避Promise检查。

### 场景与证据矩阵

| 场景族 | 最低检查 | 证据限制 |
| --- | --- | --- |
| HomeSheet现有行为 | 实际组件打开、Tab/Shift+Tab、Escape、关闭/卸载、同一有效触发器焦点恢复 | 不证明未来AppSheet/inert/scroll-lock/native back |
| 真实字段 | label/error关联、loading、disabled/原因、错误/重试、长中文 | 验证合成API/注入依赖，不能发送真实短信或取得真实身份 |
| 网络状态 | success/empty/403/timeout/partial/reconnect，未声明请求及worker失败 | 类型和状态取既有DTO；业务catch后违规仍使测试失败 |
| 体验设置 | reduced-motion、键盘、200%实际文字、非颜色表达、身份未确认 | 固定px样式不能只靠wrapper font-size冒充200%；记录实际缩放/字号方法 |
| 生命周期隔离 | 重置handlers/timers/auth dataset，迟到结果、场景往返 | 只用独立合成scope，不清产品IDB或所有ServiceWorker |
| 产品产物 | 入口/模块图、文件清单、运行网络/worker和双端复制资源 | 配置/资源检查不等于APK构建、Mac/iPhone或TestFlight |

### 文件计划：现状、修改与保留

这些是开发计划，不是本轮已创建的代码；同一行逗号分隔的文件继承该行明确目录。完整带行号读取记录见repository-context研究。

| 类型/文件 | 本次开发意图与必须保留的内容 |
| --- | --- |
| UPDATE package.json | 替换ci:lint占位并增加工具CI入口；保留types/build/mobile/handoff/领域探针 |
| UPDATE apps/mobile/package.json | 精确开发依赖、工作台启动/build/typecheck/test命令；保留jsdom＋Node test及native脚本 |
| UPDATE pnpm-lock.yaml | 只通过WSL pnpm产生精确解析；不改变现有产品框架/Capacitor或强制peer |
| UPDATE .github/workflows/ci.yml | 固定Node patch，加真实lint/负例/工作台检查；保留现有PG/Redis与原步骤 |
| UPDATE .gitignore | 排除storybook-static、工具cache/report运行物，保留可审阅源码/基线/证据摘要 |
| RETIRE .eslintrc.json；NEW eslint.config.mjs | 老配置无typed执行，flat config成为唯一有效入口 |
| NEW apps/mobile/.storybook/main.ts、preview.tsx、public/mockServiceWorker.js | ESM开发工作台、现有CSS、addon/MSW/a11y、专用worker |
| NEW apps/mobile/vitest.storybook.config.ts、apps/mobile/tsconfig.workbench.json | 独立Chromium测试/类型项目；不替换产品vite/jsdom语义 |
| NEW apps/mobile/workbench/*stories.tsx、mocks、scenario-support | 实际HomeSheet/LoginScreen场景、共享纯handlers/fixtures、隔离与失败账本 |
| NEW scripts/check-code-quality.mjs及测试/基线清单 | 真实lint调用、覆盖核对、诊断级冻结、规则/绕过负例 |
| NEW apps/mobile/scripts/check-workbench-isolation.mjs及测试 | 当前产品入口/产物/网络/worker隔离，按scope留证 |
| UPDATE docs/ops/ui-validation.md | 写实际命令/范围/CI证据；更新对应architecture packet与当前来源责任，旧批准快照不改 |
| REUSE HomeSheet/LoginScreen/styles.css/app-host.css | 已有受控组件/注入点/视觉；不先重构成新共享UI，不接Tailwind Preflight |
| CONDITIONAL vite.config.ts、tsconfig.json、setupTests.ts、pnpm-workspace.yaml | 优先保持不动；只有实测必要才最小改动，保留targets、原测试及严格build脚本allowlist |

如果确需修复被样例发现的窄缺陷，先界定实际文件/行为并补回归；不利用lint顺手改auth/controller/journal/cursor。工作台目录命名相较研究建议的src/workbench已明确选为独立workbench，职责一致且减少产品类型/资源混入。

### 计划验证入口与完成证据

实施时创建并实际接线：root ci:lint；mobile storybook/build:storybook/typecheck:workbench/test:workbench；root ci:workbench及有界lint/MSW/产物隔离负例入口。命名可以统一为仓库惯例，但交付文档必须写真实命令和退出码。浏览器二进制随锁版本受控安装；不要把静态构建、配置或截图单独作为interaction/a11y运行证明。

必须保留并运行本Story受影响的既有mobile单元/Node native配置检查、workspace build与handoff。9.4新增的CI步骤应真实执行且失败可见；本地执行证据与远端CI执行分开，未运行远端job不写已通过。旧PG、IDB、SIGKILL、SSE和Puppeteer探针有清单后继续保留，9.5才决定等价替代。

当前工程条件只有CODE-QUALITY-01和UI-WORKBENCH-01；两者均是9.4首交付责任，不能not-applicable。Review/done前生成ui_delivery_evidence（YAML）：kind为ui-verification，story_id为字符串9.4，source_contract_sha256等于当前catalog，含source_revision/recorded_at及checks。每个条件记录result=passed、environment、summary和存在的evidence路径；补source/lock/config摘要和逐AC的正反例结果。预计证据路径在实施时生成，准备时不造占位通过文件。

不会因此关闭APP-HOST-01、UI-COMPONENT-01或UI-BROWSER-01；本Story不要求取得Mac/签名/正式账号作为工具开发前置。已有真实资源缺项仍由1.0/1.6/1.7/9.1等处理。

### 先前工作与Git约束

已有9.1宿主/API/同步校验可以复用；它仍in-progress。9.3尚未准备，数字前一项不能当先决条件。1.6/1.7已建立controller/journal/durable ACK与独立浏览器/PG证据，不能被MSW或组件样例取代。

最近5个提交从7250a8a的旧2.2 CI记录到Story2.0/2.1基线，无法代表当前大量未提交认证/宿主/恢复实现；沿用当前工作树与既有分支，不reset/clean/复制迁移镜像。本轮准备修改Story与跟踪文档，并修正一处交接回归fixture的固定基线；执行检查器与业务源码保持不变。已有pnpm store为/tmp/nomad-sp-pnpm-store/v11；安装时复核.modules.yaml并保持同一store根，禁止Windows-native Node/pnpm。

### 来源与原型

- 正式源：../planning-artifacts/epics.md，Story9.4六组GWT及Code quality补充；其SHA见frontmatter。
- 当前catalog、delivery和来源义务：frontmatter指向的ui-foundation-2026-09-20版本；ui-quality-tooling在T0/T2/T5/T6中实际承接。
- 批准与就绪：../planning-artifacts/ui-foundation-scope-decision-2026-09-20.md；../planning-artifacts/implementation-readiness-ui-foundation-2026-09-20.md。
- 架构：../../docs/architecture/ui-foundation.md、frontend-architecture.md、testing-strategy.md、coding-standards.md；../../docs/ops/ui-validation.md。
- UX/原型：../../docs/front-end-spec.md（Visual System、UX-DR37、States、Accessibility）、../../docs/ux/mobile-ia.md、../../docs/ux/prototype-coverage.md。复用既有登录/Home参考，不重画产品布局；新增的是开发组件场景和实施截图证据。
- 研究：research/story-9-4-tooling-research-2026-09-25.md、research/story-9-4-repository-context-2026-09-25.md。
- 先前限定修补：ui-foundation-scoped-code-review-2026-09-20.md；平台sync/minor target及源码/历史证据边界保持。
- 准备授权与决定：story-9-4-preparation-decisions-2026-09-25.md；项目规则见../project-context.md和../../AGENTS.md。

## Dev Agent Record

### Agent Model Used

Codex（当前会话）；准备包含独立工具研究、仓库上下文分析与fresh-context合同验证。

### Debug Log References

研究与准备验证记录是上下文/合同证据；本轮没有安装新依赖、执行Storybook/ESLint或构建产品，不提供虚假的实现日志。

### Completion Notes List

- 准备与两份独立验证已完成；源叙事、Requirements、六组GWT和Code quality补充完整保留。
- CODE-QUALITY-01、UI-WORKBENCH-01与ui-quality-tooling均有Tasks和关闭证据责任；实现任务均未勾选。
- 准备不解除当前执行停止边界、不恢复3.1、不改历史done；本合同已转ready-for-dev，尚未执行开发任务。

### File List

- 本Story实际合同及同名validation报告。
- 两份9.4研究记录、preparation-decisions与preparation-checks。
- CURRENT.md、project-context.md、sprint-status.yaml的准备状态与队列指针。
- scripts/check-handoff.test.mjs：仅将UI回归fixture固定到准备前快照；执行检查器未改。实现源码/依赖/CI仍为上文后续计划。


### 2026-09-25 开发授权增量

用户已解除原1.7完成后停止边界，依据sprint-execution-resume-2026-09-25.md允许本Story进入DS/CR。仅变更执行上下文，不改变六组源GWT、T0–T6或工程条件。当前源码/工具链复验见research/story-9-4-execution-readiness-review-2026-09-25.md；较早准备验证中“尚未授权开发/停止边界保持”仅描述当时事实。

### 2026-09-25 正式开发接手

已消费协调任务正式开始指令，当前唯一写入者01a0d78a-3692-78b1-aee5-76268a743925。开发分支codex/story-9-4-workbench-quality，实际开发基线abac3dfafc3e844ea62c5a73914fa65af0672a43；frontmatter.baseline_commit保留准备时历史值。T0基线见evidence/story-9-4-workbench-2026-09-25/development-baseline.json；当前任务未完成，UI条件只标in-progress。普通工具接线/窄缺陷修补已有授权，旧heartbeat保持PAUSED。

### 9.4当前实现文件清单（独立CR前）

- `.eslintrc.json`
- `.github/workflows/ci.yml`
- `.gitignore`
- `CURRENT.md`
- `_bmad-output/implementation-artifacts/9-4-component-workbench-and-enforced-code-quality.md`
- `_bmad-output/implementation-artifacts/capacitor-task-monitor-state.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/counterexamples.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/dependency-audit.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/dev-server.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/development-baseline.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/initial-lint-diagnostics.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/lint-result.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/local-validation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/login-large-text.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/product-isolation.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/product-unavailable.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/resolved-toolchain.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/runtime.json`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/sheet-partial.png`
- `_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/toolchain-registry.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/story-9-4-dev-progress-2026-09-25.md`
- `_bmad-output/implementation-artifacts/story-9-4-execution-decisions-2026-09-25.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `apps/mobile/.storybook/main.ts`
- `apps/mobile/.storybook/preview.tsx`
- `apps/mobile/.storybook/public/mockServiceWorker.js`
- `apps/mobile/.storybook/vite.config.ts`
- `apps/mobile/.storybook/vitest.setup.ts`
- `apps/mobile/package.json`
- `apps/mobile/scripts/check-workbench-counterexamples.mjs`
- `apps/mobile/scripts/check-workbench-isolation.mjs`
- `apps/mobile/scripts/check-workbench-isolation.test.mjs`
- `apps/mobile/scripts/probe-workbench-runtime.mjs`
- `apps/mobile/scripts/product-build-proof.ts`
- `apps/mobile/scripts/workbench-mutations.ts`
- `apps/mobile/src/auth/LoginScreen.tsx`
- `apps/mobile/tsconfig.workbench.json`
- `apps/mobile/vite.config.ts`
- `apps/mobile/vitest.storybook.config.ts`
- `apps/mobile/vitest.workbench-node.config.ts`
- `apps/mobile/workbench/HomeSheet.stories.tsx`
- `apps/mobile/workbench/LoginScreen.stories.tsx`
- `apps/mobile/workbench/TextScale.tsx`
- `apps/mobile/workbench/fixtures.ts`
- `apps/mobile/workbench/handlers.test.ts`
- `apps/mobile/workbench/handlers.ts`
- `apps/mobile/workbench/network-policy.test.ts`
- `apps/mobile/workbench/network-policy.ts`
- `apps/mobile/workbench/scenario.ts`
- `apps/mobile/workbench/workbench.css`
- `docs/architecture/coding-standards.md`
- `docs/architecture/testing-strategy.md`
- `docs/ops/ui-validation.md`
- `eslint.config.mjs`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `scripts/check-code-quality.mjs`
- `scripts/check-code-quality.test.mjs`
- `scripts/code-quality-exceptions.json`
- `tsconfig.lint.json`

本地实际结果见evidence/story-9-4-workbench-2026-09-25/local-validation.json。10个旧lint诊断均以窄改修复，未保留例外；类型规则、组件故障、网络失效与资源污染反例已运行。任务复选框在干净安装、CI与CR最终复核后逐项收口，当前不预标done。
