---
project: nomad-mvp
story: '8.5'
date: 2026-09-13
status: research-complete-awaiting-story-review
scope: Telegram-Bot-API-outbound-delivery-and-Node-client-selection
method: official-documentation-and-pinned-GitHub-source
realMessagesSent: false
credentialsRead: false
installedOrDeployed: false
businessCodeChanged: false
---

# Story 8.5 Telegram 投递研究

**建议：本期使用既有 Node `fetch` 做一个受限的 Telegram 出站适配器，由 Nomad 持久投递 worker 统一管理去重、重试和结果未知；不新建完整 Bot 运行服务。** grammY 的纯 `Api` 客户端可作为后续扩大 Bot API 使用面的备选。Telegraf 对本期单向告警没有明显收益。两套 SDK 都不能提供 Telegram `sendMessage` 的端到端 exactly-once 或运营者已读证明。

研究日期为 **2026-09-13（Asia/Shanghai）**。已读取 Epic 8 拆分中的 8.5/8.6 边界和 `docs/ops/rate-limits.md` 的告警小节；主 agent 正在同步用户已批准的 8.4，本研究不编辑这些文档。源码仅下载到 `/tmp/nomad-story85-telegram/` 供静态核验，没有安装依赖、调用任何带凭据的接口或发送消息。桌面 Web 运营页和 Telegram 桌面消息原型由主 agent 处理，本报告不要求新增移动运营页面。

## 1. 八组核心来源与版本

