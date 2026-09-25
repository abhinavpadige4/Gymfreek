import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth';

const profile = {
  sex: 'MALE',
  heightCm: 178,
  bodyweight: 75,
  goal: 'HYPERTROPHY',
  weeklyFrequency: 3,
  experienceLevel: 'BEGINNER',
} as const;

describe('registerSchema', () => {
  it('accepts a valid registration with full profile', () => {
    const r = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'longenough',
      displayName: 'Al',
      ...profile,
      dateOfBirth: '1990-01-01',
      medicalConditions: 'None',
      injuries: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a password shorter than 8 chars', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: 'short', ...profile }).success,
    ).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(
      registerSchema.safeParse({ email: 'nope', password: 'longenough', ...profile }).success,
    ).toBe(false);
  });

  it('makes displayName optional', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: 'longenough', ...profile }).success,
    ).toBe(true);
  });

  it('requires the training profile, keeps health history optional', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: 'longenough' }).success,
    ).toBe(false);
    const r = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'longenough',
      ...profile,
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown enum values and future birth dates', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: 'longenough', ...profile, sex: 'X' })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        email: 'a@b.com',
        password: 'longenough',
        ...profile,
        dateOfBirth: '2999-01-01',
      }).success,
    ).toBe(false);
  });
});
