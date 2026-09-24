import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';
import { generatedProgramSchema } from '@/lib/schemas/program-generation';
import { buildProgramFromGenerated } from '@/lib/program-generation';

// Instantiating a template goes through the same persistence helper as the
// AI generator so exercise upserts never overwrite user-authored metadata.
// Unlike the generator flow, a picked template becomes the active program.
// The template slug is stored so the detail page can render locked
// (start-only, no builder controls).
const fromTemplateSchema = z.object({
  program: generatedProgramSchema,
  templateSlug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireApiUserId();
    const data = await parseJsonBody(req, fromTemplateSchema);

    const programId = await buildProgramFromGenerated(userId, data.program);
    if (data.templateSlug) {
      await db.program.update({
        where: { id: programId },
        data: { sourceTemplateSlug: data.templateSlug },
      });
    }
    // Sequential, not a $transaction: array/interactive transactions fail on
    // pooled Postgres (PgBouncer transaction mode). On activation failure the
    // previously active programs are restored best-effort.
    const previouslyActive = await db.program.findMany({
      where: { userId, isActive: true, id: { not: programId } },
      select: { id: true },
    });
    await db.program.updateMany({
      where: { userId, isActive: true, id: { not: programId } },
      data: { isActive: false },
    });
    try {
      await db.program.update({ where: { id: programId }, data: { isActive: true } });
    } catch (err) {
      await db.program
        .updateMany({
          where: { userId, id: { in: previouslyActive.map((p) => p.id) } },
          data: { isActive: true },
        })
        .catch(() => {});
      throw err;
    }

    return NextResponse.json({ id: programId }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
