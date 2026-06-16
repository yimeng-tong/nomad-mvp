# nomad-mvp Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- 从“灵感开始”的真实旅程，完成首条端到端用例：收集（小红书）→ 筛选 → 排期（天级骨架）→ 一次性 AI 填充 → 导出 PNG。
- 解决灵感分散、地理消歧难、排期困难、临出行缺少可执行要点等核心痛点。
- 移动端优先（iOS/Android），极简风格与快速动效（120–200ms）。
- 支持 BYOK（用户自带 OpenAI Key）并安全加密存储，日志脱敏，可一键账号删除/数据导出。
- 全链路可观测（Langfuse、promptfoo、Sentry），面向国内可用三方服务与合规要求。

### Background Context
重度旅行爱好者常在小红书收集灵感，但信息分散在笔记与图片中，难以结构化并落地为可执行的行程。现有工具多从“目的地→行程”切入，忽略用户真实的“从灵感开始”的旅程。地理消歧（同名店/连锁分店）与排期编辑成本高，且临出行缺少“做什么/准备什么/注意什么”的落地细节。nomad-mvp 以“灵感→可执行”为主线，通过单条链接入库、城市聚合、天级骨架与一次性 AI 填充，帮助用户高效完成行程设计与导出。

### Change Log
| Date       | Version | Description                                                     | Author |
| ---------- | ------- | ---------------------------------------------------------------- | ------ |
| 2025-11-01 | 0.4     | VLM 默认启用并取消流水线；新增确认页；快速版 L2 编排；后台并行高质量版；连锁抑制列表；分店≤20 且主 POI 附近 2km 裁剪；餐时分割 A/B | PM     |
| 2025-10-28 | 0.3-light (MVP) | 定义 MVP 范围：保留单城/near_hotel/ResultSheet 轻编辑/FR44-lite；将多城市/自动重排/历史回滚移出本版 | PM     |
| 2025-10-28 | 0.3     | 多城市/交通/酒店槽；结果页（行程单）；BYOK 冷启动；事实引用；最近行程与打卡 | PM     |
| 2025-10-27 | 0.2     | Add AI 预布局(seed)与 AnchorPool；新增骨架生成 SSE 阶段/配额与降级；明确门控与回退 | PM     |
| 2025-10-26 | 0.1     | Initial draft (MVP-focused)                                     | PM     |

## 术语 & 输入（v0.2 新增）

- D：行程天数（整数）。
- T_commute_max：跨簇通勤上限 = D × 24 × 60 × 0.01 分钟（例：3 天≈43 分；5 天≈72 分）。
- 簇（cluster）：同城内按半径聚类的空间簇，半径 R_city（城区 1.5–2km；郊区 3–4km）。
- 槽（slot）：默认 2h 粒度的时间块。
- time_hint：用户明确指定的时间块（冻结）。
- must_go：用户标记或系统阈值认定的“必去”点。
- 其余候选：用户已选灵感但尚未落位的 POI。
- 热门锚点（anchors）：离线维护的城市×季节×时段×品类 Top-K 候选。

## 术语扩展（v0.4 补充）

- L1（区域级）：同一自然/人文连续的大区块，用于“当日同 L1 优先”的编排偏好。
- L2（编排单元）：同一片区/主题、期望 2h/4h 内可一并游览的小集合；快速版编排以 L2 为基本粒度。
- L3（单 POI）：单个标准化 POI；易变事实（如营业时间）保留在 L3 层；同一 POI 可多归属多个 L2。

## 术语扩展（v0.3 新增）

- multi_city：一次计划包含多个城市（例：上海+杭州）。
- transport_slot：城市间交通专用槽（高铁/飞机/长途车），跨城时段由其占用。
 - hotel_slot：每日住宿信息槽（仅展示当晚入住，不参与 24h/2h 编排）。
- result_sheet（行程单）：AI 填充后生成的只读结果页，用于浏览与导出。

## Requirements

### Functional Requirements (FR)
- FR1: 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。
- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- FR4: 小红书入库流程（单次仅处理一条链接）（更新）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 图片二次存储至 COS（禁止热链）→ AMap 标准化（判定标准 POI/坐标/文字地址）→ 高置信自动入库 / 低置信标记“待定位”；前台用 SSE 展示进度。
 解析抽取策略（更新）：默认启用多模态 LLM（含图+文）进行抽取；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source 与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。
 - FR4.1: 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。
- FR5: 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。
- FR6: 灵感选择页：按城市列出可勾选的“想去”条目；支持对“待定位”进行 Top-5 选择。
- FR7: 生成天级骨架：默认 2 小时/4 小时槽位（依据 pace 映射）；支持在“空槽”处弹出大弹窗，页签包含“候选抽屉（按时窗/距离/vibe 重排）｜AI 建议”，并提供“自由活动”选项。
- FR8: 时间轴编辑：长按块可替换、移动至 D±1、调时、删除；支持撤销。
- FR9: 顶部可行性校验（闭店/过远/超时）并提供一键修复方案。
- FR10: AI 一次性填充：在用户确定骨架后，对“剩余可控块”进行一次性编排，并为“所有块”补全“做什么/准备什么/注意什么”的要点；不改变时间与顺序。
- FR11: 导出行程 PNG（行程卡片）。
- FR12: 设置页：展示用户登录信息；配置 BYOK（用户自带 OpenAI Key）并加密存储；提供账号删除与数据导出。
- FR13: 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。
- FR14: 第三方集成（国内可用）：Authing/极光（登录）、腾讯行为验证、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、n8n（异步编排）、友盟 U-Link+U-App（归因/分析）。

