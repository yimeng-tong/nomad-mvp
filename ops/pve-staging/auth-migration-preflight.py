#!/usr/bin/env python3
"""Exercise auth migration and restore in newly-created synthetic databases only.

Uses the existing VM104/PVE SSH route; never reads the deployed application's env.
No cleanup is performed. Generated test credentials and backup remain guest-private.
"""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = '20260919000100_story_1_0_auth_authority'

parser = argparse.ArgumentParser()
parser.add_argument('--execute', action='store_true')
parser.add_argument('--include-ingest', action='store_true', help='Also verify the Story1.6 snapshot/command migration in these new databases')
parser.add_argument('--include-event-log', action='store_true', help='Also verify Story1.7 event/lease schema and immutable baseline restore')
args = parser.parse_args()
if args.include_event_log: args.include_ingest = True
files = sorted((ROOT / 'packages/prisma/migrations').glob('*/migration.sql'))
payload = {
    'baseline': [p.read_text() for p in files if p.parent.name < MIGRATION],
    'migration': (ROOT / f'packages/prisma/migrations/{MIGRATION}/migration.sql').read_text(),
    'ingestMigration': (ROOT / 'packages/prisma/migrations/20260919000200_story_1_6_ingest_snapshot/migration.sql').read_text() if args.include_ingest else None,
    'eventMigration': (ROOT / 'packages/prisma/migrations/20260919000300_story_1_7_ingest_event_log/migration.sql').read_text() if args.include_event_log else None,
    'eventFixture': (ROOT / 'packages/prisma/tests/ingest-event-migration-fixture.sql').read_text(),
    'eventInvariants': (ROOT / 'packages/prisma/tests/ingest-event-migration-invariants.sql').read_text(),
    'ingestSeed': (ROOT / 'packages/prisma/tests/ingest-migration-seed.sql').read_text(),
    'ingestFixture': (ROOT / 'packages/prisma/tests/ingest-migration-fixture.sql').read_text(),
    'ingestInvariants': (ROOT / 'packages/prisma/tests/ingest-migration-invariants.sql').read_text(),
    'seed': (ROOT / 'packages/prisma/tests/auth-migration-seed.sql').read_text(),
    'invariants': (ROOT / 'packages/prisma/tests/auth-migration-invariants.sql').read_text(),
}
if not args.execute:
    print(json.dumps({'target': 'nomad@192.168.31.104 via PVE', 'createsOnlyFreshDatabases': True,
                      'baselineMigrations': len(payload['baseline']), 'migration': MIGRATION,
                      'includeIngest': args.include_ingest, 'includeEventLog': args.include_event_log, 'startsWorker': False}))
    raise SystemExit(0)

