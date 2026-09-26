#!/usr/bin/env python3
"""Apply committed SQL migrations only to the retained legacy staging copy."""

import hashlib
import json
import os
import pwd
import re
import subprocess
import uuid
from pathlib import Path

TARGET = 'nomad_story18_copy_20260926'
ROOT = Path('/srv/nomad-postgres-backups/main/story18-copy-20260926')
MIGRATIONS = ROOT / 'checkout/packages/prisma/migrations'


def query(database: str, sql: str) -> list[str]:
    result = subprocess.run(['psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-d', database,
                             '-c', sql], capture_output=True, check=True, timeout=30)
    return result.stdout.decode().splitlines()


def main() -> None:
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres':
        raise RuntimeError('must run as postgres')
    clone = json.loads((ROOT / 'clone-verified.json').read_text())
    if clone.get('result') != 'passed' or clone.get('copyDatabase') != TARGET:
        raise RuntimeError('isolated copy identity mismatch')
    names = sorted(path.name for path in MIGRATIONS.iterdir() if (path / 'migration.sql').is_file())
    if len(names) != 9 or not all(re.fullmatch(r'[0-9]{14}_[a-z0-9_]+', name) for name in names):
        raise RuntimeError('unexpected migration set')
    applied = query(TARGET, 'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name')
    if applied != names[:2]:
        raise RuntimeError('legacy migration prefix mismatch')
    completed = []
    with (ROOT / 'migration.log').open('xb') as log:
        for name in names[2:]:
            file = MIGRATIONS / name / 'migration.sql'
            checksum = hashlib.sha256(file.read_bytes()).hexdigest()
            subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-d', TARGET,
                            '-f', str(file)], stdout=log, stderr=log, check=True, timeout=120)
            migration_id = str(uuid.uuid4())
            sql = ("INSERT INTO _prisma_migrations (id,checksum,finished_at,migration_name,logs,applied_steps_count) "
                   f"VALUES ('{migration_id}','{checksum}',CURRENT_TIMESTAMP,'{name}',NULL,1)")
            query(TARGET, sql)
            completed.append(name)
    final = query(TARGET, 'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name')
    if final != names:
        raise RuntimeError('final migration set mismatch')
    copy_counts = {table: int(query(TARGET, f'SELECT count(*) FROM "{table}"')[0])
                   for table in ('User', 'IngestJob', 'Inspiration', 'ImportRecord')}
    source_counts = {table: int(query('nomad_staging', f'SELECT count(*) FROM "{table}"')[0])
                     for table in ('User', 'IngestJob', 'Inspiration')}
    if any(copy_counts[table] != clone['copyCounts'][table] for table in source_counts):
        raise RuntimeError('copy aggregate changed by migration')
    report = {'result': 'passed', 'copyDatabase': TARGET, 'sourceDatabase': 'nomad_staging',
              'committedMigrationCount': len(names), 'newlyAppliedMigrationCount': len(completed),
              'copyCounts': copy_counts, 'sourceCounts': source_counts,
              'sourceCountsUnchanged': source_counts == clone['sourceCounts'],
              'sourceMigrated': False, 'copyVersionMatched': True,
              'privateLog': str(ROOT / 'migration.log')}
    (ROOT / 'migration-verified.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'STORY18_COPY_MIGRATION_FAILED',
                          'sourceMigrated': False, 'privateArtifactsRetained': True}))
        raise SystemExit(1)
