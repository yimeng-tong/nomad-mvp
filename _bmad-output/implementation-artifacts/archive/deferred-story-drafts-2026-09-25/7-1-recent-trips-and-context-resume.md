---
project: nomad-mvp
story_id: '7.1'
story_key: 7-1-recent-trips-and-context-resume
source_story_id: '7.1'
source_contract_sha256: ccf5bbceea081388681f35175e7670c86194ef9b7c07c6912e9942fbc7482647
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: draft-pending-independent-validation
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
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
- FR40
- FR49
- FR52
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/7-1-recent-trips-and-context-resume-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 7.1: 最近行程与继续使用

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 从首页找到已有行程，并继续上次的填写、规划或查看,
So that 关闭页面或中断后仍能接着使用，不用重复输入或重新生成计划。

**Requirements:** FR40 (recent trips only), FR49 (existing navigation reuse),
FR37 (existing ResultSheet consumption); NFR2, NFR3, NFR8, NFR20;
AR1-AR6, AR9, AR12, AR14-AR15, AR17-AR20;
UX-DR1-UX-DR4, UX-DR18, UX-DR29-UX-DR30, UX-DR32-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

Scope amendment (2026-09-06): Story 7.2 is explicitly deferred out of MVP, so AR16 is not a
current readiness gate. This story neither consumes check-in nor invents its persistence schema;
its approved 22 acceptance scenarios remain unchanged.

**Approved:** 2026-09-06. 本合同包含已确认的真实变更草稿与任务失败边界。
**Visual references:** `story-7-1-recent-trips-resume-r1.png`、
`story-7-1-recent-trips-recovery-r1.png`；后者 D 仅示意当前变更任务真实失败。
半途填写使用中性的 `有未完成的修改 / 继续填写`，原型文字不覆盖本合同。

**Acceptance Criteria:**

**Given** 用户已登录并进入首页
**When** 首页读取最近行程
**Then** 展示最近一趟行程的简要入口，并通过 `全部` 和现有菜单进入同一最近行程列表
**And** 保留原有 `计划 | 灵感`、HomeImportDock 长输入框和 `+ / send`；读取失败不阻塞输入

**Given** 当前 owner 有已保存的规划输入、独立 Plan 或联程 Trip
**When** 获取首页摘要或分页列表
**Then** 仅返回该 owner 的真实记录，并按上述稳定规则排序，支持继续加载
**And** 列表展示城市或城市链、已知日期/天数、真实状态和对应动作；未知日期不伪造
**And** 未提交的输入框内容和单纯导入记录不自动变成行程；图片缺失使用稳定占位，不阻止打开

**Given** 一趟行程包含多个城市或宿主日的一日游 child Plan
**When** 列出或恢复该行程
**Then** 整趟联程只占一项，城市子 Plan 和一日游不重复生成独立卡片
**And** 城市链支持长名称及多城市，打开后可读取完整顺序；按稳定 id 而不是城市名定位
**And** 原独立计划并入联程后的旧入口需鉴权并解析到所属当前联程，不打开脱离 Trip 的旧子版本

**Given** 服务端已有当前可阅读的 PlanRevision 或完整 TripRevision
**When** 列表显示该行程
**Then** 使用 `已生成`，不因进入行程单、导出或日期过去而标记旅行 `已完成`
**And** 细节未完善或已有校验冲突不移除该入口；具体状态仍由现有 S7/S10 负责

**Given** 行程尚未发布且已保存 S2-S5 输入
**When** 用户选择 `继续填写`
**Then** 回到最近有效的填写阶段，并恢复已保存的时间、住宿、行李、地点意图与节奏数据
**And** 缺失前置条件时回到首个需处理阶段，不跳过既有确认规则；酒店允许留空

**Given** 该行程的当前 PlanningJob 或 TripPlanningJob 仍在运行
**When** 用户选择 `查看进度` 或重启后恢复
**Then** 打开原有 S6/S7 shell 并重连同一持久任务的真实阶段和 cursor
**And** 打开页面不新建任务、不重复扣费，也不把未原子发布的城市结果当成完整联程

