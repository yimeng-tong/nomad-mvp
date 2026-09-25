---
project: nomad-mvp
date: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
epic: 8
story: '8.2'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-08
researchDelegated: true
researchStatus: complete
researchDecisionApproved: true
revision: 2
scopeDecision: evaluation-operator-scope-decision-2026-09-07.md
---

# Story 8.2 Review: 可复现的质量回归与版本对比

Story 8.1 的 20 条 GWT、Sentry/Langfuse 隔离追踪方向与 Walkthrough R1 已批准并追加。
用户于 2026-09-08 确认本 Story 的修订合同、采用方案与 Human Workspace R2；24 条 GWT
已原样追加 epics.md。本次为规划批准，不授权生产模型变更、付费调用、云账户或业务代码实施。

## Story

As a Nomad 开发者与运营者，
I want 用同一套版本化样本比较提示词、模型或编排代码，并在轻量工作区人工评分与试验，
So that 我能结合具体规则、逐例差异和人工判断决定如何迭代，而不是只看平均分或统一一票否决。

**Requirements:** FR13（promptfoo A/B、Langfuse 样本/人工评分/实验工作区）、FR33（规划质量与回退事实）；
FR7/FR9/FR10/FR23/FR28/FR30-FR32.3/FR34/FR35/FR35.1/FR36/FR36.2/FR39/FR50（消费既有域规则，不重做其业务）；
NFR3-NFR7、NFR9-NFR12、NFR17、NFR20-NFR23；AR1-AR8、AR11-AR15、AR18-AR20；
UX-DR31（额度不向用户暴露）、UX-DR33（报告示意与实际证据分开）。

## Local Baseline

- `packages/prompts/promptfoo.yaml` 仅有历史 fill 示例；`registry.json` 只有旧模型/提示版本。
- 根 scripts 未接入实际 prompt evaluation，`.github/workflows/ci.yml` 的 promptfoo 步骤
  仍为 echo 占位。原始 YAML 存在不证明适配所选 CLI 版本或可执行门禁。
- 已有 `quick.test.ts`、`hq.test.ts`、`edit.test.ts`、`ingest/evidence.test.ts` 可提炼 fixture
  和不变量。但 HQ 采用、15 分钟用户编辑等历史预期不能直接成为当前 v0.6 黄金答案。
- `fill-output.schema.json` 仅覆盖旧 items/do/prepare/notice 形状，不能单独证明引用可信、
  不修改排期或保留用户措辞。新合同按实施时已交付业务生成，不能用评测器替代业务校验。
- 本轮未安装 CLI、调用模型或运行这些评测；图表数字是合成示例，不是实测质量成绩。

## Approved Research Direction

首轮两位 agent 完成 promptfoo 与 Langfuse/DeepEval/Inspect AI 调研；本次再委派两位 agent
核验 Langfuse 人工评估和运营配置能力，范围包含官方文档及 GitHub。主 agent 核对本地边界
及结果同步接口。见 `research/story-8-2-langfuse-operator-addendum-2026-09-07.md`。
原“统一硬门禁、Langfuse 仅摘要”建议已被批注替代；首轮报告保留作历史技术证据。
已批准保留 promptfoo 执行，使用 Langfuse 已有评测 UI，增加最小结果/版本桥接和逐规则策略。
具体部署、许可/访问能力、版本兼容、费用和质量仍须实施时核验；研究日期不因批准而改为新实测日期。

## Approved Scope

复用 promptfoo 执行与结果、Langfuse 数据集/实验对比/人工评分/评语/提示版本及 Playground，
加最小 Nomad adapter、结果完整性检查和版本化规则策略；不自建同类平台。
确定性 CI 与本地报告不依赖 Langfuse 在线；但本 Story 整体交付必须证明人工评估实际可用，
不能仅用“可选上传失败不影响 CI”豁免人工能力。无前向 8.3/8.4/8.6 依赖。
线上样本可经去直接标识进入受限评测工作区，保留必要旅行上下文，不走 8.1 生产 trace 自动复制。
Langfuse 用于实验配置，生产路线/预算分别归 8.3/8.4，8.6 统一已有入口。每条路径独立可用。

