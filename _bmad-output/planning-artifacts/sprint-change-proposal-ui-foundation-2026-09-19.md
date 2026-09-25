---
project: nomad-mvp
date: '2026-09-19'
workflow: bmad-correct-course
review_mode: batch
status: proposal-for-review
scope_classification: moderate
change_id: ui-foundation-2026-09-19
supersedes_scope: none-until-approved
approved_choices: [shadcn-ui, base-ui, tailwind-4, ios-minimum-16.4, nomad-shared-components]
implementation_authorized_by_this_document: false
contracts_appendix: sprint-change-ui-contracts-2026-09-19.md
input_evidence: sprint-change-ui-evidence-2026-09-19.json
---

# Nomad 共享 UI 与前端工程基础：完整 Sprint Change Proposal

## 1. 决策摘要与本轮边界

建议采用 **中等范围的直接调整**：保持当前产品、业务能力、页面布局和品牌方向，建立 shadcn/ui + Base UI + Tailwind 4 的 Nomad 共享组件层，并把组件预览、真实 lint、浏览器回归变成可执行交付。iOS 最低版本调整为 **16.4**，是用户已经确定的选择。

本轮产出完整提案、具体合同修改稿及输入证据。尚未应用本提案到 PRD、正式 epics、当前 catalog/delivery、实际 Story 或源码；没有安装依赖。本文中的新增编号均为拟议编号，最终由批准后的 CE 同步成为正式来源。

| 决定 | 当前状态 | 推荐处理 |
| --- | --- | --- |
| shadcn/ui + Base UI + Tailwind 4；Nomad 自有共享组件 | 用户已确定 | 在本次 CC 中落实架构、责任和验收，不重新询问选型 |
| iOS App 最低 16.4 | 用户已接受 | 同时调整原生目标、Web bundle、检查器和实测矩阵 |
| 保留现有布局、深绿品牌、18 组提示规则 | 本提案默认边界 | 不引入默认主题导致的视觉改版，不重新审阅全部页面 |
| Firefox 114 → 128；桌面 Safari 16 → 16.4 | **未批准的支持政策变化** | 推荐一起批准；不从 iOS 决定推导网页端批准 |
| Storybook、MSW、基础无障碍检查、真实 lint | 推荐纳入核心批次 | 独立 9.4，供 9.3 的组件实施使用 |
| Playwright 关键流程和截图回归 | 推荐纳入核心批次 | 独立 9.5，先建立现有页面基线再迁移组件 |
| TanStack Query / Router | 独立候选批次 | 分别拟议 9.6 / 9.7，不作为核心 UI 批次的前置或默认附带批准 |
| React Hook Form + Zod | 随具体表单采用的候选 | 首个多字段表单 2.3 试点；不改写简单登录/composer，也不新增全局表单重构 Story |
| Sentry / Langfuse / 评测 | 原 Story 责任 | 沿 8.1/8.2 等补接线与证据，不新增重叠平台 |

### 当前执行边界

读取时 CURRENT 指向 **1.7 in-progress**；1.0、1.6、9.1 也保持 in-progress，3.1 继承 in-progress 且 paused。Sprint 是 7 历史 done、5 in-progress、50 backlog，正式目录为 **9 Epic / 62 Story / 1052 GWT / 66 FR / 25 NFR**。

CURRENT 与 Sprint 已记录用户的新指令：**完成当前 1.7 后停止，不进入 1.8**。本提案不解除该停止边界，也不因原有 continuous_execution 字段仍为 true 而自动派发新 UI Story。当前 1.7 的事务、租约、持久 SSE 和客户端 ACK 按原合同收尾；组件迁移在批准并明确恢复相应执行范围后进行。监控不能把这个有意停止误判为普通等待授权。

同日已有 Capacitor 提案与批准文件，因此本文使用带 `ui-foundation` 的新文件名，避免覆盖 9 月 19 日已批准范围及其固定摘要。

## 2. 触发问题与实际证据

