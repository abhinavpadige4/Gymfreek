import { z } from 'zod';

// Thin client for the separate FastAPI service (Gymfreek-ai repo). The two
// deploys connect over HTTPS + bearer token; they are never merged. Every
// payload is structured JSON - video never leaves the browser.

export const workoutSummarySchema = z.object({
  exercise: z.string().trim().min(1).max(80),
  totalReps: z.number().int().min(0).max(100000),
  goodReps: z.number().int().min(0).max(100000),
  badReps: z.number().int().min(0).max(100000),
  averageScore: z.number().min(0).max(100),
  issues: z.record(z.string(), z.number().int().min(0)).default({}),
  duration: z.number().int().min(0).max(86400).default(0),
});

export const coachOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  nextWorkoutAdvice: z.string().default(''),
  voiceMessage: z.string().default(''),
});

export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;
export type CoachOutput = z.infer<typeof coachOutputSchema>;

export class AiServiceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isAiServiceConfigured(): boolean {
  return Boolean(process.env.AI_SERVICE_URL);
}

function baseUrl(): string {
  const url = process.env.AI_SERVICE_URL;
  if (!url) throw new AiServiceError(503, 'AI service is not configured.');
  return url.replace(/\/$/, '');
}

async function callService<S extends z.ZodTypeAny>(
  path: string,
  body: unknown,
  schema: S,
): Promise<z.infer<S>> {
  const token = process.env.AI_SERVICE_TOKEN ?? '';
  let res: Response;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    res = await fetch(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
  } catch {
    throw new AiServiceError(502, 'AI service unreachable.');
  }
  if (!res.ok) {
    throw new AiServiceError(res.status === 401 ? 502 : res.status, 'AI service error.');
  }
  const parsed = schema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    throw new AiServiceError(502, 'AI service returned an invalid shape.');
  }
  return parsed.data;
}

export function summarizeWorkoutViaService(summary: WorkoutSummary): Promise<CoachOutput> {
  return callService('/ai/workout-summary', summary, coachOutputSchema);
}
