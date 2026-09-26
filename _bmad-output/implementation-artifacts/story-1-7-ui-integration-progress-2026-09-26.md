# Story 1.7 共享 UI 后的恢复回归

Status: in-progress
Base commit: 2c3305f49319cdf71f0dc2e084a161113b446d3c
Branch: codex/story-1-7-ui-integration
Scope: 近期计划第5步的1.7/9.1受影响集成，仅本地浏览器/恢复可独立验证的切片。

1.6规范输入事件的本地切片已通过CI36221667847，但1.7原生T5/C07、1.7 T8生产备份/目标及9.1双端真机仍开放。1.7当前合同T6/UI-BROWSER-01要求9.3共享UI迁移后的实际render/FIFO/durable ACK/跨owner回归，不改变已有operation/cursor权威，不从旧浏览器截图推导native验收。

读当前`apps/mobile/e2e/flows/home-sheet.spec.ts`确认新AppSheet的私有页面遮蔽在`.nomad-page`，现有三引擎B07已核对11秒Sheet覆盖不消耗完成窗口。旧`home-dock-browser-probe.mjs`以显式HTTP/SSE替身跑真实App+IDB的双进程恢复，在迁移前的`.home-body.inert`断言处失败；该节点不证明产品缺陷。下一步将探针断言改为检查当前受保护祖先遮蔽，再跑完整批次/FIFO/未知回执/重启同operation/owner切换。保持所有输出在临时目录并核对当前源码指纹，发现产品路径失败时再修实际代码。

已按当前AppSheet/PrivateUiBoundary改为等待`.home-body`的受保护祖先同时`inert`/`aria-hidden`，退出Sheet后验证两者恢复；探针报告还固定自身及共享UI源码共16文件SHA。实际Chrome127完成两个浏览器进程/22检查：多链接/partial/FIFO、Settings往返保留草稿、Sheet覆盖11秒不完成窗口、同job重试、未知受理只读核对、已确认外链去重、原operation丢ACK后跨进程恢复、换owner不读取旧回执。3张当前截图和完整报告见`evidence/story-1-7-ui-integration-2026-09-26/`；HTTP/SSE/Clipboard/身份均为明确替身，真实供应商调用0、真实native设备未验证。

新增CI步骤`ci:durable-home-browser`及单独产物，脚本在本地实际执行通过；typed lint与handoff通过。当前只证明UI迁移影响的Web/IDB回归，1.7 T5原生bridge/C07、T6真机交互、T8生产恢复/指标和9.1宿主实机仍开放，不据此标Story完成。下一步推送分支并核验CI独立运行和产物源码指纹。上段“下一步将探针断言改为…”为修复前记录，以本段为当前进度。
