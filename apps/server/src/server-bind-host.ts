import type { AuthRuntimeMode } from './auth/runtime-config.js';

/** Keep the existing default, with an explicit loopback-only gateway option. */
export function resolveServerBindHost(mode: AuthRuntimeMode, requested?: string): '127.0.0.1' | '0.0.0.0' {
  const host = requested?.trim();
  if (host && host !== '127.0.0.1') throw new Error('API_BIND_HOST_INVALID');
  return host === '127.0.0.1' || mode === 'local' || mode === 'test' ? '127.0.0.1' : '0.0.0.0';
}
