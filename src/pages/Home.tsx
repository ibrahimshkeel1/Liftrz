import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ChevronDown, Clock, LockKeyhole, MapPin, Search, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react';
import SEO from '../components/SEO';
import { api } from '../utils/api';
import { MotionCard, Reveal } from '../components/Motion';
import { toStartingPrice } from '../utils/trainerMatching';

const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot'];
const goals = ['Lose Weight', 'Build Muscle', 'Wedding Prep', 'Strength', 'Yoga', 'Rehab'];
const minBudget = 5000;
const maxBudget = 100000;

const popularSearches = [
  { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
  { label: 'Female trainer Lahore', href: '/female-personal-trainer-lahore' },
  { label: 'Home trainer Karachi', href: '/home-personal-trainer-karachi' },
  { label: 'Online fitness coach', href: '/online-fitness-coach-pakistan' },
  { label: 'Personal trainer Islamabad', href: '/personal-trainer-islamabad' },
  { label: 'Personal trainer Karachi', href: '/personal-trainer-karachi' }
];

export default function Home() {
  const [city, setCity] = useState('Lahore');
  const [goal, setGoal] = useState('Lose Weight');
  const [budget, setBudget] = useState(maxBudget);
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    api.getFeaturedTrainers()
      .then((data) => setFeatured(data.slice(0, 3)))
      .catch(() => setFeatured([]));
    api.trackEvent({ type: 'page_view', path: '/', source: 'home' }).catch(() => {});
  }, []);

  const budgetPercent = ((budget - minBudget) / (maxBudget - minBudget)) * 100;
  const searchParams = new URLSearchParams({ city, specialty: goal });
  if (budget < maxBudget) searchParams.set('maxPrice', String(budget));
  const searchHref = `/discover?${searchParams.toString()}`;

  return (
    <div className="relative overflow-hidden bg-background">
      <SEO
        title="Liftrz Pakistan | Find Verified Personal Trainers Near You"
        description="Find and book verified personal trainers in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Gujranwala and Sialkot. Compare prices, read real reviews, book a free trial."
        canonical="https://liftrz.com/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Liftrz Pakistan',
          url: 'https://liftrz.com/',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://liftrz.com/discover?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />

      <section className="relative px-5 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <Reveal className="max-w-3xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Pakistan's verified trainer marketplace
              </p>
              <h1 className="editorial-header text-5xl font-bold leading-[0.95] text-white md:text-6xl lg:text-7xl">
                Find a trainer who actually delivers results.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Compare verified personal trainers in your area. See real transformations, read honest reviews, and book a free trial before you commit.
              </p>
            </Reveal>

            {featured.length > 0 ? (
              <div className="grid gap-3">
                {featured.map((trainer, index) => (
                  <div key={trainer.id || trainer.name}>
                    <MotionCard delay={index * 0.06}>
                      <FeaturedProof trainer={trainer} index={index} />
                    </MotionCard>
                  </div>
                ))}
              </div>
            ) : (
              <Reveal delay={0.12}>
                <div className="rounded-2xl border border-slate-700/50 bg-surface p-6 shadow-2xl shadow-black/30">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Verified marketplace</p>
                  <h2 className="mt-4 text-2xl font-bold text-white">No paid featured trainers are live yet.</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">Browse approved trainers in Discover. Featured placements only appear after payment review and admin approval.</p>
                  <Link to="/discover" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                    Browse trainers <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            )}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <MotionCard><TrustCard icon={ShieldCheck} label="Identity verified" /></MotionCard>
            <MotionCard delay={0.06}><TrustCard icon={Star} label="Real client reviews" /></MotionCard>
            <MotionCard delay={0.12}><TrustCard icon={TrendingUp} label="Results tracked" /></MotionCard>
          </div>

          {/* Search Box */}
          <Reveal className="mt-12 overflow-hidden rounded-2xl border border-slate-700/50 bg-surface shadow-2xl shadow-black/40">
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-0 md:divide-x md:divide-slate-700/30">
              <SelectBlock label="City" value={city} onChange={setCity} options={cities} icon={MapPin} />
              <SelectBlock label="Goal" value={goal} onChange={setGoal} options={goals} />
              <BudgetBlock budget={budget} budgetPercent={budgetPercent} onChange={setBudget} />
              <Link
                to={searchHref}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-dark md:h-auto md:rounded-none md:rounded-r-2xl"
              >
                <Search className="h-5 w-5" />
                Find Trainers
              </Link>
            </div>
          </Reveal>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> CNIC-verified trainers</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> Lahore, Karachi, Islamabad & more</span>
            <span className="flex items-center gap-1.5"><LockKeyhole className="h-4 w-4 text-primary" /> Payment-protected bookings</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/quiz" className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
              <Search className="h-4 w-4" /> Find my trainer
            </Link>
            <Link to="/blog" className="inline-flex items-center gap-2 rounded-xl border border-slate-700/50 px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high">
              Read fitness guides
            </Link>
          </div>
        </div>
      </section>

      {/* Popular searches */}
      <section className="border-t border-slate-700/30 px-5 py-14 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="editorial-header text-3xl font-bold text-white md:text-4xl">Search by city and goal</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">Build SEO demand around the way people actually search: city, gender preference, training mode, and goal.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularSearches.map((item) => (
              <div key={item.href}>
                <MotionCard>
                  <Link to={item.href} className="group flex min-h-24 items-end justify-between rounded-2xl border border-slate-700/50 bg-surface p-4 transition-colors hover:border-primary/40">
                    <span className="max-w-[11rem] text-sm font-semibold text-white">{item.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-primary" />
                  </Link>
                </MotionCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust system */}
      <section className="border-t border-slate-700/30 bg-background px-5 py-16 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="editorial-header text-3xl font-bold text-white md:text-4xl">Built for safer trainer bookings</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">Liftrz keeps the first booking traceable: trainers are reviewed before going live, payment proof stays inside the platform, and contact details unlock only after verification.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MotionCard><TrustCard icon={ShieldCheck} label="CNIC and certification review" /></MotionCard>
            <MotionCard delay={0.06}><TrustCard icon={LockKeyhole} label="Contact unlock after payment" /></MotionCard>
            <MotionCard delay={0.12}><TrustCard icon={CalendarCheck} label="Booking-linked reviews" /></MotionCard>
            <MotionCard delay={0.18}><TrustCard icon={Clock} label="Dispute window for first session" /></MotionCard>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-700/30 bg-surface px-5 py-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h2 className="editorial-header text-3xl font-bold text-white md:text-4xl">How Liftrz works</h2>
            <p className="mt-3 text-slate-400">Find, compare, and book in minutes.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <MotionCard><StepCard number="1" title="Search" description="Filter by your city, goal, and budget. Browse verified trainer profiles with real client photos." /></MotionCard>
            <MotionCard delay={0.08}><StepCard number="2" title="Compare" description="Check reviews, transformation photos, certifications, and pricing before reaching out." /></MotionCard>
            <MotionCard delay={0.16}><StepCard number="3" title="Book" description="Send a free inquiry. Chat with the trainer. Book your first session when you're ready." /></MotionCard>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-slate-700/30 px-5 py-16 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="editorial-header text-3xl font-bold text-white">Get fitness tips in your inbox</h2>
          <p className="mt-3 text-slate-400">Weekly guides on finding trainers, Pakistani diet tips, and workout advice. No spam.</p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Thanks for subscribing!'); }} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="rounded-xl border border-slate-700/50 bg-surface-high px-5 py-3 text-white outline-none placeholder:text-slate-600 sm:w-72"
            />
            <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function FeaturedProof({ trainer, index }: { trainer: any; index: number }) {
  const numericPrice = toStartingPrice(trainer);
  const price = numericPrice > 0
    ? `From PKR ${numericPrice.toLocaleString()}`
    : trainer.detail || 'Ask for pricing';
  return (
    <Link
      to={trainer.id ? `/trainer/${trainer.slug || trainer.id}` : '/discover'}
      className="group overflow-hidden rounded-2xl border border-slate-700/50 bg-surface p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-high bg-cover bg-center text-lg font-black text-primary"
          style={{ backgroundImage: trainer.image ? `url(${trainer.image})` : undefined }}
        >
          {!trainer.image && String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {trainer.area ? `${trainer.area}, ${trainer.city}` : trainer.city}
          </div>
          <h3 className="mt-1 truncate font-semibold text-white">{trainer.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">{trainer.specialty}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{price}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {trainer.rating || 'Verified'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function TrustCard({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700/30 bg-surface-high/50 px-4 py-3.5">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
  );
}

function SelectBlock({ label, value, onChange, options, icon: Icon }: { label: string; value: string; onChange: (value: string) => void; options: string[]; icon?: any }) {
  return (
    <label className="relative flex flex-col justify-center gap-1.5 px-2 py-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-6 text-base font-semibold text-white outline-none"
        >
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-2 h-4 w-4 text-slate-500" />
    </label>
  );
}

function BudgetBlock({ budget, budgetPercent, onChange }: { budget: number; budgetPercent: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col justify-center gap-2 px-2 py-2">
      <span className="text-xs font-medium text-slate-500">Budget: PKR {budget.toLocaleString()}/mo</span>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-700/50" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary" style={{ width: `${budgetPercent}%` }} />
        <div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-[0_0_12px_rgba(249,115,22,0.3)]" style={{ left: `calc(${budgetPercent}% - 0.5rem)` }} />
        <input type="range" min={minBudget} max={maxBudget} step="5000" value={budget} onChange={(event) => onChange(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
    </label>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/30 bg-background p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{number}</div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}
