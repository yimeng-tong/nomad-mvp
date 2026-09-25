---
project: nomad-mvp
date: 2026-09-07
story: '8.2'
status: bounded-research-complete-revision-input
researchScope: langfuse-human-review-and-operator-entry
runtimeValidated: false
deploymentAuthorized: false
dataUploaded: false
upstreamRelease: v4.30.0
upstreamCommit: 2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd
---

# Story 8.2: Langfuse 人工评审与轻运营入口

## 结论

**Langfuse 可以承担真正的人工评审工作台，不应仅描述为“可选安全摘要发布”。** 已有手工评分、评语、标注队列、实验逐项对比和对比中标注功能；免费自托管包含这些核心产品能力。[S1]、[S3]、[S4]、[S8]

建议修订方向是：**保留本地确定性检查与证据完整性核对，同时把运营者可打开的实验/待评入口、逐条人工打分及评语、评审结果回收列为需要交付的能力**。仅能查看总分/HTML 报告或发布摘要，不满足本次明确的人评需求。这是基于成熟能力的采用建议，不是已批准的 Story 合同或已完成集成。

已阅读 `story-8-2-mature-implementations-2026-09-07.md` 及 8.2 review，本文只补人工评审、浏览器入口和免费/付费边界，不重做 promptfoo 选型。**当前范围以 [evaluation-operator-scope-decision-2026-09-07.md](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/evaluation-operator-scope-decision-2026-09-07.md) 为准，优先于上述旧稿中的限制。** 用户已授权去直接标识后的线上样本参与评测；质量逐条规则决定计分、提醒或人工复核，不采用“任一硬约束失败都一票否决”。确需阻断的个别规则须明确对齐，不因旧 hard 标签自动继承。

运行时安全边界不变：评测规则策略不更改 Planner/Validator 运行时合同或代码测试；凭据不得进入评测输入、日志或报告，8.1 生产遥测仍使用原有安全观测字段。8.2 使用独立评测入口与访问控制，不放宽生产遥测出口，不自动发布生产模型。本地合同及 prompt/config 权限细化交由主 agent。

核验口径：公开官方文档为“文档确认”；GitHub 固定版本为“源码确认”；Nomad 采用方式为“建议/推断”。截至 2026-09-07，官方 GitHub 最新 release 为 **v4.30.0，发布于 2026-09-04**；这不是现有 Nomad Langfuse 实例的版本证明。[G1]

## 实际能力

| 能力 | 核实结果与边界 |
| --- | --- |
| 手工数值/分类/布尔评分 | **有。** 先创建 Score Config，定义数值上下界、分类选项或布尔类型，在 trace/session/observation 详情点 `Annotate`。例如 1-5 质量分、问题类别、是否可接受，均可由人填写。当前还支持 TEXT，但无需为本期扩大范围。[S1]、[S2] |
| 评分评语与讨论 | **有，但须区分。** score 的可选 `comment` 解释这次评分；独立 Comments 用于 trace/observation/session/prompt 上的讨论，支持成员提及等。评论本身不是数值分，也不等于质量通过。[S1]、[S5] |
| Annotation Queues | **有。** 选择评分维度、创建队列、可选分派用户；单条或批量加入 trace/observation/session；逐项评分后 `Complete + next`，支持键盘处理及队列 API。队列是任务组织能力，不应据此承诺盲评、双人独立标注或争议仲裁。[S3] |
| 实验对比时直接人评 | **有。** UI/SDK 实验可在 compare view 查看输入、输出及自动分数，选结果项进入标注界面并评分/评论，无需回到独立表格录分；汇总指标可随标注更新。官方 2025-11-06 发布说明已确认此流程，URL 中的 10-23 不是页面显示的发布日期。[S1]、[S4] |
| 当前对比界面 | **v4.30.0 已发布增强。** 含逐项差异、score 列汇总、相对另一 run 的分数过滤及 score-by-run matrix。重要限制：此版相关列汇总、比较过滤及 matrix 基于已加载页，不能把当前页“无回归”解释成全实验通过；分类差异也不天然有优劣顺序。已查固定版本代码，非仅采用 PR 中自动生成的评价。[G1]、[G5] |
| Datasets | **有。** UI 创建/编辑、CSV 导入输入与 expected output、可选 JSON Schema、从观测建立样本、按时间戳访问 item 版本。CSV 上传数据集不是导入已有实验输出的通用接口；生成输出需通过实验接入路径。版本化不包含 dataset schema。[S6] |
| 浏览器直接运行 | **有，主要是 Prompt Experiment。** 选择受管 prompt、dataset、模型连接及可选 evaluator，由 Langfuse 执行并生成结果；prompt 变量须匹配 dataset JSON input。不是浏览器本地执行任意 Nomad Planner，也不是免费获得模型推理。[S7] |
| 浏览器触发完整应用实验 | **有远程触发入口，但需要接入。** `Custom Experiment` 可配置 HTTP webhook，将 dataset 信息和可编辑 config 发给外部服务；外部执行 SDK/application 实验并回传结果。现行文档支持可选 HMAC 签名及自定义 headers，建议快速返回 2xx、后台执行。不能把“触发成功”当作实验完成或评分完成。[S9]、[G7] |

