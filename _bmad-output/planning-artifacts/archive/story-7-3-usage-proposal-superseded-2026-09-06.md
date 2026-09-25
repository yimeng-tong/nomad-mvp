---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.3'
status: superseded-by-user-scope-correction
storyApproved: false
visualApproved: false
appendedToEpics: false
---

# Story 7.3 Review: 设置页与平台 AI 用量汇总

SUPERSEDED (2026-09-06): the user removed all user-facing quota/usage displays and narrowed
Settings to account and available actions. This archived proposal and R1 board must not guide
MVP implementation. Use `../story-7-3-review-2026-09-06.md` and the account/actions R2 board.

Story 7.1 remains approved. Story 7.2 is deferred out of MVP, not a prerequisite. This document
proposes the next vertical story and one three-screen board for review. It does not append an
approved execution contract, change product quota amounts or implement a new billing system.

## Story

As a 旅行者,
I want 在设置中查看当前账号、平台功能可用状态和分项使用情况，并能安全退出登录,
So that 我能知道哪些操作可以继续、何时需要等待，而不用配置模型密钥或失去已有行程。

**Requirements:** FR12 (Settings/account entry), FR25 (account-level guidance),
FR38 (user-facing summary only), FR49 (existing navigation recovery);
NFR2 (existing job recovery consumption), NFR3, NFR7 (entry only), NFR8, NFR20;
AR1-AR6, AR12-AR15, AR17-AR20, AR22 (operator boundary);
UX-DR2-UX-DR3, UX-DR31-UX-DR33.

## Proposed User Experience

- Home menu opens Settings. Return restores the originating Home/Library view. The page is a
  concise single-column list: account/login, AI and usage, data/privacy, help, logout.
- Account information is read-only. Display only safe available identity hints, such as an already
  provided masked login identity; otherwise `已登录 / 当前账号`. Do not force new profile data,
  invent a phone number or expose raw owner/device/session ids. No profile-edit page is added.
- Settings shows one compact availability summary and `使用情况`; details are not expanded on
  the main settings page. The details screen is a read-only list of capability, actual window,
  usage and a matching count limit if supplied by the current policy, plus refresh.
- Capability labels may cover `导入灵感 / 规划行程 / AI 调整 / 完善细节 / 导出图片 /
  清单 AI 建议` where corresponding operational data exists. Export is a resource-controlled
  operation, not a claim that image download invokes an AI model. Keep unrelated units separate.
- No new universal allowance, unlimited-use promise, token chart, currency bill, model picker,
  top-up, subscription, key input or global operator dashboard. The defaults in
  `docs/ops/rate-limits.md` are starting policy bands, not numbers frozen by this story/prototype.
- `导出账号数据`, `删除账号`, `反馈与建议` and the existing privacy-policy link remain discoverable.
  Actions open only when a real deployed capability is available. An unavailable control is
  disabled with truthful copy; it must not invoke a queue-only placeholder as a completed service.
  Full account-data export/deletion and reliable feedback delivery remain 7.4/7.5/7.6.
- Logout confirms leaving the current account, preserves server-saved plans and accepted jobs,
  revokes the current session and clears private client state. It is not account deletion or a
  command to cancel jobs/other sessions. Reuse existing unsaved-input protection when applicable.

## Availability and Counters

| Source fact | Presentation/behavior |
| --- | --- |
| All relevant known capability states currently allow use | Compact `AI 当前可用`; actual command admission still checks server policy |
| A particular capability is low/limited/queued/degraded | Name that capability and its permitted next action; do not imply every feature or personal quota is exhausted |
| Account count remains but workspace/provider circuit prevents use | Honest temporary-service message, not `你的额度已用完` or exposed provider budgets |
| Known usage and same-unit/window count limit | Show actual `used / limit 次` with actual calendar/rolling window |
| Known usage but count cap is absent/inapplicable | Show known usage only; do not invent a denominator or say unlimited |
| Source cannot establish count or availability | `暂时无法获取`/retry or a safe partial summary; missing/null is not zero and not normal |
| Fixed reset or next-admissible time is actually known | Display only the supplied meaning/time; rolling expiry is not full midnight reset |

The UI does not calculate entitlement from cached counters. A positive remaining count cannot
override concurrency, cost or workspace restrictions; a stale snapshot cannot authorize a new
operation. Preserve `normal / low / queued / degraded` semantics while adding honest unknown/
unavailable read states, not silently normalizing them to available.

