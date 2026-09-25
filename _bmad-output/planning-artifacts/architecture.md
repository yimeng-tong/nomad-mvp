# Nomad MVP Architecture Input Package

Generated: 2026-09-19
Status: Approved Correct Course target architecture

OpenAPI and Prisma remain implementation SSOTs. Deprecated root/v0.3/autoplace-v1 documents are intentionally excluded.

---

Capacitor amendment approved 2026-09-19; source packet regenerated from current source files.

## Source: `docs/architecture/index.md`

# Nomad MVP Architecture (v0.6)

Updated: 2026-09-14
Status: Approved Correct Course target architecture

本目录是实现规划的架构权威来源。它描述获批目标合同；未进入对应 story 前，
OpenAPI、Prisma 和代码仍可能只实现 v0.4 基线，不能因本文更新而被视为已交付。

## Current Decisions

- Story 1.0在真实用户/运营写入前补齐生产认证、多设备持久会话与最小服务端授权；历史1.1–1.5保持原交付记录。
- IR-03额外运营工具只保留手工纠错地点（FR4.2/1.11）：名称、地址、同城坐标的人工覆盖独立于Provider原始事实，版本化发布不回写用户历史行程。

- 用户只看到一个 PlanningJob 和一份完成计划；Quick/HQ/seed 只允许作为内部策略。
- Planner 编排完整地点与时间，Validator 校验及产生类型化修复，Filler 只完善执行细节。
- `Trip -> ordered TripSegment -> single-city Plan` 连接无固定数量上限的有序城市段；每个 Plan 仍只属于一个 City。
- 主 TripSegment 的一个本地日期可挂一个 `DayExcursion -> single-city Plan`，以去返两条
  TransferLeg 完成同日返回，不创建第二个同名宿主 segment。
- TripRevision 原子绑定主/一日游 PlanRevision、TransferLeg、Stay、LuggageTransition 和 DayExcursionRevision。
- Picker 使用 `required / along_route / unselected`，所有视图从同一状态源派生。
- BusinessArea 独立于行政区和 L1/L2；owner-scoped 导入美食查询需要可靠 membership。
- Story 1.3 是入库适配器基线；真实图文理解、视频抽帧/VAD/ASR和完整AMap事实分别由Story 1.9、1.10、1.11交付；1.8负责owner导入记录与去重。
- 航班/铁路班次、AMap terminal/route 与天气是分离的 provider-neutral facts，均需来源和新鲜度。
- 旅中定位允许App打开/回到前台有适用餐饮上下文时，凭仍有效的历史或本次授权单次刷新；
  同轮事件去重，不因系统撤权仍沿用旧许可。拒绝/陈旧时按计划上下文降级，不持续监听、
  后台刷新或保存轨迹，也不因候选更新修改行程。
- 行程后文本搜索先保存候选；无准确结果时可用同城已验证附近地标作显式近似路线
  代理，但目标与地标身份/事实必须隔离，时间轴落位由后续版本化命令负责。
- Provider secrets 服务端托管；BYOK 不属于 MVP 用户路径。
- Story 7.1 最近行程按 owner 聚合真实草稿/任务和当前 Plan/Trip；恢复位置独立于行程版本，
  `已生成` 不代表旅行结束。真实未完成修改与终止失败分开，重开不启动新规划。
- Story 7.2 打卡已于 2026-09-06 移出 MVP，AR16 不作为当前门槛。照片驱动标记和
  相册视频/九宫格/AI 美化仅为 FR40.1 后续方向，不新增本期相册或位置存储能力。
- Epic 7 的 7.3 账号/可用操作、7.4 结构化数据副本、7.5 停用/清理与受限恢复、
  7.6 真实反馈回执均已获批；额度不对用户展示，账号副本 ZIP 不改变行程图片规则。
  Feedback 自身交付时扩展导出/删除注册，不增加前向依赖；旧 WebView/邮件打开即成功
  语义不再有效。这里只确认目标合同，Epic 7 整体确认与后续实施门槛仍分开处理。

## Approved Epic 8 Budget Target

Story 8.4 was approved on 2026-09-13: one Node/PG budget authority, desktop Web operations,
atomic per-attempt reservations, distinct product counts/costs and conservative unknown holds.
Budget limits, tariff estimates, matched bills and independent supplier balances have different
sources. The backend/data/UX/ops shards describe the target; deployment/provider evidence remains
unverified. Story 8.5 terminal incident/outbox and desktop delivery controls were also approved on
2026-09-13; Telegram receipts are not read proof, and no-data is not service recovery. Story 8.6
overview adoption, 20 GWT and two desktop R1 boards were approved on the same date. The six
Epic 8 MVP stories and whole-Epic planning completion are confirmed (2026-09-14); final CE
workflow is complete. The 2026-09-14 IR snapshot found gaps; the user approved scoped resolutions
on 2026-09-15, tracked by the current revalidation in CURRENT.md. Historical reports remain
snapshots; business implementation and historical Sprint stay paused until the revised SP handoff.

## Document Index

- `tech-stack.md` - runtime, frameworks and infrastructure
- `source-tree.md` - actual workspace boundaries
- `frontend-architecture.md` - S0-S11 state and component boundaries
- `backend-architecture.md` - services, jobs and module ownership
- `data-models.md` - current/target aggregate and entity contracts
- `planner-orchestration-v2.md` - single-run planning, validation and enrichment
- `rest-api-spec.md` - target high-level API changes; OpenAPI remains SSOT
- `observability.md` - correlation, metrics and privacy
- `testing-strategy.md` - unit/integration/E2E/real-service gates
- `mvp-implementation-checklist.md` - Correct Course implementation gates
- `compatibility.md` - migration from v0.4 to v0.6
- `coding-standards.md` - code rules

## Authority and History

- API SSOT: `docs/api/openapi.yaml`; generated types are never hand-edited.
- DB implementation SSOT: `packages/prisma/schema.prisma` and migrations.
- UX source: `docs/front-end-spec.md` and `docs/ux/mobile-ia.md`.
- `architecture.md`, `v0.3/`, `planner-autoplace-v1.md` and UX delta files are historical.
- Where old text conflicts with v0.6, this index and its current shards win.

## Delivery Rule

Each target capability must be introduced by its assigned story with OpenAPI-first changes,
generated types, migration, ownership/idempotency/revision checks, focused tests, full build,
and real PostgreSQL/integration verification where persistence or external providers change.

## App Scope Amendment (Approved 2026-09-19)

本次用户已批准主提案与合同附录，批准记录为 `_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`。新增 FR52/NFR25 与 Epic 9，首期交付 Web/PWA、Android 签名测试 APK、iOS TestFlight；支持 Android 10+ / iOS 16.4+ 手机竖屏。9.1 前置交付可安装的既有入口/宿主，原业务 Story 完成各自 App 验收，9.2 最后交付测试包及升级/跨端证据。

App 相册保存只写用户明确导出的行程图片；相机、相册扫描、照片到访/视频产物、连续后台定位、远程推送、分享接收扩展及公开应用商店上架不进入此增量。网页的 `已开始下载，请确认` 与保存未知语义保留。新需求不改变 7.2、8.7/8.8 和四项延期 FR；共用账号、数据与后端继续复用。

9 月 18–19 日已确认的 PNVS 短信/图形选择在现行合同中执行；较早 Authing/极光/腾讯候选研究是历史。平台注册/Key 存在不等于真实服务接通。构建资源、签名和真机未验证时保留对应门槛；用户已授权继续独立工作并记录决策，不反复请求常规 Story 授权。

- `app-host.md` 是当前多端宿主/原生边界及交付合同。


## Current UI amendment (2026-09-20)

- [ui-foundation.md](ui-foundation.md)：共享组件、版本治理、AppSheet/Portal与迁移责任。
- [frontend-data-navigation.md](frontend-data-navigation.md)：已批准Query9.6与Router9.7边界。
- [UI验证合同](../ops/ui-validation.md)：工作台、真实lint、浏览器和CI分层。

当前67 Story/1089 GWT，支持iOS16.4、Firefox128和Safari16.4；之前62 Story与iOS16说明为变更前历史。执行边界见CURRENT.md。

---

## Source: `docs/architecture/tech-stack.md`

# Tech Stack

## Runtime and Workspaces

- Node.js 22 in WSL Ubuntu; pnpm workspace; TypeScript ESM.
- Mobile client: React 19 + Vite in `apps/mobile` (shared Web/PWA and approved Capacitor Android/iOS surface; native implementation tracked in 9.1).
- Backend: Fastify 5 in `apps/server`; modular services rather than a separate Nest runtime.
- Contract package: OpenAPI-generated TypeScript in `packages/types`.
- Persistence: Prisma 5 + PostgreSQL; PostGIS/pgvector remain target capabilities where enabled.

## Jobs, Storage and Integrations

- Application-code orchestration on existing Node/Fastify workers with BullMQ/Redis where a queue is needed; durable state, bounded retries and DLQ remain required. No n8n/low-code prerequisite or replacement framework is introduced.
- Tencent COS/CDN for re-hosted media and signed URLs.
- AMap Web API/SDK for POI, geocoding, reverse geocoding and route duration.
- External XHS downloader plus production multimodal adapter for media metadata, configurable frame
  sampling, VAD/ASR and evidence extraction; deterministic stubs are test doubles only.
- Provider-neutral `TransportScheduleLookup` for flight/rail service facts. AMap matches terminals
  and routes but is not a flight/rail schedule source. Story 2.4 must select and staging-verify a
  China-capable provider; manual exact/window/AI-decision paths remain mandatory fallback.
- Provider-neutral weather adapter with reliable-horizon metadata and seasonal fallback. The owning
  Epic 3 validation Story must select and staging-verify a source before weather-aware acceptance can close.
- OpenAI-compatible Provider abstraction with server-managed secrets, remote routing,
  quotas, timeout, retry, cost guard and circuit breaker.
  Approved 8.3 retains existing Node adapters and uses PostgreSQL as the sole route-release
  authority, with a narrow Fastify/React operator surface. Unleash retains ordinary feature flags;
  no independent LiteLLM/Bifrost service or paid configuration platform is required this release.
- Langfuse, Sentry and promptfoo for tracing, errors and offline regression.
  Approved 8.1 keeps one Sentry global OTel provider and explicitly isolated Langfuse tracing,
  with safe job/attempt correlation and independently bounded sampling. Use mature operator UIs,
  not a new Nomad dashboard. Exact SDK/hosting/paid capabilities remain implementation gates.
  Approved 8.2 uses promptfoo execution plus a minimal result/version bridge to existing Langfuse
  evaluation and human-review UI. Dedicated direct-identifier-filtered evaluation datasets are
  distinct from production traces; prompt/model trials do not publish production routing.

## Architectural Constraints

- OpenAPI first; generated files are outputs.
- No Windows-native Node/pnpm for this repository.
- External calls use adapters, timeouts, typed failure and deterministic test doubles.
- Job attempts and plan mutations carry ownership, idempotency and revision/fencing tokens.
- User-facing progress is factual state, never estimated percentage unless the provider supplies
  a durable denominator and completed count.

## Performance Targets

- UI interaction 120-200ms and stable layout through async state changes.
- Establish P50/P95 separately for import, initial planning, validation, enrichment and export.
- Provider fallback must not create a second user completion path.
- Real targets are established by the owning Epic 8 observability Story from staging traces rather
  than inherited v0.4 guesses.
- METRICS-01 starts comparable workload/version/stage/failure measurement with each first capability;
  8.1 aggregates and METRICS-02 fixes evidence-backed targets before that capability's production
  release. 8.2/METRICS-03 retains per-rule evaluation and real human review. See the dated
  implementation-prerequisites planning record; no invented runtime thresholds are introduced.

## Capacitor Delivery (Approved 2026-09-19)

React/Vite 共用 Web/PWA + Capacitor Android/iOS，产品支持 Android10+/iOS16.4+。原生工程与能力首次消费、构建/签名/分发门槛见 `app-host.md`。9.1 锁定实际版本并验证 Web bundle 最低目标；WSL/Linux 与 macOS 原生 runner 分工，Windows-native Node/pnpm 禁令保留。


## Approved UI foundation (2026-09-20)

shadcn/ui＋Base UI＋Tailwind4作为Nomad自有共享组件源码基础；Storybook/MSW/真实typed lint为9.4，Playwright关键流程/截图/CI为9.5，实际共享组件消费为9.3。TanStack Query9.6与Router9.7均纳入本期且独立验收，RHF/Zod随首个复杂表单评估。目标选择不等于依赖已安装。精确初选/peer约束、源码生成升级和CSS治理见ui-foundation.md；读取/导航边界见frontend-data-navigation.md。

---

## Source: `docs/architecture/app-host.md`

# Capacitor App 宿主与交付合同

Updated: 2026-09-19
Status: Approved scope; implementation and real-device proof remain story-scoped

## 平台、目录与版本

同一 apps/mobile React/Vite 应用交付 Web/PWA 与 Capacitor Android/iOS；Android 10+、iOS 16.4+ 手机竖屏。增加 capacitor.config.ts、android/、ios/、src/platform/，保留 Web 单独构建。发布内置冻结 Web assets，HTTPS API 与本地宿主来源分开配置，开发 live reload 不进入候选发布配置。原生工程、wrapper/必要锁文件纳入版本管理，签名秘密、环境私钥和构建输出排除。

日常 Node/pnpm 使用 WSL；明确允许专用 macOS runner 完成 iOS 原生构建/依赖步骤，禁止 Windows-native Node/pnpm。由 9.1 核验并锁定版本；iOS 最低版本同时约束 Web bundle 构建目标，不能只改 deployment target。

## 能力边界与首次交付

| 能力 | 责任 Story | 合同 |
| --- | --- | --- |
| 返回/键盘/安全区/生命周期/外链 | 9.1 | 小型 typed platform 接口；listener 释放，重复恢复合并，错误真实；外部页面无业务桥接 |
| Native Session/Transport、登录回调 | 1.0 | 同一 User/OAuthIdentity/Session 权威；Web cookie 与原生凭据路径分别验收，不假定不同宿主共享 cookie |
| U-App / U-Link | 1.0、1.6，8.1 汇总 | 双端 SDK 与最小桥接；当前隐私选择、平台配置、实际事件查询及无双计数 |
| 受保护图片、相册、分享 | 5.4/5.5 | owner 隔离临时文件；系统仅收文件而非 token/签名 URL；真实保存回执和有序批次 |
| 单次定位 | 6.2 | 当前系统权限、单次前台 fix、精度/时间/坐标系校验、无 GMS 路径与原计划降级 |
| 账号副本、截图选择 | 7.4/7.6 | 用户选择文件目的地/单张截图；私有缓存与 EXIF 清理，无相册扫描 |
| JS / 原生故障 | 8.1 | app build/Web bundle/平台与安全业务关联；符号可定位且不重复采集 |

## 会话、恢复和外部导航

1.0 固定 Native Session/Transport ADR：原生 cookie jar 或受控凭据注入必须证明 API、SSE、下载、撤权一致；必要持久凭据由 Keychain/Keystore 保护，不放普通 localStorage/Preferences、深链或日志。本地 origin 不是认证证明，不能为接受 capacitor scheme 放宽全局 HTTPS、通配 CORS 或浏览器 CSRF。

第三方身份使用供应商支持的官方 SDK/系统认证会话，回调校验适用 state/nonce/PKCE、一次性与接收方，服务端确认后读取 /me。冷暖启动去重，跨 owner/过期回调丢弃。Browser 外链能力不自动等同身份认证能力。

恢复顺序为遮蔽未核实私有视图 → 当前身份/资格 → job/revision/cursor 对账 → 恢复可确认页面。进程被杀不取消已受理 job，不承诺后台 SSE 常驻，不自动重交未知写入或把未持久化草稿标为已保存。原生缓存、迟到插件响应与账号切换受同一代际保护。

## 文件、权限和隐私

行程图片写相册由 5.5 使用经维护/许可/版本核验的桥接：Android MediaStore，iOS PhotoKit add-only 等实际最小权限。沙箱文件创建和打开系统分享不等于相册保存；只在系统确认后显示已保存，取消/部分/失败/未知分别处理。分享接收者是否收到通常不可观察，不能代报成功。

TripLongLayoutPolicy 同时验证 WebView、解码/系统保存和设备内存；WebP 不支持时按版本化规则 JPEG fallback，保留完整城市边界、同一 manifest、无 ZIP。下载后的临时文件按 owner/用途隔离并清理，不把秘密或受保护 URL 传给系统。

各消费 Story 维护 AndroidManifest、Info.plist 用途、entitlements、适用 PrivacyInfo.xcprivacy/required-reason 声明与真实 SDK 清单；9.2 复核最终二进制。采集须服从适用隐私选择，未经同意不因 App 启动自动采集，权限拒绝不阻断无关基础功能。

## 构建与证据

9.1 交付真实可安装的已有入口；9.2 交付签名 APK 与指定组可用且实际安装的 TestFlight build。记录 source revision/内容摘要、lockfile、assets、工具/SDK、环境、签名安全引用和版本。配置/生成源码、CI workflow、模拟器、IPA 或上传受理不能冒充已完成真机安装/TestFlight 可用。

APP-BUILD-01、APP-HOST-01、APP-DISTRIBUTE-01 逐 Story 进展；源码可开始、某平台可构建、可签名、可分发分别报告。需要的 macOS/开发者权限/真机未核验时保持门槛，继续可独立工作；不下调支持范围或标假 done。


## Current platform and shared UI amendment (2026-09-20)

现行支持：iOS16.4+；Android10+且WebView111+；网页Chromium/Edge111+、Firefox128+、Safari16.4+，桌面运营使用同一网页矩阵。iOS最低目标同步所有Xcode配置、App SPM平台、WebBuildTarget/cssTarget、native verifier与测试矩阵。插件最低版本可更低但不能高于App声明。旧16.0/Firefox114证据保留为历史，不推导新下限已验证。

9.3 AppSheet/Portal通过现有host返回与身份边界；9.6恢复前先核对身份再刷新Query，9.7在已校验typed intent后导航；不改业务写入/凭据权威。旧浏览器退出支持需要轻量且可用的升级提示，由9.3落实。最低真实OS/设备证据仍需补齐，Playwright WebKit和生成配置不替代。

---

## Source: `docs/architecture/source-tree.md`

# Source Tree and Workspaces

```text
apps/
  mobile/           # React/Vite mobile-first client
  server/           # Fastify routes, services, SSE and jobs
packages/
  prisma/           # Prisma schema/client and persistence package
  types/            # OpenAPI-generated TypeScript contracts
docs/
  api/              # OpenAPI SSOT
  architecture/     # current architecture shards
  ops/              # limits, errors and runbooks
_bmad-output/
  planning-artifacts/
  implementation-artifacts/
scripts/            # probes and handoff checks
ops/                # deployment/staging assets
```

## Ownership Boundaries

- `apps/mobile`: presentation state and API client only; no Provider secrets or invented facts.
- `apps/server`: authentication, domain commands, orchestration, integrations and SSE.
- `packages/prisma`: persistence schema; migration required for durable contract changes.
- `packages/types`: generated from `docs/api/openapi.yaml`; do not hand-edit.
- `_bmad-output/implementation-artifacts`: story and sprint execution authority after planning.

Use `pnpm -F nomad-types run generate`, focused package tests, then `pnpm -r build` for
contract changes. The actual repository structure wins over older proposed RN/Flutter trees.

## App Target Directories (Approved 2026-09-19)

`apps/mobile/capacitor.config.ts`、`apps/mobile/android/`、`apps/mobile/ios/` 和 `apps/mobile/src/platform/` 是新增目标；复用已有 React/Vite 页面而非第二个 UI 栈。签名秘密/个人环境/build 输出不入 Git，原生源码与必要锁文件入 Git。实际实现进度见 Story9.1。


## Approved UI directories (implementation pending, 2026-09-20)

9.3在apps/mobile/src/ui/{primitives,components,styles}建立共享源码，9.4在该workspace独立配置Storybook/MSW与lint，9.5建立浏览器用例/快照及CI产物目录；9.6读取adapter与9.7路由各自独立模块。当前单一前端不先创建packages/ui。目录及依赖由各Story实际交付，本文不表示已存在。

---

## Source: `docs/architecture/coding-standards.md`

# Coding Standards (TypeScript/Node)

## Language & Types
- Enable strict TypeScript. Avoid `any`; prefer precise types.
- Use explicit function signatures for exported APIs.
- Prefer discriminated unions over enums when modeling variants.

## Modules & Imports
- ES modules only; no CommonJS.
- One default export per file: avoid; prefer named exports.
- Stable public surfaces via `index.ts` barrels where helpful.

## Errors & Logging
- Fail fast with early returns; avoid deep nesting.
- Never swallow errors; include error codes aligned with docs/ops/error-codes.md.
- Structure logs; include `trace_id`/`span_id` when available.

## Async Boundaries
- Do not block event loop with CPU-heavy work; offload to jobs.
- Timeouts and retries at integration boundaries (LLM/HTTP/DB).

## Testing
- Unit: pure logic and adapters. Integration: module interactions & DB/Geo/Provider. E2E: key user journeys.
- Keep tests deterministic; snapshot only for stable payloads.

## API Contracts
- OpenAPI is SSOT. Update `docs/api/openapi.yaml` first; sync other docs.
- Validate inputs with schemas (zod/joi) near boundaries.

## Security & Privacy
- No PII in logs. Provider secrets stay server-side and never appear in frontend payloads, analytics, traces, or generated exports.
- Apply least-privilege to tokens and storage.

## Style & Formatting
- Respect existing formatting. Prettier + ESLint recommended.
- Descriptive names; avoid magic numbers; extract constants.
- Comments for non-obvious rationale only.


## Story9.4工具实施进展（2026-09-25）

独立Storybook/MSW工作台、typed ESLint、单Chromium interaction/axe与产品/双端资源隔离已接线；实际命令、cohort、反例、旧探针保留表与证据边界统一见docs/ops/ui-validation.md。Vitest同组由准备候选4.1.9调至安全修复4.1.11，正式决定见story-9-4-execution-decisions-2026-09-25.md。当前不修改9.3共享层、Query/Router或auth/journal/cursor权威；9.4已于2026-09-25通过独立CR及完整CI36129441895，按6344a53与26文件下载产物封存，当前done；详见其ui-delivery.yaml。本增量只描述工具实施，原批准范围/快照不重写。

---

## Source: `docs/architecture/frontend-architecture.md`

# Frontend Architecture (Mobile-first)

## Operator Surface Boundary (Approved 2026-09-13)

Operator management is desktop Web only; mobile adaptation/phone screenshots are not required
for these internal pages. Reuse existing React/Fastify authorization and UI patterns, separate
from traveler Settings. Story 8.4 supplies its own budget/tariff/usage/source and receipt-recovery
path before the 8.6 overview. Operator-set limits, computed estimates, matched bills and supplier
balances remain distinct. Existing traveler mobile contracts and no-user-quota behavior still apply.

Story 1.0 supplies the real identity/session and minimal permission baseline for the first operator
write. Story 1.11 adds a focused manual place-correction page beside its existing brand-rule tool:
select an existing POI, compare provider/manual fields, edit name/address/same-city coordinates,
enter a reason, check the diff and publish/clear an override with a real receipt. Save-draft is not
publication; conflicts retain input, unknown outcomes recover the same operation. No generic
POI-merge/alias/neighbor/blacklist/bulk-rerun navigation is added. New effective facts and already
published user snapshots are distinct; public source details do not expose operator audit notes.

