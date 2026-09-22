import { describe, expect, it } from 'vitest';
import { angleAt, kneeAngle, kneeDrift, torsoLean, type Point } from './angles';
import { SquatAnalyzer } from './squat';
import { CueThrottle, RULE_PHRASES, topIssues } from './feedback';
import { createAnalyzer } from './registry';

// Synthetic side-view landmarks for an exact knee angle. Hip above knee,
// ankle placed so the hip-knee-ankle angle equals kneeDeg.
function lm(kneeDeg: number, leanDeg = 10): Point[] {
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

describe('angles', () => {
  it('measures a right angle', () => {
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90, 5);
  });

  it('tracks standing vs deep knee flexion', () => {
    expect(kneeAngle(lm(180))).toBeCloseTo(180, 0);
    expect(kneeAngle(lm(90))).toBeCloseTo(90, 0);
  });

  it('measures torso lean from vertical', () => {
    expect(torsoLean(lm(180, 10))).toBeGreaterThan(5);
    expect(torsoLean(lm(180, 10))).toBeLessThan(20);
    expect(torsoLean(lm(180, 50))).toBeGreaterThan(40);
  });

  it('measures lateral knee drift', () => {
    const aligned = kneeDrift(lm(180));
    const shifted = lm(180);
    shifted[25] = { x: 0.6, y: 0.6, visibility: 1 };
    shifted[26] = { x: 0.76, y: 0.6, visibility: 1 };
    expect(kneeDrift(shifted)).toBeGreaterThan(aligned);
  });
});

function runSquat(angles: number[], lean = 10): ReturnType<SquatAnalyzer['update']>[] {
  const az = new SquatAnalyzer();
  return angles.map((a, i) => az.update(lm(a, lean), i * 200));
}

describe('squat FSM', () => {
  it('counts one clean rep through the full cycle', () => {
    const frames = runSquat([180, 178, 145, 130, 105, 100, 140, 172]);
    const done = frames.filter(Boolean);
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ rep: 1, score: 100, goodRep: true, issues: [] });
  });

  it('flags shallow depth but still counts the rep', () => {
    const az = new SquatAnalyzer();
    const seq = [180, 178, 145, 132, 128, 140, 172];
    const out = seq.map((a, i) => az.update(lm(a), i * 200)).filter(Boolean);
    // min knee 128 never enters BOTTOM (<110): no rep counted
    expect(out).toHaveLength(0);
    expect(az.repCount).toBe(0);
  });

  it('flags forward lean at the bottom', () => {
    const az = new SquatAnalyzer();
    const seq = [180, 178, 145, 130, 105, 100, 140, 172];
    const out = seq.map((a, i) => az.update(lm(a, 55), i * 200)).filter(Boolean);
    expect(out).toHaveLength(1);
    expect(out[0]?.issues).toContain('forward_lean');
    expect(out[0]?.score).toBe(75);
  });

  it('summarizes totals across reps', () => {
    const az = new SquatAnalyzer();
    const seq = [180, 145, 130, 105, 100, 140, 172, 175, 145, 130, 104, 100, 140, 172];
    seq.forEach((a, i) => az.update(lm(a), i * 200));
    expect(az.summary()).toMatchObject({ totalReps: 2, goodReps: 2, badReps: 0 });
  });
});

describe('cue throttle', () => {
  it('repeats a phrase only in the dictionary and throttles repeats', () => {
    const th = new CueThrottle();
    expect(RULE_PHRASES['forward_lean']).toBe('Keep your chest upright.');
    expect(th.pick(['forward_lean'], 0)).toBe('Keep your chest upright.');
    expect(th.pick(['forward_lean'], 1000)).toBeNull();
    expect(th.pick(['forward_lean'], 5000)).toBe('Keep your chest upright.');
  });
});

