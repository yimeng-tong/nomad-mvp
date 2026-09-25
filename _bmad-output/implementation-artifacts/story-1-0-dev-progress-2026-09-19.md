# Story 1.0 开发进度与验证证据（2026-09-19）

状态：实施中，尚未完成整个 Story，尚未发布或发送真实短信。用户本轮“同意继续进入开发”延续已给的1.0实施与homelab隔离测试授权。资源配置见同日resource-confirmation记录。

## 已实施并验证的部分

- 启动入口先校验配置，再导入可能创建网络客户端的模块；旧Map/固定OTP/header认证必须显式隔离fixture。真实路径已装配，不能误用旧内存会话；正式协议URL缺失时新登录明确不可用。
- OpenAPI新增PNVS图形证明、登录事务、预期owner/session上下文、退出回执；修复原手机号pattern的双重转义和otp/code的oneOf冲突。生成types，补5项合同检查。
- 扩展原User/OAuthIdentity/Session，增加可信命名空间、资格版本、凭据摘要和撤销记录；新增登录事务、图形证明消费、共享限流、浏览器代际、历史owner绑定和最小运营授权/审计数据。
- Prisma认证仓储已通过两个独立客户端的实际PG验证：幂等发送预约、并发验证租约、重放、浏览器绑定、稳定owner、两设备、当前撤销、账号停用及晚到登录拒绝。
- 历史owner使用显式证据映射，普通手机号匹配不认领旧数据。真实路径停止二次hash与业务入口自动创建User；旧sourceHash通过同owner的明确alias恢复；Planner/HQ恢复使用数据库owner，旧外部actor字段保留。
- 任务保留账号资格版本，发布事务复核；后台执行脱离浏览器session，logout不取消已接受任务。原有Planner领域71项测试通过，真实PG的历史owner隔离/去重/禁止自动建User验证通过。
- PNVS采用已锁定官方SDK；关闭自动重发及OTP回显；验证必须是PASS，图形必须由服务端校验通过。8项供应商适配测试覆盖HMAC、错误、超时、未知发送不重试、结果关联和秘密不外泄，均未调用真实供应商。
- 真实Fastify路由＋真实PG＋显式供应商替身的HTTP probe已通过：header旁路拒绝、Origin、opaque Cookie、跨实例、AsyncLocalStorage actor、旧账号读写拒绝、退出回执恢复、旧退出重试不影响新账号、发送未知不重发、晚到登录代际拒绝。
- 官方同域H5 SDK已获取到`apps/mobile/public/vendor/pnvs/ct4.js`，语法检查通过；来源/完整性记录在同目录provenance.json。H5界面接入和实际浏览器验收仍待完成。

## 真实隔离资源（不是既有业务库）

PVE/VM104操作沿用已确认的SSH跳板。没有切换`/opt/nomad-mvp/current`或修改既有Nomad数据库。

- 当前临时测试源码/依赖：`/tmp/nomad-auth-workspace-jw23djnz`（VM104内），与历史release分离。
- 最新含native transport/audience的完整迁移/恢复验证：`nomad_auth_test_7a607d1be2dc`及`nomad_auth_test_7a607d1be2dc_restore`。
- 对应私有测试连接文件：`/tmp/nomad-auth-validation-7hes1l2a/test.env`，仅存在来宾私有目录，不在仓库/聊天输出凭据。
- 合成备份：同目录`synthetic-auth.dump`，SHA256 `6d24b23de448fc64180616f81bb24435c1872dbe5405efdce412e9cb9e6d4b89`。
- 迁移前不变量检查按预期拒绝缺少认证字段；应用后通过；恢复到另一新库后的旧owner隔离和撤销记录通过。
- 早期草稿测试库及备份保留：`b272d4528c00`、`d59e4401e26f`、`829eef4c2917`后缀各自的隔离库/恢复库。早期结果只证明当时的草稿，最终以最新代码重验记录为准。

该证据只覆盖合成数据库与相应代码阶段。没有证明生产备份/PITR、真实短信、真实图形回答、真实U-App/U-Link、浏览器UX或性能目标已验收。

## 当前可复验命令

本地：

```bash
node --test scripts/check-auth-contract.test.mjs
pnpm -F nomad-server run test:auth-config
pnpm -F nomad-server run test:planner-domain
node node_modules/typescript/bin/tsc -p apps/server/tsconfig.json --noEmit
```

远端隔离验证（会创建新的合成测试资源或只同步已有临时目录，执行前确认当前目标仍为VM104）：

```bash
python3 ops/pve-staging/auth-migration-preflight.py --execute
python3 ops/pve-staging/prepare-auth-validation.py --execute
python3 ops/pve-staging/run-auth-persistence-probe.py --workspace /tmp/nomad-auth-workspace-jw23djnz --env-file /tmp/nomad-auth-validation-7hes1l2a/test.env --probe persistence
python3 ops/pve-staging/run-auth-persistence-probe.py --workspace /tmp/nomad-auth-workspace-jw23djnz --env-file /tmp/nomad-auth-validation-7hes1l2a/test.env --probe http
```