## Route and Stage Model

The client uses S0-S11 from the PRD. Route names may differ internally, but analytics and
user-facing transitions must preserve these boundaries:

- Home/Library: S0/S1.
- Planning input stack: S2 Time, S3 Accommodation, S4 Picker, S5 Review.
- One plan route: S6 planning state and S7 hydrated timeline; S8 is modal/loop state.
- Detail/result/export: S9-S11.

Story 5.1 delivers the minimum existing S10 route/read view and its S7 plan-level entry before the
full 5.2 enhancement: read the exact base itinerary, enter S9, inspect minimal authenticated source
details in S9, and return to the same valid date/scope/scroll/focus. Direct S9 recovery establishes a
safe S10 parent context without depending on later recent-trip metadata. 5.2 extends the same
route/query with full two-row checks, slot reading and CitationSheet; do not duplicate ResultSheet,
ValidationRun or citation authority. Navigation neither starts work nor mutates the itinerary.

Historical `/planner/pick` deep links pass through an input guard that collects missing S2/S3
data. Only S5 dispatches the PlanningJob.

## State Ownership

- **Server state:** authenticated query layer keyed by job/Trip/Plan and revision.
- **Input draft:** one planning draft containing city chain, boundaries, stays, intents, pace,
  optional additional constraints and evidence-derived interest signals.
- **Picker intent store:** normalized `poiId -> required|along_route|unselected`; overview,
  L3 rows, map markers, summaries and payload are selectors over the same store.
- **Planning state:** one `planningJobId`, durable last event and reconnect cursor; never parallel
  user-selected versions.
- **Timeline state:** server current revision plus optimistic command state; stale responses are
  rejected by revision rather than merged.
- **Presentation queues:** Home ingest processing state is separate from ten-second FIFO result
  presentation state.
- **Recent/resume state (7.1):** owner-keyed aggregate list and minimal versioned view metadata,
  not a new Plan state machine. Resolve draft/Plan/Trip aliases to current root before opening;
  restore allowed S2-S5, original job, S7/S10 context or existing S9/S11 recovery. An actual
  pending change is subordinate to the published plan, never inferred from page departure.

Do not encode server truth in component-local booleans when it affects multiple screens.

## Component Boundaries

- Home: `HomeImportDock`, queue status, recognition state, import records, `RecentTripCard`,
  `RecentTripsScreen` and shared current-root resume resolver (7.1).
- Time: `TripDateRange`, `DailyStartPicker`, `TripBoundaryRow/Sheet`.
- Accommodation: `StayNightList`, `HotelPoiField`, `BreakfastRow`, `LuggageSheet`.
- Picker: `PickerOverview`, `L2IntentSummary`, `PickerL3View`, `MapViewport`, `PoiInfoSheet`,
  `IntentTotals`; L2 status is derived and non-interactive.
- Review: `PaceSelector`, collapsed `AdditionalConstraints`, intent summary and sole start command.
- Plan: `PlanningTimelineShell`, `DayTabs`, `TimelineRow`, `HotelFooter`,
  `DayLoadSummary`, `CandidateDrawer`, `PlanGlobalHistoryControl`, `TimelineEditSheet`, `FixSheet`,
  `AiAdjustmentLauncher`.
- Linked trip: `CrossCityChoiceSheet`, `DayExcursionEditor`, `RoundTripBoundaryRows`,
  `ExcursionTimelineSection` and `DayExcursionActionSheet`. Timeline context carries an explicit
  active host/child Plan id; repeated city labels never select command scope.
- Trip adjuncts: `MealChoiceSheet`, `AreaFoodHint`, `ChecklistRail/Page/AddSheet`.
- Detail/export: `DetailPreview`, `ResultSheet`, `CitationSheet`, `ExportPreview`.
- Account copy (7.4): reuse Settings navigation with bounded request/scope, durable job status
  and protected file download. Separate generation failure, expiry, read error and download retry;
  preserve same-task resume/valid old artifact and do not infer browser save success or expose quota.
- Account deletion (7.5): scope and optional export, final confirmation and limited receipt-driven
  status. Clear/fence private state after acceptance; read failures cannot become delete failures.
  Separate online cleanup/retention, no account restore/undo, no normal account APIs via a receipt.
- Settings (7.3): reuse `SettingsScreen`, read-only account facts, typed available destination
  resolver and current-session logout Sheet. A destination independently authorizes its workflow;
  no quota dashboard, BYOK initialization or profile editor. Data/feedback workflows stay separate.
- Feedback (7.6): shared source-preserving entry, runtime-specific external launcher, minimal
  text/one-image form, opt-in diagnostics and durable receipt. Disabled upload has no failure banner
  or special text-only CTA; an unresolved image is explicitly removed through X before ordinary
  text submission. Busy upload/submit/receipt checks have no bottom actions; bounded timeout exits
  busy before recovery. Unknown external outcomes never hydrate a fake submission success.

Removed current-product components: `SmartPlanSwitch`, `HQStatusBar`, `SwitchAdoptBar`,
visible seed badges and a separate initial-completion page.

## API and Reconnect Rules

- API types come from `nomad-types`; runtime responses are validated at trust boundaries.
- SSE reconnect sends last event id/cursor and rehydrates durable job state before accepting
  transient events.
- Retry uses the same idempotency key where semantics are retry, and a new key for explicit new work.
- Planning attempt output only hydrates when its fenced current revision matches.
- Location can refresh once on app open/foreground resume when a current on-trip meal context
  exists and previous permission is still valid or permission is newly granted. Meal entry/manual
  refresh remains supported; coalesce same-activation events and respect current OS permission.
  No permission dialog on app open for ungranted users; keep plan-context candidates and offer
  contextual opt-in. Bind requests to owner, foreground session, revision, MealSlot, date and scope.
  Raw fixes are cleared after use; only short-lived scope-bound candidates/coarse basis remain.
  App-open results never navigate or replace an active Sheet draft. Sheet requests require the
  matching open Sheet; close cancels only its requests. Background/logout/revocation/scope change
  invalidates related requests and cached context, including late callbacks. No watch/timed tracking.
- Weather and route facts are rendered only with server-provided status/freshness. Unknown or
  seasonal fallback is explicit; the client never derives live claims.

## Timeline Commands

All insert/replace/move/retime/delete/fix/AI-adjust commands include expected revision and an
idempotency key. Optimistic UI may show pending state but must restore server state on conflict.
User time strings accept every valid minute; generated placement may remain 15-minute aligned.
Adjacent commute data is nullable server output.

## Performance and Accessibility

The 18-group prompt-presentation contract is approved (2026-09-15) in front-end-spec. Derive
presentation from existing typed facts: soft-only issues use one accessible low-emphasis
`有 N 项建议核对 · 查看` entry; hard/mixed issues retain visible repair access and original gates.
Place search/partial/duplicate/read failures in the affected module, preserve draft/owner/revision
and distinguish empty, failed, unknown and not-saved. Contextual detail expansion is not an extra
acknowledgment step. Counts refer to the current module/version, not an invented global checklist.
Location fallback keeps the actual planned basis visible while reasons expand on demand; stale
completed images remain usable with a neutral update notice. Necessary facts still travel with
exported files. Do not mutate validation/business state when a prompt is collapsed or dismissed.

- Approved 8.1 adds actual browser error capture, release-matched private source maps and safe
  event/correlation propagation, not a monitoring or quota page. Disable Replay/form/full request
  capture, minimize breadcrumbs/URL/error values, and never expose admin/upload credentials.
  SDK outage leaves existing user navigation/recovery intact; no new visual flow is authorized.

- Settings exposes account and available actions only. Remove BYOK initialization/form and
  all quota/usage/reset-time displays; actual job stages stay in their existing working screens.
  Unknown destination capability cannot default to available, and no read starts billable work.

- Recent trips retain same-owner cached summaries only as unverified stale summaries on refresh
  failure; no network-validated current plan means no promise of offline mutations. Auth changes
  clear private cache and outstanding responses. Restoring a missing date/anchor goes to a valid
  parent, never to a same-name guess; transient Sheets and expired undo tokens are not replayed.
- Recent loading, empty, failed and paginating states preserve Dock/list dimensions. A saved
  unfinished change uses neutral copy; only the relevant terminal task failure uses error styling.

- Virtualize long lists/timelines; preserve per-day scroll positions.
- Lazy-load map and media; core Picker remains operable in list fallback.
- Stable row dimensions prevent async badges, travel values or images from shifting controls.
- Icon-only intent/history/checklist actions require labels, selected state and disabled reason.
- Do not store Provider secrets, original cross-user source URLs or continuous location history.

## Native Host Boundary (Approved 2026-09-19)

遵守 `app-host.md`：薄平台接口承接 App/返回/键盘/安全区/受限外链；业务插件在首次责任 Story 进入。前台恢复先核实身份，再恢复 job/revision；不承诺后台 SSE 或自动重交未知写入。系统返回尊重草稿和 Sheet，权限/外链返回不自动提交。


## Approved shared UI, read and navigation layers (2026-09-20)

采用ui-foundation.md的Nomad基础/组合/业务三层及UX-DR37；受保护Portal与页面共享身份遮蔽边界，AppSheet唯一拥有焦点/滚动/关闭适配。Query9.6与Router9.7的权威边界、默认重试/刷新限制和回退详见frontend-data-navigation.md。9.3先实际迁移现有入口，后续页面归原业务Story。业务controller/journal/cursor/session不被通用组件、cache或router替换。

---

## Source: `docs/architecture/backend-architecture.md`

# Backend Architecture

## Module Ownership

- `Auth/Account`: Story 1.0 owns production identity mapping, durable multi-device sessions,
  qualification/revocation and minimal server-side operator grants before real-user/first operator
  access. Existing pages/routes are reused; dev identity/OTP/captcha fallbacks cannot authorize
  production, and store outages fail truthfully. 7.3/7.5 consume this baseline rather than create it.
- `AccountExport` (7.4): explicit owner-scoped current-product-data capture, JSON-in-ZIP worker,
  durable task/retry and protected artifact delivery; separate from itinerary image Export.
- `AccountDeletion` (7.5): verified confirmation, atomic lifecycle/session stop and durable dispatch,
  owner inventory/step cleanup, limited progress receipts and safe retries. It cannot depend on
  feedback delivery or a future operator dashboard; ordinary logout remains a separate command.
- `HomeInputRouter`: classify natural language versus one or more supported links.
- `RecentTrips` (7.1): owner-scoped root aggregation/current-revision resolution and independent
  minimal resume metadata. It reuses PlanningInputs/TripCoordinator/job state, never owns planning
  publication or infers failure from a client leaving the page.
- `Ingestor`: one durable job per URL, normalization version, media sampling/VAD/ASR/multimodal/COS
  pipeline, evidence signals and durable SSE event log.
- `ImportRecords`: owner list/detail, source title and protected original URL.
- `GeoResolver`: AMap canonical POI, branch disambiguation, L1/L2 and BusinessArea membership.
- `PoiCorrection` (1.11): restricted desktop read/draft/check/publish/clear-override operations for
  the same existing POI's name/address/same-city coordinates. Preserve original provider snapshots,
  manual provenance, expected-version/idempotent receipts and audit. Derive one effective fact
  version for new consumers; do not merge/reidentify POIs or mutate already published user plans.
- `CandidateCatalog`: owner-scoped post-plan search/manual candidates, exact/proxy/unresolved
  location state and landmark-proxy route endpoint resolution; it never mutates the timeline.
- `PlanningInputs`: Trip date chain, boundaries, per-night stays, breakfast, luggage, pace,
  optional additional constraints and evidence-derived InterestProfile.
- `TransportFacts`: provider-neutral flight/rail lookup plus AMap terminal matching, route matrix,
  freshness and manual/unknown fallback. AMap is not a schedule provider.
- `TripCoordinator`: main Trip/segment ordering, DayExcursion lifecycle, main/round-trip
  TransferLeg boundaries and atomic TripRevision publish.
- `Planner`: complete initial place/time orchestration for one Plan or coordinated segments.
- `SlotEditor`: structural command validation, revisioned mutations and undo journal.
- `Validator`: initial and mutation-triggered derived feasibility, typed fix proposals.
- `LocationContext`: ephemeral single-fix normalization for authorized app-open/foreground-resume
  or meal-entry/manual refresh; owner/revision/meal/scope-bound read-only recall and plan fallback.
  Raw coordinates are discarded after processing; no persistent location history or app-open plan mutation.
- `WeatherContext`: reliable-horizon forecast/seasonal fallback cache with source and freshness.
- `Meals`: MealSlot pools, local revalidation and owner commercial-area recall.
- `Checklist`: TripChecklistItem commands and confirmed AI suggestions.
- `Filler`: do/prepare/notice, why, citation and quality enrichment only.
- `Export`: current-revision ResultSheet image preview/rendering, WebP/JPEG artifacts and storage cleanup.
- `ProviderGateway`: routing, attempts, quotas, timeout/retry/circuit breaker and Langfuse.
  Approved 8.3 keeps this in the existing Node adapter layer, not a required external gateway.
  PostgreSQL owns route revisions, active pointers and operation receipts; Unleash remains ordinary
  feature flags, not a second writable routing authority. A narrow protected operator surface is in scope.
- `Observability` (8.1): early API/worker bootstrap, validated safe correlation, allowlisted events,
  isolated AI tracing and independently filtered exporters. Operators query mature tools directly;
  telemetry failure cannot change domain/ledger/attempt state or wait for an operations dashboard.
- `Feedback` (7.6): validated configured destination/capabilities, minimal private first-party
  text/attachment submission, idempotent receipt lookup and authorized maintainer retrieval.
  It registers its own data with prior export/deletion handlers; no automatic third-party forward,
  ticket engine, SSO or operator-dashboard prerequisite.

## Boundary Rules

- Planner never owns account/UI state; Filler never changes schedule; Validator never bypasses
  command ownership/revision checks.
- SlotEditor rejects malformed, unauthorized, outside-trip and immutable reservation/ticket
  commands. Derived opening/travel/load issues are persisted as validation state after mutation.
- External evidence is stored with source/time/quality and inferred/confirmed/rejected/expired state.
  Inferred reservation/ticket evidence is not an immutable lock or proof of booking.
- Administrative district and L2 are not substitutes for BusinessArea.
- A nearby landmark may act only as an explicitly approximate route endpoint for a manual target.
  CandidateCatalog keeps both identities and prevents target facts from inheriting landmark facts.
- Raw source URL is returned only through owner-authorized import detail.
- Dedicated content-moderation service integration is deferred by the 2026-09-15 scope decision;
  keep file/schema/size/decoder/source/owner and untrusted-input protections. Do not claim an
  unperformed review passed or add support for new upstream platforms from this deferral.
- Feedback may receive only explicit text/selected screenshots and opt-in allowlisted diagnostics.
  Opening a URL or an email client is not receipt proof. Committed text plus verified attachment
  is first-party receipt truth; a deleting owner cannot upload, finalize or recreate a report.
  Temporary-object cleanup preserves valid accepted attachments and clears abandoned ones.

## Brand Rule Governance (Approved CE-01, Story 1.11)

Ship the minimal desktop operator view/edit/draft/check/publish path with the first brand-rule
consumer. Reuse existing auth and Node/PG patterns, granting minimal server-verified permissions
without relying on 8.3/8.6. Validate bounded rule fields; no arbitrary scripts or outbound URLs.
Persist immutable rule version, active pointer and audit receipt atomically with expected version
and operation idempotency. Each ingest/geo attempt pins its first-used version for filtering and
retries. Verify actual hot loading/use; missing required versions wait/fail boundedly, never mix
rules or reprocess completed records automatically. Failure/conflict preserves the prior policy.

## Provider Route Publication

Approved Story 8.3 (2026-09-08), not an implemented control plane:

- Use a finite registry of implemented task/adapter/connection/model capabilities. Validate every
  primary/backup against modality, tools, output schema, context and bounded parameters. Store only
  approved secret/endpoint references; no arbitrary URL, headers, executable config or secret values.
- Save versioned drafts separately. Static checks incur no model calls; real capability probes
  require separate authorization and bounds. Evaluation references follow 8.2's per-rule policy;
  neither scores nor Langfuse labels automatically promote a production release.
- Publish the exact checked content with expected-current-version and operation idempotency in
  one PostgreSQL transaction with audit receipt. Preserve unchanged tasks. Unknown outcomes are
  reconciled through that operation; concurrent edits cannot overwrite a newer publication.
- Bind the authoritative route/prompt/model/adapter snapshot at task acceptance, including queued
  work. New acceptance cannot silently use stale cache when the current pointer is unknown.
  Workers/retries resume the exact accepted snapshot, retaining referenced versions until safe
  cleanup. A floating gateway alias is not a snapshot; missing content cannot select another version.
- Distinguish stored publication, instance loading and actual attempt use. Missing/disconnected
  instances and no new traffic remain unknown/pending, not evidence of global activation.
- Ordinary releases affect only later accepted tasks. Separate durable pause controls, checked
  before future primary/retry/backup requests, have bounded freshness and measured propagation.
  Expired safety authority stops new outbound calls; already-sent responses follow the original
  business/fencing contract. Pause does not promise cancellation, undo charges or restart jobs.
- Explicit resume rechecks current permissions/capabilities/budgets and does not clear a real breaker
  without recovery evidence. Rollback creates a new monotonic release from compatible retained
  content; it never clears pause restrictions or changes Plan/Trip/accepted-task snapshots.
- Existing budget/concurrency/deadline/fencing protections apply to each actual attempt; one retry
  owner prevents SDK/worker/optional-gateway multiplication. Do not concatenate partial outputs,
  repeat committed tool actions or use alternate models to bypass input/permission/safety rejection.
- LKG must be validated for source/environment/content and safety freshness. No trusted baseline
  means the affected capability cannot call out. Earlier first-use safeguards remain mandatory;
  centralized budget accounting, Telegram and overview are separate later stories.

## Budget Publication and Accounting (Approved Story 8.4)

Approved 2026-09-13: use the existing Node adapters and one PG-backed budget authority with
minimal desktop Web policy/tariff/usage/source operations. This is a target, not running code.

- Budget/tariff revisions, active pointers and expected-version operation receipts are independent
  of 8.3 frozen routes. Logical product grants attach atomically to Job acceptance; each real paid
  attempt separately reserves sufficient bounded cost in all applicable scopes/windows.
- Use existing short PG/Prisma transactions, unique attempt/operation identities and consistent
  locking. Persist fenced send intent and expiring dispatch permission; no network calls inside
  retried DB transactions. Recheck current pause/budget/eligibility at each actual dispatch.
- Unsent, in-flight/unknown, estimated and confirmed amounts cannot double-count exposure. Known
  facts settle idempotently; late attempts cannot publish through stale fences but still cost money.
  Release only proven-unsent exposure; expiry/abort cannot prove upstream cancellation.
- Tightening may leave genuine overage and stop new calls while sent work settles; rollback creates
  a new policy, not ledger undo. Window rotation preserves history/unknown risk and revalidates
  unsent work. Job and actual-call concurrency are separate; queues do not hold outbound slots.
- Actual-seller tariff evidence defines unit/currency/model/tier/effective version. Usage times
  tariff is estimated. Per-call cost receipts, aggregate bills and independent account balances
  each expose their actual capability/coverage/time; no common supplier billing API is assumed.
- The Web surface shows source-aware amounts and unavailable/stale/unknown states. No operator
  mobile adaptation, new gateway, billing product or 8.6 dependency. Unknown bounds/authority stop
  new paid dispatch; existing safe manual/read paths follow their original contracts. Implement
  OpenAPI-first, minimal entities, real PG/provider failure tests and 7.5 cleanup when developed.

## Terminal Alerts and Notification Delivery (Approved Story 8.5)

Approved 2026-09-13: eligible durable AI/AMap facts -> PG incident/episode and unique outbox ->
fenced worker -> thin Node Telegram sendMessage adapter. Reuse 8.1 diagnosis and 8.3/8.4 safety
facts; no additional gateway, Alertmanager, full Bot service or webhook/getUpdates prerequisite.

Source event IDs/cursors and authoritative sequence support replay. Incident transitions and
outbox creation are atomic; send HTTP remains outside DB retries. Notification policy drafts,
expected-version publication/receipts, target aliases and bounded mute live behind real desktop
operator permissions. Before each send, validate target/episode/sequence/mute/deadline and fence.

Success records Message identity, not recipient read state. Unknown external outcomes/failed
receipt writes retain possible duplicate delivery; one persistent retry scheduler owns rate,
retry_after and exhaustion. Deterministic auth/target failures require controlled repair. Recovery
uses same-scope business evidence; absent data/tool closure cannot resolve an incident. New
fault episodes reject old recovery, and stale unsent messages are canceled/merged appropriately.

No alert operation changes committed Job/Plan, ledger or retry/breaker truth. Minimal Web status,
source/attempt evidence and separately authorized TEST actions work before 8.6. Safe text/links
and token-path redaction apply before every exporter. Real PG, target permission, send/unknown
fault and desktop verification accompany this Story's future API/DB implementation.

## Read-only Operations Summary (Approved Story 8.6)

Approved 2026-09-13: expose a small authenticated desktop summary using fixed source/metric
registrations, permitted fields and bounded parameters. Read existing task aggregates, sealed
8.2 reports, 8.4 budget results, 8.5 incidents and 8.3-8.5 configuration evidence; no new writable
metric/ledger/incident authority or general SQL/URL proxy.

Each source independently returns its scope/window, coverage, data/fetch time and state. Cache
keys include effective permissions/environment/filters/definition; coalesce identical requests,
limit concurrency/rows/windows and honor source quotas. Source failure is partial, stale data
is labeled, and late results cannot cross filter/account changes or revoked access. Read work
has bounded connection/resource use and does not compete without limit with budget transactions.

Protected native-tool links preserve supported filters and target authentication. Data API keys
stay server-side; browser view roles are not source credentials. No query invokes model runs,
evaluation, test messages, ledger correction, route publication or incident recovery. Implement
only required read contracts/OpenAPI/generated types and cache definitions; real source version,
permissions, API availability and fault/desktop verification are mandatory at delivery.

## Jobs and Attempts

- `IngestJob`: one URL, multiple jobs allowed, durable stage and reconnectable title/counts;
  ordered IngestEventRecord rows survive process restart and back the SSE cursor.
- `PlanningJob`: one user-visible job per start command.
- `PlanningAttempt`: internal provider/deterministic attempts fenced by job generation and target
  revision. Only one attempt can publish the current result.
- `FillJob` and `ExportJob`: bind exact Trip/Plan revision; retry cannot silently switch input.
  ExportJob also binds include-details, width, export-unit policy, theme and output-policy versions;
  reconnect resumes the same fenced job, while a newer current revision makes an ungenerated preview
  stale. Export units are derived from revision scope, never accepted as client-authored day slices.
  Story 5.5 deterministically composes a cached whole-trip delivery set from the same successful
  snapshot/manifest. A tested, versioned `TripLongLayoutPolicy` normally yields one part and, only
  when adding the next complete main-city section would exceed a safe limit, closes the current part
  and starts the next city in a numbered part. Each section already embeds DayExcursions at their host
  dates. Composition preserves chronology, makes no AI/planning call and consumes no second export
  allowance. ZIP and city-internal splitting are forbidden.

