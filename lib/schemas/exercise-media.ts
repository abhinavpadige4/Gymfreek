import { z } from 'zod';
import {
  EXERCISE_IMAGE_MIME_TYPES,
  EXERCISE_VIDEO_MIME_TYPES,
} from '@/lib/exercise-video';

const maximumBase64Length = 7_100_000;
const maximumVideoBase64Length = 33_500_000;

export const exerciseTechniqueImageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  imageBase64: z.string().max(maximumBase64Length),
  mimeType: z.enum(EXERCISE_IMAGE_MIME_TYPES),
});

export type ExerciseTechniqueImageInput = z.infer<typeof exerciseTechniqueImageSchema>;

// One body for photo, video-link, and video-file modes; exactly one wins.
export const exerciseMediaUpsertSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    imageBase64: z.string().max(maximumBase64Length).optional(),
    mimeType: z.enum(EXERCISE_IMAGE_MIME_TYPES).optional(),
    videoUrl: z.string().trim().max(2048).optional(),
    videoBase64: z.string().max(maximumVideoBase64Length).optional(),
    videoMimeType: z.enum(EXERCISE_VIDEO_MIME_TYPES).optional(),
  })
  .refine(
    (v) =>
      Number(v.imageBase64 != null) +
        Number(v.videoUrl != null) +
        Number(v.videoBase64 != null) ===
      1,
    { message: 'Choose exactly one: photo upload, video link, or video file.' },
  )
  .refine((v) => v.imageBase64 == null || v.mimeType != null, {
    message: 'Uploaded photos require a MIME type.',
  })
  .refine((v) => v.videoBase64 == null || v.videoMimeType != null, {
    message: 'Uploaded videos require a MIME type.',
  });

export type ExerciseMediaUpsertInput = z.infer<typeof exerciseMediaUpsertSchema>;
