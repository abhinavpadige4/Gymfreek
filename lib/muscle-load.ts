// Per-period muscle-load aggregation for the HumanBodyHeatmap. Folds gym
// sets and classified challenge results into TODAY / 7D / 30D / ALL buckets
// with sets, reps, effective volume and a 0-100 intensity per muscle group.
// Intensity is sets relative to the (personal or default) MRV scaled to the
// period length, so every range reads on the same heat ramp. Display-only.

import type { HeatmapData, HeatPeriod, MuscleExercises, MuscleStat } from '@/components/fitness/HumanBodyHeatmap/muscleData';
import { isCardioSet } from '@/lib/cardio';
import { classifyChallengeExercise, challengeResultSets } from '@/lib/muscle-map';
import type { MuscleGroup } from '@/lib/prisma-client';
import { effectiveWeight, resolveVolumeBand } from '@/lib/stats';

export interface LoadSetInput {
  muscleGroup: MuscleGroup;
  exerciseName: string;
  reps: number;
  /** Added load in kg (0 for bodyweight moves). */
  weight: number;
  usesBodyweight: boolean;
  isWarmup: boolean;
  durationSec: number | null;
  at: Date;
}

export interface LoadChallengeInput {
  exerciseName: string;
  reps: number;
  at: Date;
}

interface Accumulator {
  sets: number;
  reps: number;
  volume: number;
  exercises: Map<string, number>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function periodStart(period: HeatPeriod, now: number): number {
  if (period === 'TODAY') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === '7D') return now - 7 * DAY_MS;
  if (period === '30D') return now - 30 * DAY_MS;
  return 0;
}

// MRV-scaled divisor per period: a full-MRV week reads ~100 in every range.
// A single day rarely carries a week of work, so TODAY benchmarks against
// half a weekly MRV (a big ~10-set day still reads hot).
function periodDivisor(period: HeatPeriod, mrv: number): number {
  if (period === 'TODAY') return Math.max(1, mrv * 0.5);
  if (period === '7D') return Math.max(1, mrv);
  if (period === '30D') return Math.max(1, mrv * (30 / 7));
  return Math.max(1, mrv * 12);
}

function toStat(
  acc: Accumulator | undefined,
  mrv: number,
  divisor: number,
): MuscleStat {
  if (!acc) return { intensity: 0, reps: 0, sets: 0, volume: 0 };
  return {
    intensity: Math.max(0, Math.min(100, Math.round((acc.sets / divisor) * 100))),
    reps: acc.reps,
    sets: acc.sets,
    volume: Math.round(acc.volume),
  };
}

export function buildHeatmapData(input: {
  gymSets: LoadSetInput[];
  challengeResults: LoadChallengeInput[];
  bodyweight: number | null;
  targets?: Record<string, { mev: number; mrv: number }>;
  now?: number;
}): HeatmapData {
  const { gymSets, challengeResults, bodyweight, targets, now = Date.now() } = input;
  const out = {} as HeatmapData;
  const periods: readonly HeatPeriod[] = ['TODAY', '7D', '30D', 'ALL'];

  for (const period of periods) {
    const start = periodStart(period, now);
    const accs = new Map<MuscleGroup, Accumulator>();
    const acc = (group: MuscleGroup): Accumulator => {
      let a = accs.get(group);
      if (!a) {
        a = { sets: 0, reps: 0, volume: 0, exercises: new Map() };
        accs.set(group, a);
      }
      return a;
    };

    for (const s of gymSets) {
      // Same working-set convention as the weekly pipeline: no warmups,
      // no cardio rows.
      if (s.isWarmup || isCardioSet(s) || s.at.getTime() < start || s.reps <= 0) continue;
      const a = acc(s.muscleGroup);
      a.sets += 1;
      a.reps += s.reps;
      a.volume += effectiveWeight(s.weight, s.usesBodyweight, bodyweight) * s.reps;
      a.exercises.set(s.exerciseName, (a.exercises.get(s.exerciseName) ?? 0) + s.reps);
    }

    for (const r of challengeResults) {
      if (r.at.getTime() < start) continue;
      const sets = challengeResultSets(r.reps);
      if (sets <= 0) continue;
      const groups = classifyChallengeExercise(r.exerciseName);
      if (groups.length === 0) continue;
      // One completed move spreads its rounds as working sets across every
      // muscle it trains (same ~10-reps-per-set reading as the weekly map).
      for (const group of groups) {
        const a = acc(group);
        a.sets += sets;
        a.reps += r.reps;
        a.exercises.set(r.exerciseName, (a.exercises.get(r.exerciseName) ?? 0) + r.reps);
      }
    }

    const groups = {} as Record<MuscleGroup, MuscleStat>;
    const exercises = {} as Record<MuscleGroup, MuscleExercises[]>;
    for (const [group, a] of accs) {
      const band = resolveVolumeBand(group, targets);
      groups[group] = toStat(a, band.mrv, periodDivisor(period, band.mrv));
      exercises[group] = [...a.exercises.entries()]
        .map(([name, reps]) => ({ name, reps }))
        .sort((x, y) => y.reps - x.reps)
        .slice(0, 3);
    }
    out[period] = { groups, exercises };
  }
  return out;
}
