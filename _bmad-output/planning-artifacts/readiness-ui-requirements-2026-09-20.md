# UI定向就绪：完整FR/NFR及交付核对

Source: docs/prd.md；2026-09-20。66FR/25NFR，4项FR保持延期。

## FR1

- FR1: 登录首屏支持手机号+短信登录，采用已确认的 PNVS 短信认证；如提供第三方登录，iOS 必须等权提供 Apple 登录；按批准风险/重试策略触发 PNVS 图形认证。Web/PWA、Android、iOS 的实际宿主方式分别验收。
  - 生产身份由前置Story 1.0补齐：保留已批准的登录入口，真实验证后映射稳定内部owner；同一账号允许多设备并存，普通退出只撤销当前会话，账号停用/删除可使全部会话失效。本期不提供两个已有数据账号的合并、自助解绑或新增设备管理页，测试身份不能作为生产身份。

交付：1-0-production-login-and-multi-device-sessions, 9-3-shared-ui-components-and-safe-app-sheet, 9-5-browser-flow-and-visual-regression-gates。

## FR2

- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。

交付：1-6-home-multi-link-import-queue-and-honest-status, 9-6-identity-scoped-server-read-queries。

## FR3

- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。

交付：1-6-home-multi-link-import-queue-and-honest-status, 9-6-identity-scoped-server-read-queries。

## FR4

- FR4: 小红书入库流程（每个 ingest job 处理一条链接）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 视频按时长抽帧并先做语音检测 → 图片/关键帧二次存储至 COS（禁止热链）→ AMap 标准化与验证（判定标准 POI/坐标/文字地址/营业时间/评分/人均/电话等）→ 高置信自动入库 / 低置信标记“待定位”；前台可创建多个 job 并用 SSE 分别跟踪。
 解析抽取策略（更新）：默认启用多模态 LLM（含图+文/关键帧）进行抽取；短视频（≤30 秒）应高频抽帧，长视频可按较低频率抽帧；静音或 BGM 视频跳过 ASR，含人声片段才进入 ASR；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source、source_attribution、质量等级与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。

交付：1-7-durable-import-progress-and-restart-recovery, 1-9-production-image-text-understanding-and-evidence, 1-10-adaptive-video-understanding-and-local-frame-resampling, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR4.1

- FR4.1: 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。
  - CE-01（2026-09-14确认）：Story 1.11提供受权限控制的最小桌面Web规则查看/新增/修改/停用、持久草稿、检查发布与审计。发布以预期版本和幂等操作原子生效，每个ingest/geo attempt首次使用时固定规则版本，后续筛选/重试不混用；热更新需核对实际加载/使用，失败保留原规则，不等待8.3/8.6或新增通用后台。

交付：1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR4.2

- FR4.2: 运营手工纠错地点（2026-09-15确认）：Story 1.11提供最小桌面Web入口，对已有标准地点的显示名称、文字地址和同城坐标进行人工纠错，保留理由/依据、原始高德快照与字段级人工来源；不把人工值冒充高德返回。草稿检查、差异预览、明确发布、版本/幂等回执及审计形成闭环，可通过新版本撤销人工覆盖。只纠正同一地点，不开放地点合并、跨城/分店身份改绑、通用黑名单/别名/近邻管理或任意任务重跑；已有品牌抑制规则继续保留。新查询/新任务消费固定版本的生效事实，路线缓存按事实版本隔离；已有导入/已发布行程与执行中的快照不被静默改写，用户后续修改仍走原预览/确认/校验流程。

交付：1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR5

- FR5: 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。

交付：1-8-owner-import-records-and-versioned-deduplication, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR6

- FR6: 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子；
  `required/必去` 与 `along_route/顺路` 只在 S4 Picker 中赋予，Library 中的收藏/导入
  不得静默等同任一种规划意图。

交付：1-8-owner-import-records-and-versioned-deduplication, 1-9-production-image-text-understanding-and-evidence, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR7

- FR7: AI 初始规划：根据时间、住宿、地点意图、导入证据和节奏一次生成完整、可编辑的日计划；不得要求用户先手工摆放地点。无法安全落位的 required 项明确进入未解决/候选区域，未选内容由 Agent 适量补全。

交付：2-11-constraint-first-complete-single-city-planning。

## FR8

- FR8: 时间轴编辑：用户可替换、移动到前一天/后一天/其他日期、按 1 分钟精度调整开始与结束时间、删除并撤销；首末日和无其他可选日期时正确禁用移动目标。AI 生成时间允许内部按 15 分钟精度对齐。

交付：3-1-minute-timeline-editing-and-plan-wide-undo, 3-2-controlled-candidate-placement-and-free-time-filling。

## FR9

- FR9: 增量可行性校验：初始计划必须先通过校验；用户或 AI 后续修改引入闭店、过远、超时、住宿/交通冲突时再展示冲突及可预览的修复方案，干净计划不长期占用校验卡。

交付：2-11-constraint-first-complete-single-city-planning, 3-1-minute-timeline-editing-and-plan-wide-undo, 3-4-incremental-validation-and-typed-conflict-fixes。

## FR10

- FR10: AI 行程细节完善：在已排好的计划上为所有适用槽位补充“做什么/准备什么/注意什么”、why_short 与引用来源，并在服务端保留质量/新鲜度审计状态；普通行程单不显示技术质量、新鲜度或置信度枚举。完善不得修改用户已确认的日期、时间或顺序。

交付：5-1-revision-bound-ai-detail-enrichment, 5-2-verifiable-result-sheet-and-citation-reading, 5-3-line-level-detail-editing-and-ai-preservation。

## FR11

- FR11: 导出行程图片（行程卡片）；公开格式默认 WebP，兼容失败时降级 JPEG，产品文案不承诺 PNG。
  - App 在同一版本 artifact 上增加用户主动相册保存与原生系统分享，具体结果与权限边界由 5.5 承担；Web 下载文案保持。

交付：5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing。

## FR12

- FR12: 设置页：只展示账号信息及实际可用的账户/数据/隐私/反馈操作与退出登录；完整数据/反馈流程由各自 Story 负责。不提供 AI 用量、额度或全局生成状态面板，不要求用户配置模型 Key；未部署能力不伪装为可执行，已部署但暂时失败的操作保留真实恢复路径。

交付：1-0-production-login-and-multi-device-sessions, 7-3-settings-account-and-available-actions, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results, 7-6-feedback-entry-and-reliable-submission。

## FR13

- FR13: 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。
  - 评测补充（用户确认 2026-09-07）：线上样本允许经去直接标识后参与评测，仅筛查姓名、证件、个人联系方式等直接关联个人的信息，不因可能间接推测身份清除日期、酒店 POI、路线或偏好。凭据安全、访问/外发范围、保留与删除另行控制，评测副本使用独立入口，不放宽生产遥测。质量按具体规则配置计分、提醒或人工复核，不统一“一条硬约束失败即否决”；个别阻断规则须单独对齐，运行时业务校验不变。必须支持人工打分、评语和实验对比标注，并提供轻量运营入口进行实验配置与模型迭代；生产路由/预算仍归各自受控操作。Story 8.2 的 24 条 GWT 与采用方案已于 2026-09-08 批准：promptfoo 执行确定性/完整回归，Langfuse 提供样本、人工评分/评语、逐例对比及 prompt/Playground；结果同步不重复推理，人评回收形成版本快照。确定性 CI 可离线使用，但缺少真实人评链不能验收整张 Story。
  - Story 8.1：复用 Sentry 错误诊断与 Langfuse AI 观测界面；Sentry 管理唯一全局 OTel provider，Langfuse 使用显式隔离 provider，以安全 correlation/job/attempt 关联，不承诺共享父子 trace 或完整采样。所有出口按允许字段和值级规则脱敏，不录屏或采集完整输入输出；未知数据不计零，监控故障不影响任务/行程。实际授权查询、版本兼容、保留/删除和故障隔离必须验收，托管方式与付费能力另行确认。评测、集中策略、Telegram 和运营总览仍分别归 8.2-8.6。
  - Story 8.6（2026-09-13 批准）：20条GWT及中文验收说明、两张桌面R1确认。现有Node/React薄只读总览汇总既有业务结果/降级、8.1观测、8.2封存评价、8.4账本、8.5事件和配置使用证据，复杂分析进入受保护原工具。各来源窗口/定义/权限/截至时间/覆盖与采样外推分别说明，不合并不同分母、不平均P95、不用采样数据补账或把无数据当健康。固定只读查询有界并合并/缓存/退避，部分失败与陈旧独立展示，缓存/迟到响应不跨环境或撤权范围泄漏。总览不改策略/账本/告警、不启动模型/评测/重跑/测试消息；无移动运营适配、新Grafana/iframe/公共分享前置。真实来源/权限/口径与桌面证据仍需实施验证。

