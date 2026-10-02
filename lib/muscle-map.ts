// Muscle heat map (issue #299): pure mapping from the weekly working-set
// counts (lib/stats.ts) to the body-silhouette regions the progress page
// paints. Display-only; never influences progression or coach logic.

import type { MuscleGroup } from '@/lib/prisma-client';
import { classifyWeeklySets, resolveVolumeBand, type VolumeBand } from '@/lib/stats';

export type BodyView = 'front' | 'back';

// How hot a region paints: untouched, below MEV, inside the MEV/MRV band, or
// above MRV. Mirrors classifyWeeklySets, with zero sets split out so an
// untrained muscle reads as absent rather than merely low.
export type HeatLevel = 'none' | 'low' | 'optimal' | 'high';

interface MuscleRegionMapping {
  view: BodyView;
  regionIds: readonly string[];
}

// Every muscle group paints one or more silhouette regions on one view.
// OTHER is the unclassified-import bucket and is never painted.
export const MUSCLE_REGIONS = {
  CHEST: { view: 'front', regionIds: ['chest-left', 'chest-right'] },
  BACK_WIDTH: { view: 'back', regionIds: ['lat-left', 'lat-right'] },
  BACK_THICKNESS: { view: 'back', regionIds: ['traps-mid'] },
  SHOULDERS_FRONT: { view: 'front', regionIds: ['delt-front-left', 'delt-front-right'] },
  SHOULDERS_LATERAL: { view: 'front', regionIds: ['delt-side-left', 'delt-side-right'] },
  SHOULDERS_REAR: { view: 'back', regionIds: ['delt-rear-left', 'delt-rear-right'] },
  BICEPS: { view: 'front', regionIds: ['biceps-left', 'biceps-right'] },
  TRICEPS: { view: 'back', regionIds: ['triceps-left', 'triceps-right'] },
  FOREARMS: { view: 'front', regionIds: ['forearm-left', 'forearm-right'] },
  QUADS: { view: 'front', regionIds: ['quad-left', 'quad-right'] },
  HAMSTRINGS: { view: 'back', regionIds: ['ham-left', 'ham-right'] },
  GLUTES: { view: 'back', regionIds: ['glute-left', 'glute-right'] },
  CALVES: { view: 'back', regionIds: ['calf-left', 'calf-right'] },
  ABS: { view: 'front', regionIds: ['abs'] },
  LOWER_BACK: { view: 'back', regionIds: ['lower-back'] },
  OTHER: null,
} as const satisfies Record<MuscleGroup, MuscleRegionMapping | null>;

// Derives the heat level for one muscle from its weekly working sets and the
// resolved MEV/MRV band (personal VolumeTarget or global defaults).
export function muscleHeat(sets: number, band: VolumeBand): HeatLevel {
  if (sets <= 0) return 'none';
  const zone = classifyWeeklySets(sets, band.mev, band.mrv);
  if (zone === 'BELOW_MEV') return 'low';
  if (zone === 'ABOVE_MRV') return 'high';
  return 'optimal';
}

export interface MuscleMapRegion {
  regionId: string;
  group: MuscleGroup;
  view: BodyView;
  level: HeatLevel;
  sets: number;
}

// Builds the serializable region list for one week of set counts. Groups with
// no sets still appear (level 'none') so the whole body always renders; the
// caller passes the same targets map the volume-landmarks card uses, so a
// personal band wins over the defaults identically in both views.
export function buildMuscleMap(
  weeklySets: Record<string, number>,
  targets?: Record<string, { mev: number; mrv: number }>,
): MuscleMapRegion[] {
  return (Object.keys(MUSCLE_REGIONS) as MuscleGroup[]).flatMap((group) => {
    const mapping = MUSCLE_REGIONS[group];
    if (!mapping) return [];
    const sets = weeklySets[group] ?? 0;
    const level = muscleHeat(sets, resolveVolumeBand(group, targets));
    return mapping.regionIds.map((regionId) => ({
      regionId,
      group,
      view: mapping.view,
      level,
      sets,
    }));
  });
}

// Challenge moves are free-text names (ChallengeTask/ExerciseResult carry no
// muscle link), so the progress page attributes them by keyword. First match
// wins: specific compounds before generic families. Unknown names return []
// and are skipped, never painted.
const CHALLENGE_PATTERNS: Array<{ match: RegExp; groups: MuscleGroup[] }> = [
  { match: /bridge/, groups: ['CHEST', 'GLUTES'] },
  { match: /renegade/, groups: ['BACK_WIDTH', 'TRICEPS'] },
  { match: /pullover/, groups: ['CHEST', 'BACK_WIDTH'] },
  { match: /high.pull/, groups: ['SHOULDERS_LATERAL', 'BACK_THICKNESS'] },
  { match: /halo/, groups: ['SHOULDERS_FRONT', 'QUADS'] },
  { match: /devil/, groups: ['CHEST', 'SHOULDERS_FRONT'] },
  { match: /spiderman/, groups: ['CHEST', 'ABS'] },
  { match: /up.down/, groups: ['ABS', 'TRICEPS'] },
  { match: /bulgarian/, groups: ['QUADS', 'GLUTES'] },
  { match: /snatch/, groups: ['HAMSTRINGS', 'GLUTES', 'SHOULDERS_FRONT'] },
  { match: /thruster/, groups: ['QUADS', 'SHOULDERS_FRONT'] },
  { match: /push press|overhead press|press overhead|overhead db walking/, groups: ['SHOULDERS_FRONT', 'TRICEPS'] },
  { match: /curl/, groups: ['BICEPS', 'QUADS'] },
  { match: /press|push.up|push-up|dip/, groups: ['CHEST', 'TRICEPS'] },
  { match: /row|pull.up|chin.up|\bpull\b/, groups: ['BACK_WIDTH', 'BICEPS'] },
  { match: /burpee/, groups: ['CHEST', 'QUADS'] },
  { match: /climber/, groups: ['ABS', 'QUADS'] },
  { match: /swing|hinge|deadlift|good morning/, groups: ['HAMSTRINGS', 'GLUTES'] },
  { match: /toe.tap|shuffle|tap/, groups: ['QUADS', 'CALVES'] },
  { match: /jump/, groups: ['QUADS', 'GLUTES', 'CALVES'] },
  { match: /squat|goblet|lunge/, groups: ['QUADS', 'GLUTES'] },
  { match: /sprawl/, groups: ['QUADS', 'ABS'] },
  { match: /drop|depth/, groups: ['QUADS', 'CALVES'] },
  { match: /step|box/, groups: ['QUADS', 'GLUTES'] },
  { match: /carry|farmer|suitcase/, groups: ['FOREARMS', 'ABS'] },
  { match: /march/, groups: ['QUADS', 'GLUTES'] },
  { match: /plank|hollow|twist/, groups: ['ABS'] },
  { match: /crawl/, groups: ['QUADS', 'SHOULDERS_FRONT'] },
];

export function classifyChallengeExercise(name: string): MuscleGroup[] {
  const lower = name.toLowerCase();
  return CHALLENGE_PATTERNS.find((p) => p.match.test(lower))?.groups ?? [];
}

// One bodyweight round of ~10 reps reads as one working set, capped at the
// 10-round circuit so a single day cannot exceed a full day of work.
export function challengeResultSets(reps: number): number {
  if (!Number.isFinite(reps) || reps <= 0) return 0;
  return Math.min(10, Math.max(1, Math.round(reps / 10)));
}
