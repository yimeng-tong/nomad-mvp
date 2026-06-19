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
