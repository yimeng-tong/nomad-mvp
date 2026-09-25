import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dbOwnerId, legacyOwnerId, sourceOwnerHashes } from './owner.js';

const real = { AUTH_RUNTIME_MODE: 'staging', AUTH_PROVIDER: 'aliyun-pnvs' };
const fixture = { AUTH_RUNTIME_MODE: 'test', AUTH_PROVIDER: 'fixture', AUTH_TEST_ADAPTER_ENABLED: 'true' };
test('verified database owners are never hashed for a second time', () => {
  const id = '10000000-0000-4000-8000-000000000001';
  assert.equal(dbOwnerId(id, real), id);
  assert.notEqual(legacyOwnerId(id), id);
  assert.equal(dbOwnerId(id, fixture), legacyOwnerId(id));
  assert.throws(() => dbOwnerId('u_untrusted_old_actor', real), /AUTH_OWNER_INVALID/);
});
test('retained deduplication hashes are searched only through explicit scoped aliases', () => {
  const owner = '10000000-0000-4000-8000-000000000001';
  const url = 'https://example.invalid/synthetic';
  const hashes = sourceOwnerHashes(owner, url, ['u_legacy', 'u_legacy']);
  assert.equal(hashes.length, 2);
  assert.notEqual(hashes[0], hashes[1]);
  assert.deepEqual(sourceOwnerHashes(owner, url, []), [hashes[0]]);
  assert.ok(!hashes.includes(owner));
});
