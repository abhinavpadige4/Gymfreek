import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { eraseUserAccount } from '@/lib/user-erase';

const deleteAccountSchema = z.object({
  // Typed confirmation: the user's own email. Prevents one-click accidents
  // and proves the caller knows whose account is being erased.
  confirmEmail: z.string().email().max(200),
});

// DELETE /api/account: erases the account and all personal data.
// Explicit delete order (no schema migration): rows whose User relation has
// no DB-level cascade are removed first, then the User row cascades the rest
// (goals, measurements, readiness, payments, badges, tokens, gyms, results).
// Financial transaction records survive at Razorpay (the payment processor),
// which is disclosed on the Privacy page - local Payment rows are removed.
export async function DELETE(req: Request) {
  try {
    const userId = await requireApiUserId();
    const rl = rateLimit(`account-delete:${userId}`, 3, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const { confirmEmail } = await parseJsonBody(req, deleteAccountSchema);
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new ApiError(404, 'Not found.');
    if (user.email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      throw new ApiError(400, 'Confirmation email does not match this account.');
    }
    await eraseUserAccount(userId);
    (await cookies()).delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
