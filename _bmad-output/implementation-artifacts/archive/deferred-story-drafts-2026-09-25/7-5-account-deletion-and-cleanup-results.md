---
project: nomad-mvp
story_id: '7.5'
story_key: 7-5-account-deletion-and-cleanup-results
source_story_id: '7.5'
source_contract_sha256: b52ac1f7756c0e36bdb815f637ae236a8e5670c9c67a34ba173e5e3af71feee9
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
- FR18.1
- FR52
- NFR2
- NFR7
- NFR8
- NFR20
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/7-5-account-deletion-and-cleanup-results-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 7.5: 账号删除与清理结果

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 明确确认删除自己的账号，并知道相关数据是否已清理,
So that 我能停止使用服务，而不被仍可访问的旧数据或含糊的处理结果困扰。

**Requirements:** FR12 (account deletion), FR18.1 (shared-reference deletion/owner isolation);
NFR2-NFR3, NFR7 (deletion closure), NFR8, NFR20;
AR1-AR6, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-06. 受理后不可撤销、可选先导出、备份单独披露及两组 R1 原型获批。
**Visual references:** `story-7-5-account-delete-core-r1.png`、`story-7-5-account-delete-recovery-r1.png`。
规划批准不等于实际删除授权；保留/回执期限和真实身份核验仍须在实施验收时确定与验证。

**Acceptance Criteria:**

**Given** 用户进入删除账号页面
**When** 查看范围、保留说明或打开最终确认 Sheet
**Then** 明确展示将删除的数据、所有设备停止访问、受理后不可撤销及不可撤回的外部副本边界
**And** 未最终确认不执行删除；关闭/取消返回原流程，不增加挽留问卷或强制原因

**Given** 用户想先留存数据，或已有生成中的副本
**When** 从删除前页面选择导出或最终确认删除
**Then** 导出复用 7.4 且不强制；确认前提示需先完成下载，确认删除后停止未完成导出并撤销后续下载
**And** 不自动导出、不等待导出成功才允许删除、不承诺撤回已下载/分享的副本

**Given** 用户提交最终删除命令
**When** 服务端核验真实身份、近期认证、owner/action challenge、有效期和请求来源
**Then** 仅有效确认可进入删除，需重新核验时复用已有登录方式而不强制新增手机号或密码
**And** 开发请求头、stub OTP、过期/重放/跨 owner challenge 和 CSRF 请求不能授权生产删除

**Given** 有效删除命令通过校验
**When** 服务端提交事务
**Then** 原子固定删除任务、生命周期/授权版本、普通会话撤销与可重发的队列投递记录
**And** 只在提交成功后称已受理；队列暂不可用不丢任务或重新开放账号，提交前失败不擅自停用

**Given** 删除已受理
**When** 旧设备、旧会话、深链、SSE 或 artifact 链接访问，或服务进程重启
**Then** 持久化账号资格检查阻止普通读取/写入/下载和新登录会话，只保留限定的删除状态能力
**And** 前台清理私有缓存并丢弃迟到响应；离线设备下次连接核验并清除，不能承诺瞬时擦除离线副本

**Given** 重复点击、多设备提交或提交响应丢失
**When** 核实或重试原申请
**Then** 通过幂等 key、唯一活跃删除请求及预先绑定的安全回执恢复同一任务
**And** 不生成第二个删除、不把未知结果宣称失败/完成，不要求恢复普通账号权限才能核实

**Given** 导入、规划、AI 调整、细节、图片或数据导出任务仍在运行
**When** 账号进入删除状态或迟到结果到达
**Then** 停止后续工作并以账号删除版本/attempt fence 拒绝发布，登记和清理已产生的临时数据
**And** 重启 worker、自动重试和旧回调不能重建账号数据或恢复下载权限

**Given** 账号具有当前/历史计划、联程/一日游、草稿、灵感和用户内容
**When** 收集并执行清理
**Then** 覆盖所有自有版本、住宿/早餐/行李、候选/来源证据、修改/撤销、清单、细节与最近访问等记录
**And** 删除范围不受 7.4 当前版本导出白名单限制，不先级联删掉外部文件/trace 清理所需引用

**Given** 账号关联登录身份、会话、历史 BYOK、缓存、媒体及导出对象
**When** 执行对应清理步骤
**Then** 清理/撤销自有凭据、私有对象、缓存、临时数据及导出快照/文件，确认后续访问失效
**And** 不删除平台共用 Provider secret，不把已下载到外部的文件宣称远程清除

**Given** 多个用户导入同一内容或共享 CanonicalPOI/媒体指纹
**When** 删除当前账号的关系并回收对象
**Then** 移除其 ACL/私有证据与批注，仅在无其他有效引用且允许回收时删除共享对象
**And** 与他人并发导入/删除也不误删其他 owner 数据，不因去重将个人内容公开或永久保留

**Given** 数据可能分布于数据库、队列/缓存、对象存储及已启用的分析/错误/追踪系统
**When** 执行版本化清理清单
**Then** 每类都有完成、验证匿名化、明确隔离保留或未部署证据，不漏掉 Langfuse/Sentry 等实际保存的可识别数据
**And** 接口受理不等于物理清完，远端待处理仍为未完成，纯 hash 不冒充不可关联匿名化

