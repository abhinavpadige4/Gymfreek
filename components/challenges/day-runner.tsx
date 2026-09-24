'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CHALLENGE_DAY_CAP_SEC } from '@/lib/challenge-rules';

type Task = { exerciseName: string; loadLabel: string | null };

// Challenge-only day runner: 55:00 countdown, per-set rest overlay
// (20s standard, 30s medical), sequential task checklist. Recovery days need
// only 6 of 10 tasks. Posts the attempt to /api/ai/results; over-time or
// short attempts are stored as INVALID server-side.
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
  const [done, setDone] = useState<boolean[]>(() => tasks.map(() => false));
  const [restLeft, setRestLeft] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  const remaining = Math.max(0, CHALLENGE_DAY_CAP_SEC - elapsed);
  const doneCount = useMemo(() => done.filter(Boolean).length, [done]);
  const allDone = doneCount >= Math.min(requiredTasks, tasks.length);
  const isRecovery = requiredTasks < tasks.length;
  const capLabel = `${Math.floor(CHALLENGE_DAY_CAP_SEC / 60)}:${String(CHALLENGE_DAY_CAP_SEC % 60).padStart(2, '0')}`;
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

  function completeTask(i: number) {
    setDone((d) => d.map((v, j) => (j === i ? true : v)));
    if (i < tasks.length - 1) setRestLeft(restSec);
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
          reps: done[i] ? 100 : 0,
          goodReps: done[i] ? 100 : 0,
          badReps: 0,
          averageScore: done[i] ? 80 : 0,
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
          Full day in {capLabel}. {restSec}s rest after each set.{' '}
          {isRecovery
            ? `Recovery day: complete any ${requiredTasks} of ${tasks.length} tasks.`
            : 'Finish every task or the attempt is INVALID.'}
        </p>
        <Button onClick={start} size="lg" className="min-h-tap">
          Start day timer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-4xl tabular-nums" aria-live="polite">
        {mm}:{ss}
      </p>
      {restLeft > 0 && (
        <p className="rounded-md border border-volt/40 bg-volt/10 p-2 text-sm">
          Rest {restLeft}s - next set
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {tasks.map((t, i) => (
          <li key={t.exerciseName} className="flex items-center justify-between gap-2 text-sm">
            <span>
              V{i + 1} {t.exerciseName}
              {t.loadLabel ? <span className="text-muted-foreground"> - {t.loadLabel}</span> : null}
            </span>
            <Button
              size="sm"
              variant={done[i] ? 'secondary' : 'outline'}
              disabled={done[i] || restLeft > 0}
              onClick={() => completeTask(i)}
            >
              {done[i] ? 'Done' : 'Complete set'}
            </Button>
          </li>
        ))}
      </ul>
      <Button onClick={() => void finish()} disabled={!allDone || saving} size="lg">
        {saving
          ? 'Saving...'
          : allDone
            ? 'Finish day'
            : `Complete ${Math.min(requiredTasks, tasks.length) - doneCount} more`}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}
