import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody } from '@/lib/api';
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

const roleUpdateSchema = z.object({
  userId: z.string().trim().min(1).max(191),
  role: z.enum(['USER', 'ADMIN']),
});

export async function PUT(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const input = await parseJsonBody(req, roleUpdateSchema);
    if (input.userId === callerId && input.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 });
    }
    const target = await db.user.findUnique({
      where: { id: input.userId },
      select: { role: true },
    });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (target.role === 'ADMIN' && input.role !== 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'The last admin cannot be demoted.' }, { status: 400 });
      }
    }
    const user = await db.user.update({
      where: { id: input.userId },
      data: { role: input.role },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
