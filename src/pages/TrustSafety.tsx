import { CheckCircle2, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';

const items = [
  { icon: ShieldCheck, title: 'CNIC verification', text: 'Trainers submit CNIC details and card pictures before their profile can be approved.' },
  { icon: CheckCircle2, title: 'Admin approval', text: 'Packages, certificates, gallery photos and transformations are reviewed before they appear publicly.' },
  { icon: WalletCards, title: 'Payment protection', text: 'Clients upload payment proof inside Liftrz. Admin verifies it before booking contact unlocks.' },
  { icon: LockKeyhole, title: 'Contact unlock', text: 'Trainer phone and WhatsApp stay protected until payment verification keeps the booking traceable.' }
];

export default function TrustSafety() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Trust and Safety | Liftrz Pakistan"
          description="How Liftrz verifies trainers, reviews proof, protects payments and handles first-session disputes."
          canonical="https://liftrz.com/trust-safety"
        />
        <HeroBlock
          kicker="Trust and safety"
          title="How Liftrz keeps trainer bookings safer."
          description="Liftrz combines trainer verification, admin-reviewed profile proof, payment tracking and contact protection so clients can compare coaches with more confidence."
        />
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Surface key={item.title} className="p-6">
                <Icon className="h-8 w-8 text-primary" />
                <h2 className="mt-5 text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </Surface>
            );
          })}
        </section>
        <section className="mt-10">
          <SectionTitle title="Dispute process" description="If the first session has an issue, clients can raise it from their dashboard while the booking record, payment proof and messages remain visible to admin." />
        </section>
      </PageContainer>
    </PageShell>
  );
}
