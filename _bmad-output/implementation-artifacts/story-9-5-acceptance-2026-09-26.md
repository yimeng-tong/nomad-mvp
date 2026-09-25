# Story9.5 验收与关闭证据

验收源码：85eedb68d576b5378e320a16273318845ebf6fe5。完整GitHub CI run36157432347的两个job全部通过；浏览器job108145306720与原完整链108145307210。实际下载并核验777文件、12个trace ZIP、24个actual PNG和CTA actual/expected/diff，v2离线重定位校验通过；首次workbench目录API两次EOF后按已知artifact ID下载ZIP并CRC验证，未省略该产物。

| 验收 | 实际证明 | 适用边界 |
| --- | --- | --- |
| AC1 既有入口/Sheet | B00–08/13–18/19–22：实际App→Login/Home/Settings，草稿/首焦点/双向Tab/返回/非零滚动/inert、真实计时与WebCrypto/IDB | 当前view-state导航；原生back/键盘/共享AppSheet不据此完成 |
| AC2 错误恢复/身份 | 错误保留输入、loading/empty/partial、断流先/me、原operation回执后同job恢复、双tab退出、旧A最后到达；4个对应私有层/输入/回调/重复POST负例实际失败 | HTTP/凭据合成；原PG18.6/SSE/IDB6项另跑，三进程一次SIGKILL，零新POST |
| AC3 视觉差异 | 固定镜像/字体/引擎/locale/viewport/DPR；8场景×3引擎经审阅后纳入，93套件内24比较通过；CTA位移产生目标失败与三张差异图 | threshold0/maxDiffPixels0，无mask/宽容差；先前200%裁切候选被拒绝，当前按钮已修补 |
| AC4 原职责 | 原7浏览器/PG/worker/lease/replay/socket/restore/measurement清单逐项映射；auth6和durable-PG6定向重跑，28旧证据逐hash不变 | 不退役脚本，未重跑的旧项目不计本次通过；生产PITR/RPO和压力职责保留 |
| AC5 实际CI | 63文件typed lint/零豁免、93场景、5网络/5产品/4报告/5构建/3配置反例及正控；全部原build/handoff/mobile/组件/隔离/PG/legacy链通过 | 独立CI当前提交、v2源码/图谱/实际bytes/逐PNG与run ID绑定；缺资源/skip/auto-update不能绿色 |
| AC6 诚实边界 | 270输入/63模块/48字体等摘要；原始失败、候选拒绝、review修补与下载证明分开 | WebKit不是iPhone/Safari16.4最低版；FF155不是128最低版；真实协议/供应商/SDK/设备/TestFlight/生产恢复仍由原Story关闭 |

审阅：三个无会话上下文层合并8项patch，0decision/0defer；全部修补、本地验证与定向复核，无剩余明确发现。R2曾通过原oracle复现inert+aria-hidden可见输入漏检；R3强制B先完成、旧A最后释放；R4/R8完整来源、构建与PNG证据经本次v2 CI实际通过。B09的window.open=null是明确替身；当前页回退导航是真实浏览器操作。

93项为23个B00–B22与8个V01–V08各三引擎，0skip/0retry。真实FIFO使用独立实际时钟，不把视觉固定Date作为10秒证据。所有业务请求均合成或明确隔离PG，真实Provider外发0。初始24张基线审阅决定及每文件hash在t5-baseline-review.json与apps/mobile/e2e/visual/approval.json；没有自动重录。

CI完整性反例为实际同一报告删引擎/删场景/skip/缺附件；构建绑定反例为真实HTML/public/native-auth/compiled-output/graph字节变动后还原；auto-update是在启动前拒绝的配置负例，不冒充产品缺陷运行。产品缺陷场景均有非零实际执行、目标断言和首次失败trace。

证据主入口：evidence/story-9-5-browser-2026-09-25/ci-verification.json、downloaded-artifacts.json、ui-delivery.yaml与ci目录。CODE-QUALITY-01/UI-BROWSER-01只关闭本Story；9.4原封存证明和其他Story条件未借用或覆盖。下一正式准备9.3，3.1继续paused；无部署/真实用户数据变更/新heartbeat。
