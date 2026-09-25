#!/usr/bin/env python3
"""Copy only the auth persistence probe/modules into a fresh guest temp directory.

Uses a previously created isolated test.env. Existing release and databases are untouched.
"""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--env-file', required=True)
parser.add_argument('--workspace', required=True)
parser.add_argument('--probe', choices=['persistence', 'http', 'ingest', 'ingest-events', 'ingest-lease', 'ingest-replay', 'ingest-worker', 'ingest-sse', 'ingest-recovery-benchmark'], default='persistence')
args = parser.parse_args()
assert args.env_file.startswith('/tmp/nomad-auth-validation-') and args.env_file.endswith('/test.env')
assert args.workspace.startswith('/tmp/nomad-auth-workspace-') and '/' not in args.workspace.removeprefix('/tmp/nomad-auth-workspace-')
root = Path(__file__).resolve().parents[2] / 'apps/server'
paths = [str(p.relative_to(root)) for p in (root/'scripts').glob('auth-*.ts')] + [str(p.relative_to(root)) for p in (root/'src').rglob('*') if p.is_file() and p.suffix in ['.ts','.json']]
files = {path: (root/path).read_text() for path in paths}
files['scripts/benchmark-stream.ts']=(root/'scripts/benchmark-stream.ts').read_text()
files['bounded_process.py']=(root.parents[1]/'ops/pve-staging/bounded_process.py').read_text()
extra_names = ['packages/prompts/schemas/fill-output.schema.json', 'packages/types/src/api-types.ts']
extras = {name: (root.parents[1]/name).read_text() for name in extra_names}
schema = (root.parents[1]/'packages/prisma/schema.prisma').read_text()
remote = 'EXTRAS='+repr(extras)+'\nFILES='+repr(files)+'\nSCHEMA='+repr(schema)+'\nENV_FILE='+repr(args.env_file)+'\nWORKSPACE='+repr(args.workspace)+'\nPROBE='+repr(args.probe)+'\n'+'''
import json,os,re,socket,subprocess
from pathlib import Path
assert socket.gethostname()=='nomad-staging'
assert Path(ENV_FILE).is_file()
maintenance=subprocess.run(['systemctl','show','apt-daily-upgrade.service','--property=ActiveState','--value'],capture_output=True,text=True,timeout=5)
if maintenance.returncode!=0 or maintenance.stdout.strip() not in ['inactive','failed']:
 print(json.dumps({'error':'AUTH_PERSISTENCE_PROBE_MAINTENANCE_ACTIVE'}));raise SystemExit(2)
os.umask(0o077)
directory=Path(WORKSPACE)/'apps/server'
assert directory.is_dir() and (directory/'node_modules').is_dir()
schemaPath=Path(WORKSPACE)/'packages/prisma/schema.prisma'
if schemaPath.read_text()!=SCHEMA:
 schemaPath.write_text(SCHEMA)
 generated=subprocess.run(['pnpm','-F','nomad-prisma','run','generate'],cwd=WORKSPACE,
  env=dict(os.environ,DATABASE_URL='postgresql://unused:unused@127.0.0.1:1/nomad_schema_only'),capture_output=True,text=True,timeout=45)
 assert generated.returncode==0,'Isolated Prisma generation failed'
for name,content in EXTRAS.items():
 p=Path(WORKSPACE)/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
for name,content in FILES.items():
 p=directory/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
import sys
sys.path.insert(0,str(directory))
from bounded_process import run_probe
r=run_probe(['node','--env-file='+ENV_FILE,'--import','tsx','scripts/auth-'+PROBE+('.ts' if PROBE=='ingest-recovery-benchmark' else '-probe.ts')],
 cwd=directory,timeout=180 if PROBE in ['ingest-sse','ingest-recovery-benchmark'] else 60)
redact=lambda value: re.sub(r'postgres(?:ql)?://[^\\s]+','[database-url]',value)
print(json.dumps({'directory':str(directory),'exit':r.returncode,'timedOut':r.timed_out,'stdout':redact(r.stdout),'stderr':redact(r.stderr[-3000:])}))
raise SystemExit(r.returncode)
'''
command = ['/mnt/c/Windows/System32/OpenSSH/ssh.exe', '-o','BatchMode=yes',
           '-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=6',
           '-i',r'C:\Users\123\.ssh\id_ed25519','-J','root@192.168.31.2',
           'nomad@192.168.31.104','python3 -']
r=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=270 if args.probe in ['ingest-sse','ingest-recovery-benchmark'] else 150)
print(r.stdout.strip())
if r.returncode and not r.stdout: print(json.dumps({'error':'AUTH_PERSISTENCE_PROBE_TRANSPORT_FAILED'}))
raise SystemExit(r.returncode)
