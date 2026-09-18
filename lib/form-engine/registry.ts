// Exercise registry: name -> analyzer. Challenge code sends
// { exercise, targetReps, rounds } and never touches MediaPipe directly.
import type { Point } from './angles';
import { SquatAnalyzer } from './squat';
import { PushupAnalyzer } from './pushup';

export interface ExerciseAnalyzer {
  reset(): void;
  update(lm: Point[], now: number): { rep: number; issues: string[] } | null;
  summary(): {
    totalReps: number;
    goodReps: number;
    badReps: number;
    averageScore: number;
    issues: Record<string, number>;
  };
}

export function createAnalyzer(exercise: string): SquatAnalyzer | PushupAnalyzer | null {
  // ponytail: one exercise at a time per spec; lunge/plank/etc plug in here.
  const key = exercise.trim().toLowerCase().replace(/[-_\s]+/g, '');
  if (key === 'squat') return new SquatAnalyzer();
  if (key === 'pushup') return new PushupAnalyzer();
  return null;
}

export const SUPPORTED_EXERCISES = ['squat', 'pushup'] as const;
