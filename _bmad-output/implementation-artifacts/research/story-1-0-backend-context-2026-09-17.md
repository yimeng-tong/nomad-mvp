# Story 1.0 后端、数据与测试上下文核验

日期：2026-09-17。用途：供主代理编写 Story 1.0 实施合同。状态：只读研究完成，未实施业务。

读取时 Git HEAD 为 7250a8a131a370698bff53538a4405c2ddb94c1c，分支 codex/story-2-2-timeline-editing。业务后端、Prisma 与 OpenAPI 相对 HEAD 没有未提交改动；已有大量规划改动保持原样。未读取 .env 值，未连接数据库、登录供应商或真实服务，未运行业务测试、构建、迁移或部署，未变更 Story/CURRENT/Sprint/Git。仅新增本报告。文中行号以本次读取的工作树为准。

## 1. 已核实的边界

- 正式合同为 _bmad-output/planning-artifacts/epics.md:487–569，14 组 GWT；历史 1.1/1.2 的 done 不等于生产身份交付。CURRENT 与 Sprint 的旧授权字段是准备前快照；本次准备授权由主任务会话承接，本报告不推断业务实施或真实服务授权。
- 1.0 必须交付真实手机号登录及本期获准启用方式、可信身份到稳定 owner、共享持久会话、多设备共存、当前退出、持久账号资格/全会话失效、全部既有私有入口认证，以及最小桌面运营授权。不能等待 7.3 设置重做、7.5 删除 UI 或 8.6 运营总览。
- 7.5 负责将真实删除确认、资格屏障、清理任务及 dispatch intent 原子受理并完成后续清理；1.0 提供可复用资格/撤权服务和受控持久 fixture。当前 /account 排队壳不能被计为已实现 7.5。普通退出不取消已受理后台任务。
- 保留历史 Planner owner/revision/幂等/不可变版本/EditEvent/undo 成果；不得借认证改造恢复暂停的 3.1 或修改其 15 分钟旧编辑语义。1.7 的完整导入持久事件重放、1.9 的真实媒体、5.x 的完整导出也不由本 Story 顺带实现。
- 工程绑定：OPS-01、DB-CHANGE-01、METRICS-01，详见 sprint-migration-2026-09-15.yaml:680–697、722–737、757–772。FR14 登录归因义务见 sprint-delivery-contract-2026-09-17.yaml:1240–1250；U-Link/U-App 真实适用性与集成不能被 Sentry、空 wrapper 或 SDK 配置替代。

## 2. 当前身份链路与必须改变的行为