| 编号 | 当前官方证据 | 本次用途与版本 |
| --- | --- | --- |
| S1 | [Telegram Bot API](https://core.telegram.org/bots/api) | 页面最新变更 **Bot API 10.3，2026-08-24**；`sendMessage`、`ResponseParameters`、格式、topic、权限及 update 合同 |
| S2 | [官方 Bot API 服务源码](https://github.com/tdlib/telegram-bot-api/blob/e3e9dd8e5b3d7ab8537cd5a10dc31d5ffa8f82d1/telegram-bot-api/Client.cpp) | 固定 HEAD `e3e9dd8e5b3d7ab8537cd5a10dc31d5ffa8f82d1`；401/403、迁移、目标检查和发送路径 |
| S3 | [Telegram Bots FAQ](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this) | 常规免费消息及 flood limits；不是固定吞吐 SLA |
| S4 | [grammY API 使用](https://grammy.dev/guide/api)、[v1.46.0 发布](https://github.com/grammyjs/grammY/releases/tag/v1.46.0) | **v1.46.0**，2026-08-26，支持 Bot API 10.3；SHA `055a5a440f04d0b9fd5fd75a6d14dac4c2b83553` |
| S5 | [grammY auto-retry 源码](https://github.com/grammyjs/auto-retry/blob/v2.0.2/src/mod.ts)、[插件说明](https://grammy.dev/plugins/auto-retry) | 最新稳定 semver tag **v2.0.2**，`87aa7668555bd3ded848918a7405d64428205f7c`；实际循环及默认值 |
| S6 | [Telegraf v4.16.3 网络客户端](https://github.com/telegraf/telegraf/blob/c591338a5b7396c57435d4b29383feea9be71dd5/src/core/network/client.ts)、[官方仓库](https://github.com/telegraf/telegraf) | Releases Latest **v4.16.3，2024-02-29**；tag `c591338a5b7396c57435d4b29383feea9be71dd5`；README 声明完整支持 API 7.1 |
| S7 | [Node fetch / AbortSignal 官方文档](https://nodejs.org/api/globals.html#fetch) | 当前页面 v26.8.2；说明内置 fetch 及 AbortSignal。项目声明 Node >=20，不代表生产正在运行 v26 |
| S8 | [Telegram 官方发送入门](https://core.telegram.org/bots/tutorial#sending-messages) | 普通私聊首次接触条件；本期只通知配置的运营人员 |

许可证已直接读取：grammY、auto-retry、Telegraf 均为 MIT，见各自固定版本 [grammY LICENSE](https://github.com/grammyjs/grammY/blob/055a5a440f04d0b9fd5fd75a6d14dac4c2b83553/LICENSE)、[auto-retry LICENSE](https://github.com/grammyjs/auto-retry/blob/v2.0.2/LICENSE)、[Telegraf LICENSE](https://github.com/telegraf/telegraf/blob/c591338a5b7396c57435d4b29383feea9be71dd5/LICENSE)。没有相关企业许可要求。常规 Bot 发送有免费限速，`allow_paid_broadcast` 是另行付费能力，本期不启用。没有研究、部署本地 Bot API Server 的需要。

## 2. API 能证明什么

**已证实：**正常 HTTPS `sendMessage` 成功返回已发送的 `Message`；JSON envelope 用 `ok` 表示结果。公开参数没有客户端幂等键，`message_id` 是结果里的消息标识，不是发送前可指定的去重标识。普通发送响应不提供接收者已读事实。[S1：sendMessage](https://core.telegram.org/bots/api#sendmessage)

**对 Nomad 的推断：**成功状态应解释为“Telegram 返回了消息记录”，保留目的地、`message_id`、响应时间及本地 attempt 关联；不能显示“运营者已读”或“问题已处理”。同内容、同 fingerprint 再调一次 API，不因此成为幂等发送。内部去重能防止可控的重复调度，但无法消除“Telegram 已发出、响应丢失/本地收据尚未落库”这一窗口。

**网络超时/Abort：**Node 或 SDK 停止等待不证明 Telegram 取消了发送。若无法证明请求未外发，应保持“投递结果未知”；重试可能重复。没有已保存的 Telegram 消息 ID 时，本期所用 Bot API 合同没有按本地告警 ID 查询原发送结果的通用能力。不得把 `getUpdates` 的 incoming `update_id` 当成出站幂等凭据。这些是基于公开 API 表面和请求生命周期的推断，不是本轮故障注入实测。[S1：API 请求与 updates](https://core.telegram.org/bots/api#making-requests)、[S7：AbortSignal](https://nodejs.org/api/globals.html#static-method-abortsignaltimeoutdelay)

建议持久状态至少区分：待投递、投递中、Telegram 已返回消息记录、确定拒绝/待修复、等待限速窗口、结果未知、停止重试。网络重复风险应保留在 delivery attempt 上，不通过修改业务 Job/Plan、调用预算或熔断状态“修正”。这是本报告建议，正式状态命名由 Story 合同确定。

## 3. 失败、目的地和权限

| 观察结果 | 官方事实 | 建议的 Nomad 行为（设计推断） |
| --- | --- | --- |
| 429 + `parameters.retry_after` | `retry_after` 为应等待的秒数 | 持久化 `next_attempt_at`，不提前重发；全局/目的地发送调度共用此等待约束，不让各 worker 独立睡眠后齐发 |
| 401 | 官方源码有 Unauthorized/无效认证处理 | 暂停受影响的 token 配置版本并在内部页面标记需修复；不要把旧 token 无限重试 |
| 403 | 官方源码覆盖 bot 被阻止、被踢出、不是成员、用户停用等 | 标记受影响目标不可投递；核对成员/权限后再恢复，不改发未经配置的 chat |
| 400 + `migrate_to_chat_id` | 群升级为 supergroup 会返回新 chat ID；不保证仅 32 位 | 通过受控映射更新目标并审计；保留原目标和 attempt，不把迁移当告警业务状态变化 |
| chat/topic 不存在或权限不足 | 服务端检查 chat 写权限与 thread 存在；频道发帖权限独立 | 目标配置绑定 chat 和可选 thread。topic 错误不静默丢掉 thread 改发总群；先修复配置 |
| 5xx、代理断连、无有效 JSON | 不一定获得可信的 Telegram 成功/拒绝结果 | 保存错误来源和是否拿到有效 envelope；缺少确定证据时按未知处理，使用有界重试并接受可能重复 |

依据：[S1：ResponseParameters](https://core.telegram.org/bots/api#responseparameters)；[S2：chat 访问与迁移检查，第 8796 行附近](https://github.com/tdlib/telegram-bot-api/blob/e3e9dd8e5b3d7ab8537cd5a10dc31d5ffa8f82d1/telegram-bot-api/Client.cpp#L8796)，以及同文件错误归一化、`process_send_message_query` 和 topic 检查。错误 description 不宜作为永久协议枚举；应保存受限稳定分类和必要参数，未知错误保留未知。

普通私聊需运营者先联系 bot；群聊需 bot 被加入并能发言，频道需要对应发帖权限。只配置一个数字 chat ID 或通过 `getMe` 验证 token，并不能证明指定 chat/topic 可投递。`getChat`/`getChatMember` 等只读检查也不能保证检查之后权限不变，实际发送仍需处理拒绝。[S8：私聊条件](https://core.telegram.org/bots/tutorial#sending-messages)、[S1：权限](https://core.telegram.org/bots/api#chatmemberadministrator)

S3 给出的常规建议为单 chat 避免超过每秒一条、群约每分钟 20 条、广播约每秒 30 条；短突发和实际 flood control 会变化。本期应以聚合/冷却减少发送，再尊重真实 429，而不是把这些数字当保证可用额度。AI/AMap 的普通 429 和 Telegram 发送 API 的 429 是两个维度：前者仍遵守既有终态告警门槛，后者只影响投递调度。

## 4. 消息格式、收据及最小网络表面

`sendMessage` 文本为解析 entities 后 1–4096 字符；可用纯文本、HTML/Markdown 或 entities；实体偏移使用 UTF-16 code units。可通过 `link_preview_options` 关闭预览。[S1：文本和格式](https://core.telegram.org/bots/api#formatting-options)

**建议：**本期使用短纯文本模板，不设置 `parse_mode`，关闭链接预览。若视觉确需加粗，再选择固定 HTML 模板并分别转义所有动态值的 `&`、`<`、`>`；不要直接拼 MarkdownV2 错误描述。渲染前限定允许字段和长度，聚合次数/时间/稳定码/关联 ID 始终保留。长度测试包含中文、emoji 和换行，不能按 UTF-8 字节机械截断。单条摘要足够时不自动拆多条，以免增加排序、限速和重复窗口。

告警只发送脱敏的环境、Provider/能力、严重性、稳定码、计数、首末时间和关联标识。不得附原始请求/响应、行程、POI、酒店、token、原始 owner ID 或保护 URL。关闭链接预览不等于对方看不到消息或 URL，也不撤回已发送内容。桌面消息原型是排版示意，不是 Telegram 回执。

**无需常驻 webhook 或 getUpdates：**本期为已配置目的地的单向发送，直接调用出站 API 即可。grammY 官方支持独立 `new Api(token)`；无需 `bot.start()`。Telegraf 的 `Telegram` 客户端最终同样调用 HTTP `sendMessage`，也不需要 `launch()` 来完成一次出站 API 调用。[S4：独立 Api](https://grammy.dev/guide/api)、[S6：发送实现](https://github.com/telegraf/telegraf/blob/c591338a5b7396c57435d4b29383feea9be71dd5/src/telegram.ts#L134)

`getUpdates`/webhook 属入站机制，未来真正需要 bot 命令或按钮确认时再设计。尤其不使用“在 webhook HTTP 响应里顺便发送”的优化：Telegram 官方说明这种方式无法得到方法成功与否或结果，无法满足本 Story 对消息收据的要求。[S1：webhook response 限制](https://core.telegram.org/bots/api#making-requests-when-getting-updates)

## 5. Node 客户端选择与重试风险

| 选择 | 已核实能力 | 适配判断 |
| --- | --- | --- |
| 现有 Node fetch | 项目 server 声明 Node >=20；AMap 和 Provider 代码已经使用 fetch + AbortSignal.timeout。无新增 Bot 框架依赖 | **建议采用。** 针对少量固定方法维护窄类型和 envelope 校验，显式超时、错误分类、收据解析；持久 worker 统一做重试 |
| grammY `Api` v1.46.0 | 类型化发送、独立 API 客户端；客户端默认 `timeoutSeconds=500`、`sensitiveLogs=false`；可传 signal/custom fetch | **可选。** 新增库有一定类型维护收益；仍须收紧超时、适配持久 attempt，不会自动获得业务去重/收据恢复 |
| Telegraf v4.16.3 | `Telegram.sendMessage` 包装 HTTP；client 接受 AbortSignal，默认 HTTP timeout 500000ms；有 token message 脱敏逻辑 | **本期不新增。** 对单向短文本价值有限；稳定发行和 README 的 API 覆盖较旧，不能据框架名宣称支持当前全部 10.3 参数 |

本地证据：`apps/server/package.json`、`apps/server/src/integrations/amap.ts:78`、`apps/server/src/planner/hq.ts:398`。以上只证明接入模式可复用，不表示现有代码已有 Telegram 功能或已部署。源码依据：[grammY client](https://github.com/grammyjs/grammY/blob/055a5a440f04d0b9fd5fd75a6d14dac4c2b83553/src/core/client.ts#L238)、[Telegraf client](https://github.com/telegraf/telegraf/blob/c591338a5b7396c57435d4b29383feea9be71dd5/src/core/network/client.ts#L338)。本轮没有运行三个客户端做性能比较，没有给出虚构延迟或内存测量。

**grammY auto-retry 的重要限制：**v2.0.2 默认 `maxRetryAttempts=Infinity`、`maxDelaySeconds=Infinity`，会处理 429、>=500 和网络 `HttpError`。网络错误处于 `call()` 的内层循环，重试时并不递减外层 `remainingAttempts`；所以仅设置 `maxRetryAttempts` 不能限制网络错误重试。`rethrowHttpErrors=true` 可让错误交还上层，服务器错误也有 `rethrowInternalServerErrors` 选项。[S5：实际循环，第 95–160 行](https://github.com/grammyjs/auto-retry/blob/v2.0.2/src/mod.ts#L95)

**建议：**本期不安装这个插件；让每次实际发送都有一个持久 attempt，429 也在 worker 外重新调度。若后续选择 grammY，不要同时启用 SDK 隐式重试和队列自动重投两套权威。插件的等待/重试行为不是 PG outbox、跨实例 fencing、重启续发或结果未知的替代品。

## 6. Token URL 脱敏与验收边界

Telegram 的认证 token 位于 `/bot<token>/METHOD` URL 路径，即使用 POST JSON 也不能把 token 从 URL 移走。[S1：请求 URL](https://core.telegram.org/bots/api#making-requests)

grammY 默认不在网络错误消息披露含 token 的 URL，但其 `sensitiveLogs=true` 会改变这一点；Telegraf 在 fetch catch 中替换 error.message 的 token 片段，同时 debug 路径可能记录 method/payload。SDK 自身一处脱敏不覆盖 HTTP 自动 instrumentation、代理 access log、错误 cause/stack 或业务日志。[grammY sensitiveLogs](https://github.com/grammyjs/grammY/blob/055a5a440f04d0b9fd5fd75a6d14dac4c2b83553/src/core/client.ts#L214)、[Telegraf redactToken](https://github.com/telegraf/telegraf/blob/c591338a5b7396c57435d4b29383feea9be71dd5/src/core/network/client.ts#L294)

**建议实现时验证：**在日志、trace、Sentry 进入点之前将 Telegram URL 路径替换为固定方法名；仅记录配置版本/目标别名，不记录完整 token/chat ID/请求体。用假的 token 哨兵跑超时、HTTP 拒绝和 JSON 错误 fixture，确认所有出口找不到它。Bot token 仅由 secret-backed 配置解析，管理 UI 只显示引用/版本/校验状态，配置不得接受任意 API base URL。

正式验收仍需获准 staging 的真实发送与桌面核查，并覆盖成功收据、429、错误 token/权限、topic/迁移、超时未知、重复 worker、发送后收据落库失败、进程重启、聚合/冷却及恢复消息。SDK、API 文档和原型都不计作通过；本轮全部真实投递、网络可达性、权限和目标配置均**未验证**。

**最终建议：采用 Telegram 官方 HTTPS `sendMessage` + 现有 Node fetch 薄适配器；保持一套持久投递权威；将 grammY 纯 Api 留作可替换实现，暂不引入 Telegraf、auto-retry、常驻 webhook/getUpdates 或本地 Bot API Server。** 运营页面只需本 Story 自己可用的桌面 Web 状态/修复/测试入口，Telegram 失败通过该入口和独立监控呈现，不能经同一故障 Telegram 通道递归报警。
