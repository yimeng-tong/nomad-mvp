# Story9.3 开发进度

Status: in-progress
Baseline: 源码775b132；准备合同/独立VS提交823fd85已推送
Writer: 当前WSL任务01a0d78a-3692-78b1-aee5-76268a743925

## T0 启动

bmad-dev-story已解析customization，无prepend/append/on_complete，project-context为持续事实。中文、中等技术细节继承当前项目。无既有本Story代码审阅待办，T0为首个未完任务。当前源hash/8GWT及ready状态交接检查通过；9.4/9.5交付保持done，3.1保持暂停。Story原baseline_commit保留775b132，准备基线另记823fd85。

Node22.22.1/pnpm11.7.0实读符合，React19.2.7/Vite8.0.16/Capacitor与验证工具不升级。精确候选先核对来源与peer，再逐件复制/适配。开发配置不读取server secrets；本次没有真实API调用、部署或共享数据变更。

实际资源：当前执行端为WSL，尚无已验证的Mac/Xcode/签名、最低iOS/iPhone或Android真机验收入口；Sprint已有问题已问，后端native HTTPS仍未核验。这是证据缺口，不称已有密钥缺失。T9/APP-HOST-01保持未验收，独立UI任务继续。

## T1–T5 当前实现（尚未整体验收）

精确包已安装，原有直接包版本与全部旧package entries保留；只新增26项package。受控copy保存8份registry原响应/hash/MIT、CLI4.21.0实际版本与隔离lock摘要。Tailwind产品/工作台接入无Preflight，当前tokens11组适用颜色对比通过；浅绿上的accent小字4.479:1被拒，选中项沿用深色文字。T1阶段产品/Storybook构建、242原移动测试+5原生配置测试通过。全仓audit非零；新增包无直接advisory，继承Vite/PostCSS/nanoid等旧风险如实保留在dependency-and-foundation，不宣称全仓安全。

已实现Button/Input/Textarea/FormField/Tabs/Skeleton/AsyncState，Base UI共享AppDialog/AppSheet、PrivateUiBoundary和非关键去重Toast；业务无散落Base UI import。登录/Home兼容适配与Tabs/当前退出确认已实际消费。原优先20只从Home模态及Settings退出分支移除，Settings其他分支保留；shared100/101低于auth1000。原App/dock/journal权威保持；涉及文件被真实typed lint覆盖并修复必要的旧Promise/测试类型写法。

Base UI1.8的useScrollLock在open=false立即解锁；当前实现保持唯一Base UI modal直到自身实际退出动画结束，随后卸载释放。DOM层仍在私有遮蔽内；身份checking/unavailable立即卸载，不等待动画/关闭决定。晚close/focus/Toast绑定epoch/activity/owner/session/nativeGeneration，正常卸载聚焦前微任务再次检查。

17个新增控件/关闭策略/Portal集成测试通过；实际消费后259移动测试+5原生配置测试通过，所改产品typed lint通过。最初3个测试失败来自Tabs角色与模态关闭后背景等待，已按真实语义调整且保留B先回/A后回的迟到结果责任。该结果仍是本地jsdom，尚非三引擎/真机证据。

T6工作台已保留18原场景并增加12项共享状态/交互；首跑29/30通过，唯一失败为Base UI Toast.Close默认aria-hidden影响可访问关闭。单条通知现显式aria-hidden=false并保留低优先播报，待当前复跑。mutant焦点/关闭/axe锚点已迁入真实新代码；负例runner强化非零失败且拒绝锚点/编译失败，完整负例尚未运行。

下一：工作台当前复跑及typed lint、完整16反例；扩三引擎产品/视觉场景和canonical候选，实际正常动效/FIFO、身份/Portal/私有回调回归；之后独立CR和本地gate。五条件尚未verified。T9真实设备入口未核验，整张Story保持in-progress。

## 当前候选前检查

整体背景mask补齐后：263移动测试（含17共享UI与4实际host协调器+替身driver测试）+5原生配置、30工作台、Chromium29个产品流程全部通过。真实Host协调器测试覆盖keyboard→shared100→legacy20/page0的单层消费，保存/导出/删除/反馈背景保留，不是设备实证。测试报告与当前本地source manifest见evidence/story-9-3-ui-2026-09-26/local-validation.json与local/。

16缺陷反例+2控制在page-mask最后修改前通过，正常跑中遇到的focus异步边界、一次浏览器session零测试超时均不计反例成功；工具已限定到实际受测HomeSheet/Login源码Story入口。最后page-mask改动会由当前CI重新验证全套。viewport反例刚加入，尚待canonical实际执行。

双端native:sync和native:verify配置/assets通过，静态隔离及7反例通过。首次隔离runtime未指定临时浏览器目录而失败，正确目录下重建当前Storybook后真实浏览器产品/工作台runtime通过；没有替代真机。9.4冻结cohort/原历史证据保持。

下一提交可审阅源码，生成33张三引擎unapproved视觉候选；来源和实际viewport/DPR逐件核验后才接受基线。并执行三层独立CR。整张9.3仍in-progress，四项UI条件未verified，APP-HOST-01/T9仍缺真实设备证据。

## 第一轮CR修补与视觉候选拒绝

a60674b候选CI36172229448生成32/33，Chromium320px V11关闭按钮0.40625px越界，整体候选拒绝；完整下载摘要与checker拒绝见candidate1-rejection.json。没有接纳其中32张作为本次baseline。

四项独立CR已修补复核：身份暂停打断已接受关闭、cancel释放pending、真实Enter的IME反例、默认trigger跨activity恢复。真实B29/B30旧实现均失败，新B26/B29/B30及B31外侧实际点击通过；工作台31、移动265+5配置通过，typedlint通过。本地产品5个故障/8控制实际通过，包含IME失去接线时1次误提交被拒。现矩阵129项/33视觉，准备候选r2与最终完整CI；原生和Story状态仍未关闭。
