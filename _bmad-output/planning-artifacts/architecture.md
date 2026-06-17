# Nomad MVP Architecture Input Package

Generated: 2026-06-17

This BMAD input package uses the v0.4 architecture shards referenced by `docs/architecture/index.md`. It intentionally excludes the root architecture stub and deprecated v0.3 single-file archive.


---

## Source: `docs/architecture/index.md`

# Nomad MVP Architecture (v0.4)

本架构为 v4 分片文档，按前后端与数据/观测拆分，覆盖 VLM 默认启用、LLM Provider 抽象（OpenAI 兼容：api_base+model）、L1/L2/L3 数据层、Planner 的 Quick L2 与 HQ 并行（“切换-采用”）、2h/4h 槽位与餐时分割 A/B、全链路埋点与唯一标识。

## 文档目录
- ./tech-stack.md
- ./source-tree.md
- ./frontend-architecture.md
- ./backend-architecture.md
- ./data-models.md
- ./rest-api-spec.md
- ./observability.md
- ./testing-strategy.md

## 文档沿革与兼容性
- 历史单体文档（v0.3）：`./architecture.md`（已标记 DEPRECATED）
- 变更对照：见 `./compatibility.md`
- API & Schemas 索引：见 `../api/INDEX.md`

## 变更要点（v0.4）
- VLM 抽取默认启用；取消 text→OCR→VLM 分级流水线。
- LLM Provider 抽象（api_base + model），可远程切换/回退；BYOK 覆盖；Langfuse 追踪。
- 数据层引入 L1/L2/L3；L3→L2 多归属；连锁抑制列表；分店≤20 + 主 POI 附近 2km 裁剪。
- Planner 双路：Quick（L2 2h/4h 主景点）先呈现；HQ 后台并行，完成后“切换-采用”。
- 前端：Mobile-first，2h/4h 槽为心智；餐时分割 A/B 为展示模式。
- 观测：journey_id / plan_id / event_id / trace_id / span_id / hq_job_id / ingest_job_id 统一贯穿。


---

## Source: `docs/architecture/tech-stack.md`

# Tech Stack

## Runtime & Languages
- Node.js / TypeScript
- Mobile-first（React Native / RN WebView 方案或移动 Web，按实现选型）

## Frameworks & Modules
- Backend: NestJS/Fastify（Router / Ingest / GeoResolver / Planner / Filler / Export / FeedbackLink）
- Orchestration: n8n + queue/DLQ（任务与重试）

## Storage
- PostgreSQL + PostGIS + pgvector
- COS + CDN（对象存储与签名 URL）

## Maps & Geo
- AMap SDK + Web API（POI/搜索/逆地理/距离矩阵）

## LLM & Vision
- VLM：默认启用（图+文抽取）
- LLM Provider 抽象：OpenAI 兼容（api_base + model），远程切换/回退；BYOK 覆盖；Langfuse 追踪

## Observability & QA
- Langfuse、Sentry、promptfoo（回归）
- 关键漏斗与自定义埋点（见 observability.md）

## Performance Targets
- 交互动效 120–200ms；HQ 准备可视化
- TTFP：5 分钟内得到可用骨架（P50）


---

## Source: `docs/architecture/source-tree.md`

# Source Tree & Workspaces

This document summarizes the repository layout and key workspace locations (see also `./repo-structure.md`).

```text
apps/
  server/            # Fastify app, routes, SSE, jobs
  mobile/            # RN/Flutter (TBD)
packages/
  prisma/            # Prisma schema & client
  types/             # OpenAPI-generated TS types
  ui/                # Shared UI (TBD)
  prompt/            # Prompts & promptfoo
infra/               # IaC, CI/CD, monitoring
scripts/             # Synthetic probes, utilities
```

## Workspace & Conventions

- Package manager: pnpm
- Workspaces: `pnpm-workspace.yaml`
- API contracts: `docs/api/openapi.yaml`
- DB: `docs/db/schema.sql` + `packages/prisma/schema.prisma`
- Ops: `docs/ops/*` (rate limits, errors, analytics)

See `./repo-structure.md` for the original proposal; this page is the stable v0.4 reference and is linked from `index.md`.


---

## Source: `docs/architecture/frontend-architecture.md`

# Frontend Architecture (Mobile-first)

## IA & Screens
- Home / Confirm / Picker / Skeleton / AI Fill / Result Sheet / Settings / Feedback WebView
- 2h/4h 槽为心智；餐时分割 A/B 为展示模式

## State & Data Flow
- 会话：session_id；路径：journey_id（Confirm→Result）
- 计划：plan_id（跨会话/设备恢复）；HQ：hq_job_id；Ingest：ingest_job_id
- SSE/轮询：HQ 状态条；Ingest 进度（SSE）

## Networking
- 统一 API 封装；OpenAI 兼容 provider 调用由后端代理/直连（BYOK 时）
- 弱网降级：清单视图；本地缓存关键参数

