# Story1.7 开发进度（2026-09-19）

状态in-progress。已授权持续开发；启动前源码/元数据快照在`/tmp/nomad-story17-start-20260919`。
当前分支沿用codex/story-1-0-production-auth，保留所有前序未提交成果；1.0/1.6/9.1真实门槛和3.1暂停不变。

## 当前切片

- 已落下cursor纯协议：`i1:<job持久日志UUIDv4>:<十进制bigint>`，上界9223372036854775807，不经JS Number；header/query冲突、重复、malformed、错job、超前、retention下界显式区分。
- OpenAPI补durable event、recovery响应和无业务id控制帧，heartbeat不携业务seq；API实现尚未接线，不能把生成类型当端到端恢复已完成。
- 新迁移20260919000300_story_1_7_ingest_event_log新增event、seq/floor、lease/fence和checkpoint字段；旧job默认不adopt、不派发。事件update在DB被拒绝，seq唯一；生产保留删除没有启用。
- ParsingSubStage新写限制到五种canonical值，快照记录/离开parsing清理；旧wire兼容类型保留。cursor+状态9项测试、类型生成与server typecheck已通过。
- 持久事件仓储、原事务接线、worker领取/恢复、SSE tail与客户端durable ACK均还在后续任务，不标T1/T2/T3完成。

## 迁移验证

已扩充原homelab隔离migration probe的`--include-event-log`（隐含1.6）：旧job默认保持、当前事实baseline、事件不变/seq唯一/拒绝旧诊断写入及dump/restore。只创建新数据库，不启动worker或应用，不读取现有发布env。
实际执行/结果在拿到工具证据后追加；此时不以dry-run或本地生成声明数据库验证已通过。

## 立即后续

先运行新隔离PG迁移/恢复验证，然后将新event追加接到受理、retry、阶段和persistIngestOutput同一事务。不能有先写result/version后异步补event的间隙。新schema在真实连接上必须preflight；旧事件只可从实际基线/resync恢复，不捏造历史。


## 事件生产者事务切片已接入（覆盖上文“尚未接线”节点）

受理初始事实、用户retry、阶段/诊断与persistIngestOutput保存事实现在都通过同一event writer更新snapshot/version/last seq并追加不可变事件。原回执和sourceHash去重保持，result/资产/候选变化不会先commit后补event；通知/缓存只在事务完成后消费。checkpoint只记录真实当前状态，旧job首次读取并发只初始化一次；owner限定查询先于旧数据加载，错误owner不能adopt。新诊断入snapshot，非parsing时清空；公开DTO只保留允许事实并去掉原始URL等额外属性。

cursor使用无损bigint十进制和持久日志UUIDv4，现有三端ASCII/128边界可容纳。API-first已定义recovery/control，但**服务端持久SSE/恢复路由与客户端durable ACK尚未接线**；lease/checkpoint字段也不等于worker已可恢复。当前pipeline仍是前序内存派发，真实新导入仍被既有能力门槛阻止。

真实PG16.14的新库`nomad_auth_test_32ebbc42aabc`和`_restore`已过新迁移/固定SQL checkpoint的dump恢复；未启动worker，原业务库/发布未动。私有env在VM104 `/tmp/nomad-auth-validation-wir7n3sw/test.env`，临时源码`/tmp/nomad-auth-workspace-t3ktipoj`，备份摘要见local-validation。该dump先于后续Node生产者测试行，只证明所列SQL恢复fixture，不冒充全部worker活跃状态或生产PITR。

PG事件core8项、扩充生产者18项实测通过，包括global client不能冒充事务、两连接CAS单赢家、event失败及整个事务回滚、immutable UPDATE、过期job资格拒绝、结果/资产/候选写入后的event失败全部回滚、双独立进程legacy首次adopt单checkpoint、错owner零adopt和原partial保持。启动schema预检现在同时要求不可变触发器和关键约束，禁用触发器负例已过。

本地27个ingest测试、217移动+3原生配置、2个聚焦合同、类型生成/完整workspace build通过。三层限定review未发现可确认运行缺陷，指出的两项证明缺口已用新增3条真实PG检查关闭。此结论只覆盖当前事件事务切片，1.7仍in-progress。

**立即继续T3/T4/T5：PG持久执行意图/lease/fence/checkpoint、恢复实例禁派发、真实kill/restart、owner-safe DB事件回放/tail/控制与客户端checkpoint ACK。** 不重复准备合同或重做1.6输入日志，不把旧Set/queueMicrotask和快照轮询当完成。现有JSON证据与源指纹在story-1-7-local-validation-2026-09-19.json。


## T3租约核心与受管写入（2026-09-19）

实现默认隔离策略、按owner资格/DB时间的claim/fence、续租/释放及managed phase/result门禁；终态清pending/lease与快照事件同事务。三层限定审阅修复实际UPDATE过期检查、owner锁阻塞和32候选饥饿三项，并补合法结果、release退避、claim后资格撤销两组证明；原审阅者已只读复核关闭。

