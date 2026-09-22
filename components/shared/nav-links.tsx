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

export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-1">
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
              'relative flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className={cn('size-4 shrink-0', active && 'text-volt')} />
            {t(link.label)}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-volt"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
