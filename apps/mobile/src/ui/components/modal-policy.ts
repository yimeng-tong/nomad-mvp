import type { AuthSnapshot } from '../../auth/session-context';

export type CloseReason = 'escape' | 'outside' | 'button' | 'host-back' | 'programmatic';
export type CloseRequest = { reason: CloseReason; signal: AbortSignal };

export function sameUiScope(captured: AuthSnapshot, current: AuthSnapshot): boolean {
  return captured.phase === 'authenticated' && current.phase === 'authenticated'
    && captured.epoch === current.epoch && captured.activity === current.activity
    && captured.identity !== null && current.identity !== null
    && captured.identity.ownerId === current.identity.ownerId
    && captured.identity.sessionId === current.identity.sessionId
    && captured.identity.nativeGeneration === current.identity.nativeGeneration;
}

/** Only a decision crosses this gate. It never saves, retries or owns business state. */
export function createCloseGate(options: {
  isCurrent: () => boolean;
  canClose: (request: CloseRequest) => boolean | Promise<boolean>;
  close: () => void;
  onError: () => void;
}) {
  let pending: Promise<boolean> | null = null;
  let controller: AbortController | null = null;
  return {
    cancel() { controller?.abort(); },
    request(reason: CloseReason, externalSignal?: AbortSignal): Promise<boolean> {
      if (pending) return pending;
      if (!options.isCurrent() || externalSignal?.aborted) return Promise.resolve(false);
      const operation = new AbortController(); controller = operation;
      const abort = () => operation.abort();
      externalSignal?.addEventListener('abort', abort, { once: true });
      // Delay decision until `pending` is assigned, so synchronous reentry also merges.
      pending = Promise.resolve().then(async () => {
        if (operation.signal.aborted || !options.isCurrent()) return false;
        try {
          const allowed = await options.canClose({ reason, signal: operation.signal });
          if (!allowed || operation.signal.aborted || !options.isCurrent()) return false;
          options.close(); return true;
        } catch {
          if (!operation.signal.aborted && options.isCurrent()) options.onError();
          return false;
        }
      }).finally(() => {
        externalSignal?.removeEventListener('abort', abort);
        pending = null;
        if (controller === operation) controller = null;
      });
      return pending;
    },
  };
}

/** Stable snapshots include closing layers until their actual popup unmounts. */
export function createModalLayers() {
  let layers: readonly string[] = [];
  const listeners = new Set<() => void>();
  const emit = () => { for (const listener of listeners) listener(); };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => layers,
    isTop: (id: string) => layers.at(-1) === id,
    has: (id: string) => layers.includes(id),
    add(id: string) {
      if (!layers.includes(id)) { layers = [...layers, id]; emit(); }
      return () => { if (layers.includes(id)) { layers = layers.filter((item) => item !== id); emit(); } };
    },
  };
}
