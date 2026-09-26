#!/usr/bin/env python3
"""Verify both S3 identities cannot read or mutate the other bucket."""

import json
import os
import secrets
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

ROOT = Path('/etc/nomad-object-store')
ENDPOINT = 'http://127.0.0.1:8334'


def values(path):
    return dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)


def client(access, secret):
    return boto3.client('s3', endpoint_url=ENDPOINT, aws_access_key_id=access,
                        aws_secret_access_key=secret, region_name='us-east-1',
                        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                      connect_timeout=5, read_timeout=10, retries={'max_attempts': 1}))


def denied(action):
    try:
        action()
    except ClientError as error:
        return error.response['Error']['Code'] in ('AccessDenied', '403')
    return False


def main():
    if os.geteuid() != 0 or os.uname().nodename != 'nomad-object-store':
        raise RuntimeError('wrong host')
    app_env = values(ROOT / 'app-credential.env')
    backup_env = values(ROOT / 'backup-credential.env')
    app = client(app_env['NOMAD_OBJECT_ACCESS_KEY_ID'], app_env['NOMAD_OBJECT_SECRET_ACCESS_KEY'])
    backup = client(backup_env['NOMAD_PG_BACKUP_ACCESS_KEY_ID'], backup_env['NOMAD_PG_BACKUP_SECRET_ACCESS_KEY'])
    admin_key = json.loads((ROOT / 's3.json').read_text())['identities'][0]['credentials'][0]
    admin = client(admin_key['accessKey'], admin_key['secretKey'])
    media_bucket, backup_bucket = 'nomad-development', 'nomad-backups'
    media_key = 'synthetic-probe/' + secrets.token_hex(12)
    backup_key = 'synthetic-probe/' + secrets.token_hex(12)
    media_bytes, backup_bytes = secrets.token_bytes(48), secrets.token_bytes(48)
    checks = {}
    try:
        app.put_object(Bucket=media_bucket, Key=media_key, Body=media_bytes)
        backup.put_object(Bucket=backup_bucket, Key=backup_key, Body=backup_bytes)
        checks['own_media_get'] = app.get_object(Bucket=media_bucket, Key=media_key)['Body'].read() == media_bytes
        checks['own_backup_get'] = backup.get_object(Bucket=backup_bucket, Key=backup_key)['Body'].read() == backup_bytes
        for label, wrong, bucket, key in (
                ('app_to_backup', app, backup_bucket, backup_key),
                ('backup_to_media', backup, media_bucket, media_key)):
            checks[label + '_get_denied'] = denied(lambda: wrong.get_object(Bucket=bucket, Key=key))
            checks[label + '_head_denied'] = denied(lambda: wrong.head_object(Bucket=bucket, Key=key))
            checks[label + '_list_denied'] = denied(lambda: wrong.list_objects_v2(Bucket=bucket, Prefix=key))
            checks[label + '_delete_denied'] = denied(lambda: wrong.delete_object(Bucket=bucket, Key=key))
            checks[label + '_write_denied'] = denied(lambda: wrong.put_object(
                Bucket=bucket, Key=key + '-forbidden', Body=b'forbidden'))
        checks['media_preserved'] = app.get_object(Bucket=media_bucket, Key=media_key)['Body'].read() == media_bytes
        checks['backup_preserved'] = backup.get_object(Bucket=backup_bucket, Key=backup_key)['Body'].read() == backup_bytes
    finally:
        for bucket, key in ((media_bucket, media_key), (backup_bucket, backup_key),
                            (media_bucket, media_key + '-forbidden'),
                            (backup_bucket, backup_key + '-forbidden')):
            admin.delete_object(Bucket=bucket, Key=key)
    report = {'kind': 'nomad-s3-cross-bucket-synthetic-probe', 'checks': checks,
              'passed': bool(checks) and all(checks.values()),
              'syntheticOnly': True, 'secretValuesEmitted': False}
    print(json.dumps(report, sort_keys=True))
    if not report['passed']:
        raise RuntimeError('bucket isolation failed')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'kind': 'nomad-s3-cross-bucket-synthetic-probe',
                          'passed': False, 'failureCategory': 'CROSS_BUCKET_PROBE_FAILED',
                          'secretValuesEmitted': False}))
        raise SystemExit(1)