- FR15: 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。
- FR16: 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。
- FR17: 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。
- FR18: 多条链接粘贴：自动截取第一条入队并 Toast 提示“其余请逐条粘贴”，提供“更换”入口可改选。
- FR19: 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取/解析/定位/完成；仅显示阶段与个数，不显示百分比；指数退避自动重试最多 3 次，并提供失败文案与重试按钮。
- FR19 补充：SSE 子阶段（parsing）包含 text|ocr|vision 三类事件用于埋点与排障，UI 仍合并为“解析”。
- FR20: 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。
- FR21: 骨架微调与撤销：时间微调步进 15 分钟，拖拽吸附 30/60 分钟刻度；撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条。
- FR22: 冲突分级与进入 AI 填充门控：硬冲突（无坐标/闭店/跨日不可达）需先修复并禁用进入；软冲突（略超时/通勤略远等）允许进入但顶部保留提醒与一键修复。
- FR23: AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。
- FR24: 导出 PNG 规格：长图固定宽度 1080 px（可选 1242 px），纵向不设上限；超图按天切片导出多张；优先 WebP，不兼容降级 JPEG（75–80%），尽量 ≤ 600 KB；导出接口支持 width_px 与 slice_by_day 参数并提供预览提示。
- FR25: BYOK 引导：AI 填充页顶部灰条提示“当前使用平台额度，去配置我的 OpenAI Key”；设置首页显示配置状态；首次需自带 Key 时弹一次性教育页（用途与隐私），之后不重复打扰（远程开关控制）。
- FR26: Planner Picker 入口路径：A) 底部输入解析得到 trip_params → 进入 Picker；B) 目的地卡“开始规划”→ 进入 Picker（传 city、place_hints 可选）。
- FR27: Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。
- FR27.1: 规划前确认页（Confirm）：在统一输入与进入编排之间新增确认页，字段包含：城市、出行节奏 pace（tight｜comfortable）、出行时间段（可选灵活天数；可选首尾两天到达/出发时间）、早上出发时间（用于确定 2h 起始时间槽）、是否启用“智能编排”。“智能编排”默认是；选择后将后台并行启动高质量编排（见 FR32.2）。
- FR28: Planner Picker 头部：标题“{城市} · {出行日期?占位} · {天数?占位}”；缺参以“待填写”灰字占位；右侧“修改参数”轻量 Sheet（日期选择器 + 天数步进器 + pace 可选）；返回保留来源上下文。
- FR29: Planner Picker 视图结构：顶部城市 Tabs（按与目标城市中心点“直线距离”排序；仅展示灵感量 > 1 的城市）；中部卡片列表 + 地图-卡片联动（Sheet 吸附位 High→Split→Map-Full），详情统一全高 Bottom Sheet；弱网/无地图自动降级为清单视图并提示。
- FR30: 已选篮与主按钮：吸底左“已选 N”（可展开面板：移除/必去 must_go/时段 time_hint/时长 stay_minutes_hint），右主按钮：“生成骨架”；允许在无已选时直接生成（selected_items 为空）；缺参时弹参数 Sheet 补齐后生成。
- FR31: 选点与一致性：卡片/Marker 状态一致；卡片→Map 飞行 300ms；Map→卡片滚动并“抬升”；低置信项卡片右上“去定位”入口。
- FR32: 生成骨架（部分填充 + AI 预布局，v0.2 更新）：POST /plan/generate 使用 selected_items 作为锚点；must_go/time_hint 优先落位；当启用 planner_autoplace_v1 时，对“无硬冲突”的候选按配额 quota=ceil(α×S_left)（默认 α=0.6，可远程配置）进行自动落位；selected_items 为空时，基于 AnchorPool 生成 Top-N 锚点并仅对“无硬冲突”条目落位；预布局不得引入硬冲突，软冲突不落位仅提示；预布局块需标记 origin=ai_seed，并提供 5–8 秒撤销与一键重置；未落位项进入“空槽→候选抽屉/AI 建议/自由活动”。
- FR32.1: 快速版传统编排（L2 基础）：仅编排主景点（不纳入酒店/打卡点/餐饮）；按用户 pace 将粒度映射为 2h（tight）/4h（comfortable），2.5h 阈值对齐（≤2.5h→2h，>2.5h→4h）；当天优先安排同属同一 L1 下的其他 L2；生成结果可立即使用。
- FR32.2: 高质量 LLM 编排（后台并行）：当确认页勾选“智能编排”或在天级骨架顶部手动启用时，后端后台生成高质量版本；前端先呈现快速版，顶部提示“后台正在生成高质量版本”，完成后通知用户并在顶部提供“切换-采用”入口；两版本并存直至用户确定切换。

- FR33: AI 预布局可控性（v0.2 新增）：提供远程开关 enable_ai_seed/planner_autoplace_v1；出现超时/配额/错误时自动降级为“无预布局”的骨架并提示；SSE 事件流 started→freeze→must_go→quota→candidates→place→validate→persist→done；埋点 seed_accept_rate/seed_conflict_rate/seed_time_ms/fallback_rate。

- FR34: AnchorPool（离线锚点，v0.2 新增）：使用离线 AnchorPool（city×season×tod×category）作为候选来源；不可用时回退内置 Top-50 并记录日志；进入骨架页并行 anchors.prepare 读取池并在线轻量重排，可用时可推送 anchors_ready（SSE）。

- FR35: 多城市与交通槽（Post-MVP，暂不在本版范围）：支持 multi_city 计划；当日存在跨城段时，生成 transport_slot 占用相应时段；跨城通勤约束仍采用 T_commute_max（基于总天数 D）；编排以 transport_slot 为边界分段进行，分段内独立应用配额与候选；transport_slot 不参与 AI 预布局的普通候选落位。

- FR36: 酒店槽与餐饮处理（v0.4 更新）：每日生成 hotel_slot（今晚入住酒店，仅展示，不参与 2h/4h 槽编排）；hotel_slot 在时间轴 DayN 末尾固定显示，支持“更换酒店/查看地图/预订链接/备注”；未选择时显示“待选择”。餐饮按普通槽处理（是否纳入 2h/4h 由 Planner 输出决定）。

- FR36.1: 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好：
  - 晚段靠近酒店的候选优先（near_hotel boost）；
  - 早段靠近上一晚酒店的候选优先；
  - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。

- FR37: 结果页（行程单）（MVP 轻编辑）：展示 AI 填充后的行程与每槽位建议（why_short/引用来源）；允许对每个槽位的「做什么/准备/注意」进行轻编辑（≤3×30 字/段），编辑内容保存为 slot-level overrides；再次运行 AI 填充不覆盖 overrides，并提供“恢复 AI 内容（单槽重置）”；编辑槽位需返回“天级骨架 → AI 填充 → 结果页”的循环路径或“天级骨架 ↔ 灵感页”路径；支持导出 PNG；到达 result_sheet 视为“已完成”。

- FR38: BYOK 冷启动策略（v0.3 新增）：默认提供首 10 次“导出”免费配额；每发生 1 次“入库”行为，免费次数 +1（鼓励 UGC 导入）；当免费次数 ≤ 3 时弹“入库教育”引导，免费次数 = 0 时弹出 BYOK 教育与配置入口；平台额度为默认通道，BYOK 为“可选增强”，重度用户可切换。

- FR39: AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留文案并显式标注“注意事实核查”；前端展示引用来源短链与 why_short。

- FR40: 计划延续与状态（v0.3 新增）：首页增加“最近行程”入口；行程单每个槽位提供“状态按钮：打卡<>已打卡”，用于旅途期间标记；该数据为后续“自动化记忆日志/数据回流”预留。

- FR41: 酒店选择优先（v0.3 新增）：当日仅有 1 个酒店候选时，自动写入 hotel_slot；当有多个或 0 个酒店候选时，保持空白直至用户选择；一旦选择酒店，自动启用 near_hotel 早/晚弱偏好。

- FR42: 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。

- FR43: 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。

- FR44-lite: 文本快速搜索（MVP）：
  - 行程槽大弹窗：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含 名称/地址/距离估计；操作：加入候选｜直接落位（遵循硬约束/分段边界）。
  - 酒店槽大弹窗：同样为文本搜索（Top-5 列表，无地图）；选择即写入 hotel_slot；不提供“留空”。
  - 手动录入（兜底最小化）：名称 + 地址/坐标（可选）→ 地理编码 → 入候选（低置信标记“待定位”）。
  - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。

