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
