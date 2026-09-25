---
project: nomad-mvp
date: 2026-09-07
updated: 2026-09-14
workflow: bmad-create-epics-and-stories-step-3
status: approved-breakdown
epic: 8
epicEntryAuthorized: true
entryConfirmedDate: 2026-09-07
storySplitApproved: true
splitApprovedDate: 2026-09-07
detailedStoryInReview: null
detailedStoryPreparationStatus: all-mvp-stories-approved
readyForEpicCompletionReview: false
epicCompletionConfirmed: true
completionConfirmedDate: 2026-09-14
approvedMvpStorySplit: ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6']
approvedPostMvpSlots: ['8.7', '8.8']
approvedDetailedStories: ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6']
---

# Epic 8 Approved Story Breakdown

用户已于 2026-09-07 确认 Epic 7 规划完成并进入本 Epic。五张有效 Epic 7 Story、98 条
GWT 与九张原型保留批准状态，7.2 继续延期。用户随后批准本拆分并要求从 8.1 开始。
拆分批准不代表 8.x 详细合同已批准，
不改业务代码、OpenAPI、Prisma 或历史 sprint YAML，不运行最终 CE validation/IR/SP。
用户随后批准 8.1 的 20 条 GWT、采用方向与 Walkthrough R1，正式合同和源文档已同步。
用户于 2026-09-08 批准 8.2 的 24 条修订 GWT、Langfuse 采用方案和 Human Workspace R2，
已正式追加并同步源文档。原统一硬门禁/仅摘要方向与 Report R1 已被替代。
用户同日批准 8.3 的 24 条 GWT、既有 Node/PG 路由采用方案及两组 R1 原型，已正式追加
并同步源文档。8.4 的两份委派调研、综合报告、26 条 GWT 和两张 R1 原型已于
2026-09-13 准备完成，详见 `story-8-4-review-2026-09-13.md`；用户随后批准采用方向、修订26条GWT、桌面Web与金额来源补充及两张基础R1，
已追加正式epics并同步源合同。资费/来源未绘出状态仍需实施证据；用户授权进入8.5，
用户随后于同日确认8.5的24条GWT、Node/PG投递采用及两张桌面R1，已追加并同步。
用户随后确认8.6的20条GWT、薄只读总览采用及两张桌面R1，已追加并同步。六张MVP
Story共138条GWT、十张有效原型，整体覆盖报告已完成，用户于2026-09-14回复C确认Epic8完成并进入最终CE验证。真实消息
发送与部署仍未执行。后续对话按中文编号文字说明验收，
文件保留BMAD GWT，所贴旧例子仅示意格式。

## Epic 目标

**Epic 8：度量并运营可靠的 AI 旅行服务。**

运营者能判断服务是否可靠、定位失败、比较质量，并安全调整服务端 Provider 与成本策略；
真正需要处理的 AI/高德不可恢复异常通过 Telegram 提醒。旅行者继续使用既有单一规划流程，
不会看到内部模型、额度或运营页面。

**Requirements:** FR13、FR14（全局运营集成）、FR33（运营扩展）、FR38、FR38.1；
FR34.1 仅作为 Post-MVP 的两张预留条目。相关 NFR1-NFR7、NFR17、NFR20-NFR24，
AR1-AR8、AR11-AR15、AR17-AR20、AR22，以及 UX-DR2/3/31-33 按各 Story 实际表面分配。

## 已确认边界

- 首次调用所需限流、并发、超时、回退、熔断及脱敏必须随前面业务 Story 交付。
  Epic 8 扩展跨流程观测和集中治理，不能让前面功能等待最后才有安全保护。
- 配额、成本、计量窗口和余额仅运营可见。用户侧只有真实任务状态及可用恢复操作。
- Provider/策略变更不突破冻结事实、owner、attempt fencing、Plan/Trip 版本或 AI 当前城市范围。
  不重算已发布行程，不恢复 Quick/HQ 双结果、BYOK、自动打卡或后台定位。
- Telegram 只通知配置的运营人员：AI/AMap 需管理员动作的终态，或达到已配置持续异常阈值。
  普通 429、初次超时、有有效缓存/回退的失败不能直接骚扰告警；不存在发送到用户的额度通知。
