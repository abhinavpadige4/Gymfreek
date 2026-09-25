// Pure aggregation helpers for the admin console. Day/week boundaries use
// UTC calendar days so dashboards are stable across timezones. All functions
// take `now` so tests are deterministic.

export interface ActivityDay {
  label: string;
  sessions: number;
  enrollments: number;
  payments: number;
}

export interface VolumeWeek {
  label: string;
  sessions: number;
  volume: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

// Last `days` calendar days (oldest first) with per-day counts from the
// given started/created timestamps.
export function activityBuckets(
  sessions: Date[],
  enrollments: Date[],
  payments: Date[],
  days = 14,
  now = new Date(),
): ActivityDay[] {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const count = (list: Date[], key: string) =>
    list.filter((d) => dayKey(d) === key).length;
  const out: ActivityDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * DAY_MS);
    const key = dayKey(day);
    out.push({
      label: shortLabel(day),
      sessions: count(sessions, key),
      enrollments: count(enrollments, key),
      payments: count(payments, key),
    });
  }
  return out;
}

// Last `weeks` ISO weeks (oldest first): distinct-day sessions trained plus
// summed weight x reps. Warm-up filtering happens at the query site.
export function volumeBuckets(
  sets: { startedAt: Date; weight: number; reps: number }[],
  weeks = 12,
  now = new Date(),
): VolumeWeek[] {
  const buckets = new Map<string, { sessions: Set<string>; volume: number }>();
  for (const s of sets) {
    const d = new Date(s.startedAt);
    const monday = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)),
    );
    const key = monday.toISOString().slice(0, 10);
    let b = buckets.get(key);
    if (!b) {
      b = { sessions: new Set<string>(), volume: 0 };
      buckets.set(key, b);
    }
    b.sessions.add(dayKey(d));
    b.volume += (s.weight ?? 0) * s.reps;
  }
  const thisMonday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
    ),
  );
  const out: VolumeWeek[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(thisMonday.getTime() - i * 7 * DAY_MS);
    const key = monday.toISOString().slice(0, 10);
    const b = buckets.get(key);
    out.push({
      label: shortLabel(monday),
      sessions: b ? b.sessions.size : 0,
      volume: b ? Math.round(b.volume) : 0,
    });
  }
  return out;
}
