import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Analytics } from '../auth/analytics';
import type { LibraryCitySummary, LibraryInspirationItem, LibraryInspirationsResponse, PlannerHandoff } from '../home/api';
import { PlannerScreen } from './PlannerScreen';
import type { DayPlanResponse, PlannerApiClient, SearchPoiItem } from './api';

const cities: LibraryCitySummary[] = [
  { city_id: 'city-xm', name: '厦门', inspiration_count: 4, pending_count: 0 },
  { city_id: 'city-qz', name: '泉州', inspiration_count: 2, pending_count: 0 },
  { city_id: 'city-fz', name: '福州', inspiration_count: 1, pending_count: 0 },
];

const inspirations: LibraryInspirationItem[] = [
  {
    id: 'ins-sunlight-rock',
    title: '鼓浪屿日光岩上午',
    summary: '上午登高看海',
    locate_status: 'resolved',
    city_id: 'city-xm',
    city_name: '厦门',
    poi_id: 'poi-sunlight-rock',
    poi_name: '日光岩',
    poi_address: '厦门市思明区鼓浪屿',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:00:00.000Z',
  },
  {
    id: 'ins-shuzhuang',
    title: '菽庄花园',
    summary: '鼓浪屿园林',
    locate_status: 'resolved',
    city_id: 'city-xm',
    city_name: '厦门',
    poi_id: 'poi-shuzhuang',
    poi_name: '菽庄花园',
    poi_address: '厦门市思明区鼓浪屿',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:05:00.000Z',
  },
  {
    id: 'ins-night-market',
    title: '中山路夜市',
    summary: '晚上逛骑楼和夜市',
    locate_status: 'resolved',
    city_id: 'city-xm',
    city_name: '厦门',
    poi_id: 'poi-zhongshan-road',
    poi_name: '中山路',
    poi_address: '厦门市思明区中山路',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:10:00.000Z',
  },
  {
    id: 'ins-quanzhou',
    title: '西街夜景',
    summary: '晚上适合散步',
    locate_status: 'resolved',
    city_id: 'city-qz',
    city_name: '泉州',
    poi_id: 'poi-west-street',
    poi_name: '西街',
    poi_address: '泉州市鲤城区',
    asset_count: 1,
    candidate_count: 0,
    created_at: '2026-06-19T08:15:00.000Z',
  },
];

function createHandoff(route = '/planner/pick?city=%E5%8E%A6%E9%97%A8&start=2026-07-02&days=3&source=home_input'): PlannerHandoff {
  return {
    route,
    source: 'home_input',
    selected_items: [],
  };
}

function createApiClient(overrides: Partial<PlannerApiClient> = {}): PlannerApiClient {
  const plan: DayPlanResponse = {
    plan_id: 'pl_123',
    city: '厦门',
    start_date: '2026-07-02',
    days: 1,
    pace: 'comfortable',
    plan_rev: 1,
    current_version_id: 'pv_quick',
    quick_version: {
      version_id: 'pv_quick',
      kind: 'quick',
      state: 'ready',
      created_at: '2026-07-02T00:00:00.000Z',
    },
    hq_job: null,
    versions: [{ version_id: 'pv_quick', kind: 'quick', state: 'ready', created_at: '2026-07-02T00:00:00.000Z' }],
    day_plans: [{
      day_index: 0,
      date: '2026-07-02',
      slots: [],
      hotel: { date: '2026-07-02', leave_blank: true },
    }],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  };
  return {
    getCities: vi.fn(async () => ({ cities, unlocated_count: 0 })),
    getInspirations: vi.fn(async () => ({ items: inspirations })),
    searchPoi: vi.fn(async ({ city, q }) => ({
      items: [{ poi_id: 'amap-hotel-1', name: q, address: `${city} · 待用户确认地址`, distance_m: null }],
    })),
    generatePlan: vi.fn(async () => ({ plan_id: 'pl_123', plan_job_id: 'pj_123', sse_url: '/sse/plan/pj_123' })),
    watchPlanJob: vi.fn(() => () => undefined),
    getPlan: vi.fn(async () => plan),
    getPlanVersion: vi.fn(async () => plan),
    resolveEmptySlot: vi.fn(async (_planId, slotId) => ({
      plan_id: 'pl_123',
      plan_rev: 2,
      slot: {
        slot_id: slotId,
        day_index: 0,
        slot_index: 0,
        start_local: '09:00',
        end_local: '11:00',
        type: 'free' as const,
        origin: 'free' as const,
      },
    })),
    resetSeed: vi.fn(async () => ({ plan_id: 'pl_123', plan_rev: 2 })),
    undoSeed: vi.fn(async () => ({ plan_id: 'pl_123', plan_rev: 2 })),
    getHqStatus: vi.fn(async () => ({
      hq_job_id: 'hq_123',
      state: 'done' as const,
      plan_id: 'pl_123',
      version_id: 'pv_hq',
    })),
    adoptHq: vi.fn(async () => ({ plan_id: 'pl_123', plan_rev: 2, current_version_id: 'pv_hq' })),
    ...overrides,
  };
}

