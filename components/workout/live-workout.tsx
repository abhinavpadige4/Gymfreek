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
  autoStart = false,
}: {
  exercise: string;
  challengeId?: string;
  challengeDayId?: string;
  // Embedded count mode (session form-check overlay): the rep count is
  // handed to the parent and nothing is POSTed. Session logging stays the
  // single write path, so camera sets never double-log.
  onCount?: (reps: number) => void;
  // Guided-runner mode: skip the Start tap, run a 5-4-3-2-1 countdown and
  // open the camera directly.
  autoStart?: boolean;
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

  const [replayMime, setReplayMime] = useState('video/webm');
  const [replayExt, setReplayExt] = useState('webm');
  const [sharing, setSharing] = useState(false);

  function pickMime(): { mime: string; ext: string } {
    // ponytail: probe order prefers mp4 (iOS Safari) then webm.
    const candidates: Array<[string, string]> = [
      ['video/mp4', 'mp4'],
      ['video/webm;codecs=h264,opus', 'webm'],
      ['video/webm', 'webm'],
    ];
    try {
      for (const [mime, ext] of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(mime)) {
          return { mime, ext };
        }
      }
    } catch {
      // ignore probe failure, fall through
    }
    return { mime: 'video/webm', ext: 'webm' };
  }

  useEffect(() => {
    setCanRecord(
      typeof MediaRecorder !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia,
    );
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

  // Auto-record preference for guided-runner mode: when on, recording starts
  // by itself the moment the countdown ends. Persisted, defaults on.
  const [autoRecOn, setAutoRecOn] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('100xu-autorecord') !== 'off';
  });
  const recStateRef = useRef({ canRecord: false, recording: false, pref: true });
  recStateRef.current = { canRecord, recording, pref: autoRecOn };

  const startRecording = useCallback(() => {
    if (recorderRef.current) return;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) return;
    chunksRef.current = [];
    const { mime, ext } = pickMime();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        return;
      }
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mime;
      setReplayMime(type);
      setReplayExt(type.includes('mp4') ? 'mp4' : ext);
      setReplay(URL.createObjectURL(new Blob(chunksRef.current, { type })));
    };
    recorderRef.current = recorder;
    try {
      recorder.start(250);
    } catch {
      recorder.start();
    }
    setRecording(true);
  }, []);
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('100xu-autorecord', autoRecOn ? 'on' : 'off');
    }
  }, [autoRecOn]);

  function toggleRecording() {
    if (recording) {
      stopRecording();
      return;
    }
    startRecording();
  }

  async function shareReplay() {
    if (!replayUrl) return;
    try {
      setSharing(true);
      const res = await fetch(replayUrl);
      const blob = await res.blob();
      const file = new File([blob], `100xu-${exercise}.${replayExt}`, { type: replayMime });
      const nav = navigator as Navigator & { share?: (d: { files: File[]; title: string }) => Promise<void>; canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] }) || nav.share) {
        await nav.share({ files: [file], title: '100XU form check' });
        return;
      }
      const a = document.createElement('a');
      a.href = replayUrl;
      a.download = `100xu-${exercise}.${replayExt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setSharing(false);
    }
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
    // Inside the tap: unlocks mobile speech for every later cue.
    voiceService.unlock();
    if (!navigator.mediaDevices?.getUserMedia) {
      startingRef.current = false;
      setStatus('error');
      setError('Camera needs HTTPS and a browser with camera support (Safari 14.3+).');
      return;
    }
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
      const existing = videoRef.current?.srcObject as MediaStream | null;
      const live = existing?.getVideoTracks().some((t) => t.readyState === 'live') ? existing : null;
      const [landmarker, stream] = await Promise.all([
        loadPoseLandmarker(),
        live ??
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
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

  // Auto-start countdown for the guided runner: 5-4-3-2-1 over live camera
  // preview so the user can frame themselves while it ticks, then counting
  // begins with no second tap. Runs once per mount. The countdown shows
  // immediately (no Start button); the camera stream attaches behind it.
  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!autoStart) return;
    setCountdown(5);
    let n = 5;
    void start();
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        setCountdown(null);
        // Guided runner: recording starts by itself when the countdown ends.
        const s = recStateRef.current;
        if (s.pref && s.canRecord && !s.recording) startRecordingRef.current();
        return;
      }
      setCountdown(n);
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

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
          autoPlay
          muted
          className="aspect-[4/3] w-full -scale-x-100 object-cover"
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {countdown != null && status === 'running' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <p className="font-display text-6xl tabular-nums text-white" aria-live="polite">
              {countdown}
            </p>
            <p className="mt-1 text-sm text-white/80">Get in frame - counting starts soon</p>
          </div>
        )}
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
        countdown != null ? (
          <p className="py-4 text-center font-display text-6xl tabular-nums" aria-live="polite">
            {countdown}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button onClick={start} disabled={!supported} size="lg">
              {supported ? 'Start camera' : `Camera counting is not available for ${exercise} yet`}
            </Button>
            {supported && (
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                The camera counts your reps on this device - video never leaves your phone.
              </p>
            )}
          </div>
        )
      ) : status === 'running' ? (
        <>
        {autoStart && canRecord && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRecOn}
              onChange={(e) => setAutoRecOn(e.target.checked)}
              className="size-4 shrink-0 accent-[#D94A05]"
            />
            Auto-record when the countdown ends
          </label>
        )}
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
        </>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Your replay - stored on this device only, never uploaded.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={replayUrl} download={`100xu-${exercise}.${replayExt}`}>
                  Download
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={shareReplay} disabled={sharing}>
                {sharing ? 'Sharing...' : 'Share'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReplay(null)}>
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
      {coaching && (
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">AI coaching</p>
          <p className="mt-1 font-medium">{coaching.summary}</p>
          {coaching.improvements.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {coaching.improvements.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            AI guidance for fitness support only - not medical advice. Stop and get help if you
            feel pain, dizziness, or chest discomfort.
          </p>
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
