import { kneeAngle, landmarksVisible, torsoLean, type Point } from './angles';

// Hip-hinge rep counter: swings, deadlifts, snatches. Explicit finite state
// machine, not frame counting.
// TOP -> HINGING -> BOTTOM -> RISING -> TOP = 1 rep.
// The rep signal is torso lean (upright ~0-15 at lockout, 45+ at the hinge
// bottom for swings, deeper for deadlifts). Knees stay soft but open -
// bending them like a squat is the form fault this counter catches.
// Hysteresis thresholds + minimum dwell reject camera jitter.

export type HingePhase = 'TOP' | 'HINGING' | 'BOTTOM' | 'RISING';

const ENTER_HINGE = 30;
const ENTER_BOTTOM = 45;
const ENTER_RISE = 35;
const ENTER_TOP = 25;
const MIN_DWELL_MS = 120;
// A counted rep that never reaches this lean is a shallow hinge.
const FULL_HINGE_LEAN = 55;
// Knees folding to squat depth means the lifter squatted the hinge.
const SQUATTY_KNEE = 120;

export interface HingeRepResult {
  rep: number;
  score: number;
  goodRep: boolean;
  issues: string[];
  maxLean: number;
}

export class HingeAnalyzer {
  private phase: HingePhase = 'TOP';
  private phaseSince = 0;
  private maxLean = 0;
  private minKnee = 180;
  private bottomIssues: string[] = [];
  repCount = 0;
  scores: number[] = [];
  issueCounts: Record<string, number> = {};

  getPhase(): HingePhase {
    return this.phase;
  }

  reset(): void {
    this.phase = 'TOP';
    this.phaseSince = 0;
    this.repCount = 0;
    this.scores = [];
    this.issueCounts = {};
    this.maxLean = 0;
    this.minKnee = 180;
    this.bottomIssues = [];
  }

  // Feed one frame's landmarks (with `now` in ms). Returns a result only on
  // the frame a rep completes, else null.
  update(lm: Point[], now: number): HingeRepResult | null {
    if (!landmarksVisible(lm)) {
      return null;
    }
    const lean = torsoLean(lm);
    const dwell = now - this.phaseSince;

    switch (this.phase) {
      case 'TOP':
        if (lean > ENTER_HINGE) this.enter('HINGING', now);
        break;
      case 'HINGING':
        this.maxLean = Math.max(this.maxLean, lean);
        this.minKnee = Math.min(this.minKnee, kneeAngle(lm));
        if (lean > ENTER_BOTTOM && dwell >= MIN_DWELL_MS) {
          this.enter('BOTTOM', now);
        } else if (lean < ENTER_TOP) {
          this.enter('TOP', now); // aborted rep, no count
          this.maxLean = 0;
          this.minKnee = 180;
        }
        break;
      case 'BOTTOM':
        this.maxLean = Math.max(this.maxLean, lean);
        this.minKnee = Math.min(this.minKnee, kneeAngle(lm));
        if (lean < ENTER_RISE && dwell >= MIN_DWELL_MS) this.enter('RISING', now);
        break;
      case 'RISING':
        if (lean < ENTER_TOP && dwell >= MIN_DWELL_MS) {
          this.enter('TOP', now);
          return this.finishRep();
        }
        if (lean > ENTER_BOTTOM) this.enter('BOTTOM', now); // dipped again
        break;
    }
    return null;
  }

  private enter(phase: HingePhase, now: number): void {
    this.phase = phase;
    this.phaseSince = now;
    if (phase === 'HINGING') {
      this.maxLean = 0;
      this.minKnee = 180;
    }
  }

  private formIssues(): string[] {
    const issues: string[] = [];
    if (this.maxLean < FULL_HINGE_LEAN) issues.push('shallow_hinge');
    if (this.minKnee < SQUATTY_KNEE) issues.push('squatty_hinge');
    return issues;
  }

  private finishRep(): HingeRepResult {
    this.repCount += 1;
    // Issues resolve at completion: the hinge can deepen after BOTTOM entry,
    // so only the full rep tells whether it was deep and hip-loaded.
    this.bottomIssues = this.formIssues();
    const score = Math.max(0, 100 - this.bottomIssues.length * 25);
    const goodRep = score >= 70;
    for (const i of this.bottomIssues) {
      this.issueCounts[i] = (this.issueCounts[i] ?? 0) + 1;
    }
    this.scores.push(score);
    const result: HingeRepResult = {
      rep: this.repCount,
      score,
      goodRep,
      issues: [...this.bottomIssues],
      maxLean: Math.round(this.maxLean),
    };
    this.bottomIssues = [];
    this.maxLean = 0;
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
