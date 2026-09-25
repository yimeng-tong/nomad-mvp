---
project: nomad-mvp
story: '8.6'
date: 2026-09-13
status: research-complete-selection-approved
delegatedAgents: 2
selectionApproved: true
selectionApprovedDate: 2026-09-13
operatorSurface: desktop-web-only
productionDataQueried: false
installedOrDeployed: false
---

# Story 8.6 成熟运营总览方案研究

## 已批准采用（2026-09-13）

**建议在现有受限Node/React桌面Web上增加薄只读总览，复杂分析进入Sentry/Langfuse及
8.2-8.5现有工作区。** 总览只负责正确并列来源、解释范围和提供入口；本期不强制新增
Grafana、公共分享、iframe或通用图表编辑器。预算、事件及质量报告继续保留原权威。

两组研究都认可原生dashboard已经适合本来源的深入分析。新页的实际收益是把业务任务、
封存质量报告、PG预算/事件及观测样本放在同一入口，清楚显示它们并非同一个时间窗口
或同样完整的数据；不是因为成熟工具“没有图表”才自建。它需要少量聚合API/状态与
链接适配，仍有开发、缓存、权限和查询负载成本，不能宣称零维护。

## 研究与版本证据

- [现有工具报告](story-8-6-existing-tools-agent-report-2026-09-13.md)：Sentry/Langfuse
  dashboard/指标API、采样外推、查询额度、权限/保留和过滤深链。
- [组合方案报告](story-8-6-overview-composition-agent-report-2026-09-13.md)：Grafana
  原生组合与薄Web比较、数据源权限、窗口/点数、缓存/付费、嵌入和资源。
- 主agent核对当前Epic8拆分、8.1-8.5合同；复核Grafana官方Viewer安全边界、Langfuse
  Metrics兼容/延迟及限额、Sentry Timeseries采样参数。关键源码和固定版本URL均在
  两报告内；来源公开能力与项目真实账户能力分开，未查生产数据或凭据。

观察日期为2026-09-13。研究所见Grafana v13.2.1、Langfuse web4.35.0以及Sentry固定
源码/公开API，不等于部署状态。实际8.1实施后的SDK/服务端、区域host、套餐/权限、
可读取历史和来源限额须按真实环境确认，不在8.6默认顺便升级。

## 比较与选择

| 方案 | 能做什么 | 仍需补的合同/代价 | 选择 |
| --- | --- | --- | --- |
| 原生Sentry/Langfuse | 成熟错误/耗时/AI成本/评分widgets及筛选/详细排障 | 无法自动把8.4账本和8.5事件变成同一权威；两个入口本身不完成跨来源核对 | 保留原生分析，提供受保护链接 |
| 既有Node/React薄总览 | 有限固定聚合、各来源独立状态、准确标注账本/报告/事件与原工具入口 | 需实现只读适配、缓存合并/限流、权限与指标定义；不能变成任意查询代理 | 本期建议 |
| Grafana OSS/native | 原生多来源面板、变量、时间、表格、PG数据源与链接 | 新服务或既有实例适配、聚合身份/数据库视图、不同窗口和新鲜度仍须定义 | 有合格既有实例可后来复用，不设新部署前置 |
| iframe/公共snapshot | 便于嵌入/分享某些原生页面 | 独立身份、CSP/cookie、撤权、密钥/私有副本风险及套餐条件 | 本期不采用；不声称所有厂商都不支持私有嵌入 |

Sentry当前源码为FSL-1.1-Apache-2.0，Langfuse core MIT/EE另许可，Grafana主仓库
AGPL-3.0。原生图表、API、细粒度数据源权限和查询缓存的付费边界不同；实际账号是否
已授权未知。两报告附官方定价/固定LICENSE，不据开源或免费dashboard推定所有API免费。

## 关键核验结论

