import { z } from 'zod';

// Structured workout results from the browser AI engine (never video).
export const formIssueSchema = z.object({
  issueType: z.string().trim().min(1).max(60),
  count: z.number().int().min(1).max(100000),
  severity: z.enum(['LOW', 'MED', 'HIGH']).nullable().optional(),
});

export const exerciseResultSchema = z.object({
  exerciseName: z.string().trim().min(1).max(80),
  reps: z.number().int().min(0).max(100000),
  goodReps: z.number().int().min(0).max(100000),
  badReps: z.number().int().min(0).max(100000),
  averageScore: z.number().min(0).max(100),
  durationSec: z.number().int().min(0).max(86400).nullable().optional(),
  issues: z.array(formIssueSchema).max(20).default([]),
});

export const workoutResultsSchema = z.object({
  challengeId: z.string().min(1).nullable().optional(),
  challengeDayId: z.string().min(1).nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  durationSec: z.number().int().min(0).max(86400).nullable().optional(),
  results: z.array(exerciseResultSchema).min(1).max(30),
});

export type WorkoutResults = z.infer<typeof workoutResultsSchema>;
