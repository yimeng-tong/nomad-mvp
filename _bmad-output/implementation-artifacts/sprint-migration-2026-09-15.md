---
project: nomad-mvp
date: 2026-09-15
workflow: bmad-sprint-planning
status: completed
implementation_started: false
---

# Sprint Planning 与新旧身份迁移

本轮完成已批准规划的执行跟踪。唯一清单为正式 `epics.md`；未重开CE/IR或18组呈现决策。
当前状态见 [sprint-status.yaml](sprint-status.yaml)，恢复入口见 [CURRENT.md](../../CURRENT.md)。
原Sprint及范围说明先留档，见 [历史范围](archive/sprint-planning-2026-09-15/scope.md) 与同目录字节指纹清单。
机器可读的完整身份、条件、责任人与默认准备顺序见 [迁移清单](sprint-migration-2026-09-15.yaml)。

## 当前状态

- 8个Epic、60张Story：7张历史done、1张继承在制但暂停、52张backlog；无ready-for-dev。
- Epic1/2/3为in-progress，其余5个为backlog；这表示已有交付/在制事实，不表示本轮开始业务开发。
- 8个回顾入口：Epic1保留done，其证据仅覆盖历史1.1–1.5；扩围后1.0/1.6–1.11仍需回顾。其余7个optional。
- 1018组GWT、65FR（61MVP/4延期）、24NFR；七项工程条件不增加Story数量。
- 首个新增准备为 **1.0 生产登录与多设备会话补齐**，key为 `1-0-production-login-and-multi-device-sessions`，当前backlog且没有新实施文件。
- 默认准备顺序按正式清单，跳过历史done；不虚构工期、容量或承诺53张目标在同一个短Sprint完成。

## 旧队列迁移

旧编号相同不代表范围相同。下表仅七张历史和旧2.2继承状态，其余六张旧backlog经当前合同重新拆分，不升级ready。

| 旧key | 当前key / 延期去向 | 状态处理 |
| --- | --- | --- |
| `1-1-login-session-and-compliance-contract` | `1-1-login-session-and-compliance-contract` | preserved-historical；原done |
| `1-2-mobile-login-first-screen` | `1-2-mobile-login-first-screen` | preserved-historical；原done |
| `1-3-single-xhs-ingest-with-sse-progress` | `1-3-single-xhs-ingest-with-sse-progress` | preserved-historical；原done |
| `1-4-home-unified-input-and-inspiration-library` | `1-4-home-unified-input-and-inspiration-library` | preserved-historical；原done |
| `1-5-settings-feedback-and-account-entry-points` | `1-5-settings-feedback-and-account-entry-points` | preserved-historical；原done |
| `2-0-confirm-and-planner-picker` | `2-0-confirm-and-planner-picker` | preserved-historical；原done |
| `2-1-generate-day-skeleton-with-quick-and-hq-planning` | `2-1-generate-day-skeleton-with-quick-and-hq-planning` | preserved-historical；原done |
| `2-2-timeline-editing-undo-and-history` | `3-1-minute-timeline-editing-and-plan-wide-undo` | migrated-in-progress；原in-progress |
| `2-3-feasibility-validation-and-one-click-fixes` | `3-4-incremental-validation-and-typed-conflict-fixes` | superseded-scope；原backlog |
| `2-4-export-itinerary-png` | `5-4-revision-bound-export-generation-and-preview`, `5-5-whole-trip-image-download-and-system-sharing` | superseded-scope；原backlog |
| `3-1-one-shot-ai-fill-result-sheet-and-citations` | `5-1-revision-bound-ai-detail-enrichment`, `5-2-verifiable-result-sheet-and-citation-reading`, `5-3-line-level-detail-editing-and-ai-preservation` | superseded-scope；原backlog |
| `3-2-observability-evaluation-and-provider-routing` | `8-1-cross-flow-observability-and-fault-localization`, `8-2-reproducible-quality-regression-and-version-comparison`, `8-3-task-level-provider-routing-and-safe-release`, `8-4-platform-budget-and-usage-policy-management`, `8-5-terminal-ai-amap-incidents-and-telegram-alerts`, `8-6-operations-overview-and-read-only-diagnostics`；延期 8.7, 8.8 | superseded-scope；原backlog |
| `3-3-account-privacy-quota-and-compliance-controls` | `1-0-production-login-and-multi-device-sessions`, `7-3-settings-account-and-available-actions`, `7-4-account-data-copy-export`, `7-5-account-deletion-and-cleanup-results`, `7-6-feedback-entry-and-reliable-submission`, `8-4-platform-budget-and-usage-policy-management` | superseded-scope；原backlog |
| `3-4-recent-trips-and-check-in-state` | `7-1-recent-trips-and-context-resume`；延期 7.2 | superseded-scope；原backlog |

