import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import catalog from '@/data/exercise-media.json';
import { exerciseMediaCoverage, getExerciseMedia } from './exercise-media';
import { exerciseNameDictionaries } from '@/i18n/exercise-names';

describe('exercise media catalog', () => {
  it('covers imported Alpha Progression names', () => {
    const imported = Object.keys(exerciseNameDictionaries.ru ?? {}).filter((name) =>
      name.includes('·'),
    );
    const names = [...imported, 'Шея зад · Misc'];
    const { missing } = exerciseMediaCoverage(names);
    expect(missing).toEqual([]);
  });

  // Blueprint entries mapped to the closest real frame set (same movement
  // family). Functional moves with no dataset at all (burpees, box jumps,
  // swings, carries, cleans) intentionally resolve to null so the dialog
  // shows its designed placeholder instead of a wrong photo.
  it('covers photo-backed blueprint entries', () => {
    const names = [
      'Barbell back squat',
      'Dumbbell Bulgarian split squats',
      'Dumbbell floor press with bridge hold',
      'Dumbbell push-up to snatch',
      'Dumbbell renegade rows',
      'Dumbbell renegade row to push-up',
      'Dumbbell Romanian deadlifts',
      'Dual dumbbell walking lunges',
      'Forward alternating dumbbell lunges',
      'Front-rack walking dumbbell lunges',
      'Hollow body dumbbell pullover',
      'Kettlebell goblet squats with pause',
      'Kettlebell gorilla rows',
      'Overhead dumbbell walking lunges',
      'Side plank dumbbell rotations',
      'Single-leg dumbbell Romanian deadlift',
      'Sled pull simulator bent kettlebell rows',
      'Spiderman push-ups on dumbbells',
      'Deficit push-ups on hex dumbbells',
      'Strict hand-release push-ups',
      'Suitcase walking lunges',
      'Sumo deadlift high pulls',
    ];
    const { missing } = exerciseMediaCoverage(names);
    expect(missing).toEqual([]);
  });

  it('routes movements without datasets to the designed placeholder', () => {
    for (const name of [
      'Full chest-to-deck burpees',
      'Russian kettlebell swings',
      'Plyo box jumps with step down',
      "Heavy kettlebell carry paces",
      'Dumbbell devil press',
      'Alternating dumbbell snatch',
    ]) {
      expect(getExerciseMedia(name)).toBeNull();
    }
  });

  it('keeps both local frames for every mapped dataset exercise', () => {
    for (const group of catalog.groups) {
      for (const frame of ['0.jpg', '1.jpg']) {
        expect(
          fs.existsSync(
            path.join(
              process.cwd(),
              'public',
              'exercise-media',
              'free-exercise-db',
              group.datasetId,
              frame,
            ),
          ),
        ).toBe(true);
      }
    }
  });

  it('returns null for an unknown custom exercise', () => {
    expect(getExerciseMedia('A future custom movement')).toBeNull();
  });
});
