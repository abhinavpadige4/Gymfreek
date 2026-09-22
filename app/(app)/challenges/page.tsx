import Link from 'next/link';
import Image from 'next/image';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChallengeWithMeta = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pricePaise: number;
  currency: string;
  _count: { days: number };
};

type EnrollmentInfo = {
  challengeId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentDay: number;
};

function priceLabel(c: ChallengeWithMeta): string {
  return `${(c.pricePaise / 100).toFixed(0)} ${c.currency}`;
}

function StatusBadge({ status }: { status: EnrollmentInfo['status'] }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="bg-[#35C759] text-black hover:bg-[#35C759]">{status}</Badge>
    );
  }
  if (status === 'ACTIVE') {
    return <Badge>{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function ProgressBar({ currentDay, totalDays }: { currentDay: number; totalDays: number }) {
  const pct = totalDays > 0 ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Day {currentDay} / {totalDays}
        </span>
        <span>{pct}% completion</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-volt" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Same destinations as before: the detail page owns join/payment/day routing.
function ChallengeCtas({
  challenge,
  enrollment,
  primaryLabel,
}: {
  challenge: ChallengeWithMeta;
  enrollment: EnrollmentInfo | undefined;
  primaryLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={`/challenges/${challenge.slug}`}>View Challenge</Link>
      </Button>
      {!enrollment && (
        <Button asChild>
          <Link href={`/challenges/${challenge.slug}`}>{primaryLabel}</Link>
        </Button>
      )}
      {enrollment?.status === 'ACTIVE' && (
        <Button asChild>
          <Link href={`/challenges/${challenge.slug}`}>Day {enrollment.currentDay}</Link>
        </Button>
      )}
    </div>
  );
}

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
  const [featured, ...rest] = challenges;

  // Dynamic grouping off the enrollment status. No enrollment (or a pending
  // one) reads as upcoming; only real rows create a section.
  const upcoming = rest.filter((c) => {
    const s = byId.get(c.id)?.status;
    return !s || s === 'PENDING' || s === 'CANCELLED';
  });
  const active = rest.filter((c) => byId.get(c.id)?.status === 'ACTIVE');
  const completed = rest.filter((c) => byId.get(c.id)?.status === 'COMPLETED');
  const sections = [
    { title: 'UPCOMING', items: upcoming },
    { title: 'ACTIVE', items: active },
    { title: 'COMPLETED', items: completed },
  ].filter((s) => s.items.length > 0);

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">100XU PROGRAMS</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Challenges</h1>
          <p className="mt-2 text-muted-foreground">
            Commit to the challenge. Build the habit. Become stronger.
          </p>
        </div>

        {challenges.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <Trophy className="size-8 text-volt" />
              <p className="font-display text-2xl">No challenges yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                The next 100-day wave is being built. An admin can publish one from
                the admin panel.
              </p>
            </CardContent>
          </Card>
        )}

        {featured && (
          <Card className="overflow-hidden border-volt/40 shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col gap-4 p-6 sm:p-8">
                <p className="font-display text-xl tracking-wide">
                  100<span className="text-volt">X</span>U
                </p>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-3xl tracking-tight">{featured.title}</h2>
                    {byId.get(featured.id) && (
                      <StatusBadge status={byId.get(featured.id)!.status} />
                    )}
                  </div>
                  {featured.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{featured.description}</p>
                  )}
                </div>
                <ul className="flex flex-wrap gap-2 text-xs font-semibold tracking-wider">
                  {[
                    `${featured._count.days} DAYS`,
                    'AI FORM TRACKING',
                    'DAILY WORKOUTS',
                    'PROGRESS TRACKING',
                  ].map((chip) => (
                    <li
                      key={chip}
                      className="rounded-sm border border-border bg-muted/60 px-2.5 py-1 text-muted-foreground"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
                {byId.get(featured.id) && (
                  <ProgressBar
                    currentDay={byId.get(featured.id)!.currentDay}
                    totalDays={featured._count.days}
                  />
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                  <p className="font-display text-2xl">
                    {(featured.pricePaise / 100).toFixed(0)}{' '}
                    <span className="text-sm text-muted-foreground">{featured.currency}</span>
                  </p>
                  <ChallengeCtas
                    challenge={featured}
                    enrollment={byId.get(featured.id)}
                    primaryLabel="Join Challenge"
                  />
                </div>
              </div>
              <div className="relative min-h-56">
                <Image
                  src="/landing/challenge-boy.png"
                  alt="Athlete wearing the 100XU vest"
                  fill
                  loading="lazy"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </Card>
        )}

        {sections.map((section) => (
          <section key={section.title} aria-label={section.title}>
            <h2 className="mb-3 font-display text-sm tracking-[0.3em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((c) => {
                const en = byId.get(c.id);
                return (
                  <Card
                    key={c.id}
                    className={cn(en?.status === 'COMPLETED' && 'border-[#35C759]/40')}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {c.title}
                        {en && <StatusBadge status={en.status} />}
                      </CardTitle>
                      <CardDescription>
                        {c._count.days} days - {priceLabel(c)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {c.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      {en && (
                        <ProgressBar currentDay={en.currentDay} totalDays={c._count.days} />
                      )}
                      <ChallengeCtas
                        challenge={c}
                        enrollment={en}
                        primaryLabel="Join Challenge"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
