---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.5'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-06
---

# Story 7.5 Review: 账号删除与清理结果

Story 7.4's data scope, JSON-in-ZIP, 20 GWT scenarios and two R1 boards were approved and appended.
The user approved this scope, all 22 GWT scenarios and both R1 boards on 2026-09-06; they are
appended to epics.md. Planning approval is not authority to delete an actual account or resume code.
Story 7.2 remains deferred; implementation and historical sprint state remain paused.

## Story

As a 旅行者,
I want 明确确认删除自己的账号，并知道相关数据是否已清理,
So that 我能停止使用服务，而不被仍可访问的旧数据或含糊的处理结果困扰。

**Requirements:** FR12 (account deletion), FR18.1 (shared-reference deletion/owner isolation);
NFR2-NFR3, NFR7 (deletion closure), NFR8, NFR20;
AR1-AR6, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.

## Approved Product Decisions

- Settings -> scope/consequences -> final confirmation -> account access stopped and cleanup
  continuing -> verified result. Merely opening the entry, proceeding to the confirmation Sheet,
  dismissing it or performing identity verification must not delete data.
- Optional `先导出账号数据` opens approved 7.4. Export is neither automatic nor mandatory; after
  submitting deletion, pending exports are stopped and existing download access revoked. Users who
  want a copy must complete downloading before final confirmation. Downloaded/shared copies
  outside Nomad's control cannot be recalled by account deletion.
- Final server acceptance is irreversible in this slice: no undo, account restore, cooling-off
  period, retention questionnaire or mandatory free-text reason. Until acceptance, cancel returns
  without deletion. This no-cancellation boundary is confirmed by the user.
- Acceptance stops ordinary account access on all devices and durably schedules cleanup. It does
  not mean every database/object/trace has already been erased. Local private state and late
  responses are cleared/fenced; a stale offline device must clear on reconnect, not be promised
  instant remote erasure.
- Distinguish real states: not submitted, submitting/outcome unknown, access stopped/cleaning,
  known incomplete cleanup with permitted retry, verified online-data cleanup, and read-unavailable.
  Failure never reactivates the account. Returning to login does not cancel accepted deletion.
- Keep a minimal authenticated deletion-progress path after normal sessions are revoked. It
  exposes only this request's safe status/retention summary, not trips, exports or private data.
  A task id alone is never authorization. Expired/lost proof requires an existing real identity
  verification path that issues only deletion-status capability, not a normal account session.
- Retrying cleanup acts only on unfinished steps of the same accepted request. A status-only
  receipt cannot authorize writes; require a separately scoped authorized retry grant or fresh
  verification. Do not make retry depend on a future feedback Story or an operator dashboard.
- Account deletion is wider than 7.4 export: remove current AND historical owned product data,
  drafts, import records/annotations/evidence, saved media references, planning/fill/edit/undo
  records, checklists, recent/resume metadata, image/data export artifacts, private credentials
  including retained legacy BYOK records, and owner-associated temporary/cached data.
- Delete the user's shared-object ACL/references without deleting another owner's valid data.
  Only independently permissible shared facts/objects with valid remaining references may remain;
  a fingerprint match never makes private annotations/evidence public or retained indefinitely.
- Audit every deployed store/processor. Product data, object storage, caches/queues and identifying
  analytics/Langfuse/Sentry traces need concrete cleanup/anonymization receipts or an explicit
  justified retention disposition. Disabled/unconfigured integrations are `not_applicable` only
  with evidence, not silently skipped failures. Hashing an identifier alone is not anonymization.
- Approved completion wording: `账号已删除 / 在线个人数据已清理`. Isolated backups and any justified
  retained records are disclosed separately with a versioned purpose, scope, access controls and
  actual expiry policy. No guessed retention days or blanket exemption. Unknown active-system
  cleanup remains incomplete; unknown retention cannot be used to claim full erasure.
