import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { commitIdentity, markChecking } from '../auth/session-context';
import type { Analytics } from '../auth/analytics';
import { inputTelemetry } from '../telemetry/input-events';
import { PrivateUiBoundary } from '../ui';
import { HomeScreen } from './HomeScreen';
import { ImportDockController } from './dock-controller';
import { createJournalFixture } from './journal.test-support';
import type { HomeApiClient, LibraryInspirationItem } from './api';

const item: LibraryInspirationItem = { id: 'private-item', title: 'PRIVATE_RESULT', summary: 'PRIVATE_SUMMARY', locate_status: 'pending',
  city_id: null, city_name: null, poi_id: null, poi_name: null, poi_address: null,
  asset_count: 1, candidate_count: 0, created_at: '2026-09-26T00:00:00Z' };
const cleanups: Array<() => void> = [];
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto); commitIdentity({ ownerId: 'result-owner', sessionId: 'result-session' });
  // DOM geometry is an explicit unit substitute; the actual browser probe owns visibility acceptance.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 100, 40));
});
afterEach(() => { cleanups.splice(0).reverse().forEach((close) => close()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function fixture() {
  const track = vi.fn<Analytics['track']>(); cleanups.push(inputTelemetry.install(() => ({ track })));
  const api: HomeApiClient = {
    getCities: async () => ({ cities: [], unlocated_count: 0 }), getInspirations: async () => ({ items: [] }), getCandidates: async () => ({ candidates: [] }),
    parseInput: async () => ({ type: 'xhs_link', original_text: 'PRIVATE_INPUT', links: [{ url: 'https://xhslink.com/private', position: 0 }] }),
    startIngest: async (request) => ({ operation_id: request.operation_id!, ingest_id: 'saved-job', disposition: 'reused', state: 'done', sse_url: '/ingest/saved-job/events',
      snapshot: { ingest_id: 'saved-job', attempt: 1, state_version: 1, state: 'done', stored_count: 1, source_title: 'PRIVATE_TITLE', partial: false, retriable: false,
        result: { inspiration_id: item.id, locate_status: 'pending', asset_count: 1, city_name: null }, updated_at: '2026-09-26T00:00:00Z', actions: { retry: false, view: true } } }),
    getIngestResult: vi.fn(async () => item),
  };
  const controller = new ImportDockController(api, createJournalFixture()); controller.activate(); cleanups.push(() => controller.deactivate());
  controller.setInput('PRIVATE_INPUT'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  render(<PrivateUiBoundary><HomeScreen apiClient={api} dockController={controller} /></PrivateUiBoundary>);
  return { api, track, opened: () => track.mock.calls.filter(([name]) => name === 'import_record_opened') };
}
it('counts actual visible results once per explicit open, not loading or missing partial metadata', async () => {
  const f = await fixture(); let finish!: (value: LibraryInspirationItem) => void;
  vi.mocked(f.api.getIngestResult!).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  fireEvent.click(await screen.findByRole('button', { name: '查看已保存内容' }));
  await screen.findByText('正在读取已保存内容'); expect(f.opened()).toHaveLength(0);
  await act(async () => finish(item));
  await waitFor(() => expect(f.opened()).toHaveLength(1)); expect(f.opened()[0][1]).toEqual({});
  expect(JSON.stringify(f.opened())).not.toContain('PRIVATE');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: '查看已保存内容' }));
  await waitFor(() => expect(f.opened()).toHaveLength(2));
});
it('does not report a result that arrives after auth uncertainty or closing its request', async () => {
  const f = await fixture(); let finish!: (value: LibraryInspirationItem) => void;
  vi.mocked(f.api.getIngestResult!).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  fireEvent.click(await screen.findByRole('button', { name: '查看已保存内容' })); await screen.findByText('正在读取已保存内容');
  act(() => markChecking(false)); await act(async () => finish(item));
  expect(f.opened()).toHaveLength(0); expect(screen.queryByText('PRIVATE_RESULT')).toBeNull();
});
