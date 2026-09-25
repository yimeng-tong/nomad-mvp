import importlib.util, json, os, signal, sys, tempfile, time, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('bounded_process',Path(__file__).with_name('bounded_process.py'));module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
class BoundedProcessTests(unittest.TestCase):
 def test_timeout_stops_parent_and_pipe_holding_descendant(self):
  code="import subprocess,sys,time; p=subprocess.Popen([sys.executable,'-c','import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)']);print(p.pid,flush=True);time.sleep(60)"
  began=time.monotonic();result=module.run_probe([sys.executable,'-c',code],timeout=.2,grace=.2)
  self.assertTrue(result.timed_out);self.assertEqual(result.returncode,124);self.assertLess(time.monotonic()-began,3)
  child=int(result.stdout.strip());status=Path(f'/proc/{child}/stat')
  self.assertTrue(not status.exists() or status.read_text().split()[2]=='Z')
 def test_normal_failure_keeps_output_and_exit_status(self):
  result=module.run_probe([sys.executable,'-c','print("probe-failed");raise SystemExit(7)'],timeout=3)
  self.assertFalse(result.timed_out);self.assertEqual(result.returncode,7);self.assertEqual(result.stdout.strip(),'probe-failed')
if __name__=='__main__':unittest.main()