真实PG12项lease、8项event core回归、18项producer回归，29本地ingest、server tsc及完整workspace build通过。精确日志在`evidence/story-1-7-lease-2026-09-19/`；上一event切片指纹报告另存，不把旧指纹套用当前代码。无真实供应商调用/生产变更。未重复无变化的移动/native测试，其217+3只是保留上次基线。

当前仍需把持久pending写入accept/retry事务，接入startup/周期调度、阶段checkpoint和onClose收敛；恢复路由/DB SSE、客户端durable ACK也未接线。T3整体及Story未关闭。继续同一持续目标，不需要常规授权。


## 恢复HTTP与有界事件分页（2026-09-19）

新增event-replay.ts与受保护/recovery：owner先于cursor和payload，job共享锁下读取head/floor/事件，20条/60KiB单帧/256KiB页面边界。缺内部seq拒绝，retention给resync，head只是提示；当前terminal排空才complete，老attempt终态不提前关闭新attempt。实际SSE仍旧路径、客户端尚未消费durable ACK。

10项真实PG检查（含实际Session/authPlugin的Fastify HTTP注入）通过，153条/页间提交/旧终态retry/retention/legacy/gap/账号和会话撤销都覆盖。三层限定review无确认行为缺陷，补齐1项OpenAPI header合同并重生成类型，接受审阅者已复核关闭。29本地ingest、tsc与完整build通过。记录`evidence/story-1-7-replay-2026-09-19/`；不是双服务真实socket或native证据。

下一实施仍需持久pending/worker/checkpoint、真实DB SSE回放tail和每job客户端持久ACK；保持1.7 in-progress及原资源门槛，不请求重复授权。


## 持久worker/阶段恢复已接入（2026-09-19）

DB新受理及用户retry默认同事务写pending；重复回执不重置lease/checkpoint。内存fixture保留旧管线，DB任务只由claim/lease worker派发。checkpoint按版本/attempt/阶段验证，私有载荷2MiB上限，不进入事件DTO；ready→saved按已提交事实继续，saved后仅补terminal。用户retry清checkpoint/恢复次数而保留原partial结果及job级seq。

有界并发与续租、claim故障退避、连续5次领取无进展上限、独立步骤期限、onReady/onClose顺序已接入。三层审阅发现的2项行为问题已修补复核：inFlightReplayable持久化防止跨配置把未知外发改成fixture；response body未结束也受deadline约束。managed retry补证与完整app停机顺序补证已通过。

真实PG16项worker（4处SIGKILL：accepted/claimed/fetched/saved），旧lease12/core8/producer18/recovery10回归，35 ingest+53 auth/88总测试及完整workspace build通过。最终源码指纹见local-validation，精确结果`evidence/story-1-7-worker-2026-09-19/`。PG producer旧测试显式enqueue=false，专测原事务；新的worker矩阵才证明真实派发/恢复。所有adapter都是明确fixture及本地HTTP替身，生产Provider gate仍关闭。

完整buildApplication调用full.close时，在真正Prisma.$disconnect之前观察到活动lease已释放且pending保留；Fastify隔离模式0claim，停止中止HTTP等待，再次启动安全处理持久任务。不是双实例真实SSE、客户端落盘ACK或native设备实证。活跃checkpoint dump/restore及生产PITR/抑制核验仍未完成，T3保留对应子项。

**最新用户边界：完成当前Story1.7后停止，不进入1.8。** 此指令覆盖此前继续全部后续Story的自动派发范围；现在继续1.7持久SSE、客户端durable ACK及剩余恢复验证。不能把局部worker完成当整个Story完成。


## T4持久SSE已接入并完成服务端实测（2026-09-19）

两条DB SSE路由现消费同一PG事件分页/尾读，业务帧id=cursor，控制帧/heartbeat无id。raw sender保留每帧鉴权和空闲撤权，复制响应头后hijack，用实际write/drain背压（1秒写期限、64KiB帧、192KiB待写上界），不走plugin无界push队列；其他generic SSE默认仍保持原plugin。发送按50业务帧/秒上限，独立3秒heartbeat，9秒未送出则关闭。

三层review修复2项竞态并补真实socket反例：首个await前登记初始化连接和closing门禁；terminal鉴权后持owner/session/job锁核对最新head，直到control实际write/finish。并发retry抢先提交时跳过旧control继续读取；preClose也能关闭初始DB读取正阻塞的请求。

最终12项真实socket/PG检查通过：两个Node服务实例、服务SIGKILL后原cursor补读、分页间新提交、旧终态和终态authwait期间retry、协商后floor变化resync、真实SO_RCVBUF=1024且不读取的Python TCP客户端、原cursor继续、慢回放与idle heartbeat、测试库真实禁连接/后端连接终止/恢复、会话撤销及停机。实际最高50业务帧/秒；idle最大间隔约3.02秒；慢socket在待写66,006字节、660帧后背压关闭，未堆积4001条历史。网络为loopback HTTP+显式trusted-proxy测试头，不是原生设备或真实TLS验收。

