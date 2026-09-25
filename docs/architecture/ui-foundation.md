---
status: approved-target
updated: 2026-09-20
scope_revision: ui-foundation-2026-09-20
implementation_status: pending-owning-stories
---

# Nomad共享UI架构决定

批准记录：`_bmad-output/planning-artifacts/ui-foundation-scope-decision-2026-09-20.md`。统一组件基础、减少重复交互实现、采用当前推荐路线；Radix仍受支持，不能作为停止维护的迁移理由。当前React/Vite与领域/认证恢复架构保留。此为批准目标，依赖安装、组件消费和真实设备证据仍由9.3–9.7交付。

## 组件分层与实现边界

分层关系如下：

```text
业务页面 / 领域组件（HomeImportDock、POI、时间轴、账号等）
             ↓
Nomad 组合组件（AppSheet、AppDialog、AsyncState、FormField 等）
             ↓
Nomad 基础组件源码（Button、Input、Tabs、Skeleton 等）
             ↓
Base UI 无样式交互 + Tailwind 4 样式 / 现有品牌 tokens
```

- 首批落在 `apps/mobile/src/ui/{primitives,components,styles}`，由当前 Web/Android/iOS 和同一前端内的运营页面复用。当前没有需要为此新建的第二个独立前端；以后确有第二消费 workspace 时再提取 `packages/ui`，避免现在额外引入构建发布层。
- shadcn 是受控生成/复制的源码起点；Nomad 维护最终源码和公共 API。业务页面只依赖 Nomad 层，不直接散落 Base UI imports，也不批量安装整套生成器 registry。
- 记录 CLI 版本、基础选择、registry 来源与摘要、生成文件和人工调整；逐个组件审阅升级差异。禁止运行浮动 `latest` 自动覆盖当前组件；不添加未经评估的 Radix、Drawer、Toast 等第二交互基础。
- AppSheet 通过现有 typed host 接口注册返回行为。共享组件不持有凭据、不加载服务端环境、不接管 operation/cursor/lease、也不成为第二份业务状态源。
- Tailwind 首次接入明确 CSS cascade/layer 顺序，保留现有 reset，默认不全局启用新的 Preflight。清点未分层的全局 button/input 规则及第三方地图样式；只在受影响消费点迁移、用已批准页面对照验证，不做全库 className/格式化替换。
- 暂时兼容的旧组件必须有清单、负责人、退出条件和对应 Story；同一弹层只由一种焦点/滚动锁/返回管理器控制。

## 版本与升级责任

下表来自本次 npm registry 只读核验，**尚未安装，也不是已验证兼容矩阵**。9.3/9.4/9.5 准备时冻结精确版本及 lockfile；升级后重新跑相应组件与宿主证据。React 19.2.7 / Vite 8.0.16 / 既有 Capacitor 版本保持，工具依赖用满足声明的 WSL Node 22 精确 patch。

| 组 | 候选版本 | 处理 |
| --- | --- | --- |
| shadcn CLI / Base UI | 4.21.0 / 1.8.0 | CLI 基础显式选 Base UI，按组件锁源码来源 |
| Tailwind / Vite 插件 | 4.3.3 / 4.3.3 | 同版本，peer 声明包含 Vite 8；仍需真实 build/browser 验证 |
| Storybook React-Vite / a11y | 10.6.0 同组 | 一致锁版本，开发构建与产品构建隔离 |
| MSW / Storybook addon | 2.15.0 / 3.0.3 | 仅开发测试，拒绝未声明网络外发 |
| Playwright | 1.63.0 | 包与对应浏览器 revision / CI 镜像一起固定 |
| ESLint / typescript-eslint | **9.39.5** / 8.70.0 | 当前最新 ESLint 10.11.0 超出 jsx-a11y 6.10.2 的 peer 范围，故不采用；不用 force 绕过 |
| Hooks / JSX a11y | 7.1.1 / 6.10.2 | 先覆盖实际 Hooks、Promise、类型与基础无障碍问题 |
| Query / Router（已批准独立实施） | 5.103.1 / 1.170.38 | 单独 Story 冻结并验证，不与核心组件一次落地 |
| RHF / resolver（随表单评估） | 7.88.0 / 5.9.1 | resolver 的 Zod peer 要求与当前 3.23.8/3.25.76 多版本需审计；不因接表单自动升级整个后端到 Zod 4 |

准确 engines / peer / 来源见 JSON 证据中的 registry 记录；optional peer 不等于必须一并安装。通用 class 合并、图标或日期依赖仅随实际选中组件核验和锁定，不默认引入未用整包。格式化只沿用一套规则、只作用于新建/确需修改文件；不把格式清理扩为本次产品范围。

## AppSheet与私有Portal

