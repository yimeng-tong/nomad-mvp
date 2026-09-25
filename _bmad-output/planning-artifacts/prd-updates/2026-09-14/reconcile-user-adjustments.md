---
title: 用户三项微调输入核对
date: 2026-09-14
mode: prd-update-input-reconciliation
status: source-reconciliation-completed
sourcePrd: docs/prd.md
decisionLog: .decision-log.md
implementationAuthorized: false
---

# 用户三项微调输入核对

此提取对应用户本轮消息，依据当前 PRD、project-context、正式 epics 与 v0.6 架构/UX。
它列出同步范围与冲突，不宣称正式文档已改或新的 IR 已通过。未使用外网、业务运行或新原型作为证据。

## 1. FR14：代码编排可满足要求，n8n 不是前置

**直接输入：** 编排不一定考虑 n8n，使用开发框架即可，无需低代码。

**需要消除的冲突：** PRD 不仅 FR14 列 n8n，Technical Assumptions 的 Service Architecture、
Realtime/Async、架构生成提示、任务健壮性、批量媒体迁移、健康告警、灰度开关均把它写成既定组成。
v0.6 `tech-stack.md` 仍写 `BullMQ/Redis and/or n8n`，`backend-architecture.md` 则只允许它承担外部步骤。
正式 Story 2.9 提到 n8n 回调不能成为任务事实源，这是权威边界的示例，不能被当成部署 n8n 的要求。

**最小行为边界：** 现有 Fastify/TypeScript 模块、代码 worker 与合适的持久任务/队列机制可以完成异步编排。
移除低代码前置不等于去掉任务幂等、受限重试、DLQ、持久状态、SSE 恢复、owner/revision fencing，
也不等于改用内存 EventEmitter 作为事实源。当前 Node 框架已明确，不需要借此次微调增加第二套服务框架。

| 同步对象 | 处理要求 |
| --- | --- |
| `docs/prd.md` 与 BMAD `prd.md` | 同步 FR14 和上述所有既定 n8n 依赖表述；领域能力保持。 |
| `docs/architecture/tech-stack.md`、`backend-architecture.md` | 明确代码编排可交付，不设置 n8n/低代码实施前置；保留任务/领域事实权威。 |
| 正式 `epics.md` | Requirements Inventory 与 FR14 同步；Story 2.9 的回调示例可泛化为外部编排回调，保留不能作为事实源的断言。 |
| BMAD `architecture.md` 与 `_bmad-output/project-context.md` | 同步所选当前源；避免继续向下一任务传递 n8n 必装假设。 |

## 2. FR48/NFR18：前台打开 App 可刷新单次位置

**直接输入：** 需要定位的餐饮候选可在用户历史或当前授权后，以单次 fix 形式在打开 App 时刷新。

**需要消除的冲突：** Story 6.2 首条写“首页……不请求定位”；首次说明只在进入候选流程发生；
返回仅接受当前打开 Sheet 的 request；UX 则明确“只在打开旅中餐饮候选或主动刷新时申请”。
这些限制会使仅修改 FR48 的新行为无法落地。NFR18 的“前台交互需要”应明确包含符合条件的 App 打开，
project-context 的 `per explicit need` 也不能被继续解读为必须先点击候选。

**最小行为边界：**

1. 触发是 App 处于前台，且有当前需要定位的旅中餐饮上下文；打开不等于无条件给所有账号、所有日期或所有 Plan 定位。
2. 历史允许仅在当前仍有效时可复用；必须核实当前系统/浏览器能力。已撤销、拒绝、过期的一次授权或不可用权限不能靠历史标记绕过。
3. 尚未获得允许时保留真实首次说明与系统授权边界；取消或拒绝后可沿用计划基准，不把浏览 App、浏览行程或手动选餐厅变成权限前置。
4. 每次符合条件的触发只取单次 fix；不启用持续 watch、后台刷新或定时上传。退出前台、登出、权限撤销或请求 scope 失效时，停止/失效化请求并丢弃迟到结果。
5. 初次/刷新取得的 fix 仍检查时间、精度、坐标系、城市与 host/child scope；新位置不能自动换 Plan、采用餐厅或改变主备池。
6. 无效/无 fix 时继续同一 scope 的前后计划 POI、单基准或静态池/手动添加；不推断打卡、到访或连续轨迹。
7. 新前台触发应有可独立于 Sheet 的有效 request/上下文校验；具体临时状态放在哪里由实施设计决定，不新增持久位置历史。

