import { describe, expect, it } from 'vitest';
import { BASIC_EXERCISE_NAMES, isBasicExercise, isVisibleExercise } from './basic-exercises';

describe('basic-exercises', () => {
  it('keeps basics visible and hides challenge-only movements', () => {
    expect(isBasicExercise('Russian kettlebell swings')).toBe(true);
    expect(isVisibleExercise('Russian kettlebell swings')).toBe(true);
    expect(isBasicExercise('Kettlebell goblet reverse lunges')).toBe(false);
    expect(isVisibleExercise('Kettlebell goblet reverse lunges')).toBe(false);
  });

  it('keeps member custom exercises visible', () => {
    expect(isVisibleExercise('My Own Weird Lift')).toBe(true);
  });

  it('covers the trial exceptions', () => {
    expect(BASIC_EXERCISE_NAMES.has('Plyo box jumps with step down')).toBe(true);
    expect(BASIC_EXERCISE_NAMES.has('Heavy kettlebell carry paces')).toBe(true);
  });
});
