---
project: nomad-mvp
story_id: '1.11'
story_key: 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction
source_story_id: '1.11'
source_contract_sha256: 3b22fcdb1720910ff0bc832b62402a3655cc473dc9d3e50b4e26f5039f8c9585
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
- CODE-QUALITY-01
- UI-COMPONENT-01
- UI-WORKBENCH-01
- UI-BROWSER-01
delivery_requirements:
- FR4
- FR4.1
- FR4.2
- FR5
- FR6
- FR14
- FR20
- NFR1
- NFR5
- NFR8
- NFR12
- NFR21
- NFR23
- NFR25
source_obligations:
- shared-ui-adoption
dependencies: []
preparation_validation: _bmad-output/implementation-artifacts/1-11-amap-poi-verification-branch-disambiguation-and-manual-correction-validation.md
research_records:
- _bmad-output/implementation-artifacts/research/preparation-root-foundations-2026-09-25.md
---

# Story 1.11: 高德 POI 验证、分店消歧与运营手工纠错

Status: draft

> 本次只准备合同；ready-for-dev 需经准备验证，不能据此越过1.7执行停止边界或真实前置条件。

## Story

As a 旅行者与获授权运营者,
I want 导入地点经过可靠的高德匹配与分店确认，并能有依据地纠正错误地点资料,
So that 后续规划不会使用错误地址、错误分店或编造的地点事实.

**Requirements:** FR4, FR4.1, FR4.2, FR5, FR20; NFR1, NFR3, NFR7, NFR12,
NFR17, NFR21, NFR23; AR5, AR10-AR15, AR20; UX-DR6, UX-DR15,
UX-DR33

**Amendments:** CE-01于2026-09-14补品牌规则维护闭环；2026-09-15用户在额外运营工具中只保留手工纠错地点，本Story补7组GWT（15→22），不等待8.6或建立通用后台。

**Acceptance Criteria:**

**Given** Story 1.9 或 Story 1.10 产生一个包含来源城市、上下文和证据的地点候选
**When** ingest 进入地点标准化阶段
**Then** 服务端使用候选名称、来源城市、上下文地点和可用证据查询 AMap 适配器
**And** 在得到可审计的验证结果前，该候选只能保持待验证/待定位状态，不能成为可规划的 CanonicalPOI

**Given** AMap 返回唯一且超过版本化匹配阈值的高置信结果
**When** 服务端持久化验证结果
**Then** 创建或复用 CanonicalPOI，并保存 Provider ID、标准名称、文字地址、坐标、可用营业时间、评分、人均、电话和分类
**And** 每项外部事实保留来源、observed_at、新鲜度和质量状态，匹配策略与阈值版本可被审计

**Given** AMap 对某些标准字段没有返回值、返回冲突值或值已超过可配置新鲜度
**When** CanonicalPOI 被保存或读取
**Then** 缺失或不可靠字段保持 null、unknown 或 stale，并按字段策略决定是否刷新
**And** 服务端不得从模型、旧文案或相邻地点猜测 AMap 地址、坐标、营业时间、评分、人均或电话

**Given** 操作者具有服务端授予的品牌规则维护权限
**When** 在桌面Web查看、新增、修改或停用连锁品牌抑制规则
**Then** 在Story 1.11内提供实际可用的最小维护入口和持久草稿，服务端验证会话、读写权限、规则字段与作用范围，普通用户不可访问
**And** 保存草稿不改变当前生效规则；失败保留输入，不接受任意脚本/网络地址或客户端角色证明，不等待8.3/8.6或新建通用后台才可维护

**Given** 品牌规则草稿已保存且通过有界格式/匹配检查
**When** 获授权操作者基于预期当前版本确认发布，或查询/重试同一发布操作
**Then** 原子保存不可变规则版本、生效指针与包含操作者/时间/前后版本/结果的审计回执，以幂等operation ID恢复未知结果；并发冲突保留原规则并要求重新核对
**And** 每个ingest/geo attempt首次使用时固定确切规则版本，分店查询、筛选和重试不混用版本；发布对后续首次使用生效，热更新验证实际加载/使用，过期或缺少所需版本时有界等待/失败而不猜测，且不回写已完成的导入结果或标准POI

