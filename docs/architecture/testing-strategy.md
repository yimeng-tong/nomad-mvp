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

