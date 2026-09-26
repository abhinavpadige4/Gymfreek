import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';

const programPatchSchema = z.object({
  programId: z.string().min(1),
  isActive: z.boolean(),
});

// PATCH /api/admin/programs: activate or deactivate a member program.
export async function PATCH(req: Request) {
  try {
    await requireAdminUserId();
    const data = await parseJsonBody(req, programPatchSchema);
    const updated = await db.program.update({
      where: { id: data.programId },
      data: { isActive: data.isActive },
      select: { id: true, isActive: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/admin/programs?programId=...: remove a program with no logged
// sessions. Programs with history are deactivated instead, same guard as the
// challenge delete.
export async function DELETE(req: Request) {
  try {
    await requireAdminUserId();
    const programId = new URL(req.url).searchParams.get('programId');
    if (!programId) throw new ApiError(400, 'programId is required.');
    const sessions = await db.session.count({ where: { programId } });
    if (sessions > 0) {
      throw new ApiError(400, 'Program has logged sessions. Deactivate it instead.');
    }
    await db.program.delete({ where: { id: programId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
