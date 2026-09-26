import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeImportSourceUrl, XHS_IMPORT_URL_POLICY_VERSION } from './url-normalization-policy.js';

await test('normalizes only known URL syntax and tracking parameters while preserving access tokens', () => {
  const originalUrl = 'https://xiaohongshu.com/explore/note123/?utm_source=share&xsec_token=PRIVATE#copied';
  const result = normalizeImportSourceUrl(originalUrl);
  assert.deepEqual(result, {
    originalUrl,
    normalizedUrl: 'https://www.xiaohongshu.com/explore/note123?xsec_token=PRIVATE',
    policyVersion: XHS_IMPORT_URL_POLICY_VERSION,
    resolution: 'direct',
  });
  assert.equal(normalizeImportSourceUrl('http://www.xiaohongshu.com/explore/note123?xsec_token=PRIVATE').normalizedUrl,
    result.normalizedUrl);
});

await test('a supported short URL is not guessed into a note without a validated resolution', () => {
  const short = normalizeImportSourceUrl('https://xhslink.com/ShareCase');
  assert.equal(short.normalizedUrl, 'https://xhslink.com/ShareCase');
  assert.equal(short.resolution, 'short-unresolved');
  assert.notEqual(short.normalizedUrl, normalizeImportSourceUrl('https://www.xiaohongshu.com/explore/ShareCase').normalizedUrl);

  const resolved = normalizeImportSourceUrl('https://xhslink.com/ShareCase', {
    resolvedUrl: 'https://xiaohongshu.com/explore/note123/?utm_campaign=share&xsec_token=PRIVATE',
  });
  assert.equal(resolved.normalizedUrl, 'https://www.xiaohongshu.com/explore/note123?xsec_token=PRIVATE');
  assert.equal(resolved.resolution, 'short-resolved');
  assert.equal(resolved.originalUrl, 'https://xhslink.com/ShareCase');
});

await test('rejects forged or unsupported resolutions and retains unknown semantic parameters', () => {
  for (const resolvedUrl of [
    'https://xiaohongshu.com.evil.invalid/explore/a',
    'https://name:secret@www.xiaohongshu.com/explore/a',
    'http://127.0.0.1/explore/a',
    'https://www.xiaohongshu.com:444/explore/a',
    'https://www.xiaohongshu.com/account/settings',
  ]) {
    assert.throws(() => normalizeImportSourceUrl('https://xhslink.com/one', { resolvedUrl }), /INGEST_URL_POLICY_UNSUPPORTED/);
  }
  assert.throws(() => normalizeImportSourceUrl('https://example.invalid/explore/a'), /INGEST_URL_POLICY_UNSUPPORTED/);
  assert.throws(() => normalizeImportSourceUrl('https://xhslink.com/'), /INGEST_URL_POLICY_UNSUPPORTED/);
  assert.throws(() => normalizeImportSourceUrl('https://www.xiaohongshu.com/'), /INGEST_URL_POLICY_UNSUPPORTED/);
  assert.throws(() => normalizeImportSourceUrl(`https://www.xiaohongshu.com/explore/${'a'.repeat(2100)}`), /INGEST_URL_POLICY_UNSUPPORTED/);
  assert.throws(() => normalizeImportSourceUrl('https://www.xiaohongshu.com/explore/a', { resolvedUrl: 'https://www.xiaohongshu.com/explore/b' }), /INGEST_URL_POLICY_UNSUPPORTED/);
  assert.equal(normalizeImportSourceUrl('https://www.xiaohongshu.com/user/profile/person/a').normalizedUrl,
    'https://www.xiaohongshu.com/user/profile/person/a');
  assert.equal(normalizeImportSourceUrl('https://www.xiaohongshu.com/discovery/item/a?xsec_source=home').normalizedUrl,
    'https://www.xiaohongshu.com/discovery/item/a?xsec_source=home');
});
