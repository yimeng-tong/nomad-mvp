# Story 1.6 后端、数据与 API 实施上下文

日期：2026-09-19。用途：BMAD create-story 的独立后端分析。状态：只读核验；未实施业务。

本报告只新增自身。未读取任何 .env 值，未连接数据库或真实供应商，未运行测试、迁移、部署、数据操作或修改 Git。当前工作树的 1.0/9.1 实现未提交，Git HEAD 仍为 7250a8a131a370698bff53538a4405c2ddb94c1c；不能只看旧 HEAD 推断当前源码。源码事实与进度文档中的既往验证结果分开陈述。

## 1. 当前正式合同和范围分界

已按 CURRENT → project-context → Sprint → 9月19 delivery/catalog 读取。正式 Story 1.6 为 _bmad-output/planning-artifacts/epics.md:729–800；catalog 为 sprint-migration-2026-09-19.yaml 的 story_catalog.1-6-home-multi-link-import-queue-and-honest-status：

- source_story_id：1.6。
- source_contract_sha256：41e1f19dc0148488e93e2cd6a4e4f34f06807a96c6a3fbfc1c22a1ce845e112d。
- GWT：11 组，含本轮 App C05 深链续接、C06 用户主动粘贴。
- delivery 反向绑定：FR2、FR3、FR14、FR17、FR18、FR19、FR49、FR52、NFR6、NFR8、NFR25。正式 Story Requirements 中原有 NFR2/AR/UX 也应完整保留，不因反向绑定表不同而删掉。
- 工程条件：OPS-01、DB-CHANGE-01、METRICS-01、METRICS-02、METRICS-03、APP-HOST-01。
- input-attribution source obligation 必须进入 Tasks：冷暖启动、登录中断后同 owner 恢复、重复/失效/跨 owner 深链、用户主动粘贴和拒绝降级、最小 U-Link 渠道/点击归因；不读私人剪贴板内容到日志，不自动扫描，不因进程重建重交任务。

| Story | 本次可消费合同 | 不能借本次宣布已完成 |
| --- | --- | --- |
| 1.6 | 一个 Dock 的多链接 client fan-out、真实受理/当前状态、标题与实际结果摘要、可执行的受控重试、同 job 对账、FIFO 呈现；App 输入动作续接/主动粘贴。 | 全量 ImportRecord、版本化 URL policy、跨进程 durable event cursor、真实多模态/媒体能力。 |
| 1.7（epics:802–871） | 后续在当前 job/snapshot 基础上追加不可变事件、job+event 同事务、严格 seq/cursor/replay、进程重启恢复、App挂起/杀进程恢复。 | 不因 1.6 可重连或保存当前快照，就说这些事件/跨进程保证已交付。 |
| 1.8（epics:873–940） | 后续创建稳定 ImportRecord、版本化 normalization、并发 owner+normalizedURL 唯一、record列表/详情/原始URL、显式 duplicate 和 record重试/删除。 | 1.6 的现有 job 重用不能冒充 ImportRecord 或跨版本 canonical 合并。 |

docs/ux/home-import-dock.md:28–37、66–68 的“duplicate 既有 record”“查看 ImportRecord 详情”是最终组合目标；1.6 正式 GWT:781–784 明确不认领 1.8。应给当前 job 真实可读结果/现有 Library 的可用入口；没有记录详情时不造空页面或泄露原始 URL，也不要求提前完成整张 1.8。不得增加取消按钮，当前没有真实取消端点/语义。

新 1.0 可供本地/隔离开发消费，但 Sprint 仍为 in-progress，真实认证/归因/生产恢复未通过。9.1 Android 调试构建不等于 Android/iOS 真实宿主验收；iOS/签名/设备缺项保留。1.6 准备与独立开发不改变这两张状态，更不解除 3.1 暂停。

## 2. 现有后端：实际行为、需改内容、保留内容

### 输入与单链接受理

