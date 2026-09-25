import importlib.util, json, os, signal, sys, tempfile, time, unittest
from pathlib import Path
from unittest.mock import Mock
spec=importlib.util.spec_from_file_location('bounded_process',Path(__file__).with_name('bounded_process.py'));module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
def process_exited(status):
 try:
  stat=status.read_text()
 except (FileNotFoundError, ProcessLookupError):
  return True
 # The comm field is parenthesized and can itself contain spaces.
 return stat.rsplit(')',1)[1].split()[0]=='Z'
class BoundedProcessTests(unittest.TestCase):
 def test_timeout_stops_parent_and_pipe_holding_descendant(self):
  code="import subprocess,sys,time; p=subprocess.Popen([sys.executable,'-c','import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)']);print(p.pid,flush=True);time.sleep(60)"
  began=time.monotonic();result=module.run_probe([sys.executable,'-c',code],timeout=.2,grace=.2)
  self.assertTrue(result.timed_out);self.assertEqual(result.returncode,124);self.assertLess(time.monotonic()-began,3)
  child=int(result.stdout.strip());status=Path(f'/proc/{child}/stat')
  self.assertTrue(process_exited(status))
 def test_normal_failure_keeps_output_and_exit_status(self):
  result=module.run_probe([sys.executable,'-c','print("probe-failed");raise SystemExit(7)'],timeout=3)
  self.assertFalse(result.timed_out);self.assertEqual(result.returncode,7);self.assertEqual(result.stdout.strip(),'probe-failed')
 def test_stat_disappearing_during_read_is_an_exited_process(self):
  for error in (FileNotFoundError,ProcessLookupError):
   status=Mock();status.read_text.side_effect=error()
   self.assertTrue(process_exited(status))
 def test_live_process_and_unrelated_read_errors_are_not_ignored(self):
  status=Mock();status.read_text.return_value='123 (command with spaces) S 1 2'
  self.assertFalse(process_exited(status))
  status.read_text.return_value='123 (command with spaces) Z 1 2'
  self.assertTrue(process_exited(status))
  status.read_text.side_effect=PermissionError()
  self.assertRaises(PermissionError,process_exited,status)
if __name__=='__main__':unittest.main()
