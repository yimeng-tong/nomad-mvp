# nomad-mvp

Travel assistant MVP built as a pnpm monorepo in WSL Ubuntu.

## Start Here

- Current handoff and next story: [`CURRENT.md`](CURRENT.md)
- Agent rules and authority order: [`AGENTS.md`](AGENTS.md)
- BMAD project context: [`_bmad-output/project-context.md`](_bmad-output/project-context.md)
- Sprint status: [`_bmad-output/implementation-artifacts/sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml)

Use CURRENT.md and the live Sprint for the active implementation and authorized workstreams. The approved 2026-09-19 Capacitor amendment adds Android APK and iOS TestFlight delivery while preserving Web/PWA; see `_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`. Dated readiness and retrospective reports remain historical snapshots.

## Development

```bash
pnpm install --frozen-lockfile
pnpm -F nomad-types run generate
pnpm -F nomad-mobile test
pnpm -F nomad-server run test:planner
pnpm -r build
```

Run commands in `/home/tong123/work/nomad-mvp` inside WSL Ubuntu. Do not use Windows-native Node or pnpm.

## BMAD

BMAD 6.8 is authoritative through `_bmad/`, `.agents/skills/`, and `_bmad-output/`. Implementation stories live in `_bmad-output/implementation-artifacts/`.


### UI scope update (2026-09-20)

Current recovery and execution limits are in [CURRENT.md](CURRENT.md). Approved UI/Query/Router scope has67 Stories/1089 GWT; new9.3–9.7 are planned, with1.7 resource/stop boundary retained. See [UI architecture](docs/architecture/ui-foundation.md) and [data/navigation](docs/architecture/frontend-data-navigation.md). Current contracts use the ui-foundation-2026-09-20catalog/delivery; prior snapshots remain historical.


## Cross-device development

WSL and macOS share committed code and lockfiles through Git. Mac supports component and iOS work; server-only development configuration stays on homelab VM104. See [the setup and handoff guide](docs/ops/cross-device-development.md) before starting Story9.4 or using `pnpm run dev:homelab`.
