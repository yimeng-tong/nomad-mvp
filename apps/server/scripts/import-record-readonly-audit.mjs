import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
  const expectedChecksums = new Map(await Promise.all(expected.map(async (name) => [name,
    createHash('sha256').update(await readFile(join(migrationsRoot, name, 'migration.sql'))).digest('hex')])));
  client = new Client({ connectionString: process.env.DATABASE_URL, application_name: 'nomad-story-1-8-readonly-audit' });
  await client.connect();
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  inTransaction = true;
  await client.query("SET LOCAL statement_timeout = '15s'");
  await client.query("SET LOCAL lock_timeout = '1s'");
  const mode = await client.query('SHOW transaction_read_only');
  if (mode.rows[0]?.transaction_read_only !== 'on') throw new Error('READ_ONLY_NOT_CONFIRMED');
  const applied = await client.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name');
  const names = applied.rows.map((row) => row.migration_name);
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('MIGRATION_MISMATCH');
  if (applied.rows.some((row) => !row.finished_at || row.rolled_back_at
    || expectedChecksums.get(row.migration_name) !== row.checksum)) throw new Error('MIGRATION_CHECKSUM_MISMATCH');
  await client.query('SELECT id,"userId",job_id,normalized_url,active_normalized_url,normalization_version,original_url_protected,status,deleted_at FROM "ImportRecord" LIMIT 0');
  await client.query('SELECT deleted_at FROM "IngestJob" LIMIT 0');
  await client.query('SELECT deleted_at FROM "Inspiration" LIMIT 0');
  const guards = await client.query(`SELECT (
    NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_userId_normalized_url_key')
    AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_userId_active_normalized_url_key' AND i.indisunique AND i.indisvalid)
    AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid='"ImportRecord"'::regclass AND c.relname='ImportRecord_id_userId_key' AND i.indisunique AND i.indisvalid)
    AND EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid='"IngestJob"'::regclass AND c.relname='IngestJob_id_userId_key' AND i.indisunique AND i.indisvalid)
    AND (SELECT count(*) FROM pg_constraint WHERE conrelid='"ImportRecord"'::regclass AND convalidated
      AND conname IN ('ImportRecord_userId_fkey','ImportRecord_job_id_userId_fkey','ImportRecord_normalized_url_check','ImportRecord_protected_url_check','ImportRecord_active_url_check'))=5
    AND EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='"Inspiration"'::regclass AND convalidated
      AND conname='Inspiration_import_record_id_userId_fkey')
  ) AS ok`);
  if (guards.rows[0]?.ok !== true) throw new Error('SCHEMA_GUARD_MISMATCH');
  const jobs = await rows('SELECT id, "userId", source_url AS "sourceUrl", source_hash AS "sourceHash", auth_version AS "authVersion", deleted_at AS "deletedAt" FROM "IngestJob" ORDER BY id LIMIT $1');
  const records = await rows('SELECT id, "userId", job_id AS "jobId", normalized_url AS "normalizedUrl", active_normalized_url AS "activeNormalizedUrl", normalization_version AS "normalizationVersion", deleted_at AS "deletedAt" FROM "ImportRecord" ORDER BY id LIMIT $1');
  const inspirations = await rows('SELECT id, "userId", "jobId", canonical_url AS "canonicalUrl", import_record_id AS "importRecordId", deleted_at AS "deletedAt" FROM "Inspiration" ORDER BY id LIMIT $1');
  const summary = analyzeLegacyImports({ jobs, records, inspirations });
  await client.query('ROLLBACK');
  inTransaction = false;
  const report = { ...summary, schemaMatched: true, migrationChecksumsMatched: true,
    targetedSchemaGuardsMatched: true,
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
  const code = error instanceof Error && ['ROW_LIMIT', 'MIGRATION_MISMATCH', 'MIGRATION_CHECKSUM_MISMATCH',
    'SCHEMA_GUARD_MISMATCH', 'READ_ONLY_NOT_CONFIRMED', 'DATABASE_UNAVAILABLE'].includes(error.message)
    ? error.message : 'AUDIT_FAILED';
  process.stderr.write(`${JSON.stringify({ code: `IMPORT_${code}`, readOnly: true, changesApplied: false })}\n`);
  process.exitCode = 1;
} finally {
  if (inTransaction) try { await client.query('ROLLBACK'); } catch { /* connection can already be gone */ }
  if (client) await client.end().catch(() => undefined);
}