- FR45: 用户反馈（兔小巢集成，MVP）
  - 入口：设置页与侧边栏提供“反馈与建议”入口；结果页异常时提供二级入口。
  - 跳转：使用官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`（注意是 product 不是 products），在内嵌 WebView 打开；若站点禁止内嵌（X-Frame-Options/CSP），回退系统浏览器。
  - WebView 要求：开启 JavaScript 与 DOM Storage 以保障页面正常运行。
  - 登录态：默认不传登录态则由平台分配随机头像/昵称；如需展示本产品登录态（头像/昵称/ID），按兔小巢“产品自己的用户登录态”官方参数规范传递，最小化字段，不自研 SSO 协议。
  - 降级：页面加载失败时，展示内置极简表单（文本+可选截图，截图上传 COS），由我们侧落库/转发，不阻断反馈闭环。
  - 可选增强：支持自定义参数（环境/来源）、微信回复通知、Webhooks（反馈通知）、用户反馈数据 API（拉取数据）。

### Non-Functional Requirements (NFR)
- NFR1: 国内可用三方服务优先；外部依赖需有可替代方案或降级策略。
- NFR2: 前后端以 SSE 展示异步进度；MVP 不使用远程推送。
- NFR3: BYOK 安全：采用 KMS/Envelope 加密存储；日志脱敏；对象存储私有读写与签名 URL。
- NFR4: 性能目标（MVP）：骨架生成与 AI 填充端到端 50 分位时延设定并监测（具体阈值由架构阶段细化）。
- NFR5: 质量指标：首次可行行程率≥目标值；“空槽一次添加成功率”≥目标值；地理消歧 Top-1/Top-3 命中率设定并监测（阈值由架构/评测方案细化）。
- NFR6: 可观测性：Langfuse/promptfoo/Sentry 接入完备，关键漏斗（登录→入库→选择→骨架→AI 填充→导出）可埋点度量。
- NFR7: 合规与隐私：首屏可跳转《隐私政策/用户协议》；账号删除与数据导出流程闭环；高德版权标注规范。
- NFR8: 交互体验：移动端动效 120–200ms；单列布局；顶部吸顶分段；关键列表/弹窗交互流畅。
- NFR9: AI 一次性填充不改动时间与顺序（硬约束）。
- NFR10: 预布局安全性（v0.2）：不得引入硬冲突；跨簇通勤限制遵循 T_commute_max；软冲突不落位仅提示；预布局支持撤销与一键重置。
- NFR11: 多城市与交通/酒店性能（v0.3）：多城市计划的生成时间、分段编排与导出维持既定 P50；transport/hotel 槽的生成与可视化不明显增加交互延迟。
- NFR12: 引用可追溯性（v0.3）：AI 输出的事实引用需可追溯到数据源（保留来源ID/时间戳/摘要）；失败时必须降级为“通用建议”。
- NFR13: 反爬与稳定性：Cookie 轮换、代理池、应用级限流、指数退避与 DLQ、可观测（抓取/解析/地理消歧各阶段指标）由 XHS-Downloader 负责，Nomad 项目不额外设置；失败降级为“仅媒体+待定位”，不中断后续流程；定位失败降级“待定位”可接受。
- NFR14: 许可与合规：第三方采集器以独立服务（HTTP）集成以避免 GPL 传染；仅保存最小必要数据；证据链（source/时间戳/摘要）与可追溯性满足 NFR12。
- NFR15: 反馈接入隐私与安全：默认不传登录态（平台随机头像/昵称）；如启用“产品自己的用户登录态”，遵循兔小巢官方参数规范与签名/校验要求（若有），仅传最小必要字段（不含手机号/邮箱）。站点禁止内嵌时回退系统浏览器。
- NFR16: WebView 配置：必须启用 JavaScript 与 DOM Storage；加载失败或 4xx/5xx 时提示重试并提供外部浏览器打开；埋点 feedback_open/submit/success/fail（含 source_page）。
 - NFR17: LLM 提供商可替换与回退：所有编排与填充调用均通过 OpenAI 兼容接口（api_base + model）；可远程切换提供商/模型并支持按任务路由；出现失败/超时按预设顺序回退；成本/时延与错误率可观测；变更不影响前端与业务逻辑。

## User Interface Design Goals

### Overall UX Vision
移动端单列布局，顶部吸顶分段，底部统一输入；以天级骨架与大弹窗为核心交互，保持“所见即所得”的日程编辑；极简风、快速动效，降低首次使用成本。

### Key Interaction Paradigms
- 统一输入分流（链接/自然语言）。
- 城市聚合与“待定位”轻量消歧（Top-5 候选）。
- 2 小时/4 小时槽位的天级时间轴，空槽弹窗（候选抽屉/AI 建议/自由活动）。
- 长按编辑（替换/移动/调时/删除/撤销）。
- 顶部可行性校验与一键修复。
- 一次性 AI 填充与导出 PNG。
 - 天级页面显示模式（A/B）：默认“骨架网格（2h/4h 槽）”，可试验“餐时分割”展示模式，不改变底层基于槽位的编辑/校验/导出心智。

### Core Screens and Views
- 登录首屏
- 首页（目的地卡 + 统一输入）
- 确认页（Confirm）：进入编排前收集城市/节奏 pace/出行时间段（含首尾到/离港时间可选）/早出发时间/“智能编排”开关。
- 灵感选择页（上下文灵感选择，不在“灵感库”导航中）
- 天级骨架页（2 小时/4 小时槽位 + 大弹窗 + 长按编辑）
- 天级骨架页顶部提示（高质量版后台生成）：后台任务进行时显示“正在生成高质量版”；完成后提示并提供“切换-采用”。
- AI 填充页（确认与应用）
- 导出页（PNG）
- 设置页（BYOK/账号删除/数据导出/反馈与建议）

### Accessibility
None（MVP 阶段按需评估）

### Branding
极简风格；动效 120–200ms；组件命名与工程对齐（TopSwitch/UnifiedInput/CityCard/LocationModal/PlanTimelineMobile/FixSheet 等）。

### Target Device and Platforms
Mobile Only（iOS/Android）。

## Technical Assumptions
- Repository Structure: Monorepo（待确认）。
- Service Architecture: Monolith（NestJS/Fastify 模块化：Router/Ingest/GeoResolver/Planner/Filler/Export；n8n 用于异步编排）。
- Languages/Storage: Node.js/TypeScript；PostgreSQL + PostGIS + pgvector；对象存储使用腾讯云 COS + CDN。
- Maps & Geo: 高德地图 SDK + Web API，距离矩阵/开闭店缓存 24h；去重以 canonical_url + 内容指纹。
- Realtime/Async: SSE 前台进度；服务端任务与编排通过 n8n 与队列/DLQ。
- Testing Requirements: Unit + Integration（目标：回归用例由 promptfoo/离线 A/B 支持）。
- Security: KMS/Envelope 加密 BYOK；COS 私有读写 + 签名 URL；日志脱敏。
- Observability: Langfuse、promptfoo、Sentry。
 - LLM Provider Abstraction: 统一 OpenAI 兼容调用（api_base + model），可按任务通过远程配置选择/切换不同提供商与模型；支持 BYOK 覆盖、超时/重试/限流、fallback 顺序与成本/时延埋点；所有调用接入 Langfuse 追踪。

## Epic List
- Epic 1: Foundation & Ingest & Home（基础能力与入库、首页/灵感库）
- Epic 2: Planning & Editing（天级骨架、候选抽屛、长按编辑、可行性修复、导出）
- Epic 3: AI Fill & Evaluation（一次性 AI 填充、观测评测、灰度与调优）

## Epic 1 Foundation & Ingest & Home
目标：完成登录与追踪、单条 XHS 入库链路（含 COS 二次存储与 SSE）、首页与灵感库的城市聚合与选择。

### Story 1.1 登录与首屏
As a user, I want to login via phone/SMS (and Apple on iOS if any 3rd-party login is offered), so that I can securely access the app.

Acceptance Criteria
1: 支持手机号+短信登录；iOS 若提供第三方登录需等权提供 Apple 登录；按需触发腾讯行为验证。
2: 首屏可跳转《隐私政策/用户协议》。
3: 成功登录后进入首页，埋点登录完成。

### Story 1.2 单条 XHS 入库（SSE 进度）
As a user, I want to ingest a single Xiaohongshu link asynchronously, so that my inspiration is parsed and saved (images re-hosted in COS) with visible progress.

Acceptance Criteria
1: 单次仅处理一条链接；解析抽取→COS 二次存储→高置信自动入库/低置信标记“待定位”。
2: 前台 SSE 展示入库进度；失败重试与 DLQ 策略。
3: 禁止热链，图片通过签名 URL 访问。

### Story 1.3 首页与灵感库（城市聚合/列表/选择）
As a user, I want to see destination cards aggregated by city and select inspiration items to plan, so that I can start planning from inspirations.

Acceptance Criteria
1: 首页顶部分段、目的地卡、统一输入；城市聚合与城市列表接口可用。
2: 灵感库按城市展示；“待定位”点击弹出 Top-5 候选（名称+地址），不显示置信度。
3: 选择若干“想去”条目进入规划流程。

## Epic 2 Planning & Editing
目标：通过 灵感选择页（Planner Picker）在规划上下文内快速挑选本次要用的 UGC 素材作为锚点输入，生成“部分填充”的天级骨架，并完成主要编辑与可行性修复，支持导出 PNG。

### Story 2.0 灵感选择页（Planner Picker）（上下文灵感选择）
As a planner, I want to select must-go and want-to-go inspirations in context before skeleton, so that the generator can use them as anchors to produce a partially filled day-level plan.

Acceptance Criteria
1: 入口与路由：支持路径 A（底部输入解析 trip_params）与路径 B（目的地卡“开始规划”）；/planner/pick 参数含 city/start/days/source/rec_id。
2: 头部参数：标题显示“{城市} · {出行日期?} · {天数?}”，缺参显示“待填写”；右侧“修改参数” Sheet（日期选择器/天数步进器/pace）。
3: 视图结构：城市 Tabs（按目标城市中心点直线距离排序，且仅展示灵感量>1 的城市）；卡片列表 + 地图联动（Sheet 吸附位 High→Split→Map-Full）；详情统一全高 Bottom Sheet；弱网/无地图自动降级为清单视图。
4: 已选篮与 CTA：吸底显示“已选 N | 生成骨架”；已选面板支持移除/必去 must_go/时段 time_hint/时长 stay_minutes_hint；允许 0 选生成（selected_items 可为空）。
5: 生成：缺参弹参数 Sheet；确认后 POST /plan/generate，selected_items 元素包含 item_id、可选 poi_id/must_go/time_hint/stay_minutes_hint，成功后进入骨架页。

### Story 2.1 生成天级骨架（2 小时/4 小时槽位，部分填充）
As a planner, I want to generate a day-level timeline with 2-hour/4-hour slots, so that I can quickly structure my day.

Acceptance Criteria
1: 默认 2 小时/4 小时槽位（依据 pace 映射）；must_go/time_hint 优先落位；存在 transport_slot 时，以其为边界对分段分别应用 quota 与候选；启用 AI 预布局时在 quota=ceil(α×S_left) 范围内对“无硬冲突”候选自动落位；selected_items 为空时基于 AnchorPool 生成 Top-N 锚点并仅对“无硬冲突”条目落位；未落位项进入“空槽→候选抽屉/AI 建议/自由活动”。（v0.4 更新）
2: 空槽弹出大弹窗，含“候选抽屉（按时窗/距离/vibe 重排，含‘未落位’子区）｜AI 建议｜自由活动”。
3: 预布局块标记 origin=ai_seed，提供 5–8 秒撤销与一键重置；硬冲突不落位，软冲突仅提示；生成后可进入编辑环节。（v0.2 更新）
4: 生成 hotel_slot（仅用于展示当晚住宿，不与 24h 时间轴共用）；不纳入 2h/4h 槽编排；酒店信息在结果页可见。（v0.4 更新）
5: 酒店感知软约束：晚段靠近当晚 hotel 的候选优先；早段靠近上一晚 hotel 的候选优先；该偏好仅作为排序加分，不可突破硬约束与 transport_slot 边界。（v0.3 新增）
6: 酒店选择逻辑：当日仅 1 个酒店候选时自动写入 hotel_slot；否则保持空白；当选择/更换酒店时弹窗询问是否重排（仅晚段/整日/取消），确认后执行并生成历史快照；near_hotel 仅在已选酒店时启用。（v0.3 新增）

### Story 2.2 编辑与撤销
As a planner, I want to long-press to edit blocks (replace/move D±1/retime/delete) with undo, so that I can refine my plan.

Acceptance Criteria
1: 长按块支持替换、移动至 D±1、调时、删除。
2: 撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条。
3: 时间微调步进 15 分钟，拖拽吸附 30/60 分钟刻度；跨日（23:00→01:00）正确处理。
4: 关键操作有埋点。
5: seed 块（origin=ai_seed）的移除/移动/替换与普通块一致，撤销优先覆盖最近 seed 操作。（v0.2 增补）
6: 提供“一键重置预布局”，恢复至预布局前状态（不影响“手动编辑”历史；操作有埋点）。（v0.2 增补）
7: 历史步骤管理：显示按时间的改动列表（含自动重排/酒店变更），可一键回滚到任一版本；回滚后保留回滚点快照。（v0.3 新增）

### Story 2.3 可行性校验与一键修复
As a planner, I want to see feasibility warnings (closed/too far/overtime) and one-click fixes, so that my plan becomes executable.

Acceptance Criteria
1: 顶部显示校验结果并区分硬冲突（无坐标/闭店/跨日不可达）与软冲突（略超时/通勤略远等）。
2: 提供一键修复方案（例如调整顺序/替换候选/缩短停留）。
3: 门控：存在硬冲突时禁用“进入 AI 填充”，需先修复；仅软冲突时允许进入但顶部保留提醒与一键修复入口。
4: 修复后计划无冲突或仅 1 个残留且提供可修复建议。
5: 校验包含 T_commute_max 与 open_gap_short；跨城日需校验 transport_slot 是否覆盖跨城区间；预布局阶段检测到硬冲突的候选不落位（软冲突仅提示）。（v0.3 更新）

### Story 2.4 导出 PNG
As a user, I want to export the itinerary as a PNG card, so that I can share or保存。

Acceptance Criteria
1: 导出长图：宽度 1080 px（可选 1242 px），纵向不设上限；超纹理上限时按“天”切片导出多张。
2: 格式与参数：优先 WebP，不兼容降级 JPEG（75–80%）；/export/png 支持 width_px、slice_by_day 参数并提供预览提示。
3: 操作过程与导出成功有埋点。
4: seed 标识不影响导出样式；存在冲突时允许导出但在导出前提示当前冲突状态及可修复建议（来源于 Validator 的 fix 提案：换序/替换候选/缩短停留/挪日 等）；result_sheet 提供导出入口与预览。（v0.3 更新）

## Epic 3 AI Fill & Evaluation
目标：对可控块进行一次性 AI 填充并完善观测/评测与灰度发布。

### Story 3.1 一次性 AI 填充
As a planner, I want to apply a one-shot AI fill that adds actionable details without changing time/order, so that my plan is execution-ready.

Acceptance Criteria
1: 对“剩余可控块”进行一次性编排；对所有块补全“做什么/准备什么/注意什么”。
2: 不改变时间与顺序（硬约束）。
3: 用户可一键“应用全部”。
4: 对每个槽位输出 why_short 与事实引用；若“做什么”无可用事实引用，则降级为“通用建议”模板并标注“注意事实核查”。（v0.3 新增）

### Story 3.2 观测与评测
As an operator, I want Langfuse/promptfoo/Sentry integrated, so that I can measure quality and debug issues.

Acceptance Criteria
1: Langfuse 记录提示版本与调用追踪；promptfoo 支持离线 A/B 评测。
2: 前后端接入 Sentry；关键漏斗埋点齐全。
3: 指标看板包含北极星与关键质量指标。
4: 新增 seed_accept_rate、seed_conflict_rate、seed_time_ms、fallback_rate 指标面板；anchors_ready 覆盖率≥95%；新增 multi_city 生成时延、transport/hotel 渲染耗时、result_sheet 打开/导出率；引用命中率/降级率。（v0.3 更新）

### Story 3.3 安全与合规（BYOK/KMS/隐私）
As a user, I want my BYOK to be securely stored and my privacy respected, so that I can trust the app.

Acceptance Criteria
1: BYOK 采用 KMS/Envelope 加密；COS 私有读写与签名 URL；日志脱敏。
2: 账号删除与数据导出闭环；高德版权标注规范。
3: 国内依赖具备可替代/降级策略。

## Checklist Results Report
（在用户确认输出 PRD 后，执行 pm-checklist 并于此处填入结果报告。）

## Next Steps

### UX Expert Prompt
请基于本 PRD 输出移动端信息架构与关键页面线框（登录首屏、首页、灵感选择、天级骨架/大弹窗、AI 填充、导出、设置），强调单列布局、顶部吸顶分段、统一输入与长按编辑交互。

### Architect Prompt
请基于本 PRD 产出全栈架构（Nest/Fastify 单体模块化 + Postgres/PostGIS/pgvector + COS + n8n + SSE），给出统一目录结构、模块边界（Router/Ingest/GeoResolver/Planner/Filler/Export）、API 合同、数据模型草案与异步编排/缓存策略，并细化性能/安全/NFR 目标与权衡。

## MVP Pitfalls & Decisions（必须项）

### 1) 账号与合规（首屏登录影响）
- 登录入口等权（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，且按 Apple｜手机号｜微信 排序；首屏埋点区分入口。
- 账号合并与解绑：手机号登录 + 第三方并存时的合并策略；支持解绑；同一手机号多设备并发登录的踢下线策略。
- App 内账号删除与数据导出：设置页提供“删除账号”“导出数据（JSON/ZIP）”；后台完成对象存储文件清理、埋点匿名化、Langfuse PII 清理。
- 首屏合规：可跳《隐私政策/用户协议》；埋点、U-Link 归因、定位、对象存储使用说明到位。
- 权限弹窗文案：相机/相册/定位/剪贴板（仅用户触发粘贴时读取），不打扰、可解释。
- 风控：默认不打断；命中风控或短信失败重试时触发行为验证；高峰期可远程开关切到“发送前必过”。

### 2) 统一输入与深链
- 冷启动深链/剪贴板携带 XHS 文本或口令：登录后继续原动作（保留场景上下文）。
- 无法判定：底部半高 Sheet 做二选一提示，不遮挡目的地卡/地图抓手。
- 多条链接：自动截取第一条入队并 Toast 提示“其余请逐条粘贴”，提供“更换”入口。
- 粘贴失败兜底：剪贴板权限失败时提供文案与“长按粘贴”手势引导。
- U-Link 归因：渠道、点击ID 进入首次打开/注册事件并绑定到 user_id。

### 2.1) 最近行程与侧边栏（v0.3 新增）
- 首页增加“最近行程”入口；到达 result_sheet 视为完成后进入侧边栏“已完成”。
- 行程单每槽位支持“打卡<>已打卡”，供旅途中标记与后续数据回流。

### 3) 灵感入库（XHS）流水线
- 去重：canonical_url + 内容指纹（sha256 文本+主图）。
- 图片二次存储：COS 直传签名；生成 WebP/AVIF 缩略图；禁止热链。
- 任务健壮性：n8n/队列幂等（idempotency key）、指数退避重试、DLQ；状态通过 SSE 回推前端。
- 内容安全：接入腾讯云内容安全基础能力（敏感词/违法图片）以防污染。

### 4) 地理消歧与地图配额
- Top-K 融合：高德检索 + 规则重排（城市命中 > 名称相似 > 地址包含地标 > 连锁分店优先用户常去区域）。
- 开闭店来源：优先高德；无则缓存社区/官网解析（弱一致）。
- 距离矩阵缓存：相同点对同日缓存 24h，避免配额打爆。
- 定位弹窗：模糊词 + 拼音/简称；Top-5 仅展示“名称+地址”，不展示置信度。

### 5) 规划器（骨架与 2h/4h 槽位）（v0.4更新）
- 时间粒度：默认 2h；允许 15min 微调；拖拽吸附 30/60 分钟刻度；跨日（23:00→01:00）正确处理。
- 时区：短期以内地为主；后续跨区将 plan 固化 timezone。
- 幂等编辑：插入/替换/移动/删除 API 幂等；提供 undo_token 实现撤销（撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条）。
- 可行性：输出修复选项（换时/近邻/挪日），不只是报错。 

### 5.1) 多城市与交通/酒店（v0.3 新增）
- 交通槽：跨城日生成 transport_slot 并作为分段边界；分段内各自编排与配额计算。
- 酒店槽：hotel_slot 仅用于展示当晚住宿，不参与 2h 槽编排；在时间轴 DayN 末尾固定显示，并在结果页显著展示。
- 同城连住（stickiness）：在同一城市的连续天，默认沿用前一晚酒店；当活动重心明显偏移（>R_city×k）或用户主动选择新酒店时，再进行更换并可选重排（仅晚段/整日/取消）。

-### 6) 空槽大弹窗（搜索/候选/AI 建议/自由活动）
- 顶部 AMap 文本搜索：关键字/类别，Top-5 列表（无地图）；结果以内嵌下拉展示，可加入候选或直接落位（遵循硬约束与分段边界）。
- 重排特征：时间窗贴合 > 距离 > 用户标签（vibe）> 热度；提供 ≤16 字的“为什么推荐”。
- 自由活动：不绑定坐标；通勤按前后块估算；AI 填充仅给“软建议”。
- 冷启动城市：候选 fallback 到“城市热门 UGC”，标注来源。

-### 6.1) 酒店槽大弹窗（搜索/候选/AI 推荐）
- 顶部 AMap 文本搜索（Top-5，无地图）与“候选/AI 推荐”页签；选择即写入 hotel_slot；不提供“留空”。
- 选择/更换后弹窗确认是否重排（仅晚段/整日/取消）；确认后执行并生成历史快照。

### 7) 一次性 AI 填充（终版定义）
- 目标块：仅“剩余的、可控的、非自由活动块”做编排；“所有块”都补齐「做什么/准备/注意」。
- 不改时间/顺序：不合理则返回 warnings[]（用户回骨架页处理）。
- 输出规范：做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）；超长折叠；缺少“做什么”报错并回退；后端硬裁并省略号。
- BYOK：后端代调用时 KMS 加密、脱敏日志；按 user_id 限速与用量统计。
- 追踪评测：Langfuse 记录 prompt_version、tool I/O 摘要；promptfoo 跑离线小集回归。

### 8) 数据层（Postgres + PostGIS + pgvector）
- 迁移：Drizzle/Prisma Migrate；每次迁移可回滚。
- 地理索引：POI 表 GEOGRAPHY(Point)+GiST；常用（city+半径）建立复合索引。
- 向量：中文向量统一分词/归一；L2/HNSW 索引；维度升级迁移方案。
- 备份恢复：每日全量 + 15 分钟增量（PITR）；演练恢复到新实例。

### 9) 对象存储与成本
- 生命周期：原图 180 天转低频；缩略图长期；僵尸文件清理（库无引用）。
- 安全：CDN 绑定域名；私有读写 + 时效签名 URL；防盗链。
- 批量迁移：重算缩略图/格式升级由 n8n + 函数批处理。

### 10) 观测与质量
- Sentry：前/后端；统一错误码命名（INGEST_xxx/PLAN_xxx/FILL_xxx）。
- 健康检查与告警：n8n 失败、队列堆积、第三方配额、水位告警（企业 IM 机器人）。
- 埋点一致性：友盟事件命名与属性字典文档；封装层统一上报。
- 灰度与开关：n8n/Unleash 控制“AI 填充开关”“候选数量”“是否展示自由活动”。

### 11) 法务与上架
- 第三方 SDK 清单：友盟、U-Link、Authing、极验/腾讯行为验证、高德、COS、Sentry 等。
- iOS 审核：等权 Apple 登录；“使用我的 OpenAI Key”不引导外部购买。
- 地图版权：高德 Logo/版权信息展示合规。

### 12) 运营与 Backoffice
- 轻量后台：POI 合并/纠错、常用近邻、黑名单、任务重跑。
- 城市聚合：/library/cities 增量更新与重算（SSE 刷新前端卡片数）。
- 人工兜底：低命中地理消歧样本回放，支持别名映射表维护。
 - 连锁品牌抑制列表：维护可编辑的连锁品牌抑制列表/模式配置，用于减少连锁误解析；支持线上热更新与审计。

### 13) VLM 启用与定位降级策略
- 多模态 LLM 默认启用（不再使用 text→OCR→VLM 的分级流水线）；MVP 阶段不设置并发/预算上限；仍需保留缓存与失败降级为“仅媒体+待定位”。
- 若多模态抽取仍无法提取 POI 名称，则降级为“待定位”，不阻断规划流程。

## AnchorPool（离线 POI 编排）v1（v0.2 新增）

## MVP 范围（v0.3-light）

- 包含：单城市 Planner（2h/4h 槽 + 预布局）、near_hotel 软约束（在已选酒店时）、ResultSheet 轻编辑（overrides 不被 Re‑fill 覆盖/可单槽重置）、FR44‑lite 文本搜索、导出 PNG、BYOK 冷启动。（v0.4更新）
- 不包含（Post‑MVP，仅记录为后续方向）：FR35 多城市/transport_slot 分段；FR42 酒店更换自动重排；FR43 历史步骤管理；完整地图内嵌搜索。

## Risks & Trade‑offs（MVP）

- 体验 vs 复杂度：移除自动重排/快照，避免“AI 覆盖用户调优”的挫败感，换取更低的工程复杂度与更快交付。
- 质量 vs 速度：near_hotel 为软约束，不强行改动用户手动微调；校验（FR9）补足风险提示。
- 搜索 vs 集成：采用文本 Top‑5（FR44‑lite）降低地图集成风险；保留手动录入兜底，弱网有明确提示。

- 目标：提供“现成可用”的 Top-K 热门锚点，在线仅做轻过滤与重排，保证低时延。

- 分桶维度：city × season(春/夏/秋/冬) × tod(上午/下午/夜间) × category(景点/餐饮/购物/展演/地标/亲子…)

- 数据源与处理：
  - 基础：高德/OSM/官方活动/场馆日历（营业时间、坐标、闭店日）。
  - UGC 信号：小红书灵感库统计热度/近期活跃度。
  - AI 用途（离线）：标签归类、短句 why_short（≤30 字）。

- 评分与去重（示例）：
  - score = 0.35·trend_90d + 0.25·rating_adj + 0.15·ugc_signal + 0.15·accessibility + 0.10·recency − 0.10·closure_penalty
  - 去重：按 canonical_poi；连锁多店保留多条，地理属性标注为连锁。

- 产物与存储：
  - AnchorPool(id, city_id, season, tod, category, version, generated_at, topk_json[ {poi_id, score, tags[], why_short} ])

- 刷新：可配置城市列表；每 72h 刷新一次；失败保留上一版（version 回退）。

- 在线准备（并行）：
  - 进入天级骨架页时并行 anchors.prepare(city, season, tod)，读取 AnchorPool 并在线按起点/已占用时间/通勤上限轻量重排；可通过 SSE 推送 anchors_ready。

## 天级骨架 AI 预排（在线）v1（v0.2 新增）

### 3.1 阶段流程（逐日执行）

- 事件流（SSE）：started → freeze → must_go → quota → candidates → place → validate → persist → done（各阶段回传已落位计数与剩余槽位）。

- freeze：冻结 time_hint 槽（不可改动）。

- must_go（不计入比例）：
  - 先做可行性筛选（营业覆盖 ∧ 最小时长 ∧ 簇内合理 ∧ 通勤可达），排序：紧约束（窗口窄/预约）＞日落/天气相关＞人气＞就近。
  - 与 freeze 冲突则不落位；不得挤掉已冻结槽。

- quota（自动落位配额）：
  - 令 S_left = S_total − S_hint − S_must；quota = ceil(α × S_left)（默认 α=0.6，可远程配置）。
  - 冷启动例外：若当日尚无任何落位且 S_left ≥ 1，则 quota = max(quota, 1)。
  - 若 quota ≤ 0，直接进入手动编辑。

- candidates（构建候选池）：
  - 顺序：其余候选（用户已选灵感）优先 → 同类近邻（可选）→ 热门锚点（AnchorPool）。
  - 去重：按 canonical_poi。
  - Top-K 自适应：K(d) = clamp(K_min, 3×quota + spare, K_max)，建议 K_min=6, K_max=30, spare=2。

- place（贪心落位 + 有限换位）：
  - 由高分到低分尝试放入最合适槽位；允许 1 次相邻换位以提高可行率。
  - 不跨簇通勤约束：若与相邻已落位块任一通勤时间 > T_commute_max，则判为跨簇过远→不落位（且不生成替代）。
  - 其他冲突（闭店/越界/太短）→ 跳过该候选；直到用尽 quota 或候选耗尽。

- validate：
  - 再跑快速校验：conflict ∈ {closed, overtime, too_far, open_gap_short}；跨簇过远被跳过的槽位不产出替代。

- persist：
  - 落库 PlanSlot；AI 预排的槽标 origin=ai_seed；提供 5–8s 撤销 + 撤销栈。

- done：完成提示：“已为你预排 N 个（均可修改）”。

### 3.2 打分与过滤（示例）

- 过滤器（入候选前）：营业覆盖（含午休/闭馆日）、通勤可达（步行/地铁推断）、最小时长 ≥ 45min。
- 在线打分（可解释、低延迟）：
  - relevance(c) = w_nc·near_centroid + w_nh·near_hotel + w_acc·accessibility + w_ugc·ugc_trend + w_rt·rating_adj + w_rc·recency + w_p·price_score + w_b·brand_sim + w_v·vibe_sim − w_walk·walk_penalty
  - price_score：按用户价格带高斯/分段衰减；brand_sim/vibe_sim：轻量嵌入向量余弦相似度（用户偏好向量来源于历史/已选）。
  - LLM 仅离线做标签归一/why_short，不参与在线打分。
- 指标项说明（速查）：
  - near_centroid：与当日“活动重心”的距离归一化反比得分（越近越高）。
  - near_hotel：晚段距当晚酒店、早段距上一晚酒店的距离归一化反比得分（需已选酒店）。
  - accessibility：可达性综合（地铁/公交/步行友好、路网连通性等）标准化得分。
  - ugc_trend：UGC 热度/近期活跃度指数（30–90 天窗口）。
  - rating_adj：评分校正（考虑样本量/时间衰减的加权评分）。
  - recency：信息时效性（营业/更新/活动近期度）。
  - price_score：与用户价格带匹配度（高斯或分段衰减）。
  - brand_sim：品牌/连锁/风格与用户偏好向量的相似度（余弦）。
  - vibe_sim：氛围/标签与用户偏好向量的相似度（余弦）。
  - walk_penalty：步行/通勤负担惩罚（时间/距离统一为惩罚项）。
  - diversity：多样性加分的聚合项（由 MMR、配额、连续约束共同作用产生）。
  - geo_sim：地理相似度 e^(−dist/σ)，用于 MMR 的去冗余相似度。
  - λ（mmr_lambda）：MMR 中相关性与去冗余的权衡系数（0–1）。
  - R_city：同城聚类半径阈值（城区 1.5–2km；郊区 3–4km，用于聚类/过滤）。
  - T_commute_max：跨簇通勤上限，D×24×60×0.01（min），用于可达性硬约束。
- 多样性（避免“同类/同簇”集中）：
  - MMR 贪心：score' = λ·relevance(c) − (1−λ)·max_sim(c, S_selected)，λ≈0.7 可配；sim 可综合类别相似与地理相似 geo_sim=exp(−dist/σ)。
  - 配额/连续约束：max_slots_per_cluster、max_same_category_run（如 ≤2 连续）。
- 示例：score_base = 0.35·near_cluster + 0.25·popularity + 0.20·time_fit + 0.15·diversity − 0.05·walk_penalty；其余候选 +0.2 偏置；AnchorPool 以离线 score 为起点。

### 3.3 远程配置（Unleash/Env）

- planner_autoplace_v1（总开关）
- alpha_autoplace = 0.6（配额系数）
- K_min=6, K_max=30, K_multiplier=3, K_spare=2
- cluster_radius_city = 1500–2000(m)；cluster_radius_suburb = 3000–4000(m)
- commute_factor_pct = 0.01（构成 T_commute_max）
- arrival_day_factor = 0.7（到/离港日可选系数）
 - hotel_stickiness_enabled = true（同城连住）
 - stickiness_k = 1.5（当活动重心距酒店 > R_city×k 可提示更换）
 - mmr_lambda = 0.7，max_slots_per_cluster=2，max_same_category_run=2
 - hotel_S_min = 0.6（AnchorPool 酒店最低得分阈值）
 - search_topk = 5（AMap 文本搜索返回 Top-K）

## 关键边界与降级（v0.2 新增）

- 最小时隙：open_gap_short（<45min）不自动落位。
- AnchorPool 不可用：回退到内置静态 Top-50；记录日志。

## 后端职责（按用户旅程拆分）
- Router（意图识别）：识别 xhs_link | trip_params | unknown；解析自然语言行程 {city, start_date(ISO), days, pace?}，输出结构化 JSON 供前端路由。
- Ingestor（小红书入库，更新）：拉取与解析；默认采用多模态 LLM 图文抽取生成“POI 名称候选 + 作者评价线索（如有）”，输出 evidence 与置信度；触发 GeoResolver 标准化；按阈值高置信入库、低置信“待定位”。
- Ingestor（采集与解析策略补充，更新）：允许通过外部采集服务（如 XHS-Downloader HTTP API）获取作品与媒体 URL（仅走 API，不嵌入其 GPL 代码）；统一走多模态抽取路径；媒体统一二次存储至 COS，禁止热链。
- Library（灵感库）：城市聚合；按 城市/标签/定位状态 过滤列表。
- GeoResolver（地理消歧，更新）：AMap/Places 检索、去重、融合重排；维护 CanonicalPOI；距离矩阵/开闭店时间；当无法确定具体分店时检索≤20 家并按“主 POI 附近 2km”裁剪，仅保留 2km 内分店。
- AnchorPool（离线锚点，v0.2 新增）：周期性产出 city×season×tod×category 的 Top-K；服务 anchors.prepare(city, season, tod) 在线轻量重排并可通过 SSE 推送 anchors_ready；不可用则回退内置 Top-50（记录日志）。
- Planner（骨架/校验/编辑）：根据 {city,start_date,days,pace?,selected_items[]} 生成骨架（默认 2h）；支持 AI 预布局（started→freeze→must_go→quota→candidates→place→validate→persist→done）；Validator 检测冲突；编辑 API 幂等。（v0.2 更新）
- Planner（新增）：快速版传统编排（L2 基础，仅主景点；pace→2h/4h；2.5h 阈值对齐；同 L1 优先）。
- Planner（新增）：高质量 LLM 编排后台任务（SSE/轮询状态），完成后返回与快速版可二选一的版本。
- Filler（AI 一次性）：仅“剩余可控非自由活动块”编排；为所有块补齐说明；输出 warnings[]。
- Export（导出）：将富行程生成 PNG（后续可拓展 PDF/链接）。
 - FeedbackLink（反馈会话）：生成官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}` 供前端打开；若开启“产品自己的用户登录态”，按兔小巢官方参数规范拼接并进行所需签名/校验（如官方要求）；失败降级为内置轻表单（文本 + 可选截图上传 COS）。

