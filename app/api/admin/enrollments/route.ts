import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { enrollmentUpdateSchema } from '@/lib/schemas/challenge';

// PUT /api/admin/enrollments: admin subscription management - set an
// enrollment ACTIVE/CANCELLED and optionally reset its current day.
// COMPLETED is never assigned manually; it is earned by finishing.
export async function PUT(req: Request) {
  try {
    await requireAdminUserId();
    const data = await parseJsonBody(req, enrollmentUpdateSchema);
    const enrollment = await db.enrollment.findUnique({
      where: { id: data.enrollmentId },
      select: { id: true, challengeId: true },
    });
    if (!enrollment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (data.currentDay !== undefined) {
      const totalDays = await db.challengeDay.count({
        where: { challengeId: enrollment.challengeId },
      });
      if (data.currentDay > Math.max(totalDays, 1)) {
        return NextResponse.json({ error: 'Day exceeds the challenge length.' }, { status: 400 });
      }
    }
    const updated = await db.enrollment.update({
      where: { id: data.enrollmentId },
      data: {
        status: data.status,
        ...(data.currentDay !== undefined ? { currentDay: data.currentDay } : {}),
      },
      select: { id: true, status: true, currentDay: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