`AccountExportTask` seals a consistent dataset snapshot before bounded packaging. Technical retries
retain that snapshot and schema/scope versions; pre-seal recapture honestly updates snapshotAt.
Only verified complete ZIP/manifest publication makes the task ready. One active owner task and
idempotent receipts prevent repeated-click jobs. Reopening reads existing task state; old valid
artifacts survive a failed explicit regeneration. No new AI/AMap/XHS call fills missing data.
Normal logout does not cancel an accepted export; account eligibility gates capture/publish/download.

Account deletion accepts only after the owner lifecycle, session revocation, task and dispatch
intent commit together. A deleting owner cannot issue normal sessions, read protected data or
publish late job output; each entry/worker commit checks persistent eligibility across restarts.
Inventory object/trace refs before cascades, clear full owned history and credentials, and use
reference-safe shared GC. Persist every required store disposition and retry remaining work only.
Online cleanup completion never silently means backup erasure; retention policy and restore replay
must be verified. Status receipts are not general auth and retry needs a separate scoped grant.

Queue/DLQ jobs use idempotency keys, capped exponential backoff and explicit terminal state.
Application-code workers orchestrate external steps with the existing framework and necessary queues.
Worker memory, callbacks and queues cannot become domain truth; durable state, attempt fencing,
idempotency, bounded retries/DLQ and restart recovery remain independent of the execution mechanism.
No n8n or other low-code platform is required.

## SSE Contracts

For 1.11 manual POI correction, worker/route reads pin `PoiFactVersion`; caches of routes and derived
facts include endpoint versions. In-flight work keeps its pinned version and old published snapshots
are never rewritten on correction publication. Provider and operator races require fresh validation
against the expected base; unknown publish outcomes recover the original operation, not blind replay.

- Ingest: `created -> fetching -> parsing -> geo -> storing -> done|failed` plus factual counts;
  parsing diagnostics use media_prep/speech_detect/frame_extract/asr/multimodal, with legacy
  text/ocr/vision accepted only for compatibility.
- Planning: `accepted -> context -> constraints -> candidates -> arranging -> validating ->
  persisting -> done|failed`, with generic `fallback` when internal route changes.
- Events contain sequence/cursor, job id, trace id and durable state version. UI stage labels are a
  mapping; no invented percentage.

## Security, Privacy and Cost

- Provider secrets remain server-side and are redacted from logs, traces, exports and errors.
- Every owner resource query is scoped before lookup; UUID opacity is not authorization.
- Rate limits and budgets apply by user/device/workspace and task class, with operator kill switch.
- Foreground location is minimized and not written as a continuous trajectory.
- COS uses private objects and expiring signed URLs; deletion and retention are auditable.

## App Authentication Boundary (Approved 2026-09-19)

1.0 复用现有持久 User/OAuthIdentity/Session，为原生会话传输/登录回调提供同等认证、资格、owner、一次性和撤权边界；普通 App 字段或本地 origin 不授予身份。API/SSE/下载必须一致验证；接口变更由 OpenAPI 先行。详见 `app-host.md`。

---

## Source: `docs/architecture/data-models.md`

# Data Models (v0.6 Target)

This shard defines target domain contracts. `packages/prisma/schema.prisma` describes what exists
today; every missing target entity requires its assigned story, migration and tests.

## Production Identity (Story 1.0)

Story 1.0 introduces only the stable internal owner/verified identity binding, shared durable
session/qualification and minimal server-controlled operator grants needed for real login and
protected reads. Verified identities are unique; display names or unverified phone/email equality
cannot merge accounts. Old owner migration preserves proven ownership and isolates ambiguous data.
Multiple sessions coexist; current logout revokes one, a durable account-ineligible state blocks
all ordinary sessions. Story 7.5 later supplies actual deletion acceptance/cleanup, not this
authentication prerequisite. No account merge, self-unlink or device-management UI is created.

## Inspiration and Geography

- `IngestJob(id, userId, normalizedUrl, normalizationVersion, sourceTitle?, status, stageVersion,
  lastEventSeq, counts, error, ...)`.
- `IngestEventRecord(ingestJobId, seq, stage, substage?, payload, occurredAt)`; ordered durable cursor.
- `ImportRecord(id, userId, ingestJobId, normalizedUrl, normalizationVersion,
  originalUrlProtected, sourceTitle, ...)`;
  unique MVP privacy boundary: `(userId, normalizedUrl)`.
- `CanonicalPOI(id, provider, providerId, cityId, standardName, address, geog, hours?, rating?,
  averageCost?, phone?, categories, providerObservedAt, quality, providerSnapshotRef?)`.
- `L1Area`, `L2Group`, `PoiL2Membership` retain regional/route grouping.
- `BusinessArea(id, cityId, providerRef?, name, geog?)`.
- `PoiBusinessAreaMembership(poiId, businessAreaId, source, confidence, reliabilityState,
  policyVersion, observedAt, expiresAt?)`; zero-to-many.
- `Inspiration(userId, importRecordId, canonicalPoiId?, evidence, sourceAttribution, quality, ...)`.
- `EvidenceSignal(id, inspirationId, poiId?, kind, value, sourceRef, observedAt, quality,
  confidence, state=inferred|user_confirmed|rejected|expired)`; kinds include reservation/ticket,
  hard-time, no-queue and interest signals. Only `user_confirmed` or independently verified
  booking/ticket facts may create an immutable planning lock.

BusinessArea is normalized data, not a free-text field on POI. Owner-scoped food recall joins
Inspiration ownership to verified CanonicalPOI and membership accepted by a versioned reliability
policy. The policy defines source precedence, confidence, expiry, conflicts/multi-membership and
food-category evidence; unknown membership is never silently promoted.

## Brand Rule Versions (Approved CE-01, Story 1.11 Target)

Create only the minimal brand-rule draft/revision, active reference and publication receipt needed
by 1.11. Keep allowed rule fields, actor/scope, expected base, version/hash, operation identity,
result and usage evidence; each ingest/geo attempt retains its first-used rule reference. This is
not a generic configuration platform or an 8.3/8.4 policy table created early. Historical POI/import
results are not rewritten on publication. Real permission, concurrency and hot-update tests apply.

## Manual POI Corrections (FR4.2, Story 1.11)

Keep the provider snapshot immutable and store a minimal `PoiCorrectionDraft/Revision` containing
the existing CanonicalPOI identity, expected base provider/effective version, allowed field mask
(display name/address/same-city coordinate), proposed values, reason/evidence references, actor,
time, operation identity and audit receipt. Publication atomically advances the correction pointer.
An effective immutable `PoiFactVersion` binds the provider snapshot and applied correction version;
manual fields retain manual provenance, others preserve nullable provider facts/freshness. Publishing
or clearing an override creates a new version; later provider refresh never silently overwrites it.

Coordinate edits retain `inputCoordinateSystem`, the original point/source, normalized coordinate
system/value and `transformPolicyVersion`. The existing geographic adapter owns the allowed-system
list and versioned normalization; unknown/unsupported systems are rejected, never guessed. Validate
range and same-city/identity after normalization, and use normalized versioned endpoints for routes.
The chosen map/input surface must supply its real coordinate provenance; a numeric pair alone is
insufficient to publish. Applicable schema and transform fixtures are part of 1.11 implementation.

Do not change provider id/city/branch identity, merge/delete POIs or infer hours/rating/phone/prices
from a location correction. Consumers pin the effective fact version at first use; route caches
include both endpoint versions. Old import/job/Plan/Trip/Stay/Export snapshots stay bound to their
original facts. A corrected global record is not a user-authorized plan mutation. Public detail can
show field source/time, never internal notes or operator identity; private audit registers with the
existing account-data/retention/deletion boundaries without treating global POI facts as private
operator-owned travel data. No generic admin or correction batch platform is introduced.

## Planning Inputs and Intent

- `PlanningDraft(id, userId, orderedCityIds, overallRange, dailyStart, pace,
  additionalConstraintText?, parsedConstraints, interestSignals, revision)`.
- `TripBoundary(direction, inputMode, mode, serviceCode?, exactAt?, windowStart?, windowEnd?,
  terminalPoiId?, source, provider?, observedAt?, validUntil?, confidence?, status)`;
  `inputMode=exact|window_2h|ai_decide`. Provider facts, user-entered facts and AI-provisional
  boundaries use distinct source/status values; stale schedule facts never become confirmed by omission.
- `StayRevision(id, tripOrDraftId, logicalStayId, revision, checkInDate, checkOutDate,
  accommodationPoiId?, accommodationName?, leaveBlank,
  breakfast=included|not_included|unknown, source, createdAt)`; immutable snapshot row.
- `PlaceIntent(planOrDraftId, poiId, intent=required|along_route|unselected, source, revision)`.
- `PlanCandidate(id, userId, planId, displayName, source=user_search|user_manual|planner,
  canonicalPoiId?, locationMode=canonical|landmark_proxy|unresolved, landmarkPoiId?,
  landmarkAddressSnapshot?, proxyGeog?, provenance, revision, createdAt)`.
- `InterestSignal(tag=classic|food|nature|photography|heritage|niche|shopping|exhibition,
  sourceRef, confidence, observedAt)`; soft and never a substitute for user intent.

`same_as_previous` is a UI command, not persisted final truth. It copies accommodation/breakfast
into a new StayRevision and recomputes the contextual luggage default.

For `landmark_proxy`, `displayName` remains the user's target and `landmarkPoiId` must reference a
same-city verified CanonicalPOI. The landmark supplies only a route endpoint snapshot. It never
becomes `canonicalPoiId`, and none of its exact address, hours, rating, price, phone or reservation
evidence may be copied onto the target. `unresolved` candidates have no route endpoint.

## Trip and Plan Aggregates

- `Trip(id, userId, title, timezone, currentTripRevisionId, state)`.
- `TripSegment(id, tripId, ordinal, cityId, planId, startDate, endDate)`.
- `DayExcursion(id, tripId, hostSegmentId, localDate, destinationCityId, planId, state)`; its Plan is
  single-city but is not a peer in the main TripSegment order.
- `DayExcursionRevision(id, logicalExcursionId, tripId, parentId?, hostSegmentId, localDate,
  excursionPlanRevisionId, outboundTransferRevisionId, returnTransferRevisionId, status)`.
- `Plan(id, userId, cityId, currentRevisionId, state)` remains single-city.
- `PlanRevision(id, planId, parentRevisionId?, status, createdBy, validationState, ...)`.
- `DayPlanSlot(id, planRevisionId, dayIndex, kind, startAt, endAt, poiId?, candidateId?, origin,
  lockState, ...)`; a proxy-located candidate remains distinct from its landmark after placement.
- `TransferLegRevision(id, logicalTransferId, tripId, revision, contextKind, fromPlanId, toPlanId,
  fromSegmentId?, toSegmentId?, dayExcursionId?, mode,
  serviceCode?, status, departPoiId?, arrivePoiId?, scheduledDepartureAt?, scheduledArrivalAt?,
  accessMinutes, waitMinutes, travelMinutes?, arrivalBufferMinutes, egressMinutes,
  handoffStartAt, handoffEndAt, source, confidence, observedAt)`.
- `LuggageTransitionRevision(id, logicalTransitionId, tripId, revision, date, fromStayRevisionId?,
  toStayRevisionId?, mode, storagePoiId?, dropOffAt?, pickUpAt?, status, source)`.
- `TripRevision(id, tripId, parentId?, segmentPlanRevisionRefs, dayExcursionRevisionRefs,
  transferRevisionRefs, stayRevisionRefs, luggageRevisionRefs, status)`.

A Trip owns an ordered collection of TripSegments without a domain-level city-count ceiling. Each
segment points to one single-city Plan, each adjacent pair has at most one active logical transfer,
and a city may not reappear as a later main segment after the chain has left it in the MVP. The same
append/insert input contract applies no matter how many segments already exist; implementations must
not encode fixed second-city or third-city fields.

A DayExcursion belongs to exactly one host segment and one host local date. It references a distinct
destination-city Plan plus exactly two transfer revisions: `day_excursion_outbound` from host Plan
to child Plan and `day_excursion_return` from child Plan to host Plan. Both legs and all child slots
must fall on the same local date/timezone. The host Plan owns only the usable interval before outbound
and after return; the child Plan owns only the interval between them. A host day has at most one
DayExcursion and cannot also contain a main-chain handoff. The destination has no Stay, and host Stay,
breakfast and luggage references remain unchanged. Domain identity and commands use Trip/segment/
excursion/Plan/date ids, never city-name strings, so the repeated host name is only display text.

A published TripRevision references a complete, immutable set. Draft/failed transfers prevent
joint publication. A DayExcursion publishes only when its child PlanRevision and both confirmed
TransferLegRevisions are present in the same successor TripRevision. Cross-timezone or overnight
return, repeated-city main chains, nested excursions, same-day A-B-C-A and arbitrary segment reorder
are outside the MVP invariant.

Primary luggage labels map to typed modes: `keep_at_previous_stay`, `take_to_next_stay`,
`store_at_transport_hub`, with secondary `carry`, `courier`, `private_vehicle`, `other`,
`no_large_luggage` and `undecided`. The first night cannot use `keep_at_previous_stay`; storage
requires drop-off/pickup; a one-way departure cannot leave luggage behind without an explicit
return pickup.

## Recent Trips and Resume (Story 7.1)

- `RecentTripEntry` is an owner-scoped read model, not another itinerary authority. It resolves
  existing saved PlanningDraft/Job/Plan/Trip identity into one user-visible root with current
  published refs, actual input/job state, known city/date summary and optional actionable change.
  A published draft or a standalone Plan incorporated into a Trip must not produce duplicate rows;
  child Plan/DayExcursion ids resolve to the owning aggregate only after authorization.
- `RecentTripResume(ownerId, targetKind=planning_draft|plan|trip, targetId, view,
  activePlanId?, hostSegmentId?, dayExcursionId?, localDate?, scrollAnchorRef?, revisionHint?,
  resumeVersion, browserSessionId?, clientSequence?, lastOpenedAt)` is minimal durable view state.
  Exact storage layout may reuse existing metadata, with an owner/root unique key and necessary
  query indexes. Allowed view/scope/anchor values are validated against the current aggregate;
  arbitrary URLs, source contents, private prompts and location trails are not stored here.
- User-successful-save activity comes from existing input/mutation truth; opening is a separate
  metadata write. Recency uses server time plus stable id, never worker/SSE/export heartbeats.
  Cursor pagination binds a stable listing snapshot; writes use expected resume version and
  session sequence fencing so delayed positions cannot overwrite newer accepted positions.
- Published state and pending change are orthogonal. A change entry requires an actual owned,
  still-actionable draft/task tied to its input revision. Half-filled input is unfinished, queued/
  running uses actual progress, and failure requires the relevant current terminal task/attempt.
  Discarded/published changes disappear; older failures cannot override a newer draft.
- Browsing metadata never creates PlanRevision/TripRevision or check-in. Current Trip lookup reads
  one atomic revision set, not each child's independent current pointer. Invalidated anchors fall
  back to valid parents; auth failure is not interpreted as empty or unchecked data.

Story 7.2 check-in is excluded from MVP by the 2026-09-06 scope decision. AR16 is deferred, not
a current readiness gate. No VisitOccurrence/VisitState/binding migration or `checked` flag is
required by recent trips, meal recall or replanning. FR40.1 photo-driven recognition and media
outputs require a future design; its schema is not defined by the retired manual proposal.

## Platform Budget Accounting (Approved Story 8.4 Target)

Approved 2026-09-13; conceptual responsibilities, not already-existing Prisma tables:

- Budget/tariff revisions and active pointers: scoped limits/windows, actual seller price evidence,
  immutable versions and audit operation receipts; policy revision never creates a fresh empty ledger.
- Product usage grant: one owner/logical Job or export identity, acceptance rule/window and
  at-most-once finalization/refund. Physical attempts do not multiply product counts.
- Budget buckets/reservations: exact units/currency, stable scope/window, atomic multi-scope
  reservation for a unique physical attempt, with route/tariff version and bounded upper cost.
- Dispatch permits: attempt/fence, control version and validity plus durable send intent. Task and
  external concurrency are distinct, and expiry cannot erase possible upstream costs.
- Settlement/adjustment: mutually exclusive unsent/in-flight/unknown/estimated/confirmed exposure,
  original window and evidence, with idempotent corrections and truthful overage.
- Supplier evidence: safe account/capability reference, receipt/bill coverage and independent
  balance snapshot state/time. Aggregate bills do not fabricate individual charges.

Use precise amounts and bounded retention, never store private prompts/locations/URLs/secrets.
Register personal links with 7.5 cleanup while preserving necessary non-identifying platform totals.
Create actual tables only when implementing this Story; no subscriptions/payments or future alerts.

## Terminal Incident Records (Approved Story 8.5 Target)

Approved 2026-09-13; create these responsibilities only when implementing the Story:

- Eligible source fact/cursor: stable event identity, safe registered scope, authority sequence and
  observed/event times; replay cannot count one failure twice and sampling is not the source ledger.
- Incident episode: stable fingerprint, distinct lifecycle ID, current/source version, exact first/
  last times/counts and recovery evidence. A new episode cannot be closed by an old recovery.
- Notification policy/target revision and mute: approved alias/secret/topic references, bounded
  intervals/expiry, CAS operation and audit receipt. Mute does not change business availability.
- Notification/outbox: unique episode/sequence/type/target, safe content snapshot, next-send/expiry
  and fenced lease. Delivery attempt: send intent, definitive refusal, unknown or validated
  Message ID/receipt time. Do not store raw Telegram chat objects or token-bearing URLs.

Incident/outbox changes are atomic; HTTP is not. Preserve unknown and late evidence, bounded
retention and source replay. Telegram copies have their own lifecycle; deleting a local record
cannot claim external withdrawal. No people/on-call/phone escalation or user-facing quota tables.

## Operations Summary Read Models (Approved Story 8.6 Target)

The overview derives read summaries from prior authoritative entities and reports. A source/metric
registration may describe definition version, allowed environment/project/fields, units, supported
filters, actual history/API limits and trusted link destinations. It does not create a second
budget, evaluation or incident model. No general analytics warehouse is introduced.

A bounded result/cache carries effective visibility, requested/covered window, source/fetch times,
nullable coverage and sampled/extrapolated/estimated/actual/unknown state. Invalidate on permission,
source or definition changes. Do not store raw user content or client-visible source credentials;
only create persistence actually required by the chosen implementation, not future platform tables.

## Jobs, Editing and Undo

- `PlanningJob(id, tripId?, planId?, inputRevision, status, currentAttempt, resultRevision?, ...)`.
- `PlanningAttempt(id, planningJobId, generation, provider, strategy, status, outputRef?, ...)`.
- `PlanCommand(idempotencyKey, ownerId, expectedRevision, type, payload, resultRevision, ...)`.
- `UndoEntry(scopeId, commandId, inverseCommand, expiresAt, eligibility, consumedAt?)`.
- `ValidationRun(inputRevision, status, hardCount, softCount, conflicts, suggestions)`.
- `RouteFact(fromRef, toRef, mode, durationMinutes?, distanceMeters?, source,
  observedAt, validUntil?, status=known|unknown|stale,
  endpointResolution=exact|landmark_proxy)`; endpoint refs may resolve a CanonicalPOI or a
  PlanCandidate proxy snapshot without changing candidate identity.
- `WeatherContext(areaId, localDate, kind=forecast|seasonal, condition, source,
  observedAt, validUntil?, quality)`; cached context, never a booked/user fact.
- `DayLoadEstimate(planRevisionId, dayIndex, level, coreItemCount, activeMinutes,
  commuteMinutes, walkingStepsLow?, walkingStepsHigh?, earliestStart?, latestEnd?,
  freeMinutes, reasons, confidence)`.
- `ExportJob(id, ownerId, targetKind=plan|trip, targetRevisionId, includeDetails, widthPx,
  exportUnitPolicyVersion, themeVersion, outputPolicyVersion, status, currentAttempt, lastEventSeq,
  artifactRefs, outputFormat=webp|jpeg, fallbackReason?, generatedAt, expiresAt, ...)`.
- `ExportArtifactRef(ordinal, scopeKind=standalone_plan|main_segment|day_excursion, scopeId, cityId,
  startDate, endDate, objectRef, format, bytes, checksum)`; the ordered set is derived from the exact
  revision. One ref represents one complete city-unit long image, and different scope identities are
  never merged by city name. Every object is private and owner-authorized. Internal PNG/strip renders
  may exist transiently but are not public output states.
- `TripLongSection(mainSegmentOrdinal, mainPlanRevisionId, cityId, chronologicalBlocks,
  embeddedDayExcursionRefs)`; derived from the immutable export snapshot. One section contains one
  complete main-city segment and every DayExcursion at its real host date, so delivery splitting
  cannot detach an excursion from the host chronology.
- `TripLongLayoutPolicy(version, widthPx, format, maxRasterHeightPx, maxDecodedPixels,
  maxMemoryBytes, maxEncodedBytes, testedBrowserEncoderMatrixRef, status)`; limits are published only
  after supported browser/device and WebP/JPEG staging tests, not guessed from city count.
- `ExportDeliveryArtifactRef(kind=trip_long_part, partOrdinal, partCount, startSectionOrdinal,
  endSectionOrdinal, sourceManifestChecksum, layoutPolicyVersion, objectRef, format, bytes, checksum)`;
  the ordered set is deterministically derived from the same immutable export snapshot, unit policy
  and theme. A normal Trip has one `1/1` part. If adding the next complete city section would cross
  the policy, the current part closes and that city starts the next part; every part displays `N/总数`.
  A standalone Plan may reuse its sole `ExportArtifactRef`. ZIP, city-internal/date splitting and
  hidden part boundaries are not delivery states.

Only the current fenced attempt may publish. Undo history in MVP exposes the live eight-second
entry plus one latest additional eligible entry, not arbitrary snapshot browsing.
Export retry/reconnect keeps the original revision and settings; it cannot adopt a newer current
revision. A stale preview must start a new idempotent request against the newer revision.
Whole-trip delivery composition reuses the successful ExportJob snapshot and does not invoke AI,
replan, create a PlanRevision or consume a second export allowance. One user command owns the whole
ordered delivery batch. Directory-capable clients may write all parts after one permission grant;
other clients use controlled multiple-download permission and keep an honest blocked/retry state.
If one indivisible city unit still exceeds the versioned WebP/JPEG budget, that part fails explicitly
without cutting through the city, while already generated city artifacts remain readable/shareable.

## Client Download Evidence (Approved CE-03)

ExportJob/manifest completion describes available server artifacts, not local device saving.
Per-part client results distinguish confirmed write completion, known failure, not started and
save-unknown. Normal browser handoff renders `已开始下载，请确认` and keeps save-unknown; a user
reminder is not a device write receipt. Retry uses the same manifest: only confirmed incomplete
parts can be selected automatically, and unknown parts need an explicit retry with duplicate risk.
No new account-billing, server save-success or per-file human-confirmation subsystem is introduced.

## Account Data Copy (Approved Story 7.4 Target)

- `AccountExportTask(id, ownerId, idempotencyKey, scopeVersion, schemaVersion, status,
  stage, currentAttempt, snapshotRef?, artifactRef?, lastEventSeq?, safeError?, createdAt)`;
  distinct from image ExportJob and account deletion. One active task per owner; queue is not truth.
- `AccountExportSnapshot(id, ownerId, snapshotAt, schemaVersion, scopeVersion, sealedAt,
  exactRevisionRefs, datasetRef)` binds a consistent capture of allowlisted mutable product fields
  and complete immutable Plan/Trip/DayExcursion/Transfer/Stay/Luggage refs. Capture cutoff is not
  queued time; once sealed, technical retries use the same snapshot, not live current pointers.
