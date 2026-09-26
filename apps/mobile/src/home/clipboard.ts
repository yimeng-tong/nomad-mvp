import { Clipboard } from '@capacitor/clipboard';
import { getHostPlatform } from '../platform/host';

export type ClipboardResult = { kind: 'text'; value: string } | { kind: 'unavailable' | 'empty' | 'non-text' | 'too-long' };

/** Call directly from a user paste action. No startup, resume, or URL listener invokes this. */
export async function readClipboardText(): Promise<ClipboardResult> {
  try {
    let text: unknown;
    if (getHostPlatform() === 'web') {
      if (!navigator.clipboard?.readText || navigator.userActivation?.isActive === false) return { kind: 'unavailable' };
      text = await navigator.clipboard.readText();
    } else {
      const result = await Clipboard.read();
      if (result.type !== 'text/plain') return { kind: 'non-text' };
      text = result.value;
    }
    if (typeof text !== 'string') return { kind: 'non-text' };
    if (!text.trim()) return { kind: 'empty' };
    if (text.length > 2000) return { kind: 'too-long' };
    return { kind: 'text', value: text };
  } catch { return { kind: 'unavailable' }; }
}

/** Write only after an explicit owner-detail copy action; never fall back across platforms. */
export async function writeClipboardText(value: string): Promise<boolean> {
  if (!value || new TextEncoder().encode(value).length > 4096) return false;
  try {
    if (getHostPlatform() === 'web') {
      if (!navigator.clipboard?.writeText) return false;
      await navigator.clipboard.writeText(value);
    } else await Clipboard.write({ string: value });
    return true;
  } catch { return false; }
}
