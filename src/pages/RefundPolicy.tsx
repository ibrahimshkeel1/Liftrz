import { HeroBlock, PageContainer, PageShell } from '../components/premium';

export default function RefundPolicy() {
  return (
    <PageShell>
      <PageContainer>
        <HeroBlock
          kicker="Legal"
          title="Refund & Cancellation Policy"
          description="How refunds and cancellations work on CoachSet"
        />

        <div className="prose prose-invert mt-10 max-w-3xl">
          <h3 className="text-xl font-semibold text-white">1. Client Cancellations</h3>
          <p className="text-slate-400">Clients may cancel a booking within 24 hours for a full refund. After 24 hours, the trainer decides whether to issue a partial refund. CoachSet's 15% commission is non-refundable in all cases.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">2. Trainer No-Shows</h3>
          <p className="text-slate-400">If a trainer fails to show up for a confirmed session, the client receives a full refund including CoachSet fees. The trainer may be penalized or removed from the platform.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">3. Dispute Resolution</h3>
          <p className="text-slate-400">Disputes must be filed within 7 days of the scheduled session. CoachSet admin will review evidence from both parties and issue a decision within 5 business days.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">4. Refund Method</h3>
          <p className="text-slate-400">Refunds are processed to the original payment method. Bank transfers may take 5-7 business days. Mobile wallet refunds (JazzCash, EasyPaisa) typically process within 24 hours.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">5. Package Expiration</h3>
          <p className="text-slate-400">Training packages expire 90 days from purchase if unused. No refunds for expired packages. Extensions may be granted for medical reasons with documentation.</p>
        </div>
      </PageContainer>
    </PageShell>
  );
}