## 全部正式Story的稳定key

中文标题按已批准合同原样保留，英文slug固定，不根据以后改标题重新生成。历史key保持不变。

| ID | 当前key | 中文标题 | GWT | SP后状态 |
| --- | --- | --- | ---: | --- |
| 1.0 | `1-0-production-login-and-multi-device-sessions` | 生产登录与多设备会话补齐 | 14 | backlog |
| 1.1 | `1-1-login-session-and-compliance-contract` | 登录会话与账号边界（历史已交付） | 2 | done |
| 1.2 | `1-2-mobile-login-first-screen` | 移动登录首屏（历史已交付） | 2 | done |
| 1.3 | `1-3-single-xhs-ingest-with-sse-progress` | 单链接异步导入基线（历史已交付） | 2 | done |
| 1.4 | `1-4-home-unified-input-and-inspiration-library` | 首页统一输入与灵感库基线（历史已交付） | 2 | done |
| 1.5 | `1-5-settings-feedback-and-account-entry-points` | 设置、反馈与账号入口基线（历史已交付） | 2 | done |
| 1.6 | `1-6-home-multi-link-import-queue-and-honest-status` | 首页多链接导入队列与诚实状态展示 | 9 | backlog |
| 1.7 | `1-7-durable-import-progress-and-restart-recovery` | 可跨重启恢复的导入进度 | 10 | backlog |
| 1.8 | `1-8-owner-import-records-and-versioned-deduplication` | Owner 导入记录与版本化去重 | 11 | backlog |
| 1.9 | `1-9-production-image-text-understanding-and-evidence` | 生产级图文多模态理解与证据 | 11 | backlog |
| 1.10 | `1-10-adaptive-video-understanding-and-local-frame-resampling` | 自适应与局部二次抽帧的视频理解 | 12 | backlog |
| 1.11 | `1-11-amap-poi-verification-branch-disambiguation-and-manual-correction` | 高德 POI 验证、分店消歧与运营手工纠错 | 22 | backlog |
| 2.0 | `2-0-confirm-and-planner-picker` | Confirm 与 Planner Picker 基线（历史已交付） | 2 | done |
| 2.1 | `2-1-generate-day-skeleton-with-quick-and-hq-planning` | Quick/HQ 日计划基线（历史已交付） | 2 | done |
| 2.3 | `2-3-single-city-travel-time-and-boundary-confirmation` | 单城旅行时间与边界确认 | 11 | backlog |
| 2.4 | `2-4-unified-flight-and-rail-service-lookup` | 统一班次识别与航班/铁路查询 | 14 | backlog |
| 2.5 | `2-5-preplanning-nightly-stays-breakfast-and-luggage` | 规划前逐晚住宿与行李确认 | 15 | backlog |
| 2.6 | `2-6-preplanning-pace-and-additional-constraints` | 规划前节奏与附加约束确认 | 13 | backlog |
| 2.7 | `2-7-full-city-picker-and-l3-place-intent` | 全城 Picker 与 L3 意图选择 | 17 | backlog |
| 2.8 | `2-8-shared-poi-information-sheet` | 通用 POI 信息 Sheet | 12 | backlog |
| 2.9 | `2-9-single-planning-job-and-stable-timeline-transition` | 单一 PlanningJob 与稳定时间轴转场 | 16 | backlog |
| 2.10 | `2-10-authoritative-route-facts-and-timeline-transport` | 可信通勤事实与时间轴交通摘要 | 16 | backlog |
| 2.11 | `2-11-constraint-first-complete-single-city-planning` | 约束优先的完整单城初始编排 | 21 | backlog |
| 2.12 | `2-12-amap-candidate-expansion-and-nonblocking-candidate-list` | 高德候选补全与非阻塞候选区 | 19 | backlog |
| 2.13 | `2-13-anchor-pool-buckets-shared-admission-and-versioned-snapshots` | 平台 AnchorPool 分桶、共享准入与版本快照 | 16 | backlog |
| 2.14 | `2-14-daily-load-estimation-and-explainable-summary` | 每日负荷估算与可解释摘要 | 13 | backlog |
| 2.15 | `2-15-post-plan-place-search-and-manual-candidates` | 行程后地点搜索与手动候选补点 | 14 | backlog |
| 3.1 | `3-1-minute-timeline-editing-and-plan-wide-undo` | 分钟级时间轴编辑与全计划撤销 | 18 | in-progress |
| 3.2 | `3-2-controlled-candidate-placement-and-free-time-filling` | 候选地点受控落位与自由时间填充 | 20 | backlog |
| 3.3 | `3-3-post-plan-nightly-stay-breakfast-and-luggage-editing` | 规划后单晚住宿、早餐与行李修改 | 22 | backlog |
| 3.4 | `3-4-incremental-validation-and-typed-conflict-fixes` | 增量校验与类型化冲突修复 | 23 | backlog |
| 3.5 | `3-5-controlled-conversational-local-adjustment` | 受控对话式局部调整 | 25 | backlog |
| 4.1 | `4-1-cross-city-intent-and-linked-trip-input-draft` | 多城跨城意图确认与联程输入草稿 | 20 | backlog |
| 4.2 | `4-2-adjacent-city-transfers-and-handoff-day-boundaries` | 相邻城市交通确认与交接日切分 | 22 | backlog |
| 4.3 | `4-3-independent-city-planning-and-atomic-linked-trip-publication` | 多城独立编排与原子联程发布 | 24 | backlog |
| 4.4 | `4-4-active-city-editing-and-linked-trip-revision-rebinding` | 已发布联程的当前城市安全编辑与版本重绑定 | 22 | backlog |
| 4.5 | `4-5-day-excursion-intent-and-round-trip-transfer-draft` | 跨城一日游意图与往返交通草稿 | 19 | backlog |
| 4.6 | `4-6-day-excursion-planning-and-atomic-timeline-publication` | 跨城一日游独立编排与原子时间轴发布 | 24 | backlog |
| 4.7 | `4-7-day-excursion-editing-and-scope-guards` | 已发布跨城一日游的安全编辑与范围约束 | 28 | backlog |
| 5.1 | `5-1-revision-bound-ai-detail-enrichment` | 版本绑定的 AI 行程细节完善 | 24 | backlog |
| 5.2 | `5-2-verifiable-result-sheet-and-citation-reading` | 可核查的行程单与引用查看 | 23 | backlog |
| 5.3 | `5-3-line-level-detail-editing-and-ai-preservation` | 逐条行程细节修改与 AI 保留 | 19 | backlog |
| 5.4 | `5-4-revision-bound-export-generation-and-preview` | 版本绑定的导出生成与预览 | 27 | backlog |
| 5.5 | `5-5-whole-trip-image-download-and-system-sharing` | 整趟长图下载与系统分享 | 21 | backlog |
| 6.1 | `6-1-planned-meal-slots-and-primary-alternative-pool` | 计划餐饮槽与一主两备选择池 | 21 | backlog |
| 6.2 | `6-2-foreground-location-meal-recall-and-plan-context-fallback` | 前台定位餐饮召回与计划上下文降级 | 21 | backlog |
| 6.3 | `6-3-normalized-business-areas-and-owner-food-hints` | 规范化商圈与“附近吃什么” | 21 | backlog |
| 6.4 | `6-4-trip-checklist-and-direct-or-ai-record-entry` | 行程清单与直接／AI 添加记录 | 23 | backlog |
| 6.5 | `6-5-lightweight-shopping-notes-and-label-shortcuts` | 轻量购物记录与标签快捷输入 | 15 | backlog |
| 7.1 | `7-1-recent-trips-and-context-resume` | 最近行程与继续使用 | 22 | backlog |
| 7.3 | `7-3-settings-account-and-available-actions` | 设置页账号与可用操作 | 14 | backlog |
| 7.4 | `7-4-account-data-copy-export` | 账号数据副本导出 | 20 | backlog |
| 7.5 | `7-5-account-deletion-and-cleanup-results` | 账号删除与清理结果 | 22 | backlog |
| 7.6 | `7-6-feedback-entry-and-reliable-submission` | 反馈入口与可靠提交 | 20 | backlog |
| 8.1 | `8-1-cross-flow-observability-and-fault-localization` | 跨流程观测与故障定位 | 20 | backlog |
| 8.2 | `8-2-reproducible-quality-regression-and-version-comparison` | 可复现的质量回归与版本对比 | 24 | backlog |
| 8.3 | `8-3-task-level-provider-routing-and-safe-release` | 任务级 Provider 路由与安全切换 | 24 | backlog |
| 8.4 | `8-4-platform-budget-and-usage-policy-management` | 平台预算与用量策略管理 | 26 | backlog |
| 8.5 | `8-5-terminal-ai-amap-incidents-and-telegram-alerts` | AI/高德终态异常与 Telegram 告警 | 24 | backlog |
| 8.6 | `8-6-operations-overview-and-read-only-diagnostics` | 运营总览与只读排障入口 | 20 | backlog |

