---
project: nomad-mvp
date: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
epic: 8
story: '8.1'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-07
researchDelegated: true
researchStatus: complete
researchDecisionApproved: true
---

# Story 8.1 Review: 跨流程观测与故障定位

Epic 8 的六张 MVP Story 和两张 Post-MVP 预留条目已获用户确认。用户于 2026-09-07 批准
本 Story、采用方向、20 条 GWT 与 Walkthrough R1，合同已追加 epics.md，非实施完成。
用户要求后续对应 Story 也委派
agent 调研成熟实现，必须包含 GitHub，评估可行性、效果和优劣，再决定引入方式。

## Story

As a Nomad 运营者，
I want 从真实故障关联到请求、异步任务、业务阶段与 AI 调用，
So that 我能判断问题发生在哪里，同时不接触不必要的私人旅行内容，也不影响用户继续使用。

**Requirements:** FR13（Sentry/Langfuse，评测归 8.2）、FR14（观测集成）、FR33（阶段与失败事实）；
NFR2-NFR4、NFR6-NFR7、NFR17-NFR18、NFR20-NFR23；
AR1-AR8、AR11-AR15、AR17-AR20；UX-DR2-UX-DR3、UX-DR31-UX-DR33。

## Approved Research Direction

已完成两位 agent 的 GitHub/官方调研与主 agent 复核，见
`research/story-8-1-mature-implementations-2026-09-07.md` 及两份独立报告。
已批准沿用 Sentry + Langfuse；默认 Sentry 管唯一全局 OTel provider，Langfuse 使用显式隔离
provider，以安全 correlation/job/attempt 关联查询，不要求共享同一棵分布式 trace 树。
官方隔离方案能避免 Sentry 采样连带影响 AI trace；相应代价是跨工具关系需显式映射。
这与研究 agent 建议共享 provider 的取舍不同，主 agent 的理由和官方来源已记录。
成熟产品减少界面/后端平台开发，不免除 Nomad 的隐私与业务关联验证。托管与自托管、
资源、区域、实际付费治理能力尚未决定，不因 Story 评审授权账户/部署操作。

## Delivery Boundary

- 以现有 Sentry/Langfuse 为基线，研究标准 OpenTelemetry 关联与薄集成；具体托管、版本、
  付费能力和替代产品仅为待确认建议，不因研究自动安装/付费/部署。
- 交付可实际检索的跨流程故障定位，复用成熟工具界面；不重建日志平台或开发者后台。
- 前面 Story 应已交付首次调用的安全/超时/限流/脱敏，本 Story 核对与统一现有接入；
  不把生产 SDK 首次上线所需保护延期到集中观测完成之后。
- 8.2 负责评测，8.3 负责 Provider 变更，8.4 负责集中预算账本，8.5 负责 Telegram，8.6
  负责汇总总览。本 Story 不依赖这些未来能力才能定位一次真实请求。
- 观测数据不是任务、额度、版本发布或清理完成的事实数据库；只消费已持久化事实。

## Local Evidence

2026-09-07 只读检查：

- `apps/server/src/integrations/telemetry.ts` 有 Sentry 条件初始化及有限 fill trace；
  `index.ts` 调用仍为 tracking stub。源声明 `@sentry/node ^8.26.0`、`langfuse ^3.21.0`，
  直接读取当前安装包为 8.55.0 / 3.38.6，Fastify 为 5.8.5，不是现行新版 SDK 兼容证明。
- `apps/mobile/package.json` 和 `main.tsx` 没有实际 Sentry 接入；
  `auth/analytics.ts` 使用键名黑名单且含 HQ/BYOK 旧事件，不能据此证明深层值已安全。
- `plugins/trace-id.ts` 直接接受外部 `x-trace-id`；现有相关 ID 不等同可跨 SDK 使用的
  W3C trace ID，更不可以作为 owner/资源权限或客户端指定采样额度的依据。
- `docs/ops/analytics.md` 仍有搜索 `q`、check-in、额度 warning 和 seed 接受率等旧表述。
  修正该字典/引用属于本 Story；最新 PRD/批准合同优先，不批准继续发送旧敏感字段。
  此为批准前检查记录；批准后源字典、PRD/UX/观测架构和镜像已同步，实际代码接入仍待实施。
- `pnpm list` 受到本地 store SQLite 文件不可打开限制，未修改 store/权限；上述已安装版本
  改由只读包 metadata 核实。本轮不运行安装、生产连接或业务构建。

## Approved Acceptance Criteria

### 1. Mature integration and usable outcome

**Given** 选择经研究、许可及版本兼容核验的成熟观测工具
**When** 接入 Nomad 当前已实现的前后端与 worker 流程
**Then** 授权运营者可在实际工具中检索真实错误和关联调用，覆盖已启用能力而非只初始化 SDK
**And** 不新建通用监控平台，不依赖 8.6 总览才提供排障价值，旧未实现业务不伪装为已有遥测

