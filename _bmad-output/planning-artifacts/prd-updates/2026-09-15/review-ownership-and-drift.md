---
title: IR 定向复验：工程责任与文档漂移
date: 2026-09-15
status: passed
reviewScope: [IR-04, IR-07, IR-08, IR-09-delivery-order]
blockingProductFindings: 0
minorDocumentFindings: 1
resolvedMinorDocumentFindings: 1
openFindings: 0
formalSourcesModified: false
runtimeVerificationPerformed: false
---

# IR 定向复验：工程责任与文档漂移

本轮未发现新的产品范围或架构责任阻断。备份/存储、数据库恢复、按需向量工作和指标已有可执行归属，S10/S9 首次交付责任已消除对 5.2 增强页的前向依赖。初查发现的一处 UX 组件“两方向”摘要已由主任务机械同步，本 reviewer 重新读取源文档及全部 UX Source 镜像核验通过，当前无未关闭发现。

本报告只复核当前用户批准修改后的文档合同，不代表整个 IR 最终判定、生产验收或实施授权。CURRENT 与旧 IR 报告的状态交接由主任务处理，未将该过程的暂态记成产品问题。

## 核对方法与范围

- 阅读当前 `docs/prd.md`、正式 `epics.md`、`implementation-prerequisites-2026-09-15.md`，并回查现行架构 index/tech-stack/compatibility/frontend-architecture/rest-api-spec/testing-strategy 与对应 UX 来源。
- 以架构 index 的来源规则排除明确历史的根 `architecture.md`、v0.3/autoplace 和旧 UX delta；PRD 明确标注的历史 Story 与历史变更摘要保留历史身份。
- 搜索 MobileOnly、旧 Story 归属、固定两个方向、Monorepo 待确认、Drizzle、先填充再进入结果等表述，再按段落身份判断；没有把所有关键词命中直接当现行冲突。
- 独立核对结构计数和来源镜像。未访问外网、真实服务或旧 PNG；没有修改正式源文档或 Sprint。

## 已关闭的定向发现

**OD-01 / 低 / 已解决：UX 组件摘要的固定两方向残留**

- 初查位置：[front-end-spec.md:410](/home/tong123/work/nomad-mvp/docs/front-end-spec.md:410) 的 `AiAdjustmentLauncher` 行原写「右下角图标、上下文范围、快捷意图和两方向预览」。这是当前 `Component Contracts`，不是历史摘录。
- 对照：[PRD FR50](/home/tong123/work/nomad-mvp/docs/prd.md:233)、[Story 3.5](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/epics.md:2834)、[API 目标](/home/tong123/work/nomad-mvp/docs/architecture/rest-api-spec.md:91) 已明确通常两个、只有一个安全方向则只给一个、没有安全方向进入恢复，不为凑数制造方案。
- 影响：只根据组件表实现时仍可能把两个方向当固定容量或必需结果。详细合同已正确，因此不构成待用户裁定的新范围冲突。
- 建议：将组件摘要改为「右下角图标、上下文范围、快捷意图和安全方向预览；通常两个，只有一个则保持一个，没有安全方向进入恢复」，同步 UX mirror；也可在当前 AI 流程文字中复用同一句规则。
- 关闭证据：主任务已改为「安全方向预览；通常两个，仅一个安全方向则展示一个，无安全方向进入恢复」。本 reviewer 再次读取该行，确认旧组件短句不再存在，并逐段核验 UX mirror 的全部 4 个 Source 段与源文件一致。该项已解决；正式源由主任务修改，本 reviewer 只更新此复验记录。

## 文档漂移复验

