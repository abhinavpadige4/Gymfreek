'use client';

import { useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { muscleGroupMessageKeys } from '@/i18n/enum-keys';
import type { BodyView, HeatLevel, MuscleMapRegion } from '@/lib/muscle-map';
import { buildMuscleMap } from '@/lib/muscle-map';
import type { MuscleGroup } from '@/lib/prisma-client';
import { BODY_FILL, BODY_OUTLINE_PATHS, BODY_VIEWBOX, REGION_PATHS } from './body-paths';
import { cn } from '@/lib/utils';

// Identity hue per muscle group: hue tells you WHICH muscle, brightness
// tells you HOW trained (the MEV/MRV band). Screen-reader labels and the
// tap-for-details line carry the same truth, so color is never load-bearing.
export const GROUP_FILL: Record<MuscleGroup, string> = {
  CHEST: '#FF6B52',
  ABS: '#FFD93B',
  SHOULDERS_FRONT: '#FFC93C',
  SHOULDERS_LATERAL: '#FFC93C',
  SHOULDERS_REAR: '#FFA41B',
  BICEPS: '#BB6CFF',
  TRICEPS: '#A855F7',
  FOREARMS: '#F97FBF',
  QUADS: '#FFA94D',
  HAMSTRINGS: '#22C55E',
  GLUTES: '#40E0A0',
  BACK_WIDTH: '#6AAFFF',
  BACK_THICKNESS: '#4B8DFF',
  LOWER_BACK: '#8F97FF',
  CALVES: '#35E0CB',
  OTHER: BODY_FILL,
};

const LEGEND_SWATCH: Record<HeatLevel, CSSProperties> = {
  none: { background: BODY_FILL, border: '1px solid #3a3a42' },
  low: { background: 'rgba(241,90,10,0.4)' },
  optimal: { background: '#F15A0A' },
  high: { background: '#F15A0A', boxShadow: '0 0 8px #F15A0A' },
};

const LEGEND_LEVELS: readonly HeatLevel[] = ['none', 'low', 'optimal', 'high'];

// Sample week so anyone (including a brand-new account) can see what a lit
// figure looks like. Display-only: toggling it writes nothing anywhere.
const SAMPLE_SETS: Record<string, number> = {
  CHEST: 14,
  BACK_WIDTH: 12,
  BACK_THICKNESS: 11,
  SHOULDERS_FRONT: 11,
  SHOULDERS_LATERAL: 8,
  SHOULDERS_REAR: 6,
  BICEPS: 6,
  TRICEPS: 9,
  FOREARMS: 3,
  QUADS: 25,
  HAMSTRINGS: 16,
  GLUTES: 12,
  CALVES: 4,
  ABS: 10,
  LOWER_BACK: 2,
};

interface Props {
  regions: MuscleMapRegion[];
  // Preformatted label of the week the map describes (same week as the
  // volume-landmarks card).
  weekLabel: string;
}

// Muscle heat map (issue #299): one glowing human figure, front/back tabs,
// each muscle tinted by this week's working sets against its MEV/MRV band.
// Identity is never color alone: every region carries an accessible label
// with the set count, and tapping/hovering a region prints it below.
export function MuscleMapCard({ regions, weekLabel }: Props) {
  const t = useTranslations('progress.muscleMap');
  const exerciseT = useTranslations('exercises');
  const [selected, setSelected] = useState<MuscleMapRegion | null>(null);
  const [view, setView] = useState<BodyView>('front');
  const [preview, setPreview] = useState(false);

  const shown = preview ? buildMuscleMap(SAMPLE_SETS) : regions;
  const trained = shown.some((r) => r.level !== 'none');

  function togglePreview() {
    setPreview((v) => !v);
    setSelected(null);
  }

  function regionLabel(region: MuscleMapRegion): string {
    return t('regionLabel', {
      name: exerciseT(`muscleGroups.${muscleGroupMessageKeys[region.group]}`),
      sets: region.sets,
      status: t(`status.${region.level}`),
    });
  }

  // Intensity within a level: opacity grows with set count so heavier weeks
  // paint deeper without adding new legend bands.
  function regionOpacity(region: MuscleMapRegion): number {
    if (region.level === 'none' || region.sets <= 0) return 1;
    return Math.min(1, 0.55 + region.sets / 24);
  }

  function regionGlow(region: MuscleMapRegion): string | undefined {
    const c = GROUP_FILL[region.group];
    if (region.level === 'optimal') return `drop-shadow(0 0 5px ${c}) drop-shadow(0 0 16px ${c})`;
    if (region.level === 'high') return `drop-shadow(0 0 7px ${c}) drop-shadow(0 0 24px ${c})`;
    return undefined;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold">
            <span className="truncate">{t('title')}</span>
            {preview && (
              <span className="shrink-0 rounded-full bg-volt px-2 py-0.5 text-[11px] font-bold text-black">
                {t('preview')}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={togglePreview}
            aria-pressed={preview}
            className={cn(
              'min-h-tap shrink-0 rounded-lg px-3 text-xs font-semibold transition-all duration-150 active:scale-95',
              preview
                ? 'bg-volt text-black'
                : 'border border-border text-muted-foreground hover:border-volt/60 hover:text-foreground',
            )}
          >
            {t('preview')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('description', { week: preview ? t('sampleWeek') : weekLabel })}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-1 self-center rounded-xl bg-muted p-1" role="tablist">
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                'min-h-tap rounded-lg px-6 text-sm font-semibold transition-all duration-150 active:scale-95',
                view === v ? 'bg-volt text-black shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(v)}
            </button>
          ))}
        </div>

        <figure className="flex flex-col items-center">
          <svg
            viewBox={BODY_VIEWBOX}
            // role="group", not "img": an img SVG prunes its descendants from the
            // accessibility tree, which would silence the per-region labels.
            role="group"
            aria-label={t(view)}
            className="h-auto w-full max-w-[300px]"
          >
            {BODY_OUTLINE_PATHS.map((d) => (
              <path key={d} d={d} style={{ fill: BODY_FILL }} />
            ))}
            {shown
              .filter((r) => r.view === view)
              .map((region) => {
                const lit = region.level !== 'none';
                return (
                  <path
                    key={region.regionId}
                    d={REGION_PATHS[view][region.regionId]}
                    style={{
                      fill: lit ? GROUP_FILL[region.group] : BODY_FILL,
                      opacity: regionOpacity(region),
                      filter: regionGlow(region),
                    }}
                    stroke={BODY_FILL}
                    strokeWidth={2}
                    className="cursor-pointer focus:outline-none focus-visible:stroke-ring"
                    role="img"
                    aria-label={regionLabel(region)}
                    tabIndex={0}
                    onClick={() => setSelected(region)}
                    onFocus={() => setSelected(region)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelected(region);
                    }}
                    onMouseEnter={() => setSelected(region)}
                  >
                    <title>{regionLabel(region)}</title>
                  </path>
                );
              })}
          </svg>
          <figcaption className="text-xs text-muted-foreground">{t(view)}</figcaption>
        </figure>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-hidden="true">
          {LEGEND_LEVELS.map((level) => (
            <span key={level} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-3 rounded-[3px]" style={LEGEND_SWATCH[level]} />
              {t(`legend.${level}`)}
            </span>
          ))}
        </div>

        <p className="min-h-5 text-sm" data-testid="muscle-map-detail">
          {selected
            ? regionLabel(selected)
            : preview
              ? t('showingSample')
              : trained
                ? t('hint')
                : t('empty')}
        </p>
      </CardContent>
    </Card>
  );
}
