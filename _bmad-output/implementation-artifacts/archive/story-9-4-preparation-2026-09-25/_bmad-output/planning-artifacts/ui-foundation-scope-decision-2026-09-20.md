---
project: nomad-mvp
date: '2026-09-20'
status: approved
scope_revision: ui-foundation-2026-09-20
baseline_scope_revision: capacitor-2026-09-19
scope_classification: moderate
proposal: _bmad-output/planning-artifacts/sprint-change-proposal-ui-foundation-2026-09-19.md
proposal_sha256: 5750eef944b6f47dc910088576df724cc3bfb88c4e7ab040abf6fd3ad59f17a6
contracts_appendix: _bmad-output/planning-artifacts/sprint-change-ui-contracts-2026-09-19.md
contracts_appendix_sha256: 87ac0bbf7920cd41c8accdf4e0894082f5816079e60428756a32a2f13e059276
snapshot_directory: _bmad-output/implementation-artifacts/archive/ui-foundation-2026-09-20
snapshot_manifest_sha256: a06497838947b64a07926efc85fd14d0383a1db426ab44c85b125a9ae85deb2f
new_story_ids:
- '9.3'
- '9.4'
- '9.5'
- '9.6'
- '9.7'
ui_consumer_story_ids:
- '1.0'
- '1.6'
- '1.8'
- '1.11'
- '2.3'
- '2.4'
- '2.5'
- '2.6'
- '2.7'
- '2.8'
- '2.9'
- '2.10'
- '2.12'
- '2.14'
- '2.15'
- '3.1'
- '3.2'
- '3.3'
- '3.4'
- '3.5'
- '4.1'
- '4.2'
- '4.3'
- '4.4'
- '4.5'
- '4.6'
- '4.7'
- '5.1'
- '5.2'
- '5.3'
- '5.4'
- '5.5'
- '6.1'
- '6.2'
- '6.3'
- '6.4'
- '6.5'
- '7.1'
- '7.3'
- '7.4'
- '7.5'
- '7.6'
- '8.3'
- '8.4'
- '8.5'
- '8.6'
- '9.1'
- '9.2'
- '9.3'
- '9.6'
- '9.7'
scope_counts:
  epics: 9
  stories: 67
  historical_stories: 7
  current_target_stories: 60
  gwt_scenarios: 1089
  functional_requirements: 66
  mvp_functional_requirements: 62
  deferred_functional_requirements: 4
  nonfunctional_requirements: 25
choices:
  ios_minimum: '16.4'
  safari_minimum: '16.4'
  firefox_minimum: 128
  chromium_minimum: 111
  edge_minimum: 111
  android_minimum: 10
  android_webview_minimum: 111
  component_stack:
  - shadcn/ui
  - Base UI
  - Tailwind 4
  include_query: true
  include_router: true
  visual_redesign: false
  form_library: defer-to-first-complex-form-story
resumes_stopped_execution: false
stop_after_story: 1-7-durable-import-progress-and-restart-recovery
delivery_scope: planning-contracts-readiness-and-approved-platform-minimum-synchronization
---

# UI 基础范围批准记录

用户在2026-09-20对“Firefox128+／网页Safari16.4+的支持范围，以及Query、Router是否纳入本期”标注“确认”，并明确“认可，可以进行对应的调整”。据此批准完整提案及附录的核心9.3–9.5与独立9.6/9.7；保留已接受的iOS16.4和shadcn/ui＋Base UI＋Tailwind4选型。

旅行规划、导入、身份、回执、cursor等领域合同与已批准布局/品牌方向保持。RHF＋Zod随首个复杂表单评估，未授权全局表单或后端大版本迁移。

本轮落地源文档、规划镜像、Epic、版本化catalog/delivery、已有实际Story与Tasks、定向IR及平台最低目标/检查同步。9.3–9.7正式进入backlog，按9.4→9.5→9.3及后续独立Query/Router顺序准备；全新UI基础依赖安装与业务页面迁移不在本轮冒称已交付。

CURRENT与Sprint的“完成1.7后停止”保持。本次方案批准不作为解除该边界或重启已资源阻断主任务的消息；合同准备入口可以重排，实际开发派发仍服从当前执行边界。对1.0/1.6/1.7/9.1真实服务/设备/法律/备份门槛继续如实记录，3.1暂停、历史done及延期范围不变。

旧Capacitor批准及其固定快照不可改写。本记录及所绑定的新前状态快照是本次变更的不可变批准输入；后续执行进展写独立日志，不重算旧批准事实。
