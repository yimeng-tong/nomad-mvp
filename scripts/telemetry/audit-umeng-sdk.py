#!/usr/bin/env python3
"""Inspect pinned public SDK archives. Never initialize SDKs or use application/account keys."""
import argparse
import hashlib
import io
import json
import pathlib
import plistlib
import re
import subprocess
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
MAX_BYTES = 32 * 1024 * 1024
ALLOWED = {'repo.maven.apache.org', 'umplus-sdk-download.oss-cn-shanghai.aliyuncs.com'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_archive(row, cache):
    from urllib.parse import urlsplit
    parsed = urlsplit(row['url'])
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('SDK_SOURCE_INVALID')
    target = cache / (row['name'] + '-' + row['version'] + '.archive')
    if target.exists():
        data = target.read_bytes()
    else:
        with urllib.request.urlopen(row['url'], timeout=30) as response:
            final = urlsplit(response.url)
            if final.scheme != 'https' or final.hostname not in ALLOWED:
                raise ValueError('SDK_REDIRECT_INVALID')
            data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES or digest(data) != row['sha256']:
            raise ValueError('SDK_CHECKSUM_MISMATCH')
        target.write_bytes(data)
    if len(data) > MAX_BYTES or digest(data) != row['sha256']:
        raise ValueError('SDK_CHECKSUM_MISMATCH')
    archive = zipfile.ZipFile(io.BytesIO(data))
    if len(archive.infolist()) > 5000 or sum(info.file_size for info in archive.infolist()) > 256 * 1024 * 1024:
        raise ValueError('SDK_ARCHIVE_LIMIT')
    return archive, len(data)


def android(row, archive, cache, javap):
    manifest = ET.fromstring(archive.read('AndroidManifest.xml'))
    names = '{http://schemas.android.com/apk/res/android}name'
    result = {'manifestPermissions': [item.attrib.get(names) for item in manifest.findall('uses-permission')],
              'manifestComponents': [{**item.attrib, 'tag': item.tag} for app in manifest.findall('application') for item in app]}
    classes = cache / (row['name'] + '-classes.jar')
    classes.write_bytes(archive.read('classes.jar'))
    if row['name'] == 'common':
        public = subprocess.check_output([javap, '-public', '-classpath', str(classes), 'com.umeng.commonsdk.UMConfigure', 'com.umeng.analytics.MobclickAgent'], text=True, timeout=30)
        result['publicApi'] = [line.strip() for line in public.splitlines() if line.strip().startswith('public static') and '(' in line]
        code = subprocess.check_output([javap, '-c', '-classpath', str(classes), 'com.umeng.analytics.MobclickAgent'], text=True, timeout=30)
        body = code.split('public static void disable();', 1)[1].split('public static', 1)[0]
        instructions = [re.sub(r'^\s*\d+:\s*', '', line).split('//')[0].strip() for line in body.splitlines() if re.match(r'^\s*\d+:', line)]
        result['disableOnlyWritesAnalyticsEnableFalse'] = bool(len(instructions) == 3 and instructions[0] == 'iconst_0' and instructions[1].startswith('putstatic') and instructions[2] == 'return' and 'AnalyticsConfig.enable:Z' in body)
        result['fullStopAndCacheClearVerified'] = False
    return result


def ios(row, archive):
    paths = [name for name in archive.namelist() if not name.startswith('__MACOSX/')]
    infos = [name for name in paths if name.endswith('.xcframework/Info.plist')]
    headers = [name for name in paths if name.endswith(('/UMConfigure.h', '/MobClick.h'))]
    declarations = set()
    for name in headers:
        text = archive.read(name).decode('utf-8')
        declarations.update(line.strip() for line in text.splitlines() if re.match(r'^\s*\+\s*\(', line))
    return {'xcframeworks': [{'path': name.rsplit('/', 1)[0], 'libraries': plistlib.loads(archive.read(name))['AvailableLibraries']} for name in infos],
            'privacyManifestPaths': [name for name in paths if name.endswith('/PrivacyInfo.xcprivacy')],
            'publicHeaderApi': sorted(declarations), 'fullStopAndCacheClearVerified': False, 'macCompilationVerified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=pathlib.Path)
    parser.add_argument('--javap', required=True)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    lock_path = ROOT / 'ops/telemetry/umeng-sdk-lock.json'
    lock = json.loads(lock_path.read_text())
    cache = args.cache_dir or pathlib.Path(tempfile.mkdtemp(prefix='nomad-umeng-audit-'))
    cache.mkdir(parents=True, exist_ok=True)
    rows = []
    for row in lock['artifacts']:
        with load_archive(row, cache)[0] as archive:
            details = android(row, archive, cache, args.javap) if row['platform'] == 'android' else ios(row, archive)
        rows.append({**row, 'checksumMatched': True, **details})
    report = {'scope': 'static-public-sdk-artifact-inspection', 'lockSha256': digest(lock_path.read_bytes()),
              'scriptSha256': digest(pathlib.Path(__file__).read_bytes()), 'artifacts': rows,
              'sdkInitialized': False, 'realProviderEvents': 0, 'deviceExecutionVerified': False, 'runtimeIntegrationApproved': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'result': 'static-sdk-audit-complete', 'artifacts': len(rows), 'runtimeIntegrationApproved': False}))


if __name__ == '__main__':
    main()
