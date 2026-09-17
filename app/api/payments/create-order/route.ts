import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { createOrderSchema } from '@/lib/schemas/challenge';

// Creates a Razorpay order for a PENDING enrollment. Never trusts the client
// for price: amount comes from the Challenge row.
export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const { enrollmentId } = await parseJsonBody(req, createOrderSchema);
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { challenge: true },
    });
    if (!enrollment || enrollment.userId !== userId) {
      throw new ApiError(404, 'Not found.');
    }
    if (enrollment.status === 'ACTIVE') {
      return NextResponse.json({ enrollment, orderId: null, alreadyActive: true });
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let orderId: string;
    if (keyId && keySecret) {
      const { default: Razorpay } = await import('razorpay');
      const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await client.orders.create({
        amount: enrollment.challenge.pricePaise,
        currency: enrollment.challenge.currency,
        receipt: enrollment.id.slice(0, 40),
      });
      orderId = order.id as string;
    } else {
      // ponytail: demo order so the UI flow works before keys are pasted.
      // verify/activate still requires real signature unless ALLOW_DEMO_PAYMENTS.
      orderId = `order_demo_${enrollment.id.slice(0, 12)}`;
    }
    await db.payment.create({
      data: {
        userId,
        enrollmentId: enrollment.id,
        amountPaise: enrollment.challenge.pricePaise,
        currency: enrollment.challenge.currency,
        razorpayOrderId: orderId,
        status: 'CREATED',
      },
    });
    return NextResponse.json({ orderId, keyId: keyId ?? null, enrollmentId: enrollment.id });
  } catch (err) {
    return handleApiError(err);
  }
}
