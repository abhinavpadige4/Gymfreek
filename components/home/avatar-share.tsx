'use client';

import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
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
  const [busy, setBusy] = useState(false);
  const link = appUrl || (typeof window === 'undefined' ? '' : window.location.origin);
  const text = `Hi I am ${name} - ${workouts} workouts, ${reps} reps, ${minutes} min, ${badges.length} badges on 100XU. Join me: ${link}`;
  const badgeNames = badges
    .map((b) => BLOCK_BADGES[b.blockNumber - 1]?.name ?? `Block ${b.blockNumber}`)
    .join(', ');
  const earned = new Set(badges.map((b) => b.blockNumber));

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function renderCard(): Promise<Blob> {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    // Background cover + dark overlay.
    try {
      const bg = await loadImage(SHARE_CARD_BG);
      const scale = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
      const dw = bg.naturalWidth * scale;
      const dh = bg.naturalHeight * scale;
      ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } catch {
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Brand + name in the app display font when loaded.
    ctx.fillStyle = '#D94A05';
    ctx.font = '700 44px sans-serif';
    ctx.fillText('100XU', W / 2, 110);
    ctx.fillStyle = '#ffffff';
    ctx.font = '64px "Russo One", sans-serif';
    ctx.fillText(name.slice(0, 24), W / 2, 190, W - 120);

    // Avatar.
    try {
      const av = await loadImage(avatarUrl(seed));
      const aw = 360;
      const ah = 440;
      const ax = (W - aw) / 2;
      const ay = 240;
      ctx.save();
      roundRectPath(ctx, ax, ay, aw, ah, 36);
      ctx.clip();
      const s = Math.max(aw / av.naturalWidth, ah / av.naturalHeight);
      const dw2 = av.naturalWidth * s;
      const dh2 = av.naturalHeight * s;
      ctx.drawImage(av, ax + (aw - dw2) / 2, ay, dw2, dh2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(217,74,5,0.9)';
      ctx.lineWidth = 6;
      roundRectPath(ctx, ax, ay, aw, ah, 36);
      ctx.stroke();
    } catch {
      // avatar optional, stats still render
    }

    // Stats row.
    const stats: [string, string][] = [
      [String(workouts), 'WORKOUTS'],
      [reps.toLocaleString('en-US'), 'REPS'],
      [String(minutes), 'MINUTES'],
    ];
    const boxW = 300;
    const boxH = 170;
    const gap = 30;
    const rowY = 730;
    const rowX = (W - (boxW * 3 + gap * 2)) / 2;
    stats.forEach(([v, label], i) => {
      const x = rowX + i * (boxW + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRectPath(ctx, x, rowY, boxW, boxH, 28);
      ctx.fill();
      ctx.fillStyle = '#D94A05';
      ctx.font = '700 64px sans-serif';
      ctx.fillText(v.slice(0, 10), x + boxW / 2, rowY + 80, boxW - 30);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '32px sans-serif';
      ctx.fillText(label, x + boxW / 2, rowY + 130);
    });

    // Badges row: all 10 blocks, earned in full color.
    const cy = 1010;
    const r = 40;
    const totalW = BLOCK_BADGES.length * r * 2 + (BLOCK_BADGES.length - 1) * 18;
    let cx = (W - totalW) / 2 + r;
    BLOCK_BADGES.forEach((b) => {
      const has = earned.has(b.block);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = has ? b.color : 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = has ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
      ctx.stroke();
      ctx.fillStyle = has ? '#111111' : 'rgba(255,255,255,0.5)';
      ctx.font = '700 32px sans-serif';
      ctx.fillText(String(b.block * 10), cx, cy + 11);
      cx += r * 2 + 18;
    });
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 36px sans-serif';
    const badgeLine =
      badges.length === 0 ? 'No badges yet - finish 10 days to earn one.' : `Badges: ${badgeNames}`;
    ctx.fillText(badgeLine.slice(0, 60), W / 2, 1100, W - 120);

    // Footer: socials + link.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '32px sans-serif';
    const socials = [instagram && `IG: ${instagram}`, facebook && `FB: ${facebook}`]
      .filter(Boolean)
      .join('  ·  ');
    if (socials) ctx.fillText(socials.slice(0, 60), W / 2, 1180, W - 120);
    ctx.fillText(link.replace(/^https?:\/\//, '').slice(0, 60), W / 2, 1240, W - 120);
    ctx.fillStyle = '#D94A05';
    ctx.font = '700 36px sans-serif';
    ctx.fillText('100XU - CENTURY CHALLENGE', W / 2, 1300);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Render failed');
    return blob;
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '100xu-flex-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function share() {
    setBusy(true);
    try {
      const blob = await renderCard();
      const file = new File([blob], '100xu-flex-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '100XU flex card', text });
        return;
      }
      // Desktop / Instagram path: save the PNG, then fall back to text share.
      downloadBlob(blob);
      toast.success('Card saved as image. Upload it to Instagram.');
      if (navigator.share) {
        await navigator.share({ title: '100XU', text, url: link });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // user cancelled, no-op
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    try {
      downloadBlob(await renderCard());
      toast.success('Flex card image saved.');
    } catch {
      toast.error('Image render failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open share card"
          className="relative aspect-square w-[88px] shrink-0 self-center justify-self-center overflow-hidden rounded-full border border-volt/50 p-1 transition-transform hover:scale-105 sm:w-[104px]"
        >
          <img
            src={avatarUrl(seed)}
            alt={name}
            width={88}
            height={88}
            className="h-full w-full rounded-full object-cover object-top"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden border-volt/40 p-0 sm:max-w-sm">
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
              <DialogTitle className="font-display text-2xl tracking-wide text-white">{name}</DialogTitle>
              <DialogDescription className="sr-only">
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
              <Button onClick={share} disabled={busy} className="min-h-tap flex-1">
                <Share2 className="size-4" />
                <span className="ml-2">{busy ? 'Making...' : 'Share card'}</span>
              </Button>
              <Button onClick={download} disabled={busy} variant="secondary" className="min-h-tap flex-1">
                <Download className="size-4" />
                <span className="ml-2">Save PNG</span>
              </Button>
            </div>
            <p className="text-[11px] text-white/70">
              {link.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </div>
        <p className="bg-background px-6 py-3 text-center text-xs text-muted-foreground">
          Your 100XU flex card. Share it anywhere.
        </p>
      </DialogContent>
    </Dialog>
  );
}
