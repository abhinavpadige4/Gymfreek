'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BuilderTask {
  id: string;
  exerciseName: string;
  targetReps: number;
  rounds: number;
  loadLabel: string | null;
  instructions: string | null;
  demoVideoUrl: string | null;
  order: number;
}

interface BuilderDay {
  id: string;
  dayNumber: number;
  title: string;
  focus: string | null;
  tasks: BuilderTask[];
}

interface Props {
  challenge: { id: string; title: string; slug: string; isActive: boolean };
  days: BuilderDay[];
}

// Full challenge builder: day title/focus, per-day task list with delete,
// and an add-exercise form. Challenge-level rename and activate toggle live
// at the top; members see changes instantly (enrolled days re-query).
export function AdminChallengeBuilder({ challenge, days }: Props) {
  const router = useRouter();
  const [dayNumber, setDayNumber] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(challenge.title);
  const [dayTitle, setDayTitle] = useState('');
  const [dayFocus, setDayFocus] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskReps, setTaskReps] = useState('10');
  const [taskRounds, setTaskRounds] = useState('10');
  const [taskLoad, setTaskLoad] = useState('');
  const [taskCue, setTaskCue] = useState('');
  const [taskVideo, setTaskVideo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editReps, setEditReps] = useState('10');
  const [editRounds, setEditRounds] = useState('10');
  const [editLoad, setEditLoad] = useState('');
  const [editCue, setEditCue] = useState('');
  const [editVideo, setEditVideo] = useState('');

  const day = useMemo(
    () => days.find((d) => d.dayNumber === dayNumber) ?? null,
    [days, dayNumber],
  );
  const maxDay = useMemo(
    () => days.reduce((m, d) => Math.max(m, d.dayNumber), 1),
    [days],
  );

  // Prefill the day form whenever the selected day (or its data) changes.
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (day && prefilledFor !== day.dayNumber) {
    setPrefilledFor(day.dayNumber);
    setDayTitle(day.title);
    setDayFocus(day.focus ?? '');
  }
  if (!day && prefilledFor !== -dayNumber) {
    setPrefilledFor(-dayNumber);
    setDayTitle(`Day ${dayNumber}`);
    setDayFocus('');
  }

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(data?.error ?? 'Request failed.');
  }

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  const saveChallenge = () =>
    run(() =>
      call('/api/admin/challenges', {
        method: 'PATCH',
        body: JSON.stringify({ challengeId: challenge.id, title: title.trim() }),
      }),
    );

  const toggleActive = () =>
    run(() =>
      call('/api/admin/challenges', {
        method: 'PATCH',
        body: JSON.stringify({ challengeId: challenge.id, isActive: !challenge.isActive }),
      }),
    );

  const saveDay = () =>
    run(() =>
      call('/api/admin/challenges', {
        method: 'PUT',
        body: JSON.stringify({
          challengeId: challenge.id,
          day: { dayNumber, title: dayTitle.trim() || `Day ${dayNumber}`, focus: dayFocus.trim() || null },
        }),
      }),
    );

  const addTask = () => {
    const name = taskName.trim();
    if (!name || !day) return;
    const reps = Math.max(1, Number(taskReps) || 10);
    const rounds = Math.max(1, Number(taskRounds) || 10);
    run(async () => {
      await call('/api/admin/challenge-tasks', {
        method: 'POST',
        body: JSON.stringify({
          dayId: day.id,
          exerciseName: name,
          targetReps: reps,
          rounds,
          loadLabel: taskLoad.trim() || null,
          instructions: taskCue.trim() || null,
          demoVideoUrl: taskVideo.trim() || null,
        }),
      });
      setTaskName('');
      setTaskLoad('');
      setTaskCue('');
      setTaskVideo('');
    });
  };

  const deleteTask = (taskId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from day ${dayNumber}?`)) return;
    void run(() =>
      call(`/api/admin/challenge-tasks?taskId=${encodeURIComponent(taskId)}`, {
        method: 'DELETE',
      }),
    );
  };

  const startEdit = (t: BuilderTask) => {
    setEditingId(t.id);
    setEditName(t.exerciseName);
    setEditReps(String(t.targetReps));
    setEditRounds(String(t.rounds));
    setEditLoad(t.loadLabel ?? '');
    setEditCue(t.instructions ?? '');
    setEditVideo(t.demoVideoUrl ?? '');
  };

  const saveEdit = (taskId: string) => {
    const name = editName.trim();
    if (!name) return;
    void run(() =>
      call('/api/admin/challenge-tasks', {
        method: 'PATCH',
        body: JSON.stringify({
          taskId,
          exerciseName: name,
          targetReps: Math.max(1, Number(editReps) || 10),
          rounds: Math.max(1, Number(editRounds) || 10),
          loadLabel: editLoad.trim() || null,
          instructions: editCue.trim() || null,
          demoVideoUrl: editVideo.trim() || null,
        }),
      }).then(() => setEditingId(null)),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Challenge settings</CardTitle>
          <CardDescription>
            /{challenge.slug} · {days.length} days · members see changes instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Label htmlFor="builder-title">Title</Label>
            <Input
              id="builder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void saveChallenge()}>
            Save title
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void toggleActive()}>
            {challenge.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {!challenge.isActive && <Badge variant="destructive">off</Badge>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Day {dayNumber}</CardTitle>
          <CardDescription>Days unlock in order; members train the current day only.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || dayNumber <= 1}
              onClick={() => setDayNumber((n) => Math.max(1, n - 1))}
            >
              Prev day
            </Button>
            <Input
              type="number"
              min={1}
              max={365}
              value={dayNumber}
              onChange={(e) => setDayNumber(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Day number"
              className="w-24"
              disabled={busy}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setDayNumber((n) => n + 1)}
            >
              Next day
            </Button>
            <span className="text-xs text-muted-foreground">
              {day ? `${day.tasks.length} movements` : 'new day'}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="builder-day-title">Day title</Label>
              <Input
                id="builder-day-title"
                value={dayTitle}
                onChange={(e) => setDayTitle(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="builder-day-focus">Focus</Label>
              <Input
                id="builder-day-focus"
                value={dayFocus}
                onChange={(e) => setDayFocus(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <Button type="button" disabled={busy} onClick={() => void saveDay()}>
              Save day {dayNumber}
            </Button>
          </div>
          {maxDay > 0 && dayNumber > maxDay + 1 && (
            <p className="text-xs text-muted-foreground">
              Tip: days unlock sequentially, avoid skipping numbers (latest is day {maxDay}).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Movements - day {dayNumber} ({day?.tasks.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {!day && (
            <p className="text-sm text-muted-foreground">
              Save the day first, then add movements below.
            </p>
          )}
          {day?.tasks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((t, i) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">
                      V{i + 1} {t.exerciseName}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {t.targetReps} x {t.rounds}
                      {t.loadLabel ? ` - ${t.loadLabel}` : ''}
                      {t.demoVideoUrl ? ' - video' : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        editingId === t.id ? setEditingId(null) : startEdit(t)
                      }
                      aria-label={`Edit ${t.exerciseName}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => deleteTask(t.id, t.exerciseName)}
                      aria-label={`Remove ${t.exerciseName}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </div>
                {editingId === t.id && (
                  <div className="grid gap-2 border-t pt-2 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label>Exercise name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={busy} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Load label</Label>
                      <Input value={editLoad} onChange={(e) => setEditLoad(e.target.value)} disabled={busy} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Target reps</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editReps}
                        onChange={(e) => setEditReps(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Rounds</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editRounds}
                        onChange={(e) => setEditRounds(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label>Execution cue</Label>
                      <Input value={editCue} onChange={(e) => setEditCue(e.target.value)} disabled={busy} />
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label>Demo video URL</Label>
                      <Input
                        inputMode="url"
                        value={editVideo}
                        onChange={(e) => setEditVideo(e.target.value)}
                        placeholder="https://..."
                        disabled={busy}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy || !editName.trim()}
                        onClick={() => saveEdit(t.id)}
                      >
                        Save movement
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {day && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add movement to day {dayNumber}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="builder-task-name">Exercise name</Label>
                <Input
                  id="builder-task-name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Goblet squats"
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="builder-task-load">Load label</Label>
                <Input
                  id="builder-task-load"
                  value={taskLoad}
                  onChange={(e) => setTaskLoad(e.target.value)}
                  placeholder="16-24 kg KB"
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="builder-task-reps">Target reps</Label>
                <Input
                  id="builder-task-reps"
                  type="number"
                  min={1}
                  value={taskReps}
                  onChange={(e) => setTaskReps(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="builder-task-rounds">Rounds</Label>
                <Input
                  id="builder-task-rounds"
                  type="number"
                  min={1}
                  value={taskRounds}
                  onChange={(e) => setTaskRounds(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="builder-task-cue">Execution cue</Label>
                <Input
                  id="builder-task-cue"
                  value={taskCue}
                  onChange={(e) => setTaskCue(e.target.value)}
                  placeholder="Hinge deep, snap tall..."
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="builder-task-video">Demo video URL (optional)</Label>
                <Input
                  id="builder-task-video"
                  inputMode="url"
                  value={taskVideo}
                  onChange={(e) => setTaskVideo(e.target.value)}
                  placeholder="https://..."
                  disabled={busy}
                />
              </div>
            </div>
            <div>
              <Button type="button" disabled={busy || !taskName.trim()} onClick={addTask}>
                Add movement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
