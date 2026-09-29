import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayRunner } from '@/components/challenges/day-runner';
import { restFor, requiredTasksForDay } from '@/lib/challenge-rules';
import { bestFor, streakFor } from '@/lib/challenge-progress';

export default async function ChallengeDayPage({
  params,
}: {
  params: Promise<{ id: string; n: string }>;
}) {
  const { id, n } = await params;
  const dayNumber = Number(n);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) notFound();
  const session = await requireSession();
  const challenge = await db.challenge.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      days: {
        where: { dayNumber },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!challenge || challenge.days.length === 0) notFound();
  const day = challenge.days[0]!;
  let enrollment = await db.enrollment.findUnique({
    where: { userId_challengeId: { userId: session.userId, challengeId: challenge.id } },
  });
  // Missed-day reset on view: history stays, pointer returns to Day 1.
  if (enrollment?.status === 'ACTIVE' && enrollment.currentDay > 1) {
    const streak = streakFor(enrollment.lastCompletedAt, enrollment.streakCount, new Date());
    if (streak.resetToDayOne) {
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { currentDay: 1, streakCount: 1 },
      });
    }
  }
  if (!enrollment) {
    redirect(`/challenges/${challenge.slug}`);
  }
  // Past work is always reopenable as practice: same flow, saved as a free
  // workout, the pointer never moves. Practice does not depend on enrollment
  // status, so a PENDING user still reaches what they already did. Only the
  // current day in normal mode requires ACTIVE; truly new future days lock.
  const isCurrentNormal =
    enrollment.status === 'ACTIVE' && dayNumber === enrollment.currentDay;
  let practice =
    dayNumber < enrollment.currentDay ||
    (enrollment.status === 'COMPLETED' && dayNumber <= enrollment.currentDay);
  if (!practice && dayNumber !== enrollment.currentDay) {
    const prior = await db.workoutSession.findFirst({
      where: { userId: session.userId, challengeDayId: day.id },
      select: { id: true },
    });
    practice = prior != null;
  }
  if (!practice && !isCurrentNormal) {
    redirect(`/challenges/${challenge.slug}`);
  }
  // Midnight-UTC unlock: a day that just became current today opens at 00:00 UTC.
  const sameUtcDay = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
  const now = new Date();
  const midnightLocked =
    !practice &&
    dayNumber > 1 &&
    enrollment.lastCompletedAt != null &&
    sameUtcDay(new Date(enrollment.lastCompletedAt), now) &&
    sameUtcDay(new Date(enrollment.updatedAt), now);
  if (midnightLocked) {
    return (
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Day {dayNumber}</h1>
          <Card className="border-volt/40">
            <CardContent className="p-6 text-center">
              <p className="font-display text-4xl tabular-nums">00:00 UTC</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Opens at midnight UTC. Bests stay.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
  // Bests per movement (max reps, tie-break score) from stored history.
  const history = await db.exerciseResult.findMany({
    where: { session: { userId: session.userId } },
    select: { exerciseName: true, reps: true, averageScore: true },
  });
  const bestByName = new Map<string, { reps: number; averageScore: number }>();
  for (const h of history) {
    const prev = bestByName.get(h.exerciseName);
    const cand = { reps: h.reps, averageScore: h.averageScore };
    const best = bestFor(prev ? [prev, cand] : [cand]);
    if (best) bestByName.set(h.exerciseName, best);
  }
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { medicalConditions: true, injuries: true },
  });
  const restSec = restFor(`${user?.medicalConditions ?? ''} ${user?.injuries ?? ''}`);
  const requiredTasks = requiredTasksForDay(dayNumber, day.tasks.length);

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Day {day.dayNumber}
            {practice && <span className="ml-2 text-base font-medium text-muted-foreground">Practice</span>}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            10x10 per move · 55:00 UTC{practice ? ' · saved as free workout' : ''}
          </p>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {requiredTasks < day.tasks.length
                ? `Any ${requiredTasks} of ${day.tasks.length}`
                : `All ${day.tasks.length} moves`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayRunner
              challengeId={challenge.id}
              challengeDayId={day.id}
              dayNumber={dayNumber}
              tasks={day.tasks.map((t) => ({
                exerciseName: t.exerciseName,
                loadLabel: t.loadLabel,
                instructions: t.instructions,
                demoVideoUrl: t.demoVideoUrl,
                best: bestByName.get(t.exerciseName) ?? null,
              }))}
              restSec={restSec}
              requiredTasks={requiredTasks}
              practice={practice}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
