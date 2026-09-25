---
story_id: '9.4'
date: '2026-09-25'
authorization_scope: preparation-and-validation-only
user_request: 可以，开始准备9.4
implementation_started: false
execution_boundary_unchanged: true
---

# Story9.4准备决定

## D01 — 明确合同准备范围

用户2026-09-25明确请求准备9.4。本轮创建/验证当前实际合同、更新ready-for-dev与next_story_to_prepare；不安装依赖、不实施工作台/lint、不重启资源阻断的1.7，也不解除stop_after_story。CURRENT主执行指针保持1.7，单列UI准备入口；文件只记录已给方向。

## D02 — 按正式准备序取源

9.4在当前catalog中是下一待准备项，6组GWT及Requirements逐字取epics.md。当前9.3/9.5尚未准备；数字较小不构成前置。9.4用已存在HomeSheet/字段提供可运行工具切片，不等待9.3/AppSheet和9.5关键流程截图。

## D03 — 最小组件浏览器运行时

实施初选独立Storybook10.6/Vitest4.1.9浏览器配置，必要时使用Playwright1.63.0仅作单Chromium组件测试provider。此为9.4工作台的测试运行时，不是完成9.5多引擎关键流程/视觉基线。保持默认mobile jsdom测试和产品Vite配置职责独立；精确API/peers参照本轮官方研究。

## D04 — 先把检查做真

现有lint是占位。计划通过真实ESLint typed规则及Hooks/a11y检查、明确执行覆盖、逐诊断历史基线与负例证明替换；baseline只能减少，不按总数量或整文件排除放过新问题。不大批改业务状态机/格式，不用规则关闭/无效退出码报告绿灯。

## D05 — 真实与替身边界

Storybook/MSW只服务开发和组件验证，单独静态资源/入口/配置/合成数据；保留生产transport、auth/journal/cursor。产品dist及复制的Android/iOS Web资源须证实不带mock worker或测试启动入口。9.4不绑定APP-HOST，也不因缺Mac/真机形成虚假前置；其结果不关闭其他Story真实运行门槛。

## D06 — 明确工作台独立目录与类型工程

选择apps/mobile/workbench而非研究建议的src/workbench，避免产品tsconfig当前src整体include混入开发场景。使用专用tsconfig与browser测试配置；保持工作台→既有组件单向引用、worker仅.storybook/public、产品不挂MSW分支。路径选取是批准工具边界内的实施细化，不改变源GWT或共享层src/ui归属。

## D07 — 固定当前支持的插件API

已核验的MSW addon3 CSF3入口/Storybook自动annotations/a11y字段规则默认值都写进合同。工作台使用CSF3和已核验精确候选，实际安装及安全/运行验证留T0，不因为依赖存在或peer声明而记为已通过。

## D08 — 独立复核的限定澄清

实施计划复核指出3项P2与1项隔离检查细化，均在准备内直接修正：LoginScreen真实PNVS分支不消费getCaptchaToken，故工作台固定fixture provider并在交互前拒绝误配；MSW默认print.error/warn会暴露完整请求，改为项目脱敏失败出口与哨兵负例；CI浅克隆需明确获取PR/push比较commit与失败策略；native:verify仅核对预期文件，另遍历两端完整资源清单拒绝额外遗留worker。源6组GWT、范围和授权均未改变。

## D09 — 正常准备状态推进的回归fixture

真实ci:handoff已接受9.4 ready-for-dev/next9.5。完整82项旧回归中有一条把读取实时Sprint的UI fixture下一项固定断言为9.4，导致合法准备后81通过/1失败。修正仅限测试fixture：使用本轮准备前已封存的CURRENT/Sprint/project-context，清除该临时fixture里尚未准备的backlog文件；live-workspace用例继续核对真实新状态。未改检查器、审批/停止/依赖规则或正式源。原测试文件另外保存为archive/story-9-4-preparation-2026-09-25/check-handoff.test.before.mjs。

## 准备收口

9.4已ready-for-dev，6组源GWT/指纹未变，两份独立验证通过，4处实施澄清已关闭；ci:handoff与修正fixture后的82项回归通过。下一准备9.5，当前1.7执行/停止、3.1pause与真实条件保留。没有运行或安装新工作台工具，不把准备当实施。
