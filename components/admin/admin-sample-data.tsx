'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Admin-only mock data loader on the member inspector: one sample training
// week (gym sessions only) so Progress charts and the muscle map light up.
// Never touches challenge sessions, so leaderboard and streaks are unaffected.
export function AdminSampleData({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ sessions: number; sets: number } | null>(null);

  async function load() {
    if (
      !window.confirm(
        `Load a sample training week for ${email}? 4 finished gym sessions appear on their Progress page. Their leaderboard and streaks are untouched.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sample-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json().catch(() => null)) as {
        sessionsCreated?: number;
        setsCreated?: number;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Sample week failed.');
      setDone({ sessions: data?.sessionsCreated ?? 0, sets: data?.setsCreated ?? 0 });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sample week failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sample data</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          Loads 4 finished gym sessions from the last 7 days. Progress charts and the
          muscle heat map light up; leaderboard and streaks stay clean.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {done && (
          <p className="text-sm font-medium text-emerald-600">
            Added {done.sessions} sessions ({done.sets} sets).{' '}
            <Link href="/progress" className="font-semibold text-volt underline-offset-4 hover:underline">
              Open Progress to see the heat map
            </Link>
          </p>
        )}
        <div>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={load}>
            {busy ? 'Loading...' : done ? 'Load again' : 'Load sample week'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