变更由用户在实施期提出，属于技术基础与跨页面 UX 实现方式调整，不是旅行规划需求失败或产品发现重启。

| 已核对事实 | 对实施的影响 |
| --- | --- |
| `apps/mobile/package.json` 为 React 19.2.7 / Vite 8.0.16，尚无这批 UI、Query、Router、Storybook 依赖 | 需要显式接入和锁定，不能把规划中的组件名当成既有共享实现 |
| `HomeSheet.tsx` 自管焦点、Escape、恢复；Settings、SlotEditSheet、DayPlanScreen 各有弹层与宿主返回处理 | 共用 AppSheet 可以减少重复实现；迁移必须保留业务关闭条件、草稿与宿主返回优先级 |
| `styles.css` 使用现有全局样式，已有文本 `#17211b`、背景 `#f8faf7`、强调 `#247e6f` 等 | 先映射现有视觉语义，不能直接导入生成器的默认黑白主题或任意覆盖全局 reset |
| `WEB_BUILD_TARGETS` 为 chrome111 / edge111 / firefox114 / safari16 / ios16；Vite cssTarget 仍为 safari16 | JavaScript 构建目标不能补齐 Tailwind 4 所需 CSS 能力 |
| iOS Xcode deployment target 四处为 16.0；CapApp-SPM 为 `.iOS(.v16)`；native verifier 检查 16.0 | 仅改 PRD 或其中一个目标会产生互相矛盾的支持声明 |
| 根 `ci:lint` 仅输出占位文字，当前 CI 也未调用真正的 lint | 要交付会失败、可追溯、覆盖实际源文件的检查 |
| CI 已运行 types、handoff/回归、build、认证/导入、隔离 PG、移动与若干合同探针 | 复用并补缺，不把当前 CI 误描述成完全没有测试 |
| 有 auth / Home Dock / operation journal / telemetry 浏览器探针，以及 1.7 的 PG worker/replay/lease 探针 | 为每个探针记录已有 CI 覆盖和迁移对应关系，不以新增 Playwright 为理由删掉真实事务/重启证据 |
| Home 与 Planner 分别组织城市/灵感读取和 loading/error；App 集中处理身份及页面切换 | Query、Router 有改进价值，但涉及身份、恢复与导航责任，应独立验收 |

35 份输入的完整文件摘要、章节索引、当前分支/HEAD、现行 GWT 数和 registry 候选信息已记录于[输入证据](sprint-change-ui-evidence-2026-09-19.json)。工作树存在大量此前变更；本提案的证据是读取时点，不是可以覆盖活跃开发的固定工作副本。

### 官方依据及其边界

shadcn 在 2026 年 7 月将新项目默认基础切为 Base UI，同时明确继续支持 Radix。采用理由是统一组件基础、减少重复交互、选择当前推荐路线；**不使用 Radix 停止维护或必须迁移的说法**。[shadcn 公告](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)

