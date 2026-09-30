'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Enrollment {
  id: string;
  status: string;
  currentDay: number;
  challenge: { title: string };
}

// End-to-end member controls on the inspector: cancel subscription, block or
// unblock access, and full account erase. Every action confirms first; the
// server guards self-harm and the last admin.
export function AdminUserActions({
  userId,
  email,
  status,
  isSelf,
  enrollments,
}: {
  userId: string;
  email: string;
  status: string;
  isSelf: boolean;
  enrollments: Enrollment[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, method: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Action failed.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  function block() {
    if (window.confirm(`Block ${email}? They lose login and API access immediately, data is kept.`)) {
      void call('/api/admin/users', 'PUT', { userId, status: 'BLOCKED' });
    }
  }

  function unblock() {
    if (window.confirm(`Unblock ${email}? Login access is restored.`)) {
      void call('/api/admin/users', 'PUT', { userId, status: 'ACTIVE' });
    }
  }

  function erase() {
    if (
      window.confirm(
        `Permanently DELETE ${email} and all their data? This cannot be undone. Cancel their subscription first if money is involved.`,
      )
    ) {
      void call('/api/admin/users', 'DELETE', { userId });
    }
  }

  function cancelEnrollment(enrollmentId: string, title: string) {
    if (window.confirm(`Cancel ${email}'s subscription to ${title}?`)) {
      void call('/api/admin/enrollments', 'PUT', { enrollmentId, status: 'CANCELLED' });
    }
  }

  return (
    <Card className="border-volt/40">
      <CardHeader>
        <CardTitle className="text-base">Manage account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === 'BLOCKED' ? 'destructive' : 'secondary'}>{status}</Badge>
          {status === 'BLOCKED' ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={unblock}>
              Unblock
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || isSelf}
              title={isSelf ? 'You cannot block yourself' : undefined}
              onClick={block}
            >
              Block
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={busy || isSelf}
            title={isSelf ? 'You cannot delete yourself' : undefined}
            onClick={erase}
          >
            Delete account
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Subscriptions ({enrollments.length})
          </p>
          {enrollments.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{e.challenge.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">
                  {e.status} d{e.currentDay}
                </Badge>
                {e.status !== 'CANCELLED' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => cancelEnrollment(e.id, e.challenge.title)}
                  >
                    Cancel
                  </Button>
                )}
              </span>
            </div>
          ))}
          {enrollments.length === 0 && (
            <p className="text-muted-foreground">No subscriptions.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
