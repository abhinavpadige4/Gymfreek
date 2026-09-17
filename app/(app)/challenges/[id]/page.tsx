import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeJoinButton } from '@/components/challenges/challenge-join-button';

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

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{challenge.title}</h1>
        {challenge.description && (
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        )}
        <ChallengeJoinButton
          challengeId={challenge.id}
          pricePaise={challenge.pricePaise}
          currency={challenge.currency}
          enrollment={
            enrollment
              ? { id: enrollment.id, status: enrollment.status, currentDay: enrollment.currentDay }
              : null
          }
        />
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
