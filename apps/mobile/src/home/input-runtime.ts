import { getAuthSnapshot, subscribeAuth } from '../auth/session-context';
import { subscribeHostUrl } from '../platform/host';
import { createInputInbox, parseInputOrigins } from './input-inbox';
import { operationJournal } from './operation-journal';

export const inputInbox = createInputInbox(() => Date.now(), (id) => operationJournal.claimed(id));
const httpsOrigins = parseInputOrigins(import.meta.env.VITE_NOMAD_INPUT_LINK_ORIGINS);
let references = 0, stop: (() => void) | undefined;

/** Install before native launch-URL delivery; all business use still requires explicit confirmation. */
export function startInputInbox() {
  if (references++ === 0) {
    const sync = () => inputInbox.authorityChanged(getAuthSnapshot().identity?.ownerId ?? null);
    sync(); const removeAuth = subscribeAuth(sync);
    const removeUrl = subscribeHostUrl((event) => {
      void inputInbox.receive(event.url, { appId: event.appId, httpsOrigins }, getAuthSnapshot().identity?.ownerId ?? null);
    });
    const expiry = setInterval(sync, 60000);
    stop = () => { removeAuth(); removeUrl(); clearInterval(expiry); };
  }
  let released = false;
  return () => { if (released) return; released = true; if (--references === 0) { stop?.(); stop = undefined; } };
}
