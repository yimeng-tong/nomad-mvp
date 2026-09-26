#!/usr/bin/env python3
"""Send the VM104 ACME certificate to the restricted Alibaba Cloud receiver."""

import json
import os
import subprocess
import sys
from pathlib import Path

DOMAIN = 'nomad-test.yinianyunqi.top'
ROOT = Path('/etc/nomad-mvp/development')


def main() -> int:
    if os.geteuid() != 0:
        return 64
    certificates = ROOT / 'acme-phone' / 'certificates'
    payload = {
        'certificate': (certificates / f'{DOMAIN}.crt').read_text(),
        'issuer': (certificates / f'{DOMAIN}.issuer.crt').read_text(),
        'privateKey': (certificates / f'{DOMAIN}.key').read_text(),
    }
    result = subprocess.run(
        ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes',
         '-o', f'UserKnownHostsFile={ROOT / "phone-cert-known-hosts"}',
         '-i', str(ROOT / 'phone-cert-deploy-key'),
         'nomad-phone-cert@47.101.189.96'],
        input=json.dumps(payload, separators=(',', ':')).encode(),
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=70, check=False)
    if result.returncode != 0:
        print(json.dumps({'deployed': False, 'failureCategory': 'CERT_DEPLOY_FAILED',
                          'privateKeyEmitted': False}))
        return 1
    response = json.loads(result.stdout)
    if response.get('deployed') is not True or response.get('domain') != DOMAIN:
        raise RuntimeError('CERT_DEPLOY_UNVERIFIED')
    print(json.dumps(response))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired):
        print(json.dumps({'deployed': False, 'failureCategory': 'CERT_DEPLOY_PRECHECK_FAILED',
                          'privateKeyEmitted': False}))
        raise SystemExit(1)