## 设计风格（情感与原则）
- 向往 Awe/Wanderlust：大幅、自然光、留白与呼吸感，激发行动。
- 陪伴 Companion：温柔、具体、不过度指挥；信息不过载。
- 可靠 Trust & Doable：清晰时间轴、通勤标注、可撤销，传达“能落地”。
- 秩序中的自由 Frame for Freedom：结构与自由并存（2h/4h 槽位 + 自由活动）。
- 当下感 Here & Now：快速、克制的微动效，地图卡片实时联动。

## 全局框架与交互（摘要）
- 顶部吸顶分段：旅行规划 | 灵感库；切换保留输入内容与焦点。
- 左上侧边栏：最近规划（已完成|未完成）。
- 底部统一输入：占位文案“粘贴小红书分享链接，或输入：杭州 11/2 起 3天”。
- 首页目的地卡：开始规划/查看灵感；不额外提示条。
- 灵感选择页：双栏大图 feed；底部“已选 N / 生成骨架”；可空选继续。
- 天级骨架页：Tabs D1..Dn；时间线按 2h/4h 槽；“空槽”大弹窗（候选/AI 建议/自由活动）；长按编辑；主 CTA=进入 AI 填充。
- AI 填充页：预览只读；“应用全部”写回 notes/attachments；失败与降级策略。

