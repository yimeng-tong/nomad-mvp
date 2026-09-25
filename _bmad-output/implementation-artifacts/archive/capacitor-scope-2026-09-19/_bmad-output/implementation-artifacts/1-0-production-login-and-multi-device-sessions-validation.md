---
story_id: '1.0'
story_key: 1-0-production-login-and-multi-device-sessions
date: '2026-09-17'
workflow: bmad-create-story
status: preparation-passed
source_story_id: '1.0'
source_contract_sha256: 2a14175e1ae81320011b5e6ccfccf75f41ee03783acef3ba15839d5502488573
authorization_source: 用户明确同意开始当前待准备的1.0
completed_scope: story-context-preparation-and-handoff
implementation_started: false
production_ready: false
open_preparation_findings: []
resolved_preparation_findings: [P2-01-cross-tab-identity-context]
gwt_scenarios: 14
handoff_regression_tests: 43
---

# Story 1.0 实施合同准备校验

**create-story准备通过，Story为ready-for-dev。** 用户本轮“同意开始1.0”承接CURRENT所指待执行的create-story节点；完成了可审查的实施合同、独立分析与校验、必要跟踪更新。当前没有执行dev-story或把功能标done。

## 完整性与独立审阅

| 项目 | 证据 / 结果 |
| --- | --- |
| 唯一身份与合同版本 | source_story_id为1.0，固定key与迁移catalog一致；源全文SHA-256保持，未重算旧完成态。 |
| 已批准验收 | 与正式epics的14组Given/When/Then/And逐字比较一致；As a/I want/So that、Requirements及IR执行边界保留。 |
| Epic上下文 | 完整加载Epic1的12张Story及对应历史1.1/1.2、当前PRD/架构/UX、工程条件与交付映射；不将其它提案/覆盖报告加入正式清单。 |
| 代码复用 | 后端独立核验与主代理复核明确已有User/OAuthIdentity/Session、旧owner二次hash/sourceHash/Job恢复、公开session.id与secret混用、全路由/活动SSE及测试开发头的迁移责任。 |
| 前端与交互 | 主代理完整读取当前登录/App/相关API/Settings及测试；复用首屏和现有导航，在当前退出与身份边界内补改，完整7.3/7.5保持后续范围。 |
| 官方研究 | 仅公开官方文档/代码/registry；Authing/极光、Apple/微信实际宿主、腾讯服务端验票、友盟Web边界、Fastify安全补丁均有来源与日期，未把研究当真实接通。 |
| 工程绑定 | OPS-01、DB-CHANGE-01、METRICS-01/02/03五项，以及login-attribution均落入实际Tasks、时点/责任/证据；全部仍not-started。 |
| 独立fresh-context校验 | [独立报告](research/story-1-0-context-review-2026-09-17.md)确认无开放P1/P2。P2-01多标签页账号切换已修正并复核：共享cookie、bfcache/回前台、通知丢失、预期身份上下文及旧A动作不可作为B执行。 |
| 引用与执行命令 | 本地引用存在；命令对应当前包脚本。未存在的PG认证专项测试只列为待新建，不伪报已经运行。 |

## 实际运行检查

- `pnpm run ci:handoff`通过：8 Epic、60 Story、8回顾、1018 GWT；7 done、1 in-progress暂停、51 backlog、1 ready-for-dev。
- `node --test --test-reporter=dot scripts/check-handoff.test.mjs`：43/43通过。包括独立验证实际工作树，以及从固定SP快照出发的历史/迁移/合法推进/暂停/需求映射回归。
- `node --check scripts/check-handoff.test.mjs`、`git diff --check`通过。
- 程序逐字比较14组源验收，源合同指纹、所有本地引用及当前条件/指针一致性通过。
- 852份起始基线文件（847份接收文件与5份先行快照/指纹）核对，仅CURRENT、project-context、Sprint与检查器测试这4个已有文件变化；业务代码、API/Prisma、PRD/Epics/GWT、原型和旧迁移报告保持。
- Git分支仍为 `codex/story-2-2-timeline-editing`，HEAD仍为 `7250a8a131a370698bff53538a4405c2ddb94c1c`。未commit/reset/clean，也未切换或重写3.1继承历史。

本轮没有运行生成类型、业务单元/集成测试、完整业务构建、真实PG/恢复、浏览器实证或任何真实供应商调用。上述43项验证的是交接规则与文档状态，不是1.0业务验收。

## 回归fixture修正

原检查器回归从实时CURRENT/Sprint复制起点，并复制所有存在的实施Story。一旦1.0实际准备完成，原本用于验证SP初始状态的测试就会读到新的ready状态，形成误报。

本轮让这些场景固定读取准备前留存的SP完成快照，只携带历史实施文件；新增一个单独的实际工作树只读校验。既有拒绝规则与后续状态推进检查均保留，没有改业务检查器、删除测试或把新状态硬塞回旧backlog。

## 后续真实资源与关闭条件

| 事项 | 本轮已明确 | 仍需实际核验 |
| --- | --- | --- |
| 手机号/第三方身份主路径 | Authing可作为主候选，极光有Web/短信能力；保留独立内部owner与会话权威 | 现有租户/应用/权益、实际供应商路径、启用平台、回调域、真实测试身份与服务失败 |
| Apple/微信 | 已核验官方宿主/关联资源区别；不新建原生App，不静默减掉必需方式 | 项目是否已有合格资源及各实际宿主完整跳转/回调；本轮没有查看私有账号，不能断言已具备或确实缺少 |
| 腾讯行为验证 | 前端结果与服务端验票分开，正确通过码/容灾/一次性边界已有官方依据 | 实际Web实例、配置、权限、真实成功/拒绝/网络故障与浏览器证据 |
| U-Link/U-App | H5到App与纯PWA不能混同，保留FR14既有义务 | 实际宿主/事件与归因查询闭环、隐私选择和账号切换；需要替换产品或改变范围时根据具体证据处理，不能自行替换/延期 |
| 数据与生产开放 | 旧owner保留/冲突隔离、共享会话、资格屏障、备份/恢复/迁移与测量均有明确任务 | 隔离PG与新实例恢复、真实HTTPS/来源/多设备多实例、运营权限、浏览器及实际性能目标 |

这些是实施任务或实证门槛；准备文档不能将其关闭。研究没有配置或购买服务，也没有读取.env、发送短信/消息或操作真实数据。

## 产物与当前交接

- [实施Story](1-0-production-login-and-multi-device-sessions.md)。
- [后端上下文](research/story-1-0-backend-context-2026-09-17.md)、[官方供应商研究](research/story-1-0-provider-research-2026-09-17.md)、[独立准备审阅](research/story-1-0-context-review-2026-09-17.md)。
- [CURRENT](../../CURRENT.md)、[Sprint](sprint-status.yaml)与project-context已同步；本轮create-story范围记录为1.0。
- `archive/story-1-0-preparation-2026-09-17/`保留本轮开始前CURRENT、project-context、Sprint、原回归测试及SHA-256清单。

下一工作流是 **bmad-dev-story / Story 1.0**。`next_story_to_prepare`为1.6，仅表示下一份未准备的合同；本轮没有派发1.6。3.1继续暂停，历史2.2不独立派发。
