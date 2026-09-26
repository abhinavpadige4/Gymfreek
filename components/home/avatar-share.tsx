'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { avatarUrl, BLOCK_BADGES } from '@/lib/avatar';

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
  const text = `Hi I am ${name} - ${workouts} workouts, ${reps} reps, ${minutes} min, ${badges.length} badges on 100XU.`;
  const badgeNames = badges
    .map((b) => BLOCK_BADGES[b.blockNumber - 1]?.name ?? `Block ${b.blockNumber}`)
    .join(', ');

  async function share() {
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: '100XU', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success('Copied. Paste it on Instagram or Facebook.');
      }
    } catch {
      // user cancelled, no-op
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
          <Image
            src={avatarUrl(seed)}
            alt={name}
            width={88}
            height={88}
            className="h-20 w-20 rounded-full sm:h-24 sm:w-24"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hi {name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src={avatarUrl(seed)}
            alt={name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border"
          />
          <p className="text-sm text-muted-foreground">
            {workouts} workouts · {reps.toLocaleString('en-US')} reps · {minutes} min
          </p>
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
          <Button onClick={share} className="min-h-tap w-full">
            <Share2 className="size-4" />
            <span className="ml-2">Share</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
