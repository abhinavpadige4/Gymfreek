import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { verifyPaymentSchema } from '@/lib/schemas/challenge';
import { verifyRazorpaySignature } from '@/lib/payments';

// Server-side activation only. Client "success" never activates.
export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const rl = rateLimit(`pay-verify:${userId}`, 10, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
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
    if (!demoAllowed) {
      // Signature alone proves Razorpay signed this payment, not that it is
      // for our amount. Confirm amount + currency against the live payment so
      // a cheaper captured payment cannot activate a costlier enrollment.
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) throw new ApiError(503, 'Payment server not configured.');
      const { default: Razorpay } = await import('razorpay');
      const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const live = (await client.payments.fetch(body.razorpay_payment_id)) as unknown as {
        amount?: number | string;
        currency?: string;
        status?: string;
      };
      const liveAmount = Number(live.amount);
      const liveCurrency = String(live.currency ?? '').toUpperCase();
      if (
        !Number.isFinite(liveAmount) ||
        liveAmount !== payment.amountPaise ||
        liveCurrency !== payment.currency.toUpperCase() ||
        (live.status !== 'captured' && live.status !== 'authorized')
      ) {
        await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
        throw new ApiError(400, 'Payment details do not match this order.');
      }
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