- Backup restoration must replay deletion tombstones before reopening service so deleted data
  cannot reappear. A tombstone/receipt is a minimal protected record with an explicit retention
  purpose, not an indefinite copy of user content. This product contract is not a legal-compliance claim;
  deployment-specific retention/disclosure must be established before this Story is accepted as done.
- Re-login must not resurrect the deleted identity. If the same external identity later explicitly
  creates an account after allowed cleanup completion, it gets a fresh internal owner identity with
  no former content/keys. While deletion is pending, verification returns restricted status rather
  than silently creating a new active account or starting a second deletion.
- No quota display, new email/push/Telegram notification, album feature, check-in or broad identity
  merge/device-management product. Production identity and lifecycle guards necessary for safe
  deletion are part of this vertical slice, not a separate forward prerequisite.

## Brownfield Evidence and Required Safety Work

- `apps/server/src/routes/account.ts` currently enqueues `account-delete` and returns a Date.now
  task id plus `queued`; there is no access-stop transaction or completed cleanup proof there.
- `apps/server/src/plugins/queues.ts` defines `account-delete`. Searches over inspected server
  source/scripts found no full account cleanup worker. Do not mark the feature done from acceptance.
- `apps/server/src/plugins/auth.ts` accepts `x-user-id` without a cookie in the inspected baseline;
  that header must never authorize production deletion, recovery grants or access to deleting data.
- `apps/server/src/auth/session-store.ts` keeps sessions in memory and derives a fixed `u_...`
  id from phone; `routes/auth.ts` can issue a new session without checking durable deletion state.
  Server-side all-session/lifecycle checks must survive process restart and apply to session issue,
  protected reads/writes/SSE/artifact requests and worker publication, not just Settings.
- Prisma defines User/Session/Identity relations and many cascade deletes, but no inspected
  deletion-task inventory. Cascading the owner before recording external object/trace references
  would lose the information needed to finish cleanup. Prepare durable cleanup work first.
- Reuse deployed real authentication and its existing step-up pattern; no new phone/password
  enrollment is required for users of another supported login method. Stub OTP/dev headers are
  test fixtures only and cannot satisfy a real-service destructive-action acceptance gate.
- Reuse the existing queue/repository/transaction/storage patterns, scope migrations to durable
  account lifecycle, deletion request/steps and minimal restricted receipt. No general saga engine
  or full auth-platform replacement; a production identity gap remains an explicit blocker, not
  permission to accept unsafe requests.

## Minimal Delivery Contract

- Final command binds current verified identity, a short-lived owner/action-specific confirmation
  challenge, idempotency key and expected account lifecycle version. Validate origin/CSRF for
  cookie-authenticated writes. Expired/replayed/different-owner challenges cannot delete anything.
- Prepare a restricted status receipt before the destructive commit, tied to the same request;
  it can report not-submitted/unknown until a committed request exists. Secure HTTP-only storage,
  server-side hashed proof, bounded lifetime, no URL/query/log token. This lets an accepted request
  be rediscovered after a lost response and all-session revocation without restoring normal login.
- One database transaction marks the owner deleting, advances an authorization/deletion epoch,
  revokes normal sessions, creates the durable task and an outbox item. Dispatch to the queue is
  retried from the outbox. Queue failure after commit cannot restore access or lose the request.
- Do not equate in-memory session removal with authorization revocation. Persistent owner lifecycle
  and epoch guard every new command/read, stream continuation and final worker commit. Quiesce
  active work, invalidate attempts, reject late results and collect late temporary uploads.
- `AccountDeletionTask` persists request id, policy version, safe state, current attempt, step
  checkpoints and restricted receipt metadata. `DeletionCleanupStep` records store/class, opaque
  handles, completion evidence and safe failure/retry. Sensitive handles are isolated from user
  views/logs and removed with their defined lifecycle. Exact table naming remains implementation.
- Inventory full current/historical ownership after access is stopped and before destructive
  cascades. Bounded cleanup follows dependency order and idempotency; process restarts resume only
  remaining work. Missing objects are success only after verifying the requested ownership/key.
