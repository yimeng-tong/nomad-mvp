# Story 9.1 开发进度（2026-09-19）

状态：**in-progress**。用户已批准范围与持续推进；这里记录实际实现和验证，不代表双端安装/真实身份或最终测试分发完成。

## 已完成的本地工作

- 已同步PRD/架构/UX/Epics、1.0现行18组GWT、当前catalog/delivery与来源指纹，准备并启动9.1；保留旧SP/历史done/3.1暂停。当前9 Epic/62 Story/1052 GWT/66 FR/25 NFR。
- 精确安装Capacitor core/cli/android/ios8.5.2、app8.1.1、keyboard8.0.5、browser8.0.4及本地native-auth workspace链接；原Fastify/PNVS等并行依赖保留。
- 实现公开配置校验、development/staging/release隔离、iOS16构建目标、Android WebView111下限及本地不可用页面。开发namespace为dev.nomad.mvp；正式标识/签名关联仍未验证，API未配置时保持原生认证不可用。
- 实现typed宿主接口、返回优先级/取消、键盘epoch、原生恢复去重、StrictMode/迟到listener清理、URL事件与安全外链。main保留StrictMode，使用独立CSS统一safe-area/dynamic viewport；既有App/各弹层由1.0写入者按分工接入。
- 实际生成并sync Android与SPM/UIScene iOS工程；minSdk29、iOS16、手机竖屏、开发scheme/0.1.0版本。后续已注册原生认证插件；注册不代表其网络/存储/真实身份验收完成。
- 新增native:preflight、native:verify、NATIVE.md。校验生成配置全部安全/兼容字段、应用标识、插件登记及复制assets摘要；明确不评估真实设备证据。
- 三层限定代码审阅的7项问题均修复，见[审阅记录](story-9-1-scoped-code-review-2026-09-19.md)。原批准快照摘要固定，所有APP-HOST绑定Story都需关闭证据，不能只为新增Cxx段检查。

## 验证结果

本地证据清单：[story-9-1-local-validation-2026-09-19.json](story-9-1-local-validation-2026-09-19.json)。其中保留实际源码摘要和未验证项目；这不是kind=real-runtime的app_delivery_evidence。

- 宿主配置/运行时：48项通过；原生配置proof：3组通过。
- 全mobile：142项Vitest通过，加3组独立Node proof。曾因Vitest收集node:test文件失败，已明确隔离并将Node proof纳入标准test命令，最终两者通过。
- 工作区 `pnpm -r build` 通过；服务端与移动端类型/构建成功。此前并行认证测试类型错误已由对应写入者修复，不被本任务覆盖。
- handoff当前校验通过；60项guard回归通过，包括原43项历史/迁移/授权/进度和本次升版/真机证据/快照伪造反例。
- 双端源码、插件登记和copied Web assets校验通过。iOS未编译，不能把WSL同步当作Xcode实证。
- Android基础宿主首次 `assembleDebug` **真实成功**（213 tasks，2m57s），当时认证插件为明确未就绪骨架。后续OkHttp5.5.0的API37约束和缺AppCompat编译类型已通过正常Android artifact5.4.0及显式AppCompat1.7.1解决。最新代码与原任务稳定后的Web资源已重新sync，最终assembleDebug真实通过（213 tasks，10s）；APK的所有Web assets摘要与最终manifest一致，调试签名v2验证通过。

工具隔离在 `/tmp/nomad-native-tools`：已核验Temurin JDK21.0.12.1+1、官方cmdline-tools19.0、SDK platform36、build-tools35/36、platform-tools和Gradle8.14.3。旧latest工具目录写入失败与空proxy解析问题已在局部环境解决，未改HOME、系统配置或既有服务器/数据。

## 当前开放门槛与继续方式

1. Android编译兼容阻断已解除，后续继续实际设备/真实服务联调；依赖升级再次核验，不删AAR要求。认证代码由1.0任务维护，宿主配置/记录按正式交接继续。
2. 正式包名/Bundle ID、真实签名、Android/iPhone设备、Mac/Xcode/Apple团队/TestFlight资源未获完整实证。已在本任务提过一次资源问题，等待名称/配置位置，不请求聊天发送秘密值、不反复问同类。
3. 首屏正式隐私/用户协议内容/URL尚需核实；1.0任务已向用户询问并将缺项显示为真实未就绪，不编造政策或死链接。宿主可继续测试，实际登录关闭仍需真实路径。
4. 双端实际安装、键盘/返回/safe-area/权限、前后台/进程重建、真实登录/归因及性能样本仍待验收；iOS/TestFlight不能由Android构建或模拟截图替代。

保持1.0和9.1 in-progress；9.2仍backlog。用户已授权在硬资源阻断期间继续独立工作和后续准备，但真实依赖、paused3.1及关闭条件仍保留。主恢复入口保留1.0，9.1通过active_workstreams/本记录追踪。

## 最终本地Android产物

开发APK：`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`；19,788,521 bytes，SHA-256 `82c47b9b527da22fae3f702539bcc470e3262b91f6b2fc6acfdb0a063d973be0`。配置为dev.nomad.mvp/Nomad Dev，未配置真实API origin；真实手机登录/归因不由此完成。APK与构建输出保持Git忽略，正式签名/真实安装和TestFlight仍未验收。

30分钟heartbeat已创建且ACTIVE（nomad-app）；正式交接及去重状态见capacitor-main-task-handoff-2026-09-19.md与capacitor-task-monitor-state.json。当前任务只做阶段交接，1.0/9.1均保持in-progress。


## 主任务Story1.6宿主消费追加

Clipboard8.0.1已固定并双端sync注册，当前dev.nomad.mvp自定义scheme静态核验通过。主任务以最新1.6源码重新构建Android debug（243 tasks）并验证v2签名，APK SHA256 `35251310c690598b7295e193c665fe86e1f3470e9d821cbb9786a1e44ee0d252`。本证据覆盖注册/资源/构建，仍不是Android设备或iOS编译实证；详情和源指纹见story-1-6-local-validation-2026-09-19.json。1.6的已确认动作跨进程journal及真实归因仍在后续工作中，9.1不标done。


### 主任务1.6日志接线后的构建更新

1.6已接通确认前持久化/原operation恢复，修复旧Chromium自定义scheme解析兼容；两进程浏览器+真实IDB+明确鉴权/API替身证明通过。双端sync/注册/资源核对与Android243 tasks及v2 debug签名通过，当前APK SHA256 `14cf310bb890bbdded864903a3dde18be0a3754764cc2acf5bc221afae341f7c`。这仍不证明真实原生设备、iOS编译或U-Link/U-App接通；其门槛保留。具体源码/资源指纹见story-1-6-local-validation-2026-09-19.json。


## 2026-09-26 共享UI迁移受影响回归

9.3在实际Login/Home/退出入口迁移共享UI，本Story受影响范围及原auth6/真实PG-SSE-IDB6回放见story-9-3-integration-impact-2026-09-26.md。当前aeadc1e完整CI36184294356通过，129产品场景/33视觉和6三引擎组件补证、265移动+5配置保持；原controller/journal/cursor与历史证据未重写。9.3四项UI条件只在9.3范围verified，本Story状态及自身条件没有自动关闭；真实供应商/归因/设备/生产恢复仍按原合同验收。
