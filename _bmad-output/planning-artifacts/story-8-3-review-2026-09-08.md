---
project: nomad-mvp
date: 2026-09-08
workflow: bmad-create-epics-and-stories-step-3
epic: 8
story: '8.3'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-08
researchDelegated: true
researchStatus: complete
researchDecisionApproved: true
---

# Story 8.3 Review: 任务级 Provider 路由与安全切换

8.2 的 24 条 GWT、逐规则评价、Langfuse 人工工作区与 Human Workspace R2 已批准追加。
当前继续 CE Step 3，定义生产调用配置；不修改业务代码、部署网关或调用真实模型。
用户于 2026-09-08 确认本 Story 的范围、采用方案与两组 R1 原型；24 条 GWT 已原样追加
正式 epics。此处是规划批准，不是生产操作授权、实现完成或 Epic 8 关闭。

## Story

As a Nomad 运营者，
I want 按任务调整服务端模型和备用顺序，在检查后发布，并能查看生效情况与安全回滚，
So that 我能持续迭代模型和处理提供商异常，而不打断既有任务或改变用户行程。

**Requirements:** FR14（Provider 集成）、FR33（任务控制/回退）、FR38（平台保护与运营配置）；
FR13（消费 8.1 观测/8.2 评价，不重建）、FR7/FR10/FR22/FR32（保留既有编排/校验/填充合同）；
NFR1-NFR7、NFR9-NFR12、NFR17、NFR20-NFR23；AR1-AR8、AR11-AR15、AR17-AR20；
UX-DR3（可访问操作）、UX-DR31（用户不见模型/额度）、UX-DR33（原型与真实证据区分）。

## Local Baseline

2026-09-08 只读检查；这些代码是历史执行基线，开发本 Story 时须以此前业务 Story 的新版实现为准。

- `integrations/flags.ts` 只初始化 Unleash 并导出 `isEnabled(flag, fallback)`；声明/安装的
  unleash-client 为 ^6.7.0 / 6.7.0。`await initialize` 不证明已同步远端配置。
- `index.ts` 调用 `initFlags`，未发现任务级路由版本/草稿/发布接口；无已实现运营权限合同。
- `planner/hq.ts` 的 `ServerManagedHqAdapter` 使用一组 `AI_PROVIDER_BASE_URL/API_KEY/MODEL`，
  POST `/chat/completions`，timeout 通过 AbortSignal，要求 JSON，但没有此处需要的版本化路线表。
- 旧 HQ 日用量是内存 Map；fill 在 index 中仍使用模拟输出，ingest 提取仍有 stub。
  不把这些当作已交付多模态/规划/填充 Provider 管理，也不复制旧 HQ 采用语义或内存计量。
- Prisma/OpenAPI 本次未查到 RoutePolicy/运营配置实体或接口；已有 PostgreSQL、Prisma、
  Fastify、React/Vite 可提供最小受限操作面，不必先造通用后台或新的框架。

## Research and Approved Adoption

委派范围：Unleash/配置发布管理，以及 LiteLLM/Bifrost 网关；均要求官方资料与 GitHub。
主 agent 负责当前合同、任务版本语义及关键源码核验，研究汇总见
`research/story-8-3-mature-implementations-2026-09-08.md`。采用方向及原型已获批准。

已批准保留既有 Node adapter，复用 PostgreSQL/Fastify/React 增加窄路由配置面；Unleash 仅
保留普通功能开关，不作为第二个可写路由权威。本期不新增 LiteLLM/Bifrost 服务或购买
Unleash Enterprise。它们的跨协议/审批能力已比较，未来有明确收益再做兼容验证。
PG 事务保存策略/有效指针/操作回执；这部分需实际实现，不宣称已由框架自动保证。

## Approved Scope

- 管理已注册、已具备适配器的 AI 连接：按已交付任务区分图文理解、初始规划、细节完善、
  局部调整等；能力注册随首次业务使用交付。ASR 若接口不同保持其已交付专用适配器。
- 小型纵向操作链：路由列表 -> 编辑草稿 -> 检查/查看评价 -> 发布确认 -> 查看使用证据/回滚。
  单次发布只修改指定任务的配置；整份环境策略生成不可变版本，其他任务原样继承。
- 不动态部署新 adapter，不开放任意 Base URL/代码/工具 schema，不做 Provider 市场、
  用户 BYOK、自动最优模型选择或百分比流量实验。已批准 8.2 管实验，8.3 管生产发布。
