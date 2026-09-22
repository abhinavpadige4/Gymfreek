import Link from 'next/link';
import { Layers, Plus } from 'lucide-react';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrainingDisplayName } from '@/i18n/training-names';

export default async function ProgramsPage() {
  const t = await getTranslations('programs');
  const common = await getTranslations('common');
  const format = await getFormatter();
  const locale = await getLocale();
  const session = await requireSession();
  const programs = await db.program.findMany({
    where: { userId: session.userId },
    orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    include: {
      _count: { select: { workouts: true, sessions: true } },
    },
  });

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-sm tracking-[0.3em] text-volt">TRAINING</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('subtitle')} {t('count', { count: programs.length })}
            </p>
          </div>
          <Button asChild className="min-h-tap">
            <Link href="/programs/new">
              <Plus className="size-4" />
              <span className="ml-2">{t('create')}</span>
            </Link>
          </Button>
        </div>

        {programs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <Layers className="size-8 text-volt" />
              <p className="font-display text-2xl">{t('noProgram')}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('noProgramDescription')}
              </p>
              <Button asChild className="mt-2">
                <Link href="/programs/new">
                  <Plus className="size-4" />
                  <span className="ml-2">{t('create')}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {programs.map((p) => {
              const total = p._count.workouts;
              const pct =
                total > 0 ? Math.min(100, Math.round((p._count.sessions / total) * 100)) : 0;
              return (
                <li key={p.id}>
                  <Link href={`/programs/${p.id}`} className="block h-full">
                    <Card
                      className={`h-full transition-colors hover:border-volt/60 ${p.isActive ? 'border-volt/30' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="font-display text-xl tracking-wide">
                            {getTrainingDisplayName(p.name, locale)}
                          </CardTitle>
                          {p.isActive ? (
                            <Badge>{t('active')}</Badge>
                          ) : (
                            <Badge variant="secondary">{common('states.inactive')}</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {t('startedOn', {
                            phase: p.phase,
                            date: format.dateTime(p.startDate, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }),
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 pt-0">
                        <p className="text-xs text-muted-foreground">
                          {t('listSummary', {
                            workouts: p._count.workouts,
                            logged: p._count.sessions,
                          })}
                        </p>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full bg-volt"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {p._count.sessions} / {total}{' '}
                          {t('sessionsProgressLabel')}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
