---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux.md
supplementalDocuments:
  - _bmad-output/planning-artifacts/supporting-tech-specs.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-08-05.md
  - _bmad-output/planning-artifacts/planning-inputs-load-and-linked-trips-decision-2026-08-08.md
  - _bmad-output/planning-artifacts/requirement-trace-audit-2026-08-12.md
historicalDocumentsExcluded:
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-06-17.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-13
**Project:** nomad-mvp

## Document Inventory

### Required Inputs

| Document Type | Selected Whole Document | Size | Duplicate Status |
| --- | --- | ---: | --- |
| PRD | `_bmad-output/planning-artifacts/prd.md` | 81,003 bytes | No sharded duplicate |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | 50,868 bytes | No sharded duplicate |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | 33,320 bytes | No sharded duplicate |
| UX | `_bmad-output/planning-artifacts/ux.md` | 49,860 bytes | No sharded duplicate |

### Supplemental Context

- `supporting-tech-specs.md`
- `sprint-change-proposal-2026-08-05.md`
- `planning-inputs-load-and-linked-trips-decision-2026-08-08.md`
- `requirement-trace-audit-2026-08-12.md`

The 2026-06-17 readiness report is a historical snapshot and is excluded from current findings.

## PRD Analysis

### Functional Requirements

- **FR1:** 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。
- **FR2:** 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- **FR3:** 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- **FR4:** 小红书入库流程（每个 ingest job 处理一条链接）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 视频按时长抽帧并先做语音检测 → 图片/关键帧二次存储至 COS（禁止热链）→ AMap 标准化与验证（判定标准 POI/坐标/文字地址/营业时间/评分/人均/电话等）→ 高置信自动入库 / 低置信标记“待定位”；前台可创建多个 job 并用 SSE 分别跟踪。 解析抽取策略（更新）：默认启用多模态 LLM（含图+文/关键帧）进行抽取；短视频（≤30 秒）应高频抽帧，长视频可按较低频率抽帧；静音或 BGM 视频跳过 ASR，含人声片段才进入 ASR；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source、source_attribution、质量等级与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。
- **FR4.1:** 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。
- **FR5:** 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。
- **FR6:** 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子； `required/必去` 与 `along_route/顺路` 只在 S4 Picker 中赋予，Library 中的收藏/导入 不得静默等同任一种规划意图。
- **FR7:** AI 初始规划：根据时间、住宿、地点意图、导入证据和节奏一次生成完整、可编辑的日计划；不得要求用户先手工摆放地点。无法安全落位的 required 项明确进入未解决/候选区域，未选内容由 Agent 适量补全。
- **FR8:** 时间轴编辑：用户可替换、移动到前一天/后一天/其他日期、按 1 分钟精度调整开始与结束时间、删除并撤销；首末日和无其他可选日期时正确禁用移动目标。AI 生成时间允许内部按 15 分钟精度对齐。
- **FR9:** 增量可行性校验：初始计划必须先通过校验；用户或 AI 后续修改引入闭店、过远、超时、住宿/交通冲突时再展示冲突及可预览的修复方案，干净计划不长期占用校验卡。
- **FR10:** AI 行程细节完善：在已排好的计划上为所有适用槽位补充“做什么/准备什么/注意什么”、why_short、引用来源和质量等级；不得修改用户已确认的日期、时间或顺序。
- **FR11:** 导出行程 PNG（行程卡片）。
- **FR12:** 设置页：展示用户登录信息、AI 使用额度/状态、账号删除、数据导出与反馈入口；MVP 不要求用户配置自己的模型 Key。
- **FR13:** 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。
- **FR14:** 第三方集成（国内可用）：Authing/极光（登录）、腾讯行为验证、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、n8n（异步编排）、友盟 U-Link+U-App（归因/分析）。
- **FR15:** 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。
- **FR16:** 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。
- **FR17:** 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。
- **FR18:** 多条链接粘贴：识别全部支持的小红书链接，为每条创建独立 ingest job，并以 `N/X` 队列顺序展示；输入框与 `+ / 发送` 按钮保持同一底部组件，不新建第二层导入输入。
- **FR18.1:** 导入记录与去重：灵感库展示当前用户拥有的导入记录、来源标题、解析 POI 和原始链接复制入口；记录和原始链接必须鉴权隔离。MVP 以 `user_id + normalized_url` 去重，并记录 URL normalization 规则版本；短链展开、追踪参数和 canonical URL 变化不能绕过去重。跨用户可复用计算/媒体指纹，但共享对象必须有独立 ACL、引用与删除语义，且不得泄露导入记录或批注。
- **FR19:** 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取内容/理解图文/验证地点/保存灵感；显示来源标题、安全截断、当前事实动作与 `N/X`，不显示百分比或虚假进度条；完成项按 FIFO 各自完整展示 10 秒，后续完成项等待；失败支持重试和重连。
- **FR20:** 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。
- **FR21:** 时间轴微调与全局撤销：AI 编排可按 15 分钟步进；用户通过时钟式控件最小按 1 分钟调整，快速滚动只改变灵敏度，不展示 30/60 分钟吸附提示。右上全计划控件默认显示历史图标，变更后显示 `撤销 8`；倒计时结束后仍可再撤销最近一条符合条件的操作，不在底部或单日显示“最近操作”栏。
- **FR22:** 冲突分级与后续动作：结构性无效、越权和冻结预约/票务冲突拒绝写入；营业、通勤、时长、酒店/行李等派生冲突允许形成新版本但立即触发增量校验。硬冲突阻止完善行程细节与导出，软冲突可继续但必须解释风险。
- **FR23:** AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。
- **FR24:** 导出 PNG 规格：长图固定宽度 1080 px（可选 1242 px），纵向不设上限；超图按天切片导出多张；优先 WebP，不兼容降级 JPEG（75–80%），尽量 ≤ 600 KB；导出接口支持 width_px 与 slice_by_day 参数并提供预览提示。
- **FR25:** AI 使用额度引导：AI 填充/导出相关页面显示平台额度、生成状态、导出次数或成本友好提示；额度不足或服务降级时提供明确文案、重试/稍后继续路径与可配置远程开关，不要求用户配置 Key。
- **FR26:** 规划入口：底部自然语言或目的地卡先进入 S2 旅行时间；从导入灵感进入时携带 city/place hints，但仍按 S2→S3→S4 前进，不绕过必需输入。历史 `/planner/pick` 深链需补齐缺失输入后再显示 Picker。
- **FR27:** Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。
- **FR27.1:** 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精确航班/车次、2 小时时间段或 `交给 AI 安排`。住宿按夜设置酒店且允许留空，酒店名称输入后经 AMap POI 匹配；每晚同时确认早餐与行李去向，`同上` 是用户主动确认按钮。显式选择 `交给 AI`、`留空`、`未知/未决定` 或 `同上` 均可作为对应字段已确认；从未处理的 ambiguous 初始态不能被静默当作确认并越过下一步门禁。预约、门票和 dawn/sunset/night/night-market 等特殊时段由导入证据与 Agent 推导，不设独立开关。
- **FR28:** S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐：悠闲为每天 1-3 个主要安排、较晚出发并保留较多自由时间；从容为每天 2-4 个主要安排并兼顾游览与休息；充实为优先覆盖更多地点并接受早出晚归、较多步行和换乘。默认 `从容`，但自然语言或导入证据已有明确节奏时可预选对应项，用户仍可修改。S5 不重复 S2/S3 摘要，提供默认折叠的可选“其他要求”输入，并且是唯一显示 `开始规划` 的阶段；不提供“智能编排”开关。
- **FR28.1:** 玩法与兴趣信号：从用户自然语言、导入内容及选择行为推导 `经典 / 吃喝 / 自然 / 拍照 / 古建 / 小众 / 逛街 / 展览` 等可多选兴趣信号；每个信号保留来源、时间、质量和置信度，不在 S2/S3 重复询问。无可靠证据时使用中性、多样化候选，不把推断伪装成用户确认，也不得覆盖 required、明确附加约束或 pace。
- **FR29:** Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内标题显示当前 L2。L2 仅用由子 L3 派生的非交互变色状态点和分项计数表达选择，不显示勾选框。只有 L3 页默认展开互斥 `附近 | 全城` 视角；点击/选中 L3 时地图聚焦该 POI 与附近地点，split 视角显示当前及相邻 L2，完全地图视角显示整个 L1。全城检查标题不可展开。POI 使用通用信息 Sheet，标题直接使用 POI 名称而不是“详情栏”等泛化标签，并包含地址、营业时间、评分、建议停留、来源与可选预约证据。
- **FR30:** L3 行右侧提供互斥图标意图：勾选代表 `required/必去`，Route 代表 `along_route/顺路`；再次点击活动图标可清除。吸底汇总显示 `已选必去 X` 与 `顺路去 Y`，L3 页 CTA 为 `返回全览`，全城检查 CTA 为 `下一步`。允许 0 选择，由 Agent 使用 AnchorPool/城市热门补全。
- **FR31:** Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图、L2 分项汇总和全局计数；卡片、Marker、列表和通用 POI Sheet 状态一致。`需预约` 是证据 badge，不是第三种意图，也不代表 Nomad 已完成预约。
- **FR32:** 单一可见 AI 规划：提交 S5 后，用户进入稳定的时间轴 shell，看到事实阶段、重连和降级状态；同一 shell 最终解析为完整可编辑计划。Planner 优先处理 required、证据强时段、住宿/行李与 transfer 边界，再安排 along_route 和 Agent 候选；无法落位的 required 与未采用候选进入明确的未解决/候选区。
- **FR32.1:** 内部快速降级：确定性/L2/低成本路径可在超时、配额或 Provider 故障时生成可用结果，但只作为同一规划任务的降级产物；UI 不暴露 Quick/HQ 名称、双完成版本或“切换-采用”。
- **FR32.2:** 高质量编排：平台默认使用可用的高质量 Provider 完成初始编排；后台尝试必须有 attempt fencing、版本与来源记录，不得在用户已编辑后静默覆盖当前版本。内部候选版本只有在系统安全采用或用户明确预览变更时才生效。
- **FR32.3:** 候选与模糊补全：未落位 required 必须进入带原因的未解决区；未采用的 along_route、导入地点和 Agent 候选进入带来源的候选区。缺少可靠地点时，系统按当前 owner 已有笔记 → 明示的小红书补搜 → AMap 附近搜索 → 用户确认依次补全；每步受授权、预算、超时和证据阈值控制，低置信结果不得静默落位。
- **FR33:** 规划任务可控性：内部候选、确定性编排和低成本 Provider 均受远程开关、超时、配额、熔断与 attempt fencing 控制；降级只更新同一个 PlanningJob 的事实状态，不向用户暴露 Quick/HQ 或第二份待采用结果。SSE 至少覆盖 accepted/context/constraints/candidates/arranging/validating/persisting/done/fallback/failed，埋点记录首次可行计划率、阶段耗时、fallback_rate、冲突率和未解决项数量。
- **FR34:** AnchorPool（离线锚点）：使用 city×season×tod×category 的离线池作为未选内容和零选择场景的候选来源；不可用时回退受版本管理的城市 Top-50 并记录来源与降级原因。候选准备属于 S6 同一 PlanningJob 的内部步骤，可产生事实进度事件，但不形成独立页面或第二份计划。
- **FR35:** Linked multi-city（MVP 分阶段交付）：保留 `Plan -> City` 单值关系，由 `Trip` 按顺序连接 2–3 个同一时区的 `TripSegment -> Plan`，相邻段之间使用白天直达 `TransferLeg/transfer_slot`；每个中间城市至少住宿一晚，每日最多一次跨城。Picker 可展示附近跨城 L1/L2/L3；用户在 Picker 或计划编辑中对跨城 L3 选择 required/along_route 时，先确认新增目标城市，接受后保留原意图并绑定目标 segment，再回到旅行时间/住宿设置城市日期、交通、酒店与行李；取消不得修改当前 Trip。两城确认可用反转图标调整先后，三城在 S2 明确插入位置。交接日的进站/候车/行驶/到达/出站组成一个归 Trip 所有的连续区间，分别限制上下游城市可用时间；交通草稿、未确认 AI provisional 或失败阻止联合发布。跨时区、夜间跨日交通、A-B-A 和任意复杂重排延期。
- **FR36:** 酒店槽与餐饮处理：每晚生成 hotel_slot，作为节奏、区域聚类、换住缓冲、行李处理和晚间半径的核心约束；DayN 底部固定显示，允许空白。餐饮在视觉上使用普通 POI 行，只对 `需预约` 等证据做小标注，右侧可增加更换入口；酒店早餐影响早段安排。
- **FR36.2:** 餐饮选择池与商圈召回：固定/已预约餐厅作为 `fixed_anchor`；普通餐次可为 `choice_pool`，包含一主和最多两备，候选不足时第一个空位显示 `+ 添加更多`。Planner 不机械创建早餐、午餐、晚餐和加餐四个槽；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不占时间轴，只有 fixed anchor、choice pool 或用户明确添加才创建 MealSlot。`暂不决定` 不展示固定 90 分钟承诺，旅中候选依次按当前位置最近、5km 内评分最高、可靠免排队证据、与饭后景点最近的去重补位召回。小吃街/商场等 POI 可附加无时间节点的 `附近吃什么`，只查询当前用户导入、AMap 验证且共享规范化 BusinessArea 归属的美食 POI；无可靠归属则不展示。
- **FR36.1:** 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好： 晚段靠近酒店的候选优先（near_hotel boost）； 早段靠近上一晚酒店的候选优先； 换酒店日需要加入退房/交通/寄存/入住缓冲，晚间活动半径应以当晚酒店为主； 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。
- **FR37:** 结果页（行程单）（MVP 轻编辑）：展示已完善计划的 why_short、引用来源、source_attribution、质量等级和每槽位「做什么/准备/注意」；轻编辑保存为 slot-level overrides，再次完善不得覆盖 overrides，并提供单槽恢复 AI 内容。地点或时间调整返回 S7/S8，内容完善返回 S9，之后重新进入 S10；支持导出 PNG，到达 result_sheet 视为“已完成”。`/home/tong123/work/厦门旅游规划/output/行程单_final.md` 作为导出格式与 QA fixture 参考。
- **FR38:** 平台 AI 额度与成本控制策略（v0.5 更新）：默认由平台托管 AI 调用；按用户/设备/workspace 设置每日请求、并发、导出与成本上限；每次入库、规划、AI 填充和导出均计入用量；当额度接近或达到上限时展示成本友好提示、排队/稍后重试、低成本模型或无 AI 降级路径；管理员可远程调整阈值、熔断异常用量。BYOK 仅作为 Post-MVP 可选增强。
- **FR39:** AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留文案并显式标注“注意事实核查”；前端展示引用来源短链与 why_short。
- **FR40:** 计划延续与状态（v0.3 新增）：首页增加“最近行程”入口；行程单每个槽位提供“状态按钮：打卡<>已打卡”，用于旅途期间标记；该数据为后续“自动化记忆日志/数据回流”预留。
- **FR41:** 酒店选择优先：优先使用 S3 中按住宿晚明确选择并经 AMap 匹配的酒店；用户选择留空时保持 hotel_slot 空白，不根据灵感候选静默代选酒店。仅在酒店已明确时启用 near_hotel 早/晚弱偏好。
- **FR42:** 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。
- **FR43:** 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。
- **FR44-lite:** 文本快速搜索（MVP）： 行程槽大弹窗：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含 名称/地址/距离估计；操作：加入候选｜直接落位（遵循硬约束/分段边界）。 酒店槽大弹窗：同样为文本搜索（Top-5 列表，无地图）；选择即写入 hotel_slot，同时始终提供“留空/稍后决定”。 手动录入（兜底最小化）：名称 + 地址/坐标（可选）→ 地理编码 → 入候选（低置信标记“待定位”）。 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。
- **FR45:** 用户反馈（兔小巢集成，MVP） 入口：设置页与侧边栏提供“反馈与建议”入口；结果页异常时提供二级入口。 跳转：使用官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`（注意是 product 不是 products），在内嵌 WebView 打开；若站点禁止内嵌（X-Frame-Options/CSP），回退系统浏览器。 WebView 要求：开启 JavaScript 与 DOM Storage 以保障页面正常运行。 登录态：默认不传登录态则由平台分配随机头像/昵称；如需展示本产品登录态（头像/昵称/ID），按兔小巢“产品自己的用户登录态”官方参数规范传递，最小化字段，不自研 SSO 协议。 降级：页面加载失败时，展示内置极简表单（文本+可选截图，截图上传 COS），由我们侧落库/转发，不阻断反馈闭环。 可选增强：支持自定义参数（环境/来源）、微信回复通知、Webhooks（反馈通知）、用户反馈数据 API（拉取数据）。
- **FR46:** 行程清单：日期 Tabs 横向滚动，右侧固定窄 `ListChecks` 图标与未完成数量；点击进入完整清单，分为必买目标、顺路门店和返程事项。必买目标可不绑定地点，也可关联多个经验证门店；购物区域只有本身是旅行目标时才占时间，退税、提货、机场和行李事项只有经用户确认才生成时间缓冲。底部仅显示 `+ 添加记录`；空输入时 AI 提示不可用并强调直接添加，输入后强调 AI 提示，AI 结果经用户确认才写入，直接添加始终保留原文。当前版本不承诺实时库存，也不自动触发“返程前 48 小时”提醒。
- **FR47:** 商圈归属：POI 可归属零个或多个规范化 BusinessArea，并保存来源与置信度。行政区和 L2 路线聚类不得静默等同商圈；商圈召回只能使用当前用户导入且完成 AMap 验证的 POI，无可靠归属时隐藏相关提示。
- **FR48:** 旅中定位降级：需要定位的餐饮候选只在前台和用户授权后刷新；拒绝授权、定位陈旧或无可用 fix 时，使用最近完成 POI 与下一计划 POI作为明确标注的降级基准，不上传与结果无关的连续轨迹。
- **FR49:** 阶段与转场：产品和埋点统一使用 S0–S11；自然语言输入跳过 S1，跨城选择从 S4/S8 回到 S2/S3，S6/S7 共享一个时间轴路由，S8 是可重复循环而非向导页。除 S5 外任何阶段不得显示 `开始规划`。
- **FR50:** 对话式局部调整：S7/S8 通过右下角可访问的 `AI 调整` 图标接收自然语言和上下文快捷表达；先识别槽位/行程段/单日/后续日期/整趟范围，再翻译为类型化约束。系统显示 `选择一个调整方向` 的两个简短取舍方案，确认后才预览并应用 diff，完成 Sheet 以 `做了以下调整` 说明事实变化；快捷入口不得直接执行不可逆重排。LLM 不直接写持久化 JSON，所有应用均经过 ownership、revision、idempotency、校验和全局 undo。
- **FR51:** 跨日负荷与天气上下文：每天以主要安排数、步数区间、通勤、最早出发/最晚结束和留白时间解释负荷，步数是可突破但需解释的软约束；Trip 级校验覆盖连续早起、连续高负荷、恢复时间、同行人/体力约束、换住/行李与交通缓冲。只有处于可靠预报期且携带来源、新鲜度和质量状态的天气可参与校验或 `雨天方案`；远期日期降级为季节性建议。任何天气调整必须预览确认，不静默改写计划。

**Total unique FR identifiers:** 60 (plus the FR19 parsing/cursor supplement merged above).

### Non-Functional Requirements

- **NFR1:** 国内可用三方服务优先；外部依赖需有可替代方案或降级策略。
- **NFR2:** 前后端以 SSE 展示异步进度；事件使用单调 cursor 和可恢复持久记录，客户端/服务重启后从最后确认位置重连，不把内存队列当作事实来源；MVP 不使用远程推送。
- **NFR3:** AI 安全与成本控制：平台 Provider secrets 仅在服务端管理；日志、Sentry、Langfuse 与埋点必须脱敏；对象存储私有读写与签名 URL；AI 请求具备速率限制、成本上限、异常熔断和降级策略。
- **NFR4:** 性能目标（MVP）：单一 AI 初始规划、增量校验、行程细节完善与导出分别设定并监测 P50/P95；内部降级不得造成第二套用户完成流程。
- **NFR5:** 质量指标：首次可行计划率、required 安全落位率、along_route 采用率、候选可解释率、餐饮选择池有效率、地理消歧 Top-1/Top-3 命中率、负荷估算覆盖率和跨日高负荷检出率分别设定并监测。
- **NFR6:** 可观测性：Langfuse/promptfoo/Sentry 接入完备，关键漏斗（登录→输入/导入→时间→住宿→选点→规划前确认→AI 规划→编辑/校验→行程单→导出）可埋点度量。
- **NFR7:** 合规与隐私：首屏可跳转《隐私政策/用户协议》；账号删除与数据导出流程闭环；高德版权标注规范。
- **NFR8:** 交互体验：移动端动效 120–200ms；单列布局；顶部吸顶分段；关键列表/弹窗交互流畅。
- **NFR9:** 行程细节完善不得改动日期、时间与顺序；任何重排必须走独立的可预览调整流程并生成新版本。
- **NFR10:** 初始规划安全性：不得静默突破营业、冻结时窗、住宿、transfer 或权限硬约束；失败项进入明确未解决状态，用户编辑与 AI 调整均可撤销且不得覆盖更新版本。
- **NFR11:** Linked-trip 性能与一致性：各单城市 Plan 可独立计算，但 TripRevision 必须绑定确定的 Plan/Transfer 版本；交接日、住宿与行李边界在生成、编辑和导出中保持一致。
- **NFR12:** 引用可追溯性（v0.3）：AI 输出的事实引用需可追溯到数据源（保留来源ID/时间戳/摘要）；失败时必须降级为“通用建议”。
- **NFR13:** 反爬与稳定性：Cookie 轮换、代理池、应用级限流、指数退避与 DLQ、可观测（抓取/解析/地理消歧各阶段指标）由 XHS-Downloader 负责，Nomad 项目不额外设置；失败降级为“仅媒体+待定位”，不中断后续流程；定位失败降级“待定位”可接受。
- **NFR14:** 许可与合规：第三方采集器以独立服务（HTTP）集成以避免 GPL 传染；仅保存最小必要数据；证据链（source/时间戳/摘要）与可追溯性满足 NFR12。
- **NFR15:** 反馈接入隐私与安全：默认不传登录态（平台随机头像/昵称）；如启用“产品自己的用户登录态”，遵循兔小巢官方参数规范与签名/校验要求（若有），仅传最小必要字段（不含手机号/邮箱）。站点禁止内嵌时回退系统浏览器。
- **NFR16:** WebView 配置：必须启用 JavaScript 与 DOM Storage；加载失败或 4xx/5xx 时提示重试并提供外部浏览器打开；埋点 feedback_open/submit/success/fail（含 source_page）。
- **NFR17:** LLM 提供商可替换与回退：所有编排与填充调用均通过 OpenAI 兼容接口（api_base + model）；可远程切换提供商/模型并支持按任务路由；出现失败/超时按预设顺序回退；成本/时延与错误率可观测；变更不影响前端与业务逻辑。
- **NFR18:** 定位隐私：只在旅中前台交互需要时请求定位；服务端与分析日志仅保留召回所需的最小位置上下文和粗粒度结果，不记录连续移动轨迹或在未授权时后台刷新。
- **NFR19:** Picker 状态一致性：required/along_route/unselected 在地图、L3 列表、L2 汇总、全城检查和提交 payload 中必须由同一状态源派生；返回、切换视角和弱网降级不得丢失或改变语义。
- **NFR20:** 导入所有权：导入记录、解析结果、原始链接和用户批注按 owner 隔离；共享内容指纹或缓存不得成为跨用户读取路径。
- **NFR21:** 证据诚实性：预约、免排队、商圈归属、营业事实和来源归因必须携带证据/时间戳/质量状态；未知或推断必须明确降级，不得以实时或已确认语气展示。
- **NFR22:** Trip 原子一致性：联合发布必须绑定确定的 Segment Plan、TransferLeg、Stay 和 LuggageTransition 版本；任一 transfer 无效时不得发布部分联程。
- **NFR23:** 路线与动态事实诚实性：通勤模式/时长、航班/铁路查询和天气均保留来源、观测时间、新鲜度与状态；配额、超时、歧义或陈旧时返回 unknown/provisional/seasonal 降级，客户端不得估算或把建议伪装为已购票、实时库存或实时排队。

**Total NFRs:** 23.

### Additional Requirements

- Current product authority is the 2026-08-12 Correct Course: S0-S11, one user-visible planning
  job/result, full initial scheduling, mutation-triggered validation, and detail-only Filler.
- Mobile is the target product surface. Interaction constraints include a single-column layout,
  120-200ms motion, 44pt minimum targets, WCAG AA references, map/list state preservation, and
  honest loading, reconnect, unknown and degraded states.
- MVP integrates domestic-capable auth/risk control, AMap, Tencent COS/CDN, external XHS collection,
  queues/n8n, Langfuse, promptfoo, Sentry, Umeng/U-Link and TuXiaoChao, each with privacy,
  licensing and degradation requirements.
- Data and operations require owner isolation, immutable/versioned writes, idempotency, durable SSE,
  PostgreSQL/PostGIS indexes, migration rollback, PITR, object lifecycle, DLQ, alerting, feature
  flags and redacted observability.
- Real-service staging is required for XHS extraction, AMap facts, flight/rail lookup, routing,
  weather, Provider and COS behavior; the Xiamen methodology/final itinerary is a QA fixture.
- Explicit Post-MVP exclusions include FR42 automatic hotel replanning, FR43 arbitrary history,
  cross-timezone/overnight/A-B-A/fourth-city travel, background location, live inventory/queue,
  automatic 48-hour reminders, dual initial plans, long-term preference memory, automatic booking,
  and globally shared user import records/media without a separate lifecycle design.

### PRD Completeness Assessment

The PRD contains broad functional coverage and unusually explicit safety, provenance, degradation,
privacy and state-consistency rules. Conversation-derived requirements are now represented as
numbered FR/NFR contracts rather than depending on mockups alone.

Initial clarity risks to carry into the remaining readiness checks:

1. The PRD embeds historical Story 2.0/2.1 wording and a reduced current-story summary while declaring
   the separate `epics.md` authoritative. This is understandable history but creates two story views.
2. `Accessibility: None` conflicts with the same PRD's 44pt and WCAG AA requirements.
3. NFR4/NFR5 require P50/P95 and quality metrics to be set and monitored but do not define release
   thresholds, datasets or acceptable failure budgets.
4. Technical assumptions still say `Monorepo (to be confirmed)` although the repository shape is known,
   and mention a Nest/Fastify choice where the current system is Fastify.
5. Some current-looking global interaction text still uses historical phrases such as `有骨架` and
   `加入行程/加入候选`; later authority notes prevent semantic reversal, but the PRD is not fully clean.
6. The PRD checklist placeholder remains unfilled, so this readiness report is the first formal
   post-Correct-Course completeness gate.

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement | Epic/Story Coverage | Status |
| --- | --- | --- | --- |
| FR1 | 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。 | Stories 1.1, 1.2 | Covered (MVP) |
| FR2 | 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR3 | 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR4 | 小红书入库流程（每个 ingest job 处理一条链接）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 视频按时长抽帧并先做语音检测 → 图片/关键帧二次存储至 COS（禁止热链）→ AMap 标准化与验证（判定标准 POI/坐标/文字地址/营业时间/评分/人均/电话等）→ 高置信自动入库 / 低置信标记“待定位”；前台可创建多个 job 并用 SSE 分别跟踪。 解析抽取策略（更新）：默认启用多模态 LLM（含图+文/关键帧）进行抽取；短视频（≤30 秒）应高频抽帧，长视频可按较低频率抽帧；静音或 BGM 视频跳过 ASR，含人声片段才进入 ASR；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source、source_attribution、质量等级与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。 | Story 1.3 (historical baseline); Stories 1.6, 1.7, 1.8 (target) | Covered (MVP) |
| FR4.1 | 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。 | Story 1.3 (historical baseline); Stories 1.6, 1.7, 1.8 (target) | Covered (MVP) |
| FR5 | 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR6 | 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子； `required/必去` 与 `along_route/顺路` 只在 S4 Picker 中赋予，Library 中的收藏/导入 不得静默等同任一种规划意图。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR7 | AI 初始规划：根据时间、住宿、地点意图、导入证据和节奏一次生成完整、可编辑的日计划；不得要求用户先手工摆放地点。无法安全落位的 required 项明确进入未解决/候选区域，未选内容由 Agent 适量补全。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR8 | 时间轴编辑：用户可替换、移动到前一天/后一天/其他日期、按 1 分钟精度调整开始与结束时间、删除并撤销；首末日和无其他可选日期时正确禁用移动目标。AI 生成时间允许内部按 15 分钟精度对齐。 | Story 2.2 | Covered (MVP) |
| FR9 | 增量可行性校验：初始计划必须先通过校验；用户或 AI 后续修改引入闭店、过远、超时、住宿/交通冲突时再展示冲突及可预览的修复方案，干净计划不长期占用校验卡。 | Story 2.11 | Covered (MVP) |
| FR10 | AI 行程细节完善：在已排好的计划上为所有适用槽位补充“做什么/准备什么/注意什么”、why_short、引用来源和质量等级；不得修改用户已确认的日期、时间或顺序。 | Story 3.1 | Covered (MVP) |
| FR11 | 导出行程 PNG（行程卡片）。 | Story 2.13 | Covered (MVP) |
| FR12 | 设置页：展示用户登录信息、AI 使用额度/状态、账号删除、数据导出与反馈入口；MVP 不要求用户配置自己的模型 Key。 | Stories 1.5, 3.3 | Covered (MVP) |
| FR13 | 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。 | Story 3.2 | Covered (MVP) |
| FR14 | 第三方集成（国内可用）：Authing/极光（登录）、腾讯行为验证、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、n8n（异步编排）、友盟 U-Link+U-App（归因/分析）。 | Stories 1.1, 1.3, 1.7, 1.8, 2.4, 2.5, 3.2 | Covered (MVP) |
| FR15 | 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。 | Stories 1.1, 1.2 | Covered (MVP) |
| FR16 | 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。 | Stories 1.1, 1.2 | Covered (MVP) |
| FR17 | 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR18 | 多条链接粘贴：识别全部支持的小红书链接，为每条创建独立 ingest job，并以 `N/X` 队列顺序展示；输入框与 `+ / 发送` 按钮保持同一底部组件，不新建第二层导入输入。 | Story 1.6 | Covered (MVP) |
| FR18.1 | 导入记录与去重：灵感库展示当前用户拥有的导入记录、来源标题、解析 POI 和原始链接复制入口；记录和原始链接必须鉴权隔离。MVP 以 `user_id + normalized_url` 去重，并记录 URL normalization 规则版本；短链展开、追踪参数和 canonical URL 变化不能绕过去重。跨用户可复用计算/媒体指纹，但共享对象必须有独立 ACL、引用与删除语义，且不得泄露导入记录或批注。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR19 | 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取内容/理解图文/验证地点/保存灵感；显示来源标题、安全截断、当前事实动作与 `N/X`，不显示百分比或虚假进度条；完成项按 FIFO 各自完整展示 10 秒，后续完成项等待；失败支持重试和重连。 - FR19 补充：SSE `parsing` 的当前诊断阶段为 `media_prep \| speech_detect \| frame_extract \| asr \| multimodal`，未执行的阶段可跳过，UI 仍统一显示“理解图文”。旧 `text \| ocr \| vision` 仅作为兼容事件读取，不代表恢复 text→OCR→VLM 流水线。每个事件使用单调序号和可恢复 cursor 持久化，进程重启或客户端重连后可从最后已确认事件继续。 | Story 1.3 (historical baseline); Stories 1.6, 1.7, 1.8 (target) | Covered (MVP) |
| FR20 | 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。 | Stories 1.4, 1.6 | Covered (MVP) |
| FR21 | 时间轴微调与全局撤销：AI 编排可按 15 分钟步进；用户通过时钟式控件最小按 1 分钟调整，快速滚动只改变灵敏度，不展示 30/60 分钟吸附提示。右上全计划控件默认显示历史图标，变更后显示 `撤销 8`；倒计时结束后仍可再撤销最近一条符合条件的操作，不在底部或单日显示“最近操作”栏。 | Story 2.2 | Covered (MVP) |
| FR22 | 冲突分级与后续动作：结构性无效、越权和冻结预约/票务冲突拒绝写入；营业、通勤、时长、酒店/行李等派生冲突允许形成新版本但立即触发增量校验。硬冲突阻止完善行程细节与导出，软冲突可继续但必须解释风险。 | Story 2.11 | Covered (MVP) |
| FR23 | AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。 | Story 3.1 | Covered (MVP) |
| FR24 | 导出 PNG 规格：长图固定宽度 1080 px（可选 1242 px），纵向不设上限；超图按天切片导出多张；优先 WebP，不兼容降级 JPEG（75–80%），尽量 ≤ 600 KB；导出接口支持 width_px 与 slice_by_day 参数并提供预览提示。 | Story 2.13 | Covered (MVP) |
| FR25 | AI 使用额度引导：AI 填充/导出相关页面显示平台额度、生成状态、导出次数或成本友好提示；额度不足或服务降级时提供明确文案、重试/稍后继续路径与可配置远程开关，不要求用户配置 Key。 | Stories 1.5, 3.3 | Covered (MVP) |
| FR26 | 规划入口：底部自然语言或目的地卡先进入 S2 旅行时间；从导入灵感进入时携带 city/place hints，但仍按 S2→S3→S4 前进，不绕过必需输入。历史 `/planner/pick` 深链需补齐缺失输入后再显示 Picker。 | Story 2.3 | Covered (MVP) |
| FR27 | Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input\|home_card}&rec_id={CARD_ID?}。 | Story 2.3 | Covered (MVP) |
| FR27.1 | 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精确航班/车次、2 小时时间段或 `交给 AI 安排`。住宿按夜设置酒店且允许留空，酒店名称输入后经 AMap POI 匹配；每晚同时确认早餐与行李去向，`同上` 是用户主动确认按钮。显式选择 `交给 AI`、`留空`、`未知/未决定` 或 `同上` 均可作为对应字段已确认；从未处理的 ambiguous 初始态不能被静默当作确认并越过下一步门禁。预约、门票和 dawn/sunset/night/night-market 等特殊时段由导入证据与 Agent 推导，不设独立开关。 | Story 2.3 | Covered (MVP) |
| FR28 | S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐：悠闲为每天 1-3 个主要安排、较晚出发并保留较多自由时间；从容为每天 2-4 个主要安排并兼顾游览与休息；充实为优先覆盖更多地点并接受早出晚归、较多步行和换乘。默认 `从容`，但自然语言或导入证据已有明确节奏时可预选对应项，用户仍可修改。S5 不重复 S2/S3 摘要，提供默认折叠的可选“其他要求”输入，并且是唯一显示 `开始规划` 的阶段；不提供“智能编排”开关。 | Story 2.3 | Covered (MVP) |
| FR28.1 | 玩法与兴趣信号：从用户自然语言、导入内容及选择行为推导 `经典 / 吃喝 / 自然 / 拍照 / 古建 / 小众 / 逛街 / 展览` 等可多选兴趣信号；每个信号保留来源、时间、质量和置信度，不在 S2/S3 重复询问。无可靠证据时使用中性、多样化候选，不把推断伪装成用户确认，也不得覆盖 required、明确附加约束或 pace。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR29 | Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内标题显示当前 L2。L2 仅用由子 L3 派生的非交互变色状态点和分项计数表达选择，不显示勾选框。只有 L3 页默认展开互斥 `附近 \| 全城` 视角；点击/选中 L3 时地图聚焦该 POI 与附近地点，split 视角显示当前及相邻 L2，完全地图视角显示整个 L1。全城检查标题不可展开。POI 使用通用信息 Sheet，标题直接使用 POI 名称而不是“详情栏”等泛化标签，并包含地址、营业时间、评分、建议停留、来源与可选预约证据。 | Story 2.4 | Covered (MVP) |
| FR30 | L3 行右侧提供互斥图标意图：勾选代表 `required/必去`，Route 代表 `along_route/顺路`；再次点击活动图标可清除。吸底汇总显示 `已选必去 X` 与 `顺路去 Y`，L3 页 CTA 为 `返回全览`，全城检查 CTA 为 `下一步`。允许 0 选择，由 Agent 使用 AnchorPool/城市热门补全。 | Story 2.4 | Covered (MVP) |
| FR31 | Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图、L2 分项汇总和全局计数；卡片、Marker、列表和通用 POI Sheet 状态一致。`需预约` 是证据 badge，不是第三种意图，也不代表 Nomad 已完成预约。 | Story 2.4 | Covered (MVP) |
| FR32 | 单一可见 AI 规划：提交 S5 后，用户进入稳定的时间轴 shell，看到事实阶段、重连和降级状态；同一 shell 最终解析为完整可编辑计划。Planner 优先处理 required、证据强时段、住宿/行李与 transfer 边界，再安排 along_route 和 Agent 候选；无法落位的 required 与未采用候选进入明确的未解决/候选区。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR32.1 | 内部快速降级：确定性/L2/低成本路径可在超时、配额或 Provider 故障时生成可用结果，但只作为同一规划任务的降级产物；UI 不暴露 Quick/HQ 名称、双完成版本或“切换-采用”。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR32.2 | 高质量编排：平台默认使用可用的高质量 Provider 完成初始编排；后台尝试必须有 attempt fencing、版本与来源记录，不得在用户已编辑后静默覆盖当前版本。内部候选版本只有在系统安全采用或用户明确预览变更时才生效。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR32.3 | 候选与模糊补全：未落位 required 必须进入带原因的未解决区；未采用的 along_route、导入地点和 Agent 候选进入带来源的候选区。缺少可靠地点时，系统按当前 owner 已有笔记 → 明示的小红书补搜 → AMap 附近搜索 → 用户确认依次补全；每步受授权、预算、超时和证据阈值控制，低置信结果不得静默落位。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR33 | 规划任务可控性：内部候选、确定性编排和低成本 Provider 均受远程开关、超时、配额、熔断与 attempt fencing 控制；降级只更新同一个 PlanningJob 的事实状态，不向用户暴露 Quick/HQ 或第二份待采用结果。SSE 至少覆盖 accepted/context/constraints/candidates/arranging/validating/persisting/done/fallback/failed，埋点记录首次可行计划率、阶段耗时、fallback_rate、冲突率和未解决项数量。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR34 | AnchorPool（离线锚点）：使用 city×season×tod×category 的离线池作为未选内容和零选择场景的候选来源；不可用时回退受版本管理的城市 Top-50 并记录来源与降级原因。候选准备属于 S6 同一 PlanningJob 的内部步骤，可产生事实进度事件，但不形成独立页面或第二份计划。 | Stories 1.8, 2.5 | Covered (MVP) |
| FR35 | Linked multi-city（MVP 分阶段交付）：保留 `Plan -> City` 单值关系，由 `Trip` 按顺序连接 2–3 个同一时区的 `TripSegment -> Plan`，相邻段之间使用白天直达 `TransferLeg/transfer_slot`；每个中间城市至少住宿一晚，每日最多一次跨城。Picker 可展示附近跨城 L1/L2/L3；用户在 Picker 或计划编辑中对跨城 L3 选择 required/along_route 时，先确认新增目标城市，接受后保留原意图并绑定目标 segment，再回到旅行时间/住宿设置城市日期、交通、酒店与行李；取消不得修改当前 Trip。两城确认可用反转图标调整先后，三城在 S2 明确插入位置。交接日的进站/候车/行驶/到达/出站组成一个归 Trip 所有的连续区间，分别限制上下游城市可用时间；交通草稿、未确认 AI provisional 或失败阻止联合发布。跨时区、夜间跨日交通、A-B-A 和任意复杂重排延期。 | Stories 2.6, 2.7 | Covered (MVP) |
| FR36 | 酒店槽与餐饮处理：每晚生成 hotel_slot，作为节奏、区域聚类、换住缓冲、行李处理和晚间半径的核心约束；DayN 底部固定显示，允许空白。餐饮在视觉上使用普通 POI 行，只对 `需预约` 等证据做小标注，右侧可增加更换入口；酒店早餐影响早段安排。 | Stories 2.3, 2.5 | Covered (MVP) |
| FR36.2 | 餐饮选择池与商圈召回：固定/已预约餐厅作为 `fixed_anchor`；普通餐次可为 `choice_pool`，包含一主和最多两备，候选不足时第一个空位显示 `+ 添加更多`。Planner 不机械创建早餐、午餐、晚餐和加餐四个槽；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不占时间轴，只有 fixed anchor、choice pool 或用户明确添加才创建 MealSlot。`暂不决定` 不展示固定 90 分钟承诺，旅中候选依次按当前位置最近、5km 内评分最高、可靠免排队证据、与饭后景点最近的去重补位召回。小吃街/商场等 POI 可附加无时间节点的 `附近吃什么`，只查询当前用户导入、AMap 验证且共享规范化 BusinessArea 归属的美食 POI；无可靠归属则不展示。 | Stories 1.7, 2.8, 2.9 | Covered (MVP) |
| FR36.1 | 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好： - 晚段靠近酒店的候选优先（near_hotel boost）； - 早段靠近上一晚酒店的候选优先； - 换酒店日需要加入退房/交通/寄存/入住缓冲，晚间活动半径应以当晚酒店为主； - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。 | Stories 2.3, 2.5 | Covered (MVP) |
| FR37 | 结果页（行程单）（MVP 轻编辑）：展示已完善计划的 why_short、引用来源、source_attribution、质量等级和每槽位「做什么/准备/注意」；轻编辑保存为 slot-level overrides，再次完善不得覆盖 overrides，并提供单槽恢复 AI 内容。地点或时间调整返回 S7/S8，内容完善返回 S9，之后重新进入 S10；支持导出 PNG，到达 result_sheet 视为“已完成”。`/home/tong123/work/厦门旅游规划/output/行程单_final.md` 作为导出格式与 QA fixture 参考。 | Story 3.1 | Covered (MVP) |
| FR38 | 平台 AI 额度与成本控制策略（v0.5 更新）：默认由平台托管 AI 调用；按用户/设备/workspace 设置每日请求、并发、导出与成本上限；每次入库、规划、AI 填充和导出均计入用量；当额度接近或达到上限时展示成本友好提示、排队/稍后重试、低成本模型或无 AI 降级路径；管理员可远程调整阈值、熔断异常用量。BYOK 仅作为 Post-MVP 可选增强。 | Stories 1.5, 3.3 | Covered (MVP) |
| FR39 | AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留文案并显式标注“注意事实核查”；前端展示引用来源短链与 why_short。 | Story 3.1 | Covered (MVP) |
| FR40 | 计划延续与状态（v0.3 新增）：首页增加“最近行程”入口；行程单每个槽位提供“状态按钮：打卡<>已打卡”，用于旅途期间标记；该数据为后续“自动化记忆日志/数据回流”预留。 | Story 3.4 | Covered (MVP) |
| FR41 | 酒店选择优先：优先使用 S3 中按住宿晚明确选择并经 AMap 匹配的酒店；用户选择留空时保持 hotel_slot 空白，不根据灵感候选静默代选酒店。仅在酒店已明确时启用 near_hotel 早/晚弱偏好。 | Stories 2.3, 2.5 | Covered (MVP) |
| FR42 | 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。 | Post-MVP backlog; explicitly excluded from current MVP acceptance | Dispositioned (Post-MVP) |
| FR43 | 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。 | Post-MVP backlog; explicitly excluded from current MVP acceptance | Dispositioned (Post-MVP) |
| FR44-lite | 文本快速搜索（MVP）： - 行程槽大弹窗：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含 名称/地址/距离估计；操作：加入候选｜直接落位（遵循硬约束/分段边界）。 - 酒店槽大弹窗：同样为文本搜索（Top-5 列表，无地图）；选择即写入 hotel_slot，同时始终提供“留空/稍后决定”。 - 手动录入（兜底最小化）：名称 + 地址/坐标（可选）→ 地理编码 → 入候选（低置信标记“待定位”）。 - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。 | Story 2.4 | Covered (MVP) |
| FR45 | 用户反馈（兔小巢集成，MVP） - 入口：设置页与侧边栏提供“反馈与建议”入口；结果页异常时提供二级入口。 - 跳转：使用官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`（注意是 product 不是 products），在内嵌 WebView 打开；若站点禁止内嵌（X-Frame-Options/CSP），回退系统浏览器。 - WebView 要求：开启 JavaScript 与 DOM Storage 以保障页面正常运行。 - 登录态：默认不传登录态则由平台分配随机头像/昵称；如需展示本产品登录态（头像/昵称/ID），按兔小巢“产品自己的用户登录态”官方参数规范传递，最小化字段，不自研 SSO 协议。 - 降级：页面加载失败时，展示内置极简表单（文本+可选截图，截图上传 COS），由我们侧落库/转发，不阻断反馈闭环。 - 可选增强：支持自定义参数（环境/来源）、微信回复通知、Webhooks（反馈通知）、用户反馈数据 API（拉取数据）。 | Stories 1.5, 3.3 | Covered (MVP) |
| FR46 | 行程清单：日期 Tabs 横向滚动，右侧固定窄 `ListChecks` 图标与未完成数量；点击进入完整清单，分为必买目标、顺路门店和返程事项。必买目标可不绑定地点，也可关联多个经验证门店；购物区域只有本身是旅行目标时才占时间，退税、提货、机场和行李事项只有经用户确认才生成时间缓冲。底部仅显示 `+ 添加记录`；空输入时 AI 提示不可用并强调直接添加，输入后强调 AI 提示，AI 结果经用户确认才写入，直接添加始终保留原文。当前版本不承诺实时库存，也不自动触发“返程前 48 小时”提醒。 | Story 2.10 | Covered (MVP) |
| FR47 | 商圈归属：POI 可归属零个或多个规范化 BusinessArea，并保存来源与置信度。行政区和 L2 路线聚类不得静默等同商圈；商圈召回只能使用当前用户导入且完成 AMap 验证的 POI，无可靠归属时隐藏相关提示。 | Stories 1.7, 2.9 | Covered (MVP) |
| FR48 | 旅中定位降级：需要定位的餐饮候选只在前台和用户授权后刷新；拒绝授权、定位陈旧或无可用 fix 时，使用最近完成 POI 与下一计划 POI作为明确标注的降级基准，不上传与结果无关的连续轨迹。 | Stories 2.8, 2.9 | Covered (MVP) |
| FR49 | 阶段与转场：产品和埋点统一使用 S0–S11；自然语言输入跳过 S1，跨城选择从 S4/S8 回到 S2/S3，S6/S7 共享一个时间轴路由，S8 是可重复循环而非向导页。除 S5 外任何阶段不得显示 `开始规划`。 | Stories 2.3, 2.4, 2.5, 2.7, 3.1, 2.13 | Covered (MVP) |
| FR50 | 对话式局部调整：S7/S8 通过右下角可访问的 `AI 调整` 图标接收自然语言和上下文快捷表达；先识别槽位/行程段/单日/后续日期/整趟范围，再翻译为类型化约束。系统显示 `选择一个调整方向` 的两个简短取舍方案，确认后才预览并应用 diff，完成 Sheet 以 `做了以下调整` 说明事实变化；快捷入口不得直接执行不可逆重排。LLM 不直接写持久化 JSON，所有应用均经过 ownership、revision、idempotency、校验和全局 undo。 | Story 2.12 | Covered (MVP) |
| FR51 | 跨日负荷与天气上下文：每天以主要安排数、步数区间、通勤、最早出发/最晚结束和留白时间解释负荷，步数是可突破但需解释的软约束；Trip 级校验覆盖连续早起、连续高负荷、恢复时间、同行人/体力约束、换住/行李与交通缓冲。只有处于可靠预报期且携带来源、新鲜度和质量状态的天气可参与校验或 `雨天方案`；远期日期降级为季节性建议。任何天气调整必须预览确认，不静默改写计划。 | Stories 2.5, 2.11, 2.12 | Covered (MVP) |

