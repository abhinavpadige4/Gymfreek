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

// Bottom dock: the active destination is a solid volt pill, the rest are
// quiet icon-plus-label stops. Horizontally scrollable on narrow screens.
export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  return (
    <nav className="border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-stretch gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active =
            link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all',
                active
                  ? 'bg-volt text-white shadow-[0_4px_16px_hsl(22_92%_49%/0.5)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{t(link.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
