import type { Metadata } from 'next';
import { resolveLegal } from '@/lib/legal';
import { LegalShell, LegalH } from '@/components/legal/legal-shell';

export const metadata: Metadata = { title: 'Privacy Policy - 100XU' };

export default async function PrivacyPage() {
  const LEGAL = await resolveLegal();
  return (
    <LegalShell title="Privacy Policy" updated="2026-09-30">
      <p>
        {LEGAL.businessName} ({LEGAL.registeredAddress}) collects the minimum personal data needed
        to run your training account. Contact: {LEGAL.contactEmail}.
      </p>
      <LegalH>What we collect and why</LegalH>
      <p>
        Account: email, password hash, display name. Training profile: body metrics, goal,
        experience, and any health context you choose to share (conditions, injuries, coach notes) -
        used only to tailor rest rules and coaching. Training data: programs, sessions, sets,
        measurements, challenge progress, badges. Media you upload: profile photo and gym equipment
        images. Payment metadata: order and payment IDs, amount, status - processed by Razorpay; we
        never collect card numbers, CVV, or bank credentials.
      </p>
      <LegalH>Camera and microphone</LegalH>
      <p>
        Live form checks run entirely on your device with an on-device pose model. Video frames are
        never uploaded, stored, logged, or included in analytics or error reports. Set replays are
        kept as local blobs on your device only. The microphone is not recorded - voice coaching uses
        speech synthesis output only. Camera permission is requested only when you start a live check
        and stops when you leave the workout screen.
      </p>
      <LegalH>AI processing</LegalH>
      <p>
        Real-time rep counting and form cues run on-device. Workout summaries sent for AI coaching
        contain only structured numbers (exercise, rep counts, scores, issue counts) - never your
        name, email, profile, video, or payment details. AI outputs are validated before display and
        labelled as AI-generated where shown.
      </p>
      <LegalH>Cookies, storage, and tracking</LegalH>
      <p>
        We use: a strictly necessary session cookie (login), a locale preference cookie, local theme
        and voice settings, and on-device offline training data (IndexedDB). We run no advertising,
        analytics, or cross-site tracking SDKs, so there is nothing optional to consent to.
      </p>
      <LegalH>Third parties and retention</LegalH>
      <p>
        Processors: hosting/database provider, Razorpay (payments). Training data is kept while your
        account exists. When you delete your account, local payment rows are removed but the
        authoritative transaction records stay with Razorpay as required by financial law. Camera
        data is never retained server-side at all.
      </p>
      <LegalH>Your rights</LegalH>
      <p>
        Export your data anytime from Settings (Backup). Delete your photo, equipment, programs, or
        history individually, or delete your entire account from Settings - deletion removes your
        profile, training data, AI records, and uploads (payment records are retained per financial
        law). To exercise these rights or ask questions, contact {LEGAL.contactEmail} or {LEGAL.supportPhone} ({LEGAL.supportHours}).
      </p>
      <LegalH>Changes</LegalH>
      <p>
        We will update this page when our practices change and note the new date above. Continued use
        after changes means you accept the updated policy.
      </p>
    </LegalShell>
  );
}
