---
project: nomad-mvp
story_id: '1.9'
story_key: 1-9-production-image-text-understanding-and-evidence
source_story_id: '1.9'
source_contract_sha256: c8d19b462211ec060b7ca3d26b73907de9ad1a3a30f63425e7b728f18a36a238
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
- FR6
- FR14
- FR28.1
- FR38
- NFR1
- NFR3
- NFR12
- NFR13
- NFR14
- NFR17
source_obligations: []
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/1-9-production-image-text-understanding-and-evidence-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 1.9: 生产级图文多模态理解与证据

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 系统可靠理解图文笔记中的地点和作者评价,
So that 导入的灵感能够成为可追溯的规划输入而不只是保存媒体.

**Requirements:** FR4, FR6, FR14, FR28.1; NFR1, NFR3, NFR12-NFR14,
NFR17, NFR20, NFR21; AR5, AR6, AR11-AR15, AR20; UX-DR5, UX-DR6,
UX-DR31

**Acceptance Criteria:**

**Given** owner 的 ImportRecord 指向一条受支持的图文笔记
**When** 生产采集适配器获取来源内容
**Then** Nomad 仅通过独立 HTTP 服务消费标题、正文、图片元数据和受控媒体流
**And** 不嵌入第三方采集器 GPL 代码；采集超时、许可限制或不可用返回类型化事实状态

**Given** 来源图片尚未进入 Nomad 管理的存储
**When** ingest 需要持久化或向多模态 Provider 提供媒体
**Then** 图片被复制到 owner-safe 的私有 COS 对象并通过短期签名 URL 访问
**And** 来源热链不能成为持久读取路径；部分复制失败记录到单项媒体状态且不伪造完整成功

**Given** 标题、正文和至少一个可用图片准备完成
**When** 多模态提取开始
**Then** 单一当前流程同时使用文本与图片并写入 `multimodal` 诊断阶段
**And** 不按低置信结果恢复 `text -> OCR -> VLM` 阶梯，也不由新流程写入旧诊断值

**Given** 多模态 Provider 返回有效结构化结果
**When** 服务端验证并持久化输出
**Then** 每个地点候选包含候选名称、可选作者评价线索、引用到具体文本或图片的 evidence、source attribution、质量、置信度和 observed_at
**And** 引用关系可追溯到 owner 的 ImportRecord 与受保护媒体，但前端响应不暴露 Provider 内部载荷或 secret

**Given** 内容暗示预约、票务、dawn、sunset、night、night-market 或玩法兴趣
**When** 提取器形成 EvidenceSignal 或 InterestSignal
**Then** 信号携带 source reference、质量、置信度、时间和 `inferred` 状态
**And** 推断不得显示为已预约、已购票或用户确认，也不能成为不可变 planning lock 或覆盖显式用户约束

**Given** 某个地点只有模糊名称、相互冲突证据或低于可配置质量阈值
**When** ingest 保存提取结果
**Then** 保留可用媒体和 evidence，并将地点明确标为待定位或低置信候选
**And** 不编造标准 POI、地址、坐标、营业时间、评分或作者未表达的评价

**Given** Provider 超时、返回无效 schema、触发额度或熔断，或者部分媒体不可读
**When** 当前 attempt 无法形成可靠提取
**Then** 服务端执行有上限且幂等的重试/回退策略，并记录安全错误代码、成本带和可重试性
**And** 最终降级为已保存媒体加待定位或明确失败，不创建第二套用户流程或要求 BYOK

**Given** 本 Story 首次引入生产多模态调用
**When** ProviderGateway 执行请求
**Then** 最小任务路由、并发/速率限制、token 与媒体上限、超时、成本 guard、熔断和远程 kill switch 同步生效
**And** Langfuse/Sentry/日志只记录脱敏摘要、prompt version、attempt、ImportRecord/job correlation、耗时、用量和结果质量，不记录原始 URL、完整私人输入或 Provider secret

**Given** 相同 ingest attempt 因队列重投、HTTP 重试或 worker 恢复被再次执行
**When** 输出针对同一 input/policy/prompt version 提交
**Then** 持久化使用幂等 attempt 身份，不重复创建 Inspiration、EvidenceSignal、媒体引用或计量记录
**And** 明确的新重试保留旧 attempt 审计，并只由当前 fenced attempt 发布 record 结果

**Given** owner 在 Library 查看图文 ImportRecord
**When** 图文提取完成、部分降级或失败
**Then** UI 继续使用现有记录详情展示解析地点、待定位和来源状态；实际部分保存只在对应记录显示一条中性 `部分内容已保存`，真正终止则显示 `这条导入未完成`，原因与可用内容进入该记录按需查看，不把部分保存表示为完整提取成功或影响其他任务
**And** 只展示有权且可解释的结果，不出现模型名、内部置信度调试数据或虚假的实时处理百分比

