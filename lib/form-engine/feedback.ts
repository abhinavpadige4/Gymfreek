// Static rule -> phrase dictionary. Real-time cues never touch an LLM.

export const RULE_PHRASES: Record<string, string> = {
  forward_lean: 'Keep your chest upright.',
  knee_inward: 'Keep your knees aligned.',
  insufficient_depth: 'Go a little deeper.',
  hip_sag: 'Keep your body in one line.',
  shallow_hinge: 'Hinge deeper, hips back.',
  squatty_hinge: 'Bend less at the knees.',
  uneven_arms: 'Keep both arms even.',
};

// Top issue keys by rep count, for the live score chips. Unknown keys sort
// with the rest; callers map through RULE_PHRASES for display text.
export function topIssues(issues: Record<string, number>, limit = 2): string[] {
  return Object.entries(issues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

// Throttle: same cue at most every 4s, any cue at least 1.2s apart.
const SAME_CUE_MS = 4000;
const ANY_CUE_MS = 1200;

export class CueThrottle {
  private lastByCue = new Map<string, number>();
  private lastAny = -Infinity;

  // Returns the phrase to speak, or null when throttled.
  pick(issues: string[], now: number): string | null {
    for (const issue of issues) {
      const phrase = RULE_PHRASES[issue];
      if (!phrase) continue;
      const lastSame = this.lastByCue.get(issue) ?? -Infinity;
      if (now - lastSame >= SAME_CUE_MS && now - this.lastAny >= ANY_CUE_MS) {
        this.lastByCue.set(issue, now);
        this.lastAny = now;
        return phrase;
      }
    }
    return null;
  }

  reset(): void {
    this.lastByCue.clear();
    this.lastAny = -Infinity;
  }
}
