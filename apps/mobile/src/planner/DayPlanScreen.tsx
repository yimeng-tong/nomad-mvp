import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Analytics } from '../auth/analytics';
import { sanitizeAnalyticsProps } from '../auth/analytics';
import type {
  DayPlanResponse,
  EmptySlotResolveRequest,
  PlanGenerateResponse,
  PlanJobEvent,
  PlannerApiClient,
} from './api';

type DayPlanScreenProps = {
  start: PlanGenerateResponse;
  apiClient: PlannerApiClient;
  analytics: Analytics;
  onBack: () => void;
};

const phaseLabels: Record<PlanJobEvent['phase'], string> = {
  started: '正在准备计划',
  freeze: '正在确认指定时段',
  selected_anchor: '正在安排已选地点',
  quota: '正在计算行程容量',
  candidates: '正在整理候选地点',
  place: '正在安排每日顺序',
  validate: '正在检查可行性',
  persist: '正在保存计划',
  done: '计划已准备好',
  failed: '计划生成失败',
};

function hqLabel(state: DayPlanResponse['hq_job'] extends infer T ? T : never) {
  if (!state) return null;
  if (state.state === 'running') return '正在后台优化';
  if (state.state === 'done') return '优化版本已完成';
  return '优化未完成，当前计划仍可使用';
}

