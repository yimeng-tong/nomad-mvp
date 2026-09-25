# Story9.5准备验证

Status: passed / ready-for-dev
Date: 2026-09-25
Scope: current source contract and implementation readiness only

6组源GWT/narrative/Requirements保真，source hash54dc15b7f578eeb46e8b93566b2fb6a26deffc99aa8a88ed9c8cfd5692f44ad6；源catalog、delivery和批准ui-foundation/前端读取导航边界一致。仅准备下一张9.5，9.4已done并有真实CI/下载产物；3.1暂停、历史done与真实资源门槛保持。

独立合同VS通过；独立计划VS的两项补充（扩展新E2E产品隔离、明确真实CI触发/候选入口）已落实并复核无残项。对应research/story-9-5-contract-review-2026-09-25.md与story-9-5-plan-review-2026-09-25.md。

已有Playwright1.63.0 runner可复用，包/浏览器元数据和MCR镜像digest只读核验；尚未运行9.5三引擎套件/固定镜像或生成截图。本机无docker/podman，canonical像素证据由可实际执行的固定CI容器承担；首次真实运行仍需字体/Node及资源核验，缺项阻断对应检查。

两工程条件仍not-started，准备通过不计实现。实际Tasks包含FR1/FR18/FR52、NFR3/8/25、CODE-QUALITY-01、UI-BROWSER-01、ui-quality-tooling；旧探针矩阵保留IDB/kill/PG/SSE/恢复/真实服务责任。新合同可以进入已授权DS→验证→独立CR。

准备输入摘要见evidence/story-9-5-preparation-2026-09-25/input-manifest.json；状态同步后的ci:handoff结果记入同目录/preparation-checks.json。未更改checker、产品或测试实现；无需因文档状态同步重跑产品测试。
