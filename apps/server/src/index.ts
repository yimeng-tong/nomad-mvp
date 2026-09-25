import { AuthConfigurationError, readAuthRuntimeConfig } from './auth/runtime-config.js';
import { AuthRuntimeBoundaryError, assertAuthRuntimeImplemented } from './auth/runtime-boundary.js';
import { AuthFault } from './auth/errors.js';

try {
  // Validate before importing modules that can construct network clients or workers.
  const config = readAuthRuntimeConfig(process.env);
  assertAuthRuntimeImplemented(config);
  const service = config.provider.kind === 'fixture' ? undefined
    : await (await import('./auth/runtime.js')).createPersistentAuthRuntime(config);
  const { buildApplication } = await import('./application.js');
  const app = await buildApplication(config, service);
  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: ['local', 'test'].includes(config.mode) ? '127.0.0.1' : '0.0.0.0' });
} catch (error: unknown) {
  const safe = error instanceof AuthConfigurationError ? { code: error.code, issues: error.issues }
    : error instanceof AuthRuntimeBoundaryError || error instanceof AuthFault ? { code: error.code }
    : { code: 'SERVER_STARTUP_FAILED' };
  process.stderr.write(`${JSON.stringify(safe)}\n`);
  process.exitCode = 1;
}
