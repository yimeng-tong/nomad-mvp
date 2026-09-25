#!/usr/bin/env python3
"""Read-only VM104 backup readiness. Never prints archive commands, credentials, SQL data or backup payloads."""
import json, subprocess
remote = r'''
import json,socket,subprocess
assert socket.gethostname()=='nomad-staging'
def run(command):
 r=subprocess.run(command,text=True,capture_output=True,timeout=15)
 if r.returncode:raise RuntimeError('Read-only inventory command failed')
 return r.stdout.strip()
sql="""SELECT json_build_object(
 'serverVersion',current_setting('server_version'),
 'postmasterStartedAt',pg_postmaster_start_time(),
 'observedAt',clock_timestamp(),
 'archiveMode',current_setting('archive_mode'),
 'walLevel',current_setting('wal_level'),
 'archiveTimeoutSeconds',current_setting('archive_timeout')::interval,
 'archivedCount',(SELECT archived_count FROM pg_stat_archiver),
 'failedCount',(SELECT failed_count FROM pg_stat_archiver),
 'lastArchivedAt',(SELECT last_archived_time FROM pg_stat_archiver),
 'lastFailedAt',(SELECT last_failed_time FROM pg_stat_archiver))"""
# archive_timeout is reported as a setting with its unit by pg_settings, avoiding casts of '0'.
sql=sql.replace("current_setting('archive_timeout')::interval", "(SELECT setting FROM pg_settings WHERE name='archive_timeout')")
postgres=json.loads(run(['sudo','-n','-u','postgres','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d','postgres','-c',sql]))
timers=run(['systemctl','list-unit-files','--type=timer','--no-legend','--no-pager'])
selected=[{'name':line.split()[0],'unitFileState':line.split()[1]} for line in timers.splitlines() if any(word in line.lower() for word in ['backup','postgres','restic','borg','pgbackrest','barman'])]
active=run(['systemctl','list-units','--all','--type=timer','--plain','--no-legend','--no-pager'])
instances=[line.strip() for line in active.splitlines() if any(word in line.lower() for word in ['backup','postgres','restic','borg','pgbackrest','barman'])]
report={'scope':'read-only-VM104-local-backup-readiness','host':socket.gethostname(),'postgres':postgres,'matchingTimerUnitFiles':selected,'matchingInstantiatedTimerUnits':instances,'limits':['Timer-name inventory cannot rule out external schedulers or unnamed cron backups.','No archive_command/library value, secret env, SQL row or backup contents are read out.','No production endpoint or backup destination is inferred from this staging host.'],'changedConfiguration':False,'restartedServices':False}
print(json.dumps(report))
'''
command=['/mnt/c/Windows/System32/OpenSSH/ssh.exe','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=6','-i',r'C:\Users\123\.ssh\id_ed25519','-J','root@192.168.31.2','nomad@192.168.31.104','python3 -']
r=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=35)
print(r.stdout.strip() or json.dumps({'result':'unavailable','scope':'read-only-backup-inventory','exit':r.returncode}))
raise SystemExit(r.returncode)