- XHS 主动搜索仍为 Post-MVP，只服务平台 AnchorPool 冷启动；不能借本次拆分纳入用户
  PlanningJob，也不使用用户 Cookie/会话或在规划中途要求搜索确认。

## 已批准的 MVP 拆分

| Story | 运营者获得什么 | Requirements | 最小交付终点与范围 |
| --- | --- | --- | --- |
| 8.1 跨流程观测与故障定位 | 能从一次失败关联到阶段、版本、Provider attempt 和稳定错误码 | FR13、FR14、FR33；NFR3/6/7/20 | 统一现有事件/脱敏/关联规则，在已选 Sentry/Langfuse/日志工具中真实查询；修旧事件字典，不另造监控平台 |
| 8.2 可复现的质量回归与版本对比 | 比较 prompt/model，并人工判断和试验 | FR13、FR33；NFR4/5/9-12/21-23 | 已批准：版本化样本、逐规则策略、实际 CI、人工分数/评语/对比标注及轻量实验入口；promptfoo 执行，Langfuse 工作区 |
| 8.3 任务级 Provider 路由与安全切换 | 可按任务调整 Provider/model/回退顺序，并检查生效与回滚 | FR14、FR33、FR38；NFR1/3/17 | 已批准：既有 Node adapter、PG 单一路由权威与窄运营页；检查/版本发布、任务快照、暂停、LKG、审计/回滚；不新建通用后台或网关 |
| 8.4 平台预算与用量策略管理 | 能调整请求/并发/成本策略，并核对跨实例实际消耗 | FR38、FR33；NFR3/4/17 | 扩展既有首次使用保护，集中策略版本和持久预留/结算/释放；成本未知不能算零；重试和用户额度不重复计量 |
| 8.5 AI/高德终态异常与 Telegram 告警 | 需要人工处理时收到有用提醒，恢复后知道已恢复 | FR38.1、FR38；NFR3/6/24；AR22 | 终态判定、持久去重/聚合/冷却、真实投递、恢复通知及发送失败记录；无需等待总览即可运维和测试 |
| 8.6 运营总览与只读排障入口 | 在同一概览核对质量、延迟、成本、降级和告警，再进入对应工具 | FR13、FR14、FR33、FR38、FR38.1；NFR4-6 | 汇总前面已存在的数据/报告/配置/告警；复用现有工具，薄只读聚合，不重建日志搜索、策略编辑器或客服系统 |

拆分已批准，详细验收措辞仍待逐张评审。每张详细 Story 将另行展示 As a / I want /
So that、Requirements 与自然语言验收标准；批准后以 GWT 追加到 epics.md。

### 8.1 的边界

完成后可在现有运维工具中定位真实调用，并证明事件/日志不含用户原文、精确行程、受保护
URL 或凭据。不是「只建事件表，等 8.6 才能看」。前后端 Sentry、Langfuse 的实际接入、
来源映射、最小允许字段、保留/清理和监控不可用不阻塞业务应一起验收。
未知 usage/耗时与丢失事件要保留未知/覆盖不足，不能在总览前先编造零值。

### 8.2 的边界

复用前面 Story 的确定性 fixture、获准案例及线上去直接标识样本，覆盖导入/地理、意图、
酒店/交通/一日游、填充/措辞等回归。不得以间接推测身份为由清除旅行上下文；评测副本
与 8.1 生产遥测分开。逐规则配置计分/提醒/人工复核，单项阻断另行对齐，不默认统一否决。
新增明确要求包含人工评分/评语/实验标注与轻运营入口，不要求每个 PR 调用付费模型。
已批准复用 Langfuse 样本/人评/prompt/Playground 和私有 CI 的完整回归入口，不复制厂商 UI。
报告冻结 dataset/prompt/model/schema/规则与代码版本；人评回收形成评价快照，自动证据
保持独立。8.2 不实现生产发布/预算编辑，8.3/8.4 各自可操作，8.6 最后统一已有入口。
整体采用方案详见 evaluation-operator-scope-decision 及 research addendum，于 2026-09-08 获批。

### 8.3 与 8.4 的边界

