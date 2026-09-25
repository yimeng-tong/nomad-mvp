---
project: nomad-mvp
story: '8.4'
date: 2026-09-13
status: research-complete-not-adoption-or-deployment-approval
scope: LiteLLM-and-Bifrost-budget-quota-cost-governance
method: official-docs-pinned-github-source-and-offline-helper-check
businessCodeChanged: false
installedOrDeployed: false
paidCallsMade: false
---

# Story 8.4 网关预算能力研究：LiteLLM / Bifrost

建议本期保持已批准的 Node adapter 与 PostgreSQL 权威，不为 8.4 引入这两套网关。两者的成熟计价、预算范围和运营界面值得参考，但都不能直接替代 Nomad 所需的跨实例持久预留、实际调用尝试结算，以及费用未知后的保守占用。尤其不能把“支持预算”解释成任何并发、重试、超时和价格缺失下都不会超支。

本报告只研究网关预算与成本治理。按 `CURRENT.md` 恢复，读取项目上下文、历史 sprint 状态、当前暂停 Story 2.2、Epic 8 拆分和 8.3 已批准边界。8.3 的任务路由快照、独立暂停、Node adapter 和单一 PG 路由权威保持有效；8.4 不重新选择调用器或把已有首次调用保护推迟至运营功能完成。

## 1. 方法、版本与证据强度

观察日期为 **2026-09-13，Asia/Shanghai**。资料来自官方文档和官方 GitHub；公开源码以临时目录中的稀疏只读研究副本检查，没有安装依赖、启动服务、读取凭据、创建账户、调用模型或修改业务代码。GitHub REST API 当次匿名配额返回 403，版本改用 `git ls-remote`、固定提交源码和官方 Releases 交叉核对。

| 对象 | 本次实际观察 | 解释限制 |
| --- | --- | --- |
| LiteLLM 稳定版 | Releases 标记 Latest 为 **v1.100.1**，2026-09-10；tag 指向 `1dba17b10ded12ad0021edb453ba2c54e4637928` | 稳定版预算关键文件已单独读取；没有把 main 新功能自动算入稳定版 |
| LiteLLM main | `1c61c2606e36061db4fce10f7bb94745d76bc84f`，提交时间 2026-09-12 16:05:50 UTC；pyproject 声明 1.102.0 | 属开发中的源码快照；Releases 上 1.102.0-dev.2 标为预发行 |
| Bifrost HTTP 发行 | **transports/v2.1.1**；annotated tag 解引用为 `c193745d2a713e9f58f021d43e138df5eb7e038a` | 稳定 tag 的 main/tracker/store 三个治理文件已单独读取；不能把 tag 对象 SHA 当提交 SHA |
| Bifrost 默认分支 | `0ebea6091a4005f72b346923da28412268ce9325`，提交时间 2026-09-12 21:24:49 +05:30；HTTP 2.1.1、core 1.8.6、governance 1.7.2 | 模块版本独立；企业版本也不能由 OSS 版本推算 |