### Missing Requirements

None. Every PRD functional-requirement identifier has an explicit disposition in `epics.md`.
FR42 and FR43 are not counted as current-MVP implementation commitments because the PRD and epics
both explicitly defer them to Post-MVP.

### Coverage Statistics

- Total PRD FR identifiers: **60**.
- Current-MVP FR identifiers: **58**.
- Current-MVP FRs mapped to one or more implementation stories: **58 / 58 (100%)**.
- Explicitly deferred Post-MVP FRs with backlog disposition: **2** (FR42, FR43).
- All FR identifiers with a documented disposition: **60 / 60 (100%)**.
- Epic coverage-map identifiers not present in the PRD: **0**.

This is identifier-level coverage only. It does not establish that each story is independently
implementable, correctly sequenced, or backed by testable acceptance criteria; those qualities are
assessed in the following readiness steps.

## UX Alignment Assessment

### UX Document Status

**Found.** `_bmad-output/planning-artifacts/ux.md` is a 950-line approved Correct Course packet
containing the mobile UX specification, S0-S11 information architecture, component/state contracts,
Home import behavior, and an explicit prototype-coverage inventory. It clearly distinguishes current
text authority from superseded or behavior-partial images.

### Confirmed Alignment

- UX and PRD use the same S0-S11 journey, including optional S1, sole `开始规划` at S5, one
  S6/S7 timeline shell, and S8 as a repeatable edit/validation loop.
