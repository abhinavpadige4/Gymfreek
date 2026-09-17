// Pure geometry over MediaPipe pose landmarks (33-point BlazePose).
// No DOM, no model - unit-tested rep by rep.

export interface Point {
  x: number;
  y: number;
  visibility?: number;
}

// BlazePose indices we need.
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

export function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Angle at vertex b between a-b-c, in degrees 0..180.
export function angleAt(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Knee flexion from averaged left/right sides. Standing ~170, deep squat ~70.
export function kneeAngle(lm: Point[]): number {
  const hip = mid(lm[LM.leftHip]!, lm[LM.rightHip]!);
  const knee = mid(lm[LM.leftKnee]!, lm[LM.rightKnee]!);
  const ankle = mid(lm[LM.leftAnkle]!, lm[LM.rightAnkle]!);
  return angleAt(hip, knee, ankle);
}

// Torso lean from vertical, degrees. Upright ~0-15, heavy lean 45+.
export function torsoLean(lm: Point[]): number {
  const shoulder = mid(lm[LM.leftShoulder]!, lm[LM.rightShoulder]!);
  const hip = mid(lm[LM.leftHip]!, lm[LM.rightHip]!);
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  const len = Math.hypot(dx, dy) || 1;
  return (Math.acos(Math.min(1, Math.abs(dy) / len)) * 180) / Math.PI;
}

// Knee-vs-ankle horizontal drift normalized by hip width. > ~0.35 = caving in.
export function kneeDrift(lm: Point[]): number {
  const hipW = Math.abs(lm[LM.leftHip]!.x - lm[LM.rightHip]!.x) || 1;
  const knee = mid(lm[LM.leftKnee]!, lm[LM.rightKnee]!);
  const ankle = mid(lm[LM.leftAnkle]!, lm[LM.rightAnkle]!);
  return Math.abs(knee.x - ankle.x) / hipW;
}

export function landmarksVisible(lm: Point[]): boolean {
  for (const i of Object.values(LM)) {
    if ((lm[i]?.visibility ?? 1) < 0.5) return false;
  }
  return true;
}