function createAnalytics(): Analytics {
  return { track: vi.fn() };
}

async function continueFromConfirm() {
  fireEvent.change(await screen.findByLabelText('首日到达'), { target: { value: '11:20' } });
  fireEvent.change(screen.getByLabelText('末日离开'), { target: { value: '18:45' } });
  fireEvent.click(screen.getByRole('button', { name: '继续选择灵感' }));
  expect(await screen.findByRole('heading', { name: '选择灵感' })).toBeInTheDocument();
}

describe('PlannerScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows missing parameter placeholders and Confirm validation copy', async () => {
    render(<PlannerScreen handoff={createHandoff('/planner/pick?source=home_input')} apiClient={createApiClient()} onBack={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: '确认旅行参数' })).toBeInTheDocument();
    expect(screen.getByText('待填写 · 待填写 · 待填写')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '继续选择灵感' }));

    expect(await screen.findByText('请选择城市')).toBeInTheDocument();
    expect(screen.getByText('请完善出行时间')).toBeInTheDocument();
    expect(screen.getByText('请选择出发时间')).toBeInTheDocument();
  });

  it('builds Story 2.0 generation payload from Confirm and Picker context', async () => {
    const apiClient = createApiClient();
    const analytics = createAnalytics();
    render(<PlannerScreen handoff={createHandoff()} apiClient={apiClient} analytics={analytics} onBack={vi.fn()} />);

    fireEvent.change((await screen.findAllByPlaceholderText('输入酒店名称，高德匹配'))[0], { target: { value: '厦门中山路酒店' } });
    await waitFor(() => expect(apiClient.searchPoi).toHaveBeenCalledWith({ city: '厦门', q: '厦门中山路酒店', topk: 3 }));
    fireEvent.click(await screen.findByRole('button', { name: /厦门中山路酒店/ }));
    fireEvent.click(screen.getAllByLabelText('含早餐')[0]);
    fireEvent.change(screen.getByLabelText('处理方式'), { target: { value: 'hotel_storage' } });
    fireEvent.change(screen.getByLabelText('补充说明'), { target: { value: '换酒店当天先寄存' } });
    fireEvent.click(screen.getByLabelText('换酒店当天需要处理行李'));

    await continueFromConfirm();

    const sunlightRow = screen.getByText('日光岩').closest('article');
    expect(sunlightRow).not.toBeNull();
    fireEvent.click(within(sunlightRow as HTMLElement).getByRole('button', { name: '选择' }));

    fireEvent.click(screen.getByRole('button', { name: '开始规划' }));

    await waitFor(() => expect(apiClient.generatePlan).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(apiClient.generatePlan).mock.calls[0][0];
    expect(payload).toMatchObject({
      city: '厦门',
      start_date: '2026-07-02',
      days: 3,
      pace: 'comfortable',
      hotels: expect.arrayContaining([expect.objectContaining({ hotel_name: '厦门中山路酒店', poi_id: 'amap-hotel-1', address: '厦门 · 待用户确认地址', breakfast_included: true })]),
      luggage_plan: expect.objectContaining({ mode: 'hotel_storage', notes: '换酒店当天先寄存', hotel_change_help_needed: true }),
      wake_preference: '08:30',
      morning_start_time: '09:30',
      selected_items: [expect.objectContaining({ item_id: 'ins-sunlight-rock', anchor_intent: 'selected_required' })],
    });
    expect(payload.candidate_items?.some((item) => item.item_id === 'ins-night-market')).toBe(true);
    expect(payload.hard_time_hints).toContainEqual(expect.objectContaining({ item_id: 'ins-night-market', time_hint: 'night_market' }));
    expect(await screen.findByRole('heading', { name: '正在准备计划' })).toBeInTheDocument();
    expect(vi.mocked(analytics.track).mock.calls.some(([event]) => event === 'picker_generate_skeleton')).toBe(true);
  });

  it('filters city tabs to count greater than one and sorts by target distance', async () => {
    render(<PlannerScreen handoff={createHandoff()} apiClient={createApiClient()} onBack={vi.fn()} />);

    await continueFromConfirm();

    const tabList = screen.getByLabelText('城市灵感');
    const tabs = within(tabList).getAllByRole('button').map((button) => button.textContent);
    expect(tabs).toEqual(['厦门 4', '泉州 2']);
    expect(within(tabList).queryByRole('button', { name: '福州 1' })).not.toBeInTheDocument();
  });

  it('synchronizes L3 selection, parent L2 count, marker state, and basket', async () => {
    render(<PlannerScreen handoff={createHandoff()} apiClient={createApiClient()} onBack={vi.fn()} />);

    await continueFromConfirm();

    const group = screen.getByLabelText('鼓浪屿 已选 0 个L3');
    expect(within(group).getByText('可选')).toBeInTheDocument();
    const sunlightRow = screen.getByText('日光岩').closest('article');
    fireEvent.click(within(sunlightRow as HTMLElement).getByRole('button', { name: '选择' }));

    expect(await screen.findByLabelText('鼓浪屿 已选 1 个L3')).toBeInTheDocument();
    expect(screen.getByText('已选 1')).toBeInTheDocument();
    expect(within(sunlightRow as HTMLElement).getByRole('button', { name: '已选' })).toBeInTheDocument();
  });

  it('preserves selected anchors and basket state across city tabs', async () => {
    const apiClient = createApiClient();
    render(<PlannerScreen handoff={createHandoff()} apiClient={apiClient} onBack={vi.fn()} />);

    await continueFromConfirm();
    const sunlightRow = screen.getByText('日光岩').closest('article') as HTMLElement;
    fireEvent.click(within(sunlightRow).getByRole('button', { name: '选择' }));
    fireEvent.click(screen.getByRole('button', { name: '泉州 2' }));
    const westStreetRow = await screen.findByText('西街');
    fireEvent.click(within(westStreetRow.closest('article') as HTMLElement).getByRole('button', { name: '选择' }));

    expect(screen.getByText('已选 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '开始规划' }));

    await waitFor(() => expect(apiClient.generatePlan).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(apiClient.generatePlan).mock.calls[0][0];
    expect(payload.selected_items?.map((item) => item.item_id)).toEqual(expect.arrayContaining(['ins-sunlight-rock', 'ins-quanzhou']));
    expect(payload.hard_time_hints).toContainEqual(expect.objectContaining({
      item_id: 'ins-quanzhou',
      time_hint: 'night',
      source: 'user_selected',
    }));
  });

  it('shows a target-city empty state instead of mixing in other cities', async () => {
    render(
      <PlannerScreen
        handoff={createHandoff('/planner/pick?city=%E6%9D%AD%E5%B7%9E&start=2026-07-02&days=3&source=home_input')}
        apiClient={createApiClient()}
        onBack={vi.fn()}
      />,
    );

    await continueFromConfirm();

    expect(screen.getByText('暂无可用灵感，试试更换城市或关键词')).toBeInTheDocument();
    expect(screen.queryByText('日光岩')).not.toBeInTheDocument();
    expect(screen.queryByText('西街')).not.toBeInTheDocument();
  });

  it('keeps successful inspiration data when city summaries fail', async () => {
    const apiClient = createApiClient({
      getCities: vi.fn(async () => {
        throw new Error('network');
      }),
    });
    render(<PlannerScreen handoff={createHandoff()} apiClient={apiClient} onBack={vi.fn()} />);

    expect(await screen.findByText('网络较差，已切换为清单模式')).toBeInTheDocument();
    await continueFromConfirm();

    expect(screen.getByText('日光岩')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '仅列表继续' })).toBeInTheDocument();
  });

  it('blocks planning until Picker data loading settles', async () => {
    let resolveInspirations: (value: LibraryInspirationsResponse) => void = () => undefined;
    const apiClient = createApiClient({
      getInspirations: vi.fn(() => new Promise<LibraryInspirationsResponse>((resolve) => {
        resolveInspirations = resolve;
      })),
    });
    render(<PlannerScreen handoff={createHandoff()} apiClient={apiClient} onBack={vi.fn()} />);

    await continueFromConfirm();
    expect(screen.getByRole('button', { name: '加载中' })).toBeDisabled();

    resolveInspirations({ items: inspirations });
    expect(await screen.findByRole('button', { name: '开始规划' })).toBeEnabled();
  });

  it('makes blank hotel rows reversible and clears incompatible breakfast state', async () => {
    render(<PlannerScreen handoff={createHandoff()} apiClient={createApiClient()} onBack={vi.fn()} />);

    const breakfast = (await screen.findAllByLabelText('含早餐'))[0];
    fireEvent.click(breakfast);
    fireEvent.click(screen.getAllByRole('button', { name: '留空' })[0]);

    expect(breakfast).not.toBeChecked();
    expect(breakfast).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: '填写酒店' })[0]);
    expect(breakfast).toBeEnabled();
  });

  it('ignores stale hotel search responses', async () => {
    let resolveOld: (value: { items?: SearchPoiItem[] }) => void = () => undefined;
    let resolveNew: (value: { items?: SearchPoiItem[] }) => void = () => undefined;
    const apiClient = createApiClient({
      searchPoi: vi.fn(({ q }) => new Promise<{ items?: SearchPoiItem[] }>((resolve) => {
        if (q === '旧酒店') resolveOld = resolve;
        else resolveNew = resolve;
      })),
    });
    render(<PlannerScreen handoff={createHandoff()} apiClient={apiClient} onBack={vi.fn()} />);

    const input = (await screen.findAllByPlaceholderText('输入酒店名称，高德匹配'))[0];
    fireEvent.change(input, { target: { value: '旧酒店' } });
    await waitFor(() => expect(apiClient.searchPoi).toHaveBeenCalledWith({ city: '厦门', q: '旧酒店', topk: 3 }));
    fireEvent.change(input, { target: { value: '新酒店' } });
    await waitFor(() => expect(apiClient.searchPoi).toHaveBeenCalledWith({ city: '厦门', q: '新酒店', topk: 3 }));

    resolveNew({ items: [{ poi_id: 'new', name: '新酒店结果', address: '新地址', distance_m: null }] });
    expect(await screen.findByText('新酒店结果')).toBeInTheDocument();
    resolveOld({ items: [{ poi_id: 'old', name: '旧酒店结果', address: '旧地址', distance_m: null }] });
    await waitFor(() => expect(screen.queryByText('旧酒店结果')).not.toBeInTheDocument());
  });

  it('validates the MVP day limit, one-day chronology, and hotel-change luggage', async () => {
    render(<PlannerScreen handoff={createHandoff()} apiClient={createApiClient()} onBack={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('天数'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('首日到达'), { target: { value: '11:20' } });
    fireEvent.click(screen.getByRole('button', { name: '继续选择灵感' }));
    expect(await screen.findByText('请完善出行时间')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('天数'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('首日到达'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('末日离开'), { target: { value: '09:00' } });
    fireEvent.click(screen.getByRole('button', { name: '继续选择灵感' }));
    expect(await screen.findByText('单日行程的离开时间不能早于到达时间')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('天数'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('首日到达'), { target: { value: '11:20' } });
    fireEvent.change(screen.getByLabelText('末日离开'), { target: { value: '18:00' } });
    const hotelInputs = screen.getAllByPlaceholderText('输入酒店名称，高德匹配');
    fireEvent.change(hotelInputs[0], { target: { value: '酒店 A' } });
    fireEvent.change(hotelInputs[1], { target: { value: '酒店 B' } });
    fireEvent.click(screen.getByRole('button', { name: '继续选择灵感' }));
    expect(await screen.findByText('换酒店时请选择行李处理方式')).toBeInTheDocument();
  });

  it('falls back to list mode on weak network without blocking selection', async () => {
    const apiClient = createApiClient({
      getCities: vi.fn(async () => {
        throw new Error('network');
      }),
      getInspirations: vi.fn(async () => {
        throw new Error('network');
      }),
    });
    const handoff = createHandoff();
    handoff.selected_items = [{ item_id: 'ins-offline', source: 'library' }];
    render(<PlannerScreen handoff={handoff} apiClient={apiClient} onBack={vi.fn()} />);

    expect(await screen.findByText('网络较差，已切换为清单模式')).toBeInTheDocument();
    await continueFromConfirm();

    expect(screen.getByText('已选灵感 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '仅列表继续' })).toBeInTheDocument();
    expect(screen.getByText('已选 1')).toBeInTheDocument();
  });

  it('preserves selected hard-time evidence in a complete weak-network fallback', async () => {
    const apiClient = createApiClient({
      getCities: vi.fn(async () => {
        throw new Error('network');
      }),
      getInspirations: vi.fn(async () => {
        throw new Error('network');
      }),
    });
    const handoff = createHandoff();
    handoff.selected_items = [{ item_id: 'ins-offline-night', source: 'home_input', time_hint: 'night_market' }];
    render(<PlannerScreen handoff={handoff} apiClient={apiClient} onBack={vi.fn()} />);

    expect(await screen.findByText('网络较差，已切换为清单模式')).toBeInTheDocument();
    await continueFromConfirm();
    fireEvent.click(screen.getByRole('button', { name: '开始规划' }));

    await waitFor(() => expect(apiClient.generatePlan).toHaveBeenCalledTimes(1));
    expect(vi.mocked(apiClient.generatePlan).mock.calls[0][0].hard_time_hints).toContainEqual({
      item_id: 'ins-offline-night',
      poi_id: null,
      time_hint: 'night_market',
      source: 'user_selected',
    });
  });

  it('uses neutral non-Xiamen L2 grouping and safely handles prototype-like names', async () => {
    const unusual: LibraryInspirationItem[] = [
      {
        ...inspirations[3],
        id: 'ins-prototype',
        city_id: 'city-prototype',
        city_name: '__proto__',
        poi_name: '夜市',
        poi_address: '',
      },
    ];
    const apiClient = createApiClient({
      getCities: vi.fn(async () => ({ cities: [{ city_id: 'city-prototype', name: '__proto__', inspiration_count: 2, pending_count: 0 }], unlocated_count: 0 })),
      getInspirations: vi.fn(async () => ({ items: unusual })),
    });
    render(
      <PlannerScreen
        handoff={createHandoff('/planner/pick?city=__proto__&start=2026-07-02&days=3&source=home_input')}
        apiClient={apiClient}
        onBack={vi.fn()}
      />,
    );

    await continueFromConfirm();
    expect(screen.getByLabelText('__proto__ 已选 0 个L3')).toBeInTheDocument();
    expect(screen.queryByLabelText('中山路 已选 0 个L3')).not.toBeInTheDocument();
  });
});