两条执行路径必须明确区分：

- **确定性 CI**：用冻结合成 fixture/输出、现有域规则及必要的实际代码执行检查回归；
  无模型凭据、无评测网络外发，不称已验证一个新模型的生成质量。
- **授权真实比较**：在相同样本/规则下实际运行基准与候选 prompt/model，候选与 judge
  都有独立可核查的成本/并发/重试/超时上限。只在可信人工授权任务运行，不自动放在每个 PR。

可复现的是输入、配置、评分器和证据。云模型别名变化、服务端实现或随机性意味着重复
调用未必逐字相同；记录实际版本信息和重复实验差异，不把 temperature=0 当作确定性承诺。

## Acceptance Criteria

### 1. Executable local baseline

**Given** 使用受版本管理的 WSL Node/pnpm 环境和已审核评测配置
**When** 执行确定性评测命令
**Then** 实际运行 fixture/adapter/assertions 并生成 JSON 和可读结果，不再使用 echo/no-op 门禁
**And** 无模型凭据或 Langfuse 服务时仍可完成确定性路径，不依赖 8.3/8.4/8.6

### 2. Scoped fixture inventory

**Given** 整理当前已交付能力及其关键回归
**When** 生成小型分组样本集
**Then** 覆盖导入/地理证据、required/顺路、节奏、住宿/行李/交通与一日游边界、编辑校验及填充/用户措辞，记录所属需求与预期结果
**And** 复用现有规则/fixture 而不重写 Planner；旧 HQ/15 分钟用户调时等只留兼容测试，不充当当前目标；必需分支未覆盖不得报通过

### 3. Production samples and direct-identifier filtering

**Given** 样本来自合成、测试、获准案例或授权范围内线上数据
**When** 运营选择样本或配置有界抽样，并将评测副本保存/发送给模型、judge 或 Langfuse
**Then** 在发送前筛查直接关联个人的姓名、证件、个人联系方式与账号标识，记录来源/范围、处理版本与结果；疑似残留转复核，不能静默放行
**And** 不因间接推测风险删除酒店 POI、日期、路线、时间、偏好等旅行上下文；区分人名与地点名、个人与公开商家联系方式，不宣称不可再识别匿名化
**And** key/Cookie/token/私有签名按独立凭据规则排除；不用原始 owner ID 作云端样本键，不将线上副本写入公共 Git/CI，默认不复制原始媒体
**And** 采用独立评测数据入口而非放宽 8.1 全量生产追踪；输出和人工评语也检查直接标识，处理失败只阻止该样本外发，不影响用户行程

### 4. Immutable run manifest

**Given** 开始一轮评测或复核历史结果
**When** 固定执行输入
**Then** 记录 run/attempt、基准、case IDs、dataset/schema/prompt/code/lockfile/评分器哈希、模型参数、去标识/规则/rubric 版本与运行模式
**And** 将 Langfuse label 解析成具体 prompt 版本，数据集导入/编辑形成新快照，不用浮动 latest 或仅靠名称复现；参考答案更新不追改旧结果

### 5. Fair baseline and candidate comparison

**Given** 对比基准与候选模型、提示或代码
**When** 计算差异
**Then** 对齐样本、schema、外部事实快照、时钟/时区和评分规则，明确本次受控变化
**And** 不兼容基准标记比较无效；过滤/减少用例不能静默改变分母或让失败消失
**And** 期望 case/variant/repeat 单元集合固定且逐键核对，不能误运行整个笛卡尔积扩大费用，也不能仅按总数判断样本相同

### 6. Replay, fresh and cache semantics

**Given** 使用固定输出、模型缓存或实际新请求
**When** 形成结果与性能/成本统计
**Then** 分别记录 replay/cache/live 模式及缓存身份，评分器变化重新评分，模型/prompt/输入不匹配不能复用旧输出
**And** replay 不证明新模型已运行，缓存耗时不冒充推理时延，实时 A/B 不混用一边热缓存和一边新调用