## 地图-卡片联动（Map-to-Action Bridge，MVP 摘要）
- 同屏完成信息与行动：上地图层（懒加载、cluster、LQIP），下卡片抽屉（Sheet 吸附位：High→Split→Map-Full）。
- 联动规则：卡片滚动高亮对应 Marker；点击 Marker 滚到对应卡片并微放大。
- 行动桥策略：有骨架→“加入 D{n}·{时段}”；无骨架→“加入候选”。
- 叠加层：UGC POI 层、可达圈（10/20/30 分）、热门拍照点热度圈；半径切换 + 类目筛选。
- 手势优先与性能：抓手区、地图优先；地图进入 Split 再加载；骨架屏统一样式。

## 微文案（关键处）
- 统一输入：粘贴小红书分享链接，或输入：杭州 11/2 起 3天
- 灵感选择：勾选想去；也可直接跳过生成
- 空槽占位：空闲 · 2h
- 添加成功：已添加 · 撤销
- 冲突提醒：与 14:00 的安排重叠 · 试试 15:00 或缩短 30 分钟
- CTA 说明：当所有天的骨架确定后，再进行智能填充
- AI 顶部：一次性编排剩余可控非自由活动块，并为每个块补齐做法/准备/注意
- 应用完成：已应用到行程，可在时间线查看详情
 - 预布局提示（v0.2）：已为你预排 N 个推荐点（均可修改）
 - 预布局撤销（v0.2）：已应用 · 撤销 · 重置

