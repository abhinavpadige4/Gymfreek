// Business/legal details shown on the Terms, Privacy, Refunds and Support
// pages. Every value the business has not provided yet is an explicit
// [PLACEHOLDER] so nothing reads as a confirmed legal claim. Admin edits
// these at /admin/settings (SiteSetting rows, read first); env vars are the
// fallback so nothing needs a redeploy - no code change needed.
function envOr(name: string, fallback: string): string {
  const v = process.env[name]?.trim();
  return v ? v : fallback;
}

const FALLBACKS = {
  businessName: envOr('NEXT_PUBLIC_LEGAL_BUSINESS_NAME', '[LEGAL BUSINESS NAME]'),
  contactEmail: envOr('NEXT_PUBLIC_LEGAL_CONTACT_EMAIL', '[CONTACT EMAIL]'),
  supportPhone: envOr('NEXT_PUBLIC_LEGAL_SUPPORT_PHONE', '[SUPPORT PHONE]'),
  supportHours: envOr(
    'NEXT_PUBLIC_LEGAL_SUPPORT_HOURS',
    '[SUPPORT HOURS, e.g. Mon-Sat 10:00-18:00 IST]',
  ),
  registeredAddress: envOr('NEXT_PUBLIC_LEGAL_ADDRESS', '[REGISTERED ADDRESS]'),
  governingLaw: envOr('NEXT_PUBLIC_LEGAL_GOVERNING_LAW', '[GOVERNING LAW / JURISDICTION]'),
  refundPolicy: envOr(
    'NEXT_PUBLIC_LEGAL_REFUND_POLICY',
    '[REFUND POLICY - e.g. full refund within N days of payment]',
  ),
} as const;

export type LegalKey = keyof typeof FALLBACKS;

// Static build-safe copy (client components, metadata). Server pages should
// prefer resolveLegal() so admin edits apply without a redeploy.
export const LEGAL = {
  ...FALLBACKS,
  termsVersion: '1.0',
  privacyVersion: '1.0',
} as const;

export async function resolveLegal(): Promise<typeof LEGAL> {
  try {
    const { getSiteSettings } = await import('@/lib/site-settings');
    const dbValues = await getSiteSettings();
    return {
      businessName: dbValues.businessName || FALLBACKS.businessName,
      contactEmail: dbValues.contactEmail || FALLBACKS.contactEmail,
      supportPhone: dbValues.supportPhone || FALLBACKS.supportPhone,
      supportHours: dbValues.supportHours || FALLBACKS.supportHours,
      registeredAddress: dbValues.registeredAddress || FALLBACKS.registeredAddress,
      governingLaw: dbValues.governingLaw || FALLBACKS.governingLaw,
      refundPolicy: dbValues.refundPolicy || FALLBACKS.refundPolicy,
      termsVersion: LEGAL.termsVersion,
      privacyVersion: LEGAL.privacyVersion,
    };
  } catch {
    return { ...LEGAL };
  }
}
