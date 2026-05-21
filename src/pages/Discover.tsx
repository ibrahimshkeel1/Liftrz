import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Heart, MapPin, MessageCircle, Search, ShieldCheck, SlidersHorizontal, Star, UserRoundCheck, Video } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { SkeletonCard, SkeletonHero } from '../components/Skeleton';
import { HeroBlock, InfoPill, PageContainer, PageShell, Surface } from '../components/premium';
import { MotionCard, Reveal } from '../components/Motion';
import { toggleFavorite } from '../utils/favorites';
import { matchesCity, matchesGender, matchesMode, matchesSearch, matchesSpecialty, normalizeSpecialtyFilter, toMonthlyEstimate, toSessionPrice } from '../utils/trainerMatching';

const cities = ['All', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Online'];
const modes = ['All', 'Gym', 'Home Visit', 'Online', 'Studio'];
const genders = ['All', 'Male', 'Female'];
const specialties = ['All', 'Strength', 'Fat loss', 'Rehab', 'Yoga', 'Athletic Performance', 'Muscle gain', 'Online coaching', 'Wedding Prep'];
const sortOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Highest rating', value: 'rating' },
  { label: 'Most bookings', value: 'completed' },
  { label: 'Lowest price', value: 'price_low' },
  { label: 'Fastest response', value: 'response' }
];

const minBudget = 1000;
const maxBudget = 100000;
const optionFromParam = (value: string | null, options: string[], fallback = 'All') => {
  if (!value) return fallback;
  return options.find((option) => option.toLowerCase() === value.toLowerCase()) || fallback;
};
const specialtyFromParam = (value: string | null) => optionFromParam(normalizeSpecialtyFilter(value || 'All'), specialties);
const budgetFromParam = (value: string | null) => {
  const parsed = Number(value || maxBudget);
  if (!Number.isFinite(parsed)) return maxBudget;
  return Math.min(maxBudget, Math.max(minBudget, parsed));
};

