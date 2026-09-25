---
project: nomad-mvp
story_id: '1.7'
story_key: 1-7-durable-import-progress-and-restart-recovery
source_story_id: '1.7'
source_contract_sha256: b3693e38e6f12681da44a3cf9e954b06ce8cc0fc09d6b683928ef002b2e6e5e9
source_catalog: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
source_epics: _bmad-output/planning-artifacts/epics.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
source_obligations: []
requirements:
- FR4
- FR19
- FR52
- NFR2
- NFR25
source_additional_requirements:
- NFR20
engineering_conditions:
- OPS-01
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-HOST-01
- CODE-QUALITY-01
- UI-BROWSER-01
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
status: in-progress
prepared: '2026-09-19'
scope_revision: ui-foundation-2026-09-20
delivery_requirements:
- FR4
- FR19
- FR52
- NFR2
- NFR25
updated: '2026-09-20'
---

# Story 1.7: 可跨重启恢复的导入进度

Status: in-progress

准备状态仅表示本合同可进入已授权开发；当前未实现1.7，不表示1.0/1.6/9.1真实门槛已关闭。
下面完整保留源11组GWT（按出现顺序AC1–AC11，最后一组为C07）。delivery的责任绑定之外，源Requirements的NFR20仍适用。

## Story 与源验收合同

As a 旅行者,
I want 导入进度在断网、刷新或服务重启后继续恢复,
So that 我不会丢失任务状态或重复启动同一项导入工作.

**Requirements:** FR4, FR19; NFR2, NFR20; AR5, AR6, AR12, AR14, AR15,
AR20; UX-DR5, UX-DR32
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 一个 owned ingest job 发生可见阶段或诊断子阶段变化
**When** 服务端提交该状态变化
**Then** 在持久层追加包含 job id、单调 seq、stage、可选 substage、事实 counts/title、state version 与 occurred_at 的事件
**And** `(ingest_job_id, seq)` 唯一，事件不可被后续状态原地改写

**Given** 服务端持久化一个新的 ingest 事件
**When** 同时更新 job 的当前状态、最后事件序号和事实摘要
**Then** job 快照与事件在同一数据库事务中成功或失败
**And** 不会出现 job 已前进但对应事件缺失，或事件已发布但快照未更新的部分状态

**Given** 已鉴权 owner 以最后确认 cursor 连接 ingest SSE
**When** 数据库中存在序号大于该 cursor 的事件
**Then** 服务端先按 seq 严格递增回放未确认事件，再衔接实时事件
**And** 重复使用同一 cursor 不重复创建 job，客户端可按 `(job_id, seq)` 幂等消费

**Given** ingest 服务或 SSE 连接在 job 处理中重启
**When** 客户端使用重启前最后确认的 cursor 重连
**Then** 服务端从持久事件记录恢复，不依赖旧进程内存队列
**And** 已确认事件不重复、未确认事件不丢失，终态 job 回放其事实终态后正常结束流

**Given** 当前解析管线发送诊断子阶段
**When** 事件被持久化和映射到 UI
**Then** 写入值仅使用 `media_prep | speech_detect | frame_extract | asr | multimodal`
**And** `text | ocr | vision` 只作为旧事件的兼容读取输入，不能由新处理流程重新写入或恢复旧阶梯语义

**Given** cursor malformed、指向其他 job、超前于当前序号或因明确保留策略而不可回放
**When** 客户端请求恢复
**Then** 服务端返回 owner-safe 的类型化拒绝或显式 resync 指令，而不是 500、静默跳过或跨 job 回放
**And** resync 只能使用该 job 的权威快照与服务器提供的新 cursor

**Given** 活跃 SSE 暂时没有新业务事件
**When** 连接保持打开
**Then** 服务端按运行策略发送不超过 10 秒间隔的 heartbeat，并保持 cursor 语义不变
**And** heartbeat 不被客户端当成业务阶段或完成进度

**Given** HomeImportDock 正在展示多个 job 且连接中断
**When** 客户端通过 durable cursor 恢复
**Then** 每个 job 保留最后确认状态并只向前应用更高 seq 的事实事件
**And** UI 显示简洁的重连状态，不回退阶段、不重置 FIFO 完成窗口、不制造百分比

**Given** 任意用户尝试订阅或回放不属于自己的 ingest job
**When** 服务端解析 job、cursor 或事件
**Then** 在读取事件载荷前执行 owner 检查并返回标准不可用响应
**And** 事件、日志、Sentry 与分析不包含受保护原始链接、Provider secret、完整私人输入或其他用户标识

**Given** Story 1.7 准备关闭
**When** 运行 OpenAPI/生成类型、迁移、仓储与 route 测试、真实 PostgreSQL 事务和进程重启回放测试、移动重连测试、完整构建及 diff 检查
**Then** 单调性、原子性、owner 隔离、heartbeat、终态回放和所有 cursor 边界均通过
**And** Library 导入记录、URL 去重及新的多模态提取不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C07 — App：App 挂起与导入流恢复

**Given** 已受理的导入任务在 App 后台或进程终止期间继续运行
**When** App 再次确认当前身份并恢复 job/cursor
**Then** 由持久事实对账并重放缺失事件，保持正确队列/终态，必要时从服务端安全状态恢复而非重建任务
**And** 不承诺后台 SSE 常驻，不重置已确认事件或为旧 owner 重连，原生流式传输失败有真实恢复结果


**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**UI recovery regression (CC 2026-09-20):** UI-BROWSER-01进入实际Tasks；组件迁移后补实际render/FIFO/durable ACK与跨owner恢复回归，不改原cursor/operation协议，不解除当前完成后停止边界。

