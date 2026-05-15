import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';
import { getFavorites, toggleFavorite } from '../utils/favorites';

const toNumber = (value: number | string) => Number(String(value || 0).replace(/,/g, ''));

export default function SavedTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favIds = getFavorites();
    setFavorites(favIds);
    if (favIds.length === 0) {
      setLoading(false);
      return;
    }
    api.getTrainers()
      .then((all) => setTrainers(all.filter((t: any) => favIds.includes(t.id))))
      .finally(() => setLoading(false));
  }, []);

  const remove = (id: string) => {
    toggleFavorite(id);
    setFavorites((prev) => prev.filter((fid) => fid !== id));
    setTrainers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <PageShell>
      <PageContainer>
        <SEO title="Saved Trainers | Liftrz Pakistan" description="Your saved trainers and shortlist." />

        <HeroBlock
          kicker="Shortlist"
          title="Saved trainers"
          description="Trainers you have bookmarked for easy access and comparison."
          actions={
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              <ArrowLeft className="h-4 w-4" /> Browse more
            </Link>
          }
        />

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : trainers.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="No saved trainers" description="Browse trainers and click the heart icon to save them here." />
            <div className="mt-4 text-center">
              <Link to="/discover" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">Find trainers</Link>
            </div>
          </div>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trainers.map((trainer) => (
              <article key={trainer.id} className="group overflow-hidden rounded-2xl border border-slate-700/50 bg-surface transition-all hover:border-primary/30">
                <div className="relative aspect-square overflow-hidden bg-surface-high bg-cover bg-center" style={{ backgroundImage: trainer.image ? `url(${trainer.image})` : undefined }}>
                  {!trainer.image && (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary/30">
                      {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button onClick={() => remove(trainer.id)} className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm transition-colors hover:bg-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">{trainer.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-400">{trainer.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">PKR {Math.round(toNumber(trainer.price) * 12).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">per month</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.goals?.slice(0, 3).map((goal: string) => (
                      <span key={goal} className="rounded-md bg-surface-high px-2 py-0.5 text-[11px] font-medium text-slate-300">{goal}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {trainer.rating}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {trainer.city}</span>
                  </div>
                  <Link to={`/trainer/${trainer.id}`} className="mt-5 flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                    View Profile
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </PageContainer>
    </PageShell>
  );
}
