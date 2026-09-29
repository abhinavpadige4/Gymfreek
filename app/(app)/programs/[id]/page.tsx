import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { ProgramDetailView } from '@/components/programs/program-detail-view';
import { isVisibleExercise } from '@/lib/basic-exercises';
import { best1RM } from '@/lib/stats';
import { roundWeight, toDisplayWeight, unitLabel } from '@/lib/units';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage(props: Props) {
  const params = await props.params;
  const session = await requireSession();

  const program = await db.program.findFirst({
    where: { id: params.id, userId: session.userId },
    include: {
      workouts: {
        orderBy: { order: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
  });

  if (!program) notFound();

  const exercisesCatalog = await db.exercise.findMany({
    where: { userId: session.userId },
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });

  // Best e1RM per exercise for the guided template rows (challenge-style
  // Best chip). One grouped read; templates are small.
  const [unitRow, historySets] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { unit: true } }),
    db.set.findMany({
      where: {
        exercise: { userId: session.userId },
        isWarmup: false,
        weight: { gt: 0 },
      },
      select: { exerciseId: true, weight: true, reps: true, isWarmup: true },
    }),
  ]);
  const unit = unitRow?.unit ?? 'KG';
  const byExercise = new Map<string, { weight: number; reps: number; isWarmup: boolean }[]>();
  for (const s of historySets) {
    const list = byExercise.get(s.exerciseId) ?? [];
    list.push(s);
    byExercise.set(s.exerciseId, list);
  }
  const bests: Record<string, string> = {};
  for (const [exerciseId, sets] of byExercise) {
    const best = best1RM(sets);
    if (best > 0) bests[exerciseId] = `${roundWeight(toDisplayWeight(best, unit), 1)} ${unitLabel(unit)}`;
  }

  return (
    <main className="flex-1 px-4 py-6">
      <ProgramDetailView
        program={program}
        catalog={exercisesCatalog.filter((e) => isVisibleExercise(e.name))}
        bests={bests}
      />
    </main>
  );
}
