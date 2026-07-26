import type { PlannerPace } from './types.js';

export type DayWindowSlot = {
  startLocal: string;
  endLocal: string;
};

export type DayWindow = {
  dayIndex: number;
  date: string;
  startLocal: string;
  endLocal: string;
  slots: DayWindowSlot[];
};

type BuildDayWindowsInput = {
  startDate: string;
  days: number;
  pace: PlannerPace;
  morningStartTime?: string | null;
  firstDayArrivalTime?: string | null;
  lastDayDepartureTime?: string | null;
};

export function localMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour! * 60 + minute!;
}

export function formatLocalMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function addDays(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function paceSlotMinutes(pace: PlannerPace) {
  return pace === 'tight' ? 120 : 240;
}

export function normalizeDurationMinutes(minutes: number | null | undefined) {
  return (minutes ?? 120) <= 150 ? 120 : 240;
}

export function buildDayWindows(input: BuildDayWindowsInput): DayWindow[] {
  const slotMinutes = paceSlotMinutes(input.pace);
  const normalStart = input.morningStartTime ?? '09:00';
  return Array.from({ length: input.days }, (_, dayIndex) => {
    const startLocal = dayIndex === 0 && input.firstDayArrivalTime ? input.firstDayArrivalTime : normalStart;
    const endLocal =
      dayIndex === input.days - 1 && input.lastDayDepartureTime ? input.lastDayDepartureTime : '21:00';
    const start = localMinutes(startLocal);
    const end = localMinutes(endLocal);
    const slots: DayWindowSlot[] = [];
    for (let cursor = start; cursor + slotMinutes <= end; cursor += slotMinutes) {
      slots.push({
        startLocal: formatLocalMinutes(cursor),
        endLocal: formatLocalMinutes(cursor + slotMinutes),
      });
    }
    return {
      dayIndex,
      date: addDays(input.startDate, dayIndex),
      startLocal,
      endLocal: slots.at(-1)?.endLocal ?? startLocal,
      slots,
    };
  });
}

export function localTimeInRange(value: string, start: string, end: string) {
  const minutes = localMinutes(value);
  return minutes >= localMinutes(start) && minutes < localMinutes(end);
}

export function timeHintLocal(hint: string) {
  const hints: Record<string, string> = {
    dawn: '05:30',
    morning: '09:00',
    afternoon: '14:00',
    sunset: '17:30',
    evening: '18:30',
    night: '20:00',
    night_market: '19:00',
  };
  return hints[hint] ?? '09:00';
}

export function slotMatchesTimeHint(startLocal: string, hint: string) {
  const start = localMinutes(startLocal);
  const ranges: Record<string, [number, number]> = {
    dawn: [4 * 60, 7 * 60],
    morning: [7 * 60, 12 * 60],
    afternoon: [12 * 60, 17 * 60],
    sunset: [16 * 60, 19 * 60],
    evening: [17 * 60, 21 * 60],
    night: [19 * 60, 24 * 60],
    night_market: [18 * 60, 24 * 60],
  };
  const range = ranges[hint] ?? ranges.morning!;
  return start >= range[0] && start < range[1];
}

function zonedParts(instant: Date, timezone: string) {
  const values = new Map(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get('year')!,
    month: values.get('month')!,
    day: values.get('day')!,
    hour: values.get('hour')!,
    minute: values.get('minute')!,
    second: values.get('second')!,
  };
}

export function zonedLocalToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const desired = Date.UTC(year!, month! - 1, day!, hour!, minute!, 0);
  let candidate = desired;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = zonedParts(new Date(candidate), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const correction = desired - actualAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  const resolved = zonedParts(new Date(candidate), timezone);
  if (
    resolved.year !== year ||
    resolved.month !== month ||
    resolved.day !== day ||
    resolved.hour !== hour ||
    resolved.minute !== minute
  ) {
    throw new RangeError(`Local time ${date}T${time} does not exist in ${timezone}`);
  }
  const ambiguous = [-7_200_000, -3_600_000, -1_800_000, 1_800_000, 3_600_000, 7_200_000]
    .some((offset) => {
      const alternative = zonedParts(new Date(candidate + offset), timezone);
      return (
        alternative.year === year &&
        alternative.month === month &&
        alternative.day === day &&
        alternative.hour === hour &&
        alternative.minute === minute
      );
    });
  if (ambiguous) {
    throw new RangeError(`Local time ${date}T${time} is ambiguous in ${timezone}`);
  }
  return new Date(candidate);
}
