---
project: nomad-mvp
story_id: '9.4'
date: '2026-09-25'
kind: independent-preparation-plan-review
status: passed-targeted-recheck
implementation_performed: false
initial_reviewed_story_sha256: b9ef0bf667fc314b9c0024e094a834b62b366ebcc12180da48e1a0c91c0b500e
reviewed_story_sha256: 6320593e4ce0a093371ca7e6f0b15cd3fb537f60a81723dd00bd0d2b4a052a1c
source_contract_sha256: a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27
recheck_scope: pv-01-pv-02-pv-03-native-extra-file-only
outstanding_findings: 0
---

# Story 9.4 实施指导独立复核

按 `.agents/skills/bmad-create-story/checklist.md` 的 fresh-context 方法复核 Story、两份9月25日研究、当前源9.4及相邻9.3/9.5范围、交付条件、实际组件/配置/CI。没有安装依赖、运行新工具或修改Story/业务源码/状态；本报告是本复核唯一写入文件。草稿状态和未来运行结果未知是正常准备状态，不作为问题。

结论：限定复核通过。下列3项P2以及native额外资源检查提示均已写入当前Story的实际Tasks和必要Dev Notes，本复核没有剩余准备问题。没有发现需要改选工具链、等待9.3/9.5或索取真实账号/原生资源的准备阻断；本结论仅关闭准备指导问题，不代表实现或运行验证通过。以下保留初审问题与来源，最新关闭证据见末节。

## 定向修正

### PV-01 — P2：现有captcha注入不能替代PNVS分支

- 定位：Story T1第106行、Dev Notes第182行；repository-context第22行。
- 事实：`LoginScreenProps.getCaptchaToken` 仅被非PNVS分支消费。`apps/mobile/src/auth/LoginScreen.tsx:245–255` 在 `provider === 'aliyun-pnvs'` 时直接调用导入的 `requestPnvsCaptcha`；`apps/mobile/src/auth/pnvs-captcha.ts:20–39` 会按有效配置加载 `/vendor/pnvs/ct4.js`。仅传入合成 `getCaptchaToken` 不会替代该分支。
- 影响：开发者照“既有依赖注入”接线、同时复用真实形状的PNVS配置时，点击行为验证会进入未被替代的SDK路径。即使最终被网络守卫拦住，也无法获得计划要求的稳定合成工作台；宽泛静态资源白名单则可能放过SDK入口。
- 建议：首批LoginScreen场景明确固定合成 `/auth/config` 的 `captcha.provider: 'fixture'`，配合既有 `getCaptchaToken` 注入。生成类型 `AuthCaptchaConfig` 已允许fixture，不需变更OpenAPI或产品组件。若以后需要演示PNVS形状，必须在工作台边界单独隔离导入分支，并验证不加载真实SDK；不要把普通callback注入写成PNVS已经替代。保留误配PNVS/worker失败的无SDK、无外发负例。
- 协调：主任务已按fixture固定及负例方向修正；限定复核确认落实，见末节。

### PV-02 — P2：严格失败不能调用会打印完整请求的MSW默认错误出口

