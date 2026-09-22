import { Buffer } from 'node:buffer';
import { ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import {
  EXERCISE_IMAGE_MIME_TYPES,
  EXERCISE_VIDEO_MIME_TYPES,
  MAX_EXERCISE_VIDEO_BYTES,
  type ExerciseImageMimeType,
  type ExerciseVideoKind,
  type ExerciseVideoMimeType,
  exerciseVideoKind,
} from './exercise-video';

export { toExerciseVideoEmbed } from './exercise-video';
export type { ExerciseVideoKind, ExerciseVideoMimeType };
export { EXERCISE_VIDEO_MIME_TYPES };
export type { ExerciseImageMimeType } from './exercise-video';

export const MAX_EXERCISE_IMAGE_BYTES = 5 * 1024 * 1024;

export interface SetExerciseTechniqueImageInput {
  imageBase64: string;
  mimeType: ExerciseImageMimeType;
}

export function decodeExerciseImage(
  raw: string,
  declaredMimeType?: ExerciseImageMimeType,
): { bytes: Uint8Array<ArrayBuffer>; mimeType: ExerciseImageMimeType } {
  const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(raw.trim());
  const mimeType = (dataUrl?.[1] ?? declaredMimeType) as ExerciseImageMimeType | undefined;
  if (!mimeType || !EXERCISE_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new ApiError(400, 'Uploaded technique photo must be JPEG, PNG, or WebP.');
  }
  if (dataUrl && declaredMimeType && dataUrl[1] !== declaredMimeType) {
    throw new ApiError(400, 'The declared image MIME type does not match the data URL.');
  }
  const bytes = Buffer.from(dataUrl?.[2] ?? raw, 'base64');
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_EXERCISE_IMAGE_BYTES) {
    throw new ApiError(400, 'Uploaded technique photo must be non-empty and under 5 MB.');
  }
  return { bytes, mimeType };
}

export async function getExerciseTechniqueImage(name: string) {
  const clean = name.trim();
  const row = clean
    ? await db.exerciseMediaUpload.findUnique({ where: { name: clean } })
    : null;
  if (!row?.imageData || !row?.imageMimeType)
    throw new ApiError(404, 'No uploaded technique photo for this exercise.');
  if (
    !EXERCISE_IMAGE_MIME_TYPES.includes(row.imageMimeType as ExerciseImageMimeType)
  ) {
    throw new ApiError(500, 'Uploaded technique photo has an unsupported MIME type.');
  }
  return {
    bytes: Buffer.from(row.imageData),
    mimeType: row.imageMimeType as ExerciseImageMimeType,
    updatedAt: row.updatedAt,
  };
}

export async function setExerciseTechniqueImage(
  name: string,
  input: SetExerciseTechniqueImageInput,
) {
  const clean = name.trim();
  if (!clean) throw new ApiError(400, 'Exercise name is required.');
  const decoded = decodeExerciseImage(input.imageBase64, input.mimeType);
  return db.exerciseMediaUpload.upsert({
    where: { name: clean },
    update: { imageData: decoded.bytes, imageMimeType: decoded.mimeType },
    create: { name: clean, imageData: decoded.bytes, imageMimeType: decoded.mimeType },
    select: { name: true, imageMimeType: true, updatedAt: true },
  });
}

export async function deleteExerciseTechniqueImage(name: string) {
  const clean = name.trim();
  const row = clean
    ? await db.exerciseMediaUpload.findUnique({ where: { name: clean } })
    : null;
  if (!row?.imageData || !row?.imageMimeType) {
    throw new ApiError(404, 'No uploaded technique photo for this exercise.');
  }
  // Clearing only the photo columns keeps an attached demo video intact.
  const videoLeft = row.videoUrl || (row.videoData && row.videoMimeType);
  if (videoLeft) {
    await db.exerciseMediaUpload.update({
      where: { name: clean },
      data: { imageData: null, imageMimeType: null },
    });
  } else {
    await db.exerciseMediaUpload.delete({ where: { name: clean } });
  }
  return { name: clean };
}

const VIDEO_LINK_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'player.vimeo.com',
]);

// Demo video links must be https, either on a known stream host or a direct
// mp4/webm file. Anything else is rejected so the dialog never embeds an
// unexpected page.
export function validateExerciseVideoUrl(raw: string): string {
  const url = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ApiError(400, 'Demo video must be an https link.');
  }
  if (parsed.protocol !== 'https:') {
    throw new ApiError(400, 'Demo video must be an https link.');
  }
  const host = parsed.hostname.toLowerCase();
  if (VIDEO_LINK_HOSTS.has(host)) return url;
  if (/\.(mp4|webm)$/i.test(parsed.pathname)) return url;
  throw new ApiError(
    400,
    'Demo video must be a YouTube/Vimeo link or a direct mp4/webm file.',
  );
}

