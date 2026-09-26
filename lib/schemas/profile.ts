import { z } from 'zod';
import { Sex, TrainingGoal, WeightUnit, ExperienceLevel } from '@/lib/prisma-client';

// Max length of the free-text note to the coach (issue #188). Shared between
// the profile API's Zod bound and the coach-page UI's character counter so the
// limit lives in exactly one place.
export const COACH_NOTE_MAX_LEN = 500;

// User profile update (self-service). Every field is optional; null clears a
// value where the column is nullable.
export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80).nullable().optional(),
  // Bodyweight in kg, used to compute the effective tonnage on bodyweight
  // exercises. null reverts to the set.weight-only behavior.
  bodyweight: z.number().min(20, 'Too low').max(300, 'Too high').nullable().optional(),
  sex: z.nativeEnum(Sex).nullable().optional(),
  heightCm: z.number().int().min(100).max(250).nullable().optional(),
  goal: z.nativeEnum(TrainingGoal).nullable().optional(),
  weeklyFrequency: z.number().int().min(1).max(14).nullable().optional(),
  // Free-text note to the AI coach (issue #188): the user's own current context
  // (injuries, illness, life constraints). Trimmed and bounded; null clears it.
  // An all-whitespace note trims to "" - the route coerces that to null so a
  // blank save is a clear, not an empty-string note.
  coachNote: z
    .string()
    .trim()
    .max(COACH_NOTE_MAX_LEN, `Keep it under ${COACH_NOTE_MAX_LEN} characters`)
    .nullable()
    .optional(),
  // Preferred weight unit (display + input only; data stays in kg).
  unit: z.nativeEnum(WeightUnit).optional(),
  // Full onboarding for a training profile: DOB, health context, experience.
  // All optional and nullable so existing users are unaffected.
  dateOfBirth: z.coerce.date().max(new Date(), 'Must be in the past').nullable().optional(),
  medicalConditions: z.string().trim().max(1000).nullable().optional(),
  injuries: z.string().trim().max(1000).nullable().optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  avatarSeed: z.string().trim().min(1).max(40).nullable().optional(),
  instagram: z.string().trim().max(80).nullable().optional(),
  facebook: z.string().trim().max(80).nullable().optional(),
});

// Profile photo as a data URL (jpeg/png/webp, capped so the row stays small).
// Stored as bytes + mime on User; served back through /api/profile/photo.
export const PROFILE_PHOTO_MAX_BYTES = 500 * 1024;
export const PROFILE_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const profilePhotoSchema = z.object({
  dataUrl: z
    .string()
    .max(Math.ceil((PROFILE_PHOTO_MAX_BYTES * 4) / 3) + 100, 'Photo too large.')
    .refine(
      (s) =>
        PROFILE_PHOTO_MIMES.some((m) => s.startsWith(`data:${m};base64,`)),
      'Photo must be a jpeg, png or webp data URL.',
    ),
});

export type ProfilePhoto = z.infer<typeof profilePhotoSchema>;

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
