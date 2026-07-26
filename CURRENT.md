---
project: nomad-mvp
updated: 2026-07-26
current_epic: 2
last_completed_story: 2-0-confirm-and-planner-picker
next_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning
next_story_status: ready-for-dev
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
---

# Current Development Handoff

This is the single recovery entry point for a new Codex/Cursor task.

## Resume Order

1. Read `AGENTS.md` and `_bmad-output/project-context.md`.
2. Read `_bmad-output/implementation-artifacts/sprint-status.yaml`.
3. Read `_bmad-output/implementation-artifacts/2-1-generate-day-skeleton-with-quick-and-hq-planning.md`.
4. Check `_bmad-output/implementation-artifacts/deferred-work.md`.
5. Run `git status --short --branch`, then use `bmad-dev-story` for Story 2.1.

## Current State

- Epic 1 and its retrospective are done.
- Story 2.0 Confirm and Planner Picker is done, including its adversarial review fixes and visual evidence.
- Story 2.1 is the only next implementation target and is ready for development.
- Do not recreate Story 2.0 or rerun sprint planning before starting Story 2.1.

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

When a historical artifact conflicts with the current Story 2.0 decision record or Story 2.1, the current story and the updated planning packet win.

## Validation Baseline

```bash
pnpm -F nomad-types run generate
pnpm -F nomad-mobile test
pnpm -F nomad-server run test:planner
pnpm -r build
```

All project commands run in WSL Ubuntu from `/home/tong123/work/nomad-mvp`.
