---
project: nomad-mvp
updated: 2026-09-15
current_epic: 1
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 1-0-production-login-and-multi-device-sessions
current_story_status: backlog
current_story_file: null
current_story_spec: _bmad-output/planning-artifacts/epics.md
planning_status: bmad-sprint-planning-complete
next_bmad_action: bmad-create-story
next_bmad_checkpoint: await-story-1-0-preparation-authorization
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md
prompt_strength_status: approved-applied-and-revalidated
prompt_strength_record: _bmad-output/planning-artifacts/prompt-strength-adoption-2026-09-15.md
sprint_planning_authorized: true
sprint_planning_completed: true
create_story_authorized: false
implementation_authorized: false
handoff_status: sprint-planning-complete-awaiting-next-authorization
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.yaml
migration_report: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.md
paused_story: 3-1-minute-timeline-editing-and-plan-wide-undo
working_branch: codex/story-2-2-timeline-editing
---

# Nomad Current Handoff

**Sprint Planning已完成；下一张待准备为1.0「生产登录与多设备会话补齐」。**
当前1.0仍是backlog，尚未创建实施Story。本轮授权止于SP及交接，未经后续授权不运行
create-story/dev。CE、九项IR整改与18组提示方案已经批准并复验，无需重新审批。

## Read in This Order

1. `AGENTS.md`、`_bmad-output/project-context.md`。
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`：当前唯一执行状态。
3. 同目录 `sprint-migration-2026-09-15.md` 与 `.yaml`：固定key、旧→新映射、暂停及工程条件/责任人。
4. `_bmad-output/planning-artifacts/epics.md` 的正式Story 1.0；目前没有1.0实施文件，不误读历史1.1。
5. `_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md`，按manifest绑定随准备写入Tasks/开始/关闭条件。
6. 按需读取 `implementation-readiness-sp-handoff-2026-09-15.md` 与 `prompt-strength-adoption-2026-09-15.md`；前者是SP开始前READY快照，不是当前Sprint状态。

仅在处理3.1继承工作时读旧 `2-2-timeline-editing-undo-and-history.md`。它仍保留旧Status和
原验收记录作历史依据，tracking_role为legacy-source-only，不能成为第二个执行身份。
不需要旧聊天记录；定向实施准备再加载对应技能及当前源PRD/UX/架构。

## Sprint Facts

- 8个Epic、60张Story：7张历史done、1张继承in-progress但暂停、52张backlog；0张ready-for-dev。
- Epic1/2/3为in-progress，其余backlog；Epic1不再因历史五张完成而误报扩围全部done。
- 8个回顾：Epic1保留历史done，只覆盖1.1–1.5；新增1.0/1.6–1.11尚欠扩围回顾，其余7个optional。
- 53张当前目标、1018组GWT、65FR（61MVP/4延期）、24NFR。只有正式epics.md进入队列。
- 原Sprint、旧CURRENT/检查脚本和范围先留存在 `archive/sprint-planning-2026-09-15/`；相对implementation-artifacts。
- 新1.0先补生产身份、稳定owner映射、多设备持久会话及最小桌面运营授权；不等待后续页面。

## Paused Editing Migration

旧2.2唯一迁到 `3-1-minute-timeline-editing-and-plan-wide-undo`，保留
`legacy_story_id: 2-2-timeline-editing-undo-and-history`、
`baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c` 和现有分支/Git历史。
在制事实继承不等于新合同ready；当前无新3.1实施文件，不派发旧2.2。

恢复需1.0、2.7、2.9、2.10、2.11的真实合同可消费，并完成新3.1准备与keep/change/remove
审计。3.1自身负责mutation触发精确revision的ValidationRun，不等待3.2或3.4。对应PG、
路线与浏览器实证在实施时完成；原owner/幂等/revision/EditEvent/undo成果和历史缺口均保留。

## Conditions and Scope

OPS-01从1.0挂入；OPS-02从1.9及后续新对象类型扩充；DB-CHANGE-01每次变化重新验证；
DATA-VECTOR-01由2.13归属且只在真实触发时实施。METRICS-01从1.0/1.6/1.7开始，最迟1.9
首次真实能力验收前具备；METRICS-02/03由8.1/8.2汇总，早期基础测量/规则测试不等运营UI。
七项均已具名指派和绑定，未执行/未关闭，不新增七张产品Story。

保留1.11手工地点纠错与版本/来源审计、5.1最小S10→S9实际来源→原S10闭环、5.2同路由
增强，以及18组已批准呈现合同。普通下载固定文案为“已开始下载，请确认”。规划通过不等于
真实认证、UI、数据恢复、模型效果、性能或生产验收已完成；原型与实证随对应实施Story补齐。

7.2、8.7、8.8及FR34.1/FR40.1/FR42/FR43仍延期；旧草稿和图片不触发ready。
旅行者移动Web/PWA、运营桌面Web；复用框架代码/worker，一个PlanningJob，owner/版本/幂等
受控；无n8n前置。其余产品边界以当前源文档和正式epics为准，不由历史Story覆盖。

## Working Rules

在WSL Ubuntu `/home/tong123/work/nomad-mvp` 使用WSL Node/pnpm；不复制旧Windows/E盘镜像。
保留当前大量未提交规划/图片/历史代码，不reset/clean。SP未执行部署、真实模型/Telegram
调用、采购、账号或数据操作。必要交接检查：`pnpm run ci:handoff`；迁移负向回归：
`node --test scripts/check-handoff.test.mjs`。结果见迁移说明的验证记录。
