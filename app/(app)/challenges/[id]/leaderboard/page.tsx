import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHALLENGE_DAY_CAP_SEC, medicalBracket } from '@/lib/challenge-rules';
import { notFound } from 'next/navigation';

export default async function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const challenge = await db.challenge.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!challenge) notFound();

  const [enrollments, sessions] = await Promise.all([
    db.enrollment.findMany({
      where: { challengeId: challenge.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: { user: { select: { displayName: true, email: true, medicalConditions: true, injuries: true } } },
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

  const rows = enrollments
    .map((e) => ({
      name: e.user.displayName ?? e.user.email,
      bracket: medicalBracket(`${e.user.medicalConditions ?? ''} ${e.user.injuries ?? ''}`),
      days: byUser.get(e.userId)?.count ?? 0,
      total: byUser.get(e.userId)?.total ?? 0,
    }))
    .sort((a, b) => b.days - a.days || a.total - b.total);

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
                  <span>
                    #{i + 1} {r.name}
                    <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {r.bracket}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.days}d - {Math.floor(r.total / 60)}m
                  </span>
                </li>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground">No valid attempts yet.</p>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
