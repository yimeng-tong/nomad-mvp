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

独立Storybook/MSW工作台、typed ESLint、单Chromium interaction/axe与产品/双端资源隔离已接线；实际命令、cohort、反例、旧探针保留表与证据边界统一见docs/ops/ui-validation.md。Vitest同组由准备候选4.1.9调至安全修复4.1.11，正式决定见story-9-4-execution-decisions-2026-09-25.md。当前不修改9.3共享层、Query/Router或auth/journal/cursor权威；9.4在真实CI及独立CR收口前仍in-progress。本增量只描述工具实施，原批准范围/快照不重写。