- The planning inputs, three-state Picker intent, pace selection, one visible PlanningJob, complete
  initial scheduling, mutation-triggered validation, detail-only Filler, platform-managed AI, meals,
  checklist, linked-city loopback, and evidence-honesty rules agree across UX and PRD.
- Architecture supplies matching route/state ownership, component boundaries, durable SSE,
  revisions/fencing, minute-level commands, Trip/Segment/Transfer/Stay/Luggage aggregates,
  BusinessArea membership, foreground location degradation, weather provenance, detail overrides,
  and export gates.
- The UX prototype inventory explicitly records missing states and superseded visuals, reducing the
  risk that an implementation agent treats an old image as current authority.

### Alignment Issues

1. **FR40 check-in state lacks a target architecture contract (High).** PRD and UX require recent
   trips plus per-slot `打卡 / 已打卡`, and Story 3.4 promises idempotent state separate from plan
   revisions. Architecture contains no check-in entity, command, API, ownership rule, index, or
   test contract; its S11 coverage is limited to export/location. Story 3.4 cannot be implemented
   consistently until this small but cross-layer contract is added.
2. **Accessibility scope is contradictory (Medium).** The PRD says `Accessibility: None` while the
   same PRD and UX require 44pt targets and WCAG AA behavior. UX additionally requires reduced-motion
   handling, focus return for Sheets, keyboard-safe CTAs, live-region discipline, labels, roles, and
   disabled reasons. Architecture mentions labels, keyboard and component tests, but does not fully
   carry reduced motion, focus management, or live-region behavior into its quality gates. A single
   MVP accessibility baseline is needed before UI story acceptance.
