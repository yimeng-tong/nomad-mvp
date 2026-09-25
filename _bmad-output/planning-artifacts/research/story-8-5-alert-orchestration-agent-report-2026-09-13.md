---
project: nomad-mvp
story: '8.5'
date: 2026-09-13
status: bounded-research-for-main-agent-review
researcher: delegated-alert-orchestration-agent
scope: Alertmanager, existing Sentry and Langfuse alert orchestration
installed: false
deployed: false
messages_sent: false
credentials_read: false
business_code_changed: false
---

# Story 8.5 告警编排成熟方案调研

## 建议

**本期复用既有 Node / PostgreSQL 维护业务 incident、聚合/冷却和持久 outbox，复用 8.1 的 Sentry/Langfuse 排障关联；不把新部署 Alertmanager、升级 Langfuse 或引入通用 on-call 平台作为 Story 8.5 的前置。** 若实施时已有受运营的 Alertmanager，可评估让它承接唯一通知出口，但仍不能省掉 Nomad 的业务事实、恢复判定和投递核验合同。

Alertmanager 的分组、silence、inhibition 和 Telegram 原生 receiver 已成熟，值得借鉴。它并不知道 Nomad 某次调用是否已经用完重试、缓存和回退路径；Sentry issue 状态、Langfuse 指标状态也不能代替这个判断。三者都不能仅凭“接了一个告警 webhook”自动满足 owner/attempt fencing、跨重启 incident、恢复顺序与投递结果未知的完整合同。

本研究已读 Epic 8 拆分中的 8.5 边界、`docs/architecture/observability.md` 的 Alerts 及 `docs/ops/rate-limits.md`。主代理已转达用户批准 8.4 并授权进入 8.5；研究时源文件处于同步中，旧 frontmatter 不是重新请求 8.4 批准的理由。范围限定 AI/AMap 需运营处理的终态和配置的持续异常阈值；不包括用户额度通知、评测发现自动告警、8.6 总览或通用值班平台。

## 观察版本与八组核心来源

所有外部观察日期：**2026-09-13**。官方公开页面与固定 tag 是研究证据，未安装、运行或登录任何服务。

