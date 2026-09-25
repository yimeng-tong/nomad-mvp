import { setupServer } from 'msw/node';
import { createHandlers, denyUndeclared, type ScenarioName } from './handlers';
import { NetworkLedger } from './network-policy';

export function createNodeScenario(origin: string, scenario: ScenarioName = 'success') {
  const ledger = new NetworkLedger('node');
  const controller = new AbortController();
  const server = setupServer(...createHandlers(origin, scenario, controller.signal), denyUndeclared(origin, () => ledger, false));
  server.events.on('request:start', ({ request }) => {
    if (request.headers.get('accept')?.includes('msw/passthrough')) {
      ledger.record(request, 'PASSTHROUGH_FORBIDDEN');
      // This hook precedes MSW's bypass check; keep even the rejected request inside the mock server.
      request.headers.set('accept', 'application/json');
    }
  });
  return {
    ledger, controller, server,
    start() { server.listen({ onUnhandledRequest: (request) => ledger.reject(request, 'MSW_UNHANDLED_REQUEST') }); },
    finish() {
      try { ledger.assertClean(); }
      finally { controller.abort(); server.resetHandlers(); server.close(); }
    },
  };
}
