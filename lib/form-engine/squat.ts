import { kneeAngle, landmarksVisible, torsoLean, type Point } from './angles';

// Squat rep counter: explicit finite state machine, not frame counting.
// STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING = 1 rep.
// Hysteresis thresholds + minimum dwell reject camera jitter.

export type SquatPhase = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

const ENTER_DESCEND = 150;
const ENTER_BOTTOM = 110;
const ENTER_ASCEND = 130;
const ENTER_STAND = 160;
const MIN_DWELL_MS = 120;

export interface RepResult {
  rep: number;
  score: number;
  goodRep: boolean;
  issues: string[];
  minKneeAngle: number;
}

export class SquatAnalyzer {
  private phase: SquatPhase = 'STANDING';
  private phaseSince = 0;
  private minKnee = 180;
  private bottomIssues: string[] = [];
  repCount = 0;
  scores: number[] = [];
  issueCounts: Record<string, number> = {};

  getPhase(): SquatPhase {
    return this.phase;
  }

  reset(): void {
    this.phase = 'STANDING';
    this.repCount = 0;
    this.scores = [];
    this.issueCounts = {};
    this.minKnee = 180;
    this.bottomIssues = [];
  }

  // Feed one frame's landmarks (with `now` in ms). Returns a RepResult only
  // on the frame a rep completes, else null.
  update(lm: Point[], now: number): RepResult | null {
    if (!landmarksVisible(lm)) {
      return null;
    }
    const knee = kneeAngle(lm);
    const dwell = now - this.phaseSince;

    switch (this.phase) {
      case 'STANDING':
        if (knee < ENTER_DESCEND && dwell >= 0) this.enter('DESCENDING', now);
        break;
      case 'DESCENDING':
        this.minKnee = Math.min(this.minKnee, knee);
        if (knee < ENTER_BOTTOM && dwell >= MIN_DWELL_MS) {
          this.enter('BOTTOM', now);
          this.bottomIssues = this.formIssues(lm);
        } else if (knee > ENTER_STAND) {
          this.enter('STANDING', now); // aborted rep, no count
          this.minKnee = 180;
        }
        break;
      case 'BOTTOM':
        this.minKnee = Math.min(this.minKnee, knee);
        if (knee > ENTER_ASCEND && dwell >= MIN_DWELL_MS) this.enter('ASCENDING', now);
        break;
      case 'ASCENDING':
        if (knee > ENTER_STAND && dwell >= MIN_DWELL_MS) {
          this.enter('STANDING', now);
          return this.finishRep();
        }
        if (knee < ENTER_BOTTOM) this.enter('BOTTOM', now); // dipped again
        break;
    }
    return null;
  }

  private enter(phase: SquatPhase, now: number): void {
    this.phase = phase;
    this.phaseSince = now;
    if (phase === 'DESCENDING') this.minKnee = 180;
  }

  private formIssues(lm: Point[]): string[] {
    const issues: string[] = [];
    if (this.minKnee > 120) issues.push('insufficient_depth');
    if (torsoLean(lm) > 40) issues.push('forward_lean');
    // ponytail: knee-drift needs depth-aware geometry; depth + lean ship first.
    return issues;
  }

  private finishRep(): RepResult {
    this.repCount += 1;
    const score = Math.max(0, 100 - this.bottomIssues.length * 25);
    const goodRep = score >= 70;
    for (const i of this.bottomIssues) {
      this.issueCounts[i] = (this.issueCounts[i] ?? 0) + 1;
    }
    this.scores.push(score);
    const result: RepResult = {
      rep: this.repCount,
      score,
      goodRep,
      issues: [...this.bottomIssues],
      minKneeAngle: Math.round(this.minKnee),
    };
    this.bottomIssues = [];
    this.minKnee = 180;
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
