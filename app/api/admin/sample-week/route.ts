import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { rateLimit } from '@/lib/rate-limit';
import { buildSampleWeek, SAMPLE_EXERCISES } from '@/lib/sample-week';

const schema = z.object({
  userId: z.string().trim().min(1).max(191),
});

// Admin-only sample data: one finished gym session per plan day for the
// target user, so Progress charts and the muscle map have something to show.
// Gym sessions only (never challenge sessions), so the leaderboard, streaks
// and enrollments are untouched. Refuses when the user already trains.
export async function POST(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const rl = rateLimit(`admin-sample-week:${callerId}`, 10, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const input = await parseJsonBody(req, schema);
    const target = await db.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const existing = await db.session.count({
      where: { userId: target.id, finishedAt: { not: null }, startedAt: { gte: twoWeeksAgo } },
    });
    if (existing >= 3) {
      return NextResponse.json(
        { error: 'User already has recent training data. Sample week skipped.' },
        { status: 409 },
      );
    }

    const existingExercises = await db.exercise.findMany({
      where: { userId: target.id, name: { in: SAMPLE_EXERCISES.map((d) => d.name) } },
      select: { id: true, name: true },
    });
    const exerciseIds = new Map(existingExercises.map((e) => [e.name, e.id]));
    let exercisesCreated = 0;
    for (const def of SAMPLE_EXERCISES) {
      if (exerciseIds.has(def.name)) continue;
      const row = await db.exercise.create({
        data: {
          userId: target.id,
          name: def.name,
          muscleGroup: def.muscleGroup,
          category: def.category,
          usesBodyweight: def.usesBodyweight,
          equipmentType: def.equipmentType,
        },
        select: { id: true },
      });
      exerciseIds.set(def.name, row.id);
      exercisesCreated += 1;
    }

    const now = Date.now();
    let sessionsCreated = 0;
    let setsCreated = 0;
    for (const day of buildSampleWeek()) {
      const startedAt = new Date(now - day.daysAgo * 24 * 60 * 60 * 1000);
      const finishedAt = new Date(startedAt.getTime() + 45 * 60 * 1000);
      const session = await db.session.create({
        data: {
          userId: target.id,
          startedAt,
          finishedAt,
          notes: 'Sample week (admin mock data)',
        },
        select: { id: true },
      });
      sessionsCreated += 1;
      const perExerciseCount = new Map<string, number>();
      await db.set.createMany({
        data: day.sets.map((s) => {
          const n = (perExerciseCount.get(s.exerciseName) ?? 0) + 1;
          perExerciseCount.set(s.exerciseName, n);
          return {
            sessionId: session.id,
            exerciseId: exerciseIds.get(s.exerciseName)!,
            setNumber: n,
            weight: s.weight,
            reps: s.reps,
            durationSec: s.durationSec ?? null,
            isWarmup: false,
            completedAt: finishedAt,
          };
        }),
      });
      setsCreated += day.sets.length;
    }

    return NextResponse.json({ sessionsCreated, setsCreated, exercisesCreated });
  } catch (err) {
    return handleApiError(err);
  }
}
