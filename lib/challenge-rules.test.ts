import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_DAY_CAP_SEC,
  isValidAttempt,
  medicalBracket,
  needsMedicalRest,
  restFor,
} from './challenge-rules';

describe('challenge-rules', () => {
  it('caps a day at 25 minutes', () => {
    expect(CHALLENGE_DAY_CAP_SEC).toBe(1500);
    expect(isValidAttempt(1500)).toBe(true);
    expect(isValidAttempt(1501)).toBe(false);
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
});
