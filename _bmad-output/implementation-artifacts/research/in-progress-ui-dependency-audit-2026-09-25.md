---
project: nomad-mvp
date: '2026-09-25'
scope: in-progress-stories-1.0-1.6-1.7-9.1-and-immediate-ui-dependencies
method: read-only-current-contract-progress-evidence-and-source-audit
runtime_tests_executed: false
external_environment_accessed: false
implementation_changes: false
shared_state_changes: false
execution_direction: user-has-released-the-story-1.7-stop-boundary
story_3_1_pause_preserved: true
---

# 在制 Story 的 UI 依赖与剩余工作审计

这四张 Story 都有可复用的实际实现。1.0/1.6 的许多原 Tasks 尚未勾选，但最新 dev-progress、local-validation 和当前代码已覆盖其中大量工作，不能从勾选数推断“尚未开发”。1.7 的独立恢复实现已收口到真实平台、生产恢复及指标门槛；9.1 的基础宿主与新版最低平台配置已实施，真实安装与 iOS 构建仍未验收。1.0/1.6 另有第三方登录及真实遥测的业务接线工作，不能全归为纯资源等待。

本报告只用于 root 安排即时开发与更新 Sprint；唯一新增文件是本文件。没有改 Story/Tasks、CURRENT、Sprint、catalog、delivery、代码或依赖，没有新测试、设备/VM/数据库访问或供应商调用。用户最新指令已解除 1.7 完成后停止边界；读取到的 CURRENT 和 9月19日进度报告仍含旧 stop 文字，由 root 统一写入最新决定。该解除不恢复 3.1，不消除其上游条件与 keep/change/remove 审计，也不把真实验收改成可选。

## 证据分层与时效

- **现行合同**：四张实施 Story 已包含 2026-09-20 UI 补充；以当前 ui-foundation catalog/delivery 的条件绑定为准。
- **实施事实**：同名 `story-*-dev-progress-2026-09-19.md` 的最新追加及 `story-*-local-validation-2026-09-19.json`。前半段“尚未接入/下一步”常被后段明确覆盖。
- **准备验证**：`1-0-...-validation.md`、`1-6-...-validation.md`、`1-7-...-validation.md`、`9-1-...-validation.md` 是准备时快照。它们的旧源 hash、14/11/8 GWT 数和“尚未实施”不能覆盖现行合同或后续实现。
- **本次源码核验**：只读取、比较摘要和检查集成入口；没有重新执行历史测试。下表“匹配”表示文件内容与该封存记录一致，不能推出外部资源今天仍在线。

| 封存记录 | 当前源码摘要匹配 | 已变更 | 缺失 | 解释 |
| --- | ---: | ---: | ---: | --- |
| `story-1-6-local-validation-2026-09-19.json` 的 sourceSha256 | 34 | 14 | 0 | controller/model/API/journal/ingest/schema 等被 1.7 继续扩充，平台与构建配置被 UI 范围更新；旧记录仍是原切片证据。 |
| `story-1-7-local-validation-2026-09-19.json` 的 sourceSha256 | 76 | 0 | 0 | 本次读取时该记录覆盖的当前恢复源码逐项一致，可保留其已封存证明范围。 |
| `story-9-1-local-validation-2026-09-19.json` 的 source_files | 83 | 16 | 0 | 后续认证/Clipboard/恢复和 UI 平台同步已改其中部分文件；不以 9.1 早期 APK 证明现在源码。 |
| `ui-foundation-local-validation-2026-09-20.json` 的 working_tree_source_sha256 | 22 | 1 | 0 | 唯一差异是 `scripts/check-handoff.test.mjs`；该记录中的平台配置文件摘要仍匹配。 |

旧测试数量是各自切片的结果，不相加为新的总通过数。1.0 的 JSON 明确将后续共享遥测证据指向 1.6；1.6 journal core 的 `controllerIntegrationVerified=false` 只限定核心探针，同一 JSON 的 `controllerJournalIntegration.passed=true` 和最新追加证明接线后来已完成。不能把两者当互相矛盾或再次要求重做 journal。

