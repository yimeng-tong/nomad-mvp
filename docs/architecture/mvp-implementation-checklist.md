# MVP Implementation Checklist (v0.3-light)

## Backend
- [ ] Apply DB migration (overrides/status_checked/hotel_poi_id)
- [ ] Implement GET /search/poi (AMap keyword Top‑5)
- [ ] Implement POST /plans/{plan_id}/candidates (manual add)
- [ ] Implement PATCH /plan/days/{day}/hotel (set hotel display slot)
- [ ] Implement PATCH/DELETE /plan/slots/{slot}/overrides
- [ ] Ensure ResultSheet builder respects overrides (source=override)
- [ ] SSE: emit anchors_ready (plan) and result_sheet_updated (fill/override)
- [ ] Rate limits per docs/ops/rate-limits.md
- [ ] Analytics: emit API_* counters and latency metrics

## Frontend
- [ ] Skeleton page with 2h timeline, seed preview, conflict banner
- [ ] Slot bottom sheet: tabs=候选/AI/自由活动 + 顶部文本搜索（Top‑5）
- [ ] Hotel bottom sheet: 文本搜索 Top‑5 + 候选/AI 推荐；选择即设置 hotel_slot
- [ ] ResultSheet: 显示 why_short/引用；轻编辑 do/prepare/notice；单槽恢复 AI
- [ ] Export PNG trigger + progress
- [ ] Track APP_* analytics events

## Flags & Config
- [ ] Enable: near_hotel, result_sheet_light_edit_enabled
- [ ] FR44‑lite: search_topk, error messaging on weak network
- [ ] Disable: multi_city/transport_slot, hotel_auto_replan, history_snapshots

## QA & Observability
- [ ] E2E happy path: 输入→骨架→AI→轻编辑→导出
- [ ] Conflict gates verified（硬/软）
- [ ] Dashboards: funnels & latencies（see docs/ops/analytics.md）
