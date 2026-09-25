---
stepsCompleted:
- step-01-validate-prerequisites
- step-02-design-epics
- step-03-create-stories
- step-04-final-validation
inputDocuments:
- _bmad-output/planning-artifacts/prd.md
- _bmad-output/planning-artifacts/architecture.md
- _bmad-output/planning-artifacts/ux.md
- _bmad-output/planning-artifacts/supporting-tech-specs.md
- _bmad-output/planning-artifacts/sprint-change-proposal-2026-08-05.md
- _bmad-output/planning-artifacts/planning-inputs-load-and-linked-trips-decision-2026-08-08.md
- _bmad-output/planning-artifacts/requirement-trace-audit-2026-08-12.md
- _bmad-output/planning-artifacts/implementation-readiness-report-2026-08-13.md
migrationReferenceDocuments:
- _bmad-output/planning-artifacts/archive/epics-approved-correct-course-2026-08-12.md
excludedHistoricalDocuments:
- _bmad-output/planning-artifacts/implementation-readiness-report-2026-06-17.md
- deprecated architecture v0.3/root/autoplace documents
- superseded UX delta documents and prototype assets
requirementsStatus: confirmed
epicStructureStatus: approved
lastUpdated: '2026-09-20'
finalValidationStatus: passed
finalValidationPassedDate: 2026-09-14
workflowStatus: completed
workflowCompletionConfirmed: true
workflowCompletedDate: 2026-09-14
finalValidationScope: ce-completion-snapshot
postCompletionAmendment: capacitor-scope-decision-2026-09-19.md
postCompletionAmendmentStatus: user-approved-capacitor-scope-applied
updated: '2026-09-20'
scope_revision: ui-foundation-2026-09-20
uiScopeDecision: _bmad-output/planning-artifacts/ui-foundation-scope-decision-2026-09-20.md
uiScopeStatus: approved-applied
storyCount: 67
gwtScenarioCount: 1089
postCompletionAmendments:
- capacitor-scope-decision-2026-09-19.md
- ui-foundation-scope-decision-2026-09-20.md
---

# nomad-mvp - Epic Breakdown

## Overview

This document rebuilds the current implementation queue from the approved Correct Course product,
architecture and UX contracts. Historical completed stories remain delivery evidence in the archive;
they are not rewritten to claim that corrected target behavior has already shipped.

After CE completion, the user amended FR14/FR48/FR39 before IR input confirmation. The matching
code-orchestration, authorized App-open single-fix and inline `建议核对` changes are applied in
this inventory and Stories 2.9/5.1/5.2/6.2. See `ux-prompt-strength-audit-2026-09-14.md`;
The separate 18-group prompt proposal was subsequently approved on 2026-09-15 and is now applied. See `prompt-strength-adoption-2026-09-15.md` for the current presentation record.

IR resolutions confirmed 2026-09-15: add front-loaded Story 1.0 for production identity; retain only
manual POI correction (FR4.2/1.11) among extra admin tools; defer dedicated moderation/account
merge/unlink/new map layers; assign operations/metrics prerequisites; 5.1 delivers its minimum S10
host and source/return loop before 5.2 enhancements. See `ir-resolution-decisions-2026-09-15.md`
and `implementation-prerequisites-2026-09-15.md`. Historical story/Sprint completion is unchanged.


## Capacitor scope amendment (approved 2026-09-19)

本次用户已批准主提案与合同附录，批准记录为 `_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`。新增 FR52/NFR25 与 Epic 9，首期交付 Web/PWA、Android 签名测试 APK、iOS TestFlight；支持 Android 10+ / iOS 16.4+ 手机竖屏（下限已由2026-09-20 UI批准更新）。9.1 前置交付可安装的既有入口/宿主，原业务 Story 完成各自 App 验收，9.2 最后交付测试包及升级/跨端证据。

App 相册保存只写用户明确导出的行程图片；相机、相册扫描、照片到访/视频产物、连续后台定位、远程推送、分享接收扩展及公开应用商店上架不进入此增量。网页的 `已开始下载，请确认` 与保存未知语义保留。新需求不改变 7.2、8.7/8.8 和四项延期 FR；共用账号、数据与后端继续复用。

9 月 18–19 日已确认的 PNVS 短信/图形选择在现行合同中执行；较早 Authing/极光/腾讯候选研究是历史。平台注册/Key 存在不等于真实服务接通。构建资源、签名和真机未验证时保留对应门槛；用户已授权继续独立工作并记录决策，不反复请求常规 Story 授权。

## UI基础范围（2026-09-20已批准）

67 Story/1089 GWT，新增9.3共享UI、9.4工作台与真实lint、9.5浏览器保护、9.6 Query、9.7 Router；正式源稳定追加编号，执行准备顺序见catalog。网页Chromium/Edge111+、Firefox128+、Safari16.4+；App Android10+/WebView111+、iOS16.4+。UI增量覆盖FR1/FR2/FR3/FR18/FR49/FR52及NFR3/7/8/20/25，不改变原业务首交付责任。原型/品牌/历史done及3.1暂停保持，当前1.7完成后停止不被新范围解除。

## Requirements Inventory

### Functional Requirements
- FR1: 登录首屏支持手机号+短信登录，采用已确认的 PNVS 短信认证；如提供第三方登录，iOS 必须等权提供 Apple 登录；按批准风险/重试策略触发 PNVS 图形认证。Web/PWA、Android、iOS 的实际宿主方式分别验收。
  - 生产身份由前置Story 1.0补齐：保留已批准的登录入口，真实验证后映射稳定内部owner；同一账号允许多设备并存，普通退出只撤销当前会话，账号停用/删除可使全部会话失效。本期不提供两个已有数据账号的合并、自助解绑或新增设备管理页，测试身份不能作为生产身份。
- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- FR4: 小红书入库流程（每个 ingest job 处理一条链接）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 视频按时长抽帧并先做语音检测 → 图片/关键帧二次存储至 COS（禁止热链）→ AMap 标准化与验证（判定标准 POI/坐标/文字地址/营业时间/评分/人均/电话等）→ 高置信自动入库 / 低置信标记“待定位”；前台可创建多个 job 并用 SSE 分别跟踪。
 解析抽取策略（更新）：默认启用多模态 LLM（含图+文/关键帧）进行抽取；短视频（≤30 秒）应高频抽帧，长视频可按较低频率抽帧；静音或 BGM 视频跳过 ASR，含人声片段才进入 ASR；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source、source_attribution、质量等级与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。
- FR4.1: 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。
  - CE-01（2026-09-14确认）：Story 1.11提供受权限控制的最小桌面Web规则查看/新增/修改/停用、持久草稿、检查发布与审计。发布以预期版本和幂等操作原子生效，每个ingest/geo attempt首次使用时固定规则版本，后续筛选/重试不混用；热更新需核对实际加载/使用，失败保留原规则，不等待8.3/8.6或新增通用后台。
- FR4.2: 运营手工纠错地点（2026-09-15确认）：Story 1.11提供最小桌面Web入口，对已有标准地点的显示名称、文字地址和同城坐标进行人工纠错，保留理由/依据、原始高德快照与字段级人工来源；不把人工值冒充高德返回。草稿检查、差异预览、明确发布、版本/幂等回执及审计形成闭环，可通过新版本撤销人工覆盖。只纠正同一地点，不开放地点合并、跨城/分店身份改绑、通用黑名单/别名/近邻管理或任意任务重跑；已有品牌抑制规则继续保留。新查询/新任务消费固定版本的生效事实，路线缓存按事实版本隔离；已有导入/已发布行程与执行中的快照不被静默改写，用户后续修改仍走原预览/确认/校验流程。
- FR5: 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。
- FR6: 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子；
  `required/必去` 与 `along_route/顺路` 只在 S4 Picker 中赋予，Library 中的收藏/导入
  不得静默等同任一种规划意图。
- FR7: AI 初始规划：根据时间、住宿、地点意图、导入证据和节奏一次生成完整、可编辑的日计划；不得要求用户先手工摆放地点。无法安全落位的 required 项明确进入未解决/候选区域，未选内容由 Agent 适量补全。
- FR8: 时间轴编辑：用户可替换、移动到前一天/后一天/其他日期、按 1 分钟精度调整开始与结束时间、删除并撤销；首末日和无其他可选日期时正确禁用移动目标。AI 生成时间允许内部按 15 分钟精度对齐。
- FR9: 增量可行性校验：初始计划必须先通过校验；用户或 AI 后续修改引入闭店、过远、超时、住宿/交通冲突时再展示冲突及可预览的修复方案，干净计划不长期占用校验卡。
- FR10: AI 行程细节完善：在已排好的计划上为所有适用槽位补充“做什么/准备什么/注意什么”、why_short 与引用来源，并在服务端保留质量/新鲜度审计状态；普通行程单不显示技术质量、新鲜度或置信度枚举。完善不得修改用户已确认的日期、时间或顺序。
- FR11: 导出行程图片（行程卡片）；公开格式默认 WebP，兼容失败时降级 JPEG，产品文案不承诺 PNG。
  - App 在同一版本 artifact 上增加用户主动相册保存与原生系统分享，具体结果与权限边界由 5.5 承担；Web 下载文案保持。
- FR12: 设置页：只展示账号信息及实际可用的账户/数据/隐私/反馈操作与退出登录；完整数据/反馈流程由各自 Story 负责。不提供 AI 用量、额度或全局生成状态面板，不要求用户配置模型 Key；未部署能力不伪装为可执行，已部署但暂时失败的操作保留真实恢复路径。
- FR13: 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。
  - 评测补充（用户确认 2026-09-07）：线上样本允许经去直接标识后参与评测，仅筛查姓名、证件、个人联系方式等直接关联个人的信息，不因可能间接推测身份清除日期、酒店 POI、路线或偏好。凭据安全、访问/外发范围、保留与删除另行控制，评测副本使用独立入口，不放宽生产遥测。质量按具体规则配置计分、提醒或人工复核，不统一“一条硬约束失败即否决”；个别阻断规则须单独对齐，运行时业务校验不变。必须支持人工打分、评语和实验对比标注，并提供轻量运营入口进行实验配置与模型迭代；生产路由/预算仍归各自受控操作。Story 8.2 的 24 条 GWT 与采用方案已于 2026-09-08 批准：promptfoo 执行确定性/完整回归，Langfuse 提供样本、人工评分/评语、逐例对比及 prompt/Playground；结果同步不重复推理，人评回收形成版本快照。确定性 CI 可离线使用，但缺少真实人评链不能验收整张 Story。
  - Story 8.1：复用 Sentry 错误诊断与 Langfuse AI 观测界面；Sentry 管理唯一全局 OTel provider，Langfuse 使用显式隔离 provider，以安全 correlation/job/attempt 关联，不承诺共享父子 trace 或完整采样。所有出口按允许字段和值级规则脱敏，不录屏或采集完整输入输出；未知数据不计零，监控故障不影响任务/行程。实际授权查询、版本兼容、保留/删除和故障隔离必须验收，托管方式与付费能力另行确认。评测、集中策略、Telegram 和运营总览仍分别归 8.2-8.6。
  - Story 8.6（2026-09-13 批准）：20条GWT及中文验收说明、两张桌面R1确认。现有Node/React薄只读总览汇总既有业务结果/降级、8.1观测、8.2封存评价、8.4账本、8.5事件和配置使用证据，复杂分析进入受保护原工具。各来源窗口/定义/权限/截至时间/覆盖与采样外推分别说明，不合并不同分母、不平均P95、不用采样数据补账或把无数据当健康。固定只读查询有界并合并/缓存/退避，部分失败与陈旧独立展示，缓存/迟到响应不跨环境或撤权范围泄漏。总览不改策略/账本/告警、不启动模型/评测/重跑/测试消息；无移动运营适配、新Grafana/iframe/公共分享前置。真实来源/权限/口径与桌面证据仍需实施验证。
- FR14: 第三方集成（国内可用）：已确认 PNVS 短信/图形认证及适用 Apple/微信登录、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、友盟 U-Link+U-App（归因/分析）。Web、Android、iOS 的平台注册/权限/原生桥接与真实结果分别核验。异步编排使用开发框架与代码实现，复用现有服务、worker及必要队列，不以n8n或其他低代码平台为前置。

- FR15: 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。
- FR16: 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。
- FR17: 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。
- FR18: 多条链接粘贴：识别全部支持的小红书链接，为每条创建独立 ingest job，并以 `N/X` 队列顺序展示；输入框与 `+ / 发送` 按钮保持同一底部组件，不新建第二层导入输入。
- FR18.1: 导入记录与去重：灵感库展示当前用户拥有的导入记录、来源标题、解析 POI 和原始链接复制入口；记录和原始链接必须鉴权隔离。MVP 以 `user_id + normalized_url` 去重，并记录 URL normalization 规则版本；短链展开、追踪参数和 canonical URL 变化不能绕过去重。跨用户可复用计算/媒体指纹，但共享对象必须有独立 ACL、引用与删除语义，且不得泄露导入记录或批注。
- FR19: 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取内容/理解图文/验证地点/保存灵感；显示来源标题、安全截断、当前事实动作与 `N/X`，不显示百分比或虚假进度条；完成项按 FIFO 各自完整展示 10 秒，后续完成项等待；失败支持重试和重连。
- FR19 补充：SSE `parsing` 的当前诊断阶段为 `media_prep | speech_detect | frame_extract | asr | multimodal`，未执行的阶段可跳过，UI 仍统一显示“理解图文”。旧 `text | ocr | vision` 仅作为兼容事件读取，不代表恢复 text→OCR→VLM 流水线。每个事件使用单调序号和可恢复 cursor 持久化，进程重启或客户端重连后可从最后已确认事件继续。
- FR20: 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。
- FR21: 时间轴微调与全局撤销：AI 编排可按 15 分钟步进；用户通过时钟式控件最小按 1 分钟调整，快速滚动只改变灵敏度，不展示 30/60 分钟吸附提示。右上全计划控件默认显示历史图标，变更后显示 `撤销 8`；倒计时结束后仍可再撤销最近一条符合条件的操作，不在底部或单日显示“最近操作”栏。
- FR22: 冲突分级与后续动作：结构性无效、越权和冻结预约/票务冲突拒绝写入；营业、通勤、时长、酒店/行李等派生冲突允许形成新版本但立即触发增量校验。硬冲突阻止完善行程细节与导出，软冲突可继续并保留低强调“有 N 项建议核对 · 查看”及按需风险说明；收起提示不改变冲突分类或门禁。
- FR23: AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。
- FR24: 导出图片规格：用户只选择固定宽度 1080 px 或 1242 px。current revision 先推导有序城市行程单元：独立单城 Plan 的全部日期合成一张城市长图；linked Trip 的每个主 TripSegment 与每个 DayExcursion 子 Plan 各生成一张城市长图，并由同一个 ExportJob 按行程顺序一起生成。城市长图用于站内逐城查看和能力允许时的系统多图分享；产品不提供按日切片，也不按城市名称合并不同 scope。一日游城市图使用 `{城市}一日游` 上下文，宿主城市图保留紧凑去返摘要。下载默认从同一 ExportJob、revision、theme 和不可变渲染快照确定性生成或复用一张整趟长图，按真实时间顺序编排主城市、跨城交通和一日游，一日游嵌入宿主日期而不重复追加。实现阶段必须用支持的浏览器、设备与 WebP/JPEG 编码器矩阵实测安全的最大 raster height、decoded pixels、内存与文件大小，并固化为版本化 `TripLongLayoutPolicy`。若加入下一个完整主城市段（含其宿主日期内的一日游）会超过该策略，系统在城市边界关闭当前 part，让该城市从下一 part 开始；每个 part 标注稳定 `N/总数`，预览先说明将下载几张。正常长度是一张图片、一个文件；超长行程仍由一次用户操作启动一个有序下载批次，但可产生多张编号图片。不得使用 ZIP、在城市内部或日期中间拆分，也不得隐藏批次分段；支持目录写入时一次授权写入全部part，逐项写入/关闭成功才可报告已保存；不支持时使用浏览器受控的多文件下载，实际交出请求且无可观察拒绝时显示“已开始下载，请确认”，内部保存结果保持未知。明确取消/拒绝/失败照实显示；未知文件重试由用户明确触发并说明可能重复，复用同批次而不重新生成或重复扣次数，不承诺自动识别未保存文件。整趟合成不调用 AI、不重新规划、不创建 PlanRevision，也不重复计入导出额度。公共文件默认 WebP，尺寸或兼容策略命中时降级 JPEG（75–80%）；城市单元每张尽量 ≤ 600 KB，整趟 part 使用独立安全尺寸/编码预算。若单个不可再分的城市单元在 fallback 后仍超出策略，返回可解释 typed failure 并保留其他城市图查看与分享，不得从城市中间截断。导出接口支持 width_px，并在预览中展示推导出的有序城市图片清单。背景使用版本化的抽象路线底纹与自有/已授权城市页头页尾素材；无城市素材时稳定降级为通用模板，不在单次导出中临时调用 AI 生成背景。
  - 2026-09-19 App 增量：保存/分享复用同一有序 manifest，平台实测内存/编码限制进入 TripLongLayoutPolicy；仅系统写入成功才显示相册已保存，部分/失败/未知分别处理。
- FR25: 操作可用性与恢复：AI 填充/导出等工作页保留真实生成阶段、任务处理与输出数量；受限时只提供真实可用的重试、稍后继续、查看原任务或返回手动编辑等路径。不向用户展示已用/剩余额度、上限、计量窗口、重置时间或额度分级，不将内部额度原因包装成虚假排队/服务故障，不要求配置 Key。后台保护与远程开关继续有效。
- FR26: 规划入口：底部自然语言或目的地卡先进入 S2 旅行时间；从导入灵感进入时携带 city/place hints，但仍按 S2→S3→S4 前进，不绕过必需输入。历史 `/planner/pick` 深链需补齐缺失输入后再显示 Picker。
- FR27: Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。
- FR27.1: 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精确航班/车次、2 小时时间段或 `交给 AI 安排`。住宿按夜设置酒店且允许留空，酒店名称输入后经 AMap POI 匹配；每晚同时确认早餐与行李去向，`同上` 是用户主动确认按钮。显式选择 `交给 AI`、`留空`、`未知/未决定` 或 `同上` 均可作为对应字段已确认；从未处理的 ambiguous 初始态不能被静默当作确认并越过下一步门禁。预约、门票和 dawn/sunset/night/night-market 等特殊时段由导入证据与 Agent 推导，不设独立开关。
- FR28: S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐：悠闲为每天 1-3 个主要安排、较晚出发并保留较多自由时间；从容为每天 2-4 个主要安排并兼顾游览与休息；充实为优先覆盖更多地点并接受早出晚归、较多步行和换乘。默认 `从容`，但自然语言或导入证据已有明确节奏时可预选对应项，用户仍可修改。S5 不重复 S2/S3 摘要，提供默认折叠的可选“其他要求”输入，并且是唯一显示 `开始规划` 的阶段；不提供“智能编排”开关。
- FR28.1: 玩法与兴趣信号：从用户自然语言、导入内容及选择行为推导 `经典 / 吃喝 / 自然 / 拍照 / 古建 / 小众 / 逛街 / 展览` 等可多选兴趣信号；每个信号保留来源、时间、质量和置信度，不在 S2/S3 重复询问。无可靠证据时使用中性、多样化候选，不把推断伪装成用户确认，也不得覆盖 required、明确附加约束或 pace。
- FR29: Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内标题显示当前 L2。L2 仅用由子 L3 派生的非交互变色状态点和分项计数表达选择，不显示勾选框。只有 L3 页默认展开互斥 `附近 | 全城` 视角；点击/选中 L3 时地图聚焦该 POI 与附近地点，split 视角显示当前及相邻 L2，完全地图视角显示整个 L1。全城检查标题不可展开。POI 使用通用信息 Sheet，标题直接使用 POI 名称而不是“详情栏”等泛化标签，并包含地址、营业时间、评分、建议停留、来源与可选预约证据。
- FR30: L3 行右侧提供互斥图标意图：勾选代表 `required/必去`，Route 代表 `along_route/顺路`；再次点击活动图标可清除。吸底汇总显示 `已选必去 X` 与 `顺路去 Y`，L3 页 CTA 为 `返回全览`，全城检查 CTA 为 `下一步`。允许 0 选择，由 Agent 使用 AnchorPool/城市热门补全。
- FR31: Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图、L2 分项汇总和全局计数；卡片、Marker、列表和通用 POI Sheet 状态一致。`需预约` 是证据 badge，不是第三种意图，也不代表 Nomad 已完成预约。
- FR32: 单一可见 AI 规划：提交 S5 后，用户进入稳定的时间轴 shell，看到事实阶段、重连和降级状态；同一 shell 最终解析为完整可编辑计划。Planner 优先处理 required、证据强时段、住宿/行李与 transfer 边界，再安排 along_route 和 Agent 候选；无法落位的 required 与未采用候选进入明确的未解决/候选区。
- FR32.1: 内部快速降级：确定性/L2/低成本路径可在超时、配额或 Provider 故障时生成可用结果，但只作为同一规划任务的降级产物；UI 不暴露 Quick/HQ 名称、双完成版本或“切换-采用”。
- FR32.2: 高质量编排：平台默认使用可用的高质量 Provider 完成初始编排；后台尝试必须有 attempt fencing、版本与来源记录，不得在用户已编辑后静默覆盖当前版本。内部候选版本只有在系统安全采用或用户明确预览变更时才生效。
- FR32.3: 候选与模糊补全：S7 候选区一级只按 intent 分为 `未安排的必去 / 顺路候选 / 其他候选`；每个地点行再单独标注 `来自灵感 / 城市热门 / 附近推荐 / 我添加的` 等来源。intent 与来源是正交字段，来源不得成为互斥一级分组，也不使用泛化 `AI` 标签。MVP 缺少可靠地点时，依次使用当前 owner 已导入且完成验证的灵感、AnchorPool/版本化城市 Top-50 和 AMap 附近搜索；高置信且通过约束的结果可参与编排，不确定结果进入候选区，不暂停 PlanningJob，也不静默落位；仍不足时保留明确自由时间。用户可通过现有导入入口主动补充具体小红书链接。面向单个用户或单次 PlanningJob 的小红书关键词搜索仍不进入 MVP；Post-MVP 的平台主动搜索只按 FR34.1 在后台补充共享 AnchorPool。

- FR33: 规划任务可控性：内部候选、确定性编排和低成本 Provider 均受远程开关、超时、配额、熔断与 attempt fencing 控制；降级只更新同一个 PlanningJob 的事实状态，不向用户暴露 Quick/HQ 或第二份待采用结果。SSE 至少覆盖 accepted/context/constraints/candidates/arranging/validating/persisting/done/fallback/failed，埋点记录首次可行计划率、阶段耗时、fallback_rate、冲突率和未解决项数量。
  - Story 8.3（2026-09-08 批准）：复用 Node 适配器与 PostgreSQL 单一配置权威，提供小型受限路由页，按已注册任务/能力管理主用与备用，检查后以版本化差异确认发布。普通发布只影响之后新接收的任务，已接收/排队任务固定原配置；发布回执、加载和实际使用分开记录。暂停新调用独立控制，不承诺撤回已发出请求；恢复另行确认，回滚生成新版本且不解除暂停或修改用户行程。最低预算/重试/熔断保护继续生效，Unleash 仅保留普通开关，不另建可写路由权威；本期不新增独立 AI 网关。生产配置不跟随 Langfuse 实验标签自动发布，集中预算/Telegram/总览仍分别归 8.4-8.6。

- FR34: AnchorPool（离线锚点）：使用 city×season×tod×category 的离线池作为未选内容和零选择场景的候选来源；不可用时回退受版本管理的城市 Top-50 并记录来源与降级原因。候选准备属于 S6 同一 PlanningJob 的内部步骤，可产生事实进度事件，但不形成独立页面或第二份计划。

- FR34.1: 平台 AnchorPool 主动冷启动（Post-MVP）：当版本化分桶持续处于 `missing / stale / insufficient` 时，由 Epic 8 的平台后台任务生成 `城市 × 季节 × 时段 × 类别` 搜索意图，并通过隔离、限频、运营账号管理的小红书搜索 Provider 获取候选笔记；选定结果依次经过详情/媒体取得、多模态提取、AMap POI 验证、CanonicalPOI 去重、共享准入与 AnchorPool 原子快照发布。搜索登录态、Cookie、验证码/风控挑战和素材暂存不得使用终端用户会话，不得进入 Nomad API 进程或日志；失败只暂停/降级平台采集任务，当前用户 PlanningJob 继续使用 MVP 的 Top-50、AMap 与自由时间路径。交付拆为“受控搜索 Provider/素材采集”和“缺口驱动补池编排”两张 Epic 8 Story。

- FR35: Linked multi-city（MVP 分阶段交付）：保留 `Plan -> City` 单值关系，由 `Trip` 按顺序连接任意数量、同一时区且主链不重复的 `TripSegment -> Plan`；产品不设置城市数量上限，每个主城市继续使用完整、独立的单城规划流程。相邻主段之间使用白天直达 `TransferLeg/transfer_slot`，每个中间城市至少住宿一晚，每个本地日期最多一个主链交接。Picker 可展示附近跨城 L1/L2/L3；用户在 Picker 或计划编辑中对跨城 L3 选择 required/along_route 时，先明确选择“新增目标城市行程”或 FR35.1 的“安排目标城市一日游”。新增主城市时保留原意图并绑定目标 segment，再回到旅行时间/住宿设置该城市的日期、交通、酒店与行李；以后每增加一个主城市都重复同一确认与 S2/S3 流程，取消只撤销本次新增且不得修改已有 Trip。两城确认可用独立反转图标调整先后；城市链增长后在 S2 明确本次新增城市的插入位置，不开放对既有整条链的任意复杂重排。交接日的进站/候车/行驶/到达/出站组成一个归 Trip 所有的连续区间，分别限制上下游城市可用时间；交通草稿、未确认 AI provisional 或失败阻止联合发布。主链离开后跨夜重返同一城市、跨时区、夜间跨日交通和任意复杂重排延期。

- FR35.1: 跨城一日游（MVP 受限 A-B-A）：一个主 `TripSegment` 的某个本地日期可以挂载一个 `DayExcursion`，以目的地城市的独立单城 Plan 编排当天内容，并由 `outbound` 与 `return` 两条独立 TransferLeg 在同一时区、同一自然日内完成 `宿主城市 → 目的地城市 → 宿主城市`。确认 Sheet 显示 `安排{目标城市}一日游 / 增加{目标城市}行程 / 暂不加入`；选择一日游后确认日期与去返交通，任一交通缺失、provisional、失效或不可行都允许保存草稿但阻止规划和发布。DayExcursion 不创建第二个同名宿主 TripSegment，不设置目的地住宿，不移动宿主酒店或行李；宿主日计划只使用去程前和返程后的可用区间，子 Plan 只使用两条交通之间的区间。发布后同一 Dn 时间轴依次展示宿主安排、去程、`{目标城市}一日游`、返程、`已回到{宿主城市}` 与宿主酒店；AI 调整按当前所处宿主 Plan 或一日游子 Plan 限定范围，不能修改两条交通或另一 Plan。本版每个宿主日最多一个一日游，且不得与主链交接同日；不支持嵌套一日游、同日 `A-B-C-A`、跨夜折返或把一日游静默升级为住宿城市。
  - CE-02（2026-09-14确认）：已有S8行程新增一日游只重算目标宿主日的受影响非冻结安排及child Plan；其他宿主日期/城市与住宿行李保持原样。当天放不下的非冻结地点保留为带原因的未解决/候选并保留required、用户修改与来源，不跨日挪动；冻结冲突仍阻止发布。后续显式跨日编辑以及4.7更换一日游日期的旧/新宿主日流程保持各自原合同。

- FR36: 酒店槽与餐饮处理：每晚生成 hotel_slot，作为节奏、区域聚类、换住缓冲、行李处理和晚间半径的核心约束；DayN 底部固定显示，允许空白。餐饮在视觉上使用普通 POI 行，只对 `需预约` 等证据做小标注，右侧可增加更换入口；酒店早餐影响早段安排。

- FR36.2: 餐饮选择池与商圈召回：固定/已预约餐厅作为 `fixed_anchor`；普通餐次可为 `choice_pool`，包含一主和最多两备，候选不足时第一个空位显示 `+ 添加更多`。Planner 不机械创建早餐、午餐、晚餐和加餐四个槽；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不占时间轴，只有 fixed anchor、choice pool 或用户明确添加才创建 MealSlot。`暂不决定` 不展示固定 90 分钟承诺，旅中候选依次按当前位置最近、5km 内评分最高、可靠免排队证据、与饭后景点最近的去重补位召回。小吃街/商场等 POI 可附加无时间节点的 `附近吃什么`，只查询当前用户导入、AMap 验证且共享规范化 BusinessArea 归属的美食 POI；无可靠归属则不展示。

- FR36.1: 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好：
  - 晚段靠近酒店的候选优先（near_hotel boost）；
  - 早段靠近上一晚酒店的候选优先；
  - 换酒店日需要加入退房/交通/寄存/入住缓冲，晚间活动半径应以当晚酒店为主；
  - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。

- FR37: 结果页（行程单）（MVP 轻编辑）：S10 始终先展示 current revision 的紧凑基础行程，并在计划级 `整体核查` 中分别展示同一 revision 的时间安排状态与行程细节完整度。硬冲突不阻止只读浏览，但阻止细节完善与导出并提供返回 FixSheet/手工编辑的路径；无硬冲突时从 S10 进入 S9，完成、部分完成或失败后返回同一 S10 上下文。槽位页按需展示 why_short、真实引用、source_attribution 和每槽位「做什么/准备/注意」，不显示技术质量/新鲜度枚举。轻编辑按具体行保存用户原文并标记 `我的修改`；再次完善必须保留用户新增、改写、删除及显式留空语义，丢弃与用户表达相同或近似的 AI 建议，仅在剩余容量补充不重复内容，不提供“恢复 AI 内容”。地点或时间调整返回 S7/S8；S7/S8 不显示细节完成卡片。支持导出图片；到达 result_sheet 只表示已有可阅读行程单，不表示细节全部完善、来源全部核查或不存在 soft warning。`/home/tong123/work/厦门旅游规划/output/行程单_final.md` 作为导出格式与 QA fixture 参考。
  - IR-09交付边界（2026-09-15确认）：5.1先交付S7计划级入口可达的最小S10基础宿主页、S10→S9→原S10返回链及S9实际鉴权来源展开；5.2在同一路由/读模型增强完整双行核查、槽位阅读和CitationSheet，不作为5.1基本可达性/可追溯性的前置。只读导航不启动新的完善/校验/排期任务。

- FR38: 平台 AI 额度与成本控制策略：默认由平台托管 AI 调用；按用户/设备/workspace 设置请求、并发、导出与成本上限并在服务端计量。阈值、余额、使用次数、重置周期及内部额度分级只用于后台保护/运营，不对用户展示。受限后仅呈现真实可用操作/恢复路径，已有行程仍可查看与手动编辑；服务器继续执行预算、幂等、受控回退、限流和熔断，管理员可调整策略。隐藏额度不是无限使用承诺；BYOK 仅为 Post-MVP 可选增强。
  - Story 8.4（2026-09-13 批准）：复用Node/Fastify/Prisma/PostgreSQL建立单一预算权威及桌面Web运营页，无需运营页移动适配。产品次数、外部请求、并发与成本分开；同一逻辑任务重试不重复扣次数，各真实attempt在所有适用范围内原子足额预留、幂等结算。未知费用保留保守占用，发布/回滚不清零账本或解除8.3暂停，不改既有路线/行程。资费按实际收费方来源登记版本，用量乘资费标估算；上游已核对扣费与账号余额按各自真实能力获取，无账单源显示未接入，汇总账单不伪造逐笔金额。运营设置Nomad上限，发布后从最新账本重算可分配预算，不改上游售价或余额。26条GWT及金额来源补充已批准，真实阈值/计价/多实例/失联/权限仍需实施验证。
- FR38.1: Provider 额度与不可恢复异常告警：Epic 8 为 AI 与 AMap 建立平台级额度、认证、计费、熔断和终态调用监控。内部额度接近上限或故障仍可恢复时继续走缓存、受控重试/回退；用户只看到真实可用操作与恢复路径，不暴露额度；只有重试/回退预算耗尽、全路由不可用、认证/计费失效、额度需管理员动作后才能恢复或持续熔断等终态，才通过服务端 Telegram Bot 向配置的管理员会话告警。告警必须去重、聚合、冷却并可发送恢复通知；只包含环境、Provider/能力、稳定错误码、严重级别、聚合计数、首次/最近时间和 correlation id，不包含用户原文、POI/酒店/路线、原始链接、token、密钥或其他 owner 数据。Telegram 发送失败不得改变用户 Job/Plan 状态，必须进入可观测的持久重试/失败记录。
  - Story 8.5（2026-09-13 批准）：24条GWT与两张桌面R1确认。复用Node/PG保存合格业务事件、故障周期、聚合/冷却及持久待发送记录，单一薄sendMessage适配器投递；不新增必需Alertmanager/Bot入站服务。普通可恢复失败及个人额度受限不直接告警；恢复由同范围业务证据判断，不把缺数据/静默/工具issue关闭当恢复。投递有成功回执、拒绝、未知与有界重试之分，成功不代表已读，超时重发可能重复。Web提供策略、事件、静默、投递恢复和明确确认的测试入口，只有桌面要求；消息与token URL等出口严格脱敏，通知故障不改变Job/Plan/预算。真实目标配置和测试发送仍需另有明确授权，规划批准不代表已送达。

- FR39: AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留可安全表达的通用文案，在对应内容旁以次要行内文字“建议核对”弱提示，不弹窗、不要求逐条确认、不阻断基础行程阅读或其他合法操作；用户可稍后在槽位详情与来源入口查看依据。前端按需展示真实引用链接与 why_short，不以弱提示冒充已有事实来源；无法安全表达时仍为“暂未生成”。

- FR40: 计划延续与状态：首页通过最近一趟行程及完整列表恢复 owner 的规划输入、任务或已发布行程；每个独立 Plan 或整趟 Trip 只占一项，子城市和一日游不重复成卡。显示真实 `草稿 / 规划中 / 已生成 / 生成失败`；`已生成` 仅表示可阅读，不代表旅行结束、细节完善或无冲突。新增城市、修改跨城日期/交通等重新编排保留原行程；仅真实保存的待处理变更草稿/任务产生附属入口，半途离开显示 `有未完成的修改`，仅当前有效任务终止失败显示 `本次修改生成失败`。恢复查询当前服务端版本及有效视图/日期/浏览位置，不自动生成、扣费或发布版本。MVP 不提供手动或自动景点打卡；Story 7.2 已确认移出本期，打卡架构不作为最近行程或其他 MVP 功能的前置门槛。照片自动标记与照片类导出见 Post-MVP FR40.1；本期不启用自动化记忆日志/数据回流。
- FR40.1: 照片驱动的到访标记与旅行影像（Post-MVP，方向已确认、待设计）：基于用户授权的相册照片及可用的已存地理位置数据解析景点，对有照片证据的景点自动展示已打卡标志；支持相册视频、九宫格或 AI 绘图美化后的照片类导出。权限/选片、地理证据与误匹配修正、数据处理/保留、费用和输出格式留待后续设计；不直接沿用旧手动 Story 7.2，不授权本期为旅行影像读取相册、上传照片或存储连续轨迹。此延期不影响 FR45 中用户主动选择并提交的单张反馈截图，不允许借反馈入口扫描相册或自动打卡。

- FR41: 酒店选择优先：优先使用 S3 中按住宿晚明确选择并经 AMap 匹配的酒店；用户选择留空时保持 hotel_slot 空白，不根据灵感候选静默代选酒店。仅在酒店已明确时启用 near_hotel 早/晚弱偏好。

- FR42: 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。

- FR43: 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。

- FR44-lite: 文本快速搜索（MVP）：
  - 行程地点候选搜索（Epic 2）：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含名称、地址和距离估计，操作为加入候选，不直接修改时间轴。
  - 候选受控落位（Epic 3）：从候选执行直接落位、替换或自由时段填充时，必须使用显式版本化命令并遵循硬约束、分段边界、校验和全局撤销。
  - 酒店槽大弹窗：同样为文本搜索（Top-5列表，无地图），始终提供“留空/稍后决定”。规划前选择按Story 2.5写入住宿草稿；规划后修改按Story 3.3保留未提交草稿，实质变化先预览并明确确认，再发布新版本，不在点击搜索结果时直接改已发布hotel_slot。
  - 行程地点手动补点（无准确结果时）：用户填写目标名称并搜索/选择同城、经 AMap 验证的附近地标；以该地标的地址与坐标作为路线和距离计算代理，目标以“附近估算”状态加入候选。地标不得被写成目标的 CanonicalPOI，目标也不得继承地标的标准名、精确地址、营业时间、评分、人均或电话。
  - 用户未选择可用附近地标时，仍可仅保存名称为“待定位”候选，但不得生成路线/距离估计或直接落位。
  - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。

- FR45: 用户反馈（兔小巢集成，MVP）
  - 入口：设置、侧边栏与结果页异常二级入口复用同一流程并恢复原视图；始终可选择“直接填写反馈”，打开/返回不重试原任务。
  - 跳转：仅使用实际配置验证过的官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`。Web/PWA 由用户操作打开外部页面；本期 Capacitor App 复用 9.1 的受限外链能力，外部页面不获得 Nomad 原生桥接或会话，不把 window.open 当 WebView。缺配置不使用占位产品链接；明确失败保留重试/浏览器/内置填写。
  - 登录态与结果：默认不传 Nomad 身份、会话、手机号/邮箱；不保证所有宿主都匿名，第三方自身登录可通过内置表单避开。网页/邮件打开、iframe load 或用户返回不证明反馈提交；不可观测的第三方提交不代报成功或失败。
  - 内置表单：复用有效 Nomad 账号，一段文字与最多一张可选截图；不要求分类、联系方式或 AI 改写。诊断信息默认关闭，开启仅附来源页面类别/应用版本/安全错误代码。截图本地预览，明确提交后才上传私有 COS，校验图像并移除 EXIF 定位，不自动截图/扫描相册。
  - 状态简化：截图上传不可用只将上传控件置灰，不额外显示失败提示、重试上传行或专用“移除截图，仅提交文字”按钮；已有截图保留 X 移除入口，再复用普通提交。附件未完成不得静默丢图。上传/提交/有界核实期间无底部操作按钮，仅真实失败或等待耗尽后退出忙碌并恢复操作，不无限转圈或自动重发。
  - 可靠提交：文本与已验证附件引用真实落库、授权维护者可读取后才返回回执编号/时间和“反馈已收到”；不代表问题已处理或腾讯/邮件已收到。相同 owner/幂等 key/载荷复用回执，未知结果先核实原申请。草稿临时恢复按 owner/TTL 隔离，退出/放弃/删除清理；截图字节丢失明确重选。
  - 数据边界：内置反馈仅限本人/授权维护者访问，拒绝停用账号迟到写入；7.6 接入既有 7.4 结构化导出（反馈文字/安全附件索引、不打包截图）与 7.5 删除清理。第一方落库即本期交付，不自动转发外部、不新建客服后台；反馈内容不进入埋点/日志/模型执行。
  - 后续可选增强：自定义登录态/SSO、外部自定义参数、微信回复通知、Webhooks、第三方反馈数据拉取、反馈历史/客服对话和 SLA；均非本期前置条件。当前不展示额度、不以 AI 预算阻断反馈。

- FR46: 行程清单：日期 Tabs 横向滚动，右侧固定窄 `ListChecks` 图标与未完成数量；点击进入单城或联程共享的整趟清单，分为必买目标、顺路门店、返程事项及按需出现的其他记录。记录可属于整趟或具体日期，可编辑、删除、完成或取消完成，使用独立清单版本，不等同景点打卡且不触发排期撤销。购物记录使用单一多行文本框与灰色占位示例，底部 `款式 / 数量 / 预算 / 品牌 / 尺码` 快捷操作只换行插入标签并保留原文；已有标签定位到原行，不重复覆盖。只描述想买的东西即可保存，不要求填齐属性、选择购物日期或关联门店；占位文本不是用户数据。商品属性结构化、多门店关联、自动或用户协助找店、L2 购物编排及顺路购物提示留到后续版本，销售/库存证据、计划经过与实际到达、自动应用授权及撤销三个边界届时设计。购物区域只有本身是旅行目标时才占时间。MVP 的返程事项作为清单记录，不直接生成时间槽，也不提供清单内的 `预留时间` 动作；既有交通、住宿和行李方案所需缓冲继续由规划与校验流程负责。清单事项转换为可执行安排的能力留待后续版本，不能要求用户把已确认的取行李或交通缓冲从清单重复添加。底部仅显示 `+ 添加记录`；空输入时 AI 提示不可用并强调直接添加，点击直接添加进入填写页，不保存空记录；有效输入后强调 AI 提示，仅点击才生成。AI 结果可逐条编辑/选择、重复建议默认不选，确认后才写入，不覆盖已有记录；相关上下文变化须重新核对。直接添加始终保留原文，生成/保存失败保留输入与手动路径。当前版本不承诺实时库存，也不自动触发“返程前 48 小时”提醒。
- FR47: 商圈归属：POI 可归属零个或多个规范化 BusinessArea，并保存来源与置信度。行政区和 L2 路线聚类不得静默等同商圈；商圈召回只能使用当前用户导入且完成 AMap 验证的 POI，无可靠归属时隐藏相关提示。
- FR48: 旅中定位降级：打开App或回到前台时，若存在需要定位的当前旅中餐饮上下文，允许在历史授权仍有效或用户本次授权后以单次fix刷新餐饮候选；打开餐饮候选或主动刷新也可触发。同一次前台打开/恢复事件合并重复触发，系统权限已撤销或无法确认时不能仅凭历史记录获取位置；未授权时不因打开App反复弹出授权窗口，先沿计划上下文继续，用户需要附近候选时再选择授权。拒绝授权、定位陈旧/低精度、越城或无可用fix时，使用同一Plan scope的上一计划POI与下一计划POI作为标注的降级基准。MVP不提供打卡/照片到访记录，不按时间推断已完成；只有一个基准时使用该基准，两者都无时保留静态池和手动添加。刷新只读且不抢占当前页面、不改变已选餐厅或行程；后台停止新定位、不上传或保存连续轨迹。
- FR49: 阶段与转场：产品和埋点统一使用 S0–S11；自然语言输入跳过 S1。跨城选择在确认 Sheet 分流：新增主城市从 S4/S8 回到 S2/S3，一日游进入日期与往返交通设置后回到同一个 S5/S6 规划流程。S6/S7 共享一个时间轴路由，S8 是可重复循环而非向导页。除 S5 外任何阶段不得显示 `开始规划`。
- FR50: 对话式局部调整：S7/S8 通过右下角可访问的 `AI 调整` 图标接收自然语言和上下文快捷表达；AI 先识别槽位/连续安排/单日/后续日期/当前单城 Plan 范围并翻译为类型化约束。Linked Trip 的主段上下文只能读取和修改当前 `TripSegment -> Plan`；DayExcursion 上下文只能读取和修改当前一日游子 Plan。两者均不得新增、删除、重排城市，不得修改 TransferLeg，也不得把变更扩展到宿主/子计划或其他城市 Plan。若范围不唯一或请求可能触碰 required、冻结事实、住宿/行李或其他风险边界，先构造一个受控 `AdjustmentAsk`，一次只澄清一个范围问题或提示一个关键风险；ask 与快捷入口都不得直接修改计划，也不展示“我理解为”或 chain-of-thought。范围明确且风险边界可处理后，系统显示 `选择一个调整方向`，通常提供两个简短安全方案；只有一个安全方向就只给一个，不为凑数伪造第二个，确认后才预览并应用 diff，完成 Sheet 以 `做了以下调整` 说明事实变化。无安全方案或 stale revision 保留当前计划并进入已批准的恢复状态。LLM 不直接写持久化 JSON，所有应用均经过 ownership、revision、idempotency、校验和全局 undo。
- FR51: 跨日负荷与天气上下文：每天以主要安排数、步数区间、通勤、最早出发/最晚结束和留白时间解释负荷，步数是可突破但需解释的软约束；Trip 级校验覆盖连续早起、连续高负荷、恢复时间、同行人/体力约束、换住/行李与交通缓冲。只有处于可靠预报期且携带来源、新鲜度和质量状态的天气可参与校验或 `雨天方案`；远期日期降级为季节性建议。任何天气调整必须预览确认，不静默改写计划。

- FR52: 首期多端交付：保留网页，交付可安装的 Android APK 与 iOS TestFlight 版本；旅行者在各端使用同一账号与业务数据。App 具备真实可用的返回/键盘/安全区域/权限/外链/前后台恢复，登录、深链、保存分享、定位、账号与反馈分别满足所属 Story 的 App 验收。9.1 负责安装与宿主，9.2 负责测试分发及完整交付证据。Epic9 同时承接共享 UI、组件与浏览器验证、读取及导航基础的独立交付；迁移页面的业务行为继续由原 Story 验收。

### NonFunctional Requirements
- NFR1: 国内可用三方服务优先；外部依赖需有可替代方案或降级策略。
- NFR2: 前后端以 SSE 展示异步进度；事件使用单调 cursor 和可恢复持久记录，客户端/服务重启后从最后确认位置重连，不把内存队列当作事实来源；MVP 不使用远程推送。
  - App 不承诺后台 SSE 常驻；挂起或进程重建后先核实身份，再恢复同一 job/cursor/revision，不自动重交业务。
- NFR3: AI 安全与成本控制：平台 Provider secrets 仅在服务端管理；日志、Sentry、Langfuse 与埋点必须脱敏；对象存储私有读写与签名 URL；AI 请求具备速率限制、成本上限、异常熔断和降级策略。
  - App 原生凭据使用受控安全存储，服务端秘密不入安装包；外部网页不获得原生桥接、会话或私人存储。
- NFR4: 性能目标（MVP）：单一 AI 初始规划、增量校验、行程细节完善与导出分别设定并监测 P50/P95；内部降级不得造成第二套用户完成流程。
- NFR5: 质量指标：首次可行计划率、required 安全落位率、along_route 采用率、候选可解释率、餐饮选择池有效率、地理消歧 Top-1/Top-3 命中率、负荷估算覆盖率和跨日高负荷检出率分别设定并监测。
- NFR6: 可观测性：Langfuse/promptfoo/Sentry 接入完备，关键漏斗（登录→输入/导入→时间→住宿→选点→规划前确认→AI 规划→编辑/校验→行程单→导出）可埋点度量。
  - Web/Android/iOS 的事件分母、App version/build、Web bundle、JS/原生错误分别可查，桥接不得双计数。
- NFR7: 合规与隐私：首屏可跳转《隐私政策/用户协议》；账号删除与数据导出流程闭环；高德版权标注规范。
  - 按实际 SDK/用途维护原生权限说明、适用隐私清单及分发声明；未同意的采集不因 App 启动而自动开启。
- NFR8: 交互体验：移动端动效 120–200ms；单列布局；顶部吸顶分段；关键列表/弹窗交互流畅。
  - Android/iOS 验收系统返回、中文键盘、安全区、大字号/读屏及前后台恢复，移动浏览器证据不能替代真机。
  - 相同语义的控件、输入、模态与状态采用共享交互合同。身份未确认时同步遮蔽页面与 Portal 中的私有内容，按原业务合同保持焦点、滚动、草稿和恢复；受影响页面提供浏览器、读屏及大字号回归证据。

- NFR9: 行程细节完善不得改动日期、时间与顺序；任何重排必须走独立的可预览调整流程并生成新版本。
- NFR10: 初始规划安全性：不得静默突破营业、冻结时窗、住宿、transfer 或权限硬约束；失败项进入明确未解决状态，用户编辑与 AI 调整均可撤销且不得覆盖更新版本。
- NFR11: Linked-trip 性能与一致性：各单城市 Plan 可独立计算，但 TripRevision 必须绑定确定的 Plan/Transfer 版本；交接日、住宿与行李边界在生成、编辑和导出中保持一致。
- NFR12: 引用可追溯性（v0.3）：AI 输出的事实引用需可追溯到数据源（保留来源ID/时间戳/摘要）；失败时必须降级为“通用建议”。
- NFR13: 采集稳定性与重试责任：独立XHS采集服务负责其内部Cookie/代理/平台挑战与采集重试；Nomad不接管这些登录状态，但必须为自己的HTTP调用和ingest任务执行幂等、总超时、受限重试、持久DLQ/恢复及脱敏观测。不得叠加隐藏重试放大费用，调用责任和实际attempt计量在接口合同中明确；不可用时保留已有媒体/待定位或真实失败。本期仅消费用户提供的已支持具体链接，不提供关键词搜索或扩大来源平台。
- NFR14: 许可与合规：第三方采集器以独立服务（HTTP）集成以避免 GPL 传染；仅保存最小必要数据；证据链（source/时间戳/摘要）与可追溯性满足 NFR12。
- NFR15: 反馈隐私与安全：默认不向外部传 Nomad 身份/会话或手机号/邮箱，不承诺所有宿主匿名；内置表单复用有效账号并隔离文字/私有截图/回执，诊断元数据显式选择且最小化。外部 SSO 等留后续按官方合同设计；授权维护访问、导出/删除与临时附件清理随 7.6 交付。
- NFR16: 反馈运行环境与状态：Web/PWA 使用真实外部打开能力，本期 Android/iOS Capacitor App 使用受限系统浏览能力，返回恢复原上下文且外部页面不能获得 Nomad 桥接/会话；明确加载失败提供恢复，不伪造跨域 HTTP/CSP 检测。区分 feedback_open_* 与 feedback_submit_*，仅真实落库回执计第一方提交成功，不可观测的外部提交不计成功/失败；事件仅含有限 source_page/模式/安全错误。上传置灰与无底部按钮的进行中状态遵守 FR45，有界核实超时后才恢复操作。
- NFR17: LLM 提供商可替换与回退：所有编排与填充调用均通过 OpenAI 兼容接口（api_base + model）；可远程切换提供商/模型并支持按任务路由；出现失败/超时按预设顺序回退；成本/时延与错误率可观测；变更不影响前端与业务逻辑。
- NFR18: 定位隐私：只在App打开/回到前台且存在当前旅中餐饮用途，或用户打开/刷新餐饮候选时，经当前有效授权请求单次定位；历史授权不得越过系统撤权。同次前台事件去重，不启用持续监听、定时定位或后台刷新；仅保留本次召回必要的短时位置上下文，服务端与分析日志只记录粗粒度结果，不保存精确位置历史或连续轨迹。
- NFR19: Picker 状态一致性：required/along_route/unselected 在地图、L3 列表、L2 汇总、全城检查和提交 payload 中必须由同一状态源派生；返回、切换视角和弱网降级不得丢失或改变语义。
- NFR20: 导入所有权：导入记录、解析结果、原始链接和用户批注按 owner 隔离；共享内容指纹或缓存不得成为跨用户读取路径。
- NFR21: 证据诚实性：预约、免排队、商圈归属、营业事实和来源归因必须携带证据/时间戳/质量状态；未知或推断必须明确降级，不得以实时或已确认语气展示。
- NFR22: Trip 原子一致性：联合发布必须绑定确定的主 Segment Plan、DayExcursion 子 Plan、TransferLeg、Stay 和 LuggageTransition 版本；任一主链或一日游 transfer 无效时不得发布部分联程。DayExcursion 必须同时绑定宿主日期、子 PlanRevision 及去返两条 TransferLegRevision，不能只发布单程或孤立子计划。
- NFR23: 路线与动态事实诚实性：通勤模式/时长、航班/铁路查询和天气均保留来源、观测时间、新鲜度与状态；配额、超时、歧义或陈旧时返回 unknown/provisional/seasonal 降级，客户端不得估算或把建议伪装为已购票、实时库存或实时排队。
- NFR24: 运营告警可靠性与隐私：AI/AMap 的普通限流、可重试失败和用户侧操作受限状态不得触发管理员骚扰告警；不可恢复终态按环境、Provider、能力和错误类别去重聚合并设置冷却。Telegram Bot token/chat id 只存在于服务端 secret 配置，告警投递具备超时、有限重试、失败持久记录和恢复通知，且任何 payload、日志或 trace 均不得包含用户内容、精确地点/路线、受保护 URL、凭据或跨 owner 数据。

- NFR25: App 构建与交付可核验：版本记录可追溯到源代码、锁文件、Web 资源摘要、原生依赖/工具链、配置环境和签名引用；双端从受控输入完成构建、安装与升级回归。安装包不包含服务端密钥或开发身份通道；支持范围、权限/SDK 清单、文件/回调边界、原生故障与版本关联有实证。签名产物不要求字节级复现，但构建输入和功能结果必须可重复核验。
  - 平台下限须与 Web CSS/JS 构建目标、App deployment target、依赖锁定及实际验收矩阵一致。组件或依赖升级后，旧构建目标、旧包和旧回归证据不能直接作为新版本的兼容证明；浏览器自动化不替代最低平台和真机验收。

### Additional Requirements

- **AR1 — Brownfield delivery:** This is an existing pnpm monorepo, not a greenfield starter. Preserve completed Story 1.1-1.5 and 2.0-2.1 delivery history; introduce only story-scoped compatibility changes and migrations.
- **AR2 — Contract authority:** `docs/api/openapi.yaml` is the API SSOT. Update it before server/client contracts, regenerate `packages/types`, and never hand-edit generated API types.
- **AR3 — Existing stack:** Continue with Node.js 22, TypeScript ESM/NodeNext, React 19/Vite mobile and Fastify 5. Do not add a duplicate backend framework, domain state authority or Windows-native build path. The approved UI, read-query and navigation layers follow AR25–AR28.
- **AR4 — Ownership boundaries:** Mobile owns presentation and draft state; Fastify owns authentication/domain commands/orchestration; Prisma owns persistence; generated types cross the API boundary.
- **AR5 — Durable-write safety:** Every protected write/job requires owner scoping, idempotency, expected revision or attempt fencing, auditable immutable versions where applicable, and typed conflict/error responses.
- **AR6 — Durable async state:** Ingest, planning, fill and export jobs use factual stages, durable sequence/cursor state, reconnect, retry/DLQ policy and process-restart recovery. Application-code workers use the existing framework and necessary queues without a low-code prerequisite; worker memory, callbacks and queues cannot become domain truth.
- **AR7 — One planning result:** One PlanningJob may have internal Provider/deterministic attempts, but only the fenced current attempt may publish; no public Quick/HQ adoption or second completion path.
- **AR8 — Planning boundaries:** Planner creates the complete schedule, Validator owns initial and mutation-triggered feasibility plus typed fixes, and Filler may enrich details/citations only without changing schedule fields.
- **AR9 — Linked-trip aggregate:** Linked multi-city delivery uses an unbounded ordered main `TripSegment -> single-city Plan` collection under `Trip`, plus date-bound `DayExcursion -> single-city Plan` children for approved same-day returns. Immutable main/round-trip Transfer, Stay, Luggage and DayExcursion revisions publish through one atomic TripRevision; the domain must not encode a fixed city-count ceiling or derive identity from repeated city labels, and failed/provisional transfers cannot yield a partially published trip.
- **AR10 — Geography model:** Canonical POI and normalized BusinessArea are separate from administrative district and L1/L2 groupings. Owner-scoped food recall requires verified POIs and reliability-policy-approved membership.
- **AR11 — External facts:** XHS, AMap, flight/rail, route, weather, Provider and COS integrations use adapters, timeout, typed unavailable/ambiguous states, source, observed/freshness and deterministic test doubles. AMap is not a flight/rail timetable provider.
- **AR12 — Privacy:** Provider secrets, phone/token data, protected source URLs, complete private prompts/evidence and continuous/exact location trails must not enter frontend payloads, analytics, Sentry, logs, exports or unredacted traces.
- **AR13 — Cost controls at first use:** Minimum quota, concurrency, timeout, fallback, circuit-breaker and redacted telemetry controls must ship with the first ingest/planning/fill/export story that depends on them; later operations stories may extend dashboards and policy.
- **AR14 — Real-service gates:** Persistence stories require migration plus real PostgreSQL verification. Stories changing XHS, AMap, flight/rail, routing, weather, Provider or COS semantics require a redacted real-service staging check in addition to deterministic tests.
- **AR15 — Testing gates:** Contract generation, focused unit/repository/route/mobile tests, `pnpm -r build`, diff checks and browser screenshots are story completion gates; changed mobile UI must cover loading, empty, failure, reconnect, disabled and accessibility states. AR26 adds actual typed lint, component interaction/a11y and visual regression without replacing runtime gates.
- **AR16 — Deferred check-in architecture:** Story 7.2 is excluded from MVP by the 2026-09-06 user decision. Its visit-state/API/lineage proposal is not a current readiness gate or an implemented capability. Future FR40.1 photo-based marking requires fresh product/privacy/architecture design; current planning, recall and recent trips must not depend on it.
- **AR17 — Accessibility baseline:** Enforce the MVP baseline covering 44pt targets, labels/roles, non-color state, focus return, keyboard-safe Sheets, reduced motion, live-region discipline and WCAG AA contrast. The PRD's contradictory `Accessibility: None` statement was corrected on 2026-09-07; implementation and real-device verification remain required.
- **AR18 — Vertical slicing:** Do not create standalone technical prerequisite stories whose first usable outcome appears only in a future story. Add entities/migrations in the first vertical user-value slice that needs them.
- **AR19 — No forward dependencies:** Every execution story may depend only on completed baselines or earlier stories in the approved execution dependency order (numeric IDs do not define chronology). Export must work without future detail enrichment; cross-city confirmation must be delivered with the linked-trip slice that handles acceptance.
- **AR20 — Story readiness:** New execution stories must be completable by one development agent, cite FR/NFR/UX-DR identifiers, use independently testable Given/When/Then scenarios, and separate happy, failure, degradation, security and accessibility acceptance cases.
- **AR21 — Post-plan accommodation editing:** S3 owns pre-planning multi-night input and reusable hotel/breakfast/luggage field rules. Epic 3 owns the post-plan single-night entry, conditional impact preview, immutable Stay/Luggage revisions, incremental validation and global undo. Changing accommodation must never silently move POIs or invoke FR42 automatic replanning.
- **AR22 — Operator alert boundary:** AI/AMap terminal quota, authentication, billing, all-route-unavailable and sustained-breaker incidents may notify only configured operators through a server-side Telegram adapter after retry/fallback exhaustion. Alerts require durable dedupe, aggregation, cooldown, recovery and redaction; delivery failure never changes user domain state.

- **AR23 — Capacitor host boundary:** Reuse React/Vite with Web, Android and iOS adapters; only necessary native capabilities cross typed platform interfaces. Credentials, external pages, callbacks, permissions and lifecycle have explicit trust boundaries.
- **AR24 — App delivery evidence:** Native projects, locked toolchains and build inputs must yield real installs, upgrades and traceable APK/TestFlight releases; source generation, SDK configuration or browser tests cannot substitute.
- **AR25 — Nomad shared UI:** shadcn/ui＋Base UI＋Tailwind4通过受控源码生成、tokens和公共组件接口复用；AppSheet/Portal共享身份遮蔽与唯一返回/焦点边界，保留品牌、领域状态与原生凭据权威。
- **AR26 — UI quality evidence:** Storybook/MSW隔离工作台、真实typed lint和Playwright关键流程/截图进入日常CI；旧探针先做覆盖对照，browser/fixture不替代真实DB/服务/设备。
- **AR27 — Read cache authority:** Query9.6仅管理普通服务器读取；现有auth transport、owner/version隔离、取消与重试刷新策略明确；首批私有缓存不持久化，不替代operation journal或durable cursor。
- **AR28 — Typed navigation:** Router9.7只管理现有页面、允许的public reference和已校验深链intent；身份、草稿、关闭与宿主返回协调统一，navigation/loader不提交业务写入。

### UX Design Requirements

- **UX-DR1 — Canonical journey:** Implement S0-S11 consistently in routes, analytics and copy: S1 is optional, S5 alone starts planning, S6/S7 share one timeline shell, and S8 is a repeatable adjustment loop.
- **UX-DR2 — Mobile visual baseline:** Use a mobile-first single column, stable dimensions, 44x44pt minimum targets, 120-200ms normal motion, 240-300ms Sheets, <=8px card radii, restrained deep-green emphasis and no card nesting or marketing-page composition.
- **UX-DR3 — Accessible interaction:** Icon-only actions require labels, roles, visible selected/disabled states and reasons; required/along-route cannot rely on color alone; support focus containment/return, keyboard-safe CTA, reduced motion and concise live regions.
- **UX-DR4 — HomeImportDock:** Keep queue status, one long composer and one `+ / send` button on one surface. Preserve input while jobs run; use the approved placeholder and 120-180ms plus-to-send transition.
- **UX-DR5 — Import queue states:** Support natural-language recognition, multi-link `N/X`, expanded/compact running, durable reconnect, retriable/terminal failure, owner duplicate, mixed valid/invalid paste and FIFO ten-second success presentation without fake percent.
- **UX-DR6 — Import records:** Library record detail displays parsed POIs and unresolved state, while a compact authenticated copy action exposes only the owner's protected original URL.
- **UX-DR7 — Travel-time flow:** S2 is a focused mobile screen for overall dates/days, daily departure time and separately confirmed arrival/departure modes: exact lookup/manual, a continuous two-hour window or AI-decide.
- **UX-DR8 — Boundary honesty:** Exact transport summaries show source/status/freshness; no-match reaches manual mode; AI-decide shows only provisional usable time and never fabricates a service, ticket, terminal or booking.
- **UX-DR9 — Per-night accommodation:** S3 renders each accommodation night with optional AMap-matched hotel, breakfast and luggage. `Same as previous` is a per-night button; hotel may be blank and untouched ambiguity cannot silently pass gating.
- **UX-DR10 — Contextual luggage:** Present valid first-night, continuing-stay, hotel-change, hub-storage and final-departure choices, including drop-off/pick-up requirements and honest unavailable states.
- **UX-DR11 — Full-city Picker overview:** S4 starts at a non-expandable L1/L2 full-city overview; L2 is navigation/context only and derives a non-interactive state plus separate required/along-route counts from child L3 items.
- **UX-DR12 — L3 intent controls:** L3 rows use mutually exclusive icon-only check-circle=required and Route=along-route controls; active re-click clears. Footer shows both counts and `Return to overview`; zero selection remains valid.
- **UX-DR13 — Picker state consistency:** List, marker, card, POI Sheet, L3 thumbnail, L2 aggregate, full-city total and submit payload must derive from one intent store and survive view changes, back navigation and weak-map fallback.
- **UX-DR14 — Picker map behavior:** Only the L3 view exposes mutually exclusive nearby/full-city modes; selecting an L3 focuses it and nearby places, split view includes neighboring L2s, and full map reveals the L1 area while list fallback retains every core action.
- **UX-DR15 — POI information:** A reusable Sheet titled with the POI name presents address, opening facts, rating, suggested stay, source and optional reservation evidence; freshness and quality remain internal decision/audit data rather than user-facing technical status labels, and inferred evidence is not displayed as a confirmed booking.
- **UX-DR16 — Pace review:** S5 summarizes place intent, requires one of relaxed/balanced/full pace with the approved consequences, provides a default-collapsed optional constraints row, avoids a second play-style questionnaire and owns the only `Start planning` CTA.
- **UX-DR17 — Planning shell:** S6 enters a stable timeline shell immediately and communicates accepted/context/constraints/candidates/arranging/validating/persisting, reconnect, generic fallback and failure without exposing Quick/HQ or a separate completion screen.
- **UX-DR18 — Timeline hierarchy:** S7 uses scrollable day tabs with a narrow fixed checklist rail, waterfall POI/meal/transfer rows, nullable server commute facts, a hotel footer and no brand/version labels or bottom recent-operation row.
- **UX-DR19 — Completion, candidates and load:** Keep the completion hint until the first real mutation. Group candidates first by intent as `未安排的必去 / 顺路候选 / 其他候选`, then label each row by provenance such as `来自灵感 / 城市热门 / 附近推荐 / 我添加的`; intent and provenance remain orthogonal and generic `AI` is not a source label. Also expose expansion stage/free-time outcome and day-load detail with ranges, reasons and confidence rather than fake precision.
- **UX-DR20 — Timeline edit Sheet:** Begin with POI/date and previous/next commute, then replace, previous/other/next day, retime and delete. Disable invalid day targets, hide cross-segment targets and state when commute is unavailable.
- **UX-DR21 — Minute time control:** User retiming supports every valid minute with clock/alarm behavior; fast scrolling changes sensitivity only. Start/end carry explicit day labels for cross-day intervals and no snap guidance appears.
- **UX-DR22 — Global undo:** The plan-level top-right control is a history icon by default, becomes `Undo 8` after mutation, then allows one latest additional eligible undo. It is not day-scoped and no bottom undo/recent-action surface is shown.
- **UX-DR23 — Conflict repair:** Clean plans have no permanent validation card. Soft-only issues use one low-emphasis `有 N 项建议核对 · 查看` entry; hard/mixed retain visible repair access and original gates. The user opens the existing FixSheet for typed alternatives/diff; no automatic modal or per-item acknowledgment. Application creates a revision, reports actual changes, supports undo and preserves the plan on stale/failure/no-safe-fix.
- **UX-DR24 — Conversational adjustment:** A labeled floating AI-adjust icon infers the smallest slot/continuous-arrangement/day/later/current-single-city-Plan scope. In a linked trip it remains bound to the active main `TripSegment -> Plan` or DayExcursion child Plan and cannot change the city chain, either excursion transfer or another host/child/city Plan. Ambiguous scope or material risk produces one structured `AdjustmentAsk` at a time; the user sees an editable compact scope or one concise risk question, never an `我理解为` narrative or chain-of-thought. Once clarified, the flow usually offers two concise safe directions before detailed diff; a sole safe direction remains one, and no safe direction uses recovery, applies only after confirmation, reports actual changes, and preserves the plan on no-safe/stale outcomes.
- **UX-DR25 — Linked-city flow:** Cross-city intent explicitly branches among same-day excursion, add-city and cancel. Add-city shows the proposed ordered main route and loops to that city's time/accommodation input; the main city chain has no product-defined count ceiling and long chains remain navigable without truncating identity/actions. A day excursion binds one host date, requires separate outbound/return confirmation, keeps host accommodation/luggage, renders one Dn timeline without duplicate host tabs and labels the return. Invalid/provisional linkage cannot look complete. Repeated-city main chains, cross-timezone/overnight return, nested/multi-destination excursion and arbitrary whole-chain reorder remain unavailable.
- **UX-DR26 — Meal states:** Planned meals use ordinary POI styling with evidence badge and optional swap. Support fixed anchor, one-primary/two-backup choice pool, first-shortage add action and undecided state without a fixed-duration promise.
- **UX-DR27 — Contextual food:** Foreground-authorized recall states explain live/stale/denied/plan-context basis. Area-food hints attach beneath a mall/market/food-street POI, query only verified owner imports in a reliable BusinessArea and never create a timeline node.
- **UX-DR28 — Trip checklist:** Keep a compact fixed ListChecks rail next to scrollable dates. The full page groups must-buy, along-route and return tasks and ends only with `+ Add record`; the Add Sheet switches emphasis from direct add to enabled AI suggestion only after input, with confirmation before AI write.
- **UX-DR29 — Detail and Result Sheet:** S10 always shows the current base itinerary and separates revision-bound schedule validation from detail completeness in one overall check. Hard conflicts remain readable but gate fill/export; otherwise S10 opens S9 and restores the same context on return. S9 enriches existing slots only. S10 shows generated do/prepare/notice, why and real citations without technical quality/freshness labels; line-level user wording, deletion suppression and explicit-empty optional fields survive later fill, same/near-duplicate AI suggestions are discarded, user lines do not inherit AI citations and no restore-AI action exists.
- **UX-DR30 — Export and on-trip use:** S11 provides preview, 1080/1242 width choice, revision-derived city-unit images, versioned background, save/share, retry and hard-conflict/invalid-transfer gate. It does not expose per-day slicing or client-authored city grouping. Recent-trip UX follows approved Story 7.1. Check-in, photo-based visit marks and photo/video/nine-grid/AI-beautified media are outside MVP; do not add their controls or hidden memory/location/reminders.
- **UX-DR31 — Account and available actions:** Settings shows account and actual available actions only, with no usage/quota/global-job dashboard, counters, balances, limits or reset times. Operation screens retain factual job progress and honest recovery without exposing quota levels or Provider/Key details. Internal guards remain enforced and existing plan browsing/manual editing stays available.
- **UX-DR32 — State preservation and recovery:** Preserve drafts when navigating S2/S3, Picker intents across views, per-day scroll positions across Sheets/checklist, pending cross-city intent through input completion and existing job/revision recovery across auth, deep links and app resume.
- **UX-DR33 — Prototype governance:** Only assets listed as current in prototype coverage may guide implementation. Text contracts override behavior-partial images; each owning story must close or explicitly accept its listed high-risk missing visual states before UI implementation.
- **UX-DR34 — Post-plan accommodation editor:** Tapping a day's hotel footer opens a single-night Sheet that reuses hotel, breakfast and independently editable luggage fields. `Manage all accommodation` opens the multi-night flow at that night using static highlight/focus rather than flashing and restores timeline context on return. The final departure day edits checkout/luggage without creating a stay. Material hotel/luggage changes conditionally open an impact Sheet before immutable save; save triggers incremental validation and global undo without silent replanning.
- **UX-DR35 — Post-plan place search fallback:** S7 `添加地点` uses text-only AMap Top-5 and saves exact or manual results to `其他候选` with row-level provenance `我添加的`, without timeline mutation. No accurate result asks for a target name plus an optional same-city verified nearby landmark. Proxy results always show `附近估算`, the landmark and possible error; target facts never inherit landmark facts. No landmark means `待定位` and no route. Candidate placement is a separate S8 revisioned command with validation and global undo.

- **UX-DR36 — App host interactions:** Preserve S0-S11; system back respects keyboard/layers/drafts, safe areas and keyboard keep actions reachable, foreground recovery rechecks identity before private state, permissions are contextual with real fallback, and native save/share results remain truthful.
- **UX-DR37 — Shared component experience:** 保留已批准布局/品牌/18组提示；语义tokens和Button/Field/Dialog/Tabs/Toast/Skeleton统一状态，Portal身份遮蔽、焦点/滚动/键盘/返回/安全区和可访问性有实际证据；Query/Router不改变领域恢复或写入语义。

### FR Coverage Map

| Requirement | Epic coverage | Delivery note |
| --- | --- | --- |
| FR1 | Epic 1 | Story 1.0 production identity/multi-device prerequisite; historical 1.1/1.2 remain scoped evidence |
| FR2 | Epic 1 | Home planning/inspiration navigation and unified input |
| FR3 | Epic 1 | Input classification and ambiguous-input choice |
| FR4 | Epic 1 | Durable multimodal Xiaohongshu ingest |
| FR4.1 | Epic 1 | Chain/branch disambiguation during ingest |
| FR4.2 | Epic 1 | Story 1.11 minimal manual POI correction with provenance, versioned publication and no rewrite of published plans |
| FR5 | Epic 1 | City-grouped inspiration library and unresolved matching |
| FR6 | Epic 1 | Imported L3, unresolved matches and source records |
| FR7 | Epic 2 | Complete initial single-city planning |
| FR8 | Epic 3 | Minute-precise timeline editing and valid-day moves |
| FR9 | Epics 2, 3 | Story 2.11 initial validation; Story 3.1/3.4 mutation-triggered checks and previewable repair |
| FR10 | Epic 5 | Detail-only AI enrichment |
| FR11 | Epic 5 | Itinerary image export |
| FR12 | Epic 7 | Settings, account and available data/privacy/feedback actions; no user quota |
| FR13 | Epic 8 | Langfuse, promptfoo and Sentry operations |
| FR14 | Epics 1, 2, 3, 4, 5, 6, 8 | Each domestic integration ships with its first consuming vertical slice; Epic 8 consolidates operational control |
| FR15 | Epic 1 | Equal Apple/phone/WeChat login presentation |
| FR16 | Epic 1 | Risk-triggered verification policy |
| FR17 | Epic 1 | Ambiguous input Bottom Sheet |
| FR18 | Epic 1 | Multi-link client queue over single-link jobs |
| FR18.1 | Epics 1, 7 | Owner import records, protected URLs, versioned dedupe and Story 7.5 shared-reference-safe deletion |
| FR19 | Epic 1 | Factual durable ingest SSE and FIFO completion presentation |
| FR20 | Epic 1 | Honest unresolved Top-5 display |
| FR21 | Epic 3 | Plan-global history/undo and one-minute time control |
| FR22 | Epic 3 | Structural rejection, derived conflict state and export/detail gates |
| FR23 | Epic 5 | Detail output length and fallback contract |
| FR24 | Epic 5 | WebP/JPEG city-unit export plus tested whole-trip composition, numbered city-boundary parts and Web/PWA delivery contract |
| FR25 | Epics 5, 7 | Operation progress and safe recovery actions; no quota display or Settings usage summary |
| FR26 | Epic 2 | Planning entry through S2-S4 with guarded deep links |
| FR27 | Epic 2 | Planner route and parameter contract |
| FR27.1 | Epic 2 | Travel-time and per-night accommodation confirmation |
| FR28 | Epic 2 | Pace review and sole start-planning action |
| FR28.1 | Epics 1, 2 | Epic 1 extracts evidence-backed interests; Epic 2 consumes them as soft ranking signals |
| FR29 | Epic 2 | Full-city overview and L3 drill-down |
| FR30 | Epic 2 | Required/along-route L3 intent actions and totals |
| FR31 | Epic 2 | Shared Picker intent state and reservation-evidence semantics |
| FR32 | Epic 2 | One visible PlanningJob and complete editable result |
| FR32.1 | Epic 2 | Internal fallback without alternate user versions |
| FR32.2 | Epic 2 | Fenced high-quality planning attempt and safe publication |
| FR32.3 | Epic 2 | Unresolved/candidate provenance and staged completion |
| FR33 | Epics 2, 8 | Epic 2 ships minimum job controls and factual stages; Epic 8 expands operational routing and metrics |
| FR34 | Epic 2 | AnchorPool/Top-50 as internal candidate fallback |
| FR34.1 | Epic 8 | Post-MVP platform XHS acquisition and AnchorPool cold-start fill |
| FR35 | Epic 4 | Explicit unbounded ordered-city Plan chain and atomic handoff |
| FR35.1 | Epic 4 | Same-day cross-city DayExcursion with two-leg atomic return |
| FR36 | Epics 2, 3, 6 | Epic 2 delivers hotel-slot planning inputs; Epic 3 owns post-plan accommodation edits; Epic 6 delivers planned-meal behavior |
| FR36.1 | Epic 2 | Hotel-aware soft planning preferences |
| FR36.2 | Epic 6 | Meal slots, choice pools and owner commercial-area recall |
| FR37 | Epic 5 | 5.1 minimum S10 host/S9 sources/return; 5.2 full checks/reading/citations; 5.3 line overrides |
| FR38 | Epics 5, 7, 8 | First-use internal guards and operator policy remain; Epic 7 respects enforcement without exposing quota |
| FR38.1 | Epic 8 | AI/AMap terminal quota/provider monitoring and redacted Telegram operator alerts |
| FR39 | Epic 5 | Citation and hallucination-degradation contract |
| FR40 | Epic 7 | MVP recent trips and resume through 7.1; manual Story 7.2 explicitly deferred |
| FR40.1 | Post-MVP, deferred | Photo/geolocation-based marking and album video/nine-grid/AI beautification; fresh design required, no MVP execution story |
| FR41 | Epic 2 | Explicit hotel priority and honest blank hotel slots |
| FR42 | Post-MVP | Hotel-change automatic replanning confirmation is explicitly deferred |
| FR43 | Post-MVP | Arbitrary history-step timeline is explicitly deferred |
| FR44-lite | Epics 2, 3 | Epic 2 delivers POI/hotel Top-5 plus exact/landmark-proxy/unresolved candidate save; Epic 3 owns explicit placement/replacement, validation and undo |
| FR45 | Epic 7 | Real host-aware feedback routing, private minimal form, durable receipt and authorized maintainer access |
| FR46 | Epic 6; advanced shopping and checklist-to-schedule deferred | 6.4 checklist/return records and 6.5 light shopping text; existing transport/stay/luggage buffers stay in Epics 2-4 |
| FR47 | Epic 6 | Normalized BusinessArea membership and owner-scoped query |
| FR48 | Epic 6 | Foreground location and plan-context degradation |
| FR49 | Epics 2, 3, 4, 5, 6, 7 | Canonical S0-S11 transitions, on-trip meal/checklist return context and owner resume of existing views/jobs |
| FR50 | Epics 3, 4 | Controlled local adjustment plus linked-trip active-city scope guard |
| FR51 | Epics 2, 3, 4 | Story 2.14 day-load estimates; Story 3.4 cross-day/weather validation; Epic 4 extends affected Trip/host-child boundaries |

FR52: Epic 9 (9.1 安装/宿主，9.2 APK/TestFlight 交付)，与 1.0/1.6/1.7/2.9/5.4/5.5/6.2/7.1/7.3/7.4/7.5/7.6/8.1 各自的 App 切片共同承担。

## Epic List

### Epic 1: 安全开始并建立可信灵感库

用户可以安全登录，从统一首页输入旅行想法或批量导入小红书内容，并在隔离的
灵感库中查看经过验证、可追溯且能够恢复处理进度的地点与来源记录。

**FRs covered:** FR1-FR6, FR4.1, FR4.2, FR14 (登录/导入集成), FR15-FR20, FR18.1,
FR28.1 (兴趣信号提取)

**Implementation note:** 新1.0先补真实认证与多设备会话，复用而不等待历史1.1–1.5；保留这些历史done记录。新增工作按可见的导入、
记录和证据质量结果纵向交付，不创建独立 BusinessArea 技术里程碑。

### Epic 2: 从约束与灵感生成完整单城计划

用户可以用移动端短流程确认时间、逐晚住宿、地点意图和节奏，并在一个稳定的
时间轴中获得完整、诚实、可直接编辑的单城计划。

**FRs covered:** FR7, FR26-FR34, FR27.1, FR28.1, FR32.1-FR32.3, FR36,
FR36.1, FR41, FR44-lite, FR49 (S2-S7), FR51 (日负荷生成)

**Implementation note:** 一个 PlanningJob 和一个可见结果；最小 Provider 配额、
熔断、路由事实与脱敏观测随首次使用交付，不等待 Epic 8。

### Epic 3: 安全编辑并调整已有行程

用户可以按分钟修改已有计划、移动到任意有效日期、使用全计划撤销，并在修改
引发问题时预览修复或通过受控 AI 局部调整，而不会丢失当前版本。

**FRs covered:** FR8, FR9, FR21, FR22, FR50, FR51, FR14 (路线/天气集成),
FR36 (规划后住宿编辑), FR44-lite (候选受控落位), FR49 (S7/S8)

**Implementation note:** 现有在制 Story 2.2 作为 brownfield 迁移来源保留
`legacy_story_id` 和 Git 记录；新执行 Story 使用 Epic 3 编号并明确 keep/change/remove。

### Epic 4: 把多个城市连接成可执行联程

用户可以用同一套流程持续新增城市，把每个独立单城 Plan 按顺序连接起来，并获得
带真实或诚实降级交通、城市可用时间、逐晚住宿、行李交接和原子版本发布的完整联程；
也可以在宿主城市某一天安排同日返回的跨城一日游，而不制造重复主城市段。

**FRs covered:** FR35, FR35.1, FR14 (班次/AMap 接驳), FR49 (跨城回环),
FR50 (当前城市 AI 调整边界)

**Implementation note:** 跨城确认与能够承接该选择的最小 Trip 垂直切片一起交付，
不提前创建不可使用的 Trip/Transfer 技术 Story；TripSegment 必须是泛化有序集合，
不得以第二城/第三城字段或固定数量上限实现。DayExcursion 是宿主日期下的子计划，
不得用 `A1 -> B -> A2` 三个同级 TripSegment 或城市名称字符串表达。

### Epic 5: 把计划完善为可核查、可分享的行程单

用户可以在不改变排期的前提下补充执行细节、why 和引用，保留自己的轻编辑，
并预览、保存或分享单城及联程行程单。

**FRs covered:** FR10, FR11, FR23, FR24, FR37, FR39, FR49 (S9-S11),
FR25/FR38 (fill/export first-use slice)

**Implementation note:** 5.1先交付最小S10宿主页/S9来源与返回闭环，5.2在同一路由增强完整核查。基础导出只依赖当前计划revision；细节存在时作为可选内容，
因此 Epic 5 不依赖未来 Epic。填充/导出首次使用所需的最小配额、超时、熔断和诚实
降级随本 Epic 交付，Epic 7 只扩展账户/设置汇总。餐饮或清单后续使用兼容的
slot/section renderer 扩展。

### Epic 6: 在旅途中灵活处理吃饭与购物

用户可以管理固定或灵活餐饮、在授权后按位置与可靠商圈更新候选，并使用不污染
时间轴的购物与返程清单。

**FRs covered:** FR36 (餐饮部分), FR36.2, FR46-FR48, FR14 (AMap/定位集成)

**Implementation note:** BusinessArea 和前台定位随第一个可见召回结果纵向落地；
拒绝定位、无可靠商圈或候选不足时仍有完整降级体验。

**Scope update (2026-09-06):** 6.5 已缩小为轻量购物文本与标签快捷输入；找店、多门店、
自动购物编排及顺路提示延期。用户进一步确认清单返程事项转时间安排留待后续版本；
本期由 6.4 保存/维护返程记录，既有交通/住宿/行李缓冲继续由 Epic 2-4 负责，不新增
Story 6.6。当前 MVP 范围覆盖已收口；见 `epic-6-coverage-review-2026-09-06.md`。
用户已于 2026-09-06 确认 Epic 6 规划完成并进入 Epic 7；实现状态仍由后续规划门禁管理。

### Epic 7: 持续使用行程并管理账户

用户可以重新打开最近行程、管理账号与数据、使用实际可用的操作，
并通过可靠的反馈入口获得帮助。

**FRs covered:** FR12, FR25, FR38 (后台保护边界，不展示额度), FR40, FR45; FR18.1 (删除与共享引用), FR37/FR49 (复用既有视图和返回上下文，不重建行程单)

**Implementation note:** Story 7.2 打卡已移出 MVP，AR16 随之延期而非标记已实现；
最近行程及其他当前 Story 不依赖打卡。BYOK 不进入 MVP 用户路径。

**Split approved (2026-09-06):** 用户批准 7.1 最近行程与继续使用、7.2 行程打卡与取消打卡、
7.3 设置页账号与可用操作（后经用户收窄）、7.4 账号数据副本导出、7.5 账号删除与清理结果、
7.6 反馈入口与可靠提交，按此顺序逐张评审。详见
`epic-7-story-breakdown-proposal-2026-09-06.md`。Story 7.1 已于 2026-09-06 获批并追加
22 个 GWT 场景，其最近行程、恢复及真实变更草稿/失败边界已同步到源文档。

**Scope amendment (2026-09-06):** 用户确认本期不做 7.2；保留其编号作延期记录，
不追加执行合同、不标 done。MVP 顺序改为 7.1 -> 7.3 -> 7.4 -> 7.5 -> 7.6，
其中 7.3-7.6 后续已逐张获批。未来 FR40.1 的照片自动标记和照片类产物另行设计；详见
`check-in-scope-decision-2026-09-06.md`。Epic 7 整体规划后于 2026-09-07 确认完成，历史 sprint 状态不变。

**Settings scope correction (2026-09-06):** 用户要求 7.3 只展示账号及可用操作，额度不对
用户暴露。已同步 FR12/FR25/FR38 与 UX-DR31，后台计量/限流不变；
`story-7-3-review-2026-09-06.md` 的 14 个 GWT 与 R2 已完整获批并追加，R2 取代旧用量 R1。
详见 `settings-account-actions-scope-2026-09-06.md`。

**Feedback approved (2026-09-07):** `story-7-6-review-2026-09-06.md` 的 20 个 GWT、Entry R1
与 Recovery R2 已整体获批并追加。上传置灰、无额外截图失败提示、进行中无底部按钮，
有界核实与真实超时恢复均保留；PRD/UX/架构同步真实提交回执和第一方隐私生命周期边界。

**Account export approved (2026-09-06):** `story-7-4-review-2026-09-06.md` 的当前结构化
数据范围、JSON-in-ZIP、20 个 GWT 与两组 R1 已获批并追加。PRD/UX/架构已同步；
不改变行程图片无 ZIP 的边界，不代表导出已经实现。

**Account deletion approved (2026-09-06):** `story-7-5-review-2026-09-06.md` 的 22 个 GWT
和两组 R1 已获批并追加，源文档同步受理后不可撤销、可选先导出、全设备停用/异步清理、
受限回执和备份独立披露。具体保留/认证/清理证据仍须实施核验，不授权本轮删除真实数据。

**Coverage reviewed (2026-09-07):** 五张有效 Story 共 98 个 GWT，九张当前原型均批准，
未发现当前 Epic 7 MVP 需求未分配项。详见 `epic-7-coverage-review-2026-09-07.md`；
用户随后于 2026-09-07 确认整体规划完成并进入 Epic 8 拆分，不改变实施或历史 sprint 状态。

### Epic 8: 度量并运营可靠的 AI 旅行服务

运营人员可以评测规划与内容质量、追踪错误和成本，并安全调整 Provider 路由、
配额、熔断与降级策略，而不会改变用户已有的单一工作流。

**FRs covered:** FR13, FR14 (全局运营), FR33 (运营扩展), FR34.1,
FR38 (运营侧), FR38.1

**Implementation note:** 本 Epic 扩展跨流程评测、仪表盘、集中策略与 Post-MVP
平台候选采集；前面 Epic 首次需要的安全、配额、降级和脱敏基线必须已经随对应
能力交付。XHS 主动搜索只服务 AnchorPool 后台预热/补池，不进入用户 PlanningJob。
AI/AMap 的普通额度与可恢复失败继续走既有用户降级；本 Epic 另设一张纵向 Story，
只对需要管理员动作的不可恢复终态执行去重、冷却、恢复通知和 Telegram 投递。

**Entry confirmed (2026-09-07):** Epic 7 规划完成，用户已授权进入 Epic 8 拆分。
`epic-8-story-breakdown-proposal-2026-09-07.md` 的六张 MVP Story 与两张 Post-MVP
预留条目已获批准。用户要求对应 Story 委派 agent 调研成熟实现，包含 GitHub/官方来源
及可行性、效果、利弊。8.1 的 20 条 GWT、隔离追踪采用方向与 Walkthrough R1 已批准并追加，
PRD/观测架构/analytics/UX 与镜像已同步。8.2 的 24 条修订 GWT、Langfuse 采用方案及
Human Workspace R2 于 2026-09-08 获批并正式追加；旧 Report R1/仅摘要/统一硬门禁已替代。
见 `story-8-2-review-2026-09-07.md`。8.3 的 24 条 GWT、既有 Node/PG 路由方案与两组 R1
原型也已于2026-09-08获批并追加。8.4-8.6及其原型/采用方向于2026-09-13获批，
六张MVP Story共138条GWT、十张有效原型。用户于2026-09-14确认Epic8整体完成并进入
CE Step4；详见`epic-8-coverage-review-2026-09-13.md`与`epics-final-validation-2026-09-14.md`。
8.7/8.8继续Post-MVP，历史Sprint和业务实现不因规划确认而改为完成。

### Epic 9: 通过统一的网页与手机应用使用 Nomad

旅行者能安装 Android/iOS App 并使用同一账号/业务；9.1 提前提供可安装宿主，9.2 在业务验收后交付 APK/TestFlight。FR52/NFR25；系统交互、原生插件和分发各有责任，不改变历史 Story 身份。

## Epic 1: 安全开始并建立可信灵感库

用户可以安全登录，从统一首页输入旅行想法或批量导入小红书内容，并在隔离的
灵感库中查看经过验证、可追溯且能够恢复处理进度的地点与来源记录。

### Story 1.0: 生产登录与多设备会话补齐

As a 旅行者,
I want 通过真实登录回到自己的账号，并在不同设备持续访问我的行程,
So that 服务重启、另一台设备登录或一次退出不会让我丢失数据或把私人内容交给错误账号.

**Requirements:** FR1, FR12（当前会话退出及删除认证基础）, FR14（登录集成）, FR15, FR16;
NFR1, NFR3, NFR6-NFR8, NFR20; AR1-AR6, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33。另承接 2026-09-15 IR-01/IR-06 批准决定。
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Execution boundary (IR-01/IR-06, 2026-09-15):** 这是现有工程的生产认证补齐，复用历史1.1/1.2已存在的首屏/路由，不依赖后续新增功能；在1.6及以后真实用户/首个运营写入前完成。1.1–1.5历史done与旧Sprint不重写。

**Acceptance Criteria:**

**Given** 用户在本期支持的Web/PWA、Android Capacitor App 或 iOS Capacitor App打开现有登录首屏
**When** 读取登录能力并选择手机号或本期获准启用的第三方方式
**Then** 手机号登录接通真实验证码验证；各启用方式的配置、前台入口、服务端回调/验证与目标环境能力一致，成功后用真实会话读取 `/me` 并进入既有首页
**And** 延续 Apple/手机号/微信在适用平台的已批准等权与顺序、协议链接和真实不可用状态；仅有按钮或配置不算接通，缺少本期必需服务证据不能靠隐藏入口宣布关闭，App 工程与基础宿主由 Story 9.1 交付，本 Story 在三端核验实际身份、会话、适用第三方方式与返回路径，缺少任一支持端的必需证据不得关闭

**Given** 应用以生产或面向真实用户的配置启动
**When** 收到 `x-user-id`、测试验证码、测试 captcha token 或开发身份覆盖配置
**Then** 这些输入不能创建可信身份或越过认证，测试适配器只可在显式隔离的本地/测试环境和受控测试入口使用
**And** 生产配置包含测试身份/模拟验证时拒绝就绪或返回明确不可用，不因缺凭据自动降级成替身；普通客户端提供的环境、角色或设备字段均不能开启测试通道

**Given** 用户提交验证码或返回已启用的第三方登录结果
**When** 服务端验证本次登录证明
**Then** 通过真实服务确认验证码/票据的有效性、用途、时效和绑定对象，按启用协议验证必要的回调来源、一次性关联、签名及接收方，并阻止过期、篡改与重放
**And** 已确认的 PNVS 图形认证只按已批准风险/重试策略触发且结果由服务端实际校验，非空 token 不代表通过；未完成验证不建立普通会话，回调目标只能恢复获准站内上下文

**Given** 一个已验证登录身份已有可信的内部账号绑定
**When** 用户再次登录、换设备或经另一种已确认绑定的入口登录
**Then** 服务端解析到同一稳定 owner，行程、导入记录和授权仍绑定原账号；并发首次注册/回调不能制造同一身份对应多个 owner
**And** 显示名、客户端 user id、未经验证的手机号/email 相同不构成合并依据；两个已有数据账号不自动合并，本期不新增自助合并或解绑操作

**Given** 当前历史数据使用旧 owner 标识且将迁移到生产身份映射
**When** 本 Story 执行已审查的迁移与兼容方案
**Then** 以可验证的旧数据归属和真实身份映射保存稳定引用，先给映射清单/冲突分类及恢复点，再验证原账号可读自己的历史数据且不能读取别人的数据
**And** 无可信归属、重复或冲突数据保留并隔离待核对，不因相同测试手机号、旧开发头或相似姓名自动归属，不清空数据、不重写 1.1–1.5 历史完成记录

**Given** 用户已经建立有效会话，服务发生重启、切换实例或并发验证
**When** 任一实例认证请求、读取到期时间或检查撤权状态
**Then** 通过共享持久或等价可验证的会话权威得到一致身份、过期与撤权结论，普通重启不丢失仍有效会话，已失效会话不会因旧缓存或另一实例重新有效
**And** 不以进程内 Map 作为生产会话权威；权威存储/验证不可用时返回真实可恢复认证失败，不接受任意身份或放行受保护数据

**Given** 同一 owner 在设备 A 已登录，又在设备 B 完成真实登录
**When** 两台设备分别读取受保护数据、续期或更新各自会话
**Then** 两个独立有效会话正常共存，B 登录或续期不会自动撤销 A；各会话只接受自身有效凭据且登录成功后不能沿用攻击者预设会话身份
**And** 不以客户端 device id 作为认证证明、不新增单设备独占策略或设备管理页面，账号资料和私人缓存不在不同 owner 间复用

**Given** 用户在当前设备选择普通退出，且另一设备仍有同账号会话
**When** 退出请求被实际处理或出现响应丢失后恢复
**Then** 幂等撤销当前会话并清理当前客户端 cookie/私人缓存/迟到请求，其他设备保持有效；服务端持久撤销事实与前台退出显示一致，未知结果沿同次退出核实而非伪报成功
**And** 普通退出不删除账号/行程、不取消已受理后台任务、不触发所有设备退出；已有会话删除接口仍需校验 owner，不能依靠客户端目标 id 撤销他人会话

**Given** 持久账号资格已变为停用、删除受理或已删除
**When** 任一设备、实例、刷新链路、受保护 SSE/下载或重新登录尝试继续使用普通账号权限
**Then** 统一认证立即遵守持久资格并使全部普通会话不可用，重启、旧 cookie、延迟回调或相同身份重新登录均不能绕过该屏障或隐式重建原账号
**And** 本 Story 交付并验证账号资格/全会话撤权基础与服务契约，使用受控持久状态 fixture 验收而不依赖未来 7.5 UI；7.5 后续承担原子删除受理、清理与受限状态回执，回执不能变成普通登录凭据

**Given** 已认证或未认证客户端访问既有行程、导入记录、私有媒体、任务与进度入口
**When** 携带有效、过期、伪造或其他 owner 的目标及会话
**Then** 统一身份检查与资源 owner 检查都生效，普通 API、SSE 重连和下载不因另一路径、过期缓存或猜测 ID 漏出私人数据
**And** 重新登录只恢复同 owner 的安全上下文；换账号清理私有状态并丢弃旧响应，不把被拒绝的目标切换到当前账号后继续执行或泄露其是否存在

**Given** 当前宿主使用 cookie 会话认证或第三方重定向回调
**When** 配置 cookie、跨源读取、登录或执行有副作用的请求
**Then** 按真实部署同源/跨源模式设置 httpOnly、HTTPS secure、适用 SameSite/范围/期限，限制可信来源与凭据访问，并为 cookie 认证写入采用可验证的 CSRF/Origin 防护及适用的登录回调关联保护
**And** 不能把 CORS 配置、可预测请求字段或前台隐藏按钮作为唯一授权；令牌型调用只执行其适用的凭据/来源验证，不强套无关 cookie 流程；测试需含被拒绝的跨站及篡改回调路径；WebView、系统认证会话和原生网络不能假定共享 cookie，API/SSE/下载同服从持久会话权威，本地宿主来源不得放宽远程 HTTPS、CORS 或 CSRF

**Given** 真实短信、登录、行为验证或会话服务出现错误验证码、限流、超时、网络中断或凭据失效
**When** 用户发送、验证、重试或恢复登录
**Then** 分开呈现未发送、已发送、等待重试、验证失败与已登录状态，遵守服务端冷却/重试边界，成功发送或打开外部页面不等于登录成功；可恢复失败保留适用输入与返回路径
**And** 不默认放行、无限重试或将第三方失败报成空账号；手机号、OTP、captcha、完整身份票据、cookie、session secret 与原始私人上下文不进入日志/分析/错误正文，动态状态和输入符合既有可访问性要求

**Given** 经真实身份验证的运营者或普通用户访问当前最小桌面 Web 运营入口
**When** 服务端判断查看或修改权限
**Then** 复用同一可信身份基础，由受控服务端授权记录/config 将稳定身份授予明确能力/作用范围，默认无运营权限，每次受保护读写均核对当前授权并在撤权后拒绝旧会话/缓存继续操作
**And** 普通登录、客户端角色字段或知道入口 URL 均不授予运营权；提供可审计的最小授权/撤销配置与否定测试，供地点纠错、品牌规则及 8.3–8.6 各自消费，不另建通用权限平台、移动运营页或等待 8.6 才能保护首个写入口

**Given** Story 1.0 准备关闭并成为后续真实用户功能的认证基线
**When** 执行 OpenAPI/生成类型、迁移与真实 PostgreSQL、认证/身份映射/会话/API/移动与桌面入口测试、完整构建及交接检查，并在实际获准的环境核验真实登录方式/行为验证和服务失败
**Then** 提供有效/伪造身份、测试通道隔离、历史 owner 映射、跨重启/多实例、两设备共存、当前退出、全会话撤权、cookie/CSRF、SSE/私有下载越权及运营授权的独立证据，能够从现有首屏真实登录并读取该 owner 的既有数据
**And** 替身通过、配置存在或合成截图不能替代真实服务与浏览器证据；尚无授权账号/环境时明确列为对应实证未完成，不自行注册、采购或部署。新场景证据不改写历史 done；另提供 Android/iOS 实际安装候选的回调/恢复/退出/撤权/SSE/下载证据且网页回归通过，9.2 最终分发不是本 Story 前置；账号合并、自助解绑、设备中心及 7.5 清理全流程不在本 Story 范围

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C01 — App：App 凭据与会话恢复

**Given** 同一 owner 在网页、Android 与 iOS 拥有独立有效会话
**When** App 冷启动、被杀后恢复、续期、退出或收到账号资格撤销
**Then** API、SSE、私有下载和界面一致服从服务端持久会话权威；当前退出不撤销其他有效设备，账号撤权则阻止全部普通会话
**And** 原生凭据/缓存不会明文落入普通 Web 存储、URL 或日志，迟到响应不能复活旧会话或把 A 的操作提交为 B

#### C02 — App：登录回调与跨宿主返回

**Given** 用户通过已启用的第三方方式开始登录，App 可能在运行或已终止
**When** 系统认证/供应商 SDK 返回成功、取消、重复、过期或篡改结果
**Then** 服务端验证一次性事务与协议适用证明后才建立会话，随后用当前 `/me` 核对身份并恢复获准的原上下文
**And** 拒绝任意返回 URL、跨 owner 延迟回调与重放；回到 App、SDK 成功标志或参数中有 user id 都不是登录证明

#### C03 — App：PNVS 平台边界

**Given** 已登记 H5/Android/iOS 图形方案，当前实际使用的验证码模式明确
**When** 在两个 App 宿主完成短信/图形证明及错误、拒绝、超时流程
**Then** 所用平台配置、SDK/H5 运行模式和后端证明绑定一致，真实服务结果决定会话是否建立
**And** 不因运行在 App 就误用另一平台参数，不将私有服务端 appKey/云凭据打包到客户端，不采用异常放行；网页原流程同步回归

#### C04 — App：U-App 首次真实消费

**Given** 原生统计初始化已满足适用隐私选择且平台 AppKey 正确，或用户拒绝/撤回采集
**When** 执行首次打开、升级后打开、注册、登录、恢复和换账号
**Then** 获准事件可在真实 U-App 环境查询，首次访问/激活/注册/登录分母与去重明确，标识受控绑定稳定 owner 并在退出/换账号正确切断
**And** 拒绝/撤回与 SDK 故障不破坏登录，JS 和 native 不重复上报，未查询到真实事件不得用 wrapper 日志宣称接通

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

#### UI01 — 登录与退出的共享组件回归

**Given** 登录字段、协议入口或当前会话退出确认迁移到Nomad共享组件
**When** 使用网页和支持App执行错误输入、身份重新确认、未知退出结果、键盘/读屏及返回
**Then** 等权入口、真实协议、会话/operation/撤权结果保持，私有页面与portal同步遮蔽，焦点与草稿按原合同恢复
**And** 组件关闭或默认事件不触发重复登录/退出，不把旧浏览器或旧16.0证据当成新依赖验收

### Story 1.1: 登录会话与账号边界（历史已交付）

As a 用户,
I want 安全、可恢复且按 owner 隔离的登录会话,
So that 我的私人旅行数据不会被其他用户或未授权请求访问.

**Requirements:** FR1; NFR3, NFR7; AR1, AR5, AR12

**Acceptance Criteria:**

**Given** 用户通过已交付的手机号登录路径建立会话
**When** 会话被刷新、退出或用于访问受保护资源
**Then** 服务端执行统一会话与 owner 边界检查
**And** token、手机号、原始链接和 Provider secret 不进入安全日志

**Given** 用户请求账号删除或数据导出
**When** 已交付的账号接口完成鉴权
**Then** 请求进入对应服务端流程
**And** 本历史记录不宣称后续 Correct Course 的新增能力已经交付

### Story 1.2: 移动登录首屏（历史已交付）

As a 用户,
I want 清晰且合规的移动登录选择,
So that 我可以在不被意外风控打断的情况下进入应用.

**Requirements:** FR1, FR15, FR16; NFR7, NFR8; UX-DR2, UX-DR3

**Acceptance Criteria:**

**Given** 用户在 iOS 中国区打开登录首屏
**When** Apple、手机号和微信入口可用
**Then** 三个入口按 Apple、手机号、微信等权同尺寸展示
**And** 登录埋点能够区分入口且协议链接可访问

**Given** 默认风险策略未命中异常
**When** 用户请求短信验证码
**Then** 行为验证不主动打断
**And** 仅在风险命中、短信重试或远程高峰策略要求时触发验证

### Story 1.3: 单链接异步导入基线（历史已交付）

As a 用户,
I want 将一条小红书来源异步导入为灵感,
So that 媒体和地点候选能够在不阻塞前台的情况下保存.

**Requirements:** FR4, FR19; NFR1-NFR3, NFR12-NFR14; AR1, AR6, AR11

**Acceptance Criteria:**

**Given** 已登录用户提交一个受支持的小红书链接
**When** 已交付的单链接 ingest job 运行
**Then** job 提供异步阶段、基础 SSE、错误、重试、DLQ、幂等和存储适配器缝隙
**And** 失败可以降级为仅媒体或待定位而不伪造成功事实

**Given** 后续 Story 扩展生产提取能力
**When** 读取本历史完成记录
**Then** 不得把测试替身、旧诊断阶段或适配器缝隙视为真实 VAD/ASR、多模态和完整 AMap 验收

### Story 1.4: 首页统一输入与灵感库基线（历史已交付）

As a 用户,
I want 从同一个首页输入旅行想法或查看已保存灵感,
So that 我可以从想法或已有内容开始规划.

**Requirements:** FR2, FR3, FR5, FR6, FR17, FR20; NFR8; UX-DR1, UX-DR4

**Acceptance Criteria:**

**Given** 用户进入已交付的 Home/Library 体验
**When** 用户切换计划与灵感、打开城市目的地或提交自然语言
**Then** 首页提供统一入口、城市聚合灵感和待定位 Top-5 基线
**And** 自然语言可以产生规划参数并进入后续路径

**Given** 输入无法可靠分类
**When** 系统要求用户澄清
**Then** 使用不遮挡主要上下文的二选一 Sheet
**And** Library 收藏不被静默解释为 required 或 along-route

### Story 1.5: 设置、反馈与账号入口基线（历史已交付）

As a 用户,
I want 在设置中找到账号、AI 使用状态和反馈入口,
So that 我可以管理数据并在遇到问题时获得帮助.

**Requirements:** FR12, FR25, FR45; NFR7, NFR15, NFR16; UX-DR31

**Acceptance Criteria:**

**Given** 用户打开已交付的设置页
**When** 查看账号、AI 用量、数据导出、删除账号或反馈入口
**Then** 对应入口清晰可达
**And** MVP 主路径不要求配置 BYOK 或暴露 Provider 名称

**Given** 反馈 WebView 无法加载或禁止内嵌
**When** 用户仍需要提交反馈
**Then** 可以回退系统浏览器或内置最小表单
**And** 仅传递完成反馈所需的最小用户数据

### Story 1.6: 首页多链接导入队列与诚实状态展示

As a 旅行者,
I want 在同一个首页输入组件中批量提交链接并查看真实队列状态,
So that 我可以持续添加灵感而不会丢失正在处理的导入.

**Requirements:** FR2, FR3, FR17-FR19; NFR2, NFR8; AR1-AR3, AR6, AR15,
AR17, AR20; UX-DR3-UX-DR5, UX-DR32, UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** HomeImportDock 中一次粘贴包含多个受支持链接和无效片段
**When** 用户提交输入
**Then** 客户端按出现顺序为每个有效链接调用一次现有单链接 ingest API
**And** 对应批次只用一条中性行内说明 `已添加N个链接，部分内容未识别`，N 取真实受理的有效链接数；未识别片段与原因在当前批次或相关记录按需展开，不丢弃有效链接、不抢焦点，也不创建第二个输入 surface

**Given** 一个或多个导入 job 正在处理
**When** 用户查看展开或紧凑队列
**Then** 当前项显示安全截断的来源标题、当前事实动作和批次内 `N/X`
**And** 状态只映射为获取内容、理解图文、验证地点、保存灵感或明确失败，不显示百分比、虚假进度条或内部 Provider 名称

**Given** 多个 job 可以并行完成
**When** 当前完成结果进入展示窗口
**Then** 该结果连续显示完整 10 秒
**And** 后续完成结果按 FIFO 等待各自窗口，运行状态更新不得抢占当前完成结果

**Given** 队列正在运行或已有结果等待展示
**When** 用户继续输入新内容
**Then** 原长输入框保持可编辑并将新 job 追加到呈现状态
**And** 占位文案保持 `粘贴分享链接或输入想去的地点，如：厦门 3天`

**Given** 输入框为空或包含内容
**When** composer 状态变化
**Then** 强调按钮分别显示 `+` 或发送图标，并在 120-180ms 内过渡
**And** reduced-motion 模式直接替换图标；展开态使用向下 chevron，紧凑态使用向上 chevron

**Given** 输入是旅行自然语言而非链接
**When** 系统可靠识别目的地、天数或日期
**Then** Dock 显示类似 `识别 厦门 3天 7月14日出发` 的事实摘要并沿现有路径进入 S2
**And** 不提前展示或确认 pace；无法分类时仍使用现有二选一 Sheet

**Given** 前台连接中断、job 返回可重试失败或终止失败
**When** 用户重连、重试或确认失败
**Then** UI 保留 composer、队列顺序和最后已确认状态，并从现有 job 状态对账而不重复提交
**And** 可重试与终止失败提供不同的诚实动作，真正终止时在对应项显示 `这条导入未完成`；仅在部分内容真实保存后显示 `部分内容已保存`，具体原因进入相关记录，不影响其他任务或堆叠弹窗；跨服务进程的 durable cursor 不作为本 Story 完成声明

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 HomeImportDock
**When** 使用添加、发送、展开、收起、重试和队列状态
**Then** 所有动作具备至少 44pt 目标、标签、角色、焦点可见性和简洁 live-region 更新
**And** 图片计数变化不造成连续读屏噪音或布局跳动

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

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

#### UI02 — Home组件迁移不改变导入与恢复语义

**Given** HomeSheet、composer控件或队列状态迁移到共享组件且存在运行/恢复中的原任务
**When** 打开关闭Sheet、输入中文、后台恢复、切换身份或读取持久operation回执
**Then** 原单一输入、受理计数、FIFO完整可见窗口、operation身份、owner隔离及持久恢复结果保持
**And** 不自动重交未知写入、不重置ACK/已展示标记、不自动读取剪贴板，状态和焦点证据绑定本次组件源码

### Story 1.7: 可跨重启恢复的导入进度

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

### Story 1.8: Owner 导入记录与版本化去重

As a 旅行者,
I want 查看自己导入过的来源并避免重复处理同一链接,
So that 我可以追溯灵感来源而不会看到或影响其他用户的记录.

**Requirements:** FR5, FR6, FR18.1, FR20; NFR3, NFR20; AR5, AR12,
AR14, AR15, AR20; UX-DR3, UX-DR6, UX-DR32
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 首次提交一个通过校验的小红书 URL
**When** 服务端创建 ingest job
**Then** 同一事务中创建 owner-scoped ImportRecord，并保存 normalization version、normalized URL、受保护原始 URL、来源标题和当前状态
**And** record 在 job 运行、失败或完成期间保持同一稳定标识，不等待成功后才出现

**Given** 输入 URL 包含受支持短链、canonical 变化或已知追踪参数
**When** normalization policy 处理 URL
**Then** 按版本化、可测试的规则展开或规范化 scheme、host、path 和允许移除的参数
**And** 记录保存实际使用的 policy version；未知或无法安全展开的形式不得被猜测成另一个 canonical URL

**Given** 同一 owner 并发提交两个按当前 policy 等价的 URL
**When** 数据库提交 record/job 创建
**Then** `(user_id, normalized_url)` 的持久唯一性只允许一份 ImportRecord
**And** 竞争请求返回同一记录及其权威 job 结果，而不是依靠客户端检查或产生重复计算

**Given** owner 再次提交已有等价 URL
**When** 现有记录处于运行、完成或失败状态
**Then** 运行中返回现有进度入口并就近显示 `正在导入`，完成态返回明确 duplicate 结果并显示 `已在灵感库` 与原记录查看入口，失败态返回针对原记录的显式重试动作；运行/已完成重复项不另作失败提示
**And** 重试使用可审计的新 attempt 或 job 语义，但不创建第二份 owner ImportRecord

**Given** normalization policy 后续升级
**When** 读取旧记录或处理新提交
**Then** 旧记录保留创建时的 normalized URL 与 policy version，不被后台静默重写
**And** 跨版本重新归一、合并或迁移必须是独立、可回滚且处理冲突的显式操作

**Given** 两个不同用户提交相同或等价的来源 URL
**When** 各自查看、重试或删除导入记录
**Then** 每个用户拥有独立的 ImportRecord、job 引用、状态和删除语义
**And** API、错误和 duplicate 结果不泄露另一用户是否导入过、解析结果、标题或批注

**Given** owner 打开 Library 的导入记录列表
**When** 列表加载成功
**Then** 每项显示来源标题、运行/失败/完成状态、已解析 POI 摘要和待定位状态
**And** 列表响应不返回受保护原始 URL，空列表、加载、重试失败和已删除状态均有明确移动端表现

**Given** owner 打开一条 ImportRecord 详情
**When** 服务端完成 owner 鉴权
**Then** 详情返回该记录的解析 POI、待定位结果、来源状态以及可复制的原始 URL
**And** 原始 URL 只在该详情边界按最小字段返回，复制按钮具备紧凑图标、44pt 目标和读屏标签

**Given** 未登录或非 owner 请求 ImportRecord 列表、详情、原始 URL、重试或删除
**When** 服务端执行查找
**Then** 在载入受保护字段或关联解析结果前拒绝访问，并使用中性的标准不可用响应
**And** UUID、normalized URL、job id、缓存命中或共享媒体指纹都不能作为授权证明

**Given** 平台已有或未来加入跨用户计算、媒体指纹或对象复用
**When** ImportRecord 引用共享对象
**Then** 每个 owner 仍有独立 ACL、引用计数/生命周期和删除语义
**And** 本 Story 不要求实现跨用户复用，但任何现有复用不得成为读取他人记录或删除共享对象的路径

**Given** Story 1.8 准备关闭
**When** 运行 OpenAPI/生成类型、Prisma migration、URL normalization fixture、并发唯一性、owner 越权、重试/删除、真实 PostgreSQL 和 Library 移动/桌面浏览器测试
**Then** 所有状态、隐私边界、短链/追踪参数/canonical 变体和数据库竞争检查通过
**And** POI 提取质量、视频理解、BusinessArea 与完整 AMap 事实不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 1.9: 生产级图文多模态理解与证据

As a 旅行者,
I want 系统可靠理解图文笔记中的地点和作者评价,
So that 导入的灵感能够成为可追溯的规划输入而不只是保存媒体.

**Requirements:** FR4, FR6, FR14, FR28.1; NFR1, NFR3, NFR12-NFR14,
NFR17, NFR20, NFR21; AR5, AR6, AR11-AR15, AR20; UX-DR5, UX-DR6,
UX-DR31

**Acceptance Criteria:**

**Given** owner 的 ImportRecord 指向一条受支持的图文笔记
**When** 生产采集适配器获取来源内容
**Then** Nomad 仅通过独立 HTTP 服务消费标题、正文、图片元数据和受控媒体流
**And** 不嵌入第三方采集器 GPL 代码；采集超时、许可限制或不可用返回类型化事实状态

**Given** 来源图片尚未进入 Nomad 管理的存储
**When** ingest 需要持久化或向多模态 Provider 提供媒体
**Then** 图片被复制到 owner-safe 的私有 COS 对象并通过短期签名 URL 访问
**And** 来源热链不能成为持久读取路径；部分复制失败记录到单项媒体状态且不伪造完整成功

**Given** 标题、正文和至少一个可用图片准备完成
**When** 多模态提取开始
**Then** 单一当前流程同时使用文本与图片并写入 `multimodal` 诊断阶段
**And** 不按低置信结果恢复 `text -> OCR -> VLM` 阶梯，也不由新流程写入旧诊断值

**Given** 多模态 Provider 返回有效结构化结果
**When** 服务端验证并持久化输出
**Then** 每个地点候选包含候选名称、可选作者评价线索、引用到具体文本或图片的 evidence、source attribution、质量、置信度和 observed_at
**And** 引用关系可追溯到 owner 的 ImportRecord 与受保护媒体，但前端响应不暴露 Provider 内部载荷或 secret

**Given** 内容暗示预约、票务、dawn、sunset、night、night-market 或玩法兴趣
**When** 提取器形成 EvidenceSignal 或 InterestSignal
**Then** 信号携带 source reference、质量、置信度、时间和 `inferred` 状态
**And** 推断不得显示为已预约、已购票或用户确认，也不能成为不可变 planning lock 或覆盖显式用户约束

**Given** 某个地点只有模糊名称、相互冲突证据或低于可配置质量阈值
**When** ingest 保存提取结果
**Then** 保留可用媒体和 evidence，并将地点明确标为待定位或低置信候选
**And** 不编造标准 POI、地址、坐标、营业时间、评分或作者未表达的评价

**Given** Provider 超时、返回无效 schema、触发额度或熔断，或者部分媒体不可读
**When** 当前 attempt 无法形成可靠提取
**Then** 服务端执行有上限且幂等的重试/回退策略，并记录安全错误代码、成本带和可重试性
**And** 最终降级为已保存媒体加待定位或明确失败，不创建第二套用户流程或要求 BYOK

**Given** 本 Story 首次引入生产多模态调用
**When** ProviderGateway 执行请求
**Then** 最小任务路由、并发/速率限制、token 与媒体上限、超时、成本 guard、熔断和远程 kill switch 同步生效
**And** Langfuse/Sentry/日志只记录脱敏摘要、prompt version、attempt、ImportRecord/job correlation、耗时、用量和结果质量，不记录原始 URL、完整私人输入或 Provider secret

**Given** 相同 ingest attempt 因队列重投、HTTP 重试或 worker 恢复被再次执行
**When** 输出针对同一 input/policy/prompt version 提交
**Then** 持久化使用幂等 attempt 身份，不重复创建 Inspiration、EvidenceSignal、媒体引用或计量记录
**And** 明确的新重试保留旧 attempt 审计，并只由当前 fenced attempt 发布 record 结果

**Given** owner 在 Library 查看图文 ImportRecord
**When** 图文提取完成、部分降级或失败
**Then** UI 继续使用现有记录详情展示解析地点、待定位和来源状态；实际部分保存只在对应记录显示一条中性 `部分内容已保存`，真正终止则显示 `这条导入未完成`，原因与可用内容进入该记录按需查看，不把部分保存表示为完整提取成功或影响其他任务
**And** 只展示有权且可解释的结果，不出现模型名、内部置信度调试数据或虚假的实时处理百分比

**Given** Story 1.9 准备关闭
**When** 运行 schema/adapter/幂等/降级/隐私单元测试、OpenAPI 与生成类型、厦门图文 fixture 的真实采集/Provider/COS/现有 GeoResolver staging、Library 浏览器检查、完整构建和 diff 检查
**Then** 地点候选、评价线索、证据引用、推断信号、私有媒体、成本和失败状态均可验证且无敏感信息泄露
**And** 视频抽帧、VAD/ASR、完整 AMap 字段、复杂分店消歧和 BusinessArea 不被标记为本 Story 已交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 1.10: 自适应与局部二次抽帧的视频理解

As a 旅行者,
I want 系统理解视频中的画面与有效语音并跳过无意义的处理,
So that 视频灵感能够被可靠提取而不会浪费大量额度.

**Requirements:** FR4, FR19; NFR2-NFR5, NFR12-NFR14, NFR17, NFR21;
AR5, AR6, AR11-AR15, AR20; UX-DR5, UX-DR31

**Acceptance Criteria:**

**Given** owner 的 ImportRecord 包含一段受支持视频
**When** worker 准备媒体
**Then** 从生产采集适配器读取可信时长、音轨、编码和媒体大小，并应用可配置下载、解码、CPU、内存与处理时限
**And** 不可信、超限或损坏媒体返回类型化降级，不阻塞已取得的标题、正文或其他可靠证据

**Given** 视频时长和媒体状态有效
**When** 执行第一轮关键帧采样
**Then** 版本化策略对不超过 30 秒的视频使用高于长视频的采样密度，并对长视频使用较低密度
**And** 两类策略都声明采样间隔/密度、最大帧数、最大像素/字节和成本预算，使固定 fixture 的选择可重复测试

**Given** 第一轮多模态理解判断某个画面含有相关信息但上下文不完整
**When** 模型请求查看该画面附近内容
**Then** 只接受包含 source timestamp、缺失原因、邻近时间窗口和期望观察目标的类型化 resample request
**And** 模型不能直接执行媒体命令、指定任意文件路径或绕过服务端策略

**Given** 服务端收到合法的局部 resample request
**When** 请求位于视频边界内且未超过配置的局部窗口、采样密度、最大附加帧数、轮次和总成本预算
**Then** worker 在目标时间点附近进行更高密度的第二轮抽帧，并把新增帧连同 pass/window/timestamp provenance 送回同一 fenced attempt
**And** 重叠或相邻请求先合并去重；缓存键包含内容指纹、策略版本和规范化窗口，避免重复解码与计费

**Given** 局部二次抽帧请求越界、重复、理由无效或超过轮次/预算
**When** 服务端评估请求
**Then** 拒绝额外处理并记录安全的预算或策略原因
**And** 若现有证据仍不完整，结果明确标为 partial/low-confidence 或待定位，不循环抽帧、不编造完整结论

**Given** 视频包含音轨
**When** ASR 决策开始
**Then** 始终先执行语音检测并区分可靠人声、静音/仅 BGM 和无法可靠判断
**And** 静音或仅 BGM 明确跳过 ASR；可靠人声只对检测到的有效片段执行 ASR；未知状态只能按有界降级策略处理

**Given** VAD 识别出一个或多个可靠语音片段
**When** ASR 成功返回 transcript
**Then** 每段文本保留视频起止时间、语言/质量状态、source reference 和 observed_at
**And** transcript 不被表示为作者原文保证；低质量或冲突语音保持明确降级

**Given** 标题、正文、第一轮帧、可选局部二次帧和可选 transcript 已准备
**When** 调用 Story 1.9 建立的统一多模态证据流程
**Then** POI 候选、作者评价和推断信号可以引用具体文本、帧 pass/timestamp 或语音时间段
**And** 未执行的 ASR、缺失模态和局部补帧原因在证据质量中保持可见，不制造完整覆盖假象

**Given** frame extraction、VAD、ASR 或一次多模态 round 失败
**When** 仍存在其他可靠模态
**Then** attempt 保留可用证据并按 modality 标记部分失败，必要时进入仅媒体加待定位
**And** 重试有上限、幂等且受当前 attempt fencing 约束，不创建第二份用户结果

**Given** 视频处理阶段发生变化
**When** durable ingest event 被追加
**Then** 使用 `media_prep | speech_detect | frame_extract | asr | multimodal` 子阶段，并在事实 payload 中记录可选 pass/window、帧数和 skip reason
**And** 二次抽帧仍属于 `frame_extract`/`multimodal` 的有界迭代，不引入虚假百分比或新的用户工作流；前台沿用对应导入记录的一条中性状态，实际部分保存为 `部分内容已保存`，真正终止为 `这条导入未完成`，具体模态/失败原因按需展开，不打断其他导入

**Given** 视频任务完成、跳过或降级
**When** 观测系统记录该 attempt
**Then** 指标包含视频时长带、初次/附加帧数、二次抽帧触发与拒绝原因、VAD 分类、ASR 处理/跳过时长、缓存命中、耗时和成本
**And** 日志、Sentry、Langfuse 和分析不包含原始 URL、完整 transcript、未脱敏帧、精确私人输入或 Provider secret

**Given** Story 1.10 准备关闭
**When** 使用厦门及合成 fixture 覆盖短视频、长视频、信息不完整触发局部二次抽帧、重叠窗口、预算耗尽、静音、仅 BGM、人声、损坏媒体和部分模态失败，并运行真实采集/VAD/ASR/Provider staging、完整构建与 diff 检查
**Then** 短视频帧密度、局部补帧边界、跳过成本、时间戳证据、幂等缓存和诚实降级均可重复验证
**And** 完整 AMap 标准化、分店消歧和 BusinessArea 不被标记为本 Story 已交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 1.11: 高德 POI 验证、分店消歧与运营手工纠错

As a 旅行者与获授权运营者,
I want 导入地点经过可靠的高德匹配与分店确认，并能有依据地纠正错误地点资料,
So that 后续规划不会使用错误地址、错误分店或编造的地点事实.

**Requirements:** FR4, FR4.1, FR4.2, FR5, FR20; NFR1, NFR3, NFR7, NFR12,
NFR17, NFR21, NFR23; AR5, AR10-AR15, AR20; UX-DR6, UX-DR15,
UX-DR33

**Amendments:** CE-01于2026-09-14补品牌规则维护闭环；2026-09-15用户在额外运营工具中只保留手工纠错地点，本Story补7组GWT（15→22），不等待8.6或建立通用后台。

**Acceptance Criteria:**

**Given** Story 1.9 或 Story 1.10 产生一个包含来源城市、上下文和证据的地点候选
**When** ingest 进入地点标准化阶段
**Then** 服务端使用候选名称、来源城市、上下文地点和可用证据查询 AMap 适配器
**And** 在得到可审计的验证结果前，该候选只能保持待验证/待定位状态，不能成为可规划的 CanonicalPOI

**Given** AMap 返回唯一且超过版本化匹配阈值的高置信结果
**When** 服务端持久化验证结果
**Then** 创建或复用 CanonicalPOI，并保存 Provider ID、标准名称、文字地址、坐标、可用营业时间、评分、人均、电话和分类
**And** 每项外部事实保留来源、observed_at、新鲜度和质量状态，匹配策略与阈值版本可被审计

**Given** AMap 对某些标准字段没有返回值、返回冲突值或值已超过可配置新鲜度
**When** CanonicalPOI 被保存或读取
**Then** 缺失或不可靠字段保持 null、unknown 或 stale，并按字段策略决定是否刷新
**And** 服务端不得从模型、旧文案或相邻地点猜测 AMap 地址、坐标、营业时间、评分、人均或电话

**Given** 操作者具有服务端授予的品牌规则维护权限
**When** 在桌面Web查看、新增、修改或停用连锁品牌抑制规则
**Then** 在Story 1.11内提供实际可用的最小维护入口和持久草稿，服务端验证会话、读写权限、规则字段与作用范围，普通用户不可访问
**And** 保存草稿不改变当前生效规则；失败保留输入，不接受任意脚本/网络地址或客户端角色证明，不等待8.3/8.6或新建通用后台才可维护

**Given** 品牌规则草稿已保存且通过有界格式/匹配检查
**When** 获授权操作者基于预期当前版本确认发布，或查询/重试同一发布操作
**Then** 原子保存不可变规则版本、生效指针与包含操作者/时间/前后版本/结果的审计回执，以幂等operation ID恢复未知结果；并发冲突保留原规则并要求重新核对
**And** 每个ingest/geo attempt首次使用时固定确切规则版本，分店查询、筛选和重试不混用版本；发布对后续首次使用生效，热更新验证实际加载/使用，过期或缺少所需版本时有界等待/失败而不猜测，且不回写已完成的导入结果或标准POI

**Given** 操作者具备Story 1.0提供的真实运营身份及服务端地点纠错权限
**When** 在桌面Web选择一个已有CanonicalPOI并编辑其显示名称、文字地址或同城坐标
**Then** 读取原始高德快照与当前人工覆盖，保存带修改理由/依据引用的持久草稿，字段前后值清晰可查看
**And** 普通用户、无权环境和失效会话被服务端拒绝；不读取无关owner导入原文，不新建地点合并/别名/近邻/通用黑名单/任意重跑入口，品牌规则能力继续独立保留

**Given** 地点纠错草稿包含人工输入或位置调整
**When** 执行发布前检查
**Then** 校验允许字段、非空/长度、坐标范围与坐标系、同城及同一门店身份、依据和预期当前版本，展示差异及对后续查询/新任务的影响
**And** 不允许改Provider ID、城市或分店身份、改成另一个地点、合并记录或借任意JSON/脚本/URL自动抓取绕过检查；营业/评分/价格/电话等非本次允许字段保持原事实或未知，不从名称/坐标纠正推断它们

**Given** 地点纠错草稿通过检查且操作者明确确认差异
**When** 服务端基于预期当前地点事实版本与幂等operation ID发布
**Then** 原子保存不可变人工修正版本、生效引用和操作者/时间/理由/前后差异/结果审计回执，成功后才报告已发布
**And** 原始Provider快照保留，修改字段标为人工来源而非高德返回；并发Provider刷新/人工提交使基准失效时保留草稿并重新检查，不部分发布

**Given** 地点修正发布遇到失败、网络断开、重复提交或响应丢失
**When** 操作者查看状态或重试
**Then** 先按原操作身份恢复真实回执，已知失败保留原生效版本及草稿，相同操作不创建重复修正
**And** 结果未知不报成功/失败或盲目重发；撤权后的读取/写入被拒绝，列表/详情迟到响应不得越过当前权限或版本

**Given** 已发布人工修正与高德后续刷新共同存在
**When** 读取新的有效地点资料
**Then** 同一地点按明确的字段覆盖规则生成版本化有效事实：人工覆盖字段由其修正版本提供，其他字段取合法Provider快照并保留未知/新鲜度状态
**And** Provider刷新不静默清除人工覆盖，不混用不同版本坐标/地址；公共地点详情可按字段查看人工修正来源与时间，不公开操作者身份/内部备注或借此增加普通卡片质量徽章

**Given** 新查询、新任务或执行中的ingest/规划/导出读取地点与路线
**When** 地点修正刚发布或缓存命中
**Then** 新消费者首次使用时固定完整地点事实版本，路线缓存按端点事实版本隔离；已固定快照的任务沿原版本完成，过期或缺失所需事实时按已有合同恢复/失败
**And** 不自动重跑导入/规划，不改写已完成ImportRecord、已发布Plan/Trip/酒店/路线/导出快照；用户后续采纳更新仍走其原本的预览/确认/校验/版本流程

**Given** 操作者需要撤销一项人工覆盖或再次纠正
**When** 查看最新原始事实和修正差异并明确确认
**Then** 以新的修正版本和原子回执解除选定人工字段或替换覆盖值，检查仍基于当前事实/权限，完整审计保留
**And** 不是删除历史或回滚用户行程；恢复字段无可靠Provider值时保持未知，不把旧过期值宣称最新，也不撤销其他人的后续改动

**Given** 候选可能是连锁品牌或无法确定具体分店
**When** 服务端应用可编辑且有审计记录的连锁品牌抑制规则
**Then** 一次消歧最多向后续匹配流程提供 20 家 AMap 分店，该上限可配置但默认不得超过 20
**And** 品牌泛称不能被静默保存为任意分店，检索数量、裁剪原因和最终状态均可观测且不暴露给普通用户

**Given** 分店消歧拥有来源证据支持的可靠主 POI 坐标
**When** 对最多 20 家候选分店执行地理裁剪
**Then** 仅保留主 POI 2km 内的分店进入排序和待定位流程
**And** 若没有可靠中心点，则不强行应用 2km 规则或自动选中最近分店，而是保留诚实的歧义状态

**Given** 匹配低于自动确认阈值、多个结果冲突或分店仍不确定
**When** owner 在灵感库打开该待定位条目
**Then** 返回最多 5 个候选，每项只显示名称与文字地址中的商圈/地标上下文
**And** 不展示内部置信度、评分、距离、预计时长、虚构通勤或暗示系统已替用户确认的状态

**Given** owner 从 Top-5 中明确选择一个地点
**When** 服务端完成 owner 鉴权并提交选择
**Then** 选择以幂等、可审计的 user-confirmed evidence 写入并关联对应 CanonicalPOI
**And** 非 owner、过期 revision 或已被新 attempt 替代的选择不能覆盖当前结果

**Given** 不同导入记录或不同用户验证到同一个 AMap Provider ID
**When** 服务端解析 CanonicalPOI 身份
**Then** 按 Provider 与 Provider ID 复用标准 POI，而不是创建语义重复的地点事实
**And** 用户的 ImportRecord、来源证据、批注、选择状态和删除语义继续 owner 隔离，不因标准 POI 复用而互相可见

**Given** AMap 配额耗尽、超时、熔断、返回歧义或暂时不可用
**When** 当前验证 attempt 无法形成可靠匹配
**Then** 保留已取得的媒体、文本、地点候选与 evidence，并进入可重试的待定位或类型化失败状态
**And** 不创建伪造 CanonicalPOI、不丢失 owner 记录，也不让外部服务失败阻塞其他已验证灵感

**Given** 普通行程卡片展示一个已验证地点
**When** 客户端渲染卡片标题
**Then** 使用该读取/计划快照绑定的有效地点名称：默认高德标准名，存在获授权人工修正时按其字段版本取值；不在每张普通行程卡增加高德Logo、Provider名或质量徽章
**And** 合同、法律或 Provider 规则要求的归属信息只在实际需要的地图、地点详情或法律信息界面按适用规则统一呈现，不重复污染普通行程卡

**Given** AMap 验证在生产环境运行
**When** 适配器读取缓存、发起调用或记录观测
**Then** 缓存键包含 Provider、规范化查询和策略版本，并执行 TTL/事实新鲜度、调用配额、并发限制、超时、重试预算与熔断策略
**And** 日志、Sentry、Langfuse 和指标只记录脱敏查询摘要、结果数量、状态、耗时、缓存命中与错误代码，不记录受保护原始 URL、私人证据全文、手机号或 secret

**Given** AMap 原始结果包含未经当前架构规则规范化的商圈文字
**When** Story 1.11 发布验证结果
**Then** 可以将原始商圈文字作为带来源的地点事实保存，但不得把它声明为可靠 BusinessArea membership
**And** Epic 6 的商圈美食召回仍需独立的 BusinessArea 规范化与可靠性策略，本 Story 不提前交付该能力

**Given** Story 1.11 准备关闭
**When** 使用普通地点、连锁品牌、具体分店、20 家上限、有/无可靠中心、歧义 Top-5、关闭地点、字段缺失、缓存陈旧、配额/超时和越权 fixture，并运行 OpenAPI/生成类型、Prisma migration、真实 PostgreSQL、厦门 AMap staging、移动端普通卡片与待定位 Sheet、完整构建和 diff 检查
**Then** 自动匹配、用户确认、标准POI复用、事实新鲜度、隐私降级和普通卡片边界可验证；品牌规则与手工地点纠错均有真实桌面Web、权限、草稿/检查/并发发布/未知回执、撤销覆盖及固定版本证据
**And** 增加人工纠错与Provider刷新竞争、字段来源、跨城/换门店拒绝、路线缓存版本、旧任务/已发布行程不变的真实PG/API/浏览器验收；连锁聚合展示、BusinessArea召回与其他通用后台不算本Story交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 2: 从约束与灵感生成完整单城计划

用户可以用移动端短流程确认时间、逐晚住宿、地点意图和节奏，并在一个稳定的
时间轴中获得完整、诚实、可直接编辑的单城计划。

**Numbering note:** Story 2.0/2.1 只保留既有交付历史，不能作为 corrected target
的执行规格。旧 Story 2.2 将以 `legacy_story_id` 迁入 Epic 3，其编号不在本 Epic
复用；当前新增执行工作从 Story 2.3 开始。

### Story 2.0: Confirm 与 Planner Picker 基线（历史已交付）

As a 旅行者,
I want 既有 Confirm 与 Picker 交付历史被准确保留,
So that 新规划流程可以复用有效代码而不会把旧产品语义误报为当前完成态.

**Requirements:** AR1; historical delivery reference only

**Acceptance Criteria:**

**Given** 已完成的 Story 2.0 artifact、验证记录和 Git 历史存在
**When** 团队审计 brownfield 规划基线
**Then** 保留旧 Confirm、Picker、地图/列表联动、零选择和计划生成入口的实际交付记录
**And** 不回写或删除其历史状态，也不把后续 corrected target 伪装成过去已经完成

**Given** 旧实现使用 `selected_required`、参数 Sheet 和旧 CTA 流程
**When** Sprint Planning 或开发代理选择当前执行规格
**Then** 这些行为只被视为兼容与迁移输入，不能作为当前 S2-S5 或三态 Picker 的验收依据
**And** 当前 FR26-FR31、FR44-lite 与相关 UX-DR 必须由本 Epic 后续可执行 Story 明确关闭

### Story 2.1: Quick/HQ 日计划基线（历史已交付）

As a 旅行者,
I want 既有日计划引擎的交付历史被准确保留,
So that 新的单一规划流程可以在可复用能力上演进而不重新实现已存在的基础设施.

**Requirements:** AR1; historical delivery reference only

**Acceptance Criteria:**

**Given** 已完成的 Story 2.1 artifact、验证记录和 Git 历史存在
**When** 团队审计现有 Planner 能力
**Then** 保留 Quick/L2、候选、hotel slot 和 Planner 基础合同的实际交付记录
**And** 已通过的 owner、幂等、测试与数据边界可以作为后续实现的 brownfield 基线

**Given** 旧实现包含 Quick/HQ 双版本、部分骨架、seed UI 或切换采用语义
**When** 当前产品目标生成或展示一次 AI 规划
**Then** 这些行为不得被当作当前可见流程的验收标准或继续扩展的目标
**And** FR7、FR32-FR34、FR36、FR41、FR49 与 FR51 仍须由本 Epic 后续可执行 Story 交付并验证

### Story 2.3: 单城旅行时间与边界确认

As a 旅行者,
I want 用移动端短流程确认旅行日期、每天出门时间和首尾日边界,
So that AI 能知道每天真正可用于游玩的时间，而不编造交通信息.

**Requirements:** FR14, FR26, FR27, FR27.1 (time core), FR49; NFR8,
NFR23; AR1-AR5, AR11, AR15, AR17, AR20; UX-DR2, UX-DR3, UX-DR7,
UX-DR8, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 用户从 Home 自然语言、目的地卡或已导入灵感开始单城规划
**When** 应用建立或恢复 planning draft
**Then** 首先进入 S2 `旅行时间`，并保留 city、start、days、source、可选 rec_id 与 place hints
**And** 灵感来源不能绕过 S2/S3；历史 `/planner/pick` 深链缺少 S2 输入时必须先由 input guard 补齐

**Given** 用户打开 S2
**When** 页面渲染当前单城 draft
**Then** 只显示目的地、整体旅行日期与天数、`每天几点出门`、到达边界和离开边界
**And** 不重复显示已选地点、住宿、节奏、玩法、门票或特殊时段，也不在本页显示 `开始规划`

**Given** 用户编辑旅行日期或每天出门时间
**When** 输入通过本地与服务端校验
**Then** 保存连续且合法的日期范围、由该范围派生的天数，以及一个合法的本地 `HH:mm` 每日出门时间
**And** 日期变化使用确定性的 reconciliation 结果标记后续住宿/选择草稿中需重新确认的字段，而不是静默截断或保留越界数据

**Given** 到达或离开边界仍处于 untouched 初始态
**When** 用户尝试进入下一阶段
**Then** 下一步保持禁用并说明需要主动选择边界处理方式
**And** `具体时间`、`大概时段（2小时）` 或 `交给 AI 安排` 均是有效确认，未触碰的空值不是

**Given** 用户为某个边界选择 `具体时间`
**When** 使用本 Story 的手工路径提交交通方式、日期、时间、地点和可选班次号
**Then** 服务端保存 provider-neutral、source=`user_provided` 的边界事实，并使用已有 AMap 搜索能力匹配 terminal/地点或明确保留低置信手填地点
**And** 手工输入不得显示成已查询、已购票、实时确认或 Provider 保证；自动航班/铁路识别不属于本 Story

**Given** 用户为某个边界选择 `大概时段（2小时）`
**When** 选择日期与窗口起点
**Then** 系统保存一个连续 120 分钟的起止窗口，日期必须位于对应旅行边界允许范围内
**And** 到达与离开可以独立使用不同模式，窗口不能被转换成虚构班次、terminal 或票务状态

**Given** 用户为某个边界选择 `交给 AI 安排`
**When** 保存 S2 draft
**Then** 只持久化显式 `ai_decide` 模式，不要求用户填写班次、地点或具体时间
**And** 后续 Planner 只能据此形成可编辑的 provisional 首末日可用时间，不得编造航班、车次、航站楼、车站或购票事实

**Given** 日期、具体时间或 2 小时窗口彼此矛盾
**When** 客户端或服务端检测到越出旅行范围、离开早于到达、窗口长度错误或非法本地时间
**Then** 使用同一类型化字段错误阻止继续并将焦点返回第一个问题字段
**And** 已合法填写的另一边界与日期草稿保持不变，不以重置整页作为错误恢复

**Given** owner 在 S2 返回、刷新、重新登录、从深链恢复或遇到弱网
**When** planning draft 被重新读取或提交
**Then** 服务端按 owner、expected revision 和幂等命令恢复最后确认的字段，客户端不依靠组件局部布尔值重建事实
**And** stale revision 提供可理解的重新载入路径，任何响应、日志或分析不包含完整私人行程文本、token 或 Provider secret

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 S2 与 Boundary Sheet
**When** 选择日期、滚动时钟、切换三种模式、手工填写或返回
**Then** 控件具备至少 44pt 目标、标签/角色、焦点 containment/return、非纯颜色状态和键盘安全的底部 CTA
**And** Sheet 动效、错误 live region、长地点名称和最小支持宽度均符合移动端基线且不产生卡片套卡片

**Given** Story 2.3 准备关闭
**When** 运行 OpenAPI/生成类型、PlanningDraft migration、owner/revision/幂等、日期与 chronology、三种边界模式、深链 guard、弱网恢复、移动端与桌面浏览器检查、完整构建和 diff 检查
**Then** S2 可以独立收集并恢复诚实的单城时间约束，已有 Home、Picker 和旧 Planner 基线无回归
**And** 自动航班/铁路查询、多城市边界、逐晚住宿、Picker corrected target 与单一完整规划不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.4: 统一班次识别与航班/铁路查询

As a 旅行者,
I want 在同一个输入框填写航班号或车次并获得可核查的班次信息,
So that 我不必先理解交通分类，查询失败时也仍能完成首末日时间确认.

**Requirements:** FR14, FR27.1 (exact flight/rail lookup); NFR1, NFR3,
NFR12, NFR17, NFR23; AR2-AR5, AR11, AR13-AR15, AR20; UX-DR3,
UX-DR7, UX-DR8, UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 用户在 S2 的 `具体时间` 模式打开班次输入
**When** 输入航班号或铁路车次
**Then** 使用同一个输入框接收并规范化大小写、空格以及可安全移除的 `航班`/`次` 文案
**And** UI 不要求用户先选择飞机或火车，但允许在结果歧义或识别错误时明确改选交通类型

**Given** 规范化后的班次字符串准备分类
**When** 版本化 classifier 计算候选类型
**Then** 铁路候选使用可维护的客运车次规则与 Provider 能力，不把规则硬编码为只有 G/D/Z/T，也覆盖 C、K、S、Y、纯数字及配置中支持的其他类型
**And** 航班候选使用有版本和新鲜度的航司 designator registry，支持字母+字母、字母+数字或数字+字母二字码以及后续 3-4 位航班数字和 Provider 支持的可选 suffix

**Given** 字符串结构只明确支持一种交通类型
**When** classifier 返回单一候选
**Then** 服务端只调用对应的 flight 或 rail `TransportScheduleLookup` 适配器
**And** regex、首字母或客户端猜测只用于请求路由，最终类型和事实必须由 Provider 结果验证

**Given** 输入同时符合铁路规则与当前航司代码表，或者两类结构证据都不足以排除另一类
**When** classifier 返回 ambiguous
**Then** 服务端在同一有界查询上下文中并行调用 flight 与 rail 适配器，并分别应用超时、配额和熔断
**And** 不对所有输入无条件双查；两个 Provider 都返回可信结果时按 `飞机` 与 `火车` 分组展示，由用户选择而不是静默采用

**Given** 输入不符合任何当前支持的班次结构
**When** 用户提交查询
**Then** 不发起无边界的 Provider 猜测，并提供选择交通类型后重试或进入 Story 2.3 手工填写的路径
**And** 保留用户原输入和日期，不因分类失败清空另一边界或整个 S2 draft

**Given** flight Provider 返回一个或多个可信航段
**When** 服务端规范化结果
**Then** 每项包含营销/执行航班标识、航空公司、计划起降时间、机场、可用航站楼、source、observed_at、valid_until、quality 和 status
**And** 代码共享航班保留营销与实际承运关系并去除同一实际航段的重复展示，不把票价、余票、购票、登机口或延误承诺作为班次查询结果

**Given** rail Provider 返回一个或多个可信车次
**When** 服务端规范化结果
**Then** 每项包含车次、列车类型、计划到发时间、车站、source、observed_at、valid_until、quality 和 status
**And** 同车次跨日期、经停站组合或运行区间保持可区分，不推断余票、席别库存、检票口、停运或晚点实时状态

**Given** 查询用于到达或离开当前目的地的边界
**When** 结果按日期与城市上下文排序
**Then** 到达边界优先显示终点/经停到达当前城市的结果，离开边界优先显示从当前城市出发的结果
**And** 日期、城市和 terminal/station 相关性只能排序和解释候选，不能在多个可信结果之间替用户自动确认

**Given** 用户选择一个航班或铁路结果
**When** 服务端写入 planning draft
**Then** 到达边界使用该结果抵达目的地的计划时间与地点，离开边界使用从目的地出发的计划时间与地点，并以 expected revision 和幂等命令保存
**And** 保存 Provider/source、观测与有效期、原始类型和规范化班次身份；后台刷新不得静默覆盖用户已确认的 draft revision

**Given** 班次结果中的机场、航站楼或车站需要地点身份
**When** 服务端解析 terminal/station
**Then** AMap 只负责匹配 CanonicalPOI、坐标和路线地点，并保留歧义/不可用状态
**And** AMap 不得成为航班或铁路时刻、运行状态、票务和库存的数据来源

**Given** Provider 返回 no-match、ambiguous、cancelled、stale、超时、配额耗尽或 breaker-open
**When** 用户仍需确认边界
**Then** 结果不能保持 `confirmed`，界面保留已输入班次号与日期，并提供刷新、切换类型、手工填写、2 小时窗口或 `交给 AI 安排`
**And** 真实 no-match 在当前搜索区域显示 `未找到，可手动填写`，请求失败显示 `搜索暂不可用 · 重试`，详细原因与来源按需查看且不叠加弹窗；歧义、取消或过期结果仍须在采用前明确处理，任一 Provider 失败不抹去另一 Provider 的可信结果，也不阻塞用户使用 Story 2.3 的非查询路径

**Given** 班次查询在生产环境运行
**When** 读取航司代码表、缓存或外部 Provider
**Then** registry 与 classifier 均有版本，缓存键包含规范化班次、日期、类型、Provider 与策略版本，并执行 TTL、调用配额、并发、超时、重试预算和熔断
**And** 日志、Sentry、Langfuse 和分析只记录脱敏类型、结果数、状态、耗时和缓存命中，不记录完整私人行程、精确班次组合、token、手机号或 Provider secret

**Given** 用户通过触控、键盘或读屏使用统一输入与混合结果列表
**When** 输入、查询、切换类型、选择结果或回退
**Then** 加载、无结果、双类型、过期、失败和 disabled 状态具有标签、焦点管理、44pt 目标与非纯颜色表达
**And** 长航班/车次、长站名、跨午夜日期和 reduced-motion 模式均不溢出或改变布局

**Given** Story 2.4 准备关闭
**When** 使用包含 G/D/C/Z/T/K/S/Y、纯数字、字母数字航司码、代码共享、结构歧义、跨午夜、同号跨日、无结果、过期、取消、Provider 部分失败和 stale revision 的 fixture，并运行 OpenAPI/生成类型、classifier/adapter/缓存/隐私测试、真实 flight 与 rail Provider staging、AMap terminal/station staging、浏览器检查、完整构建和 diff 检查
**Then** 单输入框可以可靠路由、必要时双查并诚实保存航班或铁路边界，手工与 AI 降级保持可用
**And** 票务/余票/实时晚点、跨城市联程、逐晚住宿和路线矩阵不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.5: 规划前逐晚住宿与行李确认

As a 旅行者,
I want 在规划前按住宿晚确认酒店、早餐和行李,
So that AI 可以使用已知约束，同时允许我暂时留空或未决定.

**Requirements:** FR14, FR27.1 (accommodation), FR36 (hotel), FR41,
FR44-lite; NFR1, NFR8, NFR21; AR2-AR5, AR10-AR15, AR17, AR20,
AR21; UX-DR2, UX-DR3, UX-DR9, UX-DR10, UX-DR32-UX-DR34
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 已完成单城 S2 时间确认
**When** 进入 S3 `住宿安排`
**Then** 按住宿晚而不是按自然日生成 `旅行天数 - 1` 个可编辑行，并显示目的地、整体日期与住宿晚数
**And** 一日游明确显示零住宿晚，但仍提供末日离开前的行李确认，不意外创建额外酒店晚

**Given** S3 展示一个住宿晚
**When** 用户检查该晚内容
**Then** 同一 `StayNightEditor` 规则组依次提供酒店、早餐和行李三个子项，每个住宿晚均可独立设置
**And** 早餐不成为计划级单独问题，行李不再使用一个 plan-global 字符串

**Given** 用户在酒店字段输入酒店、民宿或地址
**When** 执行文本快速搜索
**Then** 使用 AMap 返回最多 5 个 CanonicalPOI 候选并显示标准名称与地址，不在本流程增加地图
**And** AMap 超时、配额或无结果时保留输入，允许重试、手工录入为待定位或明确选择 `留空/稍后决定`；当前搜索区域将真实无匹配写为 `未找到，可手动填写`，请求失败写为 `搜索暂不可用 · 重试`，详细原因按需展开，不把无结果与失败混为一类或增加全页警告

**Given** 用户主动选择某晚酒店留空
**When** 保存该住宿晚
**Then** 创建 `leaveBlank=true` 的明确 StayRevision，早餐和行李仍可分别确认
**And** 该晚后续不启用 near_hotel、酒店区域聚类或晚间活动半径偏好，也不得从灵感或热门地点静默代选酒店

**Given** 用户编辑某晚早餐
**When** 选择 `包含`、`不包含` 或 `未知`
**Then** 保存 tri-state breakfast 事实并保持其与该晚 StayRevision 关联
**And** `未知` 是显式有效确认，不被展示为包含早餐或 Provider 已验证事实

**Given** 用户从第二个住宿晚起点击独立的 `同上` 按钮
**When** 上一晚存在已确认的酒店或留空选择及早餐状态
**Then** 命令把上一晚住宿与早餐复制到该晚的新 StayRevision，并允许用户继续修改任一子项
**And** 不提供 `应用到剩余住宿晚`，不把 `same_as_previous` 持久化为最终事实，也不复制上一段 LuggageTransition

**Given** 当前住宿晚与前后晚关系已知
**When** 系统建议行李默认值
**Then** 首晚不得出现 `留在原酒店`，连住默认 `留在原酒店`，换住默认 `带到新酒店`
**And** 默认值只是待用户确认的建议；用户可选择随身、寄送、私家车、其他寄存、无大件或 `未决定`

**Given** 用户选择 `放在车站/机场` 或其他需要取回的寄存方式
**When** 保存 LuggageTransitionRevision
**Then** 必须关联可用 storage POI 或明确待定位状态，并记录需要安排的放下与取回约束
**And** 缺少取回路径、地点不可用或单向离开后无法返回时不能伪装成完整可执行安排

**Given** 行程进入最后离开日且不再产生新住宿晚
**When** 用户确认 checkout 后的行李去向
**Then** 可以选择随身、前往交通枢纽寄存、寄送、私家车、无大件或未决定
**And** 不允许把行李留在最后酒店，除非存在显式且可执行的返程取回约束

**Given** 用户修改 S2 旅行日期后返回 S3
**When** 系统 reconciliation 住宿晚
**Then** 按日期和 logical stay identity 保留仍有效的已确认 revision，新增晚进入待处理状态
**And** 移除或改变已填写住宿晚前显示明确影响，不能静默丢弃酒店、早餐、行李或把它们移到错误日期

**Given** 某晚酒店、早餐或行李仍是 untouched 初始态
**When** 用户尝试进入 S4
**Then** 下一步保持禁用并将焦点移到第一个未处理子项
**And** 明确的酒店 `留空`、早餐 `未知`、行李 `未决定` 或合法 `同上` 都满足对应字段确认，不要求用户伪造确定性

**Given** owner 保存某晚住宿或行李变化
**When** 服务端处理命令
**Then** 使用 owner scope、idempotency key、expected revision 创建不可变 StayRevision 或 LuggageTransitionRevision，并原子更新 draft 当前引用
**And** stale revision、越权或重复命令不覆盖旧版本，日志和分析不记录完整私人酒店备注、行李说明或 Provider secret

**Given** `StayNightEditor` 在 S3 中实现
**When** 组件和领域校验被组织
**Then** 酒店、早餐、行李字段状态及命令不依赖 S3 页面导航或多晚容器的局部布尔值
**And** 该可复用边界允许 Epic 3 在单晚 Sheet 中复用相同规则，但本 Story 不提前实现规划后入口或影响确认

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 S3
**When** 搜索酒店、留空、切换早餐、选择行李、点击同上或修正错误
**Then** 所有控件具备至少 44pt 目标、标签/角色、非纯颜色状态、焦点管理和键盘安全 CTA
**And** 多晚滚动、长酒店名、AMap 失败、零住宿晚及确认错误不造成嵌套卡片、闪烁或布局跳动

**Given** Story 2.5 准备关闭
**When** 使用零晚、单晚、连住、多次换住、空酒店、早餐三态、同上、车站/机场寄存、最后离开、日期增减、AMap 失败和 stale revision fixture，并运行 OpenAPI/生成类型、Prisma migration、owner/幂等/不可变 revision、真实 PostgreSQL、AMap staging、移动与桌面浏览器检查、完整构建和 diff 检查
**Then** S3 可以独立形成完整且诚实的逐晚住宿输入，未决定项不会阻止开始规划或被伪装为已确认事实
**And** 规划后的酒店 footer、单晚 Sheet、`管理全部住宿`、AccommodationChangeImpactSheet、增量校验、FixSheet、全局撤销、自动重排和 linked-trip 住宿不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.6: 规划前节奏与附加约束确认

As a 旅行者,
I want 在开始规划前确认旅行节奏和少量必要条件,
So that AI 能按照这次旅行的真实负荷偏好编排，而不用再填写一份复杂问卷.

**Requirements:** FR28, FR28.1, FR49; NFR3, NFR8, NFR12, NFR21;
AR2-AR5, AR12, AR15, AR17, AR20; UX-DR2, UX-DR3, UX-DR16,
UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 从已交付 Picker 基线完成地点选择
**When** 点击 Picker 主 CTA
**Then** CTA 文案为 `下一步` 并进入 S5 `规划前确认`
**And** S0-S4、设置或其他页面不得显示会启动规划的 `开始规划`，历史 Picker 的直接启动语义被兼容迁移

**Given** S5 读取当前 planning draft
**When** 页面渲染
**Then** 只显示目的地/日期简要信息、必去与顺路地点摘要、节奏选择和默认折叠的附加要求
**And** 不重复 S2/S3 的到达、离开、酒店、早餐和行李全量字段，也不显示智能规划开关、Quick/HQ、Provider 或版本名

**Given** draft 包含 required、along_route 或零地点意图
**When** S5 展示地点摘要
**Then** 分别显示必去/顺路数量与紧凑缩略项，零选择明确表示将由系统使用城市候选补全
**And** `调整` 返回 S4 且保留 S5 草稿；地点摘要不能把 along_route 显示成 required 或把未选内容显示成用户选择

**Given** 用户首次进入节奏选择
**When** PaceSelector 展示三个互斥选项
**Then** `悠闲` 说明每天 1-3 个主要安排、较晚出发并保留较多自由时间，`从容` 说明每天 2-4 个主要安排并兼顾游览与休息
**And** `充实` 说明优先覆盖更多地点并接受早出晚归、较多步行和换乘，文案不得退化为仅有快/慢标签

**Given** 自然语言或导入 evidence 没有达到版本化节奏推断阈值
**When** S5 初始化 pace
**Then** 预选 `从容`，并在用户点击 `开始规划` 时把当前可见选择作为本次明确确认
**And** 默认值不被写成来自用户历史偏好或跨行程学习

**Given** 自然语言或导入 evidence 明确表达本次节奏
**When** 系统预选 `悠闲`、`从容` 或 `充实`
**Then** 保存 source reference、observed_at、质量、置信度和推断策略版本，并使用简洁文案说明来自本次输入
**And** 预选仍可被用户修改，推断不得覆盖用户最终 pace、required、时间、住宿或其他显式约束

**Given** 用户展开 `还有其他需要注意的吗？`
**When** 输入同行人、行动能力、饮食、步行偏好或其他不能接受的条件
**Then** 保存 owner 原文、source=`user` 与当前 draft revision，并在重新进入 S5 时恢复
**And** 系统不得扩写、弱化或把模型推断合并成用户原文；结构化解析结果必须另存 provenance 与不确定状态

**Given** 本次输入或导入已形成经典、吃喝、自然、拍照、古建、小众、逛街或展览等 InterestSignal
**When** S5 冻结规划输入
**Then** 这些信号作为带来源的软排序上下文进入 snapshot
**And** S5 不增加第二套玩法多选问卷；无可靠信号时使用中性、多样化上下文，不伪装成用户确认

**Given** S2/S3 仍有 untouched 字段、Picker/S5 draft 已过期或 owner 不匹配
**When** 用户点击 `开始规划`
**Then** 阻止启动并引导到第一个需要处理的阶段，保留其他合法输入
**And** 不用隐式默认值绕过门禁，不覆盖更新 revision，也不泄露其他 owner 的 draft 是否存在

**Given** S2-S5 输入完整且当前 pace 可见
**When** 用户点击唯一的 `开始规划`
**Then** 使用 expected draft revision 与幂等键冻结包含时间边界、住宿、早餐、行李、地点意图、pace、附加要求和 InterestSignal 的不可变输入 snapshot
**And** 通过现有规划入口启动/返回同一请求身份；重复点击、HTTP 重试或页面恢复不能创建两个用户可见任务

**Given** 平台 AI 暂不可用、当前请求受限或已有进行中的 planning job
**When** S5 尝试启动
**Then** 显示平台状态、排队/稍后重试或恢复现有任务的诚实动作，保留可编辑 draft
**And** 不要求 BYOK、不显示 Provider 名称，也不把尚未创建的结果表示为规划中或已完成

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置使用 S5
**When** 选择 pace、展开附加要求、调整地点或启动规划
**Then** 互斥控件、折叠行和 CTA 具备至少 44pt 目标、标签/角色、焦点管理、非纯颜色选择态和简洁 live region
**And** 三段完整说明、长附加要求、最小支持宽度和键盘弹出均不溢出或遮挡底部 CTA

**Given** Story 2.6 准备关闭
**When** 使用三种 pace、无 evidence、可靠/冲突 evidence、用户改选、零地点、长附加要求、缺失 S2/S3、stale revision、重复启动、额度限制和恢复 fixture，并运行 OpenAPI/生成类型、snapshot/owner/幂等测试、移动与桌面浏览器检查、完整构建和 diff 检查
**Then** S5 可以独立完成节奏对齐、保留附加约束并成为唯一规划启动点，历史 Home/Picker/Planner 基线无回归
**And** corrected 全城 Picker、单一完整 Planner 编排、候选补全、路线矩阵和 DayLoadEstimate 不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.7: 全城 Picker 与 L3 意图选择

As a 旅行者,
I want 在全城视角下把具体地点标为必去或顺路,
So that AI 能理解我的强弱意图，同时我仍看得清这些地点属于哪里.

**Requirements:** FR14 (AMap map), FR26, FR27, FR29-FR31, FR49;
NFR1, NFR8, NFR21; AR2-AR5, AR10-AR15, AR17, AR20; UX-DR2,
UX-DR3, UX-DR11-UX-DR14, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 已完成 S2 旅行时间和 S3 住宿安排
**When** 从 S3 进入 S4 Picker 或打开已具备完整前置输入的 `/planner/pick` 深链
**Then** 首屏为当前计划城市的 `全城检查`，显示 L1 全城地图、L2 汇总行和全局选择计数
**And** 缺失、untouched、stale 或非 owner 的 S2/S3 draft 继续使用既有门禁补齐，不绕过前置确认或泄露其他 owner 数据

**Given** 用户位于 `全城检查`
**When** 查看标题、地图与 L2 列表
**Then** 标题不可展开且不显示展开箭头，L2 只承担区域语境和进入 L3 的导航职责
**And** L2 不显示 checkbox、必去按钮或顺路按钮，点击其派生状态点也不会改变任何 L3 意图

**Given** 某个 L2 包含 unselected、required 或 along_route 的子 L3
**When** 渲染该 L2 汇总行
**Then** 状态点由子项实时派生为未选、仅必去、仅顺路或混合态，并分别显示 `必去 X`、`顺路 Y` 与已选 L3 缩略图
**And** required 和 along_route 都必须回映；状态同时使用图标/形态、文字计数和无障碍标签表达，不只依赖点的颜色

**Given** 用户点击一个 L2 行
**When** 进入设计状态 `选择 L3`
**Then** 应用内标题直接显示当前 L2 名称，并展示该区域的 L3 列表、地图和吸底选择汇总
**And** `选择 L3` 只作为原型/分析状态名，不作为页面中的泛化标题

**Given** 用户进入 L3 页面
**When** 页面完成首屏渲染
**Then** 默认展开仅有 `附近 | 全城` 的互斥视角控件并默认选择 `附近`
**And** 该控件只存在于 L3 页面；返回 `全城检查` 后不保留展开箭头或伪造第三个地图层级

**Given** 用户切换地图视角、拖动既有地图/列表伸展层级或选择一个 L3
**When** 地图和列表重新取景
**Then** 聚焦/附近态展示当前或已选 POI 及附近 L3，地图与列表各半时展示当前 L2 和相邻 L2 的相关地点，完全地图态展示整个 L1 的 L2 分布
**And** 自动缩放、Marker、列表和当前 L2 上下文使用同一查询与视图状态，不能出现地图已切换而列表仍显示旧区域或布局因加载状态跳动

**Given** 用户查看一个可选择的 L3 行
**When** 使用行右侧操作
**Then** 只显示带可访问名称的 check-circle 和 Route 图标，check-circle 表示 `required/必去`，Route 表示 `along_route/顺路`
**And** 图标位于右侧，不在每行重复显示“必去/顺路”文字标签；触控目标仍至少为 44pt

**Given** 一个 L3 当前为 unselected、required 或 along_route
**When** 用户点击任一意图图标
**Then** required 与 along_route 始终互斥：点击未激活图标原子切换意图，再次点击已激活图标清除为 unselected
**And** 列表、Marker、缩略图、L2 汇总、吸底计数和后续提交 payload 在同一 revision 内同步，不出现双选或只在本地看起来已选

**Given** 用户在 L3 页面完成或暂不完成选择
**When** 查看吸底栏并点击主 CTA
**Then** 吸底栏以图标加文字显示 `已选必去 X` 与 `顺路去 Y`，主 CTA 为 `返回全览`
**And** 返回后保留当前滚动/视角语境，并立即在全城 L3 缩略图、L2 分项汇总和全局计数中映射两类意图

**Given** 用户在 `全城检查` 完成检查
**When** 点击主 CTA `下一步`
**Then** 使用当前 Picker draft revision 进入已交付的 S5 `规划前确认`，且不在 S4 启动 PlanningJob
**And** required、along_route 与 unselected 语义原样进入 S5；S4 不显示 `开始规划`、Quick/HQ 或智能规划开关

**Given** 用户没有选择任何 L3
**When** 点击 `下一步`
**Then** 零选择是合法状态，S5 显示将由系统使用城市候选补全的诚实摘要
**And** Picker 不强迫用户设置 required，也不把导入、收藏、热门或当前可见地点静默转换为 along_route

**Given** 用户在列表、地图、不同 L2、`附近 | 全城` 或返回全览之间切换
**When** Picker 重新渲染、应用恢复或请求重试
**Then** 一个规范化 owner-scoped intent store 以 `canonical_poi_id -> intent` 驱动所有视图，并通过 expected revision 与幂等命令持久化
**And** stale revision 提示刷新/合并而不覆盖较新选择，重复命令不产生重复关系，返回和恢复不清空已选状态

**Given** AMap 地图 SDK 不可用、加载超时、权限受限或进入弱网降级
**When** 用户继续使用 Picker
**Then** 降级为保持 L2/L3 语境和全部选择动作的列表视图，并诚实标明地图暂不可用及重试入口
**And** 地图故障不阻塞查看、选择、清除、返回全览或以零选择进入 S5，也不伪造当前位置、距离和地图 Marker

**Given** 单城 Picker 的查询或旧 draft 中出现不属于 `plan.city` 的地点
**When** 构建可选择结果或提交当前城市意图
**Then** 跨城地点不得静默进入当前 segment 的 required/along_route store 或普通时间段
**And** 保留可诊断的来源与待处理状态并显示诚实边界；附近跨城发现、确认新增城市和意图迁移由 Epic 4 的 linked-trip 垂直切片交付

**Given** L3 带有可靠的预约 evidence
**When** 渲染列表、缩略图或选择状态
**Then** 可显示小型 `需预约` metadata badge，但它不是第三种意图，也不改变 required/along_route/unselected
**And** badge 不声称 Nomad 已预约；地址、营业时间、评分、建议停留、来源和证据展开由后续通用 POI 信息 Story 交付

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置使用 S4
**When** 导航 L2、切换地图视角、设置意图、返回全览或进入 S5
**Then** 图标按钮、分段控件、L2 行和 CTA 具备至少 44pt 目标、稳定焦点、明确角色/状态和非纯颜色反馈
**And** 长 L2/L3 名称、双位数计数、最小支持宽度、地图加载及底部安全区均不造成文字溢出、遮挡、嵌套卡片或无意义动画

**Given** Story 2.7 准备关闭
**When** 使用 required/along_route 互斥与清除、仅必去/仅顺路/混合 L2、返回回映、零选择、地图/列表一致、弱地图、跨城脏数据、预约 badge、stale revision 和 owner 隔离 fixture，并运行 OpenAPI/生成类型、Picker store/API/可访问性测试、AMap staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** corrected Picker 可以从全城语境采集稳定的 L3 强弱意图并安全进入 S5
**And** 通用 POI 信息 Sheet、AMap Top-5 快速补点、跨城确认、完整 Planner 编排和候选补全不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.8: 通用 POI 信息 Sheet

As a 旅行者,
I want 在选择地点前查看可信且可追溯的地点信息,
So that 我能理解这个地点是否适合本次旅行，并正确设置必去或顺路.

**Requirements:** FR14 (AMap POI facts), FR29, FR31; NFR1, NFR8,
NFR12, NFR21; AR2-AR5, AR10-AR15, AR17, AR20; UX-DR2, UX-DR3,
UX-DR13, UX-DR15, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 2.7 的 S4 Picker 已显示一个 CanonicalPOI
**When** 用户点击 L3 行的主体、地图 Marker 或全城检查中的 L3 缩略图
**Then** 打开同一个可复用 PoiInfoSheet，并以该 POI 标准名称作为标题
**And** Sheet 不显示 `详情栏`、`POI 详情` 等泛化标题，不因入口不同创建不同事实副本或选择状态

**Given** CanonicalPOI 存在 AMap 验证事实
**When** PoiInfoSheet 完成加载
**Then** 按可用性展示标准名称、文字地址、营业信息、评分、人均、电话和建议停留时长
**And** 普通 Picker 行、Marker 和后续普通行程卡只展示所需地点信息，不增加高德 Logo 或逐卡版权徽标；地图级合规信息仍由统一地图容器处理

**Given** POI 事实携带 source、observed_at、valid_until 和 quality
**When** 构建面向用户的 Sheet
**Then** 可以展示来源与有助于理解事实的观测/更新时间，但不展示 `新鲜度`、`质量状态`、置信度数值或 Provider 内部枚举
**And** valid_until、quality 与匹配策略版本仍保留在服务端，用于使用门禁、排序、降级、审计和刷新，不因界面隐藏而被删除或默认成可信

**Given** 地址、营业信息、评分、人均、电话或建议停留中的任一字段缺失、冲突、过期或不可用
**When** Sheet 渲染该字段
**Then** 省略非关键空字段或以自然语言显示 `暂未获取`、`营业时间请出发前确认` 等诚实状态
**And** 客户端不得猜测数值、把历史值伪装成当前事实，或用内部 freshness/quality 标签要求用户理解数据管线

**Given** 建议停留时长来自导入证据、版本化规则或模型推断
**When** Sheet 展示该时长
**Then** 明确表达为建议而不是营业事实、预约时长或用户已确认时间
**And** 冲突来源由服务端按版本化策略选择可展示建议，原始 provenance 继续可审计但不暴露完整私人 evidence 或模型推理

**Given** POI 具有 reservation 或 ticket EvidenceSignal
**When** evidence 达到可展示阈值
**Then** Sheet 可显示小型 `需预约` 提示及简洁来源说明
**And** inferred evidence 不得显示为已预约、已购票或冻结时段；只有用户确认或独立验证的 booking/ticket 事实才能在后续流程形成 planning lock

**Given** POI 当前为 unselected、required 或 along_route
**When** PoiInfoSheet 展示或用户使用其中的 check-circle/Route 操作
**Then** 读取并写入 Story 2.7 的同一个 owner-scoped intent store，两个意图保持互斥且活动图标再次点击可清除
**And** Sheet 关闭前后，列表、Marker、缩略图、L2 汇总、全局计数和提交 payload 立即反映同一 revision，不生成 Sheet-local `selected` 布尔值

**Given** 用户从列表打开 Sheet 后切换意图、关闭或返回
**When** 焦点恢复到 Picker
**Then** 返回原触发项和原 L2/滚动/地图语境；若触发项不再可见则返回稳定的 L2 容器焦点
**And** 后退手势、系统返回键、键盘关闭和应用恢复都不清空意图或重复提交命令

**Given** AMap 事实接口超时、配额耗尽、breaker-open、返回部分字段或地图本身不可用
**When** 用户打开 PoiInfoSheet
**Then** Sheet 使用已允许展示的缓存事实或部分内容，并提供关闭和重试，不阻塞 required/along_route 操作
**And** 不显示虚假实时状态、不跳转外部地图绕过产品边界，也不把 Provider 故障误写为该地点不存在

**Given** 当前 POI 不属于 `plan.city` 或 owner 无权读取其关联 Inspiration/source record
**When** 请求 Sheet 数据
**Then** 跨城地点保持 Story 2.7 的单城护栏，受保护的来源详情按 owner 隔离并返回类型化不可用状态
**And** 公共 CanonicalPOI 缓存不得成为读取其他用户原始链接、批注、私人 evidence 或选择意图的路径

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置使用 PoiInfoSheet
**When** 打开、滚动、设置意图、重试或关闭
**Then** Sheet 具备焦点约束/返回、可访问标题、至少 44pt 图标目标、非纯颜色选择态、键盘安全区和简洁 live region
**And** 长 POI 名称、长地址、字段缺失、双位数信息、最小支持宽度和内容动态加载不造成文字溢出、嵌套卡片或布局跳动

**Given** Story 2.8 准备关闭
**When** 使用完整/部分/缺失/过期/冲突事实、预约推断、三态意图、跨城 POI、弱网、Provider 失败、stale revision 和 owner 隔离 fixture，并运行 OpenAPI/生成类型、POI facade/intent/API/可访问性测试、真实 AMap staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 用户可从所有 Picker 入口查看一致、简洁且诚实的 POI 信息，并在同一状态源上设置意图
**And** UI 不显示新鲜度/质量技术状态，AMap Top-5 文本补点、手工候选、直接落位、跨城确认和完整 Planner 编排不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.9: 单一 PlanningJob 与稳定时间轴转场

As a 旅行者,
I want 只经历一次可信的 AI 规划过程并获得一个当前计划,
So that 我不需要理解 Quick/HQ、版本采用或内部降级策略.

**Requirements:** FR32 (job and shell), FR32.1, FR32.2, FR33, FR49;
NFR2-NFR4, NFR10, NFR17; AR1-AR8, AR12-AR15, AR17, AR20;
UX-DR1-UX-DR3, UX-DR17, UX-DR31-UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 已完成 S2-S5 且 Story 2.6 已冻结当前 planning input snapshot
**When** 用户点击唯一的 `开始规划`
**Then** 服务端使用 owner、snapshot id/input revision 与 idempotency key 创建或恢复一个 PlanningJob，并返回同一个 job identity
**And** 重复点击、HTTP 重试、双端同时提交或应用恢复不得为同一 snapshot 创建第二个用户可见任务或第二条完成路径

**Given** 同一 owner/Trip 已有 queued、running 或 recoverable 的 PlanningJob
**When** 相同 snapshot 再次请求开始规划
**Then** 返回现有 job、当前事实状态和可重连 cursor，不重置已完成阶段
**And** 不同 snapshot 必须通过 expected revision/显式取消或替代策略处理，不能静默让旧任务使用新输入或让新任务覆盖旧输入

**Given** PlanningJob 被接受
**When** 客户端从 S5 转入 S6
**Then** 立即进入与最终 S7 共用的稳定时间轴 shell，保留目的地、日期 tabs、时间轴行占位和每日住宿 footer 的稳定尺寸
**And** 不显示独立的“AI 已完成编排”页面、营销式 loading、百分比进度、空白 `待安排` 节点或会改变布局的 Quick/HQ 卡片

**Given** PlanningJob 运行各阶段
**When** 服务端记录并推送状态
**Then** 使用单调 sequence/cursor 持久化 `accepted/context/constraints/candidates/arranging/validating/persisting/done` 事实事件，并支持 `fallback/failed`
**And** 用户文案只描述已发生或正在发生的事实，不暴露 prompt、chain-of-thought、Provider、模型、Quick/HQ、内部候选版本或虚假预计完成时间

**Given** 客户端断线、切到后台、刷新、重新登录或服务进程重启
**When** 使用最后确认 cursor 重连
**Then** 从持久事件记录重放缺失事件并继续当前 job，已确认事件保持同一序号和语义
**And** 内存 EventEmitter、worker/队列回调或客户端 loading state 不得成为任务事实来源；编排由现有框架代码实现，不依赖低代码平台，重复事件由 job id 与 sequence 幂等消费

**Given** 编排器使用高质量 Provider、确定性路径、低成本 Provider 或兼容 Quick/HQ 代码
**When** 启动一个内部 PlanningAttempt
**Then** attempt 持有 `(planningJobId, generation, inputRevision)` fence、来源类型、开始/结束时间与类型化结果状态
**And** 内部策略受远程开关、配额、并发、超时、重试预算和熔断控制，但不形成用户可选择的版本、第二个 job 或第二次完成提示

**Given** 多个内部 attempt 返回候选结果
**When** PlanningJob 准备持久化
**Then** 只有当前 generation 且 input revision 未失效的 fenced attempt 可以进入发布事务
**And** 迟到、已取消、失败、旧输入或已被替代的 attempt 只能记录丢弃原因，不能修改 Plan.currentVersion、PlanRevision、job done 状态或客户端时间轴

**Given** 当前 fenced attempt 使用现有 Planner 基线产生结果
**When** 结果通过本 Story 的结构与所有权发布门禁
**Then** 事务性创建唯一当前 PlanRevision，并保证每个旅行日具有合法日期边界、稳定顺序以及已安排内容或明确自由时段
**And** `done` 只引用该已持久化 revision；空 payload、越界日期、非当前城市混入、非法时间区间或无法读取的 revision 不得被表示为成功

**Given** PlanningJob 已发布 `done`
**When** 客户端读取当前 revision
**Then** 同一时间轴 shell 原位解析为 S7 可查看计划，不出现版本选择、`采用高质量版` 或手动刷新才能看见结果的步骤
**And** completion hint 可以保留到第一次真实 mutation，但它不阻塞浏览；S7 当前 revision 是后续编辑和恢复的唯一基线

**Given** 用户已对发布后的计划产生任何有效 mutation、expected plan revision 已前进或 job 已被取消
**When** 旧内部 attempt 随后完成
**Then** attempt fencing 拒绝其发布且保留当前用户 revision
**And** 后台不得以“更优计划”为由静默替换、合并、重排或重新显示完成提示；未来变化必须经过显式预览/应用流程

**Given** 高质量 Provider 超时、额度不足、breaker-open 或输出无效
**When** 同一 job 可以使用确定性或低成本安全降级
**Then** 记录并展示通用 `fallback` 事实后继续同一个 PlanningJob，成功时仍只发布一个当前 PlanRevision
**And** 不要求 BYOK、不显示 Provider/模型名、不把降级描述为第二个版本，也不降低 ownership、结构校验或 attempt fence

**Given** 所有允许的 attempt 都失败、任务达到预算/截止时间或无法形成可发布结果
**When** PlanningJob 进入 terminal failed
**Then** 保留 S2-S5 planning draft 与 snapshot，显示类型化可重试/返回修改输入动作
**And** 不创建空成功计划、不丢失用户输入、不无限自动重试，也不把 Provider 故障误写成用户地点不存在

**Given** 仓库已有 public Quick/HQ response、status/adopt API、analytics 和持久记录
**When** 实施单一 PlanningJob 兼容迁移
**Then** 已有记录仍可由服务端兼容读取和恢复，但新移动端停止调用 HQ status/adopt、停止显示 quick/hq version 和停止发出旧产品漏斗事件
**And** 旧 endpoint 进入明确的版本化兼容/弃用边界，不能在无迁移策略时删除历史数据，也不能继续成为新流程的隐式前向依赖

**Given** PlanningJob、事件、attempt 或 PlanRevision 被读取、重试或恢复
**When** 服务端执行授权与观测
**Then** 所有查询和写入按 owner/Trip/snapshot scope 校验，并以 job id、阶段、耗时、状态、fallback reason 与脱敏计数记录指标
**And** 日志、Sentry、Langfuse、分析和前端 payload 不包含完整私人附加要求、酒店/行李备注、受保护来源 URL、token、手机号、Provider secret 或未裁剪模型内容

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置观看 S6/S7 转场
**When** 状态更新、重连、fallback、失败或完成
**Then** 时间轴 shell 保持稳定焦点与滚动，状态使用简洁 live region、非纯动画表达，并提供至少 44pt 的重试/返回动作
**And** 长城市名、多日 tabs、慢事件、重复事件、离线恢复和最小支持宽度不造成文字溢出、遮挡、闪烁或进度消息堆叠

**Given** Story 2.9 准备关闭
**When** 使用重复启动、并发提交、断线重连、服务重启、cursor 重放、fallback、全失败、迟到 attempt、首次编辑竞态、旧 Quick/HQ 数据、stale revision 和 owner 隔离 fixture，并运行 OpenAPI/生成类型、Prisma migration、repository/route/SSE/mobile tests、真实 PostgreSQL、真实 Provider staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** S5-S7 只呈现一个可恢复 PlanningJob 和一个 fenced 当前计划，现有 brownfield 任务能力完成安全迁移
**And** 约束优先完整编排、路线矩阵、候选扩展/文本补点、DayLoadEstimate、linked trip 和规划后编辑不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C08 — App：App 恢复单一 PlanningJob

**Given** App 已创建单一 PlanningJob 后被系统终止或在无网状态恢复
**When** 用户重新打开原计划上下文
**Then** 先验证身份与 snapshot/job/revision，再恢复同一任务或当前计划，完成结果仍在同一时间轴路由呈现
**And** 进程重建、重复恢复事件或请求超时不导致第二次规划、自动采用旧版本或丢失服务器已受理事实

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.10: 可信通勤事实与时间轴交通摘要

As a 旅行者,
I want 在相邻地点之间看到可信的交通方式和耗时,
So that 我能判断计划是否现实，Planner 也能基于真实路线进行后续编排.

**Requirements:** FR14 (AMap routing), FR32 (route context), FR33;
NFR1, NFR3-NFR5, NFR10, NFR23; AR2-AR5, AR8, AR11-AR15,
AR17-AR20; UX-DR2, UX-DR3, UX-DR18, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 2.9 已发布一个单城 PlanRevision
**When** 服务端检查同一天按稳定顺序排列的活动
**Then** 为每对具有可路由 CanonicalPOI 的相邻活动请求或读取 RouteFact
**And** 首个活动不产生虚构上一段，末个活动不产生虚构下一段，不跨日期或跨城市把两个普通活动连成一段路线

**Given** 相邻起终点具备有效坐标与城市上下文
**When** 路线服务查询可用方式
**Then** 使用 Provider-neutral `walking/public_transit/driving` 模式适配高德步行、公交和驾车/打车路线能力
**And** 默认方式由版本化策略、距离、当地时间和用户明确行动/交通约束选择，Provider 特有字段不得泄漏进 Planner 或移动端领域合同

**Given** 查询公共交通或其他与出发时间相关的方式
**When** 构建 Provider 请求与缓存键
**Then** 包含起终点、城市、方式、计划当地日期、版本化时间桶、Provider 与策略版本
**And** 不以错误日期、UTC 日期或无时间语境的缓存冒充当前可用公交结果，跨午夜行程按实际出发日处理

**Given** Provider 返回可用路线
**When** 服务端规范化并持久化/缓存结果
**Then** RouteFact 保存 from/to POI、mode、durationMinutes、distanceMeters、source、observedAt、validUntil 与 `known` 状态
**And** 只接受有限非负数、匹配城市和正确起终点；异常零值、负值、错向路线或不完整 payload 进入 typed unavailable 而不是可信事实

**Given** Provider 返回多条路线或多个可用方式
**When** 版本化选择策略确定时间轴摘要
**Then** 选择一个符合明确约束且可解释的默认 RouteFact，并可在服务端保留其他允许方式作为候选事实
**And** 不把“最快”伪装成用户偏好，不为省时静默忽略少走路、公共交通优先、行动能力或其他用户原文约束

**Given** RouteFact 缺失、过期、Provider 超时/配额耗尽/breaker-open、起终点缺坐标或公交在该时段不可用
**When** 服务端构建计划 hydration
**Then** 返回 nullable commute 与 `unknown/stale` 领域状态，相邻路线行以低强调的 `路程时间暂缺` 表达，详细原因、过期状态与依据在现有路线详情按需查看，不逐项弹窗；需要可信可达性才能执行的动作仍按原门禁处理
**And** 客户端、LLM 和 Planner adapter 不得用直线距离、固定速度、旧 duration 或 `0 分钟` 伪造交通时间

**Given** 某住宿晚存在明确且可路由的 hotel CanonicalPOI
**When** 当日首个/末个活动与住宿边界需要交通上下文
**Then** 可以生成酒店到首个活动及末个活动到酒店的 RouteFact，并保持酒店不是普通必去 POI
**And** 酒店留空、待定位或显式稍后决定时不生成虚构酒店路线，也不从灵感/热门地点替用户选择酒店

**Given** 连续住宿晚酒店不同
**When** 生成与换住日相关的路线事实
**Then** 可以保存旧酒店、新酒店及相邻活动之间的候选 RouteFact，供后续 Planner/Validator 使用
**And** 本 Story 不据此自动插入行李、入住缓冲或移动景点，也不宣称换住安排已完成

**Given** 当前 PlanRevision hydration 包含已知相邻 RouteFact
**When** S7 时间轴渲染两个活动
**Then** 在二者之间显示紧凑的 `30 分钟 · 公交`、`12 分钟 · 步行` 等摘要，视觉层级低于地点/日期并高于次要说明
**And** 摘要不成为独立装饰卡片、不改变 POI 行高度或排序，长方式文案和 nullable 状态不造成瀑布时间轴跳动

**Given** 用户打开已有 Story 2.2 编辑 Sheet 的兼容界面
**When** 展示地点和前后关系
**Then** 可读取同一 RouteFact 投影作为上一地点/下一地点通勤摘要，缺失时同样用行内 `路程时间暂缺` 表达，具体原因按需查看
**And** 本 Story 不修改移动、替换、调时、删除、冲突修复或撤销行为，也不让编辑 Sheet 自行计算路线

**Given** 多个请求同时查询相同路线键
**When** 缓存 miss 或刷新发生
**Then** 服务端执行请求合并、配额、并发、超时、有限重试预算和熔断，并按策略版本控制 TTL
**And** 单个 Provider 故障不会触发无界 fan-out、重试风暴或阻塞现有计划浏览，缓存陈旧不得无状态地延长为永久可信

**Given** 不同 owner 的计划查询相同公共起终点路线
**When** 复用 RouteFact 缓存
**Then** 只复用 CanonicalPOI 间公共路线事实，不把 plan id、owner id、私人酒店文本、用户约束或访问历史写入共享响应
**And** owner-scoped hydration 仍先鉴权，公共缓存键和日志不能成为枚举他人计划、酒店或移动轨迹的读取路径

**Given** 普通 Picker/时间轴/酒店行展示 AMap 验证地点和 RouteFact
**When** 渲染用户界面
**Then** 普通行只显示所需地点、方式和耗时，不增加高德 Logo 或逐卡版权徽标
**And** 统一地图容器和 Provider 集成层继续遵守适用合规要求，本 Story 不通过隐藏内部来源字段破坏审计或合同义务

**Given** 路线调用与摘要被观测
**When** 写入日志、Sentry、Langfuse 或分析
**Then** 只记录脱敏方式、状态、耗时、缓存命中、Provider error class 与策略版本
**And** 不记录 owner 的完整每日路线、私人酒店/行李说明、精确连续位置轨迹、token 或 Provider secret

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置查看时间轴
**When** 路线从加载变为已知、未知、过期或失败
**Then** 摘要具备可访问标签和非纯颜色状态，更新不抢夺焦点、不重复播报整日时间轴
**And** 多日 tabs、长地点名、跨午夜、最小支持宽度与网络抖动不造成文字溢出、遮挡或无意义动画

**Given** Story 2.10 准备关闭
**When** 使用步行/公交/驾车、多个方式、同地点、缺坐标、跨午夜、公交停运、酒店明确/留空/换住、unknown/stale、Provider 部分失败、并发缓存和 owner 隔离 fixture，并运行 OpenAPI/生成类型、RouteFact repository/adapter/cache/API/mobile tests、真实 PostgreSQL、真实高德路线 staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 当前时间轴可以显示可信且可降级的相邻通勤事实，后续 Planner/Validator 可复用同一服务端合同
**And** 自动重排、完整约束编排、冲突判定/修复、跨城 TransferLeg、实时导航、逐步路线指引、候选补全和 DayLoadEstimate 不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.11: 约束优先的完整单城初始编排

As a 旅行者,
I want AI 根据我的时间、住宿、地点意图和节奏一次完成整趟单城计划,
So that 我不需要先手工摆放地点，也不会得到无法执行的日程.

**Requirements:** FR7, FR27.1 (input consumption), FR28, FR28.1,
FR32 (arrangement), FR32.3 (base candidates and unresolved), FR34, FR36,
FR36.1, FR41; NFR4, NFR5, NFR10, NFR12, NFR17, NFR21, NFR23;
AR2-AR5, AR7, AR8, AR10-AR15, AR18-AR20; UX-DR17-UX-DR19,
UX-DR31-UX-DR33

**Acceptance Criteria:**

**Given** Story 2.9 的 PlanningJob 开始安排阶段
**When** Planner 加载本次输入
**Then** 只读取 Story 2.6 冻结且 owner-scoped 的 immutable snapshot，包括时间边界、住宿/早餐/行李、地点意图、pace、附加要求与 InterestSignal
**And** 运行中变化的 draft、其他 owner 数据、过期 Picker store 或兼容 smartPlanning 开关不得改变当前 attempt 的输入

**Given** snapshot 包含旅行日期、每天出门时间及到达/离开边界
**When** 构造每日可用区间
**Then** 精确模式只使用已确认班次/手工事实，两小时模式使用用户确认的连续窗口，`ai_decide` 只使用明确的 provisional 可用边界
**And** 不编造航班、车次、票务、航站楼、车站或精确到离时间；跨午夜按目的地本地日期生成合法区间

**Given** Planner 冻结并排序约束
**When** 评估任一放置动作
**Then** 优先级依次为 owner/城市/日期完整性、确认交通/预约与冻结边界、营业/证据时段、可行 required、住宿/行李及 near-hotel、along_route、Agent 补全候选
**And** 后级软目标不得覆盖前级约束，Provider 或模型输出必须经确定性领域校验后才能持久化

**Given** 导入证据包含 dawn、sunset、night、night-market 或其他可靠强时段
**When** 证据达到版本化使用阈值
**Then** 转换为带 source、observed_at、quality、confidence、时区和策略版本的候选 planning window，由 Agent 在编排中决定是否启用
**And** S2-S5 不增加特殊时段开关；证据不足、冲突或过期时保持软提示/未知，不能静默冻结用户日程

**Given** reservation/ticket evidence 仅为模型推断或来源笔记陈述
**When** Planner 构建冻结时段
**Then** 将其视为预约/购票提示或 acquisition requirement，而不是已完成 booking
**And** 只有用户确认或独立验证的预约/票务事实可以创建 immutable lock；门票不成为规划前单独问卷

**Given** L3 intent 为 required
**When** Planner 尝试在营业、时间、路线、住宿和其他硬边界内放置
**Then** 优先选择一个可行位置并保留 user intent/source，不要求用户先手工创建时间槽
**And** required 是强偏好而非无条件强塞，不能挤掉冻结时段、跨越日期边界、覆盖住宿/交通或制造已知重叠

**Given** required 无法安全落位
**When** 所有合法日期和时段均已评估
**Then** 创建 `unresolved_required`，使用 `requires_location/hard_time_conflict/closed/outside_trip/unavailable` 等类型化原因与简洁用户说明
**And** 不静默删除、不降级成普通候选、不伪装成已安排，也不为了提高 required placement 指标突破硬约束

**Given** L3 intent 为 along_route
**When** required 与冻结项已获得可行安排
**Then** 仅在 Story 2.10 RouteFact、区域连续性和剩余时间表明顺路时采用，并保留 along_route provenance
**And** 不把沿途意图按 required 处理，不因选择数量多而全部塞入，也不挤掉自由时间、必要通勤或明确附加约束

**Given** snapshot 中存在未选择但已验证的 owner Inspiration
**When** Planner 需要补全日程
**Then** 可作为带来源的软候选参与排序，但不得改写为用户 required/along_route
**And** 未采用项保留到候选投影，不因 Agent 未选择而丢失 owner 来源或变成系统热门地点

**Given** required、along_route 和已导入候选不足或用户零选择
**When** 构建基础 Agent 候选池
**Then** 使用 city x season x time-of-day x category 的已验证 AnchorPool，池不可用时回退版本化城市 Top-50 并记录原因
**And** L2 只提供区域/聚类语境，不恢复固定 2h/4h 用户槽；本 Story 不自动触发新的 XHS 搜索或 AMap 附近扩展

**Given** 候选池包含重复 POI、同一地点多来源或无法确定的连锁分店
**When** Planner 规范化候选
**Then** 按 CanonicalPOI 去重并保留可审计来源集合，分店未解析/待定位项不得静默放置
**And** 不能用品牌级名称替代具体可执行分店，也不能因共享缓存泄露其他 owner 的导入来源

**Given** Story 2.10 提供 route service
**When** Planner 比较候选顺序与可行时段
**Then** 只使用匹配日期/方式且 status=`known` 的 RouteFact 作为具体通勤分钟事实，并限制路线矩阵候选规模、批次与预算
**And** unknown/stale 保持 nullable 并产生诚实风险/降级；客户端或 LLM 不用直线距离、固定速度或旧值制造分钟数

**Given** snapshot 包含每晚 Stay、breakfast 与 LuggageTransition 选择
**When** Planner 构造早段、晚段和换住日
**Then** 明确酒店生成当日底部 hotel_slot，早餐影响早段可用时间，连住/换住/寄存/随身/未决定分别形成对应约束或风险
**And** 酒店留空时保持 hotel_slot 空白、不代选酒店、不启用 near_hotel；最后离开日不意外新增住宿晚

**Given** 当日具有明确酒店
**When** 对早晚候选排序
**Then** 可按 FR36.1 使用酒店附近的弱偏好与 Story 2.10 RouteFact，同时保留营业、冻结、required 和可用时间的更高优先级
**And** near_hotel 不成为硬约束，不强制每日回酒店，也不静默移动用户已冻结的景点

**Given** pace 为 `悠闲`、`从容` 或 `充实`
**When** Planner 决定主要安排数、出发/结束倾向与自由时间
**Then** 使用 Story 2.6 的明确语义作为软负荷目标，并允许因营业、required、边界或用户附加约束产生可解释偏离
**And** 附加约束优先于 InterestSignal；InterestSignal 只影响候选排序与多样性，不被写成长期人格或用户确认

**Given** Planner 生成活动时间
**When** 选择内部开始/结束边界
**Then** 可按 15 分钟精度对齐并使用来源明确的建议停留时长，同时持久合同继续支持合法分钟值
**And** 不向用户展示吸附规则，不把建议停留当预约时长，也不创建重叠、负时长或超出当日可用区间的槽

**Given** 某一天候选不足或留白符合 pace/约束
**When** 完成该日安排
**Then** 以明确自由时间/可用区间结束该日，不显示要求用户填满的空白 `待安排` 槽
**And** 每个旅行日都具有稳定日期边界、零个或多个可执行活动、nullable 通勤和对应住宿 footer，不因零活动而丢失整天

**Given** Planner 形成候选 PlanRevision
**When** 调用 Validator 的初始发布门禁
**Then** 拒绝 owner/城市/日期错误、非法区间、重叠、冻结边界突破及已知硬冲突，并把无法放置的 required 转为明确未解决项
**And** 已知软问题和 unknown RouteFact 以可解释 validation state 保存；没有可安全发布结果时同一 PlanningJob 失败，不创建空成功 revision

**Given** 一个 PlanRevision 通过初始门禁
**When** S7 时间轴 hydration
**Then** 在同一 shell 显示日 tabs、完整瀑布活动、Story 2.10 通勤摘要、hotel footer、未解决 required 入口和按来源分组的基础候选入口
**And** UI 统一称 `计划`，不显示 `骨架`、Quick/HQ、智能规划开关或要求用户先摆放地点的橙色 `待安排`

**Given** Planner/Validator/Provider 处理私人输入与候选来源
**When** 记录指标和诊断
**Then** 统计首次可发布计划、required 落位/未解决、along_route 采用、fallback、候选来源和阶段耗时等脱敏指标
**And** 不记录完整附加要求、酒店/行李备注、受保护原始链接、精确私人路线、token、Provider secret 或未裁剪模型内容

**Given** Story 2.11 准备关闭
**When** 使用零选择、三种 pace、exact/window/AI 边界、required 成功/冲突、along_route 顺路/不顺路、特殊时段、预约推断、AnchorPool/Top-50、酒店留空/连住/多次换住、早餐/行李、known/unknown 路线、跨午夜、Provider fallback、stale input 和 owner 隔离 fixture，并运行 OpenAPI/生成类型、Planner/Validator/repository/mobile tests、真实 PostgreSQL、真实高德与 Provider staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 单一 PlanningJob 可以从冻结输入发布一份约束优先、完整、诚实且可直接浏览的单城计划
**And** MVP AMap 候选扩展、文本手工补点、DayLoadEstimate、餐饮选择池、linked trip、规划后 FixSheet/AI 调整和 Filler 细节不被标记为本 Story 已交付；XHS 关键词搜索明确属于 Post-MVP

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 2.12: 高德候选补全与非阻塞候选区

As a 旅行者,
I want AI 在现有灵感与城市候选不足时继续寻找可信附近地点,
So that 计划能尽量完整，同时不因不确定候选中断编排.

**Requirements:** FR14 (AMap search), FR32.3, FR33, FR34;
NFR1, NFR3-NFR5, NFR12, NFR17, NFR20, NFR21; AR2-AR8,
AR10-AR15, AR17-AR20; UX-DR17, UX-DR19, UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 2.11 正在为当前 owner 的单城 PlanningJob 构建候选
**When** required、along_route 与未选择但已验证的 owner 灵感不足以完成计划
**Then** 先消费当前城市可用的 AnchorPool 和版本化城市 Top-50，再决定是否需要高德候选扩展
**And** 已有可靠候选足够时不产生额外高德请求，也不把候选扩展变成固定必经阶段

**Given** 基础候选经过约束过滤后仍不足
**When** PlanningJob 进入同一 `candidates` 内部阶段
**Then** 通过 Provider-neutral POI search adapter 发起有界的高德附近搜索
**And** 搜索过程属于同一个 job、同一个 immutable snapshot 和同一个最终 PlanRevision，不创建独立页面、第二份计划或可采用版本

**Given** Planner 需要构造高德搜索上下文
**When** 选择中心点、区域和关键词
**Then** 仅使用当前城市、当前 L2/已安排 CanonicalPOI、明确酒店以及待补自由窗口等计划内事实
**And** MVP 不读取旅行中的实时设备位置、不持续跟踪用户，也不因酒店留空而虚构搜索中心

**Given** 同一天或同一 job 可能产生多个候选缺口
**When** 执行附近搜索
**Then** 通过版本化策略限制每个缺口的类别、半径、结果数、总查询数、并发、超时、有限重试和总成本预算
**And** 使用请求合并、缓存、配额和熔断避免 fan-out；达到预算后以可解释降级结束，不无限扩大半径或重复搜索

**Given** 高德返回一个或多个地点结果
**When** 结果进入 Nomad 领域层
**Then** 规范化为 CanonicalPOI 候选，完成城市护栏、坐标/地址校验、分店消歧、CanonicalPOI 去重和来源记录
**And** 同一地点的高德结果、owner 灵感、AnchorPool 与 Top-50 只形成一个候选实体，同时保留允许的来源集合而不泄露其他 owner 的导入证据

**Given** 搜索结果是连锁品牌、同名地点或无法确定分店
**When** 服务端尝试解析具体可执行 POI
**Then** 在现有分店消歧上限内只接受唯一或达到版本化置信阈值的具体分店
**And** 品牌级名称、跨城分店、待定位结果或仍歧义的候选不得静默进入时间轴

**Given** 某个新候选具有明确 CanonicalPOI、城市、坐标和必要事实
**When** Planner 评估是否可直接参与初始编排
**Then** 只有通过营业、可用时段、Story 2.10 RouteFact、距离、住宿和其他硬约束且达到版本化高置信阈值的候选可以作为 Agent 软候选落位
**And** 它始终保留 `agent_candidate/amap` provenance，不被改写为用户 required、along_route、已预约或已购票

**Given** 候选缺少坐标、营业事实、可信路线、具体分店身份或其他安全落位依据
**When** Planner 无法证明其满足当前窗口
**Then** 不把它静默放入时间轴，并记录类型化未采用原因
**And** 不用直线距离、默认营业时间、固定速度、品牌中心点或模型猜测补齐缺失事实

**Given** 高德返回相关但仍不确定的候选
**When** 初始计划完成发布
**Then** 将其投影到 S7 候选区，而不是暂停 PlanningJob 或要求用户在编排中途确认
**And** 不新增 `awaiting_candidate_confirmation` 等等待状态，也不因候选区存在而阻止同一计划变为可查看、可编辑

**Given** S7 存在未解决 required、未采用 along_route、owner 导入地点或 Agent 高德候选
**When** 用户打开候选区
**Then** 一级只按 intent 分为 `未安排的必去 / 顺路候选 / 其他候选`，每个地点行再标注 `来自灵感 / 城市热门 / 附近推荐 / 我添加的` 等来源和未采用阶段
**And** intent 与 provenance 分开保存，同一地点只出现一次；分组顺序、计数和空态稳定，不使用泛化 `AI` 来源标签，也不把未选择内容伪装成待办或计入已选必去/顺路数量

**Given** 用户查看一个 Agent 高德候选
**When** 候选行或详情被渲染
**Then** 显示规范地点名、必要地址/区域和简洁的候选理由，并可复用 Story 2.8 的通用 PoiInfoSheet
**And** 不展示内部质量枚举、置信分、模型推理、Provider 调试字段或其他用户的来源证据，也不在普通候选卡增加高德 Logo/逐卡版权徽标

**Given** 用户在本 Story 的候选区查看地点
**When** 点击候选或关闭详情
**Then** 只执行浏览与返回，不直接改变 Picker intent、插入时间轴、移动已有活动或重新运行整份计划
**And** 文本手工补点、候选直接落位以及变更预览/撤销由后续独立 Story 负责，避免把候选发现和 mutation 合并成不可控动作

**Given** 高德搜索超时、配额耗尽、breaker-open、返回空结果或全部候选未通过门禁
**When** PlanningJob 仍可使用已有可靠内容形成合法计划
**Then** 继续完成并在不足处保留明确自由时间，可记录通用候选补全降级事实
**And** 不把 Provider 故障写成用户地点不存在、不发布空成功计划、不无限重试，也不要求 BYOK

**Given** 用户希望在计划完成后补充新的小红书材料
**When** 用户通过现有 Home 导入入口提交一个或多个具体分享链接
**Then** 链接继续进入现有 owner-scoped ingest 管线并形成可查看灵感
**And** 导入完成不静默改写已发布 PlanRevision；用户需通过后续显式规划/编辑动作决定如何使用新增内容

**Given** 产品或工程讨论候选扩展来源
**When** 评估小红书关键词搜索
**Then** 将搜索 Provider、登录会话、Cookie 所有权、验证码、结果选择和授权/合规设计明确保持为 Post-MVP 独立能力
**And** 不把现有 `fetchXhsPost(url)` 下载适配器描述为搜索 API，不在本 Story 中复用或新增隐式搜索登录态

**Given** 客户端订阅 PlanningJob SSE
**When** AnchorPool、Top-50 或高德候选步骤开始、降级或完成
**Then** `candidates` 只发送与当前真实 MVP 子阶段一致、可重放且不倒退的事实进度
**And** 不发送 `正在搜索小红书`、等待候选确认、虚假百分比、Provider/模型名或足以泄露私人查询上下文的消息

**Given** 多个 owner 可能命中相同高德地点或公共搜索缓存
**When** 服务端复用候选事实
**Then** 只共享 CanonicalPOI 层的公共规范事实和安全缓存结果，owner 计划、搜索触发上下文、酒店、附加要求及受保护链接保持隔离
**And** 所有候选区读取、job 恢复和后续详情访问仍先执行 owner/Trip/PlanRevision 授权

**Given** 候选扩展被记录到日志、指标、Sentry、Langfuse 或分析
**When** 调用成功、失败、降级或候选被采用/保留
**Then** 仅记录脱敏城市/类别桶、数量、耗时、缓存命中、错误类别、策略版本和采用结果
**And** 不记录完整私人要求、具体酒店、原始受保护链接、精确用户轨迹、token、Cookie、Provider secret 或未裁剪模型内容

**Given** Story 2.12 准备关闭
**When** 使用候选充足、零灵感、AnchorPool 空、Top-50 回退、高德补全、跨城结果、连锁歧义、重复 POI、缺坐标/营业/路线、高德失败/配额、自由时间、SSE 重放和 owner 隔离 fixture，并运行 OpenAPI/生成类型、CanonicalPOI/search adapter/cache/repository/Planner/SSE/mobile tests、真实 PostgreSQL、真实高德 staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 单一 PlanningJob 能在基础候选不足时有界补充可信地点，并在不确定或失败时非阻塞地发布诚实计划与候选区
**And** 小红书关键词搜索、PlanningJob 候选确认暂停、文本手工补点、候选直接落位、实时位置召回、linked trip、DayLoadEstimate 和规划后自动修复不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.13: 平台 AnchorPool 分桶、共享准入与版本快照

As a 旅行者,
I want 在个人灵感不足时获得符合城市、季节、时段和类别的可靠平台候选,
So that 零选择或低素材计划仍有相关地点可用，同时这些地点不会被误认为我的必去项.

**Requirements:** FR30, FR32.3, FR34; NFR3-NFR5, NFR12,
NFR17, NFR20, NFR21; AR2-AR5, AR10-AR15, AR18-AR20;
UX-DR19, UX-DR31-UX-DR33

**CE attribution clarification (2026-09-14):** 下文冷启动职责中的Top-50读取/降级由已批准的
Story 2.11/2.12 MVP候选调用链承担；2.13数据层只返回明确池状态。跨桶扩充/主动平台采集
属于Post-MVP方向，不使本期Planner等待8.7/8.8。此说明澄清既有责任归属，不新增功能或改写下列GWT。

**Acceptance Criteria:**

**Given** 平台为某个已支持城市维护可复用候选
**When** AnchorPool 领域合同被定义
**Then** 候选按 `city x season x time-of-day x category x policyVersion` 建立版本化分桶，并允许使用明确的通用维度值表达全年、全时段或综合类别
**And** 城市、季节、时段和类别使用受控枚举/规范标识，不能依赖自由文本、客户端语言或模型临时标签形成不可重复的桶键

**Given** 同一 CanonicalPOI 适合多个上下文
**When** 构建 AnchorPool 快照
**Then** 可以出现在多个适用分桶中，每个 entry 保存 poi、桶键、rank/score、source class、reason code、refreshedAt、expiresAt 与 policyVersion
**And** 共享 entry 不复制 owner Inspiration、原始链接、私人笔记、选择历史或个人计划上下文

**Given** 一个 CanonicalPOI 来自用户导入、内置清单、高德验证或其他来源
**When** 评估是否允许进入平台共享池
**Then** 通过版本化共享准入策略检查具体分店身份、城市、坐标、验证状态、关闭/可用状态、来源许可和事实新鲜度
**And** 单个用户曾导入、选择或到访不能自动成为共享准入依据；owner-scoped 原始证据和受保护 URL 始终保持私有

**Given** 同一公共地点已由多个来源识别
**When** 进入共享准入与去重
**Then** 以 CanonicalPOI/明确分店为共享身份，只聚合允许公开复用的事实与来源类别
**And** 不暴露贡献 owner 数量、具体用户来源、原始文案或可反推某个用户行为的低频聚合信息

**Given** 候选通过共享准入
**When** 确定桶内排序
**Then** 使用版本化、确定性的评分策略组合季节适配、时段适配、类别匹配、公开质量/热度信号、事实新鲜度、营业可用性与多样性
**And** 缺失信号保持缺失或使用明确保守权重，不伪造评分事实、不使用私人用户偏好，也不让模型输出未经校验地直接成为最终 rank

**Given** 某候选已关闭、迁移、分店仍歧义、跨城市、事实过期或不再满足共享准入
**When** 新快照构建
**Then** 从新快照排除或标记为不可发布，并保留脱敏的排除原因供审计
**And** 不因旧快照仍含该条目就无限延长有效期，也不用品牌级地点替代已失效的具体分店

**Given** 平台准备刷新一个或多个分桶
**When** 运行 AnchorPool refresh
**Then** 在后台任务或明确事件触发路径中构建不可变候选快照，通过校验后原子发布为当前版本
**And** Planner 普通读取不得同步重建整座城市的池，也不得先停用当前快照再逐条写入导致短暂空池

**Given** 新快照构建失败、超时、未达到最低质量门槛或进程中断
**When** 发布事务无法完成
**Then** 保留最近一个仍在有效期内的已发布快照，并记录 typed failure 与下一次有限重试时间
**And** 不发布部分快照、不混用两个 policyVersion，也不把失败任务表示为刷新成功

**Given** 两个 refresh job 同时处理相同桶或旧任务迟到完成
**When** 尝试发布快照
**Then** 使用 generation/version fence 和幂等键只允许当前任务发布一次
**And** 旧任务、重复事件或不同策略版本不能覆盖更新快照、重复 entry 或回退当前版本

**Given** Planner 为当前计划请求平台候选
**When** 读取某一精确桶或明确的通用桶
**Then** 只读取一个已发布且未过期的 AnchorPool snapshot，返回有界 Top-K、稳定顺序、公共来源类别和内部 reason code
**And** 读取本身无外部搜索、无池刷新、无 owner 写入，也不把这些软候选转换为 required、along_route、预约或票务事实

**Given** Planner 在 Story 2.11/2.12 中二次评估 AnchorPool 候选
**When** 某 entry 与当前营业、路线、住宿、日期或其他硬约束不兼容
**Then** Planner 可以跳过该 entry，并保留 `platform_anchor` provenance 与类型化未采用原因
**And** AnchorPool rank 只是基础软排序，不能覆盖用户 required、冻结边界、CanonicalPOI 城市护栏或 Story 2.10 的可信路线事实

**Given** 请求的精确分桶不存在、已过期或候选不足
**When** AnchorPool repository 返回结果
**Then** 返回明确的 `missing/stale/insufficient` 状态和当前策略/快照元数据，而不是在 repository 内隐式搜索小红书、高德或跨城市候选
**And** 跨桶放宽、Top-50、主动素材采集及其执行顺序由独立冷启动填充 Story 负责，本 Story 不隐藏该决策

**Given** 客户端展示由 AnchorPool 进入时间轴或候选区的地点
**When** 渲染名称、理由或来源
**Then** 使用普通地点视觉和简洁自然语言理由，不显示内部 score、rank、policyVersion、质量枚举或其他用户来源
**And** 它不出现必去勾选状态；只有用户后续显式操作才能改变意图或计划版本

**Given** AnchorPool 构建、发布或读取被观测
**When** 写入日志、指标、Sentry 或分析
**Then** 仅记录脱敏城市/桶标识、策略版本、候选数量、排除原因计数、构建耗时、快照年龄、发布状态和 cache hit
**And** 不记录 owner id、私人链接/证据、精确个人计划、token、Cookie、Provider secret 或未裁剪抓取/模型内容

**Given** 当前 `AnchorPoolEntry` 只有 city、poi、rank、active 和 expiry，且读取路径会触发全城 refresh
**When** 实施本 Story 的 brownfield 迁移
**Then** 迁移到支持分桶和不可变快照的模型，并提供对现有城市级 entries 的一次性兼容导入或安全回退
**And** 不删除 CanonicalPOI、BuiltInPoiEntry 或现有有效数据，不要求用户重新导入，也不在迁移窗口把简单旧池误称为完整情境池

**Given** Story 2.13 准备关闭
**When** 使用多季节/时段/类别、通用桶、重复 POI、私人导入来源、关闭地点、分店歧义、过期事实、并发刷新、迟到发布、部分失败、旧模型迁移、缺失/过期/不足桶和 owner 隔离 fixture，并运行 Prisma migration、repository/ranking/refresh worker/Planner integration tests、真实 PostgreSQL、代表性城市数据审计、完整构建和 diff 检查
**Then** 平台具备可审计、可刷新、可回滚且不泄露私人来源的 AnchorPool 版本快照，Planner 可把它作为稳定软候选来源
**And** 小红书主动搜索、搜索登录态/Cookie/验证码、跨桶冷启动编排、外部素材采集、候选直接落位、管理后台和个性化长期画像不被标记为本 Story 已交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 2.14: 每日负荷估算与可解释摘要

As a 旅行者,
I want 查看每天实际安排的负荷和形成原因,
So that 我能判断计划是否符合自己的节奏，并知道哪一天可能需要调整.

**Requirements:** FR28 (target pace comparison), FR32 (published plan hydration), FR51 (day-load generation);
NFR4, NFR5, NFR10, NFR12, NFR23; AR2-AR5, AR7, AR8, AR11, AR12,
AR14, AR15, AR17-AR20; UX-DR2, UX-DR3, UX-DR18, UX-DR19, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 一个单城 PlanRevision 已通过 Story 2.11 的初始发布门禁
**When** 服务端为其生成日负荷
**Then** 为每个旅行日创建或派生唯一的 revision-bound `DayLoadEstimate`，包含 level、coreItemCount、activeMinutes、commuteMinutes、可选步数上下界、最早开始、最晚结束、freeMinutes、reasons、内部 confidence 和 policyVersion
**And** 同一 revision 与策略版本重复计算得到稳定结果，旧 PlanningJob attempt、旧 PlanRevision 或其他 owner 的数据不能覆盖当前估算

**Given** 用户在 S5 选择了 `悠闲`、`从容` 或 `充实`
**When** 当前计划的实际负荷被评估
**Then** 使用版本化阈值独立得到 `较轻 / 适中 / 较满`，并保留目标 pace 与实际 level 供解释和后续校验
**And** 不把目标 pace 直接复制为结果，也不因某一天合理偏离目标就静默移动地点或将计划判定为失败

**Given** 某日包含普通 POI、冻结预约、交通边界、hotel footer、通勤行、候选和附加提示
**When** 计算主要安排数与活动时长
**Then** 只把实际占用该日可用时间的主要活动计入 coreItemCount/activeMinutes，并让冻结事实和边界影响可用时间
**And** hotel footer、相邻通勤展示行、未落位候选、自由时间以及不占时间轴的附加提示不得被重复计为主要安排

**Given** 某日相邻活动存在 Story 2.10 的 RouteFact
**When** 汇总通勤负荷
**Then** 只累计日期、方式和端点均匹配且 status=`known` 的服务端 durationMinutes，并保留 unknown/stale/partial 路段数量作为估算限制
**And** 客户端、Planner 或负荷计算器不得用直线距离、固定速度、过期结果或模型猜测补造通勤分钟

**Given** 系统可以从可信路线距离和版本化活动模型估算步行
**When** 生成 walkingStepsLow/walkingStepsHigh
**Then** 返回保守范围而不是单一精确步数，并记录内部估算来源与策略版本
**And** 依据不足时两个字段保持 nullable，不能用默认步数伪装成已测量数据；步数超出 pace 目标是需解释的软偏离而非自动硬拒绝

**Given** 某日包含首尾日边界、冻结时段或明确自由窗口
**When** 计算 earliestStart、latestEnd 和 freeMinutes
**Then** 以该日可用区间及实际占用的并集计算，不把跨午夜时段截断到错误日期，也不把相邻槽之间的同一段空闲重复累计
**And** 一天跨度较长但保留充分自由时间时不能仅凭最早/最晚时间自动判为较满

**Given** 某日没有活动、只有一个活动、候选不足或由 pace 主动保留自由时间
**When** 生成 DayLoadEstimate
**Then** 仍返回合法的零/低负荷摘要并保留真实自由时间
**And** 不创建橙色 `待安排` 占位、不要求用户填满该日，也不因零活动省略整个旅行日

**Given** S7 时间轴加载当前 PlanRevision
**When** 渲染某日顶部
**Then** 显示稳定的紧凑摘要，例如 `D2 较满 · 3 个主要安排 · 约 1.2-1.5 万步 · 通勤 1 小时 20 分`
**And** 仅展示可用字段；未知通勤使用一条低强调 `部分通勤待核对`，未知步数省略数值并在现有负荷详情解释依据缺失，不为每项估算重复提醒，不显示 `0`、假精度或内部 fallback/quality 标签

**Given** 用户点击日负荷摘要
**When** 打开负荷详情
**Then** 展示主要安排数、步数范围、通勤、最早开始、最晚结束、自由时间和简洁原因，并允许关闭后恢复原日期与滚动位置
**And** 详情不形成时间轴活动、不显示内部 confidence 数值/枚举、计算公式或模型推理；内部 confidence 只用于校验、排序、审计和观测

**Given** 负荷计算只取得部分 RouteFact、活动估算或日边界
**When** 仍能形成诚实的部分摘要
**Then** 返回可用字段、类型化 missing inputs 和自然语言局限说明，同时记录负荷覆盖率
**And** 若核心日期/区间结构无效则由既有发布门禁拒绝计划，不能用空 DayLoadEstimate 掩盖结构错误

**Given** DayLoadEstimate 被写入日志、指标、Sentry、Langfuse 或分析
**When** 记录生成、降级或展示结果
**Then** 仅记录脱敏 level、字段覆盖、unknown route 数、策略版本、耗时和错误类别
**And** 不记录精确私人路线、酒店/行李备注、完整附加要求、受保护链接、token、Provider secret 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置查看负荷
**When** 聚焦、展开、滚动或关闭摘要
**Then** 摘要与详情具备至少 44pt 目标、明确标签/角色、非纯颜色 level 表达、焦点约束/返回、键盘与安全区适配
**And** 长原因、字段缺失、最小支持宽度和动态 hydration 不造成文字溢出、嵌套卡片、布局跳动或无意义动画

**Given** Story 2.14 准备关闭
**When** 使用零活动、单活动、全天密集、充分留白、三种目标 pace、known/unknown/stale 路线、步数缺失、首尾日、跨午夜、酒店留空、重复计算、迟到 attempt 和 owner 隔离 fixture，并运行 OpenAPI/生成类型、DayLoad repository/calculator/Planner/mobile/accessibility tests、真实 PostgreSQL、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 每个已发布旅行日都具有稳定、诚实且可解释的实际负荷摘要，用户可以识别可能需要调整的日期
**And** 连续早起/连续高负荷/恢复时间、天气校验、自动调整、文本 Top-5、手工补点、餐饮选择池和 linked-trip 负荷不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 2.15: 行程后地点搜索与手动候选补点

As a 旅行者,
I want 在高德没有准确搜索结果时使用附近地标补充自己想去的地点,
So that 我仍能保存旅行灵感并获得诚实的近似路线信息，而不会把地标误认为真实目的地.

**Requirements:** FR14, FR32.3, FR44-lite (Epic 2 candidate slice), FR49;
NFR1, NFR5, NFR6, NFR8, NFR21, NFR23; AR2-AR5, AR8, AR10-AR15,
AR17-AR20; UX-DR2, UX-DR3, UX-DR18, UX-DR19, UX-DR32, UX-DR33, UX-DR35
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在查看一个已发布单城计划的 S7 时间轴或候选区
**When** 点击可访问名称为 `添加地点` 的入口
**Then** 在当前计划 shell 内打开同一移动端 Sheet，保留当前日期、滚动位置和关闭后的焦点返回
**And** 本 Story 不增加地图层级，也不因打开搜索创建 PlanRevision、PlaceIntent 或 PlanningJob

**Given** 用户在添加地点 Sheet 输入地点名称或类别
**When** 执行当前计划城市范围内的 AMap keyword 搜索
**Then** 返回最多 5 个文本结果并展示标准名称、地址和服务端可用的距离估计
**And** 不返回跨城静默结果、不显示内部 score/quality 枚举，也不由客户端猜测地址、坐标或距离

**Given** 用户选择一个能够唯一匹配的 AMap 结果
**When** 点击保存到候选
**Then** 创建 owner-scoped `PlanCandidate`，保留 `locationMode=canonical` 与真实 CanonicalPOI 引用，显示在 `其他候选`，并在地点行标注来源为 `我添加的`
**And** CanonicalPOI/明确分店重复项按当前 owner 与 Plan 去重；保存不改变 required/along_route，也不把候选写入时间轴

**Given** AMap 没有返回准确结果，或用户确认现有结果均不是目标地点
**When** 选择 `手动添加`
**Then** 要求填写目标名称，并允许另行搜索、选择当前 Plan 城市内经 AMap 验证的附近地标
**And** 目标输入在 Sheet 往返、搜索重试和键盘收起后保持，不把地标名称自动覆盖为目标名称

**Given** 用户为手动目标选择了同城、可唯一识别的附近地标
**When** 确认保存
**Then** 创建 `locationMode=landmark_proxy` 的 PlanCandidate，分别保存目标 displayName、landmarkPoiId 与服务端解析的地标地址/坐标快照
**And** landmarkPoiId 只作为位置代理，不能写入 candidate.canonicalPoiId，也不能让目标被计作该地标的访问、选择或来源记录

**Given** 系统需要为 `landmark_proxy` 候选展示距离或请求路线预览
**When** 解析该候选的路线端点
**Then** 使用附近地标的服务端地址/坐标计算，并让 RouteFact/响应携带 `endpointResolution=landmark_proxy`、来源、观测时间和 known/unknown/stale 状态
**And** 地点旁持续以次要行内文字显示 `附近估算 · 以{地标名称}为参考`，现有详情保留 `实际位置建议核对` 及所用地标依据，后续落位预览仍显示代理身份；不重复弹出偏差说明，不能把近似值展示为目标精确位置

**Given** 一个手动候选使用附近地标代理
**When** 候选被保存、读取、展示或交给后续编辑流程
**Then** 目标不得继承地标的标准名称、精确地址、营业时间、评分、人均、电话、类别、预约或票务证据
**And** 缺少这些目标事实时保持 unknown/null，不用地标事实或模型推测补齐

**Given** 用户没有选择可用附近地标
**When** 仍选择只保存目标名称
**Then** 允许创建 `locationMode=unresolved` 的 `待定位` 候选并放入 `其他候选`，同时在地点行标注来源为 `我添加的`
**And** 不产生距离/路线估计，不允许直接落位，也不把 unknown 显示为 0 分钟或可达

**Given** 用户选择的地标属于其他城市、仍是品牌级歧义、缺少可信坐标、已关闭或不满足当前验证策略
**When** 服务端验证 manual candidate 请求
**Then** 拒绝作为 `landmark_proxy` 保存并返回稳定的类型化原因，同时保留目标名称供重新选择
**And** 不借用跨城地标绕过 linked-trip 确认，也不把失败请求降级为看似已定位成功

**Given** 同一 owner 重试保存、重复提交或旧客户端响应迟到
**When** candidate command 携带幂等键与 expected candidate/plan revision
**Then** 相同命令至多产生一个候选，stale revision 返回 typed conflict，当前候选和 PlanRevision 不被旧请求覆盖
**And** 其他 owner、Plan 或 Trip 无法通过 candidate id、landmark id、缓存键或路由预览读取或修改该候选

**Given** AMap 搜索、地标解析或路线 Provider 超时、配额耗尽、熔断或弱网
**When** 请求无法返回可靠结果
**Then** 请求失败在当前搜索区域显示 `搜索暂不可用 · 重试`，其他已知降级保留对应事实说明，详细原因按需展开；保留输入和已保存候选，并允许安全重试或只存为待定位，不把失败显示成无匹配
**And** 不伪造 Top-5、坐标、距离或成功状态，也不跳转外部搜索或触发 XHS 关键词搜索

**Given** 搜索和候选行为进入日志、Sentry、Langfuse、指标或分析
**When** 记录成功、无结果、代理选择、待定位、失败或重试
**Then** 只记录脱敏城市/类别桶、结果数量、locationMode、耗时、缓存、Provider 状态和错误类别
**And** 不记录原始搜索词、手动地点名称、精确私人计划、token、Provider secret、其他 owner 数据或未裁剪响应

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用搜索和手动补点
**When** 输入、选择地标、返回修改、保存或关闭 Sheet
**Then** 操作具备至少 44pt 目标、明确标签/角色、焦点约束/返回、键盘和安全区适配，并以文字加图标表达 exact/附近估算/待定位
**And** loading、无结果、弱网、长名称/地址、禁用保存和动态结果不得造成文字溢出、布局跳动、卡片套卡片或只靠颜色传达状态

**Given** Story 2.15 准备关闭
**When** 使用准确 Top-5、零结果、用户否定结果、同城地标、跨城/歧义/关闭地标、无地标、重复候选、幂等重试、stale revision、Provider 失败和 owner 越权 fixture，并运行 OpenAPI/生成类型、Prisma migration、CandidateCatalog/repository/route/mobile/accessibility tests、真实 PostgreSQL、真实 AMap/route staging、移动与桌面浏览器截图、完整构建和 diff 检查
**Then** 用户能够把准确或手动地点诚实地保存为 canonical、附近估算或待定位候选，并在可用时以附近地标进行近似路线计算
**And** 候选直接落位、替换、自由时段填充、Picker intent 修改、XHS 关键词搜索、酒店搜索和时间轴 revision/validation/undo 不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 3: 安全编辑并调整已有行程

### Story 3.1: 分钟级时间轴编辑与全计划撤销

As a 旅行者,
I want 精确修改现有时间轴，并能从全计划范围撤销最近操作,
So that 我可以放心调整行程，同时始终保留可恢复、可校验的当前版本.

**Requirements:** FR8, FR9 (mutation trigger slice), FR21,
FR22 (structural/derived conflict boundary slice), FR49; NFR4, NFR6, NFR8,
NFR10, NFR23; AR1-AR5, AR8, AR11-AR15, AR17-AR20; UX-DR1-UX-DR3,
UX-DR18, UX-DR20-UX-DR22, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** legacy Story 2.2 已在 `codex/story-2-2-timeline-editing` 上实现大量 mutation、版本、EditEvent 和 undo 代码与测试
**When** Sprint Planning/Create Story 将其迁移为 Epic 3 的首个执行 Story
**Then** 新 Story 携带 `legacy_story_id: 2-2-timeline-editing-undo-and-history` 与原 `baseline_commit`，继续使用原分支/Git 历史并先完成 keep/change/remove 审计
**And** owner guard、幂等、expected revision、不可变 PlanVersion/PlanRevision、EditEvent、补偿式撤销及仍符合本合同的测试必须保留，不得以重新实现为由丢弃

**Given** owner 正在 S7 时间轴查看一个当前单城 PlanRevision
**When** 长按可编辑地点或点击具备可访问名称的操作按钮
**Then** 打开移动端编辑 Sheet，先展示地点名称与所属日期，再展示上一段/下一段通勤，最后展示替换、移动、调时和删除动作
**And** 页面与 Sheet 不显示 Nomad 标识、计划版本、`编辑安排` 标题、操作列表后的重复通勤事实或底部/单日 `最近操作` 区域

**Given** 用户选择替换一个已有时间轴地点
**When** 打开替换候选并确认一个当前 owner、当前单城 Plan 中已可定位且满足基础结构约束的 CanonicalPOI 候选
**Then** 通过类型化 replace command 创建新 revision，并保留候选来源、原始 intent 与审计关联
**And** unresolved 或跨城候选不得用于替换；`其他候选` 中标注为 `我添加的` 的 landmark-proxy/free-time 显式落位属于 Story 3.2，不是本 Story 的前向依赖

**Given** 用户编辑 Dn 的地点
**When** 查看移动日期动作
**Then** 展示 `移至前一天 / 移至其他 / 移至后一天`，其中 `移至其他` 只列出当前单城 Segment 内非相邻的其他有效日期
**And** 第一天禁用前一天、最后一天禁用后一天；三日行程 D2 因没有非相邻日期而禁用 `移至其他`，且任何跨城市/跨 Segment 目标均不出现

**Given** 用户选择一个有效移动目标
**When** 服务端应用 move command
**Then** 在目标日使用确定性顺序和不重叠规则放置地点，并返回新的 current revision 与受影响日期
**And** 无可用位置、越界、冻结事实或结构冲突时返回稳定 typed error，源日、目标日和当前 revision 均保持不变

**Given** 用户点击地点的开始或结束时间
**When** 使用时钟/闹钟式控件调整时间
**Then** 接受每一个有效分钟，快速滚动只改变滚动灵敏度，不要求 15 分钟对齐，也不显示 30/60 分钟吸附文案或控件
**And** AI 初始编排仍可内部按 15 分钟精度生成，但该内部策略不能限制或回写用户输入

**Given** 调时区间跨过午夜
**When** 用户设置例如 D2 23:00 到 D3 01:00 的正时长区间
**Then** 开始栏和结束栏分别显示所属日期/日号并保存正确 local datetime
**And** 零时长、负时长、超出计划或 Segment 边界、无法解析的本地时间以及最后一日越界均在写入前被拒绝

**Given** 编辑 Sheet 需要展示当前地点与相邻地点间的交通
**When** 服务端存在匹配端点、日期、方式和有效状态的 RouteFact
**Then** 展示其可用时长与方式；unknown、stale、timeout 或缺失时在对应路线行显示低强调的 `路程时间暂缺`，具体原因与依据在现有详情按需查看，不堆叠弹窗或弱化依赖可达性的执行门禁
**And** 客户端不得用直线距离、固定速度、旧缓存、模型猜测或其他日期事实补造交通时长

**Given** mutation 存在越权、错误 owner、重复键不同 payload、陈旧 expected revision、格式错误、计划外日期或冻结预约/票务硬冲突
**When** 服务端在事务发布前验证 command
**Then** 拒绝写入并返回稳定 400/403/404/409 类型化响应，current revision、EditEvent 和 undo eligibility 均不改变
**And** 相同 owner 以相同幂等键和相同 payload 重放已完成命令时返回相同确定性结果，不产生第二个版本

**Given** 一个 replace/move/retime/delete command 结构合法并成功发布新 revision
**When** mutation 可能影响营业、通勤、时长、日负荷或其他派生可行性
**Then** 立即为精确的新 revision 创建或触发增量 ValidationRun，并返回 `pending / clean / conflicted / unavailable` 等真实状态
**And** derived conflict 不回滚已经合法发布的 revision；当前 Story 显示冲突状态并提供撤销/手工再编辑，类型化修复方案和 FixSheet 由后续 Story 3.4 增量交付

**Given** 用户删除一个时间轴地点
**When** delete command 成功
**Then** 原占用区间成为明确自由时间，并在符合来源策略时把地点恢复到候选区且保留 source attribution 与原 PlaceIntent
**And** required 地点进入未解决必去/对应候选分组，不静默降级为普通候选；删除不会创建要求用户填补的橙色 `待安排` 任务

**Given** 全计划当前没有新近可撤销 mutation
**When** S7/S8 时间轴头部渲染计划级操作
**Then** 右上角显示带可访问名称的历史图标；任一成功 mutation 后原位切换为 `撤销 8` 倒计时按钮
**And** 控件跨日期共用同一 plan scope，切换日期不会复制、隐藏或重置倒计时，页面底部不再渲染撤销条或最近操作栏

**Given** 最近 mutation 的八秒 token 仍有效
**When** owner 点击 `撤销 8`
**Then** 只对最新符合条件的 mutation 创建一次补偿 revision 与关联 undo EditEvent，并刷新到该新 current revision
**And** token 过期后，历史入口至多再开放一条最新符合条件的额外撤销；本 Story 不提供任意历史浏览、跨多版本选择或 FR43 回滚

**Given** undo 请求已使用、过期、跨 owner、引用陈旧 revision、目标已被撤销或其后存在使其不再 eligible 的命令
**When** 服务端验证 undo lineage
**Then** 返回稳定 typed error 并保留 current revision 和最新合法 undo 入口
**And** undo 永远追加新版本而不删除、覆盖或重新指向旧 PlanVersion；撤销后再编辑仍形成可审计的线性/语义 lineage

**Given** edit/undo 正在保存、断网、Provider/RouteFact 不可用或收到 409 stale revision
**When** 移动端进入 loading、failure、retry 或 refresh 状态
**Then** 禁用重复提交，保留当前可见时间轴、日期和滚动位置；409 先诚实提示并刷新 current revision，不乐观覆盖服务器状态
**And** Sheet 关闭/重试后焦点返回原入口，失败不会消费有效撤销机会或清空用户尚未提交的时间输入

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用编辑与撤销
**When** 打开 Sheet、切换动作、滚动时间、确认、失败或关闭
**Then** 所有目标至少 44pt，图标具备标签/角色，选中/禁用及原因不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区和 reduced motion
**And** 长地点名、跨日标签、unknown 通勤、倒计时和动态错误不得造成文字溢出、卡片套卡片、布局跳动或无节制 live-region 播报

**Given** 编辑、验证触发和撤销行为进入日志、Sentry、Langfuse、指标或产品分析
**When** 记录开始、成功、冲突、失败、幂等重放或撤销
**Then** 只记录脱敏 command type、scope、revision delta、validation status、耗时和错误类别
**And** 不记录 POI 名称、精确坐标、用户自由文本、酒店/行李备注、Provider secret、受保护来源 URL 或其他 owner 数据

**Given** Story 3.1 准备关闭
**When** 使用 replace、任意有效日期移动、首末日/三日 D2 禁用、一分钟/跨午夜调时、删除候选恢复、known/unknown RouteFact、结构拒绝、派生冲突触发、幂等/并发/owner 隔离、八秒/额外一条撤销和失败恢复 fixture，并运行 OpenAPI/生成类型、domain/repository/API/mobile/accessibility tests、真实 PostgreSQL、必要的 route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以在一个稳定时间轴中精确编辑并安全撤销，而所有成功 mutation 均产生可追踪 revision 并触发当前版本校验
**And** Quick/HQ 采用、seed reset 用户路径、候选显式落位、住宿编辑、FixSheet 自动修复、AI 调整、linked trip、餐饮、清单、细节/导出和完整历史浏览不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 3.2: 候选地点受控落位与自由时间填充

As a 旅行者,
I want 把已保存的候选地点明确加入、替换或填入计划中的可用时间,
So that 我可以继续完善计划，同时在确认前看清位置、交通、影响和版本变化.

**Requirements:** FR8 (candidate-placement slice), FR9 (mutation trigger slice), FR21,
FR22, FR32.3, FR44-lite (Epic 3 placement slice), FR49; NFR1, NFR4-NFR6,
NFR8, NFR10, NFR21, NFR23; AR2-AR5, AR8, AR10-AR15, AR17-AR20;
UX-DR2, UX-DR3, UX-DR18-UX-DR20, UX-DR22, UX-DR32, UX-DR33, UX-DR35
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 打开当前单城 PlanRevision 的候选入口
**When** 候选列表完成加载
**Then** 一级只按 intent 分为 `未安排的必去 / 顺路候选 / 其他候选`，地点行再标注 `来自灵感 / 城市热门 / 附近推荐 / 我添加的` 等 provenance
**And** intent、provenance 与 `canonical / landmark_proxy / unresolved` locationMode 独立保存；同一候选只出现一次，不使用泛化 `AI` 来源，也不把 provenance 做成互斥一级分组

**Given** 用户选择一个尚未进入当前时间轴的可落位候选
**When** 打开 `怎么加入计划` Sheet
**Then** 提供 `推荐位置 / 选择日期和时间 / 替换已有地点 / 填入自由时间` 四种类型化动作，并保留候选名称、intent、provenance 和位置状态
**And** 这里只选择命令，不立即修改时间轴；关闭后恢复原日期、候选展开状态、滚动位置和焦点

**Given** 用户选择 `推荐位置`
**When** 服务端基于当前精确 revision 评估营业时间、计划边界、冻结事实、相邻 RouteFact、停留时长、日负荷和明确自由时间
**Then** 至多返回一个可解释的推荐日期/区间及前后通勤摘要，并说明推荐位置的简短事实理由
**And** unknown/stale 路线、未知必要时长或缺少足够空闲时不得伪装为安全推荐，也不得由客户端用直线距离或固定速度补造；缺失路线分钟只在对应摘要行写 `路程时间暂缺`，详细原因按需展开，原推荐/落位门禁保持

**Given** 用户选择 `选择日期和时间`
**When** 为当前单城 Segment 选择有效日期、开始和结束时间
**Then** 支持每一分钟的合法输入，展示候选预计停留时长与前后可用 RouteFact，并允许用户在确认前返回修改
**And** 时长未知时必须由用户明确给出正时长；区间不得跨越计划/Segment 边界、冻结事实或形成结构重叠

**Given** 用户选择 `替换已有地点`
**When** 选择一个当前 revision 中允许替换的非冻结地点
**Then** 预览被替换地点、候选地点、保留/变化的日期时间及前后交通，再复用类型化 replace command
**And** 发布成功后，被替换地点按其原 intent 与 provenance 恢复到正确候选分组，不被删除、改写为用户补充或静默降级

**Given** 用户选择 `填入自由时间`
**When** 当前 revision 存在一个或多个显式、时长足够且不跨边界的自由区间
**Then** 只列出真实可用区间并预览填入后的时间、前后地点和交通；用户也可返回其他落位方式
**And** 不移动已排地点、不挤压冻结/预约槽、不把 pace 留白自动改造成必须填满的任务，也不创建橙色 `待安排` 占位

**Given** 一个 `required` 候选此前因约束未能落位
**When** 用户通过任一合法方式确认加入
**Then** 新 revision 将该 PlaceIntent 标记为已解决，同时保留 `required` 与原 provenance
**And** `along_route` 或 `unselected` 候选同样保留原 intent；落位动作不得偷偷改变 Picker 选择语义

**Given** 同一 CanonicalPOI、同一 candidate lineage 或等价去重键已经存在于当前时间轴
**When** 用户再次尝试落位
**Then** 阻止重复创建并提供查看既有安排的路径
**And** 不产生新 revision、EditEvent、ValidationRun 或可撤销 token，也不靠名称差异绕过去重

**Given** 候选的 `locationMode=canonical`
**When** 生成推荐、路线预览或发布命令
**Then** 仅使用对应 CanonicalPOI 与有效事实快照作为位置端点，并继续显示标准名称和必要来源
**And** 分店歧义、跨城身份变化或事实已不可用时先返回 typed degradation，不静默换成另一分店

**Given** 候选的 `locationMode=landmark_proxy`
**When** 生成路线与落位预览
**Then** 地点旁以次要行内文字显示 `附近估算 · 以{地标名称}为参考`，现有详情保留 `实际位置建议核对`，落位预览仍明确显示代理身份和所用地标，不重复弹出偏差说明；RouteFact 携带 `endpointResolution=landmark_proxy`
**And** 只借用地标的地址/坐标作为路线端点，目标不得继承地标名称、营业时间、评分、人均、电话、类别、预约或票务事实

**Given** 候选仍为 `unresolved`、缺少可用位置、属于另一城市/Segment，或 landmark proxy 已失效
**When** 用户查看落位动作
**Then** 禁用推荐、替换和自由时间落位并给出可执行原因，例如先定位或进入 linked-trip 新增城市流程
**And** 不借用其他城市地标、不创建零分钟交通，也不通过本 Story 绕过跨城确认

**Given** 系统无法形成一个可信推荐位置但候选仍可由用户明确安排
**When** 打开落位 Sheet
**Then** 保留 `选择日期和时间` 与 `稍后处理`，并诚实说明当前无法推荐
**And** 不自动创建临时槽、不暂停其他 PlanningJob，也不要求用户为了关闭 Sheet 填满时间轴

**Given** 用户已经选定一种落位方式
**When** 进入最终确认
**Then** 预览精确日期/时间、位置状态、相邻交通、替换或自由时间影响，以及保存后将执行可行性检查
**And** 只有最终确认按钮发送一次 mutation command；浏览候选、切换方案、打开预览或返回修改均不得创建版本

**Given** command 存在越权、陈旧 expected revision、重复键不同 payload、结构重叠、冻结事实、无效区间或当前 Segment 外目标
**When** 服务端在事务发布前验证
**Then** 拒绝写入并返回稳定 typed error，current revision、candidate 状态、EditEvent 和 undo eligibility 均不改变
**And** 可发布但可能产生营业、通勤、负荷或其他派生冲突的命令不在客户端伪判为结构失败

**Given** 一个 candidate placement command 结构合法并成功发布
**When** 新 revision 成为 current
**Then** 原子写入不可变 PlanRevision/PlanVersion、EditEvent、candidate resolution 状态与精确 revision 绑定的增量 ValidationRun，并返回 `pending / clean / conflicted / unavailable`
**And** 派生冲突不静默回滚或自动重排；界面显示结果并提供继续手工编辑或全计划撤销，类型化 FixSheet 修复留给 Story 3.4

**Given** 成功落位后的全计划 `撤销 8` 或额外一条有效历史撤销仍可用
**When** owner 撤销该 candidate mutation
**Then** 追加补偿 revision，恢复原时间轴、候选 intent/provenance/locationMode、被替换地点和相应 unresolved 状态
**And** 撤销不删除历史版本，也不把恢复候选错误归入另一个一级组或来源

**Given** 落位 Sheet 打开期间 current revision 被其他命令更新，或网络/Route Provider 失败
**When** 用户确认、重试或刷新
**Then** stale revision 返回 409 并要求基于最新计划重新预览；失败保留尚未提交的选择和可见计划，不消费候选或撤销机会
**And** 相同 owner 使用相同幂等键和相同 payload 重放时返回同一确定性结果，其他 owner 无法读取或修改候选、预览、revision 或缓存事实

**Given** 候选落位行为进入日志、Sentry、Langfuse、指标或产品分析
**When** 记录列表、预览、发布、冲突、撤销或失败
**Then** 只记录脱敏 intent、provenance 类别、locationMode、command type、revision delta、validation 状态、耗时和错误类别
**And** 不记录 POI 名称、精确坐标、私人路线、受保护来源 URL、用户自由文本、Provider secret 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用候选列表与落位 Sheet
**When** 展开分组、选择动作、预览、确认、失败或关闭
**Then** 目标至少 44pt，图标具备可访问名称，分组/来源/位置/禁用原因不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区和 reduced motion
**And** 长地点名、多个来源、unknown 通勤、动态候选数和错误不得造成文字溢出、卡片套卡片或布局跳动

**Given** Story 3.2 准备关闭
**When** 使用三类 intent 分组、四类 provenance、canonical/landmark_proxy/unresolved、四种落位动作、required 解决、重复 POI、无推荐、冻结/结构拒绝、派生冲突、幂等/并发/owner 隔离和撤销 fixture，并运行 OpenAPI/生成类型、Prisma migration、candidate/revision/route/validator/mobile/accessibility tests、真实 PostgreSQL、必要的 AMap/route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以从清晰分类的已保存候选出发，经过预览与确认把可信地点安全加入当前计划，并能撤销到完全一致的候选状态
**And** 本 Story 不实现新地点搜索、Picker intent 修改、跨城建段、住宿编辑、FixSheet 自动修复、自由文本 AI 调整、餐饮选择池、清单、细节完善、导出或完整历史浏览

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 3.3: 规划后单晚住宿、早餐与行李修改

As a 旅行者,
I want 从每天的住宿栏修改该晚酒店、早餐和行李,
So that 计划完成后仍能修正住宿安排，并在保存前了解可能影响.

**Requirements:** FR9, FR21, FR22, FR36 (post-plan accommodation slice), FR41,
FR44-lite (hotel search), FR49, FR51 (stay/luggage impact slice); NFR1, NFR4,
NFR6, NFR8, NFR10, NFR21, NFR23; AR2-AR5, AR8, AR11-AR15, AR17-AR21;
UX-DR2, UX-DR3, UX-DR9, UX-DR10, UX-DR18, UX-DR22, UX-DR32-UX-DR34
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在查看一个已发布计划的某个住宿日
**When** 点击该日时间轴底部具备可访问名称的住宿栏
**Then** 在当前计划 shell 内打开标题为对应日期/住宿晚的单晚住宿 Sheet，而不是直接跳回完整多晚流程
**And** Sheet 关闭后恢复原日期、时间轴滚动位置和触发入口焦点，不重复显示品牌、计划版本或另一套导航 shell

**Given** 单晚住宿 Sheet 已打开
**When** 渲染可编辑内容
**Then** 复用 Story 2.5 的 `StayNightEditor` 字段和状态规则，依次提供酒店、早餐、行李与 `管理全部住宿`
**And** 三个子项可独立修改；编辑行李不要求先更换酒店，早餐不提升为计划级独立问卷，已发布值与未提交草稿清晰区分

**Given** 用户选择编辑该晚酒店
**When** 输入酒店名称、搜索或清空当前酒店
**Then** 使用当前 Plan 城市内的 AMap 文本 Top-5 匹配，允许选择唯一 CanonicalPOI、明确留空或稍后决定
**And** 不展示地图、不根据灵感静默代选酒店、不把歧义分店当作已匹配，也不因清空酒店自动清空早餐或行李

**Given** AMap 酒店搜索无结果、超时、配额耗尽、熔断或弱网
**When** 用户仍在单晚 Sheet 中
**Then** 保留搜索词、原酒店和其他未提交字段，提供重试、明确留空或取消修改；当前搜索区域区分真实无匹配与请求失败，前者显示 `未找到` 并保留已有留空/取消路径，后者显示 `搜索暂不可用 · 重试`，详细原因按需查看，不因此新增规划后手工酒店定位路径
**And** 不伪造 Top-5、坐标、成功匹配或 near-hotel 偏好，也不在失败时发布任何 revision

**Given** 用户编辑早餐
**When** 选择 `包含 / 不包含 / 未知`
**Then** 保存与该晚 StayRevision 关联的 tri-state 事实，并允许酒店留空时独立确认
**And** `未知` 是诚实有效状态，不被显示为包含早餐、Provider 已验证或用户漏填

**Given** 用户编辑行李
**When** 系统根据相邻住宿、日期边界和交通事实构建选项
**Then** 仅展示当前上下文合法的 `留在原酒店 / 带到新酒店 / 放在车站或机场 / 随身携带 / 寄送 / 私家车 / 其他 / 无大件行李 / 未决定` 子集及必要说明
**And** 首晚不得显示不存在的原酒店；连住默认留在当前酒店，换住默认带到新酒店，但默认值必须由用户确认且不能覆盖已明确选择

**Given** 用户选择车站/机场寄存或其他依赖取回的行李方式
**When** 确认该执行方式
**Then** 要求选择同城、经验证且适用于当前边界的 storage POI，以及必要的寄存/取回时间或明确未决定状态
**And** 缺少可执行取回路径时不把行李处理显示为已完成，也不借用其他城市或无可信事实的地点

**Given** 用户需要连续检查或修改多个住宿晚
**When** 点击 `管理全部住宿`
**Then** 打开 Story 2.5 的完整多晚住宿流程，自动滚动并静态高亮当前住宿晚，不使用闪烁或报错式动画
**And** 返回时恢复原时间轴上下文；多晚修改仍使用同一 owner、expected revision、预检查、确认和不可变发布合同，不通过旧 draft 路径覆盖已发布计划

**Given** 用户查看最后离开日且该日不产生新的住宿晚
**When** 点击底部的退房/行李入口
**Then** 只编辑最后住宿的 checkout 关系、早餐事实和离开前行李去向，不创建额外 StayRevision 住宿晚
**And** 单向离开不得把行李留在原酒店，除非存在显式、可执行且将返回取回的约束

**Given** 用户修改了字段但尚未点击保存
**When** 在单晚 Sheet 内切换子项、收起键盘、打开选择 Sheet 或返回
**Then** 本地草稿保持稳定，时间轴、current revision、ValidationRun 和全局 undo 均不改变
**And** `受影响内容预览` 不作为酒店/早餐/行李编辑器中的常驻卡片

**Given** 用户点击保存且变化包含酒店 CanonicalPOI/留空状态、行李执行方式、寄存地点或关键寄存/取回时间等实质变化
**When** 服务端针对当前 expected revision 执行只读影响预检查
**Then** 在任何持久化之前条件式打开 `AccommodationChangeImpactSheet`
**And** 只改早餐、CanonicalPOI 未变化的名称修正，或行李描述变化但执行语义未变时不打开该 Sheet，而是直接进入发布与正式校验

**Given** 条件式影响 Sheet 打开
**When** 展示本次住宿变化
**Then** 显示日期、旧值与新值，并按实际关联说明可能受影响的晚间活动半径、次日早间出发位置、退房/移动/入住缓冲和行李处理
**And** 文案只说明影响范围，不提前宣称已发生冲突、不提供虚假的精确重排结果，并提供 `返回修改 / 确认更改`

**Given** 影响预检查无法完成、RouteFact 不可用或 Provider 超时
**When** 仍可形成结构合法的住宿命令
**Then** 在原影响预览中显示 `暂时无法预估，保存后会检查`，具体缺失原因按需展开，允许用户返回或明确继续；实质变化的原预览与确认保留，不把 unavailable 写成无影响
**And** 不把 unavailable 当作无影响，也不伪造路线、缓冲或 clean 状态；确认后仍必须运行正式增量校验

**Given** 命令存在越权、陈旧 expected revision、重复键不同 payload、错误住宿晚、无效日期、非法行李转换或缺少必须的寄存/取回事实
**When** 服务端在事务发布前验证
**Then** 返回稳定 400/403/404/409 typed error，current Plan/Stay/Luggage revision、ValidationRun、EditEvent 和 undo eligibility 均不改变
**And** 失败后保留用户草稿与当前时间轴，不把结构错误降级为可发布警告

**Given** 用户在必要的影响 Sheet 中确认，或本次变化无需影响 Sheet
**When** accommodation mutation 成功发布
**Then** 原子创建新的不可变 `StayRevision` 和/或 `LuggageTransitionRevision`、关联 PlanRevision/PlanVersion 与 EditEvent，并更新 current pointer
**And** 相同 owner 以相同幂等键和相同 payload 重放时返回相同确定性结果，不产生第二套住宿、行李或计划版本

**Given** accommodation mutation 已发布
**When** 酒店、早餐或行李可能影响营业、通勤、日负荷、早晚半径、入住/退房或寄存可行性
**Then** 为精确的新 revision 立即创建或触发增量 ValidationRun，并返回 `pending / clean / conflicted / unavailable`
**And** 派生冲突不回滚合法发布的住宿变化；时间轴显示真实状态并允许撤销或继续手工编辑，类型化修复方案由 Story 3.4 交付

**Given** 用户确认了酒店或行李变化
**When** 新 revision 发布并返回时间轴
**Then** 系统不得静默移动、删除、替换或重排任何 POI，也不得自动询问/执行 `仅晚段 / 整日` 重排
**And** FR42 自动重排继续明确属于 Post-MVP；未来任何 AI 调整必须经过独立方向选择、diff 预览和确认

**Given** 成功住宿修改后的全计划 `撤销 8` 或额外一条有效历史撤销仍可用
**When** owner 撤销该 mutation
**Then** 追加补偿 revision，精确恢复先前酒店、早餐、行李、相邻 Stay/Luggage 引用和相应校验状态
**And** 不删除历史 revision、不把空酒店恢复成虚构酒店，也不遗漏多晚原子命令中的任一受影响住宿晚

**Given** 单晚或多晚编辑期间 current revision 被其他命令更新，或应用恢复到后台后继续提交
**When** expected revision 已 stale
**Then** 返回 409，保留未提交输入并要求基于最新住宿/时间轴重新检查影响
**And** 不乐观覆盖服务器状态、不消费撤销机会，也不让其他 owner、Plan 或 Trip 通过 stay/luggage id 读取或修改该数据

**Given** 住宿修改行为进入日志、Sentry、Langfuse、指标或产品分析
**When** 记录打开、搜索、预检查、确认、发布、校验、撤销或失败
**Then** 只记录脱敏 command type、字段类别、revision delta、impact/validation 状态、Provider 状态、耗时和错误类别
**And** 不记录酒店名称/精确坐标、完整行李备注、寄存细节、私人路线、搜索词、Provider secret、受保护来源 URL 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用住宿编辑
**When** 打开单晚/多晚 Sheet、搜索、选择、保存、查看影响或返回
**Then** 目标至少 44pt，图标具备标签/角色，选中/未知/禁用及原因不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区和 reduced motion
**And** 长酒店名、空酒店、多个行李状态、动态错误和影响列表不得造成文字溢出、卡片套卡片、布局跳动或闪烁定位

**Given** Story 3.3 准备关闭
**When** 使用单晚、连住、换住、多次换住、空酒店、首次补充/更换/清空、早餐三态、独立行李修改、车站/机场寄存、最后离开、管理全部住宿、影响/无影响、预检查 unavailable、结构拒绝、派生冲突、幂等/并发/owner 隔离和撤销 fixture，并运行 OpenAPI/生成类型、Prisma migration、Stay/Luggage/revision/validator/mobile/accessibility tests、真实 PostgreSQL、AMap/route staging、当前专属移动/桌面原型与浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以在计划完成后从当日上下文安全修改住宿、早餐和行李，并在实质变化发布前理解影响范围
**And** 本 Story 不实现静默/自动重排、FR42、FixSheet 自动修复、AI 自由文本调整、跨城 transfer/住宿联动、餐饮选择池、清单、细节完善、导出或任意历史版本浏览

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 3.4: 增量校验与类型化冲突修复

As a 旅行者,
I want 在调整计划产生冲突后查看并选择安全的修复方案,
So that 我可以解决问题，同时保留自己刚刚做出的修改与完整版本记录.

**Requirements:** FR9, FR14 (route/weather facts), FR21, FR22, FR49, FR51;
NFR1, NFR4-NFR6, NFR8-NFR10, NFR21, NFR23; AR2-AR5, AR8,
AR11-AR15, AR17-AR20; UX-DR2, UX-DR3, UX-DR18, UX-DR22, UX-DR23,
UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 3.1-3.3 的任一合法 mutation 成功发布新 PlanRevision
**When** mutation 可能影响营业、通勤、停留时长、住宿、行李、日负荷或可靠天气约束
**Then** 为精确的 `inputRevision` 和受影响 scope 创建或复用一次幂等增量 `ValidationRun`
**And** run 至少携带 `pending / clean / conflicted / unavailable` 状态、类型化 issues、可用 alternatives 与 factRefs；旧 revision 的迟到结果不得覆盖当前计划状态

**Given** command 在发布前存在结构重叠、无效区间、越权、错误 owner/Plan、冻结预约/票务冲突或计划/Segment 边界突破
**When** command validator 执行结构门禁
**Then** 拒绝 mutation 并返回稳定 typed error，不创建新的 current revision、冲突 banner、FixSheet 方案或 undo token
**And** 结构错误不得先发布再包装成可修复的派生冲突，已有 current revision 和最新合法 ValidationRun 保持不变

**Given** mutation 结构合法但对营业、路线、时长、酒店/行李、负荷或其他派生事实产生问题
**When** 新 revision 已发布并完成增量校验
**Then** 保留该用户确认过的新 revision，并以类型化 issue 记录 affected dates/slots、severity、hard/soft、原因代码和可追溯事实引用
**And** 不静默回滚、不自动移动地点，也不把 unknown/stale 外部事实伪装成确定冲突或确定安全

**Given** 当前 revision 的 ValidationRun 仍为 `pending`
**When** S7/S8 时间轴渲染
**Then** 使用紧凑、非阻塞的 `正在检查这次调整` 状态并允许用户继续浏览当前计划
**And** 不显示假进度、不冻结无关日期、不重复创建 run，也不让旧 run 的 pending 状态遮挡更新 revision

**Given** 当前 revision 的 ValidationRun 完成且没有 hard/soft issue
**When** 时间轴刷新为 `clean`
**Then** 移除临时检查状态并保持正常时间轴，不长期显示绿色“校验通过”卡片
**And** 不改变完成提示、候选、住宿、undo 或任何计划内容，也不为 clean 结果创建 EditEvent

**Given** 当前 revision 存在一个或多个冲突
**When** 时间轴展示校验结果
**Then** 只有 soft issue 时显示一个低强调入口 `有N项建议核对 · 查看`，N 为 current revision 的实际 soft issue 数量，具体日期、原因和修复方案进入原 FixSheet/整体核查按需展开；包含任一 hard issue 的 hard-only 或 mixed 状态继续显示简短计划级冲突 banner，保留总数、最高严重级别、受影响日期和可访问的 `查看解决方案`，不得用弱入口掩盖 hard
**And** 建议入口或 banner 绑定 current revision、跨日期可达且不复制成每个日期的独立状态；切换日期不清除、重置或重复计算冲突，不自动打开 FixSheet、不抢焦点、不要求逐项确认；用户收起/未展开不改变 hard/soft 判断、后续 gate 或真实检查状态

**Given** 用户点击当前冲突 banner 或 soft-only 建议核对入口
**When** 打开 `FixSheet`
**Then** 按 affected date/slot 展示清晰问题，例如闭店、无法按时到达、时长不足、酒店/行李缓冲不足或负荷过高，并提供零个、一个或多个类型化安全方案
**And** 不展示 chain-of-thought、内部 score/quality 枚举、原始 Provider payload 或泛化的一键“AI 修复”承诺

**Given** Validator 能为某个 issue 形成安全方案
**When** 构建 alternatives
**Then** 每个方案说明实际动作与主要取舍，例如提前离开、缩短非冻结活动、替换为附近候选、移动非冻结地点或恢复上一版本
**And** 方案不得移动/缩短冻结预约、删除 required intent、跨 Segment 偷换地点、使用 unresolved 候选，或依赖 unknown/stale 路线冒充可行

**Given** 用户选择一个 FixSheet 方案
**When** 查看应用前预览
**Then** 展示字段级 before/after diff、受影响日期/槽位、前后交通、预计解决的问题以及仍会保留的 warning
**And** 预览、切换方案、展开详情、返回修改或关闭 Sheet 均不创建 PlanRevision、EditEvent、ValidationRun 或 undo token

**Given** 当前 ValidationRun 同时包含多个冲突
**When** 一个方案只能安全解决其中一部分
**Then** 明确列出 `将解决` 与 `仍需处理` 的 issue 数量和范围，并允许用户确认部分修复或返回选择其他方案
**And** 不把部分方案标记为“全部已修复”，应用后必须对完整新 revision 重新校验

**Given** 当前 issue 没有安全自动方案、需要用户选择新地点/日期，或事实不足以形成建议
**When** FixSheet 加载完成
**Then** 保留当前计划并提供与问题相关的手工编辑入口、撤销最近修改或稍后重试
**And** 不生成勉强方案、不删除冲突项、不用自由时间掩盖 required/frozen 问题，也不阻止用户关闭 Sheet

**Given** 路线、营业、天气或其他外部事实超时、配额耗尽、熔断、歧义、unknown 或 stale
**When** Validator 或方案生成需要该事实
**Then** 记录类型化 unavailable/degraded fact，界面说明暂时无法完成对应检查或方案，并只保留不依赖该事实的可信 alternatives
**And** 客户端不得估算通勤、猜测营业、把季节性天气说成实时预报，或把 Provider 失败默认为 clean

**Given** 行程日期进入可靠天气预报范围且 WeatherContext 携带来源、observedAt、validUntil 和有效 quality
**When** 天气会使当前安排产生可解释风险
**Then** Validator 可产生天气 issue 或 `雨天方案`，但必须与其他方案一样先展示事实限制与 diff 再确认
**And** 远期日期只允许季节性提示，可在天气相关摘要就近显示一条 `天气临近出发再核对`，详细缺失/来源在现有天气详情按需查看，不为每项普通建议重复提醒；陈旧/低质量天气不得触发精确冲突或自动改写计划，已有可靠证据的恶劣天气或不可行问题仍按实际严重性及时显示

**Given** mutation 影响两个日期、连续早起/高负荷、恢复时间、换住或跨午夜活动
**When** 增量 scope 扩展到相关日期
**Then** 基于新 revision 重新计算受影响 `DayLoadEstimate` 和跨日约束，并在 issue 中说明关联日期
**And** 不只校验当前可见日期，也不把缺失步数、unknown route 或零活动错误解释为确定安全/确定过载

**Given** 用户在 FixSheet 最终确认一个方案
**When** apply command 携带 owner、idempotency key、expected current revision、source ValidationRun id 和 alternative id
**Then** 服务端重新验证方案仍适用于该精确 revision，并在一个事务中应用完整类型化 command set、创建新不可变 revision 与关联 EditEvent
**And** 相同 owner 以相同键/相同 payload 重放返回同一结果；不同 payload、过期 run、stale revision 或其他 owner 请求返回 typed conflict，不部分发布

**Given** 修复方案应用成功
**When** 新 revision 成为 current
**Then** 显示标题 `做了以下调整` 的结果 Sheet，仅列实际发生的字段变化和仍存在的问题，并立即为新 revision 运行下一次增量校验
**And** 不宣称所有问题已解决，直到新 ValidationRun 返回真实 clean；结果说明不暴露模型推理或未实际执行的建议

**Given** 修复 mutation 已成功发布
**When** 时间轴恢复交互
**Then** 该 mutation 进入全计划 `撤销 8` 与额外一条 eligible undo 合同
**And** 撤销追加补偿 revision，恢复修复前计划及对应校验状态，不删除历史版本或复用陈旧 FixSheet

**Given** 当前 revision 存在 hard conflict
**When** 用户尝试进入行程细节完善或导出
**Then** 对精确 revision 返回稳定 gate，说明需要解决的 hard issue 并提供返回 FixSheet/手工编辑/撤销路径
**And** soft warning 不伪装成 hard block；用户可以继续，后续页面以同一低强调 `有N项建议核对 · 查看` 入口保持真实风险可见且 revision 绑定，详情进入已有问题/核查界面，不新增已读或逐项确认，也不称全部检查通过

**Given** FixSheet 打开期间 current revision、相关事实或 ValidationRun 已更新
**When** 用户尝试应用旧方案
**Then** 拒绝为 stale alternative 发布，保留最新 current plan，并要求刷新冲突和重新预览
**And** 不自动把旧 diff 套到新 revision，也不消费当前 undo 机会或丢失可恢复的 Sheet 上下文

**Given** 修复事务、重新校验或客户端刷新失败
**When** 用户收到 apply failure、网络中断或 Provider unavailable
**Then** current pointer 只能指向完整提交的旧 revision 或完整提交的新 revision，绝不暴露部分 command set
**And** 界面保留当前计划、问题上下文和安全重试/手工/撤销路径；失败不得显示 `做了以下调整`

**Given** 校验与修复行为进入日志、Sentry、Langfuse、指标或产品分析
**When** 记录触发、结果、方案查看、应用、失败、stale 或撤销
**Then** 只记录脱敏 issue/alternative 类型、severity、scope、fact availability、revision delta、耗时和错误类别
**And** 不记录 POI 名称、精确私人路线、酒店/行李备注、用户自由文本、受保护来源 URL、Provider secret、原始天气/路线响应或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用 soft-only 建议入口、冲突 banner 与 FixSheet
**When** 打开、切换方案、查看 diff、确认、失败或关闭
**Then** 目标至少 44pt，严重级别、选中/禁用和剩余问题不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区、reduced motion 和克制的 live-region 更新
**And** 多冲突、长原因、unknown facts、动态 diff 和失败文案不得造成文字溢出、卡片套卡片、布局跳动或重复播报

**Given** Story 3.4 准备关闭
**When** 使用 clean、pending、单/多 hard-soft issue、结构预拒绝、部分修复、无安全方案、known/unknown/stale route、可靠/季节性/陈旧天气、跨日负荷、冻结事实、幂等/并发/owner 隔离、apply failure、下游 gate 和撤销 fixture，并运行 OpenAPI/生成类型、Prisma migration、validator/fix/revision/route/weather/mobile/accessibility tests、真实 PostgreSQL、route/weather staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 每次合法修改都得到 revision 绑定、诚实且可恢复的增量校验，用户可在明确预览后应用安全修复
**And** 本 Story 不实现自由文本 AI 调整、自动应用修复、任意历史回滚、跨城联合校验、餐饮选择池、清单、细节完善或导出本身

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 3.5: 受控对话式局部调整

As a 旅行者,
I want 用自然语言描述希望怎样调整计划，并在必要时回答一个范围或风险问题,
So that 我不必逐项编辑，也能在确认前看清 AI 准备修改什么.

**Requirements:** FR9, FR14, FR21, FR22, FR50, FR51; NFR1, NFR3, NFR4,
NFR6, NFR8-NFR10, NFR17, NFR21, NFR23; AR2-AR5, AR8, AR11-AR15,
AR17-AR20; UX-DR2, UX-DR3, UX-DR18, UX-DR22-UX-DR24, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在查看当前单城 Plan 的 S7/S8 时间轴，该 Plan 可以独立存在，也可以属于 Linked Trip 的当前 TripSegment
**When** 点击右下角具备可访问名称的 `AI 调整` 图标
**Then** 在当前 plan shell 内打开调整 Sheet，保留当前日期、可见 slot/day 上下文、滚动位置与精确 current revision
**And** 关闭后焦点返回原入口，不显示 Provider、模型、版本号、chain-of-thought 或第二套计划

**Given** AI 调整 Sheet 已打开
**When** 用户输入自然语言或选择 `晚点出门 / 只保留已选 / 悠闲一些 / 雨天方案` 等快捷表达
**Then** 创建 revision-bound 的解释请求并保留原输入草稿，快捷项只填充/提交意图
**And** 输入、快捷项、发送、解析或 Sheet 导航均不直接修改时间轴，不创建 PlanRevision、EditEvent、ValidationRun 或 undo token

**Given** 服务端解释一个调整请求
**When** 读取当前 slot、连续行程段、day、later-days 与当前 single-city Plan 上下文
**Then** 只返回安全的 typed intent/constraints，或一个受控 `AdjustmentAsk`
**And** LLM 不得返回可直接持久化的 Plan JSON、SQL、任意 tool command 或绕过 ownership/revision/Validator 的 mutation payload

**Given** 请求范围可以唯一确定
**When** 系统选择最小合法 scope
**Then** 以紧凑、可编辑控件显示 `当前安排 / Dn 全天 / Dn 之后 / 整趟当前城市行程` 中的实际范围
**And** 用户可以在生成方向前修改范围；界面不显示“我理解为”段落，也不把当前 active day 自动扩大为 whole-trip

**Given** 当前 Plan 属于包含多个城市的 Linked Trip
**When** 用户提交 AI 调整或选择 `整趟当前城市行程`
**Then** 解释、方案、diff、mutation 和校验都只能作用于当前 `TripSegment -> Plan`
**And** 不得读取其他城市的私人计划细节来扩大 scope，不得新增/删除/重排城市、修改 TransferLeg 或变更其他 Plan；需要跨城修改时提示使用对应城市或联程编辑入口

**Given** 用户表达例如 `后面安排轻松一点` 且范围不唯一
**When** 解释器无法在当前上下文安全区分起始日期或范围
**Then** 返回 `AdjustmentAsk(kind=scope_clarification)`，一次只显示一个直接问题和有限选项，例如 `从 D2 开始 / 只调整 D3 / 整趟厦门行程`
**And** 未选择时禁用继续；回答只更新解释上下文并重新解析，不创建 plan mutation 或提前展示虚假方向

**Given** 用户请求可能触碰 required、冻结预约/票务、住宿/行李、计划边界或其他重大取舍
**When** 系统需要用户明确接受风险边界才能继续
**Then** 返回 `AdjustmentAsk(kind=risk_warning)`，用一句事实说明风险并提供安全、有限的继续/修改/取消选项
**And** ask 不泄露内部推理、不要求放弃冻结事实、不把风险确认等同最终 diff 确认，也不在没有安全路径时诱导继续

**Given** 任一 `AdjustmentAsk` 已显示
**When** 用户回答、返回重新描述、关闭或计划在后台更新
**Then** ask 始终绑定原 input revision，一次只处理一个澄清/风险问题，并可为同一请求恢复其非敏感 UI 状态
**And** stale ask 必须失效；取消或关闭保持 current plan 不变，不把 ask 文本写入 EditEvent 或公开分析

**Given** 范围与风险边界已明确且系统能形成安全调整
**When** 进入方向选择
**Then** 标题为 `选择一个调整方向`，通常展示两个简短、不同且可执行的取舍方向
**And** 方案 A 直接回应用户要求，方案 B 提供实现同一目标的另一条路径；这一阶段不提前展示冗长 diff 或已应用状态

**Given** 用户要求 `少走一些`
**When** 路线、地点和时间约束允许两类安全处理
**Then** 可展示例如 `改为打车 + 公共交通` 与 `减少步行景点` 的两个方向
**And** 不使用已废弃的 `减少跨区` 文案，不声称具体公里数已经减少，也不静默删除 required 或冻结地点

**Given** 系统只有一个安全方向
**When** 另一个方向会突破硬约束或依赖未知事实
**Then** 只展示真实安全方向，并提供返回修改或手工编辑，不为满足“两个选项”伪造第二个方案
**And** 无安全方向时直接进入已批准的 no-safe 状态，不生成勉强可用的 command set

**Given** 用户选择一个调整方向
**When** 服务端将方向编译为具体变更
**Then** 使用允许列表中的类型化 PlanCommands 形成确定性、revision-bound command set 与字段级 diff
**And** 编译必须经过 owner、scope、冻结/required、Segment、路线/营业/住宿/行李和结构约束；LLM 输出不能直接成为持久化事实

**Given** 方向会改变日期、时间、地点、交通、自由时间或负荷
**When** 展示最终预览
**Then** 按受影响日期/slot 显示 before/after、相邻交通、主要取舍和仍可能存在的问题
**And** 查看、展开、切换方向、返回 ask/输入或取消都不创建 revision；只有最终确认发送一次 mutation command

**Given** typed interpretation 发现当前计划已经满足用户要求且无需实际 delta
**When** 生成方案或 diff
**Then** 显示 `当前计划已符合` 与可解释的简短事实，允许返回时间轴或重新描述
**And** 不创建空 PlanRevision、EditEvent、ValidationRun、成本伪记录或 undo entry

**Given** 请求涉及天气
**When** WeatherContext 在可靠预报期内且具备来源、observedAt、validUntil 和有效 quality
**Then** 可提供雨天调整方向并在 diff 中说明使用的天气边界
**And** 远期、seasonal、stale、unknown 或 unavailable 天气只能产生诚实提示/降级，其中远期/季节性建议使用一条低强调 `天气临近出发再核对` 并在现有详情展开依据，stale/unknown/unavailable 仍保留真实不可用状态，不生成精确雨天重排或伪实时结论；可靠证据形成的真实风险仍按原严重性与确认流程处理

**Given** 用户最终确认一个仍适用于 current revision 的 command set
**When** apply 请求携带 owner、idempotency key、expected revision、request/ask/direction id 与 payload hash
**Then** 服务端重新验证并在事务中创建一个完整不可变 PlanRevision/PlanVersion 与关联 EditEvent
**And** 相同键/相同 payload 重放返回同一结果；不同 payload、越权、stale revision 或边界变化返回 typed conflict，绝不部分发布

**Given** AI adjustment mutation 成功发布
**When** 新 revision 成为 current
**Then** 立即触发 Story 3.4 的 revision-bound 增量 ValidationRun，并进入全计划 `撤销 8` 与额外一条 eligible undo 合同
**And** derived conflict 不静默回滚合法 adjustment；用户可以查看 FixSheet、继续手工编辑或撤销

**Given** adjustment 已完整应用
**When** 返回结果 Sheet
**Then** 标题为 `做了以下调整`，只列实际发生的日期、地点、时间、交通和负荷变化，以及仍存在的问题
**And** 不显示“我理解为”、chain-of-thought、未执行建议或虚假的全部成功；CTA 返回受影响日期并恢复时间轴上下文

**Given** 当前约束下没有安全方向
**When** 解释器/编译器完成检查
**Then** 显示 `这次暂时无法调整`，紧接一条直接事实原因，保留用户请求摘要及 `我自己调整 / 返回重新描述 / 撤销最近修改` 等可用路径，不叠加另一个失败弹窗
**And** 在原因后明确显示一次 `当前计划未改动`，不产生 revision，不隐去冲突，也不用第三个不安全方案填充界面

**Given** 用户查看 ask、方向或 diff 期间 current revision 已更新
**When** 尝试继续或确认旧流程
**Then** 显示 `计划已经更新`、一条必要的当前变化摘要，以及 `查看最新计划并重试 / 保留当前计划`
**And** 明确不会应用旧方案；旧 ask/direction/diff 失效，不消费 undo 机会，也不自动套用到最新计划

**Given** AI Provider 超时、回退、熔断、平台额度不足或调整任务失败
**When** 尚未发布 mutation
**Then** 保留输入和 current plan，显示真实 `queued / degraded / retry later / manual edit` 路径，手工编辑始终可用
**And** 不暴露 Provider 名称或 BYOK，不把 recoverable failure 当作已应用；Telegram 管理员终态告警属于 Epic 8 FR38.1，不是本 Story 的前向依赖或完成条件

**Given** adjustment 被取消、app 后台恢复、网络断开或结果迟到
**When** 客户端恢复
**Then** 只恢复与同一 owner、request id 和 input revision 匹配的输入/ask 状态，current plan 始终可读
**And** 迟到结果不能发布到更新 revision，失败/取消不创建成功说明、EditEvent 或撤销记录

**Given** adjustment 行为进入日志、Sentry、Langfuse、指标或产品分析
**When** 记录输入、ask、方向、预览、应用、no-op、no-safe、stale 或失败
**Then** 只记录脱敏 request type、ask kind、scope、direction/command types、revision delta、validation 状态、耗时、成本带和错误类别
**And** 不记录完整用户原文、POI/酒店/行李/路线、protected URL、原始 prompt/tool payload、Provider secret、chain-of-thought 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用 AI 调整
**When** 输入、回答 ask、选择范围/方向、查看 diff、确认、失败或关闭
**Then** 目标至少 44pt，图标具备标签/角色，选择/禁用/风险不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区、reduced motion 和克制 live-region
**And** 长输入、动态选项、风险文案、no-safe/stale 状态和多项 diff 不得造成文字溢出、卡片套卡片、布局跳动或重复播报

**Given** Story 3.5 准备关闭
**When** 使用 slot/segment/day/later/whole-plan scope、明确/歧义范围、scope/risk asks、两个/单个/零安全方向、no-op、typed diff、冻结/required、可靠/陈旧天气、Provider/额度降级、stale、幂等/并发/owner 隔离、应用/撤销和无障碍 fixture，并按 AI Adjust R4、Scope/Clarification R1、No-safe/Stale R1 与 Applied Explanation R1 运行 OpenAPI/生成类型、interpreter/compiler/revision/validator/mobile tests、真实 PostgreSQL、Provider/weather staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以通过受控 ask 澄清范围或风险，选择真实调整方向，并只在明确 diff 后发布可校验、可撤销的新版本
**And** 本 Story 不实现跨城联程调整、Telegram 管理员告警、自动应用、任意历史回滚、餐饮选择池、清单、细节完善或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 4: 把多个城市连接成可执行联程

### Story 4.1: 多城跨城意图确认与联程输入草稿

As a 旅行者,
I want 在选择另一城市的地点时明确增加目标城市，并用同一流程补齐有序城市链中每个城市的时间、交通、住宿和行李,
So that 任意长度的跨城旅行仍由清晰独立的单城计划组成，并能保存为可继续完成的联程草稿.

**Requirements:** FR14, FR27.1, FR29-FR31 (cross-city input slice), FR35 (unbounded
ordered input-draft slice), FR36, FR41, FR49, FR50 (active-city scope guard);
NFR1, NFR6, NFR8, NFR10, NFR11, NFR19, NFR21-NFR23; AR2-AR5, AR9,
AR11, AR14, AR15, AR17-AR20; UX-DR2, UX-DR3, UX-DR7-UX-DR15,
UX-DR24, UX-DR25, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 用户在 S4 Picker 或 S8 计划编辑中查看一个已由 CanonicalPOI 验证城市归属的 L3
**When** 对不属于当前 Plan 城市且尚未进入当前 Trip 的 L3 选择 `required` 或 `along_route`
**Then** 打开明确的新增城市确认 Sheet，而不是把该 L3 放入当前城市的时间段、候选落位命令或 PlanRevision
**And** L1/L2 仍只提供地理上下文；只有 L3 intent 能触发该流程，未选择或仅浏览跨城内容不创建 Trip 草稿

**Given** 新增城市确认 Sheet 已打开
**When** 展示跨城意图
**Then** 标题使用 `{地点}在{目标城市}`，正文说明当前城市与新增目标城市，并展示加入后的完整有序城市链
**And** 主操作文案跟随目标城市为 `增加{目标城市}行程`，次操作为 `暂不加入`；不使用会被理解成往返的 `⇄`，不显示内部 Trip/Segment/Plan 术语

**Given** 当前只有一个城市 Plan
**When** 用户第一次增加另一城市
**Then** 城市链以 `{当前城市} → {目标城市}` 展示，并提供独立反转控件选择这两个城市的先后
**And** 反转只改变本次两城主链输入顺序，不创建重复主 segment、同日往返暗示、交通事实或已发布联程

**Given** 当前 Trip 已有 N 个互不重复的同一时区城市段
**When** 用户增加第 N+1 个新城市
**Then** 复用完全相同的确认 Sheet、S2 旅行时间和 S3 住宿流程，并在 S2 明确选择/确认新城市插入哪个相邻边界
**And** 不出现仅为第二城、第三城或第四城设计的字段/向导；客户端、API 和持久化不得设置固定城市数量上限，且插入新城市不得重排其他既有 segment 的相对顺序

**Given** 城市链较长而无法在一屏完整显示
**When** 用户查看确认 Sheet、S2/S3 标题或恢复草稿
**Then** 使用可滚动/可聚焦的有序城市链与稳定的当前城市标识，保留每个城市的名称、顺序和可访问操作
**And** 不通过截断隐藏当前新增目标或相邻城市，不造成文字溢出、按钮挤压、布局跳动，也不因城市数增加而切换另一套流程

**Given** 用户点击 `暂不加入`、关闭 Sheet、返回或系统中断确认
**When** 流程结束或恢复
**Then** 当前 Trip/Plan、既有城市链、L3 intent、时间/住宿输入和 current revision 保持原样
**And** 不创建空 TripSegment、目标城市 Plan、TransferLeg、StayRevision、PlanningJob、EditEvent 或 undo entry

**Given** 用户确认增加目标城市
**When** 请求携带 owner、idempotency key、expected draft/current revision、source context 和 intent payload
**Then** 创建或复用 owner-scoped `Trip(state=draft)`，以有序集合增加一个 `TripSegment` 和目标城市的单城 Plan/draft，并保留来源 L3 的 required/along_route 与 provenance 绑定到目标 segment
**And** 相同键/相同 payload 重放返回同一草稿；不同 payload、stale revision、非法插入点或其他 owner 请求返回 typed conflict，绝不部分增加城市或污染当前城市 Plan

**Given** 用户选择的 L3 所属城市已经存在于当前 Trip
**When** 接受该地点意图
**Then** 将 intent 绑定到该城市已有的 `TripSegment -> Plan` 输入草稿，并引导用户查看该城市上下文
**And** 不重复创建同城 segment、不再次询问新增城市，也不把地点放入当前 active city Plan

**Given** 一个新增城市确认尚未完成
**When** 用户又触发另一个跨城 L3、重复点击或收到迟到响应
**Then** 每次只允许一个 revision-bound pending city expansion，并保留当前待确认地点、intent 与来源
**And** 用户必须完成或取消当前新增后才能处理下一次；迟到响应不得越过新的 draft revision 或创建重复 segment

**Given** 用户通过 `增加{城市}行程` 尝试把已离开的既有城市再次加入主链、加入跨时区城市，或选择不受 MVP 支持的链路
**When** 服务端验证 proposed main chain
**Then** 不修改草稿，并以类型化原因说明主链重复/跨时区/夜间跨日等本版不支持的复杂度
**And** 不以固定城市数量为理由拒绝新城市；FR35.1 的同日一日游是独立 DayExcursion 分支，不通过重复主 TripSegment 实现，也不属于本 Story

**Given** 新目标城市已进入 draft
**When** S2 展示旅行时间
**Then** 标题和摘要由完整有序城市集合派生，整体日期/天数由全部 segment 计算，边界依次为 `到达首城 / 前往每个后续城市 / 离开末城`
**And** 后一城市开始日期与前一城市离开/交接日期相接，不允许 segment 日期倒序、无归属日期、隐式重叠或用固定 `city2/city3` 字段保存

**Given** 用户编辑任一相邻城市边界
**When** 选择具体航班/铁路、两小时窗口、AI 安排或手工汽车/巴士/轮渡等输入模式
**Then** 复用 Story 2.3/2.4 的事实诚实、来源、freshness、manual 和 provisional 合同，保存为该相邻对的 transfer input draft
**And** 夜间跨日交通不可选；未填、unknown、provisional 或 Provider 失败可以保存草稿，但必须保持明确未完成并阻止其被描述为已确认联程

**Given** 用户进入 S3 住宿安排
**When** 在任一城市段按住宿晚填写或跳过
**Then** 每个城市复用 Story 2.5 的逐晚酒店、早餐和行李组件，酒店可留空、行李可选未决定，并根据相邻住宿/transfer 计算合法默认值
**And** 每个中间城市至少需要一晚住宿才能满足联程发布条件；跨城当天的行李只绑定一次明确的离开/到达边界，不同时复制到两个 Plan

**Given** 用户在 S2/S3 之间返回、切换城市、退出登录、关闭应用、通过深链恢复或网络中断
**When** 重新打开同一 owner 的 linked-trip draft
**Then** 恢复有序城市链、active segment、每城日期/边界/住宿/行李、pending intent、完成状态和来源页面 S4/S8
**And** 返回原页面时恢复原 Picker/时间轴位置；其他 owner 不得通过 trip、segment、plan、POI 或缓存标识读取该草稿

**Given** 跨城意图来自一个已发布单城 Plan 的 S8
**When** 用户确认增加新城市并完成或暂时退出输入
**Then** 原 current PlanRevision 仍可完整浏览和编辑，新 linked-trip 内容只存在于可恢复 draft，跨城 L3 不进入原计划时间轴
**And** 在后续 Story 完成全部 transfer/Plan 校验与原子发布前，不创建部分 TripRevision，不把 draft 显示成可执行联程，也不覆盖原单城 current pointer

**Given** 当前 active Plan 是 Linked Trip 中的一个城市段
**When** 用户打开 Story 3.5 的 AI 调整并选择任意 scope，包括 `整趟当前城市行程`
**Then** 输入、AdjustmentAsk、方向、diff、mutation 和 ValidationRun 只能作用于该 active `TripSegment -> Plan`
**And** 不得新增/删除/重排城市、修改 TransferLeg、读取并改写其他城市 Plan 或把“后面”解释成后续城市；跨城请求提示切换到目标城市或使用联程编辑入口

**Given** 插入点、日期或城市顺序发生变化并使已有下游输入失效
**When** 保存新的 draft revision
**Then** 明确标记受影响的相邻 transfer、segment 日期、住宿和行李字段为待复核，并保留未受影响城市的输入
**And** 不静默搬移日期、复用错误班次、交换酒店/行李、删除 intent，或把陈旧输入继续标成已确认

**Given** linked-trip draft 行为进入日志、Sentry、指标或产品分析
**When** 记录触发、确认、取消、插入、恢复、拒绝或失败
**Then** 只记录脱敏城市数量、插入位置、intent 类型、完成状态、耗时和错误类别
**And** 不记录完整城市链/POI 名称、私人日期/酒店/行李、protected URL、Provider payload/secret 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用新增城市与长链输入
**When** 打开/关闭 Sheet、滚动城市链、反转两城、选择插入点、切换 segment、填写或恢复
**Then** 目标至少 44pt，图标有标签/角色，顺序/选中/禁用/待完成不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区和 reduced motion
**And** 长城市名、任意数量 segment、动态边界、错误和恢复提示不得造成卡片套卡片、不可达操作、重复播报或当前城市上下文丢失

**Given** Story 4.1 准备关闭
**When** 使用首个跨城、新增第 N+1 城、长城市链、已有城市 intent、required/along_route、两城反转、受控插入、取消/重复/stale、同城重复、主链重复城市、跨时区、夜间跨日、exact/window/AI/manual 边界、逐晚住宿/行李、S4/S8 恢复、当前城市 AI 调整 guard 和 owner 越权 fixture，并运行 OpenAPI/生成类型、Prisma migration、TripDraft/repository/API/mobile/accessibility tests、真实 PostgreSQL、必要的 transport/AMap staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以把任意数量的独立单城 Plan 逐个加入有序联程，并得到完整、可恢复且不会污染已发布计划的输入草稿
**And** 本 Story 不实现已确认 TransferLeg 的联合可行性、交接日可用时间切分、各城市 PlanningJob 编排、TripRevision 原子发布、联程时间轴/导出、跨城 AI 调整、DayExcursion 同日往返、跨时区、夜间跨日交通或既有整条链的任意复杂重排

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.2: 相邻城市交通确认与交接日切分

As a 旅行者,
I want 逐段确认相邻城市之间的交通，并看到交接日两边真正可用的时间,
So that 每个单城计划都能在准确、可解释的边界内独立编排.

**Requirements:** FR14, FR27.1, FR35, FR36 (handoff luggage slice), FR49;
NFR1, NFR4-NFR6, NFR8, NFR10, NFR11, NFR21-NFR23; AR2-AR5, AR9,
AR11-AR15, AR17-AR20; UX-DR2, UX-DR3, UX-DR7, UX-DR8, UX-DR10,
UX-DR18, UX-DR25, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 4.1 已保存包含 N 个有序单城 segment 的 linked-trip draft
**When** 打开联程交通确认
**Then** 从相邻 segment 对派生且仅派生 N-1 个逻辑 `TransferLeg`，每段显示出发城市、到达城市、交接日期和当前状态
**And** 不创建首城之前或末城之后的伪 transfer，不跨过中间城市直接连边，也不以城市总数设置产品上限或固定 `transfer1/transfer2` 字段

**Given** 城市链含有任意数量的相邻交通段
**When** 用户浏览、切换或恢复交通确认页
**Then** 使用可滚动/可聚焦的相邻段列表保留完整顺序、当前编辑段、已完成数量与每段 `未填写 / 查询中 / 待确认 / 已确认 / 失败` 状态
**And** 可以按任意顺序逐段完成，不因长链截断城市身份、隐藏错误或切换到另一套第二城/第三城流程

**Given** 用户进入一个相邻城市交通段
**When** 选择航班、铁路或输入服务编号
**Then** 复用 Story 2.4 的结构识别和 Provider-neutral 查询；明确航班/铁路格式只查询对应 Provider，存在合理歧义时可并行查询两类并按类型分组
**And** 不以单个首字母作为绝对真相，不把高德当航班/铁路时刻 Provider，也不因一类查询失败而丢弃另一类可信结果或手工入口

**Given** 用户不使用或未找到航班/铁路班次
**When** 选择汽车、巴士、轮渡或其他受支持的白天直达方式
**Then** 提供手工填写出发/到达日期时间、地点和必要方式信息，并在可用时使用 AMap/适配 Provider 补充接驳或路线事实
**And** 手工事实明确标记 `source=user`；系统不得补造车次、班号、票价、余票、站点或购票状态

**Given** Provider 返回一个班次或用户完成可信手工输入
**When** 展示待确认方案
**Then** 显示方式/班次、出发与到达地点及时间、来源、观测时间和必要的新鲜度/降级文案，并允许明确采用、返回修改或选择其他结果
**And** `采用` 仅代表把该交通事实用于行程，不表示已购票、已值机、实时有票或 Nomad 完成预订

**Given** 用户在 S2 选择两小时时段或 `交给 AI 安排`
**When** 系统尚未形成并让用户采用一个具有可执行地点/时间和持续时长的具体方案
**Then** 保留输入为 window/AI preference，并将对应 TransferLeg 标为 `provisional/待确认`
**And** 可以保存和恢复草稿，但不能把偏好本身升级为 confirmed、计算成确定可用时间或通过联程就绪门禁

**Given** AI 或规则系统根据用户边界推荐一个具体交通方案
**When** 用户尚未确认或方案依赖 unknown/stale/ambiguous Provider 事实
**Then** 方案保持 provisional，清晰显示需要确认或事实不足，并保留手工与重新查询路径
**And** AI 不得直接发布 TransferLegRevision，不得把模型估算冒充时刻表，也不得因“交给 AI”而绕过用户采用动作

**Given** 用户采用一个仍然新鲜且适用于当前相邻 segment/date 的具体方案
**When** 创建新的 `TransferLegRevision`
**Then** 保存 from/to segment、mode、serviceCode、端点、scheduled departure/arrival、source、confidence、observedAt 和状态，并绑定精确 linked-trip draft revision
**And** confirmed 表示“已确认用于规划”而非“已购票”；缺少确定出发/到达时间、可信持续时长或可解析端点时不得成为 confirmed

**Given** 一个 TransferLeg 具有确定的出发/到达事实
**When** 计算交接区间
**Then** 以 `进站/前往出发点 + 候车/手续 + 主体行驶 + 到达缓冲 + 出站/离开到达点` 形成连续 `handoffStartAt..handoffEndAt`
**And** 每个组成项保留来源或版本化默认策略，所有分钟均为非负；缺项、倒序、零/负主体时长或跨时区换算不明时返回 typed invalid/provisional 而非偷偷填零

**Given** 相邻两城在同一交接日
**When** TransferLeg 成为 confirmed 并计算 handoff 区间
**Then** 上游城市当日可编排时间最晚截止于 handoffStartAt，下游城市最早开始于 handoffEndAt，中间完整区间归 Trip transfer 所有
**And** 不把 transfer 复制为两个普通 POI slot，不允许任一城市活动穿越该区间，也不把站内等待或进出站时间释放成虚假自由时间

**Given** 交接日同时受到首日到达、末日离开、酒店退房/入住或其他已确认边界限制
**When** 计算每个 segment 的 usable interval
**Then** 取该城市所有确定边界的合法交集，并显示上游 `可安排至 HH:mm`、下游 `HH:mm 后可安排` 等直接结果及必要原因
**And** 区间为空、顺序冲突或不足以满足结构规则时标记 blocked 并要求修改，不将负时间、重叠或越界结果传给后续 Planner

**Given** 用户选择的交通会在本地日期跨午夜、需要不同日到达、属于不同时区，或同一天产生第二次跨城
**When** 验证 TransferLeg
**Then** 阻止 confirmed 并说明当前 MVP 仅支持同一时区、白天直达且每日最多一次跨城
**And** 保留输入供用户修改或改为独立行程，不拆成隐藏夜间 slot、不改变日期来强行通过，也不触发跨时区推算

**Given** 相邻城市具有出发住宿、目标住宿和行李输入
**When** 预览交接日
**Then** 在同一边界展示必要退房/寄存/携带/取回/入住关系，行李去向引用 Story 2.5 的类型化模式并明确属于哪一个 transition
**And** 一次跨城只创建一个逻辑 LuggageTransition；不在两个 Plan 重复扣时，不默认把行李留在已经离开的城市，目标酒店为空或行李未决定时保持待确认

**Given** 中间城市没有至少一晚住宿，或行李模式要求寄存但缺少可用地点/放取时间
**When** 评估该相邻交通段的联程就绪状态
**Then** TransferLeg 事实可以单独保存，但该 segment/Trip 保持 not-ready，并显示缺少的住宿或行李输入
**And** 不把酒店空白本身当错误；只有违反中间城市住宿规则或已选择行李执行方式缺少必要事实时阻止联程就绪

**Given** 用户修改城市插入点、segment 日期、相邻边界、采用的班次、酒店或行李
**When** 新 draft revision 成功保存
**Then** 只使直接受影响的相邻 TransferLeg、handoff interval、usable interval 和 LuggageTransition 失效或重新计算，并保留其他不受影响段的 confirmed revision
**And** 不静默迁移旧班次到新日期/城市、不整体清空长链、不复用陈旧 RouteFact，也不让旧 confirmed 状态留在错误相邻对上

**Given** 用户保存、重复提交或在多设备编辑 TransferLeg
**When** 命令携带 owner、idempotency key、expected linked-trip draft revision、logical transfer id 和 payload hash
**Then** 相同键/相同 payload 重放返回同一 TransferLegRevision，不同 payload、stale revision、错误相邻对或越权请求返回 typed conflict
**And** 一个命令最多发布一份完整 revision；失败不部分更新 handoff、usable interval、行李或 current draft pointer

**Given** 用户退出、应用重启、弱网重连或通过深链恢复
**When** 重新打开同一 linked-trip draft
**Then** 恢复每个相邻段的输入、查询选择、confirmed/provisional/failed 状态、handoff 组成项、usable interval、当前编辑段和未保存表单草稿
**And** 迟到查询结果必须匹配 owner、logical transfer、input revision 和查询参数；否则丢弃为 stale，不覆盖用户之后的选择

**Given** 航班/铁路/AMap/路线 Provider 超时、配额耗尽、熔断、无结果、歧义或返回陈旧事实
**When** 当前交通段无法形成可靠 confirmed 方案
**Then** 保留已有草稿，显示 typed degraded/unknown 状态，并提供重试、换方式、手工填写或稍后继续
**And** 其他相邻段仍可独立编辑；失败不得伪造成 0 分钟、默认驾车、已确认或整个 Trip 数据丢失

**Given** 当前 active Plan 属于 linked trip
**When** 用户从 Story 3.5 AI 调整提出改变跨城交通、另一个城市或整个城市链
**Then** 不创建 AdjustmentAsk/direction 来执行跨城 mutation，而是保留当前 Plan 并引导进入对应 TransferLeg 或目标城市编辑入口
**And** 当前城市内调整仍可正常使用，但不得越过 handoffStartAt/handoffEndAt 或改写 confirmed TransferLeg

**Given** 交通与交接行为进入日志、Sentry、指标或分析
**When** 记录查询、采用、手工输入、确认、失效、失败或恢复
**Then** 只记录脱敏 mode、Provider 类型、状态、耗时、freshness 桶、handoff 时长桶、链长和错误类别
**And** 不记录完整城市链、班次/精确时间地点、酒店/行李、私人日期、Provider payload/secret、用户原文或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用交通确认与交接预览
**When** 切换长链段、查询、选择、采用、手工填写、查看组成项、失败或返回
**Then** 目标至少 44pt，图标有标签/角色，状态/来源/禁用原因不只依赖颜色，Sheet 支持焦点约束/返回、键盘、安全区和 reduced motion
**And** 长城市/站点/班次名称、多个状态、动态区间和失败文案不得造成溢出、卡片套卡片、布局跳动、当前段丢失或重复播报

**Given** Story 4.2 准备关闭
**When** 使用 1/2/N 城、长链、航班/铁路明确与歧义编号、双 Provider、汽车/巴士/轮渡手工输入、window/AI provisional、真实采用、known/unknown/stale 路线、进站/候车/行驶/到达/出站、空/冲突区间、首末边界、中间住宿、行李寄存、跨午夜/跨时区/同日二次跨城、局部失效、幂等/并发/owner 隔离、Provider 失败和当前城市 AI 调整 guard fixture，并运行 OpenAPI/生成类型、Prisma migration、TransferLeg/RouteFact/repository/API/mobile/accessibility tests、真实 PostgreSQL、真实 flight/rail/AMap/route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** linked-trip draft 的每个相邻城市对都能获得诚实、可恢复的交通确认与交接日可用时间，且任意未确认或无效段保持明确阻塞
**And** 本 Story 不运行各城市 PlanningJob、不生成城市内 POI 时间轴、不原子发布 TripRevision、不展示最终联程时间轴/行程单、不实现跨城 AI 调整、购票、DayExcursion 往返交通、跨时区、夜间跨日交通或任意整链重排

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.3: 多城独立编排与原子联程发布

As a 旅行者,
I want 系统在已确认交通边界内独立编排每个城市，并一次性发布完整联程,
So that 我不会看到城市混排或只完成一部分的不可执行行程.

**Requirements:** FR14, FR32-FR33 (per-segment planning reuse), FR35, FR36,
FR36.1, FR41, FR49, FR50 (active-city guard), FR51; NFR1-NFR6, NFR8,
NFR10, NFR11, NFR17, NFR19, NFR21-NFR23; AR2-AR9, AR11-AR15,
AR17-AR20; UX-DR1-UX-DR3, UX-DR16-UX-DR19, UX-DR24, UX-DR25,
UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** Story 4.1/4.2 已形成 owner-scoped linked-trip draft
**When** 用户在 S5 点击联程唯一的 `开始规划`
**Then** 服务端先验证每个 segment 的城市/日期/有效规划输入、每个相邻 TransferLeg 的 confirmed revision、可用交接区间以及必要住宿/行李边界
**And** 任一 untouched ambiguous 输入、provisional/failed/stale transfer、重复城市、跨时区、夜间跨日、日期倒序、空 usable interval 或中间城市无住宿时不创建 PlanningJob，并返回可定位到具体城市/边界的稳定修复入口

**Given** linked-trip draft 满足启动门禁
**When** 接受规划请求
**Then** 创建一个用户可见的 `PlanningJob(tripId, inputRevision)`，冻结有序 segment、每城 Plan 输入、共享 pace/约束、PlaceIntent、Stay/Luggage、TransferLeg 和 usable interval 的精确版本引用
**And** 相同 owner/idempotency key/相同 payload 返回同一 Job；不同 payload、stale draft 或其他 owner 请求返回 typed conflict，不生成第二个可竞争发布的任务

**Given** 一个 linked-trip PlanningJob 已接受
**When** 移动端进入 S6/S7 稳定时间轴 shell
**Then** 只显示一个任务及 `已接收 / 准备约束 / 编排各城市 / 联程校验 / 保存 / 完成` 等事实阶段，并可展开查看每个城市的 pending/running/validated/failed 子状态
**And** 不暴露 Quick/HQ、模型/Provider、多个可采用版本或 N 个独立完成页面，不显示虚假百分比，也不要求用户逐城点击开始

**Given** Trip 包含 N 个有序 segment 且产品不设置城市数量上限
**When** orchestrator 调度城市编排
**Then** 使用可配置的有界并发/队列运行全部 N 个单城 planning attempts，长链只影响排队和事实进度，不改变业务流程或拒绝固定序号之后的城市
**And** 配额、超时和熔断按实际工作量执行诚实 queued/degraded/fallback；不得通过硬编码 `city2/city3`、固定数组长度或一次性无界并发实现

**Given** orchestrator 为某个 segment 创建内部 planning attempt
**When** 调用 Epic 2 的单城 Planner
**Then** 只传入该 segment 的 city、local dates/day indices、usable intervals、地点 intent、酒店/早餐/行李、pace/约束以及该城市可访问的候选与事实
**And** 不传入其他城市可被误排的 POI/candidate，不允许 Planner 新增/删除/reorder TripSegment，也不把另一个城市的酒店或 AnchorPool 当作当前城市候选

**Given** required/along_route、导入灵感或候选具有明确城市归属
**When** 单城 Planner 读取候选
**Then** 只消费绑定当前 segment 的 intent 与同城 CanonicalPOI/合法代理，无法安全落位的 required 进入该城市未解决区，其他未采用项进入该城市候选区
**And** 不通过距离较近、名称相同或代理地标把地点迁到另一 segment，也不让跨城 L3 绕过 Story 4.1 的新增城市确认

**Given** segment 首日或末日与 confirmed TransferLeg 相邻
**When** Planner 创建时间槽
**Then** 将 Story 4.2 的 handoffStartAt/handoffEndAt、首日到达、末日离开和酒店/行李边界作为不可穿越的冻结结构约束
**And** transfer 区间归 Trip 所有且不可被 POI、餐饮、自由时间或 Filler 覆盖；Planner 不缩短、移动或估算 confirmed TransferLeg

**Given** 当前城市存在酒店、换住、早餐、行李、预约/票务或 dawn/sunset/night/night-market 证据
**When** 单城 Planner 编排完整日程
**Then** 复用 Story 2.11 的约束优先顺序、酒店感知偏好、特殊时段、RouteFact 诚实性、required/along_route 语义和自由时间降级
**And** 酒店留空时不静默代选；unknown/stale 路线、营业或预约事实不被提升为确定事实，Filler 不参与排期

**Given** 一个或多个单城 attempt 需要 AI Provider 或确定性 fallback
**When** Provider 超时、平台额度不足、熔断或返回非法结果
**Then** 只在同一 TripPlanningJob 内按 Story 2.9/2.11 的 fenced fallback 继续，并报告受影响城市的真实 queued/degraded/failed 状态
**And** 不向用户提供另一个 Trip 版本，不以其他城市成功掩盖失败城市，也不让迟到 Provider 结果覆盖更新 attempt 或用户已编辑 revision

**Given** 某个单城 attempt 形成候选 PlanRevision
**When** 运行初始 Validator
**Then** 校验该城市全部日期、营业/路线/冻结/required、住宿/行李、负荷和 segment 边界，并生成绑定该候选 revision 的 clean/warning/hard-conflict 结果
**And** hard conflict 或结构越界使该 segment 失败；soft warning 保留，合法发布后的 soft-only 联程摘要使用一个低强调 `有N项建议核对 · 查看` 入口并按需进入已有问题详情，不被伪装成 clean，不改变原联合发布门禁

**Given** 所有单城 candidate revisions 已通过各自初始校验
**When** 运行 Trip 级联合校验
**Then** 验证 segment 顺序与日期连续性、每个 confirmed TransferLeg/handoff、每日最多一次跨城、中间住宿、LuggageTransition、连续早起/高负荷和相邻城市恢复时间
**And** 不重新编排城市内部 POI；任何跨段 hard conflict 精确关联相邻 segment/transfer 并阻止发布，unknown 外部事实不默认为安全

**Given** 任一城市 attempt 失败、取消、超时、产生 hard conflict，或 Trip 级校验未通过
**When** PlanningJob 结束或等待用户处理
**Then** 不创建 published TripRevision，不更新任何 Trip/Plan current pointer，并保留完整 linked draft、失败城市、原因和可恢复的重试/返回输入路径
**And** 已成功的未发布 candidate revisions 保持不可见且不可被普通计划路由读取；原已发布单城 Plan 或旧 TripRevision 继续完整可用

**Given** 部分城市 candidate revisions 已成功但本次未发布
**When** 用户在完全相同的 frozen input/strategy/fact validity 下重试
**Then** 系统可以按确定性 cache/reuse policy 复用仍有效的 candidate revision，并只重跑失败或失效 segment
**And** 任一相关城市输入、TransferLeg、Stay/Luggage、策略版本或关键事实变化时必须使对应 candidate 失效；不得把旧结果套到新边界

**Given** 全部单城 candidate revisions 和 Trip 联合校验均满足发布条件
**When** fenced current attempt 提交结果
**Then** 在一个数据库事务中创建 published `TripRevision`，绑定按序完整的 PlanRevision、TransferLegRevision、StayRevision 与 LuggageTransitionRevision 集合，并原子更新 Trip 及必要 Plan current pointers
**And** 引用数量必须与当前 segment/adjacent boundary 集合一致；缺失、重复、跨 owner、provisional、stale 或混用不同 input revision 的引用使整个事务失败，不暴露部分 current 状态

**Given** 相同 PlanningJob 完成消息、队列回调或提交请求被重复投递
**When** attempt fencing、generation 和 result identity 相同
**Then** 返回同一个 TripRevision；旧 generation、取消任务、不同 payload 或已被新任务替代的结果不得再次发布
**And** 事务失败或进程在提交中断时 current pointer 只能保持完整旧版本或指向完整新版本，不能出现部分城市已更新

**Given** TripRevision 原子发布成功
**When** S6/S7 shell 解析为完成状态
**Then** 直接展示一个统一联程时间轴，顶部提供可滚动有序城市链和完整日期导航，每日内容来自对应单城 PlanRevision
**And** 不显示独立“AI 已完成编排”中间页、不要求采用多个城市版本，也不提前显示 Epic 5 的 `完善行程细节` CTA

**Given** 当前日期是两个城市的交接日
**When** 时间轴渲染
**Then** 按时间顺序展示上游城市安排、完整 transfer 区间、明确 `已到达{目标城市} · 之后由{目标城市}计划安排` 分割提示、下游城市安排和目标住宿/行李状态
**And** transfer 使用与普通 POI 可区分但不夸张的行程行，不被复制两次；不存在空白缝隙伪装成可用时间或跨城地点混排

**Given** 联程含有较多城市或日期
**When** 用户滚动城市链、日期 tabs 或从 transfer/候选/酒店返回
**Then** 保留 active city Plan、active day 和每城市滚动上下文，并可从任一城市进入其单城候选、酒店和校验视图
**And** 长链不截断当前城市身份、不造成 tab/清单 rail/历史控件重叠，也不把全 Trip 日期误编号为另一个城市的 local day

**Given** 用户在已发布联程的某个 active city 打开 Story 3.5 AI 调整
**When** 解释 scope 或生成方向
**Then** 最大 scope 仍为该 active `TripSegment -> Plan` 的 `整趟当前城市行程`，且所有方案必须尊重 frozen handoff 边界
**And** 不读取并修改其他城市、TransferLeg 或城市链；跨城请求引导进入联程入口，当前 Story 不声称已交付规划后 TripRevision 重绑定，该能力归后续 Story 4.4

**Given** 任一手工、候选、住宿、FixSheet 或 AI mutation 作用于 published Trip 中的 Plan
**When** apply 命令不能在同一事务中创建并切换到引用新 PlanRevision 的完整 successor TripRevision
**Then** 服务端以 typed `linked_trip_rebind_required` 拒绝，客户端保留当前联程并禁用/解释不安全的确认动作
**And** 不允许单独推进子 Plan current pointer、制造 TripRevision 引用陈旧版本或借普通 Plan API 绕过原子一致性；完整重绑定由 Story 4.4 交付

**Given** SSE 连接断开、客户端/服务/worker 重启、应用进入后台或用户重新登录
**When** 使用 owner-scoped Job id 与 last acknowledged cursor 恢复
**Then** 从持久化单调事件续传父 Job 和每城市事实子状态，最终解析到同一个失败状态或 TripRevision
**And** 不依赖内存队列作为真相、不重复启动成功 segment、不重放敏感 payload，也不让其他 owner 订阅城市级事件

**Given** planning、validation 和 publication 行为进入日志、Sentry、Langfuse、指标或分析
**When** 记录阶段、城市子状态、fallback、校验、失败、复用或发布
**Then** 只记录脱敏 segment 数量、状态计数、耗时/成本桶、约束/冲突类型、attempt generation、revision delta 和错误类别
**And** 不记录完整城市链、POI/酒店/行李/精确路线、protected URL、用户约束原文、Provider prompt/payload/secret、chain-of-thought 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用联程规划进度与完成时间轴
**When** 查看城市子状态、长链导航、失败恢复、交接日或切换 active city
**Then** 目标至少 44pt，图标具备标签/角色，状态/当前城市/错误不只依赖颜色，焦点与 live-region 只播报必要阶段变化并支持 reduced motion
**And** 长城市名、N 个状态、断线重连、多日 tabs、transfer 详情和错误文案不得造成溢出、卡片套卡片、布局跳动、重复播报或不可达操作

**Given** Story 4.3 准备关闭
**When** 使用 2/N 城、长链、零/多 required、沿途候选、酒店留空/换住、特殊时段、known/unknown 路线、confirmed handoff、边界越界、单城 hard/soft conflict、Trip 级日期/行李/负荷冲突、部分成功、Provider fallback、candidate reuse/失效、幂等/并发/attempt fencing、原子事务失败、SSE 重启恢复、owner 越权和当前城市 AI scope fixture，并运行 OpenAPI/生成类型、Prisma migration、TripPlanningJob/orchestrator/Planner/Validator/repository/API/SSE/mobile/accessibility tests、真实 PostgreSQL、真实 Provider/route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 任意长度的有序城市链都能在冻结交通边界内按城市独立编排，并且只有完整一致的版本集合会作为一个可浏览联程原子发布
**And** 本 Story 不实现规划后单城 mutation 的 TripRevision 重绑定、跨城 AI 调整、购票、DayExcursion 子计划编排、跨时区、夜间跨日交通、任意整链重排、餐饮/清单、行程细节、ResultSheet 或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.4: 已发布联程的当前城市安全编辑与版本重绑定

As a 旅行者,
I want 在联程中继续修改当前城市的安排,
So that 局部调整不会破坏交通边界、其他城市计划或联程版本一致性.

**Requirements:** FR8, FR9, FR14, FR21, FR22, FR35, FR36, FR44-lite,
FR49, FR50, FR51; NFR1, NFR3-NFR6, NFR8-NFR11, NFR21-NFR23;
AR1-AR5, AR8, AR9, AR11-AR15, AR17-AR21; UX-DR2, UX-DR3,
UX-DR18-UX-DR25, UX-DR32-UX-DR35
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在查看 published TripRevision 中某个城市的 S7/S8 时间轴
**When** 打开编辑、候选、住宿、FixSheet 或 AI 调整入口
**Then** shell 明确显示 active city/segment，并把精确 current TripRevision、该 segment 的 current PlanRevision、active day/slot 和滚动上下文传给入口
**And** 长城市链切换不会复用上一城市的 command scope、候选、酒店或 undo context；关闭后焦点和上下文返回原 active city

**Given** Story 3.1-3.5 的任一 mutation UI 在 linked Plan 中使用
**When** 用户形成调时、同城移动/替换/删除、候选落位、住宿/早餐/行李、FixSheet 或 AI typed command
**Then** 复用既有字段规则、预览、diff、Validator 和用户文案，并把命令包装为绑定 active TripSegment 的共享 Trip mutation command
**And** 不复制六套编辑实现、不把 LLM 输出直接持久化，也不允许旧普通 Plan apply endpoint 单独推进 linked Plan

**Given** 用户在当前城市内选择目标地点、日期、候选、住宿或代理地标
**When** 服务端解析 mutation target
**Then** 所有 POI/candidate/stay/landmark 必须属于 active segment 的同一城市和 owner，日期必须属于该 segment 的 local range
**And** 跨城市 ID、其他 segment day、其他 owner 资源或无法解析城市的目标返回 typed boundary/ownership error，不静默改成当前城市对象

**Given** 用户尝试把活动移动/延长到 confirmed handoff 区间、另一个 segment 或该城市 usable interval 之外
**When** 执行发布前结构校验
**Then** 拒绝该 mutation 并说明可用边界、相邻交通和返回修改路径，current Trip/Plan 保持不变
**And** 不通过缩短 transfer、删除缓冲、移动另一城市活动、制造跨段 slot 或把负时间当作自由时间来强行通过

**Given** 用户通过候选区选择一个属于其他城市的 L3 required/along_route
**When** 确认地点意图
**Then** 进入 Story 4.1 的新增/已有目标城市流程，保留 intent 与 provenance，但不创建当前城市 Plan mutation
**And** 如果目标城市已在 Trip 中则引导切换该 segment；如果是新城市则基于 current TripRevision 创建独立 linked draft，current published Trip 保持完整可用

**Given** 用户修改已发布联程的城市日期、插入新城市或重新选择跨城交通
**When** 该操作会改变 segment 边界、TransferLeg 或一个以上 Plan 的 usable interval
**Then** 从 current TripRevision 原子克隆 owner-scoped draft，并回到 Story 4.1/4.2 的相应输入与确认流程，之后只通过 Story 4.3 重新联合校验和发布
**And** 不在普通 Plan mutation 中直接改 current TransferLeg/日期/城市链；取消或失败丢弃/保留草稿而不影响 current published Trip

**Given** 一个当前城市 mutation 已形成最终 diff
**When** 用户查看确认前预览
**Then** 同时展示 active city 内的 before/after、相关日期/slot、相邻通勤以及可能受影响的 handoff、住宿/行李或负荷
**And** 预览绑定 expected TripRevision 与 PlanRevision；查看、返回、切换方案、关闭或 stale 刷新均不创建 PlanRevision、TripRevision、EditEvent、ValidationRun 或 undo entry

**Given** mutation 只改变 active city 且通过发布前结构校验
**When** apply 携带 owner、idempotency key、expected TripRevision、expected PlanRevision、segment id、command/payload hash 和来源预览 id
**Then** 服务端在一个事务中构建新 PlanRevision、必要的 Stay/Luggage revisions、关联 EditEvent，以及引用该新版本的完整 successor TripRevision
**And** 不在事务完成前推进子 Plan current pointer；相同键/相同 payload 重放返回同一 PlanRevision/TripRevision 对，不同 payload 或任一 expected revision 过期返回 typed conflict

**Given** successor TripRevision 正在构建
**When** 组合完整引用集合
**Then** 只替换 active segment 的 PlanRevision 及本命令实际产生的 Stay/Luggage 引用，其他 segment、TransferLeg、Stay 和 LuggageTransition 精确复用 current TripRevision 中未受影响版本
**And** 引用数量、顺序、owner、segment/transfer 邻接和 input lineage 必须完整一致；不得遗漏其他城市、复制逻辑实体、混用另一个 Trip 或引用 provisional/stale transfer

**Given** mutation 是候选落位、替换、移动、删除或恢复
**When** 创建新 PlanRevision
**Then** 同一事务保存 Story 3.1/3.2 要求的 candidate state、intent、origin、EditEvent 和 inverse command，使时间轴与候选区在 successor TripRevision 中一致
**And** landmark_proxy 仍只提供同城近似路线端点，不继承地标事实；unresolved 候选不得落位，跨城候选不得借代理绕过 segment guard

**Given** mutation 修改酒店、早餐或行李
**When** Story 3.3 的 material impact 预检查和确认完成
**Then** 在同一 Trip mutation 中创建不可变 StayRevision/必要 LuggageTransitionRevision，并让 successor TripRevision 引用它们及新 PlanRevision
**And** 不静默移动 POI、修改 confirmed TransferLeg 或重排整日；早餐等无 material impact 变更可直接保存，影响 handoff/寄存/入住时必须进入 revision-bound 增量校验

**Given** 用户在 linked Trip 中提交 Story 3.5 自然语言调整
**When** 解释最小 scope、AdjustmentAsk、方向和 diff
**Then** 最大 scope 为 active segment 的 `整趟当前城市行程`；`后面` 只表示该城市后续日期/安排，所有候选方案必须尊重 handoff 和本城约束
**And** 涉及新增/删除/reorder 城市、修改 TransferLeg、调整另一城市或跨城统一重排的请求不生成可应用 command，改为引导对应城市或联程编辑入口

**Given** mutation 事务提交成功
**When** 新 PlanRevision 与 successor TripRevision 同时成为 current
**Then** 立即对新 PlanRevision 运行 Story 3.4 的 revision-bound 增量 ValidationRun，并扩展到受影响相邻 handoff、Trip 级住宿/行李和 FR51 负荷范围
**And** 不重排或重新运行其他城市 Planner；未受影响城市继续引用相同 revision，跨段事实只做校验而不静默改写

**Given** mutation 在结构上合法但产生 derived hard/soft conflict
**When** 新 ValidationRun 完成
**Then** 保留已原子发布的 successor TripRevision，并在 linked timeline 按 Story 3.4 分层显示绑定新 Trip/Plan revision 的状态：仅 soft 使用一个低强调 `有N项建议核对 · 查看` 入口，hard-only/mixed 保留可见冲突 banner；点击后才进入原 FixSheet，不自动弹出或按城市重复提示
**And** 不静默回滚合法 mutation、不把 hard conflict 标为 clean，也不允许后续细节/导出绕过 Story 3.4 的精确 gate

**Given** mutation 来自 FixSheet
**When** 用户确认一个仍适用于 current Trip/Plan revision 的 typed alternative
**Then** 使用同一共享 Trip mutation transaction 应用 command set、创建 successor TripRevision 并重新校验
**And** stale FixSheet、部分 command failure 或跨 segment alternative 不得发布；结果 Sheet 只说明实际发生的当前城市变化和仍存在问题

**Given** linked Trip 中任一城市完成一次 mutation
**When** 时间轴恢复
**Then** 顶部统一 history 控件记录一个 Trip-scoped、带城市标签的最近操作，默认 history icon 在八秒内变为 `撤销 8`，并保留额外一条最新 eligible undo
**And** 控件不随 active day/city 重置，不出现每城市或底部重复 undo；历史列表不开放任意版本浏览

**Given** 用户撤销 linked Trip 最近一条 eligible mutation
**When** undo command 携带 expected current TripRevision、目标 EditEvent 和幂等键
**Then** 在一个事务中追加补偿 PlanRevision/必要 Stay-Luggage revisions 和 successor TripRevision，恢复 mutation 前完整引用与候选状态
**And** 不删除历史版本、不单独回退子 Plan、不恢复已失效 TransferLeg，也不撤销另一个 owner/Trip 或已被后续不兼容操作覆盖的 entry

**Given** 用户在一个城市预览期间另一设备或另一城市成功发布 mutation
**When** 原预览尝试 apply 或 undo
**Then** expected TripRevision fencing 使原流程 stale，即使其 expected PlanRevision 本身未变化也必须拒绝并提示查看最新联程
**And** 不把旧 diff 拼接到新 TripRevision、不覆盖另一城市提交、不消费 undo 机会，输入/Sheet 上下文可在刷新后安全恢复

**Given** 数据库事务、后续校验、网络响应或客户端刷新失败
**When** mutation/undo 的最终状态需要恢复
**Then** current Trip 与 active Plan pointers 只能同时保持完整旧版本或同时指向完整新版本，并可通过 idempotency 查询已提交结果
**And** 不显示虚假成功、不暴露孤立 current PlanRevision；若事务成功但校验暂时失败，保留新联程并显示 pending/degraded validation，而不是回退一半

**Given** linked mutation、validation 或 undo 行为进入日志、Sentry、Langfuse、指标或分析
**When** 记录预览、应用、冲突、stale、失败、恢复或撤销
**Then** 只记录脱敏 command/issue 类型、active segment ordinal、revision delta、影响范围、耗时和错误类别
**And** 不记录完整城市链、POI/酒店/行李/路线、用户自由文本、protected URL、Provider prompt/payload/secret、chain-of-thought 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 编辑 linked Trip
**When** 切换城市、打开/关闭 Sheet、查看 diff、确认、冲突、撤销或 stale 恢复
**Then** 目标至少 44pt，active city/状态/禁用原因不只依赖颜色，图标有标签/角色，Sheet 支持焦点约束/返回、键盘、安全区、reduced motion 和克制 live-region
**And** 长城市名、多项 diff、相邻 handoff、冲突和 undo 城市标签不得造成文字溢出、卡片套卡片、布局跳动、当前 segment 丢失或重复播报

**Given** Story 4.4 准备关闭
**When** 使用 Story 3.1-3.5 全部 mutation 类型、当前/其他/跨城目标、handoff 越界、跨城 L3、新增城市/交通 draft 回环、candidate exact/proxy/unresolved、住宿/行李 material impact、AI current-city scope、derived conflict/FixSheet、Trip-scoped 八秒/额外一条 undo、跨城市并发/stale、幂等、事务/校验失败和 owner 越权 fixture，并运行 OpenAPI/生成类型、Prisma migration、TripMutation/revision/repository/validator/API/mobile/accessibility tests、真实 PostgreSQL、必要的 route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以在任意长度 linked Trip 中安全编辑当前城市，每次成功修改或撤销都通过完整 successor TripRevision 保持所有城市与交通引用一致
**And** 本 Story 不实现一次命令修改多个城市、跨城 AI 调整、自动重排相邻城市、购票、DayExcursion 创建/编排/编辑、跨时区、夜间跨日交通、任意整链重排、餐饮/清单、行程细节、ResultSheet 或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.5: 跨城一日游意图与往返交通草稿

As a 旅行者,
I want 在选择跨城地点时安排同日往返，并分别确认去程和返程,
So that 我能得到完整、可恢复的一日游输入，而不需要建立重复的主城市行程.

**Requirements:** FR14, FR27.1, FR29-FR31, FR35, FR35.1, FR49, FR50;
NFR1, NFR6, NFR8, NFR10, NFR11, NFR19, NFR21-NFR23; AR2-AR5, AR9,
AR11, AR14, AR15, AR18-AR20; UX-DR2, UX-DR3, UX-DR7, UX-DR8,
UX-DR11-UX-DR15, UX-DR24, UX-DR25, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 用户在 S4 Picker 或 S8 计划编辑中查看一个已由 CanonicalPOI 验证城市归属的跨城 L3
**When** 对该 L3 选择 `required` 或 `along_route`
**Then** 打开与当前 owner/Trip/Plan revision 绑定的跨城选择 Sheet，而不是把地点直接放入当前城市时间段、候选落位命令或 PlanRevision
**And** L1/L2 只提供地理上下文；未选择、仅浏览或无法确认城市归属时不创建 DayExcursion、TripSegment、Plan、TransferLeg、intent 或 undo entry

**Given** 跨城选择 Sheet 已打开
**When** 目标为泉州且宿主为厦门
**Then** 标题显示 `西街在泉州`，正文显示 `当前是厦门行程，选择一种加入方式`，并提供互斥的 `安排泉州一日游 / 当天往返，住宿仍在厦门` 与 `增加泉州行程 / 在泉州停留，并单独设置住宿`
**And** 一日游路线使用 `厦门 → 泉州 → 厦门`；操作文案跟随选择，始终提供 `暂不加入`，且不显示内部 DayExcursion/TripSegment/Plan 术语

**Given** 用户在跨城 Sheet 选择 `增加{目标城市}行程` 或 `暂不加入`
**When** 提交选择
**Then** 新增城市继续进入 Story 4.1 的主链草稿流程，取消则关闭 Sheet 并完整保留当前状态
**And** 本 Story 不复制主链新增实现，也不把取消、返回或关闭解释为一日游确认

**Given** 当前是独立单城 Plan 或已存在的 linked Trip
**When** 用户选择 `安排{目标城市}一日游`
**Then** 创建或复用 owner-scoped linked draft，并绑定宿主 TripSegment、宿主本地日期候选、目的地城市及一个独立的目的地单城 child Plan
**And** 单城升级只在 draft 中引用原宿主 Plan；不修改原 current Plan/TripRevision，不创建 `A1 → B → A2` 同级 segment，不创建目的地 Stay，也不移动宿主行李

**Given** 目标城市也在当前 Trip 的另一个主 segment 中出现
**When** 用户仍明确选择某个宿主日期的一日游
**Then** 以 `dayExcursionId + childPlanId + hostSegmentId + localDate` 创建独立上下文，并在摘要中使用 `{目标城市}一日游 · {日期}` 与主城市段区分
**And** 不按城市名称合并 child Plan、复用另一日期的 PlanRevision、跳转到错误 segment 或创建第二个同名宿主 Tab

**Given** 用户进入一日游设置页
**When** 选择一日游日期
**Then** 只列出宿主 segment local range 内、没有主链 handoff 且尚无 DayExcursion 的有效日期，并显示宿主上下文如 `厦门 · D2 7月15日`
**And** 每个宿主日最多一个 DayExcursion；日期不属于宿主、已被占用、跨时区或会产生嵌套/同日 A-B-C-A 时返回 typed reason，不静默换日或删除既有输入

**Given** 用户编辑 `前往{目标城市}` 与 `返回{宿主城市}`
**When** 选择精确航班/铁路、两小时时间段、AI 建议后确认，或手工汽车/巴士/轮渡输入
**Then** 两条边分别复用 Story 2.3/2.4 与 Story 4.2 的 provider-neutral 事实、terminal 匹配、access/wait/travel/egress、manual、source、confidence、observedAt 和 freshness 合同
**And** outbound 与 return 可使用不同交通方式；铁路/航班可同时查询后按结构和 provider 结果消歧，AMap 不充当班次来源，界面不声称已购票

**Given** Provider 或 AI 返回一个候选去程或返程
**When** 结果仍为 `provisional`、班次/terminal 有歧义、事实过期或只满足时间窗口
**Then** 显示真实状态和查看/重新选择/手工填写路径，并要求用户确认具体可执行边界后才能把该 leg 标为 confirmed
**And** 不从距离估算班次、不把建议描述成预订、不让一条已确认交通替另一条缺失交通背书

**Given** 去程已确认但返程缺失、不可用、过期或失败
**When** 设置页渲染
**Then** `返回{宿主城市}` 显示 `尚未确认返程` 及 `搜索车次 / 手动填写`，保留已完成去程和全部草稿输入，并禁用 `确认一日游`
**And** 明确提示需要确认返程后才能继续；关闭、弱网、Provider 配额或进程重启不得虚构返程、清空去程或启动 PlanningJob

**Given** 去返两条交通均为 confirmed
**When** 执行结构预检查
**Then** 验证目的地与宿主不同、同一 timezone/localDate、outbound 完整结束早于 return handoff 开始、两段均包含所需接驳缓冲，且中间存在正的 child Plan usable interval
**And** 不自动缩短 access/wait/egress、移动冻结事实或放宽主链边界；失败保留草稿并指出需要修改的具体 leg/日期

**Given** 一日游设置页显示当天住宿与行李摘要
**When** 宿主日期有酒店、酒店留空或行李未决定
**Then** 分别如实显示 `返回{宿主酒店}`、`住宿未设置` 或当前行李状态，且这些字段仍引用宿主 Stay/Luggage 输入
**And** 目的地不创建住宿晚、早餐或 LuggageTransition，不自动选择酒店，也不因一日游改变宿主 `near_hotel` 事实

**Given** 日期和两条交通通过结构预检查
**When** 用户点击 `确认一日游`
**Then** 以一个事务保存 `DayExcursion(state=ready)`、child Plan 输入、原 required/along_route intent/provenance、去返 confirmed TransferLegRevision 引用及新的 linked-draft revision
**And** 本 Story 不创建 DayExcursionRevision、PlanRevision、TripRevision、PlanningJob、时间轴 slot、EditEvent 或 undo entry；相同键/相同 payload 重放返回同一 ready draft

**Given** 一日游由 S4 创建
**When** ready draft 保存成功
**Then** 返回 S5 规划前确认并保留 Picker 地图/L2/L3 位置及必去/顺路计数，一日游以用户可理解的日期/目的地摘要进入规划输入
**And** S5 仍是唯一 `开始规划` 入口；一日游设置页不得自行开始规划或显示第二个完成计划

**Given** 一日游由已发布 S8 计划创建
**When** ready draft 保存成功或用户暂时退出
**Then** 原 current Trip/Plan 时间轴保持完整可用，来源页面显示可恢复的一日游设置状态，并允许继续完成后续重规划流程
**And** 在后续原子规划/发布 Story 完成前不把 child Plan 或交通显示为已执行时间轴、不推进 current pointer，也不静默改写原计划

**Given** 用户返回、切换应用、退出登录、深链恢复、网络中断或服务重启
**When** 再次打开同一 owner 的一日游输入
**Then** 恢复 host segment/date、目标城市、child Plan、intent/provenance、两条交通各自的 mode/status/facts、完成门禁和来源 S4/S8 上下文
**And** 返回源页面恢复原滚动/焦点；不依赖内存状态，不跨 owner 暴露地点、路线、日期、酒店、行李或 protected source

**Given** 创建、编辑或确认请求携带 owner、idempotency key、expected draft/current revision 和 payload hash
**When** 请求重复、并发、stale、payload 改变、资源跨 owner 或 host/day identity 不匹配
**Then** 相同键/相同 payload 返回同一结果，其余返回 typed conflict/ownership/boundary error，并保留完整旧 draft/current Trip
**And** 不产生重复 child Plan/TransferLeg、孤立 DayExcursion、部分 ready 状态、跨 owner 缓存命中或错绑同名城市

**Given** 一日游输入行为进入日志、Sentry、指标或产品分析
**When** 记录分流、日期、交通状态、确认、恢复、拒绝或失败
**Then** 只记录脱敏 choice、host/destination relationship、日期相对位置、leg mode/status、完成状态、耗时和错误类别
**And** 不记录完整城市链、POI/terminal/酒店/行李、精确班次路线、用户文本、protected URL、Provider payload/secret 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用跨城 Sheet 与一日游设置
**When** 选择分流、日期、交通，处理缺失返程、错误、恢复或确认
**Then** 目标至少 44pt，互斥选择/状态/禁用原因不只依赖颜色，图标有标签/角色，Sheet 支持焦点约束/返回、键盘、安全区、reduced motion 和克制 live-region
**And** 长城市/站点/班次名、不同交通方式、错误与恢复提示不得造成溢出、卡片套卡片、布局跳动、重复播报或不可达操作，并按 Entry/Transport Concept R1 验证视觉层级

**Given** Story 4.5 准备关闭
**When** 使用 S4/S8 required/along_route、独立 Plan/linked Trip、目标城市已存在主段、有效/占用/handoff 日期、铁路/航班/手工及混合往返、exact/window/AI/provisional/confirmed、去返缺失/歧义/过期/失败、酒店有值/留空、行李未决定、取消/恢复/stale/幂等/owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、DayExcursion draft/repository/transport/API/mobile tests、真实 PostgreSQL、flight/rail/AMap staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以把跨城 L3 明确保存为同日往返的一日游输入，且系统拥有完整、可恢复、事实诚实的日期与去返交通草稿
**And** 本 Story 不实现 child Plan 编排、DayExcursionRevision/TripRevision 原子发布、合并时间轴、规划后 child slot 编辑、日期/交通 successor TripRevision、AI child-plan 调整、Trip-level undo、购票、跨时区、跨夜折返、嵌套/多目的地一日游、餐饮/清单、行程细节、ResultSheet 或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.6: 跨城一日游独立编排与原子时间轴发布

As a 旅行者,
I want AI 在确认的往返交通之间编排一日游，并与宿主城市原子发布为一条时间轴,
So that 我能直接执行同日跨城计划，而不会看到重复城市或部分完成的行程.

**Requirements:** FR7, FR9, FR14, FR21, FR22, FR31-FR33, FR35, FR35.1,
FR36, FR36.1, FR49-FR51; NFR1, NFR3-NFR12, NFR17, NFR21-NFR23;
AR2-AR9, AR11-AR15, AR18-AR20; UX-DR1-UX-DR3, UX-DR17-UX-DR19,
UX-DR22, UX-DR24, UX-DR25, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**CE amendment approved (2026-09-14):** CE-02将已发布行程新增一日游限制为目标宿主日及child Plan；其他日期保持不变。4.7显式更换一日游日期仍按原合同处理旧/新宿主日，不因此扩大4.6新增操作的范围。

**Acceptance Criteria:**

**Given** 用户从 S5 开始规划或从 S8 继续一日游重规划
**When** 服务端加载 Story 4.5 的 DayExcursion 输入
**Then** 只接受 owner 相同、draft revision/current Trip fencing 有效、状态为 `ready`、宿主日期有效且 outbound/return 均为 confirmed/fresh-enough 的输入
**And** 缺失 child Plan、intent/provenance、任一 leg、正的 child usable interval，或出现 host-day handoff/另一 DayExcursion 时不启动新 attempt，并返回可恢复到具体日期/交通字段的 typed input error

**Given** ready DayExcursion 输入通过启动门禁
**When** 用户在 S5 点击唯一的 `开始规划`，或在 S8 明确继续重规划
**Then** 创建或复用一个 owner-scoped、幂等且可恢复的 TripPlanningJob，并冻结精确 input revision、宿主 Plan/Trip 基线、DayExcursion、两条 TransferLeg、策略与外部事实版本
**And** 用户只看到一个 PlanningJob 和一个最终结果；host/child/provider/deterministic attempts 只是父 Job 下的事实子状态，不形成 Quick/HQ、主/子两份待采用结果或第二个完成入口

**Given** Planner 为含 DayExcursion 的宿主日期计算可用区间
**When** 读取 outbound handoffStart/handoffEnd 与 return handoffStart/handoffEnd
**Then** 宿主 Plan 只拥有当天开始至 outbound handoffStart 前，以及 return handoffEnd 后至当天结束的两个可用区间；child Plan 只拥有 outbound handoffEnd 至 return handoffStart 之间的区间
**And** access/wait/travel/arrival/egress 全部属于对应 transfer，不可被任一 Plan 使用；区间相交、倒序、零/负长度、跨日或跨时区立即使 attempt 失败，不把交通时间伪装成自由时间

**Given** 首次 S5 规划包含一个或多个主 segment 及 DayExcursion
**When** TripCoordinator 安排工作
**Then** 复用 Story 4.3 的单一 TripPlanningJob，按主 segment 与 DayExcursion child Plan 的独立输入启动 fenced 单城 Planner attempts，并把 host day 的分裂区间作为不可越过的硬边界
**And** 不创建 `A1 → B → A2` 同级 segment、不把 child POI 混入宿主候选池、不让主链 Planner 覆盖 child attempt，也不要求用户按城市逐个启动规划

**Given** 一日游来自已发布 S8 计划
**When** 为 successor Trip 候选编排
**Then** 以current TripRevision/host PlanRevision为基线，精确复用所有其他segment、TransferLeg、DayExcursion、Stay/Luggage、宿主其他日期及未受本次当天重规划影响的已确认slot；只重算目标host date的受影响非冻结安排与新child Plan，所有允许变动仍须进入预览并由用户确认
**And** 不重新运行其他日期/城市 Planner、不重写无关候选/细节/override，不让新增一日游静默改变 current pointers；所有候选结果在用户确认前保持不可见或明确 preview-only

**Given** host date 原有活动占用新的 outbound/child/return 区间
**When** 构建 S8 重规划候选
**Then** Planner只在目标host date未被去返交通/child占用的合法宿主区间内提出移动；仍放不下的非冻结地点保留为带原因的unresolved/candidate，并保留required、用户修改和来源，不移动到宿主其他日期
**And** 不重算或修改其他宿主日期/城市，不删除required意图或移动/丢弃冻结预约票务；冻结安排冲突由既有hard gate阻止发布，所有允许的当天变化进入Trip diff，后续跨日移动只能走另一次明确编辑/AI调整及预览确认

**Given** child Plan 开始编排
**When** 生成目的地城市候选与排期
**Then** 复用 Story 2.11-2.13 的单城 required/along_route、owner inspiration、AnchorPool/Top-50、AMap 补全、CanonicalPOI 去重、RouteFact、开放时间、强时段、节奏与自由时间合同
**And** child route 从 confirmed outbound 到达/egress 端点开始，在 confirmed return access 端点结束；不创建目的地 Stay/早餐/行李/near_hotel，不调用用户级 XHS 关键词搜索，也不因候选不足暂停整个 PlanningJob

**Given** DayExcursion 的 required L3 无法在 child usable interval 内安全落位
**When** 运行 child Planner 与初始 Validator
**Then** 按现有 required 语义保留带原因的未解决项，并在仍有可执行 child schedule 时允许继续联合校验
**And** 若两条交通之间不足以形成任何有意义且满足硬约束的目的地安排，则返回 `day_excursion_not_feasible` 并引导修改日期/交通，不发布只有往返交通而没有可执行目的地内容的空一日游

**Given** host 与 child candidate PlanRevisions 已生成
**When** 执行初始单 Plan 校验
**Then** 分别校验 ownership、日期/城市、slot 顺序、营业/路线/冻结/required、负荷、候选与各自 usable interval，并把结果绑定精确候选 revision
**And** host 校验继续覆盖宿主 Stay/早餐/行李/near_hotel；child 校验不得读取或生成目的地 Stay，unknown/stale 路线或营业事实不默认为安全

**Given** host 与 child 各自通过结构校验
**When** 执行 DayExcursion/Trip 联合校验
**Then** 验证同一 timezone/localDate、一个 host day 最多一个 excursion、该日无主链 handoff、outbound/return 完整顺序与缓冲、host-before/child/host-after 无重叠、宿主酒店和行李引用未改变，以及 FR51 全日负荷/连续早起风险
**And** hard conflict 阻止发布并精确关联 host/child/具体 leg；soft-only 以一个低强调 `有N项建议核对 · 查看` 入口进入原风险摘要/详情，计数绑定本次校验的精确 revision 且不自动打开 FixSheet，不能把两个单 Plan 的 clean 结果误当成联合 clean；hard-only/mixed 仍按原门禁和可见问题处理

**Given** Provider、route、Planner 或 Validator 在 host/child 任一子 attempt 中超时、降级或失败
**When** 父 PlanningJob 继续或结束
**Then** 只在同一个 fenced Job 内使用已批准的 deterministic/低成本 fallback，报告真实受影响范围并保留可重试的 ready draft
**And** 不以 host 成功掩盖 child 失败、不以 child 成功推进宿主 current pointer、不让迟到结果覆盖新 generation/用户 mutation，也不向用户暴露另一份待采用计划

**Given** 任一 host/child attempt、联合校验或持久化失败、取消或 stale
**When** PlanningJob 结束
**Then** 不创建 published DayExcursionRevision/TripRevision，不推进任何 host/child Plan current pointer，且原 current 单城 Plan 或 TripRevision 继续完整可用
**And** 未发布 candidate revisions 保持不可由普通计划路由读取；重试只在 frozen input/strategy/fact validity 未变时复用仍有效候选，任一相关日期、leg、intent、策略或事实变化使对应候选失效

**Given** 首次 S5 规划的 host、child、其他主 segment 与所有联合校验均满足发布条件
**When** fenced current attempt 提交结果
**Then** 在一个数据库事务中创建 child PlanRevision、DayExcursionRevision 和完整 TripRevision，绑定 host/所有主 segment PlanRevision、child PlanRevision、outbound/return 及其他 main TransferLegRevision、宿主 Stay/Luggage 和其他现行引用，并原子更新必要 current pointers
**And** DayExcursionRevision 精确绑定 `hostSegmentId + localDate + childPlanRevisionId + outboundTransferRevisionId + returnTransferRevisionId`；缺失、重复、跨 owner、provisional、stale、错误 role 或混合 input lineage 使整个事务失败

**Given** S8 一日游重规划已形成通过校验的 candidate revision set
**When** 用户查看发布前预览
**Then** 展示一个 Trip 级 before/after，包含新增的一日游、host date 保留/移动/未解决变化、两条冻结交通、宿主酒店/行李、负荷与 warning，并明确其他日期/城市不变
**And** 查看、返回、关闭、切换方案或取消不创建 current PlanRevision/TripRevision、EditEvent 或 undo entry；预览绑定 expected TripRevision、host PlanRevision、DayExcursion draft revision 和 candidate identity

**Given** S8 用户确认一个仍适用于 current revisions 的一日游预览
**When** apply 携带 owner、idempotency key、expected Trip/host Plan/draft revisions 与 preview hash
**Then** 在一个事务中发布 host candidate PlanRevision、child PlanRevision、DayExcursionRevision、完整 successor TripRevision 和一个 Trip-scoped EditEvent，并原子推进必要 current pointers
**And** 未受影响引用逐项复用 current TripRevision；相同键/相同 payload 返回同一结果，stale/不同 payload/部分事务失败保留完整旧 current 状态，不拼接旧 preview 与新 Trip

**Given** 初次或 S8 successor TripRevision 已成功发布
**When** S6/S7 shell 解析完成状态
**Then** 直接显示一条可编辑时间轴，不进入独立“AI 已完成编排”页面；顶部仍为宿主 Trip/Plan 标题和一个 Dn 日期 Tab，并可在该 Tab 内显示紧凑的 `{目标城市}一日游` 子标签
**And** 不创建第二个宿主城市 Tab、不新增目的地住宿日、不让同名 city label 决定 active scope，也不提前显示 Epic 5 的细节完善 CTA

**Given** 用户查看含 DayExcursion 的 Dn
**When** 时间轴渲染
**Then** 按绝对时间依次显示 `{宿主城市} · 可安排至…`、宿主前段、唯一 outbound 交通卡、`{目标城市}一日游 · …后可安排`、child POI、唯一 return 交通卡、`已回到{宿主城市} · …后可安排`、宿主后段和宿主 HotelFooter
**And** transfer 与 POI 视觉可区分但不夸张，交通区间不重复、不生成虚假 commute/free slot；酒店保持宿主名称与 `今晚继续入住/未设置` 等真实状态，并按 Timeline Concept R1 验证层级

**Given** 目的地城市也存在于另一个主 segment 或多个日期的一日游
**When** 用户切换日期、打开 POI/候选/负荷或从 Sheet 返回
**Then** read model 与客户端用 `tripRevisionId + hostSegmentId + dayExcursionId + planId + localDate` 保持正确 active context，显示 `{城市}一日游 · {日期}` 与主段区分
**And** 不按 city name 合并候选、未解决项、滚动位置、PlanRevision、命令 scope 或分析事件，也不渲染两个同名宿主 Tab

**Given** 时间轴或候选/负荷入口需要识别当前范围
**When** 用户位于 outbound 前、child section、return 后或打开相关 Sheet
**Then** 分别携带明确 host Plan、child Plan 或 transfer identity；AI 调整入口在 child section 可显示 `当前范围 · {目标城市}一日游`，但 mutation apply 在 Story 4.7 前保持不可用或明确引导
**And** 本 Story 不把自由文本传给错误 Plan、不允许现有 Story 3 endpoint 越过 host/child boundary，也不让 transfer card 被普通 slot editor 修改

**Given** S8 一日游发布创建了 Trip-scoped EditEvent
**When** 用户在八秒内或通过最新 eligible history entry 撤销该次添加
**Then** 复用 Story 4.4 的全计划 undo transaction，追加 successor TripRevision 恢复发布前 host Plan/Trip 引用并移除 current DayExcursion 引用，同时保留不可变历史与审计
**And** 不删除 child/transfer 历史行、不单独回退 host 或 child current pointer、不撤销另一个 Trip/owner，也不让一日游拥有独立或底部重复 undo；首次 S5 初始发布不创建 mutation undo

**Given** SSE 断开、客户端/worker/服务重启、应用后台、重复回调或重新登录
**When** 使用 owner-scoped Job id 与 last acknowledged cursor 恢复
**Then** 从持久化单调事件恢复父 Job、host/child 子状态、preview/apply 或同一 published TripRevision，并保持一次最终完成解析
**And** 不重复启动已成功 attempt、不重放敏感输入、不让其他 owner 订阅 child 状态、不显示 host done 后又回到 arranging 的倒退阶段，也不在网络失败时误报已发布

**Given** DayExcursion planning/publication 行为进入日志、Sentry、Langfuse、指标或分析
**When** 记录阶段、子状态、fallback、校验、preview、发布、撤销或失败
**Then** 只记录脱敏 host/child role、relative day、leg mode/status、slot/issue/count、revision delta、耗时/成本桶和错误类别
**And** 不记录完整城市链、POI/terminal/酒店/行李/精确路线、用户约束原文、protected URL、Provider prompt/payload/secret、chain-of-thought 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 查看一日游规划、预览和时间轴
**When** 查看阶段、切换日期、展开交通/POI、确认/取消 S8 diff、撤销或恢复错误
**Then** 目标至少 44pt，host/child/transfer/状态/禁用原因不只依赖颜色，图标具备标签/角色，焦点/返回/键盘/安全区/reduced motion/live-region 符合既有基线
**And** 长城市/站点/地点名、两张交通卡、密集 child POI、warning、候选与 HotelFooter 不得造成溢出、卡片套卡片、布局跳动、错误 scope、重复播报或日期 rail/历史控件重叠

**Given** Story 4.6 准备关闭
**When** 使用首次 S5 与已发布 S8、单/多主 segment、目标城市另有主段、host 前后均有/无安排、required 可排/未解决/零可执行内容、不同去返方式、边界重叠/过短/跨日、酒店有值/留空、unknown/stale RouteFact、Provider fallback、host/child/联合 hard-soft conflict、partial attempt、candidate reuse/失效、preview 取消/stale/apply、原子事务失败、Trip undo、SSE 重启恢复、幂等/并发/owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、TripPlanningJob/DayExcursion orchestrator/Planner/Validator/repository/API/SSE/mobile/undo/accessibility tests、真实 PostgreSQL、真实 Provider/route staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** AI 能在确认往返边界内独立编排目的地，并与宿主计划作为一个完整 TripRevision 原子发布到单一、无重复城市 Tab 的时间轴
**And** 本 Story 不实现一日游日期/交通修改、删除、child slot 的替换/移动/调时/候选落位、AI child-plan mutation、跨 host-child 统一调整、购票、跨时区、跨夜折返、嵌套/多目的地一日游、餐饮/清单、行程细节、ResultSheet 或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 4.7: 已发布跨城一日游的安全编辑与范围约束

As a 旅行者,
I want 修改一日游安排、日期或往返交通，也可以删除一日游,
So that 每次变化都作用于正确城市，并保持整趟计划一致、可校验和可撤销.

**Requirements:** FR8, FR9, FR14, FR21, FR22, FR31, FR35, FR35.1,
FR44-lite, FR49-FR51; NFR1, NFR3-NFR6, NFR8-NFR12, NFR21-NFR23;
AR2-AR5, AR8, AR9, AR11-AR15, AR18-AR21; UX-DR2, UX-DR3,
UX-DR18-UX-DR25, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在查看 published TripRevision 中含 DayExcursion 的宿主日期
**When** 从 `{目标城市}一日游` 分割行或其可访问 overflow 打开操作 Sheet
**Then** Sheet 显示 `{目标城市}一日游`、`Dn · 日期 · 当天往返`，并提供 `调整{目标城市}安排 / 修改往返交通 / 更换一日游日期 / 删除一日游`
**And** 住宿与行李说明仍归宿主计划；不显示内部 revision/Plan/segment 术语，不把普通 child POI overflow、transfer 卡或 HotelFooter 混成同一个操作入口

**Given** 操作 Sheet、child POI、候选、FixSheet 或 AI 调整入口被打开
**When** 客户端建立 command context
**Then** 绑定精确 owner、current TripRevision、DayExcursionRevision、hostSegmentId/localDate、host PlanRevision、child PlanRevision、outbound/return TransferLegRevision 和 active slot/candidate
**And** 不用 city name 推导身份；目标城市也存在主 segment、同日其他同名 POI、切换日期或返回 Sheet 时不得复用错误 Plan、候选、滚动位置、preview 或 undo context

**Given** 用户在 child section 对一个 POI 使用调时、替换、删除或恢复
**When** 形成 Story 3.1 的类型化 mutation
**Then** 复用分钟精度、预览、nullable commute、冻结事实、candidate state、EditEvent、Validator 和 inverse command 规则，但 target Plan 固定为当前 DayExcursion child Plan
**And** slot 必须保持在 outbound handoffEnd 与 return handoffStart 之间，不得进入 transfer、宿主前后时段、另一 DayExcursion、主 segment 或另一 owner 资源

**Given** child Plan 只有一个 localDate
**When** 打开 Story 3.1 的移动日期操作
**Then** `移至前一天 / 移至其他 / 移至后一天` 全部禁用或不呈现，并给出“更换一日游日期”专门入口
**And** 不把 child POI 单独移到宿主日期、另一城市 Plan 或另一 DayExcursion；整体换日必须走本 Story 的 date-draft/replan 流程

**Given** 用户从 child 候选区选择 required、along_route 或其他候选
**When** 选择推荐位置、精确时间、替换 child POI 或填入 child 自由时间
**Then** 复用 Story 3.2 的 preview/confirm command，候选 CanonicalPOI/landmark proxy 必须属于 child destination city 和 owner，并在 child usable interval 内校验路线/容量
**And** unresolved 候选不得落位，landmark_proxy 不继承地标事实；宿主/另一主 segment 候选和相同城市但不同 Plan 的候选不得因名称匹配进入当前 child

**Given** 用户编辑宿主 Plan 中 outbound 前或 return 后的 POI、候选、住宿或 FixSheet
**When** Story 3/4.4 command 接近 DayExcursion 边界
**Then** target 仍为 host Plan，并把去返 handoff 当作不可越过的结构边界；合法 mutation 创建 successor host Plan/Trip revisions 并复用不变 DayExcursion/child/transfer 引用
**And** 不延长/移动宿主 slot 进入 child 或 transfer，不通过减少接驳缓冲强行通过，也不让 child Plan 的存在阻止其他宿主日期的普通安全编辑

**Given** 用户在 child section 打开 `AI 调整`
**When** 解释 slot/连续安排/单日/整趟范围、AdjustmentAsk、方向和 diff
**Then** 最大范围固定为当前 `DayExcursion child Plan`，界面显示 `当前范围 · {目标城市}一日游`，`后面` 仅指 child usable interval 内更晚安排
**And** 不读取并修改宿主 Plan、另一主 segment、另一同名目的地 Plan、outbound/return、日期、Stay/Luggage 或城市链；生成的 command 只能使用 child Plan 允许的 Story 3 mutation 类型

**Given** 用户在宿主前段或返程后段打开 `AI 调整`
**When** 解释当前城市整趟或后续范围
**Then** 最大范围仍为宿主 `TripSegment -> Plan`，并把 DayExcursion 两条交通和 child interval 视为冻结边界
**And** 不把“整趟”扩展到 child Plan，不把“返程后”解释成目的地后续，也不借宿主命令删除、压缩或移动 DayExcursion

**Given** AI 请求范围不唯一或可能触碰 required、冻结事实、host/child 边界或 material risk
**When** 需要澄清或告警
**Then** 复用 Story 3.5 的一个 revision-bound `AdjustmentAsk`，再显示 `选择一个调整方向`、精确 diff 和确认；ask/快捷项本身不写入计划
**And** 不展示“我理解为”或 chain-of-thought，不同时修改 host 与 child，不提供通过改变交通/日期才能成立却伪装为 child 局部调整的方案

**Given** 用户通过 AI 输入要求修改去程、返程、一日游日期、宿主安排或多个城市
**When** interpreter 识别为非 child-slot mutation
**Then** 不生成可应用 child command，并引导 `修改往返交通`、`更换一日游日期`、宿主 AI 调整或对应联程入口
**And** 不让 LLM 直接写 TransferLeg/DayExcursion/Trip JSON，也不自动扩大 scope、创建跨 Plan command 或静默开始重规划

**Given** 用户选择 `更换一日游日期`
**When** 进入日期编辑
**Then** 从 current TripRevision 创建 owner-scoped revision-bound draft，复用 Story 4.5 的有效日期门禁，仅允许宿主 range 内、无主链 handoff、无另一 DayExcursion 且同一 timezone 的日期
**And** current published Trip 保持可浏览；旧/新宿主日期、intent/provenance 和两条交通输入随 draft 保留，非法/取消/stale 不移动 current DayExcursion 或清空原日期

**Given** 新日期可能改变可用班次、接驳、host slots 或 child 开放时间
**When** 用户确认日期候选
**Then** 将两条 leg 标记为需按新日期复核，要求重新获得 confirmed/fresh-enough 事实，并复用 Story 4.6 只重算旧宿主日、新宿主日和 child Plan
**And** 其他宿主日期/segment/DayExcursion/Stay/Luggage 保持冻结；不得把旧日期班次继续标为 confirmed、复制 child slots 到新日期或在重规划前推进 current pointer

**Given** 用户选择 `修改往返交通`
**When** 编辑 outbound、return 或两者
**Then** 复用 Story 4.5 的独立两-leg 输入、Provider/manual/provisional/confirmation 与结构预检查；未修改 leg 只有在日期、terminal、freshness 和边界仍兼容时才可复用
**And** 任一新 leg 缺失、歧义、过期、不可行或未确认时保留 current published DayExcursion 并显示可恢复草稿，不从旧 leg/距离推断新事实或部分替换 current transfer

**Given** 新去返交通均已确认并改变 host/child usable intervals
**When** 用户继续重规划
**Then** 复用 Story 4.6，只重算受影响 host date 与 child Plan，保留其他日期/城市/用户修改，并生成包含 slot 保留/移动/未解决、交通、酒店/行李和负荷的 Trip diff
**And** 不在客户端拖动现有 slot 拼接新区间、不跳过联合 Validator，也不在用户确认 preview 前发布任何 current revision

**Given** 用户选择 `删除一日游`
**When** 查看危险操作确认
**Then** 显示将移除的目的地安排、去返交通、释放的宿主时间、宿主酒店/行李保持不变，以及 `返回修改 / 删除一日游`
**And** 打开、返回或取消不写入 revision；删除仅作用于目标 DayExcursion，不删除目的地的主 segment、其他日期一日游、导入灵感、候选源或历史版本

**Given** 用户确认删除
**When** 构建删除后的候选计划
**Then** 移除 current DayExcursion/child/outbound/return 引用，复用 Story 4.6 对释放区间的宿主日期进行受控重算；既有合法宿主 slot 优先保留，无法/无需补充时保留明确自由时间
**And** 不静默填满释放时间、不自动恢复早期已删除 POI、不重跑其他日期/城市，也不在 preview/联合校验和最终确认前推进 current pointer

**Given** 日期、交通或删除重规划形成候选 revision set
**When** 用户查看发布前影响预览
**Then** 展示完整 before/after、受影响宿主日期、child/transport 增删改、required/候选变化、酒店/行李、DayLoadEstimate、hard/soft issue 和明确不变范围
**And** preview 绑定 expected Trip/host/child/DayExcursion/draft revisions；查看、返回、取消、切换或 stale 刷新不创建 current revision、EditEvent 或 undo entry

**Given** 用户确认一个仍适用于 current revisions 的日期、交通或删除 preview
**When** apply 携带 owner、idempotency key、expected revision set 与 preview hash
**Then** 复用 Story 4.6 的事务，原子创建必要 host/child PlanRevision、TransferLegRevision、DayExcursionRevision（删除时移除 current ref）、完整 successor TripRevision 和一个 Trip-scoped EditEvent，并推进一致 current pointers
**And** 未受影响引用逐项复用；相同键/相同 payload 返回同一结果，stale/不同 payload/部分事务失败保留完整旧 current 状态，不出现新交通配旧 child 或新 child 配旧 host 的混合快照

**Given** mutation 只改变 child slot/candidate/AI 安排而不改变日期或交通
**When** 用户确认 Story 3 的最终 diff
**Then** 在一个事务中创建 successor child PlanRevision、复用两条 confirmed transfer 的 successor DayExcursionRevision、完整 successor TripRevision、EditEvent 与 inverse command，并原子推进必要 pointers
**And** host PlanRevision 及其他 Trip 引用精确复用；不得单独推进 child Plan、修改 DayExcursion entity 原位真相、绕过 TripRevision 或把一个 child mutation拆成多个 history entries

**Given** 任一合法 mutation 原子发布成功
**When** 运行 revision-bound 增量 Validator
**Then** 校验变化的 host/child Plan、两条 handoff、全日无重叠、宿主 Stay/Luggage、required、RouteFact、开放时间和 FR51 负荷，并把结果绑定新的 Trip/Plan/DayExcursion revisions
**And** 不重排未受影响内容；derived conflict 保留新 revision 并复用 Story 3.4 的分层状态：仅 soft 使用低强调 `有N项建议核对 · 查看`，hard-only/mixed 保留可见 banner，点击才进原 FixSheet且不重复弹出；结构无效在写入前拒绝，hard conflict 继续阻止细节/导出

**Given** FixSheet 为 host 或 child issue 提供 typed alternatives
**When** 用户选择一个仍适用于 current revision 的修复
**Then** 只允许在对应 active Plan 和其 usable interval 内应用，并通过同一 Trip mutation transaction 创建 successor revisions、重新校验和全局 undo
**And** 需要改变日期/transport/另一 Plan 的 alternative 不作为普通 FixSheet command 应用，改为引导专门入口；stale、部分命令或跨边界修复不得发布

**Given** 一日游任一编辑成功
**When** 时间轴恢复
**Then** 顶部唯一 plan-global history 控件记录一个带 `{目标城市}一日游` 或宿主城市上下文的 Trip-scoped entry，并在八秒内显示 `撤销 8`，之后保留最新一条 eligible undo
**And** child 不拥有独立/底部 undo，控件不随 host/child section 或日期切换重置，不开放任意历史版本浏览

**Given** 用户撤销最近一条 eligible 一日游 mutation
**When** undo 携带 expected current TripRevision、EditEvent 和幂等键
**Then** 在一个事务中追加补偿 host/child/transfer/DayExcursion revisions 与 successor TripRevision，恢复 mutation 前完整引用、候选状态、日期和时间轴
**And** 不删除历史行、不单独回退一个 Plan/leg、不撤销另一个 owner/Trip，也不恢复已被后续不兼容事实取代的外部班次；stale undo 不消费撤销机会

**Given** 用户预览期间另一设备、host/child 或另一城市成功发布 mutation
**When** 原 preview、apply、FixSheet 或 undo 继续
**Then** expected TripRevision 使原流程 stale，即使局部 PlanRevision 未变也拒绝，并提示刷新完整联程后重新生成影响预览
**And** 不把旧 diff 合并到新 Trip、不覆盖另一提交、不复用旧 transport freshness、不产生部分 history/undo，且可在刷新后恢复安全输入上下文

**Given** 网络、数据库事务、后续校验、Provider 或客户端刷新失败
**When** 编辑流程恢复最终状态
**Then** current Trip/host/child/DayExcursion/transfer pointers 只能共同保持完整旧版本或共同指向完整新版本，并可通过 idempotency 查询真实提交结果
**And** 不显示虚假成功、不暴露孤立 current child/leg；事务成功但校验暂时失败时保留完整新 Trip 并显示 pending/degraded validation，而不是回滚一半

**Given** 一日游编辑、AI scope、校验或 undo 进入日志、Sentry、Langfuse、指标或分析
**When** 记录入口、scope、preview、apply、冲突、stale、删除、恢复或撤销
**Then** 只记录脱敏 command/issue 类型、host/child role、relative day、leg mode/status、revision delta、影响计数、耗时和错误类别
**And** 不记录完整城市链、POI/terminal/酒店/行李/路线、用户自由文本、protected URL、Provider prompt/payload/secret、chain-of-thought 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 编辑一日游
**When** 打开操作 Sheet、child slot、AI scope、日期/交通/删除 preview、FixSheet、undo 或 stale 恢复
**Then** 目标至少 44pt，active host/child/transfer、选择、状态与禁用原因不只依赖颜色，图标有标签/角色，Sheet 支持焦点约束/返回、键盘、安全区、reduced motion 和克制 live-region
**And** 长城市/站点/地点名、多项 diff、两条交通、warning 和历史标签不得造成溢出、卡片套卡片、布局跳动、错误 scope、重复播报或日期 rail/历史控件重叠，并按 Day-excursion Timeline Concept R1 验证操作与 AI 层级

**Given** Story 4.7 准备关闭
**When** 使用 child 调时/替换/删除/候选/AI、宿主边界编辑、child day-move 禁用、候选 exact/proxy/unresolved、目标城市另有主段、AI scope/ask/no-safe/stale、日期有效/占用/handoff、交通单边/双边/过期/失败、删除有/无补充候选、preview 取消/stale/apply、host/child/联合 conflict/FixSheet、Trip undo、并发/事务/恢复、幂等/owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、TripMutation/DayExcursion revision/repository/validator/AI interpreter/API/mobile/undo/accessibility tests、真实 PostgreSQL、必要的 transport/route/Provider staging、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以安全修改或删除已发布一日游，且所有命令都作用于正确 host/child/transfer 范围并通过完整 successor TripRevision 保持整趟一致、可校验和可撤销
**And** 本 Story 不允许一个命令同时调整 host 与 child，不实现跨城统一 AI 调整、自动改变另一主城市、购票、跨时区、跨夜折返、嵌套/多目的地一日游、任意整链重排、餐饮/清单、行程细节、ResultSheet 或导出

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 5: 把计划完善为可核查、可分享的行程单

用户可以在不改变排期的前提下补充执行细节、why 和引用，保留自己的轻编辑，
并预览、保存或分享单城及联程行程单。

### Story 5.1: 版本绑定的 AI 行程细节完善

As a 旅行者,
I want 在不改变已排计划的前提下补全每个适用安排的执行细节和可信来源,
So that 我能知道具体做什么、准备什么和注意什么，同时保留已经确认的排期.

**Requirements:** FR10, FR22, FR23, FR25 (fill operation-surface slice),
FR37 (minimum S10 host/entry-return slice), FR38 (fill first-use controls), FR39, FR49; NFR1-NFR4, NFR6, NFR8-NFR12,
NFR17, NFR21-NFR23; AR1-AR6, AR8, AR11-AR20; UX-DR1-UX-DR3,
UX-DR29, UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Delivery boundary (IR-09, 2026-09-15):** 本 Story 同时交付 S7 既有计划级入口可达的最小 S10 基础行程宿主页、S10→S9→原 S10 返回链及 S9 最小鉴权来源展开。Story 5.2 在同一路由/读模型上增强完整核查、槽位阅读和 CitationSheet；不作为本 Story 的入口、返回或基本可核查性前置条件。

**Acceptance Criteria:**

**Given** Story 5.1 已部署、Story 5.2 的完整行程单增强尚未交付，且 owner 拥有 current、已发布并可合法浏览的独立 PlanRevision 或完整 TripRevision
**When** 用户从 S7 既有、不占 POI 瀑布或 HotelFooter 纵向空间的计划级行程单入口进入 S10
**Then** 本 Story 的同一 S10 路由先展示 exact owner/revision 的只读基础行程、日期与 segment/host-child scope，以及通向 S9 的最小计划级行程细节动作；有真实待完善项时用 `还有N处细节可完善 · 去完善` 作一行摘要，N来自同一revision的实际待完善数量，其他运行/失败/完成状态保持真实；是否存在 FillRun/SlotDetail 不影响基础行程可见性，不要求先完善再阅读
**And** 基础行程保留权威时间、槽位、主链交通、一日游去返、住宿/行李与日期边界；只读取同 revision 已有的 ValidationRun 和细节运行事实来展示真实 gate/状态，不因打开 S10 创建 ValidationRun、FillRun、排期 revision 或第二套结果真相
**And** 未解决 hard conflict、无效交通或不完整原子引用保持原完善门禁并提供已交付修复入口，soft warning 用低强调行内入口 `有N项建议核对 · 查看` 与必要短摘要并允许继续，检查读取失败/缺失不冒充已通过；S7/S8 不增加细节状态卡/底部完善 CTA，未交付的完整核查、槽位阅读或 CitationSheet 不提供占位入口

**Given** owner 拥有一份 current、已发布且可安全浏览的 PlanRevision 或完整 TripRevision
**When** 从本 Story 已交付的最小 S10 宿主页行程细节动作进入，或经受保护的 S9 深链/原任务恢复入口继续
**Then** 在明确绑定的 current revision 上打开 S9，正常产品路径保持 S10→S9；深链/恢复先验证 owner、目标及当前状态，并恢复或建立合法的 S10 父上下文，不经过独立“AI 已完成编排”中间页，也不把完善设为初始规划完成的阻塞步骤
**And** S7/S8 不渲染细节待完善/已完善卡片或底部 CTA；只读打开、深链恢复及返回不自动开始新 FillRun，目标及父上下文使用稳定 id/revision、日期、segment/host-child scope 和安全滚动锚点，不从城市名称或任意客户端返回 URL 推断

**Given** 当前 revision 存在未解决 hard conflict、无效主链 transfer、缺失一日游返程或不完整原子引用
**When** 用户请求完善细节
**Then** 在创建 FillRun 前返回类型化门禁，定位到现有 conflict/FixSheet 或对应跨城修复入口
**And** soft warning 允许继续，在 S9 用 `有N项建议核对 · 查看` 与必要短摘要呈现同revision的实际soft事项，同一原因只留一个入口，具体原因在现有核查/修复详情按需展开；用户仍按原主按钮继续，不增加“我已读完”或逐条确认；不得用 Filler 绕过 Validator、修复排期或把无效联程包装成可执行行程单
**And** 最小 S10 宿主页与 S9 读取同 revision 的既有 ValidationRun/结构事实；当前检查缺失、读取失败或绑定过期时仅显示真实检查/恢复状态并按既有 gate 拒绝无法证明可接受的新完善请求，不因导航或“整体核查”展示重复启动校验

**Given** 当前 revision 通过完善门禁
**When** 用户提交一次细节完善请求
**Then** 服务端复用并迁移现有 `FillRun/FillItem` 基线为 owner-scoped、revision-bound、durable 且 fenced 的 FillRun/attempt，记录 target kind/id、幂等键、prompt/config version 和状态
**And** 同一 owner、target revision、配置与幂等键返回同一 run；相同键不同 payload、越权目标、已删除目标或不属于 current aggregate 的 revision 返回类型化错误，不创建平行 FillJob 真相

**Given** target 是独立单城 PlanRevision
**When** 服务端构建填充范围
**Then** 只遍历该 revision 中由服务端判定适用的已排槽位，并保存稳定 slot identity、类型、日期、时间、POI/路线事实和可用 owner evidence snapshot
**And** 候选、未解决地点、未落位灵感、清单和不存在的早餐/酒店不得被偷偷转成时间轴内容或填充目标

**Given** target 是 linked TripRevision
**When** 服务端构建填充范围
**Then** 精确遍历该 TripRevision 绑定的每个主 PlanRevision 和 DayExcursion child PlanRevision，并保留 segment/day/host-child 顺序与 scope identity
**And** Trip-owned TransferLeg、Stay、LuggageTransition 和 DayExcursion 边界继续使用其权威事实；Filler 不改写它们，也不把同名城市、旧 PlanRevision 或不属于该 TripRevision 的 slot 混入 run

**Given** 一个适用槽位具备 POI、导入证据、官方/AMap 快照或已验证路线事实
**When** 生成该槽位的上下文
**Then** 只提供完成 `做什么 / 准备 / 注意 / why_short / citations` 所需的最小、owner-authorized、带 source/time/quality 的事实
**And** 不向 Provider 发送整个私人灵感库、其他 owner 数据、原始受保护链接、无关酒店/路线、连续位置轨迹或未脱敏 account/Trip 内容

**Given** Provider 返回结构化槽位细节
**When** 服务端验证输出
**Then** `做什么` 必须存在且为一至三行，`准备` 与 `注意` 各为零至三行，每行最多 30 个字符，并为适用槽位提供简短 why 与可验证 citation references
**And** 不接受 HTML/脚本、未知 slot、重复 slot、跨 run slot、排期字段、POI 替换、Stay/Transfer mutation、chain-of-thought 或未在 schema 中允许的持久字段

**Given** 某一行超过 30 字或数组超过三行
**When** 输出进入服务端规范化
**Then** 在持久化前按 Unicode 安全边界硬裁并添加省略号，保留原始 validation code 与截断指标，但只向客户端返回安全规范化内容
**And** 客户端不得承担唯一长度校验，也不得因一个字段截断改变 slot success/partial 的其余有效内容

**Given** 某槽位缺少必填 `做什么`、结构损坏或引用指向不存在/未授权证据
**When** 槽位级验证失败
**Then** 在受限重试预算内只重试该槽位；仍失败时记录 typed degraded/failed item，并为可安全表达的内容提供通用建议或明确“暂未生成”
**And** 其他合法槽位继续持久化，run 可 truthful 地结束为 partial；不得制造 citation、从另一槽位复制事实或因单槽失败丢弃整趟已成功内容

**Given** 生成内容包含具体营业、预约、路线、价格、历史或体验事实
**When** 持久化 SlotDetail 与 citation
**Then** 每条可展示事实关联 source type/id、observed timestamp、最小摘要、source attribution、quality/audit state 和 owner access rule
**And** citation identity 与受保护 URL 分离；客户端只通过 owner-checked citation read 获取允许的短摘要/安全链接，不能从 ID 猜测或读取其他用户来源

**Given** owner 正在 S9 浏览当前绑定 revision 中已生成的槽位内容，Story 5.2 的 CitationSheet 尚未交付
**When** 用户按需展开该内容的来源依据
**Then** 本 Story 通过 owner、slot/revision 与 citation ACL 检查，提供紧凑只读展开，展示真实可访问的来源身份、source attribution、相关最小安全摘要及适用的观测时间；已有允许的来源/导入记录查看动作复用实际可用的鉴权能力，不能只显示等待未来页面的占位链接
**And** 无可靠来源的安全通用内容仍以 `建议核对` 作次要行内提示，并在主动查看依据时说明暂无可核对来源；不伪造来源数量、摘要、预约证据或短链，也不要求逐条核对后才能继续使用行程
**And** 来源删除、失权、过期或读取失败时局部显示 `暂时无法查看` 与真实重试/收起路径，保留合法内容和阅读上下文；不能回退原始受保护 URL、泄露其他 owner 存在性或依赖 5.2 才能验收来源读取

**Given** `做什么` 没有足够可靠的事实来源
**When** Filler 仍可给出不依赖具体事实的通用执行建议
**Then** 保留通用文案并在对应内容旁以次要行内文字 `建议核对` 弱提示，S9不为此弹窗、要求逐条确认或阻断已有安全内容浏览；本 Story 已提供 S9 的最小来源/依据展开，用户可以先继续使用基础行程再按需在 S9 查看；Story 5.2 后续将同一事实增强为 S10 槽位详情与 CitationSheet，不改变非阻断语义
**And** 无法安全给出通用建议时显示 `暂未生成`；不得把模型常识、旧缓存、推断预约或不可靠 UGC 包装成已确认事实

**Given** FillRun 开始前已记录目标 revision 的结构快照
**When** 任一 attempt 返回或准备提交 SlotDetail
**Then** 服务端断言 slot date/start/end/order/type/POI、PlanRevision、Stay、LuggageTransition、TransferLeg 和 current pointers 与填充前完全一致
**And** 任何 schedule mutation 字段或结构漂移使 attempt 失败/陈旧且不发布详情；Filler 不调用 Planner、SlotEditor、Validator fix apply 或 AI adjustment mutation API

**Given** 同一目标的多个 Provider attempt、重试或 worker 同时完成
**When** 持久化结果
**Then** 只有 current fenced attempt 可以原子写入该 FillRun 的 SlotDetail/citations 和 terminal state，其他 attempt 标记 superseded 且不能覆盖
**And** 成功写入使用事务、唯一约束和可重放幂等结果；数据库中断不得留下 done run 配缺失 items、跨 revision details 或半授权 citations

**Given** 用户或另一设备在 FillRun 期间发布了新的 PlanRevision 或 TripRevision
**When** run 继续验证、持久化或客户端恢复
**Then** 原 run 标记 stale 或 completed-for-old-revision，但绝不自动附着到新 current revision；S9 提示计划已变化并可基于新版本重新开始
**And** 旧 revision 的审计结果可以按权限保留，但不显示成当前行程细节、不推进 current pointer、不覆盖用户编辑，也不消耗新 revision 的幂等请求
**And** 返回 S10 时重新核对 current 指针；原 revision 仍可合法读取时可保留正在阅读的安全旧快照并提示刷新，新 current 展示走既有刷新规则；刷新后仅恢复仍有效的日期/scope/锚点，失效处回到有效父上下文，不拼接两版成员，也不自动重新完善

**Given** FillRun 被接受并异步执行
**When** 客户端订阅、刷新、断线重连或服务进程重启
**Then** 持久事件使用单调 sequence/cursor 表达 accepted/context/generating/validating/persisting/done/partial/failed/stale 与 heartbeat，并从最后确认位置恢复
**And** UI 映射为事实动作与已处理槽位计数，不显示伪造百分比、Provider 名称、Quick/HQ 或第二份待采用结果；内存 timer/queue 不是 run 状态真相

**Given** 用户额度、并发、成本预算、Provider timeout 或 circuit breaker 限制本次完善
**When** 请求被排队、切换受控低成本路径、部分降级或终止
**Then** S9 只显示真实任务处理状态及 `稍后继续 / 重试 / 返回行程单` 等可用动作，不展示额度或 low 分级；主返回进入本 Story 的 S10 宿主页，需要修复排期时由已有 `查看冲突 / 返回编辑` 动作进入 S7/S8，既有计划始终可浏览和手工编辑
**And** 不要求 BYOK，不暴露模型/Provider/密钥/内部成本阈值；所有路线失败时不制造结果，普通可恢复限流也不提前触发 Epic 8 管理员告警

**Given** S9 已收到槽位结果
**When** 用户按天浏览生成内容
**Then** 保持当前计划标题与 day/segment/DayExcursion 层级，以计划级短摘要呈现真实完善进度，存在待完善项时可用 `还有N处细节可完善`；查看实际槽位内容时分清生成中、已生成、建议核对、暂未生成或失败重试，并折叠超长 `做什么 / 准备 / 注意`；不在总览每张卡重复完整度提示，`建议核对`仅为非阻断行内弱提示，不升级为计划级警告或反复Toast，也不把partial/失败显示为全部成功
**And** S9 不提供排期编辑、地点替换、user override、恢复 AI、ResultSheet 完整核查或导出；完成、部分完成、失败及用户主动返回都回到本 Story 已交付的同一 S10 宿主页，恢复进入前日期、segment/host-child scope、有效滚动锚点和触发焦点，并只重读对应运行/当前版本状态，不创建新 FillRun 或排期 revision；只有用户明确选择修复/编辑才进入既有 S7/S8

**Given** S9 通过深链、鉴权恢复、后台切回或旧 run URL 打开
**When** owner/session、run target 或 current revision 不匹配
**Then** 先完成统一鉴权与 owner lookup，再显示登录恢复、stale、not-found 或无权限状态，并在安全情况下提供回到 current S10 基础行程的路径
**And** 不通过响应差异泄露 run/plan/slot/citation 是否属于其他 owner，不把旧 run 自动升级到 current revision，也不在客户端拼接受保护 source URL
**And** 合法 S9 直接恢复没有现成父视图时，以鉴权解析后的稳定 aggregate 与当前可用 revision 建立默认 S10 日期/scope 返回上下文，不依赖 Story 7.1 最近行程元数据或未来 5.2 页面；目标删除/失权时使用既有统一不可用状态与安全导航，不能为完成回环读取不可访问行程

**Given** FillRun、SlotDetail、citation、SSE、日志、Sentry、Langfuse 或分析记录执行
**When** 记录调用与结果
**Then** 只记录脱敏 target kind、匿名 revision correlation、slot type、状态、计数、耗时、token/cost bucket、prompt/config version 和稳定错误类别
**And** 不记录完整用户输入、POI/酒店/路线原文、受保护 URL、citation 原文、Provider payload/secret、token、chain-of-thought 或跨 owner 内容，私有对象只通过短期签名/鉴权读取

**Given** 用户使用触控、键盘、读屏或 reduced-motion，通过 S7 计划级入口使用最小 S10、S9 与最小来源展开
**When** 操作入口、基础行程日期/scope、状态列表、来源/内容展开、重试、返回或错误恢复
**Then** 目标至少 44pt，状态不只依赖颜色，图标有标签/角色，焦点顺序与返回可预测，动态更新使用克制 live-region，动效遵循 120-200ms 或 reduced-motion
**And** 长城市链、地点名、三行内容、引用状态、部分失败和键盘不得造成文字溢出、卡片套卡片、布局跳动、重复播报或遮挡底部安全区

**Given** ResultSheet Overall Check R1 已确定 S10 到 S9 的入口，但当前视觉注册表仍缺少 S9 运行状态原型
**When** Story 5.1 进入 UI 实现前 checkpoint
**Then** 在既有 S9 运行状态 checkpoint 中同时确认 S7 非占时间轴计划级入口、最小 S10 基础宿主页/细节动作、S9 生成中/断线恢复/partial/建议核对/failed/stale、最小来源展开以及返回原 S10 日期/scope/滚动的连贯原型，并登记到 prototype coverage；沿用已批准 Overall Check R1 的最终入口层级与现有基础行程视觉，不提前声称完整 5.2 已交付
**And** `story-5-1-detail-entry-states-r1.png` 不得指导实现；文本合同继续是行为权威，不得复用旧“AI 完成编排”中间页或在 S7/S8 自行增加细节状态卡

**Given** Story 5.1 准备关闭
**When** 在 Story 5.2 尚未交付的配置下实际走通 S7→最小 S10→S9→同 S10，使用单城、无细节联程、多主城市、DayExcursion、适用/不适用 slot、无 FillRun、hard/soft/未知检查、完整/超长/缺失 do、最小来源展开及有效/失效/越权/无来源、complete/partial/failed/主动返回、current 更新/stale、深链缺父上下文、同日期/scope/滚动/焦点恢复、幂等/并发/事务失败、额度/Provider 降级、SSE 重连/重启、owner 隔离和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、FillRun/attempt/repository/Filler/schema/citation/API/SSE/mobile/accessibility tests、真实 PostgreSQL、脱敏 Provider staging、厦门行程 fixture、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以在不改变任何排期字段的前提下，为当前确定 revision 获得诚实、可恢复、可追溯且允许部分降级的执行细节，并能从基础行程实际进入、查看依据及回到原上下文；导航不新增 FillRun/ValidationRun/PlanRevision，不依赖未来页面或 mock 来源入口
**And** 本 Story 只交付最小 S10 基础宿主页、细节动作和返回闭环及 S9 最小来源展开，不交付 Story 5.2 的完整 ResultSheet 双行核查/槽位内容页/CitationSheet 增强；也不实现 user override、重新完善时的用户原文保护、图片导出、保存/分享、餐饮/清单扩展、最近行程或 check-in，不提供恢复 AI 功能

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 5.2: 可核查的行程单与引用查看

As a 旅行者,
I want 在紧凑行程单中查看当前已排计划，并按需检查每个安排的执行细节和来源,
So that 即使 AI 细节尚未全部完善，我也能使用基础行程并判断重要信息是否可信.

**Requirements:** FR10, FR22, FR23, FR37 (full checks/slot reading/citation enhancement over Story 5.1 minimum host), FR39,
FR49; NFR3, NFR4, NFR6, NFR8-NFR12, NFR20-NFR23; AR1-AR5,
AR8-AR12, AR14, AR15, AR17-AR20; UX-DR1-UX-DR3, UX-DR29,
UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Delivery boundary (IR-09, 2026-09-15):** 复用 Story 5.1 已交付的 S10 路由、基础行程读取、S9 动作、最小来源 read 与父上下文，增强完整核查与 S10 阅读/来源呈现；不另建 ResultSheet/ValidationRun/引用权威，也不重复首个 S10 入口交付。

**Acceptance Criteria:**

**Given** owner 拥有一份 current、已发布且可浏览的单城 PlanRevision 或完整 TripRevision
**When** 从 S7、S9 完成/部分完成状态或受保护深链进入 S10
**Then** 在 Story 5.1 最小宿主页基础上增强同一 ResultSheet，绑定精确 owner 与该 current revision，并首先读取其权威日期、槽位、交通、住宿和行李结构
**And** 是否存在 Story 5.1 的 SlotDetail 不影响基础行程可见性；不得以 FillRun 缺失为由显示空白页、伪造失败计划或混入另一 revision 的细节

**Given** 用户仍在 S7/S8 编辑时间轴
**When** 查看通向 S10 的计划级入口
**Then** 沿用 Story 5.1 已交付的同一计划级入口，不新增第二入口，不占用 POI 瀑布或 HotelFooter 的纵向空间，也不显示 `细节待完善 / 已完善` 状态或底部完善 CTA
**And** 编辑态只保留 Story 3 的 ValidationRun 检查状态、冲突 banner、FixSheet、AI 调整与全计划历史/undo；进入 S10 后再查看细节完整度

**Given** ResultSheet 已绑定 current revision
**When** 渲染日期 Tabs 下的 `整体核查`
**Then** 在最小宿主页上增强日期 Tabs 下的完整 `整体核查`，使用两个稳定行分别展示 `时间安排` 与 `行程细节`，前者读取该 revision 的 current ValidationRun，后者读取同一 revision 的 FillRun/SlotDetail 完整度
**And** 总览只保留这两行短摘要，具体未生成/失败与来源建议在实际槽位内容或既有核查入口按需展开，不逐卡重复完整度提示；两行不得合并状态、触发第二次校验或把 `无硬冲突` 解释为细节完整；区块为页面内平面 Section，不做嵌套卡片或挤入单个 POI 行

**Given** ResultSheet 打开某个日期或城市段
**When** 渲染行程单总览
**Then** 使用紧凑瀑布时间轴只显示当前 revision 的时间、POI/餐饮/交通名称、必要缩略图、分段边界和当日 HotelFooter
**And** 总览不内联展开 `为什么安排这里 / 做什么 / 准备 / 注意 / 来源`，不显示内部 revision、质量、新鲜度或置信度状态，点击适用槽位才进入内容页

**Given** current revision 属于 linked Trip 或包含 DayExcursion
**When** ResultSheet 构建日期和槽位顺序
**Then** 精确保留主城市段、相邻 TransferLeg、host/child 可用区间、同日一日游分割、返回宿主提示、Stay 与 Luggage 边界
**And** 不通过城市名合并 Plan，不制造重复宿主日期/城市 tab，不把 child 细节、旧 transfer、另一段酒店或相同名称 POI 绑定到错误槽位

**Given** 用户点击一个拥有当前 revision SlotDetail 的适用槽位
**When** 打开槽位内容页
**Then** 显示地点名、日期和时间、`为什么安排这里`、`做什么 / 准备 / 注意` 及来源数量，字段顺序稳定且长内容按 Story 5.1 的安全规范折叠/展开
**And** 内容页只读且不提供调时、替换、删除、AI 调整、user override 或导出；排期修改返回 S7/S8，重新完善返回 S9，产品中不存在恢复 AI 动作

**Given** current revision 没有成功的 FillRun 或没有任何 SlotDetail
**When** 用户进入 ResultSheet
**Then** 仍完整显示已编排的紧凑行程，`时间安排` 显示当前真实校验状态；存在待完善项时，`行程细节` 使用 `还有N处细节可完善` 表达同revision的实际待完善数量，并在原完善gate允许时提供 `去完善`，不要求先完善才阅读基础行程
**And** 不为不存在的细节显示空字段、假引用或通用完成状态；返回后保持原日期、segment/host-child scope 和滚动位置

**Given** Story 5.1 对 current revision 只完成了部分槽位
**When** ResultSheet 展示同一天的成功、degraded 与 failed items
**Then** 有待完善项时，`行程细节` 以 `还有N处细节可完善` 显示同revision的精确待完善数量，真实运行/partial/失败状态不伪装为全部完成；成功槽位正常打开内容页，事实不足的安全通用内容在详情内以 `建议核对` 弱提示，没有安全内容和失败的具体状态在实际槽位内容中分清，并保留 `暂未生成` 或真实重试状态及回到 S9 的计划级动作
**And** 不因部分失败隐藏基础 POI、丢弃成功内容或向用户展示 `quality/freshness/confidence` 技术枚举、分数和 `来源较充分` 一类判断

**Given** 内容页包含一个或多个当前 owner 可访问的 citation references
**When** 用户打开 `来源 N 条`
**Then** CitationSheet 复用 Story 5.1 已交付的 owner-checked citation read 与字段，增强 S10 内容关联与来源列表，按来源逐项显示来源身份、与该槽位相关的最小事实摘要、source attribution 和明确的查看动作
**And** 普通行程卡与来源列表不展示高德 Logo、技术质量/新鲜度标签或内部证据 ID；地图/官方/导入记录仅以其真实来源身份呈现，不把引用表示为预约、购票或系统背书

**Given** citation 指向高德地点事实、官方页面或 owner 导入记录
**When** 用户选择 `查看来源` 或 `查看导入记录`
**Then** 服务端复用 Story 5.1 的同一 citation 读取与权限边界，先执行 session、owner、slot/revision 和 citation ACL 检查，再返回允许展示的摘要、受保护站内详情或短期安全链接；不另建平行 ACL，也不因已有 S9 来源简介跳过本 Story 的完整引用验收
**And** 不把原始受保护 URL、对象存储路径、Provider payload、其他 owner 的导入记录或可枚举 citation identity 写入通用 ResultSheet payload、客户端日志、分析或错误文案

**Given** citation 已删除、无权、过期、来源暂不可达或安全链接刷新失败
**When** CitationSheet 请求详情
**Then** 保留当前行程和已允许展示的生成内容，并对该来源显示 `暂时无法查看` 与重试/关闭路径
**And** 不通过不同错误泄露其他 owner 资源是否存在，不回退到未经鉴权的原始链接，也不删除/伪造来源来制造完整成功外观

**Given** `做什么` 只有 Story 5.1 允许的通用建议而没有足够事实引用
**When** 用户打开对应内容页
**Then** 展示生成内容并在内容旁以次要行内文字 `建议核对` 弱提示，来源入口只反映真实可访问条数；不弹窗、不反复Toast、不要求逐条确认，允许先继续使用基础行程再按需查看来源
**And** 不展示内部质量、新鲜度或置信度状态，不把模型常识、推断预约、旧缓存或地标代理事实冒充已验证来源

**Given** current revision 存在 unresolved hard conflict、无效主链 transfer、缺失一日游返程或不完整原子引用
**When** 用户查看已有或基础 ResultSheet
**Then** 允许继续只读浏览当前行程；`时间安排` 显示 hard conflict 数量与 `查看` 修复动作，`行程细节` 显示 `解决冲突后可完善` 并保持禁用
**And** 该状态复用同一 ValidationRun 并返回 Story 3/4 FixSheet/手工编辑，不启动/冒充新的细节完善、不隐藏受影响槽位，也不把到达 S10 解释为冲突已解决；后续导出门禁仍由 Story 5.4/5.5 执行

**Given** S9 对精确 current revision 完成、部分完成、失败或恢复
**When** 用户返回 S10
**Then** 继承并验证 Story 5.1 的原 S10 父上下文返回，恢复进入 S9 前的日期、segment/DayExcursion scope、滚动位置并补齐槽位内容焦点，重新读取同一 revision 的完整整体核查状态
**And** 不跳回 S7、不创建 PlanRevision、不重复启动 FillRun，也不把旧 revision 的完成结果附着到已更新计划

**Given** ResultSheet 最初绑定 revision Rn
**When** 同一 owner 在另一标签页、另一设备、S7/S8 返回路径或后台恢复中发布 current revision Rn+1
**Then** 正常受控编辑返回优先自动读取最新版；仍在屏幕上的旧/缓存 ResultSheet 检测到 stale 后显示 `行程已有新版本`，提供 `刷新行程单 / 返回计划`
**And** 该状态用于单用户 revision 一致性而非多人协作、合并或冲突解决；刷新前不把 Rn 细节附着到 Rn+1，也不静默替换用户正在阅读的页面

**Given** 用户在新 current revision 上尚未重新运行 Story 5.1
**When** 刷新旧 ResultSheet
**Then** 立即展示新 revision 的完整基础行程，并按无细节/部分细节状态提供 `去完善`
**And** 旧 revision 的 SlotDetail/citations 只保留审计价值，不复制到新槽位、不按名称猜测复用，也不阻止用户浏览新计划

**Given** ResultSheet 首次成功呈现 owner 的 current revision
**When** 记录产品阶段完成状态
**Then** 以幂等、非排期 mutation 的方式将该 Plan/Trip 标记为已到达 S10，并记录漏斗事件；该状态由本 Story 增强交付，不回填虚构的历史完成，也不作为 Story 5.1 最小 S10 可读性的条件
**And** `已完成` 只表示已有可阅读行程单，不表示所有细节均已生成、来源均已核查、票务/预约已完成或行程无 soft warning

**Given** ResultSheet 通过深链、鉴权恢复、后台切回或离线缓存恢复
**When** session、owner、target revision 或 current pointer 发生缺失/不匹配
**Then** 先完成统一鉴权和 owner lookup，再显示登录恢复、刷新 current、not-found、无权限或可重试网络状态
**And** 只复用与同一 owner 和精确 revision 匹配的安全缓存；不得从 URL、城市名、slot 名或过期 citation 猜测资源，也不得在错误响应中泄露存在性

**Given** ResultSheet、内容页或 CitationSheet 已成功加载
**When** 后续网络中断、请求超时或 App 从后台恢复
**Then** 保留已验证的当前屏幕内容与阅读位置，显示非阻塞重试状态，并在恢复后重新检查 current revision
**And** 不清空基础行程、不把 citation 请求失败升级成计划失败、不加载另一 revision 的最近缓存，也不显示虚假在线/已刷新状态

**Given** ResultSheet、citation read、阶段完成或 stale 检测进入日志、Sentry、Langfuse、指标或分析
**When** 记录查看、展开、来源打开、失败、刷新和恢复
**Then** 只记录脱敏 target kind、匿名 revision correlation、slot/source type、状态、计数、耗时和稳定错误类别
**And** 不记录完整城市链、POI/酒店/路线原文、生成详情、导入摘要、受保护 URL、用户标识、Provider secret/payload、token 或其他 owner 内容

**Given** 用户通过触控、键盘、读屏或 reduced-motion 浏览 S10
**When** 切换日期、打开槽位、展开内容、打开/关闭 CitationSheet、刷新 stale 状态或返回计划
**Then** 目标至少 44pt，图标有标签/角色，焦点进入并返回正确触发点，状态不只依赖颜色，动态提示使用克制 live-region，Sheet 与返回支持键盘和安全区
**And** 长城市链、地点名、三行详情、来源摘要、部分状态和系统字号不得造成溢出、卡片套卡片、布局跳动、重复播报、日期 rail 遮挡或将总览重新展开成桌面表单

**Given** Story 5.2 进入 UI 实现
**When** 选择视觉权威
**Then** 在 Story 5.1 已通过的最小 S10/S9 连贯原型上增强本 Story，使用 `story-5-2-result-sheet-overall-check-r1.png` 约束完整整体核查、hard-conflict gate 与细节入口，使用 `story-5-2-result-sheet-citations-r3.png` 约束 POI-only 总览、槽位内容页和来源 Sheet，使用 `story-5-2-result-sheet-states-r2.png` 约束无细节、部分完成和 stale 恢复
**And** 文本合同优先于图片；R1/R2 citations、States R1 及 `story-5-1-detail-entry-states-r1.png` 不再指导实现；最小 S10/S9 入口、运行、断线、partial、failed/stale、最小来源与返回的独立 checkpoint 由 Story 5.1 完成，不能推迟到本 Story 才补 5.1 的可达闭环

**Given** Story 5.2 准备关闭
**When** 使用单城、linked multi-city、DayExcursion、无 FillRun、完整/partial/failed/stale FillRun、有效/失效/越权 citation、hard/soft conflict、另一设备新 revision、深链/离线恢复、长文本/大字号和 owner 越权 fixture，并运行 OpenAPI/生成类型、ResultSheet/citation repository/API/mobile/accessibility tests、真实 PostgreSQL、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户始终能阅读 current revision 的基础行程，并按需核查当前版本可用的执行细节与真实来源；沿用同一 read model，并证明未回归 Story 5.1 的独立入口、S9 最小来源与原上下文返回
**And** 本 Story 不实现 AI 细节生成、逐条 user override、重新完善时的用户原文保护、排期 mutation、图片导出、保存/分享、最近行程、check-in 或多人协作，也不提供恢复 AI 功能

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 5.3: 逐条行程细节修改与 AI 保留

As a 旅行者,
I want 逐条修改行程单里的做什么、准备和注意内容，并让后续 AI 完善保留我的表达,
So that 我的实际经验和个人安排始终优先，同时仍能获得不重复的补充建议.

**Requirements:** FR10, FR22, FR23, FR37 (line-edit and preservation slice),
FR39, FR49; NFR3, NFR4, NFR6, NFR8-NFR10, NFR12, NFR20, NFR21;
AR1-AR8, AR11-AR15, AR17-AR20; UX-DR1-UX-DR3, UX-DR29,
UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在 S10 查看 current revision 中一个拥有 SlotDetail 的适用槽位
**When** 点击具备可访问名称的编辑图标
**Then** 打开该槽位的移动端内容编辑页，按 `做什么 / 准备 / 注意` 分组并将每一行作为独立输入项
**And** 页面不提供日期、时间、地点、顺序、住宿、交通、AI 调整、来源编辑或恢复 AI 动作；这些排期修改仍返回 S7/S8

**Given** 槽位当前同时包含 AI 生成行和用户行
**When** 查看内容页或编辑页
**Then** 只在具体用户新增或改写的行尾显示紧凑 `我的修改` 标记，不标记整个栏目、槽位或其余 AI 行
**And** 标记不只依赖绿色，读屏按行说明来源；删除或显式留空不会留下虚假的可见占位行

**Given** 用户新增、改写或删除一行
**When** 客户端验证编辑草稿
**Then** `做什么` 保持一至三行，`准备` 与 `注意` 各允许零至三行，每行最多 30 个 Unicode 用户可见字符且只接受安全纯文本
**And** 用户原文超限、含禁止标记或使 `做什么` 为空时在提交前说明具体字段并保留草稿；服务端再次验证且不得静默裁剪、改写或扩写用户文字

**Given** 用户清空 `准备` 或 `注意` 的全部内容
**When** 保存编辑
**Then** 将该字段保存为显式留空语义，而不是“尚未生成”或缺失值
**And** 后续重新完善不得自动补回该字段，除非用户再次编辑取消显式留空；`做什么` 不允许显式留空

**Given** 用户提交一个合法内容草稿
**When** 服务端处理保存命令
**Then** 命令携带 owner、slot identity、精确 Plan/Trip revision、expected SlotDetail/content revision、幂等键和逐行 add/replace/delete 操作，并创建新的不可变内容 revision
**And** 保存不创建 PlanRevision、TripRevision、EditEvent、ValidationRun 或全计划 undo token；相同键/相同 payload 重放返回同一结果，不同 payload、越权、stale 或错误槽位返回稳定 typed error

**Given** 用户改写一条 AI 行
**When** 新内容 revision 原子发布
**Then** 新文字成为受保护的用户原文并保留被替换 generated line 的审计引用，但不再显示或继承该 AI 行的 citation
**And** 原 generated line、旧用户 revision 与 lineage 不被物理覆盖；ResultSheet 只组合 current content revision

**Given** 用户删除一条 AI 行或用户行
**When** 保存删除
**Then** 记录与精确字段、source line 和规范化内容关联的 suppression/tombstone，使该行从 current ResultSheet 消失
**And** 后续 FillRun 不得按原 source identity、规范化相同文字或版本化近似判断重新引入同一建议；产品中不提供把整槽重置为旧 AI 内容的捷径

**Given** current revision 已存在受保护用户行、删除 suppression 或显式留空字段
**When** 用户从 S10 再次进入 S9 完善
**Then** FillRun 只接收完成合并所需的最小受保护内容与版本引用，并将其视为不可改写约束
**And** Provider 不得决定是否覆盖；服务端在持久化前重新执行用户优先合并，任何 attempt 都不能修改、删除、重排或重新措辞用户行

**Given** 新 FillRun 返回与用户行相同或语义近似的 AI 建议
**When** 运行版本化 duplicate policy
**Then** 先按规范化精确匹配，再按可测试的近似分类规则过滤建议；命中或无法安全判定时保留用户表达并丢弃 AI 候选
**And** duplicate policy 记录版本、稳定结果类别和脱敏计数，不把模型推理、相似度分数或技术判断展示给用户

**Given** 某字段已有一至三条受保护用户行
**When** 新 FillRun 还产生不重复 AI 建议
**Then** 用户行按当前顺序优先占用最多三行容量，AI 只填充剩余位置；容量已满时不挤出用户行
**And** 完成页可使用紧凑状态说明保留了多少条用户修改，但不得制造第二份需“采用”的 AI 版本

**Given** 用户文字陈述了一个具体事实
**When** ResultSheet 组合用户行、AI 行与 citations
**Then** 用户行显示 `我的修改` 且不自动获得 AI、AMap、官方或导入来源引用
**And** 来源数量只统计仍支持当前 generated facts 的可访问 citation；审计 lineage 不得作为用户文字已验证的证据展示

**Given** 用户打开编辑页后，同一 owner 的另一设备保存了内容 revision 或计划排期发布了新 Plan/Trip revision
**When** 原页面尝试保存
**Then** expected revision 门禁拒绝 stale 写入，保留本地草稿并提供刷新 current 内容或返回行程单
**And** 不自动合并两份文字、不把旧 slot 内容附着到新排期、不消费幂等键或覆盖另一设备成功保存

**Given** 一个排期 mutation 产生新的 current PlanRevision 或 TripRevision
**When** S10 刷新到新计划
**Then** 旧 revision 的 SlotDetail、用户行和 suppression 继续保留审计价值，但不按地点名、相同时间或数组位置静默复制到新 slot
**And** 新 revision 立即显示基础行程和真实细节完整度；用户可重新完善或重新输入，不会看到旧修改冒充当前内容

**Given** target 属于 linked Trip 的主 Plan 或 DayExcursion child Plan
**When** 读取、保存或重新完善一个槽位
**Then** 使用 TripRevision、PlanRevision、host/child scope 和稳定 slot identity 共同定位，不通过重复城市名、日期序号或 POI 名称猜测
**And** 一个槽位的用户内容不得进入另一城市、host/child Plan、同名 POI 或其他 owner 的 ResultSheet/Provider context

**Given** 保存事务、重新完善、duplicate policy、网络或客户端刷新失败
**When** 用户收到失败状态
**Then** 保留最近成功的 current 内容与未提交草稿，说明保存未完成或完善未应用，并提供安全重试/刷新/取消路径
**And** 不显示 `已保留我的修改`、不发布部分 line operations、不丢弃 suppression，也不回退为旧 AI 内容

**Given** 内容编辑、合并、suppression、citation 或重新完善行为进入日志、Sentry、Langfuse、指标或分析
**When** 记录调用与结果
**Then** 只记录脱敏 slot/content correlation、字段、操作类别、行数、duplicate 结果类别、版本、耗时与稳定错误码
**And** 不记录用户原文、生成行全文、citation 摘要/URL、POI/城市/酒店、Provider payload/secret、token、相似判断输入或其他 owner 内容

**Given** 用户通过触控、键盘、读屏或 reduced-motion 编辑槽位内容
**When** 添加一行、删除、切换字段、保存、遇到错误或返回
**Then** 每个目标至少 44pt，焦点顺序和错误关联明确，键盘不遮挡操作，状态不只依赖颜色，删除有可理解名称且返回恢复原槽位焦点
**And** 最长三行、系统大字号、`我的修改`、计数和动态错误不得溢出、遮挡、形成卡片套卡片或触发重复 live-region 播报

**Given** Story 5.3 进入 UI 实现
**When** 选择视觉权威
**Then** 使用 `story-5-3-line-edit-ai-preserve-r2.png` 约束逐行标记、编辑布局和重新完善后的用户优先合并
**And** `story-5-3-slot-override-edit-restore-r1.png` 与 `story-5-3-override-regenerate-recovery-r1.png` 不再指导实现；文本合同覆盖图片未展示的删除 suppression、显式留空、stale 和失败状态

**Given** Story 5.3 准备关闭
**When** 使用新增/改写/删除 AI 行、修改用户行、满三行、可选栏显式留空、相同/近似/不同 AI 建议、无引用用户事实、linked host/child、stale content/plan revision、幂等/owner 越权、事务/Provider/网络失败和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、content revision/merge/duplicate policy/repository/API/mobile/accessibility tests、真实 PostgreSQL、脱敏 Provider staging、厦门行程 fixture、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以逐条维护行程执行内容，且之后的 AI 完善只补充不重复建议，永远不覆盖、复述或伪造用户原文的来源
**And** 本 Story 不实现排期 mutation、计划级 undo、恢复 AI、任意历史内容浏览、多人协作合并、图片导出、保存/分享、最近行程或 check-in

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 5.4: 版本绑定的导出生成与预览

As a 旅行者,
I want 为当前行程生成可预览、可下载的行程图片,
So that 即使行程细节尚未全部完善，我也能获得与当前计划一致且可核查的旅行文件.

**Requirements:** FR11, FR22, FR24, FR25 (export operation-surface slice),
FR37 (ResultSheet export gate), FR38 (export first-use controls), FR39, FR49;
NFR1-NFR4, NFR6, NFR8-NFR12, NFR20-NFR23; AR1-AR6, AR8-AR15,
AR17-AR20; UX-DR1-UX-DR3, UX-DR29-UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在 S10 查看一份 current、已发布且可浏览的单城 PlanRevision 或完整 TripRevision
**When** 点击具备可访问名称的导出图标
**Then** 进入 S11 导出设置并绑定精确 owner、target kind/id 与该 current revision，不通过城市名、日期数组或最近打开计划推断目标
**And** Story 5.1 的 FillRun/SlotDetail 不存在、部分完成或失败都不阻止进入；基础行程导出不得依赖未来细节完善或 Story 5.5

**Given** 导出设置首次打开
**When** 渲染可选内容
**Then** `基础行程（必含）` 始终选中且不可关闭，`行程细节` 是独立开关并只说明将包含当前已有内容
**And** 不把缺失细节生成成空字段、通用占位或假引用，不要求用户先返回 S9，也不把导出设置变成新的行程编辑页

**Given** 用户配置图片规格
**When** 选择图片宽度
**Then** 只接受 `1080 | 1242`，并以稳定摘要显示预计格式、由 current revision 推导出的有序城市图片数量与非承诺的逐图大小估算；界面不提供按日切片或手工合并城市的选项
**And** 服务端再次验证枚举、revision 与推导结果；未知宽度、客户端自造 scope/格式、篡改图片数量或过期设置返回 typed validation error，保留合法草稿

**Given** S11 准备生成预览
**When** 执行导出前检查
**Then** 复用 target revision 的 current ValidationRun，并同时核对 current pointer、主链 TransferLeg、DayExcursion 去返、Stay/Luggage 引用和 TripRevision 原子完整性
**And** 不创建第二套 Validator、不用导出渲染器修复行程、不因到达 S10 推断无冲突，也不把技术核查状态写入普通行程卡

**Given** current ValidationRun 有 unresolved hard conflict、无效主链 transfer、缺失一日游返程或不完整原子引用
**When** 用户查看导出设置或请求预览
**Then** 禁用 `生成预览`，显示真实问题数量与 `查看冲突`，并返回 Story 3/4 已有 FixSheet 或手工编辑上下文
**And** 不创建 ExportJob、不消耗成功导出次数、不生成看似可执行的部分文件，也不让关闭提示绕过门禁

**Given** current revision 只有 soft warning
**When** 用户准备预览
**Then** 用低强调行内入口 `有N项建议核对 · 查看` 和必要短摘要显示本revision的实际soft事项，具体原因在原提醒/核查详情按需展开；用户仍按原主按钮明确继续生成，不增加“我已读完”、逐条确认或新的核对页面
**And** warning 必须绑定同一 revision 并进入预览/生成审计；不得升级为 hard block，也不得在最终文件中声称风险已解决；最终图片离开App后仍保留必要出行提醒和适用来源归因，不能只剩无法展开的站内 `查看` 入口

**Given** target 是独立单城 PlanRevision
**When** 构建导出快照
**Then** 精确包含该 revision 的日期、槽位、已知通勤、free/meal/transport 类型、Stay 和 Luggage 边界
**And** 不混入候选、未落位灵感、旧 PlanRevision、另一 owner 计划或不存在的酒店/路线事实

**Given** target 是 linked TripRevision 或包含 DayExcursion
**When** 构建导出快照
**Then** 按 TripRevision 绑定顺序包含每个主 PlanRevision、相邻 TransferLeg、Stay/Luggage、host/child 区间、去返交通与返回宿主提示
**And** 不按同名城市合并 segment、不复制宿主日期 tab、不遗漏返程、不把 child Plan 当主 segment，也不输出未原子发布的单边交通或孤立计划

**Given** 已从精确 revision 构建合法导出快照
**When** 推导 `ExportUnitManifest`
**Then** 独立单城 Plan 产生一个 `standalone_plan` 单元；linked Trip 的每个主 TripSegment 产生一个 `main_segment` 单元，每个 DayExcursion 子 Plan 产生一个独立 `day_excursion` 单元，并按 Trip chronology 固定 ordinal
**And** 每个单元包含 scope identity、city、日期范围与必要交接引用；一日游命名为 `{城市}一日游`，宿主城市单元保留紧凑的去返摘要，目的地子计划保留完整往返上下文；不得仅凭城市名合并主段、一日游或其他 scope

**Given** 用户确认精确 revision 与合法设置
**When** 请求生成预览或最终图片
**Then** 服务端迁移现有 ExportJob 基线为 owner-scoped、revision-bound、durable 且 fenced 的任务，记录 target revision、include-details、width、export-unit policy、theme、output-policy/config version、幂等键和 current attempt
**And** 同一 owner、revision、设置与幂等键返回同一任务；相同键不同 payload、越权目标、已删除目标或错误 aggregate 返回稳定 typed error，不创建平行导出真相

**Given** `行程细节` 关闭
**When** 渲染预览和最终图片
**Then** 只渲染权威基础行程、必要交通/住宿/行李边界和 soft-warning 诚实提示，保持可读的次要层级并收敛重复说明；必要事项本身随图片保留，不能仅用站内链接或一个无法离线展开的总数代替
**And** 不调用 Filler、不制造 why/citation、不把待完善计数写进旅行文件，也不隐藏基础 POI 来伪造精简成功

**Given** `行程细节` 开启
**When** current revision 存在 generated lines、用户修改、suppression 或显式留空
**Then** 使用 Story 5.2/5.3 对 current content revision 的同一组合结果，保留 `我的修改` 语义、删除和显式留空，并只展示仍可访问的最小来源归因；必要提醒/来源说明在最终图片中仍可读，安全通用内容使用克制的 `建议核对`，不因App内折叠而在导出文件里遗漏依据或风险
**And** 不把旧 revision SlotDetail 按名称复用、不恢复已删除 AI 行、不让用户文字继承 citation，也不输出受保护原始 URL、内部质量/新鲜度枚举或 evidence ID

**Given** 渲染器生成最终文件
**When** 选择公开输出格式
**Then** 默认产出正确 MIME 与扩展名的 WebP；仅在明确客户端、编码尺寸或渲染兼容策略命中时降级为 JPEG 75-80%，并记录稳定 fallback reason
**And** 产品统一称 `导出图片`，不承诺 PNG；Puppeteer/浏览器内部临时 PNG capture 不得成为公共 artifact、响应格式或分析维度

**Given** 一个 ExportUnit 包含一个或多个日期
**When** 渲染该城市长图
**Then** 将该单元全部日期按权威顺序合并为一张选定宽度的纵向 artifact，保留日期、交通、酒店、行李与必要文字，并尽量将每张控制在 600 KB
**And** 内部可以按安全像素/内存预算分块渲染后无缝拼接，但不得把内部块暴露为按日图片、裁掉内容或静默改变单元边界；WebP 超限先按已确认策略降级 JPEG，仍无法编码时返回可解释 typed failure

**Given** ExportUnitManifest 包含多个城市单元
**When** 同一个 ExportJob 生成最终图片
**Then** 依次生成完整有序 artifact manifest，每个城市单元恰好对应一张图片，并在全部单元成功后一次发布 manifest
**And** 文件顺序不能依赖异步 worker 完成顺序；任一单元失败不得把半套城市图片标记为完成，也不得把另一个单元拆成按日文件补偿失败

**Given** 渲染城市长图背景
**When** 选择该任务绑定的版本化 theme
**Then** 正文使用稳定的浅色抽象路线底纹，页头/日期分隔/页尾按可用性叠加自有或已授权城市素材，并在每张图片加入同一 ExportJob 的小号生成时间
**And** 缺少城市素材时使用通用模板；不得在单次导出中临时调用 AI 生成背景、拉伸一张位图贯穿整图，或使用无导出授权的 XHS/高德图片、地图瓦片和品牌标识

**Given** 预览已经生成
**When** 用户核对屏幕内容
**Then** 预览使用与最终导出相同的不可变快照、排版规则和 include-details 选择，仅允许明确的缩放/压缩差异
**And** `生成图片` 创建的 artifact 不得增加、删除或重新编排行程内容；预览不是新的 PlanRevision、FillRun 或可编辑草稿

**Given** 预览绑定 revision Rn
**When** 同一 owner 在 S7/S8、另一设备或后台流程发布 current revision Rn+1
**Then** 旧预览显示 `行程已更新`，禁用继续生成并提供 `刷新预览 / 返回行程单`
**And** 刷新使用 Rn+1 重新运行门禁并创建/复用对应幂等任务；不得把 Rn artifact 附着到 Rn+1，也不把该状态解释为多人协作冲突

**Given** ExportJob 已接受并异步处理
**When** 客户端订阅、离开页面、断线重连或服务进程重启
**Then** 持久事件使用单调 sequence/cursor 表达 accepted/preflight/rendering/encoding/storing/done/failed/stale 与已处理 ExportUnit，客户端从最后确认位置恢复
**And** UI 只显示真实阶段、`已完成 厦门 / 正在生成 泉州 / 等待 福州` 等 scope-aware 事实，不显示伪百分比、Provider 名称或无法由服务端证明的剩余时间

**Given** 同一任务的重试、重复 worker 或多个 attempt 并发完成
**When** 发布 artifact manifest 和 terminal state
**Then** 只有 current fenced attempt 能在事务中发布完整 manifest、MIME、大小、checksum、expiry 和 done 状态，其余 attempt 标记 superseded
**And** 数据库/COS 中断不得留下 done job 配缺失文件、跨 revision manifest、半套城市单元或可被另一 owner 枚举的对象路径

**Given** 网络、渲染、编码、COS、超时或任务恢复失败
**When** ExportJob 进入可重试或终态失败
**Then** 保留 current ResultSheet 与合法导出设置，说明没有生成最终文件，并提供安全重试/返回行程单；重试继续同一 revision 和设置且不重复计算成功次数
**And** 不把临时文件当最终 artifact、不清空已验证行程、不伪造 done，也不因导出失败修改 Plan/Trip/SlotDetail

**Given** 用户额度、并发、成本预算或远程熔断限制本次生成
**When** 请求被排队、延后或拒绝
**Then** 按 FR25/FR38 保留真实生成状态及 `稍后继续 / 重试 / 返回行程单` 等可用动作，不展示可用导出次数或其他额度信息；已有行程始终可浏览
**And** 不要求 BYOK、不暴露内部 Provider/成本阈值；额度降级使用文本合同，不要求新增专用原型，普通可恢复状态也不提前触发 Epic 8 管理员告警

**Given** ExportJob 成功
**When** owner 请求 artifact 列表或具体文件
**Then** 返回有时效、owner-authorized 的下载/站内打开能力，并验证 session、target revision、job ownership、artifact id 和 expiry；Story 5.4 至此形成可用闭环
**And** 不要求相册权限或系统分享能力；Web/PWA 整趟长图与超长编号 part 下载、能力检测后的有序城市图片系统 Share Sheet 及降级恢复归 Story 5.5，不能成为本 Story 城市文件下载的前向依赖，也不承诺直接写入相册或 ZIP

**Given** 导出快照、事件、artifact、日志、Sentry、指标或分析被记录
**When** 写入可观测数据
**Then** 只记录脱敏 target kind、匿名 revision/job correlation、设置枚举、阶段、ExportUnit 数量/类型、格式、大小 bucket、耗时、fallback reason 与稳定错误码
**And** 不记录完整城市链、POI/酒店/路线原文、用户修改、citation 摘要/URL、对象路径、精确行程图片、Provider payload/secret、token 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏或 reduced-motion 使用 S11
**When** 切换设置、查看 warning、预览、等待、重连、重试、下载或返回
**Then** 目标至少 44pt，互斥控件和开关具备正确角色/状态，禁用原因可读，焦点进入/返回可预测，动态任务状态使用克制 live-region
**And** 大字号、长城市链、多城市图片清单、横竖屏和底部安全区不得造成文字溢出、卡片套卡片、布局跳动、重复播报或把下载按钮遮挡在系统 UI 下

**Given** Story 5.4 进入 UI 实现
**When** 选择视觉权威
**Then** 使用 `story-5-4-city-level-export-r2.png` 约束城市清单、按城市进度和多图查看，使用 `story-5-4-city-background-directions-r1.png` 的 A+B 混合方向约束背景，使用 `story-5-4-export-gates-r1.png` 约束 hard/soft gate 与 stale 恢复，并仅复用 `story-5-4-export-job-states-r1.png` 的重连/失败模式
**And** `story-5-4-export-generate-preview-r1.png` 及旧图中的按日进度/切片控件被本合同取代；文本合同覆盖图片未展示的 DayExcursion scope、完整 manifest、鉴权下载、额度和安全边界，图片不得被解释为已有原生相册保存或系统分享

**Given** Story 5.4 准备关闭
**When** 使用无/部分/完整细节、用户修改与删除、单城多日、长 linked Trip、同城主段与异地 DayExcursion、1080/1242、逐城市单图、内部块拼接、通用/城市主题、WebP/JPEG fallback、hard/soft conflict、无效主链/缺失返程、stale preview、幂等/并发/attempt fencing、断线/重启、渲染/COS/额度失败、artifact expiry、owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、ExportJob/ExportUnit/repository/renderer/gate/API/SSE/mobile/accessibility tests、真实 PostgreSQL、私有 COS staging、厦门导出 fixture、移动与桌面浏览器截图、完整构建、handoff 与 diff 检查
**Then** 用户可以从任何可浏览 current revision 生成与预览一致、版本安全、可恢复且可鉴权下载的行程图片
**And** 本 Story 不实现 Web/PWA 整趟长图/超长编号 part 下载、系统分享、最近行程、check-in、账号数据导出、PDF/公开链接、任意历史 artifact 浏览或导出中的排期/细节 mutation

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C09 — App：原生受保护文件获取

**Given** 当前 owner 的 ExportJob 已发布可读取的确定版本 artifact
**When** App 下载文件以供预览或后续保存分享
**Then** 下载遵守当前身份/资格、文件完整性、大小上限与类型检查，在 owner 隔离的临时区保存同一 artifact
**And** 切账号、撤权、网络失败或文件不完整时不得交给系统，也不以 native HTTP 绕过资源授权；临时文件和句柄有明确清理责任

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 5.5: 整趟长图下载与系统分享

As a 旅行者,
I want 一次操作下载完整旅行长图，并按设备能力分享城市行程图片,
So that 我能方便保存和发送当前版本的行程，而不需要处理 ZIP、失序文件或版本混淆.

**Requirements:** FR11, FR24, FR25, FR37, FR38, FR49;
NFR1-NFR4, NFR6, NFR8, NFR11, NFR20, NFR22;
AR1-AR6, AR8-AR15, AR17-AR20; UX-DR1-UX-DR3, UX-DR30-UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**CE amendment approved (2026-09-14):** CE-03按浏览器能力区分保存结果；普通下载精确文案为 `已开始下载，请确认`，内部保持保存未知，未知重试说明可能重复。原WebP/JPEG、无ZIP和城市边界分段合同保持。

**Acceptance Criteria:**

**Given** owner 正在查看 Story 5.4 已成功发布且仍可鉴权读取的 ExportJob
**When** 最终城市 artifact manifest 在当前 S11 页面变为 ready
**Then** 页面在原位置把生成预览交叉淡入为静态城市长图，并保留当前城市、滚动锚点、target revision、theme 与 include-details 选择
**And** 不新建 PlanRevision、TripRevision、FillRun 或第二个基础 ExportJob，不重新消耗一次导出额度；reduced-motion 直接替换且不执行扫描动画

**Given** manifest 含一个或多个 `standalone_plan | main_segment | day_excursion` 城市 artifact
**When** 用户在图片完成页查看结果
**Then** 使用可横向滚动且不会被底部操作遮挡的城市 Tabs，一次只展示一张完整城市长图；DayExcursion 使用 `{城市}一日游` 标签并保持独立 scope
**And** 每张图及页面摘要显示同一 ExportJob 的小号生成时间，长城市名、重复城市显示名、大字号和安全区不会导致 Tab、角标或按钮溢出

**Given** 用户对 ready 的单城或 linked Trip 点击 `下载整趟长图`
**When** 服务端构造 whole-trip delivery input
**Then** 只使用该 ExportJob 的 owner、target revision、source manifest checksum、theme、width、format policy 与不可变渲染快照，推导按主 TripSegment 排列的 `TripLongSection`
**And** 每个 section 包含完整主城市段、相邻 transfer 边界及其真实宿主日期内的全部 DayExcursion；不得从城市图片像素、当前 UI 状态、城市名或最新计划猜测整趟顺序

**Given** linked Trip 含主链交通、住宿、行李和 DayExcursion
**When** 渲染整趟 chronology
**Then** 按权威时间顺序展示主城市内容、跨城交通分隔、下一城市内容，并把一日游的去程、child Plan、返程嵌入宿主日期
**And** 不把一日游追加到整趟末尾、不重复宿主城市、不遗漏返程、不把 child Plan 提升为主 segment，也不因同名城市合并两个 scope

**Given** Story 5.5 准备在支持的 Web/PWA 环境启用整趟下载
**When** 确定 `TripLongLayoutPolicy`
**Then** 必须在目标桌面与移动浏览器、Android/iOS WebView 及系统保存/解码路径、设备内存档位以及 WebP/JPEG 编码器上实测 max raster height、decoded pixels、峰值内存和 encoded bytes，并把通过矩阵、宽度/格式及安全余量固化为有版本的 active policy
**And** 未完成矩阵验证的默认值不得进入生产；策略可远程停用或回滚，但不得按城市数量猜测上限、在同一下载批次中切换版本或把内部浏览器崩溃当普通成功

**Given** 一个整趟 `TripLongSection` 序列在 active policy 的全部安全上限内
**When** 生成 whole-trip delivery
**Then** 产生一个 `trip_long_part`、标记 `1/1`，可发起该单一WebP文件的浏览器下载；只有命中版本化兼容/尺寸规则时降级为JPEG并记录原因，交付状态按实际可观察能力报告
**And** 文件标题包含行程城市链与日期范围，正文沿用 Story 5.4 的版本化背景和生成时间，不临时调用 AI、更换内容或重新规划

**Given** 向当前 part 加入下一个完整 `TripLongSection` 会越过 active policy 任一上限
**When** 执行确定性分段
**Then** 在前一个完整主城市段结束处关闭当前 part，让下一个主城市及其宿主日期内一日游从新 part 开始，并继续贪心填充后续完整 section
**And** 不得在一个主城市段、日期、POI、交通、住宿或 DayExcursion 中间拆分，不产生空 part，也不因 worker 完成顺序、重试或客户端差异改变边界

**Given** whole-trip delivery 被分成多个 part
**When** 发布有序 delivery manifest
**Then** 每个 artifact 记录 `partOrdinal / partCount / startSectionOrdinal / endSectionOrdinal / layoutPolicyVersion`，图片角标和文件名使用稳定 `1/3、2/3、3/3` 与可自然排序的 `01-of-03` 形式
**And** 页面在用户操作前主显示 `将下载N张长图`，N来自实际delivery manifest；每part覆盖的完整城市范围及 `仅在城市边界拆分` 在同页按需展开且下载前可查，不新增下载前二次核对；不得隐藏真实张数、把分段伪装成一张或改成ZIP

**Given** delivery manifest 只有一个 part
**When** 用户确认下载
**Then** CTA显示 `下载整趟长图` 并只发起该文件的一次交付，保持城市Tab、图像滚动位置和分享能力；可验证写入/关闭成功时才显示已保存，普通下载已交出请求且无可观察拒绝时显示 `已开始下载，请确认`
**And** 单文件不弹多文件许可、不创建空批次或重复发起同一请求，不使用ZIP；普通下载的保存结果内部保持未知，该提示仅请用户自行核对，不新增逐文件确认步骤或将未确认记成保存失败

**Given** delivery manifest 有多个 part
**When** 用户点击 `下载 N 张长图`
**Then** 视为一个逻辑下载命令：支持目录写入的浏览器在一次用户授权后按ordinal写入并逐项核验写入/关闭结果；不支持时使用浏览器受控的有序多文件下载和必要许可，已实际交出的下载请求显示 `已开始下载，请确认`，保存结果内部保持未知
**And** 不创建ZIP、不要求逐张点击、不用不可见iframe绕过安全策略；明确拒绝/尚未发出的文件照实记录，不因显示已开始下载就把整批或单文件标成已保存

**Given** 客户端观察到取消/拒绝/写入失败、批次中断，或普通下载已交出请求但无法确认保存结果
**When** 客户端汇总批次结果
**Then** 区分可观察的cancelled/blocked/failed、可确认的partial与保存结果未知，按证据记录各part的已保存、明确失败、未发起或未知状态，保留服务端artifact及真实可用重试/返回路径
**And** 有确定结果时只补明确未完成part；未知part重试须由用户明确触发并提示可能重复保存，复用同一delivery manifest与文件名、不重新渲染或重复计费，不承诺自动辨认未保存文件，也不把未知或部分成功报告成整批已保存

**Given** 同一 owner、source manifest checksum、revision、theme、width、format 与 layout policy 重复请求整趟下载
**When** 服务端创建或恢复 composition attempt
**Then** 返回同一幂等 delivery manifest；只有 current fenced attempt 能原子发布全部 part metadata、checksum、MIME、大小、expiry 与 terminal state
**And** 不重复调用 AI/Planner/Filler、不创建排期或内容 revision，不让 superseded attempt、半套对象或不同 policy 的 part 混入同一批次

**Given** 一个不可再分的 `TripLongSection` 自身在 WebP 与 JPEG fallback 后仍超过 active policy
**When** 编码器无法安全发布该 part
**Then** 返回包含失败城市 section 与稳定原因的 typed failure，保留 Story 5.4 城市图查看、逐城鉴权下载和系统分享，并允许 policy/renderer 修复后的安全重试
**And** 不从城市内部截断、不静默降低到不可读质量、不省略行程内容、不改用 ZIP，也不伪造完整 whole-trip delivery

**Given** 当前浏览器支持 Web Share API 文件分享且 `navigator.canShare({ files })` 对有序城市文件返回 true
**When** 用户点击 `分享（N张）`
**Then** 通过用户手势打开系统 Share Sheet，按 manifest ordinal 传入经过鉴权获取的城市图片文件及最小行程标题
**And** 不把签名对象 URL、受保护引用、用户 token 或跨 owner 文件交给系统；用户取消 Share Sheet 是正常结果，不显示错误或自动重试

**Given** 浏览器不存在 Web Share、不能分享多个文件或目标城市文件暂时不可读
**When** 用户尝试分享
**Then** 提供真实可用的降级：分享当前城市单图，或使用当前 ready 的整趟下载批次；说明设备能力限制并保留当前浏览位置
**And** 不伪造原生分享、不请求相册权限、不自动复制受保护 URL，也不让分享能力成为查看或下载的前置条件

**Given** 生成 artifact 绑定 Rn，但 current Plan/Trip revision 已更新为 Rn+1
**When** 用户再次进入或停留在完成页
**Then** Rn 的城市图与 whole-trip part 继续以明确旧生成时间可查看、下载和分享，与生成时间并列用非阻断行内文字显示 `行程已有更新，可重新生成`，不使用感叹号警告或追加确认弹窗
**And** `重新生成` 返回 Story 5.4 并绑定 Rn+1 重新执行现有 gate；不覆盖 Rn artifact、不显示“较早版本图片”恐吓文案，也不把单 owner 更新解释为多人协作

**Given** owner 请求城市 artifact、whole-trip delivery manifest、part 文件或系统分享输入
**When** API、对象存储代理或客户端缓存处理访问
**Then** 验证 session、owner、target/revision、ExportJob、artifact/part id、manifest checksum 与 expiry，并以正确 MIME/扩展名返回私有文件
**And** 另一 owner、过期引用、删除目标、篡改 ordinal/count/checksum 或不可访问 source artifact 返回稳定错误，不能枚举对象路径、城市链、酒店、POI 或引用内容

**Given** composition、下载、分享、重试或 stale 状态进入日志、Sentry、指标或分析
**When** 记录可观测数据
**Then** 只记录脱敏 job/delivery correlation、policy version、part count、宽高/字节 bucket、格式/fallback、能力路径、结果类别、耗时和稳定错误码
**And** 不记录完整城市链、POI/酒店/路线、图片内容、对象路径、citation/URL、用户修改、系统分享目标、凭据或其他 owner 数据

**Given** 用户通过触控、键盘、读屏、系统大字号或 reduced-motion 使用图片完成页
**When** 切换城市、滚动长图、下载一个或多个 part、分享、重试或重新生成
**Then** 控件至少 44pt，角色/名称/禁用原因可读，焦点进入返回稳定，动态批次状态克制播报，长图具有可预测滚动容器且按钮不遮挡内容
**And** part 角标、长城市名、生成时间、错误和底部安全区不得溢出、重叠、只依赖颜色、形成卡片套卡片或让浏览器权限提示与产品状态互相冒充

**Given** Story 5.5 进入 UI 实现
**When** 选择视觉权威
**Then** 使用 `story-5-5-city-long-image-transition-regenerate-r5.png` 约束同页转场、逐城查看与 stale 重新生成，使用 `story-5-5-trip-long-download-share-r5.png` 约束正常整趟单图、超长城市边界分段和系统分享
**And** `story-5-5-native-save-share-r1.png`、`story-5-5-city-save-share-states-r2.png`、`story-5-5-web-download-share-states-r3.png` 与 Trip-long Download + Share R4 均为 superseded；图片中的装饰不能覆盖本文的 policy、DayExcursion、鉴权、批次与失败合同

**Given** Story 5.5 准备关闭
**When** 使用单城、多主城市、同名城市、主链 transfer、宿主日期 DayExcursion、正常 `1/1`、恰好上限、加入下一城市越界、三个以上 part、单 section 超限、WebP/JPEG、目录写入支持/拒绝、多文件许可支持/阻止/部分完成、Web Share 多图/单图/不支持、用户取消、stale revision、幂等/并发/fencing、过期/owner 越权、断线/重启和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、layout-policy/section/partition/repository/API/download/share/mobile/accessibility tests、目标浏览器与设备编码上限实测、真实 PostgreSQL、私有 COS staging、厦门-泉州-福州及一日游导出 fixture、移动与桌面截图、完整构建、handoff 与 diff 检查
**Then** 用户能在正常情况下下载一张完整整趟长图，在实测超限时通过一次操作获得只按城市边界拆分且正确编号的有序图片，并在设备允许时安全分享城市图片
**And** 本 Story 不实现原生相册直写、原生容器、ZIP、城市内部/按日切图、PDF、公开分享链接、任意历史 artifact 浏览、最近行程、check-in、多人协作或任何排期/细节 mutation

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C10 — App：相册保存与部分结果

**Given** 用户在 App 明确选择保存当前整趟图片或有序多个 part
**When** 按实际平台使用必要权限并写入相册
**Then** 只在真实系统写入成功后逐项确认，全部成功才显示整批已保存；取消、拒绝、部分失败与结果未知分别呈现并保留原 artifact
**And** 未知结果重试由用户明确触发并说明可能重复，已确认结果不自动重存；不请求无关读相册权限、不扫描图库，也不把沙箱文件创建当成相册写入

#### C11 — App：原生系统分享

**Given** App 已鉴权取得按 manifest ordinal 排序的城市图片文件
**When** 用户主动打开系统分享并选择、取消或遇到不支持的目标能力
**Then** 仅向系统交出必要本地文件和最小标题，按实际可观察结果结束或提供单图/保存降级，保留原浏览上下文
**And** 不传 token、cookie、签名 URL 或其他 owner 文件；取消不是错误，Share Sheet 关闭或返回 activity 不表示接收者已收到

#### C12 — App：原生大图与格式能力

**Given** TripLongLayoutPolicy 将用于目标 Android/iOS 设备及其实际解码、保存、分享路径
**When** 核验 WebP/JPEG、像素/高度/字节/内存上限及不可再分城市边界
**Then** 仅使用通过设备矩阵的版本化策略，格式不支持时按已验证规则降级 JPEG，超限沿原城市边界分段或真实 typed failure
**And** 浏览器结果不能替代 App 保存链证据；不得截断城市、丢失一日游、改 ZIP 或为内存失败谎报保存成功

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 6: 在旅途中灵活处理吃饭与购物

用户可以管理固定或灵活餐饮、在授权后按位置与可靠商圈更新候选，并使用不污染
时间轴的购物与返程清单。

### Story 6.1: 计划餐饮槽与一主两备选择池

As a 旅行者,
I want 在时间轴中区分已锁定餐厅、可替换餐饮选择池和暂不决定的餐次,
So that 我能保留重要餐饮安排，并在不破坏路线的情况下灵活换店.

**Requirements:** FR14, FR21, FR22, FR36 (meal slice), FR36.2 (MealSlot core),
FR49; NFR1, NFR3, NFR5, NFR8, NFR10-NFR11, NFR17, NFR21-NFR23;
AR1-AR6, AR8-AR15, AR17-AR20; UX-DR2-UX-DR3, UX-DR18, UX-DR22-UX-DR23,
UX-DR26, UX-DR32-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 当前 Prisma、OpenAPI 和业务代码尚无权威 MealSlot 实现
**When** Story 6.1 建立本 Epic 第一个餐饮纵向切片
**Then** 只新增本 Story 所需的 revision-bound `MealSlot` 与 `MealOption` 合同、迁移、生成类型、repository、API、Planner/Validator 接线和移动端读写体验
**And** MealSlot 以稳定 identity 绑定 exact PlanRevision、day、meal kind/时间上下文与 `fixed_anchor | choice_pool | undecided` mode，主选由 MealSlot 持有且最多保存两个有序、不重复的备选，不预建 BusinessArea、TripChecklistItem 或持续定位实体

**Given** Planner 正在为单城 Plan、linked Trip 主 segment 或 DayExcursion child Plan 产生完整初始计划
**When** 决定是否创建餐饮安排
**Then** 只有可靠固定/预约证据、可成立的 choice pool 或用户明确要求加入的餐饮才创建 MealSlot
**And** 不机械生成早餐、午餐、晚餐、加餐四个槽；酒店早餐、普通小吃、咖啡、夜宵和现场随性用餐默认不占时间轴，也不以空占位伪装成已安排餐次

**Given** 导入证据或用户确认表明某餐厅、用餐日期或时间不可随意移动
**When** Planner 建立该餐饮安排
**Then** 创建 `fixed_anchor`，绑定经过 CanonicalPOI/城市护栏校验的餐厅、实际时间约束和可审计 evidence state，并由普通 hard-time/营业/路线规则共同校验
**And** AI/Planner 后续不得自动替换或降级该锚点；`需预约` 只在存在可靠证据时作为紧凑 badge 展示，不声称 Nomad 已订位、保证有位或代用户取消预约

**Given** 一顿普通餐可以由多个同城已验证餐厅满足
**When** Planner 创建 `choice_pool`
**Then** 选择一个当前主选并保存最多两个备选，三者均须属于当前 owner 可用来源、当前 Plan 城市与相同餐次上下文，且通过 CanonicalPOI、分店身份、营业基础事实和静态路线可用性检查
**And** 主选之外的 MealOption 不创建额外时间轴 slot、RouteFact 或负荷占用；同一 CanonicalPOI/分店不能同时占据多个 ordinal，也不因名称相似合并不同分店

**Given** 可验证且满足约束的餐饮候选不足三个
**When** 构建或读取 choice pool
**Then** 保留真实的一主零至两备，并在第一个空缺位置显示 `+ 添加更多`
**And** 不以城市热门占位、重复餐厅、跨城分店、待定位条目、未知营业事实或 AI 编造内容补足数量，也不因为候选不足阻止完整计划发布

**Given** 用户在 S7/S8 时间轴查看 MealSlot
**When** 渲染 fixed anchor、choice pool 或 undecided 状态
**Then** 使用与普通 POI 一致的行结构、图片/图标层级、时间位置和 overflow menu；choice pool 可显示主选与 `另有 N 个备选`，可靠预约证据使用小 badge，允许更换时在 overflow 旁提供紧凑更换图标
**And** 不创建餐饮专属大卡片、特殊底色或第二条时间轴，不让标签、长店名、价格/营业摘要和 hotel footer 互相遮挡

**Given** 用户点击一个 choice-pool MealSlot 的更换图标
**When** 打开一主两备 Sheet
**Then** 按稳定顺序显示当前主选、最多两个备选及真实可用的名称、步行/通勤摘要、营业状态、人均和预约证据，并明确当前选中项
**And** 不展示内部 confidence、quality/freshness 枚举、模型推理、虚构排队时间或与选择无关的来源原文；关闭后恢复原时间轴日期和滚动位置

**Given** 用户从空缺位置选择 `+ 添加更多`
**When** 寻找额外餐饮候选
**Then** 复用 Story 2.15 已交付的 owner-scoped 文本 AMap Top-5/manual candidate 能力并限制为餐饮类别，只有 canonical、同城、分店已消歧且通过当前餐次基础检查的 POI 才可在用户明确确认后加入本池
**And** 本路径不请求前台定位、不调用 Story 6.2 的动态召回、不静默落位其他 PlanCandidate，也不允许 landmark-proxy/unresolved 目标作为可切换主选

**Given** 用户选择不同的现有备选或新加入候选
**When** 系统准备更换主选
**Then** 先基于 exact current revision 预览前一安排到候选、候选到后一安排的 RouteFact、候选营业/预约事实、MealSlot 时间边界和当日负荷变化，并显示保持不变的后续安排
**And** RouteFact 未知时明确标记未知；硬冲突阻止确认并链接现有冲突/修复入口，只有软风险时允许用户明确继续，不静默移动、缩短或删除其他 slot

**Given** 用户主动更换带固定/预约证据的 MealSlot
**When** 打开替换并选择另一餐厅
**Then** 在确认前说明原外部预约不会由 Nomad 自动取消，并按新候选自身证据和用户确认重新决定 successor MealSlot 是 fixed anchor 还是 choice pool
**And** 不让 AI 自主触发该替换、不把原餐厅的预约证据复制给新餐厅，也不把选择候选解释为已经完成预约

**Given** 用户在选择 Sheet 点击 `暂不决定`
**When** 确认保留该餐次但暂不指定餐厅
**Then** successor MealSlot 使用 `undecided`，保留餐次意图和计划中的真实时间上下文，但不展示虚构 POI、精确地点、固定 90 分钟承诺或假 RouteFact
**And** 本 Story 仅允许从当前静态计划上下文重新打开、手动补充或选择已有候选；按当前位置刷新、定位授权/陈旧/拒绝和计划上下文自动降级归 Story 6.2

**Given** 用户在预览中确认一次主选、固定锚点或 undecided 变更
**When** 客户端提交 typed command
**Then** 命令携带 owner/session、target Plan、expected PlanRevision、MealSlot identity、目标状态和 idempotency key，并在一个事务中创建不可变 successor PlanRevision、对应 MealSlot/option 快照、EditEvent 与 mutation-triggered ValidationRun
**And** 不原地覆盖旧 MealSlot/MealOption、不复用旧 revision 的可变 route/validation 结果；相同键同 payload 返回同一结果，相同键不同 payload、stale expected revision 或 superseded attempt 返回稳定错误

**Given** MealSlot 属于 current linked Trip 主 segment 或 DayExcursion child Plan
**When** 应用合法餐饮变更
**Then** 严格限定为当前 active Plan scope，并复用 Story 4.4/4.7 的原子 successor TripRevision 绑定、相邻 handoff/host-child 边界校验和 current pointer 推进规则
**And** 不通过城市名、日期或餐厅名猜测目标，不跨 Plan 修改另一城市/宿主/child 安排，也不在缺失完整 successor TripRevision 时发布孤立 PlanRevision

**Given** 一次 choice-pool 变更成功发布
**When** 形成 successor pool
**Then** 新餐厅成为唯一主选；旧主选只有在仍 canonical、同城、可用且未重复时才按确定性顺序回到最多两个备选中，最终 pool 顺序、来源和 evidence state 随 revision 固化
**And** 不因客户端排序、重试、Provider 返回顺序或并发完成顺序产生不同池状态，也不让已删除/关闭/歧义分店重新进入备选

**Given** 餐饮变更已经应用
**When** 用户使用计划全局 `撤销 8` 或最近一条可撤历史
**Then** 复用 Story 3.1/4.4/4.7 的补偿 revision，恢复先前主选、备选顺序、mode、RouteFact/ValidationRun 绑定和 current aggregate
**And** 不增加餐饮专属撤销栏、不删除不可变历史、不撤销外部预约，也不把其他 owner 或其他 Plan 的并发状态带入恢复结果

**Given** owner、revision、MealSlot、MealOption 或候选状态不再合法
**When** 读取、预览、确认、重试或撤销
**Then** 对跨 owner、删除目标、stale revision、候选跨城、重复 option、待定位/landmark proxy、失效 canonical 事实和并发冲突返回稳定 typed error，并保留 current 可浏览计划与用户尚未提交的选择
**And** 不泄漏资源是否存在、其他 owner 的候选/导入来源或 Provider payload，也不以静默刷新到新 revision 掩盖 stale 操作

**Given** AMap、RouteFact、缓存、配额或网络暂时不可用
**When** 创建候选、打开池或计算更换预览
**Then** 已保存且仍合法的 MealSlot 可继续只读显示；新增/更换仅在缺失事实允许诚实降级时继续，否则明确说明暂时无法验证并提供重试、返回或继续暂不决定
**And** 不要求 BYOK、不伪造营业/距离/评分/预约/排队，不用 Story 6.2 的定位能力掩盖失败，也不因餐饮功能失败清空或重排整日计划

**Given** MealSlot、MealOption、命令、验证和使用事件进入日志、Sentry、指标或分析
**When** 记录可观测数据
**Then** 只记录脱敏 mode、meal-kind bucket、option count、source category、shortage/swap/undo/degradation result、revision delta、耗时和稳定错误码，并按 NFR5 衡量选择池打开、主备切换和候选不足效果
**And** 不记录完整餐厅/行程/导入笔记原文、用户搜索词、精确路线、预约内容、受保护 URL、Provider payload/secret 或其他 owner 数据

**Given** 用户通过触控、键盘、读屏、系统大字号或 reduced-motion 使用餐饮槽和选择 Sheet
**When** 查看证据、打开更换、选择主备、添加更多、暂不决定、确认、遇到冲突或撤销
**Then** 交互目标至少 44pt，图标具有可读名称/状态，主选与备选不只靠颜色区分，焦点进入/返回稳定，动态结果克制播报，reduced-motion 不依赖扫描/闪烁表达完成
**And** 长店名、价格、营业状态、预约 badge、候选不足、错误文案和底部安全区不得溢出、重叠、形成卡片套卡片或遮挡主要 CTA

**Given** Story 6.1 进入 UI 实现
**When** 选择视觉权威
**Then** 使用 `story-2-1-meal-slot-alternatives-r3.png` 约束普通 POI 视觉、紧凑预约 badge、一主两备 Sheet、更换图标和切换完成状态
**And** `story-2-1-meal-flex-recall-r2.png` 只可说明后续 Story 6.2 的定位召回，不得据此在本 Story 引入前台定位、动态排序或 BusinessArea；文本合同覆盖图片未展示的 revision、linked Trip、冲突、权限和降级边界

**Given** Story 6.1 准备关闭
**When** 使用无餐饮槽、酒店早餐、fixed anchor、choice pool 一主零/一/两备、重复/跨城/分店歧义、添加更多、普通与预约餐厅更换、undecided、hard/soft/unknown route、单城/linked Trip/DayExcursion、stale/并发/幂等/undo、AMap/RouteFact 失败、owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、Prisma migration、MealSlot repository/Planner/Validator/command/API/mobile/accessibility tests、真实 PostgreSQL、必要的 AMap route staging、移动与桌面截图、完整构建、handoff 与 diff 检查
**Then** 用户可以在可执行时间轴中识别固定餐厅、查看并安全切换一主两备，或诚实保留暂不决定，而不会破坏现有计划、联程边界和版本历史
**And** 本 Story 不实现前台定位/动态候选刷新、定位拒绝/陈旧降级、BusinessArea/附近吃什么、Trip 清单、购物目标/门店/返程缓冲、实时排队/库存、代预约、外部预约取消或后台连续定位

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 6.2: 前台定位餐饮召回与计划上下文降级

As a 旅行者,
I want 在用餐前按当前地点更新餐厅候选，并在定位不可用时继续获得基于行程的推荐,
So that 我能临场选择合适餐厅，又不必开放持续定位或中断已有行程.

**Requirements:** FR14, FR36.2 (dynamic meal recall), FR48, FR49;
NFR1, NFR3, NFR5-NFR8, NFR10-NFR11, NFR18, NFR20-NFR23;
AR1-AR6, AR8-AR15, AR17-AR20; UX-DR2-UX-DR3, UX-DR18, UX-DR22-UX-DR23,
UX-DR26-UX-DR27, UX-DR32-UX-DR33
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 打开App或回到前台且存在需要定位的当前旅中餐饮上下文，或打开Story 6.1的undecided餐次/主动刷新餐饮候选
**When** 历史位置授权当前仍有效或用户完成本次授权，且本轮前台打开/恢复尚未发起同一刷新请求
**Then** 允许获取一次fix并只读刷新候选，绑定当前owner、前台会话、PlanRevision、MealSlot、日期和active host/child scope；同轮重复生命周期/页面事件合并为同一请求
**And** 已有有效授权时无需每次重弹说明；无当前餐饮用途、初始规划、后台和单纯浏览其他日期不请求定位；刷新不抢占页面、不改变固定餐厅或已选主备池，授权记录不能代替实际系统权限

**Given** 用户尚未对本功能表达位置使用选择
**When** 显示首次应用内说明
**Then** 在用户需要附近餐厅时说明位置用于前台单次候选刷新，已授权后打开App可刷新但不会持续跟踪，并提供 `允许并更新候选 / 暂不使用定位`
**And** 未授权时不因打开App自动弹说明或系统授权，先提供计划基准；只有用户选择允许才调用真实系统权限流程，不仿造系统窗口或阻断浏览/手动选择，已撤销或无法确认的历史权限不视为有效授权

**Given** 用户历史授权仍有效或本次选择允许，且系统允许当前访问
**When** 获取位置
**Then** 使用单次 fix，包含本次所需坐标及 `observedAt / accuracy / source`，并显式保留坐标系以复用现有地理适配器进行统一处理
**And** 不启用持续watchPosition或定时刷新/上传轨迹；本次处理完成后清除原始fix，App打开刷新只短时保留该owner/scope的候选与粗粒度依据。关闭Sheet只取消其自身请求；退出账号、转后台、授权撤销或scope失效时取消所有关联请求/清除上下文并丢弃迟到结果，回到前台重新判断授权及用途，不把旧位置冒充新fix

**Given** 单次 fix 已返回
**When** 版本化位置策略判断是否可用于当前召回
**Then** 检查前台状态、观测时间/新鲜度、精度、坐标有效性与当前 Plan 城市/host-child scope，策略阈值可配置且请求绑定一个策略版本
**And** 陈旧、精度不足、未来时间戳、非法坐标、越城或 active scope 不匹配的 fix 不作为实时位置，不能仅凭获得坐标判为可用

**Given** fix 可用且目标餐次属于当前旅中上下文
**When** 召回服务构造候选集
**Then** 复用 Story 6.1 已保存池、当前 owner 的验证灵感以及现有受限 AMap 搜索/RouteFact 能力，按餐饮类别、城市、营业和用户已确认约束筛选
**And** 本次召回不依赖未来 BusinessArea、check-in、购物或后台搜索能力；普通附近搜索与 owner 导入 evidence 分开，不暴露其他用户笔记

**Given** 当前存在通过 CanonicalPOI、分店身份、营业基础事实及同城护栏的餐厅集合
**When** 基于同一位置快照排序
**Then** 依次选取距当前位置最近、当前位置 5km 内有效评分最高、有可靠免排队证据的候选，最多展示三家；同分按稳定次级排序和 CanonicalPOI identity 决定
**And** “最近/最高”只对本次受限且通过检查的结果成立，不能声称搜索了全城所有门店；来源、评分缺失或路线未知不能通过伪造数值获得排序资格

**Given** 排序命中同一 CanonicalPOI、某角色没有合格结果或不足三家
**When** 执行去重与补位
**Then** 同店只出现一次，先补当前 scope 饭后 POI 附近的合格未选餐厅，再以既定候选顺序填充仍可用的未重复结果，显示每家的实际入选依据
**And** 仍不足时保留真实数量，在第一个空位显示 `+ 添加更多`；没有饭后 POI 时跳过该补位条件，不猜测另一城市、酒店或下一日的目的地

**Given** 候选含免排队、预约或营业证据
**When** 决定是否显示相关推荐理由
**Then** 验证其来源、适用时段与证据有效性，保留可追溯引用；免排队来源只能表述为笔记/证据中的记录，不表示当前排队实况
**And** 证据缺失、过期、冲突或仅为推断时放弃对应资格或明确降级，不用“实时免排队”“已订位”等语气，也不向用户暴露技术质量/新鲜度枚举

**Given** 用户不授权、系统拒绝、定位超时/失败、fix 陈旧/低精度或 scope 不匹配
**When** 需要继续展示餐饮候选
**Then** 从 exact current revision 解析同一 scope 餐次之前的上一计划 POI 与下一计划 POI作为计划基准，并明确标注 `上一计划地点`，不得按时间流逝伪造“已完成”
**And** Story 7.2 已移出 MVP，本 Story 不查询或依赖打卡/照片到访状态；只剩一个基准时使用单个基准，两者都不存在时保留 Story 6.1 静态池和手动添加，不推测用户位置

**Given** 召回使用计划上下文而非当前位置
**When** 呈现推荐与距离
**Then** 显示实际的前/后 POI 名称和 `已按行程位置推荐`，距离/通勤明确从该计划基准计算，排序理由对应计划路线
**And** 不显示 `离我最近` 或 `当前位置`，不把两个计划基准插值为用户位置，不使用其他 Plan/日期中同名 POI，也不让无可靠 RouteFact 的候选显示估算步行分钟

**Given** 位置已过期或用户未授权
**When** 页面展示降级结果
**Then** 有可用计划基准时主显示 `已按行程位置推荐`，旁边保留实际前/后计划地点，距离明确从该基准计算；点击既有推荐依据可查看未授权、位置过期、低精度、定位失败等本次真实原因与可恢复状态；没有计划基准时诚实保留静态池/手动路径，不套用计划位置文案，也不显示 `离我最近`
**And** `重新获取位置 / 去开启定位` 仅为次要动作，拒绝后不反复弹系统授权，系统不支持设置直达时给出真实可用的浏览器权限指引；主流程保留选餐厅、添加更多和继续暂不决定

**Given** 用户打开或刷新一组候选
**When** 服务端处理召回请求
**Then** API 验证 session、owner、expected PlanRevision、MealSlot、日期与 Trip/DayExcursion 绑定，并返回本次 request identity、basis、策略版本、候选实际理由和 typed degradation
**And** 召回是只读操作，不创建 PlanRevision、TripRevision、MealSlot、EditEvent 或伪 PlanningJob，不原地改写已保存主选/备选

**Given** 刷新、返回、权限变化或多次请求产生并发响应
**When** 客户端接收结果
**Then** 仅接受当前owner/前台会话、current request、revision、MealSlot、日期和scope一致的响应；App打开触发的结果进入同一scope的短时只读候选状态，Sheet触发的结果还须匹配当前打开的Sheet，失效请求不得覆盖现有结果
**And** App打开刷新不自动导航或覆盖正在编辑的Sheet草稿；候选查看和radio选择保留为本次草稿，不因重新排序采用餐厅或改变原有选择，离开前台/账号切换/撤权后的迟到响应丢弃

**Given** 用户从召回结果选中一家餐厅并准备采用
**When** 进入确认
**Then** 复用 Story 6.1 的路线/营业/负荷预览、显式确认、typed command、增量校验、immutable revision 与全局撤销，服务端重新验证所选 canonical identity 和当前约束
**And** 单次精确定位只在本次召回内使用；保存选择只持久化必要 POI、来源与计划路线，不把原始定位快照写入计划、撤销记录或导出

**Given** target 属于 linked Trip 主 Plan 或 DayExcursion child Plan
**When** 选择推荐基准、候选或应用确认
**Then** 均以 MealSlot 所属 Plan 为最大 scope，采用后由 Story 6.1/4.4/4.7 原子推进对应 Plan/Trip revisions并验证 handoff
**And** 用户实际身处另一城市不会自动切换 Plan、新增城市或解除一日游/transfer 边界；仍沿用当前 scope 的诚实降级

**Given** 召回后 PlanRevision、TripRevision、MealSlot、目标日期或所属 scope 改变
**When** 用户继续预览或确认旧结果
**Then** 返回明确 stale 状态，保留最新可浏览计划，提示刷新后重新选择
**And** 不静默重绑定旧结果到新 slot，不把旧位置或候选顺序当作最新依据，也不执行过期 mutation

**Given** 召回调用 AMap、RouteFact 或证据缓存
**When** 请求超时、配额耗尽、触发熔断或网络失败
**Then** 使用受限超时、重试预算、短时限流和粗粒度缓存，在对应候选区显示 `候选暂未更新` 与真实重试动作，并保留可读静态池和手动添加；原因、推荐基准及已有结果时间在本模块按需查看，不扩大成全页警告，也不让旧结果伪装为刚刷新的候选
**And** 公共地理缓存与 owner evidence 分层，缓存不包含精确个人位置/轨迹；失败不伪装为零候选成功、不要求 BYOK、不阻止原计划浏览，也不在本 Story 发送运营告警

**Given** 服务端处理位置请求、响应、诊断或分析
**When** 需要保留运行证据
**Then** 仅记录授权/可用结果类别、basis 类型、策略版本、候选数量、降级原因与耗时 bucket，精确位置只存在于必要的短时请求处理中
**And** 原始坐标、精确位置历史、餐厅/路线/用户笔记原文、受保护 URL、Provider payload、token 均不得进入数据库位置历史、日志、Sentry、分析或导出，不持久化连续轨迹

**Given** 用户通过触控、键盘、读屏、大字号或 reduced-motion 使用召回
**When** 请求授权、等待单次 fix、取消、查看基准/候选、降级、重试或恢复时间轴
**Then** 控件至少 44pt，动态状态克制播报，焦点进入/返回稳定，候选/按钮尺寸稳定，加载、空、失败、禁用与降级均有明确可读结果
**And** 不只靠绿/橙色表示实时与计划基准，不让系统授权流程、长 POI 名称、键盘或底部安全区遮挡操作

**Given** Story 6.2 进入 UI 实现
**When** 选择原型与行为合同
**Then** 使用 `story-6-2-meal-location-recall-fallback-r1.png` 约束首次授权、定位可用、过期和未授权/无 fix，使用 `story-2-1-meal-flex-recall-r2.png` 约束 undecided 与候选不足
**And** 图片中 `去开启定位` 按真实设备能力工作，前序地点仍为计划地点，免排队不构成实时承诺；2026-09-14新增的已授权App打开单次刷新以文字合同为准，旧图不是该触发路径的实现证据，无基准/零结果与异步权限边界仍须验证

**Given** Story 6.2 准备关闭
**When** 使用首次授权/允许/拒绝/持久拒绝、no-fix/陈旧/低精度/异常时间戳/越城/坐标系、只有前/后基准/两者都无/无 check-in、重复/同分/不足/零候选、免排队缺失/过期、后台切换/迟到响应/权限撤销、弱网/配额/缓存、stale revision、linked Trip/DayExcursion、owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、location-policy/recall/ranking/API/mobile tests、真实 AMap route staging、目标移动与桌面浏览器权限/模拟位置核验、选择后真实 PostgreSQL revision/undo 回归、截图、完整构建、handoff 与 diff 检查
**Then** 用户可在有效授权后于App打开/回到前台或餐饮入口获得单次位置候选；验收还覆盖历史权限有效/撤销/不可确认、无餐饮上下文、同轮重复前台事件、首页结果晚到及打开Sheet后的草稿保护，在定位不可用时继续使用计划基准并安全确认选择
**And** 本 Story 不实现 BusinessArea/附近吃什么、后台或连续定位、check-in、实时排队/库存、代预约、Trip 购物清单或跨 Plan 推荐

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C13 — App：系统权限、单次定位与坐标系

**Given** Android/iOS 存在适用当前餐次上下文，系统权限可能精确、近似、拒绝、撤回或不可确认
**When** 用户打开/恢复 App 或主动刷新候选，宿主按原规则检查权限并在允许时取得单次 fix
**Then** 去重同轮触发，验证时间/精度/坐标系并按有来源的规则接入 AMap，权限/无 GMS/无 fix/低精度不满足时继续原计划位置降级
**And** 后台停止新定位、丢弃迟到结果；不凭历史许可越权、不把 WGS84 直接冒充 GCJ-02、不保存轨迹或覆盖正在编辑的 Sheet

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 6.3: 规范化商圈与“附近吃什么”

As a 旅行者,
I want 在逛商场、小吃街或市场时，看到自己导入过的同商圈美食,
So that 我能顺路找回收藏中的餐厅和小吃，并查看对应笔记.

**Requirements:** FR14, FR36.2 (business-area food hints), FR47;
NFR1, NFR3, NFR5-NFR8, NFR20-NFR21, NFR23;
AR1-AR5, AR8-AR15, AR17-AR20; UX-DR2-UX-DR3, UX-DR15, UX-DR18,
UX-DR27, UX-DR32-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** 当前已有 CanonicalPOI、owner 导入记录和单城/联程时间轴，但尚无可查询的规范化商圈关系
**When** Story 6.3 交付地点附加美食入口
**Then** 在同一纵向切片中建立 `BusinessArea`、`PoiBusinessAreaMembership` 的 OpenAPI/生成类型、必要迁移、归属维护、owner 查询与移动端展示
**And** 每个 BusinessArea 具有稳定 identity 和 cityId，POI 可属于零个或多个商圈；实体只承担本 Story 的归属/召回，不提前建立购物目标或清单系统

**Given** Provider 返回名称、地址片段、行政区、L2 聚类、商圈提示或明确容器/边界证据
**When** 尝试识别和归一化 BusinessArea
**Then** 使用带来源的规范化规则与稳定城市身份，只有符合可靠性策略的商圈/容器证据才能建立有效 membership；同名不同城市和不同实际商圈保持独立
**And** 不以行政区、L2、地址同词、同一篇笔记或简单距离接近直接宣称同商圈，也不假设 Provider 总能提供稳定商圈 ID 或边界

**Given** 一条 POI 商圈关系被新建、更新或复核
**When** 保存可靠性判断
**Then** 记录 `source / confidence / reliabilityState / policyVersion / observedAt / expiresAt?` 及可追溯依据，版本化策略定义来源优先级、阈值、有效期、冲突及多归属规则
**And** 缺失、歧义、冲突、过期或仅有 AI 推断的关系保持未知/不可用，不能因为需要凑足推荐而自动升级为有效；不同来源不能静默互相覆盖

**Given** owner 已有在本 Story 上线前创建的验证灵感
**When** 运行受限的归属补全或后续读取需要刷新 membership
**Then** 复用已保存的 canonical/provider/evidence 数据，按确定性键执行可重入、受配额控制的增量补全，保留仍有效的关系并使新结果可被本 Story 直接查询
**And** 不要求用户重新导入笔记、不重抓整个 XHS 内容、不改变导入 ownership/来源，也不把旧原文或未经验证的商圈字符串直接当作可靠关系

**Given** 新 POI 验证成功、Provider 事实更新或原归属不再有效
**When** 维护该 POI 的 membership
**Then** 复用相同版本化归属策略，并使受影响的查询缓存按 POI/商圈/策略变化失效；维护失败保留诚实未知状态而不伪造完成
**And** 不为更新推荐关系创建 PlanRevision、移动时间轴或改写既有用户地点意图

**Given** 当前时间轴上存在商场、小吃街、市场或其他有可靠商业区域归属的可用 CanonicalPOI
**When** 请求该地点的附加美食摘要
**Then** 先验证 owner 与 exact PlanRevision、slot、城市及 active host/child scope，再查询与宿主地点共享有效 BusinessArea identity 的食品类 CanonicalPOI
**And** 宿主与候选双方 membership 均须通过策略；行政区相同、L2 相同、跨城同名、landmark-proxy 或 unresolved 地点不能绕过此门禁

**Given** 某美食 POI 与宿主地点共享可靠商圈
**When** 决定它是否进入列表和入口计数
**Then** 还必须存在当前 owner 可访问的导入记录/灵感关系，且该餐厅已完成高德 POI 验证；食品类别有可追溯依据
**And** 不混入城市热门、另一用户导入、公共实时搜索或未解析分店，不能以公共 POI 缓存推断当前用户收藏了该店

**Given** 同一餐厅来自多篇可访问笔记或与宿主共享多个商圈
**When** 汇总摘要与分页结果
**Then** 按 CanonicalPOI/分店 identity 去重，每家只展示一次，计数表示唯一餐厅数量；保留该 owner 的可访问来源集合，并按确定性顺序分页
**And** 来源条数不包含其他 owner、已删除或无权访问的记录，不按名称合并不同分店，也不把一条关系通过多个 join 重复计数

**Given** 附加查询至少返回一家有效美食
**When** S7/S8 渲染宿主地点
**Then** 在该地点信息行下追加一个紧凑、可点击且可访问的 `附近吃什么 · 来自导入笔记 N家` 入口
**And** 入口没有独立时间、时间轴 dot、选择框或大型卡片，不创建 MealSlot，不改变原午餐/晚餐/景点的时间、顺序和负荷

**Given** 用户点击附加美食入口
**When** 打开列表 Sheet
**Then** 标题使用具体地点如 `中山路附近吃什么`，显示真实商圈名称与个人导入来源，餐厅行包含可用的名称、类别、地址片段和来源条数
**And** 内容是浏览结果，不自动选择主餐厅、不自动写入候选/Picker intent，也不为所有美食分配时间槽

**Given** 用户选择餐厅行或行内来源
**When** 查看进一步信息
**Then** 餐厅行复用 Story 2.8 通用 POI Sheet，来源进入已有 owner 导入记录/证据查看入口，原始链接复用鉴权与复制能力
**And** 记录和链接每次访问重新校验权限；查看详情/复制不是正式加入行程，明确采用时复用已有候选/餐饮选择、预览确认和校验流程

**Given** 宿主没有有效 membership、候选没有可靠共享归属或没有当前 owner 的有效导入结果
**When** 渲染时间轴
**Then** 隐藏附加入口，保留普通地点行和自然连续的布局
**And** 不补一个空 MealSlot、不展示商圈质量报错 badge、不扩大到全城热门或静默调用实时定位凑结果

**Given** 用户已经打开列表后删除导入、失去访问权，或 Provider/策略使某归属失效
**When** 重新查询、恢复页面或继续打开来源
**Then** 清除不可访问的旧条目和相应来源/计数；全部失效时显示 `暂时没有可查看的美食` 与返回行程动作，并撤去失效的附加入口
**And** 不能因旧列表/缓存仍在而继续展示已失效私有内容，也不删除同一 CanonicalPOI 下仍有独立合法来源的其他结果

**Given** 列表请求正在加载、超时或发生网络/Provider 错误
**When** 页面显示当前状态
**Then** 在原 Sheet 显示稳定加载状态或明确可重试失败，保留安全的行程返回路径；失败与成功零结果使用不同状态
**And** 不把请求失败报告成没有导入、不显示虚假数量，不让迟到请求覆盖另一 slot/Plan 的列表；关闭恢复原日期、slot 和滚动位置

**Given** 用户查看“附近吃什么”中的位置或可选通勤信息
**When** 解释推荐基准
**Then** 使用当前计划宿主地点及共享商圈，若显示距离/通勤则注明起点并复用有效 RouteFact；无法可靠计算时只展示地址
**And** 本入口不申请实时定位，不把商圈中心、地理直线距离或 AI 估计伪装成用户位置/步行分钟，也不依赖 Story 6.2 才能浏览

**Given** 宿主属于独立 Plan、linked Trip 主段或一日游 child Plan
**When** 解析 scope、恢复入口或接受返回结果
**Then** 使用明确 Plan/slot/revision identity 与 cityId，在该范围查询相同 BusinessArea，并在 revision/scope 改变时安全刷新
**And** 不凭同名城市、商圈、餐厅或同一 Dn 把另一个 Plan 的地点当宿主，不跨 host/child 或相邻城市复用错误的推荐基准

**Given** membership 或个人附加列表使用缓存
**When** 查询、失效或复用
**Then** 公共层只缓存 canonical 商圈事实，个人层按 owner、导入权限/内容版本、宿主、membership/策略版本区分，分页/count 与权限过滤使用同一规则
**And** 删除/撤权/归属失效必须使个人结果不可继续命中；来源条数、笔记和个人选择不得混入公共缓存，也不能通过缓存键或错误枚举其他用户数据

**Given** 界面展示美食事实或系统记录归属/查询指标
**When** 输出用户内容或可观测数据
**Then** 用户只看到有依据的营业/预约事实与可追溯来源，内部可记录脱敏 membership 结果、策略版本、数量 bucket、查询/点击结果和耗时
**And** 普通列表不显示 `高德已核实`、质量/新鲜度/置信度标签；日志、Sentry、分析和共享数据不记录 owner 笔记原文、精确私有路线、URL、凭据或跨 owner 内容

**Given** 用户通过触控、键盘、读屏、大字号或 reduced-motion 使用附加入口和 Sheet
**When** 打开、查看来源、加载、重试或返回
**Then** 入口与来源动作具有至少 44pt 触控区域、明确名称/角色及焦点返回，长店名/来源条数/地址可换行，加载与数量变化克制播报
**And** 不只靠图标颜色区分状态，不让附加行占据独立时间点、不嵌套卡片，不因内容异步更新遮挡日期栏、hotel footer 或主要操作

**Given** Story 6.3 进入 UI 实现
**When** 选择视觉权威
**Then** 使用已批准 `story-6-3-area-food-context-r2.png` 的 A 附加入口、B owner 美食/来源、C 无可靠归属隐藏、D 打开后结果失效；旧 `story-2-1-area-food-suggestions-r1.png` 被 R2 取代
**And** 图中店名/地址/来源计数为示意 fixture，不证明真实 Provider 事实；请求失败保留重试而非复用空态，文本合同覆盖多归属、缓存、权限与 linked scope

**Given** Story 6.3 准备关闭
**When** 使用零/单/多商圈、同名异城、L2/行政区误匹配、分店歧义、多笔记/多 membership 去重、历史导入补全与重试、过期/冲突归属、撤权/删除、分页计数、空/加载/失败、缓存隔离、无路线、单城/linked Trip/DayExcursion、stale scope 和无障碍 fixture，并运行 OpenAPI/生成类型、必要 Prisma migration、membership policy/normalizer/backfill/repository/API/mobile tests、真实 PostgreSQL、真实高德归属/地点 staging、移动与桌面截图、完整构建、handoff 与 diff 检查
**Then** 用户能够从行程地点找回自己的同商圈美食与来源，在依据不足时得到诚实的隐藏/恢复行为，并保持既有时间轴不变
**And** 本 Story 不实现购物目标/清单、实时位置召回、后台跟踪、公共热门美食补位、XHS 搜索、自动创建 MealSlot、自动加入计划、实时排队/库存或代预约

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 6.4: 行程清单与直接／AI 添加记录

As a 旅行者,
I want 集中记录旅行中的待办事项，并选择自己填写或让 AI 帮忙整理,
So that 我能随时补充、修改和完成记录，同时保持行程安排清晰.

**Requirements:** FR46 (checklist and records), FR25, FR38 (AI usage controls), FR49;
NFR1, NFR3, NFR6, NFR8, NFR17, NFR20-NFR21;
AR1-AR5, AR8, AR11-AR15, AR17-AR20; UX-DR2-UX-DR3, UX-DR18,
UX-DR28, UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 正在浏览独立单城 Plan 或已发布 linked Trip
**When** 在时间轴日期 Tabs 的右侧打开清单
**Then** 使用固定窄 `ListChecks` 图标与真实未完成记录数量，打开该整趟行程的完整清单，同时让左侧日期继续横向滚动
**And** 切换日期、城市或 DayExcursion 不新建重复清单；图标保留至少 44pt 触控区域且不会被日期覆盖，返回恢复原城市、日期、scope 与滚动位置

**Given** 现有数据模型尚无可交付的清单读写实现
**When** Story 6.4 建立第一套清单能力
**Then** 新增 owner-scoped 清单 aggregate、必要的 OpenAPI/生成类型/Prisma migration、repository、API 与 UI，清单唯一绑定稳定 `standalone_plan | trip` target，记录有独立逻辑 ID、版本、文字、类别、可选日期/scope、状态和来源
**And** 不强迫独立 Plan 先建跨城 Trip，不按城市名/日期索引猜测身份，不创建已延期的商品属性、多门店或清单时间缓冲实体；Story 6.5 仅复用此文本合同

**Given** 清单包含购物、顺路事项、返程任务或普通备注
**When** 分类展示
**Then** 支持 `must_buy / along_route / return_task / note`，对应必买目标、顺路门店、返程事项与按需出现的 `其他记录`；普通备注可独立存在
**And** 不把“记得带充电宝”等一般记录强行放入必买或返程，不因没有类别内容而显示大块空组，也不把来源 AI/user 作为额外分类说明栏

**Given** 用户新增或编辑一条记录
**When** 设置日期和分类
**Then** 可选择整趟或有效具体日期，必要时绑定明确 Plan/segment/child scope，默认不要求关联地点；文本行与完成勾选具有独立操作区域
**And** 计划修改后不按变化后的 Dn 序号静默改绑记录；原日期/scope 失效时保留文字并要求重新指定或设为整趟，不丢失记录

**Given** 用户查看完整清单或空清单
**When** 准备新增记录
**Then** 底部只提供 `+ 添加记录` 并打开输入框与 `AI 提示 | 直接添加` 两个动作；空清单仍保留同一添加入口
**And** 不显示 AI/手动来源说明栏，不把“生成整份清单”设为前置步骤，也不从 Planner 或当前时间静默创建记录

**Given** 输入内容为空或仅包含空白
**When** 渲染双动作或点击直接添加
**Then** AI 提示禁用且原因可读，直接添加保持强调色并进入填写页；该页包含文字、分类和日期，只有填写有效内容后才允许保存
**And** 点击入口不创建空记录、不发起 AI 调用、不消耗 AI 额度，也不把强调色解释成已经成功保存

**Given** 输入框包含有效文字
**When** 用户尚未选择下一动作
**Then** AI 提示启用并获得强调色，直接添加仍可用；只有明确点击 AI 提示才启动生成
**And** 输入、停顿、失焦、切换日期或 Sheet 打开都不触发自动生成；切换直接添加时完整带入原文

**Given** 用户选择直接添加或从 AI 失败/取消路径选择直接添加原文
**When** 完成文字、分类和日期并保存
**Then** 以用户确认的原文创建记录，保留有效标点、换行和表达，仅做输入长度/空白/安全显示校验，不由 AI 改写或补全
**And** 不凭自然语言自行补出门店、预约、已购买状态、时间缓冲或已完成标记；保存前取消只保留草稿，不生成持久记录

**Given** 用户明确点击 AI 提示
**When** 发起建议生成
**Then** 通过既有 Provider 抽象与最低必要额度/并发/超时/成本控制，读取本次输入、owner 当前行程及已有清单的最小上下文，并记录所用上下文/提示版本
**And** 只生成记录建议，不修改计划、已有记录、Picker intent、门店绑定或缓冲；不要求 BYOK、不开放其他用户数据、不把任意来源文本当成系统指令

**Given** AI 被要求检查“还没买/尚未完成”等事项
**When** 形成建议
**Then** 只依据用户文字、当前已保存记录和显式完成勾选解释已知状态，缺少记录时明确未知或给出可确认的一般建议
**And** 不推断实际购物、到访、实时库存、排队或预约，也不依赖 Epic 7 check-in、后台定位或未来 Story 6.5 才能生成普通记录

**Given** 建议正在生成
**When** 用户查看、停止、离开或转直接添加
**Then** 显示真实 `正在整理建议`，允许停止并保留原输入；迟到/取消/已被新输入替代的结果不能自动出现为已保存清单项
**And** 不显示虚构百分比或提前成功，原清单仍可浏览/操作；重复点击受当前请求保护，不并行写入重复记录

**Given** AI 返回通过结构与来源检查的建议
**When** 展示待确认结果
**Then** 每条都可编辑文字/分类/日期与取消选择，显示真实已选数量，用户点击 `加入选中 N 条` 后才保存这些记录；零选择不能提交
**And** 未选/未确认建议不进入清单、不改变未完成数量；用户修改后的表达优先，新增来源保持可审计且不把 AI 证据附到无关用户文字

**Given** AI 建议与现有记录完全或近似重复
**When** 准备确认列表
**Then** 仅在对应重复建议旁以次要行内文字显示 `清单中已有`，可查看对应已有记录；重复建议默认不选中，让用户决定是否确实需要另一条，不新增逐条提醒弹窗
**And** 不自动覆盖、合并、删除或重写原记录，不改变其完成状态，也不以“AI 优化”为由替换用户表达

**Given** 建议生成时的行程、清单或输入已发生相关变化
**When** 用户继续确认旧建议
**Then** 按 proposal/context identity 检查并标为需重新核对，保留原输入及用户草稿，提供刷新或返回编辑
**And** 不把旧建议静默绑定到新日期/城市，不将已完成项再次作为“未完成”保存；无计划依赖的直接记录仅需通过清单版本与字段校验

**Given** 用户提交新增、修改、删除、完成或取消完成
**When** 服务端执行清单命令
**Then** 验证 session、owner、稳定 target/item、expected checklist/item revision 和幂等键，并原子保存 successor 清单记录版本与真实计数；相同提交安全重试返回同一结果
**And** 清单操作不创建 PlanRevision/TripRevision，不触发时间轴 `撤销 8`；同键异 payload、越权、已删除目标或并发冲突返回稳定错误，不能覆盖更新记录

**Given** 用户点击记录或其右侧完成控件
**When** 编辑文字/分类/日期、删除、标记完成或取消完成
**Then** 复用同一编辑字段并保存记录自己的版本，完成状态可反复切换，未完成数量来自当前未删除且未完成记录
**And** 勾选只代表清单状态，不声称真实购买/到访、不等同景点打卡、不触发重排、预约、扣除其他目标数量或自动关闭相关行程任务

**Given** 清单中存在取货、退税、伴手礼检查或行李相关的返程记录
**When** 用户保存、查看、编辑或勾选该记录
**Then** 本期仅维护清单内容与完成状态，不显示 `预留时间` 或把记录转换为时间槽的入口，也不创建 PlanRevision/TripRevision
**And** 既有交通、住宿、寄存与取回方案所需的时间继续由原规划/校验合同安排，不能要求用户从清单重复添加；清单到可执行安排的转换按已批准决定延期

**Given** 保存发生弱网、断线、超时或版本冲突
**When** 客户端恢复操作
**Then** 保留正在编辑的内容和上次成功状态，已知保存失败在当前操作区明确显示 `暂未保存` 与安全重试/重新核对；提交结果未知仍核实原操作，不能改为可忽略建议或宣称成功；重复重试不得新增重复项，删除失败不得伪装为成功
**And** 不以清空输入解决错误、不把未确认草稿当服务端事实，完成/计数的临时乐观状态失败时恢复一致

**Given** AI 生成失败、超时、额度不足或 Provider 不可用
**When** 提供恢复选择
**Then** 保留原输入与清单，仅在当前输入/建议区显示 `建议暂未生成，可直接添加`，提供实际可用的重试、稍后继续或 `直接添加原文`，普通记录编辑始终独立可用；不将建议生成失败扩大成整份清单失败或把保存失败也改成该轻提示
**And** 不因 AI 失败丢失草稿、不要求配置 Key、不承诺额度恢复时间，不在本 Story 发送 Telegram 管理员消息

**Given** 清单、proposal、来源、缓存、日志或分析涉及用户数据
**When** 读取、导出内部上下文或记录事件
**Then** 在查询前校验 owner，相关导入来源再次鉴权；指标仅保留操作类别、数量/长度 bucket、结果和耗时
**And** 用户原文、完整行程、精确地点/路线、受保护 URL、Provider payload/secret 不进入日志/Sentry/分析或公共缓存，不通过计数和错误枚举其他 owner 资源

**Given** 用户通过触控、键盘、读屏、大字号或 reduced-motion 使用清单
**When** 切换日期/清单、输入、勾选、修改、确认建议或重试
**Then** 图标/checkbox/双动作具有明确名称、角色和状态及至少 44pt 目标，键盘弹出后 CTA 可达，焦点与原滚动位置可恢复，动态计数克制播报
**And** 不只靠强调色区别可用性，不让长记录、分类、日期和底部安全区溢出或遮挡操作，不嵌套卡片，不为记录保存制造排期撤销提示

**Given** Story 6.4 进入 UI 实现
**When** 选择视觉权威
**Then** 复用 `story-2-1-shopping-checklist-r2.png` 的固定 rail/完整列表、`story-2-1-shopping-add-record-r1.png` 的双动作切换，并使用已批准 `story-6-4-checklist-record-workflow-r1.png` 补齐直接填写、生成中、建议确认与失败恢复
**And** 旧图的背景 `撤销 8` 不是清单修改合同，45/60 分钟购物/返程槽与多家门店示例不授权本 Story 改排期；普通记录和空白保存门禁以本合同为准，图中计数均为示意

**Given** Story 6.4 准备关闭
**When** 使用空清单/空白输入、note/三类记录、整趟/具体日期、日期失效、直接原文、多行/长文本、编辑/删除/完成/取消完成、AI 点击/取消/重复/可编辑建议/零选择/失败/额度/stale context、保存并发/幂等/弱网、单城/linked Trip/DayExcursion、owner 越权和无障碍 fixture，并运行 OpenAPI/生成类型、必要 Prisma migration、checklist/proposal/repository/API/mobile tests、真实 PostgreSQL、脱敏 Provider staging、移动与桌面截图、完整构建、handoff 与 diff 检查
**Then** 用户可以独立维护整趟清单，并经明确确认把 AI 建议转成可编辑记录，保持原文、访问权限、版本和计数一致
**And** 本 Story 不实现商品型号/多门店绑定、返程缓冲落位、自动排期、实时库存/购物识别、景点打卡、后台定位或返程前 48 小时提醒

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 6.5: 轻量购物记录与标签快捷输入

As a 旅行者,
I want 直接写下想买的东西，并按需快速补充款式、数量或预算,
So that 我能先记住购买想法，不必完成属性表单、选择日期或关联门店.

**Requirements:** FR46 (lightweight shopping text capture);
NFR3, NFR8, NFR20; AR1-AR5, AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR28, UX-DR32-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 从 Story 6.4 的必买目标入口新增或编辑购物记录
**When** 打开录入界面
**Then** 主体为一个可直接输入的多行文本框，款式、数量、预算等补充信息保留在同一正文中，用户只写想买的东西也可继续保存
**And** 不以独立属性表单、购物日期、可选门店或关联门店步骤阻断输入；Story 6.4 已有的通用记录/可选日期能力保持独立，不成为这条轻量购物路径的必经步骤

**Given** 购物正文为空
**When** 展示输入提示
**Then** 使用灰色占位示例 `想买什么？可以直接描述` 及换行的 `款式： / 数量： / 预算：`，并提供真实可访问的输入框名称
**And** 占位内容不写入 value、草稿或服务端记录，不作为用户已填写内容、不自动推断购买属性，也不能使空记录通过保存校验

**Given** 用户已输入购买想法
**When** 持续输入、粘贴多行文字或删除补充信息
**Then** 保留原文、换行和已有内容，款式/数量/预算/品牌/尺码均为可选描述，允许完全不使用标签
**And** 不把数量强制默认为 1、不猜测预算币种/金额、款式或已购买状态，不自动改写成结构化 JSON、分栏表单或另一条记录

**Given** 输入框显示标签快捷操作
**When** 用户点击 `款式 / 数量 / 预算 / 品牌 / 尺码` 中的一项
**Then** 在同一输入框末尾补必要换行并插入对应标签与冒号，光标定位到该标签后继续输入，原正文完整保留
**And** 快捷操作只编辑本地文本，不提交记录、不调用 AI/搜索/定位、不触发分类或门店向导，也不新增第三套 AI/直接添加动作

**Given** 正文已包含对应的独立标签行
**When** 再次点击该标签快捷操作
**Then** 定位至已有标签内容位置，支持常见中文/英文冒号形式而不重复插入该标签或覆盖已有值
**And** 用户自行输入的重复段落仍保留原样，不执行整篇文本去重；普通句子中出现“款式”等词不等同于独立标签行

**Given** 用户正在使用中文输入法、屏幕键盘、外接键盘或读屏
**When** 点击标签、完成组合输入或恢复焦点
**Then** 正确提交/保留输入法中的文字再执行插入，输入框焦点和光标位置稳定，快捷行在键盘出现后仍可达，超宽标签行可横向滚动
**And** 不丢失组合输入、不重复字符、不让快捷按钮触发表单提交，不让键盘、安全区或浮层遮挡保存动作

**Given** owner 准备保存新增购物记录
**When** 校验正文
**Then** 复用 Story 6.4 的实际文本长度与空白规则；只要存在有意义的购买描述，即使所有属性缺失或部分标签未填写也可保存
**And** 仅空白或仅由未填写的预置标签组成时不能创建新的空目标；已有记录中的有效正文不会因缺失款式/数量/预算而被阻止编辑

**Given** 用户确认保存购物正文
**When** 服务端执行写入
**Then** 复用 Story 6.4 的 owner-scoped ChecklistItem 文本、必买分类、expected item/checklist revision 和幂等命令，保存原文并保持单城/联程清单绑定
**And** 本 Story 不要求新增 targetAttributes、linkedPoiIds 或专用购物表/搜索任务，不创建 PlanRevision/TripRevision，不修改时间轴或触发排期撤销

**Given** 用户重新打开、修改、删除或完成该购物记录
**When** 使用现有清单操作
**Then** 复用 Story 6.4 的同一正文及记录状态/版本，已输入的标签和文字可继续自由修改，完成可取消
**And** 不因标签内容或数量自动判定购买完成，不把一个文本购买目标复制成多家门店待办，也不把清单勾选作为真实库存或交易证据

**Given** 用户关闭编辑、返回清单、遭遇弱网或保存版本冲突
**When** 恢复草稿或重试
**Then** 沿用 Story 6.4 的草稿恢复与 typed error 行为，保留上次成功状态及尚未提交的原文，重试不会重复创建记录
**And** 不以清空正文解决错误，不把占位文字作为草稿恢复，不因普通时间轴 revision 变化覆盖独立清单文本

**Given** 用户继续使用 Story 6.4 的 AI 提示能力处理购物文字
**When** 点击 AI 提示并确认建议
**Then** 沿用既有最小 owner 上下文、明确触发、建议预览/选择和用户原文保护规则；快捷插入本身始终可以完全离线完成
**And** 不因为出现购物标签就新增商品属性抽取流水线、自动找店、库存查询、商业街提醒或任何自动排期行为

**Given** 用户通过小屏、大字号、读屏、键盘或 reduced-motion 使用此输入页
**When** 阅读占位、输入、选择标签、保存或返回
**Then** 标签动作具备可读名称和至少 44pt 操作区域，正文能够自然换行，提示与实际输入可区分，焦点和原清单滚动位置可恢复
**And** 不只靠灰色占位提供输入框名称，不用动效作为唯一反馈，不让长文本、快捷行或系统键盘造成溢出、重叠和布局跳动

**Given** 保存、插入标签或出错结果需要分析/诊断
**When** 记录事件
**Then** 仅保留动作类别、标签枚举、长度 bucket、结果和稳定错误码，并沿用现有 owner 鉴权与文本安全渲染
**And** 不记录购买正文、预算、款式、商品名称、私有行程、token 或其他用户数据，不把用户输入执行为 HTML/指令或写入公共缓存

**Given** 选择本 Story 的视觉与未来范围依据
**When** 实现轻量购物输入
**Then** 使用 `story-6-5-shopping-text-shortcuts-r2.png` 说明空占位、同框快捷插入和保存后的文本记录，并以已批准的本文交互合同为准
**And** 旧 `story-6-5-shopping-target-stores-r1.png` 的独立属性/日期/多门店界面已被取代；销售/库存证据、实际经过与定位触发、自动应用授权及撤销方式连同高级购物流程留待后续设计，不能从原型或本 Story 推导出 MVP 已授权能力

**Given** Story 6.5 准备关闭
**When** 使用自由描述、全空/仅标签、可选属性缺失、粘贴多行、中文/英文冒号、重复点击、用户重复段落、长文本、中文输入法、键盘安全区、单城/联程、保存并发/幂等/失败恢复、越权及无障碍 fixture，并运行文本快捷输入和 Story 6.4 记录保存/恢复的针对性 mobile/API 回归、移动与桌面截图、完整构建、handoff 与 diff 检查
**Then** 用户可快速记录购买想法和按需补充信息，保存原文且不被属性、日期或门店配置阻断
**And** 本 Story 不实现多门店关系、自动/用户协助找店流程、实时库存、L2 购物编排、顺路购物触发、定位/推送或清单返程事项转时间安排；上述高级购物与清单转换能力已明确延期，既有交通/住宿/行李缓冲仍遵守原规划合同

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 7: 持续使用行程并管理账户

用户可以重新打开行程、管理账户并使用可用的数据与反馈操作；内部额度不对用户展示。
以下为逐张获批的合同；Epic 7 整体规划已于 2026-09-07 确认完成，历史 sprint 状态不变。

**Deferred slot 7.2:** 用户已确认移出 MVP，旧手动打卡 GWT/原型不进入执行队列；
FR40.1 照片方向另行设计。7.1、7.3-7.6 已获批并追加，共 98 个 GWT。
覆盖与完成确认见 `epic-7-coverage-review-2026-09-07.md`；当前已转入 Epic 8 拆分评审。

### Story 7.1: 最近行程与继续使用

As a 旅行者,
I want 从首页找到已有行程，并继续上次的填写、规划或查看,
So that 关闭页面或中断后仍能接着使用，不用重复输入或重新生成计划。

**Requirements:** FR40 (recent trips only), FR49 (existing navigation reuse),
FR37 (existing ResultSheet consumption); NFR2, NFR3, NFR8, NFR20;
AR1-AR6, AR9, AR12, AR14-AR15, AR17-AR20;
UX-DR1-UX-DR4, UX-DR18, UX-DR29-UX-DR30, UX-DR32-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

Scope amendment (2026-09-06): Story 7.2 is explicitly deferred out of MVP, so AR16 is not a
current readiness gate. This story neither consumes check-in nor invents its persistence schema;
its approved 22 acceptance scenarios remain unchanged.

**Approved:** 2026-09-06. 本合同包含已确认的真实变更草稿与任务失败边界。
**Visual references:** `story-7-1-recent-trips-resume-r1.png`、
`story-7-1-recent-trips-recovery-r1.png`；后者 D 仅示意当前变更任务真实失败。
半途填写使用中性的 `有未完成的修改 / 继续填写`，原型文字不覆盖本合同。

**Acceptance Criteria:**

**Given** 用户已登录并进入首页
**When** 首页读取最近行程
**Then** 展示最近一趟行程的简要入口，并通过 `全部` 和现有菜单进入同一最近行程列表
**And** 保留原有 `计划 | 灵感`、HomeImportDock 长输入框和 `+ / send`；读取失败不阻塞输入

**Given** 当前 owner 有已保存的规划输入、独立 Plan 或联程 Trip
**When** 获取首页摘要或分页列表
**Then** 仅返回该 owner 的真实记录，并按上述稳定规则排序，支持继续加载
**And** 列表展示城市或城市链、已知日期/天数、真实状态和对应动作；未知日期不伪造
**And** 未提交的输入框内容和单纯导入记录不自动变成行程；图片缺失使用稳定占位，不阻止打开

**Given** 一趟行程包含多个城市或宿主日的一日游 child Plan
**When** 列出或恢复该行程
**Then** 整趟联程只占一项，城市子 Plan 和一日游不重复生成独立卡片
**And** 城市链支持长名称及多城市，打开后可读取完整顺序；按稳定 id 而不是城市名定位
**And** 原独立计划并入联程后的旧入口需鉴权并解析到所属当前联程，不打开脱离 Trip 的旧子版本

**Given** 服务端已有当前可阅读的 PlanRevision 或完整 TripRevision
**When** 列表显示该行程
**Then** 使用 `已生成`，不因进入行程单、导出或日期过去而标记旅行 `已完成`
**And** 细节未完善或已有校验冲突不移除该入口；具体状态仍由现有 S7/S10 负责

**Given** 行程尚未发布且已保存 S2-S5 输入
**When** 用户选择 `继续填写`
**Then** 回到最近有效的填写阶段，并恢复已保存的时间、住宿、行李、地点意图与节奏数据
**And** 缺失前置条件时回到首个需处理阶段，不跳过既有确认规则；酒店允许留空

**Given** 该行程的当前 PlanningJob 或 TripPlanningJob 仍在运行
**When** 用户选择 `查看进度` 或重启后恢复
**Then** 打开原有 S6/S7 shell 并重连同一持久任务的真实阶段和 cursor
**And** 打开页面不新建任务、不重复扣费，也不把未原子发布的城市结果当成完整联程

**Given** 首次规划终止失败且不存在已发布行程
**When** 用户选择 `查看原因`
**Then** 进入既有失败恢复界面，保留输入并显示该错误实际支持的重试、修改输入或恢复动作
**And** 仅用户明确选择重试才调用已有幂等/fenced 重试流程；不伪造可阅读行程
**And** 原型的 `重试生成` 仅代表可重试暂时失败，不为额度、鉴权或结构错误统一提供盲重试

**Given** 已有可用行程，用户新增城市、修改跨城日期或交通等进入既有重新编排流程
**When** 渲染最近行程入口
**Then** 主入口继续打开已发布行程，只有该 owner 确实存在关联本行程、尚待处理的持久变更草稿或任务时，才在同一项内提供继续处理入口
**And** 不覆盖当前行程、不重复生成卡片，也不静默应用草稿；仅打开页面、关闭未保存弹窗或普通编辑请求失败不产生此入口

**Given** 已有行程的变更草稿已保存，但用户填写到一半离开，尚未提交当前草稿的重新编排任务
**When** 再次查看最近行程
**Then** 同一行程项显示中性的 `有未完成的修改` 和 `继续填写`，恢复真实保存的输入阶段
**And** 不显示失败、错误图标或重试生成；原行程仍可独立打开，离开页面不会自动启动编排

**Given** 当前已保存的变更已提交，关联的持久重新编排任务处于排队或运行中
**When** 显示或打开附属入口
**Then** 显示 `修改规划中` 和 `查看进度`，复用真实任务状态与重连流程
**And** 用户关闭页面、断线或进度读取暂时失败不等于任务失败；无法确认新状态时仅在该进度模块显示 `暂未更新 · 重试`，保留真实已知状态并可查看读取原因，不猜测终态或扩大成全页警告

**Given** 当前变更版本关联的有效任务已真实进入终止失败状态
**When** 显示最近行程的附属入口
**Then** 才显示 `本次修改生成失败` 和 `查看原因`，提供实际错误允许的恢复动作
**And** 主入口仍打开原行程；失败需匹配当前 draft/input revision 与有效 job/attempt，历史或被新草稿取代的失败不覆盖当前状态

**Given** 当前变更已发布、明确放弃，或失败后用户继续修改并保存了新的输入版本
**When** 刷新最近行程
**Then** 发布后主入口指向当前新行程；放弃且无其他待处理草稿/任务时移除附属入口；新输入未重新提交时显示 `有未完成的修改`
**And** 取消任务不自动称为失败；若取消后仍保留可继续的草稿则恢复未完成修改入口，否则不展示待处理入口

**Given** 用户上次在有效的 S7 编辑页或 S10 行程单离开
**When** 选择对应 `继续编辑` 或 `继续查看`
**Then** 恢复该视图、所在城市或一日游 scope、日期和可用滚动锚点
**And** 无有效偏好时回到现有 S7 默认视图；不强制所有行程进入同一种新页面
**And** 不恢复瞬时弹窗、未确认的 AI 建议或过期的撤销倒计时为已生效状态

**Given** 用户在 S9 或 S11 的既有持久任务中离开
**When** 从最近行程恢复
**Then** 复用原任务入口和现有版本/过期检查，或安全返回其 S10 父视图
**And** 不重新设计 fill/export 状态机，不自动重新完善或重新导出

**Given** 本地保存的视图或 revision 提示已旧
**When** 打开行程
**Then** 先按 owner 与稳定 aggregate id 查询服务端当前版本，并以该版本恢复安全位置
**And** 联程读取一个原子 TripRevision 的完整成员集合，不拼接各子 Plan 的不同 current 版本
**And** 原日期、地点或 scope 已消失时回到有效父 scope/日期；不能按同名地点猜测身份

**Given** 用户离开已成功打开的行程页面
**When** 保存浏览位置并关闭/重启客户端
**Then** 最小恢复信息按 owner 与稳定行程标识持久化，和 Plan/TripRevision 分开保存
**And** 保存允许的 view、scope、日期、稳定滚动锚点与版本提示，不保存任意跳转 URL、原始输入、来源链接或定位轨迹
**And** 同一浏览会话的迟到写入不可覆盖较新的位置；位置保存失败不阻塞查看或修改行程

**Given** 会话失效、owner 切换、目标删除或目标不可访问
**When** 加载列表、继续入口、深链或恢复位置
**Then** 重新鉴权并只恢复同 owner 的有效目标；不存在与越权使用不泄露对方信息的统一不可用结果
**And** 退出/切换账号清除当前账号的私有缓存、缩略图与挂起响应；无效入口提供返回列表或首页

**Given** 列表正在加载、真实为空或请求失败
**When** 展示对应状态
**Then** 分别展示稳定占位、无行程空态或模块内 `暂未更新 · 重试`，不把加载失败当作空列表，不以列表错误覆盖首页其他可用操作
**And** 同 owner 已有可用的列表摘要可保留，刷新问题只在本模块说明，已知的数据截至与来源可按需查看，未知时间不伪造；不把缓存当成已验证当前内容，撤权后立即清除不可访问数据
**And** 无法联网校验时不承诺离线编辑/后台提交；重试和返回入口保持可用

**Given** 用户浏览列表或重新打开行程
**When** recent/resume metadata 被更新
**Then** 只更新浏览元数据，不创建 PlanRevision/TripRevision、打卡、用户偏好学习或新的 AI 操作
**And** 原有冲突、酒店/行李修改规则和导出门禁继续由对应前序 Story 决定

**Given** 长城市名、多城市、动态字体、键盘或 reduced-motion 场景
**When** 浏览首页/列表并返回
**Then** 文本和动作不重叠，图标有名称，状态不只靠颜色，触控目标至少 44pt
**And** 记录列表滚动位置并正确返回焦点；弱网占位及短转场不导致 Dock 或列表跳动

**Given** 现有 Home、规划输入/任务、Plan/Trip 与 ResultSheet 已具备各自能力
**When** 实现本 Story
**Then** 仅补聚合查询、导航恢复及必要的 owner-scoped 浏览元数据/API/迁移
**And** 使用 OpenAPI SSOT 生成类型，不依赖 7.2 打卡、7.3 设置重做或另一个数据库前置 Story

**Given** 本 Story 实现准备验收
**When** 执行自动化和浏览器核验
**Then** 覆盖单城/多城/一日游聚合、草稿发布不重复、相同城市不同旅行、分页、任务重连、首次失败、已有行程变更草稿/任务真实失败、过期 scope、账号隔离与真实空/失败状态
**And** 专项覆盖新增城市/跨城日期或交通改动后半途离开、无持久草稿不展示入口、排队/断线不误报失败、旧失败不覆盖新输入、取消/放弃和成功发布后的入口清理；普通编辑错误不能制造变更草稿
**And** 验证重开不增加规划调用/扣费/行程版本，位置持久化经服务和浏览器重启仍可恢复
**And** 通过契约生成、相关单元/route/repository/mobile 测试、真实 PostgreSQL、桌面/移动截图与 workspace build；原型不算实现证据

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C14 — App：进程终止后的最近行程

**Given** owner 已有服务器持久的行程/任务/安全恢复元数据，App 被系统终止或完成覆盖升级
**When** 再次认证并选择最近行程
**Then** 读取当前服务端 revision 与有效恢复位置，恢复同一个 Plan/Trip/active city 或 child scope
**And** 不以旧本地缓存覆盖新版，不把未持久化输入声称为已保存；无法恢复时提供诚实入口，重新打开不触发重新规划

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 7.3: 设置页账号与可用操作

As a 旅行者,
I want 在设置中确认当前账号，找到实际可用的账户操作，并能安全退出登录,
So that 我能管理和继续使用自己的行程，而不必了解模型密钥或平台内部额度。

**Requirements:** FR12 (Settings/account entry), FR25 (available-action/recovery boundary),
FR38 (preserve internal enforcement, no quota UI), FR49 (existing navigation);
NFR3, NFR7 (entry only), NFR8, NFR20;
AR1-AR5, AR12-AR15, AR17-AR20, AR22 (operator boundary);
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 用户确认账号与可用操作范围；不展示额度。
**Visual reference:** `story-7-3-account-actions-r2.png`；R1 用量方案已被取代。
数据/反馈入口按实际部署开放，本 Story 不交付 7.4-7.6 的完整业务流程。

**Acceptance Criteria:**

**Given** 用户从 Home/Library 的既有菜单进入设置
**When** 浏览或返回
**Then** 仅呈现账号和已部署的可用操作，返回恢复来源页状态
**And** 不提供 AI 用量/使用情况/全局生成状态面板，也不引入打卡、相册或营销页

**Given** 会话有效且可能缺少可展示账号信息
**When** 渲染账号区域
**Then** 使用已有安全信息，缺失时显示 `已登录 / 当前账号`
**And** 不展示原始 user/device/session id、不编造手机号昵称、不增加账号行跳转箭头或资料编辑

**Given** 读取设置可用动作或操作受到后台额度保护
**When** 返回和呈现用户信息
**Then** 不返回用于用户展示的账户用量、余额、上限、百分比、重置时间、token 或预算，不提供相应页面
**And** 不用低额度/额度已用完等分级暴露额度；服务端计量、限流、预算和熔断仍生效

**Given** 用户打开设置或刷新
**When** 初始化客户端请求和 UI
**Then** 不调用用户侧 key 查询/验证/保存/删除，不出现 Key 引导或内部 Provider 名称
**And** 不因移除 UI 自动删除历史密钥或重写兼容端点策略

**Given** 某数据、隐私或反馈能力未部署、已可用或暂时失败
**When** 构造操作入口
**Then** 只开放真实可用的目标；未部署能力不伪装可执行，已部署但暂时失败的能力保留诚实恢复路径
**And** 目标再次鉴权/校验，不能靠客户端旗标或直接深链绕过；账号/隐私操作不被 AI 额度面板额外阻断

**Given** 设置包含数据导出、删除账号、隐私政策及反馈的可用入口
**When** 用户选择目标
**Then** 进入该目标自己的确认和处理流程，不在 Settings 打开时直接发起导出/删除或声称反馈已送达
**And** 7.4/7.5/7.6 仍负责完整流程；7.3 可独立交付，后续按真实能力开放而非依赖其先实现

**Given** 某操作当前不可执行或已有任务可恢复
**When** 显示可用动作
**Then** 仅提供真实的稍后重试、查看原任务进度或返回手动编辑路径，不暴露额度数字/原因
**And** 不伪造已排队/服务故障，不自动重试 AI；真实任务阶段、处理数量和导出图片份数继续在原页面显示

**Given** 用户选择退出当前账号
**When** 确认且服务端成功撤销当前会话
**Then** 清除私有客户端缓存/挂起响应与当前 cookie，返回登录页；取消确认不改会话
**And** 不删除账号/已保存行程、不撤销其他设备、不取消已受理任务

**Given** 存在未保存输入、会话失效，或退出失败/结果不明
**When** 处理离开
**Then** 复用既有保存/离开保护与重新登录流程，只承诺已保存内容可恢复
**And** 不假报服务端撤销成功，提供重试/核实，避免旧账号数据暴露给后续账号

**Given** 设置读取中、失败、部分能力未知或账号发生切换
**When** 更新内容
**Then** 使用稳定加载/局部重试状态，未知不视为可用，不用旧账号的身份/动作结果填充
**And** 请求有界且只读，关闭或切换账号后丢弃迟到响应，不后台轮询或调用 AI/高德探测可用性

**Given** 用户从设置返回已有计划
**When** 浏览、手动编辑或恢复原任务
**Then** 原有版本、scope、冲突校验、确认和撤销规则不变，不因隐藏额度而放松服务端保护
**And** 设置读取/导航不增加 PlanningJob、PlanRevision、TripRevision、产品用量或 Telegram 通知

**Given** 动态字体、长账号提示、键盘、读屏或 reduced-motion
**When** 使用列表和退出 Sheet
**Then** 至少 44pt 目标、图标有名称、状态不只靠颜色，文字不盖住操作，焦点约束和返回明确
**And** 只读账号不伪装按钮，未部署项不出现误导性可执行箭头，列表不嵌套装饰卡片

**Given** 实现本 Story
**When** 修改现有 Settings、认证客户端和必要的安全动作投影
**Then** 遵守 OpenAPI SSOT、生成类型并复用现有 auth/logout，正常状态连接真实可用目标而非全 mock
**And** 不实现账户用量汇总、配额引擎、运营后台、设备管理或后续数据/反馈业务链

**Given** 本 Story 准备验收
**When** 测试只读身份/缺资料、能力开关/暂时失败、退出成功/失败/取消、账号切换、BYOK 残留和长文案
**Then** 通过契约/route/mobile、必要真实会话撤销核验、手机与桌面截图、workspace build
**And** 证明无用户额度字段/UI、无 key 请求、无自动生成/计量副作用，已有任务真实进度和行程保护不受影响

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C15 — App：原生退出与账号切换

**Given** App 已有当前会话、私人缓存及可能迟到的原生插件/网络响应
**When** 用户确认退出当前会话并随后登录另一账号
**Then** 复用 1.0 持久退出结论，清理适用原生凭据/缓存并拒收旧 owner 的迟到结果，其他设备仍按原规则可用
**And** 不以删除本地凭据代替服务端撤销，也不扩大为账号删除或取消已受理业务任务

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 7.4: 账号数据副本导出

As a 旅行者,
I want 下载一份自己在 Nomad 中保存的数据副本,
So that 我能留存和查阅自己的规划内容，且不会误下载他人的数据。

**Requirements:** FR12 (account-data export); NFR2-NFR3, NFR7 (data-export closure), NFR8,
NFR20, NFR22 (read the exact linked revision set, no publication change);
AR1-AR6, AR9, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 当前结构化数据范围、JSON-in-ZIP 和两组 R1 原型获批。
**Visual references:** `story-7-4-account-export-core-r1.png`、`story-7-4-account-export-recovery-r1.png`。
账号数据副本与 Epic 5 行程图片导出分离；后者仍不使用 ZIP。原型日期/大小不定义期限策略。

**Acceptance Criteria:**

**Given** 用户从可用的设置入口进入账号数据导出
**When** 尚未提交申请
**Then** 在生成前简述真实数据范围、关键排除项与 `ZIP 内含 JSON`，并以可读次要文字显示一次 `副本含个人数据，请妥善保管`；详细字段、完整排除项和适用保留说明可在当前页展开，只有明确点击生成才创建任务，关键导出后果不得后置到生成之后
**And** 不因进入/返回/刷新页面触发导出，不改变行程图片导出的规则

**Given** 当前账号存在计划、联程、已保存草稿、灵感、批注、清单或行程文字
**When** 按本 Story 的版本化字段白名单收集副本
**Then** 包含各类别当前已保存内容及必要的 owner 自有关系和已引用地点事实，保留用户表达与来源区分
**And** 未保存的本地输入不假装已备份，空类别明确为空，不纳入历史版本/原图视频/图片导出产物

**Given** 数据集中含共享 POI、私有来源、身份凭据或内部调用信息
**When** 收集、序列化、记录日志或报告失败
**Then** 只包含当前 owner 白名单数据及必要共享事实，排除其他 owner 关系和所有密钥/cookie/token/签名地址/内部额度
**And** 不导出原始模型输入输出、完整采集证据、原始私有来源 URL、原始设备位置轨迹或非安全账号标识，不向日志复制副本正文

**Given** 用户在导出请求等待期间或数据收集期间继续修改计划、草稿或清单
**When** 完成一致性捕获
**Then** 固定真实 snapshotAt 下的当前字段和确切 Plan/Trip/DayExcursion/Transfer/Stay/Luggage 版本集合
**And** 不把请求时间冒充数据截至时间，不混合不同联程版本，不从实时 current 指针逐页拼接漂移副本

**Given** 捕获或打包过程中失败/进程重启
**When** 恢复任务
**Then** 已封存快照的技术重试使用同一数据和策略版本；封存前可重新捕获但最终如实记录新 cutoff
**And** 迟到 worker 不得覆盖当前尝试/已发布产物，不在同一副本身份下静默替换成更新数据

**Given** 重复点击、多端并发或提交响应丢失
**When** 再次提交或核实同一申请
**Then** 幂等回执和每 owner 单个活跃任务约束返回同一已受理任务，不重复打包
**And** 不能依赖 Date.now 作为唯一身份，也不把另一账号的任务用于合并

**Given** 任务进入执行
**When** 收集、生成 JSON/说明/manifest 并上传 ZIP
**Then** 完成真实文件、类别完整性和校验检查后原子标记可下载，任务状态由持久化记录而非队列推测
**And** 必需类别读取失败、打包或对象存储失败不得以部分内容报成功或提前提供下载

**Given** 任务排队或执行中，用户离开、刷新、断网或退出后重新登录
**When** 回到当前账号的数据副本页面
**Then** 恢复实际任务和阶段，不自动再次申请；退出当前会话不取消已受理导出
**And** 状态读取失败显示核实/重试读取，不能把页面离开或网络错误标为任务失败，不显示虚构进度/额度

**Given** 导出已真实完成
**When** 打开下载页及副本
**Then** 展示真实文件名/大小、数据截至与下载有效至，ZIP 内的 JSON、manifest 和说明可解析且关联可核对；普通浏览器经用户操作实际交出下载请求且无可观察拒绝时显示 `已开始下载，请确认`，内部保存结果仍未知，不新增逐文件确认步骤或宣称已保存
**And** 不把生成时间/过期时间当额度窗口，不宣称数据库备份、恢复导入或尚未实现的格式

**Given** 用户读取状态或发起任一文件下载请求
**When** 服务端处理
**Then** 校验当前认证、owner、账号可用性、产物状态和有效期；无权/失效请求不得返回文件或私有元数据
**And** 不提供公开分享链接，不以已知 task id 或签名链接单独放行，文件名不能形成路径注入

**Given** 副本仍有效而应用检测到下载请求失败
**When** 用户重试下载
**Then** 获取同一文件，不重新收集数据或启动导出任务
**And** 下载任务仍为可用；重试后普通浏览器确已交出请求且无可观察拒绝时仍使用 `已开始下载，请确认`，已知取消/阻止/失败照实显示；浏览器保存结果无法确认时不宣称已保存到设备/相册，也不把文件生成可用当作已完成保存

**Given** 文件已超过实际配置的有效期、不可再用或用户需要最新内容
**When** 用户选择重新生成
**Then** 创建新申请并捕获新的当前数据；旧过期文件不可通过刷新链接复活
**And** 清理仅针对导出副本及临时对象，不删除原始计划/灵感，留存时长不得硬编码为原型示例

**Given** 文件生成后账号内容发生修改，或新一轮生成失败
**When** 用户下载旧的仍有效副本
**Then** 明确保留该副本自己的数据截至时间，不声称包含后续变化
**And** 新任务失败不提前销毁仍有效旧产物，不自动再生成；无需提供完整历史版本管理界面

**Given** 原请求会话失效，或账号在捕获/发布/下载前已被禁用或删除
**When** 任务和文件处理继续
**Then** 会话失效不等于取消任务；账号不再有资格时拒绝捕获/发布/后续下载并回收本任务临时数据
**And** 不实现账号删除本身，不以客户端登录旗标授权，不依赖 7.5 先交付才可完成本 Story

**Given** 无旅行数据、大量数据、超时、对象失败或部分读取故障
**When** 执行导出
**Then** 空账号仍可生成说明明确的副本，大数据按经过测试的资源策略有界处理；无法完成时如实失败并保留源数据
**And** 不静默截断、忽略失败类别或把未完成包当成功；重试受内部保护且不对用户展示额度

**Given** 用户申请、查询、重试或下载副本
**When** 处理请求
**Then** 仅读取已有产品数据并写导出任务/临时数据/产物，不创建 PlanRevision/TripRevision 或改变用户内容
**And** 不调用 AI/高德/XHS 补资料，不读相册，不增加邮件/推送/运营 Telegram 或自动删除账号

**Given** 小屏、长文件名、动态字体、读屏、reduced-motion、读取失败或登录过期
**When** 操作导出页
**Then** 图标有名称、44pt 目标、文字换行、状态播报/焦点返回正确，提供实际可用的重试/登录/返回
**And** 不只靠颜色，不让旧账号响应回填新账号页面，不把生成失败态用于未知读取结果

**Given** 实现本 Story
**When** 扩展现有 account 导出入口、worker、最小持久化/存储和 mobile 客户端
**Then** 先维护 OpenAPI SSOT 并生成类型，交付申请到鉴权下载全链；按端到端真实能力开放设置入口
**And** 不顺便重写删除/反馈任务、增加通用任务框架或用 mock 下载链接证明业务完成

**Given** 本 Story 准备验收
**When** 核验多 owner/共享 POI、联程含一日游、当前草稿/用户覆盖、并发编辑、快照重试、账号资格变化与过期
**Then** 解包真实产物核对字段/数量/关系/校验和及时间一致性，越权与凭据泄漏测试全部通过
**And** 证明普通退出不取消任务、删除资格禁止未来下载、技术重试不换快照且必需类别错误不产生成功文件

**Given** 核验完整生产式执行路径
**When** 使用真实 PostgreSQL、队列 worker 和受保护对象存储，测试重启/重复提交/上传失败/下载失败/过期以及手机桌面视图
**Then** 契约、repository/route/mobile、存储 staging 检查、截图和 workspace build 通过，离开后可恢复同一任务并下载实际可解析文件
**And** 浏览器保存能力与文件期限按真实环境验证，不用 queue accepted、模拟成功或图中示例替代交付证据

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C16 — App：系统文件保存账号副本

**Given** 本人当前结构化数据副本已真实生成且仍有访问资格
**When** App 使用受保护下载和用户选择的系统文件保存路径交付 ZIP
**Then** 保存同一封存快照并按实际系统回执区分已保存、取消、失败和未知，失败可重取同一有效文件
**And** 不保存到图片相册、不自动公开分享或交出签名 URL/凭据；退出/资格变化按原合同阻止后续读取，并清理 App 临时副本

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 7.5: 账号删除与清理结果

As a 旅行者,
I want 明确确认删除自己的账号，并知道相关数据是否已清理,
So that 我能停止使用服务，而不被仍可访问的旧数据或含糊的处理结果困扰。

**Requirements:** FR12 (account deletion), FR18.1 (shared-reference deletion/owner isolation);
NFR2-NFR3, NFR7 (deletion closure), NFR8, NFR20;
AR1-AR6, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 受理后不可撤销、可选先导出、备份单独披露及两组 R1 原型获批。
**Visual references:** `story-7-5-account-delete-core-r1.png`、`story-7-5-account-delete-recovery-r1.png`。
规划批准不等于实际删除授权；保留/回执期限和真实身份核验仍须在实施验收时确定与验证。

**Acceptance Criteria:**

**Given** 用户进入删除账号页面
**When** 查看范围、保留说明或打开最终确认 Sheet
**Then** 明确展示将删除的数据、所有设备停止访问、受理后不可撤销及不可撤回的外部副本边界
**And** 未最终确认不执行删除；关闭/取消返回原流程，不增加挽留问卷或强制原因

**Given** 用户想先留存数据，或已有生成中的副本
**When** 从删除前页面选择导出或最终确认删除
**Then** 导出复用 7.4 且不强制；确认前提示需先完成下载，确认删除后停止未完成导出并撤销后续下载
**And** 不自动导出、不等待导出成功才允许删除、不承诺撤回已下载/分享的副本

**Given** 用户提交最终删除命令
**When** 服务端核验真实身份、近期认证、owner/action challenge、有效期和请求来源
**Then** 仅有效确认可进入删除，需重新核验时复用已有登录方式而不强制新增手机号或密码
**And** 开发请求头、stub OTP、过期/重放/跨 owner challenge 和 CSRF 请求不能授权生产删除

**Given** 有效删除命令通过校验
**When** 服务端提交事务
**Then** 原子固定删除任务、生命周期/授权版本、普通会话撤销与可重发的队列投递记录
**And** 只在提交成功后称已受理；队列暂不可用不丢任务或重新开放账号，提交前失败不擅自停用

**Given** 删除已受理
**When** 旧设备、旧会话、深链、SSE 或 artifact 链接访问，或服务进程重启
**Then** 持久化账号资格检查阻止普通读取/写入/下载和新登录会话，只保留限定的删除状态能力
**And** 前台清理私有缓存并丢弃迟到响应；离线设备下次连接核验并清除，不能承诺瞬时擦除离线副本

**Given** 重复点击、多设备提交或提交响应丢失
**When** 核实或重试原申请
**Then** 通过幂等 key、唯一活跃删除请求及预先绑定的安全回执恢复同一任务
**And** 不生成第二个删除、不把未知结果宣称失败/完成，不要求恢复普通账号权限才能核实

**Given** 导入、规划、AI 调整、细节、图片或数据导出任务仍在运行
**When** 账号进入删除状态或迟到结果到达
**Then** 停止后续工作并以账号删除版本/attempt fence 拒绝发布，登记和清理已产生的临时数据
**And** 重启 worker、自动重试和旧回调不能重建账号数据或恢复下载权限

**Given** 账号具有当前/历史计划、联程/一日游、草稿、灵感和用户内容
**When** 收集并执行清理
**Then** 覆盖所有自有版本、住宿/早餐/行李、候选/来源证据、修改/撤销、清单、细节与最近访问等记录
**And** 删除范围不受 7.4 当前版本导出白名单限制，不先级联删掉外部文件/trace 清理所需引用

**Given** 账号关联登录身份、会话、历史 BYOK、缓存、媒体及导出对象
**When** 执行对应清理步骤
**Then** 清理/撤销自有凭据、私有对象、缓存、临时数据及导出快照/文件，确认后续访问失效
**And** 不删除平台共用 Provider secret，不把已下载到外部的文件宣称远程清除

**Given** 多个用户导入同一内容或共享 CanonicalPOI/媒体指纹
**When** 删除当前账号的关系并回收对象
**Then** 移除其 ACL/私有证据与批注，仅在无其他有效引用且允许回收时删除共享对象
**And** 与他人并发导入/删除也不误删其他 owner 数据，不因去重将个人内容公开或永久保留

**Given** 数据可能分布于数据库、队列/缓存、对象存储及已启用的分析/错误/追踪系统
**When** 执行版本化清理清单
**Then** 每类都有完成、验证匿名化、明确隔离保留或未部署证据，不漏掉 Langfuse/Sentry 等实际保存的可识别数据
**And** 接口受理不等于物理清完，远端待处理仍为未完成，纯 hash 不冒充不可关联匿名化

**Given** 大量记录/文件、部分目标已不存在或 worker 中途重启
**When** 继续清理
**Then** 按持久步骤和有界策略续做未完成部分，去重与所有权检查后重复删除安全
**And** 迟到尝试不覆盖当前状态，不因某步失败回滚到活跃账号或丢弃未清理对象记录

**Given** 某个真实清理步骤失败或等待外部处理
**When** 展示结果和恢复动作
**Then** 显示部分数据尚未清理完成、账号仍停用；按真实重试资格提供继续处理，不假报已完成
**And** 用户重试需限定授权且只继续原任务剩余步骤，不恢复账号、不依赖 7.6 反馈或未来运营后台

**Given** 页面读取进度失败、断网或响应过时
**When** 用户重新查看
**Then** 只重读进度，并区分上次已确认事实与当前未知状态
**And** 不再次提交删除、不把离开页面当失败，不虚构后台已重试或已清理完成

**Given** 普通会话已撤销但用户需查看删除结果
**When** 使用有效受限回执或通过既有身份验证重新取得状态权限
**Then** 只读本次安全进度与保留说明；回执过期/丢失走限定核验，不发普通登录会话
**And** task id/原始用户 id/URL 参数不是凭证，回执不进入地址栏或日志、不允许读取行程/下载副本/跨 owner 查询

**Given** 必需在线数据步骤已获验证，可能仍有政策允许的隔离备份或最小保留记录
**When** 显示账号已删除
**Then** 明确在线个人数据已清理，并独立说明实际保留范围、用途、访问限制和到期政策
**And** 不笼统宣称所有副本即时消失；未知清理结果或未确定保留政策不能通过完成验收

**Given** 曾删除账号的数据仍在尚未到期的隔离备份中
**When** 按实际备份恢复流程恢复环境
**Then** 服务开放前重放受保护的删除记录，确认该账号无法登录、读回内容或被 worker 重新发布
**And** 删除记录及回执本身有明确最小保留周期/权限，不无限保存账号内容作恢复依据

**Given** 同一手机号或第三方身份再次验证，删除可能仍在进行或已完成
**When** 登录/恢复状态或明确重新注册
**Then** 清理期间仅可获得限定状态，完成后新注册必须获得新的内部 owner 身份且无旧数据
**And** 固定手机号 hash、身份映射、旧 token、缓存或迟到任务不能复活旧账号；不静默把查状态变成注册

**Given** 用户申请、查看或重试清理
**When** 返回结果或记录审计
**Then** 只显示安全类别和可用操作，审计保留最小状态/证据，不传播原文、精确地点、受保护链接或凭据
**And** 不展示额度，不因 AI 额度阻止账号删除，不新增邮件/推送/Telegram、AI 规划、打卡或相册处理

**Given** 小屏、动态字体、读屏、键盘、reduced-motion 或流程中离开
**When** 操作范围页、确认 Sheet 和状态页
**Then** 有 44pt 目标、正确焦点/播报、明确文本危险提示与返回路径，不只依赖红色
**And** 返回登录不取消已受理任务，受理后没有返回行程/撤销/恢复账号等误导入口

**Given** 实现本 Story
**When** 扩展现有认证资格检查、account 路由、最小持久化、worker 和状态 UI
**Then** 遵循 OpenAPI SSOT/生成类型，闭环最终确认、停用、清理、状态授权和恢复并按实际能力开放入口
**And** 不以假 OTP、开发身份头、数据库单表删除、队列受理或未来运维页面替代交付，真实身份缺口必须先解决

**Given** 本 Story 准备验收
**When** 使用真实 PostgreSQL/队列/私有存储和已启用追踪系统，核验多 owner、共享引用并发、全版本清理、导出/worker 竞态、响应丢失、多设备、重启、重新注册和备份恢复
**Then** 契约/repository/route/mobile 测试、真实清理证据、手机桌面截图与 workspace build 通过
**And** 版本化数据清单、保留/回执期限、恢复抑制及用户披露已确定；历史代码和示意图不算已完成证明

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C17 — App：账号停用后的原生残留

**Given** 删除已真实受理，设备可能离线、被杀、恢复备份或保留原生安全存储中的旧凭据
**When** App 恢复普通访问、收到迟到任务/插件结果或尝试旧身份登录
**Then** 持久账号资格阻断普通访问，在线恢复后清理适用凭据/私有缓存，仅允许原合同的受限删除状态查询
**And** 不因重新安装/恢复旧凭据复活 owner，不把受限回执变成普通会话，也不承诺撤回外部已保存/分享副本

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 7.6: 反馈入口与可靠提交

As a 旅行者,
I want 在遇到问题或有建议时快速反馈，并知道内容是否确实提交,
So that 外部页面或网络异常不会让我的反馈无声丢失。

**Requirements:** FR45, FR12 (feedback entry), FR49 (return-context reuse);
NFR3, NFR7 (owned-data lifecycle), NFR8, NFR15-NFR16, NFR20;
AR1-AR5, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-07. 包含当日上传置灰、进行中无底部按钮的修正；20 个 GWT 与 Entry R1/Recovery R2 获批。
**Visual references:** `story-7-6-feedback-entry-submit-r1.png`、`story-7-6-feedback-recovery-r2.png`；Recovery R1 已被取代。
**Detailed contract:** `story-7-6-review-2026-09-06.md` 保留编号与产品/实现边界；本批准不等于 Epic 7 整体确认或功能已交付。

**Acceptance Criteria:**

**Given** 用户从设置、侧边栏或结果页异常入口反馈
**When** 打开、返回或提交后返回
**Then** 进入同一反馈流程并恢复合法来源页/日期/滚动上下文，直接填写入口始终可达
**And** 不改变行程、调用 AI 或自动重试原失败操作

**Given** 外部产品配置可用、缺失或无效
**When** 构造反馈入口
**Then** 仅开放经过验证的官方 HTTPS 产品链接，缺失时仍提供真实可用的内置表单
**And** 不把代码默认 nomad-mvp 或任意客户端 URL 当有效产品，不向 URL 附加原始来源/用户资料

**Given** 当前环境为 Web/PWA 或本期 Android/iOS Capacitor App
**When** 用户选择外部反馈
**Then** 按实际能力执行用户触发的外部打开或文档要求的宿主配置；明确失败提供重试/浏览器/内置填写
**And** App 复用 9.1 的受限外链能力，外部页面不能持有 Nomad 原生桥接或会话，不把 window.open 当 WebView、不声称可从 iframe load/error 准确判断跨域 HTTP/CSP 或提交结果

**Given** 用户进入兔小巢
**When** 构造请求或遇到第三方登录
**Then** 不传 Nomad 会话、手机号、邮箱、owner id 或自研 SSO；需要时用户可改用已登录账号的内置表单
**And** 不保证所有宿主都匿名，不启用可选登录态、自定义参数、回复通知或数据拉取

**Given** 外部页面/邮件客户端打开、页面加载或用户返回 Nomad
**When** 更新提示和统计
**Then** 只记录真实打开尝试/可观测打开结果，第三方提交保持未知，不能显示反馈已收到
**And** 移除 mailto 打开即清空草稿/记成功的旧行为，不以跨域访问或新 webhook 伪造闭环

**Given** 用户直接填写反馈
**When** 输入问题或建议
**Then** 一段有效文字即可提交，保留原文；最多一张截图可选，不要求分类/电话/邮箱或 AI 改写
**And** 空白、超出实际文本限制或不合法输入有明确提示且不丢内容，占位文字不是提交数据

**Given** 用户选择截图并预览
**When** 明确提交且开始上传
**Then** 使用 owner 绑定的私有上传，验证实际图像格式/字节/像素并清除 EXIF 定位等元数据
**And** 未提交不上传，不自动截图/读取相册集合，不接受他人对象或外部 URL，也不提供公开图片链接

**Given** 已选截图上传失败或上传暂不可用
**When** 渲染截图区并由用户继续操作
**Then** 保留文字和可移除的预览，上传控件置灰，不展示失败提示、重试上传行或专用移除截图仅提交文字按钮
**And** 用户通过预览 X 明确移除后复用普通提交反馈；仍有未完成附件时不静默按无图提交，上传恢复后才能按正常显式流程重试
**And** 失败/删除/过期临时对象按策略回收，已绑定附件不被误删，置灰具有真实 disabled 语义而非仅换颜色

**Given** 附带诊断信息默认关闭
**When** 用户选择开启后提交
**Then** 仅附带可见说明中的来源页面类别、应用版本、安全错误代码，并由服务端白名单过滤
**And** 关闭不附带诊断字段；不包含整份计划、精确位置、原始日志/URL/stack、身份凭据或内部额度

**Given** 反馈文本合法且选定附件已验证可用
**When** 服务端原子保存反馈与最终附件引用
**Then** 返回持久回执编号/时间并显示 `反馈已收到`，回执以编号和提交时间为主，其他说明用可读小号文字呈现一次，不反复弹窗/Toast或抢占焦点；授权维护者可真实取到这份反馈
**And** 未完成保存不能报成功，不宣称问题已处理、邮件送达、腾讯已收帖或承诺答复时间

**Given** 连点、多次重试或提交响应丢失
**When** 核实或再次发送原申请
**Then** 同 owner/幂等 key/原始 payload 得到同一回执，不重复创建记录
**And** 同 key 改文/改图被拒绝，已知未受理后修改才形成新明确申请，不覆盖可能已收到的反馈

**Given** 正在上传、提交或核实原申请结果
**When** 更新实际处理阶段
**Then** 显示对应进行中状态，不展示底部重新查看、返回或替代操作按钮；未知结果由有界读取核实同一请求
**And** 只有真实保存失败或等待/核实超时后才退出进行中并开放对应恢复，不无限转圈，不清空内容或盲目新提交
**And** 截图上传单独失败按第 8 条收为置灰控件；顶部返回/系统返回仍保留请求上下文，离开/返回或网络恢复不触发自动提交

**Given** 用户返回、刷新、认证过期或切换账号
**When** 恢复草稿/回执
**Then** 仅恢复同 owner 的有效临时内容与原申请身份；截图本地字节丢失须明确重选而不假装仍可提交
**And** 本地恢复有 TTL，成功/放弃/退出/账号切换/删除时清除，迟到响应不回填其他账号，不保存认证 token

**Given** 访问内置提交、附件、回执或维护读取接口
**When** 服务端鉴权
**Then** 校验真实身份/owner/账号资格与最小角色权限，受保护资源不能靠编号、开发 header 或客户端角色读取
**And** 删除受理后的旧请求/回执不能新建反馈、上传或发布附件；不新增匿名第一方反馈或恢复已删除账号

**Given** 内置反馈已收到
**When** 授权维护者使用最小服务端运维读取路径
**Then** 能查看实际文字和鉴权附件，访问有审计且普通用户不能查询他人报告
**And** 不依赖未来运营后台、不自动转发给腾讯/邮箱/Telegram，不用不可访问的落库记录当完整交付

**Given** 用户导出数据、删除账号或放弃未提交附件
**When** 执行既有 7.4/7.5 和临时文件清理
**Then** 数据副本包含本人的反馈文字/安全附件索引而不打包截图，删除覆盖报告/附件/临时对象且防迟到复活
**And** 不声称导出或删除第三方独立帖子，不让新 feedback 表成为隐私清理遗漏

**Given** 打开、上传、提交、核实或失败发生
**When** 记录埋点/错误/审计
**Then** 区分打开与提交事件，包含有限来源类别/模式/安全错误，外部无法观测的提交不记成功或失败
**And** 反馈原文和截图不进入分析/Sentry/Langfuse/公开日志，不被当成模型或运维自动执行指令

**Given** 请求遭遇网络、存储或防滥用保护
**When** 反馈无法执行
**Then** 提供真实重试/手动路径且保留输入，上传/请求有界，不暴露额度或把 AI 预算当反馈门槛
**And** 不增加反馈历史/客服对话/SLA、SSO、回复推送、第三方 API 拉取、规划修改或后台定位

**Given** 小屏、中文输入法、长文本、键盘、读屏、reduced-motion 或外部打开受限
**When** 使用表单/预览/恢复动作
**Then** 文字可换行、CTA 不被遮挡、44pt 目标和图标名称/焦点/状态播报完整，安全外链和返回可用
**And** 上传置灰同时提供禁用语义/名称，进行中无底部按钮仍有正确焦点和顶部导航；不通过关闭 CSP/同源保护或不安全 opener 来读取第三方页面

**Given** 本 Story 准备验收
**When** 验证真实配置产品/支持宿主、第一方 PostgreSQL/COS 保存与授权维护读取、重启/重复/未知响应、上传置灰/移图后普通提交、进行中无底部按钮/有界超时恢复、截图清理、越权及账号删除竞态
**Then** OpenAPI 生成、focused tests、真实服务检查、移动桌面截图及 workspace build 通过，回执与实际记录/对象一致
**And** 未配置产品可先走内置降级但不能声称第三方接入验收通过；不使用 mock 链接、mailto 或弹窗布尔值冒充真实提交

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C18 — App：App 外部反馈与单图选择

**Given** 用户从 App 进入反馈流程并选择真实配置的外部入口或内置表单
**When** 从外部页面返回，或通过系统选择器选取/取消一张截图后明确提交
**Then** 返回恢复原来源/安全草稿而不计提交成功，所选截图按原校验/EXIF/私有上传规则处理，只有第一方真实落库回执才报告已收到
**And** 不扫描相册或自动截图，不向第三方传 Nomad 身份/桥接，不因系统返回/进程重建自动重发；字节丢失时明确重选，仍保留文字反馈

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 8: 度量并运营可靠的 AI 旅行服务

运营人员能追踪错误与成本、评测质量并安全管理 Provider/配额；用户仍使用单一规划流程。
本 Epic 六张 MVP Story 的拆分已批准；8.7/8.8 保留为 Post-MVP，不作为本期前置条件。

### Story 8.1: 跨流程观测与故障定位

As a Nomad 运营者，
I want 从真实故障关联到请求、异步任务、业务阶段与 AI 调用，
So that 我能判断问题发生在哪里，同时不接触不必要的私人旅行内容，也不影响用户继续使用。

**Requirements:** FR13（Sentry/Langfuse，评测归 8.2）、FR14（观测集成）、FR33（阶段与失败事实）；
NFR2-NFR4、NFR6-NFR7、NFR17-NFR18、NFR20-NFR23；
AR1-AR8、AR11-AR15、AR17-AR20；UX-DR2-UX-DR3、UX-DR31-UX-DR33。
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-07。Sentry + Langfuse、唯一全局 provider 与显式隔离 AI tracing、安全业务关联及 Walkthrough R1 获批；托管/资源/付费能力和真实验收仍待实施确认。
**Detailed contract:** `story-8-1-review-2026-09-07.md`；研究见 `research/story-8-1-mature-implementations-2026-09-07.md`。批准不等于已部署或 Epic 8 完成。
**Visual:** `_bmad-output/implementation-artifacts/visual/story-8-1-observability-walkthrough-r1.png`。

**Acceptance Criteria:**

**Given** 选择经研究、许可及版本兼容核验的成熟观测工具
**When** 接入 Nomad 当前已实现的前后端与 worker 流程
**Then** 授权运营者可在实际工具中检索真实错误和关联调用，覆盖已启用能力而非只初始化 SDK
**And** 不新建通用监控平台，不依赖 8.6 总览才提供排障价值，旧未实现业务不伪装为已有遥测

**Given** 登录、导入、S0-S11、编辑/校验、餐饮/清单及账号/反馈产生已有事件
**When** 标准化事件字典与发送字段
**Then** 每个事件定义真实来源、schema 版本、允许字段、失败/完成语义与去重标识
**And** 移除活跃字典的 HQ 采用、BYOK、打卡、用户额度提示和模糊反馈成功口径，不复制旧事件重复计数

**Given** 请求带有缺失、非法、超长或外部可控 trace/correlation headers
**When** Fastify 建立请求和任务关联
**Then** 使用已验证的标准格式与服务端关联策略，保留必要的兼容 ID 映射，拒绝把任意原文回显或记录
**And** trace 不是鉴权身份，不能借碰撞串读其他 owner，也不能由传入 sampled 标志强制高成本采样

**Given** 一个任务跨请求、队列、重试、worker 重启与 SSE 重连
**When** 记录各阶段 span 和已持久化结果
**Then** 可按稳定 job/attempt/版本关系串联，区分当前与废弃 attempt、原任务与重连请求
**And** 不要求一个无限长 span 跨整个任务，不把重连计为新规划，不允许迟到观测改变业务状态

**Given** 规划、细节或其他已实现 AI 能力调用 Provider
**When** 产生 Langfuse observation
**Then** 保留任务类型、prompt/model/路由配置版本、attempt、实际耗时和可验证的 usage 元数据
**And** 不上传 prompt/response/工具输出原文、完整行程或推理链，不以自动采集全量输入作为可观测性的前提

**Given** HTTP 成功但异步任务失败，或某次 Provider 失败后回退成功
**When** 映射任务/attempt/请求 outcome
**Then** 分别展示真实完成、失败、回退、取消和未知，稳定错误码支持查询
**And** 不以 HTTP 202、SSE 打开、反馈外链打开或单次 attempt 失败代替最终业务结果

**Given** Fastify ESM、React 与 Sentry/Langfuse/OTel 同时启用
**When** 应用/worker 启动或升级 SDK
**Then** 验证受支持的初始化顺序、唯一全局 provider 和显式隔离的 Langfuse provider，并用安全任务/attempt 关系关联查询
**And** 不竞争注册全局上下文、不重复自动拦截 HTTP/模型/数据库调用，不将 Sentry 内部 span 或非 AI span 无差别发给 Langfuse；不假称两端共享同一父子树

**Given** 日志、span、异常、breadcrumb 或事件包含嵌套/编码后的敏感输入
**When** 序列化并发往文件、Sentry、Langfuse 或分析服务
**Then** 通过允许列表、值级过滤及上限检查，只输出必要的安全字段与错误类别
**And** 用户原文、精确位置/路线、POI/酒店、原始链接、鉴权头/凭据、附件或其他 owner 内容不得流出；过滤失败丢弃遥测而不丢弃业务

**Given** 浏览器、HTTP、数据库或 AI SDK 提供自动捕获能力
**When** 配置 instrumentation 与 source maps
**Then** 关闭本期不需要的录屏/Replay、表单/请求体、聊天全文、SQL 参数和 DOM 内容捕获，发布包对应私有 source maps
**And** 浏览器只包含允许公开的 SDK 接入配置，不包含服务端凭据；breadcrumb、URL query 和错误 message 同样经过数据最小化

**Given** 存在采样、未报告 token/cost、缓存命中或导出丢失
**When** 计算耗时、错误、回退和覆盖指标
**Then** 未知值保持未知，估算记录方法/版本，计数区分 attempt 与任务且采样覆盖可核查
**And** 不把无数据当作零成本或零错误，不用采样 trace 充当 8.4 预算账本，不重复发起请求补齐指标
**And** Sentry 不采样的请求不应误抑制隔离的 AI tracing，AI 自身仍有独立有界采样；终态错误诊断与性能采样分开

**Given** 运营者检索错误/trace 或访问对应链接
**When** 执行工具侧鉴权与项目/环境隔离
**Then** 只开放最小实际可用权限，环境与部署版本可分辨，关联查询不附带公开凭据
**And** 普通用户不能通过 correlation id 查询遥测；工具若缺少所需权限能力应记录为部署门禁，不假称免费版具备付费能力

**Given** 新遥测进入实际存储或用户触发既有 7.5 删除
**When** 核对保留策略与执行清理
**Then** 对可关联个人的记录有最小受限映射、明确 TTL 和可验证的删除/匿名化或已批准隔离保留路径
**And** 不将 hash 自动视为匿名，不让迟到 worker/重试复活已删除记录，扩展 7.5 数据清单且不向 7.4 副本塞入内部 traces

**Given** 正常流量、错误风暴或恶意传入采样上下文
**When** 采集和导出遥测
**Then** 有服务端控制的采样、低基数字段、事件/队列/时间上限及丢弃统计
**And** 排障数据不能无限放大 CPU/内存/存储/供应商成本，不把高基数私人标识作为指标标签

**Given** 观测服务断网、限流、鉴权失败或 SDK/exporter 抛错
**When** 用户继续规划、修改或查看已发布行程
**Then** 业务按原合同独立执行，遥测按有界策略降级到安全诊断或丢弃
**And** 不修改 Job/Plan、账本或业务重试预算，不循环发送监控自己的故障，不静默落盘未脱敏 payload

**Given** 进程正常退出、突然中断或观测服务长时间不可用
**When** flush、重启并检查已送出的事件
**Then** 正常退出有界等待，重启保留业务关联；允许声明遥测缺口，不假称全部投递或 exactly-once
**And** SDK 的瞬态缓冲不代替持久任务/安全审计/删除记录，不阻塞 worker lease 或业务退出

**Given** 托管/自托管、区域、保留和付费能力尚未配置或验证
**When** 准备验收实际工具接入
**Then** 明确列出未部署/不可查询部分及资源、连通性、权限和保留门禁
**And** no-op 可用于开发降级但不能算真实接入通过；本 Story 批准不自动授权购买云服务或把全套自托管栈装到小主机

**Given** 新观测机制在用户页面或后台启用
**When** 发生采集、查询或诊断
**Then** 用户侧不新增额度/模型/追踪面板、不改变 S0-S11 与现有错误恢复动作
**And** 不实现评测门禁、Provider 管理、集中预算、Telegram、8.6 总览、XHS 搜索或用户隐私内容回放

**Given** Story 进入用户评审和实现验收
**When** 展示错误定位到 AI 调用的过程
**Then** 优先使用成熟工具实际去敏界面或清楚标注的交互示意，说明如何关联及哪些内容不采集
**And** 示意不冒充部署截图；本期不重绘第三方产品作为 Nomad 新后台，实际检索/无数据/权限/失联仍需验证

**Given** 本 Story 准备交付
**When** 运行版本矩阵、ESM 初始化、并发 owner、恶意 header、敏感嵌套值、脱敏失败、跨队列/重连、采样、关闭和删除竞态测试
**Then** 唯一全局注册、隔离的 AI provider、关联字段和过滤后的出口与实际工具中的 trace/error 对应，SDK 不重复记录、不泄露私密内容
**And** 更新确实变化的 OpenAPI/生成类型，focused tests 与 workspace build 通过，未实测项明确留为门禁

**Given** 选定环境已获部署和数据传输授权
**When** 使用合成/获准脱敏样本执行成功、终态失败、回退成功和观测服务不可用场景
**Then** 记录真实查询、延迟/覆盖/开销及清理证据，更新旧 analytics 字典、观测架构、运行说明与 BMAD 镜像
**And** Github/官方调研结论有日期和兼容版本，不能以 SDK 安装、网页截图、mock trace 或缺凭据的跳过代替真实验收

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C19 — App：JS 与原生故障可定位

**Given** 候选 App 使用已锁定且经过兼容验证的 Sentry/原生 SDK 组合
**When** 在获准测试环境产生可控 JS 错误、原生崩溃和网络/恢复失败
**Then** 实际工具可检索对应 platform、app version/build、Web bundle 与安全业务关联，适用 sourcemap/dSYM/混淆映射能帮助定位
**And** JS/native 不重复计同一故障，不采集完整请求、凭据、行程或位置；不影响原服务端唯一全局 provider 与隔离 Langfuse 规则

#### C20 — App：原生统计与网页分母

**Given** 1.0/1.6 已提供真实首次消费证据，网页、Android 与 iOS 使用各自实际可用的统计路径
**When** 汇总登录、输入、规划和恢复漏斗及不同版本表现
**Then** 按 platform/host、版本、窗口与有效样本分别核对 U-App 事件/归因及 SDK 回执，区分采样/缺失/失败并消除桥接双计数
**And** 不把 App 接通当作纯网页统计已接通，不以 Sentry/Langfuse 静默替换友盟责任，不平均不同分母的 P95，也不绕过采集拒绝/撤回

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 8.2: 可复现的质量回归与版本对比

As a Nomad 开发者与运营者，
I want 用同一套版本化样本比较提示词、模型或编排代码，并在轻量工作区人工评分与试验，
So that 我能结合具体规则、逐例差异和人工判断决定如何迭代，而不是只看平均分或统一一票否决。

**Requirements:** FR13（promptfoo A/B、Langfuse 样本/人工评分/实验工作区）、FR33（规划质量与回退事实）；
FR7/FR9/FR10/FR23/FR28/FR30-FR32.3/FR34/FR35/FR35.1/FR36/FR36.2/FR39/FR50（消费既有域规则，不重做其业务）；
NFR3-NFR7、NFR9-NFR12、NFR17、NFR20-NFR23；AR1-AR8、AR11-AR15、AR18-AR20；
UX-DR31（额度不向用户暴露）、UX-DR33（报告示意与实际证据分开）。

**Approved:** 2026-09-08。24 条 GWT、逐规则评测策略、线上样本去直接标识、Langfuse 人工评估/实验工作区与 promptfoo 执行分工，以及 Human Workspace R2 获批。部署、套餐、数据外发和真实验收须另行核验。
**Detailed contract:** `story-8-2-review-2026-09-07.md`；范围见 `evaluation-operator-scope-decision-2026-09-07.md`；研究见 `research/story-8-2-langfuse-operator-addendum-2026-09-07.md`。批准不等于已实施或 Epic 8 完成。
**Visual:** `_bmad-output/implementation-artifacts/visual/story-8-2-evaluation-human-workspace-r2.png`。

**Acceptance Criteria:**

**Given** 使用受版本管理的 WSL Node/pnpm 环境和已审核评测配置
**When** 执行确定性评测命令
**Then** 实际运行 fixture/adapter/assertions 并生成 JSON 和可读结果，不再使用 echo/no-op 门禁
**And** 无模型凭据或 Langfuse 服务时仍可完成确定性路径，不依赖 8.3/8.4/8.6

**Given** 整理当前已交付能力及其关键回归
**When** 生成小型分组样本集
**Then** 覆盖导入/地理证据、required/顺路、节奏、住宿/行李/交通与一日游边界、编辑校验及填充/用户措辞，记录所属需求与预期结果
**And** 复用现有规则/fixture 而不重写 Planner；旧 HQ/15 分钟用户调时等只留兼容测试，不充当当前目标；必需分支未覆盖不得报通过

**Given** 样本来自合成、测试、获准案例或授权范围内线上数据
**When** 运营选择样本或配置有界抽样，并将评测副本保存/发送给模型、judge 或 Langfuse
**Then** 在发送前筛查直接关联个人的姓名、证件、个人联系方式与账号标识，记录来源/范围、处理版本与结果；疑似残留转复核，不能静默放行
**And** 不因间接推测风险删除酒店 POI、日期、路线、时间、偏好等旅行上下文；区分人名与地点名、个人与公开商家联系方式，不宣称不可再识别匿名化
**And** key/Cookie/token/私有签名按独立凭据规则排除；不用原始 owner ID 作云端样本键，不将线上副本写入公共 Git/CI，默认不复制原始媒体
**And** 采用独立评测数据入口而非放宽 8.1 全量生产追踪；输出和人工评语也检查直接标识，处理失败只阻止该样本外发，不影响用户行程

**Given** 开始一轮评测或复核历史结果
**When** 固定执行输入
**Then** 记录 run/attempt、基准、case IDs、dataset/schema/prompt/code/lockfile/评分器哈希、模型参数、去标识/规则/rubric 版本与运行模式
**And** 将 Langfuse label 解析成具体 prompt 版本，数据集导入/编辑形成新快照，不用浮动 latest 或仅靠名称复现；参考答案更新不追改旧结果

**Given** 对比基准与候选模型、提示或代码
**When** 计算差异
**Then** 对齐样本、schema、外部事实快照、时钟/时区和评分规则，明确本次受控变化
**And** 不兼容基准标记比较无效；过滤/减少用例不能静默改变分母或让失败消失
**And** 期望 case/variant/repeat 单元集合固定且逐键核对，不能误运行整个笛卡尔积扩大费用，也不能仅按总数判断样本相同

**Given** 使用固定输出、模型缓存或实际新请求
**When** 形成结果与性能/成本统计
**Then** 分别记录 replay/cache/live 模式及缓存身份，评分器变化重新评分，模型/prompt/输入不匹配不能复用旧输出
**And** replay 不证明新模型已运行，缓存耗时不冒充推理时延，实时 A/B 不混用一边热缓存和一边新调用

**Given** 模型/adapter 输出可解析但可能违反业务约束
**When** 评估 schema、POI/证据、预约/交通/住宿、填充不改排期或用户措辞等规则
**Then** 每条规则具有 rule ID、适用条件、权重/容差、缺失值行为、处理方式及策略版本，可配置为计分、提醒或人工复核
**And** 不根据旧 hard 标签统一否决；确需阻断的个别规则另行明确批准后配置，不预设“任何硬失败必不通过”
**And** 正确返回未解决 required/自由时间/unknown 按对应场景预期判定，不要求塞满；不匹配规则记不适用而非失败
**And** 这是离线评价策略，不放宽已批准的运行时 Planner/Validator、权限/版本或普通代码测试合同

**Given** 各项规则已执行且结果具备有效分数
**When** 比较质量指标
**Then** 展示逐规则/逐样本差异、适用分母、权重、规则处理方式和待人工项，再按版本化策略汇总
**And** 综合分允许按规则加权，但不隐藏反例；策略变更产生新评价版本，不反向擦掉旧分数/证据
**And** 样本不足、缺失或非有限分数标为证据不足，不自动评价模型更好/更差
**And** 总体结论按 manifest 全量结果/API 分页计算，不把 Langfuse 当前页过滤/聚合冒充全部样本

**Given** 某些表达/推荐质量需要模型 judge
**When** 显式启用语义评分
**Then** 固定 rubric/judge 版本、尺度与参数，先用人工标注小样本核对，并记录重复运行差异和异常
**And** 分开保存 code/model/human 来源，分歧按对应策略提醒或交人工判断，任何来源不静默覆盖其他分数
**And** 不只凭模型自评证明正确；被评内容是数据而非执行指令，保存简短证据/原因而非推理链

**Given** 用例可能完成、有规则发现、待人工、执行错误或尚未运行
**When** 汇总 run
**Then** 独立记录执行状态、自动评价、人工进度、最终评价和同步状态，展示计划/已执行/已评分数量及每项原因
**And** 缺样本、重复 case、评分器异常、无效配置/JSON 或中断不得被当成有效通过；基础设施失败不冒充模型质量差

**Given** CI 已声明本次必须运行的评测范围
**When** 解析 runner 退出码和结构化结果
**Then** 独立核对精确结果集合和执行有效性，再应用本次已批准的逐规则策略；计分/提醒不会被 CLI 默认 hard fail 升格为统一否决
**And** 若必需人工复核未完成则报告待复核；若范围仅含自动检查则如实报告自动部分，不声称人工已完成
**And** 明确区分 runner 的断言退出与配置/进程/超时错误；后者不能用 continue-on-error 或改分母冒充有效评测，工具默认退出码不是唯一结论

**Given** PR 可修改配置、JS provider、断言或 workflow
**When** 自动运行确定性评测
**Then** 在无模型/云凭据的隔离环境执行，评测网络/遥测关闭，最小 token 权限和固定依赖/可信门禁规则生效
**And** 不在有特权的 pull_request_target/workflow_run 中执行未审查 PR 配置；报告数据不作为脚本执行，不与可信付费任务共用可污染缓存

**Given** 维护者已批准受限真实模型实验和数据范围
**When** 调用基准、候选及可选 judge
**Then** 使用已审核版本/配置与服务端凭据，事先限定 case、并发、token、时间、重试和费用，不自动尝试其他模型
**And** 运行权限不会从普通 PR 推导；未授权/缺凭据标记未运行，普通 CI 不受可选 lane 未运行影响，但不能据此满足必需真实模型验收
**And** 无法确定可靠调用成本上界时不启动新的付费请求，不将响应后的 cost assertion 当作调用前预算保护

**Given** Provider 返回 usage、不返回 usage 或存在重试/judge
**When** 记录实验消耗与重复结果
**Then** 区分候选、基准、judge、重试的实际/估算/未知值和定价版本，展示重复实验波动
**And** 未知不算零，不把一次运行/固定 seed 作为云模型逐字确定性的保证，不新增用户额度 UI 或集中计费引擎

**Given** 实验取消、超时、断网或 Provider/评分器出错
**When** 保存已有证据或显式重试
**Then** 保留原 run/attempt 状态与完成子集，新 attempt 关联原快照，是否复用结果明确记录
**And** 不盲目重跑成功的付费用例，不清除失败历史，不将配置已变的结果拼进旧 run；重试预算耗尽保留未完成/错误结论

**Given** 一轮实验完成或中断
**When** 打开或归档 JSON/HTML 等可读报告
**Then** 可查看版本、范围、模式、逐项原因/差异、规则策略、人工评价、成本未知与检查和，并保留明确访问/保留策略；Nomad报告摘要保留实际执行、待人工/同步和费用类别的短标签，长定义、样本/评分口径及依据可从 `查看来源` 或原详情展开，不隐藏影响结论的执行错误、未完成或关键未知
**And** 不默认公开分享，不将真实私人输入输出写进公共 CI 评论/日志；HTML 转义不可信内容，报告缺失或到期不能当作通过证据
**And** 线上样本、结果及评语加入 7.5 清理注册；受限来源映射支持定位评测副本，删除留无内容墓碑/失效说明，不能把报告摘要当作原始证据仍存在

**Given** 有已批准数据目标和已去直接标识的样本/结果
**When** 将 promptfoo/现有 Nomad runner 证据同步到受限 Langfuse 评测项目
**Then** 关联 dataset item、run/attempt、variant/repeat、prompt 与规则版本，支持查看必要输入输出、自动分数和并排差异，不再仅上传统计摘要
**And** 用稳定同步键做幂等映射，同步重试不得重跑模型或重复样本/分数；允许最终一致，Nomad对应结果模块用 `结果待同步` 或真实 `同步失败` 短状态，原因按需展开，不扩大成整轮结果丢失；不能把未同步项当成空结果或隐藏已知失败
**And** 使用隔离评测导出而非改变生产 tracing；Langfuse 不可用保留本地自动证据与待同步状态，不伪造人工完成或改写本地自动结论

**Given** 运营者被授权访问已处理样本和实验结果
**When** 进入 Langfuse 对比或人工评估入口
**Then** 可用版本化 rubric 录入数值、分类或布尔评分及简短评语，查看对应输入/输出和规则发现
**And** 必需人工项进入可筛选待办，已评分与未评分有事实进度；复用 annotation queue 或所选部署实际支持的过滤/逐项标注，不另造标注系统
**And** 标注绑定样本、结果版本、评分人/时间/量表；评论用于说明，不自动变成分数、用户反馈、黄金答案或生产指令
**And** rubric 的定义/hash 随评价冻结；不能仅用可编辑 Score Config 的 ID 证明量表不变
**And** 评语仅引用已处理上下文；误写直接身份信息有检查/清理路径，不声称 tracing mask 自动覆盖原生 UI 评论

**Given** 人工评价与自动规则或模型 judge 有分歧
**When** 运营复核并形成结论，或修改既有评分
**Then** 按对应规则记录接受/需调整/暂不能判断及理由，保留原自动事实；已回收/封存的评分保留旧快照，后续改分形成新评价，不重写已封存报告
**And** 同步人工评分并生成新评价快照不再次调用模型；rubric/样本变更不混算到原轮次，不承诺依赖付费审计功能才有基本修订记录
**And** 人工复核、跳过和结论需有实际记录，平台失联或未评不能默认为通过；复核不直接发布生产配置

**Given** 运营想比较新提示或模型
**When** 在现有 Langfuse prompt/Playground 界面配置实验或从受限 CI 入口启动完整回归
**Then** 可以选择具体提示版本、允许的模型与参数、样本快照和评分策略，试跑结果可关联原版本并继续人工评分
**And** 单 prompt Playground/UI experiment 仅作为探索；完整 Nomad 多步骤回归经审核 runner 执行，二者模式分开，不冒充等价覆盖
**And** 所有付费入口受 AC13 的事前授权及限额控制，服务端密钥不返回浏览器；未配置连接时禁用真实调用并保留可读说明
**And** 不提供“改 Langfuse production label 即上线”的旁路；本 Story 只形成待评估版本，线上发布/回滚留给 8.3

**Given** 运营使用现有登录授权的工具
**When** 打开评测、样本、评分和实验配置
**Then** 直接进入 Langfuse 对应项目/页面，完整回归复用已授权私有 CI 的固定任务入口，不要求先建 8.6 后台
**And** 最小操作链为选样本/版本、启动授权比较、查看逐例结果、人工评分、保存结论；不得交付只读截图或要求用数据库手改
**And** 访问被拒、无样本、待评分、同步失败、无 Provider/未授权调用分别有真实状态与恢复路径；不得公开项目或在 URL 中夹带密钥
**And** 验收所选服务版本/套餐的实际权限，不把专业审计/细粒度 RBAC/SSO 宣称免费标配；8.6 仅聚合已有入口
**And** 普通 Member 可能同时能改提示/数据集和试跑，不当作只评分角色；本期先供可信运营者，评测和生产访问实际隔离，不只区分 tag

**Given** 评测通过、失败或报告被查看
**When** 后续操作发生
**Then** 只形成评测证据，不自动修改 Provider 路由、预算、Plan/Trip、用户数据或发布基准
**And** 不实现 8.3-8.6 的生产治理能力、不发 Telegram、不引入另一评测 SaaS/公开后台，不因测试而触发真实导入/预订或 XHS 搜索

**Given** 开发者或运营者检查基准/候选与异常报告
**When** 展示总体和逐项结论
**Then** 明确区分规则提醒、人工待评/结论、实际配置的单项阻断和执行未完成；汇总不掩盖各项事实，操作语义是评估而非上线
**And** 复用成熟工具，提示层级调整只约束Nomad自有报告/摘要和已有可配置呈现，不要求重绘或改造Langfuse/Sentry内部UI；必要示意明确标注合成数据/非厂商实际截图/非重复后台，不让图片数字冒充项目实测结果

**Given** 本 Story 准备交付
**When** 注入直接标识/名称误报、不同规则策略、评分 NaN/缺项/重复、缓存错配、无权限/中断、未知成本、同步失败与人工改分
**Then** 验证执行完整性、逐规则策略不被统一否决、数据处理不清除间接信息，以及真实去标识样本入选/结果同步/人工评分/评价修订链
**And** 确定性路径可独立运行；授权真实小样本与人工链有独立证据，不重复推理；工具故障不改变生产状态
**And** focused tests、工具链/构建及文档同步通过；SDK/配置/mock/echo 不算已交付，实际部署/权限和未测分支仍须明确核验

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 8.3: 任务级 Provider 路由与安全切换

As a Nomad 运营者，
I want 按任务调整服务端模型和备用顺序，在检查后发布，并能查看生效情况与安全回滚，
So that 我能持续迭代模型和处理提供商异常，而不打断既有任务或改变用户行程。

**Requirements:** FR14（Provider 集成）、FR33（任务控制/回退）、FR38（平台保护与运营配置）；
FR13（消费 8.1 观测/8.2 评价，不重建）、FR7/FR10/FR22/FR32（保留既有编排/校验/填充合同）；
NFR1-NFR7、NFR9-NFR12、NFR17、NFR20-NFR23；AR1-AR8、AR11-AR15、AR17-AR20；
UX-DR3（可访问操作）、UX-DR31（用户不见模型/额度）、UX-DR33（原型与真实证据区分）。

**Approved:** 2026-09-08。24 条 GWT、既有 Node 适配器与 PostgreSQL 单一路由权威、小型受限配置页，以及 Route Config Release/Recovery Rollback R1 获批。Unleash 保留普通开关，不新增独立 AI 网关作为前置；批准不等于已部署。
**Detailed contract:** `story-8-3-review-2026-09-08.md`；研究见 `research/story-8-3-mature-implementations-2026-09-08.md`。部署、权限、传播窗口和真实连接验收仍待实施。
**Visuals:** `_bmad-output/implementation-artifacts/visual/story-8-3-route-config-release-r1.png`、`_bmad-output/implementation-artifacts/visual/story-8-3-route-recovery-rollback-r1.png`。

**Acceptance Criteria:**

**Given** 此前业务 Story 已交付可用 AI 调用与最低保护
**When** 接入任务级路由配置
**Then** 盘点并覆盖所有当前适用调用点，经同一受控路由解析与适配器执行，不留环境变量直连旁路
**And** 未交付任务/不支持的模态不显示为可用；不实现其业务，保留一个 PlanningJob 和用户现有入口

**Given** 操作者具备服务器明确授予的环境级运营权限
**When** 打开路由列表、编辑或发布接口
**Then** 可实际查看/修改已注册任务配置，服务端分别校验读/写/发布权限及会话，普通用户不可访问
**And** 复用既有身份和最小运营授权，不相信客户端角色/header，不等待 8.6；同一可信管理员可自审，不强制新增多人审批系统

**Given** 选择主用/备用模型连接
**When** 服务器解析 connection/model/adapter 与 prompt/output schema 版本
**Then** 校验对应任务的文本/图片/音频、工具调用、结构化输出、上下文和参数能力；每条备用也须满足合同
**And** OpenAI-compatible 名称本身不是兼容证明；无支持、未验证或已停用连接不能成为可发布目标，不能靠丢图片/字段/工具降级冒充兼容

**Given** 编辑任务的主用、备用顺序及允许参数
**When** 校验配置
**Then** 使用版本化 schema 校验唯一连接顺序、模型参数、总时限、单次时限和总尝试上限，拒绝未知字段、循环/重复回退及超出既有保护的值
**And** 明确重试包含首次请求/备用请求的计算口径，不用不同层默认值叠乘；所有数量/时长由已批准策略给出，原型数字不成为默认限制

**Given** 操作者查看/编辑/检查已注册连接
**When** 传输配置或发起请求
**Then** 仅使用服务端注册的 adapter/endpoint/secret 引用，不返回 secret 值，也不允许配置任意 URL、headers、脚本或覆盖鉴权
**And** 出站目的地/重定向/私网和日志字段有明确约束；换供应商的数据外发范围须已获准，未注册连接由受控部署流程接入，不靠 UI 绕过

**Given** 当前发布策略为 Rn
**When** 创建、保存、离开或重新打开任务配置草稿
**Then** 持久保留草稿及基准版本，显示未发布改动；当前调用策略和已接受任务不变
**And** 草稿修改形成可校验版本/哈希，旧检查结果失效；切换环境不将测试草稿静默应用到生产

**Given** 草稿已保存且基准仍有效
**When** 点击检查
**Then** 无付费调用地检查结构、已注册能力/引用、secret 可解析性和本地策略一致性，用局部短状态显示检查范围与未验证项；长校验定义和证据说明从 `查看来源` 或原检查详情展开，阻止发布的具体问题仍在操作前可读
**And** 静态通过不等于连接/模型质量已实测；新增连接首次发布需已有有效能力证据，主动探测另有明确授权、合成输入和调用预算，不能因浏览/保存自动付费

**Given** 候选配置关联 Story 8.2 评价
**When** 检查或确认生产发布
**Then** 展示具体样本/模型/prompt/规则/评价版本及适用范围，运营可查看分歧与处理理由；不把不匹配的报告算作当前配置证据
**And** 评价按 8.2 逐规则政策解释，不恢复任一硬失败统一否决；配置/权限/运行时安全校验独立，Langfuse label 或分数变化不能触发自动上线

**Given** 草稿/检查结果有效且操作者有目标环境发布权限
**When** 预览改动并确认发布
**Then** 明确显示环境、任务、主用/备用差异、适用 prompt 版本和影响范围；以 expected current revision 原子创建新策略及切换有效指针
**And** 其他任务配置不变；并发发布冲突需重新检查/确认，不覆盖对方；发布指针、配置内容和审计记录不可部分成功

**Given** 发布/暂停/恢复/回滚请求重复或返回结果未知
**When** 查询或重试同一操作
**Then** 使用持久 operation ID 恢复既有回执及实际状态，避免生成重复版本或反转已生效命令
**And** 断网不显示成功或失败定论；原草稿/请求引用保留，配置读取失败不清空当前已知内容

**Given** 新任务被服务器接受或旧任务从队列/重启恢复
**When** 确定其调用配置
**Then** 在接受时持久绑定已发布策略、具体 prompt/模型参数和 adapter 身份；已接收但尚在排队的任务也保留该快照
**And** 普通发布仅影响此后接受的新任务；同一任务后续阶段/重试不能重新读取 floating latest 偷换模型，显式创建的新用户任务才重新取配置
**And** 新任务接受须读取权威有效指针；权威状态未知时不以陈旧缓存悄悄接受新的付费任务，保留原输入与真实恢复路径

**Given** 新版本已发布但实例可能尚未加载或暂无新任务
**When** 查看生效情况或执行已绑定任务
**Then** 区分发布回执、已加载/未加载和实际调用使用的版本，在相应版本旁用 `等待使用`、`尚未加载` 或真实未知短标签，具体传播/使用证据按需展开；不把一次写入说成全实例已生效，也不隐藏关键未知
**And** worker 必须取得并验证任务要求的精确快照再执行；缺失时等待/有界恢复，不擅自执行另一版本；失联实例不能被计为已同步
**And** 旧模型/prompt/config 内容保留至引用任务结束，绑定具体内容而非可变 alias；若凭据被撤销则按暂停/不可用流程处理，不使用新 alias 偷换目标

**Given** 主用调用失败且预算/期限允许继续
**When** 路由器处理稳定错误类
**Then** 按已配置、去重且兼容的顺序重试/回退，记录每次实际尝试；限流 Retry-After、网络/5xx、鉴权/计费异常有不同策略
**And** 参数/输入错误、业务约束拒绝或安全拒绝不能通过换模型绕过；401/计费异常不盲重试原连接，备用仍须有权限及预算
**And** 只有当前 fenced attempt 可继续/发布，所有路线不可用时由已有业务流程降级/失败，不另建用户结果

**Given** 模型流式断开、输出不完整或 schema/业务校验未通过
**When** 决定丢弃或执行允许的恢复尝试
**Then** 不拼接两家模型的半段结果，不把原始 token/工具文本当作已完成行程；可重试的输出错误受同一总上限约束
**And** 工具副作用沿用业务幂等/持久结果，不重做已提交操作；输出始终经过既有 Validator/填充保护，用户只见真实 job 阶段

**Given** 发布的新路线比旧路线昂贵，或 SDK/网关自身具有重试/冷却功能
**When** 每次调用准备发出
**Then** 重新适用已有预算/并发/token/总期限保护，统一计算所有层的实际尝试与消耗；无法获得足够保护不能发出新的付费请求
**And** 同一边界只设一个有效重试/回退控制者，保留现有熔断的跨进程语义，不以改配置/重启清零次数；8.4 才扩展集中治理

**Given** 配置源/缓存故障或进程首次启动
**When** 读取已发布策略
**Then** 只使用来源、环境、版本和有效性已验证的 last-known-good/任务快照；没有可信配置则该能力不可调用，不随意退到环境变量模型
**And** 控制源失联时禁止发布并显示陈旧状态；既有任务只有在暂停/预算等安全授权仍有效时继续，失效则停止新外部调用而保留任务/行程

**Given** 运营发现某个连接或任务不宜继续发起请求
**When** 明确确认暂停新调用
**Then** 持久记录独立暂停状态/范围及递增控制版本，每次尚未发出的主用/重试/备用调用都须通过该检查
**And** 不把普通换模型解释为暂停；已发出请求不承诺撤回/不计费，响应按原安全合同处理，不因此自动重跑或撤销用户任务
**And** 控制信息采用有界有效期并实测传播窗口，过期/无法确认时阻止新外发，不承诺网络分区下瞬时全球停用

**Given** 连接/任务因运营暂停或实际熔断而不可用
**When** 运营恢复已暂停范围
**Then** 按预期控制版本检查能力/凭据与现有预算，确认后解除人工暂停；实际故障熔断按自身恢复证据处理，不能被 UI 无条件清空
**And** 解除暂停不自动重跑已结束任务，不解除其他范围限制，普通发布/回滚也不隐式解除暂停

**Given** 运营选择历史已发布版本作为恢复目标
**When** 查看差异并确认回滚
**Then** 按当前连接可用性、能力/权限及保护重新校验，基于当前指针创建新的递增版本并标记来源，而非删除历史或直接把版本号倒退
**And** 原 secret 已失效/连接已停用时不能回到该危险配置；只影响后续新任务，不改变既有 Plan/Trip/任务快照，也不解除暂停

**Given** 查看配置、检查、发布、暂停、恢复或回滚产生实际动作
**When** 写入操作记录并关联 8.1 观测
**Then** 保留实际操作者、环境/任务、时间、操作 ID、前后版本、脱敏差异及结果；每次 Provider attempt 可关联对应发布版本/稳定错误类
**And** 不记录密钥、用户完整输入输出或高基数内容指标；未知 usage/传播状态不记零，观测失联不反转已持久操作；不依赖企业审计面板才有基本记录

**Given** 操作者进入列表、草稿、检查结果或发布/回滚确认
**When** 数据加载、为空、检查失败、权限不足、版本冲突或操作进行中
**Then** 有明确非颜色状态、具体不可用原因、保留输入和返回/重试路径，按钮不重复提交；键盘、焦点恢复和 reduced motion 可用
**And** 生产环境和影响范围在确认处始终可见；用户旅行 Settings 无模型/额度/运营入口，原型数据不充当真实配置

**Given** 本 Story 从旧环境变量/布尔开关迁移到受控配置
**When** 初始化默认已注册连接与策略并切换调用路径
**Then** 有可审查的一次性映射、空配置/失败回退及兼容部署说明，不把密钥迁入明文表；已开始任务可按原有效快照完成
**And** 只创建本 Story 必需的配置/操作记录/权限及接口，OpenAPI 与生成类型先行，不增加新框架/独立通用后台或未来预算实体
**And** 现有普通 Unleash 开关只能沿已批准用途收紧能力，不能另给模型路线或覆盖 PG 发布/暂停状态；迁移不遗留双写权威

**Given** 运营完成模型配置变更
**When** 系统继续提供用户服务
**Then** 不重排已有行程、不更换城市范围、不改用户偏好、冻结事实或内容，不恢复 BYOK/Quick-HQ 选择
**And** 不管理高德/航班/天气/XHS 账号，不实现 XHS 搜索、自动模型择优、生产流量 A/B、预算中心、Telegram 或总览；不把网关安装等同这些需求已完成

**Given** 本 Story 准备交付
**When** 使用当前项目工具链和已授权 staging 验证
**Then** 真实覆盖主用/备用、schema/多模态能力不符、发布冲突/未知回执、排队/在途/重启快照、停用/恢复、失联/陈旧控制、无可信配置、回滚与实际版本查询
**And** 验证有限重试/流式半包/幂等工具、隐藏额外尝试、成本未知及无权访问；真实 PostgreSQL、合成/获准小样本 Provider、UI 截图和项目测试/构建均有证据
**And** 静态检查、mock/SDK 初始化、供应商网页和原型不证明路线可用；未实测能力/部署/许可明确保留为交付门禁

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 8.4: 平台预算与用量策略管理

As a Nomad 运营者，
I want 在受限运营页调整平台请求、并发和成本策略，并核对每次调用的预留、消耗与待核对费用，
So that 多个任务和实例能共用可信的用量边界，失败重试不会重复扣用户次数，也不会把未知费用当成免费。

**Requirements:** FR38（用户/设备/workspace 请求、并发、导出和成本策略）、FR33（受控恢复）；
FR14（复用现有 AI/AMap 等已交付适配器）、FR13（消费 8.1 安全关联）；
FR25（可用操作）、FR12/FR18.1（复用账号清理与共享引用隔离）；NFR3/4/6/7/17/20；
AR1-AR6、AR11-AR15、AR17-AR20；UX-DR3、UX-DR31、UX-DR33。
FR38.1 仅提供后续告警所需的稳定限制/终态事实，本 Story 不实现 Telegram。

**运营端范围（用户明确，2026-09-13）：** 运营者直接使用桌面 Web 管理；运营页无需
移动端适配，不将手机断点、触控交互或移动端截图列为其验收要求。保留桌面浏览器、
鼠标/键盘、焦点与可读性验证。旅行者现有移动业务流程及不展示额度的规则保持独立。
该范围与金额来源补充随 Story 8.4 于 2026-09-13 获批。

**Approved:** 2026-09-13。修订后的26条GWT、现有Node/PG预算权威、桌面Web运营与金额来源补充获批；两张R1保留为批准的基础行为示意，资费登记/来源明细等未绘出状态按文字合同在实施时补证。批准不等于部署或运行验收。
**Detailed contract:** `story-8-4-review-2026-09-13.md`；金额来源见 `research/story-8-4-amount-sources-2026-09-13.md`；成熟研究见 `research/story-8-4-mature-implementations-2026-09-13.md`。
**Visuals:** Budget Policy Usage R1 / Budget Recovery R1，位于 `_bmad-output/implementation-artifacts/visual/`。全部金额和次数为合成示例，不是生产阈值。

**Acceptance Criteria:**

**Given** 之前业务 Story 已有可用的调用器及最低保护
**When** 接入集中策略
**Then** 盘点 AI、AMap、导出和其他当前适用调用点及运营实验/探测，登记实际计量维度与调用入口
**And** 接入覆盖所有实际外发路径，不留 SDK/worker/环境变量旁路；尚未交付能力不显示已支持，不依赖 8.5/8.6

**Given** 操作者或业务调用请求读取/修改策略
**When** 服务端确定环境、workspace、owner、设备及 Provider 账户范围
**Then** 从真实会话及服务端注册关系校验读/写/发布/对账权限，普通用户不能访问内部额度接口
**And** 不信任客户端角色、owner/workspace 或任意设备 header，不新增隐蔽设备指纹；缺少可用范围时按已批准降级保护而非绕过总额

**Given** 编辑已注册能力的请求、并发、产品次数和成本规则
**When** 保存或检查草稿
**Then** 验证整数/金额精度、正值或明确禁用语义、币种、时区、窗口、作用域、TTL/超时与已批准安全范围，拒绝未知字段和含糊无限制
**And** 区分速率与产品次数、任务与 attempt 并发；阈值必须经过容量/供应商套餐验证，示例和旧变量不是生产默认值

**Given** 当前预算版本为 Bn
**When** 创建、保存、离开、重开或修改草稿
**Then** 保留基准版本与内容哈希，保存不影响当前策略；修改使旧检查结果失效
**And** 检查只读结构、已注册计量和计价证据/权限，不因浏览或保存自动调用付费服务；未验证项明确显示

**Given** 草稿有效且操作者有目标环境发布权限
**When** 查看差异并确认发布
**Then** 展示环境、范围、新旧限额、窗口及当前已确认/估算/预留/未知占用，说明哪些新调用可能停止
**And** 以预期当前版本原子保存新预算、有效指针与审计回执；并发冲突重新核对，不覆盖他人，不改 8.3 路由/用户行程
**And** 明确限额由运营者设定；预览占用带时间，发布后重新读取当前账本计算可新预留量，不将预览数值、上游余额或示例数值作为新消费事实

**Given** 发布/回滚/对账提交重复或返回未知
**When** 查询或重试原操作
**Then** 使用持久 operation ID 与载荷一致性检查恢复同一回执；未知状态不直接显示成功/失败或重建操作
**And** 恢复历史配置需按当前权限/计价/保护重新检查并创建新版本，不回拨账本、不清空计数、不解除 8.3 暂停或真实熔断

**Given** 同一 owner 的同一逻辑任务或 exact-revision 导出请求被接受
**When** 创建 Job 与产品次数名额
**Then** 在同一持久接受边界绑定幂等身份、次数规则版本和窗口；重复请求返回既有 Job，不多扣、不产生无 Job 的孤立扣减
**And** 内部子任务、备用、重试、SSE 重连、同一导出下载/分享/整趟合成不重复计次；新用户操作是否新名额按原 Story 的业务幂等定义决定

**Given** Job 失败、取消或只取得部分可用结果
**When** 应用任务接受时的版本化完成/返还规则
**Then** 每类任务明确 success/partial/platform-failure/user-cancel 的处理；平台责任的失败不重复消耗产品次数，返还最多一次
**And** 返还不删实际 Provider 请求/费用；不能通过篡改失败原因或不断更换幂等 ID 绕过请求、并发及平台成本保护

**Given** 即将执行具体模型/模态/API 的一次请求
**When** 计算预留
**Then** 使用可追溯计价版本和可强制执行的输入、输出、图片、音频时长、工具收费与尝试上限覆盖可能收费项；参数与已绑定路线相容
**And** 仅平均值/p95 不是上界；缺价、未知收费项、失效计价或无可约束上界时停止该新付费请求，保留已有安全降级
**And** 不为凑预算偷改已固定的模型/prompt/输出参数或省略模态，恢复只使用已批准兼容路径
**And** 资费由已核验的实际收费方价目/合同或其受支持接口登记为不可变版本，含币种、单位、模型/模态/阶梯、来源与生效时间；转售连接不能套用模型原厂价，改预算不自动改资费

**Given** 不同 Provider/API 有不同币种、免费套餐、缓存价或按量阶梯
**When** 决定可用成本与请求额度
**Then** 保留原始计量单位、原币及显式换算/舍入版本，只在可核实共享余额/计费范围时采用优惠或免费额度
**And** 不把未知当免费，不把费用币种直接相加；AMap 的共享账号/Key/API 分组/QPS/计量窗口来自当前官方与实际合同核验，不固化历史日配额

**Given** 多个实例同时申请平台/workspace/任务/用户/Provider 的适用资源
**When** 请求一次预留
**Then** 在单一权威事务中按稳定顺序锁定/原子核验各范围，所有适用范围均满足已用加占用加本次上界不超过限额才成功
**And** 唯一 attempt/操作标识防重；失败全部回滚，空窗口创建也受唯一约束；只重试数据库事务，不在事务重试中再次调用 Provider

**Given** 任务已接受或持有尚未使用的预留
**When** worker 准备主用、备用、重试或工具引发的外部调用
**Then** 核对当前 fenced attempt、任务/账号资格、8.3 暂停、当前预算/窗口及有界派发许可；原子记录发送意图后才外发
**And** 陈旧 worker/过期许可不能派发；不在数据库事务中等待网络，不承诺事务与供应商接收 exactly-once；提交结果未知先恢复原记录

**Given** 允许一次恢复尝试或存在合法缓存
**When** 决定是否重新外发
**Then** 每个实际请求有独立 attempt 计量并共享总期限/尝试预算；原请求未知占用未被覆盖，新请求另取足额预留
**And** 禁止隐藏 SDK 叠加重试；本地缓存复用不生成虚假 Provider 次数，Provider 缓存折扣按真实计费证据结算；缓存不绕过 owner/新鲜度

**Given** 等待中的任务与多个执行实例竞争并发
**When** 取得、续期、释放或恢复许可
**Then** 任务/外发槽分别计量，排队不占外发槽；许可持久且带 fencing，重启不清零，队列有上限、公平顺序/防饥饿与真实超时路径
**And** 仅未外发许可可安全到期回收；可能仍在上游执行的请求占用并发直至确认结束或按有证据的上游期限处理，不能靠 worker TTL 放行无限重复请求

**Given** 收到成功、失败或迟到响应的可信计量证据
**When** 结算该 attempt
**Then** 一次替换其预留为实际费用/用量并释放差额，重复结果不重复扣；保存来源、单位、计价版本和对应原窗口
**And** 真实 token/时长乘价目仍标为暂估费用；只有可信金额回执/账单核对后才标已确认，费用待核对不妨碍按原业务合同处理可用结果
**And** 失败/HTTP 错误不自动免计费；失去业务发布资格的迟到 attempt 仍需记费用，但不能修改当前 Plan/Trip/Job 结果

**Given** 预留尚未使用且能证明没有外发
**When** 任务取消、过期、授权撤销或被新 attempt 替代
**Then** 以原 attempt/fencing 原子释放一次预留与可释放许可，不保留孤立资源
**And** 客户端离开、断线、AbortSignal 或任务终态本身不证明上游未接受，不据此删除可能已产生的费用

**Given** 发送意图已持久化后结果未知、usage 缺失或进程崩溃
**When** 进行恢复扫描或超时处理
**Then** 保留在途/待核对状态与保守占用，不靠 TTL 或新窗口直接释放；账本能恢复到同一 attempt 而不盲重发
**And** 只用已授权的非重复推理查询/账单证据收敛，长期无法核对按审定保守规则转暂估或持续占用；不把操作员刷新当作付费探测

**Given** 暂估费用获得可信实际数据，或真实消耗超过预留
**When** 自动或获授权的运营对账提交证据
**Then** 用幂等、可追溯的追加调整记录补差并保留旧值，展示实际/估算/未知及差异；不把真实超额截成预留金额
**And** 超额/欠额影响后续准入并形成稳定内部事件；没有证据不能手输零元解封，不因费用对账自动重跑任务或发送 Telegram

**Given** 服务端计量窗口轮换、进程时钟偏差或迟到费用到达
**When** 新建/结算预留或更新窗口规则
**Then** 使用权威时间与唯一范围/窗口边界，已发送费用仍归原窗口；未外发跨窗预留先原子迁移并重验所有相关范围
**And** 策略版本不作为清零账本的键；改时区/窗口需明确迁移且本期不允许借此清零；未知风险有跨窗累计保护，不重置成可无限再消费

**Given** 当前占用或并发可能高于待发布上限
**When** 运营确认收紧或放宽策略
**Then** 收紧可以发布，显示超出量并阻止受影响的新外发，未发出预留按新规则核验/释放；已发出继续结算，不撤回或改写其路线
**And** 放宽仅允许此后通过检查的调用，不重启终态任务、不返还已用次数、不解除独立暂停；发布到外发检查的传播/许可窗口须实测并显示未知状态

**Given** 预算数据库/控制授权不可验证或读数陈旧
**When** 接受新资源申请、派发、结算或展示状态
**Then** 未获得有效权威预留/许可的新外发停止；受影响操作进入有界恢复并保留原 ID/输入，不用本地 Map/采样 trace 代管余额
**And** 已发出尝试保留持久发送记录以恢复结算；只读显示数据时间/陈旧/未知，安全的已有行程、缓存与手动操作按原合同可用，遥测失联与预算失联分开处理

**Given** 授权运营者读取某环境、窗口与已注册范围
**When** 查看用量及单笔安全明细
**Then** 区分产品次数、外部请求、并发、已确认费用、暂估结算、未发出预留、在途/待核对占用及当前可新预留量；金额旁保留真实对应的 `已核对`、`暂估`、`预留` 或 `待核对` 等最小标签以及币种/数据截至，长计价定义和核对范围由 `查看来源` 展开，不将关键金额类别后置
**And** 显示数据时间/覆盖范围/币种与对账来源，计数有精确口径，不重复相加各层作用域；可按安全 correlation/job/attempt 查账，不用 8.1 采样数据当完整账本
**And** 每个金额可从原明细的 `查看来源` 查计价/核对范围；未接入账单仍在金额处显示 `未接入 / 暂无已核对金额`，不能藏进说明、记零或假称实时扣费；账号余额另列且不可据余额差推算单笔费用，汇总账单不得伪造逐笔分摊事实

**Given** 运营者处于列表、草稿、发布、对账或明细
**When** 加载、无数据、无权限、版本冲突、发布结果未知、数据陈旧或操作进行中
**Then** 明确文字状态、禁用原因、保留输入及返回/核实/重试路径；防重复提交、键盘访问、焦点恢复及 reduced motion 可用
**And** 原型只含合成数据且覆盖关键状态，其余由实际浏览器证据补齐；8.4 有自己的可用入口，不等待 8.6 总览
**And** 运营管理仅验收桌面 Web，保留鼠标/键盘操作与桌面浏览器布局；不要求运营页移动端适配、触控手势或手机截图

**Given** 内部额度、并发或 Provider 成本策略限制了操作
**When** 现有用户流程呈现结果
**Then** 只展示真实已接受队列/进度、当前可用重试/手动路径，保留原输入和既有行程，不暴露余额、次数、上限、币种、重置时间、额度级别或模型
**And** 不伪称已排队/自动恢复、不创建第二个规划结果，不改变冻结事实、城市范围、owner、版本/撤销；反馈、账号操作、阅读和可用手工编辑不受 AI 预算门禁

**Given** 策略发布、准入决定、结算与对账留下记录
**When** 保存、查询、关联观测或执行已批准数据清理
**Then** 仅保留环境/注册能力、受控伪名主体、操作/attempt、计价/策略版本、计量及稳定原因，不存正文、精确地点/路线、受保护 URL 或 secrets
**And** 账本不向 Langfuse/Sentry 外发 owner 明细；按 7.5 注册清理/去关联与期限，在不恢复已删除用户或擅自清零平台总占用的前提下保留必要非识别聚合；不新增默认无限期个人账单留存

**Given** 本 Story 准备从实施时基线切换并交付
**When** 完成迁移及获授权 staging 验证
**Then** 对齐旧有效限制/在途任务和窗口起点，无法重建的历史明确未覆盖并以保守初始占用/受限切换处理；同一范围只有一个账本权威，回退不能恢复无限额或双重扣减
**And** OpenAPI/生成类型与最小实体随本 Story 交付；真实 PG 多实例并发、空窗口竞争、重复接受/结算、跨窗/价格变化、收紧/恢复、过期 worker、故障与未知费用均有证据
**And** 按已授权小额度验证实际 AI/AMap 计量和内部 UI、权限/隐私及项目相关测试/构建；mock/原型/供应商网页不能替代真实验收，未部署/未测能力明确列为门禁

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 8.5: AI/高德终态异常与 Telegram 告警

As a Nomad 运营者，
I want 在AI或高德出现需要处理的终态异常时收到合并后的Telegram提醒，并在有证据恢复时收到通知，
So that 我能及时进入受限Web页面核查和处理，避免被普通重试刷屏或把通知故障误认为业务状态。

**Requirements:** FR38.1、FR38（消费预算/资格事实）、FR33（重试/回退边界）、FR14（既有AI/AMap适配器）、
FR13（复用安全排障关联）；NFR3/6/7/17/20/24；AR1-AR6、AR11-AR15、AR17-AR20、AR22；
UX-DR3、UX-DR31、UX-DR33。运营管理只需桌面Web，Telegram原型也以桌面消息呈现。

**Approved:** 2026-09-13。24条GWT、现有Node/PG事件与持久投递记录、薄sendMessage适配器及Telegram Lifecycle / Operator Delivery Recovery R1获批。只需桌面Web；原型数据为合成，发送回执不代表已读，规划批准不授权真实发消息或部署。
**Detailed contract:** `story-8-5-review-2026-09-13.md`；研究见 `research/story-8-5-mature-implementations-2026-09-13.md`。未绘出分支与真实权限/投递/故障仍需实施证据。
**Visuals:** `_bmad-output/implementation-artifacts/visual/story-8-5-telegram-lifecycle-r1.png`、`_bmad-output/implementation-artifacts/visual/story-8-5-operator-delivery-recovery-r1.png`。

**Acceptance Criteria:**

**Given** 前序业务Story及8.3/8.4已提供实际调用、预算与恢复事实
**When** 接入告警判定
**Then** 覆盖已交付AI/AMap能力，消费统一调用器完成重试/缓存/回退判断后的稳定事件，不额外调用模型来证明失败
**And** 不把首次使用保护移到本Story，不改业务结果或新增用户额度/模型界面，不等待8.6

**Given** 出现限流、超时、鉴权/计费、预算或熔断异常
**When** 应用已登记的告警规则
**Then** 只有需管理员处理的终态或达到配置持续影响阈值的异常进入通知；规则说明范围、严重性和可操作原因
**And** 普通重试、有有效缓存/回退的失败、个人额度受限及评测分数变化不直接告警，未知金额本身不等于余额耗尽

**Given** 合格事件或恢复事实已经在业务权威中成立
**When** 告警消费者读取、重启或恢复断点
**Then** 使用持久事件ID/游标及来源版本恢复处理，能显示积压/缺口；不以采样或异步观测工具作为唯一计数来源
**And** 通知失败不能翻转已提交业务结果；通知消费者故障由既有持久事实重放，HTTP发送不嵌入业务事务

**Given** 多实例收到重复或相关事件
**When** 聚合同一问题
**Then** 用环境、注册服务账户范围、能力、稳定错误类及规则身份形成指纹，按事件ID只累计一次，保存首末时间及来源序号
**And** 每次故障周期有独立编号；不同环境/账户/能力不能错误合并，重复回调/心跳不冒充新增终态事件，动态用户内容不参与指纹

**Given** 获授权运营者打开桌面Web告警配置
**When** 读取或编辑规则、聚合间隔、重试期限、恢复条件和目标
**Then** 服务端校验环境读/写/发布权限、有限字段及范围；目标仅选已登记会话别名与可选topic，Bot只用服务端secret引用
**And** 不接受任意出站URL、脚本、聊天内容模板或客户端角色证明；缺配置显示未就绪，普通用户不可访问

**Given** 配置有未发布改动
**When** 保存、检查或确认发布
**Then** 保留草稿/基准，修改使旧检查失效；明确环境/接收别名/规则差异和对当前活跃事件的影响，以预期版本及operation ID原子发布并留审计
**And** 静态检查不发送消息，未知发布结果查询原操作；冲突需重新核对，不自动重放历史告警或把配置检查当目标可投递证明

**Given** 首个合格终态或同故障周期持续有新事件
**When** 到达已批准策略的首发/聚合更新/重复提醒时机
**Then** 首发及时且等待有界，冷却期间继续计数并合并更新；下一允许时刻、窗口和已发送快照跨重启保留
**And** 不逐条刷屏、不因重启清零；发送队列/记录有容量与保留策略，积压可见且优先当前有效通知，不丢事实冒充没有异常

**Given** 某事件需要首发、更新或恢复通知
**When** 告警状态更新并安排通知
**Then** 在同一PG事务保存故障周期版本及唯一通知记录，绑定事件/通知序号、策略/目标版本、允许字段快照和调度时间
**And** 并发处理和事务重试不能多建同一逻辑通知，事务失败可重放；外部网络不在该事务内

**Given** 多个投递worker或重启后的旧worker竞争任务
**When** 领取及真正发送
**Then** 使用持久lease/fencing，核验当前目标/静默/事件状态/通知序号/有效期限，记录发送意图后外发，过期worker不得继续领取新发送
**And** 尚未发送的陈旧消息可合并/取消，不能在恢复后发“仍异常”；已经可能外发的请求保持未知风险，不因lease超时保证无重复

**Given** Telegram返回有效成功响应
**When** 保存投递结果
**Then** 校验响应并保留对应目标引用、message_id、时间和attempt关系，只标Telegram已返回消息记录
**And** 不显示已读、管理员已处理或服务恢复；回执落库失败按未知投递恢复，不能因为PG已有outbox就提前显示发送成功

**Given** 请求可能已发出但断网、超时、无有效响应或发送后进程崩溃
**When** 恢复该投递
**Then** 持久保留结果未知和同一事件/通知身份，明确重试可能重复，按有界策略重试或待运营处理
**And** 不伪造按本地operation ID查询Telegram发送结果的接口，不用getUpdates补证出站收据，重复消息不重复计业务事件

**Given** Telegram返回429/retry_after或出现可重试网络/服务错误
**When** 调度下一次尝试
**Then** 持久记录不早于允许时刻的next attempt，按目标及Bot全局限速、退避/抖动、总次数/期限协调实例
**And** 不启用隐藏SDK无限重试或多层重投，不购买/开启paid broadcast；重试耗尽可见，Telegram限流不改变AI/AMap的重试预算

**Given** 认证失效、被踢/禁发、目标/topic错误或收到群迁移提示
**When** 分类投递错误
**Then** 保存稳定原因与需修复状态，停止无意义重试；目标迁移经受控确认并保留前后引用，topic失效不静默改发总群
**And** 不转发到未登记会话；配置修复后显式恢复并只评估当前通知，不把修复通知渠道当作业务恢复

**Given** 渲染首发、聚合更新、恢复或测试消息
**When** 构造Telegram payload
**Then** 仅含已批准环境/Provider或能力别名、稳定码、严重性、计数、首末/恢复时间和安全事件/关联号，用有界纯文本模板且关闭链接预览
**And** 若加只读事件链接，只允许固定受保护运营origin和不授予权限的事件引用；不带用户数据、secret、修复命令或免登录token

**Given** 注册别名、错误字段或计数很长，含中文/emoji/控制字符
**When** 校验消息
**Then** 按Telegram实际文本限制处理，使用受限字段/短摘要保留稳定码、事件编号与关键时间；不将任意异常原文/HTML/Markdown拼入消息
**And** 不靠任意截断破坏字符/语义，不发送完整日志附件或自动多页洪峰；非法模板/字段明确失败并可在Web核查

**Given** 出站请求、代理或SDK发生异常
**When** 写入日志、trace、Sentry或投递记录
**Then** 在出站观测与错误导出前处理Telegram URL中的Bot token，仅记录方法/配置版本/目标别名和安全错误类别
**And** 不存完整URL、chat ID、请求体/响应chat对象、凭据或私人内容；仅POST JSON或SDK默认脱敏不足以通过验收

**Given** 运营者需要暂时停止某范围的通知
**When** 确认范围、理由和截止时间
**Then** 以受限权限/预期版本记录静默，期间继续采集/计数/恢复判断，UI区分通知静默与事件状态
**And** 静默不暂停Provider、不清账本、不标恢复；到期或解除后只评估当前状态并最多安排有效摘要，不补发整段历史洪峰

**Given** 活跃故障可能恢复
**When** 评估同一账户/能力/原因的恢复条件
**Then** 使用当前有效业务成功、权威限制解除及对应恢复窗口/规则需要的证据，记录来源与版本；恢复通知本身不启动付费健康探测
**And** 没有新数据、过期心跳、通知成功/失败、工具issue关闭、手动静默或旧回调不能单独证明服务恢复

**Given** 某故障周期已由权威证据恢复
**When** 生成或取消待发通知
**Then** 原首发可证未发送时取消陈旧通知且不补孤立恢复；原首发有回执时安排一次恢复；原发送未知时保留未知并使用自包含恢复说明
**And** 不先补发已失效的活跃告警；有可用原message_id时可引用，引用失败不得丢失恢复事实或造成无限重试

**Given** 旧恢复/错误迟到或已恢复后再次异常
**When** 更新事件和派发通知
**Then** 按权威来源序号与故障周期版本处理，新周期有独立编号，旧恢复不能关闭新异常；同目标发送前复核顺序和有效状态
**And** 已外发消息无法保证网络到达顺序或撤回，消息保留事件时间/编号，Web显示当前权威状态，不承诺端到端exactly-once

**Given** 授权运营者打开告警入口或消息里的事件链接
**When** 查看策略、事件、静默、投递attempt与恢复记录
**Then** 提供最小真实查询、版本/时间/覆盖率、确定失败/未知/陈旧/无数据状态，以及符合权限和当前状态的返回、检查、重试和修复入口；Web摘要用局部短标签保留服务事件与投递各自真实状态及数据截至，长聚合/冷却/恢复定义和依据在原详情或 `查看来源` 展开，需处理终态、未知发送及操作影响不后置
**And** 防重复提交，支持桌面鼠标/键盘、焦点和非颜色状态；不要求移动适配，不等待8.6，不扩展排班/电话升级/客服系统或Telegram聊天命令

**Given** 操作者要验证已登记目标可投递
**When** 在Web选择测试并确认环境、目标和合成内容
**Then** 明确发送一条有TEST标识的受限消息，使用独立测试操作ID/计数/收据；静态检查和页面浏览不自动发送
**And** 测试不混入生产事件或伪造恢复，不调用AI/高德；目标权限/可达性/真实桌面收到消息仍需实际验证，本轮规划批准不授权代发真实测试

**Given** Telegram/观测服务/告警worker不可用或记录达到保留期
**When** 重试、查询或清理
**Then** 投递积压/永久失败/重试耗尽在受限Web和既有独立观测中可见，保留可恢复游标与最小证据；通知故障不改变已提交Job/Plan、预算或熔断事实
**And** 不经同一故障Telegram通道递归报警，不新增未经授权的邮件/短信；本地删除不宣称撤回Telegram所有副本，个人关联按既有清理合同处理

**Given** 本Story准备接入实际环境并交付
**When** 初始化策略/目标、切换唯一投递出口并进行获授权staging验证
**Then** 只纳入已批准时间范围内当前有效事件，不自动重放旧历史；证明没有Sentry/Langfuse/Alertmanager/PG多套重复发送权威
**And** 真实PG覆盖并发重复事件、游标重放、重启冷却、静默恢复、乱序/重开、陈旧outbox/lease与回执落库失败；验证真实Bot/目标/权限、成功回执与Web/Telegram桌面展示
**And** 用可控故障覆盖429、401/403、迁移/topic、网络未知、重试耗尽、源失联与token哨兵全出口检查，完成相关合同/生成类型/测试/构建；mock/研究/原型不算真实投递通过

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 8.6: 运营总览与只读排障入口

As a Nomad 运营者，
I want 在同一只读总览核对服务质量、耗时、成本、降级和告警，并进入对应工具查看依据，
So that 我能快速判断需要处理的问题，并依据正确的数据范围排障。

**Requirements:** FR13、FR14、FR33、FR38、FR38.1；NFR3-NFR7、NFR17、NFR20、NFR24；
AR1-AR6、AR11-AR15、AR17-AR20、AR22；UX-DR2-UX-DR3、UX-DR31-UX-DR33。

**Approved:** 2026-09-13。20条GWT及对应中文验收说明、现有Node/React薄只读桌面总览与原工具受保护入口、Overview / Source States R1获批。各来源窗口/权限/采样和8.4账本、8.5事件继续独立；批准不代表实际来源已接入或Epic8整体确认。
**Detailed contract:** `story-8-6-review-2026-09-13.md`；研究见 `research/story-8-6-mature-implementations-2026-09-13.md`。
**Visuals:** `_bmad-output/implementation-artifacts/visual/story-8-6-operations-overview-r1.png`、`_bmad-output/implementation-artifacts/visual/story-8-6-overview-source-states-r1.png`；全部数据合成，未绘出状态仍需实施桌面证据。

**Acceptance Criteria:**

**Given** 前序业务与8.1-8.5已提供各自真实数据/可用入口
**When** 运营者打开总览
**Then** 同页核对已登记质量、耗时、成本、降级、告警和相关配置摘要，再进入各自来源查看依据
**And** 未交付能力不显示为正常/可用，缺失事实不在此重新采集或伪造，不依赖8.7/8.8

**Given** 请求页面或汇总API
**When** 服务端解析当前会话和可见环境/范围
**Then** 使用真实运营读权限授权，普通旅行用户不能访问，前端隐藏导航不替代后端检查
**And** 仅要求桌面Web，不增加移动运营适配或用户Settings入口，既有用户移动业务合同保持

**Given** 来源具有已验证的版本、只读能力和权限
**When** 注册指标或查询它
**Then** 固定来源host/project、字段、维度、单位、查询版本、最大窗口/行数、权限及数据可访问边界，服务端验证参数
**And** 不开放任意SQL/URL/筛选表达式代理，不把应用DB owner或服务key直接给浏览器；无对应来源能力时返回未接入

**Given** 选择环境、已登记能力、Provider或时间
**When** 请求并展示各摘要
**Then** 每项使用实际支持且获授权的过滤，明示业务任务群/事件窗口、质量报告版本、预算账期与当前故障as-of
**And** 不支持的筛选明确说明/禁止假套用，不把封存报告或实时事件伪装成共用业务时间筛选的结果

**Given** 来源返回数据、部分数据或空集
**When** 构造模块状态
**Then** 保留请求与实际覆盖范围、来源/定义版本、源数据截至及读取时间、样本/采样/外推信息和截断/保留期限制；模块摘要保留最小来源/范围、`数据截至…` 和采样/估算/未知等必要标签，长定义与具体覆盖/截断说明由 `查看来源` 展开，不把展开前的局部数据伪装成全量或实时
**And** 成功HTTP不代表全量覆盖，未知覆盖不填100%；缓存读取不更新源数据时间，超过可访问历史不显示为没有业务
**And** 来源未提供的截止时间/覆盖信息明确标未知，不以本次HTTP返回时间推造数据已更新

**Given** 计算完成、失败或降级计数/比例
**When** 聚合同一能力和版本化任务群
**Then** 按业务逻辑Job身份去重，明确接收/终态窗口、完成/失败/取消/进行中如何计入；重试/子attempt与用户数独立
**And** 比例的分子/分母来自匹配范围，分母为零显示暂无可计算值，不平均不同范围百分比，不相加跨工具独立采样计数

**Given** 展示P50/P95或错误趋势
**When** 读取已登记计时聚合
**Then** 明确阶段、排队/执行和成功/失败的包含范围、有效样本、时间与采样/外推方式，按该定义读取可解释结果
**And** 不平均多个P95、不用有限图点重新计算权威百分位，不把采样/粗略外推当全量实测；样本不足显示限制

**Given** 总览关联8.2评价结果
**When** 展示质量摘要和打开报告
**Then** 固定样本/模型/prompt/规则/代码与评价版本，区分自动结果、人工复核、执行错误、未完成和未运行，以局部短状态呈现；版本、规则定义和完整依据由 `查看来源` 进入对应封存报告/工作区，不隐藏待人工或执行未完成
**And** 保留逐规则计分/提醒/人工复核政策，不恢复统一硬失败否决或仅可选摘要；离线回归分数不标为实时全量质量，浏览不启动新评测

**Given** 展示预算和消耗
**When** 读取8.4已授权范围及账期
**Then** 直接消费其已核对/估算/未发出预留/在途未知、币种/资费来源和可新预留结果，保留原计算与账期，必要时分币种显示；金额旁保留 `已核对 / 暂估 / 预留 / 待核对` 中实际适用的类别及数据截至，长公式和资费/账单依据从 `查看来源` 进入8.4原明细
**And** 不拿Langfuse成本或trace计数补账，不把未知/未接入记零，不混同上游余额、Nomad上限和实际扣费，不无依据跨币种相加

**Given** 8.5提供当前事件/投递事实
**When** 展示待处理事件与通知摘要
**Then** 使用对应故障周期和来源版本，分开服务活跃/恢复/陈旧、通知静默、已返回消息记录/未知/拒绝，计数与来源一致
**And** 0个事件不等于全服务健康，通知成功不代表已读/业务恢复，缺数据不生成恢复或新告警

**Given** 来源提供路由、预算或告警策略的已发布/生效证据
**When** 展示当前配置及查看详情
**Then** 区分发布回执、已加载和实际使用版本，保留旧任务快照及未验证/等待使用状态；版本旁保留 `等待使用` 或真实未验证短标签，加载/使用证据通过原详情或 `查看来源` 展开，不把发布回执替代实际使用
**And** 不把新发布等同全实例使用，不在总览重新实现编辑/发布/暂停/回滚或修改任何配置权威

**Given** 某源超时、429、401/403、未配置或缓存过期
**When** 其他源仍能返回数据
**Then** 分模块显示加载、未接入、空数据、查询失败、权限不足、限速或陈旧状态；查询/刷新失败在对应模块使用 `暂未更新 · 重试` 并保留可读的具体原因/当前状态，其他仍获授权事实继续可用，不扩大成全页警告；源数据截至始终可见，来源与长原因可在本模块展开，未知不能伪造时间
**And** 仅在完整有效查询确为空时显示0；陈旧值始终带原时间和状态，不能一处失败让全页清零或显示全局正常

**Given** 快速切换环境/时间/能力、重连或并发刷新
**When** 旧请求迟到或账号/权限发生变化
**Then** 用请求范围/代次核验响应，只更新匹配的当前视图；切换后不混入旧环境数据，原筛选上下文可恢复
**And** 登出/换账号/撤权及时清除不可见数据、请求和缓存展示，失败不能重新显示已失去权限的旧快照

**Given** 多个运营者或多个模块同时请求刷新
**When** 查询PG及外部聚合API
**Then** 使用独立来源超时、有限并发/行数/窗口、同范围请求合并、共享缓存和退避，按实际套餐/响应限额调度；后台/隐藏页面停止不必要轮询
**And** 不用多key绕限，不让每个浏览器重复耗尽组织配额；手动刷新仍说明实际重新查询/缓存命中和可重试时间，不触发AI/AMap业务调用

**Given** 复用聚合缓存或使用服务端来源凭据
**When** 返回给不同操作者
**Then** 缓存键/读取校验包含有效可见范围、环境、过滤、来源与定义版本，权限/来源映射变化使相关缓存失效
**And** 服务凭据能力不等于浏览器用户授权，不能借其他账号缓存或高权来源返回不可见项目；不靠图表/变量/Viewer标签充当数据隔离

**Given** 运营者选择原工具、质量报告或既有配置/事件页面
**When** 构造和打开链接
**Then** 使用登记host/project/path及实际支持的安全过滤/绝对时间，说明哪些条件带入，目标独立校验登录和权限，返回可恢复原筛选
**And** 链接不是授权，不携带密钥、免登录token或私人行程；失效/无权不降级成公开分享，目标widget覆盖筛选时不得声称范围一致

**Given** 使用键盘、调整桌面窗口或查看有限图表
**When** 页面加载、切换、错误或重新布局
**Then** 提供明确文字状态、焦点/键盘操作、可读表格和非颜色区分，避免遮挡与错误加载完成感
**And** 图宽、最大点数、展示粒度变化只影响绘制，不改变权威成本/计数/P95；无需手机截图或触控适配，复杂图表编辑留在原工具

**Given** 从业务/工具来源获取摘要、metadata或链接
**When** 读取、缓存、展示或记录查询日志
**Then** 只选获准聚合与最小安全关联并验证不可信字段，不为计算总览拉取用户原文、精确行程/位置、反馈附件或secrets
**And** 不提供用户内容钻取，不因8.2获准评测副本扩大生产遥测/总览权限；来源清理/撤权后清理相关缓存，不自动开启公共snapshot、匿名iframe或导出分享

**Given** 打开、刷新、退出或总览自身不可用
**When** 查询和导航执行
**Then** 不启动模型/评价/探测/测试消息、重跑任务或修改策略/预算/告警；需要操作时进入对应Story现有鉴权与明确确认流程
**And** 查询故障不改变Job/Plan、8.4账本或8.5恢复/投递事实；有界查询不无约束争用业务连接池，不另建客服/值班/观测计量平台

**Given** 本Story准备交付
**When** 在实际已授权来源及桌面环境验证
**Then** 固定并核实来源版本/套餐/API能力/权限/保留与限额，真实覆盖各核心摘要、口径/窗口/金额来源、链接筛选、部分故障、采样/截断、缓存/撤权和迟到响应
**And** OpenAPI与生成类型、最小只读适配/查询及相关测试/构建/桌面证据完成；未接入核心源、模拟数字、SDK存在或原型不算交付，缺失前序事实回到对应Story补证
**And** 不要求新Grafana/iframe/平台升级，未知部署/权限仍列门槛；本Story批准不自动关闭Epic8或跳过整体覆盖、最终CE/IR/SP

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Epic 9: 通过统一的网页与手机应用使用 Nomad

FR52/NFR25及现有页面要求；9.1宿主前置，9.4工作台/真实lint→9.5浏览器保护→9.3共享UI；9.6身份隔离读取与9.7导航分别交付，9.2最终APK/TestFlight收口。稳定编号不代表执行时间。

### Story 9.1: 安装 Nomad App 并使用现有入口

As a 获准的 Nomad 测试者,
I want 在 Android 或 iPhone 安装 App，打开既有登录和协议入口，并正确使用系统交互,
So that 我能从手机应用开始使用 Nomad，而不用等待后续功能才知道宿主是否可用.

**Requirements:** FR52；NFR1、NFR3、NFR7、NFR8、NFR25；AR1–AR3、AR14、AR18–AR20、AR23–AR24；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36。

**Engineering conditions:** APP-BUILD-01、APP-HOST-01；启动/恢复测量按 METRICS-01/02 记录实际适用范围；无数据库变化时 DB-CHANGE-01 给出不适用依据，不执行无关迁移。`app-build-delivery` 来源义务进入 Tasks 和关闭清单。

**Dependencies:**复用历史 1.1/1.2 首屏和当前代码；不依赖 1.0 整张完成。构建/安装要求是真实证据，未具备 macOS/设备时相应项未完成；其他平台的通过不代替它。

**原型与证据：**复用 [mobile-ia 的登录与全局组件](../../docs/ux/mobile-ia.md)及[现有视觉登记](../../docs/ux/prototype-coverage.md)。只补宿主返回、键盘、安全区、外链和恢复状态；真实设备截图/安装记录在实施时提供，不能从草图推导已通过。

#### 9.1-AC1 — 可重复构建与实际安装

**Given** 已确认真实包名/Bundle ID、工具链及可用构建/签名资源，源代码与依赖锁可对应
**When** 从受控工作区构建 Web assets、同步两个原生工程并安装开发测试候选
**Then** Android 与 iPhone 的实际设备都能安装并启动同一输入版本的 App，记录构建输入、设备/OS、产物标识和结果
**And** Web 构建仍独立可用；工程目录、模拟器运行、编译成功或未签名产物不能替代双端实际安装证据，开发候选也不冒充最终 TestFlight 交付

#### 9.1-AC2 — 既有首屏形成可用结果

**Given** 测试者启动新安装的 App，当前登录能力来自既有后端实际配置
**When** 查看登录首屏、协议链接和可用/不可用状态
**Then** 使用现有 React 页面、入口顺序和可访问文案，协议真实可读，配置不可用时有明确恢复路径
**And** 不为完成宿主验收打开测试认证、不把按钮或 AppKey 当成登录成功；真实身份/会话由 1.0 另行验收

#### 9.1-AC3 — 本地资源与断网启动

**Given** App 安装包内已包含冻结的 Web 资源，测试设备断网或 API 不可达
**When** 冷启动或重新打开 App
**Then** 本地应用壳可打开并给出实际网络/恢复状态，必要公开说明可读，恢复网络后允许安全重试
**And** 不要求开发机 live-reload 服务才能启动，不把空白屏当作加载，不伪造后端成功、完整离线行程或自动重放未知写入

#### 9.1-AC4 — 系统返回

**Given** 当前存在键盘、临时 Sheet、子页面或根页面
**When** 用户使用 Android 返回键/手势或 iOS 适用的返回交互
**Then** 按既定层级关闭键盘/临时层、返回页面，根层遵守平台行为，保持未提交修改的既有保护规则
**And** 一次返回只处理一次，不触发提交、删除或新任务，不在关闭一个 Sheet 时退出整个 App

#### 9.1-AC5 — 键盘、安全区与可访问性

**Given** 支持设备有刘海/底部手势区，用户启用中文输入法、大字号、读屏或 reduced-motion
**When** 在登录/代表性输入页面输入、切换焦点、打开 Sheet 或读取失败状态
**Then** 输入、主要动作和顶部返回可达，安全区不重复叠加，焦点/读屏/44pt 目标符合既有合同
**And** 实测最小支持宽度、键盘打开/关闭和系统栏变化，截图只对应实际使用的构建与设备

#### 9.1-AC6 — 外链和桥接边界

**Given** 用户打开协议或其他已批准外链，或宿主收到未知 URL/scheme
**When** 宿主判断导航目的地
**Then** 仅已允许的站内路由留在业务宿主，外部 HTTPS 页面通过受控系统浏览能力打开；未知/不安全目的地拒绝并保留返回路径
**And** 外部页面不能获得 Nomad 原生桥接、认证头或私人存储；登录回调由 1.0 的专用验证链消费，不把普通 Browser 打开当成完成认证

#### 9.1-AC7 — 生命周期通知

**Given** App 经后台挂起、系统界面返回或进程重建后恢复
**When** 宿主产生前后台/启动事件并交给现有界面
**Then** 同一轮恢复只通知一次且 listener 正确释放，保留能确认的页面状态并进入真实恢复流程
**And** 宿主不会自行登录、重新启动业务任务、请求位置/剪贴板权限或声称未持久化草稿已保存；身份和业务对账由责任 Story 消费该事件

#### 9.1-AC8 — 关闭证据与配置隔离

**Given** 9.1 准备关闭
**When** 检查双端构建/安装、Web 回归、配置差异、打包内容、原生权限及代表性交互证据
**Then** 支持矩阵与可重复构建说明可执行，测试环境可辨认，发布配置没有开发 URL、服务端密钥或测试身份后门
**And** 保留原型和实现差异、未实测项及原因；真实认证、未来插件与最终 APK/TestFlight 分发不被虚列为本 Story 完成

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

#### UI03 — 新的平台下限与宿主一致性

**Given** 新共享UI依赖和获批支持矩阵已写入实际Web及原生构建配置
**When** 检查所有deployment/JS/CSS/脚本目标并在最低支持iPhone与代表性Android执行输入/Sheet/恢复
**Then** 最低iOS16.4声明与当前资源、原生工程、系统交互和实际设备结果一致，网页保留获批范围
**And** 任何旧16.0配置勾选、相邻OS或仅WebKit结果只能作为历史证据，不能关闭缺失的最低设备验收

### Story 9.2: Android APK 与 iOS TestFlight 内测交付

As a 获准的 Nomad 测试者,
I want 获得能实际安装和更新的 Android 测试包或 iOS TestFlight 版本,
So that 我能在真实设备持续验证完整旅行流程，并让反馈对应到明确版本.

**Requirements:** FR52；NFR2、NFR3、NFR6–NFR8、NFR25；AR1–AR3、AR14、AR18–AR20、AR23–AR24；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36。复核 1.0/1.6/5.5/6.2/7.x/8.1 已有功能证据，不另建同义业务实现。

**Engineering conditions:** APP-BUILD-01、APP-HOST-01、APP-DISTRIBUTE-01；复用当前 OPS 与 METRICS 的适用发布门槛，不因内测改成自动 verified。`app-build-delivery` 来源义务由本 Story 最终关闭其分发切片。

**Dependencies:**9.1 与本期完整交付所需业务 Story 的当前证据。9.2 位于执行队列末尾；不得成为 9.1 或 1.0 的循环前置。只打出功能未完成的壳包不能关闭本 Story。

**原型与证据：**复用各所属 Story 的当前原型与真实实现；增加安装、升级、不可用/过期与恢复记录。安装说明是工程交付物，不额外设计用户运营后台。

#### 9.2-AC1 — 候选版本可追溯

**Given** 本期业务与安全门槛已有可核查结果，准备冻结候选版本
**When** 生成 Web、Android 与 iOS 交付物
**Then** 源 revision/必要内容摘要、锁文件、Web assets、原生 SDK、环境、签名引用和版本号映射到同一候选清单
**And** 工作树包含未提交变化时不能只引用旧 HEAD 冒充实际构建来源；不能用另一个版本的测试结果代替本次候选

#### 9.2-AC2 — Android 安装与升级

**Given** 已生成具有稳定应用标识和有效测试签名的 APK
**When** 获准测试者在支持设备执行全新安装和覆盖升级
**Then** APK 可安装、可启动、能连接声明的测试后端，升级保留合法账号/业务上下文并重新验证当前会话资格
**And** 提供校验和、版本、安装方法及兼容范围；升级失败不得要求清空现有业务数据来冒充通过

#### 9.2-AC3 — TestFlight 实际可用

**Given** 已核验指定 Apple 开发者团队、App Store Connect 应用、签名及实际测试组权限
**When** 上传 iOS build 并完成所需处理/适用审核，获准测试者安装和更新
**Then** 指定 TestFlight build 对该组可用，真实 iPhone 可启动与访问测试环境，记录 build、测试组安全引用、可用/到期状态和安装结果
**And** 上传受理、Archive/IPA、模拟器截图或等待处理不算已可安装；无需邀请未指定人员、公开发布 App Store 或扩大运营权限

#### 9.2-AC4 — 完整跨端用户流程

**Given** 候选包与相同后端版本可用
**When** 按所属 Story 的真实能力执行登录、输入/导入、规划/编辑、行程单、保存分享、定位及账户/反馈，并回归网页
**Then** 三端共用 owner 与服务端当前数据，关键路由/平台能力达到本期合同，交叉设备会话和业务版本不冲突
**And** 引用各 Story 证据并补候选包关键组合实测；未完成业务或只有 fixture 的必需真实能力保持未验收，不能用部分流程关闭整期交付

#### 9.2-AC5 — 故障、隐私与设备矩阵

**Given** 测试覆盖最低支持版/当前稳定版、Android/iPhone 真机及适用低内存/无 GMS 路径
**When** 注入权限拒绝/撤回、断网、挂起/杀进程、登录撤权、文件部分失败和插件/SDK 失败
**Then** 仍遵守已批准的降级、owner 隔离、恢复与真实结果文案，JS/原生故障能对应候选版本且隐私采集范围正确
**And** 浏览器组件测试、SDK 初始化或相邻 OS 的结果不能充当缺失平台/能力证据，未覆盖项明确阻止相应支持声明

#### 9.2-AC6 — 更新和恢复交付

**Given** 测试包需要替换、到期，或新客户端与后端版本发生不兼容
**When** 执行预先记录的更新/撤回/恢复方案
**Then** 有可安装的新候选或真实可执行的恢复步骤，版本与 API 兼容窗口明确，测试者能知道当前不可用及下一步
**And** 不承诺 iOS 可任意原地降级、不加入未经规划的热更新平台、不删除旧数据/备份；最终留下产物清单、核心验收结果和未解决事项

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

#### UI04 — 最终候选包含当前组件与支持证据

**Given** 本期页面已按各自责任完成共享UI迁移和新的平台支持验收，准备最终候选
**When** 核对组件/生成源码版本、lockfile、Web资源和APK/TestFlight实际安装/升级证据
**Then** 相同候选涵盖受影响页面的浏览器与原生交互结果，未迁移兼容项有批准的明确责任，产品无开发工作台/MSW入口
**And** 不用迁移前视觉基线或旧包为当前候选背书，缺任何必需真实平台/业务证据仍不能关闭分发

### Story 9.3: 在现有入口使用统一且安全的 Nomad 组件

As a 在网页或手机使用 Nomad 的旅行者,
I want 登录、输入和临时弹层具有一致的视觉与系统交互,
So that 我能保持上下文完成操作，并在身份变化时不会看到旧的私有内容.

**Requirements:**FR1、FR18、FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR5、AR12、AR15、AR17–AR20、AR23–AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**9.4工作台/代码检查和9.5现有流程基线已可用；复用9.1已实现的host接口。采用已获批的网页矩阵。交付现有登录控件与一个Home临时层的实际适配，以及当前退出确认的共享基础；相同修改的领域验收由1.0/1.6记录，不要求其整张done形成循环。完整7.3或未实现页面不属于本Story。

#### 9.3-AC1 — 品牌与可复现组件来源

**Given** 现有批准视觉及精确依赖/生成来源已记录
**When** 构建并打开新的基础组件及现有登录代表性页面
**Then** 展示的是Nomad现行颜色、字号、间距、圆角与触控规则，并能追溯CLI、registry、组件源码和lockfile
**And** 业务页面没有散落第二套交互基础或未经批准的新主题，旧页面无全局reset导致的布局变化

#### 9.3-AC2 — 字段、按钮与诚实状态

**Given** 代表性表单具有正常、loading、disabled、错误及中文输入组合状态
**When** 用户输入、确认或使用键盘与读屏
**Then** label/description/error关联、焦点和44pt目标正确，输入保留，只有明确提交触发一次既有业务动作
**And** loading/empty/error/reconnect/partial/unverified保持不同，不虚构成功或自动读剪贴板

#### 9.3-AC3 — 受控模态的焦点与滚动

**Given** 页面有可触发AppSheet的现有控件与可滚动内容
**When** 打开、正常关闭、卸载或经历StrictMode重挂载
**Then** 焦点进入并被包含，背景不可交互，滚动锁定和监听完整释放，恢复到同身份有效触发器或安全标题
**And** 无残余遮罩/锁定、双重focus trap或跳到旧owner内容

#### 9.3-AC4 — 返回、键盘和草稿

**Given** 临时层中有中文键盘、busy动作或未提交草稿
**When** 用户返回、Escape、外侧点击或点击关闭
**Then** 同一受控关闭策略决定结果，Android键盘/顶层Sheet/页面历史按优先级一次只消费一层
**And** 不自动保存、重交operation、退出整个App或丢失原合同需保留的草稿

#### 9.3-AC5 — 身份变化与Portal遮蔽

**Given** 私有Sheet或Toast打开且旧身份可能有未完成异步回调
**When** 身份进入checking/unavailable、退出、撤权或切换owner/session
**Then** 页面与所有私有portal同步遮蔽或卸载，旧回调不得重开/写入，重新核实后只恢复当前身份可确认内容
**And** 公开协议仍按公开边界可读，焦点不返回已无权的私有控件

#### 9.3-AC6 — 最低平台与可访问布局

**Given** 已批准的最低平台和代表性Android/iPhone设备，以及读屏/200%字号/reduced-motion设置
**When** 操作输入、Tabs、Sheet和主要CTA并开关键盘
**Then** 操作可达、safe-area不重复叠加、无横向溢出或底部遮挡，辅助技术能表达选中、错误和禁用原因
**And** 构建、浏览器和真实设备结果分别记录；缺最低iOS或设备实证时本条保持未验收

#### 9.3-AC7 — 组合状态不改业务权威

**Given** Home存在运行任务、FIFO结果、断线或未知写入回执
**When** 新组件展示状态、打开关闭弹层或恢复前台
**Then** 现有controller/journal/cursor决定业务事实，模态可见性正确影响原显示窗口，导航/提示不新建任务
**And** 不把部分/未知转为成功，不改变幂等身份、ACK时机或原输入归因

#### 9.3-AC8 — 升级与迁移证据

**Given** 本次基础组件和实际消费点准备关闭
**When** 运行工作台、类型lint、组件/浏览器回归、构建及适用native验收
**Then** 证据绑定当前源码/依赖/设备，兼容旧组件清单和后续Story责任明确，可逐适配回退且不清业务数据
**And** 1.0/1.6/9.1的整Story状态不会因共享组件通过被自动关闭

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 9.4: 用可运行状态工作台与真实检查维护组件

As a 维护 Nomad 界面的开发者和审阅者,
I want 独立查看现有组件状态并让代码错误在CI中失败,
So that 我无需真实账号或外部请求就能审阅改动并及时发现回归.

**Requirements:**FR52；NFR3、NFR7、NFR8、NFR25；AR1–AR4、AR12、AR15、AR17–AR20、AR26；UX-DR3、UX-DR33、UX-DR37。

**范围：**现有HomeSheet/字段至少形成一个可运行样例；Storybook React/Vite、MSW、a11y、真实lint是本工具切片。无须等9.3，后者负责为新增组件补例。

#### 9.4-AC1 — 工作台立即可用

**Given** 干净受控工作区按锁文件安装，未配置真实业务账号/密钥
**When** 启动或静态构建Storybook
**Then** 已有代表性组件可交互，并有正常、空、长中文、大字号、loading、禁用、错误及重连的适用展示用例
**And** BMAD Story状态与展示用例清楚区分，工作台不依赖未来页面才有可用结果

#### 9.4-AC2 — 复用且隔离的网络替身

**Given** 场景声明了与当前API合同对应的合成MSW handlers
**When** 运行成功、403、超时、partial或重连用例，或出现未声明网络请求
**Then** 预期状态可重现，未处理请求使测试失败，静态资源例外有明确清单
**And** 不使用真实用户内容/密钥，不以网络替身替代原生bridge或真实PG证明

#### 9.4-AC3 — 真正执行的类型lint

**Given** 新共享层及迁移涉及源文件处于配置的lint覆盖范围
**When** CI或本地运行ci:lint，并插入未处理Promise、非法Hook或缺少字段label的负向样例
**Then** 实际规则返回失败且日志定位源文件，移除缺陷后通过
**And** 不能以打印占位、忽略退出码、关闭整目录规则或重复类型编译冒充lint

#### 9.4-AC4 — 受控历史问题与依赖

**Given** 当前代码已有历史lint问题且插件peer支持范围已核验
**When** 引入规则或升级工具链
**Then** 精确版本无需强制peer绕过，历史例外具有范围/原因/迁移责任且不能增长，新问题阻止CI
**And** 不批量格式化或顺手重写认证、恢复与持久化逻辑

#### 9.4-AC5 — 交互与无障碍能发现缺陷

**Given** 工作台已声明核心组件的interaction与a11y场景
**When** 破坏焦点返回、键盘操作、错误关联或非颜色状态表达
**Then** 相应自动化或明确人工检查失败，结果可关联组件和当前源码
**And** 自动a11y通过不被说成VoiceOver/TalkBack或真机验收完成

#### 9.4-AC6 — 产品构建隔离

**Given** 生成Web和Capacitor产品候选
**When** 检查入口、资源、网络和依赖打包结果
**Then** 产品无MSW worker自动注册、工作台入口、fixture认证或真实秘密，原生产transport仍生效
**And** 工作台/测试的本地成功不改变任何真实服务或APP-HOST条件状态

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 9.5: 在固定浏览器环境保护关键入口与组件迁移

As a 维护 Nomad 交付质量的开发者和审阅者,
I want 在一致浏览器环境重现关键流程和视觉差异,
So that 组件迁移前后可以核对实际行为并防止未经审阅的变化进入交付.

**Requirements:**FR1、FR18、FR52；NFR3、NFR8、NFR25；AR1、AR5、AR12、AR15、AR17–AR20、AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**使用9.4已定义的合成场景与隔离配置；先保护现有界面，不依赖9.3完成。9.3以后每个迁移消费点必须运行本Story交付的门禁并提交自身证据。

#### 9.5-AC1 — 关键入口跨浏览器

**Given** 固定Playwright、浏览器版本和受控合成身份/API场景
**When** Chromium、Firefox、WebKit执行登录→Home→Settings→返回及Sheet打开关闭
**Then** 页面路径、焦点、滚动和输入上下文符合原合同，失败给出可定位trace
**And** 所测引擎版本明确，不把bundled WebKit当作最低iOS真机证明

#### 9.5-AC2 — 错误、恢复与身份安全

**Given** 测试包含loading/empty/partial/error/reconnect及打开的私有弹层
**When** 网络失败、未知回执恢复或身份变更
**Then** 原输入/operation/事实状态按合同保留或隔离，portal同时遮蔽，恢复不重复写入
**And** 测试能捕获旧owner内容、迟到回调和重复请求，不只检查页面可见

#### 9.5-AC3 — 可审阅截图差异

**Given** 字体、容器镜像、浏览器、数据、locale/timezone、viewport/DPR与动画策略均固定
**When** 比较迁移前后的正常/长中文/200%字号/键盘和模态代表性状态
**Then** 实际/基准/diff产物可审阅，布局、主要操作与批准品牌保持
**And** CI不自动更新基准或通过过宽容差遮蔽明显位移，故意布局破坏会使门禁失败

#### 9.5-AC4 — 原探针不丢覆盖

**Given** 已存在认证、Dock、IDB journal、遥测和PG/重启/SSE探针
**When** 新测试框架接入CI或替换重复浏览器脚本
**Then** 清单逐场景指明原证据、CI现状、替代对应和真实资源要求，只有等价覆盖证明后才退役重复项
**And** 真实PG、SIGKILL、跨进程IDB/回执测试不会因采用MSW或页面截图而被删除

#### 9.5-AC5 — 日常CI有真实门禁

**Given** 提交包含受影响UI、类型、合同或恢复实现
**When** 执行每次改动及合并前检查
**Then** 相关类型/lint/单元组件/构建/handoff/浏览器及适用PG检查真实执行并保留结果
**And** 缺少必要运行资源明确阻断相应检查，不以skip或旧日志算通过

#### 9.5-AC6 — 证据与发行责任分开

**Given** 浏览器套件全部通过，准备提供测试结论
**When** 汇总支持平台、mock范围、源码/资源摘要和未测项目
**Then** 结论限定为实际运行环境，9.1/业务Story/9.2仍负责最低平台设备、真实能力和发行验收
**And** 旧截图、旧APK或fixture结果不能覆盖新依赖下尚未完成的真机门槛

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

### Story 9.6: 以身份隔离的共享读取层展示城市与灵感

As a 使用Home与Planner的旅行者,
I want 读取和刷新城市及我的灵感时获得一致可靠的状态,
So that 页面切换不会重复请求或显示其他身份的旧内容.

**Requirements:**FR2、FR3、FR18、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、AR27；UX-DR5、UX-DR13、UX-DR32、UX-DR36。

**范围：**只迁移现有Home/Planner普通读取，未来已发布行程由所属Story扩展；不替代auth、mutation、journal或durable SSE。先前UI质量门禁可用即可，无须Router完成。

#### 9.6-AC1

**Given** 当前身份已确认且两个现有消费点请求同一城市或owner灵感资源
**When** 使用统一Query adapter读取和刷新
**Then** transport与类型合同保持，共享读取可去重，公共/私有命名空间及筛选/版本key正确
**And** 只读不会启动新的收费能力或业务写入

#### 9.6-AC2

**Given** 私有缓存存在，随后身份未知、撤权或owner/session变化
**When** 页面重渲染或旧请求迟到
**Then** 未确认时不显示私有cache/placeholder，取消旧请求并清理旧上下文，迟到结果不得进入新身份视图
**And** 不把query key或路由参数当服务端授权证明

#### 9.6-AC3

**Given** 宿主恢复、网络恢复或页面重新聚焦
**When** Query可能触发刷新
**Then** 先由现有身份恢复协调器核实，再按显式资源策略读取，默认自动retry/focus/reconnect策略已受控
**And** 不与原控制器重复恢复或隐藏叠加重试

#### 9.6-AC4

**Given** 列表为空、失败、仍有合法旧数据或分页进行中
**When** 用户查看或手动重试
**Then** 显示准确状态、保留可合法读取的内容并防止页面覆盖新筛选结果
**And** 权限失效立即移除旧数据，不把读取失败当empty或服务端任务失败

#### 9.6-AC5

**Given** 同一应用存在导入operation journal、durable cursor和未完成mutation
**When** 安装Query adapter并切换页面
**Then** 这些责任仍由原控制器处理，Query首批不持久化私有cache也不排队重放mutation
**And** 断网/重启不产生新的operation或重复写入

#### 9.6-AC6

**Given** Home/Planner试点准备关闭
**When** 运行取消/去重/跨owner/刷新/状态回归与当前平台验收
**Then** 证据证明两个真实消费点使用同一读取层，旧读取adapter可独立回退且不清数据库或operation日志
**And** 未迁移资源清单明确，不宣称整个应用缓存已统一

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

### Story 9.7: 通过统一导航打开和返回现有页面

As a 在网页与App间访问Nomad的旅行者,
I want 刷新、直达、返回与经过验证的深链都能进入正确页面,
So that 我能保留合法上下文且导航不会重复提交业务动作.

**Requirements:**FR18、FR49、FR52；NFR3、NFR8、NFR20、NFR25；AR4–AR6、AR12、AR15、AR17–AR20、AR23、AR28；UX-DR1、UX-DR3、UX-DR32、UX-DR36。

**范围：**现有Home、Settings、Planner/DayPlan与S0–S11类型约定；不创建未来假页面。可通过当前读取adapter实施，不强制等待9.6；与Query分开改动和验收。

#### 9.7-AC1

**Given** 用户拥有可访问的现有页面或计划引用
**When** Web刷新、直达或浏览器前进/后退
**Then** 部署fallback及typed参数解析恢复正确页面或可理解错误，日期/scope/id不能按名称猜测
**And** 未实现页面不可被路由表伪装为已经交付

#### 9.7-AC2

**Given** 导航参数可能包含不可信输入或私密业务内容
**When** 生成、解析、记录URL或访问历史
**Then** 只接受允许的public reference和有限状态，不写token、私人原文、受保护URL或完整草稿
**And** 日志/遥测遵循原字段和值级脱敏

#### 9.7-AC3

**Given** Android存在键盘、顶层Sheet和页面历史
**When** 用户返回一次
**Then** 唯一协调入口按层级消费一次，根层遵循平台行为，原未提交保护可生效
**And** 旧App/页面handler不会同时后退、提交或退出

#### 9.7-AC4

**Given** 原生冷暖启动收到外部链接或认证回调
**When** 现有校验链确认可用typed intent
**Then** router只处理获准导航，未知/重复/过期/跨owner输入按原合同拒绝或恢复
**And** 原始appUrlOpen不直接作为内部路由或登录证明

#### 9.7-AC5

**Given** 当前页面有草稿、滚动位置或暂时弹层
**When** 离开、返回或恢复无效的日期/资源引用
**Then** 保留原有可确认草稿及合法scroll/focus，无效上下文回到安全parent
**And** 不把表单dirty当持久保存、不重播过期Sheet或undo令牌

#### 9.7-AC6

**Given** 身份尚未确认或在loader期间变化
**When** 访问私有路由、预取或异步读取返回
**Then** guard与portal共同遮蔽，私有自动prefetch关闭或明确受控，原transport仍执行权限与代际校验
**And** navigation/loader不启动planning、重交mutation或改变operation身份

#### 9.7-AC7

**Given** 现有入口完成导航迁移
**When** 在网页、Android和iOS验证刷新/深链/返回/身份/草稿组合
**Then** 结果绑定当前源码与实际平台，旧路由兼容或拒绝规则明确，回退不会丢弃业务数据
**And** 缺原生资源时只报告已验证切片，不用浏览器history模拟完整App验收

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。
