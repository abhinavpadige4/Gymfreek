'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CirclePlay, Dumbbell, ExternalLink, Pause, Play, SkipBack, SkipForward, Wrench } from 'lucide-react';
import type { EquipmentType } from '@/lib/prisma-client';
import { getExerciseMedia } from '@/lib/exercise-media';
import { toExerciseVideoEmbed } from '@/lib/exercise-video';
import { equipmentTypeMessageKeys } from '@/i18n/enum-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createAnalyzer } from '@/lib/form-engine/registry';
import { SquatAnalyzer } from '@/lib/form-engine/squat';
import { PushupAnalyzer } from '@/lib/form-engine/pushup';
import { HingeAnalyzer } from '@/lib/form-engine/hinge';
import { PressAnalyzer } from '@/lib/form-engine/press';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  exerciseName: string;
  displayName: string;
  equipmentType: EquipmentType;
  compact?: boolean;
  // Catalog technique cue. Shown as the HOW TO PERFORM card when no photo
  // frames exist for this movement.
  notes?: string | null;
}

export function commonsQuery(exerciseName: string): string {
  const analyzer = createAnalyzer(exerciseName);
  if (analyzer instanceof SquatAnalyzer) return 'Barbell squat';
  if (analyzer instanceof PushupAnalyzer) return 'Push-up';
  if (analyzer instanceof HingeAnalyzer) return 'Kettlebell swing';
  if (analyzer instanceof PressAnalyzer) return 'Overhead press';
  return exerciseName;
}