## 即时 UI 顺序与责任

正式 migration.dependencies 为 **9.4 无前置 → 9.5 依赖 9.4 → 9.3 依赖 9.4、9.5**。1.0/1.6/1.7/9.1 的 dependencies 均为空；1.0 的 closure_dependencies 单独要求 9.1。新增质量条件与页面迁移任务不等于四张在制 Story 的全部工作现在必须停下等 9.3。

| 新交付 | 对四张在制 Story 的实际影响 | 不应扩成的工作 |
| --- | --- | --- |
| 9.4 工作台/真实 lint | 可以直接消费现有 `HomeSheet` 和 `LoginScreen` 字段；为新改源文件提供 typed lint、可运行状态与 interaction/a11y 证据。 | 不等待 9.3 才有样例；不为演示重写认证、Dock、journal、cursor、原生插件；不把旧 `ci:lint` echo 当通过。 |
| 9.5 浏览器流程/截图 | 先把 auth、Home、Settings、Sheet、owner 遮蔽与 FIFO/回执等旧探针对应到实际浏览器场景，保留跨进程与真实 PG 探针；为后续迁移建立基线。 | Playwright/MSW 不代替 1.7 真实 PG/SIGKILL/SSE/IDB，也不代替 PNVS、真实 SDK 或 Android/iOS。 |
| 9.3 共享 UI/AppSheet | 首个实际 Login 或 Home 消费切片验证共享 Portal、焦点、滚动锁、返回、键盘与身份遮蔽；1.0/1.6 保留各自页面语义和关闭责任，9.1 验证宿主消费。 | 不把本轮所有页面一次迁完，不改变 owner/session、operation、cursor、lease 和回执的权威。 |

截至本次读取，9.4 合同已 ready-for-dev，9.5/9.3 实施文件尚不存在，根 `ci:lint` 仍为占位；Storybook/MSW/Playwright/Base UI/Tailwind 新依赖尚未出现在 mobile package.json。此为本次调查的起点，root 后续即时开发结果应另写其自身记录。

9.6/9.7 后续分别交付普通读取和导航，依赖 9.4/9.5 及 **9.3 已验证本地切片**，不是等 9.3 全部原生关闭。四张在制 Story 的本轮 UI 补证不需要把 Query/Router 一并装入；将来接入也不能用自动 refetch/retry 或导航创建写操作、覆盖原 controller。

## Story 1.0：生产认证与多设备会话

### 已实现、应复用

| 原 Tasks | 当前实现与证据 | 复用边界 |
| --- | --- | --- |
| T0/T1 | 启动配置在网络客户端之前校验，真实/fixture 模式隔离；PNVS proof、登录事务、expected owner/session、logout receipt 和公开会话 DTO 已进入 OpenAPI/生成类型。 | 不能再按原未勾选项新建第二份 auth contract；正式法律缺失仍使新登录不可用。 |
| T2/T3/T5/T6 | 现有 User/OAuthIdentity/Session 扩展为持久权威；credential 摘要与公开 ID 分离、browser generation、owner 资格、operator grant、原 logout 回执、可信旧 owner 映射与旧 Job/HQ/sourceHash 兼容已实施。私有路由和活动 SSE 撤权、回包前复核已接入。 | `apps/server/src/auth/`、现有 Prisma 迁移及业务 owner adapter 是权威；保留历史数据和显式映射，不重新 hash UUID 或凭测试手机号认领旧数据。 |
| T4 的 PNVS | 固定 SDK 和 server verifier、共享预算、PASS-only、发送 unknown 不重发已经有供应商替身反例。 | 替身证明适配/失败语义，真实短信/图形与平台能力仍未验证。 |
| T7 | `App.tsx` 的 checking/unavailable 遮蔽、跨 tab/bfcache/前台身份重核、同次未知退出恢复；`LoginScreen` 的固定 PNVS H5 loader、取消/超时、冷却和先 `/me` 确认；最小 `/ops` 权限校验路径已接入。 | 9.4 复用真实组件和显式注入点；9.3 迁移退出/协议/字段时不改会话状态机或扩成 7.3。 |
| T11 | `packages/native-auth` 的 Android Keystore/AES-GCM、iOS Keychain、精确 HTTPS origin/audience、API/SSE/私有临时下载、generation、取消/遮蔽/退出恢复已写源码，Android 构建记录存在。 | Swift 源码不等于 Mac 编译；API/SSE/下载桥不等于未来导出/相册功能。 |
| T8 的安全基础 | 值级 telemetry 字典及 analytics wrapper 已由 1.0/1.6 共用；许可/runtime 核心与反例存在。 | 不重做字典；当前 App 默认仍是 Noop，真实 SDK/许可 UI 未连接。 |

