# Repository Structure (proposed)

```
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

- Package manager: pnpm
- Workspaces: `pnpm-workspace.yaml`
- API contracts: `docs/api/openapi.yaml`
- DB: `docs/db/schema.sql` + `packages/prisma/schema.prisma`
- Ops: `docs/ops/*` (limits, errors, observability)
