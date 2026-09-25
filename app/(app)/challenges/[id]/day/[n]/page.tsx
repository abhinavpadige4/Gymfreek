import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayRunner } from '@/components/challenges/day-runner';
import { restFor, requiredTasksForDay } from '@/lib/challenge-rules';

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
  const enrollment = await db.enrollment.findUnique({
    where: { userId_challengeId: { userId: session.userId, challengeId: challenge.id } },
  });
  if (!enrollment || enrollment.status !== 'ACTIVE' || enrollment.currentDay !== dayNumber) {
    redirect(`/challenges/${challenge.slug}`);
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
        <h1 className="text-2xl font-bold tracking-tight">
          {day.title.startsWith('Day ') ? day.title : `Day ${day.dayNumber}: ${day.title}`}
        </h1>
        {day.focus && <p className="text-sm text-muted-foreground">{day.focus}</p>}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Today circuit - 55:00 cap
              {requiredTasks < day.tasks.length
                ? ` - recovery, any ${requiredTasks} of ${day.tasks.length}`
                : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayRunner
              challengeId={challenge.id}
              challengeDayId={day.id}
              tasks={day.tasks.map((t) => ({
                exerciseName: t.exerciseName,
                loadLabel: t.loadLabel,
                instructions: t.instructions,
                demoVideoUrl: t.demoVideoUrl,
              }))}
              restSec={restSec}
              requiredTasks={requiredTasks}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
