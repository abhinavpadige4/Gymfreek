import { angleAt, mid, type Point } from './angles';

// Push-up rep counter: explicit finite state machine, not frame counting.
// EXTENDED -> BENDING -> BOTTOM -> PUSHING -> EXTENDED = 1 rep.
// Elbow angle averaged across sides; body-line (shoulder-hip-ankle) guards
// against hip sag. Same RepResult/summary shape as the squat analyzer.

// BlazePose indices (lib/form-engine LM covers legs; arms live here so the
// squat visibility gate stays exactly as tested).
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;
const L_HIP = 23;
const R_HIP = 24;
const L_ANKLE = 27;
const R_ANKLE = 28;

export type PushupPhase = 'EXTENDED' | 'BENDING' | 'BOTTOM' | 'PUSHING';

const ENTER_BEND = 140;
const ENTER_BOTTOM = 95;
const ENTER_PUSH = 120;
const ENTER_LOCK = 150;
const MIN_DWELL_MS = 120;
const SAG_LINE = 160;

export interface PushupRepResult {
  rep: number;
  score: number;
  goodRep: boolean;
  issues: string[];
  minElbowAngle: number;
}

function elbowAngle(lm: Point[]): number {
  // Average the per-side angles, not the positions: symmetric elbow flare
  // cancels to a straight line in midpoint space (always 180).
  const left = angleAt(lm[L_SHOULDER]!, lm[L_ELBOW]!, lm[L_WRIST]!);
  const right = angleAt(lm[R_SHOULDER]!, lm[R_ELBOW]!, lm[R_WRIST]!);
  return (left + right) / 2;
}

function bodyLine(lm: Point[]): number {
  const shoulder = mid(lm[L_SHOULDER]!, lm[R_SHOULDER]!);
  const hip = mid(lm[L_HIP]!, lm[R_HIP]!);
  const ankle = mid(lm[L_ANKLE]!, lm[R_ANKLE]!);
  return angleAt(shoulder, hip, ankle);
}

function armsVisible(lm: Point[]): boolean {
  for (const i of [L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST]) {
    if ((lm[i]?.visibility ?? 0) < 0.5) return false;
  }
  return true;
}

export class PushupAnalyzer {
  private phase: PushupPhase = 'EXTENDED';
  private phaseSince = 0;
  private minElbow = 180;
  private bottomIssues: string[] = [];
  repCount = 0;
  scores: number[] = [];
  issueCounts: Record<string, number> = {};

  getPhase(): PushupPhase {
    return this.phase;
  }

  reset(): void {
    this.phase = 'EXTENDED';
    this.phaseSince = 0;
    this.repCount = 0;
    this.scores = [];
    this.issueCounts = {};
    this.minElbow = 180;
    this.bottomIssues = [];
  }

  // Feed one frame's landmarks (with `now` in ms). Returns a result only on
  // the frame a rep completes, else null.
  update(lm: Point[], now: number): PushupRepResult | null {
    if (!armsVisible(lm)) return null;
    const elbow = elbowAngle(lm);
    const dwell = now - this.phaseSince;

    switch (this.phase) {
      case 'EXTENDED':
        if (elbow < ENTER_BEND) this.enter('BENDING', now);
        break;
      case 'BENDING':
        this.minElbow = Math.min(this.minElbow, elbow);
        if (elbow < ENTER_BOTTOM && dwell >= MIN_DWELL_MS) {
          this.enter('BOTTOM', now);
          this.bottomIssues = this.formIssues(lm);
        } else if (elbow > ENTER_LOCK) {
          this.enter('EXTENDED', now); // aborted rep, no count
          this.minElbow = 180;
        }
        break;
      case 'BOTTOM':
        this.minElbow = Math.min(this.minElbow, elbow);
        if (elbow > ENTER_PUSH && dwell >= MIN_DWELL_MS) this.enter('PUSHING', now);
        break;
      case 'PUSHING':
        if (elbow > ENTER_LOCK && dwell >= MIN_DWELL_MS) {
          this.enter('EXTENDED', now);
          return this.finishRep();
        }
        if (elbow < ENTER_BOTTOM) this.enter('BOTTOM', now); // dipped again
        break;
    }
    return null;
  }

  private enter(phase: PushupPhase, now: number): void {
    this.phase = phase;
    this.phaseSince = now;
    if (phase === 'BENDING') this.minElbow = 180;
  }

  private formIssues(lm: Point[]): string[] {
    const issues: string[] = [];
    if (this.minElbow > 110) issues.push('insufficient_depth');
    if (bodyLine(lm) < SAG_LINE) issues.push('hip_sag');
    return issues;
  }

  private finishRep(): PushupRepResult {
    this.repCount += 1;
    const score = Math.max(0, 100 - this.bottomIssues.length * 25);
    const goodRep = score >= 70;
    for (const i of this.bottomIssues) {
      this.issueCounts[i] = (this.issueCounts[i] ?? 0) + 1;
    }
    this.scores.push(score);
    const result: PushupRepResult = {
      rep: this.repCount,
      score,
      goodRep,
      issues: [...this.bottomIssues],
      minElbowAngle: Math.round(this.minElbow),
    };
    this.bottomIssues = [];
    this.minElbow = 180;
    return result;
  }

  summary() {
    const total = this.repCount;
    const good = this.scores.filter((s) => s >= 70).length;
    return {
      totalReps: total,
      goodReps: good,
      badReps: total - good,
      averageScore: total ? Math.round(this.scores.reduce((a, b) => a + b, 0) / total) : 0,
      issues: { ...this.issueCounts },
    };
  }
}
