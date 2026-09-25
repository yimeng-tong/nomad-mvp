---
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
story_id: '1.0'
story_key: 1-0-production-login-and-multi-device-sessions
source_story_id: '1.0'
source_contract_sha256: 1b2306196fb9b9ebc1284e3404004112349d7a0a352a1622bebf5a7188f77c4b
source_epics: _bmad-output/planning-artifacts/epics.md
created: '2026-09-17'
updated: '2026-09-20'
workflow: bmad-create-story
preparation_status: complete
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-2-2-timeline-editing
implementation_started: true
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
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
source_obligations:
- login-attribution
- shared-ui-adoption
delivery_requirements:
- FR1
- FR12
- FR14
- FR15
- FR16
- FR52
- NFR1
- NFR3
- NFR6
- NFR7
- NFR8
- NFR20
- NFR25
external_service_evidence: pending-authorized-verification
resource_alignment: _bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md
scope_revision: ui-foundation-2026-09-20
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
---

# Story 1.0: 生产登录与多设备会话补齐

Status: in-progress

> 本文件是待实施合同。18组现行GWT包含已批准Capacitor增量；原安全/业务义务保留；准备就绪不表示真实服务、迁移、恢复或生产开放已经验收。

> 2026-09-18用户补充后的实施选择见[资源对齐记录](research/story-1-0-resource-alignment-2026-09-18.md)：homelab优先、按需frp、PNVS短信认证与图形H5。冻结来源中的供应商品牌名按该决定执行；其余安全/产品验收责任保留。

> 2026-09-19资源已补齐并通过配置预检；用户授权homelab复用/创建，现有VM104已启动且健康。当前进度见[资源确认](research/story-1-0-resource-confirmation-2026-09-19.md)，整体开发测试完成后再发布公有云。

## Story and Requirements

As a 旅行者,
I want 通过真实登录回到自己的账号，并在不同设备持续访问我的行程,
So that 服务重启、另一台设备登录或一次退出不会让我丢失数据或把私人内容交给错误账号.

**Requirements:** FR1, FR12（当前会话退出及删除认证基础）, FR14（登录集成）, FR15, FR16;
NFR1, NFR3, NFR6-NFR8, NFR20; AR1-AR6, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33。另承接 2026-09-15 IR-01/IR-06 批准决定。
App 宿主补充：FR52; NFR25; AR23-AR24; UX-DR36。

**Execution boundary (IR-01/IR-06, 2026-09-15):** 这是现有工程的生产认证补齐，复用历史1.1/1.2已存在的首屏/路由，不依赖后续新增功能；在1.6及以后真实用户/首个运营写入前完成。1.1–1.5历史done与旧Sprint不重写。

交付映射另明确 NFR6 的 `login-attribution`，以及 OPS-01、DB-CHANGE-01、METRICS-01/02/03。旧SP时这些是同一Story的任务与条件；2026-09-19获批App范围另增4组GWT与APP-HOST-01。

## Acceptance Criteria

### AC1 — 真实登录与现有入口

**Given** 用户在本期支持的Web/PWA、Android Capacitor App 或 iOS Capacitor App打开现有登录首屏
**When** 读取登录能力并选择手机号或本期获准启用的第三方方式
**Then** 手机号登录接通真实验证码验证；各启用方式的配置、前台入口、服务端回调/验证与目标环境能力一致，成功后用真实会话读取 `/me` 并进入既有首页
**And** 延续 Apple/手机号/微信在适用平台的已批准等权与顺序、协议链接和真实不可用状态；仅有按钮或配置不算接通，缺少本期必需服务证据不能靠隐藏入口宣布关闭，App 工程与基础宿主由 Story 9.1 交付，本 Story 在三端核验实际身份、会话、适用第三方方式与返回路径，缺少任一支持端的必需证据不得关闭

### AC2 — 生产测试通道隔离

**Given** 应用以生产或面向真实用户的配置启动
**When** 收到 `x-user-id`、测试验证码、测试 captcha token 或开发身份覆盖配置
**Then** 这些输入不能创建可信身份或越过认证，测试适配器只可在显式隔离的本地/测试环境和受控测试入口使用
**And** 生产配置包含测试身份/模拟验证时拒绝就绪或返回明确不可用，不因缺凭据自动降级成替身；普通客户端提供的环境、角色或设备字段均不能开启测试通道

### AC3 — 真实证明与回调验证

**Given** 用户提交验证码或返回已启用的第三方登录结果
**When** 服务端验证本次登录证明
**Then** 通过真实服务确认验证码/票据的有效性、用途、时效和绑定对象，按启用协议验证必要的回调来源、一次性关联、签名及接收方，并阻止过期、篡改与重放
**And** 已确认的 PNVS 图形认证只按已批准风险/重试策略触发且结果由服务端实际校验，非空 token 不代表通过；未完成验证不建立普通会话，回调目标只能恢复获准站内上下文

### AC4 — 稳定内部owner

**Given** 一个已验证登录身份已有可信的内部账号绑定
**When** 用户再次登录、换设备或经另一种已确认绑定的入口登录
**Then** 服务端解析到同一稳定 owner，行程、导入记录和授权仍绑定原账号；并发首次注册/回调不能制造同一身份对应多个 owner
**And** 显示名、客户端 user id、未经验证的手机号/email 相同不构成合并依据；两个已有数据账号不自动合并，本期不新增自助合并或解绑操作

### AC5 — 历史owner受控迁移

**Given** 当前历史数据使用旧 owner 标识且将迁移到生产身份映射
**When** 本 Story 执行已审查的迁移与兼容方案
**Then** 以可验证的旧数据归属和真实身份映射保存稳定引用，先给映射清单/冲突分类及恢复点，再验证原账号可读自己的历史数据且不能读取别人的数据
**And** 无可信归属、重复或冲突数据保留并隔离待核对，不因相同测试手机号、旧开发头或相似姓名自动归属，不清空数据、不重写 1.1–1.5 历史完成记录

### AC6 — 共享持久会话

**Given** 用户已经建立有效会话，服务发生重启、切换实例或并发验证
**When** 任一实例认证请求、读取到期时间或检查撤权状态
**Then** 通过共享持久或等价可验证的会话权威得到一致身份、过期与撤权结论，普通重启不丢失仍有效会话，已失效会话不会因旧缓存或另一实例重新有效
**And** 不以进程内 Map 作为生产会话权威；权威存储/验证不可用时返回真实可恢复认证失败，不接受任意身份或放行受保护数据

### AC7 — 多设备共存

**Given** 同一 owner 在设备 A 已登录，又在设备 B 完成真实登录
**When** 两台设备分别读取受保护数据、续期或更新各自会话
**Then** 两个独立有效会话正常共存，B 登录或续期不会自动撤销 A；各会话只接受自身有效凭据且登录成功后不能沿用攻击者预设会话身份
**And** 不以客户端 device id 作为认证证明、不新增单设备独占策略或设备管理页面，账号资料和私人缓存不在不同 owner 间复用

### AC8 — 普通退出仅当前会话

**Given** 用户在当前设备选择普通退出，且另一设备仍有同账号会话
**When** 退出请求被实际处理或出现响应丢失后恢复
**Then** 幂等撤销当前会话并清理当前客户端 cookie/私人缓存/迟到请求，其他设备保持有效；服务端持久撤销事实与前台退出显示一致，未知结果沿同次退出核实而非伪报成功
**And** 普通退出不删除账号/行程、不取消已受理后台任务、不触发所有设备退出；已有会话删除接口仍需校验 owner，不能依靠客户端目标 id 撤销他人会话

