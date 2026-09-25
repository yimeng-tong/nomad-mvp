import { useSyncExternalStore } from 'react';

export type PublicIdentity = { ownerId: string; sessionId: string; nativeGeneration?: number };
export type AuthSnapshot = Readonly<{ epoch: number; activity: number; phase: 'anonymous' | 'authenticated' | 'checking' | 'unavailable'; identity: PublicIdentity | null }>;
let snapshot: AuthSnapshot = { epoch: 0, activity: 0, phase: 'anonymous', identity: null };
const listeners = new Set<() => void>();
const refreshers = new Set<() => void>();
let channel: BroadcastChannel | undefined;
const notificationKey = 'nomad-auth-changed-v1';

export const getAuthSnapshot = () => snapshot;
export function subscribeAuth(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function onAuthorityRefresh(listener: () => void) { refreshers.add(listener); return () => { refreshers.delete(listener); }; }
export const useAuthSnapshot = () => useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);

function set(next: AuthSnapshot) {
  snapshot = Object.freeze({ ...next, identity: next.identity ? Object.freeze({ ...next.identity }) : null });
  if (typeof document !== 'undefined') document.documentElement.dataset.authChecking = String(['checking', 'unavailable'].includes(next.phase));
  for (const listener of [...listeners]) listener();
}
export function commitIdentity(identity: PublicIdentity | null) {
  const old = snapshot.identity;
  const changed = old?.ownerId !== identity?.ownerId || old?.sessionId !== identity?.sessionId || old?.nativeGeneration !== identity?.nativeGeneration;
  set({ identity, epoch: snapshot.epoch + (changed ? 1 : 0), activity: snapshot.activity + (changed ? 1 : 0), phase: identity ? 'authenticated' : 'anonymous' });
}
export function markChecking(refresh = true) {
  set({ ...snapshot, phase: 'checking', activity: snapshot.activity + 1 });
  if (refresh) for (const listener of [...refreshers]) listener();
}
export function markUnavailable() { set({ ...snapshot, phase: 'unavailable', activity: snapshot.activity + 1 }); }
export function announceAuthChange() {
  const message = { version: 1, nonce: crypto.randomUUID() };
  try { channel?.postMessage(message); } catch { /* Foreground/server checks remain authoritative. */ }
  try { localStorage.setItem(notificationKey, JSON.stringify(message)); } catch { /* Storage may be denied. */ }
}
export function installAuthNotifications() {
  // Messages only invalidate local knowledge; no payload is ever accepted as an identity.
  const changed = () => markChecking();
  try { channel = new BroadcastChannel(notificationKey); channel.addEventListener('message', changed); } catch { channel = undefined; }
  const storage = (event: StorageEvent) => { if (event.key === notificationKey) changed(); };
  window.addEventListener('storage', storage);
  return () => { channel?.close(); channel = undefined; window.removeEventListener('storage', storage); };
}
