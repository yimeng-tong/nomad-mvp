import { useEffect, useMemo, useRef, useState } from 'react';
import type { DayPlanResponse } from './api';

type DayPlanSlot = DayPlanResponse['day_plans'][number]['slots'][number];
type DayPlanCandidate = DayPlanResponse['candidates'][number];
export type SlotEditIntent =
  | { op: 'replace'; candidate_id: string }
  | { op: 'move_day'; target_day_index: number }
  | { op: 'retime'; target_day_index: number; start_local: string; end_local: string }
  | { op: 'delete' };

type SlotEditSheetProps = {
  slot: DayPlanSlot;
  candidates: DayPlanCandidate[];
  dayCount: number;
  busy: boolean;
  onClose: () => void;
  onSubmit: (intent: SlotEditIntent) => void;
};

type SheetMode = 'actions' | 'replace' | 'retime' | 'delete';

const quarterHour = /^([01]\d|2[0-3]):(00|15|30|45)$/;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  const bounded = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(bounded % 60).padStart(2, '0')}`;
}

function snapTime(value: string, interval: 30 | 60, boundary: 'start' | 'end') {
  if (!quarterHour.test(value)) return value;
  const minutes = toMinutes(value);
  const rounded = Math.round(minutes / interval) * interval;
  if (rounded >= 24 * 60 && boundary === 'start') {
    return toTime(Math.floor(minutes / interval) * interval);
  }
  return toTime(rounded);
}

export function SlotEditSheet({
  slot,
  candidates,
  dayCount,
  busy,
  onClose,
  onSubmit,
}: SlotEditSheetProps) {
  const [mode, setMode] = useState<SheetMode>('actions');
  const [startLocal, setStartLocal] = useState(slot.start_local);
  const [endLocal, setEndLocal] = useState(slot.end_local);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);
  busyRef.current = busy;
  onCloseRef.current = onClose;
  const availableCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.status === 'available' && candidate.poi),
    [candidates],
  );
  const validTimes = quarterHour.test(startLocal)
    && quarterHour.test(endLocal)
    && startLocal !== endLocal;
  const overnight = validTimes && toMinutes(endLocal) < toMinutes(startLocal);
  const overnightExceedsTrip = overnight && slot.day_index === dayCount - 1;
  const canMovePrevious = slot.day_index > 0 && !slot.constraint;
  const canMoveNext = slot.day_index < dayCount - 1 && !slot.constraint;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [])];
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (!dialog.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const first = dialog.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });
  }, [mode]);

  const title = mode === 'replace'
    ? '替换安排'
    : mode === 'retime'
      ? '调整时间'
      : mode === 'delete'
        ? '删除安排'
        : '编辑安排';

  return (
    <div className="slot-sheet-backdrop">
      <section
        ref={dialog}
        className="slot-sheet slot-edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-edit-title"
      >
        <div className="slot-sheet-handle" aria-hidden="true" />
        <header>
          <div>
            <h2 id="slot-edit-title">{title}</h2>
            <p>{slot.title || '自由活动'} · D{slot.day_index + 1}</p>
          </div>
          <button ref={closeButton} type="button" aria-label="关闭编辑安排" disabled={busy} onClick={onClose}>×</button>
        </header>

        {mode === 'actions' ? (
          <div className="slot-edit-actions">
            <button type="button" disabled={busy || availableCandidates.length === 0} onClick={() => setMode('replace')}>
              <strong>替换</strong>
              <span>{availableCandidates.length > 0 ? '从候选地点中选择' : '暂无可用候选'}</span>
            </button>
            <div className="slot-day-actions">
              <button
                type="button"
                disabled={busy || !canMovePrevious}
                onClick={() => onSubmit({ op: 'move_day', target_day_index: slot.day_index - 1 })}
              >
                {canMovePrevious ? `移至 D${slot.day_index}` : '移至前一天'}
              </button>
              <button
                type="button"
                disabled={busy || !canMoveNext}
                onClick={() => onSubmit({ op: 'move_day', target_day_index: slot.day_index + 1 })}
              >
                {canMoveNext ? `移至 D${slot.day_index + 2}` : '移至后一天'}
              </button>
            </div>
            {slot.constraint ? <p className="slot-edit-hint">指定时段安排不能移动或调时</p> : null}
            <button type="button" disabled={busy || Boolean(slot.constraint)} onClick={() => setMode('retime')}>
              <strong>调整时间</strong>
              <span>15 分钟步进，可吸附至整点刻度</span>
            </button>
            <button className="slot-delete-action" type="button" disabled={busy} onClick={() => setMode('delete')}>
              <strong>删除</strong>
              <span>该时段会恢复为待安排</span>
            </button>
          </div>
        ) : null}

        {mode === 'replace' ? (
          <>
            <button className="slot-sheet-back" type="button" disabled={busy} onClick={() => setMode('actions')}>返回操作</button>
            <div className="slot-candidates">
              {availableCandidates.map((candidate) => (
                <button
                  key={candidate.candidate_id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSubmit({ op: 'replace', candidate_id: candidate.candidate_id })}
                >
                  <strong>{candidate.poi?.name}</strong>
                  <span>{candidate.reason}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {mode === 'retime' ? (
          <form
            className="slot-retime-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validTimes || overnightExceedsTrip) return;
              onSubmit({
                op: 'retime',
                target_day_index: slot.day_index,
                start_local: startLocal,
                end_local: endLocal,
              });
            }}
          >
            <button className="slot-sheet-back" type="button" disabled={busy} onClick={() => setMode('actions')}>返回操作</button>
            <div className="slot-time-fields">
              <label>
                开始
                <input
                  aria-label="开始时间"
                  type="time"
                  step={900}
                  value={startLocal}
                  onChange={(event) => setStartLocal(event.target.value)}
                />
              </label>
              <label>
                结束
                <input
                  aria-label="结束时间"
                  type="time"
                  step={900}
                  value={endLocal}
                  onChange={(event) => setEndLocal(event.target.value)}
                />
              </label>
            </div>
            <div className="slot-snap-actions" aria-label="时间吸附">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStartLocal(snapTime(startLocal, 30, 'start'));
                  setEndLocal(snapTime(endLocal, 30, 'end'));
                }}
              >
                吸附 30 分钟
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStartLocal(snapTime(startLocal, 60, 'start'));
                  setEndLocal(snapTime(endLocal, 60, 'end'));
                }}
              >
                吸附 60 分钟
              </button>
            </div>
            {!validTimes ? <p className="slot-edit-error" role="alert">请选择不同的 15 分钟刻度</p> : null}
            {overnightExceedsTrip ? (
              <p className="slot-edit-error" role="alert">最后一天不能安排跨夜时段</p>
            ) : overnight ? (
              <p className="slot-edit-hint">此安排将在次日结束</p>
            ) : null}
            <button
              className="slot-edit-submit"
              type="submit"
              disabled={busy || !validTimes || overnightExceedsTrip}
            >
              应用时间
            </button>
          </form>
        ) : null}

        {mode === 'delete' ? (
          <div className="slot-delete-confirm">
            <p>删除后，这段时间会显示为待安排，原地点会回到候选列表。</p>
            <div>
              <button type="button" disabled={busy} onClick={() => setMode('actions')}>取消</button>
              <button type="button" disabled={busy} onClick={() => onSubmit({ op: 'delete' })}>确认删除</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
