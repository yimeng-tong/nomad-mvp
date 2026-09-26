import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveServerBindHost } from './server-bind-host.js';

await test('staging API can bind only the loopback gateway address by explicit request', () => {
  assert.equal(resolveServerBindHost('staging', '127.0.0.1'), '127.0.0.1');
  assert.equal(resolveServerBindHost('staging'), '0.0.0.0');
  assert.equal(resolveServerBindHost('local'), '127.0.0.1');
  assert.throws(() => resolveServerBindHost('staging', '0.0.0.0'), /API_BIND_HOST_INVALID/);
  assert.throws(() => resolveServerBindHost('staging', '192.168.31.104'), /API_BIND_HOST_INVALID/);
});
