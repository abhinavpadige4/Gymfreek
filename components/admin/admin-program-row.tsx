'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface AdminProgramItem {
  id: string;
  name: string;
  isActive: boolean;
  sourceTemplateSlug: string | null;
  ownerId: string;
  ownerEmail: string;
  workoutCount: number;
  exerciseCount: number;
  sessionCount: number;
  workouts: { name: string; exerciseCount: number }[];
}

// One program row: inspect inline, link to the owner, deactivate or delete.
export function AdminProgramRow({ program }: { program: AdminProgramItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleActive() {
    setPending(true);
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: program.id, isActive: !program.isActive }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      toast.success(program.isActive ? 'Program deactivated.' : 'Program activated.');
      router.refresh();
    } catch {
      toast.error('Update failed.');
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${program.name}"? Only programs with no logged sessions can be deleted.`)) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/programs?programId=${program.id}`, {
        method: 'DELETE',
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error ?? `Error ${res.status}`);
      toast.success('Program deleted.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="rounded-lg border border-border p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className="font-medium">{program.name}</span>{' '}
          <span className="text-muted-foreground">
            {program.ownerEmail} · {program.workoutCount} sessions · {program.sessionCount} logged
          </span>
        </span>
        <span className="flex shrink-0 gap-1.5">
          {program.sourceTemplateSlug && <Badge variant="outline">locked</Badge>}
          {program.isActive ? <Badge>active</Badge> : <Badge variant="secondary">idle</Badge>}
        </span>
      </summary>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
        {program.workouts.map((w) => (
          <li key={w.name}>
            {w.name} · {w.exerciseCount} exercises
          </li>
        ))}
        {program.workouts.length === 0 && <li>No workouts.</li>}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/users/${program.ownerId}`}>Owner profile</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => void toggleActive()}
        >
          {program.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => void remove()}
        >
          Delete
        </Button>
      </div>
    </details>
  );
}