`auth-legacy-owner-audit.ts`是只读审计入口，真正既有数据认领仍需要可信归属与具体授权；没有把测试绑定推广到真实数据。

## 尚未关闭

- 真实短信/图形验证及实际三端宿主，正式隐私/协议文本/页面；真实历史owner的可信映射与留存数据演练。
- Android/iOS安装后安全存储、前后台/杀进程/遮蔽/实时流/下载的实际设备验证；iOS还需Mac/签名与构建资源。
- U-App/U-Link SDK与许可/隐私选择及真实查询闭环、三端归因和工程指标/生产备份恢复条件。
- 公有云发布仍在整体开发测试完成之后，不由本轮代码/测试自动授权提前发布。

Fastify定向修补到5.12.1；PNVS SDK使用2.0.0及其匹配openapi-core/darabonba依赖。openapi-core安装脚本只对Node10/12安装旧类型依赖，已显式不执行；Node22使用发布包内dist。原锁定依赖与构建行为需随完整构建再复核。

## 认证核心独立审阅及继续实施（同日追加）

按bmad-code-review完成blind/edge/acceptance三层、仅针对当前后端核心差异（快照`/tmp/nomad-auth-core-review-20260919.diff`）。归并6项patch，0项需要产品决定，0项历史defer，0项dismiss；没有把尚未实施的native/UI误判为核心缺陷。用户已授权持续实现与修复，因此继续修补，不重复请求每项批准。整Story仍in-progress。

1. 撤销会话事务复核调用者，两个浏览器按稳定顺序锁定，再锁owner/session。隔离真实PG先复现未拒绝，再通过回归；已撤销A无法撤销B。
2. 登录成功时同步续期binding/session。HTTP probe检查两个HttpOnly cookie。
3. 外部图形验票前增加共享PG验证预算；发送预约仍有独立最终原子预算。两个实例的预算竞争回归通过。
4. 发送后崩溃留reserved，30秒后可转unknown再调用供应商验码；不重发短信。真实PG验证活动发送暂拒、陈旧发送可验证。
5. 按[PNVS SendSmsVerifyCode官方错误码](https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-sendsmsverifycode)区分明确限流/拒发与传输未知。已知拒发持久为failed，其余保守unknown。供应商适配9项测试通过，均使用替身。
6. 会话cookie使用公开session ID后缀的独立名称，服务端仅接受数据库有效代际；退出只清目标cookie，迟到响应不会覆盖或清除新会话。已通过真实HTTP迟到退出回归；完整逆序登录响应回归继续补充。Web Locks仍用于正常多tab协调，安全不只依赖通知。

客户端已接入统一owner/session代际与读取/写入前后复核、后台同步遮蔽、前台/me恢复、退出回执重试、同owner草稿保留/跨owner清空。图形SDK使用本地固定路径/SRI、强制HTTPS、取消/超时销毁、完整证明；发送未知文案与同intent重试、不自动重发已接入。App在原生宿主只调用native桥，无桥/未配置时明确503，不回退Web cookie或测试身份。

Planner流暂停时断开，身份重新确认后同job/cursor恢复；旧事件忽略。生成请求未知时保留相同幂等nonce。Android返回绑定到既有页面/弹层，认证复核和busy优先消费；没有扩展暂停的3.1业务。

最近本地全mobile测试128项通过（含另一任务宿主测试），后端认证+OpenAPI测试57项通过，前后端TS检查通过。此数字对应追加时源码，之后的改动仍须再验。运行中的真实PG/HTTP替身结果不等同于真实浏览器/短信/native设备验收。

`packages/native-auth`已有Android/iOS安装注册骨架与公开JS合同，所有未实现方法明确不可用，已经交给9.1执行cap sync；安全存储/原生网络/SSE/下载及双端设备实证仍未完成。正式隐私/协议正文或页面未找到，已向用户询问，继续独立代码工作。CI Node改22、pnpm11.7.0与frozen-lockfile，并加入handoff回归；完整CI资源/执行次序继续核对。


## 最新可交付实现与复验（原生增量/最小桌面）

