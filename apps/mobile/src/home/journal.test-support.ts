/** Explicit unit-test fixture only. Production callers use IndexedDB; this file is never imported by the app. */
import { JournalError, type JournalOperation, type JournalScope, type OperationJournal, type StartPayload, type RetryPayload } from './operation-journal';
export function createJournalFixture(): OperationJournal {
  const records = new Map<string, JournalOperation>(), payloads = new Map<string, StartPayload | RetryPayload>();
  const claims = new Map<string, { ownerId: string; batchId: string }>();
  const guard = (scope: JournalScope) => { if (!scope.valid()) throw new JournalError('JOURNAL_CONTEXT_CHANGED'); };
  const copy = (row: JournalOperation) => structuredClone(row);
  const make = (scope: JournalScope, batchId: string, position: number, total: number, kind: 'start' | 'retry', entryId?: string): JournalOperation => {
    const id = crypto.randomUUID(); return { version: 1, ownerId: scope.ownerId, operationId: id, entryId: entryId ?? id, batchId, position, total, kind,
      phase: 'unconfirmed', payload: null, createdAt: Date.now(), expiresAt: Date.now() + 604800000, payloadExpiresAt: Date.now() + 86400000 };
  };
  return {
    // This legacy controller fixture has no durable transport; 1.7 persistence tests use real IndexedDB.
    async readCheckpoint(){return {value:null,revision:null,corrupt:false};},
    async commitEvent(){throw new JournalError('JOURNAL_UNAVAILABLE');},
    async commitResync(){throw new JournalError('JOURNAL_UNAVAILABLE');},
    async prepare(scope, inputs, inputIds) {
      guard(scope); const ids = inputIds === undefined ? [] : typeof inputIds === 'string' ? [inputIds] : [...new Set(inputIds)];
      const existing = ids.map((id) => claims.get(id)).filter((claim): claim is { ownerId: string; batchId: string } => !!claim);
      if (existing.length) {
        if (existing.some((claim) => claim.ownerId !== scope.ownerId)) throw new JournalError('INPUT_ALREADY_BOUND');
        if (existing.length !== ids.length || new Set(existing.map((claim) => claim.batchId)).size !== 1) throw new JournalError('INPUT_REPLAY_CONFLICT');
        const claim = existing[0];
        return { created: false, records: [...records.values()].filter((row) => row.batchId === claim.batchId && row.kind === 'start').map(copy) };
      }
      const batchId = crypto.randomUUID(), rows = inputs.map((body, index) => {
        const row = make(scope, batchId, index + 1, inputs.length, 'start'); records.set(row.operationId, row); payloads.set(row.operationId, structuredClone(body)); return copy(row);
      });
      for (const inputId of ids) claims.set(inputId, { ownerId: scope.ownerId, batchId });
      return { created: true, records: rows };
    },
    async prepareRetry(scope, entryId, body) {
      guard(scope); const rows = [...records.values()].filter((row) => row.ownerId === scope.ownerId && row.entryId === entryId);
      const pending = rows.find((row) => row.kind === 'retry' && row.phase === 'unconfirmed');
      if (pending) return { created: false, records: [copy(pending)] };
      const base = rows[0]; if (!base) throw new JournalError('JOURNAL_CORRUPT');
      const row = { ...make(scope, base.batchId, base.position, base.total, 'retry', entryId), jobId: body.jobId, retry: { ...body } };
      records.set(row.operationId, row); payloads.set(row.operationId, { ...body }); return { created: true, records: [copy(row)] };
    },
    async list(scope) { guard(scope); return [...records.values()].filter((row) => row.ownerId === scope.ownerId).map(copy); },
    async payload(scope, id) { guard(scope); const row = records.get(id); if (!row || row.ownerId !== scope.ownerId) throw new JournalError('JOURNAL_CORRUPT'); return payloads.has(id) ? structuredClone(payloads.get(id)!) : null; },
    async mark(scope, id, phase, jobId,receipt) { guard(scope); const row = records.get(id); if (!row || row.ownerId !== scope.ownerId) throw new JournalError('JOURNAL_CORRUPT'); if (row.phase === 'accepted' && phase !== 'accepted') return; Object.assign(row, { phase, ...(jobId ? { jobId } : {}), ...(!row.disposition&&receipt?receipt:{}) }); if (phase === 'accepted') payloads.delete(id); },
    async noteDone(scope, jobId, attempt) { guard(scope); for (const row of records.values()) if (row.ownerId === scope.ownerId && row.jobId === jobId) row.observedDoneAttempt = Math.max(row.observedDoneAttempt ?? 0, attempt); },
    async claimed(id) { return claims.has(id); }, close() {},
  };
}
