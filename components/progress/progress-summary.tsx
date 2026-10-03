import { Card, CardContent } from '@/components/ui/card';

export interface SummaryCards {
  title: string;
  value: string;
  sub: string;
}

// Plain-language month-over-month recap. Server-rendered strings in, styled
// cards out - no client state, no charts.
export function ProgressSummary({ cards }: { cards: SummaryCards[] }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} className="min-w-0 overflow-hidden">
          <CardContent className="flex min-w-0 flex-col gap-1 p-4">
            <span className="truncate text-xs uppercase tracking-widest text-muted-foreground">
              {c.title}
            </span>
            <span className="truncate font-display text-3xl tabular-nums text-volt">{c.value}</span>
            <span className="break-words text-xs text-muted-foreground">{c.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
