---
project: nomad-mvp
story_id: '9.4'
date: '2026-09-25'
workflow: bmad-create-story-validation
status: passed
story_file: _bmad-output/implementation-artifacts/9-4-component-workbench-and-enforced-code-quality.md
source_contract_sha256: a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27
reviewed_draft_sha256: 6320593e4ce0a093371ca7e6f0b15cd3fb537f60a81723dd00bd0d2b4a052a1c
final_story_sha256: c6197a64e507b1c9587f895f637633d8abce374034aa4ef6edacecc434357fd0
source_gwt_count: 6
independent_reviews_passed: 2
open_findings: []
implementation_started: false
execution_boundary_unchanged: true
handoff_check: passed
handoff_regression:
  passed: 82
  failed: 0
runtime_checker_changed: false
test_fixture_adjusted: true
---

# Story9.4准备验证

结论：合同准备通过，可标ready-for-dev；这不是开始开发、工具安装或运行验收。用户仅请求“可以，开始准备9.4”。

## 来源与责任

当前epics.md是唯一正式源，catalog/delivery为ui-foundation-2026-09-20。叙事、Requirements、六组GWT和Code quality补充逐字保留，来源hash与catalog一致；FR52/NFR3/7/8/25及CODE-QUALITY-01、UI-WORKBENCH-01、ui-quality-tooling均进入实际Tasks与关闭要求。没有新增产品GWT、修改catalog、改变延期或历史done。

## 源到任务

| 验收 | 实施责任 | 证明 |
| --- | --- | --- |
| AC1 工作台立即可用 | T0/T1/T4 | 实际HomeSheet/字段，独立启动/静态构建与状态用例 |
| AC2 网络替身 | T2 | 共享DTO handlers、严格账本、worker失败/业务catch/脱敏/清理反例 |
| AC3 真正lint | T3/T6 | 同ci入口的Promise/Hook/字段缺陷及修正后退出码 |
| AC4 历史与依赖 | T0/T3/T6 | 精确peer、cohort/逐诊断冻结、浅基准/新增重命名/同数量新债务反例 |
| AC5 a11y与interaction | T1/T4 | 单Chromium、focus/keyboard/错误关联、明确人工范围 |
| AC6 产品隔离 | T2/T5/T6 | 入口/模块/完整资源清单/网络/worker，native-only残留负例 |

## 独立验证与修订

contract-review共21项核对无阻断；plan-review提出3项P2与一项native资源提示，均已落实并复核：fixture captcha排除真实PNVS直连分支；MSW项目脱敏错误/哨兵检测替代默认打印；CI明确获取PR/push比较基准并处理浅克隆；独立枚举两端资源拒绝额外worker。两份报告均绑定同一个最终draft摘要；其后只更新最终状态、收口元数据/完成说明，以及实际回归fixture维护的记录，不改变实施合同。

## 依赖与实施边界

9.4本身没有待完成Story依赖，可先用现有组件交付；不等待9.3/9.5。组件测试用单Chromium不等于9.5的跨引擎产品流程/截图。当前1.7资源阻断/完成后停止、3.1 pause和原真实平台/服务/备份门槛保持。新工具尚未安装，两个工程条件仍not-started，不能以准备报告充当ui_delivery_evidence。

CURRENT主执行指针仍为1.7，新增UI准备入口指向9.4；Sprint记录9.4 ready-for-dev，下一合同9.5。未写开发窗口override。没有修改业务代码、package/lock或CI实现。

## 检查结果

源hash/GWT/叙事/Requirements、任务义务和字段结构核验通过；ci:handoff通过（67 Story/1089 GWT，7 done/5 in-progress/1 ready/54 backlog，next9.5），82项回归通过。首次回归81通过/1失败来自测试读取live队列却固定期待9.4；已将UI fixture固定到准备前快照。执行检查器四个文件摘要与既有UI验收记录一致，没有修改权限/停止/依赖规则。本轮不运行不存在的新Storybook/ESLint或真实业务服务。
