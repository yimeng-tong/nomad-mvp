---
project: nomad-mvp
date: 2026-09-07
story: '8.2'
status: research-complete-revised-selection-approved
selectionApprovedDate: 2026-09-08
delegatedAgentsThisRevision: 2
upstreamRelease: v4.30.0
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.2: 人工评估与轻量运营方案

## 决定摘要

用户三条批注已改变原建议：**线上数据去直接标识后可以评测；质量逐规则判定；人工评分
必须可用，不能仅把 Langfuse 当统计摘要出口。** 本文替代首轮研究的采用结论，不抹掉其
工具接口/Node/CI 风险证据。需求来源见 `../evaluation-operator-scope-decision-2026-09-07.md`。

已批准 **Langfuse 管评测操作界面，promptfoo 管确定性 CI 和完整 Nomad 回归执行**。
轻量是复用现成 UI/执行入口，不是承诺自托管部署很轻。采用方案、原型和整张 8.2 于
2026-09-08 获批；以下研究证据仍为 2026-09-07 的只读核验，不代表新一轮实测或部署许可。

## 委派与主审

- Archimedes：人工分数、评语、标注队列、对比中评分、版本与套餐，见
  `story-8-2-langfuse-human-review-agent-2026-09-07.md`。
- Fermat：prompt/config、Playground、UI/远程实验、轻入口、许可与部署代价，见
  `story-8-2-langfuse-operator-capabilities-agent-2026-09-07.md`。
- 主 agent：复核现有 8.x 合同、官方人评/队列/Playground/masking/OTEL/集成文档，
  并读取固定 commit 的实验表、Score Config 更新及 Member 角色源码。

