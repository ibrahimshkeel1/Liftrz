import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';

export default function About() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="About Us | CoachSet Pakistan"
          description="CoachSet is Pakistan's verified personal trainer marketplace. Learn about our mission, how we verify trainers, and why we started."
          canonical="https://coachset-pakistan.vercel.app/about"
        />

        <HeroBlock
          kicker="Our story"
          title="Building trust in Pakistan fitness"
          description="CoachSet was created to solve a simple problem: finding a reliable personal trainer in Pakistan is harder than it should be."
        />

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <Surface className="p-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">Verified trainers</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">Every trainer on CoachSet submits CNIC and certifications. We review each application before they go live.</p>
          </Surface>
          <Surface className="p-6">
            <Star className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">Real reviews</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">Reviews are tied to actual bookings. No fake public reviews. What you see is what you get.</p>
          </Surface>
          <Surface className="p-6">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">Transparent pricing</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">Compare PKR pricing upfront. No hidden fees. No awkward negotiations after you have already committed.</p>
          </Surface>
        </section>

        <section className="mt-12">
          <SectionTitle
            title="Why we started CoachSet"
            description="The fitness industry in Pakistan is fragmented. Great trainers struggle to find clients. Clients struggle to find great trainers. CoachSet bridges that gap with verification, transparency, and protection for both sides."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-slate-400">Trainers are identity-verified before they can accept bookings</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-slate-400">Payments are tracked and verified before contact unlocks</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-slate-400">All communication stays inside the platform for safety</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-slate-400">Commission-only model: trainers pay nothing until they earn</p>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-700/50 bg-surface p-8 md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="editorial-header text-3xl font-bold text-white">Ready to find your trainer?</h2>
              <p className="mt-3 text-slate-400">Browse verified trainers in Lahore, Karachi, Islamabad and across Pakistan.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                Find trainers <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register/trainer" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
                Join as trainer
              </Link>
            </div>
          </div>
        </section>
      </PageContainer>
    </PageShell>
  );
}
