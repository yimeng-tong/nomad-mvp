---
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
story_id: '1.6'
story_key: 1-6-home-multi-link-import-queue-and-honest-status
source_story_id: '1.6'
source_contract_sha256: a6ce5304455dc1883ad6641bcd2a5d0f1943364f5a53e93a8cf208779f9724df
source_epics: _bmad-output/planning-artifacts/epics.md
created: '2026-09-19'
updated: '2026-09-20'
workflow: bmad-create-story
preparation_status: complete
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
implementation_started: true
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- OPS-01
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
source_obligations:
- input-attribution
- shared-ui-adoption
delivery_requirements:
- FR2
- FR3
- FR14
- FR17
- FR18
- FR19
- FR49
- FR52
- NFR6
- NFR8
- NFR25
scope_revision: ui-foundation-2026-09-20
external_service_evidence: pending-authorized-verification
---

# Story 1.6: 首页多链接导入队列与诚实状态展示

Status: in-progress

> 本合同承接当前11组GWT及input-attribution，不表示1.0/9.1或本Story真实验收已完成。可继续代码和隔离验证；真实用户开放、真实供应商/归因和双端设备门槛另列，不跨越3.1暂停。

## Story

As a 旅行者,
I want 在同一个首页输入组件中批量提交链接并查看真实队列状态,
So that 我可以持续添加灵感而不会丢失正在处理的导入.

**Requirements:** FR2, FR3, FR17-FR19; NFR2, NFR8; AR1-AR3, AR6, AR15,
AR17, AR20; UX-DR3-UX-DR5, UX-DR32, UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

## Acceptance Criteria

### AC1

**Given** HomeImportDock 中一次粘贴包含多个受支持链接和无效片段
**When** 用户提交输入
**Then** 客户端按出现顺序为每个有效链接调用一次现有单链接 ingest API
**And** 对应批次只用一条中性行内说明 `已添加N个链接，部分内容未识别`，N 取真实受理的有效链接数；未识别片段与原因在当前批次或相关记录按需展开，不丢弃有效链接、不抢焦点，也不创建第二个输入 surface

### AC2

**Given** 一个或多个导入 job 正在处理
**When** 用户查看展开或紧凑队列
**Then** 当前项显示安全截断的来源标题、当前事实动作和批次内 `N/X`
**And** 状态只映射为获取内容、理解图文、验证地点、保存灵感或明确失败，不显示百分比、虚假进度条或内部 Provider 名称

### AC3

**Given** 多个 job 可以并行完成
**When** 当前完成结果进入展示窗口
**Then** 该结果连续显示完整 10 秒
**And** 后续完成结果按 FIFO 等待各自窗口，运行状态更新不得抢占当前完成结果

### AC4

**Given** 队列正在运行或已有结果等待展示
**When** 用户继续输入新内容
**Then** 原长输入框保持可编辑并将新 job 追加到呈现状态
**And** 占位文案保持 `粘贴分享链接或输入想去的地点，如：厦门 3天`

### AC5

**Given** 输入框为空或包含内容
**When** composer 状态变化
**Then** 强调按钮分别显示 `+` 或发送图标，并在 120-180ms 内过渡
**And** reduced-motion 模式直接替换图标；展开态使用向下 chevron，紧凑态使用向上 chevron

### AC6

**Given** 输入是旅行自然语言而非链接
**When** 系统可靠识别目的地、天数或日期
**Then** Dock 显示类似 `识别 厦门 3天 7月14日出发` 的事实摘要并沿现有路径进入 S2
**And** 不提前展示或确认 pace；无法分类时仍使用现有二选一 Sheet

### AC7

**Given** 前台连接中断、job 返回可重试失败或终止失败
**When** 用户重连、重试或确认失败
**Then** UI 保留 composer、队列顺序和最后已确认状态，并从现有 job 状态对账而不重复提交
**And** 可重试与终止失败提供不同的诚实动作，真正终止时在对应项显示 `这条导入未完成`；仅在部分内容真实保存后显示 `部分内容已保存`，具体原因进入相关记录，不影响其他任务或堆叠弹窗；跨服务进程的 durable cursor 不作为本 Story 完成声明

### AC8

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 HomeImportDock
**When** 使用添加、发送、展开、收起、重试和队列状态
**Then** 所有动作具备至少 44pt 目标、标签、角色、焦点可见性和简洁 live-region 更新
**And** 图片计数变化不造成连续读屏噪音或布局跳动

### AC9

**Given** Story 1.6 准备关闭
**When** 运行契约生成、聚焦的 Home/API 测试、确定性 FIFO 时钟测试、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 所有检查通过且已交付的自然语言、单链接导入和 Library 基线无回归
**And** owner 导入记录、版本化去重、跨进程 durable cursor 与生产多模态抽取仍不被错误标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C05 — App：深链冷暖启动与登录后续接

**Given** 合法输入深链在冷启动、前台或登录过程中到达 App
**When** 经当前来源/参数校验并完成适用登录恢复
**Then** 只恢复一次同 owner 的已确认动作，U-Link 渠道/点击标识遵守最小归因合同，失效链接保留手动输入
**And** 重复 URL 事件、跨 owner 或重启重放不重复启动 ingest，不把深链参数当认证，也不扩展为分享接收扩展

#### C06 — App：用户主动粘贴

**Given** 用户在 Web 或 App 的既有 HomeImportDock 明确选择粘贴
**When** 系统允许、拒绝或未提供剪贴板能力
**Then** 允许时沿同一输入组件处理内容，拒绝/不可用时保留长按粘贴和手动输入
**And** 冷启动、前台恢复或收到外链时不自动扫描剪贴板，日志与归因不采集原始私人内容


### UI02 — Home组件迁移不改变导入与恢复语义

