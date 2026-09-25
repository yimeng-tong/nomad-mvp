#!/usr/bin/env python3
"""Create and verify one retained physical backup, bound to an explicit PostgreSQL cluster ID."""
import argparse, datetime, fcntl, hashlib, json, os, re, stat, subprocess, uuid
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--socket', required=True)
parser.add_argument('--port', type=int, default=5432)
parser.add_argument('--backup-root', required=True)
parser.add_argument('--expected-system-id', required=True)
parser.add_argument('--pg-bin', default='/usr/lib/postgresql/16/bin')
args = parser.parse_args()
root = Path(args.backup_root)

def run(command, **kwargs):
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600, **kwargs)
    if result.returncode:
        raise RuntimeError('Backup command failed; retained files were not removed')
    return result.stdout.decode().strip()

try:
    info = root.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o077:
        raise ValueError('Backup root must be private')
    if not args.expected_system_id.isdecimal() or not Path(args.socket).is_absolute() or not 1 <= args.port <= 65535:
        raise ValueError('Explicit cluster identity/socket required')
    lock = os.open(root / '.backup.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    connection = ['-h', args.socket, '-p', str(args.port), '-U', 'postgres']
    identity = run([str(Path(args.pg_bin) / 'psql'), *connection, '-XqAt', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-c', 'SELECT system_identifier FROM pg_control_system()'])
    if identity != args.expected_system_id:
        raise ValueError('Cluster identity mismatch')
    name = 'backup-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid.uuid4().hex
    target = root / name
    target.mkdir(mode=0o700)  # Exclusive fresh destination. Failed/incomplete attempts are retained.
    run([str(Path(args.pg_bin) / 'pg_basebackup'), *connection, '-D', str(target), '-Fp', '-Xs', '-c', 'fast', '--no-clean', '--manifest-checksums=SHA256'])
    run([str(Path(args.pg_bin) / 'pg_verifybackup'), str(target)])
    control = run([str(Path(args.pg_bin) / 'pg_controldata'), str(target)], env={**os.environ, 'LC_ALL': 'C'})
    actual = re.search(r'^Database system identifier:\s*([0-9]+)\s*$', control, re.MULTILINE)
    if actual is None or actual.group(1) != args.expected_system_id:
        raise ValueError('Backup itself belongs to another cluster')
    manifest = target / 'backup_manifest'
    report = {'result': 'passed', 'systemIdentifier': identity, 'directory': str(target), 'manifestSha256': hashlib.sha256(manifest.read_bytes()).hexdigest(), 'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'retention': 'no-automatic-deletion'}
    marker = root / (name + '.verified.json')
    with marker.open('x') as output:
        json.dump(report, output, indent=2)
        output.flush()
        os.fsync(output.fileno())
    for path in (target, root):
        fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
    print(json.dumps(report))
except Exception:
    print(json.dumps({'result': 'failed', 'code': 'PHYSICAL_BACKUP_FAILED', 'retained': True}))
    raise SystemExit(1)
