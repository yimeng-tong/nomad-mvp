# Story1.6 当前进度（2026-09-19）

状态：in-progress。T1/T2–T5与T6输入/持久日志/回执恢复已接通并通过限定审阅和浏览器重启验证；下一段为实际归因代码/资源核对和T7测量，真实设备/服务门槛仍开放。

- 来源11组GWT/hash、Requirements和delivery并集、input-attribution及6项工程条件已落实际Tasks。
- 复核修正：同attempt单调state_version、原job retry服务端准入/幂等绑定、保留已提交partial结果。
- Handoff通过：9 Epic/62 Story/1052 GWT；7历史done、4 in-progress、0 ready、51 backlog；下一准备1.7。
- 当前目标已按用户明确goal方向创建为active，继续bmad-dev-story；不等待常规继续授权。
- 1.0与9.1仍in-progress，真实协议/认证/归因/双端设备等缺项保留；这些不阻止本Story独立代码/隔离验证，也不允许用fixture冒充生产导入。
- 3.1仍paused，旧2.2不独立派发。现有未提交变更/合成库/备份/部署保留。

下一步：继续T6实际归因接入与T7测量。日志调用方已接通；真实U-Link/U-App及双端设备证据仍缺。现有API/controller/页面已可消费，不从头重做T1；T7测量/生产门槛独立保留。

参考：1-6-home-multi-link-import-queue-and-honest-status.md、同名-validation.md、research/story-1-6-backend-context-2026-09-19.md；当前基础实现见story-1-0-dev-progress-2026-09-19.md和story-9-1-dev-progress-2026-09-19.md。


## T0/T1 实施与证据

- 启动前文件快照：`/tmp/nomad-story16-start-20260919`；保留全部1.0/9.1及原有工作树修改。
- OpenAPI新增版本化IngestSnapshot、canonical受理disposition/operation回执、GET原job状态/实际结果、命令恢复与显式retry。遗留single-link endpoint兼容；Home分类输出按首次出现顺序的有效URL和未识别原因，不再吞掉其余有效链接。
- 延用当前基本URL正规化，同批等价URL只提交一次并单列duplicate_count，重复不是未识别片段；跨批/既有来源由服务端返回reused。完整canonical/短链规则版本仍属1.8。
- IngestJob新增state_version/snapshot_json；IngestCommand为owner-scoped受理/重试回执，同事务写入。不是1.7事件日志。新受理/重试赢家才派发，旧尝试和低版本不能覆盖事实或缓存。
- snapshot必须来自持久事实；DB失败不伪装404/空任务，不在commit前通知。历史projection只补明确legacy行，SSE首帧完整；新的版本快照不混拼并发更新的Inspiration。
- 临时提取/定位/转存失败保留实际已存数据并failed+partial+可retry；纯抓取失败不制造媒体或保存记录。重试保留旧文本/资产/结果，缺字段不是删除。未知抽取数保持null，与真实已存记录数分开。
- 当前extract/geocode/rehost仍是历史fixture，因此真实模式新导入明确INGEST_CAPABILITY_UNAVAILABLE，直到1.9–1.11交付真实适配器。回执/快照/已有结果读取不伪造已接通供应商。
- 服务进程退出后的lease/重启恢复仍为1.7，原有缺口已记交接；已独立修复普通只读失败吞掉唯一派发责任的问题，不把后续分工当本次缺陷借口。

## 隔离PG与恢复

首轮schema验证库`nomad_auth_test_177d1781ed96`保留，仅证明schema及原认证不变量恢复。扩充了真实快照/回执/partial数据fixture后，最新库为`nomad_auth_test_fc30844df46e`及同名`_restore`，私有env在VM104 `/tmp/nomad-auth-validation-ppqkv75j/test.env`，合成dump SHA256 `5280bea46bf79906a1f0bdae6e989a6e1aa300a689b7a4a93f547f2894aeed9d`。

实际验证旧job owner/sourceHash/auth资格不变、state_version/attempt、命令owner/job引用和真实已存partial文本/资产引用经恢复保持。迁移ID`20260919000200_story_1_6_ingest_snapshot`；没有修改旧迁移、源数据库、既有发布或旧备份。

