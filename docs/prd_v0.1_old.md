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
| Date       | Version | Description                 | Author |
| ---------- | ------- | --------------------------- | ------ |
| 2025-10-26 | 0.1     | Initial draft (MVP-focused) | PM     |

## Requirements

### Functional Requirements (FR)
- FR1: 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。
- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- FR4: 小红书入库流程（单次仅处理一条链接）：异步解析抽取→图片二次存储至 COS（禁止热链）→ 高置信自动入库/低置信标记“待定位”；前台用 SSE 展示进度（不使用远程推送）。
- FR5: 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。
- FR6: 灵感选择页：按城市列出可勾选的“想去”条目；支持对“待定位”进行 Top-5 选择。
- FR7: 生成天级骨架：默认 2 小时槽位；支持在“空槽”处弹出大弹窗，页签包含“候选抽屉（按时窗/距离/vibe 重排）｜AI 建议”，并提供“自由活动”选项。
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
- FR20: 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。
- FR21: 骨架微调与撤销：时间微调步进 15 分钟，拖拽吸附 30/60 分钟刻度；撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条。
- FR22: 冲突分级与进入 AI 填充门控：硬冲突（无坐标/闭店/跨日不可达）需先修复并禁用进入；软冲突（略超时/通勤略远等）允许进入但顶部保留提醒与一键修复。
- FR23: AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。
- FR24: 导出 PNG 规格：长图固定宽度 1080 px（可选 1242 px），纵向不设上限；超图按天切片导出多张；优先 WebP，不兼容降级 JPEG（75–80%），尽量 ≤ 600 KB；导出接口支持 width_px 与 slice_by_day 参数并提供预览提示。
- FR25: BYOK 引导：AI 填充页顶部灰条提示“当前使用平台额度，去配置我的 OpenAI Key”；设置首页显示配置状态；首次需自带 Key 时弹一次性教育页（用途与隐私），之后不重复打扰（远程开关控制）。
- FR26: Planner Picker 入口路径：A) 底部输入解析得到 trip_params → 进入 Picker；B) 目的地卡“开始规划”→ 进入 Picker（传 city、place_hints 可选）。
- FR27: Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。
- FR28: Planner Picker 头部：标题“{城市} · {出行日期?占位} · {天数?占位}”；缺参以“待填写”灰字占位；右侧“修改参数”轻量 Sheet（日期选择器 + 天数步进器 + pace 可选）；返回保留来源上下文。
- FR29: Planner Picker 视图结构：顶部城市 Tabs（按与目标城市中心点“直线距离”排序；仅展示灵感量 > 1 的城市）；中部卡片列表 + 地图-卡片联动（Sheet 吸附位 High→Split→Map-Full），详情统一全高 Bottom Sheet；弱网/无地图自动降级为清单视图并提示。
- FR30: 已选篮与主按钮：吸底左“已选 N”（可展开面板：移除/必去 must_go/时段 time_hint/时长 stay_minutes_hint），右主按钮：“生成骨架”；允许在无已选时直接生成（selected_items 为空）；缺参时弹参数 Sheet 补齐后生成。
- FR31: 选点与一致性：卡片/Marker 状态一致；卡片→Map 飞行 300ms；Map→卡片滚动并“抬升”；低置信项卡片右上“去定位”入口。
- FR32: 生成骨架（部分填充）：POST /plan/generate 接口使用 selected_items 作为锚点；must_go/time_hint 优先落位；近邻聚类仅做部分填充（不做智能补齐）；未落位项不在骨架页直接展示，而是在“空槽 → 大弹窗”的候选抽屉中提供查看与处理入口。

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

## User Interface Design Goals

### Overall UX Vision
移动端单列布局，顶部吸顶分段，底部统一输入；以天级骨架与大弹窗为核心交互，保持“所见即所得”的日程编辑；极简风、快速动效，降低首次使用成本。

