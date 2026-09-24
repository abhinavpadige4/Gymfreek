import { describe, expect, it } from 'vitest';
import { SESSION_MEDICAL_REST_SEC, sessionRestSec } from './session-rest';
import { SUPERSET_TRANSITION_REST_SEC } from './supersets';

describe('session-rest', () => {
  it('keeps the configured rest for standard members', () => {
    expect(sessionRestSec({ transition: false, configuredSec: 90, medicalRest: false })).toBe(90);
  });

  it('floors medical members at 30s without shortening longer rests', () => {
    expect(SESSION_MEDICAL_REST_SEC).toBe(30);
    expect(sessionRestSec({ transition: false, configuredSec: 20, medicalRest: true })).toBe(30);
    expect(sessionRestSec({ transition: false, configuredSec: 90, medicalRest: true })).toBe(90);
  });

  it('keeps the quick superset transition rest for everyone', () => {
    expect(
      sessionRestSec({ transition: true, configuredSec: 90, medicalRest: true }),
    ).toBe(SUPERSET_TRANSITION_REST_SEC);
  });
});
