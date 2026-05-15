import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Share2, Users } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function Refer() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Refer & Earn | Liftrz Pakistan"
          description="Invite friends to Liftrz and earn PKR 500 credit for every successful referral."
          canonical="https://liftrz.vercel.app/refer"
        />

        <HeroBlock
          kicker="Refer & earn"
          title="Invite friends, get rewarded"
          description="Share Liftrz with friends who are looking for a trainer. You both get PKR 500 credit when they complete their first booking."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Surface className="p-6 text-center">
            <Share2 className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">1. Share your code</h3>
            <p className="mt-2 text-sm text-slate-400">Find your unique referral code in your account settings after you register.</p>
          </Surface>
          <Surface className="p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">2. Friend signs up</h3>
            <p className="mt-2 text-sm text-slate-400">Your friend creates an account and enters your referral code during registration.</p>
          </Surface>
          <Surface className="p-6 text-center">
            <Gift className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">3. Both get PKR 500</h3>
            <p className="mt-2 text-sm text-slate-400">After their first verified booking, you both receive PKR 500 credit in your Liftrz wallet.</p>
          </Surface>
        </div>

        <Surface className="mt-8 p-6 md:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold text-white">Ready to start earning?</h2>
              <p className="mt-2 text-slate-400">Create your account to get your unique referral code.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register/client" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/discover" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
                Browse trainers
              </Link>
            </div>
          </div>
        </Surface>
      </PageContainer>
    </PageShell>
  );
}