| 同步对象 | 处理要求 |
| --- | --- |
| `docs/prd.md`、BMAD `prd.md`、正式 `epics.md` 的 FR48/NFR18 inventory | 写入前台打开 App + 仍有效历史或当前授权 + 单次 fix；保留只读/降级/隐私。 |
| 正式 Story 6.2 | 同步入口、授权、single-fix 生命周期、并发响应与关闭验收；删除首页一刀切禁止，保持固定餐厅不自动改变。 |
| `docs/front-end-spec.md`、`docs/ux/mobile-ia.md` | 放宽“只在 Sheet 内”触发和候选更新生命周期，不添加每次打开都强制弹窗。 |
| `docs/architecture/index.md`、`frontend-architecture.md`、`backend-architecture.md` | 同步前台触发、临时 LocationContext 生命周期、只读召回事实。 |
| `docs/architecture/testing-strategy.md` | 补充历史授权仍有效、已撤销、App 打开/返回前台、无适用上下文、单次请求与迟到响应等核验要求。 |
| `docs/ux/prototype-coverage.md` | 已批准餐饮定位图是基础参考；新增 App 打开触发不能被宣称已由旧图完整覆盖。 |
| BMAD `architecture.md`、`ux.md`、project-context | 同步对应源与恢复语义；历史研究/旧图保留为历史。 |

## 3. FR39/NFR12：改为“建议核对”，并审计其他提示

**直接输入：** 缺来源提示“注意事实核查”改为弱提示“建议核对”；用户还要求检查全部提示，
为了主流程流畅，优先完成主要事项，再进入细分场景核对。

**需要消除的冲突：** PRD 的 FR39 与“事实引用与提示”附录使用旧措辞；Story 5.1/5.2
把相同语义表达为“需要核查”，覆盖生成缺来源、槽位状态、结果部分降级、内容页与原型验收。
若仅替换 PRD 原句，用户仍会在 S9/S10 遇到同义强提示。

**最小行为边界：** 缺可靠来源而仍可安全表达的通用建议保留，前台用“建议核对”。
具体事实仍需 NFR12 的 source ID/时间戳/摘要等可追溯证据；弱提示不能替代引用、补造来源，
也不能把无法安全生成的内容当作已确认事实。内部审计状态不必为文案改名，避免误把展示强度变成校验放松。

| 同步/审计对象 | 处理要求 |
| --- | --- |
| PRD FR39、NFR12 与附录；BMAD PRD/epics inventory | 统一缺来源的前台措辞；保留事实追溯与通用建议语义。 |
| 正式 Story 5.1/5.2；`docs/front-end-spec.md`、`docs/ux/mobile-ia.md` | 同步同义前台“需要核查”，将必要详情放入用户实际查看的槽位/来源核对位置，保持基础行程优先。 |
| 当前架构中的 Filler/SlotDetail/citation 与 testing-strategy | 核查是否存在展示强度硬编码，保持服务端证据与真实状态。 |
| 当前 PRD/UX/正式 epics 的全部提示 | 区分事实提醒、进度、可恢复失败、权限说明、保存/提交未知、影响预览、硬冲突、删除/发布确认等；记录触发、强度、展示位置、建议与改变行为的风险。 |
| prototype coverage 与已有图 | 文字变更不证明旧 PNG 已更新；审计建议是否需要新视觉，依实际改变和既有 Story checkpoint 分别记录。 |

**审计授权边界：** 用户批准了“建议核对”这一直接替换和全提示审计目标，尚未逐条批准审计将产生的
所有新方案。可以优先指出哪些仅需弱化措辞/位置；若建议取消确认、隐藏真实失败、推迟必须当场解决的输入
或改变既有 hard-conflict 门禁，必须单独呈现影响，不能通过全局替换悄悄实现。

## 4. 交接与验证缺口