| 文件/函数 | 当前实现 | 1.6 改动/保留 |
| --- | --- | --- |
| apps/server/src/routes/home.ts:26–44 extractTripParams | 硬编码已知城市，必须识别恰好一个城市及天数；日期有真实日历验证；会从文本推导 pace。 | 保留安全、可解释的自然语言分类和 unknown 分支；Dock 只呈现 city/days/date，不提前确认 pace。沿已有进入 S2 的应用路径交接；不要把本 Story 扩成新的全套 NLP/规划。 |
| 同文件:47–61、64–94 | handoff 仍为 /planner/pick，可能携带 pace；xhs 分类只有单个 url，回显 original_text，warning 为余下链接请逐条粘贴。 | 多链接分类需给按出现顺序可提交的项目及未识别片段原因，或由客户端同一纯解析合同处理；仍由客户端逐个调用现有单链接 API。不得在该 parse 路由直接批量启动 jobs。原始输入不进入分析/日志。 |
| apps/server/src/ingest/link-parser.ts:20–76 | share_text 用 http(s) 正则提取；清末尾标点、检查 XHS host/subdomain、去 fragment/尾部斜杠，再 Set 去重，只返回首个url + extraUrls。无效片段被直接过滤，没原因；没有短链展开或 normalizationVersion。 | 复用纯解析边界，保留单链接旧调用兼容；新批次结果不能静默丢掉 extraUrls/无效片段。重现重复链接与 batch ordinal 的规则应明确。1.8 才处理完整版本化展开/追踪参数/canonical policy。 |
| 同文件:28–42 isXhsUrl/normalizeXhsUrl | isXhsUrl 本身只查 hostname；直接 input.url 并未显式限制 http/https、userinfo、port，不能把 z.string().url() 当支持范围校验。 | 所有入口复用明确的 http(s)/支持host规则；拒绝不支持scheme、含凭据/混淆host等形式；不在本次凭猜测做短链归一。 |
| apps/server/src/routes/ingest.ts:15–36 startIngest | parse 后 createOrGet，随后无条件 startIngestPipeline；返回始终 state:'created'、ingest_id、sse_url、warning。已存在 running/done/failed job 也返回 created。 | 返回事实受理 disposition 和当前状态/快照引用，不能让重用任务看似新建。仅对确实新受理或赢得 retry 状态转换的请求派发执行。保留每次一条 URL、canonical/legacy SSE URL、202受理语义和 trace。 |
| 同文件:99–119 | 两个单链接 POST、两个 SSE 别名，无 GET 当前job快照或 retry端点。 | 为失败/网络中断对账补 owner-safe 最小状态查询与真正可执行的原job重试；不能用重新 POST 原文当恢复。无批量 scrape API，无假的 retry按钮。 |
| apps/server/src/schemas.ts:3–17 | Ingest start/url/share_text 没长度上限；force可选但路由并未消费；Home text max2000。 | 明确输入/批量项数与字节上限的实际限制和逐项反馈，不能静默截掉有效链接；不让 client force 绕过权限/去重。必要时同步废弃或严格保护 legacy force 文档。保留 Home 正确错误 envelope。 |

### Job、事件和结果存储