| 来源组 | 核心官方来源 | 本次用途 |
| --- | --- | --- |
| A1 | [Alertmanager 概念](https://prometheus.io/docs/alerting/latest/alertmanager/) | 分组、抑制、静默与接收器职责 |
| A2 | [Alertmanager 配置](https://prometheus.io/docs/alerting/latest/configuration/) | `group_wait` / `group_interval` / `repeat_interval`、静默时间窗、Telegram 原生配置 |
| A3 | [Alertmanager HA](https://prometheus.io/docs/alerting/latest/high_availability/) | gossip、通知日志、分区时允许重复 |
| A4 | [Alertmanager Alerts API](https://prometheus.io/docs/alerting/latest/alerts_api/) | 客户端重发、自动到期、恢复重发职责 |
| S1 | [Sentry Alerts](https://docs.sentry.io/product/alerts/)、[Node fingerprinting](https://docs.sentry.io/platforms/javascript/guides/node/enriching-events/fingerprinting/) | issue 分组与当前告警模型 |
| S2 | [Sentry Pricing](https://sentry.io/pricing/)、[Self-hosted](https://develop.sentry.dev/self-hosted/) | 免费/付费、权限与自托管成本/许可证边界 |
| L1 | [Langfuse Alerts](https://langfuse.com/docs/observability/features/alerts) | 当前 v4 指标告警、恢复、重复、缺数据和自动停用 |
| V1 | 下表的固定 GitHub releases / LICENSE / 最小相关源码 | 版本、许可证与关键持久性语义交叉核验 |

| 对象 | 2026-09-13 观察版本 | 运行状态 |
| --- | --- | --- |
| Alertmanager | Latest `v0.34.0`，发布 `2026-08-16T17:01:28Z`；[release](https://github.com/prometheus/alertmanager/releases/tag/v0.34.0) | Nomad 是否已有实例未知；未创建 |
| Sentry self-hosted | Latest `26.8.0`，发布 `2026-08-17T12:48:38Z`；[release](https://github.com/getsentry/self-hosted/releases/tag/26.8.0) | 实际 Sentry hosting/版本/套餐仍未知 |
| Langfuse server | Latest `v4.35.0`，发布 `2026-09-11T12:39:21Z`；[release](https://github.com/langfuse/langfuse/releases/tag/v4.35.0) | 实际服务端是否 v4 未核验 |
| Nomad 已锁 SDK | `@sentry/node 8.55.0`、`langfuse 3.38.6` | [lockfile](/home/tong123/work/nomad-mvp/pnpm-lock.yaml) 只证明依赖，不证明服务端能力或连通性 |

发布时刻由 GitHub release HTML 的 `relative-time datetime` 核对；不是搜索摘要推断。Sentry 若干文档在 web 工具报告 `text/markdown` 不支持，改用同一官方 URL 只读抓取正文。没有用社区旧帖子覆盖现行文档；尤其旧“Langfuse 只有 prompt webhook、没有指标告警”的结论已不适用当前 v4 文档。

## 对照

| 需求 | Alertmanager | 既有 Sentry | 既有 Langfuse | Nomad 仍须提供 |
| --- | --- | --- | --- | --- |
| 相同问题合并 | 相同 labels 去重、配置 group_by 聚合 | 相同 fingerprint 合并 issue，可自定义 | 依配置指标/过滤器形成 alert | 稳定环境/Provider/能力/错误指纹，真实去重事件数 |
| 降噪/冷却 | 三种时间参数、silence、inhibition、mute interval | issue-state trigger、过滤器、启停与集成；具体运行版本的重复规则须核验 | renotify 默认关闭，可定期间隔；severity transition 通知 | 跨重启 cooldown、阈值窗口与批次去重，不把传输重投当新失败 |
| 恢复通知 | 原生 `send_resolved`，Telegram 默认 true | 可消费 issue 状态触发；issue resolved 不等于上游健康 | WARNING/ALERT→OK 触发恢复 | 同一故障周期的权威恢复证据、episode/version 与顺序 fencing |
| 静默期间真实状态 | silence/mute 抑制通知，不自动删除问题 | 可停用 Alert；不要等同于业务 pause/恢复 | Pause 跳过评估，区别于“只静默通知” | mute 仅影响通知，继续计数与评估；期满只评估当前态 |
| 耗尽重试/回退 | 不认识业务调用预算和缓存结果 | 错误事件/issue 本身不知道完整业务结果 | observation/score 聚合本身不知道完整业务结果 | 统一调用器完成 retry/fallback accounting 后发出合格事实 |
| 跨重启与多实例 | nflog/silence 持久快照与 HA gossip；active alerts 需重送；分区可重复 | 供应商平台状态，不能与业务事务原子提交 | 供应商平台 alert/automation 状态，不能与业务事务原子提交 | PG incident/outbox/attempt receipt，单次领取和恢复 |
| 原生 Telegram | 有 | 当前已查动作列表未证明内置 Telegram；可用 webhook 但须单独适配 | 当前列 Slack/Webhook/GitHub Actions，无原生 Telegram 列项 | 唯一通知出口、脱敏模板、结果未知与可查询投递尝试 |

表中的能力来自 A1–A4、S1 和 L1；“Nomad 仍须提供”是针对项目合同的设计推断，不是声称这些产品无法通过额外定制完成。

## Alertmanager：值得复用，但不是业务 incident 数据库

### 原生成熟能力

`group_by` 决定相似告警合为一个通知；`group_wait` 等待首批，`group_interval` 控制组变化检查和后续通知，`repeat_interval` 控制无变化时重发。后者要与组间隔、数据保留期一起理解，不能直接当任意长的持久 cooldown；文档明确 repeat 大于 retention 时会在 retention 结束重复。silence 用 matcher 和起止时间；inhibition 由另一个已 firing 的告警抑制通知。这里的等待/聚合不等于业务端持续异常阈值。[A1](https://prometheus.io/docs/alerting/latest/alertmanager/)、[A2](https://prometheus.io/docs/alerting/latest/configuration/)。

原生 `telegram_configs` 支持 bot token/file、chat ID/file、topic thread、message template、parse mode 与 HTTP 客户端。`send_resolved` 默认 true。源码对过长消息可能截断或以 fallback 替代；因此即使选原生 receiver，仍需先设计有界模板，确保稳定错误码、时间和关联号不会被静默丢掉。[Telegram 配置](https://prometheus.io/docs/alerting/latest/configuration/#telegram_config)、[固定 notifier](https://github.com/prometheus/alertmanager/blob/v0.34.0/notify/telegram/telegram.go)。

### 不能直接宣称已满足的保证

1. **业务终态**：传给 Alertmanager 的应是已经确认需运营处理的 incident 视图，不能让每个原始 429/初次超时发成 alert 后再用 `group_wait` 猜是否已回退成功。
2. **持久性**：固定 [mem provider](https://github.com/prometheus/alertmanager/blob/v0.34.0/provider/mem/mem.go) 明确 active alerts 不持久；[启动参数](https://github.com/prometheus/alertmanager/blob/v0.34.0/cmd/alertmanager/main.go) 的 nflog/silence 默认 retention 120 小时、快照维护间隔 15 分钟。持久 volume 和正常恢复很有价值，但不等于每条业务 incident/outbox 的数据库事务式回执。
3. **客户端责任与假恢复**：Alerts API 要求定期重送 firing，并在恢复后继续重送 resolved 一段时间（官方建议最多 5 分钟）来覆盖重启。`endsAt` 到期自动 resolved；若没提供则由 `resolve_timeout` 填充。因此 publisher 断网/进程死掉可能导致自动 resolved，不能作为“供应商已恢复”的产品证据。[A4](https://prometheus.io/docs/alerting/latest/alerts_api/)。
4. **HA 与重复**：gossip 同步 silence/nflog，为最终一致；网络分区采用 fail-open，宁可重复通知。不能把 HA 解释为 exactly-once，也不能把文档的 at-least-once 设计目标扩大成 Telegram 不可达时仍保证最终收件。[A3](https://prometheus.io/docs/alerting/latest/high_availability/)。
5. **投递证据**：固定 Telegram notifier 成功后仅在 debug 日志记录 message/chat ID；并未给 Nomad 返回可查询的业务 DeliveryReceipt。向 Alertmanager POST 成功只证明告警被接收，不能写成“Telegram 已收到”。供应商受理后响应丢失的重试仍可能重复。[固定 notifier](https://github.com/prometheus/alertmanager/blob/v0.34.0/notify/telegram/telegram.go)。
6. **乱序**：labels 指纹没有 Nomad 的 episode/sequence 合同；旧 resolved 与新 firing 的竞争必须由业务状态版本处理。把动态 job ID、trace ID、计数或时间放进 labels 会分裂指纹；动态上下文应是有界 annotation，不能放私人用户内容。

这些缺口不是部署 Alertmanager 的否决理由，而是说明本项目新增一个通知组件后，仍要维护 PG 合格事实、publisher/replay 与投递观察。若目前只有少量 AI/AMap incident，一个 Node worker 和窄内部查询往往更小；这是架构适配判断，未做性能 benchmark。

### 许可证、资源、隐私

Alertmanager `v0.34.0` 为 [Apache-2.0](https://github.com/prometheus/alertmanager/blob/v0.34.0/LICENSE)，上述能力未见开源付费门槛。它可作为独立 Go 服务接受客户端告警，不必为“接 Telegram”同时新建 Prometheus，但直接 API producer 要承担 A4 的恢复重发职责。新服务增加进程、持久磁盘、配置/secret 生命周期、HA 网络与监测成本；本次未核实 Nomad 所需 RAM/CPU/TPS，不给虚构最低规格。

labels、annotations、silence 注释、模板和通知会形成新增数据面。只允许批准的运营字段；chat ID 也按项目 secret-backed 配置处理。源码 debug 行会记录 chat ID，需结合实际日志级别和脱敏核验，不能因 token 标记为 secret 就宣称全部出口安全。数据保留还涉及快照、日志、备份与 Telegram 副本；删除本地 silence/incident 不等于撤回外部消息。

## Sentry：保留排障关联与现成规则，不把 issue 解决当业务恢复

现行 Sentry Alerts 为组织级规则，以项目/Monitor 为来源、环境为过滤范围，触发器依 issue 状态，动作可通知、调用 webhook 或创建工单。Sentry fingerprint 会把相同事件归同一个 issue，适合把环境、Provider、能力和稳定错误码纳入经过脱敏的分组维度；关联 ID 可放安全上下文，不要让每次调用生成新 issue。[Sentry Alerts](https://docs.sentry.io/product/alerts/)、[fingerprinting](https://docs.sentry.io/platforms/javascript/guides/node/enriching-events/fingerprinting/)。

**适合复用**：从已获批准的 8.1 安全事件进入现有 issue/trace 排障；对“通知投递持续失败”等独立运维问题保留可见记录和查询。如果使用现成告警规则，要实际核验当前组织的动作权限、冷却/重复规则与运行历史，不能拿多年前 issue alert 的 Action Interval 默认值替代当前 Alerts 模型。

**不能直接覆盖**：Sentry 的 issue 合并不等于同一逻辑终态事件幂等；人工 resolved、忽略、暂停规则或事件配额/采样丢失都不证明 Provider 恢复。现有观测是可丢/有采样的出口，不能成为重试预算、异常总数、业务恢复或 Telegram 成功的唯一权威。为了把它提升为权威而发送更多私人内容，也不符合 8.1 合同。

免费/收费边界：当前公开 Developer 为 $0、单用户、邮件通知；Team 的公开年付展示为 $26/月，并列 API/第三方集成；Business 为 $80/月，更多配额/治理。实际订阅、来源支持与总费用未知，不能承诺免费账号支持目标 webhook。无需为 8.5 购买升级。[Pricing](https://sentry.io/pricing/)。

自托管 Sentry 当前源码为 [FSL-1.1-Apache-2.0](https://github.com/getsentry/sentry/blob/26.8.0/LICENSE.md)，不应一概叫无条件 MIT/Apache 开源。官方自托管文档称没有 SaaS 付费层，但有功能差异；最低资源列 4 CPU、16 GB RAM + 16 GB swap、20 GB 空闲磁盘，并推荐 32 GB RAM。为了一个通知通道新起整套 Sentry 不合适；既有实例复用的增量成本需看事件量。[Self-hosted](https://develop.sentry.dev/self-hosted/)。

本期仅使用 8.1 已批准的脱敏数据和受保护排障入口；不发原始异常字符串/完整 URL，不开启 Replay，不增私人 spool。实际项目访问、留存、删除与套餐验证仍是 8.1 实施事项，不能因为当前网页支持某功能就认定 Nomad 已配置。

## Langfuse：v4 已有告警，能力与默认值必须重新认识

当前官方文档确认 **Cloud 全套餐与 self-hosted v4+ 有指标 Alerts**，并非只支持 prompt webhook。可基于 Observation/Score 的指标、过滤器、时间窗判断阈值；severity 变化发通知，WARNING/ALERT→OK 发恢复，持续状态可按 renotify 周期重发。支持 Slack、HMAC 签名 webhook 和 GitHub Actions；当前通道表没有 Telegram。[Alerts](https://langfuse.com/docs/observability/features/alerts)。

特别需要核验的三个行为：

- no-data 默认把缺数据视为 0；Nomad 必须选保留前态或明确 NO_DATA 等符合“缺数据不算恢复”的策略，不能采用默认值制造假恢复。
- Pause 会停止评估；这不等同于 Story 8.5 只静默发送但继续记录/判断。
- 连续 5 次 automation delivery failure 后会停用 trigger；停用状态和恢复重启必须可见，不能假定 webhook 一直自动重试。[同一官方 Alerts 合同](https://langfuse.com/docs/observability/features/alerts)。

文档的 Cloud 每组织告警数为 Hobby 2、Core 20、Pro 50、Enterprise 100，self-hosted v4 无此数量上限。固定 `v4.35.0` [LICENSE](https://github.com/langfuse/langfuse/blob/v4.35.0/LICENSE) 为 core MIT、EE 目录另许可；[EE LICENSE](https://github.com/langfuse/langfuse/blob/v4.35.0/ee/LICENSE) 明确商用条件。数量不限不代表企业权限/SSO/审计等均免费；本次不报价未知的套餐金额，也不建议为 8.5 升级服务端。

**适合复用**：在实际支持 v4 的既有实例中观察成本/延迟/质量趋势和独立观测缺口，提供到正确项目/环境的安全查询关联。**不替代本期主链路**：抽样/异步 observation 不能完整反映 AMap 全流程、业务回退耗尽、固定窗口失败计数或钱包/预留未知状态；8.2 评测 findings 不自动变生产 Telegram。webhook 承接仍需幂等、验签、乱序和真实业务证据，不能直接转发整段 payload 到运营群。

实际 Langfuse hosting/版本、alerts/automations 可用性、迁移路径、任务调度负载和留存/删除尚未运行核验。复用现有实例会增加聚合查询与 automation worker 工作量；不是零资源。为了告警另外起 Langfuse v4 和数据系统、或复制其 UI，都会扩大本 Story。外部 webhook 的 filters/title/body 也需脱敏，不能只检查 trace input/output。

## 交给主代理的最小合同输入

以下为研究建议，主代理负责正式状态机、GWT 与原型；不是本报告自行批准的实现。

1. **合格事实先行**：使用统一调用器和预算/熔断权威完成重试、缓存与回退判断后产生合格事件；包括管理员才能处理的认证/计费/终态额度、全路由不可用及配置的持续阈值。普通恢复路径仍有效时不发送。不得为“证明已耗尽”再次发无意义或付费探测。
2. **事件与故障周期分开**：事件 ID 去重，fingerprint 聚合同一问题，episode ID 表达一次 open→recover 生命周期；多个环境/不同服务账号不得错并。每个相关状态更新包含权威序号或 expected version，迟到旧恢复不能关闭新 episode。
3. **PG 原子连接 incident 与 outbox**：在领域事实已成立后，事务性写入 incident 转移与应发通知；跨实例只有一个 worker 领取，持久保存 first/last seen、计数、冷却截止、策略版本和发送尝试。不要依赖 sampled telemetry 数量。发送 HTTP 不放在 PG 长事务内。
4. **不要过度扩大领域事务**：通知发送失败、Sentry/Langfuse 不可用和 Telegram 重试不回滚或改变 Job/Plan、AI 重试预算、账本或 breaker。若消费持久业务事件，需有可重放游标和积压记录；业务数据正确与通知尚未完成可以并存。
5. **静默≠解决**：记录操作者、范围、理由、截止时间；静默期间继续更新 incident 与恢复事实。到期不补发整个历史洪峰，按最新状态决定是否仍需通知。关闭告警规则、暂停 Provider 路由、人工确认知悉与实际恢复必须区分。
6. **恢复有证据**：由相同能力/账号的有效成功、已验证健康状态或配置的恢复窗口得出；没有新流量、遥测中断、lease 到期和旧回调都不能单独宣布恢复。消息状态未知不能阻止真实恢复入账；但恢复通知的顺序/措辞须考虑原故障通知是否实际成功。
7. **唯一发送权威**：MVP 优先 PG outbox→Node Telegram adapter。若选择 Alertmanager 为实际发送端，需明确回执能力、重送和去重边界；不可让 PG worker、Sentry、Langfuse、Alertmanager 各自把同一 incident 发四遍。
8. **投递未知保留未知**：成功受理回执、失败可重试、永久拒绝、超时结果未知分别保存。幂等 outbox 不等于 Telegram 网络 exactly-once；超时重发可能重复，要在模板中有稳定 incident/episode 标识，策略设有界重试与冷却。不要把“alert webhook 返回 2xx”写成 Telegram 投递成功。
9. **最小可操作面**：8.5 自己有受保护的 incident / notification 查询、失败与未知状态、静默配置和单独授权的测试入口；不等待 8.6，也不扩展成排班/升级/电话/on-call 平台。
10. **隐私与生命周期**：只含批准的运营字段与关联号；排障链接要受保护且不内嵌密钥/用户行程。PG、日志/快照、供应商工具和 Telegram 副本各自核实保留/删除；不能宣称删除本地记录已经撤回所有收件副本。Telegram 故障只能通过独立可查路径体现，不能递归向同一故障通道告警。

建议实施验证重点：并发重复事件、跨重启冷却、乱序 open/recover/reopen、静默期间恢复、无数据/发布器断网、所有回退耗尽与单次可恢复失败区分、外部受理但响应丢失、永久权限错误与持续投递失败、每个数据出口脱敏。真实 staging Telegram 测试仍需明确授权；本轮没有发送任何消息。

本研究仅新增本报告。无源码、配置、OpenAPI、Prisma、正式 epics 或 sprint 状态修改；没有子代理、安装、账号创建、真实凭据读取、部署或测试投递。
