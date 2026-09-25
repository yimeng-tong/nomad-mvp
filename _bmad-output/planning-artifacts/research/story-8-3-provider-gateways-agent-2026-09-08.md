---
project: nomad-mvp
story: '8.3'
date: 2026-09-08
status: delegated-research-only
scope: LiteLLM versus Bifrost
deploymentAuthorized: false
---

# Story 8.3 Provider 网关研究

## 结论

**建议：8.3 以既有 Node 适配器和 Nomad 版本化路由合同为主线，不把新增网关设为交付前置。** 若后续确认多家非 OpenAI 原生协议、集中凭据和现成运维 UI 能显著减少维护，再有界验证 LiteLLM；Bifrost 保留为偏单实例、轻运行栈的候选。两者均有可复用实现，但本次没有任何真实 Nomad 兼容性、效果或部署验收。

| 路径 | 能得到什么 | 代价与建议 |
| --- | --- | --- |
| 保留 Node/OpenAI-compatible adapters | 保留现有业务校验、owner/revision/attempt 边界；没有额外网关故障点 | 仍需实现任务路由、错误映射、配置发布和审计；不是保留单环境变量现状。当前默认建议 |
| 接 LiteLLM Proxy | 跨协议适配、模型组、异常策略、Redis 协调和管理 UI | 增加 Python 服务及 DB/Redis 运维，权限/审计部分付费，发布频繁且有供应链事件；满足实际需求后优先验证，不立即采用 |
| 接 Bifrost HTTP | Go 网关、别名/有序回退、内置 UI，单节点 SQLite 可起步 | 免费多节点动态配置同步不成立；细粒度 RBAC、审计及集群属 Enterprise，近期 2.0 有破坏性迁移；条件保留 |

网关的请求路由不是 Nomad 的任务语义；管理 UI 的保存不是批准上线；版本回退不是回滚用户行程。Unleash/远程配置产品选型由另一 agent 负责，本报告不重复研究。

## 本地边界

- 已读 [CURRENT.md](/home/tong123/work/nomad-mvp/CURRENT.md)、[project-context.md](/home/tong123/work/nomad-mvp/_bmad-output/project-context.md)、历史 sprint YAML 和当前 2.2 story。业务实施仍暂停；本次只提供 8.3 定义输入。
- [Epic 8 已批准拆分](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/epic-8-story-breakdown-proposal-2026-09-07.md) 要求 8.3 管路线校验/发布/LKG/回滚/审计；8.4 管持久预算预留/结算；8.5 管 AI/AMap 终态 Telegram。首次调用保护必须在前面业务 Story 交付，不能推迟到 Epic 8。
- [8.2 已批准范围](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/evaluation-operator-scope-decision-2026-09-07.md) 保留独立 Langfuse 人工评分/实验工作区和 promptfoo 完整实验；不依赖 8.3/8.6 才可使用，不以实验标签或评测分数直接切换生产。
- 本次只读源码：[`ServerManagedHqAdapter`](/home/tong123/work/nomad-mvp/apps/server/src/planner/hq.ts:383) 使用环境变量的单 base URL/model，调用 `/chat/completions`、`json_object`，再经过 Zod/业务不变量校验；网络失败统一为 timeout，所有非 2xx 统一可重试错误。`dailyUsage` 是内存 Map。现有 lease/attempt 发布栅栏值得保留，但旧 Quick/HQ 合同不是新产品目标，也未实现 8.3。

## 版本与证据

检索日期统一为 **2026-09-08**。下表是实际核对的固定研究基线，不是批准部署版本；动态文档未标明更新日期的，不把检索日冒充发布日期。GitHub 匿名 REST API 返回限流，因此改用公开 Release HTML、其 `relative-time` 时间及固定 SHA 原文核验；没有使用账号/token。