export default function Discover() {
  const [searchParams] = useSearchParams();
  const searchParamString = searchParams.toString();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(optionFromParam(searchParams.get('city'), cities));
  const [mode, setMode] = useState(optionFromParam(searchParams.get('mode'), modes));
  const [gender, setGender] = useState(optionFromParam(searchParams.get('gender'), genders));
  const [specialty, setSpecialty] = useState(specialtyFromParam(searchParams.get('specialty')));
  const [maxPrice, setMaxPrice] = useState(budgetFromParam(searchParams.get('maxPrice')));
  const [sort, setSort] = useState('recommended');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasTransformations, setHasTransformations] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [packagesApproved, setPackagesApproved] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [matchForm, setMatchForm] = useState({
    name: '',
    phone: '',
    city: optionFromParam(searchParams.get('city'), cities.filter((item) => item !== 'All'), 'Lahore'),
    goal: specialtyFromParam(searchParams.get('specialty')) === 'All' ? 'Fat loss' : specialtyFromParam(searchParams.get('specialty')),
    budget: String(budgetFromParam(searchParams.get('maxPrice'))),
    message: ''
  });
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setFavorites(JSON.parse(window.localStorage.getItem('Liftrz-favorites') || '[]'));
  }, []);

  useEffect(() => {
    api.getTrainers()
      .then(setTrainers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trainers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const nextCity = optionFromParam(searchParams.get('city'), cities);
    const nextSpecialty = specialtyFromParam(searchParams.get('specialty'));
    const nextBudget = budgetFromParam(searchParams.get('maxPrice'));
    setQuery(searchParams.get('q') || '');
    setCity(nextCity);
    setMode(optionFromParam(searchParams.get('mode'), modes));
    setGender(optionFromParam(searchParams.get('gender'), genders));
    setSpecialty(nextSpecialty);
    setMaxPrice(nextBudget);
    setMatchForm((current) => ({
      ...current,
      city: nextCity === 'All' ? current.city : nextCity,
      goal: nextSpecialty === 'All' ? current.goal : nextSpecialty,
      budget: String(nextBudget)
    }));
  }, [searchParamString]);

  useEffect(() => {
    api.trackEvent({
      type: 'discover_search',
      path: '/discover',
      city,
      goal: specialty,
      metadata: { query: deferredQuery, mode, gender, maxPrice, sort }
    }).catch(() => {});
  }, [deferredQuery, city, mode, gender, specialty, maxPrice, sort]);

  const filtered = useMemo(() => {
    const ranked = trainers
      .filter((trainer) => {
        const monthlyPrice = toMonthlyEstimate(trainer);
        return (
          matchesSearch(trainer, deferredQuery) &&
          matchesCity(trainer, city) &&
          matchesMode(trainer, mode) &&
          matchesGender(trainer, gender) &&
          matchesSpecialty(trainer, specialty) &&
          monthlyPrice <= maxPrice &&
          (!verifiedOnly || trainer.verificationStatus === 'approved') &&
          (!hasTransformations || trainer.transformationImages?.length > 0 || trainer.transformations?.length > 0) &&
          (!availableNow || Number(trainer.capacity || 0) - Number(trainer.activeClients || 0) > 0) &&
          (!packagesApproved || trainer.packagesStatus === 'approved')
        );
      })
      .map((trainer) => {
        const score =
          (trainer.featuredStatus === 'approved' || trainer.featuredManual ? 1000 : 0) +
          Number(trainer.rating || 0) * 20 +
          Number(trainer.completedBookings || 0) +
          Number(trainer.profileCompleteness || 0) +
          (trainer.verificationStatus === 'approved' ? 50 : 0) -
          Number(trainer.responseTimeHours || 0) * 2;
        return { ...trainer, trustScore: Math.round(score) };
      });

    return ranked.sort((a, b) => {
      if (sort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
      if (sort === 'completed') return Number(b.completedBookings || 0) - Number(a.completedBookings || 0);
      if (sort === 'price_low') return toMonthlyEstimate(a) - toMonthlyEstimate(b);
      if (sort === 'response') return Number(a.responseTimeHours || 999) - Number(b.responseTimeHours || 999);
      return Number(b.trustScore || 0) - Number(a.trustScore || 0);
    });
  }, [trainers, deferredQuery, city, mode, gender, specialty, maxPrice, sort, verifiedOnly, hasTransformations, availableNow, packagesApproved]);

  const comparedTrainers = compare.map((id) => trainers.find((trainer) => trainer.id === id)).filter(Boolean);
  const budgetPercent = Math.min(100, Math.max(0, ((maxPrice - minBudget) / (maxBudget - minBudget)) * 100));

  const resetFilters = () => {
    setQuery('');
    setCity('All');
    setMode('All');
    setGender('All');
    setSpecialty('All');
    setMaxPrice(maxBudget);
    setSort('recommended');
    setVerifiedOnly(false);
    setHasTransformations(false);
    setAvailableNow(false);
    setPackagesApproved(false);
    setCompare([]);
  };

  const toggleCompare = (id: string) => {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length >= 3 ? current : [...current, id];
    });
  };

  const submitMatchRequest = async (event: FormEvent) => {
    event.preventDefault();
    setMatchStatus('loading');
    try {
      await api.createMatchRequest({
        clientName: matchForm.name,
        clientPhone: matchForm.phone,
        city: matchForm.city,
        goal: matchForm.goal,
        budget: `PKR ${Number(matchForm.budget || 0).toLocaleString()}/mo`,
        mode,
        genderPreference: gender,
        message: matchForm.message,
        source: 'discover_empty_state'
      });
      setMatchStatus('success');
    } catch {
      setMatchStatus('idle');
    }
  };

  if (loading) {
    return (
      <PageShell>
        <PageContainer>
          <SkeletonHero />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  if (error) {
    return <div className="px-6 py-20 text-center text-red-400">{error}</div>;
  }

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Find Personal Trainers in Pakistan | Liftrz Discover"
          description="Search verified personal trainers in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Gujranwala and Sialkot by specialty, price, rating, gender, response time and training mode."
          canonical="https://liftrz.com/discover"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Verified personal trainers in Pakistan',
            itemListElement: filtered.slice(0, 10).map((trainer, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: trainer.name,
              url: `https://liftrz.com/trainer/${trainer.slug || trainer.id}`
            }))
          }}
        />

        <HeroBlock
          kicker="Find your trainer"
          title="Browse verified trainers"
          description="Every trainer is identity-verified. See real reviews, transformation photos, and pricing before you reach out."
        />

        {/* Gender toggle - front and center */}
        <div className="mt-8 flex flex-wrap gap-2">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                gender === g
                  ? 'bg-primary text-white'
                  : 'border border-slate-700/50 bg-surface-high/50 text-slate-300 hover:bg-surface-high'
              }`}
            >
              {g === 'All' ? 'All Trainers' : `${g} Trainers`}
            </button>
          ))}
        </div>

        <Reveal className="mt-6">
        <Surface className="p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-surface-high/50 px-4 py-3">
              <Search className="h-5 w-5 text-primary" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, specialty, or area" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </div>
            <FilterSelect label="Sort by" value={sort} onChange={setSort} options={sortOptions.map((option) => option.value)} labels={Object.fromEntries(sortOptions.map((option) => [option.value, option.label]))} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect label="City" value={city} onChange={setCity} options={cities} />
            <FilterSelect label="Mode" value={mode} onChange={setMode} options={modes} />
            <FilterSelect label="Specialty" value={specialty} onChange={setSpecialty} options={specialties} />
            <label className="rounded-xl border border-slate-700/50 bg-surface-high/50 px-4 py-3 xl:col-span-2">
              <span className="text-xs font-medium text-slate-500">Budget: PKR {maxPrice.toLocaleString()}/mo</span>
              <div className="relative mt-3 h-5">
                <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-700/50" />
                <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary" style={{ width: `${budgetPercent}%` }} />
                <div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary" style={{ left: `calc(${budgetPercent}% - 0.5rem)` }} />
                <input type="range" min={minBudget} max={maxBudget} step="1000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </div>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ToggleFilter label="Verified only" active={verifiedOnly} onClick={() => setVerifiedOnly((value) => !value)} />
            <ToggleFilter label="Has transformations" active={hasTransformations} onClick={() => setHasTransformations((value) => !value)} />
            <ToggleFilter label="Available now" active={availableNow} onClick={() => setAvailableNow((value) => !value)} />
            <ToggleFilter label="Packages approved" active={packagesApproved} onClick={() => setPackagesApproved((value) => !value)} />
          </div>
        </Surface>
        </Reveal>

        {comparedTrainers.length > 0 && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Compare selected trainers</h2>
              <button onClick={() => setCompare([])} className="text-xs font-semibold text-slate-400 hover:text-white">Clear</button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {comparedTrainers.map((trainer: any) => (
                <div key={trainer.id} className="rounded-xl bg-surface p-4">
                  <h3 className="font-semibold text-white">{trainer.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{trainer.city} - {trainer.specialty}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
                    <span>~PKR {toMonthlyEstimate(trainer).toLocaleString()}/mo</span>
                    <span>{trainer.rating ? `${trainer.rating} rating` : 'No reviews'}</span>
                    <span>{trainer.completedBookings ? `${trainer.completedBookings} done` : 'New trainer'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <InfoPill><SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-primary" /> {filtered.length} trainers found</InfoPill>
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((trainer) => {
            const availableSlots = Math.max(Number(trainer.capacity || 0) - Number(trainer.activeClients || 0), 0);
            const selected = compare.includes(trainer.id);
            const compareDisabled = compare.length >= 3 && !selected;
            const hasVideo = trainer.videoUrl;
            const isAvailable = availableSlots > 0;
            const sessionPrice = toSessionPrice(trainer);
            const monthlyEstimate = toMonthlyEstimate(trainer);

            return (
              <div key={trainer.id}>
              <MotionCard>
              <article className="group overflow-hidden rounded-2xl border border-slate-700/50 bg-surface transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div
                  className="relative aspect-square overflow-hidden bg-surface-high bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: trainer.image ? `url(${trainer.image})` : undefined }}
                  aria-label={`${trainer.name} personal trainer in ${trainer.city}`}
                >
                  {!trainer.image && (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary/30">
                      {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      {trainer.gender === 'Female' ? 'Female' : 'Male'}
                    </span>
                    {hasVideo && (
                      <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    )}
                    {(trainer.featuredStatus === 'approved' || trainer.featuredManual) && (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        Featured
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nowFav = toggleFavorite(trainer.id);
                      setFavorites((prev) => nowFav ? [...prev, trainer.id] : prev.filter((id) => id !== trainer.id));
                    }}
                    className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm transition-colors hover:bg-primary"
                    aria-label="Save trainer"
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(trainer.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    type="button"
                    disabled={compareDisabled}
                    onClick={() => toggleCompare(trainer.id)}
                    className={`absolute right-3 top-[3.2rem] rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${selected ? 'bg-primary text-white' : 'bg-black/70 text-white backdrop-blur-sm hover:bg-primary'} disabled:opacity-40`}
                  >
                    {selected ? 'Selected' : 'Compare'}
                  </button>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                    <span className={`h-2 w-2 rounded-full ${trainer.responseTimeHours && trainer.responseTimeHours <= 4 ? 'bg-success' : 'bg-yellow-400'}`} />
                    <span className="text-[10px] font-semibold text-white">{trainer.responseTimeHours ? `Responds in ${trainer.responseTimeHours}h` : 'Recently active'}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">{trainer.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-400">{trainer.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">PKR {sessionPrice.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">per session</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">~PKR {monthlyEstimate.toLocaleString()}/mo</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {trainer.goals?.slice(0, 3).map((goal: string) => (
                      <span key={goal} className="rounded-md bg-surface-high px-2 py-0.5 text-[11px] font-medium text-slate-300">{goal}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {trainer.rating || 'New'}</span>
                    <span className="flex items-center gap-1"><UserRoundCheck className="h-3.5 w-3.5 text-slate-500" /> {trainer.completedBookings ? `${trainer.completedBookings} trained` : 'New trainer'}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {trainer.area ? `${trainer.area}, ${trainer.city}` : trainer.city}
                    <span className="mx-1">-</span>
                    {trainer.serviceModes?.join(', ')}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{trainer.bio}</p>

                  <Link
                    to={`/trainer/${trainer.slug || trainer.id}`}
                    onClick={() => api.trackEvent({ type: 'profile_click', trainerId: trainer.id, source: 'discover_card', city: trainer.city, goal: trainer.specialty }).catch(() => {})}
                    className="mt-5 flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    View Profile
                  </Link>
                </div>
              </article>
              </MotionCard>
              </div>
            );
          })}
        </section>

        {filtered.length === 0 && trainers.length === 0 && (
          <div className="mt-8">
            <ManualMatchBox form={matchForm} status={matchStatus} onChange={setMatchForm} onSubmit={submitMatchRequest} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register/trainer" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                Apply as trainer
              </Link>
              <button onClick={resetFilters} className="rounded-xl border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high">
                Reset filters
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && trainers.length > 0 && (
          <div className="mt-8">
            <ManualMatchBox form={matchForm} status={matchStatus} onChange={setMatchForm} onSubmit={submitMatchRequest} title="No exact matches" description="Share your city, goal and WhatsApp. Liftrz can manually match you with nearby or online trainers." />
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {trainers.slice(0, 3).map((trainer) => (
                <div key={trainer.id}>
                <MotionCard>
                <article className="group overflow-hidden rounded-2xl border border-slate-700/50 bg-surface transition-all hover:border-primary/30">
                  <div
                    className="relative aspect-square overflow-hidden bg-surface-high bg-cover bg-center"
                    style={{ backgroundImage: trainer.image ? `url(${trainer.image})` : undefined }}
                  >
                    {!trainer.image && (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary/30">
                        {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-white">Alternative</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-white">{trainer.name}</h2>
                    <p className="mt-0.5 text-sm text-slate-400">{trainer.specialty} - {trainer.city}</p>
                    <Link to={`/trainer/${trainer.id}`} className="mt-4 flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">View Profile</Link>
                  </div>
                </article>
                </MotionCard>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button onClick={resetFilters} className="rounded-xl border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high">
                Reset all filters
              </button>
            </div>
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}

function FilterSelect({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <label className="relative rounded-xl border border-slate-700/50 bg-surface-high/50 px-4 py-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full appearance-none bg-transparent pr-6 text-sm font-semibold text-white outline-none">
        {options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-4 w-4 text-slate-500" />
    </label>
  );
}

function ToggleFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-4 py-2 text-xs font-semibold ${active ? 'bg-primary text-white' : 'border border-slate-700/50 bg-surface-high/50 text-slate-300 hover:bg-surface-high'}`}>
      {label}
    </button>
  );
}

