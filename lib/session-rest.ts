import { SUPERSET_TRANSITION_REST_SEC } from '@/lib/supersets';

// Rest floor for members with a medical flag (same product rule as the
// challenge 30s medical rest): the timer never runs shorter than this for
// them, while everyone else keeps the per-exercise configured rest.
export const SESSION_MEDICAL_REST_SEC = 30;

export function sessionRestSec({
  transition,
  configuredSec,
  medicalRest,
}: {
  transition: boolean;
  configuredSec: number;
  medicalRest: boolean;
}): number {
  if (transition) return SUPERSET_TRANSITION_REST_SEC;
  if (medicalRest) return Math.max(configuredSec, SESSION_MEDICAL_REST_SEC);
  return configuredSec;
}
