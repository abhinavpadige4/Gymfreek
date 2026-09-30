import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-page';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminChallengeCreate } from '@/components/admin/admin-challenge-create';

// Challenge management: create a challenge, then open its builder for days,
// movements, videos, and settings.
export default async function AdminChallengesPage() {
  await requireAdminPage();
  const challenges = await db.challenge.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { days: true, enrollments: true } } },
  });

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <AdminNav />
        <div>
          <h1 className="font-display text-3xl tracking-tight">Challenges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a challenge, then manage its days from the builder.
          </p>
        </div>
        <AdminChallengeCreate />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Challenges ({challenges.length})</CardTitle>
            <CardDescription>
              Manage days opens the full builder: days, movements, videos, settings, delete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{c.title}</span>{' '}
                  <span className="text-muted-foreground">/{c.slug}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{c._count.days}d</Badge>
                  <Badge variant="secondary">{c._count.enrollments} users</Badge>
                  {!c.isActive && <Badge variant="destructive">off</Badge>}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/challenges/${c.slug}`}>Manage days</Link>
                  </Button>
                  <Link
                    href={`/challenges/${c.slug}/leaderboard`}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Leaderboard
                  </Link>
                </span>
              </div>
            ))}
            {challenges.length === 0 && (
              <p className="text-muted-foreground">Seed 100XU with: npm run db:seed:challenge</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