主要证据：`story-1-0-dev-progress-2026-09-19.md` 最新“原生增量/最小桌面”及“T8 首用遥测”段、同 Story local-validation，以及 `evidence/story-1-0-browser-2026-09-19/report.json`。其中 PG/HTTP 为真实数据库与路由、供应商为显式替身；Chromium 为真实 DOM 与合成身份/API；记录的真实供应商调用数为 0。既有 Flutter/Ionic/第二身份服务均无新增必要。

### 真正剩余项与资源

1. **第三方登录仍有实现缺口**：当前 `apps/server/src/auth/service.ts` 的 production config 仅发布 phone；`LoginScreen.chooseMethod` 对 third_party 只显示“暂未开放”；`packages/native-auth/ADR.md` 明确这些 callback 未实现。T4/T7/T11 中适用的已批准 Apple/微信方式需按实际宿主、资源与启用规则完成后端交换、关联/重放保护及冷暖返回，不能把现有 runtime-config 字段当已接通，也不能只归类为“待真机验收”。
2. **真实登录资源/联调**：正式隐私/用户协议正文或 URL；实际 HTTPS/Origin 与受限 PNVS 验票/发送/核验；三端 PNVS H5/native 方案匹配。已有阿里云凭据、三端图形、短信签名/模板和双端 U-App Key 已提供，不能重新列成缺失或索取密钥。
3. **T8 归因接线**：实际 SDK adapter、持久许可 UI、规范 auth/input 事件、匿名到稳定身份的受控关联、撤回与换账号清理、三端 U-App/U-Link 查询。当前没有可声称完成的纯 Web/PWA 闭环。
4. **真实旧 owner 迁移**：工具与合成库证明已存在，但真实留存数据的归属证据、冲突清单、恢复点与受控操作尚未完成；不得在 UI 任务中擅自认领/回填。
5. **T9/T10 工程关闭**：WL-AUTH 的具名测量与真实样本/费用目标、生产恢复和实际 CI 运行证据；不能把 1.6 的 WL-IMPORT 或 1.7 的恢复基线移名为认证性能。读取时 Sprint 的 METRICS-01/02 仍 not-started，03 为 scoped in-progress。
6. **真实双端**：Mac/Xcode/正式应用标识/签名/Android 与 iPhone 设备和实际权限、冷暖启动、遮蔽、API/SSE、下载/撤权证明；1.0 的整体关闭消费 9.1，但无需等 9.2 最终分发。

### 新 UI 依赖与独立工作

UI01/UI-SCOPE-1.0 绑定 **CODE-QUALITY-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01、shared-ui-adoption**。9.4 可立即给 Login 字段、配置失败、发送 unknown、验证码、协议/退出状态建真实组件用例；fixture 的 captcha provider 必须显式为 fixture，不能因为有 getCaptchaToken 注入就让 PNVS 分支加载真实 SDK。9.5 保护多 tab、bfcache、旧 owner 回包、未知退出和 portal 同时遮蔽。9.3 迁移共享控件/受控退出对话框后，由 1.0 补页面与适用 native 回归。

