import { createHash } from 'node:crypto';
import type { XhsFetchedPost } from './adapters.js';

export type ExtractedTimeEvidence = {
  timeHint: 'dawn' | 'morning' | 'afternoon' | 'sunset' | 'evening' | 'night' | 'night_market';
  source: 'uploaded_inspiration' | 'reservation' | 'ticket';
  date: string | null;
  startLocal: string | null;
  endLocal: string | null;
  evidenceRef: string;
  excerpt: string;
};

const TIME_PATTERNS: Array<{
  timeHint: ExtractedTimeEvidence['timeHint'];
  pattern: RegExp;
}> = [
  { timeHint: 'night_market', pattern: /夜市|夜宵|宵夜/u },
  { timeHint: 'dawn', pattern: /日出|黎明|清晨|凌晨/u },
  { timeHint: 'sunset', pattern: /日落|落日|夕阳|傍晚拍照/u },
  { timeHint: 'night', pattern: /深夜|夜景|晚上|夜间/u },
  { timeHint: 'evening', pattern: /傍晚|晚餐/u },
  { timeHint: 'morning', pattern: /早上|上午|早餐/u },
  { timeHint: 'afternoon', pattern: /下午|午后/u },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(':').map(Number);
  const total = hour! * 60 + minute! + minutes;
  if (total >= 24 * 60) return null;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function hintForTime(time: string): ExtractedTimeEvidence['timeHint'] {
  const hour = Number(time.slice(0, 2));
  if (hour < 7) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 19) return 'sunset';
  if (hour < 21) return 'evening';
  return 'night';
}

function extractDate(content: string, referenceDate: Date) {
  const full = /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/u.exec(content);
  if (full) return `${full[1]}-${pad(Number(full[2]))}-${pad(Number(full[3]))}`;
  const partial = /(\d{1,2})月(\d{1,2})日/u.exec(content);
  if (!partial) return null;
  let year = referenceDate.getUTCFullYear();
  const month = Number(partial[1]);
  const day = Number(partial[2]);
  const candidate = Date.UTC(year, month - 1, day);
  const today = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  if (candidate < today - 30 * 86_400_000) year += 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function extractTimeEvidence(
  post: Pick<XhsFetchedPost, 'title' | 'text'>,
  sourceUrl: string,
  referenceDate = new Date(),
): ExtractedTimeEvidence[] {
  const content = `${post.title}\n${post.text}`;
  const seen = new Set<ExtractedTimeEvidence['timeHint']>();
  const evidence: ExtractedTimeEvidence[] = [];
  const exactTime =
    /(?:(上午|下午|中午|午夜|凌晨|早上|晚上)\s*)?([01]?\d|2[0-3])[:：]([0-5]\d)/u.exec(content);
  let exactHour = exactTime ? Number(exactTime[2]) : null;
  const meridiem = exactTime?.[1];
  if (exactHour !== null) {
    if (['下午', '中午', '晚上'].includes(meridiem ?? '') && exactHour < 12) exactHour += 12;
    if (['上午', '早上', '凌晨', '午夜'].includes(meridiem ?? '') && exactHour === 12) {
      exactHour = 0;
    }
  }
  const startLocal = exactTime ? `${pad(exactHour!)}:${exactTime[3]}` : null;
  const source = /门票|票务|票根/u.test(content)
    ? 'ticket'
    : /预约|预订/u.test(content)
      ? 'reservation'
      : 'uploaded_inspiration';
  const date = extractDate(content, referenceDate);
  if (startLocal && source !== 'uploaded_inspiration') {
    const timeHint = hintForTime(startLocal);
    evidence.push({
      timeHint,
      source,
      date,
      startLocal,
      endLocal: addMinutes(startLocal, 120),
      evidenceRef: `xhs:${createHash('sha256')
        .update(`${sourceUrl}:${source}:${date ?? ''}:${startLocal}`)
        .digest('hex')}`,
      excerpt: exactTime![0],
    });
    seen.add(timeHint);
  }
  for (const entry of TIME_PATTERNS) {
    const match = entry.pattern.exec(content);
    if (!match || seen.has(entry.timeHint)) continue;
    seen.add(entry.timeHint);
    evidence.push({
      timeHint: entry.timeHint,
      source: 'uploaded_inspiration',
      date: null,
      startLocal: null,
      endLocal: null,
      evidenceRef: `xhs:${createHash('sha256')
        .update(`${sourceUrl}:${entry.timeHint}:${match[0]}`)
        .digest('hex')}`,
      excerpt: match[0],
    });
  }
  return evidence;
}
