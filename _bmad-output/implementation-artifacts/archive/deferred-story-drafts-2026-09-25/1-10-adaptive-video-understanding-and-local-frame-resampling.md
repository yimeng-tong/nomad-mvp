---
project: nomad-mvp
story_id: '1.10'
story_key: 1-10-adaptive-video-understanding-and-local-frame-resampling
source_story_id: '1.10'
source_contract_sha256: e7b4c61c1bf505b9a18ebbeeda713d2e76129c3bef3e335ed560c59e5c55f435
source_epics: _bmad-output/planning-artifacts/epics.md
scope_revision: ui-foundation-2026-09-20
created: '2026-09-25'
updated: '2026-09-25'
workflow: bmad-create-story
preparation_status: draft-pending-independent-validation
preparation_authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
implementation_started: false
execution_dispatch_authorized: false
execution_stop_boundary: 1-7-durable-import-progress-and-restart-recovery
baseline_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
engineering_conditions:
- OPS-01
- OPS-02
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- CODE-QUALITY-01
delivery_requirements:
- FR4
- FR38
- NFR12
- NFR13
- NFR14
source_obligations: []
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/1-10-adaptive-video-understanding-and-local-frame-resampling-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 1.10: 自适应与局部二次抽帧的视频理解

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 系统理解视频中的画面与有效语音并跳过无意义的处理,
So that 视频灵感能够被可靠提取而不会浪费大量额度.

**Requirements:** FR4, FR19; NFR2-NFR5, NFR12-NFR14, NFR17, NFR21;
AR5, AR6, AR11-AR15, AR20; UX-DR5, UX-DR31

**Acceptance Criteria:**

**Given** owner 的 ImportRecord 包含一段受支持视频
**When** worker 准备媒体
**Then** 从生产采集适配器读取可信时长、音轨、编码和媒体大小，并应用可配置下载、解码、CPU、内存与处理时限
**And** 不可信、超限或损坏媒体返回类型化降级，不阻塞已取得的标题、正文或其他可靠证据

**Given** 视频时长和媒体状态有效
**When** 执行第一轮关键帧采样
**Then** 版本化策略对不超过 30 秒的视频使用高于长视频的采样密度，并对长视频使用较低密度
**And** 两类策略都声明采样间隔/密度、最大帧数、最大像素/字节和成本预算，使固定 fixture 的选择可重复测试

**Given** 第一轮多模态理解判断某个画面含有相关信息但上下文不完整
**When** 模型请求查看该画面附近内容
**Then** 只接受包含 source timestamp、缺失原因、邻近时间窗口和期望观察目标的类型化 resample request
**And** 模型不能直接执行媒体命令、指定任意文件路径或绕过服务端策略

**Given** 服务端收到合法的局部 resample request
**When** 请求位于视频边界内且未超过配置的局部窗口、采样密度、最大附加帧数、轮次和总成本预算
**Then** worker 在目标时间点附近进行更高密度的第二轮抽帧，并把新增帧连同 pass/window/timestamp provenance 送回同一 fenced attempt
**And** 重叠或相邻请求先合并去重；缓存键包含内容指纹、策略版本和规范化窗口，避免重复解码与计费

**Given** 局部二次抽帧请求越界、重复、理由无效或超过轮次/预算
**When** 服务端评估请求
**Then** 拒绝额外处理并记录安全的预算或策略原因
**And** 若现有证据仍不完整，结果明确标为 partial/low-confidence 或待定位，不循环抽帧、不编造完整结论

**Given** 视频包含音轨
**When** ASR 决策开始
**Then** 始终先执行语音检测并区分可靠人声、静音/仅 BGM 和无法可靠判断
**And** 静音或仅 BGM 明确跳过 ASR；可靠人声只对检测到的有效片段执行 ASR；未知状态只能按有界降级策略处理

**Given** VAD 识别出一个或多个可靠语音片段
**When** ASR 成功返回 transcript
**Then** 每段文本保留视频起止时间、语言/质量状态、source reference 和 observed_at
**And** transcript 不被表示为作者原文保证；低质量或冲突语音保持明确降级

**Given** 标题、正文、第一轮帧、可选局部二次帧和可选 transcript 已准备
**When** 调用 Story 1.9 建立的统一多模态证据流程
**Then** POI 候选、作者评价和推断信号可以引用具体文本、帧 pass/timestamp 或语音时间段
**And** 未执行的 ASR、缺失模态和局部补帧原因在证据质量中保持可见，不制造完整覆盖假象