**Given** HomeSheet、composer控件或队列状态迁移到共享组件且存在运行/恢复中的原任务
**When** 打开关闭Sheet、输入中文、后台恢复、切换身份或读取持久operation回执
**Then** 原单一输入、受理计数、FIFO完整可见窗口、operation身份、owner隔离及持久恢复结果保持
**And** 不自动重交未知写入、不重置ACK/已展示标记、不自动读取剪贴板，状态和焦点证据绑定本次组件源码

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 固定上下游合同、运行边界与本次恢复点（AC1–9、C05/C06；OPS-01/DB-CHANGE-01/APP-HOST-01）
  - [ ] 消费1.0公开owner/session、epoch/activity、未确认遮蔽与同次未知请求恢复；9.1仅代表已有宿主接口/可编译Android，真实双端验收仍未关闭。
  - [ ] 记录现有IngestJob/事件/结果/适配器差异；本Story补足可消费快照、受理身份、原job重试与真实结果入口，完整durable cursor归1.7，ImportRecord/版本化canonical去重归1.8，多模态/存储/POI供应商归1.9–1.11。
  - [ ] 原生来源/渠道/应用ID、剪贴板和实际数据处理能力逐端登记；缺资源继续独立代码，不假造来源白名单、归因或真实导入。
  - [ ] 记录合成PG恢复点/迁移ID/代码版本，保留已有数据库、备份和旧发布；只在获准隔离环境运行新增迁移。

- [ ] T1 OpenAPI与最小后端事实接口（AC1/2/7/9、C05；FR18/19；DB-CHANGE-01）
  - [ ] 扩展现有/home/input/parse为有序有效链接和未识别片段/原因；真实单链接POST /ingest/xhs仍一次一个URL，canonical/legacy入口保持兼容，不把多链接再作为“仅首条”warning吞掉。
  - [ ] 受理响应返回真实created/reused/当前状态及同owner job引用；同次不确定受理保留request/operation ID并可查询/安全重试，429/拒绝/未知不冒充已添加。
  - [ ] 增加鉴权的job快照/结果摘要和原job retry合同，字段包括当前attempt/阶段、已确认counts、来源标题(可缺)、终止/诊断降级、结果引用及当前可用动作；未知数字不补零或虚构城市。
  - [ ] 快照与通知携带同一单调state_version；先读新快照再收到同attempt旧SSE也不能倒退。state_version是当前事实版本，不等同1.7可跨进程回放的durable事件cursor。
  - [ ] 快照以持久权威为准；错误/失权不能变404空job或继续信任进程Map。原job重试使用预期attempt与幂等操作，只由CAS赢家派发，新实例不能因命中同一sourceHash再次运行旧job。
  - [ ] retry仅接受当前明确可重试终态；运行/完成/不可重试/资格失效均由服务端拒绝。operation ID绑定owner/job/请求，重复返回原回执，冲突409；不能只靠前端隐藏动作。
  - [ ] 状态/结果在适用事务与owner/account屏障内提交后再通知；所有失败都未保存时不能合成媒体、伪stored_count或随后done。没有真实适配器时明确不可用，stubs只允许隔离fixture。
  - [ ] 生成packages/types，复用ErrorEnvelope；401/403/404/409/429/503、no-store、expected身份与原生渠道沿1.0执行。

- [ ] T2 单一HomeImportDock与可继续输入（AC1/2/4/5/8；FR2/3/17/18/49）
  - [ ] 从HomeScreen现有footer/notice提取一个组件，队列、状态、识别摘要、长输入与动作共享宽度/边界/层级；保留目的地、Library筛选、已选灵感与既有handoff。
  - [ ] 每次确认发送冻结批次及有序链接；顺序提交受理，每个有效链接仅对应一次初始单链接请求；处理可重叠，新输入只追加新批次。批次处理中textarea仍可编辑，不用全局submitting锁composer。
  - [ ] 分离批次受理进度和队列N/X：真实接受的数量才计入“已添加N个”；该批次中的项目编号与分母稳定，明确duplicate/reused计数，不混追加批次或把待确认算成功。
  - [ ] 固定placeholder，空输入+、非空发送图标；120–180ms切换且reduced-motion直接替换，展开向下/紧凑向上chevron；仅展开态有拖动handle。
  - [ ] 混合片段仅一条中性说明，原因按需展开、不抢焦点；标题安全截断而N/X不丢，四个事实阶段不出现Provider名、百分比或伪进度条。
  - [ ] 44pt/可见焦点/label/role；live region只播报简洁阶段，不连续播图片计数。Dock变化为列表留空间，键盘/安全区/大字号不遮按钮。

- [ ] T3 独立处理与FIFO结果呈现（AC2/3/4/7/8；NFR2/8）
  - [ ] 建立小型可测试状态机：composer、批次受理、job快照、连接、展示FIFO分开。状态保存在稳定owner隔离宿主/store，不能因Home去Settings/Planner卸载而丢失；换owner/session按1.0清除与栅栏处理。
  - [ ] 每个明确完成结果入FIFO一次、连续可见完整10秒；以后完成排队，运行更新不抢占；重复终态不重复入队，重连不重置窗口。
  - [ ] 后台/离开Home暂停可见计时，回来先确认同一身份再继续剩余时长；未知身份时遮蔽且不耗尽未展示窗口。纯计时器恢复不谎称服务端任务完成。
  - [ ] 来源标题/保存数量/城市和查看入口来自真实快照；缺城市使用不声称城市的文案，缺结果不显示空壳查看。完成窗口结束后已保存结果仍能从现有Library最小真实路径访问。