`auth-ingest-probe.ts`在新库运行独立Node进程竞争：唯一派发、跨进程回执、冲突/owner隔离、retry单赢家、迟到attempt拒绝、结果/快照原子性、partial保留、提交失败不发布、账号资格、延迟旧提交回调不倒退cache、legacy SSE真实结果及partial投影。以上13项通过，真实供应商调用0；新增精确结果读取也已在同一隔离PG探针中核验。

## 限定审阅与当前验证

bmad-code-review三层在1215行后端差异上独立检查。5项可修问题已修并定向复核；进程退出/租约恢复为1.7既存责任，单独记录。此结论不覆盖未实现的Dock、深链/粘贴、实际归因或双端设备，也不把整Story标完成。

本地后端18项解析/状态/命令/路由/既有evidence测试、8项ingest/auth OpenAPI合同检查通过；旧ingest、Home/Library contract已在T1验证。客户端现为24文件/177项Vitest及3项原生配置检查通过；完整workspace build通过。FIFO纯模型覆盖每个结果完整10秒、运行更新不抢占、后台/离页/Sheet遮挡暂停、重复终态不重新入队、旧state_version不倒退。

## T2–T5 客户端已接通

- App按认证epoch持有小型controller，Home卸载不丢composer/批次/事实/FIFO；身份未知遮蔽且不耗窗口，换owner/session清除。未持久化内存草稿，不能宣称杀进程草稿恢复；T6已确认动作日志仍待实现。
- 有序分类后逐链接提交，处理期间可继续编辑下一段输入。受理数仅计真实ACK/回执，未知不计成功；每批N/X稳定。容量只限制100条待确认/处理中导入，不因历史完成记录阻塞自然语言；限制拒绝时保留原文。
- 同一operation恢复未知受理/retry；已知拒绝可放回输入框，保留新草稿。409/429后的retry不留下失效确认按钮；URL前缀不被误判为相同链接。
- 前台先串行读取原job快照，最多一个SSE；Home离页/模态遮挡关闭流，连接错误退避后重新对账，消费者主动处置错误不形成重复认证刷新。丢弃旧attempt/state_version，重连不重新提交。
- 一个HomeImportDock承接批次详情/队列/完成窗口/自然语言事实摘要/composer。摘要不含pace，用户“继续规划”沿原S2路径；未知仍用原二选一Sheet。去掉Home陈旧额度承诺，不扩展7.3。
- 真实结果通过精确owner结果API可达，缺结果无查看；已选结果不可因“加入”被取消。每次Sheet请求用新token，旧请求不会关闭/替换同ID新窗口；只显示一个模态，关闭恢复焦点。
- 完成窗口从实际render确认开始累计可见10秒，FIFO不中断；live region含批次号+安全标题+N/X+阶段，图像计数变化不触发噪音。Web实现44px、键盘/focus、reduced-motion和safe-area；真实Android/iOS仍待设备验证。

## 浏览器、限定Review与剩余门槛

实际Chromium已跑移动390×844、桌面1280×900：批量受理、编辑、Settings返回草稿、partial/查看/同job重试、未知命令恢复不重发、FIFO切换与不同读屏提示、44px目标、无横向溢出、reduced-motion。证据在`evidence/story-1-6-browser-2026-09-19/`，report包含本次源码SHA；HTTP/SSE为明确fixture，供应商调用0，不代表真实导入/认证/原生验收。1.0实际Chromium替身认证回归也通过，跨账号清草稿/未知退出行为保持。

客户端1253行初始差异经bmad-code-review三层，归并9项patch，无决策/延期项；已全部修补、增加反例并静态复核。两项复核残项（无标题跨批次读屏和URL前缀恢复）也已关闭。审阅仅覆盖本次T2–T5源码，不代表Story done。当前完整验证清单与源码指纹见`story-1-6-local-validation-2026-09-19.json`。

下一执行点：T6早期深链inbox/固定来源和参数校验、同owner已确认动作的持久身份与恢复、用户主动Clipboard读取、最小归因；T7可执行测量报告/真实样本目标及设备证据。正式协议、Mac/签名/测试设备问题已经提出，不重复索取密钥。不用当前APK旧SHA或fixture关闭真实门槛。3.1暂停保持；1.0/9.1均未标完成。


