# Source Tree and Workspaces

```text
apps/
  mobile/           # React/Vite mobile-first client
  server/           # Fastify routes, services, SSE and jobs
packages/
  prisma/           # Prisma schema/client and persistence package
  types/            # OpenAPI-generated TypeScript contracts
docs/
  api/              # OpenAPI SSOT
  architecture/     # current architecture shards
  ops/              # limits, errors and runbooks
_bmad-output/
  planning-artifacts/
  implementation-artifacts/
scripts/            # probes and handoff checks
ops/                # deployment/staging assets
```

## Ownership Boundaries

- `apps/mobile`: presentation state and API client only; no Provider secrets or invented facts.
- `apps/server`: authentication, domain commands, orchestration, integrations and SSE.
- `packages/prisma`: persistence schema; migration required for durable contract changes.
- `packages/types`: generated from `docs/api/openapi.yaml`; do not hand-edit.
- `_bmad-output/implementation-artifacts`: story and sprint execution authority after planning.

Use `pnpm -F nomad-types run generate`, focused package tests, then `pnpm -r build` for
contract changes. The actual repository structure wins over older proposed RN/Flutter trees.
