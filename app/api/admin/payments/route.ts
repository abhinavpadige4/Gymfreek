import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { rateLimit } from '@/lib/rate-limit';

const refundSchema = z.object({
  paymentId: z.string().trim().min(1).max(191),
  // Razorpay refund id from the Razorpay dashboard (money moves there).
  refundId: z.string().trim().min(1).max(191),
  refundNote: z.string().trim().max(500).optional(),
});

// PUT /api/admin/payments: records a completed Razorpay refund locally and
// cancels the enrollment (the subscription). Only CAPTURED payments can be
// marked refunded; marking is one-way.
export async function PUT(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const rl = rateLimit(`admin-payments:${callerId}`, 60, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const input = await parseJsonBody(req, refundSchema);
    const payment = await db.payment.findUnique({
      where: { id: input.paymentId },
      select: { id: true, status: true, enrollmentId: true },
    });
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    if (payment.status !== 'CAPTURED') {
      return NextResponse.json(
        { error: 'Only captured payments can be marked refunded.' },
        { status: 400 },
      );
    }
    const [updated] = await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundId: input.refundId,
          refundNote: input.refundNote ?? null,
        },
        select: { id: true, status: true, refundId: true },
      }),
      db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: 'CANCELLED' },
      }),
    ]);
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
