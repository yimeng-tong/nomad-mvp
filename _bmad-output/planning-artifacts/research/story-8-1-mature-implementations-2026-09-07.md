---
project: nomad-mvp
date: 2026-09-07
story: '8.1'
status: research-complete-direction-approved
selectionApproved: true
selectionApprovedDate: 2026-09-07
delegatedAgents: 2
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.1 成熟实现调研与采用建议

## 调研执行

按用户要求委派两位 agent，均检索官方文档和 GitHub 的发布、源码、许可及相关 issue；
主 agent 核对本地依赖/调用边界，并重新打开关键官方来源验证结论。

- Dirac：Sentry、Langfuse、OTel 共存、默认采集、迁移、资源和清理能力。
  [原始报告](story-8-1-incumbent-stack-agent-2026-09-07.md)。
- Faraday：SigNoz、Grafana/OTel、GlitchTip、Phoenix 的覆盖面与替换成本。
  [原始报告](story-8-1-alternatives-agent-2026-09-07.md)。
- 主 agent：Node/Fastify/React 安装基线、旧事件字典、外部 trace ID、owner 与 7.5 清理衔接；
  用 [W3C Trace Context](https://www.w3.org/TR/trace-context/#security-considerations) 和
  [OTel 数据最小化](https://opentelemetry.io/docs/security/handling-sensitive-data/)核对信任边界。

调研日期 2026-09-07；报告中的版本为观察到的发布，不保证实施时仍为 latest。
没有安装/部署/注册账户/付费/读取密钥/发送用户数据，也没有运行性能或真实删除测试。

用户已批准保留 Sentry/Langfuse 与隔离 AI tracing 的采用方向；具体部署与付费能力仍未授权。

## 结论

**建议沿用 Sentry + Langfuse，复用成熟工具界面，仅开发 Nomad 所需的薄接入和数据保护。**
Sentry 定位前后端错误；Langfuse 查看经过筛选的 AI 工作流/attempt。OTel 是采集和导出标准，
不是第三套运营平台。保留有界结构化本地日志，不默认增加 Collector 集群或全套 LGTM。

这能避免重复建设错误聚合、source-map 定位和 AI trace 查看能力；但减少的是产品/平台开发，
不是免除隐私、兼容、授权与运行维护工作。使用效果需用一条真实错误到 AI attempt 的查询
和故障隔离测试证明，不能以 stars、宣传倍数或 SDK 安装成功衡量。

## 一个重要的集成取舍

现有组合 agent 倾向共享 provider 以取得完整分布式父子树。主 agent 在复核
[官方共存指南](https://langfuse.com/faq/all/existing-sentry-setup)后，为本 Story 建议更窄的
**Option C：唯一全局 provider 由 Sentry 管理，Langfuse 使用显式隔离的 provider**。

原因是 8.1 要求关联查询，不要求两个产品显示完全相同的 trace 树。隔离可避免 Sentry
采样牵动 AI trace；代价是没有自动跨工具父子关系，需以服务端生成的安全 correlation/job/
attempt 引用查询两边。ID 只能用于运维关联，不能鉴权。一次 AI workflow 仍遵守自己的
有界采样策略，不承诺记录全部调用。

这不是「允许两个 SDK 抢注全局 provider」：只有一个全局注册者，Langfuse provider 显式
使用且不注册为全局；每类自动 instrumentation 只有一个负责者。Sentry 不重复抓 AI
原始输入，Langfuse 不接受整套基础设施 spans。若未来确实需要共享父子树，再评估官方
Option B 与共同采样、过滤、启动顺序，不在此刻同时实现 B/C 两套运行模式。

## 方案比较

| 方案 | 可行性与预期价值 | 代价与限制 | 本次建议 |
| --- | --- | --- | --- |
| Sentry + Langfuse | 匹配已定 PRD，错误诊断和 AI 专项工具互补；现有接入口可迁移 | 两端权限/保留策略，旧 SDK 大版本迁移，自托管较重 | 首选，先验证薄接入与独立采样 |
| GlitchTip + AI 工具 | Sentry 兼容错误后端较轻，适合自托管需求 | 不等同 Sentry 全能力，也不替代 AI trace；需验证选定 SDK/事件格式、source maps 和删除 | 自托管错误侧首个备选，不现在替换 |
| Phoenix + 错误工具 | 更简单的 AI 后端拓扑和 OTel 接口值得比较 | 不替代浏览器错误管理；服务器为 ELv2，权限/数据隔离/迁移语义另验 | AI 后端备选；先对齐 PRD 再替换 |
| SigNoz | 集中 logs/metrics/traces，有 AI 观测能力 | 迁移与运维范围扩大；高级权限/许可不能按社区功能假定 | 本期不替换，不放进 2GB 场景 |
| Grafana/OTel | 按需补单一日志/指标缺口，可复用现成服务 | 全套 Loki/Tempo/Prometheus 等不是零运维；demo 单容器不代表生产方案 | 8.1 不整套引入，8.6 有缺口再研究 |

来源：[Sentry/Langfuse 共存](https://langfuse.com/faq/all/existing-sentry-setup)、
[GlitchTip 安装](https://glitchtip.com/documentation/install/)、
[Phoenix GitHub](https://github.com/Arize-ai/phoenix)、
[SigNoz 安装](https://signoz.io/docs/install/docker/)、
[Grafana LGTM 仓库](https://github.com/grafana/docker-otel-lgtm)。
各候选维护记录、许可文件、付费能力与更细的利弊见 agent 报告；表中采用结论是工程判断，
不是基准测试结果或许可法律意见。

## 部署与成本

- Langfuse 当前 Compose 文档建议至少 4 核 / 16 GiB，包含多个存储与 worker 服务，
  不是旧版 PostgreSQL 单服务拓扑。[官方部署文档](https://langfuse.com/self-hosting/deployment/docker-compose)
- Sentry 26.8.0 的 full profile 安装检查为 4 CPU / 14000 MB Docker RAM；errors-only
  也检查 2 CPU / 7000 MB，且不等同 full profile 能力。
  [版本化安装检查](https://github.com/getsentry/self-hosted/blob/26.8.0/install/_min-requirements.sh)
- SigNoz 文档要求 Docker 至少 4GB；GlitchTip 官方推荐 512MB 的较轻应用配置，但不是
  Nomad、数据库和多个观测工具同机的压测结论。
  [SigNoz](https://signoz.io/docs/install/docker/)、[GlitchTip](https://glitchtip.com/documentation/install/)

因此不建议默认把全部自托管栈部署到 2c2g 应用机。该规格仅是比较场景，不表示已检查或
选定任何主机。优先评估既有/托管实例以减少本地运维，但数据区域、实际访问、网络可用性、
留存/物理删除与免费/付费功能必须在实施前确认。自托管则另验资源余量、磁盘、备份和升级。
本轮不推荐具体订阅套餐或承诺免费额度足够。

## 兼容与安全影响

1. 本地安装为 Sentry 8.55.0 / Langfuse 3.38.6 / Fastify 5.8.5；研究观察的 Sentry stable
   10.73.0、Langfuse JS 5.11.0 是候选而非锁定。源码版本、后端版本、peer dependencies
   与生产 ESM 启动一起验证，不只升级 package.json。
2. [Sentry GitHub](https://github.com/getsentry/sentry-javascript) 与
   [Langfuse JS GitHub](https://github.com/langfuse/langfuse-js)的自动捕获机制需要逐出口审查。
   `sendDefaultPii=false`、Langfuse `mask` 或禁用媒体上传都不等于全部敏感数据已移除。
   要检查实际网络 envelopes/OTLP、错误文本、嵌套值、span names/resources/events 和 debug 路径。
3. 运营角色/保留自动化有产品版本与付费边界，不能把 SDK 许可套到服务端或高级治理功能。
   deletion API 的受理不等于实际删除，更不等于所有 owner 关联数据清理完成；纳入既有 7.5。
4. 监控失败、缓冲丢弃或采样缺口不得影响业务任务，也不能让缺失 token 被视作零成本。
   SDK 性能、同机容量和真实清理均为未验证事项。

## 8.1 评审建议

采用当前 PRD 工具组合和独立关联方式；GWT 固定可查询、隐私、去重/未知值、权限、
清理与故障隔离这些结果，不把所有远程部署细节伪装为已批准。图示仅解释跨工具排错，
不是新运营后台。批准 Story 后再同步正式源合同，真实环境实现与验收仍遵守 CE/IR/SP 顺序。
