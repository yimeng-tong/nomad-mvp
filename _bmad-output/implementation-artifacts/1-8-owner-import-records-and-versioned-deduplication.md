---
project: nomad-mvp
story_id: '1.8'
story_key: 1-8-owner-import-records-and-versioned-deduplication
source_story_id: '1.8'
source_contract_sha256: 135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535
source_catalog: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
source_epics: _bmad-output/planning-artifacts/epics.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
source_obligations:
- shared-ui-adoption
source_requirements:
- FR5
- FR6
- FR18.1
- FR20
- NFR3
- NFR20
- NFR25
delivery_requirements:
- FR5
- FR6
- FR18.1
- FR20
- NFR8
- NFR20
- NFR25
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
baseline_commit: 69fae8d80a56de1284b5b0504039837b1e53a63d
prepared: '2026-09-26'
scope_revision: ui-foundation-2026-09-20
status: in-progress
preparation_validation: _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication-validation.md
---

# Story 1.8: Owner 导入记录与版本化去重

Status: in-progress

当前合同已通过独立准备复核，正进入已授权本地/隔离开发；ImportRecord、去重和 Library 记录页面尚未实施。源 Requirements 的 NFR3 与当前 delivery 绑定的 NFR8 均须满足，二者不可相互替代。11组源 GWT 与补充合同如下，实际 Tasks 和关闭证据继续保持 owner、设备和真实 PostgreSQL 门槛。

## Story 与源验收合同

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

- [x] T0 核对当前合同与现有实现（全部源 GWT）
  - [x] CURRENT/Sprint已明确移除旧1.7后停止边界；本Story按当前preparation_order即时准备，3.1仍paused。核对1.0 owner资格、1.6 operation/未知回执与1.7 event/lease现有源码和未关闭的真实门槛，不把上游整张未done误当本地实施禁止，也不把旧合同当完成证明。
  - [x] 完整读取下述UPDATE文件及现行schema/migration；保存开发基线和当前URL/受理/回执行为。先维护`docs/api/openapi.yaml`并生成类型，复用已有鉴权、operation、cursor与worker，不新增内存权威、第二个调度器或前端猜测去重。

- [ ] T1 建立版本化规范化与ImportRecord数据合同（源场景1、2、5；FR5/FR6/FR18.1/FR20、NFR3/NFR8/NFR20/NFR25）
  - [ ] OpenAPI/Prisma定义owner ImportRecord、受保护原始URL、normalized URL/policy version、稳定record id、当前job、状态/结果读模型及`(userId,normalizedUrl)`持久唯一约束；与现有IngestJob/IngestCommand/初始event/executionPending同一受理事务提交。`sourceTitle`仅在取得来源事实后填入，受理时允许明确pending，不伪造标题。
  - [ ] 只对明确支持的host/path/短链/canonical/已知追踪参数定义版本化规则与fixture。短链展开限制跳转次数、时长、响应大小、协议、目标DNS/IP及重绑定防SSRF；未知/不能安全展开时保留独立身份或明确拒绝，不猜等价。版本升级只影响新决定；旧record保留原值，跨版本别名/合并需独立可回滚冲突审计。
  - [ ] 当前`authorization.real_services=false`且生产采集能力关闭：实现短链解析的可注入策略和本地fixture/隔离PG证明，本轮不向真实XHS或其他外部目标请求用户链接。真实短链跳转、授权范围与目标环境列为后续实服务验收，不能用fixture声称已验证。
  - [ ] 原URL目前会出现在`IngestJob.sourceUrl`、`Inspiration.canonicalUrl`和来源证据，不能仅给新字段改名就声称“受保护”。定义只在owner详情解封的加密/密钥/备份/轮换边界及旧数据过渡；真实模式缺有效服务端密钥须fail closed，测试用独立fixture密钥。不得复用`apps/server/src/crypto/kms.ts`当前零密钥回退和固定GCM IV作为生产保护证明；日志/事件/列表/分析不带原URL。
  - [ ] 短链/redirect解析在受理数据库事务外有界执行；先以owner+operation查询已提交命令以恢复当时policy/normalized决定，不能因重定向或规则版本变化使丢ACK重试返回冲突或再建job。策略版本、原输入绑定与最终决策进入可审计持久回执，失败不保留虚假已受理状态。
  - [ ] Home当前`parseXhsBatch`把links.url规范化后交给controller和`startIngest`，原单条URL的fragment/尾斜杠可能已丢；补显式原单条URL字段穿过prepare/journal/受理，不上传分享全文、其他链接或未识别片段。旧客户端只有基础规范URL时保留可解释的legacy来源状态，不能伪称恢复了未保存的原字节。

