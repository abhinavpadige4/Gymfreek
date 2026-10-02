import { describe, expect, it } from 'vitest';
import { MUSCLE_REGIONS } from './muscle-map';
import { SAMPLE_EXERCISES, buildSampleWeek } from './sample-week';

describe('buildSampleWeek', () => {
  it('covers 4 sessions inside the last 7 days', () => {
    const plan = buildSampleWeek();
    expect(plan).toHaveLength(4);
    for (const s of plan) {
      expect(s.daysAgo).toBeGreaterThanOrEqual(0);
      expect(s.daysAgo).toBeLessThanOrEqual(7);
      expect(s.sets.length).toBeGreaterThan(0);
    }
  });

  it('references only known sample exercises with painted muscle groups', () => {
    const names = new Set(SAMPLE_EXERCISES.map((e) => e.name));
    for (const s of buildSampleWeek()) {
      for (const set of s.sets) {
        expect(names.has(set.exerciseName), set.exerciseName).toBe(true);
        expect(set.weight).toBeGreaterThanOrEqual(0);
        expect(set.reps).toBeGreaterThanOrEqual(1);
      }
    }
    for (const e of SAMPLE_EXERCISES) {
      expect(MUSCLE_REGIONS[e.muscleGroup], e.name).not.toBeNull();
    }
  });

  it('lands chest and quads in range with the rest below or untrained', () => {
    const byGroup = new Map<string, number>();
    const groupOf = new Map(SAMPLE_EXERCISES.map((e) => [e.name, e.muscleGroup]));
    for (const s of buildSampleWeek()) {
      for (const set of s.sets) {
        const g = groupOf.get(set.exerciseName)!;
        byGroup.set(g, (byGroup.get(g) ?? 0) + 1);
      }
    }
    // Default band is MEV 10 / MRV 20.
    expect(byGroup.get('CHEST')).toBe(12);
    expect(byGroup.get('QUADS')).toBe(11);
    expect(byGroup.get('BACK_WIDTH')).toBe(7);
    expect(byGroup.get('SHOULDERS_REAR') ?? 0).toBe(0);
    expect(byGroup.get('FOREARMS') ?? 0).toBe(0);
    expect(byGroup.get('LOWER_BACK') ?? 0).toBe(0);
  });
});
