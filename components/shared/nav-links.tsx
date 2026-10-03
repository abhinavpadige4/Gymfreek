'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  History,
  Home,
  Layers,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY = [
  { href: '/', label: 'home', icon: Home },
  { href: '/challenges', label: 'challenges', icon: Trophy },
  { href: '/history', label: 'history', icon: History },
  { href: '/progress', label: 'progress', icon: TrendingUp },
] as const;

const MORE = [
  { href: '/programs', label: 'programs', icon: Layers },
  { href: '/exercises', label: 'catalog', icon: Dumbbell },
  { href: '/admin', label: 'admin', icon: ShieldCheck },
  { href: '/settings', label: 'settings', icon: Settings },
] as const;

// App nav: fixed bottom dock with 5 stops on phones (More opens the rest),
// classic top row on desktop. Labels always visible - no hover-only text.
export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const [moreOpen, setMoreOpen] = useState(false);

  // The sheet must never get stuck open: close on navigation and on Escape.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
  const moreActive = MORE.some((l) => isActive(l.href));

  function stopClass(active: boolean) {
    return cn(
      'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-200',
      active
        ? 'bg-volt text-white shadow-[0_4px_16px_hsl(22_92%_49%/0.5)]'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95',
    );
  }

  return (
    <>
      {/* Desktop: tab row under the header */}
      <nav className="hidden border-b border-border bg-background/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-3xl items-stretch gap-1 px-3 py-2">
          {[...PRIMARY, ...MORE].map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={stopClass(active)}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide">
                  {t(link.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: fixed bottom dock with safe-area padding. Body-level fixed
          (never inside a blurred ancestor) so it pins to the viewport. */}
      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-black/60 md:hidden"
        />
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        {moreOpen && (
          <div className="grid grid-cols-2 gap-1 border-b border-border bg-background p-3">
            {MORE.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active ? 'bg-volt text-white' : 'text-muted-foreground hover:bg-secondary',
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="truncate">{t(link.label)}</span>
                </Link>
              );
            })}
          </div>
        )}
        <div
          className="flex items-stretch gap-1 px-3 pt-2"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {PRIMARY.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={stopClass(active)}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wide">
                  {t(link.label)}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label={t('more')}
            className={stopClass(moreActive || moreOpen)}
          >
            {moreOpen ? <X className="size-5 shrink-0" /> : <MoreHorizontal className="size-5 shrink-0" />}
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide">{t('more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
