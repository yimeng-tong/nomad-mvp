# Story9.5当前仓库与原探针责任（只读研究）

核对HEAD6344a53，9.4收口提交a950ea0；日期2026-09-25。独立研究者story95_repo_research只读代码/证据/CI，未运行这些旧浏览器探针。下列路径均相对仓库；报告不是新的通过证据。

## 产品入口与状态

| 路径（apps/mobile/下） | 当前事实与必须保留 |
| --- | --- |
| src/main.tsx、src/platform/HostBootstrap.tsx、src/App.tsx | StrictMode→HostBootstrap→App，Host初始化/清理input inbox。view state切Home/Settings，Planner handoff条件渲染，除ops特例没有Router/pathname导航。controller按auth.epoch创建，同身份Settings往返保留输入/任务；Home筛选/选中是局部state。 |
| src/auth/session-context.ts、transport.ts | checking/unavailable立即dataset与auth-private CSS遮蔽；同身份恢复保留树，owner/session/nativeGeneration变化递增epoch并重挂。通知只触发/me，不确立身份。请求绑定epoch/activity，abort及读response/body后再验；expected owner/session，删除伪造Authorization/Cookie/X-User-Id。 |
| src/auth/LoginScreen.tsx | 改手机号废弃旧challenge/OTP/回调，verify后必须/me同user/session。真实PNVS保持request_id/未知发送；默认captcha provider无凭空proof。9.4已补label/notice、发送状态和失败处理。 |
| src/home/HomeScreen.tsx、HomeSheet.tsx | saved-result使用requestSymbol+epoch/activity；候选Symbol拒绝晚到。三个临时层：输入类型/定位候选/已保存结果。Home调用层已有home-body inert、priority20 back与Dock active=false；Sheet自身首焦点/Tab循环/Escape/connected trigger恢复，无Portal/scroll lock/outside-click/通用busy策略/身份焦点回退。 |
| src/home/HomeImportDock.tsx、dock-controller.ts、operation-journal.ts | layout确认实际可见后才累计FIFO窗口，Sheet/后台/身份未知暂停；完成窗口之后ACK。未知受理先查旧operation回执，不重复POST；原IDB/WebCrypto/加密/owner责任保留。剪贴板只用户动作，deep input先明确放入输入框。 |
| src/settings/SettingsScreen.tsx、src/App.tsx | Settings当前退出为内联role=dialog，无HomeSheet trap；仍有旧BYOK/export/delete/feedback。只保护现有可用入口，不实施完整7.3。未知退出沿同一operation_id确认，身份变化停止旧重试。 |
| src/styles.css、src/platform/app-host.css | Home文档滚动，固定Dock ResizeObserver高度变量；Sheet约54vh独立overflow。safe area/dvh属于现有host约定；没有通用scroll restoration或浏览器真实软键盘适配。 |

9.4 workbench/fixtures.ts 可复用生成DTO与合成内容。handlers.ts仅auth/cities/单snapshot，/me总已认证；scenario.ts要求随机/__nomad_workbench__/前缀，不能直接当App端到端替身。App authClient prop也不覆盖Login/Home/Settings自己的client，须在实际HTTP边界控制完整场景。Node脚本与browser注入模块分开配置typed lint。

## 七个旧浏览器探针

以下均在apps/mobile/scripts/，当前ci.yml没有调用它们。本Story默认保留；只有当前版本逐场景等价证明后才可退役重复UI项。

