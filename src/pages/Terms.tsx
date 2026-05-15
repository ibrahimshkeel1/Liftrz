import { HeroBlock, PageContainer, PageShell } from '../components/premium';

export default function Terms() {
  return (
    <PageShell>
      <PageContainer>
        <HeroBlock
          kicker="Legal"
          title="Terms of Service"
          description="Last updated: May 2026"
        />

        <div className="prose prose-invert mt-10 max-w-3xl">
          <h3 className="text-xl font-semibold text-white">1. Introduction</h3>
          <p className="text-slate-400">Welcome to CoachSet Pakistan. These Terms of Service govern your use of our platform. By accessing or using CoachSet, you agree to be bound by these terms.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">2. Definitions</h3>
          <p className="text-slate-400">"Platform" refers to the CoachSet website and services. "Trainer" refers to fitness professionals registered on the platform. "Client" refers to users seeking fitness services.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">3. Trainer Verification</h3>
          <p className="text-slate-400">All trainers must submit valid CNIC and relevant certifications. CoachSet reserves the right to reject applications. Verification does not guarantee trainer competence.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">4. Payments & Commission</h3>
          <p className="text-slate-400">CoachSet charges a 15% commission on all bookings. Payments must be made through the platform. Direct payments outside CoachSet violate these terms and may result in account termination.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">5. Cancellations & Refunds</h3>
          <p className="text-slate-400">Clients may cancel within 24 hours of booking for a full refund. After 24 hours, refunds are at the trainer's discretion. CoachSet fees are non-refundable.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">6. Liability</h3>
          <p className="text-slate-400">CoachSet is a marketplace connecting trainers and clients. We are not liable for injuries, damages, or disputes arising from training sessions. Clients train at their own risk.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">7. Account Termination</h3>
          <p className="text-slate-400">We may suspend or terminate accounts for fraud, harassment, sharing contact info outside the platform, or violating these terms.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">8. Contact</h3>
          <p className="text-slate-400">For questions, contact owner@coachset.pk</p>
        </div>
      </PageContainer>
    </PageShell>
  );
}