| 核对项 | 当前证据 | 判定与限制 |
| --- | --- | --- |
| MobileOnly 与运营适配 | [PRD Target Device and Platforms](/home/tong123/work/nomad-mvp/docs/prd.md:298) 区分旅行者移动优先 Web/PWA 与运营桌面 Web；8.4/8.5/8.6 的正式合同明确运营无需移动适配 | 通过。没有把旅行者移动体验删除，也没有新建原生应用作为前置 |
| 旧 1.7 商圈 / 1.8 多模态归属 | [PRD Epic 1 当前编号](/home/tong123/work/nomad-mvp/docs/prd.md:327)、[架构 index](/home/tong123/work/nomad-mvp/docs/architecture/index.md:22)、[compatibility](/home/tong123/work/nomad-mvp/docs/architecture/compatibility.md:13) 一致：1.7 持久进度、1.8 owner 记录/去重、1.9 图文、1.10 视频、1.11 POI/纠错、6.3 BusinessArea | 通过；历史 1.1–1.5 不冒充生产认证/新版理解已交付 |
| 固定两个方向 | PRD/3.5/API 目标支持两个/一个/零个安全方案，UX 组件摘要已按 OD-01 同步并复验 | 通过；不要求始终给两个方向 |
| Monorepo 待定 | [PRD Technical Assumptions](/home/tong123/work/nomad-mvp/docs/prd.md:302) 写明现有 pnpm Monorepo、apps/mobile/apps/server/共享包，架构沿用 Node/Fastify | 通过；不重新选框架或启动 greenfield |
| Drizzle / 每次迁移天然可逆 | [PRD 数据层](/home/tong123/work/nomad-mvp/docs/prd.md:536) 使用 Prisma Migrate，并按 DB-CHANGE-01 区分可逆、前向修复、备份恢复 | 通过；不承诺删除数据能由反向 SQL 无损恢复 |
| 结果页必须先填充 | [PRD FR37/IR-09](/home/tong123/work/nomad-mvp/docs/prd.md:192)、[5.1 最小宿主闭环](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/epics.md:3824)、[前端架构](/home/tong123/work/nomad-mvp/docs/architecture/frontend-architecture.md:29)、[mobile IA](/home/tong123/work/nomad-mvp/docs/ux/mobile-ia.md:453) 先展示基础 S10，再主动进入 S9，回同一父上下文 | 通过；5.1 提供最小入口/基础读取/来源展开/返回，5.2 增强完整核查与 CitationSheet。只读导航不启动 FillRun/ValidationRun/排期 |
| 历史 Filler→ResultSheet、旧向量相似度公式 | 命中位于 [Historical implementation appendix](/home/tong123/work/nomad-mvp/docs/prd.md:601) 或 [历史 v0.3 摘要](/home/tong123/work/nomad-mvp/docs/prd.md:803)，架构 index 明确现行分片优先 | 历史保留正确；不把这些摘录计作当前需求，也不据此要求先填充/先实现向量 |
| 旧 2.2→3.1 迁移历史 | 前置清单保留 legacy_story_id、原分支与 hash；现有 2.2 实施文件 frontmatter 实读为 `10f940c49e2d61ddcb1233cffddd071ed1c9284c` | 通过；没有要求重写历史完成状态或丢弃 owner/幂等/revision/EditEvent/undo 基线 |

## OPS / 数据条件复验

| 条件 | 归属与先后证据 | 关闭条件是否可执行 | 结果 |
| --- | --- | --- | --- |
| OPS-01 | [责任表](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md:35)：运维/数据库工程负责，后端/QA 复核；SP 第一批，在真实用户生产数据库开放前完成 | 每日全量＋15 分钟增量/PITR、真实链/恢复点、新实例指定时间点演练、事务/引用/权限/任务恢复核验；7.5 后补删除抑制 | 通过；明确目标≠已达 RPO/RTO，无生产实证冒充 |
| OPS-02 | [责任表](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md:36)：对象存储/后端负责，隐私/QA 复核；随 1.9 首次私有媒体，后续对象类型随各自 Story 登记 | 原图 180 天转低频、身份/内容保持、可授权读取、边界/竞态测试；缩略图仍受账号删除/无引用清理 | 通过；不将转层写成删除，不把反馈截图/账号副本等强行保留 180 天 |
| DB-CHANGE-01 | [责任表](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md:37)：每次变更作者负责；共享环境前有预案，生产前验证所选恢复方式 | 迁移 ID/版本/diff、锁/规模与兼容性、可逆/前向/恢复路径、隔离库正向/恢复及不变量证据 | 通过；每次触发，不被旧迁移通过豁免，不要求所有迁移同一种回退方式 |
| DATA-VECTOR-01 | [条件触发](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md:104)：首次实际消费的 Story 作者承担，2.13 数据负责人复核；无向量消费/兼容变化记录未触发依据 | 模型/维度/归一/距离/索引版本、幂等重建、同样本比较、切换/恢复；真实调用另需授权，旧版本按引用保留 | 通过；没有提前强制向量、独立升级平台或清理旧索引/原图/备份 |

