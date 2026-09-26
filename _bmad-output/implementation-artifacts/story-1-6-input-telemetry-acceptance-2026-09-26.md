# Story 1.6 规范输入事件：本地切片验收

状态：**本切片已验证；Story 1.6 仍 in-progress**。核验提交为 `d02d0b002456dee6c2bc07471af63dcfc4cd50e9`，分支 `codex/story-1-6-input-telemetry`，GitHub CI 运行 `36221667847` 两个 job 均成功。原始可复算结论见 `evidence/story-1-6-input-telemetry-2026-09-26/ci-verification.json`；代码边界与算法见 `docs/ops/input-telemetry-v1.md`。

当前 Home/Controller/Dock 已在明确提交、当前分类、确认创建、实际完成卡片可见和结果内容可见处生产事件。创建与恢复 GET、后台终态与显示、加载 Sheet 与已读结果分别计数。派生的 UUIDv8 只服务于同 job/attempt 重复呈现的事件身份；撤回再授予后可再次送出同一 ID，供应商去重尚未证明。Dock 在视觉视口外或被遮挡时不 ACK；超过两秒仍以 250 ms 间隔等待露出，卸载后停止。本轮三路限定 CR 的计数缺口、提前 ACK、异步适配器拒绝 Promise 三项均已修复；长时遮挡复核追加了持久观察反例。

本地验证：283 项移动 Vitest 加 5 项原生配置测试、完整 workspace build、typed lint、handoff（9 Epic/67 Story/1089 GWT）和实际 App/Chrome127 输入事件探针均通过。隔离探针使用真实 App、IndexedDB、WebCrypto 和浏览器布局，以及显式 HTTP/身份/许可/遥测替身；2.15 秒全屏遮挡时未发 `ingest_presented`，移除后才送出。其完整报告由 CI 保存；仓库 `validation.json` 与截图保留本地结果和 108 个源码文件指纹。

CI 产物已下载核验：四个 ZIP 共 999 个文件逐项 CRC 无误。新增输入遥测产物的提交 SHA 与当前 HEAD 一致，108 个源码哈希匹配；网络计数为 `home_input_submit=2`、`home_input_classified=1`、`ingest_job_created=1`、`ingest_presented=2`、`import_record_opened=1`。两次呈现信封只有一个事件 ID；仅 1 次fixture ingest 写入、0 外站请求、0 真实供应商调用，网络序列化未含私人哨兵、URL、owner/session 或原 job ID。三引擎产品浏览器主报告 129 expected、0 unexpected、0 flaky，其中 33 个视觉场景；其 313 个源码哈希与当前 HEAD 一致。

这只验证本 Story 的安全生产点、局部浏览器呈现和质量门禁。App 默认供应商出口仍不可用；真实 SDK 关闭/缓存策略、版本化同意 UI、U-Link/U-App 实际归因和查询、Android/iOS 设备、真实 staging 目标与完整 T7/APP-HOST-01 没有验收。1.0/1.6/1.7/9.1/9.3 各自资源门槛、Story 状态和 3.1 暂停继续保留；下一步先做近期计划第5步的 1.7/9.1 受影响集成，再临近实施准备 1.8。