Tailwind 4 的基础浏览器要求为 Chrome 111、Safari 16.4、Firefox 128；更前沿的 utilities 仍需独立验证支持范围。[兼容要求](https://tailwindcss.com/docs/compatibility)

Storybook 有 React/Vite 集成，MSW 可复用网络替身；Playwright 提供跨浏览器测试和截图比较。这些能力支持本提案的测试分层，不证明已通过 Nomad 业务、原生桥或最低 OS 验收。[Storybook](https://storybook.js.org/docs/get-started/frameworks/react-vite)、[MSW](https://mswjs.io/docs/)、[Playwright](https://playwright.dev/docs/intro)、[截图比较](https://playwright.dev/docs/test-snapshots)

## 3. 推荐范围、替代路径与成本

| 路径 | 评价 | 结论 |
| --- | --- | --- |
| 在现有计划中增加可独立验收的共享 UI / 验证单元，页面随原 Story 消费 | 中等工作量；身份与弹层迁移风险较高，但可通过小切片、原页面基线及逐组件回退控制 | **推荐** |
| 回滚已完成认证、宿主、导入日志与恢复实现后重新开始 | 丢失近期验证、扩大工作树冲突，无法减少业务恢复责任 | 不采用 |
| 重写 PRD、重做产品发现、删减旅行业务来容纳新栈 | 当前业务目标没有变化，缺乏删减依据 | 不采用 |
| 一次加入组件、缓存、路由和表单后整体迁移 | 无法清楚定位身份/返回/请求重复回归，验收边界过大 | 不采用 |

核心建议新增三个 Story；Query 与 Router 两个候选分别决定。核心批准后为 **65 Story**，全部候选批准后为 **67 Story**；Epic 仍为 9，FR 仍为 66，NFR 仍为 25。扩展现有 NFR8/NFR25，不为了工具名称制造业务 FR。确切 GWT 与新增四条现有 Story 验收见合同附录：核心为 1076，另采纳 Query/Router 后为 1089；CE 以实际解析计数核对。

粗估以一名熟悉当前仓库的开发者为基准，属于规划区间而非承诺日期：核心基础、预览/lint、浏览器保护约 **8–15 人日**；现有登录/首页/退出弹层迁移和补证约 **3–6 人日**；Query 试点另 **2–4 人日**，Router 另 **4–7 人日**，首个复杂表单另 **1–2 人日**。最低版本设备、Apple 资源、真实服务与审核等待时间不包含在内。首个 AppSheet 和类型 lint 切片完成后重新估算。后续页面迁移计入各业务 Story，不另承诺一次重构全站的日期。

## 4. 技术与平台修改方案

### 4.1 支持矩阵与批准边界

| 运行面 | 现行代码/合同 | 拟议新合同 | 本轮决定状态 |
| --- | --- | --- | --- |
| iOS App | iOS 16+，Web bundle ios16 | iOS **16.4+**；Xcode 与 App SPM 根目标一致 | 已接受选型，待正式同步与实证 |
| Safari 网页端 | safari16 构建目标；产品未另列精确支持表 | Safari **16.4+** | 随网页兼容政策待确认 |
| Firefox 网页端 | firefox114 构建目标 | Firefox **128+** | 单独待确认 |
| Chromium / Edge 网页端 | 111 构建目标 | 111+，新增 utilities 不得暗抬下限 | 保持 |
| Android App | Android 10+ / 最低 WebView 111 | 保持；OS 与 WebView 能力同时满足 | 保持 |
| 桌面运营 | Web only | 同一网页兼容表；不新增运营移动适配 | 保持 |

推荐明确结束对 Firefox 114–127 和 Safari 16.0–16.3 的支持声明，显示简洁升级提示及可用替代入口，不将不受支持引擎误报为账号/网络失败。提示本身应由兼容的轻量页面呈现；不拿 UA 字符串或 JS 转译当 CSS 可用证明。若决定必须保留旧浏览器，则暂停依赖 Tailwind 4 的正式迁移，另评估旧 CSS 兼容路径的成本；不默默宣称降级样式已支持，也不撤销已接受的 iOS 16.4。

同步 `native-build-config.ts`、Vite 的 JS/CSS targets、所有 Xcode 构建配置、CapApp-SPM 平台值、宿主验证脚本及其反例测试、NATIVE.md 与设备矩阵。原生插件自己的最低版本可以更低，但不得高于 App 声明且必须记录真实有效 deployment target；不能为改文档批量篡改 vendor 文件。WebKit 自动化与当前 iPhone 通过都不能代替最低 iOS 16.4 的实际支持证据。

### 4.2 组件分层与依赖边界

新增架构 ADR `docs/architecture/ui-foundation.md`，在 `frontend-architecture.md` 和索引中引用：

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

### 4.3 版本策略与实际候选

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
| Query / Router（候选） | 5.103.1 / 1.170.38 | 单独 Story 冻结并验证，不与核心组件一次落地 |
| RHF / resolver（后续候选） | 7.88.0 / 5.9.1 | resolver 的 Zod peer 要求与当前 3.23.8/3.25.76 多版本需审计；不因接表单自动升级整个后端到 Zod 4 |

准确 engines / peer / 来源见 JSON 证据中的 registry 记录；optional peer 不等于必须一并安装。通用 class 合并、图标或日期依赖仅随实际选中组件核验和锁定，不默认引入未用整包。格式化只沿用一套规则、只作用于新建/确需修改文件；不把格式清理扩为本次产品范围。

## 5. UX、AppSheet 和状态合同

### 5.1 Tokens 与组件规范

在 `front-end-spec.md` 新增 Shared UI 章节，并同步 `mobile-ia.md` 的公共行为及 `_bmad-output/ux.md`。使用语义 tokens：背景/表面/文本/次级文字/边框/强调/待处理/破坏/焦点，字体与字号、4px 基础间距阶梯、圆角、层级、动效和触控尺寸。初值映射现行规范与真实 CSS；不同来源冲突逐项记录，不能以生成主题覆盖批准的视觉方向。新主题/暗色模式不在本次范围。

- Button：primary/secondary/quiet/destructive，loading/disabled 有真实原因；默认非提交按钮，只有明确表单提交才为 submit，icon-only 有 label。
- Field/Input/Textarea：可访问 label、description/error 关联、IME composition 不误提交，密码管理/验证码属性保持；校验失败保留输入。
- Dialog/AppSheet：共享模态基础；仅临时确认/编辑用模态，页面级 S10 ResultSheet 不因为名字含 Sheet 就改成模态。
- Tabs：键盘与选中状态正确，选择不会启动写入；日期滚动、稳定尺寸与原焦点语义保留。
- Toast：只用于适合短暂通知的非关键结果，唯一去重来源；未知写入、hard conflict、字段错误和恢复不移入 Toast，不覆盖 18 组低打扰规则。优先统一 Base UI Toast；需要额外实现时单列依赖理由。
- Skeleton/AsyncState：保留布局；loading、empty、error、disabled、reconnect、partial、stale、unverified 分开，不能用 Skeleton 冒充领域的旧 Skeleton planning 流程或虚假百分比。

### 5.2 AppSheet 的可验证行为

Base UI Dialog 提供可组合的模态/Portal 能力；Nomad 仍负责下面的宿主、身份与领域约束。[Base UI Dialog](https://base-ui.com/react/components/dialog)

1. 一个受控 Portal 容器位于 React provider 与身份遮蔽边界内；App 页面与 portal 同时被遮蔽/卸载，不能只隐藏 root 背景留下私有弹层或 Toast。公开协议另有明确公开边界。
2. 打开时焦点进入正确标题/字段；Tab/Shift+Tab 不逃逸。正常关闭恢复到同身份、仍连接的触发器，否则去安全页面标题。身份丢失不向旧私有控件恢复焦点。
3. 背景不可交互、不可读出，并锁滚动；嵌套只允许原批准流程所需一层上级确认，最上层唯一接收 Escape/返回。关闭、路由切换、React StrictMode、异常和身份撤权都释放 listener/scroll lock。
4. Android 返回先按现有宿主规则处理键盘，再顶层临时层，再页面历史；busy/未提交草稿由业务提供关闭策略。同一事件不得同时触发 Base UI 关闭、旧 handler 和页面后退。
5. 外侧点击、Escape、返回手势、按钮关闭共用受控关闭入口；未经确认的关闭不保存、不提交、不重复启动任务。身份撤权优先安全隐藏，不因正在等待业务关闭回调泄漏内容。
6. 中文键盘、横向空间受限、刘海、手势区及 200% 字号下主要动作可达；安全区每条边只由明确一层消费。文档记录视觉 viewport/键盘事件的共同责任，避免插件与 CSS 重复补偿。
7. 使用原 240–300ms Sheet 动效及 reduced-motion；Home FIFO 只累计真正可见时间，被 Sheet/后台/身份确认遮挡时遵守 1.6/1.7 的现有显示与 ACK 合同。
8. Screen-reader/大字号/焦点/返回等必须有实际交互证据；浏览器 a11y 扫描只是其中一层。

## 6. 组件迁移清单与 Story 归属

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

## 7. 工具、CI 与独立架构候选

### 7.1 Storybook / MSW / 真实 lint：拟议 9.4

交付一个可运行的组件状态工作台，先覆盖已有 HomeSheet/字段，再由 9.3 补共享组件示例。每个核心组件至少有正常、加载、禁用/原因、错误/重连、长中文、200% 字号、键盘、reduced-motion 与身份未确认场景；复杂组合补 empty/partial/stale。Storybook 展示用例不是 BMAD Story 状态。

MSW handlers 对齐生成 API 类型及现有安全错误，浏览器/Node 测试复用；未处理请求默认失败，静态资源允许清单明确。独立入口/构建产物中才启用，正式 Web/Capacitor build 无 mock worker/自动注册及相关启动分支；不让 MSW 改写真实 native transport 或替代 PG/设备验证。组件工作台不加载真实生产密钥，不上传用户数据，也不默认公开发布。

用 ESLint flat config + typescript-eslint 类型规则 + Hooks + JSX a11y 替换占位 `ci:lint`，CI 实际调用且失败阻止通过。初始覆盖新共享层、工具配置和迁移涉及的实际源文件；既有问题按文件/规则/原因形成冻结清单，只减不增，不能整目录关闭规则或用 `|| true` 掩盖结果。选择 no-floating-promises/no-misused-promises、必要 unsafe 类型、Hooks 与 label/交互语义规则；不要因修 lint 改写业务状态机。负向样例必须证明未处理 Promise、错误 Hooks 和缺失 label 会失败。[类型检查规则](https://typescript-eslint.io/getting-started/)

### 7.2 Playwright / 日常 CI：拟议 9.5

保留 Puppeteer 旧探针，先建场景对应表，证明等价覆盖后才退役重复脚本。首批：登录→Home→Settings→返回；Sheet 打开关闭/焦点/滚动；输入错误、loading/empty/partial/reconnect；身份变更遮蔽 portal；Home FIFO/操作回执不重发；长中文和大字号。现有 operation journal 的真实 IDB/双 tab/跨进程、1.7 的 PG/真实 SIGKILL/SSE 探针按原责任保留。

固定 Linux 镜像、Playwright/browser revision、字体、locale、timezone、viewport、DPR、时钟、数据及动画策略；截图按引擎独立基线。CI 输出 actual/expected/diff 和 trace，基线更新是显式审阅动作，不自动接受 diff。Chromium/Firefox/WebKit 流程至少都有身份与弹层覆盖；浏览器自动化不代替真机、最低特定浏览器或供应商实证。

| 层次 | 必须保留/加入的检查 | 不得替代的证据 |
| --- | --- | --- |
| 每次改动 | 生成类型及漂移、实际 typecheck/lint、handoff、单元/组件、受影响 Storybook interaction/a11y、构建 | 真实接口/原生能力 |
| 合并前 | 上述检查 + 关键浏览器与截图、受影响 PG 事务/迁移/恢复/真实 socket 探针 | 供应商与真机 |
| 发布前 | 明确候选源码/资源摘要 + 最低/当前平台真机、真实服务、签名/升级/APK/TestFlight | mock、模拟器、仅构建或上传受理 |

CI 清单逐一标注现有认证/ingest probes、home-dock/auth/journal/telemetry browser probes、measurements、1.7 event/lease/worker/replay/SSE/ACK。哪些已在 CI、哪些仍独立、哪些需隔离资源，都写入交付证据。不要把提案里的目标清单说成现在已执行。

### 7.3 Query：拟议 9.6，单独决定

试点限定 Home/Planner 的城市与 owner 灵感列表读取，证明取消、去重、失败/空结果、分页和刷新。未来已发布行程读取由其业务 Story 扩展。Query 管普通服务端读取；表单与 Sheet 状态仍在页面，operation journal、幂等回执、durable cursor/lease 仍归现有控制器，身份/原生凭据仍归鉴权层。

Query 默认行为包含 stale/refetch/retry，不能直接用于当前恢复链。[Query 概览](https://tanstack.com/query/latest/docs/framework/react/overview)、[默认行为](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

Nomad 的拟议 adapter 默认关闭自动 focus/reconnect refetch 与自动 retry；先由现有身份恢复协调器确认身份，再按资源显式刷新。请求使用现有 Web/native transport、AbortSignal 与 owner/session/activity fencing；private key 包含 owner、资源、筛选及必要 revision，未知身份 disabled 且不显示 private placeholder/cache。切 owner/撤权取消并清旧 cache，迟到结果仍被拒绝。首批不持久化 Query 私有缓存；城市公共数据单独命名空间。业务 mutation 不启用离线队列或自动重试，不包裹已有 operation 回执控制器形成双重写入责任。

### 7.4 Router：拟议 9.7，单独决定

试点现有 Home、Settings、Planner/DayPlan，并建立 S0–S11 typed route contract；未实现页面不创建假可达入口。Web 路由使用可刷新/直达的真实部署 fallback；原生路由历史与收到的外部深链分开，只有经过当前 input-v1/认证回调校验的 typed intent 才能进入导航。[Router 官方说明](https://tanstack.com/router/latest/docs/overview)

路由只存必要 public reference、允许的 stage/date/scope，不放 token、原始私人输入、受保护 URL 或完整草稿；关闭私有路径自动 prefetch，loader 只读且经过身份 guard。Android 返回由一个协调入口按键盘/Sheet/页面/root 分配，取消旧 App/页面重复 handler。离页保护复用既有未提交规则，保留 scroll/focus；导航不创造 operation、不启动 planning、不重播 transient Sheet。身份未知先遮蔽并核对，恢复到仍有效 parent；无权/缺失/过期参数不给跨 owner 回退。Query 和 Router 各自有独立绿灯与回退，不互相成为整 Story 前置。

### 7.5 表单与观测

建议 2.3 的日期/到离开多字段表单作为 RHF + Zod 的最小试点，2.5 住宿、2.6 约束、7.6 反馈及运营纠错随后按复杂度采用。后端仍为业务权威；共享的只是无秘密的字段规则，业务资格、日期事实与 revision 判断仍在服务器。dirty 不是已持久化，表单 mount/validation 不提交。现有后端 Zod 版本不因前端工具强制升大版本。[React Hook Form](https://github.com/react-hook-form/react-hook-form)

Sentry/Langfuse 和评测的隐私/真实查询/无双计数仍按 8.1/8.2 及首次消费 Story 验收，不引入第二套遥测或把 Storybook telemetry 作为产品指标。

## 8. 精确文档、合同与 Sprint 同步

具体 OLD → NEW、新增 Story 的 GWT、工程条件与交付映射见[合同附录](sprint-change-ui-contracts-2026-09-19.md)。

| 产物 | 修改位置与责任 |
| --- | --- |
| PRD 与镜像 | 平台 16.4、待决网页支持表、NFR8/NFR25补充；业务 FR 文本保持，FR52补交付责任说明 |
| Architecture | tech-stack/app-host/frontend/testing/compatibility/source-tree/index；新增 ui-foundation ADR；Query/Router 候选另立 ADR，获批后才成为规则 |
| UX | front-end-spec Shared UI、AppSheet、states、兼容提示；mobile-ia公共行为；prototype-coverage 只登记受影响状态的新证据 |
| BMAD packet | prd/architecture/ux/supporting-tech-specs 的对应源片段与摘要；旧日期 readiness 保留 |
| epics | 扩展 Epic9描述，新增核心9.3–9.5；候选9.6/9.7单列；AR3明确受限 UI 基础不是重复领域状态栈，AR15扩工具门槛，新增AR25/26、UX-DR37 |
| 实际 Story | 1.0/1.6/9.1的源验收与实际任务同步；1.7补受影响恢复回归但保留停止边界；未来页面准备时带入UI义务，9.2最终收口 |
| catalog / delivery | 新增带 `ui-foundation` 的版本文件，链接现行 Capacitor 基线；所有变更源块重算 hash，未变源块保持；requirements/source_obligations/condition bindings一起同步 |
| CURRENT / Sprint | 批准后才改 scope/current pointers/依赖与准备顺序；保留历史done、真实门槛、3.1暂停、用户stop_after_story |
| 守卫 | 当前 checker 固定认可 Capacitor schema2/批准摘要；新增显式范围演进链支持，保留旧批准/快照校验，不通过删断言或重写旧摘要使新范围通过 |

同日新文件建议为 `sprint-migration-ui-foundation-2026-09-19.yaml` 与 `sprint-delivery-contract-ui-foundation-2026-09-19.yaml`；批准记录、前状态快照与定向 readiness 也独立命名。这是建议路径，**本轮未创建生效目录或新批准文件**。

准备顺序建议：保留已准备的 9.1、1.0、1.6、1.7 及真实状态；恢复实施后插入 **9.4 → 9.5 → 9.3**，在 9.3 与当前 1.0/1.6 范围内验证现有页面迁移，再继续原 1.8 起的顺序；9.2 仍为最终分发。显示编号按 9.3/9.4/9.5，编号不等于执行时间。Query/Router 若同意纳入，安排在 UI 试点稳定后、2.3 新页面大量增加前，彼此串行；保留未开始阶段，不从候选自动派发。

依赖用真实交付切片表达：9.4 展示和检查已有组件，9.5 覆盖已有流程，不依赖尚未建好的9.3；9.3使用先前的工作台和回归。9.3可消费9.1已实现宿主接口开展本地工作，不要求缺真机的9.1整张done才开始；其原生关闭仍受真实设备门槛约束。当前业务源码不会在其活跃写入期间被第二任务并行改造。

## 9. 定向就绪、实施验收与回退

批准后按 CA/CU 定向更新既有规范、PRD update、CE合同同步，再做 IR。IR 只覆盖这次受影响链：支持表→构建/原生目标→组件与身份边界→新旧Story责任→source hash/交付映射→CI和真实证据。无需全量重做产品发现和历史视觉审查。

IR 通过条件：

1. Firefox/Safari 网页支持已明确；所有 16.4 文本、构建目标、脚本及矩阵一致，旧值仅出现在标注历史的快照/证据中。
2. 组件分层、Portal 身份遮蔽、返回优先级、CSS layer、默认主题禁替换及旧组件迁移责任明确。
3. 核心 Story 有当期可运行结果，GWT/Tasks/工程条件有明确 owner；没有前向/循环依赖，也没有将本期业务能力静默延期。
4. 每张实际 Story 的 source_story_id/source_contract_sha256、Requirements、原型/证据、delivery路径及source_obligations与正式源一致；不是仅改Tasks。
5. 新 catalog/交付版本通过 `pnpm run ci:handoff`；如改 checker，完整运行其回归，包含旧批准快照不变、未来未批准范围拒绝、历史done不变、3.1pause、stop_after_story、伪造GWT/hash、UI义务漏入Tasks及把mock当real等负例。
6. 建立可运行的 lint/a11y/浏览器负向用例和证据清单；真实资源缺口单列，不因为 browser green 就关闭 APP-HOST。

开发按 CS→VS→DS→CR 分 Story 执行。组件升级/页面替换均保留最小可回退边界；如焦点/身份/返回或布局回归，撤回本次组件适配而保留原业务控制器与历史证据。Query、Router 不改变服务器数据模型；仍需检查 URL/缓存/草稿兼容。不得用清空 IDB、账号或业务数据库解决迁移问题。iOS 提高最低版本后的旧设备不能承诺继续升级，网页替代也必须符合获批的网页矩阵。

9.2 只在同一候选源码/锁文件/资源与全部必要真实验收对应时关闭；TestFlight上传、WebKit截图、旧16.0配置测试、旧APK摘要均不能替代新下限/依赖的证明。

## 10. 交接、待决事项与 CC 检查清单

| 执行角色 | 批准后的责任 |
| --- | --- |
| PM / PO | 记录网页支持政策、核心与候选批次选择，保持业务范围与来源权威 |
| Architect / UX | 更新现有架构/体验规范和状态/宿主/组件 ADR；不发起未批准视觉重做 |
| SM / 合同维护者 | 新版本catalog/delivery、实际Story指纹、条件与准备依赖；保留停止边界和历史 |
| Dev | 原主任务在允许继续时按实际合同实施；一个活跃写入者负责共享UI/lockfile/App入口 |
| QA / Reviewer | 原页面基线、类型/lint负例、浏览器/设备/真实服务分层证据及有界CR |

集中审阅只需决定两组尚未确定的范围：

- **D-UI-01 网页支持：**推荐 Firefox128+、Safari16.4+，Chromium/Edge111+保持。若不同意，Tailwind4的旧浏览器兼容路径需要独立评估后再进入实施。
- **D-UI-02 批次：**推荐现在批准核心9.3–9.5和页面迁移责任；Query9.6、Router9.7作为已分析的候选，随后单独启用。也可在本提案中明确批准两个候选，但仍分别准备/开发/验收。RHF按2.3的复杂表单需要再采用。

iOS16.4、共享组件选型及保留现有视觉方向无需再决策。批准技术方案与解除1.7后停止边界是两件分别记录的事；没有明确恢复执行指令时，先完成合同同步/就绪的获准部分，不自动越过停止边界。

| CC项 | 状态 | 证据或下一步 |
| --- | --- | --- |
| 1.1–1.3 触发/问题/证据 | [x] | 用户选型；真实依赖、弹层、平台与CI代码；官方资料 |
| 2.1–2.5 Epic影响/顺序 | [x] | Epic9扩责任、所有Epic消费映射、核心/候选独立、停止边界 |
| 3.1–3.4 文档/技术/UX/其他冲突 | [x] | 本文4–8节及合同附录 |
| 4.1 直接调整 | [x] 可行 | 推荐；原业务保留，逐切片验收 |
| 4.2 回滚业务 / 4.3 重做MVP | [N/A] | 已评估，不是本次需要的解决路径 |
| 4.4 / 5.1–5.5 推荐、计划与交接 | [x] | 范围、估算、风险、负责人及验证顺序已给出 |
| 6.1–6.2 提案完整性/一致性 | [x] | 核心与候选GWT独立计数，来源证据与现行目录核验 |
| 6.3 完整提案批准 | [!] | 本轮供集中审阅，不能把已确定选型当作所有候选工具已批准 |
| 6.4 生效Sprint更新 | [!] | 本轮未执行；批准后新版本同步，不改历史快照 |
| 6.5 实施交接 | [!] | 职责和顺序已明确，正式派发尊重1.7后停止边界 |

本轮核验：提案内所有新增GWT的Given/When/Then/And数量、核心与候选计数、文件链接和未应用状态已检查；`pnpm run ci:handoff`通过，仍返回现行9 Epic/62 Story/1052 GWT及5 in-progress，说明当前正式范围未被草案替换。未改守卫，因此本轮不重复运行其回归或业务构建。没有把本次文档核验称为UI实施就绪或组件测试通过。

流程依据：[bmad-correct-course/SKILL.md](../../.agents/skills/bmad-correct-course/SKILL.md) 第5步要求 **Get explicit user approval for complete proposal**。这是后续应用完整提案的检查点；本轮“先形成完整方案”的交付已覆盖上述全部分析与具体修改稿。