Existing product accounting determines charge/reservation/refund rules. Internal provider attempts,
same-operation retries, child tasks, SSE reconnects, opening Settings and re-downloading generated
files must not appear as fresh user operations merely because this read model sees multiple events.
For a count based on logical user starts, aggregate by the existing logical command/job identity.
Pending reservation is not a second settled usage. Do not derive a universal quota from raw token
cost or introduce a new refund promise; consume the current policy's authoritative settled/released
facts and clearly distinguish unavailable or not-yet-final values.

Generic quota-exhausted/degraded states remain text-governed as previously agreed. No dedicated
quota-degradation mockup is required; the board covers normal Settings, mixed-window usage and
logout only. Loading/read failure and partial state still need implementation tests/screenshots.

## Brownfield and Interface Notes

### Observed Baseline

- `apps/mobile/src/settings/SettingsScreen.tsx` calls `getByokStatus` on entry and presents raw
  user/device ids, an OpenAI key form and key-dependent availability copy. This is not a platform
  usage/status summary and must be replaced in the MVP UI, not reused as its truth source.
- `apps/mobile/src/settings/api.ts` exposes key APIs and account/feedback entry methods but no
  platform usage read. New overview types must come from OpenAPI, never hand-edited generated types.
- `apps/server/src/routes/auth.ts` has `/me`, sessions and `POST /logout`. `/me` currently returns
  phone=null, so the proposed no-identity-hint fallback is required; no fictitious profile data.
  Logout can reuse the existing endpoint, with real cookie/session revocation verified in tests.
- Earlier stories own minimum per-operation quotas, idempotency, reservations, retries, cost and
  fallback controls (AR13). Legacy `quotaRatio` is a planner placement ratio, and an in-memory HQ
  counter is not proof of an account-wide durable quota source. Do not build this summary from
  either, Sentry/Langfuse logs or the boolean absence of a user key.
- Account routes currently accept queued work; feedback fallback can launch mail. Those inspected
  paths alone do not prove completed data export/deletion or delivered feedback. This story keeps
  truthful capability boundaries rather than silently implementing or claiming the future stories.

### Proposed Minimal Read Contract

Final endpoint naming belongs to OpenAPI-first implementation. A protected Settings/usage overview
can expose a bounded projection from the existing guard/accounting sources:

- Safe display identity/login state, independently from usage read success.
- `asOf`, internal `policyVersion` and snapshot validity, plus a per-capability status list.
- Each item carries capability id, semantic count unit, actual window kind/start/end/timezone,
  nullable settled count, optional separately named reservation/pending count, nullable matching
  count limit, actual availability reason class and an optional known next-admissible/reset time.
- Safe allowed next actions may identify an authorized existing job to view, refresh metadata,
  return to manual editing or wait. Typed targets, not arbitrary URLs, are resolved with owner
  checks. The Settings read/refresh action never starts or retries billable work.
- Data/feedback entry availability reflects implemented/configured capability, not a user-supplied
  flag or an assumption from route existence. Each destination independently enforces auth and
  readiness. Privacy-policy navigation reuses an existing configured document.

Read current policy and accounting snapshots consistently. Limits may change between snapshots;
return safe partial/unavailable state on source mismatch rather than combine unrelated windows or
owners. If a necessary prior operation has no reliable read projection, add the smallest adapter
against its authoritative source within this slice or resolve that prerequisite contract before
readiness. A permanently mocked/all-unavailable screen cannot satisfy normal-state acceptance.
Do not turn 7.3 into a replacement quota engine or defer the normal summary to Epic 8.

No new immutable plan entities or lifecycle states are required. Protected bounded reads need
rate limits and private/no-shared-user-cache behavior. Refresh on entry, meaningful foreground
resume and explicit user request; no background polling or unnecessary source/API calls.

### Boundaries

- Remove MVP key form/actions, automatic user-key status requests and related user prompts. Do not
  automatically delete existing encrypted keys, rewrite compatibility routes or remove admin data
  merely by visiting Settings. Compatibility retention is distinct from the user path.
