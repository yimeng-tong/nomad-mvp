import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationName = '20260926000200_story_1_8_deletion_lifecycle_foundation';
const upgradeDatabase = 'nomad_auth_test_import_upgrade';
const migrationRoot = fileURLToPath(new URL('../../../packages/prisma/migrations/', import.meta.url));
const reportPath = process.env.NOMAD_IMPORT_UPGRADE_REPORT || '/tmp/nomad-import-record-upgrade-probe.json';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK, 'isolated-synthetic-only');
assert.ok(process.env.DATABASE_URL);
const target = new URL(process.env.DATABASE_URL);
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname));
assert.match(target.pathname, /^\/nomad_auth_test_[a-z0-9_]+$/u);
assert.notEqual(target.pathname, `/${upgradeDatabase}`);

const pgEnv = { ...process.env, PGHOST: target.hostname, PGPORT: target.port || '5432',
  PGUSER: decodeURIComponent(target.username), PGPASSWORD: decodeURIComponent(target.password), PGSSLMODE: 'disable' };
const sourceDatabase = target.pathname.slice(1);
const checks = [];
let created = false;
let failure = null;

function psql(database, args, stage) {
  const result = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-d', database, ...args],
    { env: pgEnv, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`IMPORT_UPGRADE_${stage}_FAILED`);
  return result.stdout.trim();
}

try {
  psql(sourceDatabase, ['-c', `CREATE DATABASE ${upgradeDatabase}`], 'CREATE_DATABASE');
  created = true;
  const migrations = readdirSync(migrationRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name < migrationName)
    .map((entry) => entry.name).sort();
  assert.equal(migrations.at(-1), '20260926000100_story_1_8_import_record_foundation');
  for (const name of migrations) psql(upgradeDatabase,
    ['-f', join(migrationRoot, name, 'migration.sql')], `PRIOR_${name}`);
  checks.push('all-prior-sql-migrations-applied-to-separate-guarded-database');

  // A valid, synthetic protected-envelope shape is enough for this migration
  // check. No key is provisioned, decrypted, printed, or sent to a provider.
  psql(upgradeDatabase, ['-c', `
    INSERT INTO "User" (id, auth_state) VALUES ('10000000-0000-4000-8000-000000000201', 'active');
    INSERT INTO "IngestJob" (id, "userId", source_type, source_hash, auth_version)
      VALUES ('10000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000201', 'xhs', 'synthetic-upgrade-source-hash', 0);
    INSERT INTO "ImportRecord" (id, "userId", job_id, normalized_url, normalization_version, original_url_protected)
      VALUES ('10000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000201',
        '10000000-0000-4000-8000-000000000202', 'https://www.xiaohongshu.com/explore/synthetic-upgrade',
        'xhs-import-v1', '{"version":"1","key_id":"synthetic","iv":"synthetic","tag":"synthetic","ciphertext":"synthetic"}'::jsonb);
  `], 'SEED_PRIOR_RECORD');
  checks.push('pre-upgrade-owner-job-and-record-seeded-without-a-real-url-key');

  psql(upgradeDatabase, ['-f', join(migrationRoot, migrationName, 'migration.sql')], 'NEW_MIGRATION');
  const preserved = psql(upgradeDatabase, ['-A', '-t', '-c', `
    SELECT count(*) FROM "ImportRecord" WHERE id='10000000-0000-4000-8000-000000000203'
      AND normalized_url='https://www.xiaohongshu.com/explore/synthetic-upgrade'
      AND normalization_version='xhs-import-v1'
      AND active_normalized_url=normalized_url AND deleted_at IS NULL;
  `], 'VERIFY_PRESERVED_RECORD');
  assert.equal(preserved, '1');
  checks.push('prior-record-keeps-immutable-url-and-version-with-active-key-backfilled');

  assert.equal(psql(upgradeDatabase, ['-A', '-t', '-c', `
    SELECT count(*) FROM "IngestJob" WHERE id='10000000-0000-4000-8000-000000000202' AND deleted_at IS NULL;
  `], 'VERIFY_JOB'), '1');
  psql(upgradeDatabase, ['-c', 'SELECT deleted_at FROM "Inspiration" LIMIT 0'], 'VERIFY_INSPIRATION_COLUMN');
  checks.push('prior-job-preserved-and-inspiration-tombstone-column-available');

  assert.equal(psql(upgradeDatabase, ['-A', '-t', '-c', `
    SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid='"ImportRecord"'::regclass AND i.indisunique
        AND c.relname IN ('ImportRecord_userId_normalized_url_key','ImportRecord_userId_active_normalized_url_key');
  `], 'VERIFY_INDEXES'), '2');
  checks.push('old-and-new-owner-unique-indexes-coexist-before-delete-is-enabled');
} catch (error) {
  failure = error instanceof Error ? error.message : 'IMPORT_UPGRADE_UNKNOWN_FAILURE';
} finally {
  if (created) {
    try { psql(sourceDatabase, ['-c', `DROP DATABASE ${upgradeDatabase} WITH (FORCE)`], 'DROP_DATABASE'); }
    catch { failure ??= 'IMPORT_UPGRADE_CLEANUP_FAILED'; }
  }
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ kind: 'story-1-8-isolated-upgrade-probe',
    headSha: process.env.GITHUB_SHA || null, checks, completed: failure === null && checks.length === 5,
    failureStage: failure, databaseScope: 'guarded-separate-synthetic-only', realProviderCalls: 0 }, null, 2) + '\n');
}
if (failure) throw new Error(failure);