- Shared object cleanup uses transactional reference removal plus reference-safe garbage collection;
  race with another owner importing the same content must not remove their reference/blob or
  preserve deleting-owner access. Never turn deletion into implicit publication to AnchorPool.
- Stop account/image export capture/publication, revoke future downloads and remove artifacts and
  snapshots. In-flight transfers are terminated where supported; bytes already received or browser
  copies cannot be clawed back. No new export is started to help deletion finish.
- Distinguish `online_cleanup_complete` from residual isolated-retention obligations; expose actual
  category disposition and policy link, never raw identifiers. External deletion acknowledgment
  counts as completion only if it proves the expected disposition; pending remote work is pending.
- Receipt reads are safe and narrow. Read failures do not update task truth. Cleanup retry requires
  separately verified limited authority and fences to the same deletion epoch. Status capability
  cannot call ordinary account APIs or start a second deletion, download a copy or restore content.
- Re-auth for status while deleting is independent of normal sign-in. Minimal identity association
  for that purpose is a policy-bound protected record, not full preserved account data. After the
  published recovery window expires, show proof unavailable and existing documented recovery only;
  do not silently recreate the account. Any later registration is explicit and gets a fresh owner id.

## Approved Acceptance Criteria

### 1. Clear scope before destructive action

**Given** 用户进入删除账号页面
**When** 查看范围、保留说明或打开最终确认 Sheet
**Then** 明确展示将删除的数据、所有设备停止访问、受理后不可撤销及不可撤回的外部副本边界
**And** 未最终确认不执行删除；关闭/取消返回原流程，不增加挽留问卷或强制原因

### 2. Optional export, never a prerequisite

**Given** 用户想先留存数据，或已有生成中的副本
**When** 从删除前页面选择导出或最终确认删除
**Then** 导出复用 7.4 且不强制；确认前提示需先完成下载，确认删除后停止未完成导出并撤销后续下载
**And** 不自动导出、不等待导出成功才允许删除、不承诺撤回已下载/分享的副本

### 3. Verified identity and confirmation

**Given** 用户提交最终删除命令
**When** 服务端核验真实身份、近期认证、owner/action challenge、有效期和请求来源
**Then** 仅有效确认可进入删除，需重新核验时复用已有登录方式而不强制新增手机号或密码
**And** 开发请求头、stub OTP、过期/重放/跨 owner challenge 和 CSRF 请求不能授权生产删除

### 4. Atomic acceptance and delivery

**Given** 有效删除命令通过校验
**When** 服务端提交事务
**Then** 原子固定删除任务、生命周期/授权版本、普通会话撤销与可重发的队列投递记录
**And** 只在提交成功后称已受理；队列暂不可用不丢任务或重新开放账号，提交前失败不擅自停用

### 5. All-device access stops

**Given** 删除已受理
**When** 旧设备、旧会话、深链、SSE 或 artifact 链接访问，或服务进程重启
**Then** 持久化账号资格检查阻止普通读取/写入/下载和新登录会话，只保留限定的删除状态能力
**And** 前台清理私有缓存并丢弃迟到响应；离线设备下次连接核验并清除，不能承诺瞬时擦除离线副本

### 6. Duplicate and unknown submission

**Given** 重复点击、多设备提交或提交响应丢失
**When** 核实或重试原申请
**Then** 通过幂等 key、唯一活跃删除请求及预先绑定的安全回执恢复同一任务
**And** 不生成第二个删除、不把未知结果宣称失败/完成，不要求恢复普通账号权限才能核实

### 7. Stop ongoing work and late writes

**Given** 导入、规划、AI 调整、细节、图片或数据导出任务仍在运行
**When** 账号进入删除状态或迟到结果到达
**Then** 停止后续工作并以账号删除版本/attempt fence 拒绝发布，登记和清理已产生的临时数据
**And** 重启 worker、自动重试和旧回调不能重建账号数据或恢复下载权限

