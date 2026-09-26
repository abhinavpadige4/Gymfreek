import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { requireAdminUserId } from '@/lib/admin';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeJoinButton } from '@/components/challenges/challenge-join-button';
import { CHALLENGE_DAY_CAP_SEC } from '@/lib/challenge-rules';

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const challenge = await db.challenge.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      days: { orderBy: { dayNumber: 'asc' }, include: { tasks: { orderBy: { order: 'asc' } } } },
    },
  });
  if (!challenge) notFound();
  const enrollment = await db.enrollment.findUnique({
    where: { userId_challengeId: { userId: session.userId, challengeId: challenge.id } },
  });
  // Same gate as the create-order bypass: admins join free.
  let adminBypass = false;
  try {
    adminBypass = (await requireAdminUserId()) === session.userId;
  } catch {
    adminBypass = false;
  }
  const bestSessions = enrollment
    ? await db.workoutSession.findMany({
        where: {
          userId: session.userId,
          challengeId: challenge.id,
          durationSec: { lte: CHALLENGE_DAY_CAP_SEC, gt: 0 },
        },
        select: { challengeDayId: true, durationSec: true },
      })
    : [];
  const bestByDay = new Map<string, number>();
  for (const s of bestSessions) {
    if (!s.challengeDayId || s.durationSec == null) continue;
    const prev = bestByDay.get(s.challengeDayId);
    if (prev == null || s.durationSec < prev) bestByDay.set(s.challengeDayId, s.durationSec);
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Card className="overflow-hidden border-volt/40">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-volt/25 via-card to-card p-6">
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-volt">
                100XU CHALLENGE
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [String(challenge.days.length), challenge.days.length === 1 ? 'Day' : 'Days'],
                ['1,000', 'Reps daily'],
                ['55:00', 'Time cap'],
                [
                  challenge.pricePaise === 0
                    ? 'Free'
                    : `Rs ${(challenge.pricePaise / 100).toLocaleString('en-IN')}`,
                  'One-time',
                ],
              ].map(([v, label]) => (
                <div key={label} className="flex flex-col rounded-xl bg-background/60 p-3">
                  <span className="font-display text-2xl text-volt">{v}</span>
                  <span className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <ChallengeJoinButton
              challengeId={challenge.id}
              pricePaise={challenge.pricePaise}
              currency={challenge.currency}
              adminBypass={adminBypass}
              enrollment={
                enrollment
                  ? { id: enrollment.id, status: enrollment.status, currentDay: enrollment.currentDay }
                  : null
              }
            />
            <Link
              href={`/challenges/${challenge.slug}/leaderboard`}
              className="text-sm text-volt underline-offset-4 hover:underline"
            >
              View leaderboard
            </Link>
          </div>
        </Card>
        {enrollment?.status === 'ACTIVE' && (
          <div className="grid gap-2 sm:grid-cols-2" aria-label="10-day blocks">
            {Array.from({ length: Math.ceil(challenge.days.length / 10) }, (_, b) => {
              const start = b * 10 + 1;
              const end = Math.min((b + 1) * 10, challenge.days.length);
              const done = challenge.days
                .filter((d) => d.dayNumber >= start && d.dayNumber <= end)
                .filter((d) => bestByDay.has(d.id)).length;
              const isCurrentBlock =
                enrollment.currentDay >= start && enrollment.currentDay <= end;
              const current = challenge.days.find((d) => d.dayNumber === enrollment.currentDay);
              return (
                <Card key={b} className={isCurrentBlock ? 'border-volt/60' : undefined}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Block {b + 1}: Days {start}-{end}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      {done}/{end - start + 1} days · same V1-V10 circuit each day
                    </p>
                    {isCurrentBlock && current && (
                      <Link
                        href={`/challenges/${challenge.slug}/day/${current.dayNumber}`}
                        className="text-sm font-semibold text-volt hover:underline"
                      >
                        Continue Day {current.dayNumber}: {current.title}
                      </Link>
                    )}
                    {!isCurrentBlock && done >= end - start + 1 && (
                      <p className="text-xs font-semibold text-[#35C759]">Badge earned</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {enrollment && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Day {enrollment.currentDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/challenges/${challenge.slug}/day/${enrollment.currentDay}`}
                  className="text-sm font-semibold text-volt hover:underline"
                >
                  Open today circuit
                </Link>
              </CardContent>
            </Card>
          )}
          {!enrollment && challenge.days.slice(0, 1).map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  What a day looks like
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  10 movements x 100 reps, one screen at a time, 55:00 info timer.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
