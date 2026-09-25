#!/usr/bin/env python3
"""Run the real SDK only in the dedicated emulator, with both IP families rejected for its UID."""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import time
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
PACKAGE = 'dev.nomad.sdkprobe'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', required=True)
    parser.add_argument('--serial', default='emulator-5566')
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.serial != 'emulator-5566':
        raise ValueError('PROBE_EMULATOR_TARGET_INVALID')

    def adb(*words, timeout=90):
        return subprocess.check_output([args.adb, '-s', args.serial, *words], text=True, stderr=subprocess.STDOUT, timeout=timeout).strip()

    if adb('shell', 'getprop', 'ro.kernel.qemu') != '1' or adb('shell', 'getprop', 'ro.product.cpu.abi') != 'x86':
        raise ValueError('PROBE_NOT_EXPECTED_EMULATOR')
    avd = adb('shell', 'getprop', 'ro.boot.qemu.avd_name') or adb('shell', 'getprop', 'ro.kernel.qemu.avd_name')
    if avd != 'nomad-umeng-fixture' or adb('shell', 'getprop', 'sys.boot_completed') != '1':
        raise ValueError('PROBE_EMULATOR_NOT_READY')
    adb('root'); adb('wait-for-device')
    if adb('shell', 'id', '-u') != '0':
        raise ValueError('PROBE_ROOT_UNAVAILABLE')
    apk = ROOT / 'ops/telemetry/android-probe/app/build/outputs/apk/debug/app-debug.apk'
    adb('install', '-r', '-t', str(apk), timeout=120)
    package_info = adb('shell', 'pm', 'list', 'packages', '-U', PACKAGE)
    match = re.fullmatch(r'package:dev\.nomad\.sdkprobe uid:(\d+)', package_info)
    if not match or not 10000 <= int(match[1]) <= 19999:
        raise ValueError('PROBE_UID_INVALID')
    uid = match[1]
    for table in ['iptables', 'ip6tables']:
        rule = ['OUTPUT', '-m', 'owner', '--uid-owner', uid, '-j', 'REJECT']
        try:
            adb('shell', table, '-C', *rule)
        except subprocess.CalledProcessError:
            adb('shell', table, '-I', 'OUTPUT', '1', *rule[1:])
        adb('shell', table, '-C', *rule)
    # Only this dedicated synthetic application's data is reset; no real Nomad package or device is touched.
    adb('shell', 'am', 'force-stop', PACKAGE)
    if adb('shell', 'pm', 'clear', PACKAGE) != 'Success':
        raise ValueError('PROBE_RESET_FAILED')
    nonce = uuid.uuid4().hex
    rows = []
    try:
        adb('shell', 'am', 'start', '-n', PACKAGE + '/.ProbeActivity', '--es', 'run_nonce', nonce, '--ez', 'network_isolated', 'true')
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            output = adb('logcat', '-d', '-v', 'brief', '-s', 'NomadSdkProbe:I', '*:S')
            parsed = []
            for line in output.splitlines():
                start = line.find('{')
                if start < 0:
                    continue
                try:
                    value = json.loads(line[start:])
                except json.JSONDecodeError:
                    continue
                if value.get('run_nonce') == nonce:
                    parsed.append(value)
            rows = list({row['phase']: row for row in parsed}.values())
            if any(row['phase'] == 'after_disable_10s' for row in rows):
                break
            time.sleep(1)
        if len(rows) != 5:
            raise ValueError('PROBE_OBSERVATIONS_INCOMPLETE')
        for table in ['iptables', 'ip6tables']:
            adb('shell', table, '-C', 'OUTPUT', '-m', 'owner', '--uid-owner', uid, '-j', 'REJECT')
        result = {'scope': 'real-sdk-offline-emulator-lifecycle', 'serial': args.serial, 'avd': avd, 'api': adb('shell', 'getprop', 'ro.build.version.sdk'),
                  'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'sdkVersions': {'common': '9.9.10', 'asms': '1.8.7.2'},
                  'outboundIsolation': {'uid': int(uid), 'ipv4RejectVerified': True, 'ipv6RejectVerified': True, 'rulesRetained': True},
                  'realTenantKeyUsed': False, 'realProviderQueryVerified': False, 'fullStopAndCacheClearVerified': False, 'observations': rows}
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({'result': 'sdk-lifecycle-observed', 'observations': len(rows), 'fullStopAndCacheClearVerified': False}))
    finally:
        adb('shell', 'am', 'force-stop', PACKAGE)


if __name__ == '__main__':
    main()