| 文件与行号 | 目前实际行为 | 1.0 改动与必须保留的行为 |
| --- | --- | --- |
| apps/server/src/auth/session-store.ts:19–20、59–99 | OTP 与 Session 都以模块级 Map 为权威。发送仅登记固定验证码 hash，默认 OTP 为 000000，没有短信调用；校验有存在、时效、常量时间比较和消费删除。错误验证码不递增失败上限。 | 用真实供应商验证及共享一次性状态；保留先发送后校验、错误/过期拒绝、服务器冷却。生产不可因配置缺失回退 stub。跨实例的发送、消费、重放和并发验证必须一致。 |
| 同文件:40–45、71、98 | normalizePhone 只去掉空格和连字符；userId 为 u_ + 手机号 SHA256 前 24 hex；region 不参与最终归一化/身份映射。 | 真实证明先规范化手机号/issuer subject，再解析已有可信绑定；不能把该可推导 ID 或旧号码相等当所有权证明。规范化策略/version 与历史冲突要显式处理。 |
| 同文件:101–133 | sess_UUID 同时是会话 ID 与 cookie secret；创建不踢其他设备，固定到期，getSession 过期即删除，revokeSession 可带 owner 限制。没有刷新、持久撤销或账号资格。 | 保留多会话共存、到期拒绝、owner 限制；新增共享权威、持久撤销、资格检查、明确续期/旋转语义及竞态测试。Session 公共 ID 与认证 secret 分开。 |
| apps/server/src/plugins/auth.ts:17–35 | 有 sid 时仅查内存 Session；无 sid 时无条件信任 x-user-id；没有环境门禁、Bearer 验证、数据库用户资格或运营权限。无效 sid 不回退 x-user-id，这一点应保留。 | 统一可信认证上下文，生产拒绝开发头；显式注入隔离测试适配器，不让普通客户端字段开启测试模式；存储不可用返回可恢复认证失败，绝不默认放行。 |
| apps/server/src/routes/auth.ts:54–57、103–111 | captcha off/risk/always 默认 off；risk 依赖客户端 x-auth-risk/x-device-id 和配置设备集；已知 captcha-ok 即通过，没有腾讯验证调用。 | 风险/短信失败重试/高峰策略由可信服务端事实决定；客户端设备仅是非可信信号。按实际腾讯协议验证，而不是判断 token 非空或等于固定串。保留默认不打断及无效模式 fail closed。 |
| 同文件:78–100 | 配置任何第三方都会把 Apple/phone/WeChat 全部标为 enabled:true；与宿主能力、服务端验证是否可用无关。 | 能力清单必须反映批准的平台、真实配置和已接通回调；保留适用 iOS Apple/手机号/微信等权顺序和协议链接。不得以隐藏必需入口消除验收缺口。 |
| 同文件:66–75、167–181 | cookie httpOnly，默认 SameSite=Lax，Secure 仅配置 true 或 SameSite=None。OTP 验证成功后创建内存 session；响应 body 含与 sid 相同的 session.id。 | 生产启动校验 HTTPS/secure/范围/期限/同跨源方案；公开 DTO 不得返回 secret。配置、OTP 参数、旧 otp/code 等兼容字段需要 OpenAPI 同步，不能破坏当前手机流程。 |
| 同文件:122–140、184–201 | /me、/sessions/me、/sessions 返回 user 与 session；header 身份会构造 header_userId 假会话。/sessions 返回所有真实 cookie secret。 | 移除生产假会话和 secret 暴露。/me 返回稳定 owner 与安全会话元数据；session 列表保持 owner 限制但不新增设备管理产品页。 |
| 同文件:204–217 | DELETE /sessions/:id 带 owner 检查；删除当前时清 cookie。POST /logout 无需有效会话，删除当前 cookie 对应 Map 项后无条件 ok；持久写失败、丢响应核实均不存在。 | 保留当前会话退出、重复/过期 cookie 的幂等清理；先持久撤销再成功，未知结果沿同次退出核实。不能撤其他 owner，也不能退出全部设备。CSRF/来源验证不能因 logout 幂等而省略。 |
| packages/prisma/schema.prisma:131–165 | 已有 User/OAuthIdentity/Session 表；OAuthIdentity 对 provider+subject 唯一，但运行时认证完全未使用。User 没资格字段，Session 没 secret hash/revokedAt。 | 扩展已有实体，不建另一套用户/会话体系。核实 provider 范围/issuer/app/tenant 是否必须进入唯一键；永久资格屏障及最小身份墓碑不能因 cascade 删除而消失。 |

当前没有已实现的第三方登录/回调/绑定路由。OpenAPI:1127–1161 的 /auth/bind/apple、/auth/bind/wechat 只是声明，不是可用能力；应用实际注册的 auth 路由完整位于 routes/auth.ts:143–218。同样，OpenAPI 的 BearerAuth（1213–1216）不代表后端已实现 Bearer 验证。

## 3. 历史 owner 映射是迁移核心

当前链路为：OTP 手机号 → u_前24位hash → dbUserIdFor → 再 hash 为 UUID → User.id 与业务外键。

- dbUserIdFor 在 apps/server/src/ingest/store.ts:58–65；输入即使已经是 UUID 也会再次 hash，没有 UUID 直通分支。
- Ingest 创建在同文件:127–162：按 input.userId 计算 owner UUID 和 sourceHash，随后 user.upsert。sourceHashFor:67–69 使用外部 userId + URL，用户标识改变也会改变去重键。
- Planner 创建在 apps/server/src/planner/prisma-repository.ts:194–315：按 dbUserIdFor 得到 User.id，并 INSERT User ON CONFLICT DO NOTHING；Plan.userId 与 PlanJob.userId 存该 UUID，PlanJob.external_user_id 存外部 input.userId（293–305）。HQ 同样在 471–540 存 owner 与 external_user_id。
- PlanJob/HqJob 的恢复分别在同文件:620–652、655–679，把 external_user_id 恢复为领域 job.userId；routes/plan.ts:262–295 继续用这个 userId 恢复 source/版本。只迁 HTTP 用户值，不迁 worker 身份消费，将破坏恢复或把旧开发标识再次变成授权。
- 私有读取集中依赖 dbUserIdFor：ingest/store.ts:469–600；planner/source.ts:55–96、216–282；planner/prisma-repository.ts:158–167、318–327、384–394、555–563、682–735，以及所有 mutation 的 owner SQL。
- DB 的 User 由业务入口建出时 phone/region/identity 可能为空；手机号登录本身没有建 User 行。因此不能仅凭 schema.phone 看似唯一，就认定旧 owner 有可信手机号归属。