- Session expiry follows existing reauthentication flow and same-owner recovery. Successful logout
  clears local private query caches/pending responses and goes to login. Failure or uncertain logout
  must not claim server revocation; provide safe retry/recheck and do not expose stale private data
  behind a new account. Known unsaved input uses existing leave/save safeguards, not a new draft engine.
- Settings has no plan mutation, new PlanningJob, quota-consuming model call or Telegram action.
  Per-operation enforcement stays on the actual command endpoint. Terminal operator alerts remain
  Epic 8 and ordinary quota or read failures do not trigger operator notifications here.

## Proposed Acceptance Criteria

### 1. Entry and navigation

**Given** 用户从既有 Home/Library 菜单进入设置
**When** 浏览设置或返回
**Then** 以简洁列表呈现账号、AI 与用量、数据与隐私、帮助及退出登录，返回恢复来源页状态
**And** 不新增营销页、个人资料编辑、打卡或相册入口

### 2. Safe account summary

**Given** 当前会话有效且服务端可能没有可展示的账号资料
**When** 渲染账号区域
**Then** 使用已授权的安全展示信息，缺失时显示 `已登录 / 当前账号`
**And** 不伪造手机号/昵称，不展示 user/device/session 原始标识或暗示此行可打开资料编辑

### 3. Remove BYOK from MVP

**Given** 用户打开设置
**When** 页面初始化、刷新或 AI 状态变化
**Then** 不展示/调用用户侧 key 查询、填写、验证、保存、删除或引导，不以未配置 key 推断平台可用
**And** 不因隐藏表单自动删除历史密钥，不改兼容 API 的保留策略

### 4. Authoritative availability

**Given** 平台返回当前 owner 的实际各功能可用状态
**When** 汇总设置首页与使用情况页
**Then** 仅所有相关状态已知可用时显示总体可用，部分限制或数据未知时按具体能力诚实呈现
**And** 用量摘要不是执行授权，实际操作仍按当时的服务端政策校验

### 5. Per-capability read-only details

**Given** 用户选择 `使用情况`
**When** 读取受支持的分项数据
**Then** 展示导入、规划、AI 调整、细节完善、图片导出及清单 AI 建议等真实已接入分项及统计窗口
**And** 只读和刷新不发起生成；不把导出/下载包装成 AI 模型调用，也不合计异质单位为万能额度

### 6. Windows and nullable limits

**Given** 不同功能采用自然日、滚动窗口或没有可展示的次数上限
**When** 显示使用量
**Then** 每项遵守其实际窗口/时区/单位，仅有同口径上限时显示 used/limit，否则只显示已知用量
**And** 缺失不当成 0 或无限，默认策略/原型数字不硬编码成用户承诺

### 7. No double counting

**Given** 同一操作有内部重试、子任务、重连、预占释放或重复下载
**When** 聚合产品使用记录
**Then** 依既有计量政策与逻辑操作身份去重，区分预占/已结算/释放，不把内部次数当新用户操作
**And** 不重新设计收费/退款；Settings 请求本身不增加产品额度用量

### 8. Honest restriction cause

**Given** 某功能因为个人额度、并发、平台预算或服务暂时不可用而受限
**When** 展示原因
**Then** 区分对应的用户级原因或安全的服务级提示，不把平台问题说成用户额度已耗尽
**And** 不暴露 Provider 名称、token、金额估算、设备/IP/workspace 限值或他人用量

### 9. Recovery timing and actions

**Given** 服务端提供可重试时间、重置时间或查看已有任务等有效路径
**When** 显示恢复操作
**Then** 只显示真实已知的时间及其含义，未知则提示稍后重试而非编造倒计时
**And** 不把滚动窗口下一次释放当全量重置；不新增模型选择或在设置中自动重试 AI

### 10. Existing itinerary remains usable

**Given** 额度不足、服务降级或使用量读取失败
**When** 用户返回已有行程
**Then** 浏览和手工编辑仍可进入，遵守现有校验/导出门禁，不因设置用量面板而额外锁住行程
**And** 查看进度复用原任务并重新鉴权，不重开 PlanningJob、不自动应用 AI 方案

### 11. Loading, partial and error states

**Given** 用量正在加载、部分源失败、真实零使用或刷新失败
**When** 更新页面
**Then** 分别使用稳定占位、局部不可用、真实零值和重试状态，不以空数组/0 伪装失败
**And** 相同 owner 的旧摘要如被保留必须说明未刷新，不能继续当作当前可用保证；账号及其他入口不因局部失败消失

