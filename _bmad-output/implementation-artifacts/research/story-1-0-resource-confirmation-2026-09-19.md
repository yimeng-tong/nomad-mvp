---
date: '2026-09-19'
story: '1.0'
status: configuration-ready-homelab-runtime-verified
previous_record: _bmad-output/implementation-artifacts/research/story-1-0-resource-alignment-2026-09-18.md
decision_source: 当前用户提供的三端图形方案、双平台U-App、短信签名/模板及homelab授权
configuration_validated: true
runtime_integrated: false
real_authentication_verified: false
production_ready: false
---

# Story 1.0 资源确认与 Homelab 核验

用户补充了图形 H5/Android/iOS 三套方案、U-App Android/iPhone 应用、PNVS 已开通信息和控制台的已批准签名/模板列表，并授权自行创建 VM/LXC 或复用现有 homelab。用户指定整体开发测试完成后再发布公有云。本记录替代9月18日资源记录中的缺项状态，保留其历史事实与供应商决定。

## 当前资源匹配

| 资源 | 已提供/选定 | 满足的用途及证据边界 |
| --- | --- | --- |
| PNVS 图形 H5 | `nomadh5`，appId/appKey 已私有落盘 | 当前 Web/PWA 选择此方案；格式/配置完整，尚未真实挑战及服务端验票 |
| PNVS 图形 Android | `nomad`，独立 appId/appKey | 保留给原生 Android；不替代当前 H5 参数 |
| PNVS 图形 iOS | `nomadios`，独立 appId/appKey | 保留给原生 iOS；不因此创建原生工程 |
| PNVS 短信认证 | 用户确认开通，现有云 AK，签名「恒创联众」，登录/注册模板 `100001` | 当前短信配置齐全；身份权限、发送/核验及失败行为待真实联调 |
| U-App Android | 用户确认 `nomad` 为 Android，AppKey 已保存 | 已明确平台注册资源；SDK、实际事件及查询还未验证 |
| U-App iPhone | 用户确认 `nomadios` 已开通移动统计，独立 AppKey 已保存 | 已明确平台注册资源；与 Android 分开，不互换 Key |
| Homelab | 已核实并启动现有 VM 104 `nomad-staging` | 操作系统、现有应用及 DB/Redis/代理健康通过；不是本 Story 新认证实现的验收 |

Android 控制台复制文本中有「账号统计：暂停使用」。这可能是可点击的操作入口，也可能是状态描述；没有界面/事件实证前不将其认定为已停用，更不能因此宣布整项移动统计不可用。本地记录其状态为未核实。

U-App 两端 Key 足以确认原生应用资源已经提供。当前产品仍为 Web/PWA，移动统计的原生/混合 SDK、纯浏览器统计与 U-Link 归因不是同一项配置。当前资料没有证明 Web/PWA 的完整 U-App/U-Link 链路，`login-attribution` 责任保留；继续核验实际 SDK 宿主和深链/归因资源，不静默换成 U-Web/U-Mini，也不把注册原生应用当作原生 App 已交付。

## PNVS 鉴权与短信选择

短信认证 API 使用阿里云 AccessKey ID + AccessKey Secret（或适用 STS 凭据）签名鉴权；不需要另外寻找 PNVS 专用 API Key，也不用图形认证 appKey 调用短信接口。现有根目录 `.env.aliyun-admin.local` 中的两项云凭据供本地预检读取，是否为受限 RAM 身份及实际权限仍未通过云调用验证；未来运行部署应核对其用途与权限。

使用 `dypnsapi.aliyuncs.com` 的 `SendSmsVerifyCode` / `CheckSmsVerifyCode`。短信系统签名和模板已由用户提供的控制台清单确认；选用清单第一项「恒创联众」和 `100001`，参数为供应商动态生成 `${code}` 对应的 `##code##`、`${min}` 为 `5`。配置限定 6 位数字、300 秒有效期、60 秒发送间隔，不返回 OTP，旧码覆盖，不自动重发。没有使用其他场景的 `100002`–`100005`。

图形方案名称/FG 编码不是短信签名，也不是短信 SchemeName。短信方案名仍可留空使用默认方案；发送和核验必须一致。三组图形参数按各自平台保存，当前运行配置明确 `ALIYUN_PNVS_CAPTCHA_PLATFORM=h5`，错误选择 native 平台会被拒绝。

## 私有配置与验证

