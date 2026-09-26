import { afterEach, expect, it, vi } from 'vitest';
import { observeVisibleContent } from './visible-content';

function fixture() {
  const wrapper = document.createElement('div'), node = document.createElement('h2'); wrapper.append(node); document.body.append(wrapper);
  const frames = new Map<number, FrameRequestCallback>(); let sequence = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++sequence, callback); return sequence; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); });
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 10, right: 110, bottom: 30, width: 100, height: 20, x: 10, y: 10, toJSON: () => ({}) });
  return { wrapper, node, frames, step: () => { const batch = [...frames.entries()]; frames.clear(); for (const [, run] of batch) run(performance.now()); } };
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('does not mistake retained hidden, transparent or closing content for an opened view', () => {
  const f = fixture(), publish = vi.fn(); f.wrapper.hidden = true;
  const stop = observeVisibleContent(f.node, publish); f.step(); expect(publish).not.toHaveBeenCalled();
  f.wrapper.hidden = false; f.wrapper.style.opacity = '0'; f.step(); expect(publish).not.toHaveBeenCalled();
  f.wrapper.style.opacity = '1'; f.wrapper.dataset.closing = ''; f.step(); expect(publish).not.toHaveBeenCalled();
  delete f.wrapper.dataset.closing; f.step(); expect(publish).toHaveBeenCalledTimes(1); f.step(); expect(publish).toHaveBeenCalledTimes(1); stop();
});
it('cancels detached or explicitly disposed observations and keeps the wait bounded', () => {
  const f = fixture(), publish = vi.fn(), now = vi.spyOn(performance, 'now').mockReturnValue(100);
  f.wrapper.hidden = true; const stop = observeVisibleContent(f.node, publish); now.mockReturnValue(2201); f.step();
  expect(f.frames.size).toBe(0); expect(publish).not.toHaveBeenCalled(); stop();
  now.mockReturnValue(3000); f.wrapper.hidden = false; const cancel = observeVisibleContent(f.node, publish); cancel(); f.step(); expect(publish).not.toHaveBeenCalled();
  observeVisibleContent(f.node, publish); f.wrapper.remove(); f.step(); expect(publish).not.toHaveBeenCalled(); expect(f.frames.size).toBe(0);
});

it('waits for the visual viewport and an unobstructed hit target', () => {
  const f = fixture(), publish = vi.fn(), hit = vi.fn<() => Element | null>().mockReturnValue(f.wrapper);
  const previous = document.elementFromPoint;
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hit });
  try {
    vi.stubGlobal('visualViewport', { offsetLeft: 0, offsetTop: 100, width: 390, height: 100 });
    observeVisibleContent(f.node, publish); f.step(); expect(publish).not.toHaveBeenCalled();
    vi.stubGlobal('visualViewport', { offsetLeft: 0, offsetTop: 0, width: 390, height: 100 });
    f.step(); expect(publish).not.toHaveBeenCalled();
    hit.mockReturnValue(f.node); f.step(); expect(publish).toHaveBeenCalledTimes(1);
  } finally {
    if (previous) Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: previous });
    else Reflect.deleteProperty(document, 'elementFromPoint');
  }
});

it('keeps an obstructed Dock observation alive beyond the short result deadline', () => {
  const f = fixture(), publish = vi.fn(), now = vi.spyOn(performance, 'now').mockReturnValue(100);
  const timers = new Map<number, () => void>(); let sequence = 0;
  vi.stubGlobal('setTimeout', (callback: () => void) => { timers.set(++sequence, callback); return sequence; });
  vi.stubGlobal('clearTimeout', (id: number) => { timers.delete(id); });
  f.wrapper.hidden = true;
  observeVisibleContent(f.node, publish, { persistent: true }); f.step();
  expect(timers.size).toBe(1); expect(publish).not.toHaveBeenCalled();
  now.mockReturnValue(5000); f.wrapper.hidden = false;
  const next = [...timers.values()][0]; timers.clear(); next();
  expect(publish).toHaveBeenCalledTimes(1); expect(timers.size).toBe(0);
});
