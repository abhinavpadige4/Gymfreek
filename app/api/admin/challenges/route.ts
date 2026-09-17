import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { challengeDaySchema } from '@/lib/schemas/challenge';
import { z } from 'zod';

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
});

export async function POST(req: Request) {
  try {
    await requireAdminUserId();
    const { userId, role } = await parseJsonBody(req, setRoleSchema);
    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminUserId();
    const body = await parseJsonBody(
      req,
      z.object({ challengeId: z.string().min(1), day: challengeDaySchema }),
    );
    const day = await db.challengeDay.upsert({
      where: {
        challengeId_dayNumber: { challengeId: body.challengeId, dayNumber: body.day.dayNumber },
      },
      create: {
        challengeId: body.challengeId,
        dayNumber: body.day.dayNumber,
        title: body.day.title,
        focus: body.day.focus ?? null,
        tasks: {
          create: (body.day.tasks ?? []).map((t, i) => ({
            exerciseName: t.exerciseName,
            targetReps: t.targetReps,
            rounds: t.rounds ?? 1,
            loadKg: t.loadKg ?? null,
            loadLabel: t.loadLabel ?? null,
            instructions: t.instructions ?? null,
            demoVideoUrl: t.demoVideoUrl ?? null,
            order: t.order ?? i,
          })),
        },
      },
      update: { title: body.day.title, focus: body.day.focus ?? null },
    });
    return NextResponse.json(day);
  } catch (err) {
    return handleApiError(err);
  }
}