Base UI Dialog 提供可组合的模态/Portal 能力；Nomad 仍负责下面的宿主、身份与领域约束。[Base UI Dialog](https://base-ui.com/react/components/dialog)

1. 一个受控 Portal 容器位于 React provider 与身份遮蔽边界内；App 页面与 portal 同时被遮蔽/卸载，不能只隐藏 root 背景留下私有弹层或 Toast。公开协议另有明确公开边界。
2. 打开时焦点进入正确标题/字段；Tab/Shift+Tab 不逃逸。正常关闭恢复到同身份、仍连接的触发器，否则去安全页面标题。身份丢失不向旧私有控件恢复焦点。
3. 背景不可交互、不可读出，并锁滚动；嵌套只允许原批准流程所需一层上级确认，最上层唯一接收 Escape/返回。关闭、路由切换、React StrictMode、异常和身份撤权都释放 listener/scroll lock。
4. Android 返回先按现有宿主规则处理键盘，再顶层临时层，再页面历史；busy/未提交草稿由业务提供关闭策略。同一事件不得同时触发 Base UI 关闭、旧 handler 和页面后退。
5. 外侧点击、Escape、返回手势、按钮关闭共用受控关闭入口；未经确认的关闭不保存、不提交、不重复启动任务。身份撤权优先安全隐藏，不因正在等待业务关闭回调泄漏内容。
6. 中文键盘、横向空间受限、刘海、手势区及 200% 字号下主要动作可达；安全区每条边只由明确一层消费。文档记录视觉 viewport/键盘事件的共同责任，避免插件与 CSS 重复补偿。
7. 使用原 240–300ms Sheet 动效及 reduced-motion；Home FIFO 只累计真正可见时间，被 Sheet/后台/身份确认遮挡时遵守 1.6/1.7 的现有显示与 ACK 合同。
8. Screen-reader/大字号/焦点/返回等必须有实际交互证据；浏览器 a11y 扫描只是其中一层。

## 页面迁移责任

| 当前/目标使用面 | 迁移内容 | 页面与业务验收责任 |
| --- | --- | --- |
| LoginScreen、协议、验证码字段 | Button/Field/可用与错误状态；入口顺序及认证 transport 保持 | 1.0；历史 1.1/1.2 保留 done |
| Settings 当前退出确认 | AppDialog、焦点/返回/未知退出状态 | 当前会话退出归 1.0；未来完整设置页面归 7.3，历史 1.5 不重开 |
| HomeSheet、HomeImportDock、输入分类与结果弹层 | AppSheet、统一输入/状态；FIFO、operation journal、cursor、归因不替换 | 1.6；1.7 只补受影响 ACK/恢复回归，不改为组件框架工程 |
| owner 导入记录及运营地点纠错 | 列表/Field/Dialog/空错状态 | 1.8 / 1.11；1.9/1.10 的服务端媒体能力保持原合同 |
| 时间、班次、住宿、约束、Picker、POI、规划 shell、候选/负荷/搜索 | 基础字段、Tabs、AppSheet 与 AsyncState | 2.3–2.10、2.12、2.14、2.15；2.11/2.13 的服务端权威不迁入组件 |
| SlotEditSheet、DayPlan 弹层、后续编辑/修复/AI 调整 | 复用共享模态和控件，保持 revision/undo | 3.1–3.5；**3.1 仍 paused**，旧 2.2 不另派发 |
| 跨城/一日游确认与上下文 | 组合组件和边界提示 | 4.1–4.7；不改变 Trip 原子发布 |
| 细节、来源、行程单、导出/分享 | 页面级阅读与临时层分开，真实进度/保存语义保留 | 5.1–5.5 |
| 餐饮、定位降级、清单与购物记录 | 选择控件、Sheet、空错/权限状态 | 6.1–6.5 |
| 最近行程、完整设置、副本/删除/反馈 | 列表、表单、受控确认与回执状态 | 7.1、7.3–7.6；不恢复 7.2 |
| 自有桌面运营页面 | 基础组件可共用；保持桌面权限与证据 | 1.11、8.3–8.6；8.1/8.2 不重绘 Sentry/Langfuse 的成熟 UI |
| 原生入口、最低平台与发行 | 16.4 支持、组件宿主验证、候选包追溯 | 9.1 / 9.2 |

先完成旧页面基线，然后用 9.3 在现有登录或 Home 弹层形成实际可运行切片；页面级认证/导入验收仍由 1.0/1.6 承担。未来页面在所属 Story 第一次实现时直接消费共享层。暂时保留的 legacy 组件列出迁移责任，不允许后来新增页面继续复制。

## 交付与失败恢复

UI-COMPONENT-01、UI-WORKBENCH-01、CODE-QUALITY-01、UI-BROWSER-01按Story记录。9.4交付可运行工作台和真实lint，9.5保护现有流程，9.3迁移实际代表性消费点；Query9.6与Router9.7分别实施。旧组件兼容清单必须有责任与退出条件。出现身份、焦点、返回或布局回归时可回退单个适配层，保留业务controller/journal与数据，不能清空IDB/账号解决。

支持矩阵由app-host.md统一定义；图形/字号/状态规则由front-end-spec.md和UX-DR37定义。当前1.7完成后停止边界保留，新的准备顺序不是自动启动许可。