## Tasks / Subtasks

- [x] T0 冻结事件/恢复协议和迁移边界（AC1–11；OPS-01/DB-CHANGE-01）
  - [x] 完整读取下方UPDATE文件，保存当前1.6源码/测试指纹；核对部署PG版本、已有job/command/snapshot、权限及旧新客户端并存范围。只用新隔离库，保留旧库、备份与全部工作树。
  - [x] 记录ADR：job级seq、cursor格式/整数范围、replay floor、历史job bootstrap、保留规则、worker claim/lease/fence/checkpoint及停机行为。现有Map128条不是保留策略；默认不删历史事件，不擅自清理真实记录。
  - [x] 确认来源Requirements/11GWT、六条件与NFR20，不把空source_obligations误读为无需隐私/owner责任；1.6的input-attribution仍由1.6完成。
  - [x] 冻结本地WL-RECOVERY输入规模、并发、分页/发送节奏、进程kill点及截止；配置界限是工程运行参数，不是凭空的产品性能承诺。

- [x] T1 OpenAPI先行定义可消费协议（AC1、3–7、9–11）
  - [x] 扩充持久IngestEvent DTO：ingest_job_id、seq、attempt、stage、canonical substage、counts/title、state_version、occurred_at及完整安全事实快照；区分传输event与snapshot，seq不等于state_version，也不随retry归零。
  - [x] 定义版本化且绑定job日志命名空间的cursor，使用三端支持的安全ASCII、长度和无精度损失的整数序列；明确初始/空cursor、Header Last-Event-ID与query last_event_id、冲突/重复参数、溢出和非法格式处理。
  - [x] 定义受保护的只读recovery协商接口与明确resync/complete控制帧。Web EventSource看不到HTTP错误正文、原生旧桥会抹平非200错误，必须有真正可消费的恢复路径；不是只加一个409 JSON。
  - [x] owner-safe区分malformed/wrong-job/ahead/retention失效及服务不可用，绝不把DB故障伪装成空历史/404或本地猜cursor。resync带同job同一权威版本的snapshot与新cursor，原子接受后再连接。
  - [x] 新写substage只允许media_prep/speech_detect/frame_extract/asr/multimodal；text/ocr/vision仅旧事件兼容读取，UI降为通用解析说明，不推断曾执行新阶段。
  - [x] 同步Fastify schema与生成api-types；保持旧ACK、原command恢复、status/result/retry及两条SSE路由兼容范围明确，不修改生成文件或新建另一套API权威。

- [x] T2 持久不可变事件与快照同事务（AC1–2、5、9–10）
  - [x] 在1.6迁移后追加新Prisma迁移：事件表、(job_id,seq)唯一约束、job last seq/日志命名空间与replay floor、必要执行意图/lease/fence/checkpoint及索引；不改已执行旧迁移。
  - [x] owner+operation受理、初始事件、job快照/last seq与执行意图同事务；同operation重放不添新job/事件/派发。用户retry同事务追加新attempt事件/意图，保留job级seq和已有partial结果。
  - [x] 所有状态/诊断/事实变化统一追加事件并更新快照；尤其persistIngestOutput中的真实结果、snapshot/state_version、event和last seq必须一起commit，不能靠后续terminal emit补洞。
  - [x] 分配seq时锁定job并检查attempt/lease/fence和owner资格；事务失败不前进、不发布，低版本/旧worker回调不更新进程cache。历史event行不原地修正。
  - [x] 为无历史日志的旧job建立显式当前事实checkpoint/下界；不合成过去阶段、不把旧state_version冒充已存在seq。legacy空snapshot继续使用真实已存结果投影；迁移/懒初始化需幂等且并发安全。
  - [x] schema preflight检查新表/列/约束；未迁移时真实模式fail closed，无内存“成功”fallback。回放payload只含允许事实，不含sourceUrl/sourceHash/Provider secret/原始share text或他人标识。

- [x] T3 服务重启后的可靠领取与续跑（AC2、4、9–11；1.6明确交接）
  - [x] 扩展现有Node/Fastify管线，以PG持久执行意图及原子claim驱动startup/周期恢复；只在事务中领取与续租，外部调用不放进长事务。in-process Set只能优化，不能承担唯一派发保证。
  - [x] 每次领取递增fence，使用DB时间检查lease；阶段、结果、terminal、续租及释放都校验当前attempt+fence。过期接管后旧worker不能续租/写入/删除新lease。
  - [x] worker恢复沿原job/用户attempt和已提交checkpoint继续；用户retry才增加attempt，不因重启从fetching退回created或重新创建输入批次。
  - [x] 保存可继续的结果/输入引用；外部调用结果未知时不盲目重复有副作用步骤或声称exactly-once。1.9–1.11真实适配器未交付时继续INGEST_CAPABILITY_UNAVAILABLE；本Story用明确fixture验证崩溃边界，不解禁真实新导入。
  - [x] claim/commit执行runAsAcceptedJob及原owner资格/fencing；正常浏览器logout不取消已受理工作，账号停用/资格变化阻止旧工作发布。不可领取未归属/已失效旧job。
  - [x] 恢复/迁移预检实例启动时明确禁止claim、续跑与外发；先验证恢复数据、owner资格和有效停用/删除抑制，再受控启用worker。含未终态job的恢复实例需验证零dispatch，解除隔离后才沿原job/checkpoint恢复，不因onReady自动扫描绕过此屏障。
  - [x] onReady先校验schema再启动领取；onClose先停claim/续租并让本实例任务收敛或释放到可恢复状态，再断开DB。记录lease/重试/退避/最大并发/终止失败策略，避免无限恢复风暴。

