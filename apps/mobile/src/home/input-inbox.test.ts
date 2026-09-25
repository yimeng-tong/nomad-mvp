import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => vi.unstubAllGlobals());
import { createInputInbox, parseInputLink, parseInputOrigins } from './input-inbox';

const now = 1800000000000;
const policy = { appId: 'dev.nomad.mvp', httpsOrigins: ['https://links.example.test'] };
const link = (text: string) => `dev.nomad.mvp://input?v=1&text=${encodeURIComponent(text)}`;
it('accepts only the exact app/source entry and parameter schema; links never carry auth authority', () => {
  expect(parseInputLink(link('厦门 3天'), policy, now)).toMatchObject({ text: '厦门 3天', channel: null, clickId: null });
  expect(parseInputLink('https://links.example.test/input?v=1&text=hello', policy, now)).toMatchObject({ text: 'hello' });
  for (const url of [link('a') + '&session=stolen', link('a') + '&text=b', link('a') + '#token=bad', link('a') + '&v=2',
    'dev.nomad.mvp://login?v=1&text=a', 'evil.nomad://input?v=1&text=a', 'https://links.example.test.evil/input?v=1&text=a',
    'https://user@links.example.test/input?v=1&text=a', link('a') + '&expires=1', link('x'.repeat(2001))]) {
    expect(parseInputLink(url, policy, now)).toBeNull();
  }
  expect(parseInputLink('https://links.example.test/input?v=1&text=a', { ...policy, httpsOrigins: [] }, now)).toBeNull();
  expect(parseInputLink(link('厦'.repeat(2000)), policy, now)?.text).toHaveLength(2000);
  expect(parseInputLink('dev.nomad.mvp://input?v=1&text=%E4%B8', policy, now)).toBeNull();
  expect(parseInputOrigins('https://links.example.test')).toEqual(['https://links.example.test']);
  for (const invalid of ['https://*.example.test', 'http://links.example.test', 'https://links.example.test/input', 'https://user@links.example.test']) expect(parseInputOrigins(invalid)).toEqual([]);
});
it('holds cold/early input until consumed and coalesces duplicate deliveries without starting work', async () => {
  const inbox = createInputInbox(() => now);
  expect(await inbox.receive(link('private'), policy, 'owner-a')).toBe(true);
  expect(await inbox.receive(link('private'), policy, 'owner-a')).toBe(false);
  expect(inbox.getSnapshot().pending).toHaveLength(1);
  const item = inbox.getSnapshot().pending[0];
  expect(inbox.take(item.id, 'owner-b')).toBeNull();
  expect(inbox.take(item.id, 'owner-a')?.text).toBe('private');
  expect(inbox.take(item.id, 'owner-a')).toBeNull();
});
it('retains anonymous context for explicit owner confirmation but discards old-owner input on identity change', async () => {
  const inbox = createInputInbox(() => now);
  await inbox.receive(link('anonymous'), policy, null);
  const anonymous = inbox.getSnapshot().pending[0];
  expect(inbox.take(anonymous.id, null)).toBeNull();
  expect(inbox.take(anonymous.id, 'owner-a')?.text).toBe('anonymous');
  await inbox.receive(link('owned'), policy, 'owner-a'); inbox.authorityChanged('owner-b');
  expect(inbox.getSnapshot().pending).toHaveLength(0);
  expect(await inbox.receive(link('owned'), policy, 'owner-b')).toBe(false);
});
it('bounds pending input and expires it without exposing old content', async () => {
  let clock = now; const inbox = createInputInbox(() => clock);
  for (let i = 0; i < 12; i++) await inbox.receive(link(`input-${i}`), policy, 'owner-a');
  expect(inbox.getSnapshot().pending.length).toBeLessThanOrEqual(8);
  clock += 25 * 3600000; inbox.authorityChanged('owner-a');
  expect(inbox.getSnapshot().pending).toHaveLength(0);
});
it('fences an asynchronous URL admission when the originating owner changes', async () => {
  const inbox = createInputInbox(() => now); inbox.authorityChanged('owner-a');
  const receiving = inbox.receive(link('private-a'), policy, 'owner-a');
  inbox.authorityChanged('owner-b');
  expect(await receiving).toBe(false); expect(inbox.getSnapshot().pending).toHaveLength(0);
});
it('does not revive a pre-logout arrival when the same owner returns before its digest completes', async () => {
  const inbox = createInputInbox(() => now); inbox.authorityChanged('owner-a');
  const receiving = inbox.receive(link('old-a'), policy, 'owner-a');
  inbox.authorityChanged(null); inbox.authorityChanged('owner-a');
  expect(await receiving).toBe(false); expect(inbox.getSnapshot().pending).toHaveLength(0);
});
it('does not let an invalidated admission suppress a fresh arrival under the new owner', async () => {
  const inbox = createInputInbox(() => now); inbox.authorityChanged('owner-a');
  const first = inbox.receive(link('new-arrival'), policy, 'owner-a');
  inbox.authorityChanged('owner-b');
  const second = inbox.receive(link('new-arrival'), policy, 'owner-b');
  expect(await first).toBe(false); expect(await second).toBe(true);
  expect(inbox.getSnapshot().pending[0].ownerId).toBe('owner-b');
});
it('ignores other app routes instead of creating a persistent sharing error', async () => {
  const inbox = createInputInbox(() => now);
  expect(await inbox.receive('dev.nomad.mvp://login?code=untrusted', policy, null)).toBe(false);
  expect(inbox.getSnapshot().notice).toBeNull();
  expect(await inbox.receive(link('input') + '&token=bad', policy, null)).toBe(false);
  expect(inbox.getSnapshot().notice).not.toBeNull();
});
it('bounds admissions before asynchronous work and releases every reserved slot', async () => {
  const waiting: Array<(value: ArrayBuffer) => void> = [];
  const digest = vi.fn(() => new Promise<ArrayBuffer>((resolve) => waiting.push(resolve)));
  vi.stubGlobal('crypto', { subtle: { digest } });
  const inbox = createInputInbox(() => now);
  const events = Array.from({ length: 1000 }, (_, i) => inbox.receive(link(`event-${i}`), policy, null));
  expect(digest.mock.calls.length).toBeLessThanOrEqual(8);
  waiting.splice(0).forEach((resolve, index) => resolve(new Uint8Array([index]).buffer)); await Promise.all(events);
  for (const item of inbox.getSnapshot().pending) inbox.dismiss(item.id);
  const next = inbox.receive(link('after-clear'), policy, null); waiting[0](new Uint8Array([99]).buffer);
  expect(await next).toBe(true);
});
it('restores a persisted confirmation signal without offering the same input again after a new inbox starts', async () => {
  const confirmed = vi.fn(async () => true);
  const first = createInputInbox(() => now, confirmed);
  expect(await first.receive(link('confirmed'), policy, 'owner-a')).toBe(false);
  expect(first.getSnapshot().pending).toHaveLength(0); expect(first.getSnapshot().recoverySignal).toBe(1);
  expect(await first.receive(link('confirmed'), policy, 'owner-a')).toBe(false);
  expect(first.getSnapshot().recoverySignal).toBe(1);
  const restarted = createInputInbox(() => now, confirmed);
  expect(await restarted.receive(link('confirmed'), policy, 'owner-b')).toBe(false);
  expect(restarted.getSnapshot().pending).toHaveLength(0);
});
