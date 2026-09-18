import { describe, expect, it } from 'vitest';
import { advanceEnrollment } from './challenge-progress';

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
