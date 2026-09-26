#!/usr/bin/env python3
"""VM104 signed HTTPS and bucket-scope probe using synthetic bytes only."""

import json
import os
import secrets
import socket
import ssl
import urllib.error
import urllib.request
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

DOMAIN = 'objects.yinianyunqi.top'
IP = '192.168.31.108'
CONFIG = Path('/etc/nomad-mvp/development/objects.env')


def main() -> None:
    values = dict(line.split('=', 1) for line in CONFIG.read_text().splitlines() if '=' in line)
    endpoint = values['NOMAD_OBJECT_ENDPOINT']
    bucket = values['NOMAD_OBJECT_BUCKET']
    assert endpoint == f'https://{DOMAIN}:8333'
    assert socket.gethostbyname(DOMAIN) == IP
    os.environ['NO_PROXY'] = DOMAIN + ',' + IP
    with socket.create_connection((DOMAIN, 8333), timeout=5) as raw:
        with ssl.create_default_context().wrap_socket(raw, server_hostname=DOMAIN) as tls:
            tls_version = tls.version()
    client = boto3.client(
        's3', endpoint_url=endpoint, aws_access_key_id=values['NOMAD_OBJECT_ACCESS_KEY_ID'],
        aws_secret_access_key=values['NOMAD_OBJECT_SECRET_ACCESS_KEY'], region_name='us-east-1',
        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                      connect_timeout=5, read_timeout=10, retries={'max_attempts': 1}))
    key = 'synthetic-probe/' + secrets.token_hex(12)
    content = secrets.token_bytes(128)
    checks = {'trusted_tls': tls_version in ('TLSv1.2', 'TLSv1.3')}
    try:
        client.head_bucket(Bucket=bucket)
        checks['app_bucket_access'] = True
        client.put_object(Bucket=bucket, Key=key, Body=content,
                          ContentType='application/octet-stream')
        checks['signed_put'] = True
        response = client.get_object(Bucket=bucket, Key=key)
        checks['signed_get_exact_bytes'] = response['Body'].read() == content
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            opener.open(f'{endpoint}/{bucket}/{key}', timeout=5)
            checks['anonymous_read_denied'] = False
        except urllib.error.HTTPError as error:
            checks['anonymous_read_denied'] = error.code == 403
    finally:
        client.delete_object(Bucket=bucket, Key=key)
    try:
        client.head_object(Bucket=bucket, Key=key)
        checks['deleted_byte_unavailable'] = False
    except ClientError as error:
        checks['deleted_byte_unavailable'] = error.response['Error']['Code'] in ('404', 'NoSuchKey', 'NotFound')
    result = {'kind': 'nomad-homelab-vm104-s3-https-probe', 'checks': checks,
              'passed': all(checks.values()), 'syntheticOnly': True,
              'secretsEmitted': False}
    print(json.dumps(result, sort_keys=True))
    if not result['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'kind': 'nomad-homelab-vm104-s3-https-probe',
                          'passed': False, 'failureCategory': type(error).__name__,
                          'secretsEmitted': False}))
        raise SystemExit(1)
