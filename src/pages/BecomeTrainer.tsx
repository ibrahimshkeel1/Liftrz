import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Banknote, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function BecomeTrainer() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Become a Personal Trainer on CoachSet Pakistan"
          description="Register as a verified personal trainer in Pakistan. Submit CNIC, certifications, packages, pricing and payout details for CoachSet approval."
          canonical="https://coachset-pakistan.vercel.app/become-trainer"
        />

        <HeroBlock
          kicker="Trainer onboarding"
          title="Sell coaching packages with verified trust."
          description="CoachSet gives Pakistan-based trainers a profile, paid booking flow, review system, client pipeline, commission ledger and payout tracking."
          actions={<Link to="/register/trainer" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">Start trainer application <ArrowRight className="h-4 w-4" /></Link>}
          aside={
            <Surface className="grid gap-4 p-6">
              <Step icon={ShieldCheck} title="Verify identity" text="Submit CNIC, phone, city, certifications and transformation consent." />
              <Step icon={Banknote} title="Set packages" text="Add session pricing, 8-week or 12-week protocols and payout account details." />
              <Step icon={BadgeCheck} title="Go live after approval" text="Admin approves your profile before clients can book you publicly." />
            </Surface>
          }
        />
      </PageContainer>
    </PageShell>
  );
}

function Step({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-5">
      <Icon className="h-6 w-6 text-primary" />
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}
