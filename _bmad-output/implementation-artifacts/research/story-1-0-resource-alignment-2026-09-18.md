---
date: '2026-09-18'
story: '1.0'
status: selected-resources-partially-configured
decision_source: 当前用户补充的实施方案及 homelab、frp、U-App、阿里云资源说明
base_contract_sha256: 2a14175e1ae81320011b5e6ccfccf75f41ee03783acef3ba15839d5502488573
runtime_integrated: false
real_services_verified: false
production_ready: false
---

# Story 1.0：资源选择与 T0 预检更新

用户本轮补充了实施方案，指定服务器先用 homelab、需要公网时使用 frp，提供 U-App 标识，并说明阿里云 AK 已放在 env、已有短信和图形验证能力。本记录消费这些信息，更新当前 1.0 的实施选择和精确缺项；记录本身不产生额外资源操作授权。

## 当前实施决定及来源差异

- 登录证明主路径选阿里云 PNVS 短信认证，图形验证选 PNVS 图形认证 H5；依据本轮用户说明与[同日选型存档](nomad-cloud-homelab-app-selection-2026-09-18.md)。已有 Nomad User/OAuthIdentity/Session 继续拥有账号和会话，PNVS 只提供证明，不新建第二套用户目录。
- homelab 是本阶段应用服务器方向。frp 只在需要公网接入时使用，具体 VM/LXC、入口和端口尚未确定。同日存档中的 ECS 优先方案已被本轮指令更新，ECS 购买不再是 T0 前置。
- 计划测试 Origin 沿用 `https://nomad-test.yinianyunqi.top`，API 计划同源 `/api`。名称来自同日存档；本轮没有证明 DNS、证书、公网入口或 frp 已可用。
- U-App 标识已保存到根目录私有 `.env.story-1-0.local`。不在本文、模板或日志重复该值。已提供标识不等于 SDK 宿主、同意流程、U-Link 或可查询归因已验证。
- 先实现手机号证明路径。此记录不新增密码登录，也不凭资源尚缺直接关闭适用 Apple/微信或 login-attribution 的验收责任；入口/平台范围按真实批准配置及当前合同核对。

**对冻结来源的适用规则：** 9月15/17 PRD/Epics/SP 和准备报告保留来源原文与指纹。当前 1.0 T0/T4 中的供应商选择依据本轮用户决定，替代旧 Authing/极光候选和腾讯验证码实施路径；冻结 GWT 中的供应商品牌名按此记录解释为 PNVS 对应服务。真实服务端验证、错误/重放/未知结果、稳定 owner、多设备会话及工程验收要求均不减免。没有重新声明全量 PRD/Epics 已按同日存档完成改版；OSS、视频路径、原生 App 等跨 Story 差异仍交由对应工作处理。

## 已核对的配置与实际缺口

| 项目 | 本轮证据 | 剩余工作 |
| --- | --- | --- |
| 阿里云 AK | `.env.aliyun-admin.local` 中 ID/Secret 均非空；权限 0600、Git 忽略 | 身份类型、有效性、PNVS 权益和最小运行权限尚未实测；管理配置不直接部署为应用凭据 |
| 短信认证 | 使用 Dypnsapi 的发送/核验接口；预检选系统登录模板 `100001`、系统生成 6 位数字、5 分钟有效期 | `ALIYUN_PNVS_SIGN_NAME` 未配置；账号可用签名/模板、测试号码及真实调用范围未核验 |
| PNVS 图形 H5 | 官方要求独立图形方案，服务端二次校验 | `ALIYUN_PNVS_CAPTCHA_APP_ID`、`ALIYUN_PNVS_CAPTCHA_APP_KEY` 未配置；官方 H5 SDK 文件与实际权益待确认 |
| U-App / U-Link | 用户提供的 U-App 标识已在私有配置中 | 注册平台未说明，当前 Web/PWA 宿主接入和真实归因/查询证据待验证 |
| homelab / frp | 已确认使用方向 | VM/LXC 名称或地址/运维配置路径、资源隔离、HTTPS/代理链与备份恢复目标待定位 |
| DB / Redis | `apps/server/.env` 有配置 | 仅检查存在；未连接、未证明环境隔离或恢复能力 |