- `AccountExportArtifact(id, taskId, ownerId, snapshotRef, objectRef, filename, bytes, checksum,
  generatedAt, expiresAt, state)` describes private JSON-in-ZIP with a versioned manifest and guide.
  Actual object integrity and category completeness precede atomic ready publication.

Include current safe account/preferences, saved drafts/itineraries, owner import/inspiration index
and annotations, checklist and composed itinerary text. Exclude old revisions, raw media, rendered
image exports, internal prompts/evidence/logs, device trails, secrets, protected source/signed URLs
and other owners' data. A failed category is not an empty category; missing content cannot produce
a falsely complete package. New generation captures fresh data; download retry reuses valid bytes.
Retention/expiry removes export snapshots/artifacts, not source records. Eligibility is checked on
capture, publication and download; ordinary logout does not cancel the task. The full account-delete
lifecycle remains Story 7.5, not an extra prerequisite for this vertical slice.

## Account Deletion (Approved Story 7.5 Target)

- Durable owner lifecycle/deletion epoch fences ordinary sessions, new session issue, reads/writes,
  SSE/artifact access and final worker publication. Test headers/in-memory session loss are not
  production revocation; a fixed phone-derived id cannot reactivate a deleted account.
- `AccountDeletionTask(id, ownerRef, lifecycleVersion, confirmationRef, idempotencyKey,
  policyVersion, status, currentAttempt, checkpoints, createdAt, onlineCleanupCompletedAt?)` and
  minimal `DeletionCleanupStep(taskId, storeClass, opaqueHandles, disposition, evidenceRef?,
  safeFailure?, retryState)` persist acceptance, inventory and incomplete work before owner cascades.
- Prepare a narrowly scoped status receipt before destructive commit; store only protected proof
  hashes and bounded metadata. Receipt reads do not authorize cleanup writes or ordinary account
  access. Retry grants require separate limited verification. Recovery must survive loss of the
  acceptance response and normal-session revocation without issuing a new active account.
- A transaction binds lifecycle stop, session revocation, task and durable dispatch intent;
  retryable outbox publication prevents queue failure from losing cleanup. Workers quiesce/fence
  old jobs and record late temporary objects before bounded, idempotent cleanup of all owned history.
- Shared ACL/ref removal plus reference-safe GC protects other owners, including concurrent imports.
  No remaining private annotation/evidence may be promoted to a public pool because of deletion.
- Versioned retention dispositions distinguish verified online erasure/anonymization from isolated
  backups/minimal justified records; unknown cleanup is not complete. Receipts/tombstones themselves
  have explicit minimal retention and restricted access. Restore replays deletion state before
  opening service; later explicit registration uses a fresh owner identity with no former content.

## Feedback (Approved Story 7.6 Target)

- `FeedbackSubmission(id, ownerId, idempotencyKey, payloadHash, text, attachmentRef?,
  optedInDiagnostics?, schemaVersion, policyVersion, receivedAt)` is a private first-party record.
  Same owner/key/payload resolves to one receipt; changed payload cannot overwrite accepted data.
  Text plus ready attachment reference commit atomically before received status is returned.
- A purpose/owner/draft-bound upload ticket and temporary-object record bind allowed raster type,
  byte/pixel policy, expiry and final verification. Remove EXIF/location metadata, reject foreign
  object ids/remote URLs and fence final binding against account deletion. Receipt identity is not
  authorization. Normal accounts read only their own; maintainer retrieval needs server role checks.
- Local draft/request recovery is owner-bound and TTL-limited, with no auth tokens. Unavailable
  selected file bytes require reselection; unresolved selected attachments cannot be silently omitted.
  Receipt verification has bounded waits and is not a new submit command.
- 7.6 registers report text and safe attachment indexes with 7.4 export, excluding screenshot bytes,
  and registers reports/temporary/final objects with 7.5 deletion. Before 7.6 exists, those stories
  remain independently complete; they do not require a future feedback table. No claim is made to
  capture or delete Tencent-only posts from opening its website.

## Meals, Checklist and Detail

- `MealSlot(id, planRevisionId, dayIndex, mealType, mode=fixed_anchor|choice_pool|undecided,
  startAt?, primaryPoiId?, evidenceState)`.
- `MealOption(mealSlotId, poiId, ordinal, source, evidence, validatedAt)`; primary plus up to two backups.
- `TripChecklist(id, userId, targetKind=standalone_plan|trip, targetId, revision)`;
  one stable owner/target binding shared across its dates and linked city Plans.
- `TripChecklistItem(id, checklistId, localDate?, planScopeId?,
  category=must_buy|along_route|return_task|note, text, state=open|done|deleted,
  source=user|ai|evidence, provenance?, revision)`; edits and completion use independent checklist
  versions, not PlanRevision/TripRevision or schedule undo. Invalidated date/scope references retain
  the user's text for explicit reassignment rather than following a changed day index.
- Checklist AI suggestions bind input and plan/checklist context versions before confirmation.
  Generated candidates are not saved checklist items; user-confirmed selection creates items with
  provenance, and duplicates cannot silently overwrite existing text or completion.
- Story 6.5 reuses the existing checklist text and revision contract for free-form shopping notes
  with client-side label insertion. Placeholder text is not data and optional labels do not create
  `targetAttributes` or infer values. Structured product attributes, `linkedPoiIds`/multi-store
  relations and shopping scheduling are deferred. Checklist return-task schedule links/conversion
  are also explicitly deferred; return records remain independent checklist items. Existing
  transport/stay/luggage constraints and revisions continue under their prior contracts.
- `SlotDetail(slotId, fillRunId, generatedLines, citations, qualityAudit, promptVersion, revision)`.
- `SlotOverride(slotId, ownerId, baseDetailRevision, lineOperations, explicitEmptyFields,
  suppressedLineRefs, revision)`; each operation targets one `do|prepare|notice` line and records
  add/replace/delete plus the source line reference when applicable. User text and suppression are
  versioned separately from PlanRevision, never inherit AI citations and have precedence during
  later fill composition. There is no restore-AI state transition.

Location context is short-lived request data, not a required durable entity. If debugging storage
is approved later, it must be coarse, expiring and privacy-reviewed.

## Index and Integrity Requirements

- GiST for canonical POI/business-area geography when PostGIS is enabled.
- Unique owner URL key, ordered segment uniqueness, membership composite keys and command
  idempotency keys.
- Candidate writes are owner-scoped and revisioned; a landmark proxy must resolve to the candidate
  Plan city. Clearing the proxy returns the candidate to `unresolved` and invalidates route facts.
- Foreign keys prevent cross-owner Trip/Plan attachment; service guards remain mandatory.
- Revision publication and current-pointer update occur in one database transaction.

## Native Host State (Approved 2026-09-19)

App 不新增同义 User/Session 权威。必要原生元数据不成为身份或所有权证明；升级/重新安装/安全存储残留不得复活撤销凭据或停用账号。设备本地短时草稿/文件和服务端持久事实分开，账号清理覆盖 App 缓存但不承诺远程擦除外部副本。

---

## Source: `docs/architecture/planner-orchestration-v2.md`

# Planner Orchestration v2

Status: v0.6 target; supersedes `planner-autoplace-v1.md` as product architecture.

## Single Visible Planning Run

S5 creates one PlanningJob from an immutable input snapshot containing time boundaries, stays,
luggage, place intents, pace, optional additional constraints, evidence-derived interest signals
and any linked-trip transfer constraints. The client enters one timeline shell and follows that job
to a current result or explicit failure.

Internal attempts may use a high-quality provider, deterministic heuristics, AnchorPool or a
lower-cost provider. They are implementation strategies, not user-selectable plan versions.

## Pipeline

1. **Snapshot:** authorize owner and freeze input revision.
2. **Context:** load verified POIs, evidence, hours, authoritative route facts, reliable-horizon
   weather or seasonal fallback, city data and source/confidence-bearing interest signals.
3. **Constraints:** freeze exact/window boundaries, stays, transfer handoffs, reservations and
   evidence-derived dawn/sunset/night windows. Inferred reservation/ticket evidence remains a
   warning or acquisition requirement; only confirmed facts become immutable locks.
4. **Candidates:** required first; along_route second; unselected imported and AnchorPool/Top-50
   candidates last. Keep source and explanation.
5. **Arrange:** produce a complete schedule over every usable day, respecting city segment bounds.
6. **Validate:** run structural and derived feasibility. Unsafe required items become explicit
   unresolved items rather than silently disappearing.
7. **Persist:** transactionally create PlanRevision(s), validation state and optional TripRevision.
8. **Publish:** fence by PlanningJob generation and current input revision, then emit done.

AI placement may align to 15-minute boundaries, but persisted/user-edited time supports minutes.
L2 is context and clustering, not a fixed 2h/4h user slot.

When no reliable candidate resolves a needed intent, MVP candidate expansion is ordered and
observable: owner's already-imported verified inspirations, AnchorPool/versioned city Top-50, then
AMap nearby search. High-confidence candidates that pass constraints may be arranged; uncertain
results remain in the S7 candidate area and do not pause PlanningJob. If the pool remains
insufficient, publish explicit free time. Users may add concrete Xiaohongshu URLs through the
existing import entry. Keyword search is Post-MVP and requires a separately designed search
provider, login/Cookie/captcha ownership, compliance, result selection and URL-to-ingest handoff.

## Post-plan Search and Manual Candidate Location

Post-plan text search is separate from PlanningJob execution. An exact AMap result may be saved as a
CanonicalPOI-backed candidate. If search has no accurate result, the user may save the target name
with a same-city verified nearby landmark as `landmark_proxy`. Route/distance previews resolve the
landmark address and coordinates as the endpoint and must report the estimate as approximate.

The target and landmark identities remain separate. The target cannot inherit the landmark's exact
address, hours, rating, price, phone, booking state or other provider facts. Without a usable
landmark the candidate remains `unresolved` and no route estimate is emitted. Epic 2 candidate save
does not restart planning or mutate the current revision; Epic 3 owns explicit placement,
validation, revision publication and undo.

Post-MVP platform cold-start acquisition is separate from this request path. An Epic 8 worker may
observe persistently missing, stale or insufficient AnchorPool buckets, generate bounded contextual
queries, and use an isolated operator-managed XHS search provider. Selected material still passes
through detail/media acquisition, multimodal extraction, AMap verification, CanonicalPOI dedupe and
the shared-admission policy before an atomic AnchorPool snapshot is published. Browser sessions,
cookies and challenges never use an end-user session; acquisition failure cannot pause or fail a
user PlanningJob.

## Priority and Constraints

1. ownership/trip/date integrity;
2. frozen ticket/reservation and exact transfer boundaries;
3. opening hours and evidence-derived hard time windows;
4. required intent subject to feasibility;
5. stays, luggage and near-hotel soft preferences;
6. along_route when it improves route fit;
7. diversity, load, popularity and Agent completion candidates.

Interest signals are soft ranking evidence only. User additional constraints, required intent,
confirmed boundaries and pace have precedence. Route facts with unknown/stale status remain nullable;
the client and LLM cannot manufacture duration. Weather affects planning only inside a reliable
forecast horizon; seasonal context cannot be phrased as a day-specific forecast.

No candidate may cross a TransferLeg handoff into another segment's available interval. A linked
trip is published only when all transfer and segment revisions form one valid TripRevision.
For a DayExcursion, the host Planner may use only time before the outbound handoff and after the
return handoff; the child single-city Planner may use only the closed interval between those legs.
Both transfer facts, the child PlanRevision and the unchanged host Stay/luggage references must
join the same TripRevision. Missing or provisional return facts block planning/publication rather
than being inferred from distance.

## Attempt Fencing and Fallback

- Every attempt has `(planningJobId, generation, inputRevision)`.
- Late output cannot publish after a newer attempt, user mutation or job cancellation.
- Internal fallback emits a generic factual event and continues the same job.
- If no safe complete result exists, persist honest unresolved items or fail with a retry/change-input
  action; never manufacture POIs, travel times, tickets or opening facts.

## S8 Day-Excursion Addition Scope (Approved CE-02)

Adding a DayExcursion to an already-published itinerary may replan only the affected host date
and the child Plan. Reuse all other host dates/cities and unaffected confirmed slots exactly.
Displaced non-frozen activities that do not fit stay as explained unresolved/candidates with
required/user-edit/provenance intact. Do not move them to another date; frozen conflicts block
publication. All allowed changes remain previewed and explicitly confirmed. Story 4.7's explicit
date-change operation retains its separately approved old/new-host-date scope; it is not an
implicit scope expansion of the 4.6 addition command.

## Validation and Editing

Initial publish requires validation. Later user/AI commands create a new revision, then Validator
runs incrementally. Structural invalidity is rejected before write; derived feasibility may create
a conflict-marked revision with typed repair suggestions. Applying repair is another command and is
undoable under the MVP global history policy.

Validation also computes DayLoadEstimate and Trip-level consecutive-early/high-load/recovery
findings, plus stay/luggage, transfer-buffer, companion/mobility and evidence-backed weather risks.
Walking is a soft range that may be exceeded only with an explanation.
DayExcursion validation additionally rejects overlapping host/child slots, non-same-day or
non-same-timezone legs, a main-chain handoff on the same date, missing return, destination Stay,
nested/multiple excursions and insufficient access/egress buffers.

## Filler Boundary

Filler receives an exact Plan/Trip revision and may only write do/prepare/notice, why, citations,
quality and generated detail metadata. It cannot alter slot date, start, end, order, POI, Stay or
TransferLeg. Before a later fill, Filler receives the minimum protected user lines, explicit-empty
fields and suppression references for that exact slot/detail revision. Server-side composition keeps
user wording first, drops exact or policy-defined near-duplicate AI suggestions and only fills
remaining line capacity; Provider instructions alone are never the preservation boundary. User text
does not inherit generated citations, and no restore-AI command exists.

AI adjustment scope is resolved by active Plan identity. Inside an excursion section it may mutate
only the DayExcursion child Plan; before outbound or after return it may mutate only the host Plan.
Neither scope may alter the two transfer legs or the other Plan through a free-text command.

## Metrics

Track stage P50/P95, first-feasible-plan rate, required placement/unresolved rate, along_route
adoption, fallback, attempt discard, validation conflicts, cost per successful plan and source/quality
coverage, route/weather freshness, load-estimate coverage, VAD/ASR skip savings and candidate-stage
conversion. Do not optimize seed acceptance or HQ adoption as product success metrics.

---

## Source: `docs/architecture/rest-api-spec.md`

# REST API Spec (v0.6 Target Overview)

> `docs/api/openapi.yaml` is the implementation SSOT. Paths below are target capability groups,
> not proof they exist. Each story chooses final paths, updates OpenAPI first and regenerates types.

## Home, Ingest and Imports

Story 1.0 first hardens the existing login/session/owner surface for real identities, durable
multi-device sessions and server-controlled operator grants. Keep current logout separate from
account-ineligible/all-session invalidation. No self account merge/unlink/device center is added;
production never accepts development identity headers or mock OTP/captcha as proof.

- `POST /ingest/xhs { url }` remains one-link-per-job.
- `GET /ingest/{job_id}/events` supports durable monotonic SSE cursor and factual stages/counts/title;
  persisted events survive server restart.
- Owner import list/detail returns source title and parsed POIs; only detail may return original URL.
- Import records expose normalization version; production extraction output carries media sampling,
  VAD/ASR decisions, evidence signals and complete nullable AMap fact fields with observed time.
- Home multi-paste is client fan-out over single-link calls, not a bulk scraping endpoint.

## Manual Place Correction (Story 1.11)

- Restricted desktop operations read a selected existing POI/provider snapshot/current override,
  save a reasoned field-limited draft, check/preview, publish or clear selected override fields.
- Read/write checks use current server identity/capability/scope; publish uses expected effective
  base version and operation id with atomic revision/pointer/audit receipt. Unknown outcome queries
  the same receipt. No arbitrary payload, provider/city/branch reidentification or POI merge.
- Allowed edits are display name/address/same-city coordinates. Return manual/provider provenance
  separately with safe timestamps, not operator private notes or other owner evidence.
- Coordinate input requires its actual coordinate-system/source discriminator. The existing geo
  adapter validates an allowed system, preserves original input and applies versioned normalization;
  the result records input/normalized systems and transform policy. Unknown/unsupported systems
  fail before publication; same-city/branch checks and route endpoints use the normalized version.
- New consumer reads bind the effective fact version; route endpoints/cache keys retain it.
  Existing imports, in-flight work and published plan/export snapshots are not auto-updated.
  Existing user mutations remain the only way to change an already confirmed itinerary.

## Recent Trips and Resume (Story 7.1)

- Owner-scoped recent list/Home summary aggregates existing saved drafts, jobs and Plan/Trip roots
  with bounded pagination, stable recency cursor and no duplicate child/day-excursion entries.
  Main lifecycle and optional pending-change summary are separate response fields derived from
  current persisted facts; lists never synthesize a failed task from client disconnection.
- An authenticated resolve/open capability returns the canonical root, exact current revision,
  approved view/scope fallback and existing draft/job recovery target. Never accept an arbitrary
  redirect URL or resolve identity from city names. A linked root uses one complete TripRevision.
- Minimal resume metadata read/write accepts expected metadata version and ordered session
  sequence plus valid view/scope/date/anchor hints. It is independent of schedule revisions;
  failure does not block opening a plan. Auth and idempotency checks apply to metadata writes.
- The same-owner published plan stays accessible when city/date/transport changes need replanning.
  Only real actionable draft/task refs yield the subordinate entry. Unfinished, queued/running
  and terminal failure are distinct; superseded failure refs cannot contaminate a newer input.
- Unavailable/non-owned targets have the same non-disclosing response. Expired auth requires
  reauthentication; restart/deep links reuse existing tasks without a new billable operation.
  Final endpoint naming belongs to OpenAPI-first implementation, not this capability overview.

## Planning Inputs

- Draft contract stores ordered city chain, overall/city dates, daily start, TripBoundary modes,
  per-night Stay/breakfast/luggage, place intents, pace, optional additional constraints and
  evidence-derived interest signals.
- Boundary discriminated union: `exact | window_2h | ai_decide`; exact provider results include
  provider/source, observed-at, valid-until, confidence and confirmed/provisional/stale status.
- Place intent discriminated union: `required | along_route | unselected`.
- AMap search supports hotel/terminal/POI matching with typed unavailable/ambiguous results.
- Flight/rail lookup is a separate provider-neutral capability and returns source/status/freshness;
  no-match preserves manual entry. `ai_decide` returns usable time only, never fabricated service data.

## Planning Jobs and Plans

- Start creates one PlanningJob from an expected input revision and idempotency key.
- Job detail/SSE returns factual stage, reconnect cursor, generic fallback, result revision or typed failure.
- Plan/Trip result includes unresolved required items, candidates, nullable adjacent commute and
  validation state, DayLoadEstimate and authoritative RouteFact status. Candidate responses retain
  intent/source/expansion stage. No public HQ start/status/adopt workflow is used by the MVP client.
- Post-plan AMap keyword search is city-scoped and text-only Top-5. Saving an exact result creates a
  candidate linked to its CanonicalPOI; it does not mutate PlaceIntent or a PlanRevision.
- Manual candidate input is a discriminated location contract: `landmark_proxy` accepts the target
  display name plus a same-city verified landmark POI id, while `unresolved` accepts only the target
  name. The server resolves and snapshots landmark address/coordinates; raw client coordinates do
  not silently become verified facts.
- Candidate responses expose `canonical | landmark_proxy | unresolved`; proxy responses include the
  landmark display/address and an approximate route state. They never return landmark business
  facts as target facts. Candidate create/update uses owner guard, expected revision and idempotency.

## Editing, Validation and Undo

- Slot commands support replace, move to any valid trip day, minute-precise retime and delete.
- Every command carries expected revision/idempotency; typed unavailable target is not a 500.
- Plan-global undo operates on command token; recent eligible undo is not day-scoped.
- Validation reads exact revision; fix preview returns typed operations and apply creates a revision.
- Structural errors reject command; derived conflicts may return a conflict-marked new revision.
- Candidate placement/replacement is an explicit Epic 3 command. A `landmark_proxy` endpoint remains
  visibly approximate through preview, validation and undo; an unresolved candidate cannot be placed.
- AI adjustment preview accepts explicit/inferred scope and usually returns two safe directions
  before a typed diff; one safe direction remains one, and none uses the approved no-safe recovery.
  Apply never accepts free-form persistence JSON or fabricates a second direction.

## Minimum Result Host and Detail Return (IR-09)

Story 5.1 owns authenticated exact-revision base itinerary/available check/run reads for the minimum
S10 host plus S9 source identity/attribution/safe-summary reads and source-unavailable states.
S7-to-S10 entry, S9 return and deep-link parent resolution are read-only and use current owner/
aggregate/revision/date/scope/anchor validation. 5.2 extends the same reads for full checks and
CitationSheet. Do not require future 5.2 endpoints merely to enter/return/read a source in 5.1, and
do not create a second ValidationRun or business state from navigation. Final paths remain OpenAPI-first.

## Linked Trip

- Trip aggregate APIs manage ordered segments, full TransferLegRevision facts, StayRevision and
  LuggageTransitionRevision; provisional AI transfers require confirmation before publication.
- Publication binds explicit segment Plan revisions and transfer/stay/luggage revisions atomically.
- Cross-city intent first creates a pending expansion; it does not mutate the current Plan timeline.
- The cross-city decision command accepts an explicit `add_segment | day_excursion | cancel` choice;
  it never infers an overnight city from a round-trip route or vice versa.
- DayExcursion draft commands bind `hostSegmentId + localDate + destinationCityId + intent`, then
  store outbound and return transport inputs independently. Draft responses expose completeness and
  typed blocking reasons; a missing/provisional return cannot be represented as confirmed.
- DayExcursion plan/publish binds expected TripRevision, child PlanRevision and both transfer
  revisions in one idempotent transaction. Read models merge host-before, outbound, child, return
  and host-after items into one day while preserving their Plan/transfer identities.
- Date/transport/delete operations clone a recoverable Trip draft or create an atomic successor
  TripRevision as required; ordinary child Plan commands cannot mutate either transfer or host Plan.

## Meals, Location and Checklist

- MealSlot detail/change supports fixed, choice pool and undecided modes with up to two alternatives.
- Recall accepts ephemeral foreground location context/freshness and returns provenance/degradation.
- App-open/foreground-resume recall follows the same contract as meal-entry/manual refresh: current
  permission and meal scope are required, same-activation requests are coalesced, and responses are
  bound to owner/session/request/revision/MealSlot/date/scope. No open-Sheet prerequisite for an
  app-open read, but no automatic navigation, draft overwrite or plan mutation. Revocation,
  background and scope changes invalidate client consumption; raw fixes remain request-local.
- Story 6.2 recall is read-only and bound to owner, current revision, MealSlot, date and active
  host/child Plan. It accepts one foreground fix with observed time, accuracy and coordinate source;
  invalid/no fix uses same-scope previous/next planned POIs. MVP has no check-in/completed-visit
  subsystem after the 7.2 deferral; do not query one or infer visits from elapsed time. With no anchors,
  return the saved pool/manual-add path. A selected result enters the existing meal preview/confirm
  command, and raw user coordinates never enter persisted revisions or history.
