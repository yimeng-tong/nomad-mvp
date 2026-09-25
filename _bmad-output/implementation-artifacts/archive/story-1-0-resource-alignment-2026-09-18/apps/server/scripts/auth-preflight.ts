import { AuthConfigurationError, readAuthRuntimeConfig, summarizeAuthConfiguration } from '../src/auth/runtime-config.js';

// Read-only configuration validation. No SDK, server, DB connection or provider call is started.
try {
  const config = readAuthRuntimeConfig(process.env);
  process.stdout.write(`${JSON.stringify(summarizeAuthConfiguration(config), null, 2)}\n`);
} catch (error: unknown) {
  const result = error instanceof AuthConfigurationError
    ? { code: error.code, issues: error.issues, realServicesVerified: false }
    : { code: 'AUTH_PREFLIGHT_FAILED', realServicesVerified: false };
  process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = 1;
}
