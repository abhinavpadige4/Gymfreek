import type { MuscleFilter } from './muscleData';

const FILTERS: readonly MuscleFilter[] = ['ALL', 'UPPER', 'CORE', 'LOWER'];

export function MuscleFilters({
  filter,
  onChange,
}: {
  filter: MuscleFilter;
  onChange: (f: MuscleFilter) => void;
}) {
  return (
    <div className="filter-section">
      <div className="panel-label">MUSCLE GROUP</div>
      <div className="filter-buttons" role="group" aria-label="Filter muscles">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'active' : ''}
            aria-pressed={filter === item}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
