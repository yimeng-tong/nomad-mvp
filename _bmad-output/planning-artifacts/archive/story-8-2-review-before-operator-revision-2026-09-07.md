---
project: nomad-mvp
date: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
epic: 8
story: '8.2'
status: superseded-by-user-annotations
supersededDate: 2026-09-07
storyApproved: false
visualApproved: false
appendedToEpics: false
researchDelegated: true
researchStatus: complete
researchDecisionApproved: false
---

# Story 8.2 Review: 可复现的质量回归与版本对比

历史草案。其生产样本限制、统一硬门禁、Langfuse 仅摘要方向已被用户批注替代，
当前评审见上一级 `story-8-2-review-2026-09-07.md`，不得据此实施或要求重新批准旧方向。

Story 8.1 的 20 条 GWT、Sentry/Langfuse 隔离追踪方向与 Walkthrough R1 已批准并追加。
本 Story 仍在详细评审，不批准生产模型变更、付费调用、云账户或业务代码实施。

## Story

As a Nomad 开发者与运营者，
I want 在修改提示词、模型或编排代码后，用同一套版本化样本比较结果，
So that 我能判断质量是否倒退，并阻止更高平均分掩盖行程硬约束回归。

**Requirements:** FR13（promptfoo 离线 A/B）、FR33（规划质量与回退事实）；
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

## Research Recommendation

两位 agent 已完成 promptfoo 与 Langfuse/DeepEval/Inspect AI 调研，主 agent 核验本地基线、
官方来源及 promptfoo 门禁源码。见 `research/story-8-2-mature-implementations-2026-09-07.md`。
建议保留 promptfoo，增加小型结果完整性/硬约束检查；Langfuse 只可选发布安全摘要，不新增
另一套 runner 或云实验平台。具体版本为候选，实际兼容、费用和质量尚未实测，采用方向待批准。

## Proposed Scope

复用 promptfoo 的执行/断言/对比与报告能力，加最小 Nomad adapter 和结果门禁；不自建评测平台。
确定性检查和受限 JSON/可读报告独立可用，不依赖 Langfuse、8.3 路由、8.4 预算中心或 8.6 总览。
Langfuse 仅考虑可信运行结束后的安全结果摘要，不默认同步完整输入输出/托管数据集或重跑模型。

两条执行路径必须明确区分：

- **确定性 CI**：用冻结合成 fixture/输出、现有域规则及必要的实际代码执行检查回归；
  无模型凭据、无评测网络外发，不称已验证一个新模型的生成质量。
- **授权真实比较**：在相同样本/规则下实际运行基准与候选 prompt/model，候选与 judge
  都有独立可核查的成本/并发/重试/超时上限。只在可信人工授权任务运行，不自动放在每个 PR。

可复现的是输入、配置、评分器和证据。云模型别名变化、服务端实现或随机性意味着重复
调用未必逐字相同；记录实际版本信息和重复实验差异，不把 temperature=0 当作确定性承诺。

## Proposed Acceptance Criteria

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

### 3. Dataset provenance and privacy

**Given** 样本来自合成数据、既有测试或厦门案例
**When** 纳入版本库或向模型发送
**Then** 标注来源、许可/批准范围与脱敏检查；默认只用合成/明确获准的脱敏数据
**And** 不自动抽取生产 trace、反馈、完整私人行程/媒体/链接；案例曾被列为 QA 输入不等于已获云端传输授权

### 4. Immutable run manifest

**Given** 开始一轮评测或复核历史结果
**When** 固定执行输入
**Then** 记录 run/attempt、基准、排序后的 case IDs、dataset/schema/prompt/code/lockfile/评分器哈希、模型参数、策略版本与运行模式
**And** 不使用浮动 latest 数据集或仅靠名称复现；测试规则/基准更新独立评审，不自动重写旧黄金答案

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

### 7. Domain hard gates

**Given** 模型/adapter 输出可解析但可能违反业务约束
**When** 执行确定性验收
**Then** 校验 schema、可信 POI/证据、不可变预约/交通/住宿范围、owner/版本隔离、填充不改排期和保留用户措辞等适用不变量
**And** 任一硬失败不能被平均分抵消；可行性不足但正确返回未解决 required/自由时间/unknown 的样本按明确预期判定，不强求塞满

### 8. Branch-level quality verdict

**Given** 硬门禁已计算且结果具备有效分数
**When** 比较质量指标
**Then** 显示每类/每样本回归、覆盖、基准差异和版本化门限，关键分支退化可独立阻止通过
**And** 不只报告一个平均分，不把样本量不足、缺失或非有限分数作为高质量结果