- [ ] T4 对账、原job重试与真实结果（AC7/9；FR19）
  - [ ] HomeApiClient复用createBoundJsonRequest/watchBoundStream；浏览器和native路径同一身份，不新建裸fetch/EventSource或另存secret。安排有界流/快照查询，兼容当前native并发流上限，不产生失败-重核循环。
  - [ ] 断连/进入前台先读原job快照再合并后续事件；网络失败/鉴权复核不是job终止。保留composer/顺序/最后事实，按当前attempt和state_version丢弃旧回包。
  - [ ] 可重试操作调用明确原job retry；未知受理/未知retry恢复同一operation，不POST整批或无条件重新start。真正失败显示“这条导入未完成”，有真实保存事实才显示“部分内容已保存”；原因进入对应项。
  - [ ] retry不得清空已提交partial结果；缺失字段不是删除指令，新结果原子提交，重试再失败仍保留上次真实保存。修正旧persistIngestOutput无条件删除再建资产的覆盖风险，加入partial→retry失败反例。
  - [ ] 后端确有结果时“查看”沿现有Library到当前owner真实结果；这只是1.6最小可达路径，不声明完整ImportRecord列表/详情/原始URL复制/版本化去重已交付。无取消合同不增加取消按钮。

- [ ] T5 自然语言与既有导航（AC6/9；FR3/17/49）
  - [ ] 保留可靠城市/天数/日期校验，事实摘要后沿已有受保护Planner入口进入S2；移除Home提前解析/确认pace的输出，不新增第一完成页或批量自动规划。
  - [ ] 未知输入保持现有二选一Sheet且不丢原文；同owner返回恢复输入/队列，关闭Sheet统一清理引用/取消迟到响应并恢复触发焦点。
  - [ ] 删除Home陈旧额度/生成状态承诺，不引入新的额度界面、7.1最近行程或3.1分钟编辑功能。

- [ ] T6 input-attribution、深链与主动粘贴（C05/C06；FR14/52、NFR6/25；APP-HOST-01）
  - [ ] 在Home/登录前即建立有界URL inbox，消费subscribeHostUrl，不再订一套原生App监听；固定来源/路径/参数允许集并校验失效、超长、重复、跨owner与恶意认证参数。
  - [ ] 深链是未信任输入，不能把事件/渠道/点击ID当身份或提交许可。只续接同owner已确认动作；登录未完成的内容可保留待确认上下文，不自动认领给后来的不同owner。
  - [ ] 已确认动作的操作身份及服务端幂等/对账跨进程有效；重复URL、热启动和进程重放不重复ingest。未持久草稿不宣称已保存，不新增分享接收扩展。
  - [ ] 用户主动选择粘贴才调用Web Clipboard.readText或已核验native Clipboard读取；只接纳文本，拒绝/不支持保留长按粘贴和手动输入，不启动/前台/外链自动扫剪贴板。
  - [ ] 复用1.0的版本化归因/安全字典，明确渠道/点击标识用途、去重/窗口、许可/撤回/换账号/迟到投递；原始文本、URL、手机号、cookie/token不进日志或analytics。真实U-Link/U-App查询证据独立记录，未接通不以wrapper日志抵充。
  - [ ] Android/iOS各自验证返回顺序、键盘、安全区、大字号、读屏、剪贴板拒绝、冷暖启动/登录中断、后台/杀进程、owner变化和未知动作；保留Web回归，测试机/签名缺项只阻断相应真实关闭。

- [ ] T7 工程测量与关闭（AC9；OPS-01/DB-CHANGE-01/METRICS-01/02/03/APP-HOST-01）
  - [ ] OPS-01复用1.0恢复框架，为新增job/attempt/受理映射与结果引用扩充隔离恢复fixture；生产全量+PITR与实际RPO证据未完成时保持未关闭，不重置旧库/备份。
  - [ ] DB-CHANGE-01每次新增快照/幂等/attempt字段绑定新migration及兼容窗口；真实PG正向/恢复后保留owner、旧任务、历史引用与去重不变量。
  - [ ] METRICS-01以WL-IMPORT-DOCK记录版本/窗口/fixture、受理/首事实/终态/可见FIFO的边界，分清失败/未结束/重复/重连/未知，提供可执行本地报告与nearest-rank P50/P95和有效N；合成不关闭真实基线。
  - [ ] METRICS-02在真实用户开放前基于真实staging样本给出体验/成本取舍，保留yimeng-tong的版本化目标决定；不猜毫秒/成功率，不借8.1未来交付免除此门槛。
  - [ ] METRICS-03封存解析/FIFO/幂等/owner/重试/深链/粘贴反例和版本，供8.2消费；本Story不引入模型人评分支，不宣布全局评测完成。
  - [ ] 跑生成、server/mobile聚焦测试、真实PG/多实例/恢复、移动/桌面浏览器截图、完整构建、handoff/diff及分离review。只有本Story全部真实AC和适用条件有证据才review/done，不挪用1.0/9.1编译或旧PNG证明native完成。

### T1 后端限定Review Findings（2026-09-19）

- [x] [Review][Patch] 受理/retry提交后的额外快照读不能吞掉唯一派发责任；赢家先派发并返回已提交快照。
- [x] [Review][Patch] 历史空snapshot的SSE使用完整权威投影；有保存结果的历史failed必须partial。
- [x] [Review][Patch] 新快照不能混入另一个版本的Inspiration；补齐仅限明确legacy行。
- [x] [Review][Patch] hydrate/publish都拒绝低state_version/旧attempt回包覆盖较新的本机缓存。
- [x] [Review][Patch] 暂时提取/定位/转存错误的partial保留真实内容，并形成failed+可重试，而非永久done。
- [x] [Review][Defer] 服务进程在提交后/执行中退出的租约恢复和持久事件回放仍是1.7明确责任；1.6不宣称该关闭证据。此限制在原实现已有，常规读失败派发缺口已独立修正，不用分工掩盖新问题。

### T2–T5 客户端限定Review Findings（2026-09-19）

三层审阅归并为9项patch；无新增范围决定/延期项。均已修补，聚焦回归与三层静态复核通过；无标题跨批次读屏、URL前缀恢复反例也已补，不代表整Story关闭。

