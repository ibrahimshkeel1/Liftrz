import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, MessageCircle, Search, ShieldCheck, Star, Wallet } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

const steps = [
  {
    number: '01',
    title: 'Browse verified trainers',
    description: 'Filter by city, goal, budget, and gender. Every trainer on Liftrz is identity-verified with CNIC and certifications reviewed before approval.',
    icon: Search
  },
  {
    number: '02',
    title: 'Compare and shortlist',
    description: 'View detailed profiles with pricing, reviews, specialties, and training modes. Save your favorites and compare up to 3 trainers side-by-side.',
    icon: Star
  },
  {
    number: '03',
    title: 'Send a free inquiry',
    description: 'Tell the trainer about your goals with no upfront payment. Include your preferred package, schedule, and any buddy training requests.',
    icon: MessageCircle
  },
  {
    number: '04',
    title: 'Secure payment',
    description: 'Once you are ready to book, submit payment proof via bank transfer, JazzCash, or EasyPaisa. Your payment is held securely until admin verifies the receipt.',
    icon: Wallet
  },
  {
    number: '05',
    title: 'Unlock direct contact',
    description: 'After payment verification, the trainer\'s WhatsApp and phone unlock automatically. Chat through Liftrz or switch to direct contact.',
    icon: LockKeyhole
  },
  {
    number: '06',
    title: 'Start training',
    description: 'Begin your sessions. Track progress, log weight, and communicate with your trainer. Liftrz monitors chats for safety and dispute resolution.',
    icon: CheckCircle2
  }
];

export default function HowItWorks() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="How It Works | Liftrz Pakistan"
          description="A simple 6-step guide to finding, booking, and training with verified personal trainers in Pakistan through Liftrz."
          canonical="https://liftrz.com/how-it-works"
        />

        <HeroBlock
          kicker="Simple process"
          title="How Liftrz works"
          description="From browsing to your first session in 6 simple steps. No guesswork, no hidden fees."
          actions={
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Find trainers <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <Surface key={step.number} className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{step.number}</div>
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{step.description}</p>
            </Surface>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-700/50 bg-surface p-6 md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-bold text-white">What to expect in your first session</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Assessment of current fitness level and mobility</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Goal setting and timeline discussion</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Sample workout to gauge intensity preference</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Nutrition guidance based on Pakistani diet</li>
              </ul>
            </div>
            <Link to="/quiz" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
              Take the quiz <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/50 bg-surface p-6 md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-bold text-white">How payment works</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> No payment required to send an inquiry</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Pay via bank transfer, JazzCash, or EasyPaisa</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Upload receipt screenshot to Liftrz</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Admin verifies within 24 hours</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Trainer contact unlocks automatically after verification</li>
              </ul>
            </div>
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Browse trainers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/50 bg-surface p-6 md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-xl font-bold text-white">What if I don't like my trainer?</h2>
              <p className="mt-2 text-sm text-slate-400">Your first session is your evaluation period. If things don't click, you can open a dispute from your dashboard within 7 days. Liftrz reviews each case and offers resolution options including trainer replacement where possible.</p>
            </div>
            <Link to="/faq" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
              Read FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
