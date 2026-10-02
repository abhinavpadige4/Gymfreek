import { memo } from 'react';
import type { BodyPathDef } from './FrontBody';
import styles from './bodyHeatmap.module.css';
import { getHeatColor, type MuscleStat } from './muscleData';

// One interactable muscle. Fill comes from the heat ramp, brightness from
// hover/focus, selection from a white outline + orange glow. Static anatomy
// (head/neck) renders without handlers.
export const MusclePath = memo(function MusclePath({
  def,
  stat,
  dimmed,
  selected,
  onSelect,
  onHover,
}: {
  def: BodyPathDef;
  stat: MuscleStat;
  dimmed: boolean;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null, x: number, y: number) => void;
}) {
  if (def.group === null) {
    return <path d={def.d} fill="#1E2126" stroke="#08090A" strokeWidth={2} aria-hidden="true" />;
  }
  const fill = getHeatColor(stat.intensity);
  const label = `${def.label} muscle, ${stat.intensity} percent training intensity`;
  return (
    <path
      d={def.d}
      fill={fill}
      fillOpacity={dimmed ? 0.22 : stat.intensity <= 0 ? 0.55 : 1}
      stroke={selected ? '#FFFFFF' : '#08090A'}
      strokeWidth={selected ? 2 : 2.5}
      className={`${styles.musclePath}${selected ? ` ${styles.selected}` : ''}`}
      role="img"
      aria-label={label}
      tabIndex={0}
      onClick={() => onSelect(selected ? null : def.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(selected ? null : def.id);
        }
      }}
      onFocus={() => onHover(null, -1, -1)}
      onBlur={() => onHover(null, 0, 0)}
      onMouseEnter={(e) => onHover(def.id, e.clientX, e.clientY)}
      onMouseMove={(e) => onHover(def.id, e.clientX, e.clientY)}
      onMouseLeave={() => onHover(null, 0, 0)}
    >
      <title>{`${def.label} - ${stat.intensity}%`}</title>
    </path>
  );
});
