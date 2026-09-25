"""Command-boundary counterexample: successful tools can describe a different backed-up cluster."""
import json, os, subprocess, sys, tempfile, unittest
from pathlib import Path
SCRIPT=Path(__file__).with_name('base-backup.py')
FAKE='''#!__PYTHON__
import json,os,sys
from pathlib import Path
name=Path(sys.argv[0]).name
if name=='psql':print('111')
elif name=='pg_basebackup':
 assert '--no-clean' in sys.argv
 target=Path(sys.argv[sys.argv.index('-D')+1]);(target/'backup_manifest').write_text('synthetic command-boundary fixture')
elif name=='pg_controldata':print('Database system identifier: '+os.environ['FIXTURE_BACKUP_SYSTEM_ID'])
'''.replace('__PYTHON__',sys.executable)
class BackupIdentityTests(unittest.TestCase):
 def run_fixture(self,identity):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);binary=root/'bin';binary.mkdir();backups=root/'backups';backups.mkdir(mode=0o700)
   for name in ['psql','pg_basebackup','pg_verifybackup','pg_controldata']:
    p=binary/name;p.write_text(FAKE);p.chmod(0o700)
   result=subprocess.run([sys.executable,str(SCRIPT),'--socket',str(root/'socket'),'--backup-root',str(backups),'--expected-system-id','111','--pg-bin',str(binary)],env={**os.environ,'FIXTURE_BACKUP_SYSTEM_ID':identity},capture_output=True,text=True)
   markers=list(backups.glob('*.verified.json'));directories=[p for p in backups.glob('backup-*') if p.is_dir()]
   return result.returncode,json.loads(result.stdout),len(markers),len(directories)
 def test_different_actual_backup_id_does_not_publish_verified_marker(self):
  code,report,markers,directories=self.run_fixture('222')
  self.assertNotEqual(code,0);self.assertEqual(report['result'],'failed');self.assertEqual(markers,0);self.assertEqual(directories,1)
 def test_matching_backup_id_publishes_only_verified_metadata(self):
  code,report,markers,directories=self.run_fixture('111')
  self.assertEqual(code,0);self.assertEqual(report['systemIdentifier'],'111');self.assertEqual(markers,1);self.assertEqual(directories,1)
if __name__=='__main__':unittest.main()
