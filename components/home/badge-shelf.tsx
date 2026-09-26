'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BLOCK_BADGES } from '@/lib/avatar';
import { Card, CardContent } from '@/components/ui/card';

export function BadgeShelf({ badges }: { badges: { blockNumber: number }[] }) {
  const earned = new Set(badges.map((b) => b.blockNumber));
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Badges - one per 10 days
      </h2>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {BLOCK_BADGES.map((b) => {
          const has = earned.has(b.block);
          const card = (
            <Card className={has ? 'border-volt/60 transition-transform hover:scale-105' : 'opacity-40'}>
              <CardContent className="flex flex-col items-center gap-1 p-2">
                <span
                  aria-label={b.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold"
                  style={{ background: has ? b.color : '#333', color: '#111' }}
                >
                  {b.block * 10}
                </span>
                <span className="text-center text-[10px] leading-tight">{b.name}</span>
              </CardContent>
            </Card>
          );
          return (
            <motion.div
              key={b.block}
              initial={has ? { scale: 0, rotate: -30 } : false}
              animate={has ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              title={`${b.name} - Day ${b.block * 10}`}
            >
              {has ? (
                <Link href={`/badges/${b.block}`} aria-label={`Open ${b.name} badge`}>
                  {card}
                </Link>
              ) : (
                card
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
