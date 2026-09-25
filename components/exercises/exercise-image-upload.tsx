'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, Link2, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toExerciseVideoEmbed } from '@/lib/exercise-video';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

type VideoState =
  | { status: 'unknown' | 'missing' }
  | { status: 'link'; url: string }
  | { status: 'file' };

// Admin-only technique photo upload. One photo per movement name, shared
// across every user. Rendered only for admins by the exercise detail page.
// onChanged fires after every successful mutation so parents (e.g. the admin
// media table) can refresh their status flags.
export function ExerciseImageUpload({
  exerciseName,
  onChanged,
}: {
  exerciseName: string;
  onChanged?: () => void;
}) {
  const t = useTranslations('exercises.media');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [hasPhoto, setHasPhoto] = useState<boolean | null>(null);
  const [video, setVideo] = useState<VideoState>({ status: 'unknown' });
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const photoUrl = `/api/exercise-media?name=${encodeURIComponent(exerciseName)}&v=${version}`;
  const videoSrc = `/api/exercise-media?name=${encodeURIComponent(exerciseName)}&format=video&v=${version}`;

  useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch(
          `/api/exercise-media?name=${encodeURIComponent(exerciseName)}&format=video`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setVideo({ status: 'missing' });
          return;
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as { url?: string };
          setVideo(data.url ? { status: 'link', url: data.url } : { status: 'missing' });
        } else {
          setVideo({ status: 'file' });
        }
      } catch {
        if (!cancelled) setVideo({ status: 'missing' });
      }
    }
    void probe();
    return () => {
      cancelled = true;
    };
  }, [exerciseName, version]);

  function embedUrl(url: string): string | null {
    try {
      return toExerciseVideoEmbed(url);
    } catch {
      return null;
    }
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
  }

  async function onFile(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('invalidType'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('tooLarge'));
      return;
    }
    setBusy(true);
    try {
      const imageBase64 = await readFileAsDataUrl(file);
      const res = await fetch('/api/exercise-media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: exerciseName, imageBase64, mimeType: file.type }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? t('uploadError'));
      }
      setHasPhoto(true);
      setVersion((v) => v + 1);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/exercise-media?name=${encodeURIComponent(exerciseName)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? t('uploadError'));
      }
      setHasPhoto(false);
      setVersion((v) => v + 1);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'));
    } finally {
      setBusy(false);
    }
  }

  async function putVideo(body: Record<string, string>) {
    const res = await fetch('/api/exercise-media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: exerciseName, ...body }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? t('uploadError'));
    }
    setVersion((v) => v + 1);
    onChanged?.();
  }

  async function attachLink() {
    if (busy || !videoUrlInput.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await putVideo({ videoUrl: videoUrlInput.trim() });
      setVideoUrlInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'));
    } finally {
      setBusy(false);
    }
  }

  async function onVideoFile(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError(t('invalidVideoType'));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(t('videoTooLarge'));
      return;
    }
    setBusy(true);
    try {
      const videoBase64 = await readFileAsDataUrl(file);
      await putVideo({ videoBase64, videoMimeType: file.type });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'));
    } finally {
      setBusy(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }

  async function removeVideo() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/exercise-media?name=${encodeURIComponent(exerciseName)}&kind=video`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? t('uploadError'));
      }
      setVideo({ status: 'missing' });
      setVersion((v) => v + 1);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('uploadTitle')}</CardTitle>
        <CardDescription>{t('uploadHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Existence probe: one request, decides preview vs empty state. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          aria-hidden
          className="hidden"
          onLoad={() => setHasPhoto(true)}
          onError={() => setHasPhoto(false)}
        />
        {hasPhoto === true && (
          <div className="overflow-hidden rounded-md border bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={t('uploadedAlt', { name: exerciseName })}
              className="aspect-[3/2] w-full object-contain"
            />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            aria-label={t('choosePhoto')}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            <span className="ml-2">{busy ? t('saving') : t('choosePhoto')}</span>
          </Button>
          {hasPhoto === true && (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>
              <Trash2 className="size-4" />
              <span className="ml-2">{t('removePhoto')}</span>
            </Button>
          )}
        </div>

        <div className="border-t pt-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Video className="size-4" />
            {t('demoVideo')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('videoHint')}</p>
          {video.status === 'link' && embedUrl(video.url) && (
            <div className="mt-2 overflow-hidden rounded-md border bg-black">
              <iframe
                src={embedUrl(video.url) ?? undefined}
                title={t('demoVideo')}
                className="aspect-video w-full"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {video.status === 'file' && (
            <div className="mt-2 overflow-hidden rounded-md border bg-black">
              <video src={videoSrc} controls playsInline className="aspect-video w-full" />
            </div>
          )}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder={t('videoLinkPlaceholder')}
                aria-label={t('demoVideo')}
                inputMode="url"
                className="min-h-tap"
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy || !videoUrlInput.trim()}
                onClick={() => void attachLink()}
                className="shrink-0"
              >
                <Link2 className="size-4" />
                <span className="ml-2">{t('attachLink')}</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={videoFileRef}
                type="file"
                accept={ACCEPTED_VIDEO_TYPES.join(',')}
                className="hidden"
                aria-label={t('uploadVideoFile')}
                onChange={(e) => void onVideoFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => videoFileRef.current?.click()}
              >
                <Video className="size-4" />
                <span className="ml-2">{t('uploadVideoFile')}</span>
              </Button>
              {(video.status === 'link' || video.status === 'file') && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void removeVideo()}
                >
                  <Trash2 className="size-4" />
                  <span className="ml-2">{t('removeVideo')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