- [x] T4 owner-safe回放→tail和终态协议（AC3–7、9–10）
  - [x] 读取事件载荷前验证请求job owner与账号/当前会话；续流沿用auth/sse每次send复核和空闲撤权，不用cursor、客户端expected字段或通知代替授权。
  - [x] 从持久seq按升序分页读取，分页末尾和live tail使用同一查询边界；跨实例、丢通知、commit后进程退出仍不漏事件。采用DB日志作为真相，通知只是可丢的唤醒。
  - [x] 有界读取/背压/发送节奏要兼容auth/sse 64队列和双端100事件/秒、64KiB行/约256KiB事件限制；不能一次突发整个历史、取消保护或无限堆内存。慢消费者安全断开后从已确认cursor恢复。
  - [x] heartbeat独立于业务事件且间隔≤10秒，无业务id/seq、不改cursor、不推进阶段；长空闲与慢回放都需验证，不用快速terminal测试替代。
  - [x] 当前job终态需排空应交付事实再发送complete/关闭；cursor已经等于终态head时不重复terminal业务事件。旧attempt的failed不能截断后续retry事件，运行中的新attempt不能被旧complete控制误关。
  - [x] retention截断若启用，floor与删除一致；无可回放历史只走显式权威resync，不静默skip。客户端协商与SSE建立间的状态/保留变化也有恢复分支。

- [ ] T5 每job持久确认与三端恢复（AC3–8、11）
  - [x] 复用1.6真实operationJournal，增加owner/job作用域的cursor+已应用事实checkpoint；必要隐私字段沿现有加密/AAD/期限/容量模型保护。IDB升级不能删除旧operation/claims/keys或改用localStorage成功降级。
  - [x] 序列化接收队列：校验job/日志命名空间/seq/attempt/state_version后，先完成必要事实与cursor的同事务持久化，再推进durable ACK。存储失败、身份变化或旧stream回调不推进cursor；已存snapshot保证“落盘后、UI应用前”杀进程仍能恢复。
  - [x] 共享IDB在同一读写事务内读取当前owner/job checkpoint，并比较日志命名空间、seq和版本单调合并；另一标签页/迟到事件/GET/resync不能覆盖较新cursor或snapshot，保留noteDone最大已展示attempt。命名空间切换的resync还需expected-checkpoint CAS，不能用旧响应替换新代次。
  - [x] 客户端串行消费队列按事件数和累计字节双重设限，慢IDB/加密下也有界；触限主动关闭输入流、丢弃未提交缓冲并保留已提交checkpoint，从durable cursor重读，不能跳过未保存事件或无限创建Promise。
  - [x] Web不依赖EventSource自动的received Last-Event-ID当durable ACK：错误时主动关闭并从已持久cursor新建；原生传入同一确认cursor。泛用planner流保持兼容，不把同步boolean改成Promise后立即truthy关闭。
  - [x] 每job独立cursor并与一条活跃SSE/其他job快照对账协作；普通GET最新snapshot不能冒充消费全部事件，GET/replay/resync竞态不能倒退或跳确认。done/failed job也有明确补读/complete路径。
  - [x] 接收resync/complete控制帧和业务事件同序处理；只有同job服务器snapshot+cursor才能建立新checkpoint，控制帧不作为新完成事件。丢失/过期/损坏本机记录时先鉴权并明确bootstrap/resync，不能重POST。
  - [x] 保留1.6 prepare→原operation、未知只读恢复→显式同operation继续、owner/epoch/activity和watch token栅栏。账号变化前后以及A→B→A不得恢复旧owner流或显示旧私有事实。
  - [ ] Android/Swift bridge保留两阶段open/start、owner/session/generation、HTTPS/audience及订阅/帧限制；仅按协议需要补控制帧或错误信息。后台关闭流且前台先确认身份，不新增后台服务、远程推送或取消入口。


- [ ] T6 Dock/FIFO与兼容呈现（AC5、8、11；UX-DR5/32/36）
  - [x] 延用共享HomeImportDock的真实counts/title和简洁重连提示，不加百分比、不新建输入队列、不改Library/Planner职责。
  - [x] 按job+seq幂等消费，同时保留attempt/state_version保护；重复终态不重复排队，旧attempt/低版本高seq异常不得破坏当前事实。
  - [x] 同进程断线前已展示4秒，重连后继续剩余6秒；后台/离页/Sheet遮挡不计时，后续结果FIFO不抢占。完整展示才noteDone，跨进程已完成窗口不重放；未完成窗口按1.6既有恢复合同处理，不将后台时间算完成。
  - [ ] 返回、焦点/键盘、安全区、44px、大字/读屏与reduced-motion保持；新增恢复/拒绝状态用当前模块短文案。R4原型不覆盖所有断线/重放状态，补实际截图/录屏。