### Key Interaction Paradigms
- 统一输入分流（链接/自然语言）。
- 城市聚合与“待定位”轻量消歧（Top-5 候选）。
- 2 小时槽位的天级时间轴，空槽弹窗（候选抽屉/AI 建议/自由活动）。
- 长按编辑（替换/移动/调时/删除/撤销）。
- 顶部可行性校验与一键修复。
- 一次性 AI 填充与导出 PNG。

### Core Screens and Views
- 登录首屏
- 首页（目的地卡 + 统一输入）
- 灵感选择页（上下文灵感选择，不在“灵感库”导航中）
- 天级骨架页（2 小时槽位 + 大弹窗 + 长按编辑）
- AI 填充页（确认与应用）
- 导出页（PNG）
- 设置页（BYOK/账号删除/数据导出）

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

### Story 2.1 生成天级骨架（2 小时槽位，部分填充）
As a planner, I want to generate a day-level timeline with 2-hour slots, so that I can quickly structure my day.

Acceptance Criteria
1: 默认 2 小时槽位；基于 灵感选择页（Planner Picker） 的 selected_items 进行部分填充（must_go/time_hint 优先落位；近邻聚类仅做部分填充）；“未落位”项不在骨架页直接展示，而在“空槽→大弹窗”的候选抽屉中提供查看与处理入口。
2: 空槽弹出大弹窗，含“候选抽屉（按时窗/距离/vibe 重排，含‘未落位’子区）｜AI 建议｜自由活动”。
3: 生成后可进入编辑环节。

### Story 2.2 编辑与撤销
As a planner, I want to long-press to edit blocks (replace/move D±1/retime/delete) with undo, so that I can refine my plan.

Acceptance Criteria
1: 长按块支持替换、移动至 D±1、调时、删除。
2: 撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条。
3: 时间微调步进 15 分钟，拖拽吸附 30/60 分钟刻度；跨日（23:00→01:00）正确处理。
4: 关键操作有埋点。

### Story 2.3 可行性校验与一键修复
As a planner, I want to see feasibility warnings (closed/too far/overtime) and one-click fixes, so that my plan becomes executable.

Acceptance Criteria
1: 顶部显示校验结果并区分硬冲突（无坐标/闭店/跨日不可达）与软冲突（略超时/通勤略远等）。
2: 提供一键修复方案（例如调整顺序/替换候选/缩短停留）。
3: 门控：存在硬冲突时禁用“进入 AI 填充”，需先修复；仅软冲突时允许进入但顶部保留提醒与一键修复入口。
4: 修复后计划无冲突或仅 1 个残留且提供可修复建议。

### Story 2.4 导出 PNG
As a user, I want to export the itinerary as a PNG card, so that I can share or保存。

Acceptance Criteria
1: 导出长图：宽度 1080 px（可选 1242 px），纵向不设上限；超纹理上限时按“天”切片导出多张。
2: 格式与参数：优先 WebP，不兼容降级 JPEG（75–80%）；/export/png 支持 width_px、slice_by_day 参数并提供预览提示。
3: 操作过程与导出成功有埋点。

## Epic 3 AI Fill & Evaluation
目标：对可控块进行一次性 AI 填充并完善观测/评测与灰度发布。

### Story 3.1 一次性 AI 填充
As a planner, I want to apply a one-shot AI fill that adds actionable details without changing time/order, so that my plan is execution-ready.

Acceptance Criteria
1: 对“剩余可控块”进行一次性编排；对所有块补全“做什么/准备什么/注意什么”。
2: 不改变时间与顺序（硬约束）。
3: 用户可一键“应用全部”。

### Story 3.2 观测与评测
As an operator, I want Langfuse/promptfoo/Sentry integrated, so that I can measure quality and debug issues.

Acceptance Criteria
1: Langfuse 记录提示版本与调用追踪；promptfoo 支持离线 A/B 评测。
2: 前后端接入 Sentry；关键漏斗埋点齐全。
3: 指标看板包含北极星与关键质量指标。

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

