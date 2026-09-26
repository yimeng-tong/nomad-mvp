#!/usr/bin/env python3
"""Prepare a separate encrypted S3 pgBackRest stanza without changing PostgreSQL."""

import grp
import json
import os
import secrets
import stat
import subprocess
import sys
from pathlib import Path

ROOT = Path('/etc/pgbackrest')
SOURCE = ROOT / 'backup-s3.env'
TARGET = ROOT / 'nomad-main.conf'
LOG = ROOT / 'stanza-create.log'


def main() -> None:
    if os.geteuid() != 0 or os.uname().nodename != 'nomad-staging':
        raise RuntimeError('wrong host')
    if TARGET.exists():
        raise RuntimeError('stanza config already exists')
    info = SOURCE.stat()
    if stat.S_IMODE(info.st_mode) != 0o640 or info.st_uid != 0 \
            or info.st_gid != grp.getgrnam('postgres').gr_gid:
        raise RuntimeError('backup credential permissions invalid')
    values = dict(line.split('=', 1) for line in SOURCE.read_text().splitlines() if '=' in line)
    if values.get('NOMAD_PG_BACKUP_BUCKET') != 'nomad-backups' or \
            values.get('NOMAD_PG_BACKUP_ENDPOINT') != 'https://objects.yinianyunqi.top:8333':
        raise RuntimeError('backup endpoint mismatch')
    key = values['NOMAD_PG_BACKUP_ACCESS_KEY_ID']
    secret = values['NOMAD_PG_BACKUP_SECRET_ACCESS_KEY']
    if len(key) < 12 or len(secret) < 32 or any(char in key + secret for char in '\n\r='):
        raise RuntimeError('backup credential invalid')
    cipher = secrets.token_urlsafe(48)
    contents = f'''[global]
repo1-type=s3
repo1-path=/nomad-main
repo1-s3-bucket=nomad-backups
repo1-s3-endpoint=objects.yinianyunqi.top
repo1-storage-port=8333
repo1-s3-uri-style=path
repo1-s3-region=us-east-1
repo1-s3-key={key}
repo1-s3-key-secret={secret}
repo1-storage-verify-tls=y
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass={cipher}
repo1-retention-full=7
repo1-retention-history=365
process-max=2
start-fast=y
log-path=/var/log/pgbackrest

[nomad-main]
pg1-path=/var/lib/postgresql/16/main
pg1-port=5432
pg1-socket-path=/var/run/postgresql
'''
    fd = os.open(TARGET, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
    with os.fdopen(fd, 'w') as output:
        output.write(contents)
    os.chown(TARGET, 0, grp.getgrnam('postgres').gr_gid)
    subprocess.run(['install', '-d', '-o', 'postgres', '-g', 'postgres', '-m', '0700',
                    '/var/log/pgbackrest'], check=True)
    fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        result = subprocess.run(['runuser', '-u', 'postgres', '--', 'pgbackrest',
          f'--config={TARGET}', '--stanza=nomad-main', '--log-level-console=off', 'stanza-create'],
          stdout=output, stderr=subprocess.STDOUT, check=False, timeout=90)
    if result.returncode:
        raise RuntimeError('stanza creation failed')
    print(json.dumps({'stanzaCreated': True, 'stanza': 'nomad-main',
                      'backupBucket': 'nomad-backups', 'repositoryEncrypted': True,
                      'fullBackupRetentionCount': 7, 'postgresConfigurationChanged': False,
                      'secretValuesEmitted': False}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'stanzaCreated': False, 'failureCategory': 'PGBACKREST_SETUP_FAILED',
                          'postgresConfigurationChanged': False, 'privateStateRetained': True,
                          'secretValuesEmitted': False}))
        sys.exit(1)
