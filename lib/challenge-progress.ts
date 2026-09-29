import type { EnrollmentStatus } from '@/prisma/generated/client';

// Day-completion writer: the single place that moves a challenge enrollment
// forward. Only ACTIVE enrollments advance; finishing the last day flips the
// status to COMPLETED. Returns the new state, or null when nothing changes
// (repeat of an old day, invalid day, non-ACTIVE enrollment).
export function advanceEnrollment(
  enrollment: { status: EnrollmentStatus; currentDay: number },
  completedDayNumber: number,
  totalDays: number,
): { status: 'ACTIVE' | 'COMPLETED'; currentDay: number } | null {
  if (enrollment.status !== 'ACTIVE') return null;
  if (
    !Number.isInteger(completedDayNumber) ||
    completedDayNumber < 1 ||
    completedDayNumber > totalDays
  ) {
    return null;
  }
  if (completedDayNumber >= totalDays) {
    // Idempotent: re-posting the last day rewrites the same COMPLETED state.
    return { status: 'COMPLETED', currentDay: totalDays };
  }
  const next = Math.min(totalDays, Math.max(enrollment.currentDay, completedDayNumber + 1));
  return next === enrollment.currentDay ? null : { status: 'ACTIVE', currentDay: next };
}

// Streak tracking on UTC calendar days. Same UTC day = keep, next UTC day =
// +1, larger gap = missed a day so the pointer resets to Day 1. History rows
// are never deleted, so bests survive the reset. Null lastCompletedAt (never
// finished) starts the streak at 1.
export function streakFor(
  lastCompletedAt: Date | null | undefined,
  currentStreak: number,
  now: Date = new Date(),
): { resetToDayOne: boolean; streakCount: number } {
  if (!lastCompletedAt) return { resetToDayOne: false, streakCount: 1 };
  const dayMs = 86_400_000;
  const dayOf = (d: Date) =>
    Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / dayMs);
  const gap = dayOf(now) - dayOf(lastCompletedAt);
  if (gap <= 0) return { resetToDayOne: false, streakCount: Math.max(1, currentStreak) };
  if (gap === 1) return { resetToDayOne: false, streakCount: Math.max(1, currentStreak) + 1 };
  return { resetToDayOne: true, streakCount: 1 };
}

// Midnight-UTC unlock for the next day: even when Day N finishes early,
// Day N+1 stays locked until 00:00 UTC. Returns null when nothing follows.
export function nextUnlockAt(completedDayNumber: number, totalDays: number, now: Date = new Date()): Date | null {
  if (completedDayNumber < 1 || completedDayNumber >= totalDays) return null;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

export interface BestAttempt {
  reps: number;
  averageScore: number;
}

// Best = max reps, tie-break higher score. Pure so both the day page and the
// runner share one definition.
export function bestFor(results: BestAttempt[]): BestAttempt | null {
  let best: BestAttempt | null = null;
  for (const r of results) {
    if (!best || r.reps > best.reps || (r.reps === best.reps && r.averageScore > best.averageScore)) {
      best = r;
    }
  }
  return best;
}