| 项目 | 固定版本与 Release 发布时间 UTC | 固定源码 |
| --- | --- | --- |
| LiteLLM | [`v1.100.0`](https://github.com/BerriAI/litellm/releases/tag/v1.100.0)，`2026-09-06T05:33:17Z`；检索时标记 Latest；不选 `1.101.0` RC | [`e4f25265704e2b2c6cf6e81be2e4c5cffff896f4`](https://github.com/BerriAI/litellm/tree/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4) |
| Bifrost | [`transports/v2.0.0`](https://github.com/maximhq/bifrost/releases/tag/transports%2Fv2.0.0)，`2026-08-26T19:47:19Z` | [`e4a30d6041c0446603aea615bc5da340dac001b1`](https://github.com/maximhq/bifrost/tree/e4a30d6041c0446603aea615bc5da340dac001b1)；`transports/go.mod` 固定 Core `1.8.3`、Framework `1.6.0` |

Bifrost 的 HTTP/Core/插件/Helm 独立编号：发布页还有较新的 Core `1.8.4`，不等于上述 HTTP 包已含该修复；Helm 的 Latest 也不是 HTTP 版本。动态文档描述须与实际选用组件锁定清单复核。[依赖文件](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/transports/go.mod)、[发布列表](https://github.com/maximhq/bifrost/releases)。

## 能力比较

### 路由与模态

| 项目 | LiteLLM | Bifrost | 对 Nomad 的限制 |
| --- | --- | --- | --- |
| 别名/路线 | `model_name` 为模型组别名，同名可负载均衡；fallback 指向别的组，组内随机/权重选择不等于严格顺序 | key 级静态 aliases；CEL routing rules 可按 VK/team/customer/global 条件改写目标；有序 provider/model fallback | 用可信 `taskType` 映射不可变路线版本；不能以可变别名或客户端 metadata 作为任务权限 |
| 能力白名单 | 有 key/model 访问限制、支持参数和模型能力查询 | 有 VK/provider/key/model 限制；alias 也参与模型准入 | 模型获准不等于支持该任务；逐路由声明端点、tools、JSON strict、图像/音频输入、上下文/输出上限；整条 fallback 都须满足 |
| Tools/JSON | 默认对不支持的 OpenAI 参数报错；`drop_params` 可丢弃参数。`json_object`、原生 strict schema、网关端 schema 验证不是同一种保证 | 固定 harness 覆盖 tools、JSON/schema，但某些转换采用 tool-mode workaround；存在端点/模型组合限制及跳过项 | 不允许静默丢掉必需 tools/schema；参数转换不能代替 Nomad 结构及业务校验。工具执行授权/幂等仍在应用，不启用网关 agent/MCP 自动执行来代替 |
| VLM | vision 输入支持依 provider/model，不能由 `/chat/completions` 存在推出所有模型看图 | 支持图像输入；某些上游只收 inline bytes，网关会取 URL 后转换 | 图像数量/尺寸、私有媒体引用、下载 SSRF、超时、输出证据逐一测；不替代媒体准备、抽帧、COS 或 AMap 验证 |
| ASR | 官方 transcription 列有 OpenAI/Azure/Gemini/Vertex/Deepgram/Groq 等；音频输出 guardrail 注明仅非流式 | 固定 harness 的原生 transcription 覆盖 OpenAI/Gemini/Azure，Anthropic/Bedrock/Vertex 栏为 N/A；这只是该测试矩阵，不扩大为全部产品不支持 | 音频输入、转录端点、实时 ASR 是不同能力；中文准确率、格式/大小、分段时间戳、重试可重读均未测；VAD 静音/BGM 跳过规则仍归导入流程 |

依据：[LiteLLM Router](https://docs.litellm.ai/docs/routing)、[参数支持/丢弃](https://docs.litellm.ai/docs/completion/input)、[JSON](https://docs.litellm.ai/docs/completion/json_mode)、[Vision](https://docs.litellm.ai/docs/completion/vision)、[Transcription](https://docs.litellm.ai/docs/audio_transcription)；[Bifrost 别名](https://docs.getbifrost.ai/providers/aliasing-models)、[Routing Rules](https://docs.getbifrost.ai/providers/routing-rules)、[固定版本 harness 说明](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/docs/providers/test-harness-coverage.mdx)、[固定准入配置](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/docs/deployment-guides/config-json/governance.mdx)。官方 harness 的“预期通过”及资源依赖的默认跳过，均非 Nomad 实测。

### 失败、次数与半途输出

- **LiteLLM：** 模型组重试后按配置组回退，context-window/content-policy 有独立 fallback 路径；可按 Timeout、RateLimit、Authentication、BadRequest、ContentPolicy 配置次数。固定源码对普通不可重试状态停止同组 retry，401/403 有多 deployment 特例；“不 retry”不应被误读成“一定不走 fallback”。`num_retries` 未配置会继承库/SDK 默认，`max_fallbacks` 常量默认 5，故生产应显式限定两者及总时限，不依赖隐式默认。[回退文档](https://docs.litellm.ai/docs/proxy/reliability)、[固定异常策略](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/litellm/router_utils/get_retry_from_policy.py)、[固定 retry 判断](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/litellm/router.py#L7375)、[常量](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/litellm/constants.py)。
- **Bifrost：** 默认 `max_retries=0`，表示首次之外的次数。网络/5xx 同 key 退避；429 可轮 key 且退避，401/402/403 将该 key 在本请求中标为无效；全部 key 无效可返回 `502 upstream_credentials_exhausted`。普通验证错误、取消、插件阻断不照常 retry；插件可 `AllowFallbacks=false` 阻止换路。fallback 顺序执行、每路重新跑插件并各获自己的 retry 预算；全败通常返主路错误，阻断插件例外。[官方说明](https://docs.getbifrost.ai/features/retries-and-fallbacks)。
- **总次数不能只读一个字段：** 主路加两条备用、每路 3 次 retry，常规最多 `3 * (1+3) = 12` 次，不是 3 次。Bifrost 固定 Core 源码还会在特定加密推理内容拒绝时剥离该内容，额外授予一次尝试，可能超过上述常规计数，甚至 `max_retries=0` 仍有第二次。外层 worker/SDK 再 retry 会进一步放大；需一个总 attempt/deadline 负责人，兼容性自动重发也记账。[固定额外尝试分支](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/core/bifrost.go#L6126)。
- **流式不是自动续写：** LiteLLM 固定 `_acompletion_streaming_iterator` 在已经产生内容时抛回原异常，不自动把下一模型接在半句后；首个内容前可 fallback。此结论限定异步 Chat 路径，Responses/原生透传另验。Bifrost 固定代码检查首 chunk 的 SSE 错误以触发 retry/fallback，未证明已向客户端发出部分正文后可安全续传。Nomad 应将部分 JSON/tool arguments 视为未完成，不发布、不拼接模型输出、不重复执行已执行工具；现有 Job SSE 重连也不等于模型流重试。[LiteLLM 固定流实现](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/litellm/router.py#L2430)、[Bifrost 首块检查](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/core/bifrost.go#L6455)。

### 缓存、冷却与状态

| LiteLLM | Bifrost | Nomad 决策 |
| --- | --- | --- |
| 支持 exact/semantic cache、TTL/namespace；cooldown 作用于 deployment，可按错误类配置。多 worker 的计数、冷却及失效协调用 Redis，无 Redis 的进程内状态不能当跨实例事实 | exact hash 与 semantic 模式共用 cache 插件，需向量存储，direct-only 无需 embedding，Redis/Valkey 路径要求兼容相应存储能力；写入异步、TTL 到期，重启不自动删除。无效 key 集合只是单次请求状态；文档化 Circuit Breaker 属 Enterprise，基于响应头信号，不是通用错误率熔断证明 | 不用网关缓存充当 Job 幂等、route LKG、Plan/Trip revision 或 8.5 去重账本。初期关闭生成结果语义缓存；若启用 exact cache，绑定 owner 隔离域、任务/schema/prompt、route revision、输入摘要及有效期，单独设计删除 |

依据：[LiteLLM Redis 要求](https://docs.litellm.ai/docs/proxy/redis_requirements)、[缓存隔离及端点限制](https://docs.litellm.ai/docs/proxy/caching)、[Bifrost 缓存](https://docs.getbifrost.ai/features/semantic-caching)、[Enterprise 熔断器](https://docs.getbifrost.ai/enterprise/circuit-breaker)。尤其同一服务虚拟 key 后可能有多个 Nomad owner，不能把 key 级缓存隔离当 owner 隔离；共享 Redis 也不自动提供跨重启持久性，仍须确认 TTL、驱逐、持久化和失联策略。

## 运维 UI 与发布

| 表面 | LiteLLM | Bifrost |
| --- | --- | --- |
| UI/持久化 | UI 需 master key 与 DB；`STORE_MODEL_IN_DB` 使模型可通过 UI/API 持久修改，凭据依 salt/master key 加密；file-owned 模型不能直接在 UI 改 | OSS 有 provider/governance UI 与 admin 鉴权配置；默认 SQLite，也可单节点 PostgreSQL；file-only 模式启动加载、配置表面不可写 |
| 热更新/多实例 | 文档称 DB 模型修改对新请求生效；固定实现还含默认 30 秒 DB config reload 周期，Redis 协调失效。不能将单节点保存当作所有 worker 已确认生效 | DB/API 更新本节点内存；官方明确 OSS 多节点共用 PostgreSQL 配置不受支持，其他节点不会自动获知；OSS 多节点推荐共享文件后重启，实时集群传播属 Enterprise |
| 版本/LKG/回滚 | 有 CRUD/更新能力，但本次未证实完整 Nomad draft -> validate -> publish、CAS 版本、LKG 和回滚闭环 | `split` 模式用 file hash 保留/覆盖 DB 修改；`source_of_truth=config.json` 可启动时协调乃至剪除指定段 DB 行。这是 reconciliation，不是审批或不可变发布历史 |
| 免费/付费 | OSS 有网关、虚拟 key、基本用户/团队及全局角色；org/team 委派管理、细粒度治理、SSO、管理操作审计归 Enterprise。审计配置字段存在不代表免费许可 | OSS 基本 admin/VK/model 限制不等于细粒度人类角色权限；Enterprise 文档明确 RBAC、SSO、签名审计、P2P 集群。试用不是永久免费，具体报价/授权未核验 |

依据：[LiteLLM UI](https://docs.litellm.ai/docs/proxy/ui)、[模型持久化](https://docs.litellm.ai/docs/proxy/model_management)、[固定 reload 常量](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/litellm/constants.py#L1607)、[RBAC](https://docs.litellm.ai/docs/proxy/access_control)、[付费审计](https://docs.litellm.ai/docs/proxy/multiple_admins)、[Enterprise 边界](https://docs.litellm.ai/docs/enterprise)；[Bifrost 固定配置权威规则](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/docs/deployment-guides/config-json/source-of-truth.mdx)、[OSS 多节点限制](https://docs.getbifrost.ai/deployment-guides/how-to/multinode)、[RBAC](https://docs.getbifrost.ai/enterprise/rbac)、[审计](https://docs.getbifrost.ai/enterprise/audit-logs)。

**推断：** 若选网关，日常管理可复用其 UI，但直接编辑生产 alias 是绕过 Nomad 发布合同的路径。必须收紧写入口，或由最小发布桥接生成版本化网关资源并核对生效回执；不能为免费审计缺口伪造厂商能力，也不必因此复制整套厂商后台。secret 使用服务端引用，禁止运营路线表接受任意 URL/脚本/凭据值；连接测试可能真实调用，须独立授权，不能把 Save/Test 当作无成本操作。

## 许可、安全与负担

- **许可：** LiteLLM 固定根许可为 MIT，但明确排除 `enterprise/`，该目录另有许可；Bifrost 固定开源根为 Apache-2.0。开源许可不涵盖商业服务承诺或 Enterprise 权限，第三方依赖和最终镜像仍需核查。[LiteLLM LICENSE](https://github.com/BerriAI/litellm/blob/e4f25265704e2b2c6cf6e81be2e4c5cffff896f4/LICENSE)、[Bifrost LICENSE](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/LICENSE)。
- **LiteLLM 安全：** 官方 2026-03-27 说明 03-24 的 PyPI `1.82.7/1.82.8` 供应链事件；03-30 宣布隔离发布/Trusted Publishing/Cosign 改进，不能据此声称所有后续镜像无漏洞。[事件说明](https://docs.litellm.ai/blog/security-townhall-updates)、[CI/CD v2](https://docs.litellm.ai/blog/ci-cd-v2-improvements)。08-26 公告 `GHSA-3cv6-jpf6-8222` 涉及请求路由参数 SSRF/Provider 凭据外泄，正文称 `1.96.2` 修复并列多个回补版，但 affected 范围栏与正文不完全一致，必须按补丁/锁定产物复核；另 `GHSA-hx8v-g79f-8w5f` 的 `user_config` SSRF 明确 `<=1.83.8`、修复 `1.83.9`。[路由参数公告](https://github.com/BerriAI/litellm/security/advisories/GHSA-3cv6-jpf6-8222)、[user_config 公告](https://github.com/BerriAI/litellm/security/advisories/GHSA-hx8v-g79f-8w5f)。
- **Bifrost 安全：** 2026-07-21 `GHSA-w98g-5w9p-p3rc` 涉及图像/文档 URL 抓取 IP 分类不全；Core `<=1.5.15` 受影响，`>=1.5.16` 修复。HTTP 2.0 还收紧远程原生插件下载/鉴权，并改变 governance 路径和鉴权 hook 顺序，不是透明升级。[SSRF 公告](https://github.com/maximhq/bifrost/security/advisories/GHSA-w98g-5w9p-p3rc)、[固定 2.0 迁移说明](https://github.com/maximhq/bifrost/blob/e4a30d6041c0446603aea615bc5da340dac001b1/docs/migration-guides/v2.0.0.mdx)。
- **共同门槛：** 固定镜像 digest、校验来源/签名与 SBOM/依赖，禁用不需要的 MCP、任意插件、脚本和客户端路由覆盖；管理面私网/最小权限，推理入口仅接可信服务，出站域名/IP/重定向均受限。以上是采用要求，不是本次已完成的安全测试；公告检索不穷尽全部漏洞，也不以公告数量判断谁更安全。

| 资源与维护 | 评估 |
| --- | --- |
| LiteLLM | 以常规 Python Proxy 为研究对象，不混入 Beta Rust 路径；新增服务、PostgreSQL 管理数据、生产多 worker Redis、加密材料备份和更新验证。官方支持窗口为最近四个稳定 minor，频繁升级带来适配回归成本。[维护政策](https://docs.litellm.ai/docs/enterprise) |
| Bifrost | Go 服务加 SQLite 的单节点起点组件较少，是架构推断而非内存实测；集中数据库/日志、可选向量缓存及 Enterprise 集群会增加负担。启动执行 DB migration，回滚镜像不逆转数据库，须先保留兼容备份/密钥。[运行与回滚合同](https://docs.getbifrost.ai/deployment-guides/runtime-contract) |
| 两者 | 未测 RSS/CPU、P95、并发、首 token、中文质量或真实账单；厂商吞吐宣传不可外推 Nomad。网关需要看到推理内容，不等于可持久记录全量内容：关闭正文/debug/不需要的外部 telemetry，落实日志/缓存/备份保留删除；8.1 安全遥测与 8.2 去直接标识样本继续分离 |

## 8.3 定义建议

以下为主 agent 编写 GWT 的输入，**尚未获批为合同**：

1. **任务准入：** 从实际导入图文/ASR、规划、局部意图、填充等适配器登记任务能力，不能假定所有 Validator 都调用模型。每个备用目标都验证端点/参数/schema/模态/数据外发边界；拒绝循环、未知模型、能力降级和任意 URL。官方模型列表只能辅助检查。
2. **发布闭环：** 当前/待发布分开；静态检查、已批准 8.2 证据和另外授权的连接验证分别标记。基于 expected route revision 发布，保存操作者、原因、无密钥 diff、配置摘要/版本与实例生效结果；坏配置不覆盖 LKG，配置服务失联继续已验证快照，冷启动无 LKG 时使用明确安全默认/拒绝。
3. **在途固定：** 新 Job 绑定不可变 `routePolicyRevision` 及具体 provider/model/secret 引用版本、prompt/schema 版本；同一 Job 后续子调用/retry/fallback 使用同一允许集合，不能只固定 alias 字符串后在网关解析新目标。保留旧版本直至引用任务结束；恢复 worker 读取持久快照，不重新选当前策略。
4. **紧急停用另定：** 建议独立的撤销/禁用检查只收紧权限，在下一次外呼及结果发布前检查；不静默换模型、重启任务或假称已取消上游。正在飞行的 HTTP 请求、晚到结果、允许完成还是终止，以及预算收紧时点，均需用户在详细 GWT 中对齐。网关 session affinity 不是这个合同。
5. **安全提交不外包：** 无论命中缓存/备用/重试，仍过 owner、幂等、attempt fencing、expected Plan/Trip revision、当前城市及冻结事实校验。回滚只影响后续路由指针，不重算/恢复已发布 Plan；半流、截断 JSON、无效 schema 不得当成功。
6. **8.4/8.5 不被吞并：** 8.3 复用首次使用最低保护，并输出所有实际 attempt、未知 usage、总截止时限和终态原因。网关花费表不替代跨任务/实例预留-结算-释放、外部非模型成本和不重复用户额度；网关“全部失败”也不替代 AI/AMap 业务降级后的终态判定、持久去重/冷却、Telegram 投递与恢复通知。可成功回退的 429 不直接告警。
7. **验收清单：** 后续在获准隔离环境，用可计数假上游覆盖 400/401/403/404/429/5xx、连接/首字/总超时、200 内 SSE 错误、半流断开、tool 重复、能力不匹配、缓存跨 owner/旧版本、双发布冲突、在途切换、实例失联/重启、Redis/DB 故障、撤销后晚到结果及回滚。再分别申请有界真实 VLM/ASR/JSON/tool 兼容测试；mock、文档和截图不能代替真实上游/权限/数据出口验证。

本次仅只读本地文档/源码和公开官方/GitHub 资料，使用 `apply_patch` 创建此报告。未安装、构建或运行网关，未部署、调用模型、创建账号、读取生产数据/密钥或修改记忆；无性能、安全、真实模型或生产变更测试结果可宣称通过。
