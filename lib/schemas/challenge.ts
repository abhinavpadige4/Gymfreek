import { z } from 'zod';

export const challengeCreateSchema = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  pricePaise: z.number().int().min(0).max(100000000),
  currency: z.string().trim().min(3).max(3).optional(),
  isActive: z.boolean().optional(),
});

export const challengeDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(365),
  title: z.string().trim().min(1).max(120),
  focus: z.string().trim().max(500).nullable().optional(),
  tasks: z
    .array(
      z.object({
        exerciseName: z.string().trim().min(1).max(80),
        targetReps: z.number().int().min(1).max(1000),
        rounds: z.number().int().min(1).max(50).optional(),
        loadKg: z.number().min(0).max(500).nullable().optional(),
        loadLabel: z.string().trim().max(120).nullable().optional(),
        instructions: z.string().trim().max(2000).nullable().optional(),
        demoVideoUrl: z.string().trim().url().max(500).nullable().optional(),
        order: z.number().int().min(0).max(100).optional(),
      }),
    )
    .max(30)
    .optional(),
});

export const enrollSchema = z.object({
  challengeId: z.string().min(1),
});

export const enrollmentUpdateSchema = z.object({
  enrollmentId: z.string().min(1),
  status: z.enum(['ACTIVE', 'CANCELLED']),
  currentDay: z.number().int().min(1).max(365).optional(),
});

export const challengeTaskCreateSchema = z.object({
  dayId: z.string().min(1),
  exerciseName: z.string().trim().min(1).max(80),
  targetReps: z.number().int().min(1).max(1000).default(10),
  rounds: z.number().int().min(1).max(50).default(10),
  loadKg: z.number().min(0).max(500).nullable().optional(),
  loadLabel: z.string().trim().max(120).nullable().optional(),
  instructions: z.string().trim().max(2000).nullable().optional(),
  demoVideoUrl: z.string().trim().url().max(500).nullable().optional(),
});

export const challengePatchSchema = z.object({
  challengeId: z.string().min(1),
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const challengeTaskPatchSchema = z.object({
  taskId: z.string().min(1),
  exerciseName: z.string().trim().min(1).max(80).optional(),
  targetReps: z.number().int().min(1).max(1000).optional(),
  rounds: z.number().int().min(1).max(50).optional(),
  loadKg: z.number().min(0).max(500).nullable().optional(),
  loadLabel: z.string().trim().max(120).nullable().optional(),
  instructions: z.string().trim().max(2000).nullable().optional(),
  demoVideoUrl: z.string().trim().url().max(500).nullable().optional(),
});

export const createOrderSchema = z.object({
  enrollmentId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type ChallengeCreate = z.infer<typeof challengeCreateSchema>;
