---
project_name: nomad-mvp
user_name: yimeng-tong
generated: 2026-06-17
source: bmad-generate-project-context
sections_completed:
  - discovery
  - implementation-rules
  - validation
---

# nomad-mvp Project Context

## Mission

Nomad MVP turns travel inspiration into an executable itinerary: collect a single Xiaohongshu link, normalize POIs, choose inspirations, generate a day-level skeleton, fill actionable AI details, and export an itinerary card.

## Current Baseline

- Work in WSL Ubuntu at `/home/tong123/work/nomad-mvp`; do not use Windows-native Node/pnpm and do not copy from old E-drive migration images.
- BMAD 6.8 is authoritative through `_bmad/`, `_bmad-output/`, and `.agents/skills/`; old `bmad/`, `.cursor/rules/bmad/`, and `.bmad-core` references are not authoritative.
- The repo is a pnpm monorepo with a Fastify TypeScript backend, generated OpenAPI types, Prisma schema, promptfoo assets, and docs as planning source.
- `CURRENT.md` is the single recovery entry. Story 2.0 is done; Story 2.1 is the next story and is ready for development.

## Implementation Rules for AI Agents

- Use `pnpm` from WSL. Main checks are `pnpm -F nomad-types run generate`, `pnpm -F nomad-server exec tsc -p tsconfig.json --noEmit`, and `pnpm -r build`.
- Treat `docs/api/openapi.yaml` as the API SSOT. After OpenAPI changes, regenerate `packages/types/src/api-types.ts`; never hand-edit generated API types.
- TypeScript in `apps/server` uses ESM/NodeNext-style `.js` import specifiers. Keep imports compatible with runtime output.
- Extend existing Fastify plugins/routes instead of creating duplicate stacks. Current auth/session code is under `apps/server/src/routes/auth.ts` and `apps/server/src/plugins/auth.ts`.
- Keep request validation close to route boundaries with Zod or schema validators. Preserve the standard error envelope from `plugins/error-envelope.ts`.
- SSE responses must include trace context and heartbeats; preserve idle-timeout behavior and auth guards on protected streams.
- Fill output validation uses AJV 2020 through `ajv/dist/2020.js`; do not reintroduce unresolved JSON meta-schema imports.
- AI provider secrets and account operations must avoid logging secrets or PII. Existing BYOK compatibility routes are not part of the MVP user path and must not return plaintext key material.
- Prisma schema is in `packages/prisma/schema.prisma`; create or alter only entities needed by the story being implemented.
- Do not commit `.env`, build outputs, logs, or local ignored backup material.

## Planning Inputs

- Current PRD: `docs/prd.md`.
- Current architecture: `docs/architecture/index.md` and its v0.4 shard files.
- UX: `docs/front-end-spec.md` plus `docs/ux/` deltas.
- Supplemental tech specs: `docs/tech-spec-epic-2.md` and `docs/tech-spec-epic-3.md`.

## Known Shape of the Codebase

- `apps/server/src/index.ts` wires Fastify, rate limiting, helmet, CORS, cookies, trace IDs, error envelope, idempotency, queues, auth, account routes, existing BYOK compatibility routes, SSE mock flows, AI fill, and export.
- `apps/server/src/schemas.ts` defines current Zod request bodies for ingest, plan generation, AI fill, and export.
- `packages/types` generates TypeScript API types from OpenAPI.
- `packages/prisma/schema.prisma` contains users, sessions, inspirations, POIs, plans, slots, fill runs/items, and export jobs.

## Developer Guardrails

- Prefer scoped stories that build on existing backend contracts before broad UI work.
- The React/Vite mobile app exists under `apps/mobile`; extend its authenticated shell and feature folders instead of creating another frontend package.
- Keep changes story-sized: each story should update only the contracts, models, routes, UI surfaces, and tests needed for that user outcome.

## Current Planning Semantics

- Only L3 POIs are selectable. Selection maps to `anchor_intent=selected_required`; never restore a user-facing `must_go`/“必去” toggle.
- L2 is an area or route grouping and communicates child selection through dot color and selected L3 count.
- Hotels are optional per date, support AMap matching, and may remain blank. Breakfast is hotel child data.
- Reservations, tickets, and dawn/sunset/night/night-market constraints come from uploaded inspiration evidence and Agent planning, not standalone Confirm controls.
- User-facing planning language uses “计划” and “开始规划”; “骨架” is an internal implementation term.
