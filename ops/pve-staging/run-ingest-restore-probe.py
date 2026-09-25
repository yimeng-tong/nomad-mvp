#!/usr/bin/env python3
"""Create fresh synthetic source/restore DBs from test schema; retain both and dump. Never touch deployed DB."""
import argparse,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--execute',action='store_true')
args=parser.parse_args()
if not args.execute:
 print(json.dumps({'createsFreshDatabases':True,'restoresActiveCheckpoint':True,'realProviderCalls':False,'deployedDatabaseChanged':False}));raise SystemExit()
root=Path(__file__).resolve().parents[2]
files={str(p.relative_to(root)):p.read_text() for base in ['apps/server/src','apps/server/scripts'] for p in (root/base).rglob('*') if p.is_file() and p.suffix in ['.ts','.json']}
remote='FILES='+repr(files)+'\n'+'''
import hashlib,json,os,re,secrets,socket,subprocess,tempfile
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,unquote
assert socket.gethostname()=='nomad-staging'
os.umask(0o077)
assert subprocess.check_output(['systemctl','show','apt-daily-upgrade.service','--property=ActiveState','--value'],text=True).strip() in ['inactive','failed']
workspace=Path('/tmp/nomad-auth-workspace-t3ktipoj');assert workspace.is_dir()
for name,content in FILES.items():
 p=workspace/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
values=dict(line.strip().split('=',1) for line in Path('/tmp/nomad-auth-validation-wir7n3sw/test.env').read_text().splitlines() if '=' in line)
url=urlsplit(values['DATABASE_URL']);base=url.path[1:];role=unquote(url.username)
assert re.fullmatch('nomad_auth_test_[a-f0-9]+',base) and re.fullmatch('nomad_auth_test_[a-f0-9]+',role)
directory=Path(tempfile.mkdtemp(prefix='nomad-ingest-restore-'));tag=secrets.token_hex(6)
source='nomad_auth_test_'+tag+'_recovery_src';target='nomad_auth_test_'+tag+'_recovery_copy'
for name in [source,target]:subprocess.run(['sudo','-n','-u','postgres','createdb','-O',role,name],capture_output=True,check=True,timeout=20)
schema=subprocess.run(['sudo','-n','-u','postgres','pg_dump','--schema-only','-Fc',base],capture_output=True,check=True,timeout=30).stdout
subprocess.run(['sudo','-n','-u','postgres','pg_restore','--exit-on-error','-d',source],input=schema,capture_output=True,check=True,timeout=30)
def env_file(name):
 p=directory/(name+'.env');p.write_text('DATABASE_URL='+urlunsplit((url.scheme,url.netloc,'/'+name,url.query,url.fragment))+'\\nAUTH_TEST_DATABASE_ACK=isolated-synthetic-only\\n');return p
source_env=env_file(source);target_env=env_file(target);state=directory/'state.json'
def probe(mode,env):
 r=subprocess.run(['node','--env-file='+str(env),'--import','tsx','scripts/auth-ingest-restore-probe.ts',mode,str(state)],cwd=workspace/'apps/server',capture_output=True,text=True,timeout=45)
 records=[]
 for line in r.stdout.splitlines():
  try:records.append(json.loads(line))
  except ValueError:pass
 if r.returncode:print(json.dumps({'result':'failed','phase':mode,'records':records,'directory':str(directory)}));raise SystemExit(1)
 return records[-1]
seed=probe('seed',source_env)
backup=directory/'active-checkpoint.dump'
with backup.open('wb') as stream:subprocess.run(['sudo','-n','-u','postgres','pg_dump','-Fc',source],stdout=stream,stderr=subprocess.PIPE,check=True,timeout=30)
with backup.open('rb') as stream:subprocess.run(['sudo','-n','-u','postgres','pg_restore','--exit-on-error','-d',target],stdin=stream,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,timeout=30)
verified=probe('verify',target_env);unchanged=probe('source-unchanged',source_env)
report={'result':'passed','sourceDatabase':source,'restoredDatabase':target,'directory':str(directory),'dumpSha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'dumpBytes':backup.stat().st_size,'seed':seed,'restore':verified,'source':unchanged,'retainedSourceRestoreAndBackup':True,'deployedDatabaseChanged':False}
(directory/'report.json').write_text(json.dumps(report,indent=2)+'\\n');print(json.dumps(report))
'''
command=['/mnt/c/Windows/System32/OpenSSH/ssh.exe','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=6','-i',r'C:\Users\123\.ssh\id_ed25519','-J','root@192.168.31.2','nomad@192.168.31.104','python3 -']
r=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=150)
print(r.stdout.strip() or json.dumps({'result':'failed','phase':'transport-or-setup','exit':r.returncode}))
raise SystemExit(r.returncode)
