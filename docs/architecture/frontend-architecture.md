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
