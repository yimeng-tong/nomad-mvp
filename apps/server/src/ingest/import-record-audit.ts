import { normalizeImportSourceUrl } from './url-normalization-policy.js';

type LegacyJob = {
  id: string;
  userId: string;
  sourceUrl: string | null;
  sourceHash: string;
  authVersion: number | null;
  deletedAt: Date | null;
};
type ExistingRecord = {
  id: string;
  userId: string;
  jobId: string;
  normalizedUrl: string;
  activeNormalizedUrl: string | null;
  normalizationVersion: string;
  deletedAt: Date | null;
};
type LegacyInspiration = {
  id: string;
  userId: string;
  jobId: string | null;
  canonicalUrl: string | null;
  importRecordId: string | null;
  deletedAt: Date | null;
};

export type LegacyImportAuditInput = {
  jobs: LegacyJob[];
  records: ExistingRecord[];
  inspirations: LegacyInspiration[];
};

/** Counts only. Never return owner, job, URL, token, hash or protected envelope. */
export function analyzeLegacyImports(input: LegacyImportAuditInput) {
  const activeRecords = new Map<string, ExistingRecord>();
  const linkedJobs = new Set<string>();
  for (const record of input.records) {
    linkedJobs.add(record.jobId);
    if (record.deletedAt === null && record.activeNormalizedUrl !== null)
      activeRecords.set(`${record.userId}\0${record.activeNormalizedUrl}`, record);
  }
  const inspirationsByJob = new Map<string, LegacyInspiration[]>();
  for (const inspiration of input.inspirations) {
    if (!inspiration.jobId) continue;
    const list = inspirationsByJob.get(inspiration.jobId) ?? [];
    list.push(inspiration);
    inspirationsByJob.set(inspiration.jobId, list);
  }
  const flags = new Map<string, Set<string>>();
  const equivalentByOwner = new Map<string, string[]>();
  const ownersByNormalizedUrl = new Map<string, Set<string>>();
  let legacyJobs = 0, legacyCleartextJobUrls = 0, legacyCleartextInspirationUrls = 0;
  let ownerEvidenceRequired = 0, unsupportedLegacyUrls = 0, activeRecordCollisions = 0;
  let inspirationOwnerConflicts = 0, canonicalDisagreements = 0, alreadyLinkedJobs = 0;

  for (const inspiration of input.inspirations) if (inspiration.canonicalUrl !== null) legacyCleartextInspirationUrls++;
  for (const job of input.jobs) {
    if (job.sourceUrl === null) continue;
    legacyCleartextJobUrls++;
    if (job.deletedAt !== null) continue;
    legacyJobs++;
    if (linkedJobs.has(job.id)) { alreadyLinkedJobs++; continue; }
    const reasons = new Set<string>();
    flags.set(job.id, reasons);
    if (job.authVersion === null) { ownerEvidenceRequired++; reasons.add('owner'); }
    let normalizedUrl: string | null = null;
    try { normalizedUrl = normalizeImportSourceUrl(job.sourceUrl).normalizedUrl; }
    catch { unsupportedLegacyUrls++; reasons.add('url'); }
    if (normalizedUrl !== null) {
      const key = `${job.userId}\0${normalizedUrl}`;
      const group = equivalentByOwner.get(key) ?? [];
      group.push(job.id);
      equivalentByOwner.set(key, group);
      const owners = ownersByNormalizedUrl.get(normalizedUrl) ?? new Set<string>();
      owners.add(job.userId);
      ownersByNormalizedUrl.set(normalizedUrl, owners);
      const record = activeRecords.get(key);
      if (record && record.jobId !== job.id) { activeRecordCollisions++; reasons.add('active-record'); }
    }
    for (const inspiration of inspirationsByJob.get(job.id) ?? []) {
      if (inspiration.userId !== job.userId) { inspirationOwnerConflicts++; reasons.add('inspiration-owner'); }
      if (inspiration.deletedAt !== null || inspiration.canonicalUrl === null || normalizedUrl === null) continue;
      try {
        if (normalizeImportSourceUrl(inspiration.canonicalUrl).normalizedUrl !== normalizedUrl) {
          canonicalDisagreements++; reasons.add('inspiration-url');
        }
      } catch { canonicalDisagreements++; reasons.add('inspiration-url'); }
    }
  }
  let sameOwnerEquivalentGroups = 0, sameOwnerEquivalentJobs = 0;
  for (const group of equivalentByOwner.values()) {
    if (group.length < 2) continue;
    sameOwnerEquivalentGroups++;
    sameOwnerEquivalentJobs += group.length;
    for (const id of group) flags.get(id)?.add('equivalent-url');
  }
  const blockedJobs = [...flags.values()].filter((reasons) => reasons.size > 0).length;
  return {
    kind: 'story-1-8-read-only-legacy-import-audit-v1',
    readOnly: true, changesApplied: false,
    checkedJobs: input.jobs.length, checkedRecords: input.records.length, checkedInspirations: input.inspirations.length,
    legacyJobs, legacyCleartextJobUrls, legacyCleartextInspirationUrls,
    candidateJobs: flags.size - blockedJobs, blockedJobs, alreadyLinkedJobs,
    ownerEvidenceRequired, unsupportedLegacyUrls, activeRecordCollisions,
    inspirationOwnerConflicts, canonicalDisagreements,
    sameOwnerEquivalentGroups, sameOwnerEquivalentJobs,
    crossOwnerEquivalentGroups: [...ownersByNormalizedUrl.values()].filter((owners) => owners.size > 1).length,
  };
}
