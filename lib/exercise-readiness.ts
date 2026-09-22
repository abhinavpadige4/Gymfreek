import { EXERCISE_CATALOG } from './exercise-catalog';
import { getExerciseMedia } from './exercise-media';
import { createAnalyzer } from './form-engine/registry';

export interface UploadFlags {
  hasPhoto: boolean;
  hasVideo: boolean;
}

export interface ExerciseReadiness {
  name: string;
  hasPhoto: boolean;
  hasFrames: boolean;
  hasVideo: boolean;
  hasCue: boolean;
  aiMapped: boolean;
  ready: boolean;
}

// Admin readiness table input: one row per blueprint catalog entry.
// READY means a user opening the movement sees a visual (uploaded photo or
// dataset frames) plus the technique cue. Video is a bonus, never required.
export function buildExerciseReadiness(
  uploads: Map<string, UploadFlags> | Record<string, UploadFlags>,
): ExerciseReadiness[] {
  const get = (name: string): UploadFlags => {
    const flags =
      uploads instanceof Map ? uploads.get(name) : (uploads as Record<string, UploadFlags>)[name];
    return { hasPhoto: flags?.hasPhoto ?? false, hasVideo: flags?.hasVideo ?? false };
  };
  return EXERCISE_CATALOG.map((entry) => {
    const flags = get(entry.name);
    const hasFrames = getExerciseMedia(entry.name) !== null;
    const hasCue = (entry.notes ?? '').trim().length > 0;
    return {
      name: entry.name,
      hasPhoto: flags.hasPhoto,
      hasFrames,
      hasVideo: flags.hasVideo,
      hasCue,
      aiMapped: createAnalyzer(entry.name) !== null,
      ready: (flags.hasPhoto || hasFrames) && hasCue,
    };
  });
}