交付：8-1-cross-flow-observability-and-fault-localization, 8-2-reproducible-quality-regression-and-version-comparison, 8-6-operations-overview-and-read-only-diagnostics。

## FR14

- FR14: 第三方集成（国内可用）：已确认 PNVS 短信/图形认证及适用 Apple/微信登录、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、友盟 U-Link+U-App（归因/分析）。Web、Android、iOS 的平台注册/权限/原生桥接与真实结果分别核验。异步编排使用开发框架与代码实现，复用现有服务、worker及必要队列，不以n8n或其他低代码平台为前置。

交付：1-0-production-login-and-multi-device-sessions, 1-6-home-multi-link-import-queue-and-honest-status, 1-9-production-image-text-understanding-and-evidence, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-4-unified-flight-and-rail-service-lookup, 2-7-full-city-picker-and-l3-place-intent, 2-10-authoritative-route-facts-and-timeline-transport, 5-4-revision-bound-export-generation-and-preview, 6-2-foreground-location-meal-recall-and-plan-context-fallback, 8-1-cross-flow-observability-and-fault-localization, 8-3-task-level-provider-routing-and-safe-release。

## FR15

- FR15: 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。

交付：1-0-production-login-and-multi-device-sessions。

## FR16

- FR16: 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。

交付：1-0-production-login-and-multi-device-sessions。

## FR17

- FR17: 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。

交付：1-6-home-multi-link-import-queue-and-honest-status。

## FR18

- FR18: 多条链接粘贴：识别全部支持的小红书链接，为每条创建独立 ingest job，并以 `N/X` 队列顺序展示；输入框与 `+ / 发送` 按钮保持同一底部组件，不新建第二层导入输入。

交付：1-6-home-multi-link-import-queue-and-honest-status, 9-3-shared-ui-components-and-safe-app-sheet, 9-5-browser-flow-and-visual-regression-gates, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history。

## FR18.1

- FR18.1: 导入记录与去重：灵感库展示当前用户拥有的导入记录、来源标题、解析 POI 和原始链接复制入口；记录和原始链接必须鉴权隔离。MVP 以 `user_id + normalized_url` 去重，并记录 URL normalization 规则版本；短链展开、追踪参数和 canonical URL 变化不能绕过去重。跨用户可复用计算/媒体指纹，但共享对象必须有独立 ACL、引用与删除语义，且不得泄露导入记录或批注。

交付：1-8-owner-import-records-and-versioned-deduplication, 7-5-account-deletion-and-cleanup-results。

## FR19

- FR19: 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取内容/理解图文/验证地点/保存灵感；显示来源标题、安全截断、当前事实动作与 `N/X`，不显示百分比或虚假进度条；完成项按 FIFO 各自完整展示 10 秒，后续完成项等待；失败支持重试和重连。
- FR19 补充：SSE `parsing` 的当前诊断阶段为 `media_prep | speech_detect | frame_extract | asr | multimodal`，未执行的阶段可跳过，UI 仍统一显示“理解图文”。旧 `text | ocr | vision` 仅作为兼容事件读取，不代表恢复 text→OCR→VLM 流水线。每个事件使用单调序号和可恢复 cursor 持久化，进程重启或客户端重连后可从最后已确认事件继续。

交付：1-6-home-multi-link-import-queue-and-honest-status, 1-7-durable-import-progress-and-restart-recovery。

## FR20

- FR20: 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。

交付：1-8-owner-import-records-and-versioned-deduplication, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction。

## FR21

- FR21: 时间轴微调与全局撤销：AI 编排可按 15 分钟步进；用户通过时钟式控件最小按 1 分钟调整，快速滚动只改变灵敏度，不展示 30/60 分钟吸附提示。右上全计划控件默认显示历史图标，变更后显示 `撤销 8`；倒计时结束后仍可再撤销最近一条符合条件的操作，不在底部或单日显示“最近操作”栏。

交付：3-1-minute-timeline-editing-and-plan-wide-undo。

## FR22

- FR22: 冲突分级与后续动作：结构性无效、越权和冻结预约/票务冲突拒绝写入；营业、通勤、时长、酒店/行李等派生冲突允许形成新版本但立即触发增量校验。硬冲突阻止完善行程细节与导出，软冲突可继续并保留低强调“有 N 项建议核对 · 查看”及按需风险说明；收起提示不改变冲突分类或门禁。

交付：3-1-minute-timeline-editing-and-plan-wide-undo, 3-4-incremental-validation-and-typed-conflict-fixes, 5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview。

## FR23

- FR23: AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。

交付：5-1-revision-bound-ai-detail-enrichment, 5-3-line-level-detail-editing-and-ai-preservation。

## FR24

- FR24: 导出图片规格：用户只选择固定宽度 1080 px 或 1242 px。current revision 先推导有序城市行程单元：独立单城 Plan 的全部日期合成一张城市长图；linked Trip 的每个主 TripSegment 与每个 DayExcursion 子 Plan 各生成一张城市长图，并由同一个 ExportJob 按行程顺序一起生成。城市长图用于站内逐城查看和能力允许时的系统多图分享；产品不提供按日切片，也不按城市名称合并不同 scope。一日游城市图使用 `{城市}一日游` 上下文，宿主城市图保留紧凑去返摘要。下载默认从同一 ExportJob、revision、theme 和不可变渲染快照确定性生成或复用一张整趟长图，按真实时间顺序编排主城市、跨城交通和一日游，一日游嵌入宿主日期而不重复追加。实现阶段必须用支持的浏览器、设备与 WebP/JPEG 编码器矩阵实测安全的最大 raster height、decoded pixels、内存与文件大小，并固化为版本化 `TripLongLayoutPolicy`。若加入下一个完整主城市段（含其宿主日期内的一日游）会超过该策略，系统在城市边界关闭当前 part，让该城市从下一 part 开始；每个 part 标注稳定 `N/总数`，预览先说明将下载几张。正常长度是一张图片、一个文件；超长行程仍由一次用户操作启动一个有序下载批次，但可产生多张编号图片。不得使用 ZIP、在城市内部或日期中间拆分，也不得隐藏批次分段；支持目录写入时一次授权写入全部part，逐项写入/关闭成功才可报告已保存；不支持时使用浏览器受控的多文件下载，实际交出请求且无可观察拒绝时显示“已开始下载，请确认”，内部保存结果保持未知。明确取消/拒绝/失败照实显示；未知文件重试由用户明确触发并说明可能重复，复用同批次而不重新生成或重复扣次数，不承诺自动识别未保存文件。整趟合成不调用 AI、不重新规划、不创建 PlanRevision，也不重复计入导出额度。公共文件默认 WebP，尺寸或兼容策略命中时降级 JPEG（75–80%）；城市单元每张尽量 ≤ 600 KB，整趟 part 使用独立安全尺寸/编码预算。若单个不可再分的城市单元在 fallback 后仍超出策略，返回可解释 typed failure 并保留其他城市图查看与分享，不得从城市中间截断。导出接口支持 width_px，并在预览中展示推导出的有序城市图片清单。背景使用版本化的抽象路线底纹与自有/已授权城市页头页尾素材；无城市素材时稳定降级为通用模板，不在单次导出中临时调用 AI 生成背景。
  - 2026-09-19 App 增量：保存/分享复用同一有序 manifest，平台实测内存/编码限制进入 TripLongLayoutPolicy；仅系统写入成功才显示相册已保存，部分/失败/未知分别处理。

交付：5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing。

## FR25

- FR25: 操作可用性与恢复：AI 填充/导出等工作页保留真实生成阶段、任务处理与输出数量；受限时只提供真实可用的重试、稍后继续、查看原任务或返回手动编辑等路径。不向用户展示已用/剩余额度、上限、计量窗口、重置时间或额度分级，不将内部额度原因包装成虚假排队/服务故障，不要求配置 Key。后台保护与远程开关继续有效。

交付：5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing, 6-4-trip-checklist-and-direct-or-ai-record-entry, 7-3-settings-account-and-available-actions。

## FR26

- FR26: 规划入口：底部自然语言或目的地卡先进入 S2 旅行时间；从导入灵感进入时携带 city/place hints，但仍按 S2→S3→S4 前进，不绕过必需输入。历史 `/planner/pick` 深链需补齐缺失输入后再显示 Picker。

交付：2-3-single-city-travel-time-and-boundary-confirmation, 2-7-full-city-picker-and-l3-place-intent。

## FR27

- FR27: Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。

交付：2-3-single-city-travel-time-and-boundary-confirmation, 2-7-full-city-picker-and-l3-place-intent。

## FR27.1

