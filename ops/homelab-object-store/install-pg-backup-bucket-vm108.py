#!/usr/bin/env python3
"""Create a backup-only S3 identity and bucket on VM108 without printing keys."""

import grp
import json
import os
import secrets
import shutil
import subprocess
import sys
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

ROOT = Path('/etc/nomad-object-store')
CONFIG = ROOT / 's3.json'
BACKUP = ROOT / 's3.before-pgbackrest-20260927.json'
ENV = ROOT / 'backup-credential.env'
BUCKET = 'nomad-backups'
ENDPOINT = 'http://127.0.0.1:8334'


def client(access: str, secret: str):
    return boto3.client('s3', endpoint_url=ENDPOINT, aws_access_key_id=access,
                        aws_secret_access_key=secret, region_name='us-east-1',
                        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}))


def denied(operation) -> bool:
    try:
        operation()
    except ClientError as error:
        return error.response['Error']['Code'] in ('AccessDenied', '403')
    return False


def main() -> None:
    if os.geteuid() != 0 or os.uname().nodename != 'nomad-object-store':
        raise RuntimeError('wrong host')
    current = json.loads(CONFIG.read_text())
    if BACKUP.exists() or ENV.exists() or any(item['name'] == 'nomad-pgbackrest'
                                              for item in current['identities']):
        raise RuntimeError('existing or partial backup identity')
    shutil.copy2(CONFIG, BACKUP)
    BACKUP.chmod(0o600)
    access = 'NB' + secrets.token_hex(10).upper()
    secret = secrets.token_urlsafe(48)
    current['identities'].append({'name': 'nomad-pgbackrest',
      'credentials': [{'accessKey': access, 'secretKey': secret}],
      'actions': [f'Read:{BUCKET}', f'Write:{BUCKET}', f'List:{BUCKET}']})
    temporary = ROOT / 's3.next.json'
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
    with os.fdopen(fd, 'w') as output:
        json.dump(current, output, separators=(',', ':'))
        output.write('\n')
    os.chown(temporary, 0, grp.getgrnam('nomad-objects').gr_gid)
    os.replace(temporary, CONFIG)
    try:
        subprocess.run(['systemctl', 'restart', 'nomad-object-store'], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)
        admin_key = current['identities'][0]['credentials'][0]
        admin = client(admin_key['accessKey'], admin_key['secretKey'])
        admin.create_bucket(Bucket=BUCKET)
        backup = client(access, secret)
        backup.head_bucket(Bucket=BUCKET)
        app_env = dict(line.split('=', 1) for line in (ROOT / 'app-credential.env').read_text().splitlines()
                       if '=' in line)
        app = client(app_env['NOMAD_OBJECT_ACCESS_KEY_ID'], app_env['NOMAD_OBJECT_SECRET_ACCESS_KEY'])
        key = 'synthetic-probe/' + secrets.token_hex(12)
        content = secrets.token_bytes(64)
        try:
            backup.put_object(Bucket=BUCKET, Key=key, Body=content)
            if backup.get_object(Bucket=BUCKET, Key=key)['Body'].read() != content:
                raise RuntimeError('backup byte mismatch')
            if not denied(lambda: app.list_objects_v2(Bucket=BUCKET)):
                raise RuntimeError('app can list backup bucket')
            if not denied(lambda: backup.list_objects_v2(Bucket='nomad-development')):
                raise RuntimeError('backup can list media bucket')
        finally:
            backup.delete_object(Bucket=BUCKET, Key=key)
        value = (f'NOMAD_PG_BACKUP_ACCESS_KEY_ID={access}\n'
                 f'NOMAD_PG_BACKUP_SECRET_ACCESS_KEY={secret}\n'
                 f'NOMAD_PG_BACKUP_BUCKET={BUCKET}\n'
                 'NOMAD_PG_BACKUP_ENDPOINT=https://objects.yinianyunqi.top:8333\n')
        fd = os.open(ENV, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as output:
            output.write(value)
    except Exception:
        shutil.copy2(BACKUP, CONFIG)
        os.chown(CONFIG, 0, grp.getgrnam('nomad-objects').gr_gid)
        CONFIG.chmod(0o640)
        subprocess.run(['systemctl', 'restart', 'nomad-object-store'], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)
        raise
    print(json.dumps({'backupBucket': BUCKET, 'appBucketIsolated': True,
                      'backupCredentialPresent': True, 'syntheticByteProbePassed': True,
                      'secretValuesEmitted': False}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'result': 'failed', 'category': 'PG_BACKUP_BUCKET_SETUP_FAILED',
                          'secretValuesEmitted': False, 'priorConfigRetained': True}))
        sys.exit(1)
