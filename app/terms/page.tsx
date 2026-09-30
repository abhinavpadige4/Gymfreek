import type { Metadata } from 'next';
import { resolveLegal } from '@/lib/legal';
import { LegalShell, LegalH } from '@/components/legal/legal-shell';

export const metadata: Metadata = { title: 'Terms and Conditions - 100XU' };

export default async function TermsPage() {
  const LEGAL = await resolveLegal();
  return (
    <LegalShell title="Terms and Conditions" updated="2026-09-30">
      <p>
        These Terms govern your use of 100XU, operated by {LEGAL.businessName} ({LEGAL.registeredAddress}).
        By creating an account you accept these Terms and the Privacy Policy.
      </p>
      <LegalH>Eligibility</LegalH>
      <p>
        You must be at least 13 years old (or the minimum age in your jurisdiction) and able to
        enter a binding agreement. Accounts are personal - you are responsible for keeping your
        password confidential and for all activity under your account.
      </p>
      <LegalH>Acceptable use</LegalH>
      <p>
        Use 100XU for personal fitness training only. Prohibited: sharing accounts, scraping or
        copying the exercise catalog at scale, uploading unlawful or infringing content, attempting
        to breach or bypass access controls, abusing free-text or upload features to attack the
        service, and any use that violates applicable law.
      </p>
      <LegalH>AI coaching and health disclaimer</LegalH>
      <p>
        AI-generated guidance - including form feedback, workout summaries, and coaching messages -
        is provided for informational and fitness-support purposes only. It is not medical advice,
        diagnosis, or treatment, and is not a substitute for a qualified healthcare or fitness
        professional. Do not exercise through serious pain, injury, dizziness, breathing difficulty,
        or chest pain. If you have a medical condition, are pregnant, or are unsure whether training
        is safe for you, consult a qualified professional before starting.
      </p>
      <LegalH>Payments and refunds</LegalH>
      <p>
        Challenge entry is a one-time payment processed securely by Razorpay - we never see or store
        your card, CVV, or bank credentials. Refunds and cancellations: {LEGAL.refundPolicy}
      </p>
      <LegalH>Service availability and third parties</LegalH>
      <p>
        We aim for reliable service but do not guarantee uninterrupted availability. The app relies
        on third parties (hosting, database, Razorpay for payments, on-device ML models). Camera
        analysis runs on your device - video frames are never uploaded or stored by us.
      </p>
      <LegalH>Intellectual property and your content</LegalH>
      <p>
        The 100XU program, branding, and exercise catalog belong to {LEGAL.businessName}. Your
        training data, photos, and notes remain yours; you grant us a license to store and process
        them solely to operate your account. You can export your data from Settings and delete your
        account at any time.
      </p>
      <LegalH>Limitation of liability</LegalH>
      <p>
        To the maximum extent permitted by {LEGAL.governingLaw}, {LEGAL.businessName} is not liable
        for indirect or consequential damages, including injuries sustained while training. Nothing
        here limits liability that cannot be limited by law.
      </p>
      <LegalH>Termination and changes</LegalH>
      <p>
        We may suspend accounts that violate these Terms. You may stop using the service and delete
        your account at any time. We may update these Terms; continued use after changes take effect
        means you accept them. Disputes are governed by {LEGAL.governingLaw}. Contact: {LEGAL.contactEmail}.
      </p>
    </LegalShell>
  );
}