- [x] [Review][Patch] 未知retry后权威拒绝必须同时清除操作映射与uncertain标记，恢复当前可用动作。
- [x] [Review][Patch] 导入容量限制只统计待确认/处理中项目，并在分类后执行，不因历史完成项封死自然语言或后续输入。
- [x] [Review][Patch] 已明确拒绝的输入可放回同一composer，保留用户新草稿，不暗中重新发送。
- [x] [Review][Patch] 同一结果/候选关闭再打开使用新请求token；旧请求成功/失败/finally不能操作新Sheet。
- [x] [Review][Patch] 已选结果的添加动作幂等，不能以“加入”文案取消选择。
- [x] [Review][Patch] 同时只展示一个Home Sheet；迟到unknown分类等待当前Sheet关闭，不抢其焦点。
- [x] [Review][Patch] FIFO live region包含当前安全标题与批次N/X，结果切换可被读屏区分，图片计数不播报。
- [x] [Review][Patch] 自然语言识别摘要及继续规划放在共享Dock内部，不另建分离输入/状态区。
- [x] [Review][Patch] 失败说明映射实际安全错误码，不只显示泛化retry文案或暴露内部Provider。

### T6 主动粘贴/未确认inbox限定Review Findings（2026-09-19）

本轮三层限定审阅5项patch已修补并定向复核；不覆盖尚未实现的持久动作日志、真实归因和双端设备。

- [x] [Review][Patch] 已绑定owner的异步输入跨任何owner变化失效，A→退出→A也不重新入队。
- [x] [Review][Patch] 同一宿主URL总线上的其他业务路由不制造首页分享错误。
- [x] [Review][Patch] 入站编码上限覆盖2000字符中文，宿主/输入边界一致，外部打开边界不放大。
- [x] [Review][Patch] 摘要前预留最多8个名额，finally释放；同代次/owner的重复工作合并，不压掉新owner独立到达的输入。
- [x] [Review][Patch] query先严格校验UTF-8，不把损坏转义静默替换后送入用户输入。

### T6 持久日志核心限定Review Findings（2026-09-19）

三层审阅归并11项patch，已修补并静态复核。实际IndexedDB/WebCrypto探针20项通过；这里尚未接入控制器，不等同C05完成。

- [x] [Review][Patch] 输入指纹重放只返回原start批次，并核对完整顺序/总数，不混入后续retry。
- [x] [Review][Patch] retry的公开job/版本tuple随元数据保留，不因私有正文24h到期形成不可用的未知重试。
- [x] [Review][Patch] 原start缓存到期后仍从保留entry记录读取批次身份，允许原entry后续明确重试。
- [x] [Review][Patch] claims统一过期维护和容量限制，不能随新指纹无界增长。
- [x] [Review][Patch] owner密钥有7天刷新期限、清理及容量上限，失败准备也不能无限遗留键。
- [x] [Review][Patch] 正文访问/list/insert相关维护实际清除过期密文，不只是返回null。
- [x] [Review][Patch] 异常关闭连接清除缓存，事务构造错误统一返回不可用，后续调用可重新打开。
- [x] [Review][Patch] 已到期的损坏记录在校验前删除，不永久阻断本机缓存读取。
- [x] [Review][Patch] 缺少cipher明确归为损坏，不以TypeError误报通用存储不可用。
- [x] [Review][Patch] 已有key行缺key时拒绝，不生成未持久化的新密钥后谎称保存成功。
- [x] [Review][Patch] 探针确认自有Vite nonce、子进程存活及源码未变化；其他checkout占用端口不能产生绿证据。

### T6 日志调用方限定Review Findings（2026-09-19）

本轮3层复核的4项问题、1项复核残项及2项实际集成发现已修补。匿名take疑问已按既有返回值（明确owner绑定的副本）排除，不是缺陷。

- [x] [Review][Patch] 多条外部输入的贡献指纹随同一确认原子写入，不能只保留最后一条。
- [x] [Review][Patch] 在发送/未知分类确认边界冻结原文和贡献指纹，后续新草稿编辑不能清掉已提交动作身份。
- [x] [Review][Patch] 已初始化后的强制日志读取失败可通过显示的按钮真正重试。
- [x] [Review][Patch] 正文过期且查无回执的unknown仍可核对，但释放待发送额度，不假造取消/成功或永久封死新输入。
- [x] [Review][Patch] 只claim实际贡献有效链接的外部输入；服务端返回全部规范化URL出现位置（含重复），未识别输入不能被错误标已处理。
- [x] [Review][Patch] Chromium130前自定义scheme的opaque-path解析用固定入口的严格词法解析兼容；不抬高已批准最低WebView，也不放宽凭据/host/路径/参数校验。
- [x] [Review][Patch] 已有未知请求再遇到接纳前429不能证明原请求未提交，继续保留原operation；命令事务内明确状态冲突才解除对应重试。

### T7 本地测量限定Review Findings（2026-09-19）

本段仅覆盖WL-IMPORT-DOCK合成客户端测量和对应controller修补，未关闭整Story或真实基线。三层审阅归并7项并全部定向复核；无新增决策/延期项。证据见`docs/ops/import-measurements.md`、本Story local-validation 与 measurement evidence。

- [x] [Review][Patch] 单次处理池只允许created/direct/[1]证据；retried、仅观察到[2]、空attempt和未知disposition不冒充单次执行。
- [x] [Review][Patch] 请求指标明确命名commandRequests且只计命令POST，不伪称覆盖回执/轮询/SSE的总传输。
- [x] [Review][Patch] 截止race、采集栅栏和后续命令阻断保持固定观察窗口，未执行/未完成仍留在coverage；增加250ms截止与400ms分类延迟负例。
- [x] [Review][Patch] 每条输入确认时冻结场景/确认时间，慢批次异步派发不读取后续场景的可变current。
- [x] [Review][Patch] CLI与runner共享整体/分层统计，保留校验后的场景计划、窗口、采样率、fixtureVersion；缺失场景保留计划N。
- [x] [Review][Patch] 历史baseline-single不再是可执行profile，拒绝用当前源码覆盖修复前历史证据。
- [x] [Review][Patch] 同logicalId冲突在场景过滤前统一判定，全部子报告继承排除；计划外变体也不能绕过冲突。

