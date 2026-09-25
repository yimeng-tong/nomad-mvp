---
project: nomad-mvp
story: '8.4'
date: 2026-09-13
status: bounded-research-for-main-agent-review
researcher: delegated-metering-ledger-agent
scope: PostgreSQL reservations and settlement, OpenMeter, short Lago comparison, AMap limits and pricing dimensions
installed: false
deployed: false
paid_calls: false
business_code_changed: false
---

# Story 8.4 用量计量与事务账本调研

## 结论

**建议采用现有 Fastify / Prisma / PostgreSQL 内的集中预算权威与持久预留账本；OpenMeter 延后作为可选的异步用量投影，Lago 本期不采用。** 这是针对 Nomad 当前范围的研究建议，尚非 Story 批准或部署结论。

- Story 8.4 要解决跨实例的调用前授权、预留和事后核对。PostgreSQL 的短事务、行锁与唯一约束可以支撑这一内部不变量；现有仓库已有可复用的事务、任务 lease 和 attempt fencing 用法。运行容量、故障恢复与完整调用覆盖率仍未实测。
- OpenMeter 已有事件计量、余额/权益、历史查询和账单能力，适合使用量事件做聚合。已核验的 entitlement value 与 v3 governance access 是访问查询；不能把一次 `hasAccess=true` 当成已经排他占住预算的许可证。若两个实例先查询再调用上游，仍需自己的原子预留。
- 成功入账、幂等重放与“上游仅执行一次”是不同保证。数据库无法和 AMap/AI HTTP 调用组成一个原子事务。超时、失联、供应商价目变动、旁路调用和共享账号外消费仍可能让实际账单超过内部估算；不得承诺完全阻止供应商账单超支。
- 高德当前公开价格以服务组月配额、流量包和具体服务 QPS 等维度管理；不能只按单个 Key 或固定“每人每天 N 次”建账。官方旧错误码仍包含日限，实际账号启用规则必须以控制台/合同核验。

研究已读 `AGENTS.md`、`CURRENT.md` 前 75 行、完整 `project-context.md`、历史 sprint 状态与 Epic 8 拆分提案。8.3 路由发布、任务快照和独立暂停保持原边界；8.4 仅内部额度与运营预算，用户不见余额/额度/重置时间。不提前交付 8.5 Telegram 或 8.6 总览。未安装工具、创建账号、连接真实供应商账号、读取密钥、部署或做付费调用。

## 证据与版本

所有外部观察日期均为 **2026-09-13**。发布版本和网页更新时间是观察事实；不意味着项目部署了这些版本。

