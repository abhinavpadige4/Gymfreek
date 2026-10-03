import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityDay } from '@/lib/activity';

// Workout activity heatmap: every trained day, color-graded by volume.
// 0 muted, 1 light, 2 solid, 3+ full volt. Pure presentational.
function cellClass(count: number): string {
  if (count <= 0) return 'bg-muted';
  if (count === 1) return 'bg-volt/30';
  if (count === 2) return 'bg-volt/60';
  return 'bg-volt';
}

export function ActivityHeatGrid({ days }: { days: ActivityDay[] }) {
  const activeDays = days.filter((d) => d.count > 0).length;
  // Month-wise groups, oldest first, so the strip reads Jan | Feb | Mar and
  // scrolls sideways into the past.
  const months: Array<{ key: string; label: string; days: ActivityDay[] }> = [];
  for (const d of days) {
    const key = d.dateKey.slice(0, 7);
    const last = months[months.length - 1];
    if (last && last.key === key) {
      last.days.push(d);
    } else {
      const dt = new Date(`${d.dateKey}T00:00:00Z`);
      const label = Number.isNaN(dt.getTime())
        ? key
        : dt.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, label, days: [d] });
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className="flex max-w-full gap-4 overflow-x-auto pb-1"
        role="img"
        aria-label={`${activeDays} active days, month by month, oldest first`}
      >
        {months.map((m) => (
          <div key={m.key} className="flex shrink-0 flex-col gap-1.5">
            <div className="grid grid-flow-col grid-rows-7 justify-start gap-1">
              {m.days.map((d) => (
                <span
                  key={d.dateKey}
                  title={`${d.dateKey}: ${d.count} workout${d.count === 1 ? '' : 's'}`}
                  className={`size-3 rounded-[4px] ${cellClass(d.count)}`}
                />
              ))}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground" aria-hidden>
        <span>Less</span>
        {[0, 1, 2, 3].map((c) => (
          <span key={c} className={`size-3 rounded-[4px] ${cellClass(c)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function StreakHeatmap({ days, streak }: { days: ActivityDay[]; streak: number }) {
  const activeDays = days.filter((d) => d.count > 0).length;
  return (
    <Card className="min-w-0 overflow-hidden border-volt/40 shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${streak > 0 ? 'bg-volt text-black' : 'bg-muted text-muted-foreground'}`}
          >
            <Flame className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-display text-3xl tabular-nums">
              {streak}
              <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                day streak
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {activeDays} active days - every workout paints a square
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ActivityHeatGrid days={days} />
      </CardContent>
    </Card>
  );
}
