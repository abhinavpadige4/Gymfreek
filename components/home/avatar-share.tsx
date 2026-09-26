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
import { avatarUrl, BLOCK_BADGES } from '@/lib/avatar';

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
          className="relative shrink-0 rounded-full border border-volt/50 p-1 transition-transform hover:scale-105"
        >
          <img
            src={avatarUrl(seed)}
            alt={name}
            width={88}
            height={88}
            className="h-20 w-20 rounded-full sm:h-24 sm:w-24"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-volt/20 via-card to-card px-6 pb-5 pt-6 text-center">
          <DialogHeader className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="100XU" width={24} height={24} className="h-6 w-6 rounded" />
              <span className="font-display text-lg tracking-wide">
                100<span className="text-volt">X</span>U
              </span>
            </span>
            <DialogTitle>Hi {name}</DialogTitle>
            <DialogDescription>Your 100XU flex card. Share it anywhere.</DialogDescription>
          </DialogHeader>
          <img
            src={avatarUrl(seed)}
            alt={name}
            width={128}
            height={128}
            className="h-32 w-32 rounded-full border-2 border-volt/60 bg-card"
          />
          <div className="grid w-full grid-cols-3 gap-2">
            {[
              [String(workouts), 'Workouts'],
              [reps.toLocaleString('en-US'), 'Reps'],
              [String(minutes), 'Minutes'],
            ].map(([v, label]) => (
              <div key={label} className="rounded-xl bg-background/70 px-2 py-2.5">
                <p className="font-display text-xl text-volt">{v}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium">
            {badges.length === 0 ? 'No badges yet - finish 10 days to earn one.' : `Badges: ${badgeNames}`}
          </p>
          {(instagram || facebook) && (
            <p className="text-xs text-muted-foreground">
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
            <Button onClick={copyLink} variant="outline" className="min-h-tap flex-1">
              <Copy className="size-4" />
              <span className="ml-2">Copy</span>
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={14} height={14} className="h-3.5 w-3.5 rounded" />
            Train. Track. Improve. Transform. · {link.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