- FR27.1: 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精确航班/车次、2 小时时间段或 `交给 AI 安排`。住宿按夜设置酒店且允许留空，酒店名称输入后经 AMap POI 匹配；每晚同时确认早餐与行李去向，`同上` 是用户主动确认按钮。显式选择 `交给 AI`、`留空`、`未知/未决定` 或 `同上` 均可作为对应字段已确认；从未处理的 ambiguous 初始态不能被静默当作确认并越过下一步门禁。预约、门票和 dawn/sunset/night/night-market 等特殊时段由导入证据与 Agent 推导，不设独立开关。

交付：2-3-single-city-travel-time-and-boundary-confirmation, 2-4-unified-flight-and-rail-service-lookup, 2-5-preplanning-nightly-stays-breakfast-and-luggage。

## FR28

- FR28: S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐：悠闲为每天 1-3 个主要安排、较晚出发并保留较多自由时间；从容为每天 2-4 个主要安排并兼顾游览与休息；充实为优先覆盖更多地点并接受早出晚归、较多步行和换乘。默认 `从容`，但自然语言或导入证据已有明确节奏时可预选对应项，用户仍可修改。S5 不重复 S2/S3 摘要，提供默认折叠的可选“其他要求”输入，并且是唯一显示 `开始规划` 的阶段；不提供“智能编排”开关。

交付：2-6-preplanning-pace-and-additional-constraints。

## FR28.1

- FR28.1: 玩法与兴趣信号：从用户自然语言、导入内容及选择行为推导 `经典 / 吃喝 / 自然 / 拍照 / 古建 / 小众 / 逛街 / 展览` 等可多选兴趣信号；每个信号保留来源、时间、质量和置信度，不在 S2/S3 重复询问。无可靠证据时使用中性、多样化候选，不把推断伪装成用户确认，也不得覆盖 required、明确附加约束或 pace。

交付：1-9-production-image-text-understanding-and-evidence, 2-6-preplanning-pace-and-additional-constraints, 2-11-constraint-first-complete-single-city-planning。

## FR29

- FR29: Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内标题显示当前 L2。L2 仅用由子 L3 派生的非交互变色状态点和分项计数表达选择，不显示勾选框。只有 L3 页默认展开互斥 `附近 | 全城` 视角；点击/选中 L3 时地图聚焦该 POI 与附近地点，split 视角显示当前及相邻 L2，完全地图视角显示整个 L1。全城检查标题不可展开。POI 使用通用信息 Sheet，标题直接使用 POI 名称而不是“详情栏”等泛化标签，并包含地址、营业时间、评分、建议停留、来源与可选预约证据。

交付：2-7-full-city-picker-and-l3-place-intent, 2-8-shared-poi-information-sheet。

## FR30

- FR30: L3 行右侧提供互斥图标意图：勾选代表 `required/必去`，Route 代表 `along_route/顺路`；再次点击活动图标可清除。吸底汇总显示 `已选必去 X` 与 `顺路去 Y`，L3 页 CTA 为 `返回全览`，全城检查 CTA 为 `下一步`。允许 0 选择，由 Agent 使用 AnchorPool/城市热门补全。

交付：2-7-full-city-picker-and-l3-place-intent。

## FR31

- FR31: Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图、L2 分项汇总和全局计数；卡片、Marker、列表和通用 POI Sheet 状态一致。`需预约` 是证据 badge，不是第三种意图，也不代表 Nomad 已完成预约。

交付：2-7-full-city-picker-and-l3-place-intent, 2-8-shared-poi-information-sheet。

## FR32

- FR32: 单一可见 AI 规划：提交 S5 后，用户进入稳定的时间轴 shell，看到事实阶段、重连和降级状态；同一 shell 最终解析为完整可编辑计划。Planner 优先处理 required、证据强时段、住宿/行李与 transfer 边界，再安排 along_route 和 Agent 候选；无法落位的 required 与未采用候选进入明确的未解决/候选区。

交付：2-9-single-planning-job-and-stable-timeline-transition, 2-10-authoritative-route-facts-and-timeline-transport, 2-11-constraint-first-complete-single-city-planning。

## FR32.1

- FR32.1: 内部快速降级：确定性/L2/低成本路径可在超时、配额或 Provider 故障时生成可用结果，但只作为同一规划任务的降级产物；UI 不暴露 Quick/HQ 名称、双完成版本或“切换-采用”。

交付：2-9-single-planning-job-and-stable-timeline-transition。

## FR32.2

- FR32.2: 高质量编排：平台默认使用可用的高质量 Provider 完成初始编排；后台尝试必须有 attempt fencing、版本与来源记录，不得在用户已编辑后静默覆盖当前版本。内部候选版本只有在系统安全采用或用户明确预览变更时才生效。

交付：2-9-single-planning-job-and-stable-timeline-transition。

## FR32.3

- FR32.3: 候选与模糊补全：S7 候选区一级只按 intent 分为 `未安排的必去 / 顺路候选 / 其他候选`；每个地点行再单独标注 `来自灵感 / 城市热门 / 附近推荐 / 我添加的` 等来源。intent 与来源是正交字段，来源不得成为互斥一级分组，也不使用泛化 `AI` 标签。MVP 缺少可靠地点时，依次使用当前 owner 已导入且完成验证的灵感、AnchorPool/版本化城市 Top-50 和 AMap 附近搜索；高置信且通过约束的结果可参与编排，不确定结果进入候选区，不暂停 PlanningJob，也不静默落位；仍不足时保留明确自由时间。用户可通过现有导入入口主动补充具体小红书链接。面向单个用户或单次 PlanningJob 的小红书关键词搜索仍不进入 MVP；Post-MVP 的平台主动搜索只按 FR34.1 在后台补充共享 AnchorPool。

交付：2-11-constraint-first-complete-single-city-planning, 2-12-amap-candidate-expansion-and-nonblocking-candidate-list, 2-13-anchor-pool-buckets-shared-admission-and-versioned-snapshots, 2-15-post-plan-place-search-and-manual-candidates, 3-2-controlled-candidate-placement-and-free-time-filling。

## FR33

- FR33: 规划任务可控性：内部候选、确定性编排和低成本 Provider 均受远程开关、超时、配额、熔断与 attempt fencing 控制；降级只更新同一个 PlanningJob 的事实状态，不向用户暴露 Quick/HQ 或第二份待采用结果。SSE 至少覆盖 accepted/context/constraints/candidates/arranging/validating/persisting/done/fallback/failed，埋点记录首次可行计划率、阶段耗时、fallback_rate、冲突率和未解决项数量。
  - Story 8.3（2026-09-08 批准）：复用 Node 适配器与 PostgreSQL 单一配置权威，提供小型受限路由页，按已注册任务/能力管理主用与备用，检查后以版本化差异确认发布。普通发布只影响之后新接收的任务，已接收/排队任务固定原配置；发布回执、加载和实际使用分开记录。暂停新调用独立控制，不承诺撤回已发出请求；恢复另行确认，回滚生成新版本且不解除暂停或修改用户行程。最低预算/重试/熔断保护继续生效，Unleash 仅保留普通开关，不另建可写路由权威；本期不新增独立 AI 网关。生产配置不跟随 Langfuse 实验标签自动发布，集中预算/Telegram/总览仍分别归 8.4-8.6。

交付：2-9-single-planning-job-and-stable-timeline-transition, 8-3-task-level-provider-routing-and-safe-release, 8-4-platform-budget-and-usage-policy-management。

## FR34

- FR34: AnchorPool（离线锚点）：使用 city×season×tod×category 的离线池作为未选内容和零选择场景的候选来源；不可用时回退受版本管理的城市 Top-50 并记录来源与降级原因。候选准备属于 S6 同一 PlanningJob 的内部步骤，可产生事实进度事件，但不形成独立页面或第二份计划。

交付：2-11-constraint-first-complete-single-city-planning, 2-12-amap-candidate-expansion-and-nonblocking-candidate-list, 2-13-anchor-pool-buckets-shared-admission-and-versioned-snapshots。

## FR34.1

- FR34.1: 平台 AnchorPool 主动冷启动（Post-MVP）：当版本化分桶持续处于 `missing / stale / insufficient` 时，由 Epic 8 的平台后台任务生成 `城市 × 季节 × 时段 × 类别` 搜索意图，并通过隔离、限频、运营账号管理的小红书搜索 Provider 获取候选笔记；选定结果依次经过详情/媒体取得、多模态提取、AMap POI 验证、CanonicalPOI 去重、共享准入与 AnchorPool 原子快照发布。搜索登录态、Cookie、验证码/风控挑战和素材暂存不得使用终端用户会话，不得进入 Nomad API 进程或日志；失败只暂停/降级平台采集任务，当前用户 PlanningJob 继续使用 MVP 的 Top-50、AMap 与自由时间路径。交付拆为“受控搜索 Provider/素材采集”和“缺口驱动补池编排”两张 Epic 8 Story。

交付：延期：8.7, 8.8。

## FR35

