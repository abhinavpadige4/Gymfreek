import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminUserCharts } from '@/components/admin/admin-charts';
import { volumeBuckets } from '@/lib/admin-stats';

interface Props {
  params: Promise<{ id: string }>;
}

function paiseToRs(amountPaise: number): string {
  return `Rs ${(amountPaise / 100).toLocaleString('en-IN')}`;
}

// Admin-only read-only account inspector. Deliberately no login-as: privacy
// boundary stops at viewing.
export default async function AdminUserPage(props: Props) {
  const params = await props.params;
  const session = await requireSession();
  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true, email: true },
  });
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase());
  if (me?.role !== 'ADMIN' && !adminEmails.includes(session.email.toLowerCase())) {
    notFound();
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      onboardingCompleted: true,
      medicalConditions: true,
      injuries: true,
      createdAt: true,
      enrollments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          currentDay: true,
          createdAt: true,
          challenge: { select: { title: true, slug: true } },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amountPaise: true,
          currency: true,
          status: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          createdAt: true,
        },
      },
      _count: { select: { sessions: true } },
    },
  });
  if (!user) notFound();

  const sessions = await db.session.findMany({
    where: { userId: user.id, finishedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { id: true, startedAt: true, finishedAt: true },
  });

  const windowStart = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const trainingSets = await db.set.findMany({
    where: {
      isWarmup: false,
      completedAt: { gte: windowStart },
      session: { userId: user.id },
    },
    select: { weight: true, reps: true, session: { select: { startedAt: true } } },
  });
  const training = volumeBuckets(
    trainingSets.map((s) => ({
      startedAt: s.session.startedAt,
      weight: s.weight ?? 0,
      reps: s.reps,
    })),
  );

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <AdminNav />
        <Link href="/admin" className="text-sm text-muted-foreground underline">
          Back to admin
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.displayName ?? user.email}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.role} · joined{' '}
            {user.createdAt.toLocaleDateString('en-IN')} · {user._count.sessions} sessions
          </p>
          {(user.medicalConditions || user.injuries) && (
            <p className="mt-1 text-sm text-amber-600">
              Medical: {[user.medicalConditions, user.injuries].filter(Boolean).join(' / ')}
            </p>
          )}
        </div>

        <AdminUserCharts weeks={training} unit="kg" />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollments ({user.enrollments.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {user.enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{e.challenge.title}</span>
                <Badge variant="secondary">
                  {e.status} d{e.currentDay}
                </Badge>
              </div>
            ))}
            {user.enrollments.length === 0 && (
              <p className="text-muted-foreground">No enrollments.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments ({user.payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {user.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {paiseToRs(p.amountPaise)} {p.currency}
                  <span className="text-muted-foreground"> · {p.razorpayOrderId ?? 'no order'}</span>
                </span>
                <Badge variant={p.status === 'CAPTURED' ? undefined : 'secondary'}>
                  {p.status}
                </Badge>
              </div>
            ))}
            {user.payments.length === 0 && (
              <p className="text-muted-foreground">No payments.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent finished sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{s.id.slice(0, 8)}</span>
                <span className="text-muted-foreground">
                  {s.startedAt.toLocaleDateString('en-IN')}
                </span>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-muted-foreground">No finished sessions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
