import type { ReactNode } from 'react';

export type ReadState = 'loading' | 'empty' | 'error' | 'reconnect' | 'partial' | 'stale' | 'unverified';

/** The caller supplies an observed state and honest copy; this never starts work. */
export function AsyncState({ state, message, children, className = '' }: { state: ReadState; message: string; children?: ReactNode; className?: string }) {
  return <div className={`nomad-async-state ${className}`} data-state={state}>
    <p role={state === 'error' ? 'alert' : 'status'}>{message}</p>
    {children}
  </div>;
}
