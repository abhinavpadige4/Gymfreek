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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {c.title}
            </span>
            <span className="font-display text-3xl text-volt">{c.value}</span>
            <span className="text-xs text-muted-foreground">{c.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
