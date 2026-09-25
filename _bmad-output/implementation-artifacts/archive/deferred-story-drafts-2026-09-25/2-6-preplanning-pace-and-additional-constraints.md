---
project: nomad-mvp
story_id: '2.6'
story_key: 2-6-preplanning-pace-and-additional-constraints
source_story_id: '2.6'
source_contract_sha256: bfcc65bed33e59b96b0977f60c83469e7971c4b3551cc111974814bcab2edf43
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: drafting
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- OPS-01
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR28
- FR28.1
- FR49
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
implementation_prerequisite_story_ids:
- '2.3'
- '2.5'
- 2.0-historical-picker
- 9.3-local-ui
- '9.4'
- '9.5'
- '9.6'
- '9.7'
preparation_validation: _bmad-output/implementation-artifacts/2-6-preplanning-pace-and-additional-constraints-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
---

# Story 2.6: 规划前节奏与附加约束确认

Status: draft

> 本轮仅准备合同。源GWT按出现顺序记为AC1–AC13，下方Tasks据此逐项映射；源叙事、条款及补充保留原文。准备不解除1.7开发停止或3.1暂停。

## Story

As a 旅行者,
I want 在开始规划前确认旅行节奏和少量必要条件,
So that AI 能按照这次旅行的真实负荷偏好编排，而不用再填写一份复杂问卷.

**Requirements:** FR28, FR28.1, FR49; NFR3, NFR8, NFR12, NFR21;
AR2-AR5, AR12, AR15, AR17, AR20; UX-DR2, UX-DR3, UX-DR16,
UX-DR31-UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

## Acceptance Criteria

**Acceptance Criteria:**

**Given** owner 从已交付 Picker 基线完成地点选择
**When** 点击 Picker 主 CTA
**Then** CTA 文案为 `下一步` 并进入 S5 `规划前确认`
**And** S0-S4、设置或其他页面不得显示会启动规划的 `开始规划`，历史 Picker 的直接启动语义被兼容迁移

**Given** S5 读取当前 planning draft
**When** 页面渲染
**Then** 只显示目的地/日期简要信息、必去与顺路地点摘要、节奏选择和默认折叠的附加要求
**And** 不重复 S2/S3 的到达、离开、酒店、早餐和行李全量字段，也不显示智能规划开关、Quick/HQ、Provider 或版本名

**Given** draft 包含 required、along_route 或零地点意图
**When** S5 展示地点摘要
**Then** 分别显示必去/顺路数量与紧凑缩略项，零选择明确表示将由系统使用城市候选补全
**And** `调整` 返回 S4 且保留 S5 草稿；地点摘要不能把 along_route 显示成 required 或把未选内容显示成用户选择

**Given** 用户首次进入节奏选择
**When** PaceSelector 展示三个互斥选项
**Then** `悠闲` 说明每天 1-3 个主要安排、较晚出发并保留较多自由时间，`从容` 说明每天 2-4 个主要安排并兼顾游览与休息
**And** `充实` 说明优先覆盖更多地点并接受早出晚归、较多步行和换乘，文案不得退化为仅有快/慢标签

**Given** 自然语言或导入 evidence 没有达到版本化节奏推断阈值
**When** S5 初始化 pace
**Then** 预选 `从容`，并在用户点击 `开始规划` 时把当前可见选择作为本次明确确认
**And** 默认值不被写成来自用户历史偏好或跨行程学习

**Given** 自然语言或导入 evidence 明确表达本次节奏
**When** 系统预选 `悠闲`、`从容` 或 `充实`
**Then** 保存 source reference、observed_at、质量、置信度和推断策略版本，并使用简洁文案说明来自本次输入
**And** 预选仍可被用户修改，推断不得覆盖用户最终 pace、required、时间、住宿或其他显式约束

