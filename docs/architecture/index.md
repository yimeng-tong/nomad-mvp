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