**Given** 首次规划终止失败且不存在已发布行程
**When** 用户选择 `查看原因`
**Then** 进入既有失败恢复界面，保留输入并显示该错误实际支持的重试、修改输入或恢复动作
**And** 仅用户明确选择重试才调用已有幂等/fenced 重试流程；不伪造可阅读行程
**And** 原型的 `重试生成` 仅代表可重试暂时失败，不为额度、鉴权或结构错误统一提供盲重试

**Given** 已有可用行程，用户新增城市、修改跨城日期或交通等进入既有重新编排流程
**When** 渲染最近行程入口
**Then** 主入口继续打开已发布行程，只有该 owner 确实存在关联本行程、尚待处理的持久变更草稿或任务时，才在同一项内提供继续处理入口
**And** 不覆盖当前行程、不重复生成卡片，也不静默应用草稿；仅打开页面、关闭未保存弹窗或普通编辑请求失败不产生此入口

**Given** 已有行程的变更草稿已保存，但用户填写到一半离开，尚未提交当前草稿的重新编排任务
**When** 再次查看最近行程
**Then** 同一行程项显示中性的 `有未完成的修改` 和 `继续填写`，恢复真实保存的输入阶段
**And** 不显示失败、错误图标或重试生成；原行程仍可独立打开，离开页面不会自动启动编排

**Given** 当前已保存的变更已提交，关联的持久重新编排任务处于排队或运行中
**When** 显示或打开附属入口
**Then** 显示 `修改规划中` 和 `查看进度`，复用真实任务状态与重连流程
**And** 用户关闭页面、断线或进度读取暂时失败不等于任务失败；无法确认新状态时仅在该进度模块显示 `暂未更新 · 重试`，保留真实已知状态并可查看读取原因，不猜测终态或扩大成全页警告

**Given** 当前变更版本关联的有效任务已真实进入终止失败状态
**When** 显示最近行程的附属入口
**Then** 才显示 `本次修改生成失败` 和 `查看原因`，提供实际错误允许的恢复动作
**And** 主入口仍打开原行程；失败需匹配当前 draft/input revision 与有效 job/attempt，历史或被新草稿取代的失败不覆盖当前状态

**Given** 当前变更已发布、明确放弃，或失败后用户继续修改并保存了新的输入版本
**When** 刷新最近行程
**Then** 发布后主入口指向当前新行程；放弃且无其他待处理草稿/任务时移除附属入口；新输入未重新提交时显示 `有未完成的修改`
**And** 取消任务不自动称为失败；若取消后仍保留可继续的草稿则恢复未完成修改入口，否则不展示待处理入口

**Given** 用户上次在有效的 S7 编辑页或 S10 行程单离开
**When** 选择对应 `继续编辑` 或 `继续查看`
**Then** 恢复该视图、所在城市或一日游 scope、日期和可用滚动锚点
**And** 无有效偏好时回到现有 S7 默认视图；不强制所有行程进入同一种新页面
**And** 不恢复瞬时弹窗、未确认的 AI 建议或过期的撤销倒计时为已生效状态

**Given** 用户在 S9 或 S11 的既有持久任务中离开
**When** 从最近行程恢复
**Then** 复用原任务入口和现有版本/过期检查，或安全返回其 S10 父视图
**And** 不重新设计 fill/export 状态机，不自动重新完善或重新导出

**Given** 本地保存的视图或 revision 提示已旧
**When** 打开行程
**Then** 先按 owner 与稳定 aggregate id 查询服务端当前版本，并以该版本恢复安全位置
**And** 联程读取一个原子 TripRevision 的完整成员集合，不拼接各子 Plan 的不同 current 版本
**And** 原日期、地点或 scope 已消失时回到有效父 scope/日期；不能按同名地点猜测身份

