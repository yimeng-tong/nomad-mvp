---
project: nomad-mvp
story_id: '9.5'
story_key: 9-5-browser-flow-and-visual-regression-gates
source_story_id: '9.5'
source_contract_sha256: 54dc15b7f578eeb46e8b93566b2fb6a26deffc99aa8a88ed9c8cfd5692f44ad6
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: draft-pending-independent-validation
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- CODE-QUALITY-01
- UI-BROWSER-01
delivery_requirements:
- FR1
- FR18
- FR52
- NFR3
- NFR8
- NFR25
source_obligations:
- ui-quality-tooling
dependencies:
- 9-4-component-workbench-and-enforced-code-quality
preparation_validation: _bmad-output/implementation-artifacts/9-5-browser-flow-and-visual-regression-gates-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 9.5: 在固定浏览器环境保护关键入口与组件迁移

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 维护 Nomad 交付质量的开发者和审阅者,
I want 在一致浏览器环境重现关键流程和视觉差异,
So that 组件迁移前后可以核对实际行为并防止未经审阅的变化进入交付.

**Requirements:**FR1、FR18、FR52；NFR3、NFR8、NFR25；AR1、AR5、AR12、AR15、AR17–AR20、AR26；UX-DR2、UX-DR3、UX-DR32、UX-DR33、UX-DR36、UX-DR37。

**依赖与范围：**使用9.4已定义的合成场景与隔离配置；先保护现有界面，不依赖9.3完成。9.3以后每个迁移消费点必须运行本Story交付的门禁并提交自身证据。

#### 9.5-AC1 — 关键入口跨浏览器

**Given** 固定Playwright、浏览器版本和受控合成身份/API场景
**When** Chromium、Firefox、WebKit执行登录→Home→Settings→返回及Sheet打开关闭
**Then** 页面路径、焦点、滚动和输入上下文符合原合同，失败给出可定位trace
**And** 所测引擎版本明确，不把bundled WebKit当作最低iOS真机证明

#### 9.5-AC2 — 错误、恢复与身份安全

**Given** 测试包含loading/empty/partial/error/reconnect及打开的私有弹层
**When** 网络失败、未知回执恢复或身份变更
**Then** 原输入/operation/事实状态按合同保留或隔离，portal同时遮蔽，恢复不重复写入
**And** 测试能捕获旧owner内容、迟到回调和重复请求，不只检查页面可见

#### 9.5-AC3 — 可审阅截图差异

**Given** 字体、容器镜像、浏览器、数据、locale/timezone、viewport/DPR与动画策略均固定
**When** 比较迁移前后的正常/长中文/200%字号/键盘和模态代表性状态
**Then** 实际/基准/diff产物可审阅，布局、主要操作与批准品牌保持
**And** CI不自动更新基准或通过过宽容差遮蔽明显位移，故意布局破坏会使门禁失败

#### 9.5-AC4 — 原探针不丢覆盖

**Given** 已存在认证、Dock、IDB journal、遥测和PG/重启/SSE探针
**When** 新测试框架接入CI或替换重复浏览器脚本
**Then** 清单逐场景指明原证据、CI现状、替代对应和真实资源要求，只有等价覆盖证明后才退役重复项
**And** 真实PG、SIGKILL、跨进程IDB/回执测试不会因采用MSW或页面截图而被删除

#### 9.5-AC5 — 日常CI有真实门禁

**Given** 提交包含受影响UI、类型、合同或恢复实现
**When** 执行每次改动及合并前检查
**Then** 相关类型/lint/单元组件/构建/handoff/浏览器及适用PG检查真实执行并保留结果
**And** 缺少必要运行资源明确阻断相应检查，不以skip或旧日志算通过

#### 9.5-AC6 — 证据与发行责任分开

**Given** 浏览器套件全部通过，准备提供测试结论
**When** 汇总支持平台、mock范围、源码/资源摘要和未测项目
**Then** 结论限定为实际运行环境，9.1/业务Story/9.2仍负责最低平台设备、真实能力和发行验收
**And** 旧截图、旧APK或fixture结果不能覆盖新依赖下尚未完成的真机门槛

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 建立固定且隔离的Playwright运行配置（源场景 1、3、6）
  - [ ] 锁定与9.4兼容的Playwright精确版本、浏览器revision及Linux镜像digest；字体、locale=zh-CN、时区、viewport/DPR、时钟和动画策略纳入基线manifest；Chromium/Firefox/WebKit独立项目/截图。
  - [ ] 采用9.4的安全合成身份与API数据，真实PNVS路径不接受无效captcha替身；测试默认禁止未声明外网，trace和截图只存合成信息。WebKit版本与最低iOS版本分开记录。

- [ ] T2 以实际页面验证导航、弹层和身份安全（源场景 1、2）
  - [ ] 加载真实App完成登录→Home→Settings→返回；覆盖HomeSheet/退出确认的打开关闭、focus/scroll、中文组合输入、unknown/partial/reconnect，数请求和operation身份而非只查文字。
  - [ ] 私有层打开时切checking/unavailable、撤权、跨owner/session，发送旧请求迟到结果；断言页面与Portal同时隐藏，未知写入仅核实同一operation、不重复POST；保留IDB/恢复控制器。