**Given** frame extraction、VAD、ASR 或一次多模态 round 失败
**When** 仍存在其他可靠模态
**Then** attempt 保留可用证据并按 modality 标记部分失败，必要时进入仅媒体加待定位
**And** 重试有上限、幂等且受当前 attempt fencing 约束，不创建第二份用户结果

**Given** 视频处理阶段发生变化
**When** durable ingest event 被追加
**Then** 使用 `media_prep | speech_detect | frame_extract | asr | multimodal` 子阶段，并在事实 payload 中记录可选 pass/window、帧数和 skip reason
**And** 二次抽帧仍属于 `frame_extract`/`multimodal` 的有界迭代，不引入虚假百分比或新的用户工作流；前台沿用对应导入记录的一条中性状态，实际部分保存为 `部分内容已保存`，真正终止为 `这条导入未完成`，具体模态/失败原因按需展开，不打断其他导入

**Given** 视频任务完成、跳过或降级
**When** 观测系统记录该 attempt
**Then** 指标包含视频时长带、初次/附加帧数、二次抽帧触发与拒绝原因、VAD 分类、ASR 处理/跳过时长、缓存命中、耗时和成本
**And** 日志、Sentry、Langfuse 和分析不包含原始 URL、完整 transcript、未脱敏帧、精确私人输入或 Provider secret

**Given** Story 1.10 准备关闭
**When** 使用厦门及合成 fixture 覆盖短视频、长视频、信息不完整触发局部二次抽帧、重叠窗口、预算耗尽、静音、仅 BGM、人声、损坏媒体和部分模态失败，并运行真实采集/VAD/ASR/Provider staging、完整构建与 diff 检查
**Then** 短视频帧密度、局部补帧边界、跳过成本、时间戳证据、幂等缓存和诚实降级均可重复验证
**And** 完整 AMap 标准化、分店消歧和 BusinessArea 不被标记为本 Story 已交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 建立受限媒体检查和首轮自适应抽帧（源场景 1、2）
  - [ ] 服务端受限进程读取metadata并验证时长/分辨率/编码/文件大小；设下载、解码CPU/内存/时间/帧数限制与中止清理，不能拼接模型给出的shell命令。
  - [ ] 按版本化时长/场景策略，短视频≤30秒采用更密首轮采样，长视频有总帧上限；记录真实timestamp、policy/decoder版本与源媒体hash，不把相邻帧当时间证据确认。

- [ ] T2 处理可审计且有界的局部二次抽帧（源场景 3、4、5）
  - [ ] multimodal仅返回timestamp/reason/window/goal等typed request，服务端校验范围、理由、媒体一致性、窗口合并、去重与最大轮次/帧数/预算；缓存键包含源hash、sampling/model/prompt/policy版本。
  - [ ] 越界/重复/未知理由/超预算拒绝或按真实降级返回，不执行任意ffmpeg参数；二次结果与首轮证据区分，resample决定和实际取帧可追溯。

- [ ] T3 先VAD再按有效语音调用ASR（源场景 6、7、8）
  - [ ] 音轨先用选定真实VAD分类speech/silence/BGM/unknown；明确speech片段才按边界调用ASR，silence/BGM跳过并记录原因，unknown采用有界策略不盲开全长转写。
  - [ ] transcript带片段时间、来源/质量/版本；标题/正文/首轮帧/二次帧/可用transcript联合理解，所有字段schema验证，缺转写不会伪造台词或POI事实。

- [ ] T4 接入真实阶段、恢复与成本保护（源场景 9、10、11）
  - [ ] 持久media_prep/speech_detect/frame_extract/asr/multimodal等阶段和可复核计数，兼容1.6快照/1.7cursor与checkpoint；UI无虚构完成比例，部分失败保留有效资产与证据。
  - [ ] 每个外发/解码effect有attempt身份、deadline/cancel与迟到fence，未知ASR/multimodal账单不盲重试；重启复用同一已封存采样/转写结果，清理仅本attempt临时对象。
  - [ ] 指标包含实际帧数/窗口/轮次/VAD跳过/ASR秒数/费用unknown和evidence coverage；不送完整transcript、图片、原URL到普通telemetry。