### 12. Refresh and privacy isolation

**Given** 用户显式刷新、恢复前台或切换账号
**When** 查询状态
**Then** 使用受限只读请求和 owner 私有缓存，丢弃旧账号及旧请求结果，不做后台轮询
**And** 查询失败不调用模型、高德或密钥接口作探测，不从第三方日志反推出精确用户余额

### 13. Data and feedback capability boundaries

**Given** 设置展示数据导出、删除账号、隐私政策和反馈入口
**When** 决定是否可点击
**Then** 只有已实现且配置可用的能力开放，其余禁用并说明暂不可用，不触发无完整处理链的占位操作
**And** 本 Story 不交付 7.4/7.5/7.6 完整流程；现有可用路径不无故移除，后续交付可独立开放，不能把排队或邮件客户端打开称为数据清理/反馈送达

### 14. Logout confirmation and success

**Given** 用户选择退出当前账号
**When** 确认并成功完成现有服务端会话撤销
**Then** 清除该账号的私有客户端状态、挂起响应和会话 cookie，返回登录界面
**And** 保留服务端已保存行程，不删除账号、不撤销其他设备会话、不取消已受理任务；取消确认不改变会话

### 15. Logout failure and unsaved input

**Given** 有未保存输入、会话已失效，或退出请求失败/结果不明
**When** 处理离开和恢复
**Then** 复用既有保存/离开保护及重新登录流程，只承诺已保存内容可恢复
**And** 不假报服务端撤销成功，提供重试/状态核实，避免旧账号私有缓存暴露给后续账号

### 16. Accessibility and layout

**Given** 长文案、数字增长、动态字体、键盘、读屏或 reduced-motion
**When** 使用设置、分项列表和退出 Sheet
**Then** 图标有名称、状态不只靠颜色，至少 44pt 目标，焦点约束/返回明确，文案不覆盖动作
**And** 账号只读行无误导箭头，分组不嵌套卡片，用量更新不跳动布局或连续播报

### 17. Scoped real-source delivery

**Given** 开始实现本 Story
**When** 增加 overview/read projection 和替换 Settings UI
**Then** 从既有 first-use guard/accounting 源读取，通过 OpenAPI 生成类型并复用 auth/logout，不新造配额引擎或运营后台
**And** 正常状态必须有真实数据来源，不以全 mock/永久不可用作为交付；缺少必要投影补最小适配，不等待 Epic 8 或 7.4-7.6

### 18. Verification and exclusions

**Given** 本 Story 准备验收
**When** 使用不同计量窗口/单位、零/未知/部分失败、政策变化、预占/去重、已受理任务、账号隔离/切换、BYOK 残留与退出场景测试
**Then** 通过契约、guard/projection/route/mobile 测试、必要真实持久化及会话撤销核验、手机/桌面截图和 workspace build
**And** 证明读取不调用 AI、不扣产品额度、不改变行程、不触发 Telegram；不实现订阅充值、设备会话管理、完整数据清理/反馈、已延期打卡或相册能力

## Visual Review

`../implementation-artifacts/visual/story-7-3-settings-usage-logout-r1.png` is a proposed board:

- A: Settings with read-only identity and capability-aware entries. Data export/deletion are shown
  as temporarily unavailable to illustrate the intermediate 7.3 slice, not their final MVP removal.
  Feedback/privacy are assumed actually configured for this fixture; those rows also fail/disable
  honestly if not available. Account information has no profile-navigation arrow.
- B: Normal per-capability usage. All numbers are illustrative, not current account measurements
  or newly approved production limits. Exact windows and denominators come from the server; six
  rows illustrate supported categories, not six new budgets. No dedicated quota-degradation image.
- C: Current-session logout confirmation, not account deletion or cancellation of jobs.
- Loading/read failure, partial status, logout failure, expired auth and dynamic text need focused
  implementation screenshots/tests. The image does not claim those states have been fully prototyped.
- Built-in image generation was used; generation and targeted-correction prompts are beside the PNG.

## Next Gate

On individual approval, synchronize the selected Settings/usage/identity/logout semantics to
source PRD/UX and minimal API/architecture notes, append GWT to `epics.md`, promote the board and
continue Story 7.4. Do not change source quota amounts or implement business code during this review.
