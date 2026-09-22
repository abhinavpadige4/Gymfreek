'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// Four-grid footer: brand + program + account + legal. Links fade/slide in
// on scroll into view; columns collapse to one on mobile.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Program',
    links: [
      { label: 'The challenge', href: '/challenges' },
      { label: 'How it works', href: '/#how' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    title: 'Train',
    links: [
      { label: 'Live workout', href: '/workout/live?exercise=squat' },
      { label: 'Progress', href: '/progress' },
      { label: 'History', href: '/history' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', href: '/login' },
      { label: 'Sign up', href: '/signup' },
      { label: 'Settings', href: '/settings' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-display text-3xl tracking-wide">
            100<span className="text-volt">X</span>U
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Train. Track. Improve. Transform.
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            100 days. 100,000 reps. Live AI form checks on every rep.
          </p>
        </motion.div>
        {COLUMNS.map((col, i) => (
          <motion.nav
            key={col.title}
            aria-label={col.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.08 * (i + 1) }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {col.title}
            </p>
            {col.links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="w-fit text-sm text-foreground/80 transition-colors hover:text-volt"
              >
                {l.label}
              </Link>
            ))}
          </motion.nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>100XU Century Challenge. Train hard, stay humble.</p>
          <p>Camera never leaves your device. Results only.</p>
        </div>
      </div>
    </footer>
  );
}
