# Prisma migration baseline

`20260726000000_legacy_baseline` represents the schema that existed before
Story 2.1. Fresh databases apply it and then the Story 2.1 incremental
migration.

For an existing legacy database whose tables were created before migration
history was introduced, mark only the legacy baseline as applied before
deploying:

```bash
pnpm -F nomad-prisma exec prisma migrate resolve --applied 20260726000000_legacy_baseline
pnpm -F nomad-prisma exec prisma migrate deploy
```

The Story 2.1 migration maps `fast` pace to `tight`; `normal` and `slow` map to
`comfortable`.
