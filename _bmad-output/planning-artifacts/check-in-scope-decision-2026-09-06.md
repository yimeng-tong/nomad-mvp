---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
status: approved-scope-deferral
story: '7.2'
decision: excluded-from-mvp
nextStoryToDefine: '7.3'
---

# Story 7.2 Scope Decision: 打卡移出 MVP

用户明确确认本期不做打卡，设计与交付重心保持在行程编排及旅行中的受控重编排。
这是当前 CE Step 3 的已批准范围收缩，不是实现完成，也不重开已获批 Story 7.1。

## Confirmed Disposition

- 原提案入口是 S10 行程单每个 POI 右侧直接打卡，内容页也可操作，并非必须逐个打开
  内容页。但用户不希望逐项维护标记，因此整个手动打卡交互从本期排除。
- 7.2 编号保留作延期记录，不重排 7.3-7.6，不追加 7.2 为可执行 GWT Story，不标 done。
  当前 Epic 7 MVP 顺序为 7.1 -> 7.3 -> 7.4 -> 7.5 -> 7.6，后四张仍需逐张定义/批准。
- 不新增打卡按钮、VisitOccurrence/VisitState/绑定迁移、打卡命令/状态查询或相关 API
  重构。现有 OpenAPI 占位不是已交付能力；本次仅变更规划文档，不改业务代码。
- AR16 的打卡架构补齐门槛随范围移至后续，不作为本期 IR/create-story 阻塞，也不能
  被记为“已经实现/验证通过”。原 7.2 手动交互、继承矩阵和架构方案未获批准，保留为历史。
- 最近行程、输入/任务恢复、分钟编辑、住宿/行李修改、冲突校验、显式 AI 调整、联程与
  一日游重编排继续按原范围。打卡状态不作为任何前置条件。
- 6.2/FR48 无定位时直接使用同一 scope 的上一计划 POI 与下一计划 POI；不查找本期
  不存在的完成记录，不按时钟推断已到访。只有一个基准时使用一个，都无时使用静态池/
  手动添加。单次前台授权定位保留，不能借未来照片需求开始持续存储轨迹。
- 原有行程长图导出保留；本次延期的是照片/相册类产物，不移除 Epic 5 的导出能力。

## Future Direction: FR40.1

方向已确认，交互、技术路线及验收合同留到后续版本：

1. 基于用户授权的相册照片及可用的已存地理位置数据解析关联景点。
2. 对存在照片证据的景点自动展示已打卡标志，降低逐项手工维护成本。
3. 支持将旅行照片制作成相册视频、九宫格，或使用 AI 绘图能力进行美化后导出。

这不是对当前相册读取/上传、后台扫描、轨迹收集或第三方模型传输的授权，也不说明
设备照片都带有精确位置。后续设计需再明确权限和照片选择范围、地理数据来源、无定位/
误匹配/重复到访的处理、证据修正、端侧与服务端分工、媒体保留与删除、费用和导出格式。
这些是待讨论问题，不在本次锁定答案，也不自动沿用旧手动 Story 7.2 的整套方案。

## Scope Acceptance Checks

**Given** 当前 MVP 最近行程或行程单正在设计/实现
**When** 确定用户可用操作
**Then** 保留查看、编排、编辑/重编排和现有行程长图导出，不新增逐 POI 打卡入口
**And** Story 7.2 标记为延期，不作为已开发、已验收或待本期实现的 Story

**Given** Readiness 或 Sprint Planning 检查 Epic 7 与前置依赖
**When** 发现 FR40、AR16 或旧 7.2 原型/草案
**Then** FR40 的 MVP 覆盖由 7.1 承担，AR16 不作为本期门槛，旧手动方案不生成执行任务
**And** FR40.1 为明确的 Post-MVP 待设计项，不因没有当前 Story 而误判为 MVP 漏需求

**Given** 旅中餐饮召回没有可用前台位置
**When** 选择降级依据
**Then** 使用明确标注的计划 POI 或静态池，不依赖打卡、照片解析或按时间伪造已完成
**And** 保持原单城市 scope、用户确认、校验/撤销与隐私约束

**Given** 后续重新启动照片自动标记与照片类导出设计
**When** 创建该版本的需求与 Story
**Then** 从本记录的三个方向重新梳理权限、证据、呈现和输出，不将旧手动打卡 AC 当作批准合同
**And** 不将“没有照片”直接等同于“没有去过”，具体纠错和置信处理仍需产品确认

## Trace and Preserved Artifacts

- Source: user confirmation `7.2确认暂时不做` and the accompanying photo/location/export direction.
- Source PRD: FR40 (recent trips only in MVP), FR40.1 (deferred photo-based direction), FR48.
- Retained historical draft: `story-7-2-review-2026-09-06.md`.
- Retained non-MVP visuals: `story-7-2-check-in-core-r1.png` and
  `story-7-2-check-in-recovery-identity-r1.png`, with original prompt traces.
- Follow-up backlog: `_bmad-output/implementation-artifacts/deferred-work.md`.
- Next CE item: define 7.3; no new execution story, sprint status or code changes in this decision.
