'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  History,
  Home,
  Layers,
  Settings,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'home', icon: Home },
  { href: '/challenges', label: 'challenges', icon: Trophy },
  { href: '/history', label: 'history', icon: History },
  { href: '/progress', label: 'progress', icon: TrendingUp },
  { href: '/programs', label: 'programs', icon: Layers },
  { href: '/exercises', label: 'catalog', icon: Dumbbell },
  { href: '/admin', label: 'admin', icon: ShieldCheck },
  { href: '/settings', label: 'settings', icon: Settings },
] as const;

// Single app nav section: every destination in one scrollable row.
// Desktop: tab row under the header. Phones: fixed bottom dock that scrolls
// sideways instead of hiding stops behind a menu. Labels always visible.
export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  function stop(active: boolean, wide: boolean) {
    return cn(
      'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-200',
      wide ? 'min-w-[64px] shrink-0' : 'flex-1',
      active
        ? 'bg-volt text-white shadow-[0_4px_16px_hsl(22_92%_49%/0.5)]'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95',
    );
  }

  function renderStop(link: (typeof LINKS)[number], wide: boolean) {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        prefetch={false}
        aria-current={active ? 'page' : undefined}
        className={stop(active, wide)}
      >
        <Icon className="size-5 shrink-0" />
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide">
          {t(link.label)}
        </span>
      </Link>
    );
  }

  return (
    <>
      {/* Desktop: full-width single tab row under the header */}
      <nav className="hidden border-b border-border bg-background/95 backdrop-blur md:block">
        <div className="flex items-stretch gap-1 px-4 py-2">
          {LINKS.map((link) => renderStop(link, false))}
        </div>
      </nav>

      {/* Mobile: single fixed bottom dock, scrolls instead of hiding stops */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div
          className="flex items-stretch gap-1 overflow-x-auto px-3 pt-2"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {LINKS.map((link) => renderStop(link, true))}
        </div>
      </nav>
    </>
  );
}
