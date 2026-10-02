import { formatVolume, getHeatColor, recoveryFor, type MuscleExercises, type MuscleStat } from './muscleData';

// Right-side information panel for the selected (or strongest) muscle:
// intensity bar, reps/sets/volume/status grid, recovery state, recent
// exercises. Pure presentational.
export function MuscleDetails({
  name,
  groupLabel,
  stat,
  exercises,
}: {
  name: string;
  groupLabel: string;
  stat: MuscleStat;
  exercises: MuscleExercises[];
}) {
  const recovery = recoveryFor(stat.intensity);
  return (
    <div>
      <div className="muscle-title-row">
        <div className="muscle-dot" style={{ background: getHeatColor(stat.intensity) }} />
        <div>
          <h3>{name}</h3>
          <span>{groupLabel}</span>
        </div>
      </div>

      <div className="intensity-block">
        <div className="stat-line">
          <span>Training intensity</span>
          <strong>{stat.intensity}%</strong>
        </div>
        <div className="progress-track">
          <div
            className="progress-value"
            style={{ width: `${stat.intensity}%`, background: getHeatColor(stat.intensity) }}
          />
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>TOTAL REPS</span>
          <strong>{stat.reps.toLocaleString('en-US')}</strong>
        </div>
        <div>
          <span>SETS</span>
          <strong>{stat.sets}</strong>
        </div>
        <div>
          <span>LOAD</span>
          <strong>{formatVolume(stat.volume)}</strong>
        </div>
        <div>
          <span>RECOVERY</span>
          <strong className="orange">{recovery.recovery}%</strong>
        </div>
      </div>

      <div className="stat-line" style={{ marginTop: 18 }}>
        <span>Status</span>
        <strong className="orange">{recovery.status}</strong>
      </div>

      <div className="filter-section">
        <div className="panel-label">RECENT EXERCISES</div>
        {exercises.length === 0 ? (
          <p className="muted-note">No logged exercises for this muscle in range.</p>
        ) : (
          <ul className="exercise-list">
            {exercises.slice(0, 3).map((e) => (
              <li key={e.name}>
                <span>{e.name}</span>
                <strong>{e.reps.toLocaleString('en-US')} reps</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