### 7. Rule-specific evaluation policy

**Given** 模型/adapter 输出可解析但可能违反业务约束
**When** 评估 schema、POI/证据、预约/交通/住宿、填充不改排期或用户措辞等规则
**Then** 每条规则具有 rule ID、适用条件、权重/容差、缺失值行为、处理方式及策略版本，可配置为计分、提醒或人工复核
**And** 不根据旧 hard 标签统一否决；确需阻断的个别规则另行明确批准后配置，不预设“任何硬失败必不通过”
**And** 正确返回未解决 required/自由时间/unknown 按对应场景预期判定，不要求塞满；不匹配规则记不适用而非失败
**And** 这是离线评价策略，不放宽已批准的运行时 Planner/Validator、权限/版本或普通代码测试合同

### 8. Branch-level quality verdict

**Given** 各项规则已执行且结果具备有效分数
**When** 比较质量指标
**Then** 展示逐规则/逐样本差异、适用分母、权重、规则处理方式和待人工项，再按版本化策略汇总
**And** 综合分允许按规则加权，但不隐藏反例；策略变更产生新评价版本，不反向擦掉旧分数/证据
**And** 样本不足、缺失或非有限分数标为证据不足，不自动评价模型更好/更差
**And** 总体结论按 manifest 全量结果/API 分页计算，不把 Langfuse 当前页过滤/聚合冒充全部样本

### 9. Model judge and human calibration

**Given** 某些表达/推荐质量需要模型 judge
**When** 显式启用语义评分
**Then** 固定 rubric/judge 版本、尺度与参数，先用人工标注小样本核对，并记录重复运行差异和异常
**And** 分开保存 code/model/human 来源，分歧按对应策略提醒或交人工判断，任何来源不静默覆盖其他分数
**And** 不只凭模型自评证明正确；被评内容是数据而非执行指令，保存简短证据/原因而非推理链

### 10. Complete result accounting

**Given** 用例可能完成、有规则发现、待人工、执行错误或尚未运行
**When** 汇总 run
**Then** 独立记录执行状态、自动评价、人工进度、最终评价和同步状态，展示计划/已执行/已评分数量及每项原因
**And** 缺样本、重复 case、评分器异常、无效配置/JSON 或中断不得被当成有效通过；基础设施失败不冒充模型质量差

### 11. CI completeness and policy interpretation

**Given** CI 已声明本次必须运行的评测范围
**When** 解析 runner 退出码和结构化结果
**Then** 独立核对精确结果集合和执行有效性，再应用本次已批准的逐规则策略；计分/提醒不会被 CLI 默认 hard fail 升格为统一否决
**And** 若必需人工复核未完成则报告待复核；若范围仅含自动检查则如实报告自动部分，不声称人工已完成
**And** 明确区分 runner 的断言退出与配置/进程/超时错误；后者不能用 continue-on-error 或改分母冒充有效评测，工具默认退出码不是唯一结论

### 12. Untrusted PR isolation

**Given** PR 可修改配置、JS provider、断言或 workflow
**When** 自动运行确定性评测
**Then** 在无模型/云凭据的隔离环境执行，评测网络/遥测关闭，最小 token 权限和固定依赖/可信门禁规则生效
**And** 不在有特权的 pull_request_target/workflow_run 中执行未审查 PR 配置；报告数据不作为脚本执行，不与可信付费任务共用可污染缓存

### 13. Authorized live lane

**Given** 维护者已批准受限真实模型实验和数据范围
**When** 调用基准、候选及可选 judge
**Then** 使用已审核版本/配置与服务端凭据，事先限定 case、并发、token、时间、重试和费用，不自动尝试其他模型
**And** 运行权限不会从普通 PR 推导；未授权/缺凭据标记未运行，普通 CI 不受可选 lane 未运行影响，但不能据此满足必需真实模型验收
**And** 无法确定可靠调用成本上界时不启动新的付费请求，不将响应后的 cost assertion 当作调用前预算保护

