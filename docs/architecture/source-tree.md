# Source Tree & Workspaces

This document summarizes the repository layout and key workspace locations (see also `./repo-structure.md`).

```text
apps/
  server/            # Fastify app, routes, SSE, jobs
  mobile/            # RN/Flutter (TBD)
packages/
  prisma/            # Prisma schema & client
  types/             # OpenAPI-generated TS types
  ui/                # Shared UI (TBD)
  prompt/            # Prompts & promptfoo
infra/               # IaC, CI/CD, monitoring
scripts/             # Synthetic probes, utilities
```

## Workspace & Conventions

- Package manager: pnpm
- Workspaces: `pnpm-workspace.yaml`
- API contracts: `docs/api/openapi.yaml`
- DB: `docs/db/schema.sql` + `packages/prisma/schema.prisma`
- Ops: `docs/ops/*` (rate limits, errors, analytics)

See `./repo-structure.md` for the original proposal; this page is the stable v0.4 reference and is linked from `index.md`.