## T6 当前输入边界（2026-09-19追加，覆盖上文旧下一步）

- 固定安装Clipboard8.0.1，双端工程已同步注册；Web/原生均只在用户点击“粘贴”时读取，成功追加到同一composer并等待发送确认。拒绝/非文字/超长有手动回退；草稿revision和认证activity保护迟到结果。启动、前台恢复和外链事件都不读取剪贴板。
- 宿主启动前订阅现有URL总线，携带实际appId；输入仅接受第一方input-v1当前scheme或配置的HTTPS精确来源。HTTPS来源目前未配置，U-Link SDK/平台关联仍未实证，不能把自定义开发scheme当实际U-Link渠道。
- 最多8条pending/8个处理中摘要/128内存指纹，最长24小时且尊重更早过期；入站URL32768上限覆盖2000中文字符，外部网页打开仍8192。严格参数/UTF-8校验，非输入业务路由不误报。无需也没有保存原始私人输入到日志/分析。
- 同owner待确认上下文在当前进程内接续；任何owner变化使绑定旧owner的异步结果失效，A→退出→A也不复活。摘要去重按身份代次/owner区分，旧工作不压掉新owner合法到达的内容。anonymous内容必须显式放入后发送，不自动归属/执行。
- 三层限定审阅归并5项patch（含并发摘要洪泛、owner往返、其他路由、中文长度、损坏编码）均修并复核；新owner同内容被旧摘要压掉的残项也关闭。新增1000事件容量、ABA、编码、迟到粘贴和界面主动确认反例。
- 浏览器报告当前还验证主动粘贴/拒绝保持输入、向下拖动收起和纸飞机发送图标；HTTP/SSE/Clipboard均明确替身。去掉旧footer遗留180px余量，改由实际Dock高度为列表留空间。
- Android/iOS自定义scheme静态注册均与当前dev.nomad.mvp一致；插件/配置/复制资源校验通过。Android最新debug APK已重新构建并通过v2签名验证，具体SHA与资源指纹见local-validation。iOS仅同步工程，没有Mac编译/签名/设备证据。

**还没有已确认动作的持久journal，因此未关闭C05或Story1.6。** 内存内容/指纹不能代表杀进程恢复。下一实现必须先持久保留owner绑定的operation身份，再在重启后消费服务端回执；未知结果不能换operation重发，切owner不能恢复旧动作。原始文本/URL不进入日志/分析。之后仍有实际归因与WL-IMPORT-DOCK测量、目标决定和双端设备验收。

实施入口说明：`docs/ops/input-link-v1.md`。当前验证：24文件177个移动测试+3配置，既有18后端/8合同/13隔离PG实证保留；完整build及最后客户端build、双端sync/native verify、Android243 tasks构建和实际Chromium替身均通过。最终文件/源码指纹保持在本Storylocal-validation和browser report，不借旧APK证明新源码。


## T6 持久日志核心已验证，下一执行点是调用方接入

本段新增`home/operation-journal.ts`与实际浏览器探针；启动前controller/model/inbox/App快照在`/tmp/nomad-story16-journal-start-20260919`。日志的批次、输入指纹claim和原entry retry使用IndexedDB事务；当前owner/epoch/activity由调用方提供有效性栅栏。私有请求正文用AES-GCM加密，AAD绑定owner/operation/kind；每owner不可导出CryptoKey也在IDB，因此不是1.0凭据vault或XSS防线。

正文24h逻辑期限，accepted清正文；prepare/list/payload维护时删除过期密文。operation/claim/key7天且每类2048上限，离线关闭期间不声称已物理擦除；重试原job/预期版本属公开引用，按元数据期限保留。原start先到期时，可由仍存在的entry重试记录接续身份。任何存储失败都无Map/localStorage成功fallback。

初始真实浏览器测试发现批次重放排序问题，已修正。三层限定review归并11项已全部修复并复核；实际Chromium双tab/两次进程启动验证20项，包括真实加密/重启读取、owner/AAD、原子claim、batch rollback、TTL物理清理、公开retry tuple、原start过期、损坏key/cipher、过期损坏行和失效连接重新打开。额外端口占用探针确认不会把其他checkout当本次代码。全部为合成输入，服务器/供应商调用0，报告`evidence/story-1-6-journal-2026-09-19/report.json`已明确controllerIntegrationVerified=false。完整workspace build通过；现有Home运行源码及177+3回归证据未被冒称为日志集成证明。

