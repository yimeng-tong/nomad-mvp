import { createHash } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { analyzeLegacyImports } from '../src/ingest/import-record-audit.js';

const { Client } = pg;
const migrationsRoot = fileURLToPath(new URL('../../../packages/prisma/migrations/', import.meta.url));
const maxRowsPerTable = 20_000;
let client;
let inTransaction = false;

async function rows(sql) {
  const result = await client.query(sql, [maxRowsPerTable + 1]);
  if (result.rows.length > maxRowsPerTable) throw new Error('ROW_LIMIT');
  return result.rows;
}

try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_UNAVAILABLE');
  const expected = (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  client = new Client({ connectionString: process.env.DATABASE_URL, application_name: 'nomad-story-1-8-readonly-audit' });
  await client.connect();
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  inTransaction = true;
  await client.query("SET LOCAL statement_timeout = '15s'");
  await client.query("SET LOCAL lock_timeout = '1s'");
  const mode = await client.query('SHOW transaction_read_only');
  if (mode.rows[0]?.transaction_read_only !== 'on') throw new Error('READ_ONLY_NOT_CONFIRMED');
  const applied = await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name');
  const names = applied.rows.map((row) => row.migration_name);
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('MIGRATION_MISMATCH');
  const jobs = await rows('SELECT id, "userId", source_url AS "sourceUrl", source_hash AS "sourceHash", auth_version AS "authVersion", deleted_at AS "deletedAt" FROM "IngestJob" ORDER BY id LIMIT $1');
  const records = await rows('SELECT id, "userId", job_id AS "jobId", normalized_url AS "normalizedUrl", active_normalized_url AS "activeNormalizedUrl", normalization_version AS "normalizationVersion", deleted_at AS "deletedAt" FROM "ImportRecord" ORDER BY id LIMIT $1');
  const inspirations = await rows('SELECT id, "userId", "jobId", canonical_url AS "canonicalUrl", import_record_id AS "importRecordId", deleted_at AS "deletedAt" FROM "Inspiration" ORDER BY id LIMIT $1');
  const summary = analyzeLegacyImports({ jobs, records, inspirations });
  await client.query('ROLLBACK');
  inTransaction = false;
  const report = { ...summary, schemaMatched: true,
    migrationSetSha256: createHash('sha256').update(names.join('\n')).digest('hex'),
    sourceRevision: process.env.GITHUB_SHA ?? null,
    rowLimitPerTable: maxRowsPerTable,
    automaticBackfillAllowed: false,
    scope: 'version-matched-snapshot-read-only; no URL, owner, job, hash or envelope emitted' };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (process.env.NOMAD_IMPORT_AUDIT_REPORT) {
    await mkdir(dirname(process.env.NOMAD_IMPORT_AUDIT_REPORT), { recursive: true, mode: 0o700 });
    await writeFile(process.env.NOMAD_IMPORT_AUDIT_REPORT, output, { flag: 'wx', mode: 0o600 });
  } else process.stdout.write(output);
} catch (error) {
  const code = error instanceof Error && ['ROW_LIMIT', 'MIGRATION_MISMATCH', 'READ_ONLY_NOT_CONFIRMED', 'DATABASE_UNAVAILABLE'].includes(error.message)
    ? error.message : 'AUDIT_FAILED';
  process.stderr.write(`${JSON.stringify({ code: `IMPORT_${code}`, readOnly: true, changesApplied: false })}\n`);
  process.exitCode = 1;
} finally {
  if (inTransaction) try { await client.query('ROLLBACK'); } catch { /* connection can already be gone */ }
  if (client) await client.end().catch(() => undefined);
}