未依赖外部资源的接线、类型/lint、测试隔离与接口准备可继续；真实法律、第三方资源、设备或供应商状态只阻断相应切片。不要重新开发已验证的持久 Session、opaque credentials 或退出回执。

## Story 1.6：Home 多链接导入与诚实队列

### 已实现、应复用

| 原 Tasks | 当前实现与证据 | 复用边界 |
| --- | --- | --- |
| T1 | 有序 URL 分类、duplicate/reused、IngestSnapshot/state_version、owner-scoped IngestCommand、原 job retry、结果读取和 partial 保留已入 API/事务。 | command receipt 与事件 cursor 分工仍明确；1.7 后来扩展 durability，不重做受理身份。 |
| T2–T5 | `HomeImportDock`、`ImportDockController`、model、HomeSheet、自然语言摘要/原 S2 handoff；可继续输入、稳定批次 N/X、一次一条活跃 SSE、FIFO 每结果完整可见 10 秒，Sheet/后台暂停，真实结果入口和失败恢复已接入。 | 原生返回、身份活动栅栏、同 owner 保留与换 owner 清理已有行为；样例直接消费这些组件，不复制外观假页面。 |
| T6 输入 | Clipboard8.0.1 主动读取、严格 input-v1/允许来源 inbox、有限队列、重复/过期/ABA/迟到输入保护、显式匿名确认已有实现。 | 当前自定义开发 scheme 的静态/浏览器模拟投递不证明真实 U-Link/系统深链。 |
| T6 journal | 默认 controller 使用真实 IDB/WebCrypto journal；确认先 prepare 再 HTTP；未知先读原回执、只有明确继续才同 operation 重交；多来源 claim 原子绑定；完整 10 秒后 noteDone。两进程完整 App 恢复无第二次 POST 已记录。 | 前文“日志尚未接入”已被“日志接线已完成”覆盖；不清空 operations/claims/keys，不引入 memory/localStorage 成功 fallback。 |
| T7 | measurement-v1、WL-IMPORT-DOCK、本地报告/CLI、固定矩阵 15 请求、失败/unknown/running/缺失、nearest-rank 及独立 FIFO 口径已交付。 | 合成观察/成本 null 不等于真实服务基线或产品目标；旧修复前 baseline 保留。 |
| T6 遥测基础 | `telemetry/dictionary.ts`、`runtime.ts` 和安全 analytics 出口已有 21 核心反例及显式本地 HTTP 信封检查。固定友盟四包制品与独立 Android 离线 SDK 探针已经审计。 | SDK 未进主 App；规范 input/import emitter、实际 consent/runtime 和供应商查询仍未接线。 |

主要证据：`story-1-6-dev-progress-2026-09-19.md` 最后四个实施段及同 Story local-validation；后续恢复源码以 1.7 的验证补充。当前 `App.tsx` 按 auth epoch 创建 ImportDockController，controller 默认参数就是真实 operationJournal；operation journal 已包含 1.7 的 checkpoints store，不能只依赖 1.6 原摘要判定接线缺失。

### 真正剩余项与资源

- **input-attribution 与 1.0 共享 T8**：实际 U-App/U-Link adapter、许可/撤回 UI、规范事件发射、三端查询与匿名关联/清理；域名/Scheme 或配置位置尚未有后续完成证据。已有 U-App Key 不重复索取。
- **SDK 生命周期有已知障碍**：`docs/ops/umeng-sdk-artifact-audit.md` 的真实离线 Android 探针记录 disable + privacy(false) + profile sign-off + clearPreProperties 后，10 秒仍留 SDK db/envelope/identity 文件；这只证明该组合未擦除本机状态，不证明撤回后上传。不能用空 close 或等待一段时间冒充清理屏障。适配器需明确逻辑投递 scope、自动采集、缓存与实际法律保留策略，iOS 运行亦未验证。
- **C05/C06 双端实际运行**：真实系统深链/Clipboard、拒绝/取消、键盘/返回、安全区、大字/读屏、后台/杀进程、同 operation 恢复和 owner 变化；浏览器主动投递和 debug APK 不关闭它们。
- **工程/真实输入**：真实 WL-IMPORT-DOCK/staging/费用与用户目标、生产恢复/PITR；1.9–1.11 的真实 extract/geocode/rehost 未交付，真实模式新导入仍诚实 `INGEST_CAPABILITY_UNAVAILABLE`。这是下一能力切片依赖，不能靠开启 fixture 让 1.6 演示伪装实际导入。

