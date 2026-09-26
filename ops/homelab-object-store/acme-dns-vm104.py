#!/usr/bin/env python3
"""Issue/renew the private S3 hostname by AliDNS DNS-01 entirely on VM104.

The existing Alibaba credential is read from the server's restricted provider
configuration. This program emits only certificate metadata or a fixed failure
category; ACME/DNS logs remain mode 0600 on VM104.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

DOMAIN = 'objects.yinianyunqi.top'
ROOT = Path('/etc/nomad-mvp/development')


def provider_value(name: str) -> str:
    for line in (ROOT / 'providers.env').read_text().splitlines():
        if line.startswith(name + '='):
            value = line.split('=', 1)[1].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]
            if value:
                return value
    raise RuntimeError('CREDENTIAL_UNAVAILABLE')


def main() -> int:
    if os.geteuid() != 0 or sys.argv[1:] not in (['staging'], ['production'], ['renew']):
        return 64
    stage = sys.argv[1]
    path = ROOT / ('acme-objects-staging' if stage == 'staging' else 'acme-objects')
    path.mkdir(mode=0o700, exist_ok=True)
    env = os.environ.copy()
    env['ALICLOUD_ACCESS_KEY'] = provider_value('ALIBABA_CLOUD_ACCESS_KEY_ID')
    env['ALICLOUD_SECRET_KEY'] = provider_value('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
    env['ALICLOUD_PROPAGATION_TIMEOUT'] = '180'
    # lego v5 `run` obtains a missing certificate and renews an existing one when due.
    command = ['/usr/local/bin/lego', 'run',
               '--accept-tos', '--account-id', 'nomad-object-store',
               '--domains', DOMAIN, '--dns', 'alidns', '--dns.resolvers', '223.5.5.5:53', '--server',
               'letsencrypt-staging' if stage == 'staging' else 'letsencrypt', '--path', str(path)]
    log_path = path / 'last-run.log'
    fd = os.open(log_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as log:
        result = subprocess.run(command, env=env, stdout=log, stderr=subprocess.STDOUT,
                                check=False, timeout=360)
    for key in ('ALICLOUD_ACCESS_KEY', 'ALICLOUD_SECRET_KEY'):
        env.pop(key, None)
    cert = path / 'certificates' / f'{DOMAIN}.crt'
    key = path / 'certificates' / f'{DOMAIN}.key'
    if result.returncode != 0 or not cert.exists() or not key.exists():
        message = log_path.read_text(errors='replace')
        category = ('DNS_PERMISSION_OR_DOMAIN' if re.search(r'AccessDenied|Forbidden|NoPermission|DomainNotFound', message, re.I)
                    else 'ACME_CONTACT_REQUIRED' if re.search(r'email.*(required|missing)', message, re.I)
                    else 'DNS_PROPAGATION' if re.search(r'propagation|TXT.*not found', message, re.I)
                    else 'ACME_RUN_FAILED')
        print(json.dumps({'stage': stage, 'issued': False, 'failureCategory': category,
                          'rawLogRetainedOnVM104': True, 'credentialsEmitted': False}))
        return 1
    metadata = subprocess.check_output(['openssl', 'x509', '-in', str(cert), '-noout', '-enddate', '-fingerprint', '-sha256'], text=True)
    fields = dict(line.split('=', 1) for line in metadata.splitlines() if '=' in line)
    print(json.dumps({'stage': stage, 'issued': True, 'domain': DOMAIN,
                      'notAfter': fields.get('notAfter'), 'sha256Fingerprint': fields.get('sha256 Fingerprint'),
                      'privateKeyLocation': 'VM104 only', 'credentialsEmitted': False}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        category = str(error) if str(error) == 'CREDENTIAL_UNAVAILABLE' else 'ACME_PRECHECK_FAILED'
        print(json.dumps({'issued': False, 'failureCategory': category, 'credentialsEmitted': False}))
        raise SystemExit(1)
