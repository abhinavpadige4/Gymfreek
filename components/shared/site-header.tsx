import Image from 'next/image';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';
import { LanguageSelector } from '@/components/shared/language-selector';
import { NavLinks } from '@/components/shared/nav-links';
import { OfflineIndicator } from '@/components/shared/offline-indicator';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';

const LANDING_LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#challenge', label: 'Challenge' },
  { href: '/#pricing', label: 'Pricing' },
] as const;

// The single navbar for the whole app: one sticky brand bar everywhere,
// session-aware on the right. Logged in: controls + app nav (top row on
// desktop, bottom dock on phones via NavLinks). Logged out: section links
// plus Log in / Join actions. Auth pages render the logged-out variant.
export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="100XU home">
          <Image
            src="/icons/icon-192.png"
            alt="100XU"
            width={64}
            height={64}
            className="h-8 w-8 rounded-md"
          />
        </Link>
        {loggedIn ? (
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
            <OfflineIndicator />
            <LanguageSelector />
            <ThemeToggle />
            <LogoutButton />
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <nav aria-label="Sections" className="mr-1 hidden items-center gap-1 md:flex">
              {LANDING_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <LanguageSelector />
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="min-h-tap shrink-0">
              <Link href="/signup">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Join the challenge</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
      {loggedIn && <NavLinks />}
    </header>
  );
}