### AC9 — 账号资格与全会话撤权

**Given** 持久账号资格已变为停用、删除受理或已删除
**When** 任一设备、实例、刷新链路、受保护 SSE/下载或重新登录尝试继续使用普通账号权限
**Then** 统一认证立即遵守持久资格并使全部普通会话不可用，重启、旧 cookie、延迟回调或相同身份重新登录均不能绕过该屏障或隐式重建原账号
**And** 本 Story 交付并验证账号资格/全会话撤权基础与服务契约，使用受控持久状态 fixture 验收而不依赖未来 7.5 UI；7.5 后续承担原子删除受理、清理与受限状态回执，回执不能变成普通登录凭据

### AC10 — 私有资源与跨owner隔离

**Given** 已认证或未认证客户端访问既有行程、导入记录、私有媒体、任务与进度入口
**When** 携带有效、过期、伪造或其他 owner 的目标及会话
**Then** 统一身份检查与资源 owner 检查都生效，普通 API、SSE 重连和下载不因另一路径、过期缓存或猜测 ID 漏出私人数据
**And** 重新登录只恢复同 owner 的安全上下文；换账号清理私有状态并丢弃旧响应，不把被拒绝的目标切换到当前账号后继续执行或泄露其是否存在

### AC11 — Cookie、来源与CSRF

**Given** 当前宿主使用 cookie 会话认证或第三方重定向回调
**When** 配置 cookie、跨源读取、登录或执行有副作用的请求
**Then** 按真实部署同源/跨源模式设置 httpOnly、HTTPS secure、适用 SameSite/范围/期限，限制可信来源与凭据访问，并为 cookie 认证写入采用可验证的 CSRF/Origin 防护及适用的登录回调关联保护
**And** 不能把 CORS 配置、可预测请求字段或前台隐藏按钮作为唯一授权；令牌型调用只执行其适用的凭据/来源验证，不强套无关 cookie 流程；测试需含被拒绝的跨站及篡改回调路径；WebView、系统认证会话和原生网络不能假定共享 cookie，API/SSE/下载同服从持久会话权威，本地宿主来源不得放宽远程 HTTPS、CORS 或 CSRF

### AC12 — 真实失败与隐私

**Given** 真实短信、登录、行为验证或会话服务出现错误验证码、限流、超时、网络中断或凭据失效
**When** 用户发送、验证、重试或恢复登录
**Then** 分开呈现未发送、已发送、等待重试、验证失败与已登录状态，遵守服务端冷却/重试边界，成功发送或打开外部页面不等于登录成功；可恢复失败保留适用输入与返回路径
**And** 不默认放行、无限重试或将第三方失败报成空账号；手机号、OTP、captcha、完整身份票据、cookie、session secret 与原始私人上下文不进入日志/分析/错误正文，动态状态和输入符合既有可访问性要求

### AC13 — 最小桌面运营授权

**Given** 经真实身份验证的运营者或普通用户访问当前最小桌面 Web 运营入口
**When** 服务端判断查看或修改权限
**Then** 复用同一可信身份基础，由受控服务端授权记录/config 将稳定身份授予明确能力/作用范围，默认无运营权限，每次受保护读写均核对当前授权并在撤权后拒绝旧会话/缓存继续操作
**And** 普通登录、客户端角色字段或知道入口 URL 均不授予运营权；提供可审计的最小授权/撤销配置与否定测试，供地点纠错、品牌规则及 8.3–8.6 各自消费，不另建通用权限平台、移动运营页或等待 8.6 才能保护首个写入口

### AC14 — 完整关闭证据

**Given** Story 1.0 准备关闭并成为后续真实用户功能的认证基线
**When** 执行 OpenAPI/生成类型、迁移与真实 PostgreSQL、认证/身份映射/会话/API/移动与桌面入口测试、完整构建及交接检查，并在实际获准的环境核验真实登录方式/行为验证和服务失败
**Then** 提供有效/伪造身份、测试通道隔离、历史 owner 映射、跨重启/多实例、两设备共存、当前退出、全会话撤权、cookie/CSRF、SSE/私有下载越权及运营授权的独立证据，能够从现有首屏真实登录并读取该 owner 的既有数据
**And** 替身通过、配置存在或合成截图不能替代真实服务与浏览器证据；尚无授权账号/环境时明确列为对应实证未完成，不自行注册、采购或部署。新场景证据不改写历史 done；另提供 Android/iOS 实际安装候选的回调/恢复/退出/撤权/SSE/下载证据且网页回归通过，9.2 最终分发不是本 Story 前置；账号合并、自助解绑、设备中心及 7.5 清理全流程不在本 Story 范围

### AC15 — C01 App：App 凭据与会话恢复

**Given** 同一 owner 在网页、Android 与 iOS 拥有独立有效会话
**When** App 冷启动、被杀后恢复、续期、退出或收到账号资格撤销
**Then** API、SSE、私有下载和界面一致服从服务端持久会话权威；当前退出不撤销其他有效设备，账号撤权则阻止全部普通会话
**And** 原生凭据/缓存不会明文落入普通 Web 存储、URL 或日志，迟到响应不能复活旧会话或把 A 的操作提交为 B

### AC16 — C02 App：登录回调与跨宿主返回

**Given** 用户通过已启用的第三方方式开始登录，App 可能在运行或已终止
**When** 系统认证/供应商 SDK 返回成功、取消、重复、过期或篡改结果
**Then** 服务端验证一次性事务与协议适用证明后才建立会话，随后用当前 `/me` 核对身份并恢复获准的原上下文
**And** 拒绝任意返回 URL、跨 owner 延迟回调与重放；回到 App、SDK 成功标志或参数中有 user id 都不是登录证明

### AC17 — C03 App：PNVS 平台边界

**Given** 已登记 H5/Android/iOS 图形方案，当前实际使用的验证码模式明确
**When** 在两个 App 宿主完成短信/图形证明及错误、拒绝、超时流程
**Then** 所用平台配置、SDK/H5 运行模式和后端证明绑定一致，真实服务结果决定会话是否建立
**And** 不因运行在 App 就误用另一平台参数，不将私有服务端 appKey/云凭据打包到客户端，不采用异常放行；网页原流程同步回归

### AC18 — C04 App：U-App 首次真实消费

**Given** 原生统计初始化已满足适用隐私选择且平台 AppKey 正确，或用户拒绝/撤回采集
**When** 执行首次打开、升级后打开、注册、登录、恢复和换账号
**Then** 获准事件可在真实 U-App 环境查询，首次访问/激活/注册/登录分母与去重明确，标识受控绑定稳定 owner 并在退出/换账号正确切断
**And** 拒绝/撤回与 SDK 故障不破坏登录，JS 和 native 不重复上报，未查询到真实事件不得用 wrapper 日志宣称接通


### UI01 — 登录与退出的共享组件回归

**Given** 登录字段、协议入口或当前会话退出确认迁移到Nomad共享组件
**When** 使用网页和支持App执行错误输入、身份重新确认、未知退出结果、键盘/读屏及返回
**Then** 等权入口、真实协议、会话/operation/撤权结果保持，私有页面与portal同步遮蔽，焦点与草稿按原合同恢复
**And** 组件关闭或默认事件不触发重复登录/退出，不把旧浏览器或旧16.0证据当成新依赖验收

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

任务按实际证据逐项勾选，不从历史1.1/1.2继承；当前已实施部分见story-1-0-dev-progress-2026-09-19.md，未勾选不否定已记录的局部进展，也不表示整个任务已关闭。