- [ ] T5 验证真实视频矩阵与降级质量（源场景 1、2、3、4、5、6、7、8、9、10、11、12）
  - [ ] 准备有权使用的合成/非私人样本：短长视频、无音轨、纯BGM、少量语音、损坏/超限、时间窗口边缘及重复请求；单元验证拒绝，真实解码器/PG/队列验证资源上限和恢复。
  - [ ] 实际VAD/ASR/多模态/私有存储staging与人工证据核对完成后才关闭；比对首轮/二次抽帧的来源和费用，不仅截图或模型返回200。保留Provider缺项和未定版本为执行资源门槛。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] OPS-02：为本 Story 实际新增的媒体/临时/产物/反馈对象登记独立生命周期、ACL、共享引用及清理 fence；原图180天转低频不删除、缩略图长期。验证迟到上传、179/180/181天及并发引用，真实删除先干跑且按资源授权。
  - [ ] DB-CHANGE-01：仅为本 Story 实际 schema/索引/回填变化制定绑定 migration 与源码的恢复方案，真实匹配版本隔离 PG 验证；选择可逆、前向修复或 PITR，不清旧库解决问题。若没有数据库变更，关闭时给出可检查的不适用依据。
  - [ ] METRICS-01：在本 Story 首次消费处复核版本化事件/分母/时间窗/归因、隐私选择与脱敏，记录失败/取消/部分/未知；不等8.1才接线，不复制原始输入/位置/私有链接/凭据。
  - [ ] METRICS-02：分别记录本 Story 实际延迟/成功率/成本的样本、环境、并发与失败；真实基线及正式目标未确认时保留未验收，不用 fixture 或原型数字填通过。
  - [ ] METRICS-03：为本 Story 领域规则保留封存样本、版本和逐规则fixture，完整记录case/variant/repeat及失败/缺失；计分、提醒和需人评分别列出，不设置统一质量硬否决。早期规则测试不等待8.2；8.2真实yimeng-tong评分/评语和封存报告另为人评门槛，不能用合成证据关闭。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

扩展已获批1.9媒体/Gateway与1.7恢复；不新增OCR级联、后台设备录制或用户视频产物。VAD先行、ASR按speech事实决定，二次抽帧是typed受限请求。供应商/模型能力缺项局部阻断，不能选未确认服务假通过。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2 | T1 建立受限媒体检查和首轮自适应抽帧 |
| 3、4、5 | T2 处理可审计且有界的局部二次抽帧 |
| 6、7、8 | T3 先VAD再按有效语音调用ASR |
| 9、10、11 | T4 接入真实阶段、恢复与成本保护 |
| 1、2、3、4、5、6、7、8、9、10、11、12 | T5 验证真实视频矩阵与降级质量 |

### 当前代码、改动位置与保留行为

UPDATE：ingest/adapters.ts没有视频/VAD/ASR，durable-pipeline.ts是固定图文阶段，execution-checkpoint当前post/extracted/standardized/assets结构需版本化扩展；store.ts已按lease/attempt事务保存partial资产和事件，继续消费，不另起视频job权威。

NEW：ingest/video/{metadata,sampling,resample,vad,asr}.ts、受限进程adapter、版本化结果schema及样本manifest（建议）。OpenAPI阶段枚举与生成类型由本Story扩展；已有UI只消费真实阶段，新增面板不是本范围。

schema.prisma新增采样/语音/结果引用按媒体owner与attempt绑定；共享媒体去重不允许私有证据跨owner，临时对象生命周期消费1.9。

### 验证策略与资源门槛

真实ffmpeg/选定decoder二进制hash与资源限制证据；每种VAD结果都有ASR调用次数断言，模型resample恶意command不可能变成执行参数。PG SIGKILL/重复投递、成本未知、迟到输出和取消不越过账号/lease；供应商未接通保留阻断。

### 既有实现与版本调查

本轮ffmpeg官方filters页面读取失败，因此不声称核验了最新命令或漏洞版本；实施冻结二进制与安全更新并重查官方文档。抽帧/VAD/ASR接口保持供应商中立，优先复用1.9的实际Gateway与对象policy，不在准备中承诺未测性能数字。

### 引用

- CURRENT.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/epics.md
- _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
- _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
- docs/prd.md
- docs/architecture/index.md
- docs/architecture/backend-architecture.md
- docs/architecture/data-models.md
- docs/architecture/rest-api-spec.md
- docs/architecture/testing-strategy.md
- docs/front-end-spec.md
- docs/architecture/ui-foundation.md
- _bmad-output/implementation-artifacts/1-7-durable-import-progress-and-restart-recovery.md
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 本批准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 准备验证和独立审阅记录在同名 validation；所有开发任务保持未勾选。

### File List

- _bmad-output/implementation-artifacts/1-10-adaptive-video-understanding-and-local-frame-resampling.md
- _bmad-output/implementation-artifacts/1-10-adaptive-video-understanding-and-local-frame-resampling-validation.md
