#!/usr/bin/env python3
"""Real PITR on two fresh private Unix-socket PostgreSQL clusters. Retains every data/archive/backup directory."""
import argparse, hashlib, json, subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--execute',action='store_true');args=parser.parse_args()
if not args.execute:
 print(json.dumps({'scope':'fresh-private-unix-socket-clusters-only','existingClusterChanged':False,'keepsDataAndBackups':True}));raise SystemExit()
root=Path(__file__).resolve().parents[2]
files={name:(root/'ops/postgres'/name).read_text() for name in ['archive-wal.py','base-backup.py']}
inner=r"""
import hashlib,json,os,shutil,subprocess,sys,tempfile,time
from pathlib import Path
FILES=__FILES__
os.umask(0o077)
root=Path(tempfile.mkdtemp(prefix='nomad-ingest-pitr-'));pg=Path('/usr/lib/postgresql/16/bin');source=root/'source';copy=root/'restored';archive=root/'archive';backups=root/'backups';sock=root/'source-socket';target_sock=root/'restored-socket'
for path in [archive,backups,sock,target_sock]:path.mkdir(mode=0o700)
for name,text in FILES.items():(root/name).write_text(text)
phase='init';checks=[];report=None
def run(command,**kwargs):
 r=subprocess.run([str(x) for x in command],capture_output=True,timeout=90,**kwargs)
 if r.returncode:raise RuntimeError('Private probe command failed')
 return r.stdout.decode().strip()
def sql(statement,socket=sock,database='nomad_pitr_fixture'):
 return run([pg/'psql','-h',socket,'-XqAt','-v','ON_ERROR_STOP=1','-d',database,'-c',statement])
def facts(socket):
 return sql('''SELECT md5(json_build_object(
 'users',(SELECT json_agg(u ORDER BY id) FROM "User" u),
 'jobs',(SELECT json_agg(j ORDER BY id) FROM "IngestJob" j),
 'events',(SELECT json_agg(e ORDER BY job_id,seq) FROM "IngestEventRecord" e),
 'commands',(SELECT json_agg(c ORDER BY operation_id) FROM "IngestCommand" c))::text)''',socket)
def append(count):
 sql('''WITH changed AS (
 UPDATE "IngestJob" SET state_version=state_version+1,last_event_seq=last_event_seq+1,
 snapshot_json=snapshot_json||jsonb_build_object('state_version',state_version+1,
 'head_cursor','i1:'||event_stream_id::text||':'||(last_event_seq+1)::text,'parsed_count',%d)
 WHERE id=(SELECT id FROM "IngestJob" WHERE status='parsing' ORDER BY id LIMIT 1) RETURNING *)
 INSERT INTO "IngestEventRecord"(job_id,seq,schema_version,kind,attempt,state_version,stage,sub_stage,trace_id,occurred_at,snapshot_json)
 SELECT id,last_event_seq,1,'fact',retry_count+1,state_version,status,NULL,id::text,clock_timestamp(),snapshot_json FROM changed'''%count)
def wait(test,timeout=20):
 end=time.monotonic()+timeout
 while not test():
  if time.monotonic()>end:raise RuntimeError('Private probe timeout')
  time.sleep(.1)
try:
 run([pg/'initdb','-D',source,'--auth-local=trust','--auth-host=reject','--no-instructions'])
 with (source/'postgresql.conf').open('a') as f:f.write("\nlisten_addresses=''\nunix_socket_directories='%s'\narchive_mode=on\nwal_level=replica\narchive_timeout=900\narchive_command='python3 %s/archive-wal.py \"%%p\" %s \"%%f\"'\n"%(sock,root,archive))
 run([pg/'pg_ctl','-D',source,'-l',root/'source.log','-w','start']);run([pg/'createdb','-h',sock,'nomad_pitr_fixture'])
 run([pg/'pg_restore','-h',sock,'--no-owner','--no-acl','--exit-on-error','-d','nomad_pitr_fixture'],input=sys.stdin.buffer.read())
 assert sql('SELECT count(*) FROM "IngestJob" WHERE execution_pending')=='2'
 initial=facts(sock);system=sql('SELECT system_identifier FROM pg_control_system()');phase='physical-base-backup'
 wrong=subprocess.run(['python3',str(root/'base-backup.py'),'--socket',str(sock),'--backup-root',str(backups),'--expected-system-id','0'],capture_output=True,timeout=20)
 assert wrong.returncode!=0 and not list(backups.glob('backup-*'));checks.append('wrong-cluster-id-refuses-backup-before-data-write')
 unreadable=source/'nomad-synthetic-unreadable';unreadable.write_bytes(b'synthetic-failure-fixture');unreadable.chmod(0)
 try:
  failed=subprocess.run(['python3',str(root/'base-backup.py'),'--socket',str(sock),'--backup-root',str(backups),'--expected-system-id',system],capture_output=True,timeout=30)
  assert failed.returncode!=0
  partials=[p for p in backups.glob('backup-*') if p.is_dir()];assert len(partials)==1 and any(p.is_file() for p in partials[0].rglob('*'))
  assert not list(backups.glob('*.verified.json'));checks.append('actual-mid-backup-read-failure-retains-partial-files-without-verified-marker')
 finally:unreadable.chmod(0o600)
 backup=json.loads(run(['python3',root/'base-backup.py','--socket',sock,'--backup-root',backups,'--expected-system-id',system]));checks.append('physical-base-backup-and-pg-verifybackup-pass')
 base=Path(backup['directory']);assert facts(sock)==initial
 phase='target-and-later-commits';append(11);expected=facts(sock);assert expected!=initial
 target_time=sql('SELECT clock_timestamp()');time.sleep(.15);append(22);later=facts(sock);assert later!=expected
 segment=sql('SELECT pg_walfile_name(pg_current_wal_lsn())');sql('SELECT pg_switch_wal()')
 wait(lambda:(archive/segment).is_file());checks.append('real-wal-archive-contains-commits-after-base-backup')
 phase='restore-to-time';shutil.copytree(base,copy)
 with (copy/'postgresql.conf').open('a') as f:f.write("\nlisten_addresses=''\nunix_socket_directories='%s'\narchive_mode=off\nrestore_command='cp %s/%%f \"%%p\"'\nrecovery_target_time='%s'\nrecovery_target_action='pause'\n"%(target_sock,archive,target_time))
 (copy/'recovery.signal').touch()
 run([pg/'pg_ctl','-D',copy,'-l',root/'restored.log','-w','start'])
 wait(lambda:sql('SELECT pg_is_in_recovery() AND pg_is_wal_replay_paused()',target_sock)=='t')
 assert facts(target_sock)==expected;assert facts(target_sock)!=later
 assert sql('SELECT (snapshot_json->>\'parsed_count\') FROM "IngestJob" WHERE status=\'parsing\'',target_sock)=='11'
 assert sql('SELECT count(*) FROM "IngestJob" WHERE execution_pending',target_sock)=='2'
 checks.append('time-target-restores-original-owners-commands-checkpoints-and-only-pre-target-event')
 assert facts(sock)==later;checks.append('source-later-commit-remains-intact')
 # No application or worker is ever launched against this restored socket. The separate restored-DB App probe tests its gate.
 report={'result':'passed','checks':checks,'directory':str(root),'sourceSystemIdentifier':system,'targetTime':target_time,'sourceStateDigest':later,'targetStateDigest':expected,'baseBackup':backup,'archiveSegmentCount':len([p for p in archive.iterdir() if len(p.name)==24]),'archiveTimeoutSeconds':900,'segmentSwitchInProbe':'explicit-pg_switch_wal-not-a-15-minute-observation','recoveryTargetAction':'pause','targetInRecovery':True,'targetReplayPaused':True,'restoredPendingJobs':2,'applicationWorkerLaunched':False,'existingClusterChanged':False,'productionPitrVerified':False,'retainedDataArchivesBackups':True,'sameHostFailureDomain':True}
except Exception:
 report={'result':'failed','phase':phase,'directory':str(root),'retained':True}
finally:
 stopped=[]
 for data in [copy,source]:
  try:
   if (data/'postmaster.pid').exists():subprocess.run([str(pg/'pg_ctl'),'-D',str(data),'-m','fast','-w','stop'],capture_output=True,timeout=30)
   stopped.append(not (data/'postmaster.pid').exists())
  except Exception:stopped.append(False)
 if report is None:report={'result':'failed','phase':phase,'directory':str(root),'retained':True}
 report['privateClustersStopped']=all(stopped)
 if not all(stopped):report['result']='failed';report['shutdownIncomplete']=True
 (root/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
 if report['result']!='passed':raise SystemExit(1)
""".replace('__FILES__',repr(files))
outer='INNER='+repr(inner)+'\n'+r'''
import hashlib,json,socket,subprocess
from pathlib import Path
assert socket.gethostname()=='nomad-staging'
assert subprocess.check_output(['systemctl','show','apt-daily-upgrade.service','--property=ActiveState','--value'],text=True).strip() in ['inactive','failed']
source=Path('/tmp/nomad-ingest-restore-8jy4nzp_/active-checkpoint.dump')
data=source.read_bytes();assert hashlib.sha256(data).hexdigest()=='407814b7dc0e7635e572a3271e13f3f3de1facb143d5ce583b9a439f8b4825d9'
r=subprocess.run(['sudo','-n','-u','postgres','python3','-c',INNER],input=data,capture_output=True,timeout=240)
print(r.stdout.decode().strip() or json.dumps({'result':'failed','phase':'private-cluster-runner'}));raise SystemExit(r.returncode)
'''
command=['/mnt/c/Windows/System32/OpenSSH/ssh.exe','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=6','-i',r'C:\Users\123\.ssh\id_ed25519','-J','root@192.168.31.2','nomad@192.168.31.104','python3 -']
r=subprocess.run(command,input=outer,text=True,capture_output=True,timeout=270)
print(r.stdout.strip() or json.dumps({'result':'failed','phase':'transport'}));raise SystemExit(r.returncode)
