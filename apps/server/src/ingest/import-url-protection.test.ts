import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';
import { loadImportUrlKeyring, openImportOriginalUrl, sealImportOriginalUrl } from './import-url-protection.js';

const key = randomBytes(32);
const keyring = { activeKeyId: 'test-v1', keys: new Map([['test-v1', key]]) };
const ownerId = randomUUID();
const recordId = randomUUID();
const originalUrl = 'https://xhslink.com/PRIVATE_CODE?xsec_token=PRIVATE_TOKEN#copied';

await test('seals the original URL with a fresh nonce and binds it to owner and record', () => {
  const first = sealImportOriginalUrl({ ownerId, recordId, originalUrl }, keyring);
  const second = sealImportOriginalUrl({ ownerId, recordId, originalUrl }, keyring);
  assert.equal(first.version, 1);
  assert.equal(first.key_id, 'test-v1');
  assert.notEqual(first.iv, second.iv);
  assert.ok(!JSON.stringify(first).includes('PRIVATE_CODE'));
  assert.ok(!JSON.stringify(first).includes('PRIVATE_TOKEN'));
  assert.equal(openImportOriginalUrl(first, { ownerId, recordId }, keyring), originalUrl);
  assert.throws(() => openImportOriginalUrl(first, { ownerId: randomUUID(), recordId }, keyring), /INGEST_URL_PROTECTION_INVALID/);
  assert.throws(() => openImportOriginalUrl(first, { ownerId, recordId: randomUUID() }, keyring), /INGEST_URL_PROTECTION_INVALID/);
  assert.throws(() => openImportOriginalUrl({ ...first, ciphertext: second.ciphertext }, { ownerId, recordId }, keyring), /INGEST_URL_PROTECTION_INVALID/);
  assert.throws(() => openImportOriginalUrl({ ...first, ciphertext: 'A'.repeat(9000) }, { ownerId, recordId }, keyring), /INGEST_URL_PROTECTION_INVALID/);
});

await test('requires a valid server-only keyring and rejects missing or unknown keys', () => {
  assert.throws(() => loadImportUrlKeyring({}), /INGEST_URL_PROTECTION_UNAVAILABLE/);
  assert.throws(() => loadImportUrlKeyring({ IMPORT_URL_KEYRING_JSON: '{bad' }), /INGEST_URL_PROTECTION_UNAVAILABLE/);
  assert.throws(() => loadImportUrlKeyring({ IMPORT_URL_KEYRING_JSON: JSON.stringify({ activeKeyId: 'v1', keys: { v1: Buffer.alloc(32).toString('base64') } }) }),
    /INGEST_URL_PROTECTION_UNAVAILABLE/);
  const parsed = loadImportUrlKeyring({ IMPORT_URL_KEYRING_JSON: JSON.stringify({ activeKeyId: 'test-v1', keys: { 'test-v1': key.toString('base64') } }) });
  const sealed = sealImportOriginalUrl({ ownerId, recordId, originalUrl }, parsed);
  assert.equal(openImportOriginalUrl(sealed, { ownerId, recordId }, parsed), originalUrl);
  const nextKey = randomBytes(32);
  const rotated = loadImportUrlKeyring({ IMPORT_URL_KEYRING_JSON: JSON.stringify({ activeKeyId: 'test-v2', keys: {
    'test-v1': key.toString('base64'), 'test-v2': nextKey.toString('base64'),
  } }) });
  assert.equal(openImportOriginalUrl(sealed, { ownerId, recordId }, rotated), originalUrl);
  assert.equal(sealImportOriginalUrl({ ownerId, recordId, originalUrl }, rotated).key_id, 'test-v2');
  assert.throws(() => openImportOriginalUrl({ ...sealed, key_id: 'removed-key' }, { ownerId, recordId }, parsed), /INGEST_URL_PROTECTION_UNAVAILABLE/);
});