## 对 Story 8.2 的采用建议

1. **轻入口优先复用现有工作台。** 运营者登录后进入指定实验对比或待评队列，查看获准的输入、候选/基准输出及评分依据，填写 rubric 对应分数和必要评语。先采用人工点击进入的既有页面，不必为人评新建整套运营后台。[S1]、[S3]、[S4]
2. **完整应用继续由受控执行器运行。** 有需要再将 Langfuse 的远程触发按钮接到可信实验服务；也可由既有执行入口完成实验后进入 Langfuse 评审。UI 触发器不是另一套业务运行时，接入 promptfoo 仍需适配，未证明有“导入任意 promptfoo 报告即得到全部人评关联”的开箱能力。[S9]
3. **线上样本可参与逐项人评，不限于合成数据或摘要。** 在已授权范围内选择线上样本或有界抽样，筛除姓名、证件、个人联系方式及直接定位账号的标识后，保存独立评测副本。目的地、酒店 POI、日期、时间、路线、偏好和行程约束不因组合可能间接识别用户而删除；准确称为“去直接标识”，不是不可再识别的匿名化。凭据过滤是独立安全控制，不得借此扩大间接推断清除范围。缺少必要判读依据时标记“无法评价”；实际数据范围、存放、保留/删除和外发目标在实施时核验，不接入全量生产数据库或自动开启完整生产 tracing。
4. **人工结果需要可回收，不只留在评论区。** Scores API 可读取类型、值、来源，并按字段组返回 comment/configId、标注作者/队列和目标关联，可作为本地报告消费人评证据的成熟接口。[S10] 建议分别保留人评和自动评分，明确未评/不适用/有争议；是否完成评审、证据能否比较与按具体规则得出的质量结论分开记录。缺样本、未执行或解析无效属于证据不完整，不等于模型质量失败，也不能冒充已完成的高分。具体关联键、冻结/修订规则由主 agent 定义，本轮不改合同。

收益是复用登录、样本浏览、评分表单、批量工作流和实验比较，减少自建录分界面；代价是评审数据副本、权限及保留治理、结果映射和自托管运维。**没有 Langfuse 的确定性 CI 可以继续运行，但没有真实可操作的人评路径不能验收本次人评需求。**

## 套餐与成本

下表为核验日公开价格，美元/月，非报价或购买建议；Cloud 的功能限额不能套用到 OSS 自托管。Cloud 人评/实验能力无需从企业套餐起步。[S11]、[S19]、[G2]