- apps/server/src/ingest/store.ts:55–58 仍是 jobs/sourceHashIndex/subscribers/memoryInspirations 四个进程 Map。生产有 PostgreSQL job/结果，但 Map 与订阅仍是实时管线基础。
- createOrGetIngestJob（131–209）已经继承 1.0 的真实 owner 和资格：真实模式无 DB 返回 AUTH_AUTHORITY_UNAVAILABLE；同 owner retainedSourceHashes 兼容已审查 legacy alias；多个旧hash匹配抛冲突；新建事务调用 lockQualifiedOwner；P2002 后重读 owner job。必须保留这些行为，不能还原二次hash、header直通或生产自动建User。
- 该方法只返回 job，没有 created/reused 标志。route 每次都 start，pipeline.runningJobs 只是本进程 Set；另一实例重用一个 fetching/parsing job，会再次跑同一管线。数据库唯一 sourceHash 只避免第二行 job，不等于避免第二次执行。1.6 的最小修复是让受理/重试结果携带真实执行责任，只有新建/比较交换成功者派发，1.7 再扩展完整恢复/租约体系。
- sourceHashFor（69–70）为外部传入 owner + normalizedUrl 的 hash；真实输入现在是 canonical owner，兼容旧hash必须继续使用 retainedSourceHashes（148–158）。1.6 不重写既有 sourceHash 或假定它已经是 1.8 的版本化 normalization。
- getOrHydrateJob（118–128）优先返回 cache；否则按 job id 查 DB并 catch所有错误为null，随后会载入 sourceUrl再由route检查owner。新 snapshot/retry 应集中到 getOwnedJob(owner,id) 类入口，在查询条件中带 owner、使用安全DTO，并区分 DB失败与不存在。不要把数据库断连当作404或返回其他owner缓存。
- hydrateJobFromDb（77–115）只构造一个当前状态事件，用 Date.now() 作ts；丢失真实事件时间、counts、retriable、source title和结果。它不构成持久replay，也不能为既有done编造新完成次数/新FIFO窗口。
- appendIngestEvent（212–245）先变Map、通知订阅，再更新DB；DB写失败被吞掉。没有 event seq/stateVersion/不可变事件表；retryCount只写当前值，没有实际增长逻辑。1.6 必须从已确认状态生成快照/成功摘要并诚实显示无法确认；1.7 才把事件和快照做同事务持久序列，不能在1.6报告已拥有durable cursor。
- persistIngestOutput（257–477）生产在同事务先 lockJobOwner（310），upsert Inspiration，替换该灵感资产/候选/证据，写 CanonicalPOI/AnchorPool，最终写job done；保留 owner资格和原有Library/候选/待定位不变量。结果返回 inspirationId/locateStatus/assetCount/candidateCount，但 pipeline 没向客户端传这些result refs、城市、真实来源标题。
- Library（store.ts:491–622；routes/library.ts:12–39）只读取已保存 Inspiration，列表按owner，DTO不返原始URL/userId；待定位候选跨owner/不存在均404。它不是导入记录表，无法展示尚未成功保存的任务。

### 当前“失败→done”不能直接映射到新 UX

apps/server/src/ingest/pipeline.ts 全部130行需要在实施前保留上下文：

- startIngestPipeline:10–25 对 done/failed直接return，因此当前“再POST同链接”不能实现failed重试；runningJobs只限制本进程。
- runAsAcceptedJob:15 已脱离浏览器session，只保留owner/authVersion；普通退出不取消已受理任务，账号资格仍控制发布。新retry不能丢掉这一层。
- appendDegradedFailure:32–38 把阶段降级写成state:'failed'且retriable:true，随后管线继续parsing/geo/storing并done。UI若把第一个failed当终态，会提前展示失败并漏掉最终结果；若无条件覆盖为成功，又会隐藏真正错误。
- fallbackPost:41–52 在获取失败时合成“小红书灵感”和假media URL；runIngestPipeline:71–73 写旧text/ocr/vision梯级；117–121无条件按保存一份灵感写stored_count:1；122–128对所有异常一律retriable:true并把error.message直接放事件。
- adapters.ts:60–85 只有配置 XHS_DOWNLOADER_URL 时才实际请求，缺配置就合成杭州笔记；88–101 rehostMedia仅生成COS key，不上传；104–140抽取/geo仍是stub。即使真实认证和PostgreSQL可用，这也不是已交付生产入库能力。

1.6要把“本次处理已终止”和“阶段降级/部分已保存”明确分开，并只以真实成功保存的结果证明 partial。没有真实媒体上传时不能把合成cosKey当“图片已保存”；没有真实内容时不能用fallback文案当完整导入。建议显式注入fixture，真实运行缺能力返回已知不可用；真实production extraction/rehost继续由1.9/1.10/1.11交付。新用户呈现只映射fetching/parsing/geo/storing与准确终态，不显示Provider、旧diagnostic阶梯或百分比。

旧text/ocr/vision可作为旧事件输入兼容；新的media_prep/speech_detect/frame_extract/asr/multimodal只能在实际执行对应步骤时写，不能在1.6为赶齐字段把三个旧stub事件机械改名为新步骤。完整持久事件写入协议由1.7承接。

