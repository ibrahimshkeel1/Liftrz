import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Trophy, UserCheck } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';
import { api } from '../utils/api';

interface Transformation {
  id: string;
  title: string;
  description: string;
  duration: string;
  beforeImage?: string;
  afterImage?: string;
  result?: string;
  testimonial?: string;
  clientName?: string;
}

interface TrainerWithTransformations {
  id: string;
  name: string;
  transformations: Transformation[];
}

export default function Transformations() {
  const [trainers, setTrainers] = useState<TrainerWithTransformations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrainers()
      .then((data: any[]) => {
        const withTransformations = data
          .map((t) => ({
            id: t.id,
            name: t.name,
            transformations: (t.transformations || []).filter((tr: Transformation) => tr.beforeImage || tr.afterImage || tr.result)
          }))
          .filter((t) => t.transformations.length > 0);
        setTrainers(withTransformations);
      })
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false));
  }, []);

  const allTransformations = trainers.flatMap((t) =>
    t.transformations.map((tr) => ({ ...tr, trainerId: t.id, trainerName: t.name }))
  );

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Client Transformations | Before & After | CoachSet Pakistan"
          description="Real results from verified personal trainers in Pakistan. See transformations, read testimonials, and find your coach."
          canonical="https://coachset-pakistan.vercel.app/transformations"
        />

        <HeroBlock
          kicker="Real results"
          title="Client transformations"
          description="Verified before-and-after results from trainers on CoachSet. Every transformation is tied to a real booking with client consent."
          actions={
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Find your trainer <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-surface" />
            <div className="h-64 animate-pulse rounded-2xl bg-surface" />
          </div>
        ) : allTransformations.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-700/50 bg-surface p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-4 text-xl font-semibold text-white">No transformations yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Transformations appear here when trainers upload verified before-and-after photos with client consent.
              We do not display stock photos or unverified claims.
            </p>
            <Link to="/discover" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Browse trainers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {allTransformations.map((t) => (
              <Surface key={t.id} className="overflow-hidden p-0">
                <div className="bg-surface-high p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{t.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">{t.description}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-700/30">
                  <div className="bg-surface p-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Before</p>
                    {t.beforeImage ? (
                      <img src={t.beforeImage} alt="Before" className="mt-2 h-24 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="mt-2 flex h-24 items-center justify-center rounded-xl bg-surface-high">
                        <span className="text-sm font-bold text-slate-600">Photo coming soon</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface p-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-primary">After</p>
                    {t.afterImage ? (
                      <img src={t.afterImage} alt="After" className="mt-2 h-24 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="mt-2 flex h-24 items-center justify-center rounded-xl bg-surface-high">
                        <span className="text-sm font-bold text-primary">{t.result || 'In progress'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {t.testimonial && <blockquote className="text-sm italic text-slate-300">&ldquo;{t.testimonial}&rdquo;</blockquote>}
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    {t.clientName && <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> {t.clientName}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t.duration}</span>
                  </div>
                  <Link to={`/trainer/${t.trainerId}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    Trainer: {t.trainerName} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}