## AI Workflow 编排（概述）
Router → (HomeInput.parseQuery) → Planner Picker → Planner(seed: started→freeze→must_go→quota→candidates→place→validate→persist→done；multi_city: transport_slot 分段编排) → (SlotSuggester/Validator/Explainer) → Filler → ResultSheet；（v0.3 更新）
GeoResolver & CandidateRanker & AnchorPool 贯穿地理与候选重排；Validator 输出可修复建议供导出前提示；near_hotel 作为 place 阶段的排序加分参与。（v0.3 更新）

- 并行路径（v0.4）：Quick（L2 传统编排）先呈现；HQ（高质量 LLM 编排）后台生成，完成后提示并可“切换-采用”。

## Note Card/Hero 规格（摘要）
- 笔记卡：4:5 大图+标题+标签；最小点击区 44×44pt；状态 default/pressed/added。
- CTA 一致性：卡片右下固定“加入行程/加入候选”；已加入态按钮与底色轻反馈；长按为加速操作。
- Hero：首屏 1 列 Hero + 下方 2 列瀑布；主 CTA 动词开头；LQIP + 渐进清晰；可达性满足 WCAG AA。

## PRD v0.4 变更摘要

- 新增
  - FR27.1 规划前确认页（城市/pace/时间段/早出发/智能编排）
  - FR32.1 快速版传统编排（L2 基础，仅主景点；pace→2h/4h；2.5h 阈值对齐；同 L1 优先）
  - FR32.2 高质量 LLM 编排后台并行与“切换-采用”
  - FR4.1 连锁与分店规则：可编辑连锁抑制列表；当不确定分店时检索≤20 并按主 POI 附近 2km 裁剪
  - UI：新增“确认页”；天级“餐时分割”A/B 显示模式；后台生成提示与切换
  - Backoffice：连锁品牌抑制列表（可编辑/热更新/审计）
  - AI Workflow：并行路径 Quick/HQ
  - 技术假设：LLM Provider 抽象（OpenAI 兼容：api_base + model，可远程切换/回退，BYOK 覆盖，Langfuse 追踪）

