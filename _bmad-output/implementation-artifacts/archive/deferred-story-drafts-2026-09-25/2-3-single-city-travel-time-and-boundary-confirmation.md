---
project: nomad-mvp
story_id: '2.3'
story_key: 2-3-single-city-travel-time-and-boundary-confirmation
source_story_id: '2.3'
source_contract_sha256: 1428d9ceeafc7058789b2431729ac45a0e0fbba0e1cdecf856f2990d51e36aed
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
- FR26
- FR27
- FR27.1
- FR49
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
implementation_prerequisite_story_ids:
- '1.0'
- '1.7'
- 9.3-local-ui
- '9.4'
- '9.5'
- '9.6'
- '9.7'
preparation_validation: _bmad-output/implementation-artifacts/2-3-single-city-travel-time-and-boundary-confirmation-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
---

# Story 2.3: 单城旅行时间与边界确认

Status: draft

> 本轮仅准备合同。源GWT按出现顺序记为AC1–AC11，下方Tasks据此逐项映射；源叙事、条款及补充保留原文。准备不解除1.7开发停止或3.1暂停。

## Story

As a 旅行者,
I want 用移动端短流程确认旅行日期、每天出门时间和首尾日边界,
So that AI 能知道每天真正可用于游玩的时间，而不编造交通信息.

**Requirements:** FR14, FR26, FR27, FR27.1 (time core), FR49; NFR8,
NFR23; AR1-AR5, AR11, AR15, AR17, AR20; UX-DR2, UX-DR3, UX-DR7,
UX-DR8, UX-DR32, UX-DR33
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

## Acceptance Criteria

**Acceptance Criteria:**

**Given** 用户从 Home 自然语言、目的地卡或已导入灵感开始单城规划
**When** 应用建立或恢复 planning draft
**Then** 首先进入 S2 `旅行时间`，并保留 city、start、days、source、可选 rec_id 与 place hints
**And** 灵感来源不能绕过 S2/S3；历史 `/planner/pick` 深链缺少 S2 输入时必须先由 input guard 补齐

**Given** 用户打开 S2
**When** 页面渲染当前单城 draft
**Then** 只显示目的地、整体旅行日期与天数、`每天几点出门`、到达边界和离开边界
**And** 不重复显示已选地点、住宿、节奏、玩法、门票或特殊时段，也不在本页显示 `开始规划`

**Given** 用户编辑旅行日期或每天出门时间
**When** 输入通过本地与服务端校验
**Then** 保存连续且合法的日期范围、由该范围派生的天数，以及一个合法的本地 `HH:mm` 每日出门时间
**And** 日期变化使用确定性的 reconciliation 结果标记后续住宿/选择草稿中需重新确认的字段，而不是静默截断或保留越界数据

**Given** 到达或离开边界仍处于 untouched 初始态
**When** 用户尝试进入下一阶段
**Then** 下一步保持禁用并说明需要主动选择边界处理方式
**And** `具体时间`、`大概时段（2小时）` 或 `交给 AI 安排` 均是有效确认，未触碰的空值不是

**Given** 用户为某个边界选择 `具体时间`
**When** 使用本 Story 的手工路径提交交通方式、日期、时间、地点和可选班次号
**Then** 服务端保存 provider-neutral、source=`user_provided` 的边界事实，并使用已有 AMap 搜索能力匹配 terminal/地点或明确保留低置信手填地点
**And** 手工输入不得显示成已查询、已购票、实时确认或 Provider 保证；自动航班/铁路识别不属于本 Story

**Given** 用户为某个边界选择 `大概时段（2小时）`
**When** 选择日期与窗口起点
**Then** 系统保存一个连续 120 分钟的起止窗口，日期必须位于对应旅行边界允许范围内
**And** 到达与离开可以独立使用不同模式，窗口不能被转换成虚构班次、terminal 或票务状态