3. **Meal lock terminology can reverse required-intent semantics (Medium).** UX prototype coverage
   describes a `fixed reservation/required restaurant` as an immutable meal anchor. Elsewhere PRD
   and architecture correctly define `required` as feasibility-bound and permit immutable locks only
   for user-confirmed or independently verified reservation/ticket facts. Before Story 2.9, the UX
   wording must clarify that required intent alone is not an immutable booking lock.

### Warnings

- Several behavior-changing surfaces still lack high-fidelity state coverage: the three-mode
  arrival/departure Sheet, candidate/unresolved drawer, linked-city transfer editing and failure,
  S9/S10 citation and override flow, export preview/slicing, location denial/stale fallback, and
  multi-conflict/stale-revision recovery. The text contracts are substantial, so these are not
  automatic blockers for earlier stories, but each owning story must close or explicitly accept its
  missing visual states before UI implementation begins.
- The current visual set does not fully show both `required` and `along_route` reflected back into
  the full-city overview. The written UX/PRD contract is unambiguous and must remain the acceptance
  authority for Story 2.4.
- S11 has no current high-fidelity on-trip/check-in surface. This compounds the missing architecture
  contract and should be closed before Story 3.4 enters `ready-for-dev`.

## Epic Quality Review

### Epic Structure

| Epic | User-value assessment | Independence assessment | Result |
| --- | --- | --- | --- |
| Epic 1: Foundation, Ingest, Home, and Account Entry | Login, Home and durable inspiration deliver user value, but `Foundation` and Story 1.7 introduce a technical layer inside a broad collection of journeys. | The historical baseline is independently usable. New Story 1.7 has no visible outcome until 2.9. | Needs restructuring for new work |
| Epic 2: Planning and Editing | The overall outcome is valuable, but initial planning, editing, linked trips, location, meals, shopping, validation, AI replanning and export are several independently valuable themes rather than one coherent epic. | It can depend on Epic 1, but current export wording reaches forward into Epic 3 and several stories are technical prerequisites for later stories. | Not execution-ready |
| Epic 3: Itinerary Detail and Operations | Detail enrichment and on-trip continuation are user outcomes; observability/provider routing and compliance are operator/platform outcomes mixed into the same epic. | It may depend on Epics 1-2, but provider/quota controls placed here are already required by earlier ingest/planning stories. | Needs sequencing split |

