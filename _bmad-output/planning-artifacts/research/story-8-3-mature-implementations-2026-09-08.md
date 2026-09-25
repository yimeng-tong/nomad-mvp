---
project: nomad-mvp
story: '8.3'
date: 2026-09-08
status: research-complete-selection-approved
selectionApprovedDate: 2026-09-08
delegatedAgents: 2
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.3 成熟路由与配置管理研究

## 结论

**已批准本期保留既有 Node/OpenAI-compatible adapter，用现有 PostgreSQL/Fastify/React 做
最小版本化路由配置与操作面；不新增 AI 网关或购买发布审批平台作为前置。** Unleash
保留原有普通功能开关，不同时充当第二份路由发布权威。本结论随 Story 8.3 于
2026-09-08 获批，不是实施变更或部署/采购授权；下文研究证据不因批准变成实测。

这是比较后的工程选择，并非认定自研一定更成熟：Nomad 必须自己处理任务接受时的配置
快照、业务 fencing、冻结事实、暂停和预算边界。MVP 只有已注册任务/模型的有限配置，
不需要多团队治理或任意 Provider 市场；复用既有持久化/权限/校验比部署网关后再加同样的
发布适配层更小。代价是我们确实需要实现并测试这个窄操作面，不能声称配置管理已开箱具备。

## 委派与核验

- Locke 研究 Unleash 6.7.0 SDK、8.1.0 服务端及 OSS/Enterprise 配置发布：
  `story-8-3-config-management-agent-2026-09-08.md`。
- Noether 研究 LiteLLM/Bifrost：`story-8-3-provider-gateways-agent-2026-09-08.md`。
- 主 agent 核对本地 `flags.ts`、安装包、旧 HQ/fill/ingest、Prisma/OpenAPI 与已批准 8.2；
  复核 Unleash OSS/审批、LiteLLM model management、Bifrost multinode 和 Langfuse config
  官方资料及关键源实现。子代理没有再启动嵌套代理，不影响本轮由主任务实际委派两名 agent 的记录。
- 研究包含 GitHub 固定版本/commit，详情及安全公告链接在两份报告；没有安装、登录、
  建账户、读取 secrets、运行模型、压测或部署。未验证现有服务器套餐/容量/可达性。

## 方案比较

| 方案 | 成熟能力与收益 | 仍需 Nomad 负责/成本 | 建议 |
| --- | --- | --- | --- |
| Unleash OSS | JSON variant 分发、基础 UI/角色、SDK 本地求值/备份 | 不含原生审批；payload 不验证业务 schema，SDK cache 不等于业务 LKG，仍需发布/快照/暂停协议 | 保留已有普通开关；不为 route 同时维护 PG 与可写 flag 双权威 |
| Unleash Enterprise | 草稿/审批/apply、较细权限与原生治理 | 付费且仍需 Nomad 能力/快照/安全适配；没有采购授权 | 已有许可或后来需要多人治理时再评估 |
| Unleash OSS + 受保护 Git 发布 | Git diff/history/CI 可复用，不必做完整审批 UI | 保护/审批依实际 GitHub 套餐；发布器与直接编辑旁路需治理，日常改模型要跨 Git 工具 | 可替代操作流程，但不作为本次轻后台首选 |
| LiteLLM Proxy | 多协议适配、模型组、异常策略、管理 UI 和 Redis 协调 | 新 Python 服务与 DB/Redis，部分审计/治理付费；alias/热更新不提供 Nomad CAS 发布和 job 快照 | 多家非兼容协议确有收益时优先做有界兼容验证，本期不新增 |
| Bifrost HTTP | Go、基础管理 UI、别名/有序回退，单节点可用 SQLite | OSS 多节点动态配置同步不成立，集群/细粒度治理属 Enterprise；组件版本独立 | 保留后选，不因“Go”就宣称性能/占用已适合 Nomad |
| 既有栈 + 窄配置面 | 复用 adapter/Prisma 事务、身份、校验与 React，直接满足本项目语义 | 需写配置 CRUD/版本/审计/回执，不能扩成通用平台 | **当前建议**，仅管理已登记连接，不新增运行服务 |

