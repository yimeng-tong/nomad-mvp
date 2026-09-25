---
project: nomad-mvp
story_id: '7.4'
story_key: 7-4-account-data-copy-export
source_story_id: '7.4'
source_contract_sha256: 535db894d951a821d7b7603fab0cfe497b24f7416a9203b758be9a4d34da54af
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
- OPS-02
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
- FR12
- FR52
- NFR2
- NFR7
- NFR8
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/7-4-account-data-copy-export-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 7.4: 账号数据副本导出

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 下载一份自己在 Nomad 中保存的数据副本,
So that 我能留存和查阅自己的规划内容，且不会误下载他人的数据。

**Requirements:** FR12 (account-data export); NFR2-NFR3, NFR7 (data-export closure), NFR8,
NFR20, NFR22 (read the exact linked revision set, no publication change);
AR1-AR6, AR9, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 当前结构化数据范围、JSON-in-ZIP 和两组 R1 原型获批。
**Visual references:** `story-7-4-account-export-core-r1.png`、`story-7-4-account-export-recovery-r1.png`。
账号数据副本与 Epic 5 行程图片导出分离；后者仍不使用 ZIP。原型日期/大小不定义期限策略。

**Acceptance Criteria:**

**Given** 用户从可用的设置入口进入账号数据导出
**When** 尚未提交申请
**Then** 在生成前简述真实数据范围、关键排除项与 `ZIP 内含 JSON`，并以可读次要文字显示一次 `副本含个人数据，请妥善保管`；详细字段、完整排除项和适用保留说明可在当前页展开，只有明确点击生成才创建任务，关键导出后果不得后置到生成之后
**And** 不因进入/返回/刷新页面触发导出，不改变行程图片导出的规则

**Given** 当前账号存在计划、联程、已保存草稿、灵感、批注、清单或行程文字
**When** 按本 Story 的版本化字段白名单收集副本
**Then** 包含各类别当前已保存内容及必要的 owner 自有关系和已引用地点事实，保留用户表达与来源区分
**And** 未保存的本地输入不假装已备份，空类别明确为空，不纳入历史版本/原图视频/图片导出产物

**Given** 数据集中含共享 POI、私有来源、身份凭据或内部调用信息
**When** 收集、序列化、记录日志或报告失败
**Then** 只包含当前 owner 白名单数据及必要共享事实，排除其他 owner 关系和所有密钥/cookie/token/签名地址/内部额度
**And** 不导出原始模型输入输出、完整采集证据、原始私有来源 URL、原始设备位置轨迹或非安全账号标识，不向日志复制副本正文

**Given** 用户在导出请求等待期间或数据收集期间继续修改计划、草稿或清单
**When** 完成一致性捕获
**Then** 固定真实 snapshotAt 下的当前字段和确切 Plan/Trip/DayExcursion/Transfer/Stay/Luggage 版本集合
**And** 不把请求时间冒充数据截至时间，不混合不同联程版本，不从实时 current 指针逐页拼接漂移副本

**Given** 捕获或打包过程中失败/进程重启
**When** 恢复任务
**Then** 已封存快照的技术重试使用同一数据和策略版本；封存前可重新捕获但最终如实记录新 cutoff
**And** 迟到 worker 不得覆盖当前尝试/已发布产物，不在同一副本身份下静默替换成更新数据

**Given** 重复点击、多端并发或提交响应丢失
**When** 再次提交或核实同一申请
**Then** 幂等回执和每 owner 单个活跃任务约束返回同一已受理任务，不重复打包
**And** 不能依赖 Date.now 作为唯一身份，也不把另一账号的任务用于合并

**Given** 任务进入执行
**When** 收集、生成 JSON/说明/manifest 并上传 ZIP
**Then** 完成真实文件、类别完整性和校验检查后原子标记可下载，任务状态由持久化记录而非队列推测
**And** 必需类别读取失败、打包或对象存储失败不得以部分内容报成功或提前提供下载

**Given** 任务排队或执行中，用户离开、刷新、断网或退出后重新登录
**When** 回到当前账号的数据副本页面
**Then** 恢复实际任务和阶段，不自动再次申请；退出当前会话不取消已受理导出
**And** 状态读取失败显示核实/重试读取，不能把页面离开或网络错误标为任务失败，不显示虚构进度/额度

**Given** 导出已真实完成
**When** 打开下载页及副本
**Then** 展示真实文件名/大小、数据截至与下载有效至，ZIP 内的 JSON、manifest 和说明可解析且关联可核对；普通浏览器经用户操作实际交出下载请求且无可观察拒绝时显示 `已开始下载，请确认`，内部保存结果仍未知，不新增逐文件确认步骤或宣称已保存
**And** 不把生成时间/过期时间当额度窗口，不宣称数据库备份、恢复导入或尚未实现的格式

