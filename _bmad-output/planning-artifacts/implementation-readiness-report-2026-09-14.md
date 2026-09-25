---
project: nomad-mvp
date: 2026-09-14
workflow: bmad-check-implementation-readiness
status: complete-needs-work
currentStep: complete
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
fileSelectionConfirmed: true
fileSelectionConfirmedDate: 2026-09-14
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux.md
supportingDocuments:
  - _bmad-output/planning-artifacts/supporting-tech-specs.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-08-05.md
  - _bmad-output/planning-artifacts/planning-inputs-load-and-linked-trips-decision-2026-08-08.md
  - _bmad-output/planning-artifacts/requirement-trace-audit-2026-08-12.md
  - _bmad-output/planning-artifacts/epics-final-validation-2026-09-14.md
  - _bmad-output/planning-artifacts/ce-fr-coverage-2026-09-14.md
  - _bmad-output/planning-artifacts/ce-contract-decisions-2026-09-14.md
  - _bmad-output/planning-artifacts/check-in-scope-decision-2026-09-06.md
  - _bmad-output/planning-artifacts/shopping-intent-scope-review-2026-09-06.md
  - _bmad-output/planning-artifacts/evaluation-operator-scope-decision-2026-09-07.md
  - _bmad-output/planning-artifacts/settings-account-actions-scope-2026-09-06.md
  - _bmad-output/planning-artifacts/story-review-presentation-decision-2026-09-13.md
excludedHistoricalDocuments:
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-06-17.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-08-13.md
  - _bmad-output/planning-artifacts/archive/epics-approved-correct-course-2026-08-12.md
missingRequiredDocumentTypes: []
unresolvedVersionConflicts: []
ceWorkflowCompleted: true
assessmentPerformed: true
inputRefinementStatus: direct-changes-applied-prompt-audit-proposed
inputRefinementReport: _bmad-output/planning-artifacts/ux-prompt-strength-audit-2026-09-14.md
readinessVerdict: NEEDS_WORK
findingCount: 9
findingCategoryCount: 4
assessmentCompletedDate: 2026-09-14
assessor: Codex-BMAD-IR
expandedExplanation: ir-findings-explained-2026-09-15.md
sprintPlanningStarted: false
implementationAuthorized: false
resolvedBy: ir-resolution-decisions-2026-09-15.md
revalidatedBy: implementation-readiness-revalidation-2026-09-15.md
---

# Implementation Readiness Assessment Report

> 2026-09-15后续：用户已批准九项处理，专用审核延期、额外后台仅手工纠错；其余按建议落实。
> [定向IR复验已通过，可进入SP](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-readiness-revalidation-2026-09-15.md)。下文保留当时结论/候选建议，不能用旧待决定状态覆盖新决议。


2026-09-15新增[九项问题的详细解释与决策建议](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/ir-findings-explained-2026-09-15.md)：
说明每项原始需求、缺口、具体场景、推荐处理、用户判断与工程责任。它是解释补充，不改本报告
2026-09-14的评估证据、输入指纹或结论，也不代表推荐方案已批准。

**当前结论：NEEDS WORK。** 六步检查已完成，9项去重问题需要处理后定向复验；
60个MVP FR有编号映射，不等于未编号必须项和生产前置已闭合。
结论与行动清单见文末“Summary and Recommendations”，也可阅读同目录`ir-findings-2026-09-14.md`。

**Date:** 2026-09-14
**Project:** nomad-mvp

## 文档发现：本轮已确认的文件

用户已选择C完成CE工作流，并要求进入IR。本报告从新日期建立，保留两份旧IR报告。
文档发现先清点文件和确定评估版本。用户随后选择C确认本集合，Step 1已完成；
本轮进入PRD分析，尚未给出整体实施就绪结论。

### 四类核心文件

以下路径相对于项目根目录；时间为Asia/Shanghai，大小以字节计。
已确认主文件均位于`_bmad-output/planning-artifacts/`。

| 类型 | 已选主文件 | 大小 | 最后修改时间 | 同类分片目录 |
| --- | --- | ---: | --- | --- |
| PRD | [prd.md](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd.md) | 113957 | 2026-09-14T15:16:31+08:00 | 未发现 |
| 架构 | [architecture.md](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/architecture.md) | 140714 | 2026-09-14T15:16:31+08:00 | 未发现 |
| Epics / Stories | [epics.md](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/epics.md) | 568419 | 2026-09-14T15:15:51+08:00 | 未发现 |
| UX | [ux.md](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/ux.md) | 130463 | 2026-09-14T15:16:31+08:00 | 未发现 |

四种搜索模式均已执行：`*prd*.md`、`*architecture*.md`、`*epic*.md`、`*ux*.md`，
并搜索对应名称目录中的`index.md`和其他Markdown分片。四类必需文件均存在。

### Epics模式命中的其他文件

以下是拆分提案、覆盖复核或最终验证记录，不作为第二份正式Story清单。

| 文件 | 大小 | 最后修改时间 |
| --- | ---: | --- |
| `epic-6-coverage-review-2026-09-06.md` | 3775 | 2026-09-06T15:39:41+08:00 |
| `epic-7-coverage-review-2026-09-07.md` | 9038 | 2026-09-07T14:44:22+08:00 |
| `epic-7-story-breakdown-proposal-2026-09-06.md` | 13087 | 2026-09-07T14:44:26+08:00 |
| `epic-8-coverage-review-2026-09-13.md` | 12271 | 2026-09-14T11:58:58+08:00 |
| `epic-8-story-breakdown-proposal-2026-09-07.md` | 15877 | 2026-09-14T11:58:59+08:00 |
| `epics-final-validation-2026-09-14.md` | 14771 | 2026-09-14T15:15:55+08:00 |

### 源文档与分片分组

依据`AGENTS.md`、`CURRENT.md`和`project-context.md`已有的版本优先级，评估以当前规划包
为主入口，回查源文档；若后续发现正文冲突，以源文档及用户已批准决策定位问题，不静默选新旧版本。
源文档与同步规划包属于同一套材料的来源/镜像关系，无需删除或改名。此项依据来自既有交接，
本步未重新分析其需求正文，也不将CE镜像检查代替IR后续的内容检查。

| 类别 | 对应来源 | 用法 |
| --- | --- | --- |
| PRD | `docs/prd.md` | 当前产品需求来源 |
| 架构 | `docs/architecture/index.md`及当前v0.6分片 | 当前架构入口；下列历史文件排除 |
| UX | `docs/front-end-spec.md`、`docs/ux/mobile-ia.md`、`docs/ux/home-import-dock.md`、`docs/ux/prototype-coverage.md` | 当前UX、页面流程和原型适用范围 |
| 支持技术规格 | `docs/tech-spec-epic-2.md`、`docs/tech-spec-epic-3.md` | 通过`supporting-tech-specs.md`及来源核对 |

发现的架构目录文件：

- `docs/architecture/architect-checklist-results.md` — 历史，排除为当前合同。
- `docs/architecture/architecture.md` — 历史，排除为当前合同。
- `docs/architecture/backend-architecture.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/coding-standards.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/compatibility.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/data-models.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/frontend-architecture.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/index.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/mvp-implementation-checklist.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/observability.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/planner-autoplace-v1.md` — 历史，排除为当前合同。
- `docs/architecture/planner-orchestration-v2.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/repo-structure.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/rest-api-spec.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/source-tree.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/tech-stack.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/testing-strategy.md` — 当前分组候选，按v0.6索引与规划包来源归属核对。
- `docs/architecture/v0.3/README.md` — 历史，排除为当前合同。

发现的UX分组文件：

- `docs/ux/home-import-dock.md` — 当前UX来源。
- `docs/ux/mobile-ia.md` — 当前UX来源。
- `docs/ux/prototype-coverage.md` — 当前UX来源。
- `docs/ux/ux-v0.2-delta.md` — 历史delta，排除为当前合同。
- `docs/ux/ux-v0.3-light-delta.md` — 历史delta，排除为当前合同。

### 支持材料和执行历史

| 材料 | 本轮角色 |
| --- | --- |
| `supporting-tech-specs.md` | 补充Epic 2/3技术合同 |
| Correct Course、联程/负荷决策、requirement-trace-audit | 已批准范围和迁移依据 |
| `epics-final-validation-2026-09-14.md`、`ce-fr-coverage-2026-09-14.md`、`ce-contract-decisions-2026-09-14.md` | CE完成、覆盖和修订证据；不是本轮IR通过证明 |
| 延期、购物、设置、评测运营范围、Story展示格式等决策 | 约束当前范围，避免恢复已否决旧方案 |
| Epic 6/7/8覆盖与拆分、已批准Story review/research | 按需回查批准边界，不替换正式epics.md |
| `docs/ux/prototype-coverage.md`及其登记的当前图片 | 后续UX核对入口；本步没有重新审图 |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | 仅作历史执行状态，待后续SP迁移 |
| `_bmad-output/implementation-artifacts/2-2-timeline-editing-undo-and-history.md` | 保留迁移基线；不能作为新版3.1已经交付的证据 |

### 历史版本排除与缺失检查

- `implementation-readiness-report-2026-06-17.md`、`implementation-readiness-report-2026-08-13.md`为历史快照，保留文件，不沿用其中结论。
- `archive/epics-approved-correct-course-2026-08-12.md`为迁移参考，不是当前Story列表。
- 旧架构根文件、v0.3、Planner Autoplace v1、旧UX delta及被替代原型不作为当前目标。
- 四类必需文件无缺失；规划包目录无同类whole/sharded冲突。源文档/镜像及提案/正式清单关系已按项目恢复规则列明。
- 没有尚待裁定的新旧版本冲突；用户已确认本轮文件集合。

## 文件确认与进入PRD分析

用户在文件确认前提出FR14/FR48/FR39微调：取消n8n前置、允许有效授权后的App打开单次
定位刷新、无来源安全建议使用行内“建议核对”。三项已同步至源、镜像及相关Story；
新增`ux-prompt-strength-audit-2026-09-14.md`及`prd-updates/2026-09-14/`支持记录。
其余提示建议尚未批量写入合同。四份主文件路径不变，元数据已刷新；后续IR使用更新输入，
当前仍无就绪结论，CE报告仅证明其完成时的版本。

用户已选择**[C]确认上述文件集合，继续PRD分析**；四份主文件及来源/支持范围已确认。
本确认不包含提示审计中的其余建议，不重复批准CE、Epic 8或三项直接修订。
Step 1完成并进入`step-02-prd-analysis`，不改变正式GWT、源文档、业务代码、原型或旧Sprint。


## PRD Analysis

读取确认后的完整PRD（含历史附录），按原文提取，不把提案或历史实现重新视为本期功能。
输入SHA-256：`a117c40ec299bbb812771dc84dab001c5f09fa129b3f86e015ec618073968df4`；共870行。
FR19补充与各FR下子条款随父编号保留；FR44-lite为独立编号。完整提取64条FR、24条NFR；
FR34.1、FR40.1、FR42、FR43明确延期，当前MVP FR为60条。以下内容是来源原文，非已实现证明。

### Functional Requirements

- FR1: 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯行为验证。
- FR2: 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。
- FR3: 统一输入分流：优先判定小红书链接；否则解析自然语言行程；无法判定时给出二选一提示。
- FR4: 小红书入库流程（每个 ingest job 处理一条链接）：异步获取作品 → 多模态 LLM 图文抽取（产 POI 名称候选列表 + 作者对该 POI 的评价线索，如有）→ 视频按时长抽帧并先做语音检测 → 图片/关键帧二次存储至 COS（禁止热链）→ AMap 标准化与验证（判定标准 POI/坐标/文字地址/营业时间/评分/人均/电话等）→ 高置信自动入库 / 低置信标记“待定位”；前台可创建多个 job 并用 SSE 分别跟踪。
 解析抽取策略（更新）：默认启用多模态 LLM（含图+文/关键帧）进行抽取；短视频（≤30 秒）应高频抽帧，长视频可按较低频率抽帧；静音或 BGM 视频跳过 ASR，含人声片段才进入 ASR；输出“POI 名称候选列表 + 作者评价线索（如有）”，保留 evidence.source、source_attribution、质量等级与置信度；若无法可靠抽取，则降级为“仅媒体+待定位”。取消原 text→OCR→VLM 的流水线模式（不再按低置信逐级触发）。
- FR4.1: 连锁与分店规则（标准化阶段）（更新）：抑制常见连锁误解析：通过“连锁品牌抑制列表（可编辑）”限制泛化匹配（列表由 Backoffice 维护）；当无法确定具体分店时，从 AMap 检索≤20 家分店，按“主 POI 附近 2km”裁剪，仅保留 2km 内分店并进入后续流程。
  - CE-01（2026-09-14确认）：Story 1.11提供受权限控制的最小桌面Web规则查看/新增/修改/停用、持久草稿、检查发布与审计。发布以预期版本和幂等操作原子生效，每个ingest/geo attempt首次使用时固定规则版本，后续筛选/重试不混用；热更新需核对实际加载/使用，失败保留原规则，不等待8.3/8.6或新增通用后台。
- FR5: 灵感库：按城市聚合与列表展示；“待定位”条目点击整行弹窗，提供 Top-5 候选地（名称+地址，不显示置信度），不阻塞后续流程。
- FR6: 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子；
  `required/必去` 与 `along_route/顺路` 只在 S4 Picker 中赋予，Library 中的收藏/导入
  不得静默等同任一种规划意图。
- FR7: AI 初始规划：根据时间、住宿、地点意图、导入证据和节奏一次生成完整、可编辑的日计划；不得要求用户先手工摆放地点。无法安全落位的 required 项明确进入未解决/候选区域，未选内容由 Agent 适量补全。
- FR8: 时间轴编辑：用户可替换、移动到前一天/后一天/其他日期、按 1 分钟精度调整开始与结束时间、删除并撤销；首末日和无其他可选日期时正确禁用移动目标。AI 生成时间允许内部按 15 分钟精度对齐。
- FR9: 增量可行性校验：初始计划必须先通过校验；用户或 AI 后续修改引入闭店、过远、超时、住宿/交通冲突时再展示冲突及可预览的修复方案，干净计划不长期占用校验卡。
- FR10: AI 行程细节完善：在已排好的计划上为所有适用槽位补充“做什么/准备什么/注意什么”、why_short 与引用来源，并在服务端保留质量/新鲜度审计状态；普通行程单不显示技术质量、新鲜度或置信度枚举。完善不得修改用户已确认的日期、时间或顺序。
- FR11: 导出行程图片（行程卡片）；公开格式默认 WebP，兼容失败时降级 JPEG，产品文案不承诺 PNG。
- FR12: 设置页：只展示账号信息及实际可用的账户/数据/隐私/反馈操作与退出登录；完整数据/反馈流程由各自 Story 负责。不提供 AI 用量、额度或全局生成状态面板，不要求用户配置模型 Key；未部署能力不伪装为可执行，已部署但暂时失败的操作保留真实恢复路径。
- FR13: 观测与评测：接入 Langfuse（提示版本/调用追踪）与 promptfoo（离线 A/B 评测），前后端接入 Sentry。
  - 评测补充（用户确认 2026-09-07）：线上样本允许经去直接标识后参与评测，仅筛查姓名、证件、个人联系方式等直接关联个人的信息，不因可能间接推测身份清除日期、酒店 POI、路线或偏好。凭据安全、访问/外发范围、保留与删除另行控制，评测副本使用独立入口，不放宽生产遥测。质量按具体规则配置计分、提醒或人工复核，不统一“一条硬约束失败即否决”；个别阻断规则须单独对齐，运行时业务校验不变。必须支持人工打分、评语和实验对比标注，并提供轻量运营入口进行实验配置与模型迭代；生产路由/预算仍归各自受控操作。Story 8.2 的 24 条 GWT 与采用方案已于 2026-09-08 批准：promptfoo 执行确定性/完整回归，Langfuse 提供样本、人工评分/评语、逐例对比及 prompt/Playground；结果同步不重复推理，人评回收形成版本快照。确定性 CI 可离线使用，但缺少真实人评链不能验收整张 Story。
  - Story 8.1：复用 Sentry 错误诊断与 Langfuse AI 观测界面；Sentry 管理唯一全局 OTel provider，Langfuse 使用显式隔离 provider，以安全 correlation/job/attempt 关联，不承诺共享父子 trace 或完整采样。所有出口按允许字段和值级规则脱敏，不录屏或采集完整输入输出；未知数据不计零，监控故障不影响任务/行程。实际授权查询、版本兼容、保留/删除和故障隔离必须验收，托管方式与付费能力另行确认。评测、集中策略、Telegram 和运营总览仍分别归 8.2-8.6。
  - Story 8.6（2026-09-13 批准）：20条GWT及中文验收说明、两张桌面R1确认。现有Node/React薄只读总览汇总既有业务结果/降级、8.1观测、8.2封存评价、8.4账本、8.5事件和配置使用证据，复杂分析进入受保护原工具。各来源窗口/定义/权限/截至时间/覆盖与采样外推分别说明，不合并不同分母、不平均P95、不用采样数据补账或把无数据当健康。固定只读查询有界并合并/缓存/退避，部分失败与陈旧独立展示，缓存/迟到响应不跨环境或撤权范围泄漏。总览不改策略/账本/告警、不启动模型/评测/重跑/测试消息；无移动运营适配、新Grafana/iframe/公共分享前置。真实来源/权限/口径与桌面证据仍需实施验证。
- FR14: 第三方集成（国内可用）：Authing/极光（登录）、腾讯行为验证、高德地图 SDK+Web API（POI/搜索/逆地理/距离矩阵）、腾讯云 COS+CDN（直传签名+缩略图处理）、友盟 U-Link+U-App（归因/分析）。异步编排使用开发框架与代码实现，复用现有服务、worker及必要队列，不以n8n或其他低代码平台为前置。