短信方案名是可选字段，省略时使用供应商默认方案，不应把它误报成必须购买或创建的资源。发送与核验必须使用同一方案。模板是已选择的实现配置，不表示账号权益已实测。不得用 Dysms 自定义模板、云 AK 或 U-App 标识替代缺少的图形密钥。

## 代码与验证范围

`runtime-config.ts` 新增 `aliyun-pnvs` 配置分支和独立图形密钥，保留私有配置/脱敏摘要的边界。拒绝固定验证码、错用普通短信模板、有效期不匹配或禁用 TLS 校验；验证码生成策略固定为系统生成，禁止返回验证码、覆盖旧码且关闭供应商自动发送重试。未进入真实调用。

只读预检会分别报告 AK、短信模板、图形方案和 U-App 配置存在性；不会用 U-App 标识推导平台注册类型或宣布归因已实现。命令必须使用绝对 env 路径，在 WSL 的 `apps/server` 目录执行：

```bash
node --env-file=/home/tong123/work/nomad-mvp/apps/server/.env --env-file=/home/tong123/work/nomad-mvp/.env.aliyun-admin.local --env-file=/home/tong123/work/nomad-mvp/.env.story-1-0.local --import tsx scripts/auth-preflight.ts
```

实测返回 `AUTH_CONFIGURATION_INVALID`，缺少上述三个 PNVS 字段，`realServicesVerified: false`。输出只含字段名/布尔状态，不含凭据、号码或数据库连接值。`.env.story-1-0.local` 同样为 0600 且被 Git 忽略，未覆盖现有 env，现有应用不会自动加载它。

本轮新增测试先失败后通过；配置测试共 25 项。类型检查和交接检查结果在 Story 的 Dev Agent Record 登记。没有发送短信、调用云 API、连接 homelab/数据库、修改 DNS/隧道、购买或部署。配置组件仍未接入启动/认证路由，不能把 T0 配置工作当作生产认证修复。

## 后续接入必须保留的判断

1. 短信核验以服务端有效响应及 `Model.VerifyResult=PASS` 为准；HTTP 成功、`Code=OK` 或 `Success=true` 单独均不是登录证明。发送结果未知不能自动重发。
2. 图形 H5 使用官方 `ct4.js`，浏览器只接触 appId 和本次证明；服务端以 appKey 对 lot_number 做 HMAC-SHA256 后二次核验。证明须绑定一次性业务挑战并防止重复消费。
3. 图形接口示例中异常后当成功的演示分支不适用于 Nomad：超时、异常、错误或非成功结果必须拒绝继续发送/登录，保留可恢复失败。
4. 公网 HTTPS、frp、反向代理、Cookie/Origin/SSE 要按实际拓扑联合验证；不公开 PostgreSQL/Redis/PVE 管理或调试入口，也不以穿透成功替代登录认证。
5. 本地配置/替身证据不关闭 OPS-01、DB-CHANGE-01、METRICS-01/02/03；Story 1.0 保持 in-progress，T0 未完成，不派发 1.6 或恢复 3.1。

## 官方依据（2026-09-18 实际查阅）

- [PNVS 发送短信验证码](https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-sendsmsverifycode)：系统签名/模板、动态验证码、有效期、频控与发送参数。
- [PNVS 核验短信验证码](https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-checksmsverifycode)：方案一致性与真实核验结果。
- [PNVS 图形认证流程](https://help.aliyun.com/zh/pnvs/user-guide/graphical-authentication-service-usage-process)：H5 方案的独立 appId/appKey。
- [图形服务端二次校验](https://help.aliyun.com/zh/pnvs/developer-reference/graphical-authentication-server-integration)：表单请求、签名和返回结果；Nomad 明确拒绝示例中的异常放行。
- [图形 H5 接入](https://help.aliyun.com/zh/pnvs/developer-reference/integrate-the-sdk-with-h5-pages)：从控制台下载并部署官方 SDK。