### 8. Full owned-data inventory

**Given** 账号具有当前/历史计划、联程/一日游、草稿、灵感和用户内容
**When** 收集并执行清理
**Then** 覆盖所有自有版本、住宿/早餐/行李、候选/来源证据、修改/撤销、清单、细节与最近访问等记录
**And** 删除范围不受 7.4 当前版本导出白名单限制，不先级联删掉外部文件/trace 清理所需引用

### 9. Credentials, cache and artifacts

**Given** 账号关联登录身份、会话、历史 BYOK、缓存、媒体及导出对象
**When** 执行对应清理步骤
**Then** 清理/撤销自有凭据、私有对象、缓存、临时数据及导出快照/文件，确认后续访问失效
**And** 不删除平台共用 Provider secret，不把已下载到外部的文件宣称远程清除

### 10. Shared-reference safety

**Given** 多个用户导入同一内容或共享 CanonicalPOI/媒体指纹
**When** 删除当前账号的关系并回收对象
**Then** 移除其 ACL/私有证据与批注，仅在无其他有效引用且允许回收时删除共享对象
**And** 与他人并发导入/删除也不误删其他 owner 数据，不因去重将个人内容公开或永久保留

### 11. Every deployed store accounted for

**Given** 数据可能分布于数据库、队列/缓存、对象存储及已启用的分析/错误/追踪系统
**When** 执行版本化清理清单
**Then** 每类都有完成、验证匿名化、明确隔离保留或未部署证据，不漏掉 Langfuse/Sentry 等实际保存的可识别数据
**And** 接口受理不等于物理清完，远端待处理仍为未完成，纯 hash 不冒充不可关联匿名化

### 12. Resumable idempotent cleanup

**Given** 大量记录/文件、部分目标已不存在或 worker 中途重启
**When** 继续清理
**Then** 按持久步骤和有界策略续做未完成部分，去重与所有权检查后重复删除安全
**And** 迟到尝试不覆盖当前状态，不因某步失败回滚到活跃账号或丢弃未清理对象记录

### 13. Known incomplete cleanup

**Given** 某个真实清理步骤失败或等待外部处理
**When** 展示结果和恢复动作
**Then** 显示部分数据尚未清理完成、账号仍停用；按真实重试资格提供继续处理，不假报已完成
**And** 用户重试需限定授权且只继续原任务剩余步骤，不恢复账号、不依赖 7.6 反馈或未来运营后台

### 14. Read error is not task failure

**Given** 页面读取进度失败、断网或响应过时
**When** 用户重新查看
**Then** 只重读进度，并区分上次已确认事实与当前未知状态
**And** 不再次提交删除、不把离开页面当失败，不虚构后台已重试或已清理完成

### 15. Restricted post-deletion recovery

**Given** 普通会话已撤销但用户需查看删除结果
**When** 使用有效受限回执或通过既有身份验证重新取得状态权限
**Then** 只读本次安全进度与保留说明；回执过期/丢失走限定核验，不发普通登录会话
**And** task id/原始用户 id/URL 参数不是凭证，回执不进入地址栏或日志、不允许读取行程/下载副本/跨 owner 查询

### 16. Truthful completion and retention

**Given** 必需在线数据步骤已获验证，可能仍有政策允许的隔离备份或最小保留记录
**When** 显示账号已删除
**Then** 明确在线个人数据已清理，并独立说明实际保留范围、用途、访问限制和到期政策
**And** 不笼统宣称所有副本即时消失；未知清理结果或未确定保留政策不能通过完成验收

### 17. Backup restoration does not resurrect data

**Given** 曾删除账号的数据仍在尚未到期的隔离备份中
**When** 按实际备份恢复流程恢复环境
**Then** 服务开放前重放受保护的删除记录，确认该账号无法登录、读回内容或被 worker 重新发布
**And** 删除记录及回执本身有明确最小保留周期/权限，不无限保存账号内容作恢复依据