**Given** Story 1.9 准备关闭
**When** 运行 schema/adapter/幂等/降级/隐私单元测试、OpenAPI 与生成类型、厦门图文 fixture 的真实采集/Provider/COS/现有 GeoResolver staging、Library 浏览器检查、完整构建和 diff 检查
**Then** 地点候选、评价线索、证据引用、推断信号、私有媒体、成本和失败状态均可验证且无敏感信息泄露
**And** 视频抽帧、VAD/ASR、完整 AMap 字段、复杂分店消歧和 BusinessArea 不被标记为本 Story 已交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 替换生产采集与私有媒体转存适配器（源场景 1、2）
  - [ ] 独立HTTP采集服务固定接口/版本/错误和授权边界，不将GPL源码嵌进主应用；受支持来源只由服务端调用，限制重定向/大小/MIME/媒体数量/解码、超时和出站目标。
  - [ ] 真实下载/校验/hash并上传私有COS，持久对象metadata/ACL/refcount/原图与缩略生命周期；确认对象存在才报已转存，失效来源/部分媒体失败保留可解释结果，不把计算cosKey当上传。

- [ ] T2 交付图文联合结构化理解与证据（源场景 3、4、5、6）
  - [ ] 标题/正文/可用图片在同一多模态阶段输入，使用服务端Provider adapter与schema校验，避免OCR串行流水作为默认；输出candidate、evidence/provenance/observed_at/model/prompt version及引用范围。
  - [ ] 区分来源事实与模型推断，预约/票务/兴趣/日夜time hint带类型和证据；模糊/冲突/低质量留待定位或unknown，推断不设confirmed/硬时间锁，不编营业/票价/坐标或ProviderID。

- [ ] T3 接入最小可用Gateway和运行保护（源场景 7、8）
  - [ ] 固定每attempt模型/提示/配置版本，平台secret服务端托管；先有有界并发/超时/输出限制、预算保留/usage未知和受控fallback/kill，真实供应商失败不自动无限重试或新建用户任务。
  - [ ] 记录每次实际外发attempt和逻辑job不同维度；请求接收/输出schema有效/真实入库分别结论，费用缺失不是0。使用早期METRICS字典/脱敏和成本测量；界面不展示内部额度。

- [ ] T4 将真实外发语义纳入持久恢复（源场景 7、9）
  - [ ] 扩展1.7 checkpoint版本与effect分类：现在extract/rehost的fixture replayable=true不能直接用于计费Provider或真实上传；调用前持久effect identity，未知结果按provider幂等/查询能力恢复，无法核实则保留unknown，禁止盲重付。
  - [ ] 输出落盘、Inspiration/证据/Asset关系与事件更新使用当前lease/attempt和账号资格检查；旧attempt、停用owner及迟到响应不能发布，已保存partial不会因重试缺少资产被删除。

- [ ] T5 呈现图文导入事实并完成实证（源场景 10、11）
  - [ ] Library沿用1.8记录及1.6/1.7状态模型显示真实已保存/partial/待定位、来源摘要与失败；不增加虚构百分比，也不把HTTP接受/费用调用成功作为已入库。
  - [ ] 以真实PG/受保护COS/受控采集/选定多模态Provider和GeoResolver分层验证正常/过期/部分/超时/无效schema/重启/未知计费、跨owner权限和清理；记录真实配置位置与未接通项，fixture只测边界。

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

图文生产理解承接1.8 ImportRecord和1.7 attempt/checkpoint；视频/VAD/ASR归1.10，完整AMap事实/分店纠错归1.11。本Story首次生产多模态必须有最小Gateway路由、成本/并发保护与停用，不等待8.3/8.4整页；后续后台管理沿用同一authority。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2 | T1 替换生产采集与私有媒体转存适配器 |
| 3、4、5、6 | T2 交付图文联合结构化理解与证据 |
| 7、8 | T3 接入最小可用Gateway和运行保护 |
| 7、9 | T4 将真实外发语义纳入持久恢复 |
| 10、11 | T5 呈现图文导入事实并完成实证 |

### 当前代码、改动位置与保留行为

UPDATE：ingest/adapters.ts 当前XHS_DOWNLOADER_URL可HTTP获取基础payload，无URL返回杭州fixture；rehostMedia只生成key，extractPoiCandidates/standardizeCandidates仍启发式/模拟值。通过明确生产adapter替换，不能仅启用环境flag。

UPDATE：ingest/durable-pipeline.ts 现在checkpoint以fetch/extract/geo/rehost顺序记录inFlightReplayable，extract/rehost目前为true；真实计费/上传必须调整为实际幂等可核实语义并保留旧checkpoint兼容。ingest/store.ts 的persistIngestOutput与partial资产保留/owner/lease/事件事务必须保留，不能让直接写CanonicalPOI模拟verified越过1.11。

UPDATE：schema.prisma、docs/api/openapi.yaml及application.ts实际应用装配按新增repository/worker注册扩展。NEW：受控媒体存储、multimodal Gateway/evidence模块及真实staging脚本，具体命名遵从现有ingest/integrations边界。

### 验证策略与资源门槛

单元针对schema、错误归一/出站约束和证据来源；PG针对持久attempt和重复/崩溃；真实COS验证ACL/生命周期/撤权/对象存在；真实Provider与采集验收需已配置资源。缺secret只询问资源名称/配置位置，不在聊天索取，也不能用mock样本报告生产可用。

### 既有实现与版本调查

当前store.ts会写verified和provider_snapshot，生产路径需保证仅消费真实1.11鉴别后的事实；1.9输出结构不自行伪造验证。COS生命周期文档说明transition/expiration是不同动作，本合同原图180天仅transition且缩略长期；实际策略及回收需现场核验。

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

- _bmad-output/implementation-artifacts/1-9-production-image-text-understanding-and-evidence.md
- _bmad-output/implementation-artifacts/1-9-production-image-text-understanding-and-evidence-validation.md