### 2. Versioned event inventory

**Given** 登录、导入、S0-S11、编辑/校验、餐饮/清单及账号/反馈产生已有事件
**When** 标准化事件字典与发送字段
**Then** 每个事件定义真实来源、schema 版本、允许字段、失败/完成语义与去重标识
**And** 移除活跃字典的 HQ 采用、BYOK、打卡、用户额度提示和模糊反馈成功口径，不复制旧事件重复计数

### 3. Trusted correlation boundaries

**Given** 请求带有缺失、非法、超长或外部可控 trace/correlation headers
**When** Fastify 建立请求和任务关联
**Then** 使用已验证的标准格式与服务端关联策略，保留必要的兼容 ID 映射，拒绝把任意原文回显或记录
**And** trace 不是鉴权身份，不能借碰撞串读其他 owner，也不能由传入 sampled 标志强制高成本采样

### 4. Async attempts, reconnect and links

**Given** 一个任务跨请求、队列、重试、worker 重启与 SSE 重连
**When** 记录各阶段 span 和已持久化结果
**Then** 可按稳定 job/attempt/版本关系串联，区分当前与废弃 attempt、原任务与重连请求
**And** 不要求一个无限长 span 跨整个任务，不把重连计为新规划，不允许迟到观测改变业务状态

### 5. Safe AI-call metadata

**Given** 规划、细节或其他已实现 AI 能力调用 Provider
**When** 产生 Langfuse observation
**Then** 保留任务类型、prompt/model/路由配置版本、attempt、实际耗时和可验证的 usage 元数据
**And** 不上传 prompt/response/工具输出原文、完整行程或推理链，不以自动采集全量输入作为可观测性的前提

### 6. Errors versus recoverable domain outcomes

**Given** HTTP 成功但异步任务失败，或某次 Provider 失败后回退成功
**When** 映射任务/attempt/请求 outcome
**Then** 分别展示真实完成、失败、回退、取消和未知，稳定错误码支持查询
**And** 不以 HTTP 202、SSE 打开、反馈外链打开或单次 attempt 失败代替最终业务结果

### 7. SDK bootstrap and instrumentation ownership

**Given** Fastify ESM、React 与 Sentry/Langfuse/OTel 同时启用
**When** 应用/worker 启动或升级 SDK
**Then** 验证受支持的初始化顺序、唯一全局 provider 和显式隔离的 Langfuse provider，并用安全任务/attempt 关系关联查询
**And** 不竞争注册全局上下文、不重复自动拦截 HTTP/模型/数据库调用，不将 Sentry 内部 span 或非 AI span 无差别发给 Langfuse；不假称两端共享同一父子树

### 8. Redaction before every outbound sink

**Given** 日志、span、异常、breadcrumb 或事件包含嵌套/编码后的敏感输入
**When** 序列化并发往文件、Sentry、Langfuse 或分析服务
**Then** 通过允许列表、值级过滤及上限检查，只输出必要的安全字段与错误类别
**And** 用户原文、精确位置/路线、POI/酒店、原始链接、鉴权头/凭据、附件或其他 owner 内容不得流出；过滤失败丢弃遥测而不丢弃业务

### 9. Browser and automatic capture restrictions

**Given** 浏览器、HTTP、数据库或 AI SDK 提供自动捕获能力
**When** 配置 instrumentation 与 source maps
**Then** 关闭本期不需要的录屏/Replay、表单/请求体、聊天全文、SQL 参数和 DOM 内容捕获，发布包对应私有 source maps
**And** 浏览器只包含允许公开的 SDK 接入配置，不包含服务端凭据；breadcrumb、URL query 和错误 message 同样经过数据最小化

### 10. Metrics and unknown values

**Given** 存在采样、未报告 token/cost、缓存命中或导出丢失
**When** 计算耗时、错误、回退和覆盖指标
**Then** 未知值保持未知，估算记录方法/版本，计数区分 attempt 与任务且采样覆盖可核查
**And** 不把无数据当作零成本或零错误，不用采样 trace 充当 8.4 预算账本，不重复发起请求补齐指标
**And** Sentry 不采样的请求不应误抑制隔离的 AI tracing，AI 自身仍有独立有界采样；终态错误诊断与性能采样分开

### 11. Privileged operational access

**Given** 运营者检索错误/trace 或访问对应链接
**When** 执行工具侧鉴权与项目/环境隔离
**Then** 只开放最小实际可用权限，环境与部署版本可分辨，关联查询不附带公开凭据
**And** 普通用户不能通过 correlation id 查询遥测；工具若缺少所需权限能力应记录为部署门禁，不假称免费版具备付费能力

### 12. Retention and account deletion integration