GitHub 当前公开 release 为 v4.30.0，固定 commit 为
`2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd`，见 [release](https://github.com/langfuse/langfuse/releases/tag/v4.30.0)。
此处不是 Nomad 已部署版本证明；本轮未安装、调模型、上传样本、登录实例或创建账户。

## 能力与采用范围

| 成熟能力 | 对 Nomad 的用途 | 本期建议与边界 |
| --- | --- | --- |
| 人工 numeric/categorical/boolean scores + 评语 | 对可执行性、完整性、推荐质量给分或判定 | 8.2 必交，直接从实验逐项对比进入；人工和 code/judge 分开保存 |
| Annotation Queues | 集中处理未评/有分歧样本，完成后跳下一项 | 8.2 复用一个小型待评队列；不扩展双盲、多人仲裁或外包标注平台 |
| Dataset 与预期输出 | 把线上典型场景/纠正后的预期保留作新回归样本 | 8.2 固定输入、item/schema/去标识版本；编辑产生新快照，不自动改黄金答案 |
| 实验并排比较与逐项筛选 | 比较同样本不同模型/提示，查看具体退化 | 8.2 采用；当前 UI 页内统计不能充当全实验权威结论 |
| Prompt 版本/标签/config | 调整实验提示、模型参数，追踪变化 | 8.2 实验可用；标签先解析为具体版本，不能自动推动生产发布 |
| Playground / UI Prompt Experiment | 单条试提示/模型，或小样本 prompt 比较 | 8.2 受控探索，使用实验专用连接；不等价完整 Planner/Validator/Filler 回归 |
| LLM-as-a-Judge / code scores | 自动初筛，减少人逐条检查负担 | 8.2 按需开启、用人工校准；不重复运行另一套相同评测，不强制统一否决 |
| Scores/Experiments API 与 OTEL | 关联一次真实执行的输入输出/分数，回收人评 | 8.2 最小适配；重传/回收不再调用模型，最终评价用独立快照 |
| 图表、成本/时延与过滤 | 查看长期质量、消耗和异常分布 | 8.6 复用聚合；指标/未知口径继承 8.1，不重造 BI |
| 远程 Custom Experiment | 在 Langfuse 中触发完整应用 runner | 可行但增加 webhook 鉴权/网络/防重放成本；本次先用私有 CI 固定任务链接，后续如需同页触发再独立确认 |

证据：[人工评分](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-ui)、
[队列](https://langfuse.com/docs/evaluation/evaluation-methods/annotation-queues)、
[数据集](https://langfuse.com/docs/evaluation/experiments/datasets)、
[Prompt Config](https://langfuse.com/docs/prompt-management/features/config)、
[Playground](https://langfuse.com/docs/prompt-management/features/playground)、
[UI 实验](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui)、
[SDK/远程触发](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)、
[Scores API](https://langfuse.com/docs/api-and-data-platform/features/scores-api)。

## 用户实际怎么用

1. 从受限 Langfuse 项目进入样本/提示词，选择基准和候选的具体版本。
2. 单 prompt 先在 Playground 试跑；完整 Nomad 流程打开私有 CI 的已审核固定实验任务。
3. 同一次执行的处理后输入输出、逐规则分数同步为可对比实验，不为了展示再次推理。
4. 进入待评队列/比较行，看上下文，评分并写简短评语。每条规则按其策略计分、提醒或人评。
5. 回收人评后封存本轮评价；后续改分形成新的评价快照。结论不直接切换线上模型。
6. 到 8.3 才做生产路由的验证/发布/回滚，8.4 管预算，8.6 汇总这些已独立可用的入口。

原生 Custom Experiment 确实能减少页面切换，但不是免费的安全任务服务：需网络可达的
HTTP 接口、签名、白名单配置、幂等、防重放、既有任务状态和调用前限额。本次不把这整套
接入暗中塞入 8.2，也不 fork Langfuse 改导航。受限 CI 是另一页面，原型箭头不宣称厂商
已自带 Nomad 专用按钮。

## 必须自行补足的部分

### 1. 样本处理是独立入口

线上样本允许入选；只筛查直接身份字段，结构化字段替换与文本实体检测需区分人名/地名、
个人联系方式/公开商家电话，并测试漏报/误报。普通酒店 POI、日期、交通、路线、偏好
不因组合可能间接识别就删除。直接标识不确定时仅将该样本送人工复核，不扩大成间接推测规则。
凭据安全、权限/目的范围、外发目标及保留/7.5 清理另行执行；这不等于不可再识别匿名化。

8.1 生产 traces 继续安全摘要。评测副本用单独访问边界，完整必要上下文不进入生产日志、
OTEL baggage 或公共 CI；仅改 environment/tag 不等于权限隔离。处理失败不影响原用户计划。

Langfuse 的 [masking hook](https://langfuse.com/docs/observability/features/masking)
可在 trace 导出前处理内容，但**不证明 Dataset API、CSV 导入或原生 UI 评论都会经过它**。
样本/结果须在应用入选层处理；人评只引用已处理上下文，不写身份信息。误输入身份信息的
评论须能筛查并清理/修订，不能凭开启 SDK mask 宣称所有途径已经脱敏。

### 2. 不把厂商汇总当全量结果

主审查阅 [实验表固定源码](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/experiments/components/table/ExperimentItemsTable.tsx#L1596-L1626)：
该处 score header/matrix 依据当前已加载页，比较过滤也只筛这页。Nomad 从精确 manifest
和完整结果/API 分页核对所有 case/variant/repeat，再生成总体评价；不要求改写厂商表格。
提醒可以影响综合分但不统一否决；确需阻断的单条规则另行对齐。未完成则无完整比较结论，
与模型好坏、运行时业务保护分开。

### 3. 版本必须冻结具体内容

[Score Config 文档](https://langfuse.com/faq/all/manage-score-configs) 同页既有 immutable
旧描述，也有允许编辑的章节；[固定服务源码](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/web/src/features/public-api/server/score-configs-api-service.ts#L70-L108)
确有 update。故 rubric 必须独立记录版本/定义/hash，不能仅靠 configId；新尺度不与旧分数混算。
数据集 item 时间戳版本不覆盖 schema，prompt label 是可变引用。主 manifest 固定这些值，
人评回收封存为独立快照；不宣称免费 UI 自动保存每次未提交编辑的不可篡改历史。

### 4. 两个工具需要最小桥接

[promptfoo Langfuse 集成](https://www.promptfoo.dev/docs/integrations/langfuse/) 证明 managed
prompt 读取和 trace 拉取，不证明现成的全结果/人评分双向同步。
[OTEL experiment 路径](https://langfuse.com/docs/evaluation/experiments/experiments-via-opentelemetry)
允许用 experiment/item 元数据归组 span，适合作为同一次执行的结果桥接。
Nomad 需负责稳定映射/幂等回执/完整性与人评分回收；不要依赖多个全局 OTel provider 或
重跑模型导入“新结果”。选定版本的实际归组、分页、评分目标和重传必须真实测试。

## 可行性与代价

**收益：** 原生登录、样本管理、并排对比、评分表单、队列和 prompt 编辑可复用；开发集中在
旅行规则、数据筛查、版本证据和结果关联，而非自建操作后台。

**代价：** 多一份评测数据需治理，promptfoo/Langfuse 需适配；免费普通 Member 并非只评分
角色，还能改 prompts/datasets 和执行实验，见
[角色源码](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/packages/shared/src/features/rbac/projectAccessRights.ts#L218-L260)。
MVP 可先面向同一可信运营者，使用隔离评测组织/项目与受限实验连接；不能向不可信标注员
发放 Member 后宣称其只有打分权限。Playground 的调用前费用限制需由实验专用凭据/
现有受控服务保证，UI 中填 token 上限本身不是完整费用保护。

**免费/付费：** 核心人评、队列、提示管理、实验在 OSS 自托管中可用，不必为了录分购买
企业版；Cloud 小规模套餐可用但有队列/人数/数据窗口限制。项目级 RBAC、内置保留/
审计等治理另有付费边界，实际账号/套餐须验证。自托管需要 Web/worker、PG、ClickHouse、
Redis 和对象存储，不能把现成 UI 的轻便理解为低内存服务器一定能承载。
见 [自托管功能/价格](https://langfuse.com/pricing-self-host)、[Cloud](https://langfuse.com/pricing)、
[EE](https://langfuse.com/self-hosting/license-key)、[Compose](https://langfuse.com/self-hosting/deployment/docker-compose)。
本轮不选套餐、不部署，不承诺某个现有主机容量满足。

## 交付边界

建议 8.2 的单开发代理范围仅为一个小型基准、一套逐规则策略、一个既有工作区的人评闭环，
以及已审核实验入口/结果桥接。不新建 generic admin CRUD、远程 webhook 服务或平台治理中心。
如果目标版本实际不能完成该最小闭环，先收缩/拆分并对齐，不能靠隐藏缺项通过验收。
确定性 CI 断开 Langfuse 仍能跑；但没有真实人工评分链不能宣称整个 8.2 已交付。