## Components（与前端规格对齐）
- Confirm：CityPicker / PaceSegmentedControl / DateRangePickerFlexible / MorningStartTimePicker / SmartPlanSwitch / PrimaryCTA
- Picker：CityTabs / InspirationCardGrid / MapSheet / SelectedBasketPanel / LocationModal
- Skeleton：DayTabs / HQStatusBar / ABToggle(MealSplit) / PlanTimelineMobile / EmptySlotModal / FixSheet / SwitchAdoptBar
- AI Fill：AIFillPreviewList
- Result：ExportPreview / ExportButton
- Settings：BYOKForm / FeedbackWebView（fallback 表单）

## Performance
- 关键交互 120–200ms；首屏渐进加载；图片 LQIP & 懒加载

## Observability
- 事件封装：统一 Hook/Service；属性字典与类型校验
- 事件包头：event_id / prev_event_id / seq / timestamp_ms / session_id / journey_id / plan_id / trace_id / span_id


---

## Source: `docs/architecture/backend-architecture.md`

# Backend Architecture

## Modules
- Router（意图识别）
- Ingestor（小红书入库：获取→VLM 抽取→COS 二存）
- GeoResolver（AMap 标准化；分店≤20；主 POI 2km 裁剪；连锁抑制）
- Planner（骨架/校验/编辑；Quick L2 与 HQ 并行）
- Filler（一次性填充；引用追溯）
- Export（PNG 导出）
- FeedbackLink（反馈 WebView 支持与降级）

## LLM Provider Abstraction
- OpenAI 兼容：`api_base + model`
- Provider 策略：远程切换/回退；BYOK 覆盖；重试/超时/限流；Langfuse 全链路追踪
- VLM 默认启用：图+文抽取；失败降级“仅媒体+待定位”

## Planner 双路
- Quick（L2 编排）：
  - 仅主景点；pace→2h/4h；2.5h 阈值对齐；同 L1 优先
- HQ（后台并行）：
  - 任务提交→hq_job_id→状态查询→结果合并→“切换-采用”
  - L2 内线路：AMap/行者 商问题求解

## Jobs & SSE
- Ingest：SSE 分阶段 created→fetching→parsing→geo→storing→done
- HQ：轮询或 SSE；完成后发通知供前端展示“切换-采用”

## Security & Privacy
- KMS/Envelope 对 BYOK；日志脱敏；签名 URL；最小必要数据

## Config & Feature Flags
- Unleash/Env：provider 选择、配额、开关（VLM/HQ/seed）


---

## Source: `docs/architecture/data-models.md`

# Data Models (L1/L2/L3)

## Core Entities
- L1Area(id, city_id, name, centroid, seasonality[])
- L2Group(id, l1_id, name, centroid, entry_nodes[], exit_nodes[], rules{hard[],soft[],tickets[],risk_flags[]}, duration{tight_range[],comfortable_range[]})
- POI(id, provider, provider_id, name, category, subtype, lat, lon, address_full, hours_json, tags[], alias[], navi, business_area, rating)
- Membership(poi_id, l2_id, role, proximity, priority, hours_fit, multi_attach:boolean, best_tod[], recommended_duration_min)

## Standardization (T0→T3)
- T0 多模态抽取（图+文，仅产线索）
- T1 AMap 标准化（POI 与坐标/地址；分店≤20；2km 裁剪；连锁抑制）
- T2 L2 归属决策（attach/new；多归属；时段/餐型角色）
- T3 L2 完整版（主路径/锚点/邻接/规则/叙述）

## Planning & Jobs
- Plan(id, user_id, city_id, start_date, days, pace, slot_minutes, state)
- Journey(id, plan_id, created_at) — Confirm → Result 一次路径
- HQJob(id, plan_id, status, created_at, finished_at, result_ref)
- IngestJob(id, user_id, status, created_at, finished_at)

## Analytics IDs（只存必要索引）
- Event(id, plan_id, journey_id, session_id, ts, name, props_json) — 实际事件体保存在埋点系统

## Indexing & Performance
- GiST on POI(geog)；L2Group(l1_id, centroid)；Membership(l2_id, role)
- JSONB for rules/duration/hours


---

## Source: `docs/architecture/rest-api-spec.md`

# REST API Spec (High-level)

> SSOT：以 `docs/api/openapi.yaml` 为准。本文为概要清单，落地时须回填 OpenAPI。

## Ingest / XHS
- POST /ingest/xhs {url}
- SSE /ingest/{job_id}/events — stages: created|fetching|parsing|geo|storing|done

## Planner / Skeleton
- POST /plan/generate {city,start,days,pace,selected_items[]}
- GET  /plan/{plan_id}
- POST /plan/validate {plan_id} → {hard_cnt,soft_cnt,suggestions[]}
- POST /plan/fix {plan_id, action}

## Planner / HQ
- POST /plan/hq/start {plan_id} → {hq_job_id}
- GET  /plan/hq/status?hq_job_id → {state:'running|done|failed'}
- POST /plan/hq/adopt {plan_id,hq_job_id} → merge & version

## Filler / AI Fill
- POST /fill/apply {plan_id, scope:'all|slot', slot_id?}

## Export
- POST /export/png {plan_id, width_px, slice_by_day}

## Settings / BYOK
- POST /byok/validate {key}
- POST /byok/save {key}

## Observability hooks
- POST /events (optional relay)


---

## Source: `docs/architecture/observability.md`

# Observability & Analytics

