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

独立Storybook/MSW工作台、typed ESLint、单Chromium interaction/axe与产品/双端资源隔离已接线；实际命令、cohort、反例、旧探针保留表与证据边界统一见docs/ops/ui-validation.md。Vitest同组由准备候选4.1.9调至安全修复4.1.11，正式决定见story-9-4-execution-decisions-2026-09-25.md。当前不修改9.3共享层、Query/Router或auth/journal/cursor权威；9.4在真实CI及独立CR收口前仍in-progress。本增量只描述工具实施，原批准范围/快照不重写。
