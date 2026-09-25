import { useEffect, useRef, type ReactNode } from 'react';

/** One focus boundary for Home's existing disambiguation, candidate and saved-result sheets. */
export function HomeSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    return () => { node?.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="home-sheet-backdrop"><div ref={ref} className="bottom-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
    {children}
  </div></div>;
}
