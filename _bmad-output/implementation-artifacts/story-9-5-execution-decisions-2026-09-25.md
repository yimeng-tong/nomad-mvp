# Story9.5实施决定

## D1 实际执行基线与T0

CS/两项独立VS已完成，准备提交fcffc1157837a39c7c563288fcb1cafa9d4f5383已push，当前唯一writer与WSL/Git协作不变。保留Story原a950ea0代码基线，development-baseline.json记录实际DS起点。两个条件仅in-progress，3.1和真实资源门槛保留。

T0先在批准固定MCR Noble/amd64镜像实际启动三引擎并采集Node/pnpm/字体/OS/hash。为此先接CI环境预检和9.5触发入口，这是T0所需配置，不宣称产品流程/截图门禁已实现。现有playwright/test可复用，不安装新增工具包。根旧CI保持，canonical运行器显式Node22.22.1/pnpm11.7.0。

## D2 Firefox容器用户一致性

实际CI日志显示Firefox拒绝以root运行在pwuser拥有的GitHub临时home；使用官方镜像已有pwuser作为container user，遵循目录既有ownership，不重设HOME或修改宿主目录。Node/pnpm仍显式固定。该设置须实际容器三引擎启动证明，不能以配置补丁当通过。


## T3/T4实际页面与最小回归修补

背景：实际 App 的异步 parse 会在 Sheet 挂载前禁用 Send，原挂载时读取 activeElement 因此丢失返回目标。修补只由调用层记录真实激活的 Sheet 控件；显式 data-home-sheet-trigger 限定 Send/两处查看，候选 handler 记录 currentTarget，之后 focus 或回执/重试操作不覆盖。disabled 触发器回退现存可编辑输入；hidden/inert 身份树不恢复焦点。独立三层窄审阅指出的指针、busy、逐项 Tab 与关闭后计时正向控制均已修补、复核。

HomeScreen/HomeImportDock 新进入既有 typed lint 后补 promise rejection 处理与 Hooks 依赖，错误提示仍受当前 epoch/activity 约束；safeTitle 用等价 Unicode Cc 表达控制字符，保留原截断/双向控制清理。未改变 controller/journal/cursor/receipt 权威，未实现9.3共享组件。

B09 的真实窗口打开暴露原 LoginScreen 把 noopener 返回 null 当失败。红灯 trace 已保留；现保留 noopener/noreferrer，缺 open 或抛错才报告失败。WHATWG window open 算法 https://html.spec.whatwg.org/multipage/nav-history-apis.html 明确 new with no opener 返回 null，因此不能根据空引用判断被阻止。真实协议供应商仍未验收。

T3/T4新增19个总场景（B00–B18）在本机 Chromium/Firefox各19通过。B07使用真实同一 Date/performance/timer 的11秒遮挡和恢复计时，不冻结时钟；B08只延迟浏览器加密入口，释放仍执行实际 WebCrypto/IDB。B11经实际 UI 确认→reload先GET原operation，partial仍能查看并沿原job retry；B12遵守现有断线先重新核验身份，不能要求 checking 中私有警告可见。新 suite 的reload不冒充SIGKILL。

候选/结果延迟响应先固定原owner bytes，releaseAndWait等待HTTP handler后跨两个动画帧检查全document文字/输入/可访问树。B17同owner新session清旧草稿，B18迟到/me不能复原旧owner，B16由真实第二tab当前退出触发 BroadcastChannel/storage 失效通知。浏览器/HTTP场景全部合成，不关闭真实资源条件。
