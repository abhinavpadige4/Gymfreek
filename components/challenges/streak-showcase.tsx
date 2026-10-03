import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ActivityHeatGrid } from '@/components/home/streak-heatmap';
import type { ActivityDay } from '@/lib/activity';

function hype(streak: number): string {
  if (streak <= 0) return 'Start Day 1 to light your streak';
  if (streak === 1) return 'Lit. Come back tomorrow to keep it burning';
  if (streak < 7) return 'Woo - you are building momentum';
  if (streak < 30) return 'Woo - on fire, keep it burning';
  return 'Unstoppable - century mode';
}

// Celebratory streak block: flame + big count + day progress + history strip.
// Used beside the banner on challenge detail and on home.
export function StreakShowcase({
  days,
  streak,
  currentDay,
  totalDays,
}: {
  days: ActivityDay[];
  streak: number;
  currentDay?: number;
  totalDays?: number;
}) {
  const pct =
    currentDay != null && totalDays ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : null;
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden border-volt/40 bg-gradient-to-br from-volt/15 via-card to-card shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${streak > 0 ? 'bg-volt text-black' : 'bg-muted text-muted-foreground'}`}
          >
            <Flame className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2 leading-none">
              <span className="text-3xl font-bold tabular-nums">{streak}</span>
              <span className="text-sm font-normal text-muted-foreground">day streak</span>
            </p>
            <p className="mt-1 truncate text-sm font-medium text-volt">{hype(streak)}</p>
          </div>
        </div>
        {pct != null && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              Day {currentDay} of {totalDays} - {pct}%
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-volt" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 flex-col gap-2">
        <ActivityHeatGrid days={days} />
        <Link href="/history" className="text-xs font-semibold text-volt underline-offset-4 hover:underline">
          View workout history
        </Link>
      </CardContent>
    </Card>
  );
}
