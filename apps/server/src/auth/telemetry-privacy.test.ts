import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeAuthenticationErrorEvent } from './telemetry-privacy.js';

test('automatic telemetry drops signed provider URLs, raw errors, headers, bodies and nested private values', () => {
  const secret = 'sentinel-private-phone-key-cookie';
  const result = safeAuthenticationErrorEvent({
    event_id: secret, message: secret, user: { id: secret }, request: { url: `https://example.invalid/?key=${secret}`, headers: { cookie: secret }, data: secret },
    extra: { nested: { secret } }, contexts: { trace: { description: secret } },
    exception: { values: [{ type: secret, value: secret, stacktrace: { frames: [{ vars: { secret } }] } }] },
  });
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.match(result.event_id, /^[a-f0-9]{32}$/);
  assert.equal(result.exception.values[0].value, 'SERVER_ERROR');
});
test('only a fixed safe authentication code is retained from an exception', () => {
  assert.equal(safeAuthenticationErrorEvent({ exception: { values: [{ value: 'AUTH_AUTHORITY_UNAVAILABLE' }] } }).exception.values[0].value, 'AUTH_AUTHORITY_UNAVAILABLE');
});
