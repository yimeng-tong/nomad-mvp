# nomad-mvp Fullstack Architecture (v1.0)

> DEPRECATED / ARCHIVED as v0.3
>
> 本文为历史版本（v0.3）单体架构草案。自 v0.4 起已切换为分片文档（sharded）并调整若干关键设计：VLM 默认启用、LLM Provider 抽象（api_base+model）、L1/L2/L3 数据层、Planner 的 Quick L2 与 HQ 并行（“切换-采用”）、2h/4h 槽与餐时分割 A/B、统一观测 IDs。
>
> 请查看新版入口：`docs/architecture/index.md`（v0.4）。当新版与本文冲突时，以 v0.4 为准。

## Purpose
Provide a pragmatic, end-to-end architecture aligned with PRD/UX, NFRs, and SSE-first async flows. Optimized for developer experience and MVP velocity, with clear paths to scale.

## Tech Stack (MVP)
- Backend: Node.js + Fastify (+ fastify-sse-v2), BullMQ + Redis (jobs)
- DB: PostgreSQL + PostGIS + pgvector
- Maps/Geo: AMap Web API (search/geocode/matrix)
- Auth: Authing + Captcha; Sessions in DB
- Storage/CDN: Tencent COS + CDN; server-managed Provider secrets for AI usage
- Export: Puppeteer (PNG/WebP, day-slice)
- Observability: Sentry, Langfuse, structured logs; synthetic probes
- Feature flags: Unleash
- Feedback: 兔小巢（support.qq.com/product/{PRODUCT_ID}，WebView 打开）

## Repository Structure (proposed)
```
apps/
  server/            # Fastify app, routes, SSE, jobs, DI
  mobile/            # RN/Flutter (to be decided)
packages/
  types/             # OpenAPI-generated TS types
  ui/                # Shared UI components
  prompt/            # LLM prompts & promptfoo tests
infra/               # IaC, CI/CD, monitoring
```

## Modules & Boundaries
- Router/Intent: classify xhs_link | trip_params | unknown
- Ingestor: fetch/parse, COS upload, locate candidates
- Library: city aggregation, filters
- GeoResolver: AMap search, dedupe, re-rank (α/β/γ)
- AnchorPool: offline city×season×tod×category Top-K, 72h refresh
- Planner (MVP): single-city skeleton (2h slots); near_hotel soft preference（已选酒店时）；validate；edit API（idempotent/optimistic lock）。
  - Post‑MVP 预留：multi‑city segmentation by `transport_slot` boundaries（v1.0）。
- Filler: AI one-shot fill（validate 3×30 chars per field, with citations）
- ResultSheet: materialization for preview/export + light edit（slot-level overrides）
- Export: puppeteer renderer with slicing
- FeedbackLink: 官方 product URL 生成（PRODUCT_ID），可选“产品自己的用户登录态”参数；客户端 WebView 打开，禁止内嵌则回退系统浏览器；失败降级内置极简表单。

### Planner Autoplace v1（MVP）
- See `docs/architecture/planner-autoplace-v1.md`
- SSE phases: started → freeze → must_go → quota → candidates → place → validate → persist → done
- Priority: time_hint > must_go > others; cold-start quota ensures ≥1 auto placement when enabled
- Hotel policy: `hotel_slot` display-only（DayN end & ResultSheet）；仅作为 near_hotel 加分参与 place 阶段
- Post‑MVP 预留：`transport_slot` 分段配额与编排（v1.0）

## Async & SSE Protocol
- Job queues (BullMQ) per workflow: ingest, plan_generate, fill, export
- SSE endpoints:
  - /sse/ingest/{ingest_id}: state progress + ping ≤10s
  - /sse/plan/{plan_job_id}: phases + anchors_ready hint + ping ≤10s
  - /sse/fill/{fill_run_id}: progress (batches) + result_sheet_updated events + ping ≤10s

Refer to `docs/ops/analytics.md` for event monitoring and dashboards.

## Configuration
- Feature flags: see `docs/ops/feature-flags.md`
- Environment: see `docs/ops/env.md`
- NFR (user-perceived): ACK p95, TTFU p95 ≤1s, Keep-alive ≤10s; >60s soft hint
- Feedback integration:
  - FEEDBACK_PRODUCT_ID（必填）
  - FEEDBACK_LOGIN_ENABLED=false（默认关闭；启用后按官方“产品自己的用户登录态”参数规范传递最小字段）
  - FEEDBACK_BROWSER_FALLBACK=true（站点禁止内嵌时使用外部浏览器）

