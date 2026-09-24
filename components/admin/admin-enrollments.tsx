'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminEnrollment {
  id: string;
  status: string;
  currentDay: number;
  challenge: { title: string };
  user: { email: string };
}

// Admin subscription management: activate / cancel enrollments and reset the
// current day (e.g. after a support redo). COMPLETED is earned, never assigned.
export function AdminEnrollments({ enrollments }: { enrollments: AdminEnrollment[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(
    enrollmentId: string,
    status: 'ACTIVE' | 'CANCELLED',
    currentDay?: number,
  ) {
    if (busyId) return;
    const action =
      currentDay !== undefined ? `reset day to ${currentDay}` : `mark ${status.toLowerCase()}`;
    if (!window.confirm(`Confirm: ${action} this enrollment?`)) return;
    setBusyId(enrollmentId);
    setError(null);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, status, currentDay }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Update failed.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Enrollments ({enrollments.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {enrollments.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">
              {e.user.email} - {e.challenge.title}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">
                {e.status} d{e.currentDay}
              </Badge>
              {e.status !== 'CANCELLED' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => void update(e.id, 'CANCELLED')}
                >
                  Cancel
                </Button>
              )}
              {e.status === 'CANCELLED' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => void update(e.id, 'ACTIVE')}
                >
                  Reactivate
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyId !== null}
                title="Reset progress to day 1"
                onClick={() => void update(e.id, 'ACTIVE', 1)}
              >
                Reset to day 1
              </Button>
            </span>
          </div>
        ))}
        {enrollments.length === 0 && (
          <p className="text-muted-foreground">No enrollments yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