### 新 UI 依赖与独立工作

UI02/UI-SCOPE-1.6 绑定四项 UI 条件及 shared-ui-adoption，与 1.0 同组。9.4 的 HomeSheet/Dock 用例须涵盖 loading/empty/partial/reconnect/未知回执、长中文/200%字号；9.5 保留原真实 IDB 两进程/双 tab 探针并做覆盖对照；9.3 迁移 AppSheet/composer 后验证 **Portal 与页面同身份遮蔽、完整 10 秒、noteDone、原 operation、不自动粘贴**。组件层不能持有第二份 job 状态或把 mount 当新的恢复/写入触发。

可独立推进规范事件发射与许可/adapter 的非外发部分、工作台/浏览器保护和 UI 迁移；有实际 SDK 语义尚不能满足的部分应保留明确门槛。不要重复实现 Dock、FIFO、input inbox 或已接通 journal。

## Story 1.7：持久进度、worker 和 ACK 恢复

### 已实现、应复用

- T0–T4 主任务已勾选，并有与当前源码 76/76 摘要一致的证据：无损 bigint cursor/日志命名空间、不可变事件与受理/结果同事务、schema fail-closed、PG pending/claim/lease/fence/checkpoint、有界 worker 与停机、owner-safe recovery 和真实 DB 分页/SSE/tail/背压/heartbeat/终态。
- T5/T6 的核心已完成：IDB v2 保留旧库与密钥、snapshot+cursor 同事务、跨 tab CAS、损坏隔离、串行 64 条/256KiB 上限、resync/complete、公平轮转、回执补写；render 后可见计时、FIFO/Sheet 遮挡、durable noteDone 保持。
- T7 已有真实 PG/event/producer/lease/worker/HTTP/socket、4 处 SIGKILL、Chromium IDB14项、App/PG/SSE6项、3轮压力/双窗口以及旧 journal/Dock 回归。原 auth/API 是明确 fixture，不能外推真实身份。
- T8 已有活动 checkpoint 的 dump/restore 和隔离零 dispatch/受控 resume；另有 **physical base + WAL 的私有 PITR 六项**、备份工具/未安装 daily 模板与反例；受控 server recovery 基线为 4 场景×3。生产 PITR、RPO 与产品指标尚未关闭。

证据入口：`story-1-7-client-validation-2026-09-19.md`、`story-1-7-pitr-validation-2026-09-19.md`、`story-1-7-server-baseline-2026-09-19.md`、同 Story local-validation。不要依据 dev-progress 最前面的“尚未接 SSE/worker/ACK”重开这些已收口切片，也不要把较早仅观察 close 的压力探针当最终证据；最终证据已要求实际接收帧数、累计注入数及补读。

### 真正剩余项与资源

1. T5 native bridge 最后一个未勾项及 T6/T7 C07：两端协议源码/Android 构建存在，但实际 Android10+/WebView111+、iOS16.4+ 的断网、后台/kill、身份确认后原 cursor 恢复、零重复 POST、旧 owner 连接清理、键盘/读屏与 native 失败路径未实测。不是缺一套新的 JS ACK 实现。
2. iOS Mac/Xcode、签名、设备与真实构建；Android 实机安装/运行。9月19日预检/adb 空清单是历史实测，本次未探测设备，不断言今天物理上仍没有设备。
3. T8 OPS-01/DB-CHANGE-01：正式独立备份目标、容量/保留/失败监控、实际每日全量/WAL/15分钟目标与 RPO、指定时点完整应用恢复、最新删除/停用抑制，以及新旧 writer 切换/恢复窗口。private PITR 仍与源同 VM 故障域，daily 模板未启用；恢复到时点的私有实例未启动完整业务 worker。
4. METRICS-01/02：真实产品负载、正式 staging 基线/候选同口径比较、用户版本化体验/费用目标；当前 loopback 152 事件和故障注入报告只是受控基线，成本 null。METRICS-03 的功能反例保留，原生 C07 与整 Story 关闭不自动 verified。

