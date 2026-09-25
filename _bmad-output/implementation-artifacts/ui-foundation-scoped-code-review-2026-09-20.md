---
scope: ui-contract-guards-and-existing-host-minimum
review_mode: full-scoped
status: passed-after-fixes
date: '2026-09-20'
whole_story_done: false
---

# UI范围检查器与平台配置限定CR

初始13个代码/配置文件、511行diff；修补及测试后15文件、730行diff。基线为62份前状态快照，排除此前业务实现。按bmad-code-review执行Blind/Edge/Acceptance三层，均使用独立上下文；10项patch、0 decision-needed、0 defer、0 dismiss。明确修复已在用户批准调整范围内完成，不重新询问。批准提案本身保持不可变，审阅结论落此独立报告，不把整张9.1或未来UI Story改done。

| 编号 | 来源 | 问题 | 修复 |
| --- | --- | --- | --- |
| R1 | blind | 停止边界覆盖已ready但未开始的Story | 以旧状态未进入in-progress/review/done为准，准备不会隐式允许开发。 |
| R2 | edge | 后续恢复必须遵守新的停止点 | 恢复记录显式声明stop_after_story和allowed_story_keys，不能越过新的窗口。 |
| R3 | blind+edge | 失败/缺失局部UI证明不能解锁Query/Router | 要求9.3已实现、proof.result与非空checks全部passed，保留native独立关闭。 |
| R4 | blind+edge | 条件Xcode部署配置也必须16.4 | 校验SDK/arch条件键，包含组合条件16.0的失败反例。 |
| R5 | edge | 历史packet不能依赖未来实时源文件 | 从已封存packet的完整Source片段重建历史源，允许正常的当前文档/镜像更新。 |
| R6 | auditor | 实际合同仍引用旧平台下限 | 未完成任务改16.4，旧已勾选16.0明确标为历史配置证据。 |
| R7 | auditor | 实际合同遗漏新增AR/UX | 完整复制批准UI补充，守卫检查AR25/26/UX-DR37及任务义务。 |
| R8 | auditor | 主构建命令绕过native:sync | NATIVE.md主命令统一走带SPM校准的workspace脚本。 |
| R9 | auditor | 旧delivery必须和旧catalog一起保护 | 比较上一个live delivery与已封存内容，负例确认拒绝改写。 |
| R10 | auditor | 新增UI启动应具备工作台/浏览器前置 | 对新9.3–9.7的in-progress阶段检查实际已交付依赖，原业务依赖语义保留。 |

三个原审阅者已分别限定复核各自发现，均确认关闭。Blind额外用有效控制输入核对stop/局部证明/Xcode条件；Edge重放同步历史源更新、新停止窗口、失败/空checks与backlog反例；Acceptance核对实际合同、命令与旧delivery/启动依赖。无剩余具体问题。

验证：82项handoff回归（含原43项SP与17项Capacitor，以及22项UI范围正反例）全部通过；19项native-build-config Vitest与5项Node配置校验通过，条件SDK覆盖反例包含在第4组。移动端typecheck/build、双端sync/SPM校准和native项目/8项Web资源一致性检查通过。新UI库尚未安装，真机/Mac签名/TestFlight与供应商证据未完成。
