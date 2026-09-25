export type InputLinkPolicy = { appId?: string; httpsOrigins: readonly string[] };
export type PendingInput = { id: string; text: string; ownerId: string | null; expiresAt: number; channel: string | null; clickId: string | null };
const retention = 24 * 3600000;
const allowedParameters = new Set(['v', 'text', 'expires', 'channel', 'click_id']);

function inputEnvelope(raw: string) {
  // Chrome/WebView before130 treats non-special schemes as opaque paths. Parse only our fixed entry lexically.
  const scheme = raw.match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase();
  if (scheme === 'https') return { url: new URL(raw), protocol: 'https:', host: new URL(raw).host, custom: false };
  const match = raw.match(/^([a-z][a-z\d+.-]*):\/\/input\/?(\?[^#]*)?$/i);
  if (!match) return null;
  return { url: new URL(`https://input.invalid/${match[2] ?? ''}`), protocol: `${match[1].toLowerCase()}:`, host: 'input', custom: true };
}

/** Public first-party input v1 contract. U-Link-specific URL decoding is a separate verified adapter. */
export function parseInputLink(raw: string, policy: InputLinkPolicy, now: number) {
  if (!raw || raw.length > 32768 || /[\u0000-\u0020\u007f]/.test(raw)) return null;
  try {
    encodeURI(raw); // Reject lone surrogate input rather than silently changing it.
    const envelope = inputEnvelope(raw); if (!envelope) return null;
    const { url, protocol, host, custom } = envelope;
    if (url.username || url.password || url.hash || url.port && url.protocol !== 'https:') return null;
    if (!custom) {
      if (!policy.httpsOrigins.includes(url.origin) || url.pathname !== '/input') return null;
    } else if (!policy.appId || !/^[a-z][a-z\d_]*(?:\.[a-z][a-z\d_]*)+$/i.test(policy.appId)
      || protocol !== `${policy.appId.toLowerCase()}:`) return null;
    // URLSearchParams otherwise silently substitutes malformed UTF-8 with replacement characters.
    decodeURIComponent(url.search.slice(1).replace(/\+/g, ' '));
    for (const key of url.searchParams.keys()) if (!allowedParameters.has(key) || url.searchParams.getAll(key).length !== 1) return null;
    if (url.searchParams.get('v') !== '1') return null;
    const text = url.searchParams.get('text');
    if (!text?.trim() || text.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
    const expires = url.searchParams.get('expires');
    if (expires !== null && (!/^\d{10}$/.test(expires) || Number(expires) * 1000 <= now)) return null;
    const channel = url.searchParams.get('channel'), clickId = url.searchParams.get('click_id');
    if (channel !== null && !/^[a-zA-Z0-9_-]{1,64}$/.test(channel) || clickId !== null && !/^[a-zA-Z0-9_-]{1,128}$/.test(clickId)) return null;
    return { text, channel, clickId, expiresAt: Math.min(expires === null ? now + retention : Number(expires) * 1000, now + retention),
      basis: JSON.stringify([protocol, host, 'input-v1', text, expires, channel, clickId]) };
  } catch { return null; }
}

export function parseInputOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const items = raw.split(',').map((item) => item.trim());
  if (items.length > 8) return [];
  try {
    if (items.some((item) => { const url = new URL(item); return url.protocol !== 'https:' || url.origin !== item || url.username || url.password || item.includes('*'); })) return [];
    return [...new Set(items)];
  } catch { return []; }
}

/** Bounded unconfirmed context only; it never authenticates, sends ingest, reads clipboard, or emits analytics. */
export function createInputInbox(clock = () => Date.now(), wasConfirmed: (id: string) => Promise<boolean> = async () => false) {
  let state: Readonly<{ pending: PendingInput[]; notice: string | null; recoverySignal: number }> = { pending: [], notice: null, recoverySignal: 0 };
  const listeners = new Set<() => void>(), seen = new Map<string, number>();
  let revision = 0, owner: string | null = null;
  let inFlight = 0;
  const pendingDigests = new Set<string>();
  const set = (pending: PendingInput[], notice = state.notice) => { state = { ...state, pending, notice }; for (const listener of listeners) listener(); };
  const prune = () => { const now = clock(); for (const [id, expiry] of seen) if (expiry <= now) seen.delete(id); return state.pending.filter((item) => item.expiresAt > now); };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async receive(raw: string, policy: InputLinkPolicy, arrivalOwner: string | null) {
      if (!raw || raw.length > 32768) return false;
      // The host URL bus also serves login and other features; those routes do not belong to this inbox.
      try { const route = inputEnvelope(raw); if (!route || !route.custom && route.url.pathname !== '/input') return false; } catch { return false; }
      if (inFlight >= 8) {
        const notice = '收到较多分享内容，请先处理已有输入。';
        if (state.notice !== notice) set(prune(), notice);
        return false;
      }
      const input = parseInputLink(raw, policy, clock()), version = revision;
      if (!input) { set(prune(), '外部链接暂时无法使用，可手动输入。'); return false; }
      const admissionKey = JSON.stringify([version, arrivalOwner, input.basis]);
      if (pendingDigests.has(admissionKey)) return false;
      inFlight++; pendingDigests.add(admissionKey);
      try {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.basis));
        const id = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
        let pending = prune();
        if (input.expiresAt <= clock() || version !== revision && arrivalOwner !== null || seen.has(id)) return false;
        if (seen.size >= 128) { set(pending, '收到较多分享内容，请先处理已有输入。'); return false; }
        const confirmed = await wasConfirmed(id);
        pending = prune();
        if (input.expiresAt <= clock() || version !== revision && arrivalOwner !== null || seen.has(id)) return false;
        if (confirmed) {
          seen.set(id, input.expiresAt); state = { ...state, recoverySignal: state.recoverySignal + 1 };
          set(pending, '这份分享已有确认记录。'); return false;
        }
        if (pending.length >= 8 || seen.size >= 128) { set(pending, '收到较多分享内容，请先处理已有输入。'); return false; }
        seen.set(id, input.expiresAt);
        set([...pending, { id, text: input.text, channel: input.channel, clickId: input.clickId, expiresAt: input.expiresAt, ownerId: arrivalOwner }], null);
        return true;
      } catch { if (version === revision || arrivalOwner === null) set(prune(), '外部链接暂时无法使用，可手动输入。'); return false; }
      finally { inFlight--; pendingDigests.delete(admissionKey); }
    },
    authorityChanged(currentOwner: string | null) {
      if (owner !== currentOwner) { revision++; owner = currentOwner; }
      set(prune().filter((item) => item.ownerId === null || item.ownerId === currentOwner));
    },
    take(id: string, currentOwner: string | null) {
      const pending = prune(), item = pending.find((value) => value.id === id);
      if (!currentOwner || !item || item.ownerId !== null && item.ownerId !== currentOwner) { set(pending); return null; }
      set(pending.filter((value) => value.id !== id), null);
      return { ...item, ownerId: currentOwner };
    },
    dismiss(id: string) { set(prune().filter((item) => item.id !== id), null); },
    clearNotice() { set(prune(), null); },
  };
}
