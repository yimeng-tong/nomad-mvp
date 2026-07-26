import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Analytics } from '../auth/analytics';
import { DayPlanScreen } from './DayPlanScreen';
import type { DayPlanResponse, PlanJobEvent, PlannerApiClient } from './api';

const quickPlan: DayPlanResponse = {
  plan_id: 'pl_1',
  city: '厦门',
  start_date: '2026-08-01',
  days: 2,
  pace: 'tight',
  plan_rev: 1,
  current_version_id: 'pv_quick',
  quick_version: {
    version_id: 'pv_quick',
    kind: 'quick',
    state: 'ready',
    created_at: '2026-08-01T00:00:00.000Z',
  },
  hq_job: {
    hq_job_id: 'hq_1',
    state: 'done',
    version_id: 'pv_hq',
    error_code: null,
  },
  versions: [
    { version_id: 'pv_quick', kind: 'quick', state: 'ready', created_at: '2026-08-01T00:00:00.000Z' },
    { version_id: 'pv_hq', kind: 'hq', state: 'ready', created_at: '2026-08-01T00:00:01.000Z' },
  ],
  day_plans: [
    {
      day_index: 0,
      date: '2026-08-01',
      slots: [
        {
          slot_id: 'slot-selected',
          day_index: 0,
          slot_index: 0,
          start_local: '09:00',
          end_local: '11:00',
          type: 'place',
          origin: 'selected_required',
          title: '日光岩',
          poi: {
            poi_id: 'poi-selected',
            name: '日光岩',
            address: '鼓浪屿',
            verified: true,
          },
        },
        {
          slot_id: 'slot-empty',
          day_index: 0,
          slot_index: 1,
          start_local: '11:00',
          end_local: '13:00',
          type: 'unresolved',
          origin: 'free',
        },
      ],
      hotel: {
        date: '2026-08-01',
        leave_blank: false,
        breakfast_included: true,
        poi: { poi_id: 'hotel-1', name: '厦门宾馆', address: '思明区', verified: true },
      },
    },
    {
      day_index: 1,
      date: '2026-08-02',
      slots: [],
      hotel: { date: '2026-08-02', leave_blank: true },
    },
  ],
  candidates: [
    {
      candidate_id: 'candidate-1',
      item_id: 'item-1',
      poi: { poi_id: 'poi-candidate', name: '沙坡尾', address: '思明区', verified: true },
      status: 'available',
      source: 'user_candidate',
      reason: '适合当前行程',
    },
  ],
  warnings: [],
  unresolved_required: [],
  seed_undo_token: 'undo-seed',
};

const hqPlan: DayPlanResponse = {
  ...quickPlan,
  current_version_id: 'pv_hq',
  warnings: [{ code: 'HQ_REFINED', severity: 'soft', message: '高质量规划已完成' }],
};

function client(overrides: Partial<PlannerApiClient> = {}): PlannerApiClient {
  return {
    getCities: vi.fn(async () => ({ cities: [], unlocated_count: 0 })),
    getInspirations: vi.fn(async () => ({ items: [] })),
    searchPoi: vi.fn(async () => ({ items: [] })),
    generatePlan: vi.fn(async () => ({ plan_id: 'pl_1', plan_job_id: 'pj_1', sse_url: '/sse/plan/pj_1' })),
    watchPlanJob: vi.fn(({ onEvent }) => {
      queueMicrotask(() => onEvent({
        trace_id: 'trace-1',
        plan_id: 'pl_1',
        plan_job_id: 'pj_1',
        phase: 'done',
        quick_version_id: 'pv_quick',
        hq_job_id: 'hq_1',
        ts: 1,
      }));
      return () => undefined;
    }),
    getPlan: vi.fn(async () => quickPlan),
    getPlanVersion: vi.fn(async () => hqPlan),
    resolveEmptySlot: vi.fn(async (_planId, slotId) => ({
      plan_id: 'pl_1',
      plan_rev: 2,
      slot: {
        slot_id: slotId,
        day_index: 0,
        slot_index: 1,
        start_local: '11:00',
        end_local: '13:00',
        type: 'place' as const,
        origin: 'hand' as const,
      },
    })),
    resetSeed: vi.fn(async () => ({ plan_id: 'pl_1', plan_rev: 2 })),
    undoSeed: vi.fn(async () => ({ plan_id: 'pl_1', plan_rev: 2 })),
    getHqStatus: vi.fn(async () => ({
      hq_job_id: 'hq_1',
      state: 'done' as const,
      plan_id: 'pl_1',
      version_id: 'pv_hq',
    })),
    adoptHq: vi.fn(async () => ({ plan_id: 'pl_1', plan_rev: 2, current_version_id: 'pv_hq' })),
    ...overrides,
  };
}

function analytics(): Analytics {
  return { track: vi.fn() };
}