**Given** 新遥测进入实际存储或用户触发既有 7.5 删除
**When** 核对保留策略与执行清理
**Then** 对可关联个人的记录有最小受限映射、明确 TTL 和可验证的删除/匿名化或已批准隔离保留路径
**And** 不将 hash 自动视为匿名，不让迟到 worker/重试复活已删除记录，扩展 7.5 数据清单且不向 7.4 副本塞入内部 traces

### 13. Bounded telemetry overhead

**Given** 正常流量、错误风暴或恶意传入采样上下文
**When** 采集和导出遥测
**Then** 有服务端控制的采样、低基数字段、事件/队列/时间上限及丢弃统计
**And** 排障数据不能无限放大 CPU/内存/存储/供应商成本，不把高基数私人标识作为指标标签

### 14. Monitoring failures do not fail travel work

**Given** 观测服务断网、限流、鉴权失败或 SDK/exporter 抛错
**When** 用户继续规划、修改或查看已发布行程
**Then** 业务按原合同独立执行，遥测按有界策略降级到安全诊断或丢弃
**And** 不修改 Job/Plan、账本或业务重试预算，不循环发送监控自己的故障，不静默落盘未脱敏 payload

### 15. Shutdown and delivery honesty

**Given** 进程正常退出、突然中断或观测服务长时间不可用
**When** flush、重启并检查已送出的事件
**Then** 正常退出有界等待，重启保留业务关联；允许声明遥测缺口，不假称全部投递或 exactly-once
**And** SDK 的瞬态缓冲不代替持久任务/安全审计/删除记录，不阻塞 worker lease 或业务退出

### 16. Missing configuration and deployment choice

**Given** 托管/自托管、区域、保留和付费能力尚未配置或验证
**When** 准备验收实际工具接入
**Then** 明确列出未部署/不可查询部分及资源、连通性、权限和保留门禁
**And** no-op 可用于开发降级但不能算真实接入通过；本 Story 批准不自动授权购买云服务或把全套自托管栈装到小主机

### 17. Preserve user flows and future-story boundaries

**Given** 新观测机制在用户页面或后台启用
**When** 发生采集、查询或诊断
**Then** 用户侧不新增额度/模型/追踪面板、不改变 S0-S11 与现有错误恢复动作
**And** 不实现评测门禁、Provider 管理、集中预算、Telegram、8.6 总览、XHS 搜索或用户隐私内容回放

### 18. Visual and operational walkthrough

**Given** Story 进入用户评审和实现验收
**When** 展示错误定位到 AI 调用的过程
**Then** 优先使用成熟工具实际去敏界面或清楚标注的交互示意，说明如何关联及哪些内容不采集
**And** 示意不冒充部署截图；本期不重绘第三方产品作为 Nomad 新后台，实际检索/无数据/权限/失联仍需验证

### 19. Contracts, SDK and security verification

**Given** 本 Story 准备交付
**When** 运行版本矩阵、ESM 初始化、并发 owner、恶意 header、敏感嵌套值、脱敏失败、跨队列/重连、采样、关闭和删除竞态测试
**Then** 唯一全局注册、隔离的 AI provider、关联字段和过滤后的出口与实际工具中的 trace/error 对应，SDK 不重复记录、不泄露私密内容
**And** 更新确实变化的 OpenAPI/生成类型，focused tests 与 workspace build 通过，未实测项明确留为门禁

### 20. Real integration evidence and documentation

**Given** 选定环境已获部署和数据传输授权
**When** 使用合成/获准脱敏样本执行成功、终态失败、回退成功和观测服务不可用场景
**Then** 记录真实查询、延迟/覆盖/开销及清理证据，更新旧 analytics 字典、观测架构、运行说明与 BMAD 镜像
**And** Github/官方调研结论有日期和兼容版本，不能以 SDK 安装、网页截图、mock trace 或缺凭据的跳过代替真实验收

## Approved Visual

`_bmad-output/implementation-artifacts/visual/story-8-1-observability-walkthrough-r1.png`
由内置 imagegen 生成，展示错误 -> correlation 查询 -> AI attempts，以及观测失联时的隔离。
这是带批注的运营流程示意，不是 Sentry/Langfuse 真实界面还原、上线截图或新 Nomad 页面。
左侧选择的是 attempt 1 超时，右侧 attempt 2 回退成功；错误标签/ID/数字均为示例，
不冻结实际错误码或数据库格式。图中的「同一关联编号」指安全业务 correlation，不要求
两端相同 OTel trace ID。真实工具检索、source maps、权限和缺数据状态另做实施验证。
原型已随 Story 批准，不能据此判断真实监控服务已经接入。

## Next Gate

用户已批准本 Story 并要求进入下一张。继续 `story-8-2-review-2026-09-07.md` 的成熟方案
调研和详细评审；不重复批准 8.1，也不自动写入 8.2、运行最终 CE/IR/SP 或恢复业务开发。
