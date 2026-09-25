---
project: nomad-mvp
story_id: '7.6'
story_key: 7-6-feedback-entry-and-reliable-submission
source_story_id: '7.6'
source_contract_sha256: 5552595820ea9daad62dd186945f84097122a92078ec412981c989f865ab10df
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
- FR45
- FR52
- NFR8
- NFR15
- NFR16
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/7-6-feedback-entry-and-reliable-submission-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 7.6: 反馈入口与可靠提交

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 在遇到问题或有建议时快速反馈，并知道内容是否确实提交,
So that 外部页面或网络异常不会让我的反馈无声丢失。

**Requirements:** FR45, FR12 (feedback entry), FR49 (return-context reuse);
NFR3, NFR7 (owned-data lifecycle), NFR8, NFR15-NFR16, NFR20;
AR1-AR5, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Approved:** 2026-09-07. 包含当日上传置灰、进行中无底部按钮的修正；20 个 GWT 与 Entry R1/Recovery R2 获批。
**Visual references:** `story-7-6-feedback-entry-submit-r1.png`、`story-7-6-feedback-recovery-r2.png`；Recovery R1 已被取代。
**Detailed contract:** `story-7-6-review-2026-09-06.md` 保留编号与产品/实现边界；本批准不等于 Epic 7 整体确认或功能已交付。

**Acceptance Criteria:**

**Given** 用户从设置、侧边栏或结果页异常入口反馈
**When** 打开、返回或提交后返回
**Then** 进入同一反馈流程并恢复合法来源页/日期/滚动上下文，直接填写入口始终可达
**And** 不改变行程、调用 AI 或自动重试原失败操作

**Given** 外部产品配置可用、缺失或无效
**When** 构造反馈入口
**Then** 仅开放经过验证的官方 HTTPS 产品链接，缺失时仍提供真实可用的内置表单
**And** 不把代码默认 nomad-mvp 或任意客户端 URL 当有效产品，不向 URL 附加原始来源/用户资料

**Given** 当前环境为 Web/PWA 或本期 Android/iOS Capacitor App
**When** 用户选择外部反馈
**Then** 按实际能力执行用户触发的外部打开或文档要求的宿主配置；明确失败提供重试/浏览器/内置填写
**And** App 复用 9.1 的受限外链能力，外部页面不能持有 Nomad 原生桥接或会话，不把 window.open 当 WebView、不声称可从 iframe load/error 准确判断跨域 HTTP/CSP 或提交结果

**Given** 用户进入兔小巢
**When** 构造请求或遇到第三方登录
**Then** 不传 Nomad 会话、手机号、邮箱、owner id 或自研 SSO；需要时用户可改用已登录账号的内置表单
**And** 不保证所有宿主都匿名，不启用可选登录态、自定义参数、回复通知或数据拉取

**Given** 外部页面/邮件客户端打开、页面加载或用户返回 Nomad
**When** 更新提示和统计
**Then** 只记录真实打开尝试/可观测打开结果，第三方提交保持未知，不能显示反馈已收到
**And** 移除 mailto 打开即清空草稿/记成功的旧行为，不以跨域访问或新 webhook 伪造闭环

**Given** 用户直接填写反馈
**When** 输入问题或建议
**Then** 一段有效文字即可提交，保留原文；最多一张截图可选，不要求分类/电话/邮箱或 AI 改写
**And** 空白、超出实际文本限制或不合法输入有明确提示且不丢内容，占位文字不是提交数据

**Given** 用户选择截图并预览
**When** 明确提交且开始上传
**Then** 使用 owner 绑定的私有上传，验证实际图像格式/字节/像素并清除 EXIF 定位等元数据
**And** 未提交不上传，不自动截图/读取相册集合，不接受他人对象或外部 URL，也不提供公开图片链接

**Given** 已选截图上传失败或上传暂不可用
**When** 渲染截图区并由用户继续操作
**Then** 保留文字和可移除的预览，上传控件置灰，不展示失败提示、重试上传行或专用移除截图仅提交文字按钮
**And** 用户通过预览 X 明确移除后复用普通提交反馈；仍有未完成附件时不静默按无图提交，上传恢复后才能按正常显式流程重试
**And** 失败/删除/过期临时对象按策略回收，已绑定附件不被误删，置灰具有真实 disabled 语义而非仅换颜色

**Given** 附带诊断信息默认关闭
**When** 用户选择开启后提交
**Then** 仅附带可见说明中的来源页面类别、应用版本、安全错误代码，并由服务端白名单过滤
**And** 关闭不附带诊断字段；不包含整份计划、精确位置、原始日志/URL/stack、身份凭据或内部额度

**Given** 反馈文本合法且选定附件已验证可用
**When** 服务端原子保存反馈与最终附件引用
**Then** 返回持久回执编号/时间并显示 `反馈已收到`，回执以编号和提交时间为主，其他说明用可读小号文字呈现一次，不反复弹窗/Toast或抢占焦点；授权维护者可真实取到这份反馈
**And** 未完成保存不能报成功，不宣称问题已处理、邮件送达、腾讯已收帖或承诺答复时间

