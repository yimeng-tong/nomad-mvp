---
project: nomad-mvp
date: 2026-09-06
updated: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.6'
status: approved-and-appended
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-07
---

# Story 7.6 Review: 反馈入口与可靠提交

Story 7.5's 22 GWT scenarios and two Account Delete R1 boards are approved/appended. The user
approved Story 7.6, its revised 20 GWT and Entry R1/Recovery R2 on 2026-09-07; they are appended.
This is Epic 7's last in-scope story approval, not Epic completion or implementation authority.
Story 7.2 remains deferred. Historical sprint state and business implementation stay paused.

## Story

As a 旅行者,
I want 在遇到问题或有建议时快速反馈，并知道内容是否确实提交,
So that 外部页面或网络异常不会让我的反馈无声丢失。

**Requirements:** FR45, FR12 (feedback entry), FR49 (return-context reuse);
NFR3, NFR7 (owned-data lifecycle), NFR8, NFR15-NFR16, NFR20;
AR1-AR5, AR11-AR15, AR17-AR20;
UX-DR2-UX-DR3, UX-DR31-UX-DR33.

## User Visual Correction (2026-09-07)

The user requested two changes to Recovery R1: screenshot failure needs no extra status prompt,
only a disabled upload control; active upload/submission needs neither bottom action. These were
first applied to the draft/R2, then included in the user's explicit full Story 7.6 approval.

- B removes the attachment-failure line, standalone retry row and special text-only submit button.
  Keep the existing preview X as an enabled remove action. The normal submit stays unavailable
  while a selected attachment is unresolved; removing it explicitly restores ordinary text-only
  submission. No selected data is silently discarded. When upload becomes available again, the
  normal explicit submission path may retry; no separate permanent upload-retry panel is added.
- C illustrates active upload/submit. The same quiet layout applies while bounded receipt checks
  run, using stage-correct text. No bottom `重新查看 / 返回` or replacement CTA during that work.
  Existing top navigation/system back still preserves the request context and does not resubmit.
  A genuine save failure or exhausted bounded wait exits the busy state before showing recovery;
  the user is never left in an endless spinner. Attachment-only failure follows B, not a new banner.
- Current references: Entry/Submit R1 plus `story-7-6-feedback-recovery-r2.png`. Recovery R1 is
  superseded and retained as history. Requirements and all previously approved stories are unchanged.

## Approved Product Decisions

- Settings/sidebar and the ResultSheet error secondary entry use the same bounded feedback route.
  Preserve the originating view/date/scroll context. Opening or returning never edits a plan,
  invokes AI or resumes a failed planning/export command.
- Keep the configured Tencent feedback product as the primary external channel. Always expose
  `直接填写反馈`, including when the external channel is unavailable or requires its own login.
  No detour into a new help-center/marketing page or mandatory issue category/contact questionnaire.
- Use native WebView only when an actual supported host exposes it; enable the documented runtime
  capabilities there. The current Web/PWA opens a safe external page from a user gesture, not a
  claimed native WebView. Do not introduce a native shell merely to satisfy this story.
- Never treat `window.open` return value, iframe load, page visibility or return-to-app as evidence
  of a submitted feedback record. Native load failure can trigger recovery; ordinary web cannot
  reliably inspect third-party HTTP/CSP/DOM outcomes and keeps explicit alternative actions.
- Default to not transmitting Nomad identity/session. Do not promise that this makes every host
  anonymous: Tencent's own browser login/product configuration may still apply. Nomad SSO,
  custom parameters, WeChat reply notifications, webhooks and imported feedback history remain
  optional future work, not prerequisites or silently enabled integrations.
- Approved built-in scope: one text area, at most one optional screenshot, optional minimal
  diagnostic metadata OFF by default. Text required; no required phone/email/category, no AI rewrite.
  This uses an existing active Nomad account; it does not create an anonymous first-party channel.
  Expired auth resumes only after the same account returns; a deleting account cannot submit new
  records through its restricted deletion receipt.
- Selecting a screenshot gives a local preview/removal only. Explicit submission authorizes
  upload. Validate/decode/re-encode allowed raster formats, remove EXIF/location metadata, use
  tested byte/pixel limits and private COS. No automatic screenshot, album scan or screen capture.
