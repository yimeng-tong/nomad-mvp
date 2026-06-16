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

