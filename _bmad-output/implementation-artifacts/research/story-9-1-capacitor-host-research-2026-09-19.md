---
project: nomad-mvp
date: '2026-09-19'
story_id: '9.1'
story_key: 9-1-capacitor-app-installation-and-host-foundation
purpose: bounded-technical-and-resource-research
status: research-complete-runtime-unverified
proposal: _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-19.md
contracts_appendix: _bmad-output/planning-artifacts/sprint-change-capacitor-contracts-2026-09-19.md
source_head: 7250a8a131a370698bff53538a4405c2ddb94c1c
source_branch: codex/story-1-0-production-auth
dependency_install_performed: false
native_project_generation_performed: false
native_build_performed: false
device_install_verified: false
secrets_read: false
---

# Story 9.1：Capacitor 宿主、工具链与资源研究

本报告支持已获用户批准的 Capacitor 范围变更及 9.1 合同准备；研究不替代正式 `epics.md`、实施合同或当前 Sprint 状态。范围限于现有 React 入口、最小宿主、官方版本和构建条件，不实现登录、定位、文件、统计或分发业务。官网、官方源码和 npm 发布元数据的查阅日期均为 **2026-09-19**。

## 1. 可直接采用的技术决定

1. 在 `apps/mobile` 复用 React 19.2.7 / Vite 8.0.16，不另建 Ionic UI 或另一套路由/业务工程。Capacitor 自身不要求 Ionic Framework。
2. 四个主体包精确锁定 **8.5.2**；本 Story 的外装插件仅 `app@8.1.1`、`keyboard@8.0.5`、`browser@8.0.4`。系统栏直接用 core 内置 **SystemBars**。不为 9.1 提前安装业务插件。
3. 新 iOS 工程使用官方 8.5.2 **SPM + UIScene** 模板。WSL 可做模板生成、Web 构建和原生资源同步；iOS 编译、签名、设备安装仍需 macOS/Xcode。此结论来自 CLI 源码检查，当前研究没有实际生成工程。
4. 产品最低 OS 继续为 Android 10 / API 29、iOS 16.0；Android 编译/target 采用官方 8.5.2 模板的 API 36。最低安装 OS、WebView 版本和 JavaScript 构建目标分别记录、分别验证。
5. `App.tsx` 当前用 React state 切换页，不能以 `window.history.back()` 代替宿主返回协议。系统返回按键盘→弹层→当前子页→根页后台执行，同一事件只处理一层。
6. 当前 Vite 8 默认最低 Safari/iOS 是 **16.4**；要守住获批的 iOS 16+，需显式覆盖 `safari16` / `ios16` 并核验实际 Web API/CSS，不能只改 Xcode deployment target。

