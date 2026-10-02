'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { MuscleGroup } from '@/lib/prisma-client';
import { BACK_PATHS } from './BackBody';
import { BASE_FILL, FRONT_BASE, FRONT_PATHS, type BodyPathDef } from './FrontBody';
import { MuscleDetails } from './MuscleDetails';
import { MuscleFilters } from './MuscleFilters';
import { MuscleLegend } from './MuscleLegend';
import { MusclePath } from './MusclePath';
import styles from './bodyHeatmap.module.css';
import {
  HEAT_PERIODS,
  statFor,
  type HeatmapData,
  type HeatPeriod,
  type MuscleFilter,
  type MuscleStat,
} from './muscleData';

type View = 'front' | 'back';

const UPPER_GROUPS: readonly MuscleGroup[] = [
  'CHEST',
  'SHOULDERS_FRONT',
  'SHOULDERS_REAR',
  'BACK_WIDTH',
  'BACK_THICKNESS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
];
const CORE_GROUPS: readonly MuscleGroup[] = ['ABS', 'LOWER_BACK'];
const LOWER_GROUPS: readonly MuscleGroup[] = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// The front figure has no lateral-delt head, so lateral work folds into the
// displayed deltoid (sets/reps/volume summed, intensity takes the hotter of
// the two). Display-only; stored per-group data is untouched.
function displayStat(
  data: HeatmapData[HeatPeriod] | undefined,
  group: MuscleGroup,
): MuscleStat {
  const base = statFor(data, group);
  if (group !== 'SHOULDERS_FRONT' || !data) return base;
  const lateral = statFor(data, 'SHOULDERS_LATERAL');
  return {
    intensity: Math.max(base.intensity, lateral.intensity),
    reps: base.reps + lateral.reps,
    sets: base.sets + lateral.sets,
    volume: base.volume + lateral.volume,
  };
}

