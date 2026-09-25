---
project: nomad-mvp
story: '8.2'
date: 2026-09-07
status: bounded-research-complete-selection-proposed
runtimeValidated: false
deploymentAuthorized: false
---

# Story 8.2: Langfuse 配置与轻量运营入口

主 agent 范围校正：本报告技术证据保留；下文沿用的“硬门禁”不得解释为任意硬失败
统一否决。最新用户要求是逐规则策略，线上样本去直接标识后可入选，见
`../evaluation-operator-scope-decision-2026-09-07.md`。运行时安全与执行完整性仍独立检查。

## 结论与证据边界

**建议保留 promptfoo 执行 CI/完整 Nomad 流程，复用 Langfuse 的提示词工作区、单提示词 Playground 和结果复核；不要为了同步再执行一次相同任务。** 原生 UI Prompt Experiment 不会自动执行 Planner、Validator、Filler 或 Nomad 的权限/硬门禁。

已读 `CURRENT.md`、项目上下文、历史 sprint/实施入口、当前 8.2 review，以及同目录 `story-8-2-mature-implementations-2026-09-07.md`。后者的“仅安全摘要”是已有提案；按本次最新委派，补充评估**独立评测数据路径中经批准、按明确 ID 筛选的完整上下文**。这不放宽 8.1 生产追踪的摘要安全边界，也不替主 agent 批准或修改 Story。人工评分细节由另一 agent 负责。