- [ ] T7 真实PG、跨进程与传输故障矩阵（AC1–11；METRICS-03）
  - [x] 真实PG验证event插入失败/job更新失败/result持久化失败全量回滚、同job并发seq唯一递增、旧事件不可变；新旧job/bootstrap/原command/partial数据兼容。
  - [x] 两独立进程竞争claim；注入accept提交后未派发、claim后、阶段提交后、结果提交后terminal前kill；重启沿原job续跑。过期接管后旧worker阶段/结果/terminal/续租全拒绝。
  - [x] 两服务实例的真实socket回放，>128条/超过单页、分页间新写/通知丢失、慢消费者/DB中断、长期空闲heartbeat≤10秒、终态head与旧attempt终态边界。
  - [x] cursor无/0、负数/溢出/恶意字符、重复参数、header/query冲突、他job、未来seq、floor失效、相同cursor重放、错误owner先拒绝且事件payload仓储未被调用。
  - [x] 浏览器真实IDB两进程：SSE收到但cursor事务未完成时断开/kill、事务失败/损坏、身份往返、resync与GET竞态、控制帧顺序、FIFO剩余窗口及noteDone；与真实PG服务回放对接，不只各跑独立mock。
  - [x] 双标签页真实IDB反例：高seq先提交、低seq后到、迟到resync与noteDone并发、关闭后第三进程恢复不倒退；输入持续快于持久化时队列双上限/断开/补读成立。另验证恢复实例隔离模式含未终态job启动零dispatch。
  - [ ] Android10+/iOS16.4+实际设备的C07：受理→断网/后台/进程终止→身份确认→原job/cursor补读，无新POST，无旧owner连接；实际原生失败可恢复。编译/模拟器只计对应范围，Mac/签名/真机缺项不伪造通过。
  - [ ] 跑OpenAPI生成、聚焦/受影响既有测试、完整workspace构建、双端sync与实际可运行原生构建、handoff/diff及分离审阅；3.1保持暂停，不因本Story恢复语义重写旧2.2身份。

- [ ] T8 六工程条件与关闭（AC10–11）
  - [ ] OPS-01：扩充隔离dump/restore不变量到events/seq/floor/lease/checkpoint/command及owner资格/partial引用；生产每日全量+15分钟增量/PITR、新实例指定时点恢复/RPO另外取实证；恢复核验/停用抑制完成前禁用worker派发与外发，保留旧备份。
  - [ ] DB-CHANGE-01：提交迁移ID/代码/schema/PG版本、旧新兼容窗口、锁/回填和失败恢复记录；选择实际适用的前向/可逆/备份恢复，验证新增写入不丢，不能宣称任意DDL无损撤销。
  - [ ] METRICS-01：复用1.6测量工具合同，追加WL-RECOVERY与本次WL-IMPORT阶段，固定case/variant/repeat/N/并发/窗口/源码hash；记录正常/失败/未知/重复/重连/kill/缺事件及ACK、持久结果、前台呈现，nearest-rank P50/P95，未校准跨时钟不相减，成本未知null、FIFO不算解析耗时。
  - [ ] METRICS-02：实际staging基线、yimeng-tong版本化目标/体验费用决定、同口径候选证据分开；缺一不关闭，不继承旧Quick或本地fixture毫秒当生产目标。
  - [ ] METRICS-03：封存完整确定性case/variant/repeat及反例/缺失，不把1.7无模型人评分支当全局评测完成；8.2/其他Story仍履行各自真实人评。
  - [ ] APP-HOST-01：逐项保留双端返回/键盘/安全区/读屏、权限适用性、冷暖启动/后台/进程重建、owner/任务和迟到回调证据；不适用必须可检查说明，不能笼统“无原生变化”。
  - [ ] 更新CURRENT、Sprint.condition_progress、File List与本Story证据；11GWT及适用真实门槛齐备才review/done，不标1.8 Library/去重和1.9–1.11多模态已交付。



### UI范围增量任务（2026-09-20）

- [ ] UI-SCOPE-1.7：落实2026-09-20新增条件/义务，保留原已完成实现与真实资源门槛。
  - [ ] CODE-QUALITY-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-BROWSER-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-REGRESSION-1.7：共享组件实际迁移后补render/FIFO/durable ACK与跨owner恢复回归；不重做现有恢复逻辑。2026-09-25用户已在sprint-execution-resume-2026-09-25.md解除全局停止边界，真实关闭门槛保持。

## Dev Notes

### 具体技术方向及必须先决定的边界

1. PG作为job/event/执行意图权威，使用短事务原子claim与fencing；可新建小型`ingest/event-log.ts`、`cursor.ts`、`worker.ts`。不新建工作流平台或第二套任务身份；BullMQ若只是唤醒也不能替代PG恢复扫描。
2. cursor建议`i1:<每job持久日志UUID>:<规范十进制seq>`，长度可保持现有128安全ASCII边界；UUID是公开日志命名空间，不是认证token。服务端先确认请求job owner，再比较该job的命名空间与seq。正确定义初始0和整数上界；采用BigInt时OpenAPI/JSON使用无损十进制字符串，禁止Number强转损失精度。最终协议在T0/T1固化并跨三端测试。
3. 初始建议不自动裁剪新事件；仍实现floor/resync边界并用隔离fixture验证。未来有已批准保留参数才执行真实删除，不用Map128项或数据库TTL擅自截断历史。
4. 无日志旧job只能形成明确当前事实基线；不制造历史事件。没有本机checkpoint的bootstrap与已有checkpoint的补放分开；后者不能因读到新snapshot就跳过所有未确认seq。
5. Native rate/frame限制和auth/sse队列必须一起设计；建议分页+节奏+可恢复背压，避免“后端能回放，原生收到第101条立即断流”的循环。
6. 控制结束以权威head和当前job/attempt为依据，不能把每个failed/done帧当流终点。服务器读到旧终态后同时发生retry的竞态也须测试。
7. SDK退出/清缓存未验证等1.0/1.6真实归因门槛仍保留；本Story无新SDK或媒体Provider接入，不需要因此停掉隔离PG/恢复开发。公开协议和实际账号合法性仍是生产开放前置。