- FR15: 登录等权展示（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，排序：Apple｜手机号｜微信；登录首屏埋点区分入口。
- FR16: 行为验证触发策略：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可通过远程开关改为“发送前必过”。
- FR17: 统一输入分流（无法判定）：使用底部半高 Sheet 进行二选一提示，不遮挡目的地卡/地图抓手。
- FR18: 多条链接粘贴：识别全部支持的小红书链接，为每条创建独立 ingest job，并以 `N/X` 队列顺序展示；输入框与 `+ / 发送` 按钮保持同一底部组件，不新建第二层导入输入。
- FR18.1: 导入记录与去重：灵感库展示当前用户拥有的导入记录、来源标题、解析 POI 和原始链接复制入口；记录和原始链接必须鉴权隔离。MVP 以 `user_id + normalized_url` 去重，并记录 URL normalization 规则版本；短链展开、追踪参数和 canonical URL 变化不能绕过去重。跨用户可复用计算/媒体指纹，但共享对象必须有独立 ACL、引用与删除语义，且不得泄露导入记录或批注。
- FR19: 入库进度展示（SSE）：阶段 created→fetching→parsing→geo→storing→done；UI 合并为 获取内容/理解图文/验证地点/保存灵感；显示来源标题、安全截断、当前事实动作与 `N/X`，不显示百分比或虚假进度条；完成项按 FIFO 各自完整展示 10 秒，后续完成项等待；失败支持重试和重连。
- FR19 补充：SSE `parsing` 的当前诊断阶段为 `media_prep | speech_detect | frame_extract | asr | multimodal`，未执行的阶段可跳过，UI 仍统一显示“理解图文”。旧 `text | ocr | vision` 仅作为兼容事件读取，不代表恢复 text→OCR→VLM 流水线。每个事件使用单调序号和可恢复 cursor 持久化，进程重启或客户端重连后可从最后已确认事件继续。
- FR20: 待定位 Top-5 展示：仅显示“名称+地址（含商圈/地标）”，不展示距离/时长/置信度/评分；灵感库条目与规划解耦。
- FR21: 时间轴微调与全局撤销：AI 编排可按 15 分钟步进；用户通过时钟式控件最小按 1 分钟调整，快速滚动只改变灵敏度，不展示 30/60 分钟吸附提示。右上全计划控件默认显示历史图标，变更后显示 `撤销 8`；倒计时结束后仍可再撤销最近一条符合条件的操作，不在底部或单日显示“最近操作”栏。
- FR22: 冲突分级与后续动作：结构性无效、越权和冻结预约/票务冲突拒绝写入；营业、通勤、时长、酒店/行李等派生冲突允许形成新版本但立即触发增量校验。硬冲突阻止完善行程细节与导出，软冲突可继续但必须解释风险。
- FR23: AI 填充输出规范：每块输出“做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）”，超长折叠；缺少“做什么”报错并回退；后端对超长硬裁并加省略号。
- FR24: 导出图片规格：用户只选择固定宽度 1080 px 或 1242 px。current revision 先推导有序城市行程单元：独立单城 Plan 的全部日期合成一张城市长图；linked Trip 的每个主 TripSegment 与每个 DayExcursion 子 Plan 各生成一张城市长图，并由同一个 ExportJob 按行程顺序一起生成。城市长图用于站内逐城查看和能力允许时的系统多图分享；产品不提供按日切片，也不按城市名称合并不同 scope。一日游城市图使用 `{城市}一日游` 上下文，宿主城市图保留紧凑去返摘要。下载默认从同一 ExportJob、revision、theme 和不可变渲染快照确定性生成或复用一张整趟长图，按真实时间顺序编排主城市、跨城交通和一日游，一日游嵌入宿主日期而不重复追加。实现阶段必须用支持的浏览器、设备与 WebP/JPEG 编码器矩阵实测安全的最大 raster height、decoded pixels、内存与文件大小，并固化为版本化 `TripLongLayoutPolicy`。若加入下一个完整主城市段（含其宿主日期内的一日游）会超过该策略，系统在城市边界关闭当前 part，让该城市从下一 part 开始；每个 part 标注稳定 `N/总数`，预览先说明将下载几张。正常长度是一张图片、一个文件；超长行程仍由一次用户操作启动一个有序下载批次，但可产生多张编号图片。不得使用 ZIP、在城市内部或日期中间拆分，也不得隐藏批次分段；支持目录写入时一次授权写入全部part，逐项写入/关闭成功才可报告已保存；不支持时使用浏览器受控的多文件下载，实际交出请求且无可观察拒绝时显示“已开始下载，请确认”，内部保存结果保持未知。明确取消/拒绝/失败照实显示；未知文件重试由用户明确触发并说明可能重复，复用同批次而不重新生成或重复扣次数，不承诺自动识别未保存文件。整趟合成不调用 AI、不重新规划、不创建 PlanRevision，也不重复计入导出额度。公共文件默认 WebP，尺寸或兼容策略命中时降级 JPEG（75–80%）；城市单元每张尽量 ≤ 600 KB，整趟 part 使用独立安全尺寸/编码预算。若单个不可再分的城市单元在 fallback 后仍超出策略，返回可解释 typed failure 并保留其他城市图查看与分享，不得从城市中间截断。导出接口支持 width_px，并在预览中展示推导出的有序城市图片清单。背景使用版本化的抽象路线底纹与自有/已授权城市页头页尾素材；无城市素材时稳定降级为通用模板，不在单次导出中临时调用 AI 生成背景。
- FR25: 操作可用性与恢复：AI 填充/导出等工作页保留真实生成阶段、任务处理与输出数量；受限时只提供真实可用的重试、稍后继续、查看原任务或返回手动编辑等路径。不向用户展示已用/剩余额度、上限、计量窗口、重置时间或额度分级，不将内部额度原因包装成虚假排队/服务故障，不要求配置 Key。后台保护与远程开关继续有效。
- FR26: 规划入口：底部自然语言或目的地卡先进入 S2 旅行时间；从导入灵感进入时携带 city/place hints，但仍按 S2→S3→S4 前进，不绕过必需输入。历史 `/planner/pick` 深链需补齐缺失输入后再显示 Picker。
- FR27: Planner Picker 路由与参数：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}。
- FR27.1: 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精确航班/车次、2 小时时间段或 `交给 AI 安排`。住宿按夜设置酒店且允许留空，酒店名称输入后经 AMap POI 匹配；每晚同时确认早餐与行李去向，`同上` 是用户主动确认按钮。显式选择 `交给 AI`、`留空`、`未知/未决定` 或 `同上` 均可作为对应字段已确认；从未处理的 ambiguous 初始态不能被静默当作确认并越过下一步门禁。预约、门票和 dawn/sunset/night/night-market 等特殊时段由导入证据与 Agent 推导，不设独立开关。
- FR28: S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐：悠闲为每天 1-3 个主要安排、较晚出发并保留较多自由时间；从容为每天 2-4 个主要安排并兼顾游览与休息；充实为优先覆盖更多地点并接受早出晚归、较多步行和换乘。默认 `从容`，但自然语言或导入证据已有明确节奏时可预选对应项，用户仍可修改。S5 不重复 S2/S3 摘要，提供默认折叠的可选“其他要求”输入，并且是唯一显示 `开始规划` 的阶段；不提供“智能编排”开关。
- FR28.1: 玩法与兴趣信号：从用户自然语言、导入内容及选择行为推导 `经典 / 吃喝 / 自然 / 拍照 / 古建 / 小众 / 逛街 / 展览` 等可多选兴趣信号；每个信号保留来源、时间、质量和置信度，不在 S2/S3 重复询问。无可靠证据时使用中性、多样化候选，不把推断伪装成用户确认，也不得覆盖 required、明确附加约束或 pace。
- FR29: Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内标题显示当前 L2。L2 仅用由子 L3 派生的非交互变色状态点和分项计数表达选择，不显示勾选框。只有 L3 页默认展开互斥 `附近 | 全城` 视角；点击/选中 L3 时地图聚焦该 POI 与附近地点，split 视角显示当前及相邻 L2，完全地图视角显示整个 L1。全城检查标题不可展开。POI 使用通用信息 Sheet，标题直接使用 POI 名称而不是“详情栏”等泛化标签，并包含地址、营业时间、评分、建议停留、来源与可选预约证据。
- FR30: L3 行右侧提供互斥图标意图：勾选代表 `required/必去`，Route 代表 `along_route/顺路`；再次点击活动图标可清除。吸底汇总显示 `已选必去 X` 与 `顺路去 Y`，L3 页 CTA 为 `返回全览`，全城检查 CTA 为 `下一步`。允许 0 选择，由 Agent 使用 AnchorPool/城市热门补全。
- FR31: Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图、L2 分项汇总和全局计数；卡片、Marker、列表和通用 POI Sheet 状态一致。`需预约` 是证据 badge，不是第三种意图，也不代表 Nomad 已完成预约。
- FR32: 单一可见 AI 规划：提交 S5 后，用户进入稳定的时间轴 shell，看到事实阶段、重连和降级状态；同一 shell 最终解析为完整可编辑计划。Planner 优先处理 required、证据强时段、住宿/行李与 transfer 边界，再安排 along_route 和 Agent 候选；无法落位的 required 与未采用候选进入明确的未解决/候选区。
- FR32.1: 内部快速降级：确定性/L2/低成本路径可在超时、配额或 Provider 故障时生成可用结果，但只作为同一规划任务的降级产物；UI 不暴露 Quick/HQ 名称、双完成版本或“切换-采用”。
- FR32.2: 高质量编排：平台默认使用可用的高质量 Provider 完成初始编排；后台尝试必须有 attempt fencing、版本与来源记录，不得在用户已编辑后静默覆盖当前版本。内部候选版本只有在系统安全采用或用户明确预览变更时才生效。
- FR32.3: 候选与模糊补全：S7 候选区一级只按 intent 分为 `未安排的必去 / 顺路候选 / 其他候选`；每个地点行再单独标注 `来自灵感 / 城市热门 / 附近推荐 / 我添加的` 等来源。intent 与来源是正交字段，来源不得成为互斥一级分组，也不使用泛化 `AI` 标签。MVP 缺少可靠地点时，依次使用当前 owner 已导入且完成验证的灵感、AnchorPool/版本化城市 Top-50 和 AMap 附近搜索；高置信且通过约束的结果可参与编排，不确定结果进入候选区，不暂停 PlanningJob，也不静默落位；仍不足时保留明确自由时间。用户可通过现有导入入口主动补充具体小红书链接。面向单个用户或单次 PlanningJob 的小红书关键词搜索仍不进入 MVP；Post-MVP 的平台主动搜索只按 FR34.1 在后台补充共享 AnchorPool。

- FR33: 规划任务可控性：内部候选、确定性编排和低成本 Provider 均受远程开关、超时、配额、熔断与 attempt fencing 控制；降级只更新同一个 PlanningJob 的事实状态，不向用户暴露 Quick/HQ 或第二份待采用结果。SSE 至少覆盖 accepted/context/constraints/candidates/arranging/validating/persisting/done/fallback/failed，埋点记录首次可行计划率、阶段耗时、fallback_rate、冲突率和未解决项数量。
  - Story 8.3（2026-09-08 批准）：复用 Node 适配器与 PostgreSQL 单一配置权威，提供小型受限路由页，按已注册任务/能力管理主用与备用，检查后以版本化差异确认发布。普通发布只影响之后新接收的任务，已接收/排队任务固定原配置；发布回执、加载和实际使用分开记录。暂停新调用独立控制，不承诺撤回已发出请求；恢复另行确认，回滚生成新版本且不解除暂停或修改用户行程。最低预算/重试/熔断保护继续生效，Unleash 仅保留普通开关，不另建可写路由权威；本期不新增独立 AI 网关。生产配置不跟随 Langfuse 实验标签自动发布，集中预算/Telegram/总览仍分别归 8.4-8.6。

- FR34: AnchorPool（离线锚点）：使用 city×season×tod×category 的离线池作为未选内容和零选择场景的候选来源；不可用时回退受版本管理的城市 Top-50 并记录来源与降级原因。候选准备属于 S6 同一 PlanningJob 的内部步骤，可产生事实进度事件，但不形成独立页面或第二份计划。

- FR34.1: 平台 AnchorPool 主动冷启动（Post-MVP）：当版本化分桶持续处于 `missing / stale / insufficient` 时，由 Epic 8 的平台后台任务生成 `城市 × 季节 × 时段 × 类别` 搜索意图，并通过隔离、限频、运营账号管理的小红书搜索 Provider 获取候选笔记；选定结果依次经过详情/媒体取得、多模态提取、AMap POI 验证、CanonicalPOI 去重、共享准入与 AnchorPool 原子快照发布。搜索登录态、Cookie、验证码/风控挑战和素材暂存不得使用终端用户会话，不得进入 Nomad API 进程或日志；失败只暂停/降级平台采集任务，当前用户 PlanningJob 继续使用 MVP 的 Top-50、AMap 与自由时间路径。交付拆为“受控搜索 Provider/素材采集”和“缺口驱动补池编排”两张 Epic 8 Story。

- FR35: Linked multi-city（MVP 分阶段交付）：保留 `Plan -> City` 单值关系，由 `Trip` 按顺序连接任意数量、同一时区且主链不重复的 `TripSegment -> Plan`；产品不设置城市数量上限，每个主城市继续使用完整、独立的单城规划流程。相邻主段之间使用白天直达 `TransferLeg/transfer_slot`，每个中间城市至少住宿一晚，每个本地日期最多一个主链交接。Picker 可展示附近跨城 L1/L2/L3；用户在 Picker 或计划编辑中对跨城 L3 选择 required/along_route 时，先明确选择“新增目标城市行程”或 FR35.1 的“安排目标城市一日游”。新增主城市时保留原意图并绑定目标 segment，再回到旅行时间/住宿设置该城市的日期、交通、酒店与行李；以后每增加一个主城市都重复同一确认与 S2/S3 流程，取消只撤销本次新增且不得修改已有 Trip。两城确认可用独立反转图标调整先后；城市链增长后在 S2 明确本次新增城市的插入位置，不开放对既有整条链的任意复杂重排。交接日的进站/候车/行驶/到达/出站组成一个归 Trip 所有的连续区间，分别限制上下游城市可用时间；交通草稿、未确认 AI provisional 或失败阻止联合发布。主链离开后跨夜重返同一城市、跨时区、夜间跨日交通和任意复杂重排延期。

- FR35.1: 跨城一日游（MVP 受限 A-B-A）：一个主 `TripSegment` 的某个本地日期可以挂载一个 `DayExcursion`，以目的地城市的独立单城 Plan 编排当天内容，并由 `outbound` 与 `return` 两条独立 TransferLeg 在同一时区、同一自然日内完成 `宿主城市 → 目的地城市 → 宿主城市`。确认 Sheet 显示 `安排{目标城市}一日游 / 增加{目标城市}行程 / 暂不加入`；选择一日游后确认日期与去返交通，任一交通缺失、provisional、失效或不可行都允许保存草稿但阻止规划和发布。DayExcursion 不创建第二个同名宿主 TripSegment，不设置目的地住宿，不移动宿主酒店或行李；宿主日计划只使用去程前和返程后的可用区间，子 Plan 只使用两条交通之间的区间。发布后同一 Dn 时间轴依次展示宿主安排、去程、`{目标城市}一日游`、返程、`已回到{宿主城市}` 与宿主酒店；AI 调整按当前所处宿主 Plan 或一日游子 Plan 限定范围，不能修改两条交通或另一 Plan。本版每个宿主日最多一个一日游，且不得与主链交接同日；不支持嵌套一日游、同日 `A-B-C-A`、跨夜折返或把一日游静默升级为住宿城市。
  - CE-02（2026-09-14确认）：已有S8行程新增一日游只重算目标宿主日的受影响非冻结安排及child Plan；其他宿主日期/城市与住宿行李保持原样。当天放不下的非冻结地点保留为带原因的未解决/候选并保留required、用户修改与来源，不跨日挪动；冻结冲突仍阻止发布。后续显式跨日编辑以及4.7更换一日游日期的旧/新宿主日流程保持各自原合同。

- FR36: 酒店槽与餐饮处理：每晚生成 hotel_slot，作为节奏、区域聚类、换住缓冲、行李处理和晚间半径的核心约束；DayN 底部固定显示，允许空白。餐饮在视觉上使用普通 POI 行，只对 `需预约` 等证据做小标注，右侧可增加更换入口；酒店早餐影响早段安排。

- FR36.2: 餐饮选择池与商圈召回：固定/已预约餐厅作为 `fixed_anchor`；普通餐次可为 `choice_pool`，包含一主和最多两备，候选不足时第一个空位显示 `+ 添加更多`。Planner 不机械创建早餐、午餐、晚餐和加餐四个槽；酒店早餐、普通小吃、咖啡和现场随性餐饮默认不占时间轴，只有 fixed anchor、choice pool 或用户明确添加才创建 MealSlot。`暂不决定` 不展示固定 90 分钟承诺，旅中候选依次按当前位置最近、5km 内评分最高、可靠免排队证据、与饭后景点最近的去重补位召回。小吃街/商场等 POI 可附加无时间节点的 `附近吃什么`，只查询当前用户导入、AMap 验证且共享规范化 BusinessArea 归属的美食 POI；无可靠归属则不展示。

- FR36.1: 酒店感知的编排偏好（v0.3 新增）：当当日存在 hotel_slot 时，编排期对早/晚段采用软约束偏好：
  - 晚段靠近酒店的候选优先（near_hotel boost）；
  - 早段靠近上一晚酒店的候选优先；
  - 换酒店日需要加入退房/交通/寄存/入住缓冲，晚间活动半径应以当晚酒店为主；
  - 该偏好仅作为排序加分，不得压过硬约束（营业覆盖/时窗/通勤/T_commute_max/transport_slot 边界）。

