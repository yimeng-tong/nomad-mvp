// Dialog/Sheet composition adapted from reviewed shadcn Base UI sources.
import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { getAuthSnapshot } from '../../auth/session-context';
import { registerHostBackHandler } from '../../platform/host';
import { Button, type ButtonProps } from '../primitives/Button';
import { createCloseGate, sameUiScope, type CloseRequest, type CloseReason } from './modal-policy';
import { usePrivateUi, type PrivateUiContextValue } from './PrivateUiBoundary';

export type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: false) => void;
  onCloseComplete?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  canClose?: (request: CloseRequest) => boolean | Promise<boolean>;
  restoreFocusTo?: HTMLElement | null;
  initialFocus?: () => HTMLElement | null;
  className?: string;
};
const Depth = createContext(0);

function eligible(element: HTMLElement | null): boolean {
  return !!element?.isConnected && !element.matches(':disabled, [aria-disabled="true"]')
    && element.matches('button, a[href], input, textarea, select, [tabindex]')
    && !element.closest('[hidden], [inert], [aria-hidden="true"]')
    && getComputedStyle(element).visibility !== 'hidden' && element.getClientRects().length > 0;
}

function closeReason(reason: Dialog.Root.ChangeEventReason): CloseReason {
  if (reason === 'escape-key') return 'escape';
  if (reason === 'outside-press' || reason === 'focus-out') return 'outside';
  if (reason === 'close-press') return 'button';
  return 'programmatic';
}

function ModalSession({ ui, depth, kind, completed, ...props }: AppDialogProps & { ui: PrivateUiContextValue; depth: number; kind: 'dialog' | 'sheet'; completed: () => void }) {
  const id = useId(); const popup = useRef<HTMLDivElement>(null), backdrop = useRef<HTMLDivElement>(null), title = useRef<HTMLHeadingElement>(null);
  const alive = useRef(false); const latest = useRef(props); latest.current = props;
  const [closeError, setCloseError] = useState('');
  const { container, layers, fallback, scope } = ui;
  const stack = useSyncExternalStore(layers.subscribe, layers.getSnapshot);
  const registered = stack.includes(id);
  const initialTrigger = useRef(props.restoreFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  const gate = useMemo(() => createCloseGate({
    isCurrent: () => alive.current && latest.current.open && sameUiScope(scope, getAuthSnapshot()) && container?.isConnected === true && layers.isTop(id),
    canClose: (request) => latest.current.canClose?.(request) ?? true,
    close: () => latest.current.onOpenChange(false),
    onError: () => setCloseError('暂时无法关闭，请稍后重试'),
  }), [id, scope, container, layers]);

  useLayoutEffect(() => {
    alive.current = true;
    const release = layers.add(id);
    const trigger = initialTrigger.current;
    return () => {
      alive.current = false; gate.cancel(); release();
      // Base UI finalFocus=false prevents its unchecked deferred trigger fallback.
      // Recheck authority after all focus/inert cleanup, including StrictMode replay.
      queueMicrotask(() => {
        if (layers.has(id) || !sameUiScope(scope, getAuthSnapshot())) return;
        let target = trigger;
        if (!eligible(target)) target = target?.closest('.home-body')?.querySelector<HTMLTextAreaElement>('textarea:not(:disabled)') ?? null;
        if (!eligible(target)) target = fallback();
        if (target && eligible(target)) target.focus({ preventScroll: true });
      });
    };
  }, [gate, id, scope, container, layers, fallback]);

  useEffect(() => registerHostBackHandler(async (signal) => {
    if (!alive.current || !layers.isTop(id)) return false;
    await gate.request('host-back', signal);
    return true; // Denial/closing still consumes this layer; never fall into page back.
  }, 100 + depth), [depth, gate, id, layers]);

  useLayoutEffect(() => {
    if (props.open || !registered) return;
    let disposed = false;
    // Keep the one Base UI modal open during the visible exit. Its 1.8 scroll
    // lock otherwise releases as soon as `open=false`, before the popup disappears.
    const animations = [popup.current, backdrop.current].flatMap((node) => node?.getAnimations?.() ?? []);
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!disposed && alive.current && !latest.current.open && sameUiScope(scope, getAuthSnapshot())) completed();
    }).catch(() => { /* allSettled only rejects on a programmer/runtime failure; unmount releases the modal. */ });
    return () => { disposed = true; };
  }, [props.open, registered, completed, scope]);

  if (!registered) return null;
  return <Dialog.Root open modal onOpenChange={(_nextOpen, details) => {
    details.cancel();
    gate.request(closeReason(details.reason)).catch(() => { /* gate handles decision failures */ });
  }}>
    <Depth.Provider value={depth + 1}>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop ref={backdrop} className="nomad-modal-backdrop" data-closing={!props.open || undefined} style={{ zIndex: 100 + depth * 10 }} />
        <Dialog.Popup ref={popup} className={`nomad-modal ${props.className ?? ''}`} data-kind={kind} data-closing={!props.open || undefined}
          style={{ zIndex: 101 + depth * 10 }} inert={!props.open} aria-hidden={!props.open || undefined}
          initialFocus={() => latest.current.initialFocus?.() ?? title.current} finalFocus={false}>
          <Dialog.Title ref={title} tabIndex={-1} className="nomad-modal-title">{props.title}</Dialog.Title>
          {props.description ? <Dialog.Description className="nomad-modal-description">{props.description}</Dialog.Description> : null}
          {props.children}
          {closeError ? <p role="status" className="nomad-field-error">{closeError}</p> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Depth.Provider>
  </Dialog.Root>;
}

function Modal({ kind, ...props }: AppDialogProps & { kind: 'dialog' | 'sheet' }) {
  const ui = usePrivateUi(); const depth = useContext(Depth);
  const active = !!ui?.active && !!ui.container?.isConnected;
  const [presence, setPresence] = useState<number | null>(active && props.open ? ui.scope.activity : null);
  useLayoutEffect(() => { if (active && props.open) setPresence(ui.scope.activity); }, [active, props.open, ui?.scope.activity]);
  const completed = () => { setPresence(null); props.onCloseComplete?.(); };
  // No public/body fallback; unknown authority removes the entire interaction lifecycle.
  if (!ui || !active || depth > 1 || (!props.open && presence !== ui.scope.activity)) return null;
  return <ModalSession key={`${ui.scope.epoch}:${ui.scope.activity}`} {...props} ui={ui} depth={depth} kind={kind} completed={completed} />;
}

export function AppDialog(props: AppDialogProps) { return <Modal {...props} kind="dialog" />; }
export function AppSheet(props: AppDialogProps) { return <Modal {...props} kind="sheet" />; }
export function ModalClose(props: ButtonProps) { return <Dialog.Close render={<Button {...props} />} />; }
