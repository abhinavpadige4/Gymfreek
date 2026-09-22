import { requireSession } from '@/lib/auth';
import { LiveWorkout } from '@/components/workout/live-workout';
import { createAnalyzer } from '@/lib/form-engine/registry';

// Live AI workout: ?exercise=squat (&challengeId= &challengeDayId= for
// challenge days). Any registry-mapped exercise starts the camera.
export default async function LiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string; challengeId?: string; challengeDayId?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const requested = (params.exercise ?? 'squat').trim();
  const exercise = createAnalyzer(requested) !== null ? requested : 'squat';

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
          challengeId={params.challengeId}
          challengeDayId={params.challengeDayId}
        />
      </div>
    </main>
  );
}