- 修改
  - FR4 改为“异步获取 → 多模态 LLM 图文抽取 → COS 二存 → AMap 标准化”；保留 SSE
  - 解析抽取策略改为“默认多模态、取消 text→OCR→VLM 流水线”
  - VLM 策略：默认多模态；不设并发/预算上限；失败降级“仅媒体+待定位”
  - 后端职责：Ingestor/GeoResolver/Planner 调整为新流程（含分店≤20 & 2km 裁剪、Quick/HQ 双路）
  - UI：Core Screens/Key Interaction 增补相关条目

- 删除
  - 移除 text→OCR→VLM 的分级流水线描述与相关门控
  - 清理“叠加打卡加时并裁档”旧描述（如有）

## PRD v0.3 变更摘要

- 多城市/交通/酒店
  - 支持 multi_city；以 transport_slot 为分段边界，分段内独立配额与编排（FR35）。
  - hotel_slot 统一为“仅展示，不参与编排”，固定在 DayN 末尾与结果页展示（FR36）。
  - 引入酒店感知的软约束：早/晚段 near_hotel 排序加分，不突破硬约束与分段边界（FR36.1）。
  - 酒店选择逻辑：当日仅 1 个酒店候选自动写入；多个/0 个则留空直至选择；选择/更换酒店时弹出“是否重排（仅晚段/整日/取消）”确认（FR41–FR42；Story 2.1 AC6）。

