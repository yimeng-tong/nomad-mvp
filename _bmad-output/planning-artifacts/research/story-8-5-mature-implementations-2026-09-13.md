---
project: nomad-mvp
story: '8.5'
date: 2026-09-13
status: research-complete-selection-approved
delegatedAgents: 2
selectionApproved: true
selectionApprovedDate: 2026-09-13
realMessagesSent: false
runtimeValidated: false
---

# Story 8.5 成熟告警与 Telegram 投递研究

## 建议与范围

**已批准采用（2026-09-13）：复用现有Node/PostgreSQL维护合格业务事件、故障周期、聚合/冷却及持久
待发送记录；由一个Node fetch薄适配器调用Telegram普通sendMessage。** 已批准的
Sentry/Langfuse继续用于安全排障关联。本期不强制新增Alertmanager、完整Bot服务、
webhook/getUpdates、自动重试插件或观测平台升级。

这保留8.3/8.4的单一调用/预算权威和用户原恢复路径；只增加通知能力。运营配置、
状态、静默、投递恢复及明确测试动作有自己的桌面Web入口，无需移动适配或等待8.6。
采用方向、24条GWT及两张基础R1已获批准；没有实际配置/发送Bot消息或运行验收。

## 委派与主代理核验

- [Telegram投递报告](story-8-5-telegram-delivery-agent-report-2026-09-13.md)：官方API、
  Node fetch、grammY/Telegraf、回执、未知结果、限速、目标权限、许可证和token URL出口。
- [告警编排报告](story-8-5-alert-orchestration-agent-report-2026-09-13.md)：Alertmanager、
  当前Sentry/Langfuse能力、持久性、恢复、缺数据、付费/资源和隐私。
- 主agent核对当前FR38.1、已批准8.3/8.4及ops/observability；server相关集成与依赖搜索
  未见已交付Telegram链，Node fetch和PG模式可以复用但不算本Story运行证据。
- 主agent复核Telegram sendMessage公开合同、Alertmanager Alerts API的自动到期语义、
  Langfuse Alerts的NO_DATA默认值，并直接读取grammY auto-retry v2.0.2的内外层循环。
  研究仅为官方资料/固定源码检查，没有安装依赖、账号访问、部署、探测或发真实消息。

观察日期均为2026-09-13。两份报告记录精确release/commit，主要观察为Bot API10.3
（2026-08-24）、grammY1.46.0、auto-retry2.0.2、Telegraf4.16.3、Alertmanager0.34.0、
Sentry self-hosted26.8.0与Langfuse4.35.0；这些不是项目部署版本。项目已有SDK和
服务端实际版本/套餐不能互相推导，实施前仍需核实。

## 方案比较

| 方案 | 成熟能力与价值 | 本项目仍需处理/代价 | 本期选择 |
| --- | --- | --- | --- |
| Node fetch + PG | 复用当前出站与事务模式，只实现固定方法和窄运营链 | 自己实现类型校验、持久状态/重试、目标验证和脱敏；无SDK自动兜底 | 建议采用，不把简单HTTP误称完整可靠投递 |
| grammY纯Api | 类型化Bot API、可独立出站而不启动polling | 增依赖，默认超时与插件重试须显式控制；没有端到端去重/已读保证 | 可替换候选，不设前置 |
| Telegraf | 常见Bot开发框架和出站client | 当前稳定发行/API覆盖较旧；单向短消息用不到完整Bot框架 | 本期不新增 |
| Alertmanager | 成熟分组、静默、抑制、Telegram receiver和恢复通知 | 仍需Nomad合格事实、周期/游标、恢复证据及投递收据；新增进程/持久卷/维护 | 借鉴模式，不强制部署；已有实例也须避免双发送 |
| Sentry/Langfuse | 既有故障/trace查询及当前告警能力 | 采样、工具状态/默认缺数据处理和实际套餐不满足业务权威；Telegram另有适配 | 复用8.1查询关联，不直接多处发送同一事件 |

grammY/auto-retry/Telegraf为MIT；Alertmanager为Apache-2.0。Sentry当前采用
FSL-1.1-Apache-2.0，Langfuse core MIT/EE另有许可。SDK免费不等于运营托管、细粒度
权限和治理免费；实际Sentry/Langfuse套餐未知。常规Telegram出站受免费限速，付费广播
不在本期。固定版本许可证和官方资源/套餐证据见两份报告，未做采购/容量承诺。

## 关键证据与合同影响

