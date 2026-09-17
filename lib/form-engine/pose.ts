import type { NormalizedLandmark, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Point } from './angles';

// Client-side pose loader. The tasks-vision import is dynamic so the wasm
// glue never enters the server bundle; call only from 'use client' code.
// Resolves once and reuses the same landmarker across workouts.
let cached: Promise<PoseLandmarker> | null = null;

async function create(mode: { delegate: 'GPU' | 'CPU' }): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker: Landmarker } =
    await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
  );
  return Landmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
      delegate: mode.delegate,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  cached ??= create({ delegate: 'GPU' }).catch(() => {
    // ponytail: weak iGPUs reject the GPU delegate; CPU still hits 30fps
    // on the lite model, so retry there instead of failing the workout.
    cached = create({ delegate: 'CPU' });
    return cached;
  });
  return cached;
}

// BlazePose landmarks -> engine points. Missing visibility reads as 0 so
// landmarksVisible() rejects the frame instead of scoring garbage.
export function toPoints(landmarks: NormalizedLandmark[]): Point[] {
  return landmarks.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility ?? 0 }));
}