**Given** 用户为某个边界选择 `交给 AI 安排`
**When** 保存 S2 draft
**Then** 只持久化显式 `ai_decide` 模式，不要求用户填写班次、地点或具体时间
**And** 后续 Planner 只能据此形成可编辑的 provisional 首末日可用时间，不得编造航班、车次、航站楼、车站或购票事实

**Given** 日期、具体时间或 2 小时窗口彼此矛盾
**When** 客户端或服务端检测到越出旅行范围、离开早于到达、窗口长度错误或非法本地时间
**Then** 使用同一类型化字段错误阻止继续并将焦点返回第一个问题字段
**And** 已合法填写的另一边界与日期草稿保持不变，不以重置整页作为错误恢复

**Given** owner 在 S2 返回、刷新、重新登录、从深链恢复或遇到弱网
**When** planning draft 被重新读取或提交
**Then** 服务端按 owner、expected revision 和幂等命令恢复最后确认的字段，客户端不依靠组件局部布尔值重建事实
**And** stale revision 提供可理解的重新载入路径，任何响应、日志或分析不包含完整私人行程文本、token 或 Provider secret

**Given** 用户通过触控、键盘、读屏或 reduced-motion 设置操作 S2 与 Boundary Sheet
**When** 选择日期、滚动时钟、切换三种模式、手工填写或返回
**Then** 控件具备至少 44pt 目标、标签/角色、焦点 containment/return、非纯颜色状态和键盘安全的底部 CTA
**And** Sheet 动效、错误 live region、长地点名称和最小支持宽度均符合移动端基线且不产生卡片套卡片

**Given** Story 2.3 准备关闭
**When** 运行 OpenAPI/生成类型、PlanningDraft migration、owner/revision/幂等、日期与 chronology、三种边界模式、深链 guard、弱网恢复、移动端与桌面浏览器检查、完整构建和 diff 检查
**Then** S2 可以独立收集并恢复诚实的单城时间约束，已有 Home、Picker 和旧 Planner 基线无回归
**And** 自动航班/铁路查询、多城市边界、逐晚住宿、Picker corrected target 与单一完整规划不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 核对S2输入与表单试点资源（AC: AC1, AC10, AC11）
  - [ ] 重读当前执行窗口；封存旧Home→Planner handoff、深链和auth transport合同，画出S2→既有下游兼容路径，不创建假S3入口或借此实施2.5。
  - [ ] 按frontend-data-navigation ADR评估RHF 7与resolver/Zod 3兼容，锁具体版本及peer证据后仅在本表单试点；不自动升后端Zod4，不为日期控件引入第二Sheet基础。核对AMap手工terminal搜索能力；不可用允许待定位。

- [ ] T1 先定义PlanningDraft、修订与命令回执（AC: AC1, AC3, AC9）
  - [ ] OpenAPI定义owner draft create/read、时间字段patch、typed field errors、expectedRevision、operationId/requestHash与receipt lookup；以owner+operation唯一键防重复、复用auth资格锁，immutable draft revision与当前指针/receipt同事务提交。
  - [ ] 保留handoff的city/start/days/source/rec_id/place hints为来源输入；已有字符串/不可信route参数先校验，不能自动把旧空边界标确认。身份未知/切owner取消读取并隐藏私有草稿。

- [ ] T2 完成日期、本地时钟与后续草稿reconciliation（AC: AC3, AC8）
  - [ ] 实现连续真实日历范围→days、城市时区和HH:mm校验，禁止用UTC日期裁切本地旅行边界。显式返回新增/移除/越界引用的reconciliation计划，已填后续住宿或地点需确认后调整。
  - [ ] 共用稳定字段错误码/路径处理非法日历、闰日、跨月年、离开早于到达、窗口越界；只定位首错误，保留另一合法边界与未提交输入；server revision冲突不以reset全页恢复。

- [ ] T3 实现三个独立可确认的到离边界分支（AC: AC4, AC5, AC6, AC7, AC8）
  - [ ] 用discriminated union保留untouched与已主动确认的exact/window_2h/ai_decide，arrival/departure独立；exact手工保存mode/date/time/地点/可选班次且source=user_provided，AMap只提供地点身份，不产生已查询/购票事实。
  - [ ] window_2h严格持续120分钟并绑定本地日期；ai_decide只存显式模式，给后续Planner provisional边界，不能填虚构service/terminal。切模式保留可恢复草稿但提交只包含活动分支，校验旧分支残值不渗透。

