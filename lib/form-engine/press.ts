import { angleAt, type Point } from './angles';

// Press/row rep counter: overhead and floor presses, rows, pullovers,
// curls. The rep signal is the elbow cycle - bent to locked and back.
// Presses start bent (rack) and rows start open (hang); the FSM seeds its
// home phase from the first frame and counts every return home after a
// full trip to the other side, so one counter serves both directions.
// Same RepResult/summary shape as the sibling analyzers.

// BlazePose arm indices (mirrors pushup.ts; legs stay out of this counter).
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;

export type PressPhase = 'OPEN' | 'CLOSED';

const ENTER_CLOSE = 100;
const ENTER_OPEN = 150;
const HOME_MID = 125;
const MIN_DWELL_MS = 120;
// One side lagging past this gap mid-cycle is an uneven rep.
const UNEVEN_SPREAD = 20;

export interface PressRepResult {
  rep: number;
  score: number;
  goodRep: boolean;
  issues: string[];
  minElbowAngle: number;
}

function armsVisible(lm: Point[]): boolean {
  for (const i of [L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST]) {
    if ((lm[i]?.visibility ?? 0) < 0.5) return false;
  }
  return true;
}

export class PressAnalyzer {
  private phase: PressPhase | null = null;
  private home: PressPhase | null = null;
  private visitedOther = false;
  private phaseSince = 0;
  private minElbow = 180;
  private maxSpread = 0;
  repCount = 0;
  scores: number[] = [];
  issueCounts: Record<string, number> = {};

  getPhase(): PressPhase | null {
    return this.phase;
  }

  reset(): void {
    this.phase = null;
    this.home = null;
    this.visitedOther = false;
    this.repCount = 0;
    this.scores = [];
    this.issueCounts = {};
    this.minElbow = 180;
    this.maxSpread = 0;
  }

  // Feed one frame's landmarks (with `now` in ms). Returns a result only on
  // the frame a rep completes, else null.
  update(lm: Point[], now: number): PressRepResult | null {
    if (!armsVisible(lm)) return null;
    const left = angleAt(lm[L_SHOULDER]!, lm[L_ELBOW]!, lm[L_WRIST]!);
    const right = angleAt(lm[R_SHOULDER]!, lm[R_ELBOW]!, lm[R_WRIST]!);
    const elbow = (left + right) / 2;
    if (this.phase === null) {
      this.home = elbow >= HOME_MID ? 'OPEN' : 'CLOSED';
      this.phase = this.home;
      this.phaseSince = now;
      return null;
    }
    this.minElbow = Math.min(this.minElbow, elbow);
    this.maxSpread = Math.max(this.maxSpread, Math.abs(left - right));
    const dwell = now - this.phaseSince;

    if (this.phase === 'OPEN') {
      if (elbow < ENTER_CLOSE && dwell >= MIN_DWELL_MS) return this.arrive('CLOSED', now);
    } else if (elbow > ENTER_OPEN && dwell >= MIN_DWELL_MS) {
      return this.arrive('OPEN', now);
    }
    return null;
  }

  // A return home after a full trip to the other side completes one rep.
  // Cycle stats reset on departure, so idle fidgeting at home never leaks
  // into the next rep's score.
  private arrive(phase: PressPhase, now: number): PressRepResult | null {
    this.phase = phase;
    this.phaseSince = now;
    if (phase !== this.home) {
      this.visitedOther = true;
      this.minElbow = 180;
      this.maxSpread = 0;
      return null;
    }
    if (!this.visitedOther) return null;
    this.visitedOther = false;
    return this.finishRep();
  }

  private finishRep(): PressRepResult {
    this.repCount += 1;
    const issues = this.maxSpread > UNEVEN_SPREAD ? ['uneven_arms'] : [];
    const score = Math.max(0, 100 - issues.length * 25);
    const goodRep = score >= 70;
    for (const i of issues) {
      this.issueCounts[i] = (this.issueCounts[i] ?? 0) + 1;
    }
    this.scores.push(score);
    const result: PressRepResult = {
      rep: this.repCount,
      score,
      goodRep,
      issues,
      minElbowAngle: Math.round(this.minElbow),
    };
    this.minElbow = 180;
    this.maxSpread = 0;
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
