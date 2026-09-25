import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeIngestCursor, parseIngestCursor, selectIngestCursor, resolveIngestCursor, MAX_INGEST_SEQ } from './cursor.js';
const stream = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const code = (expected: string) => (error: unknown) => !!error && typeof error === 'object' && 'code' in error && error.code === expected;
test('round trips zero and sequences beyond Number precision inside the native cursor limit', () => {
  for (const seq of [0n, 1n, 9007199254740993n, MAX_INGEST_SEQ]) {
    const cursor = encodeIngestCursor(stream, seq); assert.ok(cursor.length <= 128); assert.match(cursor, /^[A-Za-z0-9:_-]+$/);
    assert.deepEqual(parseIngestCursor(cursor), { streamId: stream, seq });
  }
});
test('malformed and ambiguous input is rejected without coercion or returning its contents', () => {
  for (const value of ['', '0', `i1:${stream}:01`, `i1:${stream}:-1`, `i1:${stream}:1.5`, `i1:${stream}:1e3`, `i1:${stream}:9223372036854775808`, `i1:${stream}:1\n`, 'private'.repeat(100), ['x'], 1, null, { toString() { throw Error('private'); } }]) {
    assert.throws(() => parseIngestCursor(value), code('INGEST_CURSOR_INVALID'));
  }
});
test('header and query may agree but duplicate/empty/conflicting values never silently win', () => {
  const cursor = encodeIngestCursor(stream, 2n);
  assert.equal(selectIngestCursor(undefined, undefined), undefined);
  assert.equal(selectIngestCursor(cursor, undefined), cursor); assert.equal(selectIngestCursor(undefined, cursor), cursor);
  assert.equal(selectIngestCursor(cursor, cursor), cursor);
  for (const [header, query] of [[cursor, encodeIngestCursor(stream, 3n)], [cursor, ['x', 'y']], ['', cursor], [null, undefined]])
    assert.throws(() => selectIngestCursor(header, query), code('INGEST_CURSOR_INVALID'));
});
test('only same-stream in-range cursors replay; retention uses authoritative head resync', () => {
  const meta = { streamId: stream, head: 10n, floor: 5n };
  assert.deepEqual(resolveIngestCursor(encodeIngestCursor(stream, 5n), meta), { mode: 'replay', after: 5n, cursor: encodeIngestCursor(stream, 5n) });
  assert.deepEqual(resolveIngestCursor(undefined, meta), { mode: 'resync', reason: 'retention', after: 10n, cursor: encodeIngestCursor(stream, 10n) });
  assert.equal(resolveIngestCursor(encodeIngestCursor(stream, 10n), meta).mode, 'replay');
  assert.throws(() => resolveIngestCursor(encodeIngestCursor(other, 1n), meta), code('INGEST_CURSOR_JOB_MISMATCH'));
  assert.throws(() => resolveIngestCursor(encodeIngestCursor(stream, 11n), meta), code('INGEST_CURSOR_AHEAD'));
});
test('corrupt server metadata is unavailable instead of blaming the user or inventing a cursor', () => {
  assert.throws(() => resolveIngestCursor(undefined, { streamId: stream, head: 1n, floor: 2n }), code('INGEST_EVENT_STATE_UNAVAILABLE'));
  assert.throws(() => encodeIngestCursor(stream, -1n), code('INGEST_EVENT_STATE_UNAVAILABLE'));
});