- Commercial-area food query is owner-scoped and returns only imported verified POIs.
- Story 6.3 binds that read to the current host slot/Plan city and valid shared BusinessArea
  membership on both POIs. It deduplicates by canonical branch identity, counts only accessible
  owner records and invalidates private results on import ACL/membership changes. Empty/hidden and
  failed/retry are distinct; source drill-in reauthorizes access. It does not acquire live location
  or mutate Plan/MealSlot, and preserves canonical area data separately from private evidence.
- Checklist list/command supports categories, direct user text and confirmed AI suggestion
  provenance. Product attributes/multi-store matching are deferred; optional labels in shopping
  text do not add new API fields or a store/search contract.
- Story 6.4 first delivers owner-scoped list/create/edit/delete/complete/reopen for a stable
  standalone Plan or Trip checklist, including general `note` records and optional local date/scope.
  Writes require expected checklist/item version and idempotency; they do not advance schedule
  revisions. Empty direct-add opens an editor without a write; only valid user text can be saved.
  AI suggestions bind their input and minimal owner plan/checklist context, remain editable drafts
  until explicit selection/confirmation, and cannot overwrite existing records. Related context
  changes require recheck. Story 6.5 reuses this text contract for lightweight shopping capture and
  local label insertion without requiring shopping dates/stores. Store association, shopping search
  and automatic placement are deferred. Checklist return-task-to-schedule conversion is also
  deferred: no reserve-time endpoint or schedule mutation is introduced by checklist commands.
  Existing transport/stay/luggage planning and validation still own their necessary buffers.
- Weather context returns forecast/seasonal kind, source, observed/valid time and quality; stale or
  missing context is a typed degraded state, not an empty successful forecast.

## Detail and Export

- Detail enrichment binds exact current revision and cannot return schedule mutations.
- ResultSheet always returns the exact current base itinerary plus revision-bound validation and
  detail-completeness summaries. Hard conflicts remain readable but gate detail fill and export.
- Slot content returns composed `do|prepare|notice` lines with generated/user provenance and
  citations attached only to the generated facts they support. Internal quality/freshness audit
  fields are not exposed as ordinary UI status labels.
- Slot-detail edit commands carry owner, idempotency key, expected detail/content revision and
  per-line add/replace/delete or optional-field explicit-empty operations. They create a new content
  revision without mutating PlanRevision or entering plan-global undo. No DELETE/reset endpoint
  restores AI content; later fill must honor protected user lines and suppression state.
- Image export accepts include-details, width and an exact Trip/Plan revision. The server derives an
  ordered city-unit manifest: one standalone Plan image, or one image per main TripSegment and
  DayExcursion child Plan. Clients cannot submit day slices, merge scope identities or reorder units.
  Preview and generation reuse that revision's current ValidationRun; hard conflict, invalid transfer
  or incomplete DayExcursion/Trip references return a typed gate response, while soft warnings remain
  visible and allow continuation. The durable response resolves to private WebP artifacts by default
  and JPEG only as compatibility/size fallback. Legacy `/export/png` naming and `slice_by_day` may be
  accepted only as migration inputs and must not imply a PNG or per-day public output contract.
- The Web/PWA whole-trip download command returns one owner-authorized logical delivery batch. A
  standalone Plan may reuse its city artifact; a linked Trip creates or reuses ordered
  `trip_long_part` artifacts bound to the same ExportJob manifest checksum, revision, theme and
  `TripLongLayoutPolicy`. Normal output is one `1/1` file. When the tested limit would be crossed,
  the server closes the current part at the previous main-city boundary and starts the next complete
  city section in `2/N`, `3/N`, etc. Each section embeds its DayExcursions at their host dates. The
  server renders sections and transfer boundaries in true chronology rather than concatenating scope
  files. ZIP and city/day-internal splitting are
  forbidden; if one indivisible city still exceeds both WebP/JPEG limits, return a typed failure while
  preserving city-file access.
- A batch-download response exposes ordered part metadata before the user acts. Directory-capable
  clients verify per-part write/close completion after one grant. Other browsers use controlled
  download requests and display `已开始下载，请确认` once handed off without a known rejection;
  device-save results stay unknown. Report observable cancel/block/failure and confirmed partial
  outcomes separately. Unknown parts retry only on explicit user action with duplicate risk. Reuse
  the same artifact set, without rerendering or new product charges; HTTP success is not a save receipt.
- System share requests expose the ordered city artifacts only after capability/ownership checks;
  signed object URLs are never passed directly to the operating-system Share Sheet.

## Compatibility and Security

- Approved 7.6 extends feedback link discovery with actual safe destination/capability, private
  owner-bound upload preparation/finalization, immutable idempotent submission and protected receipt
  lookup. Missing configuration never yields a fake executable product id. No Nomad identity/token
  or undocumented custom parameters are sent upstream. First-party success requires real stored
  text and validated attachment reference; mailto/window-open/iframe events cannot satisfy it.
  Changed payload with a reused key is a conflict, and unknown outcomes only query the original
  request before permitted retry. Maintainer access uses least-privilege server authorization,
  not a client role header; deletion eligibility is rechecked at upload/final save.
  First-party report/attachment handlers join prior export/deletion registries in 7.6 itself;
  this does not add a forward dependency to 7.4/7.5 or silently expose third-party-only reports.

- Approved 7.5 requires real identity/recent authentication, owner/action-bound expiring confirmation,
  idempotency, expected lifecycle version and CSRF/origin checks on destructive cookie-auth writes.
  Prepare a restricted status receipt before final acceptance; after all ordinary sessions are
  revoked it may read only this request's safe progress/retention disposition. No task id/header
  fallback/query token authorization. A write retry needs independently verified limited scope.
  Accepted is distinct from verified cleanup and read-unknown; loss of response recovers the same
  request. Re-auth while deleting cannot create ordinary sessions or implicitly register a new user.
  Source contracts do not authorize actual deletion during planning; update OpenAPI only in the
  owning implementation story and verify the real destructive path before enabling it.

- Approved 7.4 extends the existing account export entry into explicit idempotent request,
  owner-scoped durable task/status recovery, technical retry/new-generation distinction and
  authenticated ZIP download. It does not reuse the image ExportJob wire contract. Return actual
  snapshotAt/generatedAt/expiresAt, file size and safe errors, not public/signed storage URLs.
  Every download rechecks session/owner/account eligibility/ready/expiry through protected delivery;
  knowing a task id or link never grants access. Use no-store responses and safe filenames.
  Account-copy JSON is an explicit allowlist, not Prisma serialization or credential/source dump.
  Status-read errors never overwrite durable task truth; submit/queue acceptance is not completion.

- User-directed Settings scope (7.3): expose only safe account information and actual available
  destinations/recovery actions, not user quota counters, limits, balances, reset windows or a
  usage-summary endpoint. Internal guard/accounting/telemetry remains intact. Actual job progress
  is served by existing job APIs, not a Settings dashboard; destination auth is always rechecked.
- Approved 7.3 reuses authenticated account facts and current-session logout/revocation. Logout
  clears the current cookie but is not account deletion, all-session revocation or job cancellation.
  Opening Settings never triggers account export/delete. Failed/unknown capability reads cannot
  default to executable, and historical key data is not deleted by removing BYOK UI.

- Story 7.2 check-in is out of MVP. Legacy `/plan/slots/{slot_id}/status` schema presence is not
  authorization or proof of a working visit service; no new status API, visit migration or owner
  photo access is introduced by this scope decision. Future FR40.1 requires separate contracts.

- Existing BYOK and HQ compatibility routes may remain temporarily but are absent from MVP UX.
- Owner guards apply before resource fetch; original source URLs and exact location are minimized.
- Error schema carries stable code, retriable flag, correlation id and safe user message.

## App Transport and File Delivery (Approved 2026-09-19)

Native Session/Transport 必须验证 /me、写 API、SSE、下载和退出/撤权；本地宿主来源与 HTTPS API 分开，Web cookie/CSRF 不放宽。5.4 的受保护文件获取进入 App 隔离临时区，5.5 的相册/分享复用同一 manifest 与版本化 TripLongLayoutPolicy。Web 下载未知语义保持；系统不得接收签名 URL 或凭据。

---

## Source: `docs/architecture/observability.md`

# Observability and Analytics

Approved Story 8.1 target (2026-09-07), not deployment evidence. Reuse Sentry for application
errors and selected application spans, Langfuse for explicit safe AI observations, and bounded
structured logs. Evaluations, central routing/budgets, Telegram and overview belong to 8.2-8.6.

## Instrumentation Ownership

- Sentry owns the one global OTel provider; Langfuse uses an explicitly isolated provider, not
  a second global registration. Bootstrap API/worker ESM entry points once, before instrumented imports.
- Correlate tools by trusted opaque correlation/job/attempt references. Their OTel IDs and parent
  trees need not match; independent bounded sampling must not be presented as complete retention.
- Assign one instrumentor per HTTP/framework/AI boundary. Only reviewed AI observations go to
  Langfuse, with independently checked Sentry/OTLP export payloads; no blanket export-all setting.
- Keep browser error capture and private release-matched source maps; no Replay, profiles, form,
  request/response/SQL values, full prompts, attachments or raw console capture in this scope.
- Pin and test actual SDK/backend/Node/Fastify/React versions. SDK presence, no-op initialization
  or the conceptual Walkthrough R1 cannot prove configured tools or successful querying.

## Correlation Model

- `session_id`, pseudonymous `user_id`, `event_id`, `prev_event_id`, `seq`, timestamp.
- `ingest_job_id`, `planning_job_id`, `attempt_id`, `fill_job_id`, `export_job_id` as applicable.
- `trip_id`, `trip_revision_id`, `plan_id`, `plan_revision_id` as applicable.
- `trace_id`, `span_id`, deployment/version and feature configuration snapshot id.

`journey_id` may remain as a compatibility correlation id, but S0-S11 stage and Trip/Plan revisions
are the current product semantics. `hq_job_id` is historical and not a funnel dimension.

These are permitted correlation concepts, not unrestricted payload fields. Use pseudonymous
session references, never authentication session IDs. Validate untrusted trace headers/lengths;
only service-authoritative job/owner relationships attach to them. IDs do not authorize reads,
force sampling or become metric labels. Keep outbound propagation destination-allowlisted.
Async attempts and SSE reconnects use links/opaque references, not an indefinitely open span.

## Event Envelope

```json
{
  "event_id": "uuid",
  "seq": 123,
  "timestamp_ms": 1786464000000,
  "session_id": "opaque",
  "stage": "S6",
  "trip_id": "opaque?",
  "plan_id": "opaque?",
  "revision_id": "opaque?",
  "job_id": "opaque?",
  "trace_id": "opaque"
}
```

## Product Funnels

1. Home classified/imported -> Time -> Accommodation -> Picker -> Review -> Planning accepted ->
   plan hydrated -> first useful interaction -> detail -> ResultSheet -> export.
2. Import job created -> durable stages -> record stored -> result presented -> record opened.
3. Timeline mutation -> validation -> conflict shown -> fix preview -> fix applied/abandoned -> undo.
4. Cross-city confirm -> time/stay completion -> transfer proposal/confirm -> Trip publish.

## Metrics

IR-08 ownership is explicit in `implementation-prerequisites-2026-09-15.md`: METRICS-01 provides
early per-capability workload/versions, stage start/end, failure/coverage denominators and local
baseline reports; METRICS-02 is the 8.1 aggregation and evidence-backed production-target decision;
METRICS-03 is 8.2's per-rule complete-result/human-review contract. Publishing early capabilities
requires their applicable target decision, not waiting for the entire operator UI to exist.
Do not average P95 or omit failed/unfinished requests; motion duration is not AI completion latency.

- Stage/job P50/P95 and retry/failure/reconnect rates.
- Ingest frame counts/sampling policy, VAD speech/BGM/silence outcome, ASR skip/cost savings,
  multimodal evidence coverage and AMap nullable-field freshness.
- First feasible plan, required placed/unresolved, along_route adoption and candidate explanation.
- Candidate expansion stage conversion, InterestProfile evidence coverage, DayLoadEstimate coverage,
  consecutive-load findings and route/weather unknown/stale rates.
- Post-plan search exact/no-result conversion, canonical/landmark-proxy/unresolved candidate counts,
  proxy route availability and rejection reason; never record raw query or manual target text.
- Attempt fallback/discard/fencing, provider cost and cost per successful plan.
- Validation conflicts/fix success/undo; stale revision and ownership rejection.
- Meal pool quality, recall degradation, BusinessArea match and checklist usage.
- Citation coverage/quality/degradation, override retention and export success by derived city-unit type/theme.
- Feedback (7.6): separate open attempts/observable open results from first-party submit/receipt
  outcomes, using only categorical source_page, actual mode and safe error codes. External submit
  outcomes remain unobserved without a verified integration; opener/iframe events cannot increment
  received counters. No body/screenshot/raw URL/identity credentials in telemetry. Optional attached
  diagnostics are distinct from baseline entry-event counting. No new Telegram feedback notifier.

Do not use HQ adoption, seed acceptance or visible Quick completion as current success metrics.

## Logs and Traces

- Structured errors use stable codes and correlation ids.
- Langfuse receives prompt version, provider attempt and explicitly constructed safe summaries.
- Sentry receives stack/context but no Provider secret, token, raw source URL, exact user text,
  unredacted evidence or continuous location history.
- Complete provider input/output capture is excluded from 8.1. Filter both names and nested
  values/events/resources/links, including URLs, error strings and encoded media, before every
  log/SDK/export sink. SDK flags or a single masking callback alone are not proof of redaction.
- Unknown usage, cost, missing spans and dropped telemetry remain unknown/coverage gaps, not zero.
  Attempt outcomes, durable task outcomes and HTTP acceptance are separate. Sampled traces are
  neither the billing ledger nor domain state; do not generate extra work to fill telemetry gaps.

## Access, Retention and Availability

- Operator tools require actual least-privilege project/environment access. No public trace
  links or browser admin credentials; verify required free/paid governance features before deployment.
- Minimize owner-linkable telemetry. Extend the 7.5 inventory with restricted cleanup references,
  actual TTL and verified deletion/anonymization or approved isolation. A hash is not automatically
  anonymous; access expiry/202 is not erasure. Late writers cannot resurrect deleted data.
- Do not include internal traces in the 7.4 account copy. Keep deletion-required references until
  cleanup is proven, without creating an unbounded new private telemetry archive.
- Sampling, event size, queue length, retry, flush and local logging have measured bounds. Drop
  unsafe/excess telemetry with safe loss counters; no unapproved raw-data disk spool.
- Exporter failure never changes Job/Plan, quota accounting, retry decisions or SSE truth. Normal
  shutdown flush is bounded; abrupt exit may lose telemetry. Do not recursively report exporter
  failures through themselves or promise exactly-once delivery.
- Hosting/region/paid plan, resources, retention and connectivity still need explicit implementation
  verification. First-use business safeguards never wait for this operations integration.

## Alerts

Evaluation rule findings are not production incidents and do not automatically trigger Telegram.
The separate evaluation workspace below does not widen any production observability sink.

- Job terminal failure/DLQ growth, SSE reconnect loops, provider breaker open, cost guard trips.
- Plan publication atomicity failure, stale attempt publish attempt, cross-owner access denial spike.
- AMap/BusinessArea/transport/weather degradation, durable ingest-event gaps, initial feasibility
  regression and export failure regression.
- AI/AMap ordinary rate limits and recoverable fallback remain product/metric states. Only terminal
  quota, authentication, billing, all-route-unavailable or sustained-breaker conditions that need
  operator action enter the Telegram notification policy after retry/fallback exhaustion.
- Telegram alerts use durable environment+provider+capability+error fingerprints, aggregation,
  cooldown and recovery notices. Payloads contain only redacted operational fields and correlation
  ids; delivery failure is retried/observed independently and never changes user domain state.

## Terminal Incident Notifications (Approved Story 8.5)

Approved 2026-09-13: Node/PG consumes durable eligible AI/AMap terminal/recovery facts and owns
incident episodes, deduplicated counts, cooldowns and one notification outbox. Sentry/Langfuse
remain safe diagnosis tools; sampled traces, a closed issue, expired heartbeat or missing data do
not establish terminal eligibility or recovery. No required Alertmanager or Bot inbound service.

A thin Node sendMessage adapter has one persistent attempt/retry authority. A successful Telegram
Message receipt is not read/handled proof; response loss preserves unknown delivery and retries
may duplicate. 429 schedules retry_after; permanent auth/target errors need repair. Mute affects
notifications only and continues incident evaluation. Late recovery cannot close a new episode.

Short allowlisted text/links exclude owner/travel content and credentials. Redact Bot token paths
before HTTP instrumentation/log export, not just at the JSON body. Target aliases/secret references,
message IDs and safe receipts are separate from raw response chat objects. Notification errors
never modify committed Job/Plan, cost or retry truth and do not recursively notify via broken
Telegram. Desktop Web supplies its own status/recovery path before 8.6. Real test sends require
explicit target/content confirmation and actual staging receipts, not planning approval.

## Read-only Operations Overview (Approved Story 8.6)

Approved 2026-09-13: a thin existing Node/React desktop Web view combines bounded summaries and
protected native-tool links. Keep authoritative task/degradation facts, sealed 8.2 evaluation,
8.4 ledger, 8.5 incident/delivery and configuration evidence separate from sampled observations.

Each result declares source/definition, authorized environment/capability, requested and covered
window, source as-of/fetch time, sample/extrapolation and truncation/retention state. No common
atomic snapshot is implied. Missing data is not zero or health; estimates are not actual bills,
observations are not logical Jobs, and averaging p95 values is invalid. Native-tool links carry
only supported filters and preserve independent login/permissions.

Fixed read queries use per-source timeouts, limits, request coalescing, permission-scoped caches
and quota-aware refresh. A failed source does not erase usable peers; old results keep their time
and cannot update a new filter/account context. Do not pull private input/output to compute a
summary or use service keys to expand visible scope. No new Grafana/iframe/public snapshots,
widget editor or write/repair authority. Real source/plan/version/access/retention/query tests
and desktop evidence remain implementation gates; approved mockups are not monitoring results.

## Evaluation Workspace

Approved Story 8.2 target (2026-09-08), not implemented evaluation or deployment evidence:

- Keep promptfoo for deterministic CI and the approved full Nomad experiment runner. Use existing
  Langfuse datasets/experiment comparison, manual numeric/categorical/boolean scores, comments,
  review queues, prompt versions and Playground. Do not build a duplicate evaluation/admin platform.
- Production samples may enter a dedicated restricted evaluation intake after removing direct
  personal identifiers. Do not remove hotel POIs, dates, route/time or preferences merely because
  they could indirectly identify someone. Credentials/private access signatures remain excluded;
  private/public business contacts and person/POI names require distinct filtering behavior.
- This evaluation copy is separate from 8.1 production traces. Apply checks before dataset/result
  upload, not only through tracing masks; UI comments and Dataset API paths need their own controls.
  Keep provenance/egress scopes and 7.5 cleanup references, not raw owner IDs in external sample keys.
- Freeze dataset items/schema, prompt content/config, code, rubric and rule-policy hashes in a
  manifest. Labels and Score Config IDs are not immutable definitions. Exact case/variant/repeat
  accounting and full-result pagination, not a vendor page aggregate, determine report coverage.
- Rules explicitly define applicability, tolerance/weight and score/warn/human-review behavior;
  there is no uniform hard-rule quality veto. Any individual blocking policy needs agreement.
  Runtime Planner/Validator and ordinary authorization/version/code tests remain unchanged.
- Separate execution completeness, automatic findings, human progress/verdict and sync state.
  Map a single execution to dataset/run/item/observation/score with idempotent receipts; upload or
  human-score recovery does not rerun inference. New reviews form new sealed evaluation snapshots,
  retaining previous captured human and automatic evidence without overwriting old reports.
- Deterministic CI runs with no model credentials/network and no dependency on Langfuse uptime.
  Authorized live comparisons use bounded experiments and isolated credentials; Playground is
  single-prompt exploration, not full Planner coverage. Full regression uses private CI fixed tasks,
  not a new public webhook. Human review must actually work for Story completion.
- A trusted operator can use the existing workspace now; 8.3 production routes and 8.4 budgets have
  separate controlled operations, and 8.6 later aggregates their entry points. Experiment scores or
  prompt-label edits cannot silently publish production models or change a user's itinerary.
- Verify actual access, including broad Member permissions, unavailable models, sync failures,
  data retention/deletion and real manual score round trips. Exact SDK/hosting/paid choices and live
  calls still require implementation-time authorization; synthetic Workspace R2 is not test proof.

See `docs/ops/analytics.md`, `docs/architecture/testing-strategy.md`, error-code docs and rate-limit
policy for operational implementation. Story 8.2's source contract is in the formal planning epics.

## App Sources (Approved 2026-09-19)

1.0/1.6 完成真实 U-App/U-Link 首次消费，8.1 汇总 Web/Android/iOS 分母和去重。JS/native 错误关联 App version/build/Web bundle，适用 sourcemap/dSYM/混淆映射可定位。原生 SDK 不能与 JS 重复自动采集；拒绝/撤回、脱敏和后台迟到事件遵循既有边界。

---

## Source: `docs/architecture/testing-strategy.md`

# Testing Strategy

## Test Levels

- **Pure/unit:** URL normalization versions, intent reducers, exact 120-minute windows, stay/luggage
  normalization, move targets, candidate expansion/ranking, exact/proxy/unresolved candidate
  location, BusinessArea reliability, load/weather classification, typed fixes, fencing and privacy redaction.
- **Repository/real DB:** owner isolation, idempotency, revision transactions, Trip publication,
  membership query/indexes, undo eligibility and migration rollback/forward.
- **Route/contract:** OpenAPI validation, auth, error schemas, persisted SSE resume/order across
  restart and generated client types.
- **Integration:** XHS/VAD/ASR/frame extraction, AMap, flight/rail lookup, route matrix, weather,
  Provider/COS/queue adapters with deterministic fixtures, timeout, ambiguity and degradation.
- **Mobile component:** all states, icon accessibility, disabled targets, keyboard and state preservation.
- **Browser E2E:** S0-S11 happy path plus focused failure/reconnect/undo/cross-city/meal/export paths.
- **Prompt regression:** promptfoo against Xiamen and adversarial constraint/citation fixtures.

## Story Gates

SP must carry the seven scoped conditions from
`_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md` into the owning work:
OPS-01/02, DB-CHANGE-01, DATA-VECTOR-01 and METRICS-01/02/03. These assign responsibility and
test evidence, not extra product Stories or claims of already-run infrastructure checks.

1. OpenAPI generation and package typecheck.
2. Focused domain/repository/route/mobile tests for the story.
3. `pnpm -r build`.
4. Browser screenshots at mobile and desktop inspection widths for changed UI; no overlap/blank state.
5. Real PostgreSQL migration/integration check for persistence changes.
6. Real external-service staging check when XHS extractor, AMap, flight/rail, route, weather,
   Provider or COS semantics change, with secrets redacted.

## Priority Scenarios

- CE-01 (approved 2026-09-14): actual 1.11 desktop rule CRUD/draft/check/publication, denied roles,
  conflicting bases, unknown receipt recovery, hot-load evidence and stable per-attempt rule use.
- CE-02: adding an excursion changes only its host date/child; other dates compare equal, displaced
  non-frozen required items remain explained candidates and frozen overlaps cannot publish. Check
  4.7 explicit date moves separately so old/new-host-date behavior is not accidentally removed.
