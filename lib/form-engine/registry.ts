// Exercise registry: name -> analyzer. Challenge code sends
// { exercise, targetReps, rounds } and never touches MediaPipe directly.
import type { Point } from './angles';
import { SquatAnalyzer } from './squat';
import { PushupAnalyzer } from './pushup';
import { HingeAnalyzer } from './hinge';
import { PressAnalyzer } from './press';

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

function normalize(name: string): string {
  return name.trim().toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '');
}

// Both counters read the MIDPOINT of the left/right joints, so they only
// count bilateral symmetric patterns. Single-leg work (lunges, split
// squats, step-ups) averages a bent leg with a straight one and never
// reaches the bottom threshold, so it stays unmapped rather than counting
// wrong. Squat-pattern keywords cover the blueprint names, the classic
// template lifts (Back Squat, Front Squat, ...) and user custom names.
// Single-leg markers: these patterns average a bent leg with a straight one
// and never reach the bottom threshold, so they stay unmapped even when the
// name contains a squat keyword (e.g. Bulgarian split squats).
const SINGLE_LEG_MARKERS = [
  'bulgarian',
  'split',
  'lunge',
  'singleleg',
  'stepup',
  'stepover',
  'pistol',
];

function isSingleLeg(normalized: string): boolean {
  return SINGLE_LEG_MARKERS.some((marker) => normalized.includes(marker));
}

function isSquatPattern(normalized: string): boolean {
  if (isSingleLeg(normalized)) return false;
  return normalized.includes('squat') || normalized.includes('thruster');
}

function isPushupPattern(normalized: string): boolean {
  return normalized.includes('pushup') || normalized.includes('pressup');
}

// Hip-hinge family: swings, deadlifts, snatches. Same bilateral-midpoint
// math as the other counters; single-leg deadlifts stay unmapped like the
// other single-leg work. Checked after squat/pushup so overlapping names
// (push-up to snatch, clean to squat) keep their existing counter.
function isHingePattern(normalized: string): boolean {
  if (isSingleLeg(normalized)) return false;
  return (
    normalized.includes('swing') ||
    normalized.includes('deadlift') ||
    normalized.includes('hinge') ||
    normalized.includes('snatch')
  );
}

export function createAnalyzer(
  exercise: string,
): SquatAnalyzer | PushupAnalyzer | HingeAnalyzer | PressAnalyzer | null {
  const key = normalize(exercise);
  if (isSquatPattern(key)) return new SquatAnalyzer();
  if (isPushupPattern(key)) return new PushupAnalyzer();
  if (isHingePattern(key)) return new HingeAnalyzer();
  if (isPressPattern(key)) return new PressAnalyzer();
  return null;
}

// Press/row family: presses, rows, pullovers, curls. One elbow-cycle
// counter serves both directions (presses start bent, rows start open).
// Checked last so overlapping names keep their earlier counter.
function isPressPattern(normalized: string): boolean {
  return (
    normalized.includes('press') ||
    normalized.includes('row') ||
    normalized.includes('pullover') ||
    normalized.includes('curl')
  );
}

export const SUPPORTED_EXERCISES = ['squat', 'pushup', 'hinge', 'press'] as const;
