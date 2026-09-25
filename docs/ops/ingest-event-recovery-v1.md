# Ingest durable event/recovery v1（实施中）

来源：Story1.7。事件事务、worker/checkpoint、恢复HTTP及持久SSE已接入；客户端durable ACK、跨窗口恢复及有界队列已接入并完成限定实测。真实Provider与原生恢复验收仍开放。

## 日志与恢复协议

- 事件身份为job日志UUID+正seq；cursor为`i1:<lowercase UUIDv4>:<canonical decimal>`，0表示尚未确认事件，不接受裸0。PG bigint上界9223372036854775807，传输用string，不经JS Number。
- 先授权job，再解析cursor/读取事件。header和query同时存在须完全相同；重复参数、空值、负数、前导0、溢出和控制字符拒绝。cursor不承担身份认证。
- 每job日志命名空间持久且独立于attempt；retry不重置seq。普通snapshot的head_cursor只是提示，不是durable ACK。
- 新事件与snapshot/version/last seq同事务，结果持久化也追加事件。immutable event UPDATE被拒绝；默认不删除历史日志。
- 旧job新增列默认stream=NULL、seq=0、execution_pending=false，迁移不重放历史工作。安全adopt只写当前事实checkpoint，不伪造过去阶段，不派发原任务。
- `GET /ingest/:jobId/recovery`返回no-store。默认replay从已确认cursor继续（缺省为该job的0）；显式mode=resync禁止header/query携cursor，返回head事件的原子snapshot/cursor。retention过旧返回resync；错job、ahead、malformed分别拒绝，数据库故障不伪装空历史。
- `event-replay.ts`每页重新检查owner/session并持有job共享锁；同一head/floor内最多20条连续事件，单事件60KiB、页面256KiB上限。内部缺seq或损坏拒绝；只有读完当前终态head才给complete（含attempt/version），已确认终态head不重发业务帧。旧attempt的failed不会截断新attempt。
- DB两条SSE路由均从持久日志按同一边界回放/tail，业务帧携cursor id；complete/resync和heartbeat无业务id/seq。每帧重查会话/owner，按最多50业务帧/秒发送，heartbeat每3秒独立运行；9秒未能成功发送heartbeat即关闭。无DB的显式fixture仍走旧内存流。
- raw sender复制Fastify响应头并在首帧鉴权通过后hijack，使用真正socket.write/drain背压，逐帧≤64KiB、应用待写缓冲硬上界≤192KiB、等待写入最多1秒；鉴权超时2秒。默认generic SSE仍用原plugin，不改变Planner等既有协议。
- 完整任务在首次异步DB读取前登记；preClose设置closing门禁，取消并等待初始化/活跃流，再进入worker/DB关闭。complete在发送队列鉴权后重新持有资格与job共享锁，锁保持到实际控制帧写出/finish；此时已经提交的新retry不会被旧complete截断。
- Native/EventSource可能给无id控制帧附上继承的lastEventId；客户端必须按control类型处理并忽略该传输id，不将它当新的业务ACK。客户端按以下持久确认规则消费控制帧。

## 持久执行与阶段恢复

新DB任务默认把job、初始事件、command和execution_pending同事务提交；用户retry同事务增attempt、清checkpoint/恢复次数，并保留已有partial结果。重复command只读原回执，不清活动lease。`enqueue=false`仅供内部隔离生产者探针，HTTP不接收该选项。无数据库的显式内存fixture保留原管线；Set/queueMicrotask不再派发DB任务。

claim采用owner→job锁序，User共享锁与job排他锁跳过忙行，按UUID分页扫描，首32条占锁不阻断后方任务。每次claim递增fence；renew/release、阶段、checkpoint、结果及terminal实际SQL写入检查owner资格、用户attempt、worker、fence和DB当前时间。终态snapshot/event提交同时清pending/lease。

checkpoint私有载荷不进入事件DTO，按明确schema/版本/用户attempt验证，限制为2MiB；阶段为ready→fetched→extracted→standardized→rehosted→saved。阶段输入/结果与对应事件同事务，saved checkpoint与实际结果写入同事务。恢复沿原job/attempt继续；已saved只补terminal，不重写结果或重复调用前置步骤。当前adapterRevision为fixture-v1，不是未来真实Provider版本。

