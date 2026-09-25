import {createIngestCheckpointStore,type IngestCheckpointJournal} from './ingest-checkpoint-store';
export type JournalScope = { ownerId: string; valid: () => boolean; signal?: AbortSignal };
export type StartPayload = { url: string } | { share_text: string };
export type RetryPayload = { jobId: string; expectedAttempt: number; expectedVersion: number };
type Cipher = { iv: Uint8Array<ArrayBuffer>; bytes: ArrayBuffer };
export type JournalOperation = {
  version: 1; ownerId: string; operationId: string; entryId: string; batchId: string; position: number; total: number;
  kind: 'start' | 'retry'; phase: 'unconfirmed' | 'accepted' | 'rejected';
  createdAt: number; expiresAt: number; payloadExpiresAt: number; payload: Cipher | null;
  jobId?: string; observedDoneAttempt?: number; retry?: RetryPayload;
  disposition?: 'created'|'reused'|'retried'; completionEligible?: boolean;
};
type InputClaim = { inputId: string; ownerId: string; batchId: string; expiresAt: number };
export type PreparedOperations = { created: boolean; records: JournalOperation[] };
export interface OperationJournal extends IngestCheckpointJournal {
  prepare(scope: JournalScope, inputs: StartPayload[], inputIds?: string | string[]): Promise<PreparedOperations>;
  prepareRetry(scope: JournalScope, entryId: string, input: RetryPayload): Promise<PreparedOperations>;
  list(scope: JournalScope): Promise<JournalOperation[]>;
  payload(scope: JournalScope, operationId: string): Promise<StartPayload | RetryPayload | null>;
  mark(scope: JournalScope, operationId: string, phase: JournalOperation['phase'], jobId?: string,receipt?:{disposition:'created'|'reused'|'retried';completionEligible:boolean}): Promise<void>;
  noteDone(scope: JournalScope, jobId: string, attempt: number): Promise<void>;
  claimed(inputId: string): Promise<boolean>;
  close(): void;
}
export class JournalError extends Error {
  constructor(readonly code: 'JOURNAL_UNAVAILABLE' | 'JOURNAL_CONTEXT_CHANGED' | 'JOURNAL_CORRUPT' | 'JOURNAL_CAPACITY' | 'INPUT_ALREADY_BOUND' | 'INPUT_REPLAY_CONFLICT' | 'JOURNAL_CHECKPOINT_CHANGED') { super(code); }
}
const day = 86400000, retention = 7 * day, capacity = 2048;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function guard(scope: JournalScope) {
  if (!scope.ownerId || scope.ownerId.length > 128 || !scope.valid() || scope.signal?.aborted) throw new JournalError('JOURNAL_CONTEXT_CHANGED');
}
function checkRecord(value: JournalOperation, ownerId?: string): JournalOperation {
  if (!value || value.version !== 1 || typeof value.ownerId !== 'string' || value.ownerId.length > 128 || ownerId && value.ownerId !== ownerId
    || !idPattern.test(value.operationId) || !idPattern.test(value.entryId) || !idPattern.test(value.batchId)
    || !['start', 'retry'].includes(value.kind) || !['unconfirmed', 'accepted', 'rejected'].includes(value.phase)
    || !Number.isSafeInteger(value.position) || !Number.isSafeInteger(value.total) || value.position < 1 || value.position > value.total || value.total > 100
    || !Number.isFinite(value.createdAt) || !Number.isFinite(value.expiresAt) || !Number.isFinite(value.payloadExpiresAt)
    || value.payload !== null && (!value.payload || !(value.payload.iv instanceof Uint8Array) || !(value.payload.iv.buffer instanceof ArrayBuffer) || value.payload.iv.length !== 12 || !(value.payload.bytes instanceof ArrayBuffer) || value.payload.bytes.byteLength > 16384)) throw new JournalError('JOURNAL_CORRUPT');
  if (value.kind === 'retry') { const retry = checkPayload('retry', value.retry) as RetryPayload; if (value.jobId !== retry.jobId) throw new JournalError('JOURNAL_CORRUPT'); }
  if(value.disposition!==undefined&&(!['created','reused','retried'].includes(value.disposition)||typeof value.completionEligible!=='boolean')||value.completionEligible!==undefined&&value.disposition===undefined)throw new JournalError('JOURNAL_CORRUPT');
  if (value.observedDoneAttempt !== undefined && (!Number.isSafeInteger(value.observedDoneAttempt) || value.observedDoneAttempt < 1)) throw new JournalError('JOURNAL_CORRUPT');
  return value;
}
function checkPayload(kind: JournalOperation['kind'], value: unknown): StartPayload | RetryPayload {
  if (!value || typeof value !== 'object') throw new JournalError('JOURNAL_CORRUPT');
  const body = value as Record<string, unknown>, keys = Object.keys(body);
  if (kind === 'start' && keys.length === 1 && ['url', 'share_text'].includes(keys[0]) && typeof body[keys[0]] === 'string'
    && (body[keys[0]] as string).trim() && (body[keys[0]] as string).length <= 2000) return value as StartPayload;
  if (kind === 'retry' && keys.length === 3 && typeof body.jobId === 'string' && body.jobId.length > 0 && body.jobId.length <= 128
    && Number.isSafeInteger(body.expectedAttempt) && Number(body.expectedAttempt) >= 1 && Number.isSafeInteger(body.expectedVersion) && Number(body.expectedVersion) >= 0) return value as RetryPayload;
  throw new JournalError('JOURNAL_CORRUPT');
}
const aad = (record: Pick<JournalOperation, 'ownerId' | 'operationId' | 'kind'>) => new TextEncoder().encode(JSON.stringify(['nomad-input-operation-v1', record.ownerId, record.operationId, record.kind]));

