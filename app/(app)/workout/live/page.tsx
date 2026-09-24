import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { LiveWorkout } from '@/components/workout/live-workout';
import { createAnalyzer } from '@/lib/form-engine/registry';

// Live AI workout: ?exercise=squat (&challengeId= &challengeDayId= for
// challenge days). Any registry-mapped exercise starts the camera. Challenge
// context is only honored for enrolled members on unlocked days; anything
// else silently falls back to free mode (the results API rejects the rest).
export default async function LiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string; challengeId?: string; challengeDayId?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const requested = (params.exercise ?? 'squat').trim();
  const exercise = createAnalyzer(requested) !== null ? requested : 'squat';

  let challengeId: string | undefined;
  let challengeDayId: string | undefined;
  if (params.challengeDayId) {
    const day = await db.challengeDay.findUnique({
      where: { id: params.challengeDayId },
      select: { id: true, challengeId: true, dayNumber: true },
    });
    const enrollment = day
      ? await db.enrollment.findUnique({
          where: {
            userId_challengeId: { userId: session.userId, challengeId: day.challengeId },
          },
          select: { status: true, currentDay: true },
        })
      : null;
    if (
      day &&
      (!params.challengeId || params.challengeId === day.challengeId) &&
      enrollment &&
      (enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED') &&
      day.dayNumber <= enrollment.currentDay
    ) {
      challengeId = day.challengeId;
      challengeDayId = day.id;
    }
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{exercise}</h1>
          <p className="text-sm text-muted-foreground">
            Face the camera side-on, full body in frame.
          </p>
        </div>
        <LiveWorkout
          exercise={exercise}
          challengeId={challengeId}
          challengeDayId={challengeDayId}
        />
      </div>
    </main>
  );
}
