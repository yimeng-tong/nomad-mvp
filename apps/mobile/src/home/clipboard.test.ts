import { afterEach, expect, it, vi } from 'vitest';
import { readClipboardText } from './clipboard';
const native = vi.hoisted(() => ({ read: vi.fn(), platform: 'web' }));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: { read: native.read } }));
vi.mock('../platform/host', () => ({ getHostPlatform: () => native.platform }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); native.platform = 'web'; });

it('reads Web text only when explicitly invoked, never falls back to native reads after rejection', async () => {
  const readText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
  vi.stubGlobal('navigator', { clipboard: { readText }, userActivation: { isActive: true } });
  expect(readText).not.toHaveBeenCalled();
  expect(await readClipboardText()).toEqual({ kind: 'unavailable' });
  expect(readText).toHaveBeenCalledTimes(1); expect(native.read).not.toHaveBeenCalled();
});
it('requires active user interaction when the browser exposes its activation state', async () => {
  const readText = vi.fn(); vi.stubGlobal('navigator', { clipboard: { readText }, userActivation: { isActive: false } });
  expect(await readClipboardText()).toEqual({ kind: 'unavailable' }); expect(readText).not.toHaveBeenCalled();
});
it('keeps manual input available for missing capability, non-text native data, empty and oversized content', async () => {
  vi.stubGlobal('navigator', {}); expect(await readClipboardText()).toEqual({ kind: 'unavailable' });
  native.platform = 'ios'; native.read.mockResolvedValue({ type: 'image/png', value: 'private-binary' });
  expect(await readClipboardText()).toEqual({ kind: 'non-text' });
  native.read.mockResolvedValue({ type: 'text/plain', value: ' ' }); expect(await readClipboardText()).toEqual({ kind: 'empty' });
  native.read.mockResolvedValue({ type: 'text/plain', value: 'x'.repeat(2001) }); expect(await readClipboardText()).toEqual({ kind: 'too-long' });
});
it('accepts only bounded actual text and performs one platform read per click', async () => {
  native.platform = 'android'; native.read.mockResolvedValue({ type: 'text/plain', value: '厦门 3天' });
  expect(await readClipboardText()).toEqual({ kind: 'text', value: '厦门 3天' }); expect(native.read).toHaveBeenCalledTimes(1);
});