- 结果页（行程单）
  - 新增只读 ResultSheet；导出入口前展示 Validator 的修复建议；编辑回路“天级骨架 → AI 填充 → 结果页”（FR37，2.4）。
  - Workflow 调整为 Filler → ResultSheet，更贴近 UI 流。

- BYOK 冷启动
  - 首 10 次免费导出；每次“入库”+1 免费；≤3 弹入库教育，=0 弹 BYOK 配置；平台额度默认、BYOK 可选（FR38）。

- 事实引用与提示
  - AI 输出需附来源；若“做什么”无可用来源，则保留文案并标注“注意事实核查”；NFR12 要求引用可追溯性（FR39，NFR12，3.1）。

- 最近行程与打卡
  - 首页“最近行程”、侧边栏“已完成”；行程单槽位“打卡<>已打卡”（FR40，2.1）。

- 清理与一致性
  - 去除“骨架侧栏”表述；统一 hotel_slot 定义；删除“<2h 合并”描述；补充 near_hotel 加分；校对导出前修复建议来源为 Validator。
  - 增加历史步骤管理，支持回滚到任意快照（FR43）。

- 交互强化
  - 大弹窗统一加入顶部 AMap 搜索：行程槽（搜索/候选/AI/自由活动）、酒店槽（搜索/候选/AI）；搜索结果以内嵌下拉展示（FR44，6/6.1）。




### PR 变更摘要（PRD v0.2）
版本: 0.2（2025-10-27）
主要变化
新增“术语 & 输入”：D、T_commute_max、cluster、slot、time_hint、must_go、Anchor 定义。
新增 AnchorPool（离线 POI 编排）v1：city×season×tod×category 分桶；离线产出 Top-K；前端进入骨架页并行 anchors.prepare，SSE anchors_ready；不可用回退 Top-50。
新增“天级骨架 AI 预排（在线）v1”：SSE 阶段 started→freeze→must_go→quota→candidates→place→validate→persist→done；配额 quota=ceil(α×S_left)，默认 α=0.6；冷启动强制至少 1 个；候选构建顺序（用户候选→近邻→AnchorPool）；贪心落位+一次换位；硬冲突不落位；persist 标记 origin=ai_seed，支持 5–8s 撤销与一键重置。
FR/NFR 更新
FR32 更新为“部分填充 + AI 预布局”；FR33（预布局可控性/开关/降级/埋点）；FR34（AnchorPool作为候选来源）。
NFR10（预布局安全性）：硬冲突禁止、T_commute_max 约束、软冲突仅提示、撤销与重置。
Story 2.1 AC 更新：覆盖预布局配额、空选 AnchorPool 补位、seed 撤销/重置与门控。
后端职责与 AI Workflow 扩展：新增 AnchorPool、Planner seed 阶段与 SSE 事件；Workflow 文本反映 seed 阶段。
边界与降级：open_gap_short<45min 不落位；AnchorPool 不可用回退 Top-50。
兼容性与风险
保持一次性 AI 填充“不可改时间/顺序”的硬约束。
预布局仅作为 seed，不替代后续 AI 填充。
配额、阈值、回退策略由远程开关控制，支持灰度与A/B。
验收要点
seed_accept_rate/seed_conflict_rate/seed_time_ms/fallback_rate 可观测。
SSE 事件完整性与 UI 落位可见性。
硬/软冲突判定与门控准确性。