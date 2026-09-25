import assert from 'node:assert/strict';
import type { BrowserContext } from 'playwright/test';

/** Counterexamples run in an isolated browser context; no product asset or source is rewritten. */
export async function installBrowserFault(context: BrowserContext) {
  const fault = process.env.NOMAD_BROWSER_FAULT ?? '';
  if (!fault) return;
  assert.equal(process.env.NOMAD_BROWSER_RUN_KIND, 'counterexample', 'Faults cannot create or approve baselines');
  if (fault === 'viewport-drift') return; // The fixture changes the actual page viewport, not the declared project configuration.
  assert.ok(['cta-shift', 'private-portal', 'private-input', 'late-result', 'duplicate-start', 'ime-unwired'].includes(fault));
  await context.addInitScript((activeFault) => {
    if (activeFault === 'ime-unwired') document.addEventListener('compositionstart', (event) => event.stopImmediatePropagation(), { capture: true });
    if (activeFault === 'cta-shift') {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '.dock-send { transform: translateY(-64px) !important; }';
        document.head.append(style);
      });
    }
    if (activeFault === 'private-portal' || activeFault === 'private-input') {
      let armed = false;
      const observer = new MutationObserver(() => {
        if (document.querySelector('.home-shell') && document.documentElement.dataset.authChecking === 'false') armed = true;
        if (activeFault === 'private-input' && document.documentElement.dataset.authChecking === 'false') document.querySelector('[data-nomad-e2e-escape]')?.remove();
        if (!armed || !document.body || document.documentElement.dataset.authChecking !== 'true' || document.querySelector('[data-nomad-e2e-escape]')) return;
        const escaped = document.createElement('aside'); escaped.dataset.nomadE2eEscape = 'true';
        if (activeFault === 'private-input') {
          escaped.inert = true; escaped.setAttribute('aria-hidden', 'true');
          const input = document.createElement('textarea'); input.value = 'A的合成可见inert输入'; escaped.append(input);
          escaped.style.cssText = 'position:fixed;top:0;left:0;z-index:99999';
        } else escaped.textContent = 'A的合成旧owner逃逸私有层';
        document.body.append(escaped);
      });
      observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-auth-checking'] });
    }
    const originalFetch = window.fetch.bind(window);
    if (activeFault === 'late-result') window.fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (!/^\/api\/ingest\/[^/]+\/result$/.test(url.pathname)) return originalFetch(input, init);
      // Simulate a late HTTP callback that ignores cancellation and writes outside the auth tree.
      const response = await originalFetch(input, { ...init, signal: undefined });
      const data = await response.clone().json() as { summary?: string };
      const escaped = document.createElement('aside'); escaped.textContent = data.summary ?? '';
      document.body.append(escaped); return response;
    };
    if (activeFault === 'duplicate-start') window.fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.pathname === '/api/ingest/xhs' && init?.method === 'POST' && typeof init.body === 'string') {
        sessionStorage.setItem('NOMAD_E2E_DUPLICATE_REQUEST', JSON.stringify({ body: init.body, headers: [...new Headers(init.headers)] }));
      }
      if (url.pathname.startsWith('/api/ingest/commands/')) {
        const saved = sessionStorage.getItem('NOMAD_E2E_DUPLICATE_REQUEST');
        if (saved) {
          const request = JSON.parse(saved) as { body: string; headers: [string, string][] };
          await originalFetch('/api/ingest/xhs', { method: 'POST', headers: request.headers, body: request.body });
        }
      }
      return originalFetch(input, init);
    };
  }, fault);
}
