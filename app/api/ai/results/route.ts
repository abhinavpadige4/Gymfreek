import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { workoutResultsSchema } from '@/lib/schemas/ai';
import { advanceEnrollment } from '@/lib/challenge-progress';
import { isValidAttemptForDay, requiredRepsForDay } from '@/lib/challenge-rules';
import { maybeAwardBadge } from '@/lib/badges';

// POST /api/ai/results: stores one completed live workout - session, per-exercise
// counts/scores and form issues. Structured JSON only; video is never accepted.
// When the workout belongs to a challenge day, the enrollment advances
// (currentDay forward, COMPLETED on the last day) - the single writer for it.
export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const data = await parseJsonBody(req, workoutResultsSchema);

    let advance: { id: string; status: 'ACTIVE' | 'COMPLETED'; currentDay: number } | null =
      null;
    // Challenge race rules: days 1-50 cap is info-only, days 51+ enforce
    // 55:00. Locked or future days are rejected outright.
    let validAttempt = true;
    let enoughReps = true;
    let awardedBlock: number | null = null;
    if (data.challengeDayId) {
      const day = await db.challengeDay.findUnique({
        where: { id: data.challengeDayId },
        include: { _count: { select: { tasks: true } } },
      });
      if (!day) throw new ApiError(404, 'Not found.');
      if (data.challengeId && day.challengeId !== data.challengeId) {
        throw new ApiError(400, 'Day does not belong to the challenge.');
      }
      const [totalDays, enrollment] = await Promise.all([
        db.challengeDay.count({ where: { challengeId: day.challengeId } }),
        db.enrollment.findUnique({
          where: { userId_challengeId: { userId, challengeId: day.challengeId } },
        }),
      ]);
      if (
        !enrollment ||
        (enrollment.status !== 'ACTIVE' && enrollment.status !== 'COMPLETED') ||
        day.dayNumber > enrollment.currentDay
      ) {
        throw new ApiError(403, 'This day is locked. Complete the current day first.');
      }
      const reportedReps = data.results.reduce((sum, r) => sum + r.reps, 0);
      enoughReps = reportedReps >= requiredRepsForDay(day.dayNumber, day._count.tasks);
      validAttempt = isValidAttemptForDay(data.durationSec, day.dayNumber);
      if (enoughReps && validAttempt && enrollment) {
        const next = advanceEnrollment(
          { status: enrollment.status, currentDay: enrollment.currentDay },
          day.dayNumber,
          totalDays,
        );
        if (next) advance = { id: enrollment.id, ...next };
      }
    }

    const session = await db.workoutSession.create({
      data: {
        userId,
        challengeId: data.challengeId ?? null,
        challengeDayId: data.challengeDayId ?? null,
        startedAt: data.startedAt ?? new Date(),
        completedAt: data.completedAt ?? new Date(),
        durationSec: data.durationSec ?? null,
        results: {
          create: data.results.map((r) => ({
            exerciseName: r.exerciseName,
            reps: r.reps,
            goodReps: r.goodReps,
            badReps: r.badReps,
            averageScore: r.averageScore,
            durationSec: r.durationSec ?? null,
            issues: {
              create: r.issues.map((i) => ({
                issueType: i.issueType,
                count: i.count,
                severity: i.severity ?? null,
              })),
            },
          })),
        },
      },
      select: { id: true, results: { select: { id: true } } },
    });
    if (advance) {
      await db.enrollment.update({
        where: { id: advance.id },
        data: { status: advance.status, currentDay: advance.currentDay },
      });
      // Badge: day 10/20/...100 completes its block.
      const dayNum = data.challengeDayId
        ? (await db.challengeDay.findUnique({ where: { id: data.challengeDayId }, select: { dayNumber: true } }))?.dayNumber
        : null;
      if (dayNum) awardedBlock = await maybeAwardBadge(userId, dayNum);
    }
    return NextResponse.json(
      {
        id: session.id,
        results: session.results.length,
        valid: validAttempt && enoughReps,
        awardedBlock,
        enrollment: advance
          ? { status: advance.status, currentDay: advance.currentDay }
          : undefined,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

// GET /api/ai/results: recent workout sessions with per-exercise summaries.
export async function GET() {
  try {
    const userId = await requireApiUserId();
    const items = await db.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        results: { include: { issues: true } },
        challengeDay: { select: { dayNumber: true, title: true } },
      },
    });
    return NextResponse.json(items);
  } catch (err) {
    return handleApiError(err);
  }
}
