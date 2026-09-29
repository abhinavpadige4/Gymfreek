'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CHALLENGE_DAY_CAP_SEC } from '@/lib/challenge-rules';
import { createAnalyzer } from '@/lib/form-engine/registry';
import { voiceService } from '@/lib/form-engine/voice';
import { LiveWorkout } from '@/components/workout/live-workout';
import { ExerciseMediaDialog } from '@/components/exercises/exercise-media-dialog';

type Task = {
  exerciseName: string;
  loadLabel: string | null;
  instructions: string | null;
  demoVideoUrl: string | null;
  best: { reps: number; averageScore: number } | null;
};

const REPS_PER_TASK = 100;

function mmss(totalSec: number): string {
  const s = Math.max(0, totalSec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface SessionRecord {
  reps: number;
  restSec: number;
  durationSec: number;
  recordedAt: number;
}

// Guided day flow: one movement per screen, two actions only (Technique,
// Record). In-day progress lives in sessionStorage (temp): the server is
// written once, when the day finishes. Bests come from stored history and
// survive streak resets.
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
  const key = `100xu-sess-${challengeDayId}`;
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState<number[]>(() => tasks.map(() => 0));
  const [step, setStep] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [badge, setBadge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function readSession(): { reps?: number[]; elapsed?: number } | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as { reps?: number[]; elapsed?: number };
    } catch {
      return null;
    }
  }

  // Resume temp progress on entry.
  useEffect(() => {
    const p = readSession();
    if (!p) return;
    if (Array.isArray(p.reps) && p.reps.length === tasks.length) {
      setReps(p.reps);
      const idx = p.reps.findIndex((r) => r < REPS_PER_TASK);
      setStep(idx === -1 ? 0 : idx);
      if (p.reps.some((r) => r > 0)) {
        setStarted(true);
        startRef.current = Date.now() - (p.elapsed ?? 0) * 1000;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!started) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ reps, elapsed }));
    } catch {
      // storage full, ignore
    }
  }, [reps, elapsed, started, key]);

  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  const need = Math.min(requiredTasks, tasks.length);
  const doneCount = useMemo(() => reps.filter((r) => r >= REPS_PER_TASK).length, [reps]);
  const totalReps = useMemo(() => reps.reduce((a, b) => a + b, 0), [reps]);
  const allDone = doneCount >= need;
  const capEnforced = dayNumber > 50;
  const remaining = Math.max(0, CHALLENGE_DAY_CAP_SEC - elapsed);

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
    if (value < REPS_PER_TASK) return;
    // Auto DONE: announce, rest, then move on with no taps.
    const name = tasks[index]?.exerciseName ?? '';
    const msg = `DONE ${name}`;
    setDoneMsg(msg);
    voiceService.speak(msg);
    const done = next.filter((r) => r >= REPS_PER_TASK).length;
    if (done < need) setRestLeft(restSec);
    if (doneTimer.current) clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => {
      setDoneMsg(null);
      const nxt = next.findIndex((r) => r < REPS_PER_TASK);
      if (nxt !== -1) setStep(nxt);
    }, 1800);
  }

  function logManual(index: number) {
    addReps(index, REPS_PER_TASK - Math.min(reps[index] ?? 0, REPS_PER_TASK));
  }

  async function finish() {
    setSaving(true);
    setResult(null);
    const durationSec = Math.floor((Date.now() - startRef.current) / 1000);
    try {
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
        enrollment?: { reset?: boolean };
      } | null;
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
      if (data?.awardedBlock) setBadge(data.awardedBlock);
      setResult(
        data?.enrollment?.reset
          ? 'Missed a day. Day 1 again. Bests kept.'
          : data?.valid
            ? `Done ${mmss(durationSec)} UTC - VALID. Next opens 00:00 UTC.`
            : `Stored. ${capEnforced ? 'Over 55:00 or incomplete - redo.' : 'Incomplete - finish all moves.'}`,
      );
    } finally {
      setSaving(false);
    }
  }

  // Auto-finish: no manual tap once every move hits 10x10.
  useEffect(() => {
    if (started && allDone && !result && !saving) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, started]);

  if (!started) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">10x10 per move · 55:00 UTC</p>
        <Button onClick={start} size="lg" className="min-h-tap">
          Start Day {dayNumber}
        </Button>
      </div>
    );
  }

  const t = tasks[step]!;
  const taskReps = reps[step] ?? 0;
  const isDone = taskReps >= REPS_PER_TASK;
  const supported = createAnalyzer(t.exerciseName) !== null;
  const filled = Math.min(REPS_PER_TASK, taskReps);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-4xl tabular-nums" aria-live="polite">
          {mmss(remaining)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {doneCount}/{need} · {totalReps.toLocaleString('en-US')}
        </p>
      </div>
      <Progress value={tasks.length === 0 ? 0 : (doneCount / need) * 100} />
      {restLeft > 0 && (
        <p className="rounded-md border border-volt/40 bg-volt/10 p-3 text-center text-lg font-semibold tabular-nums">
          Rest {mmss(restLeft)} UTC
        </p>
      )}
      {doneMsg && (
        <p className="rounded-md border border-[#35C759]/50 bg-[#35C759]/10 p-3 text-center font-bold text-[#35C759]" aria-live="polite">
          {doneMsg}
        </p>
      )}

      <Card className="border-volt/60">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Move {step + 1} of {tasks.length}
              </p>
              <p className="mt-0.5 font-semibold leading-snug">
                {t.exerciseName}
              </p>
            </div>
            {isDone && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#35C759]/15 px-2.5 py-1 text-xs font-bold text-[#35C759]">
                <Check className="size-4" /> {taskReps}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center" aria-label="Present and best">
            <div className="rounded-md border border-border p-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Present</p>
              <p className="font-display text-2xl tabular-nums">{taskReps}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Best</p>
              <p className="font-display text-2xl tabular-nums">{t.best?.reps ?? 0}</p>
            </div>
          </div>

          {!isDone && (
            <>
              <div className="grid grid-cols-10 gap-1" aria-label={`${filled} of ${REPS_PER_TASK}`}>
                {Array.from({ length: REPS_PER_TASK }, (_, i) => (
                  <span
                    key={i}
                    className={`aspect-square rounded-[3px] ${i < filled ? 'bg-volt' : 'bg-muted'}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ExerciseMediaDialog
                  exerciseName={t.exerciseName}
                  displayName={t.exerciseName}
                  notes={null}
                  demoUrl={t.demoVideoUrl}
                  minimal
                />
                {supported ? (
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-tap w-full"
                    onClick={() => setCameraOpen((c) => !c)}
                  >
                    <Camera className="size-4" />
                    <span className="ml-2">{cameraOpen ? 'Close' : 'Record'}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="min-h-tap w-full"
                    onClick={() => logManual(step)}
                  >
                    Log 10x10
                  </Button>
                )}
              </div>
              {cameraOpen && supported && (
                <div className="rounded-lg border border-border p-3">
                  <LiveWorkout
                    key={`cam-${challengeDayId}-${step}`}
                    exercise={t.exerciseName}
                    onCount={(n) => addReps(step, n)}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-1.5" aria-label="All moves">
            {tasks.map((_, i) => {
              const d = (reps[i] ?? 0) >= REPS_PER_TASK;
              const firstOpen = reps.findIndex((r) => r < REPS_PER_TASK);
              const clickable = d || i === firstOpen;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    setStep(i);
                    setCameraOpen(false);
                  }}
                  aria-label={`Go to move ${i + 1}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs tabular-nums ${
                    i === step
                      ? 'border-volt bg-volt/15 font-bold'
                      : d
                        ? 'border-[#35C759]/40 bg-[#35C759]/10'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {d ? <Check className="size-3" /> : i + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {saving && <p className="text-sm text-muted-foreground">Saving...</p>}
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
