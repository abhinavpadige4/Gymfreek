import { z } from 'zod';
import { ExperienceLevel, Sex, TrainingGoal } from '@/lib/prisma-client';

export const registerSchema = z.object({
  email: z.string().email('Invalid email').max(200),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password is too long'),
  displayName: z.string().trim().min(1).max(80).optional(),
  // Full training profile captured at signup so the account is complete:
  // body metrics, goal, experience and health context for rest rules.
  sex: z.nativeEnum(Sex),
  dateOfBirth: z.coerce.date().max(new Date(), 'Must be in the past').nullable().optional(),
  heightCm: z.number().int().min(100).max(250),
  bodyweight: z.number().min(20).max(300),
  goal: z.nativeEnum(TrainingGoal),
  weeklyFrequency: z.number().int().min(1).max(14),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  medicalConditions: z.string().trim().max(1000).nullable().optional(),
  injuries: z.string().trim().max(1000).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
