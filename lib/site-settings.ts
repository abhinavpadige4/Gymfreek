import { z } from 'zod';
import { db } from '@/lib/db';

// Admin-editable site content (/admin/settings). Keys mirror lib/legal.ts;
// the legal pages read DB first and fall back to env placeholders.
export const SITE_SETTING_KEYS = [
  'businessName',
  'contactEmail',
  'supportPhone',
  'supportHours',
  'registeredAddress',
  'governingLaw',
  'refundPolicy',
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export const siteSettingsSchema = z.object({
  businessName: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
  supportPhone: z.string().trim().max(50).optional(),
  supportHours: z.string().trim().max(200).optional(),
  registeredAddress: z.string().trim().max(500).optional(),
  governingLaw: z.string().trim().max(200).optional(),
  refundPolicy: z.string().trim().max(2000).optional(),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export async function getSiteSettings(): Promise<Record<SiteSettingKey, string>> {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: [...SITE_SETTING_KEYS] } },
    select: { key: true, value: true },
  });
  const out = {} as Record<SiteSettingKey, string>;
  for (const key of SITE_SETTING_KEYS) {
    out[key] = rows.find((r) => r.key === key)?.value ?? '';
  }
  return out;
}

export async function saveSiteSettings(input: SiteSettingsInput): Promise<void> {
  const entries = (Object.entries(input) as [SiteSettingKey, string | undefined][]).filter(
    (e): e is [SiteSettingKey, string] => typeof e[1] === 'string',
  );
  await db.$transaction(
    entries.map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}
