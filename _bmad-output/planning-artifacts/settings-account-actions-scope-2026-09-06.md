---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
status: approved-scope-correction
story: '7.3'
storyContractApproved: true
storyContractApprovedDate: 2026-09-06
---

# Settings Scope Correction: 账号与可用操作

用户在 Story 7.3 定义期间明确要求：只展示账号及可用操作，额度不对用户暴露。
该条消息先确认范围修正；随后用户于 2026-09-06 确认完整 7.3 GWT 与 R2 原型，已写入队列。

## Confirmed Scope

- Story 7.3 改名为 `设置页账号与可用操作`，删除 AI 与用量分组、使用情况页及相应用量
  汇总 API/投影交付，不新增用户额度面板。
- 用户不看到已用/剩余次数、总额度、百分比、计量窗口、重置时间、token、内部预算或
  “额度不足/低额度”等额度分级。不能换个文案把同一额度表重新放回设置。
- 后台 first-use 配额、并发、成本预算、幂等计量、熔断与运营监控继续保留。
  后端依然是每次操作的准入权威；隐藏额度不是取消限流或承诺无限使用。
- 操作受限时只提供真实可用的操作与恢复路径，例如 `稍后重试 / 查看进度 / 返回手动编辑`。
  只有真实进入队列才能说排队，不伪造服务故障，也不在设置中自动重试生成。
- 既有生成任务进度仍在对应工作页面呈现，包含真实链接 N/X、已处理城市/槽位和输出
  图片份数等进度/产物事实；这些不是账户用量或额度，不因本决定被删除。
- 设置只负责只读账号信息、现有数据/隐私/反馈流程入口及当前会话退出。未部署能力
  不展示为可执行入口；已部署能力暂时失败保留其安全恢复路径。账号数据导出/删除、
  可靠反馈完整流程仍是 7.4-7.6，不在 7.3 扩张实现。
- R1 的用量原型和旧 18 场景草稿被替代，保留历史但不得指导 MVP。新 R2 仅含设置与
  退出确认；它示意数据/反馈能力已部署，7.3 的可用入口必须依据实际环境。

## Scope Checks

**Given** 当前用户打开设置或操作遇到后台额度/成本保护
**When** 客户端呈现可用性
**Then** 只展示账号及当前可用操作/真实恢复路径，不呈现额度或用量数据
**And** 服务端限流、预算、计量和熔断继续生效，不返回用户侧账户额度汇总用于展示

**Given** 已有规划、导入或导出任务仍在运行
**When** 查看对应工作页
**Then** 继续显示真实任务阶段和处理/产物数量，不能把它们当作需删除的额度面板
**And** 设置本身不添加全局生成状态仪表盘或新的自动重试入口

## Trace

- Source: user correction `只需要考虑展示账号及可用操作，额度不对用户暴露`.
- Source contracts: PRD FR12, FR25, FR38; UX-DR31; ops limits remain internal.
- Active review: `story-7-3-review-2026-09-06.md`.
- Superseded draft: `archive/story-7-3-usage-proposal-superseded-2026-09-06.md`.
- Superseded R1: `story-7-3-settings-usage-logout-r1.png`.
- Proposed R2: `story-7-3-account-actions-r2.png`.