**指标API不是无限实时读取。** Langfuse Metrics v2自托管需v4，旧写入SDK/OTel路径
数据可能延迟最多15分钟。公开Hobby v2查询额度为100次/24小时，组织内共享资源桶；
因此每个浏览器/面板高频轮询可能很快耗尽额度。具体刷新频率须按真实部署/套餐预算，
不能把这里的公开值写成Nomad默认配置。
[Metrics API](https://langfuse.com/docs/metrics/features/metrics-api)、
[API limits](https://langfuse.com/faq/all/api-limits)

**成功查询仍可能只有部分覆盖。** 报告核验的Langfuse metrics实现先按套餐可访问
天数裁剪查询；总览需要登记历史边界并展示实际覆盖，不把更早缺口算成0业务。
Sentry Timeseries的采样/外推参数会改变计数含义，某些低采样/高基数查询只适合粗估。
业务任务计数、观测样本数和预算消耗不能因为都叫count/cost就合并。
[Langfuse固定实现](https://github.com/langfuse/langfuse/blob/39e3cd7d6572236fa9d88e475297941eb118d74b/web/src/pages/api/public/v2/metrics.ts)、
[Sentry查询合同](https://docs.sentry.io/api/explore/query-explore-events-in-timeseries-format/)

**Viewer不等于数据隔离。** Grafana官方明确Viewer可以向有权数据源提交任意查询，
不限于某面板SQL。若将来采用它，必须用只可读批准聚合视图的专用身份或受限API，
不能接应用DB owner后靠隐藏编辑器隔离。薄总览同样只代理固定只读聚合，不把凭据或
任意SQL/URL入口给浏览器。
[官方安全说明](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/)、
[PG数据源配置](https://grafana.com/docs/grafana/latest/datasources/postgres/configure/)

**时间与显示粒度必须独立于事实。** 质量报告、预算账期和当前事件各有自己的版本/
as-of。Grafana面板可覆盖全局相对时间，数据点数默认还受像素宽度影响；总览核心计数、
成本与P95需由固定定义的源端聚合返回，不按图宽重算，也不平均多个P95。
[Grafana查询选项](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/)

**链接要验证实际筛选。** 原生链接可带时间/环境/变量，但目标工具可能有自己的过滤
优先级或不支持某条件。Langfuse widget环境可覆盖dashboard选择。记录实际带入范围，
目标独立登录鉴权，不用public share、匿名访问或URL token绕过。私有iframe不是
技术上不存在，只是本期不增加那套部署/身份合同。
[Langfuse过滤说明](https://langfuse.com/docs/metrics/features/custom-dashboards#environment-filter-precedence)、
[Grafana链接](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/manage-dashboard-links/)

## 最小落地范围

数据按明确归属读取：业务任务/降级用既有业务聚合；样本耗时/错误用8.1；评价用8.2
固定报告；配置用8.3/8.4/8.5只读版本证据；金额用8.4账本；故障/通知状态用8.5。
不为了做总览新增完整raw trace镜像或把PG事实导入监控工具再读回来。

查询端逐来源独立超时，限制窗口/行数/并发，并合并同范围请求和共享有限缓存。每项
返回来源、定义版本、请求/覆盖窗口、源数据时间、读取时间、状态及采样/估算属性。
权限参与缓存隔离和失效；换环境/账号、撤权或迟到旧响应不能泄漏旧范围。某源失败
保留其他已授权结果，空集、未接入、无权、限速、失败与陈旧分别显示。

界面只固定摘要和来源入口：不改路由、重结算账本、发测试消息、修改告警、启动评测
或重跑任务。没有全局天然原子快照，不以一次刷新制造全源同一时刻/完全健康的声明。
没有核心源数据时可以诚实显示未接入，但不能把这些占位与原型当作Story整体交付。

## 实施仍需证据

- 实际各来源版本/区域/权限/套餐、历史边界与API限额，以及先前Story是否已交付对应事实。
- 分子/分母、取消/进行中范围、事件时间/账期/报告版本、币种与p95等指标定义及正确结果。
- 真实聚合读取与原工具链接，包括目标过滤覆盖、登录/无权、分页/截断和保留期限制。
- 多浏览器/多面板查询负载、缓存占用/隔离/撤权、超时/429退避、迟到响应与部分故障。
- 只读权限、字段脱敏及桌面浏览器状态；核心数据缺失不能靠采样推算、模拟或缺省0补齐。

本研究方向及[20条已批准GWT和中文验收说明](../story-8-6-review-2026-09-13.md)，
已获用户认可；无账号/生产数据访问、安装、部署或新服务采购。仍需Epic8覆盖核对和整体确认，
不能把最后一张Story的规划批准等同最终CE/IR/SP通过。