**Given** 连点、多次重试或提交响应丢失
**When** 核实或再次发送原申请
**Then** 同 owner/幂等 key/原始 payload 得到同一回执，不重复创建记录
**And** 同 key 改文/改图被拒绝，已知未受理后修改才形成新明确申请，不覆盖可能已收到的反馈

**Given** 正在上传、提交或核实原申请结果
**When** 更新实际处理阶段
**Then** 显示对应进行中状态，不展示底部重新查看、返回或替代操作按钮；未知结果由有界读取核实同一请求
**And** 只有真实保存失败或等待/核实超时后才退出进行中并开放对应恢复，不无限转圈，不清空内容或盲目新提交
**And** 截图上传单独失败按第 8 条收为置灰控件；顶部返回/系统返回仍保留请求上下文，离开/返回或网络恢复不触发自动提交

**Given** 用户返回、刷新、认证过期或切换账号
**When** 恢复草稿/回执
**Then** 仅恢复同 owner 的有效临时内容与原申请身份；截图本地字节丢失须明确重选而不假装仍可提交
**And** 本地恢复有 TTL，成功/放弃/退出/账号切换/删除时清除，迟到响应不回填其他账号，不保存认证 token

**Given** 访问内置提交、附件、回执或维护读取接口
**When** 服务端鉴权
**Then** 校验真实身份/owner/账号资格与最小角色权限，受保护资源不能靠编号、开发 header 或客户端角色读取
**And** 删除受理后的旧请求/回执不能新建反馈、上传或发布附件；不新增匿名第一方反馈或恢复已删除账号

**Given** 内置反馈已收到
**When** 授权维护者使用最小服务端运维读取路径
**Then** 能查看实际文字和鉴权附件，访问有审计且普通用户不能查询他人报告
**And** 不依赖未来运营后台、不自动转发给腾讯/邮箱/Telegram，不用不可访问的落库记录当完整交付

**Given** 用户导出数据、删除账号或放弃未提交附件
**When** 执行既有 7.4/7.5 和临时文件清理
**Then** 数据副本包含本人的反馈文字/安全附件索引而不打包截图，删除覆盖报告/附件/临时对象且防迟到复活
**And** 不声称导出或删除第三方独立帖子，不让新 feedback 表成为隐私清理遗漏

**Given** 打开、上传、提交、核实或失败发生
**When** 记录埋点/错误/审计
**Then** 区分打开与提交事件，包含有限来源类别/模式/安全错误，外部无法观测的提交不记成功或失败
**And** 反馈原文和截图不进入分析/Sentry/Langfuse/公开日志，不被当成模型或运维自动执行指令

**Given** 请求遭遇网络、存储或防滥用保护
**When** 反馈无法执行
**Then** 提供真实重试/手动路径且保留输入，上传/请求有界，不暴露额度或把 AI 预算当反馈门槛
**And** 不增加反馈历史/客服对话/SLA、SSO、回复推送、第三方 API 拉取、规划修改或后台定位

**Given** 小屏、中文输入法、长文本、键盘、读屏、reduced-motion 或外部打开受限
**When** 使用表单/预览/恢复动作
**Then** 文字可换行、CTA 不被遮挡、44pt 目标和图标名称/焦点/状态播报完整，安全外链和返回可用
**And** 上传置灰同时提供禁用语义/名称，进行中无底部按钮仍有正确焦点和顶部导航；不通过关闭 CSP/同源保护或不安全 opener 来读取第三方页面

**Given** 本 Story 准备验收
**When** 验证真实配置产品/支持宿主、第一方 PostgreSQL/COS 保存与授权维护读取、重启/重复/未知响应、上传置灰/移图后普通提交、进行中无底部按钮/有界超时恢复、截图清理、越权及账号删除竞态
**Then** OpenAPI 生成、focused tests、真实服务检查、移动桌面截图及 workspace build 通过，回执与实际记录/对象一致
**And** 未配置产品可先走内置降级但不能声称第三方接入验收通过；不使用 mock 链接、mailto 或弹窗布尔值冒充真实提交

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

#### C18 — App：App 外部反馈与单图选择

**Given** 用户从 App 进入反馈流程并选择真实配置的外部入口或内置表单
**When** 从外部页面返回，或通过系统选择器选取/取消一张截图后明确提交
**Then** 返回恢复原来源/安全草稿而不计提交成功，所选截图按原校验/EXIF/私有上传规则处理，只有第一方真实落库回执才报告已收到
**And** 不扫描相册或自动截图，不向第三方传 Nomad 身份/桥接，不因系统返回/进程重建自动重发；字节丢失时明确重选，仍保留文字反馈

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 实现安全外部入口和来源返回（源场景 1、2、3、4、5）
  - [ ] 服务端验证真实产品HTTPS配置，现有默认nomad-mvp不得当有效产品；链接只允许有限source类别，不附owner/session/手机号/原始URL，外部页面无Nomad bridge和SSO。
  - [ ] 用户触发Web/native安全外开并恢复合法来源view/date/scroll；打开/返回/iframe事件只记可观测打开，不宣称提交；移除mailto打开即清草稿/记成功的旧逻辑，直接填写始终可达。

