import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { commitIdentity } from '../auth/session-context';
import { PrivateUiBoundary } from '../ui';
import { ImportRecordsSection } from './ImportRecordsSection';
import type { HomeApiClient, LibraryImportRecordDetail, LibraryImportRecordItem } from './api';

const original = 'https://xhslink.com/private-source#copied';
const row: LibraryImportRecordItem = {
  id: '10000000-0000-4000-8000-000000000081', ingest_id: 'ing_10000000-0000-4000-8000-000000000091',
  status: 'failed', title: null, inspiration_id: null, locate_status: null, poi_name: null, poi_address: null,
  asset_count: 0, created_at: '2026-09-26T00:00:00.000Z', updated_at: '2026-09-26T00:00:01.000Z',
};
const detail: LibraryImportRecordDetail = { ...row, original_url: original };
function client(overrides: Partial<HomeApiClient> = {}): HomeApiClient {
  return {
    getCities: async () => ({ cities: [], unlocated_count: 0 }),
    getInspirations: async () => ({ items: [] }),
    getCandidates: async () => ({ candidates: [] }),
    parseInput: async () => ({ type: 'unknown', original_text: '' }),
    startIngest: async () => { throw new Error('not used'); },
    getImportRecords: async () => ({ items: [row], next_cursor: null }),
    getImportRecordDetail: async () => detail,
    ...overrides,
  };
}

beforeEach(() => commitIdentity({ ownerId: 'record-owner-a', sessionId: 'record-session-a' }));
afterEach(() => { commitIdentity(null); vi.restoreAllMocks(); });

it('keeps original URL out of the list and reveals it only after owner detail opens', async () => {
  const readDetail = vi.fn(async () => detail);
  render(<PrivateUiBoundary><ImportRecordsSection client={client({ getImportRecordDetail: readDetail })} /></PrivateUiBoundary>);
  expect(await screen.findByText('导入未完成')).toBeInTheDocument();
  expect(screen.getByText('来源标题待确认')).toBeInTheDocument();
  expect(screen.queryByText(original)).toBeNull();
  expect(readDetail).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查看未命名来源的导入记录' }));
  const dialog = await screen.findByRole('dialog');
  expect(await within(dialog).findByText(original)).toBeInTheDocument();
  expect(readDetail).toHaveBeenCalledWith(row.id, expect.any(AbortSignal));
  expect(within(dialog).getByText('可在原导入队列中重试这条记录。')).toBeInTheDocument();
});

it('hides private detail and ignores a response that arrives after the owner changes', async () => {
  let finish!: (value: LibraryImportRecordDetail) => void;
  const readDetail = vi.fn(() => new Promise<LibraryImportRecordDetail>((resolve) => { finish = resolve; }));
  render(<PrivateUiBoundary><ImportRecordsSection client={client({ getImportRecordDetail: readDetail })} /></PrivateUiBoundary>);
  fireEvent.click(await screen.findByRole('button', { name: '查看未命名来源的导入记录' }));
  expect(await screen.findByText('正在读取记录详情')).toBeInTheDocument();
  act(() => commitIdentity({ ownerId: 'record-owner-b', sessionId: 'record-session-b' }));
  await act(async () => finish(detail));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByText(original)).toBeNull();
});

it('copies the protected URL only on explicit action and reports clipboard failure', async () => {
  const prior = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const writeText = vi.fn(async (_value: string) => undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try {
    render(<PrivateUiBoundary><ImportRecordsSection client={client()} /></PrivateUiBoundary>);
    fireEvent.click(await screen.findByRole('button', { name: '查看未命名来源的导入记录' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(original);
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '复制原链接' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(original));
    expect(within(dialog).getByText('原链接已复制')).toBeInTheDocument();
    writeText.mockRejectedValueOnce(new Error('synthetic denial'));
    fireEvent.click(within(dialog).getByRole('button', { name: '复制原链接' }));
    expect(await within(dialog).findByText('复制失败，请检查剪贴板权限后重试')).toBeInTheDocument();
  } finally {
    if (prior) Object.defineProperty(navigator, 'clipboard', prior);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});
