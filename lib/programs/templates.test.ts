import { describe, it, expect } from 'vitest';
import {
  programTemplates,
  getTemplateBySlug,
} from './templates';
import { generatedProgramSchema } from '@/lib/schemas/program-generation';
import { EXERCISE_CATALOG } from '@/lib/exercise-catalog';
import { createAnalyzer } from '@/lib/form-engine/registry';
import { BASIC_EXERCISE_NAMES } from '@/lib/basic-exercises';
import { TRIAL_BLOCK } from '@/lib/challenge-blueprint';
import { catalogNameFor } from '@/lib/exercise-aliases';

describe('program templates', () => {
  it('ships at least the four required established programs', () => {
    // Issue #37 asks for 5/3/1, GZCLP, a PPL split and an Upper/Lower split.
    expect(programTemplates.length).toBeGreaterThanOrEqual(4);
    const slugs = programTemplates.map((t) => t.slug);
    expect(slugs).toContain('531-bbb-4day');
    expect(slugs).toContain('gzclp-3day');
    expect(slugs).toContain('ppl-6day');
    expect(slugs).toContain('upper-lower-4day');
  });

  it('ships the expanded catalog added in issue #59', () => {
    // Issue #59 adds Starting Strength, StrongLifts 5x5, Madcow, PHUL, PHAT and
    // a beginner Full Body 3x template on top of the original five.
    const slugs = programTemplates.map((t) => t.slug);
    expect(slugs).toContain('starting-strength-3day');
    expect(slugs).toContain('stronglifts-5x5-3day');
    expect(slugs).toContain('madcow-5x5-3day');
    expect(slugs).toContain('phul-4day');
    expect(slugs).toContain('phat-5day');
    expect(slugs).toContain('full-body-3day');
    expect(programTemplates.length).toBeGreaterThanOrEqual(11);
  });

  it('every new #59 template materializes into a valid program with runnable workouts', () => {
    const newSlugs = [
      'starting-strength-3day',
      'stronglifts-5x5-3day',
      'madcow-5x5-3day',
      'phul-4day',
      'phat-5day',
      'full-body-3day',
    ];
    for (const slug of newSlugs) {
      const template = getTemplateBySlug(slug);
      expect(template, `${slug} should exist`).toBeDefined();
      const result = generatedProgramSchema.safeParse(template!.program);
      expect(result.success, `${slug} should validate`).toBe(true);
      // A runnable program: at least one workout, each with at least one set.
      expect(template!.program.workouts.length).toBeGreaterThan(0);
      for (const w of template!.program.workouts) {
        expect(w.exercises.length).toBeGreaterThan(0);
        for (const ex of w.exercises) {
          expect(ex.targetSets).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has unique slugs', () => {
    const slugs = programTemplates.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every template program validates against the build schema', () => {
    for (const t of programTemplates) {
      const result = generatedProgramSchema.safeParse(t.program);
      expect(result.success, `${t.slug} should be valid`).toBe(true);
    }
  });

  it('every template has display metadata', () => {
    for (const t of programTemplates) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.summary.length).toBeGreaterThan(0);
      expect(t.attribution.length).toBeGreaterThan(0);
    }
  });

  it('every workout has at least one exercise with a valid rep range', () => {
    for (const t of programTemplates) {
      for (const w of t.program.workouts) {
        expect(w.exercises.length).toBeGreaterThan(0);
        for (const ex of w.exercises) {
          expect(ex.targetRepsMax).toBeGreaterThanOrEqual(ex.targetRepsMin);
        }
      }
    }
  });

  it('looks up a template by slug and returns undefined for an unknown slug', () => {
    expect(getTemplateBySlug('ppl-6day')?.name).toBe('Push / Pull / Legs (6-day)');
    expect(getTemplateBySlug('does-not-exist')).toBeUndefined();
  });

  it('ships seven free beginner templates with plain-language names', () => {
    const free = programTemplates.filter((t) => t.free);
    expect(free.map((t) => t.slug).sort()).toEqual(
      [
        'conditioning-basics',
        'dumbbell-basics',
        'full-body-basics',
        'kettlebell-foundations',
        'legs-day-basics',
        'pull-day-basics',
        'push-day-basics',
      ].sort(),
    );
    for (const t of free) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.summary.length).toBeGreaterThan(0);
    }
  });

  it('every free-template exercise exists in the catalog exactly and is AI-mapped', () => {
    const catalogNames = new Set(EXERCISE_CATALOG.map((e) => e.name));
    for (const t of programTemplates.filter((x) => x.free)) {
      for (const w of t.program.workouts) {
        expect(w.exercises.length).toBeGreaterThan(0);
        for (const e of w.exercises) {
          expect(catalogNames.has(e.name), `${t.slug}: ${e.name} not in catalog`).toBe(true);
          expect(
            createAnalyzer(e.name) !== null,
            `${t.slug}: ${e.name} has no AI form check`,
          ).toBe(true);
        }
      }
    }
  });

  it('the basics set covers the free-trial exceptions', () => {
    for (const t of TRIAL_BLOCK.tasks) {
      const mapped = catalogNameFor(t.name);
      expect(mapped, `trial task unmapped: ${t.name}`).not.toBeNull();
      expect(BASIC_EXERCISE_NAMES.has(mapped!)).toBe(true);
    }
    expect(BASIC_EXERCISE_NAMES.size).toBeGreaterThan(20);
  });
});