- 最低并发、token/超时/重试/预算保护随此前业务能力已有；此处不能绕过。集中预算和
  结算仍归 8.4，Telegram 归 8.5，总览归 8.6；本 Story 不依赖它们才可使用。

## Acceptance Criteria

### 1. Existing task coverage

**Given** 此前业务 Story 已交付可用 AI 调用与最低保护
**When** 接入任务级路由配置
**Then** 盘点并覆盖所有当前适用调用点，经同一受控路由解析与适配器执行，不留环境变量直连旁路
**And** 未交付任务/不支持的模态不显示为可用；不实现其业务，保留一个 PlanningJob 和用户现有入口

### 2. Real operator entry and authorization

**Given** 操作者具备服务器明确授予的环境级运营权限
**When** 打开路由列表、编辑或发布接口
**Then** 可实际查看/修改已注册任务配置，服务端分别校验读/写/发布权限及会话，普通用户不可访问
**And** 复用既有身份和最小运营授权，不相信客户端角色/header，不等待 8.6；同一可信管理员可自审，不强制新增多人审批系统

### 3. Registered connections and capability compatibility

**Given** 选择主用/备用模型连接
**When** 服务器解析 connection/model/adapter 与 prompt/output schema 版本
**Then** 校验对应任务的文本/图片/音频、工具调用、结构化输出、上下文和参数能力；每条备用也须满足合同
**And** OpenAI-compatible 名称本身不是兼容证明；无支持、未验证或已停用连接不能成为可发布目标，不能靠丢图片/字段/工具降级冒充兼容

### 4. Typed policy and bounded settings

**Given** 编辑任务的主用、备用顺序及允许参数
**When** 校验配置
**Then** 使用版本化 schema 校验唯一连接顺序、模型参数、总时限、单次时限和总尝试上限，拒绝未知字段、循环/重复回退及超出既有保护的值
**And** 明确重试包含首次请求/备用请求的计算口径，不用不同层默认值叠乘；所有数量/时长由已批准策略给出，原型数字不成为默认限制

### 5. Secrets and allowed destinations

**Given** 操作者查看/编辑/检查已注册连接
**When** 传输配置或发起请求
**Then** 仅使用服务端注册的 adapter/endpoint/secret 引用，不返回 secret 值，也不允许配置任意 URL、headers、脚本或覆盖鉴权
**And** 出站目的地/重定向/私网和日志字段有明确约束；换供应商的数据外发范围须已获准，未注册连接由受控部署流程接入，不靠 UI 绕过

### 6. Drafts do not affect traffic

**Given** 当前发布策略为 Rn
**When** 创建、保存、离开或重新打开任务配置草稿
**Then** 持久保留草稿及基准版本，显示未发布改动；当前调用策略和已接受任务不变
**And** 草稿修改形成可校验版本/哈希，旧检查结果失效；切换环境不将测试草稿静默应用到生产

### 7. Configuration checks and optional live probes

**Given** 草稿已保存且基准仍有效
**When** 点击检查
**Then** 无付费调用地检查结构、已注册能力/引用、secret 可解析性和本地策略一致性，并显示检查范围与未验证项
**And** 静态通过不等于连接/模型质量已实测；新增连接首次发布需已有有效能力证据，主动探测另有明确授权、合成输入和调用预算，不能因浏览/保存自动付费

### 8. Evaluation evidence is not automatic publication

**Given** 候选配置关联 Story 8.2 评价
**When** 检查或确认生产发布
**Then** 展示具体样本/模型/prompt/规则/评价版本及适用范围，运营可查看分歧与处理理由；不把不匹配的报告算作当前配置证据
**And** 评价按 8.2 逐规则政策解释，不恢复任一硬失败统一否决；配置/权限/运行时安全校验独立，Langfuse label 或分数变化不能触发自动上线

### 9. Preview and atomic publication

**Given** 草稿/检查结果有效且操作者有目标环境发布权限
**When** 预览改动并确认发布
**Then** 明确显示环境、任务、主用/备用差异、适用 prompt 版本和影响范围；以 expected current revision 原子创建新策略及切换有效指针
**And** 其他任务配置不变；并发发布冲突需重新检查/确认，不覆盖对方；发布指针、配置内容和审计记录不可部分成功

### 10. Idempotency and unknown submission

