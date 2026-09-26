'use client';

import { motion } from 'framer-motion';

const CONFETTI = [
  '#EA580C', '#FFD700', '#FFFFFF', '#35C759', '#B9F', '#38BDF8',
];

// Surprise reveal: medal springs in over a confetti burst, glow pulses behind.
export function BadgeReveal({
  day,
  badgeName,
  color,
  avatarSrc,
  avatarAlt,
}: {
  day: number;
  badgeName: string;
  color: string;
  avatarSrc: string;
  avatarAlt: string;
}) {
  return (
    <div className="relative flex flex-col items-center" aria-live="polite">
      <div className="pointer-events-none absolute inset-0 -z-0 flex items-start justify-center" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            initial={{ y: -10, opacity: 1, rotate: 0 }}
            animate={{ y: 190, opacity: 0, rotate: 360 + i * 40 }}
            transition={{ duration: 1.6 + (i % 5) * 0.15, ease: 'easeIn' }}
            className="absolute h-2 w-1.5 rounded-sm"
            style={{ background: c, left: `${8 + i * 7}%` }}
          />
        ))}
      </div>
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 13, delay: 0.15 }}
        className="relative"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 -m-3 rounded-full"
          style={{ background: color, opacity: 0.35, filter: 'blur(18px)' }}
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span
          className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 font-display text-3xl font-bold text-black"
          style={{ background: color, borderColor: '#fff3' }}
        >
          {day}
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-3 flex flex-col items-center gap-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={avatarAlt}
          width={72}
          height={88}
          className="h-24 w-20 rounded-2xl border border-white/30 object-cover object-top"
        />
        <p className="font-display text-2xl">{badgeName}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Day {day} badge</p>
      </motion.div>
    </div>
  );
}
