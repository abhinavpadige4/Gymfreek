// Challenge-only race rules. General training never imports this.
export const CHALLENGE_DAY_CAP_SEC = 25 * 60;
export const CHALLENGE_REST_SEC = 20;
export const CHALLENGE_MEDICAL_REST_SEC = 30;

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

export function medicalBracket(medicalText: string | null | undefined): 'extra-rest' | 'standard' {
  return needsMedicalRest(medicalText) ? 'extra-rest' : 'standard';
}
