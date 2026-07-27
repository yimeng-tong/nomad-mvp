import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Analytics } from '../auth/analytics';
import { AuthApiError } from '../auth/api';
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
    editSlot: vi.fn(async (_planId, slotId, request) => ({
      plan_id: 'pl_1',
      plan_rev: request.expected_plan_rev + 1,
      current_version_id: 'pv_edited',
      edit_event_id: 'edit-1',
      undo_token: 'undo-edit-1',
      undo_expires_at: new Date(Date.now() + 8_000).toISOString(),
      changed_slot: {
        ...quickPlan.day_plans[0]!.slots[0]!,
        slot_id: slotId,
        origin: 'hand' as const,
      },
    })),
    getRecentAction: vi.fn(async () => ({ plan_id: 'pl_1', plan_rev: 1, action: null })),
    undoEdit: vi.fn(async () => ({
      plan_id: 'pl_1',
      plan_rev: 2,
      current_version_id: 'pv_undo',
      undo_event_id: 'undo-event-1',
      undone_edit_event_id: 'edit-1',
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
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  it('opens occupied slots from an accessible action and moves them with a fresh operation id', async () => {
    const track = vi.fn();
    const apiClient = client();
    const randomUuid = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000022');
    render(
      <DayPlanScreen
        start={{ plan_id: 'pl_1', plan_job_id: 'pj_1', sse_url: '/sse/plan/pj_1' }}
        apiClient={apiClient}
        analytics={{ track }}
        onBack={vi.fn()}
      />,
    );
    await screen.findByRole('heading', { name: '我的计划' });

    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    const sheet = screen.getByRole('dialog', { name: '编辑安排' });
    expect(within(sheet).getByRole('button', { name: '移至前一天' })).toBeDisabled();
    fireEvent.click(within(sheet).getByRole('button', { name: '移至 D2' }));

    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-selected',
      {
        op: 'move_day',
        expected_plan_rev: 1,
        operation_id: '00000000-0000-4000-8000-000000000022',
        target_day_index: 1,
      },
    ));
    expect(randomUuid).toHaveBeenCalledOnce();
    expect(apiClient.getPlan).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith('skeleton_slot_edit', {
      plan_id: 'pl_1',
      operation_kind: 'move_day',
      day_delta: 1,
      result: 'success',
    });
  });

  it('creates an operation id when randomUUID is unavailable on an HTTP context', async () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('randomUUID requires a secure context');
    });
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));

    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-selected',
      expect.objectContaining({ operation_id: expect.stringMatching(/^op-[0-9a-f]{32}$/) }),
    ));
  });

  it('opens the same accessible edit sheet after a 500ms long press', async () => {
    renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    vi.useFakeTimers();
    const slot = screen.getByText('日光岩').closest('article');
    expect(slot).not.toBeNull();

    fireEvent.pointerDown(slot!);
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('dialog', { name: '编辑安排' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('dialog', { name: '编辑安排' })).toBeInTheDocument();
  });

  it('traps focus in the edit dialog and restores the action trigger on close', async () => {
    renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    const trigger = screen.getByRole('button', { name: '编辑 日光岩' });
    trigger.focus();
    fireEvent.click(trigger);
    const sheet = screen.getByRole('dialog', { name: '编辑安排' });
    const buttons = within(sheet).getAllByRole('button').filter((button) => !button.hasAttribute('disabled'));
    const close = within(sheet).getByRole('button', { name: '关闭编辑安排' });
    const last = buttons[buttons.length - 1]!;
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: '编辑安排' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('replaces an occupied slot from available candidates', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: /替换/ }));
    fireEvent.click(screen.getByRole('button', { name: /沙坡尾/ }));

    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-selected',
      expect.objectContaining({
        op: 'replace',
        expected_plan_rev: 1,
        candidate_id: 'candidate-1',
      }),
    ));
  });

  it('retimes in 15-minute steps with visible 30/60-minute snap controls', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: /调整时间/ }));
    const startInput = screen.getByLabelText('开始时间') as HTMLInputElement;
    const endInput = screen.getByLabelText('结束时间') as HTMLInputElement;
    expect(startInput).toHaveAttribute('step', '900');
    fireEvent.change(startInput, { target: { value: '09:15' } });
    fireEvent.change(endInput, { target: { value: '11:15' } });
    fireEvent.click(screen.getByRole('button', { name: '吸附 30 分钟' }));
    expect(startInput).toHaveValue('09:30');
    expect(endInput).toHaveValue('11:30');
    expect(screen.getByRole('button', { name: '吸附 60 分钟' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '应用时间' }));

    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-selected',
      expect.objectContaining({
        op: 'retime',
        expected_plan_rev: 1,
        target_day_index: 0,
        start_local: '09:30',
        end_local: '11:30',
      }),
    ));
  });

  it('wraps midnight snaps and blocks an overnight edit on the final day', async () => {
    const finalDayPlan: DayPlanResponse = {
      ...quickPlan,
      day_plans: [
        quickPlan.day_plans[0]!,
        {
          ...quickPlan.day_plans[1]!,
          slots: [{
            ...quickPlan.day_plans[0]!.slots[0]!,
            slot_id: 'slot-final',
            day_index: 1,
          }],
        },
      ],
    };
    const apiClient = renderPlan(client({ getPlan: vi.fn(async () => finalDayPlan) }));
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: /D2/ }));
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: /调整时间/ }));
    fireEvent.change(screen.getByLabelText('开始时间'), { target: { value: '23:45' } });
    fireEvent.change(screen.getByLabelText('结束时间'), { target: { value: '00:45' } });
    fireEvent.click(screen.getByRole('button', { name: '吸附 60 分钟' }));
    expect(screen.getByLabelText('开始时间')).toHaveValue('23:00');
    expect(screen.getByLabelText('结束时间')).toHaveValue('01:00');
    expect(screen.getByText('最后一天不能安排跨夜时段')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '应用时间' })).toBeDisabled();
    expect(apiClient.editSlot).not.toHaveBeenCalled();
  });

  it('requires confirmation before deleting an occupied slot', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: /删除/ }));
    expect(apiClient.editSlot).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledWith(
      'pl_1',
      'slot-selected',
      expect.objectContaining({ op: 'delete', expected_plan_rev: 1 }),
    ));
  });

  it('shows one undo toast for exactly eight seconds and undoes it by token', async () => {
    const revisedPlan = { ...quickPlan, plan_rev: 2, current_version_id: 'pv_edited' };
    const getPlan = vi
      .fn()
      .mockResolvedValueOnce(quickPlan)
      .mockResolvedValue(revisedPlan);
    const apiClient = client({ getPlan });
    renderPlan(apiClient);
    await screen.findByRole('heading', { name: '我的计划' });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole('status', { name: '编辑已应用' })).toHaveTextContent('已应用 · 撤销');
    act(() => vi.advanceTimersByTime(7_999));
    expect(screen.getByRole('status', { name: '编辑已应用' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status', { name: '编辑已应用' })).not.toBeInTheDocument();

    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));
    expect(await screen.findByRole('status', { name: '编辑已应用' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('status', { name: '编辑已应用' })).getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(apiClient.undoEdit).toHaveBeenCalledWith(
      'pl_1',
      { expected_plan_rev: 3, undo_token: 'undo-edit-1' },
    ));
  });

  it('does not show an undo control when the server expiry is already elapsed', async () => {
    const apiClient = renderPlan(client({
      editSlot: vi.fn(async (_planId, slotId, request) => ({
        plan_id: 'pl_1',
        plan_rev: request.expected_plan_rev + 1,
        current_version_id: 'pv_edited',
        edit_event_id: 'edit-expired',
        undo_token: 'undo-expired',
        undo_expires_at: new Date(Date.now() - 1).toISOString(),
        changed_slot: {
          ...quickPlan.day_plans[0]!.slots[0]!,
          slot_id: slotId,
          origin: 'hand' as const,
        },
      })),
    }));
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));
    await waitFor(() => expect(apiClient.editSlot).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: '编辑已应用' })).not.toBeInTheDocument(),
    );
  });

  it('renders only the latest action for the active day and undoes it by event id', async () => {
    const getRecentAction = vi.fn(async (_planId: string, dayIndex: number) => ({
      plan_id: 'pl_1',
      plan_rev: 1,
      action: dayIndex === 0
        ? {
            edit_event_id: 'edit-latest-d1',
            kind: 'replace' as const,
            day_index: 0,
            slot_id: 'slot-selected',
            label: '替换了安排',
            can_undo: true,
            created_at: '2026-08-01T00:00:00.000Z',
          }
        : null,
    }));
    const apiClient = renderPlan(client({ getRecentAction }));

    expect(await screen.findByText('替换了安排')).toBeInTheDocument();
    const recent = screen.getByRole('region', { name: '最近操作' });
    fireEvent.click(within(recent).getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(apiClient.undoEdit).toHaveBeenCalledWith(
      'pl_1',
      { expected_plan_rev: 1, edit_event_id: 'edit-latest-d1' },
    ));

    fireEvent.click(screen.getByRole('button', { name: /D2/ }));
    await waitFor(() => expect(getRecentAction).toHaveBeenCalledWith('pl_1', 1));
    expect(screen.queryByText('替换了安排')).not.toBeInTheDocument();
  });

  it('keeps a recent action available after a transient undo failure', async () => {
    const action = {
      edit_event_id: 'edit-retry',
      kind: 'replace' as const,
      day_index: 0,
      slot_id: 'slot-selected',
      label: '替换了安排',
      can_undo: true,
      created_at: '2026-08-01T00:00:00.000Z',
    };
    const apiClient = renderPlan(client({
      getRecentAction: vi.fn(async () => ({
        plan_id: 'pl_1',
        plan_rev: 1,
        action,
      })),
      undoEdit: vi.fn(async () => {
        throw new Error('temporary network failure');
      }),
    }));
    const recent = await screen.findByRole('region', { name: '最近操作' });
    fireEvent.click(within(recent).getByRole('button', { name: '撤销' }));

    expect(await screen.findByText('撤销失败，当前计划已保留')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '最近操作' })).toBeInTheDocument();
    expect(apiClient.undoEdit).toHaveBeenCalledOnce();
  });

  it('keeps the visible plan and synchronizes honestly after a revision conflict', async () => {
    const apiClient = renderPlan(client({
      editSlot: vi.fn(async () => {
        throw new AuthApiError('stale revision', {
          status: 409,
          code: 'PLAN_REVISION_CONFLICT',
        });
      }),
    }));
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));

    expect(await screen.findByText('计划版本有更新，已同步最新计划，请重试')).toBeInTheDocument();
    expect(screen.getByText('日光岩')).toBeInTheDocument();
    expect(apiClient.getPlan).toHaveBeenCalledTimes(2);
  });

  it('explains a hard-constraint 409 without pretending the revision changed', async () => {
    const apiClient = renderPlan(client({
      editSlot: vi.fn(async () => {
        throw new AuthApiError('hard constraint', {
          status: 409,
          code: 'PLAN_EDIT_HARD_CONSTRAINT',
        });
      }),
    }));
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));

    expect(await screen.findByText('该安排受指定时段约束，无法这样调整')).toBeInTheDocument();
    expect(screen.queryByText(/计划版本有更新/)).not.toBeInTheDocument();
    expect(apiClient.getPlan).toHaveBeenCalledOnce();
  });

  it('does not report a successful edit as failed when only readback is unavailable', async () => {
    const getPlan = vi
      .fn()
      .mockResolvedValueOnce(quickPlan)
      .mockRejectedValueOnce(new Error('readback unavailable'))
      .mockRejectedValueOnce(new Error('undo readback unavailable'));
    const apiClient = client({ getPlan });
    const track = vi.fn();
    render(
      <DayPlanScreen
        start={{ plan_id: 'pl_1', plan_job_id: 'pj_1', sse_url: '/sse/plan/pj_1' }}
        apiClient={apiClient}
        analytics={{ track }}
        onBack={vi.fn()}
      />,
    );
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));

    expect(await screen.findByText('操作已保存，暂时无法读取最新计划')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '编辑已应用' })).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('skeleton_slot_edit', expect.objectContaining({ result: 'success' }));
    expect(track).not.toHaveBeenCalledWith('skeleton_slot_edit', expect.objectContaining({ result: 'failure' }));
    fireEvent.click(
      within(screen.getByRole('status', { name: '编辑已应用' }))
        .getByRole('button', { name: '撤销' }),
    );
    await waitFor(() => expect(apiClient.undoEdit).toHaveBeenCalledWith(
      'pl_1',
      { expected_plan_rev: 2, undo_token: 'undo-edit-1' },
    ));
  });

  it('tracks seed edits without POI, time, candidate, or token content', async () => {
    const seededPlan: DayPlanResponse = {
      ...quickPlan,
      day_plans: [{
        ...quickPlan.day_plans[0]!,
        slots: [{ ...quickPlan.day_plans[0]!.slots[0]!, origin: 'ai_seed' }, quickPlan.day_plans[0]!.slots[1]!],
      }, quickPlan.day_plans[1]!],
    };
    const apiClient = client({ getPlan: vi.fn(async () => seededPlan) });
    const track = vi.fn();
    render(
      <DayPlanScreen
        start={{ plan_id: 'pl_1', plan_job_id: 'pj_1', sse_url: '/sse/plan/pj_1' }}
        apiClient={apiClient}
        analytics={{ track }}
        onBack={vi.fn()}
      />,
    );
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '编辑 日光岩' }));
    fireEvent.click(screen.getByRole('button', { name: '移至 D2' }));
    await waitFor(() => expect(track).toHaveBeenCalledWith('seed_block_edit', {
      plan_id: 'pl_1',
      operation_kind: 'move_day',
      seed: true,
    }));
    expect(track).toHaveBeenCalledWith('undo_toast_show', {
      plan_id: 'pl_1',
      kind: 'move_day',
    });
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
    fireEvent.click(screen.getByRole('button', { name: '重置预布局' }));
    await waitFor(() => expect(apiClient.resetSeed).toHaveBeenCalledWith('pl_1', 1));
  });

  it('previews and adopts HQ while preserving the current plan until adoption succeeds', async () => {
    const apiClient = renderPlan();
    await screen.findByRole('heading', { name: '我的计划' });
    fireEvent.click(screen.getByRole('button', { name: '预览优化' }));
    expect(await screen.findByRole('heading', { name: '优化版本预览' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '编辑 日光岩' })).not.toBeInTheDocument();
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
