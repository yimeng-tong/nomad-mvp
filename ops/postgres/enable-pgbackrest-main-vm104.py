#!/usr/bin/env python3
"""Guarded VM104 main-cluster WAL archival and first encrypted full backup."""

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

EXPECTED_SYSTEM_ID = '7667023586002737104'
CONFIG = Path('/etc/postgresql/16/main/postgresql.conf')
BACKUP = Path('/etc/postgresql/16/main/postgresql.conf.before-nomad-pgbackrest-20260927')
PGBR = '/etc/pgbackrest/nomad-main.conf'
ARCHIVE_COMMAND = f'/usr/bin/pgbackrest --config={PGBR} --stanza=nomad-main archive-push %p'
LOG_DIR = Path('/etc/pgbackrest')


def command(args: list[str], timeout=90, stdout=None):
    return subprocess.run(args, stdout=stdout or subprocess.PIPE,
                          stderr=subprocess.DEVNULL, check=True, timeout=timeout)


def sql(query: str) -> str:
    return command(['runuser', '-u', 'postgres', '--', 'psql', '-XqAt', '-v', 'ON_ERROR_STOP=1',
                    '-d', 'postgres', '-c', query], timeout=20).stdout.decode().strip()


def pgbackrest(args: list[str], name: str, timeout: int) -> bytes:
    log = LOG_DIR / f'{name}-20260927.log'
    fd = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        result = subprocess.run(['runuser', '-u', 'postgres', '--', 'pgbackrest',
          f'--config={PGBR}', '--stanza=nomad-main', '--log-level-console=off', *args],
          stdout=subprocess.PIPE, stderr=output, check=False, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f'{name} failed')
    return result.stdout


def healthy() -> bool:
    return all(command(['curl', '--silent', '--fail', '--max-time', '3', url], timeout=5).returncode == 0
               for url in ('http://127.0.0.1:3000/health', 'http://127.0.0.1:43104/health'))


def main() -> None:
    if os.geteuid() != 0 or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong host')
    if BACKUP.exists() or not Path(PGBR).is_file():
        raise RuntimeError('preflight configuration mismatch')
    if sql('SELECT system_identifier FROM pg_control_system()') != EXPECTED_SYSTEM_ID \
            or sql('SHOW archive_mode') != 'off' or not healthy():
        raise RuntimeError('cluster preflight mismatch')
    shutil.copy2(CONFIG, BACKUP)
    try:
        # Any pg_conftool call may leave a mutation even when that call fails.
        changed = True
        command(['pg_conftool', '16', 'main', 'set', 'archive_command', ARCHIVE_COMMAND])
        command(['pg_conftool', '16', 'main', 'set', 'archive_timeout', '900s'])
        command(['pg_conftool', '16', 'main', 'set', 'archive_mode', 'on'])
        command(['systemctl', 'restart', 'postgresql@16-main.service'], timeout=90)
        for _ in range(20):
            if subprocess.run(['pg_isready', '-q'], check=False).returncode == 0:
                break
            time.sleep(1)
        if sql('SELECT system_identifier FROM pg_control_system()') != EXPECTED_SYSTEM_ID \
                or sql('SHOW archive_mode') != 'on' or sql('SHOW archive_command') != ARCHIVE_COMMAND:
            raise RuntimeError('archive settings not active')
        pgbackrest(['check'], 'check', 120)
        pgbackrest(['--type=full', 'backup'], 'first-full-backup', 1200)
        information = json.loads(pgbackrest(['--output=json', 'info'], 'first-backup-info', 60))
        if not information or not information[0].get('backup'):
            raise RuntimeError('no verified backup metadata')
        if not healthy():
            raise RuntimeError('application health failed')
        count = int(sql('SELECT archived_count FROM pg_stat_archiver'))
        if count < 1:
            raise RuntimeError('no archived WAL')
        print(json.dumps({'result': 'passed', 'clusterSystemId': EXPECTED_SYSTEM_ID,
          'archiveMode': 'on', 'archiveTimeoutSeconds': 900, 'archivedWalCountAtCheck': count,
          'fullBackupCount': len(information[0]['backup']), 'repositoryEncrypted': True,
          'separateBackupBucket': 'nomad-backups', 'stagingHealth': True,
          'developmentHealth': True, 'restoreVerified': False,
          'sourceDatabasesMigrated': False, 'secretValuesEmitted': False}))
    except Exception:
        if changed:
            shutil.copy2(BACKUP, CONFIG)
            subprocess.run(['systemctl', 'restart', 'postgresql@16-main.service'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                           check=False, timeout=90)
        raise


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'PGBACKREST_ARCHIVE_OR_BACKUP_FAILED',
          'priorConfigRetained': BACKUP.exists(), 'privateLogsRetained': True,
          'secretValuesEmitted': False}))
        sys.exit(1)