**Given** 大量记录/文件、部分目标已不存在或 worker 中途重启
**When** 继续清理
**Then** 按持久步骤和有界策略续做未完成部分，去重与所有权检查后重复删除安全
**And** 迟到尝试不覆盖当前状态，不因某步失败回滚到活跃账号或丢弃未清理对象记录

**Given** 某个真实清理步骤失败或等待外部处理
**When** 展示结果和恢复动作
**Then** 显示部分数据尚未清理完成、账号仍停用；按真实重试资格提供继续处理，不假报已完成
**And** 用户重试需限定授权且只继续原任务剩余步骤，不恢复账号、不依赖 7.6 反馈或未来运营后台

**Given** 页面读取进度失败、断网或响应过时
**When** 用户重新查看
**Then** 只重读进度，并区分上次已确认事实与当前未知状态
**And** 不再次提交删除、不把离开页面当失败，不虚构后台已重试或已清理完成

**Given** 普通会话已撤销但用户需查看删除结果
**When** 使用有效受限回执或通过既有身份验证重新取得状态权限
**Then** 只读本次安全进度与保留说明；回执过期/丢失走限定核验，不发普通登录会话
**And** task id/原始用户 id/URL 参数不是凭证，回执不进入地址栏或日志、不允许读取行程/下载副本/跨 owner 查询

**Given** 必需在线数据步骤已获验证，可能仍有政策允许的隔离备份或最小保留记录
**When** 显示账号已删除
**Then** 明确在线个人数据已清理，并独立说明实际保留范围、用途、访问限制和到期政策
**And** 不笼统宣称所有副本即时消失；未知清理结果或未确定保留政策不能通过完成验收

**Given** 曾删除账号的数据仍在尚未到期的隔离备份中
**When** 按实际备份恢复流程恢复环境
**Then** 服务开放前重放受保护的删除记录，确认该账号无法登录、读回内容或被 worker 重新发布
**And** 删除记录及回执本身有明确最小保留周期/权限，不无限保存账号内容作恢复依据

**Given** 同一手机号或第三方身份再次验证，删除可能仍在进行或已完成
**When** 登录/恢复状态或明确重新注册
**Then** 清理期间仅可获得限定状态，完成后新注册必须获得新的内部 owner 身份且无旧数据
**And** 固定手机号 hash、身份映射、旧 token、缓存或迟到任务不能复活旧账号；不静默把查状态变成注册

**Given** 用户申请、查看或重试清理
**When** 返回结果或记录审计
**Then** 只显示安全类别和可用操作，审计保留最小状态/证据，不传播原文、精确地点、受保护链接或凭据
**And** 不展示额度，不因 AI 额度阻止账号删除，不新增邮件/推送/Telegram、AI 规划、打卡或相册处理

**Given** 小屏、动态字体、读屏、键盘、reduced-motion 或流程中离开
**When** 操作范围页、确认 Sheet 和状态页
**Then** 有 44pt 目标、正确焦点/播报、明确文本危险提示与返回路径，不只依赖红色
**And** 返回登录不取消已受理任务，受理后没有返回行程/撤销/恢复账号等误导入口

**Given** 实现本 Story
**When** 扩展现有认证资格检查、account 路由、最小持久化、worker 和状态 UI
**Then** 遵循 OpenAPI SSOT/生成类型，闭环最终确认、停用、清理、状态授权和恢复并按实际能力开放入口
**And** 不以假 OTP、开发身份头、数据库单表删除、队列受理或未来运维页面替代交付，真实身份缺口必须先解决

**Given** 本 Story 准备验收
**When** 使用真实 PostgreSQL/队列/私有存储和已启用追踪系统，核验多 owner、共享引用并发、全版本清理、导出/worker 竞态、响应丢失、多设备、重启、重新注册和备份恢复
**Then** 契约/repository/route/mobile 测试、真实清理证据、手机桌面截图与 workspace build 通过
**And** 版本化数据清单、保留/回执期限、恢复抑制及用户披露已确定；历史代码和示意图不算已完成证明

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C17 — App：账号停用后的原生残留

**Given** 删除已真实受理，设备可能离线、被杀、恢复备份或保留原生安全存储中的旧凭据
**When** App 恢复普通访问、收到迟到任务/插件结果或尝试旧身份登录
**Then** 持久账号资格阻断普通访问，在线恢复后清理适用凭据/私有缓存，仅允许原合同的受限删除状态查询
**And** 不因重新安装/恢复旧凭据复活 owner，不把受限回执变成普通会话，也不承诺撤回外部已保存/分享副本

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 最终确认、近期认证与删除受理事务（源场景 1、2、3、4、6）
  - [ ] 危险说明/不可撤销/外部副本及备份边界完整，导出仅可选；已有身份验证产生owner/action绑定、有效期、来源和一次性challenge，CSRF/重放/跨owner拒绝，不新建强制手机号/密码。
  - [ ] 事务固定stable deletion operation、lifecycle/authVersion、所有普通sessions撤销和outbox，提交成功才已受理；queue故障仍停用/可投递，提交前失败不改资格。同请求重复/响应丢失恢复原任务与预绑定受限receipt。

