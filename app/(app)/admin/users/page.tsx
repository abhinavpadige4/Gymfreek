import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-page';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminUsers } from '@/components/admin/admin-users';

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

// Member management: search, filter, and open any account for the full
// end-to-end treatment (subscription cancel, block, delete).
export default async function AdminUsersPage(props: Props) {
  const session = await requireAdminPage();
  const params = await props.searchParams;
  const q = (params.q ?? '').trim();
  const statusFilter = params.status === 'BLOCKED' ? 'BLOCKED' : params.status === 'ACTIVE' ? 'ACTIVE' : undefined;

  const users = await db.user.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { enrollments: true, sessions: true } },
    },
  });

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <AdminNav />
        <div>
          <h1 className="font-display text-3xl tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a member to manage their subscription, access, or account.
          </p>
        </div>
        <form method="GET" className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            aria-label="Search users"
            className="min-h-tap flex-1"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              name="status"
              value=""
              variant={statusFilter ? 'outline' : 'secondary'}
              className="min-h-tap"
            >
              All
            </Button>
            <Button
              type="submit"
              name="status"
              value="ACTIVE"
              variant={statusFilter === 'ACTIVE' ? 'secondary' : 'outline'}
              className="min-h-tap"
            >
              Active
            </Button>
            <Button
              type="submit"
              name="status"
              value="BLOCKED"
              variant={statusFilter === 'BLOCKED' ? 'secondary' : 'outline'}
              className="min-h-tap"
            >
              Blocked
            </Button>
          </div>
        </form>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/admin/users/${u.id}`}
                  className="min-w-0 truncate hover:underline"
                >
                  {u.displayName ?? u.email}{' '}
                  <span className="text-muted-foreground">{u.displayName ? u.email : ''}</span>
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {u._count.enrollments} subs · {u._count.sessions} sessions
                  </span>
                  {u.status === 'BLOCKED' && <Badge variant="destructive">blocked</Badge>}
                  <Badge variant={u.role === 'ADMIN' ? undefined : 'secondary'}>{u.role}</Badge>
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-muted-foreground">No members match.</p>
            )}
          </CardContent>
        </Card>
        <AdminUsers users={users} currentUserId={session.userId} />
      </div>
    </main>
  );
}
