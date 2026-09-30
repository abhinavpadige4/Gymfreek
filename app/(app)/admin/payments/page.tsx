import { requireAdminPage } from '@/lib/admin-page';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminPayments } from '@/components/admin/admin-payments';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

const STATUSES = ['CAPTURED', 'REFUNDED', 'FAILED', 'CREATED'] as const;

// Payment support desk: filter by status, open any payment in Razorpay, and
// record completed refunds (which cancels the subscription).
export default async function AdminPaymentsPage(props: Props) {
  await requireAdminPage();
  const params = await props.searchParams;
  const status = (STATUSES as readonly string[]).includes(params.status ?? '')
    ? params.status!
    : undefined;

  const payments = await db.payment.findMany({
    where: status ? { status: status as (typeof STATUSES)[number] } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      amountPaise: true,
      currency: true,
      status: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      refundId: true,
      createdAt: true,
      user: { select: { email: true } },
      enrollment: { select: { challenge: { select: { title: true } } } },
    },
  });

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <AdminNav />
        <div>
          <h1 className="font-display text-3xl tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Money moves in the Razorpay dashboard. Mark completed refunds here to cancel the
            subscription.
          </p>
        </div>
        <form method="GET" className="flex flex-wrap gap-2">
          <Button
            type="submit"
            name="status"
            value=""
            variant={status ? 'outline' : 'secondary'}
            className="min-h-tap"
          >
            All
          </Button>
          {STATUSES.map((s) => (
            <Button
              key={s}
              type="submit"
              name="status"
              value={s}
              variant={status === s ? 'secondary' : 'outline'}
              className="min-h-tap"
            >
              {s}
            </Button>
          ))}
        </form>
        <AdminPayments
          payments={payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        />
      </div>
    </main>
  );
}
