'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, Eye, Lock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CHALLENGE_DAY_CAP_SEC } from '@/lib/challenge-rules';
import { createAnalyzer } from '@/lib/form-engine/registry';
import { LiveWorkout } from '@/components/workout/live-workout';
import { ExerciseMediaDialog } from '@/components/exercises/exercise-media-dialog';

type Task = {
  exerciseName: string;
  loadLabel: string | null;
  instructions: string | null;
  demoVideoUrl: string | null;
};

const REPS_PER_TASK = 100;

// Guided challenge day: one movement at a time, in order. Each task shows
// technique help, camera rep counting (with video recording built in) and a
// manual fallback, then a rest before the next. Finishing posts the actual
// counted reps to /api/ai/results, which feeds progress and history.
export function DayRunner({
  challengeId,
  challengeDayId,
  tasks,
  restSec,
  requiredTasks,
}: {
  challengeId: string;
  challengeDayId: string;
  tasks: Task[];
  restSec: number;
  requiredTasks: number;
}) {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState<number[]>(() => tasks.map(() => 0));
  const [cameraOpen, setCameraOpen] = useState<number | null>(null);
  const [restLeft, setRestLeft] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  const need = Math.min(requiredTasks, tasks.length);
  const doneCount = useMemo(() => reps.filter((r) => r >= REPS_PER_TASK).length, [reps]);
  const totalReps = useMemo(() => reps.reduce((a, b) => a + b, 0), [reps]);
  const allDone = doneCount >= need;
  const currentIdx = reps.findIndex((r) => r < REPS_PER_TASK);
  const isRecovery = need < tasks.length;
  const capLabel = `${Math.floor(CHALLENGE_DAY_CAP_SEC / 60)}:${String(CHALLENGE_DAY_CAP_SEC % 60).padStart(2, '0')}`;
  const remaining = Math.max(0, CHALLENGE_DAY_CAP_SEC - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [started]);

  useEffect(() => {
    if (restLeft <= 0) return;
    const t = setTimeout(() => setRestLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [restLeft]);

  function start() {
    startRef.current = Date.now();
    setStarted(true);
  }

  function taskDoneCountAfter(index: number, value: number): number {
    let n = 0;
    for (let i = 0; i < reps.length; i++) {
      const v = i === index ? value : (reps[i] ?? 0);
      if (v >= REPS_PER_TASK) n++;
    }
    return n;
  }

  function addReps(index: number, n: number) {
    const value = (reps[index] ?? 0) + n;
    setReps((r) => r.map((v, j) => (j === index ? value : v)));
    setCameraOpen(null);
    if (value >= REPS_PER_TASK && taskDoneCountAfter(index, value) < need) {
      setRestLeft(restSec);
    }
  }

  function logManual(index: number) {
    addReps(index, REPS_PER_TASK - Math.min(reps[index] ?? 0, REPS_PER_TASK));
  }

  async function finish() {
    setSaving(true);
    setResult(null);
    const durationSec = Math.floor((Date.now() - startRef.current) / 1000);
    const res = await fetch('/api/ai/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        challengeDayId,
        durationSec,
        results: tasks.map((t, i) => ({
          exerciseName: t.exerciseName,
          reps: reps[i] ?? 0,
          goodReps: reps[i] ?? 0,
          badReps: 0,
          averageScore: (reps[i] ?? 0) > 0 ? 80 : 0,
          durationSec,
          issues: [],
        })),
      }),
    });
    const data = (await res.json().catch(() => null)) as { valid?: boolean } | null;
    setSaving(false);
    setResult(
      data?.valid
        ? `Done in ${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')} - VALID. Next day unlocked.`
        : `Stored as INVALID - over ${capLabel} or incomplete. Redo this day inside ${capLabel}.`,
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {tasks.length} movements, 100 reps each, in order. Full day in {capLabel} with {restSec}s
          rest between movements.{' '}
          {isRecovery
            ? `Recovery day: any ${need} of ${tasks.length} count.`
            : 'Finish every movement or the attempt is INVALID.'}
        </p>
        <Button onClick={start} size="lg" className="min-h-tap">
          Start day timer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-4xl tabular-nums" aria-live="polite">
          {mm}:{ss}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {doneCount}/{need} movements · {totalReps.toLocaleString('en-US')} reps
        </p>
      </div>
      <Progress value={tasks.length === 0 ? 0 : (doneCount / need) * 100} />
      {restLeft > 0 && (
        <p className="rounded-md border border-volt/40 bg-volt/10 p-3 text-center text-lg font-semibold tabular-nums">
          Rest {restLeft}s - next movement
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {tasks.map((t, i) => {
          const taskReps = reps[i] ?? 0;
          const isDone = taskReps >= REPS_PER_TASK;
          const isCurrent = i === currentIdx;
          const locked = !isDone && !isCurrent;
          const supported = createAnalyzer(t.exerciseName) !== null;
          const pct = Math.min(100, Math.round((taskReps / REPS_PER_TASK) * 100));
          return (
            <li key={`${t.exerciseName}-${i}`}>
              <Card className={isCurrent ? 'border-volt/60' : undefined}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Movement {i + 1} of {tasks.length}
                      </p>
                      <p className="mt-0.5 font-semibold leading-snug">
                        V{i + 1} {t.exerciseName}
                        {t.loadLabel && (
                          <span className="font-normal text-muted-foreground"> - {t.loadLabel}</span>
                        )}
                      </p>
                    </div>
                    {isDone ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#35C759]/15 px-2.5 py-1 text-xs font-bold text-[#35C759]">
                        <Check className="size-4" /> {taskReps}
                      </span>
                    ) : locked ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-4" /> Locked
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {taskReps}/{REPS_PER_TASK}
                      </span>
                    )}
                  </div>

                  {!isDone && !locked && (
                    <>
                      <Progress value={pct} />
                      <div className="flex flex-wrap gap-2">
                        <ExerciseMediaDialog
                          exerciseName={t.exerciseName}
                          displayName={t.exerciseName}
                          notes={t.instructions ?? t.loadLabel}
                          demoUrl={t.demoVideoUrl}
                        />
                        {supported ? (
                          <Button
                            type="button"
                            variant={cameraOpen === i ? 'secondary' : 'default'}
                            size="sm"
                            className="min-h-tap"
                            onClick={() => setCameraOpen((c) => (c === i ? null : i))}
                          >
                            <Camera className="size-4" />
                            <span className="ml-2">
                              {cameraOpen === i ? 'Close camera' : 'Count with camera'}
                            </span>
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Video className="size-4" />
                            No camera for this one - log it below
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-tap"
                          disabled={restLeft > 0}
                          onClick={() => logManual(i)}
                        >
                          <Eye className="size-4" />
                          <span className="ml-2">Log 100 without camera</span>
                        </Button>
                      </div>
                      {cameraOpen === i && (
                        <div className="rounded-lg border border-border p-3">
                          <LiveWorkout
                            key={`cam-${challengeDayId}-${i}`}
                            exercise={t.exerciseName}
                            onCount={(n) => addReps(i, n)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <Button onClick={() => void finish()} disabled={!allDone || saving} size="lg">
        {saving
          ? 'Saving...'
          : allDone
            ? 'Finish day'
            : `Complete ${need - doneCount} more`}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}
