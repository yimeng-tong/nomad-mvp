import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFirstSseData } from './sse-probe-reader.js';

function reader(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }).getReader();
}
await test('reads the first actual data frame after a comment across arbitrary byte and CRLF boundaries', async () => {
  const bytes = new TextEncoder().encode(': connected\r\n\r\nevent: test\r\ndata: {"owner":"合成"}\r\n\r\n');
  const result = await readFirstSseData(reader(Array.from(bytes, (byte) => Uint8Array.of(byte))));
  assert.deepEqual(JSON.parse(result.data), { owner: '合成' });
});
await test('returns the first data frame, preserving a coalesced next frame rather than searching for a desired owner', async () => {
  const result = await readFirstSseData(reader([new TextEncoder().encode('data: {"owner":"first"}\n\ndata: {"owner":"next"}\n\n')]));
  assert.equal(result.data, '{"owner":"first"}');
  assert.equal(result.remainder, 'data: {"owner":"next"}\n\n');
});
await test('closed and over-budget streams cannot pass without an actual data frame', async () => {
  await assert.rejects(readFirstSseData(reader([])), /PROBE_SSE_CLOSED_BEFORE_DATA/);
  await assert.rejects(readFirstSseData(reader([new Uint8Array(9)]), 8), /PROBE_SSE_FRAME_TOO_LARGE/);
});
