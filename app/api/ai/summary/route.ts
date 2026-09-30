import { NextResponse } from 'next/server';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import {
  isAiServiceConfigured,
  summarizeWorkoutViaService,
  workoutSummarySchema,
  AiServiceError,
} from '@/lib/ai-service';

// POST /api/ai/summary: bridge to the separate FastAPI service. Accepts a
// structured workout summary (never video) and returns structured coaching.
// 503 when AI_SERVICE_URL is unset - the browser-only flow does not depend on it.
export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    // External LLM cost lives behind this route: strict per-user bucket.
    const rl = rateLimit(`ai-summary:${userId}`, 10, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many AI requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const summary = await parseJsonBody(req, workoutSummarySchema);
    if (!isAiServiceConfigured()) {
      throw new ApiError(503, 'AI service is not configured.');
    }
    const coaching = await summarizeWorkoutViaService(summary);
    return NextResponse.json(coaching);
  } catch (err) {
    if (err instanceof AiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleApiError(err);
  }
}
