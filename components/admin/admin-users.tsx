'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

// Admin-only role management. The server guards self-demotion and the last
// admin; failures surface as inline errors, never silently.
export function AdminUsers({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(userId: string, role: 'USER' | 'ADMIN') {
    if (busyId) return;
    const target = users.find((u) => u.id === userId);
    if (
      !target ||
      !window.confirm(
        `${role === 'ADMIN' ? 'Grant' : 'Remove'} admin access ${role === 'ADMIN' ? 'to' : 'from'} ${target.email}?`,
      )
    ) {
      return;
    }
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Role update failed.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role update failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Users</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">
              {u.displayName ?? u.email} <span className="text-muted-foreground">{u.email}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant={u.role === 'ADMIN' ? undefined : 'secondary'}>{u.role}</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyId !== null || u.id === currentUserId}
                title={u.id === currentUserId ? 'You cannot change your own role here' : undefined}
                onClick={() => void setRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
              >
                {u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
              </Button>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