**Given** 操作者具备Story 1.0提供的真实运营身份及服务端地点纠错权限
**When** 在桌面Web选择一个已有CanonicalPOI并编辑其显示名称、文字地址或同城坐标
**Then** 读取原始高德快照与当前人工覆盖，保存带修改理由/依据引用的持久草稿，字段前后值清晰可查看
**And** 普通用户、无权环境和失效会话被服务端拒绝；不读取无关owner导入原文，不新建地点合并/别名/近邻/通用黑名单/任意重跑入口，品牌规则能力继续独立保留

**Given** 地点纠错草稿包含人工输入或位置调整
**When** 执行发布前检查
**Then** 校验允许字段、非空/长度、坐标范围与坐标系、同城及同一门店身份、依据和预期当前版本，展示差异及对后续查询/新任务的影响
**And** 不允许改Provider ID、城市或分店身份、改成另一个地点、合并记录或借任意JSON/脚本/URL自动抓取绕过检查；营业/评分/价格/电话等非本次允许字段保持原事实或未知，不从名称/坐标纠正推断它们

**Given** 地点纠错草稿通过检查且操作者明确确认差异
**When** 服务端基于预期当前地点事实版本与幂等operation ID发布
**Then** 原子保存不可变人工修正版本、生效引用和操作者/时间/理由/前后差异/结果审计回执，成功后才报告已发布
**And** 原始Provider快照保留，修改字段标为人工来源而非高德返回；并发Provider刷新/人工提交使基准失效时保留草稿并重新检查，不部分发布

**Given** 地点修正发布遇到失败、网络断开、重复提交或响应丢失
**When** 操作者查看状态或重试
**Then** 先按原操作身份恢复真实回执，已知失败保留原生效版本及草稿，相同操作不创建重复修正
**And** 结果未知不报成功/失败或盲目重发；撤权后的读取/写入被拒绝，列表/详情迟到响应不得越过当前权限或版本

**Given** 已发布人工修正与高德后续刷新共同存在
**When** 读取新的有效地点资料
**Then** 同一地点按明确的字段覆盖规则生成版本化有效事实：人工覆盖字段由其修正版本提供，其他字段取合法Provider快照并保留未知/新鲜度状态
**And** Provider刷新不静默清除人工覆盖，不混用不同版本坐标/地址；公共地点详情可按字段查看人工修正来源与时间，不公开操作者身份/内部备注或借此增加普通卡片质量徽章

**Given** 新查询、新任务或执行中的ingest/规划/导出读取地点与路线
**When** 地点修正刚发布或缓存命中
**Then** 新消费者首次使用时固定完整地点事实版本，路线缓存按端点事实版本隔离；已固定快照的任务沿原版本完成，过期或缺失所需事实时按已有合同恢复/失败
**And** 不自动重跑导入/规划，不改写已完成ImportRecord、已发布Plan/Trip/酒店/路线/导出快照；用户后续采纳更新仍走其原本的预览/确认/校验/版本流程

**Given** 操作者需要撤销一项人工覆盖或再次纠正
**When** 查看最新原始事实和修正差异并明确确认
**Then** 以新的修正版本和原子回执解除选定人工字段或替换覆盖值，检查仍基于当前事实/权限，完整审计保留
**And** 不是删除历史或回滚用户行程；恢复字段无可靠Provider值时保持未知，不把旧过期值宣称最新，也不撤销其他人的后续改动

**Given** 候选可能是连锁品牌或无法确定具体分店
**When** 服务端应用可编辑且有审计记录的连锁品牌抑制规则
**Then** 一次消歧最多向后续匹配流程提供 20 家 AMap 分店，该上限可配置但默认不得超过 20
**And** 品牌泛称不能被静默保存为任意分店，检索数量、裁剪原因和最终状态均可观测且不暴露给普通用户

