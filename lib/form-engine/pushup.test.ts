import { describe, expect, it } from 'vitest';
import type { Point } from './angles';
import { PushupAnalyzer } from './pushup';

// Synthetic front-view landmarks for an exact elbow angle. Shoulders above,
// wrists below, elbows offset sideways: ex solves cos(elbow) exactly for the
// shoulder-elbow-wrist triangle. Hips/ankles form a straight body line unless
// sagDX shifts the hips sideways (front-view proxy for a sagging midline).
function lm(elbowDeg: number, sagDX = 0): Point[] {
  const pts: Point[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  const cos = Math.cos((elbowDeg * Math.PI) / 180);
  const ex = 0.2 * Math.sqrt(Math.max(0, (1 + cos) / (1 - cos)));
  const set = (i: number, x: number, y: number) => {
    pts[i] = { x, y, visibility: 1 };
  };
  set(11, 0.42, 0.2);
  set(12, 0.58, 0.2);
  set(13, 0.42 - ex, 0.4);
  set(14, 0.58 + ex, 0.4);
  set(15, 0.42, 0.6);
  set(16, 0.58, 0.6);
  set(23, 0.42 + sagDX, 0.5);
  set(24, 0.58 + sagDX, 0.5);
  set(27, 0.42, 0.9);
  set(28, 0.58, 0.9);
  return pts;
}

function runPushup(angles: number[], sagDX = 0) {
  const az = new PushupAnalyzer();
  return { az, out: angles.map((a, i) => az.update(lm(a, sagDX), i * 200)).filter(Boolean) };
}

describe('pushup FSM', () => {
  it('counts one clean rep through the full cycle', () => {
    const { out } = runPushup([170, 165, 130, 110, 85, 80, 115, 140, 165]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ rep: 1, score: 100, goodRep: true, issues: [] });
  });

  it('counts no rep when depth never reaches bottom', () => {
    const az = new PushupAnalyzer();
    const out = [170, 165, 130, 115, 100, 130, 165]
      .map((a, i) => az.update(lm(a), i * 200))
      .filter(Boolean);
    expect(out).toHaveLength(0);
    expect(az.repCount).toBe(0);
  });

  it('flags hip sag at the bottom', () => {
    const { out } = runPushup([170, 165, 130, 110, 85, 80, 115, 140, 165], 0.15);
    expect(out).toHaveLength(1);
    expect(out[0]?.issues).toContain('hip_sag');
    expect(out[0]?.score).toBe(75);
  });

  it('summarizes totals across reps', () => {
    const { az } = runPushup([170, 130, 85, 80, 125, 165, 170, 130, 84, 80, 125, 165, 170]);
    expect(az.summary()).toMatchObject({ totalReps: 2, goodReps: 2, badReps: 0 });
  });
});
