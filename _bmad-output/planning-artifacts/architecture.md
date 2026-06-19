# Nomad MVP Architecture Input Package

Generated: 2026-06-19

This BMAD input package uses the v0.4 architecture shards referenced by `docs/architecture/index.md`. It intentionally excludes the deprecated root architecture as an implementation source.

Note: `docs/api/openapi.yaml` remains the API source of truth for implementation. Existing BYOK compatibility routes in OpenAPI are not part of the MVP user path.

---


## Source: `docs/architecture/index.md`

# Nomad MVP Architecture (v0.4)

本架构为 v4 分片文档，按前后端与数据/观测拆分，覆盖 VLM 默认启用、LLM Provider 抽象（OpenAI 兼容：api_base+model，服务端托管 Provider secrets）、L1/L2/L3 数据层、Planner 的 Quick L2 与 HQ 并行（“切换-采用”）、2h/4h 槽位与餐时分割 A/B、全链路埋点与唯一标识。

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
- LLM Provider 抽象（api_base + model），可远程切换/回退；Provider secrets 服务端托管；Langfuse 追踪；平台额度/成本控制。
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
- VLM：默认启用（图+文/关键帧抽取）；短视频高频抽帧；ASR 前先做语音检测，静音/BGM 跳过
- LLM Provider 抽象：OpenAI 兼容（api_base + model），远程切换/回退；Provider secrets 服务端托管；平台额度/成本控制；Langfuse 追踪

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
- 统一 API 封装；OpenAI 兼容 provider 调用仅由后端代理，前端不接触 Provider secrets
- 弱网降级：清单视图；本地缓存关键参数

## Components（与前端规格对齐）
- Confirm：CityPicker / PaceSegmentedControl / DateRangePickerFlexible / MorningStartTimePicker / TripConstraintForm（酒店/早餐/行李/预约） / SmartPlanSwitch / PrimaryCTA
- Picker：CityTabs / InspirationCardGrid / MapSheet / SelectedBasketPanel / LocationModal
- Skeleton：DayTabs / HQStatusBar / ABToggle(MealSplit) / PlanTimelineMobile / EmptySlotModal / FixSheet / SwitchAdoptBar
- AI Fill：AIFillPreviewList
- Result：ExportPreview / ExportButton
- Settings：AIQuotaPanel / FeedbackWebView（fallback 表单）

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
- Ingestor（小红书入库：获取→图文/关键帧抽取→语音检测后按需 ASR→COS 二存）
- GeoResolver（AMap 标准化与验证；标准名/地址/坐标/营业时间/评分/人均/电话；分店≤20；主 POI 2km 裁剪；连锁抑制）
- Planner（骨架/校验/编辑；Quick L2 与 HQ 并行）
- Filler（一次性填充；引用追溯）
- Export（PNG 导出）
- FeedbackLink（反馈 WebView 支持与降级）

## LLM Provider Abstraction
- OpenAI 兼容：`api_base + model`
- Provider 策略：远程切换/回退；Provider secrets 服务端托管；重试/超时/限流；平台额度/成本预算/异常熔断；Langfuse 全链路追踪
- VLM 默认启用：图+文/关键帧抽取；短视频高频抽帧；语音检测后按需 ASR；失败降级“仅媒体+待定位”

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
- Provider secrets 不下发前端；日志/埋点/观测脱敏；签名 URL；最小必要数据；AI 请求按用户/设备/workspace 做额度、限流、成本上限与降级

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
- POST /plan/generate {city,start,days,pace,selected_items[],hotels?,luggage_plan?,ticket_constraints?,hard_time_hints?}
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

## Settings / AI Usage
- GET /settings/ai-usage → quota, usage, queue/degrade state
- Existing BYOK compatibility endpoints are not part of the MVP user path.

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
- AI 额度与成本：quota_remaining_band、queue_rate、degrade_rate、provider_fallback_rate、cost_per_successful_plan、cost_guard_trip_count
- 漏斗：
  1) confirm_open → confirm_continue → picker_generate_skeleton → skeleton_open → aifill_open → export_success
  2) skeleton_open → skeleton_hq_status.done → skeleton_hq_switch_adopt → skeleton_hq_switch_adopt_result.success

## Logging & Tracing
- Langfuse：provider 调用、prompt 版本、输入输出摘要
- Sentry：前后端统一错误码（INGEST_*/PLAN_*/FILL_*）

参见：`../ops/analytics.md`（埋点与看板）、`../ops/events.json`（事件样例）

## Privacy
- 不采集 PII；Provider secrets 不进入前端、日志或事件；错误与事件脱敏；最小必要原则


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
| Provider | 无统一抽象 | OpenAI 兼容（api_base+model），远程切换/回退，服务端托管 Provider secrets，平台额度/成本控制 |
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
