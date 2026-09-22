import { describe, expect, it } from 'vitest';
import { buildExerciseReadiness } from './exercise-readiness';
import { EXERCISE_CATALOG } from './exercise-catalog';

describe('buildExerciseReadiness', () => {
  it('covers every catalog entry with a READY verdict', () => {
    const rows = buildExerciseReadiness(new Map());
    expect(rows).toHaveLength(EXERCISE_CATALOG.length);
    for (const row of rows) {
      expect(row.ready).toBe((row.hasPhoto || row.hasFrames) && row.hasCue);
    }
  });

  it('marks framed entries with cues ready without uploads', () => {
    const rows = buildExerciseReadiness(new Map());
    const goblet = rows.find((r) => r.name === 'Kettlebell goblet squats with pause');
    expect(goblet?.hasFrames).toBe(true);
    expect(goblet?.ready).toBe(true);
  });

  it('marks photo-less, frameless entries as needing media', () => {
    const rows = buildExerciseReadiness(new Map());
    const burpee = rows.find((r) => r.name === 'Full chest-to-deck burpees');
    expect(burpee?.hasPhoto).toBe(false);
    expect(burpee?.hasFrames).toBe(false);
    expect(burpee?.ready).toBe(false);
  });

  it('honors uploads and passes video through as a bonus', () => {
    const rows = buildExerciseReadiness(
      new Map([['Full chest-to-deck burpees', { hasPhoto: true, hasVideo: true }]]),
    );
    const burpee = rows.find((r) => r.name === 'Full chest-to-deck burpees');
    expect(burpee?.hasPhoto).toBe(true);
    expect(burpee?.hasVideo).toBe(true);
    expect(burpee?.ready).toBe(true);
  });
});
