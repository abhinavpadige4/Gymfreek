import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, readBodyWithCap } from '@/lib/api';
import { verifyWebhookSignature } from '@/lib/payments';

// Idempotent: duplicate deliveries of the same payment id are safe.
export async function POST(req: Request) {
  try {
    const raw = await readBodyWithCap(req, 1_000_000);
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    if (!verifyWebhookSignature(raw, signature)) {
      return NextResponse.json({ error: 'Bad signature.' }, { status: 400 });
    }
    const event = JSON.parse(raw) as {
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } };
    };
    const entity = event.payload?.payment?.entity;
    if (event.event !== 'payment.captured' || !entity?.order_id || !entity?.id) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    const payment = await db.payment.findUnique({
      where: { razorpayOrderId: entity.order_id },
    });
    if (!payment) return NextResponse.json({ ok: true, ignored: true });
    if (payment.status !== 'CAPTURED') {
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: { razorpayPaymentId: entity.id, status: 'CAPTURED' },
        }),
        db.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'ACTIVE', startDate: new Date() },
        }),
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