describe('topIssues', () => {
  it('returns the highest-count keys first, capped at the limit', () => {
    expect(topIssues({ forward_lean: 7, knee_inward: 2, hip_sag: 5 })).toEqual([
      'forward_lean',
      'hip_sag',
    ]);
    expect(topIssues({ forward_lean: 1 }, 5)).toEqual(['forward_lean']);
    expect(topIssues({})).toEqual([]);
  });
});

describe('registry', () => {
  it('resolves squat, pushup and hinge', () => {
    expect(createAnalyzer('squat')).not.toBeNull();
    expect(createAnalyzer(' Squat ')).not.toBeNull();
    expect(createAnalyzer('push-up')).not.toBeNull();
    expect(createAnalyzer('Russian kettlebell swings')).not.toBeNull();
    expect(createAnalyzer('lunge')).toBeNull();
  });

  it('maps bilateral squat-pattern variations to the squat counter', () => {
    for (const name of [
      'Dual dumbbell front squats',
      'Kettlebell goblet squats with pause',
      'Dual dumbbell thrusters',
      'Heavy dual dumbbell thrusters',
      'Wall-ball simulator thrusters',
      'Kettlebell clean to squat',
      'Kettlebell clean, squat and press',
      'Back Squat',
      'Front Squat',
      'Goblet squat',
    ]) {
      expect(createAnalyzer(name)?.constructor.name).toBe('SquatAnalyzer');
    }
  });

  it('maps blueprint push-up-pattern variations to the push-up counter', () => {
    for (const name of [
      'Strict hand-release push-ups',
      'Deficit push-ups on hex dumbbells',
      'Spiderman push-ups on dumbbells',
      'Dumbbell push-up to snatch',
      'Dumbbell renegade row to push-up',
    ]) {
      expect(createAnalyzer(name)?.constructor.name).toBe('PushupAnalyzer');
    }
  });

  it('maps hinge-family variations to the hinge counter', () => {
    for (const name of [
      'Russian kettlebell swings',
      'American kettlebell overhead swings',
      'Double kettlebell swings',
      'Dumbbell Romanian deadlifts',
      'Kettlebell goblet sumo deadlifts',
      'Sumo deadlift high pulls',
      'Alternating dumbbell snatch',
      'Ski-pull simulator dumbbell hinge drives',
    ]) {
      expect(createAnalyzer(name)?.constructor.name).toBe('HingeAnalyzer');
    }
    // Overlaps keep their earlier counter: squat before hinge, pushup first.
    expect(createAnalyzer('Kettlebell clean to squat')?.constructor.name).toBe('SquatAnalyzer');
    expect(createAnalyzer('Dumbbell push-up to snatch')?.constructor.name).toBe(
      'PushupAnalyzer',
    );
    // Single-leg deadlifts stay unmapped like all single-leg work.
    expect(createAnalyzer('Single-leg dumbbell Romanian deadlift')).toBeNull();
  });

  it('maps press/row-family variations to the press counter', () => {
    for (const name of [
      'Dumbbell push press',
      'Single-arm dumbbell push press',
      'Dumbbell devil press',
      'Dumbbell floor press with bridge hold',
      'Dumbbell renegade rows',
      'Kettlebell gorilla rows',
      'Sled pull simulator bent kettlebell rows',
      'Hollow body dumbbell pullover',
      'Wall-sit dumbbell bicep curls',
      'Kettlebell clean and push press',
    ]) {
      expect(createAnalyzer(name)?.constructor.name).toBe('PressAnalyzer');
    }
  });

  it('leaves single-leg work, carries, burpees and jumps without a counter', () => {
    // Single-leg patterns average a bent leg with a straight one and never
    // reach the bottom threshold, so no counter is offered instead of a
    // miscounting one.
    for (const name of [
      'Forward alternating dumbbell lunges',
      'Dumbbell Bulgarian split squats',
      'Weighted dumbbell box step-ups',
      'Suitcase walking lunges',
      "Heavy kettlebell carry paces",
      'Full chest-to-deck burpees',
      'Plyo box jumps with step down',
    ]) {
      expect(createAnalyzer(name)).toBeNull();
    }
  });
});