- FR35: Linked multi-city（MVP 分阶段交付）：保留 `Plan -> City` 单值关系，由 `Trip` 按顺序连接任意数量、同一时区且主链不重复的 `TripSegment -> Plan`；产品不设置城市数量上限，每个主城市继续使用完整、独立的单城规划流程。相邻主段之间使用白天直达 `TransferLeg/transfer_slot`，每个中间城市至少住宿一晚，每个本地日期最多一个主链交接。Picker 可展示附近跨城 L1/L2/L3；用户在 Picker 或计划编辑中对跨城 L3 选择 required/along_route 时，先明确选择“新增目标城市行程”或 FR35.1 的“安排目标城市一日游”。新增主城市时保留原意图并绑定目标 segment，再回到旅行时间/住宿设置该城市的日期、交通、酒店与行李；以后每增加一个主城市都重复同一确认与 S2/S3 流程，取消只撤销本次新增且不得修改已有 Trip。两城确认可用独立反转图标调整先后；城市链增长后在 S2 明确本次新增城市的插入位置，不开放对既有整条链的任意复杂重排。交接日的进站/候车/行驶/到达/出站组成一个归 Trip 所有的连续区间，分别限制上下游城市可用时间；交通草稿、未确认 AI provisional 或失败阻止联合发布。主链离开后跨夜重返同一城市、跨时区、夜间跨日交通和任意复杂重排延期。

交付：4-1-cross-city-intent-and-linked-trip-input-draft, 4-2-adjacent-city-transfers-and-handoff-day-boundaries, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding。

## FR35.1

- FR35.1: 跨城一日游（MVP 受限 A-B-A）：一个主 `TripSegment` 的某个本地日期可以挂载一个 `DayExcursion`，以目的地城市的独立单城 Plan 编排当天内容，并由 `outbound` 与 `return` 两条独立 TransferLeg 在同一时区、同一自然日内完成 `宿主城市 → 目的地城市 → 宿主城市`。确认 Sheet 显示 `安排{目标城市}一日游 / 增加{目标城市}行程 / 暂不加入`；选择一日游后确认日期与去返交通，任一交通缺失、provisional、失效或不可行都允许保存草稿但阻止规划和发布。DayExcursion 不创建第二个同名宿主 TripSegment，不设置目的地住宿，不移动宿主酒店或行李；宿主日计划只使用去程前和返程后的可用区间，子 Plan 只使用两条交通之间的区间。发布后同一 Dn 时间轴依次展示宿主安排、去程、`{目标城市}一日游`、返程、`已回到{宿主城市}` 与宿主酒店；AI 调整按当前所处宿主 Plan 或一日游子 Plan 限定范围，不能修改两条交通或另一 Plan。本版每个宿主日最多一个一日游，且不得与主链交接同日；不支持嵌套一日游、同日 `A-B-C-A`、跨夜折返或把一日游静默升级为住宿城市。
  - CE-02（2026-09-14确认）：已有S8行程新增一日游只重算目标宿主日的受影响非冻结安排及child Plan；其他宿主日期/城市与住宿行李保持原样。当天放不下的非冻结地点保留为带原因的未解决/候选并保留required、用户修改与来源，不跨日挪动；冻结冲突仍阻止发布。后续显式跨日编辑以及4.7更换一日游日期的旧/新宿主日流程保持各自原合同。

交付：4-5-day-excursion-intent-and-round-trip-transfer-draft, 4-6-day-excursion-planning-and-atomic-timeline-publication, 4-7-day-excursion-editing-and-scope-guards。

## FR36

- FR36: 酒店槽与餐饮处理：每晚生成 hotel_slot，作为节奏、区域聚类、换住缓冲、行李处理和晚间半径的核心约束；DayN 底部固定显示，允许空白。餐饮在视觉上使用普通 POI 行，只对 `需预约` 等证据做小标注，右侧可增加更换入口；酒店早餐影响早段安排。

交付：2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-11-constraint-first-complete-single-city-planning, 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing, 6-1-planned-meal-slots-and-primary-alternative-pool。

## FR36.2

- FR36.2: 餐饮选择池与商圈召回：固定/已预约餐厅作为 `fixed_anchor`；普通餐次可为 `choice_pool`，包含一主和最多两备，候选不足时第一个空位显示 `+ 添加更多`。Planner 不机械创建早餐、午餐、晚餐和加餐四个槽；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不占时间轴，只有 fixed anchor、choice pool 或用户明确添加才创建 MealSlot。`暂不决定` 不展示固定 90 分钟承诺，旅中候选依次按当前位置最近、5km 内评分最高、可靠免排队证据、与饭后景点最近的去重补位召回。小吃街/商场等 POI 可附加无时间节点的 `附近吃什么`，只查询当前用户导入、AMap 验证且共享规范化 BusinessArea 归属的美食 POI；无可靠归属则不展示。

交付：6-1-planned-meal-slots-and-primary-alternative-pool, 6-2-foreground-location-meal-recall-and-plan-context-fallback, 6-3-normalized-business-areas-and-owner-food-hints。

## FR36.1

- FR36.1: 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好：
  - 晚段靠近酒店的候选优先（near_hotel boost）；
  - 早段靠近上一晚酒店的候选优先；
  - 换酒店日需要加入退房/交通/寄存/入住缓冲，晚间活动半径应以当晚酒店为主；
  - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。

交付：2-11-constraint-first-complete-single-city-planning。

## FR37

- FR37: 结果页（行程单）（MVP 轻编辑）：S10 始终先展示 current revision 的紧凑基础行程，并在计划级 `整体核查` 中分别展示同一 revision 的时间安排状态与行程细节完整度。硬冲突不阻止只读浏览，但阻止细节完善与导出并提供返回 FixSheet/手工编辑的路径；无硬冲突时从 S10 进入 S9，完成、部分完成或失败后返回同一 S10 上下文。槽位页按需展示 why_short、真实引用、source_attribution 和每槽位「做什么/准备/注意」，不显示技术质量/新鲜度枚举。轻编辑按具体行保存用户原文并标记 `我的修改`；再次完善必须保留用户新增、改写、删除及显式留空语义，丢弃与用户表达相同或近似的 AI 建议，仅在剩余容量补充不重复内容，不提供“恢复 AI 内容”。地点或时间调整返回 S7/S8；S7/S8 不显示细节完成卡片。支持导出图片；到达 result_sheet 只表示已有可阅读行程单，不表示细节全部完善、来源全部核查或不存在 soft warning。`/home/tong123/work/厦门旅游规划/output/行程单_final.md` 作为导出格式与 QA fixture 参考。
  - IR-09交付边界（2026-09-15确认）：5.1先交付S7计划级入口可达的最小S10基础宿主页、S10→S9→原S10返回链及S9实际鉴权来源展开；5.2在同一路由/读模型增强完整双行核查、槽位阅读和CitationSheet，不作为5.1基本可达性/可追溯性的前置。只读导航不启动新的完善/校验/排期任务。

交付：5-1-revision-bound-ai-detail-enrichment, 5-2-verifiable-result-sheet-and-citation-reading, 5-3-line-level-detail-editing-and-ai-preservation。

## FR38

- FR38: 平台 AI 额度与成本控制策略：默认由平台托管 AI 调用；按用户/设备/workspace 设置请求、并发、导出与成本上限并在服务端计量。阈值、余额、使用次数、重置周期及内部额度分级只用于后台保护/运营，不对用户展示。受限后仅呈现真实可用操作/恢复路径，已有行程仍可查看与手动编辑；服务器继续执行预算、幂等、受控回退、限流和熔断，管理员可调整策略。隐藏额度不是无限使用承诺；BYOK 仅为 Post-MVP 可选增强。
  - Story 8.4（2026-09-13 批准）：复用Node/Fastify/Prisma/PostgreSQL建立单一预算权威及桌面Web运营页，无需运营页移动适配。产品次数、外部请求、并发与成本分开；同一逻辑任务重试不重复扣次数，各真实attempt在所有适用范围内原子足额预留、幂等结算。未知费用保留保守占用，发布/回滚不清零账本或解除8.3暂停，不改既有路线/行程。资费按实际收费方来源登记版本，用量乘资费标估算；上游已核对扣费与账号余额按各自真实能力获取，无账单源显示未接入，汇总账单不伪造逐笔金额。运营设置Nomad上限，发布后从最新账本重算可分配预算，不改上游售价或余额。26条GWT及金额来源补充已批准，真实阈值/计价/多实例/失联/权限仍需实施验证。

交付：1-9-production-image-text-understanding-and-evidence, 1-10-adaptive-video-understanding-and-local-frame-resampling, 2-9-single-planning-job-and-stable-timeline-transition, 3-5-controlled-conversational-local-adjustment, 5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview, 6-4-trip-checklist-and-direct-or-ai-record-entry, 8-3-task-level-provider-routing-and-safe-release, 8-4-platform-budget-and-usage-policy-management。

## FR38.1

