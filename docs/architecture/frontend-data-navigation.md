---
status: approved-target
updated: 2026-09-20
scope_revision: ui-foundation-2026-09-20
implementation_status: pending-owning-stories
---

# 前端数据读取与导航责任

用户2026-09-20已批准TanStack Query（9.6）与TanStack Router（9.7）纳入本期，分别准备/实施/回归。保留认证、operation journal、持久cursor与业务回执的当前权威。

## AR27 — Query只管理普通服务器读取

试点限定 Home/Planner 的城市与 owner 灵感列表读取，证明取消、去重、失败/空结果、分页和刷新。未来已发布行程读取由其业务 Story 扩展。Query 管普通服务端读取；表单与 Sheet 状态仍在页面，operation journal、幂等回执、durable cursor/lease 仍归现有控制器，身份/原生凭据仍归鉴权层。

Query 默认行为包含 stale/refetch/retry，不能直接用于当前恢复链。[Query 概览](https://tanstack.com/query/latest/docs/framework/react/overview)、[默认行为](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

Nomad 的adapter 默认关闭自动 focus/reconnect refetch 与自动 retry；先由现有身份恢复协调器确认身份，再按资源显式刷新。请求使用现有 Web/native transport、AbortSignal 与 owner/session/activity fencing；private key 包含 owner、资源、筛选及必要 revision，未知身份 disabled 且不显示 private placeholder/cache。切 owner/撤权取消并清旧 cache，迟到结果仍被拒绝。首批不持久化 Query 私有缓存；城市公共数据单独命名空间。业务 mutation 不启用离线队列或自动重试，不包裹已有 operation 回执控制器形成双重写入责任。

## AR28 — Router只管理安全导航

试点现有 Home、Settings、Planner/DayPlan，并建立 S0–S11 typed route contract；未实现页面不创建假可达入口。Web 路由使用可刷新/直达的真实部署 fallback；原生路由历史与收到的外部深链分开，只有经过当前 input-v1/认证回调校验的 typed intent 才能进入导航。[Router 官方说明](https://tanstack.com/router/latest/docs/overview)

路由只存必要 public reference、允许的 stage/date/scope，不放 token、原始私人输入、受保护 URL 或完整草稿；关闭私有路径自动 prefetch，loader 只读且经过身份 guard。Android 返回由一个协调入口按键盘/Sheet/页面/root 分配，取消旧 App/页面重复 handler。离页保护复用既有未提交规则，保留 scroll/focus；导航不创造 operation、不启动 planning、不重播 transient Sheet。身份未知先遮蔽并核对，恢复到仍有效 parent；无权/缺失/过期参数不给跨 owner 回退。Query 和 Router 各自有独立绿灯与回退，不互相成为整 Story 前置。

## 表单与观测边界

建议 2.3 的日期/到离开多字段表单作为 RHF + Zod 的最小试点，2.5 住宿、2.6 约束、7.6 反馈及运营纠错随后按复杂度采用。后端仍为业务权威；共享的只是无秘密的字段规则，业务资格、日期事实与 revision 判断仍在服务器。dirty 不是已持久化，表单 mount/validation 不提交。现有后端 Zod 版本不因前端工具强制升大版本。[React Hook Form](https://github.com/react-hook-form/react-hook-form)

Sentry/Langfuse 和评测的隐私/真实查询/无双计数仍按 8.1/8.2 及首次消费 Story 验收，不引入第二套遥测或把 Storybook telemetry 作为产品指标。

## 独立回退和证据

9.6仅首先替换Home/Planner城市与owner灵感读取，9.7仅覆盖已有Home/Settings/Planner/DayPlan及typed S0–S11合同；未实现页面不得假可达。两个改造串行、分别审阅和验证。无需为普通读取迁移数据库，导航自身不产生mutation。身份/私有URL、取消、stale revision、重复恢复和平台返回的回归按各Story闭环，不复用别的Story的verified状态。
