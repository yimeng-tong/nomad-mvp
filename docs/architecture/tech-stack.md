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