职责按职能分配且明确 SP 指派实际执行人；同一项目执行者可以承担多个角色、以独立证据步骤复核，不隐含新增人员或审批平台。尚无生产资源配置/恢复报告是实施阶段的交付项，不能再次作为“规划没有负责人”重复打开 IR-04。

## METRICS 条件与依赖顺序复验

| 条件 | 当前职责/先后 | 结论 |
| --- | --- | --- |
| METRICS-01 | 从 1.0/1.6/1.7 起建立公共合同，最迟 1.9 首个真实生产能力验收前具备；后续各能力随交付接入。统一版本、workload、阶段起止、失败/重试/恢复、用量与真实成本来源 | 通过；没有把早期采集推迟到 Epic 8 |
| METRICS-01 可比性 | 具名 workload 包含短/长单城、图文/视频/素材缺失、linked/一日游、编辑/完善/导出及恢复；精确 manifest 固定实际输入、N/并发/截止/重试/缓存。分开用户等待与内部阶段，P50/P95 nearest-rank、有分母/缺失/终态说明 | 通过；固定 fixture 与回放不冒充真实模型速度，失败/缺数据不隐去，P95 不平均 |
| METRICS-02 | 8.1 负责人汇总实际基线，产品/性能/QA/运维按职责确认体验、质量、费用与资源；每项能力生产开放前定版目标，提前开放则提前完成该能力定版 | 通过；是该能力的测量/生产验收条件，不是要求早期 Story 等完整 8.1 运营界面上线 |
| METRICS-03 | 早期领域 Story 提供规则 fixture/预期；8.2 自身交付统一执行、结果完整性/版本桥与真实人评。逐规则计分/提醒/人工复核与实际单项政策保留 | 通过；8.2 的实际人评闭环仍是其自身完成合同，早期领域规则/安全测试可以独立执行，不要求先建平台才测质量 |
| 8.1/8.2 是否造成前向 UI 依赖 | [前置清单顺序总则](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md:43) 明确汇总不成为早期日志、用量保护、Job 或基本质量测试的依赖；METRICS-02 明确可提前完成单能力定版；[测试策略](/home/tong123/work/nomad-mvp/docs/architecture/testing-strategy.md:20) 要求复制到“所属工作”，不是把七项全部挂到每张 Story | 通过。SP 应按这条总则保留所属关系；不要把 METRICS-03 整套 8.2 UI 搬进 1.9/2.9 的开始条件 |
| 阈值与费用决策 | 目标表在实际数据之后由责任角色确认，不能以旧 Quick 或 120–200ms 动效数值代替 AI 全流程；真实调用/新增资源/数据外发不由规划授权 | 通过；没有凭空承诺性能，也没有恢复统一“一条硬规则失败全部否决” |

## 结构与镜像检查结果

本次快照的独立脚本检查：

- PRD 与 epics 各 65 个 FR 定义，集合相同；各 24 个 NFR 定义。
- 60 个唯一 Story 标题；Given、When、Then 分别 1018，数量一致。
- planning `prd.md` 与 `docs/prd.md` 内容完全相同。
- planning `architecture.md` 的 14 个 Source 段与实际源文件一致；planning `ux.md` 的 4 个 Source 段与源文件一致。OD-01 修正后再次逐段核验 UX mirror 通过。

这些检查证明本轮文档结构与镜像一致，不证明每条 GWT 已实现或各运行指标已达到。

## 建议交接结论

IR-04、IR-08 的工程责任缺口在规划层具备关闭依据；IR-09 的 5.1/5.2 交付顺序在本范围内通过。IR-07 的 OD-01 组件摘要已同步并再次核验，当前范围内没有未关闭发现，不需要再向用户请求同一产品方向批准。其余 IR 项由各自 reviewer/主任务汇总，本报告不越权给整个 IR 发布结论。
