---
project: nomad-mvp
updated: 2026-09-17
current_epic: 1
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 1-0-production-login-and-multi-device-sessions
current_story_status: in-progress
current_story_file: _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md
current_story_spec: _bmad-output/planning-artifacts/epics.md
planning_status: bmad-sprint-planning-complete
execution_phase: execution
next_bmad_action: bmad-dev-story
next_bmad_checkpoint: provide-story-1-0-required-resource-configuration
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md
prompt_strength_status: approved-applied-and-revalidated
prompt_strength_record: _bmad-output/planning-artifacts/prompt-strength-adoption-2026-09-15.md
sprint_planning_authorized: true
sprint_planning_completed: true
create_story_authorized: true
implementation_authorized: true
handoff_status: story-1-0-t0-awaiting-resource-information
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.yaml
migration_report: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-2026-09-17.yaml
revalidation_report: _bmad-output/implementation-artifacts/sp-revalidation-2026-09-17.md
paused_story: 3-1-minute-timeline-editing-and-plan-wide-undo
working_branch: codex/story-1-0-production-auth
story_preparation_report: _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions-validation.md
---

# Nomad Current Handoff

**Story 1.0正在按bmad-dev-story实施，状态in-progress。**
用户2026-09-17在准备完成后要求“继续下一条”，已授权进入当前1.0本地实现与必要隔离合成验证。
从T0实际能力/运行环境开始；真实供应商资源信息已询问，外部账号/外发/购买/部署及既有数据变更仍需对应具体范围。

## Read in This Order

1. `AGENTS.md`、`_bmad-output/project-context.md`。
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`：当前执行状态、授权记录、暂停与逐Story条件进展。
3. Sprint指向的 `sprint-delivery-contract-2026-09-17.yaml`、`sprint-migration-2026-09-15.yaml`。
4. `1-0-production-login-and-multi-device-sessions.md` 与同名 `-validation.md`（均在implementation-artifacts）。
5. Story引用的后端上下文、供应商研究及独立准备审阅记录；按需读取源PRD/架构/UX与实施前置。

CE、九项IR整改、18组呈现方案和SP已批准/复核，无需重复审批。9月15/17的SP报告保留为
历史完成快照；本文件与当前Sprint决定现时节点，不从旧聊天/旧CURRENT重新派发任务。

## Current Story 1.0

- 复用现有首屏与User/OAuthIdentity/Session，补真实身份、稳定owner、持久多设备会话、当前退出及最小桌面运营授权。
- 旧外部u_*到数据库UUID存在二次hash链；迁移需可信归属、显式冲突清单、sourceHash/旧Job/HQ恢复兼容，不能按测试手机号认领或丢弃旧数据。
- Session公开引用与cookie secret分离；全路由认证、活动SSE撤权、跨标签页/后台恢复、跨owner缓存与迟到请求进入同一安全闭环。
- 明确1.0与7.3设置重做、7.5删除清理、5.x完整fill/export边界；现存裸入口需要保护，未实现能力不伪造验收。
- login-attribution保留U-Link/U-App实际宿主与真实归因责任。Apple/微信及友盟资源、实际账号/权益/回调、生产HTTPS/备份恢复和性能目标仍须在相应实施阶段核验。
- 独立审阅要求的共享cookie多tab与bfcache/回前台场景已补入任务；预期owner/session只校验上下文一致性，不能替代真实认证。
- 1.0绑定OPS-01、DB-CHANGE-01、METRICS-01/02/03均not-started；文档准备和研究不关闭真实工程证据。

## Sprint Facts

- 8 Epic、60 Story、8回顾、1018 GWT；7历史done、1.0 in-progress、3.1继承in-progress且暂停、51 backlog。
- Epic1/2/3为in-progress，其余backlog；Epic1回顾done只覆盖历史1.1–1.5，扩围回顾仍需单独实证。
- `next_story_to_prepare`现为1.6，表示下一份未准备合同；当前待开发工作仍为1.0，不由此自动派发1.6。
- 65FR（61MVP/4延期）、24NFR及53张当前目标保持。7.2、8.7/8.8、FR34.1/FR40.1/FR42/FR43仍延期。
- 1.11手工纠错、5.1最小S10→S9实际来源→原S10闭环、18组呈现和“已开始下载，请确认”保持。

## Paused Editing Migration

旧2.2只迁入 `3-1-minute-timeline-editing-and-plan-wide-undo`；原历史文件不独立执行。
保留 `legacy_story_id: 2-2-timeline-editing-undo-and-history`、
`baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c` 与现有Git历史。
恢复需1.0、2.7、2.9、2.10、2.11的真实合同可消费，再完成新3.1合同和keep/change/remove
审计。准备时保持继承in-progress，用contract_ready区分；3.1自己触发ValidationRun，不等3.4。

## Working Rules and Verification

WSL Ubuntu `/home/tong123/work/nomad-mvp`，使用WSL Node/pnpm。当前仍在
`codex/story-1-0-production-auth`，起始HEAD为`7250a8a131a370698bff53538a4405c2ddb94c1c`；
本轮创建新的1.0分支，旧2.2分支/历史保留；保留全部未提交规划、图片与历史代码，不reset/clean。

本轮开始前的CURRENT、project-context、Sprint和回归测试快照在
`_bmad-output/implementation-artifacts/archive/story-1-0-preparation-2026-09-17/`。
交接检查：`pnpm run ci:handoff`；回归：`node --test scripts/check-handoff.test.mjs`。
回归fixture固定到SP完成快照，另校验真实工作树，支持后续状态推进。

当前准备与本地实施授权均限1.0；文件记录用户指令，不产生新授权。真实外发、资源、费用、部署及既有数据操作仍按具体环境/范围处理。
开发开始前快照在 `archive/story-1-0-dev-start-2026-09-17/`（implementation-artifacts内）。


## 当前T0进展与缺项

已实现配置校验组件、18项单元测试、只读预检工具和空值模板；未接入现有启动/认证路径，
不能据此宣称生产身份/会话已修复。资源预检见
`_bmad-output/implementation-artifacts/story-1-0-runtime-preflight-2026-09-17.md`。
仅在本地发现DB/Redis配置，真实登录/验证码/归因供应商、宿主与受控配置位置尚待用户说明。
依dev-story的必要配置规则停在T0；授权继续有效，收到资源信息后接续，不跳到1.6或恢复3.1。