## 3. 1.6 最小可消费 API/数据合同建议

下述名称是实施建议，最终路径/字段由主Story写入OpenAPI定稿，不是已经存在的API。

1. **分类结果**：现有 HomeInputParseResponse 的url兼容字段可保留，新增按出现顺序的有效项/安全问题原因；本次批次仍在客户端形成，逐项调用 POST /ingest/xhs。N按服务器实际受理或明确重用结果计数，不能按正则命中数、解析成功数或先行乐观计数。失败/未识别/受理未知分开；一项429不丢掉其它已受理项目。
2. **单链接受理回执**：保留 ingest_id、sse_url，补真实 current state、new/reused disposition、可读取当前快照位置。需要返回的title、result都来自服务器已确认事实；未知title用中性占位，不能拿原始URL作标题。返回已存在done不再次执行或重复统计新导入。
3. **Owner-safe 当前job快照**：建议 GET /ingest/:jobId，包含job id、attempt/状态版本、当前事实stage、safe title、updated/occurred time、终态/retriable/稳定原因、事实counts、已保存结果ref/定位状态/可用城市。未知值为null/unknown，不能默认0或假城市。响应不含原始URL、provider token、原始输入或其它owner存在性。与SSE使用同一DTO转换。
4. **显式原job重试**：建议 POST /ingest/:jobId/retry，身份+expected owner/session仍由1.0验证，再核对资源owner/资格和retry条件；用operation_id + expected_attempt/state_version去重并比较交换推进。并发/响应丢失重试返回同次已接受结果；旧attempt的迟到完成不能覆盖新attempt。仅真实可重试失败允许；普通连接中断先读状态，禁止自动重跑原输入；所有异常一律retriable当前模式要改。
5. **最小持久摘要**：IngestJob已有status/retryCount/lastError，可按实际需要追加safe sourceTitle、stateVersion、terminal disposition/retriable、counts/result摘要、attempt或重试回执字段。结果可关联现有Inspiration，不要求现在创建ImportRecord；新增字段/migration必须有实际使用与兼容默认值。状态版本用于拒绝旧响应，不声称它是durable cursor。
6. **确认后再发布**：受理成功以DB commit为界；保存成功/partial只从已提交结果计算，不能先Map通知后吞数据库失败。状态查询/事件不一致时明确reconcile/unknown，保留最后已确认状态。1.7接着将相同领域快照和event记录原子化并添加真实seq，而不重做1.6所有呈现逻辑。
7. **恢复引用**：客户端可持有owner分区的batch/item/job/attempt/最后确认状态/完成展示身份，以当前1.0身份重新确认后查询同job。C05要求重复深链/进程重建不新建任务，不能仅靠本进程Set；已受理任务引用与明确输入动作身份要能恢复，未知受理先查原操作而非重新创建。1.7负责缺失事件重放和C07；1.6不承诺后台SSE常驻。

批次ordinal、展开/紧凑、N/X及10秒完成FIFO属于客户端呈现状态，不必引入服务端Batch实体。真实计算可并行，但派发需有界；展示的10秒不占用worker并发位。对重复terminal事件按job+attempt/状态版本识别，不能新开相同结果窗口。尚无真实ImportRecord detail时，只提供当前已存在、owner验证的结果入口；不能让“查看”跳到404或公开原始URL。

Prisma现状：schema.prisma:388–403 IngestJob 无标题/结果/事件序列/policy；405–428 Inspiration只有可选job关联，成功保存后才出现；没有ImportRecord/IngestEventRecord。User.authState/authVersion（131–149）、IngestJob.authVersion必须保留；不能把新job摘要迁移改成可信旧owner回填。1.0迁移20260919000100_story_1_0_auth_authority保留，由1.6另加增量迁移；不改旧migration或db:push --accept-data-loss。

## 4. 必须复用的新认证/宿主基础

当前源码已经不同于9月17后端研究报告，不可再把生产路径描述为无条件x-user-id认证：