remote = '''import hashlib,json,os,secrets,socket,subprocess,tempfile
from pathlib import Path
assert socket.gethostname() == 'nomad-staging', 'Unexpected guest'
os.umask(0o077)
data=json.loads(PAYLOAD)
tag=secrets.token_hex(6)
db='nomad_auth_test_'+tag
restored=db+'_restore'
role='nomad_auth_test_'+tag
password=secrets.token_urlsafe(32)
directory=Path(tempfile.mkdtemp(prefix='nomad-auth-validation-'))
def sql(database, statement, required=True, as_role=True):
    prefix=('SET ROLE "'+role+'";\\n') if as_role else ''
    r=subprocess.run(['sudo','-n','-u','postgres','psql','-X','-q','-v','ON_ERROR_STOP=1','-d',database],
        input=prefix+statement,text=True,capture_output=True,timeout=60)
    if required and r.returncode:raise RuntimeError('Isolated SQL stage failed; private values withheld')
    return r
sql('postgres','CREATE ROLE "'+role+'" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '+"'"+password+"';",as_role=False)
for name in [db,restored]:
    subprocess.run(['sudo','-n','-u','postgres','createdb','-O',role,name],check=True,capture_output=True,timeout=15)
env=directory/'test.env'
env.write_text('DATABASE_URL=postgresql://'+role+':'+password+'@127.0.0.1:5432/'+db+'\\nAUTH_TEST_DATABASE_ACK=isolated-synthetic-only\\n')
for migration in data['baseline']:sql(db,migration)
sql(db,data['seed'])
red=sql(db,data['invariants'],required=False)
assert red.returncode != 0 and 'auth_state' in red.stderr, 'Expected missing auth authority before migration'
sql(db,data['migration'])
green=sql(db,data['invariants'])
if data['ingestMigration']:
 sql(db,data['ingestSeed'])
 missing=sql(db,'SELECT state_version FROM \"IngestJob\" LIMIT 0;',required=False)
 assert missing.returncode!=0,'Expected missing Story1.6 snapshot before migration'
 sql(db,data['ingestMigration'])
 sql(db,data['ingestFixture'])
 sql(db,data['ingestInvariants'])
 sql(db,"""DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='IngestJob' AND column_name='state_version') THEN RAISE EXCEPTION 'Missing snapshot version'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='IngestCommand') THEN RAISE EXCEPTION 'Missing receipt authority'; END IF;
 END $$;""")
if data['eventMigration']:
 missing=sql(db,'SELECT event_stream_id FROM \"IngestJob\" LIMIT 0;',required=False)
 assert missing.returncode!=0,'Expected absent event schema before migration'
 sql(db,data['eventMigration'])
 sql(db,data['eventFixture'])
 sql(db,data['eventInvariants'])
assert 'auth-migration-invariants-passed' in green.stdout
backup=directory/'synthetic-auth.dump'
with backup.open('wb') as f:
    subprocess.run(['sudo','-n','-u','postgres','pg_dump','-Fc',db],stdout=f,stderr=subprocess.PIPE,check=True,timeout=30)
# postgres cannot traverse the private nomad-owned directory; stream the dump via stdin.
with backup.open('rb') as f:
    subprocess.run(['sudo','-n','-u','postgres','pg_restore','--exit-on-error','-d',restored],stdin=f,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,timeout=30)
checks="""DO $$ BEGIN
 IF (SELECT count(*) FROM "User")<>2 THEN RAISE EXCEPTION 'Owner restore mismatch'; END IF;
 IF (SELECT count(*) FROM "OAuthIdentity")<>3 THEN RAISE EXCEPTION 'Identity restore mismatch'; END IF;
 IF (SELECT count(*) FROM "Session")<>3 THEN RAISE EXCEPTION 'Session restore mismatch'; END IF;
 IF (SELECT count(*) FROM "User" WHERE auth_state='legacy-unverified')<>1 THEN RAISE EXCEPTION 'Legacy quarantine lost'; END IF;
 IF (SELECT count(*) FROM "Session" WHERE revoked_at IS NOT NULL)<>1 THEN RAISE EXCEPTION 'Revocation lost'; END IF;
END $$;"""
sql(restored,checks)
if data['ingestMigration']:sql(restored,data['ingestInvariants'])
if data['eventMigration']:sql(restored,data['eventInvariants'])
report={'host':socket.gethostname(),'database':db,'restoredDatabase':restored,
 'privateTestEnvironment':str(env),'backup':str(backup),'backupSha256':hashlib.sha256(backup.read_bytes()).hexdigest(),
 'ingestMigrationApplied':bool(data['ingestMigration']),
 'eventLogMigrationApplied':bool(data['eventMigration']),
 'workerStarted':False,
 'serverVersion':sql(db,"SHOW server_version;").stdout.strip(),
 'beforeMigrationRejected':True,'afterMigrationPassed':True,'restoredInvariantsPassed':True,
 'existingApplicationDatabaseTouched':False,'realAuthenticationVerified':False}
(directory/'report.json').write_text(json.dumps(report,indent=2)+'\\n')
print(json.dumps(report))
'''
remote = 'PAYLOAD=' + repr(json.dumps(payload)) + '\n' + remote
command = ['/mnt/c/Windows/System32/OpenSSH/ssh.exe', '-o', 'BatchMode=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=6',
           '-i', r'C:\Users\123\.ssh\id_ed25519', '-J', 'root@192.168.31.2',
           'nomad@192.168.31.104', 'python3 -']
result = subprocess.run(command, input=remote, text=True, capture_output=True, timeout=180)
if result.returncode:
    # Never echo a failed command/SQL statement containing the generated role password.
    print(json.dumps({'error': 'AUTH_ISOLATED_MIGRATION_PROBE_FAILED', 'exit': result.returncode}))
    raise SystemExit(1)
print(result.stdout.strip())
