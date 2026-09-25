# Story9.5开发进度

当前in-progress，唯一writer01a0d78a-3692-78b1-aee5-76268a743925；分支codex/story-9-5-browser-gates，准备提交fcffc11。T0实际固定容器环境预检已接线；新增browser-environment.mjs记录实际Node/pnpm/OS/三引擎版本和字体/配置hash。现有Playwright复用，无依赖或产品页面变更。

本机Ubuntu26.04被canonical检查明确拒绝（预期失败），typed lint覆盖38个文件且0诊断，handoff通过。下一推送后读取固定noble/amd64容器实际启动和font证明；此前不标T0完成或三引擎产品流程通过。未来T1–T8、UI-BROWSER-01本身仍待实施。

首次T0容器CI36133102037在Node/pnpm/OS前置通过后，脚本直接resolve传递依赖playwright-core而失败；pnpm干净布局不会把传递包当直接依赖暴露。已改从playwright自身package上下文解析其core依赖，本地精确元数据解析和lint通过，不增加依赖。原失败保留；新提交继续取真实容器font/engine证明。

本地Firefox155/WebKit26.6已下载到/tmp/nomad-story-9-5-browsers，Chromium复用9.4同revision。现时本机Firefox报告profile不可见，WebKit缺gtk4/gstreamer等共享库，不能把下载成功当运行；canonical CI仍按独立镜像验证。
