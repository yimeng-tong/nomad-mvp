import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractTimeEvidence } from './evidence.js';

describe('ingest time evidence extraction', () => {
  it('extracts strong time hints deterministically without duplicating a hint', () => {
    const first = extractTimeEvidence(
      {
        title: '厦门日出和夜市路线',
        text: '清晨看日出，晚上去八市吃夜宵。',
      },
      'https://www.xiaohongshu.com/explore/example',
    );
    const second = extractTimeEvidence(
      {
        title: '厦门日出和夜市路线',
        text: '清晨看日出，晚上去八市吃夜宵。',
      },
      'https://www.xiaohongshu.com/explore/example',
    );
    assert.deepEqual(first, second);
    assert.deepEqual(first.map((item) => item.timeHint), ['night_market', 'dawn', 'night']);
    assert.equal(new Set(first.map((item) => item.timeHint)).size, first.length);
  });

  it('does not invent a time constraint when the content has no strong clue', () => {
    assert.deepEqual(
      extractTimeEvidence(
        { title: '厦门散步路线', text: '沿海边慢慢走，路线很舒服。' },
        'https://www.xiaohongshu.com/explore/no-time',
      ),
      [],
    );
  });

  it('extracts ticket date and exact local time into a hard evidence window', () => {
    const evidence = extractTimeEvidence(
      { title: '厦门预约', text: '已预约 8月2日 10:00 的鼓浪屿门票。' },
      'https://www.xiaohongshu.com/explore/ticket',
      new Date('2026-07-27T00:00:00.000Z'),
    )[0]!;
    assert.deepEqual(
      {
        source: evidence.source,
        date: evidence.date,
        startLocal: evidence.startLocal,
        endLocal: evidence.endLocal,
        timeHint: evidence.timeHint,
      },
      {
        source: 'ticket',
        date: '2026-08-02',
        startLocal: '10:00',
        endLocal: '12:00',
        timeHint: 'morning',
      },
    );
  });

  it('normalizes Chinese twelve-hour time and does not clamp a cross-day window', () => {
    const cases = [
      ['上午 12:15', '00:15', '02:15'],
      ['下午 3:00', '15:00', '17:00'],
      ['中午 12:00', '12:00', '14:00'],
      ['午夜 12:30', '00:30', '02:30'],
      ['晚上 11:30', '23:30', null],
    ] as const;
    for (const [label, startLocal, endLocal] of cases) {
      const evidence = extractTimeEvidence(
        { title: '预约', text: `已预约 ${label} 的门票` },
        `https://www.xiaohongshu.com/explore/${encodeURIComponent(label)}`,
        new Date('2026-07-27T00:00:00.000Z'),
      )[0]!;
      assert.equal(evidence.startLocal, startLocal);
      assert.equal(evidence.endLocal, endLocal);
    }
  });
});
