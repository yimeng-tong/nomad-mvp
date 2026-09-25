---
project: nomad-mvp
story_id: '1.8'
story_key: 1-8-owner-import-records-and-versioned-deduplication
source_story_id: '1.8'
source_contract_sha256: 135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535
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
- DB-CHANGE-01
- METRICS-01
- METRICS-02
- METRICS-03
- APP-HOST-01
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR5
- FR6
- FR18.1
- FR20
- NFR8
- NFR20
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 1.8: Owner 导入记录与版本化去重

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者,
I want 查看自己导入过的来源并避免重复处理同一链接,
So that 我可以追溯灵感来源而不会看到或影响其他用户的记录.

**Requirements:** FR5, FR6, FR18.1, FR20; NFR3, NFR20; AR5, AR12,
AR14, AR15, AR20; UX-DR3, UX-DR6, UX-DR32
App 宿主补充：NFR25; AR23-AR24; UX-DR36。

**Acceptance Criteria:**

**Given** owner 首次提交一个通过校验的小红书 URL
**When** 服务端创建 ingest job
**Then** 同一事务中创建 owner-scoped ImportRecord，并保存 normalization version、normalized URL、受保护原始 URL、来源标题和当前状态
**And** record 在 job 运行、失败或完成期间保持同一稳定标识，不等待成功后才出现

**Given** 输入 URL 包含受支持短链、canonical 变化或已知追踪参数
**When** normalization policy 处理 URL
**Then** 按版本化、可测试的规则展开或规范化 scheme、host、path 和允许移除的参数
**And** 记录保存实际使用的 policy version；未知或无法安全展开的形式不得被猜测成另一个 canonical URL

**Given** 同一 owner 并发提交两个按当前 policy 等价的 URL
**When** 数据库提交 record/job 创建
**Then** `(user_id, normalized_url)` 的持久唯一性只允许一份 ImportRecord
**And** 竞争请求返回同一记录及其权威 job 结果，而不是依靠客户端检查或产生重复计算

**Given** owner 再次提交已有等价 URL
**When** 现有记录处于运行、完成或失败状态
**Then** 运行中返回现有进度入口并就近显示 `正在导入`，完成态返回明确 duplicate 结果并显示 `已在灵感库` 与原记录查看入口，失败态返回针对原记录的显式重试动作；运行/已完成重复项不另作失败提示
**And** 重试使用可审计的新 attempt 或 job 语义，但不创建第二份 owner ImportRecord

**Given** normalization policy 后续升级
**When** 读取旧记录或处理新提交
**Then** 旧记录保留创建时的 normalized URL 与 policy version，不被后台静默重写
**And** 跨版本重新归一、合并或迁移必须是独立、可回滚且处理冲突的显式操作

**Given** 两个不同用户提交相同或等价的来源 URL
**When** 各自查看、重试或删除导入记录
**Then** 每个用户拥有独立的 ImportRecord、job 引用、状态和删除语义
**And** API、错误和 duplicate 结果不泄露另一用户是否导入过、解析结果、标题或批注

**Given** owner 打开 Library 的导入记录列表
**When** 列表加载成功
**Then** 每项显示来源标题、运行/失败/完成状态、已解析 POI 摘要和待定位状态
**And** 列表响应不返回受保护原始 URL，空列表、加载、重试失败和已删除状态均有明确移动端表现

**Given** owner 打开一条 ImportRecord 详情
**When** 服务端完成 owner 鉴权
**Then** 详情返回该记录的解析 POI、待定位结果、来源状态以及可复制的原始 URL
**And** 原始 URL 只在该详情边界按最小字段返回，复制按钮具备紧凑图标、44pt 目标和读屏标签

**Given** 未登录或非 owner 请求 ImportRecord 列表、详情、原始 URL、重试或删除
**When** 服务端执行查找
**Then** 在载入受保护字段或关联解析结果前拒绝访问，并使用中性的标准不可用响应
**And** UUID、normalized URL、job id、缓存命中或共享媒体指纹都不能作为授权证明

**Given** 平台已有或未来加入跨用户计算、媒体指纹或对象复用
**When** ImportRecord 引用共享对象
**Then** 每个 owner 仍有独立 ACL、引用计数/生命周期和删除语义
**And** 本 Story 不要求实现跨用户复用，但任何现有复用不得成为读取他人记录或删除共享对象的路径