### 14. Costs and repeatability limits

**Given** Provider 返回 usage、不返回 usage 或存在重试/judge
**When** 记录实验消耗与重复结果
**Then** 区分候选、基准、judge、重试的实际/估算/未知值和定价版本，展示重复实验波动
**And** 未知不算零，不把一次运行/固定 seed 作为云模型逐字确定性的保证，不新增用户额度 UI 或集中计费引擎

### 15. Interruption and retries

**Given** 实验取消、超时、断网或 Provider/评分器出错
**When** 保存已有证据或显式重试
**Then** 保留原 run/attempt 状态与完成子集，新 attempt 关联原快照，是否复用结果明确记录
**And** 不盲目重跑成功的付费用例，不清除失败历史，不将配置已变的结果拼进旧 run；重试预算耗尽保留未完成/错误结论

### 16. Portable restricted reports

**Given** 一轮实验完成或中断
**When** 打开或归档 JSON/HTML 等可读报告
**Then** 可查看版本、范围、模式、逐项原因/差异、规则策略、人工评价、成本未知与检查和，并保留明确访问/保留策略
**And** 不默认公开分享，不将真实私人输入输出写进公共 CI 评论/日志；HTML 转义不可信内容，报告缺失或到期不能当作通过证据
**And** 线上样本、结果及评语加入 7.5 清理注册；受限来源映射支持定位评测副本，删除留无内容墓碑/失效说明，不能把报告摘要当作原始证据仍存在

### 17. Langfuse evaluation workspace and result bridge

**Given** 有已批准数据目标和已去直接标识的样本/结果
**When** 将 promptfoo/现有 Nomad runner 证据同步到受限 Langfuse 评测项目
**Then** 关联 dataset item、run/attempt、variant/repeat、prompt 与规则版本，支持查看必要输入输出、自动分数和并排差异，不再仅上传统计摘要
**And** 用稳定同步键做幂等映射，同步重试不得重跑模型或重复样本/分数；允许最终一致但显示待同步/失败，不能把未同步项当成空结果
**And** 使用隔离评测导出而非改变生产 tracing；Langfuse 不可用保留本地自动证据与待同步状态，不伪造人工完成或改写本地自动结论

### 18. Human scores, comments and review queue

**Given** 运营者被授权访问已处理样本和实验结果
**When** 进入 Langfuse 对比或人工评估入口
**Then** 可用版本化 rubric 录入数值、分类或布尔评分及简短评语，查看对应输入/输出和规则发现
**And** 必需人工项进入可筛选待办，已评分与未评分有事实进度；复用 annotation queue 或所选部署实际支持的过滤/逐项标注，不另造标注系统
**And** 标注绑定样本、结果版本、评分人/时间/量表；评论用于说明，不自动变成分数、用户反馈、黄金答案或生产指令
**And** rubric 的定义/hash 随评价冻结；不能仅用可编辑 Score Config 的 ID 证明量表不变
**And** 评语仅引用已处理上下文；误写直接身份信息有检查/清理路径，不声称 tracing mask 自动覆盖原生 UI 评论

### 19. Human decisions and evaluation revisions

**Given** 人工评价与自动规则或模型 judge 有分歧
**When** 运营复核并形成结论，或修改既有评分
**Then** 按对应规则记录接受/需调整/暂不能判断及理由，保留原自动事实；已回收/封存的评分保留旧快照，后续改分形成新评价，不重写已封存报告
**And** 同步人工评分并生成新评价快照不再次调用模型；rubric/样本变更不混算到原轮次，不承诺依赖付费审计功能才有基本修订记录
**And** 人工复核、跳过和结论需有实际记录，平台失联或未评不能默认为通过；复核不直接发布生产配置

### 20. Experimental prompt and model configuration

