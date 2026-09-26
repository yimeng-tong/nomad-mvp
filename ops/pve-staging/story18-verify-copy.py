#!/usr/bin/env python3
"""Read-only migration checksum and Story 1.8 schema check on the retained copy."""

import hashlib
import json
import os
import pwd
import subprocess
from pathlib import Path

ROOT = Path('/srv/nomad-postgres-backups/main/story18-copy-20260926')
MIGRATIONS = ROOT / 'checkout/packages/prisma/migrations'
COPY = 'nomad_story18_copy_20260926'
SOURCE = 'nomad_staging'
REPORT = ROOT / 'copy-version-verified-20260927.json'


def query(database, statement):
    result = subprocess.run(['psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-d', database,
                             '-c', statement], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            check=True, timeout=30)
    return result.stdout.decode().splitlines()


def applied(database):
    return query(database, "SELECT migration_name || ':' || checksum FROM _prisma_migrations "
                 'WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name')


def main():
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres' or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong user or host')
    clone = json.loads((ROOT / 'clone-verified.json').read_text())
    if clone.get('result') != 'passed' or clone.get('copyDatabase') != COPY or REPORT.exists():
        raise RuntimeError('copy provenance or report preflight failed')
    names = sorted(path.name for path in MIGRATIONS.iterdir() if (path / 'migration.sql').is_file())
    if len(names) != 9:
        raise RuntimeError('unexpected migration count')
    expected = [f'{name}:{hashlib.sha256((MIGRATIONS / name / "migration.sql").read_bytes()).hexdigest()}'
                for name in names]
    if applied(SOURCE) != expected[:2] or applied(COPY) != expected:
        raise RuntimeError('source or copy migration checksum mismatch')
    if query(COPY, 'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL') != ['0']:
        raise RuntimeError('copy migration failure or rollback recorded')
    query(COPY, 'SELECT id,"userId",job_id,normalized_url,active_normalized_url,normalization_version,'
                'original_url_protected,status,deleted_at FROM "ImportRecord" LIMIT 0')
    query(COPY, 'SELECT deleted_at FROM "IngestJob" LIMIT 0')
    query(COPY, 'SELECT deleted_at FROM "Inspiration" LIMIT 0')
    guards = query(COPY, '''SELECT (
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
    )''')
    if guards != ['t']:
        raise RuntimeError('Story 1.8 schema guard mismatch')
    source_counts = {table: int(query(SOURCE, f'SELECT count(*) FROM "{table}"')[0])
                     for table in ('User', 'IngestJob', 'Inspiration')}
    copy_counts = {table: int(query(COPY, f'SELECT count(*) FROM "{table}"')[0])
                   for table in ('User', 'IngestJob', 'Inspiration')}
    if source_counts != clone['sourceCounts'] or copy_counts != clone['copyCounts']:
        raise RuntimeError('source or copy count drift')
    report = {'result': 'passed', 'sourceMigrationCount': 2, 'copyMigrationCount': 9,
              'sourceAndCopyChecksumsMatched': True, 'targetedStory18SchemaGuardsMatched': True,
              'fullDatamodelDiffVerified': False, 'sourceCountsUnchanged': True,
              'copyCountsUnchanged': True, 'readOnly': True,
              'sourceMigrated': False, 'rawRowsEmitted': False}
    with REPORT.open('x') as output:
        json.dump(report, output, indent=2)
        output.write('\n')
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'COPY_VERSION_VERIFICATION_FAILED',
                          'sourceMigrated': False, 'rawRowsEmitted': False}))
        raise SystemExit(1)
