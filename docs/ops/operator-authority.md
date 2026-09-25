# Minimal operator authority

Story1.0 provides `/ops` for desktop Web and `/ops/me` plus `/ops/access-check` on the API.
A normal account has no operator capabilities. Native bearer sessions cannot use this desktop entry.
The access-check action writes only an audit receipt; future place correction, brand rules and8.x
business actions must call `lockOperatorAuthority` within their own write transaction.

Capabilities are `places.correct`, `brand.rules`, `ops.workbench`, `ops.prompts`, `ops.rollout` and
`ops.usage`. Scope is exact: no wildcard expansion or client-supplied role inheritance. Each grant
has an explicit version and revocation record. Regrant increments the version; an old receipt or
cached UI never reauthorizes an old version.

An authorized maintainer prepares a local0600 JSON file with `ownerId` (verified stable UUID),
`capability`, `scope`, `expectedVersion` (0 for a new grant), `enabled`, `approvedBy` and `evidence`.
Do not put credentials or this private input into Git. The input records a real approval; it cannot
create that approval by itself. No real operator account has been granted by the Story's tests.

Validate without modifying the database:

```bash
node --import tsx apps/server/scripts/auth-operator-grant.ts /absolute/private/grant.json
```

Once that specific grant/revocation is authorized, run the same command with `--apply` and the
intended database supplied through the approved local environment. Revocation uses `enabled:false`
and the current version. The helper rejects an HTTP actor context and audits the change. Never
create an HTTP route that invokes this maintenance helper or accepts an `admin` flag from a client.

The browser keeps one operation ID after an unknown access-check result and rechecks authorization
before replay. A503 is not evidence that a write did not happen. The latest synthetic PG and browser
proof is recorded in `_bmad-output/implementation-artifacts/story-1-0-dev-progress-2026-09-19.md`;
real identities, real retained data, production operations and future business pages remain separate.
