import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeLegacyImports, type LegacyImportAuditInput } from './import-record-audit.js';

const ownerA = '10000000-0000-4000-8000-000000000001';
const ownerB = '10000000-0000-4000-8000-000000000002';
const note = 'https://www.xiaohongshu.com/explore/private-note?xsec_token=PRIVATE';

function job(id: string, userId = ownerA, sourceUrl: string | null = note, authVersion: number | null = 1) {
  return { id, userId, sourceUrl, sourceHash: `hash-${id}`, authVersion, deletedAt: null };
}

function input(jobs: LegacyImportAuditInput['jobs']): LegacyImportAuditInput {
  return { jobs, records: [], inspirations: [] };
}

await test('a unique qualified legacy URL is a backfill candidate without publishing private identifiers', () => {
  const result = analyzeLegacyImports(input([job('job-a')]));
  assert.equal(result.candidateJobs, 1);
  assert.equal(result.blockedJobs, 0);
  assert.equal(result.legacyCleartextJobUrls, 1);
  assert.equal(result.readOnly, true);
  assert.equal(result.changesApplied, false);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.ok(!JSON.stringify(result).includes('job-a'));
  assert.ok(!JSON.stringify(result).includes(ownerA));
});

await test('same-owner equivalent URLs block both jobs, while another owner remains independent', () => {
  const result = analyzeLegacyImports(input([
    job('job-a'),
    job('job-b', ownerA, 'http://xiaohongshu.com/explore/private-note/?utm_source=share&xsec_token=PRIVATE'),
    job('job-c', ownerB),
  ]));
  assert.equal(result.sameOwnerEquivalentGroups, 1);
  assert.equal(result.sameOwnerEquivalentJobs, 2);
  assert.equal(result.crossOwnerEquivalentGroups, 1);
  assert.equal(result.blockedJobs, 2);
  assert.equal(result.candidateJobs, 1);
});

await test('unknown owner, unsupported source, active record and linked record are not silently backfilled', () => {
  const data = input([
    job('unverified', ownerA, note, null),
    job('unsupported', ownerA, 'https://example.invalid/private'),
    job('collides', ownerA, 'https://www.xiaohongshu.com/explore/another'),
    job('linked', ownerB, note),
  ]);
  data.records = [
    { id: 'record-a', userId: ownerA, jobId: 'different-job', normalizedUrl: 'https://www.xiaohongshu.com/explore/another',
      activeNormalizedUrl: 'https://www.xiaohongshu.com/explore/another', normalizationVersion: 'xhs-import-v1', deletedAt: null },
    { id: 'record-b', userId: ownerB, jobId: 'linked', normalizedUrl: note,
      activeNormalizedUrl: note, normalizationVersion: 'xhs-import-v1', deletedAt: null },
  ];
  const result = analyzeLegacyImports(data);
  assert.equal(result.ownerEvidenceRequired, 1);
  assert.equal(result.unsupportedLegacyUrls, 1);
  assert.equal(result.activeRecordCollisions, 1);
  assert.equal(result.alreadyLinkedJobs, 1);
  assert.equal(result.candidateJobs, 0);
  assert.equal(result.blockedJobs, 3);
});

await test('owner and canonical disagreement in old inspirations blocks automatic mapping', () => {
  const data = input([job('job-a'), job('job-b', ownerB, 'https://www.xiaohongshu.com/explore/second')]);
  data.inspirations = [
    { id: 'inspiration-a', userId: ownerB, jobId: 'job-a', canonicalUrl: note, importRecordId: null, deletedAt: null },
    { id: 'inspiration-b', userId: ownerB, jobId: 'job-b', canonicalUrl: 'https://www.xiaohongshu.com/explore/different',
      importRecordId: null, deletedAt: null },
  ];
  const result = analyzeLegacyImports(data);
  assert.equal(result.inspirationOwnerConflicts, 1);
  assert.equal(result.canonicalDisagreements, 1);
  assert.equal(result.blockedJobs, 2);
  assert.equal(result.candidateJobs, 0);
  assert.equal(result.legacyCleartextInspirationUrls, 2);
});