The three top-level goals are understandable as a release narrative, but Epic 2 is effectively a
release train. Splitting initial planning, linked trips, contextual trip tools, validation/export,
and detail/operations into smaller user-value epics would make completion and retrospectives meaningful.

### Story-by-Story Assessment

Historical Stories 1.1-1.5 and 2.0-2.1 are explicitly retained as delivery records, so their
retrospective summary format is not treated as a demand to redo completed work. They must not be
used as executable specifications for corrected behavior.

| Story | Standalone user value | Dependency quality | Size/readiness |
| --- | --- | --- | --- |
| 1.6 | Yes: durable import records and a usable multi-link queue | Uses delivered ingest baseline | Oversized: durable SSE, privacy/dedupe, records and substantial mobile queue behavior in one story |
| 1.7 | Not yet: normalized geography/query is invisible until 2.9 | Technical prerequisite for 2.9 | Technical milestone; no interim user feedback loop |
| 1.8 | Yes: reliable media understanding | Enables 2.5 without depending on it | Oversized: downloader, VAD/ASR, sampling, multimodal evidence, AMap facts, interests and real staging |
| 2.2 target | Yes: precise editing and recovery | Can use historical 2.1 baseline | Target is coherent, but the active implementation story is stale and therefore unusable |
| 2.3 | Yes: short mobile planning-input flow | Uses earlier ingest facts | Epic-sized: three screens, flight/rail provider, AMap terminals/hotels, stays, breakfast, luggage and gating |
| 2.4 | Yes: express place intent with geographic context | AC9 depends on future 2.7 for cross-city confirmation | Large and contains a forbidden forward dependency |
| 2.5 | Yes: one complete initial plan | Uses 1.8, 2.3 and 2.4 | Epic-sized: job/SSE shell, orchestration, fallback/fencing, route facts, candidate expansion and day load |
| 2.6 | Not alone: aggregate/contracts cannot be used until 2.7 | Technical prerequisite for 2.7 | Big-upfront Trip/Transfer/Stay/Luggage data work |
| 2.7 | Yes: linked-city planning | Correctly follows 2.6, but inherits its non-vertical split | Epic-sized UI/provider/planner/publication workflow |
| 2.8 | Not alone: permission/context has no suggestion surface until 2.9 | Technical prerequisite for 2.9 | Better delivered as the first vertical location-aware recall slice |
| 2.9 | Yes: flexible meal planning and recall | Correctly follows 1.7 and 2.8 | Large cross-layer story; should be sliced if 2.8/1.7 are folded into it |
| 2.10 | Yes: shopping/return checklist | No forward dependency found | Large but separable; ACs need scenario decomposition |
| 2.11 | Yes: post-edit safety and repair | Correctly consumes prior editing/planning contracts | Epic-sized: mutation validation, typed fixes, load, stays, transfers, meals, route and weather provider |
| 2.12 | Yes: controlled conversational adjustment | Correctly consumes 2.2 and 2.11 | Large but sequential; AI failure/scope scenarios need explicit tests |
| 2.13 | Yes: offline/shareable itinerary | AC1 requires `applied detail overrides`, whose producer is future Story 3.1 | Forward dependency breaks Epic 2 independence unless detail is explicitly optional |
| 3.1 | Yes: executable, traceable itinerary detail | Uses completed Epic 2 | Epic-sized: enrichment, citations/quality, S9/S10 and override lifecycle |
| 3.2 | Operator value is valid | Core routing/fallback/telemetry is already referenced by 1.8/2.5 | Late cross-cutting dependency and likely repeated integration churn |
| 3.3 | User trust plus platform value | Quota/cost controls are already required by earlier jobs | Epic-sized privacy, account lifecycle, storage cleanup, quota, legal and provider compliance |
| 3.4 | Yes: recent trips and check-in | No future story dependency | Story size is reasonable, but its architecture contract is missing |