**Given** 用户离开已成功打开的行程页面
**When** 保存浏览位置并关闭/重启客户端
**Then** 最小恢复信息按 owner 与稳定行程标识持久化，和 Plan/TripRevision 分开保存
**And** 保存允许的 view、scope、日期、稳定滚动锚点与版本提示，不保存任意跳转 URL、原始输入、来源链接或定位轨迹
**And** 同一浏览会话的迟到写入不可覆盖较新的位置；位置保存失败不阻塞查看或修改行程

**Given** 会话失效、owner 切换、目标删除或目标不可访问
**When** 加载列表、继续入口、深链或恢复位置
**Then** 重新鉴权并只恢复同 owner 的有效目标；不存在与越权使用不泄露对方信息的统一不可用结果
**And** 退出/切换账号清除当前账号的私有缓存、缩略图与挂起响应；无效入口提供返回列表或首页

**Given** 列表正在加载、真实为空或请求失败
**When** 展示对应状态
**Then** 分别展示稳定占位、无行程空态或模块内 `暂未更新 · 重试`，不把加载失败当作空列表，不以列表错误覆盖首页其他可用操作
**And** 同 owner 已有可用的列表摘要可保留，刷新问题只在本模块说明，已知的数据截至与来源可按需查看，未知时间不伪造；不把缓存当成已验证当前内容，撤权后立即清除不可访问数据
**And** 无法联网校验时不承诺离线编辑/后台提交；重试和返回入口保持可用

**Given** 用户浏览列表或重新打开行程
**When** recent/resume metadata 被更新
**Then** 只更新浏览元数据，不创建 PlanRevision/TripRevision、打卡、用户偏好学习或新的 AI 操作
**And** 原有冲突、酒店/行李修改规则和导出门禁继续由对应前序 Story 决定

**Given** 长城市名、多城市、动态字体、键盘或 reduced-motion 场景
**When** 浏览首页/列表并返回
**Then** 文本和动作不重叠，图标有名称，状态不只靠颜色，触控目标至少 44pt
**And** 记录列表滚动位置并正确返回焦点；弱网占位及短转场不导致 Dock 或列表跳动

**Given** 现有 Home、规划输入/任务、Plan/Trip 与 ResultSheet 已具备各自能力
**When** 实现本 Story
**Then** 仅补聚合查询、导航恢复及必要的 owner-scoped 浏览元数据/API/迁移
**And** 使用 OpenAPI SSOT 生成类型，不依赖 7.2 打卡、7.3 设置重做或另一个数据库前置 Story

**Given** 本 Story 实现准备验收
**When** 执行自动化和浏览器核验
**Then** 覆盖单城/多城/一日游聚合、草稿发布不重复、相同城市不同旅行、分页、任务重连、首次失败、已有行程变更草稿/任务真实失败、过期 scope、账号隔离与真实空/失败状态
**And** 专项覆盖新增城市/跨城日期或交通改动后半途离开、无持久草稿不展示入口、排队/断线不误报失败、旧失败不覆盖新输入、取消/放弃和成功发布后的入口清理；普通编辑错误不能制造变更草稿
**And** 验证重开不增加规划调用/扣费/行程版本，位置持久化经服务和浏览器重启仍可恢复
**And** 通过契约生成、相关单元/route/repository/mobile 测试、真实 PostgreSQL、桌面/移动截图与 workspace build；原型不算实现证据

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C14 — App：进程终止后的最近行程

