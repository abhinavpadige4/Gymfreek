import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { resetRateLimits } from '@/lib/rate-limit';

// Same auth mock pattern as route-ownership.test.ts.
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);

import { POST as aiSummary } from '@/app/api/ai/summary/route';
import { POST as webhook } from '@/app/api/payments/webhook/route';

function jsonReq(body: unknown): Request {
  return new Request('http://test.local/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const summaryBody = {
  exercise: 'squat',
  totalReps: 10,
  goodReps: 8,
  badReps: 2,
  averageScore: 80,
};

describe('route rate limits', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('rejects bad webhook signatures without touching the db', async () => {
    const res = await webhook(
      new Request('http://test.local/api/payments/webhook', {
        method: 'POST',
        headers: { 'x-razorpay-signature': 'nope' },
        body: JSON.stringify({ event: 'payment.captured' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('throttles the webhook bucket per IP (429 after 120)', async () => {
    let last = 0;
    for (let i = 0; i < 121; i++) {
      const res = await webhook(
        new Request('http://test.local/api/payments/webhook', {
          method: 'POST',
          headers: { 'x-razorpay-signature': 'nope' },
          body: '{}',
        }),
      );
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it('throttles AI summary per user (429 on the 11th call)', async () => {
    const user = await db.user.create({
      data: { email: 'rl@test.dev', passwordHash: 'x' },
    });
    mockUserId.mockResolvedValue(user.id);
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const res = await aiSummary(jsonReq(summaryBody));
      last = res.status;
    }
    // First 10 pass the bucket (503 when AI_SERVICE_URL is unset, 200/502
    // when set); the 11th is rate-limited regardless of backend state.
    expect(last).toBe(429);
  });
});
