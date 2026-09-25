import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useMemo } from 'react';
import { HomeScreen as ActualHomeScreen, type HomeScreenProps } from './HomeScreen';
import { ImportDockController } from './dock-controller';
import { createJournalFixture } from './journal.test-support';
import { operationJournal } from './operation-journal';
function HomeScreen(props: HomeScreenProps) {
  const controller = useMemo(() => new ImportDockController(props.apiClient!, createJournalFixture()), [props.apiClient]);
  useEffect(() => { controller.activate(); return () => controller.deactivate(); }, [controller]);
  return <ActualHomeScreen {...props} dockController={controller} />;
}
import { commitIdentity } from '../auth/session-context';
import { webcrypto } from 'node:crypto';
import { inputInbox } from './input-runtime';
import type {
  HomeApiClient,
  HomeInputParseResponse,
  LibraryCandidate,
  LibraryCandidatesResponse,
  LibraryCitySummary,
  LibraryInspirationItem,
} from './api';
import type { Analytics } from '../auth/analytics';

const cities: LibraryCitySummary[] = [
  { city_id: 'city-hz', name: '杭州', inspiration_count: 2, pending_count: 1 },
  { city_id: 'city-sh', name: '上海', inspiration_count: 1, pending_count: 0 },
];

const inspirations: LibraryInspirationItem[] = [
  {
    id: 'ins-resolved',
    title: '西湖傍晚散步',
    summary: '作者推荐西湖边散步',
    locate_status: 'resolved',
    city_id: 'city-hz',
    city_name: '杭州',
    poi_id: 'poi-west-lake',
    poi_name: '西湖',
    poi_address: '杭州市西湖区',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:00:00.000Z',
  },
  {
    id: 'ins-hz-food',
    title: '龙井村茶馆',
    summary: '午后喝茶',
    locate_status: 'resolved',
    city_id: 'city-hz',
    city_name: '杭州',
    poi_id: 'poi-longjing',
    poi_name: '龙井村',
    poi_address: '杭州市西湖区龙井村',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:03:00.000Z',
  },
  {
    id: 'ins-shanghai',
    title: '武康路城市漫步',
    summary: '适合傍晚散步',
    locate_status: 'resolved',
    city_id: 'city-sh',
    city_name: '上海',
    poi_id: 'poi-wukang',
    poi_name: '武康路',
    poi_address: '上海市徐汇区',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:04:00.000Z',
  },
  {
    id: 'ins-pending',
    title: '湖滨咖啡',
    summary: '需要确认具体分店',
    locate_status: 'pending',
    city_id: null,
    city_name: null,
    poi_id: null,
    poi_name: null,
    poi_address: null,
    asset_count: 1,
    candidate_count: 2,
    created_at: '2026-06-19T08:05:00.000Z',
  },
];

const candidates: LibraryCandidate[] = [
  { candidate_id: 'cand-1', name: '湖滨咖啡 A 店', address: '杭州市上城区湖滨路 1 号' },
  { candidate_id: 'cand-2', name: '湖滨咖啡 B 店', address: '杭州市西湖区曙光路 2 号' },
];

function createApiClient(parseResult?: HomeInputParseResponse): HomeApiClient {
  return {
    getCities: vi.fn(async () => ({ cities, unlocated_count: 1 })),
    getInspirations: vi.fn(async (filters) => ({
      items: inspirations
        .filter((item) => !filters?.cityId || item.city_id === filters.cityId)
        .filter((item) => !filters?.locateStatus || item.locate_status === filters.locateStatus),
    })),
    getCandidates: vi.fn(async () => ({ candidates })),
    parseInput: vi.fn(async () => parseResult ?? ({ type: 'unknown', original_text: '随便看看' } satisfies HomeInputParseResponse)),
    startIngest: vi.fn(async (request) => ({
      operation_id: request.operation_id!, ingest_id: request.operation_id!, state: 'created' as const,
      disposition: 'created' as const, sse_url: '/ingest/job/events',
      snapshot: { ingest_id: request.operation_id!, attempt: 1, state_version: 0, state: 'created' as const,
        source_title: null, result: null, partial: false, retriable: false, updated_at: '2026-09-19T00:00:00Z', actions: { retry: false, view: false } },
    })),
  };
}