**Given** 发布/暂停/恢复/回滚请求重复或返回结果未知
**When** 查询或重试同一操作
**Then** 使用持久 operation ID 恢复既有回执及实际状态，避免生成重复版本或反转已生效命令
**And** 断网不显示成功或失败定论；原草稿/请求引用保留，配置读取失败不清空当前已知内容

### 11. Snapshot at task acceptance

**Given** 新任务被服务器接受或旧任务从队列/重启恢复
**When** 确定其调用配置
**Then** 在接受时持久绑定已发布策略、具体 prompt/模型参数和 adapter 身份；已接收但尚在排队的任务也保留该快照
**And** 普通发布仅影响此后接受的新任务；同一任务后续阶段/重试不能重新读取 floating latest 偷换模型，显式创建的新用户任务才重新取配置
**And** 新任务接受须读取权威有效指针；权威状态未知时不以陈旧缓存悄悄接受新的付费任务，保留原输入与真实恢复路径

### 12. Applied-version evidence

**Given** 新版本已发布但实例可能尚未加载或暂无新任务
**When** 查看生效情况或执行已绑定任务
**Then** 区分发布回执、已加载/未加载和实际调用使用的版本，按真实记录展示未知/等待使用，不把一次写入说成全实例已生效
**And** worker 必须取得并验证任务要求的精确快照再执行；缺失时等待/有界恢复，不擅自执行另一版本；失联实例不能被计为已同步
**And** 旧模型/prompt/config 内容保留至引用任务结束，绑定具体内容而非可变 alias；若凭据被撤销则按暂停/不可用流程处理，不使用新 alias 偷换目标

### 13. Classified sequential fallback

**Given** 主用调用失败且预算/期限允许继续
**When** 路由器处理稳定错误类
**Then** 按已配置、去重且兼容的顺序重试/回退，记录每次实际尝试；限流 Retry-After、网络/5xx、鉴权/计费异常有不同策略
**And** 参数/输入错误、业务约束拒绝或安全拒绝不能通过换模型绕过；401/计费异常不盲重试原连接，备用仍须有权限及预算
**And** 只有当前 fenced attempt 可继续/发布，所有路线不可用时由已有业务流程降级/失败，不另建用户结果

### 14. Partial responses and output validation

**Given** 模型流式断开、输出不完整或 schema/业务校验未通过
**When** 决定丢弃或执行允许的恢复尝试
**Then** 不拼接两家模型的半段结果，不把原始 token/工具文本当作已完成行程；可重试的输出错误受同一总上限约束
**And** 工具副作用沿用业务幂等/持久结果，不重做已提交操作；输出始终经过既有 Validator/填充保护，用户只见真实 job 阶段

### 15. First-use budgets and breaker ownership

**Given** 发布的新路线比旧路线昂贵，或 SDK/网关自身具有重试/冷却功能
**When** 每次调用准备发出
**Then** 重新适用已有预算/并发/token/总期限保护，统一计算所有层的实际尝试与消耗；无法获得足够保护不能发出新的付费请求
**And** 同一边界只设一个有效重试/回退控制者，保留现有熔断的跨进程语义，不以改配置/重启清零次数；8.4 才扩展集中治理

### 16. Last-known-good and control outage

**Given** 配置源/缓存故障或进程首次启动
**When** 读取已发布策略
**Then** 只使用来源、环境、版本和有效性已验证的 last-known-good/任务快照；没有可信配置则该能力不可调用，不随意退到环境变量模型
**And** 控制源失联时禁止发布并显示陈旧状态；既有任务只有在暂停/预算等安全授权仍有效时继续，失效则停止新外部调用而保留任务/行程

### 17. Pause future calls explicitly

**Given** 运营发现某个连接或任务不宜继续发起请求
**When** 明确确认暂停新调用
**Then** 持久记录独立暂停状态/范围及递增控制版本，每次尚未发出的主用/重试/备用调用都须通过该检查
**And** 不把普通换模型解释为暂停；已发出请求不承诺撤回/不计费，响应按原安全合同处理，不因此自动重跑或撤销用户任务
**And** 控制信息采用有界有效期并实测传播窗口，过期/无法确认时阻止新外发，不承诺网络分区下瞬时全球停用

### 18. Resume is explicit and separate

**Given** 连接/任务因运营暂停或实际熔断而不可用
**When** 运营恢复已暂停范围
**Then** 按预期控制版本检查能力/凭据与现有预算，确认后解除人工暂停；实际故障熔断按自身恢复证据处理，不能被 UI 无条件清空
**And** 解除暂停不自动重跑已结束任务，不解除其他范围限制，普通发布/回滚也不隐式解除暂停

