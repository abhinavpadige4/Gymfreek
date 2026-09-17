import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { verifyPaymentSchema } from '@/lib/schemas/challenge';
import { verifyRazorpaySignature } from '@/lib/payments';

// Server-side activation only. Client "success" never activates.
export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const body = await parseJsonBody(req, verifyPaymentSchema);
    const payment = await db.payment.findUnique({
      where: { razorpayOrderId: body.razorpay_order_id },
      include: { enrollment: true },
    });
    if (!payment || payment.userId !== userId) throw new ApiError(404, 'Not found.');
    const demoAllowed =
      process.env.ALLOW_DEMO_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production';
    const valid = demoAllowed
      ? body.razorpay_order_id.startsWith('order_demo_')
      : verifyRazorpaySignature(
          body.razorpay_order_id,
          body.razorpay_payment_id,
          body.razorpay_signature,
        );
    if (!valid) {
      await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      throw new ApiError(400, 'Signature mismatch.');
    }
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { razorpayPaymentId: body.razorpay_payment_id, status: 'CAPTURED' },
      }),
      db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: 'ACTIVE', startDate: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