**Given** Story 1.8 准备关闭
**When** 运行 OpenAPI/生成类型、Prisma migration、URL normalization fixture、并发唯一性、owner 越权、重试/删除、真实 PostgreSQL 和 Library 移动/桌面浏览器测试
**Then** 所有状态、隐私边界、短链/追踪参数/canonical 变体和数据库竞争检查通过
**And** POI 提取质量、视频理解、BusinessArea 与完整 AMap 事实不被标记为本 Story 已交付

**App delivery contract (CC 2026-09-19):** 消费 APP-HOST-01 和 UX-DR36；在实际 Tasks/关闭清单核验本 Story 的 Android/iOS 返回、键盘、安全区、权限、前后台/进程重建与 owner 隔离。原业务 GWT 在适用宿主执行，网页回归保持；不适用分支给出具体依据，不能用浏览器截图替代原生证据。

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 建立版本化规范化与ImportRecord数据合同（源场景 1、2、5）
  - [ ] OpenAPI/Prisma增加owner ImportRecord、原始URL受保护字段、normalized URL/policy version、关联Job/result及状态读模型；DB唯一约束(owner, normalized_url)配合不可变policy与别名迁移记录。受理事务即创建记录，与job/command/event/pending投递同提交。
  - [ ] 规范化仅处理批准的host/短链/canonical/已知跟踪参数；限制redirect次数、超时/响应大小/协议/IP目标防SSRF，缺可信canonical不能猜等价。版本升级只影响新决定，旧record可追溯，不能按新hash批量改写历史。

- [ ] T2 持久并发去重与重试身份（源场景 3、4、5、6）
  - [ ] 复用acceptIngestCommand的owner锁、operation去重和source锁，在真实PG冲突下返回同record/job；运行/已完成/失败重提采用源文案和原重试资格，重试保留recordId，只新attempt，不自动重跑成功。
  - [ ] 保持1.0 retainedSourceHashes旧身份兼容与冲突中止，跨owner即使相同URL仍独立record/ACL/进度，不跨人合并operation或泄漏对方是否导入。

- [ ] T3 交付受保护列表、详情和来源动作（源场景 7、8、9）
  - [ ] 新增owner过滤的列表/详情API及Library记录UI，列表无原始URL；详情只有本人可读取/明确复制来源，44pt图标名、键盘焦点、空/错误/读取未知态清楚。
  - [ ] 原URL、retry/delete和artifact所有接口每次资格/owner检查，已知recordID无权返回中性错误；Portal及迟到响应遵循共享层身份，复制失败不得称成功，不自动打开来源。

- [ ] T4 保护共享对象引用和删除边界（源场景 9、10）
  - [ ] 记录对象/来源私有引用与owner ACL；计算去重/媒体指纹复用不带出私人批注或链接。删除本人的关系后，仅无其他有效引用且符合既有生命周期才候选回收，删除前再核引用。
  - [ ] 删除/重新导入/worker迟到/账号停用并发验证，保留7.5将来全账号清理扩展点，不在本Story新增账号删除或擅自清真实桶。

- [ ] T5 完成真实PG与Library迁移验收（源场景 1、2、3、4、5、6、7、8、9、10、11）
  - [ ] 隔离PG并发双连接测试等价URL唯一、不同owner独立、事务回滚、响应丢失原回执、policy升级、失败attempt重试与旧sourceHash迁移；真实1.7worker恢复确保record先于解析成功。
  - [ ] 浏览器/实际App验证列表/详情/复制/权限/前后台、登录切换隐藏原URL，工作台及截图补记录场景；保存源hash、migration恢复证据和未验证资源，不用Map fixture证明持久去重。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] DB-CHANGE-01：仅为本 Story 实际 schema/索引/回填变化制定绑定 migration 与源码的恢复方案，真实匹配版本隔离 PG 验证；选择可逆、前向修复或 PITR，不清旧库解决问题。若没有数据库变更，关闭时给出可检查的不适用依据。
  - [ ] METRICS-01：在本 Story 首次消费处复核版本化事件/分母/时间窗/归因、隐私选择与脱敏，记录失败/取消/部分/未知；不等8.1才接线，不复制原始输入/位置/私有链接/凭据。
  - [ ] METRICS-02：分别记录本 Story 实际延迟/成功率/成本的样本、环境、并发与失败；真实基线及正式目标未确认时保留未验收，不用 fixture 或原型数字填通过。
  - [ ] METRICS-03：为本 Story 领域规则保留封存样本、版本和逐规则fixture，完整记录case/variant/repeat及失败/缺失；计分、提醒和需人评分别列出，不设置统一质量硬否决。早期规则测试不等待8.2；8.2真实yimeng-tong评分/评语和封存报告另为人评门槛，不能用合成证据关闭。
  - [ ] APP-HOST-01：在本 Story 实际 Android/iOS 页面与能力上核验返回键、键盘、安全区、权限、前后台/进程重建和 owner 隔离；iOS16.4+及批准Android矩阵、Web Safari16.4+/Firefox128+分别记录。无页面/权限分支须给具体不适用理由，构建与浏览器不能代替真机。
  - [ ] CODE-QUALITY-01：本 Story 所有新改源文件纳入9.4实际类型lint、Hooks/a11y和类型生成检查；历史例外不得增长，失败不得忽略，不为了lint改动领域权威或全仓格式。
  - [ ] UI-COMPONENT-01：本 Story 的明确页面消费 Nomad 基础/组合组件，沿用批准品牌与布局；Portal跟随身份遮蔽，焦点/滚动/受控关闭/状态不破坏原领域合同，旧兼容组件记录退出责任。
  - [ ] UI-WORKBENCH-01：本 Story 新增或修改的组件补正常、空、loading、error、partial/reconnect、长中文、200%字号、身份未确认等适用场景及交互/a11y；复用9.4隔离MSW，未声明网络必须失败，开发入口不入产品。
  - [ ] UI-BROWSER-01：通过9.5已固定引擎/字体/数据/时区的流程与截图门禁，核验本 Story 私有Portal、迟到响应、焦点返回和未知回执；保留原PG/恢复探针，显式审阅基线，不用截图代替真机或真实供应商。