- [ ] T0 固定实际能力、运行环境与身份边界（AC1–3、11–14；FR14 / login-attribution）
  - [x] 写出脱敏的宿主/方式/供应商矩阵：移动Web、安装PWA、桌面、微信内网页及本期Android/iOS Capacitor宿主分别登记；未核验资源写待核验，不断言不存在。
  - [x] 依据2026-09-18用户资源说明固定PNVS短信认证＋图形H5主路径，复用已有云资源和Nomad账号目录；服务器先homelab，按需frp。选型及配置存在性已记录，真实权益/验票单列核验，不以AK存在推导服务可用。
  - [ ] 核验PNVS短信系统签名/模板、图形H5 appId/appKey、友盟平台注册类型/宿主与事件入口、homelab目标及HTTPS/可信Origin；适用Apple/微信路径按已批准启用方式核验。9月19签名/模板/三端图形/双端U-App配置齐备、VM104健康；实际宿主事件与HTTPS/供应商联调仍需证据。仅登记受控配置引用，不把密钥/真实号码放入Git或日志。
  - [ ] 本地开发/合成CI与面向真实用户的运行模式明确分离；真实环境缺配置、误加载测试认证或内存会话时拒绝就绪/明确不可用。

- [ ] T1 OpenAPI与错误合同先行（AC1–3、6、8–13）
  - [ ] 复用 `/auth/config`、`/auth/otp/start`、`/auth/otp/verify`、`/me`、`/sessions`、`/sessions/{id}`、`POST /logout`；定义真实证明、登录事务及适用第三方start/callback合同，再生成类型。
  - [ ] `enabled_methods`对应实际批准且可工作的配置；配置存在、按钮可见和验证成功分开，禁用原因保持真实，不通过隐藏本期必需能力抹除验收缺口。
  - [ ] 安全会话引用与认证secret分开，`/me`和会话列表只返回公开元数据；旧 `otp/code`、设备字段的兼容规则写明。修正同时提供otp/code时OpenAPI oneOf与实现不一致，避免隐式改变旧客户端。
  - [ ] 给所有实际私有入口补齐security/owner/资格与401/403/404/429/503、no-store、CSRF/Origin合同；未实现的 `/auth/bind/apple`、`/auth/bind/wechat`不能算已接通，也不借此开放账号合并/自助绑定解绑。
  - [ ] 继续使用现有error envelope与NodeNext `.js`导入；只生成 `packages/types/src/api-types.ts`，不手改生成代码。

- [ ] T2 扩展现有认证持久模型与受控恢复（AC4–9、13；DB-CHANGE-01）
  - [ ] 扩展已经存在的 `User / OAuthIdentity / Session`，复用Prisma与PostgreSQL，不另造并行User/Session表或独立认证服务。
  - [ ] User增加持久账号资格及适用版本屏障；OAuthIdentity明确可信provider/issuer/tenant/client命名空间与subject唯一性；共享登录事务记录过期、用途、一次性消费和重放边界。
  - [ ] Session保留公开UUID引用，另存高熵随机credential的不可逆摘要、到期与撤销状态；设备标识只是元数据，不能证明身份，不设置单设备独占。
  - [ ] 明确固定到期/必要续期策略；若提供续期或secret旋转，加入代际/预期版本和并发保护，旧刷新不得复活已撤销会话。
  - [ ] 首次身份绑定、账号资格检查和创建会话由数据库约束/事务保证；外部短信/验证码/OIDC调用不放进可能自动重跑的DB事务。
  - [ ] 保留最小停用/删除身份屏障，避免级联删除或旧备份恢复后普通登录自动重建旧owner；7.5的实际删除受理/清理/明确重新注册仍属后续Story。
  - [ ] 创建新migration及恢复记录，覆盖正向、兼容读写、前向修复或备份恢复；不改写旧迁移、不用 `db:push --accept-data-loss` / reset / 清空数据代替验证。

- [ ] T3 历史owner迁移与任务兼容（AC4–5、9–10；OPS-01 / DB-CHANGE-01）
  - [ ] 先形成只含获准数据的干跑清单：可信旧外部actor→既有数据库User.id→真实身份绑定、无可信归属、重复/冲突、孤儿引用、旧活跃任务分别分类。
  - [ ] 旧链是手机号派生 `u_*` 再由 `dbUserIdFor` hash为UUID；不能把新UUID直接交给旧函数再次hash，也不能仅凭测试手机号/旧header认领历史数据。
  - [ ] 优先保留可信既有 `User.id`、业务外键和已发布版本。统一可信owner解析，禁止ingest/planner业务入口绕过认证继续自行upsert/INSERT User。
  - [ ] 同步处理 `sourceHashFor(userId,url)` 去重、owner缓存键、PlanJob/HqJob `external_user_id`及重启恢复消费；新旧身份不重复创建导入，不丢弃任务或改写已发布行程。
  - [ ] 无可信证明的数据保留隔离待核对；真实映射/回填前有适用恢复点、演练、授权与冲突处理。开发Map会话不升级成可信生产会话。

- [ ] T4 真实证明适配与受限调用（AC1–4、11–12）
  - [ ] 手机号证明由实际供应商验证，绑定规范化手机号、用途、当前挑战/事务和有效期；共享冷却/尝试上限覆盖并发、重试与实例切换。发送未知不显示已发送，发送成功不表示登录成功。
  - [ ] PNVS图形H5按真实方案服务端二次验证，appKey只在后端；最小短期关联lot_number/captcha_output/pass_token/gen_time与一次性业务挑战。仅服务端成功结果才继续，超时/异常必须失败，不采用官方示例的异常放行分支，也不把前端回调/非空token当作通过。
  - [ ] 已批准社会化登录采用真实后端交换与维护中的协议实现；固定issuer/client/redirect允许集，校验签名、iss/aud/exp、适用nonce/PKCE/state及一次性关联，拒绝mix-up、重放与任意外跳。
  - [ ] 不通过相同email/手机号字段匹配自动合并已有数据账号；检查身份供应商自己的自动关联策略，避免在上游破坏产品边界。
  - [ ] 配置有界超时、响应/schema检查、实际尝试计量与typed失败；一次性ticket/code不得因笼统自动重试被重复交换。所有真实调用另按实际获准环境/账号/次数执行。

- [ ] T5 统一认证、资格和全部现存入口（AC2、6、9–13）
  - [ ] auth plugin只接受可信会话/实际支持的认证证明，生产忽略或拒绝 `x-user-id`、测试OTP/captcha和客户端角色/环境覆盖；测试身份仅通过隔离依赖注入/受控fixture获得。
  - [ ] 原User/Session/OAuthIdentity成为共享权威；数据库不可用返回真实可恢复认证失败。每次资源读写继续核验owner与当前资格，不能以首次登录时的role或缓存决定后续访问。
  - [ ] 覆盖Home、Library、Search、ingest canonical/legacy、所有Plan/HQ/edit/undo、BYOK兼容、account、feedback及全部SSE路径；逐路径登记认证、owner、资格、CSRF与测试。
  - [ ] 特别封住 `POST /plan/ai-fill`、`GET /sse/fill/:runId`、`POST /export/png`：先有真实资源→owner关联再受理/读取；仍是占位能力时诚实unavailable，不为满足此项实施5.x全功能或让任意runId产生模拟写入。
  - [ ] 活动SSE在初始回放、后续读取/事件发送及重连中遵守撤权；关闭时清订阅/计时器，保留现有Plan cursor/attempt/heartbeat与终态行为。共享撤权通知可加速但不替代持久资格。
  - [ ] 已受理任务与浏览器Session生命周期分离：当前logout不取消Job；账号资格屏障则在现有worker提交/发布点生效，迟到任务不能重新发布或创建已停用owner。
  - [ ] 当前没有完整私有媒体下载实现时，提供可复用授权边界和受控fixture，并标明未来1.9/5.x/7.4的实际下载验收责任；不捏造不存在端点已验收。既有合法离线副本不承诺远程擦除。

