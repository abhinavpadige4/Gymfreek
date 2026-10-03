import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Lock, LockOpen } from 'lucide-react';
import { requireSession } from '@/lib/auth';
import { requireAdminUserId } from '@/lib/admin';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeJoinButton } from '@/components/challenges/challenge-join-button';
import { CHALLENGE_DAY_CAP_SEC } from '@/lib/challenge-rules';
import { streakFor } from '@/lib/challenge-progress';
import { blockNameForDay } from '@/lib/challenge-blueprint';
import { buildActivityDays } from '@/lib/activity';
import { StreakShowcase } from '@/components/challenges/streak-showcase';

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
  let enrollment = await db.enrollment.findUnique({
    where: { userId_challengeId: { userId: session.userId, challengeId: challenge.id } },
  });
  // Missed-day reset on view: a UTC gap since the last finish sends the
  // pointer back to Day 1. History rows stay, so bests survive.
  if (enrollment?.status === 'ACTIVE' && enrollment.currentDay > 1) {
    const streak = streakFor(enrollment.lastCompletedAt, enrollment.streakCount, new Date());
    if (streak.resetToDayOne) {
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { currentDay: 1, streakCount: 1 },
      });
    }
  }
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
        select: { challengeDayId: true, durationSec: true, startedAt: true },
      })
    : [];
  const bestByDay = new Map<string, number>();
  // Any session ever (valid or not): the day was touched before, so it stays
  // reopenable as practice even after a streak reset moves the pointer back.
  const touchedDays = new Set<string>();
  for (const s of bestSessions) {
    if (!s.challengeDayId) continue;
    touchedDays.add(s.challengeDayId);
    if (s.durationSec == null) continue;
    const prev = bestByDay.get(s.challengeDayId);
    if (prev == null || s.durationSec < prev) bestByDay.set(s.challengeDayId, s.durationSec);
  }

  return (
    <main className="flex-1 px-4 pb-6 pt-4 sm:py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="h-full overflow-hidden border-volt/40">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-volt/25 via-card to-card p-4 sm:p-6">
            <div className="min-w-0">
              <p className="font-display text-xs tracking-[0.3em] text-volt">
                100XU CHALLENGE
              </p>
              <h1 className="mt-1 break-words font-display text-2xl tracking-tight sm:text-4xl">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                [String(challenge.days.length), challenge.days.length === 1 ? 'Day' : 'Days'],
                ['1,000', 'Reps daily'],
                ['55:00', 'Time cap'],
              ].map(([v, label]) => (
                <div key={label} className="flex min-h-[72px] min-w-0 flex-col justify-center rounded-xl bg-background/60 p-3">
                  <span className="whitespace-nowrap font-display text-lg tabular-nums text-volt sm:text-2xl">{v}</span>
                  <span className="mt-0.5 truncate text-[11px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-volt/40 bg-volt/10 p-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Entry - one time</p>
                <p className="whitespace-nowrap font-display text-2xl tabular-nums text-volt sm:text-4xl">
                  {challenge.pricePaise === 0
                    ? 'Free'
                    : `Rs ${(challenge.pricePaise / 100).toLocaleString('en-IN')}`}
                </p>
              </div>
              <p className="shrink-0 rounded-full bg-volt px-3 py-1 text-xs font-bold text-black">
                7-day refund
              </p>
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
        <StreakShowcase
          days={buildActivityDays(
            bestSessions.map((s) => s.startedAt),
            26,
          )}
          streak={enrollment?.status === 'CANCELLED' ? 0 : (enrollment?.streakCount ?? 0)}
          currentDay={enrollment?.currentDay ?? 1}
          totalDays={challenge.days.length}
        />
        </div>
        {enrollment && enrollment.status !== 'CANCELLED' &&
          (() => {
            const active = enrollment.status === 'ACTIVE';
            const dayByNumber = new Map(challenge.days.map((d) => [d.dayNumber, d]));
            // Next day stays locked until 00:00 UTC when today already saw a finish.
            const sameUtcDay = (a: Date, b: Date) =>
              a.getUTCFullYear() === b.getUTCFullYear() &&
              a.getUTCMonth() === b.getUTCMonth() &&
              a.getUTCDate() === b.getUTCDate();
            const now = new Date();
            const midnightLocked =
              enrollment.currentDay > 1 &&
              enrollment.lastCompletedAt != null &&
              sameUtcDay(new Date(enrollment.lastCompletedAt), now) &&
              sameUtcDay(new Date(enrollment.updatedAt), now);
            return (
              <div className="flex flex-col gap-3" aria-label="Pick your day">
                <ol className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <li><span className="font-bold text-volt">1</span> Pick block</li>
                  <li aria-hidden>·</li>
                  <li><span className="font-bold text-volt">2</span> Pick day</li>
                  <li aria-hidden>·</li>
                  <li><span className="font-bold text-volt">3</span> Record each move</li>
                </ol>
                <p className="text-sm font-semibold" aria-live="polite">
                  Day {enrollment.currentDay} of {challenge.days.length}
                </p>
                {Array.from({ length: Math.ceil(challenge.days.length / 10) }, (_, b) => {
                  const start = b * 10 + 1;
                  const end = Math.min((b + 1) * 10, challenge.days.length);
                  const done = challenge.days
                    .filter((d) => d.dayNumber >= start && d.dayNumber <= end)
                    .filter((d) => bestByDay.has(d.id)).length;
                  const isCurrentBlock =
                    enrollment.currentDay >= start && enrollment.currentDay <= end;
                  // Mirrors the day-page gate: ACTIVE days below the pointer
                  // are always practicable, plus any touched day.
                  const canOpen = (n: number, d: { id: string } | undefined) =>
                    d != null &&
                    ((active && n < enrollment.currentDay) ||
                      bestByDay.has(d.id) ||
                      touchedDays.has(d.id));
                  const openCount = Array.from(
                    { length: end - start + 1 },
                    (_, i) => start + i,
                  ).filter(
                    (n) =>
                      (active && n === enrollment.currentDay && !midnightLocked) ||
                      canOpen(n, dayByNumber.get(n)),
                  ).length;
                  const blockName = blockNameForDay(start, challenge.days.length);
                  return (
                    <Card key={b} className={isCurrentBlock ? 'border-volt/60' : undefined}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">
                            {blockName ? `Block ${b + 1} - ${blockName}` : `Days ${start}-${end}`}
                          </span>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal tabular-nums text-muted-foreground">
                            {openCount}/{end - start + 1}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-2" role="list" aria-label={blockName ?? `Days ${start} to ${end}`}>
                          {Array.from({ length: end - start + 1 }, (_, i) => {
                            const n = start + i;
                            const d = dayByNumber.get(n);
                            const isToday = n === enrollment.currentDay;
                            const open = active && isToday && !midnightLocked;
                            const unlocked = !open && canOpen(n, d);
                            const label = open
                              ? `Start day ${n}`
                              : unlocked
                                ? `Day ${n} unlocked, tap to practice`
                                : `Day ${n} locked`;
                            const cls = open
                              ? 'border-volt bg-volt font-bold text-black'
                              : unlocked
                                ? 'border-volt/50 text-volt'
                                : 'border-border text-muted-foreground';
                            return (open || unlocked) && d ? (
                              <Link
                                key={n}
                                role="listitem"
                                aria-label={label}
                                href={`/challenges/${challenge.slug}/day/${n}`}
                                className={`flex min-h-tap min-w-tap flex-col items-center justify-center rounded-md border py-2 text-sm tabular-nums ${cls}`}
                              >
                                {n}
                                {unlocked && <LockOpen className="mt-0.5 size-3" aria-hidden />}
                              </Link>
                            ) : (
                              <span
                                key={n}
                                role="listitem"
                                aria-label={label}
                                className={`flex min-h-tap min-w-tap flex-col items-center justify-center rounded-md border py-2 text-sm tabular-nums ${cls}`}
                              >
                                {n}
                                <Lock className="mt-0.5 size-3" aria-hidden />
                              </span>
                            );
                          })}
                        </div>
                        {isCurrentBlock && midnightLocked && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Day {enrollment.currentDay} opens 00:00 UTC. Bests stay.
                          </p>
                        )}
                        {!isCurrentBlock && done >= end - start + 1 && (
                          <p className="mt-2 text-xs font-semibold text-[#35C759]">Badge earned</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {active && !midnightLocked && (
                  <Link
                    href={`/challenges/${challenge.slug}/day/${enrollment.currentDay}`}
                    className="sticky bottom-20 flex min-h-tap items-center justify-center rounded-xl bg-volt px-4 py-3 font-bold text-black shadow-lg lg:static"
                  >
                    Start Day {enrollment.currentDay}
                  </Link>
                )}
                <Link
                  href="/history"
                  className="flex min-h-tap items-center justify-center rounded-md border border-border px-4 py-3 text-sm font-semibold"
                >
                  All past workouts
                </Link>
              </div>
            );
          })()}
        <div className="flex flex-col gap-2">
          {enrollment && enrollment.status !== 'ACTIVE' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Day {enrollment.currentDay}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{enrollment.status}</p>
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
                  10x10 per move · 55:00 UTC timer
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