export function decodeExerciseVideo(
  raw: string,
  declaredMimeType?: ExerciseVideoMimeType,
): { bytes: Uint8Array<ArrayBuffer>; mimeType: ExerciseVideoMimeType } {
  const dataUrl = /^data:(video\/(?:mp4|webm));base64,(.+)$/s.exec(raw.trim());
  const mimeType = (dataUrl?.[1] ?? declaredMimeType) as ExerciseVideoMimeType | undefined;
  if (!mimeType || !EXERCISE_VIDEO_MIME_TYPES.includes(mimeType)) {
    throw new ApiError(400, 'Uploaded demo video must be MP4 or WebM.');
  }
  if (dataUrl && declaredMimeType && dataUrl[1] !== declaredMimeType) {
    throw new ApiError(400, 'The declared video MIME type does not match the data URL.');
  }
  const bytes = Buffer.from(dataUrl?.[2] ?? raw, 'base64');
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_EXERCISE_VIDEO_BYTES) {
    throw new ApiError(400, 'Uploaded demo video must be non-empty and under 25 MB.');
  }
  return { bytes, mimeType };
}

export async function getExerciseVideo(name: string): Promise<
  | { kind: 'url'; url: string; videoKind: ExerciseVideoKind; updatedAt: Date }
  | { kind: 'file'; bytes: Buffer; mimeType: ExerciseVideoMimeType; updatedAt: Date }
> {
  const clean = name.trim();
  const row = clean
    ? await db.exerciseMediaUpload.findUnique({ where: { name: clean } })
    : null;
  if (row?.videoUrl) {
    return {
      kind: 'url',
      url: row.videoUrl,
      videoKind: exerciseVideoKind(row.videoUrl),
      updatedAt: row.updatedAt,
    };
  }
  if (row?.videoData && row?.videoMimeType) {
    if (!EXERCISE_VIDEO_MIME_TYPES.includes(row.videoMimeType as ExerciseVideoMimeType)) {
      throw new ApiError(500, 'Uploaded demo video has an unsupported MIME type.');
    }
    return {
      kind: 'file',
      bytes: Buffer.from(row.videoData),
      mimeType: row.videoMimeType as ExerciseVideoMimeType,
      updatedAt: row.updatedAt,
    };
  }
  throw new ApiError(404, 'No demo video for this exercise.');
}

export async function setExerciseVideoUrl(name: string, videoUrl: string) {
  const clean = name.trim();
  if (!clean) throw new ApiError(400, 'Exercise name is required.');
  const url = validateExerciseVideoUrl(videoUrl);
  return db.exerciseMediaUpload.upsert({
    where: { name: clean },
    update: { videoUrl: url, videoData: null, videoMimeType: null },
    create: { name: clean, videoUrl: url },
    select: { name: true, videoUrl: true, updatedAt: true },
  });
}

export async function setExerciseVideoFile(
  name: string,
  input: { imageBase64: string; mimeType: ExerciseVideoMimeType },
) {
  const clean = name.trim();
  if (!clean) throw new ApiError(400, 'Exercise name is required.');
  const decoded = decodeExerciseVideo(input.imageBase64, input.mimeType);
  return db.exerciseMediaUpload.upsert({
    where: { name: clean },
    update: { videoUrl: null, videoData: decoded.bytes, videoMimeType: decoded.mimeType },
    create: {
      name: clean,
      videoData: decoded.bytes,
      videoMimeType: decoded.mimeType,
    },
    select: { name: true, videoMimeType: true, updatedAt: true },
  });
}

export async function deleteExerciseVideo(name: string) {
  const clean = name.trim();
  const row = clean
    ? await db.exerciseMediaUpload.findUnique({ where: { name: clean } })
    : null;
  if (!row || (!row.videoUrl && !row.videoData)) {
    throw new ApiError(404, 'No demo video for this exercise.');
  }
  // Clearing only the video columns keeps an uploaded photo intact.
  const photoLeft = row.imageData && row.imageMimeType;
  if (photoLeft) {
    await db.exerciseMediaUpload.update({
      where: { name: clean },
      data: { videoUrl: null, videoData: null, videoMimeType: null },
    });
  } else {
    await db.exerciseMediaUpload.delete({ where: { name: clean } });
  }
  return { name: clean };
}

// Single probe for admin tables and dialogs: what uploaded media exists.
export async function getExerciseMediaMeta(name: string) {
  const clean = name.trim();
  const row = clean
    ? await db.exerciseMediaUpload.findUnique({ where: { name: clean } })
    : null;
  return {
    name: clean,
    hasPhoto: Boolean(row?.imageData && row?.imageMimeType),
    hasVideo: Boolean(row?.videoUrl || (row?.videoData && row?.videoMimeType)),
  };
}