- [ ] T2 封闭所有普通访问与异步发布（源场景 5、7、9、18、23）
  - [ ] 读取/写入/SSE/download/login/原生恢复每次校验持久账号资格；worker使用删除version/attempt fence，所有导入/规划/fill/export迟到输出及自动重试不得复活数据。
  - [ ] 前台清私有cache/credential并忽略旧响应，离线设备下次联机再核清，不承诺瞬间远程擦除。清理中旧身份只获限定状态，完成后明确再注册使用全新owner，不按手机号hash复活。

- [ ] T3 建立覆盖全版本的持久清理清单（源场景 8、9、10、11、12）
  - [ ] 先固定清理所需引用，再删除所有当前/历史Plan/Trip/Excursion、草稿、候选证据、edit/undo、清单/细节/最近访问、登录身份/session/BYOK、媒体/导出等；不能沿7.4当前版本白名单或先级联丢外部引用。
  - [ ] 数据库/queue/cache/COS及实际Sentry/Langfuse/分析各分类完成、验证匿名化、允许隔离保留或未部署；remote202/简单hash不算物理完成。分批有界且幂等，持久step/attempt支持SIGKILL后继续。
  - [ ] shared CanonicalPOI/媒体只删本owner ACL/私有关系，无其他有效引用才回收并删除前再核；并发别人导入不误删，平台共用Providersecret不动。

- [ ] T4 提供受限状态授权和诚实失败恢复（源场景 13、14、15、16、19、20）
  - [ ] 普通session撤销后使用预绑定安全receipt或既有身份重新核得限定授权；receipt不进URL/log，权限仅本删除状态及允许继续原步骤，不读旅行/下载，不恢复普通账号。
  - [ ] 远端待清/失败如实部分未完成，账号仍停用；读取未知只重读，bounded retry只继续原任务；在线清理完成后独立披露真实隔离备份/最小保留用途期限，未确定政策不能完成。
  - [ ] 共享确认/状态页有44pt/focus/播报/顶部返回，受理后无撤销/恢复账号/返回行程误导；无额度/AI/邮件/TG副作用，不依赖反馈或未来ops来闭环失败。

- [ ] T5 验证备份恢复抑制与完整真实链（源场景 17、21、22、23）
  - [ ] 受保护最小删除记录有明确权限/周期；在隔离恢复库开放前重放删除抑制，证明旧账号/worker/原生备份凭据不能读回或重新发布。保留备份本身与源库。
  - [ ] 真实PG/queue/私有存储/已启用追踪删除能力，验证全版本、多owner共享引用竞争、导出/worker迟到、response lost、多设备/SIGKILL/重新注册；确认policy与用户披露，留实际证据后才关闭。
  - [ ] 真实环境删除仅按后续具体授权与受控测试owner操作；准备阶段不执行删除或索取聊天密钥，缺资源记录局部阻断。

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

交付最终确认→持久停用→所有自有版本清理→受限回执→恢复抑制的完整链；规划和准备批准不是删除真实账号授权。普通运行资格须复用1.0真实身份，不允许开发header/stub OTP。7.4先导出可选，不强制也不等其任务完成。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、4、6 | T1 最终确认、近期认证与删除受理事务 |
| 5、7、9、18、23 | T2 封闭所有普通访问与异步发布 |
| 8、9、10、11、12 | T3 建立覆盖全版本的持久清理清单 |
| 13、14、15、16、19、20 | T4 提供受限状态授权和诚实失败恢复 |
| 17、21、22、23 | T5 验证备份恢复抑制与完整真实链 |

### 当前代码、改动位置与保留行为

UPDATE：routes/account.ts当前真实删除503，fixture只是队列受理；auth持久资格/Session/owner lock已经存在，扩展其生命周期而非新建本地deleted旗标。application.ts真实worker装配需新接，旧queuesPlugin在real auth未注册。

NEW：account-deletion command/challenge/receipt/repository/cleanup registry/outbox/worker模块、delete UI与受限status transport（建议）。普通createBoundJsonRequest不能把受限receipt变普通session，需明确隔离。

UPDATE：各持久模块owner资格/发布fence与新增entity注册，schema/migrations、恢复操作手册；旧source控制器/lease职责不替换。Settings历史按钮与“已排队”不能代表完整链。

### 验证策略与资源门槛

必须真实授权负例+PG原子资格关闭+跨模块late publication+外部对象/trace实际清理+恢复库删除抑制。OS凭据恢复/设备离线延迟清理属native实证；假OTP、mock远端202、单表DELETE或queue accepted不能关闭。

### 既有实现与版本调查

先保留清理引用再删除，失败不能回滚活跃；7.6及8.1/8.2以后新增数据要注册此清单。用户已授权本批合同准备，不将此写成已有真实删除授权或已批准实际保留期限。

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

- _bmad-output/implementation-artifacts/7-5-account-deletion-and-cleanup-results.md
- _bmad-output/implementation-artifacts/7-5-account-deletion-and-cleanup-results-validation.md