| 文件 | 原责任/明确替身 | 原证据（implementation-artifacts下）及保留策略 |
| --- | --- | --- |
| auth-browser-probe.mjs | 实际App：未知发送、同owner草稿、unavailable遮蔽、跨tab、未知logout同operation、桌面ops拒绝/审计；HTTP与initAlicom4替身 | evidence/story-1-0-browser-2026-09-19/report.json；新三引擎可映射页面，PNVS调用形状/ops未等价则保留 |
| home-dock-browser-probe.mjs | 实际App/controller/IDB，2浏览器进程；HTTP/SSE/剪贴板/deep-link替身；批量、partial、Sheet/inert、11秒遮挡暂停、FIFO/重试、44px/溢出、丢ACK重启只读回执、owner隔离 | evidence/story-1-6-browser-2026-09-19/report.json；真实跨进程profile/零重复POST必须保留 |
| operation-journal-browser-probe.mjs | 非App页面，真实IDB/WebCrypto、2tab/2进程；原子claim、不可导出key、加密/篡改/回滚/TTL/缺key/closed连接；serverRequests=0 | evidence/story-1-6-journal-2026-09-19/report.json；22项存储责任不能由截图替代 |
| telemetry-browser-probe.mjs | 非App页面，真实runtime/HTTP sink替身；3个网络信封，许可未知不初始化、哨兵过滤、去重、迟到init/旧queue隔离 | evidence/story-1-6-telemetry-2026-09-19/browser-report.json；保留信封/零外发，不是真SDK |
| ingest-checkpoint-browser-probe.mjs | 真IDB/WebCrypto，3进程/2次SIGKILL；14项v1→v2、cursor+snapshot加密原子、CAS/namespace/quarantine/abort/ACK/容量TTL | evidence/story-1-7-checkpoint-2026-09-19/browser-core.json；不能把kill换reload |
| durable-dock-pg-browser-probe.mjs | 实际App+IDB+PG session/me+真实SSE，3进程/1kill；credential路由明确本地替身；6项cursor/FIFO剩余窗口/A→B→A/多job补读/零新POST | evidence/story-1-7-client-2026-09-19/pg-browser.json；严格命名隔离DB及AUTH_TEST_DATABASE_ACK，保留PG职责 |
| durable-dock-pressure-browser-probe.mjs | 实际App/PG/SSE/IDB；duplicate frame/56KB padding故障，数量/字节背压、两个真正visible窗口、迟到加密CAS | evidence/story-1-7-client-2026-09-19/pressure-repeat-{1,2,3}.json；3项压力/双窗口，CDP能力不机械套到三引擎 |

旧证据漂移：auth/home/telemetry记录Chrome127.0.6533.88，auth缺源码摘要；home报告20项但当前script22项且controller/model/journal SHA变化，journal实现SHA也变化。checkpoint/PG-App/pressure列出的源码SHA当前相符，但缺新lock/React环境摘要。以上均不可直接算9.5新版本通过。

## 后端与测量的现时CI对照

路径为apps/server/scripts/，除特别列出者。

| 脚本/责任 | 当前CI及资源要求 |
| --- | --- |
| auth-persistence-probe.ts / auth-http-probe.ts / auth-ingest-probe.ts | 已调用：隔离PG15迁移/seed，持久会话/HTTP权限/命令与输出事务；供应商替身 |
| auth-ingest-events-probe.ts | 独立：不可变日志、snapshot/event同事务、并发/回滚/owner资格 |
| auth-ingest-lease-probe.ts | 独立：2进程claim、lease/fence、锁等待后过期、撤权/终态/公平 |
| auth-ingest-worker-probe.ts | 独立：真实worker SIGKILL/checkpoint续跑、未知外发不重复、retry事务/Fastify释放 |
| auth-ingest-replay-probe.ts | 独立：owner-first/cursor/分页提交/旧attempt/resync/retention/真实PG路由 |
| auth-ingest-sse-probe.ts | 独立：2进程/kill、真实socket背压/heartbeat/撤权/DB中断/preClose；专用可控库，禁止共享DB |
| auth-ingest-restore-probe.ts、ops/pve-staging/run-ingest-{restore,pitr}-probe.py | 独立资源：逻辑dump/restore与物理base+WAL PITR分别保留；备份helper单测不等价 |
| auth-contract-probe.ts / ingest-contract-probe.ts | 有package命令但workflow未调用这两脚本；不是CI auth/ingest单元的同义名称。9.4最后另运行ingest contract，不能混称远端CI |
| home-library-contract-probe.ts / planner-contract-probe.ts / settings-contract-probe.ts | 已调用，旧HTTP合同保留 |
| root scripts/synthetic-probe.ts / sse-assert.ts | 已调用；显式fixture auth/worker与实际CI PG，ACK/旧规划/TTFU/stage/heartbeat；不替代1.7恢复压力矩阵 |
| scripts/measurements/run-import-dock.mts、apps/mobile/scripts/import-measurement-harness.tsx、auth-ingest-recovery-benchmark.ts | 独立；客户端API替身的真实browser/controller/IDB与真实PG/SSE基线分开；ci:import-measurements有命令但workflow未调用 |

9.5新增实际App三引擎/视觉门禁，保留全部上表文件和资源边界。缺资源只阻断对应需要的检查，不将skip/旧日志宣称通过。9.3共享组件/实际Portal/滚动锁/统一关闭与真实设备、9.6Query/9.7Router保持各自责任。
