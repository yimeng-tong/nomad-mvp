# Capacitor 执行决策与协调记录

授权依据：`_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`。用户允许在已批准范围内先决策并记录背景和后果，无需逐Story再授权。

## D01：共享工作树写入责任

背景：Nomad Sprint Planning 当前轮次仍在开发1.0，两个任务共享同一WSL目录。用户允许直接插入变更消息。

决定：本任务负责规划/合同/Sprint/CURRENT/交接guard及9.1的src/platform、main.tsx、独立宿主CSS和原生工程；原任务继续apps/server、apps/mobile/src/auth、既有业务API、App.tsx、Settings，开发进度写独立1.0记录。已直接发送消息，原任务已确认该边界。

后果：主恢复入口暂保留1.0，Sprint另记active_workstreams；9.1准备/开发进度单独追踪，避免两个任务抢改当前入口。规划同步/检查完成后发送正式交接，再移交持续状态维护。共享依赖安装使用已存在的 `/tmp/nomad-sp-pnpm-store`；原任务确认当前没有安装在运行，需要再加依赖时先协调。

## D02：原生会话与宿主接口分工

背景：Web正在实现受保护Cookie/Origin/公开owner-session预期上下文，不能直接假定原生WebView共享cookie。

决定：1.0形成独立native认证/传输wire ADR，共用现有PG身份会话权威；候选路线是原生持有Bearer与登录绑定秘密，安全存储、受限path/固定API origin、API/SSE/下载同一身份，JS只获得公开DTO/预期owner-session与代际。未完成真实bridge时明确unavailable，不用Web cookie或JS明文secret回退。最终方案必须由双端实证确认。

9.1只提供宿主平台接口：返回处理注册、去重的原生恢复订阅、受限外链打开和启动事件。业务认证由1.0实现，App/Settings入口由原任务接入这些接口，避免重复改写。

## D03：工具链和兼容目标

背景：官方研究确认Capacitor8.5.2与已有Node22/React19/Vite8可作为起点，Vite8默认iOS16.4高于已批准iOS16.0。

决定：精确锁定core/cli/android/ios 8.5.2，app8.1.1、keyboard8.0.5、browser8.0.4；SystemBars使用core内置能力，9.1不提前引入业务插件。明确Web bundle target为iOS16/Safari16，Android minSdk29与实际WebView最低版本分别记录。iOS使用官方SPM/UIScene模板。

后果：WSL可做代码/生成/同步，但不据此宣称macOS编译、签名、真机或TestFlight已通过。工具/签名/设备资源继续核验，单端缺项不停止独立实现。详见research/story-9-1-capacitor-host-research-2026-09-19.md。

## D04：开发标识、最低WebView与公开构建配置

背景：当前没有已核验的正式applicationId/Bundle ID/签名关联，不能据产品名假定已登记。用户允许先决定可逆实现并继续独立工作。

决定：仅本地development采用`dev.nomad.mvp`与显示名`Nomad Dev`生成/编译开发工程；不注册商店、不用于真实供应商绑定、不作为正式ID已验证证据。staging/release必须显式提供非开发ID和纯HTTPS API origin，apiBasePath独立默认/api，不能带用户信息、query、hash或/api路径；开发缺API保持空值，使原生认证真实unavailable。只拷贝这些公开配置，服务端env不加载或打包。正式ID未核验仍阻断相关AC关闭。

Android最低OS29与WebView内核分别处理：构建目标保留Chrome111基线并显式配置minWebViewVersion111；旧内核显示本地更新/恢复说明，不假称Android10任意旧内核已支持。iOS16/Safari16显式构建，真实兼容仍待设备核验。

后果：原生生成/开发APK可先验证构建链，正式ID变更、供应商登记和签名连续性由后续实证落实；9.2发布不可使用开发命名空间。配置错误只返回字段级错误码，不回显来源秘密。

## D05：工具安装、构建与日志