### UPDATE文件的当前行为 → 改变 → 保留

| 文件 | 当前行为 / 本Story改变与保留 |
| --- | --- |
| `apps/server/src/ingest/job-state.ts`、`types.ts` | state_version/attempt快照与宽松事件；补seq/substage/不可变DTO，保留真实结果才done、partial/未知counts及retry CAS。 |
| `apps/server/src/ingest/store.ts` | PG保存snapshot/command，事件只在Map；受理/retry/阶段/结果事务内追加日志与派发/lease，保留owner锁序、sourceHash/legacy alias、不在commit前发布。 |
| `apps/server/src/ingest/pipeline.ts` | Set+queueMicrotask、仅created开始；改可领取/checkpoint恢复，保留runAsAcceptedJob、规范source验证、typed failure与不伪造Provider结果。 |
| `apps/server/src/routes/ingest.ts` | 内存事件和1秒最新snapshot轮询，无id/cursor；改owner-safe DB回放/tail/恢复协商，保留两路由、ACK/原回执/status/result/retry。 |
| `apps/server/src/auth/sse.ts`、`auth/owner.ts`、`plugins/auth.ts` | 每帧鉴权、空闲撤权/64队列、accepted-job资格和browser→owner→session锁序；优先KEEP，仅为背压/结束协议必要扩展，不绕过或用cursor授权。 |
| `apps/server/src/application.ts` | lifecycle目前仅检查schema/关闭DB；补worker启动/停机顺序，保留启动配置在网络客户端之前验证。 |
| `packages/prisma/schema.prisma`、新迁移 | 1.6已有Job.stateVersion/snapshotJson、IngestCommand；新增event/seq/lease，不把command表当日志，不改旧迁移。 |
| `docs/api/openapi.yaml`、`apps/server/src/schemas.ts`、`packages/types/src/api-types.ts` | state_version明确不是cursor；补完整恢复协议和生成输出，旧payload兼容边界明确。 |
| `apps/mobile/src/auth/stream.ts` | cursor仅闭包、同步boolean消费；补durable恢复与异步顺序确认/控制帧，保留其他业务流同步兼容和撤权处置。 |
| `apps/mobile/src/home/api.ts` | 丢弃event元数据只交snapshot；贯穿seq/cursor/恢复响应，不退回裸fetch。 |
| `apps/mobile/src/home/dock-controller.ts`、`dock-model.ts` | 真实日志接线、一活跃SSE、GET对账、attempt/state_version及FIFO；增加每job持久确认与有序控制，保留prepare/unknown/CAS、watch token和已展示attempt。 |
| `apps/mobile/src/home/operation-journal.ts` | IDB事务/owner/AAD/期限、已确认operation及noteDone；扩展安全checkpoint，不重做或删除旧claims/keys，不将草稿自动保存冒称已交付。 |
| `apps/mobile/src/home/HomeImportDock.tsx`、`HomeScreen.tsx` | 简洁真实状态/同一Dock/单Sheet；必要恢复文案，保留Library过滤/选择与Planner handoff、无新百分比。 |
| `packages/native-auth/src/definitions.ts`、Android/Swift Plugin与AuthNetwork | 已有Last-Event-ID、HTTPS/audience、两阶段订阅、限流/帧边界和后台关闭；必要控制/错误协议修改双端同步，不能只改Web。 |
| `apps/server/scripts/auth-ingest-probe.ts`、相关route/state/command测试 | 真实PG竞争accept/retry不等于worker重启；增加真实kill/restart/lease/event/socket断言，不借旧13项结论。 |
| `apps/mobile/scripts/home-dock-browser-probe.mjs`、`operation-journal-browser-probe.mjs` | 真实浏览器/IDB，但HTTP为替身；扩展真实PG事件集成与durable ACK，同时保持明确证明范围。 |
| `scripts/sse-assert.ts`、测量脚本及ops迁移探针 | 旧heartbeat允许12秒且很早终态；补≤10秒长空闲验证、恢复测量和新恢复数据不变量。 |

开发前仍须读取每个实际修改文件的最新完整内容。当前1.6文档前半段记录历史状态，最新追加/源码才是实现事实，不能照旧表重建已完成controller。

### 技术版本与官方资料（2026-09-19核对）

实际工作树：Node22.22.1、pnpm11.7.0、Fastify5.12.1、Prisma Client5.22.0、pg8.16.3、BullMQ5.61.2；React19.2.7、Capacitor8.5.2（插件各自固定版本见lock）。本Story不为追最新版迁移ORM/框架；目标PG版本以实施前实际preflight为准。

