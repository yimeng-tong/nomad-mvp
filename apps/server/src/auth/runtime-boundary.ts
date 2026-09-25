import type { AuthEnvironment, AuthRuntimeConfig } from './runtime-config.js';

export class AuthRuntimeBoundaryError extends Error {
  constructor(readonly code: 'AUTH_FIXTURE_FORBIDDEN' | 'AUTH_IMPLEMENTATION_UNAVAILABLE') {
    super(code);
    this.name = 'AuthRuntimeBoundaryError';
  }
}

/** Server-owned configuration only. Headers and request bodies never select this boundary. */
export function assertFixtureAuthAllowed(env: AuthEnvironment = process.env): void {
  if (!['local', 'test'].includes(env.AUTH_RUNTIME_MODE ?? '') || env.AUTH_PROVIDER !== 'fixture'
    || env.AUTH_TEST_ADAPTER_ENABLED !== 'true' || env.NODE_ENV === 'production') {
    throw new AuthRuntimeBoundaryError('AUTH_FIXTURE_FORBIDDEN');
  }
}

/** Only implemented provider/method combinations may proceed to the database readiness check. */
export function assertAuthRuntimeImplemented(config: AuthRuntimeConfig): void {
  if (config.provider.kind !== 'fixture' && !(config.provider.kind === 'aliyun-pnvs'
    && config.captcha.kind === 'aliyun-pnvs' && config.loginMethods.every((method) => method === 'phone'))) {
    throw new AuthRuntimeBoundaryError('AUTH_IMPLEMENTATION_UNAVAILABLE');
  }
}
