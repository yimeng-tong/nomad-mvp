/** Real IndexedDB/WebCrypto across two Chromium processes. All owners and inputs are synthetic. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const puppeteer = createRequire(new URL('../../server/package.json', import.meta.url))('puppeteer');
const root = resolve(import.meta.dirname, '../../..'), origin = 'http://127.0.0.1:5189';
const profile = await mkdtemp('/tmp/nomad-journal-browser-');
const name = `nomad-journal-proof-${randomUUID()}`, output = resolve(root, process.env.JOURNAL_PROBE_OUTPUT ?? '_bmad-output/implementation-artifacts/evidence/story-1-6-journal-2026-09-19');
await mkdir(output, { recursive: true });
const source = 'apps/mobile/src/home/operation-journal.ts';
const sourceHash = createHash('sha256').update(await readFile(resolve(root, source))).digest('hex');
const nonce = randomUUID(), config = resolve(await mkdtemp('/tmp/nomad-journal-vite-'), 'config.mjs');
await writeFile(config, `export default { root: ${JSON.stringify(resolve(root, 'apps/mobile'))}, plugins: [{name:'journal-proof-identity',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__journal_probe_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}] };`);
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--host', '127.0.0.1', '--port', '5189', '--strictPort'], { cwd: resolve(root, 'apps/mobile'), stdio: 'ignore' });
let browser;
async function page() {
  const p = await browser.newPage(); await p.setRequestInterception(true);
  p.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) return request.abort();
    if (url.href === origin + '/') return request.respond({ status: 200, contentType: 'text/html', body: '<html><body>Isolated journal fixture</body></html>' });
    return request.continue();
  });
  await p.goto(origin);
  await p.evaluate(async (dbName) => {
    const module = await import('/src/home/operation-journal.ts');
    window.proofClock = 1800000000000; window.proofValid = true;
    window.scope = (ownerId = 'synthetic-owner-a') => ({ ownerId, valid: () => window.proofValid });
    window.journal = module.createOperationJournal(dbName, () => window.proofClock);
    window.proofDbName = dbName;
    window.rows = () => new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName); request.onerror = () => reject(new Error('read failed'));
      request.onsuccess = () => { const db = request.result, tx = db.transaction('operations'), all = tx.objectStore('operations').getAll(); all.onsuccess = () => resolve(all.result); tx.oncomplete = () => db.close(); };
    });
  }, name);
  return p;
}
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('Owned proof server exited before readiness');
    try { if (await (await fetch(origin + '/__journal_probe_identity')).text() === nonce) { ready = true; break; } } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, 'Could not verify owned proof server');
  browser = await puppeteer.launch({ headless: true, userDataDir: profile, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const a = await page(), b = await page();
  const attempts = await Promise.all([a, b].map((p) => p.evaluate(() => window.journal.prepare(window.scope(), [
    { url: 'https://xhslink.com/synthetic-private-one' }, { share_text: '合成的私人输入二' },
  ], ['a'.repeat(64), 'c'.repeat(64)]))));
  assert.equal(attempts.filter((value) => value.created).length, 1);
  assert.deepEqual(attempts[0].records.map((row) => row.operationId), attempts[1].records.map((row) => row.operationId));
  const [first, second] = attempts[0].records;
  const before = await a.evaluate(async ([firstId, secondId]) => {
    const rows = await window.rows();
    const payload = await window.journal.payload(window.scope(), secondId);
    let foreign = '', replay = '';
    try { await window.journal.payload(window.scope('synthetic-owner-b'), secondId); } catch (error) { foreign = error.code; }
    try { await window.journal.prepare(window.scope('synthetic-owner-b'), [{ url: 'https://xhslink.com/other' }], 'a'.repeat(64)); } catch (error) { replay = error.code; }
    await window.journal.mark(window.scope(), firstId, 'accepted', 'synthetic-job');
    return { count: rows.length, serialized: JSON.stringify(rows), payload, foreign, replay, erased: await window.journal.payload(window.scope(), firstId) };
  }, [first.operationId, second.operationId]);
  assert.equal(before.count, 2); assert.equal(before.foreign, 'JOURNAL_CORRUPT'); assert.equal(before.replay, 'INPUT_ALREADY_BOUND');
  assert.equal(before.serialized.includes('synthetic-private-one'), false); assert.equal(before.serialized.includes('合成的私人输入二'), false);
  assert.deepEqual(before.payload, { share_text: '合成的私人输入二' }); assert.equal(before.erased, null);
  const retry = await Promise.all([a, b].map((p) => p.evaluate((entryId) => window.journal.prepareRetry(window.scope(), entryId, { jobId: 'synthetic-job', expectedAttempt: 1, expectedVersion: 3 }), first.operationId)));
  assert.equal(retry.filter((value) => value.created).length, 1); assert.equal(retry[0].records[0].operationId, retry[1].records[0].operationId);
  const replay = await a.evaluate(() => window.journal.prepare(window.scope(), [{ url: 'https://xhslink.com/ignored-replay' }], 'a'.repeat(64)));
  assert.deepEqual(replay.records.map((row) => row.operationId), attempts[0].records.map((row) => row.operationId));
  assert.ok(replay.records.every((row) => row.kind === 'start'));
  const multi = await a.evaluate(async () => {
    let conflict = '';
    try { await window.journal.prepare(window.scope(), [{ url: 'https://xhslink.com/preserved-new-input' }], ['a'.repeat(64), 'd'.repeat(64)]); } catch (error) { conflict = error.code; }
    return { both: await window.journal.claimed('a'.repeat(64)) && await window.journal.claimed('c'.repeat(64)), conflict, newClaim: await window.journal.claimed('d'.repeat(64)) };
  });
  assert.equal(multi.both, true); assert.equal(multi.conflict, 'INPUT_REPLAY_CONFLICT'); assert.equal(multi.newClaim, false);
  await browser.close(); browser = undefined;
  browser = await puppeteer.launch({ headless: true, userDataDir: profile, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const restored = await page();
  const after = await restored.evaluate(async (secondId) => ({ rows: (await window.journal.list(window.scope())).length,
    other: (await window.journal.list(window.scope('synthetic-owner-b'))).length, payload: await window.journal.payload(window.scope(), secondId), claim: await window.journal.claimed('a'.repeat(64)) }), second.operationId);
  assert.equal(after.rows, 3); assert.equal(after.other, 0); assert.deepEqual(after.payload, { share_text: '合成的私人输入二' }); assert.equal(after.claim, true);
  const checks = await restored.evaluate(async ([secondId, entryId, retryId]) => {
    const key = await new Promise((resolve, reject) => {
      const open = indexedDB.open(window.proofDbName); open.onerror = () => reject(new Error('open failed'));
      open.onsuccess = () => { const db = open.result, tx = db.transaction('keys'), request = tx.objectStore('keys').get('synthetic-owner-a'); request.onsuccess = () => resolve(request.result.key); tx.oncomplete = () => db.close(); };
    });
    let nonExtractable = false;
    try { await crypto.subtle.exportKey('raw', key); } catch { nonExtractable = key.extractable === false; }
    const flip = () => new Promise((resolve, reject) => {
      const open = indexedDB.open(window.proofDbName); open.onerror = () => reject(new Error('open failed'));
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction('operations', 'readwrite'), store = tx.objectStore('operations'), request = store.get(secondId);
        request.onsuccess = () => { const row = request.result, bytes = new Uint8Array(row.payload.bytes); bytes[0] ^= 1; row.payload.bytes = bytes.buffer; store.put(row); };
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(new Error('test mutation failed'));
      };
    });
    await flip(); let corrupt = '';
    try { await window.journal.payload(window.scope(), secondId); } catch (error) { corrupt = error.code; }
    await flip();
    const mutate = (storeName, change) => new Promise((resolve, reject) => {
      const open = indexedDB.open(window.proofDbName); open.onerror = () => reject(new Error('open failed'));
      open.onsuccess = () => { const db = open.result, tx = db.transaction(storeName, 'readwrite'); change(tx.objectStore(storeName)); tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(new Error('test mutation failed')); };
    });
    await mutate('keys', (store) => store.put({ ownerId: 'synthetic-owner-a', expiresAt: window.proofClock + 7 * 86400000 }));
    let missingKey = '';
    try { await window.journal.prepare(window.scope(), [{ url: 'https://xhslink.com/key-corruption-must-not-dispatch' }]); } catch (error) { missingKey = error.code; }
    await mutate('keys', (store) => store.put({ ownerId: 'synthetic-owner-a', key, expiresAt: window.proofClock + 7 * 86400000 }));
    const saved = (await window.rows()).find((row) => row.operationId === secondId);
    await mutate('operations', (store) => { const broken = { ...saved }; delete broken.payload; store.put(broken); });
    let missingCipher = '';
    try { await window.journal.payload(window.scope(), secondId); } catch (error) { missingCipher = error.code; }
    await mutate('operations', (store) => store.put(saved));
    await mutate('operations', (store) => store.put({ operationId: crypto.randomUUID(), ownerId: 'synthetic-owner-a', phase: 'bad-expired-row', expiresAt: window.proofClock - 1 }));
    const expiredMalformedPruned = (await window.journal.list(window.scope())).length === 3;
    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function () { this.close(); throw new DOMException('fixture closed', 'InvalidStateError'); };
    let closed = '';
    try { await window.journal.list(window.scope()); } catch (error) { closed = error.code; }
    finally { IDBDatabase.prototype.transaction = originalTransaction; }
    const reopened = (await window.journal.list(window.scope())).length === 3;
    let changed = '';
    const work = window.journal.prepare(window.scope(), [{ url: 'https://xhslink.com/not-authorized-after-change' }]); window.proofValid = false;
    try { await work; } catch (error) { changed = error.code; } window.proofValid = true;
    const initialCount = (await window.rows()).length;
    const original = crypto.randomUUID; crypto.randomUUID = () => '11111111-1111-4111-8111-111111111111';
    let aborted = false;
    try { await window.journal.prepare(window.scope(), [{ url: 'https://xhslink.com/x' }, { url: 'https://xhslink.com/y' }], 'b'.repeat(64)); } catch { aborted = true; }
    crypto.randomUUID = original;
    const rollback = (await window.rows()).length === initialCount && !await window.journal.claimed('b'.repeat(64));
    window.proofClock += 25 * 3600000;
    const expired = await window.journal.payload(window.scope(), secondId);
    const erased = (await window.rows()).find((row) => row.operationId === secondId).payload === null;
    const retryStillUsable = await window.journal.payload(window.scope(), retryId);
    await window.journal.mark(window.scope(), retryId, 'accepted', 'synthetic-job');
    window.proofClock = 1800000000000 + 6 * 86400000;
    const later = await window.journal.prepareRetry(window.scope(), entryId, { jobId: 'synthetic-job', expectedAttempt: 2, expectedVersion: 5 });
    await window.journal.mark(window.scope(), later.records[0].operationId, 'accepted', 'synthetic-job');
    window.proofClock = 1800000000000 + 8 * 86400000;
    await window.journal.list(window.scope());
    const next = await window.journal.prepareRetry(window.scope(), entryId, { jobId: 'synthetic-job', expectedAttempt: 3, expectedVersion: 8 });
    const counts = await new Promise((resolve, reject) => {
      const open = indexedDB.open(window.proofDbName); open.onerror = () => reject(new Error('open failed'));
      open.onsuccess = () => { const db = open.result, tx = db.transaction(['claims', 'keys']), result = {}; for (const name of ['claims', 'keys']) { const request = tx.objectStore(name).count(); request.onsuccess = () => { result[name] = request.result; }; } tx.oncomplete = () => { db.close(); resolve(result); }; };
    });
    return { changed, aborted, rollback, expired, nonExtractable, corrupt, erased, retryStillUsable, afterOriginalExpiry: next.created, counts, missingKey, missingCipher, expiredMalformedPruned, closed, reopened };
  }, [second.operationId, first.operationId, retry[0].records[0].operationId]);
  assert.equal(checks.changed, 'JOURNAL_CONTEXT_CHANGED'); assert.equal(checks.aborted, true); assert.equal(checks.rollback, true); assert.equal(checks.expired, null);
  assert.equal(checks.nonExtractable, true); assert.equal(checks.corrupt, 'JOURNAL_CORRUPT');
  assert.equal(checks.erased, true); assert.equal(checks.afterOriginalExpiry, true); assert.deepEqual(checks.counts, { claims: 0, keys: 0 });
  assert.deepEqual(checks.retryStillUsable, { jobId: 'synthetic-job', expectedAttempt: 1, expectedVersion: 3 });
  assert.equal(checks.missingKey, 'JOURNAL_CORRUPT'); assert.equal(checks.missingCipher, 'JOURNAL_CORRUPT'); assert.equal(checks.expiredMalformedPruned, true);
  assert.equal(checks.closed, 'JOURNAL_UNAVAILABLE'); assert.equal(checks.reopened, true);
  assert.equal(server.exitCode, null); assert.equal(await (await fetch(origin + '/__journal_probe_identity')).text(), nonce);
  assert.equal(createHash('sha256').update(await readFile(resolve(root, source))).digest('hex'), sourceHash, 'Source changed during probe');
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ result: 'passed', actualIndexedDb: true, actualWebCrypto: true,
    browserProcesses: 2, syntheticOwnersAndInputs: true, serverRequests: 0, controllerIntegrationVerified: false, nativeDeviceVerified: false,
    sourceSha256: { [source]: sourceHash },
    checks: ['atomic-cross-tab-input-claim', 'encrypted-payload-only', 'owner-isolation', 'cross-owner-replay-denied', 'accepted-payload-erased', 'one-pending-retry', 'new-process-decryption-and-recovery', 'auth-change-before-commit', 'batch-abort-rolls-back-claim', 'payload-ttl-erasure', 'non-extractable-key-after-restart', 'tampered-ciphertext-rejected', 'replay-excludes-retries', 'retry-tuple-outlives-private-payload-ttl', 'retry-after-original-expiry', 'expired-claims-and-keys-pruned', 'owned-server-and-unchanged-source', 'missing-key-and-cipher-rejected-as-corrupt', 'expired-malformed-row-pruned', 'closed-connection-reopens', 'multi-input-claims-atomic', 'partial-replay-rolls-back-without-reassigning-new-input'] }, null, 2));
  console.log(JSON.stringify({ result: 'journal-browser-probe-passed', output, browserProcesses: 2, serverRequests: 0 }));
} finally { await browser?.close(); server.kill('SIGTERM'); }