- CE-03: test confirmed directory writes separately from ordinary download handoff. Assert exact
  `已开始下载，请确认`, internal unknown-save state, truthful errors and explicit duplicate-aware
  unknown retries; never infer device save from an anchor click or server transfer completion.


- P0: owner isolation, revision/fencing, minute/cross-day editing, immutable Stay/Transfer/Luggage
  Trip atomicity with failure injection, DayExcursion child Plan plus both transfer references,
  initial feasibility, hard-conflict export gate and Filler no-reorder invariant.
- P0: same-day A-B-A renders one host date and no duplicate host segment; missing/stale return,
  overlapping host/child slots, excursion-plus-main-handoff, nested/multiple excursion and
  cross-timezone/overnight inputs remain recoverable drafts or typed rejections without partial publish.
- P0: Picker required/along_route state survives every view and round-trip.
- P1: URL variants/cross-user dedupe, import multi-job/FIFO foreground/background timing and restart
  reconnect, VAD skip/frame policy, partial AMap facts, evidence inferred→confirmed lock transition,
  BusinessArea multi-membership/expiry, location denial/stale fallback, meal shortage/swap and
  checklist multi-store/AI confirmation.
- P1: Provider timeout/fallback remains one user flow and late attempt cannot overwrite edits.
- P1: post-plan Top-5 exact result, no-result manual add, same-city landmark proxy, fact
  non-inheritance, unresolved/no-route, stale candidate revision and cross-owner/cross-city rejection.
- P1: flight/rail no-match/manual fallback and stale/expired schedule facts, AI no-ticket fabrication, route unknown/freshness,
  asymmetric day-excursion transport modes, active host/child AI scope, consecutive-load detection
  and stale forecast/seasonal weather degradation.
- P2: motion, optional content, analytics completeness and secondary settings visuals.
- P1 (7.3): safe account/no-display-identity fallback, deployed/absent/temporarily failing actions,
  no quota or BYOK payload/UI requests, current-session logout success/cancel/failure, rejected
  post-logout reuse, account-switch cache isolation and accepted-job continuity. Viewing Settings
  must never create export/delete/planning work or expose another user's data.
- P1 (7.4): unpack real JSON-in-ZIP to verify owner allowlist, current draft/user-text coverage,
  exact linked revision set, source/credential exclusions and schema/counts/checksums. Exercise
  concurrent edits, repeated submit, pre-seal retry/post-seal restart, old valid artifact, expiry,
  current-session logout versus account ineligibility, download-only retry and no-source-deletion.
  Verify real PostgreSQL/queue/storage lifecycle, auth/no-store delivery, mobile failure/resume and
  absence of new AI/AMap/XHS calls; queue acceptance and mock files do not prove completion.
- P1 (7.5): real identity/confirmation/CSRF, all-device stop across restart, atomic outbox acceptance,
  unknown-submit recovery and restricted receipt/retry scope. Verify full historical inventory,
  shared-reference races, active export/worker late writes, cache/credential/object/trace cleanup,
  online versus retained-backup truth, restore suppression and fresh-owner re-registration.
  Retention/receipt policies and actual deployed-store evidence are completion gates, not fixed
  mockup values; queue acceptance or a single database delete is insufficient.
- P1 (7.6): real configured external destination/runtime versus direct-form fallback; no opener/
  mailto/iframe false success. Verify text/private attachment receipt, metadata stripping, operator
  authorization/retrieval, idempotent duplicate/unknown outcome, account switching/deletion races,
  opt-in diagnostics and export/deletion registry integration. Disabled upload/X removal/ordinary
  submit and no busy bottom actions need screenshots; bounded timeout must stop waiting before
  recovery. Real configured product and PostgreSQL/COS checks cannot be replaced by mocks.
- MVP scope regression (7.2 deferred): no check-in button/service prerequisite or photo access;
  FR48 no-fix recall uses previous/next planned POIs or a static pool without a visit table/query.
  Planning/replanning, current-revision recovery and existing itinerary-image export remain usable.
- P1 (6.2, 2026-09-14 amendment): app-open/foreground-resume with valid historical/new permission,
  revoked/unknown permission, absent meal context, same-activation event dedupe, no unauthorized
  prompt loop, no background/watch/timed fix, Sheet/app-open request separation, late response and
  draft protection. Keep read-only candidates, precise fix cleanup and same-scope plan fallback.
- P1 (5.1/5.2, 2026-09-14 amendment): source-less safe generic content uses an accessible inline
  `建议核对` beside detail text, with no modal/repeated toast/per-item acknowledgment. Source links
  remain truthful; unavailable safe content stays unavailable and schedule/export hard gates remain.
- P1 (7.1): owner recent-list pagination/alias dedupe; independent same-city trips; complete Trip
  revision lookup; S2-S5/S6/S7/S10 restoration across restart; stale/missing scopes; no new AI call,
  charge or schedule version from reopening; durable late resume-write fencing; account switch.
- P1 (7.1): real saved change vs no draft, half-filled input vs actual terminal failure, queued/
  disconnected jobs, old failure superseded by new input, cancelled/discarded/published entry cleanup,
  available original plan during a failed replan, loading vs empty vs error and nonblocking Dock.

- P1 (8.1): actual Sentry/Langfuse query and error/source-map evidence; unique global registration,
  explicitly isolated AI tracing, concurrent scope safety and bounded independent sampling.
  Probe invalid/hostile headers and every SDK/network export with nested private values/URLs/media,
  normal/fallback/terminal tasks, reconnect/worker restart, missing usage, exporter outage/overflow/
  shutdown and owner deletion races. Compare overhead against telemetry-disabled baseline;
  declared SDK versions/no-op/local screenshots alone do not prove deployed integration.

- P1 (8.2, approved 2026-09-08): execute actual deterministic runner and full expected-result
  accounting; exercise score/warn/review policies without a blanket hard-rule veto, partial runs,
  NaN/duplicate/missing cells, altered rubric/schema/cache, untrusted PR config and unknown costs.
  Probe direct-ID filtering and POI/contact false positives while retaining indirect travel context.
  Verify the approved restricted Langfuse sample/result/manual-score/review-snapshot chain,
  paginated full-result comparison, denied access, interrupted upload and idempotent retry without
  repeated inference. Verify eval-copy/score/comment cleanup and no production telemetry expansion.
  Deterministic offline success alone cannot satisfy human-review or authorized live-lane evidence.

- P1 (8.3, approved 2026-09-08): exact route/connection capability validation, no secret/URL
  overrides, draft/check invalidation, expected-version publication plus audit atomicity, duplicate
  and unknown operations, accepted/queued/restarted task snapshots and exact instance-use evidence.
  Exercise control-source loss, stale safety lease, no LKG, pause/resume and compatible new-version
  rollback without clearing restrictions. Count all SDK/worker/backup retries and costs; reject partial
  streams/tool duplication and safety-bypass fallback. Verify real PostgreSQL, authorized small
  Provider probes, role/environment isolation and operator browser states, not only static/mock checks.

## Test Data and Privacy

- Approved 18-group presentation regression: keep logical outcomes, typed errors, revisions and
  required confirmations unchanged while testing short module-local states and on-demand detail.
  Exercise soft-only vs hard/mixed, known failure vs unknown receipt vs empty results, baseline
  location vs actual location, partial details, completed stale images vs stale generation previews,
  and counters tied to exact module/version. Verify accessible labels/contrast, retained context,
  no repeated toast/automatic modal/per-item acknowledgment, and necessary source/risk information
  inside exported files. Critical write/delete/production/real-send controls remain enforceable.

- Story 1.0: verify actual login/identity mapping, explicit test-channel isolation, persistent
  qualification and sessions across restart/instances, two-device coexistence, current-only logout,
  all-session ineligibility, cookie/callback protections and first operator grants before real-user use.
- Story 1.11 manual correction: authorized desktop draft/check/publish/clear, permitted-field and
  same-identity checks, provider-refresh/version races, unknown receipt recovery, provenance,
  endpoint-version cache isolation and unchanged old import/in-flight/published plan snapshots.
  Coordinate fixtures include supported-system normalization/version, missing/unknown system,
  out-of-range values and normalized same-city checks; a bare numeric pair cannot publish.
- Story 5.1: with full 5.2 absent, actually traverse S7→minimum S10→S9→same S10 and read a protected
  source summary. Cover no details, hard/soft/unknown checks, partial/failure/stale/deep-link parents,
  invalid anchors and source denial. Navigation creates no new run/revision; 5.2 must preserve this baseline.

- Use synthetic users and owner-crossing probes for every protected resource.
- Xiamen final itinerary is a potential QA input, not blanket authorization to transfer its media or
  private content. Production evaluation samples are also allowed through the dedicated intake below.
- Evaluation intake filters direct identifiers (person names, identity documents, personal contact
  and account identifiers), not indirect-inference combinations. Preserve hotel POIs, dates, routes,
  time and preferences; distinguish person names/contacts from public POI names/business contacts.
- Credentials, tokens and private access signatures remain excluded independently of identity
  filtering. Restricted evaluation copies need provenance, access/egress scope and deletion tracking;
  do not publish them in Git/CI or enable complete production trace capture under Story 8.1.
- Rule-specific evaluation policies replace a blanket hard-rule veto: use explicit applicability,
  tolerances, weights and score/warn/human-review treatment. Any individual blocking rule needs
  separate agreement. Ordinary security/code tests and runtime Planner/Validator contracts remain.
- Separate execution completeness from quality and human-review progress. Human scores/comments
  and experiment annotations are required; freeze rubric definitions and evaluated version snapshots.
  Langfuse adoption and the 24-GWT contract were approved on 2026-09-08, not deployed functionality.
- Time tests pin timezone/clock and cover DST even though MVP linked trips are same-timezone.

## App Test Matrix (Approved 2026-09-19)

各旅行者 UI Story 消费 APP-HOST-01，原业务 GWT 在适用 Web/Android/iOS 运行；覆盖返回/键盘/安全区、权限拒绝/撤回、冷暖启动、挂起/杀进程、owner 切换/撤权和未知写入。9.1 建立构建安装矩阵，1.0 真机登录/SSE/下载，5.5 相册/分享/低内存格式，6.2 单次定位/坐标/无 GMS，9.2 最终 APK/TestFlight 安装升级。浏览器/mock/配置不替代原生实证。


## UI scope quality gates (2026-09-20)

见../ops/ui-validation.md：9.4真实lint/工作台/MSW/a11y，9.5固定浏览器场景/截图与原探针覆盖清单，9.3及后续页面交付自身证据。最低iOS16.4、Android键盘/返回、读屏/大字号、身份变化时Portal遮蔽纳入实际矩阵。当前工具尚未实施，不能把批准文档或旧16.0勾选当通过；数据迁移、PG/SIGKILL/SSE/IDB和真实服务门槛保持。


## Story9.4工具实施进展（2026-09-25）

独立Storybook/MSW工作台、typed ESLint、单Chromium interaction/axe与产品/双端资源隔离已接线；实际命令、cohort、反例、旧探针保留表与证据边界统一见docs/ops/ui-validation.md。Vitest同组由准备候选4.1.9调至安全修复4.1.11，正式决定见story-9-4-execution-decisions-2026-09-25.md。当前不修改9.3共享层、Query/Router或auth/journal/cursor权威；9.4已于2026-09-25通过独立CR及完整CI36129441895，按6344a53与26文件下载产物封存，当前done；详见其ui-delivery.yaml。本增量只描述工具实施，原批准范围/快照不重写。

---

## Source: `docs/architecture/mvp-implementation-checklist.md`

# MVP Correct Course Implementation Checklist

This checklist describes delivery gates, not current completion. Sprint Planning assigns every
item to the story map in `epics.md`.

## Contracts and Data

- [ ] Story 1.0 provides production login, stable owner migration, persistent multi-device sessions and minimal operator authorization before real-user/first-operator access.
- [ ] FR4.2/1.11 manual POI corrections preserve provider snapshots, field provenance, publication receipts and old plan/job facts.

- [ ] OpenAPI models three-state Picker intent, boundary modes and minute edits.
- [ ] Owner import records/source title, normalization version, protected original URL and durable event cursor exist.
- [ ] Production ingest has VAD/ASR, frame policy, evidence state and complete nullable AMap facts.
- [ ] BusinessArea membership has migration, versioned reliability policy and owner-scoped food query.
- [ ] PlanningDraft/StayRevision/breakfast/luggage contracts support S2/S3/S5 optional constraints.
- [ ] InterestSignal, RouteFact, DayLoadEstimate and WeatherContext have source/freshness contracts.
- [ ] PlanCandidate models canonical, landmark-proxy and unresolved location without merging target and landmark facts.
- [ ] PlanningJob/attempt fencing and complete Plan result are versioned.
- [ ] Trip/Segment/DayExcursion/TransferRevision/StayRevision/LuggageRevision/TripRevision aggregate publishes atomically.
- [ ] MealSlot/options, checklist and detail/override contracts are versioned.
- [ ] Generated types are refreshed; no manual edits to generated files.

## Backend

- [ ] Ingest remains single-link per job while multi-job reconnect works.
- [ ] XHS/media/VAD/ASR/AMap adapters pass real staging and stubs are not treated as production proof.
- [ ] Flight/rail lookup, AMap terminal matching, route matrix and manual/unknown fallback are separated.
- [ ] Planner owns full schedule; internal fallback cannot create a public alternate version.
- [ ] CandidateCatalog saves owner-scoped Top-5/manual candidates; landmark route proxies are visibly approximate and do not mutate plans.
- [ ] SlotEditor separates structural rejection from derived validation.
- [ ] Validator returns typed preview/apply fixes and reruns after mutation.
- [ ] Validator covers consecutive load, stay/luggage/transfer, companion and fresh/seasonal weather states.
- [ ] Filler cannot alter schedule fields and preserves user overrides.
- [ ] Location context is foreground/minimized and has explicit fallback.
- [ ] Export binds current revisions and enforces hard-conflict/transfer gates.

## Frontend

- [ ] HomeImportDock queue, `N/X`, title, FIFO ten-second results and records.
- [ ] S2/S3 mobile flows and three boundary modes.
- [ ] Picker overview/L3 intent mapping including along_route in overview.
- [ ] S5 pace, collapsed optional constraints and sole start CTA; S6/S7 one timeline shell.
- [ ] Story 2.2 minute editing, day destinations, nullable commute and global undo.
- [ ] Linked-trip confirm/input/transfer divider/hotel-luggage handoff.
- [ ] Day-excursion choice, date/round-trip draft, one-day merged timeline, child-plan actions and active-plan AI scope.
- [ ] Meal pool/undecided/area-food and checklist rail/add Sheet.
- [ ] Incremental conflict/FixSheet, detail/result and export states.
- [ ] Candidate provenance/four-stage completion, load detail and AI-adjust scope/directions are testable.
- [ ] Post-plan search covers exact, no-result, nearby-landmark and unresolved states; Epic 2 saves candidates only.

## Quality and Operations

- [ ] SP assigns OPS-01/OPS-02, DB-CHANGE-01/DATA-VECTOR-01 and METRICS-01/02/03 from the 2026-09-15 prerequisites to actual execution tasks; corresponding production checks have real evidence before release.
- [ ] 5.1 works without full 5.2: S7 plan entry→minimum S10→S9 with readable sources→original S10 context, no duplicate generation/validation.

- [ ] Owner/idempotency/revision/fencing and real DB tests pass.
- [ ] Landmark-proxy tests cover same-city validation, fact non-inheritance, route invalidation and later placement gating.
- [ ] Day-excursion tests cover both confirmed legs, missing return, host/child interval isolation,
  one-host-tab rendering, atomic publish, owner/revision fencing and global undo.
- [ ] Export tests cover base-without-details, exact Plan/Trip revision, existing ValidationRun gate,
  1080/1242, standalone/main-segment/DayExcursion city-unit manifests, one long artifact per unit,
  theme fallback, WebP/JPEG policy, stale preview, reconnect/fencing, private artifact download,
  one-file normal whole-trip composition with host-date DayExcursions, measured/versioned browser and
  encoder limits, numbered city-boundary parts, one logical batch action, directory/multiple-download
  permission paths, no ZIP/city-internal split, indivisible-city failure, capability-gated sharing and
  no schedule/detail mutation.
- [ ] S0-S11 E2E, reconnect, failure, weak-map and accessibility states pass.
- [ ] Xiamen prompt/export fixtures pass without schedule mutation in Filler.
- [ ] Xiamen ingest fixture verifies VAD/ASR skip, short-video frames, evidence/AMap fields and cost telemetry.
- [ ] Langfuse/Sentry/analytics redaction and stage metrics verified.
- [ ] Rate limit, quota, cost guard, provider fallback and DLQ runbooks verified.
- [ ] `pnpm -F nomad-types run generate` and `pnpm -r build` pass.

## Explicitly Disabled for MVP

- [ ] No BYOK user path, Quick/HQ selection, smart-planning switch or alternate-version adoption.
- [ ] No arbitrary history timeline or automatic 48-hour reminder.
- [ ] No cross-timezone/overnight repeated-city main chain, nested/multi-destination excursion,
  same-day A-B-C-A, arbitrary whole-chain reorder or background location tracking.

## App Delivery Gates (Approved 2026-09-19)

- [ ] 9.1 原生/Web 构建、真实安装、基础宿主与最小权限。
- [ ] 1.0/1.6 真实原生登录、恢复、归因与 Web 回归。
- [ ] 5.4/5.5、6.2、7.x、8.1 的原生业务/隐私/故障证据。
- [ ] 9.2 签名 APK、实际可用 TestFlight、升级/故障恢复和候选版本清单。

这些是目标门槛，实际逐 Story 状态和证据由 sprint-status 维护。


## UI foundation amendment (2026-09-20)

本期已批准shadcn/ui＋Base UI＋Tailwind4、Nomad共享层、Storybook/MSW/真实lint/Playwright，以及分别验收的Query9.6/Router9.7。现行平台与组件、数据、导航边界见app-host.md、ui-foundation.md、frontend-data-navigation.md。保持领域模型、历史done、3.1暂停与当前1.7后停止；安装/浏览器/真机证据分别记录。

---

## Source: `docs/architecture/compatibility.md`

# Compatibility (v0.4 to v0.6)

| Concern | v0.4 baseline | v0.6 target | Migration owner |
| --- | --- | --- | --- |
| Production auth | dev identity/OTP and in-memory session baseline | verified identity, stable owner migration, durable multi-device sessions and scoped operator grants | New 1.0 before real-user/first-operator use; historical 1.1–1.5 unchanged |
| User planning flow | Confirm -> Picker -> partial Skeleton -> AI Fill | S2/S3/S4/S5 -> one full PlanningJob -> editable timeline -> detail enrichment | Epic 2, Epic 3, Epic 5 |
| Planner versions | Quick first, HQ switch/adopt | One current PlanningJob; internal attempts fenced and never silently overwrite edits | Story 2.9 |
| Time | fixed 2h/4h visible slots | AI may align 15m; user edits any valid minute | Story 2.3 and Epic 3 editing |
| Picker intent | `selected_required` only | `required / along_route / unselected`, overview mapping | Story 2.7 |
| Validation | permanent pre-Fill gate | initial validation plus mutation-triggered incremental validation | Story 2.11 and Epic 3 repair |
| Filler | arranges remaining blocks and enriches | enriches only; cannot change date/time/order | Epic 5 detail story |
| Import UI | one foreground link | multiple single-link jobs + independent FIFO presentation queue | Story 1.6 |
| Import ownership | job/inspiration foundation | owner import records and protected original URL | Story 1.8 |
| Import processing | stub multimodal seam and text/ocr/vision diagnostics | real media sampling, VAD/ASR, evidence signals, complete nullable AMap facts | Stories 1.9-1.11 |
| Import resume | in-memory event stream plus job final state | persisted monotonic event cursor across process restart | Story 1.7 |
| Geography | L1/L2/L3 and scalar `business_area` hint | provider POI facts and versioned manual corrections; BusinessArea membership separately normalized | 1.11 POI/correction; 6.3 BusinessArea |
| Multi-city | post-MVP or mixed Plan assumptions | Trip aggregate links single-city Plans with atomic TransferLeg handoff | Epic 4 |
| Accommodation | plan-global luggage / display hotel | per-night Stay, breakfast tri-state and LuggageTransition | Story 2.5, Epic 3 and Epic 4 |
| Preferences/load | wake/start fields and coarse pace | optional constraints, evidence-derived interests, pace soft constraints and DayLoadEstimate | Stories 1.9-1.10, 2.6 and 2.14 |
| Meals | ordinary candidate or fixed block | MealSlot fixed/choice/undecided + owner area recall | Epic 6 |
| Shopping | POI or notes | revisioned checklist text with optional label shortcuts; structured attributes/stores and checklist-to-schedule conversion deferred | Stories 6.4-6.5; existing travel buffers remain in Epics 2-4 |
| Location | generic map usage | foreground permission, freshness, fallback and no tracking | Epic 6 |
| Weather | no current contract | reliable forecast/seasonal context, typed validation and preview-only adjustment | Epic 3 |
| Export | `/export/png` and Plan-oriented rendering | current-revision image export, WebP/JPEG output policy, durable job and hard-conflict gate | Story 5.4 |

Compatibility inputs may be accepted temporarily at API boundaries, but the mobile client must
not expose deprecated Quick/HQ adoption, smart-planning toggle, fixed 2h/4h user edits or BYOK.
Removal requires telemetry and a separately reviewed migration; deprecated input must not select
a different user-visible workflow.

## Capacitor Increment (Approved 2026-09-19)

保留 Web/PWA、现有身份/领域模型与历史 done。9.1 增加双端宿主，业务 Story 在原合同上扩平台，9.2 负责实际分发。任何客户端/API 兼容窗口、升级、凭据与临时状态迁移都需证据；不通过清空旧数据、重建 owner 或无依据的强制降级解决。


## UI foundation increment (Approved 2026-09-20)

平台最低范围依app-host.md；旧iOS16.0–16.3、Firefox114–127和Safari16.0–16.3不再纳入新交付支持声明。保留历史done及旧产物证据，新增组件/读取/路由分别回归。Query不持久化首批私有缓存，Router不把私人原文写入URL；回退不清除业务数据/IDB日志，不改变身份或operation。

---

## Source: `docs/ops/rate-limits.md`

# Rate Limits, Platform Quotas, and Degrade Switches (v1.1)

Updated: 2026-09-13

## Principles

- Platform-managed AI is the MVP path; BYOK does not bypass limits.
- Protect by user, device, IP and workspace, with task-specific global concurrency/cost guards.
- Queue honest excess work; never create a second user-visible planning version.
- Every write/job is idempotent. Retry budget is separate from user product quota where failure is ours.
- Exact thresholds are remotely configurable and validated in staging before production rollout.
- Quotas/usage/balance/reset windows are internal only. The user-approved 7.3 scope exposes
  account and available actions, not a usage dashboard; hiding them never disables enforcement.

## Default Policy Bands

| Capability | Primary dimensions | Default starting policy | Degradation |
| --- | --- | --- | --- |
| OTP | phone + IP + device | 5/hour, 10/day | captcha/cooldown |
| XHS ingest | user + device + workspace | 30 jobs/day, small concurrent job cap | queue, retry later, media-only fallback where safe |
| AMap search/resolve | user + provider quota | 60 searches/hour plus cache | cached result, honest unavailable |
| Initial PlanningJob | user + Trip/workspace | 1 active per user/Trip, 60 starts/day | same-job queue/internal lower-cost fallback |
| Validation/fix | user + Plan | burst-protected, higher non-AI allowance | delayed validation with visible pending state |
| Conversational adjust | user + workspace | 10/hour | direct editing remains available |
| Detail enrichment | user + workspace | 10/hour, 1 active per Trip | partial/retry later; schedule remains usable |
| Meal/location recall | user + foreground session + current meal scope | coalesce same app-open/resume event, short burst cap and AMap cache; no timed/background polling | plan-context fallback/no hint |
| Export | user + workspace | configurable daily job and storage budget | queue/lower-cost encoding/later retry |
| Account export/delete | user + account | low frequency, one active | resumable job |

