// Adapted from the reviewed shadcn Base UI source; see docs/ui/upstream/story-9-3.
import { useId, type ComponentProps } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

export type ButtonProps = Omit<ComponentProps<typeof BaseButton>, 'className'> & {
  className?: string;
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive';
  loading?: boolean;
  disabledReason?: string;
};

export function Button({ className = '', variant = 'secondary', type = 'button', loading = false, disabled, disabledReason, 'aria-describedby': describedBy, ...props }: ButtonProps) {
  const reasonId = useId();
  const reason = (disabled || loading) && disabledReason;
  return <>
    <BaseButton {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      aria-describedby={[describedBy, reason ? reasonId : null].filter(Boolean).join(' ') || undefined}
      data-slot="button" data-variant={variant} className={`nomad-button inline-flex items-center justify-center gap-2 ${className}`} />
    {reason ? <span id={reasonId} className="nomad-control-note">{reason}</span> : null}
  </>;
}
