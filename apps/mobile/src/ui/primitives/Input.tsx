// Adapted from the reviewed shadcn Base UI source; see docs/ui/upstream/story-9-3.
import { useRef, type ComponentProps } from 'react';
import { Input as BaseInput } from '@base-ui/react/input';

export type InputProps = Omit<ComponentProps<typeof BaseInput>, 'className'> & { className?: string };

export function Input({ className = '', onKeyDown, onCompositionStart, onCompositionEnd, ...props }: InputProps) {
  const composing = useRef(false);
  return <BaseInput {...props} data-slot="input" className={`nomad-input w-full min-w-0 ${className}`}
    onCompositionStart={(event) => { composing.current = true; onCompositionStart?.(event); }}
    onCompositionEnd={(event) => { composing.current = false; onCompositionEnd?.(event); }}
    onKeyDown={(event) => {
      if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)) {
        event.preventDefault(); event.stopPropagation(); return;
      }
      onKeyDown?.(event);
    }} />;
}
