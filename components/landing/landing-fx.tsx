'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion';

// The main scrolling animation from the Gym-Website landing (VelocityText):
// a strip of giant outlined words that drifts on its own and surges / flips
// direction with the page scroll velocity. Rendered 4x for a seamless loop.
function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function useScrollBoostedX(baseVelocity: number, min: number, max: number): MotionValue<string> {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v: number) => `${wrap(min, max, v)}%`);
  const direction = useRef(baseVelocity < 0 ? -1 : 1);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion.current) return;
    const step = Math.min(delta, 100);
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    let move = direction.current * baseVelocity * (step / 1000);
    move += direction.current * move * f;
    baseX.set(baseX.get() + move);
  });

  return x;
}

export function VelocityMarquee({ items, baseVelocity = 3 }: { items: string[]; baseVelocity?: number }) {
  const x = useScrollBoostedX(baseVelocity, -25, 0);
  const words = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden py-6" aria-hidden="true">
      <motion.div style={{ x }} className="flex w-max items-center gap-8 whitespace-nowrap will-change-transform">
        {words.map((w, i) => (
          <span key={i} className="velocity-word font-display text-5xl tracking-wide sm:text-6xl">
            {w.toUpperCase()} <span className="ml-6 text-volt">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// Thin volt progress bar pinned to the top of the viewport.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-volt"
    />
  );
}

// Fade-up on scroll into view. Renders a plain div when the OS asks for
// reduced motion.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Community rep counter that ticks up live. Renders a fixed base on the
// server so hydration never mismatches, then ticks on the client.
export function LiveTicker({ base = 87432 }: { base?: number }) {
  const [n, setN] = useState(base);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setN((v) => v + 1 + Math.floor(Math.random() * 6)), 1800);
    return () => clearInterval(id);
  }, [reduce]);
  return <span className="font-semibold tabular-nums text-foreground">{n.toLocaleString('en-US')}</span>;
}
