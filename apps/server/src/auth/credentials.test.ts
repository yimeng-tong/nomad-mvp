import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newCredential, credentialHash, browserBindingHash, normalizeCnPhone, validCredential } from './credentials.js';

test('session secrets have independent entropy and domain-separated nonreversible storage', () => {
  const a = newCredential(); const b = newCredential();
  assert.notEqual(a, b);
  assert.equal(validCredential(a), true);
  assert.equal(a.length, 43);
  assert.match(credentialHash(a), /^[a-f0-9]{64}$/);
  assert.equal(credentialHash(a), credentialHash(a));
  assert.notEqual(credentialHash(a), browserBindingHash(a));
  assert.ok(!credentialHash(a).includes(a));
});

test('public references and legacy fixture session IDs are not credentials', () => {
  for (const value of ['', 'sess_12345678-1234-4234-8234-123456789abc',
    '12345678-1234-4234-8234-123456789abc', ' '.repeat(43), 'a'.repeat(44)]) {
    assert.equal(validCredential(value), false);
  }
});

test('phone canonicalization covers domestic input and never invents a user ID', () => {
  for (const value of ['13800000000', '+86 138-0000-0000', '8613800000000']) {
    assert.equal(normalizeCnPhone(value, 'CN'), '+8613800000000');
  }
  for (const value of ['+12025550123', '10086', 'invalid', '13800000000 extension 1']) {
    assert.throws(() => normalizeCnPhone(value, 'CN'), /AUTH_PARAMS_INVALID/);
  }
  assert.throws(() => normalizeCnPhone('13800000000', 'US'), /AUTH_REGION_UNSUPPORTED/);
});