版本与宿主 API 的官方依据：[Capacitor 8.5.2 release](https://github.com/ionic-team/capacitor/releases/tag/8.5.2)、[SystemBars](https://capacitorjs.com/docs/apis/system-bars)、[Vite 8 target](https://v8.vite.dev/config/build-options#build-target)。8.5.2 包含 Android 权限注解空值、safe-area/SystemBars，以及 iOS 页面加载前 scene 生命周期转发的修复，适合此轮新宿主起点。

## 2. 最小依赖与工具链

### 2.1 精确版本

以下版本来自各官方 npm package 的 `dist-tags.latest`，并核对 peer dependency 和许可证；运行安装时仍应验证锁文件实际解析。所有下列包元数据许可证均为 MIT。

| 包 | 建议锁定 | 发布日期 | 放置 / 责任 |
| --- | --- | --- | --- |
| `@capacitor/core` | `8.5.2` | 2026-09-11 | mobile dependencies；含 SystemBars、平台判定和桥接 |
| `@capacitor/android` | `8.5.2` | 2026-09-11 | dependencies；peer core `^8.5.0` |
| `@capacitor/ios` | `8.5.2` | 2026-09-11 | dependencies；peer core `^8.5.0` |
| `@capacitor/cli` | `8.5.2` | 2026-09-11 | devDependencies；Node `>=22.0.0` |
| `@capacitor/app` | `8.1.1` | 2026-07-15 | dependencies；生命周期/返回/启动 URL；peer core `>=8.0.0` |
| `@capacitor/keyboard` | `8.0.5` | 2026-06-16 | dependencies；键盘通知/隐藏；peer core `>=8.0.0` |
| `@capacitor/browser` | `8.0.4` | 2026-07-15 | dependencies；受控外链；peer core `>=8.0.0` |

元数据入口：[core](https://registry.npmjs.org/@capacitor%2fcore/8.5.2)、[CLI](https://registry.npmjs.org/@capacitor%2fcli/8.5.2)、[Android](https://registry.npmjs.org/@capacitor%2fandroid/8.5.2)、[iOS](https://registry.npmjs.org/@capacitor%2fios/8.5.2)、[App](https://registry.npmjs.org/@capacitor%2fapp/8.1.1)、[Keyboard](https://registry.npmjs.org/@capacitor%2fkeyboard/8.0.5)、[Browser](https://registry.npmjs.org/@capacitor%2fbrowser/8.0.4)。

`SystemBars` 无须另外查找/安装 `@capacitor/system-bars`。`status-bar@8.0.3` 是另一个可用官方包，但本次现代 edge-to-edge 路径不需要它；也不需要为键盘修复同时装第三方 edge-to-edge 包。`splash-screen@8.0.2`、`network@8.0.1` 可按真实 UX 缺口后续采用，不是基础安装前置。网络错误以实际请求结果判断，`navigator.onLine` 或 Network 状态不能证明 API 可达。

U-App/U-Link、PNVS、认证安全存储、Geolocation、Filesystem/Share/相册、Sentry 由各自 Story 选型和接入；当前七包版本兼容不证明这些未来 SDK 兼容。

### 2.2 构建矩阵

| 项目 | 官方 8.5.2 / v8 基线 | 本项目采用与当前证据 |
| --- | --- | --- |
| Node / pnpm | CLI Node 22+ | WSL `/usr/bin/node` v22.22.1、`/usr/local/bin/pnpm` 11.7.0 已只读验证 |
| Android Java | Capacitor Android `sourceCompatibility` / `targetCompatibility` = Java 21 | 使用 Linux JDK 21；本机 PATH 未定位 java/javac |
| Android Gradle | 官方发布 CLI 内模板 AGP 8.13.0；wrapper 8.14.3 | 使用工程 wrapper；不调用当前 PATH 的 Windows Gradle 8.10.2 |
| Android SDK | 模板 min 24、compile 36、target 36 | 产品 min 调到 29；compile/target 保持 36；本机未定位 sdkmanager/adb，Android SDK 环境变量未配置 |
| Android IDE | 官方最低 Android Studio Otter 2025.2.1 | GUI 调试可用兼容 IDE；Linux 命令行构建实际前置是 JDK、SDK 与 wrapper，不以打开 IDE 当构建证据 |
| iOS OS / IDE | 框架最低 iOS 15、Xcode 26.0+、macOS | App deployment target 16.0；当前 WSL 没有 xcodebuild，未核验外部 Mac |
| iOS dependency manager | Capacitor 8 默认 SPM | 本 Story 优先 SPM；未来供应商 SDK 如迫使变更，记录实际依赖理由与迁移，不预装 CocoaPods |

依据：[环境要求](https://capacitorjs.com/docs/getting-started/environment-setup)、[v8 升级基线](https://capacitorjs.com/docs/updating/8-0)、[8.5.2 Android build.gradle](https://github.com/ionic-team/capacitor/blob/8.5.2/android/capacitor/build.gradle)。AGP/wrapper/SDK 数值还通过 npm 官方 `@capacitor/cli@8.5.2` tarball 的 `assets/android-template.tar.gz` 逐项读取；没有执行其中脚本或安装依赖。

当前 shell 是 Linux / WSL2（kernel `6.18.33.2-microsoft-standard-WSL2`）。只读 PATH 检查仅说明当前 shell 条件，不断言用户其他机器没有 JDK、Mac、开发者账号或真机。

## 3. WSL 生成与 macOS 构建的分界

在包名/Bundle ID 与锁定依赖已就绪后，候选命令应从 `apps/mobile` 执行：

```bash
pnpm exec cap add android
pnpm exec cap add ios --packagemanager SPM
pnpm run build
pnpm exec cap sync android
pnpm exec cap sync ios
```

这些是后续执行建议，**本研究没有运行**。`cap add` 内部会在已有 `webDir` 时触发 sync；没有 Web 资源时会给出跳过 sync 警告。不要把 “platform added” 当成编译、签名、安装完成，也不要为了绕过 add 检查伪造包名或 Xcode 可执行文件。

源码依据：[`tasks/add.ts`](https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/tasks/add.ts)调用模板解包和平台设置；[`ios/common.ts`](https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/ios/common.ts)的 SPM 检查不要求在 macOS 上运行；[`util/spm.ts`](https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/util/spm.ts)生成 `Package.swift`。因此 **WSL 生成/同步 SPM 工程可行是基于锁定版本源码的推断，尚非本仓库运行证据**。[官方 cap add 参数](https://capacitorjs.com/docs/cli/commands/add)包含 `--packagemanager SPM`。

后续 Mac runner 使用受控源 revision/未提交内容摘要、锁文件、Web bundle 摘要与环境记录；解析 SPM 依赖、生成实际 `Package.resolved`，再执行 Xcode 构建/签名。应记录 Node/pnpm/Xcode 路径和版本，不能直接复制 WSL `node_modules`、复用不明缓存，或只引用旧 HEAD 描述带未提交改动的候选。

App ID 是公开配置而非密钥，但必须核对既有 PNVS/U-App/Apple/微信登记、签名指纹及升级连续性。当前已读脱敏记录没有给出可确认的 Android applicationId、iOS Bundle ID、Team 或签名引用；不从产品名猜测正式标识。缺少这些可先实现可注入的配置校验/宿主边界，真实原生工程和候选关闭仍需补齐。

## 4. 配置与入口的最小改动

### 4.1 Capacitor 配置形状

以下为配置约束示意，`confirmedAppId` 由公开配置/安全引用核实后提供，不能原样作为占位发布：

```ts
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: confirmedAppId,
  appName: 'Nomad',
  webDir: 'dist',
  backgroundColor: '#f8faf7',
  loggingBehavior: 'debug',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: false,
  },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  ios: { contentInset: 'never', webContentsDebuggingEnabled: false },
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'LIGHT', hidden: false },
    Keyboard: { resize: KeyboardResize.Native },
  },
};
```

候选配置不设置 `server.url` 或宽泛 `allowNavigation`；内置 Web 资源通过本地 origin 启动。Android `https://localhost`、iOS `capacitor://localhost` 是宿主来源，后端是独立的已核验 HTTPS API；它们不是身份凭据。远端 API、公共协议地址、原生 appId 都应是明确的可公开配置。签名私钥/密码、云 AK、PNVS 服务端 appKey 不能进入 Vite 客户端环境或 Capacitor JSON。[配置定义](https://capacitorjs.com/docs/config)

`loggingBehavior: 'debug'` 表示生产不启用 Capacitor 常规日志；仍要检查应用自身日志。`SystemBars.style='LIGHT'` 的 API 语义是浅色背景上的深色系统图标，符合当前浅色界面；如支持深色主题应同步调整。配置和截图仍需真机核验。

### 4.2 现有文件：改什么、保留什么

| 文件 | 2026-09-19 读取时实际状态 | 9.1 的改动边界与应保留内容 |
| --- | --- | --- |
| `apps/mobile/package.json` | React/Vite、测试与构建；无 Capacitor | 添加上述精确依赖和明确的 native sync/build 脚本；保留 Web build/test，不升级无关库 |
| `apps/mobile/vite.config.ts` | 只有 React plugin 和 jsdom 测试配置 | 明确 App 资源输出及 JS/CSS target；保留现有 Vitest 行为；不用 dev server 地址生成候选 |
| `apps/mobile/index.html` | 已有 `viewport-fit=cover`，HTML 入口和 root | 保留；App 最低 OS 不要求另造 HTML 页面体系 |
| `apps/mobile/src/main.tsx` | `StrictMode` 包裹同一个 App | 宿主生命周期的注册/注销需在 StrictMode 重挂载下安全；不关闭 StrictMode 来隐藏重复监听 |
| `apps/mobile/src/App.tsx` | 首次 `/me` 检查；`currentUser`、`plannerHandoff`、`view` React state 导航 | 在当前页面树注入平台服务、返回注册及恢复通知；保留现有 auth 判断、Home/Planner/Settings 回调；与正在开发 1.0 的最新会话实现合并 |
| `apps/mobile/src/auth/LoginScreen.tsx` | 可注入 `platform`、`openExternal`；平台默认看 UA；协议依赖远端 config；`openExternal` 当前 void；保留 loading/error/retry | 注入真实 Capacitor 平台与受控外链。要处理异步打开失败，调整为可等待的结果；保留 Apple/phone/wechat 顺序和测试；不要复制登录页面或启用测试 captcha |
| `apps/mobile/src/auth/api.ts` | 默认 API `http://localhost:3000`；带 cookie 的 fetch | Native 候选缺真实 HTTPS API 应在配置/构建阶段明确失败，不带开发默认值；9.1 不自行改认证传输，交给 1.0 的 Native Session ADR |
| `apps/mobile/src/auth/device.ts` | localStorage 保存 `web_*` device fingerprint | 它仅是元数据，不是凭据；不能把它改作原生会话安全存储 |
| `apps/mobile/src/styles.css` | 多个页/底栏各自使用 `env(safe-area-inset-*)`；根和登录用 `100vh` | 统一 inset token，并明确每条边由哪个布局消费；评估 `100dvh`/键盘滚动，不在 html 和页 shell 重复加 padding |
| `apps/mobile/src/settings/SettingsScreen.tsx` | 外链接受异步返回，只有 `opened===true` 当作打开成功 | 若复用同一服务需适配 boolean/结果合同；Browser.open resolve 是 void，不能原样注入导致恒走失败；7.6 继续负责真实反馈提交及 mailto 占位纠正 |

现有 auth/client 文件可能由 1.0 同轮继续修改，实施者必须重读工作树后合并以上改动，不能用这份快照覆盖最新进展。代码形状来自当前文件，未从旧迁移镜像复制。

### 4.3 Vite/最低 WebView 的显式决策

已在本机 `apps/mobile/node_modules/vite/dist/node/chunks/logger.js` 与官方 v8 文档同时核对默认 target 为 `chrome111 / edge111 / firefox114 / safari16.4 / ios16.4`。建议保留现有桌面默认，仅将本期 iOS 条目改为 `safari16` / `ios16`；Android 实际最旧 WebView 必须与生成目标对齐后再固定。若选 Chrome 111 为最低运行内核，需在支持矩阵明示并处理旧内核，不能写成所有 Android 10 自带 WebView 都已支持。Capacitor 的默认 `minWebViewVersion: 60` 也不能证明此 bundle 支持到 60。[Vite 8 生产构建](https://v8.vite.dev/guide/build)、[Capacitor 配置](https://capacitorjs.com/docs/config)

转译仅覆盖可转译语法，不自动补齐全部 Web API/CSS。iOS 16.0 / 16.4、Android API 29 + 实际最旧支持 WebView，以及当前稳定 OS/WebView 各留证据；没有真机前是构建目标决定，不是兼容性通过。

## 5. 宿主 API 与容易漏掉的行为

### 5.1 返回与恢复

建议 `src/platform/` 只暴露平台信息、前后台订阅、返回 handler 注册、键盘状态/隐藏、受控外链和启动 URL 通知；不要先建立任意命令的通用原生 RPC。

- `App.addListener('backButton', ...)` 仅 Android；注册后取代默认返回。`canGoBack` 反映 WebView history，不反映当前 React state。根页使用 `App.minimizeApp()`，不强制杀进程。官方 App 8.1.1 Android 源码使用 `OnBackPressedDispatcher`，无需为基础宿主添加旧 `onBackPressed`/KEYCODE_BACK 截获。[App API](https://capacitorjs.com/docs/apis/app)、[官方 App 源码](https://github.com/ionic-team/capacitor-plugins/tree/main/app)
- 返回分发使用显式优先级、一个 handler 消费一次；弹层内部按现有取消/草稿规则处理。键盘先被系统消费时不能再派发页面返回；应用收到返回且键盘仍可见时才隐藏并停止分发。Android 16 target 36 的预测返回行为需真机验证，不以全局关闭预测返回代替问题定位。[Android 16 行为变化](https://developer.android.com/about/versions/16/behavior-changes-16)
- 使用 `appStateChange` 作为单一宿主状态源，初始 `getState()` 与后续事件按状态变化去重；不要同时无差别把 `resume`、`visibilitychange`、`pageshow` 三路都转换为新恢复。Web fallback 独立处理浏览器事件。
- `PluginListenerHandle.remove()` 成对释放；异步 addListener 在 effect 已清理之后才完成，也应立即 remove。不要使用全局 `removeAllListeners()` 误删 1.0/1.6 的订阅。
- iOS 新模板保留 `SceneDelegate.swift`、Info.plist scene manifest 和 `SceneDelegateProxy` 的 URL/universal-link 转发；`getLaunchUrl()` 与 `appUrlOpen` 分别覆盖冷/暖启动。9.1 只传递/筛选宿主事件，身份校验归 1.0、输入去重归 1.6。[8.5 UIScene 变更](https://capacitorjs.com/docs/updating/8-5)
- 本工程没有 UINavigationController 页面栈；iOS 的业务返回必须消费同一取消/草稿保护协议，不假定 WKWebView history 手势会自动返回 React 子页。不得添加会越过未提交修改保护的独立 swipe 路径。

### 5.2 安全区域、键盘与系统栏

Android target 36 在 Android 16 上不能继续 opt out edge-to-edge。使用 Capacitor 8 SystemBars 的 CSS inset 注入，兼容旧于 WebView 140 的原生 inset 问题；保留 Web/iOS 的 `env()` 回退。[SystemBars API](https://capacitorjs.com/docs/apis/system-bars)、[Android edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)

```css
:root {
  --nomad-safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
  --nomad-safe-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
  --nomad-safe-left: var(--safe-area-inset-left, env(safe-area-inset-left, 0px));
  --nomad-safe-right: var(--safe-area-inset-right, env(safe-area-inset-right, 0px));
}
```

只把既有布局对 inset 的消费改为公共 token，不同时在 html、page shell、底栏为同一边叠加。iOS 保持 `contentInset:'never'` 时由 CSS 统一负责；插件也不再用旧 `adjustMarginsForEdgeToEdge`（v8 已删除）。键盘先用原生 resize；`resizeOnFullScreen:true` 仅在实际 Android 全屏/键盘矩阵证明需要时启用，避免猜测性双重补偿。读取 `keyboardDidShow/DidHide` 建立可见状态，必要时 `Keyboard.hide()`；中文输入组合、大字号、读屏焦点、浮动/硬件键盘仍需实测。[Keyboard API](https://capacitorjs.com/docs/apis/keyboard)

### 5.3 外链和断网首屏

`Browser.open({url})`：Android 是 Custom Tabs，iOS 是 SFSafariViewController，不把外部页面导航进带桥接的业务 WebView；在平台 adapter 之前解析 URL、限制协议/获准目的地、拒绝 userinfo/未知 scheme。绝不传会话头、私人 query 或签名下载地址。普通 Browser 的返回通知只说明浏览器结束，不代表登录或反馈提交；系统认证会话由 1.0 另选适用实现。[Browser API](https://capacitorjs.com/docs/apis/browser)

Android 无 GMS 不等于没有系统浏览器；Browser 的 Custom Tabs 路径应在目标国内设备核验。没有可处理外链的应用时显示可恢复失败，不静默跳入 Nomad WebView，也不为此打开宽泛导航允许集。

断网启动不能等待 `/me` 永不结算，也不能只有空白屏。当前首屏协议按钮从远端 auth config 获得 URL；文件名清单未发现 mobile 已打包的 terms/privacy 资源。因此要消费已有真实协议内容并落实本地公开说明/重试路径；不能为过 9.1 写虚假的合规文本或把远端协议当作断网可读。联网恢复交给会话责任方校验后才显示私人数据。

## 6. 可以推进与不能关闭的验收

| 验收项 | 本研究观察到的条件 | 可继续的工作 / 不能据此关闭的项 |
| --- | --- | --- |
| Web/平台代码 | WSL Node/pnpm 可用、现有 React 首屏存在 | 可实现/测试配置隔离、宿主 adapter、键盘/返回/外链拒绝、监听竞态；Web build 或 jsdom 不证明原生能力 |
| 原生工程生成 | 官方 8.5.2 模板/CLI 源码可用；实际标识未确认 | 可写实现合同与模板校验；标识确定后再生成正式工程并记录结果 |
| Android 构建 | 当前 Linux JDK/SDK/adb 未定位 | 可完成代码，随后补受控工具链再构建；Windows Gradle 存在不算 Linux 构建链 |
| iOS 编译/签名 | 当前为 WSL；外部 Mac/Xcode/Team/profile 未核验 | WSL 的 ios 目录与 sync 不能关闭 AC1/AC8 的 iPhone 安装 |
| 双端真实安装/交互 | 未连接或核验真机 | 安装、冷启动、键盘、返回、inset、无 GMS、无网/恢复均保留未验证；录屏/截图必须对应真实候选 |
| 真实认证/SDK | 1.0 有独立资源和实现进度，本研究未验证供应商 | 9.1 可验首屏和真实 unavailable；不得声称登录/U-App/会话/SSE已完成 |
| TestFlight | 方式已由用户确定，当前没有账号/测试组/build 实证 | 属 9.2；macOS build/IPA/上传受理不等于测试组可安装 |

TestFlight 必须绑定实际开发团队、App Store Connect 应用、profiles、测试组与 build。内部测试者是拥有应用访问权的 App Store Connect 用户；外部测试存在适用审核流程，build 最长可测试 90 天。选择方式不授权邀请未知人员或扩大账号角色；记录允许测试组及实际安装/到期状态。[Apple TestFlight 流程](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)

9.1 SDK/权限清单只记实际使用：应用联网与基础宿主，不预开相册/定位/相机/后台任务；各消费 Story 再增量记录 AndroidManifest、Info.plist 用途、entitlements 和实际 required-reason API/Privacy Manifest。9.2 对最终二进制重新核对，不能照抄无关权限或原因代码。[Capacitor Privacy Manifest](https://capacitorjs.com/docs/ios/privacy-manifest)

本报告没有运行依赖安装、原生生成、编译、设备操作、供应商调用或签名；仅新增此研究文档。当前实际开发状态由主代理同步的 CURRENT/Sprint/9.1 合同决定，资源缺口不能标记为 Story done，也不阻止独立可做的代码与后续准备工作。
