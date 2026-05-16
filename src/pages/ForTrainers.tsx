import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Globe, LockKeyhole, MessageCircle, Star, Wallet } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

const benefits = [
  {
    icon: BarChart3,
    title: 'Keep 85% of what you earn',
    description: 'Liftrz takes only 15% commission per verified booking. No monthly fees, no listing charges, no upfront costs.'
  },
  {
    icon: Star,
    title: 'Build a verified reputation',
    description: 'Every review is tied to a real booking. No fake reviews means your hard work actually translates into social proof that brings more clients.'
  },
  {
    icon: LockKeyhole,
    title: 'Payment protection',
    description: 'Clients submit payment proof before contact unlocks. You never waste time on inquiries from people who are not serious.'
  },
  {
    icon: MessageCircle,
    title: 'Built-in chat system',
    description: 'Communicate with clients securely through Liftrz. Admin monitors conversations for safety, but your privacy is protected.'
  },
  {
    icon: Wallet,
    title: 'Tracked payouts',
    description: 'See exactly how much you have earned, how much commission was deducted, and when your next payout is scheduled.'
  },
  {
    icon: Globe,
    title: 'Expand beyond your gym',
    description: 'Offer online coaching to clients across Pakistan. Your profile is discoverable by anyone searching for your specialty.'
  }
];

const steps = [
  'Submit your CNIC and certifications',
  'Write a detailed bio and add your specialties',
  'Set your pricing and available training modes',
  'Get approved by Liftrz within 24-48 hours',
  'Start receiving inquiries from verified clients'
];

export default function ForTrainers() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="For Trainers | Join Liftrz Pakistan"
          description="Grow your personal training business with Liftrz. 15% commission, verified reviews, payment protection, and built-in client management."
          canonical="https://liftrz.com/for-trainers"
        />

        <HeroBlock
          kicker="For fitness professionals"
          title="Grow your training business"
          description="Join Pakistan's only verified trainer marketplace. No upfront fees. No fake competition. Just real clients who are ready to pay."
          actions={
            <Link to="/register/trainer" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <Surface key={b.title} className="p-6">
              <b.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-white">{b.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{b.description}</p>
            </Surface>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-700/50 bg-surface p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white">How to get approved</h2>
          <div className="mt-6 space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</div>
                <p className="text-sm text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Surface className="p-6">
            <h3 className="text-lg font-semibold text-white">What we verify</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> CNIC (front and back)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Fitness certification (ACE, NASM, ISSA, or equivalent)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Proof of experience (employment letter, client testimonials, or portfolio)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Profile photo and bio quality</li>
            </ul>
          </Surface>
          <Surface className="p-6">
            <h3 className="text-lg font-semibold text-white">Commission structure</h3>
            <div className="mt-4">
              <p className="text-4xl font-bold text-white">15%</p>
              <p className="mt-1 text-sm text-slate-400">per verified booking</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p>You charge PKR 20,000 for a monthly package.</p>
              <p>Client pays PKR 20,000.</p>
              <p>Liftrz fee: PKR 3,000.</p>
              <p className="font-semibold text-white">You receive: PKR 17,000.</p>
            </div>
          </Surface>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to grow?</h2>
          <p className="mt-2 text-slate-400">Apply in under 10 minutes. Approval typically takes 24-48 hours.</p>
          <Link to="/register/trainer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-white hover:bg-primary-dark">
            Apply to join Liftrz <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageContainer>
    </PageShell>
  );
}
