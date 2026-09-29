import { describe, expect, it } from 'vitest';
import { advanceEnrollment, bestFor, nextUnlockAt, streakFor } from './challenge-progress';

describe('advanceEnrollment', () => {
  it('moves from day 1 to day 2 on first completion', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 1 }, 1, 100)).toEqual({
      status: 'ACTIVE',
      currentDay: 2,
    });
  });

  it('ignores a repeat of an already-passed day', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 5 }, 3, 100)).toBeNull();
  });

  it('jumps forward when completing ahead of the current day', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 2 }, 5, 100)).toEqual({
      status: 'ACTIVE',
      currentDay: 6,
    });
  });

  it('completes the challenge on the last day', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 100 }, 100, 100)).toEqual({
      status: 'COMPLETED',
      currentDay: 100,
    });
  });

  it('completes from behind when the last day finishes early', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 40 }, 100, 100)).toEqual({
      status: 'COMPLETED',
      currentDay: 100,
    });
  });

  it('never advances PENDING or CANCELLED enrollments', () => {
    expect(advanceEnrollment({ status: 'PENDING', currentDay: 1 }, 1, 100)).toBeNull();
    expect(advanceEnrollment({ status: 'CANCELLED', currentDay: 1 }, 1, 100)).toBeNull();
  });

  it('rejects out-of-range days', () => {
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 1 }, 0, 100)).toBeNull();
    expect(advanceEnrollment({ status: 'ACTIVE', currentDay: 1 }, 101, 100)).toBeNull();
  });
});

describe('streakFor', () => {
  it('starts the streak on the first finish', () => {
    expect(streakFor(null, 0, new Date('2026-01-01T10:00:00Z'))).toEqual({
      resetToDayOne: false,
      streakCount: 1,
    });
  });

  it('increments on the next UTC day', () => {
    expect(
      streakFor(new Date('2026-01-01T23:00:00Z'), 3, new Date('2026-01-02T01:00:00Z')),
    ).toEqual({ resetToDayOne: false, streakCount: 4 });
  });

  it('resets to day one after a missed UTC day, history untouched', () => {
    expect(
      streakFor(new Date('2026-01-01T10:00:00Z'), 5, new Date('2026-01-03T10:00:00Z')),
    ).toEqual({ resetToDayOne: true, streakCount: 1 });
  });
});

describe('nextUnlockAt', () => {
  it('unlocks the next day at midnight UTC', () => {
    expect(nextUnlockAt(1, 100, new Date('2026-01-01T15:00:00Z'))).toEqual(
      new Date('2026-01-02T00:00:00Z'),
    );
  });

  it('returns null after the last day', () => {
    expect(nextUnlockAt(100, 100)).toBeNull();
  });
});

describe('bestFor', () => {
  it('picks max reps, tie-break higher score', () => {
    expect(
      bestFor([
        { reps: 80, averageScore: 90 },
        { reps: 100, averageScore: 70 },
        { reps: 100, averageScore: 85 },
      ]),
    ).toEqual({ reps: 100, averageScore: 85 });
  });

  it('returns null with no history', () => {
    expect(bestFor([])).toBeNull();
  });
});
