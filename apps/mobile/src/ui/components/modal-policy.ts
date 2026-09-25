import type { AuthSnapshot } from '../../auth/session-context';

export type CloseReason = 'escape' | 'outside' | 'button' | 'host-back' | 'programmatic';
export type CloseRequest = { reason: CloseReason; signal: AbortSignal };

export function sameUiIdentity(captured: AuthSnapshot, current: AuthSnapshot): boolean {
  return captured.phase === 'authenticated' && current.phase === 'authenticated'
    && captured.epoch === current.epoch
    && captured.identity !== null && current.identity !== null
    && captured.identity.ownerId === current.identity.ownerId
    && captured.identity.sessionId === current.identity.sessionId
    && captured.identity.nativeGeneration === current.identity.nativeGeneration;
}

export function sameUiScope(captured: AuthSnapshot, current: AuthSnapshot): boolean {
  return sameUiIdentity(captured, current) && captured.activity === current.activity;
}

/** Only a decision crosses this gate. It never saves, retries or owns business state. */
export function createCloseGate(options: {
  isCurrent: () => boolean;
  canClose: (request: CloseRequest) => boolean | Promise<boolean>;
  close: () => void;
  onError: () => void;
}) {
  type Pending = { result: Promise<boolean>; cancel: () => void };
  let pending: Pending | null = null;
  return {
    cancel() { pending?.cancel(); },
    request(reason: CloseReason, externalSignal?: AbortSignal): Promise<boolean> {
      if (pending) return pending.result;
      if (!options.isCurrent() || externalSignal?.aborted) return Promise.resolve(false);
      const controller = new AbortController();
      let releaseAbort!: (result: false) => void;
      const aborted = new Promise<false>((resolve) => { releaseAbort = resolve; });
      let operation: Pending;
      const current = () => pending === operation && !controller.signal.aborted && options.isCurrent();
      const cancel = () => {
        controller.abort(); releaseAbort(false);
        if (pending === operation) pending = null;
      };
      // Reentry merges, but cancellation settles immediately even when a supplied
      // decision ignores its signal. An old finally cannot clear its replacement.
      const decision = Promise.resolve().then(async () => {
        if (!current()) return false;
        try {
          const allowed = await options.canClose({ reason, signal: controller.signal });
          if (!allowed || !current()) return false;
          options.close(); return true;
        } catch {
          if (current()) options.onError();
          return false;
        }
      });
      const result = Promise.race([decision, aborted]).finally(() => {
        externalSignal?.removeEventListener('abort', cancel);
        if (pending === operation) pending = null;
      });
      operation = { result, cancel }; pending = operation;
      externalSignal?.addEventListener('abort', cancel, { once: true });
      if (externalSignal?.aborted) cancel();
      return result;
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
