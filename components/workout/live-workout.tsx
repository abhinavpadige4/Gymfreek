'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createAnalyzer, type ExerciseAnalyzer } from '@/lib/form-engine/registry';
import { CueThrottle } from '@/lib/form-engine/feedback';
import { loadPoseLandmarker, toPoints } from '@/lib/form-engine/pose';
import { voiceService } from '@/lib/form-engine/voice';

type Status = 'idle' | 'loading' | 'running' | 'saving' | 'done' | 'error';

interface Coaching {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextWorkoutAdvice: string;
  voiceMessage: string;
}

// End-to-end live loop: Camera -> MediaPipe -> landmarks -> SquatAnalyzer ->
// rep count + throttled voice cues. On finish, structured JSON only goes to
// /api/ai/results (never video), then /api/ai/summary for LLM coaching.
export function LiveWorkout({
  exercise,
  challengeId,
  challengeDayId,
}: {
  exercise: string;
  challengeId?: string;
  challengeDayId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);
  const startedAtRef = useRef(0);
  const stopRef = useRef(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [reps, setReps] = useState(0);
  const [cue, setCue] = useState('');
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [coachUnavailable, setCoachUnavailable] = useState(false);

  const supported = createAnalyzer(exercise) !== null;

  const stopCamera = useCallback(() => {
    stopRef.current = true;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const start = useCallback(async () => {
    const analyzer = createAnalyzer(exercise);
    if (!analyzer) return;
    analyzerRef.current = analyzer;
    setStatus('loading');
    setError('');
    setCoaching(null);
    setCoachUnavailable(false);
    setReps(0);
    setCue('');
    stopRef.current = false;
    startedAtRef.current = Date.now();
    const throttle = new CueThrottle();
    try {
      const [landmarker, stream] = await Promise.all([
        loadPoseLandmarker(),
        navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        }),
      ]);
      const video = videoRef.current;
      if (!video) throw new Error('Video element missing.');
      video.srcObject = stream;
      await video.play();
      setStatus('running');
      let lastTime = -1;
      const loop = () => {
        if (stopRef.current || !videoRef.current) return;
        const now = performance.now();
        if (video.currentTime !== lastTime && video.videoWidth > 0) {
          lastTime = video.currentTime;
          const lm = landmarker.detectForVideo(video, now).landmarks?.[0];
          if (lm) {
            drawDots(canvasRef.current, video, lm);
            const rep = analyzer.update(toPoints(lm), now);
            if (rep) {
              setReps(rep.rep);
              const phrase = throttle.pick(rep.issues, Date.now());
              if (phrase) {
                setCue(phrase);
                voiceService.speak(phrase);
              }
            }
          }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch (err) {
      stopCamera();
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Camera failed to start.');
    }
  }, [exercise, stopCamera]);

  const finish = useCallback(async () => {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;
    stopCamera();
    setStatus('saving');
    try {
      const s = analyzer.summary();
      const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      await fetch('/api/ai/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          challengeDayId,
          durationSec,
          results: [
            {
              exerciseName: exercise,
              reps: s.totalReps,
              goodReps: s.goodReps,
              badReps: s.badReps,
              averageScore: s.averageScore,
              durationSec,
              issues: Object.entries(s.issues).map(([issueType, count]) => ({
                issueType,
                count,
              })),
            },
          ],
        }),
      });
      const coachRes = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise,
          totalReps: s.totalReps,
          goodReps: s.goodReps,
          badReps: s.badReps,
          averageScore: s.averageScore,
          issues: s.issues,
          duration: durationSec,
        }),
      });
      if (coachRes.ok) {
        const c = (await coachRes.json()) as Coaching;
        setCoaching(c);
        voiceService.speak(c.voiceMessage);
      } else {
        setCoachUnavailable(true);
      }
    } catch {
      setError('Could not save the workout.');
      setStatus('error');
      return;
    }
    setStatus('done');
  }, [exercise, challengeId, challengeDayId, stopCamera]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[4/3] w-full -scale-x-100 object-cover"
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-4xl font-bold tabular-nums">{reps}</p>
        <p className="text-sm text-muted-foreground">
          {status === 'running' ? cue || 'Good - keep going' : cue}
        </p>
      </div>
      {status === 'idle' || status === 'error' ? (
        <Button onClick={start} disabled={!supported} size="lg">
          {supported ? 'Start camera' : `${exercise} is not supported yet (squat first)`}
        </Button>
      ) : status === 'running' ? (
        <Button onClick={() => void finish()} size="lg" variant="secondary">
          Finish set
        </Button>
      ) : null}
      {(status === 'saving') && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
      {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
      {coaching && (
        <div className="rounded-lg border p-4">
          <p className="font-medium">{coaching.summary}</p>
          {coaching.improvements.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {coaching.improvements.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          <Button
            className="mt-2"
            variant="outline"
            onClick={() => voiceService.speak(coaching.voiceMessage)}
          >
            Replay coaching
          </Button>
        </div>
      )}
      {coachUnavailable && (
        <p className="text-sm text-muted-foreground">
          Saved. AI coach not connected (AI_SERVICE_URL unset).
        </p>
      )}
    </div>
  );
}

// Mirror-aware dot overlay so the user can frame themselves. Dots only;
// skeleton lines can wait for Phase 8.
function drawDots(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  pts: { x: number; y: number }[],
) {
  if (!canvas) return;
  const w = (canvas.width = video.videoWidth);
  const h = (canvas.height = video.videoHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#22c55e';
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