- 所有新增图形密钥、两端 U-App 标识保存在根目录 `.env.story-1-0.local`，0600、被 Git 忽略；完整值未写入本文、模板、源码或输出。
- H5 是当前 `ALIYUN_PNVS_CAPTCHA_APP_ID/APP_KEY`；其余图形参数使用 `ALIYUN_PNVS_CAPTCHA_ANDROID_*` / `ALIYUN_PNVS_CAPTCHA_IOS_*` 等独立字段，仅作后续受控引用。
- U-App 使用 `UAPP_ANDROID_APP_KEY` 和 `UAPP_IOS_APP_KEY` 分别登记；预检只输出存在性，当前 runtime host 仍为 `web-pwa`、`integrationVerified: false`。
- 实际只读预检退出码 0，`configurationValidated: true`、`realServicesVerified: false`。没有再报告短信签名、图形密钥或 U-App 平台未知；没有发送短信或调用供应商验票。
- 新增2项端别/双平台资源隐私回归，配置测试总计27项通过，server TypeScript no-emit 检查通过。组件仍未接入应用认证路由，原占位认证未被此记录宣布修复。
- `pnpm run ci:handoff`、`git diff --check`及当前产物/快照的私有值排除检查通过；当前Sprint保留60 Story/1018 GWT，3.1暂停与历史事实不变。

复验命令（WSL，工作目录 `apps/server`）：

```bash
node --env-file=/home/tong123/work/nomad-mvp/apps/server/.env --env-file=/home/tong123/work/nomad-mvp/.env.aliyun-admin.local --env-file=/home/tong123/work/nomad-mvp/.env.story-1-0.local --import tsx scripts/auth-preflight.ts
```

## Homelab 实测及操作范围

先依 `docs/ops/pve-staging.md` 发现已有目标，再通过 PVE 只读查询确认：

- PVE `192.168.31.2` 在线，VM 104 名称为 `nomad-staging`，起初 stopped。
- VM 为4 vCPU、8 GiB内存上限/4 GiB balloon、64 GiB local-lvm 磁盘；固定地址 `192.168.31.104/24`，无 hostpci，onboot=0。启动前主机约14 GiB内存余量、local-lvm约200 GiB实际余量，足够复用现有 VM。
- 按用户已给的复用授权执行 `qm start 104`，成功；没有创建额外VM/LXC，没有改磁盘、网络、防火墙或其他来宾。
- Guest Agent 验证 VM running、IP正确；SSH、Nomad、PostgreSQL、Redis、Nginx均 active。Node为22.22.1，根分区使用约9%，可用约55.8 GiB。
- 来宾本机 `http://127.0.0.1/api/health` 返回 HTTP 200、`status: ok`。PG/Redis仅监听回环；UFW仅允许LAN网段访问22/80，API3000没有新增放行。
- Windows SSH 直达来宾曾超时；经现有 PVE 跳板 `-J root@192.168.31.2` 已成功返回来宾主机名。未为连通性放宽防火墙，也未复制SSH私钥。
- 当前来宾运行历史 release `10f940c49e2d`，没有部署当前未提交工作树，没有将新云/图形凭据写入来宾，没有执行迁移、合成写入探针或清理旧数据。VM 保持运行供后续开发测试，原 onboot=0 保留。

## 当前下一步与发布顺序

原 `AUTH-RESOURCES-T0`、宿主目标和 U-App 平台定位缺项已解除，不再重复向用户索取这些资料。Story仍为in-progress，T0继续处理运行模式隔离、宿主/HTTPS与实际接入边界，随后按Story任务顺序实现账号与会话。真实证明、持久会话、迁移/恢复、归因和工程指标仍分别验收；基础资源已齐不等于整个1.0完成。

当前部署授权限 homelab 开发测试：可复用现有或在容量核实后新建隔离VM/LXC。需要公网联调时按已有frp方向准备具体HTTPS/代理方案。整体开发测试完成后再准备公有云发布，当前不提前购买或发布到公有云。生产数据迁移/清理和真实短信次数/号码另按具体联调范围落实。

OPS-01仅推进到环境预检，备份/隔离恢复和安全认证仍未关闭；DB-CHANGE-01、METRICS条件未由这些证据完成。1.6不派发，3.1保持暂停，原SP授权快照不变。

## 官方依据（2026-09-19 查阅）

- [PNVS个人开发者接入指南](https://help.aliyun.com/zh/pnvs/use-cases/sms-verify-for-individual-developers)：AccessKey、产品端点、系统签名/模板。
- [SendSmsVerifyCode](https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-sendsmsverifycode)：发送参数和动态验证码。
- [PNVS图形认证方案](https://help.aliyun.com/zh/pnvs/user-guide/graphical-authentication-service-usage-process)：H5/Android/iOS各端方案和独立appId/appKey。
- [U-App H5页面统计说明](https://devs.umeng.com/docs/119267/detail/121481)：原生/混合桥接与JS路径需区分；不是这些Key已接通纯PWA的证据。
- [U-App账号统计排查](https://devs.umeng.com/docs/119267/detail/121417)：需要实际账号事件/上报结果，页面字段不能替代证据。
