import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoginScreen } from './auth/LoginScreen';
import { AuthApiError, createAuthApiClient, logoutCurrentSession, type AuthApiClient, type CurrentUserResponse } from './auth/api';
import { announceAuthChange, commitIdentity, getAuthSnapshot, installAuthNotifications, markChecking, markUnavailable, onAuthorityRefresh, useAuthSnapshot, type PublicIdentity } from './auth/session-context';
import { authenticationMutationPending } from './auth/transport';
import { HomeScreen } from './home/HomeScreen';
import { createHomeApiClient, type PlannerHandoff } from './home/api';
import { ImportDockController } from './home/dock-controller';
import { PlannerScreen } from './planner/PlannerScreen';
import { OperatorAccess } from './ops/OperatorAccess';
import { SettingsScreen } from './settings/SettingsScreen';
import { getHostPlatform, openHostExternalUrl, registerHostBackHandler, subscribeHostResume } from './platform/host';
import { nativeExpected, NomadNativeAuth, usesNativeAuth } from './auth/native';
import './styles.css';

export default function App({ authClient }: { authClient?: AuthApiClient } = {}) {
  const client = useMemo(() => authClient ?? createAuthApiClient(), [authClient]);
  const auth = useAuthSnapshot();
  const dock = useMemo(() => new ImportDockController(createHomeApiClient()), [auth.epoch]);
  useEffect(() => { dock.activate(); return () => dock.deactivate(); }, [dock]);
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [booted, setBooted] = useState(false);
  const [plannerHandoff, setPlannerHandoff] = useState<PlannerHandoff | null>(null);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [authNotice, setAuthNotice] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);
  const pendingLogout = useRef<{ operationId: string; identity: PublicIdentity } | null>(null);
  const logoutFlight = useRef<Promise<void> | null>(null);
  const resumeLogout = useRef<(() => Promise<void>) | null>(null);
  const sequence = useRef(0);
  const probe = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const accept = useCallback((user: CurrentUserResponse | null) => {
    const old = getAuthSnapshot().identity;
    const identity = user ? { ownerId: user.user_id, sessionId: user.session.id, nativeGeneration: user.native_generation } : null;
    if (old?.ownerId !== identity?.ownerId || old?.sessionId !== identity?.sessionId || old?.nativeGeneration !== identity?.nativeGeneration) {
      setPlannerHandoff(null); setView('home');
    }
    commitIdentity(identity); setCurrentUser(user); setBooted(true);
  }, []);
  const recheck = useCallback(async () => {
    if (pendingLogout.current) { await resumeLogout.current?.(); return; }
    const id = ++sequence.current;
    probe.current?.abort();
    const controller = new AbortController(); probe.current = controller;
    markChecking(false);
    try {
      const user = await client.getCurrentUser({ signal: controller.signal });
      if (mounted.current && id === sequence.current && !controller.signal.aborted) accept(user);
    } catch (error) {
      if (!mounted.current || id !== sequence.current || controller.signal.aborted) return;
      if (error instanceof AuthApiError && error.status === 401) accept(null);
      else { markUnavailable(); setBooted(true); }
    }
  }, [client, accept]);

  useEffect(() => {
    mounted.current = true;
    const removeRefresh = onAuthorityRefresh(() => { if (!authenticationMutationPending()) void recheck(); });
    const removeNotifications = installAuthNotifications();
    const foreground = () => { if (!authenticationMutationPending()) void recheck(); };
    const background = () => {
      ++sequence.current; probe.current?.abort(); markChecking(false);
    };
    const visibility = () => { if (document.visibilityState === 'hidden') background(); else foreground(); };
    window.addEventListener('focus', foreground); window.addEventListener('pageshow', foreground);
    window.addEventListener('pagehide', background); document.addEventListener('visibilitychange', visibility);
    const removeResume = subscribeHostResume(foreground);
    void recheck();
    return () => {
      mounted.current = false; ++sequence.current; probe.current?.abort();
      removeRefresh(); removeNotifications(); removeResume();
      window.removeEventListener('focus', foreground); window.removeEventListener('pageshow', foreground);
      window.removeEventListener('pagehide', background); document.removeEventListener('visibilitychange', visibility);
    };
  }, [recheck]);

  useEffect(() => {
    if (!usesNativeAuth()) return;
    let disposed = false; let remove: (() => Promise<void>) | undefined;
    void NomadNativeAuth.addListener('nativeAuthChanged', () => markChecking()).then((handle) => {
      if (disposed) void handle.remove(); else remove = () => handle.remove();
    }).catch(() => { if (!disposed) markUnavailable(); });
    return () => { disposed = true; void remove?.(); };
  }, []);
  useEffect(() => {
    if (!usesNativeAuth() || !booted || !['anonymous','authenticated'].includes(auth.phase)) return;
    void NomadNativeAuth.acknowledgeView({ expected: nativeExpected(auth) }).catch(() => { if (getAuthSnapshot() === auth) markUnavailable(); });
  }, [auth, booted]);

  const logout = (): Promise<void> => {
    if (logoutFlight.current) return logoutFlight.current;
    const work = async () => {
    const identity = getAuthSnapshot().identity;
    if (!pendingLogout.current && !identity) return;
    pendingLogout.current ??= { operationId: crypto.randomUUID(), identity: identity! };
    const operation = pendingLogout.current;
    ++sequence.current; probe.current?.abort(); markChecking(false); setLogoutPending(true);
    try {
      const receipt = await logoutCurrentSession(operation.operationId, operation.identity);
      if (!receipt.ok) throw new Error('LOGOUT_UNCONFIRMED');
      pendingLogout.current = null; announceAuthChange();
      // Another device/tab may have established a new session; only /me decides.
      await recheck();
    } catch (error) {
      if (mounted.current && error && typeof error === 'object' && 'code' in error && error.code === 'AUTH_CONTEXT_CHANGED') {
        try {
          const id = ++sequence.current, activity = getAuthSnapshot().activity;
          probe.current?.abort(); const controller = new AbortController(); probe.current = controller;
          const current = await client.getCurrentUser({ signal: controller.signal });
          if (!mounted.current || id !== sequence.current || activity !== getAuthSnapshot().activity || controller.signal.aborted || pendingLogout.current !== operation) {
            if (mounted.current && getAuthSnapshot().phase === 'checking') markUnavailable();
            return;
          }
          if (current.user_id !== operation.identity.ownerId || current.session.id !== operation.identity.sessionId) {
            pendingLogout.current = null; accept(current); setAuthNotice('当前登录已变化，已停止原会话的退出重试'); return;
          }
        } catch { /* A failed probe cannot confirm either the original logout or a new identity. */ }
      }
      if (mounted.current) markUnavailable();
    }
    finally { if (mounted.current) setLogoutPending(false); }
    };
    logoutFlight.current = work().finally(() => { logoutFlight.current = null; });
    return logoutFlight.current;
  };
  resumeLogout.current = logout;
  useEffect(() => registerHostBackHandler(() => {
    if (auth.phase === 'checking' || auth.phase === 'unavailable' || logoutPending) return true;
    if (view === 'settings') { setView('home'); return true; }
    if (plannerHandoff) { setPlannerHandoff(null); return true; }
    return false;
  }, 0), [auth.phase, logoutPending, view, plannerHandoff]);

  useEffect(() => registerHostBackHandler(() => ['checking','unavailable'].includes(auth.phase) || logoutPending, 1000), [auth.phase, logoutPending]);
  const guarded = !booted || auth.phase === 'checking' || auth.phase === 'unavailable';
  const openExternal = getHostPlatform() === 'web' ? undefined : async (url: string) => (await openHostExternalUrl(url)).opened;
  return <>
    {authNotice && !guarded ? <p className="notice" role="status">{authNotice}</p> : null}
    {guarded ? <main className="login-shell auth-shield" aria-label="登录状态确认">
      <section className="login-stage" role="status">
        <p className="status-text">{auth.phase === 'unavailable' ? pendingLogout.current ? '退出结果尚未确认' : '暂时无法确认登录状态' : logoutPending ? '正在确认退出结果' : '正在恢复登录状态'}</p>
        {auth.phase === 'unavailable' ? <button type="button" disabled={logoutPending} onClick={() => void (pendingLogout.current ? logout() : recheck())}>重试确认</button> : null}
      </section>
    </main> : null}
    {currentUser ? <div className="auth-private" hidden={guarded} key={auth.epoch}>
      {getHostPlatform() === 'web' && window.location.pathname === '/ops' ? <OperatorAccess onLogout={() => { if (window.confirm('退出当前设备的登录？其他设备保持登录。')) void logout(); }} /> : view === 'settings' ? <SettingsScreen currentUser={currentUser} onBack={() => setView('home')} onLogout={() => void logout()} openExternal={openExternal} />
        : plannerHandoff ? <PlannerScreen handoff={plannerHandoff} onBack={() => setPlannerHandoff(null)} />
          : <HomeScreen dockController={dock} onPlannerHandoff={setPlannerHandoff} onOpenSettings={() => setView('settings')} />}
    </div> : booted ? <div className="auth-private" hidden={guarded} key={auth.epoch}>
      <LoginScreen onAuthenticated={(user) => { accept(user); announceAuthChange(); }} />
    </div> : null}
  </>;
}
