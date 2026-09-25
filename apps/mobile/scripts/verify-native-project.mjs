import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveNativeBuildConfig } from '../src/platform/native-build-config.ts';
import { assertNativeConfigMatches, assertNativePlatformTargets } from './native-config-proof.mjs';
import viteConfig from '../vite.config.ts';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(mobile, file), 'utf8');
const hash = (data) => createHash('sha256').update(data).digest('hex');
const config = resolveNativeBuildConfig(process.env);
const foundationOnly = process.argv.includes('--foundation-only');
if (foundationOnly) assert.ok((process.env.NOMAD_NATIVE_ENV || 'development') === 'development' && process.env.NOMAD_NATIVE_INCLUDE_AUTH === '0', 'Foundation-only verification must be explicit development configuration');
const files = (base, prefix = '') => readdirSync(resolve(mobile, base, prefix), { withFileTypes: true }).flatMap((entry) => {
  const file = join(prefix, entry.name);
  return entry.isDirectory() ? files(base, file) : [file];
});
assert.match(read('android/variables.gradle'), /minSdkVersion\s*=\s*29\b/, 'Android product minimum must be API29');
assertNativePlatformTargets({
  project: read('ios/App/App.xcodeproj/project.pbxproj'),
  spm: read('ios/App/CapApp-SPM/Package.swift'),
  webTargets: viteConfig.build.target,
  cssTargets: viteConfig.build.cssTarget,
});
assert.ok(existsSync(resolve(mobile, 'ios/App/App/SceneDelegate.swift')), 'Keep the Capacitor UIScene entry');
const authenticationRegistered = { android: /nomad-native-auth/.test(read('android/capacitor.settings.gradle')), ios: /NomadNativeAuth/.test(read('ios/App/CapApp-SPM/Package.swift')) };
const clipboardRegistered = {
  android: /capacitor-clipboard/.test(read('android/capacitor.settings.gradle')) && JSON.parse(read('android/app/src/main/assets/capacitor.plugins.json')).some((item) => item.pkg === '@capacitor/clipboard' && item.classpath === 'com.capacitorjs.plugins.clipboard.ClipboardPlugin'),
  ios: /CapacitorClipboard/.test(read('ios/App/CapApp-SPM/Package.swift')) && JSON.parse(read('ios/App/App/capacitor.config.json')).packageClassList?.includes('ClipboardPlugin') === true,
};
assert.ok(clipboardRegistered.android && clipboardRegistered.ios, 'Clipboard must be registered in both native projects');
if (!foundationOnly) assert.ok(authenticationRegistered.android && authenticationRegistered.ios, 'Native auth registration must be synchronized on both platforms');
assert.ok(read('android/app/build.gradle').includes(`applicationId "${config.appId}"`), 'Generated Android identity differs from build configuration');
assert.ok(read('ios/App/App.xcodeproj/project.pbxproj').includes(`PRODUCT_BUNDLE_IDENTIFIER = ${config.appId};`), 'Generated iOS identity differs from build configuration');
assert.ok(read('android/app/src/main/AndroidManifest.xml').includes('android:scheme="@string/custom_url_scheme"'), 'Android custom URL intent registration missing');
assert.ok(read('android/app/src/main/res/values/strings.xml').includes(`<string name="custom_url_scheme">${config.appId}</string>`), 'Android URL scheme differs from installed identity');
const iosSchemes = read('ios/App/App/Info.plist').match(/<key>CFBundleURLSchemes<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? '';
assert.ok(iosSchemes.includes(`<string>${config.appId}</string>`), 'iOS URL scheme differs from installed identity');
const webFiles = files('dist');
assert.ok(webFiles.includes('index.html') && webFiles.includes('webview-unavailable.html'));
const input = {};
for (const file of webFiles) input[file] = hash(readFileSync(resolve(mobile, 'dist', file)));
for (const [platform, assets, jsonPath] of [
  ['android', 'android/app/src/main/assets/public', 'android/app/src/main/assets/capacitor.config.json'],
  ['ios', 'ios/App/App/public', 'ios/App/App/capacitor.config.json'],
]) {
  const generated = JSON.parse(read(jsonPath));
  assertNativeConfigMatches(generated, config, platform);
  assert.equal(generated.appId, config.appId, `${platform} configuration identity drifted`);
  assert.deepEqual(generated.plugins.NomadNativeAuth, config.plugins.NomadNativeAuth, `${platform} native auth target drifted`);
  assert.ok(!generated.server?.url && !generated.server?.cleartext && !generated.server?.allowNavigation?.length, `${platform} has unsafe remote navigation`);
  for (const [file, digest] of Object.entries(input)) assert.equal(hash(readFileSync(resolve(mobile, assets, file))), digest, `${platform} copied stale asset ${file}`);
}
console.log(JSON.stringify({ scope: foundationOnly ? 'foundation-project-config-and-assets-only' : 'generated-project-config-and-copied-assets', authenticationRegistered, clipboardRegistered, appId: config.appId, files: webFiles.length, webAssetsSha256: hash(JSON.stringify(input)), webAssets: input, runtimeEvidenceAssessed: false }, null, 2));
