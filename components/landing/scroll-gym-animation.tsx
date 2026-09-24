'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';

// ---------------------------------------------------------------------------
// CONFIG - tweak the cinema here, logic below stays untouched.
// ---------------------------------------------------------------------------
const FRAME_COUNT = 20;
const FRAME_PATH = (index: number) =>
  `/frames/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;
// Cumulative preload tiers: first tier unblocks the page, the rest stream in.
const PRELOAD_TIERS = [4, 10, 20];
// 0..1 easing per rAF tick toward the scroll target. Lower is silkier.
const EASE = 0.25;
// Fraction of the section scroll at which the last frame is reached. The
// pinned viewport then holds the final frames while scrolling continues,
// so the ending is viewable instead of rushing past on release.
const COMPLETE_AT = 0.7;
// Edge sharpening strength (0 = off). Frames are pre-sharpened once after
// load, so scrolling never pays the convolution cost.
const SHARPEN_AMOUNT = 0.5;
// Static frame shown when the OS asks for reduced motion.
const POSTER_INDEX = 14;
// Captions reuse the landing's own headline copy, one per quarter.
const PHASES = ['TRAIN.', 'TRACK.', 'IMPROVE.', 'TRANSFORM.'] as const;
// Scroll distance driving the full 20 frames. Generous on purpose: more
// distance per frame keeps the tail viewable before the section releases.
const SECTION_HEIGHT_CLASS = 'h-[280vh] md:h-[400vh]';

const SCROLL_OFFSET = ['start start', 'end end'] as ['start start', 'end end'];

// ---------------------------------------------------------------------------
// ScrollGymAnimation - pinned canvas cinema driven by vertical scroll.
// Scroll down: frame 1 -> 30. Scroll up: 30 -> 1. Stop: frame holds.
// No autoplay, no video element, no per-scroll React re-renders.
// ---------------------------------------------------------------------------
export function ScrollGymAnimation() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable animation state lives in refs: zero re-renders while scrolling.
  const images = useRef<(HTMLImageElement | undefined)[]>([]);
  const target = useRef(0);
  const eased = useRef(0);
  const drawn = useRef(-1);
  const phaseRef = useRef(0);
  const reduceRef = useRef(false);
  // Cached viewport size and cover geometry: recomputed on resize only,
  // never per frame, so scrolling never forces layout.
  const viewport = useRef({ w: 0, h: 0 });
  const geo = useRef({ key: '', bw: 0, bh: 0, dw: 0, dh: 0, ox: 0, oy: 0 });
  // Pre-sharpened frames, filled progressively after load. Drawing from
  // cache keeps scrolling jank-free; ~70MB only when sharpening is on.
  // Skipped on low-memory devices (raw frames are drawn instead).
  const sharpCache = useRef<(HTMLCanvasElement | undefined)[]>([]);
  // Rare UI states only: loader visibility/progress and caption phase.
  const [ready, setReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [phase, setPhase] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: SCROLL_OFFSET });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    target.current = Math.min(1, v / COMPLETE_AT) * (FRAME_COUNT - 1);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.current = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
      geo.current.key = '';
    };
    measure();

    // 3x3 sharpen at native resolution, before the upscale draw. Runs once
    // per frame during preload (never while scrolling); flat JPEG mush is
    // left for the grain overlay to mask.
    const sharpen = (image: HTMLImageElement): HTMLCanvasElement | null => {
      const off = document.createElement('canvas');
      const w = image.naturalWidth;
      const h = image.naturalHeight;
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return null;
      octx.drawImage(image, 0, 0, w, h);
      const src = octx.getImageData(0, 0, w, h);
      const dst = octx.createImageData(w, h);
      const d = src.data;
      const o = dst.data;
      const k = SHARPEN_AMOUNT;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = d[i + c] ?? 0;
            const left = d[i - 4 + c] ?? 0;
            const right = d[i + 4 + c] ?? 0;
            const up = d[i - w * 4 + c] ?? 0;
            const down = d[i + w * 4 + c] ?? 0;
            const v = center * (1 + 4 * k) - k * (left + right + up + down);
            o[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
          }
          o[i + 3] = 255;
        }
      }
      // Copy the 1px border through unprocessed.
      o.set(d.subarray(0, w * 4), 0);
      o.set(d.subarray((h - 1) * w * 4, h * w * 4), (h - 1) * w * 4);
      for (let y = 1; y < h - 1; y++) {
        o.set(d.subarray(y * w * 4, y * w * 4 + 4), y * w * 4);
        o.set(d.subarray((y * w + w - 1) * 4, (y * w + w) * 4), (y * w + w - 1) * 4);
      }
      octx.putImageData(dst, 0, 0);
      return off;
    };

    const draw = (index: number) => {
      const image = images.current[index];
      if (!image || !image.naturalWidth) return;
      // Cached pre-sharpened frame when ready, raw frame while streaming in.
      const source: HTMLImageElement | HTMLCanvasElement =
        sharpCache.current[index] ?? image;
      const { w: cssW, h: cssH } = viewport.current;
      if (!cssW || !cssH) return;
      const key = `${cssW}x${cssH}|${image.naturalWidth}x${image.naturalHeight}`;
      if (geo.current.key !== key) {
        // Backing store never exceeds the source resolution: extra pixels
        // cost GPU time every frame without adding sharpness.
        const dpr = Math.max(
          0.5,
          Math.min(
            window.devicePixelRatio || 1,
            2,
            image.naturalWidth / cssW,
            image.naturalHeight / cssH,
          ),
        );
        const bw = Math.max(1, Math.round(cssW * dpr));
        const bh = Math.max(1, Math.round(cssH * dpr));
        // Cover fit: fill the viewport, crop overflow, never stretch.
        const imgRatio = image.naturalWidth / image.naturalHeight;
        let dw: number;
        let dh: number;
        if (bw / bh > imgRatio) {
          dw = bw;
          dh = bw / imgRatio;
        } else {
          dh = bh;
          dw = bh * imgRatio;
        }
        canvas.width = bw;
        canvas.height = bh;
        // Integer offsets: fractional dest coords resample-soften the image.
        geo.current = {
          key,
          bw,
          bh,
          dw,
          dh,
          ox: Math.round((bw - dw) / 2),
          oy: Math.round((bh - dh) / 2),
        };
      }
      const g = geo.current;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, g.bw, g.bh);
      ctx.drawImage(source, g.ox, g.oy, g.dw, g.dh);
      canvas.dataset.frame = String(index);
    };

    const loadOne = (index: number): Promise<void> =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          images.current[index] = img;
          resolve();
        };
        // Never hang the tiers on a single missing file.
        img.onerror = () => resolve();
        img.src = FRAME_PATH(index);
      });

    (async () => {
      let loaded = 0;
      let unblocked = false;
      for (const [tierIndex, end] of PRELOAD_TIERS.entries()) {
        if (cancelled) return;
        const jobs: Promise<void>[] = [];
        for (let i = loaded; i < Math.min(end, FRAME_COUNT); i++) jobs.push(loadOne(i));
        await Promise.all(jobs);
        if (cancelled) return;
        loaded = Math.min(end, FRAME_COUNT);
        setLoadedCount(loaded);
        if (!unblocked && tierIndex === 0) {
          unblocked = true;
          setReady(true);
          const poster = reduceRef.current ? POSTER_INDEX : 0;
          target.current = poster;
          eased.current = poster;
          drawn.current = poster;
          draw(poster);
          setPhase(Math.min(PHASES.length - 1, Math.floor((poster / FRAME_COUNT) * PHASES.length)));
        }
        // Yield so first paint and scrolling stay responsive while streaming.
        await new Promise((r) => setTimeout(r, 0));
      }
      // Pre-sharpen every frame once everything is in. Two frames per idle
      // chunk so the main thread never stutters; scrolling draws from cache.
      // Skipped on low-memory devices (raw frames are drawn instead).
      const nav = window.navigator as Navigator & { deviceMemory?: number };
      if (SHARPEN_AMOUNT > 0 && !(nav.deviceMemory && nav.deviceMemory <= 3)) {
        for (let i = 0; i < FRAME_COUNT; i++) {
          if (cancelled) return;
          const img = images.current[i];
          if (img?.naturalWidth && !sharpCache.current[i]) {
            const done = sharpen(img);
            if (done) sharpCache.current[i] = done;
          }
          if (i % 2 === 1) await new Promise((r) => setTimeout(r, 0));
        }
      }
    })();

    // Ease loop: converges exactly on stop, reverses naturally on scroll up.
    // Draws only when the rounded frame index actually changes.
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = target.current;
      const next = eased.current + (t - eased.current) * EASE;
      eased.current = Math.abs(t - next) < 0.001 ? t : next;
      const index = Math.round(eased.current);
      if (index === drawn.current) return;
      drawn.current = index;
      draw(index);
      const nextPhase = Math.min(PHASES.length - 1, Math.floor((index / FRAME_COUNT) * PHASES.length));
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      measure();
      draw(drawn.current);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Training in motion"
      className={`relative bg-black ${SECTION_HEIGHT_CLASS}`}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {/* Cinematic grade over the frames. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40"
        />
        {/* Film grain: high-frequency texture that masks JPEG softness. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23n)\' opacity=\'0.6\'/%3E%3C/svg%3E")',
          }}
        />
        {/* Phase caption, reusing the landing headline copy. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-10 text-center sm:pb-14">
          {ready && (
            <p
              key={phase}
              className="animate-rise-in font-display text-5xl tracking-tight text-white sm:text-7xl"
            >
              {PHASES[phase]}
            </p>
          )}
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/60">
            Scroll to move
          </p>
        </div>
        {/* Minimal loader: thin bar, fades out once frames 1-5 are ready. */}
        <div
          aria-hidden={ready}
          className={`absolute inset-x-0 bottom-0 transition-opacity duration-500 ${
            ready ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="mx-auto mb-6 w-48">
            <div className="mb-2 text-center text-xs uppercase tracking-[0.3em] text-white/70">
              Loading animation
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-volt transition-[width] duration-300"
                style={{ width: `${Math.round((loadedCount / FRAME_COUNT) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
