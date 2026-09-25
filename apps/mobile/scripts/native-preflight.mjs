import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveNativeBuildConfig, LOCAL_APP_ID } from '../src/platform/native-build-config.ts';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nativePath = (value) => Boolean(value && !/^\/mnt\/[a-z]\//i.test(value) && !/^[a-z]:/i.test(value));
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const java = process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, 'bin/java') : 'java';
const javaResult = spawnSync(java, ['-version'], { encoding: 'utf8', timeout: 10000 });
const javaVersion = javaResult.status === 0 ? (javaResult.stderr + javaResult.stdout).match(/version "([^"]+)"/)?.[1] ?? null : null;
const mac = process.platform === 'darwin';
const xcode = mac ? spawnSync('xcodebuild', ['-version'], { encoding: 'utf8', timeout: 15000 }) : null;
const report = {
  scope: 'read-only-configuration-and-tool-inventory',
  configuration: { valid: false, mode: process.env.NOMAD_NATIVE_ENV || 'development', developmentIdentity: true, apiConfigured: false, error: null },
  tools: { node: process.version, platform: process.platform, java: javaVersion, linuxOrMacJava: !process.env.JAVA_HOME || nativePath(process.env.JAVA_HOME), androidPlatform36: Boolean(nativePath(sdk) && existsSync(resolve(sdk, 'platforms/android-36/android.jar'))), androidBuildTools36: Boolean(nativePath(sdk) && existsSync(resolve(sdk, 'build-tools/36.0.0/aapt2'))), xcode: xcode?.status === 0 ? xcode.stdout.trim() : null },
  projects: { android: existsSync(resolve(mobile, 'android/app/build.gradle')), ios: existsSync(resolve(mobile, 'ios/App/App.xcodeproj/project.pbxproj')) },
  readyForNativeBuild: { android: false, ios: false },
  signingVerified: false, deviceInstallVerified: false, testFlightVerified: false,
};
try {
  const config = resolveNativeBuildConfig(process.env);
  report.configuration = { valid: true, mode: report.configuration.mode, developmentIdentity: config.appId === LOCAL_APP_ID || config.appId.startsWith('dev.'), apiConfigured: Boolean(config.plugins.NomadNativeAuth.apiOrigin), error: null };
} catch (error) {
  report.configuration.error = /^NATIVE_[A-Z_]+$/.test(error.message) ? error.message : 'NATIVE_CONFIG_INVALID';
}
report.readyForNativeBuild.android = report.configuration.valid && report.projects.android && report.tools.linuxOrMacJava && Number(javaVersion?.split('.')[0]) === 21 && report.tools.androidPlatform36 && report.tools.androidBuildTools36;
report.readyForNativeBuild.ios = report.configuration.valid && report.projects.ios && Boolean(report.tools.xcode);
console.log(JSON.stringify(report, null, 2));
// Exit 0 means this inventory ran with valid configuration, not signing/runtime readiness.
process.exitCode = report.configuration.valid ? 0 : 1;
