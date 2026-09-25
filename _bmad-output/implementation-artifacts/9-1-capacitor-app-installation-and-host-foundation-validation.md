---
project: nomad-mvp
date: '2026-09-19'
story_id: '9.1'
story_key: 9-1-capacitor-app-installation-and-host-foundation
workflow: bmad-create-story-checklist
review_type: independent-bounded-preparation-validation
status: findings-open
readiness_scope: local-implementation-with-scoped-context-amendments
source_contract_sha256: dd849a51d2e5ba0761565d91a3ef31d6a018747b34859728bed99a59a6cda2a7
gwt_scenarios: 8
material_findings: 2
runtime_verified: false
story_or_code_modified_by_review: false
---

# Story 9.1 准备校验

已按 `bmad-create-story/checklist.md` 独立复核当前实施合同、正式源 Epic 9 的 9.1/9.2、App 架构/工程条件、技术研究及实际入口。**源合同、指纹和工程绑定通过；有两项需要补入实施交接的具体缺口。**它们不要求重新审批或停止独立宿主实现，应在相应组件接入和 native sync 前解决。当前不证明任何原生编译、安装或真实服务已完成。

## 实质发现

### V91-01：返回接入责任未覆盖已有子组件的临时层

**位置：**[实施合同 T4](9-1-capacitor-app-installation-and-host-foundation.md#tasks--subtasks)及 Dev Notes 的 UPDATE/写入责任说明。

合同已正确禁止用浏览器 history 代替 React 导航，也规定键盘、临时层、子页、根页顺序；但实际接入仅点名 App/Settings/Login。当前可触达的临时层有自己的子组件 state：

- `apps/mobile/src/home/HomeScreen.tsx` 的 `unknownInput` / `candidateTarget`，分别呈现“选择输入类型”和“定位候选”弹层。
- `apps/mobile/src/planner/DayPlanScreen.tsx` 的 `openSlotId` / `openEditSlotId`，后者交给 `SlotEditSheet`；`SlotEditSheet` 内还存在 `mode/startLocal/endLocal`，并使用 `busy` 拦截 Esc 关闭。
- `apps/mobile/src/planner/PlannerScreen.tsx` 的 `viewMode` 控制自己的确认/选择/结果上下文，不是浏览器 history。

只在 App 层注册 settings/planner 返回无法判断这些层是否打开，容易在 Sheet 显示或提交进行中直接退出整个 planner、丢失临时上下文。当前两任务文件分工也没有给这些文件明确的接入者。

**需要补入合同：**在 T4/UPDATE 清单明确由哪个写入者读取并接入当前可达临时层和内部页的高优先级 handler，复用各自现有 close/cancel/busy 规则；先关一层，不能调用 submit/delete/重新规划。至少记录并验证“Home Sheet→Home”“Slot Sheet→原 DayPlan”“busy Sheet 消费返回而不退页面”“内部页返回后保留既有确认草稿”四个当前代码场景。若旧编辑入口受暂停控制而不可触达，写出实际不可达依据，不借这项接入恢复 3.1 或改写旧编辑业务。

这是现有 AC4 的具体落点，不增加新的产品范围，也不要求先完成整张 1.0。

### V91-02：原生认证配置的精确合同未进入宿主任务

**位置：**实施合同 T3 的“精确 API origin、插件配置”、架构/职责中的泛称 wire ADR。

本轮已存在的 [Native Auth ADR](../../packages/native-auth/ADR.md)明确：注册名为 **NomadNativeAuth**；固定配置从 **`plugins.NomadNativeAuth.apiOrigin`** 读取，必须是无 userinfo/query/fragment 的 HTTPS origin；**`apiBasePath`** 为独立固定 path prefix，默认 `/api`；JS 不允许运行时重配这两个字段。`packages/native-auth/src/index.ts` 已使用这个注册名，package 名为 `@nomad/native-auth`。

目前 9.1 合同尚未链接这份已经存在的 ADR，也未写出上述配置字段。配置作者若把带 `/api` 的 `VITE_API_BASE_URL` 原样作为 origin，或者只配置 Web URL 而遗漏 plugin 配置，会使已同步的原生认证不可用；宽泛修复还可能越过固定 origin/path 的认证边界。

**需要补入合同：**T3/Dev Notes 引用该 ADR 与实际 package，明确分离并核验 origin/base path；增加缺配置、origin 带 path/query/fragment/userinfo、非 HTTPS，以及 Web API 与 native 前缀不一致的配置反例。只在 1.0 的 Android/iOS 骨架及 SPM/Gradle 清单实际就绪后 sync，核查注册名和配置进入实际候选；native 不可用时保持真实 unavailable，不回退 Web cookie 或 JS secret。此项只同步配置接口，认证实现继续归 1.0。

## 通过的检查

| 检查 | 实际结果 |
| --- | --- |
| 正式来源 | 只取 `epics.md` 的严格 `### Story 9.1` block；9.2 是后置完整分发，未反向变成 9.1 前置 |
| GWT / narrative / Requirements | 8 组 Given/When/Then/And 与源逐字一致；As a/I want/So that 和 Requirements 完整保留 |
| 实际源指纹 | 未 trim 的正式 block SHA-256 为 `dd849a51d2e5ba0761565d91a3ef31d6a018747b34859728bed99a59a6cda2a7`，与 catalog 和实施 front matter 一致 |
| 工程条件 | front matter 的 DB-CHANGE-01、METRICS-01/02/03、APP-BUILD-01、APP-HOST-01 与当前 migration 绑定一致；均在 Tasks 中有对应工作 |
| 交付映射 | FR52、NFR3/7/8/25 与当前 delivery 直接责任绑定一致；`app-build-delivery` 已进入 T0/T6 与关闭清单。源 Requirements 的其他全局约束仍保留 |
| App 安装与分发边界 | 双端真实安装是 AC1；源码目录、模拟器、IPA/上传和 Web 单测不能替代；最终 TestFlight 归 9.2 |
| 无 router 返回原则 | 已明确复用 React state、优先级与一次只消费一层；余缺口是 V91-01 的实际子组件接入责任 |
| OS 与 Web bundle | iOS16/Safari16、Android minSdk29 及实际 WebView 下限均进入 T0/T1/T3/T6；显式 target 不被当作真机验证 |
| 开发标识 | 明确本地候选 namespace 不能计作正式登记/签名/供应商/发布实证，也不能据此关闭 AC1 |
| 缺资源继续推进 | macOS、签名、设备缺失保留对应任务，独立代码可继续；未降级支持范围或伪造 done |
| 接入边界 | StrictMode 保留；生命周期去重/清理、受限外链 typed failure、离线首屏、唯一 inset 消费、权限最小化均有任务 |
| Story/Sprint 状态 | 读取时均为 ready-for-dev；1.0 保持并行工作流；next_story_to_prepare 已回到 1.6，未重派已准备 1.0 |
| 文档引用 | 实施合同中全部相对 Markdown 文件链接实际存在 |

## 校验方法与限制

实际执行了独立脚本比较源 block、GWT/narrative/Requirements、SHA-256、YAML 绑定和文件链接。读取当前 `main.tsx`、`App.tsx`、Vite/package，及 Home/Planner/DayPlan/SlotEditSheet 的返回相关状态与现有关闭逻辑；重读 native-auth ADR/TypeScript 注册和定义，未把新 package 目录视为原生实现完成。技术版本沿本轮已核验的[官方研究](research/story-9-1-capacitor-host-research-2026-09-19.md)，未重复安装依赖。

本次是准备校验，不是已写 runtime 的 code-review；没有运行原生构建、真机操作或供应商认证，也没有修改 Story、源码、依赖/锁文件、Sprint 或批准记录。只新增本校验文件。主代理修订上述任务/接口后可局部复核，不需要重新审阅全部页面或再次要求用户授权。

## 主执行者处置（2026-09-19）

两项准备缺口已修订进入实际Story T3/T4与Dev Notes：显式子组件handler写入责任和busy/草稿用例；精确NomadNativeAuth.apiOrigin/apiBasePath及反例。源8组GWT不变。已通知既有UI写入者协调接入，实际代码/设备验证仍由实施记录承接。准备级结论：可继续本地实施；不将本段作为原生安装/交互已通过证据。