- apps/server/src/plugins/auth.ts:35–108 真实service路径默认保护所有非public route；Web写入严格allowed Origin，native要求HTTPS、精确audience、无Origin/混合Cookie；expected owner/session仅在真实认证后检查一致性。普通API要用X-Auth-User-Id/X-Auth-Session-Id；SSE可用公开auth_user_id/auth_session_id上下文查询值，不能放credential在URL。
- 同文件:94–106 私有GET成功回包前再次authenticate；状态快照的新GET自然受保护。新增POST retry需保留该plugin与持久事务owner guard，不能只靠authGuard存在user字段。
- apps/server/src/auth/owner.ts:17–22 真实模式dbOwnerId直接使用校验过的canonical UUID，只有显式fixture仍走legacy hash；59–62 retainedSourceHashes读经证据绑定的alias；30–56 lockQualifiedOwner是写入同事务内资格/session锁；65–76 lockJobOwner/runAsAcceptedJob用于已受理任务。
- apps/server/src/auth/sse.ts:4–56 createAuthorizedSse串行发送，逐次验证身份/会话，1秒后台检查、5秒authority超时、最多64pending后关闭。ingest route:53–57已经接入；新snapshot/SSE/retry不得旁路它或用普通reply.sse发送私有payload。
- apps/server/src/application.ts:43–82 已用明确CORS配置和限制proxy、安全logger、统一认证；59–63的默认真实rate key是IP，ingest route仍单独30/day但没有owner并发/共享预算实现。批量fan-out要正确处理服务器限流，不能为UI畅通取消服务器约束。
- runtime-boundary.ts:10–24 将开发header/Map认证限定到显式local/test fixture。测试可继续该隔离分支，但真实API矩阵必须覆盖service+PG及Web/native；不能依靠fixture绿灯宣布认证链真实完成。
- docs/architecture/app-host.md:24–30规定遮蔽 → 身份/资格 → job状态对账 → 页面恢复。1.6深链只恢复同owner已确认动作；使用9.1小型platform接口和1.0transport，不另造storage/auth/native HTTP。剪贴板只由用户动作调用。

1.0 dev-progress-2026-09-19.md记录隔离真实PG/HTTP和被拦截外网的浏览器替身证据，以及native增量；这些是文档中既往执行结果，本报告未重跑。真实PNVS/图形/U-App/U-Link/旧owner迁移/生产PITR仍未验收。1.6可推进本地工作，真实开放/对应App关闭门槛保留。

## 5. API SSOT与兼容注意

docs/api/openapi.yaml已全文程序读取2966行，并读取相关path和schema完整块；不要手改packages/types/src/api-types.ts。

- HomeInputParseResponse（2013–2028）只有xhs_link/trip_params/unknown与单url，HomeTripParams（1979–1986）包含pace；按上面的多项分类和不提前确认pace合同扩展，不盲删旧client所需字段。
- IngestStartResponse（2171–2179）state枚举只能created，与复用事实不符，需扩展；IngestWarning（2181–2187）旧文案“一次仅处理一条链接，其余请逐条粘贴”不得在新版批量Dock作为用户主提示。
- IngestEvent（2199–2215）只有旧state、旧sub_stage、counts/errors/ts，无title、result、snapshot版本/attempt。新增安全字段需使服务端TS类型、生成type、前端映射一致。
- docs/api/sse-events.schema.json 当前IngestEvent additionalProperties:false，却没sub_stage、实际counts、error_code/error_message/retriable，反而有旧note_id/error；与现有实际事件已经不同。若本Story以该schema验事件，必须同步到API SSOT，不能只改OpenAPI类型让另一校验器拒收。
- SSE示例写id，但当前ingest route实际没有id字段，也不消费Last-Event-ID；不要因示例存在就报告durable重连完成。1.7负责严格cursor实现。
- 已有Home/ingest/library路径现在都声明SessionAuth或BearerAuth、错误响应及新认证参数；新增snapshot/retry要相同标准。旧SSE别名也需补齐一致的expected-context文档，不能做权限逃生口。
- legacy force（2169）文档声称admin/flag可绕过幂等，但代码没实现；1.6不启用此能力，不允许普通客户端force破坏队列唯一性。