## Mobile Feedback Integration (WebView)
- 必须启用 JavaScript 与 DOM Storage
- 加载失败或 4xx/5xx 时提示重试并提供外部浏览器打开
- 打开链接：`https://support.qq.com/product/{PRODUCT_ID}`（注意是 product 不是 products）
- 可选：附带 source_page 等自定义参数用于埋点（详见 `docs/ops/analytics.md`）

## Data Model (summary)
Refer to `docs/db/schema.sql` for full DDL.
- Users, OAuthIdentity, Sessions, UserSettings, AIUsageQuota
- Cities, CanonicalPOI(geography,GIST)
- IngestJob(status enum), Inspiration(+Assets, LocateCandidate)
- Plan/PlanDay/PlanSlot(slot_type, conflict_type, status_checked, overrides, rev, locked_at/is_locked)
  - slot_type ∈ {activity, dining, nightlife, transport, hotel(display-only)}
  - status_checked: boolean for 打卡状态（ResultSheet）
  - overrides: { do?: string, prepare?: string, notice?: string }（ResultSheet 轻编辑产生；不影响时间/顺序）
- EditEvent, SlotCandidate
- FillRun/FillItem(validation enum)
- ExportJob(format, fallback_reason)

## API Surface (summary)
See `docs/api/openapi.yaml`.
- POST /ingest/start → 202; SSE /sse/ingest/{id}
- POST /plan/generate → 202; SSE /sse/plan/{job}
- PATCH /plan/slots/{slot} (If-Match-Rev)
- POST /plan/ai-fill → 202; SSE /sse/fill/{run}
- GET /plan/{plan_id}/result-sheet → aggregated view (slots + suggestions + citations)
- PATCH /plan/slots/{slot}/status → toggle/check status (打卡)
- PATCH /plan/slots/{slot}/overrides → set/clear slot text overrides；DELETE 同路径恢复 AI 内容
- POST /export/png → files (webp/jpeg)
-- MVP FR44-lite:
- GET /search/poi → text-only Top-5
- POST /plans/{plan_id}/candidates → manual add candidate
- PATCH /plan/days/{day}/hotel → set hotel display slot
- Feedback（默认）: 无服务端 API；客户端直接打开 `https://support.qq.com/product/{PRODUCT_ID}`
- Feedback（可选）: GET /feedback/link?source={page}（若启用“产品自己的用户登录态”，按官方参数规范拼接并签名/校验（若官方要求））

## Security & AI Usage
- Provider secrets stay server-side and are never returned to clients
- Redact prompts, provider metadata, and sensitive account data in logs/Sentry/Langfuse
- Enforce per-user/device/workspace quota, concurrency, cost caps, and degradation
- Feedback 隐私：默认不传登录态（平台随机头像/昵称）；如启用“产品自己的用户登录态”，仅传最小必要字段（不含手机号/邮箱），遵循官方参数与签名/校验要求。

## Rate Limits & Degrade
See `docs/ops/rate-limits.md`. Limits by user/IP/device; AI concurrency 1; map overlays/candidates.topk switches; platform quota/cost controls handle low quota, queuing, low-cost generation, and no-AI fallback.

## Performance & Scaling
- Hot paths tuned for low p95 ACK/TTFU; streamed SSE output
- PostGIS for spatial filters; pgvector for similarity
- Horizontal scale server; job workers autoscale; read replicas for DB

## Developer Experience
- Types from OpenAPI to `packages/types`
- Local seeds & synthetic probes; promptfoo tests for LLM flows
- Consistent error envelope; optimistic concurrency on plan edits

## Open Questions (tracked)
## Security & Sessions (augmented)
- Auth model: Session cookie (HttpOnly, SameSite=Lax/None+Secure) with `/auth/otp/start`, `/auth/otp/verify`, `/logout`, `/sessions`.
- Guards: All SSE endpoints and write APIs require authenticated user; per-user isolation by session.
- Headers: CORS allowlist + helmet security headers; standardized error envelope.
- AI usage: Provider secrets server-side; audit provider routing and quota changes; logs/telemetry PII redaction.
- Risk controls: OTP flood → 429 with Retry-After; captcha gate by IP/device signals; feature flags to tighten during spikes.

## SSE Auth & Isolation
- Clients send `X-Trace-Id` and session cookie on SSE connects; server validates session before streaming.
- Idle timeout (30s) and keep-alive pings (≤10s); error frames follow `ErrorEvent` schema.
- SSE scopes: streams are user-bound; event payloads omit sensitive data; trace_id required for correlation.