版本来源：[LiteLLM v1.100.1 发布](https://github.com/BerriAI/litellm/releases/tag/v1.100.1)、[LiteLLM main 固定提交](https://github.com/BerriAI/litellm/commit/1c61c2606e36061db4fce10f7bb94745d76bc84f)、[Bifrost HTTP 2.1.1 发布](https://github.com/maximhq/bifrost/releases/tag/transports/v2.1.1)、[Bifrost 默认分支固定提交](https://github.com/maximhq/bifrost/commit/0ebea6091a4005f72b346923da28412268ce9325)。两仓库近期均有发行和相关维护提交，这证明正在维护，不证明 Nomad 场景已验收。

下文“已证实”指文档声明或固定源码可观察行为；“推断”指结合 Nomad 合同得出的影响；“未验证”指未运行服务、真实 Redis/PG 或 Provider 的部分。没有用 benchmark 宣传、星数或截图替代测试。

## 2. 能力与许可对照

| 维度 | LiteLLM | Bifrost |
| --- | --- | --- |
| 基础许可 | 根目录明确：enterprise 目录之外 MIT；enterprise 使用独立商业许可 | 公开仓库 Apache-2.0；企业发行能力不因 OSS 许可而自动免费 |
| 免费预算基础 | Virtual key、user、team 的基础预算、用量及 RPM/TPM/并发控制；多窗口配置 | Virtual key、team、customer、provider/model 等治理范围，预算和请求/token 限制；原生 UI/API |
| 有明确付费边界的相关能力 | 官方列出 per-model key/user budget、tag budgets、项目治理、临时加额、软预算邮件提醒、管理审计/细分权限等 Enterprise 功能 | 官方将 cluster、RBAC、OIDC/SCIM、audit、guardrails 等放入 Enterprise；预算基本能力本身在 OSS |
| 预算预留 | 有；但稳定版、默认模式和严格模式存在关键差异，见下一节 | 已检查 OSS 路径按当前使用量准入，再异步计价加总；未见这一路径预留最大请求成本 |
| 跨进程/实例 | PostgreSQL 持久化 + Redis 协调；没有 Redis 时多个 worker 独立计数 | OSS 的运行计数在本机内存；多实例共用 PG 不等于共享准入计数。企业提供状态同步 |
| 对 Nomad 的直接缺口 | durable attempt/owner/job fencing、逻辑任务额度去重、费用未知账本、AMap 等非 LLM 消耗仍需自己实现 | 同左，另需解决跨实例精确准入与持久去重；购买 cluster 不能据公开资料直接消除此缺口 |

许可与能力来源：[LiteLLM 根许可](https://github.com/BerriAI/litellm/blob/1dba17b10ded12ad0021edb453ba2c54e4637928/LICENSE)、[LiteLLM Enterprise 许可](https://github.com/BerriAI/litellm/blob/1dba17b10ded12ad0021edb453ba2c54e4637928/enterprise/LICENSE.md)、[LiteLLM 功能边界](https://docs.litellm.ai/docs/enterprise)、[Bifrost 许可](https://github.com/maximhq/bifrost/blob/0ebea6091a4005f72b346923da28412268ce9325/LICENSE)、[Bifrost OSS governance 配置](https://docs.getbifrost.ai/deployment-guides/config-json/governance)、[Bifrost 企业配置边界](https://docs.getbifrost.ai/deployment-guides/config-json/schema-reference)。这是本次所见条款/功能分类，未询价、未签署商业条款，也未验证许可证服务故障时的实际行为。

## 3. LiteLLM：有预留，但稳定版不能据文档直接认定硬上限

### 3.1 官方文档与稳定源码的临界值差异

**已证实：**当前官方 Budgets 文档说明预留默认开启，按最大请求成本预留，完成后换成实际费用；禁用预留会允许并发超支。它同时提供默认关闭的 `fail_closed_budget_enforcement`，用于无法验证预算状态时拒绝请求。没有数据库的全局预算可能 fail open，不能用 DB-less 部署承担预算治理。[官方预算说明](https://docs.litellm.ai/docs/proxy/users#budget-reservation)

**更重要的源码事实：**v1.100.1 的 `_apply_over_budget_reservation_policy` 在剩余额度仍大于零时，把预留缩小到剩余额度并继续。这一函数没有严格模式参数；该版本的 `fail_closed_budget_enforcement` 在预留写失败路径拒绝，不会改变这个“缩小预留”的分支。[稳定版准入与缩额代码](https://github.com/BerriAI/litellm/blob/1dba17b10ded12ad0021edb453ba2c54e4637928/litellm/proxy/spend_tracking/budget_reservation.py#L115)

**已证实的版本进展：**9 月 12 日 main 的同一函数增加严格模式分支：最大估价超过剩余额度时拒绝；普通模式继续缩小预留。预留估价无法获得时仍返回无预留，走读取已记录使用量的路径。[main 严格模式分支](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L118)、[main 未知估价分支](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L253)

本次对上述固定源码中单个函数做了**纯离线提取检查**：只执行此函数，缩额/释放操作替换为空操作，拒绝替换为测试异常；不启动 LiteLLM、Redis、PG 或 Provider。输入为预算 100、已用 99、最大估价 3，即预增后的 counter=102：

| 源码/模式 | 离线函数结果 |
| --- | --- |
| v1.100.1 稳定版 | 返回预留 1，继续准入；函数不接收 strict flag |
| main，strict=false | 返回预留 1，继续准入 |
| main，strict=true | 拒绝 |

**推断：**若实际请求花费 3，稳定版可最终从 99 到 102。预留能阻止更多请求同时抢同一余量，却不必然保证最后一笔费用不越过上限。官方“超预算即拒绝”的概述不能覆盖这个稳定版分支。本测试仅验证该分支，不证明分布式 counter 的完整正确性。

### 3.2 估价、失败、缓存和重试

**已证实：**main 对同组候选模型取可估价最大值，支持 token、reasoning 高价率及部分 `n × per-image` 估价；其源码明确指出 per-pixel、部分 size/quality-tiered image 不在该专用估价范围。不能把所有图像/音频统一说成“支持”或“不支持”。Batch 提交只有文件 ID，官方不保证全批最大成本预留。[估价实现](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L1080)、[图像估价边界](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L1263)、[Batch 预算说明](https://docs.litellm.ai/docs/proxy/users#batch-requests)

**已证实：**稳定版取消处理会按估计 input cost 结算并释放 output 预留；通用 reconcile helper 把传入 `None` 转为零。main 另有终态无成本路径释放/失效 counter 的处理。**推断：**这不是“Provider 账单尚未知时保持保守占用直到核实”的业务账本。客户端断开不证明上游停止生成，input-only 估价不等于最终账单。应分别记录已报告 usage、估计值和未知余量。[稳定版取消/结算 helper](https://github.com/BerriAI/litellm/blob/1dba17b10ded12ad0021edb453ba2c54e4637928/litellm/proxy/spend_tracking/budget_reservation.py#L279)、[main 终态释放 helper](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L398)

**已证实：**官方说明 spend-log 派生请求数逐上游 attempt 记录，和 gateway 回答的请求数不同；仓库用例矩阵包含直接缓存命中零增量费用、失败状态、并发无漏记等用例，同时承认部分模态的 live coverage 仍不足。存在测试不代表本次跑过。**未验证：**多层重试、回退、流中断、迟到成功和异常回调全部组合下，稳定版是否逐 physical attempt 完整计费、是否每次重新预留。不能把一次 gateway request 的预留等同每笔上游外发预算。[官方请求数口径](https://docs.litellm.ai/docs/proxy/cost_tracking#daily-spend-breakdown-api)、[官方仓库覆盖矩阵](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/tests/e2e/quota_management/spend_tracking/SPEND_TRACKING_COVERAGE_MATRIX.md)

### 3.3 Redis 与 PG 的责任

跨 worker 的 RPM/TPM/并发和预算协调需要实际配置 Redis。仅设置 Redis 环境变量不足以建立连接；官方要求把配置指向它。没有共享 Redis 时，本机预算和计数独立，多实例可能在 PG 追上之前超支。[What Needs Redis](https://docs.litellm.ai/docs/proxy/redis_requirements)

源码预留写入 counter，PG 花费异步更新，不是与 Nomad Job 同一 PG 事务中的持久 reservation row。counter 的初始化、丢失、恢复和在途请求需要单独验证；有 Redis 原子增量不等于 Redis 与 PG 的账本事务原子性。[预留 counter 写入](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L811)

## 4. Bifrost：计费覆盖在进步，OSS 准入仍是事后计量模型

### 4.1 并发和重启语义

**已证实：**稳定 HTTP 2.1.1 的预算判断比较 `CurrentUsage + baseline >= EffectiveMaxLimit`；调用前的治理检查没有把该请求最大成本加入预留。`PostLLMHook` 再异步启动 worker 计价，使用内存 CAS 增加用量。CAS 解决增量竞争丢失，不能令调用前 check 与未来计费成为原子准入。[稳定版预算判断](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/store.go#L2114)、[异步结算调用](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/main.go#L1251)

**推断例子：**剩余 1 美元时，多个请求可以在任何一个完成计费前同时通过；单请求本身也可能花费大于 1 美元。这是从 check/post-hook 顺序得出的风险，不是本次真实流量压测结果。

**已证实：**稳定版 tracker 的 worker 周期为 10 秒，内存更新定期写入数据库，正常退出会尝试最后落库；源码明确称同步和 batch 的去重是进程内 best effort，普通 billed key 的 TTL 为 5 分钟。跨进程重放、重启后的去重和异常关机前未落库增量不能据此保证。[稳定版 tracker 状态与去重](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/tracker.go#L46)、[稳定版退出落库](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/tracker.go#L367)

### 4.2 失败、未知、缓存与计费尝试

**已证实：**稳定版用 `RequestID + AttemptNumber` 区分实际调用；即使失败/取消，只要错误携带 `BilledUsage`，也能记入费用和 token。失败但有费用不增加成功请求计数。无 result、无已报告 usage/cost 的错误跳过用量更新。**推断：**比“失败全算零”更完整，但没有 usage 不证明没有上游费用，也不构成持久待核实占用。[失败部分 usage](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/main.go#L1511)、[稳定版计数条件](https://github.com/maximhq/bifrost/blob/c193745d2a713e9f58f021d43e138df5eb7e038a/plugins/governance/tracker.go#L112)

**已证实：**当前 datasheet cost 模块区分 direct cache 命中和 semantic cache：前者没有 LLM 增量费，后者计算 embedding lookup，miss 可合并主模型和 embedding 成本；Provider prompt cache 另有读写 token 计价。因此“缓存命中全部免费”也过强。该代码同时存在无 pricing 返回 nil、包装后的 `CalculateCost` 返回 0 的路径。**推断：**Nomad 必须自己保存 cost-known 状态，不能把 gateway 数值 0 无条件认定真实零费用。[缓存成本实现](https://github.com/maximhq/bifrost/blob/0ebea6091a4005f72b346923da28412268ce9325/framework/modelcatalog/datasheet/cost.go#L386)、[缺少 pricing 与零值包装](https://github.com/maximhq/bifrost/blob/0ebea6091a4005f72b346923da28412268ce9325/framework/modelcatalog/datasheet/cost.go#L599)、[包装函数](https://github.com/maximhq/bifrost/blob/0ebea6091a4005f72b346923da28412268ce9325/framework/modelcatalog/datasheet/cost.go#L19)

### 4.3 企业集群不等于线性一致的硬预算

官方明确不支持 OSS 多节点用同一 PostgreSQL config store 来达到状态同步；它的关键配置和计数加载进本机内存。共享配置文件解决的是初始配置分发，不是跨实例请求抢占额度。[官方 multinode 限制](https://docs.getbifrost.ai/deployment-guides/how-to/multinode)

官方企业 Clustering 页面写明成员维护与 gRPC counter/config 同步，并明确收敛为秒级 **eventual consistency**。另一个旧说明出现 modified RAFT 表述，两者不能混同为预算准入线性一致证明。**推断：**即使购买 Enterprise，也仍需厂商合同与故障测试证明“同一余额被两个实例同时消费”的处理；本轮没有该证据。[企业集群通信与收敛](https://docs.getbifrost.ai/enterprise/clustering#message-dedup-and-invalidation)

## 5. 资源、隐私与 Node 适配成本

| 项目 | LiteLLM | Bifrost |
| --- | --- | --- |
| 额外运行单元 | Python proxy、自己的 PG schema/migrations、共享 Redis；可复用已有基础设施但要独立账号/连接池和容量预算 | Go HTTP gateway；单实例可 SQLite，亦支持 PG；企业使用 PG 和集群网络。Redis 通常用于可选向量/语义缓存，不是 OSS 默认预算权威 |
| 官方资源资料 | 当前 production guide 建议每 worker 1 vCPU、4 GiB，连接池随 replicas×workers 累积，推荐 60 秒批量 spend writes | OSS multinode 示例给 0.5 CPU/512 MiB request、2 CPU/2 GiB limit；企业 sizing 建议至少 3 个 4 vCPU/16 GB 实例，另计 PG |
| 资源数字的意义 | 厂商生产建议，不是已测 Nomad 最低配置 | OSS 示例与企业规模建议不能混作同一场景，也不说明小型单机必须要企业资源 |
| 需要新增维护 | 升级/回滚、模型价表、Redis 故障恢复、counter/PG 对账、网关自身鉴权/健康/日志 | 升级/回滚、模块/企业版本匹配、价格目录、计数落库和集群收敛、网关鉴权/日志 |

资源来源：[LiteLLM production guide](https://docs.litellm.ai/docs/proxy/prod)、[Bifrost storage](https://docs.getbifrost.ai/deployment-guides/config-json/storage)、[Bifrost 企业 sizing](https://docs.getbifrost.ai/enterprise/moving-from-oss/sizing)。没有进行 Nomad 吞吐、内存或数据库压测，不能据宣传的 RPS/微秒开销算部署容量或成本。

两者都提供 OpenAI-compatible HTTP 或 SDK endpoint 接入。**结合本项目的迁移推断：**Node 可以保留，简单调用的 base URL 改动较小；但完整迁移仍要改凭据路径、预算主体、attempt id、错误码、取消与流式行为、真实 usage、价格版本和日志出口，并排除 adapter 与 gateway 双重重试/回退。还要使 8.3 冻结 route snapshot 和独立 pause 在每次外发继续有效。它们不天然知道 owner、Plan/Trip revision、attempt fencing、队列重投递或“同一用户任务仅扣一次额度”。AMap 及其他非模型服务仍需同一平台预算体系覆盖。因此整体成本是中至高，不能称一行迁移完成 8.4。[LiteLLM JS 接入与 spend 口径](https://docs.litellm.ai/docs/proxy/cost_tracking)、[Bifrost 官方接入](https://docs.getbifrost.ai/integrations/openai-sdk)

**隐私/保留已知能力：**LiteLLM 可关闭消息/响应内容日志而保留 spend metadata；retention cleanup 为 OSS，需显式设置，未设置不会自动清理。Bifrost 可 `disable_content_logging`，请求日志可禁用或配置保留；存储支持 SQLite/PG，另有对象存储出口。开关存在不证明所有错误、headers、callback、cache、备份和导出都已安全，且 Bifrost 不同文档的 retention 配置位置存在差异，实际部署应按固定版本 schema 和 cleaner 验证。[LiteLLM 内容脱敏](https://docs.litellm.ai/docs/proxy/logging#redact-messages-response-content)、[LiteLLM 日志清理](https://docs.litellm.ai/docs/proxy/spend_logs_deletion)、[Bifrost 内容日志](https://docs.getbifrost.ai/features/observability/default)、[Bifrost retention 说明](https://docs.getbifrost.ai/enterprise/log-exports)

**对 Nomad 的含义：**若后续引入网关，需继续执行已批准 8.1 的生产 telemetry 出口最小字段合同；不要因为网关自带 UI 就留存行程原文、精确位置或 source URL。网关 budget/cost headers 和内部错误不能直接透传至移动端。日志保留与账本可核对性、账户删除与汇总留存、缓存 TTL 与备份清理必须分别落到实际部署责任。

## 6. 可借鉴部分、待验证条件与采用判断

适合直接借鉴的是成熟合同形态：多层预算和多个计量窗口；把 user logical operation、physical attempt、token、cost、concurrency 分成独立维度；版本化模型价格；正确区分 direct cache、Provider prompt cache 和有额外 embedding 的缓存；费用未知与零分开；运营者可以看到重试成本、价格覆盖率、数据新鲜度和预留占用，而旅行者只见真实任务状态。

下一步由主 agent 定义 Nomad 合同；以下是从研究得出的**建议验收条件**，不是已批准实现：

1. 同一适用预算集合在多实例并发准入时，不能先分开 check 再异步扣费；在调用前原子保留足够的可证明上界，或诚实说明该类计费只能提供软控制及独立止损。
2. 逻辑任务额度只按既定业务规则计一次；每个可能付费的 retry/fallback attempt 独立留证和结算，重复队列/回调不能重复扣款，迟到结果仍能归于原 attempt。
3. 已知未外发可释放；可能已外发但费用未知，不能因超时、取消、worker 消失或租约过期就按零结清。并发占位释放与成本占用释放是不同决策。
4. 缺少模型价格、usage 不全、价格发生变化、缓存增量费用、跨窗口迟到结算、预算收紧后已预留/尚未外发、计量权威失联，都必须有明确状态和可核对恢复路径。
5. 若未来重评 LiteLLM，固定支持严格估价拒绝的已发布版本，验证 Redis 丢失/旧快照、PG 滞后、流取消、多模态和每次 attempt；若重评 Bifrost，先取得跨实例预算及持久去重的具体保证，再决定企业采购是否有实际价值。

**采用判断：本期不采用 LiteLLM/Bifrost 作为 Story 8.4 的预算权威或新增必需网关；保留为未来规模化候选与实现参考。** 继续在既有 Node 调用边界扩展 PG 持久预算生命周期，能复用已批准路由与 owner/job 语义，并覆盖 AMap。该建议不意味着自研一个通用网关、账务平台或大后台，也不宣称本地实现已经存在；最终合同和原型仍需本 Story 评审。