- FR38.1: Provider 额度与不可恢复异常告警：Epic 8 为 AI 与 AMap 建立平台级额度、认证、计费、熔断和终态调用监控。内部额度接近上限或故障仍可恢复时继续走缓存、受控重试/回退；用户只看到真实可用操作与恢复路径，不暴露额度；只有重试/回退预算耗尽、全路由不可用、认证/计费失效、额度需管理员动作后才能恢复或持续熔断等终态，才通过服务端 Telegram Bot 向配置的管理员会话告警。告警必须去重、聚合、冷却并可发送恢复通知；只包含环境、Provider/能力、稳定错误码、严重级别、聚合计数、首次/最近时间和 correlation id，不包含用户原文、POI/酒店/路线、原始链接、token、密钥或其他 owner 数据。Telegram 发送失败不得改变用户 Job/Plan 状态，必须进入可观测的持久重试/失败记录。
  - Story 8.5（2026-09-13 批准）：24条GWT与两张桌面R1确认。复用Node/PG保存合格业务事件、故障周期、聚合/冷却及持久待发送记录，单一薄sendMessage适配器投递；不新增必需Alertmanager/Bot入站服务。普通可恢复失败及个人额度受限不直接告警；恢复由同范围业务证据判断，不把缺数据/静默/工具issue关闭当恢复。投递有成功回执、拒绝、未知与有界重试之分，成功不代表已读，超时重发可能重复。Web提供策略、事件、静默、投递恢复和明确确认的测试入口，只有桌面要求；消息与token URL等出口严格脱敏，通知故障不改变Job/Plan/预算。真实目标配置和测试发送仍需另有明确授权，规划批准不代表已送达。

交付：8-4-platform-budget-and-usage-policy-management, 8-5-terminal-ai-amap-incidents-and-telegram-alerts。

## FR39

- FR39: AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留可安全表达的通用文案，在对应内容旁以次要行内文字“建议核对”弱提示，不弹窗、不要求逐条确认、不阻断基础行程阅读或其他合法操作；用户可稍后在槽位详情与来源入口查看依据。前端按需展示真实引用链接与 why_short，不以弱提示冒充已有事实来源；无法安全表达时仍为“暂未生成”。

交付：5-1-revision-bound-ai-detail-enrichment, 5-2-verifiable-result-sheet-and-citation-reading。

## FR40

- FR40: 计划延续与状态：首页通过最近一趟行程及完整列表恢复 owner 的规划输入、任务或已发布行程；每个独立 Plan 或整趟 Trip 只占一项，子城市和一日游不重复成卡。显示真实 `草稿 / 规划中 / 已生成 / 生成失败`；`已生成` 仅表示可阅读，不代表旅行结束、细节完善或无冲突。新增城市、修改跨城日期/交通等重新编排保留原行程；仅真实保存的待处理变更草稿/任务产生附属入口，半途离开显示 `有未完成的修改`，仅当前有效任务终止失败显示 `本次修改生成失败`。恢复查询当前服务端版本及有效视图/日期/浏览位置，不自动生成、扣费或发布版本。MVP 不提供手动或自动景点打卡；Story 7.2 已确认移出本期，打卡架构不作为最近行程或其他 MVP 功能的前置门槛。照片自动标记与照片类导出见 Post-MVP FR40.1；本期不启用自动化记忆日志/数据回流。

交付：7-1-recent-trips-and-context-resume。

## FR40.1

- FR40.1: 照片驱动的到访标记与旅行影像（Post-MVP，方向已确认、待设计）：基于用户授权的相册照片及可用的已存地理位置数据解析景点，对有照片证据的景点自动展示已打卡标志；支持相册视频、九宫格或 AI 绘图美化后的照片类导出。权限/选片、地理证据与误匹配修正、数据处理/保留、费用和输出格式留待后续设计；不直接沿用旧手动 Story 7.2，不授权本期为旅行影像读取相册、上传照片或存储连续轨迹。此延期不影响 FR45 中用户主动选择并提交的单张反馈截图，不允许借反馈入口扫描相册或自动打卡。

交付：延期：。

## FR41

- FR41: 酒店选择优先：优先使用 S3 中按住宿晚明确选择并经 AMap 匹配的酒店；用户选择留空时保持 hotel_slot 空白，不根据灵感候选静默代选酒店。仅在酒店已明确时启用 near_hotel 早/晚弱偏好。

交付：2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-11-constraint-first-complete-single-city-planning, 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing。

## FR42

- FR42: 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。

交付：延期：。

## FR43

- FR43: 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。

交付：延期：。

## FR44-lite

- FR44-lite: 文本快速搜索（MVP）：
  - 行程地点候选搜索（Epic 2）：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含名称、地址和距离估计，操作为加入候选，不直接修改时间轴。
  - 候选受控落位（Epic 3）：从候选执行直接落位、替换或自由时段填充时，必须使用显式版本化命令并遵循硬约束、分段边界、校验和全局撤销。
  - 酒店槽大弹窗：同样为文本搜索（Top-5列表，无地图），始终提供“留空/稍后决定”。规划前选择按Story 2.5写入住宿草稿；规划后修改按Story 3.3保留未提交草稿，实质变化先预览并明确确认，再发布新版本，不在点击搜索结果时直接改已发布hotel_slot。
  - 行程地点手动补点（无准确结果时）：用户填写目标名称并搜索/选择同城、经 AMap 验证的附近地标；以该地标的地址与坐标作为路线和距离计算代理，目标以“附近估算”状态加入候选。地标不得被写成目标的 CanonicalPOI，目标也不得继承地标的标准名、精确地址、营业时间、评分、人均或电话。
  - 用户未选择可用附近地标时，仍可仅保存名称为“待定位”候选，但不得生成路线/距离估计或直接落位。
  - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。

交付：2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-15-post-plan-place-search-and-manual-candidates, 3-2-controlled-candidate-placement-and-free-time-filling, 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing。

## FR45

