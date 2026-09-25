# Story9.5开发进度

当前in-progress，唯一writer01a0d78a-3692-78b1-aee5-76268a743925；分支codex/story-9-5-browser-gates，准备提交fcffc11。T0实际固定容器环境预检已接线；新增browser-environment.mjs记录实际Node/pnpm/OS/三引擎版本和字体/配置hash。现有Playwright复用，无依赖或产品页面变更。

本机Ubuntu26.04被canonical检查明确拒绝（预期失败），typed lint覆盖38个文件且0诊断，handoff通过。下一推送后读取固定noble/amd64容器实际启动和font证明；此前不标T0完成或三引擎产品流程通过。未来T1–T8、UI-BROWSER-01本身仍待实施。

首次T0容器CI36133102037在Node/pnpm/OS前置通过后，脚本直接resolve传递依赖playwright-core而失败；pnpm干净布局不会把传递包当直接依赖暴露。已改从playwright自身package上下文解析其core依赖，本地精确元数据解析和lint通过，不增加依赖。原失败保留；新提交继续取真实容器font/engine证明。

本地Firefox155/WebKit26.6已下载到/tmp/nomad-story-9-5-browsers，Chromium复用9.4同revision。现时本机Firefox报告profile不可见，WebKit缺gtk4/gstreamer等共享库，不能把下载成功当运行；canonical CI仍按独立镜像验证。

第二次T0容器run36133619687已通过环境/字体读取及Chromium启动，Firefox因container默认root但GitHub挂载home属于pwuser而拒绝运行。仅将容器运行用户设为镜像已有pwuser，保持HOME变量及宿主目录不变。下一取真实三引擎结果，不跳过Firefox。本机Firefox的同一空白启动在工具权限对照下通过，说明原profile错误属于受限执行边界；功能测试仍必须使用受控profile/loopback替身。

T0固定容器预检实际通过：CI36134210825/job108068273744，Node22.22.1/pnpm11.7.0，Chromium153.0.8010.12/Firefox155/WebKit26.6。原环境JSON和scoped job证明已封存，仅证明资源启动，不是App流程。T0已勾选，下一T1独立runner/类型覆盖/新E2E资源隔离。为精确绑定运行路径，T1将对preflight和runner显式传包内executablePath，避免Chromium默认headless-shell与executablePath展示不同。

T1已接独立Playwright三项目、专用TSProgram、Vitest e2e排除和实际dist受控静态server。入口server先复用既有产品隔离checker拒绝过期/污染build；HTTP只在本轮loopback，外网与未知请求阻断。当前B00真实App服务不可用首屏在本地Chromium/Firefox通过，仍不是完整登录/业务流程，WebKit待同镜像CI。新E2E/Playwright/helper隔离反例先在旧checker失败（原5通过、新2失败），扩展后7组通过；native sync/verify、产品实际图谱和41文件lint及e2e typecheck通过。T1要等三引擎同一入口实测后勾选。

T1 canonical三引擎B00实际3/3通过、0skip（13a2fee/run36137026276/job108077440971），环境JSON及下载成员摘要已封存。explicit executablePath确保记录路径就是指定launcher；初始T0默认headless说明保留历史。T1勾选，下一T2类型化有状态API与严格网络ledger，再T3/T4完整App行为。

T2状态API fixture已实现：复用9.4DTO/合成配置，实际HTTP客户端匿名→登录、A/B、列表/候选/Settings、原operation receipt、partial/retry和持久cursor/SSE；JSON在受控延迟前固定原owner响应。未声明API/静态伪装/外网/retired请求由收尾ledger失败，四个实际Chromium反例和前后控制通过。B00–B04在本地Chrome/Firefox10项通过；新增真实SSE断开/后续完成断言又在Chrome单独通过。API fixture合同不等于App恢复全流程或真实后端。

每次run独立目录，重用已有report的run ID会失败；suite-run指针与counterexample分开，避免最终控制覆盖完整矩阵。初次B01红灯只保留原日志，早期默认目录的trace被后续run覆盖的事实如实记录；新目录机制保护后续失败记录。下一canonical三引擎完整复验T2后进入T3/T4。

T2 canonical run36142149598实际14/15通过，WebKit的fetch超时拒绝名为AbortError，原检查只接受TimeoutError而失败。新断言同时要求signal.aborted=true、signal.reason.name=TimeoutError，再限定fetch拒绝为TimeoutError/AbortError，未把一般网络失败当超时。真实失败trace/截图已从新独立run目录下载并记录hash；本地Chrome新断言/类型/lint通过后重取CI，T2保持未勾选。

T2 canonical结果已实际下载：4feb294/run36142857181，三引擎15/15、0skip；4故障+2控制和四个失败trace存在。signal超时原因断言在WebKit通过。T2勾选，转T3/T4实际页面组合。


T3/T4本机 Chromium/Firefox 各19/19通过；实际异步Sheet焦点与noopener误报修补有红/绿与独立窄审阅。242移动+5native配置、18工作台、typed lint、native sync/verify、7组隔离负例和handoff通过。原9.4反例在正常控制/焦点负例通过后 keyboard 子进程90秒超时，保留为未完成运行，正做定向复验；不计全部反例通过。T3/T4须等canonical三引擎证据，不先勾选。下一T5固定环境视觉候选与T6缺陷/完整性证明。

T3/T4 canonical首轮run36148595131为56/57、0skip，只有WebKit公开协议替身出现错误中文解码；trace中的response为text/html，显式补meta charset后重验，不放宽文本断言。工作台keyboard定向重跑实际触发toBeInTheDocument失败并正常退出1；先前批量超时仍保留，完整反例由后续完整CI复核。


T5新增8个固定环境视觉场景及B19/B20真实200%文字/长中文几何检查；后两项本机Chromium通过。24个三引擎候选用例已实际发现（仅list，不算执行）；候选使用明确codex/story-9-5-visual-candidate-*分支push，输出unapproved图片/源/环境摘要，不能覆盖正常基线。normal保持updateSnapshots:none、零像素/零threshold，并验证审批hash；当前没有已批准基线。新增setup绑定当前源码/lock/config/产品图谱，拒绝自动更新。下一推送明确候选ref，下载/逐张审阅实际图片后再接受。
