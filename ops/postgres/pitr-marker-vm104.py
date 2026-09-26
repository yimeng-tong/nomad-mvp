#!/usr/bin/env python3
"""Create synthetic before/after commits for a real target-time restore drill."""

import json
import os
import pwd
import subprocess
import sys
import time
from pathlib import Path

DATABASE = 'nomad_pitr_probe_20260927'
ROOT = Path('/srv/nomad-postgres-backups/main/pitr-restore-20260927')
CONFIG = '/etc/pgbackrest/nomad-main.conf'


def run(args: list[str], timeout=60) -> bytes:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                          check=True, timeout=timeout).stdout


def sql(database: str, statement: str) -> str:
    return run(['psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-d', database,
                '-c', statement], timeout=30).decode().strip()


def main() -> None:
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres' or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong user or host')
    if ROOT.exists() or sql('postgres', 'SHOW archive_mode') != 'on':
        raise RuntimeError('preflight mismatch')
    information = json.loads(run(['pgbackrest', f'--config={CONFIG}', '--stanza=nomad-main',
                                  '--log-level-console=off', '--output=json', 'info']))
    if not information or len(information[0].get('backup', [])) < 1:
        raise RuntimeError('full backup unavailable')
    ROOT.mkdir(mode=0o700)
    if sql('postgres', f"SELECT count(*) FROM pg_database WHERE datname='{DATABASE}'") != '0':
        raise RuntimeError('synthetic database already exists')
    run(['createdb', DATABASE])
    sql('postgres', f'REVOKE CONNECT ON DATABASE {DATABASE} FROM PUBLIC')
    sql(DATABASE, 'CREATE TABLE pitr_marker (id integer PRIMARY KEY, phase text NOT NULL)')
    sql(DATABASE, "INSERT INTO pitr_marker (id,phase) VALUES (1,'before-target')")
    target = sql('postgres', "SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') || '+00'")
    time.sleep(2)
    sql(DATABASE, "INSERT INTO pitr_marker (id,phase) VALUES (2,'after-target')")
    sql('postgres', 'SELECT pg_switch_wal()')
    log = ROOT / 'archive-check.log'
    with log.open('xb') as output:
        result = subprocess.run(['pgbackrest', f'--config={CONFIG}', '--stanza=nomad-main',
                                 '--log-level-console=off', 'check'], stdout=output,
                                stderr=subprocess.STDOUT, check=False, timeout=120)
    if result.returncode:
        raise RuntimeError('archive check failed')
    if sql(DATABASE, 'SELECT count(*) FROM pitr_marker') != '2':
        raise RuntimeError('source marker mismatch')
    report = {'result': 'passed', 'sourceDatabase': DATABASE, 'targetTimeUtc': target,
              'sourceMarkerCount': 2, 'targetExpectedMarkerCount': 1,
              'fullBackupAvailable': True, 'archiveCheckPassed': True,
              'nomadDatabasesChanged': False, 'privateDirectory': str(ROOT)}
    (ROOT / 'marker.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'PITR_MARKER_PREP_FAILED',
                          'sourceArtifactsRetained': True, 'nomadDatabasesChanged': False}))
        sys.exit(1)
