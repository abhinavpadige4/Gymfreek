'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

type Enrollment = { id: string; status: string; currentDay: number } | null;

export function ChallengeJoinButton({
  challengeId,
  pricePaise,
  currency,
  enrollment,
  adminBypass,
}: {
  challengeId: string;
  pricePaise: number;
  currency: string;
  enrollment: Enrollment;
  // Admins join free without touching Razorpay (server enforces the role).
  adminBypass?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function ensureEnrollment(): Promise<string> {
    if (enrollment) return enrollment.id;
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) throw new Error(data.error ?? 'Enroll failed.');
    return data.id;
  }

  async function join() {
    if (!accepted) {
      setError('Please accept the Terms, Privacy Policy and Refunds policy to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const enrollmentId = await ensureEnrollment();
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });
      const order = (await orderRes.json()) as {
        orderId?: string;
        keyId?: string | null;
        free?: boolean;
        alreadyActive?: boolean;
        error?: string;
      };
      if (!orderRes.ok) throw new Error(order.error ?? 'Order failed.');
      if (order.free || order.alreadyActive) {
        window.location.reload();
        return;
      }
      if (!order.orderId) throw new Error(order.error ?? 'Order failed.');
      if (pricePaise === 0 || !order.keyId || !window.Razorpay) {
        // Free challenge or keys not pasted yet: resolve via demo verify path.
        const verify = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: order.orderId,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: 'demo',
          }),
        });
        if (!verify.ok) {
          const d = (await verify.json().catch(() => null)) as { error?: string } | null;
          throw new Error(d?.error ?? 'Activation needs Razorpay keys (see .env.example).');
        }
        window.location.reload();
        return;
      }
      const rz = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: pricePaise,
        currency,
        handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resp),
          });
          window.location.reload();
        },
      });
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed.');
    } finally {
      setBusy(false);
    }
  }

  if (enrollment?.status === 'ACTIVE') {
    return <p className="text-sm text-muted-foreground">Enrolled - day {enrollment.currentDay} unlocked.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        One-time payment{pricePaise > 0 ? ` of Rs ${(pricePaise / 100).toLocaleString('en-IN')}` : ''}. 7-day refund to the original payment method.
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[#D94A05]"
        />
        <span>
          I agree to the{' '}
          <Link href="/terms" target="_blank" className="font-medium text-volt underline-offset-4 hover:underline">Terms</Link>
          {', '}
          <Link href="/privacy" target="_blank" className="font-medium text-volt underline-offset-4 hover:underline">Privacy Policy</Link>
          {' and '}
          <Link href="/refunds" target="_blank" className="font-medium text-volt underline-offset-4 hover:underline">Refunds</Link>
          .
        </span>
      </label>
      <Button onClick={join} disabled={busy || !accepted} className="min-h-tap">
        {busy
          ? 'Working...'
          : adminBypass
            ? 'Join free - admin'
            : pricePaise === 0
              ? 'Join free'
              : `Join - ${(pricePaise / 100).toFixed(0)} ${currency}`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