**Given** 用户展开 `还有其他需要注意的吗？`
**When** 输入同行人、行动能力、饮食、步行偏好或其他不能接受的条件
**Then** 保存 owner 原文、source=`user` 与当前 draft revision，并在重新进入 S5 时恢复
**And** 系统不得扩写、弱化或把模型推断合并成用户原文；结构化解析结果必须另存 provenance 与不确定状态

**Given** 本次输入或导入已形成经典、吃喝、自然、拍照、古建、小众、逛街或展览等 InterestSignal
**When** S5 冻结规划输入
**Then** 这些信号作为带来源的软排序上下文进入 snapshot
**And** S5 不增加第二套玩法多选问卷；无可靠信号时使用中性、多样化上下文，不伪装成用户确认

**Given** S2/S3 仍有 untouched 字段、Picker/S5 draft 已过期或 owner 不匹配
**When** 用户点击 `开始规划`
**Then** 阻止启动并引导到第一个需要处理的阶段，保留其他合法输入
**And** 不用隐式默认值绕过门禁，不覆盖更新 revision，也不泄露其他 owner 的 draft 是否存在

**Given** S2-S5 输入完整且当前 pace 可见
**When** 用户点击唯一的 `开始规划`
**Then** 使用 expected draft revision 与幂等键冻结包含时间边界、住宿、早餐、行李、地点意图、pace、附加要求和 InterestSignal 的不可变输入 snapshot
**And** 通过现有规划入口启动/返回同一请求身份；重复点击、HTTP 重试或页面恢复不能创建两个用户可见任务

**Given** 平台 AI 暂不可用、当前请求受限或已有进行中的 planning job
**When** S5 尝试启动
**Then** 显示平台状态、排队/稍后重试或恢复现有任务的诚实动作，保留可编辑 draft
**And** 不要求 BYOK、不显示 Provider 名称，也不把尚未创建的结果表示为规划中或已完成

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置使用 S5
**When** 选择 pace、展开附加要求、调整地点或启动规划
**Then** 互斥控件、折叠行和 CTA 具备至少 44pt 目标、标签/角色、焦点管理、非纯颜色选择态和简洁 live region
**And** 三段完整说明、长附加要求、最小支持宽度和键盘弹出均不溢出或遮挡底部 CTA

**Given** Story 2.6 准备关闭
**When** 使用三种 pace、无 evidence、可靠/冲突 evidence、用户改选、零地点、长附加要求、缺失 S2/S3、stale revision、重复启动、额度限制和恢复 fixture，并运行 OpenAPI/生成类型、snapshot/owner/幂等测试、移动与桌面浏览器检查、完整构建和 diff 检查
**Then** S5 可以独立完成节奏对齐、保留附加约束并成为唯一规划启动点，历史 Home/Picker/Planner 基线无回归
**And** corrected 全城 Picker、单一完整 Planner 编排、候选补全、路线矩阵和 DayLoadEstimate 不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 固定S5与旧生成入口的桥接边界（AC: AC1, AC9, AC10, AC13）
  - [ ] 核验已实现2.3/2.5 server completeness、旧Picker有效输入与现有PlanJob幂等能力；明确快照冻结→旧引擎内部适配的最小接缝，不等待2.7三态UI或2.9完整job，也不丢弃旧引擎暂时不能消费的新约束。
  - [ ] 准备新pace语义与旧tight/comfortable仅内部兼容映射；可靠推断阈值与parser版本先落决策，若没有实现可靠推断，UI仍默认从容且保留unknown，不伪造模型结果。

- [ ] T1 三档pace及单次推断provenance（AC: AC4, AC5, AC6, AC8）
  - [ ] leisurely/balanced/full使用完整批准说明；缺可靠证据默认balanced，点击开始时确认屏上当前选项，不当历史用户画像。
  - [ ] 本次输入有可靠pace证据才预选并带sourceRef/observedAt/quality/confidence/policy；显式用户改选优先。InterestSignal保留来源/不确定性，仅软排序，无证据中性多样，不新增玩法问卷。

