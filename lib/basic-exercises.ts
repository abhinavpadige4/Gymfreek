import { programTemplates } from '@/lib/programs/templates';
import { TRIAL_BLOCK } from '@/lib/challenge-blueprint';
import { catalogNameFor } from '@/lib/exercise-aliases';
import { EXERCISE_CATALOG } from '@/lib/exercise-catalog';

// Free-tier exercise visibility. A movement is "basic" (allowed outside
// challenges: free templates, trial, pickers) when it appears in one of the
// free beginner templates, or is a free-trial exception (the Block 01
// movements the trial previews). Everything else is challenge-only.
const TRIAL_EXTRAS: string[] = TRIAL_BLOCK.tasks
  .map((t) => catalogNameFor(t.name))
  .filter((n): n is string => n !== null);

function computeBasics(): Set<string> {
  const names = new Set<string>();
  for (const t of programTemplates) {
    if (!t.free) continue;
    for (const w of t.program.workouts) {
      for (const e of w.exercises) names.add(e.name);
    }
  }
  for (const n of TRIAL_EXTRAS) names.add(n);
  return names;
}

export const BASIC_EXERCISE_NAMES: Set<string> = computeBasics();

export function isBasicExercise(catalogName: string): boolean {
  return BASIC_EXERCISE_NAMES.has(catalogName);
}

const CATALOG_NAMES: Set<string> = new Set(EXERCISE_CATALOG.map((e) => e.name));

// Challenge-only movements must not appear outside challenges. Basics and
// the member's own custom exercises stay visible everywhere.
export function isVisibleExercise(catalogName: string): boolean {
  if (BASIC_EXERCISE_NAMES.has(catalogName)) return true;
  return !CATALOG_NAMES.has(catalogName);
}
