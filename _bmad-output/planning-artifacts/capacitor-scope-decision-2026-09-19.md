---
project: nomad-mvp
date: '2026-09-19'
scope_revision: capacitor-2026-09-19
status: approved
approved_by: yimeng-tong
approval_source: explicit-user-message-in-task-01a0b5df-312d-76f2-84cb-8d4b60dd69bf
proposal: _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-19.md
contracts_appendix: _bmad-output/planning-artifacts/sprint-change-capacitor-contracts-2026-09-19.md
snapshot_directory: _bmad-output/implementation-artifacts/archive/capacitor-scope-2026-09-19
scope_counts:
  epics: 9
  stories: 62
  historical_stories: 7
  current_target_stories: 55
  gwt_scenarios: 1052
  functional_requirements: 66
  mvp_functional_requirements: 62
  deferred_functional_requirements: 4
  nonfunctional_requirements: 25
new_story_ids: ['9.1', '9.2']
added_requirements: [FR52, NFR25]
added_gwt: 34
continuous_execution_authorized: true
decision_recording_required: true
coordination_thread: 01a0a132-7203-7871-bf0e-d33087ba371a
---

# Capacitor 范围批准与持续执行授权

用户本轮明确表示：“同意这些方案，我认为可以批准。继续完成这些步骤同步文档与合同 → 定向就绪检查 → 开发”。完整审批对象为主提案及合同附录：保留网页，首期 Android APK / iOS TestFlight；Android 10+、iOS 16+ 手机；App 相册保存与系统分享；新增 Epic 9 的 9.1 宿主和 9.2 测试交付，既有 Story 承担对应原生业务验收。

用户同时要求持续推进 BMAD Story，无需逐 Story 再授权；除不可绕过的必要 Key/资源等硬阻断外，能做的工作应继续。需要决策时允许先决定，并记录背景、决定、取舍和后果供阅读。该授权覆盖当前正式 MVP 队列的准备、开发、验证、审阅和必要文档/状态调整；不把未满足的验收条件改成已通过。可绕过的资源等待记录为对应切片阻断，继续独立任务；3.1 的真实上游、合同及迁移审计仍是恢复条件。

用户明确授权向现有任务“Nomad Sprint Planning”同步本次变更，可等待其当前轮次完成，也可直接插入。已选择直接发送协调消息以防两任务共同改写规划状态；当前任务负责规划/guard/9.1，原任务继续认证业务，并在正式交接后按更新合同调整 1.0、继续后续 BMAD 流程。最终协调记录另存 implementation-artifacts，避免把动态进度写回此批准基线。

用户要求本轮完成后设置 30 分钟周期检查。使用当前任务的周期唤醒检查原任务状态；状态不变保持安静，完成/实质阻断/交接需要动作时处理，发送过的同步消息不得每轮重复。定时配置结果与 ID 记录在交接文件。

原有 homelab 开发测试与整体开发测试后再公有云发布的顺序继续有效。保留既有数据、备份、历史已完成 Story 与延期项。必要真实服务联调在实际已有资源和具体目标范围内进行；不存在的凭据不可猜造，也不得将测试替身作为真实服务验收。此文件记录已收到的指令，不自行创造额外授权。

## 初始工程决策

- 按批准的 Direct Adjustment 路线同步源与实际合同，不重做未受影响页面。
- 9.1 提前形成可安装的现有登录/协议入口；1.0 共用后端可继续，其 App 关闭需宿主验证；9.2 最后完成发布候选与测试分发。
- 先保存逐文件哈希的修改前快照，再建立新有效 catalog/delivery；旧 SP/readiness/迁移文件保持历史含义。
- 只有所需原生构建/签名/设备真实证据完整才关闭 App Story；配置文件或 CI workflow 的存在不替代构建和安装实证。

本文件作为本次批准基线保持稳定。后续技术决定和验证进度以新 ADR/实施记录追加，不重写原批准事实。
