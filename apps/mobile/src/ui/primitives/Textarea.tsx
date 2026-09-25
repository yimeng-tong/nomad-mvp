// Adapted from the reviewed shadcn native textarea; see docs/ui/upstream/story-9-3.
import { useRef, type ComponentProps } from 'react';

export type TextareaProps = ComponentProps<'textarea'>;
export function Textarea({ className = '', onKeyDown, onCompositionStart, onCompositionEnd, ...props }: TextareaProps) {
  const composing = useRef(false);
  return <textarea {...props} data-slot="textarea" className={`nomad-textarea w-full min-w-0 ${className}`}
    onCompositionStart={(event) => { composing.current = true; onCompositionStart?.(event); }}
    onCompositionEnd={(event) => { composing.current = false; onCompositionEnd?.(event); }}
    onKeyDown={(event) => {
      if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)) {
        event.preventDefault(); event.stopPropagation(); return;
      }
      onKeyDown?.(event);
    }} />;
}
