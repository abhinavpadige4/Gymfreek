import { describe, expect, it } from 'vitest';
import type { Point } from './angles';
import { HingeAnalyzer } from './hinge';

// Synthetic side-view landmarks with an exact torso lean and knee angle.
// Same construction as the squat tests: hips fixed, shoulders offset by the
// lean, ankles placed for the knee angle.
function hlm(leanDeg: number, kneeDeg = 150): Point[] {
  const pts: Point[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  const t = ((180 - kneeDeg) * Math.PI) / 180;
  const lean = (leanDeg * Math.PI) / 180;
  const set = (i: number, x: number, y: number) => {
    pts[i] = { x, y, visibility: 1 };
  };
  set(11, 0.42 + 0.15 * Math.tan(lean), 0.15);
  set(12, 0.58 + 0.15 * Math.tan(lean), 0.15);
  set(23, 0.42, 0.3);
  set(24, 0.58, 0.3);
  set(25, 0.42, 0.6);
  set(26, 0.58, 0.6);
  const ax = 0.5 + 0.3 * Math.sin(t);
  const ay = 0.6 + 0.3 * Math.cos(t);
  set(27, ax - 0.08, ay);
  set(28, ax + 0.08, ay);
  return pts;
}

function runHinge(
  leans: number[],
  kneeDeg = 150,
): ReturnType<HingeAnalyzer['update']>[] {
  const az = new HingeAnalyzer();
  return leans.map((lean, i) => az.update(hlm(lean, kneeDeg), i * 200));
}

describe('hinge FSM', () => {
  it('counts one clean rep through the full cycle', () => {
    const out = runHinge([10, 15, 35, 50, 58, 45, 30, 18, 10]).filter(Boolean);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ rep: 1, score: 100, goodRep: true, issues: [] });
  });

  it('counts a shallow hinge but flags it', () => {
    // Peaks at 50: past the 45 bottom gate, short of the 55 full hinge.
    const out = runHinge([10, 15, 35, 48, 50, 42, 30, 18, 10]).filter(Boolean);
    expect(out).toHaveLength(1);
    expect(out[0]?.issues).toContain('shallow_hinge');
    expect(out[0]?.score).toBe(75);
  });

  it('ignores a bob that never reaches the hinge bottom', () => {
    const az = new HingeAnalyzer();
    const out = runHinge([10, 15, 32, 40, 35, 20, 10]).filter(Boolean);
    expect(out).toHaveLength(0);
    expect(az.repCount).toBe(0);
  });

  it('flags squatting the hinge but still counts the rep', () => {
    const out = runHinge([10, 15, 35, 50, 60, 45, 30, 18, 10], 100).filter(Boolean);
    expect(out).toHaveLength(1);
    expect(out[0]?.issues).toContain('squatty_hinge');
    expect(out[0]?.score).toBe(75);
  });

  it('ignores frames where the body leaves the frame', () => {
    const az = new HingeAnalyzer();
    const frames = [hlm(10), hlm(35), hlm(55), hlm(30), hlm(10)];
    frames[2]![25] = { x: 0.42, y: 0.6, visibility: 0 };
    frames.forEach((lm, i) => az.update(lm, i * 200));
    expect(az.repCount).toBe(0);
  });

  it('summarizes totals across reps', () => {
    const az = new HingeAnalyzer();
    const seq = [10, 35, 50, 58, 40, 20, 10, 35, 52, 58, 40, 20, 10];
    seq.forEach((lean, i) => az.update(hlm(lean), i * 200));
    expect(az.summary()).toMatchObject({ totalReps: 2, goodReps: 2, badReps: 0 });
  });
});
