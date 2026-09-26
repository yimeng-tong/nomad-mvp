import assert from 'node:assert/strict';
import test from 'node:test';
import { parseXhsBatch } from './link-parser.js';

await test('batch parsing retains the first cleaned original URL separately from the dedup key', () => {
  const parsed = parseXhsBatch('https://xhslink.com/one#copy https://xhslink.com/one/ https://xhslink.com/two');
  assert.deepEqual(parsed.links.map((link) => ({ url: link.url, original_url: link.original_url })), [
    { url: 'https://xhslink.com/one', original_url: 'https://xhslink.com/one#copy' },
    { url: 'https://xhslink.com/two', original_url: 'https://xhslink.com/two' },
  ]);
  assert.equal(parsed.link_occurrences.length, 3);
});
