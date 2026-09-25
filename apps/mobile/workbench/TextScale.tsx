import { useEffect, useRef, type ReactNode } from 'react';

/** Scale actual computed text, including fixed-pixel product fields; not an inherited wrapper size. */
export function TextScale({ children, enabled = false }: { children: ReactNode; enabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!enabled || !node) return;
    const original = new Map<HTMLElement, { value: string; priority: string }>();
    const scale = () => {
      const elements = Array.from(node.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,label,input,textarea,button,a,li'));
      for (const element of elements) {
        if (!original.has(element)) original.set(element, { value: element.style.getPropertyValue('font-size'), priority: element.style.getPropertyPriority('font-size') });
      }
      for (const [element, style] of original) element.style.setProperty('font-size', style.value, style.priority);
      const sizes = elements.map((element) => [element, parseFloat(getComputedStyle(element).fontSize)] as const);
      for (const [element, size] of sizes) {
        element.dataset.workbenchFontBase = String(size);
        element.style.setProperty('font-size', `${size * 2}px`, 'important');
      }
    };
    scale();
    const observer = new MutationObserver(scale);
    observer.observe(node, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      for (const [element, style] of original) {
        element.style.setProperty('font-size', style.value, style.priority);
        delete element.dataset.workbenchFontBase;
      }
    };
  }, [enabled]);
  return <div ref={root} data-workbench-text-scale={enabled ? '200' : '100'}>{children}</div>;
}
