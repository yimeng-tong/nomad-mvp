---
project: nomad-mvp
updated: 2026-07-27
current_epic: 2
last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
current_story: 2-2-timeline-editing-undo-and-history
current_story_status: in-progress
next_bmad_action: bmad-dev-story
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
---

# Current Development Handoff

This is the single recovery entry point for a new Codex/Cursor task.

## Resume Order

1. Read `AGENTS.md` and `_bmad-output/project-context.md`.
2. Read `_bmad-output/implementation-artifacts/sprint-status.yaml`.
3. Read the active Story 2.2:
   `_bmad-output/implementation-artifacts/2-2-timeline-editing-undo-and-history.md`.
4. Read Story 2.1 only when prior implementation context is needed.
5. Check `_bmad-output/implementation-artifacts/deferred-work.md`.
6. Run `git status --short --branch` and continue `bmad-dev-story`.

## Current State

- Epic 1 and its retrospective are done.
- Story 2.0 Confirm and Planner Picker is done.
- Story 2.1 Quick/HQ planning is done, adversarially reviewed, and covered by server/mobile regression tests.
- Story 2.2 Timeline Editing, Undo, and Recent Actions is in progress on
  `codex/story-2-2-timeline-editing`.
- The OpenAPI contract, pure edit rules, durable EditEvent/version repository,
  authenticated routes, and focused server tests are implemented. Mobile UX,
  real PostgreSQL/staging verification, BMAD review, and merge remain.
- Do not recreate Story 2.0/2.1/2.2 or rerun sprint planning. Resume the Story
  2.2 task checklist through `bmad-dev-story`.

## Story 2.1 Delivery

- Added durable Quick/HQ jobs, reconnectable SSE, attempt fencing, separate plan versions, transactional HQ adoption, and revision-safe seed/empty-slot mutations.
- Added server-owned inspiration/POI resolution, evidence extraction, AnchorPool plus versioned built-in fallback, timezone-aware hard-time placement, hotel/luggage handling, candidate feasibility, and source attribution.
- Added the Quick-first day plan UI with HQ preview/adopt, candidate/free/unresolved states, seed undo/reset, responsive layouts, and privacy-safe analytics.
- Unknown planner cities return `PLAN_CITY_UNSUPPORTED`; platform configuration can provide `PLANNER_DEFAULT_TIMEZONE` for an additional deployment region.
- Story 2.1 migrations are applied and verified on the private PVE staging PostgreSQL environment.

## Product Decisions

- BYOK is post-MVP/internal compatibility. Platform-managed AI quota and cost controls are the MVP path.
- Only L3 POIs are selectable. Selecting an L3 means it is a `selected_required` planning anchor; there is no separate user-facing must-go toggle.
- L2 is an area/route grouping. Its dot color and selected L3 count communicate child selection.
- Hotels are optional, configured per date, matched with AMap, and may remain blank. Breakfast is a hotel child field.
- Reservations, tickets, and special time windows are derived from uploaded inspiration evidence by the planning Agent; Confirm has no standalone toggle for them.
- The user-facing planning CTA is `开始规划`. `skeleton`, `must_go`, and related terms are internal compatibility language only.
- Unselected L3 items remain optional Agent candidates. Items not placed belong in the plan candidate page/drawer.

## Sources Of Truth

- API contract: `docs/api/openapi.yaml`
- Generated API types: `packages/types/src/api-types.ts`
- Product source: `docs/prd.md`
- Architecture source: `docs/architecture/index.md`
- UX source: `docs/front-end-spec.md` and `docs/ux/`
- BMAD planning packet: `_bmad-output/planning-artifacts/`
- Sprint and story state: `_bmad-output/implementation-artifacts/`

When a historical artifact conflicts with the current Story 2.2 or updated planning packet, the current story and PRD MVP scope win.

## Validation Baseline

```bash
pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-server run test:planner-domain
pnpm -F nomad-server run test:planner
pnpm -F nomad-server run test:ingest
pnpm -F nomad-mobile test
pnpm -r build
git diff --check
```

Verified on 2026-07-27: planner domain (9 test files), planner and ingest contract probes,
mobile (10 files, 54 tests), Prisma validation, TypeScript, and the full workspace build.
Visual verification covers 390x844 and 1440x1000 viewports.

All project commands run in WSL Ubuntu from `/home/tong123/work/nomad-mvp`.
