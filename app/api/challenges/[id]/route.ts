import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, requireApiUserId } from '@/lib/api';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireApiUserId();
    const { id } = await ctx.params;
    const challenge = await db.challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        days: { orderBy: { dayNumber: 'asc' }, include: { tasks: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!challenge) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    // Challenge-only visibility: unenrolled members see the same 3-day
    // preview as the landing grid. Full circuits require an enrollment.
    const enrollment = await db.enrollment.findUnique({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json({ ...challenge, days: challenge.days.slice(0, 3) });
    }
    return NextResponse.json(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}