### 5) 规划器（骨架与 2h 槽位）
- 时间粒度：默认 2h；允许 15min 微调；拖拽吸附 30/60 分钟刻度；跨日（23:00→01:00）正确处理。
- 时区：短期以内地为主；后续跨区将 plan 固化 timezone。
- 幂等编辑：插入/替换/移动/删除 API 幂等；提供 undo_token 实现撤销（撤销时效 8 秒，并在当日时间轴提供“最近操作”入口可再撤一条）。
- 可行性：输出修复选项（换时/近邻/挪日），不只是报错。 

### 6) 空槽大弹窗（候选抽屉/AI 建议/自由活动）
- 重排特征：时间窗贴合 > 距离 > 用户标签（vibe）> 热度；提供 ≤16 字的“为什么推荐”。
- 自由活动：不绑定坐标；通勤按前后块估算；AI 填充仅给“软建议”。
- 冷启动城市：候选 fallback 到“城市热门 UGC”，标注来源。

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

## 后端职责（按用户旅程拆分）
- Router（意图识别）：识别 xhs_link | trip_params | unknown；解析自然语言行程 {city, start_date(ISO), days, pace?}，输出结构化 JSON 供前端路由。
- Ingestor（小红书入库）：拉取与解析；抽取 标题/正文/图片URL/地址片段/标签（vibe）；触发 GeoResolver；按阈值高置信入库、低置信“待定位”。
- Library（灵感库）：城市聚合；按 城市/标签/定位状态 过滤列表。
- GeoResolver（地理消歧）：高德/Places 检索、去重、融合重排；维护 CanonicalPOI；距离矩阵/开闭店时间。
- Planner（骨架/校验/编辑）：根据 {city,start_date,days,pace?,selected_items[]} 生成骨架（默认 2h）；Validator 检测冲突；编辑 API 幂等。
- Filler（AI 一次性）：仅“剩余可控非自由活动块”编排；为所有块补齐说明；输出 warnings[]。
- Export（导出）：将富行程生成 PNG（后续可拓展 PDF/链接）。

## 设计风格（情感与原则）
- 向往 Awe/Wanderlust：大幅、自然光、留白与呼吸感，激发行动。
- 陪伴 Companion：温柔、具体、不过度指挥；信息不过载。
- 可靠 Trust & Doable：清晰时间轴、通勤标注、可撤销，传达“能落地”。
- 秩序中的自由 Frame for Freedom：结构与自由并存（2h 槽位 + 自由活动）。
- 当下感 Here & Now：快速、克制的微动效，地图卡片实时联动。

## 全局框架与交互（摘要）
- 顶部吸顶分段：旅行规划 | 灵感库；切换保留输入内容与焦点。
- 左上侧边栏：最近规划（已完成|未完成）。
- 底部统一输入：占位文案“粘贴小红书分享链接，或输入：杭州 11/2 起 3天”。
- 首页目的地卡：开始规划/查看灵感；不额外提示条。
- 灵感选择页：双栏大图 feed；底部“已选 N / 生成骨架”；可空选继续。
- 天级骨架页：Tabs D1..Dn；时间线按 2h 槽；“空槽”大弹窗（候选/AI 建议/自由活动）；长按编辑；主 CTA=进入 AI 填充。
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

## AI Workflow 编排（概述）
Router → (HomeInput.parseQuery) → Planner Picker → Planner → (SlotSuggester/Validator/Explainer) → Filler；
GeoResolver & CandidateRanker 贯穿地理与候选重排。

## Note Card/Hero 规格（摘要）
- 笔记卡：4:5 大图+标题+标签；最小点击区 44×44pt；状态 default/pressed/added。
- CTA 一致性：卡片右下固定“加入行程/加入候选”；已加入态按钮与底色轻反馈；长按为加速操作。
- Hero：首屏 1 列 Hero + 下方 2 列瀑布；主 CTA 动词开头；LQIP + 渐进清晰；可达性满足 WCAG AA。


