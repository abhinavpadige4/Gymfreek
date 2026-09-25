import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminChallengeBuilder } from '@/components/admin/admin-challenge-builder';

// Admin challenge builder: full day + movement management for one challenge.
export default async function AdminChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const challenge = await db.challenge.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!challenge) notFound();

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Link href="/admin" className="text-sm text-muted-foreground underline">
          Back to admin dashboard
        </Link>
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">100XU CONTROL</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {challenge.title}
          </h1>
        </div>
        <AdminNav />
        <AdminChallengeBuilder
          challenge={{
            id: challenge.id,
            title: challenge.title,
            slug: challenge.slug,
            isActive: challenge.isActive,
          }}
          days={challenge.days.map((d) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            focus: d.focus,
            tasks: d.tasks.map((t) => ({
              id: t.id,
              exerciseName: t.exerciseName,
              targetReps: t.targetReps,
              rounds: t.rounds,
              loadLabel: t.loadLabel,
              instructions: t.instructions,
              demoVideoUrl: t.demoVideoUrl,
              order: t.order,
            })),
          }))}
        />
      </div>
    </main>
  );
}
