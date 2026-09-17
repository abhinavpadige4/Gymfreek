// Exercise registry: name -> analyzer. Challenge code sends
// { exercise, targetReps, rounds } and never touches MediaPipe directly.
import { SquatAnalyzer } from './squat';

export interface ExerciseAnalyzer {
  reset(): void;
  summary(): {
    totalReps: number;
    goodReps: number;
    badReps: number;
    averageScore: number;
    issues: Record<string, number>;
  };
}

export function createAnalyzer(exercise: string): SquatAnalyzer | null {
  // ponytail: squat first per spec; pushup/lunge/etc plug in here one by one.
  if (exercise.trim().toLowerCase() === 'squat') return new SquatAnalyzer();
  return null;
}

export const SUPPORTED_EXERCISES = ['squat'] as const;
