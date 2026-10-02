// Daily activity buckets for the streak heatmap. Pure UTC-day math over
// finished-session dates, no DB. Gym sessions and challenge sessions both
// feed the same buckets so challenge-only users see their real history.
export interface ActivityDay {
  dateKey: string;
  count: number;
}

export function dayKeyUTC(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

// Trailing `weeks` of UTC days ending today, oldest first, each with its
// workout count. Fixed length, so the grid never shifts shape.
export function buildActivityDays(dates: Date[], weeks = 12, now: Date = new Date()): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const k = dayKeyUTC(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out: ActivityDay[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const k = dayKeyUTC(new Date(today - i * 86400000));
    out.push({ dateKey: k, count: counts.get(k) ?? 0 });
  }
  return out;
}

// Consecutive active UTC days ending today, or yesterday when today is
// still empty (the streak stays alive until the day ends).
export function currentDayStreak(dates: Date[], now: Date = new Date()): number {
  const active = new Set(dates.map(dayKeyUTC));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let cursor = active.has(dayKeyUTC(new Date(today))) ? today : today - 86400000;
  let streak = 0;
  while (active.has(dayKeyUTC(new Date(cursor)))) {
    streak += 1;
    cursor -= 86400000;
  }
  return streak;
}
