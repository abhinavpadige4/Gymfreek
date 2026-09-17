import { NextResponse } from 'next/server';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
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
    await requireApiUserId();
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
