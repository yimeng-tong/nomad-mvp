---
project: nomad-mvp
story: '8.6'
date: 2026-09-13
status: research-complete-awaiting-story-review
scope: reuse-Sentry-and-Langfuse-dashboards-and-read-APIs
operatorSurface: desktop-web-only
accountAccessed: false
credentialsRead: false
productionDataQueried: false
installedOrDeployed: false
businessCodeChanged: false
---

# Story 8.6 现有 Sentry / Langfuse 总览复用研究

**建议采用“薄只读 Web 总览 + 原生工具钻取”。** Sentry 和 Langfuse 已能完成各自的错误、性能、成本和评分分析，不需要在 Nomad 重建图表编辑器、日志搜索或评测工作区。薄总览的实际价值是把这些摘要与 8.3 路由、8.4 预算账本、8.5 故障/投递事实放在同一受限入口，并解释来源、范围和新鲜度。只把两个仪表板链接排在一起，不能完整提供跨来源核对；反过来，把 PG 账本复制进采样遥测以凑一个原生大屏，也会增加一套易漂移的事实副本。

研究日期为 **2026-09-13（Asia/Shanghai）**。已读取 Epic 8 拆分及 8.1–8.5 的有关合同；8.5 用户批准由主 agent 传达，正式文档同步中。保持 8.1 的隔离 tracing 和安全关联、8.2 的逐规则评价/独立人评、8.3 的路由权威、8.4 的真实/暂估/未知金额，以及 8.5 的故障与通知状态分离。本报告仅编辑自身，未访问账户、读取密钥、查询生产数据或安装部署。

## 1. 已证实的原生能力

| 工具 | 已有可复用能力 | 8.6 应如何使用 |
| --- | --- | --- |
| Sentry Dashboards | 跨项目错误/性能 widgets；项目、环境、日期、release 筛选；预置前后端/AI 性能视图；widget 可进入 Explore/Issues，展开视图 URL 可复制 | 复用已登记的错误/性能视图，原工具承担详细排障；不要复制 issue 搜索、堆栈或 widget builder |
| Sentry Explore API | 按 dataset、字段/聚合、查询和时间范围返回表格或时间序列；可查询 errors、spans、logs、tracemetrics 等实际已接入的数据 | 服务端只调用预先批准的少量只读聚合，不向浏览器开放任意查询代理；dataset 存在不等于 Nomad 已采集该数据 |
| Langfuse Dashboards | 成本、延迟、用量预置视图；自定义 observation/trace/score 分析与过滤；项目 Home 可选择 dashboard | AI 调用趋势、版本比较和评分钻取交还 Langfuse；8.2 的人工评分与实验工作区继续原入口 |
| Langfuse Metrics API | 聚合 cost、token、volume、latency、numeric/categorical/boolean score，按支持维度和时间分组 | 取有限摘要；复杂筛选与逐例内容仍留原工具，不为总览建立原始 trace 镜像 |

