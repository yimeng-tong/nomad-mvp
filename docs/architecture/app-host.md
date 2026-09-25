# Capacitor App 宿主与交付合同

Updated: 2026-09-19
Status: Approved scope; implementation and real-device proof remain story-scoped

## 平台、目录与版本

同一 apps/mobile React/Vite 应用交付 Web/PWA 与 Capacitor Android/iOS；Android 10+、iOS 16.4+ 手机竖屏。增加 capacitor.config.ts、android/、ios/、src/platform/，保留 Web 单独构建。发布内置冻结 Web assets，HTTPS API 与本地宿主来源分开配置，开发 live reload 不进入候选发布配置。原生工程、wrapper/必要锁文件纳入版本管理，签名秘密、环境私钥和构建输出排除。

日常 Node/pnpm 使用 WSL；明确允许专用 macOS runner 完成 iOS 原生构建/依赖步骤，禁止 Windows-native Node/pnpm。由 9.1 核验并锁定版本；iOS 最低版本同时约束 Web bundle 构建目标，不能只改 deployment target。

## 能力边界与首次交付

| 能力 | 责任 Story | 合同 |
| --- | --- | --- |
| 返回/键盘/安全区/生命周期/外链 | 9.1 | 小型 typed platform 接口；listener 释放，重复恢复合并，错误真实；外部页面无业务桥接 |
| Native Session/Transport、登录回调 | 1.0 | 同一 User/OAuthIdentity/Session 权威；Web cookie 与原生凭据路径分别验收，不假定不同宿主共享 cookie |
| U-App / U-Link | 1.0、1.6，8.1 汇总 | 双端 SDK 与最小桥接；当前隐私选择、平台配置、实际事件查询及无双计数 |
| 受保护图片、相册、分享 | 5.4/5.5 | owner 隔离临时文件；系统仅收文件而非 token/签名 URL；真实保存回执和有序批次 |
| 单次定位 | 6.2 | 当前系统权限、单次前台 fix、精度/时间/坐标系校验、无 GMS 路径与原计划降级 |
| 账号副本、截图选择 | 7.4/7.6 | 用户选择文件目的地/单张截图；私有缓存与 EXIF 清理，无相册扫描 |
| JS / 原生故障 | 8.1 | app build/Web bundle/平台与安全业务关联；符号可定位且不重复采集 |

## 会话、恢复和外部导航

1.0 固定 Native Session/Transport ADR：原生 cookie jar 或受控凭据注入必须证明 API、SSE、下载、撤权一致；必要持久凭据由 Keychain/Keystore 保护，不放普通 localStorage/Preferences、深链或日志。本地 origin 不是认证证明，不能为接受 capacitor scheme 放宽全局 HTTPS、通配 CORS 或浏览器 CSRF。

第三方身份使用供应商支持的官方 SDK/系统认证会话，回调校验适用 state/nonce/PKCE、一次性与接收方，服务端确认后读取 /me。冷暖启动去重，跨 owner/过期回调丢弃。Browser 外链能力不自动等同身份认证能力。

恢复顺序为遮蔽未核实私有视图 → 当前身份/资格 → job/revision/cursor 对账 → 恢复可确认页面。进程被杀不取消已受理 job，不承诺后台 SSE 常驻，不自动重交未知写入或把未持久化草稿标为已保存。原生缓存、迟到插件响应与账号切换受同一代际保护。

## 文件、权限和隐私

行程图片写相册由 5.5 使用经维护/许可/版本核验的桥接：Android MediaStore，iOS PhotoKit add-only 等实际最小权限。沙箱文件创建和打开系统分享不等于相册保存；只在系统确认后显示已保存，取消/部分/失败/未知分别处理。分享接收者是否收到通常不可观察，不能代报成功。

TripLongLayoutPolicy 同时验证 WebView、解码/系统保存和设备内存；WebP 不支持时按版本化规则 JPEG fallback，保留完整城市边界、同一 manifest、无 ZIP。下载后的临时文件按 owner/用途隔离并清理，不把秘密或受保护 URL 传给系统。

各消费 Story 维护 AndroidManifest、Info.plist 用途、entitlements、适用 PrivacyInfo.xcprivacy/required-reason 声明与真实 SDK 清单；9.2 复核最终二进制。采集须服从适用隐私选择，未经同意不因 App 启动自动采集，权限拒绝不阻断无关基础功能。

## 构建与证据

9.1 交付真实可安装的已有入口；9.2 交付签名 APK 与指定组可用且实际安装的 TestFlight build。记录 source revision/内容摘要、lockfile、assets、工具/SDK、环境、签名安全引用和版本。配置/生成源码、CI workflow、模拟器、IPA 或上传受理不能冒充已完成真机安装/TestFlight 可用。

APP-BUILD-01、APP-HOST-01、APP-DISTRIBUTE-01 逐 Story 进展；源码可开始、某平台可构建、可签名、可分发分别报告。需要的 macOS/开发者权限/真机未核验时保持门槛，继续可独立工作；不下调支持范围或标假 done。


## Current platform and shared UI amendment (2026-09-20)

现行支持：iOS16.4+；Android10+且WebView111+；网页Chromium/Edge111+、Firefox128+、Safari16.4+，桌面运营使用同一网页矩阵。iOS最低目标同步所有Xcode配置、App SPM平台、WebBuildTarget/cssTarget、native verifier与测试矩阵。插件最低版本可更低但不能高于App声明。旧16.0/Firefox114证据保留为历史，不推导新下限已验证。

9.3 AppSheet/Portal通过现有host返回与身份边界；9.6恢复前先核对身份再刷新Query，9.7在已校验typed intent后导航；不改业务写入/凭据权威。旧浏览器退出支持需要轻量且可用的升级提示，由9.3落实。最低真实OS/设备证据仍需补齐，Playwright WebKit和生成配置不替代。