- Auth endpoints and sessions OpenAPI
- Error code catalog (INGEST_/PLAN_/FILL_)
- Geo disambiguation doc + thresholds
- Maps quotas thresholds & degrade rules

## Appendix: Validator Conflicts & Fix Scoring

### Conflict Types (Validator)
- Hard: no_coords, closed, cross_day_unreachable
- Soft: too_far, overtime, open_gap_short, transport_boundary, hotel_boundary

Details: see API `ValidatorConflictType` and `ValidatorConflict` schemas.

### Fix Strategy → Atomic Ops Mapping
- reorder → sequence of `move` ops (PATCH /plan/slots/{slot_id})
- move → `move` (PATCH /plan/slots/{slot_id})
- retime/shorten_stay → `retime` (PATCH /plan/slots/{slot_id})
- replace_with_alternative → `replace` (PATCH /plan/slots/{slot_id})
- shift_day → `move` with `new_day`
- align_to_boundary → `retime` or `move` constrained by transport/hotel boundaries
- suggest_insert_candidate → guidance only（需要用户选择候选；不自动创建槽）
- set_hotel（边界修复） → PATCH /plan/days/{day}/hotel

所有修复均遵循安全网：不修改冻结槽（time_hint）、must_go 优先、先重排/微调再替换/挪日，失败可撤销。

### Fix Scoring（选择 Top‑1）
目标函数（越大越优）：
```
score = w_constraints*constraints_satisfied
      + w_commute*(-delta_commute_minutes)
      + w_open_gap*(-residual_open_gap_minutes)
      + w_boundary*boundary_alignment
      + w_diversity*vibe_diversity_delta
```
建议权重：w_constraints=0.4, w_commute=0.2, w_open_gap=0.15, w_boundary=0.15, w_diversity=0.1。

Tie-breaker：更少原子操作数→更少跨日移动→更少对用户已编辑槽的影响。

### Data & Caching
- AMap 开闭店/距离矩阵：同日 24h 缓存
- 无外部数据可用时：仅执行顺序/时长类修复；替代候选限制为已知候选集合

## Ingest Parsing Pipeline & Evidence Model（对齐 PRD FR4）

- Pipeline（逐级降级链路）：`text → OCR → VLM`。
  - 解析策略：优先正文/标题；正文缺失或低置信触发 OCR（中文优先）；必要时再启用 VLM 场景识别。
  - 证据融合：融合 text/OCR/VLM 三源，生成地址线索、标签（vibe）与 Top‑K 候选；保留 evidence.source 与置信度。
- 自动入库与“待定位”门槛：
  - 高置信（≥阈值）→ 自动入库；低置信 → 标记 `pending_location`，不阻断后续流程。
  - 阈值与权重经远程配置（Unleash）：`evidence_weight_{text|ocr|vlm}`、`auto_admit_threshold`。
- SSE 可观测（ingest）：`created → fetching → parsing{text|ocr|vision} → geo → storing → done`；解析子阶段事件用于埋点与排障。
- Evidence Schema（持久化示例）：
  ```json
  {
    "evidence": [
      {"source": "text", "confidence": 0.82, "snippet": "...", "ts": "ISO"},
      {"source": "ocr", "confidence": 0.67, "image_id": "...", "ts": "ISO"},
      {"source": "vision", "confidence": 0.61, "labels": ["mall","landmark"], "ts": "ISO"}
    ],
    "geo_hints": [
      {"name": "X Place", "address": "...", "city": "...", "score": 0.79}
    ],
    "admit": "auto|pending_location"
  }
  ```
- 数据模型补充：`Inspiration` 增加 `evidence jsonb`, `admit enum`, `confidence_max numeric`；`LocateCandidate` 存放融合后的 Top‑K。

## Third‑party Collector Compliance（XHS‑Downloader 边界，NFR14）

- 集成方式：独立 HTTP 服务（采集器）对接，应用仅通过 REST/HTTP 调用，不嵌入其 GPL 代码或 SDK。
- 安全与合规：
  - 仅保存最小必要数据；禁止热链，媒体统一二次存储 COS（签名 URL）。
  - 失败降级：采集失败/配额超限 → 回退为“仅媒体 + pending_location”。
  - 限流与隔离：按 user/IP/device 限流；独立队列与重试（指数退避 + DLQ）。
