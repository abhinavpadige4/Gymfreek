import { db } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminProgramRow } from '@/components/admin/admin-program-row';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Admin programs overview: every member program in one place - owner, active
// state, template origin, size and session count. Inspect inline, open the
// owner profile, deactivate or delete (delete is blocked when sessions exist).
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
      user: { select: { id: true, email: true } },
      workouts: {
        orderBy: { order: 'asc' },
        select: { name: true, _count: { select: { exercises: true } } },
      },
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
              <AdminProgramRow
                key={p.id}
                program={{
                  id: p.id,
                  name: p.name,
                  isActive: p.isActive,
                  sourceTemplateSlug: p.sourceTemplateSlug,
                  ownerId: p.user.id,
                  ownerEmail: p.user.email,
                  workoutCount: p.workouts.length,
                  exerciseCount: p.workouts.reduce((s, w) => s + w._count.exercises, 0),
                  sessionCount: p._count.sessions,
                  workouts: p.workouts.map((w) => ({
                    name: w.name,
                    exerciseCount: w._count.exercises,
                  })),
                }}
              />
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
