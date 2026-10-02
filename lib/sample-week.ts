// Sample training week for the admin panel: a deterministic 4-session plan
// spanning the last 7 days that lights up the progress muscle map across
// every band (optimal, below-MEV, untrained). Pure data, no DB - the admin
// API route writes it. Gym sessions only, never challenge sessions, so the
// leaderboard is untouched.

import {
  EquipmentType,
  ExerciseCategory,
  type MuscleGroup,
} from '@/lib/prisma-client';

export interface SampleExerciseDef {
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  usesBodyweight: boolean;
  equipmentType: EquipmentType;
}

export interface SampleSetDef {
  exerciseName: string;
  weight: number;
  reps: number;
  durationSec?: number;
}

export interface SampleSessionDef {
  // Days before `now` the session took place (0 = today).
  daysAgo: number;
  sets: SampleSetDef[];
}

function lift(name: string, weight: number, reps: number, sets: number): SampleSetDef[] {
  return Array.from({ length: sets }, () => ({ exerciseName: name, weight, reps }));
}

const EXERCISES: SampleExerciseDef[] = [
  { name: 'Bench Press', muscleGroup: 'CHEST', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Push-Up', muscleGroup: 'CHEST', category: ExerciseCategory.COMPOUND, usesBodyweight: true, equipmentType: EquipmentType.BODYWEIGHT },
  { name: 'Overhead Press', muscleGroup: 'SHOULDERS_FRONT', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Lateral Raise', muscleGroup: 'SHOULDERS_LATERAL', category: ExerciseCategory.ISOLATION, usesBodyweight: false, equipmentType: EquipmentType.DUMBBELL },
  { name: 'Tricep Pushdown', muscleGroup: 'TRICEPS', category: ExerciseCategory.ISOLATION, usesBodyweight: false, equipmentType: EquipmentType.CABLE },
  { name: 'Barbell Row', muscleGroup: 'BACK_WIDTH', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Bicep Curl', muscleGroup: 'BICEPS', category: ExerciseCategory.ISOLATION, usesBodyweight: false, equipmentType: EquipmentType.DUMBBELL },
  { name: 'Plank', muscleGroup: 'ABS', category: ExerciseCategory.ISOLATION, usesBodyweight: true, equipmentType: EquipmentType.BODYWEIGHT },
  { name: 'Back Squat', muscleGroup: 'QUADS', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Romanian Deadlift', muscleGroup: 'HAMSTRINGS', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Hip Thrust', muscleGroup: 'GLUTES', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.BARBELL },
  { name: 'Standing Calf Raise', muscleGroup: 'CALVES', category: ExerciseCategory.ISOLATION, usesBodyweight: false, equipmentType: EquipmentType.MACHINE },
  { name: 'Walking Lunge', muscleGroup: 'QUADS', category: ExerciseCategory.COMPOUND, usesBodyweight: false, equipmentType: EquipmentType.DUMBBELL },
];

// Weekly set totals this plan produces: CHEST 12 and QUADS 11 land in range,
// the rest read below MEV, REAR DELTS / FOREARMS / LOWER BACK stay untrained.
export const SAMPLE_EXERCISES: readonly SampleExerciseDef[] = EXERCISES;

export function buildSampleWeek(): SampleSessionDef[] {
  return [
    {
      daysAgo: 6,
      sets: [
        ...lift('Bench Press', 60, 10, 5),
        ...lift('Push-Up', 0, 15, 3),
        ...lift('Overhead Press', 40, 8, 3),
        ...lift('Lateral Raise', 10, 12, 3),
        ...lift('Tricep Pushdown', 25, 12, 3),
      ],
    },
    {
      daysAgo: 4,
      sets: [
        ...lift('Barbell Row', 70, 8, 4),
        ...lift('Bicep Curl', 15, 10, 3),
        ...lift('Plank', 0, 1, 3).map((s) => ({ ...s, durationSec: 60 })),
      ],
    },
    {
      daysAgo: 2,
      sets: [
        ...lift('Back Squat', 80, 8, 5),
        ...lift('Romanian Deadlift', 90, 8, 3),
        ...lift('Hip Thrust', 100, 10, 3),
        ...lift('Standing Calf Raise', 50, 12, 3),
        ...lift('Walking Lunge', 20, 10, 3),
      ],
    },
    {
      daysAgo: 0,
      sets: [
        ...lift('Bench Press', 62.5, 8, 4),
        ...lift('Barbell Row', 72.5, 8, 3),
        ...lift('Back Squat', 82.5, 8, 3),
      ],
    },
  ];
}