依据：[Unleash 比较](https://docs.getunleash.io/support/oss-comparison)、
[原生审批](https://docs.getunleash.io/concepts/change-requests)、
[LiteLLM 模型管理](https://docs.litellm.ai/docs/proxy/model_management)、
[LiteLLM 路由](https://docs.litellm.ai/docs/routing)、
[Bifrost 多节点](https://docs.getbifrost.ai/deployment-guides/how-to/multinode)。
以上采用判断是结合仓库需求的推断，不是工具性能或安全排名。

## 具体怎么保持轻量

建议仅增加有限任务配置列表、草稿编辑/检查、发布/回滚/暂停确认和版本记录，不开新项目、
新后端框架、Provider marketplace、多级审批、计费台或日志搜索。受限运营入口与用户
Settings 隔离，8.6 以后可链接它。授权复用身份，加最小服务端环境/操作权限，不能用 header stub。

现有 PostgreSQL 作为唯一权威持久化配置版本、有效指针及操作记录；worker 取得被接受任务
绑定的完整快照。Unleash 普通开关最多收紧已有可用性，不得给出另一模型路线或绕过暂停。
不复制一份可手改的路线到网关/Unleash；否则只固定 Nomad alias 不能保证在途任务实际模型不变。

生产版本引用具体 prompt/config 哈希，Langfuse 的浮动 label 不直接参与运行时发布。
[Langfuse config](https://langfuse.com/docs/prompt-management/features/config)
确实能存任意版本化 JSON，但调用代码决定如何消费，它不是 Nomad 任务路由、预算或发布器。
8.2 的实验版本可作为候选输入/评价证据，8.3 再检查并由运营明确发布。

## 实现前必须面对的边界

1. **布尔开关尚不是路由。** 本地安装 unleash-client 6.7.0。其 `initialize` 同步返回对象，
   `await initialize` 不能证明远端同步；旧 wrapper 也未转发已创建 client 的 fallback 参数。
   这些是本地源码观察，不在本轮改代码。SDK 的 ready/synchronized/cache 不能直接当 LKG
   验收，错误凭据恢复仍需按锁定版本验证。
2. **发布、传播和调用不同。** 原子更新 PG 指针后可以称已发布；worker 未加载/没有新任务
   时只能显示待验证。新接收任务必须绑定权威快照；无当前权威读则不偷偷用陈旧版本接受
   新的付费任务，已持久接受的任务可在安全控制仍有效时使用原快照。
3. **普通发布不迁移在途任务。** 接受时固定，排队也算已接受。重启/retry/fallback 沿用
   其快照；保留所需旧内容直至引用任务结束，不能仅固定一个会变的网关别名。
4. **暂停只阻止新请求。** 单独持久控制版本/有界有效期；检查后刚好发生暂停仍有传播
   窗口，要实测并可观测。已发出的调用允许按原业务合同返回，不许承诺远端撤回或免计费。
   这不是凭据泄漏后的上游撤销/丢弃结果治理，后者如需要须另定明确模式，不能暗中改语义。
5. **回滚不是清空历史。** 从历史内容创建新发布版本，重新检查当前连接/凭据/权限，不能
   解除人工暂停/熔断，不能回滚用户计划。
6. **一份总尝试预算。** 网关、SDK、队列和应用 retry 可叠乘；不能给三条路线各三次再说
   总上限三次。不同错误分类、单次/全任务期限、半流和工具幂等仍由现有业务适配负责。
   不为安全拒绝提供跨模型绕过；更贵的路线不能突破已有预算。
7. **兼容性不是勾选参数。** VLM/ASR/tools/schema 逐连接证明，不丢关键参数来换成功；
   静态检查不花模型费，真实兼容探测使用另行授权合成样本和明确上限。未实现任务不靠占位验收。

## 版本、许可和安全

两份 agent 报告记录的研究基线，不自动升级或批准部署：

| 项目 | 固定参考 |
| --- | --- |
| Unleash SDK | [v6.7.0](https://github.com/Unleash/unleash-node-sdk/tree/2c01030a97c24af4d0f642f3543946c1103871fe)，当前已安装；更新版本另行兼容检查 |
| Unleash server | [v8.1.0](https://github.com/Unleash/unleash/tree/9445b1e570e9fe1e41083c6787929cfef58a7cc3) |
| LiteLLM | [v1.100.0](https://github.com/BerriAI/litellm/tree/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4) |
| Bifrost HTTP | [transports/v2.0.0](https://github.com/maximhq/bifrost/tree/e4a30d6041c0446603aea615bc5da340dac001b1)，其 Core/Framework 编号不同 |

Unleash v8 源/npm 与官方预制镜像许可不同，不能一概沿用旧 Apache 判断；LiteLLM MIT
不覆盖 enterprise 目录，Bifrost OSS Apache 不包含商业集群/治理承诺。详见固定 LICENSE
及 [Unleash v8 升级说明](https://docs.getunleash.io/deploy/upgrading-unleash)。
不复制付费代码绕许可，不以免费 SDK 或试用界面推导生产权利；具体购买决定本轮不做。

网关 agent 还查到 LiteLLM 供应链/路由参数和 Bifrost 媒体抓取 SSRF 公告。记录这些用于
未来锁定产物、凭据边界和安全验证，并不说明所有后续版本有漏洞或没有漏洞；不能凭
公告数量选择供应商。未来接入需固定 digest/组件版本、关闭不需要的插件/客户端路线覆盖，
核验实际补丁、出站限制、日志/缓存删除和 secret handling。当前无模型质量/内存/P95 实測。

## 主审与剩余验证

配置 agent 倾向 Unleash 原生治理，网关 agent 倾向既有 Node 适配器；主审保留两种观点。
综合单人轻运营需求，提出并获批不引入新分发平台的窄 PG 配置面。它仍需要后续实际实现，
不是偷改已批准工具方向：8.1/8.2 不变，8.3 原拆分并未锁定路线的权威存储。
真实 PostgreSQL 事务、权限、崩溃恢复、传播窗口和已注册连接能力仍需后续实施验证；
若简单有限配置演变成通用多团队管理，应收缩/重新选型，不无限扩充这张 Story。