## 3.1 继承在制与恢复条件

旧 `2-2-timeline-editing-undo-and-history` 的实施文件原位保留为历史来源，原文和原Status不改写为新合同。
新执行身份只有 `3-1-minute-timeline-editing-and-plan-wide-undo`；本轮不生成3.1实施Story，也不把原文存在当作ready。
其 `legacy_story_id`、`baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c` 与 `codex/story-2-2-timeline-editing` Git历史保留。

开始条件：1.0生产身份、2.7 PlaceIntent、2.9单一PlanningJob/current revision、2.10可信RouteFact、2.11完整初始计划/校验合同交付；准备新3.1合同并完成keep/change/remove审计，再按后续实施授权恢复。
3.1自己交付mutation后精确revision的ValidationRun触发和状态，**不等待3.2候选落位或3.4 FixSheet**，也不将联程、细节、运营UI当作前置。

- keep：owner guard、幂等、expected revision、不可变PlanVersion/PlanRevision、EditEvent、补偿式撤销与仍符合合同的测试。
- change：任意有效日移动、用户逐分钟时间输入、跨日日期、可信或nullable通勤、全计划历史/撤销入口。
- remove（后续实施审计后）：旧D±1唯一限制、15分钟/30或60吸附用户限制、底部/单日最近操作、Quick/HQ采用及seed reset用户路径。
- 以上是合同迁移边界，不是本轮已完成代码审计或变更；原浏览器/PVE证据未完成的历史事实保持，实际环境后续再核验。

