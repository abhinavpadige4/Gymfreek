'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminPayment {
  id: string;
  amountPaise: number;
  currency: string;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  refundId: string | null;
  createdAt: string;
  user: { email: string };
  enrollment: { challenge: { title: string } } | null;
}

// Payment support: refund flow is money-out in the Razorpay dashboard, then
// recorded here with the Razorpay refund id. Marking refunded auto-cancels
// the subscription. Failed orders link straight to Razorpay for retry detail.
export function AdminPayments({ payments }: { payments: AdminPayment[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [refundId, setRefundId] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function markRefunded(paymentId: string) {
    if (!refundId.trim()) {
      setError('Enter the Razorpay refund id first.');
      return;
    }
    if (!window.confirm('Mark this payment refunded and cancel the subscription?')) return;
    setBusyId(paymentId);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, refundId: refundId.trim(), refundNote: refundNote.trim() || undefined }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Refund recording failed.');
      setRefundFor(null);
      setRefundId('');
      setRefundNote('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refund recording failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payments ({payments.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {payments.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-medium">
                {p.user.email} - {p.enrollment?.challenge.title ?? 'deleted challenge'}
              </span>
              <Badge variant={p.status === 'CAPTURED' ? undefined : 'secondary'}>{p.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Rs {(p.amountPaise / 100).toLocaleString('en-IN')} {p.currency} ·{' '}
              {new Date(p.createdAt).toLocaleDateString('en-IN')}
              {p.razorpayPaymentId ? ` · pay ${p.razorpayPaymentId}` : ''}
              {p.refundId ? ` · refund ${p.refundId}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {p.razorpayPaymentId && (
                <a
                  href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-volt underline-offset-4 hover:underline"
                >
                  Open in Razorpay
                </a>
              )}
              {p.status === 'CAPTURED' &&
                (refundFor === p.id ? (
                  <span className="flex w-full flex-col gap-2">
                    <Input
                      placeholder="Razorpay refund id (rfnd_...)"
                      aria-label="Razorpay refund id"
                      value={refundId}
                      onChange={(e) => setRefundId(e.target.value)}
                      className="min-h-tap"
                    />
                    <Input
                      placeholder="Note (optional)"
                      aria-label="Refund note"
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      className="min-h-tap"
                    />
                    <span className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId !== null}
                        onClick={() => void markRefunded(p.id)}
                      >
                        Confirm refunded
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRefundFor(null)}
                      >
                        Cancel
                      </Button>
                    </span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId !== null}
                    onClick={() => {
                      setError(null);
                      setRefundId('');
                      setRefundNote('');
                      setRefundFor(p.id);
                    }}
                  >
                    Mark refunded
                  </Button>
                ))}
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <p className="text-muted-foreground">No payments match.</p>
        )}
      </CardContent>
    </Card>
  );
}
