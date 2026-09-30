import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { rateLimit } from '@/lib/rate-limit';
import { eraseUserAccount } from '@/lib/user-erase';

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
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
}).refine((v) => v.role !== undefined || v.status !== undefined, 'Nothing to update.');

export async function PUT(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const rl = rateLimit(`admin-users:${callerId}`, 60, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const input = await parseJsonBody(req, roleUpdateSchema);
    if (input.userId === callerId && (input.role !== undefined || input.status !== undefined)) {
      if (input.role === 'USER' || input.status === 'BLOCKED') {
        return NextResponse.json({ error: 'You cannot demote or block yourself.' }, { status: 400 });
      }
    }
    const target = await db.user.findUnique({
      where: { id: input.userId },
      select: { role: true, status: true },
    });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (input.role !== undefined && target.role === 'ADMIN' && input.role !== 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'The last admin cannot be demoted.' }, { status: 400 });
      }
    }
    const user = await db.user.update({
      where: { id: input.userId },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      select: { id: true, email: true, role: true, status: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteUserSchema = z.object({
  userId: z.string().trim().min(1).max(191),
});

// DELETE /api/admin/users: full erase with guards - never self, never the
// last admin. Same ordered erase as self-deletion.
export async function DELETE(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const rl = rateLimit(`admin-user-delete:${callerId}`, 10, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const input = await parseJsonBody(req, deleteUserSchema);
    if (input.userId === callerId) {
      return NextResponse.json({ error: 'You cannot delete your own account here.' }, { status: 400 });
    }
    const target = await db.user.findUnique({
      where: { id: input.userId },
      select: { role: true },
    });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (target.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'The last admin cannot be deleted.' }, { status: 400 });
      }
    }
    await eraseUserAccount(input.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