| 方案 | 与本期相关的成本和限制 |
| --- | --- |
| Cloud Hobby | $0；50k units/月，2 用户，1 个标注队列，30 天数据访问窗口。适合小规模验证，不能承诺长期历史评审或多人协作一定够用。 |
| Cloud Core | $29；100k units/月，超额起价 $8/100k units，人数不限，3 个队列，90 天数据访问窗口。 |
| Cloud Pro | $199；100k units/月，超额同上述起价，人数/队列不限，3 年数据访问；包含保留策略。细粒度项目 RBAC 在 Teams add-on，另 $300/月；本期普通评分本身不要求该附加项。 |
| 免费 OSS 自托管 | 核心人评、队列、datasets、experiments 无软件使用费；固定版本源码对队列数/组织成员数/访问天数均设为不限。服务器、存储、备份、维护和模型调用不免费。 |
| 自托管 Enterprise | 按询价；项目级 RBAC、保留策略、审计等治理能力需商业许可。不要因“人评免费”推导这些也免费。[S12] |

- **计费不等于样本数。** 官方定义 units 为 traces + observations + scores，Langfuse 内建实验/队列产生的数据也计入；人工评分没有必需的 judge 模型费，但仍增加 Cloud 数据量。Prompt Experiment/LLM judge 使用配置的模型连接，推理成本须另行预算，本次未调用。[S13]、[S14]
- **免费版有角色，不代表有“只准打分”的角色。** 文档确认 Member 可创建分数、Viewer 只读；v4.30.0 的 Member scopes 还包含 `prompts:CUD`、`datasets:CUD`、`playground:execute`、`promptExperiments:CUD`。因此不能把 Member 当作只评分不改提示词/不触发实验的权限保证；队列分派也不能直接当成数据访问隔离。[S15]、[G3]
- **访问窗口不是删除期限。** Hobby/Core 的 30/90 天是访问范围；无 retention policy 不自动删除事件数据。原生保留策略属于 Cloud Pro/Enterprise 或自托管 EE，而且删除可能令 dataset run 引用的 trace 不再存在。数据集、评分、独立评论和导出副本的清理仍须逐对象验证。[S16]
- **操作轻不等于部署轻。** 官方单 VM Compose 指南建议至少 4 核、16 GiB 内存及例如 100 GiB 存储；该组合不自带 HA、横向扩展或备份。它是官方部署建议，不是 Nomad 所需容量的实测结论；先检查已有 8.1 实例，不因本报告新建服务。[S17]

## 冲突与版本证据

- **“自托管队列需付费”是过时结论。** 2025-06-04 官方宣布开放 annotation queues、prompt experiments、playground 和 LLM-as-a-Judge。Issue #7128 中机器人称 OSS 不支持队列，但维护者随后以 PR #7130 修复，并指向 v3.65.3；本次 v4.30.0 entitlement 源码再次证明 OSS 队列不限。采用维护者变更及固定版本代码，不采用旧机器人回复。[S8]、[G2]、[G4]、[G10]
- **数据集版本 pinning 已有正面证据。** Experiments via UI/SDK 页面仍有“只跑 latest”的文字，而 2026-02-11 changelog 和 datasets 文档说明支持指定版本；v4.30.0 表单实际持有 `datasetVersion` 并随表单数据提交。结论应改为“能力已有，文档残留冲突；锁定版本后验证执行端取样”，而非一概说不支持。未运行服务端实验，不能把表单字段当成端到端验收。[S6]、[S7]、[S9]、[S18]、[G6]
- **Score Config 不能直接当作不可变 rubric。** FAQ 开头仍称 immutable，但同页更新章节允许编辑；v4.30.0 服务代码也有验证后 `prisma.scoreConfig.update`。本期需明确评分规则版本，不能仅凭 configId 宣称历史尺度永久冻结。[S2]、[G8]
- **许可核对。** v4.30.0 LICENSE 将普通代码置于 MIT Expat，`ee/`、`web/src/ee/`、`worker/src/ee/` 另有许可；并非整个仓库所有功能都 MIT。此处为官方许可范围记录，不是法律意见。[G9]

## 验证限制

只读访问公开文档、GitHub release/PR/固定版本源文件，未安装 SDK、启动服务、注册账户、上传样本、录入评分或运行模型；未触碰其他仓库文件或记忆。

