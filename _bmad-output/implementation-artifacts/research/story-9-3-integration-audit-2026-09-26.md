# Story9.3 当前实现与更新边界

独立只读研究者story93_integration_audit在775b132/干净树完整读取下列UPDATE文件；无编辑、服务或外部调用。前一实际交付为9.5，9.4/9.5工具与93场景复用，9.3五条件均not-started。

| 文件（apps/mobile下，除注明） | 当前 | 本Story最小修改 | 保留 |
| --- | --- | --- | --- |
| src/App.tsx | hidden+同步CSS、epoch key；Dock按epoch创建 | 私有DOM内Portal/provider和安全focus目标 | /me/sequence/abort、pendingLogout/single-flight、auth1000/page0、同身份草稿 |
| src/home/HomeSheet.tsx | 32行自管focus/Escape；无Portal/锁滚动 | AppSheet兼容适配，去旧manager | label/children/真实trigger与原close回调 |
| src/home/HomeScreen.tsx | 三Sheet priority20、home-body inert、Dock active | shared manager后移除重复责任；接实际遮挡 | clearParsed不清draft、candidate/result symbols、epoch/activity、选中/operation |
| src/auth/LoginScreen.tsx | 实际phone/OTP/PNVS intent、generation、公开法律fallback | 共享Button/Field/Input及状态 | 方法排序/IME/name/inputMode/autocomplete/maxLength、challenge/phone、abort与既有onSubmit |
| src/settings/SettingsScreen.tsx | inline退出role=dialog，legacy返回分支 | 仅退出确认AppDialog；去该重复分支 | App onLogout、未知退出；其他legacy面不当新7.3 |
| src/styles.css / platform/app-host.css | 1548行未分层规则，页面/Dock/Sheet各自insets | scoped tokens/cascade/迁移选择器 | 不新Preflight、不全库格式化；原品牌和同步身份遮蔽 |
| package.json / vite.config.ts / .storybook/vite.config.ts | 无Base UI/Tailwind/src/ui；独立产品/工作台 | 精确依赖/来源/同样式构建 | 现有React/Vite/Node/pnpm、proof/env隔离与targets |
| index.html | root+模块入口 | app-host规定的旧浏览器可读升级提示 | viewport-fit=cover/中文，不能伪造最低平台支持 |
| workbench/{HomeSheet,LoginScreen}.stories.tsx、.storybook/preview.tsx | 当前18组件例/canvas/MSW ledger | 真实适配与共享provider/新增状态 | 原场景责任/网络否决；不用fake同形UI |
| workbench/TextScale.tsx | 仅wrapper子树computed font加倍 | Portal留其子树；必要时扩明确目标 | 动态字段/Portal实际200%，不只放大外层 |
| scripts/workbench-mutations.ts / check-workbench-counterexamples.mjs | focus/keyboard/axe锚HomeSheet；association锚Login | 对准新实际实现再证红/绿 | ANCHOR_MISSING/启动/编译/零例不是缺陷证明 |
| .github/workflows/ci.yml（根） | push main/9.4/9.5；PR main/1.0/9.4 | 新9.3分支/实际PR base | 原整条PG/auth/恢复/lint/工作台/隔离CI |
| candidate workflow（根） / e2e/visual/capture.ts | 两处限定9.5候选ref | 两处同步明确9.3候选 | CI/ref/unapproved/hash/逐图审阅/普通CI无更新 |
| e2e/flows、visual/screens、run-contract | 93例、v2真实源/构建/PNG | 新真实Portal/关闭/锁/身份/退出动画与新ID | 旧业务职责、独立必需矩阵和不能skip |
| src/{App,auth/LoginScreen,home/HomeScreen,settings/SettingsScreen}.test.tsx | 直接render真实页面及journal fixture | 按需真实provider包装/新适配断言 | 不绕过原请求/草稿/身份/选择断言 |

NEW只限共享src/ui/{primitives,components,styles}及实际证据/测试。公共API覆盖tokens、Button/Field/Tabs/Toast/Skeleton、AppDialog/AppSheet、AsyncState；不整包registry、不先造packages/ui。

epoch只随owner/session/nativeGeneration变，activity每次checking/unavailable变；延迟close/Toast/focus至少检查scope/activity/instance/abort。同owner恢复可确认内容，不能按activity重建整个Home/Dock丢草稿。Portal必须在真实DOM遮蔽边界内、inert背景外，不能只靠React provider或body fallback。

host.ts/host-runtime.ts/HostBootstrap.tsx可复用：keyboard优先、priority降序同级后注册优先、异步合并/AbortSignal/backRevision/unmount保护；不再加native listener。Base UI接管后仅删被迁移modal的旧Home/Settings priority20分支，保留auth1000与page0。

B08现合同允许分类Sheet在confirmUnknownLink的加密准备期间Escape关闭并回输入，释放后一次原POST；共享busy不能一刀切禁止关闭。点击来源早于disabled/异步解析，不能改为挂载时读activeElement。h1安全fallback需明确tabIndex/ref。

Dock active与layout ACK是真实领域接点：240–300ms退出尚遮挡时继续暂停，不能logical open=false就恢复FIFO；保持11秒遮挡、关闭后剩余窗口耗尽与reload不重播正控。身份强制隐藏时立即停用交互并取消旧close/focus，但不改controller/journal/cursor。

KeyboardResize.Native、contentInset=never、SystemBars CSS变量已有单一分工，html/root无padding。AppSheet每边指定safe-area owner；visualViewport不得另叠键盘高度。Base UI默认body Portal/hidden保留节点、关闭focus微任务和iOS滚动行为需按tooling research核验。

工作台Portal须在canvas/TextScale边界内；实际产品新增全文/输入值/交互/ARIA oracle场景。normal/reduced、top-only、StrictMode、异步关闭拒绝/撤权、old-owner请求/close/Toast回调都需正反例。9.5源码HTML/native-auth/bytes/PNG/hash门禁保留；候选从明确commit/ref实际跑后下载逐张审阅，再最终CI。原auth/PG/SIGKILL/journal/checkpoint/压力不退役，实际受影响项定向重跑且不覆盖旧报告。

真实Android/iPhone、最低iOS16.4、中文键盘/系统栏/safe-area/读屏/200%/reduced-motion独立验收。资源问题已发送；缺项时APP-HOST-01/AC6和整张9.3保持未完成，可另写shared-ui-local-regression-passed供未来9.6/9.7消费。不得自动关闭1.0/1.6/1.7/9.1或改变3.1暂停。
