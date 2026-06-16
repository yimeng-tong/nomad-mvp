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