91本地测试（35ingest+56auth）及完整workspace build通过；PG16.15复跑auth HTTP27、worker16、lease12、event core8、producer18、recovery10均通过。完整结果`evidence/story-1-7-sse-2026-09-19/`，源码指纹见local-validation。没有把失败的环境/测试准备运行当通过，也没有以服务端ACK代替客户端落盘ACK。

### VM104重启调查（用户明确要求）

确认自动unattended-upgrades→needrestart在06:33–06:37 UTC升级系统并多次重启PG、Nomad/Nginx/Redis。只读直接命令/单位日志与定时器链已封存；升级由PG16.14到16.15，结束后现有服务与/api/health健康。详见`investigations/vm104-postgres-restart-2026-09-19-investigation.md`。未修改安全升级策略；本地probe增加维护ActiveState预检并把SSE外层观察期限从90s延至210s以覆盖内层180s。

**下一继续T5/T6客户端每job加密checkpoint、IDB单调CAS、异步有界消费和bootstrap/resync/complete；现有客户端尚未消费新durable协议。** 另完成活跃checkpoint恢复库、WL-RECOVERY及实际可用平台验证，原生/真实资源门槛保持。1.7仍in-progress，完成后按用户指令停止，不进入1.8。


## 最新：客户端durable ACK、真实浏览器及活动恢复库（2026-09-19）

T5/T6实现已接入：IDB v2加密快照与cursor同事务、旧库/密钥保留、跨窗口单调CAS/腐坏隔离、回执补写、串行消费64条/256KiB、显式resync/complete及每job公平轮转。review修复两组存储/代次问题与慢首帧/终态轮转边界，原审阅者复核关闭。当前源证据与真实范围见`story-1-7-client-validation-2026-09-19.md`。

核心真实Chromium14项、App/PG/SSE6项、压力/双窗口3项同代码重复3轮均通过。压力收到第65帧或第5个56k填充帧关闭，active事务完成后从其cursor补读；真实双窗口迟到提交不回滚。故障注入与synthetic auth routing明确标注。活动fetched checkpoint实际dump/restore验证零dispatch、受控续跑、停用owner抑制，原库/恢复库/dump均保留；未声称生产PITR。

242移动+3配置、完整build、类型生成、双端sync、Android243tasks/14s以及APK Web资产匹配通过；旧输入journal真实两进程回归通过。UI原HTTP fixture因使用旧`job-N`伪ID触发新版协议校验，改用合法synthetic ing_UUID后回归通过；Sheet超过10秒遮挡补证另行记录。探索期压力仅观察close的不足已剔除，当前冻结3轮要求实际接收帧数及累计注入数量，不用旧不准确标签宣称通过。

WL-IMPORT本轮15请求原合同矩阵；WL-RECOVERY count/bytes各N=3，以同process单调时钟记录故障准备到补读完成，nearest-rank P50/P95，未混入导入处理耗时。使用真实PG/SSE/IDB但外发/身份是明确fixture，成本/生产指标未知null。

当前独立实现已收口至真实资源验收：Android/iOS实际设备C07、iOS Mac/Xcode/签名、正式staging测量基线及用户版本化目标/费用、生产每日全量+15分钟增量/PITR/指定时点恢复/RPO与有效删除抑制。已有资源问题仍待回复，不重复索取密钥；1.7继续in-progress，不得把这些门槛标not-applicable或以编译替代。3.1暂停，1.8不派发。


## 补充进展：私有实例PITR和备份工具

本轮并非无进展：在新PG Unix socket实例完成physical base+真实WAL指定时点恢复6项，并补安全归档/备份脚本与未安装daily模板、7项本地反例。共享PG未重启/改配；私有实例停止，全部数据/备份保留。三层审阅的partial保留和备份自身ID绑定已修复复核。详见story-1-7-pitr-validation-2026-09-19.md。生产备份目的地/计划/RPO和完整应用恢复、实机及正式指标门槛仍开放，不进入1.8。


## 受控服务端恢复基线已封存

VM104实际PG/staging模式server、152事件、4场景各3次共12样本通过，关闭临时服务后报告。严格reader4反例与runner进程组2反例通过，三层审阅关闭；失败保留部分帧与归因，不吞异常为成功。见story-1-7-server-baseline-2026-09-19.md。该受控基线候选不等于实际产品负载和已批准的生产体验/费用目标；资源/目标门槛保持。已向用户询问独立备份存储目标，尚未收到回复。


## 当前资源阻断审计

见story-1-7-blocked-audit-2026-09-19.md。前一轮为实际progress，本轮重复核验后确认剩余实机/iOS、正式备份目标及生产运行/产品指标门槛仍依赖用户输入或外部状态。相同条件已持续三轮，目标标blocked；不是Story完成或用户主动pause。保持1.7 in-progress，资源补齐后从未完成项续接，不进入1.8。
