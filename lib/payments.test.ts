import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyRazorpaySignature, verifyWebhookSignature } from '@/lib/payments';
import { challengeCreateSchema } from '@/lib/schemas/challenge';

beforeEach(() => {
  vi.stubEnv('RAZORPAY_KEY_SECRET', 'test_secret');
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');
});

describe('razorpay signatures', () => {
  it('accepts a correctly computed payment signature', () => {
    const sig = createHmac('sha256', 'test_secret').update('order_1|pay_1').digest('hex');
    expect(verifyRazorpaySignature('order_1', 'pay_1', sig)).toBe(true);
  });

  it('rejects a tampered payment signature', () => {
    expect(verifyRazorpaySignature('order_1', 'pay_1', '0'.repeat(64))).toBe(false);
  });

  it('accepts a correctly computed webhook signature', () => {
    const raw = JSON.stringify({ event: 'payment.captured' });
    const sig = createHmac('sha256', 'webhook_secret').update(raw).digest('hex');
    expect(verifyWebhookSignature(raw, sig)).toBe(true);
  });
});

describe('challenge schema', () => {
  it('rejects a bad slug', () => {
    const parsed = challengeCreateSchema.safeParse({
      slug: 'Bad Slug!',
      title: 'X',
      pricePaise: 100,
    });
    expect(parsed.success).toBe(false);
  });
});
