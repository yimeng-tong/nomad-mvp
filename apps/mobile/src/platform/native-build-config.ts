import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

export const LOCAL_APP_ID = 'dev.nomad.mvp';
export const MIN_ANDROID_WEBVIEW = 111;
export const MIN_IOS_VERSION = '16.4';
export const WEB_BUILD_TARGETS = ['chrome111', 'edge111', 'firefox128', 'safari16.4', 'ios16.4'];
export const CSS_BUILD_TARGETS = [...WEB_BUILD_TARGETS];

/** Only these public build inputs cross into the application bundle. */
export function resolveNativeBuildConfig(env: Record<string, string | undefined>): CapacitorConfig {
  const value = (name: string) => env[name]?.trim() ?? '';
  const mode = value('NOMAD_NATIVE_ENV') || 'development';
  if (!['development', 'staging', 'release'].includes(mode)) throw new Error('NATIVE_ENV_INVALID');
  const development = mode === 'development';
  const authFlag = value('NOMAD_NATIVE_INCLUDE_AUTH');
  if (authFlag && authFlag !== '0' && authFlag !== '1') throw new Error('NATIVE_AUTH_FLAG_INVALID');
  if (!development && authFlag === '0') throw new Error('NATIVE_AUTH_REQUIRED');
  const suppliedId = value('NOMAD_NATIVE_APP_ID');
  if (!development && (!suppliedId || suppliedId === LOCAL_APP_ID || suppliedId.startsWith('dev.') || suppliedId.startsWith('com.example.'))) throw new Error('NATIVE_APP_ID_REQUIRED');
  const appId = suppliedId || LOCAL_APP_ID;
  if (!/^[a-z][a-z\d_]*(?:\.[a-z][a-z\d_]*){2,}$/.test(appId)) throw new Error('NATIVE_APP_ID_INVALID');

  let apiOrigin = '';
  const rawOrigin = value('NOMAD_NATIVE_API_ORIGIN');
  if (!rawOrigin && !development) throw new Error('NATIVE_API_ORIGIN_REQUIRED');
  if (rawOrigin) {
    try {
      const url = new URL(rawOrigin);
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.hostname.includes('*') || url.hostname.includes(':') || /^(?:\d+\.){3}\d+$/.test(url.hostname) || /[?#\s]/.test(rawOrigin)) throw new Error();
      apiOrigin = url.origin;
    } catch { throw new Error('NATIVE_API_ORIGIN_INVALID'); }
  }
  const apiBasePath = value('NOMAD_NATIVE_API_BASE_PATH') || '/api';
  if (!/^(?:\/[A-Za-z\d_-]+)+$/.test(apiBasePath)) throw new Error('NATIVE_API_BASE_PATH_INVALID');

  return {
    appId, appName: development ? 'Nomad Dev' : 'Nomad', webDir: 'dist',
    includePlugins: ['@capacitor/app', '@capacitor/keyboard', '@capacitor/browser', '@capacitor/clipboard', ...(authFlag === '0' ? [] : ['@nomad/native-auth'])],
    backgroundColor: '#f8faf7', loggingBehavior: 'none',
    server: { hostname: 'localhost', androidScheme: 'https', iosScheme: 'capacitor', cleartext: false, errorPath: 'webview-unavailable.html' },
    android: { allowMixedContent: false, webContentsDebuggingEnabled: development, minWebViewVersion: MIN_ANDROID_WEBVIEW },
    ios: { contentInset: 'never', webContentsDebuggingEnabled: development },
    plugins: {
      SystemBars: { insetsHandling: 'css', style: 'LIGHT', hidden: false },
      Keyboard: { resize: KeyboardResize.Native },
      NomadNativeAuth: { apiOrigin, apiBasePath },
    },
  };
}