- [ ] T2 实现文本、单图和受控上传状态（源场景 6、7、8、9、12、19、21）
  - [ ] 一段有效文字足够，不强制分类/联系；最多一张系统选择器截图，本地预览，明确提交才上传，owner私有、真实类型/字节/像素校验及EXIF位置清除，拒绝他人对象/外部URL，不扫相册。
  - [ ] 上传失败/不可用保留文字与可X移除预览、上传disabled，不出失败提示/重试行/专用无图提交CTA；用户X移除后普通提交。不静默丢附件发文本。
  - [ ] upload/submit/check receipt进行中无底部返回/重新查看/替代按钮，有界核实/timeout后才开放恢复，顶部/系统返回保留原请求；诊断默认关，只允许用户所见说明中的safe类别/版本/代码。

- [ ] T3 持久原子反馈回执和owner恢复（源场景 10、11、13、14、18）
  - [ ] OpenAPI定义stable operation/payload hash，原子保存Feedback和最终附件引用后返回receipt/time；重复同payload同receipt，同key改文图冲突，未知先核原申请不盲重发。
  - [ ] 草稿/receipt仅同owner有限TTL，成功/放弃/退出/切换/删除清理；截图字节丢失必须明确重选，late response不填新owner。资格失效禁止新反馈/上传，读取附件/receipt每次服务端授权。
  - [ ] 网络/存储/防滥用有界、无AI额度门槛；一次真实反馈已收到以编号/时间为主，不反复Toast抢焦点，不承诺腾讯收帖/问题解决。

- [ ] T4 最小维护读取与数据生命周期接线（源场景 15、16、17）
  - [ ] 授权维护者通过最小服务端路径实际可读内容与受保护图，有audit及scope权限，普通用户不可读别人；不等待8.6，也不把反馈当可执行命令。
  - [ ] 扩充7.4副本为反馈原文+安全附件索引不打包截图，7.5清理覆盖报告/附件/临时对象并fence迟到上传；取消/过期清理不误删已绑定附件，不声称删第三方独立帖子。
  - [ ] telemetry只来源类别/模式/安全错误，打开与firstparty receipt分开，无反馈正文/截图/stack/原链接；无邮件/TG/webhook或AI重试。

- [ ] T5 验证可观测结果和真实保存闭环（源场景 20、21）
  - [ ] 真实PG/COS/授权维护读取验证same operation重启/重复/未知、跨owner、账号删除race、过期清理；实际校验图片EXIF已除，ZIP不带截图。
  - [ ] 手机桌面/实际App系统单图取消/重选/外部返回及IME/大字号/focus，专项验证上传置灰、X后普通提交和busy无底部按钮。外部配置未定留未验收，不用window.open布尔/默认URL/mock链接证明第三方提交。

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

同一反馈流程支持验证过的外部兔小巢HTTPS入口和真实第一方文本+最多一张截图；不自动邮件/TG转发、不增加SSO/回复推送/客服历史。未配置产品时内置路径可推进，第三方仍未验收。R2上传置灰和进行中无底部按钮为硬UX要求。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、4、5 | T1 实现安全外部入口和来源返回 |
| 6、7、8、9、12、19、21 | T2 实现文本、单图和受控上传状态 |
| 10、11、13、14、18 | T3 持久原子反馈回执和owner恢复 |
| 15、16、17 | T4 最小维护读取与数据生命周期接线 |
| 20、21 | T5 验证可观测结果和真实保存闭环 |

### 当前代码、改动位置与保留行为

UPDATE：routes/feedback.ts目前只返回https://support.qq.com/product/默认nomad-mvp链接及source，无保存/receipt；SettingsScreen.tsx fallback是mailto并称提交到邮件，必须替换，不能修文案而无落库。settings/api.ts保持bound transport新增真实firstparty方法。

NEW：server/feedback repository/routes/private-upload及最小授权maintenance read，mobile/feedback/FeedbackScreen与状态控制器。schema新增报告/附件/operation；通过application.ts注册真实服务，复用私有对象registry与7.4/7.5接口。

UPDATE：原App返回/身份边界与共享AppSheet/Field消费，不给反馈外站桥接；图片选择插件/API由9.1既有host能力受限扩展，禁止整个相册权限扩大。

### 验证策略与资源门槛

至少有网络spy证明选图不上传、打开不算submit；真实同receipt查对应PG行/对象且维护者可读取。各异步阶段late/owner/timeout/进程重建都不自动提交；真实外链和系统picker能力分层记录。R2截图控件特殊语义必须组件+浏览器负例覆盖。

### 既有实现与版本调查

授权功能实现不等于给任何人发消息；本Story自动转发被源合同明确排除。外部第三方页面提交不可观测，第一方receipt才称已收到。存在未配置兔小巢时能独立完成内置，但不能把第三方集成项标通过。

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

- _bmad-output/implementation-artifacts/7-6-feedback-entry-and-reliable-submission.md
- _bmad-output/implementation-artifacts/7-6-feedback-entry-and-reliable-submission-validation.md
