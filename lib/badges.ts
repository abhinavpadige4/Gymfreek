import { db } from '@/lib/db';

// Award block badge when all 10 days of the block are valid. Block = ceil(day/10).
export async function maybeAwardBadge(userId: string, dayNumber: number): Promise<number | null> {
  if (dayNumber % 10 !== 0) return null;
  const block = Math.ceil(dayNumber / 10);
  const existing = await db.badgeAward.findUnique({
    where: { userId_blockNumber: { userId, blockNumber: block } },
  });
  if (existing) return null;
  await db.badgeAward.create({ data: { userId, blockNumber: block } });
  return block;
}