- FR37: 结果页（行程单）（MVP 轻编辑）：S10 始终先展示 current revision 的紧凑基础行程，并在计划级 `整体核查` 中分别展示同一 revision 的时间安排状态与行程细节完整度。硬冲突不阻止只读浏览，但阻止细节完善与导出并提供返回 FixSheet/手工编辑的路径；无硬冲突时从 S10 进入 S9，完成、部分完成或失败后返回同一 S10 上下文。槽位页按需展示 why_short、真实引用、source_attribution 和每槽位「做什么/准备/注意」，不显示技术质量/新鲜度枚举。轻编辑按具体行保存用户原文并标记 `我的修改`；再次完善必须保留用户新增、改写、删除及显式留空语义，丢弃与用户表达相同或近似的 AI 建议，仅在剩余容量补充不重复内容，不提供“恢复 AI 内容”。地点或时间调整返回 S7/S8；S7/S8 不显示细节完成卡片。支持导出图片；到达 result_sheet 只表示已有可阅读行程单，不表示细节全部完善、来源全部核查或不存在 soft warning。`/home/tong123/work/厦门旅游规划/output/行程单_final.md` 作为导出格式与 QA fixture 参考。

- FR38: 平台 AI 额度与成本控制策略：默认由平台托管 AI 调用；按用户/设备/workspace 设置请求、并发、导出与成本上限并在服务端计量。阈值、余额、使用次数、重置周期及内部额度分级只用于后台保护/运营，不对用户展示。受限后仅呈现真实可用操作/恢复路径，已有行程仍可查看与手动编辑；服务器继续执行预算、幂等、受控回退、限流和熔断，管理员可调整策略。隐藏额度不是无限使用承诺；BYOK 仅为 Post-MVP 可选增强。
  - Story 8.4（2026-09-13 批准）：复用Node/Fastify/Prisma/PostgreSQL建立单一预算权威及桌面Web运营页，无需运营页移动适配。产品次数、外部请求、并发与成本分开；同一逻辑任务重试不重复扣次数，各真实attempt在所有适用范围内原子足额预留、幂等结算。未知费用保留保守占用，发布/回滚不清零账本或解除8.3暂停，不改既有路线/行程。资费按实际收费方来源登记版本，用量乘资费标估算；上游已核对扣费与账号余额按各自真实能力获取，无账单源显示未接入，汇总账单不伪造逐笔金额。运营设置Nomad上限，发布后从最新账本重算可分配预算，不改上游售价或余额。26条GWT及金额来源补充已批准，真实阈值/计价/多实例/失联/权限仍需实施验证。
- FR38.1: Provider 额度与不可恢复异常告警：Epic 8 为 AI 与 AMap 建立平台级额度、认证、计费、熔断和终态调用监控。内部额度接近上限或故障仍可恢复时继续走缓存、受控重试/回退；用户只看到真实可用操作与恢复路径，不暴露额度；只有重试/回退预算耗尽、全路由不可用、认证/计费失效、额度需管理员动作后才能恢复或持续熔断等终态，才通过服务端 Telegram Bot 向配置的管理员会话告警。告警必须去重、聚合、冷却并可发送恢复通知；只包含环境、Provider/能力、稳定错误码、严重级别、聚合计数、首次/最近时间和 correlation id，不包含用户原文、POI/酒店/路线、原始链接、token、密钥或其他 owner 数据。Telegram 发送失败不得改变用户 Job/Plan 状态，必须进入可观测的持久重试/失败记录。
  - Story 8.5（2026-09-13 批准）：24条GWT与两张桌面R1确认。复用Node/PG保存合格业务事件、故障周期、聚合/冷却及持久待发送记录，单一薄sendMessage适配器投递；不新增必需Alertmanager/Bot入站服务。普通可恢复失败及个人额度受限不直接告警；恢复由同范围业务证据判断，不把缺数据/静默/工具issue关闭当恢复。投递有成功回执、拒绝、未知与有界重试之分，成功不代表已读，超时重发可能重复。Web提供策略、事件、静默、投递恢复和明确确认的测试入口，只有桌面要求；消息与token URL等出口严格脱敏，通知故障不改变Job/Plan/预算。真实目标配置和测试发送仍需另有明确授权，规划批准不代表已送达。

- FR39: AI 事实引用与幻觉约束（v0.3 新增）：AI 填充生成“做什么/准备/注意”时需附事实来源（如高德热门评价标签/官方介绍/可信UGC摘要）；若无法为“做什么”找到来源，则保留可安全表达的通用文案，在对应内容旁以次要行内文字“建议核对”弱提示，不弹窗、不要求逐条确认、不阻断基础行程阅读或其他合法操作；用户可稍后在槽位详情与来源入口查看依据。前端按需展示真实引用链接与 why_short，不以弱提示冒充已有事实来源；无法安全表达时仍为“暂未生成”。

- FR40: 计划延续与状态：首页通过最近一趟行程及完整列表恢复 owner 的规划输入、任务或已发布行程；每个独立 Plan 或整趟 Trip 只占一项，子城市和一日游不重复成卡。显示真实 `草稿 / 规划中 / 已生成 / 生成失败`；`已生成` 仅表示可阅读，不代表旅行结束、细节完善或无冲突。新增城市、修改跨城日期/交通等重新编排保留原行程；仅真实保存的待处理变更草稿/任务产生附属入口，半途离开显示 `有未完成的修改`，仅当前有效任务终止失败显示 `本次修改生成失败`。恢复查询当前服务端版本及有效视图/日期/浏览位置，不自动生成、扣费或发布版本。MVP 不提供手动或自动景点打卡；Story 7.2 已确认移出本期，打卡架构不作为最近行程或其他 MVP 功能的前置门槛。照片自动标记与照片类导出见 Post-MVP FR40.1；本期不启用自动化记忆日志/数据回流。
- FR40.1: 照片驱动的到访标记与旅行影像（Post-MVP，方向已确认、待设计）：基于用户授权的相册照片及可用的已存地理位置数据解析景点，对有照片证据的景点自动展示已打卡标志；支持相册视频、九宫格或 AI 绘图美化后的照片类导出。权限/选片、地理证据与误匹配修正、数据处理/保留、费用和输出格式留待后续设计；不直接沿用旧手动 Story 7.2，不授权本期为旅行影像读取相册、上传照片或存储连续轨迹。此延期不影响 FR45 中用户主动选择并提交的单张反馈截图，不允许借反馈入口扫描相册或自动打卡。

- FR41: 酒店选择优先：优先使用 S3 中按住宿晚明确选择并经 AMap 匹配的酒店；用户选择留空时保持 hotel_slot 空白，不根据灵感候选静默代选酒店。仅在酒店已明确时启用 near_hotel 早/晚弱偏好。

- FR42: 酒店更改与重排确认（Post-MVP，暂不在本版范围）：当用户“更换/首次选择”酒店时，弹窗询问是否对当日（或分段）进行重排；重排范围选项：仅晚段、整日、取消；默认“仅晚段”。

- FR43: 历史步骤管理（Post-MVP，暂不在本版范围）：在 8 秒撤销之外，提供“历史步骤时间轴”，用户可回退到任一自动重排前的版本；每次自动重排/手动大改均生成快照（含 near_hotel 开/关信息）。

- FR44-lite: 文本快速搜索（MVP）：
  - 行程地点候选搜索（Epic 2）：顶部提供 AMap keyword 文本搜索（仅列表，无地图），返回 Top-5；结果项含名称、地址和距离估计，操作为加入候选，不直接修改时间轴。
  - 候选受控落位（Epic 3）：从候选执行直接落位、替换或自由时段填充时，必须使用显式版本化命令并遵循硬约束、分段边界、校验和全局撤销。
  - 酒店槽大弹窗：同样为文本搜索（Top-5列表，无地图），始终提供“留空/稍后决定”。规划前选择按Story 2.5写入住宿草稿；规划后修改按Story 3.3保留未提交草稿，实质变化先预览并明确确认，再发布新版本，不在点击搜索结果时直接改已发布hotel_slot。
  - 行程地点手动补点（无准确结果时）：用户填写目标名称并搜索/选择同城、经 AMap 验证的附近地标；以该地标的地址与坐标作为路线和距离计算代理，目标以“附近估算”状态加入候选。地标不得被写成目标的 CanonicalPOI，目标也不得继承地标的标准名、精确地址、营业时间、评分、人均或电话。
  - 用户未选择可用附近地标时，仍可仅保存名称为“待定位”候选，但不得生成路线/距离估计或直接落位。
  - 弱网/配额失败：提示“搜索暂不可用，请稍后重试”；不提供外部跳转/粘贴分享解析。

- FR45: 用户反馈（兔小巢集成，MVP）
  - 入口：设置、侧边栏与结果页异常二级入口复用同一流程并恢复原视图；始终可选择“直接填写反馈”，打开/返回不重试原任务。
  - 跳转：仅使用实际配置验证过的官方产品链接 `https://support.qq.com/product/{PRODUCT_ID}`。Web/PWA 由用户操作打开外部页面；仅已有真实 WebView 宿主按其文档启用所需 JavaScript/DOM Storage，不新增原生壳，不把 window.open 当 WebView。缺配置不使用占位产品链接；明确失败保留重试/浏览器/内置填写。
  - 登录态与结果：默认不传 Nomad 身份、会话、手机号/邮箱；不保证所有宿主都匿名，第三方自身登录可通过内置表单避开。网页/邮件打开、iframe load 或用户返回不证明反馈提交；不可观测的第三方提交不代报成功或失败。
  - 内置表单：复用有效 Nomad 账号，一段文字与最多一张可选截图；不要求分类、联系方式或 AI 改写。诊断信息默认关闭，开启仅附来源页面类别/应用版本/安全错误代码。截图本地预览，明确提交后才上传私有 COS，校验图像并移除 EXIF 定位，不自动截图/扫描相册。
  - 状态简化：截图上传不可用只将上传控件置灰，不额外显示失败提示、重试上传行或专用“移除截图，仅提交文字”按钮；已有截图保留 X 移除入口，再复用普通提交。附件未完成不得静默丢图。上传/提交/有界核实期间无底部操作按钮，仅真实失败或等待耗尽后退出忙碌并恢复操作，不无限转圈或自动重发。
  - 可靠提交：文本与已验证附件引用真实落库、授权维护者可读取后才返回回执编号/时间和“反馈已收到”；不代表问题已处理或腾讯/邮件已收到。相同 owner/幂等 key/载荷复用回执，未知结果先核实原申请。草稿临时恢复按 owner/TTL 隔离，退出/放弃/删除清理；截图字节丢失明确重选。
  - 数据边界：内置反馈仅限本人/授权维护者访问，拒绝停用账号迟到写入；7.6 接入既有 7.4 结构化导出（反馈文字/安全附件索引、不打包截图）与 7.5 删除清理。第一方落库即本期交付，不自动转发外部、不新建客服后台；反馈内容不进入埋点/日志/模型执行。
  - 后续可选增强：自定义登录态/SSO、外部自定义参数、微信回复通知、Webhooks、第三方反馈数据拉取、反馈历史/客服对话和 SLA；均非本期前置条件。当前不展示额度、不以 AI 预算阻断反馈。

- FR46: 行程清单：日期 Tabs 横向滚动，右侧固定窄 `ListChecks` 图标与未完成数量；点击进入单城或联程共享的整趟清单，分为必买目标、顺路门店、返程事项及按需出现的其他记录。记录可属于整趟或具体日期，可编辑、删除、完成或取消完成，使用独立清单版本，不等同景点打卡且不触发排期撤销。购物记录使用单一多行文本框与灰色占位示例，底部 `款式 / 数量 / 预算 / 品牌 / 尺码` 快捷操作只换行插入标签并保留原文；已有标签定位到原行，不重复覆盖。只描述想买的东西即可保存，不要求填齐属性、选择购物日期或关联门店；占位文本不是用户数据。商品属性结构化、多门店关联、自动或用户协助找店、L2 购物编排及顺路购物提示留到后续版本，销售/库存证据、计划经过与实际到达、自动应用授权及撤销三个边界届时设计。购物区域只有本身是旅行目标时才占时间。MVP 的返程事项作为清单记录，不直接生成时间槽，也不提供清单内的 `预留时间` 动作；既有交通、住宿和行李方案所需缓冲继续由规划与校验流程负责。清单事项转换为可执行安排的能力留待后续版本，不能要求用户把已确认的取行李或交通缓冲从清单重复添加。底部仅显示 `+ 添加记录`；空输入时 AI 提示不可用并强调直接添加，点击直接添加进入填写页，不保存空记录；有效输入后强调 AI 提示，仅点击才生成。AI 结果可逐条编辑/选择、重复建议默认不选，确认后才写入，不覆盖已有记录；相关上下文变化须重新核对。直接添加始终保留原文，生成/保存失败保留输入与手动路径。当前版本不承诺实时库存，也不自动触发“返程前 48 小时”提醒。
- FR47: 商圈归属：POI 可归属零个或多个规范化 BusinessArea，并保存来源与置信度。行政区和 L2 路线聚类不得静默等同商圈；商圈召回只能使用当前用户导入且完成 AMap 验证的 POI，无可靠归属时隐藏相关提示。
- FR48: 旅中定位降级：打开App或回到前台时，若存在需要定位的当前旅中餐饮上下文，允许在历史授权仍有效或用户本次授权后以单次fix刷新餐饮候选；打开餐饮候选或主动刷新也可触发。同一次前台打开/恢复事件合并重复触发，系统权限已撤销或无法确认时不能仅凭历史记录获取位置；未授权时不因打开App反复弹出授权窗口，先沿计划上下文继续，用户需要附近候选时再选择授权。拒绝授权、定位陈旧/低精度、越城或无可用fix时，使用同一Plan scope的上一计划POI与下一计划POI作为标注的降级基准。MVP不提供打卡/照片到访记录，不按时间推断已完成；只有一个基准时使用该基准，两者都无时保留静态池和手动添加。刷新只读且不抢占当前页面、不改变已选餐厅或行程；后台停止新定位、不上传或保存连续轨迹。
- FR49: 阶段与转场：产品和埋点统一使用 S0–S11；自然语言输入跳过 S1。跨城选择在确认 Sheet 分流：新增主城市从 S4/S8 回到 S2/S3，一日游进入日期与往返交通设置后回到同一个 S5/S6 规划流程。S6/S7 共享一个时间轴路由，S8 是可重复循环而非向导页。除 S5 外任何阶段不得显示 `开始规划`。
- FR50: 对话式局部调整：S7/S8 通过右下角可访问的 `AI 调整` 图标接收自然语言和上下文快捷表达；AI 先识别槽位/连续安排/单日/后续日期/当前单城 Plan 范围并翻译为类型化约束。Linked Trip 的主段上下文只能读取和修改当前 `TripSegment -> Plan`；DayExcursion 上下文只能读取和修改当前一日游子 Plan。两者均不得新增、删除、重排城市，不得修改 TransferLeg，也不得把变更扩展到宿主/子计划或其他城市 Plan。若范围不唯一或请求可能触碰 required、冻结事实、住宿/行李或其他风险边界，先构造一个受控 `AdjustmentAsk`，一次只澄清一个范围问题或提示一个关键风险；ask 与快捷入口都不得直接修改计划，也不展示“我理解为”或 chain-of-thought。范围明确且风险边界可处理后，系统显示 `选择一个调整方向` 的两个简短取舍方案，确认后才预览并应用 diff，完成 Sheet 以 `做了以下调整` 说明事实变化。无安全方案或 stale revision 保留当前计划并进入已批准的恢复状态。LLM 不直接写持久化 JSON，所有应用均经过 ownership、revision、idempotency、校验和全局 undo。
- FR51: 跨日负荷与天气上下文：每天以主要安排数、步数区间、通勤、最早出发/最晚结束和留白时间解释负荷，步数是可突破但需解释的软约束；Trip 级校验覆盖连续早起、连续高负荷、恢复时间、同行人/体力约束、换住/行李与交通缓冲。只有处于可靠预报期且携带来源、新鲜度和质量状态的天气可参与校验或 `雨天方案`；远期日期降级为季节性建议。任何天气调整必须预览确认，不静默改写计划。

**Total FRs: 64（60 MVP / 4延期）**

### Non-Functional Requirements

