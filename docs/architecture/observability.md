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

