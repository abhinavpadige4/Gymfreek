// Challenge race rules and the shared medical-rest flag (normal training
// sessions reuse needsMedicalRest for the 30s rest floor).
export const CHALLENGE_DAY_CAP_SEC = 55 * 60;
export const CHALLENGE_REST_SEC = 20;
export const CHALLENGE_MEDICAL_REST_SEC = 30;
// Recovery days (day 5 and 10 of every 10-day block): only 6 of the day's
// tasks are required (600 reps), matching the blueprint's 6-8 round option.

// ponytail: keyword scan, proper ICD coding if a clinician needs it
const MEDICAL_KEYWORDS = [
  'asthma',
  'cardiac',
  'heart',
  'hypertension',
  'bp',
  'diabetes',
  'joint',
  'knee',
  'back',
  'shoulder',
  'injury',
  'pregnan',
  'epilepsy',
];

export function needsMedicalRest(medicalText: string | null | undefined): boolean {
  if (!medicalText) return false;
  const t = medicalText.toLowerCase();
  return MEDICAL_KEYWORDS.some((k) => t.includes(k));
}

export function restFor(medicalText: string | null | undefined): number {
  return needsMedicalRest(medicalText) ? CHALLENGE_MEDICAL_REST_SEC : CHALLENGE_REST_SEC;
}

export function isValidAttempt(durationSec: number | null | undefined): boolean {
  return typeof durationSec === 'number' && durationSec > 0 && durationSec <= CHALLENGE_DAY_CAP_SEC;
}

// Day 5 and 10 of every 10-day block (global day numbers ending in 5 or 0).
export function isChallengeRecoveryDay(dayNumber: number): boolean {
  return dayNumber % 10 === 5 || dayNumber % 10 === 0;
}

// How many of the day's tasks must be completed for a valid attempt.
// Capped by the day's actual task count so short days (free trial) stay valid.
export function requiredTasksForDay(dayNumber: number, taskCount: number): number {
  return isChallengeRecoveryDay(dayNumber) ? Math.min(6, taskCount) : taskCount;
}

// Reported reps required: the runner posts 100 per completed task.
export function requiredRepsForDay(dayNumber: number, taskCount: number): number {
  return requiredTasksForDay(dayNumber, taskCount) * 100;
}

export function medicalBracket(medicalText: string | null | undefined): 'extra-rest' | 'standard' {
  return needsMedicalRest(medicalText) ? 'extra-rest' : 'standard';
}
