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

React/Vite 共用 Web/PWA + Capacitor Android/iOS，产品支持 Android10+/iOS16+。原生工程与能力首次消费、构建/签名/分发门槛见 `app-host.md`。9.1 锁定实际版本并验证 Web bundle 最低目标；WSL/Linux 与 macOS 原生 runner 分工，Windows-native Node/pnpm 禁令保留。