The import UI may present many single-link jobs, but processing concurrency remains bounded. Its
ten-second FIFO presentation queue is a client UX policy and does not keep compute slots occupied.

## Cost Controls

- Per-task model routing and token/media ceilings.
- Daily user/device/workspace cost bands and global provider spend cap.
- Retry budgets, provider-fallback budget and abnormal-spend circuit breaker.
- User UI exposes only actual available/recovery actions and factual job stages, never remaining
  bands, limits, used counts, reset times, token cost or currency. Do not claim a request is queued
  unless it was actually accepted into a queue. Operator metrics remain internal.
- Operator controls include task kill switch, model route, concurrency, queue depth, max attempts,
  timeout and budget; all changes are audited.

## Idempotency and Concurrency

- Ingest key: owner + normalized URL; duplicate returns the owner's durable record/job result.
- Planning start key: owner + planning draft revision + explicit start nonce.
- Mutation/fix/undo key: owner + expected revision + command idempotency key.
- Fill/export key: exact Trip/Plan revision + scope/options.
- Only one current fenced PlanningAttempt may publish. Queue/retry never overwrites a newer revision.

## SSE and Queue Behavior

- Heartbeat <=10s, idle timeout 30s and resumable last-event cursor.
- Client reconnect backoff starts 1s, then 2s/4s with jitter and a capped background retry policy.
- Queue status, stage and failure are factual. No percentage without durable numerator/denominator.
- 429/503 include safe error code, `Retry-After`, retriable flag and correlation id.

## Degrade Switches

Story 8.3's route publication/pause boundary was approved on 2026-09-08. Route settings below are
logical policy concepts, not multiple writable Unleash flags. PostgreSQL owns one versioned route
release; ordinary flags may only narrow their approved capabilities, not select another model or
override a pause. Accepted/queued jobs keep their snapshot. Every later external attempt still
checks current valid pause/budget authority and shares the existing total retry/deadline envelope.
Control-source failure disallows publication and unverified new-task acceptance; trusted existing
snapshots are usable only while safety authority remains valid. Pause does not revoke a request
already sent. Resume is explicit; rollback creates a new release and clears neither pause nor
breaker state. Actual propagation/freshness limits require tests, not an instant-global-stop claim.
Centralized reservation/settlement and policy editing are approved Story 8.4 targets below;
planning approval does not prove them implemented.

- `maps.list_only`, `maps.optional_overlays`.
- `ingest.max_concurrency`, `ingest.disable_asr`, `ingest.media_only_fallback`.
- `planning.provider_route`, `planning.internal_fallback`, `planning.max_attempts`.
- `meal.location_recall`, `meal.area_food_hint`.
- `detail.provider_route`, `export.queue_only`.

No flag enables public Quick/HQ adoption, smart-planning toggle, BYOK MVP, background location or
cross-timezone linked trips.

## Central Budget Governance (Approved Story 8.4)

Approved 2026-09-13 with 26 GWT, desktop Web operations and the amount-source clarification.
Extend the existing Node/Fastify/Prisma/PG stack with one budget authority; no new gateway or
billing platform, subscriptions or user quota UI. Operator mobile adaptation is not required.

- Draft/check/publish and tariff-registration operations use real environment-scoped authorization,
  immutable versions, expected-current-version and durable audit receipts. Budget and route
  versions are separate; publication/rollback cannot clear usage, 8.3 pause or real breakers.
- Product counts reserve once with logical Job acceptance or the immutable export identity.
  Internal attempts, reconnects, download/share do not consume new product counts; policy-defined
  refunds happen at most once, without deleting actual provider requests or cost.
- Every actual paid attempt obtains sufficient bounded cost reservation atomically across all
  applicable scope/window buckets. Unique identities, short PG transactions and fixed locking
  handle competition and empty-window creation; external HTTP stays outside DB transaction retries.
- Persist dispatch intent and validate current eligibility/fencing/pause/budget plus bounded permit
  freshness before sending. Tightening can stop old unsent reservations; sent requests still settle.
  Requests, active Job concurrency and upstream in-flight concurrency have separate limits. Queueing
  does not occupy an outbound slot, and worker expiry is not proof the upstream stopped.
- Confirmed costs, conservative estimates, unsent reservations and in-flight/unknown holds are
  mutually exclusive. Known facts settle idempotently; only proven-unsent exposure can be released.
  Late responses still settle after business fencing is lost. Real overage is recorded in full.
- Register actual-seller tariffs with currency/unit/model/tier, evidence and effective version.
  Reported usage times price is estimated money; supplier receipts/bills confirm only matching
  coverage. Aggregate bills cannot invent per-call actual amounts. Account balance is independent;
  unsupported price/billing/balance APIs remain unavailable, not zero or simulated.
- Operator budgets are internal limits, not supplier wallet funds. Preview has a data timestamp;
  after publishing, read the current authority and subtract confirmed/estimated/reserved/unknown
  exposure. Do not reuse preview values as current facts or reprice old confirmed charges.
- Late settlements retain original windows; unsent cross-window reservations revalidate atomically.
  Publishing/timezone changes do not create empty free budgets; unresolved risk has cross-window
  protection. Unknown price bounds or budget authority prevent new paid dispatch.
- Minimal protected desktop Web provides policy/tariff/source/usage/reconciliation operations.
  No arbitrary URL fetches or formula scripts. 7.5 cleanup covers new personal links, with necessary
  non-identifying totals separated from personal retention. Telegram/overview remain 8.5/8.6.

Actual provider tariffs/limits, refund rules, thresholds, permit freshness and concurrent/failure
behavior remain implementation gates. Guarantees cover registered traffic and validated upper
bounds, not every charge in a shared supplier account. Existing trip/manual/account/feedback
operations retain their original availability contracts when the AI budget is exhausted.

## Operator Quota and Provider Alerts

- Internal low/quota/degraded states map to honest available/recovery actions without exposing
  quota to users, and do not page an operator. Ordinary 429s, first-attempt timeouts and failures
  with a viable cache/retry/fallback path remain recoverable and must not send Telegram messages.
- The alert evaluator runs only after adapter retry/fallback accounting. Initial terminal classes are
  AI or AMap authentication/billing failure, quota exhaustion that requires administrator action,
  all configured routes unavailable, a sustained open circuit, and repeated terminal job failure
  above a configurable windowed threshold.
- Fingerprint alerts by environment + provider + capability + stable error code. Aggregate counts,
  enforce a configurable cooldown, update first/last seen timestamps and send one recovery notice
  after the condition clears. Process restarts must not reset dedupe/cooldown state.
- Telegram is a server-side notification adapter. Bot token and chat id come only from secret-backed
  configuration; they never enter mobile payloads, source control, analytics or ordinary traces.
- Payloads may include environment, provider/capability, severity, stable code, aggregate count,
  first/last seen and correlation id. They must not include user text, POI/hotel/route details,
  protected URLs, exact owner identifiers, request/response bodies, tokens or Provider secrets.
- Telegram timeout/failure never changes a user Job, Plan, retry budget or circuit decision. Record a
  durable delivery attempt with bounded retry and a visible internal failure metric/alert path.
- Policy thresholds, routing, mute windows and test-message actions are audited. Production rollout
  requires a redacted staging test for trigger, dedupe, cooldown, recovery and Telegram failure.

## Terminal Delivery Operations (Approved Story 8.5)

The 24 GWT and two desktop R1 boards were approved on 2026-09-13. This section is a target,
not evidence of a configured Bot, reachable destination or successful message delivery.

- Consume durable eligible facts after retry/cache/fallback accounting. Ordinary recoverable
  failures, per-user limits, evaluation findings and unknown cost alone do not page operators.
- Stable environment/service-account/capability/error/rule fingerprints have separate episodes;
  event IDs dedupe counts, notification sequence and actual send attempts remain distinct.
- Persist incident transitions with unique outbox records, source cursor/sequence, first/last times,
  policy/target versions and next-send time. A fenced worker rechecks current state before sending.
- One bounded retry controller respects Bot/target rate limits and retry_after across restarts.
  No hidden SDK retry loop or paid broadcasts. Success stores a validated Message receipt,
  not read proof; ambiguous network/receipt-persistence failures keep unknown status and duplicate risk.
- Auth/permission/topic errors stop futile sends. Migration needs controlled target confirmation;
  never drop a topic or switch to an unregistered chat. Repairing delivery does not prove service health.
- Time-limited mute preserves incidents and recovery evaluation; expiry evaluates current state,
  not the historic backlog. Recovery needs current same-scope evidence. Unsent stale alerts are
  canceled, known delivered alerts get one recovery, unknown sends retain that uncertainty in recovery.
- Protected desktop Web exposes policy drafts/check/publication, event and delivery evidence,
  mute/repair/retry, and separately confirmed synthetic TEST sends. Static checks never send.
  No 8.6 dependency, mobile adaptation, inbound Bot commands or remote repair actions.
- Allow only bounded operational fields and protected read-only links. Token-bearing URL paths,
  raw chat IDs/objects, request payloads and private content stay out of all telemetry/log exits.
  Local retention cleanup is distinct from Telegram copies. Independent status reveals delivery
  failure without recursive Telegram or newly added email/SMS channels.

Actual limits, timing, delivery permissions, ordering races, persistence failures, token-sentinel
checks and real staging Message/desktop evidence remain implementation gates. Notification
failure cannot undo business transactions, alter platform cost or consume service retry budgets.

## Overview Query Limits (Approved Story 8.6)

The desktop read-only overview honors each actual source's API/version/plan/history boundaries.
Fixed queries have per-source deadlines, row/window/concurrency bounds and permission-scoped
coalescing/cache. Do not multiply a shared organization API budget by every browser or panel,
rotate keys to bypass rate limits or mark cached results as freshly observed data.

Partial failures/429/stale results are visible without clearing other authorized sources. Bounded
read work must not starve 8.4 budget transactions or 8.5 workers. Refresh does not initiate AI/AMap
business calls, evaluation, ledger repair, incident recovery or test sends. Native tool access is
independent; unavailable capabilities are not silently bought/upgraded or simulated as delivery.

## Privacy and Abuse

- Provider secrets, prompts, raw source URLs and exact location are redacted from limit logs.
- Cross-user content fingerprint reuse cannot merge quotas, ownership or records.
- OTP abuse can trigger captcha. Ingest/planning abuse can reduce queue priority or require cooldown.
- Operators see pseudonymous identifiers, policy decision and cost band, not unnecessary content.

---

## Source: `docs/architecture/ui-foundation.md`

---
status: approved-target
updated: 2026-09-20
scope_revision: ui-foundation-2026-09-20
implementation_status: pending-owning-stories
---

# Nomad共享UI架构决定

批准记录：`_bmad-output/planning-artifacts/ui-foundation-scope-decision-2026-09-20.md`。统一组件基础、减少重复交互实现、采用当前推荐路线；Radix仍受支持，不能作为停止维护的迁移理由。当前React/Vite与领域/认证恢复架构保留。此为批准目标，依赖安装、组件消费和真实设备证据仍由9.3–9.7交付。

## 组件分层与实现边界

分层关系如下：

```text
业务页面 / 领域组件（HomeImportDock、POI、时间轴、账号等）
             ↓
Nomad 组合组件（AppSheet、AppDialog、AsyncState、FormField 等）
             ↓
Nomad 基础组件源码（Button、Input、Tabs、Skeleton 等）
             ↓
Base UI 无样式交互 + Tailwind 4 样式 / 现有品牌 tokens
```

- 首批落在 `apps/mobile/src/ui/{primitives,components,styles}`，由当前 Web/Android/iOS 和同一前端内的运营页面复用。当前没有需要为此新建的第二个独立前端；以后确有第二消费 workspace 时再提取 `packages/ui`，避免现在额外引入构建发布层。
- shadcn 是受控生成/复制的源码起点；Nomad 维护最终源码和公共 API。业务页面只依赖 Nomad 层，不直接散落 Base UI imports，也不批量安装整套生成器 registry。
- 记录 CLI 版本、基础选择、registry 来源与摘要、生成文件和人工调整；逐个组件审阅升级差异。禁止运行浮动 `latest` 自动覆盖当前组件；不添加未经评估的 Radix、Drawer、Toast 等第二交互基础。
- AppSheet 通过现有 typed host 接口注册返回行为。共享组件不持有凭据、不加载服务端环境、不接管 operation/cursor/lease、也不成为第二份业务状态源。
- Tailwind 首次接入明确 CSS cascade/layer 顺序，保留现有 reset，默认不全局启用新的 Preflight。清点未分层的全局 button/input 规则及第三方地图样式；只在受影响消费点迁移、用已批准页面对照验证，不做全库 className/格式化替换。
- 暂时兼容的旧组件必须有清单、负责人、退出条件和对应 Story；同一弹层只由一种焦点/滚动锁/返回管理器控制。

## 版本与升级责任

下表来自本次 npm registry 只读核验，**尚未安装，也不是已验证兼容矩阵**。9.3/9.4/9.5 准备时冻结精确版本及 lockfile；升级后重新跑相应组件与宿主证据。React 19.2.7 / Vite 8.0.16 / 既有 Capacitor 版本保持，工具依赖用满足声明的 WSL Node 22 精确 patch。

| 组 | 候选版本 | 处理 |
| --- | --- | --- |
| shadcn CLI / Base UI | 4.21.0 / 1.8.0 | CLI 基础显式选 Base UI，按组件锁源码来源 |
| Tailwind / Vite 插件 | 4.3.3 / 4.3.3 | 同版本，peer 声明包含 Vite 8；仍需真实 build/browser 验证 |
| Storybook React-Vite / a11y | 10.6.0 同组 | 一致锁版本，开发构建与产品构建隔离 |
| MSW / Storybook addon | 2.15.0 / 3.0.3 | 仅开发测试，拒绝未声明网络外发 |
| Playwright | 1.63.0 | 包与对应浏览器 revision / CI 镜像一起固定 |
| ESLint / typescript-eslint | **9.39.5** / 8.70.0 | 当前最新 ESLint 10.11.0 超出 jsx-a11y 6.10.2 的 peer 范围，故不采用；不用 force 绕过 |
| Hooks / JSX a11y | 7.1.1 / 6.10.2 | 先覆盖实际 Hooks、Promise、类型与基础无障碍问题 |
| Query / Router（已批准独立实施） | 5.103.1 / 1.170.38 | 单独 Story 冻结并验证，不与核心组件一次落地 |
| RHF / resolver（随表单评估） | 7.88.0 / 5.9.1 | resolver 的 Zod peer 要求与当前 3.23.8/3.25.76 多版本需审计；不因接表单自动升级整个后端到 Zod 4 |

准确 engines / peer / 来源见 JSON 证据中的 registry 记录；optional peer 不等于必须一并安装。通用 class 合并、图标或日期依赖仅随实际选中组件核验和锁定，不默认引入未用整包。格式化只沿用一套规则、只作用于新建/确需修改文件；不把格式清理扩为本次产品范围。

## AppSheet与私有Portal

