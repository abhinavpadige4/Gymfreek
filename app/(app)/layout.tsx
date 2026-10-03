import { LogoutButton } from '@/components/auth/logout-button';
import { SiteHeader } from '@/components/shared/site-header';
import { SyncBootstrap } from '@/components/shared/sync-bootstrap';
import { getCurrentSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Layout for app routes. One navbar everywhere: the public landing gets the
// same sticky brand bar as the app, in logged-out form. Blocked
// accounts get a suspended screen (API routes reject them separately via
// requireApiUserId; logout stays available so they can leave).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader loggedIn={false} />
        {children}
      </div>
    );
  }
  // Block check is best-effort here: if the lookup itself fails (e.g. the
  // User.status migration has not been applied yet), fail open and render -
  // API routes enforce independently via requireApiUserId, and the page's own
  // queries will surface a real DB outage on their own.
  let suspended = false;
  try {
    const me = await db.user.findUnique({
      where: { id: session.userId },
      select: { status: true },
    });
    suspended = !me || me.status === 'BLOCKED';
  } catch (err) {
    console.error('[layout] status check failed:', err);
  }
  if (suspended) {
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
      <SiteHeader loggedIn />
      {children}
      {/* Spacer so the fixed mobile dock never covers page content */}
      <div className="h-20 md:hidden" aria-hidden />
    </div>
  );
}
