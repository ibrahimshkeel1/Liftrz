import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import SEO from '../components/SEO';
import { api } from '../utils/api';
import { SkeletonCard } from '../components/Skeleton';
import { HeroBlock, PageContainer, PageShell } from '../components/premium';

const toNumber = (value: number | string | undefined) => Number(String(value || 0).replace(/,/g, ''));
const toSessionPrice = (trainer: any) => toNumber(trainer.sessionPrice ?? trainer.price);
const toMonthlyEstimate = (trainer: any) => toNumber(trainer.monthlyPrice ?? trainer.monthlyPackagePrice) || Math.round(toSessionPrice(trainer) * 12);

export default function Compare() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getTrainers().then((data) => {
      setTrainers(data);
      setLoading(false);
    });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compared = trainers.filter((t) => selected.includes(t.id));
  const filtered = trainers.filter((t) =>
    `${t.name} ${t.specialty} ${t.city}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <PageShell><PageContainer><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div></PageContainer></PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <SEO title="Compare Trainers | Liftrz Pakistan" description="Compare up to 3 verified personal trainers side by side." />

        <HeroBlock
          kicker="Compare"
          title="Side-by-side comparison"
          description="Select up to 3 trainers and compare their pricing, ratings, specialties, and availability."
        />

        {compared.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="py-3 pr-4 text-xs font-medium uppercase tracking-widest text-slate-500">Feature</th>
                  {compared.map((t) => (
                    <th key={t.id} className="py-3 px-4 text-white">
                      <div className="text-base font-bold">{t.name}</div>
                      <div className="text-xs font-normal text-slate-400">{t.specialty}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Price / session</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">PKR {toSessionPrice(t).toLocaleString()}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Monthly estimate</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4 font-semibold text-primary">~PKR {toMonthlyEstimate(t).toLocaleString()}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Rating</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.rating} / 5</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">City</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.city}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Gender</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.gender}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Modes</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.serviceModes?.join(', ')}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Goals</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.goals?.join(', ')}</td>)}
                </tr>
                <tr className="border-b border-slate-700/30">
                  <td className="py-3 pr-4 text-slate-400">Bookings completed</td>
                  {compared.map((t) => <td key={t.id} className="py-3 px-4">{t.completedBookings || 0}</td>)}
                </tr>
                <tr>
                  <td className="py-3 pr-4"></td>
                  {compared.map((t) => (
                    <td key={t.id} className="py-3 px-4">
                      <Link to={`/trainer/${t.slug || t.id}`} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark">View Profile</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8">
          <p className="text-sm text-slate-400">Select up to 3 trainers to compare:</p>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, specialty, or city..."
              className="w-full rounded-xl border border-slate-700/50 bg-surface-high py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => {
              const isSelected = selected.includes(t.id);
              const disabled = !isSelected && selected.length >= 3;
              return (
                <button
                  key={t.id}
                  disabled={disabled}
                  onClick={() => toggle(t.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : disabled ? 'border-slate-800 opacity-40' : 'border-slate-700/50 hover:border-slate-600'}`}
                >
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.specialty} - {t.city}</p>
                  </div>
                  {isSelected ? <Check className="h-5 w-5 text-primary" /> : <div className="h-5 w-5 rounded-full border border-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
