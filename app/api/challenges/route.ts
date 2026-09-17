import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { challengeCreateSchema } from '@/lib/schemas/challenge';

export async function GET() {
  try {
    const challenges = await db.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        pricePaise: true,
        currency: true,
        _count: { select: { days: true } },
      },
    });
    return NextResponse.json(challenges);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUserId();
    const data = await parseJsonBody(req, challengeCreateSchema);
    const created = await db.challenge.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        pricePaise: data.pricePaise,
        currency: data.currency ?? 'INR',
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