- [ ] T6 Cookie、来源与当前退出（AC6–12）
  - [ ] 按真实同源/跨源部署固定cookie Secure/HttpOnly/SameSite/Path/期限及清除参数；CORS使用明确可信origin。写请求采用适用CSRF/Origin验证，第三方callback单独执行交易关联验证。
  - [ ] 不将客户端Host/Forwarded/UserIp当可信配置；反代只信任明确地址/CIDR/验证函数，限制直达origin。认证限流不只依赖可变设备头，服务端策略复用现有目标并实测并发共享。
  - [ ] 复用 `POST /logout` 完成同一次当前会话的持久幂等撤销，确认后报告成功；响应丢失时核实原操作，不能用“cookie清掉了”证明服务端已撤销。
  - [ ] 当前会话退出与账户全会话停用分开；B设备继续有效，不调用含糊的供应商global logout代替A设备退出。存在的指定session撤销继续校验owner。
  - [ ] 测试旧请求/续期/回调迟到与退出/换账号竞争，保证旧响应不会重新设置有效旧权限或回填另一owner私人状态。

- [ ] T7 移动登录与最小桌面授权使用路径（AC1、7–8、10–14）
  - [ ] 复用现有LoginScreen/配置驱动等权入口、协议链接、冷却/错误和先 `/me` 确认的流程；接通实际captcha与本期获准第三方跳转/返回，App消费9.1共用宿主，不在1.0重建第二套壳。
  - [ ] App认证状态区分恢复中、已认证、已退出与权威暂不可用；认证代际/owner隔离使Home/Planner/Settings、活动SSE、缓存和迟到响应在退出/换账号时一致清理。
  - [ ] 同一浏览器标签页共享cookie，不能只在单个React实例维护代际。覆盖跨tab退出/换账号的失效传播，以及pageshow/bfcache/回前台的身份重核；未核实前遮蔽旧私有视图并暂停写入。请求携带与发起页面绑定的预期owner/session上下文，由服务端在真实认证后校验一致性；客户端预期值不是认证凭据，不能把旧A草稿/重试自动提交为B的新导入或账号操作。
  - [ ] 在现有账号区域补最小当前退出确认/取消/进行中/未知结果恢复与App回调；复用共用请求边界落实CSRF和认证失败，不重做7.3全部设置业务。
  - [ ] 通过服务端受控DB/config为稳定身份授予最小capability/scope，默认无权；有版本/撤销/审计，普通请求不得授予自己role。最小桌面入口只验证真实身份/授权读写边界，后续纠错/品牌规则/8.x页仍由各自Story交付。
  - [ ] 覆盖手机和桌面浏览器、键盘/焦点/读屏、44pt目标、120–200ms与reduced-motion、长错误/网络丢失/返回上下文；旧wireframe或开发HTTP200不是这些实证。

- [ ] T8 `login-attribution` 首次消费闭环（FR14、NFR6；AC1、10–12、14）
  - [ ] 将登录入口、真实首次打开/注册/登录/恢复、匿名到稳定owner的受控关联写为版本化字典，区分浏览器首次访问、PWA安装与原生激活，不混分母；参数不是认证证明。
  - [ ] 在实际适用宿主核验U-Link接收端与U-App事件/查询能力。H5唤起App不等于纯PWA完整归因；若需U-Web/U-Mini或新宿主，提交具体差异进入已有范围决定，不能自行替换/延期FR14；消费已批准的9.1 Capacitor宿主，三端真实能力分别验收。
  - [ ] 复用analytics wrapper，改为有界、值级allowlist与安全传输；敏感字符串/嵌套对象/URL不得由安全key名绕过，未同意/撤回、退出/换owner的标识和迟到投递按实际策略隔离。
  - [ ] 初始化与上报失败不影响登录事实；禁用自动表单/URL/私人请求捕获，Noop只能用于隔离测试。供应商接受、实际可查询、缺失/采样/失败分别记录。
  - [ ] 提供真实已授权事件/归因可查询证据、版本/窗口/有效样本N、去重与失败记录；未核验服务保持未验收。1.6补输入/深链，8.1汇总，均不替代本次首次消费。

- [ ] T9 工程条件与测量（AC5–6、9、12、14；详细分阶段规则见下表）
  - [ ] OPS-01：确认数据库/备份/现存数据现状；准备每日全量+15分钟增量/PITR与隔离新实例恢复方案，实际授权后验证链/时间点/引用/身份/任务与撤权屏障；不删除旧备份或把配置频率当实测RPO。
  - [ ] DB-CHANGE-01：每次schema/索引/回填均绑定migration ID、代码/数据库版本、兼容窗口、适用恢复路径和数据不变量；实际隔离PG证明后才能关闭该次条件。
  - [ ] METRICS-01：1.0创建WL-AUTH及公共测量manifest/本地报告命令；分开发送、真实验证、会话/资格读取、进入受保护首页、退出恢复，记录失败/未结束/样本N/版本/窗口。
  - [ ] METRICS-02：真实用户开放前，以实际staging基线提交同口径目标和体验/费用取舍，供yimeng-tong决定；不等待8.1全UI，不预填猜测的毫秒/成功率。
  - [ ] METRICS-03：保留认证/owner/资格的确定性规则fixture与反例供8.2汇总；本Story不引入LLM评测或真实人评平台。未触发的模型/提示评测分支说明适用性，不宣称全局METRICS-03已完成。

- [ ] T10 测试、CI与真实关闭证据（AC1–14）
  - [ ] 保留历史领域断言，替换各contract probe与synthetic/SSE脚本的公共 `X-User-Id` 依赖；隔离环境通过受控会话fixture，真实环境用实际获准身份，生产不能为测试重新开后门。
  - [ ] 认证probe及真实PG多实例/重启测试接入CI；迁移先于依赖新schema的测试。测试真正的bootstrap/路由注册，而非只用简化插件组合证明生产配置安全。
  - [ ] 核验实际Node minor与Vite8要求，按项目Node22约定固定CI运行时；不把“CI写20”直接判为已失败。认证改动涉及的Fastify安全补丁按下文定向更新/锁定并回归，不盲升Prisma/整个前端栈。
  - [ ] 浏览器增加共享cookie双标签页场景：A页保留草稿/操作时，另一页退出A并登录B；旧页从后台或bfcache恢复、尝试写入及收到迟到响应，均不得展示A私有数据或将A动作作为B执行。通知丢失时仍由重新核验与服务端上下文一致性检查拒绝，恢复同owner路径另测。
  - [ ] 运行下述生成、聚焦测试、构建与handoff；完成对应真实服务/PG/恢复/浏览器和最小运营授权证据后再进入review/done。任何未满足项如实保留未勾选。

