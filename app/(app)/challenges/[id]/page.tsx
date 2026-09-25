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
          <div className="grid grid-cols-10 gap-1" aria-label="Daily tracker">
            {challenge.days.map((d) => {
              const isCurrent = d.dayNumber === enrollment.currentDay;
              const best = bestByDay.get(d.id);
              return (
                <Link
                  key={d.id}
                  href={isCurrent ? `/challenges/${challenge.slug}/day/${d.dayNumber}` : '#'}
                  aria-disabled={!isCurrent}
                  title={
                    best != null
                      ? `Day ${d.dayNumber} best ${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`
                      : `Day ${d.dayNumber}`
                  }
                  className={`flex aspect-square items-center justify-center rounded-sm border text-[10px] tabular-nums ${
                    best != null
                      ? 'border-[#35C759]/40 bg-[#35C759]/10'
                      : isCurrent
                        ? 'border-volt/60 bg-volt/10 font-bold'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {d.dayNumber}
                </Link>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {challenge.days.slice(0, 3).map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Day {d.dayNumber}: {d.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {d.focus && <p className="text-xs text-muted-foreground">{d.focus}</p>}
                <ul className="flex flex-col gap-1.5">
                  {d.tasks.map((t) => (
                    <li key={t.id} className="text-xs">
                      <span className="font-medium">
                        V{t.order + 1} {t.exerciseName}
                      </span>
                      <span className="text-muted-foreground">
                        {' - '}10 x 10 rounds{t.loadLabel ? ` - ${t.loadLabel}` : ''}
                      </span>
                      {t.instructions && (
                        <p className="text-muted-foreground">{t.instructions}</p>
                      )}
                      {t.demoVideoUrl && (
                        <a
                          href={t.demoVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          Watch demo
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {challenge.days.length > 3 && (
            <p className="text-xs text-muted-foreground">
              + {challenge.days.length - 3} more days after enrollment. Same V1-V10 circuit
              all 10 days of each block.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
