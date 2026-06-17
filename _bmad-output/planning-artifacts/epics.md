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
---

# nomad-mvp - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for nomad-mvp, decomposing requirements from the PRD, UX design, architecture, and supplemental Epic 2/3 tech specs into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。
- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- FR4: 小红书入库流程（单次仅处理一条链接）（更新）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 图片二次存储至 COS（禁止热链）→ AMap 标准化（判定标准 POI/坐标/文字地址）→ 高置信自动入库 / 低置信标记“待定位”；前台用 SSE 展示进度。 解析抽取策略（更新）：默认启用多模态 LLM（含图+文）进行抽取；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source 与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。
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
- FR19 补充: ：SSE 子阶段（parsing）包含 text|ocr|vision 三类事件用于埋点与排障，UI 仍合并为“解析”。
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
- FR36.1: 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好： - 晚段靠近酒店的候选优先（near_hotel boost）； - 早段靠近上一晚酒店的候选优先； - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。
- FR37: 结果页（行程单）（MVP 轻编辑）：展示 AI 填充后的行程与每槽位建议（why_short/引用来源）；允许对每个槽位的「做什么/准备/注意」进行轻编辑（≤3×30 字/段），编辑内容保存为 slot-level overrides；再次运行 AI 填充不覆盖 overrides，并提供“恢复 AI 内容（单槽重置）”；编辑槽位需返回“天级骨架 → AI 填充 → 结果页”的循环路径或“天级骨架 ↔ 灵感页”路径；支持导出 PNG；到达 result_sheet 视为“已完成”。
- FR38: BYOK 冷启动策略（v0.3 新增）：默认提供首 10 次“导出”免费配额；每发生 1 次“入库”行为，免费次数 +1（鼓励 UGC 导入）；当免费次数 ≤ 3 时弹“入库教育”引导，免费次数 = 0 时弹出 BYOK 教育与配置入口；平台额度为默认通道，BYOK 为“可选增强”，重度用户可切换。
- FR39: AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留文案并显式标注“注意事实核查”；前端展示引用来源短链与 why_short。
- FR40: 计划延续与状态（v0.3 新增）：首页增加“最近行程”入口；行程单每个槽位提供“状态按钮：打卡<>已打卡”，用于旅途期间标记；该数据为后续“自动化记忆日志/数据回流”预留。
- FR41: 酒店选择优先（v0.3 新增）：当日仅有 1 个酒店候选时，自动写入 hotel_slot；当有多个或 0 个酒店候选时，保持空白直至用户选择；一旦选择酒店，自动启用 near_hotel 早/晚弱偏好。
- FR42: 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。
- FR43: 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。
- FR44: -lite: 文本快速搜索（MVP）： - 行程槽大弹窗：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含 名称/地址/距离估计；操作：加入候选｜直接落位（遵循硬约束/分段边界）。 - 酒店槽大弹窗：同样为文本搜索（Top-5 列表，无地图）；选择即写入 hotel_slot；不提供“留空”。 - 手动录入（兜底最小化）：名称 + 地址/坐标（可选）→ 地理编码 → 入候选（低置信标记“待定位”）。 - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。
- FR45: 用户反馈（兔小巢集成，MVP） - 入口：设置页与侧边栏提供“反馈与建议”入口；结果页异常时提供二级入口。 - 跳转：使用官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`（注意是 product 不是 products），在内嵌 WebView 打开；若站点禁止内嵌（X-Frame-Options/CSP），回退系统浏览器。 - WebView 要求：开启 JavaScript 与 DOM Storage 以保障页面正常运行。 - 登录态：默认不传登录态则由平台分配随机头像/昵称；如需展示本产品登录态（头像/昵称/ID），按兔小巢“产品自己的用户登录态”官方参数规范传递，最小化字段，不自研 SSO 协议。 - 降级：页面加载失败时，展示内置极简表单（文本+可选截图，截图上传 COS），由我们侧落库/转发，不阻断反馈闭环。 - 可选增强：支持自定义参数（环境/来源）、微信回复通知、Webhooks（反馈通知）、用户反馈数据 API（拉取数据）。

### NonFunctional Requirements

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

### Additional Requirements

- Architecture v0.4 is authoritative through `docs/architecture/index.md`; the root architecture stub and deprecated v0.3 archive are not implementation sources.
- OpenAPI is the API SSOT at `docs/api/openapi.yaml`; generated types live in `packages/types/src/api-types.ts` and must be regenerated, not hand-edited.
- Backend MVP is a Fastify/TypeScript ESM service under `apps/server/src`; current routes include auth, BYOK, account export/delete, plan generation SSE, AI fill SSE, and PNG export placeholders.
- Data model source is `packages/prisma/schema.prisma` plus SQL docs under `docs/db`; Postgres/PostGIS/pgvector are assumed by architecture.
- Epic 2 tech spec defines Planner Picker, Quick/HQ generation, slot editing, feasibility repair, and export expectations.
- Epic 3 tech spec defines one-shot AI fill, citations, observability/evaluation, Provider fallback, BYOK, and privacy/compliance expectations.

### UX Design Requirements

- UX-DR1: 移动端单列布局，触控目标不小于 44pt，关键动效保持 120-200ms。
- UX-DR2: 首页以“旅行规划｜灵感库”顶部分段和统一输入为主路径，无法判定输入时用半高 Sheet 二选一。
- UX-DR3: Confirm 页必须收集城市、pace、时间段、早出发时间与智能编排开关，智能编排默认开启。
- UX-DR4: Picker 需支持城市 Tabs、卡片与地图联动、已选篮、参数缺失补齐和弱网清单降级。
- UX-DR5: Skeleton 以 2h/4h 槽位为心智，显示 HQ 后台状态，并在完成后提供“切换-采用”。
- UX-DR6: 空槽大弹窗包含候选抽屉、AI 建议与自由活动，候选理由简短可解释。
- UX-DR7: 冲突校验顶部可见，硬冲突阻止进入 AI Fill，软冲突允许继续但保留提醒。
- UX-DR8: 长按编辑、撤销、最近操作与历史回滚路径需要保持可发现且不打断主流程。
- UX-DR9: AI Fill 输出“做什么/准备/注意”必须可读、可折叠、支持引用与结果页轻编辑。
- UX-DR10: 导出 PNG 需先给预览和冲突提示，超长按天切片。
- UX-DR11: Settings 包含 BYOK、账号删除、数据导出和反馈入口，隐私风险解释前置。
- UX-DR12: 地图不可用、HQ 失败、XHS 入库失败和 Provider 回退都必须有用户可理解的降级文案。

### FR Coverage Map

- FR1: Epic 1 - Story 1.1
- FR2: Epic 1 - Story 1.4
- FR3: Epic 1 - Story 1.4
- FR4: Epic 1 - Story 1.3
- FR4.1: Epic 1 - Story 1.3
- FR5: Epic 1 - Story 1.4
- FR6: Epic 1 - Story 1.4
- FR7: Epic 2 - Story 2.1
- FR8: Epic 2 - Story 2.2
- FR9: Epic 2 - Story 2.3
- FR10: Epic 3 - Story 3.1
- FR11: Epic 2 - Story 2.4
- FR12: Epic 1 / Epic 3 - Stories 1.5 and 3.3
- FR13: Epic 3 - Story 3.2
- FR14: Cross-epic - Stories 1.3, 2.1, 3.2, 3.3
- FR15: Epic 1 - Story 1.1
- FR16: Epic 1 - Story 1.1
- FR17: Epic 1 - Story 1.4
- FR18: Epic 1 - Story 1.3
- FR19: Epic 1 - Story 1.3
- FR19 补充: Epic 1 - Story 1.3
- FR20: Epic 1 - Story 1.4
- FR21: Epic 2 - Story 2.2
- FR22: Epic 2 - Story 2.3
- FR23: Epic 3 - Story 3.1
- FR24: Epic 2 - Story 2.4
- FR25: Epic 1 / Epic 3 - Stories 1.5 and 3.3
- FR26: Epic 2 - Story 2.0
- FR27: Epic 2 - Story 2.0
- FR27.1: Epic 2 - Story 2.0
- FR28: Epic 2 - Story 2.0
- FR29: Epic 2 - Story 2.0
- FR30: Epic 2 - Story 2.0
- FR31: Epic 2 - Story 2.0
- FR32: Epic 2 - Story 2.1
- FR32.1: Epic 2 - Story 2.1
- FR32.2: Epic 2 - Story 2.1
- FR33: Epic 2 - Story 2.1
- FR34: Epic 2 - Story 2.1
- FR35: Epic 2 - Story 2.1
- FR36: Epic 2 - Story 2.1
- FR36.1: Epic 2 - Story 2.1
- FR37: Epic 3 - Story 3.1
- FR38: Epic 1 / Epic 3 - Stories 1.5 and 3.3
- FR39: Epic 3 - Story 3.1
- FR40: Epic 3 - Story 3.4
- FR41: Epic 2 - Story 2.1
- FR42: Epic 2 - Story 2.1
- FR43: Epic 2 - Story 2.2
- FR44: Epic 1 - Story 1.4
- FR45: Epic 1 / Epic 3 - Stories 1.5 and 3.3

## Epic List

### Epic 1: Foundation, Ingest, Home, and Account Entry
Users can authenticate, bring in a single inspiration link, review city-grouped inspirations, and reach the basic account/settings surfaces needed to trust the product.

**FRs covered:** FR1, FR2, FR3, FR4, FR4.1, FR5, FR6, FR12, FR14, FR15, FR16, FR17, FR18, FR19, FR19 补充, FR20, FR25, FR38, FR44, FR45

### Epic 2: Planning and Editing
Users can confirm trip parameters, select inspirations in context, generate a day-level skeleton, edit and repair it, and export the itinerary.

**FRs covered:** FR7, FR8, FR9, FR11, FR21, FR22, FR24, FR26, FR27, FR27.1, FR28, FR29, FR30, FR31, FR32, FR32.1, FR32.2, FR33, FR34, FR35, FR36, FR36.1, FR41, FR42, FR43

### Epic 3: AI Fill, Evaluation, and Trust
Users can enrich a confirmed skeleton with actionable AI details while operators can observe quality, evaluate prompts, and maintain security/compliance controls.

**FRs covered:** FR10, FR12, FR13, FR23, FR25, FR37, FR38, FR39, FR40, FR45

## Epic 1: Foundation, Ingest, Home, and Account Entry

Goal: establish the trustable starting surface for the inspiration-to-plan journey, reusing the existing Fastify backend where present and adding only the data/contracts each story needs.

### Story 1.1: Login Session and Compliance Contract

As a traveler,
I want a reliable phone-login session contract with compliance metadata,
So that the mobile login screen can authenticate me without inventing a separate auth stack.

**Acceptance Criteria:**

**Given** the current Fastify server already has `/auth/otp/start`, `/auth/otp/verify`, `/me`, `/sessions`, `/logout`, and `/sessions/:id`
**When** this story is implemented
**Then** those existing routes are hardened or extended in place rather than duplicated in a new auth service
**And** response shapes are documented in OpenAPI and generated types are refreshed.

**Given** a user requests an OTP with a valid phone number
**When** risk signals do not require captcha
**Then** the API returns retry timing and `captcha_required=false`
**And** invalid bodies return the standard error envelope.

**Given** risk policy or repeated failure requires verification
**When** the user requests an OTP
**Then** the API can require Tencent Captcha through a feature flag or env-backed policy without changing client contracts.

**Given** OTP verification succeeds
**When** the session is established
**Then** the server sets an httpOnly session cookie, `/me` returns the authenticated user id, logout clears the cookie, and no phone/OTP values are logged.

**Given** the login entry is displayed by the future mobile UI
**When** iOS third-party login is offered
**Then** Apple, phone, and WeChat entry points can be rendered with equal weight and privacy/user-agreement links are available from configuration.

### Story 1.2: Mobile Login First Screen

As a traveler,
I want a mobile-first login screen with equal entry options and privacy links,
So that I can enter the app with clear trust signals.

**Acceptance Criteria:**

**Given** the mobile app shell exists in the monorepo
**When** the login screen renders
**Then** it follows the UX spec for 44pt touch targets, mobile-only layout, and 120-200ms transitions.

**Given** Apple/phone/WeChat login options are enabled
**When** the screen renders on iOS
**Then** all enabled options are equal size and ordered Apple, phone, WeChat.

**Given** a user chooses phone login
**When** they submit phone and OTP
**Then** the screen uses the backend auth contract from Story 1.1 and handles captcha-required, retry-after, success, and session-expired states.

**Given** the user wants compliance details
**When** they tap privacy or user agreement links
**Then** the links open without blocking the login flow.

### Story 1.3: Single XHS Ingest with SSE Progress

As a traveler,
I want to paste one Xiaohongshu link and see parsing progress,
So that my inspiration is saved with media re-hosting and location status.

**Acceptance Criteria:**

**Given** a share text contains multiple links
**When** ingest starts
**Then** only the first XHS link is queued and the user receives copy explaining that others should be pasted one by one.

**Given** an ingest job is created
**When** the backend processes it
**Then** it follows async fetch, multimodal extraction, COS re-hosting, AMap standardization, and high-confidence auto-save or pending-location fallback.

**Given** ingest progress is streamed
**When** the client listens to SSE
**Then** states include created, fetching, parsing, geo, storing, done, and parsing sub-stages can emit text/ocr/vision for diagnostics while UI still shows a single parsing state.

**Given** a chain or branch is ambiguous
**When** AMap returns multiple candidates
**Then** the chain suppression list and <=20 branch search with 2km crop around main POI are applied before storing candidates.

### Story 1.4: Home, Unified Input, and Inspiration Library

As a traveler,
I want one home surface for planning input and inspiration browsing,
So that I can move from collected inspirations into planning quickly.

**Acceptance Criteria:**

**Given** the user opens Home
**When** city-grouped inspirations exist
**Then** destination cards and a Library tab show city aggregation from saved inspirations.

**Given** the user enters text or a link
**When** the input can be classified
**Then** XHS links route to ingest and natural-language trip text routes to trip parameter parsing.

**Given** the input cannot be classified
**When** the user submits it
**Then** a half-height Sheet asks the user to choose link ingest or trip planning without covering core context.

**Given** an inspiration is pending location
**When** the user taps it
**Then** Top-5 candidates show name and address only, with no confidence, distance, duration, or score exposed.

**Given** the user selects inspirations
**When** they start planning
**Then** selected items flow into Picker as contextual anchors.

### Story 1.5: Settings, Feedback, and Account Entry Points

As a traveler,
I want settings for key ownership, account data, and feedback,
So that I can trust and control my use of Nomad.

**Acceptance Criteria:**

**Given** the user opens Settings
**When** the screen renders
**Then** it shows login state, BYOK status, account deletion, data export, and feedback entry points.

**Given** BYOK is not configured
**When** the user reaches AI quota education moments
**Then** the app can route to BYOK education and configuration without blocking early platform-quota use.

**Given** the user requests export or deletion
**When** the action is confirmed
**Then** backend account queues are used and the UI displays queued/in-progress/done states.

**Given** feedback opens in WebView
**When** WebView fails or the site blocks embedding
**Then** the app falls back to the system browser and emits feedback_open/submit/success/fail telemetry where available.

## Epic 2: Planning and Editing

Goal: turn selected or empty inspirations into an editable, validated day-level plan that can be exported.

### Story 2.0: Confirm and Planner Picker

As a planner,
I want to confirm trip parameters and select inspiration anchors in context,
So that skeleton generation starts with the right city, dates, pace, and POI hints.

**Acceptance Criteria:**

**Given** the user enters planning from Home input or a destination card
**When** trip parameters are incomplete
**Then** Confirm collects city, pace, travel date/day range, first-day/last-day time windows, morning start time, and smart-planning preference.

**Given** the user reaches Picker
**When** it renders
**Then** route parameters include city, start, days, source, and optional rec_id, and the header clearly shows missing values as placeholders.

**Given** inspirations exist across cities
**When** Picker displays city tabs
**Then** tabs are sorted by straight-line distance to the target city center and only cities with inspiration count > 1 are shown.

**Given** the user selects cards or markers
**When** selection changes
**Then** card, marker, basket, must_go, time_hint, and stay_minutes_hint states remain consistent.

### Story 2.1: Generate Day Skeleton with Quick and HQ Planning

As a planner,
I want a quick 2h/4h day skeleton while HQ planning runs in the background,
So that I can start editing immediately and upgrade if a better plan arrives.

**Acceptance Criteria:**

**Given** selected_items are provided or empty
**When** `POST /plan/generate` starts
**Then** must_go and time_hint are placed first, selected_items use item_id and optional poi_id/must_go/time_hint/stay_minutes_hint, and empty selection falls back to AnchorPool or built-in Top-50.

**Given** pace maps to slot granularity
**When** quick planning runs
**Then** tight uses 2h and comfortable uses 4h, with the 2.5h threshold and same-L1 preference applied.

**Given** autoplace is enabled
**When** candidates are evaluated
**Then** quota=ceil(alpha*S_left), hard conflicts are never placed, soft conflicts are surfaced only as warnings, origin=ai_seed is stored, and seed undo/reset are available.

**Given** smart planning is enabled
**When** Quick completes
**Then** the client can show Quick immediately while HQ runs, then offer switch/adopt without losing both versions before adoption.

**Given** hotel candidates exist
**When** skeleton generation completes
**Then** hotel_slot is display-only, near_hotel affects early/late ranking only after a hotel is selected, and it never overrides hard constraints or transport boundaries.

### Story 2.2: Timeline Editing, Undo, and History

As a planner,
I want to edit timeline blocks and recover from mistakes,
So that I can refine the generated plan without fear.

**Acceptance Criteria:**

**Given** a timeline block exists
**When** the user long-presses it
**Then** replace, move to D±1, retime, delete, and seed-block operations are available with consistent behavior.

**Given** a recent operation was applied
**When** the user taps undo within 8 seconds
**Then** the latest operation is reverted and the recent-actions entry can revert one more eligible operation.

**Given** the user retimes a block
**When** the time crosses day boundaries
**Then** 15-minute stepping, 30/60-minute snapping, and cross-day state are handled correctly.

**Given** automatic rerank or hotel change creates a snapshot
**When** the user opens history
**Then** they can return to a previous snapshot without destroying the rollback point.

### Story 2.3: Feasibility Validation and One-Click Fixes

As a planner,
I want feasibility warnings and fix proposals,
So that my plan becomes executable before AI fill.

**Acceptance Criteria:**

**Given** a plan is generated or edited
**When** validation runs
**Then** hard conflicts include no coordinate, closed venue, and cross-day unreachable states, while soft conflicts include slight overtime or travel-time concerns.

**Given** a hard conflict exists
**When** the user tries to enter AI fill
**Then** entry is blocked until repair or manual adjustment resolves the conflict.

**Given** fix proposals are available
**When** the user opens the fix sheet
**Then** proposals include reorder, replace candidate, shorten stay, or move day with concise reasons.

**Given** a fix is applied
**When** validation reruns
**Then** the plan has no hard conflict and at most one residual soft conflict with an explanation.

### Story 2.4: Export Itinerary PNG

As a traveler,
I want to export my itinerary as shareable images,
So that I can save or share the plan outside Nomad.

**Acceptance Criteria:**

**Given** a result sheet or validated plan exists
**When** the user exports
**Then** export supports width_px 1080 or 1242 and slice_by_day.

**Given** the itinerary is long
**When** export would exceed texture limits
**Then** the export is sliced by day.

**Given** WebP is supported
**When** rendering completes
**Then** WebP is preferred; otherwise JPEG 75-80% is returned.

**Given** conflicts remain
**When** export starts
**Then** the user sees current conflict state and available fix proposals before continuing.

## Epic 3: AI Fill, Evaluation, and Trust

Goal: make a confirmed plan execution-ready while keeping AI output traceable, measurable, and privacy-safe.

### Story 3.1: One-Shot AI Fill, Result Sheet, and Citations

As a planner,
I want AI to fill actionable details without changing time or order,
So that the itinerary is ready to execute.

**Acceptance Criteria:**

**Given** a plan has controllable non-free slots
**When** AI fill runs
**Then** only remaining controllable blocks are arranged and all blocks receive do/prepare/notice content.

**Given** the fill output is produced
**When** it is validated
**Then** time and order remain unchanged, do is required, each text group respects 3 lines × 30 characters, and excessive text is folded or hard-trimmed with ellipsis.

**Given** facts are available
**When** the result sheet displays content
**Then** why_short and citation summaries are shown per slot.

**Given** a do item has no reliable source
**When** it is displayed
**Then** it is marked as generic advice with a fact-check warning rather than blocking the flow.

**Given** the user edits slot-level text
**When** AI fill runs again
**Then** existing overrides are not overwritten unless the user explicitly resets them.

### Story 3.2: Observability, Evaluation, and Provider Routing

As an operator,
I want AI and planning quality to be observable,
So that regressions can be debugged and prompt/provider choices can improve.

**Acceptance Criteria:**

**Given** planner or filler calls run
**When** they call an LLM provider
**Then** calls go through an OpenAI-compatible provider abstraction with api_base, model, timeout, retry, fallback, BYOK override, and Langfuse tracing.

**Given** quality evaluation is needed
**When** promptfoo runs
**Then** offline A/B datasets cover planner/filler regressions and report prompt versions.

**Given** production errors occur
**When** Sentry captures them
**Then** PII is redacted and trace_id/journey_id/plan_id context is included where available.

**Given** dashboards are built
**When** operators inspect quality
**Then** metrics include funnel conversion, seed_accept_rate, seed_conflict_rate, seed_time_ms, fallback_rate, anchors_ready coverage, citation hit/degrade rate, and export/result-sheet rates.

### Story 3.3: BYOK, Account Privacy, and Compliance Controls

As a traveler,
I want my AI key and account data handled safely,
So that I can trust Nomad with sensitive travel data.

**Acceptance Criteria:**

**Given** a user sets BYOK
**When** the key is stored
**Then** KMS/Envelope encryption is used, logs are redacted, and only key references are returned.

**Given** object storage is used
**When** media or export artifacts are accessed
**Then** private COS access and signed URLs are used.

**Given** a user requests account deletion or data export
**When** the backend queues the task
**Then** the workflow includes stored files, account data, telemetry anonymization, and completion state.

**Given** AMap or third-party services are displayed
**When** the app surfaces their data
**Then** attribution and domestic fallback/degradation rules are followed.

### Story 3.4: Recent Trips and Check-In State

As a traveler on a trip,
I want recent itineraries and per-slot check-in state,
So that I can continue using the plan during travel.

**Acceptance Criteria:**

**Given** the user has recent plans
**When** Home renders
**Then** recent trips are reachable without starting a new plan.

**Given** a result-sheet slot is visible
**When** the user toggles check-in state
**Then** the slot changes between unchecked and checked-in states and persists for later sessions.

**Given** check-in data is stored
**When** future memory/log features are added
**Then** the data shape is compatible with later automation without exposing it prematurely.