实际测量另发现受理后等待轮询才建立SSE的问题，现于ACK立即建立最多一个流；同步构造throw/error/terminal与迟到回调使用订阅token隔离，不改变已确认受理。新增立即订阅、同步失败/终态、观察回调抛错回归。测量回调无自动上传出口。

### 共享首用遥测限定Review Findings（2026-09-19）

范围为1.0 T8/1.6 T6的值级字典与许可核心，不是实际SDK、归因或Story完成。三层7项均修复并复核，无新增决策/延期项；证据见`evidence/story-1-6-telemetry-2026-09-19/validation.json`。

- [x] [Review][Patch] 构造时固定已校验的策略版本和初始化方法，调用方修改配置不能绕过失效代次。
- [x] [Review][Patch] TTL/去重使用单调时钟；系统墙钟仅作时间戳，不因回拨延长私密事件保留。
- [x] [Review][Patch] 旧generation的AbortError也计abandoned，不能因SDK正确响应撤回而丢失覆盖计数。
- [x] [Review][Patch] 白名单与真实领域枚举一致：third_party、resolved/pending、recent、in_progress；不静默丢合法状态。
- [x] [Review][Patch] 初始化句柄移交session时同步转移清理责任，防止双重close提前放开新owner；微任务交错负例已覆盖。
- [x] [Review][Patch] 真正send微任务前再次检查过期，主线程阻塞后的旧队列不穿透TTL。
- [x] [Review][Patch] UUIDv4事件引用规范化为小写再去重，不因大小写重复上报；旧节点型UUID不进入字典。



### UI范围增量任务（2026-09-20）

- [ ] UI-SCOPE-1.6：落实2026-09-20新增条件/义务，保留原已完成实现与真实资源门槛。
  - [ ] CODE-QUALITY-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-COMPONENT-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-WORKBENCH-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-BROWSER-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；证据：当前源码组件/浏览器/适用原生证据，逐Story关闭。

## Dev Notes

### 当前事实、改变与保留

| UPDATE文件 | 当前实现 | 本Story改变/必须保留 |
| --- | --- | --- |
| apps/mobile/src/home/HomeScreen.tsx | 首链接单发、总submitting禁用输入、组件内草稿、独立footer/notice | 提取Dock/稳定store；保留Library城市/筛选/选择、候选关闭栅栏和planner handoff |
| apps/mobile/src/home/api.ts | parse/start及Library查询，已接身份绑定transport | 扩展生成类型、快照/retry/结果与受保护流；不能退回裸fetch |
| apps/mobile/src/App.tsx | 切Settings/Planner卸载Home；身份重核遮蔽、epoch清理 | 将Dock状态提升到稳定owner边界并早期收深链；保留1.0所有注销/恢复/迟到结果保护 |
| apps/mobile/src/styles.css | 旧notice/input分别fixed，无Dock图标转换 | 同一surface/列表避让/safe-area/reduced-motion，保持其他页面布局 |
| apps/server/src/routes/home.ts | 首条XHS分流；已知城市+天数；会解析并在路由传pace | 有序有效链接/未识别片段；可靠事实摘要；Home不确认pace，未知Sheet路径保留 |
| apps/server/src/ingest/link-parser.ts | 清尾部标点、host识别、Set去重，仅首条返回，其余warning | 提供批量分类与逐项安全校验，保留单链接兼容；不冒称1.8完整canonical政策 |
| apps/server/src/routes/ingest.ts | createOrGet后无条件start，响应永远created；无snapshot/retry | 真实disposition/attempt/actions/owner快照，只有受理或retry赢家派发 |
| apps/server/src/ingest/store.ts | 进程Map缓存、PG最后status/result；新认证owner/版本锁已接 | 持久事实先提交后通知、受理/重试对账与晚到attempt拒绝；保留显式legacy alias，不再次hash UUID |
| apps/server/src/ingest/pipeline.ts/types.ts/adapters.ts | failed降级后继续done；fallback能合成媒体；默认fake抽取/重托管 | 区分诊断/终止/真实partial，stub显式隔离；真实适配器由1.9–1.11交付，不加造假fallback |
| docs/api/openapi.yaml、packages/types、Prisma | 当前单job ACK/event，无新快照/动作合同 | OpenAPI先行、只生成types；新增schema用新迁移，保留旧迁移和1.0认证字段 |
| apps/mobile/src/platform/host-runtime.ts、host.ts | 核验appId后的URL只通知当时listener；没有业务来源/持久去重 | 尽量在稳定App消费接口；确需有界early delivery修补时补宿主回归，不把URL当动作许可 |

建议NEW：home/import-dock-state.ts（纯状态机/时钟）、HomeImportDock.tsx、home/input-inbox.ts与窄clipboard适配；名称可随实现合理调整，不另建React根/认证栈/第二个输入页。先完整读每个UPDATE文件，再测试驱动改动。

### 权威与边界

- 正式epics优先于旧Dock文案/原型：终止为“这条导入未完成”，只有真实保存才partial；紧凑chevron向上，图中的最近行程不归本Story。
- 1.7负责原子事件日志/单调seq/durable cursor/租约和进程重启任务恢复；1.6的必要快照与动作重放防重不省略，也不把Map事件当1.7实证。
- 1.8负责稳定ImportRecord、完整owner记录详情/原URL入口及normalization版本/短链canonical。1.6只提供真实已有结果可达，不复制第二套owner目录。
- 1.0当前新认证和原生传输源码/PG验证可复用，但真实登录/归因/协议/双端门槛仍pending；1.6不得通过测试头或Noop声明生产导入。3.1与历史2.2保持原暂停和唯一身份映射。