- FR45: 用户反馈（兔小巢集成，MVP）
  - 入口：设置、侧边栏与结果页异常二级入口复用同一流程并恢复原视图；始终可选择“直接填写反馈”，打开/返回不重试原任务。
  - 跳转：仅使用实际配置验证过的官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`。Web/PWA 由用户操作打开外部页面；本期 Capacitor App 复用 9.1 的受限外链能力，外部页面不获得 Nomad 原生桥接或会话，不把 window.open 当 WebView。缺配置不使用占位产品链接；明确失败保留重试/浏览器/内置填写。
  - 登录态与结果：默认不传 Nomad 身份、会话、手机号/邮箱；不保证所有宿主都匿名，第三方自身登录可通过内置表单避开。网页/邮件打开、iframe load 或用户返回不证明反馈提交；不可观测的第三方提交不代报成功或失败。
  - 内置表单：复用有效 Nomad 账号，一段文字与最多一张可选截图；不要求分类、联系方式或 AI 改写。诊断信息默认关闭，开启仅附来源页面类别/应用版本/安全错误代码。截图本地预览，明确提交后才上传私有 COS，校验图像并移除 EXIF 定位，不自动截图/扫描相册。
  - 状态简化：截图上传不可用只将上传控件置灰，不额外显示失败提示、重试上传行或专用“移除截图，仅提交文字”按钮；已有截图保留 X 移除入口，再复用普通提交。附件未完成不得静默丢图。上传/提交/有界核实期间无底部操作按钮，仅真实失败或等待耗尽后退出忙碌并恢复操作，不无限转圈或自动重发。
  - 可靠提交：文本与已验证附件引用真实落库、授权维护者可读取后才返回回执编号/时间和“反馈已收到”；不代表问题已处理或腾讯/邮件已收到。相同 owner/幂等 key/载荷复用回执，未知结果先核实原申请。草稿临时恢复按 owner/TTL 隔离，退出/放弃/删除清理；截图字节丢失明确重选。
  - 数据边界：内置反馈仅限本人/授权维护者访问，拒绝停用账号迟到写入；7.6 接入既有 7.4 结构化导出（反馈文字/安全附件索引、不打包截图）与 7.5 删除清理。第一方落库即本期交付，不自动转发外部、不新建客服后台；反馈内容不进入埋点/日志/模型执行。
  - 后续可选增强：自定义登录态/SSO、外部自定义参数、微信回复通知、Webhooks、第三方反馈数据拉取、反馈历史/客服对话和 SLA；均非本期前置条件。当前不展示额度、不以 AI 预算阻断反馈。

交付：7-6-feedback-entry-and-reliable-submission。

## FR46

- FR46: 行程清单：日期 Tabs 横向滚动，右侧固定窄 `ListChecks` 图标与未完成数量；点击进入单城或联程共享的整趟清单，分为必买目标、顺路门店、返程事项及按需出现的其他记录。记录可属于整趟或具体日期，可编辑、删除、完成或取消完成，使用独立清单版本，不等同景点打卡且不触发排期撤销。购物记录使用单一多行文本框与灰色占位示例，底部 `款式 / 数量 / 预算 / 品牌 / 尺码` 快捷操作只换行插入标签并保留原文；已有标签定位到原行，不重复覆盖。只描述想买的东西即可保存，不要求填齐属性、选择购物日期或关联门店；占位文本不是用户数据。商品属性结构化、多门店关联、自动或用户协助找店、L2 购物编排及顺路购物提示留到后续版本，销售/库存证据、计划经过与实际到达、自动应用授权及撤销三个边界届时设计。购物区域只有本身是旅行目标时才占时间。MVP 的返程事项作为清单记录，不直接生成时间槽，也不提供清单内的 `预留时间` 动作；既有交通、住宿和行李方案所需缓冲继续由规划与校验流程负责。清单事项转换为可执行安排的能力留待后续版本，不能要求用户把已确认的取行李或交通缓冲从清单重复添加。底部仅显示 `+ 添加记录`；空输入时 AI 提示不可用并强调直接添加，点击直接添加进入填写页，不保存空记录；有效输入后强调 AI 提示，仅点击才生成。AI 结果可逐条编辑/选择、重复建议默认不选，确认后才写入，不覆盖已有记录；相关上下文变化须重新核对。直接添加始终保留原文，生成/保存失败保留输入与手动路径。当前版本不承诺实时库存，也不自动触发“返程前 48 小时”提醒。

交付：6-4-trip-checklist-and-direct-or-ai-record-entry, 6-5-lightweight-shopping-notes-and-label-shortcuts。

## FR47

- FR47: 商圈归属：POI 可归属零个或多个规范化 BusinessArea，并保存来源与置信度。行政区和 L2 路线聚类不得静默等同商圈；商圈召回只能使用当前用户导入且完成 AMap 验证的 POI，无可靠归属时隐藏相关提示。

交付：6-3-normalized-business-areas-and-owner-food-hints。

## FR48

- FR48: 旅中定位降级：打开App或回到前台时，若存在需要定位的当前旅中餐饮上下文，允许在历史授权仍有效或用户本次授权后以单次fix刷新餐饮候选；打开餐饮候选或主动刷新也可触发。同一次前台打开/恢复事件合并重复触发，系统权限已撤销或无法确认时不能仅凭历史记录获取位置；未授权时不因打开App反复弹出授权窗口，先沿计划上下文继续，用户需要附近候选时再选择授权。拒绝授权、定位陈旧/低精度、越城或无可用fix时，使用同一Plan scope的上一计划POI与下一计划POI作为标注的降级基准。MVP不提供打卡/照片到访记录，不按时间推断已完成；只有一个基准时使用该基准，两者都无时保留静态池和手动添加。刷新只读且不抢占当前页面、不改变已选餐厅或行程；后台停止新定位、不上传或保存连续轨迹。

交付：6-2-foreground-location-meal-recall-and-plan-context-fallback。

## FR49

- FR49: 阶段与转场：产品和埋点统一使用 S0–S11；自然语言输入跳过 S1。跨城选择在确认 Sheet 分流：新增主城市从 S4/S8 回到 S2/S3，一日游进入日期与往返交通设置后回到同一个 S5/S6 规划流程。S6/S7 共享一个时间轴路由，S8 是可重复循环而非向导页。除 S5 外任何阶段不得显示 `开始规划`。

交付：1-6-home-multi-link-import-queue-and-honest-status, 2-3-single-city-travel-time-and-boundary-confirmation, 2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-6-preplanning-pace-and-additional-constraints, 2-7-full-city-picker-and-l3-place-intent, 2-9-single-planning-job-and-stable-timeline-transition, 3-1-minute-timeline-editing-and-plan-wide-undo, 4-1-cross-city-intent-and-linked-trip-input-draft, 4-5-day-excursion-intent-and-round-trip-transfer-draft, 5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview, 6-1-planned-meal-slots-and-primary-alternative-pool, 6-4-trip-checklist-and-direct-or-ai-record-entry, 7-1-recent-trips-and-context-resume, 9-7-typed-navigation-and-host-history。

## FR50

- FR50: 对话式局部调整：S7/S8 通过右下角可访问的 `AI 调整` 图标接收自然语言和上下文快捷表达；AI 先识别槽位/连续安排/单日/后续日期/当前单城 Plan 范围并翻译为类型化约束。Linked Trip 的主段上下文只能读取和修改当前 `TripSegment -> Plan`；DayExcursion 上下文只能读取和修改当前一日游子 Plan。两者均不得新增、删除、重排城市，不得修改 TransferLeg，也不得把变更扩展到宿主/子计划或其他城市 Plan。若范围不唯一或请求可能触碰 required、冻结事实、住宿/行李或其他风险边界，先构造一个受控 `AdjustmentAsk`，一次只澄清一个范围问题或提示一个关键风险；ask 与快捷入口都不得直接修改计划，也不展示“我理解为”或 chain-of-thought。范围明确且风险边界可处理后，系统显示 `选择一个调整方向`，通常提供两个简短安全方案；只有一个安全方向就只给一个，不为凑数伪造第二个，确认后才预览并应用 diff，完成 Sheet 以 `做了以下调整` 说明事实变化。无安全方案或 stale revision 保留当前计划并进入已批准的恢复状态。LLM 不直接写持久化 JSON，所有应用均经过 ownership、revision、idempotency、校验和全局 undo。

交付：3-5-controlled-conversational-local-adjustment, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 4-7-day-excursion-editing-and-scope-guards。

## FR51

- FR51: 跨日负荷与天气上下文：每天以主要安排数、步数区间、通勤、最早出发/最晚结束和留白时间解释负荷，步数是可突破但需解释的软约束；Trip 级校验覆盖连续早起、连续高负荷、恢复时间、同行人/体力约束、换住/行李与交通缓冲。只有处于可靠预报期且携带来源、新鲜度和质量状态的天气可参与校验或 `雨天方案`；远期日期降级为季节性建议。任何天气调整必须预览确认，不静默改写计划。

交付：2-14-daily-load-estimation-and-explainable-summary, 3-4-incremental-validation-and-typed-conflict-fixes, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 4-6-day-excursion-planning-and-atomic-timeline-publication, 4-7-day-excursion-editing-and-scope-guards。

## FR52

- FR52: 首期多端交付：保留网页，交付可安装的 Android APK 与 iOS TestFlight 版本；旅行者在各端使用同一账号与业务数据。App 具备真实可用的返回/键盘/安全区域/权限/外链/前后台恢复，登录、深链、保存分享、定位、账号与反馈分别满足所属 Story 的 App 验收。9.1 负责安装与宿主，9.2 负责测试分发及完整交付证据。Epic9 同时承接共享 UI、组件与浏览器验证、读取及导航基础的独立交付；迁移页面的业务行为继续由原 Story 验收。

交付：1-0-production-login-and-multi-device-sessions, 1-6-home-multi-link-import-queue-and-honest-status, 1-7-durable-import-progress-and-restart-recovery, 2-9-single-planning-job-and-stable-timeline-transition, 5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing, 6-2-foreground-location-meal-recall-and-plan-context-fallback, 7-1-recent-trips-and-context-resume, 7-3-settings-account-and-available-actions, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results, 7-6-feedback-entry-and-reliable-submission, 8-1-cross-flow-observability-and-fault-localization, 9-1-capacitor-app-installation-and-host-foundation, 9-2-android-apk-and-ios-testflight-delivery, 9-3-shared-ui-components-and-safe-app-sheet, 9-4-component-workbench-and-enforced-code-quality, 9-5-browser-flow-and-visual-regression-gates, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history。

## NFR1

- NFR1: 国内可用三方服务优先；外部依赖需有可替代方案或降级策略。

交付：1-0-production-login-and-multi-device-sessions, 1-9-production-image-text-understanding-and-evidence, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-4-unified-flight-and-rail-service-lookup, 2-10-authoritative-route-facts-and-timeline-transport, 8-3-task-level-provider-routing-and-safe-release。

## NFR2

- NFR2: 前后端以 SSE 展示异步进度；事件使用单调 cursor 和可恢复持久记录，客户端/服务重启后从最后确认位置重连，不把内存队列当作事实来源；MVP 不使用远程推送。
  - App 不承诺后台 SSE 常驻；挂起或进程重建后先核实身份，再恢复同一 job/cursor/revision，不自动重交业务。

交付：1-7-durable-import-progress-and-restart-recovery, 2-9-single-planning-job-and-stable-timeline-transition, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results。

## NFR3

- NFR3: AI 安全与成本控制：平台 Provider secrets 仅在服务端管理；日志、Sentry、Langfuse 与埋点必须脱敏；对象存储私有读写与签名 URL；AI 请求具备速率限制、成本上限、异常熔断和降级策略。
  - App 原生凭据使用受控安全存储，服务端秘密不入安装包；外部网页不获得原生桥接、会话或私人存储。

交付：1-0-production-login-and-multi-device-sessions, 1-9-production-image-text-understanding-and-evidence, 2-9-single-planning-job-and-stable-timeline-transition, 5-1-revision-bound-ai-detail-enrichment, 8-1-cross-flow-observability-and-fault-localization, 8-4-platform-budget-and-usage-policy-management, 9-1-capacitor-app-installation-and-host-foundation, 9-2-android-apk-and-ios-testflight-delivery, 9-3-shared-ui-components-and-safe-app-sheet, 9-4-component-workbench-and-enforced-code-quality, 9-5-browser-flow-and-visual-regression-gates, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history。

## NFR4

- NFR4: 性能目标（MVP）：单一 AI 初始规划、增量校验、行程细节完善与导出分别设定并监测 P50/P95；内部降级不得造成第二套用户完成流程。

交付：2-9-single-planning-job-and-stable-timeline-transition, 3-4-incremental-validation-and-typed-conflict-fixes, 5-1-revision-bound-ai-detail-enrichment, 5-4-revision-bound-export-generation-and-preview, 8-1-cross-flow-observability-and-fault-localization。

## NFR5

- NFR5: 质量指标：首次可行计划率、required 安全落位率、along_route 采用率、候选可解释率、餐饮选择池有效率、地理消歧 Top-1/Top-3 命中率、负荷估算覆盖率和跨日高负荷检出率分别设定并监测。

交付：1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-11-constraint-first-complete-single-city-planning, 2-14-daily-load-estimation-and-explainable-summary, 3-4-incremental-validation-and-typed-conflict-fixes, 6-1-planned-meal-slots-and-primary-alternative-pool, 8-2-reproducible-quality-regression-and-version-comparison。

## NFR6

- NFR6: 可观测性：Langfuse/promptfoo/Sentry 接入完备，关键漏斗（登录→输入/导入→时间→住宿→选点→规划前确认→AI 规划→编辑/校验→行程单→导出）可埋点度量。
  - Web/Android/iOS 的事件分母、App version/build、Web bundle、JS/原生错误分别可查，桥接不得双计数。

交付：1-0-production-login-and-multi-device-sessions, 1-6-home-multi-link-import-queue-and-honest-status, 2-9-single-planning-job-and-stable-timeline-transition, 8-1-cross-flow-observability-and-fault-localization, 8-2-reproducible-quality-regression-and-version-comparison。

## NFR7

- NFR7: 合规与隐私：首屏可跳转《隐私政策/用户协议》；账号删除与数据导出流程闭环；高德版权标注规范。
  - 按实际 SDK/用途维护原生权限说明、适用隐私清单及分发声明；未同意的采集不因 App 启动而自动开启。

交付：1-0-production-login-and-multi-device-sessions, 2-7-full-city-picker-and-l3-place-intent, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results, 9-1-capacitor-app-installation-and-host-foundation, 9-2-android-apk-and-ios-testflight-delivery, 9-3-shared-ui-components-and-safe-app-sheet, 9-4-component-workbench-and-enforced-code-quality。

## NFR8

- NFR8: 交互体验：移动端动效 120–200ms；单列布局；顶部吸顶分段；关键列表/弹窗交互流畅。
  - Android/iOS 验收系统返回、中文键盘、安全区、大字号/读屏及前后台恢复，移动浏览器证据不能替代真机。
  - 相同语义的控件、输入、模态与状态采用共享交互合同。身份未确认时同步遮蔽页面与 Portal 中的私有内容，按原业务合同保持焦点、滚动、草稿和恢复；受影响页面提供浏览器、读屏及大字号回归证据。

交付：1-6-home-multi-link-import-queue-and-honest-status, 2-7-full-city-picker-and-l3-place-intent, 3-1-minute-timeline-editing-and-plan-wide-undo, 5-2-verifiable-result-sheet-and-citation-reading, 6-1-planned-meal-slots-and-primary-alternative-pool, 7-3-settings-account-and-available-actions, 9-1-capacitor-app-installation-and-host-foundation, 9-2-android-apk-and-ios-testflight-delivery, 9-3-shared-ui-components-and-safe-app-sheet, 9-4-component-workbench-and-enforced-code-quality, 9-5-browser-flow-and-visual-regression-gates, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history, 1-0-production-login-and-multi-device-sessions, 1-8-owner-import-records-and-versioned-deduplication, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-3-single-city-travel-time-and-boundary-confirmation, 2-4-unified-flight-and-rail-service-lookup, 2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-6-preplanning-pace-and-additional-constraints, 2-8-shared-poi-information-sheet, 2-9-single-planning-job-and-stable-timeline-transition, 2-10-authoritative-route-facts-and-timeline-transport, 2-12-amap-candidate-expansion-and-nonblocking-candidate-list, 2-14-daily-load-estimation-and-explainable-summary, 2-15-post-plan-place-search-and-manual-candidates, 3-2-controlled-candidate-placement-and-free-time-filling, 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing, 3-4-incremental-validation-and-typed-conflict-fixes, 3-5-controlled-conversational-local-adjustment, 4-1-cross-city-intent-and-linked-trip-input-draft, 4-2-adjacent-city-transfers-and-handoff-day-boundaries, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 4-5-day-excursion-intent-and-round-trip-transfer-draft, 4-6-day-excursion-planning-and-atomic-timeline-publication, 4-7-day-excursion-editing-and-scope-guards, 5-1-revision-bound-ai-detail-enrichment, 5-3-line-level-detail-editing-and-ai-preservation, 5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing, 6-2-foreground-location-meal-recall-and-plan-context-fallback, 6-3-normalized-business-areas-and-owner-food-hints, 6-4-trip-checklist-and-direct-or-ai-record-entry, 6-5-lightweight-shopping-notes-and-label-shortcuts, 7-1-recent-trips-and-context-resume, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results, 7-6-feedback-entry-and-reliable-submission, 8-3-task-level-provider-routing-and-safe-release, 8-4-platform-budget-and-usage-policy-management, 8-5-terminal-ai-amap-incidents-and-telegram-alerts, 8-6-operations-overview-and-read-only-diagnostics。

## NFR9

- NFR9: 行程细节完善不得改动日期、时间与顺序；任何重排必须走独立的可预览调整流程并生成新版本。

交付：5-1-revision-bound-ai-detail-enrichment, 5-3-line-level-detail-editing-and-ai-preservation。

## NFR10

- NFR10: 初始规划安全性：不得静默突破营业、冻结时窗、住宿、transfer 或权限硬约束；失败项进入明确未解决状态，用户编辑与 AI 调整均可撤销且不得覆盖更新版本。

交付：2-11-constraint-first-complete-single-city-planning, 3-1-minute-timeline-editing-and-plan-wide-undo, 3-4-incremental-validation-and-typed-conflict-fixes。

## NFR11

- NFR11: Linked-trip 性能与一致性：各单城市 Plan 可独立计算，但 TripRevision 必须绑定确定的 Plan/Transfer 版本；交接日、住宿与行李边界在生成、编辑和导出中保持一致。

交付：4-1-cross-city-intent-and-linked-trip-input-draft, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 5-4-revision-bound-export-generation-and-preview。

## NFR12

- NFR12: 引用可追溯性（v0.3）：AI 输出的事实引用需可追溯到数据源（保留来源ID/时间戳/摘要）；失败时必须降级为“通用建议”。

交付：1-9-production-image-text-understanding-and-evidence, 1-10-adaptive-video-understanding-and-local-frame-resampling, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-8-shared-poi-information-sheet, 5-1-revision-bound-ai-detail-enrichment, 5-2-verifiable-result-sheet-and-citation-reading。

## NFR13

- NFR13: 采集稳定性与重试责任：独立XHS采集服务负责其内部Cookie/代理/平台挑战与采集重试；Nomad不接管这些登录状态，但必须为自己的HTTP调用和ingest任务执行幂等、总超时、受限重试、持久DLQ/恢复及脱敏观测。不得叠加隐藏重试放大费用，调用责任和实际attempt计量在接口合同中明确；不可用时保留已有媒体/待定位或真实失败。本期仅消费用户提供的已支持具体链接，不提供关键词搜索或扩大来源平台。

交付：1-9-production-image-text-understanding-and-evidence, 1-10-adaptive-video-understanding-and-local-frame-resampling。

## NFR14

- NFR14: 许可与合规：第三方采集器以独立服务（HTTP）集成以避免 GPL 传染；仅保存最小必要数据；证据链（source/时间戳/摘要）与可追溯性满足 NFR12。

交付：1-9-production-image-text-understanding-and-evidence, 1-10-adaptive-video-understanding-and-local-frame-resampling。

## NFR15

- NFR15: 反馈隐私与安全：默认不向外部传 Nomad 身份/会话或手机号/邮箱，不承诺所有宿主匿名；内置表单复用有效账号并隔离文字/私有截图/回执，诊断元数据显式选择且最小化。外部 SSO 等留后续按官方合同设计；授权维护访问、导出/删除与临时附件清理随 7.6 交付。

交付：7-6-feedback-entry-and-reliable-submission。

## NFR16

- NFR16: 反馈运行环境与状态：Web/PWA 使用真实外部打开能力，本期 Android/iOS Capacitor App 使用受限系统浏览能力，返回恢复原上下文且外部页面不能获得 Nomad 桥接/会话；明确加载失败提供恢复，不伪造跨域 HTTP/CSP 检测。区分 feedback_open_* 与 feedback_submit_*，仅真实落库回执计第一方提交成功，不可观测的外部提交不计成功/失败；事件仅含有限 source_page/模式/安全错误。上传置灰与无底部按钮的进行中状态遵守 FR45，有界核实超时后才恢复操作。

交付：7-6-feedback-entry-and-reliable-submission。

## NFR17

- NFR17: LLM 提供商可替换与回退：所有编排与填充调用均通过 OpenAI 兼容接口（api_base + model）；可远程切换提供商/模型并支持按任务路由；出现失败/超时按预设顺序回退；成本/时延与错误率可观测；变更不影响前端与业务逻辑。

交付：1-9-production-image-text-understanding-and-evidence, 2-9-single-planning-job-and-stable-timeline-transition, 5-1-revision-bound-ai-detail-enrichment, 8-3-task-level-provider-routing-and-safe-release。

## NFR18

- NFR18: 定位隐私：只在App打开/回到前台且存在当前旅中餐饮用途，或用户打开/刷新餐饮候选时，经当前有效授权请求单次定位；历史授权不得越过系统撤权。同次前台事件去重，不启用持续监听、定时定位或后台刷新；仅保留本次召回必要的短时位置上下文，服务端与分析日志只记录粗粒度结果，不保存精确位置历史或连续轨迹。

交付：6-2-foreground-location-meal-recall-and-plan-context-fallback。

## NFR19

- NFR19: Picker 状态一致性：required/along_route/unselected 在地图、L3 列表、L2 汇总、全城检查和提交 payload 中必须由同一状态源派生；返回、切换视角和弱网降级不得丢失或改变语义。

交付：2-7-full-city-picker-and-l3-place-intent。

## NFR20

- NFR20: 导入所有权：导入记录、解析结果、原始链接和用户批注按 owner 隔离；共享内容指纹或缓存不得成为跨用户读取路径。

交付：1-0-production-login-and-multi-device-sessions, 1-8-owner-import-records-and-versioned-deduplication, 7-5-account-deletion-and-cleanup-results, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history。

## NFR21

- NFR21: 证据诚实性：预约、免排队、商圈归属、营业事实和来源归因必须携带证据/时间戳/质量状态；未知或推断必须明确降级，不得以实时或已确认语气展示。

交付：1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-8-shared-poi-information-sheet, 5-1-revision-bound-ai-detail-enrichment, 6-3-normalized-business-areas-and-owner-food-hints。

## NFR22

- NFR22: Trip 原子一致性：联合发布必须绑定确定的主 Segment Plan、DayExcursion 子 Plan、TransferLeg、Stay 和 LuggageTransition 版本；任一主链或一日游 transfer 无效时不得发布部分联程。DayExcursion 必须同时绑定宿主日期、子 PlanRevision 及去返两条 TransferLegRevision，不能只发布单程或孤立子计划。

交付：4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 4-6-day-excursion-planning-and-atomic-timeline-publication, 4-7-day-excursion-editing-and-scope-guards, 5-4-revision-bound-export-generation-and-preview。

## NFR23

- NFR23: 路线与动态事实诚实性：通勤模式/时长、航班/铁路查询和天气均保留来源、观测时间、新鲜度与状态；配额、超时、歧义或陈旧时返回 unknown/provisional/seasonal 降级，客户端不得估算或把建议伪装为已购票、实时库存或实时排队。

交付：1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 2-4-unified-flight-and-rail-service-lookup, 2-10-authoritative-route-facts-and-timeline-transport, 2-14-daily-load-estimation-and-explainable-summary, 3-4-incremental-validation-and-typed-conflict-fixes, 6-2-foreground-location-meal-recall-and-plan-context-fallback。

## NFR24

- NFR24: 运营告警可靠性与隐私：AI/AMap 的普通限流、可重试失败和用户侧操作受限状态不得触发管理员骚扰告警；不可恢复终态按环境、Provider、能力和错误类别去重聚合并设置冷却。Telegram Bot token/chat id 只存在于服务端 secret 配置，告警投递具备超时、有限重试、失败持久记录和恢复通知，且任何 payload、日志或 trace 均不得包含用户内容、精确地点/路线、受保护 URL、凭据或跨 owner 数据。

交付：8-5-terminal-ai-amap-incidents-and-telegram-alerts。

## NFR25

- NFR25: App 构建与交付可核验：版本记录可追溯到源代码、锁文件、Web 资源摘要、原生依赖/工具链、配置环境和签名引用；双端从受控输入完成构建、安装与升级回归。安装包不包含服务端密钥或开发身份通道；支持范围、权限/SDK 清单、文件/回调边界、原生故障与版本关联有实证。签名产物不要求字节级复现，但构建输入和功能结果必须可重复核验。
  - 平台下限须与 Web CSS/JS 构建目标、App deployment target、依赖锁定及实际验收矩阵一致。组件或依赖升级后，旧构建目标、旧包和旧回归证据不能直接作为新版本的兼容证明；浏览器自动化不替代最低平台和真机验收。

交付：1-0-production-login-and-multi-device-sessions, 1-6-home-multi-link-import-queue-and-honest-status, 1-7-durable-import-progress-and-restart-recovery, 1-8-owner-import-records-and-versioned-deduplication, 2-3-single-city-travel-time-and-boundary-confirmation, 2-4-unified-flight-and-rail-service-lookup, 2-5-preplanning-nightly-stays-breakfast-and-luggage, 2-6-preplanning-pace-and-additional-constraints, 2-7-full-city-picker-and-l3-place-intent, 2-8-shared-poi-information-sheet, 2-9-single-planning-job-and-stable-timeline-transition, 2-10-authoritative-route-facts-and-timeline-transport, 2-12-amap-candidate-expansion-and-nonblocking-candidate-list, 2-14-daily-load-estimation-and-explainable-summary, 2-15-post-plan-place-search-and-manual-candidates, 3-1-minute-timeline-editing-and-plan-wide-undo, 3-2-controlled-candidate-placement-and-free-time-filling, 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing, 3-4-incremental-validation-and-typed-conflict-fixes, 3-5-controlled-conversational-local-adjustment, 4-1-cross-city-intent-and-linked-trip-input-draft, 4-2-adjacent-city-transfers-and-handoff-day-boundaries, 4-3-independent-city-planning-and-atomic-linked-trip-publication, 4-4-active-city-editing-and-linked-trip-revision-rebinding, 4-5-day-excursion-intent-and-round-trip-transfer-draft, 4-6-day-excursion-planning-and-atomic-timeline-publication, 4-7-day-excursion-editing-and-scope-guards, 5-1-revision-bound-ai-detail-enrichment, 5-2-verifiable-result-sheet-and-citation-reading, 5-3-line-level-detail-editing-and-ai-preservation, 5-4-revision-bound-export-generation-and-preview, 5-5-whole-trip-image-download-and-system-sharing, 6-1-planned-meal-slots-and-primary-alternative-pool, 6-2-foreground-location-meal-recall-and-plan-context-fallback, 6-3-normalized-business-areas-and-owner-food-hints, 6-4-trip-checklist-and-direct-or-ai-record-entry, 6-5-lightweight-shopping-notes-and-label-shortcuts, 7-1-recent-trips-and-context-resume, 7-3-settings-account-and-available-actions, 7-4-account-data-copy-export, 7-5-account-deletion-and-cleanup-results, 7-6-feedback-entry-and-reliable-submission, 8-1-cross-flow-observability-and-fault-localization, 9-1-capacitor-app-installation-and-host-foundation, 9-2-android-apk-and-ios-testflight-delivery, 9-3-shared-ui-components-and-safe-app-sheet, 9-4-component-workbench-and-enforced-code-quality, 9-5-browser-flow-and-visual-regression-gates, 9-6-identity-scoped-server-read-queries, 9-7-typed-navigation-and-host-history, 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction, 8-3-task-level-provider-routing-and-safe-release, 8-4-platform-budget-and-usage-policy-management, 8-5-terminal-ai-amap-incidents-and-telegram-alerts, 8-6-operations-overview-and-read-only-diagnostics。

