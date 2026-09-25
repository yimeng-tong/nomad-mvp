---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
epic: 7
story: '7.3'
status: approved-and-appended
scopeCorrectionApproved: true
storyApproved: true
visualApproved: true
appendedToEpics: true
approvedDate: 2026-09-06
---

# Story 7.3 Review: 设置页账号与可用操作

The user narrowed this story to account and available actions, with no user-visible quota.
See `settings-account-actions-scope-2026-09-06.md`. The former usage-summary proposal/R1 are
superseded and archived. The revised 14 GWT scenarios and R2 were approved on 2026-09-06 and
appended to epics.md. This is planning approval, not implementation completion.
Story 7.1 remains approved, 7.2 remains deferred, and implementation is paused.

## Story

As a 旅行者,
I want 在设置中确认当前账号，找到实际可用的账户操作，并能安全退出登录,
So that 我能管理和继续使用自己的行程，而不必了解模型密钥或平台内部额度。

**Requirements:** FR12 (Settings/account entry), FR25 (available-action/recovery boundary),
FR38 (preserve internal enforcement, no quota UI), FR49 (existing navigation);
NFR3, NFR7 (entry only), NFR8, NFR20;
AR1-AR5, AR12-AR15, AR17-AR20, AR22 (operator boundary);
UX-DR2-UX-DR3, UX-DR31-UX-DR33.

## Scope and Interface

- Settings is a compact account-and-actions list, not an AI dashboard. No `AI 与用量`,
  `使用情况`, aggregate AI availability card or generation-status panel is added here.
  Actual job progress remains on existing operation screens.
- Account identity is read-only; show an existing safe identity hint when available, otherwise
  `已登录 / 当前账号`. Do not expose raw owner/device/session ids, invent phone/profile data or
  add profile editing.
- Reuse entry points for deployed account-data export/deletion, privacy policy and feedback,
  plus current-session logout. Undeployed/unconfigured destinations are not actionable and may
  be omitted; a deployed temporarily unavailable action retains honest recovery rather than
  disappearing because of an AI budget state. The destination independently authorizes access.
- Data export/deletion/reliable feedback workflows belong to 7.4/7.5/7.6; Settings must work without
  them and independently expose them after deployment. Merely having a queue route is not proof
  of a functioning data workflow; opening an email client is not proof of feedback delivery.
- The minimal protected read returns safe identity and typed available destination/action ids
  with optional safe recovery hints. It does not return user quota balances/counters, limits,
  reset times, policy budgets or token costs. No account usage-summary API or ledger projection
  is created by 7.3. Existing allowed actions still recheck server auth/capability on use.
- Remove the MVP BYOK form and initialization calls to user-key status/validation/save/delete.
  Keep historical encrypted key retention/compatibility decisions separate; opening Settings
  must not delete keys or silently alter backend integrations.
- Server-side quotas, concurrency, cost guards and accounting remain authoritative on actual
  operations. A blocked action may offer `稍后重试 / 查看进度 / 返回手动编辑` only when that
  path actually exists. Do not expose quota reasons/values, label a non-queued request queued,
  invent an outage or automatically restart paid work.
- No global counter, percentage, used/remaining amount, threshold, reset window, provider name,
  model selector, top-up or subscription flow. Internal `low` status is not a user-facing quota
  badge. Real job stages, processed-link counts and output-image counts remain unchanged.
- Logout reuses the existing server revocation endpoint and confirms exiting the current account.
  Server-saved plans and accepted jobs persist; no account deletion, all-device sign-out or job
  cancellation. Existing unsaved-input protection applies before leaving.
- Refresh is bounded/read-only and owner-isolated; no model/provider probing or background polling.
  Failure/unknown capability is not available-by-default, and old-account responses cannot repaint
  the new user's Settings.

## Brownfield Evidence

- `SettingsScreen.tsx` still calls `getByokStatus` on entry, displays raw user/device ids and
  key-dependent availability. Replace those user-facing paths, not just their labels.
- `settings/api.ts` currently exposes key/account/feedback methods but no logout method. Extend
  generated contracts/client wiring for the bounded Settings capability read and existing logout,
  not the now-rejected usage summary.
- Server `/me` currently returns phone=null. Fallback identity copy is required; a missing display
  phone must not trigger collection of extra profile data.
- Server `POST /logout` revokes the current cookie session and clears its cookie. Reuse and verify
  that behavior rather than implementing client-only logout that leaves the session active.
- The old account endpoints accept queued work and the fallback can launch mail; neither is a
  complete proof of 7.4-7.6 outcomes. Readiness flags must reflect actual available end-to-end
  capability. Never claim those stories are implemented through this Settings change.
- Existing operation guards/limits are preserved. This story neither repairs every quota backend
  nor creates a prerequisite for Epic 8; its removal of visible quota is a presentation/contract
  boundary, not disabled enforcement.

## Approved Acceptance Criteria

### 1. Account and actions only

**Given** 用户从 Home/Library 的既有菜单进入设置
**When** 浏览或返回
**Then** 仅呈现账号和已部署的可用操作，返回恢复来源页状态
**And** 不提供 AI 用量/使用情况/全局生成状态面板，也不引入打卡、相册或营销页

### 2. Safe read-only identity

**Given** 会话有效且可能缺少可展示账号信息
**When** 渲染账号区域
**Then** 使用已有安全信息，缺失时显示 `已登录 / 当前账号`
**And** 不展示原始 user/device/session id、不编造手机号昵称、不增加账号行跳转箭头或资料编辑

### 3. No quota exposure

