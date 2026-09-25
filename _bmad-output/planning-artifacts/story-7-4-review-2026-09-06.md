---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.4'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-06
---

# Story 7.4 Review: 账号数据副本导出

Story 7.3's revised 14 GWT scenarios and Account Actions R2 were approved and appended.
Story 7.2 remains deferred. The user approved this scope/format, all 20 GWT scenarios and two R1
boards on 2026-09-06; they are appended to epics.md. This is planning approval, not implementation.
Business implementation and historical sprint status remain paused.

## Story

As a 旅行者,
I want 下载一份自己在 Nomad 中保存的数据副本,
So that 我能留存和查阅自己的规划内容，且不会误下载他人的数据。

**Requirements:** FR12 (account-data export); NFR2-NFR3, NFR7 (data-export closure), NFR8,
NFR20, NFR22 (read the exact linked revision set, no publication change);
AR1-AR6, AR9, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.

## Approved Scope

- A structured copy of currently saved product data, not a full database backup, revision archive
  or restore/import feature. Include every owned trip in scope, not only the selected trip.
- Approved format: one ZIP containing UTF-8 JSON files, a versioned manifest and a short readable
  scope guide. The PRD already permits JSON/ZIP for account data. This is separate from Epic 5's
  itinerary image export, whose no-ZIP and whole-trip/numbered-image rules remain unchanged.
- Before requesting, show the scope, exclusions, format and a concise personal-information notice.
  Do not add checkboxes for each category or a format/settings wizard in this slice.

| Approved included category | Product data boundary |
| --- | --- |
| Account basics | Existing safe account projection/preferences; no invented profile or unmasked phone/token/session identifiers |
| Current plans and saved input drafts | Saved time, accommodation/breakfast/luggage, pace/constraints and required/along-route choices; current standalone Plan and linked Trip/DayExcursion revision sets, candidates and transport facts |
| Inspiration/import index and annotations | Owner's import record/index, saved normalized place summaries, source titles/record identities and own annotations; only referenced shared facts, never other owners' relations |
| Checklists and itinerary text | Current records, lightweight shopping text, composed do/prepare/notice/why and user wording with source/author distinction; no restoration of user-deleted AI lines |

- Exclude historical superseded revisions, deleted/expired content, source image/video binaries,
  generated itinerary image binaries, device photo albums, internal task/event logs, raw model
  prompts/responses/evidence dumps, exact device-location trails and unrelated shared catalogs.
- Never export platform/user API keys, OAuth credentials, cookies, sessions, internal quota/cost
  ledgers, storage keys, signed download URLs or credential-bearing source URLs. Allowlisted saved
  product text is distinct from internal model-input envelopes. Source records retain safe titles
  and ids; do not bulk export private source URLs. Planned POI coordinates are not device traces.
- Describe omissions in both the request screen and archive guide/manifest. A currently empty
  category is valid and explicit. A failed required-category read is not an empty category.
- No new XHS/AMap/model call to fill the archive, no new album permission and no task/email/push
  notification feature. No account deletion or restoration flow; Story 7.5 remains independent.
- This is the approved MVP product-copy scope, not a claim that every possible privacy/legal data
  request is satisfied. Broader raw-media/history export needs its own scope decision.

## Brownfield Evidence

- `apps/server/src/routes/account.ts` currently enqueues account export and returns a Date.now-based
  `task_id` plus `queued`. `apps/server/src/plugins/queues.ts` defines `account-export` separately
  from `account-delete`. Queue acceptance alone is not a downloadable copy.
- `docs/api/openapi.yaml` has POST `/account/export` and generic `AccountTaskResponse` states;
  the inspected account path has no complete durable export-status/artifact-download contract.
- Repository searches over `apps/server/src` and `apps/server/scripts` did not locate an account
  export worker completing the packaging and delivery lifecycle. Implementation must verify the
  deployed worker path, not assume the current Settings queue response proves completion.
- Extend the existing Fastify/auth/queue/storage stack and generated contract. Use a persisted
  owner-scoped account export task, not Epic 5's image ExportJob or a new general workflow engine.
