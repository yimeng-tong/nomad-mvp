---
project: nomad-mvp
story: '8.4'
date: 2026-09-13
status: research-complete-selection-approved
delegatedAgents: 2
selectionApproved: true
selectionApprovedDate: 2026-09-13
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.4 成熟预算与计量方案研究

## 本次建议

2026-09-13 用户澄清：运营界面只需桌面 Web；预算上限、计算成本、已核对扣费及
上游余额的来源另见 [金额来源补充](story-8-4-amount-sources-2026-09-13.md)。未核验
生产连接的账单/余额能力，不能把它们视为默认可得。用户随后批准采用方向、金额来源
补充和26条GWT并授权进入8.5；研究证据不因批准而成为运行验收。

**建议在既有 Node/Fastify/Prisma/PostgreSQL 中实现一份预算权威，配合小型内部策略和
用量核对页面。** 借鉴成熟产品的预留、计价、窗口和明细模式，本期不增加网关或独立
计费服务。此方向已随8.4获批，保持8.3已批准的路由选择，不代表账本已经实现。

选择依据是 Nomad 的具体业务边界：同一用户任务只计一次产品次数，每次真实 Provider
attempt 独立计成本；超时仍可能付费；多实例要一起竞争同一份可用额度；AMap 和导出
也需纳入相应维度。以上责任即使增加网关仍需 Nomad 处理。复用 PG 可以让 Job、预留、
fencing 和回执共享事务边界，减少双写，但代价是需要自己写并验证这段领域逻辑。

## 委派、当前基线和核验

- [网关预算报告](story-8-4-gateway-budget-agent-report-2026-09-13.md)：LiteLLM、Bifrost，
  包括官方文档、稳定版/开发分支源码、许可证、付费边界、资源和未知费用处理。
- [计量账本报告](story-8-4-metering-ledger-agent-report-2026-09-13.md)：PG/Prisma、
  OpenMeter、简短 Lago 对比及 AMap 当前配额/QPS/收费维度。
