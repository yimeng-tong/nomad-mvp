import { useEffect, useRef, type ReactNode } from 'react';

/** One focus boundary for Home's existing disambiguation, candidate and saved-result sheets. */
export function HomeSheet({ label, onClose, children, restoreFocusTo }: { label: string; onClose: () => void; children: ReactNode; restoreFocusTo?: HTMLElement | null }) {
  const ref = useRef<HTMLDivElement>(null), close = useRef(onClose); close.current = onClose;
  // Async callers retain the origin before a busy control or inert region loses focus.
  const returnFocus = useRef(restoreFocusTo !== undefined ? restoreFocusTo : document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    let previous = returnFocus.current;
    const node = ref.current;
    const buttons = () => Array.from(node?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
    (buttons()[0] ?? node)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = buttons(), first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); node?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node?.addEventListener('keydown', key);
    return () => {
      node?.removeEventListener('keydown', key);
      if (previous?.matches(':disabled')) previous = previous.closest('.home-body')?.querySelector<HTMLTextAreaElement>('textarea') ?? null;
      if (previous?.closest('[inert], [hidden]')) previous = null;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div className="home-sheet-backdrop"><div ref={ref} className="bottom-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
    {children}
  </div></div>;
}