// Premium athletic body heatmap: glowing front/back figures fed by per-period
// training data, with hover tooltips, click-to-select details, zone filters,
// body-load summary and an empty state. Data arrives via props (mock now,
// GET /api/user/muscle-load later); the SVG never holds workout values.
export function HumanBodyHeatmap({
  data,
  defaultPeriod = '7D',
}: {
  data: HeatmapData;
  defaultPeriod?: HeatPeriod;
}) {
  const [period, setPeriod] = useState<HeatPeriod>(defaultPeriod);
  const [view, setView] = useState<View>('front');
  const [filter, setFilter] = useState<MuscleFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const active = data[period];
  const paths: readonly BodyPathDef[] = view === 'front' ? FRONT_PATHS : BACK_PATHS;

  const stats = useMemo(() => {
    const map = new Map<string, MuscleStat>();
    for (const p of paths) {
      if (p.group) map.set(p.id, displayStat(active, p.group));
    }
    return map;
  }, [paths, active]);

  const hasSignal = useMemo(
    () => [...stats.values()].some((s) => s.intensity > 0),
    [stats],
  );

  // Default selection: the hottest trained muscle; falls back to null.
  const selectedDef: BodyPathDef | null =
    paths.find((p) => p.id === selectedId && p.group !== null) ??
    [...paths]
      .filter((p) => p.group !== null)
      .sort((a, b) => (stats.get(b.id)?.intensity ?? 0) - (stats.get(a.id)?.intensity ?? 0))[0] ??
    null;
  const selectedStat: MuscleStat = selectedDef?.group
    ? (stats.get(selectedDef.id) ?? { intensity: 0, reps: 0, sets: 0, volume: 0 })
    : { intensity: 0, reps: 0, sets: 0, volume: 0 };

  const summary = useMemo(() => {
    const pick = (groups: readonly MuscleGroup[]) =>
      mean(groups.map((g) => displayStat(active, g).intensity));
    const all = [...UPPER_GROUPS, ...CORE_GROUPS, ...LOWER_GROUPS];
    return {
      overall: mean(all.map((g) => displayStat(active, g).intensity)),
      upper: pick(UPPER_GROUPS),
      core: pick(CORE_GROUPS),
      lower: pick(LOWER_GROUPS),
    };
  }, [active]);

  function handleHover(id: string | null, x: number, y: number) {
    if (id === null || x < 0) {
      setHover(null);
      return;
    }
    const rect = stageRef.current?.getBoundingClientRect();
    setHover({ id, x: rect ? x - rect.left : x, y: rect ? y - rect.top : y });
  }

  const hoveredDef = hover ? paths.find((p) => p.id === hover.id) : undefined;
  const hoveredStat = hoveredDef?.group ? stats.get(hoveredDef.id) : undefined;

  return (
    <div className={styles.heatmapRoot}>
      <header className={styles.heatmapHeader}>
        <div>
          <h2 className={styles.heatmapTitle}>Human Body Heatmap</h2>
          <p className={styles.heatmapSubtitle}>Training load by muscle - {periodLabel(period)}</p>
        </div>
        <div className={styles.periodControl} role="group" aria-label="Time range">
          {HEAT_PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              className={item === period ? styles.active : ''}
              aria-pressed={item === period}
              onClick={() => setPeriod(item)}
            >
              {item === 'TODAY' ? 'TODAY' : item === '7D' ? '7D' : item === '30D' ? '30D' : 'ALL'}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.heatmapLayout}>
        <div className={styles.bodyStage} ref={stageRef}>
          <div className={styles.viewToggle} role="group" aria-label="Body view">
            <button
              type="button"
              className={view === 'front' ? styles.active : ''}
              aria-pressed={view === 'front'}
              onClick={() => setView('front')}
            >
              FRONT
            </button>
            <button
              type="button"
              className={view === 'back' ? styles.active : ''}
              aria-pressed={view === 'back'}
              onClick={() => setView('back')}
            >
              BACK
            </button>
            <button
              type="button"
              className={styles.rotateBtn}
              onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
              aria-label="Rotate body"
              title="Rotate"
            >
              &#x21BB;
            </button>
          </div>

          <div className={styles.bodyGlow} aria-hidden="true" />

          <svg
            key={view}
            viewBox="0 0 400 900"
            preserveAspectRatio="xMidYMid meet"
            className={styles.humanSvg}
            role="group"
            aria-label={view === 'front' ? 'Front body heatmap' : 'Back body heatmap'}
          >
            {FRONT_BASE.map((d) => (
              <path key={d} d={d} fill={BASE_FILL} aria-hidden="true" />
            ))}
            {paths.map((def) => {
              const stat = stats.get(def.id) ?? { intensity: 0, reps: 0, sets: 0, volume: 0 };
              return (
                <MusclePath
                  key={def.id}
                  def={def}
                  stat={stat}
                  dimmed={filter !== 'ALL' && def.zone !== filter}
                  selected={selectedDef?.id === def.id}
                  onSelect={setSelectedId}
                  onHover={handleHover}
                />
              );
            })}
          </svg>

          {hoveredDef && hoveredDef.group && hoveredStat && hover && (
            <div
              className={styles.tooltip}
              style={{ left: Math.min(Math.max(hover.x + 14, 8), 220), top: Math.max(hover.y - 10, 8) }}
              role="status"
            >
              <strong>{hoveredDef.label.toUpperCase()}</strong>
              <div className={styles.tooltipRow}>
                <span>Intensity</span>
                <strong>{hoveredStat.intensity}%</strong>
              </div>
              <div className={styles.tooltipRow}>
                <span>Reps</span>
                <strong>{hoveredStat.reps.toLocaleString('en-US')}</strong>
              </div>
              <div className={styles.tooltipRow}>
                <span>Sets</span>
                <strong>{hoveredStat.sets}</strong>
              </div>
            </div>
          )}

          {!hasSignal && (
            <div className={styles.emptyCta}>
              <p className={styles.emptyTitle}>Complete your first workout</p>
              <p className={styles.emptyText}>Your muscle activity will appear here.</p>
              <Link href="/session/new" className={styles.emptyButton}>
                START WORKOUT
              </Link>
            </div>
          )}

          <MuscleLegend />
        </div>

        <aside className={styles.musclePanel}>
          <div className={styles.panelLabel}>BODY TRAINING LOAD</div>
          <div className={styles.summary}>
            {[
              ['Overall', summary.overall],
              ['Upper body', summary.upper],
              ['Core', summary.core],
              ['Lower body', summary.lower],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className={styles.summaryRow}>
                  <span>{label as string}</span>
                  <strong>{value as number}%</strong>
                </div>
                <div className={styles.miniBar}>
                  <i style={{ width: `${value as number}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panelLabel} style={{ marginTop: 26 }}>
            SELECTED MUSCLE
          </div>
          {selectedDef && selectedDef.group ? (
            <MuscleDetails
              name={selectedDef.label}
              groupLabel={view === 'front' ? 'Front view' : 'Back view'}
              stat={selectedStat}
              exercises={active?.exercises[selectedDef.group] ?? []}
            />
          ) : (
            <p className={styles.mutedNote}>Tap a muscle on the body to inspect it.</p>
          )}

          <MuscleFilters filter={filter} onChange={setFilter} />
        </aside>
      </div>
    </div>
  );
}

function periodLabel(period: HeatPeriod): string {
  if (period === 'TODAY') return 'today';
  if (period === '7D') return 'last 7 days';
  if (period === '30D') return 'last 30 days';
  return 'all time';
}