Base UI Dialog 提供可组合的模态/Portal 能力；Nomad 仍负责下面的宿主、身份与领域约束。[Base UI Dialog](https://base-ui.com/react/components/dialog)

1. 一个受控 Portal 容器位于 React provider 与身份遮蔽边界内；App 页面与 portal 同时被遮蔽/卸载，不能只隐藏 root 背景留下私有弹层或 Toast。公开协议另有明确公开边界。
2. 打开时焦点进入正确标题/字段；Tab/Shift+Tab 不逃逸。正常关闭恢复到同身份、仍连接的触发器，否则去安全页面标题。身份丢失不向旧私有控件恢复焦点。
3. 背景不可交互、不可读出，并锁滚动；嵌套只允许原批准流程所需一层上级确认，最上层唯一接收 Escape/返回。关闭、路由切换、React StrictMode、异常和身份撤权都释放 listener/scroll lock。
4. Android 返回先按现有宿主规则处理键盘，再顶层临时层，再页面历史；busy/未提交草稿由业务提供关闭策略。同一事件不得同时触发 Base UI 关闭、旧 handler 和页面后退。
5. 外侧点击、Escape、返回手势、按钮关闭共用受控关闭入口；未经确认的关闭不保存、不提交、不重复启动任务。身份撤权优先安全隐藏，不因正在等待业务关闭回调泄漏内容。
6. 中文键盘、横向空间受限、刘海、手势区及 200% 字号下主要动作可达；安全区每条边只由明确一层消费。文档记录视觉 viewport/键盘事件的共同责任，避免插件与 CSS 重复补偿。
7. 使用原 240–300ms Sheet 动效及 reduced-motion；Home FIFO 只累计真正可见时间，被 Sheet/后台/身份确认遮挡时遵守 1.6/1.7 的现有显示与 ACK 合同。
8. Screen-reader/大字号/焦点/返回等必须有实际交互证据；浏览器 a11y 扫描只是其中一层。

## 页面迁移责任

| 当前/目标使用面 | 迁移内容 | 页面与业务验收责任 |
| --- | --- | --- |
| LoginScreen、协议、验证码字段 | Button/Field/可用与错误状态；入口顺序及认证 transport 保持 | 1.0；历史 1.1/1.2 保留 done |
| Settings 当前退出确认 | AppDialog、焦点/返回/未知退出状态 | 当前会话退出归 1.0；未来完整设置页面归 7.3，历史 1.5 不重开 |
| HomeSheet、HomeImportDock、输入分类与结果弹层 | AppSheet、统一输入/状态；FIFO、operation journal、cursor、归因不替换 | 1.6；1.7 只补受影响 ACK/恢复回归，不改为组件框架工程 |
| owner 导入记录及运营地点纠错 | 列表/Field/Dialog/空错状态 | 1.8 / 1.11；1.9/1.10 的服务端媒体能力保持原合同 |
| 时间、班次、住宿、约束、Picker、POI、规划 shell、候选/负荷/搜索 | 基础字段、Tabs、AppSheet 与 AsyncState | 2.3–2.10、2.12、2.14、2.15；2.11/2.13 的服务端权威不迁入组件 |
| SlotEditSheet、DayPlan 弹层、后续编辑/修复/AI 调整 | 复用共享模态和控件，保持 revision/undo | 3.1–3.5；**3.1 仍 paused**，旧 2.2 不另派发 |
| 跨城/一日游确认与上下文 | 组合组件和边界提示 | 4.1–4.7；不改变 Trip 原子发布 |
| 细节、来源、行程单、导出/分享 | 页面级阅读与临时层分开，真实进度/保存语义保留 | 5.1–5.5 |
| 餐饮、定位降级、清单与购物记录 | 选择控件、Sheet、空错/权限状态 | 6.1–6.5 |
| 最近行程、完整设置、副本/删除/反馈 | 列表、表单、受控确认与回执状态 | 7.1、7.3–7.6；不恢复 7.2 |
| 自有桌面运营页面 | 基础组件可共用；保持桌面权限与证据 | 1.11、8.3–8.6；8.1/8.2 不重绘 Sentry/Langfuse 的成熟 UI |
| 原生入口、最低平台与发行 | 16.4 支持、组件宿主验证、候选包追溯 | 9.1 / 9.2 |

先完成旧页面基线，然后用 9.3 在现有登录或 Home 弹层形成实际可运行切片；页面级认证/导入验收仍由 1.0/1.6 承担。未来页面在所属 Story 第一次实现时直接消费共享层。暂时保留的 legacy 组件列出迁移责任，不允许后来新增页面继续复制。

## 交付与失败恢复

UI-COMPONENT-01、UI-WORKBENCH-01、CODE-QUALITY-01、UI-BROWSER-01按Story记录。9.4交付可运行工作台和真实lint，9.5保护现有流程，9.3迁移实际代表性消费点；Query9.6与Router9.7分别实施。旧组件兼容清单必须有责任与退出条件。出现身份、焦点、返回或布局回归时可回退单个适配层，保留业务controller/journal与数据，不能清空IDB/账号解决。

支持矩阵由app-host.md统一定义；图形/字号/状态规则由front-end-spec.md和UX-DR37定义。当前1.7完成后停止边界保留，新的准备顺序不是自动启动许可。

---

## Source: `docs/architecture/frontend-data-navigation.md`

---
status: approved-target
updated: 2026-09-20
scope_revision: ui-foundation-2026-09-20
implementation_status: pending-owning-stories
---

# 前端数据读取与导航责任

用户2026-09-20已批准TanStack Query（9.6）与TanStack Router（9.7）纳入本期，分别准备/实施/回归。保留认证、operation journal、持久cursor与业务回执的当前权威。

## AR27 — Query只管理普通服务器读取

试点限定 Home/Planner 的城市与 owner 灵感列表读取，证明取消、去重、失败/空结果、分页和刷新。未来已发布行程读取由其业务 Story 扩展。Query 管普通服务端读取；表单与 Sheet 状态仍在页面，operation journal、幂等回执、durable cursor/lease 仍归现有控制器，身份/原生凭据仍归鉴权层。

Query 默认行为包含 stale/refetch/retry，不能直接用于当前恢复链。[Query 概览](https://tanstack.com/query/latest/docs/framework/react/overview)、[默认行为](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

Nomad 的adapter 默认关闭自动 focus/reconnect refetch 与自动 retry；先由现有身份恢复协调器确认身份，再按资源显式刷新。请求使用现有 Web/native transport、AbortSignal 与 owner/session/activity fencing；private key 包含 owner、资源、筛选及必要 revision，未知身份 disabled 且不显示 private placeholder/cache。切 owner/撤权取消并清旧 cache，迟到结果仍被拒绝。首批不持久化 Query 私有缓存；城市公共数据单独命名空间。业务 mutation 不启用离线队列或自动重试，不包裹已有 operation 回执控制器形成双重写入责任。

## AR28 — Router只管理安全导航

试点现有 Home、Settings、Planner/DayPlan，并建立 S0–S11 typed route contract；未实现页面不创建假可达入口。Web 路由使用可刷新/直达的真实部署 fallback；原生路由历史与收到的外部深链分开，只有经过当前 input-v1/认证回调校验的 typed intent 才能进入导航。[Router 官方说明](https://tanstack.com/router/latest/docs/overview)

路由只存必要 public reference、允许的 stage/date/scope，不放 token、原始私人输入、受保护 URL 或完整草稿；关闭私有路径自动 prefetch，loader 只读且经过身份 guard。Android 返回由一个协调入口按键盘/Sheet/页面/root 分配，取消旧 App/页面重复 handler。离页保护复用既有未提交规则，保留 scroll/focus；导航不创造 operation、不启动 planning、不重播 transient Sheet。身份未知先遮蔽并核对，恢复到仍有效 parent；无权/缺失/过期参数不给跨 owner 回退。Query 和 Router 各自有独立绿灯与回退，不互相成为整 Story 前置。

## 表单与观测边界

建议 2.3 的日期/到离开多字段表单作为 RHF + Zod 的最小试点，2.5 住宿、2.6 约束、7.6 反馈及运营纠错随后按复杂度采用。后端仍为业务权威；共享的只是无秘密的字段规则，业务资格、日期事实与 revision 判断仍在服务器。dirty 不是已持久化，表单 mount/validation 不提交。现有后端 Zod 版本不因前端工具强制升大版本。[React Hook Form](https://github.com/react-hook-form/react-hook-form)

Sentry/Langfuse 和评测的隐私/真实查询/无双计数仍按 8.1/8.2 及首次消费 Story 验收，不引入第二套遥测或把 Storybook telemetry 作为产品指标。

## 独立回退和证据

9.6仅首先替换Home/Planner城市与owner灵感读取，9.7仅覆盖已有Home/Settings/Planner/DayPlan及typed S0–S11合同；未实现页面不得假可达。两个改造串行、分别审阅和验证。无需为普通读取迁移数据库，导航自身不产生mutation。身份/私有URL、取消、stale revision、重复恢复和平台返回的回归按各Story闭环，不复用别的Story的verified状态。

---

## Source: `docs/ops/ui-validation.md`

# UI组件、浏览器与CI验证合同

Updated: 2026-09-26
Status: 9.4 and 9.5 complete with scoped CI and downloaded evidence

交付一个可运行的组件状态工作台，先覆盖已有 HomeSheet/字段，再由 9.3 补共享组件示例。每个核心组件至少有正常、加载、禁用/原因、错误/重连、长中文、200% 字号、键盘、reduced-motion 与身份未确认场景；复杂组合补 empty/partial/stale。Storybook 展示用例不是 BMAD Story 状态。

MSW handlers 对齐生成 API 类型及现有安全错误，浏览器/Node 测试复用；未处理请求默认失败，静态资源允许清单明确。独立入口/构建产物中才启用，正式 Web/Capacitor build 无 mock worker/自动注册及相关启动分支；不让 MSW 改写真实 native transport 或替代 PG/设备验证。组件工作台不加载真实生产密钥，不上传用户数据，也不默认公开发布。

用 ESLint flat config + typescript-eslint 类型规则 + Hooks + JSX a11y 替换占位 `ci:lint`，CI 实际调用且失败阻止通过。初始覆盖新共享层、工具配置和迁移涉及的实际源文件；既有问题按文件/规则/原因形成冻结清单，只减不增，不能整目录关闭规则或用 `|| true` 掩盖结果。选择 no-floating-promises/no-misused-promises、必要 unsafe 类型、Hooks 与 label/交互语义规则；不要因修 lint 改写业务状态机。负向样例必须证明未处理 Promise、错误 Hooks 和缺失 label 会失败。[类型检查规则](https://typescript-eslint.io/getting-started/)

## Playwright与日常CI

保留 Puppeteer 旧探针，先建场景对应表，证明等价覆盖后才退役重复脚本。首批：登录→Home→Settings→返回；Sheet 打开关闭/焦点/滚动；输入错误、loading/empty/partial/reconnect；身份变更遮蔽 portal；Home FIFO/操作回执不重发；长中文和大字号。现有 operation journal 的真实 IDB/双 tab/跨进程、1.7 的 PG/真实 SIGKILL/SSE 探针按原责任保留。

固定 Linux 镜像、Playwright/browser revision、字体、locale、timezone、viewport、DPR、时钟、数据及动画策略；截图按引擎独立基线。CI 输出 actual/expected/diff 和 trace，基线更新是显式审阅动作，不自动接受 diff。Chromium/Firefox/WebKit 流程至少都有身份与弹层覆盖；浏览器自动化不代替真机、最低特定浏览器或供应商实证。

| 层次 | 必须保留/加入的检查 | 不得替代的证据 |
| --- | --- | --- |
| 每次改动 | 生成类型及漂移、实际 typecheck/lint、handoff、单元/组件、受影响 Storybook interaction/a11y、构建 | 真实接口/原生能力 |
| 合并前 | 上述检查 + 关键浏览器与截图、受影响 PG 事务/迁移/恢复/真实 socket 探针 | 供应商与真机 |
| 发布前 | 明确候选源码/资源摘要 + 最低/当前平台真机、真实服务、签名/升级/APK/TestFlight | mock、模拟器、仅构建或上传受理 |

CI 清单逐一标注现有认证/ingest probes、home-dock/auth/journal/telemetry browser probes、measurements、1.7 event/lease/worker/replay/SSE/ACK。哪些已在 CI、哪些仍独立、哪些需隔离资源，都写入交付证据。不要把提案里的目标清单说成现在已执行。

## 当前证据边界

9.4已接入独立工作台、共享MSW2 handlers、真实typed lint与单Chromium交互/a11y。Storybook10.6.0、MSW2.15.0、addon3.0.3、Playwright1.63.0/Chromium1243精确锁定。T0审计发现Vitest4.1.9已披露browser/mocker漏洞，实施采用同组4.1.11；ESLint9.39.5受jsx-a11y6.10.2 peer约束，停止支持提示与既有依赖告警保留，不声称全仓audit清零。具体决定与审计见story-9-4-execution-decisions-2026-09-25.md及其evidence目录。

工作台只直接消费HomeSheet、LoginScreen和既有样式。HomeSheet的Portal/inert/滚动锁/身份焦点及native返回仍归9.3；合成身份例只验证展示。9.5仍负责跨浏览器产品流程和截图基线，当前截图只记录本轮组件/隔离运行。真实auth、PG、IDB、SIGKILL、SSE、原生设备及最低版本证明不被替代。

### 实际命令

两端使用Node22.22.1、pnpm11.7.0。首次运行 `pnpm install --frozen-lockfile --strict-peer-dependencies`，再用 `pnpm -F nomad-mobile exec playwright install --with-deps chromium` 安装锁定浏览器及宿主库。组件中文视觉检查需要Noto CJK或记录的等价字体。WSL已有store时可加 `pnpm_config_store_dir=/tmp/nomad-sp-pnpm-store`；pnpm11使用pnpm_config前缀，不能用npm_config代替。Mac使用本机store，不提交机器路径。

| 命令 | 实际范围 |
| --- | --- |
| `pnpm -F nomad-mobile storybook` | 127.0.0.1:6006开发工作台，不自动公开发布；遥测关闭 |
| `pnpm -F nomad-mobile build:storybook` | 独立storybook-static，专属MSW worker |
| `pnpm run ci:lint` | 先生成OpenAPI/Prisma客户端类型；实际ESLint/TSProgram，列出cohort与未改历史文件，零保留豁免 |
| `pnpm run ci:lint:negative` | 同门禁Promise/void/Hook/label及修正、新增/重命名、浅克隆/基准、ignore/parse/规则、基线/豁免反例 |
| `pnpm run ci:workbench` | 专用typecheck、Node共享handlers、静态build、Chromium play/axe error |
| `pnpm run ci:workbench:negative` | 只在Vite内存转换缺陷，不改源码；焦点/键盘/字段/文字/axe、未声明/迟到请求、worker丢失/404、真实provider配置反例及修正控制 |
| `NOMAD_RECORD_PRODUCT_GRAPH=1 pnpm -r build` | 产品实际入口与模块来源；关闭本地env加载，图谱保存在工具结果目录 |
| `NOMAD_NATIVE_ENV=development pnpm -F nomad-mobile native:sync` / `native:verify` | 开发候选双端资源/插件/16.4等目标；不是APK构建或iOS实机证明 |
| `pnpm run ci:workbench:isolation` | 产品模块/资源及两端完整目录，污染反例，干净origin的公开不可用路径及工作台实际运行 |

普通ci:lint默认比较9.4开发基线abac3df；CI必须给CODE_QUALITY_BASE/CODE_QUALITY_HEAD。PR基准是event base SHA与实际checkout merge SHA，push是before SHA；全零首次push执行完整初始cohort与自基线新增/修改源文件，非零缺失基准失败。首轮固定HomeSheet/LoginScreen，全部新工具与workbench以及后续src/ui自动进入；任何已变源文件也进入。原始coverage manifest摘要固定，例外只允许消减，新诊断不能靠移动/等量替换/ignore/void过关。

### 当前CI与独立证明对照

`.github/workflows/ci.yml`保留原检查，并增加精确Node、完整Git历史、lint/负例、工作台、锁定Chromium、native资源/污染和实际运行检查；Ubuntu24.04 runner。9.4开发分支push及到其已推送父分支的PR也运行，便于提交实际CI证据。CI产物保存.workbench-results和工作台索引；本地通过与远端run结论分别记录，未执行的远端job不计通过。

| 已存在责任 | CI实际入口/位置 | 本Story处理 |
| --- | --- | --- |
| API类型/build/handoff | ci:types、ci:build、ci:handoff与check-handoff.test.mjs | 保留并执行 |
| auth/ingest单元和合同 | auth/*.test.ts、ingest/*.test.ts、check-auth-contract、check-ingest-dock-contract | 保留 |
| 实际PG认证 | CI隔离PG15 migrate/seed，auth-persistence/http/ingest probes | 保留；不得由MSW替代 |
| mobile/jsdom/native配置 | ci:mobile：src内Vitest及native-config-proof.test.mjs | 保留独立配置，工作台不混入 |
| 老Home/Planner/Settings/synthetic/SSE | ci:home-library/planner/settings/probe/sse＋显式fixture server | 保留，不在9.4退役 |
| 备份与进程工具 | benchmark-stream.test、ops/postgres unittest、bounded_process | 保留 |
| 原浏览器auth/home-dock/journal/telemetry与IDB/双tab | 各独立scripts/probe，原Story证据目录 | 未全部纳入日常CI；9.5建立等价覆盖表，真实IDB职责保留 |
| 1.7 event/lease/worker/replay/socket/SIGKILL/ACK/PITR | 各隔离PG/进程/设备脚本及封存报告 | 仍独立资源证明，不重复或虚称由工作台覆盖 |
| 正式基线/费用/人评、原生真实设备 | 1.0/1.6/1.7/9.1及后续Story | 保留真实资源与逐Story关闭门槛 |

### 场景与限制

18个当前组件场景（含场景清理并发）覆盖HomeSheet键盘/焦点/卸载、empty/partial/长中文/200%实际字号/reduced-motion/合成身份未知，Login正常/空/loading/403/超时/重连/验证码禁用原因/长中文/200%字段。200%对实际computed font逐项加倍，固定px字段也被检查；不等于系统字号/VoiceOver/TalkBack验收。验证reduced-motion场景时系统/浏览器需启用减少动效；CI provider显式启用。HomeSheet只负责弹层边界，网络content是类型化合成子内容，不冒充HomeImportDock恢复。

工作台配置/场景和测试各有独立cacheDir（browser用post config hook防addon覆盖），避免与产品jsdom或反例互相污染。MSW worker字节与锁包一致；只在.storybook/public并等到激活。未知/外部请求在fetch守卫或MSW兜底失败，收尾账本使业务catch仍失败；迟到的旧client同时污染当前账本并失败。场景只清自己的timer、请求、合成身份和工作台origin的device标识，不访问产品IDB或注销其他origin的worker。

本次实际证据入口：`_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/`。9.4已完成独立CR与完整CI36129441895（6344a53），实际下载26文件包含日志/截图/双端资源；ui-delivery.yaml仅关闭本Story两项条件。

审阅修补：API仅在工作台使用随机场景前缀，原/auth等生成合同路径保留；plain fetch不能借用下一场景，静态资源旁路不适用于programmatic fetch。finish Promise复用、切换串行化；worker.stop与异步lookup用epoch围栏。loading保持等待至取消，timeout通过受控abort模拟并核对取消计数，不宣称产品新增超时策略。Node使用同一finish强制校验ledger，预期违例为普通断言；MSW Accept旁路被记录/清除，Node无静态passthrough。产物绑定writeBundle实际bytes；390px运行与截图探针验证横向溢出和动作可达。

CI的Prisma client生成位于typed lint之前：服务器脚本进入覆盖后不能靠本机旧生成物提供类型。该顺序有干净副本中缺生成物失败、生成后通过的实际反例。它不是数据库迁移；DB迁移与PG探针仍按原独立步骤执行。

旧fixture服务器仅在隔离CI步骤显式开启持久ingest worker（INGEST_WORKER_MODE=enabled、INGEST_RECOVERY_ISOLATED=false）；生产默认关闭不变。synthetic/SSE继续走实际PG，子阶段允许持久快照重复但不允许缺失或错误阶段，scripts/sse-assert.test.mts以实际HTTP/原探针执行正反例。Redis自然退出探针在专用CI实例执行正常/暂停回复验证，禁止指向共享服务。


## Story9.5实际App浏览器与视觉门禁

固定环境为Playwright1.63.0的noble/amd64镜像digest `bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7`，Node22.22.1/pnpm11.7.0，Chromium153.0.8010.12、Firefox155、WebKit26.6。镜像采用pwuser运行，保留HOME；实际48字体及fontconfig文件hash、WenQuanYi Zen Hei中文fallback由browser-environment.mjs记录。policy.json绑定环境指纹，三个引擎独立PNG。

实际入口为当前dist的main→HostBootstrap→App；loopback4175由本轮nonce标识，禁止复用未知服务。API在HTTP边界由有状态合成场景提供，继续使用产品transport/controller/journal/真实IDB和WebCrypto。未知API、伪装静态fetch、外部HTTP/WebSocket和结束后请求由最终ledger报错，WebSocket不建立服务端握手，ServiceWorker阻断；不发真实验证码、供应商或遥测请求。公开协议正文是明确标注的合成文本。

23个B00–B22行为场景及8个V01–V08视觉场景，共93个三引擎实例，由独立run-contract.json核对实际报告，不能通过删引擎/删场景/skip缩减。每run独立目录保存report、source-manifest和失败trace；suite-run指针保留整套结果，不被负例覆盖。清单同时校验当前Git SHA、实际工作树、源/lock/config/基线、CI run ID及环境hash，拒绝旧报告、未提交变更和隐式snapshot更新。v2覆盖整个mobile、native-auth工作区与生成类型等输入；测试构建的图谱/输出bytes按hash保存在不可覆盖的products目录，复用既有隔离检查校验当前dist，每个非依赖产品模块都必须在源码清单中。逐个engine×visual要求实际PNG附件和下载后路径重定位；源码HTML/public/依赖和编译输出/图谱变动另有5个真实文件变更拒绝反例。

### 执行与候选更新

Canonical前置依次运行环境探针、API生成、带 `NOMAD_RECORD_PRODUCT_GRAPH=1 VITE_API_BASE_URL=/api` 的mobile build，再执行 `pnpm run ci:browser` 与 `pnpm run ci:browser:negative`。实际workflow逐步调用同一入口。环境探针会拒绝不同OS/架构/镜像；没有字体/引擎不跳过。本机可在同样产品build后运行 `pnpm -F nomad-mobile test:browser --project chromium --grep 'B[0-9][0-9] '`；它只是所选本地引擎行为证据，不能替代canonical93项。Firefox在本任务受限profile命名空间下需获准的常规进程环境；WebKit宿主依赖未在本机安装。

候选入口是 `.github/workflows/browser-visual-candidate.yml` 的显式 `codex/story-9-5-visual-candidate-*` 分支push，已从实际ref触发。它只产生unapproved图片/manifest和24项验证结果，不写仓库基线、不发布网站。审阅者先下载artifact并使用check-browser-results.mjs的 `--candidate --artifacts <目录> --revision <实际CI SHA>` 核对全部图片、源码和环境，再逐张看原尺寸图，记录拒绝/接受理由及每个hash；明确接受后才把PNG与approval.json提交。不能用缺基线时自动生成替代审阅。

当前初始基线来自ea47462/run36150885851：前一候选因200%加号裁切被拒绝，B21实测红灯后只修补按钮按字号增长与居中。24张包含正常、长中文、200%实际字号、键盘Sheet与退出确认；V08仅裁当前确认，不能将历史Settings/BYOK页面视为新7.3设计批准。V07主动滚动长模态到关闭按钮，不代表原生软键盘或共享AppSheet。没有mask；比较threshold=0、maxDiffPixels=0，普通CI updateSnapshots:none。

视觉场景固定Date，普通timer继续运行，且不包含FIFO/超时验收。B07独立使用真实Date/performance/timer，实际遮挡11秒、关闭后走完剩余窗口、reload不重播；B04对真实AbortSignal超时同时校验aborted与reason。B08仅延迟真实WebCrypto入口再释放，实际IDB/加密未换成内存实现。200%逐项加倍computed size，包括固定px字段，并检查横向边界、主要操作可达和加号Range，不把viewport缩小当真软键盘。

五个产品反例在独立context注入：CTA位移、auth容器外的私有层、可见但inert/aria-hidden的私有输入值、无视取消并写外层的迟到HTTP回调、回执查询时重发原POST。它们证明实际页面断言会失败，不声称产品已迁到Portal，也不代替源码围栏审阅。每个功能反例需要非零执行数、目标断言、非零退出和首次trace；视觉位移另外要求actual/expected/diff。完整性反例对同一实际全套报告删除引擎/场景、改为skip或去掉一个视觉附件；它们是报告门禁测试，不冒充新执行的产品场景。缺基线/环境不匹配通过真实V02验证，CLI自动更新在启动前明确拒绝；该配置拒绝不计为产品缺陷反例。

### 原探针与恢复资源责任

没有退役旧探针。旧报告与新证据分开；原Chrome127、旧源码/lock和真实设备缺项仍按research/story-9-5-repository-context-2026-09-25.md记录。

| 原浏览器探针（apps/mobile/scripts） | 新套件对应部分 | 继续独立保留的责任 |
| --- | --- | --- |
| auth-browser-probe.mjs | B01/09/13–18登录字段、身份遮蔽/通知/会话变化 | 合成PNVS未知发送、同operation退出重试及桌面ops审计；本次按原场景定向重跑 |
| home-dock-browser-probe.mjs | B01/05–08/11/12草稿、Sheet、回执、FIFO | 剪贴板/deep-link替身、跨进程丢ACK恢复、批次/拖动/44px；原脚本/历史证据保留，本次不宣称全部重新通过 |
| operation-journal-browser-probe.mjs | B08/11消费实际IDB但不等价完整存储审计 | 双tab/两进程、原子claim、不可导出key、篡改/TTL/容量；保留22项 |
| telemetry-browser-probe.mjs | 无替代 | 三个真实HTTP合成信封、许可未知/哨兵/旧队列隔离；不是真SDK |
| ingest-checkpoint-browser-probe.mjs | B11 reload不替代kill | 三进程/两次SIGKILL、14项v1→v2/CAS/加密原子/ACK |
| durable-dock-pg-browser-probe.mjs | B07/11/12仅浏览器与HTTP替身部分 | 实际PG session/me/SSE/IDB、三进程一次SIGKILL、原cursor/FIFO/A→B→A；本次用专用隔离DB定向重跑 |
| durable-dock-pressure-browser-probe.mjs | 无等价替代 | 56KB/重复帧压力、真实双visible窗口、迟到加密CAS，保留CDP与PG资源 |

服务端event/lease/worker/replay/socket/restore/PITR及正式measurements仍按上方原责任清单独立执行。当前CI继续运行PG认证/HTTP/ingest、旧Home/Planner/Settings/synthetic/SSE、worker fixture、备份helper与原单元/工作台/隔离链；新93项不能代替未在CI的真实SIGKILL/压力/生产备份与RPO。旧探针输出固定到历史目录时，本次只作输出/模块路径重定位并记录adapter/source hash，保持原场景断言，禁止覆盖历史报告。

Story9.5只关闭自身CODE-QUALITY-01/UI-BROWSER-01。WebKit26.6不是Safari16.4/iPhone实证，Firefox155不是128最低版本实证；真实PNVS、法律资源、native SDK/设备、TestFlight及生产恢复由1.0/1.6/1.7/9.1/9.2和业务Story继续验收。

审阅修补还强制B先认证后才释放旧A的/me响应；OTP替身绑定成功start的手机号；法律新窗口尝试后保留48px当前页回退链接，避免noopener成功误报，也不让弹窗被阻止时失去入口。下载旧报告的显式SHA审计按该提交当时合同验证，并标明contractVersion/compiledProductVerified；不能用v1历史证明替代当前v2验收。

最终交付：9.5源码85eedb6完整CI36157432347通过；93项v2、777下载文件与12trace已核验，具体数字、源/资源摘要及边界见story-9-5-acceptance-2026-09-26.md和evidence/story-9-5-browser-2026-09-25/ui-delivery.yaml。

## Story9.3共享UI增量（当前实现；最终CI尚在收口）

前面的9.4/9.5段落保留各自交付时的事实。当前9.3已在src/ui建立Nomad共享层，使用精确Base UI1.8.0、Tailwind/Vite插件4.3.3及受控shadcn4.21.0来源。现有Login字段/按钮、HomeSheet三入口、Home计划/灵感Tabs及Settings退出确认实际消费；来源/人工调整/兼容清单见docs/ui/shared-components.md和其upstream记录。没有新全局Preflight或第二模态/Toast框架。

工作台当前32个场景保留原18项，增加基础字段/按钮/状态/Tabs、受控模态拒绝/异步/嵌套、私有容器与非关键通知、隐式触发器身份恢复。模态在同身份的DOM私有边界内；页面兄弟节点按真实present层计数inert/aria-hidden，覆盖Base UI默认保留的背景aria-live节点。正常关闭播放260ms并保持原Base UI锁，动画实际结束后才释放Dock；checking/unavailable立即卸载。已经接受的关闭在同身份重新验证后收尾，取消决定不会占据旧pending。原控制器/journal/cursor/幂等规则保持。

当前产品矩阵为B00–B31与V01–V11，共129个三引擎实例；候选只执行33视觉实例。320×740和1280×900场景在policy/run-contract双登记，capture同时检查project默认值、实际page/window viewport与DPR。B05检查实际合成focus颜色对比≥3，B20覆盖新标题的200%字号与关闭字形边界，B26以模拟composition状态中的真实键盘Enter验证默认提交抑制，229事件单独验证preventDefault；它不是OS输入法实证。B29覆盖关闭动画被身份核验打断，B31验证真正背景位置点击只关闭当前模态。

受控候选分支支持codex/story-9-3-visual-candidate-*及保留的9.5入口；普通CI覆盖9.3开发分支和到实际父分支9.5的PR。候选保持unapproved，必须先下载校验源码/构建/环境/实际PNG，逐图审阅并记录决策，再提交基线并重跑当前完整CI。当前9.3前两轮分别因320px按钮边界和逐图发现的弱焦点环被拒；没有自动更新基线或降低像素/ratio/对比门槛。

本次定向原职责回归：6e0b973上的auth-browser-probe6项与PG-backed durable browser6项通过，含真实PG18.6、SSE、IDB、3进程和1次SIGKILL；新隔离DB和输出目录，原28证据文件hash不变。其他存储/压力/遥测/生产PITR职责仍保留，未重跑不计通过。原生配置/assets和真实设备分别记录，当前T9/APP-HOST-01及整张Story仍未关闭。当前进度与最终证据入口为story-9-3-dev-progress-2026-09-26.md及evidence/story-9-3-ui-2026-09-26/，四项UI条件只在最终实际CI和下载实证后按本Story范围更新。

T7收口另在canonical容器按Chromium/Firefox/WebKit分别执行实际共享组件的隐式焦点恢复与私有Toast生命周期，共6例。NOMAD_WORKBENCH_BROWSER显式选择真实可执行文件，场景断言观察到的UA，check-shared-ui-matrix.mjs要求每engine两条指定场景实际通过。其范围是隔离组件harness；正式产品的129项/33图仍独立完整执行。

---
