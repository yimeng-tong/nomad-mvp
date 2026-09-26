#!/usr/bin/env python3
"""Run inside VM108 as root; prints only synthetic S3 acceptance results."""

import json
import secrets
import urllib.error
import urllib.request
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError


def credentials():
    lines = Path('/etc/nomad-object-store/app-credential.env').read_text().splitlines()
    values = dict(line.split('=', 1) for line in lines if '=' in line)
    admin = json.loads(Path('/etc/nomad-object-store/s3.json').read_text())['identities'][0]['credentials'][0]
    return values, admin


def client(endpoint, access, secret):
    return boto3.client('s3', endpoint_url=endpoint, aws_access_key_id=access,
                        aws_secret_access_key=secret, region_name='us-east-1',
                        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}))


def denied(operation):
    try:
        operation()
    except ClientError as error:
        return error.response['Error']['Code'] in ('AccessDenied', '403')
    return False


def main():
    values, admin_key = credentials()
    endpoint = 'http://127.0.0.1:8334'
    bucket = 'nomad-development'
    app = client(endpoint, values['NOMAD_OBJECT_ACCESS_KEY_ID'], values['NOMAD_OBJECT_SECRET_ACCESS_KEY'])
    admin = client(endpoint, admin_key['accessKey'], admin_key['secretKey'])
    key = 'synthetic-probe/' + secrets.token_hex(12)
    other_bucket = 'nomad-probe-' + secrets.token_hex(6)
    unauthorized_bucket = 'nomad-unapproved-' + secrets.token_hex(6)
    content = secrets.token_bytes(64)
    results = {}
    created_other = False
    created_unexpected = False
    try:
        app.head_bucket(Bucket=bucket)
        results['app_bucket_access'] = True
        app.put_object(Bucket=bucket, Key=key, Body=content, ContentType='application/octet-stream')
        results['signed_put'] = True
        fetched = app.get_object(Bucket=bucket, Key=key)['Body'].read()
        results['signed_get_exact_bytes'] = fetched == content
        results['signed_list'] = any(item['Key'] == key for item in
                                     app.list_objects_v2(Bucket=bucket, Prefix=key).get('Contents', []))
        try:
            urllib.request.urlopen(f'{endpoint}/{bucket}/{key}', timeout=5)
            results['anonymous_read_denied'] = False
        except urllib.error.HTTPError as error:
            results['anonymous_read_denied'] = error.code == 403
        results['app_admin_denied'] = denied(lambda: app.create_bucket(Bucket=unauthorized_bucket))
        created_unexpected = not results['app_admin_denied']
        admin.create_bucket(Bucket=other_bucket)
        created_other = True
        results['other_bucket_write_denied'] = denied(lambda: app.put_object(Bucket=other_bucket,
                                                                              Key='forbidden', Body=b'no'))
        app.delete_object(Bucket=bucket, Key=key)
        results['signed_delete'] = True
        try:
            app.head_object(Bucket=bucket, Key=key)
            results['deleted_byte_unavailable'] = False
        except ClientError as error:
            results['deleted_byte_unavailable'] = error.response['Error']['Code'] in ('404', 'NoSuchKey', 'NotFound')
    finally:
        admin.delete_object(Bucket=bucket, Key=key)
        if created_other:
            admin.delete_object(Bucket=other_bucket, Key='forbidden')
            admin.delete_bucket(Bucket=other_bucket)
        if created_unexpected:
            admin.delete_bucket(Bucket=unauthorized_bucket)
    results['passed'] = all(results.values())
    print(json.dumps({'kind': 'nomad-homelab-private-s3-synthetic-probe', 'results': results,
                      'scope': 'VM108 local endpoint, synthetic bytes only, no provider or native device'}, sort_keys=True))
    if not results['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        code = error.response['Error']['Code'] if isinstance(error, ClientError) else type(error).__name__
        print(json.dumps({'kind': 'nomad-homelab-private-s3-synthetic-probe', 'passed': False,
                          'failure_code': code, 'secret_values_emitted': False}))
        raise SystemExit(1)