**立即继续：按`docs/ops/input-operation-journal.md`的接入步骤修改现有controller和inbox。** 当前Home仍使用原内存呈现/随机操作ID；新日志核心尚未调用。必须在确认后/HTTP前原子prepare，持久化失败保留输入；重启同owner先读取原operation回执，再允许用户明确继续原请求；不能自动重交未知写入。测试应显式注入fixture journal，生产默认真实IDB，不因jsdom缺IDB引入生产fallback。需要把完整10秒显示后的noteDone与恢复FIFO一同接通，外链确认指纹要随composer上下文正确失效/绑定。

之后继续实际U-Link/U-App、WL-IMPORT-DOCK测量及真实双端门槛。1.0/9.1/C05/1.6均未关闭，3.1仍暂停；没有新增真实短信、供应商请求、生产数据操作或发布。


## T6 日志接线已完成（覆盖前文“尚未接入”历史节点）

- 默认controller现在使用真实IDB操作日志。普通输入、未知分类后的明确链接选择、原job retry均在prepare提交后才发送；存储失败保留输入，不使用新ID或内存成功fallback。单测通过`journal.test-support.ts`显式注入fixture，与生产路径分开。
- 同owner恢复本机条目后只读取原command/job；查无回执不会自动POST，用户“确认结果/继续”沿原operation与保存载荷处理。服务器受理已知时，本机mark失败不会伪装未受理；已有未知请求的接纳前429仍不能证明原请求未提交。已过期且查无回执的条目仍unknown/可核对，但释放待发送容量。
- 数据恢复与网络对账分开，不等所有网络读取才解锁composer。强制读取失败可以真正重试。账号变更或activity变化隔离旧返回；新owner不会读取旧owner的command。已完整10秒可见展示后才noteDone，下一进程不再排入同attempt完成窗口；窗口未完成时不把隐藏/关进程时间算作已展示。
- 发送前冻结全部贡献范围；用户新草稿不改变已确认动作，延迟unknown分类仍保留原来源。新增服务端`link_occurrences`，包含每个合法URL的UTF-16位置（含重复），只claim实际贡献有效链接的来源；纯未识别来源不被吞成已完成。正文中的完整未改片段保留来源，实质改动则视为手动新输入。
- 多指纹同一事务绑定。并发出现部分已确认/不同批次冲突时不重新分配或丢输入：保留全文，恢复已有条目，提示移除已确认部分后继续。未变更的新来源仍保留绑定；不是静默提交第二份operation。
- 真实Chrome127暴露custom scheme的URL.hostname为空，已按固定input-v1入口词法解析修复并验证；userinfo/额外host/port/path/fragment/非法编码仍拒绝，最低WebView111保持。出处和规则见docs/ops/input-link-v1.md。

三层限定review的4项、1项未识别来源残项，以及实际集成发现的旧Chromium/429不确定性问题共7项已修复/复核；匿名take疑问由实际owner绑定返回值排除。192项移动测试+3配置、18项服务端ingest和8项契约通过；最后提示文案/清除行为又跑25项聚焦UI测试。完整workspace及最终mobile build通过。

实际Chromium完整App使用真实IDB/WebCrypto、受保护API/鉴权/剪贴板/深链投递的明确替身：发送后丢ACK，关闭再开新浏览器进程，恢复原command且没有第二次POST；重复已确认外链没有新提交；切owner清空并且没有旧command读取。浏览器report现在controllerJournalIntegrationVerified=true、realAuthenticationVerified=false、nativeDeviceVerified=false。独立日志核心22项及端口占用负例保留，证明范围与集成测试不同。

**下一执行点为input-attribution真实SDK/许可与资源核对，以及T7 WL-IMPORT-DOCK测量报告/版本化目标。** 真实PNVS/法律正文、U-Link/U-App控制台查询与原生同意、iOS编译签名/双端设备、真实服务基线/生产恢复仍未证明；1.0/9.1/1.6均不标done。最新Android调试包只证明同步/编译/签名，不以此抵设备运行。