- API 契约（示例）：`GET /items/{id}` 返回 标题/正文/媒体URL/时间戳；`GET /assets/{id}` 返回可下载链接（一次性/短时效）。
- 观测：对采集器调用输出 `collector_*` 指标（成功率、时延、限流命中率），SLA 告警接入。

## Undo Window & History Snapshots（FR8 / FR43）

- 8 秒撤销窗口：
  - 写操作返回 `undo_token`（含快照指针与过期时间）；`POST /plan/undo` 在有效期内回滚最近一次操作。
  - 前端提供“最近操作”入口（当日时间轴可再撤 1 条）。
- 快照与回滚：
  - `EditEvent` 记录原子操作（replace/move/retime/delete）；重要节点（AI 预排、酒店更换确认）生成 `Snapshot`。
  - 回滚 API：`POST /plan/rollback { snapshot_id }` 恢复到任意快照；保留回滚点快照（可前进）。
- 一致性与并发：使用乐观并发（If‑Match‑Rev）；回滚后重新发号新 rev。

## Free‑activity Slot Definition（FR7）

- 新增 `slot_type = free`：
- 不绑定坐标；通勤按前后块估算；Validator 将其排除“可达性硬约束”，仅作信息展示。
- Filler：对 `free` 仅输出“软建议”（不做候选替换/编排），不计入预布局配额。
- 导出与结果页：`free` 槽正常展示文案；不纳入 2h 编排冲突判断。

## Performance Metrics Alignment（NFR4，对齐口径）

- 产品层核心指标：
  - 端到端 P50：`plan.generate → result_sheet ready`；`fill.one_shot → applied` 分别统计。
  - 体验指标：移动端 ACK/TTFU P95（首页/骨架/结果页）≤ 1s。
- 技术分层预算（示例）：
  - ingest：p50≤1.5s（不含远端拉取）；plan.generate：p50≤1.8s；ai‑fill：p50≤2.5s；export.png：p50≤2.0s。
  - SSE keep‑alive ≤10s；>60s 给软提示并可中断/降级。
- 仪表与看板：在 `docs/ops/analytics.md` 定义指标字典与看板模板；Langfuse 标注 prompt_version；promptfoo 跑离线回归。

## Account Deletion & Data Export（FR12/NFR7）

- Data Export：
  - `POST /account/export` 触发异步打包（用户元数据、计划、Inspiration 索引与引用媒体的签名 URL 清单）；SSE `/sse/account/export/{job}` 推进度。
  - 导出包放入 COS（时效签名）；记录审计日志。
- Account Deletion：
  - `POST /account/delete` 进入异步清理：DB 数据、COS 对象（引用计数=0 的媒体）、埋点匿名化、Langfuse PII 清理。
  - 支持冷却期（例如 7 天可撤销）；最终不可逆删除后发通知。
- 安全：所有操作需二次确认与强认证；最小化保留策略与法务例外遵循配置。

## Router Input Rules（FR3/FR17/FR18）

- 识别优先级：`xhs_link > natural_language > unknown`；
  - 链接判定：域名/口令/短链特征；多条链接粘贴 → 自动取第一条入队，Toast 提示“其余请逐条粘贴”。
  - 自然语言：`{city, start, days, pace?}` 解析失败 → 进入 unknown。
- unknown 降级：底部半高 Sheet 二选一提示（不遮挡目的地卡/地图抓手）。
- 路由：
  - A 路径：底部输入解析得到 `trip_params` → 进入 Planner Picker。
  - B 路径：目的地卡“开始规划” → 进入 Planner Picker（传 city、place_hints 可选）。
- OpenAPI 对应：`POST /router/intent` 返回 `{ kind: xhs_link|trip_params|unknown, parsed? }`，前端按约定路由。

## Maps Quotas, Caching & Anti‑scrape（NFR13）

- 配额与缓存：
  - AMap 检索/逆地理/矩阵 24h 按“同日/同点对”缓存；指数退避重试 3 次；水位告警与熔断。
  - 距离矩阵缓存键：`{date, origin_grid, dest_grid, mode}`；命中率埋点。
- 降级路径：
  - 地图不可用/配额超限：搜索降级为文本 Top‑5（FR44‑lite），提示“稍后重试”；可达性校验仅使用本地/已缓存数据。
  - 开闭店缺失：回退社区/官网解析（弱一致），标注来源。
- 反爬策略：
  - 应用级限流（user/IP/device）；代理池与 Cookie 轮换（由采集器负责）；请求节流与抖动；
  - 监控：抓取/解析/地理消歧各阶段指标；DLQ 追踪；SLA 告警。
