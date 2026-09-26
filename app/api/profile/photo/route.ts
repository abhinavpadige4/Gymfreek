import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, parseJsonBody, requireApiUserId, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import {
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_MIMES,
  profilePhotoSchema,
} from '@/lib/schemas/profile';

function parseDataUrl(dataUrl: string): { mime: string; bytes: Buffer } {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new ApiError(400, 'Bad data URL.');
  const mime = match[1]!;
  const bytes = Buffer.from(match[2]!, 'base64');
  if (
    !(PROFILE_PHOTO_MIMES as readonly string[]).includes(mime) ||
    bytes.length === 0 ||
    bytes.length > PROFILE_PHOTO_MAX_BYTES
  ) {
    throw new ApiError(400, 'Photo must be jpeg, png or webp under 500KB.');
  }
  return { mime, bytes };
}

// GET /api/profile/photo: own photo bytes. Admins may pass ?userId= to view a member.
export async function GET(req: Request) {
  try {
    const userId = await requireApiUserId();
    const target = new URL(req.url).searchParams.get('userId');
    let id = userId;
    if (target && target !== userId) {
      await requireAdminUserId();
      id = target;
    }
    const user = await db.user.findUnique({
      where: { id },
      select: { photoData: true, photoMimeType: true },
    });
    if (!user?.photoData || !user.photoMimeType) {
      return NextResponse.json({ error: 'No photo.' }, { status: 404 });
    }
    return new Response(Buffer.from(user.photoData), {
      headers: {
        'Content-Type': user.photoMimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/profile/photo: replace own photo with a data URL body { dataUrl }.
export async function PUT(req: Request) {
  try {
    const userId = await requireApiUserId();
    const data = await parseJsonBody(req, profilePhotoSchema);
    const { mime, bytes } = parseDataUrl(data.dataUrl);
    await db.user.update({
      where: { id: userId },
      data: { photoData: Uint8Array.from(bytes), photoMimeType: mime },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/profile/photo: remove own photo.
export async function DELETE() {
  try {
    const userId = await requireApiUserId();
    await db.user.update({
      where: { id: userId },
      data: { photoData: null, photoMimeType: null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
