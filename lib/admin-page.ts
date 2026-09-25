import { notFound } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Shared guard for admin pages. Returns the session when the viewer is an
// admin (DB role or bootstrap ADMIN_EMAILS); otherwise renders a 404 so the
// admin surface is undiscoverable to regular members.
export async function requireAdminPage() {
  const session = await getCurrentSession();
  const me = session
    ? await db.user.findUnique({
        where: { id: session.userId },
        select: { role: true, email: true },
      })
    : null;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase());
  if (!me || (me.role !== 'ADMIN' && !adminEmails.includes(session!.email.toLowerCase()))) {
    notFound();
  }
  return session!;
}
