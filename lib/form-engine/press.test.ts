import { describe, expect, it } from 'vitest';
import type { Point } from './angles';
import { PressAnalyzer } from './press';

// Synthetic front-view landmarks for an exact elbow angle, same triangle
// construction as the pushup tests. `spread` lags the right arm and leads
// the left by half each, but only in the working (bent) region - near
// lockout both arms read the same, like a real uneven press. The split
// keeps the averaged angle on the intended cycle.
function plm(elbowDeg: number, spread = 0): Point[] {
  const pts: Point[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  const exFor = (deg: number) => {
    const cos = Math.cos((Math.min(Math.max(deg, 5), 175) * Math.PI) / 180);
    return 0.2 * Math.sqrt(Math.max(0, (1 + cos) / (1 - cos)));
  };
  const half = elbowDeg < 140 ? spread / 2 : 0;
  const set = (i: number, x: number, y: number) => {
    pts[i] = { x, y, visibility: 1 };
  };
  set(11, 0.42, 0.2);
  set(12, 0.58, 0.2);
  set(13, 0.42 - exFor(elbowDeg - half), 0.4);
  set(14, 0.58 + exFor(elbowDeg + half), 0.4);
  set(15, 0.42, 0.6);
  set(16, 0.58, 0.6);
  set(23, 0.42, 0.5);
  set(24, 0.58, 0.5);
  set(27, 0.42, 0.9);
  set(28, 0.58, 0.9);
  return pts;
}

function runPress(
  angles: number[],
  spread = 0,
): { az: PressAnalyzer; out: ReturnType<PressAnalyzer['update']>[] } {
  const az = new PressAnalyzer();
  return { az, out: angles.map((a, i) => az.update(plm(a, spread), i * 200)) };
}

describe('press FSM', () => {
  it('counts one press rep starting from the bent rack', () => {
    const { out } = runPress([90, 95, 130, 160, 165, 130, 95, 90]);
    const done = out.filter(Boolean);
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ rep: 1, score: 100, goodRep: true, issues: [] });
  });

  it('counts one row rep starting from the open hang', () => {
    const { out } = runPress([165, 160, 130, 95, 90, 120, 155, 165]);
    const done = out.filter(Boolean);
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ rep: 1, score: 100, goodRep: true, issues: [] });
  });

  it('counts no rep for a partial that never reaches the far side', () => {
    const { az, out } = runPress([165, 140, 120, 110, 130, 160]);
    expect(out.filter(Boolean)).toHaveLength(0);
    expect(az.repCount).toBe(0);
  });

  it('flags an uneven rep but still counts it', () => {
    const { out } = runPress([90, 95, 130, 160, 165, 130, 95, 90], 25);
    const done = out.filter(Boolean);
    expect(done).toHaveLength(1);
    expect(done[0]?.issues).toContain('uneven_arms');
    expect(done[0]?.score).toBe(75);
  });

  it('ignores frames where an arm leaves the frame', () => {
    const { az } = runPress([90, 130, 160]);
    const hidden = plm(130);
    hidden[15] = { x: 0.42, y: 0.6, visibility: 0 };
    expect(az.update(hidden, 1000)).toBeNull();
    expect(az.repCount).toBe(0);
  });

  it('summarizes totals across reps', () => {
    const { az } = runPress([90, 130, 160, 165, 130, 90, 95, 130, 162, 130, 92, 90]);
    expect(az.summary()).toMatchObject({ totalReps: 2, goodReps: 2, badReps: 0 });
  });
});