**Given** 分店消歧拥有来源证据支持的可靠主 POI 坐标
**When** 对最多 20 家候选分店执行地理裁剪
**Then** 仅保留主 POI 2km 内的分店进入排序和待定位流程
**And** 若没有可靠中心点，则不强行应用 2km 规则或自动选中最近分店，而是保留诚实的歧义状态

**Given** 匹配低于自动确认阈值、多个结果冲突或分店仍不确定
**When** owner 在灵感库打开该待定位条目
**Then** 返回最多 5 个候选，每项只显示名称与文字地址中的商圈/地标上下文
**And** 不展示内部置信度、评分、距离、预计时长、虚构通勤或暗示系统已替用户确认的状态

**Given** owner 从 Top-5 中明确选择一个地点
**When** 服务端完成 owner 鉴权并提交选择
**Then** 选择以幂等、可审计的 user-confirmed evidence 写入并关联对应 CanonicalPOI
**And** 非 owner、过期 revision 或已被新 attempt 替代的选择不能覆盖当前结果

**Given** 不同导入记录或不同用户验证到同一个 AMap Provider ID
**When** 服务端解析 CanonicalPOI 身份
**Then** 按 Provider 与 Provider ID 复用标准 POI，而不是创建语义重复的地点事实
**And** 用户的 ImportRecord、来源证据、批注、选择状态和删除语义继续 owner 隔离，不因标准 POI 复用而互相可见

**Given** AMap 配额耗尽、超时、熔断、返回歧义或暂时不可用
**When** 当前验证 attempt 无法形成可靠匹配
**Then** 保留已取得的媒体、文本、地点候选与 evidence，并进入可重试的待定位或类型化失败状态
**And** 不创建伪造 CanonicalPOI、不丢失 owner 记录，也不让外部服务失败阻塞其他已验证灵感

**Given** 普通行程卡片展示一个已验证地点
**When** 客户端渲染卡片标题
**Then** 使用该读取/计划快照绑定的有效地点名称：默认高德标准名，存在获授权人工修正时按其字段版本取值；不在每张普通行程卡增加高德Logo、Provider名或质量徽章
**And** 合同、法律或 Provider 规则要求的归属信息只在实际需要的地图、地点详情或法律信息界面按适用规则统一呈现，不重复污染普通行程卡

**Given** AMap 验证在生产环境运行
**When** 适配器读取缓存、发起调用或记录观测
**Then** 缓存键包含 Provider、规范化查询和策略版本，并执行 TTL/事实新鲜度、调用配额、并发限制、超时、重试预算与熔断策略
**And** 日志、Sentry、Langfuse 和指标只记录脱敏查询摘要、结果数量、状态、耗时、缓存命中与错误代码，不记录受保护原始 URL、私人证据全文、手机号或 secret

**Given** AMap 原始结果包含未经当前架构规则规范化的商圈文字
**When** Story 1.11 发布验证结果
**Then** 可以将原始商圈文字作为带来源的地点事实保存，但不得把它声明为可靠 BusinessArea membership
**And** Epic 6 的商圈美食召回仍需独立的 BusinessArea 规范化与可靠性策略，本 Story 不提前交付该能力

**Given** Story 1.11 准备关闭
**When** 使用普通地点、连锁品牌、具体分店、20 家上限、有/无可靠中心、歧义 Top-5、关闭地点、字段缺失、缓存陈旧、配额/超时和越权 fixture，并运行 OpenAPI/生成类型、Prisma migration、真实 PostgreSQL、厦门 AMap staging、移动端普通卡片与待定位 Sheet、完整构建和 diff 检查
**Then** 自动匹配、用户确认、标准POI复用、事实新鲜度、隐私降级和普通卡片边界可验证；品牌规则与手工地点纠错均有真实桌面Web、权限、草稿/检查/并发发布/未知回执、撤销覆盖及固定版本证据
**And** 增加人工纠错与Provider刷新竞争、字段来源、跨城/换门店拒绝、路线缓存版本、旧任务/已发布行程不变的真实PG/API/浏览器验收；连锁聚合展示、BusinessArea召回与其他通用后台不算本Story交付

**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。

**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。

## Tasks / Subtasks

