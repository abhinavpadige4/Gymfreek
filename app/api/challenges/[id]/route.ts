import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, requireApiUserId } from '@/lib/api';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUserId();
    const { id } = await ctx.params;
    const challenge = await db.challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        days: { orderBy: { dayNumber: 'asc' }, include: { tasks: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!challenge) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}
