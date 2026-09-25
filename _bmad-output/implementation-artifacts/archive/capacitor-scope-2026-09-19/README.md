# nomad-mvp

Travel assistant MVP built as a pnpm monorepo in WSL Ubuntu.

## Start Here

- Current handoff and next story: [`CURRENT.md`](CURRENT.md)
- Agent rules and authority order: [`AGENTS.md`](AGENTS.md)
- BMAD project context: [`_bmad-output/project-context.md`](_bmad-output/project-context.md)
- Sprint status: [`_bmad-output/implementation-artifacts/sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml)

The current implementation target is Story 2.1. Do not infer the next task from dated readiness reports or retrospective notes.

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