## IDs & Correlation
- session_id：会话
- user_id（匿名/哈希）
- plan_id：计划跨会话/设备恢复
- journey_id：Confirm→Result 的一次路径
- event_id / prev_event_id / seq / timestamp_ms：事件链
- trace_id / span_id：与后端/Langfuse/Sentry 对齐
- hq_job_id / ingest_job_id：任务级追踪
- plan_token：深链回连

## Event Envelope（必携）
```json
{
  "event_id":"uuidv4",
  "prev_event_id":"uuidv4?",
  "seq":123,
  "timestamp_ms": 1730539200000,
  "session_id":"...",
  "journey_id":"...",
  "plan_id":"...",
  "trace_id":"...",
  "span_id":"..."
}
```

## Metrics & Funnels（对齐前端规格）
- TTFP、HQ 采用率、可行性修复成功率、导出率、添加→落位转化、入库可达率、交互性能
- 漏斗：
  1) confirm_open → confirm_continue → picker_generate_skeleton → skeleton_open → aifill_open → export_success
  2) skeleton_open → skeleton_hq_status.done → skeleton_hq_switch_adopt → skeleton_hq_switch_adopt_result.success

## Logging & Tracing
- Langfuse：provider 调用、prompt 版本、输入输出摘要
- Sentry：前后端统一错误码（INGEST_*/PLAN_*/FILL_*）

参见：`../ops/analytics.md`（埋点与看板）、`../ops/events.json`（事件样例）

## Privacy
- 不采集 PII；BYOK 无明文；错误与事件脱敏；最小必要原则


---

## Source: `docs/architecture/testing-strategy.md`

# Testing Strategy

## Levels
- Unit：业务逻辑与适配器
- Integration：模块交互、DB/Geo/Provider 接口
- E2E（轻量）：关键用户路径（Confirm→Skeleton→AI Fill→Export）

## Tooling
- Jest/TS、supertest、playwright（如需）
- promptfoo：离线 A/B 小集回归（提示版本/输出摘要）

## Priorities
- P0：Planner 可行性与 Quick/HQ 合并、Export、Provider 失败降级
- P1：Ingest 标准化与分店裁剪
- P2：UI 行为与弱网降级

## Non-Functional
- 性能：TTFP、HQ ready、Export 时间
- 观测：事件包头完整性、错误码一致性

## CI
- 运行单元 + 集成；必要时轻量 e2e；失败样本保留


---

## Source: `docs/architecture/compatibility.md`

# Compatibility (v0.3 → v0.4)

| 主题 | v0.3 | v0.4 |
|---|---|---|
| 抽取策略 | text→OCR→VLM 分级流水线 | VLM 默认启用（图+文），失败降级“仅媒体+待定位” |
| Provider | 无统一抽象 | OpenAI 兼容（api_base+model），远程切换/回退，BYOK 覆盖 |
| 数据层 | cluster + POI | L1/L2/L3；L3→L2 多归属；连锁抑制；分店≤20 & 2km 裁剪 |
| 编排 | 2h 槽 + seed | Quick（L2 2h/4h，仅主景点）+ HQ 后台并行（“切换-采用”） |
| 展示 | 2h 槽 | 2h/4h 槽；餐时分割 A/B 为展示模式 |
| 观测 | 分散事件 | journey_id/plan_id/event_id/trace/span/hq_job/ingest_job 统一 |
| 文档形态 | 单体 architecture.md | 分片：index, tech-stack, frontend/backend, data-models, rest-api-spec, observability, testing |

> 冲突时，以 v0.4 为准。


---

## Source: `docs/api/INDEX.md`

# API & Schemas Index

## OpenAPI (SSOT)
- `./openapi.yaml`
  - 生成类型：`packages/types` → `pnpm --filter @nomad/types run generate`

## JSON Schemas
- SSE 事件：`./sse-events.schema.json`
- Fill 输出：`../../packages/prompts/schemas/fill-output.schema.json`

## 相关文档
- 架构入口（v0.4）：`../architecture/index.md`
- 观测与埋点：`../architecture/observability.md`
- 前端规格：`../front-end-spec.md`

## 参考与运维
- 错误码目录：`../ops/error-codes.md`
- 埋点与看板：`../ops/analytics.md`
- 事件样例：`../ops/events.json`
- 特性开关：`../ops/feature-flags.md`
- 环境配置：`../ops/env.md`
- 速率限制：`../ops/rate-limits.md`
- 数据库 DDL：`../db/schema.sql`

> 说明：当 OpenAPI 与其它 Markdown 描述不一致时，以 OpenAPI 为准；其余文档应回填对齐。


---

## Source: `docs/api/openapi.yaml`

openapi: 3.0.3
info:
  title: nomad-mvp API
  version: 1.0.0
  description: |
    Core asynchronous workflows with SSE. Latency SLOs are user-perceived:
    ACK (HTTP accept), TTFU (first SSE event), Keep-alive (max gap ≤10s).
servers:
  - url: https://api.example.com
    description: Example server (replace in deployment)
tags:
  - name: Ingest
  - name: Plans
  - name: Export
  - name: SSE
  - name: Auth
  - name: Sessions
  - name: BYOK
  - name: ResultSheet
  - name: Search
  - name: Feedback