最小兼容方案应优先保留已证明归属的 User.id 及所有业务外键，以可信身份绑定到这个内部 owner；没有可信证明的 legacy User 留存、隔离并标注冲突。受控映射清单记录旧 actor、旧 DB owner、可信绑定来源、冲突状态、审批证据与迁移版本；不能把 x-user-id、测试手机号或相似姓名当证明。若全部转换为 canonical User.id，必须同步切换上列读取、sourceHash/缓存键与任务恢复，停止业务入口自行造 User；不要只把 dbUserIdFor 改成“UUID 直接使用”就宣布旧数据兼容。

迁移应先干跑统计：真实可信绑定、未绑定遗留、重复 subject、冲突手机号、孤儿引用与旧活跃任务分别计数；先备份/恢复点再受控回填。新注册使用不可从手机号推导的内部 ID；删除/停用身份不得因重新登录、旧 callback 或恢复旧备份被普通 upsert 重建。7.5 的明确重新注册为新 owner 是后续产品动作，1.0 不创建自动复活通道。

Prisma 的旧迁移有实际历史，不能改写 baseline：20260726000000_legacy_baseline/migration.sql:17–46、272–296 已建 User/OAuthIdentity/Session 和相关索引；20260727000100_story_2_1_planner_baseline/migration.sql:237–260、294–315 已有 external_user_id；20260727000200_story_2_2_edit_events/migration.sql 为已存在的 EditEvent 元数据。README:7–14 的 migrate resolve 仅适用于已核验的无迁移历史旧库，不是通用捷径。不要使用 packages/prisma/package.json 的 db:push --accept-data-loss 代替迁移/恢复证明。

## 4. 全部现有入口的认证封口