- [ ] T2 持久并发去重与重试身份（源场景3–6）
  - [ ] 复用`acceptIngestCommand`的owner资格、operation锁/回执与source锁，数据库唯一约束为最终竞争裁判；约束冲突在新事务中读回同owner record/job并返回权威结果，不出现record有而job/command无的部分提交。运行、完成、失败三态各给源指定文案/原入口；失败只沿原job显式retry/new attempt，不自动重跑成功或再次完成FIFO。
  - [ ] 保持`retainedSourceHashes`旧actor alias、旧job/command/event/cursor兼容与冲突中止；部署前对既有URL、旧owner与同owner等价冲突做只读审计，设计可回滚回填，不能静默重写sourceHash、按手机号合并或清旧库。不同owner即使相同URL仍独立record/ACL/状态/删除，错误不透露对方记录。
  - [ ] 若record物化status/title/POI摘要，统一在`apps/server/src/ingest/event-log.ts`的`appendSnapshotEvent`及结果提交事务内更新；或从权威job/result实时投影。不得出现record显示done但事件/job仍运行、重试旧attempt覆盖新状态。

- [ ] T3 交付受保护列表、详情和来源动作（源场景4、7–9；shared-ui-adoption）
  - [ ] 新增独立的owner导入记录列表/详情API，在现有`HomeScreen`灵感页扩展“导入记录”区域与详情，不另建平行Library根页，也不把运行/失败record塞进现有`/library/inspirations`而破坏Planner消费。列表显示事实标题/状态/POI摘要/待定位、分页与空/加载/错误/已删除；只读详情经owner检查后最小返回原URL与可复制控件。44pt触点、读屏名、焦点、键盘和复制失败均核验。
  - [ ] 原URL、retry/delete、关联job/asset读取先校验当前资格与owner再取私有字段；不存在和非owner同中性响应。使用Nomad共享组件/私有Portal边界，切换owner时取消或隔离迟到请求和详情，不自动打开来源。新增ImportRecord列表/详情GET不创建job/operation或推进durable ACK；保留既有1.7旧job日志bootstrap的兼容行为。
  - [ ] 按NFR8核验移动单列、列表/弹窗流畅及适用120–200ms动效和reduced-motion；源NFR3在本Story表现为服务端secret、来源链接及私有对象不进入日志/Sentry/埋点或公共对象读取，本Story不因此启用新AI Provider/费用路径。

- [ ] T4 保护共享对象引用和删除边界（源场景6、9、10）
  - [ ] 删除/撤权覆盖ImportRecord及现有`/library/inspirations`、`/ingest/:jobId/result`、Planner读取和来源/asset访问路径；定义软删除或等效生命周期、运行job与worker迟到写栅栏、已有command回执及唯一键释放后的重提语义。删除前后同owner/非owner响应不得泄漏已删除私有事实。
  - [ ] 现有跨owner共享复用若不存在，不为本Story新建全局媒体池；如现有CanonicalPOI/asset/对象被多个有效owner引用，按独立ACL/引用/生命周期核验，不能因一owner删除而删他人可用对象或泄漏批注/原URL。
  - [ ] 删除/重新导入/worker迟到/账号停用并发验证，保留7.5将来全账号清理扩展点，不在本Story新增账号删除或擅自清真实桶。

