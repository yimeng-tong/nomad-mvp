import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNativeBuildConfig } from '../src/platform/native-build-config.ts';
import { alignAppSpmMinimum, assertNativeConfigMatches, assertNativePlatformTargets } from './native-config-proof.mjs';

const release = resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'release', NOMAD_NATIVE_APP_ID: 'cn.nomad.travel', NOMAD_NATIVE_API_ORIGIN: 'https://api.nomad.test' });
test('generated release config must match all security and compatibility settings', () => {
  assertNativeConfigMatches(structuredClone(release), release, 'android');
  for (const mutate of [
    (c) => { c.android.allowMixedContent = true; },
    (c) => { c.android.minWebViewVersion = 1; },
    (c) => { c.android.webContentsDebuggingEnabled = true; },
    (c) => { c.appName = 'Nomad Dev'; },
    (c) => { c.loggingBehavior = 'debug'; },
    (c) => { c.includePlugins = []; },
    (c) => { c.server.url = 'https://other.test'; },
    (c) => { c.server.allowNavigation = ['*']; },
  ]) {
    const candidate = structuredClone(release); mutate(candidate);
    assert.throws(() => assertNativeConfigMatches(candidate, release, 'android'), /configuration drifted/);
  }
});
test('iOS managed registrations are permitted but debugging drift is rejected', () => {
  const candidate = { ...structuredClone(release), packageClassList: ['AppPlugin'] };
  assertNativeConfigMatches(candidate, release, 'ios');
  candidate.ios.webContentsDebuggingEnabled = true;
  assert.throws(() => assertNativeConfigMatches(candidate, release, 'ios'), /configuration drifted/);
});
test('unknown generated settings cannot silently bypass the source config', () => {
  assert.throws(() => assertNativeConfigMatches({ ...release, arbitraryOverride: true }, release, 'android'), /Unexpected generated/);
});

test('all native and web targets agree; mixed or incomplete platform updates fail', () => {
  const source = {
    project: 'IPHONEOS_DEPLOYMENT_TARGET = 16.4;\n'.repeat(4),
    spm: 'platforms: [.iOS("16.4")],',
    webTargets: ['chrome111', 'edge111', 'firefox128', 'safari16.4', 'ios16.4'],
    cssTargets: ['chrome111', 'edge111', 'firefox128', 'safari16.4', 'ios16.4'],
  };
  assertNativePlatformTargets(source);
  for (const mutate of [
    (c) => { c.project = c.project.replace('16.4', '16.0'); },
    (c) => { c.project += '"IPHONEOS_DEPLOYMENT_TARGET[sdk=iphoneos*]" = 16.0;'; },
    (c) => { c.project = 'IPHONEOS_DEPLOYMENT_TARGET = 16.4;'; },
    (c) => { c.spm = 'platforms: [.iOS(.v16)],'; },
    (c) => { c.webTargets[2] = 'firefox114'; },
    (c) => { c.cssTargets = ['chrome111', 'safari16']; },
  ]) {
    const candidate = structuredClone(source); mutate(candidate);
    assert.throws(() => assertNativePlatformTargets(candidate));
  }
});

test('Capacitor regenerated SPM keeps the approved minor floor without changing dependency declarations', () => {
  const source = 'platforms: [.iOS(.v16)],\ndependencies: [.package(path: "plugins/native-auth")]';
  const aligned = alignAppSpmMinimum(source);
  assert.equal(aligned, 'platforms: [.iOS("16.4")],\ndependencies: [.package(path: "plugins/native-auth")]');
  assert.equal(alignAppSpmMinimum(aligned), aligned);
  for (const invalid of ['platforms: [.iOS(.v17)]', 'platforms: [.macOS(.v14)]', source + source]) {
    assert.throws(() => alignAppSpmMinimum(invalid));
  }
});
