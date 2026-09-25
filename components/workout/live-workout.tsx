'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { createAnalyzer, type ExerciseAnalyzer } from '@/lib/form-engine/registry';
import { CueThrottle, RULE_PHRASES, topIssues } from '@/lib/form-engine/feedback';
import { landmarksVisible } from '@/lib/form-engine/angles';
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
  onCount,
}: {
  exercise: string;
  challengeId?: string;
  challengeDayId?: string;
  // Embedded count mode (session form-check overlay): the rep count is
  // handed to the parent and nothing is POSTed. Session logging stays the
  // single write path, so camera sets never double-log.
  onCount?: (reps: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);
  const startedAtRef = useRef(0);
  const stopRef = useRef(false);
  // Re-entry guard: two rapid taps on Start must not open two streams -
  // the orphaned one would keep the camera on after everything stops.
  const startingRef = useRef(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [reps, setReps] = useState(0);
  const [cue, setCue] = useState('');
  // Voice cues default on; persisted so a muted gym stays muted.
  const [voiceOn, setVoiceOn] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('100xu-voice') !== 'off';
  });
  const [score, setScore] = useState<number | null>(null);
  const [issueKeys, setIssueKeys] = useState<string[]>([]);
  const [framed, setFramed] = useState(true);
  const framedRef = useRef(true);
  // Local set replay: recorded from the same camera stream, kept as a blob
  // URL on this device only, never uploaded. Hidden where MediaRecorder
  // does not exist; detected after mount to avoid SSR mismatch.
  const [canRecord, setCanRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const replayUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setCanRecord(typeof MediaRecorder !== 'undefined');
  }, []);

  useEffect(() => {
    voiceService.setEnabled(voiceOn);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('100xu-voice', voiceOn ? 'on' : 'off');
    }
  }, [voiceOn]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
      if (replayUrlRef.current) URL.revokeObjectURL(replayUrlRef.current);
    };
  }, []);

  function setReplay(url: string | null) {
    if (replayUrlRef.current) URL.revokeObjectURL(replayUrlRef.current);
    replayUrlRef.current = url;
    setReplayUrl(url);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
      return;
    }
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      setReplay(URL.createObjectURL(new Blob(chunksRef.current, { type: 'video/webm' })));
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [coachUnavailable, setCoachUnavailable] = useState(false);

  const supported = createAnalyzer(exercise) !== null;

  const stopCamera = useCallback(() => {
    stopRef.current = true;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  // A new exercise on a surviving instance (card remount aside) must never
  // keep counting - or streaming - for the previous movement.
  useEffect(() => {
    stopCamera();
  }, [exercise, stopCamera]);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    const analyzer = createAnalyzer(exercise);
    if (!analyzer) {
      startingRef.current = false;
      return;
    }
    analyzerRef.current = analyzer;
    setStatus('loading');
    setError('');
    setCoaching(null);
    setCoachUnavailable(false);
    setReps(0);
    setCue('');
    setScore(null);
    setIssueKeys([]);
    setReplay(null);
    framedRef.current = true;
    setFramed(true);
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
      startingRef.current = false;
      let lastTime = -1;
      const loop = () => {
        if (stopRef.current || !videoRef.current) return;
        const now = performance.now();
        if (video.currentTime !== lastTime && video.videoWidth > 0) {
          lastTime = video.currentTime;
          const lm = landmarker.detectForVideo(video, now).landmarks?.[0];
          const points = lm ? toPoints(lm) : [];
          const isFramed = lm ? landmarksVisible(points) : false;
          if (isFramed !== framedRef.current) {
            framedRef.current = isFramed;
            setFramed(isFramed);
          }
          if (lm) {
            drawSkeleton(canvasRef.current, video, lm);
            const rep = analyzer.update(points, now);
            if (rep) {
              setReps(rep.rep);
              const summary = analyzer.summary();
              setScore(Math.round(summary.averageScore));
              setIssueKeys(topIssues(summary.issues));
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
      startingRef.current = false;
      stopCamera();
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Camera failed to start.');
    }
  }, [exercise, stopCamera]);

  const finish = useCallback(async () => {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;
    if (onCount) {
      stopCamera();
      onCount(analyzer.summary().totalReps);
      return;
    }
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
  }, [exercise, challengeId, challengeDayId, onCount, stopCamera]);

  // Ring fills per round of 10, matching the 10x10 circuit.
  const ringFrac = reps === 0 ? 0 : ((reps - 1) % 10 + 1) / 10;

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
        {(status === 'idle' || status === 'loading' || status === 'running') && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div
              className={`h-4/5 w-3/4 rounded-xl border-2 border-dashed ${
                framed && status === 'running' ? 'border-volt/60' : 'border-white/25'
              }`}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0" role="img" aria-label={`${reps} reps`}>          <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden>
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="7"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#F15A0A"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringFrac)}
            />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
            {reps}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide">FORM {score ?? '--'}</p>
          <p className="truncate text-sm text-muted-foreground">
            {status === 'running' ? cue || 'Good - keep going' : cue}
          </p>
          {issueKeys.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {issueKeys.map((key) => (
                <span
                  key={key}
                  className="rounded-sm border border-volt/40 bg-volt/10 px-1.5 py-0.5 text-[11px] font-medium text-volt"
                >
                  {RULE_PHRASES[key] ?? key}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-tap min-w-tap shrink-0"
          aria-label={voiceOn ? 'Mute voice cues' : 'Unmute voice cues'}
          aria-pressed={voiceOn}
          onClick={() => setVoiceOn((v) => !v)}
        >
          {voiceOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </Button>
      </div>
      {status === 'running' && !framed && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-500">
          Get your full body in frame.
        </p>
      )}
      {status === 'idle' || status === 'error' ? (
        <Button onClick={start} disabled={!supported} size="lg">
          {supported ? 'Start camera' : `Camera counting is not available for ${exercise} yet`}
        </Button>
      ) : status === 'running' ? (
        <div className="flex gap-2">
          <Button onClick={() => void finish()} size="lg" variant="secondary" className="flex-1">
            {onCount ? `Use ${reps} reps` : 'Finish set'}
          </Button>
          {canRecord && (
            <Button onClick={toggleRecording} size="lg" variant="outline" aria-pressed={recording}>
              <span
                aria-hidden
                className={`size-2 rounded-full ${recording ? 'bg-red-500' : 'bg-muted-foreground'}`}
              />
              <span className="ml-2">{recording ? 'Stop' : 'Record'}</span>
            </Button>
          )}
        </div>
      ) : null}
      {(status === 'saving') && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
      {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
      {replayUrl && !recording && (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <video
            src={replayUrl}
            controls
            playsInline
            className="aspect-[4/3] w-full rounded-md bg-black"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Your replay - stored on this device only, never uploaded.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setReplay(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
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

// Mirror-aware skeleton overlay so the user can frame themselves and see
// what the counter sees. Bones in orange, joints in white.
const BONES: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
];

const RING_CIRCUMFERENCE = 2 * Math.PI * 34;

function drawSkeleton(
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
  const px = (p: { x: number; y: number }): [number, number] => [(1 - p.x) * w, p.y * h];
  ctx.strokeStyle = '#F15A0A';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    const p = pts[a];
    const q = pts[b];
    if (!p || !q) continue;
    const [ax, ay] = px(p);
    const [bx, by] = px(q);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFFFFF';
  for (const p of pts) {
    const [x, y] = px(p);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
