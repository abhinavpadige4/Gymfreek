import { describe, expect, it } from 'vitest';
import { buildActivityDays, currentDayStreak, dayKeyUTC } from './activity';

const D = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('activity buckets', () => {
  it('keys UTC days and buckets counts oldest-first at fixed length', () => {
    expect(dayKeyUTC(D('2026-09-30'))).toBe('2026-09-30');
    const days = buildActivityDays(
      [D('2026-09-30'), D('2026-09-30'), D('2026-09-29')],
      1,
      D('2026-09-30'),
    );
    expect(days).toHaveLength(7);
    expect(days[5]).toEqual({ dateKey: '2026-09-29', count: 1 });
    expect(days[6]).toEqual({ dateKey: '2026-09-30', count: 2 });
    expect(days[0]).toEqual({ dateKey: '2026-09-24', count: 0 });
  });

  it('counts consecutive-day streaks ending today or yesterday', () => {
    const now = D('2026-09-30');
    expect(currentDayStreak([D('2026-09-30'), D('2026-09-29'), D('2026-09-28')], now)).toBe(3);
    expect(currentDayStreak([D('2026-09-29'), D('2026-09-28')], now)).toBe(2);
    expect(currentDayStreak([D('2026-09-27')], now)).toBe(0);
    expect(currentDayStreak([], now)).toBe(0);
  });
});