- The current architecture index/shards are authoritative. An old root-architecture reference to
  exporting signed media URLs is not authority for this scope and conflicts with current privacy.

## Minimal Delivery Contract

- Durable task identity, owner, scope/schema version, attempt fencing, real stage, snapshot ref,
  safe error/retry state and artifact metadata. A bounded status/recovery endpoint is required;
  reuse protected event/reconnect infrastructure if streamed, rather than introducing another one.
- One active export per owner; request idempotency plus concurrency control returns the same active
  task for repeated submissions. After a finished/expired task, explicit regeneration uses a new
  request and new snapshot. Technical retry and explicit regeneration are distinct commands.
- `snapshotAt` means the consistent capture cutoff, not the possibly earlier queued request time.
  Capture current immutable revision refs and allowlisted mutable product values under one
  consistent read into a durable dataset snapshot. Packaging then reads that snapshot, not live
  current pointers. Before sealing, a capture failure may restart with an honestly updated cutoff;
  after sealing, technical retries retain the same snapshot and policy/schema version.
- Read linked Trip/member/DayExcursion/Transfer/Stay/Luggage refs as one exact set. Do not export
  duplicate unrelated child current versions or silently assemble a mixed-revision trip.
- Bounded/streamed packaging, temporary-object lifecycle and a manifest of categories, counts,
  cutoff, schema/scope version, exclusions and file integrity. Mark ready only after actual object
  completion/integrity checks and atomic artifact publication. No half-complete success archive.
- Show factual queued/running/ready/failed/expired/unavailable outcomes. A status-read failure or
  browser departure is not a failed export. No quota balance, cost, reset window or fake percent.
- Authenticate owner and eligibility on status and every new download request. Deliver through a
  protected response/gateway; possession of a URL alone must not grant access. Private storage and
  no-store responses; never expose a public object or raw storage/signed URL as authorization.
- Configured retention controls actual `expiresAt`, separate from `snapshotAt` and `generatedAt`.
  Example dates in the board do not approve a seven-day policy. Expiry retires the export artifact
  and temporary copy, not source product data. New generation does not revive expired bytes.
- Logout revokes only that session, not an accepted export. A worker checks current account
  eligibility rather than reusing an expired browser cookie. Account deletion later must revoke
  access and clean associated artifacts; 7.4 implements eligibility checks at capture/publish/
  download without implementing or depending on the full 7.5 deletion workflow.
- Download retry uses the same still-valid artifact. A successful request/launch is not proof that
  the browser saved a file. For detectable errors show retry; do not falsely report saved-to-device.
- One current task screen, no archive-management dashboard. If explicit regeneration fails, an
  older still-valid artifact remains available with its own cutoff, not relabeled as current data.

## Approved Acceptance Criteria

### 1. Explicit request and scope

**Given** 用户从可用的设置入口进入账号数据导出
**When** 尚未提交申请
**Then** 展示数据范围、排除项、ZIP 内含 JSON 和个人信息提示，只有明确点击生成才创建任务
**And** 不因进入/返回/刷新页面触发导出，不改变行程图片导出的规则

### 2. Current saved product data

**Given** 当前账号存在计划、联程、已保存草稿、灵感、批注、清单或行程文字
**When** 按本 Story 的版本化字段白名单收集副本
**Then** 包含各类别当前已保存内容及必要的 owner 自有关系和已引用地点事实，保留用户表达与来源区分
**And** 未保存的本地输入不假装已备份，空类别明确为空，不纳入历史版本/原图视频/图片导出产物

### 3. Private-data boundary

**Given** 数据集中含共享 POI、私有来源、身份凭据或内部调用信息
**When** 收集、序列化、记录日志或报告失败
**Then** 只包含当前 owner 白名单数据及必要共享事实，排除其他 owner 关系和所有密钥/cookie/token/签名地址/内部额度
**And** 不导出原始模型输入输出、完整采集证据、原始私有来源 URL、原始设备位置轨迹或非安全账号标识，不向日志复制副本正文