- [ ] T0 实施前核对合同与当前工作树（全部源 GWT）
  - [ ] 读取 CURRENT/Sprint 当前停止边界、本文来源指纹和上游真实能力；执行窗口获准后才进入开发。保留已有未提交实现、历史done和3.1暂停；不把本批准备当恢复开发。
  - [ ] 对下述 UPDATE 路径重新完整读取并保存实际内容摘要；NEW为建议新模块，不是假定存在。先维护 OpenAPI SSOT再生成类型，复用已有鉴权transport与持久回执，不另建内存权威。

- [ ] T1 实现AMap验证和字段级事实新鲜度（源场景 1、2、3、17、18、19、20、21）
  - [ ] Provider adapter固定查询/匹配policy版本，候选带城市/上下文/证据；按AMap ID归一CanonicalPOI，只在真实唯一高置信结果标verified，缺失/冲突/陈旧字段分别unknown/stale并保留来源和observed_at。
  - [ ] 配额/超时/熔断保持待定位且重试有界；普通卡不逐张版权badge。原始商圈文字不自动成为BusinessArea membership，6.3另行规范化。共享地点只共享公共事实，不带owner批注/私有来源。

- [ ] T2 交付品牌规则草稿、检查和原子发布（源场景 4、5、13）
  - [ ] 桌面运营入口用brand.rules能力及scope/version服务端复核；规则草稿有界格式/匹配check、差异预览和明确发布，同一operation未知结果可查询。
  - [ ] 发布成不可变规则版本，每个ingest attempt固定snapshot，不被后续规则漂移；抑制名单不再仅环境变量，当前无8.6时也能独立维护。

- [ ] T3 交付最小地点纠错和完整发布回执（源场景 6、7、8、9、12）
  - [ ] places.correct当前权限与字段白名单双检查：名称/地址/同城有效坐标，可无改动预览但无发布；禁止更换ProviderID/城市/商家身份、合并/批量及其他字段。
  - [ ] 草稿/校验/前后差异/确认/CAS expected fact+override version/幂等receipt原子提交；提交未知只核同operation，无权限/冲突不发写入。撤销覆盖用新版本保留历史，不删除原始Provider事实。

- [ ] T4 协调Provider刷新与人工覆盖及执行快照（源场景 10、11、12）
  - [ ] 分存原始事实、不可变override和effective fact版本，Provider刷新可更新原始层但不默默覆盖人工值；并发纠错/刷新 CAS/冲突处理可审计。
  - [ ] 新请求读取新effective版本，已发布Plan/Trip/Export与运行attempt按其固定快照；路线cache含端点fact version，不能旧坐标route冒充新事实。审计不存密钥/私有输入。

- [ ] T5 分店Top5与owner明确确认闭环（源场景 13、14、15、16）
  - [ ] 可靠证据主点才允许2km筛选，召回最多20分店、排序后Top5且界面只名址；中心不可靠不伪造距离/自动选店，低置信/冲突保持待定位。
  - [ ] owner明确选择候选经服务端复核记录到本人ImportRecord/Inspiration关系，幂等/版本和跨owner防护；不把其他人的选择推广成共享事实或重写已发布行程。

- [ ] T6 验证真实事实、运营权限和并发版本（源场景 1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16、17、18、19、20、21、22）
  - [ ] 真实PG测规则/override发布事务、双人冲突、Provider刷新、重复/未知回执、角色撤销、跨owner；浏览器桌面验证草稿/检查/无变化/失败/不可用/确认状态及共享UI。
  - [ ] 真实AMap与已授权test operator实证标准字段、阈值、unknown/stale和品牌样本；可脚本fixture补恶意payload但不能替代真实Provider与grant。来源/metric/版本manifest绑定当前代码。

