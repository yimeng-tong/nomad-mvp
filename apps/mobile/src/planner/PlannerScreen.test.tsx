import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Analytics } from '../auth/analytics';
import type { LibraryCitySummary, LibraryInspirationItem, PlannerHandoff } from '../home/api';
import { PlannerScreen } from './PlannerScreen';
import type { PlannerApiClient } from './api';

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
  return {
    getCities: vi.fn(async () => ({ cities, unlocated_count: 0 })),
    getInspirations: vi.fn(async () => ({ items: inspirations })),
    searchPoi: vi.fn(async ({ city, q }) => ({
      items: [{ poi_id: 'amap-hotel-1', name: q, address: `${city} · 待用户确认地址`, distance_m: null }],
    })),
    generatePlan: vi.fn(async () => ({ plan_id: 'pl_123', plan_job_id: 'pj_123', sse_url: '/sse/plan/pj_123' })),
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
    expect(await screen.findByText('规划已开始：/sse/plan/pj_123')).toBeInTheDocument();
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
});