- [ ] T91 来源义务进入关闭证据
  - [ ] shared-ui-adoption：落实共享组件、品牌、Portal身份、焦点/返回/状态与本Story平台回归；旧组件记录迁移责任；关闭证据：当前源码组件/浏览器/适用原生证据，逐Story关闭

- [ ] T92 验证、审阅与交接
  - [ ] 对下表每组源 GWT给出对应实现/测试和真实未测门槛；执行相关正反例及独立代码审阅。保留失败和资源阻断，不用占位、skip或旧版本产物记通过。
  - [ ] condition_progress仅按本 Story的现有证据推进；verified/not-applicable都附范围、摘要和现存路径。状态变更后运行 pnpm run ci:handoff；变更守卫才运行其回归，不为状态迁移弱化守卫。

## Dev Notes

### 交付边界与依赖

基于1.0稳定owner、1.6受理/未知回执、1.7持久事件和lease扩充ImportRecord；准备不越过当前1.7开发停止边界。记录受理即存在，不等待1.9/1.10解析成功，也不能让新去重规则改写既有记录的身份。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、5 | T1 建立版本化规范化与ImportRecord数据合同 |
| 3、4、5、6 | T2 持久并发去重与重试身份 |
| 7、8、9 | T3 交付受保护列表、详情和来源动作 |
| 9、10 | T4 保护共享对象引用和删除边界 |
| 1、2、3、4、5、6、7、8、9、10、11 | T5 完成真实PG与Library迁移验收 |

### 当前代码、改动位置与保留行为

UPDATE：apps/server/src/ingest/store.ts 当前acceptIngestCommand事务创建IngestJob/IngestCommand/事件及executionPending，唯一性依赖owner sourceHash且支持retainedSourceHashes；尚无ImportRecord。持久化输出才建立Inspiration，因此不能把Inspiration当受理记录。新增记录必须进入既有事务和lease/owner边界，不另建第二个调度器。

UPDATE：routes/library.ts仅有本人cities/inspirations/candidates；新增record读模型仍authGuard+owner查询。HomeScreen已有result token和Dock上下文，记录列表为Library消费点，保持导入控制器/ACK不变。schema.prisma现有IngestJob/Inspiration/Asset需加显式关系及约束，迁移不能清旧sourceHash。

NEW：ingest/import-records.ts、url-normalization-policy.ts与记录详情UI/测试（建议），当前并无这些模块；OpenAPI字段及生成类型先行。

### 验证策略与资源门槛

真实PG事务、唯一冲突、policy升级和跨owner是核心，不仅纯URL函数。payload/log隐私负例检查原链接仅在本人detail授权输出；共享对象删除并发要保留他人有效引用。实际App原URL复制权限/返回及owner更换另列设备证据。

### 既有实现与版本调查

已完整读取store.ts和durable-pipeline.ts：当前memoryAuthority只限fixture，真实模式缺authority失败；保存结果由事务appendSnapshotEvent并受lease fence保护，新record不能削弱它。PG组合UNIQUE而非先查再插确保多进程约束；安装时沿用实际PG版本，不因文档current18自动升级VM104。

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

- _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication.md
- _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication-validation.md
