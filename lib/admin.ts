import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export async function requireAdminUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new ApiError(401, 'Unauthorized');
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // ponytail: env allowlist as fallback so the first admin can be set without a migration.
  if (user?.role !== 'ADMIN') {
    const { getCurrentSession } = await import('@/lib/auth');
    const session = await getCurrentSession();
    if (!session || !adminEmails.includes(session.email.toLowerCase())) {
      throw new ApiError(403, 'Admin only.');
    }
  }
  return userId;
}

export async function isAdminUserId(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === 'ADMIN';
}