export function ExerciseMediaDialog({
  exerciseName,
  displayName,
  equipmentType,
  compact = false,
  notes = null,
}: Props) {
  const t = useTranslations('exercises.media');
  const exerciseT = useTranslations('exercises');
  const media = getExerciseMedia(exerciseName);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  // Admin-uploaded photo probe. Lazy: a single hidden request only when the
  // dialog opens, never for list thumbnails. Falls back to dataset frames,
  // then the technique card.
  const [upload, setUpload] = useState<'unknown' | 'ok' | 'missing'>('unknown');
  // Demo video probe (link or file). Shown first when present.
  const [video, setVideo] = useState<
    | { status: 'unknown' | 'missing' }
    | { status: 'link'; url: string }
    | { status: 'file' }
  >({ status: 'unknown' });

  useEffect(() => {
    if (!open) return;
    setUpload('unknown');
    setVideo({ status: 'unknown' });
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
  }, [open, exerciseName]);

  const uploadUrl = `/api/exercise-media?name=${encodeURIComponent(exerciseName)}`;
  const videoSrc = `${uploadUrl}&format=video`;

  function embedUrl(url: string): string | null {
    try {
      return toExerciseVideoEmbed(url);
    } catch {
      return null;
    }
  }

  const demoEmbed =
    video.status === 'link' ? embedUrl(video.url) : null;

  useEffect(() => {
    if (!open || !playing || !media) return;
    const timer = window.setInterval(() => setFrame((current) => (current === 0 ? 1 : 0)), 1400);
    return () => window.clearInterval(timer);
  }, [media, open, playing]);

  function changeOpen(value: boolean) {
    setOpen(value);
    if (value) {
      setFrame(0);
      setPlaying(true);
    }
  }

  // Commons has no photos for exact variation names ("Dual dumbbell front
  // squats Dumbbell" finds nothing), so mapped lifts search their family
  // term instead - verified to return results. Unmapped customs keep
  // their own name as the query.

  // Defensive fallback: rows seeded or imported under a newer enum value than
  // this bundle knows render as "other" instead of crashing the page.
  const equipmentLabel = exerciseT(
    `equipmentTypes.${equipmentTypeMessageKeys[equipmentType] ?? 'other'}`,
  );
  const commonsUrl = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(
    commonsQuery(exerciseName),
  )}&title=Special:MediaSearch&type=image`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        {compact ? (
          // A fixed 64px slot whether or not media exists, so catalog cards
          // share one leading column and one row height (issue #330). With
          // media the start frame is the thumbnail; without it the slot holds
          // a muted play icon at the same size.
          <Button
            type="button"
            variant="outline"
            className="relative size-16 min-h-tap min-w-tap shrink-0 overflow-hidden p-0"
            aria-label={t('open', { name: displayName })}
            title={t('button')}
          >
        {open && upload === 'unknown' && (
          <img
            src={uploadUrl}
            alt=""
            aria-hidden
            className="hidden"
            onLoad={() => setUpload('ok')}
            onError={() => setUpload('missing')}
          />
        )}
        {video.status === 'file' || demoEmbed ? (
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-md border bg-black">
              {video.status === 'file' ? (
                <video src={videoSrc} controls playsInline className="h-full w-full" />
              ) : (
                <iframe
                  src={demoEmbed ?? undefined}
                  title={t('demoVideo')}
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
              <Badge className="absolute bottom-2 left-2">{t('demoVideo')}</Badge>
            </div>
          </div>
        ) : null}
        {video.status !== 'file' && !demoEmbed && upload === 'ok' ? (
          <div className="space-y-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-md border bg-black">
              {/* Admin-uploaded technique photo, shared across users. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadUrl}
                alt={t('uploadedAlt', { name: displayName })}
                className="h-full w-full object-contain"
              />
              <Badge className="absolute bottom-2 left-2">{t('uploadedBadge')}</Badge>
            </div>

            <div className="border-t pt-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Wrench className="size-4" />
                <span>{t('equipment')}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {t('equipmentDescription', { equipment: equipmentLabel })}
              </p>
            </div>
          </div>
        ) : media ? (
              <>
                <Image
                  src={media.frames[0]}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 rounded-full bg-background/80 p-0.5">
                  <CirclePlay className="size-4" />
                </span>
              </>
            ) : (
              <CirclePlay className="size-4 text-muted-foreground" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-tap self-start"
            aria-label={t('open', { name: displayName })}
          >
            <CirclePlay className="size-4" />
            <span className="ml-2">{t('button')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {media ? (
          <div className="space-y-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-md border bg-black">
              {media.frames.map((source, index) => (
                <Image
                  key={source}
                  src={source}
                  alt={t(index === 0 ? 'startAlt' : 'finishAlt', { name: displayName })}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 90vw, 560px"
                  className={`object-contain transition-opacity duration-300 ${
                    frame === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <Badge className="absolute bottom-2 left-2">
                {t(frame === 0 ? 'start' : 'finish')}
              </Badge>
              {media.approximate && (
                <Badge variant="secondary" className="absolute right-2 top-2">
                  {t('similarVariant')}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setPlaying(false);
                  setFrame(0);
                }}
                aria-label={t('showStart')}
                title={t('showStart')}
              >
                <SkipBack className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlaying((value) => !value)}
                aria-label={t(playing ? 'pause' : 'play')}
                title={t(playing ? 'pause' : 'play')}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setPlaying(false);
                  setFrame(1);
                }}
                aria-label={t('showFinish')}
                title={t('showFinish')}
              >
                <SkipForward className="size-4" />
              </Button>
            </div>

            <div className="border-t pt-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Wrench className="size-4" />
                <span>{t('equipment')}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {t('equipmentDescription', { equipment: equipmentLabel })}
              </p>
            </div>

            <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
              <p>{t('disclaimer')}</p>
              <a
                href={media.source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
              >
                {t('source', { source: media.source.name, license: media.source.license })}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-sm">
            {notes ? (
              <div className="rounded-md border border-volt/30 bg-volt/5 p-4">
                <p className="flex items-center gap-2 font-display text-base tracking-wide">
                  <Dumbbell className="size-4 text-volt" />
                  {t('howToPerform')}
                </p>
                <p className="mt-2 leading-relaxed text-foreground/90">{notes}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('equipmentDescription', { equipment: equipmentLabel })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('missing')}</p>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={commonsUrl} target="_blank" rel="noreferrer">
                {t('searchCommons')}
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
