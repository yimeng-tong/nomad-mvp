#!/usr/bin/env python3
"""Restore encrypted S3 base backup plus WAL to a fresh isolated data path."""

import datetime
import json
import os
import pwd
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path('/srv/nomad-postgres-backups/main/pitr-restore-20260927')
TARGET = ROOT / 'restored-data'
CONFIG = '/etc/pgbackrest/nomad-main.conf'
EXPECTED_SYSTEM_ID = '7667023586002737104'


def main() -> None:
    if pwd.getpwuid(os.geteuid()).pw_name != 'postgres' or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong user or host')
    marker = json.loads((ROOT / 'marker.json').read_text())
    if marker.get('result') != 'passed' or TARGET.exists():
        raise RuntimeError('marker or target mismatch')
    info = subprocess.check_output(['pgbackrest', f'--config={CONFIG}', '--stanza=nomad-main',
                                    '--log-level-console=off', '--output=json', 'info'], timeout=30)
    backups = json.loads(info)[0]['backup']
    target_epoch = datetime.datetime.fromisoformat(marker['targetTimeUtc']).timestamp()
    eligible = [item for item in backups if item['timestamp']['stop'] < target_epoch]
    if not eligible:
        raise RuntimeError('no base backup predates target')
    selected = max(eligible, key=lambda item: item['timestamp']['stop'])
    TARGET.mkdir(mode=0o700)
    log = ROOT / 'restore.log'
    with log.open('xb') as output:
        result = subprocess.run(['pgbackrest', f'--config={CONFIG}', '--stanza=nomad-main',
          f'--pg1-path={TARGET}', f'--set={selected["label"]}', '--type=time',
          f'--target={marker["targetTimeUtc"]}', '--target-action=pause', '--archive-mode=off',
          '--log-level-console=off', 'restore'], stdout=output,
          stderr=subprocess.STDOUT, check=False, timeout=600)
    if result.returncode:
        raise RuntimeError('restore failed')
    control = subprocess.check_output(['/usr/lib/postgresql/16/bin/pg_controldata', str(TARGET)],
                                      text=True, timeout=20)
    if not re.search(r'^Database system identifier:\s*' + EXPECTED_SYSTEM_ID + r'\s*$',
                     control, re.MULTILINE):
        raise RuntimeError('restored cluster identity mismatch')
    auto = (TARGET / 'postgresql.auto.conf').read_text()
    if not (TARGET / 'recovery.signal').is_file() or 'recovery_target_time' not in auto \
            or 'restore_command' not in auto:
        raise RuntimeError('recovery configuration missing')
    report = {'result': 'passed', 'restoredDataPath': str(TARGET),
              'selectedBaseBackup': selected['label'], 'targetTimeUtc': marker['targetTimeUtc'],
              'clusterSystemIdMatched': True, 'recoverySignalPresent': True,
              'restoreCommandIncludesCustomConfig': CONFIG in auto,
              'sourceClusterStopped': False, 'restoredClusterStarted': False,
              'sourceNomadDatabasesChanged': False, 'privateArtifactsRetained': True}
    (ROOT / 'restore-metadata.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'PITR_RESTORE_FAILED',
                          'sourceClusterStopped': False, 'privateArtifactsRetained': True}))
        sys.exit(1)
