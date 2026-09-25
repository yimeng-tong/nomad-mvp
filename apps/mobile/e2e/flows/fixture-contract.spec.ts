import { randomUUID } from 'node:crypto';
import type { Page } from 'playwright/test';
import type { components } from 'nomad-types/src/api-types';
import { test, expect } from '../fixtures/browser-test';
import { syntheticUser, type Owner } from '../fixtures/api-scenario';

async function call(page: Page, owner: Owner, path: string, body?: unknown) {
  const identity = syntheticUser(owner);
  return page.evaluate(async ({ path, body, identity }) => {
    try {
      const response = await fetch(`/api${path}`, { method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Auth-User-Id': identity.user_id, 'X-Auth-Session-Id': identity.session.id },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() as unknown };
    } catch { return { status: 0, body: null }; }
  }, { path, body, identity });
}

test('B03 HTTP fixtures preserve partial facts, original receipts and owner boundaries', async ({ page, api }) => {
  api.identity = 'A'; api.nextImport = 'partial'; api.dropNextAck = true;
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: '统一输入', exact: true })).toBeVisible();
  const operation = randomUUID();
  const input = { operation_id: operation, url: 'https://xhslink.com/fixture' };
  expect((await call(page, 'A', '/ingest/xhs', input)).status).toBe(0);
  const recovered = await call(page, 'A', `/ingest/commands/${operation}`);
  expect(recovered.status).toBe(200);
  const receipt = recovered.body as components['schemas']['IngestAcceptedResponse'];
  expect(receipt.operation_id).toBe(operation);
  expect(receipt.snapshot.partial).toBe(true);
  expect(receipt.snapshot.state).toBe('failed');
  expect(receipt.snapshot.result?.asset_count).toBe(1);
  const reused = await call(page, 'A', '/ingest/xhs', input);
  expect(reused.status).toBe(202);
  expect((reused.body as components['schemas']['IngestAcceptedResponse']).ingest_id).toBe(receipt.ingest_id);
  expect(api.jobs.size).toBe(1);
  expect((await call(page, 'A', '/ingest/xhs', { ...input, url: 'https://xhslink.com/different' })).status).toBe(409);
  const recovery = await call(page, 'A', `/ingest/${receipt.ingest_id}/recovery?mode=resync`);
  expect(recovery.status).toBe(200);
  expect((recovery.body as components['schemas']['IngestRecoveryResponse']).head_cursor).toBe(receipt.snapshot.head_cursor);
  api.disconnectNextStream = true;
  const disconnected = await page.evaluate(({ jobId, identity }) => new Promise<boolean>((resolve, reject) => {
    const url = new URL(`/api/ingest/${jobId}/events`, location.origin);
    url.searchParams.set('auth_user_id', identity.user_id);
    url.searchParams.set('auth_session_id', identity.session.id);
    const source = new EventSource(url);
    const timer = setTimeout(() => { source.close(); reject(new Error('Disconnect control did not fire')); }, 5000);
    source.onopen = () => { clearTimeout(timer); source.close(); reject(new Error('Expected a real disconnected stream')); };
    source.onerror = () => { clearTimeout(timer); source.close(); resolve(true); };
  }), { jobId: receipt.ingest_id, identity: syntheticUser('A') });
  expect(disconnected).toBe(true);
  expect(api.disconnectNextStream).toBe(false);
  const retry = { operation_id: randomUUID(), expected_attempt: receipt.snapshot.attempt, expected_state_version: receipt.snapshot.state_version };
  expect((await call(page, 'A', `/ingest/${receipt.ingest_id}/retry`, retry)).status).toBe(200);
  expect((await call(page, 'A', `/ingest/${receipt.ingest_id}/retry`, retry)).status).toBe(200);
  expect(api.jobs.get(receipt.ingest_id)?.snapshot.attempt).toBe(2);
  const current = api.jobs.get(receipt.ingest_id)?.snapshot;
  if (!current?.head_cursor) throw new Error('Current synthetic head missing');
  const streamPath = `/api/ingest/${receipt.ingest_id}/events`;
  const stream = page.evaluate(({ path, identity, cursor }) => new Promise<string[]>((resolve, reject) => {
    const url = new URL(path, location.origin);
    url.searchParams.set('auth_user_id', identity.user_id);
    url.searchParams.set('auth_session_id', identity.session.id);
    url.searchParams.set('last_event_id', cursor);
    const events: string[] = [];
    const source = new EventSource(url);
    const timer = setTimeout(() => { source.close(); reject(new Error('Synthetic SSE timeout')); }, 5000);
    source.addEventListener('ingest', (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as { state: string };
      events.push(data.state);
    });
    source.addEventListener('ingest_control', () => { clearTimeout(timer); source.close(); resolve(events); });
    source.onerror = () => { clearTimeout(timer); source.close(); reject(new Error('Synthetic SSE failed')); };
  }), { path: streamPath, identity: syntheticUser('A'), cursor: current.head_cursor });
  await expect.poll(() => api.count('GET', streamPath)).toBe(2);
  api.complete(receipt.ingest_id);
  expect(await stream).toEqual(['done']);
  api.identity = 'B';
  expect((await call(page, 'B', `/ingest/commands/${operation}`)).status).toBe(404);
  expect((await call(page, 'B', `/ingest/${receipt.ingest_id}/result`)).status).toBe(404);
});