## 6. 测试和验收证据

现有两份后端probe已完整读取：

- ingest-contract-probe.ts:38–44显式test fixture且删除DATABASE_URL；46–51断言首URL/余项warning；106–128断言旧text/ocr/vision、四阶段全部失败仍done；154–218涵盖无认证401、跨owner SSE404、canonical/legacy API。必须改与新诚实状态冲突的断言，同时保留旧入口兼容及owner负向。
- home-library-contract-probe.ts:69–76相同隔离fixture；84–108期望首个XHS link及planner旧handoff；119–127保留日期/零天/多城市无法可靠识别的unknown；130–184验证Library/候选owner过滤与安全DTO。新批次和自然语言交接要覆盖，不删Library回归。
- 新认证auth/sse.test.ts和HTTP/PG probe可作fixture模式与service模式分层的参考；本报告读取其生产消费代码，未重跑该认证测试，也不声称1.0闭环完成。

最低新增测试矩阵：

1. 混合有效/无效/重复/含标点链接按出现顺序分类；不支持scheme、混淆host、边界长度/批量上限；全部无效保留输入；有效项不因另一项失败丢弃。不存在第二套批量服务端抓取入口。
2. 每项真实受理与429/503/未知ACK分开；重试原操作不重复执行；new/reused running/done/failed回执准确；两个实例并发相同owner+URL不重复执行；跨owner同URL独立。
3. source title迟到/超长/HTML样式/缺失不变为原始URL泄漏；已保存计数、城市/定位未知、可恢复失败/终止失败/真正partial分别测；无外部能力不能生成假完整成功。
4. GET snapshot不触发执行，资源owner在载入受保护字段前验证；不存在/他人中性响应；DB故障不是404；old stateVersion/attempt不覆盖新事实；终态不再被网络中断改成业务failed。
5. 原job retry双击/响应丢失/跨实例竞争只推进一次；非retriable拒绝，旧attempt晚到结果被fence；账号失效及auth_context_changed不作为普通导入重试。
6. 活动SSE和重连：保留最后确认状态，不自动POST；replay重复不重开FIFO；permission/authority失败正确关闭；订阅/计时器清理；客户端未知网络状态与job终态分开。仅同job/snapshot恢复的证据不冒充1.7跨重启cursor。
7. 独立前端FIFO假时钟：每个完成结果完整10秒、后续FIFO、运行更新不抢占、继续输入不重置；N/X绑定原批次；完成、显示和查看指标不双计。后台/恢复按宿主合同保持可确认状态，测试不得把后台SSE常驻当保证。
8. App冷/暖/登录中深链、重复URL事件、失效与跨owner、进程重建；仅当前真实会话恢复已确认动作；主动粘贴允许/拒绝/缺桥，日志不含原文。实际Android/iOS矩阵与Web回归分列。

相关现有命令（本轮均未执行）：

    pnpm -F nomad-types run generate
    pnpm -F nomad-prisma run generate
    pnpm -F nomad-server run test:ingest
    pnpm -F nomad-server run test:home-library
    pnpm -F nomad-server run test:auth-config
    pnpm -F nomad-server run test:auth
    pnpm -F nomad-server run test:planner-domain
    pnpm -F nomad-mobile test
    pnpm -r build
    pnpm run ci:handoff
    git diff --check

有实际schema/状态写入变更时，另新增隔离PostgreSQL受理/重试/owner/回滚或恢复测试并给可运行命令；不能用删DATABASE_URL的现有probe证明数据库一致性。最终运行与截图按主Story范围执行，当前仅报告准备。

## 7. 工程条件与真实依赖

