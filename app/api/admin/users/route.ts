import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';

export async function GET() {
  try {
    await requireAdminUserId();
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: { select: { enrollments: true, sessions: true } },
      },
    });
    return NextResponse.json(users);
  } catch (err) {
    return handleApiError(err);
  }
}
