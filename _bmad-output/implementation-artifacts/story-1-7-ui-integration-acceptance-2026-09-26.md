# Story 1.7 共享 UI 恢复回归：本地切片验收

状态：**本地 Web/IDB 集成切片已验证；Story 1.7 仍 in-progress**。核验源码为 `271999834bafe0a0c61774beba50ee1883ee40da`，分支 `codex/story-1-7-ui-integration`。GitHub CI `36222862831` 的两个 job 均成功；五个产物 ZIP 共 1003 个文件逐项 CRC 无误，详见 `evidence/story-1-7-ui-integration-2026-09-26/ci-verification.json`。

旧双进程 Home 探针检查迁移前的 `.home-body.inert`，在 9.3 共享 AppSheet/PrivateUiBoundary 后会误判。现改为验证实际受保护祖先的 `inert`/`aria-hidden`，以及 Sheet 退出后的解除；探针自身、Home/Controller/Journal 和共享 UI 共 16 个源码文件进入报告指纹。CI 下载的报告 SHA 与仓库本地报告完全相同，16 个源码哈希与当前提交一致。

实际 App/Chrome127、真实 IndexedDB 和两个浏览器进程完成 22 项显式替身回归：多链接及 partial/FIFO、Settings 往返草稿、Sheet 覆盖 11 秒不消耗窗口、同 job 重试、未知受理只读核对、确认外链去重、丢 ACK 后沿原 operation 跨进程恢复、不重 POST，以及换 owner 后不读取旧回执。三张当前截图与完整报告保存在同一证据目录。三引擎页面主报告 129 expected、0 unexpected、0 flaky，其中 33 个视觉场景；其 313 个源码哈希匹配。原1.6输入事件探针在此提交也再次通过，108 个源码哈希匹配。

HTTP/SSE、身份、Clipboard 均为明确替身，真实供应商调用 0；这不证明真实认证、原生系统返回/后台/进程终止、Android/iOS C07 或生产备份/恢复。1.7 T5原生bridge、T6设备交互、T7真机与T8 PITR/RPO/正式目标继续开放；9.1宿主真机及公开协议资源也仍开放。CODE-QUALITY-01 和 UI-BROWSER-01 仅在本 Story 当前本地切片范围 verified，其余条件与整张 Story 不因此关闭。