| 对象 | 本次实际观察 | 来源与限制 |
| --- | --- | --- |
| Nomad | lockfile：Fastify `5.8.5`、Prisma/client `5.22.0`；schema 为 PostgreSQL；现行 PG 服务端版本未知 | [pnpm-lock.yaml](/home/tong123/work/nomad-mvp/pnpm-lock.yaml)、[schema.prisma](/home/tong123/work/nomad-mvp/packages/prisma/schema.prisma)。仅只读文件核对 |
| PostgreSQL 文档 | 18 系列并发控制；页面公告含 18.6（2026-08-13） | [事务隔离](https://www.postgresql.org/docs/18/transaction-iso.html)、[显式锁](https://www.postgresql.org/docs/18/explicit-locking.html)。不是升级建议 |
| Prisma 文档 | 官方 v6 档案记录 interactive transaction 从 4.7.0 GA；支持事务隔离和冲突重试 | [事务文档](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)。5.22 的实际组合仍应在实施时做真实 PG 测试 |
| OpenMeter OSS | Releases 当时标 Latest 为 `v1.0.0-beta.232`，commit `887e0ca`；发布 `2026-08-04T15:21:22Z` | [固定 release](https://github.com/openmeterio/openmeter/releases/tag/v1.0.0-beta.232)。读取 release HTML 时间与固定 tag 源码；没有运行 |
| OpenMeter 文档 | Architecture / Entitlement / API 页面更新时间 2026-08-21；Collector HA 为 2026-07-23 | 当前文档与固定 tag 分开核对；新旧 API 不应混用 |
| OpenMeter 托管 | 公开定价页显示 Cloud 转为 Konnect Metering & Billing；没有可核实的金额表 | [当前定价入口](https://openmeter.io/pricing)、[API 分代说明](https://openmeter.io/docs/api/)。没有沿用历史免费档/美元价格 |
| Lago 短对比 | 当时 Latest `v1.53.0`，commit `ba292b6`；发布 `2026-09-08T14:33:04Z` | [固定 release](https://github.com/getlago/lago/releases/tag/v1.53.0)。搜索摘要仍出现 1.47.0，已用 release 页面修正 |
| AMap | 当前 upgrade 产品定价页，新定价注明自 2025-05-20 陆续执行；无独立产品版本号 | [定价与配额](https://lbs.amap.com/upgrade)。真实账号认证、合同、QPS、账单周期边界未知 |

方法限制：只使用官方文档和上游 GitHub。部分网页直接抓取返回 403、GitHub API 匿名限额返回 403；用公开 release HTML、官方检索结果及固定 tag raw 文件补证，未绕过账号权限。没有吞吐测试、故障注入、SDK 安装或生产连通性结论。

## PostgreSQL 可行性与最小复用

### 已核验能力

PostgreSQL `FOR UPDATE` 锁住已选中的行，直到事务结束；并发修改同一行会等待或失败。Serializable 可以让成功提交的事务呈现某个串行结果，但应用必须重试 serialization failure。固定锁顺序减少多范围预算检查的死锁，不能省略错误处理。[PG 显式锁](https://www.postgresql.org/docs/18/explicit-locking.html)、[PG 事务隔离](https://www.postgresql.org/docs/18/transaction-iso.html)。

Prisma 支持短 interactive transaction。官方明确建议事务内避免网络请求，冲突或死锁可返回 `P2034`，须有界重试整个数据库事务。该重试不得包住已发送的供应商请求。[Prisma 事务](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)。

本地已有 [prisma-repository.ts](/home/tong123/work/nomad-mvp/apps/server/src/planner/prisma-repository.ts:342) 的 `$transaction` / `Prisma.sql` / `FOR UPDATE`，以及 [任务领取](/home/tong123/work/nomad-mvp/apps/server/src/planner/prisma-repository.ts:621) 的 `FOR UPDATE SKIP LOCKED`、attempt 递增和 [心跳 fencing](/home/tong123/work/nomad-mvp/apps/server/src/planner/prisma-repository.ts:330)。这些是实现习惯的复用证据，不能据此宣称新预算账本已具备。`SKIP LOCKED` 适合领取待处理任务，不应用于跳过繁忙预算行后当作有余额。

历史 [hq.ts](/home/tong123/work/nomad-mvp/apps/server/src/planner/hq.ts:375) 仍用进程内 `dailyUsage` Map，以 UTC 日期和用户键递增。它不能证明跨实例持久计量，也没有本研究要求的预留/结算语义；不能复制为 8.4 权威。前序 Story 新调用基线实施后，应从每次实际外发的共同入口扩展，保留既有 adapter 而不再造一套调用器。

### 建议的概念对象（研究设计，不是迁移文件）

| 对象 | 最小责任 |
| --- | --- |
| BudgetPolicyRevision + 当前指针 | 内部版本、适用能力/供应商账号、限额维度、窗口/时区、估算规则、有效时间、操作者与校验结果；跟 8.3 路由 release 分开 |
| BudgetBucket | 稳定的范围与窗口身份、计量单位、已结算、待结算预留、未知风险占用；策略发布不生成一套空的当前计数 |
| OperationCharge / logical operation | 以 owner + 逻辑操作稳定键幂等地承担一次内部用户操作额度；不因为 job attempt 恢复或供应商重试再次扣一次 |
| ProviderAttempt + Reservation | 每次可能产生外部消耗的真实调用、route snapshot、operation、attempt/fence、估算与价目版本、窗口、状态、上游请求引用和期限 |
| LedgerEntry / SettlementAdjustment | 预留、真实量、估算费用、未知、释放与调整的可追踪记录；重复同一事实不重复计量，补到账单不再追加一个“第二次调用” |
| ConcurrencyLease / rate state | 跨实例外发槽与请求频率控制；不等于财务预留，也不等于网络会话是否确实终止 |
| 可选 outbox | 同一 PG 事务记录待输出的最小事件，供重放到现有观测或未来 OpenMeter；投影无权回写预算余额 |

不要求引入完整复式会计、用户订阅、发票、付款、客户门户或通用账务微服务。计数、token、毫秒、字节和金额分单位保存；金额用整数最小单位或精确 Decimal，币种分开，汇率/价目版本明确，避免 JS 浮点与不明汇率混加。

### 调用前原子预留

以下是从 PG 能力推导的建议：

1. 以服务端权威时间选择窗口，解析逻辑操作与实际 provider attempt 的稳定身份。对同一幂等键内容冲突拒绝；不能仅靠“先查不存在再插入”。
2. 在一个短事务内检查 owner/账号 eligibility、job attempt fencing、8.3 独立暂停和当前有效预算版本；按固定顺序锁定适用的全局、供应商账号/能力、内部主体等 bucket。窗口行的首次创建要由唯一约束配合 upsert 处理。
3. 检查 `已结算 + 未结算预留 + 未知风险占用 + 本次新增预留 <= 当前限额`。同一笔占用只能归入一个状态项，不能在预留和未知两列重复相加。所有适用维度共同成功才插入 reservation；任一失败整体回滚。读副本/缓存不能是剩余额度的最终权威。
4. 数据库提交成功才允许调用器拿到与 attempt/fence 绑定的单次外发授权。在真正外发时使用当前频率/并发许可；排队时不长期占并发槽，旧窗口许可不能直接用于新窗口请求。
5. 外部 HTTP 在数据库事务之外执行；随后独立短事务核验 settlement 身份并更新事实。若数据库提交结果未知，先按相同幂等键查询原结果；不得新建 reservation 或直接再发一遍上游请求。

既有实现可选择“Read Committed + 明确锁住全部参与行 + 条件更新”或 Serializable；需要证明完整不变量，不能只加一个 `$transaction` 标签。PG 单库会带来全局 bucket 热点和更多写入，应测锁等待、连接池、WAL、索引与账本保留成本；本次没有可承诺的每秒调用量。高吞吐若以后需要分片/额度分配，应另证分片额度守恒，本期不预建 Redis 与 PG 双权威。

### 幂等、未知和回收

| 情况 | 建议处理 |
| --- | --- |
| HTTP 重投同一用户操作 | 返回同一逻辑操作/任务；内部用户操作额度不重扣。供应商 SDK 的隐式重试也必须识别为实际 attempt 或关闭后由统一入口编排 |
| 真正重试或 fallback | 新的 provider attempt，有新的外部消耗记录和预留；仍属于原逻辑用户操作。不能因为用户不重扣而把供应商重试费用抹掉 |
| 预留后确认尚未外发，任务撤销/过期 | 通过状态条件与 fence 取消许可并释放预留。过期旧 worker 不能继续使用许可 |
| 外发标记后进程崩溃/网络超时/中断 SSE | 保留 `outcome_unknown` / `usage_pending` 与风险占用，不能默认零成本或仅凭 TTL 全额返还；重试有重复执行风险 |
| 成功返回且有 usage | 入账实际单位量；费用可能仍按价目估算。实际单位与供应商账单金额是两种事实，不用“有 token 数”假装账单已核对 |
| 成功/失败已终态但 usage 缺失 | 结果可以真实发布，计量仍待核对；释放已证明结束的本地并发槽，财务风险占用保持，不能捆绑为一个释放动作 |
| 上游 429 / 校验失败 / 空结果 | 记录确实发生的请求与供应商码；是否计费按供应商规则/回执决定。不能把所有失败视为免费，也不把预算拒绝当成真正外发 |
| 重复 settlement / 延迟回调 | 以 attempt + 事实来源/版本去重，在同一事务更新；更完整数据使用有来源的差额调整，保留原始未知/估算证据 |
| 真实成本高于预留 | 如实记录超出与负可用额，阻止后续不符合策略的调用；不能把实际成本截断为 reservation 值 |
| 数据库/预算权威失联 | 不能从本地空 Map 或旧余额新授权付费外发。已在途调用尝试持久恢复结算；已有缓存或不外发的降级仍按业务合同使用 |
| 操作者处理悬挂项 | 只能基于实际回执/供应商账单或明确风险承担记录做受审计调整；不能提供无依据“标记为零/清空未知”操作 |

这里的外发标记只能保证本地提交顺序，不证明供应商收到。即使同步检查暂停，DB commit 与网络写出之间仍有间隙；fencing、短期许可与临发前复核可收窄重复/晚发，但不能让 HTTP 和本地事务原子化。特别是已发出的上游任务，暂停和本地 AbortSignal 都不保证撤回计费。

并发 lease 过期也不等于远端请求终止。若需要硬约束供应商在途数，须有被验证的远端最大执行期限/取消确认；否则保留不确定的在途风险，或明确采用保守容量缓冲。不能用短 TTL 回收所有槽后宣称上游并发严格不超限。

对费用未知且无法形成有限、可信上界的调用，不能标成“受硬成本上限保护”。MVP 可拒绝此类新外发、使用无外发降级，或由运营发布显式有界的风险策略；不可静默无限放行。已知 input/output 上限、最大重试数、工具/图片/缓存价目等需要纳入估算，估算不等于保证。

### 跨窗口与策略收紧

- 每条 reservation 持久保存原窗口 ID、开始/结束、时区、授权时间、价目和 policy revision；`occurredAt`、`observedAt`、`settledAt` 分开。账本不在午夜清空。
- 已外发调用的迟到 usage 归回原已确定的内部窗口；供应商账单归属可另记 provider period，差异需显示，不能按回调时间偷偷移到新日。
- 原窗口未知风险不能因新窗口开始而消失。内部滚动总预算/未结风险上限继续计入；如果业务选择把欠额带入下期，要以一次有引用的 carry/adjustment 表达，避免既留旧项又重复收费。
- 尚未外发的旧窗口预留必须在外发前重新核验窗口和当前策略；必要时原子释放旧预留并重新获取新窗口预算。长任务按每次实际调用授权，不能拿任务接受时额度无限穿越窗口。
- 8.3 的队列/在途任务保持 route snapshot；预算是每次未来外发适用的当前约束。新预算低于已结算和在途占用时，真实显示超额/剩余额度不足并停止新增授权，不改旧事实或强行释放。
- 预算收紧应重审尚未外发的预留；已外发占用继续结算。增额、恢复、回滚都创建受审计的版本/动作，不回拨 counter、不解除 8.3 独立暂停、不改用户行程。
- 窗口日期不得依赖各 Node 实例本地时钟；发布窗口/时区变更不能形成重叠的免费预算区间。具体迁移规则需要合同固定并验证 DST/跨月/迟到结算。

## OpenMeter：可借鉴能力与采用边界

### 已核验事实

OpenMeter 接收 CloudEvents，按 meter 聚合并提供 customer/subject 用量、entitlement、grant 与余额历史。主仓库把 usage metering 与订阅/账单功能放在同一产品内；这些能力说明它是成熟计量候选，不证明其等同于 Nomad 的调用前预留协议。[固定 tag README](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/README.md)、[Entitlement 文档](https://openmeter.io/docs/billing/entitlements/entitlement)。

固定 tag 架构为 API → Kafka → sink worker → ClickHouse，PG 存放事务型产品/客户/权益状态；balance worker 更新余额快照。官方明确 ingestion 与 processing 通过 Kafka 异步解耦。这意味着“事件接受成功”“聚合可查询”“余额更新完成”不能在没有一致性凭据的情况下视为同一时刻。[固定架构](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/docs/architecture.md)、[官方架构](https://openmeter.io/docs/open-source/architecture)。

v1/v2 entitlement `value` 是检查访问/余额的 API；固定 tag 的 [v3 governance handler](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/api/v3/handlers/governance/query.go) 解析查询并调用 `governanceService.QueryAccess`。本次已核验接口未提供“检查剩余值并为本次调用原子占用 N 单位”的 Nomad 预留协议；因此推荐把它视为查询能力。不是声称整个产品未来或所有 Kong 组合都不可能实现硬限制。[固定 OpenAPI](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/api/openapi.yaml)。

**去重必须说明部署条件。** 当前官方架构说通用默认关闭去重、启用时未配 Redis 则用进程内存；固定 tag quickstart 则明确 `dedupe.enabled=true`、`driver=redis`、`expiration=768h`（32 天）。因此不能无条件写“默认去重，所以跨实例/任意时间重放绝不重复”。CloudEvents 必须稳定使用 source + id，并设计超过去重保留期限的重放策略。[官方架构](https://openmeter.io/docs/open-source/architecture)、[quickstart config](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/quickstart/config.yaml)。

Collector 可持久缓冲并重试，但官方默认重试次数有限，耗尽可能丢弃，不能只“接了 SDK”就保证用量完整。Nomad 的成本事实应先在自身 PG 持久化，再投影；监测 outbox backlog、重试耗尽与缺口，不把缺失事件换成 0。[Collector HA](https://openmeter.io/docs/collectors/high-availability)。

Entitlement 支持 recurring usage period、reset 和 `preserveOverageAtReset`；历史聚合/重置有分钟粒度约束。可借鉴“历史窗口与欠额”显式建模，但不能把其 reset API 作为清空 Nomad 在途 reservation 的按钮。[Entitlement](https://openmeter.io/docs/billing/entitlements/entitlement)。

### 成本、许可证、隐私与迁移

| 方面 | 事实与对 Nomad 的判断 |
| --- | --- |
| 许可证 | 固定 tag 主仓库为 Apache-2.0；可以研究/复用，但部署包含的 Redis、Kafka 发行包、Svix 等各有独立许可，不能称整个栈都自动受 Apache-2.0 覆盖。[LICENSE](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/LICENSE) |
| 资源 | quickstart 含 API、sink/balance/billing/notification workers、jobs、Kafka、ClickHouse、PG、Redis、Svix，明显多于现有 PG 上几个实体。不是必须无裁剪地运行全部组件，但缩减组合须实测。固定 base 示例 Redis 的 50 MB 是开发配置，不是生产资源建议；没有为 Nomad 核实最低 RAM/CPU/TPS。[Compose](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/quickstart/docker-compose.yaml)、[base](https://github.com/openmeterio/openmeter/blob/v1.0.0-beta.232/docker-compose.base.yaml) |
| 运维 | 多状态系统需要备份、持久化、故障恢复、去重键容量/过期与版本迁移；快速示例含 `latest` 镜像不能直接用于可复现生产。已看到 release 持续更新及安全修复，但当前仍是 beta 标签，不能凭星数证明稳定 |
| 托管费用 | Cloud 已转 Konnect Metering & Billing；当前公开入口未给本次可核实的事件价、留存期、套餐金额。SAML/RBAC/Audit Logs 与企业 SLA 的官方宣传不等于 OSS/免费档都具备；当前套餐与合同需单独确认。[定价](https://openmeter.io/pricing)、[安全页](https://openmeter.io/security) |
| API 迁移 | 官方说明 Konnect 必须用 v3 与 v3 SDK，旧 v1/v2 面向 OSS 和现存 OpenMeter Cloud 用户。Nomad 如果以后采用，应先确定自托管/托管、固定 SDK/服务器兼容组合，不把旧代码示例直接连新云。[API](https://openmeter.io/docs/api/) |
| 数据面 | 仅投影最小内部事件：稳定非直接标识 ID、provider account reference、能力/模型、attempt、单位量、时间、policy/价目版本、未知状态。不上报原文、完整 URL、精确位置、供应商 key、手机号、Cookie 或用户行程 |
| 隐私/删除 | 官方 Subjects 文档说明 subject 是事件中的字符串，不是有 create/update/delete 生命周期的实体。删除 Customer/关联不证明底层事件已清除；需分别核实 Kafka、ClickHouse、PG、Redis、outbox、备份与云端保留/删除接口。官网 privacy 仅覆盖网站访问，不能冒充处理客户 usage 的 DPA。[Subjects](https://openmeter.io/docs/metering/subjects)、[网站隐私范围](https://openmeter.io/privacy) |

建议本期借鉴事件 ID、窗口、grant/overage、完整性监控等机制，不把 OpenMeter 设为 8.4 前置。若未来确有大量用量维度或计费产品需求，再从本地 ledger/outbox 单向回放到独立 namespace；确保重放幂等、历史事件窗口、迟到修正和删除验证。关闭投影时 PG 闸门继续有效，也不提供用户 quota portal。

## Lago 短对比

Lago 当时 release 为 `v1.53.0`（2026-09-08），主仓库 AGPL-3.0；其目标包含 usage-based billing、订阅、发票与支付。对于只需内部预算的 Nomad，域和运行栈都偏重。[release](https://github.com/getlago/lago/releases/tag/v1.53.0)、[仓库](https://github.com/getlago/lago)。

官方事件文档区分 idempotency、迟到事件、PG 与 ClickHouse 流水线的处理差异；稳定 transaction ID 和 subscription 归属是重要借鉴，不能当成供应商 HTTP exactly-once。文档还说明迟到事件与已完成发票的归属限制；账单系统的窗口模型不能直接替代内部 reservation。[Ingest usage](https://getlago.com/docs/guide/events/ingesting-usage)。

自托管兼容矩阵涉及 PG、Redis/Valkey，analytics/streaming 另涉及 ClickHouse/Redpanda；没有核实 Nomad 的生产资源下限、Premium 价格或所有权限/留存的开源边界。官方当前 usage 调试入口可显示事件完整 JSON/IP，若以后接入必须源头最小化并核实保留/删除。部署 AGPL 产品前应按实际使用方式审查许可，不把“能自托管”理解成不用履行许可义务。[兼容矩阵](https://getlago.com/docs/guide/lago-self-hosted/compatibility-matrix)、[Retrieve usage](https://getlago.com/docs/guide/events/retrieve-usage)。

**本期不采用 Lago**；不创建客户/订阅/发票/支付模型，不以它扩展用户额度 UI。以后如产品真的出现收费账单需求，另作版本、许可、Premium、资源和删除流程的正式验证。

## AMap：当前配额与计费建模

### 当前公开口径

以下为 2026-09-13 官方产品定价页面观察值，**不是 Nomad 实际账号配额**。公开表区分个人认证、企业认证、企业技术服务许可；免费月配额资格与期限有条件，应由账号实际权益核实。[当前定价](https://lbs.amap.com/upgrade)。

| 服务组（只列 Nomad 相关） | 公开基础价格 | 公开月配额：个人 / 企业 / 技术服务许可 |
| --- | --- | --- |
| 基础 LBS：路径规划、距离、地理/逆地理编码等 | 30 元 / 万次 | 150,000 / 3,000,000 / 9,000,000 |
| 基础搜索：关键字、周边、多边形、ID、输入提示 | 30 元 / 万次 | 5,000 / 50,000 / 500,000 |
| 其它基础服务：天气 | 30 元 / 万次 | 5,000 / 5,000 / 9,000,000 |
| 基础地图定位：JS 图面初始化 / Android 在线定位 | 3 元 / 万次 | 1,500,000 / 30,000,000 / 90,000,000 |

公开页面还说明：先消耗月配额，超出可购买流量包；流量包有效期列为一年。基础 LBS/地图定位有用量折扣，基础搜索/其它基础服务不享受该折扣。QPS 单独按服务提升，**账号下所有 Key 共用该服务 QPS**，公开区间为 400–1500 元/月/10 QPS。不得据此自动购买、假定套餐或承诺现金费用为固定乘法。[定价/配额/QPS](https://lbs.amap.com/upgrade)。

服务组月配额可跨 API、JS、Android、iOS、微信小程序共享；“每个 Key 一个满额 budget”会漏算共享账号消耗。实际业务若有前端地图请求、其他应用、测试环境或运营脚本共用该账号，也会消耗平台账单而绕过 Node adapter。

Web 服务流量页（页内更新时间 2024-07-15）直接要求跳到当前产品定价查基础配额，并到控制台看 QPS；不能用 2023 年 JS API 的旧日配额示例给服务端设置现行值。[Web 流量说明](https://lbs.amap.com/api/webservice/guide/tools/flowlevel)。

同时，官方错误码页（页内更新时间 2022-10-12）仍列服务总 QPS、Key QPS、账号 QPS、日访问量和账号日调用量超限。月计费口径不能推出“所有日限已经消失”。实现应保留 `10003`、`10019/10020/10021`、`10044` 等返回码及范围，并核对实际账号规则；不把全部错误重命名为普通 HTTP 429。[错误码](https://lbs.amap.com/api/webservice/guide/tools/info)。

### 对 8.4 的建议

- 建立 `providerAccountRef → keyRef → API capability → billing service group` 映射。reference 不是密钥；同一账号所有 Nomad 实例和适用渠道共享对应范围。服务 QPS、Key 附加约束、月服务组用量、内部并发数分开。
- 每个实际外发请求保存次数/能力/请求时间与结果，业务内部多页搜索、批量/多段路线和重试不要伪装成一次供应商请求。实际“计费单位”是否等于单次 HTTP、哪些失败请求收费、批量端点如何计量，本次公开页未充分确认，应按目标接口/控制台补证。
- 缓存命中且未外发应记录 cache/use 事实，不产生 AMap 外发费；不能因为用户一次操作只扣一次内部额度，就少记它引起的多次 AMap 消耗。
- 公开价格仅用于有版本的估算，流量包抵扣、资格、折扣、许可费、QPS 包费和实际账单单独记录。免费剩余额度没有真实证据时，不推定请求成本为零；现金增量成本未知与公开标价估算可同时存在。
- 用当前账号/合同真实配额建立安全余量，并记录控制台核对时间和覆盖率。Node 内部账本只能控制经统一入口授权的请求；账号外消费、前端直连或 key 泄露不能由 PG 账本完全阻止。
- QPS 是单位时间请求率，不是未完成请求总数；内部并发 lease 独立于高德 QPS 许可。供应商限流仍可能发生，按既有退避/缓存/降级处理；本期只产出真实策略与计量事实，不实现 8.5 消息告警。

### 实施前必须补证的真实账号项

账号认证/技术许可与使用目的、Key 所属应用和服务类别、共享消费者、服务组额度及到期、实际 QPS/日限、窗口时区与 reset 时间、流量包/折扣/可能的应急额度、失败与批量调用计费规则、账单/用量导出能力和数据延迟。无这些证据可完成本 Story 设计，但不能验收“已与供应商实际账单一致”。本次没有登录控制台或产生账单。

## 建议交给主代理的合同验证点

以下是实施验证输入，非正式 GWT、不是本轮已通过的测试：

1. 两个/多个真实 PG 连接同时争用最后一份预算，最多一份新增授权；多个 bucket 一处不足全部不占用。覆盖首次建窗口行、死锁/Serializable retry、连接丢失后的提交结果查询。
2. 同一用户操作重投/任务恢复不重复计用户操作额度；实际 provider retry/fallback 全部独立计量，SDK 隐式重试不漏账。
3. 在预留前后、外发标记后、上游接收后、结算提交前后逐点故障：既不释放未知为零，也不重复发出或双倍结算。
4. 真正运行在旧 worker 上的 attempt 过期后不能新获授权；lease 超时不被当成上游取消证明。成功结果且 usage 缺失时可分开处理产品结果和成本待核对。
5. 月/日边界、迟到结果、跨月长任务、时区变更、策略收紧/回滚都不重置账本、不漂移旧窗口、不丢未决费用；queued task 保持 8.3 route snapshot。
6. 真实费用超过预留如实记差额并影响后续授权；币种、精确金额、估算价目、供应商核对金额和 unknown 不混为一列。
7. 数据库/投影/观测故障分别验证：预算失联阻止新付费授权，已有缓存降级可用，OpenMeter/outbox 故障不能回写业务与预算事实。
8. 运营查询必须直接可用，明确已结算/估算/在途/未知及数据时间；内部用户维度可审计但不在用户 Settings、任务 payload 或分析事件泄漏额度与身份。
9. 真实 PG migration、并发测试和对应调用入口覆盖检查通过后，再以获授权、受控的供应商验证核对 request/usage/费用与限流。文档调研或原型通过不能替代这些实施证据。

本报告仅新增这一份研究文件；业务代码、OpenAPI、Prisma、正式 GWT、CURRENT 与 sprint YAML 均未由本研究代理修改。