**Given** owner 已有服务器持久的行程/任务/安全恢复元数据，App 被系统终止或完成覆盖升级
**When** 再次认证并选择最近行程
**Then** 读取当前服务端 revision 与有效恢复位置，恢复同一个 Plan/Trip/active city 或 child scope
**And** 不以旧本地缓存覆盖新版，不把未持久化输入声称为已保存；无法恢复时提供诚实入口，重新打开不触发重新规划

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 建立owner行程聚合与稳定分页（源场景 1、2、3、4）
  - [ ] OpenAPI先定义摘要/分页/恢复读模型，按owner真实已保存输入、独立Plan、root Trip聚合，子Plan/一日游不重复卡片；旧独立Plan alias须鉴权解析到所属当前Trip。稳定排序+游标处理同时间并发，名称非身份。
  - [ ] 保留Home计划/灵感与Dock，首页最近一项和全部/菜单指向同列表；无图稳定占位，未知日期不猜，已生成不等旅行已完成，读取失败仅本模块。

- [ ] T2 严格投影草稿、任务和已发布状态（源场景 5、6、7、8、9、10、11、12）
  - [ ] 新未发布行程按已保存stage恢复；运行任务重连同job/cursor，首次失败按真实错误动作进入原恢复页。重开不创建/重试任务、不扣费。
  - [ ] 已有计划主入口始终读已发布版本；只有匹配当前持久draft/input revision与有效attempt的附属记录显示未完成修改/修改规划中/终止失败。半途离开无持久draft则无附属入口；新输入覆盖旧失败、放弃/发布/取消状态依源合同清理。
  - [ ] 断线或读取失败只显示暂未更新·重试，保留已知状态和源时间；不把HTTP失败变成Job失败、不自动应用草稿。

- [ ] T3 恢复安全视图与原子版本集合（源场景 13、14、15、16、19）
  - [ ] 持久owner+aggregate允许view/scope/date/稳定scroll anchor/version hint，独立于PlanRevision；同浏览会话迟到写用单调seq/CAS保护，失败不阻塞业务。
  - [ ] 打开先重新鉴权读current原子TripRevision成员集合，过期scope/date回安全parent；S9/S11既有任务复用有效入口否则S10，transientSheet/AI未确认/过期undo不恢复。URL/元数据无私有原文/任意跳转URL/轨迹。

- [ ] T4 实现读取恢复UI和身份隔离（源场景 17、18、20、23）
  - [ ] 最近列表通过9.6已存在共享读取适配或领域绑定transport消费，通过9.7类型导航复用；加载/真空/模块读取失败、legal stale数据与失权区分，切owner清cache/缩略图/挂起响应。
  - [ ] 大字号长城市链/44pt焦点与滚动返回保持Dock稳定；App杀进程/覆盖升级后只信当前服务端revision和已保存恢复信息，不将本地旧snapshot回写或称未保存输入已保存。

- [ ] T5 证明聚合不触发业务写入与跨端恢复（源场景 21、22、23）
  - [ ] 真实PG包含同名城市不同旅行、多城+一日游、alias、分页、持久草稿/真实终止失败/新revision覆盖旧失败、发布/放弃/取消；统计浏览过程Plan/TripRevision和外部planning调用不增长。
  - [ ] 浏览器重启+App真机进程重建/当前安装候选验证当前owner/scope/date/任务和safe parent；工作台截图按批准recent/recovery原型，D只用于当前任务真实失败。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] DB-CHANGE-01：仅为本 Story 实际 schema/索引/回填变化制定绑定 migration 与源码的恢复方案，真实匹配版本隔离 PG 验证；选择可逆、前向修复或 PITR，不清旧库解决问题。若没有数据库变更，关闭时给出可检查的不适用依据。
  - [ ] METRICS-01：在本 Story 首次消费处复核版本化事件/分母/时间窗/归因、隐私选择与脱敏，记录失败/取消/部分/未知；不等8.1才接线，不复制原始输入/位置/私有链接/凭据。
  - [ ] METRICS-02：分别记录本 Story 实际延迟/成功率/成本的样本、环境、并发与失败；真实基线及正式目标未确认时保留未验收，不用 fixture 或原型数字填通过。
  - [ ] METRICS-03：为本 Story 领域规则保留封存样本、版本和逐规则fixture，完整记录case/variant/repeat及失败/缺失；计分、提醒和需人评分别列出，不设置统一质量硬否决。早期规则测试不等待8.2；8.2真实yimeng-tong评分/评语和封存报告另为人评门槛，不能用合成证据关闭。
  - [ ] APP-HOST-01：在本 Story 实际 Android/iOS 页面与能力上核验返回键、键盘、安全区、权限、前后台/进程重建和 owner 隔离；iOS16.4+及批准Android矩阵、Web Safari16.4+/Firefox128+分别记录。无页面/权限分支须给具体不适用理由，构建与浏览器不能代替真机。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-COMPONENT-01：本 Story 的明确页面消费 Nomad 基础/组合组件，沿用批准品牌与布局；Portal跟随身份遮蔽，焦点/滚动/受控关闭/状态不破坏原领域合同，旧兼容组件记录退出责任。
  - [ ] UI-WORKBENCH-01：本 Story 新增或修改的组件补正常、空、loading、error、partial/reconnect、长中文、200%字号、身份未确认等适用场景及交互/a11y；复用9.4隔离MSW，未声明网络必须失败，开发入口不入产品。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；关闭证据：当前源码组件/浏览器/适用原生证据，逐Story关闭

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

