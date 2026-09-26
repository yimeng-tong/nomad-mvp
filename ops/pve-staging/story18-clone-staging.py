#!/usr/bin/env python3
"""Retain a read-only source dump and isolated Story 1.8 migration copy on VM104."""

import hashlib
import json
import os
import pwd
import subprocess
from pathlib import Path

SOURCE = 'nomad_staging'
TARGET = 'nomad_story18_copy_20260926'
BACKUP_ROOT = Path('/srv/nomad-postgres-backups/main')
ROOT = BACKUP_ROOT / 'story18-copy-20260926'


def run(args: list[str], log) -> None:
    subprocess.run(args, stdout=log, stderr=log, check=True, timeout=300)


def query(database: str, expression: str) -> str:
    result = subprocess.run(['psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-d', database,
                             '-c', expression], capture_output=True, check=True, timeout=20)
    return result.stdout.decode().strip()


def counts(database: str) -> dict[str, int]:
    return {table: int(query(database, f'SELECT count(*) FROM "{table}"'))
            for table in ('User', 'IngestJob', 'Inspiration')}


def main() -> None:
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres':
        raise RuntimeError('must run as postgres')
    markers = sorted(BACKUP_ROOT.glob('backup-*.verified.json'))
    if not markers:
        raise RuntimeError('physical backup required')
    latest = json.loads(markers[-1].read_text())
    if latest.get('result') != 'passed' or latest.get('systemIdentifier') != \
            query('postgres', 'SELECT system_identifier FROM pg_control_system()'):
        raise RuntimeError('physical backup identity mismatch')
    if query('postgres', f'SELECT count(*) FROM pg_database WHERE datname=\'{TARGET}\'') != '0':
        raise RuntimeError('copy already exists')
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=False)
    dump = ROOT / 'source-before-story18.dump'
    log_path = ROOT / 'clone.log'
    source_counts = counts(SOURCE)
    with log_path.open('xb') as log:
        run(['pg_dump', '-Fc', '--no-acl', '-f', str(dump), SOURCE], log)
        dump.chmod(0o600)
        run(['createdb', '-O', 'postgres', TARGET], log)
        run(['pg_restore', '--exit-on-error', '--no-owner', '--no-acl',
             '-d', TARGET, str(dump)], log)
    copied_counts = counts(TARGET)
    if copied_counts != source_counts:
        raise RuntimeError('copy aggregate mismatch')
    with dump.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    report = {'result': 'passed', 'sourceDatabase': SOURCE, 'copyDatabase': TARGET,
              'sourceCounts': source_counts, 'copyCounts': copied_counts,
              'dumpSha256': digest,
              'dumpBytes': dump.stat().st_size, 'sourceChanged': False,
              'copyMigrated': False, 'privateArtifacts': str(ROOT)}
    (ROOT / 'clone-verified.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'STORY18_CLONE_FAILED',
                          'sourceChanged': False, 'privateArtifactsRetained': True}))
        raise SystemExit(1)
