import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_DAY_CAP_SEC,
  isChallengeRecoveryDay,
  isValidAttempt,
  medicalBracket,
  needsMedicalRest,
  requiredRepsForDay,
  requiredTasksForDay,
  restFor,
} from './challenge-rules';

describe('challenge-rules', () => {
  it('caps a day at 55 minutes', () => {
    expect(CHALLENGE_DAY_CAP_SEC).toBe(3300);
    expect(isValidAttempt(3300)).toBe(true);
    expect(isValidAttempt(3301)).toBe(false);
    expect(isValidAttempt(null)).toBe(false);
  });

  it('gives 20s rest, 30s for medical cases', () => {
    expect(restFor(null)).toBe(20);
    expect(restFor('healthy')).toBe(20);
    expect(restFor('asthma history')).toBe(30);
    expect(needsMedicalRest('knee injury 2024')).toBe(true);
  });

  it('labels the leaderboard bracket', () => {
    expect(medicalBracket(null)).toBe('standard');
    expect(medicalBracket('cardiac issue')).toBe('extra-rest');
  });

  it('marks day 5 and 10 of each block as recovery', () => {
    expect(isChallengeRecoveryDay(5)).toBe(true);
    expect(isChallengeRecoveryDay(10)).toBe(true);
    expect(isChallengeRecoveryDay(95)).toBe(true);
    expect(isChallengeRecoveryDay(100)).toBe(true);
    expect(isChallengeRecoveryDay(1)).toBe(false);
    expect(isChallengeRecoveryDay(46)).toBe(false);
  });

  it('requires 6 tasks on recovery days, all tasks otherwise', () => {
    expect(requiredTasksForDay(5, 10)).toBe(6);
    expect(requiredTasksForDay(10, 10)).toBe(6);
    expect(requiredTasksForDay(6, 10)).toBe(10);
    expect(requiredRepsForDay(5, 10)).toBe(600);
    expect(requiredRepsForDay(6, 10)).toBe(1000);
    // Short days (free trial: 5 tasks) stay completable.
    expect(requiredTasksForDay(1, 5)).toBe(5);
    expect(requiredRepsForDay(1, 5)).toBe(500);
  });
});