核验日期为 2026-09-07，证据为官方文档、公开 GitHub API 与固定版本文件；没有注册、部署、安装依赖、上传数据或调用模型。GitHub `releases/latest` 实时返回 **v4.30.0**，发布于 **2026-09-04 16:02:41 UTC**；tag 指向 `2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd`。官网当前为 v4 文档；搜索索引仍可返回旧 v3，不能用其“latest”推定现状。未验证 Nomad 实际部署或 SDK 兼容性。[版本发布](https://github.com/langfuse/langfuse/releases/tag/v4.30.0)、[tag API](https://api.github.com/repos/langfuse/langfuse/git/ref/tags/v4.30.0)

## 可直接复用什么

| 能力 | 官方确认与对 Nomad 的意义 |
| --- | --- |
| Prompt 版本/标签 | 支持 text/chat；修改形成新版本，标签是可移动指针。`latest` 指最新版本，省略选择条件默认取 `production`；UI 可看 diff、移标签回滚。实验必须解析并冻结实际版本及内容哈希，不能仅存标签名。缓存意味着标签移动不等于所有客户端瞬时切换。[数据模型](https://langfuse.com/docs/prompt-management/data-model)、[版本控制](https://langfuse.com/docs/prompt-management/features/prompt-version-control)、[缓存](https://langfuse.com/docs/prompt-management/features/caching) |
| 版本化配置 | Prompt `config` 是任意 JSON，可存 `model`、温度、token 上限、`response_format`、`tools/tool_choice`，通过 UI/SDK 与提示词一起版本化。**它是供调用代码消费的数据，不是自动生效的 Nomad 配置服务**；adapter 需校验字段、支持范围与优先级。[Config](https://langfuse.com/docs/prompt-management/features/config) |
| Playground | 浏览器编辑、并排比较多个变体，逐变体保留模型参数、变量、工具及 message placeholders；可打开受管 prompt/已有 generation，并另存版本。支持 JSON Schema 结构化输出、工具定义及 mock 工具响应；这不证明真实工具副作用或完整 agent 流程已运行。导入 tool observation 当前要求 OpenAI ChatML 格式。[Playground](https://langfuse.com/docs/prompt-management/features/playground) |
| 模型/Provider 连接 | `Project Settings > LLM Connections` 配置凭据；支持 OpenAI/Azure、Anthropic、Google AI Studio/Vertex、Bedrock，以及兼容适配器的自定义模型、Base URL/网关。额外 provider options 在调用设置中配置；当前文档也有 Responses API 开关。需逐模型验证 tools/schema/参数兼容，不能把“OpenAI-compatible”理解为所有能力等价。[LLM Connections](https://langfuse.com/docs/administration/llm-connection) |
| 浏览器数据集实验 | `Datasets > Start Experiment > Prompt Experiment` 选择提示词、连接、数据集及可选 schema/evaluator，后台执行并比较 run。输入 JSON 键须匹配变量；message placeholder 可映射历史消息，但其内部变量不会再次解析。适合单提示词回归，不能代替 Nomad 端到端门禁。[UI Experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui) |

**数据集版本存在官方文档不同步：** Datasets 页和 2026-02-11 changelog 明确说明 UI/API/SDK 可选版本时间戳，但 UI/SDK Experiments 页仍写只运行 latest。不能据旧段落断言“不支持”，也不能仅凭新说明宣称目标部署已验证。数据集 schema 不随 item 版本变化；仍须保存 item IDs、版本时间戳、schema/prompt/config/code 哈希及本地权威 manifest。[Datasets](https://langfuse.com/docs/evaluation/experiments/datasets)、[版本实验发布说明](https://langfuse.com/changelog/2026-02-11-versioned-dataset-experiments)

## Runner 与集成边界

- **SDK/API 能力可复用，不必复用第二个 runner。** Python/JS-TS SDK 支持 prompt CRUD、指定版本读取/编译、dataset 与 score API；实验 SDK 可运行自定义 task，提供并发、逐项/整轮 evaluator 和追踪。Nomad 已选 promptfoo 时，无需把同一任务再包进 `runExperiment` 重新推理。[SDK Experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)、[Public API](https://langfuse.com/docs/api-and-data-platform/features/public-api)
- **promptfoo 集成不等于完整成绩同步。** 官方集成主要说明 `langfuse://` 受管提示读取及外部 trace 拉取，没有证明完整结果/评分自动回写。当前 trace provider 按 `traceparent` 的 trace ID 查询 Langfuse v2 Observations API，适用 Cloud/v4；老摄取链路的可见性延迟仍须核验。[promptfoo Langfuse 集成](https://www.promptfoo.dev/docs/integrations/langfuse/)、[trace 获取](https://www.promptfoo.dev/docs/tracing/)
- **结果归组可不重跑模型。** 官方 OTEL 路径用 experiment/dataset/item 元数据把 span 归为实验；每 item 一个 trace，root 标记输入/输出与根 observation ID，score 关联该根的 `traceId/observationId`。可在同一次 promptfoo 执行产生的 span 上附加这些属性后导出；这不是任意已入库历史 span 都可无损追加属性的承诺。[OTEL Experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-opentelemetry)、[属性与关联规则](https://langfuse.com/integrations/native/opentelemetry/experiments)
- **最小适配建议：** 一个共享 manifest 和 `run/attempt/case/variant/repeat -> trace/root/score` 映射；把已有输出与门禁结果发布到允许的目标，记录发布回执、幂等键和失败状态。重试只补传，不能重调模型。原始报告、硬失败、缺项/NaN/执行错误仍由 Nomad 本地检查器裁决，云端聚合分数不反向把失败变绿。

旧 SDK 文档描述 local dataset 不产生托管 dataset run；v4 OTEL 指南允许本地 dataset/item 关联 ID 合成实验。应按选定服务端/SDK 验证 UI 实际归组，不能把旧路径限制泛化为全部 v4 能力。新 trace 写入优先 OTEL；官方已标记旧 ingestion 的 trace/observation 写入弃用，SDK score 写入另有兼容说明。[SDK 路径](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)、[API 版本说明](https://langfuse.com/docs/api-and-data-platform/features/public-api)

## 单开发者的轻量入口

**不新建模型管理后台。** 提示编辑/单条试验留在原生 Playground，结果复核留在 Langfuse；完整流程只触发现有受控执行器。以下是实施建议，不是本轮已接通能力。

| 入口 | 优点 | 成本与决定 |
| --- | --- | --- |
| 私有 CI 的手动运行链接 | 复用仓库身份、可信 workflow、状态与受限 artifact；没有新公网 webhook 服务 | 切换页面，需有仓库权限，不能称 Langfuse 内一键运行。单人最低交付成本，可作为先落地或降级入口；固定 recipe/commit，不允许任意脚本或浮动配置。 |
| Langfuse 原生 Custom Experiment 触发 | 运营在数据集页面点 Run，保留同一工作区，无需自研表单或 runner | 官方要求外部 HTTP endpoint；它仍负责实际 Nomad 执行。推荐在“浏览器内启动”是必需体验时，加一个受限触发适配层，复用既有 CI/执行进程；不要另外建设任务平台。 |

原生路径为 `Datasets > Start Experiment > Custom Experiment`，配置 endpoint 与默认 config。**用户可修改 config，HMAC 签名为可选开启**；请求含 dataset ID/name 与 config，endpoint 应快速返回 2xx、异步执行。官方机制并不自动提供 Nomad 的批准/预算/完成状态契约。[Remote Experiment 设置](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#optional-trigger-sdk-experiment-from-ui)

适配层只接受白名单 `recipeId`、冻结 manifest/commit、获准的 dataset/item ID 集合与受限候选；服务端核验签名、授权、防重放/重复提交及费用上界，拒绝 URL、命令、凭据或任意 JSON 覆盖运行策略。复用持久 CI run ID 与状态；2xx 只表示已受理，不是评测成功。无法可靠约束这些条件时先用私有 CI 链接，不能把裸 webhook 当权限系统。

Cloud 的 webhook/LLM URL 有严格内网访问限制；本地 WSL/私网执行器不是填一个 URL 就能连接。自托管也要显式允许可信内网目标，不能宽泛放开 SSRF 防护。这是原生触发相对私有 CI 链接的重要部署成本。[网络加固](https://langfuse.com/self-hosting/configuration/hardening)

## 免费、付费与许可

| 能力 | Cloud | 自托管 OSS / EE |
| --- | --- | --- |
| Prompt、Playground、datasets、experiments、核心 API | Hobby 可用但受额度/访问窗口限制 | 核心功能 OSS 免费；模型费、计算和存储不免费 |
| 组织级角色 | 基础 RBAC 可用 | OSS 可用 |
| 每个项目单独分配角色 | Pro + Teams，或 Enterprise | EE |
| Enterprise SSO/OIDC 与强制 SSO | Pro + Teams，或 Enterprise；普通社交登录不是该能力 | 常规 SSO 在免费 OSS 中；具体强制登录配置需按部署核验 |
| 受保护的 prompt 发布标签 | Pro + Teams，或 Enterprise | EE；普通标签本身不是付费功能 |
| 内置审计查看/导出、SCIM/组织管理 API | Enterprise | EE；不能把 SDK/Public API 也说成一律付费 |
| 内置数据保留管理 | Pro/Enterprise | EE；访问窗口不等于实际删除 |

依据：[Cloud 价格](https://langfuse.com/pricing)、[自托管价格](https://langfuse.com/pricing-self-host)、[项目级 RBAC](https://langfuse.com/docs/administration/rbac)、[认证与 SSO](https://langfuse.com/docs/administration/authentication-and-sso)、[自托管 SSO](https://langfuse.com/self-hosting/security/authentication-and-sso)、[保护标签](https://langfuse.com/docs/prompt-management/features/prompt-version-control)、[SCIM](https://langfuse.com/docs/administration/scim-and-org-api)。

截至核验日，Hobby 为 2 用户、50k units/月、30 天数据访问；Core $29/月，Pro $199/月，Teams 为 Pro 另加 $300/月，Enterprise 标示 $2,499/月。自托管 EE 为询价，当前页面说明与 ClickHouse 商业方案配套、费用另计。单开发者不应只为 Playground 购买企业治理，但也不能把未来多人隔离/审计需求算进“全免费”。这些是公开标价，不是采购报价或模型费用承诺。[Cloud 定价](https://langfuse.com/pricing)、[自托管定价](https://langfuse.com/pricing-self-host)

**审计要分两层：** 官方 Audit Logs 页的内置查询/导出为 Enterprise/EE，记录 actor、操作、时间和变更前后状态，含 prompt promote/setLabel 等事件。Hardening 页同时明确管理动作写入 PostgreSQL `audit_logs` 不取决于套餐，OSS 可直接查询。故“免费版没有审计记录”不准确；但有底层表不等于现成合规审计服务、完整动作覆盖或 Nomad 发布审批。[Audit Logs](https://langfuse.com/docs/administration/audit-logs)、[底层记录与 viewer 区别](https://langfuse.com/self-hosting/configuration/hardening#audit-logs)

已直接读取上述固定 commit 的许可：根目录为 MIT，明确排除 `ee/`、`web/src/ee/`、`worker/src/ee/` 等商业范围；EE 生产使用要求适用协议及有效许可，开发测试条款不能推导免费生产权利。不要因源码可见而复制 EE 实现规避许可。[固定版本 LICENSE](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/LICENSE)、[EE LICENSE](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/ee/LICENSE)

## 安全与生产边界

- **实验配置不等于 8.3/8.4。** 可调的是本次实验的 prompt、模型和参数；生产 Provider 路由优先级、fallback、能力选择、熔断、租户预算、预留/结算及发布/回滚仍由 Nomad 负责。Prompt config 即使存了同名字段也不会产生这些保障。生产禁止跟随实验项目的 `latest/production` 标签或把任意 config 直接展开进调用。Langfuse Cloud Spend Alerts 是云账单通知，不是模型请求前的硬预算拦截。[Config 语义](https://langfuse.com/docs/prompt-management/features/config)、[Spend Alerts](https://langfuse.com/changelog/2025-10-10-spend-alerts)
- **凭据分层。** Langfuse 项目 API key、Playground 的 LLM connection key、外部 CI/runner Provider key、webhook secret 是不同权限。项目 API key 不绑定个人用户，不能以 UI Viewer 推断它只读。原生 Playground 需要由授权管理员将实验专用 Provider 凭据提交给 Langfuse 服务端；生产 key 不复用，普通运营不接触 key。Nomad 自建入口、URL、prompt/config、dataset、报告和 trace 不放秘密。[RBAC/API key](https://langfuse.com/docs/administration/rbac)、[连接设置](https://langfuse.com/docs/administration/llm-connection)
- **加密不是任意字段保险箱。** 自托管 LLM/integration 凭据使用 `ENCRYPTION_KEY`，API key 用 `SALT` 哈希；还需 TLS、存储加密、密钥隔离/轮换与恢复管理。不能把普通 prompt JSON 中的 secret 当成自动受此保护。[加密说明](https://langfuse.com/self-hosting/configuration/encryption)
- **生产/评测数据双路径。** 8.1 继续仅导出安全摘要。专用 eval 项目/数据集只接收获准合成或脱敏样本的完整必要输入输出/工具上下文，查询按明确 project/dataset/run/item/trace ID 筛选并校验归属；禁止扫“最近所有生产 trace”，不采集密钥或推理链。完整上下文不进入 OTEL baggage。免费版只有组织级隔离时，可用独立组织或同一可信操作者；仅加 environment/tag 不是权限隔离。[OTEL baggage 限制](https://langfuse.com/integrations/native/opentelemetry/experiments)、[RBAC](https://langfuse.com/docs/administration/rbac)
- **复核是有成本的数据副本。** 单独批准 dataset、trace、score、artifact、媒体和备份的访问/保留/删除；删除追踪不能推定评测副本同步清除。确定性 CI 无云凭据仍独立可用；付费实验无论从 Playground、原生实验还是外部 runner 启动，都须先限制样本、模型、token、并发、重试与总花费。原生 UI 参数不能代替这些限制。

## 部署占用与交付门禁

已读固定版本 Compose：不是一个轻量静态 viewer，而是 **Web、Worker、PostgreSQL、ClickHouse、Redis、S3/MinIO 六类服务**；还需 TLS、持久化与备份。配置示例含占位凭据及浮动镜像标签，不能直接作为安全部署方案。官方把 Compose 定位本地/测试，无内置 HA/备份保障。[固定版本 Compose](https://github.com/langfuse/langfuse/blob/2f00fd4b504ae9de37dcd0a02b01ee02ee67d3dd/docker-compose.yml)、[部署定位](https://langfuse.com/self-hosting)

官方 sizing 逐服务列 Web/Worker/Postgres 各 2 CPU/4 GiB，Redis 1 CPU/1.5 GiB，ClickHouse 2 CPU/8 GiB，MinIO 2 CPU/4 GiB；不是本轮小样本实测，也不能机械相加当作任何单机试用的硬最低配置。**UI 可轻复用，独立自托管并不轻运维**；优先核验并复用 8.1 目标实例，不新增第二套平台。[Sizing](https://langfuse.com/self-hosting/configuration/scaling)

实施验收至少检查：

1. 锁定服务端/SDK；验证 prompt/config 版本冻结、数据集指定版本、变量/placeholders、所选模型 tools/schema，以及失联/缓存行为。
2. 一次受控小样本证明同一 promptfoo 执行的结果、span、score、case/variant/repeat 正确关联；少项/重复/NaN、上传失败与补传不重跑均有证据。
3. 验证 Viewer/Member/Admin 与 API key 的实际权限、实验凭据隔离、直接 ID 查询及跨项目拒绝；不要以付费功能名称代替权限测试。
4. 若选原生 Custom Experiment，验证签名、改 config 拒绝、防重放、异步状态、预算上限和真实网络可达性；不引入任意脚本执行或生产发布按钮。

因此，推荐的最小增量是“现成 Langfuse 工作区 + 原生单提示词探索 + 一个受控执行入口 + 单次运行结果关联”。保留 promptfoo/Nomad 权威门禁；是否把原来的摘要发布扩展为获准评测上下文复核，由主 agent 同步 Story 合同后再实施。
