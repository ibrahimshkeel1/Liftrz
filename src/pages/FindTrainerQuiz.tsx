import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, Target, User, Wallet } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, InfoPill, PageContainer, PageShell, Surface } from '../components/premium';

const questions = [
  {
    id: 'gender',
    question: 'Do you prefer a male or female trainer?',
    icon: User,
    options: [
      { label: 'Male trainer', value: 'Male' },
      { label: 'Female trainer', value: 'Female' },
      { label: 'No preference', value: 'All' }
    ]
  },
  {
    id: 'goal',
    question: 'What is your primary fitness goal?',
    icon: Target,
    options: [
      { label: 'Lose weight', value: 'Fat loss' },
      { label: 'Build muscle', value: 'Muscle gain' },
      { label: 'Strength training', value: 'Strength' },
      { label: 'Wedding prep', value: 'Wedding Prep' },
      { label: 'Yoga / Flexibility', value: 'Yoga' },
      { label: 'Rehab / Recovery', value: 'Rehab' }
    ]
  },
  {
    id: 'location',
    question: 'Where do you want to train?',
    icon: MapPin,
    options: [
      { label: 'At home', value: 'Home Visit' },
      { label: 'At the gym', value: 'Gym' },
      { label: 'Online / Virtual', value: 'Online' },
      { label: 'At a studio', value: 'Studio' }
    ]
  },
  {
    id: 'budget',
    question: 'What is your monthly budget?',
    icon: Wallet,
    options: [
      { label: 'Under PKR 15,000', value: '15000' },
      { label: 'PKR 15,000 - 30,000', value: '30000' },
      { label: 'PKR 30,000 - 50,000', value: '50000' },
      { label: 'Over PKR 50,000', value: '100000' }
    ]
  }
];

export default function FindTrainerQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const selectOption = (value: string) => {
    const currentQ = questions[step];
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const getSearchUrl = () => {
    const params = new URLSearchParams();
    if (answers.gender && answers.gender !== 'All') params.set('gender', answers.gender);
    if (answers.goal) params.set('specialty', answers.goal);
    if (answers.location) params.set('mode', answers.location);
    if (answers.budget) params.set('maxPrice', answers.budget);
    return `/discover?${params.toString()}`;
  };

  if (showResults) {
    return (
      <PageShell>
        <PageContainer>
          <SEO
            title="Your Matched Trainers | CoachSet Pakistan"
            description="Based on your quiz answers, we found the best trainers for your goals."
          />
          <div className="mx-auto max-w-2xl text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
            <h1 className="editorial-header mt-6 text-4xl font-bold text-white">We found your matches!</h1>
            <p className="mt-4 text-lg text-slate-400">
              Based on your preferences, here are the best trainers for you.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-700/50 bg-surface p-6 text-left">
              <h3 className="text-lg font-semibold text-white">Your preferences</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <p><strong className="text-white">Trainer gender:</strong> {answers.gender === 'All' ? 'No preference' : answers.gender}</p>
                <p><strong className="text-white">Goal:</strong> {answers.goal}</p>
                <p><strong className="text-white">Location:</strong> {answers.location}</p>
                <p><strong className="text-white">Budget:</strong> Under PKR {Number(answers.budget).toLocaleString()}/mo</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={getSearchUrl()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                View my matched trainers <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => { setStep(0); setAnswers({}); setShowResults(false); }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/50 px-8 py-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high"
              >
                Retake quiz
              </button>
            </div>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  const Icon = currentQuestion.icon;

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Find My Trainer | CoachSet Pakistan"
          description="Answer 4 quick questions and we'll match you with the perfect trainer for your goals."
        />

        <div className="mx-auto max-w-2xl">
          <HeroBlock
            kicker="Quick quiz"
            title="Find your perfect trainer"
            description="Answer 4 quick questions. We'll match you with verified trainers who fit your goals, budget, and preferences."
          />

          {/* Progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Question {step + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-700/50">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Surface className="mt-8 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">{currentQuestion.question}</h2>
            </div>

            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-surface-high/50 px-5 py-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                >
                  <span className="font-medium text-white">{option.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>
          </Surface>
        </div>
      </PageContainer>
    </PageShell>
  );
}
