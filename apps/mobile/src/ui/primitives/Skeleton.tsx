// Adapted from the reviewed shadcn skeleton; announced state belongs to AsyncState.
import type { ComponentProps } from 'react';

export function Skeleton({ className = '', ...props }: Omit<ComponentProps<'div'>, 'aria-hidden'>) {
  return <div {...props} aria-hidden="true" data-slot="skeleton" className={`nomad-skeleton ${className}`} />;
}
