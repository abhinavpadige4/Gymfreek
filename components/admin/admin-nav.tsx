'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/programs', label: 'Programs' },
] as const;

// Shared tab bar for every admin page so the console reads as one place.
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-volt text-white'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
