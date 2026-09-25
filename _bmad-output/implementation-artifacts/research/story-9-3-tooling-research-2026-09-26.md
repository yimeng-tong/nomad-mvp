# Story9.3 技术版本与Dialog边界研究

2026-09-26，独立只读研究者story93_tooling_research核验官方文档/npm/固定tag源码；没有安装依赖或改仓库。主任务复核批准ADR与当前清单，候选与9月20决定一致。

| 项目 | 精确候选与约束 | 主来源 |
| --- | --- | --- |
| shadcn CLI | 4.21.0；Node>=20.18.1满足22.22.1；显式--base base | https://registry.npmjs.org/shadcn/4.21.0 ，https://ui.shadcn.com/docs/cli |
| @base-ui/react | 1.8.0；React/DOM peer含^19；date-fns optional不必自动安装 | https://registry.npmjs.org/@base-ui%2freact/1.8.0 |
| tailwindcss / @tailwindcss/vite | 同为4.3.3；插件peer含Vite^8，oxide要求Node20+ | https://registry.npmjs.org/tailwindcss/4.3.3 ，https://registry.npmjs.org/@tailwindcss%2fvite/4.3.3 |

React19.2.7/Vite8.0.16/Node22.22.1/pnpm11.7.0与现有工具/Capacitor保持。安装、security/peer实际结果及lockfile仍需DS记录；本报告不保证未核验组合已运行。

CLI支持add --dry-run/--diff/--view。固定CLI不会冻结远程registry响应；按组件记录URL、抓取hash、生成文件与人工差异。示例Base Nova Sheet registry原响应hash为72b36d92af7fcbc9bd2d1d4ef0cbc65f4fc8178f7bb2bedaf657460f15011cf4，URL https://ui.shadcn.com/r/styles/base-nova/sheet.json 。它只是来源研究，不是选择Nomad新主题；含占位符/registry alias，也有150/200ms默认动效，不能直接覆盖品牌或240–300ms合同。

组件入口包括@base-ui/react/dialog、button、input、field、tabs、use-render、merge-props；组合用render并转发ref/DOM props，不沿用Radix asChild假设。业务只引用Nomad层。官方Sheet是Dialog定位组合，不自带拖动或snap点；不因此另装Drawer。来源：https://base-ui.com/react/handbook/composition ，https://ui.shadcn.com/docs/components/base/sheet 。

Dialog Root用受控open/onOpenChange，details.reason分外侧/Escape/关闭/命令式等，异步业务决定前同步details.cancel；disablePointerDismissal仅管外侧。modal=true提供focus/scroll/outside管理；trap-focus模式不禁止外侧交互或滚动。Popup须有可访问关闭，initial/finalFocus支持ref/boolean/callback；触摸默认聚焦Popup以免擅自弹键盘。来源：https://base-ui.com/react/components/dialog 。

关键固定版本细节与Nomad约束：

1. FloatingPortal中literal container=null等待容器；传ref对象而current=null可能回退parent/body。使用已解析HTMLElement或literal null并守住Root开放时机。固定源码：https://raw.githubusercontent.com/mui/base-ui/v1.8.0/packages/react/src/floating-ui-react/components/FloatingPortal.tsx 。
2. finalFocus回调返回null会走默认trigger/previous fallback；禁恢复要false。Focus归还排在微任务里，必须届时再检查身份/代际、connected、disabled及hidden/inert。固定源码：https://raw.githubusercontent.com/mui/base-ui/v1.8.0/packages/react/src/floating-ui-react/components/FloatingFocusManager.tsx 。
3. 由现有auth结构推论：仅CSS隐藏仍open的Root不足，旧focus/scroll/aria管理仍可能生效；身份核验须立即关闭/卸载交互生命周期，草稿/已确认内容在领域层保留，不等busy决定或退出动画。
4. 默认keepMounted=false；若保留Popup，其hidden可被无Preflight下display:flex覆盖，必须scoped hidden规则和实际负例。不要给整个应用加入新reset来处理单组件。来源：https://tailwindcss.com/docs/preflight 。
5. 原生/异步关闭须走现有host唯一排序，替换旧HomeSheet trap/HomeScreen modal handler；Base UI不能替代Nomad键盘→Sheet→页面优先级。
6. Tailwind只引theme.css/utilities.css并声明layer，不引preflight。未分层legacy规则胜过普通layer utilities，逐消费点核对。来源：https://tailwindcss.com/docs/installation/using-vite 。
7. Base UI支持transition状态属性并等待普通退出动画；身份安全不能等动画，Dock计时也不能在仍遮挡时提前恢复。来源：https://base-ui.com/react/handbook/animation 。

平台声明：Tailwind4为Safari16.4+/Chrome111+/Firefox128+；Base UI1.8固定浏览器表涵盖Safari/iOS16.4、Chrome/Edge111及Firefox113+。Nomad目标范围与声明兼容，仍非最低平台实证。来源：https://tailwindcss.com/docs/upgrade-guide#browser-requirements ，https://raw.githubusercontent.com/mui/base-ui/v1.8.0/.browserslistrc 。Vite不自动补运行时API，保留native-build-config.ts所有JS/CSS targets：https://vite.dev/guide/build#browser-compatibility 。

Base UI固定scroll-lock源码记录iOS收起导航栏限制，当前指南还涉及iOS26 backdrop。须实测私有container几何/键盘/滚动恢复/安全区，不盲叠第二锁。来源：https://raw.githubusercontent.com/mui/base-ui/v1.8.0/packages/utils/src/useScrollLock.ts ，https://base-ui.com/react/overview/quick-start#ios-26-safari 。

结果仅为候选/API/风险研究；正式App身份/HTTPS、最低设备、读屏及TestFlight不从文档推出通过。