- [ ] T4 拆出旅行时间页面与安全导航（AC: AC1, AC2, AC4, AC10）
  - [ ] 从旧PlannerScreen提取TripDateRange、DailyStartPicker、BoundaryRow/Sheet；S2仅目的地/日期天数/每天出门/两边界，移出旧节奏/酒店/玩法/smartPlanning和开始按钮。
  - [ ] 历史/planner/pick通过typed input guard读取server completeness，缺S2先补齐；从Home卡/自然语言/灵感入口一致。下一步以server确认revision为准，untouched禁用解释，焦点/返回走共享AppSheet及Router adapter。

- [ ] T5 实现保存、未知回执和恢复竞态（AC: AC8, AC9, AC10）
  - [ ] 有界autosave或显式confirm共用命令控制器，dirty≠saved；先保存operation身份，再发命令，超时/断网先GET原receipt，不因reload/login恢复生成新operation或旧响应覆盖新字段。
  - [ ] 覆盖跨tab CAS冲突、auth session变化、日期修改与边界保存竞态、AMap迟到返回、IME输入、返回与忙碌关闭；使用安全错误文本和脱敏阶段/计数，禁私人行程原文/secret。

- [ ] T6 封存S2独立验收与回归（AC: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11）
  - [ ] 建立日期范围/三模式组合/显式AI或window/untouched/手工待定位/窗口跨午夜/双端冲突/unknown receipt/历史深链矩阵；真实PG验证不可变revision及Home来源不丢失。
  - [ ] 浏览器实走Home→S2确认→既有可达下游，验证弱网返回、首错焦点与另一边界保留；按源AC11标明自动班次、多城、S3和完整Planner尚属后续。

- [ ] T7 持久化、恢复和数据保留证据（AC11；OPS-01、DB-CHANGE-01）
  - [ ] 针对PlanningDraft、PlanningDraftRevision及输入命令回执形成migration ID/源码摘要、前向应用、失败恢复和旧数据兼容方案；隔离真实PG验证owner/引用/幂等/不可变历史，按既有资格锁次序处理，不在事务中等待Provider。无schema变更也以实际diff给出限定依据。
  - [ ] 将本Story新增PlanningDraft、PlanningDraftRevision及输入命令回执纳入新实例恢复fixture并检验当前指针、回执和旧引用；实际每日全量/15分钟增量或PITR、最新删除抑制、异机目标和实测RPO仍是生产开放门槛，不以本地dump或1.7隔离证据全局关闭。

- [ ] T8 建立本能力指标与质量对照（AC11；METRICS-01、METRICS-02、METRICS-03、CODE-QUALITY-01）
  - [ ] 以`WL-EPIC2-3`封存版本、环境、样本、输入确认成功/冲突、日期reconciliation、回执恢复与字段错误分母以及失败/unknown/重复分母；P50/P95使用同一阶段边界与nearest-rank，有效N和缺测分列、未知费用为null。真实staging基线、yimeng-tong版本化目标和同口径发布候选比较未齐前保持相应门槛开放。
  - [ ] 保存每个业务AC的正常/错误/竞态fixture与规则结果；涉及模型的变更另记录版本/变体/重复及真实人评，不能用模拟评价代替yimeng-tong。新改TS/React文件进入9.4真实typed lint，保留Promise/Hook/label负例与只减不增的旧例外；运行受影响领域/路由/mobile测试、typegen、全workspace build、diff检查，不用占位ci:lint结果报通过。

