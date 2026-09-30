import type { Metadata } from 'next';
import { resolveLegal } from '@/lib/legal';
import { LegalShell, LegalH } from '@/components/legal/legal-shell';

export const metadata: Metadata = { title: 'Support - 100XU' };

export default async function SupportPage() {
  const LEGAL = await resolveLegal();
  return (
    <LegalShell title="Support" updated="2026-09-30">
      <p>
        For help with training, your account, payments, or privacy requests, reach us at:
      </p>
      <LegalH>Contact details</LegalH>
      <p>
        Email: {LEGAL.contactEmail}
        Phone: {LEGAL.supportPhone} ({LEGAL.supportHours})
        Operator: {LEGAL.businessName}, {LEGAL.registeredAddress}
      </p>
      <LegalH>Payment disputes</LegalH>
      <p>
        Include your account email and payment ID. We respond within 2 working days; approved
        refunds return to the original payment method within 5-7 working days. See the Refunds page
        for the full policy.
      </p>
      <LegalH>Privacy requests</LegalH>
      <p>
        Export your data from Settings (Backup) or ask us to delete your account and data by
        emailing {LEGAL.contactEmail} from your account email. In-app deletion is also available in
        Settings.
      </p>
    </LegalShell>
  );
}
