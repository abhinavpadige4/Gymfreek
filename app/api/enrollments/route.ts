import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';
import { enrollSchema } from '@/lib/schemas/challenge';

export async function GET() {
  try {
    const userId = await requireApiUserId();
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { challenge: { select: { slug: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(enrollments);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const { challengeId } = await parseJsonBody(req, enrollSchema);
    const challenge = await db.challenge.findFirst({
      where: { OR: [{ id: challengeId }, { slug: challengeId }] },
    });
    if (!challenge) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const enrollment = await db.enrollment.upsert({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      create: { userId, challengeId: challenge.id, status: 'PENDING', currentDay: 1 },
      update: {},
      include: { challenge: { select: { slug: true, title: true } } },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