### Critical Violations

1. **The active Story 2.2 artifact contradicts the approved target.** The active file still accepts
   only D±1 and 15-minute values, exposes 30/60-minute snap choices, and implements a bottom undo
   toast plus an active-day `最近操作` row. The approved epic/PRD/UX require arbitrary valid trip-day
   destinations, one-minute user edits, no snap messaging, and one plan-global top-right
   history/`撤销 8` control. Its completed task list records the obsolete implementation, so work
   cannot resume from that file as-is.
2. **Multiple current stories are too large for one dev-agent completion.** Stories 2.3, 2.5,
   2.7 and 2.11 each combine new contracts/data, backend domain work, external providers, several
   mobile surfaces and broad real-service/E2E gates. Stories 1.8, 3.1 and 3.3 have the same risk at
   slightly smaller scale. These are epic-sized execution units, not ready-for-dev stories.
3. **Epic 2 reaches forward into Epic 3.** Story 2.13 requires applied detail overrides before
   Story 3.1 creates them. Export must either work from an unenriched current revision with optional
   detail, or the detail-aware export extension must move after Story 3.1.

### Major Issues

1. **Technical prerequisite stories violate vertical delivery.** Story 1.7, Story 2.6 and Story
   2.8 create infrastructure/contracts that produce no independently usable experience until 2.9,
   2.7 and 2.9 respectively. Re-slice around visible outcomes or add a genuine usable outcome to
   each story.