### 依赖与技术核对（2026-09-19）

沿现有Node22.22.1、pnpm11.7.0、React19.2.7、Vite8.0.16、Fastify5.12.1、Prisma5、Capacitor8.5.2；不为队列重写框架或盲升依赖。native网络和安全store复用1.0，Android保持现有compile36/OkHttp5.4兼容决定。新增Clipboard插件前核对官方v8包/平台注册和实际最低系统，精确锁版本，不能因官网安装示例就假称已安装/允许读取。

- [Capacitor v8 Clipboard](https://capacitorjs.com/docs/apis/clipboard)：read返回type/value；只在用户动作调用，不复制示例里打印原始剪贴板的日志。
- [W3C Clipboard API](https://www.w3.org/TR/clipboard-apis/)：安全上下文/用户激活及实现权限差异，不能可靠读取时保留手动路径。
- [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)：CLOSED错误不可静默忽略；显式终态关闭和失败区别由绑定stream负责；浏览器EventSource没有任意自定义header选项。复用公开预期身份/认证cookie或native私有header注入，不把secret放URL。

### 验证矩阵

| 范围 | 必验反例 |
| --- | --- |
| 输入/受理 | 全有效/全无效/混合/标点/重复/超限、每链接顺序、部分429、ACK丢失同操作恢复、跨owner/旧client |
| 状态/结果 | 缺title/city/count、纯失败/真实partial、DB提交失败不先播成功、reused运行/完成/失败、旧attempt晚到 |
| 呈现 | 同时与乱序完成、重复终态、完整10秒、后台/离页剩余时间、不断追加批次、同owner导航恢复 |
| 恢复 | 断连非失败、快照失败非空、原job retry单赢家/未知结果、两个API实例只派发一次；1.7durable范围单列 |
| 原生/隐私 | 冷暖深链/登录中/重复/重启/跨owner、拒绝粘贴、无自动读剪贴板、无raw input/URL遥测、旧响应不能提交为新账号 |
| UX/回归 | ≥44pt、键盘焦点/读屏、reduced-motion/120–180ms、safe-area/大字号；保留Library/自然语言/单链接基线，Web与双端分别留证 |

### 工程条件责任与证据

六项条件的当前执行状态写Sprint.condition_progress[本story]；实施/测量由Codex负责，复核为分离测试/审阅；METRICS-02目标及真实人评决定仍归yimeng-tong。OPS/DB/METRICS源为implementation-prerequisites-2026-09-15.md对应同名章节，APP源为app-implementation-prerequisites-2026-09-19.md的APP-HOST-01。开始/关闭要求已经落入T0/T7；验证必须有本Story范围的现存repo证据，不能从1.0复制verified到全局。

### References

- _bmad-output/implementation-artifacts/research/story-1-6-backend-context-2026-09-19.md — 完整后端读取/缺口与1.7/1.8边界。

- _bmad-output/planning-artifacts/epics.md — Story1.6及相邻1.7/1.8，11组当前GWT。
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml — requirements/bindings/input-attribution。
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml — catalog/hash/order/工程条件/暂停。
- docs/prd.md — FR2/3/14/17–19/49/52、NFR2/6/8/25、统一输入与深链。
- docs/ux/home-import-dock.md；docs/front-end-spec.md — Dock、18组提示和UX-DR36。
- docs/architecture/frontend-architecture.md、backend-architecture.md、data-models.md、rest-api-spec.md、testing-strategy.md、app-host.md。
- _bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png — 已读结构参考；story-1-4-home-hybrid-r3.png为早期基线。
- docs/ux/prototype-coverage.md — 缺原型的mixed/失败/重连/a11y状态由实施截图补。
- _bmad-output/implementation-artifacts/1-5-settings-feedback-and-account-entry-points.md — 历史1.5经验，只保留已有请求/测试/隐私模式，BYOK/邮件打开成功的旧范围不重新实施。
- _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md、story-1-0-dev-progress-2026-09-19.md、story-9-1-dev-progress-2026-09-19.md — 当前认证/宿主与真实门槛。

## Dev Agent Record

### Agent Model Used

GPT-6 Astra（当前任务配置）。

### Debug Log References

准备依据当前工作树及baseline7250a8a；最近提交含旧2.2/2.1领域和PVE验证，不能据提交标题解除3.1暂停。先保存当前1.0未提交成果，不reset/clean。

### Completion Notes List

- 2026-09-19：按已批准持续执行方向准备合同，完整承接11组GWT、source_obligations及工程条件；已完成两份独立准备复核并落实state_version、服务端retry准入及partial保留三项修正，不表示代码/服务/App完成。

### File List

以下为Story1.6触及文件（部分同时保留1.0/9.1未提交成果），不将完整工作树全部归入本Story：

- _bmad-output/implementation-artifacts/1-6-home-multi-link-import-queue-and-honest-status.md
- _bmad-output/implementation-artifacts/story-1-6-dev-progress-2026-09-19.md
- _bmad-output/implementation-artifacts/story-1-6-local-validation-2026-09-19.json
- _bmad-output/implementation-artifacts/sprint-status.yaml
- CURRENT.md
- docs/api/openapi.yaml
- packages/types/src/api-types.ts
- packages/prisma/schema.prisma
- packages/prisma/migrations/20260919000200_story_1_6_ingest_snapshot/migration.sql
- packages/prisma/tests/ingest-migration-seed.sql
- packages/prisma/tests/ingest-migration-fixture.sql
- packages/prisma/tests/ingest-migration-invariants.sql
- apps/server/src/ingest/link-parser.ts
- apps/server/src/ingest/link-parser.test.ts
- apps/server/src/ingest/job-state.ts
- apps/server/src/ingest/job-state.test.ts
- apps/server/src/ingest/store.ts
- apps/server/src/ingest/pipeline.ts
- apps/server/src/ingest/types.ts
- apps/server/src/schemas.ts
- apps/server/src/ingest/command.test.ts
- apps/server/src/ingest/routes.test.ts
- apps/server/src/routes/home.ts
- apps/server/src/routes/ingest.ts
- apps/server/src/application.ts
- apps/server/scripts/auth-ingest-probe.ts
- apps/server/scripts/ingest-contract-probe.ts
- apps/server/scripts/home-library-contract-probe.ts
- scripts/sse-assert.ts
- scripts/check-ingest-dock-contract.test.mjs
- .github/workflows/ci.yml
- ops/pve-staging/auth-migration-preflight.py
- ops/pve-staging/prepare-auth-validation.py
- ops/pve-staging/run-auth-persistence-probe.py
- apps/mobile/src/App.tsx
- apps/mobile/src/App.test.tsx
- apps/mobile/src/auth/stream.ts
- apps/mobile/src/auth/stream.test.ts
- apps/mobile/src/home/api.ts
- apps/mobile/src/home/HomeScreen.tsx
- apps/mobile/src/home/HomeScreen.test.tsx
- apps/mobile/src/home/HomeSheet.tsx
- apps/mobile/src/home/HomeImportDock.tsx
- apps/mobile/src/home/dock-controller.ts
- apps/mobile/src/home/dock-controller.test.ts
- apps/mobile/src/home/dock-model.ts
- apps/mobile/src/home/dock-model.test.ts
- apps/mobile/src/home/dock-announcement.test.ts
- apps/mobile/src/styles.css
- apps/mobile/scripts/home-dock-browser-probe.mjs
- _bmad-output/implementation-artifacts/evidence/story-1-6-browser-2026-09-19/report.json
- _bmad-output/implementation-artifacts/evidence/story-1-6-browser-2026-09-19/mobile-queue-partial-completion.png
- _bmad-output/implementation-artifacts/evidence/story-1-6-browser-2026-09-19/desktop-queue-reconciled.png

- docs/ops/input-link-v1.md
- apps/mobile/package.json
- pnpm-lock.yaml
- apps/mobile/src/home/clipboard.ts
- apps/mobile/src/home/clipboard.test.ts
- apps/mobile/src/home/input-inbox.ts
- apps/mobile/src/home/input-inbox.test.ts
- apps/mobile/src/home/input-runtime.ts
- apps/mobile/src/home/input-runtime.test.ts
- apps/mobile/src/platform/HostBootstrap.tsx
- apps/mobile/src/platform/host-runtime.ts
- apps/mobile/src/platform/host-runtime.test.ts
- apps/mobile/src/platform/native-build-config.ts
- apps/mobile/scripts/verify-native-project.mjs
- apps/mobile/android/capacitor.settings.gradle
- apps/mobile/android/app/capacitor.build.gradle
- apps/mobile/ios/App/CapApp-SPM/Package.swift

- apps/mobile/src/home/operation-journal.ts
- apps/mobile/scripts/operation-journal-browser-probe.mjs
- docs/ops/input-operation-journal.md
- _bmad-output/implementation-artifacts/evidence/story-1-6-journal-2026-09-19/report.json

- apps/mobile/src/home/journal.test-support.ts

- _bmad-output/implementation-artifacts/evidence/story-1-6-browser-2026-09-19/mobile-recovered-original-operations.png

- package.json
- packages/types/package.json
- packages/types/src/import-measurements.ts
- scripts/measurements/import-report.mts
- scripts/measurements/import-report.test.mts
- scripts/measurements/run-import-dock.mts
- scripts/measurements/tsconfig.json
- apps/mobile/scripts/import-measurement-harness.tsx
- docs/ops/import-measurements.md
- _bmad-output/implementation-artifacts/evidence/story-1-6-measurement-2026-09-19/validation.json

- apps/mobile/src/telemetry/dictionary.ts
- apps/mobile/src/telemetry/dictionary.test.ts
- apps/mobile/src/telemetry/runtime.ts
- apps/mobile/src/telemetry/runtime.test.ts
- apps/mobile/src/auth/analytics.ts
- apps/mobile/src/auth/analytics.test.ts
- apps/mobile/src/auth/LoginScreen.tsx
- apps/mobile/src/planner/PlannerScreen.tsx
- apps/mobile/src/planner/DayPlanScreen.tsx
- apps/mobile/src/planner/DayPlanScreen.test.tsx
- apps/mobile/src/settings/SettingsScreen.tsx
- apps/mobile/scripts/telemetry-browser-probe.mjs
- docs/ops/telemetry-first-use-v1.md
- _bmad-output/implementation-artifacts/evidence/story-1-6-telemetry-2026-09-19/validation.json
- _bmad-output/implementation-artifacts/evidence/story-1-6-telemetry-2026-09-19/browser-report.json

- ops/telemetry/umeng-sdk-lock.json
- scripts/telemetry/audit-umeng-sdk.py
- scripts/telemetry/run-android-sdk-probe.py
- ops/telemetry/android-probe/settings.gradle
- ops/telemetry/android-probe/build.gradle
- ops/telemetry/android-probe/gradle.properties
- ops/telemetry/android-probe/app/build.gradle
- ops/telemetry/android-probe/app/src/main/AndroidManifest.xml
- ops/telemetry/android-probe/app/src/main/java/dev/nomad/sdkprobe/ProbeActivity.java
- docs/ops/umeng-sdk-artifact-audit.md
- _bmad-output/implementation-artifacts/evidence/story-1-6-umeng-sdk-2026-09-19/artifact-audit.json
- _bmad-output/implementation-artifacts/evidence/story-1-6-umeng-sdk-2026-09-19/android-lifecycle.json

### 实施开始

2026-09-19：按持续授权进入T0/T1，启动前快照在/tmp/nomad-story16-start-20260919。保留1.0/9.1和全部原工作树变更；新增接口先写反例，再扩展现有IngestJob/命令回执/事实快照，不另造ImportRecord或持久事件日志。


### T2–T5 当前实现与限定审阅

2026-09-19：App按认证epoch持有ImportDockController；离开Home暂停可见计时/流，返回先对账，身份重核遮蔽，换owner/session清空。批次按序受理但编辑不锁；未知受理/retry保留同一operation，拒绝可放回输入。单流+串行快照查询和退避避免抢占native并发配额或认证刷新循环。FIFO可见时间从实际渲染确认开始，后台/离页/Sheet遮挡暂停。

一个Dock承接批次/队列/完成窗口/事实摘要/composer；44px、焦点、简洁读屏、reduced-motion和真实结果Sheet已接入，已选结果不可误取消。选择/候选/结果路径保留旧Library与planner handoff；Home陈旧额度文案移除。9项客户端审阅缺陷全部修补，详细证据见progress及浏览器report。仍未完成T6深链/主动粘贴/真实归因、T7测量与真实Android/iOS验收，不标Story review/done。


### T6 第一段：主动粘贴与未确认inbox

固定Clipboard8.0.1并注册双端；仅用户动作读取，失败/非文字/超长保留手动输入，迟到返回受草稿revision和认证activity栅栏约束。HostBootstrap在宿主启动前订阅当前URL总线；第一方input-v1入口严格校验来源/路径/参数/到期/编码，内存pending、摘要并发、指纹均有界，账号变化清除旧内容。外链先放入同一composer，仍需确认发送；无自动剪贴板、无URL认证、无实际归因投递。

开发协议/资源边界见docs/ops/input-link-v1.md。尚缺已确认动作持久日志及跨进程对账，所以C05不关闭；真实U-Link/U-App和双端系统交互仍需实际证据。最新代码/Android构建/浏览器证据归本Story的progress/local-validation，不把编译或替身当原生运行。


### T6 第二段：持久日志存储核心（尚未接入控制器）

operation-journal实现真实IndexedDB原子批次/指纹和同entry未知retry、AES-GCM私有正文、owner/operation/kind AAD、不可导出CryptoKey、strict事务、过期/容量维护及明确错误。正文24h逻辑失效并在相关存储活动清除；元数据/密钥7天，retry仅含公开job/version引用随元数据保留。不是认证vault/XSS边界，服务器回执仍为事实权威。

实际两个Chromium进程和双标签页通过20项存储证明（含失败/回滚/篡改/TTL/损坏/连接恢复），另有端口占用负例；20项报告的源码SHA与当前文件一致。完整workspace build通过。详见docs/ops/input-operation-journal.md；接续应把当前controller随机ID/发送/重试流程接到prepare，恢复先GET原回执，未知写入不自动POST。当前客户端生产路径尚未消费该核心，因此不能把日志单独测试当App重启恢复、真实归因或native证据。


### T6 第三段：控制器/输入接线与浏览器重启

生产controller默认使用真实operationJournal；普通提交/未知分类显式链接选择/原job重试均先持久prepare，再派发原operation。prepare失败不清空输入、不发送，原回执更新失败不否认已知服务端成功。恢复先读owner记录与原回执，404只提供显式继续；原文过期保持unknown并可核对，释放输入容量。完整10秒可见展示后才noteDone，跨进程重放已完整显示的旧终态不重新入FIFO。

外链使用贡献范围及服务端URL出现位置绑定；提前冻结指纹，用户修改其他草稿不影响已提交动作，未识别内容保持未claim。多个指纹同事务关联；部分指纹已被其他确认占用的并发冲突保留全文，提示移除已确认部分后重试，未确认贡献仍跟随完整文本片段保留。无自动重新提交未知写入。词法固定入口兼容旧Chromium的custom scheme解析差异，实际Chrome127已覆盖。

当前192移动测试+3配置、真实服务器parser/routes及完整ingest回归、实际Chromium两进程Home+真实IDB+受保护API替身通过。原生系统深链投递、真实登录/U-Link/U-App、iOS存储支持与设备恢复仍未验收；不从浏览器替身关闭这些门槛。具体最终证据以本Storyprogress/local-validation为准。


### T7 本地测量与受理后即时状态

真实controller/React/IDB的显式fixture矩阵15条，按固定窗口记录成功/部分/失败/拒绝/未知/未终结、重试与重复帧、回执恢复和FIFO；严格字段字典、nearest-rank与分层/全局冲突排除，CLI重算一致。截止负例保持planned15/missing15而非扩窗。三层7项审阅与13统计反例通过，当前196移动+3配置、18后端及完整构建/浏览器/Android证据见progress/local-validation。

受理ACK立即建立最多一个SSE，同步订阅异常与迟到回调不改变已确认命令。测量只是本地工程闭环；METRICS-01 in-progress，真实staging/成本/目标、U-App/U-Link与原生设备保持待验收。下一段落实版本化归因/隐私字典与真实SDK资源接入，不标整Story完成。


### T6 第四段：共享隐私字典与许可核心

已接线现有页面安全出口，补字典、许可代次/队列/撤回/超时核心及7项审阅修补；217移动+3配置、21遥测核心反例和实际浏览器3个HTTP替身信封通过。scope/evidence见当前progress和`docs/ops/telemetry-first-use-v1.md`。核心runtime尚未接App默认路径，真实SDK/许可UI/规范事件发射器与三端归因查询仍待后续接入，不能把Noop或替身等同完成。


### T6 原生SDK真实制品/离线探针

固定四个官方SDK包并核对摘要；Android真实SDK离线探针已构建和执行，双IP族出站隔离、合成AppKey、无真实供应商事件。关闭组合10秒后仍有SDK数据库/信封/标识文件，不能据此实现一个谎称同步清理成功的close。iOS只有XCFramework结构/头文件核验。实际集成和许可策略门槛保持，详情见progress和umeng-sdk-artifact-audit.md；不以此关闭T6或Story。
