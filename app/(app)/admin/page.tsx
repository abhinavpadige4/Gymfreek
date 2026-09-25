import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { EXERCISE_CATALOG } from '@/lib/exercise-catalog';
import { buildExerciseReadiness } from '@/lib/exercise-readiness';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReadinessTable } from '@/components/admin/readiness-table';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminEnrollments } from '@/components/admin/admin-enrollments';
import { AdminChallengeCreate } from '@/components/admin/admin-challenge-create';
import { AdminActivityChart } from '@/components/admin/admin-charts';
import { activityBuckets } from '@/lib/admin-stats';

export default async function AdminPage() {
  const session = await requireSession();
  const me = await db.user.findUnique({ where: { id: session.userId }, select: { role: true, email: true } });
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase());
  const allowed = me?.role === 'ADMIN' || adminEmails.includes(session.email.toLowerCase());
  if (!allowed) {
    return (
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <p className="font-display text-3xl">Restricted area</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                This dashboard is for 100XU admins. Ask an admin to grant access
                or set ADMIN_EMAILS.
              </p>
              <Link href="/" className="text-sm font-medium text-volt hover:underline">
                Back to training
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [
    challenges,
    users,
    enrollments,
    payments,
    userCount,
    workoutsToday,
    uploads,
    activitySessions,
    activityEnrollments,
    activityPayments,
  ] = await Promise.all([
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
    db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { email: true } },
        enrollment: { select: { challenge: { select: { title: true } } } },
      },
    }),
    db.user.count(),
    db.session.count({ where: { startedAt: { gte: dayStart } } }),
    db.exerciseMediaUpload.findMany({
      select: { name: true, imageMimeType: true, videoUrl: true, videoMimeType: true },
    }),
    db.session.findMany({
      where: { startedAt: { gte: windowStart } },
      select: { startedAt: true },
    }),
    db.enrollment.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
    db.payment.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
  ]);
  const activity = activityBuckets(
    activitySessions.map((s) => s.startedAt),
    activityEnrollments.map((e) => e.createdAt),
    activityPayments.map((p) => p.createdAt),
  );

  const uploadFlags = new Map(
    uploads.map((u) => [
      u.name,
      {
        hasPhoto: u.imageMimeType != null,
        hasVideo: u.videoUrl != null || u.videoMimeType != null,
      },
    ]),
  );
  const readiness = buildExerciseReadiness(uploadFlags);
  const readyCount = readiness.filter((r) => r.ready).length;
  const photoCount = uploads.filter((u) => u.imageMimeType != null).length;
  const videoCount = uploads.filter((u) => u.videoUrl != null || u.videoMimeType != null).length;

  const overview = [
    { label: 'Users', value: String(userCount) },
    { label: 'Active challenges', value: String(challenges.filter((c) => c.isActive).length) },
    { label: 'Workouts today', value: String(workoutsToday) },
    { label: 'Catalog movements', value: String(EXERCISE_CATALOG.length) },
    { label: 'Exercise media', value: `${photoCount} photos · ${videoCount} videos` },
    { label: 'Movements ready', value: `${readyCount}/${readiness.length}` },
  ];

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">100XU CONTROL</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">Manage the 100XU fitness ecosystem.</p>
        </div>

        <AdminNav />

        <Card className="border-volt/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Start here - run a challenge in 4 steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2 text-sm">
              <li>
                <span className="font-display text-volt">01 - </span>
                Create the challenge below (title, link-name, price).
              </li>
              <li>
                <span className="font-display text-volt">02 - </span>
                Open it from the challenges list to add days and movements.
              </li>
              <li>
                <span className="font-display text-volt">03 - </span>
                <Link href="/admin/media" className="font-medium underline-offset-4 hover:underline">
                  Upload photos and videos
                </Link>{' '}
                for every movement.
              </li>
              <li>
                <span className="font-display text-volt">04 - </span>
                Watch enrollments and payments arrive below.
              </li>
            </ol>
          </CardContent>
        </Card>

        <AdminActivityChart days={activity} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {overview.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="font-display text-2xl text-volt">{s.value}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <ReadinessTable rows={readiness} />

        <AdminUsers users={users} currentUserId={session.userId} />

        <AdminChallengeCreate />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Challenges ({challenges.length})</CardTitle>
            <CardDescription>
              Manage days opens the full builder: days, movements, videos, settings, delete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{c.title}</span>{' '}
                  <span className="text-muted-foreground">/{c.slug}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{c._count.days}d</Badge>
                  <Badge variant="secondary">{c._count.enrollments} users</Badge>
                  {!c.isActive && <Badge variant="destructive">off</Badge>}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/challenges/${c.slug}`}>Manage days</Link>
                  </Button>
                  <Link
                    href={`/challenges/${c.slug}/leaderboard`}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Leaderboard
                  </Link>
                </span>
              </div>
            ))}
            {challenges.length === 0 && (
              <p className="text-muted-foreground">Seed 100XU with: npm run db:seed:challenge</p>
            )}
          </CardContent>
        </Card>

        <AdminEnrollments enrollments={enrollments} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
            <CardDescription>
              Latest Razorpay orders. CAPTURED means the member was activated.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {p.user.email} - {p.enrollment?.challenge.title ?? 'deleted challenge'}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground">
                    Rs {(p.amountPaise / 100).toLocaleString('en-IN')}
                  </span>
                  <Badge variant={p.status === 'CAPTURED' ? undefined : 'secondary'}>
                    {p.status}
                  </Badge>
                </span>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-muted-foreground">No payments yet.</p>
            )}
          </CardContent>
        </Card>

        <Link href="/challenges" className="text-sm text-muted-foreground underline">
          View challenges
        </Link>
      </div>
    </main>
  );
}
