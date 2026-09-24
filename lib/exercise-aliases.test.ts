import { describe, expect, it } from 'vitest';
import { BLOCKS, TRIAL_BLOCK } from './challenge-blueprint';
import { EXERCISE_CATALOG } from './exercise-catalog';
import { BLUEPRINT_TO_CATALOG, catalogNameFor } from './exercise-aliases';

describe('exercise-aliases', () => {
  it('resolves every blueprint movement to a catalog entry', () => {
    const catalogNames = new Set(EXERCISE_CATALOG.map((e) => e.name));
    const tasks = [...BLOCKS.flatMap((b) => b.tasks), ...TRIAL_BLOCK.tasks];
    expect(tasks.length).toBeGreaterThan(90);
    for (const t of tasks) {
      const mapped = catalogNameFor(t.name);
      expect(mapped, `unmapped blueprint movement: ${t.name}`).not.toBeNull();
      expect(catalogNames.has(mapped!), `alias target missing: ${mapped}`).toBe(true);
    }
  });

  it('maps only to existing catalog entries', () => {
    const catalogNames = new Set(EXERCISE_CATALOG.map((e) => e.name));
    for (const [from, to] of Object.entries(BLUEPRINT_TO_CATALOG)) {
      expect(catalogNames.has(to), `stale alias: ${from} -> ${to}`).toBe(true);
    }
  });

  it('returns null for unknown names', () => {
    expect(catalogNameFor('Not A Real Movement')).toBeNull();
  });
});
