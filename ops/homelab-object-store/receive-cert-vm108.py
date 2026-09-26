#!/usr/bin/env python3
"""Restricted SSH forced command for the VM104 certificate deploy key."""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

DOMAIN = 'objects.yinianyunqi.top'
BASE = Path('/etc/nomad-object-store/tls')
MAX_INPUT = 100_000


def run(*args: str) -> bytes:
    return subprocess.check_output(args, stderr=subprocess.DEVNULL)


def main() -> int:
    if os.environ.get('SSH_ORIGINAL_COMMAND'):
        return 64
    data = sys.stdin.buffer.read(MAX_INPUT + 1)
    if len(data) > MAX_INPUT:
        return 65
    payload = json.loads(data)
    if set(payload) != {'certificate', 'issuer', 'privateKey'}:
        return 66
    for value in payload.values():
        if not isinstance(value, str) or len(value) > 40_000 or '-----BEGIN ' not in value:
            return 67
    leaf = payload['certificate'].encode()
    issuer = payload['issuer'].encode()
    key = payload['privateKey'].encode()
    digest = hashlib.sha256(leaf + issuer + key).hexdigest()
    certificate_digest = hashlib.sha256(leaf).hexdigest()
    release = BASE / 'releases' / digest
    release.mkdir(mode=0o700, exist_ok=True)
    leaf_path = release / 'leaf.pem'
    issuer_path = release / 'issuer.pem'
    chain_path = release / 'fullchain.pem'
    key_path = release / 'key.pem'
    for path, content in ((leaf_path, leaf), (issuer_path, issuer),
                          (chain_path, leaf + issuer), (key_path, key)):
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, 'wb') as output:
            output.write(content)
    run('openssl', 'x509', '-in', str(leaf_path), '-noout', '-checkend', '604800')
    run('openssl', 'pkey', '-in', str(key_path), '-noout')
    run('openssl', 'verify', '-CAfile', '/etc/ssl/certs/ca-certificates.crt',
        '-untrusted', str(issuer_path), '-verify_hostname', DOMAIN, str(leaf_path))
    cert_pub = run('openssl', 'x509', '-in', str(leaf_path), '-pubkey', '-noout')
    key_pub = run('openssl', 'pkey', '-in', str(key_path), '-pubout')
    if cert_pub != key_pub:
        return 68
    current = BASE / 'current'
    old_target = os.readlink(current) if current.is_symlink() else None
    if old_target == str(Path('releases') / digest):
        print(json.dumps({'deployed': True, 'unchanged': True, 'domain': DOMAIN,
                          'certificateSha256': certificate_digest, 'privateKeyEmitted': False}))
        return 0
    next_link = BASE / '.current-next'
    next_link.unlink(missing_ok=True)
    next_link.symlink_to(Path('releases') / digest)
    os.replace(next_link, current)
    try:
        run('sudo', '-n', '/usr/sbin/nginx', '-t')
        run('sudo', '-n', '/usr/bin/systemctl', 'reload', 'nginx')
    except subprocess.CalledProcessError:
        if old_target:
            next_link.symlink_to(old_target)
            os.replace(next_link, current)
            run('sudo', '-n', '/usr/bin/systemctl', 'reload', 'nginx')
        else:
            current.unlink(missing_ok=True)
        return 69
    print(json.dumps({'deployed': True, 'domain': DOMAIN,
                      'certificateSha256': certificate_digest, 'privateKeyEmitted': False}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError):
        print(json.dumps({'deployed': False, 'failureCategory': 'CERT_DEPLOY_FAILED',
                          'privateKeyEmitted': False}))
        raise SystemExit(1)
