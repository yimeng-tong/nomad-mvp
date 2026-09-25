import type { BrowserContext } from 'playwright/test';

export async function rejectWebSockets(context: BrowserContext, violation: () => void) {
  await context.routeWebSocket('**/*', async (socket) => {
    violation();
    // No connectToServer call: even the handshake stays inside the controlled browser context.
    await socket.close({ code: 1008, reason: 'Undeclared test transport' });
  });
}