## T7 WL-IMPORT-DOCK 本地报告已交付（当前节点）

新增严格 measurement-v1合同、可重算CLI、版本化场景计划、真实controller/React/IndexedDB浏览器采集。运行方式和统计定义见`docs/ops/import-measurements.md`；报告在`evidence/story-1-6-measurement-2026-09-19/`。本地只有显式API/身份/阶段替身，没有真实供应商、SDK归因或服务阶段成本数据；未知成本null，客户端单调时钟不与服务墙钟相减。

- 矩阵固定25秒、planned/observed N=15：done10（含复用1）、partial1、failed1、rejected1、unknown1、running1；16个命令POST，逻辑请求与attempt分母分开。未知和运行中不因观察结束变失败/成功。2个完整FIFO窗口、1个未满、6个尚未展示，全部保留，10秒展示不混入解析耗时。
- 按场景保留P50/P95和N，nearest-rank ceil(p*N)，空池null；reused/reconciled/retried/未知attempt不算单次服务处理。commandRequests只计写命令，不冒充所有网络请求。客户端观察不是供应商执行时间。
- 250ms截止/400ms分类延迟负例planned15、observed0、missing15、POST0；统一截止终止观察与后续提交，不延长窗口得到更好结果。CLI重算与runner整体/场景统计完全一致。
- 历史baseline-single保留初始合同草稿/源码指纹，不能用当前runner覆盖。它发现单请求首事实约5180.5ms，根因ACK后等轮询才建立SSE；已改立即建立最多一个流。当前fixed-single N=1观察为约1.3ms，matrix普通single N=3 P50约14.1ms/P95约23.9ms。仅用于确认该fixture回归，不能外推生产/真机性能或目标；断线仍保留实际退避和轮询等待。
- ACK后的SSE构造抛错不会把权威accepted改unknown；订阅token处理同步终态/错误与迟到回调，测量观察回调抛错不影响展示。已有Home授权/owner/恢复语义保持。

三层限定审阅归并7项均修补并复核，包括共享场景报告新增的跨场景冲突残项；全局先判冲突，再向各分层传播排除，计划外变体也不能绕过。13项统计反例、196项移动测试+3原生配置、18项server ingest通过；测量类型检查、完整workspace build通过。实际Chromium完整App+真实IDB的两进程恢复/重放/owner测试再次通过，仍为显式鉴权/API/Clipboard/URL替身。

双端工程已同步并校验复制资源，Android最新debug构建243 tasks/12s且v2签名验证通过；SHA和源码/资产指纹以local-validation为准。iOS仍只同步，未补Mac/签名/真机证据。METRICS-01推进in-progress；METRICS-02真实staging/成本与用户版本化目标未关闭，Story1.6/1.0/9.1保持in-progress，3.1继续暂停。

**下一执行点：版本化归因/隐私字典、许可/撤回与宿主供应商接入。** 当前auth/analytics仍Noop及字段黑名单，不能当已完成SDK集成；需落实允许的事件/属性/值与供应商到达证据。本任务已询问U-Link是否开通、域名/Scheme或本地配置路径，不再重复索取U-App Key。法律正文、Mac/签名/双端设备的问题保持待回；可继续独立的字典/安全代码。未发送真实SMS、未部署新认证、未发布公有云。

## T6 首用遥测字典/许可运行时核心（当前节点，仍非SDK接通）

已将旧字段黑名单改为`nomad.telemetry.v1`事件、字段和值级白名单，接入Login/Home/Planner/DayPlan/Settings既有出口。有限错误枚举、计数上界/必要字段、无getter/嵌套/字符串转换；私人ID/city/date/URL/任意错误文本不向注入sink投递。历史HQ/seed-adoption/BYOK及“打开邮件即反馈成功”事件停用；编辑业务本身与3.1暂停不变。实际领域枚举已核对并测试，规范input/import事件仅有字典、发射器仍需下一段接线。