### 9. Model judge is advisory to hard rules

**Given** 某些表达/推荐质量需要模型 judge
**When** 显式启用语义评分
**Then** 固定 rubric/judge 版本、尺度与参数，先用人工标注小样本核对，并记录重复运行差异和异常
**And** judge 不覆盖硬失败，不能只凭自评证明正确；被评内容是数据而非执行指令，不输出推理链或把任意 judge 文本放入遥测

### 10. Complete result accounting

**Given** 用例可能通过、硬失败、质量回归、执行错误或尚未运行
**When** 汇总 run
**Then** 独立记录执行状态与门禁结论，展示计划/已执行/已评分数量及每项原因
**And** 缺样本、重复 case、评分器异常、无效配置/JSON 或中断不得被当成有效通过；基础设施失败不冒充模型质量差

### 11. Effective CI gate

**Given** CI 已声明本次必须运行的评测范围
**When** 解析 runner 退出码和结构化结果
**Then** 只有必需用例完整且硬/质量门禁通过才通过检查；返回非零、结果缺失/错误或超时按明确失败/未完成处理
**And** 不仅依赖加权 pass rate 或工具默认退出码；不得用 continue-on-error、降低分母或忽略异常使其变绿

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
**Then** 可查看版本、范围、模式、逐项原因/差异、门禁、成本未知与检查和，并保留校验摘要和明确访问/保留策略
**And** 不默认公开分享，不将真实私人输入输出写进公共 CI 评论/日志；HTML 转义不可信内容，报告缺失或到期不能当作通过证据

### 17. Optional Langfuse result publication

**Given** 已有本地权威结果且已授权向现有 Langfuse 项目发布安全摘要
**When** 可信 post-run 步骤发布
**Then** 仅发送允许的版本/合成 run 引用/计数/分数，不默认镜像数据集、样本输入输出或 evaluator 文本
**And** 复用 8.1 显式隔离追踪，不重跑推理；上传失败只影响发布状态而不改变本地门禁，无 Langfuse 仍可验收核心能力

### 18. No production side effects

**Given** 评测通过、失败或报告被查看
**When** 后续操作发生
**Then** 只形成评测证据，不自动修改 Provider 路由、预算、Plan/Trip、用户数据或发布基准
**And** 不实现 8.3-8.6 管理能力、不发 Telegram、不引入另一评测 SaaS/公开后台，不因测试而触发真实导入/预订或 XHS 搜索

### 19. Readable review and truthful visuals

**Given** 开发者或运营者检查基准/候选与异常报告
**When** 展示总体和逐项结论
**Then** 明确区分硬失败、质量回归与执行未完成；更高软分不能掩盖阻止原因，操作语义是查看证据而非部署模型
**And** 优先复用成熟报告，必要示意明确标注合成数据/非新增后台，不能让图片里的数字冒充当前项目实测结果

### 20. Runner and gate verification

**Given** 本 Story 准备交付
**When** 注入硬失败、评分 NaN/异常、少项/重复项、缓存错配、恶意配置/HTML、无凭据、中断、未知成本和云发布失败
**Then** 真实 runner 与外层门禁给出预期结论，确定性路径可独立运行，授权真实小样本有独立结果证据
**And** focused tests、项目工具链/构建及文档同步通过；SDK、配置文件、mock 成绩或 echo 不算评测已接入，未实测项保留为门禁

## Proposed Visual

`_bmad-output/implementation-artifacts/visual/story-8-2-evaluation-report-r1.png`
由内置 imagegen 生成，全部为合成示例：A 的 run_demo_18 已执行完但候选 23/24 硬检查通过，
语义分数更高仍不通过；B 展开同一 run 的冻结预约失败；C 的 run_demo_19 中断，不形成质量结论。
24 是示意样本数而非产品限制；实际比较还要记录两侧 variant/repeat 单元与已评分数量。
此图解释报告语义，不是新 Nomad 后台或 promptfoo/Langfuse 实际界面还原。入口是开发者本地
或受限 CI artifact，后续 8.6 可关联摘要；用户旅行页面没有评测入口。图和 Story 均待批准。

## Next Gate

结合两份 GitHub/官方调研给出采用建议，并展示报告示意与主要验收标准，等待用户确认。
当前不追加 8.2 GWT、不切换模型或运行实际评测；后续仍保持 CE Step 3 逐张批准。