背景：当前WSL没有Linux JDK/SDK；Windows Gradle不能作为项目工具链。

决定及实证：在/tmp/nomad-native-tools隔离安装官方Temurin JDK21.0.12.1+1（SHA256核验）和官方Android命令行工具19.0（官方repository checksum核验），仅安装API36与需要的build/platform tools；sdkmanager安装接受本次Android开发所需的标准SDK许可，无额外账号/付费服务。最新命令行工具的自动CLI目录写入在受限环境失败，固定19.0而不改HOME或系统配置；仅在子进程中移除空的proxy变量以修正SDK解析，不移除有效代理。

Gradle wrapper8.14.3第一次实际assembleDebug成功（213 tasks），包含已注册的原生认证安装骨架；AGP还按其默认需求安装build-tools35.0.0，记录实际工具结果而非假设只有36。后续认证实现和宿主修补需重新构建，首个APK不是最终业务验收。

Capacitor loggingBehavior固定none，避免开发/测试包中的桥接参数被框架日志采集；本地调试开关只在development可用。正式候选的配置/签名/实际设备另验。

## D06：批准和生成物完整性

限定审阅复现了仅刷新派生哈希即可污染批准快照的漏洞，已把原始manifest摘要与批准记录摘要一起固定在guard；没有改写原批准文件或快照。APP-HOST关闭按实际绑定而非是否有Cxx段判断。生成配置按全部源字段深比对，不能用相同ID/API掩盖旧开发/混合内容/内核配置。

异步返回在注册集合变化、组件卸载、后台或宿主停止时取消，提供可选AbortSignal给异步消费者；既有同步handler保持兼容。原生hide回执受键盘事件epoch限制。相关选择是明确安全修补，无新的产品范围，已直接实施并测试。

## D07：原生HTTP库与平台模板的实际兼容性

最新原生认证实现选择OkHttp5.5.0后，Gradle实际AAR检查要求compileSdk37；Capacitor8.5.2模板为AGP8.13/compile36。没有压制检查或用旧APK冒充通过。由1.0依赖负责人核对官方Maven AAR和上游说明后固定正常Android artifact5.4.0（minCompileSdk36），保留当前平台基线；不用JVM artifact替代Android实现。相关安全/功能取舍详见packages/native-auth/ADR.md。

配置端与原生实现共同限制固定HTTPS DNS-name origin，拒绝IP字面量及相关规范化歧义；不启用ECH/QUERY/multipart等未使用能力，保持明确超时、无自动重试/重定向和无CookieJar。构建时提前拒绝不支持的origin，而不是运行时含糊503；新反例进入配置测试。

随后编译暴露插件缺显式AppCompat编译依赖，由1.0在自身Gradle按根版本1.7.1补齐；宿主没有盲升AGP或修改认证源码。每轮结果在9.1进度/本地证据更新，最终以实际复编译为准。


## D08：持续目标与独立切片推进

背景：App任务已完成正式交接。主任务读取了其2026-09-19实际用户消息，确认“除不可绕过的必需资源硬阻断外持续推进后续BMAD、无需进一步授权（相当于goal模式）”明确针对当前任务。

决定：创建无指定token预算的持续执行目标；主任务接管CURRENT/Sprint/必要宿主维护。1.0和9.1真实门槛保持in-progress，接着准备并开发1.6可独立的代码/隔离验证。1.6最小job快照/受理/原job retry/状态版本/真实partial是诚实队列必需，不将1.7完整事件cursor或1.8 ImportRecord倒灌；生产fake适配器必须明确不可用，不用真实身份把假内容当导入完成。

后果：不再停在“等待继续”；每张Story按实际证据独立关闭，保留所有下游真实依赖和3.1暂停。已有法律/设备资源问题复用，不重复索取Key；缺项只阻断依赖验收。没有授权真实SMS目标/次数、真实账号grant、旧数据认领或公有云提前发布。