- [ ] T2 保护附加约束原文并分离解析结果（AC: AC7, AC8）
  - [ ] AdditionalConstraints默认折叠；提交与恢复精确保留用户原文、source=user与draftRevision，解析单独字段/provenance，不能扩写/弱化/把模型说明并回原文。
  - [ ] 限制可接受长度和格式，输出field errors，输入内容当数据不能越过owner/模型/工具边界；不向日志/trace发送同行人、行动能力、饮食等私人文本。

- [ ] T3 唯一开始入口与不可变snapshot（AC: AC1, AC3, AC9, AC10, AC11）
  - [ ] 新流程所有S0-S4开始按钮改为导航；Picker CTA下一步，S5调整返回S4再回不清空pace/原文。legacy selected_required明确适配required，不能把未选/导入自动写along_route。
  - [ ] 服务端验证owner和expectedDraftRevision、S2/S3全部主动确认后，事务冻结含边界/stays/breakfast/luggage/intents/pace/additionalText/InterestSignal的snapshot、创建持久start receipt并绑定同请求身份；同snapshot重复/双端/unknown结果先查回执，不能两个job。

- [ ] T4 S5摘要与平台受限降级（AC: AC2, AC3, AC4, AC11, AC12）
  - [ ] 紧凑目的地/日期、required/along_route计数与缩略、三档pace和折叠要求；零选择明确系统候选补全，禁止S2/S3全字段、smartPlanning、Provider/Quick/HQ。
  - [ ] 已有进行job显示恢复真实身份，平台不可用/受限显示排队或稍后动作并保留draft；无受理事实不显示规划中。键盘底部CTA、live region和错误焦点走共享组件。

- [ ] T5 验证冻结与幂等完整性（AC: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13）
  - [ ] 矩阵包含三pace、无/可靠/冲突证据、用户优先、原文逐字、零选择、untouched前序、CAS冲突、双端同时开始、POST结果未知、恢复已有任务及额度限制；PG事务证明snapshot不可变且输入变动不改旧snapshot。
  - [ ] 检验唯一开始CTA、S4往返、长文本与200%字号；现有引擎compat mapping只供内部过渡，2.7/2.9/2.11/2.14能力不能报在本Story完成。

- [ ] T6 持久化、恢复和数据保留证据（AC13；OPS-01、DB-CHANGE-01）
  - [ ] 针对PlanningInputSnapshot、start命令回执及draft冻结引用形成migration ID/源码摘要、前向应用、失败恢复和旧数据兼容方案；隔离真实PG验证owner/引用/幂等/不可变历史，按既有资格锁次序处理，不在事务中等待Provider。无schema变更也以实际diff给出限定依据。
  - [ ] 将本Story新增PlanningInputSnapshot、start命令回执及draft冻结引用纳入新实例恢复fixture并检验当前指针、回执和旧引用；实际每日全量/15分钟增量或PITR、最新删除抑制、异机目标和实测RPO仍是生产开放门槛，不以本地dump或1.7隔离证据全局关闭。

- [ ] T7 建立本能力指标与质量对照（AC13；METRICS-01、METRICS-02、METRICS-03、CODE-QUALITY-01）
  - [ ] 以`WL-EPIC2-6`封存版本、环境、样本、pace默认/推断/用户覆盖、确认到受理、重复/恢复/受限结果以及失败/unknown/重复分母；P50/P95使用同一阶段边界与nearest-rank，有效N和缺测分列、未知费用为null。真实staging基线、yimeng-tong版本化目标和同口径发布候选比较未齐前保持相应门槛开放。
  - [ ] 保存每个业务AC的正常/错误/竞态fixture与规则结果；涉及模型的变更另记录版本/变体/重复及真实人评，不能用模拟评价代替yimeng-tong。新改TS/React文件进入9.4真实typed lint，保留Promise/Hook/label负例与只减不增的旧例外；运行受影响领域/路由/mobile测试、typegen、全workspace build、diff检查，不用占位ci:lint结果报通过。

