#!/usr/bin/env python3
"""Start a restored private socket cluster, verify target-time rows, then stop it."""

import json
import os
import pwd
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path('/srv/nomad-postgres-backups/main/pitr-restore-20260927')
DATA = ROOT / 'restored-data'
SOCKET = ROOT / 'socket'
PORT = '55432'
PROBE = 'nomad_pitr_probe_20260927'
PG = Path('/usr/lib/postgresql/16/bin')


def run(args: list[str], timeout=30) -> str:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                          check=True, timeout=timeout).stdout.decode().strip()


def query(database: str, statement: str, restored=True) -> str:
    args = ['psql', '-XqAt', '-v', 'ON_ERROR_STOP=1']
    if restored:
        args += ['-h', str(SOCKET), '-p', PORT]
    return run([*args, '-d', database, '-c', statement], timeout=20)


def main() -> None:
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres' or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong user or host')
    metadata = json.loads((ROOT / 'restore-metadata.json').read_text())
    if metadata.get('result') != 'passed' or metadata.get('restoredDataPath') != str(DATA):
        raise RuntimeError('restore identity mismatch')
    retry = sys.argv[1:] == ['--retry-after-startup-failure']
    if SOCKET.exists():
        if not retry or (ROOT / 'pitr-verified.json').exists() \
                or (ROOT / 'restored-postgres-first-failure.log').exists() \
                or not (ROOT / 'restored-postgres.log').is_file():
            raise RuntimeError('retry preflight mismatch')
        active = subprocess.run([str(PG / 'pg_ctl'), '-D', str(DATA), 'status'],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                check=False).returncode == 0
        if active:
            raise RuntimeError('restored cluster still running')
        (ROOT / 'restored-postgres.log').rename(ROOT / 'restored-postgres-first-failure.log')
    else:
        if retry:
            raise RuntimeError('missing first failure evidence')
        SOCKET.mkdir(mode=0o700)
    (DATA / 'postgresql.conf').write_text(
        "listen_addresses = ''\n"
        f"port = {PORT}\n"
        f"unix_socket_directories = '{SOCKET}'\n"
        "hot_standby = on\narchive_mode = off\n"
        "default_transaction_read_only = on\nshared_buffers = '128MB'\n"
        "max_connections = 100\nmax_wal_senders = 10\nmax_worker_processes = 8\n"
        "max_locks_per_transaction = 64\nmax_prepared_transactions = 0\n")
    (DATA / 'pg_hba.conf').write_text('local all postgres peer\nlocal all all reject\n')
    (DATA / 'pg_ident.conf').write_text('')
    started = False
    try:
        run([str(PG / 'pg_ctl'), '-D', str(DATA), '-l', str(ROOT / 'restored-postgres.log'),
             '-o', f'-c config_file={DATA / "postgresql.conf"}', '-w', '-t', '90', 'start'], timeout=100)
        started = True
        state = ''
        for _ in range(45):
            state = query('postgres', "SELECT pg_is_in_recovery()::text || ':' || pg_get_wal_replay_pause_state()")
            if state == 'true:paused':
                break
            time.sleep(2)
        if state != 'true:paused':
            raise RuntimeError('recovery did not pause at target')
        restored_rows = query(PROBE, 'SELECT string_agg(id::text,\',\' ORDER BY id) FROM pitr_marker')
        source_rows = query(PROBE, 'SELECT string_agg(id::text,\',\' ORDER BY id) FROM pitr_marker', restored=False)
        if restored_rows != '1' or source_rows != '1,2':
            raise RuntimeError('PITR marker mismatch')
        report = {'result': 'passed', 'targetTimeUtc': metadata['targetTimeUtc'],
          'selectedBaseBackup': metadata['selectedBaseBackup'],
          'restoredMarkerIds': [1], 'sourceMarkerIds': [1, 2],
          'recoveryPausedAtTarget': True, 'restoredInstanceTcpEnabled': False,
          'applicationWorkersStartedOnRestore': False, 'sourceClusterStopped': False,
          'sourceNomadDatabasesChanged': False, 'restoredArtifactsRetained': True}
        # A passing report must mean the drill instance was actually stopped.
        run([str(PG / 'pg_ctl'), '-D', str(DATA), '-m', 'fast', '-w',
             '-t', '60', 'stop'], timeout=70)
        started = False
        if subprocess.run([str(PG / 'pg_ctl'), '-D', str(DATA), 'status'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                          check=False).returncode == 0:
            raise RuntimeError('restored cluster still running after stop')
        (ROOT / 'pitr-verified.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, sort_keys=True))
    finally:
        if started or subprocess.run([str(PG / 'pg_ctl'), '-D', str(DATA), 'status'],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                     check=False).returncode == 0:
            subprocess.run([str(PG / 'pg_ctl'), '-D', str(DATA), '-m', 'fast', '-w',
                            '-t', '60', 'stop'], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL, check=False, timeout=70)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'PITR_TARGET_VERIFICATION_FAILED',
                          'privateLogsAndRestoredDataRetained': True, 'sourceClusterStopped': False}))
        sys.exit(1)