**Given** 用户读取状态或发起任一文件下载请求
**When** 服务端处理
**Then** 校验当前认证、owner、账号可用性、产物状态和有效期；无权/失效请求不得返回文件或私有元数据
**And** 不提供公开分享链接，不以已知 task id 或签名链接单独放行，文件名不能形成路径注入

**Given** 副本仍有效而应用检测到下载请求失败
**When** 用户重试下载
**Then** 获取同一文件，不重新收集数据或启动导出任务
**And** 下载任务仍为可用；重试后普通浏览器确已交出请求且无可观察拒绝时仍使用 `已开始下载，请确认`，已知取消/阻止/失败照实显示；浏览器保存结果无法确认时不宣称已保存到设备/相册，也不把文件生成可用当作已完成保存

**Given** 文件已超过实际配置的有效期、不可再用或用户需要最新内容
**When** 用户选择重新生成
**Then** 创建新申请并捕获新的当前数据；旧过期文件不可通过刷新链接复活
**And** 清理仅针对导出副本及临时对象，不删除原始计划/灵感，留存时长不得硬编码为原型示例

**Given** 文件生成后账号内容发生修改，或新一轮生成失败
**When** 用户下载旧的仍有效副本
**Then** 明确保留该副本自己的数据截至时间，不声称包含后续变化
**And** 新任务失败不提前销毁仍有效旧产物，不自动再生成；无需提供完整历史版本管理界面

**Given** 原请求会话失效，或账号在捕获/发布/下载前已被禁用或删除
**When** 任务和文件处理继续
**Then** 会话失效不等于取消任务；账号不再有资格时拒绝捕获/发布/后续下载并回收本任务临时数据
**And** 不实现账号删除本身，不以客户端登录旗标授权，不依赖 7.5 先交付才可完成本 Story

**Given** 无旅行数据、大量数据、超时、对象失败或部分读取故障
**When** 执行导出
**Then** 空账号仍可生成说明明确的副本，大数据按经过测试的资源策略有界处理；无法完成时如实失败并保留源数据
**And** 不静默截断、忽略失败类别或把未完成包当成功；重试受内部保护且不对用户展示额度

**Given** 用户申请、查询、重试或下载副本
**When** 处理请求
**Then** 仅读取已有产品数据并写导出任务/临时数据/产物，不创建 PlanRevision/TripRevision 或改变用户内容
**And** 不调用 AI/高德/XHS 补资料，不读相册，不增加邮件/推送/运营 Telegram 或自动删除账号

**Given** 小屏、长文件名、动态字体、读屏、reduced-motion、读取失败或登录过期
**When** 操作导出页
**Then** 图标有名称、44pt 目标、文字换行、状态播报/焦点返回正确，提供实际可用的重试/登录/返回
**And** 不只靠颜色，不让旧账号响应回填新账号页面，不把生成失败态用于未知读取结果

**Given** 实现本 Story
**When** 扩展现有 account 导出入口、worker、最小持久化/存储和 mobile 客户端
**Then** 先维护 OpenAPI SSOT 并生成类型，交付申请到鉴权下载全链；按端到端真实能力开放设置入口
**And** 不顺便重写删除/反馈任务、增加通用任务框架或用 mock 下载链接证明业务完成

**Given** 本 Story 准备验收
**When** 核验多 owner/共享 POI、联程含一日游、当前草稿/用户覆盖、并发编辑、快照重试、账号资格变化与过期
**Then** 解包真实产物核对字段/数量/关系/校验和及时间一致性，越权与凭据泄漏测试全部通过
**And** 证明普通退出不取消任务、删除资格禁止未来下载、技术重试不换快照且必需类别错误不产生成功文件

**Given** 核验完整生产式执行路径
**When** 使用真实 PostgreSQL、队列 worker 和受保护对象存储，测试重启/重复提交/上传失败/下载失败/过期以及手机桌面视图
**Then** 契约、repository/route/mobile、存储 staging 检查、截图和 workspace build 通过，离开后可恢复同一任务并下载实际可解析文件
**And** 浏览器保存能力与文件期限按真实环境验证，不用 queue accepted、模拟成功或图中示例替代交付证据

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C16 — App：系统文件保存账号副本

**Given** 本人当前结构化数据副本已真实生成且仍有访问资格
**When** App 使用受保护下载和用户选择的系统文件保存路径交付 ZIP
**Then** 保存同一封存快照并按实际系统回执区分已保存、取消、失败和未知，失败可重取同一有效文件
**And** 不保存到图片相册、不自动公开分享或交出签名 URL/凭据；退出/资格变化按原合同阻止后续读取，并清理 App 临时副本

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 定义数据白名单与一致封存快照（源场景 1、2、3、4、5）
  - [ ] 在申请前显示真实范围/关键排除/ZIP内JSON和一次个人数据保管提示；字段policy版本包含当前Plan/Trip/DayExcursion/Stay/Luggage、草稿/用户内容及必要关系/共享事实，排除历史、原图视频、原始私有URL/模型IO/凭据/轨迹。
  - [ ] 捕获用真实snapshotAt及确切聚合版本集合，不逐页读current混合版本；封存前失败可重捕获新cutoff，封存后技术重试同snapshot/policy，不能同身份换新数据。

