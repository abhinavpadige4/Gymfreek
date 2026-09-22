'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExerciseReadiness } from '@/lib/exercise-readiness';

// Admin-only readiness board: one row per blueprint movement with its
// user-visible coverage. Search narrows locally; uploading happens on the
// exercise detail page (Technique photo card).
export function ReadinessTable({ rows }: { rows: ExerciseReadiness[] }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, rows]);
  const readyCount = useMemo(() => rows.filter((r) => r.ready).length, [rows]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Exercise readiness</CardTitle>
            <CardDescription>
              {readyCount} of {rows.length} movements READY. Upload the rest from
              their exercise detail page.
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movements..."
              aria-label="Search movements"
              className="pl-9 sm:w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {filtered.map((row) => (
          <div
            key={row.name}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 basis-48 font-medium">{row.name}</span>
            <span className="flex flex-wrap gap-1.5">
              {row.ready ? (
                <Badge className="bg-[#35C759] text-black hover:bg-[#35C759]">READY</Badge>
              ) : (
                <Badge variant="outline">NEEDS MEDIA</Badge>
              )}
              {row.hasPhoto && <Badge variant="secondary">PHOTO</Badge>}
              {row.hasFrames && <Badge variant="secondary">FRAMES</Badge>}
              {row.hasVideo && <Badge variant="secondary">VIDEO</Badge>}
              {row.hasCue && <Badge variant="secondary">CUE</Badge>}
              {row.aiMapped && <Badge variant="secondary">AI</Badge>}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No movements match “{query.trim()}”.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
