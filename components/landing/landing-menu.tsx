'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

// Public landing menu: one big Menu button opening a vertical panel.
// Button-based (not details/summary) so it is keyboard accessible:
// Escape closes, focus returns to the button, links close on tap.
export function LandingMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (
        t &&
        !panelRef.current?.contains(t) &&
        !buttonRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open ]);

  const links = [
    { href: '#how', label: 'How it works' },
    { href: '#challenge', label: 'Challenge' },
    { href: '#pricing', label: 'Pricing' },
  ];

  return (
    <div className="fixed right-3 top-3 z-40">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="landing-menu-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-tap min-w-tap items-center gap-2 rounded-full bg-volt px-5 py-3 text-base font-bold text-black shadow-lg"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        Menu
      </button>
      {open && (
        <nav
          ref={panelRef}
          id="landing-menu-panel"
          aria-label="Primary"
          className="absolute right-0 top-full mt-2 flex w-64 flex-col gap-1 rounded-2xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base text-zinc-200 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-volt/60 px-3 py-3 text-center text-base font-bold text-volt hover:bg-volt/10"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-volt px-3 py-3 text-center text-base font-bold text-black"
          >
            Join the challenge
          </Link>
        </nav>
      )}
    </div>
  );
}
