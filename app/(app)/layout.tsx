import { LogoutButton } from '@/components/auth/logout-button';
import { LandingMenu } from '@/components/landing/landing-menu';
import { NavLinks } from '@/components/shared/nav-links';
import { OfflineIndicator } from '@/components/shared/offline-indicator';
import { SyncBootstrap } from '@/components/shared/sync-bootstrap';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSelector } from '@/components/shared/language-selector';
import { getCurrentSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';

// Layout for app routes. The landing page (/) is public, so logged-out
// visitors get a slim marketing header instead of the app chrome. Blocked
// accounts get a suspended screen (API routes reject them separately via
// requireApiUserId; logout stays available so they can leave).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <LandingMenu />
        {children}
      </div>
    );
  }
  const me = await db.user.findUnique({
    where: { id: session.userId },
    select: { status: true },
  });
  if (!me || me.status === 'BLOCKED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-display text-3xl">Account suspended</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account has been suspended. Contact support if you think this is a mistake.
        </p>
        <LogoutButton />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SyncBootstrap />
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2" aria-label="100XU home">
            <Image
              src="/icons/icon-192.png"
              alt="100XU"
              width={64}
              height={64}
              className="h-8 w-8 rounded-md"
            />
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