### 4. Consistent cutoff and linked references

**Given** 用户在导出请求等待期间或数据收集期间继续修改计划、草稿或清单
**When** 完成一致性捕获
**Then** 固定真实 snapshotAt 下的当前字段和确切 Plan/Trip/DayExcursion/Transfer/Stay/Luggage 版本集合
**And** 不把请求时间冒充数据截至时间，不混合不同联程版本，不从实时 current 指针逐页拼接漂移副本

### 5. Snapshot-safe retry

**Given** 捕获或打包过程中失败/进程重启
**When** 恢复任务
**Then** 已封存快照的技术重试使用同一数据和策略版本；封存前可重新捕获但最终如实记录新 cutoff
**And** 迟到 worker 不得覆盖当前尝试/已发布产物，不在同一副本身份下静默替换成更新数据

### 6. Idempotent request

**Given** 重复点击、多端并发或提交响应丢失
**When** 再次提交或核实同一申请
**Then** 幂等回执和每 owner 单个活跃任务约束返回同一已受理任务，不重复打包
**And** 不能依赖 Date.now 作为唯一身份，也不把另一账号的任务用于合并

### 7. Real worker and complete artifact

**Given** 任务进入执行
**When** 收集、生成 JSON/说明/manifest 并上传 ZIP
**Then** 完成真实文件、类别完整性和校验检查后原子标记可下载，任务状态由持久化记录而非队列推测
**And** 必需类别读取失败、打包或对象存储失败不得以部分内容报成功或提前提供下载

### 8. Truthful progress and resume

**Given** 任务排队或执行中，用户离开、刷新、断网或退出后重新登录
**When** 回到当前账号的数据副本页面
**Then** 恢复实际任务和阶段，不自动再次申请；退出当前会话不取消已受理导出
**And** 状态读取失败显示核实/重试读取，不能把页面离开或网络错误标为任务失败，不显示虚构进度/额度

### 9. Ready metadata and portable contents

**Given** 导出已真实完成
**When** 打开下载页及副本
**Then** 展示真实文件名/大小、数据截至与下载有效至，ZIP 内的 JSON、manifest 和说明可解析且关联可核对
**And** 不把生成时间/过期时间当额度窗口，不宣称数据库备份、恢复导入或尚未实现的格式

### 10. Protected download

**Given** 用户读取状态或发起任一文件下载请求
**When** 服务端处理
**Then** 校验当前认证、owner、账号可用性、产物状态和有效期；无权/失效请求不得返回文件或私有元数据
**And** 不提供公开分享链接，不以已知 task id 或签名链接单独放行，文件名不能形成路径注入

### 11. Download retry is not regeneration

**Given** 副本仍有效而应用检测到下载请求失败
**When** 用户重试下载
**Then** 获取同一文件，不重新收集数据或启动导出任务
**And** 下载任务仍为可用；浏览器保存结果无法确认时不宣称已保存到设备/相册

### 12. Expiry and new generation

**Given** 文件已超过实际配置的有效期、不可再用或用户需要最新内容
**When** 用户选择重新生成
**Then** 创建新申请并捕获新的当前数据；旧过期文件不可通过刷新链接复活
**And** 清理仅针对导出副本及临时对象，不删除原始计划/灵感，留存时长不得硬编码为原型示例

### 13. No stale-data relabeling

**Given** 文件生成后账号内容发生修改，或新一轮生成失败
**When** 用户下载旧的仍有效副本
**Then** 明确保留该副本自己的数据截至时间，不声称包含后续变化
**And** 新任务失败不提前销毁仍有效旧产物，不自动再生成；无需提供完整历史版本管理界面

### 14. Account lifecycle boundary

**Given** 原请求会话失效，或账号在捕获/发布/下载前已被禁用或删除
**When** 任务和文件处理继续
**Then** 会话失效不等于取消任务；账号不再有资格时拒绝捕获/发布/后续下载并回收本任务临时数据
**And** 不实现账号删除本身，不以客户端登录旗标授权，不依赖 7.5 先交付才可完成本 Story

