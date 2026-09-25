import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNativeBuildConfig } from '../src/platform/native-build-config.ts';
import { assertNativeConfigMatches } from './native-config-proof.mjs';

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
