import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { challengeTaskCreateSchema, challengeTaskPatchSchema } from '@/lib/schemas/challenge';

// POST /api/admin/challenge-tasks: append one task to a challenge day.
// PUT /api/admin/challenges upserts whole days; this covers the day-to-day
// "add one more movement" flow without resending the full task list.
export async function POST(req: Request) {
  try {
    await requireAdminUserId();
    const data = await parseJsonBody(req, challengeTaskCreateSchema);
    const day = await db.challengeDay.findUnique({
      where: { id: data.dayId },
      select: { id: true, _count: { select: { tasks: true } } },
    });
    if (!day) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const task = await db.challengeTask.create({
      data: {
        dayId: data.dayId,
        exerciseName: data.exerciseName,
        targetReps: data.targetReps,
        rounds: data.rounds,
        loadKg: data.loadKg ?? null,
        loadLabel: data.loadLabel ?? null,
        instructions: data.instructions ?? null,
        demoVideoUrl: data.demoVideoUrl ?? null,
        order: day._count.tasks,
      },
      select: { id: true, exerciseName: true, order: true },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/admin/challenge-tasks?taskId=: remove one task from a day.
export async function DELETE(req: Request) {
  try {
    await requireAdminUserId();
    const taskId = new URL(req.url).searchParams.get('taskId');
    if (!taskId) return NextResponse.json({ error: 'taskId required.' }, { status: 400 });
    await db.challengeTask.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/admin/challenge-tasks: edit one task's fields (reps, load,
// cue, demo video...). Only provided fields change.
export async function PATCH(req: Request) {
  try {
    await requireAdminUserId();
    const data = await parseJsonBody(req, challengeTaskPatchSchema);
    const updated = await db.challengeTask.update({
      where: { id: data.taskId },
      data: {
        ...(data.exerciseName !== undefined ? { exerciseName: data.exerciseName } : {}),
        ...(data.targetReps !== undefined ? { targetReps: data.targetReps } : {}),
        ...(data.rounds !== undefined ? { rounds: data.rounds } : {}),
        ...(data.loadKg !== undefined ? { loadKg: data.loadKg } : {}),
        ...(data.loadLabel !== undefined ? { loadLabel: data.loadLabel } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.demoVideoUrl !== undefined ? { demoVideoUrl: data.demoVideoUrl } : {}),
      },
      select: { id: true, exerciseName: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