依据：[Sentry Dashboards](https://docs.sentry.io/product/dashboards/)、[Sentry Explore 表格 API](https://docs.sentry.io/api/explore/query-explore-events-in-table-format/)、[Langfuse Custom Dashboards](https://langfuse.com/docs/metrics/features/custom-dashboards)、[Langfuse Metrics API](https://langfuse.com/docs/metrics/features/metrics-api)。这些是公开产品/协议能力，**未在 Nomad 实际租户上验证**。

Langfuse 当前文档还提供 `/api/public/unstable` 下的 dashboard/widget 管理接口，并明确合同仍可能变化。8.6 是只读入口，不需要依赖这些写接口或自动创建仪表板。Sentry 的原生 dashboard 编辑权限也不等于数据查看隔离；Nomad 总览不能通过隐藏编辑按钮替代后端授权。

## 2. 版本与 API 合同：不能沿用旧 SDK 形状

**Langfuse：**当前 Metrics API 为 `GET /api/public/v2/metrics`；云端各档可用，自托管需 v4+，v3 使用 legacy v1。v2 移除 `traces` view，以 observation 和 score views 为主；默认返回最多 100 行，可配置到 1,000，部分高基数字段只允许筛选，不允许分组。将 v1 的 trace count 改成 observation count 会改变分母，不能仅替换 URL。[版本与行数约束](https://langfuse.com/docs/metrics/features/metrics-api)

旧 JS/TS SDK `<5.4.0`、Python SDK `<4.7.0` 或未带 v4 ingestion header 的直接 OTel 出口，数据进入 v2 查询可能延迟最多 15 分钟。项目当前依赖文件仍有旧 `langfuse ^3.21.0`；真正部署的 8.1 接入/SDK/服务端版本未核实。8.6 不能因为调用 v2 就承诺实时，也不应在本 Story 顺便强制全栈升级。[Public API 兼容说明](https://langfuse.com/docs/api-and-data-platform/features/public-api)、[Metrics v2 数据延迟](https://langfuse.com/docs/metrics/features/metrics-api)

固定源码核验：Langfuse HEAD `39e3cd7d6572236fa9d88e475297941eb118d74b` 的 web package 声明 **4.35.0**；`metrics.ts` 要求可用的 v4 write mode，以 `metrics:read` action 和 project auth 执行。它会先 `clampToDataAccessDays`，把查询开始时间裁到套餐可访问窗口，再返回 `{data}`。**推断：成功响应也可能只覆盖所选历史的一部分**，因此 UI 必须知道该来源的数据访问边界，不能把更长空白区间解释为无业务。[固定 metrics 实现](https://github.com/langfuse/langfuse/blob/39e3cd7d6572236fa9d88e475297941eb118d74b/web/src/pages/api/public/v2/metrics.ts)

**Sentry：**公开 Web API 当前称为 v0；本轮核实 `/api/0/organizations/{org}/events/` 与 `/events-timeseries/` 文档。表格 API 最多选择 20 个字段，明确不作为全量导出接口；所需只读 scope 可用 `org:read`，具体项目访问仍须实际核对。固定 HEAD `e917c50c2413cd5082524c3f98791eb035fd38de` 的 Timeseries 实现有独立限速和采样外推参数，不代表 Nomad 当前 Sentry 服务端已是这个版本。[Sentry API](https://docs.sentry.io/api/)、[Timeseries 固定源码](https://github.com/getsentry/sentry/blob/e917c50c2413cd5082524c3f98791eb035fd38de/src/sentry/api/endpoints/organization_events_timeseries.py)

## 3. 采样、质量和成本的口径限制

1. **Sentry 图表可能是外推结果。** Timeseries API 的 `disableAggregateExtrapolation=1` 才表示返回采样值；采样值可能小于实际上报量。官方还说明低采样、超过 30 天或高基数 `count_unique` 等查询只适合粗估。不能把其 count 直接命名为全平台请求总数；需要记录 dataset、采样/外推模式、时间窗口和有效样本数。[官方 Timeseries 限制](https://docs.sentry.io/api/explore/query-explore-events-in-timeseries-format/)
2. **Langfuse 只分析已摄取数据。** 未采样 trace 的 observation/score 不会全部出现；AI 与 Sentry 又是按 8.1 独立有界采样。两端数量不能相加或相除来算统一失败率、覆盖率，更不能据 Langfuse 空结果推断没有付费请求。[Langfuse 采样说明](https://langfuse.com/docs/observability/sdk/advanced-features#sampling)
3. **Langfuse cost 不自动等于供应商扣费。** 它既接受直接上报费用，也会用 usage × model definition 推导；上报值优先。缺模型/usage 可能无法计算；重叠 token bucket 会重复计算。资费更新通常只影响新摄取 generation。8.4 已核对金额、暂估结算、未外发预留、在途/待核对占用及供应商钱包余额仍各有来源，不应由 Langfuse cost 一栏替代。[Token & Cost Tracking](https://langfuse.com/docs/observability/features/token-and-cost-tracking)
4. **评分不是全量满意度。** 8.2 的质量摘要应绑定 dataset、run、prompt/model/schema/规则版本以及评分来源；显示已评分数、总样本数和缺失/人工待评。不同量表、不同样本池或线上采样与固定回归集不能混成一个平均分。此项来自已批准本地合同，是本研究对总览的设计约束。
5. **分位数和时钟不能机械合并。** Model latency、TTFT、HTTP 请求耗时和含排队的 Job 总耗时是不同量；不能平均多个 p95 产生“全平台 p95”。统一 UTC 查询边界并显示用户时区，但保留每源返回/摄取水位，不假称读取同一原子快照。这是统计与跨来源整合的推断，不是厂商 API 自动提供的保证。

建议 8.6 的权威分配：业务任务/成功降级取已交付的业务事实；预算和费用取 8.4；故障周期、恢复、Telegram 投递取 8.5；错误堆栈/性能样本取 Sentry；AI observation 趋势与质量回归/人评入口取 Langfuse 和 8.2 的报告快照。Sentry issue 被关闭、Langfuse无新 trace或Telegram成功回执，都不能代替8.5的恢复证据。

## 4. 免费/付费与刷新频率

以下为当日公开方案，未核验现有账户购买/旧合同。观察成本是工具使用费，不能混入 8.4 的 Provider 模型费用。

| 项目 | 官方当前边界 | 对薄总览的影响 |
| --- | --- | --- |
| Sentry Developer | 免费、1 user、10 custom dashboards、30-day lookback | 免费版已有 dashboard，不能沿用“只有付费才有图表”的旧判断 |
| Sentry Team / Business | 定价页年付等效分别 26 / 80 USD 每月；Team 列 API/第三方集成和20 dashboard，Business无限 dashboard及更多治理 | 不承诺免费账户支持每个数据 API；实际 endpoint entitlement/数据保留须部署核验，不自动采购 |
| Sentry API 限流 | 每 caller + endpoint 同时限制频率和并发，响应包含 limit/remaining/reset/concurrency headers | 不硬编码一个全 API 通用 RPS；合并请求/缓存/退避，不能用多个token绕过相同caller限额 |
| Langfuse Hobby | 免费、2 users、50k units/月、30天数据访问；Metrics v2 100 requests/24h | 多面板/多浏览器每分钟刷新不可行；服务端共享缓存并减少query数量 |
| Langfuse Core | 29 USD/月、90天数据访问；Metrics v2 100 requests/hour | 摘要读取可更频繁，仍需要共享缓存与最大时间/行数限制 |
| Langfuse Pro 等 | Pro 199 USD/月、3年数据访问；公开 Metrics v2 桶为500 requests/hour，Enterprise可谈更高 | 更高额度不等于无限查询；访问/RBAC/审计有另外档位或add-on要求 |

依据：[Sentry Pricing](https://sentry.io/pricing/)、[Sentry API Rate Limits](https://docs.sentry.io/api/ratelimits/)、[Langfuse Pricing](https://langfuse.com/pricing)、[Langfuse API Limits](https://langfuse.com/faq/all/api-limits)。Langfuse限额按组织与resource bucket共享，跨project和key合计；窗口由第一请求起算，不按UTC整点。429应尊重`Retry-After`。自托管没有这些云端硬额度，不意味着基础设施无负载上限。

**推断例子：**Hobby 一天100次Metrics查询，即使每次一条query，全天均匀执行也约14.4分钟才有一份；若每轮4条query，则约57.6分钟一轮，还未留失败重试和其他调用余量。这只是容量算术，不是推荐刷新配置。原生 UI 与公共 API 是否共用同一配额未实测，不能把该100次额度套到原生 dashboard 浏览上。

Langfuse 根许可证为 MIT（ee目录例外）；Sentry当前服务端根许可证为 FSL-1.1-Apache-2.0，不能称整个现行服务端MIT/Apache开源。本期是复用既有工具与公开API，不复制其平台代码，也不新增自托管系统。[Langfuse LICENSE](https://github.com/langfuse/langfuse/blob/39e3cd7d6572236fa9d88e475297941eb118d74b/LICENSE)、[Sentry LICENSE](https://github.com/getsentry/sentry/blob/e917c50c2413cd5082524c3f98791eb035fd38de/LICENSE.md)

## 5. 深链、权限和隐私

**可复用的深链事实：**Sentry widget viewer URL可复制；Langfuse Home/dashboard选择会反映到URL。Langfuse widget自带的environment过滤还可能覆盖dashboard总environment选择器，故链接上看见“prod”不充分证明每张tile都是prod。[Sentry dashboard钻取](https://docs.sentry.io/product/dashboards/)、[Langfuse过滤优先级](https://langfuse.com/docs/metrics/features/custom-dashboards#environment-filter-precedence)

建议从部署注册表生成允许域名/项目/环境内的深链，仅携带最小非敏感过滤或关联标识；链接本身不是授权。源工具继续要求用户登录和对应项目权限。没有权限/已删除/超过保留期时，显示无法查看原因和源入口，不改用public share link绕过。**本轮没有验证iframe、跨站cookie、CSP或SSO嵌入合同；因此不将iframe设为设计前提，也不宣称厂家禁止一切嵌入。**

Sentry数据API使用Bearer认证和明确scope；Langfuse Project Public API使用public/secret key与对应地区host。Langfuse角色`Viewer`是只读，而`Member`还可创建评分；项目细分RBAC、企业SSO和audit的实际套餐需核实。API key权限与浏览器用户角色是两套控制，不能把服务端持有的项目key称为已证明的最小只读key。[Sentry认证](https://docs.sentry.io/api/auth/)、[Langfuse API认证](https://langfuse.com/docs/api-and-data-platform/features/public-api)、[Langfuse RBAC](https://langfuse.com/docs/administration/rbac)

**建议实现约束：**只读聚合经Nomad服务端鉴权，按操作者可读环境约束固定查询并隔离缓存；credentials不下发浏览器。第三方返回的metadata、标题、错误内容也视为未净化输入，只挑选允许字段。不要复制Sentry原始事件/堆栈或Langfuse生产input/output到总览。8.2获准评测副本可在其工作区保留旅行上下文，不能因此扩大8.1生产遥测权限。只读source查询失败不能改变Job、路由、预算或8.5故障判定。

## 6. 采用范围与待实测条件

最薄可用方案为：一页桌面Web展示业务可靠性、质量报告状态、预算来源分项、活跃故障与通知状态；每项注明来源/口径、环境、窗口、最新数据时间、采样/外推或覆盖不足，并提供受限原工具入口。复杂图表只在原生工具看。总览里不编辑路由/预算/告警策略，不触发模型评测/重新规划/探测发送，也不新建跨工具日志搜索。

每源独立呈现未接入、无数据、加载、已过期、限速、权限不足和查询失败；某源失败不掩盖其他已读事实。共享缓存降低供应商API压力；过期副本带时间，刷新失败不把数值清零或改为健康。查询参数与行数有界；top-N/截断返回不能冒充全量列表。上述属于本研究建议，正式GWT由主agent按BMAD文件格式编制，向用户展示中文编号验收说明。

实施前仍需确认实际Sentry/Langfuse部署版本、地区、付费权限、SDK写入兼容、API可访问时间窗、查询schema、采样/外推、数据延迟、缓存权限隔离、失联和源链接筛选一致性。报告/原型不代表这些已通过；本轮没有账号或生产调用验证。

**采用判断：复用Sentry/Langfuse原生dashboard与只读聚合API，新增仅满足跨来源核对需要的薄Web总览；不重建分析平台，不把iframe或更高付费套餐设为默认前置。** 若当前套餐/版本无法提供某项聚合API，保留该来源的受限原工具入口并明确“API未接入”，不能伪造数据；是否足以完成整体Story应按最终验收确认。

核心证据可归为八组：Sentry dashboards；Sentry Explore协议及固定源码；Sentry API认证/限流；Sentry定价/许可；Langfuse dashboards；Langfuse Metrics协议及固定源码；Langfuse采样/成本；Langfuse权限/套餐/限流。临时源码和公开文档摘取位于`/tmp/nomad-story86-tools/`，只作本次研究证据。