- NFR1: 国内可用三方服务优先；外部依赖需有可替代方案或降级策略。
- NFR2: 前后端以 SSE 展示异步进度；事件使用单调 cursor 和可恢复持久记录，客户端/服务重启后从最后确认位置重连，不把内存队列当作事实来源；MVP 不使用远程推送。
- NFR3: AI 安全与成本控制：平台 Provider secrets 仅在服务端管理；日志、Sentry、Langfuse 与埋点必须脱敏；对象存储私有读写与签名 URL；AI 请求具备速率限制、成本上限、异常熔断和降级策略。
- NFR4: 性能目标（MVP）：单一 AI 初始规划、增量校验、行程细节完善与导出分别设定并监测 P50/P95；内部降级不得造成第二套用户完成流程。
- NFR5: 质量指标：首次可行计划率、required 安全落位率、along_route 采用率、候选可解释率、餐饮选择池有效率、地理消歧 Top-1/Top-3 命中率、负荷估算覆盖率和跨日高负荷检出率分别设定并监测。
- NFR6: 可观测性：Langfuse/promptfoo/Sentry 接入完备，关键漏斗（登录→输入/导入→时间→住宿→选点→规划前确认→AI 规划→编辑/校验→行程单→导出）可埋点度量。
- NFR7: 合规与隐私：首屏可跳转《隐私政策/用户协议》；账号删除与数据导出流程闭环；高德版权标注规范。
- NFR8: 交互体验：移动端动效 120–200ms；单列布局；顶部吸顶分段；关键列表/弹窗交互流畅。
- NFR9: 行程细节完善不得改动日期、时间与顺序；任何重排必须走独立的可预览调整流程并生成新版本。
- NFR10: 初始规划安全性：不得静默突破营业、冻结时窗、住宿、transfer 或权限硬约束；失败项进入明确未解决状态，用户编辑与 AI 调整均可撤销且不得覆盖更新版本。
- NFR11: Linked-trip 性能与一致性：各单城市 Plan 可独立计算，但 TripRevision 必须绑定确定的 Plan/Transfer 版本；交接日、住宿与行李边界在生成、编辑和导出中保持一致。
- NFR12: 引用可追溯性（v0.3）：AI 输出的事实引用需可追溯到数据源（保留来源ID/时间戳/摘要）；失败时必须降级为“通用建议”。
- NFR13: 反爬与稳定性：Cookie 轮换、代理池、应用级限流、指数退避与 DLQ、可观测（抓取/解析/地理消歧各阶段指标）由 XHS-Downloader 负责，Nomad 项目不额外设置；失败降级为“仅媒体+待定位”，不中断后续流程；定位失败降级“待定位”可接受。MVP 本条仅适用于用户提供具体链接后的抓取解析，不代表已具备关键词搜索、搜索登录会话或搜索结果 API。
- NFR14: 许可与合规：第三方采集器以独立服务（HTTP）集成以避免 GPL 传染；仅保存最小必要数据；证据链（source/时间戳/摘要）与可追溯性满足 NFR12。
- NFR15: 反馈隐私与安全：默认不向外部传 Nomad 身份/会话或手机号/邮箱，不承诺所有宿主匿名；内置表单复用有效账号并隔离文字/私有截图/回执，诊断元数据显式选择且最小化。外部 SSO 等留后续按官方合同设计；授权维护访问、导出/删除与临时附件清理随 7.6 交付。
- NFR16: 反馈运行环境与状态：Web/PWA 使用真实外部打开能力，已有原生 WebView 才按文档启用 JavaScript/DOM Storage；明确加载失败提供恢复，不伪造跨域 HTTP/CSP 检测。区分 feedback_open_* 与 feedback_submit_*，仅真实落库回执计第一方提交成功，不可观测的外部提交不计成功/失败；事件仅含有限 source_page/模式/安全错误。上传置灰与无底部按钮的进行中状态遵守 FR45，有界核实超时后才恢复操作。
- NFR17: LLM 提供商可替换与回退：所有编排与填充调用均通过 OpenAI 兼容接口（api_base + model）；可远程切换提供商/模型并支持按任务路由；出现失败/超时按预设顺序回退；成本/时延与错误率可观测；变更不影响前端与业务逻辑。
- NFR18: 定位隐私：只在App打开/回到前台且存在当前旅中餐饮用途，或用户打开/刷新餐饮候选时，经当前有效授权请求单次定位；历史授权不得越过系统撤权。同次前台事件去重，不启用持续监听、定时定位或后台刷新；仅保留本次召回必要的短时位置上下文，服务端与分析日志只记录粗粒度结果，不保存精确位置历史或连续轨迹。
- NFR19: Picker 状态一致性：required/along_route/unselected 在地图、L3 列表、L2 汇总、全城检查和提交 payload 中必须由同一状态源派生；返回、切换视角和弱网降级不得丢失或改变语义。
- NFR20: 导入所有权：导入记录、解析结果、原始链接和用户批注按 owner 隔离；共享内容指纹或缓存不得成为跨用户读取路径。
- NFR21: 证据诚实性：预约、免排队、商圈归属、营业事实和来源归因必须携带证据/时间戳/质量状态；未知或推断必须明确降级，不得以实时或已确认语气展示。
- NFR22: Trip 原子一致性：联合发布必须绑定确定的主 Segment Plan、DayExcursion 子 Plan、TransferLeg、Stay 和 LuggageTransition 版本；任一主链或一日游 transfer 无效时不得发布部分联程。DayExcursion 必须同时绑定宿主日期、子 PlanRevision 及去返两条 TransferLegRevision，不能只发布单程或孤立子计划。
- NFR23: 路线与动态事实诚实性：通勤模式/时长、航班/铁路查询和天气均保留来源、观测时间、新鲜度与状态；配额、超时、歧义或陈旧时返回 unknown/provisional/seasonal 降级，客户端不得估算或把建议伪装为已购票、实时库存或实时排队。
- NFR24: 运营告警可靠性与隐私：AI/AMap 的普通限流、可重试失败和用户侧操作受限状态不得触发管理员骚扰告警；不可恢复终态按环境、Provider、能力和错误类别去重聚合并设置冷却。Telegram Bot token/chat id 只存在于服务端 secret 配置，告警投递具备超时、有限重试、失败持久记录和恢复通知，且任何 payload、日志或 trace 均不得包含用户内容、精确地点/路线、受保护 URL、凭据或跨 owner 数据。

**Total NFRs: 24**

### Additional Requirements

编号FR之外的业务规则、技术/平台/运行假设和界面约束同样进入后续覆盖检查。
以下PRD-X编号仅作本报告的提取定位，不新增产品FR；原文中注明历史的Story仍按历史处理，
未标延期的“必须项”不能因为未编FR号就忽略。

#### PRD-X01：目标、输入与当前流程（原文提取）

## Goals and Background Context

### Goals
- 从“灵感开始”的真实旅程，完成端到端用例：输入想法/导入小红书 → 确认时间与住宿 → 选择地点意图 → AI 完整编排 → 调整与校验 → 完善行程单 → 导出图片。
- 解决灵感分散、地理消歧难、排期困难、临出行缺少可执行要点等核心痛点。
- 移动端优先（iOS/Android），极简风格与快速动效（120–200ms）。
- 由平台托管 AI 调用、限流与成本监控；用户只看到账号和可用操作/真实恢复路径，不暴露额度。保留账号删除与数据导出；BYOK 降级为 Post-MVP 可选增强。
- 全链路可观测（Langfuse、promptfoo、Sentry），面向国内可用三方服务与合规要求。

### Background Context
重度旅行爱好者常在小红书收集灵感，但信息分散在笔记与图片中，难以结构化并落地为可执行的行程。现有工具多从“目的地→行程”切入，忽略用户真实的“从灵感开始”的旅程。地理消歧（同名店/连锁分店）、时间住宿确认、跨城衔接与排期编辑成本高，且临出行缺少“做什么/准备什么/注意什么”的落地细节。nomad-mvp 以“灵感→可执行”为主线，通过队列导入、POI 验证、意图选择、AI 完整初始编排、可追溯调整与行程单导出，帮助用户完成真正可执行的旅行计划。

## 术语 & 输入（v0.2 新增）

- D：行程天数（整数）。
- T_commute_max：跨簇通勤上限 = D × 24 × 60 × 0.01 分钟（例：3 天≈43 分；5 天≈72 分）。
- 簇（cluster）：同城内按半径聚类的空间簇，半径 R_city（城区 1.5–2km；郊区 3–4km）。
- 槽（slot）：Planner 内部可编排时间块；AI 可按 15 分钟精度生成，用户编辑可精确到 1 分钟，不向用户暴露固定 2h/4h 心智。
- time_hint：用户明确指定的时间块（冻结）。
- required：用户在 Picker 对 L3 点击勾选图标形成的“必去”强偏好锚点；必须经过营业时间、通勤和硬约束校验，不代表无条件强塞。
- along_route：用户在 Picker 对 L3 点击 Route 图标形成的“顺路”正向候选；仅在路线适配时编排，不得按 required 处理。
- unselected：用户未设置意图的 L3；Agent 可用于补全计划，未被编排的条目进入计划的“候选”页/抽屉。
- 热门锚点（anchors）：离线维护的城市×季节×时段×品类 Top-K 候选。
- 兼容说明：旧 API/代码中的 `selected_required` 映射到新 `required`，旧 `must_go` 不再作为独立概念；“骨架”仅是内部实现术语，用户界面统一称“计划”。

## 术语扩展（v0.4 补充）

- L1（区域级）：同一自然/人文连续的大区块，用于“当日同 L1 优先”的编排偏好。
- L2（区域/主题组）：同一片区或主题下便于理解与聚类的一组 L3；历史实现曾按 2h/4h 将其作为快速编排粒度，当前规划以地点事实、日负荷和硬约束动态决定停留时间。
- L3（单 POI）：单个标准化 POI；易变事实（如营业时间）保留在 L3 层；同一 POI 可多归属多个 L2。
- BusinessArea（商圈）：与行政区、L1/L2 分离的规范化商业区域；POI 可按来源与置信度归属多个商圈。
- MealSlot（餐次）：固定锚点或选择池形式的独立餐饮安排，视觉与普通 POI 一致。
- TripChecklistItem（行程清单项）：必买、顺路门店、返程事项或用户记录，不强制成为时间轴 POI。
- InterestProfile（玩法证据信号）：从自然语言、导入内容和选择行为推导的 trip-scoped
  软偏好；每项有来源/置信度，不等同用户确认或长期人格标签。
- DayLoadEstimate（日负荷）：主要安排数、步数区间、通勤、开始/结束、留白、原因和
  置信度；用于解释与校验，不承诺虚假精度。

## 术语扩展（v0.3 新增）

- linked trip：一个 `Trip` 按顺序连接多个单城市 `Plan`，每个 Plan 仍只关联一个 City。
- DayExcursion（跨城一日游）：挂在一个主 `TripSegment` 的某个本地日期下，以独立单城市
  `Plan` 编排目的地，并用去程与返程两条 TransferLeg 在当天返回宿主城市；它不是第二个同名主城市段。
- Stay / LuggageTransition：分别记录每段住宿晚与换住/跨城边界的行李去向。
- transfer_slot：相邻城市 Plan 之间的高铁/飞机/长途车衔接槽，拥有交接日上下游可用时间边界。
- hotel_slot：每晚住宿信息槽；固定在 DayN 底部，并参与早晚半径、区域聚类、换住缓冲和行李约束。
- result_sheet（行程单）：AI 填充后生成的只读结果页，用于浏览与导出。

## Approved Correct Course（2026-08-12）

以下决策是当前产品权威语义，覆盖正文中尚未清理的历史 2h/4h、单一
`selected_required`、Quick/HQ 用户切换与“先手工摆放再让 AI 补空槽”描述：

- 用户流程固定为 S0 `输入旅行想法`、S1 `导入灵感`、S2 `旅行时间`、
  S3 `住宿安排`、S4 `选择想去地点`、S5 `规划前确认`、S6 `AI 规划中`、
  S7 `行程计划`、S8 `调整与校验`、S9 `完善行程细节`、S10 `行程单`、
  S11 `导出与旅中使用`。S1 只在输入含小红书链接时出现，S8 是循环。
- S2/S3 只确认时间与住宿。到达/离开可以填精确班次、2 小时时间段，
  或完全交给 AI；住宿按夜设置且允许留空，早餐和行李是每晚住宿子项。
- S4 以 `全城检查` 为入口，点击 L2 进入 `选择 L3`。L3 有互斥
  `必去(required)` 与 `顺路(along_route)` 图标；返回全城后，两个状态
  必须映射回 L3 缩略图、L2 分项汇总和全局计数。S4 CTA 为 `下一步`。
- S5 选择 `悠闲 / 从容 / 充实`，是唯一拥有 `开始规划` CTA 的阶段。
- S5 还提供一个默认折叠、可选的“其他要求”输入，用于同行人、体力、步行、
  饮食与不能接受的条件；不把目标、玩法、节奏和规划方式重新做成问卷。玩法偏好
  优先从自然语言、导入证据和 L3 行为推断，并保留来源与置信度。
- S6 对用户只呈现一次 AI 规划。Quick/低成本模型可作为内部超时降级，
  但不得形成用户需要切换/采用的第二个完成版本。
- AI 先生成完整、可编辑的初始计划；用户修改后再增量校验和修复。
  Epic 5 的细节填充能力只补充 `做什么 / 准备 / 注意`、引用与质量信息，不改时间顺序。
- linked trip 通过 `Trip -> ordered TripSegment -> single-city Plan` 连接，
  交接日由 transfer slot 分割两个城市的可用时间。主城市某日还可挂一个
  `DayExcursion -> single-city Plan`，通过独立去返 transfer 在同日返回；跨时区、
  跨夜重复城市与任意复杂折返延期。
- 餐饮计划使用普通 POI 时间轴视觉。固定餐厅可成为锚点；选择池包含一主、
  最多两备；`暂不决定` 按定位/下一景点刷新，不展示固定 90 分钟承诺。
  商圈附加美食只来自用户导入、AMap 验证且共享规范化商圈归属的 POI。
- 行程清单以日期栏右侧固定图标进入，包含必买、顺路门店与返程事项；
  新增记录支持经确认的 AI 提示或直接添加，不做自动“返程前 48 小时”提醒。
- 已完成 Story 1.3 只代表单链接、SSE、适配器缝隙和降级基线，不代表真实 VAD/ASR、
  视频抽帧、生产多模态抽取与完整 AMap 事实已经交付；这些由后续入库增强 Story 承接。
- 临近出发且有可靠预报时，Planner/Validator 可使用天气上下文；远期日期只能使用
  季节性提示。天气变化不得静默改写计划，必须走预览、确认、版本和撤销流程。

## MVP Correct Course（2026-06-19）

本次修正来自 `/home/tong123/work/厦门旅游规划` 的真实案例验证：已跑通“小红书采集 → 多模态理解 → POI 验证 → 行程骨架 → AI 填充 → 行程单导出”。MVP 决策调整如下：

- BYOK 不再作为 MVP 交付主路径；用户无需配置自己的模型 Key。MVP 由平台统一管理 Provider secrets、成本预算、速率限制、异常熔断和降级策略。
- 已实现的 BYOK 入口可保留为内部兼容或 Post-MVP 高级能力，但不应在 MVP 用户流程中作为必要步骤出现。
- Epic 2/3 需吸收厦门验证样本：语音检测先于 ASR、短视频高频抽帧、AMap 验证后入库、source attribution 与质量等级、酒店作为节奏/区域/行李约束、dawn/sunset/night/night-market 等强时间槽、Confirm 补问关键旅行条件、模糊 slot 的逐级补全路径，以及 `output/行程单_final.md` 作为导出格式与 QA fixture 的参考。

#### PRD-X02：界面、平台与技术假设（原文提取）

## User Interface Design Goals

### Overall UX Vision
移动端单列布局，顶部吸顶分段，底部统一输入；以“短确认流程 → 地图/列表选点 → AI 完整计划 → 瀑布时间轴编辑”为核心交互，保持所见即所得、状态可追溯与快速动效，避免桌面表单、营销页和多版本技术心智。

### Key Interaction Paradigms
- 统一输入分流（链接/自然语言）。
- 城市聚合与“待定位”轻量消歧（Top-5 候选）。
- 旅行时间与住宿按两页完成，选点后再选择三档节奏。
- `全城检查 -> 选择 L3 -> 返回全览`，required/along_route 状态双向一致。
- 单一可见 AI 规划过程直接进入可编辑瀑布时间轴。
- 替换、跨日移动、分钟级调时、删除、全局撤销与增量冲突修复。
- 普通 POI 视觉下的餐饮选择池、商圈附加提示和固定行程清单入口。
- 行程细节完善、来源引用与导出图片。

### Core Screens and Views
- 登录首屏
- 首页（目的地卡 + 统一输入）
- 旅行时间（日期/天数/每天几点出门/可选到离边界）
- 住宿安排（按夜酒店/早餐/行李，可留空）
- 选点（全城检查、选择 L3、通用 POI 信息）
- 规划前确认（required/along_route 摘要 + 悠闲/从容/充实）
- AI 规划中的稳定时间轴 shell
- 行程计划（瀑布时间轴、候选、餐饮、清单、编辑/校验）
- 完善行程细节与行程单
- 导出页（图片预览与生成）
- 设置页（账号与可用的数据/隐私/反馈/退出操作，不展示 AI 额度或用量）

### Accessibility
MVP 统一执行已批准的 UX-DR2/UX-DR3/AR17：44pt 操作目标、图标名称与语义角色、
选中/禁用状态不只靠颜色、焦点约束与返回、键盘安全区、reduced-motion、克制的状态播报
及 WCAG AA 对比度。上传置灰仍使用真实 disabled 语义；原型与文档覆盖不代替实现核验。

### Branding
极简风格；动效 120–200ms；组件命名与工程对齐（TopSwitch/UnifiedInput/CityCard/LocationModal/PlanTimelineMobile/FixSheet 等）。

### Target Device and Platforms
Mobile Only（iOS/Android）。

## Technical Assumptions
- Repository Structure: Monorepo（待确认）。
- Service Architecture: Monolith（复用现有Node/Fastify模块化服务：Router/Ingest/GeoResolver/Planner/Filler/Export；通过应用代码、worker和队列实现异步编排，无需低代码平台）。
- Languages/Storage: Node.js/TypeScript；PostgreSQL + PostGIS + pgvector；对象存储使用腾讯云 COS + CDN。
- Maps & Geo: 高德地图 SDK + Web API，距离矩阵/开闭店缓存 24h；去重以 canonical_url + 内容指纹。
- Realtime/Async: SSE前台进度；服务端任务通过代码编排与必要队列/DLQ执行，任务状态持久化、幂等、重试和重启恢复独立于执行框架。
- Testing Requirements: Unit + Integration（目标：回归用例由 promptfoo/离线 A/B 支持）。
- Security: 平台 Provider secrets 服务端托管；COS 私有读写 + 签名 URL；日志/埋点/观测脱敏；AI 用量限流、成本上限与异常熔断。
- Observability: Langfuse、promptfoo、Sentry。
- LLM Provider Abstraction: 统一 OpenAI 兼容调用（api_base + model），可按任务通过远程配置选择/切换不同提供商与模型；Provider secrets 由服务端统一管理；支持超时/重试/限流、fallback 顺序、成本预算与时延埋点；所有调用接入 Langfuse 追踪。

#### PRD-X03：内嵌Epic/Story摘要与迁移信息（原文提取）

## Epic List
- Epic 1: Foundation & Ingest & Home（基础能力与入库、首页/灵感库）
- Epic 2: Initial Single-City Planning（规划输入、地点意图与 AI 完整单城编排）
- Epic 3: Safe Itinerary Editing（分钟级编辑、候选/住宿修改、校验修复与受控 AI 调整）
- Epic 4: Linked Multi-City Trips（有序多城市 Plan 联程、交通交接、住宿与行李边界）
- Epic 5: Result Sheet and Export（执行细节、引用、轻编辑与导出）
- Epic 6: Meals and Trip Checklist（餐饮选择池、位置/商圈召回与购物清单）
- Epic 7: Ongoing Use and Account（最近行程、账号隐私与可用操作；额度仅在后台，打卡移出 MVP）
- Epic 8: AI Service Operations（评测、观测、Provider 路由、成本与冷启动候选运营）