export function DayPlanScreen({ start, apiClient, analytics, onBack }: DayPlanScreenProps) {
  const [phase, setPhase] = useState<PlanJobEvent['phase']>('started');
  const [plan, setPlan] = useState<DayPlanResponse | null>(null);
  const [preview, setPreview] = useState<DayPlanResponse | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seedUndoVisible, setSeedUndoVisible] = useState(false);
  const trackedHqState = useRef<string | null>(null);
  const terminalJob = useRef(false);

  const track = useCallback(
    (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
      analytics.track(event, sanitizeAnalyticsProps(props));
    },
    [analytics],
  );

  const refreshPlan = useCallback(async () => {
    const next = await apiClient.getPlan(start.plan_id);
    setPlan(next);
    setPreview(null);
    setActiveDay((current) => Math.min(current, Math.max(0, next.day_plans.length - 1)));
    return next;
  }, [apiClient, start.plan_id]);

  useEffect(() => {
    track('plan_start', { plan_id: start.plan_id });
    const close = apiClient.watchPlanJob({
      sseUrl: start.sse_url,
      onEvent: (event) => {
        setPhase(event.phase);
        if (event.phase === 'done') {
          terminalJob.current = true;
          setNotice(null);
          track('plan_quick_ready', {
            plan_id: event.plan_id,
            placed_count: event.placed_count,
            remaining_count: event.remaining_count,
          });
          void refreshPlan().catch(() => setNotice('计划读取失败，请稍后重试'));
        }
        if (event.phase === 'failed') {
          terminalJob.current = true;
          setNotice(event.retriable ? '计划暂时未完成，可以稍后重试' : '计划信息需要调整后再试');
        }
      },
      onError: () => {
        if (!terminalJob.current) setNotice('连接中断，正在自动重连');
      },
    });
    return close;
  }, [apiClient, refreshPlan, start.plan_id, start.sse_url, track]);

  useEffect(() => {
    const hqJob = plan?.hq_job;
    if (!hqJob) return;
    if (trackedHqState.current !== hqJob.state) {
      trackedHqState.current = hqJob.state;
      track(hqJob.state === 'failed' ? 'plan_hq_failure' : 'plan_hq_state', {
        plan_id: plan.plan_id,
        state: hqJob.state,
      });
    }
    if (hqJob.state !== 'running') return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void apiClient
        .getHqStatus(hqJob.hq_job_id)
        .then((status) => {
          if (!cancelled && status.state !== 'running') void refreshPlan();
        })
        .catch(() => undefined);
    }, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [apiClient, plan, refreshPlan, track]);

  useEffect(() => {
    const token = plan?.seed_undo_token;
    const expiresAt = plan?.seed_undo_expires_at;
    if (!token) {
      setSeedUndoVisible(false);
      return;
    }
    if (!expiresAt) {
      setSeedUndoVisible(true);
      return;
    }
    const remaining = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      setSeedUndoVisible(false);
      return;
    }
    setSeedUndoVisible(true);
    const timer = window.setTimeout(() => setSeedUndoVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [plan?.seed_undo_expires_at, plan?.seed_undo_token]);

  const displayPlan = preview ?? plan;
  const day = displayPlan?.day_plans[activeDay] ?? null;
  const availableCandidates = useMemo(
    () => plan?.candidates.filter((candidate) => candidate.status === 'available') ?? [],
    [plan],
  );

  const resolveSlot = async (candidateId?: string) => {
    if (!plan || !openSlotId) return;
    setBusy(true);
    setNotice(null);
    try {
      const operation: EmptySlotResolveRequest = candidateId
        ? {
            op: 'fill_empty_slot_with_candidate',
            expected_plan_rev: plan.plan_rev,
            candidate_id: candidateId,
          }
        : {
            op: 'set_free_activity',
            expected_plan_rev: plan.plan_rev,
          };
      await apiClient.resolveEmptySlot(plan.plan_id, openSlotId, operation);
      await refreshPlan();
      setOpenSlotId(null);
    } catch {
      setNotice('计划已更新，请同步后再试');
      await refreshPlan().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const resetSeed = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      await apiClient.resetSeed(plan.plan_id, plan.plan_rev);
      track('plan_seed_reset', { plan_id: plan.plan_id });
      await refreshPlan();
    } catch {
      setNotice('重置失败，已保留当前计划');
    } finally {
      setBusy(false);
    }
  };

  const undoSeed = async () => {
    if (!plan?.seed_undo_token) return;
    setBusy(true);
    try {
      await apiClient.undoSeed(plan.plan_id, plan.plan_rev, plan.seed_undo_token);
      track('plan_seed_undo', { plan_id: plan.plan_id });
      await refreshPlan();
    } catch {
      setNotice('撤销已失效，已保留当前计划');
    } finally {
      setBusy(false);
    }
  };

  const previewHq = async () => {
    const versionId = plan?.hq_job?.version_id;
    if (!plan || !versionId) return;
    setBusy(true);
    try {
      setPreview(await apiClient.getPlanVersion(plan.plan_id, versionId));
    } catch {
      setNotice('优化版本暂时无法预览');
    } finally {
      setBusy(false);
    }
  };

  const adoptHq = async () => {
    const hqJob = plan?.hq_job;
    if (!plan || !hqJob?.version_id) return;
    setBusy(true);
    try {
      await apiClient.adoptHq({
        plan_id: plan.plan_id,
        hq_job_id: hqJob.hq_job_id,
        expected_plan_rev: plan.plan_rev,
      });
      track('plan_hq_adopt', { plan_id: plan.plan_id });
      await refreshPlan();
      setNotice('已采用优化版本');
    } catch {
      setNotice('采用失败，已保留当前计划');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="planner-shell day-plan-shell" aria-labelledby="day-plan-title">
      <header className="planner-header">
        <button className="icon-button" type="button" aria-label="返回灵感选择" onClick={onBack}>
          ←
        </button>
        <div>
          <p className="brand-kicker">Nomad</p>
          <p className="planner-param-line">{displayPlan ? `${displayPlan.city} · ${displayPlan.days}天` : '正在准备'}</p>
        </div>
        {preview ? (
          <button className="planner-text-button" type="button" onClick={() => setPreview(null)}>
            返回当前
          </button>
        ) : null}
      </header>

      {notice ? <p className="notice" role="status">{notice}</p> : null}

      {!displayPlan ? (
        <section className="day-plan-loading" aria-live="polite">
          <span className="plan-progress" aria-hidden="true" />
          <h1 id="day-plan-title">{phaseLabels[phase]}</h1>
          <p>完成后会自动显示每日安排</p>
        </section>
      ) : (
        <section className="planner-content day-plan-content">
          <div className="day-plan-title-row">
            <div>
              <h1 id="day-plan-title">{preview ? '优化版本预览' : '我的计划'}</h1>
              <p>{displayPlan.start_date} 出发 · {displayPlan.pace === 'tight' ? '紧凑节奏' : '舒适节奏'}</p>
            </div>
            {!preview ? <span className="plan-revision">v{plan?.plan_rev}</span> : null}
          </div>

          {!preview && plan?.hq_job ? (
            <section className={`hq-status hq-${plan.hq_job.state}`} aria-label="计划优化状态">
              <div>
                <strong>{hqLabel(plan.hq_job)}</strong>
                <p>{plan.hq_job.state === 'running' ? '当前计划可以立即使用' : '两个版本都会保留到你确认采用'}</p>
              </div>
              {plan.hq_job.state === 'done' && plan.hq_job.version_id ? (
                <button type="button" disabled={busy} onClick={() => void previewHq()}>预览优化</button>
              ) : null}
            </section>
          ) : null}

          <nav className="day-tabs" aria-label="选择行程日期">
            {displayPlan.day_plans.map((entry, index) => (
              <button
                key={entry.date}
                type="button"
                aria-current={activeDay === index ? 'page' : undefined}
                onClick={() => setActiveDay(index)}
              >
                <strong>D{index + 1}</strong>
                <span>{entry.date.slice(5)}</span>
              </button>
            ))}
          </nav>

          {day ? (
            <div className="day-timeline" aria-label={`D${activeDay + 1} 每日安排`}>
              {day.slots.map((slot) => (
                <article className={`day-slot slot-${slot.type}`} key={slot.slot_id}>
                  <time>{slot.start_local}<span>{slot.end_local}</span></time>
                  <div>
                    <strong>{slot.title || (slot.type === 'unresolved' ? '待安排' : '自由活动')}</strong>
                    {slot.poi?.address ? <p>{slot.poi.address}</p> : null}
                    {slot.constraint ? <span className="slot-note">已按指定时段安排</span> : null}
                  </div>
                  {slot.type === 'unresolved' && !preview ? (
                    <button type="button" aria-label={`${slot.start_local} 安排空闲时段`} onClick={() => setOpenSlotId(slot.slot_id)}>
                      ＋
                    </button>
                  ) : null}
                </article>
              ))}
              <section className="day-hotel" aria-label={`${day.date} 酒店`}>
                <span aria-hidden="true">⌂</span>
                <div>
                  <strong>{day.hotel.leave_blank || !day.hotel.poi ? '酒店待选择' : day.hotel.poi.name}</strong>
                  <p>
                    {day.hotel.breakfast_included ? '含早餐' : '未设置早餐'}
                    {day.hotel.poi?.address ? ` · ${day.hotel.poi.address}` : ''}
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {displayPlan.unresolved_required.length > 0 ? (
            <section className="plan-unresolved" aria-labelledby="plan-unresolved-title">
              <h2 id="plan-unresolved-title">需要你确认</h2>
              {displayPlan.unresolved_required.map((item) => (
                <div key={`${item.item_id}:${item.reason_code}`}>
                  <strong>已选地点暂未安排</strong>
                  <p>{item.message}</p>
                </div>
              ))}
            </section>
          ) : null}

          {!preview ? (
            <div className="plan-actions" aria-label="计划操作">
              {seedUndoVisible ? <button type="button" disabled={busy} onClick={() => void undoSeed()}>撤销自动安排</button> : null}
              <button type="button" disabled={busy} onClick={() => void resetSeed()}>重置自动安排</button>
            </div>
          ) : (
            <button className="planner-primary" type="button" disabled={busy} onClick={() => void adoptHq()}>
              采用这个版本
            </button>
          )}
        </section>
      )}

      {openSlotId && plan ? (
        <section className="slot-sheet" role="dialog" aria-modal="true" aria-label="安排空闲时段">
          <div className="slot-sheet-handle" aria-hidden="true" />
          <header>
            <h2>安排这段时间</h2>
            <button type="button" aria-label="关闭" onClick={() => setOpenSlotId(null)}>×</button>
          </header>
          <div className="slot-candidates">
            {availableCandidates.map((candidate) => (
              <button key={candidate.candidate_id} type="button" disabled={busy} onClick={() => void resolveSlot(candidate.candidate_id)}>
                <strong>{candidate.poi?.name || '待定位地点'}</strong>
                <span>{candidate.reason}</span>
              </button>
            ))}
            {availableCandidates.length === 0 ? <p>暂无合适候选</p> : null}
          </div>
          <button className="slot-free-button" type="button" disabled={busy} onClick={() => void resolveSlot()}>
            设为自由活动
          </button>
        </section>
      ) : null}
    </main>
  );
}
