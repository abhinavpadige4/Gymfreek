import type { Metadata } from 'next';
import { resolveLegal } from '@/lib/legal';
import { LegalShell, LegalH } from '@/components/legal/legal-shell';

export const metadata: Metadata = { title: 'Refunds and Cancellations - 100XU' };

export default async function RefundsPage() {
  const LEGAL = await resolveLegal();
  return (
    <LegalShell title="Refunds and Cancellations" updated="2026-09-30">
      <p>
        Challenge entry on 100XU is a one-time payment (no subscription, nothing auto-renews).
        Our refund rule: {LEGAL.refundPolicy}
      </p>
      <LegalH>How to request a refund</LegalH>
      <p>
        Email {LEGAL.contactEmail} or call {LEGAL.supportPhone} ({LEGAL.supportHours}) with the
        email address on your account and your payment ID (found in your payment receipt). We
        respond to payment disputes within 2 working days.
      </p>
      <LegalH>How refunds are processed</LegalH>
      <p>
        Approved refunds go back to the original payment method via Razorpay within 5-7 working
        days. Your challenge enrollment is cancelled when a refund is issued. Payments are verified
        server-side by signature and amount before any enrollment is activated.
      </p>
      <LegalH>Cancellations</LegalH>
      <p>
        You can stop participating at any time - there is nothing to cancel since billing is
        one-time. Deleting your account removes your training data but approved or legally required
        transaction records are retained.
      </p>
    </LegalShell>
  );
}