## Epic 1 Foundation & Ingest & Home
目标：完成登录与追踪、单条 XHS 入库链路（含 COS 二次存储与 SSE）、首页与灵感库的城市聚合与选择。

> Story 1.1–1.5 是已交付历史基线；其中“单条入库”描述的是当时能力，
> 当前批量队列、导入记录、商圈数据与生产多模态提取分别由 Story 1.6/1.7/1.8 承接。

### Story 1.1 登录与首屏
As a user, I want to login via phone/SMS (and Apple on iOS if any 3rd-party login is offered), so that I can securely access the app.

Acceptance Criteria
1: 支持手机号+短信登录；iOS 若提供第三方登录需等权提供 Apple 登录；按需触发腾讯行为验证。
2: 首屏可跳转《隐私政策/用户协议》。
3: 成功登录后进入首页，埋点登录完成。

### Story 1.2 单条 XHS 入库（SSE 进度）
As a user, I want to ingest a single Xiaohongshu link asynchronously, so that my inspiration is parsed and saved (images re-hosted in COS) with visible progress.

Acceptance Criteria
1: 单次仅处理一条链接；解析抽取→COS 二次存储→高置信自动入库/低置信标记“待定位”。
2: 前台 SSE 展示入库进度；失败重试与 DLQ 策略。
3: 禁止热链，图片通过签名 URL 访问。

### Story 1.3 首页与灵感库（城市聚合/列表/选择）
As a user, I want to see destination cards aggregated by city and select inspiration items to plan, so that I can start planning from inspirations.

Acceptance Criteria
1: 首页顶部分段、目的地卡、统一输入；城市聚合与城市列表接口可用。
2: 灵感库按城市展示；“待定位”点击弹出 Top-5 候选（名称+地址），不显示置信度。
3: 选择若干“想去”条目进入规划流程。

### Story 1.6 Home Import Queue and Import Records（Correct Course follow-up）
承接批量粘贴、每链接 ingest job、`N/X`、完成态 FIFO 十秒展示、来源标题、
重连/失败，以及用户隔离的导入记录、解析 POI 与原始链接。

### Story 1.7 Commercial Area Normalization and Imported Food Query
在 AMap 验证阶段建立规范化 BusinessArea 和来源/置信度 membership，提供
owner-scoped 的已导入美食查询；不得用行政区或 L2 静默冒充商圈。

### Story 1.8 Evidence-Aware Multimodal Ingest Upgrade
将历史单链接 adapter/stub 基线升级为真实下载、语音检测后 ASR、按视频时长抽帧、
可追溯多模态证据与完整 AMap 事实入库；同时产出带来源/置信度的预约、特殊时段和
玩法兴趣推断。CI stub 不得被视为生产验收，厦门样本必须进入真实 adapter staging
与成本/降级回归。

## Epic 2 Initial Single-City Planning
目标：收集时间、逐晚住宿、地点意图与节奏，并通过一个 PlanningJob 生成完整、诚实、可编辑的单城计划。

> Story 2.0 与 2.1 以下内容是已交付历史基线，不回写成尚未实现的新语义。
> Correct Course 修正由 2.2 及后续新 Story 承接；当前队列以 BMAD
> `epics.md` 为准。

### Story 2.0 灵感选择页（历史已完成基线）
As a planner, I want to select must-go and want-to-go inspirations in context before skeleton, so that the generator can use them as anchors to produce a partially filled day-level plan.

Acceptance Criteria
1: 入口与路由：支持路径 A（底部输入解析 trip_params）与路径 B（目的地卡“开始规划”）；/planner/pick 参数含 city/start/days/source/rec_id。
2: 头部参数：标题显示“{城市} · {出行日期?} · {天数?}”，缺参显示“待填写”；右侧“修改参数” Sheet（日期选择器/天数步进器/pace）。
3: 视图结构：城市 Tabs（按目标城市中心点直线距离排序，且仅展示灵感量>1 的城市）；卡片列表 + 地图联动（Sheet 吸附位 High→Split→Map-Full）；详情统一全高 Bottom Sheet；弱网/无地图自动降级为清单视图。
4: 已选篮与 CTA：吸底显示“已选 N | 开始规划”；已选面板支持移除/时段 time_hint/时长 stay_minutes_hint；选中的 L3 自动作为 selected_required 锚点，允许 0 选规划（selected_items 可为空）。
5: 规划：缺参弹参数 Sheet；确认后 POST /plan/generate，selected_items 元素包含 item_id、可选 poi_id/anchor_intent/time_hint/stay_minutes_hint，candidate_items 携带未选 L3，成功后进入日计划页。

### Story 2.1 生成天级骨架（历史已完成基线）
As a planner, I want to generate a day-level timeline with 2-hour/4-hour slots, so that I can quickly structure my day.

Acceptance Criteria
1: 默认 2 小时/4 小时槽位（依据 pace 映射）；selected_required 与 time_hint 优先落位；存在 transport_slot 时，以其为边界对分段分别应用 quota 与候选；启用 AI 预布局时在 quota=ceil(α×S_left) 范围内对“无硬冲突”候选自动落位；selected_items 为空时基于 AnchorPool 生成 Top-N 锚点并仅对“无硬冲突”条目落位；未落位 candidate_items 进入计划“候选”页/抽屉。（v0.5 更新）
2: 空槽弹出大弹窗，含“候选抽屉（按时窗/距离/vibe 重排，含‘未落位’子区）｜AI 建议｜自由活动”。
3: 预布局块标记 origin=ai_seed，提供 5–8 秒撤销与一键重置；硬冲突不落位，软冲突仅提示；生成后可进入编辑环节。（v0.2 更新）
4: 生成 hotel_slot（仅用于展示当晚住宿，不与 24h 时间轴共用）；不纳入 2h/4h 槽编排；酒店信息在结果页可见。（v0.4 更新）
5: 酒店感知软约束：晚段靠近当晚 hotel 的候选优先；早段靠近上一晚 hotel 的候选优先；该偏好仅作为排序加分，不可突破硬约束与 transport_slot 边界。（v0.3 新增）
6: 酒店选择逻辑：当日仅 1 个酒店候选时自动写入 hotel_slot；否则保持空白；当选择/更换酒店时弹窗询问是否重排（仅晚段/整日/取消），确认后执行并生成历史快照；near_hotel 仅在已选酒店时启用。（v0.3 新增）

### Legacy Story 2.2 时间轴编辑、撤销与历史修正（迁移来源）
As a planner, I want to edit timeline items precisely and undo recent changes, so that I can refine my plan without losing control.

> 本 Story 已有在制代码，但其目标能力现归 Epic 3。实施时保留
> `legacy_story_id: 2-2-timeline-editing-undo-and-history`、Git 历史和仍符合新合同的安全实现，
> 不在 Epic 2 继续交付旧 D+/-1、15 分钟吸附或按日“最近操作”语义。

Acceptance Criteria
1: 支持替换、前一天/后一天/其他有效日期、分钟级调时和删除；边界目标正确置灰。
2: 右上全计划控件默认历史图标，变更后显示 `撤销 8`；倒计时后只额外开放最近一条符合条件的撤销。
3: 开始/结束分别显示所属日期，正确处理跨日；不向用户显示 30/60 分钟吸附提示。
4: 相邻通勤由服务端提供且允许未知；不得由前端编造。
5: 所有 mutation 具备 ownership、idempotency、revision 和审计保护；本 Story 不加入 Picker、餐饮、商圈、跨城或清单范围。

### Epic 2 已批准 Story 队列

Epic 2 的当前 Story 2.3-2.15 已在 BMAD
`_bmad-output/planning-artifacts/epics.md` 中按 GWT 形式批准，覆盖旅行时间、班次识别、
逐晚住宿、节奏、Picker/POI、单一 PlanningJob、路线事实、完整初始编排、候选补全、
AnchorPool、日负荷和规划后地点搜索。该文件是 Story 编号与验收标准的权威来源。

## Epic 3 Safe Itinerary Editing

目标：在不丢失当前版本的前提下，支持分钟级时间轴编辑、全计划撤销、候选受控落位、
规划后住宿/行李修改、增量校验与类型化修复，以及需要明确确认的 AI 局部调整。

- 旧 Story 2.2 是首个 Epic 3 Story 的 brownfield 迁移来源，不重写 Git 历史。
- 所有 mutation 必须 owner-scoped、幂等、带 expected revision，并产生不可变审计版本。
- 用户编辑支持每一分钟；AI 内部仍可使用 15 分钟规划精度。
- 跨城/跨 Segment 移动归 Epic 4；细节与导出归 Epic 5；餐饮/清单归 Epic 6。
- 具体 Story 编号、Requirements 和 GWT 验收标准以正在协作生成的 BMAD `epics.md` 为准。

## Epic 4-8 Allocation

- Epic 4：无固定城市数上限的有序 linked trip、同日跨城一日游、交通连接槽、城市可用时间、住宿与行李交接。
- Epic 5：不改排期的 `做什么 / 准备 / 注意`、引用、ResultSheet 轻编辑与导出。
- Epic 6：餐饮固定/选择池/暂不决定、前台定位与商圈召回、购物与返程清单。
- Epic 7：最近行程、账号导出/删除、反馈与可用操作；不提供用户额度面板，Story 7.2 打卡延期。
- Epic 8：Langfuse/promptfoo/Sentry、Provider 路由、集中成本策略与 Post-MVP
  AnchorPool 冷启动搜索。

## Checklist Results Report
（在用户确认输出 PRD 后，执行 pm-checklist 并于此处填入结果报告。）

## Next Steps

### UX Expert Prompt
请基于本 PRD 和 approved Correct Course 输出 S0-S11 移动端信息架构，重点覆盖统一输入队列、旅行时间、住宿、全城检查/选择 L3、规划前确认、单一 AI 规划 shell、瀑布时间轴编辑、增量校验、餐饮/清单、行程细节与导出。

### Architect Prompt
请基于本PRD与现有Node/Fastify服务产出全栈架构（模块化单体 + Postgres/PostGIS/pgvector + COS + 代码编排/worker/必要队列 + SSE），给出统一目录结构、模块边界（Router/Ingest/GeoResolver/Planner/Filler/Export）、API合同、数据模型草案与异步编排/缓存策略，并细化性能/安全/NFR目标与权衡；不将n8n或低代码工具设为依赖。

#### PRD-X04：未编号必须项与本期范围（原文提取）

## MVP Pitfalls & Decisions（必须项）

### 1) 账号与合规（首屏登录影响）
- 登录入口等权（iOS 中国区）：Apple｜手机号｜微信 并列同权同尺寸，且按 Apple｜手机号｜微信 排序；首屏埋点区分入口。
- 账号合并与解绑：手机号登录 + 第三方并存时的合并策略；支持解绑；同一手机号多设备并发登录的踢下线策略。
- App 内账号删除与数据导出：设置页提供“删除账号”“导出数据（JSON/ZIP）”；后台完成对象存储文件清理、埋点匿名化、Langfuse PII 清理。
- 首屏合规：可跳《隐私政策/用户协议》；埋点、U-Link 归因、定位、对象存储使用说明到位。
- 权限弹窗文案：相机/相册/定位/剪贴板（仅用户触发粘贴时读取），不打扰、可解释。
- 风控：默认不打断；命中风控或短信失败重试时触发行为验证；高峰期可远程开关切到“发送前必过”。

Story 7.4 已批准的账号数据副本范围（FR12/NFR7）：用户明确申请后，导出一个包含
UTF-8 JSON、版本化 manifest 和范围说明的 ZIP。包含安全账号资料/偏好、所有当前自有
行程与已保存输入草稿、灵感/导入索引与批注、清单及当前行程文字；联程、一日游、
交通、住宿/早餐/行李及用户覆盖保留完整对应关系。未保存的本地输入不属于已备份数据。
不含历史版本、原图/视频、已生成的行程图片、相册、内部日志/模型原始输入输出/完整证据、
设备轨迹或其他用户数据；凭据、私有原始来源 URL、签名地址与内部额度不得进入副本。
这不是完整数据库备份或恢复导入功能，不改变 Epic 5 行程图片不使用 ZIP 的决定。

副本绑定实际一致性捕获时间与精确版本集合，封存后技术重试使用同一快照；明确重新
生成才获取更新数据。申请幂等、任务可恢复、真实文件完整发布后才可下载；每次读取/
下载校验当前认证、owner、账号资格与有效期，不提供公开分享链接。下载失败重试同一
有效文件；到期仅回收导出副本/临时对象，不删源数据。期限来自实际配置而非原型示例。
退出当前会话不取消已受理任务；账号被禁用/删除时阻止捕获、发布与后续下载。申请、
读取和下载不触发新 AI/高德/XHS 调用，不展示额度，也不承诺浏览器已保存文件。

Story 7.5 已批准的账号删除闭环（FR12/FR18.1/NFR7）：先展示范围，再由真实身份和
最终确认受理；受理前可取消，受理后不可撤销，不设冷静期/恢复账号或强制原因。先导出
仅为可选路径，需副本的用户应先下载；删除受理后停止普通账号访问和所有会话，阻止
导入/规划/细节/导出继续发布或迟到写回，并撤销后续下载，不承诺撤回外部已下载/分享副本。
受理、在线清理完成、已知部分失败和暂时读不到状态必须分开；幂等任务在重启/失联后
继续同一清理，不因失败恢复账号。普通退出登录仍只撤销当前会话，与删除不同。

清理当前及历史自有数据/草稿、灵感/证据/批注、住宿/行李、候选、清单/细节、修改/撤销、
媒体与导出、凭据及旧 BYOK、缓存/临时记录和已部署追踪系统中的可识别数据。先保存
清理所需引用，再执行删除；共享对象按有效引用与权限安全回收，不误删其他用户。
停用后仅提供本次删除的受限状态查询，重试另行核验限定权限，不恢复普通登录。
再次注册必须明确创建新 owner，固定手机号标识、旧会话或备份恢复都不能复活旧数据。

核验后文案为 `账号已删除 / 在线个人数据已清理`；隔离备份与确需保留的最小记录另行
披露用途、范围、期限与权限，未核实的在线清理或未确定保留政策不能宣称全部完成。
备份恢复须重放删除记录再开放服务，回执/删除记录也有最小保留周期；不承诺瞬时擦除
离线设备。以上是产品合同，具体保留政策、真实认证和全链路证据须实施验收，不是
法律完备性结论，也不授权本轮对真实账户执行删除。

### 2) 统一输入与深链
- 冷启动深链/剪贴板携带 XHS 文本或口令：登录后继续原动作（保留场景上下文）。
- 无法判定：底部半高 Sheet 做二选一提示，不遮挡目的地卡/地图抓手。
- 多条链接：识别全部支持链接并创建独立 job；底部输入组件保持可继续输入，前台按 `N/X` 与 FIFO 完成队列展示。
- 粘贴失败兜底：剪贴板权限失败时提供文案与“长按粘贴”手势引导。
- U-Link 归因：渠道、点击ID 进入首次打开/注册事件并绑定到 user_id。

### 2.1) 最近行程与侧边栏（v0.3 新增）
- 首页展示最近一趟行程；`全部` 与菜单打开同一个 owner-scoped 分页列表。按最近一次用户主动打开或成功保存变更排序，未打开时以创建时间兜底；worker/SSE/导出完成不刷新排序，使用服务端时间和稳定 id 消除并列，分页不得重复。
- 真实保存的 S2-S5 输入、规划任务、独立 Plan 与 Trip 统一呈现；发布或加入联程后解析为同一行程入口，其他独立同城旅行不合并。未提交的输入框内容、仅导入笔记不自动成行程；缺失日期不伪造。
- `已生成` 只表示存在当前已发布的基础行程，不能用到达 result_sheet、旅行日期过去或导出成功推导 `已完成`。无已发布行程时区分草稿、运行任务与真实生成失败；细节/冲突继续在既有 S7/S10 中核查。
- 新增城市、修改跨城日期或交通等需要重新编排的操作保留当前行程。仅真实持久变更草稿/任务显示同一项内的附属入口：半途离开为 `有未完成的修改 / 继续填写`，排队或运行为 `修改规划中 / 查看进度`，当前有效任务终止失败才为 `本次修改生成失败 / 查看原因`。旧失败不覆盖新输入，发布或放弃后清理过期入口；普通编辑请求失败、打开/关闭页面或断线不产生虚假草稿/失败。
- `继续填写` 恢复有效输入阶段；`查看进度` 重连已有任务；`继续编辑/继续查看` 恢复 S7/S10、城市或一日游 scope、日期和有效滚动位置。S9/S11 复用原任务的恢复与版本检查，或回 S10；不自动重新完善/导出。恢复信息独立于行程版本，不能重放未确认操作或过期撤销。
- 每次打开先按 owner 和稳定 aggregate id 获取服务端 current revision；Trip 使用完整原子引用集合。过期日期/地点回有效父位置，过期深链不按同名城市猜测；重新登录仅恢复同 owner 数据，账号切换清除私有缓存。
- 加载、空、失败分开呈现，失败不当作空列表；同 owner 缓存摘要可保留但不代表当前版本已验证。读取或位置保存失败不阻塞 Home 输入，无网不承诺离线编辑。无需打卡即可使用最近行程，也不新增旅行自动结束或后台提醒。
- 本期行程单不提供逐槽位打卡，保留紧凑 POI 总览与内容查看。照片解析自动到访标记和相册视频/九宫格/AI 美化导出属于 FR40.1，不影响当前行程长图导出。
- 本期设计重心为初始行程编排与旅中受控重编排：沿用 S7/S8 的显式修改、冲突校验、方案确认及撤销，跨城日期/交通变化走保存草稿与重新发布流程，不以照片/到访记录为前置，也不扩展当前城市 AI scope 或自动跨城重排。