- native服务端与Web共享PG账号/撤销权威，但凭据、binding摘要和持久transport/audience分离；native要求HTTPS、精确API audience、无Origin/混合Cookie。只有专用native verify响应含插件内部凭据，普通DTO不含。
- Android实现AndroidKeystore/AES-GCM，iOS实现Keychain WhenUnlockedThisDeviceOnly；按规范化API origin+basePath分区，避免换环境时外发旧凭据。原生网络禁止跨origin/重定向/cookie回退，API/SSE/有界下载复用同一凭据和代际；原生下载只生成插件私有temp句柄。
- 原生独立三层审阅归并7项patch，加复查1项origin规范化：退出冷启恢复、遮罩重试、当次/me确认解锁、换环境分区、原生取消队列、私有cache清理、CLOSED SSE错误恢复及规范化均已实现。三层定向静态复查通过；被撤回的“verify后无/me”候选不计finding，LoginScreen本已执行独立/me。静态审阅不代表Swift编译/真机通过。
- Android依赖实际AAR检查拒绝OkHttp5.5.0/compile37；查验5.4.0 Android AAR的minCompileSdk36后固定5.4.0，显式AppCompat1.7.1，保留平台门槛；兼容/安全边界见`packages/native-auth/ADR.md`。9.1负责最终sync/build产物证明，不能复用早期空插件APK冒充新实现。
- `/ops`为最小桌面入口，`/ops/me`逐次读当前grant；`/ops/access-check`在同一事务复核会话、精确capability/scope/version并写持久审计回执。普通账号、伪role、错误scope、撤权和旧version都被拒绝。仅提供本次权限校验，不实现1.11/8.x业务页。`auth-operator-grant.ts`默认只验本地0600输入，显式`--apply`才执行受控维护；没有给真实账号授予权限。
- 原生`AUTH_NATIVE_ENABLED`默认关闭；`AUTH_PRIVACY_URL`/`AUTH_USER_AGREEMENT_URL`缺失时配置返回unavailable且新start/verify为AUTH_LEGAL_UNAVAILABLE，保留现有/me/退出路径。没有用占位法律页面开启真实登录。
- 全应用启动及真实socket SSE撤权通过；GET私有响应回包前再次复核，覆盖受理后撤权不回传私有正文。fill/export及未落实真实能力诚实返回不可用。
- 最新HTTP/PG probe通过所列检查、8次模拟发送/7次模拟验码，真实供应商调用0。共享限流在重复测试触发过429；测试改为每轮唯一文档网段客户端，不修改生产限流预算。
- Chromium127实际浏览器通过发送未知呈现、权威不可用遮蔽、同owner草稿保留、跨tab/前台换owner清空、同次logout恢复及桌面运营权限路径。HTTP/captcha均显式替身，出站外部网络被拦截。证据：`evidence/story-1-0-browser-2026-09-19/report.json`及同目录PNG；截图使用合成账号/手机号。该证据没有证明真实PNVS。
- 本地完整workspace build、mobile142项+原生配置Node3项、认证/OpenAPI59项、领域71项、历史5类contract probe、handoff60项及diff检查通过。CI已使用Node22/pnpm11.7.0/frozen lock，先迁移合成CI库再运行真实PG的auth probes；历史smoke仅显式fixture，不再将lint/promptfoo空占位列为成功门禁。CI本身还需远端运行，不能以本地命令替代。

最新待输入已分别提出：本任务询问正式协议正文/URL；9.1任务询问实际Android/iOS设备、Mac/runner、Apple签名/正式应用ID等。用户未答时只保留相应实际验收缺项，不把已提供的阿里云/图形/U-App资源再索取。既有VM104发布、业务数据库及所有合成备份保留；没有公有云部署、实际短信、真实grant或旧数据认领。


最终本地检查点见`story-1-0-local-validation-2026-09-19.json`：主任务后续退出冲突迟到响应/已完成native退出回执修补后，mobile144+Node3通过，workspace重新build/sync，Android213 tasks/13s重新编译通过，v2调试签名与APK内8份Web assets逐项摘要通过。最新开发APK SHA256为4445bd94860a55f11acb860c9730e15567f26541f6968294706a4a49ad5fd426；正式API尚未配置，仍非真实登录/设备验收。Chromium证据已用临时CJK字体重跑并人工查看关键截图，未修改系统环境或用户浏览器资料。

按照已核验用户goal方向，本任务创建持续目标active，1.6合同已准备且handoff通过；1.0维持in-progress，仍需真实协议/PNVS/归因/双端和工程关闭证据。下一步推进1.6独立实现，不等待常规继续批准。

## T8 首用遥测安全出口与许可核心（后续共享实现）

2026-09-19后续共享代码已将`auth/analytics`黑名单换成事件/属性/值白名单，登录及现存业务页面实际消费。错误原文和私人ID不能藏进安全key；登录验证码要求图形时不再凭空填Tencent默认provider。许可生命周期核心覆盖固定版本、身份代次、撤回/迟到初始化、清理串行、有界队列/TTL/超时及故障锁，三层7项审阅和21核心反例通过。

当前完整客户端217测试+3原生配置、workspace构建、auth/Home浏览器替身回归、遥测3个序列化HTTP信封检查通过；Android最新资源同步/编译/签名见`evidence/story-1-6-telemetry-2026-09-19/validation.json`。早先PG/服务端证据保持原范围，未在此重复运行或改写为新生产证据。

实际SDK、App默认runtime/许可UI、规范认证/输入事件、匿名到owner关联和真实U-App/U-Link查询尚未接通；页面默认Noop只代表未连接，T8保持未完成。下一步按`docs/ops/telemetry-first-use-v1.md`核验固定版SDK和原生适配器，最终三端真实证据分别取得；不重复索要已给AppKey/短信资源，不因本地绿测试关闭真实门槛。
