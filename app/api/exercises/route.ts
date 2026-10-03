import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exerciseInputSchema } from '@/lib/schemas/exercise';
import { handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';

export async function GET() {
  try {
    const userId = await requireApiUserId();
    const exercises = await db.exercise.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(exercises);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const data = await parseJsonBody(req, exerciseInputSchema);
    // Re-creating a removed name revives the archived row instead of
    // colliding with it: history attached to it becomes reachable again.
    const archived = await db.exercise.findFirst({
      where: { userId, name: data.name, archivedAt: { not: null } },
      select: { id: true },
    });
    if (archived) {
      const revived = await db.exercise.update({
        where: { id: archived.id, userId },
        data: { ...data, notes: data.notes ?? null, archivedAt: null },
      });
      return NextResponse.json(revived);
    }
    const exercise = await db.exercise.create({
      data: { ...data, userId, notes: data.notes ?? null },
    });
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