- [ ] T8 本Story共享UI和真实宿主关闭矩阵（AC13；APP-HOST-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01、shared-ui-adoption）
  - [ ] 将S5三档pace、紧凑地点摘要与折叠附加要求接Nomad `src/ui`的Field/Button/Tabs/AppSheet/AsyncState，依9.3唯一Portal、焦点/滚动/关闭管理和9.7返回协调；业务controller继续拥有dirty、回执、cursor与revision。9.6只管普通读取，显式禁用自动retry/focus/reconnect刷新，认证确认后按scope刷新；未知身份隐藏页面与Portal并拒绝迟到响应。
  - [ ] 9.4工作台保留本Story正常、loading、empty、partial/stale、失败/重连、disabled原因、长中文/200%字号、键盘、reduced-motion、身份未知/切换场景；MSW未声明请求失败且产品构建无mock。9.5 Chromium/Firefox/WebKit按固定字体/时区/viewport/版本留actual/expected/diff与trace，对照旧探针，不自动接受截图差异。
  - [ ] Android10+/WebView111+、iOS/Safari16.4+及Firefox128+分别记录S4/S5往返与中文长文本、开始结果未知时后台/重建只恢复同一snapshot receipt，核验44pt、读屏、键盘/安全区、背景遮蔽、恢复同一owner和未知写入不重交；WSL运行Node/pnpm，iOS原生构建使用获准macOS资源。native:sync/verify、APK编译和Web截图不等于真机/TestFlight；缺Mac/签名/设备保留该切片未验收。

## Dev Notes

### 实施入口、前序与边界

S5在历史Picker输入接缝先交付，不把2.7作为前置；2.7之后交三态store。2.6拥有不可变输入和幂等开始身份，2.9在其上替换单一job/事件/发布，2.11落实完整编排。原引擎不能消费的新字段必须保存在snapshot并限制当前验收描述，不能被旧PlanGenerate schema剥除。

所有前序交付需在实施时核对真实源码/证据；同批合同只说明未来输入，当前未实现能力不能伪装成已可调用。catalog的显式dependencies保持原值；`implementation_prerequisite_story_ids`补充源GWT的语义前提，不改变准备顺序或把后续Story当成前置。9.3的本地可验证共享组件切片、9.4/9.5质量工具及9.6/9.7实际adapter由各自Story交付，既有真实auth/原生门槛独立；普通准备不部署或外发。

### 当前文件与具体修改计划

| 类型 / 文件 | 当前实查与本Story改动 | 必须保留 |
| --- | --- | --- |
| UPDATE `apps/mobile/src/planner/PlannerScreen.tsx` | Confirm有两pace和smartPlanning、Picker直接startPlanning；拆S5并使旧Picker仅下一步 | selected source/rec_id、返回草稿和当前可用引擎 |
| UPDATE `apps/mobile/src/planner/api.ts` | 内存pendingGenerations仅按JSON保存nonce；接snapshot/idempotent start receipt controller | 未知结果与明确拒绝区分、identity bound transport |
| UPDATE `apps/server/src/routes/plan.ts` | generate按requestHash/Idempotency-Key去重，尚无snapshot权威；由输入start service桥接 | 认证、幂等key内容冲突和旧jobs恢复 |
| UPDATE `apps/server/src/schemas.ts` | 只接受tight/comfortable和旧generate字段；增加独立S5/snapshot合同 | 旧客户端兼容只能服务器边界映射 |
| UPDATE `apps/server/src/planner/types.ts` | 输入仍smartPlanning与两态pace；增加snapshot领域类型消费 | 不把三档新业务压缩后丢失原事实 |
| UPDATE `docs/api/openapi.yaml`；生成 `packages/types/src/api-types.ts` | 当前是旧PlanGenerate/DayPlan/Quick-HQ等合同；新增S5确认、版本化pace/InterestSignal/额外要求、immutable snapshot和start receipt。实现前OpenAPI先行并运行生成器；类型产物禁止手改 | 既有auth/header/error envelope及旧数据兼容读取 |
| UPDATE `packages/prisma/schema.prisma`及新增迁移目录 | 当前缺本Story目标PlanningInputSnapshot、start命令回执及draft冻结引用；按首用最小增量建立/扩展，实施时复核前序已加入的同名模型 | User/Session/CanonicalPOI/Inspiration/PlanVersion/EditEvent及旧Jobs数据与外键 |