paths:
  /ingest/start:
    post:
      tags: [Ingest]
      summary: Start ingest of a single Xiaohongshu link (async)
      operationId: startIngest
      deprecated: true
      description: Use POST /ingest/xhs instead.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IngestStartRequest'
      responses:
        '202':
          description: Accepted; ingest job created
          headers:
            X-Trace-Id:
              description: Correlation id for tracing
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestStartResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /ingest/xhs:
    post:
      tags: [Ingest]
      summary: Start ingest by Xiaohongshu share link (async)
      operationId: ingestXhs
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IngestXhsRequest'
      responses:
        '202':
          description: Accepted; ingest job created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestStartResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /ingest/{job_id}/events:
    get:
      tags: [SSE]
      summary: SSE stream for ingest job events (alias path)
      operationId: ingestEvents
      parameters:
        - in: path
          name: job_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Server-Sent Events stream
          content:
            text/event-stream:
              schema:
                type: string
              examples:
                example:
                  value: |
                    id: 01J0...
                    event: ingest
                    data: {"trace_id":"t-1","ingest_id":"ing_123","state":"created","retry":0,"ts":1730000000}
                    
                    event: ping
                    data: {"seq":1,"heartbeat_ms":10000,"ts":1730000010}

  /sse/ingest/{ingest_id}:
    get:
      tags: [SSE]
      summary: SSE stream for ingest job events
      operationId: sseIngest
      deprecated: true
      description: Use GET /ingest/{job_id}/events instead.
      parameters:
        - in: path
          name: ingest_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Server-Sent Events stream
          headers:
            Cache-Control:
              schema: { type: string }
            X-Trace-Id:
              schema: { type: string }
          content:
            text/event-stream:
              schema:
                type: string
                description: SSE lines (id/event/data) where data conforms to IngestEvent schema
              examples:
                example:
                  value: |
                    id: 01J0...
                    event: ingest
                    data: {"trace_id":"t-1","ingest_id":"ing_123","state":"created","retry":0,"ts":1730000000}
                    
                    event: ping
                    data: {"seq":1,"heartbeat_ms":10000,"ts":1730000010}

  /plan/generate:
    post:
      tags: [Plans]
      summary: Generate day-level skeleton (partial fill) asynchronously
      operationId: planGenerate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PlanGenerateRequest'
      responses:
        '202':
          description: Accepted; plan job created
          headers:
            X-Trace-Id:
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlanGenerateResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '409': { $ref: '#/components/responses/Error409' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /sse/plan/{plan_job_id}:
    get:
      tags: [SSE]
      summary: SSE stream for plan generation events
      operationId: ssePlan
      parameters:
        - in: path
          name: plan_job_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Server-Sent Events stream for plan phases
          content:
            text/event-stream:
              schema: { type: string }
              examples:
                example:
                  value: |
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"started","ts":1730000000}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"freeze","ts":1730000001}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"must_go","ts":1730000002}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"quota","ts":1730000003}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"candidates","ts":1730000004}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"place","ts":1730000005}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"validate","ts":1730000006}
                    event: plan
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","phase":"persist","ts":1730000007}
                    event: anchors_ready
                    data: {"trace_id":"t-1","plan_job_id":"pj_1","city":"HZ","season":"autumn","tod":"evening","ready":true}

  /plan/slots/{slot_id}:
    patch:
      tags: [Plans]
      summary: Edit a slot (move/retime/replace/delete) with optimistic locking
      operationId: editSlot
      parameters:
        - in: path
          name: slot_id
          required: true
          schema: { type: string }
        - in: header
          name: If-Match-Rev
          required: true
          schema: { type: integer, format: int32, minimum: 1 }
          description: Current plan revision for optimistic concurrency
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SlotPatchRequest'
      responses:
        '200':
          description: Slot edited
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SlotPatchResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '409': { $ref: '#/components/responses/Error409' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /plan/ai-fill:
    post:
      tags: [Plans]
      summary: Start one-shot AI fill over remaining controllable slots (async)
      operationId: aiFill
      deprecated: true
      description: Use POST /fill/apply instead.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AiFillRequest'
      responses:
        '202':
          description: Accepted; fill run created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiFillResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /fill/apply:
    post:
      tags: [Plans]
      summary: Apply AI fill over remaining controllable slots (async)
      operationId: fillApply
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AiFillRequest'
      responses:
        '202':
          description: Accepted; fill run created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiFillResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /plan/{plan_id}/result-sheet:
    get:
      tags: [ResultSheet]
      summary: Get read-only result sheet (slots + AI suggestions + citations)
      operationId: getResultSheet
      parameters:
        - in: path
          name: plan_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Result sheet
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ResultSheetResponse' }
        '401': { $ref: '#/components/responses/Error401' }
        '404': { $ref: '#/components/responses/Error400' }

  /plan/{plan_id}:
    get:
      tags: [Plans]
      summary: Get plan (alias of result-sheet for convenience)
      operationId: getPlan
      parameters:
        - in: path
          name: plan_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Plan (result-sheet payload)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ResultSheetResponse' }
        '401': { $ref: '#/components/responses/Error401' }
        '404': { $ref: '#/components/responses/Error400' }

  /plan/slots/{slot_id}/status:
    patch:
      tags: [Plans]
      summary: Toggle or set slot status (checked)
      operationId: patchSlotStatus
      parameters:
        - in: path
          name: slot_id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SlotStatusPatchRequest' }
      responses:
        '200':
          description: Status updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SlotStatusPatchResponse' }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  /plan/slots/{slot_id}/overrides:
    patch:
      tags: [Plans]
      summary: Set or update slot text overrides (do/prepare/notice)
      operationId: patchSlotOverrides
      parameters:
        - in: path
          name: slot_id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SlotOverridesPatchRequest' }
      responses:
        '200':
          description: Overrides updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SlotOverridesPatchResponse' }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
    delete:
      tags: [Plans]
      summary: Clear slot text overrides (revert to AI)
      operationId: deleteSlotOverrides
      parameters:
        - in: path
          name: slot_id
          required: true
          schema: { type: string }
      responses:
        '204': { description: Cleared }
        '401': { $ref: '#/components/responses/Error401' }

  /sse/fill/{fill_run_id}:
    get:
      tags: [SSE]
      summary: SSE stream for AI fill run
      operationId: sseFill
      parameters:
        - in: path
          name: fill_run_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Server-Sent Events stream for fill phases and result updates
          content:
            text/event-stream:
              schema: { type: string }
              examples:
                example:
                  value: |
                    event: fill
                    data: {"trace_id":"t-1","fill_run_id":"fr_1","state":"started"}
                    event: result_sheet_updated
                    data: {"trace_id":"t-1","plan_id":"pl_1","slot_id":"s_1","source":"override","ts":1730000100}

  /export/png:
    post:
      tags: [Export]
      summary: Export itinerary as PNG/WebP, auto-slicing by day when needed
      operationId: exportPng
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExportPngRequest'
      responses:
        '200':
          description: Exported files
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExportPngResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  # --- Plan Validation & Fix ---
  /plan/validate:
    post:
      tags: [Plans]
      summary: Validate plan feasibility and return conflicts/suggestions
      operationId: planValidate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [plan_id]
              properties:
                plan_id: { type: string }
      responses:
        '200':
          description: Validation results
          content:
            application/json:
              schema:
                type: object
                properties:
                  hard_cnt: { type: integer }
                  soft_cnt: { type: integer }
                  conflicts:
                    type: array
                    items: { $ref: '#/components/schemas/ValidatorConflict' }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  /plan/fix:
    post:
      tags: [Plans]
      summary: Apply a suggested fix or atomic ops to reduce conflicts
      operationId: planFix
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [plan_id]
              properties:
                plan_id: { type: string }
                suggestion_id: { type: string, nullable: true }
                apply_sequence:
                  type: array
                  items: { $ref: '#/components/schemas/FixAtomicOperation' }
      responses:
        '200': { description: Fix applied }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '409': { $ref: '#/components/responses/Error409' }

  # --- HQ background planning ---
  /plan/hq/start:
    post:
      tags: [Plans]
      summary: Start high-quality background planning for a plan
      operationId: hqStart
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [plan_id]
              properties:
                plan_id: { type: string }
      responses:
        '202':
          description: HQ job started
          content:
            application/json:
              schema:
                type: object
                properties:
                  hq_job_id: { type: string }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  /plan/hq/status:
    get:
      tags: [Plans]
      summary: Get HQ job status
      operationId: hqStatus
      parameters:
        - in: query
          name: hq_job_id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: HQ status
          content:
            application/json:
              schema:
                type: object
                properties:
                  state: { type: string, enum: [running, done, failed] }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  /plan/hq/adopt:
    post:
      tags: [Plans]
      summary: Adopt the HQ plan result and merge as current plan
      operationId: hqAdopt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [plan_id, hq_job_id]
              properties:
                plan_id: { type: string }
                hq_job_id: { type: string }
      responses:
        '200': { description: Adopted }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  # --- BYOK helpers ---
  /byok/validate:
    post:
      tags: [BYOK]
      summary: Validate a user-provided API key without storing it
      operationId: byokValidate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [key]
              properties:
                key: { type: string }
      responses:
        '200':
          description: Validation result
          content:
            application/json:
              schema:
                type: object
                properties:
                  valid: { type: boolean }
                  provider: { type: string, nullable: true }
        '400': { $ref: '#/components/responses/Error400' }

  /byok/save:
    post:
      tags: [BYOK]
      summary: Save BYOK (encrypted) — alias for /user-key
      operationId: byokSave
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [key]
              properties:
                key: { type: string }
      responses:
        '204': { description: Saved }
        '400': { $ref: '#/components/responses/Error400' }


  /search/poi:
    get:
      tags: [Search]
      summary: Text-only POI search (MVP FR44-lite)
      operationId: searchPoi
      parameters:
        - in: query
          name: city
          required: true
          schema: { type: string }
        - in: query
          name: q
          required: true
          schema: { type: string }
        - in: query
          name: topk
          required: false
          schema: { type: integer, default: 5, minimum: 1, maximum: 10 }
      responses:
        '200':
          description: Top‑K results
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items: { $ref: '#/components/schemas/SearchPoiItem' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /plans/{plan_id}/candidates:
    post:
      tags: [Plans]
      summary: Manually add a candidate by name/address/coords (MVP minimal)
      operationId: addCandidate
      parameters:
        - in: path
          name: plan_id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CandidateAddRequest' }
      responses:
        '200':
          description: Added candidate
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CandidateAddResponse' }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  /plan/days/{day}/hotel:
    patch:
      tags: [Plans]
      summary: Set or change hotel for a day (display-only slot)
      operationId: setHotel
      parameters:
        - in: path
          name: day
          required: true
          schema: { type: integer, minimum: 1 }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SetHotelRequest' }
      responses:
        '200': { description: Hotel updated }
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }

  # --- Auth & Sessions ---
  /auth/otp/start:
    post:
      tags: [Auth]
      summary: Start OTP flow (SMS)
      operationId: authOtpStart
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [phone]
              properties:
                phone: { type: string }
                captcha_token: { type: string, nullable: true }
      responses:
        '200':
          description: OTP sent (or simulated for test)
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, enum: [ok] }
        '400': { $ref: '#/components/responses/Error400' }
        '429': { $ref: '#/components/responses/Error429' }

  /auth/otp/verify:
    post:
      tags: [Auth]
      summary: Verify OTP and create session
      operationId: authOtpVerify
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [phone, code]
              properties:
                phone: { type: string }
                code: { type: string }
                device_id: { type: string }
      responses:
        '200':
          description: Session created
          headers:
            X-Device-Id:
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionResponse'
        '400': { $ref: '#/components/responses/Error400' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }

  /sessions/me:
    get:
      tags: [Sessions]
      summary: Get current session
      operationId: sessionsMe
      responses:
        '200':
          description: Current session
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionResponse'
        '401': { $ref: '#/components/responses/Error401' }

  /sessions:
    get:
      tags: [Sessions]
      summary: List my sessions
      operationId: sessionsList
      responses:
        '200':
          description: Sessions
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessions:
                    type: array
                    items: { $ref: '#/components/schemas/Session' }
        '401': { $ref: '#/components/responses/Error401' }

  /sessions/{id}:
    delete:
      tags: [Sessions]
      summary: Revoke a session
      operationId: sessionsDelete
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '204': { description: Deleted }
        '401': { $ref: '#/components/responses/Error401' }

  /feedback/link:
    get:
      tags: [Feedback]
      summary: Get feedback product URL (support.qq.com)
      description: Returns the official product URL (https://support.qq.com/product/{PRODUCT_ID}). If product login state is enabled server-side, parameters per official spec may be attached.
      operationId: getFeedbackLink
      parameters:
        - in: query
          name: source
          required: false
          schema: { type: string }
          description: Source page or context for analytics.
      responses:
        '200':
          description: Product URL
          content:
            application/json:
              schema: { $ref: '#/components/schemas/FeedbackLinkResponse' }
        '401': { $ref: '#/components/responses/Error401' }
        '429': { $ref: '#/components/responses/Error429' }
        '500': { $ref: '#/components/responses/Error500' }

  /auth/bind/apple:
    post:
      tags: [Auth]
      summary: Bind Apple identity
      operationId: bindApple
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [id_token]
              properties:
                id_token: { type: string }
      responses:
        '200': { description: Bound }
        '401': { $ref: '#/components/responses/Error401' }
  
  /auth/bind/wechat:
    post:
      tags: [Auth]
      summary: Bind WeChat identity
      operationId: bindWeChat
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [code]
              properties:
                code: { type: string }
      responses:
        '200': { description: Bound }
        '401': { $ref: '#/components/responses/Error401' }

  # --- BYOK ---
  /user-key:
    get:
      tags: [BYOK]
      summary: Get masked BYOK status
      operationId: getUserKey
      responses:
        '200':
          description: Key status
          content:
            application/json:
              schema:
                type: object
                properties:
                  configured: { type: boolean }
    post:
      tags: [BYOK]
      summary: Set or replace BYOK (encrypted and envelope stored)
      operationId: setUserKey
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [key]
              properties:
                key: { type: string }
      responses:
        '204': { description: Saved }
        '400': { $ref: '#/components/responses/Error400' }
    delete:
      tags: [BYOK]
      summary: Delete BYOK
      operationId: deleteUserKey
      responses:
        '204': { description: Deleted }
        '401': { $ref: '#/components/responses/Error401' }

components:
  securitySchemes:
    SessionAuth:
      type: apiKey
      in: cookie
      name: sid
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    FeedbackLinkResponse:
        type: object
        required: [url]
        properties:
          url: { type: string, format: uri }
    Session:
      type: object
      required: [id, device_id, expires_at]
      properties:
        id: { type: string }
        device_id: { type: string }
        expires_at: { type: string, format: date-time }
        created_at: { type: string, format: date-time }

    SessionResponse:
      type: object
      properties:
        user:
          type: object
          properties:
            id: { type: string }
            phone: { type: string, nullable: true }
        session: { $ref: '#/components/schemas/Session' }
    ErrorEnvelope:
      type: object
      required: [error_code, error_message]
      properties:
        error_code: { type: string, example: INGEST_TIMEOUT }
        error_message: { type: string }
        retriable: { type: boolean }
        details: { type: object, additionalProperties: true }

    IngestStartRequest:
      type: object
      required: [source]
      properties:
        source: { type: string, enum: [xhs] }
        share_text: { type: string, nullable: true }
        url: { type: string, format: uri, nullable: true }
        force: { type: boolean, description: 'Bypass idempotency (admin/feature-flag)' }

    IngestStartResponse:
      type: object
      required: [ingest_id, state]
      properties:
        ingest_id: { type: string }
        state: { type: string, enum: [created] }
        sse_url: { type: string, example: '/sse/ingest/ing_123' }

    IngestXhsRequest:
      type: object
      required: [url]
      properties:
        url: { type: string, format: uri }

    PlanGenerateRequest:
      type: object
      required: [city, start_date, days]
      properties:
        city: { type: string }
        start_date: { type: string, format: date }
        days: { type: integer, minimum: 1 }
        pace: { type: string, enum: [slow, normal, fast], default: normal }
        selected_items:
          type: array
          items:
            type: object
            required: [item_id]
            properties:
              item_id: { type: string }
              poi_id: { type: string }
              must_go: { type: boolean }
              time_hint: { type: string, enum: [morning, afternoon, evening], nullable: true }
              stay_minutes_hint: { type: integer, minimum: 0 }

    PlanGenerateResponse:
      type: object
      required: [plan_id, plan_job_id]
      properties:
        plan_id: { type: string }
        plan_job_id: { type: string }
        sse_url: { type: string, example: '/sse/plan/pj_1' }

    SlotPatchRequest:
      type: object
      required: [op]
      properties:
        op: { type: string, enum: [move, retime, replace, delete] }
        new_day: { type: integer, minimum: 1 }
        new_start: { type: string, pattern: '^[0-2][0-9]:[0-5][0-9]$' }
        new_end: { type: string, pattern: '^[0-2][0-9]:[0-5][0-9]$' }
        replace_with_poi_id: { type: string }

    SlotPatchResponse:
      type: object
      required: [undo_token, plan_rev]
      properties:
        undo_token: { type: string }
        plan_rev: { type: integer, minimum: 1 }

    AiFillRequest:
      type: object
      required: [plan_id]
      properties:
        plan_id: { type: string }
        dry_run: { type: boolean, default: false }

    AiFillResponse:
      type: object
      required: [fill_run_id]
      properties:
        fill_run_id: { type: string }
        sse_url: { type: string, example: '/sse/fill/fr_1' }

    ExportPngRequest:
      type: object
      required: [plan_id]
      properties:
        plan_id: { type: string }
        width_px: { type: integer, enum: [1080, 1242], default: 1080 }
        slice_by_day: { type: boolean, default: true }
        theme: { type: string, enum: [light, dark], default: light }

    ExportPngResponse:
      type: object
      required: [files]
      properties:
        files:
          type: array
          items:
            type: object
            required: [url]
            properties:
              day: { type: integer, minimum: 1, nullable: true }
              url: { type: string, format: uri }
        format: { type: string, enum: [webp, jpeg] }
        fallback_reason: { type: string, nullable: true }

    SlotRecommendation:
      type: object
      properties:
        do: { type: string, nullable: true }
        prepare: { type: string, nullable: true }
        notice: { type: string, nullable: true }
        source: { type: string, enum: [ai, override], default: ai }

    ResultSheetResponse:
      type: object
      required: [plan_id, days]
      properties:
        plan_id: { type: string }
        days:
          type: array
          items:
            type: object
            required: [day, slots]
            properties:
              day: { type: integer, minimum: 1 }
              hotel:
                type: object
                nullable: true
                properties:
                  name: { type: string }
                  address: { type: string }
                  map_url: { type: string, nullable: true }
              slots:
                type: array
                items:
                  type: object
                  required: [slot_id, type, start, end, title]
                  properties:
                    slot_id: { type: string }
                    type: { type: string, enum: [activity, dining, nightlife, transport, hotel] }
                    start: { type: string }
                    end: { type: string }
                    title: { type: string }
                    checked: { type: boolean }
                    why_short: { type: string, nullable: true }
                    citations: { type: array, items: { type: string }, nullable: true }
                    recommendation:
                      $ref: '#/components/schemas/SlotRecommendation'

    SlotStatusPatchRequest:
      type: object
      properties:
        checked: { type: boolean }

    SlotStatusPatchResponse:
      type: object
      required: [slot_id, checked]
      properties:
        slot_id: { type: string }
        checked: { type: boolean }

    SlotOverridesPatchRequest:
      type: object
      properties:
        do:
          type: string
          maxLength: 90
          nullable: true
          description: Plain text only; no markup/HTML
          pattern: "^[^<>]*$"
        prepare:
          type: string
          maxLength: 90
          nullable: true
          description: Plain text only; no markup/HTML
          pattern: "^[^<>]*$"
        notice:
          type: string
          maxLength: 90
          nullable: true
          description: Plain text only; no markup/HTML
          pattern: "^[^<>]*$"
      additionalProperties: false

    SlotOverridesPatchResponse:
      type: object
      required: [slot_id]
      properties:
        slot_id: { type: string }
        recommendation:
          $ref: '#/components/schemas/SlotRecommendation'

    SearchPoiItem:
      type: object
      required: [poi_id, name, address]
      properties:
        poi_id: { type: string }
        name: { type: string }
        address: { type: string }
        distance_m: { type: integer, nullable: true }

    CandidateAddRequest:
      type: object
      required: [name]
      properties:
        name: { type: string }
        address: { type: string, nullable: true }
        lat: { type: number, format: double, nullable: true }
        lng: { type: number, format: double, nullable: true }

    CandidateAddResponse:
      type: object
      required: [candidate_id]
      properties:
        candidate_id: { type: string }

    SetHotelRequest:
      type: object
      required: [plan_id, hotel_poi_id]
      properties:
        plan_id: { type: string }
        hotel_poi_id: { type: string }

    # --- Validator & Fix (descriptive schemas; no new endpoints required) ---
    ValidatorConflictType:
      type: string
      description: Feasibility conflict type detected by Validator
      enum: [no_coords, closed, cross_day_unreachable, too_far, overtime, open_gap_short, transport_boundary, hotel_boundary]

    ConflictSeverity:
      type: string
      enum: [hard, soft]

    ValidatorConflict:
      type: object
      description: A single conflict with optional fix suggestions
      required: [type, severity]
      properties:
        type: { $ref: '#/components/schemas/ValidatorConflictType' }
        severity: { $ref: '#/components/schemas/ConflictSeverity' }
        day: { type: integer, nullable: true }
        slot_id: { type: string, nullable: true }
        details:
          type: object
          additionalProperties: true
        suggestions:
          type: array
          items: { $ref: '#/components/schemas/FixSuggestion' }
      example:
        type: too_far
        severity: soft
        day: 2
        slot_id: s_abc
        details:
          commute_minutes: 28
          limit_minutes: 18
        suggestions:
          - id: fix_1
            conflict_type: too_far
            safe: true
            requires_user_input: false
            score: 0.87
            actions:
              - type: reorder
                notes: "Swap with previous slot to reduce commute"
            apply_sequence:
              - op: move
                slot_id: s_abc
                new_day: 2
                new_start: "14:00"
                new_end: "16:00"
              - op: move
                slot_id: s_prev
                new_day: 2
                new_start: "16:00"
                new_end: "18:00"
          - id: fix_2
            conflict_type: too_far
            safe: true
            requires_user_input: true
            score: 0.81
            actions:
              - type: replace_with_alternative
                notes: "Use nearer candidate"
            apply_sequence:
              - op: replace
                slot_id: s_abc
                replace_with_poi_id: poi_nearby_1

    FixActionType:
      type: string
      description: High-level fix strategy
      enum: [reorder, move, retime, shorten_stay, replace_with_alternative, shift_day, align_to_boundary, suggest_insert_candidate]

    FixAction:
      type: object
      required: [type]
      properties:
        type: { $ref: '#/components/schemas/FixActionType' }
        notes: { type: string, nullable: true }

    FixAtomicOperation:
      type: object
      description: |
        Atomic operations map to existing APIs:
        - move/retime/replace/delete → PATCH /plan/slots/{slot_id}
        - set_hotel → PATCH /plan/days/{day}/hotel
      required: [op]
      properties:
        op:
          type: string
          enum: [move, retime, replace, delete, set_hotel]
        slot_id: { type: string, nullable: true }
        day: { type: integer, nullable: true }
        new_day: { type: integer, nullable: true }
        new_start: { type: string, pattern: '^[0-2][0-9]:[0-5][0-9]$', nullable: true }
        new_end: { type: string, pattern: '^[0-2][0-9]:[0-5][0-9]$', nullable: true }
        replace_with_poi_id: { type: string, nullable: true }
        hotel_poi_id: { type: string, nullable: true }

    FixSuggestion:
      type: object
      required: [id, conflict_type, actions]
      properties:
        id: { type: string }
        conflict_type: { $ref: '#/components/schemas/ValidatorConflictType' }
        safe: { type: boolean, description: 'Does not modify frozen/must_go/time_hint' }
        requires_user_input: { type: boolean, description: 'Needs user to pick an alternative or candidate' }
        score: { type: number, format: double, description: 'Higher is better; deterministic tie-break' }
        actions:
          type: array
          items: { $ref: '#/components/schemas/FixAction' }
        apply_sequence:
          type: array
          description: Ordered atomic ops to apply using existing endpoints
          items: { $ref: '#/components/schemas/FixAtomicOperation' }
      example:
        id: fix_1
        conflict_type: too_far
        safe: true
        requires_user_input: false
        score: 0.87
        actions:
          - type: reorder
            notes: "Swap with previous slot to reduce commute"
        apply_sequence:
          - op: move
            slot_id: s_abc
            new_day: 2
            new_start: "14:00"
            new_end: "16:00"

  responses:
    Error400:
      description: Bad Request
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Error401:
      description: Unauthorized
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Error409:
      description: Conflict (Optimistic locking / idempotency)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Error429:
      description: Too Many Requests (rate limited)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Error500:
      description: Internal Server Error
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
