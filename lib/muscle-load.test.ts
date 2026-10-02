import { describe, expect, it } from 'vitest';
import { getHeatColor, recoveryFor } from '@/components/fitness/HumanBodyHeatmap/muscleData';
import { buildHeatmapData } from './muscle-load';

const GYM = [
  { muscleGroup: 'CHEST', exerciseName: 'Bench Press', reps: 10, weight: 60, usesBodyweight: false, isWarmup: false, durationSec: null, at: new Date('2026-09-28T10:00:00Z') },
  { muscleGroup: 'CHEST', exerciseName: 'Bench Press', reps: 10, weight: 60, usesBodyweight: false, isWarmup: false, durationSec: null, at: new Date('2026-09-28T10:00:00Z') },
] as const;

describe('getHeatColor', () => {
  it('walks the five-stop ramp and clamps out-of-range input', () => {
    expect(getHeatColor(0)).toBe('#263238');
    expect(getHeatColor(20)).toBe('#263238');
    expect(getHeatColor(21)).toBe('#4CAF50');
    expect(getHeatColor(40)).toBe('#4CAF50');
    expect(getHeatColor(41)).toBe('#FFC107');
    expect(getHeatColor(60)).toBe('#FFC107');
    expect(getHeatColor(61)).toBe('#FF9800');
    expect(getHeatColor(80)).toBe('#FF9800');
    expect(getHeatColor(81)).toBe('#FF3D00');
    expect(getHeatColor(100)).toBe('#FF3D00');
    expect(getHeatColor(-5)).toBe('#263238');
    expect(getHeatColor(250)).toBe('#FF3D00');
  });
});

describe('recoveryFor', () => {
  it('labels bands without medical claims', () => {
    expect(recoveryFor(0).status).toBe('UNDERTRAINED');
    expect(recoveryFor(20).status).toBe('RECOVERED');
    expect(recoveryFor(60).status).toBe('RECOVERING');
    expect(recoveryFor(90).status).toBe('HIGH LOAD');
  });
});

describe('buildHeatmapData', () => {
  const NOW = new Date('2026-10-02T12:00:00Z').getTime();

  it('buckets gym sets into every period with volume and top exercises', () => {
    const data = buildHeatmapData({
      gymSets: [...GYM],
      challengeResults: [],
      bodyweight: null,
      now: NOW,
    });
    // 2 sets vs default MRV 20 -> 7D reads 10%.
    expect(data['7D'].groups.CHEST).toMatchObject({ sets: 2, reps: 20, volume: 1200 });
    expect(data['7D'].groups.CHEST!.intensity).toBe(10);
    expect(data['7D'].exercises.CHEST).toEqual([{ name: 'Bench Press', reps: 20 }]);
    // Same 2 sets are inside TODAY too (same calendar day as NOW in UTC? no:
    // Sep 28 is older than Oct 2 midnight) -> TODAY empty.
    expect(data['TODAY'].groups.CHEST).toBeUndefined();
    expect(data['30D'].groups.CHEST!.sets).toBe(2);
    expect(data['ALL'].groups.CHEST!.sets).toBe(2);
  });

  it('attributes challenge moves by keyword with round-derived sets', () => {
    const data = buildHeatmapData({
      gymSets: [],
      challengeResults: [
        { exerciseName: 'Strict Hand-Release Push-Ups', reps: 100, at: new Date('2026-10-01T10:00:00Z') },
        { exerciseName: 'Mystery Dance Break', reps: 100, at: new Date('2026-10-01T10:00:00Z') },
      ],
      bodyweight: null,
      now: NOW,
    });
    // 100 reps -> 10 sets shared across CHEST + TRICEPS.
    expect(data['7D'].groups.CHEST).toMatchObject({ sets: 10, reps: 100 });
    expect(data['7D'].groups.TRICEPS).toMatchObject({ sets: 10, reps: 100 });
    // Unknown moves never paint.
    expect(data['7D'].exercises.CHEST).toEqual([
      { name: 'Strict Hand-Release Push-Ups', reps: 100 },
    ]);
  });

  it('skips warmup and cardio rows like the weekly pipeline', () => {
    const base = {
      muscleGroup: 'CHEST',
      exerciseName: 'Bench Press',
      reps: 10,
      weight: 60,
      usesBodyweight: false,
      at: new Date('2026-10-01T10:00:00Z'),
    } as const;
    const data = buildHeatmapData({
      gymSets: [
        { ...base, isWarmup: true, durationSec: null },
        { ...base, isWarmup: false, durationSec: 600 },
      ],
      challengeResults: [],
      bodyweight: null,
      now: NOW,
    });
    expect(data['ALL'].groups.CHEST).toBeUndefined();
  });

  it('normalizes intensity against personal MRV bands', () => {    const data = buildHeatmapData({
      gymSets: [...GYM],
      challengeResults: [],
      bodyweight: null,
      targets: { CHEST: { mev: 4, mrv: 8 } },
      now: NOW,
    });
    // 2 sets vs personal MRV 8 -> 25%.
    expect(data['7D'].groups.CHEST!.intensity).toBe(25);
  });
});