2. **Story 2.4 has a direct forward dependency on Story 2.7.** Move cross-city discovery and its
   confirmation acceptance criterion into the first linked-trip story, or provide a self-contained
   temporary boundary that does not promise the future flow.
3. **Provider routing, observability, quotas and cost controls are sequenced too late.** Stories
   1.8 and 2.5 already require fallback/circuit-breaker/cost behavior that Stories 3.2/3.3 claim to
   deliver. Define an existing baseline explicitly, move the minimum shared controls earlier, or
   move only later dashboards/policy expansion into Epic 3.
4. **All current target stories fail the BMAD acceptance-criteria form.** They use broad numbered
   prose rather than Given/When/Then scenarios, and individual stories do not cite their FR/NFR/UX
   requirement IDs. The aggregate coverage table is not a substitute for story-level traceability.
5. **Many ACs bundle several independent tests.** Examples include 1.8 AC7, 2.6 AC8 and the broad
   provider/staging clauses. A single check can pass while another behavior in the same AC fails,
   making review status ambiguous.

### Minor Concerns

- Historical and target stories share one file and similar headings. The historical labels are
  helpful, but tooling or a cold-start agent can still select obsolete 2.0/2.1 behavior unless the
  sprint queue points only to dedicated current story artifacts.
- Epic 3 mixes traveler and operator personas. This is understandable at release level but weakens
  a single epic's completion meaning.