### 新 UI 依赖与独立工作

**1.7 仅绑定新增 CODE-QUALITY-01 与 UI-BROWSER-01，没有 UI-COMPONENT-01/UI-WORKBENCH-01/shared-ui-adoption。** UI-REGRESSION-1.7 要求在共享组件实际迁移后重新验证 render/FIFO/durable ACK/跨 owner；不要求 1.7 新建组件库或工作台。

9.4 建立真实 lint，9.5 守住原恢复场景，9.3 改 HomeSheet/Portal 后，由 1.6 与 1.7 对同一具体受影响源码分开记录业务/恢复回归。不要挪用原生证据或将某次公共测试自动标为所有 Story verified。资源缺项期间可推进这部分质量回归；没有新变化/失败时不反复重跑已通过 PG/压力矩阵来制造进展。

旧“1.7 完成后停止/不进1.8”是旧用户边界，本轮已明确解除；它不再阻断独立 UI 工作，但 **1.7 仍不可标 review/done**，原证据和真实关闭条件不变。

## Story 9.1：Capacitor 宿主与最低平台

### 已实现、应复用

- T0–T3 已完成：锁定 Capacitor8.5.2 与各插件、开发/候选配置隔离、Android/iOS SPM/UIScene 工程、内置 Web assets、typed host 接口、返回优先级/取消、keyboard epoch、StrictMode/listener 清理、生命周期去重与安全外链。
- T4 已接入现有 App/Home/Planner/DayPlan/SlotEditSheet 的 handler、busy/未提交保护及独立 safe-area/dynamic viewport CSS；不是只有空壳接口。
- T5 已有基础及后续认证/Clipboard/1.7 版本的 Android debug 真构建、v2 调试签名与包内 assets 核验；iOS 只 sync，未有 Mac 编译。
- **UI-CONFIG-9.1 已完成**：当前四处 Xcode deployment target 与 App SPM 为16.4；Web JS/CSS targets 是 chrome111/edge111/firefox128/safari16.4/ios16.4。native:sync wrapper 校准已识别的 App SPM 声明，native:verify 检查配置/插件/assets。9月20日有19项配置+5项Node校验、mobile build、双端sync记录；当前这些配置摘要匹配。
- Sprint 的 DB-CHANGE-01=not-applicable 只覆盖9.1宿主切片；METRICS-03=verified 只覆盖已记录确定性配置/返回/恢复反例。T7主框未勾不抹掉这两个 scoped 结论，也不能推广到1.0数据库或整体模型评测。

### 真正剩余项与资源

1. T4：真实可读的正式协议/隐私说明及离线/配置不可用的首屏实际路径；不能用占位法律文件解除 1.0 的法律 gate。
2. T5/T6：正式应用标识/签名连续性、Mac/Xcode iOS 真构建、双端安装/冷启动/升级/无网/返回/键盘/安全区/外链/恢复，以及最低 iOS16.4 与代表性 Android 的实际结果。开发 namespace `dev.nomad.mvp` 不证明正式注册资源。
3. UI-PLATFORM-9.1：9月20日改了配置/资源但明确**没有重编 Android APK**，旧 APK hash 不证明16.4/新版 bundle；也没有最低 iPhone/真机/TestFlight 实证。下一候选应重新绑定源码/lock/assets/原生目标与真实产物。
4. T7：WL-APP-HOST 实际冷启动/恢复样本仍为0，耗时null；需实际运行与对应目标决定。签名APK/TestFlight最终分发由9.2负责，不把9.2整体完成倒置成9.1开发前置。