- [ ] T3 建立可审阅的视觉基线和故意破坏负例（源场景 3）
  - [ ] 固定同源字体和确定性数据，正常/长中文/200%字号/Sheet/错误/禁用/键盘视窗场景输出actual/expected/diff；软键盘视窗模拟只证明浏览器布局，另列设备缺口。
  - [ ] 基线首次需按批准原型逐页审阅，显式命令更新；CI绝不自动accept或扩大容差。故意改变CTA位置/宽度的隔离负例必须非零退出，移除缺陷恢复通过。

- [ ] T4 迁移探针清单并连接分层CI（源场景 4、5）
  - [ ] 逐项登记当前auth/home-dock/operation-journal/telemetry、1.7 event/lease/worker/replay/SSE/ACK、measurement和PG/SIGKILL脚本的现状/实际命令/CI位置/所需资源；只有等价流程及真实层证据均确认才退役重复浏览器脚本。
  - [ ] 每次改动执行类型/实际lint/单元组件/构建/handoff和适用工作台；合并前执行关键浏览器截图及受影响PG，发布前留真机/供应商。CI明确安装固定浏览器及缺资源失败，保存退出码/trace/diff，不能skip计成功。

- [ ] T5 归档当前环境证据与后续迁移责任（源场景 5、6）
  - [ ] 记录源码内容摘要与未提交差异、锁文件/浏览器/镜像/字体hash和mock边界，明确真实PG、真机、最低特定浏览器尚未覆盖部分。
  - [ ] 9.3消费本套件后补其自身证据；不把之前APK或旧视觉基线为新CSS/组件背书，浏览器套件不能关闭APP-HOST或9.2发行条件。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] ui-quality-tooling：交付可运行工作台/真实lint/浏览器门禁和旧探针对照，开发替身不入产品；关闭证据：正反例实际退出码/CI产物与源码对应，不代替真实设备

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

先消费9.4已交付的工作台/合成场景/真实lint，再为现有页面建立迁移前基线；不能依赖9.3才能首次运行。此 Story 不统一Query/Router、不重做业务状态机、不将UI故障顺手扩为领域开发。其后每张迁移 Story提交自己的当前证据。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、3、6 | T1 建立固定且隔离的Playwright运行配置 |
| 1、2 | T2 以实际页面验证导航、弹层和身份安全 |
| 3 | T3 建立可审阅的视觉基线和故意破坏负例 |
| 4、5 | T4 迁移探针清单并连接分层CI |
| 5、6 | T5 归档当前环境证据与后续迁移责任 |

### 当前代码、改动位置与保留行为

UPDATE：package.json 与 .github/workflows/ci.yml 当前有大量类型/构建/隔离PG/业务检查，但ci:lint仍占位且未被CI调用；消费9.4完成后的真实lint入口再增浏览器job，保持原检查。

READ/保护对象：apps/mobile/src/App.tsx 以view/plannerHandoff切页、身份epoch重建与最高优先级host遮蔽；HomeScreen.tsx通过HomeSheet处理输入/候选/结果并以active控制Dock，已有局部inert，不能把新Portal目标误写成当前已具备；SettingsScreen.tsx仍有历史BYOK/mailto，由7.3/7.6承接，不在本工具Story重写。

NEW：apps/mobile/e2e/playwright.config.ts、关键流程与视觉spec、合成fixture/基线manifest及docs/ops下探针对照证据（路径在实施时按仓库组织确认）。.storybook/workbench属于9.4届时已有输入，不复制第二套网络替身。

### 验证策略与资源门槛

首个正例必须在三个引擎执行真实App；负例至少覆盖布局破坏、旧owner弹层泄漏、重复写入和未处理网络。trace/screenshot检查包含隐私边界。原本PG/SIGKILL/双标签IDB持续按原实际脚本执行，不能用MSW冒充。无需本次准备安装浏览器或跑业务测试。

### 既有实现与版本调查

复用9.4于2026-09-25保存的工具精确候选与全CI inventory；官方Playwright截图文档要求相同运行环境，使用实际引擎/镜像revision而非仅包版本。冻结1.63.0候选前复核当时peer及镜像，安装不使用浮动latest。旧probe只退重复覆盖，不删除其资源层责任。

### 引用

- CURRENT.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
- docs/architecture/ui-foundation.md
- docs/architecture/frontend-data-navigation.md
- docs/architecture/app-host.md
- docs/front-end-spec.md
- docs/ops/ui-validation.md
- _bmad-output/implementation-artifacts/research/story-9-4-repository-context-2026-09-25.md
- _bmad-output/implementation-artifacts/research/story-9-4-tooling-research-2026-09-25.md
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 本批准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 准备验证和独立审阅记录在同名 validation；所有开发任务保持未勾选。

### File List

- _bmad-output/implementation-artifacts/9-5-browser-flow-and-visual-regression-gates.md
- _bmad-output/implementation-artifacts/9-5-browser-flow-and-visual-regression-gates-validation.md