- [ ] T2 持久单活跃导出与fenced打包发布（源场景 5、6、7、8、15）
  - [ ] owner+operation payload持久幂等和单active约束，账号资格/导出任务/outbox原子提交，Date.now不是身份；queue只调度，PG状态决定真实阶段。
  - [ ] worker分段有界收集，所有必需类别/JSON/manifest/关系/校验和通过，私有ZIP上传确认后事务发布；partial读取失败不成功，lease/attempt防迟到覆盖。空账号合法副本、大数据不截断。
  - [ ] 刷新/断网/退出重登只读同任务，无自动重申请；未知状态与真实失败分开，新任务失败不销毁仍有效旧产物。

- [ ] T3 交付每次鉴权的下载与过期策略（源场景 9、10、11、12、13、14、16）
  - [ ] 下载验证session/owner/账号可用/产物可用/期限，任务ID或旧签名链接不能单独访问；安全文件名，无公开分享或日志复制副本正文。
  - [ ] 显示真实文件名/大小/snapshotAt/有效至；普通浏览器用户触发交出下载且无拒绝时精确文案已开始下载，请确认，取消/阻止/未知不称已保存。重试下载同文件，过期只能明确新申请，新旧cutoff分开。
  - [ ] 原会话过期不取消后台，但账号禁用/删除禁止捕获/发布/后续下载并清临时；不调用AI/AMap/XHS补数，不写Plan/TripRevision。

- [ ] T4 实现App系统文件交付与页面恢复（源场景 17、18、21）
  - [ ] 共享组件数据导出页/状态/重试，错误读取不等失败，身份切换Portal/迟到数据遮蔽；长文件名/读屏/44pt/keyboard/safe-area符合平台。
  - [ ] App受保护下载同封存ZIP至用户选择系统文件位置，分别记录保存/取消/失败/未知，不能保存相册或自动分享签名URL；退出/资格变化清适用App临时副本。

- [ ] T5 真实完整产物与恢复验收（源场景 19、20、21）
  - [ ] 用多owner/共享POI/多城一日游/用户覆盖/当前草稿真实PG数据，并发编辑/重启/上传失败/重复/过期/资格变更，解包实际ZIP比对字段数量关系及hash。
  - [ ] 验证普通退出不取消、过期不可刷新复活、未知响应同receipt、错误必需类别无成功；真实queue/COS与手机桌面/双端文件选择器证据绑定当前候选，mock链接不算交付。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] OPS-02：为本 Story 实际新增的媒体/临时/产物/反馈对象登记独立生命周期、ACL、共享引用及清理 fence；原图180天转低频不删除、缩略图长期。验证迟到上传、179/180/181天及并发引用，真实删除先干跑且按资源授权。
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

账号当前结构化数据副本以JSON-in-ZIP交付，区别于5.5行程图片不ZIP。独立于7.5账号删除实施，但每次捕获/发布/下载复核账号资格；普通退出不取消已受理任务。真实清理仅本任务临时/产物，不改源行程。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、4、5 | T1 定义数据白名单与一致封存快照 |
| 5、6、7、8、15 | T2 持久单活跃导出与fenced打包发布 |
| 9、10、11、12、13、14、16 | T3 交付每次鉴权的下载与过期策略 |
| 17、18、21 | T4 实现App系统文件交付与页面恢复 |
| 19、20、21 | T5 真实完整产物与恢复验收 |

### 当前代码、改动位置与保留行为

UPDATE：routes/account.ts真实authAuthority下export为503 FEATURE_NOT_AVAILABLE，fixture仅BullMQ Date.now任务；需要真实持久worker/outbox和权限链，不能去掉503就算能力。application.ts只在无real service注册旧queuesPlugin，要显式设计新worker生命周期/停止而非假定真实队列已接好。

UPDATE：settings/api.ts和SettingsScreen历史确认入口改为专属流程；共享auth transport保留。schema.prisma增加AccountExportJob/Snapshot/Artifact或同义最小实体，确切Trip成员消费前序实现。NEW：server/account-export模块与mobile/settings/data-export页面、对象registry；先OpenAPI生成类型。

### 验证策略与资源门槛

PG snapshot consistency+restart、真实私有对象ACL/期限、实际ZIP解包及跨owner拒绝；下载HTTP交出与OS保存结果分开。真实普通退出、禁用和后续7.5删除qualification接口应可测，不为验证而删除真实用户。

### 既有实现与版本调查

不以7.4白名单定义7.5全部删除范围；7.6交付时追加反馈文字/安全附件索引但不打包截图。原型日期/大小不是保存期限，实施时以已确定实际policy为准并保留运营恢复方案。

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

- _bmad-output/implementation-artifacts/7-4-account-data-copy-export.md
- _bmad-output/implementation-artifacts/7-4-account-data-copy-export-validation.md
