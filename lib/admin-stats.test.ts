import { describe, expect, it } from 'vitest';
import { activityBuckets, volumeBuckets } from './admin-stats';

const NOW = new Date('2026-09-25T12:00:00Z');

describe('admin-stats', () => {
  it('buckets the last 14 days oldest-first', () => {
    const days = activityBuckets(
      [new Date('2026-09-25T08:00:00Z'), new Date('2026-09-25T09:00:00Z')],
      [new Date('2026-09-20T10:00:00Z')],
      [],
      14,
      NOW,
    );
    expect(days).toHaveLength(14);
    expect(days[13]).toMatchObject({ sessions: 2, enrollments: 0, payments: 0 });
    expect(days[8]).toMatchObject({ sessions: 0, enrollments: 1, payments: 0 });
    expect(days[0]?.sessions).toBe(0);
  });

  it('ignores future timestamps outside the window', () => {
    const days = activityBuckets(
      [new Date('2026-10-01T08:00:00Z')],
      [],
      [],
      14,
      NOW,
    );
    expect(days.every((d) => d.sessions === 0)).toBe(true);
  });

  it('sums weekly sessions and volume by ISO week', () => {
    const weeks = volumeBuckets(
      [
        { startedAt: new Date('2026-09-22T10:00:00Z'), weight: 100, reps: 5 },
        { startedAt: new Date('2026-09-24T10:00:00Z'), weight: 100, reps: 5 },
        { startedAt: new Date('2026-09-24T11:00:00Z'), weight: 50, reps: 10 },
      ],
      2,
      NOW,
    );
    expect(weeks).toHaveLength(2);
    const current = weeks[1]!;
    expect(current.sessions).toBe(2);
    expect(current.volume).toBe(1500);
    expect(weeks[0]).toMatchObject({ sessions: 0, volume: 0 });
  });
});
