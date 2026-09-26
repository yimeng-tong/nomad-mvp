/** Observe an actually rendered, unmasked element. Missing layout stays missing telemetry. */
export function observeVisibleContent(element: HTMLElement, visible: () => void, options: { persistent?: boolean } = {}): () => void {
  if (typeof requestAnimationFrame !== 'function') return () => undefined;
  const persistent = options.persistent === true;
  let cancelled = false, frame = 0, timer: ReturnType<typeof setTimeout> | undefined, remainingFrames = 180;
  const started = performance.now();
  const stop = () => { cancelled = true; cancelAnimationFrame(frame); clearTimeout(timer); };
  const again = () => { if (persistent) timer = setTimeout(inspect, 250); else frame = requestAnimationFrame(inspect); };
  const inspect = () => {
    if (cancelled) return;
    if (!element.isConnected || !Number.isFinite(started) || !persistent && (performance.now() - started >= 2000 || --remainingFrames <= 0)) { stop(); return; }
    if (document.visibilityState === 'hidden') { if (persistent) again(); else stop(); return; }
    let ready = false;
    try {
      const bounds = element.getBoundingClientRect(), viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
      const right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
      const visibleLeft = Math.max(bounds.left, left), visibleRight = Math.min(bounds.right, right);
      const visibleTop = Math.max(bounds.top, top), visibleBottom = Math.min(bounds.bottom, bottom);
      ready = bounds.width > 0 && bounds.height > 0 && visibleRight > visibleLeft && visibleBottom > visibleTop
        && !element.closest('[hidden], [inert], [aria-hidden="true"], [data-starting-style], [data-closing]');
      for (let parent: HTMLElement | null = element; ready && parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), opacity = Number.parseFloat(style.opacity || '1');
        ready = style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' && Number.isFinite(opacity) && opacity >= 0.999;
      }
      if (ready && typeof document.elementFromPoint === 'function') {
        const hit = document.elementFromPoint((visibleLeft + visibleRight) / 2, (visibleTop + visibleBottom) / 2);
        ready = !!hit && (hit === element || element.contains(hit));
      }
    } catch { stop(); return; }
    if (ready) { stop(); try { visible(); } catch { /* Observation does not own UI success. */ } return; }
    again();
  };
  frame = requestAnimationFrame(inspect); return stop;
}