### 3) 灵感入库（XHS）流水线
- 去重：用户记录以 `user_id + normalized_url` 为隐私边界；全局内容指纹只允许复用计算或媒体，不共享用户记录。
- 图片二次存储：COS 直传签名；生成 WebP/AVIF 缩略图；禁止热链。
- 视频处理：短视频（≤30 秒）高频抽帧；长视频低频抽帧；ASR 前先做语音检测，静音/BGM 跳过 ASR。
- 任务健壮性：代码编排/worker与队列保持幂等（idempotency key）、有界指数退避重试、DLQ及持久状态/重启恢复；状态通过SSE回推前端。
- 内容安全：接入腾讯云内容安全基础能力（敏感词/违法图片）以防污染。

### 4) 地理消歧与地图配额
- Top-K 融合：高德检索 + 规则重排（城市命中 > 名称相似 > 地址包含地标 > 连锁分店优先用户常去区域）。
- 入库门槛：POI 必须经过 AMap 验证后才能写入标准 POI，记录标准名、地址、坐标、营业时间、评分、人均、电话等可用字段。
- 开闭店来源：优先高德；无则缓存社区/官网解析（弱一致）。
- 距离矩阵缓存：相同点对同日缓存 24h，避免配额打爆。
- 定位弹窗：模糊词 + 拼音/简称；Top-5 仅展示“名称+地址”，不展示置信度。
- 融合结果：每条推荐保留 source_attribution 与质量等级，方便解释“来自哪条笔记/图片/语音”。

### 5) 规划器（v0.6 current）
- 时间粒度：AI 可按 15 分钟对齐，用户按 1 分钟编辑；开始/结束分别标日期并正确处理跨日，不显示吸附提示。
- 强时间槽：支持 dawn/sunset/night/night-market 等强约束槽，优先于普通候选自动落位。
- 时区：短期以内地为主；后续跨区将 plan 固化 timezone。
- 幂等编辑：插入/替换/移动/删除 API 幂等；全计划 undo_token 提供 8 秒即时撤销和最近一条额外撤销。
- 可行性：输出修复选项（换时/近邻/挪日），不只是报错。
- 模糊 slot 补全：MVP 优先使用 owner 已导入并验证的灵感，再使用 AnchorPool/版本化城市 Top-50 与 AMap 附近搜索；不确定结果进入 S7 候选区而不暂停初始编排，仍不足时保留自由时间。用户可另行粘贴具体小红书链接补充灵感；关键词搜索延期到 Post-MVP。

### 5.1) Linked trip 与交通/酒店（v0.6 current）
- Trip 连接有序单城市 Plan；TransferLeg 独占相邻 segment 的交通交接区间，分段内独立编排。
- 主 segment 的某一天可挂一个 DayExcursion 子 Plan；去程前和返程后仍由宿主 Plan 编排，
  两条交通之间只由目的地子 Plan 编排。界面保留一个宿主日期 Tab，并以
  `前往{城市}`、`{城市}一日游`、`返回{宿主城市}` 和 `已回到{宿主城市}` 显示切换。
- DayExcursion 不创建目的地住宿或行李转移；宿主 Stay/酒店早餐/行李继续生效。
  修改日期或任一交通必须回到一日游草稿并重新联合校验，不能静默移动地点。
- 酒店槽固定在 DayN 末尾，参与早晚半径、换住缓冲与行李约束，但不伪装成普通景点时间点。
- 同城连住（stickiness）：只复用 S3 中用户明确确认的连续 Stay；活动重心偏移可提示用户调整，但不得静默更换酒店或触发自动重排。
- 酒店约束：S3 按住宿晚收集可留空酒店、早餐与行李；到离时间属于 S2。预约/门票和特殊时段由上传证据驱动。

### 6) 计划编辑期的候选与快速搜索
- 顶部 AMap 文本搜索：关键字/类别，Top-5 列表（无地图）；结果以内嵌下拉展示，先加入候选，不在搜索响应中直接修改时间轴。
- 搜索未返回准确地点时，提供 `手动添加`：保存用户输入的目标名称，并由用户另行选择同城、经验证的附近地标。路线和距离只按地标地址/坐标近似计算，界面持续展示 `附近估算`、所用地标和偏差提示。
- 附近地标只是位置代理，不是目标地点事实来源；目标不能继承地标的 CanonicalPOI 身份、精确地址、营业信息、评分、人均、电话或预约状态。未选择地标的目标保持 `待定位`，相邻路线为 unknown。
- Epic 2 的此能力只把结果保存到 `其他候选`，并在地点行标注来源为 `我添加的`；它不改变 Picker intent 或已发布时间轴。直接落位、替换和空闲时段填充属于 S8 的显式版本化命令，必须经过分段边界、校验与全局撤销。
- 重排特征：时间窗贴合 > 距离 > 用户标签（vibe）> 热度；提供 ≤16 字的“为什么推荐”。
- 自由活动：不绑定坐标；相邻通勤保持未知或由服务端按前后地点计算；行程细节完善仅给软建议。
- 冷启动城市：候选 fallback 到“城市热门 UGC”，标注来源。

### 6.1) 住宿选择 Sheet
- 顶部 AMap 文本搜索（Top-5，无地图）；用户选择后写入对应住宿晚的 Stay，始终提供“留空/稍后决定”。
- 已有计划中选择或更换酒店时，先预览受影响的晚间半径、换住缓冲和行李；当前 MVP 不自动重排，后续调整走 S8 类型化方案与全局 undo。

### 7) 行程细节完善（v0.6 current）
- 初始地点与时间由 S6 单一 AI 规划完成；S7/S8 只负责排期编辑、校验和冲突修复，不在时间轴中放置细节完整度卡片或 `完善行程细节` CTA。
- S10 先展示基础行程，并在 `整体核查` 中并列展示 `时间安排` 与 `行程细节`。时间安排复用 current revision 的 ValidationRun；hard conflict 自动出现在编辑态 banner 和 S10 核查行中，阻止进入 S9，但不阻止阅读基础行程。
- 无 hard conflict 时，用户从 S10 的行程细节核查行进入 S9；S9 只为已排槽位补齐「做什么/准备/注意」、why_short 与引用，完成、部分完成、失败或恢复后返回原日期、segment 和滚动上下文的 S10。
- 不改日期/时间/顺序；需要调整时返回 Epic 2 的预览/应用流程。
- 输出规范：做什么（必填≤3行×≤30字/行）｜准备（可选≤3行×≤30字）｜注意（可选≤3行×≤30字）；超长折叠；缺少“做什么”报错并回退；后端硬裁并省略号。
- S10 允许逐条新增、改写或删除内容；只有具体用户行显示 `我的修改`，不标记整个栏目。用户原文、删除抑制和可选栏显式留空具有最高优先级；再次完善不得覆盖或用相同/近似 AI 建议重新引入，AI 只补充剩余容量内的不重复内容。用户行不继承 AI 引用，不提供单槽恢复 AI 方案。
- AI 用量（后台）：平台托管 Provider secrets；按 user_id/device/workspace 限速、计费预算与用量统计；用户只得到真实可用操作与恢复路径，不看到额度信息或内部模型选择。
- 追踪评测：Langfuse 记录 prompt_version、tool I/O 摘要；promptfoo 跑离线小集回归。

### 8) 数据层（Postgres + PostGIS + pgvector）
- 迁移：Drizzle/Prisma Migrate；每次迁移可回滚。
- 地理索引：POI 表 GEOGRAPHY(Point)+GiST；常用（city+半径）建立复合索引。
- 向量：中文向量统一分词/归一；L2/HNSW 索引；维度升级迁移方案。
- 备份恢复：每日全量 + 15 分钟增量（PITR）；演练恢复到新实例。

### 9) 对象存储与成本
- 生命周期：原图 180 天转低频；缩略图长期；僵尸文件清理（库无引用）。
- 安全：CDN 绑定域名；私有读写 + 时效签名 URL；防盗链。
- 批量迁移：重算缩略图/格式升级由应用worker或函数代码分批执行，支持检查点、幂等与失败恢复。

### 10) 观测与质量
- Sentry：前/后端；统一错误码命名（INGEST_xxx/PLAN_xxx/FILL_xxx）。
- 健康检查与告警：代码任务/worker失败、队列堆积、第三方配额与水位进入既有观测；终止事件通知按Story 8.5受控Telegram合同处理。
- 埋点一致性：友盟事件命名与属性字典文档；封装层统一上报。
- 灰度与开关：Provider路由和内部fallback由Story 8.3的应用代码与单一持久配置权威控制，Unleash仅保留普通功能开关；行程细节完善、候选数量与自由活动不得产生第二套用户规划流程。

### 11) 法务与上架
- 第三方 SDK 清单：友盟、U-Link、Authing、极验/腾讯行为验证、高德、COS、Sentry 等。
- iOS 审核：等权 Apple 登录；MVP 不要求填写第三方模型 Key，AI 用量由平台托管，不在应用内暴露额度；操作不可用时提供真实恢复路径。
- 地图版权：高德 Logo/版权信息展示合规。

### 12) 运营与 Backoffice
- 轻量后台：POI 合并/纠错、常用近邻、黑名单、任务重跑。
- 城市聚合：/library/cities 增量更新与重算（SSE 刷新前端卡片数）。
- 人工兜底：低命中地理消歧样本回放，支持别名映射表维护。
- 连锁品牌抑制列表：由Story 1.11交付最小桌面Web维护、草稿/检查/发布、规则版本与审计；按服务端最小权限校验，以幂等/预期版本处理失败和冲突，每个ingest/geo attempt固定首次使用的规则，热更新核验实际加载/使用，不回写已完成导入，不等待后续运营总览。

### 13) VLM 启用与定位降级策略
- 多模态 LLM 默认启用（不再使用 text→OCR→VLM 的分级流水线）；调用受平台并发、预算、重试和熔断策略约束，并保留缓存与失败降级为“仅媒体+待定位”。
- 若多模态抽取仍无法提取 POI 名称，则降级为“待定位”，不阻断规划流程。

## MVP 范围（v0.6 approved Correct Course）

- 包含：统一输入与多链接展示队列、旅行时间/住宿两步确认、Picker
  required/along_route、三档节奏确认、单一可见 AI 完整初始规划、酒店与
  强时间证据约束、分钟级时间轴编辑/全局短撤销、增量校验与修复、候选区、
  餐饮固定锚点/选择池、静态行程清单、ResultSheet 轻编辑、FR44-lite
  文本搜索、导出图片、平台 AI 额度/成本控制，以及 Story 1.3 之后的真实多模态
  入库增强（VAD/ASR、视频抽帧、完整 AMap 事实与证据质量）。
- Linked trip 以 `Trip + ordered single-city Plan + TransferLeg` 分阶段进入
  MVP：支持用户明确确认的有序主城市链、交接日和住宿/行李边界，并支持主城市
  某日通过 `DayExcursion + 往返 TransferLeg` 完成同日跨城往返；复杂跨时区、
  夜间跨日交通、跨夜重复主城市和任意重排延期。
- 商圈附加美食依赖规范化 BusinessArea 与用户导入 POI 查询；旅中定位刷新
  需要独立权限/隐私 story，未交付前使用明确标注的计划位置降级。
- 不包含（Post-MVP）：FR42 自动酒店重排、FR43 任意历史版本时间轴、完整地图
  内嵌搜索、连续后台定位、实时排队/库存、自动返程前 48 小时提醒。
- 不包含（Post-MVP）：同时生成轻松/紧凑双版本、跨旅行长期偏好记忆、自动订票/
  订餐、跨用户可见的共享导入记录，以及未经单独数据生命周期设计的全局媒体去重。

## Risks & Trade‑offs（MVP）

- 体验 vs 复杂度：AI 生成完整初始计划，但所有后续重排必须预览/确认并生成版本，避免静默覆盖用户调优。
- 质量 vs 速度：near_hotel 为软约束，不强行改动用户手动微调；校验（FR9）补足风险提示。
- 搜索 vs 集成：采用文本 Top‑5（FR44‑lite）降低地图集成风险；无准确结果时可用已验证附近地标作路线代理并明确标记近似，弱网有明确提示。

#### PRD-X05：附加边界、后端职责与界面摘要（原文提取）

## 关键边界与降级（v0.2 新增）

- 最小时隙：open_gap_short（<45min）不自动落位。
- AnchorPool 不可用：回退到内置静态 Top-50；记录日志。

## 后端职责（按用户旅程拆分）
- Router（意图识别）：识别 xhs_link | trip_params | unknown；解析自然语言行程 {city, start_date(ISO), days, pace?}，输出结构化 JSON 供前端路由。
- Ingestor（小红书入库，更新）：拉取与解析；默认采用多模态 LLM 图文抽取生成“POI 名称候选 + 作者评价线索（如有）”，输出 evidence 与置信度；触发 GeoResolver 标准化；按阈值高置信入库、低置信“待定位”。
- Ingestor（采集与解析策略补充，更新）：允许通过外部采集服务（如 XHS-Downloader HTTP API）获取作品与媒体 URL（仅走 API，不嵌入其 GPL 代码）；统一走多模态抽取路径；媒体统一二次存储至 COS，禁止热链。
- Library（灵感库）：城市聚合；按 城市/标签/定位状态 过滤列表。
- GeoResolver（地理消歧，更新）：AMap/Places 检索、去重、融合重排；维护 CanonicalPOI；距离矩阵/开闭店时间；当无法确定具体分店时检索≤20 家并按“主 POI 附近 2km”裁剪，仅保留 2km 内分店。
- AnchorPool（离线锚点，v0.2 新增）：周期性产出 city×season×tod×category 的 Top-K；服务 anchors.prepare(city, season, tod) 在线轻量重排并可通过 SSE 推送 anchors_ready；不可用则回退内置 Top-50（记录日志）。
- PlanningInput：管理 S2/S3/S5 的日期、边界、逐晚住宿/行李和 LoadPreference。
- Picker：维护共享 `required/along_route/unselected` 状态与通用 POI 证据信息。
- Planner：一个 planning job 生成完整初始计划并通过 SSE 原位水合时间轴；Quick/seed 只作内部降级，不产生第二个用户完成版本。
- TripCoordinator：维护 Trip/Segment/Transfer/Revision 与交接日一致性。
- Validator/Editor：所有编辑幂等、版本化；生成后及每次相关 mutation 增量校验并输出类型化修复。
- Filler：只丰富已排槽位的说明、引用与质量状态，不安排地点或改变时间顺序。
- Export（导出）：将富行程生成 WebP，兼容失败时降级 JPEG（后续可拓展 PDF/链接）。
- FeedbackLink/FeedbackSubmission（Story 7.6）：生成真实配置且验证过的官方产品目标，按 Web/PWA/已有宿主能力打开；不传 Nomad 登录态，不将打开视为提交。内置有效账号表单提供文字/单张可选私有截图、关闭默认诊断、幂等持久回执和授权维护读取；加入现有导出/删除注册，不自动转发外部或新增 SSO。

## 设计风格（情感与原则）
- 向往 Awe/Wanderlust：大幅、自然光、留白与呼吸感，激发行动。
- 陪伴 Companion：温柔、具体、不过度指挥；信息不过载。
- 可靠 Trust & Doable：清晰时间轴、通勤标注、可撤销，传达“能落地”。
- 秩序中的自由 Frame for Freedom：结构与自由并存（清晰时间轴 + 候选/自由活动）。
- 当下感 Here & Now：快速、克制的微动效，地图卡片实时联动。

## 全局框架与交互（摘要）
- 顶部吸顶分段：旅行规划 | 灵感库；切换保留输入内容与焦点。
- 左上侧边栏：最近行程（草稿/规划中/已生成/生成失败，按真实记录恢复；已生成不代表旅行结束）。
- 底部统一输入：占位文案“粘贴分享链接或输入想去的地点，如：厦门 3天”；空内容显示 `+`，有内容切换发送图标。
- 首页目的地卡：开始规划/查看灵感；不额外提示条。
- Picker：`全城检查 -> 选择 L3`，底部拆分 required/along_route 计数，S4 只显示 `下一步`。
- 规划前确认：三档节奏，唯一 CTA 为 `开始规划`。
- 时间轴：规划进度与完成共享同一路由；日期 Tabs 右侧固定清单入口；分钟级编辑、全局撤销与按需校验。
- 行程单整体核查：S10 同时展示时间安排与细节完整度；无硬冲突时进入 S9 完善，hard conflict 返回 S8 修复。
- 行程细节：S9 预览并应用 `做什么/准备/注意` 与引用，不改变时间顺序；逐条用户修改在再次完善时保持优先。

## 地图-卡片联动（Map-to-Action Bridge，MVP 摘要）
- 同屏完成信息与行动：上地图层（懒加载、cluster、LQIP），下卡片抽屉（Sheet 吸附位：High→Split→Map-Full）。
- 联动规则：卡片滚动高亮对应 Marker；点击 Marker 滚到对应卡片并微放大。
- 行动桥策略：有骨架→“加入 D{n}·{时段}”；无骨架→“加入候选”。
- 叠加层：UGC POI 层、可达圈（10/20/30 分）、热门拍照点热度圈；半径切换 + 类目筛选。
- 手势优先与性能：抓手区、地图优先；地图进入 Split 再加载；骨架屏统一样式。

## 微文案（关键处）
- 统一输入：粘贴分享链接或输入想去的地点，如：厦门 3天
- 全城检查：已选必去 X · 顺路去 Y
- 选择 L3：返回全览
- 规划前确认：开始规划
- 添加成功：已添加 · 撤销
- 冲突提醒：与 14:00 的安排重叠 · 试试 15:00 或缩短 30 分钟
- 规划完成：计划已完成，可直接调整
- 应用完成：已补充行程细节，返回行程单查看

## AI Workflow 编排（概述）
HomeInput/ImportQueue → Time → Accommodation → Picker → PlanningReview →
single PlanningJob → editable Timeline ↔ Validator/Typed Fixes → ResultSheet
↔ Detail Filler → Export。跨城时由 TripCoordinator 在 Time/Accommodation 与
Planner 之间建立主 Segment/Transfer 或 DayExcursion/往返 Transfer 边界；Quick/AnchorPool 仅作为单一 job 的
内部降级和候选来源。

