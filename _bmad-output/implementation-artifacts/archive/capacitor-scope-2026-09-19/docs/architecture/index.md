# Nomad MVP Architecture (v0.6)

Updated: 2026-09-14
Status: Approved Correct Course target architecture

本目录是实现规划的架构权威来源。它描述获批目标合同；未进入对应 story 前，
OpenAPI、Prisma 和代码仍可能只实现 v0.4 基线，不能因本文更新而被视为已交付。

## Current Decisions

- Story 1.0在真实用户/运营写入前补齐生产认证、多设备持久会话与最小服务端授权；历史1.1–1.5保持原交付记录。
- IR-03额外运营工具只保留手工纠错地点（FR4.2/1.11）：名称、地址、同城坐标的人工覆盖独立于Provider原始事实，版本化发布不回写用户历史行程。

- 用户只看到一个 PlanningJob 和一份完成计划；Quick/HQ/seed 只允许作为内部策略。
- Planner 编排完整地点与时间，Validator 校验及产生类型化修复，Filler 只完善执行细节。
- `Trip -> ordered TripSegment -> single-city Plan` 连接无固定数量上限的有序城市段；每个 Plan 仍只属于一个 City。
- 主 TripSegment 的一个本地日期可挂一个 `DayExcursion -> single-city Plan`，以去返两条
  TransferLeg 完成同日返回，不创建第二个同名宿主 segment。
- TripRevision 原子绑定主/一日游 PlanRevision、TransferLeg、Stay、LuggageTransition 和 DayExcursionRevision。
- Picker 使用 `required / along_route / unselected`，所有视图从同一状态源派生。
- BusinessArea 独立于行政区和 L1/L2；owner-scoped 导入美食查询需要可靠 membership。
- Story 1.3 是入库适配器基线；真实图文理解、视频抽帧/VAD/ASR和完整AMap事实分别由Story 1.9、1.10、1.11交付；1.8负责owner导入记录与去重。
- 航班/铁路班次、AMap terminal/route 与天气是分离的 provider-neutral facts，均需来源和新鲜度。
- 旅中定位允许App打开/回到前台有适用餐饮上下文时，凭仍有效的历史或本次授权单次刷新；
  同轮事件去重，不因系统撤权仍沿用旧许可。拒绝/陈旧时按计划上下文降级，不持续监听、
  后台刷新或保存轨迹，也不因候选更新修改行程。
- 行程后文本搜索先保存候选；无准确结果时可用同城已验证附近地标作显式近似路线
  代理，但目标与地标身份/事实必须隔离，时间轴落位由后续版本化命令负责。
- Provider secrets 服务端托管；BYOK 不属于 MVP 用户路径。
- Story 7.1 最近行程按 owner 聚合真实草稿/任务和当前 Plan/Trip；恢复位置独立于行程版本，
  `已生成` 不代表旅行结束。真实未完成修改与终止失败分开，重开不启动新规划。
- Story 7.2 打卡已于 2026-09-06 移出 MVP，AR16 不作为当前门槛。照片驱动标记和
  相册视频/九宫格/AI 美化仅为 FR40.1 后续方向，不新增本期相册或位置存储能力。
- Epic 7 的 7.3 账号/可用操作、7.4 结构化数据副本、7.5 停用/清理与受限恢复、
  7.6 真实反馈回执均已获批；额度不对用户展示，账号副本 ZIP 不改变行程图片规则。
  Feedback 自身交付时扩展导出/删除注册，不增加前向依赖；旧 WebView/邮件打开即成功
  语义不再有效。这里只确认目标合同，Epic 7 整体确认与后续实施门槛仍分开处理。

## Approved Epic 8 Budget Target

Story 8.4 was approved on 2026-09-13: one Node/PG budget authority, desktop Web operations,
atomic per-attempt reservations, distinct product counts/costs and conservative unknown holds.
Budget limits, tariff estimates, matched bills and independent supplier balances have different
sources. The backend/data/UX/ops shards describe the target; deployment/provider evidence remains
unverified. Story 8.5 terminal incident/outbox and desktop delivery controls were also approved on
2026-09-13; Telegram receipts are not read proof, and no-data is not service recovery. Story 8.6
overview adoption, 20 GWT and two desktop R1 boards were approved on the same date. The six
Epic 8 MVP stories and whole-Epic planning completion are confirmed (2026-09-14); final CE
workflow is complete. The 2026-09-14 IR snapshot found gaps; the user approved scoped resolutions
on 2026-09-15, tracked by the current revalidation in CURRENT.md. Historical reports remain
snapshots; business implementation and historical Sprint stay paused until the revised SP handoff.

## Document Index

- `tech-stack.md` - runtime, frameworks and infrastructure
- `source-tree.md` - actual workspace boundaries
- `frontend-architecture.md` - S0-S11 state and component boundaries
- `backend-architecture.md` - services, jobs and module ownership
- `data-models.md` - current/target aggregate and entity contracts
- `planner-orchestration-v2.md` - single-run planning, validation and enrichment
- `rest-api-spec.md` - target high-level API changes; OpenAPI remains SSOT
- `observability.md` - correlation, metrics and privacy
- `testing-strategy.md` - unit/integration/E2E/real-service gates
- `mvp-implementation-checklist.md` - Correct Course implementation gates
- `compatibility.md` - migration from v0.4 to v0.6
- `coding-standards.md` - code rules

## Authority and History

- API SSOT: `docs/api/openapi.yaml`; generated types are never hand-edited.
- DB implementation SSOT: `packages/prisma/schema.prisma` and migrations.
- UX source: `docs/front-end-spec.md` and `docs/ux/mobile-ia.md`.
- `architecture.md`, `v0.3/`, `planner-autoplace-v1.md` and UX delta files are historical.
- Where old text conflicts with v0.6, this index and its current shards win.

## Delivery Rule

Each target capability must be introduced by its assigned story with OpenAPI-first changes,
generated types, migration, ownership/idempotency/revision checks, focused tests, full build,
and real PostgreSQL/integration verification where persistence or external providers change.