**Given** 运营想比较新提示或模型
**When** 在现有 Langfuse prompt/Playground 界面配置实验或从受限 CI 入口启动完整回归
**Then** 可以选择具体提示版本、允许的模型与参数、样本快照和评分策略，试跑结果可关联原版本并继续人工评分
**And** 单 prompt Playground/UI experiment 仅作为探索；完整 Nomad 多步骤回归经审核 runner 执行，二者模式分开，不冒充等价覆盖
**And** 所有付费入口受 AC13 的事前授权及限额控制，服务端密钥不返回浏览器；未配置连接时禁用真实调用并保留可读说明
**And** 不提供“改 Langfuse production label 即上线”的旁路；本 Story 只形成待评估版本，线上发布/回滚留给 8.3

### 21. Lightweight operator entry and real access

**Given** 运营使用现有登录授权的工具
**When** 打开评测、样本、评分和实验配置
**Then** 直接进入 Langfuse 对应项目/页面，完整回归复用已授权私有 CI 的固定任务入口，不要求先建 8.6 后台
**And** 最小操作链为选样本/版本、启动授权比较、查看逐例结果、人工评分、保存结论；不得交付只读截图或要求用数据库手改
**And** 访问被拒、无样本、待评分、同步失败、无 Provider/未授权调用分别有真实状态与恢复路径；不得公开项目或在 URL 中夹带密钥
**And** 验收所选服务版本/套餐的实际权限，不把专业审计/细粒度 RBAC/SSO 宣称免费标配；8.6 仅聚合已有入口
**And** 普通 Member 可能同时能改提示/数据集和试跑，不当作只评分角色；本期先供可信运营者，评测和生产访问实际隔离，不只区分 tag

### 22. No production side effects

**Given** 评测通过、失败或报告被查看
**When** 后续操作发生
**Then** 只形成评测证据，不自动修改 Provider 路由、预算、Plan/Trip、用户数据或发布基准
**And** 不实现 8.3-8.6 的生产治理能力、不发 Telegram、不引入另一评测 SaaS/公开后台，不因测试而触发真实导入/预订或 XHS 搜索

### 23. Readable review and truthful visuals

**Given** 开发者或运营者检查基准/候选与异常报告
**When** 展示总体和逐项结论
**Then** 明确区分规则提醒、人工待评/结论、实际配置的单项阻断和执行未完成；汇总不掩盖各项事实，操作语义是评估而非上线
**And** 复用成熟工具；必要示意明确标注合成数据/非厂商实际截图/非重复后台，不让图片数字冒充项目实测结果

### 24. Runner, policy and human-loop verification

**Given** 本 Story 准备交付
**When** 注入直接标识/名称误报、不同规则策略、评分 NaN/缺项/重复、缓存错配、无权限/中断、未知成本、同步失败与人工改分
**Then** 验证执行完整性、逐规则策略不被统一否决、数据处理不清除间接信息，以及真实去标识样本入选/结果同步/人工评分/评价修订链
**And** 确定性路径可独立运行；授权真实小样本与人工链有独立证据，不重复推理；工具故障不改变生产状态
**And** focused tests、工具链/构建及文档同步通过；SDK/配置/mock/echo 不算已交付，实际部署/权限和未测分支仍须明确核验

## Approved Visual

旧 `story-8-2-evaluation-report-r1.png` 的统一硬门禁与只读入口方向已被替代，保留作历史。
当前 `story-8-2-evaluation-human-workspace-r2.png` 说明版本比较、逐例人工评分与实验配置。
全部是合成场景，不是 Langfuse 实际截图或新建整套后台的要求；入口优先复用厂商项目。
图和完整 Story 已于 2026-09-08 批准；原型不能证明许可、权限、去标识或功能已接入。

## Next Gate

24 条 GWT 已追加，源文档/镜像/状态已同步。下一张为 Story 8.3 任务级 Provider 路由与
安全切换，先依已批准拆分委派 GitHub/官方资料调研，再给出合同和必要原型。
本次不表示 8.3 已研究或批准；CE 仍在 Step 3，不运行最终验证/IR/SP 或恢复业务实现。