- 本提取发现三项明确变更均跨越多个源；在源与 BMAD mirrors 同步前，不应继续把旧输入集当作本轮 IR 的最终评估版本。
- 上次 CE 完成事实可以保留。本次只需记录后续修订与受影响检查，不能把历史报告正文改成从未评过的新合同。
- 业务实施与旧 Sprint 继续保持原状态。本轮不修改 OpenAPI、Prisma、应用代码或 PNG；验收要求的修订不代表真实权限/服务测试已经通过。
- 主任务需在三项直接修订后检查现行权威文档的旧 n8n 必选语义、旧定位入口限制与旧强提示同义表述，验证 source/mirror 一致，并向用户呈现全提示审计建议。

## 5. 修订后只读复核（2026-09-14）

**结论：本轮三项直接修改未发现仍需修正的源文档阻断或遗漏。** 前四节保留为修改前提取，
本节记录已修订源文档的复核结果。主任务正在同步 mirrors、综合提示审计和恢复交接；这些进行中的工作不列为本轮缺陷。

对比基线为 `/tmp/nomad-prd-refinement-20260914/baseline/docs/prd.md` 与
`/tmp/nomad-prd-refinement-20260914/baseline/_bmad-output/planning-artifacts/epics.md`。
同时只读核对当前 v0.6 架构 shards、front-end-spec、mobile-ia、prototype coverage 与技术规格中相关措辞。

| 核对项 | 修订后的证据与结果 |
| --- | --- |
| FR14 与编排能力 | PRD 8 处 n8n 命中降为 2 处，余下均明确“不以前置/依赖”；技术假设、架构提示、worker 健壮性、批处理、告警与灰度已改用代码或各自既有权威。tech-stack/backend、AR6 与 Story 2.9 同步，不再设置低代码前置。 |
| 持久任务保护 | AR5/AR6、Story 2.9 与 backend 保留 owner、幂等、revision/attempt fencing、持久 cursor/状态、受限重试、DLQ、进程重启恢复；内存、回调和队列仍不能成为领域事实源。 |
| App 打开触发与权限 | FR48、NFR18、Story 6.2、UX 与 frontend 明确前台打开/恢复可在当前旅中餐饮上下文中使用仍有效的历史或新授权；撤销/无法确认不能只凭历史记录；同轮触发合并，未授权不会每次打开强制弹窗。 |
| App/Sheet 请求分离 | Story 6.2 与 frontend/mobile-ia 明确关闭 Sheet 只取消该 Sheet 请求；App 触发结果仅进入同 owner/scope 的短时只读候选，不导航、不替换已打开 Sheet 的选择草稿或已选餐厅。所有响应继续核对 owner、前台会话、request、revision、MealSlot、日期、scope。 |
| 后台、撤权与位置清理 | Story 6.2 与 frontend 明确后台/登出/撤权/scope 失效取消关联请求、清除上下文并丢弃迟到返回；原始 fix 处理后清除，不持续监听、定时定位或后台刷新。NFR18 保留最小短时上下文与粗粒度日志。 |
| 无 fix 与采用边界 | 原同 scope 前后计划 POI、单基准、静态池/手动添加降级未被删除；无 check-in/到访推断，候选仍只读，采用餐厅继续经过 Story 6.1 预览、确认、校验、版本和撤销。 |
| FR39 与 NFR12 | 当前 PRD/正式 epics 的“注意事实核查”均归零，Story 5.1/5.2 的 5 处“需要核查”归零；改为内容旁/槽位详情内的“建议核对”，无弹窗、重复 Toast 或逐条确认。NFR12 正文未变，PRD 与 epics inventory 完全一致；真实来源、通用建议、无法安全表达时“暂未生成”及排期/导出硬门禁均保留。 |
| 验收与原型边界 | testing-strategy 新增 App 生命周期/有效与撤销授权/草稿保护及弱提示检查；Story 6.2 明确旧图不证明新增触发已实现，Story 5.1 原有运行状态原型 checkpoint 已同步弱提示措辞，未把规划变更当作真实设备验收。 |

比对范围内仍为 **59 张 Story、995 组 Given/When/Then**；仅 Story **2.9、5.1、5.2、6.2**
正文变化，各自场景数保持 **16、22、23、21**，其余 **55** 张 Story 正文与本轮基线一致。
此次复核不覆盖主任务正在整理的全提示审计建议，也不代替 mirrors 最终一致性检查或 IR 总体结论。