### 新 UI 依赖与独立工作

UI03/UI-SCOPE-9.1 绑定四项 UI 条件及 shared-ui-adoption；配置同步子项已经完成，其余组件消费/工作台/浏览器/最低平台实机不继承已验证状态。9.4 可用现有 host fixture 展示返回/键盘/配置 unavailable，必须明确替身；9.5 保护真实 Web 与模拟 host 交互边界；9.3 AppSheet 接入既有返回和身份层后补双端真实证明。

可在资源缺项时继续现有 host 与共享组件的 adapter、配置验证、真实 lint 与运行说明；不要重建第二套返回总线、重复消费 safe-area，或只改 deployment 而漏 JS/CSS/SPM。日常 Node/pnpm 仍在 WSL，iOS 原生构建使用明确 macOS runner。

## root 可据此协调的下一步

1. 按最新用户指令在当前决策/CURRENT/Sprint 记录停止边界解除；保留四张 in-progress、历史 done、原条件与 3.1 paused。不要改写9月19日批准/失败/阻断快照。
2. 立即实施9.4：优先已有 HomeSheet/LoginScreen，用例与 typed lint 只触达实际 cohort；命名并冻结历史例外，不以批量修 lint 改写业务状态机。9.4 不等待缺 Mac/PNVS/备份资源。
3. 仅按即将实施顺序准备9.5、9.3；先完成旧流程保护，再进行共享组件代表性迁移。无需继续批量生成 Epic3/4 等遥远合同。
4. 后续更新1.0/1.6原 Tasks 时，以“已实施子项 + 真实验收保留”拆分勾选，引用最新限定证据；1.7保持T0–T4已完成，T5–T8按剩余实机/运行门槛续接；9.1保留UI-CONFIG已完成。不要因整理状态重新执行真实资源操作。
5. 共用写入由 root 分配：9.4拥有工具/工作台/lint，1.0拥有认证/退出，1.6拥有Dock/输入/归因，1.7拥有cursor/ACK/worker，9.1拥有宿主/原生配置。同一App/HomeSheet/platform/package/lock变更先核对当前树；一次公共验证可被多个Story引用，但各自 summary 必须解释其范围。

## 主要读取来源

- 当前四张实施合同及对应准备验证：`_bmad-output/implementation-artifacts/{1-0-production-login-and-multi-device-sessions,1-6-home-multi-link-import-queue-and-honest-status,1-7-durable-import-progress-and-restart-recovery,9-1-capacitor-app-installation-and-host-foundation}.md` 与同名 `-validation.md`。
- 四份最新 dev-progress/local-validation；1.7 client/pitr/server-baseline/blocked-audit；UI foundation dev-progress/local-validation/handoff；当前 `CURRENT.md`、project-context、Sprint、ui-foundation migration/delivery。
- `docs/architecture/ui-foundation.md`、`docs/architecture/frontend-data-navigation.md`、`docs/architecture/app-host.md`、`docs/ops/ui-validation.md`。
- `docs/ops/telemetry-first-use-v1.md`、`docs/ops/umeng-sdk-artifact-audit.md`、`packages/native-auth/ADR.md`、`research/story-1-0-resource-confirmation-2026-09-19.md`（位于implementation-artifacts）。
- 当前源码入口：`apps/mobile/src/App.tsx`、`auth/LoginScreen.tsx`/`auth/analytics.ts`、`home/HomeSheet.tsx`/`dock-controller.ts`/`operation-journal.ts`/`api.ts`、`platform/host.ts`/`HostBootstrap.tsx`/`native-build-config.ts`；`apps/server/src/auth/service.ts` 与runtime配置；package/lock、Vite及iOS目标。

以上资源状态是仓库中最后一次实际记录的范围，本次没有复验 VM、设备、供应商或生产配置。实施前按对应切片做 live preflight；只有新状态或相应修改需要的新证据才更新条件。