调用前持久化inFlight及inFlightReplayable。外部fetch结果未知时，即使重启移除了下载器配置，也返回INGEST_RECOVERY_UNCERTAIN；原纯fixture步骤改配成外部下载器同样拒绝恢复。独立步骤期限覆盖fetch和未结束的response body；超时中止等待，未知外发保留INGEST_STEP_OUTCOME_UNKNOWN。未来真实适配器必须延续调用类型/版本和未知结果合同，不能借本fixture证明exactly-once。

## 运行参数与生命周期

| 参数 | 默认 | 范围/含义 |
| --- | --- | --- |
| INGEST_WORKER_MODE | disabled | enabled/disabled |
| INGEST_RECOVERY_ISOLATED | true | 显式false且worker enabled才领取 |
| INGEST_LEASE_MS | 30000 | 1000–300000ms |
| INGEST_POLL_MS | 1000 | 100–30000ms |
| INGEST_CONCURRENCY | 2 | 1–16 |
| INGEST_STEP_TIMEOUT_MS | 30000 | 100–300000ms |

恢复/迁移实例默认零claim/dispatch/外发；必须先核对恢复数据、owner资格和有效停用/删除抑制，再受控解除隔离。真实模式新导入仍由INGEST_CAPABILITY_UNAVAILABLE拒绝，未实现真实适配器时不能启用生产worker；隔离探针显式注入fixture capability，绝不改成真实已可用。

onReady先验证所需schema，再启动有界领取；onClose停止领取/续租，abort等待中的步骤并按当前token释放，然后断开Prisma。claim期间收到关闭时只释放，不开始执行。失租/撤权会停止发布，普通浏览器logout不取消已受理job。每次claim计入无进展次数，成功提交checkpoint后清零；连续5次领取无已提交进展以INGEST_RECOVERY_EXHAUSTED结束当前attempt，可由用户显式retry。失败释放按1/2/4/8/16/30秒封顶退避，领取故障也指数退避至30秒，不无限立即重启。

本迁移为保留数据的加法结构，采用前向修复；已有新事件后不承诺drop表式无损回退。旧应用可读旧字段，但正式切换前必须停止不写事件的旧worker/写入者，验证新进程后再开放。当前新应用没有部署到既有staging release或公有云。

## 已验证范围与未关闭项

- 真实PG16项worker：4次SIGKILL覆盖受理、领取、fetched、saved后；原job/attempt续跑、结果不重复、command/checkpoint/result事务回滚、managed retry/partial保留、未知外发跨配置、未结束HTTP body期限、无进展上限。
- 实际Fastify隔离模式零claim、停止abort/释放、下次启动继续；实际buildApplication关闭时，在真正Prisma断开前观察到lease已释放且pending保留。采用隔离PG、显式fixture adapters和本地HTTP替身，非真实Provider验收。
- 租约12、事件core8、生产者18、恢复HTTP/分页10项PG回归通过。恢复HTTP使用真实PG Session鉴权与Fastify注入请求；153条分页、页间提交、retention、旧终态、内部缺seq、owner/session撤销均已覆盖。
- 本地35项ingest及56项auth测试（共91）、完整workspace build通过。三层限定审阅的worker问题及两项SSE竞态均已修复复核；各切片证据不替代完整Story验收。
- 已完成的真实SSE范围：两个独立服务进程、SIGKILL后补读、页间提交/旧终态/终态鉴权竞争、真实小TCP接收窗口不读取、有界待写缓冲触发背压关闭、原cursor重连、隔离测试库真实禁连接/断开/恢复、长idle与持续回放heartbeat、空闲撤权及首次DB读等待期间preClose。均为loopback HTTP与显式trusted-proxy测试头，不是实际TLS或native设备验收。
- 活跃fetched checkpoint已实际dump到新恢复库，验证原记录一致、隔离启动零派发、受控启用后不重做fetch、原job/attempt续跑及停用owner抑制。源库/恢复库/dump均保留。生产PITR/RPO及最新删除抑制仍需独立实证。Story1.7仍in-progress。


## 验证环境版本与维护事件

