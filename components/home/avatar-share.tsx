'use client';

import { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { avatarUrl, BLOCK_BADGES, SHARE_CARD_BG } from '@/lib/avatar';

// Inlined at build time. Set it on Vercel so shared links point at the
// deployed app; local fallback is the current origin.
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

export function AvatarShare({
  name,
  seed,
  workouts,
  reps,
  minutes,
  badges,
  instagram,
  facebook,
}: {
  name: string;
  seed: string | null;
  workouts: number;
  reps: number;
  minutes: number;
  badges: { blockNumber: number }[];
  instagram: string | null;
  facebook: string | null;
}) {
  const [open, setOpen] = useState(false);
  const link = appUrl || (typeof window === 'undefined' ? '' : window.location.origin);
  const text = `Hi I am ${name} - ${workouts} workouts, ${reps} reps, ${minutes} min, ${badges.length} badges on 100XU. Join me: ${link}`;
  const badgeNames = badges
    .map((b) => BLOCK_BADGES[b.blockNumber - 1]?.name ?? `Block ${b.blockNumber}`)
    .join(', ');

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: '100XU', text, url: link });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied. Paste it on Instagram or WhatsApp.');
      }
    } catch {
      // user cancelled, no-op
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied. Paste it anywhere.');
    } catch {
      toast.error('Copy failed.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open share card"
          className="relative shrink-0 overflow-hidden rounded-full border border-volt/50 p-1 transition-transform hover:scale-105"
        >
          <img
            src={avatarUrl(seed)}
            alt={name}
            width={88}
            height={88}
            className="h-20 w-20 rounded-full object-cover object-top sm:h-24 sm:w-24"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm overflow-hidden border-volt/40 p-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SHARE_CARD_BG}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-3 px-6 py-6 text-center text-white">
            <DialogHeader className="flex flex-col items-center gap-1">
              <DialogTitle className="text-white">Hi {name}</DialogTitle>
              <DialogDescription className="text-white/70">
                Your 100XU flex card. Share it anywhere.
              </DialogDescription>
            </DialogHeader>
            <img
              src={avatarUrl(seed)}
              alt={name}
              width={160}
              height={200}
              className="h-44 w-36 rounded-2xl border-2 border-volt/70 object-cover object-top"
            />
            <div className="grid w-full grid-cols-3 gap-2">
              {[
                [String(workouts), 'Workouts'],
                [reps.toLocaleString('en-US'), 'Reps'],
                [String(minutes), 'Minutes'],
              ].map(([v, label]) => (
                <div key={label} className="rounded-xl bg-white/10 px-2 py-2.5 backdrop-blur-sm">
                  <p className="font-display text-xl text-volt">{v}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/70">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Earned badges">
                {BLOCK_BADGES.map((b) => {
                  const has = badges.some((x) => x.blockNumber === b.block);
                  return (
                    <span
                      key={b.block}
                      title={`${b.name} - Day ${b.block * 10}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: has ? b.color : 'rgba(255,255,255,0.12)',
                        color: has ? '#111' : 'rgba(255,255,255,0.5)',
                        border: has ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {b.block * 10}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm font-medium">
                {badges.length === 0 ? 'No badges yet - finish 10 days to earn one.' : `Badges: ${badgeNames}`}
              </p>
            </div>
            {(instagram || facebook) && (
              <p className="text-xs text-white/70">
                {[instagram && `Instagram: ${instagram}`, facebook && `Facebook: ${facebook}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <div className="flex w-full gap-2">
              <Button onClick={share} className="min-h-tap flex-1">
                <Share2 className="size-4" />
                <span className="ml-2">Share</span>
              </Button>
              <Button onClick={copyLink} variant="secondary" className="min-h-tap flex-1">
                <Copy className="size-4" />
                <span className="ml-2">Copy</span>
              </Button>
            </div>
            <p className="text-[11px] text-white/70">
              {link.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