**发送成功、未知与重复。** Telegram sendMessage成功返回Message，普通公开参数不含
客户端幂等键，也不提供收件者已读状态。没有返回或保存message_id时，不能用本地通知ID
查询原发送结果。推导：PG唯一outbox只防本地重复安排；外部发送成功而响应/落库丢失
仍可能重发两条。消息与Web需保留同一事件号、真实时间和投递未知，不能显示已读/已处理。
[Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage)

**恢复不能取自心跳到期。** Alertmanager要求客户端持续重发活跃状态，endsAt过期会
自动resolved。发布器失联也会产生这个表面变化，因此Nomad只接受同能力/原因的有效
业务与控制证据，不能把告警系统resolved当成供应商恢复。
[Alerts API](https://prometheus.io/docs/alerting/latest/alerts_api/)

**当前Langfuse已有告警，但默认值需要核验。** 官方支持v4指标告警、恢复及重复提醒，
当前通知动作列Slack/Webhook/GitHub Actions；缺数据默认按零比较。推导：不能沿用
“没有告警”的旧结论，也不能让缺数据制造本项目的恢复通知；实际部署和配置未知。
[Langfuse Alerts](https://langfuse.com/docs/observability/features/alerts)

**SDK重试次数可能没覆盖网络循环。** auto-retry v2.0.2默认次数/等待上限为Infinity，
网络HttpError在内层call循环重试，外层remainingAttempts不会因此递减。主agent已
核对该分支；只设maxRetryAttempts不等于所有发送有界。本期让持久worker成为唯一
重试控制者，429/retry_after保存为调度时间，不在SDK中无限睡眠重试。
[固定源码](https://github.com/grammyjs/auto-retry/blob/v2.0.2/src/mod.ts#L95)

**多实例不等于exactly-once。** Alertmanager的active alerts需生产方重送，HA分区策略
允许重复，nflog/silences有自己的保留/快照语义。若未来采用它作为发送端，必须设计
Nomad收据回传及唯一发送权威，不能PG/Sentry/Langfuse/Alertmanager各发一次。
[HA说明](https://prometheus.io/docs/alerting/latest/high_availability/)、
[固定内存provider](https://github.com/prometheus/alertmanager/blob/v0.34.0/provider/mem/mem.go)

## 最小实现职责（设计提案）

1. **合格事实入口**：从已持久的业务终态/恢复证据消费，按事件ID/游标重放；普通
   429、有效备用/缓存、个人额度受限和评测发现不直接变Telegram。
2. **事件状态**：稳定指纹聚合、独立故障周期、真实累计计数/首末时间与来源序号；
   静默继续记录，缺数据不恢复，迟到旧状态不关闭新周期。
3. **投递记录**：事件变更与唯一待发送项原子保存；worker fenced领取、发送前复核、
   实际attempt/回执/未知/拒绝/next attempt持久化，重启不刷屏。
4. **安全出站**：固定Telegram目的地、短纯文本与受保护只读链接，token仅secret引用。
   token实际在请求URL路径中，日志/自动trace/代理出口需在导出前处理；仅POST并不隐藏它。
5. **桌面操作**：策略草稿/检查/发布、当前事件/投递状态、有截止时间的静默、修复后
   显式恢复与单独确认的TEST消息。无手机适配、Bot命令、远程修复、值班排班或8.6依赖。

通知故障不能翻转已提交业务结果、改AI/高德重试预算或账本；事件/通知消费者失联需
从持久源恢复，独立Web可见积压，不经同一坏Telegram通道递归报警。原通知可证未发就
不补孤立恢复；已发则恢复一次；原发送未知则恢复内容说明不确定，不补过期活跃告警。

## 资源、隐私与验收限制

方案新增PG事件/通知/attempt记录与worker调度负载；需要有限队列、批量聚合、索引、
可审计保留/清理与容量测试。本次没有可保证的消息TPS、RAM、CPU或最长恢复时间。
若新起Alertmanager/升级Langfuse/Sentry则会增加服务及数据系统维护，是否有现成实例
要到实施时核实，不能为了本Story先部署一套监控平台。

payload只包含获准运营字段；禁止原文、POI/酒店/路线、owner标识、受保护业务URL及
token。PG/trace/代理/日志和Telegram副本分别管理；清本地记录不保证撤回消息。
群/topic权限、Bot可达性、地域网络和实际目标仍未验证。无需让原型使用真实群名或凭据。

真实验收需单独获准staging发送并保存消息回执/桌面证据；并发去重、重启冷却、429、
401/403、topic/迁移、未知发送、回执落库失败、恢复乱序/再次异常、静默/源失联及
token哨兵检查可以先做受控故障验证，但研究/SDK/mock/图片均不能冒充实际消息通过。
详见 [24条已批准GWT](../story-8-5-review-2026-09-13.md)。