### 18. No implicit account resurrection

**Given** 同一手机号或第三方身份再次验证，删除可能仍在进行或已完成
**When** 登录/恢复状态或明确重新注册
**Then** 清理期间仅可获得限定状态，完成后新注册必须获得新的内部 owner 身份且无旧数据
**And** 固定手机号 hash、身份映射、旧 token、缓存或迟到任务不能复活旧账号；不静默把查状态变成注册

### 19. Privacy, side effects and boundaries

**Given** 用户申请、查看或重试清理
**When** 返回结果或记录审计
**Then** 只显示安全类别和可用操作，审计保留最小状态/证据，不传播原文、精确地点、受保护链接或凭据
**And** 不展示额度，不因 AI 额度阻止账号删除，不新增邮件/推送/Telegram、AI 规划、打卡或相册处理

### 20. Mobile and accessible destructive UX

**Given** 小屏、动态字体、读屏、键盘、reduced-motion 或流程中离开
**When** 操作范围页、确认 Sheet 和状态页
**Then** 有 44pt 目标、正确焦点/播报、明确文本危险提示与返回路径，不只依赖红色
**And** 返回登录不取消已受理任务，受理后没有返回行程/撤销/恢复账号等误导入口

### 21. Complete vertical delivery

**Given** 实现本 Story
**When** 扩展现有认证资格检查、account 路由、最小持久化、worker 和状态 UI
**Then** 遵循 OpenAPI SSOT/生成类型，闭环最终确认、停用、清理、状态授权和恢复并按实际能力开放入口
**And** 不以假 OTP、开发身份头、数据库单表删除、队列受理或未来运维页面替代交付，真实身份缺口必须先解决

### 22. Verification and retention-policy gate

**Given** 本 Story 准备验收
**When** 使用真实 PostgreSQL/队列/私有存储和已启用追踪系统，核验多 owner、共享引用并发、全版本清理、导出/worker 竞态、响应丢失、多设备、重启、重新注册和备份恢复
**Then** 契约/repository/route/mobile 测试、真实清理证据、手机桌面截图与 workspace build 通过
**And** 版本化数据清单、保留/回执期限、恢复抑制及用户披露已确定；历史代码和示意图不算已完成证明

## Visual Review

- Approved `../implementation-artifacts/visual/story-7-5-account-delete-core-r1.png`:
  A scope/optional export, B final confirmation, C accepted/cleaning after ordinary access stops.
- Approved `../implementation-artifacts/visual/story-7-5-account-delete-recovery-r1.png`:
  A verified online-data cleanup with an explicitly disclosed isolated-backup example,
  B known unfinished file cleanup with permitted retry, C unavailable status read.
- Recovery A does not approve any fixed backup duration. A real policy detail must state actual
  retention windows/dispositions before shipping. If no retained backup exists, omit that row.
  A's completion is not permission to silently ignore an uncleaned active store/processor.
- Recovery B's action requires scoped retry authorization separate from the read-only receipt;
  reuse real identity verification when necessary. Its completed/incomplete categories are
  illustrative and must reflect the current task, not hardcoded progress stages.
- The existing-method step-up, submitting/unknown receipt, receipt expiry/loss, cross-device
  verification, detailed retention disclosure and large-font variants need implementation
  screenshots/tests. R1 boards do not claim these states have already been drawn.
- No cooling-off/restore/undo prototype. Generated with built-in imagegen, stored with prompts;
  both boards and the 22-scenario contract are approved, subject to the text boundaries above.

## Next Gate

Irreversible acceptance, optional prior export, all-device stop plus asynchronous cleanup,
restricted recovery and backup/retention disclosure are approved; GWT is appended and source
contracts synchronized. Continue Story 7.6 review. Do not mark Epic 7 complete or delete any real
account/data as part of this planning approval; actual retention/identity gates remain for delivery.
