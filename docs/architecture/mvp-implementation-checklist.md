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