- [ ] T11 Capacitor App 增量验收（AC15–18；FR52/NFR25；APP-HOST-01；login-attribution）
  - [ ] T0扩展Web/Android/iOS真实资源与PNVS平台矩阵，记录供应商SDK/H5-in-WebView及回调方式，不把Key存在当真实接通。
  - [ ] T6形成Native Session/Transport ADR，验证安全存储、精确origin/HTTPS与API/SSE/下载/撤权一致；Web cookie/CSRF及跨tab/bfcache原断言保留。
  - [ ] T7消费9.1宿主，完成冷暖启动登录回调、取消/重放/迟到身份、前后台/杀进程与当前退出的双端实际验证。
  - [ ] T8完成U-App/U-Link平台/许可/隐私选择与真实查询，分清三端分母、去重、撤回和换账号标识；未接通的纯网页统计不得因App可用而标完成。
  - [ ] T10提交Android/iOS安装候选的实际设备/构建/权限/认证失败证据，运行Web回归；9.2最终分发不作为本Story循环前置。

### Review Follow-ups (AI, 2026-09-19 认证核心限定审阅)

本节来自现有Nomad Sprint Planning任务已完成的三层核心审阅；不是整张Story完成。实现/复验详情以[当前开发记录](story-1-0-dev-progress-2026-09-19.md)为准；六项均有本轮实现与PG/HTTP/适配器回归证据，已关闭限定审阅行动项；完整Story仍未验收。

- [x] 撤权调用者在事务内重新核验身份/资格。
- [x] 登录binding续期保持合法恢复与到期边界。
- [x] 图形验票预算改为共享权威，覆盖跨实例并发。
- [x] 发送reserved状态在崩溃后可按真实结果恢复。
- [x] 明确供应商拒发分类，未知发送不等于失败重发。
- [x] Cookie响应逆序保护，旧响应不能覆盖新会话代际。



### UI范围增量任务（2026-09-20）

- [ ] UI-SCOPE-1.0：落实2026-09-20新增条件/义务，保留原已完成实现与真实资源门槛。
  - [ ] CODE-QUALITY-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-COMPONENT-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-WORKBENCH-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] UI-BROWSER-01：执行本Story适用检查/记录适用性及当前证据，不继承其他Story的verified。
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；证据：当前源码组件/浏览器/适用原生证据，逐Story关闭。

### Review Findings — WL-AUTH独立切片（2026-09-26）

- [x] [Review][Patch] AM1：以同一截止端点比较窗口，避免浮点加减拒绝合法250ms运行。[packages/types/src/measurement-common.ts]
- [x] [Review][Patch] AM2：终结样本重新核对真实单调截止；到期后不得把成功裁回窗口内，或继续发API请求/挂载App。[apps/mobile/scripts/auth-measurement-harness.tsx]
- [x] [Review][Patch] AM3：服务所有权探测覆盖连接和body读取的有界超时，不挂起在占用端口。[scripts/measurements/run-auth.mts]
- [x] [Review][Patch] AM4：manifest和sample的clock UUID版本约束一致。[packages/types/src/auth-measurements.ts]
- [x] [Review][Patch] AM5：冲突身份先隔离，整体/分场景缺失、额外与重复计数不依赖输入顺序。[packages/types/src/auth-measurements.ts]
- [x] [Review][Patch] AM6：阶段缺失按各预期场景计数，其他场景额外事件不能抵消。[packages/types/src/auth-measurements.ts]
- [x] [Review][Patch] AM7：首页成功终点必须真实可见，保留的hidden私有DOM不计成功。[scripts/measurements/run-auth.mts]
- [x] [Review][Patch] AM8：场景准备、运行、截止和完整性失败均保留已采样数据/缺失报告，再非零退出。[scripts/measurements/run-auth.mts]
- [x] [Review][Patch] AM9：源码复核不可读时先保存安全样本，失败报告明确sourceReadable=false，不能因再次hash而丢失结果。[scripts/measurements/run-auth.mts]

## Dev Notes

### 实施顺序与范围

顺序为：实际能力/证明接口 → OpenAPI → 现有身份/会话模型扩展与恢复预案 → 单一owner解析和兼容迁移 → 认证/资格/来源/活动流 → 登录/退出/最小运营路径 → 归因/指标 → 真实证据。代码与合成fixture可以先行；外部账号/环境尚未核验不阻止准备，但阻止把相应真实能力标完成。

1.0是首个新增执行准备，复用已交付1.1/1.2及领域能力；其18组现行GWT不依赖未来7.5清理页。1.6–1.11新增导入、完整1.7重放、3.1分钟编辑迁移、7.3完整设置、7.4副本、7.5删除清理、8.x运营页面均不混入本Story。关闭现有裸入口是本Story安全责任；未实现的fill/export只诚实受限，不在此补齐5.x。

### 现状 / 改变 / 保留

后端逐路径及完整读取清单见 [后端核验](research/story-1-0-backend-context-2026-09-17.md)。以下表格保留2026-09-17准备时的工作树分析；2026-09-19最新实现与验证见独立dev-progress记录，不据此重做或覆盖已完成改动：

| 文件 | 当前状态与需改变部分 | 必须保留 |
| --- | --- | --- |
| `apps/server/src/auth/session-store.ts` | Map OTP/Session、固定验证码、手机号派生u_*；公开session.id同时是cookie secret | 冷却、过期拒绝、一次性校验意图、多会话并存和owner限定撤销 |
| `apps/server/src/plugins/auth.ts` | 无sid时接受x-user-id；没有持久资格/运营能力 | 无效sid不回退开发头；统一错误包和资源层owner复核 |
| `apps/server/src/routes/auth.ts` | 测试captcha、配置即启用、公开secret会话DTO、已有POST/logout | 原手机流程、协议链接、429冷却、当前会话退出及兼容字段的明确迁移 |
| `packages/prisma/schema.prisma` | 已有User/OAuthIdentity/Session，但认证未消费；需资格、secret摘要、撤销及可信身份范围 | User主键、业务FK、已有Prisma历史；禁止再建同义表 |
| `apps/server/src/ingest/store.ts` | dbUserIdFor会对UUID再次hash；sourceHash依赖外部userId；入口自动建User | owner隔离、同owner去重、404隐藏存在性和旧数据引用 |
| `apps/server/src/planner/{source,prisma-repository,service}.ts` | 外部actor再hash，PlanJob/HqJob保存external_user_id并用于恢复 | 已有事务、幂等、rev/fencing、不可变版本、EditEvent/undo和恢复语义 |
| `apps/server/src/routes/{home,library,search,ingest,plan,account,byok,feedback}.ts` | 已有guard/owner大多有效但依赖不可信认证；活动SSE未持续撤权 | 路由别名、领域错误/DTO、cursor/heartbeat与当前logout不取消已受理任务 |
| `apps/server/src/index.ts` | CORS反射origin、无显式日志redaction；fill/export有裸/模拟入口 | 现有服务框架与注册顺序；保留真实领域路由，不启动新的5.x功能 |
| `apps/mobile/src/auth/{api,LoginScreen,analytics,device}.ts*` | credentials include与登录交互已在；第三方提示未开放、DEV captcha、默认noop | 入口等权/顺序、协议可达、可恢复输入、44pt、先/me确认成功；device仅风险信号 |
| `apps/mobile/src/App.tsx` | 只在挂载读/me；无统一退出/账号切换代际 | 现有Home/Settings/Planner路由和合法同owner上下文 |
| `apps/mobile/src/{home,planner,settings}/api.ts` | 各有请求函数；Planner有credentials SSE | 生成类型、错误形状、typed幂等/revision请求；复用小型共用传输层，不引入新状态框架 |
| `apps/mobile/src/settings/SettingsScreen.tsx` | 有账号区但未接当前logout；其它旧设置语义仍待7.3整理 | 仅补本Story的退出/资格基础；不把原有BYOK/排队删除壳视为当前MVP完成 |
| `docs/api/openapi.yaml` / `apps/server/src/schemas.ts` | 一部分私有路由缺security声明，绑定路径仅在OpenAPI | OpenAPI SSOT；生成types，保留明确版本化兼容和标准错误 |
| probes、synthetic、SSE、`.github/workflows/ci.yml` | 领域脚本依赖X-User-Id，CI缺ci:auth；真实脚本会产生任务/写入 | 已有领域负向与数据库验证价值；不能用测试重开生产旁路 |

