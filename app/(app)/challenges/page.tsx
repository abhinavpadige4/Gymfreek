import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ChallengesPage() {
  const session = await requireSession();
  const [challenges, enrollments] = await Promise.all([
    db.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { days: true } } },
    }),
    db.enrollment.findMany({
      where: { userId: session.userId },
      select: { challengeId: true, status: true, currentDay: true },
    }),
  ]);
  const byId = new Map(enrollments.map((e) => [e.challengeId, e]));

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
          <p className="text-sm text-muted-foreground">
            Structured programs with daily tasks. 100XU is the first one.
          </p>
        </div>
        {challenges.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No challenges yet</CardTitle>
              <CardDescription>An admin can add one from the admin panel.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {challenges.map((c) => {
          const en = byId.get(c.id);
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {c.title}
                  {en && <Badge variant="secondary">{en.status}</Badge>}
                </CardTitle>
                <CardDescription>
                  {c._count.days} days - {(c.pricePaise / 100).toFixed(0)} {c.currency}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/challenges/${c.slug}`}>View</Link>
                </Button>
                {!en && (
                  <Button asChild>
                    <Link href={`/challenges/${c.slug}`}>Join</Link>
                  </Button>
                )}
                {en?.status === 'ACTIVE' && (
                  <Button asChild>
                    <Link href={`/challenges/${c.slug}`}>Day {en.currentDay}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