- [ ] T5 完成真实PG与Library迁移验收（源场景1–11）
  - [ ] 隔离真实PG双连接验证同owner等价URL唯一、不同owner独立、受理事务回滚/约束冲突、丢响应沿原operation回执、旧job回填冲突、policy升级、失败attempt重试/删除及1.7 worker恢复；保存迁移前后不变量与恢复方案，不碰既有共享库。
  - [ ] 当前App/浏览器验证列表/详情/复制/权限/后台返回、账号A→B→A、迟到响应及Home重复提示；工作台/三引擎截图覆盖原型缺失的retry/terminal failure/reconnect/dedup。真机Android/iOS另列未验收，不用Map fixture、编译或图片替代PG/原生证明。

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

基于1.0稳定owner、1.6受理/未知回执、1.7持久事件和lease扩充ImportRecord；用户已于2026-09-25移除旧1.7后停止边界，当前仍遵守3.1暂停及真实资源门槛。记录受理即存在，不等待1.9/1.10解析成功，也不能让新去重规则改写既有记录的身份。源Requirements含NFR3，delivery额外绑定NFR8，两者均纳入验收。

### 源场景到实施任务

11组源场景按上文 Given/When/Then 出现顺序编号；尾部App/Code/Shared UI是补充合同，由T5、T90、T91承接，不计入11组GWT。原文合同与现行视觉参照共同约束实施。

| 源场景 | 实施责任 |
| --- | --- |
| 1、2、5 | T1 建立版本化规范化与ImportRecord数据合同 |
| 3、4、5、6 | T2 持久并发去重与重试身份 |
| 7、8、9 | T3 交付受保护列表、详情和来源动作 |
| 9、10 | T4 保护共享对象引用和删除边界 |
| 1、2、3、4、5、6、7、8、9、10、11 | T5 完成真实PG与Library迁移验收 |

### 当前代码、改动位置与保留行为

UPDATE：`apps/server/src/ingest/store.ts`的`acceptIngestCommand`在一个事务内校验owner、锁operation/source、创建job/初始event/executionPending/command；`retryIngestCommand`沿原job和attempt，`persistIngestOutput`仅在实际结果后建Inspiration。全局唯一`IngestJob.sourceHash`来自owner+当前基础URL，`retainedSourceHashes`兼容旧actor身份，均不是本Story版本化canonical唯一性。新record必须进入既有事务和lease/owner边界，不另建调度器或把Inspiration当受理记录。

UPDATE：`apps/server/src/ingest/event-log.ts`的`appendSnapshotEvent`原子提交job快照/seq/事件；新增物化record状态须同事务同步。`apps/server/src/ingest/link-parser.ts`当前只去fragment/尾斜杠且明确标为非1.8 canonical；扩展策略必须保留现有多链接和不支持项行为。`packages/prisma/schema.prisma`现有IngestJob/Inspiration/Asset无ImportRecord，迁移在1.7后增量创建且保留旧hash/job/event/owner。

UPDATE：`apps/mobile/src/home/HomeScreen.tsx`经`parseXhsBatch`目前只把基础规范URL交给Dock/controller，`apps/mobile/src/home/dock-controller.ts`又将其作为start body；因此新详情的“原始URL”必须从输入匹配到单链接、journal和服务端受理全程保留并保护，不能从normalized URL逆推。多链接的原文/未识别片段不应因此进入新API或遥测。

UPDATE：`docs/api/openapi.yaml`是API唯一规范，`packages/types/src/api-types.ts`只能生成。`apps/server/src/routes/ingest.ts`需保持既有operation/typed response，`apps/server/src/routes/library.ts`现仅有本人cities/inspirations/candidates；新record读模型仍authGuard+owner查询，不改变Planner消费的旧inspirations响应。`apps/mobile/src/home/api.ts`、`HomeScreen.tsx`、`HomeImportDock.tsx`及必要控制器接入明确重复结果和record入口，不重置FIFO/ACK。新Library详情组件与记录repository/policy模块可新增，但需先确认与现有路径职责不重叠。

