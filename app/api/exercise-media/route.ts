import { NextResponse } from 'next/server';
import { handleApiError, parseJsonBody, requireApiUserId } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import {
  deleteExerciseTechniqueImage,
  deleteExerciseVideo,
  getExerciseMediaMeta,
  getExerciseTechniqueImage,
  getExerciseVideo,
  setExerciseCaption,
  setExerciseTechniqueImage,
  setExerciseVideoFile,
  setExerciseVideoUrl,
} from '@/lib/exercise-technique-image';
import { exerciseMediaUpsertSchema } from '@/lib/schemas/exercise-media';
import { catalogNameFor } from '@/lib/exercise-aliases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireApiUserId();
    const params = new URL(req.url).searchParams;
    // Blueprint names (challenge tasks) resolve to their catalog entry so
    // one upload serves every spelling of the movement.
    const name = catalogNameFor(params.get('name') ?? '') ?? params.get('name') ?? '';
    if (params.get('format') === 'meta') {
      return NextResponse.json(await getExerciseMediaMeta(name));
    }
    if (params.get('format') === 'video') {
      const video = await getExerciseVideo(name);
      if (video.kind === 'url') return NextResponse.json({ url: video.url });
      return new Response(new Uint8Array(video.bytes), {
        headers: {
          'Content-Type': video.mimeType,
          'Content-Length': String(video.bytes.byteLength),
          'Cache-Control': 'private, max-age=3600',
          'Last-Modified': video.updatedAt.toUTCString(),
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const image = await getExerciseTechniqueImage(name);
    return new Response(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.mimeType,
        'Content-Length': String(image.bytes.byteLength),
        'Cache-Control': 'private, max-age=3600',
        'Last-Modified': image.updatedAt.toUTCString(),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminUserId();
    const input = await parseJsonBody(req, exerciseMediaUpsertSchema, {
      maxBytes: 34_000_000,
    });
    if (input.imageBase64) {
      const saved = await setExerciseTechniqueImage(input.name, {
        imageBase64: input.imageBase64,
        mimeType: input.mimeType!,
        caption: input.caption,
      });
      return NextResponse.json({ saved });
    }
    if (input.videoUrl) {
      const saved = await setExerciseVideoUrl(input.name, input.videoUrl, input.caption);
      return NextResponse.json({ saved });
    }
    if (input.videoBase64) {
      const saved = await setExerciseVideoFile(input.name, {
        imageBase64: input.videoBase64,
        mimeType: input.videoMimeType!,
        caption: input.caption,
      });
      return NextResponse.json({ saved });
    }
    // Caption-only save: admin technique note without new media.
    if (input.caption != null) {
      const saved = await setExerciseCaption(input.name, input.caption);
      return NextResponse.json({ saved });
    }
    return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminUserId();
    const params = new URL(req.url).searchParams;
    const name = params.get('name') ?? '';
    if (params.get('kind') === 'video') {
      return NextResponse.json({ deleted: await deleteExerciseVideo(name) });
    }
    return NextResponse.json({ deleted: await deleteExerciseTechniqueImage(name) });
  } catch (err) {
    return handleApiError(err);
  }
}