主 agent 在实施前仍需确认：现有实例版本/部署形态/套餐；账号权限能否满足运营边界；逐样本完整内容和人工分数能否正确关联并读回；保存失败/重复标注/中断/缺项/多评审者分歧的实际行为；版本固定和结果汇总是否覆盖全部用例；数据/评论/导出与失效引用的访问及清理。盲评随机化、仲裁、评分不可篡改审计和自动发布审批，本轮均未取得足以承诺的端到端证据。

**范围界线：** 本报告遵循当前范围决策，不重新收紧已授权的线上样本评测，也不恢复统一 hard-fail 否决。主 agent 负责本地 manifest/接口、prompt/config 编辑边界、已授权数据处理的实施细节及逐条规则策略；不把官方演示、测试通过声明或源码存在等同于 Nomad 已运行成功。本次仅修订报告，未抽取或上传线上数据。

## 来源索引

全部访问于 2026-09-07；GitHub 源码链接固定到上述 release commit，官方站点文档/价格为当日快照。

- 官方人评：[S1 手工评分][S1]、[S2 Score Config][S2]、[S3 标注队列][S3]、[S4 对比中标注发布说明][S4]、[S5 评论][S5]、[S10 Scores API][S10]。
- 官方实验：[S6 Datasets][S6]、[S7 UI 实验][S7]、[S9 SDK/远程触发][S9]、[S18 指定数据集版本实验][S18]。
- 官方许可/运维：[S8 核心产品开源公告][S8]、[S11 Cloud 价格][S11]、[S12 EE 许可项][S12]、[S13 计费 units][S13]、[S14 模型连接][S14]、[S15 RBAC][S15]、[S16 保留策略][S16]、[S17 Compose 资源建议][S17]、[S19 自托管价格][S19]。
- GitHub：[G1 v4.30.0 release][G1]、[G2 entitlement 限额表][G2]、[G3 角色 scopes][G3]、[G4 队列 OSS 修复][G4]、[G5 实验结果表][G5]、[G6 实验表单][G6]、[G7 远程触发认证辅助代码][G7]、[G8 Score Config 更新服务][G8]、[G9 LICENSE][G9]、[G10 队列问题维护者回复][G10]。

[S1]: https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-ui
[S2]: https://langfuse.com/faq/all/manage-score-configs
[S3]: https://langfuse.com/docs/evaluation/evaluation-methods/annotation-queues
[S4]: https://langfuse.com/changelog/2025-10-23-annotate-from-compare-view
[S5]: https://langfuse.com/docs/observability/features/comments
[S6]: https://langfuse.com/docs/evaluation/experiments/datasets
[S7]: https://langfuse.com/docs/evaluation/experiments/experiments-via-ui
[S8]: https://langfuse.com/blog/2025-06-04-open-sourcing-langfuse-product
[S9]: https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk
[S10]: https://langfuse.com/docs/api-and-data-platform/features/scores-api
[S11]: https://langfuse.com/pricing
[S12]: https://langfuse.com/self-hosting/license-key
[S13]: https://langfuse.com/docs/administration/billable-units
[S14]: https://langfuse.com/docs/administration/llm-connection
[S15]: https://langfuse.com/docs/administration/rbac
[S16]: https://langfuse.com/docs/administration/data-retention
[S17]: https://langfuse.com/self-hosting/deployment/docker-compose
[S18]: https://langfuse.com/changelog/2026-02-11-versioned-dataset-experiments
[S19]: https://langfuse.com/pricing-self-host
[G1]: https://github.com/langfuse/langfuse/releases/tag/v4.30.0
[G2]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/entitlements/constants/entitlements.ts#L35-L149
[G3]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/packages/shared/src/features/rbac/projectAccessRights.ts#L218-L281
[G4]: https://github.com/langfuse/langfuse/pull/7130
[G5]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/experiments/components/table/ExperimentItemsTable.tsx#L1596-L1626
[G6]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/experiments/components/MultiStepExperimentForm.tsx#L315-L336
[G7]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/datasets/server/remoteExperimentHelpers.ts#L175-L234
[G8]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/public-api/server/score-configs-api-service.ts#L70-L108
[G9]: https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/LICENSE
[G10]: https://github.com/langfuse/langfuse/issues/7128
