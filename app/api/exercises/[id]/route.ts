import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exerciseInputSchema } from '@/lib/schemas/exercise';
import { ApiError, handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';

interface Params {
  params: Promise<{ id: string }>;
}

// Ownership is enforced by scoping every query with userId (issue #317):
// the reads that serve the responses are themselves the checks, and the
// writes carry userId in their where, so a stranger's id yields 404.

export async function GET(_req: Request, props: Params) {
  const params = await props.params;
  try {
    const userId = await requireApiUserId();
    const exercise = await db.exercise.findFirst({ where: { id: params.id, userId } });
    if (!exercise) throw new ApiError(404, 'Exercise not found.');
    return NextResponse.json(exercise);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, props: Params) {
  const params = await props.params;
  try {
    const userId = await requireApiUserId();
    const data = await parseJsonBody(req, exerciseInputSchema);
    const updated = await db.exercise.update({
      where: { id: params.id, userId },
      data: { ...data, notes: data.notes ?? null },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, props: Params) {
  const params = await props.params;
  try {
    const userId = await requireApiUserId();

    // Removal from the catalog: hard-delete when nothing references the
    // exercise, otherwise archive it (hide from every picker) so programs
    // and logged history keep working. Either way the catalog row is gone.
    const usage = await db.exercise.findFirst({
      where: { id: params.id, userId },
      select: {
        _count: { select: { programExercises: true, sets: true } },
      },
    });
    if (!usage) throw new ApiError(404, 'Exercise not found.');
    if (usage._count.programExercises > 0 || usage._count.sets > 0) {
      await db.exercise.update({
        where: { id: params.id, userId },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json({ ok: true, archived: true });
    }

    await db.exercise.delete({ where: { id: params.id, userId } });
    return NextResponse.json({ ok: true, archived: false });
  } catch (err) {
    return handleApiError(err);
  }
}