- [ ] T9 本Story共享UI和真实宿主关闭矩阵（AC11；APP-HOST-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01、shared-ui-adoption）
  - [ ] 将S2日期/时钟/三模式BoundarySheet接Nomad `src/ui`的Field/Button/Tabs/AppSheet/AsyncState，依9.3唯一Portal、焦点/滚动/关闭管理和9.7返回协调；业务controller继续拥有dirty、回执、cursor与revision。9.6只管普通读取，显式禁用自动retry/focus/reconnect刷新，认证确认后按scope刷新；未知身份隐藏页面与Portal并拒绝迟到响应。
  - [ ] 9.4工作台保留本Story正常、loading、empty、partial/stale、失败/重连、disabled原因、长中文/200%字号、键盘、reduced-motion、身份未知/切换场景；MSW未声明请求失败且产品构建无mock。9.5 Chromium/Firefox/WebKit按固定字体/时区/viewport/版本留actual/expected/diff与trace，对照旧探针，不自动接受截图差异。
  - [ ] Android10+/WebView111+、iOS/Safari16.4+及Firefox128+分别记录BoundarySheet三模式、中文键盘、系统返回不提交和进程重建后的同一draft/receipt，核验44pt、读屏、键盘/安全区、背景遮蔽、恢复同一owner和未知写入不重交；WSL运行Node/pnpm，iOS原生构建使用获准macOS资源。native:sync/verify、APK编译和Web截图不等于真机/TestFlight；缺Mac/签名/设备保留该切片未验收。

## Dev Notes

### 实施入口、前序与边界

本Story首次交付PlanningInputs时间切片；前序1.0认证与1.7持久动作经验可复用，但IngestCommand并不适合直接存旅行草稿。2.4随后增强exact查询，2.5引入逐晚住宿，不能把它们设为S2实现前置。此前确认页面是迁移输入；执行到本Story时读取9.6/9.7实际实现，不从本准备文件猜其API名称。

所有前序交付需在实施时核对真实源码/证据；同批合同只说明未来输入，当前未实现能力不能伪装成已可调用。catalog的显式dependencies保持原值；`implementation_prerequisite_story_ids`补充源GWT的语义前提，不改变准备顺序或把后续Story当成前置。9.3的本地可验证共享组件切片、9.4/9.5质量工具及9.6/9.7实际adapter由各自Story交付，既有真实auth/原生门槛独立；普通准备不部署或外发。

### 当前文件与具体修改计划

| 类型 / 文件 | 当前实查与本Story改动 | 必须保留 |
| --- | --- | --- |
| UPDATE `apps/mobile/src/planner/PlannerScreen.tsx` | 旧Confirm混合酒店/两态pace/全局行李，选地后直接generate；拆出S2入口与阶段交接 | Home handoff来源与既有Picker/Plan可用路径，历史输入只兼容读取 |
| UPDATE `apps/mobile/src/planner/api.ts` | 已有身份绑定request但无draft/receipt接口；加入typed draft client，不把旧内存nonce当持久保障 | Web/native transport与身份fence |
| UPDATE `apps/server/src/application.ts` | 已有auth/plan/search装配；注册PlanningInputs路由与生命周期 | 真实模式fail-closed与旧插件顺序 |
| UPDATE `apps/server/src/schemas.ts` | 旧date/HH:mm校验与PlanGenerateBody仍是2态pace/14天/旧字段；提取复用日历验证，新增独立输入schema | 旧API显式兼容，不默改历史payload |
| UPDATE `apps/server/src/routes/search.ts` | 受保护Top-K地点搜索；按terminal上下文返回typed失败/空结果 | 先auth，不把地图作为班次供应商 |
| UPDATE `docs/api/openapi.yaml`；生成 `packages/types/src/api-types.ts` | 当前是旧PlanGenerate/DayPlan/Quick-HQ等合同；新增PlanningDraft、时间边界union、completeness和命令/receipt读写。实现前OpenAPI先行并运行生成器；类型产物禁止手改 | 既有auth/header/error envelope及旧数据兼容读取 |
| UPDATE `packages/prisma/schema.prisma`及新增迁移目录 | 当前缺本Story目标PlanningDraft、PlanningDraftRevision及输入命令回执；按首用最小增量建立/扩展，实施时复核前序已加入的同名模型 | User/Session/CanonicalPOI/Inspiration/PlanVersion/EditEvent及旧Jobs数据与外键 |

