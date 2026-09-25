---
project: nomad-mvp
date: 2026-09-07
story: '8.2'
status: research-retained-selection-superseded
supersededBy: story-8-2-langfuse-operator-addendum-2026-09-07.md
delegatedAgents: 2
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.2 成熟评测实现调研

**本建议已被同日用户批注修正。** 以下保留首轮调研证据；“统一硬门禁、线上样本默认排除、
Langfuse 仅安全摘要”的选择不再有效。当前采用建议见
`story-8-2-langfuse-operator-addendum-2026-09-07.md`；逐规则评价和线上去直接标识数据
以 `../evaluation-operator-scope-decision-2026-09-07.md` 为准。

## 执行与范围

- Schrodinger 研究 promptfoo 配置、Node/CI、断言、缓存、错误口径、安全与许可，
  见 [promptfoo 报告](story-8-2-promptfoo-agent-2026-09-07.md)。
- Ptolemy 研究 Langfuse experiments/datasets 与 DeepEval、Inspect AI，
  见 [替代与互补方案报告](story-8-2-evaluation-alternatives-agent-2026-09-07.md)。
- 主 agent 核对本地历史配置、CI 和域测试，复核官方文档，并只读获取版本化
  `doEval.ts` 核对通过率分支。两条研究均包括 GitHub；未安装工具/调模型/注册服务。

结论是技术选型建议，不是实际兼容、性能或模型质量验收。8.1 的正式批准不使 8.2 自动获批。

## 建议

**保留 promptfoo 作为执行器，增加最小 Nomad 结果门禁；Langfuse 只做可选安全摘要发布。**

| 方案 | 可复用价值 | 局限与适用决定 |
| --- | --- | --- |
| promptfoo | Node/TS 集成、配置化矩阵、规则与模型断言、多种报告 | 首选；必须独立检查硬失败、执行错误和精确用例集合，不能照抄默认通过率 |
| Langfuse | 已有运维工具，可关联版本、run 和分数 | 可选 post-run 摘要；不把托管 dataset/experiments 变成本地 CI 前置或复制另一份私有数据 |
| DeepEval | 丰富的语义/agent 指标，可供后续评估 | 当前不引入额外运行栈/Confident 平台；TS 覆盖和 Python 桥接成本仍需独立核验 |
| Inspect AI | 组合式评测、工具任务和详细样本日志 | 适合以后复杂 agent 实验；当前增加 Python 与日志治理，没有足够额外价值 |

这减少矩阵调度、断言接口和报告渲染的自研工作；Nomad 仍负责旅行不变量、数据批准、
版本 manifest、结果完整性、CI 权限与实际预算。没有一个工具能保证云模型逐字可复现，
也不能凭已有评分函数证明我们的行程更好。

来源：[promptfoo GitHub](https://github.com/promptfoo/promptfoo)、
[配置参考](https://www.promptfoo.dev/docs/configuration/reference/)、
[Langfuse experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)、
[DeepEval](https://github.com/confident-ai/deepeval)、
[Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai)。

## 核验后的重要约束

### 1. 工具门禁不等于业务门禁

研究检查了 promptfoo 0.122.2 的
[版本化 doEval 源码](https://github.com/promptfoo/promptfoo/blob/0.122.2/src/node/doEval.ts)：
总体通过率包含 successes/failures/errors，CLI 在比率低于配置阈值时设置失败退出码。
所以 99 个成功加 1 个执行错误、阈值 99 的组合不会触发该低于阈值分支。
这是源码分支推导，不是本轮实际跑通的 end-to-end 结果；不能将它表述为所有错误都会退出 0。

Nomad 的门禁须额外核对期望的 case/variant/repeat 单元键集合、执行完整性、错误数、
硬规则和独立质量阈值，零样本/NaN/缺报告/评分异常均不通过。硬断言不采用可被加权平均
抵消的配置。仅检查 `.failures` 或只看 CLI exit code 不够。
参考 [断言文档](https://www.promptfoo.dev/docs/configuration/expected-outputs/)。

### 2. 本地配置和 CI 不是现成能力

历史 YAML 把 tests/provider 放在 prompt 下，使用旧 assertions/json-schema/thresholds 字段；
现行文档结构是顶层 prompts/providers/tests、逐项 assert，JSON Schema 通过 is-json。
已有 CI 仅 echo，Node20 也不满足所检查版本声明的 Node >=22.22.0。
实施时锁定与 WSL Node22 相容的具体版本和 lockfile，不能直接照搬官方 npx latest 示例。
本轮仅源码/文档核对，未安装或运行 runner。
参考 [Node API](https://www.promptfoo.dev/docs/usage/node-api-reference/)、
[版本 package.json](https://github.com/promptfoo/promptfoo/blob/0.122.2/package.json)。

### 3. 安全复用，而非原样复制 CI 示例

promptfoo 官方 CI 示例存在自动付费比较、share、浮动版本/宽缓存等便捷用法；它们不自动
符合 Nomad 约束。采用锁定本地 CLI/Node API 和受限 artifact，评测不公开分享。
不信任 PR 的配置/JS/结果文件，更不能带凭据执行其脚本。确定性 lane 的网络和遥测应关闭，
付费 lane 使用独立可信配置、明确授权和缓存命名空间。
参考 [官方 CI 集成](https://www.promptfoo.dev/docs/integrations/ci-cd/)、
[工具安全模型](https://github.com/promptfoo/promptfoo/blob/0.122.2/SECURITY.md)、
[GitHub Actions 安全规则](https://docs.github.com/en/actions/reference/security/secure-use)。

工具 cost assertion 是响应后的检查，不是调用前的花费上限。真实比较需在调度前确定样本
矩阵、模型/judge/重试、token/time/call 上限；不能可靠估计成本上界时不启动新的付费调用。
无需等待 8.4 集中预算中心，但也不以检查结果中 cost 字段代替本期最小保护。

### 4. Langfuse 不作为第二个 runner

其 SDK experiments 自动追踪，local dataset 不等同 hosted dataset run；数据集版本与 schema
也不天然是一个不可变快照。两处官方页面对特定版本 pinning 描述不完全一致，所以本地
manifest/schema 哈希仍为权威，实施再验证选定版本。
本期只允许经批准的安全摘要/分数发布，默认不镜像样本输入输出或在上传时重跑实验。
参考 [SDK experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)、
[datasets](https://langfuse.com/docs/evaluation/experiments/datasets)。

### 5. 运维与许可

所检查 promptfoo package 声明 MIT，但 basic self-hosted viewer 缺少完整鉴权/RBAC，
不应直接作为公网生产后台；先使用本地/CI 受限报告。Langfuse 的保留、权限与高级治理
依具体套餐/许可，不能把免费访问窗口当物理删除承诺。其他候选的许可与具体差异详见
agent 报告。本轮不选择付费套餐或承诺免费额度够用。
参考 [promptfoo self-hosting](https://www.promptfoo.dev/docs/usage/self-hosting/)、
[Langfuse retention](https://langfuse.com/docs/administration/data-retention)。

## 未验证事项与交付门禁

具体 CLI/SDK 兼容、目标 fixture 覆盖、JSON Schema 方言、断言/skip/timeout 行为、缓存隔离、
配置安全、artifact 访问/清理、实际模型/judge 预算与质量，均需实施时真实检查。
源码推导和示例图片不能代替一轮授权模型比较；固定输出通过也不能冒充新模型生成能力。
当前建议不改现有业务语义、生产路由或 Story 8.1 的隐私边界。
