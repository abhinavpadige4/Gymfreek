import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import {
  decodeExerciseImage,
  MAX_EXERCISE_IMAGE_BYTES,
  validateExerciseVideoUrl,
} from './exercise-technique-image';
import { toExerciseVideoEmbed } from './exercise-video';
import {
  exerciseMediaUpsertSchema,
  exerciseTechniqueImageSchema,
} from './schemas/exercise-media';

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('decodeExerciseImage', () => {
  it('accepts a matching data URL', () => {
    const { bytes, mimeType } = decodeExerciseImage(tinyPng, 'image/png');
    expect(mimeType).toBe('image/png');
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it('rejects unsupported MIME types', () => {
    const gif = 'data:image/gif;base64,R0lGODdhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs=';
    expect(() => decodeExerciseImage(gif)).toThrow(/JPEG, PNG, or WebP/);
  });

  it('rejects a declared MIME type that does not match the data URL', () => {
    expect(() => decodeExerciseImage(tinyPng, 'image/jpeg')).toThrow(/does not match/);
  });

  it('rejects empty and oversized payloads', () => {
    expect(() => decodeExerciseImage('', 'image/png')).toThrow(/non-empty/);
    const big = Buffer.alloc(MAX_EXERCISE_IMAGE_BYTES + 1).toString('base64');
    expect(() => decodeExerciseImage(big, 'image/png')).toThrow(/under 5 MB/);
  });
});

describe('exerciseTechniqueImageSchema', () => {
  it('requires a name, payload, and MIME type', () => {
    expect(
      exerciseTechniqueImageSchema.safeParse({
        name: 'Russian kettlebell swings',
        imageBase64: tinyPng,
        mimeType: 'image/png',
      }).success,
    ).toBe(true);
    expect(
      exerciseTechniqueImageSchema.safeParse({ name: '', imageBase64: tinyPng }).success,
    ).toBe(false);
  });
});

describe('validateExerciseVideoUrl', () => {
  it('accepts stream hosts and direct files over https', () => {
    expect(validateExerciseVideoUrl('https://www.youtube.com/watch?v=abc123XYZ_-')).toBe(
      'https://www.youtube.com/watch?v=abc123XYZ_-',
    );
    expect(validateExerciseVideoUrl('https://youtu.be/abc123XYZ_-')).toBe(
      'https://youtu.be/abc123XYZ_-',
    );
    expect(validateExerciseVideoUrl('https://example.com/swing.mp4')).toBe(
      'https://example.com/swing.mp4',
    );
  });

  it('rejects non-https links and unexpected pages', () => {
    expect(() => validateExerciseVideoUrl('http://example.com/swing.mp4')).toThrow(/https/);
    expect(() => validateExerciseVideoUrl('https://example.com/swing')).toThrow(
      /YouTube\/Vimeo/,
    );
    expect(() => validateExerciseVideoUrl('not a url')).toThrow(/https/);
  });
});

describe('toExerciseVideoEmbed', () => {
  it('builds nocookie embeds for YouTube shapes', () => {
    expect(toExerciseVideoEmbed('https://www.youtube.com/watch?v=abc123XYZ_-')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ_-',
    );
    expect(toExerciseVideoEmbed('https://youtu.be/abc123XYZ_-')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ_-',
    );
    expect(toExerciseVideoEmbed('https://www.youtube.com/shorts/abc123XYZ_-')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ_-',
    );
  });

  it('builds player embeds for Vimeo and passes files through', () => {
    expect(toExerciseVideoEmbed('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    );
    expect(toExerciseVideoEmbed('https://example.com/swing.mp4')).toBe(
      'https://example.com/swing.mp4',
    );
  });
});

describe('exerciseMediaUpsertSchema', () => {
  it('accepts exactly one mode', () => {
    const base = { name: 'Russian kettlebell swings' };
    expect(
      exerciseMediaUpsertSchema.safeParse({ ...base, videoUrl: 'https://youtu.be/x' })
        .success,
    ).toBe(true);
    expect(
      exerciseMediaUpsertSchema.safeParse({
        ...base,
        videoBase64: tinyPng,
        videoMimeType: 'image/png',
      }).success,
    ).toBe(false);
    expect(
      exerciseMediaUpsertSchema.safeParse({
        ...base,
        videoUrl: 'https://youtu.be/x',
        videoBase64: tinyPng,
        videoMimeType: 'video/mp4',
      }).success,
    ).toBe(false);
    expect(exerciseMediaUpsertSchema.safeParse(base).success).toBe(false);
  });
});
