import Link from 'next/link';

// Shared shell for the public legal pages: back link, title, last-updated
// line, and a narrow readable column. English-only (repo convention).
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-volt hover:underline">
        Back to 100XU
      </Link>
      <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
        Last updated: {updated}
      </p>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
      <nav aria-label="Legal" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
        <Link href="/terms" className="text-foreground/80 hover:text-volt">Terms</Link>
        <Link href="/privacy" className="text-foreground/80 hover:text-volt">Privacy</Link>
        <Link href="/refunds" className="text-foreground/80 hover:text-volt">Refunds</Link>
        <Link href="/support" className="text-foreground/80 hover:text-volt">Support</Link>
      </nav>
    </main>
  );
}

export function LegalH({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg tracking-wide">{children}</h2>;
}