原始URL目前在IngestJob/Inspiration/来源证据有明文字段；`apps/server/src/crypto/kms.ts`的零密钥回退及固定GCM IV不能作为新字段的生产加密。设计安全迁移/真实密钥来源与旧字段过渡，未具备密钥时真实写入必须显式不可用；不能因为列表不返回字段就声称已实现at-rest保护。

### 验证策略与资源门槛

真实PG事务、唯一冲突、policy升级和跨owner是核心，不仅纯URL函数。payload/log隐私负例检查原链接仅在本人detail授权输出；共享对象删除并发要保留他人有效引用。实际App原URL复制权限/返回及owner更换另列设备证据。

Library当前视觉参照`visual/story-1-4-library-import-records-r1.png`及Home Queue R4；`docs/ux/prototype-coverage.md`标记Library happy path仅Partial，失败/重连/去重须按本合同文本设计并实际渲染，不能把原型当完整验收。真实短链/采集Provider及原生设备不可由本地替身证明。

### 既有实现与版本调查

已核对当前受理、event与schema关键路径：`memoryAuthority`只限fixture，真实模式缺authority失败；保存结果由事务`appendSnapshotEvent`和lease fence保护，新record不能削弱它。多进程竞争必须由PG组合UNIQUE裁决，Prisma client按当前lockfile的5.22.0使用，不因网上新版文档升级ORM；实际PG版本仍须在隔离迁移前核对。

最新技术核对：Node 22使用WHATWG `URL`解析，不以正则猜重定向后的来源身份；Prisma复合唯一约束可用于owner键，客户端upsert并非所有形态都下推DB，真实冲突应处理`P2002`并在新事务读取owner结果。详见[Node URL](https://nodejs.org/download/release/latest-jod/docs/api/url.html)、[Prisma复合唯一](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints)、[Prisma upsert并发](https://docs.prisma.io/docs/orm/v6/reference/prisma-client-reference)。这些文档只提供API语义，仓库锁定版本和隔离PG实测决定实际实现。

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
- docs/architecture/frontend-data-navigation.md
- docs/architecture/app-host.md
- docs/ux/prototype-coverage.md
- _bmad-output/implementation-artifacts/visual/story-1-4-library-import-records-r1.png
- _bmad-output/implementation-artifacts/visual/story-1-4-home-import-queue-r4.png
- _bmad-output/implementation-artifacts/1-7-durable-import-progress-and-restart-recovery.md
- _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md

## Dev Agent Record

### Agent Model Used

Codex；本次执行 bmad-create-story，仅建立开发上下文。

### Completion Notes List

- 当前准备已补完整源合同、逐场景任务、现有实现/新增边界和验证方案；功能尚未实施。
- 两份独立只读准备复核的发现已纳入合同并记录在同名validation；准备完成时开发任务均未勾选。
- T0已核对当前源/权威路径和12文件SHA，保存`story-1-8-dev-progress-2026-09-26.md`及对应baseline.json；产品功能仍未实施，T1起均未完成。
- T1局部：`xhs-import-v1`纯规则与明确原URL的Home→journal传递已实现并通过本地测试；服务端仍无ImportRecord/URL保护持久化，T1和整张Story保持未勾选。

### File List

- _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication.md
- _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication-validation.md
- _bmad-output/implementation-artifacts/story-1-8-dev-progress-2026-09-26.md
- _bmad-output/implementation-artifacts/evidence/story-1-8-foundation-2026-09-26/baseline.json
- _bmad-output/implementation-artifacts/evidence/story-1-8-foundation-2026-09-26/validation.json
- apps/server/src/ingest/url-normalization-policy.ts
- apps/server/src/ingest/url-normalization-policy.test.ts
- apps/server/src/ingest/link-parser.ts
- apps/server/src/ingest/link-parser-original.test.ts
- apps/mobile/src/home/dock-controller.ts
- apps/mobile/src/home/dock-original-url.test.ts
- docs/api/openapi.yaml
- packages/types/src/api-types.ts