`error-envelope.ts`装饰Reply，index内同名helper装饰Fastify实例，二者不是已证实重复装饰启动故障；实施继续复用正确的 `reply.sendError` 签名并测试实际bootstrap。

### 推荐复用结构

- 后端新模块如确需拆分，放在现有 `apps/server/src/auth/`：repository/Prisma实现、证明适配器、登录事务、资格/运营能力服务及隔离testing fixture。遵循现有Planner repository模式，不另起框架。
- User.id作为内部稳定owner；上游可信身份映射到它。不要依赖User.phone唯一字段推断旧数据可信，不把显示名/设备/归因click ID作为身份。
- 保留现有Session表的公开UUID，新增credential摘要；cookie secret与上游票据不返回JSON/日志/分析。正常到期与存储不可用分别处理，浏览器时钟不能裁定资格。
- 为当前会话、全账号资格和运营grant分别设计撤销边界；在受理、私有读取、事务提交/发布及活动流中测试资格竞态。通知/缓存只加速，不覆盖持久权威。
- 所有NEW文件和命令必须实际创建后才在验证报告写“已运行”。共享请求模块可以小规模抽取，CSS仅在实际新状态需要时修改并补浏览器证据。

### 供应商与版本研究的实施约束

完整官方来源、版本快照、能力/未知项见 [供应商研究](research/story-1-0-provider-research-2026-09-17.md)，查阅日期2026-09-17。主代理另核验了Apple、Authing Apple Web、腾讯验票返回码、友盟产品/FAQ，以及下述框架来源。

