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

