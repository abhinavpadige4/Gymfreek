import { Dumbbell } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { NavLinks } from '@/components/shared/nav-links';
import { OfflineIndicator } from '@/components/shared/offline-indicator';
import { SyncBootstrap } from '@/components/shared/sync-bootstrap';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSelector } from '@/components/shared/language-selector';
import { getCurrentSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Layout for app routes. The landing page (/) is public, so logged-out
// visitors get a slim marketing header instead of the app chrome.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="size-5 text-volt" />
              <span className="font-display text-base tracking-wide">GYMFREEK</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Join the challenge</Link>
              </Button>
            </div>
          </div>
        </header>
        {children}
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SyncBootstrap />
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="size-5" />
            <span className="text-base font-semibold">Gymfreek</span>
          </Link>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <LanguageSelector />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <NavLinks />
      </header>
      {children}
    </div>
  );
}