新增`telemetry/runtime.ts`许可核心，只有固定策略版本granted且身份已知才能初始化；队列64/单调TTL30秒、去重1024/5分钟、固定配置与绑定代次、初始化/发送/清理截止、旧异步返回清理和故障锁都有反例。使用安全UUIDv4事件引用，不发送原始owner/session，不宣称匿名→owner关联已实现。供应商accepted与真实可查询严格分开。**此runtime尚未装到App默认路径，真实SDK和许可UI仍未连接；App仍Noop，不能当归因完成。**

三层限定审阅7项均修复并定向复核：固定配置、单调TTL、撤回AbortError计数、真实枚举、初始化清理责任交接、真正send边界过期、UUID大小写去重。并发清理缺陷有red→green反例，审阅另覆盖15个微任务交错；不以此抵真实SDK撤回和清缓存行为。

217移动测试（含21遥测核心）+3原生配置、完整workspace build通过。实际Chromium将3个安全信封经fetch发给显式本地HTTP替身，核验私密哨兵不入序列化网络正文、旧队列/旧bound emitter隔离、迟到initialize关闭和去重；外部请求0、真实SDK/供应商调用0。Home两进程恢复与auth浏览器替身回归通过。双端sync/静态资源校验通过，Android243 tasks/11s、v2调试签名通过；当前APK/源码见local-validation。iOS仍无Mac编译/设备验收。

入口说明`docs/ops/telemetry-first-use-v1.md`，证据`evidence/story-1-6-telemetry-2026-09-19/{validation,browser-report}.json`。**下一段：核验固定版友盟原生SDK初始化/停止/自动采集及iOS包分发，做实际适配器和App许可/规范事件接线**；不要重写字典/核心，也不要以Noop/HTTP替身结案。正式法律资源、U-Link域名/Scheme、双端设备/Mac问题已提出，待回时推进独立代码；三端真实查询、匿名关联/删除、生产测量门槛仍开放。


## 原生SDK制品与生命周期前置核验

实际下载并核对common9.9.10/asms1.8.7.2、UMCommon7.6.7/UMDevice3.6.0四份官方制品，锁定摘要及可重跑静态审计已落盘。Android disable仅写开关、privacy(false)异步投递事件，不能当同步取消/清缓存屏障；iOS关闭接口也尚无运行验证。SDK不是可直接套入现有close承诺的已验证适配器。详情见docs/ops/umeng-sdk-artifact-audit.md及同名evidence目录。

没有把四包加入主App或调用供应商。继续准备独立Android SDK探针（网络仅本地替身），匹配asms x86 ABI；WSL缺KVM，软件模拟器工具安装在忽略的.local-tools/。后续实际句柄/日志见CURRENT追加，不能仅凭安装意图视为已运行或重复启动。现有业务数据/发布/SDK Key未动。


原生SDK前置进一步取得实际离线运行证据：独立Android探针36tasks/21s构建，在本任务Android29 x86模拟器中执行，探针UID双IP族出站REJECT在启动前/结束后均验证。真实SDK初始化，关闭组合返回10秒后仍有9文件42460字节（SDK db/envelope/identity元数据确认，未读正文）。不能把该组合包成成功close/清缓存，也不能由此推断离线事件已经上传。实际App未加入SDK依赖，仍保持原门槛。记录于docs/ops/umeng-sdk-artifact-audit.md及android-lifecycle.json，探针已force-stop/模拟器请求关机，无真实Key/事件或真实设备。

为避免硬资源/供应商生命周期门槛阻塞整个已授权MVP，下一独立行动按Sprint.next_story_to_prepare准备1.7持久导入进度与重启恢复合同；1.0/1.6/9.1继续in-progress，已有后端回执/快照是可复用输入，不把整Story或SDK归因标done。SDK兼容核验及正式法律/U-Link/iOS设备仍保留具体待证责任，不能用后续Story删除这些义务。


## 2026-09-26 共享UI迁移受影响回归

9.3在实际Login/Home/退出入口迁移共享UI，本Story受影响范围及原auth6/真实PG-SSE-IDB6回放见story-9-3-integration-impact-2026-09-26.md。当前aeadc1e完整CI36184294356通过，129产品场景/33视觉和6三引擎组件补证、265移动+5配置保持；原controller/journal/cursor与历史证据未重写。9.3四项UI条件只在9.3范围verified，本Story状态及自身条件没有自动关闭；真实供应商/归因/设备/生产恢复仍按原合同验收。