/** Device-local encrypted intent cache. Server receipts remain authoritative; this is not a credential vault or XSS boundary. */
export function createOperationJournal(name = 'nomad-input-operations-v1', clock = () => Date.now()): OperationJournal {
  let opening: Promise<IDBDatabase> | undefined, connection: IDBDatabase | undefined;
  const open = () => opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB || !crypto.subtle) { reject(new JournalError('JOURNAL_UNAVAILABLE')); return; }
    let settled = false;
    const request = indexedDB.open(name, 2);
    const timer = setTimeout(() => { settled = true; reject(new JournalError('JOURNAL_UNAVAILABLE')); }, 5000);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains('operations')){
      const operations = db.createObjectStore('operations', { keyPath: 'operationId' });
      operations.createIndex('ownerId', 'ownerId'); operations.createIndex('batchId', 'batchId'); operations.createIndex('entryId', 'entryId'); operations.createIndex('jobId', 'jobId');
      db.createObjectStore('claims', { keyPath: 'inputId' }); db.createObjectStore('keys', { keyPath: 'ownerId' });
      }
      if(!db.objectStoreNames.contains('checkpoints')){const checkpoints=db.createObjectStore('checkpoints',{keyPath:['ownerId','jobId']});checkpoints.createIndex('ownerId','ownerId');}
    };
    request.onerror = request.onblocked = () => { clearTimeout(timer); settled = true; reject(new JournalError('JOURNAL_UNAVAILABLE')); };
    request.onsuccess = () => {
      clearTimeout(timer);
      if (settled) { request.result.close(); return; }
      settled = true; const db = request.result; connection = db;
      const invalidate = () => { if (connection === db) { connection = undefined; opening = undefined; } };
      db.onclose = invalidate; db.onversionchange = () => { db.close(); invalidate(); }; resolve(db);
    };
  }).catch((error) => { opening = undefined; throw error instanceof JournalError ? error : new JournalError('JOURNAL_UNAVAILABLE'); });

  async function transaction<T>(stores: string[], mode: IDBTransactionMode, scope: JournalScope | undefined,
    work: (tx: IDBTransaction, done: (value: T) => void, run: (fn: () => void) => void) => void): Promise<T> {
    if (scope) guard(scope);
    const db = await open(); if (scope) guard(scope);
    return new Promise<T>((resolve, reject) => {
      let tx: IDBTransaction;
      try { tx = db.transaction(stores, mode, mode === 'readwrite' ? { durability: 'strict' } : undefined); }
      catch { if (connection === db) { connection = undefined; opening = undefined; } reject(new JournalError('JOURNAL_UNAVAILABLE')); return; }
      let result: T, failure: unknown;
      const run = (fn: () => void) => { try { if (scope) guard(scope); fn(); } catch (error) { failure = error; try{tx.abort();}catch{/* Already aborted or committed. */} } };
      const abortScope=()=>{failure=new JournalError('JOURNAL_CONTEXT_CHANGED');try{tx.abort();}catch{/* A transaction already committed cannot be undone. */}};
      const cleanup=()=>scope?.signal?.removeEventListener('abort',abortScope);
      scope?.signal?.addEventListener('abort',abortScope,{once:true});
      tx.oncomplete = () => { cleanup();try { if (scope) guard(scope); resolve(result); } catch (error) { reject(error); } };
      tx.onerror = tx.onabort = () => {cleanup();reject(failure instanceof JournalError ? failure : new JournalError('JOURNAL_UNAVAILABLE'));};
      run(() => work(tx, (value) => { result = value; }, run));
    });
  }
  async function key(scope: JournalScope, create = true): Promise<{key:CryptoKey;id:string}> {
    const validate = (value: CryptoKey) => {
      if (!value || value.type !== 'secret' || value.extractable || value.algorithm.name !== 'AES-GCM' || !value.usages.includes('encrypt') || !value.usages.includes('decrypt')) throw new JournalError('JOURNAL_CORRUPT');
      return value;
    };
    const stored = await transaction<{ key: CryptoKey; expiresAt: number;id?:string } | undefined>(['keys'], 'readonly', scope, (tx, done, run) => {
      const request = tx.objectStore('keys').get(scope.ownerId); request.onsuccess = () => run(() => done(request.result));
    });
    if ((!stored || stored.expiresAt <= clock()) && !create) throw new JournalError('JOURNAL_CORRUPT');
    const fresh = stored && stored.expiresAt > clock() ? validate(stored.key) : await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); guard(scope);
    return transaction<{key:CryptoKey;id:string}>(['keys'], 'readwrite', scope, (tx, done, run) => {
      const store = tx.objectStore('keys'), cursor = store.openCursor();
      cursor.onsuccess = () => run(() => {
        const entry = cursor.result;
        if (entry) { if (Number.isFinite(entry.value.expiresAt) && entry.value.expiresAt <= clock()) entry.delete(); entry.continue(); return; }
        const request = store.get(scope.ownerId);
        request.onsuccess = () => run(() => {
          const value = request.result ? validate(request.result.key) : fresh;
          const count = store.count(); count.onsuccess = () => run(() => {
            if (!request.result && count.result >= capacity) throw new JournalError('JOURNAL_CAPACITY');
            const id=typeof request.result?.id==='string'&&idPattern.test(request.result.id)?request.result.id:crypto.randomUUID();
            store.put({ ownerId: scope.ownerId, key: value, id, expiresAt: clock() + retention }); done({key:value,id});
          });
        });
      });
    });
  }

  async function encrypted(scope: JournalScope, record: JournalOperation, body: StartPayload | RetryPayload) {
    const value = checkPayload(record.kind, body), secret = await key(scope); guard(scope);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(record) }, secret.key, new TextEncoder().encode(JSON.stringify(value)));
    guard(scope); return { ...record, payload: { iv, bytes } };
  }
  const fresh = (scope: JournalScope, batchId: string, position: number, total: number, kind: JournalOperation['kind'], entryId?: string): JournalOperation => {
    const operationId = crypto.randomUUID(), now = clock();
    return { version: 1, ownerId: scope.ownerId, operationId, entryId: entryId ?? operationId, batchId, position, total, kind,
      phase: 'unconfirmed', createdAt: now, expiresAt: now + retention, payloadExpiresAt: now + day, payload: null };
  };
  const readRows = (tx: IDBTransaction, index: string, value: string, done: (rows: JournalOperation[]) => void, run: (fn: () => void) => void) => {
    const request = tx.objectStore('operations').index(index).getAll(value); request.onsuccess = () => run(() => done(request.result));
  };
  function maintenance(tx: IDBTransaction, run: (fn: () => void) => void, next: () => void) {
    const stores = ['operations', 'claims', 'keys', 'checkpoints'];
    const scan = (index: number) => {
      if (index === stores.length) { next(); return; }
      const request = tx.objectStore(stores[index]).openCursor();
      request.onsuccess = () => run(() => {
        const cursor = request.result;
        if (!cursor) { scan(index + 1); return; }
        const row = cursor.value;
        if (Number.isFinite(row.expiresAt) && row.expiresAt <= clock()) cursor.delete();
        else if (stores[index] === 'operations' && row.payload && Number.isFinite(row.payloadExpiresAt) && row.payloadExpiresAt <= clock()) cursor.update({ ...row, payload: null });
        cursor.continue();
      });
    };
    scan(0);
  }
  async function insert(scope: JournalScope, records: JournalOperation[], inputIds: string[] = [], retryEntry?: string): Promise<PreparedOperations> {
    return transaction<PreparedOperations>(['operations', 'claims', 'keys', 'checkpoints'], 'readwrite', scope, (tx, done, run) => {
      const store = tx.objectStore('operations'), claims = tx.objectStore('claims');
      const add = () => {
        const count = store.count(); count.onsuccess = () => run(() => {
          if (count.result + records.length > capacity) throw new JournalError('JOURNAL_CAPACITY');
          const claimCount = claims.count(); claimCount.onsuccess = () => run(() => {
            if (claimCount.result + inputIds.length > capacity) throw new JournalError('JOURNAL_CAPACITY');
            for (const record of records) store.add(record);
            for (const inputId of inputIds) claims.put({ inputId, ownerId: scope.ownerId, batchId: records[0].batchId, expiresAt: records[0].expiresAt } satisfies InputClaim);
            done({ created: true, records });
          });
        });
      };
      maintenance(tx, run, () => {
      if (retryEntry) {
        readRows(tx, 'entryId', retryEntry, (rows) => {
          rows.forEach((row) => checkRecord(row, scope.ownerId));
          const existing = rows.find((row) => row.kind === 'retry' && row.phase === 'unconfirmed' && row.expiresAt > clock());
          if (existing) done({ created: false, records: [existing] }); else add();
        }, run);
      } else if (inputIds.length) {
        const found: InputClaim[] = []; let remaining = inputIds.length;
        for (const inputId of inputIds) {
          const request = claims.get(inputId); request.onsuccess = () => run(() => {
            if (request.result) found.push(request.result as InputClaim);
            if (--remaining) return;
            if (found.some((claim) => claim.ownerId !== scope.ownerId)) throw new JournalError('INPUT_ALREADY_BOUND');
            if (!found.length) { add(); return; }
            if (found.length !== inputIds.length || new Set(found.map((claim) => claim.batchId)).size !== 1) throw new JournalError('INPUT_REPLAY_CONFLICT');
            readRows(tx, 'batchId', found[0].batchId, (rows) => {
              const originals = rows.filter((row) => row.kind === 'start').sort((a, b) => a.position - b.position);
              originals.forEach((row) => checkRecord(row, scope.ownerId));
              if (!originals.length || originals.length !== originals[0].total || originals.some((row, index) => row.position !== index + 1 || row.total !== originals.length)) throw new JournalError('JOURNAL_CORRUPT');
              done({ created: false, records: originals });
            }, run);
          });
        }
      } else add();
      });
    });
  }
  return {
    ...createIngestCheckpointStore({transaction,key,guard,clock,fail:code=>new JournalError(code)}),
    async prepare(scope, inputs, inputIds) {
      guard(scope);
      const ids = inputIds === undefined ? [] : typeof inputIds === 'string' ? [inputIds] : [...new Set(inputIds)];
      if (!inputs.length || inputs.length > 100 || ids.length > 100 || ids.some((id) => !/^[a-f0-9]{64}$/.test(id))) throw new JournalError('JOURNAL_CORRUPT');
      const batchId = crypto.randomUUID(), records: JournalOperation[] = [];
      for (let index = 0; index < inputs.length; index++) records.push(await encrypted(scope, fresh(scope, batchId, index + 1, inputs.length, 'start'), inputs[index]));
      return insert(scope, records, ids);
    },
    async prepareRetry(scope, entryId, input) {
      guard(scope);
      checkPayload('retry', input);
      const original = await transaction<JournalOperation>(['operations'], 'readonly', scope, (tx, done, run) => {
        readRows(tx, 'entryId', entryId, (rows) => {
          const retained = rows.filter((row) => row.expiresAt > clock()).sort((a, b) => b.createdAt - a.createdAt);
          if (!retained.length) throw new JournalError('JOURNAL_CORRUPT');
          done(checkRecord(retained[0], scope.ownerId));
        }, run);
      });
      // Retry tuples contain only public job/version references, so retain them with command metadata.
      const record = { ...fresh(scope, original.batchId, original.position, original.total, 'retry', entryId), jobId: input.jobId, retry: { ...input } };

      return insert(scope, [record], [], entryId);
    },
    async list(scope) {
      return transaction<JournalOperation[]>(['operations', 'claims', 'keys', 'checkpoints'], 'readwrite', scope, (tx, done, run) => {
        maintenance(tx, run, () => readRows(tx, 'ownerId', scope.ownerId, (rows) => {
          const records: JournalOperation[] = [], store = tx.objectStore('operations');
          for (const value of rows) {
            const row = checkRecord(value, scope.ownerId);
            if (row.expiresAt <= clock()) { store.delete(row.operationId); continue; }
            if (row.payload && row.payloadExpiresAt <= clock()) { row.payload = null; store.put(row); }
            records.push(row);
          }
          done(records.sort((a, b) => a.createdAt - b.createdAt || a.position - b.position));
        }, run));
      });
    },
    async payload(scope, operationId) {
      const record = await transaction<JournalOperation | null>(['operations', 'claims', 'keys', 'checkpoints'], 'readwrite', scope, (tx, done, run) => {
        maintenance(tx, run, () => {
          const request = tx.objectStore('operations').get(operationId); request.onsuccess = () => run(() => done(request.result ? checkRecord(request.result, scope.ownerId) : null));
        });
      });
      if (!record || record.expiresAt <= clock()) return null;
      if (record.kind === 'retry') return checkPayload('retry', record.retry) as RetryPayload;
      if (!record.payload || record.payloadExpiresAt <= clock()) return null;

      try {
        const secret = await key(scope, false); guard(scope);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.payload.iv, additionalData: aad(record) }, secret.key, record.payload.bytes);
        guard(scope); return checkPayload(record.kind, JSON.parse(new TextDecoder().decode(plain)));
      } catch (error) { throw error instanceof JournalError ? error : new JournalError('JOURNAL_CORRUPT'); }
    },
    async mark(scope, operationId, phase, jobId,receipt) {
      return transaction<void>(['operations'], 'readwrite', scope, (tx, done, run) => {
        const store = tx.objectStore('operations'), request = store.get(operationId);
        request.onsuccess = () => run(() => {
          const row = checkRecord(request.result, scope.ownerId);
          if (row.phase === 'accepted' && phase !== 'accepted') { done(); return; }
          if(row.phase==='accepted'&&row.jobId&&jobId&&row.jobId!==jobId)throw new JournalError('JOURNAL_CORRUPT');
          if(receipt&&(!['created','reused','retried'].includes(receipt.disposition)||typeof receipt.completionEligible!=='boolean'))throw new JournalError('JOURNAL_CORRUPT');
          store.put({ ...row, phase, ...(jobId ? { jobId } : {}), ...(!row.disposition&&receipt?receipt:{}), payload: phase === 'accepted' ? null : row.payload }); done();
        });
      });
    },
    async noteDone(scope, jobId, attempt) {
      return transaction<void>(['operations','checkpoints'], 'readwrite', scope, (tx, done, run) => {
        readRows(tx, 'jobId', jobId, (rows) => {
          for (const row of rows) if (row.ownerId === scope.ownerId) { checkRecord(row, scope.ownerId); tx.objectStore('operations').put({ ...row, observedDoneAttempt: Math.max(row.observedDoneAttempt ?? 0, attempt) }); }
          const store=tx.objectStore('checkpoints'),request=store.get([scope.ownerId,jobId]);request.onsuccess=()=>run(()=>{if(request.result)store.put({...request.result,observedDoneAttempt:Math.max(request.result.observedDoneAttempt??0,attempt)});done();});
        }, run);
      });
    },
    async claimed(inputId) {
      if (!/^[a-f0-9]{64}$/.test(inputId)) return true;
      return transaction<boolean>(['claims'], 'readwrite', undefined, (tx, done, run) => {
        const store = tx.objectStore('claims'), request = store.get(inputId); request.onsuccess = () => run(() => {
          const claim = request.result as InputClaim | undefined;
          if (claim && claim.expiresAt <= clock()) store.delete(inputId);
          done(!!claim && claim.expiresAt > clock());
        });
      });
    },
    close() { void opening?.then((db) => db.close()).catch(() => {}); connection = undefined; opening = undefined; },
  };
}

// Constructing this handle does not open storage; authenticated callers choose when to restore.
export const operationJournal = createOperationJournal();
