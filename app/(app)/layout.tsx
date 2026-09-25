import { LogoutButton } from '@/components/auth/logout-button';
import { NavLinks } from '@/components/shared/nav-links';
import { OfflineIndicator } from '@/components/shared/offline-indicator';
import { SyncBootstrap } from '@/components/shared/sync-bootstrap';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSelector } from '@/components/shared/language-selector';
import { getCurrentSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

// Layout for app routes. The landing page (/) is public, so logged-out
// visitors get a slim marketing header instead of the app chrome.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/60 py-2 pl-3 pr-2 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <Link href="/" className="flex items-center gap-2" aria-label="100XU home">
              <Image
                src="/icons/icon-192.png"
                alt="100XU"
                width={64}
                height={64}
                className="h-8 w-8 rounded-md"
              />
              <span className="hidden font-display text-base tracking-wide text-white sm:inline">
                100XU
              </span>
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                <a href="#how">How it works</a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                <a href="#challenge">Challenge</a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                <a href="#pricing">Pricing</a>
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="text-zinc-200 hover:text-white">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Join the challenge</Link>
              </Button>
            </div>
          </nav>
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
