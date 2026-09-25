# Story9.4实施决定

## D1 开发基线与唯一写入者

背景：用户要求Git基线后由新任务开发并持续滚动准备。证据：abac3df包含b8b4455与7ac0be3；接手时工作区干净，9.4源/锁摘要匹配独立VS。决定：从abac3df建立codex/story-9-4-workbench-quality，本任务唯一写入；保留合同原baseline_commit，在独立manifest记录实际开发基线。CURRENT/Sprint/monitor同步真实状态；heartbeat保持PAUSED。后果：审阅只比较本次开发基线，不把此前auth/journal/cursor实现纳入重写，也不丢失历史记录。

## D2 工具和覆盖

背景：9.4批准固定Storybook10.6/MSW2/ESLint9及单Chromium组件验证。决定：首轮cohort固定现有HomeSheet/LoginScreen、新工作台与工具代码；所有基线后新增/内容改变源文件必须纳入，历史未动范围明确列出。历史诊断必须经过真实lint，逐文件/节点位置/源码摘要冻结，不自动生成豁免。先做T0工具与基线，再T1最小工作台，再完善T2–T7；任务依赖需要的配置先建立，最终闭环逐项验证。后果：保留原单元/PG/原生证明，不提前引入9.3/Query/Router。

## D3 当前审计覆盖准备候选

背景：本轮pnpm audit发现候选@vitest/browser4.1.9的GHSA-p63j-vcc4-9vmv（critical，4.1.10修复）及Vitest/mocker的GHSA-82fw-gwwq-j7x9（4.1.11修复）；原合同表是准备候选，不是已执行安全审计。官方公告与本轮npm输出作为证据。决定：Vitest与@vitest/browser-playwright统一精确4.1.11，保留主版本和原jsdom单元入口；新增@types/node22.20.3直接开发类型依赖以覆盖Node配置（同版本已在原lock中）。只对新lint链使用兼容patch minimatch3.1.5/brace-expansion1.1.18，未提高任何peer许可，不使用force。MSW安装后自动复制worker脚本禁用，显式复制官方worker到.storybook/public并检查字节摘要。后果：偏离原Vitest4.1.9候选的理由可审阅，必须重跑原mobile单元测试。其它继承的服务器/旧Puppeteer/Vite传递告警保留逐路径记录，不在工具Story顺带升级产品框架/认证恢复。正式候选发布前这些风险仍需对应依赖维护处理，不声称全仓audit清零。

来源：https://github.com/vitest-dev/vitest/security/advisories/GHSA-p63j-vcc4-9vmv 、 https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9 。

## D4 运行器与失败证明隔离

背景：临时副本通过共享node_modules运行Browser Mode时，缓存解析出副本外的setup路径；并行原jsdom也共用Vite默认缓存。决定：产品jsdom保持原配置，工作台builder/browser及每个反例使用独立cacheDir；浏览器缺陷通过显式NOMAD_WORKBENCH_MUTATION的Vite内存转换注入，不改源码。反例先有正常控制、每次核对非零退出及目标失败、拒绝哨兵泄漏，最后再正常控制。后果：没有破坏产品工作树的故障注入，fixture生成或全跳过不能算通过。全部正反例已在真实Chromium执行，仍非真机。

## D5 CI实证与同分支交接

为取得9.4本身的实际CI，保留main push/PR并增加本开发分支push和指向已推送父分支codex/story-1-0-production-auth的PR。PR/push比较base显式传入、checkout完整历史；不从main的旧状态回收既有auth工作。旧PG/原合同探针保留。当前允许开发测试与Git增量推送，不部署业务或重启旧task/heartbeat。

## D6 保留旧CI整链并修复实际阻断

背景：新工作台门禁通过后，旧进程观察、PG合成数据和SSE reader、Prisma生成顺序、Redis生命周期依次暴露真实CI失败。决定：保留每轮失败记录，只修已定位的观察/fixture/构建顺序及Redis关闭连接，不跳过旧责任。Redis修补由5秒子进程自然退出反例及实际PG+Redis HTTP验证，CI原PG15/Redis7服务版本不变，持久认证步骤设3分钟失败上限。后果：新增服务器文件进入相同typed lint，原认证/日志/租约语义及其他Story真机/生产关闭门槛不变；最终完成仍等待整链CI。