- Repeated changes to OpenAPI, Prisma, Planner and the mobile timeline are often justified by
  incremental value, but the 2.6/2.7 and 2.8/2.9 splits create avoidable churn without an interim
  usable slice.

### Required Remediation

1. Replace or formally revise the Story 2.2 implementation artifact against the approved target,
   then re-run story validation and code review before declaring it complete.
2. Re-run epic/story decomposition for current work only. Preserve historical completion, but split
   the largest stories into single-agent vertical slices and remove forward references.
3. Make 2.13 detail-optional or sequence its detail-aware extension after 3.1; move Story 2.4's
   cross-city behavior into the linked-trip slice.
4. Fold 1.7/2.6/2.8 into user-visible vertical slices or give each a usable interim outcome.
5. Add direct FR/NFR/UX references and Given/When/Then acceptance scenarios to every newly created
   execution story. Include error, degraded, ownership, stale-revision and accessibility scenarios
   as separate criteria rather than compound completion clauses.

## Summary and Recommendations

### Overall Readiness Status

**NOT READY**

The planning packet has complete identifier-level FR disposition and strong agreement on the
intended product flow, but the executable story layer is not safe to hand to development. The
current active story describes and records completion of behavior that the approved Correct Course
explicitly replaces, several target stories exceed single-agent scope, and two stories contain
forward dependencies. Sprint Planning must remain paused until these structural defects are fixed.

### Critical Issues Requiring Immediate Action

1. **Story 2.2 must be corrected before code work resumes.** Its active implementation artifact and
   completed task record still specify 15-minute/snap/D±1/bottom-recent-action behavior, contrary to
   the approved minute-level/global-history/any-valid-day contract. Treat the existing implementation
   as a migration baseline, not as an accepted current story.
2. **The current work queue must be decomposed into single-agent vertical stories.** At minimum,
   2.3, 2.5, 2.7 and 2.11 require splitting; 1.8, 3.1 and 3.3 also need a sizing decision before they
   can become `ready-for-dev`.
3. **Remove forward dependencies.** Move Story 2.4's cross-city confirmation into the linked-trip
   delivery slice, and make Story 2.13 export work without future 3.1 details (or move the detail-aware
   export extension after 3.1).
4. **Add the missing FR40 architecture contract.** Define owner-scoped, idempotent check-in state
   separate from Plan revisions, including API, persistence, linked-trip behavior and tests.

### Recommended Next Steps

1. Re-run epic/story decomposition for the corrected target only, preserving historical completion
   records while creating smaller vertical stories with no future dependencies.
2. Rewrite the active Story 2.2 artifact from the approved epic/PRD/UX contract. Map obsolete code
   behavior to keep/change/remove tasks, add Given/When/Then acceptance criteria and requirement IDs,
   then validate the story before implementation resumes.
3. Synchronize architecture/UX quality gaps: add the FR40 check-in contract, replace
   `Accessibility: None` with a single MVP baseline, clarify that required meal intent is not an
   immutable reservation, and assign missing high-risk visual states to their owning stories.
4. Move the minimum provider routing, quota, circuit-breaker and redacted observability baseline to
   the first stories that need it; leave later dashboards and policy expansion in Epic 3.
5. Re-run Implementation Readiness. Only after all critical/major structural findings are closed
   should Sprint Planning rebuild the queue and mark the first corrected story `ready-for-dev`.

### Assessment Accounting

- Functional-requirement disposition: **60 / 60**, including 58 current-MVP mappings and two
  explicit Post-MVP deferrals.
- Documented findings and risks: **23** across PRD clarity, UX/architecture alignment, and
  epic/story execution quality. Some findings intentionally repeat one root issue at different
  contract layers.
- Critical epic/story violations: **3**, plus the high-severity missing FR40 architecture contract.

### Final Note

This is a planning-structure failure, not a product-definition failure. The Correct Course captured
the intended experience unusually well; the remaining work is to turn that broad contract into a
sequence that one development agent can implement and verify without guessing or waiting on future
stories.

**Assessment date:** 2026-08-13  
**Assessor:** Codex, BMAD Implementation Readiness workflow