- [ ] T90 工程条件逐项验收（仅本 Story 的实际变化范围）
  - [ ] OPS-01：扩充本 Story 的 owner/关系/任务/revision 恢复样本；保留源库和备份，真实环境开放前核对备份/PITR、新实例恢复和实测 RPO。当前隔离证据不能关闭生产运行门槛。
  - [ ] DB-CHANGE-01：仅为本 Story 实际 schema/索引/回填变化制定绑定 migration 与源码的恢复方案，真实匹配版本隔离 PG 验证；选择可逆、前向修复或 PITR，不清旧库解决问题。若没有数据库变更，关闭时给出可检查的不适用依据。
  - [ ] METRICS-01：在本 Story 首次消费处复核版本化事件/分母/时间窗/归因、隐私选择与脱敏，记录失败/取消/部分/未知；不等8.1才接线，不复制原始输入/位置/私有链接/凭据。
  - [ ] METRICS-02：分别记录本 Story 实际延迟/成功率/成本的样本、环境、并发与失败；真实基线及正式目标未确认时保留未验收，不用 fixture 或原型数字填通过。
  - [ ] METRICS-03：为本 Story 领域规则保留封存样本、版本和逐规则fixture，完整记录case/variant/repeat及失败/缺失；计分、提醒和需人评分别列出，不设置统一质量硬否决。早期规则测试不等待8.2；8.2真实yimeng-tong评分/评语和封存报告另为人评门槛，不能用合成证据关闭。
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

消费1.9/1.10证据候选，完成真实AMap事实及品牌消歧，并独立交付最小桌面品牌规则/地点纠错入口，不等待8.6运营总览。权限复用1.0真实operator grants；只允许名称/地址/同城坐标覆盖，不扩成地点合并、批量编辑或城市身份修改。

### 源场景到实施任务

源场景按上文 Given/When/Then 出现顺序编号（包含尾部 App/UI 场景）；原文标题与原型仍为权威。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、3、17、18、19、20、21 | T1 实现AMap验证和字段级事实新鲜度 |
| 4、5、13 | T2 交付品牌规则草稿、检查和原子发布 |
| 6、7、8、9、12 | T3 交付最小地点纠错和完整发布回执 |
| 10、11、12 | T4 协调Provider刷新与人工覆盖及执行快照 |
| 13、14、15、16 | T5 分店Top5与owner明确确认闭环 |
| 1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16、17、18、19、20、21、22 | T6 验证真实事实、运营权限和并发版本 |

### 当前代码、改动位置与保留行为

UPDATE：ingest/branch-rules.ts现有环境名单+最多20/可靠main点2km/Top5算法可复用边界，缺持久规则版本和管理发布；adapters.ts standardizeCandidates为stub，不能成为真实验证。

UPDATE：ingest/store.ts当前persistIngestOutput按amap_id upsert并直接写verified/provider_snapshot、同city name生成City，缺独立override/effective版本；迁移需保留owner/lease/事件事务并将共享事实写入新服务，禁止覆写用户历史revision。schema.prisma当前CanonicalPOI字段可扩但非完整目标模型。

UPDATE：apps/mobile/src/ops/OperatorAccess.tsx仅GET /ops/me、POST /ops/access-check审计及capability表，不是纠错后台；新增最小桌面路由消费相同grant/transport，不能在App移动端暴露运营页面。NEW：server/places及brand-rules repository/route、mobile/ops纠错与发布表单，OpenAPI先行。

### 验证策略与资源门槛

核心为PG原子发布、lease/版本和权限负例；真实AMap响应与字段缺失不能靠mock覆盖整条。UI以桌面运营原型及共享FormField/AppDialog构建，记录200%/键盘/focus/身份切换；本Story无额外App-HOST绑定，不为桌面运营引入手机后台。

### 既有实现与版本调查

现有OperatorAccess已提供places.correct和brand.rules等安全授权读取与operation audit，复用其真实能力而非UI开关。旧CanonicalPOI快照缺手工覆盖版本，不得按当前schema推断新架构已可用；AMap具体接口/配额/协议按真实账号安全配置位置核验，商业地区标准化由6.3拥有。

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

- _bmad-output/implementation-artifacts/1-11-amap-poi-verification-branch-disambiguation-and-manual-correction.md
- _bmad-output/implementation-artifacts/1-11-amap-poi-verification-branch-disambiguation-and-manual-correction-validation.md