| 路径/模块 | 当前认证和 owner 情况 | 1.0 必须承接 |
| --- | --- | --- |
| /home/input/parse | routes/home.ts:64–94 有 authGuard，内容来自当前输入。 | 统一生产认证、cookie 写请求防护、敏感输入不进日志。 |
| /library/cities、/library/inspirations、候选 detail | routes/library.ts:12–39；store.ts:469–600 按当前 owner 过滤，不返回 user_id，候选跨 owner 和不存在统一 404。 | 保留过滤、nullable、DTO 和 404 隐藏存在性；改 owner 解析后用真实会话验证。 |
| /ingest/xhs、/ingest/start | routes/ingest.ts:96–106 有 authGuard；保留单 URL/job、owner+URL 去重及旧入口兼容。 | 身份来自统一认证，资格有效才能受理；不用退出取消 job。共享耐久导入队列等完整升级归 1.7。 |
| /ingest/:jobId/events、/sse/ingest/:id | routes/ingest.ts:42–57、109–115：先水合 job，再比 dbUserId；后续直接订阅、发送与 heartbeat，无资格/会话复核。 | 握手与活动流都校验；收到 session/account 撤权后停止私有发送并清理订阅/计时器，别只保证重连 401。维持现有别名、trace、心跳和 owner 404。 |
| /plan/generate、全部 Plan/HQ 读取/编辑/undo | routes/plan.ts:313–404、491–795 有 authGuard；repository 再带 owner 限制，已有幂等、rev/attempt/事务锁。 | 保留 SQL owner 条件、错误形状、幂等与不可变版本；统一账号资格及 CSRF。只改认证依赖，不实施暂停的新版 3.1。 |
| /sse/plan/:jobId | routes/plan.ts:406–489 连接时认证、owner getJob；后续每次轮询重查 job/owner，但不重查 session/账号资格。 | 保留 attempt:cursor、Last-Event-ID、终态清理；轮询前及发送前认证/资格有效，撤权或权威不可用立即终止私有读取/发送。 |
| /search/poi | routes/search.ts:6–24 有 authGuard；真实供应商错误已有 503 类型化降级。 | 保留鉴权、503 和安全错误，不让供应商调用使用开发头。 |
| /user-key、/byok/* | routes/byok.ts:25、49–90：owner Map，存在多个兼容别名；回包仅 status/key_ref，内部 envelope seal。 | 所有别名统一认证/CSRF/资格，保留密钥不回显。BYOK 是延期/内部兼容，不能扩成这张 Story 的新业务；也不能遗漏这些现存受保护路由。 |
| /account/export、DELETE /account | routes/account.ts:5–14：authGuard 后往 BullMQ 加带 user_id 的任务并返回 queued；没有持久账户资格、撤销、清理 worker。 | 保留最小已交付入口的诚实状态和资格校验；不把排队成功视为删除受理/清理。新增资格服务及 fixture 独立验收；7.4/7.5 补最终工作流。 |
| /feedback/link | routes/feedback.ts:4–18：需登录，限定 source 字符，URL 不含 Nomad 身份。 | 保留不外传身份；纳入资格/认证回归。 |
| POST /plan/ai-fill | index.ts:83–90 无 authGuard/owner 读取，仅生成随机 fr_id + URL，没创建与 Plan/owner 绑定的 run。 | 对现存入口补认证、Plan owner 与可信 run 绑定；若缺真实能力，明确 unavailable 且不启动副作用。不要在 1.0 实施 5.1 全部细节业务。 |
| GET /sse/fill/:runId | index.ts:92–120 只有 authGuard，无 run/Plan owner；任意 runId 可触发模拟事件和 persistFillOutput(runId,...). | 必须先验证真实 run→Plan→owner；不能猜 ID 即触发写入。活动流撤权纳入统一机制。fill/service.ts:4–10 接口把入参当 planId，当前调用传的是 fr_id，不能假定这个模拟链已正确持久化。 |
| POST /export/png | index.ts:124–132 无 authGuard/owner；renderer.ts:3–27 实际只渲染“Plan + ID”并回 data URL，没有私有文件下载授权。 | 当前存在的导出入口先补认证和 owner；占位结果不能成为真实导出验收。真正私有媒体/下载未实现，应把未来 5.x/1.9 必须消费的授权函数与当前可验证入口明确区分，不能编造现有下载路径已测通过。 |

代码路由注册完整读取后，没有发现现存独立私有媒体下载端点、运营授权插件/入口或 token 刷新端点。OpenAPI 中其它尚未实现能力不等于当前旁路：不要为本 Story 顺带实现 /fill/apply、result-sheet、所有未来媒体/账号下载；已有实现的裸入口必须封口。

全局配置风险在 apps/server/src/index.ts:38–57：logger:true 没有显式秘密字段脱敏策略；CORS 为 origin:true + credentials:true，非可信来源也被反射；rate-limit 为客户端可变的 x-device-id + req.ip，1000/window，OTP 没独立 5/hour、10/day 或失败次数约束。docs/ops/rate-limits.md:17–20 的 OTP 策略是目标，不能计作已经执行。没有请求 Origin/CSRF 检查。现有 staging nginx.conf:1–17 只提供 HTTP 80 和 /api 反代，systemd service:12–14 只加载外部 env 并跑构建产物；两者不证明生产 HTTPS/cookie/来源配置已就绪。不要不加信任网段就开启任意 proxy header 信任。

完整 bootstrap 还应单独验收。error-envelope.ts:10 装饰的是 FastifyReply.sendError(code,message,status,retriable,details)，index.ts:74–75 装饰的是 FastifyInstance.sendError(reply,code,message,retriable,details)，两者对象不同，不能报成同名重复装饰导致启动失败。现有路由调用的是 reply.sendError，状态参数与该签名一致；实例 helper 当前未见使用，未来误用会固定返回 400。单独注册 authRoutes 的 inject 测试没有覆盖这些全局装配、CORS、队列与裸入口。

## 5. 最小合理数据模型与实现顺序建议

本节为基于代码的实施建议，字段名和供应商协议须由主 Story 的官方来源核验后定稿；不是本轮已实施设计。

1. **冻结安全接口与环境能力矩阵。** 明确 Web/PWA/实际宿主、启用登录供应商、issuer/app/redirect allowlist、短信/腾讯风险策略、same-origin 或批准跨源部署。区分 local/test 与真实用户环境；服务凭据缺失、测试适配器混入真实环境直接失败就绪/明确不可用。未验证的第三方按钮不能标为可用。
2. **先定义可信上下文，再改迁移。** 统一 VerifiedIdentity → stable owner → qualified session；业务方法仍可接收强约束 owner 类型，不从 phone、header、device 或 display name 自行派生。新上下文至少区分 ownerId、公开 sessionRef、内部 secret 验证结果和当前资格。
3. **扩展 User/OAuthIdentity/Session。** User 增持久 active/disabled/deletion-accepted/deleted 等资格和版本/撤权基础；OAuthIdentity 记录经验证的稳定 provider subject 与必要 issuer/tenant 边界、已有绑定和 tombstone；Session 保留 UUID 公共引用，另存高熵 token hash、expiresAt、revokedAt，device 只存非凭据元数据。若采用续期/旋转，持久保存足够的代际/消费事实避免并发续期复活撤销会话。不要重复增加已有 User/Session 表。
4. **共享登录事务。** 将 OTP/provider challenge、OAuth callback 一次性关联/消费和冷却计数落在共享持久权威或供应商明确保证的一次性验证机制；跨实例可验证。外部网络调用不放进可自动重试的数据库事务。取得真实证明后，在唯一约束与事务下查绑定/检查资格/创建首次 owner/创建独立 session；已有 owner 不因 callback 重放或并发首次登录被复制。
5. **历史 owner 受控迁移。** 先映射/冲突清单、保留与恢复证据；兼容读取与任务恢复都使用同一 canonical owner，保留已有资源主键与 Plan revision。sourceHash/请求幂等键的旧值需要显式兼容，不能静默重复导入或跨 owner 复用。
6. **统一认证、资格与最小运营授权。** Fastify plugin 解析可信凭据，资源服务再核对 owner；共享存储失败返回 503 类可恢复失败。最小 OperatorGrant 可用服务端受控 DB/配置记录绑定稳定 owner + 明确 capability/scope、撤销/版本与审计；每次读写查当前授权，默认无权限。最小桌面入口只证明当前权限/受保护动作，不建通用权限平台，不开放任意用户可写 grant API。
7. **当前退出、全账号屏障、续期分离。** logout 以当前 credential 标识同一个 session，持久幂等撤销并确认后清 cookie；丢响应可使用原会话凭据/受限操作回执核实，不把已清 cookie 当服务端成功。不允许迟到续期/登录回包重新装入旧会话。account eligibility/revoke-all 用单一事务/资格版本屏障，所有实例、刷新、回调与普通读取遵守；保留最小身份墓碑阻止隐式重建。无需实现删除清理 UI。
8. **补齐现存私有与活动流。** 已受理任务使用稳定 owner，与当前浏览器 Session 生命周期解耦；logout 关闭该客户端的私有读取但不取消 Job。账号资格变化则使普通读取/下载/SSE 失效，并为现有 worker 发布点提供事务内可消费资格屏障，避免缓存/迟到写入重建数据。共享撤权通知只能加速，不能成为比 DB 更高的授权真相。
9. **合同、所有客户端与旧测试一起迁移。** 先改 OpenAPI，再 generate。既有 auth/Plan/ingest DTO 与错误 code 尽量兼容；测试环境通过依赖注入或受控 fixture 建立可信 Session，不保留公共 x-user-id 后门。先完成本地/隔离 PG 验证，再在获准环境验证真实登录/浏览器/多实例。

最少需要明确的服务契约：start/verify phone proof；begin/consume approved third-party login；resolveVerifiedIdentity；create/authenticate/renew/revokeCurrentSession；assertAccountEligible/revokeAllOrdinarySessions；requireOperatorCapability；resource owner guard；active-stream authorization check。可以使用现有文件内服务分层或新增 auth 下小模块，但不要引入并行框架/独立认证服务作为默认前置。

## 6. 易遗漏的竞态与否定测试

- **会话秘密暴露：** 目前 sessionForResponse 直接回 id，id 又作为 sid。新测试明确响应/分析/日志/public session list 中找不到认证 secret；公开 sessionRef 不能自行认证。
- **资格原子性：** 登录证明验证完成与建立 Session 之间发生 disabled/deletion-accepted；资格提交后旧 refresh/callback/worker 结果不得重新启用普通权限。auth plugin 一次读取后长任务提交前仍需资格屏障。账号不存在不能由 ingest/planner User upsert 自动重建。
- **两设备与两实例：** B 登录/续期不踢 A；A logout 仅 A 失效；B 仍可读。账号停用后 A/B/第三实例所有普通会话失效；重启、缓存/Redis断连、数据库不可读不可恢复旧权限。
- **SSE 完整周期：** 建连、初始历史 replay、后续 event、heartbeat、断线重连都要有资格结论；关闭时解除订阅和计时器。撤权后新产生私有负载不得继续交付；已发送字节无法回收。现有 Plan 的 durable attempt/cursor 不可被新权限检查破坏。不能只测“退出后再新建 SSE 返回 401”。
- **退出响应竞态：** 后端已撤销但响应丢失；请求未送达；cookie 已删除但撤销未确认；另一台仍在线；同浏览器重复退出；登录/刷新迟到响应与退出顺序交错。结果未知要保留同次核实语义。
- **来源/CSRF：** CORS allowlist、SameSite 和 Origin/CSRF 是不同控制；跨站 POST/DELETE、JSON和允许的简单请求类型、缺失/伪造 Origin、回调 state/nonce/redirect 篡改与重放要分开覆盖。若启用 token 客户端，仅施加其适用验证，不用客户端自报 auth mode 绕过 cookie 防护。
- **身份混淆：** 标准化手机号/region、issuer/audience/tenant 差异、不同真实账号同 email/display name、并发相同 subject、可信多入口已绑定账号、冲突旧 owner、旧开发头/OTP/captcha 输入；都不能自动合并或授予运营权。
- **运营撤权：** 普通 traveler、改 role/device/env 字段、知道运营 URL、撤权前的旧 Session/缓存、scope 不符、grant 权威不可用全部拒绝；真实运营登录复用同一身份，不创建另一套密码/用户系统。
- **故障与隐私：** 真实发送未到服务端、供应商拒绝/429/超时、发送未知、OTP错误/过期/重放、captcha失败都区分；共享冷却与失败次数不能被换设备或切实例绕过。HTTP、Fastify/Sentry/分析及错误正文用哨兵验证 phone/OTP/captcha/provider票据/cookie/session secret/原始私人上下文未外泄，不凭“没有显式console.log”下结论。

## 7. OpenAPI 和实现的差异

已对 docs/api/openapi.yaml 全文程序读取（2386 行），逐 path 清点，并读取认证/会话相关全部段落；生成 types 全文程序读取（2139 行）。

- SessionAuth 定义在 OpenAPI:1208–1212；认证/会话端点 934–1071 与 schemas 1262–1382 是需 UPDATE 的基础。
- Home/Library（25–105）、ingest/两个 SSE 别名（106–223）、/search/poi（854–888）实际有 authGuard，但 OpenAPI 无 security 声明；统一补齐。/plan/ai-fill、/sse/fill、/export/png 在实现和 OpenAPI 都没有完整 owner/凭据合同。
- Session.id 无“只是公开引用”语义，logout 仅描述清 cookie；需改成持久当前会话退出及可恢复未知结果。加入与实际实现一致的 401/403/404/429/503、CSRF/来源、refresh或固定期限策略及安全元数据，避免私有缓存。
- /auth/bind/apple、/auth/bind/wechat 未实现，不能据此发明“已绑则登录”保证；按批准能力选择真实流程并写明无自动账号合并。
- OTPVerifyRequest 使用 oneOf，两分支均允许 otp/code，因此同时提供相同的两字段会匹配两个分支，而服务端允许；更新时修正这类旧合同差异并保留明确兼容行为。
- packages/types/src/api-types.ts 只能由 pnpm -F nomad-types run generate 生成，不能手改；包脚本位于 packages/types/package.json。

## 8. 历史与近期 Git 可复用的经验

- 历史 1.1 实施文件:19–25、58–60 明确是现有路由合同，并允许显式 stub；validation.md:19 也明确生产服务可以未完成。因此不回写历史 done，也不再用该历史容许条款通过 1.0。
- 1.1:43–54、100–106 保留了值得复用的 negative tests、OTP必须先发、随机 Session、会话撤销、错误 envelope、类型生成与无效 captcha mode fail closed；新 Story 应提升为生产权威而不删除这些已有交互。
- 历史 1.2:41–60、89–96、163–171 保留 credentials:include、先真实 /me 确認成功、冷却/captcha可恢复、等权与协议、分析 PII 过滤。其第三方未接通时显示不可用、分析 no-op、浏览器截图未完成均有明确历史边界；不能作真实生产证据。
- d6dfb41（2026-06-17）加入当前 Map session-store 与 auth negative tests；34b27fa（2026-06-18）添加 Vite/React 登录首屏并调整 Fastify/Prisma 构建基线。
- 最近五次提交：7250a8a、534581c、10f940c、1a03e88、6f8aeec，均在 2026-07-26/27。534581c 加入 durable EditEvent、owner/revision/幂等、undo 和相关 probes；本 Story 必须回归这些成果，不能当作待清理遗留。
- 10f940c 曾修复 PlanHotelSlot 的 raw SQL 列名 version_id → 实际 "versionId"；这说明内存 repository 全绿不能证明 Prisma/raw SQL 兼容，新认证表和 owner 切换必须实测 PostgreSQL。
- 7250a8a 仅记录既往 GitHub Actions 的 PostgreSQL/Redis/synthetic/SSE 结果，并仍保留 browser/PVE staging 缺口。报告未访问该历史 run 或 PVE，不把旧绿色转化为当前 1.0 认证验证。
- 锁定工具链：pnpm-lock.yaml:74–142 为 Fastify 5.8.5、cookie 11.0.2、cors 10.1.0、rate-limit 10.3.0、Prisma client 5.22.0、BullMQ 5.61.2、tsx 4.20.6、TypeScript 5.9.3；144–158 为 Prisma 5.22.0 与 openapi-typescript 6.7.6。按现有版本实现和官方版本文档核验，不为 1.0 盲升 Prisma/Node 整栈。
- 主代理另行核验的官方安全修补应纳入同主版本更新与代理信任配置验证；本报告没有独立进行供应商/漏洞网络研究。当前 Fastify 构造没有 trustProxy，不能把条件性代理漏洞描述为当前已证实可利用。Node20 的准确 minor 仍需核验，不能仅凭“20”认定 Vite8 已失败。

## 9. 测试基线、需要迁移的旧测试及实证缺口

| 现有测试/入口 | 已有覆盖或机制 | 1.0 需要补充/调整 |
| --- | --- | --- |
| apps/server/scripts/auth-contract-probe.ts:28–35、38–239 | Fastify inject 单进程、固定短信/captcha替身、OTP负向、cookie、/me/session list/delete/logout。 | 显式测试适配器、生产禁用路径、独立 Session ID、PG repository、同proof并发/重放、两实例/重启、两设备/续期、资格/撤权/故障/CSRF/运营授权。原测试的 sess_ token断言（189–190）不能强迫公开 sessionRef 继续当 secret。 |
| home-library-contract-probe.ts:22–39、69–180 | 清 DATABASE_URL，用 x-user-id 和内存灵感；有跨 owner 列表/候选 404 与 DTO字段保护。 | 改可信 fixture Session，并加真实 PG 旧owner映射/数据保留/owner不串号。 |
| ingest-contract-probe.ts:26–40、150–214 | 清 DATABASE_URL，用 x-user-id；验证裸请求401、另owner SSE404、canonical/legacy路由。 | 测在活动 SSE 中撤权、store unavailable、身份迁移后 owner、持久状态fixture；不是 1.7 全部重放验收。 |
| planner-contract-probe.ts:80–142、286–339、496–517、813–834 | x-user-id + InMemoryPlannerRepository + fake HQ；测私有 Plan/SSE/HQ404、cursor、幂等、编辑/undo/rev。 | 测试setup通过受控会话；保留全部领域断言。真实 PG owner/账号屏障/重启/原子性另设 integration test，不能给 fake 增加“等于生产已验证”标签。 |
| settings-contract-probe.ts:21–51、112–127 | x-user-id + fake queues；只证明 export/delete任务 payload 取当前user，feedback不传user。 | 不把此测试误读为账号删除/导出完成；纳入资格失效和当前退出后拒绝。 |
| scripts/synthetic-probe.ts:6–11、scripts/sse-assert.ts:3–5 | 全栈脚本固定 X-User-Id；synthetic 会触发实际服务写入和导出，SSE脚本会创建 jobs。 | CI显式隔离环境通过受控登录/fixture拿cookie；面向真实环境需对应授权身份。不能跑到任意 API_BASE 或为脚本开启生产后门。 |
| .github/workflows/ci.yml:12–32、45–93 | PG15/Redis7服务；构建/移动/Home/Planner/Settings/migrate/synthetic/SSE。没有 ci:auth 步骤。 | 加认证闸门和隔离PG测试，检查环境mode、schema应用顺序、双实例恢复。当前声明 Node20，主代理结合前端Vite8版本约束复核具体minor。 |

现有命令（本轮未运行）：

    pnpm -F nomad-types run generate
    pnpm -F nomad-prisma run generate
    pnpm -F nomad-server run test:auth
    pnpm -F nomad-server run test:ingest
    pnpm -F nomad-server run test:home-library
    pnpm -F nomad-server run test:planner
    pnpm -F nomad-server run test:planner-domain
    pnpm -F nomad-server run test:settings
    pnpm -F nomad-mobile test
    pnpm -r build
    pnpm run ci:handoff
    git diff --check

有获准的隔离 PostgreSQL 时再进行 migrate deploy、真实owner/会话集成、备份恢复与双实例验证；不要直接运行 db:push --accept-data-loss。Auth repository 的持久/多实例测试目前没有现成 npm 脚本，必须新建并接入 CI。根 ci:probe/ci:sse 是会产生任务和业务写入的运行时脚本，不是安全只读探测。

生产关闭仍缺：真实短信/已启用第三方/腾讯行为验证与真实失败；真实浏览器 cookie、跨站拒绝与篡改callback；同owner两设备、跨重启/实例、退出丢响应恢复；数据库不可用fail closed；账号持久屏障；活动SSE/下载越权；桌面运营授权及撤销；历史owner映射读回；U-Link/U-App适用能力、隐私选择及真实上报/归因；OPS-01隔离恢复点和实际恢复耗时；METRICS-01真实样本N、窗口、P50/P95及失败/未知成本。缺授权账号/服务时记录对应实证未完成，不能用隐藏入口或纯fixture关闭整张1.0。

## 10. 具体读取清单与主代理复核点

完整逐段读取的业务/测试文件：

- apps/server/src/auth/session-store.ts；plugins/auth.ts、error-envelope.ts、trace-id.ts、idempotency.ts、idempotency-redis.ts、queues.ts；index.ts。
- apps/server/src/routes 下现有 auth.ts、account.ts、byok.ts、feedback.ts、home.ts、library.ts、search.ts、ingest.ts、plan.ts 全部。
- apps/server/src/ingest/store.ts（600 行）、pipeline.ts、types.ts、adapters.ts。
- apps/server/src/planner/prisma-repository.ts（1312 行）、source.ts（471 行）、repository.ts、service.ts。
- apps/server/src/fill/service.ts；export/renderer.ts；db/prisma.ts；integrations/telemetry.ts、flags.ts；schemas.ts。
- apps/server/scripts/auth-contract-probe.ts、home-library-contract-probe.ts、ingest-contract-probe.ts、settings-contract-probe.ts、planner-contract-probe.ts（1100 行）。
- scripts/synthetic-probe.ts、scripts/sse-assert.ts；.github/workflows/ci.yml；ops/pve-staging/nginx.conf、nomad-server.service；packages/prisma/schema.prisma（793 行）、migrations/README.md；server/prisma/types/root package.json、server tsconfig.json。
- 历史 1.1、其 validation、1.2 实施文件；AGENTS、CURRENT、Sprint，以及当前正式 epics Story1.0/1.1/1.2 段。

全文程序读取并按相关章节/清单输出：docs/api/openapi.yaml、packages/types/src/api-types.ts、三个 Prisma migration.sql、planner/repository.test.ts（621 行，输出各完整测试标题并复核对应范围）。定向读取当前 project-context、后端架构、数据模型/REST/测试架构相关节、PRD账号部分、锁文件真实版本、交付映射/工程条件；未读取旧环境凭据。

主代理请优先复核四个易出错结论：

1. dbUserIdFor 的二次hash与 PlanJob/HqJob.external_user_id 恢复路径必须随新owner合同一起迁移。
2. 现存 fill/export 裸入口与所有活动 SSE 撤权都在1.0安全闭环中，但完整5.x功能不在本次范围。
3. session.id 当前就是 secret，必须拆分；不能为了保留旧测试断言把secret继续回给客户端。
4. 替身/开发头支撑了当前所有领域probes，关闭后门必须迁移测试 setup、CI/synthetic，而不能因为回归变红重新放开公共身份覆盖。
