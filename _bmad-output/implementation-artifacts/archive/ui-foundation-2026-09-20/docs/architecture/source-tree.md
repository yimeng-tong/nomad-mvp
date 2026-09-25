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

## App Target Directories (Approved 2026-09-19)

`apps/mobile/capacitor.config.ts`、`apps/mobile/android/`、`apps/mobile/ios/` 和 `apps/mobile/src/platform/` 是新增目标；复用已有 React/Vite 页面而非第二个 UI 栈。签名秘密/个人环境/build 输出不入 Git，原生源码与必要锁文件入 Git。实际实现进度见 Story9.1。
