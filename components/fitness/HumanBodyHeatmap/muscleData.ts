// Data contract for the HumanBodyHeatmap. The SVG never holds workout values;
// it reads everything from this structure, which the /progress page builds
// from gym sets + challenge results. Shaped for a future GET
// /api/user/muscle-load response: per-period, per-muscle-group numbers.

import type { MuscleGroup } from '@/lib/prisma-client';

export type HeatPeriod = 'TODAY' | '7D' | '30D' | 'ALL';

export const HEAT_PERIODS: readonly HeatPeriod[] = ['TODAY', '7D', '30D', 'ALL'];

export interface MuscleStat {
  /** 0-100 training intensity for the period. */
  intensity: number;
  reps: number;
  sets: number;
  /** Load-volume in kg (gym work only; bodyweight challenge work carries none). */
  volume: number;
}

export interface MuscleExercises {
  name: string;
  reps: number;
}

export interface HeatPeriodData {
  groups: Partial<Record<MuscleGroup, MuscleStat>>;
  exercises: Partial<Record<MuscleGroup, MuscleExercises[]>>;
}

export type HeatmapData = Record<HeatPeriod, HeatPeriodData>;

export type MuscleFilter = 'ALL' | 'UPPER' | 'CORE' | 'LOWER';

export type RecoveryStatus = 'RECOVERED' | 'RECOVERING' | 'HIGH LOAD' | 'UNDERTRAINED';

const EMPTY_STAT: MuscleStat = { intensity: 0, reps: 0, sets: 0, volume: 0 };

export function statFor(data: HeatPeriodData | undefined, group: MuscleGroup): MuscleStat {
  return data?.groups[group] ?? EMPTY_STAT;
}

// Heat ramp for a 0-100 intensity. Clamped; out-of-range input snaps to the
// nearest end so callers never have to sanitize.
export function getHeatColor(value: number): string {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  if (v <= 20) return '#263238';
  if (v <= 40) return '#4CAF50';
  if (v <= 60) return '#FFC107';
  if (v <= 80) return '#FF9800';
  return '#FF3D00';
}

// Workout/recovery analytics only, never medical guidance.
export function recoveryFor(intensity: number): { status: RecoveryStatus; recovery: number } {
  if (intensity <= 0) return { status: 'UNDERTRAINED', recovery: 100 };
  if (intensity >= 81) return { status: 'HIGH LOAD', recovery: Math.max(0, 100 - intensity) };
  if (intensity >= 41) return { status: 'RECOVERING', recovery: Math.max(0, 100 - intensity) };
  return { status: 'RECOVERED', recovery: Math.max(0, 100 - intensity) };
}

export function formatVolume(volumeKg: number): string {
  if (volumeKg >= 1000) return `${(volumeKg / 1000).toFixed(1)}K`;
  return `${Math.round(volumeKg)}`;
}
