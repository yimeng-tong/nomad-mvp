import { afterEach, expect, it, vi } from 'vitest';
import { ImportDockController } from './dock-controller';
import { commitIdentity } from '../auth/session-context';
import type { HomeApiClient, IngestAcceptedResponse } from './api';
import { createJournalFixture } from './journal.test-support';

const controllers: ImportDockController[] = [];
afterEach(() => { for (const controller of controllers.splice(0)) controller.deactivate(); });

it('stores and sends the original single URL while the parsed display URL remains normalized', async () => {
  commitIdentity({ ownerId: 'owner-original-url', sessionId: 'session-original-url' });
  const original = 'https://xhslink.com/a#copied';
  const parseInput = vi.fn<HomeApiClient['parseInput']>(async () => ({
    type: 'xhs_link', original_text: original,
    links: [{ url: 'https://xhslink.com/a', original_url: original, position: 0 }],
    link_occurrences: [{ url: 'https://xhslink.com/a', position: 0 }], unrecognized: [],
  }));
  const startIngest = vi.fn<HomeApiClient['startIngest']>(async (request) => {
    const response: IngestAcceptedResponse = {
      operation_id: request.operation_id!, ingest_id: 'ing_original', state: 'created', sse_url: '/ingest/ing_original/events', disposition: 'created',
      snapshot: { ingest_id: 'ing_original', attempt: 1, state_version: 0, state: 'created', source_title: null,
        result: null, partial: false, retriable: false, updated_at: '2026-09-26T00:00:00Z', actions: { retry: false, view: false } },
    };
    return response;
  });
  const api = { getCities: vi.fn(), getInspirations: vi.fn(), getCandidates: vi.fn(), parseInput, startIngest } satisfies HomeApiClient;
  const journal = createJournalFixture();
  const prepare = vi.spyOn(journal, 'prepare');
  const controller = new ImportDockController(api, journal); controllers.push(controller);
  controller.activate(); controller.setInput(original); await controller.submit();
  await vi.waitFor(() => expect(startIngest).toHaveBeenCalledTimes(1));
  expect(prepare.mock.calls[0]?.[1]).toEqual([{ url: original }]);
  expect(startIngest.mock.calls[0]?.[0].url).toBe(original);
});