### 15. Bounded processing and honest failure

**Given** 无旅行数据、大量数据、超时、对象失败或部分读取故障
**When** 执行导出
**Then** 空账号仍可生成说明明确的副本，大数据按经过测试的资源策略有界处理；无法完成时如实失败并保留源数据
**And** 不静默截断、忽略失败类别或把未完成包当成功；重试受内部保护且不对用户展示额度

### 16. No unrelated side effects

**Given** 用户申请、查询、重试或下载副本
**When** 处理请求
**Then** 仅读取已有产品数据并写导出任务/临时数据/产物，不创建 PlanRevision/TripRevision 或改变用户内容
**And** 不调用 AI/高德/XHS 补资料，不读相册，不增加邮件/推送/运营 Telegram 或自动删除账号

### 17. Loading, authentication and accessibility

**Given** 小屏、长文件名、动态字体、读屏、reduced-motion、读取失败或登录过期
**When** 操作导出页
**Then** 图标有名称、44pt 目标、文字换行、状态播报/焦点返回正确，提供实际可用的重试/登录/返回
**And** 不只靠颜色，不让旧账号响应回填新账号页面，不把生成失败态用于未知读取结果

### 18. Complete vertical slice and contracts

**Given** 实现本 Story
**When** 扩展现有 account 导出入口、worker、最小持久化/存储和 mobile 客户端
**Then** 先维护 OpenAPI SSOT 并生成类型，交付申请到鉴权下载全链；按端到端真实能力开放设置入口
**And** 不顺便重写删除/反馈任务、增加通用任务框架或用 mock 下载链接证明业务完成

### 19. Data and security verification

**Given** 本 Story 准备验收
**When** 核验多 owner/共享 POI、联程含一日游、当前草稿/用户覆盖、并发编辑、快照重试、账号资格变化与过期
**Then** 解包真实产物核对字段/数量/关系/校验和及时间一致性，越权与凭据泄漏测试全部通过
**And** 证明普通退出不取消任务、删除资格禁止未来下载、技术重试不换快照且必需类别错误不产生成功文件

### 20. End-to-end recovery verification

**Given** 核验完整生产式执行路径
**When** 使用真实 PostgreSQL、队列 worker 和受保护对象存储，测试重启/重复提交/上传失败/下载失败/过期以及手机桌面视图
**Then** 契约、repository/route/mobile、存储 staging 检查、截图和 workspace build 通过，离开后可恢复同一任务并下载实际可解析文件
**And** 浏览器保存能力与文件期限按真实环境验证，不用 queue accepted、模拟成功或图中示例替代交付证据

## Visual Review

- Approved `../implementation-artifacts/visual/story-7-4-account-export-core-r1.png`:
  A request/scope; B running; C ready with metadata and download/regenerate.
- Approved `../implementation-artifacts/visual/story-7-4-account-export-recovery-r1.png`:
  A actual terminal generation failure; B expired artifact; C detectable download-request error
  while the same file remains ready. Not three interchangeable generic failure screens.
- Recovery A's annotation assumes a sealed snapshot; a pre-seal capture retry has no previous
  completed snapshot and must follow criterion 5. Stage, cutoff and retry permission remain factual.
- Dates, file size and filename are illustrative, not measured values or a fixed retention policy.
  Core C's expiry metadata also remains present in a real download-retry screen even if compacted
  in Recovery C. No quota copy or native album-save permission is authorized.
- Queued, loading/read-error, auth-expired, no-travel-data, regenerating-with-valid-old-file and
  long-name/large-font variants require implementation screenshots/tests against the text contract;
  these boards do not claim every visual edge state has been drawn.
- Generated with built-in imagegen, stored with sibling prompts. Both boards are approved subject
  to the text boundaries above; remaining variants still require implementation screenshots.

## Next Gate

The scope, JSON-in-ZIP format, snapshot/expiry and both boards are approved; the 20 GWT scenarios
are appended and source/packet contracts synchronized. Continue Story 7.5 review. Do not mark
Epic 7 complete or modify the implementation sprint.