function renderPlan(apiClient = client()) {
  render(
    <DayPlanScreen
      start={{ plan_id: 'pl_1', plan_job_id: 'pj_1', sse_url: '/sse/plan/pj_1' }}
      apiClient={apiClient}
      analytics={analytics()}
      onBack={vi.fn()}
    />,
  );
  return apiClient;
}

describe('DayPlanScreen', () => {
  it('renders Quick first with stable day tabs, slots, and per-date hotel state', async () => {
    renderPlan();
    expect(await screen.findByRole('heading', { name: '我的计划' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /D1/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('日光岩')).toBeInTheDocument();
    expect(screen.getByText('厦门宾馆')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /D2/ }));
    expect(await screen.findByText('酒店待选择')).toBeInTheDocument();
    expect(screen.queryByText('骨架')).not.toBeInTheDocument();
  });

  it('fills an empty slot from candidates without optimistic replacement', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '11:00 安排空闲时段' }));
    const sheet = screen.getByRole('dialog', { name: '安排空闲时段' });
    fireEvent.click(within(sheet).getByRole('button', { name: /沙坡尾/ }));

    await waitFor(() => expect(apiClient.resolveEmptySlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-empty',
      expect.objectContaining({
        op: 'fill_empty_slot_with_candidate',
        expected_plan_rev: 1,
        candidate_id: 'candidate-1',
      }),
    ));
    expect(apiClient.getPlan).toHaveBeenCalledTimes(2);
  });

  it('can mark an empty slot as free activity and preserves revision checks', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '11:00 安排空闲时段' }));
    fireEvent.click(screen.getByRole('button', { name: '设为自由活动' }));

    await waitFor(() => expect(apiClient.resolveEmptySlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-empty',
      {
        op: 'set_free_activity',
        expected_plan_rev: 1,
      },
    ));
  });

  it('explains selected locations that could not be scheduled', async () => {
    const unresolvedPlan: DayPlanResponse = {
      ...quickPlan,
      unresolved_required: [{
        item_id: 'item-unresolved',
        poi_id: 'poi-unresolved',
        reason_code: 'hard_time_conflict',
        message: '预约时间与到达时间冲突',
      }],
    };
    renderPlan(client({ getPlan: vi.fn(async () => unresolvedPlan) }));

    expect(await screen.findByRole('heading', { name: '需要你确认' })).toBeInTheDocument();
    expect(screen.getByText('预约时间与到达时间冲突')).toBeInTheDocument();
  });

  it('supports seed undo/reset and keeps analytics payloads free of raw content', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(await screen.findByRole('button', { name: '撤销自动安排' }));
    await waitFor(() => expect(apiClient.undoSeed).toHaveBeenCalledWith('pl_1', 1, 'undo-seed'));
    fireEvent.click(screen.getByRole('button', { name: '重置自动安排' }));
    await waitFor(() => expect(apiClient.resetSeed).toHaveBeenCalledWith('pl_1', 1));
  });

  it('previews and adopts HQ while preserving the current plan until adoption succeeds', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '预览优化' }));
    expect(await screen.findByRole('heading', { name: '优化版本预览' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '采用这个版本' }));
    await waitFor(() => expect(apiClient.adoptHq).toHaveBeenCalledWith({
      plan_id: 'pl_1',
      hq_job_id: 'hq_1',
      expected_plan_rev: 1,
    }));
    expect(await screen.findByText('已采用优化版本')).toBeInTheDocument();
  });

  it('shows reconnect and terminal failure states without fabricating a plan', async () => {
    const apiClient = client({
      watchPlanJob: vi.fn(({ onEvent, onError }) => {
        queueMicrotask(() => {
          onError();
          onEvent({
            trace_id: 'trace-failed',
            plan_id: 'pl_1',
            plan_job_id: 'pj_1',
            phase: 'failed',
            error_code: 'PLAN_GENERATION_FAILED',
            retriable: true,
            ts: 2,
          } as PlanJobEvent);
        });
        return () => undefined;
      }),
    });
    renderPlan(apiClient);
    expect(await screen.findByText('计划暂时未完成，可以稍后重试')).toBeInTheDocument();
    expect(apiClient.getPlan).not.toHaveBeenCalled();
  });

  it('keeps Quick usable when HQ fails', async () => {
    const failedHqPlan: DayPlanResponse = {
      ...quickPlan,
      hq_job: {
        hq_job_id: 'hq_failed',
        state: 'failed',
        version_id: null,
        error_code: 'HQ_PROVIDER_UNAVAILABLE',
      },
      versions: quickPlan.versions.slice(0, 1),
    };
    renderPlan(client({ getPlan: vi.fn(async () => failedHqPlan) }));

    expect(await screen.findByText('优化未完成，当前计划仍可使用')).toBeInTheDocument();
    expect(screen.getByText('日光岩')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '预览优化' })).not.toBeInTheDocument();
  });
});
