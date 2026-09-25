# WL-IMPORT-DOCK v1：客户端本地测量

本工具测量真实 ImportDockController、真实 IndexedDB 和 React Dock 的浏览器观察时间。
API、任务阶段、身份、丢回执和断线由显式 fixture 提供；没有调用真实供应商，也不构成 staging、
Android/iOS 真机、生产 SLA、METRICS-02 目标或 U-App/U-Link 真实归因验收。

## 执行与输入

- `pnpm run ci:import-measurements`：严格数据合同、统计边界测试和测量工具类型检查。
- `pnpm run measure:import-dock -- matrix`：独占 localhost:5190，启动隔离 Chromium 配置与真实 IndexedDB；阻止外部请求。
- `pnpm run measure:import-dock -- deadline-cutoff`：250ms 固定截止、400ms 分类延迟的负例；计划15项全部保留为缺失，不能继续提交。
- `pnpm run measure:import-dock -- fixed-single`：7 秒单请求回归测量。
- `pnpm run measure:import-report -- samples.json report.json`：从严格 `{manifest,samples}` 数据重新计算相同整体/场景统计。窗口、采样率、fixtureVersion、scenarioPlan保留；环境/源码 provenance 以原 runner report 为准，重算不回显外部文件中的任意 provenance 字段。

浏览器使用项目 server 的 Puppeteer 运行时；Linux 需安装该 Chromium 所需共享库/字体，或显式设置
`LD_LIBRARY_PATH`、`FONTCONFIG_FILE` 指向已有运行时。不得使用真实浏览器配置或账号。
默认报告路径在 `_bmad-output/implementation-artifacts/evidence/story-1-6-measurement-2026-09-19/<profile>/`。
同 profile 再次运行会替换该目录下的 samples/report，请先另存需要保留的基线。
`baseline-single` 是只保留的修复前历史测量，runner 拒绝该 profile，不代表当前源码。

冻结 fixture 版本由 harness 中 `fixturePlan`、measurementVersion 和源码 SHA256 标识：

| 场景 | 逻辑请求 N | 方式 |
| --- | ---: | --- |
| single | 3 | 各提交一条 |
| batch | 3 | 一次提交三条，真实控制器顺序受理 |
| partial / failure / rejected | 各 1 | 已有部分结果、任务失败、受理拒绝 |
| unknown-ack | 1 | POST 回执丢失，显式查询原 operation |
| reused | 1 | 已完成结果复用，不新计处理/展示窗口 |
| retry | 1 | 原 job 从 attempt 1 失败到 attempt 2，两个 operation、一个逻辑请求 |
| reconnect | 1 | SSE 断线，控制器正常退避/轮询 |
| missing-acceptance | 1 | POST 与后续回执持续不可知，保留 unknown |
| missing-terminal | 1 | 只观察到 fetching，保留 running |

矩阵计划 N=15、采样率 1、单浏览器单次顺序提交、25 秒观察窗口。合成阶段在服务替身受理后
20/40/60/80ms 更新；这些是 fixture 输入，不是产品阈值。完成展示由实际 React 确认并由控制器计时；
观察窗口内未展示/未展示满的任务照实记录，不延长运行直到全部成功，也不丢弃失败/未知项。
短样本用于回归诊断，不足以确认性能目标；不同场景的分位数独立计算，整体混合分布仅作附录。

## 口径与约束

- 所有客户端时间取同一 `performance.now()` clockId；不与服务器墙钟相减。
- 受理时间从用户确认到客户端观察到 ACK；恢复 ACK 标记 reconciled，不能当原服务受理时刻。
- 首事实从观察到受理到第一个非 created 状态；恢复/复用可能同帧为 0，必须按场景读取。
- 成功总耗时只包含 done，排除复用；部分结果、失败与拒绝保留在各自结果和 all-terminal 分母。
- accepted-to-terminal 排除复用、恢复 ACK、多 attempt；仍只是客户端观察时间，不能当服务计算时间。
- 每个逻辑请求保留 operation 列表、观察到的 attempts、命令 POST 次数（commandRequests，不含分类、回执 GET、快照轮询或 SSE 连接）、断线和重复帧数。
- 严格字段/枚举/UUID/数值 allowlist；没有原始文本、URL、手机号、凭证、媒体或位置。非法样本只计数，不回显。
- 同 logicalId 完全相同样本去重；冲突样本整条排除并列入 coverage，不能选更好的一条。
- planned/observed/missing、缺 ACK/终态时间戳、时钟不符、窗口外/逆序、unfinished waitedMs 都保留。
- P50/P95 使用 nearest-rank `ceil(p*N)`；N=0 返回 null，禁止补零或平均各轮 P95。
- terminal-to-presentation、实际可见时长与处理时间分别统计；10 秒 FIFO 是产品呈现行为。
- 服务器阶段、服务提交到呈现、route/model/prompt、usage/cost 未测时明确 null/reason；不会生成“0 元”。
- 报告记录 Git 基线、相关源码/fixture SHA、环境、浏览器、窗口、planned N、实际样本和场景子报告。
  运行前后校验源码及服务 nonce，避免误连已有开发服务器或把运行中修改后的源码混入同一证据。

真实 staging 基线必须另行固定版本/工作负载/机器资源/网络/时间窗，并补实际服务阶段、供应商路由与成本账单，
按工程前置清单执行。当前工具没有自动遥测出口；观察回调异常也不得改变业务行为。