- 主 agent 复核本地旧 HQ 的内存计数、Fastify 注册、已批准 8.3 与 FR38；仓库 staging
  compose 使用 postgres:15-alpine，实际服务器版本未检查。未把 PG18 文档当成升级要求；
  所需锁语义另按 [PG15 官方文档](https://www.postgresql.org/docs/15/explicit-locking.html)复核。
- 主 agent 另读 LiteLLM 固定稳定版/main 的同一预算函数，复核下面的临界值推导；
  打开 Bifrost 官方多节点说明、OpenMeter 架构和固定 tag QueryAccess handler，以及高德
  当前定价页。先前 8.3 的旧版本结论没有直接复制成今天的能力判断。
- 本轮为公开资料与本地只读核查；子代理的 LiteLLM 单函数离线检查未启动网关或外部请求。
  没有服务安装、账户创建、采购、生产配置变更、供应商调用或运行时压测。

## 对比与采用边界

| 方案 | 可复用的成熟能力 | Nomad 仍需承担的工作/限制 | 本期建议 |
| --- | --- | --- | --- |
| 既有 Node + PG | 现有事务、行锁、唯一约束、任务 attempt/fencing、身份/配置界面模式 | 预算状态机、计价、对账、调用覆盖与多实例/失联测试必须实现；全局预算行有写热点 | 采用窄领域实现；数据库是权威，缓存/遥测只是投影 |
| LiteLLM | 成本目录、层级预算、预留、RPM/TPM/并发、运营 UI | 稳定版缩额放行；严格模式依版本；缺价/某些模态/batch、取消、未知费用及业务名额仍需适配；额外 Python/PG/Redis | 不作新增前置，保留未来候选 |
| Bifrost | Go 网关、预算/用量 UI、Provider/model 计价、带 usage 的失败记录 | 已核验 OSS 先查当前用量再异步计费；内存去重/落库窗口；多节点治理需企业方案且仍需一致性证明 | 不作预算权威；按需借鉴明细和计价区分 |
| OpenMeter | 事件聚合、权益/余额、窗口、历史及迟到事件 | 已核验 QueryAccess 不是本次请求的原子预留；Kafka/ClickHouse/PG/Redis 等增加运行面；去重有部署和时间条件 | 后续若有规模收益，可从 PG 单向投影，本期延后 |
| Lago | 用量计费、事件幂等、账单/订阅/发票 | 超出内部预算目标；额外栈及 AGPL/商业边界，不能替代请求前预留 | 本期不采用，不创建收费域 |

许可证记录：LiteLLM enterprise 以外为 MIT、企业目录独立许可；Bifrost/OpenMeter
主仓库 Apache-2.0；Lago 主仓库 AGPL-3.0。各依赖和企业能力须按选定发行物另核实。
LiteLLM 细粒度治理/部分预算范围、Bifrost cluster/RBAC/audit 有付费边界；OpenMeter
Cloud 已转 Konnect Metering & Billing，当前金额/权限套餐未核实。许可/功能证据和
固定版本链接详见两份报告，不以“开源”推断所有运营功能免费。

## 关键事实一：预留存在不等于最大成本会被拒绝

截至本次观察，LiteLLM 官方说明预留默认开启，严格失联保护默认关闭，并明确 batch
无法完整估价、部分无 token 价的图像/音频不能预留。
[官方预算文档](https://docs.litellm.ai/docs/proxy/users#budget-reservation)

但固定稳定版 v1.100.1（2026-09-10，commit 1dba17b）的函数在还有正余额时，会把
预留缩到剩余值。假设限额 100、已用 99、最大估价 3，预增后的值为 102；其公式算出
剩余 1，于是只留 1 并继续。若随后实际费用为 3，内部累计可到 102。这是源码与离线
单函数检查支持的反例，不是部署压测。
[固定稳定版函数](https://github.com/BerriAI/litellm/blob/1dba17b10ded12ad0021edb453ba2c54e4637928/litellm/proxy/spend_tracking/budget_reservation.py#L115)

9 月 12 日 main 快照增加 strict 拒绝分支，普通模式仍缩额。开发分支的改进不能算作
稳定发行能力，也不能证明所有模态或取消/重试情况已经满足 Nomad。
[固定 main 函数](https://github.com/BerriAI/litellm/blob/1c61c2606e36061db4fce10f7bb94745d76bc84f/litellm/proxy/spend_tracking/budget_reservation.py#L118)

**合同推导：** 8.4 要求足额、可执行上界的原子预留；缺价或无法形成可靠上界时不发出
该新付费请求。不能只看“当前已用还没超限”，也不能以缩小数字代替限制真实消耗。

## 关键事实二：共享数据库不自动形成共享预算

Bifrost 官方明确 OSS 多节点共用 PG config store 不受支持，关键配置/预算/计数保存在
实例内存。企业页面的同步保证也需要按具体部署验证，不能靠“有 cluster”推导线性一致。
[多节点文档](https://docs.getbifrost.ai/deployment-guides/how-to/multinode)、
[企业集群说明](https://docs.getbifrost.ai/enterprise/clustering#message-dedup-and-invalidation)

OpenMeter 固定 tag v1.0.0-beta.232（2026-08-04）的 handler 调用 QueryAccess；
异步事件处理与余额查询不等于把此次 N 单位原子占住。通用去重配置和 quickstart
Redis/32 天设置不同，重放期限仍有边界。
[固定 handler](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/api/v3/handlers/governance/query.go#L63)、
[架构](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/docs/architecture.md)、
[quickstart 去重配置](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/quickstart/config.yaml)

**合同推导：** 不用采样 trace、异步聚合或普通缓存余额决定最后一份额度。所有适用
范围需在同一权威事务中核验/预留，处理空窗口并发创建、唯一键、死锁和提交结果未知。
锁住的只是本地授权；外部 HTTP 不在事务内，仍要持久派发意图与费用未知恢复。

## 关键事实三：AMap 不是单 Key 的固定日次数

高德当前公开定价涉及按服务组的月配额/流量包及独立服务 QPS，账号下多个 Key 可共享
相关限制。Web 流量页指向当前价格与控制台；旧错误码仍列账号/Key QPS 与日限。
因此月计费不能推出所有日限消失，原来的“60 searches/hour”只是 Nomad 内部起始策略。
[当前定价](https://lbs.amap.com/upgrade)、
[Web 流量说明](https://lbs.amap.com/api/webservice/guide/tools/flowlevel)、
[官方错误码](https://lbs.amap.com/api/webservice/guide/tools/info)

**合同推导：** 以已注册计费账户、API 能力/服务组、实际窗口和单位建模；按真实端点
规则区分一次用户操作、多次 HTTP 和收费单位。套餐、免费余量、失败/批量收费、窗口
时区与共享账号外消费仍需真实账号核验。没有这类证据，不把调用标价或余额说成账单事实。

## 8.4 的最小工程形状（设计建议）

| 必要职责 | 限定范围 |
| --- | --- |
| Policy revision / active pointer / operation receipt | 延用受限运营权限和 CAS 发布模式；独立预算版本，不能修改 8.3 路由 |
| Product usage grant | 原逻辑 Job 接受时计一次；平台失败/重复恢复的返还只发生一次 |
| Budget bucket + reservation + attempt | 按 scope/window 的适用多维度一起占用；每个真实 attempt 的上界、发送意图和 fencing |
| Settlement / adjustment | 确认、暂估、未发出、在途/未知互斥汇总；迟到/重复事实幂等补差，不删除旧证据 |
| Rate / concurrency state | 请求速率、活跃 Job 和外发 attempt 分开；队列不占外发槽，过期 worker 不重获旧许可 |
| 小型内部 UI | 编辑/检查/发布、用量事实、受限明细/核对与恢复；8.6 可后续链接，8.5 后续消费稳定事件 |

PG 的锁与事务可以支撑内部授权原子性，但全局 bucket 会成为热点。须实测连接池、
锁等待、WAL、索引、记录增长与保留/清理成本；没有本轮可承诺的 TPS、CPU 或 RAM 下限。
未来若分片，需另证明额度守恒；本期不先造 Redis 与 PG 两套预算权威。

不引入完整复式会计、计费订阅或通用运营后台。所有个人关联均最小化，用户正文/地点/
路线、secret 不进账本或第三方费用 UI；7.5 的清理登记要覆盖新增个人关联，保留必要
非识别平台聚合不等于无限期保留个人消费轨迹。第三方投影若以后采用，其事件、缓存、
数据库、备份和导出各自需要真实删除/保留验证。

## 交付必须保留的未知项

- 实施时前序 Story 的完整调用入口、实际模型/模态/工具收费项及可约束最大成本。
- 部署 PG/Prisma/worker 组合的并发与崩溃恢复；供应商已发送请求无法由本地事务撤回。
- 真实账号套餐、计价/窗口、共享流量和对账 API；系统外消费或价格误差可能形成差额。
- 产品次数的各类终态/返还规则、生产阈值、租约/传播期限及未知费用保守结转规则。
- 实际权限、UI 无数据/失联/冲突/对账、用户 payload 不泄漏额度、7.5 清理与保留。

**可证明的目标是受控流量的准入与记录一致，不承诺供应商总账永远不会超过估算。**
发现超额如实记差，影响后续准入；没有证据不允许“清零未知”恢复调用。

本次产出的 [26 条已批准 GWT 和基础视觉材料](../story-8-4-review-2026-09-13.md)已经把这些
边界列入设计。批准只确认规划方向；真正交付仍需真实 PG、多实例故障验证、获授权
的有界供应商调用与 UI 证据。当前不改代码、API、Prisma或历史Sprint；8.5准备已获授权，详细合同另行评审。