NEW计划（当前尚不存在，除前序之后可能交付的同名模块外，实施前再检查并合并，禁止复制第二权威）：

- `apps/server/src/planning-inputs/{review,snapshot,start-command}.ts`、snapshot/receipt迁移与并发tests；扩前序draft repository而非第二套draft。
- `apps/mobile/src/planning-inputs/{PlanningReviewScreen,PaceSelector,AdditionalConstraints}.tsx`和review controller/state fixtures。

### 关键实现与验收注意

后续会变化的draft不是正在执行attempt输入。S5可先以旧Picker required集合交付，along_route只有真实输入时显示，不能把计数占位写成用户事实。冻结与启动之间需耐进程失败：事务内持久受理意图/同operation，再由已有执行框架推进；不做先POST再临时setState的唯一保存。

### 原型、资料与当前证据边界

- UX：`docs/ux/mobile-ia.md` S5；`_bmad-output/implementation-artifacts/visual/story-2-0-pace-ai-adjust-r4.png`左侧S5。附加要求折叠和无可靠interest需按文本补状态。
- 源条款：`_bmad-output/planning-artifacts/epics.md` 的 Story 2.6；工程责任：本文件frontmatter指定的当前catalog/delivery；附加绑定 FR28, FR28.1, FR49, NFR8, NFR25。
- 领域架构：`docs/architecture/data-models.md`、`backend-architecture.md`、`planner-orchestration-v2.md`、`rest-api-spec.md`（后三者同在`docs/architecture/`）；`docs/tech-spec-epic-2.md`。完整事实/错误/安全边界依源Story，本Story未覆盖的跨城/编辑/天气不能因概括性架构被提前实现。
- 共享UI/Query/Router：`docs/architecture/ui-foundation.md`、`docs/architecture/frontend-data-navigation.md`、`docs/ops/ui-validation.md`。当前实际React19.2.7/Vite8.0.16/Fastify5.12.1/Prisma5/Capacitor8.5.2；不为采用工具自动升大版本。
- 本轮源码与官方资料依据：`_bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md`；适用研究：RHF输入原文、PG snapshot/CAS、Query不管写入回执。公开文档/静态检查是准备证据，真实外部能力按T0与源关闭AC单独核验。
- 既有Git历史7250a8a/534581c保留Story2.2编辑证据，10f940c保留PG修复；历史2.0/2.1只可借其有效owner/幂等/测试接缝，不复活Quick/HQ产品语义。当前未提交实现比HEAD更新，不从旧提交覆盖工作树。

## Dev Agent Record

### Agent Model Used

Codex；本记录为bmad-create-story准备，非dev-story执行。

### Debug Log References

_bmad-output/implementation-artifacts/2-6-preplanning-pace-and-additional-constraints-validation.md

### Completion Notes List

- 已准备源合同、具体实施任务和静态自查，所有实现Tasks未勾选；未执行代码、迁移、浏览器或真实服务验收。
- 准备状态由root独立审阅后推进；所有condition_progress继续以Sprint真实实施证据为准。

### File List

- _bmad-output/implementation-artifacts/2-6-preplanning-pace-and-additional-constraints.md
- _bmad-output/implementation-artifacts/2-6-preplanning-pace-and-additional-constraints-validation.md
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
