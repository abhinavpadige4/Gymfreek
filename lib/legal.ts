// Business/legal details shown on the Terms, Privacy, Refunds and Support
// pages. Every value the business has not provided yet is an explicit
// [PLACEHOLDER] so nothing reads as a confirmed legal claim. Admin edits
// these env vars (see .env.example) - no code change needed.
function envOr(name: string, fallback: string): string {
  const v = process.env[name]?.trim();
  return v ? v : fallback;
}

export const LEGAL = {
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
  termsVersion: '1.0',
  privacyVersion: '1.0',
} as const;
