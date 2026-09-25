---
title: Story 1.0 生产登录、行为验证与归因供应商官方技术研究
date: '2026-09-17'
research_type: bounded-official-technical-research
story_key: 1-0-production-login-and-multi-device-sessions
status: research-complete-real-service-evidence-pending
source_contract: _bmad-output/planning-artifacts/epics.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-2026-09-17.yaml
source_obligations:
  - login-attribution
scope: 仅公开文档、官方代码及公共registry元数据；不决定采购或变更产品范围
accessed_on: '2026-09-17'
real_accounts_inspected: false
real_service_calls_performed: false
---

# Story 1.0 供应商与 Web/PWA 边界研究

本报告支持 create-story，不代表供应商已选定、账号或套餐已开通、代码已接通或生产验收完成。所有网络来源均于 **2026-09-17** 查阅。研究只访问公开资料和包元数据，没有登录供应商控制台、读取私有凭据、注册账号、发送短信、购买资源或部署服务；因此本项目是否已经拥有下述资源仍是**未核验**，不能写成“确定没有”。

## 1. 结论与现有批准范围

1. **Authing 可列为身份聚合的主候选，极光可列为手机号验证候选，但这不是选型批准。** Authing 官方确认后端授权码流程和 Node 认证 API；极光有真实 Web/H5 SDK、服务端取号验证和独立短信 API，不能误写成只有原生 SDK。二者承担的身份管理范围不同，不应仅按品牌二选一。[Authing OIDC](https://docs.authing.cn/v2/guides/federation/oidc.html)、[极光 Web SDK](https://docs.jiguang.cn/jverification/client/web_guide)、[极光短信 API](https://docs.jiguang.cn/jsms/server/rest_api_jsms)
2. **Apple/微信必须按实际宿主、上游资格和已授权资源启用。** Authing 的 Apple Web 连接不消除 Apple 开发者账号、Services ID、关联 App、密钥和回调前置。微信 PC 扫码、微信内网页授权和原生移动登录是不同连接方式。[Apple 环境配置](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)、[Authing 微信登录方式](https://docs.authing.cn/v2/guides/connections/social.html)
3. **腾讯行为验证必须服务端验票。** 前端 `ret=0` 与后端 `CaptchaCode=1` 分属两层；`trerror_` 容灾回调也可能返回前端 `ret=0`。不能把非空 token、HTTP 200 或前端回调成功当成通过。[Web 接入](https://cloud.tencent.com/document/product/1110/36841)、[票据返回码处理](https://cloud.tencent.com/document/product/1110/84005)
4. **U-Link 有 H5 JS 接入，但公开完整链路的目标是 App 唤起/安装。U-App 的纯浏览器独立接入闭环尚未被本轮资料证实。** U-Web 和 U-Mini 的 Web/H5 能力真实存在，但不能改名当作 U-App，也不能未经决定替换 FR14。[U-Link 产品](https://www.umeng.com/ulink)、[友盟 SDK 目录](https://devs.umeng.com/?client=web)、[官方 U-Web 示例](https://github.com/umeng/uweb-web-demo)
5. **Nomad 的稳定 owner、账号资格、会话撤销与运营授权仍需应用服务端负责。** 供应商登录成功不自动满足两设备共存、当前会话退出、全账号资格撤权或历史 owner 迁移。这是当前 Story 已批准的交付责任，不依赖新增设备中心或未来 7.5 UI。

本地权威输入是 `epics.md` Story 1.0 的 14 组 GWT、`docs/prd.md` FR1/FR14–FR16，以及交付合同 `source_obligations.login-attribution`。后者要求 1.0 承接登录入口、首次打开、注册归因、隐私选择、稳定 owner 绑定和账号切换清理；真实接通证据缺失时保留未验收，不能隐藏入口、静默延期 FR14 或新增原生 App。1.6 承接深链/统一输入恢复，8.1 汇总观测；不能用后续 Story 替代 1.0 首次消费的实证。

## 2. Authing 与极光：可确认能力和真实前置

| 维度 | Authing 官方已证实 | 极光官方已证实 | 对 Story 1.0 的含义 |
| --- | --- | --- | --- |
| 后端身份流程 | 有后端场景可用授权码换 Access/ID Token，随后建立应用会话；支持 OIDC/PKCE。[A1] | JVerification 返回待服务端验证的运营商 token；Web 取号和号码认证有专门 H5 端点。[J1][J3] | Authing 可承担身份聚合；JVerification 不能直接当作 OIDC 身份提供商或 Nomad 会话数据库 |
| 真实短信验证码 | 默认短信通道和可配置短信通道；Node v3 API SDK 暴露 `sendSms`、`signInByPhonePassCode`。[A2][A3] | JSMS 提供发送 `POST /v1/codes` 和验证 `POST /v1/codes/{msg_id}/valid`，返回 `is_valid`。[J4] | 必须验证用途、手机号绑定、时效和一次性；“发送成功”不建立账号会话 |
| Web/PWA | 后端授权码流程适合已有 Fastify；浏览器无需持有 client secret。[A1] | 有 Web SDK。环境检测文档限制移动设备与非 Wi-Fi 网络，并明确检测可能不准确；失败需提供短信恢复。[J2] | 运营商网关认证不能取代桌面、Wi-Fi、所有浏览器的通用短信路径；PWA 安装不自动获得原生能力 |
| Apple/微信 | 有分平台社会化身份源；上游账号、应用和回调需分别配置。[A4][A5][A6] | 本轮确认的是号码认证/一键取号与 JSMS，未确认等价的 Web OIDC + Apple/微信身份聚合服务 | 若选极光手机号路径，仍须单独落实适用社会化登录，不能把一个手机号 SDK 视为全功能完成 |
| 服务前置 | 用户池/应用、真实短信通道、应用类型/授权配置、社会化身份源权益。[A2][A4] | 开发者认证、应用、Web 集成页面/来源审核、一键登录开通及服务端密钥；短信另需可用签名/模板/业务权限。[J5][J4] | 逐项记录“已核验/待核验/未获授权”；公开 API 存在不能证明当前租户有权限 |

短支撑引文：Authing 授权码流程写明“**你的应用服务将授权码发送到 Authing**”[A1]；极光 Web SDK 指南列出“**js号码认证**”与“**js一键登录**”[J1]；极光环境检测说明“**且网络环境不是 wifi 时才支持**”[J2]。

实施建议，不是已选供应商：先核对可用的 Authing 用户池及短信/社会化能力；若资源合适，用其统一身份入口可减少自建第三方适配。若现有资源更适合极光，则把 JSMS/JVerification 放入同一后端证明验证接口，另接批准的社会化方式。不要同时引入两套用户目录、强制一键取号、或把供应商账号 ID 直接扩散为所有业务表的 owner。

Authing SDK 官方源码当前以 `/api/v3/send-sms` 发送、以 `/api/v3/signin` 处理 `PASSCODE` 登录；源码注释要求短信 Channel，并描述同一手机号同一 Channel 的发送间隔。Story 应将登录用途和服务端冷却纳入合同，最终以实际租户配置/响应校验；不能把示例验证码、SDK 返回形状或文档示例时限当作成功证明。[A3]

极光 JSMS 的 `msg_id` 要由服务端关联本次挑战、规范化手机号、用途和有效期，不能接受浏览器任意替换目标 `msg_id`。JVerification Web 的服务端端点应选 `/v1/web/h5/loginTokenVerify` 或 `/v1/web/h5/verify`；不能误用原生 `/v1/web/...` 地址。取号成功返回的加密手机号需要服务端解密，仍不是永久内部账号标识。[J3][J4][J6]

## 3. Apple/微信实际宿主边界

### Apple Web

Apple 当前环境配置正文明确写有：**“must have an existing app in the App Store”**。账户帮助页进一步要求 Web Services ID 关联已启用 Sign in with Apple 的现有 primary iOS/macOS/tvOS/watchOS App ID。[P1][P2] Authing Apple Web 配置需要 Services Identifier、Team ID、Key ID、Signing Key，并配置上游回调。[A5]

这证明的是**上游官方前置**；本轮未检查项目的 Apple 开发者资产，不能推断已满足或肯定缺失。Story 应要求核验是否已有合格关联 App/宿主、对应团队与网站授权。若缺少适用资源，把 Apple 真正接通列为未满足的前置并交还产品/资源决定，不能自行建原生 App、购买开发者资格或通过隐藏 Apple 入口宣布 Story 关闭。

若直接处理 Apple 回调，请求了 `name`/`email` scope 时文档要求 `response_mode=form_post`，`code` 一次性且短时有效。[P3] 跨站 POST 不能假定携带 `SameSite=Lax` 临时 cookie。应针对**实际经过的回调链**测试关联恢复：Apple→Authing→Nomad 与 Apple→Nomad 的浏览器行为可能不同。需要 POST 回调时，使用受限、短期、单次消费的交易关联设计；不能为修好回调而把全部业务 cookie 无条件放宽，或放弃 `state`/`nonce` 校验。[S3]

### 微信

| 实际宿主 | 已证实路径 | 前置/限制 |
| --- | --- | --- |
| 桌面浏览器 | 微信开放平台网站应用的 PC 扫码连接 | 网站应用已获微信登录权限，AppID/AppSecret 和授权回调域。[A6] |
| 微信内网页 | 公众号网页授权 | 微信服务号、网页授权范围和对应身份源；Authing 明确场景是微信客户端内网页。[A7] |
| 普通移动 Safari/Chrome、安装 PWA | 不能仅凭“移动端”复用原生微信 SDK，也不能默认微信内网页授权适用 | 按实际获准路径核验跳转/返回/扫码可用性；能力矩阵中诚实展示不可用和已验证替代入口 |
| 现有原生宿主 | 只有确实存在且获授权时才评估原生 SDK | 本 Story 不创建原生宿主，原生样例不是 Web/PWA 实证 |

Authing 社会化配置存在字段匹配/询问绑定等账号关联选项。[A4] 必须核验供应商关联策略与 Nomad 禁止自动合并已有数据账号的合同一致，不能启用 email/手机号相同就自动合并的便利配置。产品入口顺序与等权遵守已批准 FR15，研究不能借平台限制重排或删减要求。

## 4. OIDC、身份映射、CSRF 与会话失效

以下是将已批准 GWT 落到实施任务的建议；不是通过研究宣称已有实现。

| 边界 | 应写入 Story 的实现与验收点 |
| --- | --- |
| 登录交易 | 服务端创建短期交易，固定 provider/issuer、client、精确 redirect URI、`state`、适用 `nonce`、PKCE `S256` verifier 和获准站内返回上下文；一次性原子消费。拒绝过期、跨浏览器/跨交易、并发重放、供应商混用和任意外跳 |
| 后端交换 | 复用 Fastify 后端做授权码交换；client secret、refresh token 等不上前端。只向配置允许的发现/令牌/JWKS 端点请求，不接受客户端提供任意 issuer URL |
| 身份验证 | 采用维护中的协议库完成签名及 `iss`、`aud`、必要 `azp`、`exp`、适用 `nonce` 校验；验证后的 UserInfo `sub` 与 ID Token 一致。不以解码 JWT、前端 profile 或“换到了某种 token”代替认证 |
| 稳定 owner | OIDC 外部身份以可信 `iss + sub` 映射内部不变 owner，数据库唯一约束与事务处理并发首次登录。`sub` 可能为 pairwise，跨 client/issuer/用户池迁移不能盲目假设相同。手机号、email、显示名不是 OIDC 的稳定主键。[S1] |
| 本地会话 | 供应商证明通过后新建不可预测 Nomad 会话，轮换登录前标识；会话/到期/撤销由共享持久权威承载。两个设备持有独立会话；不以供应商单登录选项或进程 Map 决定业务权限 |
| 当前退出 | 幂等持久撤销本次 Nomad 会话；核验响应丢失恢复；清当前私有缓存和迟到响应，保留设备 B。供应商 SSO logout、refresh 撤销和 Nomad 当前会话退出需分别验证范围，不能调用含糊的 `logoutAll` 完成普通退出 |
| 全账号资格 | 持久账号停用/删除资格在每次 API、刷新、SSE 后续事件/重连和私有下载校验中生效；不能等 ID Token 自然到期。禁止旧回调、旧 refresh 或重新验证手机号把已撤权 owner 隐式重建。最小运营授权同样每次读取当前受控授权 |
| Cookie 与写操作 | 按实际同源/跨源部署设置 HTTPS、HttpOnly、Secure、范围、期限与 SameSite；受保护写操作校验 CSRF/可信 Origin。CORS 和隐藏按钮不等同授权。第三方回调采用其专门关联验证，不能粗暴套业务 Origin 规则使合法回调失效 |
| 前端恢复 | 仅同 owner 恢复获准站内上下文；切换账号清缓存/进行中请求。PWA 的 Service Worker/离线缓存也必须审计，受保护响应不得在退出后继续展示旧用户数据 |

协议依据：OIDC Core §3.1.3.7、§5.3.2、§5.7、§8；RFC 9700 §2.1/§4.4/§4.7；OWASP Session Management 与 CSRF 指引。[S1][S2][S3][S4] OIDC 稳定性原文短引是“**locally unique and never reassigned**”[S1]。RFC 9700 推荐 confidential client 也使用 PKCE；应验证供应商真实支持，不照抄旧文档中的 implicit flow 建议。[S2]

若选极光 OTP/取号，证明本身不是 OIDC ID Token。应用应在真实服务验证后建立受控手机号身份绑定与稳定 owner；不要为凑统一接口伪造上游 `iss/sub` 声明。不同证明可收敛为内部“已验证身份”结构，但需保留真实 provider、命名空间、验证方法和审计事实。

## 5. 腾讯行为验证的接入合同

当前 Web 文档更新时间为 **2026-09-15**：2.0 地址是 `https://turing.captcha.qcloud.com/TJCaptcha.js`，旧 `TCaptcha.js` 仍被官方说明可用；应跟随实际验证码实例选择，并按官方要求动态加载，不能将脚本永久复制到本地固定。文档短引：“**必须动态引入验证码 JS**”。[T1]

服务端使用中国站 `captcha.tencentcloudapi.com` 的 `DescribeCaptchaResult`，API 版本 `2019-07-22`。必需业务字段是 `CaptchaType=9`、Ticket、Randstr、服务端取得的真实用户公网 IP、CaptchaAppId、AppSecretKey；云 API 鉴权密钥和 AppSecretKey 都留在服务端。结果应按 `CaptchaCode=1` 判断，票据有过期/重复/不匹配返回；无感模式还要处理 EvilLevel。[T2][T3]

必须保留以下具体测试/证据：

- FR16 默认不打断、风险/短信失败重试触发、已授权远程开关触发；风险判断不靠客户端自行声称通过。
- 前端 `ret=0` 但 `trerror_`、后端非 1、超时、鉴权失败、欠费/无权限，均不能默认放行。官方示例中的总体调用成功不等于票据成功。
- 一张 Ticket 不能跨手机号/用途重用。以服务端短期挑战绑定本次发送/重试事务，记录已验结果以处理业务响应丢失；不要无限重验一次性上游票据。
- 通过可信代理链取得 UserIp，不信任任意客户端 IP 字段；不记录完整票据、randstr、手机号、OTP 或云密钥。必要诊断保留脱敏 outcome、延迟、错误分类和 RequestId。
- 前端脚本加载失败、关闭弹窗、验证失败、发送失败分别呈现。真实验证码证明仅表明人机校验通过，不代替手机号或第三方身份验证。

真实资源核对包括 Web 类型实例、前后端一致的 CaptchaAppId、后端验证权限、适用套餐/余额、域名与网络、可用密钥及若启用时的 CaptchaAppid 加密配置。公开文档明确列出未开通/无有效套餐/欠费类错误；本轮未核验项目实际状态。[T2]

## 6. 友盟 U-Link/U-App：保留义务，避免宿主误判

| 能力 | 本轮官方证据 | 对当前范围的结论 |
| --- | --- | --- |
| U-Link H5 入口 | 官方产品写明“**从 H5 / 短信 / 邮件等渠道一键跳转 App 指定页面**”；含参数透传、安装后场景还原和渠道统计。[U1] | H5 能生成/消费唤起流程不等于纯 PWA 本身具备 App 的安装归因接收端 |
| U-Link Web SDK | SDK 目录确有智能超链 JS，标记 v1.1.0/2021-08-05，说明 H5 启动或安装 App；更新点含剪切板写入。[U2] | 不能说完全没有 Web 能力；也不能仅装 JS 就验收完整首次打开/注册归因。实际 SDK 行为尤其剪贴板须核验，不能自动读取剪贴板或泄露来源 |
| U-App H5/WebView | 官方 FAQ 对混合开发指向 H5+native 桥接，对少量 WebView 事件由原生回调调用 SDK；大量 H5/Web 又链接历史 JavaScript SDK。[U3] | 支持已有宿主的证据与纯浏览器证据必须区分；该 FAQ 本身不足以证明当前纯 PWA 可直连 U-App 全部所需能力 |
| 当前 Web 统计产品 | 官方 GitHub 把 U-App 列为移动分析，独立 U-Web 示例明确支持网站、H5、React/SPA；Web SDK 目录另有 U-MiniProgram H5。[U2][U4][U5] | 能证明友盟有纯 Web/H5 产品，不能证明它们与本项目已批准 U-App 是同一产品/账号/数据面 |

本轮遇到的资料限制：U-Link 技术正文 `developer.umeng.com/docs/191212/detail/193297` 未能获取可读正文；U-App FAQ 指向的 `dev.umeng.com/udplus/js-sdkdoc` 读取失败；官方 GitHub 部分目录 API 返回公开速率限制。结论没有依赖社区回复，也没有把抓取失败当成供应商不支持的证明。当前能确认的是产品定位/公开 SDK 与桥接说明；**纯 Web/PWA 下原 U-Link+U-App 义务的完整可验收路径仍未证实**。

Story 的 `login-attribution` 应保留以下具体子任务：

1. 列出实际支持宿主：普通移动 Web、安装 PWA、微信内网页、桌面；若存在已获授权原生宿主，单独登记其包/SDK/版本及权限，不能虚构宿主。
2. 逐项映射“入口点击、首次打开、注册、登录成功、登录恢复”的真实含义、触发方、成功凭据、去重范围与投递状态。浏览器首次访问、PWA 安装和原生 App 首次激活不可混成同一分母。
3. 在实际已有资源中核验 U-Link 可用接收端、U-App 事件入口/查询能力及 Web 适配；若确实需要 U-Web/U-Mini 才可满足，给出具体产品/能力差异待决定，不能自行替代或宣告 FR14 不适用。
4. 归因参数只承载允许的 campaign/click 引用或服务端不透明恢复键，不含手机号、OTP、cookie、token、原始小红书链接/行程或私有上下文。归因不是身份认证或 owner 归属证明。
5. 完成隐私选择及账号切换清理：同意前后哪些外发被允许、撤回后的处理、匿名标识到 owner 的受控关联、退出/换 owner 的解除或隔离。不能仅调用 `identify()` 就认定供应商数据已解绑。
6. 提供供应商端实际可查询的事件/归因结果、时间窗口、去重/丢弃/失败证据；本地 wrapper 的调用次数、配置和合成截图都不能替代。8.1 后续汇总不免除首用实证。

如果没有可用宿主或服务证据，应明确停在相应实证项未完成；这不会授权新增原生 App，也不会自动延期既有义务。可以先完成安全恢复键、事件字典、脱敏与隔离测试，但必须标注它们是本地基础能力。

## 7. SDK/API 版本观察与选择原则

以下为查阅时公开快照，**不是已安装版本、兼容验证结果或供应商批准**。仓库声明 Node >=20、Fastify 5、ESM/NodeNext，移动端 React 19；本轮未安装包或运行 SDK。

| 项目 | 2026-09-17 观察值/来源 | 选择原则 |
| --- | --- | --- |
| Authing Node SDK | `authing-node-sdk@4.0.2`，MIT；官方 README 表示基于 Authing v3 API。[V1][A8] | SDK 大版本不等于 HTTP API 版本。若需要短信认证 API，选择文档/类型同代的服务端 SDK；先验证 Node/ESM 导入与错误形状，不混用 v2 `authing-js-sdk` 示例 |
| Authing JS SDK | registry latest `4.23.55`，MIT；元数据声明 Node >=8.9。[V2] | 很低的 engines 不是现代 Node/浏览器兼容保证。已有 React 19 首屏不因研究自动换成旧 Guard UI；托管/嵌入流程须保留当前产品入口合同 |
| 标准 OIDC 客户端 | `openid-client@6.8.8`，MIT、ESM；官方 README 的 v6 基线为 Node 20，并使用 WebCrypto/Fetch。[V3][V4] | 仅作为可评估的后端协议库；若选用，锁定具体版本，验证 discovery/JWKS/nonce/PKCE/密钥轮换；不会同时再造一套 JWT 验证器 |
| 极光 Web SDK | 更新页最高条目 `5.3.3`，2025-09-05；集成页 2026-06-03 仍展示 5.x.x 模板。[J7][J1] | 实施前取得真实可用版本及报备/白名单信息，不能把 `5.x.x` 当可直接使用的版本字面值。SDK 使用权/服务收费另核验 |
| 腾讯 captcha Node SDK | `tencentcloud-sdk-nodejs-captcha@4.1.191`，Apache-2.0；API 版本仍为 `2019-07-22`。[V5][T2] | 可评估服务专用包降低依赖范围；验证 Fastify 的超时/错误映射、签名和服务地址。锁定 npm 版本不等于锁定云端行为 |
| 腾讯前端 | 官方 2.0 `TJCaptcha.js`；1.0 `TCaptcha.js` 仍支持。[T1] | 依官网动态加载，记录采用代际和查阅日期；此类官方动态脚本不以本地固定副本替代 |
| 友盟 | Web 目录 U-Link JS v1.1.0 与 H5 统计 v1.7.4 的日期均较旧；后者明确属于 U-MiniProgram。[U2] | 不把旧目录标记当作目标宿主最新完整兼容矩阵；实施前向实际资源/当前可下载文档核验 U-App/U-Link 组合与许可/权益 |

包的 MIT/Apache 许可只描述 SDK 代码许可，不提供短信、身份、验证码或分析服务权益。套餐、MAU/调用量、保留/删除、地域、导出/查询能力、自定义域名/社会化登录权限都需针对真实账号核验。本报告未给出价格或作采购比较；Authing 文档本身明确社会化身份源受用户池版本权益影响。[A4]

## 8. 可直接纳入 Story 的执行顺序与真实验收材料

| 顺序 | 具体工作 | 关闭证据 |
| --- | --- | --- |
| 1 | 固定获准宿主/登录方式/身份命名空间；盘点实际已授权资源，落实短信、Apple、微信、captcha 和友盟可行路径 | 脱敏资源与能力矩阵，真实回调 URI/issuer/client 类型、服务权益核验；未满足项单列，不能混为“已接通” |
| 2 | 封装真实证明验证，隔离开发替身；准备稳定 owner、历史映射审计与回滚点 | 伪造输入、错误 OTP、用途错配、过期/重放、并发首次注册、冲突历史归属测试；来源不可信旧数据保留隔离 |
| 3 | 实现持久会话/账号资格/最小运营授权、cookie/CSRF 与安全恢复 | 真实 PostgreSQL、重启/两实例、两设备、当前退出响应丢失、全部普通权限撤权、SSE/下载/运营否定测试 |
| 4 | 接通获准真实服务与已有登录首屏 | 授权测试号码的实际发送/验证；各启用第三方完整跳转→回调→`/me`；真实 captcha 服务端通过与失败；浏览器/网络矩阵和脱敏供应商回执 |
| 5 | 完成 login-attribution 的宿主判定、隐私外发与真实供应商归因核验 | 真实可查询事件/归因、注册/首次打开定义和时间窗口、登录中断/重复回调/账号切换/撤回选择的证据；不以 noop wrapper 结案 |
| 6 | 对照 Story 14 组 GWT 与绑定工程条件收集证据，再给后续 Story 可消费契约 | OpenAPI/生成类型、完整构建、必要认证/浏览器/PG 检查与 handoff 结果；实际服务未获授权或不可用时相应实证仍未完成 |

真实测试须在后来已授权的环境和账号范围内执行。应保存测试日期、宿主/浏览器版本、SDK/API 版本、脱敏配置指纹、具体断言/结果、供应商回执 ID、服务失败分类和证据路径，避免保存完整手机号、OTP、票据、cookie、私钥或原始私有内容。上述测试清单是未来验收要求，本轮只完成研究。

## 9. 官方来源索引

所有条目查阅日期：**2026-09-17**。未列为结论来源的社区内容不作为依据。动态网页/`main`/registry latest 均为当日观察，实施时再确认并固定具体依赖版本。

| ID | 官方来源与直接 URL | 本报告使用范围 |
| --- | --- | --- |
| A1 | [Authing 成为 OIDC 身份源](https://docs.authing.cn/v2/guides/federation/oidc.html) | 后端授权码、PKCE 流程 |
| A2 | [Authing 配置短信服务](https://docs.authing.cn/v2/guides/userpool-config/sms/) | 默认/自定义真实短信通道 |
| A3 | [Authing 官方 AuthenticationClient 源码](https://github.com/Authing/authing-node-sdk/blob/main/src/AuthenticationClient.ts) | 实读 raw 源码，`signInByPhonePassCode`、`sendSms` 和 v3 端点 |
| A4 | [Authing 社会化身份源](https://docs.authing.cn/v2/guides/connections/social.html) | 场景区别、权益与关联配置 |
| A5 | [Authing Apple Web](https://docs.authing.cn/v2/guides/connections/social/apple-web/) | Apple 连接配置前置 |
| A6 | [Authing PC 微信扫码](https://docs.authing.cn/v2/guides/connections/social/wechat-pc/) | 网站应用权限及回调域 |
| A7 | [Authing 微信内网页授权](https://docs.authing.cn/v2/guides/wechat-ecosystem/wechat-webpage-authorization.html) | 微信浏览器/服务号范围 |
| A8 | [Authing Node SDK 官方 README](https://github.com/Authing/authing-node-sdk) | SDK 用于后端、基于 v3 API |
| J1 | [极光 Web SDK 集成](https://docs.jiguang.cn/jverification/client/web_guide) | Web JS、AppKey、版本报备/白名单 |
| J2 | [极光 Web SDK API](https://docs.jiguang.cn/jverification/client/web_api) | 网络环境限制、token、失败恢复 |
| J3 | [极光认证 REST 概览](https://docs.jiguang.cn/jverification/server/rest_api/rest_api_summary) | H5 与原生服务端端点区别 |
| J4 | [极光短信发送/验证 API](https://docs.jiguang.cn/jsms/server/rest_api_jsms) | `msg_id`、服务端验证、签名模板 |
| J5 | [极光开通认证服务](https://docs.jiguang.cn/jverification/guideline/provisioning) | 认证、Web 审核和开通前置 |
| J6 | [极光一键登录 API](https://docs.jiguang.cn/jverification/server/rest_api/loginTokenVerify_api) | 服务端换取加密手机号；使用官方搜索可读结果 |
| J7 | [极光 Web SDK 更新记录](https://docs.jiguang.cn/jverification/jverification_changelog/updates_Web) | v5.3.3/2025-09-05 观察 |
| P1 | [Apple 环境配置](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple) | 已有 App Store app、Services ID、密钥 |
| P2 | [Apple Web 配置帮助](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web) | 关联现有 primary App ID |
| P3 | [Apple 授权请求](https://developer.apple.com/documentation/signinwithapplerestapi/request-an-authorization-to-the-sign-in-with-apple-server.) | `form_post`、state、一次性 code |
| T1 | [腾讯验证码 Web 接入](https://cloud.tencent.com/document/product/1110/36841) | 2026-09-15 更新、2.0 JS、前端/容灾语义 |
| T2 | [腾讯 DescribeCaptchaResult](https://cloud.tencent.com/document/product/1110/36926) | 中国站 API、字段、后端通过码及错误 |
| T3 | [腾讯票据返回码处理](https://cloud.tencent.com/document/product/1110/84005) | CaptchaCode 非 1、EvilLevel、容灾 |
| U1 | [友盟 U-Link 产品](https://www.umeng.com/ulink) | H5 到 App 的深链/安装归因定位 |
| U2 | [友盟 Web SDK 目录](https://devs.umeng.com/?client=web) | H5 产品归属、公开版本快照 |
| U3 | [友盟 H5 页面统计 FAQ](https://devs.umeng.com/docs/119267/detail/121481) | 原生桥接与历史 JS 链接的边界 |
| U4 | [友盟官方 GitHub](https://github.com/umeng) | U-App/U-Web 产品区别 |
| U5 | [友盟 U-Web 官方示例](https://github.com/umeng/uweb-web-demo) | 独立 Web/H5/React 分析能力 |
| S1 | [OpenID Connect Core 1.0 errata 2](https://openid.net/specs/openid-connect-core-1_0.html) | 身份验证、稳定 iss/sub、pairwise |
| S2 | [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | PKCE、CSRF、mix-up、重定向安全 |
| S3 | [OWASP CSRF 指引](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | SameSite/跨站 POST/Origin 保护 |
| S4 | [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | 会话随机性、服务端状态、轮换/失效 |
| V1 | [authing-node-sdk registry](https://registry.npmjs.org/authing-node-sdk/latest) | 4.0.2、MIT；与官方 package.json 交叉检查 |
| V2 | [authing-js-sdk registry](https://registry.npmjs.org/authing-js-sdk/latest) | 4.23.55、MIT、engines |
| V3 | [openid-client registry](https://registry.npmjs.org/openid-client/latest) | 6.8.8、MIT、ESM |
| V4 | [openid-client 官方仓库](https://github.com/panva/openid-client) | Node 20/WebCrypto/Fetch 运行时要求 |
| V5 | [腾讯 captcha SDK registry](https://registry.npmjs.org/tencentcloud-sdk-nodejs-captcha/latest) | 4.1.191、Apache-2.0、官方仓库归属 |
