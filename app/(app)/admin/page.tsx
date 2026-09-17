import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
  const session = await requireSession();
  const me = await db.user.findUnique({ where: { id: session.userId }, select: { role: true, email: true } });
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase());
  const allowed = me?.role === 'ADMIN' || adminEmails.includes(session.email.toLowerCase());
  if (!allowed) {
    return (
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Admin only</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ask an admin to grant access or set ADMIN_EMAILS.
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const [challenges, users, enrollments] = await Promise.all([
    db.challenge.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { days: true, enrollments: true } } },
    }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, email: true, displayName: true, role: true, onboardingCompleted: true },
    }),
    db.enrollment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { challenge: { select: { title: true } }, user: { select: { email: true } } },
    }),
  ]);

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Challenges ({challenges.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span>
                  {c.title} <span className="text-muted-foreground">/{c.slug}</span>
                </span>
                <span className="flex gap-2">
                  <Badge variant="secondary">{c._count.days}d</Badge>
                  <Badge variant="secondary">{c._count.enrollments} users</Badge>
                  {!c.isActive && <Badge variant="destructive">off</Badge>}
                </span>
              </div>
            ))}
            {challenges.length === 0 && (
              <p className="text-muted-foreground">Seed 100XU with: npm run db:seed:challenge</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent enrollments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2">
                <span>{e.user.email} - {e.challenge.title}</span>
                <Badge variant="secondary">{e.status} d{e.currentDay}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <span>
                  {u.displayName ?? u.email} <span className="text-muted-foreground">{u.email}</span>
                </span>
                <Badge variant="secondary">{u.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Link href="/challenges" className="text-sm text-muted-foreground underline">
          View challenges
        </Link>
      </div>
    </main>
  );
}