- Authing可作为主候选，但本轮没有选定/开通真实租户。极光有Web SDK，运营商能力有网络/宿主条件；桌面和Wi-Fi不能被一键取号路径卡死。SDK版本只是研究快照：Authing Node 4.0.2（v3 API）、openid-client 6.8.8、captcha专用SDK 4.1.191；采用前锁定、验证Node/ESM/API形状，按实际需要选用而非全部安装。
- Apple官方Web配置说明关联已启用Apple登录的既有App等资源；Authing代理不消除上游前置。本轮没有查项目资产，不能断言已有或缺失。适用方式缺证据时不隐藏入口结案，不创建原生App。参见[Apple环境配置](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)。
- Apple直接form_post与经Authing再跳转的关联链不同；在真实链测试state/nonce/PKCE和cookie，不把全部会话cookie无条件放宽。协议验证优先维护中的[openid-client](https://github.com/panva/openid-client)等适用实现，不手写“decode即验签”。
- 腾讯服务端验票通过码是CaptchaCode=1；ret=0/trerror或HTTP成功不等价。Ticket消费、发送未知与重试要分开；AppSecretKey及云API密钥只在后端。参见[腾讯返回码处理](https://cloud.tencent.com/document/product/1110/84005)。
- [U-Link官方定位](https://www.umeng.com/ulink)包含H5到App唤起/安装，[U-App H5 FAQ](https://devs.umeng.com/docs/119267/detail/121481)含桥接与旧JS资料；当前纯Web/PWA闭环仍需实证。不能把独立U-Web或H5统计产品自动改名为U-App。
- 仓库锁文件实际是Fastify5.8.5、cookie11.0.2、cors10.1.0、Prisma5.22.0、TypeScript5.9.3、React19.2.7、Vite8.0.16、Vitest4.1.9；WSL当前Node22.22.1。范围声明与锁定版本不同，以实际lockfile为基线。
- Fastify官方[GHSA-3m5p-2c4r-xxw2](https://github.com/fastify/fastify/security/advisories/GHSA-3m5p-2c4r-xxw2)涉及numeric trustProxy，影响范围含5.8.5，5.12.1修复。当前index没有启用该选项，不能宣称已证明可被利用。1.0引入生产代理/来源策略前，定向评估并更新到已修补的5.x版本、锁定和回归；禁止数值hop/无限制代理信任及任意Host派生回调。
- [fastify-cookie](https://github.com/fastify/fastify-cookie)的cookie属性需显式配置；插件存在不是撤权或CSRF实现。Prisma当前官网部分指南已改为新主版本流程；本项目继续使用5.22的迁移工具，不能复制 `prisma@latest` / 新版migration API或顺手全栈升级。

### 工程条件：Story关闭与生产开放分开

| 条件 | 1.0当前任务和证据 | 时点与责任 |
| --- | --- | --- |
| OPS-01 | 现状/备份/PITR、链完整性、隔离新实例恢复、owner/资格/Job/版本引用；保留旧源库与备份 | 首个真实用户生产数据开放前。Codex交付、分离步骤复核；资源/操作按实际授权。与本地认证开发可并行，不让1.0形成自依赖 |
| DB-CHANGE-01 | 迁移ID/版本/兼容/锁与回填评估、可逆/前向/PITR主路径、隔离PG不变量 | 首次共享环境执行前准备、生产应用前实证。Codex负责本次改变，不以旧迁移通过豁免 |
| METRICS-01 | WL-AUTH、版本/workload/hash/N/窗口、各阶段起止、失败/超时/未结束/重试/未知成本、可运行本地报告 | 本Story建立公共合同；确定性检查与真实服务基线分开。Codex首次接入，8.1后续汇总 |
| METRICS-02 | 同口径实际基线→目标/体验费用取舍→发布候选结果 | 本能力面向真实用户开放前定版。Codex整理，yimeng-tong据实确认；不等8.1全部UI |
| METRICS-03 | 认证安全/身份/会话/资格确定性fixture及反例 | 1.0保留可复用规则。实际模型/提示评测非本Story触发；8.2将来统一执行/人评，不在1.0部署评测平台或声明全局关闭 |

测量按能力/模式/版本分层，以nearest-rank计算P50/P95，N=0不写0或100%，不平均P95，失败不从分母消失。条件进展写入Sprint的 `condition_progress[本Story][条件ID]`；verified/not-applicable必须有scope summary和实际证据路径。本轮均尚未实施。完整规则见 [实施前置](../planning-artifacts/implementation-prerequisites-2026-09-15.md)。

### 测试与验收矩阵

| 对应AC | 必需场景与真实证据 |
| --- | --- |
| 1–3、12 | 真实短信/启用方式、错误/过期/重放/并发证明、腾讯前后端结果差异、冷却/发送未知；生产测试通道启动拒绝 |
| 4–5 | 已绑定身份同owner、不同issuer/租户/同email不合并、可信旧映射读回、无可信/冲突保留；sourceHash/旧Job/HQ恢复与owner转换 |
| 6–9 | 真实PG、至少两服务实例及重启、两设备会话、当前退出丢响应/重复、资格变更与登录/续期竞争、权威不可用fail closed |
| 10–11 | 路由注册清单全部私有端点、跨owner404/403、活动SSE撤权、旧缓存/迟到响应、共享cookie双tab与bfcache/回前台、预期身份上下文不一致拒绝、cookie/Origin/CSRF、callback tamper/mix-up；未来端点与现存入口分开 |
| 12–13 | 所有出口哨兵秘密/私人值检查；合法运营者/普通用户/伪角色/撤权/错误scope；实际桌面路径与键盘/焦点 |
| 14与login-attribution | 手机/桌面真实浏览器、网络/失败恢复、实际归因查询/隐私选择与账号切换、版本/窗口/N和服务回执；mock与历史截图不能替代 |

实施时的现有命令（本次create-story没有执行这些业务验收）：

```bash
pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-server exec tsc -p tsconfig.json --noEmit
pnpm -F nomad-server run test:auth
pnpm -F nomad-server run test:ingest
pnpm -F nomad-server run test:home-library
pnpm -F nomad-server run test:planner-domain
pnpm -F nomad-server run test:planner
pnpm -F nomad-server run test:settings
pnpm -F nomad-mobile test
pnpm -r build
pnpm run ci:handoff
git diff --check
```

需要新建并接入CI的真实PG认证/双实例/重启测试命令必须在实现后登记；当前没有该脚本，不能给出虚构通过记录。`ci:probe`/`ci:sse`会创建任务和写入，只能在明确目标、隔离/授权身份与服务范围内运行；现存placeholder检查不能作为新能力证据。

### UX与原型引用

- [登录线框](../../docs/ux/mobile-ia.md#31-login)、[当前UX规范](../../docs/front-end-spec.md)与[登录实施证据要求](../../docs/ux/prototype-coverage.md)。若章节锚随文档变化，以文件内Story1.0说明为准。
- 复用 [历史1.2首屏](1-2-mobile-login-first-screen.md) 和 `apps/mobile/src/auth/LoginScreen.tsx`，不是重新创建移动包或宣称旧截图已验证真实登录。
- 本次未发现专用1.0生产登录PNG；回调、发送未知、两设备/撤权、不可用服务与运营授权在实际实现时补浏览器证据。源码wireframe与合成图仅定义参考布局。
- 用户可见文案聚焦登录、退出、真实结果与恢复；不展示JWT、数据库owner映射、内部角色调试或供应商密钥。正常退出不暗示删行程/全设备退出。

### 历史经验与Git

历史1.1/1.2允许替身与noop，已明确不含生产集成，done保持。1.0将这些边界提升为真实权威，不再把该历史豁免当关闭证据。当前没有更早的同编号1.0，复用信息来自这些实际前身，而非凭数字寻找不存在的0.x。

当前上下文HEAD为 `7250a8a131a370698bff53538a4405c2ddb94c1c`。`534581c`的owner/revision/EditEvent/undo成果及`10f940c`的真实PG列映射修复必须回归；后者证明内存repo绿色不能替代raw SQL/Prisma实证。本次只准备文档，不切换/重写旧3.1继承分支或提交未授权代码。

### References

- [正式Epics：Story1.0](../planning-artifacts/epics.md#story-10-生产登录与多设备会话补齐)；Epic1其余11张只作分工/复用上下文。
- [PRD](../../docs/prd.md)：FR1、FR12、FR14–FR16，账号/统一输入/数据与归因必须项。
- [交付映射](sprint-delivery-contract-2026-09-17.yaml)：`source_obligations.login-attribution`与本Story绑定；[迁移清单](sprint-migration-2026-09-15.yaml)只保留历史事实。
- [架构入口](../../docs/architecture/index.md)、backend/frontend/data-models/rest-api-spec/testing-strategy/observability当前分片；[分析合同](../../docs/ops/analytics.md)。
- [历史1.1](1-1-login-session-and-compliance-contract.md)、[历史1.2](1-2-mobile-login-first-screen.md)；[后端事实核验](research/story-1-0-backend-context-2026-09-17.md)与[官方供应商研究](research/story-1-0-provider-research-2026-09-17.md)。
- `_bmad-output/project-context.md`、`AGENTS.md`与 `CURRENT.md`。旧日期报告不是当前实施完成证明。

## Dev Agent Record

### Agent Model Used

GPT-6 Astra（当前任务配置）；create-story阶段使用两个独立分析子代理并由主代理复核关键代码/官方证据。

### Implementation Plan

- 用户2026-09-17要求“继续下一条”，按当前交接进入1.0 dev-story；授权本地实现与必要隔离合成验证，真实外发/账号/采购/部署/既有数据变更另按具体范围处理。
- 在codex/story-1-0-production-auth从当前HEAD开始，保留旧2.2分支和全部未提交输入；按T0环境/能力边界先行，采用红绿重构并逐项保留实证缺口。

### Debug Log References

- 2026-09-17：解析create-story customization；无前置/后置定制步骤，中文依据当前用户与project-context，目标明确为1.0。
- 2026-09-17：本地完整Epic1、当前交付/工程条件、认证/移动/数据/测试上下文与官方资料分析；真实服务、部署和数据操作均未执行。
- 2026-09-17：独立fresh-context审阅通过；发现的跨标签页账号切换P2已补齐并复核，开放P1/P2均为0。
- 2026-09-17：14组源GWT逐字比对、引用与绑定检查、当前handoff和43项检查器回归通过。详见同名validation记录；未运行业务验收。
- 2026-09-18：25项配置测试、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run ci:handoff`与`git diff --check`通过；私有值排除及0600/Git忽略检查通过。实际预检按预期拒绝3项PNVS缺失字段；未改交接检查器、未将本地证据计入真实服务验收。
- 2026-09-19：27项配置测试、server no-emit、`pnpm run ci:handoff`、`git diff --check`及私有值/权限检查通过；实际配置预检成功。PVE/Guest Agent健康及跳板SSH成功；证据记录未包含密钥值，原SP授权快照未改写。

### T0 Current Progress

- PNVS短信认证＋图形H5配置组件现有27项测试通过，明确拒绝当前Web/PWA误选native图形方案，并分别登记Android/iOS U-App资源；组件仍未接入业务启动/路由，生产认证未由此修复。
- 9月19实际预检退出码0；用户提供的图形三端密钥、双端U-App、签名「恒创联众」和模板100001已按用途私有配置，原三个字段缺项解除。配置存在、平台已说明与真实认证/统计成功保持区分；「暂停使用」复制文字不直接解释为停用。
- 依据用户homelab复用/创建授权，核实PVE容量并启动既有VM104；Guest Agent服务/本机健康及PVE跳板SSH通过。当前来宾仍运行历史10f940c49e2d，未部署当前代码、未迁移/清理既有数据。OPS-01只推进环境预检。
- 当前证据：`_bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md`；9月17/18报告保留历史。资源缺项暂停解除，继续T0运行模式与宿主/HTTPS接入，不重复索取已给资源；T0整项、真实证明和后续任务未关闭。公有云发布等待整体开发测试完成。

### Completion Notes List

- 2026-09-26：1.0 T9独立WL-AUTH本地代码/反例与9项三层CR修补已复核；T7验证码错误提示补齐，真实provider/SDK/native仍未关闭。当前提交完整CI待验证，证据见story-1-0-auth-measurement-progress-2026-09-26.md。

- Ultimate context engine analysis completed - comprehensive developer guide created.
- 创建完整实施合同；业务任务尚未实施，生产证据尚待对应授权与验收。

### 共享首用遥测限定Review Findings（2026-09-19）

范围为1.0 T8/1.6 T6的值级字典与许可核心，不是实际SDK、归因或Story完成。三层7项均修复并复核，无新增决策/延期项；证据见`evidence/story-1-6-telemetry-2026-09-19/validation.json`。

- [x] [Review][Patch] 构造时固定已校验的策略版本和初始化方法，调用方修改配置不能绕过失效代次。
- [x] [Review][Patch] TTL/去重使用单调时钟；系统墙钟仅作时间戳，不因回拨延长私密事件保留。
- [x] [Review][Patch] 旧generation的AbortError也计abandoned，不能因SDK正确响应撤回而丢失覆盖计数。
- [x] [Review][Patch] 白名单与真实领域枚举一致：third_party、resolved/pending、recent、in_progress；不静默丢合法状态。
- [x] [Review][Patch] 初始化句柄移交session时同步转移清理责任，防止双重close提前放开新owner；微任务交错负例已覆盖。
- [x] [Review][Patch] 真正send微任务前再次检查过期，主线程阻塞后的旧队列不穿透TTL。
- [x] [Review][Patch] UUIDv4事件引用规范化为小写再去重，不因大小写重复上报；旧节点型UUID不进入字典。

### File List

本轮dev-story已改/新增：

- `apps/server/src/auth/runtime-config.ts`
- `apps/server/src/auth/runtime-config.test.ts`
- `apps/server/scripts/auth-preflight.ts`
- `apps/server/.env.example`（凭据留空的PNVS配置模板）
- `apps/server/package.json`（配置测试与只读预检命令）
- `CURRENT.md`
- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md`
- `_bmad-output/implementation-artifacts/story-1-0-runtime-preflight-2026-09-17.md`
- `_bmad-output/implementation-artifacts/research/story-1-0-resource-alignment-2026-09-18.md`
- `_bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md`
- `docs/ops/pve-staging.md`（9月19实测与已验证跳板入口）
- `_bmad-output/implementation-artifacts/archive/story-1-0-resource-confirmation-2026-09-19/`（本轮前快照，不含私有env）
- `_bmad-output/implementation-artifacts/archive/story-1-0-resource-alignment-2026-09-18/`（本轮前快照，不含私有env）
- `_bmad-output/implementation-artifacts/archive/story-1-0-dev-start-2026-09-17/`（开始前快照）

本次实际产物：本Story、同名validation、三份research报告、准备前archive；已更新CURRENT、project-context、Sprint和检查器回归fixture。详细清单见准备校验报告。上面的UPDATE/NEW建议不是已改业务文件清单。

## Change Log

- 2026-09-17：依据用户“同意开始1.0”和当前create-story交接节点完成实施合同、独立校验及交接；14组源GWT保留，状态ready-for-dev，业务未实施。

- 2026-09-17：进入dev-story，记录baseline并将状态置in-progress；从T0开始，业务任务尚未声明完成。

- 2026-09-17：T0本地配置组件/只读预检/模板和18项红绿测试完成，server typecheck及既有auth probe通过。运行实际本地配置预检如实报告缺项；Story保持in-progress，等待实际资源信息，未运行或标记其它业务任务完成。

- 2026-09-18：消费用户实施方案，将T0/T4供应商选择更新为PNVS，服务器方向更新为homelab/按需frp；新增7项配置/隐私测试并通过25项回归。实际预检缩小为3个PNVS字段缺失；U-App平台与homelab目标待定位。冻结GWT及原SP指纹保留，真实服务未验证。

- 2026-09-19：用户补齐三端图形、双端U-App及已审核短信签名/模板，真实配置预检通过；27项配置测试与类型检查通过。按明确授权启动并核验既有VM104，跳板SSH可用；OPS-01进入环境预检，保留既有数据/历史release。更新授权范围为homelab开发测试，公有云在整体开发测试完成后发布。

## Capacitor Scope Amendment（2026-09-19）

用户已批准完整提案并授权持续推进。当前合同消费新增App GWT和APP-HOST-01，工程底座由9.1、最终分发由9.2承担；1.0共享后端/身份工作继续，不能只以Web证据关闭。原Dev Record、任务进度和已完成隔离验证保留，后续开发以最新记录为准。来源：`_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`。


### 2026-09-19 后续准备交接

已接收Capacitor正式交接并核对用户持续goal模式指令。1.0维持in-progress，代码/隔离PG/实际Chromium替身交互、Android编译证据见独立dev-progress；协议/真实PNVS/归因/双端实机与工程真实门槛继续开放。开始独立准备1.6不表示1.0完成，也不开放真实用户数据路径。晚到退出冲突/me已补同等sequence/activity/取消栅栏；原生已完成退出回执可跨恢复确认且不影响新账号。当前所有供应商发送/验码测试仍为替身。


### T8共享实现追加文件

- `apps/mobile/src/telemetry/dictionary.ts`
- `apps/mobile/src/telemetry/dictionary.test.ts`
- `apps/mobile/src/telemetry/runtime.ts`
- `apps/mobile/src/telemetry/runtime.test.ts`
- `apps/mobile/src/auth/analytics.ts`
- `apps/mobile/src/auth/analytics.test.ts`
- `apps/mobile/src/auth/LoginScreen.tsx`
- `apps/mobile/src/planner/PlannerScreen.tsx`
- `apps/mobile/src/planner/DayPlanScreen.tsx`
- `apps/mobile/src/planner/DayPlanScreen.test.tsx`
- `apps/mobile/src/settings/SettingsScreen.tsx`
- `apps/mobile/scripts/telemetry-browser-probe.mjs`
- `docs/ops/telemetry-first-use-v1.md`
- `_bmad-output/implementation-artifacts/evidence/story-1-6-telemetry-2026-09-19/validation.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-6-telemetry-2026-09-19/browser-report.json`

首次消费隐私边界证据已补，真实SDK/许可UI/规范事件及查询仍未接通；详见9月19dev-progress最新T8段，Story仍in-progress。


### T9测量切片追加文件（2026-09-26）

- `.github/workflows/ci.yml`
- `.gitignore`
- `CURRENT.md`
- `_bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md`
- `_bmad-output/implementation-artifacts/capacitor-task-monitor-state.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/cutoff-preflight/recomputed.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/cutoff-preflight/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/cutoff-preflight/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/cutoff-preflight/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/between-cases/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/between-cases/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/between-cases/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/hidden-home/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/hidden-home/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/hidden-home/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/integrity-failure/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/integrity-failure/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/integrity-failure/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/owned-port-stalled-body/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/source-read-failure/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/source-read-failure/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/source-read-failure/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/guards-preflight/verification.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/import-compatibility/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/import-compatibility/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/lint-preflight.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/matrix-preflight/recomputed.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/matrix-preflight/report.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/matrix-preflight/run-status.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/matrix-preflight/samples.json`
- `_bmad-output/implementation-artifacts/evidence/story-1-0-measurement-2026-09-26/preflight.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/story-1-0-auth-measurement-code-review-2026-09-26.md`
- `_bmad-output/implementation-artifacts/story-1-0-auth-measurement-progress-2026-09-26.md`
- `apps/mobile/scripts/auth-measurement-harness.tsx`
- `apps/mobile/src/auth/LoginScreen.test.tsx`
- `apps/mobile/src/auth/LoginScreen.tsx`
- `docs/ops/auth-measurements.md`
- `docs/ops/import-measurements.md`
- `eslint.config.mjs`
- `package.json`
- `packages/types/src/auth-measurements.ts`
- `packages/types/src/import-measurements.ts`
- `packages/types/src/measurement-common.ts`
- `scripts/measurements/auth-harness-boundaries.test.mts`
- `scripts/measurements/auth-report.mts`
- `scripts/measurements/auth-report.test.mts`
- `scripts/measurements/check-auth-guards.mts`
- `scripts/measurements/run-auth.mts`
- `scripts/measurements/run-import-dock.mts`
- `scripts/measurements/tsconfig.json`

本地结果与源指纹见story-1-0-auth-measurement-progress-2026-09-26.md及evidence/story-1-0-measurement-2026-09-26/preflight.json；原baseline、GWT与整Story状态保留。