- 定位：Story T2第114行要求触发error，第182行要求日志仅保留安全方法/规范路由；tooling-research第74–75行同样要求严格失败与安全记录。
- 固定制品事实：只读检查 `msw@2.15.0` 的 `src/core/utils/request/onUnhandledRequest.ts`，`print.error()` 对应内置error策略；它在抛出异常之前打印包含URL query和请求body的诊断。自定义失败账本只存安全路由，不能阻止这个额外日志出口。[固定MSW制品](https://registry.npmjs.org/msw/-/msw-2.15.0.tgz)
- 影响：直接照常见 `onUnhandledRequest(request, print) { ledger.add(...); print.error(); }` 接线，会违反本合同自己规定的日志范围。错误请求被业务catch不影响这个打印行为。
- 建议：明确使用项目的脱敏错误/诊断出口来终止请求，仍以场景账本收尾断言保证非零退出；不要调用含完整请求内容的 `print.error()` / `print.warning()`。处理已命中请求的工具日志也采用quiet/受控策略。补一个仅含合成sentinel的query/body负例：请求被阻止、gate失败且捕获日志不含sentinel。该条不要求任何真实数据或秘密参与测试。

### PV-03 — P2：CI的lint增量基准需要可获得的ref及事件规则

- 定位：Story T3第120行、Dev Notes第190行、T6第137行；repository-context第81行。
- 事实：计划正确要求明确base及基准缺失时失败；现有 `.github/workflows/ci.yml:34–35` 使用没有fetch设置的 `actions/checkout@v4`。该action默认只取触发工作流的一个commit，并不保证PR base、push前commit或merge-base已存在。[actions/checkout v4](https://github.com/actions/checkout/tree/v4)
- 影响：若开发者只新增lint步骤而保留checkout，新gate可能在干净CI因基准不可得而每次失败；改成缺基准时跳过又会破坏既定覆盖合同。当前本地含大量旧未提交变化，更不能把任意HEAD差异当9.4起始范围。
- 建议：T0/T6明确保留初始cohort快照，并定义PR及main push的比较基准来源；CI先取得所需ref或足够历史，再验证它可解析，之后运行覆盖补充。初次push/缺失旧SHA要有明文策略，不能静默空跑。补浅克隆/缺base失败，以及取得base后新增/重命名文件真实进入gate的正例。无需在准备阶段更改CI。

## 已核对且不需扩围的内容

1. `msw-storybook-addon@3.0.3` 发布包的 `build/csf3.mjs` 和类型声明支持 `mswLoader(customSetup)`；setup等待worker启动并返回worker的计划正确。根addon注册、CSF3入口、纯handlers与Node单独生命周期的职责清楚。不要回退旧initialize接口。[官方addon说明](https://github.com/mswjs/msw-storybook-addon)
2. `@storybook/addon-vitest@10.6.0` 发布包确认自动提供preview annotations；独立Vitest配置不复制旧setProjectAnnotations初始化是正确指导。单Chromium组件交互属于9.4，9.5保留跨引擎产品流程、截图及旧探针等价替代责任。[Vitest addon说明](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
3. cohort、每条诊断/节点摘要/数量的冻结、同数量新问题与移动/复制节点负例，已经比仅比较诊断总数更明确；没有将当前旧HEAD误写为全部当前实现。临时副本使用同一ci:lint入口/TSProgram及规则ID断言，能防止以parse error或空范围冒充规则通过。
4. 工作台在独立目录消费真实HomeSheet/LoginScreen，worker不放产品public，产品入口不反向导入工作台；既有HomeSheet缺少Portal/inert/native返回的事实明确留给9.3。自动a11y、浏览器、资源同步与真机关闭责任没有混淆。
5. 默认mobile `vitest run` 与Node native-config测试、既有PG/恢复/IDB/Puppeteer探针均有保留要求；CI接线与未接线脚本清单区分了“存在”与“实际执行”。未因工具准备宣称9.3/9.5/原业务Story完成。

## 实施时的两项现有护栏落点

以下只是帮助实现已写入的T2/T5责任，不新增验收范围：

- 跨场景未处理请求账本应在断开/排空该场景的请求与订阅后断言，再清空；不能先reset账本而丢掉迟到违规。现有计划已有迟到请求负例，需保留到真正收尾命令。
- 现有 `native:verify` 在 `apps/mobile/scripts/verify-native-project.mjs:54` 只对每个Web产物验证双端同名文件摘要，不拒绝native目录中额外遗留的文件。T5新增隔离检查应枚举双端资源全集，并让“只往一个native public目录追加mock worker、Web dist不变”的污染负例失败，不能仅引用native:verify通过。

复核只读引用的Story文件摘要见frontmatter；后续文字修正会改变该摘要。两份研究在读取时的SHA256分别为 `244d3f01bab63a945574c450f18ca1e6af5d729e359fac843f83cde332b944c6`（tooling）和 `345cfc2df0de17933772394e9d1bd30505ca6e8429face87e0827ce12b4e6805`（repository）。未运行安装、构建、lint、组件或远端CI，未产生这些检查的通过结论。

## 限定复核与关闭（2026-09-25）

仅重新读取当前Story中上述修正，不扩展到新问题或重开工具选型。已核对的最终准备稿SHA256为 `6320593e4ce0a093371ca7e6f0b15cd3fb537f60a81723dd00bd0d2b4a052a1c`；以下行号对应这个快照。

| 原问题/提示 | 当前落实位置 | 限定结论 |
| --- | --- | --- |
| PV-01：PNVS注入边界 | T2第112行、Dev Notes第186行 | 已明确fixture配置、既有token注入和交互前拒绝非fixture；误配provider及worker未就绪/失效均须证明无SDK/外发。准备问题关闭。 |
| PV-02：MSW完整请求日志 | T2第115–116行、Dev Notes第176行 | 已使用固定脱敏错误与账本，排除MSW默认请求打印，控制handled日志；query/body哨兵须检查stdout/stderr、浏览器日志及证据。准备问题关闭。 |
| PV-03：CI比较基准 | T6第140行、Dev Notes第194行 | 已明确PR base SHA、push before SHA、受控fetch及可解析校验，缺非零base失败、全零before全cohort策略和浅克隆反例；bootstrap指纹不会永久豁免后续改动/新增/重命名。准备问题关闭。 |
| native额外文件提示 | T5第136–137行 | 已要求枚举dist/Android/iOS完整资源集合并拒绝native独有的worker/mock；污染负例覆盖native目标目录。提示已落实。 |

本轮仍只更新本报告；没有改Story、依赖、源码、CI或Sprint，也没有运行实现测试。最终状态为 `passed-targeted-recheck`，剩余准备发现0项。
