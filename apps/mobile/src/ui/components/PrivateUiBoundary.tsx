import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Toast } from '@base-ui/react/toast';
import { getAuthSnapshot, useAuthSnapshot, type AuthSnapshot } from '../../auth/session-context';
import { getHostPlatform } from '../../platform/host';
import { Button } from '../primitives/Button';
import { createModalLayers, sameUiScope } from './modal-policy';

type Notice = { key: string; message: string };
type ToastData = { key: string };
export type PrivateUiContextValue = {
  scope: AuthSnapshot;
  active: boolean;
  container: HTMLElement | null;
  layers: ReturnType<typeof createModalLayers>;
  fallback: () => HTMLElement | null;
  notify: (notice: Notice) => boolean;
};
const PrivateUiContext = createContext<PrivateUiContextValue | null>(null);

function ToastRegion({ container }: { container: HTMLElement }) {
  const { toasts } = Toast.useToastManager<ToastData>();
  return <Toast.Portal container={container}>
    <Toast.Viewport className="nomad-toast-viewport" aria-label="简短通知">
      {toasts.map((toast) => <Toast.Root key={toast.id} toast={toast} className="nomad-toast" swipeDirection={[]}>
        <Toast.Title className="nomad-toast-title">{toast.title}</Toast.Title>
        <Toast.Close aria-label="关闭通知" aria-hidden={false} render={<Button variant="quiet" />}>关闭</Toast.Close>
      </Toast.Root>)}
    </Toast.Viewport>
  </Toast.Portal>;
}

/** Private portals and their DOM are siblings of the page, inside its auth shield. */
export function PrivateUiBoundary({ children }: { children: ReactNode }) {
  const scope = useAuthSnapshot(); const active = scope.phase === 'authenticated';
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [layers] = useState(createModalLayers);
  const stack = useSyncExternalStore(layers.subscribe, layers.getSnapshot);
  const page = useRef<HTMLDivElement>(null), boundary = useRef<HTMLDivElement>(null), alive = useRef(false);
  const channel = useMemo(() => ({ id: `${scope.epoch}:${scope.activity}`, manager: Toast.createToastManager<ToastData>(), seen: new Set<string>() }), [scope.epoch, scope.activity]);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const fallback = useCallback(() => page.current?.querySelector<HTMLElement>('[data-ui-safe-focus]') ?? null, []);
  const notify = useCallback(({ key, message }: Notice) => {
    if (!alive.current || !container?.isConnected || !sameUiScope(scope, getAuthSnapshot()) || layers.getSnapshot().length || channel.seen.has(key) || !key || !message) return false;
    // Short lived, bounded, per-activity deduplication; never persist private copy.
    if (channel.seen.size >= 256) return false;
    channel.seen.add(key);
    channel.manager.add({ id: key, title: message, priority: 'low', timeout: 5000, data: { key } });
    return true;
  }, [container, scope, layers, channel]);
  useEffect(() => {
    const element = boundary.current;
    if (!element || getHostPlatform() !== 'web' || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const update = () => {
      element.style.setProperty('--nomad-viewport-height', `${viewport.height}px`);
      element.style.setProperty('--nomad-viewport-top', `${viewport.offsetTop}px`);
      element.style.setProperty('--nomad-viewport-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
    };
    update(); viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update);
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); };
  }, []);
  const context = useMemo(() => ({ scope, active, container, layers, fallback, notify }), [scope, active, container, layers, fallback, notify]);
  return <PrivateUiContext.Provider value={context}>
    <div ref={boundary} className="nomad-ui-boundary auth-private" hidden={!active}>
      {/* Base UI exempts outside live regions from aria masking. The private page
          also contains Dock announcements, so mask that whole sibling explicitly. */}
      <div ref={page} className="nomad-page" key={scope.epoch} inert={stack.length > 0} aria-hidden={stack.length > 0 || undefined}>{children}</div>
      <div ref={setContainer} className="nomad-portals" data-private-portal-host="true" />
      {active && container?.isConnected && stack.length === 0 ? <Toast.Provider key={channel.id} toastManager={channel.manager} timeout={5000} limit={1}>
        <ToastRegion container={container} />
      </Toast.Provider> : null}
    </div>
  </PrivateUiContext.Provider>;
}

export const usePrivateUi = () => useContext(PrivateUiContext);

const emptyLayers: readonly string[] = [];
const emptySnapshot = () => emptyLayers;
const emptySubscribe = () => () => {};
export function useModalCovered() {
  const ui = usePrivateUi();
  return useSyncExternalStore(ui?.layers.subscribe ?? emptySubscribe, ui?.layers.getSnapshot ?? emptySnapshot).length > 0;
}

/** Capture this callback at the start of an async operation. Old captures expire. */
export function useUiToast() {
  const ui = usePrivateUi(); const alive = useRef(false);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  return useCallback((notice: Notice) => alive.current && (ui?.notify(notice) ?? false), [ui]);
}