8.3 管「用哪条服务路线」，8.4 管「允许用多少及如何计量」，不两次实现同一个调用器。
8.3 使用先前业务 Story 已有的最低预算/超时保护即可交付，不依赖未来 8.4；8.4 才扩展
跨任务/跨实例的集中治理。所有配置都使用验证过的字段、角色权限和 secret 引用，不接收
任意网络地址/脚本或把密钥作为前端可读配置。开关失联保留最后有效配置和安全默认值。
8.3 已明确在接受时固定任务快照，排队/在途任务不随普通发布迁移。暂停独立阻止未来外发，
不承诺撤回已发出请求；恢复需确认，回滚不解除暂停或改用户行程。8.4 已批准预算收紧的
预留/结算语义，但不能推翻 8.3 每次外发重新适用既有有效预算/安全授权的边界。

### 8.5 与 8.6 的边界

8.5 具有自己的最小内部状态查询、投递/恢复核验和安全测试入口，不等待 8.6。
指纹包含环境/Provider/能力/稳定错误类；去重与冷却跨重启保留，不承诺网络消息 exactly-once。
发送失败只影响通知记录，不改变用户 Job/Plan、重试预算或熔断结论；Telegram 故障不能
通过同一坏掉的通知通道递归报警。凭据只在服务端，测试发送须另获实际授权。
8.6 已批准现有Node/React薄只读桌面页及受保护原工具入口，不新增Grafana/iframe前置。
必须有采样/覆盖率、成本估算/实际/未知、数据时间和空/错误/过期状态，不提供用户内容钻取。

## Post-MVP 预留

| 预留 Story | Requirements | 后续独立交付 |
| --- | --- | --- |
| 8.7 受控 XHS 搜索 Provider 与素材采集 | FR34.1；NFR3/13/14/20 | 运营账号隔离登录/挑战处理、限频搜索、结果选择、详情/媒体安全暂存，支持一次受控采集；不依赖自动补池才能用 |
| 8.8 缺口驱动的 AnchorPool 补池编排 | FR34.1，复用 FR34 / Story 2.13 | 消费 missing/stale/insufficient 分桶和 8.7 候选，经既有提取/AMap/去重/共享准入后原子发布快照；失败不阻塞用户规划 |

8.7/8.8 的具体登录态、授权合规、验证码、内容许可/保留和发布策略需要后续设计，不因
当前命名而批准实现或访问账号。两条不进入本期执行队列，也不阻塞 MVP readiness。
MVP 的版本化 AnchorPool、Top-50、AMap 和自由时间降级继续由已有 Story 交付。

## 顺序与依赖

建议评审和实施顺序：8.1 -> 8.2 -> 8.3 -> 8.4 -> 8.5 -> 8.6。

- 8.1 消费各业务 Story 的真实事件；8.2 使用既有 adapter/fixture 加 8.1 的版本证据。
- 8.3 可使用 8.2 评测结果核对变更，运行时不依赖在线评测服务；8.4 扩展其策略与计量。
- 8.5 消费既有 Provider/预算终态和策略，只依赖之前的能力；8.6 汇总已可独立使用的输出。
- 不单设数据库、通用 SDK 或管理员鉴权前置 Story；实际需要的最小实体/权限/接口由首次
  提供可用运维动作的 Story 负责。不得先做 UI 再等未来 Story 补后端。
- Epic 编号不自动改变既有跨 Epic 实施顺序。最终 CE 验证/IR/SP 仍统一检查无前向依赖；
  历史已完成项不重排，业务首次使用安全不能被挪到本 Epic。

## 当前仓库证据

以下为 2026-09-07 只读检查，不表示部署环境已配置或工具已连通：

- `apps/server/src/integrations/telemetry.ts` 只有条件初始化 Sentry/Langfuse 和有限的
  fill trace；`index.ts` 的调用处仍写明 tracking stub，不是全流程观测验收。
- `apps/mobile/src/auth/analytics.ts` 已有事件过滤/noop 接口，但仍包含 HQ/BYOK 等旧事件，
  本轮检索未找到完整移动 Sentry 接入。8.1 应在实际实现阶段审查整个调用链。
- `packages/prompts/promptfoo.yaml` / `registry.json` 是单个历史 fill 示例；
  `.github/workflows/ci.yml` 明确为 `Promptfoo baseline (noop placeholder)`。
  文件存在不代表可运行的当前评测或 CI 门禁；8.2 需核实真实工具合同与兼容的项目工具链。
