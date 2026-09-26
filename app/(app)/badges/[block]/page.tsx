import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireAdminUserId } from '@/lib/admin';
import { avatarUrl, BLOCK_BADGES, SHARE_CARD_BG } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { BadgeReveal } from '@/components/badges/badge-reveal';

interface Props {
  params: Promise<{ block: string }>;
  searchParams: Promise<{ userId?: string }>;
}

// Animated congratulations card for one earned block badge. The earner opens
// it from the day-runner popup or the badge shelf; admins may pass ?userId=
// to view any member's badge.
export default async function BadgePage(props: Props) {
  const { block: blockParam } = await props.params;
  const { userId: userIdParam } = await props.searchParams;
  const block = Number(blockParam);
  const meta = BLOCK_BADGES[block - 1];
  if (!Number.isInteger(block) || !meta) notFound();

  const session = await requireSession();
  let targetId = session.userId;
  if (userIdParam && userIdParam !== session.userId) {
    await requireAdminUserId();
    targetId = userIdParam;
  }

  const [award, user] = await Promise.all([
    db.badgeAward.findUnique({
      where: { userId_blockNumber: { userId: targetId, blockNumber: block } },
      select: { awardedAt: true },
    }),
    db.user.findUnique({
      where: { id: targetId },
      select: { displayName: true, avatarSeed: true },
    }),
  ]);
  if (!award || !user) notFound();
  const name = user.displayName || session.email;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-volt/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SHARE_CARD_BG}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center text-white">
          <p className="font-display text-sm tracking-[0.3em] text-volt">CONGRATULATIONS</p>
          <h1 className="font-display text-3xl tracking-tight">
            {name}, you earned it
          </h1>
          <BadgeReveal
            day={block * 10}
            badgeName={meta.name}
            color={meta.color}
            avatarSrc={avatarUrl(user.avatarSeed)}
            avatarAlt={name}
          />
          <p className="text-sm text-white/80">
            {meta.name} · Day {block * 10} complete ·{' '}
            {award.awardedAt.toLocaleDateString('en-IN')}
          </p>
          <div className="flex w-full gap-2">
            <Button asChild className="min-h-tap flex-1">
              <Link href="/">Back home</Link>
            </Button>
            <Button asChild variant="secondary" className="min-h-tap flex-1">
              <Link href="/challenges">Challenges</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
