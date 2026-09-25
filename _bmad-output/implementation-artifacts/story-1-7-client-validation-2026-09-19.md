# Story1.7 客户端与恢复库限定验收

状态：in-progress。T0–T4实现与隔离证明已完成；本记录补T5–T8的独立工作，不代替原生设备、生产恢复和正式指标门槛。用户要求完成本Story后停止，1.8未派发。

## 当前结果

| 范围 | 已验证证据 | 实际边界 |
| --- | --- | --- |
| IDB v2、加密checkpoint与CAS | `evidence/story-1-7-checkpoint-2026-09-19/browser-core.json`：14项、3进程、2次SIGKILL | 真实Chromium IDB/WebCrypto；含v1保留、损坏/AAD、late quarantine、noteDone、跨代次CAS、落盘前后kill、容量/期限 |
| App/PG/SSE恢复 | `evidence/story-1-7-client-2026-09-19/pg-browser.json`：6项、3进程、1次SIGKILL | 真实App/PG16.15/HTTP SSE/IDB；身份路由为明确本地fixture，非真实短信/TLS |
| 数量/字节压力与双窗口 | `pressure-repeat-1/2/3.json`：每轮3项，共3轮 | 数量第65帧关闭、字节第5帧关闭；每轮额外76个重复帧/5个56k填充帧；active提交后以其cursor补读，两窗口均实际visible |
| 旧输入动作持久化 | `journal-regression/report.json` | 真实双浏览器进程及WebCrypto，无服务器流量；不单独证明控制器接线 |
| Dock/FIFO/Sheet及布局回归 | `dock-regression/report.json`：21项 | 真实DOM/IDB，HTTP/clipboard/deep-link为明确fixture；FIFO不抢占、Sheet覆盖11秒不计完成、44px、无横向溢出、reduced-motion、原operation恢复及身份隔离 |
| 活动checkpoint备份恢复 | `evidence/story-1-7-active-restore-2026-09-19/report.json`：4项及源库不变核验 | 新source/copy数据库、实际pg_dump/pg_restore；恢复实例先零派发，受控启用后跳过已fetched步骤；停用owner仍不派发 |
| 构建与类型 | `mobile-tests.txt`、`workspace-build.txt`、`type-generation.txt` | 242移动测试+3原生配置检查；workspace及OpenAPI生成通过 |
| 原生工程 | `native-sync.txt`、`native-project.json`、`android-build.txt`、`android-artifact.json` | 双端sync、Android debug构建243tasks/14s，APK内Web资产逐字匹配dist；iOS未编译，双端实机未验收 |

表中未带完整目录的文件位于`evidence/story-1-7-client-2026-09-19/`。截图`completed-before-background.png`和`owner-b-isolation.png`已实际查看，前者显示真实保存事实，后者没有A的私有任务内容。

## 审阅与修补

三层限定审阅（blind/edge/acceptance）覆盖checkpoint核心及transport/watch/controller接线。确认并修补：

1. cipher/AAD损坏不能被普通新事件覆盖；隔离写入CAS避免误伤另一窗口的新修复。
2. 另一窗口已resync到新日志代次后，本页普通恢复及force restore均按实际UI代次重置版本。
3. 已受理但本地mark失败时保留原回执并自动补写，不重新POST。
4. 单条长期运行任务不饿死后续任务；轮转等active提交，已知backlog和未确认complete的terminal有有界首交付机会，慢连接不会在2秒前反复被关闭。

最终原审阅者复核以上分支关闭；三层未报告其他确认运行缺陷。Web/native协议接线的验证范围与设备运行证据分别记录。

## 探索期失败及证据修正

压力测试最初逐条经本机到VM的数据库写入不足以在消费者期限内构成稳定突发，未达条件运行保留为失败。随后仅断言连接close的探索版本也不足以确认触发原因，曾出现“注入”标签但累计数为0；该结果不作为当前压力验收。现使用独立单任务场景、真实PG连续事件、显式重复帧/字节填充注入，并在生产监听器前计数实际收到的帧，断言65或5再确认落盘与补读。冻结后的3轮是独立重跑，样本不混入上述探索期结果。

旧Home DOM探针使用`job-N`伪ID，触发新版ing_UUID协议校验并遮住输入提示。探针已改为合法synthetic ing_UUID，实际UI/输入回归21项通过；未为测试放松运行时协议。新增Sheet覆盖超过完整10秒窗口后noteDone仍为0的实际DOM断言。

## 测量与工作负载

`evidence/story-1-7-measurement-2026-09-19/matrix/{samples,report}.json`复用1.6 WL-IMPORT原合同：15个逻辑请求、25秒窗口、原场景计划、单时钟及明确失败/未知/缺项，不改变产品目标。当前统计使用新源码指纹。

`recovery-report.json`冻结WL-RECOVERY pressure v1：count/bytes两个variant，每个重复3次，计划/观测N=6，全部通过、缺失0；每压力case一条活跃job/SSE，随后两实际可见窗口竞争共享IDB。同进程performance.now记录case开始到补读完成，包含人为阻塞、fixture准备和读取，不是服务器处理耗时。nearest-rank：count P50约8378ms/P95约8691ms，bytes P50约9190ms/P95约9488ms。样本很小，只作回归诊断；实际供应商、usage/cost、服务阶段时钟校准、staging基线和目标版本为null。未平均各轮P95，未把FIFO时间当解析性能。

功能矩阵另由固定server worker4个kill点、SSE12项、IDB14项、App6项和压力/双窗口3项的源码/报告定义；它们不是同一性能分母。没有模型人评的恢复正确性分支也不代替其他Story的8.2人评。

## 迁移与运行

迁移`20260919000300_story_1_7_ingest_event_log`保留原表/回执/partial引用，加事件日志/seq/floor/lease/checkpoint；采用前向修复。新增写入后不承诺drop表式无损回退。正式切换必须先停止不写事件的旧worker/写入者，当前没有部署新应用到现有staging release或公有云。

活动恢复库与原固定SQL恢复fixture互补：本次验证fetched活动checkpoint及停用owner；前序固定fixture验证partial引用。源库`nomad_auth_test_4bb4e8f8be64_recovery_src`、copy库及254027字节dump均保留，私有目录和SHA在恢复报告。不是指定时点PITR/RPO或当前删除抑制全量清单验证。

## 尚未关闭的真实门槛

- Android10+/iOS16+实机C07：断网、后台、杀进程、身份确认、原job/cursor、无新POST/旧owner连接及原生失败恢复。当前Android仅编译，iOS缺可用Mac/Xcode/签名/实机证据。
- OPS-01生产每日全量、15分钟增量/PITR、指定时点新实例恢复/RPO，以及恢复前有效删除/停用抑制全量核验。
- METRICS-01/02真实staging固定版本基线、同口径候选、用户版本化体验/费用目标。当前故障fixture不能替代。
- 真实屏幕阅读器、设备键盘/安全区等宿主证据按APP-HOST-01继续，静态/DOM检查没有冒充实机。

已有法律、原生和归因资源问题已在当前任务提出；不重复索取已有Key。1.0/1.6/9.1仍履行各自门槛，3.1保持暂停。以上必要证据未齐备，不将1.7标review/done，也不进入1.8。
