#!/usr/bin/env python3
"""Prepare isolated validation source/dependencies in VM104; never switches the deployed release."""
import argparse
import io
import json
from pathlib import Path
import subprocess
import tarfile

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--execute', action='store_true')
args = parser.parse_args()
paths = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
         'apps/server/package.json', 'apps/server/tsconfig.json', 'apps/server/src', 'apps/server/scripts',
         'packages/prisma/package.json', 'packages/prisma/schema.prisma', 'packages/prisma/migrations',
         'packages/types/package.json', 'packages/types/src', 'packages/prompts/schemas', 'docs/api/openapi.yaml']
if not args.execute:
    print(json.dumps({'target': 'VM104 temporary directory', 'sourcePaths': paths, 'deploysApplication': False}))
    raise SystemExit(0)
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
    for name in paths:
        tar.add(root/name, arcname=name, filter=lambda info: info if '.env' not in Path(info.name).name and (info.isdir() or Path(info.name).suffix in ['.ts', '.json', '.yaml', '.yml', '.prisma', '.sql']) else None)
remote = '''import json,os,pathlib,socket,subprocess,sys,tarfile,tempfile
assert socket.gethostname()=='nomad-staging'
os.umask(0o077)
directory=pathlib.Path(tempfile.mkdtemp(prefix='nomad-auth-workspace-'))
with tarfile.open(fileobj=sys.stdin.buffer,mode='r|gz') as archive:
 for member in archive:
  target=directory/member.name
  if not target.resolve().is_relative_to(directory) or not member.isfile() and not member.isdir():raise RuntimeError('Invalid source archive member')
  archive.extract(member,directory,filter='data')
env=dict(os.environ,PUPPETEER_SKIP_DOWNLOAD='true')
log=directory/'prepare.log'
with log.open('w') as output:
 r=subprocess.run(['pnpm','install','--frozen-lockfile'],cwd=directory,env=env,stdout=output,stderr=subprocess.STDOUT,timeout=240)
 if r.returncode:
  print(json.dumps({'directory':str(directory),'stage':'install','exit':r.returncode,'log':str(log)}));raise SystemExit(r.returncode)
 env['DATABASE_URL']='postgresql://unused:unused@127.0.0.1:1/nomad_schema_only'
 r=subprocess.run(['pnpm','-F','nomad-prisma','run','generate'],cwd=directory,env=env,stdout=output,stderr=subprocess.STDOUT,timeout=60)
print(json.dumps({'directory':str(directory),'stage':'prepared','exit':r.returncode,'deployedReleaseChanged':False,'log':str(log)}))
raise SystemExit(r.returncode)
'''
# The remote command is quoted as one POSIX argument; source bytes travel on stdin.
import shlex
command = ['/mnt/c/Windows/System32/OpenSSH/ssh.exe','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',
           '-o','ConnectTimeout=6','-i',r'C:\Users\123\.ssh\id_ed25519','-J','root@192.168.31.2',
           'nomad@192.168.31.104','python3 -c '+shlex.quote(remote)]
r=subprocess.run(command,input=buffer.getvalue(),capture_output=True,timeout=330)
print(r.stdout.decode().strip())
if r.returncode and not r.stdout:print(json.dumps({'error':'AUTH_VALIDATION_PREPARATION_FAILED','exit':r.returncode}))
raise SystemExit(r.returncode)