2026-09-19的Ubuntu unattended-upgrades/needrestart在06:33–06:37 UTC更新系统并反复重启共享服务，PG由先前16.14变为16.15。这一事件已按只读证据确认为自动维护，报告位于`_bmad-output/implementation-artifacts/investigations/vm104-postgres-restart-2026-09-19-investigation.md`。原16.14报告保留历史；SSE及受影响auth/worker/lease/event/producer/recovery回归在16.15重跑。

探针启动前检查apt-daily-upgrade的ActiveState（包含oneshot的activating）；运行中则不启动。长probe的内层180秒期限由外层270秒SSH观察期限覆盖，包含schema生成和进程组清理；短probe外层150秒。超时先TERM后KILL整个探针进程组，避免遗留服务或先丢失控制进程。没有更改系统安全升级策略；探针的数据库故障注入仅修改严格匹配的隔离库，并用独立控制连接在finally恢复。


## 客户端持久确认与公平补读

operationJournal升到IDB v2，保留旧operations/claims/keys，增加owner/job checkpoint。AES-GCM快照与cursor在同一事务内提交；AAD绑定owner/job/日志游标/版本/期限/密钥代次。容量2048、期限不超过原回执7天，损坏记录CAS隔离后仅通过鉴权resync修复。普通GET head不作为ACK；控制帧继承的EventSource/native lastEventId不参与确认。

独立ordered-stream按64条、256KiB总量及64KiB单帧限制串行消费，active计入队列；触限关闭输入并丢弃排队工作，让正在提交的一条完成后从其落盘cursor补读。身份/活动改变立即取消，消费者10秒期限避免永久阻塞。EOF先处理此前已接收的有序控制帧。泛用Planner同步流保持原接口。

同一App一条活跃SSE；多个候选按最久未服务顺序轮转，2秒检查是否需要让出，先等待active提交再切换。已知有历史待补或已保存terminal但未收到complete时，先给予一次有界交付机会（15秒），防止慢首帧被反复提前关闭。所有job包括done/failed均有补读路径。初次恢复10秒期限，失败退避最大30秒，进展清除失败计数。

跨标签页单调事务与resync revision CAS保护cursor；经过恢复协商确认的checkpoint发生日志代次变化时，以实际UI的代次决定重置版本，即使另一窗口已先写入新代次也能收敛。回执本地写入暂时失败保留pending receipt，在后续对账只补写本地记录，不重新POST。noteDone原子取最大attempt；4秒已显示窗口后台暂停，恢复只继续剩余时间。

证据：IDB核心14项（3浏览器进程/2次kill）；实际App+PG+SSE6项（3进程/1次kill、身份往返、完成窗口与多job）；独立压力/双窗口3项按同一冻结代码重复3轮。数量触限实际第65帧，字节触限实际第5帧。重复帧和56000字节padding是明确传输故障注入，后者不进入已保存事实。普通压力探针探索期的未达条件与计数观测修正不计入冻结通过样本。

WL-RECOVERY局部测量在`evidence/story-1-7-measurement-2026-09-19/recovery-report.json`，沿用1.6单时钟、nearest-rank、缺失不补零和成本未知null原则。两variant各N=3；计时包含人为阻塞/准备与补读，不能作为正常导入性能。WL-IMPORT当前15请求矩阵另存matrix目录。staging基线、用户版本化目标/费用、双端实机C07和生产PITR仍未关闭。


## 私有PITR与受控服务端基线补证

备份工具及未安装daily模板位于`ops/postgres/`。私有PG physical base/WAL指定时点恢复6项、7项备份工具本地反例通过，两个临时实例已停止，共享PG保持原启动时间和archive_mode=off。详见`story-1-7-pitr-validation-2026-09-19.md`；正式异机备份目标/RPO和完整应用恢复仍待落实。

VM104受控staging模式服务补读基线12样本（每job152事件，4variant各3次）已封存，严格reader4反例与runner2反例保护失败归因及进程清理。源码按实际传输UTF8/LF核验；仅同机HTTP/隔离数据/合成session，不声称生产目标已批准。见`story-1-7-server-baseline-2026-09-19.md`。三组本地反例已加入CI，CI不会安装备份模板或运行homelab命令。
