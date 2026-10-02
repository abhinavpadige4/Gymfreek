import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { avatarUrl } from '@/lib/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHALLENGE_DAY_CAP_SEC, medicalBracket } from '@/lib/challenge-rules';
import { notFound } from 'next/navigation';

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const challenge = await db.challenge.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!challenge) notFound();

  const [enrollments, pendingEnrollments, sessions] = await Promise.all([
    db.enrollment.findMany({
      where: { challengeId: challenge.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: { user: { select: { displayName: true, email: true, avatarSeed: true, medicalConditions: true, injuries: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
    db.enrollment.findMany({
      where: { challengeId: challenge.id, status: 'PENDING' },
      include: { user: { select: { displayName: true, email: true, avatarSeed: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
    db.workoutSession.findMany({
      where: {
        challengeId: challenge.id,
        durationSec: { lte: CHALLENGE_DAY_CAP_SEC, gt: 0 },
      },
      select: { userId: true, durationSec: true },
    }),
  ]);

  const byUser = new Map<string, { count: number; total: number }>();
  for (const s of sessions) {
    const e = byUser.get(s.userId) ?? { count: 0, total: 0 };
    e.count += 1;
    e.total += s.durationSec ?? 0;
    byUser.set(s.userId, e);
  }

  const displayName = (name: string | null, email: string) => {
    const clean = (name ?? '').trim();
    if (clean) return clean;
    return email.split('@')[0] || 'Member';
  };

  const rows = enrollments
    .map((e) => ({
      name: displayName(e.user.displayName, e.user.email),
      avatar: avatarUrl(e.user.avatarSeed),
      bracket: medicalBracket(`${e.user.medicalConditions ?? ''} ${e.user.injuries ?? ''}`),
      days: byUser.get(e.userId)?.count ?? 0,
      total: byUser.get(e.userId)?.total ?? 0,
    }))
    .sort((a, b) => b.days - a.days || a.total - b.total);

  const pending = pendingEnrollments.map((e) => ({
    name: displayName(e.user.displayName, e.user.email),
    avatar: avatarUrl(e.user.avatarSeed),
  }));

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Link href={`/challenges/${challenge.slug}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to challenge
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{challenge.title} - Leaderboard</h1>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ranked by VALID days, then total best time</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {rows.map((r, i) => (
                <li key={`${r.name}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.avatar} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full bg-muted object-contain" loading="lazy" />
                    <span className="truncate">
                      #{i + 1} {r.name}
                      <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {r.bracket}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {r.days}d - {Math.floor(r.total / 60)}m
                  </span>
                </li>
              ))}
              {rows.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    No valid attempts yet. Valid means finished under 55:00. Join and finish Day 1 to appear here.
                  </p>
                  <Link href={`/challenges/${challenge.slug}`} className="text-sm font-semibold text-volt underline-offset-4 hover:underline">
                    Join and start Day 1
                  </Link>
                </div>
              )}
            </ol>
            {pending.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Joined - payment pending ({pending.length})
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {pending.map((p, i) => (
                    <li key={`pending-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatar} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full bg-muted object-contain" loading="lazy" />
                      <span className="truncate">{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
