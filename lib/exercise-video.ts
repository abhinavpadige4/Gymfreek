// Pure media helpers. Client-safe: no database, no node imports.
// Server code in exercise-technique-image.ts reuses these.

export const EXERCISE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ExerciseImageMimeType = (typeof EXERCISE_IMAGE_MIME_TYPES)[number];

export const EXERCISE_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export type ExerciseVideoMimeType = (typeof EXERCISE_VIDEO_MIME_TYPES)[number];
export const MAX_EXERCISE_VIDEO_BYTES = 25 * 1024 * 1024;

const STREAM_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'player.vimeo.com',
]);

export type ExerciseVideoKind = 'youtube' | 'vimeo' | 'file';

export function exerciseVideoKind(url: string): ExerciseVideoKind {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('youtu')) return 'youtube';
  if (host.includes('vimeo')) return 'vimeo';
  return 'file';
}

// Privacy-respecting embed for stream hosts; direct files play as-is.
export function toExerciseVideoEmbed(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  if (host.includes('youtu')) {
    const id =
      host === 'youtu.be'
        ? parsed.pathname.slice(1)
        : parsed.pathname.startsWith('/shorts/')
          ? parsed.pathname.split('/')[2]
          : parsed.searchParams.get('v');
    if (!id) throw new Error('Could not read the YouTube video id.');
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (host.includes('vimeo')) {
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    if (!id) throw new Error('Could not read the Vimeo video id.');
    return `https://player.vimeo.com/video/${id}`;
  }
  return url;
}
