'use client';

import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const n = useCountUp(value);
  return (
    <div className="flex flex-col">
      <span className="font-display text-3xl text-volt sm:text-4xl">
        {n.toLocaleString('en-US')}
        {suffix}
      </span>
      <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return (
    <div className="perspective-1200">
      <div
        ref={ref}
        className="preserve-3d transition-transform duration-200 ease-out will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