function createAnalytics(): Analytics {
  return { track: vi.fn() };
}

describe('HomeScreen', () => {
  beforeEach(() => { commitIdentity({ ownerId: 'home-test', sessionId: 'home-session' }); vi.spyOn(operationJournal, 'claimed').mockResolvedValue(false); });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders destination cards and library items from user-scoped API data', async () => {
    const apiClient = createApiClient();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    expect(await screen.findByRole('button', { name: /杭州 2 个想去/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /上海 1 个想去/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '灵感' }));
    expect(await screen.findByRole('heading', { name: '已入库' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '待定位' })).toBeInTheDocument();
    expect(await screen.findByText('西湖傍晚散步')).toBeInTheDocument();
    expect(screen.getByText('湖滨咖啡')).toBeInTheDocument();
  });

  it('filters the Library list through city aggregation chips', async () => {
    const apiClient = createApiClient();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: '杭州 2' }));

    await waitFor(() => expect(apiClient.getInspirations).toHaveBeenLastCalledWith({ cityId: 'city-hz' }));
    expect(await screen.findByText('西湖傍晚散步')).toBeInTheDocument();
    expect(screen.getByText('龙井村茶馆')).toBeInTheDocument();
    expect(screen.queryByText('武康路城市漫步')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '待定位 1' }));
    await waitFor(() => expect(apiClient.getInspirations).toHaveBeenLastCalledWith({ locateStatus: 'pending' }));
    expect(await screen.findByText('湖滨咖啡')).toBeInTheDocument();
    expect(screen.queryByText('西湖傍晚散步')).not.toBeInTheDocument();
  });

  it('submits every ordered link, keeps the composer editable and reports only accepted links', async () => {
    const apiClient = createApiClient({
      type: 'xhs_link',
      original_text: 'https://www.xiaohongshu.com/explore/a https://xhslink.com/b',
      url: 'https://www.xiaohongshu.com/explore/a',
      links: [{ url: 'https://www.xiaohongshu.com/explore/a', position: 0 }, { url: 'https://xhslink.com/b', position: 1 }],
      unrecognized: [{ text: 'extra', reason: 'not_a_link' }],
    });
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.change(await screen.findByLabelText('统一输入'), {
      target: { value: 'https://www.xiaohongshu.com/explore/a https://xhslink.com/b' },
    });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => expect(apiClient.parseInput).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(apiClient.startIngest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://www.xiaohongshu.com/explore/a', operation_id: expect.any(String) })));
    expect(await screen.findByText('已添加2个链接，部分内容未识别')).toBeInTheDocument();
    expect(screen.getByLabelText('统一输入')).toBeEnabled();
    expect(screen.getByLabelText('统一输入')).toHaveAttribute('placeholder', '粘贴分享链接或输入想去的地点，如：厦门 3天');
  });

  it('routes trip text and selected anchors into a Planner handoff', async () => {
    const apiClient = createApiClient({
      type: 'trip_params',
      original_text: '杭州 2026-07-02 出发 3天 舒适',
      trip_params: { city: '杭州', start_date: '2026-07-02', days: 3, pace: 'comfortable' },
      planner_handoff: {
        route: '/planner/pick?city=%E6%9D%AD%E5%B7%9E&start=2026-07-02&days=3&source=home_input',
        source: 'home_input',
        selected_items: [],
      },
    });
    const onPlannerHandoff = vi.fn();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} onPlannerHandoff={onPlannerHandoff} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));
    fireEvent.change(screen.getByLabelText('统一输入'), { target: { value: '杭州 2026-07-02 出发 3天 舒适' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    const continueButton = await screen.findByRole('button', { name: '继续规划' });
    expect(continueButton.closest('footer')).toHaveAccessibleName('导入与旅行输入');
    expect(screen.queryByText('comfortable')).not.toBeInTheDocument();
    fireEvent.click(continueButton);

    await waitFor(() => expect(onPlannerHandoff).toHaveBeenCalledTimes(1));
    expect(onPlannerHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        route: expect.stringContaining('/planner/pick?'),
        selected_items: [expect.objectContaining({ item_id: 'ins-resolved', poi_id: 'poi-west-lake', source: 'library', time_hint: 'evening' })],
      }),
    );
  });

  it('starts planning from the selected basket with stable selected anchors', async () => {
    const apiClient = createApiClient();
    const onPlannerHandoff = vi.fn();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} onPlannerHandoff={onPlannerHandoff} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));
    fireEvent.click(screen.getByRole('button', { name: '计划' }));
    fireEvent.click(screen.getByRole('button', { name: '开始规划' }));

    await waitFor(() => expect(onPlannerHandoff).toHaveBeenCalledTimes(1));
    expect(onPlannerHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'home_input',
        selected_items: [expect.objectContaining({ item_id: 'ins-resolved', source: 'library' })],
      }),
    );
  });

  it('starts planning from a destination card with only same-city selected anchors', async () => {
    const apiClient = createApiClient();
    const onPlannerHandoff = vi.fn();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} onPlannerHandoff={onPlannerHandoff} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 武康路城市漫步/ }));
    fireEvent.click(screen.getByRole('button', { name: /杭州 2 个想去/ }));

    await waitFor(() => expect(onPlannerHandoff).toHaveBeenCalledTimes(1));
    expect(onPlannerHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'home_card',
        selected_items: [expect.objectContaining({ item_id: 'ins-resolved', source: 'library' })],
      }),
    );
  });

  it('shows a half-height disambiguation sheet for unknown input without clearing text', async () => {
    const apiClient = createApiClient({ type: 'unknown', original_text: '随便看看' });
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.change(await screen.findByLabelText('统一输入'), { target: { value: '随便看看' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    const sheet = await screen.findByRole('dialog', { name: '选择输入类型' });
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByText('随便看看')).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: '作为链接入库' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: '作为旅行规划' })).toBeInTheDocument();
  });

  it('runs the unknown-input link choice through canonical ingest', async () => {
    const apiClient = createApiClient({ type: 'unknown', original_text: '随便看看' });
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.change(await screen.findByLabelText('统一输入'), { target: { value: '随便看看' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    const sheet = await screen.findByRole('dialog', { name: '选择输入类型' });
    fireEvent.click(within(sheet).getByRole('button', { name: '作为链接入库' }));

    await waitFor(() => expect(apiClient.startIngest).toHaveBeenCalledWith(expect.objectContaining({ share_text: '随便看看', operation_id: expect.any(String) })));
    expect(await screen.findByText('已添加1个链接')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '选择输入类型' })).not.toBeInTheDocument();
  });

  it('runs the unknown-input planning choice through the Planner handoff', async () => {
    const apiClient = createApiClient({ type: 'unknown', original_text: '随便看看' });
    const onPlannerHandoff = vi.fn();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} onPlannerHandoff={onPlannerHandoff} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));
    fireEvent.change(screen.getByLabelText('统一输入'), { target: { value: '随便看看' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    const sheet = await screen.findByRole('dialog', { name: '选择输入类型' });
    fireEvent.click(within(sheet).getByRole('button', { name: '作为旅行规划' }));

    await waitFor(() => expect(onPlannerHandoff).toHaveBeenCalledTimes(1));
    expect(onPlannerHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        route: expect.stringContaining('/planner/pick?source=home_input&city='),
        source: 'home_input',
        selected_items: [expect.objectContaining({ item_id: 'ins-resolved', source: 'library' })],
      }),
    );
  });

  it('shows pending-location candidates with name and address only', async () => {
    const apiClient = createApiClient();
    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /定位 湖滨咖啡/ }));

    expect(await screen.findByText('湖滨咖啡 A 店')).toBeInTheDocument();
    expect(screen.getByText('杭州市上城区湖滨路 1 号')).toBeInTheDocument();
    expect(screen.queryByText(/confidence|score|distance|duration|rating|rank|置信|评分|距离|时长/i)).not.toBeInTheDocument();
  });

  it('keeps slower candidate responses from replacing the active candidate sheet', async () => {
    const pendingA: LibraryInspirationItem = { ...inspirations[3], id: 'ins-pending-a', title: '待定位 A', candidate_count: 1 };
    const pendingB: LibraryInspirationItem = { ...inspirations[3], id: 'ins-pending-b', title: '待定位 B', candidate_count: 1 };
    let resolveA: (value: LibraryCandidatesResponse) => void = () => undefined;
    let resolveB: (value: LibraryCandidatesResponse) => void = () => undefined;
    const apiClient = createApiClient();
    vi.mocked(apiClient.getCities).mockResolvedValue({ cities: [], unlocated_count: 2 });
    vi.mocked(apiClient.getInspirations).mockResolvedValue({ items: [pendingA, pendingB] });
    vi.mocked(apiClient.getCandidates).mockImplementation((id) =>
      new Promise<LibraryCandidatesResponse>((resolve) => {
        if (id === 'ins-pending-a') resolveA = resolve;
        if (id === 'ins-pending-b') resolveB = resolve;
      }),
    );

    render(<HomeScreen apiClient={apiClient} analytics={createAnalytics()} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /定位 待定位 A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /定位 待定位 B/ }));

    resolveB({ candidates: [{ candidate_id: 'cand-b', name: 'B 候选', address: 'B 地址' }] });
    expect(await screen.findByText('B 候选')).toBeInTheDocument();

    resolveA({ candidates: [{ candidate_id: 'cand-a', name: 'A 候选', address: 'A 地址' }] });
    await waitFor(() => expect(screen.queryByText('A 候选')).not.toBeInTheDocument());
  });

  it('sanitizes Home analytics payloads through the shared wrapper', async () => {
    const analytics = createAnalytics();
    const apiClient = createApiClient();
    render(<HomeScreen apiClient={apiClient} analytics={analytics} />);

    fireEvent.click(await screen.findByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));

    const payloads = vi.mocked(analytics.track).mock.calls.map(([, props]) => JSON.stringify(props ?? {}));
    expect(payloads.join(' ')).not.toContain('https://www.xiaohongshu.com');
    expect(payloads.join(' ')).not.toContain('0.72');
    expect(payloads.join(' ')).not.toContain('sid=');
  });

  it('fences reopened result requests, keeps add idempotent, and defers a second modal', async () => {
    const apiClient = createApiClient({ type: 'xhs_link', original_text: 'https://xhslink.com/a', links: [{ url: 'https://xhslink.com/a', position: 0 }] });
    vi.mocked(apiClient.startIngest).mockImplementation(async (request) => ({
      operation_id: request.operation_id!, ingest_id: 'saved-job', state: 'done', disposition: 'reused', sse_url: '/ingest/saved-job/events',
      snapshot: { ingest_id: 'saved-job', attempt: 1, state_version: 4, state: 'done', source_title: inspirations[0].title,
        result: { inspiration_id: inspirations[0].id, asset_count: 1, city_name: '杭州', locate_status: 'resolved' }, stored_count: 1,
        partial: false, retriable: false, updated_at: '2026-09-19T00:00:00Z', actions: { retry: false, view: true } },
    }));
    let rejectOld!: (error: Error) => void, resolveNew!: (item: LibraryInspirationItem) => void;
    apiClient.getIngestResult = vi.fn()
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNew = resolve; }))
      .mockResolvedValue(inspirations[0]);
    render(<HomeScreen apiClient={apiClient} />);
    fireEvent.change(await screen.findByLabelText('统一输入'), { target: { value: 'https://xhslink.com/a' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));
    fireEvent.click(await screen.findByRole('button', { name: '查看已保存内容' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByRole('button', { name: '查看已保存内容' }));
    await act(async () => rejectOld(new Error('old response')));
    expect(screen.getByRole('dialog', { name: '已保存的灵感' })).toHaveTextContent('正在读取已保存内容');
    await act(async () => resolveNew(inspirations[0]));
    fireEvent.click(screen.getByRole('button', { name: '加入已选灵感' }));
    fireEvent.click(screen.getByRole('button', { name: '查看已保存内容' }));
    expect(await screen.findByRole('button', { name: '已选此灵感' })).toBeDisabled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭' }));
    let resolveParse!: (value: HomeInputParseResponse) => void;
    vi.mocked(apiClient.parseInput).mockImplementationOnce(() => new Promise((resolve) => { resolveParse = resolve; }));
    fireEvent.change(screen.getByLabelText('统一输入'), { target: { value: '慢一点的旅行想法' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));
    fireEvent.click(screen.getByRole('button', { name: '查看已保存内容' }));
    await screen.findByRole('button', { name: '已选此灵感' });
    await act(async () => resolveParse({ type: 'unknown', original_text: '慢一点的旅行想法' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('已保存的灵感');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭' }));
    expect(await screen.findByRole('dialog', { name: '选择输入类型' })).toBeInTheDocument();
  });

  it('reads clipboard only on the paste button and preserves manual input on rejection', async () => {
    const readText = vi.fn().mockResolvedValue('厦门 3天');
    vi.stubGlobal('navigator', { clipboard: { readText }, userActivation: { isActive: true } });
    const apiClient = createApiClient(); render(<HomeScreen apiClient={apiClient} />);
    await screen.findByLabelText('统一输入');
    fireEvent(document, new Event('visibilitychange'));
    expect(readText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '从剪贴板粘贴' }));
    await waitFor(() => expect(screen.getByLabelText('统一输入')).toHaveValue('厦门 3天'));
    expect(apiClient.parseInput).not.toHaveBeenCalled(); expect(apiClient.startIngest).not.toHaveBeenCalled();
    readText.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    fireEvent.click(screen.getByRole('button', { name: '从剪贴板粘贴' }));
    expect(await screen.findByText('暂时无法读取剪贴板，可长按输入框粘贴或直接输入。')).toBeInTheDocument();
    expect(screen.getByLabelText('统一输入')).toBeEnabled(); expect(screen.getByLabelText('统一输入')).toHaveValue('厦门 3天');
  });

  it('offers early link content in the same Dock and waits for user confirmation before any parsing or ingest', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const apiClient = createApiClient(); render(<HomeScreen apiClient={apiClient} />);
    fireEvent.change(await screen.findByLabelText('统一输入'), { target: { value: '保留草稿' } });
    await act(async () => { await inputInbox.receive('dev.nomad.mvp://input?v=1&text=%E5%8E%A6%E9%97%A8', { appId: 'dev.nomad.mvp', httpsOrigins: [] }, 'home-test'); });
    const add = screen.getByRole('button', { name: '放入输入框' });
    expect(add.closest('footer')).toHaveAccessibleName('导入与旅行输入');
    expect(apiClient.parseInput).not.toHaveBeenCalled();
    fireEvent.click(add); expect(screen.getByLabelText('统一输入')).toHaveValue('保留草稿\n厦门');
    expect(apiClient.startIngest).not.toHaveBeenCalled(); expect(screen.queryByRole('button', { name: '放入输入框' })).not.toBeInTheDocument();
  });
});
