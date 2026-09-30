import { db } from '@/lib/db';

// Full account erasure shared by self-deletion (/api/account) and admin
// deletion (/api/admin/users). Explicit delete order (no schema migration):
// rows whose User relation has no DB-level cascade go first, then the User
// row cascades the rest. Financial records survive only at Razorpay.
export async function eraseUserAccount(userId: string): Promise<void> {
  await db.$transaction([
    db.session.deleteMany({ where: { userId } }),
    db.workoutSession.deleteMany({ where: { userId } }),
    db.conversation.deleteMany({ where: { userId } }),
    db.program.deleteMany({ where: { userId } }),
    db.exercise.deleteMany({ where: { userId } }),
    db.gym.deleteMany({ where: { userId } }),
    db.coachSession.deleteMany({ where: { userId } }),
    db.enrollment.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}