## Note Card/Hero 规格（摘要）
- 笔记卡：4:5 大图+标题+标签；最小点击区 44×44pt；状态 default/pressed/added。
- CTA 一致性：卡片右下固定“加入行程/加入候选”；已加入态按钮与底色轻反馈；长按为加速操作。
- Hero：首屏 1 列 Hero + 下方 2 列瀑布；主 CTA 动词开头；LQIP + 渐进清晰；可达性满足 WCAG AA。

### PRD Completeness Assessment

正式FR/NFR覆盖产品主流程、服务端可靠性和核心范围，最近FR14/FR48/FR39修订均已纳入。
但完整阅读揭示编号清单之外仍有必须项和旧摘要；“64个FR均有引用”不能单独证明全部范围就绪。
本步仅登记待后续覆盖/对齐检查的问题，不静默修改已确认输入或新建功能。

| ID | 初步发现 | 下一步核对方向 |
| --- | --- | --- |
| IR-P01 | 平台段仍写Mobile Only（iOS/Android），而FR13/38/38.1已明确桌面Web运营。 | 区分旅行者与运营者平台；已批准决定足够，不应再要求运营移动适配。 |
| IR-P02 | NFR4/5要求分别设定并监测性能/质量指标，却未给当前目标、工作负载、测量窗口和责任位置。 | 查架构/Story是否补齐；不可拿历史Quick/seed指标代替新流程，也不擅填阈值。 |
| IR-P03 | PRD内嵌Epic1的1.7商圈、1.8多模态摘要与现有恢复入口的新版分工不同；result_sheet术语仍写AI填充后生成。 | 与正式epics/FR37逐项对齐，保留历史不误当执行队列；判断是否纯文档漂移。 |
| IR-P04 | “MVP Pitfalls & Decisions（必须项）”仍要求账号合并/解绑/多设备踢出、腾讯内容安全、POI合并纠错/别名维护、任务重跑等未单独编号能力。 | 对每项查真实Story行为；不能仅以FR14或“Backoffice”一词认定已覆盖，也不能未获范围裁定便新增。 |
| IR-P05 | 数据/运维段另要求每日全量+15分钟PITR恢复演练、原图180天转低频、向量维度升级、迁移可回滚等。 | 查首次消费Story或已有平台交付及可验证责任；明确配置/保留/恢复验收，不冒充已有真实证据。 |
| IR-P06 | Map-to-Action摘要另列10/20/30分钟可达圈、热门拍照热度层、Hero/双列和有计划时直接加入。 | 与批准Picker/候选先存/受控落位路径比对；区分旧探索与当前范围。 |
| IR-P07 | NFR13将抓取相关限流/重试/DLQ/观测笼统交第三方，当前任务健壮性和FR38又要求Nomad保护。 | 检查采集器内部与Nomad任务边界、重试/计费唯一责任，避免重复放大或无人负责。 |
| IR-P08 | FR50仍固定说两个方向，其他段落和已批准调整恢复语义允许无安全方案；单一安全方向未在此摘要交代。 | 核对正式3.5，不为凑两个方案削弱安全约束。 |
| IR-P09 | Monorepo仍“待确认”、数据迁移仍Drizzle/Prisma二选一、细节排期调整仍指Epic2、pm-checklist占位。 | 对照现有仓库/已完成规划判断旧措辞；此类占位不自动成为新审批。 |

明确历史附录中的seed比例、2h/4h、无预算上限、旧打卡/酒店自动选择/历史任意回滚不进入当前MVP。
其他提示弱化方案仍未批准，不纳入本轮PRD的新增验收；FR39直接修订已生效。


## Epic Coverage Validation

完整加载正式epics.md并提取64行FR Coverage Map、59张Story及其Requirements/995组GWT；
比对刚从PRD原文提取的编号全集。以下是规划路径映射，不是运行验收或历史代码全量通过证明。

### Coverage Matrix

| FR编号 | PRD要求 | Epic与Story路径 | 当前状态 |
| --- | --- | --- | --- |
| FR1 | 登录首屏支持手机号+短信登录；如提供第三方登录（Authing/极光一键），iOS 必须等权提供 Apple 登录；按需触发腾讯… | Epic 1；1.1、1.2 | 已映射；沿对应GWT验证 |
| FR2 | 首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片（城市聚合），底部统一输入框可识别小红书链接或行程自然语言。 | Epic 1；1.4、1.6 | 已映射；沿对应GWT验证 |
| FR3 | 统一输入分流 | Epic 1；1.4、1.6 | 已映射；沿对应GWT验证 |
| FR4 | 小红书入库流程（每个 ingest job 处理一条链接） | Epic 1；1.7、1.9–1.11 | 已映射；沿对应GWT验证 |
| FR4.1 | 连锁与分店规则（标准化阶段）（更新） | Epic 1；1.11 | 已映射；沿对应GWT验证 |
| FR5 | 灵感库 | Epic 1；1.8、1.11 | 已映射；沿对应GWT验证 |
| FR6 | 灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子； | Epic 1；1.8、1.9 | 已映射；沿对应GWT验证 |
| FR7 | AI 初始规划 | Epic 2；2.11 | 已映射；沿对应GWT验证 |
| FR8 | 时间轴编辑 | Epic 3；3.1、3.2、4.4、4.7 | 已映射；沿对应GWT验证 |
| FR9 | 增量可行性校验 | Epics 2, 3；2.11、3.1、3.4、4.4 | 已映射；沿对应GWT验证 |
| FR10 | AI 行程细节完善 | Epic 5；5.1–5.3 | 已映射；沿对应GWT验证 |
| FR11 | 导出行程图片（行程卡片）；公开格式默认 WebP，兼容失败时降级 JPEG，产品文案不承诺 PNG。 | Epic 5；5.4、5.5 | 已映射；沿对应GWT验证 |
| FR12 | 设置页 | Epic 7；7.3–7.6 | 已映射；沿对应GWT验证 |
| FR13 | 观测与评测 | Epic 8；8.1、8.2、8.6 | 已映射；沿对应GWT验证 |
| FR14 | 第三方集成（国内可用） | Epics 1, 2, 3, 4, 5, 6, 8；各首次消费切片；8.1–8.6运营扩展 | 已映射；代码编排已更新，未编号内容安全等集成另列缺口 |
| FR15 | 登录等权展示（iOS 中国区） | Epic 1；1.2 | 已映射；沿对应GWT验证 |
| FR16 | 行为验证触发策略 | Epic 1；1.2 | 已映射；沿对应GWT验证 |
| FR17 | 统一输入分流（无法判定） | Epic 1；1.4、1.6 | 已映射；沿对应GWT验证 |
| FR18 | 多条链接粘贴 | Epic 1；1.6 | 已映射；沿对应GWT验证 |
| FR18.1 | 导入记录与去重 | Epics 1, 7；1.8、7.5 | 已映射；沿对应GWT验证 |
| FR19 | 入库进度展示（SSE） | Epic 1；1.7、1.10 | 已映射；沿对应GWT验证 |
| FR20 | 待定位 Top-5 展示 | Epic 1；1.11 | 已映射；沿对应GWT验证 |
| FR21 | 时间轴微调与全局撤销 | Epic 3；3.1、4.4、4.7 | 已映射；沿对应GWT验证 |
| FR22 | 冲突分级与后续动作 | Epic 3；3.1–3.5、5.1、5.4 | 已映射；沿对应GWT验证 |
| FR23 | AI 填充输出规范 | Epic 5；5.1、5.3 | 已映射；沿对应GWT验证 |
| FR24 | 导出图片规格 | Epic 5；5.4、5.5 | 已映射；沿对应GWT验证 |
| FR25 | 操作可用性与恢复 | Epics 5, 7；5.1、5.4、7.3 | 已映射；沿对应GWT验证 |
| FR26 | 规划入口 | Epic 2；2.3、2.7 | 已映射；沿对应GWT验证 |
| FR27 | Planner Picker 路由与参数 | Epic 2；2.3、2.7 | 已映射；沿对应GWT验证 |
| FR27.1 | 规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用… | Epic 2；2.3–2.5、4.1、4.2 | 已映射；沿对应GWT验证 |
| FR28 | S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐 | Epic 2；2.6、2.11、2.14 | 已映射；沿对应GWT验证 |
| FR28.1 | 玩法与兴趣信号 | Epics 1, 2；1.9、2.6、2.11 | 已映射；沿对应GWT验证 |
| FR29 | Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用… | Epic 2；2.7、2.8 | 已映射；沿对应GWT验证 |
| FR30 | L3 行右侧提供互斥图标意图 | Epic 2；2.7 | 已映射；沿对应GWT验证 |
| FR31 | Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略… | Epic 2；2.7、2.8、4.1、4.5 | 已映射；沿对应GWT验证 |
| FR32 | 单一可见 AI 规划 | Epic 2；2.9、2.11、4.3 | 已映射；沿对应GWT验证 |
| FR32.1 | 内部快速降级 | Epic 2；2.9 | 已映射；沿对应GWT验证 |
| FR32.2 | 高质量编排 | Epic 2；2.9 | 已映射；沿对应GWT验证 |
| FR32.3 | 候选与模糊补全 | Epic 2；2.11–2.13、2.15、3.2 | 已映射；候选intent/来源在2.11/3.2已定义，inventory仍是旧摘要 |
| FR33 | 规划任务可控性 | Epics 2, 8；2.9–2.12、8.3–8.5 | 已映射；沿对应GWT验证 |
| FR34 | AnchorPool（离线锚点） | Epic 2；2.11–2.13 | 已映射；沿对应GWT验证 |
| FR34.1 | 平台 AnchorPool 主动冷启动（Post-MVP） | Epic 8；延期：8.7、8.8预留 | 明确延期；不计MVP分母 |
| FR35 | Linked multi-city（MVP 分阶段交付） | Epic 4；4.1–4.4 | 已映射；沿对应GWT验证 |
| FR35.1 | 跨城一日游（MVP 受限 A-B-A） | Epic 4；4.5–4.7 | 已映射；4.5–4.7及CE-02补充覆盖，一日游GWT未缺 |
| FR36 | 酒店槽与餐饮处理 | Epics 2, 3, 6；2.5、2.11、3.3、6.1 | 已映射；沿对应GWT验证 |
| FR36.2 | 餐饮选择池与商圈召回 | Epic 6；6.1–6.3 | 已映射；沿对应GWT验证 |
| FR36.1 | 酒店感知的编排偏好（v0.3 新增） | Epic 2；2.11、4.3 | 已映射；沿对应GWT验证 |
| FR37 | 结果页（行程单）（MVP 轻编辑） | Epic 5；5.2、5.3 | 已映射；沿对应GWT验证 |
| FR38 | 平台 AI 额度与成本控制策略 | Epics 5, 7, 8；各首次付费消费切片；8.4集中治理 | 已映射；沿对应GWT验证 |
| FR38.1 | Provider 额度与不可恢复异常告警 | Epic 8；8.5、8.6 | 已映射；沿对应GWT验证 |
| FR39 | AI 事实引用与幻觉约束（v0.3 新增） | Epic 5；5.1–5.3 | 已映射；5.1/5.2已同步“建议核对” |
| FR40 | 计划延续与状态 | Epic 7；7.1 | 已映射；沿对应GWT验证 |
| FR40.1 | 照片驱动的到访标记与旅行影像（Post-MVP，方向已确认、待设计） | Post-MVP, deferred；延期：7.2及后续照片设计 | 明确延期；不计MVP分母 |
| FR41 | 酒店选择优先 | Epic 2；2.5、2.11、3.3 | 已映射；沿对应GWT验证 |
| FR42 | 酒店更改与重排确认（Post-MVP，暂不在本版范围） | Post-MVP；Post-MVP | 明确延期；不计MVP分母 |
| FR43 | 历史步骤管理（Post-MVP，暂不在本版范围） | Post-MVP；Post-MVP | 明确延期；不计MVP分母 |
| FR44-lite | 文本快速搜索（MVP） | Epics 2, 3；2.5、2.15、3.2、3.3 | 已映射；沿对应GWT验证 |
| FR45 | 用户反馈（兔小巢集成，MVP） | Epic 7；7.6 | 已映射；沿对应GWT验证 |
| FR46 | 行程清单 | Epic 6; advanced shopping and checklist-to-schedule deferred；6.4、6.5；高级扩展延期 | 已映射；沿对应GWT验证 |
| FR47 | 商圈归属 | Epic 6；6.3 | 已映射；沿对应GWT验证 |
| FR48 | 旅中定位降级 | Epic 6；6.2 | 已映射；6.2已同步App打开单次刷新与有效历史授权 |
| FR49 | 阶段与转场 | Epics 2, 3, 4, 5, 6, 7；2.3–2.9、3–7各对应入口 | 已映射；4.5–4.7已分流，inventory仍少一日游路径 |
| FR50 | 对话式局部调整 | Epics 3, 4；3.5、4.1、4.4、4.7 | 已映射；3.5允许2/1/0安全方向、4.7覆盖child，FR/UX摘要需同步 |
| FR51 | 跨日负荷与天气上下文 | Epics 2, 3, 4；2.14、3.4、3.5、4.3、4.4、4.6、4.7 | 已映射；沿对应GWT验证 |

### Missing Requirements

- 正式64个FR均在Epic覆盖表中找到，没有无编号来源的额外FR，也没有遗漏的MVP FR编号。
- 60个MVP FR有可追踪路径，4个明确延期；AR16和7.2不因范围缩写重新进入MVP。
- 这不是“全部产品要求已100%具备交付合同”：PRD-X04/X05中的未编号必须项仍缺交付归属。

| 缺口ID | PRD原文位置/要求 | 覆盖核对 | 影响与建议责任 |
| --- | --- | --- | --- |
| IR-G01 | 账号与合规：账号合并、解绑、多设备并发登录踢下线策略 | 当前1.1/1.2只保留历史登录/会话基线；7.3没有身份管理，7.5做删除不是绑定/合并。没有找到这些操作的独立验收。 | 高：身份/数据归属不能通过厂商名带过。PM确认是否仍属MVP；若保留，由账号首次交付切片明确身份、冲突、撤权及迁移范围。 |
| IR-G02 | 入库流水线：接入腾讯云内容安全（敏感词/违法图片） | 1.9/1.10有媒体/schema/来源与隐私检查，但未找到该集成、审核结果及服务不可用行为。 | 高：PRD“必须项”未分配。确认保留或明确延期；保留则进入入库首次消费合同，不能用普通schema校验替代。 |
| IR-G03 | 运营：POI合并/纠错、常用近邻、黑名单、任务重跑、别名映射维护 | 1.11已闭合的是品牌抑制规则；8.3–8.6分别做路由/预算/通知/只读总览，没有通用POI治理或任意重跑。 | 高：旧宽后台摘要不能扩成隐含新平台。逐项保留/延期，保留项需独立可验证归属，不让8.6成为可写总后台。 |
| IR-G04 | 数据/存储：每日全量+15分钟PITR及新实例恢复、原图180天转低频、向量维度升级、每次迁移可回滚 | 7.5覆盖删除记录恢复抑制，但未覆盖指定PITR频率/存储转层/向量升级；各Story的Prisma迁移检查不等于每次迁移可逆承诺。 | 高：明确基础设施责任和当前有效恢复/保留合同，给首次相关Story验收入口。运行证据可随实施交付，但规划责任不能空缺。 |
| IR-G05 | Map-to-Action/Hero摘要：10/20/30分钟可达圈、拍照热度层、Hero+双列、已有计划直接加入 | 当前2.7/2.8地图联动和2.15/3.2候选路径不等于这些新层/快捷mutation；摘要与现行单列/候选先存也可能冲突。 | 中高：由已批准UX确认哪些仅为旧探索；不未经裁定增加地图查询/直接写入或恢复旧布局。 |

### Requirement Inventory Drift

PRD与epics的FR正文只有5项不完全相同：FR32.3、FR34.1、FR35.1、FR49、FR50。
FR34.1是已延期条目的缩写，FR35.1主要为摘要精简；没有据此新增MVP缺口。FR32.3的
intent/来源分组、FR49的一日游转场、FR50的host/child范围在正式Story中已有当前行为，
但inventory旧摘要容易误导后续任务，建议同步源语义。FR50及UX-DR24仍固定两个方向，
而3.5明确只有一个安全方向就只展示一个，无安全方向进入恢复；这是可依已有批准修正的漂移。

### Coverage Statistics

- Total PRD FRs: **64**。
- MVP FRs with an identified epic/story path: **60/60（100%编号映射）**。
- Explicitly deferred: **4**；不把延期当已实现。
- Missing numbered FRs: **0**；unnumbered requirement groups needing scope/ownership resolution: **5**。
- Stories: **59**，其中7历史、52当前目标；GWT: **995**。

编号覆盖的100%不抵消IR-G01–G05，也不证明历史认证/平台集成已经满足新生产范围。


## UX Alignment Assessment

### UX Document Status

**Found。** 使用已确认的`ux.md`及四份当前源文档，配合v0.6架构包和原型覆盖注册。
`ux-prompt-strength-audit-2026-09-14.md`是本轮变更/建议记录，不替换正式UX规范。