## 七项工程条件与责任

Codex是本项目后续获授权实施的具名执行者，承担后端/数据库/存储/观测/评测角色；技术复核用分离步骤及可查证据，不冒称另一位人员已经审过。yimeng-tong负责产品体验/费用决定与实际运营人评；本轮仅指派，均未执行。

| 条件 | 首次归属/汇总 | 开始或关闭时点 | 执行/复核 |
| --- | --- | --- | --- |
| OPS-01 | `1-0-production-login-and-multi-device-sessions` | 首个承载真实用户数据的生产数据库开放前；后续持久化Story复用并扩充恢复fixture。 | Codex交付与分步核验 |
| OPS-02 | `1-9-production-image-text-understanding-and-evidence` | 1.9首次生产私有媒体；后续新增对象类型在所属Story扩充矩阵。 | Codex交付与分步核验 |
| DB-CHANGE-01 | `1-0-production-login-and-multi-device-sessions` | 每次schema/回填/索引/扩展/迁移/恢复策略变化；无变化只登记可核验的不适用依据。 | Codex交付与分步核验 |
| DATA-VECTOR-01 | `2-13-anchor-pool-buckets-shared-admission-and-versioned-snapshots` | 首次启用向量或实际改变模型/维度/归一/距离/索引兼容性时；当前尚未评估触发，不声称已升级。 | Codex交付与分步核验 |
| METRICS-01 | `1-0-production-login-and-multi-device-sessions` | 从1.0认证、1.6/1.7任务开始，最迟1.9首次真实生产能力验收前具备；不等待8.x界面。 | Codex交付与分步核验 |
| METRICS-02 | `8-1-cross-flow-observability-and-fault-localization` | 每个能力面向真实用户开放前完成目标定版；若早于8.1交付，由8.1责任人提前完成该能力条件。 | Codex交付与分步核验；yimeng-tong产品决定 |
| METRICS-03 | `8-2-reproducible-quality-regression-and-version-comparison` | 领域能力首次实现留规则fixture；8.2汇总，在对应模型/提示/编排变更发布前按适用策略消费。 | Codex交付与分步核验；yimeng-tong实际人评 |

