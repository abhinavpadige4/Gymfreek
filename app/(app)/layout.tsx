import { LogoutButton } from '@/components/auth/logout-button';
import { NavLinks } from '@/components/shared/nav-links';
import { OfflineIndicator } from '@/components/shared/offline-indicator';
import { SyncBootstrap } from '@/components/shared/sync-bootstrap';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSelector } from '@/components/shared/language-selector';
import { getCurrentSession } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

// Layout for app routes. The landing page (/) is public, so logged-out
// visitors get a slim marketing header instead of the app chrome.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="fixed right-3 top-3 z-40">
          <details className="group relative">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-black/60 text-xl text-white backdrop-blur-xl [&::-webkit-details-marker]:hidden">
              =
            </summary>
            <nav
              aria-label="Primary"
              className="absolute right-0 top-13 flex w-52 flex-col gap-1 rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur-xl"
            >
              <a href="#how" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                How it works
              </a>
              <a href="#challenge" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                Challenge
              </a>
              <a href="#pricing" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                Pricing
              </a>
              <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/10 hover:text-white">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-volt px-3 py-2.5 text-sm font-semibold text-white">
                Join the challenge
              </Link>
            </nav>
          </details>
        </div>
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
