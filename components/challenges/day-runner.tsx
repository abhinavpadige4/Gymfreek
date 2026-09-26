'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// One movement per screen. Reps persist to localStorage so a refresh never
// resets the day. Days 1-50 show the 55:00 cap for info only.
export function DayRunner({
  challengeId,
  challengeDayId,
  dayNumber,
  tasks,
  restSec,
  requiredTasks,
}: {
  challengeId: string;
  challengeDayId: string;
  dayNumber: number;
  tasks: Task[];
  restSec: number;
  requiredTasks: number;
}) {
  const key = `100xu-day-${challengeDayId}`;
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState<number[]>(() => tasks.map(() => 0));
  const [step, setStep] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [badge, setBadge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  // Resume persisted progress.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const p = JSON.parse(raw) as { reps?: number[]; elapsed?: number };
      if (Array.isArray(p.reps) && p.reps.length === tasks.length) {
        setReps(p.reps);
        const idx = p.reps.findIndex((r) => r < REPS_PER_TASK);
        setStep(idx === -1 ? 0 : idx);
        if (p.reps.some((r) => r > 0)) {
          setStarted(true);
          startRef.current = Date.now() - (p.elapsed ?? 0) * 1000;
        }
      }
    } catch {
      // corrupt cache, start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!started) return;
    try {
      localStorage.setItem(key, JSON.stringify({ reps, elapsed }));
    } catch {
      // storage full, ignore
    }
  }, [reps, elapsed, started, key]);

  const need = Math.min(requiredTasks, tasks.length);
  const doneCount = useMemo(() => reps.filter((r) => r >= REPS_PER_TASK).length, [reps]);
  const totalReps = useMemo(() => reps.reduce((a, b) => a + b, 0), [reps]);
  const allDone = doneCount >= need;
  const isRecovery = need < tasks.length;
  const capEnforced = dayNumber > 50;
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
    startRef.current = Date.now() - elapsed * 1000;
    setStarted(true);
  }

  function addReps(index: number, n: number) {
    const value = (reps[index] ?? 0) + n;
    const next = reps.map((v, j) => (j === index ? value : v));
    setReps(next);
    setCameraOpen(false);
    const done = next.filter((r) => r >= REPS_PER_TASK).length;
    if (value >= REPS_PER_TASK && done < need) setRestLeft(restSec);
    // Auto-advance to next incomplete movement.
    const nxt = next.findIndex((r) => r < REPS_PER_TASK);
    if (nxt !== -1 && nxt !== index) setStep(nxt);
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
    const data = (await res.json().catch(() => null)) as {
      valid?: boolean;
      awardedBlock?: number | null;
    } | null;
    setSaving(false);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    if (data?.awardedBlock) setBadge(data.awardedBlock);
    setResult(
      data?.valid
        ? `Done in ${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')} - VALID. Next day unlocked.`
        : `Stored. ${capEnforced ? `Over ${capLabel} or incomplete - redo inside ${capLabel}.` : 'Incomplete - finish all movements.'}`,
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {tasks.length} movements · 100 reps each · one screen at a time.
        </p>
        <p className="text-sm text-muted-foreground">
          {capEnforced
            ? `Finish inside ${capLabel} or redo the day.`
            : `${capLabel} is info only, no fail.`}{' '}
          {isRecovery ? `Recovery day: any ${need} of ${tasks.length} count.` : 'Finish every movement.'}
        </p>
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Coach tip</p>
          <p className="mt-1 text-muted-foreground">
            Pause {restSec}s after each movement. Sip water every 2 rounds.
            Keep early rounds smooth, push the last two.
          </p>
        </div>
        <Button onClick={start} size="lg" className="min-h-tap">
          Start day timer
        </Button>
      </div>
    );
  }

  const t = tasks[step]!;
  const taskReps = reps[step] ?? 0;
  const isDone = taskReps >= REPS_PER_TASK;
  const supported = createAnalyzer(t.exerciseName) !== null;
  const pct = Math.min(100, Math.round((taskReps / REPS_PER_TASK) * 100));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-4xl tabular-nums" aria-live="polite">
            {mm}:{ss}
          </p>
          {!capEnforced && <p className="text-xs text-muted-foreground">Info only, no fail</p>}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {doneCount}/{need} movements · {totalReps.toLocaleString('en-US')} reps
        </p>
      </div>
      <Progress value={tasks.length === 0 ? 0 : (doneCount / need) * 100} />
      {restLeft > 0 && (
        <p className="rounded-md border border-volt/40 bg-volt/10 p-3 text-center text-lg font-semibold tabular-nums">
          Rest {restLeft}s - Move, breathe, next starts soon
        </p>
      )}

      <Card className="border-volt/60">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Movement {step + 1} of {tasks.length}
              </p>
              <p className="mt-0.5 font-semibold leading-snug">
                V{step + 1} {t.exerciseName}
                {t.loadLabel && (
                  <span className="font-normal text-muted-foreground"> - {t.loadLabel}</span>
                )}
              </p>
              {t.instructions && <p className="mt-1 text-sm text-muted-foreground">{t.instructions}</p>}
              <div className="mt-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                {t.loadLabel ? (
                  <p>
                    <span className="font-medium text-foreground">Load: </span>
                    {t.loadLabel}
                  </p>
                ) : null}
                <p className={t.loadLabel ? 'mt-1' : undefined}>
                  Pause {restSec}s after this, sip water every 2 rounds.
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Preferred: do it with camera counting. Alternative below if the camera cannot see you.
              </p>
            </div>
            {isDone ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#35C759]/15 px-2.5 py-1 text-xs font-bold text-[#35C759]">
                <Check className="size-4" /> {taskReps}
              </span>
            ) : (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {taskReps}/{REPS_PER_TASK}
              </span>
            )}
          </div>

          {!isDone && (
            <>
              <Progress value={pct} />
              <p className="text-center font-display text-5xl tabular-nums" aria-live="polite">
                {taskReps}
              </p>
              <div className="flex flex-col gap-2">
                <ExerciseMediaDialog
                  exerciseName={t.exerciseName}
                  displayName={t.exerciseName}
                  notes={t.instructions ?? t.loadLabel}
                  demoUrl={t.demoVideoUrl}
                />
                {supported ? (
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-tap w-full"
                    onClick={() => setCameraOpen((c) => !c)}
                  >
                    <Camera className="size-4" />
                    <span className="ml-2">{cameraOpen ? 'Close camera' : 'Count with camera (preferred)'}</span>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No camera model for this one - use manual log below.
                  </p>
                )}
                {cameraOpen && supported && (
                  <div className="rounded-lg border border-border p-3">
                    <LiveWorkout
                      key={`cam-${challengeDayId}-${step}`}
                      exercise={t.exerciseName}
                      onCount={(n) => addReps(step, n)}
                    />
                  </div>
                )}
                <details className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Alternative: log without camera
                  </summary>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Do the 100 reps, rest {restSec}s, then log the full set.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 min-h-tap"
                    disabled={restLeft > 0}
                    onClick={() => logManual(step)}
                  >
                    Log 100 without camera
                  </Button>
                </details>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-tap flex-1"
              disabled={step === 0}
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
                setCameraOpen(false);
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              variant={isDone ? 'default' : 'outline'}
              className="min-h-tap flex-1"
              disabled={!isDone && reps.slice(0, step + 1).some((r) => r < REPS_PER_TASK)}
              onClick={() => {
                const nxt = reps.findIndex((r) => r < REPS_PER_TASK);
                if (nxt !== -1) setStep(nxt);
                else if (step + 1 < tasks.length) setStep(step + 1);
                setCameraOpen(false);
              }}
            >
              {step + 1 >= tasks.length ? 'Review' : 'Next movement'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5" aria-label="All movements">
            {tasks.map((_, i) => {
              const d = (reps[i] ?? 0) >= REPS_PER_TASK;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    // Only completed or current-in-order movement is tappable.
                    const firstOpen = reps.findIndex((r) => r < REPS_PER_TASK);
                    if (d || i === firstOpen) {
                      setStep(i);
                      setCameraOpen(false);
                    }
                  }}
                  aria-label={`Go to movement ${i + 1}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs tabular-nums ${
                    i === step
                      ? 'border-volt bg-volt/15 font-bold'
                      : d
                        ? 'border-[#35C759]/40 bg-[#35C759]/10'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {d ? <Check className="size-3" /> : i === 0 ? <Lock className="hidden" /> : null}
                  {d ? '' : i + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void finish()} disabled={!allDone || saving} size="lg" className="min-h-tap">
        {saving ? 'Saving...' : allDone ? 'Finish day' : `Complete ${need - doneCount} more`}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}

      <AnimatePresence>
        {badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setBadge(null)}
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-volt font-display text-2xl font-bold text-black">
                {badge * 10}
              </span>
              <p className="font-display text-2xl">Badge earned - Day {badge * 10}</p>
              <p className="text-sm text-muted-foreground">
                10 days complete. Saved to your avatar shelf and share card.
              </p>
              <div className="flex gap-2">
                <Button asChild onClick={() => setBadge(null)}>
                  <Link href={`/badges/${badge}`}>See your badge</Link>
                </Button>
                <Button variant="outline" onClick={() => setBadge(null)}>Keep going</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
