import { useState } from 'react';
import { Activity, ArrowRight, Dumbbell, Flame, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { HeroBlock, InfoPill, MetricCard, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';

const objectives = [
  {
    id: 'muscle',
    title: 'Muscle gain',
    description: 'Build size, improve recovery, and progress through measurable hypertrophy blocks.',
    icon: Dumbbell
  },
  {
    id: 'fat',
    title: 'Fat loss',
    description: 'Reduce body fat with a coach who can manage adherence, cardio, food targets and check-ins.',
    icon: Flame
  },
  {
    id: 'athletic',
    title: 'Athletic performance',
    description: 'Improve speed, explosiveness and conditioning with programming built around output.',
    icon: Zap
  },
  {
    id: 'rehab',
    title: 'Rehab',
    description: 'Find trainers who focus on mobility, joint tolerance and safe return-to-training progressions.',
    icon: Activity
  }
];

export default function Onboarding() {
  const [selected, setSelected] = useState<(typeof objectives)[number] | null>(null);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Client Onboarding | Liftrz Pakistan"
          description="Choose your main fitness objective before browsing verified personal trainers in Pakistan on Liftrz."
          canonical="https://liftrz.vercel.app/onboarding"
        />

        <HeroBlock
          kicker="Client onboarding"
          title="Choose the result you want first."
          description="Discovery works better when the goal is clear. Start with one outcome, then compare verified trainers by city, price, rating and service mode."
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Step 1 of 2</p>
              <div className="mt-5 grid gap-3">
                <MetricCard label="Completion" value="50%" active />
                <MetricCard label="Next" value="Match trainers" />
                <MetricCard label="Selection" value={selected?.title || 'Choose one'} />
              </div>
            </Surface>
          }
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <InfoPill><Sparkles className="mr-2 h-3.5 w-3.5 text-primary" /> Start with one primary objective</InfoPill>
          <InfoPill>Pakistani pricing shown in PKR</InfoPill>
          <InfoPill>Verified trainers only</InfoPill>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <SectionTitle title="What is your main goal?" description="Pick the objective that matters most right now. You can still filter further once you enter discovery." />
            <div className="grid gap-4 md:grid-cols-2">
              {objectives.map((objective) => {
                const Icon = objective.icon;
                const active = selected?.id === objective.id;

                return (
                  <button
                    key={objective.id}
                    type="button"
                    onClick={() => setSelected(objective)}
                    className={`rounded-2xl border p-6 text-left transition ${active ? 'border-primary bg-primary text-white' : 'border-slate-700/50 bg-surface text-white hover:border-primary/40 hover:bg-surface-high/90'}`}
                  >
                    <Icon className={`h-8 w-8 ${active ? 'text-black' : 'text-primary'}`} />
                    <h2 className="editorial-header mt-6 text-4xl font-bold">{objective.title}</h2>
                    <p className={`mt-4 text-sm leading-7 ${active ? 'text-black/70' : 'text-slate-400'}`}>{objective.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            <Surface className="p-6">
              <SectionTitle title="What happens next" description="After this step, Liftrz takes you straight into the filtered trainer marketplace." />
              <div className="grid gap-4">
                <Step number="01" text="Apply your chosen goal to discovery results." />
                <Step number="02" text="Compare city, price, rating, response time and completed bookings." />
                <Step number="03" text="Book only after payment verification keeps the record clean." />
              </div>
            </Surface>

            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Continue</p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {selected
                  ? `You are about to browse verified trainers for ${selected.title.toLowerCase()}.`
                  : 'Choose a goal to continue into filtered discovery.'}
              </p>
              <Link
                to={selected ? `/discover?specialty=${encodeURIComponent(selected.title)}` : '/discover'}
                className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold ${selected ? 'bg-primary text-white' : 'pointer-events-none border border-slate-700/50 bg-surface-high/80 text-slate-500'}`}
              >
                Continue to discovery <ArrowRight className="h-4 w-4" />
              </Link>
            </Surface>
          </div>
        </section>
      </PageContainer>
    </PageShell>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 p-4">
      <p className="text-xs font-black text-primary">{number}</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}
