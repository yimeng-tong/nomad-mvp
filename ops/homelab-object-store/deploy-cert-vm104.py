#!/usr/bin/env python3
"""Send VM104's ACME certificate directly to the restricted VM108 receiver."""

import json
import os
import subprocess
import sys
from pathlib import Path

DOMAIN = 'objects.yinianyunqi.top'
ROOT = Path('/etc/nomad-mvp/development')


def main() -> int:
    if os.geteuid() != 0:
        return 64
    certificates = ROOT / 'acme-objects' / 'certificates'
    payload = {
        'certificate': (certificates / f'{DOMAIN}.crt').read_text(),
        'issuer': (certificates / f'{DOMAIN}.issuer.crt').read_text(),
        'privateKey': (certificates / f'{DOMAIN}.key').read_text(),
    }
    result = subprocess.run(
        ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
         '-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes',
         '-i', str(ROOT / 'object-cert-deploy-key'),
         'nomad-cert-deploy@192.168.31.108'],
        input=json.dumps(payload, separators=(',', ':')).encode(),
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30, check=False)
    if result.returncode != 0:
        print(json.dumps({'deployed': False, 'failureCategory': 'CERT_DEPLOY_FAILED',
                          'privateKeyEmitted': False}))
        return 1
    print(result.stdout.decode().strip())
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, subprocess.TimeoutExpired, UnicodeError):
        print(json.dumps({'deployed': False, 'failureCategory': 'CERT_DEPLOY_PRECHECK_FAILED',
                          'privateKeyEmitted': False}))
        raise SystemExit(1)
