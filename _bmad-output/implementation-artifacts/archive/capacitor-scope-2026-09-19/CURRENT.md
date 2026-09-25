---
project: nomad-mvp
updated: 2026-09-19
current_epic: 1
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 1-0-production-login-and-multi-device-sessions
current_story_status: in-progress
current_story_file: _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md
current_story_spec: _bmad-output/planning-artifacts/epics.md
planning_status: bmad-sprint-planning-complete
execution_phase: execution
next_bmad_action: bmad-dev-story
next_bmad_checkpoint: implement-story-1-0-auth-authority-and-client-integration
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md
prompt_strength_status: approved-applied-and-revalidated
prompt_strength_record: _bmad-output/planning-artifacts/prompt-strength-adoption-2026-09-15.md
sprint_planning_authorized: true
sprint_planning_completed: true
create_story_authorized: true
implementation_authorized: true
handoff_status: story-1-0-auth-implementation-in-progress
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.yaml
migration_report: _bmad-output/implementation-artifacts/sprint-migration-2026-09-15.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-2026-09-17.yaml
revalidation_report: _bmad-output/implementation-artifacts/sp-revalidation-2026-09-17.md
paused_story: 3-1-minute-timeline-editing-and-plan-wide-undo
working_branch: codex/story-1-0-production-auth
story_preparation_report: _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions-validation.md
resource_alignment: _bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md
implementation_progress: _bmad-output/implementation-artifacts/story-1-0-dev-progress-2026-09-19.md
---

# Nomad Current Handoff

**Story 1.0正在按bmad-dev-story实施，状态in-progress。**
用户2026-09-17在准备完成后要求“继续下一条”，已授权进入当前1.0本地实现与必要隔离合成验证。
2026-09-19用户补齐三端图形、双端U-App、短信签名/模板，并授权自行复用或新建homelab VM/LXC。
已复用并启动VM104，配置预检通过；整体开发测试完成后再发布公有云。真实外发及既有数据变更仍按具体联调范围处理。

## Read in This Order

1. `AGENTS.md`、`_bmad-output/project-context.md`。
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`：当前执行状态、授权记录、暂停与逐Story条件进展。
3. Sprint指向的 `sprint-delivery-contract-2026-09-17.yaml`、`sprint-migration-2026-09-15.yaml`。
4. `1-0-production-login-and-multi-device-sessions.md` 与同名 `-validation.md`（均在implementation-artifacts）。
5. `resource_alignment`指向的9月19确认记录决定当前资源与homelab状态；9月18缺项及9月17供应商候选为历史。再按需读取后端上下文、准备审阅、源PRD/架构/UX与实施前置。

CE、九项IR整改、18组呈现方案和SP已批准/复核，无需重复审批。9月15/17的SP报告保留为
历史完成快照；本文件与当前Sprint决定现时节点，不从旧聊天/旧CURRENT重新派发任务。

## Current Story 1.0

- 复用现有首屏与User/OAuthIdentity/Session，补真实身份、稳定owner、持久多设备会话、当前退出及最小桌面运营授权。
- 旧外部u_*到数据库UUID存在二次hash链；迁移需可信归属、显式冲突清单、sourceHash/旧Job/HQ恢复兼容，不能按测试手机号认领或丢弃旧数据。
- Session公开引用与cookie secret分离；全路由认证、活动SSE撤权、跨标签页/后台恢复、跨owner缓存与迟到请求进入同一安全闭环。
- 明确1.0与7.3设置重做、7.5删除清理、5.x完整fill/export边界；现存裸入口需要保护，未实现能力不伪造验收。
- login-attribution保留U-Link/U-App实际宿主与真实归因责任。Apple/微信及友盟资源、实际账号/权益/回调、生产HTTPS/备份恢复和性能目标仍须在相应实施阶段核验。
- 独立审阅要求的共享cookie多tab与bfcache/回前台场景已补入任务；预期owner/session只校验上下文一致性，不能替代真实认证。
- OPS-01已进入homelab环境预检，尚未完成备份/恢复及认证验收；DB-CHANGE-01、METRICS-01/02/03仍not-started。

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

当前准备与本地实施授权均限1.0；9月19另获homelab开发测试资源复用/创建授权，VM104已启动。
整体开发测试完成后再处理公有云发布；费用、真实外发与既有数据操作仍按具体范围处理。文件只记录指令。
开发开始前快照在 `archive/story-1-0-dev-start-2026-09-17/`（implementation-artifacts内）。


## 当前T0进展与缺项

用户已要求继续开发。启动配置校验和fixture隔离已接入；持久认证、PNVS适配、owner兼容及新HTTP路由
正在实施。详见`implementation_progress`，其中区分最新隔离PG/HTTP证据与尚未完成项。
真实模式尚有实施就绪屏障，全应用/客户端装配完成前不开放占位认证；不把预检或替身视为生产登录完成。
资源证据见`resource_alignment`；9月17/18预检保留历史。

云AK在`.env.aliyun-admin.local`，图形三端及U-App双端资源在`.env.story-1-0.local`；两者
0600且Git忽略，不输出值、不随应用自动加载。当前Web/PWA选`nomadh5`；短信选已批准签名
「恒创联众」和模板100001。真实配置预检已通过，不再缺签名、图形密钥或平台注册信息。

现有VM104 `nomad-staging`已启动并健康检查通过，4核/8GiB/64GiB、IP192.168.31.104；
可通过PVE192.168.31.2跳板SSH访问。当前仍运行历史release10f940c49e2d，未部署新认证。
U-App两端Key不证明纯Web/PWA的统计/归因已接通；「暂停使用」文案可能是按钮，状态未核实。
测试域名、HTTPS/frp及真实短信/图形验票仍需实际联调，原资源缺项暂停已解除。

1.0 T0/T4执行9月18供应商决定；源GWT/SP指纹及安全/归因/工程责任保留。没有为旧候选购买资源，
也没有将同日存档中的OSS/视频/App方向自动展开为本轮开发。继续1.0 T0运行模式与宿主接入工作；
不再重复索取已补齐资源，不跳到1.6或恢复3.1。