- **OPS-01**：可复用1.0已有隔离库/恢复方法，但1.0目前仅记录环境预检和合成恢复；1.6新增job/摘要/引用fixture要补到恢复验证，不能全局标verified。真实用户开放前每日全量/15分钟增量或PITR实际链及隔离恢复仍是独立条件。
- **DB-CHANGE-01**：若增加上列快照/attempt字段，需绑定独立migration和代码版本的正向、失败及恢复验证；保留旧job、owner、sourceHash、Inspiration/Asset引用。选择真实可用的前向修复/回滚/PITR，不承诺所有DDL可无损逆转。
- **METRICS-01**：implementation-prerequisites-2026-09-15.md:121–170。1.6先实现WL-IMPORT中自己拥有的单项/批量/失败/重复/重连/缺字段数据和版本manifest、可执行报告；未来视频/模型质量填“未交付”，不假测。提交→受理、受理→持久结果、结果→前台呈现分开；FIFO10秒不得计作解析耗时（154）。nearest-rank P50/P95给N/窗口/失败/未知成本，N=0不是0ms。源码apps/server/src与scripts定向检索未见measurementVersion/WL-IMPORT/nearest-rank报告实现，不能只写事件名关闭条件。
- **METRICS-02**：同文件174–179，实际baseline、yimeng-tong版本化目标决定、发布候选同口径结果都要有。没有真实样本或目标保留未关闭，不用旧ACK/Quick数字填充；也不等8.1完整运营UI才开始采样。
- **METRICS-03**：同文件183–190，先封存确定性解析/状态/FIFO/权限反例和完整case结果；未涉及本Story LLM的分支给具体依据，不引入虚假judge或统一质量一票否决；不能替其它Story关闭真实模型人评。
- **APP-HOST-01 / input-attribution**：当前9.1platform与1.0transport可以支撑本地集成，正式双端入口/生命周期/登录后深链与U-Link/U-App查询实证仍各Story核验。集成SDK、Android编译、合成截图不能替代真实宿主来源/点击归因与隐私选择。拒绝剪贴板保留长按/手动输入；不加share-receive extension。

外部依赖的准确边界：本轮不知道XHS_DOWNLOADER_URL/真实媒体/Provider/COS是否可用，未读取配置值或发请求。1.0的阿里登录资源已由其进度文件说明配置到位，不应重复索取；真实协议URL、iOS/Mac/签名/真机与U-Link集成证据仍按当前资源清单处理。缺资源只阻断相关真实验收，允许本地/隔离API和队列实现继续；不因此标1.0、9.1或1.6整张done，不切公有云、不处理既有数据、不解除3.1。

## 8. 读取与更新文件清单

当前完整逐段读取：routes/home.ts、ingest.ts、library.ts；ingest/link-parser.ts、types.ts、store.ts（622行）、pipeline.ts、adapters.ts、branch-rules.ts；plugins/auth.ts；auth/owner.ts、sse.ts、runtime-boundary.ts；index.ts、application.ts、server package.json；ingest/home-library两个contract probe。当前schema.prisma（902行）、OpenAPI（2966行）全文程序读取并输出相关完整模型/路径/schema；sse-events.schema.json全文读取。schemas.ts（290行）已再次全文程序读取，相关1–17行完整输出，1.6仅改相应输入段，Planner其它schema保留。

规划已读：CURRENT、project-context、Sprint当前状态，9月19delivery/catalog全文解析并抽取本Story绑定/条件/source obligation；epics正式1.6/1.7/1.8全文，home-import-dock全文；backend/data-models/rest-api/testing架构全文程序读取与相关章节，app-host全文；analytics、rate-limits与工程前置相关完整小节；1.0最新dev-progress全文。未把旧9月17研究中的认证漏洞现状直接沿用。

预计 UPDATE：Home解析/输入schema与类型、单链接受理/查询/重试routes、ingest状态/types/store/pipeline、OpenAPI及生成types、SSE schema、对应probes；按最小快照需要更新Prisma并新增迁移。adapters如需明确fixture/production边界可调整选择/错误合同，不在此实现1.9全部供应商能力。新测量manifest/报告脚本与新状态/重试测试是本Story NEW产物。auth owner/service/SSE基线以消费和回归为主，发现接口不足先与正在进行的1.0协调，避免两个任务覆盖同一安全实现。

主代理建议优先复核：固定created回执、跨实例重复pipeline、failed→done假终态、无真实retry、无title/result快照、Map先发布后吞DB失败、旧sub_stage/JSON schema差异，以及1.6最小snapshot与1.7/1.8的边界。
