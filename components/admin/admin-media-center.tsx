'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseImageUpload } from '@/components/exercises/exercise-image-upload';
import type { ExerciseReadiness } from '@/lib/exercise-readiness';

type Filter = 'needs-media' | 'all' | 'needs-photo' | 'needs-video';

// Admin media console: every movement with its coverage flags, filterable to
// the gaps, with the photo/video uploader embedded per selected movement.
export function AdminMediaCenter({ rows }: { rows: ExerciseReadiness[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('needs-media');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      switch (filter) {
        case 'all':
          return true;
        case 'needs-photo':
          return !r.hasPhoto && !r.hasFrames;
        case 'needs-video':
          return !r.hasVideo;
        case 'needs-media':
        default:
          return !r.ready;
      }
    });
  }, [query, filter, rows]);

  const missing = useMemo(() => rows.filter((r) => !r.ready).length, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Media library</CardTitle>
              <CardDescription>
                {missing} of {rows.length} movements still need media. Pick one to upload.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movements..."
                  aria-label="Search movements"
                  className="pl-9 sm:w-56"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <SelectTrigger className="w-40" aria-label="Filter by coverage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="needs-media">Needs media</SelectItem>
                  <SelectItem value="needs-photo">Needs photo</SelectItem>
                  <SelectItem value="needs-video">Needs video</SelectItem>
                  <SelectItem value="all">All movements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto">
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
                {row.aiMapped && <Badge variant="secondary">AI</Badge>}
              </span>
              <Button
                type="button"
                variant={selected === row.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelected((s) => (s === row.name ? null : row.name))}
              >
                <Upload className="size-4" />
                <span className="ml-2">{selected === row.name ? 'Close' : 'Upload'}</span>
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nothing matches this filter.
            </p>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-volt/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{selected}</CardTitle>
            <CardDescription>
              Photo and demo video, shared across every user instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExerciseImageUpload
              key={selected}
              exerciseName={selected}
              onChanged={() => router.refresh()}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