NEW计划（当前尚不存在，除前序之后可能交付的同名模块外，实施前再检查并合并，禁止复制第二权威）：

- `apps/server/src/planning-inputs/{types,service,repository,prisma-repository,time-boundaries,reconciliation}.ts`与focused tests：最小draft/revision/receipt及时间规则。
- `apps/server/src/routes/planning-inputs.ts`：由application装配的受保护输入读写/回执路由。
- `apps/mobile/src/planning-inputs/{TravelTimeScreen,TripBoundarySheet}.tsx`及draft-controller/api测试；前序若已提供命令/导航公共接缝则复用。

### 关键实现与验收注意

S2不能预填到达/离开后当主动确认；旧wakePreference/morningStartTime和新dailyStart映射要有版本，不保留两个用户问题。日期reconciliation保留logical references供2.5消费，当前不存在住宿实体时返回空影响而不创造酒店。当前14天上限是旧实现限制；T0核对当前源支持范围，不能为了方便把新范围擅改或从无上限城市推导无限天数。状态回执服务端权威，表单RHF dirty仅负责离页保护。

### 原型、资料与当前证据边界

- UX：`docs/ux/mobile-ia.md` S2；`docs/front-end-spec.md` Time and Accommodation。
- 原型：`_bmad-output/implementation-artifacts/visual/story-2-0-time-transport-r3.png`、`story-2-0-transport-manual-entry-r1.png`（同visual目录）。窗口/AI模式原型不足时按源文本补状态用例，不能复制图片中未批准旧选项。
- 源条款：`_bmad-output/planning-artifacts/epics.md` 的 Story 2.3；工程责任：本文件frontmatter指定的当前catalog/delivery；附加绑定 FR26, FR27, FR27.1, FR49, NFR8, NFR25。
- 领域架构：`docs/architecture/data-models.md`、`backend-architecture.md`、`planner-orchestration-v2.md`、`rest-api-spec.md`（后三者同在`docs/architecture/`）；`docs/tech-spec-epic-2.md`。完整事实/错误/安全边界依源Story，本Story未覆盖的跨城/编辑/天气不能因概括性架构被提前实现。
- 共享UI/Query/Router：`docs/architecture/ui-foundation.md`、`docs/architecture/frontend-data-navigation.md`、`docs/ops/ui-validation.md`。当前实际React19.2.7/Vite8.0.16/Fastify5.12.1/Prisma5/Capacitor8.5.2；不为采用工具自动升大版本。
- 本轮源码与官方资料依据：`_bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md`；适用研究：RHF reset/dirty、PG事务、AMap文本匹配、Base UI/Capacitor/Query。公开文档/静态检查是准备证据，真实外部能力按T0与源关闭AC单独核验。
- 既有Git历史7250a8a/534581c保留Story2.2编辑证据，10f940c保留PG修复；历史2.0/2.1只可借其有效owner/幂等/测试接缝，不复活Quick/HQ产品语义。当前未提交实现比HEAD更新，不从旧提交覆盖工作树。

## Dev Agent Record

### Agent Model Used

Codex；本记录为bmad-create-story准备，非dev-story执行。

### Debug Log References

_bmad-output/implementation-artifacts/2-3-single-city-travel-time-and-boundary-confirmation-validation.md

### Completion Notes List

- 已准备源合同、具体实施任务和静态自查，所有实现Tasks未勾选；未执行代码、迁移、浏览器或真实服务验收。
- 准备状态由root独立审阅后推进；所有condition_progress继续以Sprint真实实施证据为准。

### File List

- _bmad-output/implementation-artifacts/2-3-single-city-travel-time-and-boundary-confirmation.md
- _bmad-output/implementation-artifacts/2-3-single-city-travel-time-and-boundary-confirmation-validation.md
- _bmad-output/implementation-artifacts/research/preparation-epic2-2026-09-25.md
