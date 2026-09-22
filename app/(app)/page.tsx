import Link from 'next/link';
import Image from 'next/image';
import { Play, AlertCircle, Lightbulb, Trophy, TrendingUp, Layers } from 'lucide-react';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { getCurrentSession, requireSession } from '@/lib/auth';
import { LandingPage } from '@/components/landing/landing-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getHomeInsight } from '@/lib/home-insight';
import { getTrainingDisplayName } from '@/i18n/training-names';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const QUICK_ACTIONS = [
  { href: '/session/new', icon: Play, title: 'startWorkout', description: 'startWorkoutDescription' },
  { href: '/progress', icon: TrendingUp, title: 'viewProgress', description: 'viewProgressDescription' },
  { href: '/programs', icon: Layers, title: 'browsePrograms', description: 'browseProgramsDescription' },
  { href: '/challenges', icon: Trophy, title: 'joinChallenge', description: 'joinChallengeDescription' },
] as const;

export default async function DashboardPage() {
  // Public landing for visitors, dashboard for members. The middleware lets
  // logged-out traffic reach /; every other (app) route still redirects.
  if (!(await getCurrentSession())) {
    return <LandingPage />;
  }
  const t = await getTranslations('dashboard');
  const common = await getTranslations('common');
  const format = await getFormatter();
  const locale = await getLocale();
  const session = await requireSession();

  // Look for an unfinished session to offer resuming it.
  const inProgressSession = await db.session.findFirst({
    where: { userId: session.userId, finishedAt: null },
    orderBy: { startedAt: 'desc' },
    include: { workout: { select: { name: true } } },
  });

  const activeProgram = await db.program.findFirst({
    where: { userId: session.userId, isActive: true },
    include: {
      workouts: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { exercises: true } } },
      },
    },
  });

  // Proactive coach insight (issue #237): the single highest-priority
  // deterministic signal (recommended deload / stalled lift / fresh PR /
  // on-track), composed from the existing derivations. Display-only, no LLM
  // call; null on a brand-new account with no history.
  const insight = await getHomeInsight(session.userId, new Date(), locale);

  // Read-only display aggregates over the member's own history. No logic
  // changes: counts and sums for the stats strip and the record card.
  const finishedWhere = { userId: session.userId, finishedAt: { not: null } };
  const [profile, workoutCount, repSum, bestSet, finishedSessions] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true },
    }),
    db.session.count({ where: finishedWhere }),
    db.set.aggregate({ _sum: { reps: true }, where: { session: finishedWhere } }),
    db.set.findFirst({
      where: { session: { userId: session.userId }, weight: { gt: 0 } },
      orderBy: { weight: 'desc' },
      select: {
        weight: true,
        exercise: { select: { name: true } },
      },
    }),
    db.session.findMany({
      where: finishedWhere,
      select: { startedAt: true, finishedAt: true },
    }),
  ]);
  const activeMinutes = finishedSessions.reduce(
    (acc, s) =>
      acc +
      (s.finishedAt
        ? Math.max(0, Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000))
        : 0),
    0,
  );
  const displayName = profile?.displayName || session.email;

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* HERO */}
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col items-start gap-3">
            <p className="font-display text-sm tracking-[0.3em] text-muted-foreground">
              {t('welcomeBack')}
            </p>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
              {t('greeting', { name: displayName })}
            </h1>
            <p className="text-muted-foreground">{t('heroSubtitle')}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/landing/challenge-boy.png"
              alt="100XU athlete"
              width={1024}
              height={1365}
              className="h-48 w-full object-cover object-top sm:h-56 lg:h-64"
            />
          </div>
        </div>

        {/* CHALLENGE */}
        <Card className="border-volt/40 shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
          <CardHeader className="pb-3">
            <p className="font-display text-sm tracking-[0.3em] text-volt">
              {t('challengeEyebrow')}
            </p>
            <CardTitle className="text-xl">{t('challengeTitle')}</CardTitle>
            <CardDescription>{t('challengeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="min-h-tap text-base">
              <Link href="/challenges">{t('viewChallenges')}</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-tap text-base">
              <Link href="/onboarding">{t('trainingProfile')}</Link>
            </Button>
          </CardContent>
        </Card>

        {insight && (
          <Link href={insight.href} className="block">
            <Card className="border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="size-4 text-primary" />
                  {insight.title}
                </CardTitle>
                <CardDescription>{insight.detail}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* PERSONAL RECORD */}
          {bestSet && (
            <Link href="/progress" className="block">
              <Card className="h-full transition-colors hover:border-volt/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="size-4 text-volt" />
                    {t('insight.prTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('heaviestSet', {
                      name: getTrainingDisplayName(bestSet.exercise.name, locale),
                      weight: format.number(bestSet.weight),
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* ACTIVE SESSION / PROGRAM STATE (existing branches, unchanged logic) */}
          {inProgressSession ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('activeSession')}</CardTitle>
                <CardDescription>
                  {t('startedOn', {
                    name: inProgressSession.workout?.name
                      ? getTrainingDisplayName(inProgressSession.workout.name, locale)
                      : t('sessionFallback'),
                    date: format.dateTime(inProgressSession.startedAt, {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="min-h-tap w-full text-base">
                  <Link href={`/session/${inProgressSession.id}`}>{t('resumeSession')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !activeProgram ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('noActiveProgram')}</CardTitle>
                <CardDescription>{t('noActiveProgramDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/programs">{t('viewPrograms')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : activeProgram.workouts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('emptyProgram')}</CardTitle>
                <CardDescription>
                  {t('emptyProgramDescription', {
                    name: getTrainingDisplayName(activeProgram.name, locale),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/programs/${activeProgram.id}`}>{t('configureProgram')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('startSession')}</CardTitle>
                <CardDescription>
                  {t('activeProgram', {
                    name: getTrainingDisplayName(activeProgram.name, locale),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="min-h-tap w-full text-base">
                  <Link href="/session/new">
                    <Play className="size-5" />
                    <span className="ml-2">{t('chooseSession')}</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="block">
                <Card className="h-full transition-colors hover:border-volt/60">
                  <CardContent className="flex flex-col gap-1.5 p-4">
                    <a.icon className="size-5 text-volt" />
                    <p className="text-sm font-semibold">{t(a.title)}</p>
                    <p className="text-xs text-muted-foreground">{t(a.description)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('yourStats')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('statWorkouts'), value: format.number(workoutCount) },
              { label: t('statReps'), value: format.number(repSum._sum.reps ?? 0) },
              { label: t('statMinutes'), value: format.number(activeMinutes) },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <span className="font-display text-3xl text-volt">{s.value}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PROGRAM SESSIONS (existing list, unchanged logic) */}
        {activeProgram && activeProgram.workouts.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('programSessions')}
            </h2>
            <ul className="flex flex-col gap-2">
              {activeProgram.workouts.map((w) => {
                const dayKey = w.dayOfWeek != null ? DAY_KEYS[w.dayOfWeek - 1] : null;
                const day = dayKey ? common(`days.${dayKey}`) : null;
                const empty = w._count.exercises === 0;
                return (
                  <li key={w.id}>
                    <Card>
                      <CardContent className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getTrainingDisplayName(w.name, locale)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {day && <Badge variant="secondary">{day}</Badge>}
                            <span>
                              {common('counts.exercises', { count: w._count.exercises })}
                            </span>
                            {empty && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertCircle className="size-3" />
                                {common('states.empty')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
