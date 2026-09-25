---
project: nomad-mvp
updated: 2026-09-15
current_epic: 8
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 2-2-timeline-editing-undo-and-history
current_story_status: implementation-paused-for-replanning
planning_status: bmad-implementation-readiness-ready-for-sprint-planning
next_bmad_action: bmad-sprint-planning
next_bmad_checkpoint: start-sprint-planning
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md
prompt_strength_status: approved-applied-and-revalidated
prompt_strength_record: _bmad-output/planning-artifacts/prompt-strength-adoption-2026-09-15.md
sprint_planning_authorized: true
handoff_status: prepared-for-new-conversation
handoff_model: gpt-6-astra
handoff_reasoning: max
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
working_branch: codex/story-2-2-timeline-editing
---

# Nomad Current Handoff

**当前唯一动作：在用户指定的新Astra/max对话完成Sprint Planning。** CE已完成，九项IR整改
和独立18组提示呈现方案均已批准、写入并定向复验通过。没有剩余的规划审批步骤。
此为规划就绪，不是业务实现或生产验收完成；新对话只执行SP，完成后报告下一执行准备。

## Read in This Order

1. `AGENTS.md` 与 `_bmad-output/project-context.md`。
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`：目前仍是旧历史执行队列，先完整留档再迁移。
3. `_bmad-output/implementation-artifacts/2-2-timeline-editing-undo-and-history.md`：在制迁移来源，非当前新目标已就绪证明。
4. `_bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md`。
5. `_bmad-output/planning-artifacts/epics.md`：唯一正式Story清单，全文解析；同目录其他*epic*覆盖/拆分/历史文件不是重复Story来源。
6. `_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md`。
7. `.agents/skills/bmad-sprint-planning/SKILL.md`，解析customization后执行SP。

按需再读 `ir-resolution-decisions-2026-09-15.md`、`prompt-strength-adoption-2026-09-15.md`及各源
PRD/UX/架构。不需要读取此前Codex对话或长工具日志，过去报告不是当前状态。

## Current Planning Facts

- 8个Epic、60张Story（7张历史、53张当前目标）、1018组GWT、65条FR（61 MVP/4明确延期）、24条NFR。
- 新1.0：生产身份、稳定owner迁移、多设备持久会话及最小运营授权，14组GWT；真实用户/首个运营写入前完成。
- 1.11：高德地点验证、分店消歧、品牌规则及手工地点纠错，22组GWT。人工名称/地址/同城坐标有来源/坐标系/发布版本/审计，新消费固定版本，旧行程/任务快照不被静默改写。
- 5.1：最小S10基础宿主页、S9完善/实际来源和返回，24组GWT；5.2同路由增强完整核查/阅读/CitationSheet，23组，不能成为5.1入口/返回的前置。
- 18组呈现方案已独立获批并应用到32张Story，所有GWT数量不变。soft-only入口低强调；真实hard/mixed、失败、未保存、未知结果、删除/生产/外发确认仍保留。定位无基准不编造计划位置；普通下载精确文案为“已开始下载，请确认”。
- 来源权威是docs/prd.md、docs/architecture/index.md的当前v0.6分片、docs/front-end-spec.md、docs/ux/mobile-ia.md和当前原型覆盖；planning packet是同步包。

## Scope to Preserve

- 旅行者移动优先Web/PWA；运营管理只做桌面Web。框架代码/worker编排，无n8n/低代码前置。
- 一个可见PlanningJob；Planner排期、Validator校验、Filler只补细节；所有写入owner/版本/幂等受控。
- App打开/回前台且有当前餐饮用途、有效历史或本次定位授权时允许单次fix；不连续/后台追踪，不自动改餐厅/行程。
- 不足来源的安全通用内容用“建议核对”弱提示，不能制造引用、预约、营业或定位事实。
- 单城Plan经Trip顺序连接；一日游独立child Plan及去返交通，原子发布。AI只改当前host/child单城Plan，保留冻结、住宿/行李与交通边界。
- 已批准18组仅改变呈现，不新增逐条核对、不把软问题升级成门禁或把硬问题降为可忽略建议。
- 专用内容审核服务、账号合并/自助解绑/新设备中心、额外通用POI后台（手工纠错除外）、可达圈/拍照热度层延期。
- 7.2打卡、8.7/8.8平台XHS搜索补池、FR40.1照片影像、FR42自动酒店重排、FR43任意历史时间轴继续延期；已有草稿/图片不等于当前执行Story。
- 既有品牌规则及8.3路由/8.4预算/8.5告警/8.6只读总览保留。评测按逐规则计分/提醒/人评，不恢复统一硬失败否决或仅可选摘要。

## Sprint Migration Requirements

- 旧Epic1 `done`只覆盖历史1.1–1.5。先保存旧Sprint快照和范围说明，再对扩围后当前Epic1重算状态，不能使新1.0/1.6–1.11继承done；七张历史Story和已完成回顾保留原状态。
- 当前旧2.2的工作唯一迁入新3.1。保留 `legacy_story_id: 2-2-timeline-editing-undo-and-history`、
  `baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c` 与现有分支/Git历史。
- 新旧编号不能同时成为两张可派发的编辑任务。继承在制事实与未就绪的新合同分开；暂停/前置用额外元数据表达，不发明development_status非法枚举，不把旧文件存在当新版已ready。
- 新1.0是首个新增执行准备；3.1继承旧在制工作也不得跳过其真实前置。SP完成后不直接dev。
- 新Story键使用稳定、唯一slug；已有历史键保持，旧号→新号用显式迁移表，不能只按相同编号自动继承错误Story。
- OPS-01/OPS-02/DB-CHANGE-01/DATA-VECTOR-01/METRICS-01/02/03挂入所属任务/开始或关闭条件，不新增7张产品Story。向量仅触发时实施，早期测量不等完整8.x UI。
- SP同步sprint-status、迁移说明、CURRENT和check-handoff脚本。旧检查中的历史键应改为正确的新队列/留档验证，不能简单删除安全检查。
- 只有正式epics中的60张Story进入当前队列；延期项保存在延期元数据/登记，不伪装可执行。检查8个Epic和8个回顾、重复/遗漏、合法YAML及新旧迁移唯一性。

## Working Rules and Evidence

只在WSL Ubuntu `/home/tong123/work/nomad-mvp` 工作，使用WSL Node/pnpm；不复制旧Windows/E盘迁移镜像。
当前有大量尚未提交的规划/图片/历史代码工作；保留，不reset/clean/覆盖。新对话应读取这份当前目录，
不要从缺少本轮文件的默认分支开始。父对话在派发前完成文件写入，接收任务开始后负责SP状态更新。

SP授权只包含规划队列、必要迁移/检查脚本及交接更新；不包含业务实现、部署、购买、账号/数据操作、
模型或Telegram真实调用。UI原型与实证仍由对应Story执行：尤其1.11纠错桌面、1.0真实登录、5.1最小S10/S9连贯路径。
对话展示Story时保留As a/I want/So that、Requirements与原型引用，验收用编号中文文字；文件继续用BMAD GWT。

旧长版CURRENT已保存在 `_bmad-output/planning-artifacts/archive/CURRENT-before-sp-handoff-2026-09-15.md`，仅按需查历史。