| 检查领域 | UX ↔ PRD ↔ 架构核对 | 结论 |
| --- | --- | --- |
| S0–S7输入/规划 | Home Dock、两步输入、Picker单一状态、S5唯一开始、S6/S7同shell，与frontend/backend/planner-v2一致。 | 主旅程对齐；旧PRD地图行动桥摘要另列漂移。 |
| S8人控编辑 | 分钟值、owner/revision/idempotency、增量校验、FixSheet、全局undo对应明确API/服务状态。 | 对齐；hard与soft展示仍按当前正式合同，未批准弱化提案不代入。 |
| Trip与DayExcursion | 独立Plan、当前host/child scope、双程事实、原子发布及交接日渲染在前后端和数据模型都有责任。 | 对齐；FR49/50库存摘要需补齐现有一日游语义。 |
| S9/S10详情与引用 | 基础行程优先，Filler不改排期；当前内容/引用鉴权与用户行覆盖受控。 | FR39“建议核对”已同步，缺安全内容仍真实不可用；S9视觉未齐单独跟踪。 |
| S11图片与浏览器交付 | revision/manifest/城市边界/编码预算、WebP/JPEG、普通下载未知与明确重试都有合同。 | 已指定“已开始下载，请确认”一致；新文案及真实保存能力待实施证据，不宣称旧PNG已验证。 |
| FR48App打开刷新 | UX、frontend/backend/API目标均包含有效历史/本次权限、前台事件去重、短时只读候选、草稿保护及迟到响应失效。 | 本轮新增触发已对齐；旧图只作基础布局。 |
| 账号/反馈 | 数据副本、账号清理、受限回执、真实反馈保存和上传置灰/无忙碌底部操作有对应服务/状态。 | 当前7.3–7.6一致；PRD额外合并/解绑另属IR-G01，不能算在现有设置中。 |
| 桌面运营 | FR13/38/38.1、8.3–8.6、frontend Operator Surface明确桌面Web；平台/账本/投递权威分开。 | 已批准运营边界一致；PRD全局Mobile Only及UX元信息须澄清旅行者/运营者。 |
| 无障碍/响应 | 44pt、语义状态、焦点/返回、对比度、120–200ms、虚拟列表/地图懒加载和降级有架构支撑。 | 规划支持存在；真实设备性能/截图仍是各Story实施验收。 |

### Alignment Issues

- **IR-U01（高，文档漂移）**：PRD平台段“Mobile Only”与桌面运营明确合同不一致；架构已写
  traveler mobile-first Web/PWA today。应标明旅行者当前Web/PWA、运营桌面Web，以及原生SDK/
  宿主仅在真实存在时适用。已有批准足够确认运营不做移动适配，不新增原生应用工作。
- **IR-U02（高，已有批准可修正）**：FR50、UX-DR24和rest-api摘要固定“两条方向”，3.5与
  tech-spec3已是通常两条、单条安全只给一条、无安全则恢复。后续不得为凑数生成不安全方案。
- **IR-U03（中高，范围未对齐）**：PRD Map-to-Action/Hero仍含可达圈/热度层/双列及直接加入，
  当前UX明确避免营销Hero，候选先存再受控落位。与IR-G05合并处理，不重复计问题。
- **IR-U04（中，测量合同未落定）**：架构tech-stack已把真实P50/P95目标的建立交给8.1，
  不是完全无人负责；但新工作负载/窗口/基准/目标及NFR5质量阈值仍待建立。应在SP明确早期
  Story如何采集基线、8.1/8.2何时定版及发布前如何判定，不能靠旧root架构数字过门禁。

### Warnings

原型登记仍有明确未完成状态：S9运行/断线/partial/失败/stale、单晚住宿影响、复杂候选/
多冲突/天气、品牌规则新桌面维护、预算金额来源细项、FR48App打开及下载未知分支等。
这些是已有Story的视觉/实测检查点，不是本轮新加功能，也不把所有图片缺口提升为全项目
开工前阻断。尤其5.1已明确UI实现前需连贯原型批准，应保留在该Story开始前的队列约束。
7.2与照片记忆等延期图片不计本期缺口。现有PNG未重绘或逐像素复核，本报告不冒充视觉验收。


## Epic Quality Review

### Epic Structure and Independence

| Epic | 可交付价值 | 独立性/依赖检查 | 实体与验收 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | 安全登录、可信灵感/导入恢复 | 历史1.1–1.5与新增1.6–1.11分开；品牌规则无需8.3/8.6。 | 记录/SSE/媒体/规则随消费引入。 | 领域拆分合理；生产认证基线需补实施归属，PRD宽后台/审核另列缺口。 |
| 2 | 输入、选点到一个完整单城计划 | 最小安全/路由/Top-50随首次消费；不等Epic8或未来typed FixSheet。 | Draft/Stay/Job/Route/Candidate/Load随对应Story出现。 | 主链可用；2.13分桶能力不回溯成为2.11/2.12前置。 |
| 3 | 人控编辑、撤销和安全局部调整 | 使用Epic1/2；3.1–3.3可先手工/撤销，3.4才扩类型化修复。 | 复用旧2.2版本/事件基础，新增归当前消费。 | 不以先建全库组织；复杂3.5需SP估算，既有安全方向例外不能丢。 |
| 4 | 完整城市联程及同日往返 | 4.3先发布/读取并禁止未实现的独立子Plan推进；4.4补安全编辑；4.6先一日游发布，4.7补编辑。 | 主/子Plan和交通/住宿/行李通过一次原子引用集合。 | 后续引用是禁用边界而非提前可用承诺。 |
| 5 | 可读细节、受保护引用与图片 | 5.4提供自身城市文件下载，不等5.5或细节完成；5.1有保护路由，但S10返回闭环需明确。 | Fill/Detail/Override/Export按各片引入。 | IR-Q02跟踪5.1最小UI闭环，不能把5.2未来完整S10当已有实现。 |
| 6 | 餐饮选择、定位/商圈推荐和清单 | 6.1静态可用，6.2动态刷新；6.4普通记录不等6.5；均不等延期打卡。 | Meal/BusinessArea/Checklist只在需要时创建。 | 主链合理；FR48新触发仍只读，不加后续依赖。 |
| 7 | 最近行程、账号数据与可靠反馈 | 7.4/7.5先处理已交付数据，7.6首次加入时扩注册；无未来表前置。 | 每片有独立任务/回执与恢复；历史认证问题不能拖到删除时才承认。 | 当前功能分工合理；与PRD额外身份管理区分。 |
| 8 | 运营者排障、评测与安全控制 | 运营者也是明确用户；8.1–8.5各自可用，8.6只读汇总；早期最小保护不得等8.x。 | 单一业务/路由/预算/通知权威，按任务引入。 | 不是纯基础设施Epic；实测/连接/目标仍在各Story交付门槛。 |

### Story Structure and Sizing

所有59张Story均有As a/I want/So that、Requirements、Acceptance Criteria，Given/When/Then
计数平衡；7张历史不当新版范围交付。995组验收包含权限/版本/错误/恢复，结构检查无缺失。
场景数量不是工时，不能据此自动合并或拆掉已批准能力。以下当前Story应在SP/CS细化任务、
迁移顺序、独立可验证交付块和工作量：3.5（25）、4.3（24）、4.6（24）、4.7（28）、
5.4（27）、8.2（24）、8.3（24）、8.4（26）、8.5（24）。不保证一次会话可完成。

| Story | GWT | 结构核对 | 交付定位 |
| --- | ---: | --- | --- |
| 1.1 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 1.2 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 1.3 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 1.4 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 1.5 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 1.6 | 9 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 1.7 | 10 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 1.8 | 11 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 1.9 | 11 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 1.10 | 12 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 1.11 | 15 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.0 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 2.1 | 2 | 角色/价值/Requirements/GWT齐全 | 历史基线，保留 |
| 2.3 | 11 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.4 | 14 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.5 | 15 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.6 | 13 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.7 | 17 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.8 | 12 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.9 | 16 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.10 | 16 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.11 | 21 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.12 | 19 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.13 | 16 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.14 | 13 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 2.15 | 14 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 3.1 | 18 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 3.2 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 3.3 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 3.4 | 23 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 3.5 | 25 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 4.1 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 4.2 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 4.3 | 24 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 4.4 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 4.5 | 19 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 4.6 | 24 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 4.7 | 28 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 5.1 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 5.2 | 23 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 5.3 | 19 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 5.4 | 27 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 5.5 | 21 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 6.1 | 21 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 6.2 | 21 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 6.3 | 21 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 6.4 | 23 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 6.5 | 15 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 7.1 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 7.3 | 14 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 7.4 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 7.5 | 22 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 7.6 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 8.1 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |
| 8.2 | 24 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 8.3 | 24 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 8.4 | 26 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 8.5 | 24 | 角色/价值/Requirements/GWT齐全 | 当前目标；较复杂，SP细化 |
| 8.6 | 20 | 角色/价值/Requirements/GWT齐全 | 当前目标；按消费引入 |

### Forward References and Entity Timing

显式Story后向编号扫描命中12张：1.11的跨Epic编号说明，3.1/3.2/3.3对未来FixSheet的排除，
4.3/4.6未交付mutation禁用，5.2/5.4导出能力边界，6.1静态与6.2动态分离，6.2/7.1打卡
延期，6.4不依赖购物扩展。它们不能因出现更大编号就被判循环依赖；具体正文已注明先可用路径。
同一核心文件在计划、编辑、Trip封装和餐饮扩展中被反复修改，有不同用户反馈/事务/回归边界，
不为减少文件触碰而合并为一个巨大Epic。没有找到一次提前创建所有未来实体的Story。

### Brownfield and Implementation Prerequisites

- 这是现有Node/Fastify/React/Prisma工程，不要求重新克隆starter、另建框架或重新搭全套CI。
- 旧2.2继续保留`codex/story-2-2-timeline-editing`与
  `baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c`；3.1必须使用
  `legacy_story_id: 2-2-timeline-editing-undo-and-history`，由SP生成唯一迁移任务身份。
  不能把新3.1与旧2.2当两张并行编辑Story，也不能重置历史done状态。
- 图文/视频、AMap、班次、天气、模型、COS、PG、Sentry/Langfuse/Telegram仍需实际服务证据。
  相应适配器/人工降级/验收责任已有所属Story；本轮不自行采购或访问生产验证。

### Specific Quality Findings

**IR-Q01（高）：生产身份基线没有可据以直接继续的已交付证据。** 当前只读核对发现
`apps/server/src/plugins/auth.ts`在无sid时接受`x-user-id`；`auth/session-store.ts`使用
内存Map、默认测试OTP及手机号派生owner。历史1.1的Dev Notes也明确生产短信/OAuth/
腾讯行为验证/持久会话未完成。7.5虽要求真实身份并拒绝stub，但不能把生产认证责任只放到
账号删除之后；SP应明确首个真实用户/受保护数据交付前的认证补齐归属与验收。此项说明
当前仓库基线限制，不声称已测试线上漏洞，不修改实现或抹掉旧Story已完成的真实范围。

**IR-Q02（中高）：5.1独立UI闭环需明确最小范围。** 它有受保护S9路由/恢复入口，不能简单
判为完全依赖5.2；但正常产品回环要求S10→S9→同上下文S10，而完整S10由5.2交付。
当前`apps/mobile/src`没有可确认的ResultSheet/S10实现，不能仅用未来图片作为已有入口证明。
在5.1的CS中明确可达入口、返回父上下文和最小页面责任，或经范围调整重排最小S10交付，
保持最终S7/S8不加细节卡、S10基础阅读优先的合同；未闭合前不宣称5.1全部UI验收可独立通过。

**格式/索引漂移（中）**：PRD旧Story摘要、FR库存/方向数量、架构索引“CE仍在进行”、
compatibility的BusinessArea旧归属等需同步，不能把历史报告状态作为当前就绪结论。
这些能依已有明确批准修正的内容不需要重新做产品取舍；未编号必须项则仍需范围/责任裁定。

本步没有发现需要推翻8个用户价值Epic、重建数据库或重置历史Sprint的依据。
当前有范围/责任与独立闭环问题，不能凭格式完整把整体判READY。


## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK（需要补齐后再进入实施）。IR工作流六步已完成；不是IR已通过。**

PRD已完整提取64个FR与24个NFR；60个MVP FR均有编号映射，4个明确延期。正式Story保持
59张/995组GWT，主旅程与核心架构基本对齐。新FR14/48/39微调没有引入新的未闭合冲突。
但PRD编号之外的必须项、历史认证基线、旧摘要和局部实施前置仍未全部闭合。

### Critical Issues Requiring Immediate Action

本报告将前述交叉引用去重为**9项、4类**；6项高优先级、3项中优先级。没有把每个原型缺图、
每个外部接口尚未部署或每个重复文档提及都另计成一个阻断项。

| ID | 类别 / 优先级 | 问题与证据 | 具体下一动作 / 责任 | 关闭条件 |
| --- | --- | --- | --- | --- |
| IR-01 | 范围归属 / 高 | PRD必须项要求账号合并、解绑、并发登录踢出；现有1.1/1.2/7.3/7.5不构成完整合同（IR-G01）。 | PM裁定保留/延期；若保留，账号首次交付责任需明确。 | PRD范围、Story操作/数据归属/失败验收一致，不能以OAuth库存在当已交付。 |
| IR-02 | 范围归属 / 高 | 腾讯内容安全接入未找到对应审核/不可用验收（IR-G02）。 | PM确认是否仍本期；保留则入库Story明确消费、结果和故障边界。 | 有具体交付路径或明确延期，普通schema校验不冒充审核。 |
| IR-03 | 范围归属 / 高 | 宽泛POI治理、别名/近邻/黑名单及任意任务重跑未分配；1.11只闭合品牌规则（IR-G03）。 | PM逐项划定范围，避免扩成新的通用后台。 | 当前PRD不再保留无主必须项；保留项有最小受控操作闭环。 |
| IR-04 | 范围归属 / 高 | PITR频率/恢复演练、原图转低频、向量升级和迁移可逆承诺缺明确消费/验收责任（IR-G04）。 | 架构/运维明确现行策略与首个相关Story，不擅填保留期限或承诺所有迁移天然可逆。 | 定义责任、配置、恢复/保留验证点；真实证据按已授权实施阶段提供。 |
| IR-05 | 范围归属 / 中 | 地图可达圈、热度层、Hero/双列/直接加入旧摘要与批准UX及候选先存不一致（IR-G05/U03）。 | 依据既有UX清理已被替代项；未有明确裁定的地图能力由PM决定范围。 | 不未经批准新增地图查询/布局/写入；PRD与UX同义。 |
| IR-06 | 实施基线 / 高 | 当前认证仍有开发身份头、内存会话和测试OTP；历史1.1明确不代表真实认证完成（IR-Q01）。 | 在首个生产用户/受保护数据交付前明确认证补齐的执行归属；保留旧完成历史。 | 计划明确真实身份/会话/撤权验证，测试身份只允许明确测试环境；不得等到7.5才发现前置。 |
| IR-07 | 文档漂移 / 高 | Mobile Only、旧1.7/1.8分工、FR库存的候选/一日游/方向例外、result_sheet术语、Monorepo待定等存在旧摘要（IR-P03/P09/U01/U02）。 | 按已有批准修正源与同步包；不重新要求批准桌面运营或一条安全方向。 | 各摘要和正式Story同义，历史块明确标记；刷新输入后定向复验。 |
| IR-08 | 实施前置 / 中 | NFR4/5真实目标尚未定版；8.1已有性能责任，但工作负载/窗口/目标决定点尚需明确（IR-U04）。 | SP写明早期基线采集、8.1/8.2定版与发布检查责任；不要继承旧Quick指标。 | 有版本化测量/验收计划与目标定版时点，不用平均质量掩盖明确规则。 |
| IR-09 | 实施前置 / 中 | 5.1有S9独立入口，但S10回环/最小返回页面责任与后续5.2仍需明确（IR-Q02）。 | 在5.1开始前明确最小可达UI与返回合同，必要时调整最小S10切片执行顺序。 | 不靠未来页面或合成图证明独立闭环；保持最终S10→S9→原S10与不在S7/S8加细节卡。 |

### Recommended Next Steps

1. **先处理范围与历史基线。** 将IR-01–IR-05的未编号必须项逐项保留/延期/指向已有明确批准；
   将IR-06生产认证补齐安排到首次实际消费前。此处不自动新建Story或变更账号/后台范围。
2. **修正文档漂移。** IR-07大部分已有批准依据，直接同步即可，无需重新讨论已定产品选择。
   保留原报告/旧Sprint历史；报告的“NEEDS WORK”不能通过只改状态关闭。
3. **补实施责任。** 为IR-08指标和IR-09最小页面闭环记录负责Story、开始前条件与验收点；
   原型缺口、班次/天气Provider、真实服务/PG/浏览器证据继续随各自Story交付，不新增全项目
   图片审批或采购门槛。
4. **定向复验后再SP。** 对更新后的PRD/架构/UX/Epics重做受影响覆盖与一致性，关闭高优先级
   未分配项，再由SP生成新队列。旧2.2→3.1保留`legacy_story_id`、baseline_commit和Git历史。

### Validation and Limits

本次是只读规划评估加报告/交接更新。四份输入和源产品合同、正式GWT、旧Sprint、实施Story、
业务代码/API/Prisma、既有PNG均未由本轮改动。没有运行模型、真实定位、登录Provider、
Telegram、数据库迁移、浏览器保存或生产测试。编号/格式/来源对应核验与handoff、diff检查
不能替代上述实施证据。其余提示弱化方案仍是提案，文件集合确认并非对它们的整体批准。

### Final Note

评估日期：2026-09-14；评估者：Codex（BMAD Implementation Readiness）。
本次识别9项去重问题，分为范围归属、实施基线、文档漂移、实施前置4类。已完成评估工作，
尚未达到直接进入实施的条件；不改写CE当时的完成事实，也不宣称新的IR通过或SP已运行。

### Assessed Input Fingerprints

| 输入 | SHA-256 |
| --- | --- |
| `_bmad-output/planning-artifacts/prd.md` | `a117c40ec299bbb812771dc84dab001c5f09fa129b3f86e015ec618073968df4` |
| `_bmad-output/planning-artifacts/architecture.md` | `05d124f2be66a61fd399f5f55004caca4ca0c566aa559fa5240649d5553bf660` |
| `_bmad-output/planning-artifacts/epics.md` | `117a69aad6f3aec6eba2654d0502371c7d2260c4b9df6f4f7f25df6d217c4a9b` |
| `_bmad-output/planning-artifacts/ux.md` | `2e0211c1193cff7241750658168724f90cbf2902a4704c06d355ed79f61199a5` |