### 19. Rollback creates a new release

**Given** 运营选择历史已发布版本作为恢复目标
**When** 查看差异并确认回滚
**Then** 按当前连接可用性、能力/权限及保护重新校验，基于当前指针创建新的递增版本并标记来源，而非删除历史或直接把版本号倒退
**And** 原 secret 已失效/连接已停用时不能回到该危险配置；只影响后续新任务，不改变既有 Plan/Trip/任务快照，也不解除暂停

### 20. Auditable operations and safe metrics

**Given** 查看配置、检查、发布、暂停、恢复或回滚产生实际动作
**When** 写入操作记录并关联 8.1 观测
**Then** 保留实际操作者、环境/任务、时间、操作 ID、前后版本、脱敏差异及结果；每次 Provider attempt 可关联对应发布版本/稳定错误类
**And** 不记录密钥、用户完整输入输出或高基数内容指标；未知 usage/传播状态不记零，观测失联不反转已持久操作；不依赖企业审计面板才有基本记录

### 21. Operator states and accessibility

**Given** 操作者进入列表、草稿、检查结果或发布/回滚确认
**When** 数据加载、为空、检查失败、权限不足、版本冲突或操作进行中
**Then** 有明确非颜色状态、具体不可用原因、保留输入和返回/重试路径，按钮不重复提交；键盘、焦点恢复和 reduced motion 可用
**And** 生产环境和影响范围在确认处始终可见；用户旅行 Settings 无模型/额度/运营入口，原型数据不充当真实配置

### 22. Minimal integration and migration

**Given** 本 Story 从旧环境变量/布尔开关迁移到受控配置
**When** 初始化默认已注册连接与策略并切换调用路径
**Then** 有可审查的一次性映射、空配置/失败回退及兼容部署说明，不把密钥迁入明文表；已开始任务可按原有效快照完成
**And** 只创建本 Story 必需的配置/操作记录/权限及接口，OpenAPI 与生成类型先行，不增加新框架/独立通用后台或未来预算实体
**And** 现有普通 Unleash 开关只能沿已批准用途收紧能力，不能另给模型路线或覆盖 PG 发布/暂停状态；迁移不遗留双写权威

### 23. No adjacent feature expansion

**Given** 运营完成模型配置变更
**When** 系统继续提供用户服务
**Then** 不重排已有行程、不更换城市范围、不改用户偏好、冻结事实或内容，不恢复 BYOK/Quick-HQ 选择
**And** 不管理高德/航班/天气/XHS 账号，不实现 XHS 搜索、自动模型择优、生产流量 A/B、预算中心、Telegram 或总览；不把网关安装等同这些需求已完成

### 24. Real release and failure evidence

**Given** 本 Story 准备交付
**When** 使用当前项目工具链和已授权 staging 验证
**Then** 真实覆盖主用/备用、schema/多模态能力不符、发布冲突/未知回执、排队/在途/重启快照、停用/恢复、失联/陈旧控制、无可信配置、回滚与实际版本查询
**And** 验证有限重试/流式半包/幂等工具、隐藏额外尝试、成本未知及无权访问；真实 PostgreSQL、合成/获准小样本 Provider、UI 截图和项目测试/构建均有证据
**And** 静态检查、mock/SDK 初始化、供应商网页和原型不证明路线可用；未实测能力/部署/许可明确保留为交付门禁

## Approved Visuals

`story-8-3-route-config-release-r1.png`：列表/编辑、发布差异与发布使用状态。
`story-8-3-route-recovery-rollback-r1.png`：检查失败、失联/结果未知与回滚/暂停边界。
均位于 `_bmad-output/implementation-artifacts/visual/`。这不是 Langfuse/Unleash/网关的
精确截图；已批准的小型 Nomad 配置页仅承载本 Story 动作，不代表通用后台或已部署界面。

## Next Gate

24 条 GWT 已追加，批准状态、源文档/镜像与恢复入口同步。下一张为 8.4 平台预算与用量
策略管理，先委派 GitHub/官方成熟实现调研，再形成详细合同/原型；目前尚未完成该准备。
8.1/8.2 与历史 Sprint 状态不变，CE 仍在 Step 3，不提前运行 IR/SP 或恢复业务实现。