完整绑定在manifest的 `story_condition_bindings`；每个目标在create-story时把条件源章节、适用性、实际责任人、Tasks/Subtasks及证据写入同一实施Story。当前没有为条件伪造七张产品Story或先创建53份实施文件。
OPS-01从1.0挂起；OPS-02从1.9建矩阵并随1.10/5.4/5.5/7.4/7.5/7.6的对象类型扩展；每次DB变更重新验证适用恢复。向量只在真实消费/兼容性变化触发时执行。
METRICS-01从1.0及1.6/1.7开始，最迟1.9首次真实生产能力验收前具备。METRICS-02可提前完成当前能力目标定版；METRICS-03早期领域fixtures随业务交付，8.2再汇总。均不要求早期能力先等待完整8.x UI。

## 延期与未完成实证

7.2、8.7、8.8仅在延期登记中；FR34.1/FR40.1/FR42/FR43及其他旧草稿不进入当前development_status。已批准的1.0身份、1.11地点纠错、5.1最小S10/S9来源/返回和18组呈现合同原样保留。
原型缺口与真实服务证据在对应实施Story处理，尤其1.0真实登录、1.11纠错桌面、5.1最小连贯路径；本轮没有部署、真实调用、数据迁移/删除或采购授权。

## 验证记录

以下结果来自本轮WSL本地检查；未运行业务开发或真实服务验收。

| 检查 | 实际结果 |
| --- | --- |
| `pnpm run ci:handoff` | 通过：8 Epic、60 Story、8回顾、1018 GWT；7 done / 1 in-progress且暂停 / 52 backlog / 0 ready；首个准备1.0。 |
| `node --test scripts/check-handoff.test.mjs` | 25/25通过（1个完整交接、24个错误拒绝）：重复YAML键、遗漏/额外Story、非法状态、扩围误报done、历史丢失、同号误迁移、旧2.2重复派发、基线/暂停/前置损坏、条件遗漏、越界实施等。 |
| `node --check` 两个检查脚本 | 通过。 |
| 独立PyYAML解析 | 当前Sprint与迁移manifest均解析为合法映射；主检查同时使用js-yaml拒绝重复键。 |
| 文档与来源核对 | PRD逐字节一致；架构/UX/技术规格共20个源段逐段一致；READY交接的7份输入SHA-256及全部60个Story合同指纹保持。 |
| 锁文件检查 | `pnpm install --frozen-lockfile --lockfile-only --offline --ignore-scripts --store-dir /tmp/nomad-sp-pnpm-store`通过。解析器复用锁文件中已有的js-yaml 4.1.0，仅将它声明为检查脚本的直接开发依赖；未增添服务或业务依赖。 |
| 工作区保留 | 833份基线文件逐项核对（825份接收文件及8份先行快照/指纹文件）；仅7个已授权文件变化。历史Story正文、回顾、业务代码、原型及规划源输入保留。 |
| Git及格式 | HEAD仍为`7250a8a131a370698bff53538a4405c2ddb94c1c`，分支未变；原baseline可解析且为HEAD祖先；`git diff --check`通过。未commit/reset/clean。 |

相对于接收时的7个文件改动是：Sprint、CURRENT、project-context、旧2.2的5行历史身份元数据、交接脚本、package.json与锁文件。新增迁移文档/YAML、检查回归及留档属于SP产物。原检查脚本和未提交交接内容已先备份，不用git基线覆盖它们。

后续具名执行者在获得下一步授权后准备1.0，纳入OPS-01、DB-CHANGE-01与测量条件；本记录不表示create-story、业务实现、生产目标定版或任何真实服务操作已经开始。