消费各原业务已交付的持久输入/PlanningJob/Trip/ResultSheet读取能力；本Story只补owner聚合、导航与安全恢复元数据，不等待7.2打卡/7.3设置，不实现新的planning/fill/export状态机。未来上游尚未实现时可准备类型与fixture，不能假定当前有Trip表。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、4 | T1 建立owner行程聚合与稳定分页 |
| 5、6、7、8、9、10、11、12 | T2 严格投影草稿、任务和已发布状态 |
| 13、14、15、16、19 | T3 恢复安全视图与原子版本集合 |
| 17、18、20、23 | T4 实现读取恢复UI和身份隔离 |
| 21、22、23 | T5 证明聚合不触发业务写入与跨端恢复 |

### 当前代码、改动位置与保留行为

UPDATE：HomeScreen.tsx当前只有city灵感和plan/library切页，没有最近行程列表；插入摘要不能阻塞底部Dock或更改其active窗口。App.tsx当前仅local view/handoff，届时消费9.7路由而不复制导航；createBoundJsonRequest继续授权。

NEW：server/recent/repository.ts、owner-scoped list/resume route、mobile/recent/RecentTripsScreen及安全view metadata。schema.prisma目前只有旧Plan模型，Trip/DayExcursion/持久草稿由2.x/4.x届时提供；本Story接确切成员版本，不能直接按子Plan.current拼接。

UPDATE：docs/api/openapi.yaml及生成类型、Home真实入口/路由声明；普通编辑、SSE和fill/export controller为保护对象，浏览位置不得进入其revision或operation写路径。

### 验证策略与资源门槛

真实PG验证数据集合/alias/owner与monotonic位置，浏览器包含读失败不empty、不覆盖其他Home功能、late旧owner。原任务ID/cursor与调用次数是恢复证明，截图不够；原型中“失败”不适用于半途草稿。C14要求实际终止/升级证据。

### 既有实现与版本调查

7.2及AR16当前延期，不引入check-in表。当前Planner仍有Quick/HQ历史命名，上游2.9/2.11统一后的业务真值才可聚合；“已生成”按已发布revision，不按旧phase猜。

### 引用

- CURRENT.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
- docs/prd.md
- docs/architecture/data-models.md
- docs/architecture/backend-architecture.md
- docs/architecture/frontend-architecture.md
- docs/architecture/frontend-data-navigation.md
- docs/architecture/app-host.md
- docs/front-end-spec.md
- docs/architecture/testing-strategy.md
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 本批准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 准备验证和独立审阅记录在同名 validation；所有开发任务保持未勾选。

### File List

- _bmad-output/implementation-artifacts/7-1-recent-trips-and-context-resume.md
- _bmad-output/implementation-artifacts/7-1-recent-trips-and-context-resume-validation.md
