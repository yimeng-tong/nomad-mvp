"""Run one probe process group with a bounded timeout and descendant cleanup."""
import os, signal, subprocess
from dataclasses import dataclass
@dataclass
class ProbeResult:
    returncode: int
    stdout: str
    stderr: str
    timed_out: bool

def run_probe(command, *, cwd=None, env=None, timeout=180, grace=5):
    process = subprocess.Popen(command, cwd=cwd, env=env, text=True, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, start_new_session=True)
    timed_out = False
    def stop_group(sig):
        try: os.killpg(process.pid, sig)
        except ProcessLookupError: pass
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        stop_group(signal.SIGTERM)
        try: stdout, stderr = process.communicate(timeout=grace)
        except subprocess.TimeoutExpired:
            stop_group(signal.SIGKILL)
            stdout, stderr = process.communicate(timeout=grace)
    finally:
        # These probes may not leave background services after the owner process exits.
        stop_group(signal.SIGKILL)
    return ProbeResult(124 if timed_out else process.returncode, stdout, stderr, timed_out)