- `integrations/flags.ts` 有 Unleash 初始化和布尔读取；不能证明结构化路由、版本发布、
  审计/回滚已实现。`planner/hq.ts` 当前单 Provider 由环境变量配置，dailyUsage 为内存 Map。
  8.3/8.4 必须基于实施时前面 Story 的新版基线，不复制这套历史计量。
- `planner/anchor-pool.ts` 是当前 city Top-50 刷新基础，不是 FR34.1 主动搜索。
  `apps`/`packages` 的本次搜索未见 Telegram 发送适配器；不宣称已能通知。
- 初次拆分检查时 `docs/ops/analytics.md` 为 v0.3-light，含原始搜索 q、check-in、额度
  warning 与模糊反馈成功漏斗。8.1 批准后已同步为现行安全事件合同；实际 emitters/SDK
  仍须实施修正，不能把文档更新当作数据出口已安全。

## 视觉评审要求

当前注册表已批准 8.1 Walkthrough R1、8.2 Human Workspace R2 与 8.3 两组 R1；后续原型按 Story 补充，
成熟工具示意不是立即自建重复运营后台的理由。

| Story | 详细评审时的展示方式 |
| --- | --- |
| 8.1 | Walkthrough R1 已批准，仅说明跨工具关联；实际查询/去敏/权限/失联仍须验收 |
| 8.2 | Human Workspace R2 已批准，说明逐规则比较、人工评分和实验配置；旧 Report R1 已替代，不是实测成绩或厂商截图 |
| 8.3 | Route Config Release / Recovery Rollback R1 已批准，覆盖草稿/发布、等待使用、检查失败、结果未知、回滚及暂停 |
| 8.4 | Budget Policy Usage / Budget Recovery R1 已批准：内部预算/用量事实、未知费用、收紧和失联；用户 Settings 无额度入口 |
| 8.5 | Telegram Lifecycle / Operator Delivery Recovery R1 已批准；覆盖桌面消息、聚合/恢复、策略/静默与未知/拒绝投递，无真实发送 |
| 8.6 | Overview / Source States R1 已批准：桌面只读摘要、来源/窗口、部分失败/陈旧、空数据和环境权限；薄只读页采用已确认 |

遵守用户要求：存在注册表缺口或交互不易说明时，在对应 Story 确认前展示已有图或生成
带批注原型；示例不代表真实监测结果、生产权限或 API 已实现。

8.3 的 Route Config Release R1 与 Recovery Rollback R1 已批准。
用户接受主 agent 综合两份报告提出的 Node adapter、既有 PG 版本化权威与小型受限配置面，
不将 Unleash 可写路由/独立 AI 网关设为前置。Unleash 原生治理和网关方案的利弊保留在
研究中；采用方向获批不等于已部署，详见 `story-8-3-review-2026-09-08.md`。

## 成熟实现调研门禁（用户确认 2026-09-07）

在对应 Story 的详细合同/技术选型确认前，委派 agent 做范围明确的成熟实现调研，范围由主
agent 按该 Story 自定且必须包括 GitHub 与官方资料。主 agent 负责本地基线和交叉核验。
报告需包含适配与迁移、实际能力/效果、局限、license/付费能力、资源/运维成本、隐私/保留/
删除、维护证据及采用/延后/不采用建议；不能把星数、截图或 SDK 存在当成可用性验收。
重要论据保留可追溯 URL、检索日期与版本，区分事实、推断和未测事项。
调研本身不授权安装、购买、创建云账户、读取密钥、部署或发送测试消息。影响 PRD 已定
工具/范围的替换须先对齐，成熟实现不能绕过 owner/版本/保护/审批规则。
本要求适用于后续 8.x；延期 8.7/8.8 只在对应后续设计启动时研究，不现在展开。

## 下一检查点

8.1-8.6已逐张批准并追加正式GWT，共138条、十张当前有效原型。整体核对报告为
`epic-8-coverage-review-2026-09-13.md`，Epic8整体规划已于2026-09-14确认。
最终CE Step4的复验已通过；用户于2026-09-14选择C完成CE，见epics-final-validation-2026-09-14.md。
不重复请求三项合同、8.6或Epic8批准。IR已进入文档发现，见implementation-readiness-report-2026-09-14.md；
IR尚无就绪结论，随后按结果进入SP，业务实施仍暂停。
8.7/8.8继续Post-MVP，不是下一张MVP执行Story，不产生账号访问/部署/真实测试消息授权。