**Given** 读取设置可用动作或操作受到后台额度保护
**When** 返回和呈现用户信息
**Then** 不返回用于用户展示的账户用量、余额、上限、百分比、重置时间、token 或预算，不提供相应页面
**And** 不用低额度/额度已用完等分级暴露额度；服务端计量、限流、预算和熔断仍生效

### 4. No BYOK path or destructive compatibility cleanup

**Given** 用户打开设置或刷新
**When** 初始化客户端请求和 UI
**Then** 不调用用户侧 key 查询/验证/保存/删除，不出现 Key 引导或内部 Provider 名称
**And** 不因移除 UI 自动删除历史密钥或重写兼容端点策略

### 5. Real available destinations

**Given** 某数据、隐私或反馈能力未部署、已可用或暂时失败
**When** 构造操作入口
**Then** 只开放真实可用的目标；未部署能力不伪装可执行，已部署但暂时失败的能力保留诚实恢复路径
**And** 目标再次鉴权/校验，不能靠客户端旗标或直接深链绕过；账号/隐私操作不被 AI 额度面板额外阻断

### 6. Keep later workflows independent

**Given** 设置包含数据导出、删除账号、隐私政策及反馈的可用入口
**When** 用户选择目标
**Then** 进入该目标自己的确认和处理流程，不在 Settings 打开时直接发起导出/删除或声称反馈已送达
**And** 7.4/7.5/7.6 仍负责完整流程；7.3 可独立交付，后续按真实能力开放而非依赖其先实现

### 7. Safe recovery without new work

**Given** 某操作当前不可执行或已有任务可恢复
**When** 显示可用动作
**Then** 仅提供真实的稍后重试、查看原任务进度或返回手动编辑路径，不暴露额度数字/原因
**And** 不伪造已排队/服务故障，不自动重试 AI；真实任务阶段、处理数量和导出图片份数继续在原页面显示

### 8. Current-session logout

**Given** 用户选择退出当前账号
**When** 确认且服务端成功撤销当前会话
**Then** 清除私有客户端缓存/挂起响应与当前 cookie，返回登录页；取消确认不改会话
**And** 不删除账号/已保存行程、不撤销其他设备、不取消已受理任务

### 9. Unsaved or failed logout

**Given** 存在未保存输入、会话失效，或退出失败/结果不明
**When** 处理离开
**Then** 复用既有保存/离开保护与重新登录流程，只承诺已保存内容可恢复
**And** 不假报服务端撤销成功，提供重试/核实，避免旧账号数据暴露给后续账号

### 10. Owner isolation and read errors

**Given** 设置读取中、失败、部分能力未知或账号发生切换
**When** 更新内容
**Then** 使用稳定加载/局部重试状态，未知不视为可用，不用旧账号的身份/动作结果填充
**And** 请求有界且只读，关闭或切换账号后丢弃迟到响应，不后台轮询或调用 AI/高德探测可用性

### 11. Preserve existing itinerary behavior

**Given** 用户从设置返回已有计划
**When** 浏览、手动编辑或恢复原任务
**Then** 原有版本、scope、冲突校验、确认和撤销规则不变，不因隐藏额度而放松服务端保护
**And** 设置读取/导航不增加 PlanningJob、PlanRevision、TripRevision、产品用量或 Telegram 通知

### 12. Accessible simple layout

**Given** 动态字体、长账号提示、键盘、读屏或 reduced-motion
**When** 使用列表和退出 Sheet
**Then** 至少 44pt 目标、图标有名称、状态不只靠颜色，文字不盖住操作，焦点约束和返回明确
**And** 只读账号不伪装按钮，未部署项不出现误导性可执行箭头，列表不嵌套装饰卡片

### 13. Scoped contract and implementation

**Given** 实现本 Story
**When** 修改现有 Settings、认证客户端和必要的安全动作投影
**Then** 遵守 OpenAPI SSOT、生成类型并复用现有 auth/logout，正常状态连接真实可用目标而非全 mock
**And** 不实现账户用量汇总、配额引擎、运营后台、设备管理或后续数据/反馈业务链

### 14. Verification

**Given** 本 Story 准备验收
**When** 测试只读身份/缺资料、能力开关/暂时失败、退出成功/失败/取消、账号切换、BYOK 残留和长文案
**Then** 通过契约/route/mobile、必要真实会话撤销核验、手机与桌面截图、workspace build
**And** 证明无用户额度字段/UI、无 key 请求、无自动生成/计量副作用，已有任务真实进度和行程保护不受影响

## Visual Review

- Approved current board: `../implementation-artifacts/visual/story-7-3-account-actions-r2.png`.
  A shows account and deployed data/privacy/help/logout entries; B shows current-session logout.
- A illustrates the environment after relevant data/feedback capabilities are deployed. It does not
  mean 7.3 implements 7.4-7.6; omit undeployed executable entries, preserve recovery for temporarily
  failing deployed destinations. Data deletion still opens its own future confirmation workflow.
- Superseded R1 `story-7-3-settings-usage-logout-r1.png` is historical and must not be implemented.
  Its usage counters, windows and overview API are specifically rejected by the user.
- No quota-degradation board. Loading/read failure, deployed-action failure, auth expiry, unsaved
  input and logout failure require focused implementation screenshots/tests, not guessed behavior.
- Both generations and the original correction prompt are retained beside the assets. Built-in
  image generation was used; R2 is approved subject to this text contract.

## Next Gate

The no-quota scope and full Story 7.3/R2 are approved; all 14 GWT scenarios are appended to
`epics.md`. Continue Story 7.4 review. Story 7.2 and future photo capabilities remain deferred;
implementation and historical sprint state stay paused until the planning gates complete.
