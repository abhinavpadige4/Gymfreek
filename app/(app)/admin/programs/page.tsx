import { db } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';
import { AdminNav } from '@/components/admin/admin-nav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Admin programs overview: every member program in one place - owner, active
// state, template origin, size and session count. Read-only; programs are
// managed by their owners (template ones are locked by design).
export default async function AdminProgramsPage() {
  await requireAdminPage();
  const programs = await db.program.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      phase: true,
      isActive: true,
      sourceTemplateSlug: true,
      updatedAt: true,
      user: { select: { email: true } },
      workouts: { select: { id: true, _count: { select: { exercises: true } } } },
      _count: { select: { sessions: true } },
    },
  });
  const exerciseTotal = programs.reduce(
    (sum, p) => sum + p.workouts.reduce((s, w) => s + w._count.exercises, 0),
    0,
  );

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">100XU CONTROL</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Programs</h1>
          <p className="mt-2 text-muted-foreground">
            {programs.length} recent programs · {exerciseTotal} programmed exercises.
          </p>
        </div>
        <AdminNav />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent programs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {programs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{p.name}</span>{' '}
                  <span className="text-muted-foreground">
                    {p.user.email} · {p.workouts.length} sessions · {p._count.sessions} logged
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {p.sourceTemplateSlug && <Badge variant="outline">locked</Badge>}
                  {p.isActive ? (
                    <Badge>active</Badge>
                  ) : (
                    <Badge variant="secondary">idle</Badge>
                  )}
                </span>
              </div>
            ))}
            {programs.length === 0 && (
              <p className="text-muted-foreground">No programs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
