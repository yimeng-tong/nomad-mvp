import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isXhsUrl, parseXhsBatch, parseXhsInput } from './link-parser.js';

await test('batch parsing preserves first occurrence order and retains rejected fragments', () => {
  const parsed = parseXhsBatch('开头 https://xhslink.com/one，https://www.xiaohongshu.com/explore/two。 https://example.invalid/nope 结尾');
  assert.deepEqual(parsed.links.map((item) => item.url), ['https://xhslink.com/one', 'https://www.xiaohongshu.com/explore/two']);
  assert.ok(parsed.unrecognized.some((item) => item.reason === 'unsupported_url'));
  assert.ok(parsed.unrecognized.some((item) => item.text.includes('开头')));
  assert.ok(parsed.links[0].position < parsed.links[1].position);
});
await test('equal normalized links occur once in a batch, without treating duplicates as unknown text', () => {
  const parsed = parseXhsBatch('https://xhslink.com/one#copy https://xhslink.com/one/ https://xhslink.com/two');
  assert.equal(parsed.links.length, 2); assert.equal(parsed.duplicate_count, 1); assert.equal(parsed.unrecognized.length, 0);
  assert.equal(parsed.link_occurrences.length, 3);
  assert.equal(parsed.link_occurrences[0].url, parsed.link_occurrences[1].url);
  assert.ok(parsed.link_occurrences[1].position > parsed.link_occurrences[0].position);
});
await test('supported-host appearance cannot admit credentials, non-http schemes or foreign authorities', () => {
  for (const value of ['file://xhslink.com/one','https://xhslink.com.evil.test/a','https://name:secret@xhslink.com/a','https://xhslink.com:444/a','https://xhslink.com@evil.test/a']) assert.equal(isXhsUrl(value), false, value);
  assert.equal(isXhsUrl('https://xhslink.com/one'), true);
});
await test('single-link route binds the first cleaned original and excludes other share text', () => {
  const raw = 'https://xhslink.com/first/#share';
  const parsed = parseXhsInput({ share_text: `标题 ${raw} 其他 https://xhslink.com/second` });
  assert.equal(parsed.url, 'https://xhslink.com/first');
  assert.equal(parsed.originalUrl, raw);
  assert.deepEqual(parsed.extraUrls, ['https://xhslink.com/second']);
});
