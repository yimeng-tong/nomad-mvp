import { describe, expect, it } from 'vitest';
import { resolveNativeBuildConfig } from './native-build-config';

describe('native build configuration boundaries', () => {
  it('allows an explicitly local scaffold without inventing a real API', () => {
    const config = resolveNativeBuildConfig({});
    expect(config.appId).toBe('dev.nomad.mvp');
    expect(config.plugins?.NomadNativeAuth).toEqual({ apiOrigin: '', apiBasePath: '/api' });
    expect(config.server?.url).toBeUndefined();
    expect(config.server?.cleartext).toBe(false);
    expect(config.loggingBehavior).toBe('none');
    expect(config.server?.allowNavigation).toBeUndefined();
  });
  it('requires a supplied non-development identity and HTTPS origin for distributable profiles', () => {
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'release' })).toThrow('NATIVE_APP_ID_REQUIRED');
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'staging', NOMAD_NATIVE_APP_ID: 'cn.nomad.travel' })).toThrow('NATIVE_API_ORIGIN_REQUIRED');
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'release', NOMAD_NATIVE_APP_ID: 'dev.nomad.mvp', NOMAD_NATIVE_API_ORIGIN: 'https://api.nomad.test' })).toThrow('NATIVE_APP_ID_REQUIRED');
  });
  it.each(['http://localhost:3000', 'https://api.nomad.test/api', 'https://secret@api.nomad.test', 'https://api.nomad.test/?token=secret', 'https://api.nomad.test/#secret', 'https://*.nomad.test', 'https://127.0.0.1', 'https://[::1]', 'https://2130706433'])('rejects unsafe or ambiguous origins: %s', (origin) => {
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_API_ORIGIN: origin })).toThrow('NATIVE_API_ORIGIN_INVALID');
  });
  it.each(['/api/../auth', '//api', '/api?token=x', '/api%2fauth', 'api'])('rejects unsafe API base paths: %s', (base) => {
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_API_BASE_PATH: base })).toThrow('NATIVE_API_BASE_PATH_INVALID');
  });
  it('keeps only public native configuration and separates the API path', () => {
    const config = resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'staging', NOMAD_NATIVE_APP_ID: 'cn.nomad.travel', NOMAD_NATIVE_API_ORIGIN: 'https://api.nomad.test/', NOMAD_NATIVE_API_BASE_PATH: '/api/v1', ALIYUN_ACCESS_KEY_SECRET: 'do-not-package-me' });
    expect(config.plugins?.NomadNativeAuth).toEqual({ apiOrigin: 'https://api.nomad.test', apiBasePath: '/api/v1' });
    expect(config.android?.webContentsDebuggingEnabled).toBe(false);
    expect(JSON.stringify(config)).not.toContain('do-not-package-me');
  });
  it('rejects unknown modes without falling back to development', () => {
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'prodution' })).toThrow('NATIVE_ENV_INVALID');
  });
  it('allows an explicit foundation-only development build but rejects it for distribution', () => {
    expect(resolveNativeBuildConfig({ NOMAD_NATIVE_INCLUDE_AUTH: '0' }).includePlugins).not.toContain('@nomad/native-auth');
    expect(() => resolveNativeBuildConfig({ NOMAD_NATIVE_ENV: 'release', NOMAD_NATIVE_INCLUDE_AUTH: '0' })).toThrow('NATIVE_AUTH_REQUIRED');
  });
});