function ManualMatchBox({
  form,
  status,
  onChange,
  onSubmit,
  title = 'No trainers yet',
  description = 'Tell us what you need. We will match you manually while verified trainers are being onboarded.'
}: {
  form: { name: string; phone: string; city: string; goal: string; budget: string; message: string };
  status: 'idle' | 'loading' | 'success';
  onChange: (form: { name: string; phone: string; city: string; goal: string; budget: string; message: string }) => void;
  onSubmit: (event: FormEvent) => void;
  title?: string;
  description?: string;
}) {
  if (status === 'success') {
    return (
      <Surface className="p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-4 text-2xl font-bold text-white">Match request received</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">Liftrz has your city, goal and WhatsApp. We will use this to shortlist nearby or online trainers.</p>
      </Surface>
    );
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
          <div className="mt-5 grid gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Verified trainers only</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> City, budget and goal matched</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <input required value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
          <input required value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="WhatsApp number" className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
          <select value={form.city} onChange={(e) => onChange({ ...form, city: e.target.value })} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none">
            {cities.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={form.goal} onChange={(e) => onChange({ ...form, goal: e.target.value })} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none">
            {specialties.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
          </select>
          <input required value={form.budget} onChange={(e) => onChange({ ...form, budget: e.target.value })} placeholder="Monthly budget PKR" className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 md:col-span-2" />
          <textarea value={form.message} onChange={(e) => onChange({ ...form, message: e.target.value })} rows={3} placeholder="Any preference? Female trainer, home visit, evening schedule..." className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 md:col-span-2" />
          <button disabled={status === 'loading'} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60 md:col-span-2">
            {status === 'loading' ? 'Sending...' : 'Get manually matched'}
          </button>
        </form>
      </div>
    </Surface>
  );
}