- [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)：传输Last-Event-ID属于EventSource接收状态，不证明应用已持久消费；heartbeat可用comment且不写业务id。
- [PostgreSQL SELECT](https://www.postgresql.org/docs/16/sql-select.html)：SKIP LOCKED可用于队列争抢，不提供一般查询一致快照；领取后以fence保护短事务之外的工作。
- [PostgreSQL NOTIFY](https://www.postgresql.org/docs/16/sql-notify.html)与[LISTEN](https://www.postgresql.org/docs/16/sql-listen.html)：事务提交后的通知只是提示，初次监听与查询有竞态；持久DB日志/扫描必须能补回丢通知。
- [Prisma事务资料](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)：当前Prisma5已有交互事务/隔离级别，冲突重试必须有界且不能把外部调用包进重试事务；本Story实际行为由已安装5.22和真实PG测试确认，不照v6/v7文档直接升级。

### UI、跨Story与已有证据

- 复用`docs/ux/home-import-dock.md`、`docs/front-end-spec.md`、`docs/ux/mobile-ia.md`和`_bmad-output/planning-artifacts/ux.md`；R4主图`_bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png`。
- `docs/ux/prototype-coverage.md`明确原型没有覆盖全部重连/失败/混合/可访问性，必须按文字合同补证明。
- 1.6实际已有snapshot/operation journal/FIFO/两进程恢复和217移动+3配置的最新共享安全边界验证；真实归因、原生设备/法律和部分工程门槛未关闭。证据位于1.6 dev-progress/local-validation，不能提升为本Story的durable log或lease已完成。
- 1.8独占ImportRecord与版本化URL去重，1.9–1.11独占新多模态/视频/AMap；本Story不新增分享扩展、远程推送、取消按钮、常驻后台SSE，也不恢复3.1。
- 当前分支`codex/story-1-0-production-auth`、HEAD7250a8a；最近五commit仍是旧2.2/2.1/PVE历史，不代表新3.1已获恢复。大量未提交1.0/1.6/9.1及规划成果共同保留，不reset/clean或从旧Windows镜像复制。

### 工程执行人与关闭证据归属

Codex负责实现/数据库/测量，独立测试与审阅步骤复核；yimeng-tong负责METRICS-02体验/费用目标和适用真实人评决定。六条件逐Story写入Sprint.condition_progress。
旧PG合成库/恢复链及VM104可按已授权范围复用为模板或新建隔离库；既有业务发布与备份不覆盖。OPS-01生产PITR、METRICS-02真实目标、APP-HOST-01双端实机不从本地通过自动关闭。

### References

- `_bmad-output/planning-artifacts/epics.md`：Story1.7完整源合同、Epic1边界。
- `_bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml`：catalog/准备顺序、条件绑定和3.1暂停。
- `_bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml`：FR/NFR归属及无本Story专属source_obligations。
- `docs/prd.md`、`docs/architecture/index.md`、`tech-stack.md`、`backend-architecture.md`、`data-models.md`、`rest-api-spec.md`、`frontend-architecture.md`、`observability.md`、`testing-strategy.md`、`compatibility.md`（后十项位于docs/architecture）。
- `_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md`与`app-implementation-prerequisites-2026-09-19.md`：六工程条件及真实证明边界。
- `_bmad-output/implementation-artifacts/1-6-home-multi-link-import-queue-and-honest-status.md`及同Story dev-progress/local-validation：最新实现和交接。
- `docs/ops/input-operation-journal.md`、`docs/ops/import-measurements.md`：当前日志期限/恢复与测量口径。

## Dev Agent Record

### Agent Model Used

GPT-6 Astra（当前任务配置）。

### 准备复核修补

- [x] 恢复/迁移预检实例在资格和停用/删除抑制核对完成前零claim/dispatch/外发，补启动恢复负例。
- [x] 同owner/job跨标签页checkpoint事务内单调合并及迟到resync CAS，保留noteDone，补第三进程恢复反例。
- [x] 客户端异步接收队列按事件数/字节双上限，触限断开后从durable cursor补读，补生产者快于消费者反例。

### Debug Log References

- 2026-09-19：create-story customization无额外前后步骤；按当前授权、next_story_to_prepare和3.1暂停选择1.7，不按旧backlog扫描覆盖来源顺序。
- 三个只读研究分工核对源合同/条件、后端持久事件/worker、客户端/原生恢复；已采纳完整源NFR20、persist output事务日志、旧attempt terminal、durable ACK与native速率等缺口。

### Completion Notes List

- 完整承接11组源GWT、6项工程条件和当前实现交接，未修改PRD/Epic源合同或宣称代码/生产已完成。
- 创建后进行独立fresh-context准备复核；复核结果记录在同名`-validation.md`，之后方可按ready-for-dev进入实施。

### File List

- .github/workflows/ci.yml

- apps/server/scripts/auth-ingest-recovery-benchmark.ts
- apps/server/scripts/benchmark-stream.ts
- apps/server/scripts/benchmark-stream.test.ts
- ops/pve-staging/bounded_process.py
- ops/pve-staging/test_bounded_process.py
- ops/pve-staging/run-auth-persistence-probe.py
- _bmad-output/implementation-artifacts/story-1-7-server-baseline-2026-09-19.md

- ops/postgres/archive-wal.py
- ops/postgres/base-backup.py
- ops/postgres/test_archive_wal.py
- ops/postgres/test_base_backup.py
- ops/postgres/nomad-pg-backup@.service
- ops/postgres/nomad-pg-backup@.timer
- ops/postgres/README.md
- ops/pve-staging/run-ingest-pitr-probe.py
- ops/pve-staging/read-backup-readiness.py
- _bmad-output/implementation-artifacts/story-1-7-pitr-validation-2026-09-19.md

- apps/mobile/src/auth/ordered-stream.ts
- apps/mobile/src/auth/ordered-stream.test.ts
- apps/mobile/src/home/ingest-protocol.ts
- apps/mobile/src/home/ingest-protocol.test.ts
- apps/mobile/src/home/ingest-checkpoint-store.ts
- apps/mobile/src/home/operation-journal.ts
- apps/mobile/src/home/durable-watch.ts
- apps/mobile/src/home/durable-watch.test.ts
- apps/mobile/src/home/api.ts
- apps/mobile/src/home/dock-controller.ts
- apps/mobile/src/home/dock-controller.test.ts
- apps/mobile/src/home/dock-model.ts
- apps/mobile/src/home/dock-model.test.ts
- apps/mobile/src/home/journal.test-support.ts
- apps/mobile/scripts/ingest-checkpoint-browser-probe.mjs
- apps/mobile/scripts/durable-dock-pg-browser-probe.mjs
- apps/mobile/scripts/durable-dock-pressure-browser-probe.mjs
- apps/mobile/scripts/home-dock-browser-probe.mjs
- apps/mobile/scripts/operation-journal-browser-probe.mjs
- scripts/measurements/run-import-dock.mts
- apps/server/scripts/auth-ingest-restore-probe.ts
- ops/pve-staging/run-ingest-restore-probe.py
- _bmad-output/implementation-artifacts/story-1-7-client-validation-2026-09-19.md

- apps/server/src/ingest/event-stream.ts
- apps/server/src/auth/sse.ts
- apps/server/src/auth/sse.test.ts
- apps/server/scripts/auth-ingest-sse-probe.ts
- _bmad-output/implementation-artifacts/investigations/vm104-postgres-restart-2026-09-19-investigation.md

- apps/server/src/ingest/execution-checkpoint.ts
- apps/server/src/ingest/execution-checkpoint.test.ts
- apps/server/src/ingest/durable-pipeline.ts
- apps/server/src/ingest/worker.ts
- apps/server/src/ingest/worker.test.ts
- apps/server/src/ingest/adapters.ts
- apps/server/src/application.ts
- apps/server/scripts/auth-ingest-worker-probe.ts

- apps/server/src/ingest/event-replay.ts
- apps/server/src/routes/ingest.ts
- apps/server/scripts/auth-ingest-replay-probe.ts

- apps/server/src/ingest/execution-lease.ts
- apps/server/src/ingest/execution-policy.ts
- apps/server/src/ingest/execution-policy.test.ts
- apps/server/scripts/auth-ingest-lease-probe.ts


- apps/server/src/ingest/cursor.ts
- apps/server/src/ingest/cursor.test.ts
- apps/server/src/ingest/event-log.ts
- apps/server/src/ingest/event-log.test.ts
- apps/server/src/ingest/job-state.ts
- apps/server/src/ingest/job-state.test.ts
- apps/server/src/ingest/types.ts
- apps/server/src/ingest/store.ts
- apps/server/src/ingest/pipeline.ts
- apps/server/scripts/auth-ingest-events-probe.ts
- apps/server/scripts/auth-ingest-probe.ts
- packages/prisma/schema.prisma
- packages/prisma/migrations/20260919000300_story_1_7_ingest_event_log/migration.sql
- packages/prisma/tests/ingest-event-migration-fixture.sql
- packages/prisma/tests/ingest-event-migration-invariants.sql
- packages/types/src/api-types.ts
- docs/api/openapi.yaml
- docs/ops/ingest-event-recovery-v1.md
- ops/pve-staging/auth-migration-preflight.py
- ops/pve-staging/run-auth-persistence-probe.py
- _bmad-output/implementation-artifacts/story-1-7-dev-progress-2026-09-19.md
- _bmad-output/implementation-artifacts/story-1-7-local-validation-2026-09-19.json


- _bmad-output/implementation-artifacts/1-7-durable-import-progress-and-restart-recovery.md
- _bmad-output/implementation-artifacts/1-7-durable-import-progress-and-restart-recovery-validation.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- CURRENT.md


### T0–T2事件事务限定审阅与验证

三层限定review没有确认运行缺陷；仅审事件schema/cursor/DTO和producer事务，未将worker/SSE/客户端未实现当本次完成。两项证明缺口已补真实PG反例并复核：persist output的event失败回滚旧partial/资产/候选，legacy双进程单checkpoint及错owner零adopt。

当前27本地ingest、217移动+3配置、2合同、完整build；真实PG16.14 migration/固定SQL checkpoint dump恢复、core8和生产者18通过。源码指纹、精确范围和未关闭项见local-validation。T2涉及lease/fencing的行仍未完成，T3/T4/T5继续；不勾选整任务或Story完成，不借本切片证明生产PITR/原生设备/实际供应商。


### T3租约核心限定审阅与验证

12项真实PG和29本地ingest通过；旧event core8/producer18及workspace build回归通过。三项竞争边界修复和两组补证已由限定审阅者复核，证据见`evidence/story-1-7-lease-2026-09-19/`与最新local-validation。租约核心通过不等于scheduler/阶段恢复完成，因此T3继续未勾选，真实恢复/原生门槛保留。


### 恢复读取限定审阅与验证

恢复HTTP/分页数据层10项真实PG通过，29本地ingest、typegen、tsc/build通过；三层限定审阅无确认行为bug，OpenAPI缺header一项已修补并复核。实际SSE/每job持久ACK/worker生命周期未接线，不据此勾选T1/T4整体；详见最新progress/local-validation及`evidence/story-1-7-replay-2026-09-19/`。

### Review Findings（已处理的限定切片）

- [x] [Review][Patch] renew/release及leased event实际UPDATE再次校验DB时间与完整token，补校验后过期反例。
- [x] [Review][Patch] claim跳过owner排他锁，补整页32个job占锁后继续扫描的分页。
- [x] [Review][Patch] 补合法/缺lease结果、release退避、领取后账号资格撤销的实际PG证明。
- [x] [Review][Patch] recovery OpenAPI声明Last-Event-ID及与query冲突、resync规则，重新生成类型。


### T3持久worker与阶段恢复（2026-09-19）

已接持久pending受理/retry、并发有界worker/续租/释放、ready→saved checkpoint与原attempt恢复、步骤期限及无进展上限。2项审阅行为问题已修：未知外发类型随checkpoint持久化，配置移除/新增不能改写恢复语义；下载response body受独立期限约束。managed retry及完整buildApplication关闭顺序补证已完成。

真实PG16项含4处SIGKILL，通过原job/attempt续跑、saved不重复输出、checkpoint/result/command回滚；实际Fastify隔离0claim/关闭释放，完整app在Prisma断开前验证lease释放。35 ingest+53 auth及完整build通过，旧lease12/core8/producer18/recovery10回归通过。所有adapter为明确fixture/本地HTTP替身；真实供应商仍不可用，活跃数据dump/restore与生产抑制/PITR门槛未关闭。

SSE与客户端durable ACK仍未接线；T3整体保留恢复实例验证子项，Story继续in-progress。详见最新progress/local-validation及`evidence/story-1-7-worker-2026-09-19/`。

- [x] [Review][Patch] checkpoint持久化inFlightReplayable，跨移除/新增下载器配置仍保持原调用类别与未知结果语义。
- [x] [Review][Patch] 增加独立步骤期限，覆盖持续未结束的response body，超时释放worker容量。
- [x] [Review][Patch] managed retry与完整应用关闭顺序的真实PG补证完成，fixture与真实Provider边界保留。


### T4持久SSE与服务端恢复（2026-09-19）

DB两路SSE已改为持久回放/tail；业务id为cursor，control/heartbeat无id，原generic plugin保持兼容。raw transport以write/drain背压、1秒写超时和有界缓冲发送，每业务帧逐次鉴权，最多50帧/秒；heartbeat独立3秒、9秒未送出即关闭。Native继承lastEventId不代表新业务ACK，客户端T5必须按类型区分。

三层限定review修复2项竞态：初始化在首次await前登记并设关闭门禁；complete在鉴权后持资格/job锁至实际write/finish。真实socket探针覆盖两实例/SIGKILL、页间提交、旧终态/终态鉴权等待间retry、实际小接收窗口不读、原cursor重连、隔离库禁连接/恢复、idle与持续回放heartbeat、撤权及初始DB锁等待时preClose。T4完成仅指服务端；客户端durable ACK、真实IDB/三端和活跃checkpoint恢复库仍待完成，不标整Storydone。

测试期间确认Ubuntu自动升级/needrestart导致共享PG等服务重启，已完成只读原因调查与健康核验；PG现16.15，旧16.14报告保留历史。runner补维护状态预检和覆盖SSE内层的外层deadline，未修改系统安全升级策略。最终结果及源码指纹见local-validation与`evidence/story-1-7-sse-2026-09-19/`。

- [x] [Review][Patch] SSE初始化在首次异步读取前进入注册表，preClose门禁阻止迟到开流。
- [x] [Review][Patch] 终态control在发送鉴权后重新持锁核对head，写出/finish前已提交的retry不被旧complete截断。


### T5/T6客户端持久确认、恢复库与限定审阅（2026-09-19）

加密IDB v2、每job事务ACK、typed recovery/control、Web/native有界异步队列、公平单流轮转、原回执补写和FIFO恢复已实现。三层审阅修复cipher/AAD损坏隔离、跨标签页代次UI收敛（含force restore）、受理回执本地失败补写及慢首帧/terminal complete的轮转饥饿；最终限定复核无未处理确认项。核心14项实测、App/PG/SSE6项、压力/双窗口3项重复3轮、活动恢复库4项及source不变证明见client-validation。

本地242移动+3配置、完整workspace build、类型生成、双端sync和Android assembleDebug243tasks/14s通过；APK Web assets逐字匹配本次dist。iOS未编译/实机，Android未完成实机C07；不勾选整套原生运行门槛。WL-IMPORT15请求与WL-RECOVERY两variant各3次为本地诊断，成本null，staging基线/用户目标未批准。

T0–T3勾选只表示规定实现和隔离验证完成；T8生产PITR/RPO与有效删除抑制独立开放。保留1.7 in-progress；真实门槛齐备才review/done。用户边界不变：完成1.7后停止，不进入1.8。


### T8隔离PITR与备份工具（2026-09-19）

归档幂等/冲突拒绝/持久发布、physical base backup失败partial保留、实际备份自身集群ID核验及未安装daily模板已实现。6项真实私有PG指定时点恢复/失败反例、7项本地文件与command seam测试、unit语法和calendar校验通过；三层审阅2项修补复核关闭。两个临时实例已停止，数据/备份均保留，共享PG启动时间和archive_mode未变。

见story-1-7-pitr-validation和evidence/story-1-7-pitr-2026-09-19。archive_timeout=900用显式切段验证；未证明生产每日运行/15分钟观测/RPO、异机存储或恢复后完整应用派发门禁。T8 OPS-01仍未勾选。原生预检调用错误已纠正，Xcode和双端实机仍缺。


### T8受控homelab服务端基线与失败证据（2026-09-19）

4variant×3、每job152事件的实际PG/staging-mode server补读基线12样本通过并完成进程清理。4条真实HTTP reader与2条进程组反例修复错误成功/失败计数和退出遗留；三层审阅复核关闭。UTF8/LF传输源码摘要逐项与本机规范化代码匹配。细节见story-1-7-server-baseline-2026-09-19.md；仍为隔离数据/合成session/loopback，成本null，不能代替真实产品负载或用户批准的生产目标。
