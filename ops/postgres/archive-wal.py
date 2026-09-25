#!/usr/bin/env python3
"""Durably publish a WAL archive without replacing existing data. Run as the cluster owner."""
import hashlib, os, re, stat, sys, tempfile
from pathlib import Path

def digest_fd(fd):
    digest = hashlib.sha256()
    os.lseek(fd, 0, os.SEEK_SET)
    while chunk := os.read(fd, 1024 * 1024):
        digest.update(chunk)
    return digest.digest()

def private_directory(path):
    info = path.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o077:
        raise ValueError('Archive directory must be private and owned by the invoking user')

def archive(source, directory, name):
    source, directory = Path(source), Path(directory)
    if not re.fullmatch(r'[A-Za-z0-9.]{1,64}', name) or name in ('.', '..') or source.name != name:
        raise ValueError('Invalid WAL identity')
    private_directory(directory)
    src = os.open(source, os.O_RDONLY | os.O_NOFOLLOW)
    temporary = None
    try:
        if not stat.S_ISREG(os.fstat(src).st_mode):
            raise ValueError('Not a regular WAL file')
        fd, temporary = tempfile.mkstemp(prefix='.pending-', dir=directory)
        try:
            while chunk := os.read(src, 1024 * 1024):
                view = memoryview(chunk)
                while view:
                    view = view[os.write(fd, view):]
            os.fsync(fd)
            expected = digest_fd(fd)
        finally:
            os.close(fd)
        target = directory / name
        try:
            os.link(temporary, target, follow_symlinks=False)
        except FileExistsError:
            existing = os.open(target, os.O_RDONLY | os.O_NOFOLLOW)
            try:
                if not stat.S_ISREG(os.fstat(existing).st_mode) or digest_fd(existing) != expected:
                    raise ValueError('Conflicting archive is retained')
                os.fsync(existing)
            finally:
                os.close(existing)
        parent = os.open(directory, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fsync(parent)
        finally:
            os.close(parent)
    finally:
        os.close(src)
        if temporary is not None:
            os.unlink(temporary)

if __name__ == '__main__':
    try:
        if len(sys.argv) != 4:
            raise ValueError('Expected source archive-directory WAL-name')
        archive(*sys.argv[1:])
    except Exception:
        print('WAL_ARCHIVE_FAILED', file=sys.stderr)
        raise SystemExit(1)
