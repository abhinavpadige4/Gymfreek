import { NextResponse } from 'next/server';
import { handleApiError, parseJsonBody, ApiError } from '@/lib/api';
import { requireAdminUserId } from '@/lib/admin';
import { rateLimit } from '@/lib/rate-limit';
import { getSiteSettings, saveSiteSettings, siteSettingsSchema } from '@/lib/site-settings';

export async function GET() {
  try {
    await requireAdminUserId();
    return NextResponse.json(await getSiteSettings());
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const callerId = await requireAdminUserId();
    const rl = rateLimit(`admin-settings:${callerId}`, 30, 60_000);
    if (!rl.ok) {
      throw new ApiError(429, `Too many requests. Retry in ${rl.retryAfterSec}s.`);
    }
    const input = await parseJsonBody(req, siteSettingsSchema);
    await saveSiteSettings(input);
    return NextResponse.json(await getSiteSettings());
  } catch (err) {
    return handleApiError(err);
  }
}
