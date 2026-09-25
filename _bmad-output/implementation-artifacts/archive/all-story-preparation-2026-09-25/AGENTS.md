# Project Agents

This repository uses BMAD 6.8 with Codex/Cursor skills generated under
`.agents/skills`.

## Project Context

- Project: `nomad-mvp`, a travel assistant MVP.
- Primary working directory: `/home/tong123/work/nomad-mvp`.
- Work in WSL Ubuntu. Do not use Windows-native Node or pnpm for project commands.
- Do not copy files from the old Windows/E-drive migration image.

## Current Tooling

- BMAD manifest: `_bmad/_config/manifest.yaml`.
- BMAD outputs: `_bmad-output/`.
- Codex/Cursor skills: `.agents/skills/`.
- Current recovery entry: `CURRENT.md`.
- Legacy BMAD v4/v5/v6-alpha paths are intentionally not authoritative.

## Resume Order

1. Read `CURRENT.md`.
2. Read `_bmad-output/project-context.md`.
3. Read `_bmad-output/implementation-artifacts/sprint-status.yaml`.
4. Open the story named by `CURRENT.md`.

Authority flows from source docs to the synchronized BMAD planning packet, then to the current implementation story. Dated readiness reports, retrospectives, and validation reports are historical snapshots unless `CURRENT.md` points to them.

## Development Commands

- Install dependencies: `pnpm install --frozen-lockfile`
- Generate OpenAPI types: `pnpm -F nomad-types run generate`
- Build workspace: `pnpm -r build`

## Working Notes

- Keep `.env`, logs, and build outputs out of git.
- Use `docs/prd.md`, `docs/architecture/`, `docs/tech-spec-epic-2.md`, and
  `docs/tech-spec-epic-3.md` as planning inputs.
- `_bmad-output/implementation-artifacts/` is the authoritative location for implementation stories and sprint state.

## Sprint Delivery Handoff

- After reading sprint status, read its `delivery_contract` and `migration_manifest`.
  The dated migration preserves historical facts; current authorization and condition progress
  live in sprint status. Files record authorization already given by the user; they do not grant it.
- Use `next_story_to_prepare` in the preserved preparation order, including an inherited story
  whose current contract is missing. Do not discover work solely by `backlog` or `in-progress`.
  Exclude every `execution_pauses[story_key].paused: true` entry from development dispatch.
- For migrated 3.1, create the current contract without downgrading its inherited `in-progress`
  status. Match the implementation file's Status, set `contract_ready: true`, and keep it paused
  until the recorded upstream conditions and keep/change/remove audit are satisfied. Record
  `migration_audit_complete` and a repository-relative `migration_audit_evidence` path before
  resuming. The legacy 2.2 file is a historical source only, never a separate execution identity.
- Each prepared story records `source_story_id` and `source_contract_sha256` from the current
  catalog in YAML front matter. Carry the approved narrative, Requirements/GWT, prototype and
  evidence references, the delivery-contract path, bound FR/NFR and engineering condition IDs,
  and applicable `source_obligations` into its actual Tasks and acceptance/closure work.
- Following later user authorization, move `execution_phase` from `planning-handoff` to
  `execution` in CURRENT and sprint status. Update current Story/file/status/action, current
  branch, last-completed and next-preparation pointers as work advances. The original SP
  authorization snapshot stays unchanged; normal ready/in-progress/review/done transitions
  must not require rewriting the checker or losing history.
- Record per-Story engineering progress in `condition_progress`, using `not-started`,
  `in-progress`, `verified`, or `not-applicable`. Verified/not-applicable entries need a
  scoped `summary` and existing repository-relative `evidence` paths. Never mark all uses
  complete from one Story's proof; production-open gates remain distinct from local tests.
- Mark an Epic done only when every Story in its current scope is done. Preserve the old Epic1
  retrospective and add new expanded-scope evidence before clearing its outstanding review.
  Run `pnpm run ci:handoff` after state changes and the checker regression suite after guard changes.

## Approved Capacitor Scope and Continuous Execution (2026-09-19)

- The user approved the Capacitor proposal/appendix and continuous execution of the current MVP. Read `scope_decision` and current `scope_readiness_report` from CURRENT; do not ask again for ordinary preparation/dev/review transitions. Record autonomous decisions with background, evidence and consequences.
- Current catalog/delivery are the ui-foundation-2026-09-20 successors; preserve the 2026-09-15/17/19 snapshots. Source display order stays stable; consult current preparation_order instead of numeric IDs.
- App host acceptance is carried into actual Tasks and closure evidence via APP-HOST-01, FR52/NFR25, AR23/24 and UX-DR36. App build/configuration/mock evidence is never a substitute for real device or TestFlight proof.
- Daily repository Node/pnpm stays in WSL. A designated macOS workspace/runner may perform required iOS native build/dependency steps. Do not use Windows-native Node/pnpm or the old migration image.
- Record missing mandatory resources against the blocked slice and keep independent authorized work moving. Preserve real dependency/closure gates, 3.1 pause/migration audit, existing data and historical done.
- Coordinate shared writers using Sprint active_workstreams and the execution decision log; re-read live files before mutation. CURRENT may retain the primary 1.0 task while 9.1 is independently in progress.


## Approved UI Scope and Execution Boundary (2026-09-20)

- User approved shadcn/ui + Base UI + Tailwind4 and Nomad shared components, iOS/Safari16.4+, Firefox128+, plus separate Query9.6 and Router9.7. New9.3–9.7 remain backlog until prepared and allowed to execute. Current total67 Stories/1089 GWT.
- Preserve CURRENT/Sprint stop_after_story1.7. Planning synchronization and next_story_to_prepare9.4 do not resume the blocked task or dispatch1.8/UI development. A later user direction must be recorded before changing that boundary.
- Preparation order inserts9.4→9.5→9.3 after current prepared work, then9.6/9.7 before2.3;9.2 remains final distribution. Query/Router use the verified9.3 local UI gate without treating browser proof as whole native closure.
- UI-COMPONENT-01/UI-WORKBENCH-01/CODE-QUALITY-01/UI-BROWSER-01 and source obligations enter actualTasks and scoped closure evidence. Preserve original auth/journal/cursor/operation authority and historicaldone;3.1 pause remains.
- Before changing UI dependencies, use the approved ui-foundation and frontend-data-navigation ADRs. native:sync preserves App SPM16.4; native:verify checks every native/JS/CSS target. Config/build/mock evidence is not real-device or TestFlight proof.