- If the attachment fails or upload is unavailable, retain text/preview and only disable the
  upload control; do not show a failure line, separate retry row or special text-only submit button.
  The existing preview X lets the user remove it and use the normal submit action. An unresolved
  selected attachment cannot be silently omitted or submitted as successful. Normal explicit
  submission can retry once upload is available again. Unsubmitted/removed/expired upload objects are
  cleaned under a bounded policy; accepted attachment references cannot be swept as abandoned.
- Optional diagnostics are allowlisted source-page category, application version and safe error
  code. No entire itinerary, raw URLs/stack/logs, provider keys, device identifiers or location.
  Source-page counting for existing entry analytics is separate from opt-in feedback metadata;
  the toggle controls metadata attached to the stored report, not an undocumented telemetry opt-out.
- First-party success means the text and the chosen validated attachment reference are durably
  stored and available to authorized maintainers. Return a receipt id/time and `反馈已收到`, not
  promised response time, resolved issue, successful email delivery or confirmed Tencent post.
- First-party storage is the terminal delivery in this MVP, not an automatic forward to Tencent.
  Provide a minimal authenticated/authorized maintainer retrieval path using existing server
  operations patterns; no public endpoint, new operator dashboard, email or Telegram notifier.
  A record hidden in an inaccessible table does not complete the feedback loop.
- Technical resubmission uses the same owner/idempotency key and immutable payload. Unknown
  outcomes are queried before any new attempt; same key with changed text/attachment is rejected.
  After a known not-accepted outcome, user changes form a new confirmed payload rather than
  silently overwriting a possibly accepted record.
- Active upload, submit and bounded outcome verification show their real stage without bottom
  action buttons. Verification only reads the original receipt; it never automatically resubmits.
  An exhausted wait/save failure leaves busy before recovery becomes available. Top navigation
  preserves request identity; it is not a new bottom return command or task cancellation.
- Preserve text/draft context during in-app navigation and known failures. Any local recovery
  storage is owner-bound, minimal, TTL-limited and cleared on success/discard/logout/account change/
  deletion. Do not persist auth tokens in draft storage. Unavailable file bytes after refresh
  require explicit reselection; never claim an attachment is still selected when it is not.
- Keep just current submission/receipt recovery, not ticket history, threaded replies, SLA status,
  subscription, admin triage UI or cross-channel deduplication. A post made externally is governed
  by that platform; Nomad cannot read/copy/erase it merely because it opened the page.
- Register new first-party owned feedback with the existing privacy handlers: 7.4 adds report text
  and safe attachment indexes to the structured copy (no screenshot binary); 7.5 deletes report/
  temporary/attachment data and fences late uploads. This extension belongs to 7.6, not a forward
  dependency added to the already-approved export/deletion contracts.
- Internal anti-abuse/upload protections apply without exposing quotas or tying feedback to AI
  budget. Raw feedback/screenshots stay out of analytics, Sentry, Langfuse and public logs. Product
  feedback is not an instruction to the planner, operator automation or a model.

## Verified Baseline and External Constraints

- `apps/server/src/routes/feedback.ts` only returns a product URL, falling back to the literal
  `nomad-mvp` product id and appending a source query. That fallback is not evidence of a configured
  real Tencent product. Do not emit an executable placeholder when config is missing/invalid.
- `apps/mobile/src/settings/SettingsScreen.tsx` currently labels `openExternal` as webview and
  reports opening failures as submit failures. Its fallback opens a `mailto:` URL to
  `support@nomad-mvp.local`, clears text and logs success if the external opener returns true.
  This does not prove stored feedback or delivered mail and must be replaced, not relabeled.
- `settings/api.ts` exposes getFeedbackLink only; inspected server/schema paths lack the full
  first-party text/attachment/receipt path. Add the smallest complete vertical implementation
  through existing Fastify, Prisma, COS and generated client patterns, not a general ticket engine.
- The official helper is a client-rendered page. On 2026-09-06, its public helper bundle linked
  WEBGuide/AndroidGuide/configLogonState and contained the login-state guide. That guide distinguishes
  APP guest behavior from PC-web platform login; it does not justify a blanket anonymous-web claim.
  No private product dashboard or actual Nomad product id was inspected in this planning pass.
- Documented browser behavior makes boolean opener/load tests unreliable. In particular, an
  opener may have no handle with noopener, and iframe load does not prove successful content load.
  Do not disable CSP, same-origin protection or safe opener isolation to gain observation.

### Primary References

- [Tencent login-state guide](https://txc.qq.com/helper/configLogonState),
  [WEB guide](https://txc.qq.com/helper/WEBGuide),
  [Android guide](https://txc.qq.com/helper/AndroidGuide): verify current host integration against
  the actual configured product during implementation. HTML text extraction was empty/timed out;
  the publicly linked helper bundle was read directly for the login-mode distinction.
- [Official helper bundle inspected](https://txc.gtimg.com/static/helper/index.3f2d1f68.js): dated
  evidence only, not a pinned production dependency or permission to copy third-party code.
- [MDN window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open): user-gesture,
  opener isolation and asynchronous navigation boundaries; no feedback-submission receipt.
- [MDN iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#error_and_load_event_behavior):
  cross-origin and error/load limitations. Alternative actions must remain accessible.

## Minimal Delivery Contract

- Typed feedback destination/capability projection returns only a validated HTTPS product URL and
  actual supported opening modes. Preserve internal categorical source for routing/analytics;
  don't append undocumented custom metadata or pass raw return URLs to the external site.
- A private upload ticket binds owner, current draft, purpose, limits and expiry. Upload is finalized
  only after content validation and private-object verification. A remote URL/other owner's object
  id is never accepted as a screenshot. Server rechecks owner eligibility before final attachment
  binding, including races with accepted account deletion.
- Minimal `FeedbackSubmission` stores owner, idempotency key/payload hash, preserved text,
  optional ready attachment ref, opt-in sanitized diagnostics, schema/policy version and receivedAt.
  Transactional receipt creation plus immutable attachment reference is the first-party success
  boundary. Prepared uploads have their own cleanup state; queue acceptance alone is not success.
- Owner receipt lookup by safe request identity recovers a lost response across reload/auth return;
  it must not expose another user's existence or content. A display receipt id is not authorization.
- Error schema distinguishes local validation, upload rejection/unavailable, known failed save,
  unknown outcome, auth expiry and deleting-owner rejection. Bounded retry cannot mutate an
  accepted payload or generate another submission under a new key automatically.
- Attachment errors remain typed internally but the visual surface is a disabled upload control,
  not a status banner. Pending receipt reads have bounded timeout/attempt limits and cancel stale
  reads on unmount/account change; timeout must end busy before an explicit recovery action.
- Maintainer retrieval requires real server-side operator authorization with least privilege,
  no public default or user-supplied role header. A narrowly scoped server command/private query
  with audited access is enough; do not add a new UI/platform prerequisite. Attachment access is
  separately authorized and never uses a public share link. Test that a maintainer can actually
  retrieve an accepted fixture and that normal users cannot inspect another report.
- First-party report text and attachment metadata extend 7.4's registry; 7.5 cleanup covers report,
  local recovery metadata, prepared objects and final attachments. Third-party-only posts are not
  claimed part of those owned-data handlers. Deleted-owner late operations cannot recreate reports.
- Use separate `feedback_open_*` versus `feedback_submit_*` events with categorical source_page
  and safe mode/error. External submit outcomes remain unobserved without a verified integration;
  don't add a webhook just to make analytics complete. No feedback body/screenshot/PII in events.

## Approved Acceptance Criteria

### 1. Shared entry and preserved context

**Given** 用户从设置、侧边栏或结果页异常入口反馈
**When** 打开、返回或提交后返回
**Then** 进入同一反馈流程并恢复合法来源页/日期/滚动上下文，直接填写入口始终可达
**And** 不改变行程、调用 AI 或自动重试原失败操作

### 2. Real configured destination

**Given** 外部产品配置可用、缺失或无效
**When** 构造反馈入口
**Then** 仅开放经过验证的官方 HTTPS 产品链接，缺失时仍提供真实可用的内置表单
**And** 不把代码默认 nomad-mvp 或任意客户端 URL 当有效产品，不向 URL 附加原始来源/用户资料

### 3. Host-appropriate opening and recovery

**Given** 当前环境为 Web/PWA 或已存在的支持 WebView 的宿主
**When** 用户选择外部反馈
**Then** 按实际能力执行用户触发的外部打开或文档要求的宿主配置；明确失败提供重试/浏览器/内置填写
**And** 不新增原生壳、不把 window.open 当 WebView、不声称可从 iframe load/error 准确判断跨域 HTTP/CSP 或提交结果

### 4. No Nomad identity transfer by default

**Given** 用户进入兔小巢
**When** 构造请求或遇到第三方登录
**Then** 不传 Nomad 会话、手机号、邮箱、owner id 或自研 SSO；需要时用户可改用已登录账号的内置表单
**And** 不保证所有宿主都匿名，不启用可选登录态、自定义参数、回复通知或数据拉取

### 5. Opening is not submission

**Given** 外部页面/邮件客户端打开、页面加载或用户返回 Nomad
**When** 更新提示和统计
**Then** 只记录真实打开尝试/可观测打开结果，第三方提交保持未知，不能显示反馈已收到
**And** 移除 mailto 打开即清空草稿/记成功的旧行为，不以跨域访问或新 webhook 伪造闭环

### 6. Minimal text-first form

**Given** 用户直接填写反馈
**When** 输入问题或建议
**Then** 一段有效文字即可提交，保留原文；最多一张截图可选，不要求分类/电话/邮箱或 AI 改写
**And** 空白、超出实际文本限制或不合法输入有明确提示且不丢内容，占位文字不是提交数据

### 7. Explicit private screenshot upload

**Given** 用户选择截图并预览
**When** 明确提交且开始上传
**Then** 使用 owner 绑定的私有上传，验证实际图像格式/字节/像素并清除 EXIF 定位等元数据
**And** 未提交不上传，不自动截图/读取相册集合，不接受他人对象或外部 URL，也不提供公开图片链接

### 8. Quiet disabled upload without silent loss

**Given** 已选截图上传失败或上传暂不可用
**When** 渲染截图区并由用户继续操作
**Then** 保留文字和可移除的预览，上传控件置灰，不展示失败提示、重试上传行或专用移除截图仅提交文字按钮
**And** 用户通过预览 X 明确移除后复用普通提交反馈；仍有未完成附件时不静默按无图提交，上传恢复后才能按正常显式流程重试
**And** 失败/删除/过期临时对象按策略回收，已绑定附件不被误删，置灰具有真实 disabled 语义而非仅换颜色

### 9. Opt-in minimal diagnostics

**Given** 附带诊断信息默认关闭
**When** 用户选择开启后提交
**Then** 仅附带可见说明中的来源页面类别、应用版本、安全错误代码，并由服务端白名单过滤
**And** 关闭不附带诊断字段；不包含整份计划、精确位置、原始日志/URL/stack、身份凭据或内部额度

### 10. Real stored receipt

**Given** 反馈文本合法且选定附件已验证可用
**When** 服务端原子保存反馈与最终附件引用
**Then** 返回持久回执编号/时间并显示反馈已收到，授权维护者可真实取到这份反馈
**And** 未完成保存不能报成功，不宣称问题已处理、邮件送达、腾讯已收帖或承诺答复时间

### 11. Idempotent submission

**Given** 连点、多次重试或提交响应丢失
**When** 核实或再次发送原申请
**Then** 同 owner/幂等 key/原始 payload 得到同一回执，不重复创建记录
**And** 同 key 改文/改图被拒绝，已知未受理后修改才形成新明确申请，不覆盖可能已收到的反馈

### 12. Quiet busy state and bounded outcome recovery

**Given** 正在上传、提交或核实原申请结果
**When** 更新实际处理阶段
**Then** 显示对应进行中状态，不展示底部重新查看、返回或替代操作按钮；未知结果由有界读取核实同一请求
**And** 只有真实保存失败或等待/核实超时后才退出进行中并开放对应恢复，不无限转圈，不清空内容或盲目新提交
**And** 截图上传单独失败按第 8 条收为置灰控件；顶部返回/系统返回仍保留请求上下文，离开/返回或网络恢复不触发自动提交

### 13. Draft, file and auth recovery

**Given** 用户返回、刷新、认证过期或切换账号
**When** 恢复草稿/回执
**Then** 仅恢复同 owner 的有效临时内容与原申请身份；截图本地字节丢失须明确重选而不假装仍可提交
**And** 本地恢复有 TTL，成功/放弃/退出/账号切换/删除时清除，迟到响应不回填其他账号，不保存认证 token

### 14. Active-account and authorization guard

**Given** 访问内置提交、附件、回执或维护读取接口
**When** 服务端鉴权
**Then** 校验真实身份/owner/账号资格与最小角色权限，受保护资源不能靠编号、开发 header 或客户端角色读取
**And** 删除受理后的旧请求/回执不能新建反馈、上传或发布附件；不新增匿名第一方反馈或恢复已删除账号

### 15. Maintainer retrieval without a new platform

**Given** 内置反馈已收到
**When** 授权维护者使用最小服务端运维读取路径
**Then** 能查看实际文字和鉴权附件，访问有审计且普通用户不能查询他人报告
**And** 不依赖未来运营后台、不自动转发给腾讯/邮箱/Telegram，不用不可访问的落库记录当完整交付

### 16. Existing privacy lifecycle integration

**Given** 用户导出数据、删除账号或放弃未提交附件
**When** 执行既有 7.4/7.5 和临时文件清理
**Then** 数据副本包含本人的反馈文字/安全附件索引而不打包截图，删除覆盖报告/附件/临时对象且防迟到复活
**And** 不声称导出或删除第三方独立帖子，不让新 feedback 表成为隐私清理遗漏

### 17. Truthful analytics and private content

**Given** 打开、上传、提交、核实或失败发生
**When** 记录埋点/错误/审计
**Then** 区分打开与提交事件，包含有限来源类别/模式/安全错误，外部无法观测的提交不记成功或失败
**And** 反馈原文和截图不进入分析/Sentry/Langfuse/公开日志，不被当成模型或运维自动执行指令

### 18. Independent safety controls and scope

**Given** 请求遭遇网络、存储或防滥用保护
**When** 反馈无法执行
**Then** 提供真实重试/手动路径且保留输入，上传/请求有界，不暴露额度或把 AI 预算当反馈门槛
**And** 不增加反馈历史/客服对话/SLA、SSO、回复推送、第三方 API 拉取、规划修改或后台定位

### 19. Mobile and accessible controls

**Given** 小屏、中文输入法、长文本、键盘、读屏、reduced-motion 或外部打开受限
**When** 使用表单/预览/恢复动作
**Then** 文字可换行、CTA 不被遮挡、44pt 目标和图标名称/焦点/状态播报完整，安全外链和返回可用
**And** 上传置灰同时提供禁用语义/名称，进行中无底部按钮仍有正确焦点和顶部导航；不通过关闭 CSP/同源保护或不安全 opener 来读取第三方页面

### 20. End-to-end evidence and contracts

**Given** 本 Story 准备验收
**When** 验证真实配置产品/支持宿主、第一方 PostgreSQL/COS 保存与授权维护读取、重启/重复/未知响应、上传置灰/移图后普通提交、进行中无底部按钮/有界超时恢复、截图清理、越权及账号删除竞态
**Then** OpenAPI 生成、focused tests、真实服务检查、移动桌面截图及 workspace build 通过，回执与实际记录/对象一致
**And** 未配置产品可先走内置降级但不能声称第三方接入验收通过；不使用 mock 链接、mailto 或弹窗布尔值冒充真实提交

## Visual Review

- Approved `../implementation-artifacts/visual/story-7-6-feedback-entry-submit-r1.png`:
  A Web/PWA external/first-party choice, B minimal text/optional screenshot/opt-in diagnostics,
  C actual first-party receipt. The app never fabricates Tencent's actual hosted UI.
- Approved revised reference `../implementation-artifacts/visual/story-7-6-feedback-recovery-r2.png`:
  A unchanged external failure, B quiet disabled upload with removable preview/ordinary submit,
  C active upload/submit without bottom actions. Receipt verification reuses C with its own actual
  stage label. A is not a claimed automatic iframe/CSP detector. Recovery R1 is superseded.
- Core B's text-style submit command must retain clear primary-command affordance and disabled/
  pending states in implementation. R2 B's ordinary submit is disabled while the selected attachment
  remains unresolved; X removes it and permits normal text submission. R2 C preserves existing top
  navigation only, not the removed bottom return action or a promise of permanent offline storage.
- Native host loading, actual external page, missing config, known save rejection, expired auth,
  screenshot preview/validation, discard, large fonts and authorized maintainer retrieval need
  implementation checks/screenshots. The two boards do not claim all edge states are drawn.
- Both boards were generated with built-in imagegen and stored with prompts. Example screenshot,
  ids and timestamps are fictional. Both current boards and the 20-scenario contract are approved;
  remaining implementation screenshot/real-service gates are not waived.

## Next Gate

The revised 20 GWT and Entry R1/Recovery R2 are approved/appended; source contracts include
host-specific opening/login, real receipts, quiet pending states and privacy-registry extensions.
Epic 7 completion and entry into Epic 8 were explicitly confirmed later on 2026-09-07;
`epic-7-coverage-review-2026-09-07.md` records this transition. The next checkpoint is the proposed
Epic 8 split, not another 7.6 review. Do not run final Epics validation or update the execution sprint first.
